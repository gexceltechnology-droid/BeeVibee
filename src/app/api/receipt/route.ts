import { NextResponse } from 'next/server';
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

  const db = readDb();
  const booking = db.bookings.find(
    (b) => b.id.toLowerCase() === bookingId.trim().toLowerCase()
  );

  if (!booking) {
    return NextResponse.json(
      { error: `Booking receipt not found for ID ${bookingId}` },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, booking });
}
