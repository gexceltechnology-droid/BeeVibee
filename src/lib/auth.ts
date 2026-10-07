import { NextRequest } from 'next/server';

/**
 * Validates request header X-Admin-Passcode against server ADMIN_PASSCODE
 */
export function isAuthorized(request: NextRequest): boolean {
  const passcode = request.headers.get('X-Admin-Passcode')?.trim();
  const serverPasscode = (process.env.ADMIN_PASSCODE || 'beevibe2026').trim();
  return Boolean(passcode && passcode === serverPasscode);
}

