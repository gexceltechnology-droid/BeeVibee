import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, getTimeSlots } from '@/lib/firestore';
import { checkBookingOverlap, normalizeRoomId, RoomId } from '@/lib/time';

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
    const roomParam = searchParams.get('roomId') || searchParams.get('room') || searchParams.get('theme') || searchParams.get('package') || '';
    const type = (searchParams.get('type') || searchParams.get('category') || '').toLowerCase();

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!date || !dateRegex.test(date)) {
      return NextResponse.json({ error: 'A valid date parameter (YYYY-MM-DD) is required.' }, { status: 400 });
    }

    const isGaming = type === 'gaming' || roomParam.toLowerCase().includes('gaming') || roomParam.toLowerCase().includes('ps5');
    const targetRoomId: RoomId = normalizeRoomId(roomParam || (isGaming ? 'ps5-gaming' : 'angel-wings'));

    const [theaterSlots, allBookings] = await Promise.all([getTimeSlots(), getAllBookings()]);

    const baseSlots = (targetRoomId === 'ps5-gaming' || isGaming) ? GAMING_1HR_SLOTS : theaterSlots;

    // Filter bookings to ONLY the requested private suite / theme
    const roomBookings = allBookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      return normalizeRoomId(b) === targetRoomId;
    });

    // Helper to calculate start minutes of a time slot (e.g., "10:00 AM - 12:00 PM" -> 600)
    const parseSlotStartMinutes = (slotTimeStr: string): number => {
      const match = slotTimeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();

      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      return hours * 60 + minutes;
    };

    // Sort slots chronologically from morning to night
    const sortedBaseSlots = [...baseSlots].sort(
      (a, b) => parseSlotStartMinutes(a.time) - parseSlotStartMinutes(b.time)
    );

    // Current IST date and time
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const isToday = date === todayIST;

    const istParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(new Date());
    const currentHour = parseInt(istParts.find((p) => p.type === 'hour')?.value || '0', 10);
    const currentMin = parseInt(istParts.find((p) => p.type === 'minute')?.value || '0', 10);
    const currentMinutes = currentHour * 60 + currentMin;

    // If today, filter out slots that have already started or passed
    const activeSlots = isToday
      ? sortedBaseSlots.filter((slot) => parseSlotStartMinutes(slot.time) > currentMinutes)
      : sortedBaseSlots;

    // Map time slots and determine which ones are booked in the selected room using smart overlap checks
    const slotsWithAvailability = activeSlots.map((slot) => {
      const isBooked = checkBookingOverlap(date, slot.time, roomBookings);
      return { ...slot, isBooked };
    });

    // Return active bookings for client-side overlap checks
    const activeBookings = roomBookings.map((b) => ({ id: b.id, date: b.date, timeSlot: b.timeSlot }));

    // Also build a full map of availability for all 4 rooms so any UI can read other rooms
    const ALL_ROOM_IDS: RoomId[] = ['angel-wings', 'red-velvet', 'royal-butterfly', 'ps5-gaming'];
    const roomsAvailability: Record<string, { slots: typeof slotsWithAvailability; activeBookings: typeof activeBookings }> = {};
    for (const rid of ALL_ROOM_IDS) {
      const suiteSlots = (rid === 'ps5-gaming') ? GAMING_1HR_SLOTS : theaterSlots;
      const sorted = [...suiteSlots].sort(
        (a, b) => parseSlotStartMinutes(a.time) - parseSlotStartMinutes(b.time)
      );
      const filtered = isToday
        ? sorted.filter((slot) => parseSlotStartMinutes(slot.time) > currentMinutes)
        : sorted;
      const bList = allBookings.filter((b) => b.status !== 'cancelled' && normalizeRoomId(b) === rid);
      roomsAvailability[rid] = {
        slots: filtered.map((slot) => ({
          ...slot,
          isBooked: checkBookingOverlap(date, slot.time, bList),
        })),
        activeBookings: bList.map((b) => ({ id: b.id, date: b.date, timeSlot: b.timeSlot })),
      };
    }

    return NextResponse.json({
      roomId: targetRoomId,
      slots: slotsWithAvailability,
      activeBookings,
      roomsAvailability,
    });
  } catch (error: any) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
