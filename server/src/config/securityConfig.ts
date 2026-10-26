import * as crypto from 'crypto';

/**
 * CLUTCH Production Security Configuration & Validation Engine
 * Enforces fail-closed credential validation, constant-time secret comparison,
 * and eliminates insecure production defaults.
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
  'changeme'
]);

/**
 * Check if a credential is weak, empty, or uses a known insecure default
 */
export function isWeakOrBannedSecret(secret: string | undefined, minLength = 32): { weak: boolean; reason?: string } {
  if (!secret || typeof secret !== 'string') {
    return { weak: true, reason: 'Secret is missing or empty.' };
  }

  const trimmed = secret.trim();
  if (trimmed.length < minLength) {
    return { weak: true, reason: `Secret is too short (${trimmed.length} characters). Minimum required: ${minLength} characters.` };
  }

  const lower = trimmed.toLowerCase();
  for (const banned of BANNED_DEFAULT_CREDENTIALS) {
    if (lower === banned || lower.includes(banned)) {
      return { weak: true, reason: `Secret matches or contains known insecure default credential: "${banned}".` };
    }
  }

  // Basic entropy check: must not be repeating single character
  const uniqueChars = new Set(trimmed).size;
  if (uniqueChars < 6) {
    return { weak: true, reason: 'Secret lacks entropy (too few unique characters).' };
  }

  return { weak: false };
}

/**
 * Constant-time string comparison using SHA-256 fixed-length digests
 * Eliminates token length leakage and protects against timing side-channel attacks.
 */
export function secureTimingSafeCompare(provided: string | undefined, expected: string | undefined): boolean {
  if (!provided || !expected || typeof provided !== 'string' || typeof expected !== 'string') {
    return false;
  }
  const hashProvided = crypto.createHash('sha256').update(provided).digest();
  const hashExpected = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(hashProvided, hashExpected);
}

/**
 * Strict RFC 6750 Bearer token header validation
 */
export function validateBearerTokenHeader(authHeader: string | undefined): { valid: boolean; token?: string; error?: string } {
  if (!authHeader || typeof authHeader !== 'string') {
    return { valid: false, error: 'Missing Authorization header. Expected: Bearer <token>' };
  }

  const match = authHeader.match(/^Bearer\s+([A-Za-z0-9_\-\.~+/]+=*)$/);
  if (!match || !match[1]) {
    return { valid: false, error: 'Malformed Authorization header format. Must be strictly "Bearer <token>"' };
  }

  return { valid: true, token: match[1] };
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
      for (const banned of BANNED_DEFAULT_CREDENTIALS) {
        if (dbUrl.includes(banned)) {
          errors.push(`DATABASE_URL contains known insecure default password: "${banned}".`);
        }
      }
    }

    // 2. JWT Session Secret (if configured/used)
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret) {
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
        if (org === '*' || org.includes('localhost') || org.includes('127.0.0.1')) {
          errors.push(`ALLOWED_ORIGINS contains insecure entry in production: "${org}". Wildcards and localhost are prohibited.`);
        }
      }
    }

    // 4. Runner Microservice Secret (if runner URL is configured)
    if (process.env.RUNNER_SERVICE_URL) {
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
    throw new Error(`Production startup aborted due to ${errors.length} security configuration violation(s).`);
  }
}
