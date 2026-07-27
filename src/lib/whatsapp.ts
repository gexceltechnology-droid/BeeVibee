import { sendSMS } from './sms';

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
 * Format message for customer order acceptance
 */
export function formatCustomerAcceptanceWhatsAppMessage(order: FoodOrderData): string {
  const itemsSummary = order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');

  return (
    `✅ *BeeVibe Order Accepted!*\n\n` +
    `Hi ${order.customerName || 'Guest'}, your food order *#${order.id}* for *${order.themeLabel}* has been accepted and is being prepared! 🍿🥤\n\n` +
    `📋 *Items*: ${itemsSummary}\n` +
    `💰 *Total Amount*: ₹${order.totalPrice}\n\n` +
    `Our staff will serve it directly to your room shortly. Enjoy your vibe! 🎉`
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
  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_FROM_NUMBER; // e.g. "whatsapp:+16088090974"

  if (!accountSid || !authToken || !whatsappFrom) {
    console.log(`[WhatsApp Server] Twilio WhatsApp credentials not configured.`);
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
 * Automatically notifies Admin Phone & WhatsApp (+919900106474) on new Food Orders & Bookings
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

  console.log(`\n==================================================`);
  console.log(`[AUTOMATED ADMIN NOTIFICATION -> +${adminPhone}]`);
  console.log(message);
  console.log(`==================================================\n`);

  // 1. Dispatch SMS via Twilio directly to Admin +919900106474
  try {
    await sendSMS(`+${adminPhone}`, message);
  } catch (err) {
    console.error('Failed sending Admin SMS alert:', err);
  }

  // 2. Dispatch WhatsApp via Twilio directly to Admin +919900106474
  try {
    await sendWhatsAppViaTwilio(adminPhone, message);
  } catch (err) {
    console.error('Failed sending Admin WhatsApp alert:', err);
  }
}
