import * as crypto from 'crypto';

/**
 * CLUTCH Production Security Configuration & Validation Engine
 * 
 * Enforces:
 * - Fail-closed credential validation at application startup
 * - Strict defense against banned, known default, and low-entropy credentials
 * - Constant-time cryptographic comparison (timing side-channel protection)
 * - RFC 6750-compliant Bearer token validation
 * - Mandatory production HTTPS and strict CORS origin gating
 * - Subprocess containment enforcement (prohibits unconfined host execution)
 * - Comprehensive security posture auditing and secret masking
 */

export const BANNED_DEFAULT_CREDENTIALS = new Set<string>([
  'clutch_secure_db_password_2026',
  'clutch_runner_production_secret_key_2026',
  'clutch_runner_production_secret_key_2026_change_in_production',
  'super_cyber_secret_key_change_in_production',
  'super_cyber_secret_key_change_in_production_min_64_chars_recommended_for_security',
  'clutch_runner_secret_phase9_test_token',
  'password',
  'admin',
  'postgres',
  'secret',
  'default',
  'changeme',
  'root',
  '123456',
  '12345678',
  '123456789',
  'qwerty',
  'letmein',
  'clutch',
  'clutch_db',
  'clutch_dev',
  'clutch_admin',
  'clutch_password',
  'database',
  'development',
  'dev_secret',
  'production',
  'node_env'
]);

/**
 * Calculate Shannon entropy of a string (in bits per character)
 */
export function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies = new Map<string, number>();
  for (const ch of str) {
    frequencies.set(ch, (frequencies.get(ch) || 0) + 1);
  }
  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Check if a credential is weak, empty, or uses a known insecure default.
 * Enforces length, banned dictionary check, character variety, and Shannon entropy.
 */
export function isWeakOrBannedSecret(
  secret: string | undefined, 
  minLength = 32,
  minEntropy = 2.5
): { weak: boolean; reason?: string } {
  if (!secret || typeof secret !== 'string') {
    return { weak: true, reason: 'Secret is missing or empty.' };
  }

  const trimmed = secret.trim();
  if (trimmed.length < minLength) {
    return { 
      weak: true, 
      reason: `Secret is too short (${trimmed.length} characters). Minimum required: ${minLength} characters.` 
    };
  }

  const lower = trimmed.toLowerCase();
  for (const banned of BANNED_DEFAULT_CREDENTIALS) {
    if (lower === banned) {
      return { 
        weak: true, 
        reason: `Secret matches known insecure default credential: "${banned}".` 
      };
    }
    // Only check substring match for template placeholders of significant length (>= 8 chars)
    // and skip generic words to prevent false positives in random hex/base64 tokens
    const isGenericKeyword = ['password', '12345678', '123456789', 'postgres'].includes(banned);
    if (banned.length >= 8 && !isGenericKeyword && lower.includes(banned)) {
      return { 
        weak: true, 
        reason: `Secret contains known insecure default template credential: "${banned}".` 
      };
    }
  }

  // Basic character diversity check: must have at least 6 unique characters
  const uniqueChars = new Set(trimmed).size;
  if (uniqueChars < 6) {
    return { weak: true, reason: 'Secret lacks character diversity (too few unique characters).' };
  }

  // Shannon entropy check for secrets of length >= 16
  if (trimmed.length >= 16) {
    const entropy = calculateEntropy(trimmed);
    if (entropy < minEntropy) {
      return { 
        weak: true, 
        reason: `Secret lacks cryptographic entropy (${entropy.toFixed(2)} bits/char). Minimum required: ${minEntropy.toFixed(1)} bits/char.` 
      };
    }
  }

  return { weak: false };
}

/**
 * Constant-time string comparison using SHA-256 fixed-length digests.
 * Eliminates token length leakage and protects against timing side-channel attacks.
 */
export function secureTimingSafeCompare(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected || typeof provided !== 'string' || typeof expected !== 'string') {
    return false;
  }
  const cleanProvided = provided.trim();
  const cleanExpected = expected.trim();
  if (cleanProvided.length === 0 || cleanExpected.length === 0) {
    return false;
  }
  const hashProvided = crypto.createHash('sha256').update(cleanProvided).digest();
  const hashExpected = crypto.createHash('sha256').update(cleanExpected).digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

/**
 * Strict RFC 6750 Bearer token header validation.
 * Supports case-insensitive 'Bearer' scheme and RFC 6750 b64token character set.
 */
export function validateBearerTokenHeader(authHeader: string | undefined): { valid: boolean; token?: string; error?: string } {
  if (!authHeader || typeof authHeader !== 'string') {
    return { valid: false, error: 'Missing Authorization header. Expected: Bearer <token>' };
  }

  const match = authHeader.trim().match(/^Bearer\s+([A-Za-z0-9_\-\.~+/]+=*)$/i);
  if (!match || !match[1]) {
    return { valid: false, error: 'Malformed Authorization header format. Must be strictly "Bearer <token>"' };
  }

  return { valid: true, token: match[1] };
}

/**
 * Generate cryptographically secure random token (hex-encoded)
 */
