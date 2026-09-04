/**
 * Client-safe WhatsApp utilities (No Node.js / nodemailer server dependencies)
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
  createdAt?: string | Date;
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
  advancePaid?: number;
  balanceDue?: number;
  paymentStatus?: string;
  paymentMode?: string;
  utrNumber?: string;
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
  while (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
}

/**
 * Format structured notification for admin when a new food order is placed
 */
export function formatFoodOrderWhatsAppMessage(order: FoodOrderData): string {
  const itemsText = (order.items || [])
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
  const advance = typeof booking.advancePaid === 'number' ? booking.advancePaid : 500;
  const balance = typeof booking.balanceDue === 'number' ? booking.balanceDue : Math.max(0, booking.totalPrice - advance);
  const utrText = booking.utrNumber ? `\n🧾 UPI Ref / UTR: ${booking.utrNumber}` : '';

  return (
    `🎉 NEW BOOKING ALERT - BEE VIBE 🎉\n` +
    `----------------------------------------\n` +
    `📢 Customer ${booking.customerName} has booked a slot for ${booking.date} at ${booking.timeSlot}!\n` +
    `----------------------------------------\n` +
    `🆔 Ticket Code: #${booking.id}\n` +
    `👤 Guest Name: ${booking.customerName}\n` +
    `📞 Phone Number: +${cleanPhoneNumber(booking.phone)}\n` +
    `📧 Email: ${booking.email}\n` +
    `🎭 Theme Package: ${booking.packageName}\n` +
    `📅 Date: ${booking.date}\n` +
    `⏰ Time Slot: ${booking.timeSlot}\n` +
    `👥 Guests: ${booking.guestCount} Head(s)${addOnsText}\n` +
    `----------------------------------------\n` +
    `💰 Total Price: ₹${booking.totalPrice}\n` +
    `🟢 Advance Received: ₹${advance} (UPI: 8123635342@sbi)\n` +
    `⏳ Balance Due at Venue: ₹${balance}${utrText}\n` +
    `----------------------------------------\n` +
    `Reservation confirmed! Staff: please verify UTR against SBI bank statement.`
  );
}

/**
 * Utility to generate a 1-click WhatsApp wa.me deep-link to Admin (+919900106474)
 */
export function getAdminWhatsAppDeepLink(
  type: 'food_order' | 'booking',
  data: FoodOrderData | BookingData
): string {
  const adminPhone = getAdminWhatsAppNumber();
  const message =
    type === 'food_order'
      ? formatFoodOrderWhatsAppMessage(data as FoodOrderData)
      : formatBookingWhatsAppMessage(data as BookingData);

  return `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
}
