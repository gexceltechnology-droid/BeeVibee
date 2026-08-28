import { NextResponse } from 'next/server';
import { getBookingById, getAllBookings } from '@/lib/firestore';
import { readDb } from '@/lib/db';

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

    // 1. Try fetching directly from Firestore by Document ID
    let booking = await getBookingById(cleanId);

    // 2. Case-insensitive search across Firestore bookings
    if (!booking) {
      const allFirestoreBookings = await getAllBookings();
      booking = allFirestoreBookings.find(
        (b) => b.id.toLowerCase() === cleanId.toLowerCase()
      ) || null;
    }

    // 3. Fallback to local database if not found in Firestore
    if (!booking) {
      const db = readDb();
      booking = db.bookings.find(
        (b) => b.id.toLowerCase() === cleanId.toLowerCase()
      ) || null;
    }

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
