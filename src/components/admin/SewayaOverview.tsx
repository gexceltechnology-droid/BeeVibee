'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Booking } from '@/lib/db';
import { normalizeRoomId } from '@/lib/time';

interface SewayaOverviewProps {
  bookings: any[];
  onSelectBooking: (booking: any) => void;
  onOpenManualBooking: () => void;
  onSwitchTab: (tab: string) => void;
  onEditBooking?: (booking: any) => void;
  onDeleteBooking?: (id: string) => void;
}

export default function SewayaOverview({
  bookings = [],
  onSelectBooking,
  onOpenManualBooking,
  onSwitchTab,
  onEditBooking,
  onDeleteBooking,
}: SewayaOverviewProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; date: string; booked: number; cancelled: number } | null>({
    x: 180,
    y: 95,
    date: 'Tue, 7 April 2026',
    booked: 40,
    cancelled: 0,
  });
  const [timeFilter, setTimeFilter] = useState<'month' | 'week' | 'today'>('month');
  const [activeSuiteIndex, setActiveSuiteIndex] = useState(0);

  const todayIST = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayIST);

  const matchesDate = (bookingDate?: string, targetDate?: string) => {
    if (!bookingDate || !targetDate) return false;
    const b = String(bookingDate).trim();
    const t = String(targetDate).trim();
    if (b === t) return true;
    if (b.startsWith(t)) return true;
    const parts = b.split(/[-/]/);
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}` === t;
    }
    return false;
  };

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    try {
      const [year, month, day] = dStr.split('-').map(Number);
      if (!year || !month || !day) return dStr;
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  // Filter bookings for the selected given date
  const bookingsOnDate = useMemo(() => {
    return (bookings || []).filter((b) => b.status !== 'cancelled' && matchesDate(b.date, selectedDate));
  }, [bookings, selectedDate]);

  // Compute live real metrics from bookings (zero fallback when cleared)
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const cancelledBookings = bookings.filter((b) => b.status === 'cancelled');
  const totalBookingsCount = bookings.filter((b) => b.status !== 'cancelled').length;
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

  // Celebration Suites configuration with authentic photos
  const suites = [
    {
      id: 'royal-butterfly',
      name: 'Royal Butterfly Room',
      code: 'RM-1001-R',
      type: 'Luxury Private Theater (Gaming Add-On Ready)',
      price: '₹1,499',
      unit: '/ 2 hrs',
      demand: 'High Demand',
      demandColor: '#16a34a',
      demandBg: '#dcfce7',
      image: '/themes/theme-purple.jpg',
    },
    {
      id: 'angel-wings',
      name: 'Angel Wings Room',
      code: 'RM-1002-R',
      type: 'Signature Celebration Suite',
      price: '₹1,299',
      unit: '/ 2 hrs',
      demand: 'High Demand',
      demandColor: '#16a34a',
      demandBg: '#dcfce7',
      image: '/themes/theme-pink-wings.jpg',
    },
    {
      id: 'red-velvet',
      name: 'Red Velvet Heart Room',
      code: 'RM-1003-R',
      type: 'Romantic Celebration Suite',
      price: '₹1,099',
      unit: '/ 2 hrs',
      demand: 'Popular',
      demandColor: '#d97706',
      demandBg: '#fef3c7',
      image: '/themes/theme-red-heart.jpg',
    },
  ];

  // Real bookings: prioritized by selected date when available, fallback to recent
  const arrivingBookings = bookingsOnDate.length > 0 ? bookingsOnDate : (bookings || []).slice(0, 8);

  // Recent activity feed from real live bookings
  const recentActivities = bookings.slice(0, 4).map((b, idx) => ({
    guest: b.customerName || 'Guest',
    suite: b.roomId === 'royal-butterfly' ? 'Royal Butterfly' : b.roomId === 'angel-wings' ? 'Angel Wings' : b.roomId === 'red-velvet' ? 'Red Velvet' : (b.packageName || 'PS5 Lounge'),
    icon: b.bookingType === 'gaming' ? '🎮' : '💎',
    time: b.date ? `${b.date} • ${b.timeSlot || ''}` : 'Recent',
    id: b.id || String(idx),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>
            Overview
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Live performance, reservations & revenue tracking
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '9999px', background: '#22c55e' }}></span>
            <span>refreshed 2 mins ago</span>
          </div>

          <div style={{ position: 'relative' }}>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '9999px',
                padding: '8px 18px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1e293b',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                outline: 'none',
              }}
            >
              <option value="month">📅 This month</option>
              <option value="week">📅 This week</option>
              <option value="today">📅 Today</option>
            </select>
          </div>

          <button
            onClick={onOpenManualBooking}
            style={{
              background: '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(30, 41, 59, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>+</span>
            <span>New Booking</span>
          </button>
        </div>
      </div>

      {/* BENTO GRID: ROW 1 (Charts & Occupancy) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '24px',
        }}
      >
        {/* CARD 1: BOOKING TRENDS (Span 5 cols) */}
        <div
          style={{
            gridColumn: 'span 5',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Booking Trends</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '6px' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>
                  {totalBookingsCount}
                </span>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Bookings</span>
                {totalBookingsCount > 0 && (
                  <span
                    style={{
                      background: '#1e293b',
                      color: '#ffffff',
                      borderRadius: '9999px',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    ↑ 18%
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#38bdf8' }}></span>
                <span>Booked</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: '#64748b' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '9999px', background: '#94a3b8' }}></span>
                <span>Cancelled</span>
              </div>
              <span style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}>•••</span>
            </div>
          </div>

          {/* INTERACTIVE SVG SPLINE CHART */}
          <div style={{ position: 'relative', height: '170px', width: '100%' }}>
            <svg viewBox="0 0 460 160" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="460" y2="40" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="80" x2="460" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" />
              <line x1="0" y1="120" x2="460" y2="120" stroke="#f1f5f9" strokeDasharray="3 3" />

              {/* Spline Curve or Empty State */}
              {totalBookingsCount === 0 ? (
                <g>
                  <line x1="10" y1="120" x2="450" y2="120" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="4 4" />
                  <text x="230" y="80" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="500">
                    No active reservations recorded yet
                  </text>
                </g>
              ) : (
                <>
                  <path
                    d="M 10 145 Q 60 140 100 135 T 180 140 T 260 145 T 350 140 T 450 145"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="2"
                  />
                  <path
                    d="M 10 120 C 30 50, 45 40, 60 70 C 80 120, 100 130, 120 70 C 140 30, 160 140, 180 95 C 200 60, 240 130, 270 90 C 300 40, 330 60, 350 110 C 370 140, 410 70, 450 90 L 450 150 L 10 150 Z"
                    fill="url(#blueGradient)"
                  />
                  <path
                    d="M 10 120 C 30 50, 45 40, 60 70 C 80 120, 100 130, 120 70 C 140 30, 160 140, 180 95 C 200 60, 240 130, 270 90 C 300 40, 330 60, 350 110 C 370 140, 410 70, 450 90"
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="2.5"
                  />
                  <circle cx="180" cy="95" r="5" fill="#0ea5e9" stroke="#ffffff" strokeWidth="2" />
                  <line x1="180" y1="20" x2="180" y2="150" stroke="#94a3b8" strokeDasharray="2 2" />
                </>
              )}
            </svg>

            {/* Hover Tooltip Card */}
            {hoveredPoint && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '175px',
                  background: 'rgba(255, 255, 255, 0.96)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  boxShadow: '0 8px 16px -2px rgba(0, 0, 0, 0.08)',
                  fontSize: '0.76rem',
                  pointerEvents: 'none',
                  minWidth: '130px',
                  zIndex: 2,
                }}
              >
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>{hoveredPoint.date}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Booked</span>
                  <span style={{ fontWeight: 700, color: '#0284c7' }}>{hoveredPoint.booked}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                  <span>Cancelled</span>
                  <span style={{ fontWeight: 700, color: '#64748b' }}>{hoveredPoint.cancelled}</span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px' }}>
            <span>Apr 01, 2026</span>
            <span>Apr 30, 2026</span>
          </div>
        </div>

        {/* CARD 2: RATING & GUEST EXPERIENCE (Span 2 cols) */}
        <div
          style={{
            gridColumn: 'span 2',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Rating</span>
            <span style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}>•••</span>
          </div>

          {/* Speedometer Radial Gauge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0' }}>
            <div style={{ position: 'relative', width: '130px', height: '65px' }}>
              <svg viewBox="0 0 100 50" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                  <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="50%" stopColor="#eab308" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                {/* Arc Background */}
                <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#f1f5f9" strokeWidth="8" strokeLinecap="round" />
                {/* Colored Progress Arc */}
                <path
                  d="M 10 50 A 40 40 0 0 1 82 25"
                  fill="none"
                  stroke="url(#gaugeGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a', letterSpacing: '0.05em' }}>GOOD</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>Score rating: 4.8/5.0 &gt;</div>
            </div>
          </div>

          {/* Sub-ratings with dotted lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
              <span>Cleanliness</span>
              <span style={{ borderBottom: '1px dotted #cbd5e1', flex: 1, margin: '0 8px' }}></span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>4.9</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
              <span>Service</span>
              <span style={{ borderBottom: '1px dotted #cbd5e1', flex: 1, margin: '0 8px' }}></span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>4.8</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
              <span>Ambience</span>
              <span style={{ borderBottom: '1px dotted #cbd5e1', flex: 1, margin: '0 8px' }}></span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>4.7</span>
            </div>
          </div>
        </div>

        {/* CARD 3: REVENUE (Span 2 cols) */}
        <div
          style={{
            gridColumn: 'span 2',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Revenue</span>
            <span style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}>↗</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
              {totalRevenue > 0 && (
                <span
                  style={{
                    background: '#1e293b',
                    color: '#ffffff',
                    borderRadius: '9999px',
                    padding: '2px 6px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                  }}
                >
                  ↑ 12.5%
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px' }}>
              {totalRevenue === 0 ? 'No revenue recorded yet' : 'Total revenue in 30 days'}
            </div>
          </div>

          {/* 4 Weekly Comparison Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '90px', gap: '8px', padding: '0 4px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '100%', height: totalRevenue > 0 ? '42px' : '4px', background: '#f1f5f9', borderRadius: '6px' }}></div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>W1</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '100%', height: totalRevenue > 0 ? '82px' : '4px', background: totalRevenue > 0 ? 'linear-gradient(180deg, #38bdf8 0%, #0284c7 100%)' : '#f1f5f9', borderRadius: '6px' }}></div>
              <span style={{ fontSize: '0.72rem', fontWeight: totalRevenue > 0 ? 700 : 500, color: totalRevenue > 0 ? '#0284c7' : '#94a3b8' }}>W2</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '100%', height: totalRevenue > 0 ? '50px' : '4px', background: '#f1f5f9', borderRadius: '6px' }}></div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>W3</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '100%', height: totalRevenue > 0 ? '62px' : '4px', background: '#f1f5f9', borderRadius: '6px' }}></div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>W4</span>
            </div>
          </div>
        </div>

        {/* CARD 4: FORECAST & OCCUPANCY (Span 3 cols) */}
        <div
          style={{
            gridColumn: 'span 3',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#64748b' }}>Forecast</span>
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '9999px',
                padding: '2px 10px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              Rooms ⌵
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0' }}>
            <button style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>&lt;</button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Holiday Peak Period</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Fri, 1 May - Sun, 3 May 2026</div>
            </div>
            <button style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}>&gt;</button>
          </div>

          {/* Occupancy and Booked Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Occupancy</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                {totalBookingsCount > 0 ? `${Math.min(100, Math.round((totalBookingsCount / 80) * 100))}%` : '0%'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Slots Booked</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
                {totalBookingsCount}<span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>/80</span>
              </div>
            </div>
          </div>

          {/* SVG Donut Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', margin: '6px 0' }}>
            <svg viewBox="0 0 100 100" style={{ width: '90px', height: '90px' }}>
              <circle cx="50" cy="50" r="38" fill="none" stroke="#f1f5f9" strokeWidth="12" />
              {totalBookingsCount > 0 && (
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="12"
                  strokeDasharray={`${Math.round((totalBookingsCount / 80) * 240)} 240`}
                  strokeDashoffset="60"
                  strokeLinecap="round"
                />
              )}
            </svg>
            <div style={{ position: 'absolute', top: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>{totalBookingsCount}</div>
              <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Bookings</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: '#c084fc' }}></span>
                <span>Occupied</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '9999px', background: '#cbd5e1' }}></span>
                <span>Unsold</span>
              </div>
            </div>
          </div>

          {/* AI Recommendation Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
              borderRadius: '12px',
              padding: '12px',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ fontSize: '1.1rem' }}>✨</span>
              <p style={{ margin: 0, fontSize: '0.74rem', lineHeight: '1.35', color: '#ffffff', opacity: 0.95 }}>
                High demand detected during the holiday peak (89% occupancy). Consider increasing slot rates to maximize revenue.
              </p>
            </div>
            <button
              onClick={() => onSwitchTab('payments')}
              style={{
                alignSelf: 'flex-start',
                background: 'rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Adjust Pricing
            </button>
          </div>
        </div>
      </div>

      {/* BENTO GRID: ROW 2 (Celebration Suites & Latest Bookings) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '24px',
        }}
      >
        {/* CARD 5: CELEBRATION SUITES (Span 7 cols) */}
        <div
          style={{
            gridColumn: 'span 7',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>BeeVibe Celebration Suites</span>
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: bookingsOnDate.length > 0 ? '#dcfce7' : '#f1f5f9',
                  color: bookingsOnDate.length > 0 ? '#15803d' : '#64748b',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>📅</span>
                <span>{bookingsOnDate.length} {bookingsOnDate.length === 1 ? 'Booking' : 'Bookings'} on {formatDisplayDate(selectedDate)}</span>
              </span>
            </div>

            {/* Date Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  padding: '5px 10px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  background: '#ffffff',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              <button
                type="button"
                onClick={() => setSelectedDate(todayIST)}
                style={{
                  padding: '5px 10px',
                  border: selectedDate === todayIST ? '1px solid #1e293b' : '1px solid #e2e8f0',
                  background: selectedDate === todayIST ? '#1e293b' : '#ffffff',
                  color: selectedDate === todayIST ? '#ffffff' : '#64748b',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {suites.map((suite) => {
              const suiteBookings = bookingsOnDate.filter((b) => normalizeRoomId(b) === suite.id);

              return (
                <div
                  key={suite.id}
                  style={{
                    border: suiteBookings.length > 0 ? '1.5px solid #86efac' : '1px solid #f1f5f9',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    background: '#ffffff',
                    boxShadow: suiteBookings.length > 0 ? '0 4px 14px rgba(34, 197, 94, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                >
                  {/* Image Container with Demand Badge */}
                  <div style={{ position: 'relative', width: '100%', height: '110px' }}>
                    <Image
                      src={suite.image}
                      alt={suite.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="200px"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: suite.demandBg,
                        color: suite.demandColor,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {suite.demand}
                    </div>
                  </div>

                  {/* Suite Info & Bookings (No Staff Name) */}
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {suite.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{suite.code}</div>
                    </div>

                    {/* Bookings on Given Date */}
                    <div
                      style={{
                        background: suiteBookings.length > 0 ? '#f0fdf4' : '#f8fafc',
                        border: suiteBookings.length > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: 'auto',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: suiteBookings.length > 0 ? '#166534' : '#64748b' }}>
                          📅 {suiteBookings.length} {suiteBookings.length === 1 ? 'Booking' : 'Bookings'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenManualBooking();
                            }}
                            style={{
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#0284c7',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            + Book
                          </button>
                          {suiteBookings.length > 0 && (
                            <span style={{ fontSize: '0.66rem', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '9999px', fontWeight: 700 }}>
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {suiteBookings.length === 0 ? (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          No bookings on this date
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                          {suiteBookings.map((b: any, bIdx: number) => {
                            const name = b.customerName || b.name || b.guestName || 'Guest';
                            const phone = b.phone || b.customerPhone || b.mobile || 'N/A';
                            return (
                              <div
                                key={b.id || bIdx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectBooking(b);
                                }}
                                style={{
                                  background: '#ffffff',
                                  border: '1px solid #dcfce7',
                                  borderRadius: '6px',
                                  padding: '6px 8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                                }}
                              >
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                                  👤 {name}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                                  <a
                                    href={`tel:${phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}
                                  >
                                    📞 {phone}
                                  </a>
                                  {b.timeSlot && (
                                    <span style={{ color: '#64748b', fontSize: '0.68rem' }}>
                                      🕒 {b.timeSlot}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CARD 6: LATEST BOOKINGS / ACTIVITY (Span 5 cols) */}
        <div
          style={{
            gridColumn: 'span 5',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>Latest Bookings</span>
            <span style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}>•••</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {recentActivities.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No recent reservations recorded yet.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => onSwitchTab('bookings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                      <span style={{ fontWeight: 700 }}>{act.guest}</span> booked a {act.icon} <span style={{ fontWeight: 600 }}>{act.suite}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '3px' }}>{act.time}</div>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>&gt;</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BENTO GRID: ROW 3 (Arriving / Upcoming Guests Table - Full Width) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              {bookingsOnDate.length > 0 ? `Schedule for ${formatDisplayDate(selectedDate)} (${bookingsOnDate.length})` : 'Arriving Guests & Schedule'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '3px 0 0 0' }}>
              {bookingsOnDate.length > 0 ? `Confirmed and scheduled reservations for ${formatDisplayDate(selectedDate)}` : 'Confirmed reservations arriving at BeeVibe Venue'}
            </p>
          </div>

          <button
            onClick={() => onSwitchTab('bookings')}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>View All Bookings</span>
            <span>↗</span>
          </button>
        </div>

        {/* ARRIVING TABLE */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Guest Name ⌵</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Room / Suite ⌵</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Check-in Date ⌵</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Time Slot ⌵</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Total Guests ⌵</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status ⌵</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {arrivingBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '36px 14px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                    No arriving guests scheduled yet. New reservations will automatically appear here.
                  </td>
                </tr>
              ) : (
                arrivingBookings.map((b) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isCancelled = b.status === 'cancelled';
                  const isWaitingPayment = b.paymentStatus === 'pending' || !b.paymentStatus;

                return (
                  <tr
                    key={b.id}
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background 0.2s',
                    }}
                  >
                    {/* Guest Name & Avatar */}
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '9999px',
                            background: '#f1f5f9',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#475569',
                          }}
                        >
                          {b.customerName ? b.customerName.slice(0, 2).toUpperCase() : 'BV'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{b.customerName || 'Guest'}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>+{b.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Room */}
                    <td style={{ padding: '14px', color: '#1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>
                          {b.roomId === 'royal-butterfly'
                            ? '💎'
                            : b.roomId === 'angel-wings'
                            ? '🪽'
                            : b.roomId === 'red-velvet'
                            ? '🌹'
                            : '🎮'}
                        </span>
                        <span style={{ fontWeight: 500 }}>
                          {b.roomId === 'royal-butterfly'
                            ? 'Royal Butterfly'
                            : b.roomId === 'angel-wings'
                            ? 'Angel Wings'
                            : b.roomId === 'red-velvet'
                            ? 'Red Velvet'
                            : b.packageName || 'PS5 Gaming Lounge'}
                        </span>
                      </div>
                    </td>

                    {/* Check-in Date */}
                    <td style={{ padding: '14px', color: '#64748b' }}>
                      {b.date || 'Today'}
                    </td>

                    {/* Time Slot */}
                    <td style={{ padding: '14px', color: '#64748b' }}>
                      {b.timeSlot}
                    </td>

                    {/* Total Guests */}
                    <td style={{ padding: '14px', color: '#64748b' }}>
                      {b.guestCount || 2} Adults
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          background: isConfirmed ? '#dcfce7' : isCancelled ? '#f1f5f9' : '#fef3c7',
                          color: isConfirmed ? '#166534' : isCancelled ? '#64748b' : '#92400e',
                        }}
                      >
                        <span
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '9999px',
                            background: isConfirmed ? '#16a34a' : isCancelled ? '#94a3b8' : '#d97706',
                          }}
                        ></span>
                        <span>{isConfirmed ? 'Confirmed' : isCancelled ? 'Cancelled' : 'Waiting for Payment'}</span>
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                        {onEditBooking && (
                          <button
                            type="button"
                            onClick={() => onEditBooking(b)}
                            style={{
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#334155',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                            title="Edit booking"
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {onDeleteBooking && (
                          <button
                            type="button"
                            onClick={() => onDeleteBooking(b.id)}
                            style={{
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              color: '#ef4444',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                            }}
                            title="Delete booking"
                          >
                            🗑️
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectBooking(b)}
                          style={{
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            color: '#64748b',
                            borderRadius: '6px',
                            padding: '4px 8px',
                            cursor: 'pointer',
                            fontSize: '0.74rem',
                          }}
                          title="Generate bill / invoice"
                        >
                          📄 Bill
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
