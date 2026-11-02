import { NextRequest, NextResponse } from 'next/server';
import { isAuthorized } from '@/lib/auth';
import { getAllBookings } from '@/lib/firestore';
import { getAllLeads } from '@/lib/leads';

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 });
    }

    const body = await request.json();
    const query = (body.query || '').trim().toLowerCase();
    const tool = body.tool; // optional explicit tool call

    const bookings = await getAllBookings();
    const leads = await getAllLeads();

    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());

    // 1. Tool: Daily Briefing
    if (tool === 'daily_briefing' || query.includes('today') || query.includes('briefing') || query.includes('summary')) {
      const todayBookings = bookings.filter(b => b.date === todayIST && b.status !== 'cancelled');
      const confirmedToday = todayBookings.filter(b => b.status === 'confirmed');
      const totalRevenueToday = todayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const totalCollected = todayBookings.reduce((sum, b) => sum + (b.advancePaid || 0) + (b.balanceCollected ? (b.balanceDue || 0) : 0), 0);
      const outstandingToday = totalRevenueToday - totalCollected;

      const newLeads = leads.filter(l => l.stage === 'new' || l.stage === 'qualified');

      return NextResponse.json({
        success: true,
        toolUsed: 'daily_briefing',
        data: {
          date: todayIST,
          activeReservationsCount: todayBookings.length,
          confirmedCount: confirmedToday.length,
          totalRevenueToday,
          totalCollected,
          outstandingToday,
          newLeadsCount: newLeads.length,
          todaySchedule: todayBookings.map(b => ({
            id: b.id,
            customerName: b.customerName,
            room: b.roomId || b.packageName,
            timeSlot: b.timeSlot,
            guestCount: b.guestCount,
            balanceDue: b.balanceDue || 0,
            balanceCollected: b.balanceCollected || false,
          })),
        },
        aiMessage: `Today (${todayIST}), BeeVibe has **${todayBookings.length} scheduled reservations** generating ₹${totalRevenueToday.toLocaleString('en-IN')}. Collected ₹${totalCollected.toLocaleString('en-IN')}, with ₹${outstandingToday.toLocaleString('en-IN')} pending at check-in. There are **${newLeads.length} active leads** ready for follow-up.`,
      });
    }

    // 2. Tool: Financial / Payments Audit
    if (tool === 'payment_audit' || query.includes('payment') || query.includes('unverified') || query.includes('balance') || query.includes('utr')) {
      const pendingBalances = bookings.filter(b => (b.balanceDue || 0) > 0 && !b.balanceCollected && b.status !== 'cancelled');
      const unverifiedUtrs = bookings.filter(b => b.utrNumber && !b.sbiVerified && b.status !== 'cancelled');
      const totalPendingBalance = pendingBalances.reduce((sum, b) => sum + (b.balanceDue || 0), 0);

      return NextResponse.json({
        success: true,
        toolUsed: 'payment_audit',
        data: {
          pendingBalancesCount: pendingBalances.length,
          totalPendingBalance,
          unverifiedUtrsCount: unverifiedUtrs.length,
          actionRequired: pendingBalances.slice(0, 5).map(b => ({
            id: b.id,
            customer: b.customerName,
            phone: b.phone,
            date: b.date,
            timeSlot: b.timeSlot,
            balanceDue: b.balanceDue,
            utrNumber: b.utrNumber || 'None',
          })),
        },
        aiMessage: `Found **${pendingBalances.length} bookings with pending balances** totaling ₹${totalPendingBalance.toLocaleString('en-IN')}. There are **${unverifiedUtrs.length} UPI/UTR payments** awaiting SBI bank ledger verification.`,
      });
    }

    // 3. Tool: Leads Triage & Follow-up
    if (tool === 'lead_triage' || query.includes('lead') || query.includes('prospect') || query.includes('follow up') || query.includes('conversion')) {
      const highIntentLeads = leads.filter(l => l.aiClassification?.intent === 'high' && l.stage !== 'converted' && l.stage !== 'lost');
      const overdueFollowups = leads.filter(l => l.followUpDue && new Date(l.followUpDue) < new Date() && l.stage !== 'converted' && l.stage !== 'lost');

      return NextResponse.json({
        success: true,
        toolUsed: 'lead_triage',
        data: {
          highIntentCount: highIntentLeads.length,
          overdueFollowupsCount: overdueFollowups.length,
          topLeads: highIntentLeads.slice(0, 5).map(l => ({
            id: l.id,
            name: l.customerName,
            phone: l.phone,
            occasion: l.occasion,
            date: l.preferredDate,
            suggestedAction: l.aiClassification?.suggestedAction,
          })),
        },
        aiMessage: `Identified **${highIntentLeads.length} high-intent celebration inquiries** and **${overdueFollowups.length} follow-ups due**. Highest conversion potential is ${highIntentLeads[0]?.customerName || 'prospective guests'} interested in ${highIntentLeads[0]?.occasion || 'celebration'}.`,
      });
    }

    // Default intelligent assistant response
    const activeCount = bookings.filter(b => b.status === 'confirmed').length;
    return NextResponse.json({
      success: true,
      toolUsed: 'general_assistant',
      aiMessage: `I am your BeeVibe Operating System Assistant. I can assist with:
1. 📊 **Daily Operations**: "Give me today's schedule and check-ins"
2. 💳 **Payment Reconciliation**: "Show pending balances and unverified UTRs"
3. 🎯 **Lead Follow-ups**: "Which leads should we contact today?"
4. 📋 **Checklists**: "Generate checklist for Royal Butterfly suite"`,
      summary: {
        activeBookings: activeCount,
        leadsCount: leads.length,
      },
    });
  } catch (error: any) {
    console.error('Error in AI Assistant route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
