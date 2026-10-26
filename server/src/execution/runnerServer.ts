import http from 'http';
import { IsolatedExecutionWorker } from './isolatedWorker.js';
import { TestCase } from '../types/shared.js';
import { 
  validateProductionEnvironment, 
  secureTimingSafeCompare, 
  validateBearerTokenHeader 
} from '../config/securityConfig.js';

const PORT = Number(process.env.RUNNER_PORT) || 5050;
const MAX_PAYLOAD_BYTES = 128 * 1024; // 128KB hard ceiling
const MAX_CONCURRENT_RUNS = 4;
const MAX_QUEUE_DEPTH = 50;

/**
 * CLUTCH Dedicated Runner Microservice Server
 * 
 * Runs as an isolated worker decoupling untrusted execution from the public API:
 * - Public API container does NOT mount Docker daemon socket
 * - Communicates strictly over private internal subnet (no public ingress)
 * - Strict constant-time RFC 6750 Bearer token authentication
 * - Fail-closed startup if RUNNER_SERVICE_SECRET is missing or weak in production
 * - Enforces per-submission isolation, timeouts, memory limits, and bounded concurrency queues
 */
export function createRunnerServer() {
  // Validate production credentials at instantiation
  validateProductionEnvironment('runner');

  let totalExecutionsCount = 0;
  let activeExecutions = 0;
  const executionQueue: Array<() => void> = [];

  // Dedicated execution worker configured in provider mode (does not recurse into RUNNER_SERVICE_URL)
  const runnerWorker = new IsolatedExecutionWorker({
    isRunnerService: true,
    wallClockTimeoutMs: 3000,
    maxMemoryMb: 128,
    maxCpuFraction: 1.0,
    maxPids: 32,
    readOnlyRootFs: true,
    networkDisabled: true,
    unprivilegedUser: '1000:1000'
  });

  const acquireExecutionSlot = async (): Promise<() => void> => {
    if (activeExecutions < MAX_CONCURRENT_RUNS) {
      activeExecutions++;
      return () => releaseExecutionSlot();
    }
    if (executionQueue.length >= MAX_QUEUE_DEPTH) {
      throw new Error('QUEUE_SATURATED');
    }
    return new Promise((resolve) => {
      executionQueue.push(() => {
        activeExecutions++;
        resolve(() => releaseExecutionSlot());
      });
    });
  };

  const releaseExecutionSlot = () => {
    activeExecutions--;
    if (executionQueue.length > 0 && activeExecutions < MAX_CONCURRENT_RUNS) {
      const next = executionQueue.shift();
      if (next) next();
    }
  };

  const server = http.createServer(async (req, res) => {
    // 1. Healthcheck probe
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'healthy',
        service: 'clutch-runner-microservice',
        timestamp: Date.now(),
        uptimeSeconds: Math.floor(process.uptime()),
        totalExecutions: totalExecutionsCount,
        activeExecutions,
        queuedExecutions: executionQueue.length,
        isolationStatus: runnerWorker.getIsolationStatus()
      }));
    }

    // 2. Execution endpoint
    if (req.method === 'POST' && req.url === '/execute') {
      const expectedSecret = process.env.RUNNER_SERVICE_SECRET || '';

      // Fail authentication if no secret is configured on this host
      if (!expectedSecret) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          error: 'Unauthorized: RUNNER_SERVICE_SECRET is not configured on runner host.' 
        }));
      }

      // Strict Bearer token header validation
      const authHeader = req.headers['authorization'];
      const authResult = validateBearerTokenHeader(authHeader);
      if (!authResult.valid || !authResult.token) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          error: `Unauthorized: ${authResult.error || 'Invalid Authorization header'}` 
        }));
      }

      // Constant-time cryptographic comparison
      const isAuthorized = secureTimingSafeCompare(authResult.token, expectedSecret);
      if (!isAuthorized) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Unauthorized: Invalid runner service secret.' }));
      }

      // Early rejection via Content-Length header before buffering payload
      const contentLengthHeader = req.headers['content-length'];
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10);
        if (contentLength > MAX_PAYLOAD_BYTES) {
          res.writeHead(413, { 'Content-Type': 'application/json', 'Connection': 'close' });
          res.end(JSON.stringify({ 
            error: `Payload Too Large: Content-Length ${contentLength} exceeds maximum of ${MAX_PAYLOAD_BYTES} bytes.` 
          }));
          req.resume();
          return;
        }
      }

      // Read payload with hard ceiling
      let body = '';
      let bodySize = 0;
      let limitExceeded = false;

      req.on('data', chunk => {
        if (limitExceeded) return;
        bodySize += chunk.length;
        if (bodySize > MAX_PAYLOAD_BYTES) {
          limitExceeded = true;
          res.writeHead(413, { 'Content-Type': 'application/json', 'Connection': 'close' });
          res.end(JSON.stringify({ error: 'Payload Too Large: Maximum request size is 128KB.' }));
          req.resume();
          return;
        }
        body += chunk;
      });

      req.on('end', async () => {
        if (limitExceeded || res.writableEnded) return;

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
        }

        const { language, code, testCases } = payload;
        if (!language || !code || !Array.isArray(testCases)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing required parameters: language, code, and testCases.' }));
        }

        // Acquire concurrency slot
        let releaseSlot: (() => void) | null = null;
        try {
          releaseSlot = await acquireExecutionSlot();
        } catch (err: any) {
          if (err.message === 'QUEUE_SATURATED') {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
              error: 'Runner service execution capacity saturated. Please retry.' 
            }));
          }
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Internal runner concurrency error.' }));
        }

        try {
          totalExecutionsCount++;
          // Execute untrusted code within per-submission sandbox (container or local restricted)
          const result = await runnerWorker.executeSubmission(language, code, testCases as TestCase[]);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ...result,
            executedBy: 'clutch-runner-microservice',
            executionNumber: totalExecutionsCount
          }));
        } catch (execErr: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            allPassed: false,
            totalTests: testCases.length,
            passedTests: 0,
            testResults: testCases.map((tc: any) => ({
              id: tc.id,
              passed: false,
              error: `Runner service execution failure: ${execErr.message}`
            })),
            overallStatus: 'FAILED',
            isolationBoundary: runnerWorker.getIsolationStatus().mode,
            executedBy: 'clutch-runner-microservice'
          }));
        } finally {
          if (releaseSlot) releaseSlot();
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint not found.' }));
  });

  return server;
}

if (process.argv[1]?.includes('runnerServer')) {
  try {
    const runnerApp = createRunnerServer();
    runnerApp.listen(PORT, () => {
      console.log(`[CLUTCH Runner Microservice] Operational on port ${PORT}`);
    });
  } catch (err: any) {
    console.error(`[CLUTCH Runner Microservice] Failed to start: ${err.message}`);
    process.exit(1);
  }
}
