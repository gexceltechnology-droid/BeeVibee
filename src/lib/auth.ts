import { NextRequest } from 'next/server';

/**
 * Validates request header X-Admin-Passcode against server ADMIN_PASSCODE
 */
export function isAuthorized(request: NextRequest): boolean {
  const passcode = request.headers.get('X-Admin-Passcode');
  const serverPasscode = process.env.ADMIN_PASSCODE || 'beevibe2026';
  return passcode === serverPasscode;
}
