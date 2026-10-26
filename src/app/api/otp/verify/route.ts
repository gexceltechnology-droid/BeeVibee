import { NextRequest, NextResponse } from 'next/server';
import { verifyOtpFromFirestore } from '@/lib/firestore';
import { createSignedPhoneToken, isPhoneVerificationDisabled } from '@/lib/phoneVerification';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { cleanPhoneNumber } from '@/lib/whatsappUtils';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const trimmedPhone = String(phone).trim();

    if (isPhoneVerificationDisabled()) {
      const verificationToken = createSignedPhoneToken(trimmedPhone);
      return NextResponse.json({ success: true, verificationToken });
    }

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required.' }, { status: 400 });
    }
    const inputCode = String(code).trim();
    const cleaned = cleanPhoneNumber(trimmedPhone);

    // Rate Limiting: Max 5 verification attempts per phone / IP per 10 minutes (prevents brute forcing)
    const clientIp = getClientIp(request);
    const ipCheck = checkRateLimit(`otp_verify_ip_${clientIp}`, 10, 600);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    const phoneCheck = checkRateLimit(`otp_verify_phone_${cleaned}`, 5, 600);
    if (!phoneCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts for this number. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Dev/fallback test verification: ONLY permitted in non-production environments
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev && (inputCode === '123456' || inputCode === '000000')) {
      console.log(`[OTP] Dev test verification accepted for phone: ${trimmedPhone}`);
      const verificationToken = createSignedPhoneToken(trimmedPhone);
      return NextResponse.json({ success: true, verificationToken });
    }

    const isValid = await verifyOtpFromFirestore(trimmedPhone, inputCode);

    if (isValid) {
      console.log(`[SMS] Database verification successful for phone: ${trimmedPhone}`);
      const verificationToken = createSignedPhoneToken(trimmedPhone);
      return NextResponse.json({ success: true, verificationToken });
    } else {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please check and try again.' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
