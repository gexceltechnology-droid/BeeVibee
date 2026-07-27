import { sendSMS } from './sms';
import { sendAdminNotificationEmail } from './mail';

/**
 * WhatsApp Helper Module for BeeVibe Food Orders & Room Bookings
 */

export interface FoodOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface FoodOrderData {
  id: string;
  theme: string;
  themeLabel: string;
  customerName?: string;
  phone?: string;
  items: FoodOrderItem[];
  totalPrice: number;
  createdAt?: any;
}

export interface BookingData {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  packageName: string;
  addOns?: string[];
  totalPrice: number;
  guestCount: number;
  specialRequests?: string;
}

export function getAdminWhatsAppNumber(): string {
  const envPhone = process.env.ADMIN_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '919900106474';
  const clean = envPhone.replace(/\D/g, '');
  return clean.length === 10 ? '91' + clean : clean;
}

export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.trim().replace(/\D/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
}

/**
 * Format structured notification for admin when a new food order is placed
 */
export function formatFoodOrderWhatsAppMessage(order: FoodOrderData): string {
  const itemsText = order.items
    .map((item) => `• ${item.name} × ${item.quantity} (₹${item.price * item.quantity})`)
    .join('\n');

  const guestInfo = order.customerName ? `${order.customerName}` : 'In-Room Guest';
  const phoneText = order.phone ? `\n📞 Guest Phone: +${cleanPhoneNumber(order.phone)}` : '';

  return (
    `🍿 NEW IN-THEATER FOOD ORDER 🍿\n` +
    `----------------------------------------\n` +
    `🆔 Order ID: #${order.id}\n` +
    `🎭 Room: ${order.themeLabel}\n` +
    `👤 Customer: ${guestInfo}${phoneText}\n` +
    `----------------------------------------\n` +
    `📋 ITEMS ORDERED:\n` +
    `${itemsText}\n` +
    `----------------------------------------\n` +
    `💰 TOTAL PRICE: ₹${order.totalPrice}\n` +
    `----------------------------------------\n` +
    `Please prepare and deliver to room!`
  );
}

/**
 * Format structured notification for admin when a new room booking is placed
 */
export function formatBookingWhatsAppMessage(booking: BookingData): string {
  const addOnsText = booking.addOns && booking.addOns.length > 0 ? `\n🎁 Add-ons: ${booking.addOns.join(', ')}` : '';

  return (
    `🎉 NEW ROOM BOOKING - BEE VIBE 🎉\n` +
    `----------------------------------------\n` +
    `🆔 Booking ID: #${booking.id}\n` +
    `👤 Guest: ${booking.customerName}\n` +
    `📞 Phone: +${cleanPhoneNumber(booking.phone)}\n` +
    `📧 Email: ${booking.email}\n` +
    `🎭 Theme: ${booking.packageName}\n` +
    `📅 Date: ${booking.date}\n` +
    `⏰ Time Slot: ${booking.timeSlot}\n` +
    `👥 Guests: ${booking.guestCount} Head(s)${addOnsText}\n` +
    `----------------------------------------\n` +
    `💰 Total Price: ₹${booking.totalPrice}\n` +
    `----------------------------------------\n` +
    `Reservation logged & confirmed in system!`
  );
}

/**
 * Server-side Twilio WhatsApp API sender
 */
export async function sendWhatsAppViaTwilio(
  toPhone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox or sender number

  if (!accountSid || !authToken) {
    console.log(`[WhatsApp Server] Twilio credentials not configured.`);
    return { success: false, error: 'Twilio credentials missing.' };
  }

  try {
    const cleanTo = cleanPhoneNumber(toPhone);
    const toFormatted = `whatsapp:+${cleanTo}`;
    const fromFormatted = whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`;

    const basicAuth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: toFormatted,
          From: fromFormatted,
          Body: message,
        }).toString(),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      console.error('Twilio WhatsApp API Error:', data);
      return { success: false, error: data.message || 'Twilio WhatsApp API error.' };
    }

    console.log(`[WhatsApp Server] Notification sent via Twilio to +${cleanTo}. SID: ${data.sid}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending WhatsApp via Twilio:', error);
    return { success: false, error: error.message };
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
    const url = `https://api.callmebot.com/whatsapp.php?phone=+${cleanPhone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;
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
  console.log(`[AUTOMATED ADMIN MULTI-CHANNEL ALERT -> +${adminPhone}]`);
  console.log(message);
  console.log(`==================================================\n`);

  // Run all dispatch channels concurrently
  await Promise.allSettled([
    // 1. Twilio SMS
    sendSMS(`+${adminPhone}`, message),

    // 2. Twilio WhatsApp
    sendWhatsAppViaTwilio(adminPhone, message),

    // 3. CallMeBot WhatsApp (if key provided)
    sendWhatsAppViaCallMeBot(adminPhone, message),

    // 4. Custom WhatsApp Webhook (if URL provided)
    sendWhatsAppViaWebhook(adminPhone, message),

    // 5. Instant Admin Email Alert
    sendAdminNotificationEmail(subject, `<pre style="font-family: monospace; font-size: 14px; background: #121217; color: #f2a900; padding: 20px; border-radius: 8px;">${message}</pre>`),
  ]);
}
