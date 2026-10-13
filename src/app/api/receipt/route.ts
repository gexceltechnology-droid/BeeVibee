import { NextRequest, NextResponse } from 'next/server';
import { getBookingById } from '@/lib/firestore';
import { isAuthorized } from '@/lib/auth';
import { cleanPhoneNumber } from '@/lib/whatsappUtils';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user.substring(0, 2)}${'*'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length <= 4) return '******';
  return `******${digits.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('id');
  const verifyPhone = searchParams.get('phone');

  if (!bookingId) {
    return NextResponse.json(
      { error: 'Missing booking ID parameter (id)' },
      { status: 400 }
    );
  }

  try {
    const cleanId = bookingId.trim();
    const booking = await getBookingById(cleanId);

    if (!booking) {
      return NextResponse.json(
        { error: `Booking receipt not found for ID ${bookingId}` },
        { status: 404 }
      );
    }

    const isAdmin = isAuthorized(request);
    const cleanBookingPhone = cleanPhoneNumber(booking.phone);
    const cleanCallerPhone = verifyPhone ? cleanPhoneNumber(verifyPhone) : '';
    const isOwnerPhone = Boolean(cleanCallerPhone && cleanBookingPhone === cleanCallerPhone);

    // If neither admin nor verified customer phone, mask sensitive PII
    const sanitizedBooking = (isAdmin || isOwnerPhone)
      ? booking
      : {
          ...booking,
          phone: maskPhone(booking.phone),
          email: maskEmail(booking.email),
        };

    return NextResponse.json({ success: true, booking: sanitizedBooking });
  } catch (error: any) {
    console.error('Error fetching booking receipt:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

