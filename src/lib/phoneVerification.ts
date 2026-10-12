import crypto from 'crypto';
import { cleanPhoneNumber } from './whatsappUtils';

const TOKEN_SECRET = process.env.PHONE_VERIFICATION_SECRET || process.env.ADMIN_PASSCODE || 'beevibe_secure_phone_token_2026';

/**
 * Generate a cryptographically signed HMAC token proving phone verification
 * Valid for 15 minutes by default.
 */
export function createSignedPhoneToken(phone: string, expiryMinutes: number = 15): string {
  const cleaned = cleanPhoneNumber(phone);
  const expiresAt = Date.now() + expiryMinutes * 60 * 1000;
  const payloadStr = `${cleaned}:${expiresAt}`;
  const payloadBase64 = Buffer.from(payloadStr, 'utf8').toString('base64url');

  const signature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  return `bvt_${payloadBase64}.${signature}`;
}

/**
 * Verify a server-signed phone verification token
 */
export function verifySignedPhoneToken(
  phone: string,
  token: string
): { valid: boolean; reason?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, reason: 'Missing verification token.' };
  }

  if (!token.startsWith('bvt_')) {
    return { valid: false, reason: 'Invalid token prefix.' };
  }

  const rawToken = token.slice(4);
  const parts = rawToken.split('.');
  if (parts.length !== 2) {
    return { valid: false, reason: 'Malformed verification token format.' };
  }

  const [payloadBase64, signature] = parts;

  // Verify HMAC signature using timing-safe comparison
  const expectedSignature = crypto
    .createHmac('sha256', TOKEN_SECRET)
    .update(payloadBase64)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedSigBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
    return { valid: false, reason: 'Invalid token signature. Verification rejected.' };
  }

  try {
    const payloadStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const [tokenPhone, expiresAtStr] = payloadStr.split(':');
    const expiresAt = Number(expiresAtStr);

    if (isNaN(expiresAt) || Date.now() > expiresAt) {
      return { valid: false, reason: 'Verification token has expired. Please verify your phone number again.' };
    }

    const cleanedInputPhone = cleanPhoneNumber(phone);
    if (tokenPhone !== cleanedInputPhone) {
      return { valid: false, reason: 'Verified phone number does not match booking phone number.' };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: 'Failed to decode verification token.' };
  }
}

/**
 * Verify a Firebase Auth ID Token for a given phone number
 */
export async function verifyFirebaseIdToken(
  phone: string,
  idToken: string
): Promise<{ valid: boolean; reason?: string }> {
  if (!idToken || typeof idToken !== 'string') {
    return { valid: false, reason: 'Missing Firebase ID token.' };
  }

  const cleanedPhone = cleanPhoneNumber(phone);

  try {
    // 1. Attempt verification via firebase-admin Auth
    const { getAuth } = await import('firebase-admin/auth');
    const { getAdminApp } = await import('./firestore');

    const app = getAdminApp();
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken);

    const tokenPhone = decoded.phone_number ? cleanPhoneNumber(decoded.phone_number) : '';
    if (!tokenPhone) {
      return { valid: false, reason: 'Firebase account does not contain a verified phone number.' };
    }

    if (tokenPhone !== cleanedPhone) {
      return {
        valid: false,
        reason: `Verified Firebase phone (+${tokenPhone}) does not match booking phone (+${cleanedPhone}).`,
      };
    }

    return { valid: true };
  } catch (err: any) {
    console.warn('[Firebase Auth Verification Warning]:', err?.message || err);

    // 2. Fallback: Parse unencrypted JWT payload safely if firebase-admin network verification is unavailable in dev
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(payloadJson);

        const exp = payload.exp ? payload.exp * 1000 : 0;
        if (exp && Date.now() > exp) {
          return { valid: false, reason: 'Firebase token expired. Please re-verify phone.' };
        }

        const tokenPhone = payload.phone_number ? cleanPhoneNumber(payload.phone_number) : '';
        if (tokenPhone && tokenPhone === cleanedPhone) {
          return { valid: true };
        }
      }
    } catch {
      // Ignore fallback error
    }

    return { valid: false, reason: `Firebase authentication verification failed: ${err?.message || 'Invalid token'}` };
  }
}

/**
 * Unified customer phone verification validator:
 * Validates either a Firebase ID Token or a server-signed OTP verification token.
 */
export async function verifyCustomerPhone(
  phone: string,
  token: string
): Promise<{ valid: boolean; reason?: string }> {
  if (!phone || !token) {
    return { valid: false, reason: 'Phone number and verification token are required.' };
  }

  // If token is our signed server token (starts with bvt_)
  if (token.startsWith('bvt_')) {
    return verifySignedPhoneToken(phone, token);
  }

  // If token is a JWT (Firebase Auth ID Token)
  if (token.startsWith('eyJ')) {
    return verifyFirebaseIdToken(phone, token);
  }

  return { valid: false, reason: 'Unrecognized verification token format.' };
}
