import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, getTimeSlots } from '@/lib/firestore';
import { checkBookingOverlap } from '@/lib/time';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return NextResponse.json({ error: 'A valid date parameter (YYYY-MM-DD) is required.' }, { status: 400 });
    }

    const [timeSlots, allBookings] = await Promise.all([getTimeSlots(), getAllBookings()]);

    // Map time slots and determine which ones are booked using smart overlap checks
    const slotsWithAvailability = timeSlots.map((slot) => {
      const isBooked = checkBookingOverlap(date, slot.time, allBookings);
      return { ...slot, isBooked };
    });

    // Return active bookings for client-side overlap checks
    const activeBookings = allBookings
      .filter((b) => b.status !== 'cancelled')
      .map((b) => ({ id: b.id, date: b.date, timeSlot: b.timeSlot }));

    return NextResponse.json({ slots: slotsWithAvailability, activeBookings });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
