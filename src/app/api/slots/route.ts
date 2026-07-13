import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { checkBookingOverlap } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return NextResponse.json({ error: 'A valid date parameter (YYYY-MM-DD) is required.' }, { status: 400 });
    }

    const db = readDb();
    
    // Map time slots and determine which ones are booked using smart overlap checks
    const slotsWithAvailability = db.timeSlots.map((slot) => {
      const isBooked = checkBookingOverlap(date, slot.time, db.bookings);
      return {
        ...slot,
        isBooked,
      };
    });

    // Return the list of all active bookings so that client-side overlap checks can be performed
    const activeBookings = db.bookings
      .filter((b) => b.status !== 'cancelled')
      .map((b) => ({
        id: b.id,
        date: b.date,
        timeSlot: b.timeSlot,
      }));

    return NextResponse.json({ 
      slots: slotsWithAvailability,
      activeBookings
    });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
