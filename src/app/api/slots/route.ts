import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, getTimeSlots } from '@/lib/firestore';
import { checkBookingOverlap } from '@/lib/time';

const GAMING_1HR_SLOTS = [
  { id: 'gslot-1', time: '10:00 AM - 11:00 AM', label: 'Morning Slot 1', basePrice: 399 },
  { id: 'gslot-2', time: '11:00 AM - 12:00 PM', label: 'Morning Slot 2', basePrice: 399 },
  { id: 'gslot-3', time: '12:00 PM - 01:00 PM', label: 'Noon Slot', basePrice: 399 },
  { id: 'gslot-4', time: '01:00 PM - 02:00 PM', label: 'Matinee Slot 1', basePrice: 399 },
  { id: 'gslot-5', time: '02:00 PM - 03:00 PM', label: 'Matinee Slot 2', basePrice: 399 },
  { id: 'gslot-6', time: '03:00 PM - 04:00 PM', label: 'Afternoon Slot 1', basePrice: 399 },
  { id: 'gslot-7', time: '04:00 PM - 05:00 PM', label: 'Afternoon Slot 2', basePrice: 399 },
  { id: 'gslot-8', time: '05:00 PM - 06:00 PM', label: 'Sunset Slot 1', basePrice: 399 },
  { id: 'gslot-9', time: '06:00 PM - 07:00 PM', label: 'Sunset Slot 2', basePrice: 399 },
  { id: 'gslot-10', time: '07:00 PM - 08:00 PM', label: 'Prime Slot 1', basePrice: 399 },
  { id: 'gslot-11', time: '08:00 PM - 09:00 PM', label: 'Prime Slot 2', basePrice: 399 },
  { id: 'gslot-12', time: '09:00 PM - 10:00 PM', label: 'Night Slot 1', basePrice: 399 },
  { id: 'gslot-13', time: '10:00 PM - 11:00 PM', label: 'Night Slot 2', basePrice: 399 },
  { id: 'gslot-14', time: '11:00 PM - 12:00 AM', label: 'Midnight Slot', basePrice: 399 },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = (searchParams.get('type') || searchParams.get('category') || 'theater').toLowerCase();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return NextResponse.json({ error: 'A valid date parameter (YYYY-MM-DD) is required.' }, { status: 400 });
    }

    const [theaterSlots, allBookings] = await Promise.all([getTimeSlots(), getAllBookings()]);

    const isGaming = type === 'gaming';
    const baseSlots = isGaming ? GAMING_1HR_SLOTS : theaterSlots;

    // Filter bookings to only the requested room type
    const roomBookings = allBookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      const isBookingGaming = b.bookingType === 'gaming' || b.packageName?.includes('Gaming') || b.packageName?.includes('Dark');
      return isGaming ? isBookingGaming : !isBookingGaming;
    });

    // Map time slots and determine which ones are booked using smart overlap checks
    const slotsWithAvailability = baseSlots.map((slot) => {
      const isBooked = checkBookingOverlap(date, slot.time, roomBookings);
      return { ...slot, isBooked };
    });

    // Return active bookings for client-side overlap checks
    const activeBookings = roomBookings.map((b) => ({ id: b.id, date: b.date, timeSlot: b.timeSlot }));

    return NextResponse.json({ slots: slotsWithAvailability, activeBookings });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
