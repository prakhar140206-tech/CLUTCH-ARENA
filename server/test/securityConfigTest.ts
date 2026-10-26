import assert from 'assert';
import {
  BANNED_DEFAULT_CREDENTIALS,
  calculateEntropy,
  isWeakOrBannedSecret,
  secureTimingSafeCompare,
  validateBearerTokenHeader,
  generateSecureToken,
  maskSecret,
  sanitizeInputString,
  validateProductionEnvironment,
  getSecurityAuditReport
} from '../src/config/securityConfig.js';

async function runSecurityConfigTestSuite() {
  console.log('========================================================================');
  console.log('🛡️  CLUTCH PRODUCTION SECURITY CONFIGURATION & INTEGRITY VERIFICATION');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;

  function runTest(name: string, fn: () => void) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // 1. Shannon Entropy Calculation
  runTest('1. Shannon entropy calculation works correctly', () => {
    const singleChar = calculateEntropy('aaaaaaaaaaaaaaaa');
    assert.strictEqual(singleChar, 0, 'Single repeating char must have 0 entropy');

    const twoChars = calculateEntropy('abababababababab');
    assert.strictEqual(Math.round(twoChars), 1, 'Two alternating chars must have ~1 bit/char entropy');

    const highEntropy = calculateEntropy('4f7a29e1c0d58b3e921f6a8b7c3d0e5f');
    assert.ok(highEntropy > 3.0, 'High entropy hex string must have >3.0 bits/char');
  });

  // 2. Banned Credential Detection
  runTest('2. Banned default credentials dictionary is enforced', () => {
    for (const banned of BANNED_DEFAULT_CREDENTIALS) {
      const res = isWeakOrBannedSecret(banned, 10);
      assert.strictEqual(res.weak, true, `Banned secret "${banned}" must be flagged as weak`);
    }

    // Substring detection
    const containingBanned = 'my_super_secret_password_for_clutch_production';
    const res2 = isWeakOrBannedSecret(containingBanned, 32);
    assert.strictEqual(res2.weak, true, 'Secret containing "password" must be flagged');
  });

  // 3. Length & Entropy Boundaries
  runTest('3. Secret length and character diversity requirements', () => {
    // Missing
    assert.strictEqual(isWeakOrBannedSecret(undefined).weak, true);
    assert.strictEqual(isWeakOrBannedSecret('').weak, true);

    // Too short
    assert.strictEqual(isWeakOrBannedSecret('short_secret_123', 32).weak, true);

    // Low unique chars
    const lowUnique = '11111111111111111111111111111111';
    assert.strictEqual(isWeakOrBannedSecret(lowUnique, 32).weak, true);

    // Repetitive sequence with low entropy
    const repeating = '12341234123412341234123412341234';
    assert.strictEqual(isWeakOrBannedSecret(repeating, 32, 2.5).weak, true);

    // Strong high-entropy secret
    const strong = generateSecureToken(32); // 64 hex chars
    const strongCheck = isWeakOrBannedSecret(strong, 32);
    assert.strictEqual(strongCheck.weak, false, 'Strong token must pass');
  });

  // 4. Constant-Time Comparison
  runTest('4. Constant-time secure string comparison', () => {
    const tokenA = 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2';
    const tokenB = 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2';
    const tokenC = 'f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c3';

    assert.strictEqual(secureTimingSafeCompare(tokenA, tokenB), true, 'Identical tokens must match');
    assert.strictEqual(secureTimingSafeCompare(tokenA, tokenC), false, 'Different tokens must not match');
    assert.strictEqual(secureTimingSafeCompare(tokenA, undefined), false, 'Undefined must safely return false');
    assert.strictEqual(secureTimingSafeCompare('', tokenA), false, 'Empty string must return false');
    assert.strictEqual(secureTimingSafeCompare(tokenA, '  ' + tokenA + '  '), true, 'Trimmed tokens must match');
  });

  // 5. RFC 6750 Bearer Token Header Parsing
  runTest('5. Strict RFC 6750 Bearer token parsing and validation', () => {
    // Valid standard Bearer
    const validHeader = 'Bearer d41d8cd98f00b204e9800998ecf8427e';
    const res1 = validateBearerTokenHeader(validHeader);
    assert.strictEqual(res1.valid, true);
    assert.strictEqual(res1.token, 'd41d8cd98f00b204e9800998ecf8427e');

    // Case-insensitive bearer
    const lowerBearer = 'bearer eyJhbGciOiJIUzI1NiJ9.abc.def';
    const res2 = validateBearerTokenHeader(lowerBearer);
    assert.strictEqual(res2.valid, true);
    assert.strictEqual(res2.token, 'eyJhbGciOiJIUzI1NiJ9.abc.def');

    // Missing header
    assert.strictEqual(validateBearerTokenHeader(undefined).valid, false);

    // Malformed headers
    assert.strictEqual(validateBearerTokenHeader('Basic dXNlcjpwYXNz').valid, false);
    assert.strictEqual(validateBearerTokenHeader('Bearer').valid, false);
    assert.strictEqual(validateBearerTokenHeader('Bearer with spaces inside').valid, false);
  });

  // 6. Secret Masking
  runTest('6. Secret masking never outputs raw sensitive data', () => {
    const raw = '8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d';
    const masked = maskSecret(raw);
    assert.ok(!masked.includes(raw), 'Masked output must not contain full raw secret');
    assert.ok(masked.startsWith('8a7b'), 'Must show preview prefix');
    assert.ok(masked.endsWith('chars)'), 'Must indicate length');
    assert.strictEqual(maskSecret(undefined), '[UNSET]');
  });

  // 7. Input Sanitization
  runTest('7. Input string sanitization strips null bytes and control chars', () => {
    const malicious = 'admin\0user\x08name\x1b[31m';
    const clean = sanitizeInputString(malicious, 50);
    assert.strictEqual(clean.includes('\0'), false, 'Null byte must be removed');
    assert.strictEqual(clean.includes('\x08'), false, 'Backspace control character must be removed');
  });

  // 8. Fail-Closed Production Environment Validation
  runTest('8. Fail-closed production environment gates (API & Runner)', () => {
    const oldEnv = process.env.NODE_ENV;
    const oldDb = process.env.DATABASE_URL;
    const oldJwt = process.env.JWT_SECRET;
    const oldCors = process.env.ALLOWED_ORIGINS;
    const oldSandbox = process.env.ALLOW_LOCAL_SUBPROCESS_SANDBOX;

    try {
      process.env.NODE_ENV = 'production';

      // 8a. Missing DATABASE_URL in production must throw
      delete process.env.DATABASE_URL;
      assert.throws(() => validateProductionEnvironment('api'), /Production startup aborted/);

      // 8b. Banned DB password must throw
      process.env.DATABASE_URL = 'postgresql://postgres:clutch_secure_db_password_2026@localhost:5432/clutch_db';
      process.env.JWT_SECRET = generateSecureToken(32);
      process.env.ALLOWED_ORIGINS = 'https://clutch.gg';
      assert.throws(() => validateProductionEnvironment('api'), /known insecure default credential/);

      // 8c. Missing JWT_SECRET in production must throw
      process.env.DATABASE_URL = 'postgresql://postgres:SuperSecureStrongPass_2026!@localhost:5432/clutch_db';
      delete process.env.JWT_SECRET;
      assert.throws(() => validateProductionEnvironment('api'), /JWT_SECRET is required/);

      // 8d. Insecure CORS origin (localhost or http) in production must throw
      process.env.JWT_SECRET = generateSecureToken(32);
      process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
      assert.throws(() => validateProductionEnvironment('api'), /Wildcards and localhost are prohibited/);

      // 8e. Unconfined subprocess sandbox flag in production must throw
      process.env.ALLOWED_ORIGINS = 'https://clutch.gg';
      process.env.ALLOW_LOCAL_SUBPROCESS_SANDBOX = 'true';
      assert.throws(() => validateProductionEnvironment('api'), /ALLOW_LOCAL_SUBPROCESS_SANDBOX cannot be enabled/);

      // 8f. Valid production environment must succeed cleanly
      process.env.ALLOW_LOCAL_SUBPROCESS_SANDBOX = 'false';
      assert.doesNotThrow(() => validateProductionEnvironment('api'));

      // 8g. Runner microservice missing secret must throw
      delete process.env.RUNNER_SERVICE_SECRET;
      assert.throws(() => validateProductionEnvironment('runner'), /RUNNER_SERVICE_SECRET is required/);

      // 8h. Runner microservice with strong secret must pass
      process.env.RUNNER_SERVICE_SECRET = generateSecureToken(32);
      assert.doesNotThrow(() => validateProductionEnvironment('runner'));

    } finally {
      process.env.NODE_ENV = oldEnv;
      process.env.DATABASE_URL = oldDb;
      process.env.JWT_SECRET = oldJwt;
      process.env.ALLOWED_ORIGINS = oldCors;
      process.env.ALLOW_LOCAL_SUBPROCESS_SANDBOX = oldSandbox;
    }
  });

  // 9. Security Audit Report
  runTest('9. Security audit report produces structured non-leaking snapshot', () => {
    const report = getSecurityAuditReport();
    assert.strictEqual(typeof report.environment, 'string');
    assert.strictEqual(typeof report.isProduction, 'boolean');
    assert.strictEqual(typeof report.securityChecksPassed, 'boolean');
    assert.strictEqual(typeof report.databaseConfigured, 'boolean');
    assert.strictEqual(typeof report.jwtSecretConfigured, 'boolean');
    // Ensure no secrets are leaked
    assert.strictEqual((report as any).password, undefined);
    assert.strictEqual((report as any).secret, undefined);
  });

  console.log('\n========================================================================');
  console.log(`RESULTS: ${passed}/${total} security test suites passed.`);
  console.log('========================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runSecurityConfigTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
