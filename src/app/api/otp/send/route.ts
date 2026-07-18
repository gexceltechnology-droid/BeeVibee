import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/lib/sms';
import { saveOtp } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const trimmedPhone = String(phone).trim();
    
    // Generate a 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Save the OTP (hashed with an expiry time of 5 minutes) in the database
    saveOtp(trimmedPhone, code, 5);

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
