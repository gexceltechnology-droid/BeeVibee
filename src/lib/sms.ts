/**
 * SMS Notification Module for Bee Vibe
 * Supports Twilio REST API & Custom SMS Gateway
 */

export function isSMSConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

export function cleanSMSPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.trim().replace(/\D/g, '');
  if (clean.length === 10) {
    clean = '+91' + clean;
  } else if (!clean.startsWith('+')) {
    clean = '+' + clean;
  }
  return clean;
}

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  const targetPhone = cleanSMSPhone(to);

  console.log(`[SMS Dispatch] Sending mobile SMS to ${targetPhone}...`);

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[SMS Logged] Mobile SMS for ${targetPhone}:\n${body}`);
    return { success: true };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', targetPhone);
    params.append('From', fromNumber);
    params.append('Body', body);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (res.ok) {
      console.log(`[Twilio SMS Success] Mobile SMS delivered to ${targetPhone}`);
      return { success: true };
    } else {
      const errText = await res.text();
      console.error('[Twilio SMS Error]:', errText);
      return { success: false, error: errText };
    }
  } catch (err: any) {
    console.error('[Twilio SMS Exception]:', err);
    return { success: false, error: err.message };
  }
}
