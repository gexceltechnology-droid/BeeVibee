'use client';

import React, { useState, useMemo } from 'react';
import type { Booking } from '@/lib/db';
import { normalizeRoomId } from '@/lib/time';

interface OperationsHubProps {
  bookings: any[];
  onOpenManualBooking?: (presetRoom?: string, presetDate?: string) => void;
}

interface RoomStatus {
  id: string;
  name: string;
  state: 'READY' | 'PREPARING' | 'CLEANING' | 'OCCUPIED';
  lastSanitized: string;
}

export default function OperationsHub({ bookings = [], onOpenManualBooking }: OperationsHubProps) {
  const [rooms, setRooms] = useState<RoomStatus[]>([
    { id: 'royal-butterfly', name: 'Royal Butterfly Suite', state: 'READY', lastSanitized: '30 mins ago' },
    { id: 'angel-wings', name: 'Angel Wings Suite', state: 'PREPARING', lastSanitized: '1 hour ago' },
    { id: 'red-velvet', name: 'Red Velvet Heart Room', state: 'READY', lastSanitized: '15 mins ago' },
    { id: 'ps5-gaming', name: 'PS5 Gaming Lounge', state: 'READY', lastSanitized: '20 mins ago' },
  ]);

  const [checklists, setChecklists] = useState<{ [bookingId: string]: { [taskId: string]: boolean } }>({});

  const todayIST = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayIST);

  const toggleTask = (bookingId: string, taskId: string) => {
    setChecklists((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || {}),
        [taskId]: !prev[bookingId]?.[taskId],
      },
    }));
  };

  const handleRoomStateChange = (roomId: string, newState: RoomStatus['state']) => {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, state: newState } : r)));
  };

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

  // Filter bookings for the selected given date (confirmed & pending)
  const bookingsOnDate = useMemo(() => {
    return (bookings || []).filter((b) => b.status !== 'cancelled' && matchesDate(b.date, selectedDate));
  }, [bookings, selectedDate]);

  const totalBookingsOnDate = bookingsOnDate.length;
  const activeBookings = bookingsOnDate.length > 0
    ? bookingsOnDate.slice(0, 8)
    : (bookings || []).filter((b) => b.status === 'confirmed').slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* HEADER */}
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
          Event & Venue Operations
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
          Suite readiness, live bookings by date, and celebration checklist tracking
        </p>
      </div>

      {/* DATE FILTER & BOOKINGS SUMMARY BAR */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📅</span>
            <span>Select Date:</span>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '7px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '0.85rem',
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
              padding: '6px 12px',
              border: selectedDate === todayIST ? '1px solid #1e293b' : '1px solid #e2e8f0',
              background: selectedDate === todayIST ? '#1e293b' : '#ffffff',
              color: selectedDate === todayIST ? '#ffffff' : '#64748b',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              setSelectedDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d));
            }}
            style={{
              padding: '6px 12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Tomorrow
          </button>
          {onOpenManualBooking && (
            <button
              type="button"
              onClick={() => onOpenManualBooking(undefined, selectedDate)}
              style={{
                padding: '6px 14px',
                border: 'none',
                background: '#1e293b',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              }}
            >
              <span>➕</span>
              <span>Manual Booking</span>
            </button>
          )}
        </div>

        {/* Highlighted Total Bookings Count on Given Date */}
        <div
          style={{
            background: totalBookingsOnDate > 0 ? '#dcfce7' : '#f8fafc',
            border: totalBookingsOnDate > 0 ? '1px solid #86efac' : '1px solid #e2e8f0',
            color: totalBookingsOnDate > 0 ? '#15803d' : '#64748b',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '0.86rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>Bookings on {formatDisplayDate(selectedDate)}:</span>
          <span
            style={{
              background: totalBookingsOnDate > 0 ? '#166534' : '#64748b',
              color: '#ffffff',
              padding: '2px 9px',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
            }}
          >
            {totalBookingsOnDate}
          </span>
        </div>
      </div>

      {/* SUITE READINESS & LIVE BOOKINGS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {rooms.map((room) => {
          const isReady = room.state === 'READY';
          const isPrep = room.state === 'PREPARING';
          const isCleaning = room.state === 'CLEANING';
          const isOccupied = room.state === 'OCCUPIED';

          const bg = isReady ? '#dcfce7' : isPrep ? '#fef3c7' : isCleaning ? '#e0f2fe' : '#fee2e2';
          const color = isReady ? '#166534' : isPrep ? '#92400e' : isCleaning ? '#0369a1' : '#991b1b';

          // Get all bookings for this room on the given date
          const roomBookings = bookingsOnDate.filter((b) => normalizeRoomId(b) === room.id);

          return (
            <div
              key={room.id}
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                border: roomBookings.length > 0 ? '1.5px solid #bbf7d0' : '1px solid #f1f5f9',
                boxShadow: roomBookings.length > 0 ? '0 4px 14px rgba(34, 197, 94, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              {/* Room Header with Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1rem' }}>{room.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                    Sanitized: {room.lastSanitized}
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    background: bg,
                    color: color,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {room.state}
                </span>
              </div>

              {/* BOOKINGS ON GIVEN DATE & CUSTOMER DETAILS (NO STAFF NAME) */}
              <div
                style={{
                  background: roomBookings.length > 0 ? '#f0fdf4' : '#f8fafc',
                  border: roomBookings.length > 0 ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: roomBookings.length > 0 ? '#166534' : '#475569' }}>
                    📅 {roomBookings.length} {roomBookings.length === 1 ? 'Booking' : 'Bookings'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {onOpenManualBooking && (
                      <button
                        type="button"
                        onClick={() => onOpenManualBooking(room.id, selectedDate)}
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
                    )}
                    {roomBookings.length > 0 && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '1px 7px',
                          borderRadius: '9999px',
                        }}
                      >
                        Scheduled
                      </span>
                    )}
                  </div>
                </div>

                {roomBookings.length === 0 ? (
                  <div style={{ fontSize: '0.76rem', color: '#94a3b8', padding: '4px 0' }}>
                    No bookings on {formatDisplayDate(selectedDate)}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {roomBookings.map((b: any, idx: number) => {
                      const custName = b.customerName || b.name || b.guestName || 'Guest';
                      const custPhone = b.phone || b.customerPhone || b.mobile || 'N/A';
                      const isConfirmed = b.status === 'confirmed';

                      return (
                        <div
                          key={b.id || idx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #dcfce7',
                            borderRadius: '8px',
                            padding: '8px 10px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.84rem' }}>
                              👤 {custName}
                            </span>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: '9999px',
                                background: isConfirmed ? '#dcfce7' : '#fef3c7',
                                color: isConfirmed ? '#166534' : '#92400e',
                              }}
                            >
                              {isConfirmed ? 'Confirmed' : (b.status || 'Pending')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem' }}>
                            <a
                              href={`tel:${custPhone}`}
                              style={{
                                color: '#0284c7',
                                textDecoration: 'none',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                              }}
                            >
                              📞 {custPhone}
                            </a>
                            {b.timeSlot && (
                              <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
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

              {/* State Switcher */}
              <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                {(['READY', 'PREPARING', 'CLEANING', 'OCCUPIED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleRoomStateChange(room.id, st)}
                    style={{
                      flex: 1,
                      border: '1px solid #e2e8f0',
                      background: room.state === st ? '#1e293b' : '#ffffff',
                      color: room.state === st ? '#ffffff' : '#64748b',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '5px 0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {st === 'READY' ? 'Ready' : st === 'PREPARING' ? 'Prep' : st === 'CLEANING' ? 'Clean' : 'Occ'}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ACTIVE EVENT PREPARATION CHECKLISTS */}
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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              Celebration Checklists & Guest Requests
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '3px 0 0 0' }}>
              Dynamic task lists auto-configured by suite, package and special requests
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {activeBookings.map((b) => {
            const hasCake = b.addOns?.some((a: any) => String(a).toLowerCase().includes('cake'));
            const hasFog = b.addOns?.some((a: any) => String(a).toLowerCase().includes('fog'));
            const hasLed = b.addOns?.some((a: any) => String(a).toLowerCase().includes('led'));

            const tasks = [
              { id: 'room_decor', label: 'Balloon & Table Decor Staging' },
              { id: 'av_check', label: '4K Projector & Surround Sound Test' },
              ...(hasLed ? [{ id: 'led_board', label: 'Program LED Name Board' }] : []),
              ...(hasFog ? [{ id: 'fog_machine', label: 'Dry Ice / Cold Fog Machine Setup' }] : []),
              ...(hasCake ? [{ id: 'cake_cutlery', label: 'Cake Chilling & Sparkler Candles' }] : []),
              { id: 'ac_ambient', label: 'AC Temperature (21°C) & Scenting' },
              { id: 'welcome_ready', label: 'Welcome Drink Preparation' },
            ];

            return (
              <div
                key={b.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '18px',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>
                      {b.customerName}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '2px' }}>
                      {b.roomId || b.packageName} • {b.timeSlot}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: '9999px' }}>
                    {b.date}
                  </span>
                </div>

                {/* Special Requests */}
                {b.specialRequests && (
                  <div style={{ fontSize: '0.75rem', background: '#fffbeb', color: '#92400e', padding: '6px 10px', borderRadius: '6px' }}>
                    📝 Note: {b.specialRequests}
                  </div>
                )}

                {/* Checklist Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {tasks.map((t) => {
                    const isChecked = checklists[b.id]?.[t.id] || false;
                    return (
                      <label
                        key={t.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.8rem',
                          color: isChecked ? '#94a3b8' : '#334155',
                          textDecoration: isChecked ? 'line-through' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleTask(b.id, t.id)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#16a34a' }}
                        />
                        <span>{t.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
