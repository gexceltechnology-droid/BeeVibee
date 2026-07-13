import { NextRequest, NextResponse } from 'next/server';

declare global {
  var otpCache: Record<string, string> | undefined;
}

// Global variable to persist in-memory cache across hot-reloads in dev mode
globalThis.otpCache = globalThis.otpCache || {};

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and verification code are required.' }, { status: 400 });
    }

    const trimmedPhone = String(phone).trim();
    const inputCode = String(code).trim();

    const expectedCode = globalThis.otpCache ? globalThis.otpCache[trimmedPhone] : undefined;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
    const isTwilioConfigured = !!(accountSid && authToken && twilioPhone);

    let isValid = false;

    if (expectedCode && inputCode === expectedCode) {
      isValid = true;
    } else if (!isTwilioConfigured && inputCode === '123456') {
      // Allow fallback 123456 only in mock mode (when Twilio is not configured)
      isValid = true;
    }

    if (isValid) {
      // Clear code from cache on success
      if (globalThis.otpCache) {
        delete globalThis.otpCache[trimmedPhone];
      }
      console.log(`[SMS] Verification successful for phone: ${trimmedPhone}`);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid verification code. Please check and try again.' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
