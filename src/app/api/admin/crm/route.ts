import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { getAllBookings, getAllOrders } from '@/lib/firestore';
import { CrmEngine } from '@/lib/saas/crmEngine';

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const bookings = await getAllBookings();
    const foodOrders = await getAllOrders();
    const customers = CrmEngine.aggregateCustomerProfiles('tenant_beevibe', bookings, foodOrders);

    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter(c => c.metrics.completedBookings >= 2).length;
    const repeatRate = totalCustomers > 0 ? ((repeatCustomers / totalCustomers) * 100).toFixed(1) : '0.0';
    const vipCount = customers.filter(c => c.metrics.calculatedSegment === 'VIP').length;
    const grossLtv = customers.reduce((sum, c) => sum + c.metrics.lifetimeSpend, 0);

    return NextResponse.json({
      success: true,
      summary: {
        totalCustomers,
        repeatCustomers,
        repeatRate: Number(repeatRate),
        vipCount,
        grossLtv,
      },
      customers,
    });
  } catch (error: any) {
    console.error('Error fetching CRM data:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { phone, note, author } = body;

    if (!phone || !note) {
      return NextResponse.json({ error: 'Phone and note are required.' }, { status: 400 });
    }

    const newNote = CrmEngine.addCustomerNote('tenant_beevibe', phone, author || 'Owner', note);
    return NextResponse.json({ success: true, note: newNote });
  } catch (error: any) {
    console.error('Error saving CRM note:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
