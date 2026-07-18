'use client';

import React, { useState, useEffect } from 'react';
import styles from './BookingPortal.module.css';

import { checkBookingOverlap, formatCustomTimeRange, parseTimeRange } from '@/lib/time';
import { Download, Printer } from 'lucide-react';

// Packages Constant
const PACKAGES = [
  {
    id: 'pkg-movie',
    name: 'Movie Vibe Pack',
    price: 0,
    details: [
      '2-Hour Private Screen Booking',
      'Cinema Surround Sound (Dolby)',
      '2 Large Salted Popcorn Buckets',
      'Unlimited Soft Drinks for Guests',
      'Standard Ambient Warm Lighting',
    ]
  },
  {
    id: 'pkg-birthday',
    name: 'Birthday Bash Vibe',
    price: 0,
    details: [
      '2-Hour Private Screen Booking',
      'Premium Birthday Theme Decoration (Black & Gold Balloons)',
      'Custom Screen Birthday Intro Video',
      '1kg Chocolate Fudge Cake included',
      'Party Hats, Snow Spray & Party Props',
    ]
  },
  {
    id: 'pkg-romance',
    name: 'Cozy Romance Vibe',
    price: 0,
    details: [
      '2-Hour Private Screen Booking',
      'Red Carpet Entrance & LED Candle Pathway',
      'Beautiful Rose Petals Floor decoration',
      'Fresh Welcome Mocktails for Couple',
      'Custom Romantic Screen Slide (Send us your photos)',
      'Red Rose Bouquet for your partner',
    ]
  },
  {
    id: 'pkg-gaming',
    name: 'Ultimate Gaming Vibe',
    price: 0,
    details: [
      '2-Hour Private Screen Booking',
      'Console setup (PS5 / Xbox Series X) on massive screen',
      '4 Multiplayer Controllers provided',
      'Dynamic Neon / Cyberpunk Lighting settings',
      'Gamer Snack Platter (Nachos, Fries, Energy Drinks)',
    ]
  }
];

