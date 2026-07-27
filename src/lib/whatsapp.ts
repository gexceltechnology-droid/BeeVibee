/**
 * WhatsApp Helper Module for BeeVibe Food Orders & Notifications
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
 * Format structured WhatsApp message for staff/kitchen when a new food order is placed
 */
export function formatFoodOrderWhatsAppMessage(order: FoodOrderData): string {
  const itemsText = order.items
    .map((item) => `• ${item.name} × ${item.quantity} (₹${item.price * item.quantity})`)
    .join('\n');

  const guestInfo = order.customerName ? `${order.customerName}` : 'In-Room Guest';
  const phoneText = order.phone ? `\n📞 *Guest Phone*: +${cleanPhoneNumber(order.phone)}` : '';

  return (
    `🍿 *NEW IN-THEATER FOOD ORDER* 🍿\n` +
    `----------------------------------------\n` +
    `🆔 *Order ID*: #${order.id}\n` +
    `🎭 *Party Hall*: ${order.themeLabel}\n` +
    `👤 *Customer*: ${guestInfo}${phoneText}\n` +
    `----------------------------------------\n` +
    `📋 *ITEMS ORDERED*:\n` +
    `${itemsText}\n` +
    `----------------------------------------\n` +
    `💰 *TOTAL PRICE*: ₹${order.totalPrice}\n` +
    `----------------------------------------\n` +
    ` Please confirm and prepare this order!`
  );
}

/**
 * Format structured WhatsApp message to notify customer that their order has been accepted
 */
export function formatCustomerAcceptanceWhatsAppMessage(order: FoodOrderData): string {
  const itemsSummary = order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');

  return (
    `✅ *BeeVibe Order Accepted!*\n\n` +
    `Hi ${order.customerName || 'Guest'}, your food order *#${order.id}* for the *${order.themeLabel}* has been accepted and is currently being prepared! 🍿🥤\n\n` +
    `📋 *Items*: ${itemsSummary}\n` +
    `💰 *Total Amount*: ₹${order.totalPrice}\n\n` +
    `Our staff will serve it directly to your private party room shortly. Enjoy your vibe! 🎉`
  );
}

/**
 * Generates direct WhatsApp deep link (wa.me) for web or mobile
 */
export function generateWhatsAppUrl(phone: string, text: string): string {
  const cleanPhone = cleanPhoneNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
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
  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER; // e.g. "whatsapp:+14155238886"

  if (!accountSid || !authToken || !whatsappFrom) {
    console.log(`[WhatsApp Server] Twilio WhatsApp credentials not configured. Direct WA links are available on client.`);
    return { success: false, error: 'Twilio WhatsApp credentials missing in server environment.' };
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

    console.log(`[WhatsApp Server] Message sent via Twilio to ${toFormatted}. SID: ${data.sid}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error sending WhatsApp message via Twilio:', error);
    return { success: false, error: error.message };
  }
}
