import { NextRequest, NextResponse } from 'next/server';
import { readDb, addBooking, updateBookingStatus } from '@/lib/db';
import { parseTimeRange } from '@/lib/time';

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

    // Double check database to verify slot status
    const db = readDb();
    let slotBase = 0;

    const existingSlot = db.timeSlots.find((s) => s.time === timeSlot);
    if (existingSlot) {
      slotBase = existingSlot.basePrice;
    } else {
      // Check if it is a valid custom time range
      try {
        const { startMinutes, endMinutes } = parseTimeRange(timeSlot);
        let durationMinutes = endMinutes - startMinutes;
        if (durationMinutes <= 0) {
          durationMinutes += 24 * 60;
        }
        if (durationMinutes < 30) {
          return NextResponse.json({ error: 'Custom time slot must be at least 30 minutes.' }, { status: 400 });
        }
        const durationHours = durationMinutes / 60;
        slotBase = Math.round((durationHours / 2) * 999);
      } catch (err) {
        return NextResponse.json({ error: 'The selected time slot is invalid.' }, { status: 400 });
      }
    }
    
    const PACKAGES_PRICE_MAP: Record<string, number> = {
      'Movie Vibe Pack': 0,
      'Birthday Bash Vibe': 0,
      'Cozy Romance Vibe': 0,
      'Ultimate Gaming Vibe': 0
    };
    const pkgBase = PACKAGES_PRICE_MAP[packageName] || 0;

    const ADDONS_PRICE_MAP: Record<string, number> = {
      'Fresh Rose Bouquet': 0,
      'Gourmet Nachos & Dip Platter': 0,
      '1kg Red Velvet Designer Cake': 0,
      '30-Mins Photo Shoot & Digital Copy': 0,
      'Extra Premium Helium Balloons (x30)': 0,
      'Special Screen Entry Fog Effect': 0
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

    // Send confirmation SMS if slot is confirmed
    if (status === 'confirmed') {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (accountSid && authToken && twilioPhone) {
        try {
          const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
          const messageBody = `Your Bee Vibe booking is confirmed!\n\nTicket Code: ${updatedBooking.id}\nDate: ${updatedBooking.date}\nTime: ${updatedBooking.timeSlot}\n\nPresent this code at the entrance. Thank you!`;
          
          await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': authHeader,
              },
              body: new URLSearchParams({
                To: updatedBooking.phone,
                From: twilioPhone,
                Body: messageBody,
              }).toString(),
            }
          );
          console.log(`[SMS] Booking confirmation SMS successfully sent to ${updatedBooking.phone}`);
        } catch (smsError) {
          console.error('Failed to send booking confirmation SMS:', smsError);
        }
      } else {
        console.log(`\n==================================================`);
        console.log(`[MOCK CONFIRMATION SMS] Twilio credentials missing in .env.local`);
        console.log(`To: ${updatedBooking.phone}`);
        console.log(`Message: Your Bee Vibe booking is confirmed! Ticket Code: ${updatedBooking.id}`);
        console.log(`==================================================\n`);
      }
    }

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 400 });
  }
}

