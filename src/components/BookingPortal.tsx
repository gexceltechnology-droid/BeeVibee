'use client';

import React, { useState, useEffect } from 'react';
import styles from './BookingPortal.module.css';

import { checkBookingOverlap, formatCustomTimeRange, parseTimeRange, convert12HourToMinutes, convertMinutesTo12Hour, validateSlotOperatingHours, VENUE_CLOSE_MINUTES } from '@/lib/time';
import { Download, Printer, FileText } from 'lucide-react';
import type { ConfirmationResult } from 'firebase/auth';
import { isFirebaseConfigured } from '@/lib/firebase';
import { setupRecaptcha, sendFirebaseOtp, verifyFirebaseOtpCode } from '@/lib/firebaseAuth';
import { getAdminWhatsAppDeepLink } from '@/lib/whatsappUtils';

import { EXPERIENCES } from '@/lib/experiences';

// Packages Constant (Canonical source of truth)
const PACKAGES = EXPERIENCES;

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
  advancePaid?: number;
  balanceDue?: number;
  paymentStatus?: string;
  paymentMode?: string;
  status: string;
  utrNumber?: string;
  couponCode?: string;
  discountAmount?: number;
}

interface ActiveBooking {
  id: string;
  date: string;
  timeSlot: string;
  status?: string;
}

export interface BookingPortalProps {
  initialTheme?: 'pink' | 'purple' | 'red' | string;
  initialPackageId?: string;
  isModal?: boolean;
  onClose?: () => void;
  onPackageSelect?: (pkg: typeof PACKAGES[0]) => void;
}

