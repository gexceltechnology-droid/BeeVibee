import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/sms';
import { saveOtpToFirestore } from '@/lib/firestore';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { cleanPhoneNumber } from '@/lib/whatsappUtils';
import { isPhoneVerificationDisabled } from '@/lib/phoneVerification';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    if (isPhoneVerificationDisabled()) {
      return NextResponse.json({ success: true, message: 'Phone verification is currently bypassed.' });
    }

    const trimmedPhone = String(phone).trim();
    const cleaned = cleanPhoneNumber(trimmedPhone);

    if (!cleaned || cleaned.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number.' }, { status: 400 });
    }

    // Rate Limiting by IP and Phone: max 3 attempts per 10 minutes (600s)
    const clientIp = getClientIp(request);
    const ipLimit = checkRateLimit(`otp_send_ip_${clientIp}`, 5, 600);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: `Too many OTP requests from your network. Please wait ${ipLimit.retryAfterSeconds}s before trying again.` },
        { status: 429 }
      );
    }

    const phoneLimit = checkRateLimit(`otp_send_phone_${cleaned}`, 3, 600);
    if (!phoneLimit.allowed) {
      return NextResponse.json(
        { error: `Too many OTP requests for this mobile number. Please wait ${phoneLimit.retryAfterSeconds}s before trying again.` },
        { status: 429 }
      );
    }
    
    // Generate a 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the OTP (hashed with an expiry time of 5 minutes) in Firestore
    await saveOtpToFirestore(trimmedPhone, code, 5);

    const smsResult = await sendSMS(
      trimmedPhone,
      `Your Bee Vibe verification code is ${code}. Valid for 5 minutes.`
    );

    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.error || 'Failed to send OTP.' },
        { status: 500 }
      );
    }

    // Keep the OTP hidden from the UI and return a success message only
    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
