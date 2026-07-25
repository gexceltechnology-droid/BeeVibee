import { NextRequest, NextResponse } from 'next/server';
import { getAllBookings, getDb } from '@/lib/firestore';

// Archive past bookings (Firestore bookings are persistent, no ephemeral issue)
// This endpoint now just returns a count of past bookings as a no-op since Firestore is persistent.
export async function POST(request: NextRequest) {
  try {
    const activePasscode = request.headers.get('X-Admin-Passcode') || '';
    const serverPasscode = process.env.ADMIN_PASSCODE || 'beevibe2026';

    if (activePasscode !== serverPasscode) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // With Firestore, bookings are permanently stored — no archive needed.
    // Just return success with 0 archived (data is safe in Firestore).
    return NextResponse.json({ success: true, count: 0, ordersCount: 0, destination: 'firestore_cloud' });
  } catch (error: any) {
    console.error('Error in archiving bookings:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
