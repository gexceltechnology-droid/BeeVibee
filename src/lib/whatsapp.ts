import { sendSMS } from './sms';
import { sendAdminNotificationEmail } from './mail';
import {
  FoodOrderItem,
  FoodOrderData,
  BookingData,
  getAdminWhatsAppNumber,
  cleanPhoneNumber,
  formatFoodOrderWhatsAppMessage,
  formatBookingWhatsAppMessage,
  getAdminWhatsAppDeepLink,
} from './whatsappUtils';

export type { FoodOrderItem, FoodOrderData, BookingData };
export {
  getAdminWhatsAppNumber,
  cleanPhoneNumber,
  formatFoodOrderWhatsAppMessage,
  formatBookingWhatsAppMessage,
  getAdminWhatsAppDeepLink,
};

/**
 * Twilio WhatsApp Sender
 */
export async function sendWhatsAppViaTwilio(
  toPhone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  // Use explicit TWILIO_WHATSAPP_NUMBER, or TWILIO_FROM_NUMBER, or default to Twilio Sandbox (+14155238886)
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_FROM_NUMBER || '14155238886';

  if (!accountSid || !authToken) {
    console.log(`[Twilio WhatsApp] Credentials not configured yet.`);
    return { success: false, error: 'Twilio WhatsApp credentials not configured.' };
  }

  try {
    const cleanTo = cleanPhoneNumber(toPhone);
    const cleanFrom = cleanPhoneNumber(fromNumber);
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', `whatsapp:+${cleanTo}`);
    params.append('From', `whatsapp:+${cleanFrom}`);
    params.append('Body', message);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (res.ok) {
      console.log(`[Twilio WhatsApp Success] WhatsApp message delivered to +${cleanTo}`);
      return { success: true };
    } else {
      const errText = await res.text();
      console.error('[Twilio WhatsApp Error]:', errText);
      return { success: false, error: errText };
    }
  } catch (err: any) {
    console.error('[Twilio WhatsApp Exception]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Server-side CallMeBot WhatsApp Sender (Free instant WhatsApp gateway)
 */
export async function sendWhatsAppViaCallMeBot(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (!apiKey) return { success: false, error: 'CALLMEBOT_API_KEY not configured' };

  try {
    const cleanPhone = cleanPhoneNumber(phone);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      console.log(`[CallMeBot] Direct WhatsApp message sent to +${cleanPhone}`);
      return { success: true };
    } else {
      const text = await res.text();
      console.error('CallMeBot Error:', text);
      return { success: false, error: text };
    }
  } catch (err: any) {
    console.error('CallMeBot Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * UltraMsg Direct WhatsApp Sender
 */
export async function sendWhatsAppViaUltraMsg(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;
  if (!instanceId || !token) return { success: false, error: 'UltraMsg credentials not configured' };

  try {
    const cleanTo = cleanPhoneNumber(phone);
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;
    const params = new URLSearchParams();
    params.append('token', token);
    params.append('to', cleanTo);
    params.append('body', message);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (res.ok) {
      console.log(`[UltraMsg WhatsApp Success] Sent to +${cleanTo}`);
      return { success: true };
    } else {
      const errText = await res.text();
      console.error('[UltraMsg Error]:', errText);
      return { success: false, error: errText };
    }
  } catch (err: any) {
    console.error('[UltraMsg Exception]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Meta Official WhatsApp Cloud API Sender
 */
export async function sendWhatsAppViaMetaCloudApi(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const phoneId = process.env.META_WHATSAPP_PHONE_ID || '1222802444258603';
  const token =
    process.env.META_WHATSAPP_TOKEN ||
    'EAATYLBQrVNoBSIGoCLXxWLxlxppFH2rNRxuuogTLtBDdmgzmmHvYjiImy9gEkCzTUd64qpAhPMiqtsiPgKyHxmelrdF4WtASecRG7D739Q5Ik18Q0ZCBHcwHsF8t8PZCydUvgOAd0nDMOkypUZBivu0nvyjaYFYEZAGgpXSB3d3PyC25KDh6hJKs5sIpYFQvKyhrEEZCp3Mv7tV77edjwu7ZBx3kkgfZCp4WZBjJZAxGhninxstE6tVgjZCL7wKGL3UV7uCHAZAFJGB4eSxLYwuFHIL';
  if (!phoneId || !token) return { success: false, error: 'Meta WhatsApp Cloud API not configured' };

  try {
    const cleanTo = cleanPhoneNumber(phone);
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'text',
        text: { preview_url: false, body: message },
      }),
    });

    if (res.ok) {
      console.log(`[Meta WhatsApp Cloud API Success] Sent to +${cleanTo}`);
      return { success: true };
    } else {
      const errText = await res.text();
      console.error('[Meta WhatsApp Cloud API Error]:', errText);
      return { success: false, error: errText };
    }
  } catch (err: any) {
    console.error('[Meta WhatsApp Cloud API Exception]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Server-side Generic Webhook WhatsApp Gateway
 */
export async function sendWhatsAppViaWebhook(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, error: 'WHATSAPP_WEBHOOK_URL not configured' };

  try {
    const cleanTo = cleanPhoneNumber(phone);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: cleanTo,
        message,
        timestamp: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      console.log(`[WhatsApp Webhook] Direct message dispatched for +${cleanTo}`);
      return { success: true };
    }
    return { success: false, error: 'Webhook response not ok' };
  } catch (err: any) {
    console.error('WhatsApp Webhook Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Automatically notifies Admin Phone, WhatsApp & Email (+919900106474) on new Food Orders & Bookings
 */
export async function notifyAdminOnWhatsAppAndSMS(
  type: 'food_order' | 'booking',
  data: FoodOrderData | BookingData
): Promise<void> {
  const adminPhone = getAdminWhatsAppNumber(); // 919900106474
  const message =
    type === 'food_order'
      ? formatFoodOrderWhatsAppMessage(data as FoodOrderData)
      : formatBookingWhatsAppMessage(data as BookingData);

  const subject =
    type === 'food_order'
      ? `🍿 NEW FOOD ORDER ALERT #${data.id} - Bee Vibe`
      : `🎉 NEW BOOKING ALERT #${data.id} - Bee Vibe`;

  console.log(`\n==================================================`);
  console.log(`[AUTOMATED ADMIN ALERT -> +${adminPhone}]`);
  console.log(message);
  console.log(`==================================================\n`);

  // Execute all admin alert channels in parallel asynchronously
  Promise.allSettled([
    // 1. Mobile SMS Alert
    sendSMS(adminPhone, message).catch((e) => console.error('[SMS Alert Error]:', e)),

    // 2. WhatsApp Meta Cloud API
    sendWhatsAppViaMetaCloudApi(adminPhone, message).catch((e) => console.error('[Meta WA Error]:', e)),

    // 3. WhatsApp CallMeBot
    sendWhatsAppViaCallMeBot(adminPhone, message).catch((e) => console.error('[CallMeBot Error]:', e)),

    // 4. WhatsApp UltraMsg
    sendWhatsAppViaUltraMsg(adminPhone, message).catch((e) => console.error('[UltraMsg Error]:', e)),

    // 5. WhatsApp Webhook
    sendWhatsAppViaWebhook(adminPhone, message).catch((e) => console.error('[WA Webhook Error]:', e)),

    // 6. Admin Email Alert
    sendAdminNotificationEmail(
      subject,
      `<pre style="font-family: monospace; font-size: 14px; background: #121217; color: #f2a900; padding: 20px; border-radius: 8px;">${message}</pre>`
    ).catch((e) => console.error('[Email Alert Error]:', e)),
  ]);
}
