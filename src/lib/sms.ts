export function isSMSConfigured(): boolean {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  return !!(accountSid && authToken && fromNumber);
}

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  // Clean phone number: keep only digits
  let cleanPhone = to.trim();
  
  // Format phone number to E.164 (Twilio requires E.164 format, e.g. +91XXXXXXXXXX)
  if (!cleanPhone.startsWith('+')) {
    const digits = cleanPhone.replace(/\D/g, '');
    if (digits.length === 10) {
      cleanPhone = '+91' + digits; // Default to India country code
    } else {
      cleanPhone = '+' + digits;
    }
  }

  // Extract OTP/code from message body (usually a 6-digit number)
  const codeMatch = body.match(/\b\d{6}\b/);
  const otpCode = codeMatch ? codeMatch[0] : '';

  if (isSMSConfigured()) {
    try {
      const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${basicAuth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: cleanPhone,
            From: fromNumber!,
            Body: body,
          }).toString(),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        console.error('Twilio SMS API Error:', data);
        return {
          success: false,
          error: data.message || 'Failed to send SMS via Twilio.',
        };
      }

      console.log(`[SMS] Real SMS sent via Twilio to ${cleanPhone}. SID: ${data.sid}`);
      return { success: true };
    } catch (error: any) {
      console.error('Error sending SMS via Twilio:', error);
      return {
        success: false,
        error: error.message || 'Internal Twilio SMS error.',
      };
    }
  } else {
    // Fallback console log for local development/testing when keys are not configured
    console.log(`\n==================================================`);
    console.log(`[SMS BACKEND ONLY] Twilio credentials missing in environment.`);
    console.log(`To: ${cleanPhone}`);
    console.log(`Message: ${body} (OTP: ${otpCode})`);
    console.log(`==================================================\n`);

    return {
      success: true,
    };
  }
}
