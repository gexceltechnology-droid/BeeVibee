'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './gamingBook.module.css';
import { checkBookingOverlap, formatCustomTimeRange, parseTimeRange } from '@/lib/time';
import { Gamepad2, ArrowLeft, Download, Printer, CheckCircle2, ShieldCheck } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { setupRecaptcha, sendFirebaseOtp, verifyFirebaseOtpCode } from '@/lib/firebaseAuth';
import { getAdminWhatsAppDeepLink } from '@/lib/whatsappUtils';

// Gaming Theme Constant (Single Dedicated Dark Gaming Lounge)
const PACKAGES = [
  {
    id: 'pkg-dark-gaming',
    name: '🖤 Dark Gaming Theme',
    price: 999,
    details: [
      '2-Hour Private PS5 Gaming Session',
      '1x PS5 Console + 2 DualSense Controllers Included',
      '180" 4K Projector Screen',
      '7.1 Dolby Surround Sound System',
      'Atmospheric Dark Gaming RGB Ambient Lighting',
      'Air Conditioned Private Lounge (AC)',
    ]
  }
];

interface Slot {
  id: string;
  time: string;
  label: string;
  basePrice: number;
  isBooked: boolean;
}

interface ConfirmedBooking {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  date: string;
  timeSlot: string;
  packageName: string;
  addOns: string[];
  totalPrice: number;
  guestCount: number;
  status: string;
}

