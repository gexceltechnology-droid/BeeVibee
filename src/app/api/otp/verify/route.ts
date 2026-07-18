import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and verification code are required.' }, { status: 400 });
    }

    const trimmedPhone = String(phone).trim();
    const inputCode = String(code).trim();

    const isValid = verifyOtp(trimmedPhone, inputCode);

    if (isValid) {
      console.log(`[SMS] Database verification successful for phone: ${trimmedPhone}`);
      return NextResponse.json({ success: true });
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
