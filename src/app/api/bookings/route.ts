import { NextRequest, NextResponse } from 'next/server';
import { readDb, addBooking, updateBookingStatus } from '@/lib/db';

function isAuthorized(request: NextRequest): boolean {
  const passcode = request.headers.get('X-Admin-Passcode');
  const serverPasscode = process.env.ADMIN_PASSCODE || 'beevibe2026';
  return passcode === serverPasscode;
}

// GET all bookings (Admin endpoint)
export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const db = readDb();
    // Sort by booking date (newest first)
    const sortedBookings = [...db.bookings].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
    return NextResponse.json({ bookings: sortedBookings });
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, email, phone, date, timeSlot, packageName, addOns, totalPrice, guestCount, specialRequests } = body;

    // Basic validation
    if (!customerName || !email || !phone || !date || !timeSlot || !packageName || totalPrice === undefined || !guestCount) {
      return NextResponse.json({ error: 'Missing required booking fields.' }, { status: 400 });
    }

    const trimmedName = String(customerName).trim();
    const trimmedEmail = String(email).trim();
    const trimmedPhone = String(phone).trim();

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      return NextResponse.json({ error: 'Name, email, and phone cannot be empty.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    const numericGuestCount = Number(guestCount);
    if (isNaN(numericGuestCount) || numericGuestCount < 1 || numericGuestCount > 10) {
      return NextResponse.json({ error: 'Guest count must be between 1 and 10.' }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD.' }, { status: 400 });
    }

    // Double check database to verify slot status
    const db = readDb();
    const existingSlot = db.timeSlots.find((s) => s.time === timeSlot);
    if (!existingSlot) {
      return NextResponse.json({ error: 'The selected time slot is invalid.' }, { status: 400 });
    }

    // Recalculate price on the server to prevent tampering
    const slotBase = existingSlot.basePrice;
    
    const PACKAGES_PRICE_MAP: Record<string, number> = {
      'Movie Vibe Pack': 999,
      'Birthday Bash Vibe': 1999,
      'Cozy Romance Vibe': 2499,
      'Ultimate Gaming Vibe': 1499
    };
    const pkgBase = PACKAGES_PRICE_MAP[packageName] || 0;

    const ADDONS_PRICE_MAP: Record<string, number> = {
      'Fresh Rose Bouquet': 499,
      'Gourmet Nachos & Dip Platter': 349,
      '1kg Red Velvet Designer Cake': 1199,
      '30-Mins Photo Shoot & Digital Copy': 1499,
      'Extra Premium Helium Balloons (x30)': 799,
      'Special Screen Entry Fog Effect': 599
    };
    const addonsTotal = (addOns || []).reduce((sum: number, addonName: string) => {
      return sum + (ADDONS_PRICE_MAP[addonName] || 0);
    }, 0);

    const calculatedTotal = slotBase + pkgBase + addonsTotal;
    if (Number(totalPrice) !== calculatedTotal) {
      return NextResponse.json({ error: 'Booking price mismatch. Please refresh and try again.' }, { status: 400 });
    }

    const newBooking = addBooking({
      customerName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      date,
      timeSlot,
      packageName,
      addOns: addOns || [],
      totalPrice: calculatedTotal,
      guestCount: numericGuestCount,
      specialRequests: specialRequests || '',
    });

    return NextResponse.json({ success: true, booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}

// PUT update booking status (Admin endpoint)
export async function PUT(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required.' }, { status: 400 });
    }

    if (status !== 'pending' && status !== 'confirmed' && status !== 'cancelled') {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    const updatedBooking = updateBookingStatus(id, status);
    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}

