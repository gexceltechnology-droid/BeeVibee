import { NextRequest, NextResponse } from 'next/server';
import { getBookingsByPhone } from '@/lib/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const trimmedPhone = String(phone).trim();
    const customerBookings = await getBookingsByPhone(trimmedPhone);

    return NextResponse.json({ bookings: customerBookings });
  } catch (error: any) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
