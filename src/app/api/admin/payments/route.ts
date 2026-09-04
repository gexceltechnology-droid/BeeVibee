import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { getAllBookings, updateBookingPaymentVerificationInFirestore } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const bookings = await getAllBookings();
    return NextResponse.json({ success: true, bookings });
  } catch (error: any) {
    console.error('Error fetching admin payments:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, sbiVerified, balanceCollected, adminNotes, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Booking ID is required.' }, { status: 400 });
    }

    const updated = await updateBookingPaymentVerificationInFirestore(id, {
      sbiVerified,
      balanceCollected,
      adminNotes,
      status,
    });

    return NextResponse.json({ success: true, booking: updated });
  } catch (error: any) {
    console.error('Error updating payment reconciliation:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
