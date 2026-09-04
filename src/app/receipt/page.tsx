'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Printer,
  Share2,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  Sparkles,
  ArrowLeft,
  CreditCard,
  Building2,
  Download
} from 'lucide-react';
import { cleanPhoneNumber } from '@/lib/whatsappUtils';

interface BookingReceiptData {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  packageName: string;
  addOns: string[];
  totalPrice: number;
  advancePaid?: number;
  balanceDue?: number;
  paymentStatus?: string;
  paymentMode?: string;
  utrNumber?: string;
  guestCount: number;
  specialRequests?: string;
  createdAt: string;
}

function ReceiptContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const [booking, setBooking] = useState<BookingReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID specified in URL.');
      setLoading(false);
      return;
    }

    const fetchReceipt = async () => {
      try {
        const res = await fetch(`/api/receipt?id=${encodeURIComponent(bookingId)}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load booking receipt.');
        }
        setBooking(data.booking);
      } catch (err: any) {
        setError(err.message || 'Error fetching receipt.');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [bookingId]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles className="animate-spin" size={32} color="#a855f7" style={{ margin: '0 auto 16px auto' }} />
          <p style={{ color: '#a1a1aa' }}>Generating Advance Payment Receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', padding: '24px' }}>
        <div style={{ background: 'rgba(24, 24, 27, 0.8)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '16px', padding: '32px', maxWidth: '480px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ef4444', marginBottom: '12px' }}>Receipt Not Found</h2>
          <p style={{ color: '#a1a1aa', fontSize: '0.92rem', marginBottom: '24px' }}>{error || 'Unable to locate this booking receipt.'}</p>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', background: '#a855f7', color: '#fff', textDecoration: 'none', fontWeight: '600' }}>
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const advancePaid = typeof booking.advancePaid === 'number' ? booking.advancePaid : Math.min(500, booking.totalPrice);
  const balanceDue = typeof booking.balanceDue === 'number' ? booking.balanceDue : Math.max(0, booking.totalPrice - advancePaid);
  const paymentMode = booking.paymentMode || 'UPI / Online';

  const shareText = `Hi ${booking.customerName}! Here is your official Advance Payment Receipt for BeeVibe Private Celebration Theater.\n\n🎟️ Receipt No: ${booking.id}\n📅 Date: ${booking.date}\n⏰ Slot: ${booking.timeSlot}\n🟢 Advance Paid: ₹${advancePaid}\n⏳ Balance Due at Venue: ₹${balanceDue}\n\nVenue Location: https://maps.google.com/?q=BeeVibe+Jayanagar`;
  const whatsappShareUrl = `https://wa.me/${cleanPhoneNumber(booking.phone)}?text=${encodeURIComponent(shareText)}`;

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '20px' }}>
      
      {/* Top Action Bar (Hidden during Printing) */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a1a1aa', textDecoration: 'none', fontSize: '0.88rem' }}>
          <ArrowLeft size={16} /> Home
        </Link>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => window.print()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#ffffff',
              color: '#000000',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.88rem'
            }}
          >
            <Printer size={16} /> Print / Save PDF
          </button>

          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: '#25d366',
              color: '#ffffff',
              fontWeight: '700',
              textDecoration: 'none',
              fontSize: '0.88rem'
            }}
          >
            <Share2 size={16} /> Share Receipt
          </a>
        </div>
      </div>

      {/* Printable Receipt Paper Card */}
      <div className="receipt-paper" style={{
        background: '#ffffff',
        color: '#111827',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
        border: '1px solid #e5e7eb',
        fontFamily: 'sans-serif'
      }}>
        
        {/* Receipt Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed #e5e7eb', paddingBottom: '24px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <img src="/bee-vibe-logo.png" alt="BeeVibe Logo" style={{ height: '36px', width: 'auto' }} />
              <div>
                <h1 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0, color: '#111827' }}>BeeVibe</h1>
                <p style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Private Celebration Theater
                </p>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#4b5563', margin: '4px 0 0 0', lineHeight: '1.4', maxWidth: '340px' }}>
              1340, 2nd floor, 41st Cross road, 4th gate, opposite Jain University, Jayanagar 9th Block, Bengaluru 560041
            </p>
            <p style={{ fontSize: '0.78rem', color: '#4b5563', margin: '2px 0 0 0' }}>
              📞 Call / WhatsApp: +91 89191 78055
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: '20px',
              background: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#047857',
              fontSize: '0.78rem',
              fontWeight: '800',
              marginBottom: '10px'
            }}>
              ✓ ADVANCE CONFIRMED
            </div>
            <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>RECEIPT NO:</div>
            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#111827', letterSpacing: '0.5px' }}>
              {booking.id}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '2px' }}>
              Issued: {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Customer & Slot Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '28px', background: '#f9fafb', padding: '20px', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
              CUSTOMER DETAILS
            </div>
            <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#111827' }}>{booking.customerName}</div>
            <div style={{ fontSize: '0.82rem', color: '#4b5563', marginTop: '2px' }}>📱 {booking.phone}</div>
            {booking.email && <div style={{ fontSize: '0.82rem', color: '#4b5563' }}>✉️ {booking.email}</div>}
          </div>

          <div>
            <div style={{ fontSize: '0.72rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '700', marginBottom: '4px' }}>
              RESERVED CELEBRATION SLOT
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#7c3aed' }}>
              📅 {booking.date}
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#111827', marginTop: '2px' }}>
              ⏰ {booking.timeSlot}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#4b5563', marginTop: '2px' }}>
              👥 {booking.guestCount} Guests Reserved
            </div>
          </div>
        </div>

        {/* Itemized Charges Table */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '0.85rem', fontWeight: '800', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            BOOKING BREAKDOWN
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left', color: '#6b7280' }}>
                <th style={{ padding: '8px 0', fontWeight: '700' }}>Item Description</th>
                <th style={{ padding: '8px 0', textAlign: 'right', fontWeight: '700' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '10px 0', color: '#111827', fontWeight: '600' }}>
                  {booking.packageName} (180" 4K Cinema & Dolby Sound)
                </td>
                <td style={{ padding: '10px 0', textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                  ₹{booking.totalPrice - (booking.addOns.length * 200)}
                </td>
              </tr>

              {booking.addOns.map((addOn, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 0', color: '#4b5563' }}>+ {addOn}</td>
                  <td style={{ padding: '8px 0', textAlign: 'right', color: '#4b5563' }}>Included / Addon</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total & Advance Payment Calculation Box */}
        <div style={{
          background: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.92rem', color: '#475569' }}>
            <span>Total Booking Amount:</span>
            <span style={{ fontWeight: '700', color: '#0f172a' }}>₹{booking.totalPrice}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed #cbd5e1', fontSize: '1rem', color: '#047857', fontWeight: '800' }}>
            <span>🟢 Advance Payment Received:</span>
            <span>- ₹{advancePaid}</span>
          </div>

          <div style={{ background: 'rgba(242, 169, 0, 0.08)', border: '1px solid rgba(242, 169, 0, 0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', fontSize: '0.82rem', color: '#334155' }}>
            <div><strong>Paid to:</strong> NALINAKSHI C (8123635342@sbi)</div>
            <div><strong>Bank:</strong> State Bank of India (6592)</div>
            {booking.utrNumber && (
              <div><strong>UPI Transaction UTR:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#b45309' }}>{booking.utrNumber}</span></div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.15rem', fontWeight: '900', color: '#7c3aed' }}>
            <span>⏳ Remaining Balance Due at Venue:</span>
            <span style={{ fontSize: '1.3rem', background: '#f3e8ff', padding: '4px 12px', borderRadius: '8px', border: '1px solid #c084fc' }}>
              ₹{balanceDue}
            </span>
          </div>
        </div>

        {/* Venue Rules & Directions Footer */}
        <div style={{ borderTop: '2px dashed #e5e7eb', paddingTop: '20px', fontSize: '0.76rem', color: '#6b7280', lineHeight: '1.5' }}>
          <div style={{ fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
            IMPORTANT INSTRUCTIONS FOR YOUR CELEBRATION:
          </div>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>Please arrive 10 minutes prior to your reserved slot time at Jayanagar 9th Block.</li>
            <li>Remaining balance of <strong>₹{balanceDue}</strong> is payable at venue entry via UPI or Cash.</li>
            <li>Outside food and beverages are restricted (Celebration cake & baby food allowed).</li>
          </ul>

          <div style={{ marginTop: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.72rem' }}>
            Thank you for choosing BeeVibe Private Celebration Theater! 🎉
          </div>
        </div>

      </div>

      {/* CSS for Clean Printing */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .receipt-paper {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
        }
      `}</style>

    </div>
  );
}

export default function ReceiptPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#09090b', paddingTop: '40px', paddingBottom: '60px' }}>
      <Suspense fallback={
        <div style={{ textAlign: 'center', color: '#fff', padding: '60px' }}>
          Loading receipt view...
        </div>
      }>
        <ReceiptContent />
      </Suspense>
    </main>
  );
}
