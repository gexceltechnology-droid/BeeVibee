import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByPhone } from '@/lib/firestore';
import { isAuthorized } from '@/lib/auth';

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

function maskUtr(utr?: string): string | undefined {
  if (!utr) return undefined;
  const clean = utr.trim();
  if (clean.length <= 4) return '****';
  return `********${clean.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const trimmedPhone = String(phone).trim();
    const customerBookings = await getBookingsByPhone(trimmedPhone);

    const isAdmin = isAuthorized(request);

    // If admin is requesting, return full records; otherwise, return securely sanitized customer views
    const sanitizedBookings = customerBookings.map((b) => {
      if (isAdmin) return b;

      return {
        id: b.id,
        customerName: b.customerName,
        phone: maskPhone(b.phone),
        email: maskEmail(b.email),
        date: b.date,
        timeSlot: b.timeSlot,
        packageName: b.packageName,
        roomId: b.roomId,
        theme: b.theme,
        bookingType: b.bookingType,
        guestCount: b.guestCount,
        addOns: b.addOns,
        totalPrice: b.totalPrice,
        advancePaid: b.advancePaid,
        balanceDue: b.balanceDue,
        paymentStatus: b.paymentStatus,
        paymentMode: b.paymentMode,
        utrNumber: maskUtr(b.utrNumber),
        status: b.status,
        createdAt: b.createdAt,
      };
    });

    return NextResponse.json({ bookings: sanitizedBookings });
  } catch (error: any) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
