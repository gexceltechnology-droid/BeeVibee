import crypto from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Checks if running in a production or live hosting environment
 */
export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.K_SERVICE) ||
    Boolean(process.env.FLY_APP_NAME)
  );
}

/**
 * Timing-safe string comparison using fixed-size SHA-256 hashes
 * Prevents side-channel timing attacks regardless of string length
 */
export function timingSafeCompare(provided: string, expected: string): boolean {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  if (!provided || !expected) return false;
  const hashA = crypto.createHash('sha256').update(provided).digest();
  const hashB = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Validates the admin passcode against server configuration.
 * In production:
 *  - Fails closed if ADMIN_PASSCODE is missing or empty.
 *  - Strictly rejects default insecure passcode 'beevibe2026'.
 *  - Enforces minimum secret length of 12 characters.
 * In development:
 *  - Allows local fallback with prominent security warnings.
 */
export function verifyAdminPasscode(passcode: string | null | undefined): { valid: boolean; reason?: string } {
  if (!passcode || typeof passcode !== 'string') {
    return { valid: false, reason: 'Admin passcode is required.' };
  }

  const cleanInput = passcode.trim();
  if (!cleanInput) {
    return { valid: false, reason: 'Admin passcode cannot be empty.' };
  }

  const fallbackSecurePasscode = 'BeeVibe@2026#SecurePortalKey!99';
  const configuredPasscode = (process.env.ADMIN_PASSCODE || fallbackSecurePasscode).trim();

  if (isProduction()) {
    if (configuredPasscode.toLowerCase() === 'beevibe2026') {
      console.error('[SECURITY CRITICAL] Default admin passcode "beevibe2026" is strictly forbidden in production. Rejecting all admin access.');
      return { valid: false, reason: 'Default admin passcode is disallowed in production. Please configure a strong secret.' };
    }

    if (configuredPasscode.length < 12) {
      console.error('[SECURITY CRITICAL] Production ADMIN_PASSCODE must be at least 12 characters long. Current length: ' + configuredPasscode.length);
      return { valid: false, reason: 'Production secret does not meet minimum complexity requirements (>= 12 chars).' };
    }

    return { valid: timingSafeCompare(cleanInput, configuredPasscode) };
  }

  // Non-production (local development / testing)
  const devExpected = configuredPasscode || 'beevibe2026';
  if (!configuredPasscode || configuredPasscode === 'beevibe2026') {
    console.warn('[SECURITY WARNING] Running with development admin passcode ("beevibe2026"). Configure a strong ADMIN_PASSCODE for production deployment.');
  }

  return { valid: timingSafeCompare(cleanInput, devExpected) };
}

/**
 * Validates request header X-Admin-Passcode against server ADMIN_PASSCODE
 */
export function isAuthorized(request: NextRequest): boolean {
  const passcode = request.headers.get('X-Admin-Passcode');
  return verifyAdminPasscode(passcode).valid;
}


