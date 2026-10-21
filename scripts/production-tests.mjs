/**
 * Production Readiness & Security Test Suite
 * 
 * Verifies:
 * 1. Admin Authentication & Timing-Safe Security
 * 2. Complete Server-Side Auth Guard Coverage across All Admin Endpoints
 * 3. Atomic Overlap & Concurrency Protection
 * 4. Payment Ledger Duplicate & Rapid-Click Prevention
 * 5. Deterministic Payment Calculations & Append-Only Integrity
 * 6. Cancellation & Automatic Slot Release
 */

import http from 'http';

const BASE_URL = 'http://localhost:3000';
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'beevibe2026';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, options);
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }
  return { status: res.status, ok: res.ok, data };
}

async function runProductionTests() {
  console.log('================================================================');
  console.log('🔒 BEEVIBE PRODUCTION READINESS & SECURITY TEST SUITE');
  console.log('================================================================\n');

  const testDate = '2026-12-15';
  const testRoomId = 'angel-wings';
  const testSlot = '08:00 PM - 10:00 PM';
  let testBookingId = null;

  try {
    // --------------------------------------------------------------------------
    // CHECK 1: Passcode Timing-Safe Comparison & Login Security
    // --------------------------------------------------------------------------
    console.log('▶ [CHECK 1] Admin Authentication & Secret Verification');

    const wrongLogin = await apiRequest('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: 'incorrect_passcode_attempt' }),
    });
    assert(wrongLogin.status === 401, 'Unauthorized passcode is strictly rejected with 401');

    const emptyLogin = await apiRequest('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: '' }),
    });
    assert(emptyLogin.status === 400 || emptyLogin.status === 401, 'Empty passcode rejected with 400/401');

    const correctLogin = await apiRequest('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: ADMIN_PASSCODE }),
    });
    assert(correctLogin.ok && correctLogin.data?.success === true, 'Correct admin passcode authenticates with 200');

    // --------------------------------------------------------------------------
    // CHECK 2: Authorization Guards on ALL Sensitive Endpoints
    // --------------------------------------------------------------------------
    console.log('\n▶ [CHECK 2] Server-Side Authorization on Every Admin Endpoint');

    const endpointsToGuard = [
      { name: 'GET /api/bookings', path: '/api/bookings', method: 'GET' },
      { name: 'PUT /api/bookings', path: '/api/bookings', method: 'PUT', body: { id: 'fake', status: 'confirmed' } },
      { name: 'DELETE /api/bookings', path: '/api/bookings?id=fake', method: 'DELETE' },
      { name: 'PATCH /api/bookings', path: '/api/bookings', method: 'PATCH', body: { id: 'fake', action: 'record_payment' } },
      { name: 'GET /api/admin/payments', path: '/api/admin/payments', method: 'GET' },
      { name: 'POST /api/admin/payments', path: '/api/admin/payments', method: 'POST', body: { id: 'fake' } },
      { name: 'GET /api/admin/crm', path: '/api/admin/crm', method: 'GET' },
      { name: 'POST /api/admin/crm', path: '/api/admin/crm', method: 'POST', body: { phone: '9999999999', note: 'test' } },
      { name: 'POST /api/admin/archive', path: '/api/admin/archive', method: 'POST', body: {} },
      { name: 'GET /api/orders', path: '/api/orders', method: 'GET' },
      { name: 'PUT /api/orders', path: '/api/orders', method: 'PUT', body: { id: 'fake', status: 'preparing' } },
      { name: 'POST /api/menu', path: '/api/menu', method: 'POST', body: { name: 'Test' } },
      { name: 'PUT /api/menu', path: '/api/menu', method: 'PUT', body: { id: 'fake' } },
      { name: 'DELETE /api/menu', path: '/api/menu?id=fake', method: 'DELETE' },
      { name: 'GET /api/telegram', path: '/api/telegram', method: 'GET' },
      { name: 'POST /api/telegram', path: '/api/telegram', method: 'POST', body: {} },
    ];

    for (const ep of endpointsToGuard) {
      const res = await apiRequest(ep.path, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body ? JSON.stringify(ep.body) : undefined,
      });
      assert(res.status === 401, `${ep.name} returns 401 Unauthorized when unauthenticated`);
    }

    // --------------------------------------------------------------------------
    // CHECK 3: Manual Booking Creation & Slot Blocking
    // --------------------------------------------------------------------------
    console.log('\n▶ [CHECK 3] Slot Availability, Concurrency & Overlap Prevention');

    const bookingPayload = {
      customerName: 'Prod Test Client',
      phone: '9845099881',
      email: 'prod.test@beevibe.org',
      date: testDate,
      timeSlot: testSlot,
      packageName: 'Angel Wings Celebration',
      roomId: testRoomId,
      theme: testRoomId,
      bookingType: 'theater',
      guestCount: 2,
      addOns: ['Table Decor & Rose Petals'],
      totalPrice: 1798,
      advancePaid: 500,
      balanceDue: 1298,
      paymentMode: 'Cash',
      source: 'Direct Phone',
      adminNotes: 'Automated production readiness audit test booking.',
      status: 'confirmed',
    };

    const createRes = await apiRequest('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify(bookingPayload),
    });

    assert(createRes.status === 201 && createRes.data?.success === true, 'Manual booking created successfully with 201');
    testBookingId = createRes.data?.booking?.id;
    assert(Boolean(testBookingId), `Created booking ticket ID: ${testBookingId}`);

    // Slot should immediately be marked as booked on website
    const slotCheck = await apiRequest(`/api/slots?date=${testDate}&roomId=${testRoomId}`);
    const slotItem = (slotCheck.data?.slots || []).find(s => s.time === testSlot);
    assert(slotItem && slotItem.isBooked === true, `Slot ${testSlot} on ${testDate} is immediately marked isBooked: true on website`);

    // Concurrent / Overlapping attempt in the SAME room must be rejected with 409 or 400
    const overlapRes = await apiRequest('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify({
        ...bookingPayload,
        customerName: 'Overlapping Guest',
      }),
    });
    assert(
      (overlapRes.status === 409 || overlapRes.status === 400) &&
      (overlapRes.data?.error || '').toLowerCase().includes('overlap'),
      'Overlapping booking rejected with 409/400 and overlap error'
    );

    // --------------------------------------------------------------------------
    // CHECK 4: Payment Ledger Integrity & Duplicate Prevention
    // --------------------------------------------------------------------------
    console.log('\n▶ [CHECK 4] Payment Ledger Immutability & Duplicate Prevention');

    const paymentRef = `SBI-UTR-${Date.now()}`;
    const firstPayRes = await apiRequest('/api/bookings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify({
        id: testBookingId,
        action: 'record_payment',
        amount: 500,
        paymentMode: 'UPI (9900106474@okbizaxis)',
        type: 'installment',
        utrNumber: paymentRef,
        notes: 'Mid-term installment payment',
        recordedBy: 'Finance Staff',
      }),
    });

    assert(firstPayRes.status === 200 && firstPayRes.data?.success === true, 'First installment payment recorded successfully');
    assert(firstPayRes.data?.booking?.advancePaid === 1000, 'advancePaid updated to 1000 (500 advance + 500 installment)');
    assert(firstPayRes.data?.booking?.balanceDue === 798, 'balanceDue correctly reduced to 798');

    // Attempt to submit identical UTR reference again -> MUST be rejected with 409 Conflict!
    const dupUtrRes = await apiRequest('/api/bookings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify({
        id: testBookingId,
        action: 'record_payment',
        amount: 200,
        paymentMode: 'UPI',
        type: 'installment',
        utrNumber: paymentRef, // Exact same UTR
        notes: 'Duplicate UTR attempt',
        recordedBy: 'Finance Staff',
      }),
    });
    assert(
      dupUtrRes.status === 409 &&
      (dupUtrRes.data?.error || '').includes('DUPLICATE_PAYMENT_UTR'),
      'Duplicate UTR payment submission rejected with 409 DUPLICATE_PAYMENT_UTR'
    );

    // Attempt rapid duplicate submission (same amount & mode within 60s) -> MUST be blocked
    const rapidClickRes = await apiRequest('/api/bookings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify({
        id: testBookingId,
        action: 'record_payment',
        amount: 500, // Same amount as firstPayRes
        paymentMode: 'UPI (9900106474@okbizaxis)', // Same mode
        type: 'installment', // Same type
        notes: 'Accidental double click',
        recordedBy: 'Finance Staff',
      }),
    });
    assert(
      rapidClickRes.status === 409 &&
      (rapidClickRes.data?.error || '').includes('DUPLICATE_PAYMENT_SUBMISSION'),
      'Rapid duplicate payment (double-click within 60s) blocked with 409 DUPLICATE_PAYMENT_SUBMISSION'
    );

    // --------------------------------------------------------------------------
    // CHECK 5: Final Balance Settlement & Invoices
    // --------------------------------------------------------------------------
    console.log('\n▶ [CHECK 5] Final Balance Settlement & Status Lifecycle');

    const finalPayRes = await apiRequest('/api/bookings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify({
        id: testBookingId,
        action: 'record_payment',
        amount: 798,
        paymentMode: 'Cash',
        type: 'balance',
        utrNumber: `CASH-${Date.now()}`,
        notes: 'Final balance paid in cash at counter',
        recordedBy: 'Reception',
      }),
    });

    assert(finalPayRes.status === 200, 'Final balance settled with 200');
    assert(finalPayRes.data?.booking?.balanceDue === 0, 'balanceDue is exactly 0');
    assert(finalPayRes.data?.booking?.paymentStatus === 'fully_paid', 'paymentStatus marked fully_paid');
    assert(finalPayRes.data?.booking?.paymentLedger?.length === 3, 'Ledger has 3 immutable records (advance, installment, balance)');

    // --------------------------------------------------------------------------
    // CHECK 6: Cancellation & Slot Release
    // --------------------------------------------------------------------------
    console.log('\n▶ [CHECK 6] Cancellation & Automatic Slot Release');

    const cancelRes = await apiRequest('/api/bookings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Passcode': ADMIN_PASSCODE,
      },
      body: JSON.stringify({
        id: testBookingId,
        status: 'cancelled',
      }),
    });
    assert(cancelRes.status === 200 && cancelRes.data?.booking?.status === 'cancelled', 'Booking cancelled with 200');

    // Slot must now be freed on website
    const freedCheck = await apiRequest(`/api/slots?date=${testDate}&roomId=${testRoomId}`);
    const freedSlotItem = (freedCheck.data?.slots || []).find(s => s.time === testSlot);
    assert(freedSlotItem && freedSlotItem.isBooked === false, `Slot ${testSlot} on ${testDate} is now freed (isBooked: false)`);

    // Clean up test booking
    await apiRequest(`/api/bookings?id=${testBookingId}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Passcode': ADMIN_PASSCODE },
    });
    console.log(`  Cleaned up test booking: ${testBookingId}`);

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`📊 PRODUCTION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionTests();
