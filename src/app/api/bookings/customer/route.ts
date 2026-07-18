import { NextRequest, NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const trimmedPhone = String(phone).trim();
    const db = readDb();

    // Filter bookings where phone matches
    const customerBookings = db.bookings.filter(
      (b) => String(b.phone).trim() === trimmedPhone
    );

    // Sort by date (newest first)
    const sortedBookings = [...customerBookings].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json({ bookings: sortedBookings });
  } catch (error: any) {
    console.error('Error fetching customer bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
