import { NextRequest, NextResponse } from 'next/server';
import { archivePastBookings } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const activePasscode = request.headers.get('X-Admin-Passcode') || '';
    const serverPasscode = process.env.ADMIN_PASSCODE || 'beevibe2026';

    if (activePasscode !== serverPasscode) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const archiveResult = await archivePastBookings();

    return NextResponse.json(archiveResult);
  } catch (error: any) {
    console.error('Error in archiving bookings:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
