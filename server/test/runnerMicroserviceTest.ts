import assert from 'assert';
import http from 'http';
import express from 'express';
import { createRunnerServer } from '../src/execution/runnerServer.js';
import { IsolatedExecutionWorker } from '../src/execution/isolatedWorker.js';
import { TestCase } from '../src/types/shared.js';
import { validateProductionEnvironment, isWeakOrBannedSecret } from '../src/config/securityConfig.js';

const TEST_PORT = 5055;
// Fresh high-entropy 64-character token (not in any banned default list)
const TEST_SECRET = 'e4a2b9f871c356d0e123456789abcdef0123456789abcdef0123456789abcdef';

async function runRunnerMicroserviceSuite() {
  console.log('========================================================================');
  console.log('🛡️  CLUTCH PHASE 9.1: HARDENED RUNNER MICROSERVICE REGRESSION TEST');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  async function testStep(name: string, fn: () => Promise<void>) {
    total++;
    try {
      const start = Date.now();
      await fn();
      const elapsed = Date.now() - start;
      console.log(`  ✅ [PASS] ${name} (${elapsed}ms)`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // Test 1: Production Secrets Validation & Fail-Closed Startup
  await testStep('1. Production Secrets: Fail-Closed Validation on Banned & Weak Defaults', async () => {
    // 1a. Verify banned default secret detection
    const bannedSecret = 'clutch_runner_production_secret_key_2026';
    const checkBanned = isWeakOrBannedSecret(bannedSecret, 32);
    assert.strictEqual(checkBanned.weak, true, 'Known default credential must be marked weak');

    // 1b. Verify short secret detection
    const shortSecret = 'too_short';
    const checkShort = isWeakOrBannedSecret(shortSecret, 32);
    assert.strictEqual(checkShort.weak, true, 'Short credential (<32 chars) must be marked weak');

    // 1c. Verify high-entropy secret passes
    const checkValid = isWeakOrBannedSecret(TEST_SECRET, 32);
    assert.strictEqual(checkValid.weak, false, 'High entropy 64-char secret must pass');

    // 1d. Verify production environment fail-closed exception
    const oldEnv = process.env.NODE_ENV;
    const oldSecret = process.env.RUNNER_SERVICE_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      process.env.RUNNER_SERVICE_SECRET = 'clutch_runner_production_secret_key_2026'; // banned
      assert.throws(() => {
        validateProductionEnvironment('runner');
      }, /Production startup aborted/, 'Must throw fatal error on banned production secret');
    } finally {
      process.env.NODE_ENV = oldEnv;
      process.env.RUNNER_SERVICE_SECRET = oldSecret;
    }
    console.log('     - Verified fail-closed startup when production secrets are default or weak.');
  });

  // Boot Runner Server for API integration tests
  process.env.RUNNER_SERVICE_SECRET = TEST_SECRET;
  process.env.RUNNER_PORT = String(TEST_PORT);
  const runnerServer = createRunnerServer();

  await new Promise<void>((resolve, reject) => {
    runnerServer.listen(TEST_PORT, () => resolve());
    runnerServer.on('error', reject);
  });
  console.log(`\n[Test Setup] Runner microservice online on port ${TEST_PORT}.\n`);

  try {
    // Test 2: Healthcheck Probe
    await testStep('2. Runner Microservice Health Probe (GET /health)', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/health`);
      assert.strictEqual(res.status, 200);
      const data: any = await res.json();
      assert.strictEqual(data.status, 'healthy');
      assert.strictEqual(data.service, 'clutch-runner-microservice');
      assert.strictEqual(typeof data.activeExecutions, 'number');
      assert.strictEqual(typeof data.queuedExecutions, 'number');
      console.log(`     - Health probe returned: ${JSON.stringify(data)}`);
    });

    // Test 3: Strict RFC 6750 Bearer Authentication Enforcement
    await testStep('3. Strict RFC 6750 Bearer Authentication Enforcement & Header Rejection', async () => {
      // 3a. Missing Authorization header
      const noAuthRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'python', code: 'print(1)', testCases: [] })
      });
      assert.strictEqual(noAuthRes.status, 401, 'Request without Authorization header must return HTTP 401');

      // 3b. Wrong secret token
      const wrongAuthRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer wrong_random_unauthorized_token_value_here'
        },
        body: JSON.stringify({ language: 'python', code: 'print(1)', testCases: [] })
      });
      assert.strictEqual(wrongAuthRes.status, 401, 'Request with incorrect secret must return HTTP 401');

      // 3c. Malformed scheme (Basic instead of Bearer)
      const basicAuthRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${TEST_SECRET}`
        },
        body: JSON.stringify({ language: 'python', code: 'print(1)', testCases: [] })
      });
      assert.strictEqual(basicAuthRes.status, 401, 'Non-Bearer authorization scheme must return HTTP 401');

      // 3d. Deprecated secondary header X-Runner-Secret alone must be rejected
      const secondaryHeaderRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Runner-Secret': TEST_SECRET
        },
        body: JSON.stringify({ language: 'python', code: 'print(1)', testCases: [] })
      });
      assert.strictEqual(secondaryHeaderRes.status, 401, 'Bypass attempt without Bearer Authorization must return HTTP 401');
      console.log('     - All unauthorized, malformed, and non-canonical requests rejected with HTTP 401.');
    });

    // Test 4: Payload Body Size & Content-Length Header Bounds
    await testStep('4. Early Rejection: Content-Length & Streaming Request Size Ceiling (128KB)', async () => {
      // Streamed payload exceeding 128KB ceiling (130KB)
      const oversizedPayload = JSON.stringify({
        language: 'python',
        code: '# ' + 'X'.repeat(130 * 1024), // 130KB payload
        testCases: []
      });
      const streamRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_SECRET}`
        },
        body: oversizedPayload
      });
      assert.strictEqual(streamRes.status, 413, 'Streamed body exceeding 128KB must return HTTP 413');
      const data: any = await streamRes.json();
      assert.ok(data.error?.includes('Payload Too Large') || data.error?.includes('128KB'));
      console.log('     - Oversized 130KB payload correctly rejected with HTTP 413.');
    });

    // Test 5: Malformed JSON & Missing Parameter Validation
    await testStep('5. Request Validation: Malformed JSON and Missing Required Parameters', async () => {
      // 5a. Invalid JSON syntax
      const malformedRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_SECRET}`
        },
        body: '{ not_valid_json: true '
      });
      assert.strictEqual(malformedRes.status, 400, 'Invalid JSON must return HTTP 400');

      // 5b. Missing required parameters
      const missingParamRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_SECRET}`
        },
        body: JSON.stringify({ language: 'python' }) // Missing code and testCases
      });
      assert.strictEqual(missingParamRes.status, 400, 'Missing parameters must return HTTP 400');
      console.log('     - Malformed JSON and incomplete requests correctly rejected with HTTP 400.');
    });

    // Test 6: Python Kadane Microservice Execution
    await testStep('6. End-to-End Microservice Dispatch: Valid Python Kadane Solution', async () => {
      process.env.RUNNER_SERVICE_URL = `http://localhost:${TEST_PORT}`;
      process.env.RUNNER_SERVICE_SECRET = TEST_SECRET;

      const worker = new IsolatedExecutionWorker();
      assert.strictEqual(worker.getIsolationStatus().mode, 'isolated_microservice');

      const kadanePython = `
def max_sub_array(nums):
    max_sum = nums[0]
    curr_sum = nums[0]
    for x in nums[1:]:
        curr_sum = max(x, curr_sum + x)
        max_sum = max(max_sum, curr_sum)
    return max_sum
`;

      const testCases: TestCase[] = [
        { id: 'tc1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
        { id: 'tc2', input: '[1]', expectedOutput: '1', isHidden: false },
        { id: 'tc3', input: '[5,4,-1,7,8]', expectedOutput: '23', isHidden: true }
      ];

      const result = await worker.executeSubmission('python', kadanePython, testCases);
      assert.strictEqual(result.allPassed, true, `All test cases must pass: ${JSON.stringify(result)}`);
      assert.strictEqual(result.passedTests, 3);
      assert.strictEqual(result.isolationBoundary, 'isolated_microservice');
      assert.strictEqual(result.executedBy, 'clutch-runner-microservice');
      console.log(`     - Verified execution provenance: [${result.executedBy}] execution #${result.executionNumber}`);
    });

    // Test 7: JavaScript Kadane Microservice Execution
    await testStep('7. End-to-End Microservice Dispatch: Valid JavaScript Kadane Solution', async () => {
      const worker = new IsolatedExecutionWorker();
      const jsSolution = `
function maxSubArray(nums) {
  let max = nums[0], curr = nums[0];
  for (let i = 1; i < nums.length; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    max = Math.max(max, curr);
  }
  return max;
}
`;

      const testCases: TestCase[] = [
        { id: 'tc1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
        { id: 'tc2', input: '[1]', expectedOutput: '1', isHidden: false }
      ];

      const result = await worker.executeSubmission('javascript', jsSolution, testCases);
      assert.strictEqual(result.allPassed, true);
      assert.strictEqual(result.executedBy, 'clutch-runner-microservice');
      console.log(`     - JavaScript Kadane passed through microservice (${result.passedTests}/${result.totalTests} tests).`);
    });

    // Test 8: Wall-Clock Timeout Handling (Infinite Loop Defense)
    await testStep('8. Execution Bounds: Hard Wall-Clock Timeout Enforcement (Infinite Loop Defense)', async () => {
      const worker = new IsolatedExecutionWorker();
      const infiniteLoopCode = `
def max_sub_array(nums):
    while True:
        pass
    return 0
`;
      const result = await worker.executeSubmission('python', infiniteLoopCode, [
        { id: 'tc1', input: '[1]', expectedOutput: '1' }
      ]);

      assert.strictEqual(result.allPassed, false);
      const tcRes = result.testResults[0];
      assert.ok(
        tcRes.status === 'TIME_LIMIT_EXCEEDED' || tcRes.error?.includes('timed out') || tcRes.error?.includes('timeout'),
        `Expected timeout error, received: ${tcRes.error}`
      );
      console.log('     - Infinite loop safely terminated by timeout watchdog without crashing runner.');
    });

    // Test 9: Adversarial Security Traversal & Code Scanner Defense
    await testStep('9. Adversarial Protection: Filesystem Traversal & Subprocess Denial', async () => {
      const worker = new IsolatedExecutionWorker();
      const maliciousCode = `
import os
def max_sub_array(nums):
    os.system('ls /')
    return 0
`;
      const result = await worker.executeSubmission('python', maliciousCode, [
        { id: 'tc1', input: '[1]', expectedOutput: '0' }
      ]);

      assert.strictEqual(result.allPassed, false);
      assert.strictEqual(result.overallStatus, 'SECURITY_VIOLATION');
      console.log('     - Filesystem and process execution attempts denied with SECURITY_VIOLATION.');
    });

    // Test 10: Fault Tolerance on Runner Service Down
    await testStep('10. Fault Tolerance: Graceful Degradation when Runner Service Down', async () => {
      process.env.RUNNER_SERVICE_URL = 'http://localhost:59999'; // unreachable port
      const worker = new IsolatedExecutionWorker();

      const result = await worker.executeSubmission('python', 'print(1)', [
        { id: 'tc1', input: '1', expectedOutput: '1' }
      ]);

      assert.strictEqual(result.allPassed, false);
      assert.strictEqual(result.overallStatus, 'SERVICE_UNAVAILABLE');
      assert.ok(result.testResults[0].error?.includes('communication error'));
      console.log('     - Unreachable runner handled with safe SERVICE_UNAVAILABLE status.');
    });

    // Test 11: Public API Route (/api/run-code) Microservice Dispatch & Provenance
    await testStep('11. API Route (/api/run-code) Microservice Dispatch & Provenance Verification', async () => {
      process.env.RUNNER_SERVICE_URL = `http://localhost:${TEST_PORT}`;
      process.env.RUNNER_SERVICE_SECRET = TEST_SECRET;

      const apiApp = express();
      apiApp.use(express.json());
      const apiWorker = new IsolatedExecutionWorker();
      apiApp.post('/api/run-code', async (req, res) => {
        try {
          const { language, code, testCases } = req.body;
          if (!code || !language) return res.status(400).json({ error: 'Missing code or language' });
          const result = await apiWorker.executeSubmission(language, code, testCases || []);
          return res.json(result);
        } catch (err: any) {
          return res.status(500).json({ error: err.message });
        }
      });

      const API_PORT = 5057;
      const apiHttpServer = http.createServer(apiApp);
      await new Promise<void>((resolve, reject) => {
        apiHttpServer.listen(API_PORT, () => resolve());
        apiHttpServer.on('error', reject);
      });

      try {
        const kadaneCode = `
def max_sub_array(nums):
    max_sum = nums[0]
    curr_sum = nums[0]
    for x in nums[1:]:
        curr_sum = max(x, curr_sum + x)
        max_sum = max(max_sum, curr_sum)
    return max_sum
`;
        const apiRes = await fetch(`http://localhost:${API_PORT}/api/run-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: 'python',
            code: kadaneCode,
            testCases: [
              { id: 'api-tc1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false }
            ]
          })
        });

        assert.strictEqual(apiRes.status, 200);
        const data: any = await apiRes.json();
        assert.strictEqual(data.allPassed, true);
        assert.strictEqual(data.isolationBoundary, 'isolated_microservice');
        assert.strictEqual(data.executedBy, 'clutch-runner-microservice');
        assert.ok(data.executionNumber >= 1);

        const healthRes = await fetch(`http://localhost:${TEST_PORT}/health`);
        const healthData: any = await healthRes.json();
        assert.ok(healthData.totalExecutions >= 1);
        console.log(`     - Provenance confirmed: executedBy=${data.executedBy}, execution #${data.executionNumber}`);
        console.log(`     - Runner microservice confirmed total registered executions=${healthData.totalExecutions}`);
      } finally {
        await new Promise<void>((resolve) => apiHttpServer.close(() => resolve()));
      }
    });

  } finally {
    await new Promise<void>((resolve) => runnerServer.close(() => resolve()));
    console.log('\n[Test Teardown] Runner microservice cleanly shut down.');
  }

  console.log('\n========================================================================');
  console.log(`🏁 RUNNER MICROSERVICE REGRESSION TEST RESULTS: ${passed}/${total} passed.`);
  console.log('========================================================================\n');

  if (passed < total) {
    process.exit(1);
  }
}

runRunnerMicroserviceSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
