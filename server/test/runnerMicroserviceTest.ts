import assert from 'assert';
import http from 'http';
import express from 'express';
import { createRunnerServer } from '../src/execution/runnerServer.js';
import { IsolatedExecutionWorker } from '../src/execution/isolatedWorker.js';
import { TestCase } from '../src/types/shared.js';

const TEST_PORT = 5055;
const TEST_SECRET = 'clutch_runner_secret_phase9_test_token';

async function runRunnerMicroserviceSuite() {
  console.log('========================================================================');
  console.log('🛡️  CLUTCH PHASE 9: RUNNER MICROSERVICE ARCHITECTURE INTEGRATION TEST');
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

  // 1. Boot Runner Server
  process.env.RUNNER_SERVICE_SECRET = TEST_SECRET;
  process.env.RUNNER_PORT = String(TEST_PORT);
  const runnerServer = createRunnerServer();

  await new Promise<void>((resolve, reject) => {
    runnerServer.listen(TEST_PORT, () => resolve());
    runnerServer.on('error', reject);
  });
  console.log(`[Test Setup] Runner microservice online on port ${TEST_PORT}.\n`);

  try {
    // Test 1: Healthcheck
    await testStep('1. Runner Microservice Health Probe (GET /health)', async () => {
      const res = await fetch(`http://localhost:${TEST_PORT}/health`);
      assert.strictEqual(res.status, 200);
      const data: any = await res.json();
      assert.strictEqual(data.status, 'healthy');
      assert.strictEqual(data.service, 'clutch-runner-microservice');
      console.log(`     - Healthcheck responded with: ${JSON.stringify(data)}`);
    });

    // Test 2: Authentication Enforcement
    await testStep('2. Service-to-Service Secret Authentication Enforcement', async () => {
      // 2a. Request with invalid secret
      const unauthRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer wrong_invalid_secret_token'
        },
        body: JSON.stringify({
          language: 'python',
          code: 'print("hello")',
          testCases: []
        })
      });
      assert.strictEqual(unauthRes.status, 401, 'Unauthorized request must return HTTP 401');

      // 2b. Request without secret
      const noAuthRes = await fetch(`http://localhost:${TEST_PORT}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'python',
          code: 'print("hello")',
          testCases: []
        })
      });
      assert.strictEqual(noAuthRes.status, 401, 'Request without secret must return HTTP 401');
      console.log('     - Both unauthenticated and wrong-secret requests rejected with HTTP 401.');
    });

    // Test 3: End-to-End Microservice Dispatch via IsolatedExecutionWorker
    await testStep('3. End-to-End Microservice Dispatch: Valid Python Kadane Solution', async () => {
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
      console.log(`     - Verified isolation boundary: [${result.isolationBoundary}]`);
      console.log(`     - All 3 test cases passed through runner microservice.`);
    });

    // Test 4: End-to-End Microservice Dispatch: Valid JavaScript Solution
    await testStep('4. End-to-End Microservice Dispatch: Valid JavaScript Solution', async () => {
      const worker = new IsolatedExecutionWorker();
      assert.strictEqual(worker.getIsolationStatus().mode, 'isolated_microservice');

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
      assert.strictEqual(result.isolationBoundary, 'isolated_microservice');
      console.log(`     - JavaScript Kadane passed through microservice (${result.passedTests}/${result.totalTests} tests).`);
    });

    // Test 5: Payload Ceiling & Bounds Checking
    await testStep('5. Security: Maximum Payload Size Limit Enforcement (64KB ceiling)', async () => {
      const worker = new IsolatedExecutionWorker();
      const oversizedCode = '# ' + 'A'.repeat(70 * 1024); // 70KB code

      const result = await worker.executeSubmission('python', oversizedCode, [
        { id: 'tc1', input: '[1]', expectedOutput: '1' }
      ]);

      assert.strictEqual(result.allPassed, false);
      assert.strictEqual(result.overallStatus, 'SECURITY_VIOLATION');
      assert.ok(
        result.testResults[0].error?.includes('64KB') ||
        result.testResults[0].error?.includes('maximum code size'),
        `Expected error to mention 64KB limit, got: ${result.testResults[0].error}`
      );
      console.log('     - Oversized 70KB code submission rejected before dispatch.');
    });

    // Test 6: Resilient Timeout & Safe Fallback when Service Unreachable
    await testStep('6. Fault Tolerance: Graceful Error Handling when Runner Service Down', async () => {
      process.env.RUNNER_SERVICE_URL = 'http://localhost:59999'; // unreachable port
      const worker = new IsolatedExecutionWorker();

      const result = await worker.executeSubmission('python', 'print(1)', [
        { id: 'tc1', input: '1', expectedOutput: '1' }
      ]);

      assert.strictEqual(result.allPassed, false);
      assert.strictEqual(result.overallStatus, 'SERVICE_UNAVAILABLE');
      assert.ok(result.testResults[0].error?.includes('communication error'));
      console.log('     - Correctly handled unreachable microservice with safe SERVICE_UNAVAILABLE status.');
    });

    // Test 7: Public API Route (/api/run-code) Microservice Dispatch & Provenance Verification
    await testStep('7. API Route (/api/run-code) Microservice Dispatch & Provenance Verification', async () => {
      process.env.RUNNER_SERVICE_URL = `http://localhost:${TEST_PORT}`;
      process.env.RUNNER_SERVICE_SECRET = TEST_SECRET;

      // Ephemeral test API app with the exact /api/run-code route logic
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

      const API_PORT = 5056;
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
        assert.ok(data.executionNumber >= 1, 'Should have positive execution number');

        // Confirm from the runner microservice /health probe that execution occurred on microservice
        const healthRes = await fetch(`http://localhost:${TEST_PORT}/health`);
        const healthData: any = await healthRes.json();
        assert.ok(healthData.totalExecutions >= 1, 'Runner totalExecutions must be recorded');
        console.log(`     - API response confirmed execution provenance: executedBy=${data.executedBy}, execution #${data.executionNumber}`);
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
  console.log(`🏁 RUNNER MICROSERVICE TEST RESULTS: ${passed}/${total} passed.`);
  console.log('========================================================================\n');

  if (passed < total) {
    process.exit(1);
  }
}

runRunnerMicroserviceSuite().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
