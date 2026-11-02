import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { getAllLeads, createLead, updateLead, deleteLead } from '@/lib/leads';

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }
    const leads = await getAllLeads();
    return NextResponse.json({ success: true, leads });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const phone = body.phone || body.customer_phone;
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    const leadData = {
      customerName: body.customer_name || body.name || body.customerName || 'Inquiry Guest',
      phone: String(phone),
      email: body.email,
      occasion: body.occasion || body.interest || 'Celebration',
      preferredDate: body.event_date || body.date || body.preferredDate,
      preferredTimeSlot: body.timeSlot || body.preferredTimeSlot,
      guestCount: Number(body.guest_count || body.guests || body.guestCount || 2),
      packageInterest: body.packageInterest || body.package || 'Royal Butterfly Room',
      budget: body.budget ? Number(body.budget) : undefined,
      source: body.source || 'Website',
      stage: body.stage || 'new',
      utmSource: body.utm_source,
      utmMedium: body.utm_medium,
      utmCampaign: body.utm_campaign,
      notes: body.notes ? [String(body.notes)] : ['Website Inquiry'],
    };

    // 1. Create locally with deduplication & AI scoring
    const savedLead = await createLead(leadData);

    // 2. Best-effort forward to external CRM if configured
    const crmUrl = process.env.LEAD_MANAGER_CRM_URL;
    if (crmUrl) {
      fetch(crmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(4000),
      }).catch((e) => console.warn('[Lead Forwarding Warn]:', e.message));
    }

    return NextResponse.json({ success: true, lead: savedLead }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: error.message || 'Failed to create lead' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400 });
    }

    const updated = await updateLead(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    let id: string | null = null;
    try {
      const body = await request.json();
      id = body?.id || null;
    } catch {
      const { searchParams } = new URL(request.url);
      id = searchParams.get('id');
    }

    if (!id) {
      return NextResponse.json({ error: 'Lead ID is required.' }, { status: 400 });
    }

    const deleted = await deleteLead(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Lead ${id} deleted successfully.` });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
