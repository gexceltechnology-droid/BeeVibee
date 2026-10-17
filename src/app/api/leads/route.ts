import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const crmUrl = process.env.LEAD_MANAGER_CRM_URL || 'https://rental-license-ment-consideration.trycloudflare.com/api/leads';

    const payload = {
      customer_name: body.customer_name || body.name || body.customerName || 'Website Lead',
      phone: body.phone,
      interest: body.interest || 'Party Hall',
      occasion: body.occasion || 'Event',
      event_date: body.event_date || body.date || body.eventDate || new Date().toISOString().split('T')[0],
      guest_count: Number(body.guest_count || body.guests || body.guestCount || 2),
      source: body.source || 'Website',
      notes: body.notes || 'Inquiry from beevibe.org website',
    };

    if (!payload.phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    // Forward to Cloudflare Lead Manager CRM
    const res = await fetch(crmUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, crmStatus: res.status, data }, { status: 200 });
  } catch (error: any) {
    console.error('Lead Manager CRM sync error via /api/leads:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync lead' }, { status: 500 });
  }
}