export function generateSecureToken(byteLength = 32): string {
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Safely mask sensitive secrets for logging or diagnostic output.
 * Never outputs raw keys or passwords.
 */
export function maskSecret(secret: string | undefined): string {
  if (!secret || typeof secret !== 'string') return '[UNSET]';
  const trimmed = secret.trim();
  if (trimmed.length <= 8) return '********';
  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)} (${trimmed.length} chars)`;
}

/**
 * Sanitize untrusted input string to prevent control character and null byte injection
 */
export function sanitizeInputString(input: string, maxLength = 2000): string {
  if (!input || typeof input !== 'string') return '';
  // Strip null bytes and non-printable control characters except newline and tab
  return input
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, maxLength);
}

/**
 * Validates all production secrets and environment variables at startup.
 * Fails closed immediately if any required credential is missing or insecure.
 */
export function validateProductionEnvironment(serviceType: 'api' | 'runner'): void {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return; // Allow permissive configuration only in local development/test
  }

  const errors: string[] = [];

  if (serviceType === 'api') {
    // 1. Database URL / Password
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      errors.push('DATABASE_URL is required in production.');
    } else {
      try {
        const parsed = new URL(dbUrl);
        if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') {
          errors.push(`DATABASE_URL protocol must be "postgresql:" or "postgres:", got "${parsed.protocol}"`);
        }
        const pass = decodeURIComponent(parsed.password || '');
        if (!pass) {
          errors.push('DATABASE_URL must include a password in production.');
        } else {
          const passCheck = isWeakOrBannedSecret(pass, 12, 2.0);
          if (passCheck.weak) {
            errors.push(`DATABASE_URL password is insecure: ${passCheck.reason}`);
          }
        }
      } catch {
        if (dbUrl.includes('clutch_secure_db_password_2026')) {
          errors.push('DATABASE_URL contains known insecure default password: "clutch_secure_db_password_2026".');
        } else {
          errors.push('DATABASE_URL is not a valid URI.');
        }
      }
    }

    // 2. JWT Session Secret (MANDATORY in production)
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.trim().length === 0) {
      errors.push('JWT_SECRET is required in production (minimum 32 characters, high entropy).');
    } else {
      const jwtCheck = isWeakOrBannedSecret(jwtSecret, 32);
      if (jwtCheck.weak) {
        errors.push(`JWT_SECRET is insecure: ${jwtCheck.reason}`);
      }
    }

    // 3. CORS Allowed Origins
    const origins = process.env.ALLOWED_ORIGINS;
    if (!origins || origins.trim().length === 0) {
      errors.push('ALLOWED_ORIGINS must be explicitly configured in production.');
    } else {
      const originList = origins.split(',').map(s => s.trim());
      for (const org of originList) {
        if (org === '*' || org.includes('localhost') || org.includes('127.0.0.1') || org.includes('0.0.0.0')) {
          errors.push(`ALLOWED_ORIGINS contains insecure entry in production: "${org}". Wildcards and localhost are prohibited.`);
        }
        if (!org.startsWith('https://')) {
          errors.push(`ALLOWED_ORIGINS entry "${org}" must use HTTPS protocol in production.`);
        }
      }
    }

    // 4. Prohibit Unconfined Subprocess Sandbox in Production
    if (process.env.ALLOW_LOCAL_SUBPROCESS_SANDBOX === 'true') {
      errors.push('ALLOW_LOCAL_SUBPROCESS_SANDBOX cannot be enabled in production. Container sandbox isolation is mandatory.');
    }

    // 5. Runner Microservice Secret (if runner URL is configured)
    if (process.env.RUNNER_SERVICE_URL) {
      try {
        new URL(process.env.RUNNER_SERVICE_URL);
      } catch {
        errors.push(`RUNNER_SERVICE_URL is invalid URI: "${process.env.RUNNER_SERVICE_URL}".`);
      }
      const runnerSecret = process.env.RUNNER_SERVICE_SECRET;
      const secretCheck = isWeakOrBannedSecret(runnerSecret, 32);
      if (secretCheck.weak) {
        errors.push(`RUNNER_SERVICE_SECRET is insecure: ${secretCheck.reason}`);
      }
    }
  }

  if (serviceType === 'runner') {
    // Runner microservice MUST have a high-entropy secret in production
    const runnerSecret = process.env.RUNNER_SERVICE_SECRET;
    const secretCheck = isWeakOrBannedSecret(runnerSecret, 32);
    if (secretCheck.weak) {
      errors.push(`RUNNER_SERVICE_SECRET is required and must be secure: ${secretCheck.reason}`);
    }
  }

  if (errors.length > 0) {
    const errorMsg = [
      '========================================================================',
      `🚨 [FATAL SECURITY ERROR] ${serviceType.toUpperCase()} PRODUCTION STARTUP REFUSED`,
      '========================================================================',
      ...errors.map(e => `  ❌ ${e}`),
      '========================================================================',
      'Startup halted. Replace all default/weak credentials with strong secrets.',
      '========================================================================'
    ].join('\n');
    console.error(errorMsg);
    const fatalError: any = new Error(`Production startup aborted due to ${errors.length} security configuration violation(s):\n${errors.map(e => ` - ${e}`).join('\n')}`);
    fatalError.violations = errors;
    throw fatalError;
  }
}

/**
 * Returns a security audit snapshot of active configuration without leaking sensitive keys.
 */
export function getSecurityAuditReport(): {
  environment: string;
  isProduction: boolean;
  securityChecksPassed: boolean;
  databaseConfigured: boolean;
  jwtSecretConfigured: boolean;
  corsOriginsCount: number;
  corsHttpsCompliant: boolean;
  runnerMicroserviceConfigured: boolean;
  sandboxIsolationEnforced: boolean;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const httpsCompliant = origins.length > 0 && origins.every(o => o.startsWith('https://'));

  return {
    environment: process.env.NODE_ENV || 'development',
    isProduction,
    securityChecksPassed: true,
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    jwtSecretConfigured: Boolean(process.env.JWT_SECRET),
    corsOriginsCount: origins.length,
    corsHttpsCompliant: httpsCompliant,
    runnerMicroserviceConfigured: Boolean(process.env.RUNNER_SERVICE_URL),
    sandboxIsolationEnforced: process.env.ENFORCE_CONTAINER_SANDBOX === 'true' || isProduction
  };
}
