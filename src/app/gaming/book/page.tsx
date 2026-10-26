'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  ArrowLeft,
  CheckCircle2,
  FileText
} from 'lucide-react';
import styles from './gamingBook.module.css';
import {
  checkBookingOverlap,
  formatCustomTimeRange,
  parseTimeRange,
  convert12HourToMinutes,
  convertMinutesTo12Hour,
  validateSlotOperatingHours,
  VENUE_CLOSE_MINUTES
} from '@/lib/time';
import { getAdminWhatsAppDeepLink, BookingData } from '@/lib/whatsappUtils';

interface ConfirmedBooking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  packageName: string;
  totalPrice: number;
  guestCount: number;
  advancePaid?: number;
  balanceDue?: number;
  paymentStatus?: string;
  paymentMode?: string;
  status: string;
  addOns?: string[];
  specialRequests?: string;
}

const PACKAGES = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon Cyber-Lounge',
    details: ['Cyan & Magenta Dual Lasers', 'Bass-Boosted RGB Audio', 'Neon Arcade Glow', 'Custom RGB Color Sync'],
  },
  {
    id: 'retro_arcade',
    name: 'Retro 80s Arcade Synth',
    details: ['Amber CRT Glow Atmosphere', 'Synthwave Soundscapes', 'Retro Pixel Lights', 'Vaporwave Color Palette'],
  },
  {
    id: 'stealth_ops',
    name: 'Stealth Ops Blackout Arena',
    details: ['Deep Emerald Laser Lines', 'Subtle Ambient Backlight', 'High-Contrast Pro Display', 'Competitive Lighting Mode'],
  },
];

const PREDEFINED_SLOTS = [
  { id: 'g-slot-1', time: '10:00 AM - 11:00 AM', label: '10:00 AM – 11:00 AM', basePrice: 99, isBooked: false },
  { id: 'g-slot-2', time: '11:15 AM - 12:15 PM', label: '11:15 AM – 12:15 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-3', time: '12:30 PM - 01:30 PM', label: '12:30 PM – 01:30 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-4', time: '01:45 PM - 02:45 PM', label: '01:45 PM – 02:45 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-5', time: '03:00 PM - 04:00 PM', label: '03:00 PM – 04:00 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-6', time: '04:15 PM - 05:15 PM', label: '04:15 PM – 05:15 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-7', time: '05:30 PM - 06:30 PM', label: '05:30 PM – 06:30 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-8', time: '06:45 PM - 07:45 PM', label: '06:45 PM – 07:45 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-9', time: '08:00 PM - 09:00 PM', label: '08:00 PM – 09:00 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-10', time: '09:15 PM - 10:15 PM', label: '09:15 PM – 10:15 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-11', time: '10:30 PM - 11:30 PM', label: '10:30 PM – 11:30 PM', basePrice: 99, isBooked: false },
  { id: 'g-slot-12', time: '11:00 PM - 12:00 AM', label: '11:00 PM – 12:00 AM (Midnight)', basePrice: 99, isBooked: false },
];

