/**
 * SMS & Mobile Notification Module for Bee Vibe
 * Supports Fast2SMS (India +91 Direct SMS), Twilio, and Webhook SMS gateways
 */

export function isSMSConfigured(): boolean {
  return !!(process.env.FAST2SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID || process.env.SMS_WEBHOOK_URL);
}

export function cleanSMSPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.trim().replace(/\D/g, '');
  while (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
}

export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  const rawClean = cleanSMSPhone(to); // e.g. 919900106474
  const tenDigitPhone = rawClean.length === 12 && rawClean.startsWith('91') ? rawClean.substring(2) : rawClean;

  console.log(`\n==================================================`);
  console.log(`[MOBILE SMS DISPATCH] -> +${rawClean}`);
  console.log(`Body:\n${body}`);
  console.log(`==================================================\n`);

  // 1. Fast2SMS Gateway (India +91 Numbers)
  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=q&message=${encodeURIComponent(body)}&flash=0&numbers=${tenDigitPhone}`;
      const res = await fetch(url, { method: 'GET' });
      const json = await res.json();
      if (json.return) {
        console.log(`[Fast2SMS Success] SMS delivered to +${tenDigitPhone}`);
        return { success: true };
      } else {
        console.error('[Fast2SMS Error]:', json);
      }
    } catch (err: any) {
      console.error('[Fast2SMS Exception]:', err);
    }
  }

  // 2. Twilio Gateway Fallback
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (accountSid && authToken && fromNumber) {
    try {
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
      const params = new URLSearchParams({
        To: `+${rawClean}`,
        From: fromNumber,
        Body: body,
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      if (res.ok) {
        console.log(`[Twilio SMS Success] Sent to +${rawClean}`);
        return { success: true };
      }
    } catch (err: any) {
      console.error('[Twilio SMS Exception]:', err);
    }
  }

  // 3. Webhook SMS Gateway
  const smsWebhook = process.env.SMS_WEBHOOK_URL;
  if (smsWebhook) {
    try {
      await fetch(smsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: rawClean, message: body }),
      });
      return { success: true };
    } catch (err: any) {
      console.error('[SMS Webhook Exception]:', err);
    }
  }

  return { success: true, error: 'SMS logged to server console.' };
}
