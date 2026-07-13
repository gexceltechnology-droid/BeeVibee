import { NextRequest, NextResponse } from 'next/server';

declare global {
  var otpCache: Record<string, string> | undefined;
}

// Global variable to persist in-memory cache across hot-reloads in dev mode
globalThis.otpCache = globalThis.otpCache || {};

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const trimmedPhone = String(phone).trim();
    
    // Generate a 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in global cache
    if (globalThis.otpCache) {
      globalThis.otpCache[trimmedPhone] = code;
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // Check if Twilio API keys are configured
    const isTwilioConfigured = !!(accountSid && authToken && twilioPhone);

    if (isTwilioConfigured) {
      const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': authHeader,
          },
          body: new URLSearchParams({
            To: trimmedPhone,
            From: twilioPhone || '',
            Body: `Your Bee Vibe verification code is ${code}. Valid for 10 minutes.`,
          }).toString(),
        }
      );

      const twilioData = await res.json();

      if (!res.ok) {
        console.error('Twilio SMS API Error:', twilioData);
        return NextResponse.json(
          { error: twilioData.message || 'Failed to send SMS via Twilio.' },
          { status: 500 }
        );
      }

      console.log(`[SMS] Real OTP sent via Twilio to ${trimmedPhone}. Code stored in cache.`);
      return NextResponse.json({ success: true, mock: false });
    } else {
      // Mock mode fallback
      console.log(`\n==================================================`);
      console.log(`[MOCK OTP] Twilio credentials missing in .env.local`);
      console.log(`Sending to: ${trimmedPhone}`);
      console.log(`Verification Code: ${code}`);
      console.log(`==================================================\n`);

      return NextResponse.json({ 
        success: true, 
        mock: true, 
        mockCode: code 
      });
    }
  } catch (error: any) {
    console.error('Error sending OTP:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
