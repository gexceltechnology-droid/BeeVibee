import { NextRequest, NextResponse } from 'next/server';
import { readDb, addBooking, updateBookingStatus } from '@/lib/db';
import { parseTimeRange } from '@/lib/time';
import { sendBookingConfirmationEmail } from '@/lib/mail';
import { sendSMS } from '@/lib/sms';

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

    // Ensure date/time has not already passed (relative to Asia/Kolkata timezone)
    const todayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const yyyy = todayIST.getFullYear();
    const mm = String(todayIST.getMonth() + 1).padStart(2, '0');
    const dd = String(todayIST.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (date < todayStr) {
      return NextResponse.json({ error: 'Cannot book slots on a past date.' }, { status: 400 });
    }

    if (date === todayStr) {
      try {
        const { startMinutes } = parseTimeRange(timeSlot);
        const currentMinutes = todayIST.getHours() * 60 + todayIST.getMinutes();
        if (startMinutes <= currentMinutes) {
          return NextResponse.json({ error: 'The selected time slot has already passed.' }, { status: 400 });
        }
      } catch (err) {
        return NextResponse.json({ error: 'The selected time slot is invalid.' }, { status: 400 });
      }
    }

    // Parse slot duration to perform accurate pro-rata package calculations
    let durationHours = 2;
    try {
      const { startMinutes, endMinutes } = parseTimeRange(timeSlot);
      let durationMinutes = endMinutes - startMinutes;
      if (durationMinutes <= 0) {
        durationMinutes += 24 * 60;
      }
      durationHours = durationMinutes / 60;
    } catch (err) {
      return NextResponse.json({ error: 'The selected time slot is invalid.' }, { status: 400 });
    }
    
    // Dynamic theme package pricing
    const PACKAGES_PRICE_MAP: Record<string, number> = {
      'Pink Theme': 799,
      'Purple Theme': 999,
      'Red Theme': 599
    };
    const packagePrice = PACKAGES_PRICE_MAP[packageName] || 0;
    const pkgBase = Math.round((packagePrice / 2) * durationHours);

    // Extra guest pricing (base includes 2 guests, extra guests are ₹100/head)
    const extraGuests = numericGuestCount > 2 ? (numericGuestCount - 2) * 100 : 0;

    // Addons pricing
    let addonsTotal = 0;
    for (const addon of (addOns || [])) {
      const nameStr = String(addon);
      if (nameStr.startsWith('DSLR Camera Coverage')) {
        const match = nameStr.match(/\((\d+)\s*Hour/);
        const hours = match ? parseInt(match[1], 10) : 1;
        addonsTotal += 500 * hours;
      } else if (nameStr.startsWith('Special Fog Entry Effect') || nameStr.startsWith('Special Fog')) {
        addonsTotal += 300;
      }
    }

    const calculatedTotal = pkgBase + extraGuests + addonsTotal;
    if (Number(totalPrice) !== calculatedTotal) {
      return NextResponse.json({ 
        error: `Booking price mismatch. Expected: ₹${calculatedTotal}, Got: ₹${totalPrice}. Please refresh and try again.` 
      }, { status: 400 });
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

    // Send confirmation email asynchronously (non-blocking)
    try {
      await sendBookingConfirmationEmail(newBooking);
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
    }

    // Send confirmation SMS asynchronously (non-blocking)
    try {
      const messageBody = `Your Bee Vibe booking is confirmed!\n\nTicket Code: ${newBooking.id}\nDate: ${newBooking.date}\nTime: ${newBooking.timeSlot}\n\nPresent this code at the entrance. Thank you!`;
      await sendSMS(newBooking.phone, messageBody);
    } catch (smsError) {
      console.error('Failed to send booking confirmation SMS:', smsError);
    }

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

    // Send confirmation SMS if slot is confirmed
    if (status === 'confirmed') {
      try {
        const messageBody = `Your Bee Vibe booking is confirmed!\n\nTicket Code: ${updatedBooking.id}\nDate: ${updatedBooking.date}\nTime: ${updatedBooking.timeSlot}\n\nPresent this code at the entrance. Thank you!`;
        await sendSMS(updatedBooking.phone, messageBody);
      } catch (smsError) {
        console.error('Failed to send booking confirmation SMS:', smsError);
      }
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}

