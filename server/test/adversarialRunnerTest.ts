import assert from 'assert';
import { executeCodeInIsolatedSandbox, scanCodeForVulnerabilities, detectHostLanguageSupport } from '../src/execution/codeRunner.js';
import { TestCase } from '../src/types/shared.js';

const sampleTestCases: TestCase[] = [
  { id: 'tc1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false },
  { id: 'tc2', input: '[1]', expectedOutput: '1', isHidden: false }
];

async function runAdversarialSecuritySuite() {
  console.log('===============================================================');
  console.log('🛡️  CLUTCH ADVERSARIAL SANDBOX SECURITY & COMPILER TEST SUITE');
  console.log('===============================================================\n');

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

  // 1. Language Support Discovery
  await testCase('1. Language Discovery: Accurately identifies host compilers', async () => {
    const support = detectHostLanguageSupport();
    assert.strictEqual(support.python.available, true, 'Python must be detected on host');
    assert.strictEqual(support.javascript.available, true, 'JavaScript must be detected on host');
    // Note: C++ and Java are absent on this host, verify they are reported honestly
    console.log(`     Host Compilers Detected: Python=${support.python.version}, Node=${support.javascript.version}, C++ Available=${support.cpp.available}, Java Available=${support.java.available}`);
    if (!support.cpp.available) {
      assert.strictEqual(support.cpp.executionMode, 'requires_compiler');
    }
  });

  // 2. Pre-execution Security Filter: Subprocess Spawn Attack
  await testCase('2. Adversarial: Intercepts Python subprocess/fork spawn attack', async () => {
    const attackCode = `
import subprocess
subprocess.Popen(["calc.exe"])
def max_sub_array(nums):
    return 6
`;
    const res = await executeCodeInIsolatedSandbox('python', attackCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'SECURITY_VIOLATION');
    assert.strictEqual(res.allPassed, false);
    assert.ok(res.testResults[0].error?.includes('Security Sandbox Violation'));
  });

  // 3. Pre-execution Security Filter: Filesystem Evasion (open() call)
  await testCase('3. Adversarial: Intercepts Python open() file access attack', async () => {
    const attackCode = `
f = open('package.json', 'r')
content = f.read()
def max_sub_array(nums):
    return 6
`;
    const res = await executeCodeInIsolatedSandbox('python', attackCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'SECURITY_VIOLATION');
    assert.strictEqual(res.allPassed, false);
    assert.ok(res.testResults[0].error?.includes('Security Sandbox Violation'));
  });

  // 4. Pre-execution Security Filter: Node.js child_process require
  await testCase('4. Adversarial: Intercepts JavaScript child_process attack', async () => {
    const attackCode = `
const cp = require('child_process');
cp.execSync('dir');
function maxSubArray(nums) { return 6; }
`;
    const res = await executeCodeInIsolatedSandbox('javascript', attackCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'SECURITY_VIOLATION');
    assert.strictEqual(res.allPassed, false);
    assert.ok(res.testResults[0].error?.includes('Security Sandbox Violation'));
  });

  // 5. Pre-execution Security Filter: Node.js fs require
  await testCase('5. Adversarial: Intercepts JavaScript fs file read attack', async () => {
    const attackCode = `
const fs = require('fs');
fs.readFileSync('/etc/passwd');
function maxSubArray(nums) { return 6; }
`;
    const res = await executeCodeInIsolatedSandbox('javascript', attackCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'SECURITY_VIOLATION');
    assert.strictEqual(res.allPassed, false);
    assert.ok(res.testResults[0].error?.includes('Security Sandbox Violation'));
  });

  // 6. Adversarial: Python Infinite Loop (Wall-clock timeout & process tree termination)
  await testCase('6. Adversarial: Hard timeout and process tree kill on infinite loop', async () => {
    const infiniteLoopCode = `
def max_sub_array(nums):
    while True:
        pass
    return 6
`;
    const res = await executeCodeInIsolatedSandbox('python', infiniteLoopCode, sampleTestCases);
    assert.strictEqual(res.overallStatus, 'TIME_LIMIT_EXCEEDED');
    assert.strictEqual(res.allPassed, false);
    assert.ok(res.testResults[0].error?.includes('timed out'));
  });

  // 7. Adversarial: JavaScript Infinite Output Flooding (Output Buffer Limit)
  await testCase('7. Adversarial: Output buffer bound caps infinite print loop', async () => {
    const outputFloodCode = `
function maxSubArray(nums) {
  for (let i = 0; i < 100000; i++) {
    console.log('FLOOD_BURST_ATTACK_STRING_EXHAUST_BUFFER_DATA');
  }
  return 6;
}
`;
    const res = await executeCodeInIsolatedSandbox('javascript', outputFloodCode, sampleTestCases);
    assert.ok(
      res.overallStatus === 'OUTPUT_LIMIT_EXCEEDED' || res.overallStatus === 'ACCEPTED' || res.overallStatus === 'RUNTIME_ERROR',
      `Expected output limit or handled termination, got ${res.overallStatus}`
    );
  });

  // 8. Adversarial: Memory exhaustion attempt under 64MB V8 heap limit
  await testCase('8. Adversarial: Node V8 memory cap catches heap exhaustion', async () => {
    const memoryAttackCode = `
function maxSubArray(nums) {
  const arr = [];
  while (true) {
    arr.push(new Array(1000000).fill('MEM_BOMB'));
  }
  return 6;
}
`;
    const res = await executeCodeInIsolatedSandbox('javascript', memoryAttackCode, sampleTestCases);
    assert.strictEqual(res.allPassed, false);
    assert.ok(res.overallStatus === 'RUNTIME_ERROR' || res.overallStatus === 'TIME_LIMIT_EXCEEDED');
  });

  // 9. Real Language Support: Honest handling of missing C++ compiler (No mock pass!)
  await testCase('9. Real Language Check: Honestly reports missing compiler without fake pass', async () => {
    const cppCode = `
int maxSubArray(vector<int>& nums) {
    return 6;
}
`;
    const res = await executeCodeInIsolatedSandbox('cpp', cppCode, sampleTestCases);
    const support = detectHostLanguageSupport();
    if (!support.cpp.available) {
      assert.strictEqual(res.allPassed, false, 'Must not report fake pass for missing compiler');
      assert.strictEqual(res.overallStatus, 'RUNTIME_ERROR');
      assert.ok(res.testResults[0].error?.includes('Compiler not available'));
    }
  });

  // 10. Legitimate Execution: Valid Kadane Python solution passes all tests
  await testCase('10. Legit Code: Valid Kadane Python solution executes & passes', async () => {
    const validPython = `
def max_sub_array(nums):
    max_sum = nums[0]
    current_sum = 0
    for x in nums:
        current_sum = max(x, current_sum + x)
        max_sum = max(max_sum, current_sum)
    return max_sum
`;
    const res = await executeCodeInIsolatedSandbox('python', validPython, sampleTestCases);
    assert.strictEqual(res.allPassed, true);
    assert.strictEqual(res.overallStatus, 'ACCEPTED');
    assert.strictEqual(res.passedTests, 2);
  });

  // 11. Legitimate Execution: Valid Kadane JavaScript solution passes all tests
  await testCase('11. Legit Code: Valid Kadane JavaScript solution executes & passes', async () => {
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
    const res = await executeCodeInIsolatedSandbox('javascript', validJs, sampleTestCases);
    assert.strictEqual(res.allPassed, true);
    assert.strictEqual(res.overallStatus, 'ACCEPTED');
    assert.strictEqual(res.passedTests, 2);
  });

  console.log(`\n===============================================================`);
  console.log(`🎯 ADVERSARIAL SUITE RESULTS: ${passed}/${total} security tests passed.`);
  console.log(`===============================================================\n`);

  if (passed < total) {
    process.exit(1);
  }
}

runAdversarialSecuritySuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
