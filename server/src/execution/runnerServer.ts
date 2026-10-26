import http from 'http';
import { executeCodeInIsolatedSandbox } from './codeRunner.js';
import { TestCase } from '../types/shared.js';

const PORT = Number(process.env.RUNNER_PORT) || 5050;
const RUNNER_SECRET = process.env.RUNNER_SERVICE_SECRET || '';

/**
 * CLUTCH Dedicated Runner Microservice Server
 * 
 * Runs as an isolated worker decoupling untrusted execution from the public API:
 * - Public API container does NOT mount Docker daemon socket
 * - Communicates strictly over private internal subnet
 * - Authenticates requests via Bearer secret
 * - Enforces timeouts and memory limits
 */
export function createRunnerServer() {
  let totalExecutionsCount = 0;

  const server = http.createServer(async (req, res) => {
    // 1. Healthcheck probe
    if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        status: 'healthy',
        service: 'clutch-runner-microservice',
        timestamp: Date.now(),
        uptimeSeconds: Math.floor(process.uptime()),
        totalExecutions: totalExecutionsCount
      }));
    }

    // 2. Execution endpoint
    if (req.method === 'POST' && req.url === '/execute') {
      // Validate service secret if configured
      const expectedSecret = process.env.RUNNER_SERVICE_SECRET || '';
      if (expectedSecret) {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const headerSecret = req.headers['x-runner-secret'];
        if (token !== expectedSecret && headerSecret !== expectedSecret) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Unauthorized: Invalid runner service secret.' }));
        }
      }

      // Read payload with hard ceiling (128KB max)
      let body = '';
      let bodySize = 0;
      const MAX_PAYLOAD_BYTES = 128 * 1024;

      req.on('data', chunk => {
        bodySize += chunk.length;
        if (bodySize > MAX_PAYLOAD_BYTES) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Payload Too Large: Maximum request size is 128KB.' }));
          req.destroy();
          return;
        }
        body += chunk;
      });

      req.on('end', async () => {
        if (res.writableEnded) return;

        let payload: any;
        try {
          payload = JSON.parse(body);
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
        }

        const { language, code, testCases } = payload;
        if (!language || !code || !Array.isArray(testCases)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Missing required parameters: language, code, and testCases.' }));
        }

        try {
          totalExecutionsCount++;
          const result = await executeCodeInIsolatedSandbox(language, code, testCases as TestCase[]);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ...result,
            isolationBoundary: 'isolated_microservice',
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
            isolationBoundary: 'isolated_microservice'
          }));
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
  const runnerApp = createRunnerServer();
  runnerApp.listen(PORT, () => {
    console.log(`[CLUTCH Runner Microservice] Operational on port ${PORT}`);
  });
}