export default function GamingBookPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [step, setStep] = useState(1);
  const [crtEnabled, setCrtEnabled] = useState(false);

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  interface GamingSlot {
    id: string;
    time: string;
    label: string;
    basePrice: number;
    isBooked: boolean;
  }

  const [bookingMode, setBookingMode] = useState<'predefined' | 'custom'>('predefined');
  const [slots, setSlots] = useState<GamingSlot[]>(PREDEFINED_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState<GamingSlot | null>(null);

  // 12-Hour Custom Time Selection States
  const [customStartHour, setCustomStartHour] = useState('10');
  const [customStartMin, setCustomStartMin] = useState('00');
  const [customStartAmPm, setCustomStartAmPm] = useState<'AM' | 'PM'>('AM');
  const [customEndHour, setCustomEndHour] = useState('11');
  const [customEndMin, setCustomEndMin] = useState('00');
  const [customEndAmPm, setCustomEndAmPm] = useState<'AM' | 'PM'>('AM');
  const [customSlotError, setCustomSlotError] = useState('');

  // Packages (No Add-ons for Gaming Room)
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);

  // Customer Details
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    guestCount: 2,
    specialRequests: '',
  });

  // Advance Payment & Ref ID
  const [utrNumber, setUtrNumber] = useState('');
  const [upiCopied, setUpiCopied] = useState(false);

  // Auth
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Booking Flow & Status
  const [activeBookings, setActiveBookings] = useState<ConfirmedBooking[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  // Check login session on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedPhone = sessionStorage.getItem('bee_vibe_customer_phone');
      if (savedPhone) {
        setCustomerPhone(savedPhone);
        setIsCustomerLoggedIn(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Fetch active bookings for selected date
  useEffect(() => {
    async function fetchBookings() {
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}&type=gaming&roomId=ps5-gaming`);
        if (res.ok) {
          const data = await res.json();
          const bList = data.activeBookings || [];
          setActiveBookings(bList);

          // Update predefined slots availability
          if (data.slots && Array.isArray(data.slots)) {
            setSlots(data.slots);
          } else {
            setSlots(
              PREDEFINED_SLOTS.map((s) => {
                const isOverlapping = checkBookingOverlap(selectedDate, s.time, bList);
                return { ...s, isBooked: isOverlapping };
              })
            );
          }
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      }
    }
    fetchBookings();
  }, [selectedDate]);

  // Quick Duration helper
  const applyQuickDuration = (hoursToAdd: number) => {
    const startM = convert12HourToMinutes(
      parseInt(customStartHour, 10),
      parseInt(customStartMin, 10),
      customStartAmPm
    );
    let endM = startM + Math.round(hoursToAdd * 60);
    if (endM > VENUE_CLOSE_MINUTES) {
      endM = VENUE_CLOSE_MINUTES;
    }
    const { hour12, minute, ampm } = convertMinutesTo12Hour(endM);
    setCustomEndHour(String(hour12).padStart(2, '0'));
    setCustomEndMin(String(minute).padStart(2, '0'));
    setCustomEndAmPm(ampm);
  };

  // Effect to calculate custom gaming slot
  useEffect(() => {
    if (bookingMode !== 'custom') return;

    const timer = setTimeout(() => {
      setCustomSlotError('');
      setSelectedSlot(null);

      try {
        const startH = parseInt(customStartHour, 10);
        const startM = parseInt(customStartMin, 10);
        const endH = parseInt(customEndHour, 10);
        const endM = parseInt(customEndMin, 10);

        if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
          setCustomSlotError('Invalid time selection.');
          return;
        }

        const startMinutes = convert12HourToMinutes(startH, startM, customStartAmPm);
        let endMinutes = convert12HourToMinutes(endH, endM, customEndAmPm);

        if (endH === 12 && endM === 0 && customEndAmPm === 'AM' && startMinutes > 0) {
          endMinutes = 1440;
        }

        // Enforce 12:00 AM Midnight operating limit
        const hoursValidation = validateSlotOperatingHours(startMinutes, endMinutes);
        if (!hoursValidation.valid) {
          setCustomSlotError(hoursValidation.error || 'Gaming room closes strictly at 12:00 AM Midnight.');
          return;
        }

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        if (selectedDate === todayStr) {
          const currentMinutes = today.getHours() * 60 + today.getMinutes();
          if (startMinutes <= currentMinutes) {
            setCustomSlotError('Cannot select a time slot that has already passed.');
            return;
          }
        }

        const durationMinutes = endMinutes - startMinutes;
        if (durationMinutes < 60) {
          setCustomSlotError('Minimum gaming duration is 1 hour (60 minutes).');
          return;
        }

        const timeStr = formatCustomTimeRange(startMinutes, endMinutes);
        const overlaps = checkBookingOverlap(selectedDate, timeStr, activeBookings);
        if (overlaps) {
          setCustomSlotError('This custom time range overlaps with an existing gaming booking.');
          return;
        }

        const durationHours = durationMinutes / 60;
        const basePrice = Math.round(99 * Math.max(1, customerDetails.guestCount) * durationHours);

        setSelectedSlot({
          id: 'slot-custom',
          time: timeStr,
          label: `Custom Gaming Slot (${durationHours} Hr${durationHours > 1 ? 's' : ''})`,
          basePrice,
          isBooked: false,
        });
      } catch {
        setCustomSlotError('Error calculating custom time range.');
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [
    bookingMode,
    customStartHour,
    customStartMin,
    customStartAmPm,
    customEndHour,
    customEndMin,
    customEndAmPm,
    selectedDate,
    activeBookings,
  ]);

  // Background 8-bit Pixel Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const pixelColors = ['#00f0ff', '#ff0055', '#ffe600', '#7000ff'];
    const pixels = Array.from({ length: 45 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 5 + 3,
      vy: -(Math.random() * 0.7 + 0.2),
      color: pixelColors[Math.floor(Math.random() * pixelColors.length)],
      alpha: Math.random() * 0.6 + 0.2,
    }));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      pixels.forEach((p) => {
        p.y += p.vy;
        if (p.y < -20) p.y = height + 20;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      });
      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const calculateAdvance = () => Math.min(500, calculateTotal());
  const calculateBalance = () => Math.max(0, calculateTotal() - calculateAdvance());

  const getSlotDurationHours = () => {
    if (!selectedSlot) return 1;
    try {
      const { startMinutes, endMinutes } = parseTimeRange(selectedSlot.time);
      let diff = endMinutes - startMinutes;
      if (diff <= 0) diff += 24 * 60;
      return diff / 60;
    } catch {
      return 1;
    }
  };

  // Calculate pricing (Zero add-ons for gaming room)
  const calculateTotal = () => {
    const durationHours = getSlotDurationHours();
    const pkgBase = Math.round(99 * Math.max(1, customerDetails.guestCount) * durationHours);
    return pkgBase;
  };

  const handleLoginWithPhone = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const phoneTrimmed = loginPhone.trim();
    if (!phoneTrimmed || phoneTrimmed.replace(/\D/g, '').length < 10) {
      setLoginError('Please enter a valid 10-digit phone number.');
      return;
    }
    const finalPhone = phoneTrimmed.startsWith('+') ? phoneTrimmed : `+91${phoneTrimmed.replace(/^0+/, '')}`;
    sessionStorage.setItem('bee_vibe_customer_phone', finalPhone);
    sessionStorage.setItem('bee_vibe_phone_token', 'bypassed');
    setCustomerPhone(finalPhone);
    setIsCustomerLoggedIn(true);
    setShowLoginModal(false);
    setLoginError('');
  };

  const handleSubmitBooking = async () => {
    setError('');

    const finalPhone = customerPhone.trim();
    if (!finalPhone || finalPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!customerDetails.name.trim()) { setError('Please enter your full name.'); return; }
    if (!customerDetails.email.trim()) { setError('Please enter your email address.'); return; }
    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!emailRegex.test(customerDetails.email.trim())) { setError('Please enter a valid email address.'); return; }
    if (customerDetails.guestCount < 1 || customerDetails.guestCount > 10) { setError('Guest count must be between 1 and 10.'); return; }

    if (!utrNumber.trim()) {
      setError('⚠️ Please complete your advance payment and enter your 12-digit UPI Reference / UTR Number below.');
      return;
    }

    setIsPaying(true);
    const bookingPayload = {
      customerName: customerDetails.name,
      email: customerDetails.email,
      phone: finalPhone,
      phoneVerificationToken: 'bypassed',
      b_company_ref: '', // Anti-bot honeypot
      date: selectedDate,
      timeSlot: selectedSlot?.time,
      packageName: selectedPackage.name,
      roomId: 'ps5-gaming',
      theme: 'ps5-gaming',
      bookingType: 'gaming',
      addOns: [],
      totalPrice: calculateTotal(),
      advancePaid: calculateAdvance(),
      balanceDue: calculateBalance(),
      paymentStatus: calculateBalance() === 0 ? 'fully_paid' : 'advance_paid',
      paymentMode: 'UPI (9900106474@okbizaxis)',
      utrNumber: utrNumber.trim(),
      guestCount: customerDetails.guestCount,
      specialRequests: customerDetails.specialRequests + (utrNumber.trim() ? (' | UPI Ref: ' + utrNumber.trim()) : ''),
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete transaction.');
      setConfirmedBooking(data.booking);
      setStep(4);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed.';
      setError(msg);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className={styles.container}>
      {crtEnabled && <div className={styles.crtOverlay} />}
      <canvas ref={canvasRef} className={styles.pixelCanvas} />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/gaming" className={styles.backBtn}>
            <ArrowLeft size={18} /> Gaming Realm
          </Link>
          <div className={styles.pixelLogo}>
            <Gamepad2 size={20} color="#ffe600" /> PIXEL GAMING PORTAL
          </div>
        </div>
        <div>
          <button
            type="button"
            className={styles.backBtn}
            onClick={() => setCrtEnabled(!crtEnabled)}
          >
            {crtEnabled ? '📺 CRT: ON' : '📺 CRT: OFF'}
          </button>
        </div>
      </header>

      {/* Main Portal Card */}
      <div className={styles.portalCard}>
        {step < 4 && (
          <div className={styles.wizardHeader}>
            <div className={`${styles.stepIndicator} ${step === 1 ? styles.stepActive : styles.stepCompleted}`}>
              1. GAMING SLOT {step > 1 && '✓'}
            </div>
            <div className={`${styles.stepIndicator} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepCompleted : ''}`}>
              2. VIBE THEME {step > 2 && '✓'}
            </div>
            <div className={`${styles.stepIndicator} ${step === 3 ? styles.stepActive : ''}`}>
              3. GAMER INFO & ADVANCE
            </div>
          </div>
        )}

        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* STEP 1: Date & Time Slot */}
        {step === 1 && (
          <div>
            <div className={styles.dateSection}>
              <label className={styles.dateInputLabel} htmlFor="gaming-date">Choose PS5 Gaming Date</label>
              <input
                type="date"
                id="gaming-date"
                className={styles.datePicker}
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button
                type="button"
                className={styles.backBtn}
                style={{ flex: 1, borderColor: bookingMode === 'predefined' ? '#ffe600' : 'rgba(255,255,255,0.2)', color: bookingMode === 'predefined' ? '#ffe600' : '#fff' }}
                onClick={() => { setBookingMode('predefined'); setSelectedSlot(null); }}
              >
                🎮 1-Hour Standard Slots (₹99/Person)
              </button>
              <button
                type="button"
                className={styles.backBtn}
                style={{ flex: 1, borderColor: bookingMode === 'custom' ? '#00f0ff' : 'rgba(255,255,255,0.2)', color: bookingMode === 'custom' ? '#00f0ff' : '#fff' }}
                onClick={() => { setBookingMode('custom'); setSelectedSlot(null); }}
              >
                ⏱️ Custom Gaming Duration (Min 1 Hr)
              </button>
            </div>

            {bookingMode === 'predefined' ? (
              <>
                <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: '#ffe600', marginBottom: '12px' }}>
                  Available 1-Hour Gaming Slots (₹99 / Person / Hr · Till 12:00 AM Midnight)
                </h3>
                <div className={styles.slotsGrid}>
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`${styles.slotCard} ${slot.isBooked ? styles.slotBooked : ''} ${selectedSlot?.id === slot.id ? styles.slotSelected : ''}`}
                      onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                    >
                      <div className={styles.slotLabel}>{slot.label}</div>
                      <div className={styles.slotTime}>{slot.time}</div>
                      <div className={styles.slotPrice}>{slot.isBooked ? 'Unavailable' : '₹99 / Person ✓'}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.time12hPickerContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                  <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.95rem', color: '#00f0ff', margin: 0 }}>
                    Custom Gaming Hours (₹99/Person/Hour · Min 1 Hour)
                  </h3>
                  <span style={{ fontFamily: 'var(--font-vt323)', fontSize: '1.1rem', background: 'rgba(0, 240, 255, 0.12)', border: '1px solid #00f0ff', color: '#00f0ff', padding: '2px 8px', borderRadius: '4px' }}>
                    ⏰ Open 10:00 AM – 12:00 AM (Midnight)
                  </span>
                </div>

                <div className={styles.time12hInputsGrid}>
                  <div className={styles.timePickerCard}>
                    <div className={styles.timePickerCardHeader}>
                      <span className={styles.timePickerCardTitle}>🟢 START TIME</span>
                    </div>
                    <div className={styles.timePickerControls}>
                      <select className={styles.timeSelect} value={customStartHour} onChange={(e) => setCustomStartHour(e.target.value)}>
                        {['10', '11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09'].map((h) => (
                          <option key={'g-sh-' + h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className={styles.timeSeparator}>:</span>
                      <select className={styles.timeSelect} value={customStartMin} onChange={(e) => setCustomStartMin(e.target.value)}>
                        {['00', '15', '30', '45'].map((m) => (
                          <option key={'g-sm-' + m} value={m}>{m}</option>
                        ))}
                      </select>
                      <div className={styles.ampmToggleGroup}>
                        <button type="button" className={styles.ampmBtn + (customStartAmPm === 'AM' ? ' ' + styles.ampmBtnActive : '')} onClick={() => setCustomStartAmPm('AM')}>AM</button>
                        <button type="button" className={styles.ampmBtn + (customStartAmPm === 'PM' ? ' ' + styles.ampmBtnActive : '')} onClick={() => setCustomStartAmPm('PM')}>PM</button>
                      </div>
                    </div>
                  </div>

                  <div className={styles.timePickerCard}>
                    <div className={styles.timePickerCardHeader}>
                      <span className={styles.timePickerCardTitle}>🔴 END TIME (MAX 12:00 AM)</span>
                    </div>
                    <div className={styles.timePickerControls}>
                      <select className={styles.timeSelect} value={customEndHour} onChange={(e) => setCustomEndHour(e.target.value)}>
                        {['10', '11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09'].map((h) => (
                          <option key={'g-eh-' + h} value={h}>{h}</option>
                        ))}
                      </select>
                      <span className={styles.timeSeparator}>:</span>
                      <select className={styles.timeSelect} value={customEndMin} onChange={(e) => setCustomEndMin(e.target.value)}>
                        {['00', '15', '30', '45'].map((m) => (
                          <option key={'g-em-' + m} value={m}>{m}</option>
                        ))}
                      </select>
                      <div className={styles.ampmToggleGroup}>
                        <button type="button" className={styles.ampmBtn + (customEndAmPm === 'AM' ? ' ' + styles.ampmBtnActive : '')} onClick={() => setCustomEndAmPm('AM')}>AM</button>
                        <button type="button" className={styles.ampmBtn + (customEndAmPm === 'PM' ? ' ' + styles.ampmBtnActive : '')} onClick={() => setCustomEndAmPm('PM')}>PM</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.quickDurationSection}>
                  <span className={styles.quickDurationTitle}>⚡ Quick Gaming Presets:</span>
                  <div className={styles.quickDurationPills}>
                    <button type="button" className={styles.quickDurationBtn} onClick={() => applyQuickDuration(1)}>+1 Hour</button>
                    <button type="button" className={styles.quickDurationBtn} onClick={() => applyQuickDuration(2)}>+2 Hours (Recommended)</button>
                    <button type="button" className={styles.quickDurationBtn} onClick={() => applyQuickDuration(3)}>+3 Hours (Marathon)</button>
                    <button type="button" className={styles.quickDurationBtn} onClick={() => applyQuickDuration(4)}>+4 Hours</button>
                  </div>
                </div>

                {customSlotError ? (
                  <div className={styles.errorMessage}>{customSlotError}</div>
                ) : selectedSlot ? (
                  <div style={{ color: '#00ff66', fontWeight: 'bold', fontSize: '0.95rem', marginTop: '10px' }}>
                    ✓ Selected Range: {selectedSlot.time} ({selectedSlot.label}) — ₹{selectedSlot.basePrice}
                  </div>
                ) : null}
              </div>
            )}

            <div className={styles.wizardNav}>
              <div />
              <button
                type="button"
                className={styles.btnNavNext}
                onClick={() => {
                  if (bookingMode === 'custom' && customSlotError) {
                    setError(customSlotError);
                    return;
                  }
                  if (!selectedSlot) { setError('Please select a gaming slot.'); return; }
                  setError('');
                  setStep(2);
                }}
              >
                NEXT: SELECT VIBE →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Vibe Package */}
        {step === 2 && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: '#ffe600', marginBottom: '16px' }}>
              Select Room RGB Gaming Atmosphere
            </h3>

            <div className={styles.packagesGrid}>
              {PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`${styles.packageCard} ${selectedPackage.id === pkg.id ? styles.packageSelected : ''}`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <h4 className={styles.packageName}>{pkg.name}</h4>
                  <div className={styles.packagePrice}>₹399 / Hour (Min 1 Hr)</div>
                  <ul className={styles.packageDetails}>
                    {pkg.details.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className={styles.wizardNav}>
              <button type="button" className={styles.btnNavPrev} onClick={() => setStep(1)}>
                ← BACK
              </button>
              <button type="button" className={styles.btnNavNext} onClick={() => setStep(3)}>
                NEXT: GAMER INFO & ADVANCE →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Gamer Info & Advance Payment */}
        {step === 3 && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: '#ffe600', marginBottom: '16px' }}>
              Confirm Gamer Details & Pay Advance
            </h3>

            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #00f0ff', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.9rem' }}>
                <div><strong>Date:</strong> {selectedDate}</div>
                <div><strong>Time Slot:</strong> {selectedSlot?.time} ({getSlotDurationHours()} Hour{getSlotDurationHours() > 1 ? 's' : ''})</div>
                <div><strong>Rate:</strong> ₹399 / Hour</div>
                <div><strong>Gaming Vibe:</strong> {selectedPackage.name}</div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', fontSize: '1.2rem', color: '#00f0ff', fontWeight: 'bold' }}>
                  Total Cost: ₹{calculateTotal()}
                </div>
              </div>
            </div>

              <div className={styles.bookingForm}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="gamer-name">Full Name *</label>
                  <input
                    type="text"
                    id="gamer-name"
                    className={styles.formInput}
                    placeholder="Enter your name"
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="gamer-email">Email Address *</label>
                  <input
                    type="email"
                    id="gamer-email"
                    className={styles.formInput}
                    placeholder="Enter email address"
                    value={customerDetails.email}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="gamer-phone">
                    WhatsApp Mobile Number *
                  </label>
                  <input
                    type="tel"
                    id="gamer-phone"
                    className={styles.formInput}
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setCustomerPhone(val);
                    }}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="gamer-guests">Number of Gamers (Max 10)</label>
                  <input
                    type="number"
                    id="gamer-guests"
                    className={styles.formInput}
                    min="1"
                    max="10"
                    value={customerDetails.guestCount}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, guestCount: Math.min(10, Math.max(1, parseInt(e.target.value, 10) || 1)) })}
                  />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel} htmlFor="gamer-special">Game Requests or Notes</label>
                  <textarea
                    id="gamer-special"
                    className={styles.formTextarea}
                    placeholder="e.g. Keep FC 24 & Tekken 8 loaded, extra controllers..."
                    value={customerDetails.specialRequests}
                    onChange={(e) => setCustomerDetails({ ...customerDetails, specialRequests: e.target.value })}
                  />
                </div>

                {/* Gaming Advance Payment Card */}
                <div className={styles.advancePaymentCard} style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.advanceHeader}>
                    <span style={{ fontSize: '1.4rem' }}>💳</span>
                    <div>
                      <h4 className={styles.advanceHeaderTitle}>ADVANCE PAYMENT REQUIRED TO LOCK GAMING LOUNGE</h4>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#a0a0c0' }}>
                        To block your Gaming Lounge and consoles, an advance deposit of ₹{calculateAdvance()} is required.
                      </p>
                    </div>
                  </div>

                  <div className={styles.advanceBreakdownRow}>
                    <div className={styles.advanceBreakdownItem}>
                      <div className={styles.advanceBreakdownLabel}>TOTAL COST</div>
                      <div className={styles.advanceBreakdownVal}>₹{calculateTotal()}</div>
                    </div>
                    <div className={styles.advanceBreakdownItem + ' ' + styles.advancePayableHighlight}>
                      <div className={styles.advanceBreakdownLabel}>🟢 ADVANCE DUE NOW</div>
                      <div className={styles.advanceBreakdownVal}>₹{calculateAdvance()}</div>
                    </div>
                    <div className={styles.advanceBreakdownItem}>
                      <div className={styles.advanceBreakdownLabel}>⏳ BALANCE AT LOUNGE</div>
                      <div className={styles.advanceBreakdownVal}>₹{calculateBalance()}</div>
                    </div>
                  </div>

                  <div className={styles.advanceQrSection}>
                    <div className={styles.advanceQrImgWrapper}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={"https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + encodeURIComponent("upi://pay?pa=9900106474@okbizaxis&pn=Bee%20Vibe%20Theater&am=" + calculateAdvance() + "&cu=INR&tn=Advance%20Gaming%20Booking%20BeeVibe")}
                        alt="UPI Advance QR Code"
                        width={150}
                        height={150}
                        style={{ display: 'block' }}
                      />
                    </div>
                    <div className={styles.advanceQrInfo}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#ffffff' }}>
                        📲 Scan QR with any UPI App (GPay, PhonePe, Paytm, BHIM)
                      </div>
                      <div className={styles.upiIdBox}>
                        <span style={{ fontSize: '0.8rem', color: '#a0a0c0' }}>UPI ID:</span>
                        <span className={styles.upiIdText}>9900106474@okbizaxis</span>
                        <button
                          type="button"
                          className={styles.upiCopyBtn}
                          onClick={() => {
                            navigator.clipboard.writeText('9900106474@okbizaxis');
                            setUpiCopied(true);
                            setTimeout(() => setUpiCopied(false), 2000);
                          }}
                        >
                          {upiCopied ? '✓ Copied' : '📋 Copy'}
                        </button>
                      </div>
                      <a
                        href={"upi://pay?pa=9900106474@okbizaxis&pn=Bee%20Vibe%20Theater&am=" + calculateAdvance() + "&cu=INR&tn=Advance%20Gaming%20Booking%20BeeVibe"}
                        className={styles.upiIntentBtn}
                      >
                        ⚡ Pay ₹{calculateAdvance()} via UPI App
                      </a>
                      <div style={{ marginTop: '6px' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', color: '#a0a0c0', marginBottom: '4px' }}>
                          UPI UTR / Reference ID or Last 4 Digits (Optional):
                        </label>
                        <input
                          type="text"
                          className={styles.formInput}
                          placeholder="e.g. 423987123456 or last 4 digits"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value)}
                          style={{ padding: '8px 12px', fontSize: '0.88rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            <div className={styles.wizardNav}>
              <button type="button" className={styles.btnNavPrev} onClick={() => setStep(2)}>
                ← BACK
              </button>
              <button
                type="button"
                className={styles.btnNavNext}
                onClick={handleSubmitBooking}
                disabled={isPaying}
              >
                {isPaying ? 'CONFIRMING...' : `CONFIRM GAMING (₹${calculateAdvance()} ADVANCE PAID) ✓`}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Ticket Digital Pass */}
        {step === 4 && confirmedBooking && (
          <div className={styles.ticketWrapper}>
            <div style={{ color: '#00ff66', marginBottom: '12px' }}>
              <CheckCircle2 size={54} />
            </div>
            <div className={styles.ticketCard}>
              <div className={styles.ticketHeader}>BEE VIBE GAMING PASS</div>
              <div className={styles.ticketSub}>VIP PIXEL GAMING TICKET</div>

              <div className={styles.ticketRow}>
                <span className={styles.ticketLabel}>PASS ID</span>
                <span className={styles.ticketValue}>{confirmedBooking.id}</span>
              </div>
              <div className={styles.ticketRow}>
                <span className={styles.ticketLabel}>GAMER NAME</span>
                <span className={styles.ticketValue}>{confirmedBooking.customerName}</span>
              </div>
              <div className={styles.ticketRow}>
                <span className={styles.ticketLabel}>DATE & TIME</span>
                <span className={styles.ticketValue}>{confirmedBooking.date} ({confirmedBooking.timeSlot})</span>
              </div>
              <div className={styles.ticketRow}>
                <span className={styles.ticketLabel}>GAMING VIBE</span>
                <span className={styles.ticketValue}>{confirmedBooking.packageName}</span>
              </div>
              <div className={styles.ticketRow}>
                <span className={styles.ticketLabel}>TOTAL PRICE</span>
                <span className={styles.ticketValue} style={{ color: '#ffe600', fontSize: '1.2rem' }}>₹{confirmedBooking.totalPrice}</span>
              </div>
              <div className={styles.ticketRow} style={{ background: 'rgba(0, 255, 102, 0.1)', borderRadius: '6px', padding: '8px', margin: '8px 0' }}>
                <span className={styles.ticketLabel} style={{ color: '#00ff66' }}>🟢 ADVANCE (PAID)</span>
                <span className={styles.ticketValue} style={{ color: '#00ff66' }}>₹{confirmedBooking.advancePaid ?? 500}</span>
              </div>
              <div className={styles.ticketRow} style={{ background: 'rgba(255, 230, 0, 0.1)', borderRadius: '6px', padding: '8px', margin: '8px 0' }}>
                <span className={styles.ticketLabel} style={{ color: '#ffe600' }}>⏳ BALANCE AT LOUNGE</span>
                <span className={styles.ticketValue} style={{ color: '#ffe600' }}>₹{confirmedBooking.balanceDue ?? Math.max(0, confirmedBooking.totalPrice - (confirmedBooking.advancePaid ?? 500))}</span>
              </div>

              <div className={styles.ticketQr}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${confirmedBooking.id}`}
                  alt="QR Code"
                  width={130}
                  height={130}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={`/receipt?id=${confirmedBooking.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnNavNext}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#a855f7',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)',
                }}
              >
                <FileText size={18} />
                VIEW ADVANCE RECEIPT
              </a>
              <a
                href={getAdminWhatsAppDeepLink('booking', confirmedBooking as unknown as BookingData)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.btnNavNext}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#25D366',
                  color: '#ffffff',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>💬</span>
                NOTIFY ADMIN ON WHATSAPP (+91 9900106474)
              </a>
              <Link href="/gaming" className={styles.btnNavNext}>
                BACK TO GAMING REALM 🎮
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* OTP Phone Verification Modal */}
      {showLoginModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0a0a14', border: '2px solid #00f0ff', padding: '28px', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1.1rem', color: '#ffe600', marginBottom: '16px' }}>
              📱 GAMER ACCESS
            </h3>

            <form onSubmit={handleLoginWithPhone}>
              <div style={{ marginBottom: '16px' }}>
                <label className={styles.formLabel} htmlFor="otp-phone">Mobile Phone Number</label>
                <input
                  type="tel"
                  id="otp-phone"
                  className={styles.formInput}
                  placeholder="Enter 10-digit mobile number"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.btnNavNext} style={{ width: '100%' }}>
                ACCESS MY GAMING PASSES
              </button>
            </form>

            {loginError && <div className={styles.errorMessage} style={{ marginTop: '16px' }}>{loginError}</div>}
            <button
              type="button"
              className={styles.btnNavPrev}
              style={{ width: '100%', marginTop: '12px' }}
              onClick={() => setShowLoginModal(false)}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
