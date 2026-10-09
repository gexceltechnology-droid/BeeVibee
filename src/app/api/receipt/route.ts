import { NextResponse } from 'next/server';
import { getBookingById } from '@/lib/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('id');

  if (!bookingId) {
    return NextResponse.json(
      { error: 'Missing booking ID parameter (id)' },
      { status: 400 }
    );
  }

  try {
    const cleanId = bookingId.trim();

    // Fetch directly using getBookingById (which includes fallback handling)
    const booking = await getBookingById(cleanId);

    if (!booking) {
      return NextResponse.json(
        { error: `Booking receipt not found for ID ${bookingId}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Error fetching booking receipt:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
