import assert from 'assert';
import { IsolatedExecutionWorker } from '../src/execution/isolatedWorker.js';
import { TestCase } from '../../shared/types.js';

const sampleTestCases: TestCase[] = [
  { id: 'tc1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
  { id: 'tc2', input: '[1]', expectedOutput: '1', isHidden: false }
];

async function runSandboxSecuritySuite() {
  console.log('========================================================================');
  console.log('🛡️  CLUTCH SANDBOX ISOLATION & WORKER ADVERSARIAL SECURITY SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  async function testCase(name: string, fn: () => Promise<void>) {
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

  const worker = new IsolatedExecutionWorker({
    wallClockTimeoutMs: 2500,
    maxMemoryMb: 128,
    maxPids: 32,
    maxOutputChars: 50000
  });

  // 1. Worker Capabilities Check
  await testCase('1. Worker Capability Inspection: Reports verified isolation boundary', async () => {
    const status = worker.getIsolationStatus();
    assert.ok(status.mode, 'Must report active isolation mode');
    console.log(`     Active Worker Isolation Mode: [${status.mode}], Docker Available: ${status.dockerAvailable}`);
  });

  // 2. Strict Isolation Gating: Disables execution when container sandbox enforced but absent
  await testCase('2. Strict Production Gating: Blocks untrusted execution if container absent', async () => {
    process.env.ENFORCE_CONTAINER_SANDBOX = 'true';
    const strictWorker = new IsolatedExecutionWorker();
    const status = strictWorker.getIsolationStatus();

    if (!status.dockerAvailable) {
      assert.strictEqual(status.mode, 'disabled', 'Must be disabled when container is absent');
      const res = await strictWorker.executeSubmission('python', 'def max_sub_array(nums): return 6', sampleTestCases);
      assert.strictEqual(res.overallStatus, 'SANDBOX_ISOLATION_REQUIRED');
      assert.strictEqual(res.allPassed, false);
      assert.ok(res.testResults[0].error?.includes('Security Boundary Notice'));
    }
    delete process.env.ENFORCE_CONTAINER_SANDBOX;
  });

  // 3. Filesystem Traversal Attempt
  await testCase('3. Adversarial: Intercepts filesystem read attempt on host secrets', async () => {
    const attackCode = `
f = open('.env', 'r')
content = f.read()
def max_sub_array(nums): return 6
`;
    const res = await worker.executeSubmission('python', attackCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'SECURITY_VIOLATION');
    assert.strictEqual(res.allPassed, false);
    assert.ok(res.testResults[0].error?.includes('Security Sandbox Violation'));
  });

  // 4. Subprocess / Fork Spawn Attempt
  await testCase('4. Adversarial: Blocks process spawning / fork bomb attack', async () => {
    const attackCode = `
import subprocess
subprocess.call(['id'])
def max_sub_array(nums): return 6
`;
    const res = await worker.executeSubmission('python', attackCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'SECURITY_VIOLATION');
    assert.strictEqual(res.allPassed, false);
  });

  // 5. Network Access Attempt
  await testCase('5. Adversarial: Blocks network exfiltration attempt via socket/urllib', async () => {
    const attackCode = `
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.connect(('127.0.0.1', 80))
def max_sub_array(nums): return 6
`;
    const res = await worker.executeSubmission('python', attackCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'SECURITY_VIOLATION');
    assert.strictEqual(res.allPassed, false);
  });

  // 6. Infinite Loop Wall-Clock Hard Timeout & Process Cleanup
  await testCase('6. Adversarial: Enforces hard wall-clock timeout on infinite CPU loop', async () => {
    const infiniteCode = `
def max_sub_array(nums):
    while True:
        pass
    return 6
`;
    const res = await worker.executeSubmission('python', infiniteCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'TIME_LIMIT_EXCEEDED');
    assert.strictEqual(res.allPassed, false);
  });

  // 7. Node.js V8 Heap Memory Exhaustion Attempt
  await testCase('7. Adversarial: Catches Node.js heap memory exhaustion safely', async () => {
    const memAttackCode = `
function maxSubArray(nums) {
  const big = [];
  while (true) {
    big.push(new Array(1000000).fill('MEM_EXHAUSTION'));
  }
  return 6;
}
`;
    const res = await worker.executeSubmission('javascript', memAttackCode, sampleTestCases);
    assert.strictEqual(res.allPassed, false);
    assert.ok(res.overallStatus === 'RUNTIME_ERROR' || res.overallStatus === 'TIME_LIMIT_EXCEEDED');
  });

  // 8. Legitimate Execution: Valid Kadane Python solution passes
  await testCase('8. Valid Code: Executes Kadane Python solution accurately', async () => {
    const validPython = `
def max_sub_array(nums):
    max_sum = nums[0]
    current_sum = 0
    for x in nums:
        current_sum = max(x, current_sum + x)
        max_sum = max(max_sum, current_sum)
    return max_sum
`;
    const res = await worker.executeSubmission('python', validPython, sampleTestCases);
    assert.strictEqual(res.allPassed, true);
    assert.strictEqual(res.overallStatus, 'ACCEPTED');
  });

  // 9. Legitimate Execution: Valid Kadane JavaScript solution passes
  await testCase('9. Valid Code: Executes Kadane JavaScript solution accurately', async () => {
    const validJs = `
function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = 0;
  for (let x of nums) {
    currentSum = Math.max(x, currentSum + x);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}
`;
    const res = await worker.executeSubmission('javascript', validJs, sampleTestCases);
    assert.strictEqual(res.allPassed, true);
    assert.strictEqual(res.overallStatus, 'ACCEPTED');
  });

  console.log(`\n========================================================================`);
  console.log(`🎯 SANDBOX SECURITY SUITE RESULTS: ${passed}/${total} security tests passed.`);
  console.log(`========================================================================\n`);

  if (passed < total) process.exit(1);
}

runSandboxSecuritySuite().catch(err => {
  console.error('Fatal sandbox security test error:', err);
  process.exit(1);
});
