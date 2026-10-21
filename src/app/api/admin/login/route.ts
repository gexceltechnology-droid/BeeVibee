import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { verifyAdminPasscode } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateCheck = checkRateLimit(`admin_login_${clientIp}`, 5, 300); // 5 attempts per 5 minutes
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { passcode } = body;

    const verification = verifyAdminPasscode(passcode);
    if (verification.valid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: verification.reason || 'Invalid admin passcode.' },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error in admin login:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

