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

  // Success Confirmation State helper states (no OTP states needed)

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
    return () => { active = false; };
  }, [selectedDate, bookingMode]);

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
      if (!customerDetails.name || !customerDetails.email || !customerDetails.phone) {
        setError('Please fill in all required fields (Name, Email, and Phone).');
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

    if (!customerDetails.name.trim()) { setError('Please enter your full name.'); return; }
    if (!customerDetails.email.trim()) { setError('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerDetails.email.trim())) { setError('Please enter a valid email address.'); return; }
    if (!customerDetails.phone.trim()) { setError('Please enter your phone number.'); return; }
    if (customerDetails.guestCount < 1 || customerDetails.guestCount > 10) { setError('Guest count must be between 1 and 10.'); return; }

    setLoading(true);

    const bookingPayload = {
      customerName: customerDetails.name,
      email: customerDetails.email,
      phone: customerDetails.phone,
      date: selectedDate,
      timeSlot: selectedSlot?.time,
      packageName: selectedPackage.name,
      addOns: selectedAddons.map((id) => ADDONS.find((a) => a.id === id)?.name || id),
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
      if (!res.ok) throw new Error(data.error || 'Failed to submit booking.');

      setConfirmedBooking(data.booking);
      setStep(5);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
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
    const height = hasAddons ? 790 : 730;
    const dashedLine2Y = hasAddons ? 540 : 480;
    const barcodeY = hasAddons ? 580 : 520;
    const footerY1 = hasAddons ? 710 : 650;
    const footerY2 = hasAddons ? 730 : 670;

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
  
  <!-- Barcode Area -->
  <rect x="60" y="${barcodeY}" width="330" height="90" rx="6" fill="#ffffff"/>
  
  <!-- Mock Barcode Lines -->
  <g fill="#000000">
    <rect x="80" y="${barcodeY + 15}" width="4" height="40"/>
    <rect x="87" y="${barcodeY + 15}" width="2" height="40"/>
    <rect x="92" y="${barcodeY + 15}" width="6" height="40"/>
    <rect x="101" y="${barcodeY + 15}" width="1" height="40"/>
    <rect x="105" y="${barcodeY + 15}" width="4" height="40"/>
    <rect x="113" y="${barcodeY + 15}" width="3" height="40"/>
    <rect x="120" y="${barcodeY + 15}" width="2" height="40"/>
    <rect x="126" y="${barcodeY + 15}" width="5" height="40"/>
    <rect x="135" y="${barcodeY + 15}" width="1" height="40"/>
    <rect x="140" y="${barcodeY + 15}" width="4" height="40"/>
    <rect x="148" y="${barcodeY + 15}" width="7" height="40"/>
    <rect x="158" y="${barcodeY + 15}" width="2" height="40"/>
    <rect x="163" y="${barcodeY + 15}" width="3" height="40"/>
    <rect x="170" y="${barcodeY + 15}" width="5" height="40"/>
    <rect x="178" y="${barcodeY + 15}" width="1" height="40"/>
    <rect x="183" y="${barcodeY + 15}" width="4" height="40"/>
    
    <rect x="193" y="${barcodeY + 15}" width="6" height="40"/>
    <rect x="202" y="${barcodeY + 15}" width="2" height="40"/>
    <rect x="207" y="${barcodeY + 15}" width="4" height="40"/>
    <rect x="214" y="${barcodeY + 15}" width="1" height="40"/>
    <rect x="218" y="${barcodeY + 15}" width="5" height="40"/>
    <rect x="227" y="${barcodeY + 15}" width="3" height="40"/>
    <rect x="233" y="${barcodeY + 15}" width="2" height="40"/>
    <rect x="238" y="${barcodeY + 15}" width="6" height="40"/>
    <rect x="248" y="${barcodeY + 15}" width="1" height="40"/>
    <rect x="252" y="${barcodeY + 15}" width="4" height="40"/>
    <rect x="260" y="${barcodeY + 15}" width="7" height="40"/>
    <rect x="270" y="${barcodeY + 15}" width="2" height="40"/>
    <rect x="275" y="${barcodeY + 15}" width="3" height="40"/>
    <rect x="282" y="${barcodeY + 15}" width="5" height="40"/>
    <rect x="290" y="${barcodeY + 15}" width="1" height="40"/>
    <rect x="295" y="${barcodeY + 15}" width="4" height="40"/>
    
    <rect x="305" y="${barcodeY + 15}" width="3" height="40"/>
    <rect x="311" y="${barcodeY + 15}" width="6" height="40"/>
    <rect x="320" y="${barcodeY + 15}" width="2" height="40"/>
    <rect x="325" y="${barcodeY + 15}" width="4" height="40"/>
    <rect x="332" y="${barcodeY + 15}" width="1" height="40"/>
    <rect x="336" y="${barcodeY + 15}" width="5" height="40"/>
    <rect x="345" y="${barcodeY + 15}" width="3" height="40"/>
    <rect x="351" y="${barcodeY + 15}" width="2" height="40"/>
    <rect x="356" y="${barcodeY + 15}" width="6" height="40"/>
    <rect x="366" y="${barcodeY + 15}" width="1" height="40"/>
    <rect x="370" y="${barcodeY + 15}" width="4" height="40"/>
  </g>
  
  <text x="225" y="${barcodeY + 68}" class="font-mono" font-size="13" font-weight="700" fill="#000000" letter-spacing="3" text-anchor="middle">${id}</text>
  
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

            .barcode-box {
              background: #ffffff;
              padding: 16px;
              border-radius: 8px;
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-top: 12px;
            }

            .barcode-lines {
              width: 100%;
              height: 48px;
              background: repeating-linear-gradient(
                90deg,
                #000000,
                #000000 3px,
                #ffffff 3px,
                #ffffff 9px,
                #000000 9px,
                #000000 12px,
                #ffffff 12px,
                #ffffff 15px
              );
            }

            .barcode-text {
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

            <div class="barcode-box">
              <div class="barcode-lines"></div>
              <div class="barcode-text">${id}</div>
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
              <label className={styles.formLabel} htmlFor="customer-phone">Phone Number *</label>
              <input
                type="tel"
                id="customer-phone"
                name="phone"
                className={styles.formInput}
                placeholder="Ex. 8123501013"
                value={customerDetails.phone}
                onChange={handleInputChange}
                required
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
        </div>
      )}

      {/* STEP 5: Booking Confirmation (Ticket screen) */}
      {step === 5 && confirmedBooking && (
        <div style={{ textAlign: 'center' }}>
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

                <div className={styles.ticketBarcode}>
                  <div className={styles.barcodeLines} />
                  <div className={styles.barcodeText}>{confirmedBooking.id}</div>
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
    </div>
  );
}
