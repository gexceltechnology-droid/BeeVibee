import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passcode } = body;

    const serverPasscode = process.env.ADMIN_PASSCODE || 'beevibe2026';

    if (!passcode) {
      return NextResponse.json({ error: 'Passcode is required.' }, { status: 400 });
    }

    if (passcode === serverPasscode) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid admin passcode.' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Error in admin login:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