export default function BookingPortal({
  initialTheme,
  initialPackageId,
  isModal = false,
  onClose,
  onPackageSelect,
}: BookingPortalProps = {}) {
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
  const [customStartHour, setCustomStartHour] = useState('10');
  const [customStartMin, setCustomStartMin] = useState('00');
  const [customStartAmPm, setCustomStartAmPm] = useState<'AM' | 'PM'>('AM');
  const [customEndHour, setCustomEndHour] = useState('12');
  const [customEndMin, setCustomEndMin] = useState('00');
  const [customEndAmPm, setCustomEndAmPm] = useState<'AM' | 'PM'>('PM');
  const [customSlotError, setCustomSlotError] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');

  const resolveInitialPackage = () => {
    if (initialPackageId) {
      const match = PACKAGES.find((p) => p.id === initialPackageId);
      if (match) return match;
    }
    if (initialTheme) {
      const cleanTheme = initialTheme.toLowerCase();
      const match = PACKAGES.find((p) => p.slug.toLowerCase().includes(cleanTheme));
      if (match) return match;
    }
    return PACKAGES[0];
  };

  const [selectedPackage, setSelectedPackage] = useState(resolveInitialPackage);

  useEffect(() => {
    if (initialPackageId) {
      const match = PACKAGES.find((p) => p.id === initialPackageId);
      if (match) setSelectedPackage(match);
    } else if (initialTheme) {
      const cleanTheme = initialTheme.toLowerCase();
      const match = PACKAGES.find((p) => p.slug.toLowerCase().includes(cleanTheme));
      if (match) setSelectedPackage(match);
    }
  }, [initialPackageId, initialTheme]);
  const [fogOption, setFogOption] = useState<'none' | '1pot' | '2pots'>('none');
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
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<ConfirmationResult | null>(null);
  const [customerBookings, setCustomerBookings] = useState<ConfirmedBooking[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [selectedTicketToView, setSelectedTicketToView] = useState<ConfirmedBooking | null>(null);

  const setErrorAndScroll = (msg: string) => {
    setError(msg);
    setTimeout(() => {
      const portal = document.getElementById('booking-portal-container');
      if (portal) {
        portal.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

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
        const res = await fetch(`/api/slots?date=${selectedDate}&type=theater`);
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

        const parsedSlots = (data.slots || []).map((slot: Slot) => {
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

        if (bookingMode === 'predefined') {
          setSelectedSlot((prev) => {
            if (!prev) return null;
            const stillAvailable = parsedSlots.find(
              (s: Slot) => s.time === prev.time && !s.isBooked
            );
            return stillAvailable ? prev : null;
          });
        }
      } catch (err: unknown) {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Error fetching available slots.';
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchSlots();

    return () => {
      active = false;
    };
  }, [selectedDate, bookingMode]);

  // Load customer session on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedPhone = sessionStorage.getItem('bee_vibe_customer_phone');
      if (savedPhone) {
        setCustomerPhone(savedPhone);
        setIsCustomerLoggedIn(true);
        setCustomerDetails((prev) => ({ ...prev, phone: savedPhone }));
      }
    }, 0);
    return () => clearTimeout(timer);
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading bookings list.';
      setOrdersError(msg);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!isCustomerLoggedIn || !customerPhone) return;
    const timer = setTimeout(() => {
      fetchCustomerBookings(customerPhone);
    }, 0);
    return () => clearTimeout(timer);
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
      if (isFirebaseConfigured()) {
        const recaptchaVerifier = setupRecaptcha('firebase-recaptcha-btn');
        if (!recaptchaVerifier) {
          throw new Error('Failed to initialize Firebase reCAPTCHA.');
        }
        const fbRes = await sendFirebaseOtp(finalPhone, recaptchaVerifier);
        if (!fbRes.success || !fbRes.confirmationResult) {
          throw new Error(fbRes.error || 'Failed to send OTP via Firebase.');
        }
        setFirebaseConfirmation(fbRes.confirmationResult);
        setOtpSent(true);
      } else {
        const res = await fetch('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: finalPhone }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to send OTP.');

        setOtpSent(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP. Please check the number.';
      setLoginError(msg);
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
      if (isFirebaseConfigured() && firebaseConfirmation) {
        const fbVerify = await verifyFirebaseOtpCode(firebaseConfirmation, trimmedCode);
        if (!fbVerify.success) {
          throw new Error(fbVerify.error || 'Invalid OTP code.');
        }
      } else {
        const res = await fetch('/api/otp/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: finalPhone, code: trimmedCode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Invalid OTP code.');
      }

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
      setFirebaseConfirmation(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OTP verification failed. Please try again.';
      setLoginError(msg);
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

        // 12:00 AM at end of night represents closing midnight (1440 mins)
        if (endH === 12 && endM === 0 && customEndAmPm === 'AM' && startMinutes > 0) {
          endMinutes = 1440;
        }

        // Enforce 10:00 AM to 12:00 AM Midnight operating limit
        const hoursValidation = validateSlotOperatingHours(startMinutes, endMinutes);
        if (!hoursValidation.valid) {
          setCustomSlotError(hoursValidation.error || 'Invalid operating time.');
          return;
        }

        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = yyyy + '-' + mm + '-' + dd;

        if (selectedDate === todayStr) {
          const currentMinutes = today.getHours() * 60 + today.getMinutes();
          if (startMinutes <= currentMinutes) {
            setCustomSlotError('Cannot select a time slot that has already passed.');
            return;
          }
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

        // Base price is driven entirely by the selected package
        const durationHours = durationMinutes / 60;
        const basePrice = Math.round((selectedPackage.price / 2) * durationHours);

        setSelectedSlot({
          id: 'slot-custom',
          time: timeStr,
          label: 'Custom Slot (' + durationHours + ' Hr' + (durationHours > 1 ? 's' : '') + ')',
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
    selectedPackage,
  ]);

  const getSlotDurationHours = () => {
    if (!selectedSlot) return 2;
    try {
      const { startMinutes, endMinutes } = parseTimeRange(selectedSlot.time);
      return (endMinutes - startMinutes) / 60;
    } catch {
      return 2;
    }
  };

  const isCouponApplied = appliedCoupon === 'BEEVIBE999' || appliedCoupon === 'VIBE999';

  // Standard package base without discounts
  const getStandardPackagePrice = () => {
    const durationHours = getSlotDurationHours();
    return selectedPackage ? Math.round((selectedPackage.price / 2) * durationHours) : 0;
  };

  // Base theme package price (flat ₹999 for 2 hrs when coupon is applied)
  const getEffectivePackagePrice = () => {
    const durationHours = getSlotDurationHours();
    if (isCouponApplied) {
      return Math.round((999 / 2) * durationHours);
    }
    return selectedPackage ? Math.round((selectedPackage.price / 2) * durationHours) : 0;
  };

  // Effective Fog Entry Price (Complimentary 1 pot included with coupon)
  const getEffectiveFogPrice = () => {
    if (isCouponApplied) {
      if (fogOption === '2pots') return 200; // upgrade charge for 2nd pot
      return 0; // free with coupon
    }
    if (fogOption === '1pot') return 300;
    if (fogOption === '2pots') return 500;
    return 0;
  };

  // Calculate discount amount
  const calculateDiscount = () => {
    if (!isCouponApplied) return 0;
    const stdPkg = getStandardPackagePrice();
    const effPkg = getEffectivePackagePrice();
    const stdFog = fogOption === '1pot' ? 300 : fogOption === '2pots' ? 500 : 300;
    const effFog = getEffectiveFogPrice();
    return Math.max(0, (stdPkg - effPkg) + (stdFog - effFog));
  };

  // Calculate dynamic pricing
  const calculateTotal = () => {
    const pkgBase = getEffectivePackagePrice();
    const extraGuests = customerDetails.guestCount > 2 ? (customerDetails.guestCount - 2) * 100 : 0;
    const fogPrice = getEffectiveFogPrice();

    return pkgBase + extraGuests + fogPrice;
  };

  const calculateAdvance = () => Math.min(500, calculateTotal());
  const calculateBalance = () => Math.max(0, calculateTotal() - calculateAdvance());

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    if (code === 'BEEVIBE999' || code === 'VIBE999') {
      setAppliedCoupon(code);
      setCouponInput(code);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon code. Try "BEEVIBE999" for flat ₹999 on any theme!');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
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
      if (!selectedPackage) {
        setErrorAndScroll('Please select an experience theme to proceed.');
        return;
      }
      if (customerDetails.guestCount < 1 || customerDetails.guestCount > 10) {
        setErrorAndScroll('Guest count must be between 1 and 10.');
        return;
      }
    }
    if (step === 2) {
      if (bookingMode === 'custom' && customSlotError) {
        setErrorAndScroll(customSlotError);
        return;
      }
      if (!selectedSlot) {
        setErrorAndScroll('Please select a time slot to proceed.');
        return;
      }
    }
    if (step === 4) {
      if (!isCustomerLoggedIn) {
        setErrorAndScroll('Please log in and verify your phone number to proceed.');
        return;
      }
      if (!customerDetails.name || !customerDetails.email) {
        setErrorAndScroll('Please fill in all required fields (Name and Email).');
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
      setShowLoginModal(true);
      setErrorAndScroll('Please verify your phone number first to complete the booking.');
      return;
    }
    if (!customerDetails.name.trim()) { setErrorAndScroll('Please enter your full name.'); return; }
    if (!customerDetails.email.trim()) { setErrorAndScroll('Please enter your email address.'); return; }
    const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/;
    if (!emailRegex.test(customerDetails.email.trim())) { setErrorAndScroll('Please enter a valid email address.'); return; }
    if (customerDetails.guestCount < 1 || customerDetails.guestCount > 10) { setErrorAndScroll('Guest count must be between 1 and 10.'); return; }

    const cleanUtr = utrNumber.replace(/\D/g, '').trim();
    if (!cleanUtr) {
      setErrorAndScroll('⚠️ Please complete your UPI payment and enter the 12-digit UPI Reference Number / UTR below to confirm your booking.');
      return;
    }
    if (cleanUtr.length !== 12) {
      setErrorAndScroll(`⚠️ Invalid UTR Number (${cleanUtr.length}/12 digits). The UPI Transaction UTR must be exactly 12 numeric digits (no letters or symbols).`);
      return;
    }

    if (!paymentConfirmed) {
      setErrorAndScroll(`⚠️ Please check the confirmation checkbox confirming that you have transferred ₹${calculateAdvance()} to NALINAKSHI C (8123635342@sbi).`);
      return;
    }

    setIsPaying(true);
    setPaymentStep(0);

    const bookingPayload = {
      customerName: customerDetails.name,
      email: customerDetails.email,
      phone: customerPhone,
      date: selectedDate,
      timeSlot: selectedSlot?.time,
      packageName: selectedPackage.name,
      addOns: (() => {
        const list: string[] = [];
        if (isCouponApplied) {
          list.push('BEEVIBE999 Offer: Flat ₹999 Base Theme');
          list.push('BEEVIBE999 Offer: Complimentary Fog Entry');
          list.push('BEEVIBE999 Offer: Floor Balloons Setup');
          list.push('BEEVIBE999 Offer: Table Decor Setup');
          list.push('BEEVIBE999 Offer: Custom LED Name Board');
          list.push('BEEVIBE999 Offer: All OTT Platforms Access');
          if (fogOption === '2pots') {
            list.push('Grand Fog Upgrade (+1 Extra Pot — ₹200)');
          }
        } else {
          if (fogOption === '1pot') list.push('Special Fog Entry Effect (1 Pot — ₹300)');
          else if (fogOption === '2pots') list.push('Special Fog Entry Effect (2 Pots — ₹500)');
        }
        return list;
      })(),
      totalPrice: calculateTotal(),
      advancePaid: calculateAdvance(),
      balanceDue: calculateBalance(),
      paymentStatus: calculateBalance() === 0 ? 'fully_paid' : 'advance_paid',
      paymentMode: 'UPI (8123635342@sbi)',
      utrNumber: cleanUtr,
      couponCode: isCouponApplied ? (appliedCoupon || 'BEEVIBE999') : undefined,
      discountAmount: isCouponApplied ? calculateDiscount() : undefined,
      guestCount: customerDetails.guestCount,
      specialRequests: customerDetails.specialRequests + (cleanUtr ? (' | UPI Ref: ' + cleanUtr) : ''),
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
    } catch (err: unknown) {
      setIsPaying(false);
      const msg = err instanceof Error ? err.message : 'Payment transaction failed. Please try again.';
      setErrorAndScroll(msg);
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
  <text x="225" y="85" class="font-body" font-size="11" font-weight="600" fill="#626272" letter-spacing="3" text-anchor="middle">PRIVATE CELEBRATION THEATER TICKET</text>
  
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
              <p class="subtitle">Private Celebration Theater Ticket</p>
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
    <div id="booking-portal-container" className={styles.portalContainer}>
      {isPaying && (
        <div className={styles.paymentOverlay}>
          <div className={styles.paymentModal}>
            <div className={styles.paymentHeader}>
              <span className={styles.lockIcon}>🔒</span> Reservation Checkout
            </div>
            
            <div className={styles.paymentContent}>
              {paymentStep === 0 && (
                <>
                  <div className={styles.paymentSpinner} />
                  <h3 className={styles.paymentStatus}>Connecting to Booking Engine...</h3>
                  <p className={styles.paymentDetail}>Establishing connection with reservation system.</p>
                </>
              )}
              {paymentStep === 1 && (
                <>
                  <div className={styles.paymentSpinner} />
                  <h3 className={styles.paymentStatus}>Authorizing Reservation...</h3>
                  <p className={styles.paymentDetail}>Verifying slot availability and details for ₹{calculateTotal()}.</p>
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
                  <h3 className={styles.paymentStatus} style={{ color: '#10b981' }}>Booking Confirmed!</h3>
                  <p className={styles.paymentDetail}>Thank you! Your reservation is confirmed. Generating your digital entrance ticket now...</p>
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
          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className={styles.modalCloseIconBtn}
              title="Close modal"
              aria-label="Close booking modal"
            >
              ✕
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
                      placeholder="Enter Phone (Ex: 9900106474)"
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
                <div className={styles.ticketSub}>Private Celebration Theater Ticket</div>
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                    <text x="225" y="85" class="font-body" font-size="11" font-weight="600" fill="#626272" letter-spacing="3" text-anchor="middle">PRIVATE CELEBRATION THEATER TICKET</text>
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
                            <p class="subtitle">Private Celebration Theater Ticket</p>
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
                          ${addons ? `
                          <div class="row">
                            <div class="col">
                              <span class="label">Add-ons</span>
                              <span class="val">${addons}</span>
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
                1. Experience & Guests {step > 1 && '✓'}
              </div>
              <div className={`${styles.stepIndicator} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepCompleted : ''}`}>
                2. Date & Slot {step > 2 && '✓'}
              </div>
              <div className={`${styles.stepIndicator} ${step === 3 ? styles.stepActive : step > 3 ? styles.stepCompleted : ''}`}>
                3. Add-ons {step > 3 && '✓'}
              </div>
              <div className={`${styles.stepIndicator} ${step === 4 ? styles.stepActive : ''}`}>
                4. Details & Pay
              </div>
            </div>
          )}

          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* STEP 1: Choose Celebration Theme & Guests */}
          {step === 1 && (
            <div className={styles.stepContainer}>
              <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-title)' }}>Select Your Celebration Theme</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                All themes include 180&quot; 4K screen, 7.1 Dolby surround sound, AC, and complete room privacy.
              </p>

              <div className={styles.packagesGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '20px' }}>
                {PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`${styles.packageCard} ${selectedPackage.id === pkg.id ? styles.packageSelected : ''}`}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      if (onPackageSelect) onPackageSelect(pkg);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      borderRadius: '16px',
                      border: selectedPackage.id === pkg.id ? `2px solid ${pkg.color}` : '1px solid rgba(255, 255, 255, 0.12)',
                      background: selectedPackage.id === pkg.id ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                      padding: 0,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: selectedPackage.id === pkg.id ? `0 8px 30px ${pkg.color}33` : 'none'
                    }}
                  >
                    {/* Real Venue Photo Header */}
                    <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pkg.image}
                        alt={pkg.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: pkg.color,
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}>
                        {pkg.badge}
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '50px',
                        background: 'linear-gradient(to top, rgba(12, 10, 9, 0.95), transparent)'
                      }} />
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                      <h4 className={styles.packageName} style={{ color: pkg.color, fontSize: '1.1rem', marginBottom: '6px' }}>{pkg.name}</h4>
                      <div className={styles.packagePrice} style={{ color: '#ffffff', fontSize: '1.35rem', fontWeight: 800, marginBottom: '6px' }}>
                        ₹{pkg.price} <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ 2 Hours (Base 2 Guests)</span>
                      </div>
                      <div style={{
                        background: 'rgba(242, 169, 0, 0.12)',
                        border: '1px dashed rgba(242, 169, 0, 0.4)',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        marginBottom: '10px',
                        fontSize: '0.76rem',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        lineHeight: 1.3
                      }}>
                        🎟️ Use code <strong>BEEVIBE999</strong> for <strong>flat ₹999</strong> + Free Fog Entry, Floor Balloons, Table Decor, LED Name Board &amp; All OTTs!
                      </div>
                      <ul className={styles.packageDetails} style={{ flexGrow: 1, margin: 0, paddingLeft: 0, listStyle: 'none' }}>
                        {pkg.details.map((detail, idx) => (
                          <li key={idx} style={{ fontSize: '0.8rem', color: '#d0d0e0', marginBottom: '6px', display: 'flex', gap: '6px' }}>
                            <span style={{ color: pkg.color, fontWeight: 'bold' }}>✓</span> {detail}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        style={{
                          marginTop: '14px',
                          padding: '8px 14px',
                          borderRadius: '8px',
                          background: selectedPackage.id === pkg.id ? pkg.color : 'rgba(255, 255, 255, 0.08)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {selectedPackage.id === pkg.id ? '✓ Selected' : 'Choose This Theme'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            
              {/* Guest Count Selector */}
              <div className={styles.guestSelectorCard}>
                <div className={styles.guestSelectorInfo}>
                  <label className={styles.guestSelectorLabel}>Number of Guests</label>
                  <span className={styles.guestSelectorSub}>Base package covers 2 guests. Up to 10 guests (+₹100 per extra guest).</span>
                </div>
                <div className={styles.guestCounterControls}>
                  <button
                    type="button"
                    className={styles.guestCounterBtn}
                    onClick={() => setCustomerDetails(prev => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
                    disabled={customerDetails.guestCount <= 1}
                  >
                    −
                  </button>
                  <span className={styles.guestCounterValue}>{customerDetails.guestCount}</span>
                  <button
                    type="button"
                    className={styles.guestCounterBtn}
                    onClick={() => setCustomerDetails(prev => ({ ...prev, guestCount: Math.min(10, prev.guestCount + 1) }))}
                    disabled={customerDetails.guestCount >= 10}
                  >
                    +
                  </button>
                </div>
              </div>
</div>
          )}

          {/* STEP 2: Date & Time Slot selection */}
          {step === 2 && (
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
                    Select a 2-hour celebration slot. Price depends on your selected theme package in the next step.
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
                            {slot.isBooked ? 'Unavailable' : 'Available'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.time12hPickerContainer}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', margin: '16px 0 8px 0' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-title)' }}>Customize Your Show Time</h3>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(242, 169, 0, 0.12)', border: '1px solid rgba(242, 169, 0, 0.3)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>
                      ⏰ Open 10:00 AM – 12:00 AM (Midnight)
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Select your start and end times using easy 12-hour format with AM / PM options. Theater closes strictly at 12:00 AM Midnight.
                  </p>

                  <div className={styles.time12hInputsGrid}>
                    {/* Start Time Card */}
                    <div className={styles.timePickerCard}>
                      <div className={styles.timePickerCardHeader}>
                        <span className={styles.timePickerCardTitle}>🟢 START TIME</span>
                      </div>
                      <div className={styles.timePickerControls}>
                        <select
                          className={styles.timeSelect}
                          value={customStartHour}
                          onChange={(e) => setCustomStartHour(e.target.value)}
                        >
                          {['10', '11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09'].map((h) => (
                            <option key={'sh-' + h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className={styles.timeSeparator}>:</span>
                        <select
                          className={styles.timeSelect}
                          value={customStartMin}
                          onChange={(e) => setCustomStartMin(e.target.value)}
                        >
                          {['00', '15', '30', '45'].map((m) => (
                            <option key={'sm-' + m} value={m}>{m}</option>
                          ))}
                        </select>
                        <div className={styles.ampmToggleGroup}>
                          <button
                            type="button"
                            className={styles.ampmBtn + (customStartAmPm === 'AM' ? ' ' + styles.ampmBtnActive : '')}
                            onClick={() => setCustomStartAmPm('AM')}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            className={styles.ampmBtn + (customStartAmPm === 'PM' ? ' ' + styles.ampmBtnActive : '')}
                            onClick={() => setCustomStartAmPm('PM')}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* End Time Card */}
                    <div className={styles.timePickerCard}>
                      <div className={styles.timePickerCardHeader}>
                        <span className={styles.timePickerCardTitle}>🔴 END TIME (MAX 12:00 AM)</span>
                      </div>
                      <div className={styles.timePickerControls}>
                        <select
                          className={styles.timeSelect}
                          value={customEndHour}
                          onChange={(e) => setCustomEndHour(e.target.value)}
                        >
                          {['10', '11', '12', '01', '02', '03', '04', '05', '06', '07', '08', '09'].map((h) => (
                            <option key={'eh-' + h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className={styles.timeSeparator}>:</span>
                        <select
                          className={styles.timeSelect}
                          value={customEndMin}
                          onChange={(e) => setCustomEndMin(e.target.value)}
                        >
                          {['00', '15', '30', '45'].map((m) => (
                            <option key={'em-' + m} value={m}>{m}</option>
                          ))}
                        </select>
                        <div className={styles.ampmToggleGroup}>
                          <button
                            type="button"
                            className={styles.ampmBtn + (customEndAmPm === 'AM' ? ' ' + styles.ampmBtnActive : '')}
                            onClick={() => setCustomEndAmPm('AM')}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            className={styles.ampmBtn + (customEndAmPm === 'PM' ? ' ' + styles.ampmBtnActive : '')}
                            onClick={() => setCustomEndAmPm('PM')}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Duration */}
                  <div className={styles.quickDurationSection}>
                    <span className={styles.quickDurationTitle}>⚡ Quick Duration Presets (Auto-calculates End Time):</span>
                    <div className={styles.quickDurationPills}>
                      <button type="button" className={styles.quickDurationBtn} onClick={() => applyQuickDuration(2)}>
                        +2 Hours (Standard)
                      </button>
                      <button type="button" className={styles.quickDurationBtn} onClick={() => applyQuickDuration(2.5)}>
                        +2.5 Hours
                      </button>
                      <button type="button" className={styles.quickDurationBtn} onClick={() => applyQuickDuration(3)}>
                        +3 Hours (Movie & Party)
                      </button>
                      <button type="button" className={styles.quickDurationBtn} onClick={() => applyQuickDuration(4)}>
                        +4 Hours (Extended)
                      </button>
                    </div>
                  </div>

                  {customSlotError ? (
                    <div className={styles.slotErrorMsg}>{customSlotError}</div>
                  ) : selectedSlot ? (
                    <div className={styles.customSlotPriceBox}>
                      <div className={styles.priceLabel}>
                        Selected Time: <strong style={{ color: '#ffffff' }}>{selectedSlot.time}</strong> ({selectedSlot.label})
                      </div>
                      <div className={styles.priceVal} style={{ fontSize: '0.9rem', fontWeight: 'normal', textShadow: 'none', color: '#10b981' }}>
                        ✓ Available within operating hours
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Select Optional Add-ons */}
          {step === 3 && (
            <div className={styles.stepContainer}>
              <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-title)' }}>Enhance the Experience (Optional)</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                Choose add-on options to customize your celebration.
              </p>

              <div className={styles.addonsGrid} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {/* Separate PS5 Gaming Notice Banner */}
                <div style={{ gridColumn: '1 / -1', background: 'rgba(0, 240, 255, 0.06)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '12px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.4rem' }}>🎮</span>
                    <div>
                      <div style={{ color: '#00f0ff', fontWeight: 700, fontSize: '0.9rem' }}>Looking for PS5 Gaming?</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>PS5 Gaming is booked as a separate dedicated lounge session.</div>
                    </div>
                  </div>
                  <a href="/gaming/book" style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none' }}>
                    Book Gaming Lounge →
                  </a>
                </div>


                {/* Special Fog Entry Effect Dropdown Card */}
                <div className={`${styles.addonCard} ${fogOption !== 'none' || isCouponApplied ? styles.addonSelected : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className={styles.addonName}>🌫️ Special Fog Entry Effect</span>
                    <span className={styles.addonPrice} style={{ fontSize: '0.9rem', color: isCouponApplied ? '#10b981' : fogOption !== 'none' ? 'var(--accent)' : 'var(--text-secondary)' }}>
                      {isCouponApplied
                        ? fogOption === '2pots' ? '+₹200 (Upgrade)' : 'FREE with Coupon 🎟️'
                        : fogOption === 'none' ? 'Included in Offer / Optional' : fogOption === '1pot' ? '+₹300' : '+₹500'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: isCouponApplied ? '#10b981' : 'var(--accent)', fontWeight: 500 }}>
                    {isCouponApplied
                      ? '✓ 1 Pot Fog Entry is included 100% Free with your coupon!'
                      : '💡 Offer: Entering coupon BEEVIBE999 at checkout gives you 1 Pot Fog Entry completely FREE!'}
                  </div>
                  <select
                    className={`${styles.addonSelectDropdown} ${fogOption !== 'none' ? styles.addonSelectDropdownActive : ''}`}
                    value={fogOption}
                    onChange={(e) => setFogOption(e.target.value as 'none' | '1pot' | '2pots')}
                  >
                    <option value="none">{isCouponApplied ? '1 Pot Fog Entry Included (Free)' : 'No Fog Entry Effect (₹0)'}</option>
                    <option value="1pot">{isCouponApplied ? '1 Pot Special Fog Entry (Free with Coupon)' : '1 Pot Special Fog Entry (+₹300)'}</option>
                    <option value="2pots">{isCouponApplied ? '2 Pots Grand Fog Entry (+₹200 Upgrade)' : '2 Pots Special Fog Entry (+₹500)'}</option>
                  </select>
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <h4 style={{ fontFamily: 'var(--font-title)', color: 'var(--accent)', margin: 0 }}>Booking Summary</h4>
                  {isCouponApplied && (
                    <span style={{ fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#10b981', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                      🎉 BEEVIBE999 Offer Active
                    </span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px 16px', fontSize: '0.9rem' }}>
                  <div><strong>Date:</strong> {selectedDate}</div>
                  <div><strong>Time Slot:</strong> {selectedSlot?.time} ({selectedSlot?.label})</div>
                  <div>
                    <strong>Theme Package:</strong> {selectedPackage.name}{' '}
                    {isCouponApplied ? (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        (<s style={{ color: '#ef4444' }}>₹{getStandardPackagePrice()}</s> → <strong style={{ color: '#10b981' }}>₹{getEffectivePackagePrice()}</strong>)
                      </span>
                    ) : (
                      <span>(₹{getStandardPackagePrice()})</span>
                    )}
                  </div>
                  <div>
                    <strong>Add-ons & Perks:</strong>{' '}
                    {isCouponApplied ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        Free Fog Entry + LED Name Board + Candle Decor + OTT Apps
                        {fogOption === '2pots' && ' (+1 Extra Pot Upgrade: ₹200)'}
                      </span>
                    ) : fogOption !== 'none' ? (
                      fogOption === '1pot' ? 'Special Fog Entry (1 Pot — ₹300)' : 'Special Fog Entry (2 Pots — ₹500)'
                    ) : (
                      'None'
                    )}
                  </div>
                  {isCouponApplied && (
                    <div style={{ color: '#10b981', fontWeight: 600 }}>
                      <strong>Coupon Savings:</strong> -₹{calculateDiscount()}
                    </div>
                  )}
                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px', fontSize: '1.15rem', color: 'var(--accent)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Total Cost:</span>
                    <span>
                      {isCouponApplied && (
                        <span style={{ fontSize: '0.85rem', color: '#a1a1aa', textDecoration: 'line-through', marginRight: '8px', fontWeight: 'normal' }}>
                          ₹{getStandardPackagePrice() + (customerDetails.guestCount > 2 ? (customerDetails.guestCount - 2) * 100 : 0) + (fogOption === '1pot' ? 300 : fogOption === '2pots' ? 500 : 0)}
                        </span>
                      )}
                      ₹{calculateTotal()}
                    </span>
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

                  {/* Coupon Code Slot */}
                  <div className={`${styles.couponSection} ${isCouponApplied ? styles.couponSectionActive : ''}`}>
                    <div className={styles.couponHeader}>
                      <span style={{ fontSize: '1.4rem' }}>🎟️</span>
                      <div>
                        <div className={styles.couponTitle}>Have a Coupon or Promo Code?</div>
                        <div className={styles.couponSub}>Apply your coupon to unlock special flat rates and complimentary inclusions!</div>
                      </div>
                    </div>

                    {!isCouponApplied ? (
                      <>
                        <div className={styles.couponInputWrapper}>
                          <input
                            type="text"
                            className={styles.couponInput}
                            placeholder="Enter Code (e.g. BEEVIBE999)"
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              setCouponError('');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                          />
                          <button
                            type="button"
                            className={styles.couponApplyBtn}
                            onClick={() => handleApplyCoupon()}
                          >
                            Apply Code
                          </button>
                        </div>

                        <div className={styles.couponSuggestionRow}>
                          <span>🔥 Limited Deal:</span>
                          <button
                            type="button"
                            className={styles.couponSuggestionChip}
                            onClick={() => handleApplyCoupon('BEEVIBE999')}
                          >
                            ⚡ Click to Apply BEEVIBE999 (Flat ₹999)
                          </button>
                        </div>

                        {couponError && <div className={styles.couponErrorMsg}>{couponError}</div>}
                      </>
                    ) : (
                      <div className={styles.couponAppliedContainer}>
                        <div className={styles.couponAppliedTop}>
                          <div className={styles.couponAppliedBadge}>
                            ✓ Code <strong>{appliedCoupon}</strong> Applied! (Flat ₹999 Unlocked)
                          </div>
                          <button
                            type="button"
                            className={styles.couponRemoveBtn}
                            onClick={handleRemoveCoupon}
                          >
                            Remove Code
                          </button>
                        </div>
                        <div className={styles.couponPerksList}>
                          <div className={styles.couponPerkTitle}>✨ All Offer Inclusions Activated:</div>
                          <div className={styles.couponPerksGrid}>
                            <div className={styles.couponPerkItem}>✓ Any Theme Base: Flat ₹999</div>
                            <div className={styles.couponPerkItem}>✓ Complimentary Fog Entry Effect Included</div>
                            <div className={styles.couponPerkItem}>✓ Glowing LED Name Board Included</div>
                            <div className={styles.couponPerkItem}>✓ Romantic Candlelit Table Decor Included</div>
                            <div className={styles.couponPerkItem}>✓ All OTT Platforms (Netflix/Prime/Hotstar) Included</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Advance Payment Checkout Card */}
                  <div className={styles.advancePaymentCard} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.advanceHeader}>
                      <span style={{ fontSize: '1.6rem' }}>💳</span>
                      <div>
                        <h4 className={styles.advanceHeaderTitle}>Advance Payment Required to Confirm Reservation</h4>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          To lock and confirm your slot on the schedule, please transfer the advance deposit of ₹{calculateAdvance()} using the verified SBI UPI QR below.
                        </p>
                      </div>
                    </div>

                    <div className={styles.advanceBreakdownRow}>
                      <div className={styles.advanceBreakdownItem}>
                        <div className={styles.advanceBreakdownLabel}>Total Hall Price</div>
                        <div className={styles.advanceBreakdownVal}>
                          ₹{calculateTotal()}
                          {isCouponApplied && (
                            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                              (Saved ₹{calculateDiscount()})
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.advanceBreakdownItem + ' ' + styles.advancePayableHighlight}>
                        <div className={styles.advanceBreakdownLabel}>🟢 Advance Due Now</div>
                        <div className={styles.advanceBreakdownVal}>₹{calculateAdvance()}</div>
                      </div>
                      <div className={styles.advanceBreakdownItem}>
                        <div className={styles.advanceBreakdownLabel}>⏳ Remaining Balance at Venue</div>
                        <div className={styles.advanceBreakdownVal}>₹{calculateBalance()}</div>
                      </div>
                    </div>

                    {/* Modern 2-Column Luxury Payment Console */}
                    <div className={styles.paymentConsoleGrid}>
                      {/* Column 1: QR Station */}
                      <div className={styles.paymentQrCard}>
                        <div className={styles.qrHeaderPill}>
                          <span className={styles.qrScanBadge}>📲 SCAN & PAY</span>
                          <span className={styles.qrAmountText}>₹{calculateAdvance()}</span>
                        </div>
                        <div className={styles.qrImageFrame}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/beevibe-payment-qr.jpg"
                            alt="Bee Vibe UPI Advance QR Code - NALINAKSHI C"
                            width={170}
                            height={230}
                            style={{ display: 'block', borderRadius: '6px', objectFit: 'contain' }}
                          />
                        </div>
                        <div className={styles.supportedAppsStrip}>
                          <span className={styles.appPill}>GPay</span>
                          <span className={styles.appPill}>PhonePe</span>
                          <span className={styles.appPill}>Paytm</span>
                          <span className={styles.appPill}>BHIM</span>
                          <span className={styles.appPill}>Cred</span>
                        </div>
                      </div>

                      {/* Column 2: Payee & UTR Verification */}
                      <div className={styles.paymentActionsCol}>
                        {/* Card 1: Official Payee */}
                        <div className={styles.payeeUnifiedCard}>
                          <div className={styles.payeeMetaRow}>
                            <div>
                              <div className={styles.payeeNameLabel}>Verified Beneficiary</div>
                              <div className={styles.payeeFullName}>NALINAKSHI C</div>
                            </div>
                            <span className={styles.bankPillBadge}>
                              🏦 State Bank of India (6592)
                            </span>
                          </div>

                          <div className={styles.upiDetailsRow}>
                            <div>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>UPI ID: </span>
                              <span className={styles.upiIdDisplay}>8123635342@sbi</span>
                            </div>
                            <button
                              type="button"
                              className={styles.copyUpiBtn}
                              onClick={() => {
                                navigator.clipboard.writeText('8123635342@sbi');
                                setUpiCopied(true);
                                setTimeout(() => setUpiCopied(false), 2000);
                              }}
                            >
                              {upiCopied ? '✓ Copied' : '📋 Copy'}
                            </button>
                          </div>

                          <a
                            href={"upi://pay?pa=8123635342@sbi&pn=NALINAKSHI%20C&am=" + calculateAdvance() + "&cu=INR&tn=Advance%20Booking%20BeeVibe"}
                            className={styles.mobileUpiBtn}
                          >
                            ⚡ Open in UPI App (GPay / PhonePe)
                          </a>
                        </div>

                        {/* Card 2: UTR Verification */}
                        <div className={styles.utrVerificationCard}>
                          <div className={styles.utrHeaderRow}>
                            <span className={styles.utrStepBadge}>STEP 2</span>
                            <span className={styles.utrTitleText}>Confirm with 12-Digit UPI Ref / UTR *</span>
                          </div>

                          <div className={styles.utrInputContainer}>
                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={12}
                              className={styles.utrLargeInput}
                              placeholder="e.g. 423987123456"
                              value={utrNumber}
                              onChange={(e) => {
                                const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 12);
                                setUtrNumber(digitsOnly);
                              }}
                              style={{
                                borderColor: utrNumber.length === 12 ? '#10b981' : utrNumber.length > 0 ? '#f59e0b' : 'rgba(255,255,255,0.2)'
                              }}
                              required
                            />
                            <div className={styles.utrLiveFeedbackRow}>
                              <span style={{ color: utrNumber.length === 12 ? '#10b981' : utrNumber.length > 0 ? '#f59e0b' : 'var(--text-secondary)', fontWeight: 500 }}>
                                {utrNumber.length === 12 ? '✓ 12-digit UTR verified' : utrNumber.length > 0 ? `⚠️ ${utrNumber.length}/12 digits entered` : 'Enter 12 digits from UPI receipt'}
                              </span>
                              <span style={{ color: utrNumber.length === 12 ? '#10b981' : '#a1a1aa', fontWeight: 700, fontFamily: 'monospace' }}>
                                {utrNumber.length}/12
                              </span>
                            </div>
                          </div>

                          <label className={styles.compactConfirmationLabel}>
                            <input
                              type="checkbox"
                              className={styles.compactConfirmationCheckbox}
                              checked={paymentConfirmed}
                              onChange={(e) => setPaymentConfirmed(e.target.checked)}
                            />
                            <span>I have transferred the advance of <strong>₹{calculateAdvance()}</strong> to <strong>8123635342@sbi</strong></span>
                          </label>
                        </div>
                      </div>
                    </div>
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
                    <div className={styles.ticketSub}>Private Celebration Theater Ticket</div>
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

                    {confirmedBooking.couponCode && (
                      <div className={styles.ticketRow} style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', padding: '6px 10px', margin: '4px 0' }}>
                        <div>
                          <span className={styles.ticketLabel} style={{ color: '#10b981' }}>COUPON APPLIED</span>
                          <div className={styles.ticketVal} style={{ color: '#10b981', fontWeight: 'bold' }}>{confirmedBooking.couponCode}</div>
                        </div>
                        <div>
                          <span className={styles.ticketLabel} style={{ color: '#10b981' }}>OFFER SAVINGS</span>
                          <div className={styles.ticketVal} style={{ color: '#10b981', fontWeight: 'bold' }}>- ₹{confirmedBooking.discountAmount || 0}</div>
                        </div>
                      </div>
                    )}

                    <div className={styles.ticketRow} style={{ background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px', padding: '8px', margin: '6px 0' }}>
                      <div>
                        <span className={styles.ticketLabel} style={{ color: '#10b981' }}>🟢 ADVANCE RECEIVED</span>
                        <div className={styles.ticketVal} style={{ color: '#10b981', fontWeight: 'bold' }}>
                          ₹{confirmedBooking.advancePaid ?? 500}
                        </div>
                      </div>
                      <div>
                        <span className={styles.ticketLabel} style={{ color: '#f59e0b' }}>⏳ BALANCE DUE</span>
                        <div className={styles.ticketVal} style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                          ₹{confirmedBooking.balanceDue ?? Math.max(0, confirmedBooking.totalPrice - (confirmedBooking.advancePaid ?? 500))}
                        </div>
                      </div>
                    </div>

                    {confirmedBooking.utrNumber && (
                      <div style={{ background: 'rgba(242, 169, 0, 0.08)', border: '1px solid rgba(242, 169, 0, 0.25)', borderRadius: '6px', padding: '8px 12px', margin: '6px 0', textAlign: 'left' }}>
                        <span className={styles.ticketLabel} style={{ color: '#f2a900' }}>🧾 UPI TRANSACTION UTR</span>
                        <div className={styles.ticketVal} style={{ color: '#ffffff', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                          {confirmedBooking.utrNumber}
                        </div>
                      </div>
                    )}

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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
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

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                <a
                  href={`/receipt?id=${confirmedBooking.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#a855f7',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <FileText size={18} />
                  View Advance Receipt
                </a>
                <a
                  href={getAdminWhatsAppDeepLink('booking', confirmedBooking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#25D366',
                    color: '#ffffff',
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>💬</span>
                  Notify Admin on WhatsApp (+91 9900106474)
                </a>
                <button
                  className="btn btn-secondary"
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
              </div>

              <button
                className="btn btn-secondary"
                style={{ marginTop: '24px', opacity: 0.7, fontSize: '0.9rem', padding: '8px 16px' }}
                onClick={() => {
                  setStep(1);
                  setSelectedSlot(null);
                  setFogOption('none');
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
                  {step === 1 ? 'Continue to Date & Slot →' : step === 2 ? 'Continue to Add-ons →' : 'Continue to Review & Pay →'}
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
                    `Confirm Booking (₹${calculateAdvance()} Advance Paid) ✓`
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
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>You haven&apos;t made any theater room bookings with this verified phone number yet.</p>
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
                        href={getAdminWhatsAppDeepLink('booking', b)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.orderActionBtn}
                        style={{ color: '#25D366', fontWeight: 700 }}
                      >
                        💬 Notify via WhatsApp
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
