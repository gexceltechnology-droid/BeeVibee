import { NextRequest, NextResponse } from 'next/server';
import { readDb, getBookingsByDate } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return NextResponse.json({ error: 'A valid date parameter (YYYY-MM-DD) is required.' }, { status: 400 });
    }

    const db = readDb();
    const bookings = getBookingsByDate(date);
    
    // Map time slots and determine which ones are booked
    const slotsWithAvailability = db.timeSlots.map((slot) => {
      const isBooked = bookings.some((b) => b.timeSlot === slot.time);
      return {
        ...slot,
        isBooked,
      };
    });

    return NextResponse.json({ slots: slotsWithAvailability });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