export default function GamingBookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [selectedThemeName, setSelectedThemeName] = useState('🖤 Dark Gaming Theme');

  // Load saved theme choice
  useEffect(() => {
    const saved = sessionStorage.getItem('bee_vibe_gaming_theme');
    if (saved === 'cyberpunk') setSelectedThemeName('⚡ Cyberpunk Neon Gaming Theme');
    else if (saved === 'pixel') setSelectedThemeName('👾 8-Bit Pixel Arcade Theme');
    else if (saved === 'warzone') setSelectedThemeName('🔴 Crimson Warzone Gaming Theme');
    else if (saved === 'galaxy') setSelectedThemeName('🌌 Cosmic Galaxy Gaming Theme');
  }, []);

  // Form State
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  // Custom Time Slot states
  const [bookingMode, setBookingMode] = useState<'predefined' | 'custom'>('predefined');
  const [customStart, setCustomStart] = useState('10:00');
  const [customEnd, setCustomEnd] = useState('12:00');
  const [customSlotError, setCustomSlotError] = useState('');

  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);
  const [dslrOption, setDslrOption] = useState<'none' | '30min' | '1hr' | '2hr'>('none');
  const [fogOption, setFogOption] = useState<'none' | '1pot' | '2pots'>('none');
  const [snackOption, setSnackOption] = useState<'none' | 'popcorn_combo' | 'gamer_platter'>('none');

  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    guestCount: 2,
    specialRequests: 'PS5 Gaming Setup Requested (2 Controllers & Games)',
  });

  // Success Confirmation State
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Customer Auth States
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<any>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load customer session
  useEffect(() => {
    const savedPhone = sessionStorage.getItem('bee_vibe_customer_phone');
    if (savedPhone) {
      setCustomerPhone(savedPhone);
      setIsCustomerLoggedIn(true);
      setCustomerDetails((prev) => ({ ...prev, phone: savedPhone }));
    }
  }, []);

  // Fetch slots on date change
  useEffect(() => {
    let active = true;
    async function fetchSlots() {
      if (!selectedDate) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}`);
        if (!res.ok) throw new Error('Failed to load available gaming slots.');
        const data = await res.json();
        if (!active) return;
        setSlots(data.slots || []);
        setActiveBookings(data.activeBookings || []);
      } catch (err: any) {
        if (active) setError(err.message || 'Error fetching slots.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchSlots();
    return () => { active = false; };
  }, [selectedDate]);

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

  // Calculate pricing
  const calculateTotal = () => {
    const pkgBase = selectedPackage ? selectedPackage.price : 0;
    const extraGuests = customerDetails.guestCount > 2 ? (customerDetails.guestCount - 2) * 100 : 0;

    let dslrPrice = 0;
    if (dslrOption === '30min') dslrPrice = 300;
    else if (dslrOption === '1hr') dslrPrice = 500;
    else if (dslrOption === '2hr') dslrPrice = 800;

    let fogPrice = 0;
    if (fogOption === '1pot') fogPrice = 300;
    else if (fogOption === '2pots') fogPrice = 500;

    let snackPrice = 0;
    if (snackOption === 'popcorn_combo') snackPrice = 250;
    else if (snackOption === 'gamer_platter') snackPrice = 450;

    return pkgBase + extraGuests + dslrPrice + fogPrice + snackPrice;
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const phoneTrimmed = loginPhone.trim();
    if (!phoneTrimmed) { setLoginError('Phone number is required.'); setLoginLoading(false); return; }
    let finalPhone = phoneTrimmed.startsWith('+') ? phoneTrimmed : `+91${phoneTrimmed.replace(/^0+/, '')}`;

    try {
      if (isFirebaseConfigured()) {
        const recaptchaVerifier = setupRecaptcha('firebase-recaptcha-btn-gaming');
        if (!recaptchaVerifier) throw new Error('reCAPTCHA failed to initialize.');
        const fbRes = await sendFirebaseOtp(finalPhone, recaptchaVerifier);
        if (!fbRes.success) throw new Error(fbRes.error || 'Failed to send OTP.');
        setFirebaseConfirmation(fbRes.confirmationResult);
      } else {
        const res = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: finalPhone }),
        });
        if (!res.ok) throw new Error('Failed to send OTP.');
      }
      setOtpSent(true);
    } catch (err: any) {
      setLoginError(err.message || 'Error sending OTP.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    let finalPhone = loginPhone.trim().startsWith('+') ? loginPhone.trim() : `+91${loginPhone.trim().replace(/^0+/, '')}`;

    try {
      if (isFirebaseConfigured() && firebaseConfirmation) {
        const fbVerify = await verifyFirebaseOtpCode(firebaseConfirmation, otpCode.trim());
        if (!fbVerify.success) throw new Error(fbVerify.error || 'Invalid OTP.');
      } else {
        const res = await fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: finalPhone, code: otpCode.trim() }),
        });
        if (!res.ok) throw new Error('Invalid OTP.');
      }

      sessionStorage.setItem('bee_vibe_customer_phone', finalPhone);
      setCustomerPhone(finalPhone);
      setIsCustomerLoggedIn(true);
      setShowLoginModal(false);
    } catch (err: any) {
      setLoginError(err.message || 'OTP verification failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (!isCustomerLoggedIn) {
      setShowLoginModal(true);
      setError('Please verify your phone number to complete the booking.');
      return;
    }
    if (!customerDetails.name || !customerDetails.email) {
      setError('Please fill in Name and Email.');
      return;
    }

    setIsPaying(true);
    const bookingPayload = {
      customerName: customerDetails.name,
      email: customerDetails.email,
      phone: customerPhone,
      date: selectedDate,
      timeSlot: selectedSlot?.time,
      packageName: selectedThemeName || selectedPackage.name,
      bookingType: 'gaming',
      addOns: (() => {
        const list: string[] = ['1x PS5 Console + 2 DualSense Controllers (Included ✓)'];
        if (dslrOption === '30min') list.push('DSLR Photography (30 Mins — ₹300)');
        else if (dslrOption === '1hr') list.push('DSLR Photography (1 Hour — ₹500)');
        if (fogOption === '1pot') list.push('Fog Entry (1 Pot — ₹300)');
        if (snackOption === 'popcorn_combo') list.push('Popcorn & Mocktail Combo (₹250)');
        else if (snackOption === 'gamer_platter') list.push('VIP Gamer Snack Platter (₹450)');
        return list;
      })(),
      totalPrice: calculateTotal(),
      guestCount: customerDetails.guestCount,
      specialRequests: customerDetails.specialRequests,
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
      setStep(5);
    } catch (err: any) {
      setError(err.message || 'Transaction failed.');
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
        {step < 5 && (
          <div className={styles.wizardHeader}>
            <div className={`${styles.stepIndicator} ${step === 1 ? styles.stepActive : styles.stepCompleted}`}>
              1. GAMING SLOT {step > 1 && '✓'}
            </div>
            <div className={`${styles.stepIndicator} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepCompleted : ''}`}>
              2. VIBE THEME {step > 2 && '✓'}
            </div>
            <div className={`${styles.stepIndicator} ${step === 3 ? styles.stepActive : step > 3 ? styles.stepCompleted : ''}`}>
              3. ADD-ONS {step > 3 && '✓'}
            </div>
            <div className={`${styles.stepIndicator} ${step === 4 ? styles.stepActive : ''}`}>
              4. GAMER INFO
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

            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: '#ffe600', marginBottom: '12px' }}>
              Available 2-Hour Gaming Slots
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
                  <div className={styles.slotPrice}>{slot.isBooked ? 'Unavailable' : 'Available ✓'}</div>
                </div>
              ))}
            </div>

            <div className={styles.wizardNav}>
              <div />
              <button
                type="button"
                className={styles.btnNavNext}
                onClick={() => {
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
                  <div className={styles.packagePrice}>₹{pkg.price} / 2 Hrs</div>
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
                NEXT: ADD-ONS →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Add-ons */}
        {step === 3 && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: '#ffe600', marginBottom: '16px' }}>
              Gamer Add-ons & Snack Extras (Optional)
            </h3>

            <div className={styles.addonsGrid}>
              {/* Controllers Included Card */}
              <div className={`${styles.addonCard} ${styles.addonSelected}`}>
                <span className={styles.addonName}>🎮 PS5 + 2 DualSense Controllers</span>
                <span className={styles.addonPrice}>Included ✓</span>
                <div style={{ fontSize: '0.8rem', color: '#a0a0c0' }}>
                  2 Wireless Controllers & Top Games (FC 24, Tekken 8, MK1, Spider-Man 2) included with your slot.
                </div>
              </div>

              {/* Snacks Card */}
              <div className={`${styles.addonCard} ${snackOption !== 'none' ? styles.addonSelected : ''}`}>
                <span className={styles.addonName}>🍿 Gourmet Gamer Snacks</span>
                <span className={styles.addonPrice}>
                  {snackOption === 'none' ? 'Optional' : snackOption === 'popcorn_combo' ? '+₹250' : '+₹450'}
                </span>
                <select
                  className={`${styles.addonSelectDropdown} ${snackOption !== 'none' ? styles.addonSelectDropdownActive : ''}`}
                  value={snackOption}
                  onChange={(e) => setSnackOption(e.target.value as any)}
                >
                  <option value="none">No Food (Order later from seat)</option>
                  <option value="popcorn_combo">Popcorn & Cold Mocktail Combo (+₹250)</option>
                  <option value="gamer_platter">VIP Gamer Snack Platter & Drinks (+₹450)</option>
                </select>
              </div>

              {/* DSLR Photo Card */}
              <div className={`${styles.addonCard} ${dslrOption !== 'none' ? styles.addonSelected : ''}`}>
                <span className={styles.addonName}>📸 DSLR Photo Coverage</span>
                <span className={styles.addonPrice}>
                  {dslrOption === 'none' ? 'Optional' : dslrOption === '30min' ? '+₹300' : '+₹500'}
                </span>
                <select
                  className={`${styles.addonSelectDropdown} ${dslrOption !== 'none' ? styles.addonSelectDropdownActive : ''}`}
                  value={dslrOption}
                  onChange={(e) => setDslrOption(e.target.value as any)}
                >
                  <option value="none">No DSLR Photography (₹0)</option>
                  <option value="30min">30 Mins DSLR Photography (+₹300)</option>
                  <option value="1hr">1 Hour DSLR Photography (+₹500)</option>
                </select>
              </div>
            </div>

            <div className={styles.wizardNav}>
              <button type="button" className={styles.btnNavPrev} onClick={() => setStep(2)}>
                ← BACK
              </button>
              <button type="button" className={styles.btnNavNext} onClick={() => setStep(4)}>
                NEXT: GAMER INFO →
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Gamer Info */}
        {step === 4 && (
          <div>
            <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: '1rem', color: '#ffe600', marginBottom: '16px' }}>
              Confirm Gamer Details & Checkout
            </h3>

            <div style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #00f0ff', padding: '16px', borderRadius: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.9rem' }}>
                <div><strong>Date:</strong> {selectedDate}</div>
                <div><strong>Time Slot:</strong> {selectedSlot?.time}</div>
                <div><strong>Vibe Theme:</strong> {selectedPackage.name}</div>
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', fontSize: '1.2rem', color: '#00f0ff', fontWeight: 'bold' }}>
                  Total Cost: ₹{calculateTotal()}
                </div>
              </div>
            </div>

            {!isCustomerLoggedIn ? (
              <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,0,85,0.1)', border: '1px dashed #ff0055', borderRadius: '12px' }}>
                <p style={{ color: '#ffffff', marginBottom: '16px' }}>🔒 Verification Required: Verify your phone via OTP to secure your slot.</p>
                <button
                  type="button"
                  className={styles.btnNavNext}
                  onClick={() => setShowLoginModal(true)}
                >
                  VERIFY PHONE VIA OTP
                </button>
              </div>
            ) : (
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
                  <label className={styles.formLabel} htmlFor="gamer-phone">Phone Number (Verified ✓)</label>
                  <input
                    type="tel"
                    id="gamer-phone"
                    className={styles.formInput}
                    value={customerPhone}
                    disabled
                    style={{ borderColor: '#00ff66', color: '#00ff66', fontWeight: 'bold' }}
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
              </div>
            )}

            <div className={styles.wizardNav}>
              <button type="button" className={styles.btnNavPrev} onClick={() => setStep(3)}>
                ← BACK
              </button>
              <button
                type="button"
                className={styles.btnNavNext}
                onClick={handleSubmitBooking}
                disabled={isPaying || !isCustomerLoggedIn}
              >
                {isPaying ? 'CONFIRMING...' : 'CONFIRM GAMING BOOKING ✓'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Ticket Digital Pass */}
        {step === 5 && confirmedBooking && (
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

              <div className={styles.ticketQr}>
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
                href={getAdminWhatsAppDeepLink('booking', confirmedBooking)}
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
              📱 GAMER PHONE OTP VERIFICATION
            </h3>

            {!otpSent ? (
              <form onSubmit={handleSendOTP}>
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
                <div id="firebase-recaptcha-btn-gaming" />
                <button type="submit" className={styles.btnNavNext} style={{ width: '100%' }} disabled={loginLoading}>
                  {loginLoading ? 'SENDING OTP...' : 'SEND OTP CODE'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div style={{ marginBottom: '16px' }}>
                  <label className={styles.formLabel} htmlFor="otp-code">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    id="otp-code"
                    className={styles.formInput}
                    placeholder="Enter code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className={styles.btnNavNext} style={{ width: '100%' }} disabled={loginLoading}>
                  {loginLoading ? 'VERIFYING...' : 'VERIFY & PROCEED'}
                </button>
              </form>
            )}

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
