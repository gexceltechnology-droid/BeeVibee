import { NextRequest, NextResponse } from 'next/server';
import { sendBookingConfirmationEmail } from '@/lib/mail';

export async function GET(request: NextRequest) {
  try {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const secure = process.env.SMTP_SECURE;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    const maskedPass = pass ? `${pass.substring(0, 4)}...${pass.substring(Math.max(0, pass.length - 4))}` : 'NOT_CONFIGURED';

    console.log('SMTP Config:', { host, port, secure, user, from });

    if (!host || !user || !pass) {
      return NextResponse.json({
        success: false,
        error: 'SMTP credentials missing from environment variables.',
        config: { host, port, secure, user, maskedPass, from }
      }, { status: 400 });
    }

    await sendBookingConfirmationEmail({
      id: 'BEE-TEST12',
      customerName: 'Test Customer',
      email: 'malligopaladasu@gmail.com',
      phone: '8919178055',
      date: '2026-07-14',
      timeSlot: '10:00 AM - 12:00 PM',
      packageName: 'Movie Vibe Pack',
      addOns: [],
      totalPrice: 999,
      guestCount: 2,
    });

    return NextResponse.json({
      success: true,
      message: 'Email test ran successfully.',
      config: { host, port, secure, user, maskedPass, from }
    });
  } catch (error: any) {
    console.error('Test email failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
      }
    }, { status: 500 });
  }
}
