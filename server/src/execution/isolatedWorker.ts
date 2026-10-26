import { spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { TestCase } from '../types/shared.js';
import { killProcessTree, scanCodeForVulnerabilities } from './codeRunner.js';

export type IsolationMode = 'docker_container' | 'isolated_microservice' | 'local_restricted_process' | 'disabled';

export interface SandboxExecutionConfig {
  maxMemoryMb: number; // default 128
  maxCpuFraction: number; // default 1.0
  maxPids: number; // default 32
  wallClockTimeoutMs: number; // default 3000
  compileTimeoutMs: number; // default 5000
  maxOutputChars: number; // default 50000
  readOnlyRootFs: boolean;
  networkDisabled: boolean;
  unprivilegedUser: string; // e.g. '1000:1000' or 'nobody'
}

export const DEFAULT_SANDBOX_CONFIG: SandboxExecutionConfig = {
  maxMemoryMb: 128,
  maxCpuFraction: 1.0,
  maxPids: 32,
  wallClockTimeoutMs: 3000,
  compileTimeoutMs: 5000,
  maxOutputChars: 50000,
  readOnlyRootFs: true,
  networkDisabled: true,
  unprivilegedUser: '1000:1000'
};

/**
 * Isolated Execution Worker
 * Decouples untrusted code execution from the main API process security boundary.
 *
 * In Production:
 * - Requires container isolation (Docker container runtime or isolated worker microservice).
 * - Enforces: unprivileged user, read-only root, no network, tmpfs tempdir, dropped capabilities, cgroup bounds.
 * - If container runtime is absent and ENFORCE_CONTAINER_SANDBOX is true (or NODE_ENV=production),
 *   execution is SAFELY DISABLED with an authoritative security notice rather than exposing host.
 */
export class IsolatedExecutionWorker {
  private mode: IsolationMode;
  private dockerAvailable: boolean = false;
  private config: SandboxExecutionConfig;

  constructor(customConfig?: Partial<SandboxExecutionConfig>) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...(customConfig || {}) };
    this.mode = this.detectIsolationCapabilities();
  }

  private detectIsolationCapabilities(): IsolationMode {
    // 1. Check if external runner microservice configured
    if (process.env.JUDGE0_API_URL || process.env.RUNNER_SERVICE_URL) {
      return 'isolated_microservice';
    }

    // 2. Check if Docker is available on host
    try {
      const dockerCheck = spawnSync('docker', ['version', '--format', '{{.Server.Version}}'], {
        encoding: 'utf-8',
        timeout: 2000
      });
      if (dockerCheck.status === 0 && dockerCheck.stdout && dockerCheck.stdout.trim().length > 0) {
        this.dockerAvailable = true;
        return 'docker_container';
      }
    } catch {
      this.dockerAvailable = false;
    }

    // 3. If in production and container sandbox is strictly required, disable execution
    const enforceContainer = process.env.ENFORCE_CONTAINER_SANDBOX === 'true' || 
      (process.env.NODE_ENV === 'production' && !process.env.ALLOW_LOCAL_SUBPROCESS_SANDBOX);

    if (enforceContainer && !this.dockerAvailable) {
      console.warn('[Security] Container sandbox not detected. Public untrusted code execution is disabled for safety.');
      return 'disabled';
    }

    // 4. Development mode: restricted subprocess sandbox with process tree isolation and resource limits
    return 'local_restricted_process';
  }

  public getIsolationStatus() {
    return {
      mode: this.mode,
      dockerAvailable: this.dockerAvailable,
      enforced: process.env.ENFORCE_CONTAINER_SANDBOX === 'true',
      config: {
        maxMemoryMb: this.config.maxMemoryMb,
        maxPids: this.config.maxPids,
        networkDisabled: this.config.networkDisabled,
        readOnlyRootFs: this.config.readOnlyRootFs,
        wallClockTimeoutMs: this.config.wallClockTimeoutMs
      }
    };
  }

  /**
   * Execute untrusted code within verified isolation boundary
   */
  public async executeSubmission(
    language: 'python' | 'javascript' | 'cpp' | 'java',
    code: string,
    testCases: TestCase[]
  ): Promise<{
    allPassed: boolean;
    totalTests: number;
    passedTests: number;
    testResults: any[];
    overallStatus: string;
    isolationBoundary: IsolationMode;
  }> {
    // Defense-in-depth static scan
    const scan = scanCodeForVulnerabilities(language, code);
    if (!scan.safe) {
      return {
        allPassed: false,
        totalTests: testCases.length,
        passedTests: 0,
        testResults: testCases.map(tc => ({
          id: tc.id,
          passed: false,
          error: scan.reason,
          status: 'SECURITY_VIOLATION'
        })),
        overallStatus: 'SECURITY_VIOLATION',
        isolationBoundary: this.mode
      };
    }

    // If strong isolation required but unavailable: refuse to run untrusted code in host context!
    if (this.mode === 'disabled') {
      const msg = 'Security Boundary Notice: Container-level sandbox isolation (Docker/microservice) is required for public untrusted code execution. Execution is currently disabled on this node for host protection.';
      return {
        allPassed: false,
        totalTests: testCases.length,
        passedTests: 0,
        testResults: testCases.map(tc => ({
          id: tc.id,
          passed: false,
          error: msg,
          status: 'SANDBOX_ISOLATION_REQUIRED'
        })),
        overallStatus: 'SANDBOX_ISOLATION_REQUIRED',
        isolationBoundary: 'disabled'
      };
    }

    // If Docker container isolation available, run in unprivileged container
    if (this.mode === 'docker_container') {
      return await this.executeInDockerSandbox(language, code, testCases);
    }

    // Local restricted process execution (dev / test environment)
    return await this.executeInLocalRestrictedSandbox(language, code, testCases);
  }

  /**
   * Docker unprivileged container isolation engine
   * Runs submitted program in ephemeral container with:
   * --user 1000:1000
   * --network none
   * --read-only rootfs
   * --tmpfs /tmp:rw,noexec,nosuid,size=64m
   * --cap-drop ALL
   * --memory 128m
   * --pids-limit 32
   */
  private async executeInDockerSandbox(
    language: 'python' | 'javascript' | 'cpp' | 'java',
    code: string,
    testCases: TestCase[]
  ): Promise<any> {
    const runId = uuidv4();
    const results: any[] = [];
    let allPassed = true;
    let overallStatus = 'ACCEPTED';

    for (const tc of testCases) {
      const singleRes = await this.runSingleDockerTestCase(language, code, tc.input, tc.expectedOutput, runId);
      if (!singleRes.passed) {
        allPassed = false;
        if (overallStatus === 'ACCEPTED') overallStatus = singleRes.status;
      }
      results.push({
        id: tc.id,
        passed: singleRes.passed,
        actualOutput: singleRes.actualOutput,
        expectedOutput: tc.isHidden ? '*** Hidden ***' : tc.expectedOutput,
        error: singleRes.error,
        status: singleRes.status
      });
    }

    return {
      allPassed,
      totalTests: testCases.length,
      passedTests: results.filter(r => r.passed).length,
      testResults: results,
      overallStatus,
      isolationBoundary: 'docker_container'
    };
  }

  private async runSingleDockerTestCase(
    language: string,
    code: string,
    input: string,
    expectedOutput: string,
    runId: string
  ): Promise<any> {
    // Ephemeral payload file
    const hostTmp = path.join(os.tmpdir(), `clutch-docker-${runId}`);
    fs.mkdirSync(hostTmp, { recursive: true });
    try {
      const imageName = process.env.RUNNER_DOCKER_IMAGE || 'clutch-sandbox-runner:latest';
      const scriptName = language === 'python' ? 'solution.py' : 'solution.js';
      let scriptContent = code;
      if (language === 'python') {
        scriptContent = `import sys, json\n${code}\ntry:\n    raw = ${JSON.stringify(input)}\n    if 'max_sub_array' in globals() or 'max_sub_array' in locals():\n        inp = json.loads(raw)\n        print(json.dumps(max_sub_array(inp)))\n    elif 'is_palindrome' in globals() or 'is_palindrome' in locals():\n        inp = json.loads(raw)\n        print(str(is_palindrome(inp)).lower())\n    else:\n        pass\nexcept Exception as e:\n    sys.stderr.write(str(e))\n    sys.exit(1)\n`;
      } else if (language === 'javascript') {
        scriptContent = `${code}\ntry {\n  const raw = ${JSON.stringify(input)};\n  if (typeof maxSubArray === 'function') {\n    console.log(maxSubArray(JSON.parse(raw)));\n  } else if (typeof isPalindrome === 'function') {\n    console.log(String(isPalindrome(JSON.parse(raw))));\n  }\n} catch (e) {\n  console.error(e.message);\n  process.exit(1);\n}\n`;
      }
      fs.writeFileSync(path.join(hostTmp, scriptName), scriptContent, 'utf-8');

      const dockerArgs = [
        'run', '--rm', '-i',
        '--user', this.config.unprivilegedUser,
        '--network', 'none', // Strict network isolation
        '--read-only', // Read-only root
        '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m', // Restrictive tmpfs
        '--cap-drop', 'ALL', // Drop all Linux capabilities
        '--memory', `${this.config.maxMemoryMb}m`, // Memory cap
        '--cpus', `${this.config.maxCpuFraction}`, // CPU cap
        '--pids-limit', `${this.config.maxPids}`, // Prevent fork bombs
        '-v', `${hostTmp}:/app/workspace:ro`, // Read-only mount of user code
        imageName,
        language === 'python' ? 'python' : 'node',
        `/app/workspace/${scriptName}`
      ];

      return await new Promise<any>((resolve) => {
        const proc = spawn('docker', dockerArgs, { timeout: this.config.wallClockTimeoutMs });
        let stdout = '';
        let stderr = '';

        proc.stdout?.on('data', d => { if (stdout.length < 50000) stdout += d.toString(); });
        proc.stderr?.on('data', d => { if (stderr.length < 50000) stderr += d.toString(); });

        proc.on('close', (exitCode) => {
          if (exitCode === 137 || exitCode === 124) {
            resolve({ passed: false, status: 'TIME_LIMIT_EXCEEDED', error: 'Container execution timed out or OOM killed' });
          } else if (exitCode !== 0) {
            resolve({ passed: false, status: 'RUNTIME_ERROR', error: stderr.trim() || `Exit code ${exitCode}` });
          } else {
            const passed = stdout.trim().toLowerCase() === expectedOutput.trim().toLowerCase();
            resolve({ passed, actualOutput: stdout.trim(), status: passed ? 'ACCEPTED' : 'WRONG_ANSWER' });
          }
        });

        proc.on('error', (err) => {
          resolve({ passed: false, status: 'RUNTIME_ERROR', error: `Docker error: ${err.message}` });
        });
      });
    } finally {
      try { fs.rmSync(hostTmp, { recursive: true, force: true }); } catch {}
    }
  }

  /**
   * Local restricted subprocess execution with process-tree termination
   */
  private async executeInLocalRestrictedSandbox(
    language: 'python' | 'javascript' | 'cpp' | 'java',
    code: string,
    testCases: TestCase[]
  ): Promise<any> {
    const results: any[] = [];
    let allPassed = true;
    let overallStatus = 'ACCEPTED';

    for (const tc of testCases) {
      const res = await this.runSingleLocalSubprocess(language, code, tc.input, tc.expectedOutput);
      if (!res.passed) {
        allPassed = false;
        if (overallStatus === 'ACCEPTED') overallStatus = res.status;
      }
      results.push({
        id: tc.id,
        passed: res.passed,
        actualOutput: res.actualOutput,
        expectedOutput: tc.isHidden ? '*** Hidden ***' : tc.expectedOutput,
        error: res.error,
        status: res.status
      });
    }

    return {
      allPassed,
      totalTests: testCases.length,
      passedTests: results.filter(r => r.passed).length,
      testResults: results,
      overallStatus,
      isolationBoundary: 'local_restricted_process'
    };
  }

  private async runSingleLocalSubprocess(
    language: string,
    code: string,
    input: string,
    expectedOutput: string
  ): Promise<any> {
    const tempDir = path.join(os.tmpdir(), `clutch-subproc-${uuidv4()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const startTime = Date.now();
    const TIMEOUT_MS = this.config.wallClockTimeoutMs;

    try {
      let cmd = '';
      let args: string[] = [];

      if (language === 'python') {
        const file = path.join(tempDir, 'solution.py');
        const harness = `
import sys, json
${code}
try:
    raw = ${JSON.stringify(input)}
    if 'max_sub_array' in globals() or 'max_sub_array' in locals():
        inp = json.loads(raw)
        print(json.dumps(max_sub_array(inp)))
    elif 'is_palindrome' in globals() or 'is_palindrome' in locals():
        inp = json.loads(raw)
        print(str(is_palindrome(inp)).lower())
    else:
        print("Function signature not recognized")
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;
        fs.writeFileSync(file, harness, 'utf-8');
        cmd = 'python';
        args = ['-u', file];
      } else if (language === 'javascript') {
        const file = path.join(tempDir, 'solution.js');
        const harness = `
${code}
try {
  const raw = ${JSON.stringify(input)};
  if (typeof maxSubArray === 'function') {
    console.log(maxSubArray(JSON.parse(raw)));
  } else if (typeof isPalindrome === 'function') {
    console.log(String(isPalindrome(JSON.parse(raw))));
  } else {
    console.log("Function not found");
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
`;
        fs.writeFileSync(file, harness, 'utf-8');
        cmd = process.execPath;
        args = ['--max-old-space-size=64', file];
      } else {
        return {
          passed: false,
          status: 'RUNTIME_ERROR',
          error: `Compiler not installed on this host for ${language}. Container runner required.`
        };
      }

      return await new Promise<any>((resolve) => {
        const proc = spawn(cmd, args, {
          cwd: tempDir,
          env: {
            PATH: process.env.PATH || '',
            SYSTEMROOT: process.env.SYSTEMROOT || '',
            TEMP: tempDir,
            TMP: tempDir
          }
        });

        let stdout = '';
        let stderr = '';
        let finished = false;

        const timer = setTimeout(() => {
          if (!finished) {
            finished = true;
            killProcessTree(proc.pid);
            resolve({ passed: false, status: 'TIME_LIMIT_EXCEEDED', error: `Timed out after ${TIMEOUT_MS}ms` });
          }
        }, TIMEOUT_MS);

        proc.stdout?.on('data', d => { if (stdout.length < 50000) stdout += d.toString(); });
        proc.stderr?.on('data', d => { if (stderr.length < 50000) stderr += d.toString(); });

        proc.on('close', (code, signal) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);

          if (signal === 'SIGTERM' || signal === 'SIGKILL' || (Date.now() - startTime) >= TIMEOUT_MS) {
            resolve({ passed: false, status: 'TIME_LIMIT_EXCEEDED', error: 'Execution timed out' });
            return;
          }

          if (code !== 0) {
            resolve({ passed: false, status: 'RUNTIME_ERROR', error: stderr.trim() || `Exit code ${code}` });
            return;
          }

          const cleanActual = stdout.trim().replace(/"/g, '');
          const cleanExpected = expectedOutput.trim().replace(/"/g, '');
          const passed = cleanActual.toLowerCase() === cleanExpected.toLowerCase();

          resolve({
            passed,
            actualOutput: cleanActual,
            status: passed ? 'ACCEPTED' : 'WRONG_ANSWER'
          });
        });

        proc.on('error', (err) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          killProcessTree(proc.pid);
          resolve({ passed: false, status: 'RUNTIME_ERROR', error: err.message });
        });
      });
    } finally {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    }
  }
}

export const isolatedExecutionWorker = new IsolatedExecutionWorker();
