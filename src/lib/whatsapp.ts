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
): Promise<{ success: boolean; error?: string; data?: any }> {
  const phoneId = process.env.META_WHATSAPP_PHONE_ID || '1222802444258603';
  const token = process.env.META_WHATSAPP_TOKEN;
  const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME || 'hello_world';

  if (!phoneId || !token) {
    console.log('[Meta WhatsApp Cloud API] META_WHATSAPP_TOKEN is missing in environment variables.');
    return { success: false, error: 'META_WHATSAPP_TOKEN not configured in env.' };
  }

  try {
    const cleanTo = cleanPhoneNumber(phone);
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;

    // 1. Try sending plain text message
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
      const json = await res.json();
      console.log(`[Meta WhatsApp Cloud API Success] Text message sent to +${cleanTo}:`, json);
      return { success: true, data: json };
    }

    const initialErrText = await res.text();
    console.warn('[Meta WhatsApp Cloud API] Plain text attempt failed:', initialErrText);

    // 2. Fallback: If Meta rejects plain text (business-initiated outside 24h window), send template
    console.log(`[Meta WhatsApp Cloud API] Attempting template fallback ('${templateName}') for +${cleanTo}...`);
    
    // Prepare template parameters if custom template is configured
    const templateBody = templateName === 'hello_world' ? {
      name: 'hello_world',
      language: { code: 'en_US' },
    } : {
      name: templateName,
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: message.slice(0, 1000) }
          ]
        }
      ]
    };

    const templateRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: 'template',
        template: templateBody,
      }),
    });

    if (templateRes.ok) {
      const tmplJson = await templateRes.json();
      console.log(`[Meta WhatsApp Cloud API Template Success] Sent '${templateName}' to +${cleanTo}:`, tmplJson);
      return { success: true, data: tmplJson };
    } else {
      const errText = await templateRes.text();
      console.error('[Meta WhatsApp Cloud API Template Error]:', errText);
      return { success: false, error: `Meta Cloud API Error: ${errText}` };
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
 * Server-side Telegram Bot Notification Sender (100% free, instant push alerts)
 */
export async function sendTelegramNotification(
  message: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.log('[Telegram Alert] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured in env.');
    return { success: false, error: 'Telegram Bot credentials not configured in env.' };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    if (res.ok) {
      console.log(`[Telegram Alert Success] Instant alert delivered to Telegram Chat ${chatId}`);
      return { success: true };
    } else {
      const errText = await res.text();
      console.error('[Telegram Alert Error]:', errText);
      return { success: false, error: errText };
    }
  } catch (err: any) {
    console.error('[Telegram Alert Exception]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Automatically notifies Admin Phone, WhatsApp, Telegram & Email (+919900106474) on new Food Orders & Bookings
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

    // 2. Telegram Bot Instant Alert
    sendTelegramNotification(message).catch((e) => console.error('[Telegram Alert Error]:', e)),

    // 3. WhatsApp Meta Cloud API
    sendWhatsAppViaMetaCloudApi(adminPhone, message).catch((e) => console.error('[Meta WA Error]:', e)),

    // 4. WhatsApp CallMeBot
    sendWhatsAppViaCallMeBot(adminPhone, message).catch((e) => console.error('[CallMeBot Error]:', e)),

    // 5. WhatsApp UltraMsg
    sendWhatsAppViaUltraMsg(adminPhone, message).catch((e) => console.error('[UltraMsg Error]:', e)),

    // 6. WhatsApp Webhook
    sendWhatsAppViaWebhook(adminPhone, message).catch((e) => console.error('[WA Webhook Error]:', e)),

    // 7. Admin Email Alert
    sendAdminNotificationEmail(
      subject,
      `<pre style="font-family: monospace; font-size: 14px; background: #121217; color: #f2a900; padding: 20px; border-radius: 8px;">${message}</pre>`
    ).catch((e) => console.error('[Email Alert Error]:', e)),
  ]);
}