// Add-ons Constant
const ADDONS = [
  { id: 'add-rose', name: 'Fresh Rose Bouquet', price: 0 },
  { id: 'add-nachos', name: 'Gourmet Nachos & Dip Platter', price: 0 },
  { id: 'add-cake', name: '1kg Red Velvet Designer Cake', price: 0 },
  { id: 'add-photo', name: '30-Mins Photo Shoot & Digital Copy', price: 0 },
  { id: 'add-balloons', name: 'Extra Premium Helium Balloons (x30)', price: 0 },
  { id: 'add-fog', name: 'Special Screen Entry Fog Effect', price: 0 },
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

interface ActiveBooking {
  id: string;
  date: string;
  timeSlot: string;
  status?: string;
}

export default function BookingPortal() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  // Custom Time Slot states
  const [bookingMode, setBookingMode] = useState<'predefined' | 'custom'>('predefined');
  const [customStart, setCustomStart] = useState('10:00');
  const [customEnd, setCustomEnd] = useState('12:00');
  const [customSlotError, setCustomSlotError] = useState('');

  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[0]);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    guestCount: 2,
    specialRequests: '',
  });

  // Success Confirmation State
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  // Payment states
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStep, setPaymentStep] = useState(0);

  // Customer Auth & Orders States
  const [customerPhone, setCustomerPhone] = useState('');
  const [isCustomerLoggedIn, setIsCustomerLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'book' | 'orders'>('book');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [customerBookings, setCustomerBookings] = useState<ConfirmedBooking[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [selectedTicketToView, setSelectedTicketToView] = useState<ConfirmedBooking | null>(null);

  // Fetch slots on date change
  useEffect(() => {
    let active = true;

    async function fetchSlots() {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!selectedDate || !dateRegex.test(selectedDate)) {
        setSlots([]);
        setActiveBookings([]);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}`);
        if (!active) return;

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to load slots.');
        }

        const data = await res.json();
        if (!active) return;

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const parsedSlots = (data.slots || []).map((slot: any) => {
          if (selectedDate === todayStr) {
            try {
              const { startMinutes } = parseTimeRange(slot.time);
              const currentMinutes = today.getHours() * 60 + today.getMinutes();
              if (startMinutes <= currentMinutes) {
                return { ...slot, isBooked: true };
              }
            } catch (e) {
              console.error('Error checking past slot:', e);
            }
          }
          return slot;
        });

        setSlots(parsedSlots);
        setActiveBookings(data.activeBookings || []);

        if (selectedSlot && bookingMode === 'predefined') {
          const stillAvailable = parsedSlots.find(
            (s: any) => s.time === selectedSlot.time && !s.isBooked
          );
          if (!stillAvailable) setSelectedSlot(null);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err.message || 'Error fetching available slots.');
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchSlots();
  }, [selectedDate, bookingMode]);

  // Load customer session on mount
  useEffect(() => {
    const savedPhone = sessionStorage.getItem('bee_vibe_customer_phone');
    if (savedPhone) {
      setCustomerPhone(savedPhone);
      setIsCustomerLoggedIn(true);
      setCustomerDetails((prev) => ({ ...prev, phone: savedPhone }));
    }
  }, []);

  // Fetch bookings for the logged-in customer
  const fetchCustomerBookings = async (phoneToQuery: string) => {
    setLoadingOrders(true);
    setOrdersError('');
    try {
      const res = await fetch(`/api/bookings/customer?phone=${encodeURIComponent(phoneToQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load bookings.');
      setCustomerBookings(data.bookings || []);
    } catch (err: any) {
      setOrdersError(err.message || 'Error loading bookings list.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isCustomerLoggedIn && customerPhone) {
      fetchCustomerBookings(customerPhone);
    }
  }, [isCustomerLoggedIn, customerPhone]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const trimmedPhone = loginPhone.trim();
    if (!trimmedPhone) {
      setLoginError('Phone number is required.');
      setLoginLoading(false);
      return;
    }

    let finalPhone = trimmedPhone;
    if (!finalPhone.startsWith('+')) {
      // Remove any leading zeros and prepend countryCode
      finalPhone = `${countryCode}${finalPhone.replace(/^0+/, '')}`;
    }

    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: finalPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');

      setOtpSent(true);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to send OTP. Please check the number.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const trimmedPhone = loginPhone.trim();
    let finalPhone = trimmedPhone;
    if (!finalPhone.startsWith('+')) {
      finalPhone = `${countryCode}${finalPhone.replace(/^0+/, '')}`;
    }
    const trimmedCode = otpCode.trim();

    if (!trimmedPhone || !trimmedCode) {
      setLoginError('Phone number and OTP code are required.');
      setLoginLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: finalPhone, code: trimmedCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid OTP code.');

      // Login successful
      sessionStorage.setItem('bee_vibe_customer_phone', finalPhone);
      setCustomerPhone(finalPhone);
      setIsCustomerLoggedIn(true);
      setCustomerDetails((prev) => ({ ...prev, phone: finalPhone }));

      // Reset
      setShowLoginModal(false);
      setOtpSent(false);
      setOtpCode('');
      setLoginPhone('');
      setLoginError('');
    } catch (err: any) {
      setLoginError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCustomerLogout = () => {
    sessionStorage.removeItem('bee_vibe_customer_phone');
    setCustomerPhone('');
    setIsCustomerLoggedIn(false);
    setCustomerDetails((prev) => ({ ...prev, phone: '' }));
    setCustomerBookings([]);
    setCurrentView('book');
  };

  // Effect to trigger canvas-based confetti when step 5 is reached
  useEffect(() => {
    if (step !== 5 || !confirmedBooking) return;

    const canvas = document.getElementById('confetti-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const colors = ['#f2a900', '#ffffff', '#ff2e7e', '#00d4ff', '#9333ea'];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      r: Math.random() * 6 + 4,
      d: Math.random() * height,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0,
    }));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
        p.x += Math.sin(p.tiltAngle);
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;

        ctx.beginPath();
        ctx.lineWidth = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
        ctx.stroke();

        if (p.y > height) {
          particles[idx] = {
            x: Math.random() * width,
            y: -20,
            r: p.r,
            d: p.d,
            color: p.color,
            tilt: p.tilt,
            tiltAngleIncremental: p.tiltAngleIncremental,
            tiltAngle: p.tiltAngle,
          };
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    const timeoutId = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    }, 6000);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [step, confirmedBooking]);

  // Effect to automatically calculate custom slot details when timing inputs change
  useEffect(() => {
    if (bookingMode !== 'custom') return;

    setCustomSlotError('');
    setSelectedSlot(null);

    if (!customStart || !customEnd) {
      return;
    }

    try {
      const [startH, startM] = customStart.split(':').map(Number);
      const [endH, endM] = customEnd.split(':').map(Number);
      
      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) {
        setCustomSlotError('Invalid time selection.');
        return;
      }

      const startMinutes = startH * 60 + startM;
      
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

      let endMinutes = endH * 60 + endM;

      if (endMinutes <= startMinutes) {
        endMinutes += 24 * 60; // crosses midnight
      }

      const durationMinutes = endMinutes - startMinutes;
      if (durationMinutes < 30) {
        setCustomSlotError('Custom slot must be at least 30 minutes.');
        return;
      }

      // Format custom slot time string, e.g. "10:00 AM - 12:00 PM"
      const timeStr = formatCustomTimeRange(startMinutes, endMinutes);

      // Perform client-side overlap check against active bookings
      const overlaps = checkBookingOverlap(selectedDate, timeStr, activeBookings);
      if (overlaps) {
        setCustomSlotError('This custom time range overlaps with an existing booking.');
        return;
      }

      // Base price calculation: ₹999 for every 2 hours (pro-rated)
      const durationHours = durationMinutes / 60;
      const basePrice = Math.round((durationHours / 2) * 999);

      setSelectedSlot({
        id: 'slot-custom',
        time: timeStr,
        label: 'Custom Slot',
        basePrice,
        isBooked: false,
      });
    } catch (e) {
      setCustomSlotError('Error calculating custom time range.');
    }
  }, [bookingMode, customStart, customEnd, selectedDate, activeBookings]);

  // Calculate dynamic pricing
  const calculateTotal = () => {
    const slotBase = selectedSlot ? selectedSlot.basePrice : 0;
    const pkgBase = selectedPackage ? selectedPackage.price : 0;
    const addonsTotal = selectedAddons.reduce((sum, addonId) => {
      const addon = ADDONS.find((a) => a.id === addonId);
      return sum + (addon ? addon.price : 0);
    }, 0);
    return slotBase + pkgBase + addonsTotal;
  };

  const handleAddonToggle = (addonId: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'guestCount') {
      const val = parseInt(value, 10);
      if (isNaN(val)) {
        setCustomerDetails((prev) => ({ ...prev, [name]: 0 }));
      } else {
        const clampedVal = Math.max(0, Math.min(10, val));
        setCustomerDetails((prev) => ({ ...prev, [name]: clampedVal }));
      }
    } else {
      setCustomerDetails((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      if (bookingMode === 'custom' && customSlotError) {
        setError(customSlotError);
        return;
      }
      if (!selectedSlot) {
        setError('Please select a time slot to proceed.');
        return;
      }
    }
    if (step === 4) {
      if (!isCustomerLoggedIn) {
        setError('Please log in and verify your phone number to proceed.');
        return;
      }
      if (!customerDetails.name || !customerDetails.email) {
        setError('Please fill in all required fields (Name and Email).');
        return;
      }
      if (customerDetails.guestCount < 1 || customerDetails.guestCount > 10) {
        setError('Guest count must be between 1 and 10.');
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    setError('');
    setStep((prev) => prev - 1);
  };

  const handleSubmitBooking = async () => {
    setError('');

    if (!isCustomerLoggedIn) {
      setError('Please log in and verify your phone number.');
      return;
    }
    if (!customerDetails.name.trim()) { setError('Please enter your full name.'); return; }
    if (!customerDetails.email.trim()) { setError('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerDetails.email.trim())) { setError('Please enter a valid email address.'); return; }
    if (customerDetails.guestCount < 1 || customerDetails.guestCount > 10) { setError('Guest count must be between 1 and 10.'); return; }

    setIsPaying(true);
    setPaymentStep(0);

    const bookingPayload = {
      customerName: customerDetails.name,
      email: customerDetails.email,
      phone: customerPhone,
      date: selectedDate,
      timeSlot: selectedSlot?.time,
      packageName: selectedPackage.name,
      addOns: selectedAddons.map((id) => ADDONS.find((a) => a.id === id)?.name || id),
      totalPrice: calculateTotal(),
      guestCount: customerDetails.guestCount,
      specialRequests: customerDetails.specialRequests,
    };

    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Step 0: Connecting securely (1.2s)
      await sleep(1200);
      setPaymentStep(1);

      // Step 1: Authorizing transaction (1.2s)
      await sleep(1200);
      setPaymentStep(2);

      // Step 2: Finalizing booking (Server API Call)
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete transaction.');

      setPaymentStep(3); // Success
      setConfirmedBooking(data.booking);

      // Let the success state be visible for a short time
      await sleep(1500);
      setIsPaying(false);
      setStep(5);
    } catch (err: any) {
      setIsPaying(false);
      setError(err.message || 'Payment transaction failed. Please try again.');
    }
  };

  // Verification code methods removed

  const handleDownloadSVG = () => {
    if (!confirmedBooking) return;
    
    const escapeXml = (str: string) => {
      if (!str) return '';
      return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    const id = escapeXml(confirmedBooking.id);
    const name = escapeXml(confirmedBooking.customerName);
    const date = escapeXml(confirmedBooking.date);
    const slot = escapeXml(confirmedBooking.timeSlot);
    const pkg = escapeXml(confirmedBooking.packageName);
    const status = escapeXml(confirmedBooking.status.toUpperCase());
    const addons = confirmedBooking.addOns.map(escapeXml).join(', ');
    const guests = confirmedBooking.guestCount;
    const price = confirmedBooking.totalPrice;

    const hasAddons = confirmedBooking.addOns.length > 0;
    const height = hasAddons ? 850 : 790;
    const dashedLine2Y = hasAddons ? 540 : 480;
    const barcodeY = hasAddons ? 580 : 520;
    const footerY1 = hasAddons ? 775 : 715;
    const footerY2 = hasAddons ? 795 : 735;

    const svgContent = `<svg width="450" height="${height}" viewBox="0 0 450 ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    .font-title { font-family: 'Outfit', -apple-system, sans-serif; }
    .font-body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
    .font-mono { font-family: 'Courier New', Courier, monospace; }
  </style>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="450" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#181822"/>
      <stop offset="1" stop-color="#0d0d12"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="450" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f2a900" stop-opacity="0.08"/>
      <stop offset="0.5" stop-color="#f2a900" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#f2a900" stop-opacity="0.08"/>
    </linearGradient>
  </defs>
  
  <!-- Ticket Card Background -->
  <rect width="450" height="${height}" rx="16" fill="url(#bg)" stroke="#f2a900" stroke-width="1.5"/>
  
  <!-- Glow Overlay -->
  <rect x="10" y="10" width="430" height="${height - 20}" rx="12" fill="url(#glow)"/>
  
  <!-- Ticket Cutouts -->
  <circle cx="0" cy="${dashedLine2Y}" r="12" fill="#0a0a0c" stroke="#f2a900" stroke-width="1.5" />
  <circle cx="450" cy="${dashedLine2Y}" r="12" fill="#0a0a0c" stroke="#f2a900" stroke-width="1.5" />
  <!-- Overlays to cover the outer stroke of notch -->
  <path d="M -12 ${dashedLine2Y - 12} L 0 ${dashedLine2Y - 12} L 0 ${dashedLine2Y + 12} L -12 ${dashedLine2Y + 12} Z" fill="#0a0a0c" />
  <path d="M 450 ${dashedLine2Y - 12} L 462 ${dashedLine2Y - 12} L 462 ${dashedLine2Y + 12} L 450 ${dashedLine2Y + 12} Z" fill="#0a0a0c" />

  <!-- Logo and Header -->
  <text x="225" y="60" class="font-title" font-size="28" font-weight="800" fill="#f2a900" text-anchor="middle">BEE VIBE</text>
  <text x="225" y="85" class="font-body" font-size="11" font-weight="600" fill="#626272" letter-spacing="3" text-anchor="middle">MINI PRIVATE THEATER TICKET</text>
  
  <!-- Dashed Line 1 -->
  <line x1="25" y1="110" x2="425" y2="110" stroke="#f2a900" stroke-dasharray="6 4" stroke-width="1" stroke-opacity="0.3"/>
  
  <!-- Details -->
  <!-- Booking ID -->
  <text x="40" y="150" class="font-body" font-size="11" fill="#a0a0b0">TICKET ID</text>
  <text x="40" y="175" class="font-body" font-size="15" font-weight="700" fill="#ffffff">${id}</text>
  
  <!-- Status -->
  <text x="410" y="150" class="font-body" font-size="11" fill="#a0a0b0" text-anchor="end">STATUS</text>
  <text x="410" y="175" class="font-body" font-size="15" font-weight="700" fill="#10b981" text-anchor="end">${status}</text>
  
  <!-- Guest Name -->
  <text x="40" y="220" class="font-body" font-size="11" fill="#a0a0b0">GUEST NAME</text>
  <text x="40" y="245" class="font-body" font-size="15" font-weight="700" fill="#ffffff">${name}</text>
  
  <!-- Number of Guests -->
  <text x="410" y="220" class="font-body" font-size="11" fill="#a0a0b0" text-anchor="end">GUESTS</text>
  <text x="410" y="245" class="font-body" font-size="15" font-weight="700" fill="#ffffff" text-anchor="end">${guests} People</text>
  
  <!-- Date -->
  <text x="40" y="290" class="font-body" font-size="11" fill="#a0a0b0">DATE</text>
  <text x="40" y="315" class="font-body" font-size="15" font-weight="700" fill="#ffffff">${date}</text>
  
  <!-- Show Time -->
  <text x="410" y="290" class="font-body" font-size="11" fill="#a0a0b0" text-anchor="end">SHOW TIME</text>
  <text x="410" y="315" class="font-body" font-size="15" font-weight="700" fill="#ffffff" text-anchor="end">${slot}</text>
  
  <!-- Theme Package -->
  <text x="40" y="360" class="font-body" font-size="11" fill="#a0a0b0">THEME PACKAGE</text>
  <text x="40" y="385" class="font-body" font-size="15" font-weight="700" fill="#ffffff">${pkg}</text>
  
  <!-- Total Price -->
  <text x="410" y="360" class="font-body" font-size="11" fill="#a0a0b0" text-anchor="end">TOTAL PRICE</text>
  <text x="410" y="385" class="font-title" font-size="18" font-weight="800" fill="#f2a900" text-anchor="end">₹${price}</text>
  
  <!-- Add-ons (conditional rendering) -->
  ${hasAddons ? `
  <text x="40" y="440" class="font-body" font-size="11" fill="#a0a0b0">ADD-ONS</text>
  <text x="40" y="465" class="font-body" font-size="12" fill="#d0d0e0">${addons}</text>
  ` : ''}
  
  <!-- Dashed Line 2 -->
  <line x1="25" y1="${dashedLine2Y}" x2="425" y2="${dashedLine2Y}" stroke="#f2a900" stroke-dasharray="6 4" stroke-width="1" stroke-opacity="0.3"/>
  
  <!-- QR Code Area -->
  <rect x="150" y="${barcodeY}" width="150" height="150" rx="8" fill="#ffffff" stroke="#f2a900" stroke-width="1.5"/>
  <image href="https://api.qrserver.com/v1/create-qr-code/?size=130x130&amp;data=${id}" x="160" y="${barcodeY + 10}" width="130" height="130" />
  
  <text x="225" y="${barcodeY + 180}" class="font-mono" font-size="13" font-weight="700" fill="#f2a900" letter-spacing="3" text-anchor="middle">${id}</text>
  
  <!-- Footer Note -->
  <text x="225" y="${footerY1}" class="font-body" font-size="11" fill="#626272" text-anchor="middle">Thank you for choosing Bee Vibe!</text>
  <text x="225" y="${footerY2}" class="font-body" font-size="10" fill="#525262" text-anchor="middle">Present this digital ticket at the counter upon arrival.</text>
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bee-vibe-ticket-${confirmedBooking.id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!confirmedBooking) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print your receipt.');
      return;
    }

    const id = confirmedBooking.id;
    const name = confirmedBooking.customerName;
    const date = confirmedBooking.date;
    const slot = confirmedBooking.timeSlot;
    const pkg = confirmedBooking.packageName;
    const status = confirmedBooking.status.toUpperCase();
    const addons = confirmedBooking.addOns.join(', ');
    const guests = confirmedBooking.guestCount;
    const price = confirmedBooking.totalPrice;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bee Vibe Ticket - ${id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
            
            :root {
              --accent: #f2a900;
              --bg-primary: #0a0a0c;
              --bg-card: #121217;
              --text-primary: #ffffff;
              --text-secondary: #a0a0b0;
              --text-muted: #626272;
            }

            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              background-color: var(--bg-primary);
              color: var(--text-primary);
              font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }

            .ticket-card {
              background: linear-gradient(135deg, #181822 0%, #0d0d12 100%);
              border: 1px solid rgba(242, 169, 0, 0.4);
              border-radius: 16px;
              box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(242,169,0,0.15);
              width: 100%;
              max-width: 460px;
              padding: 32px;
              position: relative;
              overflow: hidden;
            }

            /* Ticket cutouts on sides */
            .ticket-card::before, .ticket-card::after {
              content: '';
              position: absolute;
              bottom: 180px;
              width: 24px;
              height: 24px;
              background-color: var(--bg-primary);
              border-radius: 50%;
              border: 1px solid rgba(242, 169, 0, 0.4);
              z-index: 5;
            }

            .ticket-card::before { left: -12px; }
            .ticket-card::after { right: -12px; }

            .header {
              text-align: center;
              border-bottom: 1px dashed rgba(242, 169, 0, 0.3);
              padding-bottom: 24px;
              margin-bottom: 24px;
            }

            .brand {
              font-family: 'Outfit', sans-serif;
              color: var(--accent);
              font-size: 2.2rem;
              font-weight: 800;
              letter-spacing: 1px;
            }

            .subtitle {
              font-size: 0.75rem;
              color: var(--text-muted);
              text-transform: uppercase;
              letter-spacing: 3px;
              margin-top: 4px;
            }

            .row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }

            .col {
              display: flex;
              flex-direction: column;
              flex: 1;
            }

            .col.right {
              text-align: right;
              align-items: flex-end;
            }

            .label {
              font-size: 0.75rem;
              color: var(--text-secondary);
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 4px;
            }

            .val {
              font-weight: 700;
              font-size: 1.05rem;
            }

            .val-accent {
              color: var(--accent);
            }

            .val-success {
              color: #10b981;
            }

            .addons-box {
              border-top: 1px solid rgba(255,255,255,0.05);
              padding-top: 16px;
              margin-bottom: 20px;
            }

            .divider {
              border-top: 1px dashed rgba(242, 169, 0, 0.3);
              margin-top: 8px;
              margin-bottom: 24px;
            }

            .qr-box {
              background: #ffffff;
              padding: 16px;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-top: 12px;
              border: 1.5px solid rgba(242, 169, 0, 0.4);
            }

            .qr-text {
              color: #000000;
              font-family: 'Courier New', Courier, monospace;
              font-size: 0.85rem;
              margin-top: 8px;
              font-weight: bold;
              letter-spacing: 3px;
            }

            .footer-note {
              text-align: center;
              font-size: 0.8rem;
              color: var(--text-muted);
              margin-top: 24px;
              line-height: 1.5;
            }

            @media print {
              body {
                background-color: #ffffff;
                color: #000000;
                padding: 0;
              }
              .ticket-card {
                border: 1px solid #000000;
                background: #ffffff;
                color: #000000;
                box-shadow: none;
                max-width: 100%;
                margin: 0 auto;
              }
              .ticket-card::before, .ticket-card::after {
                display: none;
              }
              .brand {
                color: #000000;
              }
              .val-accent {
                color: #000000;
              }
              .val-success {
                color: #000000;
              }
              .label {
                color: #555555;
              }
              .footer-note {
                color: #555555;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket-card">
            <div class="header">
              <h1 class="brand">Bee Vibe</h1>
              <p class="subtitle">Mini Private Theater Ticket</p>
            </div>
            
            <div class="row">
              <div class="col">
                <span class="label">Ticket ID</span>
                <span class="val">${id}</span>
              </div>
              <div class="col right">
                <span class="label">Status</span>
                <span class="val val-success">${status}</span>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <span class="label">Guest Name</span>
                <span class="val">${name}</span>
              </div>
              <div class="col right">
                <span class="label">Guests</span>
                <span class="val">${guests} People</span>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <span class="label">Date</span>
                <span class="val">${date}</span>
              </div>
              <div class="col right">
                <span class="label">Show Time</span>
                <span class="val">${slot}</span>
              </div>
            </div>
            
            <div class="row">
              <div class="col">
                <span class="label">Theme Package</span>
                <span class="val">${pkg}</span>
              </div>
              <div class="col right">
                <span class="label">Total Price</span>
                <span class="val val-accent">₹${price}</span>
              </div>
            </div>

            ${confirmedBooking.addOns.length > 0 ? `
            <div class="addons-box">
              <span class="label">Add-ons</span>
              <div class="val" style="font-size: 0.9rem; color: var(--text-secondary); font-weight: normal; margin-top: 4px;">
                ${addons}
              </div>
            </div>
            ` : ''}

            <div class="divider"></div>

            <div class="qr-box">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${id}" alt="QR Code" width="130" height="130" />
              <div class="qr-text">${id}</div>
            </div>

            <div class="footer-note">
              Thank you for choosing Bee Vibe!<br>
              Please present this ticket at the counter upon arrival.
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={styles.portalContainer}>
      {isPaying && (
        <div className={styles.paymentOverlay}>
          <div className={styles.paymentModal}>
            <div className={styles.paymentHeader}>
              <span className={styles.lockIcon}>🔒</span> Secure checkout
            </div>
            
            <div className={styles.paymentContent}>
              {paymentStep === 0 && (
                <>
                  <div className={styles.paymentSpinner} />
                  <h3 className={styles.paymentStatus}>Connecting securely...</h3>
                  <p className={styles.paymentDetail}>Establishing connection with payment processor.</p>
                </>
              )}
              {paymentStep === 1 && (
                <>
                  <div className={styles.paymentSpinner} />
                  <h3 className={styles.paymentStatus}>Authorizing Transaction...</h3>
                  <p className={styles.paymentDetail}>Verifying credentials and card limits for ₹{calculateTotal()}.</p>
                </>
              )}
              {paymentStep === 2 && (
                <>
                  <div className={styles.paymentSpinner} style={{ borderColor: 'var(--accent) transparent' }} />
                  <h3 className={styles.paymentStatus}>Finalizing Booking...</h3>
                  <p className={styles.paymentDetail}>Saving reservation slot and sending booking details to database.</p>
                </>
              )}
              {paymentStep === 3 && (
                <>
                  <div className={styles.paymentCheck}>✓</div>
                  <h3 className={styles.paymentStatus} style={{ color: '#10b981' }}>Payment Successful!</h3>
                  <p className={styles.paymentDetail}>Thank you! Generating your digital entrance ticket now...</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar for customer login and history */}
      <div className={styles.portalHeaderBar}>
        <div className={styles.portalBrand}>
          🐝 Bee Vibe Portal
        </div>
        
        <div className={styles.portalNav}>
          <button
            type="button"
            className={`${styles.portalNavBtn} ${currentView === 'book' ? styles.portalNavBtnActive : ''}`}
            onClick={() => setCurrentView('book')}
          >
            🗓️ Book a Slot
          </button>
          <button
            type="button"
            className={`${styles.portalNavBtn} ${currentView === 'orders' ? styles.portalNavBtnActive : ''}`}
            onClick={() => {
              if (!isCustomerLoggedIn) {
                setShowLoginModal(true);
              } else {
                setCurrentView('orders');
                fetchCustomerBookings(customerPhone);
              }
            }}
          >
            🎟️ My Bookings
          </button>
        </div>

        <div className={styles.portalUserSection}>
          {isCustomerLoggedIn ? (
            <>
              <span>📱 {customerPhone}</span>
              <button onClick={handleCustomerLogout} className={styles.logoutBtn}>
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setShowLoginModal(true);
                setLoginError('');
              }}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.85rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Login Modal Overlay */}
      {showLoginModal && (
        <div className={styles.paymentOverlay} style={{ zIndex: 1000 }}>
          <div className={styles.loginCard}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-12px', marginRight: '-12px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowLoginModal(false);
                  setOtpSent(false);
                  setLoginPhone('');
                  setOtpCode('');
                  setLoginError('');
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <span className={styles.loginLogo}>🔑</span>
            <h3 className={styles.loginTitle}>Customer Login</h3>
            <p className={styles.loginDesc}>
              {!otpSent
                ? 'Enter your phone number to receive a verification OTP code and access your orders.'
                : 'Enter the 6-digit OTP code sent to your phone number.'}
            </p>

            {otpSent && (
              <div className={styles.mockHelpAlert} style={{ background: 'rgba(16, 185, 129, 0.08)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' }}>
                (OTP sent successfully.)
              </div>
            )}

            <form onSubmit={!otpSent ? handleSendOTP : handleVerifyOTP}>
              {!otpSent ? (
                <>
                  <div className={styles.phoneInputContainer}>
                    <select
                      className={styles.countryCodeSelect}
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={loginLoading}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+65">🇸🇬 +65</option>
                      <option value="+61">🇦🇺 +61</option>
                    </select>
                    <input
                      type="tel"
                      placeholder="Enter Phone (Ex: 8123501013)"
                      className={styles.loginPhoneInput}
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      disabled={loginLoading}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.loginSubmitBtn} disabled={loginLoading}>
                    {loginLoading ? 'Sending OTP...' : 'Send OTP Code'}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="•••••"
                    className={styles.loginInput}
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    disabled={loginLoading}
                    required
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                      }}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '10px' }}
                      disabled={loginLoading}
                    >
                      Change Phone
                    </button>
                    <button type="submit" className={styles.loginSubmitBtn} style={{ flex: 2 }} disabled={loginLoading}>
                      {loginLoading ? 'Verifying...' : 'Verify & Login'}
                    </button>
                  </div>
                </>
              )}
            </form>

            {loginError && <div className={styles.loginError} style={{ marginTop: '16px' }}>{loginError}</div>}
          </div>
        </div>
      )}

      {/* Modal to view a past ticket */}
      {selectedTicketToView && (
        <div className={styles.paymentOverlay} style={{ zIndex: 2000 }}>
          <div style={{ background: '#0a0a0c', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-title)' }}>View Digital Ticket</h3>
              <button
                type="button"
                onClick={() => setSelectedTicketToView(null)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Ticket Card Component */}
            <div className={styles.ticket} style={{ width: '100%' }}>
              <div className={styles.ticketHeader}>
                <div className={styles.ticketBrand}>Bee Vibe</div>
                <div className={styles.ticketSub}>Mini Private Theater Ticket</div>
              </div>
              <div className={styles.ticketBody}>
                <div className={styles.ticketRow}>
                  <div>
                    <span className={styles.ticketLabel}>TICKET ID</span>
                    <div className={styles.ticketVal}>{selectedTicketToView.id}</div>
                  </div>
                  <div>
                    <span className={styles.ticketLabel}>STATUS</span>
                    <div className={`${styles.ticketVal} ${styles.ticketValAccent}`} style={{ textTransform: 'uppercase' }}>
                      {selectedTicketToView.status}
                    </div>
                  </div>
                </div>

                <div className={styles.ticketRow}>
                  <div>
                    <span className={styles.ticketLabel}>GUEST NAME</span>
                    <div className={styles.ticketVal} style={{ textAlign: 'left' }}>{selectedTicketToView.customerName}</div>
                  </div>
                  <div>
                    <span className={styles.ticketLabel}>GUESTS</span>
                    <div className={styles.ticketVal}>{selectedTicketToView.guestCount} People</div>
                  </div>
                </div>

                <div className={styles.ticketRow}>
                  <div>
                    <span className={styles.ticketLabel}>DATE</span>
                    <div className={styles.ticketVal} style={{ textAlign: 'left' }}>{selectedTicketToView.date}</div>
                  </div>
                  <div>
                    <span className={styles.ticketLabel}>SHOW TIME</span>
                    <div className={styles.ticketVal}>{selectedTicketToView.timeSlot}</div>
                  </div>
                </div>

                <div className={styles.ticketRow}>
                  <div>
                    <span className={styles.ticketLabel}>THEME PACKAGE</span>
                    <div className={styles.ticketVal} style={{ textAlign: 'left' }}>{selectedTicketToView.packageName}</div>
                  </div>
                  <div>
                    <span className={styles.ticketLabel}>TOTAL PRICE</span>
                    <div className={styles.ticketVal} style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                      ₹{selectedTicketToView.totalPrice}
                    </div>
                  </div>
                </div>

                {selectedTicketToView.addOns.length > 0 && (
                  <div>
                    <span className={styles.ticketLabel}>ADD-ONS</span>
                    <div className={styles.ticketVal} style={{ fontSize: '0.8rem', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      {selectedTicketToView.addOns.join(', ')}
                    </div>
                  </div>
                )}

                <div className={styles.ticketQrCode}>
                  <div className={styles.qrCodeWrapper}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${selectedTicketToView.id}`}
                      alt="Booking QR Code"
                      width={140}
                      height={140}
                      className={styles.qrImage}
                    />
                  </div>
                  <div className={styles.qrText}>Scan at reception for check-in</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', width: '100%' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => {
                  const escapeXml = (str: string) => {
                    if (!str) return '';
                    return str.replace(/[<>&'"]/g, (c) => {
                      switch (c) {
                        case '<': return '&lt;';
                        case '>': return '&gt;';
                        case '&': return '&amp;';
                        case '\'': return '&apos;';
                        case '"': return '&quot;';
                        default: return c;
                      }
                    });
                  };

                  const id = escapeXml(selectedTicketToView.id);
                  const name = escapeXml(selectedTicketToView.customerName);
                  const date = escapeXml(selectedTicketToView.date);
                  const slot = escapeXml(selectedTicketToView.timeSlot);
                  const pkg = escapeXml(selectedTicketToView.packageName);
                  const status = escapeXml(selectedTicketToView.status.toUpperCase());
                  const addons = selectedTicketToView.addOns.map(escapeXml).join(', ');
                  const guests = selectedTicketToView.guestCount;
                  const price = selectedTicketToView.totalPrice;

                  const hasAddons = selectedTicketToView.addOns.length > 0;
                  const height = hasAddons ? 850 : 790;
                  const dashedLine2Y = hasAddons ? 540 : 480;
                  const barcodeY = hasAddons ? 580 : 520;
                  const footerY1 = hasAddons ? 775 : 715;
                  const footerY2 = hasAddons ? 795 : 735;

                  const svgContent = `<svg width="450" height="${height}" viewBox="0 0 450 ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <style>
                      .font-title { font-family: 'Outfit', -apple-system, sans-serif; }
                      .font-body { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; }
                      .font-mono { font-family: 'Courier New', Courier, monospace; }
                    </style>
                    <defs>
                      <linearGradient id="bg" x1="0" y1="0" x2="450" y2="${height}" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#181822"/>
                        <stop offset="1" stop-color="#0d0d12"/>
                      </linearGradient>
                      <linearGradient id="glow" x1="0" y1="0" x2="450" y2="0" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#f2a900" stop-opacity="0.08"/>
                        <stop offset="0.5" stop-color="#f2a900" stop-opacity="0.18"/>
                        <stop offset="1" stop-color="#f2a900" stop-opacity="0.08"/>
                      </linearGradient>
                    </defs>
                    <rect width="450" height="${height}" rx="16" fill="url(#bg)" stroke="#f2a900" stroke-width="1.5"/>
                    <rect x="10" y="10" width="430" height="${height - 20}" rx="12" fill="url(#glow)"/>
                    <circle cx="0" cy="${dashedLine2Y}" r="12" fill="#0a0a0c" stroke="#f2a900" stroke-width="1.5" />
                    <circle cx="450" cy="${dashedLine2Y}" r="12" fill="#0a0a0c" stroke="#f2a900" stroke-width="1.5" />
                    <path d="M -12 ${dashedLine2Y - 12} L 0 ${dashedLine2Y - 12} L 0 ${dashedLine2Y + 12} L -12 ${dashedLine2Y + 12} Z" fill="#0a0a0c" />
                    <path d="M 450 ${dashedLine2Y - 12} L 462 ${dashedLine2Y - 12} L 462 ${dashedLine2Y + 12} L 450 ${dashedLine2Y + 12} Z" fill="#0a0a0c" />
                    <text x="225" y="60" class="font-title" font-size="28" font-weight="800" fill="#f2a900" text-anchor="middle">BEE VIBE</text>
                    <text x="225" y="85" class="font-body" font-size="11" font-weight="600" fill="#626272" letter-spacing="3" text-anchor="middle">MINI PRIVATE THEATER TICKET</text>
                    <line x1="25" y1="110" x2="425" y2="110" stroke="#f2a900" stroke-dasharray="6 4" stroke-width="1" stroke-opacity="0.3"/>
                    <text x="40" y="150" class="font-body" font-size="11" fill="#a0a0b0">TICKET ID</text>
                    <text x="40" y="175" class="font-body" font-size="15" font-weight="700" fill="#ffffff">${id}</text>
                    <text x="410" y="150" class="font-body" font-size="11" fill="#a0a0b0" text-anchor="end">STATUS</text>
                    <text x="410" y="175" class="font-body" font-size="15" font-weight="700" fill="#10b981" text-anchor="end">${status}</text>
                    <text x="40" y="220" class="font-body" font-size="11" fill="#a0a0b0">GUEST NAME</text>
                    <text x="40" y="245" class="font-body" font-size="15" font-weight="700" fill="#ffffff">${name}</text>
                    <text x="410" y="220" class="font-body" font-size="11" fill="#a0a0b0" text-anchor="end">GUESTS</text>
                    <text x="410" y="245" class="font-body" font-size="15" font-weight="700" fill="#ffffff" text-anchor="end">${guests} People</text>
                    <text x="40" y="290" class="font-body" font-size="11" fill="#a0a0b0">DATE</text>
                    <text x="40" y="315" class="font-body" font-size="15" font-weight="700" fill="#ffffff">${date}</text>
                    <text x="410" y="290" class="font-body" font-size="11" fill="#a0a0b0" text-anchor="end">SHOW TIME</text>
                    <text x="410" y="315" class="font-body" font-size="15" font-weight="700" fill="#ffffff" text-anchor="end">${slot}</text>
                    <text x="40" y="360" class="font-body" font-size="11" fill="#a0a0b0">THEME PACKAGE</text>
                    <text x="40" y="385" class="font-body" font-size="15" font-weight="700" fill="#ffffff">${pkg}</text>
                    <text x="410" y="360" class="font-body" font-size="11" fill="#a0a0b0" text-anchor="end">TOTAL PRICE</text>
                    <text x="410" y="385" class="font-title" font-size="18" font-weight="800" fill="#f2a900" text-anchor="end">₹${price}</text>
                    ${hasAddons ? `
                    <text x="40" y="440" class="font-body" font-size="11" fill="#a0a0b0">ADD-ONS</text>
                    <text x="40" y="465" class="font-body" font-size="12" fill="#d0d0e0">${addons}</text>
                    ` : ''}
                    <line x1="25" y1="${dashedLine2Y}" x2="425" y2="${dashedLine2Y}" stroke="#f2a900" stroke-dasharray="6 4" stroke-width="1" stroke-opacity="0.3"/>
                    <rect x="150" y="${barcodeY}" width="150" height="150" rx="8" fill="#ffffff" stroke="#f2a900" stroke-width="1.5"/>
                    <image href="https://api.qrserver.com/v1/create-qr-code/?size=130x130&amp;data=${id}" x="160" y="${barcodeY + 10}" width="130" height="130" />
                    <text x="225" y="${barcodeY + 180}" class="font-mono" font-size="13" font-weight="700" fill="#f2a900" letter-spacing="3" text-anchor="middle">${id}</text>
                    <text x="225" y="${footerY1}" class="font-body" font-size="11" fill="#626272" text-anchor="middle">Thank you for choosing Bee Vibe!</text>
                    <text x="225" y="${footerY2}" class="font-body" font-size="10" fill="#525262" text-anchor="middle">Present this digital ticket at the counter upon arrival.</text>
                  </svg>`;

                  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `bee-vibe-ticket-${selectedTicketToView.id}.svg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
              >
                Download SVG
              </button>
              <button
                className="btn btn-secondary"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) {
                    alert('Please allow popups to print.');
                    return;
                  }
                  
                  const id = selectedTicketToView.id;
                  const name = selectedTicketToView.customerName;
                  const date = selectedTicketToView.date;
                  const slot = selectedTicketToView.timeSlot;
                  const pkg = selectedTicketToView.packageName;
                  const status = selectedTicketToView.status.toUpperCase();
                  const addons = selectedTicketToView.addOns.join(', ');
                  const guests = selectedTicketToView.guestCount;
                  const price = selectedTicketToView.totalPrice;

                  printWindow.document.write(`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <title>Bee Vibe Ticket - ${id}</title>
                        <style>
                          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
                          :root {
                            --accent: #f2a900;
                            --bg-primary: #0a0a0c;
                            --text-primary: #ffffff;
                            --text-secondary: #a0a0b0;
                            --text-muted: #626272;
                          }
                          * { box-sizing: border-box; margin: 0; padding: 0; }
                          body {
                            background-color: var(--bg-primary);
                            color: var(--text-primary);
                            font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            padding: 20px;
                          }
                          .ticket-card {
                            background: linear-gradient(135deg, #181822 0%, #0d0d12 100%);
                            border: 1px solid rgba(242, 169, 0, 0.4);
                            border-radius: 16px;
                            width: 100%;
                            max-width: 460px;
                            padding: 32px;
                            position: relative;
                          }
                          .ticket-card::before, .ticket-card::after {
                            content: '';
                            position: absolute;
                            bottom: 180px;
                            width: 24px;
                            height: 24px;
                            background-color: var(--bg-primary);
                            border-radius: 50%;
                            border: 1px solid rgba(242, 169, 0, 0.4);
                          }
                          .ticket-card::before { left: -12px; }
                          .ticket-card::after { right: -12px; }
                          .header { text-align: center; border-bottom: 1px dashed rgba(242, 169, 0, 0.3); padding-bottom: 24px; margin-bottom: 24px; }
                          .brand { font-family: 'Outfit', sans-serif; color: var(--accent); font-size: 2.2rem; font-weight: 800; }
                          .subtitle { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 3px; }
                          .row { display: flex; justify-content: space-between; margin-bottom: 20px; }
                          .col { display: flex; flex-direction: column; flex: 1; }
                          .col.right { text-align: right; align-items: flex-end; }
                          .label { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 4px; }
                          .val { font-weight: 700; font-size: 1.05rem; }
                          .val-accent { color: var(--accent); }
                          .val-success { color: #10b981; }
                          .divider { border-top: 1px dashed rgba(242, 169, 0, 0.3); margin-top: 8px; margin-bottom: 24px; }
                          .qr-box { display: flex; flex-direction: column; align-items: center; background: #ffffff; padding: 16px; border-radius: 8px; }
                          .qr-text { color: #000000; font-family: monospace; font-size: 0.85rem; margin-top: 8px; font-weight: bold; letter-spacing: 3px; }
                          .footer-note { text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 24px; }
                        </style>
                      </head>
                      <body>
                        <div class="ticket-card">
                          <div class="header">
                            <h1 class="brand">Bee Vibe</h1>
                            <p class="subtitle">Mini Private Theater Ticket</p>
                          </div>
                          <div class="row">
                            <div class="col">
                              <span class="label">Ticket ID</span>
                              <span class="val">${id}</span>
                            </div>
                            <div class="col right">
                              <span class="label">Status</span>
                              <span class="val val-success">${status}</span>
                            </div>
                          </div>
                          <div class="row">
                            <div class="col">
                              <span class="label">Guest Name</span>
                              <span class="val">${name}</span>
                            </div>
                            <div class="col right">
                              <span class="label">Guests</span>
                              <span class="val">${guests} People</span>
                            </div>
                          </div>
                          <div class="row">
                            <div class="col">
                              <span class="label">Date</span>
                              <span class="val">${date}</span>
                            </div>
                            <div class="col right">
                              <span class="label">Show Time</span>
                              <span class="val">${slot}</span>
                            </div>
                          </div>
                          <div class="row">
                            <div class="col">
                              <span class="label">Theme Package</span>
                              <span class="val">${pkg}</span>
                            </div>
                            <div class="col right">
                              <span class="label">Total Price</span>
                              <span class="val val-accent">₹${price}</span>
                            </div>
                          </div>
                          <div class="divider"></div>
                          <div class="qr-box">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${id}" alt="QR Code" width="130" height="130" />
                            <div class="qr-text">${id}</div>
                          </div>
                          <div class="footer-note">
                            Thank you for choosing Bee Vibe!<br>
                            Please present this ticket at the counter upon arrival.
                          </div>
                        </div>
                        <script>
                          window.onload = function() {
                            window.print();
                            setTimeout(function() { window.close(); }, 500);
                          };
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}
              >
                Print PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {currentView === 'book' ? (
        <>
          {step < 5 && (
            <div className={styles.wizardHeader}>
              <div className={`${styles.stepIndicator} ${step === 1 ? styles.stepActive : styles.stepCompleted}`}>
                1. Date & Slot {step > 1 && '✓'}
              </div>
              <div className={`${styles.stepIndicator} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepCompleted : ''}`}>
                2. Package {step > 2 && '✓'}
              </div>
              <div className={`${styles.stepIndicator} ${step === 3 ? styles.stepActive : step > 3 ? styles.stepCompleted : ''}`}>
                3. Add-ons {step > 3 && '✓'}
              </div>
              <div className={`${styles.stepIndicator} ${step === 4 ? styles.stepActive : ''}`}>
                4. Personal Info
              </div>
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* STEP 1: Date & Time Slot selection */}
          {step === 1 && (
            <div className={styles.stepContainer}>
              <div className={styles.dateSection}>
                <label className={styles.dateInputLabel} htmlFor="booking-date">Choose Celebration Date</label>
                <input
                  type="date"
                  id="booking-date"
                  className={styles.datePicker}
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className={styles.bookingModeTabs}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${bookingMode === 'predefined' ? styles.tabBtnActive : ''}`}
                  onClick={() => {
                    setBookingMode('predefined');
                    setSelectedSlot(null);
                  }}
                >
                  Standard Slots
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${bookingMode === 'custom' ? styles.tabBtnActive : ''}`}
                  onClick={() => {
                    setBookingMode('custom');
                    setSelectedSlot(null);
                  }}
                >
                  Custom Time Slot
                </button>
              </div>

              {bookingMode === 'predefined' ? (
                <>
                  <h3 style={{ margin: '16px 0 8px 0', fontFamily: 'var(--font-title)' }}>Available Time Slots</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    All 2-hour private slots priced at ₹999.
                  </p>

                  {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                      <div className={styles.loadingSpinner} />
                    </div>
                  ) : (
                    <div className={styles.slotsGrid}>
                      {slots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`${styles.slotCard} ${slot.isBooked ? styles.slotBooked : ''} ${
                            selectedSlot?.id === slot.id ? styles.slotSelected : ''
                          }`}
                          onClick={() => !slot.isBooked && setSelectedSlot(slot)}
                        >
                          <div className={styles.slotLabel}>{slot.label}</div>
                          <div className={styles.slotTime}>{slot.time}</div>
                          <div className={styles.slotPrice}>
                            {slot.isBooked ? 'Unavailable' : `₹${slot.basePrice}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <h3 style={{ margin: '16px 0 8px 0', fontFamily: 'var(--font-title)' }}>Customize Your Show Time</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Book any custom duration. Pricing is ₹999 for every 2 hours (calculated pro-rata).
                  </p>

                  <div className={styles.customSlotContainer}>
                    <div className={styles.customSlotRow}>
                      <div className={styles.customSlotField}>
                        <label className={styles.customSlotLabel} htmlFor="custom-start">Start Time</label>
                        <input
                          type="time"
                          id="custom-start"
                          className={styles.timeInput}
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                        />
                      </div>
                      <div className={styles.customSlotField}>
                        <label className={styles.customSlotLabel} htmlFor="custom-end">End Time</label>
                        <input
                          type="time"
                          id="custom-end"
                          className={styles.timeInput}
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                        />
                      </div>
                    </div>

                    {customSlotError ? (
                      <div className={styles.slotErrorMsg}>{customSlotError}</div>
                    ) : selectedSlot ? (
                      <div className={styles.customSlotPriceBox}>
                        <div className={styles.priceLabel}>
                          Selected Range: <strong style={{ color: '#ffffff' }}>{selectedSlot.time}</strong>
                        </div>
                        <div className={styles.priceVal}>
                          ₹{selectedSlot.basePrice}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Choose Celebration Theme / Package */}
          {step === 2 && (
            <div className={styles.stepContainer}>
              <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-title)' }}>Select Your Celebration Vibe</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Pick a custom setup tailored for your special occasion.
              </p>

              <div className={styles.packagesGrid}>
                {PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`${styles.packageCard} ${selectedPackage.id === pkg.id ? styles.packageSelected : ''}`}
                    onClick={() => setSelectedPackage(pkg)}
                  >
                    <h4 className={styles.packageName}>{pkg.name}</h4>
                    <div className={styles.packagePrice}>
                      {pkg.price === 0 ? 'Included' : `+₹${pkg.price}`}
                    </div>
                    <ul className={styles.packageDetails}>
                      {pkg.details.map((detail, idx) => (
                        <li key={idx}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Select Optional Add-ons */}
          {step === 3 && (
            <div className={styles.stepContainer}>
              <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-title)' }}>Enhance the Experience (Optional)</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Choose add-on options to customize your celebration.
              </p>

              <div className={styles.addonsGrid}>
                {ADDONS.map((addon) => {
                  const isSelected = selectedAddons.includes(addon.id);
                  return (
                    <div
                      key={addon.id}
                      className={`${styles.addonCard} ${isSelected ? styles.addonSelected : ''}`}
                      onClick={() => handleAddonToggle(addon.id)}
                    >
                      <div className={styles.addonInfo}>
                        <span className={styles.addonName}>{addon.name}</span>
                        <span className={styles.addonPrice}>
                          {addon.price === 0 ? 'Included' : `+₹${addon.price}`}
                        </span>
                      </div>
                      <div className={styles.addonCheckbox}>
                        {isSelected && '✓'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Personal details & Checkout confirmation */}
          {step === 4 && (
            <div className={styles.stepContainer}>
              <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-title)' }}>Booking details & Customer Info</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Review your booking summary and enter your contact details.
              </p>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                <h4 style={{ fontFamily: 'var(--font-title)', color: 'var(--accent)', marginBottom: '12px' }}>Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px 16px', fontSize: '0.9rem' }}>
                  <div><strong>Date:</strong> {selectedDate}</div>
                  <div><strong>Time Slot:</strong> {selectedSlot?.time} ({selectedSlot?.label})</div>
                  <div><strong>Vibe Package:</strong> {selectedPackage.name}</div>
                  <div>
                    <strong>Add-ons selected:</strong>{' '}
                    {selectedAddons.length > 0
                      ? selectedAddons.map((id) => ADDONS.find((a) => a.id === id)?.name).join(', ')
                      : 'None'}
                  </div>
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px', fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 'bold' }}>
                    Total Cost: ₹{calculateTotal()}
                  </div>
                </div>
              </div>

              {!isCustomerLoggedIn ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', maxWidth: '420px', margin: '0 auto' }}>
                  <div className={styles.mockHelpAlert} style={{ background: 'rgba(242, 169, 0, 0.04)', borderColor: 'rgba(242, 169, 0, 0.2)', width: '100%' }}>
                    🔒 Verification Required
                  </div>
                  <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.4' }}>
                    Please verify your phone number to secure your booking slot and link it to your profile.
                  </p>
                  <button
                    type="button"
                    className={styles.loginSubmitBtn}
                    onClick={() => {
                      setShowLoginModal(true);
                      setLoginError('');
                    }}
                  >
                    Verify Phone via OTP
                  </button>
                </div>
              ) : (
                <div className={styles.bookingForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="customer-name">Full Name *</label>
                    <input
                      type="text"
                      id="customer-name"
                      name="name"
                      className={styles.formInput}
                      placeholder="Ex. Rahul Kumar"
                      value={customerDetails.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="customer-email">Email Address *</label>
                    <input
                      type="email"
                      id="customer-email"
                      name="email"
                      className={styles.formInput}
                      placeholder="Ex. rahul@gmail.com"
                      value={customerDetails.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="customer-phone">Phone Number (Verified ✓)</label>
                    <input
                      type="tel"
                      id="customer-phone"
                      name="phone"
                      className={styles.formInput}
                      value={customerPhone}
                      disabled
                      required
                      style={{ opacity: 0.7, borderColor: '#10b981', color: '#10b981', fontWeight: 'bold' }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel} htmlFor="customer-guestcount">Number of Guests * (Max 10)</label>
                    <input
                      type="number"
                      id="customer-guestcount"
                      name="guestCount"
                      className={styles.formInput}
                      min="1"
                      max="10"
                      value={customerDetails.guestCount === 0 ? '' : customerDetails.guestCount}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      required
                    />
                  </div>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.formLabel} htmlFor="customer-special">Special Requests or Instructions (Optional)</label>
                    <textarea
                      id="customer-special"
                      name="specialRequests"
                      className={styles.formTextarea}
                      placeholder="Let us know if you want custom decorations, specific movies, or food allergies..."
                      value={customerDetails.specialRequests}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Booking Confirmation (Ticket screen) */}
          {step === 5 && confirmedBooking && (
            <div style={{ textAlign: 'center' }}>
              <canvas id="confetti-canvas" className={styles.confettiCanvas} />
              
              <div style={{ color: '#10b981', fontSize: '2.5rem', marginBottom: '8px' }}>✓</div>
              <h2 style={{ fontFamily: 'var(--font-title)', marginBottom: '8px' }}>Booking Confirmed!</h2>
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '16px',
                margin: '0 auto 24px auto',
                maxWidth: '480px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <p style={{ color: '#10b981', fontWeight: '600', fontSize: '1rem', marginBottom: '6px' }}>
                  Your booking has been successfully confirmed!
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                  A confirmation message has been sent to your verified phone number.
                </p>
                <p style={{ color: '#ffffff', fontSize: '0.9rem', margin: '0' }}>
                  Your unique ticket code is: <strong style={{ color: 'var(--accent)', textShadow: 'var(--accent-glow)' }}>{confirmedBooking.id}</strong>
                </p>
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: 'rgba(242, 169, 0, 0.1)',
                  border: '1px dashed rgba(242, 169, 0, 0.4)',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  color: 'var(--accent)',
                  fontWeight: '600',
                  lineHeight: '1.4',
                  textAlign: 'center'
                }}>
                  👉 Please download the receipt below and show it at the reception of Bee Vibe upon arrival!
                </div>
              </div>

              <div className={styles.ticketWrapper}>
                <div className={styles.ticket}>
                  <div className={styles.ticketHeader}>
                    <div className={styles.ticketBrand}>Bee Vibe</div>
                    <div className={styles.ticketSub}>Mini Private Theater Ticket</div>
                  </div>
                  <div className={styles.ticketBody}>
                    <div className={styles.ticketRow}>
                      <div>
                        <span className={styles.ticketLabel}>TICKET ID</span>
                        <div className={styles.ticketVal}>{confirmedBooking.id}</div>
                      </div>
                      <div>
                        <span className={styles.ticketLabel}>STATUS</span>
                        <div className={`${styles.ticketVal} ${styles.ticketValAccent}`} style={{ textTransform: 'uppercase' }}>
                          {confirmedBooking.status}
                        </div>
                      </div>
                    </div>

                    <div className={styles.ticketRow}>
                      <div>
                        <span className={styles.ticketLabel}>GUEST NAME</span>
                        <div className={styles.ticketVal} style={{ textAlign: 'left' }}>{confirmedBooking.customerName}</div>
                      </div>
                      <div>
                        <span className={styles.ticketLabel}>GUESTS</span>
                        <div className={styles.ticketVal}>{confirmedBooking.guestCount} People</div>
                      </div>
                    </div>

                    <div className={styles.ticketRow}>
                      <div>
                        <span className={styles.ticketLabel}>DATE</span>
                        <div className={styles.ticketVal} style={{ textAlign: 'left' }}>{confirmedBooking.date}</div>
                      </div>
                      <div>
                        <span className={styles.ticketLabel}>SHOW TIME</span>
                        <div className={styles.ticketVal}>{confirmedBooking.timeSlot}</div>
                      </div>
                    </div>

                    <div className={styles.ticketRow}>
                      <div>
                        <span className={styles.ticketLabel}>THEME PACKAGE</span>
                        <div className={styles.ticketVal} style={{ textAlign: 'left' }}>{confirmedBooking.packageName}</div>
                      </div>
                      <div>
                        <span className={styles.ticketLabel}>TOTAL PRICE</span>
                        <div className={styles.ticketVal} style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                          ₹{confirmedBooking.totalPrice}
                        </div>
                      </div>
                    </div>

                    {confirmedBooking.addOns.length > 0 && (
                      <div>
                        <span className={styles.ticketLabel}>ADD-ONS</span>
                        <div className={styles.ticketVal} style={{ fontSize: '0.8rem', textAlign: 'left', color: 'var(--text-secondary)' }}>
                          {confirmedBooking.addOns.join(', ')}
                        </div>
                      </div>
                    )}

                    <div className={styles.ticketQrCode}>
                      <div className={styles.qrCodeWrapper}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${confirmedBooking.id}`}
                          alt="Booking QR Code"
                          width={140}
                          height={140}
                          className={styles.qrImage}
                        />
                      </div>
                      <div className={styles.qrText}>Scan at reception for check-in</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleDownloadSVG}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={18} />
                  Download Ticket (SVG)
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrint}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Printer size={18} />
                  Print / Save PDF
                </button>
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hi! Here is my booking ticket confirmation from Bee Vibe:\n\n🎟️ Ticket Code: ${confirmedBooking.id}\n📅 Date: ${confirmedBooking.date}\n⏰ Time Slot: ${confirmedBooking.timeSlot}\n💰 Total Price: ₹${confirmedBooking.totalPrice}\n\nShow this ticket code at the entrance for verification.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#25D366',
                    borderColor: '#25D366',
                    color: '#ffffff',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.965C16.588 1.977 14.13 1.952 12.01 1.952c-5.437 0-9.862 4.371-9.866 9.8.001 2.03.536 4.017 1.55 5.807l-.975 3.557 3.655-.956-.127-.008zm11.367-7.64c-.31-.155-1.838-.907-2.11-.998-.273-.092-.472-.137-.67.155-.198.29-.765.998-.937 1.19-.172.19-.343.21-.652.054-.31-.154-1.307-.48-2.49-1.53-.919-.82-1.539-1.83-1.72-2.138-.18-.309-.019-.476.136-.63.14-.14.31-.36.465-.54.156-.18.208-.31.31-.517.104-.21.053-.39-.026-.546-.078-.155-.67-1.61-.918-2.205-.24-.58-.487-.501-.67-.512-.17-.01-.365-.01-.56-.01-.194 0-.51.073-.777.363-.266.29-1.02 1.002-1.02 2.44 0 1.439 1.047 2.829 1.193 3.023.146.195 2.06 3.14 4.99 4.41.697.303 1.24.484 1.66.619.7.22 1.338.19 1.84.115.56-.08 1.838-.75 2.097-1.44.26-.69.26-1.28.18-1.4-.08-.12-.27-.2-.58-.355z"/>
                  </svg>
                  Share via WhatsApp
                </a>
              </div>

              <button
                className="btn btn-secondary"
                style={{ marginTop: '24px', opacity: 0.7, fontSize: '0.9rem', padding: '8px 16px' }}
                onClick={() => {
                  setStep(1);
                  setSelectedSlot(null);
                  setSelectedAddons([]);
                  setCustomerDetails({ name: '', email: '', phone: '', guestCount: 2, specialRequests: '' });
                  setConfirmedBooking(null);
                }}
              >
                Book Another Slot
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 5 && (
            <div className={styles.footerButtons}>
              <button
                className="btn btn-secondary"
                onClick={handlePrevStep}
                disabled={step === 1 || loading}
                style={{ opacity: step === 1 ? 0.3 : 1 }}
              >
                Back
              </button>

              {step < 4 ? (
                <button
                  className="btn btn-primary"
                  onClick={handleNextStep}
                  disabled={loading}
                >
                  Continue
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitBooking}
                  disabled={loading}
                  style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
                >
                  {loading ? (
                    <>
                      <div className={styles.loadingSpinner} style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                      Processing...
                    </>
                  ) : (
                    `Confirm & Reserve (₹${calculateTotal()})`
                  )}
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        /* My Bookings Orders View */
        <div className={styles.ordersHistoryContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontFamily: 'var(--font-title)' }}>My Reservation History</h2>
            <button
              onClick={() => fetchCustomerBookings(customerPhone)}
              className={styles.orderActionBtn}
              disabled={loadingOrders}
            >
              🔄 Refresh List
            </button>
          </div>

          {loadingOrders ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
              <div className={styles.loadingSpinner} />
            </div>
          ) : ordersError ? (
            <div className={styles.errorMessage} style={{ margin: '20px 0' }}>{ordersError}</div>
          ) : customerBookings.length === 0 ? (
            <div className={styles.noOrdersCard}>
              <h3>No bookings found</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You haven't made any theater room bookings with this verified phone number yet.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '20px' }}
                onClick={() => setCurrentView('book')}
              >
                Book a Slot Now
              </button>
            </div>
          ) : (
            <div className={styles.ordersGrid}>
              {customerBookings.map((b) => (
                <div key={b.id} className={styles.orderCard}>
                  <div className={styles.orderCardHeader}>
                    <div>
                      Ticket: <span className={styles.orderId}>{b.id}</span>
                    </div>
                    <span
                      className={`${styles.orderBadge} ${
                        b.status === 'confirmed'
                          ? styles.orderBadgeConfirmed
                          : b.status === 'cancelled'
                          ? styles.orderBadgeCancelled
                          : styles.orderBadgePending
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <div className={styles.orderCardBody}>
                    <div><strong>Date:</strong> {b.date}</div>
                    <div><strong>Time Slot:</strong> {b.timeSlot}</div>
                    <div><strong>Package:</strong> {b.packageName}</div>
                    <div><strong>Guests:</strong> {b.guestCount} People</div>
                    {b.addOns.length > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Add-ons:</strong> {b.addOns.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className={styles.orderCardFooter}>
                    <div className={styles.orderPrice}>Total Price: ₹{b.totalPrice}</div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setSelectedTicketToView(b)}
                        className={styles.orderActionBtn}
                      >
                        🎟️ View Ticket
                      </button>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hi! Here is my booking ticket confirmation from Bee Vibe:\n\n🎟️ Ticket Code: ${b.id}\n📅 Date: ${b.date}\n⏰ Time Slot: ${b.timeSlot}\n💰 Total Price: ₹${b.totalPrice}\n\nShow this ticket code at the entrance for verification.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.orderActionBtn}
                        style={{ color: '#25D366' }}
                      >
                        Share
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

}
