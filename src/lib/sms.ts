export function isSMSConfigured(): boolean {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  return !!(authKey && templateId);
}

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  // Clean phone number: keep only digits
  let cleanPhone = to.replace(/\D/g, '');
  // If it's a 10-digit number without country code, prefix with '91' (India)
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  // Extract OTP/code from message body (usually a 6-digit number)
  const codeMatch = body.match(/\b\d{6}\b/);
  const otpCode = codeMatch ? codeMatch[0] : '';

  if (isSMSConfigured()) {
    try {
      const res = await fetch('https://control.msg91.com/api/v5/flow', {
        method: 'POST',
        headers: {
          'authkey': authKey || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: templateId,
          recipients: [
            {
              mobiles: cleanPhone,
              otp: otpCode,
              code: otpCode,
              var1: otpCode,
              var: otpCode
            }
          ]
        }),
      });

      const data = await res.json();

      // MSG91 returns type: "success" or "error" in response
      if (!res.ok || data.type === 'error') {
        console.error('MSG91 SMS API Error:', data);
        return {
          success: false,
          error: data.message || 'Failed to send SMS via MSG91.',
        };
      }

      console.log(`[SMS] Real SMS sent via MSG91 to ${cleanPhone}.`);
      return { success: true };
    } catch (error: any) {
      console.error('Error sending SMS via MSG91:', error);
      return {
        success: false,
        error: error.message || 'Internal MSG91 SMS error.',
      };
    }
  } else {
    // Fallback console log for local development/testing when keys are not configured
    console.log(`\n==================================================`);
    console.log(`[SMS BACKEND ONLY] MSG91 credentials missing in environment.`);
    console.log(`To: ${cleanPhone}`);
    console.log(`Message: ${body} (OTP: ${otpCode})`);
    console.log(`==================================================\n`);

    return {
      success: true,
    };
  }
}
