'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Shield,
  CreditCard,
  QrCode,
  Copy,
  CheckCircle2,
  Phone,
  Mail,
  User,
  MessageSquare,
  Printer,
  Share2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  OCCASIONS,
  ROOMS,
  ADD_ONS,
  OccasionType,
  RoomExperience,
  AddOnItem,
  TimeSlotOption,
} from '@/types/booking';
import styles from './BookingFlowModal.module.css';

interface BookingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  initialOccasion?: OccasionType | '';
  initialDate?: string;
  initialGuests?: number;
}

function parseSlotStartMinutes(slotTimeStr: string): number {
  const match = slotTimeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
}

const DEFAULT_SLOTS: TimeSlotOption[] = [
  { id: 'slot-1', time: '10:00 AM - 12:00 PM', label: 'Morning Show', basePrice: 999 },
  { id: 'slot-2', time: '12:30 PM - 02:30 PM', label: 'Matinee Show', basePrice: 999 },
  { id: 'slot-3', time: '03:00 PM - 05:00 PM', label: 'Afternoon Vibe', basePrice: 999 },
  { id: 'slot-4', time: '05:30 PM - 07:30 PM', label: 'Sunset Vibe', basePrice: 999 },
  { id: 'slot-5', time: '08:00 PM - 10:00 PM', label: 'Night Vibe', basePrice: 999 },
  { id: 'slot-6', time: '10:30 PM - 12:30 AM', label: 'Midnight Vibe', basePrice: 999 },
];

const GAMING_SLOTS: TimeSlotOption[] = [
  { id: 'g-1', time: '10:00 AM - 11:00 AM', label: 'Slot 1', basePrice: 399 },
  { id: 'g-2', time: '11:00 AM - 12:00 PM', label: 'Slot 2', basePrice: 399 },
  { id: 'g-3', time: '12:00 PM - 01:00 PM', label: 'Slot 3', basePrice: 399 },
  { id: 'g-4', time: '01:00 PM - 02:00 PM', label: 'Slot 4', basePrice: 399 },
  { id: 'g-5', time: '02:00 PM - 03:00 PM', label: 'Slot 5', basePrice: 399 },
  { id: 'g-6', time: '03:00 PM - 04:00 PM', label: 'Slot 6', basePrice: 399 },
  { id: 'g-7', time: '04:00 PM - 05:00 PM', label: 'Slot 7', basePrice: 399 },
  { id: 'g-8', time: '05:00 PM - 06:00 PM', label: 'Slot 8', basePrice: 399 },
  { id: 'g-9', time: '06:00 PM - 07:00 PM', label: 'Slot 9', basePrice: 399 },
  { id: 'g-10', time: '07:00 PM - 08:00 PM', label: 'Slot 10', basePrice: 399 },
  { id: 'g-11', time: '08:00 PM - 09:00 PM', label: 'Slot 11', basePrice: 399 },
  { id: 'g-12', time: '09:00 PM - 10:00 PM', label: 'Slot 12', basePrice: 399 },
  { id: 'g-13', time: '10:00 PM - 11:00 PM', label: 'Slot 13', basePrice: 399 },
  { id: 'g-14', time: '11:00 PM - 12:00 AM', label: 'Slot 14', basePrice: 399 },
];

export default function BookingFlowModal({
  isOpen,
  onClose,
  initialRoomId = '',
  initialOccasion = '',
  initialDate,
  initialGuests = 2,
}: BookingFlowModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Wizard Step (1: Occasion & Room, 2: Date & Slot, 3: Add-ons, 4: Details, 5: Payment, 6: Confirmation)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State - Nothing selected by default unless explicitly passed
  const [selectedOccasion, setSelectedOccasion] = useState<OccasionType | ''>(initialOccasion || '');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(initialRoomId || '');
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [guestCount, setGuestCount] = useState<number>(() => {
    const room = initialRoomId ? ROOMS.find((r) => r.id === initialRoomId) : null;
    return room ? Math.min(initialGuests, room.maxGuests) : (initialGuests || 2);
  });
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [cakeFlavor, setCakeFlavor] = useState<string>('Chocolate Truffle');
  const [ledNameText, setLedNameText] = useState<string>('');

  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment
  const [utrNumber, setUtrNumber] = useState('');
  const [isCopiedUPI, setIsCopiedUPI] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmedBookingId, setConfirmedBookingId] = useState('');

  // Coupon State
  const [couponInput, setCouponInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string>('');

  // Live Slots
  const [availableSlots, setAvailableSlots] = useState<TimeSlotOption[]>(DEFAULT_SLOTS);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Mobile Bill Drawer state
  const [isMobileBillOpen, setIsMobileBillOpen] = useState(false);

  // Update selection if props change when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedRoomId(initialRoomId || '');
      setSelectedOccasion(initialOccasion || '');
      if (initialDate) setSelectedDate(initialDate);
      if (initialGuests) {
        const room = ROOMS.find((r) => r.id === initialRoomId);
        setGuestCount(room ? Math.min(initialGuests, room.maxGuests) : initialGuests);
      }
    }
  }, [isOpen, initialRoomId, initialOccasion, initialDate, initialGuests]);

  // Find active room object (null if no room selected yet)
  const activeRoom = useMemo(() => {
    return selectedRoomId ? ROOMS.find((r) => r.id === selectedRoomId) || null : null;
  }, [selectedRoomId]);

  // When room changes, clamp guest count to room's max
  useEffect(() => {
    if (activeRoom && guestCount > activeRoom.maxGuests) {
      setGuestCount(activeRoom.maxGuests);
    }
  }, [activeRoom, guestCount]);

  // Fetch slots from API when date or room type changes
  useEffect(() => {
    if (!activeRoom) return;
    let isCancelled = false;
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const isGaming = activeRoom.occasion === 'gaming';
        const typeParam = isGaming ? 'gaming' : 'theater';
        const res = await fetch(`/api/slots?date=${selectedDate}&type=${typeParam}&roomId=${encodeURIComponent(activeRoom.id)}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.slots && Array.isArray(data.slots)) {
            setAvailableSlots(data.slots);
            return;
          }
        }
      } catch {
        // Fallback to local default slots
      }
      if (!isCancelled) {
        setAvailableSlots(activeRoom.occasion === 'gaming' ? GAMING_SLOTS : DEFAULT_SLOTS);
      }
      setIsLoadingSlots(false);
    };

    fetchSlots();
    return () => {
      isCancelled = true;
    };
  }, [selectedDate, activeRoom]);

  // Visible slots filtered by past time for today, sorted chronologically from morning to night
  const visibleSlots = useMemo(() => {
    const todayIST = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    const isToday = selectedDate === todayIST;

    const istParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    }).formatToParts(new Date());
    const currentHour = parseInt(istParts.find((p) => p.type === 'hour')?.value || '0', 10);
    const currentMin = parseInt(istParts.find((p) => p.type === 'minute')?.value || '0', 10);
    const currentMinutes = currentHour * 60 + currentMin;

    // Sort chronologically from morning to night
    const sorted = [...availableSlots].sort((a, b) => {
      return parseSlotStartMinutes(a.time) - parseSlotStartMinutes(b.time);
    });

    if (!isToday) return sorted;

    // Filter out slots that have already started or passed
    return sorted.filter((s) => parseSlotStartMinutes(s.time) > currentMinutes);
  }, [availableSlots, selectedDate]);

  // If selected slot is no longer in visible eligible slots, reset it
  useEffect(() => {
    if (selectedSlot && !visibleSlots.some((s) => s.time === selectedSlot && !s.isBooked)) {
      setSelectedSlot('');
    }
  }, [visibleSlots, selectedSlot]);

  // Price Calculations
  const pricing = useMemo(() => {
    if (!activeRoom) {
      return {
        baseRoomPrice: 0,
        effectiveRoomPrice: 0,
        extraGuests: 0,
        extraGuestCost: 0,
        addonsCost: 0,
        regularAddonsCost: 0,
        subtotal: 0,
        discount: 0,
        roomDiscount: 0,
        freeAddonsDiscount: 0,
        total: 0,
        advance: 500,
        remaining: 0,
        isCouponValid: false,
      };
    }
    const isCelebrationTheme = activeRoom.occasion !== 'gaming';
    const isCouponValid = (appliedCoupon === 'BEEVIBE999' || appliedCoupon === 'VIBE999') && isCelebrationTheme;

    const baseRoomPrice = activeRoom.price;
    const effectiveRoomPrice = isCouponValid ? 999 : baseRoomPrice;
    const roomDiscount = isCouponValid ? Math.max(0, baseRoomPrice - 999) : 0;

    const extraGuests = Math.max(0, guestCount - activeRoom.includedGuests);
    const extraGuestCost = extraGuests * activeRoom.extraGuestPrice;

    // Track free waived add-ons with coupon: Fog Entry (199), LED Name Board (149), Rose Petal Table Decor (499)
    let regularAddonsCost = 0;
    let effectiveAddonsCost = 0;
    let freeAddonsDiscount = 0;

    selectedAddOns.forEach((addId) => {
      const item = ADD_ONS.find((a) => a.id === addId);
      if (!item) return;
      regularAddonsCost += item.price;

      const isWaivedByCoupon = isCouponValid && (addId === 'addon-fog' || addId === 'addon-led' || addId === 'addon-decor');

      if (isWaivedByCoupon) {
        freeAddonsDiscount += item.price;
      } else {
        effectiveAddonsCost += item.price;
      }
    });

    const subtotal = baseRoomPrice + extraGuestCost + regularAddonsCost;
    const totalDiscount = roomDiscount + freeAddonsDiscount;
    const total = Math.max(500, effectiveRoomPrice + extraGuestCost + effectiveAddonsCost);
    const advance = 500; // Transparent fixed booking deposit
    const remaining = Math.max(0, total - advance);

    return {
      baseRoomPrice,
      effectiveRoomPrice,
      extraGuests,
      extraGuestCost,
      addonsCost: effectiveAddonsCost,
      regularAddonsCost,
      subtotal,
      discount: totalDiscount,
      roomDiscount,
      freeAddonsDiscount,
      total,
      advance,
      remaining,
      isCouponValid,
    };
  }, [activeRoom, guestCount, selectedAddOns, appliedCoupon]);

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
      // Auto-include the 3 promotional add-ons (Fog entry, LED name board, Table decor with rose petals)
      setSelectedAddOns((prev) => Array.from(new Set([...prev, 'addon-fog', 'addon-led', 'addon-decor'])));
    } else {
      setCouponError('Invalid coupon code. Try "BEEVIBE999"');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  if (!isOpen) return null;

  // Toggle add-on checkbox
  const toggleAddOn = (addonId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId]
    );
  };

  // Copy UPI Id
  const handleCopyUPI = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('9900106474@okbizaxis');
      setIsCopiedUPI(true);
      setTimeout(() => setIsCopiedUPI(false), 2000);
    }
  };

  // Final submit handler connected to /api/bookings
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom) {
      setSubmitError('Please select a private suite to complete your booking.');
      return;
    }
    if (!utrNumber.trim()) {
      setSubmitError('Please enter your 12-digit UPI Transaction ID / UTR.');
      return;
    }
    if (utrNumber.trim().length < 6) {
      setSubmitError('Please enter a valid Transaction / UTR number.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const addonsPayload = selectedAddOns.map((id) => {
        const item = ADD_ONS.find((a) => a.id === id);
        return item ? item.name : id;
      });
      if (selectedAddOns.includes('addon-led') && ledNameText.trim()) {
        addonsPayload.push(`LED Board Name: "${ledNameText.trim()}"`);
      }
      if (selectedAddOns.includes('addon-cake') && cakeFlavor) {
        addonsPayload.push(`Cake Flavor: ${cakeFlavor}`);
      }

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: customerPhone.trim(),
          email: customerEmail.trim() || `${customerPhone.trim()}@beevibe.guest`,
          date: selectedDate,
          timeSlot: selectedSlot || availableSlots[0]?.time || '10:00 AM - 12:00 PM',
          packageName: `${activeRoom.name} (${activeRoom.occasionLabel})`,
          roomId: activeRoom.id,
          theme: activeRoom.id,
          bookingType: activeRoom.occasion === 'gaming' ? 'gaming' : 'theater',
          addOns: addonsPayload,
          totalPrice: pricing.total,
          guestCount: guestCount,
          specialRequests: specialRequests.trim(),
          utrNumber: utrNumber.trim(),
          couponCode: appliedCoupon || undefined,
          discountAmount: pricing.discount > 0 ? pricing.discount : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit booking.');
      }

      const newId = data.bookingId || data.id || `BV-${Math.floor(100000 + Math.random() * 900000)}`;
      setConfirmedBookingId(newId);
      setCurrentStep(6); // Step 6: Confirmation Pass
    } catch (err: any) {
      setSubmitError(err.message || 'An error occurred while confirming booking. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Validation Helpers
  const canGoToStep2 = !!activeRoom;
  const canGoToStep3 = !!selectedSlot;
  const canGoToStep4 = true;
  const canGoToStep5 = !!(customerName.trim() && customerPhone.trim().length >= 10);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header Bar */}
        <div className={styles.modalHeader}>
          <div className={styles.brandTitle}>
            <span className={styles.brandName}>BEEVIBE</span>
            <span className={styles.brandTag}>Private Celebration Theatre</span>
          </div>

          {/* Progress Indicator (Steps 1 to 5) */}
          {currentStep < 6 && (
            <div className={styles.stepper}>
              {[
                { num: 1, label: 'Experience' },
                { num: 2, label: 'Date & Time' },
                { num: 3, label: 'Add-ons' },
                { num: 4, label: 'Details' },
                { num: 5, label: 'Payment' },
              ].map((s) => (
                <div
                  key={s.num}
                  className={`${styles.stepPill} ${currentStep === s.num ? styles.stepActive : ''} ${
                    currentStep > s.num ? styles.stepCompleted : ''
                  }`}
                  onClick={() => {
                    // Allow navigating back to completed steps
                    if (s.num < currentStep) setCurrentStep(s.num);
                  }}
                >
                  <span className={styles.stepNum}>
                    {currentStep > s.num ? '✓' : `0${s.num}`}
                  </span>
                  <span className={styles.stepLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className={styles.headerRightGroup}>
            <a
              href="tel:+919900106474"
              className={styles.modalCallHeader}
              title="Call"
            >
              <Phone size={13} />
              <span>Call</span>
            </a>

            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close booking">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Layout: Split into Step Content + Sticky Live Summary */}
        <div className={styles.modalBody}>
          <div className={styles.contentColumn}>
            {/* ══════════════════════════════════════════════════
                MOBILE LIVE BILL & DEPOSIT ACCORDION (STEPS 1-4)
                ══════════════════════════════════════════════════ */}
            {currentStep < 5 && (
              <div className={styles.mobileBillBar}>
                <div className={styles.mobileBillHeaderRow}>
                  <div className={styles.mobileBillInfo}>
                    <Receipt size={15} className={styles.mobileBillIcon} />
                    <span className={styles.mobileBillTotal}>Total Bill: <strong>{activeRoom ? `₹${pricing.total}` : '—'}</strong></span>
                    <span className={styles.mobileBillDivider}>•</span>
                    <span className={styles.mobileBillDeposit}>Advance Deposit: <strong>{activeRoom ? `₹${pricing.advance}` : '₹500'}</strong></span>
                  </div>
                  <button
                    type="button"
                    className={styles.mobileBillToggleBtn}
                    onClick={() => setIsMobileBillOpen(!isMobileBillOpen)}
                    aria-label="Toggle bill breakdown"
                  >
                    <span>{isMobileBillOpen ? 'Hide Bill' : 'View Bill'}</span>
                    {isMobileBillOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {isMobileBillOpen && (
                  <div className={styles.mobileBillDrawer}>
                    {activeRoom ? (
                      <>
                        <div className={styles.mobileBillRoom}>
                          <div>
                            <strong>{activeRoom.name} ({activeRoom.duration})</strong>
                            <span className={styles.mobileBillDate}>{selectedDate} {selectedSlot ? `• ${selectedSlot}` : ''} • {guestCount} Guests</span>
                          </div>
                          <span className={styles.mobileBillRoomPrice}>₹{pricing.baseRoomPrice}</span>
                        </div>

                        {pricing.roomDiscount > 0 && (
                          <div className={styles.mobileBillDiscount}>
                            <span>🎟️ Offer Savings ({appliedCoupon})</span>
                            <strong>-₹{pricing.roomDiscount}</strong>
                          </div>
                        )}

                        {pricing.extraGuests > 0 && (
                          <div className={styles.mobileBillRowItem}>
                            <span>Extra Guests ({pricing.extraGuests} × ₹{activeRoom.extraGuestPrice})</span>
                            <strong>+₹{pricing.extraGuestCost}</strong>
                          </div>
                        )}

                        {selectedAddOns.map((id) => {
                          const item = ADD_ONS.find((a) => a.id === id);
                          if (!item) return null;
                          const isWaived = pricing.isCouponValid && (id === 'addon-fog' || id === 'addon-led' || id === 'addon-decor');
                          return (
                            <div key={id} className={styles.mobileBillRowItem}>
                              <span>{item.icon} {item.name}</span>
                              <strong className={isWaived ? styles.billFreeTag : ''}>
                                {isWaived ? `FREE (-₹${item.price})` : `+₹${item.price}`}
                              </strong>
                            </div>
                          );
                        })}

                        <div className={styles.mobileBillRowItem} style={{ color: '#2563EB', fontSize: '0.74rem' }}>
                          <span>📺 All OTT Platforms (Netflix, Prime, Hotstar)</span>
                          <strong className={styles.billFreeTag}>INCLUDED</strong>
                        </div>

                        <div className={styles.mobileBillTotalsRow}>
                          <div className={styles.mobileBillTotalBox}>
                            <span>Total Bill</span>
                            <strong>₹{pricing.total}</strong>
                          </div>
                          <div className={styles.mobileBillDepositBox}>
                            <span>Advance Deposit (Pay Now)</span>
                            <strong style={{ color: '#10B981' }}>₹{pricing.advance}</strong>
                          </div>
                          <div className={styles.mobileBillBalanceBox}>
                            <span>Balance at Check-in</span>
                            <strong>₹{pricing.remaining}</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ padding: '12px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                        Please select an occasion and private suite in Step 1 to calculate your bill.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 1: CHOOSE OCCASION & ROOM
                ══════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <div className={styles.stepContainer}>
                <div className={styles.stepHeader}>
                  <h3 className={styles.stepTitle}>Select Your Occasion &amp; Room</h3>
                  <p className={styles.stepDesc}>
                    Choose the celebration mood you are planning in Jayanagar 9th Block
                  </p>
                </div>

                {/* Occasion Selection Chips */}
                <div className={styles.occasionGrid}>
                  {OCCASIONS.map((occ) => {
                    const isSelected = selectedOccasion === occ.id;
                    return (
                      <button
                        key={occ.id}
                        type="button"
                        className={`${styles.occCard} ${isSelected ? styles.occSelected : ''}`}
                        onClick={() => {
                          if (selectedOccasion === occ.id) {
                            setSelectedOccasion('');
                          } else {
                            setSelectedOccasion(occ.id);
                          }
                        }}
                      >
                        <span className={styles.occIcon}>{occ.icon}</span>
                        <div className={styles.occText}>
                          <strong>{occ.label}</strong>
                          <span>{occ.tagline}</span>
                        </div>
                        {isSelected && <Check size={16} className={styles.occCheck} />}
                      </button>
                    );
                  })}
                </div>

                {/* Available Rooms for Selected Occasion */}
                <div className={styles.roomsPicker}>
                  <div className={styles.subSectionTitle}>
                    <span>Select Private Suite</span>
                    {selectedOccasion && (
                      <button
                        type="button"
                        className={styles.clearFilterBtn}
                        onClick={() => setSelectedOccasion('')}
                      >
                        Show All Suites
                      </button>
                    )}
                  </div>
                  <div className={styles.roomsGrid}>
                    {ROOMS.filter((room) => !selectedOccasion || room.occasion === selectedOccasion).map((room) => {
                      const isSelected = selectedRoomId === room.id;
                      return (
                        <div
                          key={room.id}
                          className={`${styles.roomSelectCard} ${isSelected ? styles.roomSelected : ''}`}
                          onClick={() => {
                            setSelectedRoomId(room.id);
                            setSelectedOccasion(room.occasion);
                          }}
                        >
                          <div className={styles.roomSelectImgWrap}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={room.image} alt={room.name} className={styles.roomSelectImg} />
                            {isSelected ? (
                              <span className={styles.selectedBadge}>SELECTED ✓</span>
                            ) : (
                              <span className={styles.tapToSelectBadge}>TAP TO SELECT</span>
                            )}
                          </div>
                          <div className={styles.roomSelectBody}>
                            <div className={styles.roomSelectTop}>
                              <strong className={styles.roomSelectName}>{room.name}</strong>
                              <span className={styles.roomSelectPrice}>₹{room.price}</span>
                            </div>
                            <span className={styles.roomSelectTheme}>{room.theme}</span>
                            {room.occasion !== 'gaming' && (
                              <div className={styles.roomCouponOfferTag}>
                                🎟️ Flat ₹999 with Coupon BEEVIBE999
                              </div>
                            )}
                            <div className={styles.roomSelectMeta}>
                              <span><Users size={12} /> {room.capacity}</span>
                              <span><Clock size={12} /> {room.duration}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className={styles.navRow}>
                  <div />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!activeRoom}
                    onClick={() => setCurrentStep(2)}
                  >
                    <span>{activeRoom ? 'NEXT: DATE & TIME' : 'PLEASE SELECT A SUITE TO CONTINUE'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 2: DATE & TIME SLOTS
                ══════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <div className={styles.stepContainer}>
                <div className={styles.stepHeader}>
                  <h3 className={styles.stepTitle}>Choose Date &amp; Available Time Slot</h3>
                  <p className={styles.stepDesc}>
                    Live availability for {activeRoom?.name || 'Private Suite'} in Jayanagar 9th Block
                  </p>
                </div>

                {/* Date Input Box */}
                <div className={styles.datePickerCard}>
                  <label htmlFor="slot-date-input" className={styles.inputLabel}>
                    <Calendar size={16} /> Select Celebration Date:
                  </label>
                  <input
                    id="slot-date-input"
                    type="date"
                    min={todayStr}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedSlot('');
                    }}
                    className={styles.dateField}
                  />
                </div>

                {/* Guest Counter */}
                <div className={styles.guestCounterCard}>
                  <div className={styles.guestCounterInfo}>
                    <strong>Number of Guests</strong>
                    <span>
                      2 guests included with room. ₹{activeRoom?.extraGuestPrice || 199}/extra guest (Max {activeRoom?.maxGuests || 6} in this suite).
                    </span>
                  </div>
                  <div className={styles.counterControls}>
                    <button
                      type="button"
                      className={styles.counterBtn}
                      disabled={guestCount <= 1}
                      onClick={() => setGuestCount((c) => Math.max(1, c - 1))}
                    >
                      -
                    </button>
                    <span className={styles.counterNum}>{guestCount}</span>
                    <button
                      type="button"
                      className={styles.counterBtn}
                      disabled={guestCount >= (activeRoom?.maxGuests || 6)}
                      onClick={() => setGuestCount((c) => Math.min(activeRoom?.maxGuests || 6, c + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div className={styles.slotsSection}>
                  <div className={styles.slotsHeader}>
                    <div className={styles.slotsHeaderTitle}>
                      <span>Available Slots:</span>{' '}
                      <strong className={styles.slotsHeaderDate}>{selectedDate}</strong>
                    </div>
                    {isLoadingSlots && <span className={styles.loadingSlots}>Checking live slots...</span>}
                  </div>

                  {visibleSlots.length === 0 ? (
                    <div className={styles.noSlotsNotice}>
                      <Clock size={22} className={styles.noSlotsIcon} />
                      <div className={styles.noSlotsText}>
                        <strong>All slots for today have concluded</strong>
                        <p>Please choose tomorrow or an upcoming date to reserve your private theatre.</p>
                      </div>
                      <button
                        type="button"
                        className={styles.nextDayBtn}
                        onClick={() => {
                          const nextDay = new Date();
                          nextDay.setDate(nextDay.getDate() + 1);
                          const yyyy = nextDay.getFullYear();
                          const mm = String(nextDay.getMonth() + 1).padStart(2, '0');
                          const dd = String(nextDay.getDate()).padStart(2, '0');
                          setSelectedDate(`${yyyy}-${mm}-${dd}`);
                        }}
                      >
                        Switch to Tomorrow
                      </button>
                    </div>
                  ) : (
                    <div className={styles.slotsGrid}>
                      {visibleSlots.map((slot) => {
                        const isSelected = selectedSlot === slot.time;
                        const isBooked = slot.isBooked;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isBooked}
                            className={`${styles.slotCard} ${isSelected ? styles.slotSelected : ''} ${
                              isBooked ? styles.slotBooked : ''
                            }`}
                            onClick={() => setSelectedSlot(slot.time)}
                          >
                            <div className={styles.slotTime}>{slot.time.replace('-', '–')}</div>
                            <div className={styles.slotLabel}>
                              {isBooked ? '❌ Booked' : slot.label || 'Available'}
                            </div>
                            {isSelected && <Check size={14} className={styles.slotCheck} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Option to Call Notice */}
                <div className={styles.stepCallHelp}>
                  <Phone size={14} />
                  <span>
                    Need a custom timing or prefer booking over phone? <a href="tel:+919900106474">Call</a>
                  </span>
                </div>

                {/* Step 2 Actions */}
                <div className={styles.navRow}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!selectedSlot}
                    onClick={() => setCurrentStep(3)}
                  >
                    <span>NEXT: CUSTOMIZE ADD-ONS</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 3: ADD-ONS (CAKE, FOG, LED BOARD, SNACKS)
                ══════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <div className={styles.stepContainer}>
                <div className={styles.stepHeader}>
                  <h3 className={styles.stepTitle}>Customize Celebration Add-Ons</h3>
                  <p className={styles.stepDesc}>
                    Make it unforgettable with custom cakes, cold fog entry, and LED name boards
                  </p>
                </div>

                {/* Step 3 Coupon Notice Banner */}
                {pricing.isCouponValid ? (
                  <div className={styles.couponNoticeActive}>
                    <div className={styles.couponNoticeActiveLeft}>
                      <CheckCircle2 size={18} className={styles.couponSuccessIcon} />
                      <div className={styles.couponSuccessText}>
                        <div className={styles.couponSuccessTitle}>
                          🎟️ Coupon <strong>{appliedCoupon}</strong> Applied!
                        </div>
                        <div className={styles.couponSuccessDesc}>
                          Theme is <strong>₹999</strong> • Fog Entry, LED Name Board &amp; Rose Petal Table Decor are <strong>FREE (₹0)</strong>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.couponRemoveBtn}
                      onClick={handleRemoveCoupon}
                      title="Remove coupon code"
                    >
                      <X size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                ) : activeRoom?.occasion !== 'gaming' ? (
                  <div className={styles.couponNoticePrompt}>
                    <div className={styles.couponNoticePromptLeft}>
                      <Sparkles size={16} />
                      <span>
                        Apply coupon <strong>BEEVIBE999</strong> for <strong>₹999 Flat Theme</strong> + Free Fog Entry, LED Name Board &amp; Rose Petal Table Decor!
                      </span>
                    </div>
                    <button
                      type="button"
                      className={styles.couponInlineApplyBtn}
                      onClick={() => handleApplyCoupon('BEEVIBE999')}
                    >
                      Apply BEEVIBE999
                    </button>
                  </div>
                ) : null}

                <div className={styles.addonsGrid}>
                  {ADD_ONS.map((addon) => {
                    const isChecked = selectedAddOns.includes(addon.id);
                    const isWaivedByCoupon = pricing.isCouponValid && (addon.id === 'addon-fog' || addon.id === 'addon-led' || addon.id === 'addon-decor');

                    return (
                      <div
                        key={addon.id}
                        className={`${styles.addonCard} ${isChecked ? styles.addonSelected : ''}`}
                        onClick={() => toggleAddOn(addon.id)}
                      >
                        <div className={styles.addonCheckCircle}>
                          {isChecked && <Check size={14} />}
                        </div>
                        <span className={styles.addonCardIcon}>{addon.icon}</span>
                        <div className={styles.addonCardInfo}>
                          <div className={styles.addonCardTitleRow}>
                            <strong>{addon.name}</strong>
                            {isWaivedByCoupon ? (
                              <span className={styles.addonCardFreeTag}>FREE with Coupon (Was ₹{addon.price})</span>
                            ) : (
                              <span className={styles.addonCardPrice}>+₹{addon.price}</span>
                            )}
                          </div>
                          <p className={styles.addonCardDesc}>{addon.description}</p>

                          {/* Extra Inputs if Selected */}
                          {isChecked && addon.id === 'addon-led' && (
                            <div className={styles.addonInputRow} onClick={(e) => e.stopPropagation()}>
                              <label className={styles.addonSubLabel}>Name to spell on LED Board:</label>
                              <input
                                type="text"
                                placeholder="e.g. SNEHA / RAHUL / HAPPY 25TH"
                                value={ledNameText}
                                onChange={(e) => setLedNameText(e.target.value.toUpperCase())}
                                className={styles.addonTextInput}
                                maxLength={24}
                              />
                            </div>
                          )}

                          {isChecked && addon.id === 'addon-cake' && (
                            <div className={styles.addonInputRow} onClick={(e) => e.stopPropagation()}>
                              <label className={styles.addonSubLabel}>Select Cake Flavor:</label>
                              <select
                                value={cakeFlavor}
                                onChange={(e) => setCakeFlavor(e.target.value)}
                                className={styles.addonSelectInput}
                              >
                                <option value="Chocolate Truffle">Chocolate Truffle</option>
                                <option value="Red Velvet">Red Velvet</option>
                                <option value="Butterscotch">Butterscotch</option>
                                <option value="Black Forest">Black Forest</option>
                                <option value="Pineapple Fresh Cream">Pineapple Fresh Cream</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step 3 Actions */}
                <div className={styles.navRow}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setCurrentStep(4)}
                  >
                    <span>NEXT: GUEST DETAILS</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 4: CUSTOMER DETAILS
                ══════════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <div className={styles.stepContainer}>
                <div className={styles.stepHeader}>
                  <h3 className={styles.stepTitle}>Enter Contact Information</h3>
                  <p className={styles.stepDesc}>
                    Your instant digital pass and WhatsApp confirmation will be sent here
                  </p>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <User size={15} /> Your Full Name *
                    </label>
                    <input
                      type="text"
                      className={styles.formInput}
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>
                      <Phone size={15} /> WhatsApp Mobile Number *
                    </label>
                    <div className={styles.phoneInputWrap}>
                      <span className={styles.phonePrefix}>+91</span>
                      <input
                        type="tel"
                        className={styles.phoneInput}
                        placeholder="98765 43210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup + ' ' + styles.formFull}>
                    <label className={styles.formLabel}>
                      <Mail size={15} /> Email Address (for Ticket Invoice)
                    </label>
                    <input
                      type="email"
                      className={styles.formInput}
                      placeholder="rahul@gmail.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup + ' ' + styles.formFull}>
                    <label className={styles.formLabel}>
                      <MessageSquare size={15} /> Special Occasion Requests / Surprise Notes
                    </label>
                    <textarea
                      rows={2}
                      className={styles.formTextarea}
                      placeholder="e.g. Please play our custom birthday video on entry, birthday girl loves purple, etc."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                    />
                  </div>
                </div>

                {/* Step 4 Actions */}
                <div className={styles.navRow}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(3)}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canGoToStep5}
                    onClick={() => setCurrentStep(5)}
                  >
                    <span>NEXT: ADVANCE PAYMENT</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 5: ADVANCE PAYMENT (UPI & CONFIRMATION)
                ══════════════════════════════════════════════════ */}
            {currentStep === 5 && (
              <form onSubmit={handleConfirmBooking} className={styles.stepContainer}>
                <div className={styles.stepHeader}>
                  <h3 className={styles.stepTitle}>Pay ₹{pricing.advance} Advance Deposit</h3>
                  <p className={styles.stepDesc}>
                    Lock your date and slot. Remaining balance of ₹{pricing.remaining} is paid at check-in.
                  </p>
                </div>

                {/* Coupon Code Section */}
                <div className={styles.couponCard}>
                  <div className={styles.couponCardHeader}>
                    <Sparkles size={16} className={styles.couponIcon} />
                    <span>Have a Promotional Coupon Code?</span>
                  </div>

                  {appliedCoupon ? (
                    <div className={styles.appliedCouponRow}>
                      <div className={styles.appliedBadgeWrap}>
                        <span className={styles.appliedCode}>🎟️ {appliedCoupon}</span>
                        <span className={styles.appliedStatusBadge}>APPLIED</span>
                      </div>
                      <span className={styles.discountSavedText}>You saved ₹{pricing.discount}! (Flat ₹999 Theme + Free Fog, LED Board &amp; Rose Petal Decor)</span>
                      <button
                        type="button"
                        className={styles.removeCouponBtn}
                        onClick={handleRemoveCoupon}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className={styles.couponInputGroup}>
                        <input
                          type="text"
                          className={styles.couponInput}
                          placeholder="Enter coupon code (e.g. BEEVIBE999)"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError('');
                          }}
                        />
                        <button
                          type="button"
                          className={styles.applyCouponBtn}
                          onClick={() => handleApplyCoupon()}
                        >
                          APPLY
                        </button>
                      </div>
                      {couponError && <span className={styles.couponErrorText}>{couponError}</span>}
                      <button
                        type="button"
                        className={styles.quickCouponChip}
                        onClick={() => handleApplyCoupon('BEEVIBE999')}
                      >
                        💡 Tap to apply <strong>BEEVIBE999</strong>: Any Theme for flat ₹999 + Free Fog Entry, LED Name Board, Rose Petals Table Decor &amp; All OTT Platforms!
                      </button>
                    </div>
                  )}
                </div>

                {/* ══════════════════════════════════════════════════
                    OFFICIAL BOOKING BILL & DEPOSIT BREAKDOWN (STEP 5)
                    ══════════════════════════════════════════════════ */}
                <div className={styles.billCard}>
                  <div className={styles.billCardHeader}>
                    <div className={styles.billCardTitle}>
                      <Receipt size={17} className={styles.billIcon} />
                      <h4>Official Booking Bill &amp; Deposit Breakdown</h4>
                    </div>
                    <span className={styles.billBadge}>Transparent Pricing</span>
                  </div>

                  <div className={styles.billRoomSummaryRow}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeRoom?.image || ''} alt={activeRoom?.name || 'Private Suite'} className={styles.billRoomThumb} />
                    <div className={styles.billRoomMeta}>
                      <strong>{activeRoom?.name || 'Private Suite'}</strong>
                      <span className={styles.billRoomSession}>{activeRoom?.duration || '2 Hours'} Session • Up to {activeRoom?.maxGuests || 6} Guests • 180&quot; 4K Cinema</span>
                      <span className={styles.billRoomDateSlot}>📅 {selectedDate} • ⏰ {selectedSlot || 'Selected Slot'}</span>
                    </div>
                    <div className={styles.billRoomBase}>
                      <span className={styles.billBaseLabel}>Suite Base</span>
                      <strong>₹{pricing.baseRoomPrice}</strong>
                    </div>
                  </div>

                  <div className={styles.billLineItems}>
                    {pricing.roomDiscount > 0 && (
                      <div className={`${styles.billLineItem} ${styles.billLineDiscount}`}>
                        <span>🎟️ Promotional Discount ({appliedCoupon})</span>
                        <strong>-₹{pricing.roomDiscount}</strong>
                      </div>
                    )}

                    {pricing.extraGuests > 0 && activeRoom && (
                      <div className={styles.billLineItem}>
                        <span>Extra Guests ({pricing.extraGuests} × ₹{activeRoom.extraGuestPrice})</span>
                        <strong>+₹{pricing.extraGuestCost}</strong>
                      </div>
                    )}

                    {selectedAddOns.map((id) => {
                      const item = ADD_ONS.find((a) => a.id === id);
                      if (!item) return null;
                      const isWaived = pricing.isCouponValid && (id === 'addon-fog' || id === 'addon-led' || id === 'addon-decor');
                      return (
                        <div key={id} className={styles.billLineItem}>
                          <span>{item.icon} {item.name}</span>
                          <strong className={isWaived ? styles.billFreeTag : ''}>
                            {isWaived ? `FREE (-₹${item.price})` : `+₹${item.price}`}
                          </strong>
                        </div>
                      );
                    })}

                    <div className={`${styles.billLineItem} ${styles.billLineOtt}`}>
                      <span>📺 All OTT Platforms (Netflix, Prime, Hotstar, YouTube)</span>
                      <strong className={styles.billFreeTag}>INCLUDED</strong>
                    </div>
                  </div>

                  {/* 3-Box Clear Split */}
                  <div className={styles.billFinancialGrid}>
                    <div className={styles.billFinanceBox}>
                      <span className={styles.billFinanceLabel}>TOTAL BILL</span>
                      <strong className={styles.billFinanceAmount}>₹{pricing.total}</strong>
                      <span className={styles.billFinanceNote}>Total cost of experience</span>
                    </div>

                    <div className={`${styles.billFinanceBox} ${styles.billDepositBox}`}>
                      <div className={styles.depositPill}>DUE NOW VIA UPI</div>
                      <span className={styles.billDepositLabel}>Advance Deposit</span>
                      <strong className={styles.billDepositAmount}>₹{pricing.advance}</strong>
                      <span className={styles.billDepositNote}>Locks your slot instantly</span>
                    </div>

                    <div className={`${styles.billFinanceBox} ${styles.billBalanceBox}`}>
                      <div className={styles.balancePill}>PAY AT VENUE</div>
                      <span className={styles.billBalanceLabel}>Remaining Balance</span>
                      <strong className={styles.billBalanceAmount}>₹{pricing.remaining}</strong>
                      <span className={styles.billBalanceNote}>Pay at check-in counter</span>
                    </div>
                  </div>

                  <div className={styles.billDepositExplanation}>
                    <Shield size={15} className={styles.billShieldIcon} />
                    <span>
                      <strong>Deposit Policy:</strong> Your ₹{pricing.advance} advance deposit is deducted directly from your Total Bill of ₹{pricing.total}. You only pay the balance ₹{pricing.remaining} when you arrive at BeeVibe theatre.
                    </span>
                  </div>
                </div>

                <div className={styles.paymentConsole}>
                  {/* QR Code and UPI ID */}
                  <div className={styles.qrCard}>
                    <div className={styles.qrBadge}>SCAN TO PAY ₹{pricing.advance} ADVANCE DEPOSIT</div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/beevibe-payment-qr.jpg"
                      alt="BeeVibe UPI QR Code"
                      className={styles.qrImage}
                      onError={(e) => {
                        // Fallback to placeholder qr if missing
                        (e.target as HTMLImageElement).src = '/qrcode.png';
                      }}
                    />
                    <div className={styles.upiIdRow}>
                      <span className={styles.upiIdText}>9900106474@okbizaxis</span>
                      <button
                        type="button"
                        className={styles.copyBtn}
                        onClick={handleCopyUPI}
                      >
                        {isCopiedUPI ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                        <span>{isCopiedUPI ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className={styles.upiAppsRow}>
                      <span>GPay</span> • <span>PhonePe</span> • <span>Paytm</span> • <span>BHIM</span>
                    </div>
                  </div>

                  {/* UTR Input Form */}
                  <div className={styles.utrFormCard}>
                    <div className={styles.utrStepHeader}>
                      <div className={styles.utrStepNum}>Step 2</div>
                      <strong>Enter UPI Transaction Reference (UTR)</strong>
                    </div>
                    <p className={styles.utrStepDesc}>
                      After transferring ₹{pricing.advance} via UPI, paste the 12-digit UTR or Transaction ID below to verify your booking:
                    </p>

                    <input
                      type="text"
                      className={styles.utrInput}
                      placeholder="e.g. 427812984512"
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value.trim())}
                      required
                    />

                    {submitError && (
                      <div className={styles.errorMessage}>
                        <AlertCircle size={15} />
                        <span>{submitError}</span>
                      </div>
                    )}

                    <div className={styles.trustBanner}>
                      <Shield size={16} className={styles.trustIcon} />
                      <div>
                        <strong>100% Slot Lock Guarantee</strong>
                        <span>Your time slot is instantly reserved upon reference submission.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option to Call in Step 5 */}
                <div className={styles.stepCallHelp}>
                  <Phone size={14} />
                  <span>
                    Having issues with payment or prefer to confirm directly? <a href="tel:+919900106474">Call</a>
                  </span>
                </div>

                {/* Step 5 Actions */}
                <div className={styles.navRow}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setCurrentStep(4)}
                    disabled={isSubmitting}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || !utrNumber.trim()}
                    style={{ minWidth: '220px' }}
                  >
                    {isSubmitting ? 'Confirming Booking...' : 'CONFIRM & LOCK SLOT →'}
                  </button>
                </div>
              </form>
            )}

            {/* ══════════════════════════════════════════════════
                STEP 6: BOOKING CONFIRMATION DIGITAL PASS
                ══════════════════════════════════════════════════ */}
            {currentStep === 6 && (
              <div className={styles.stepContainer}>
                <div className={styles.confirmationHero}>
                  <div className={styles.confirmedIconWrap}>
                    <CheckCircle2 size={44} className={styles.confirmedIcon} />
                  </div>
                  <h3 className={styles.confirmedTitle}>Celebration Slot Confirmed!</h3>
                  <p className={styles.confirmedSubtitle}>
                    Booking Reference: <strong>{confirmedBookingId}</strong>
                  </p>
                </div>

                {/* Digital Ticket Pass */}
                <div className={styles.ticketPass}>
                  <div className={styles.ticketHeader}>
                    <div>
                      <span className={styles.ticketBrand}>BEEVIBE THEATRE PASS</span>
                      <h4 className={styles.ticketRoomTitle}>{activeRoom?.name || 'Private Suite'}</h4>
                    </div>
                    <span className={styles.ticketStatus}>CONFIRMED</span>
                  </div>

                  <div className={styles.ticketDetailsGrid}>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>DATE</span>
                      <strong className={styles.ticketVal}>{selectedDate}</strong>
                    </div>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>TIME SLOT</span>
                      <strong className={styles.ticketVal}>{selectedSlot || '10:00 AM - 12:00 PM'}</strong>
                    </div>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>GUESTS</span>
                      <strong className={styles.ticketVal}>{guestCount} Guests</strong>
                    </div>
                    <div className={styles.ticketItem}>
                      <span className={styles.ticketLabel}>STATUS</span>
                      <strong className={styles.ticketVal} style={{ color: '#10B981' }}>
                        CONFIRMED
                      </strong>
                    </div>
                  </div>

                  {/* Financial Bill & Deposit Summary on Pass */}
                  <div className={styles.ticketFinancialRow}>
                    <div className={styles.ticketFinanceBox}>
                      <span className={styles.ticketFinanceLabel}>TOTAL BILL</span>
                      <strong className={styles.ticketFinanceVal}>₹{pricing.total}</strong>
                    </div>
                    <div className={`${styles.ticketFinanceBox} ${styles.ticketPaidBox}`}>
                      <span className={styles.ticketFinanceLabel}>ADVANCE DEPOSIT PAID</span>
                      <strong className={styles.ticketFinanceVal} style={{ color: '#10B981' }}>
                        ₹{pricing.advance} Paid ✓
                      </strong>
                    </div>
                    <div className={`${styles.ticketFinanceBox} ${styles.ticketDueBox}`}>
                      <span className={styles.ticketFinanceLabel}>BALANCE AT CHECK-IN</span>
                      <strong className={styles.ticketFinanceVal} style={{ color: '#2563EB' }}>
                        ₹{pricing.remaining}
                      </strong>
                    </div>
                  </div>

                  {selectedAddOns.length > 0 && (
                    <div className={styles.ticketAddons}>
                      <span className={styles.ticketLabel}>INCLUDED ADD-ONS:</span>
                      <div className={styles.ticketAddonsPills}>
                        {selectedAddOns.map((id) => {
                          const item = ADD_ONS.find((a) => a.id === id);
                          return (
                            <span key={id} className={styles.ticketAddonPill}>
                              {item?.icon} {item?.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className={styles.ticketVenue}>
                    <span>📍 1340, 2nd Floor, 41st Cross Rd, 4th Gate, Jayanagar 9th Block, Bengaluru</span>
                  </div>
                </div>

                {/* Post Booking Actions */}
                <div className={styles.confirmationActions}>
                  <a
                    href={`https://wa.me/919900106474?text=Hi%20Bee%20Vibe!%20I%20just%20booked%20${encodeURIComponent(
                      activeRoom?.name || 'Private Suite'
                    )}%20for%20${selectedDate}%20(${selectedSlot}).%20My%20booking%20ID%20is%20${confirmedBookingId}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ background: '#25D366', borderColor: '#25D366' }}
                  >
                    <MessageSquare size={16} /> Open WhatsApp for Directions
                  </a>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} /> Print / Save Pass
                  </button>
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={onClose}
                  >
                    Done &amp; Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════
              STICKY LIVE PRICE SUMMARY (COLUMN 2)
              ══════════════════════════════════════════════════ */}
          {currentStep < 6 && (
            <aside className={styles.summarySidebar}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <h4>Live Booking Summary</h4>
                  {activeRoom && (
                    <span className={styles.summarySuiteBadge}>{activeRoom.occasionLabel}</span>
                  )}
                </div>

                {/* Selected Room Preview or Empty Prompt */}
                {activeRoom ? (
                  <div className={styles.summaryRoomPreview}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeRoom.image} alt={activeRoom.name} className={styles.summaryRoomImg} />
                    <div>
                      <strong>{activeRoom.name}</strong>
                      <span>{selectedDate}</span>
                      <span className={styles.summarySlotTime}>{selectedSlot || 'Select slot in Step 2'}</span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.summaryEmptyCard}>
                    <Sparkles size={20} className={styles.summaryEmptyIcon} />
                    <strong>No Suite Selected</strong>
                    <p>Select your occasion and private suite in Step 1 to calculate your live bill.</p>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className={styles.breakdownList}>
                  <div className={styles.breakdownRow}>
                    <span>Experience Suite {activeRoom ? `(${activeRoom.duration})` : ''}</span>
                    <strong>{activeRoom ? `₹${pricing.baseRoomPrice}` : '—'}</strong>
                  </div>

                  {pricing.roomDiscount > 0 && (
                    <div className={styles.breakdownRow} style={{ color: '#10B981' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🎟️ Offer ({appliedCoupon})</span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#EF4444',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '0 2px',
                            textDecoration: 'underline'
                          }}
                          title="Remove coupon code"
                        >
                          ✕ Remove
                        </button>
                      </div>
                      <strong>-₹{pricing.roomDiscount}</strong>
                    </div>
                  )}

                  {activeRoom && pricing.extraGuests > 0 && (
                    <div className={styles.breakdownRow}>
                      <span>Extra Guests ({pricing.extraGuests} × ₹{activeRoom.extraGuestPrice})</span>
                      <strong>₹{pricing.extraGuestCost}</strong>
                    </div>
                  )}

                  {selectedAddOns.map((id) => {
                    const item = ADD_ONS.find((a) => a.id === id);
                    if (!item) return null;
                    const isWaived = pricing.isCouponValid && (id === 'addon-fog' || id === 'addon-led' || id === 'addon-decor');

                    return (
                      <div key={id} className={styles.breakdownRow}>
                        <span>{item.icon} {item.name}</span>
                        {isWaived ? (
                          <strong style={{ color: '#10B981' }}>FREE (-₹${item.price})</strong>
                        ) : (
                          <strong>+₹{item.price}</strong>
                        )}
                      </div>
                    );
                  })}

                  <div className={styles.breakdownRow} style={{ color: '#2563EB', fontSize: '0.74rem' }}>
                    <span>📺 All OTT Platforms (Netflix, Prime, Hotstar)</span>
                    <strong style={{ color: '#10B981' }}>INCLUDED</strong>
                  </div>
                </div>

                {/* Total & Deposit Breakdown */}
                <div className={styles.totalSection}>
                  <div className={styles.totalRow}>
                    <span>Total Experience Cost</span>
                    <span className={styles.totalAmount}>{activeRoom ? `₹${pricing.total}` : '—'}</span>
                  </div>
                  <div className={styles.depositRow}>
                    <span>Advance to Pay Now</span>
                    <span className={styles.advanceAmount}>{activeRoom ? `₹${pricing.advance}` : '₹500'}</span>
                  </div>
                  <div className={styles.balanceRow}>
                    <span>Remaining at Venue (Check-in)</span>
                    <span className={styles.remainingAmount}>{activeRoom ? `₹${pricing.remaining}` : '—'}</span>
                  </div>
                </div>

                <div className={styles.summaryGuarantee}>
                  <Shield size={14} />
                  <span>100% Private Room • Jayanagar 9th Block</span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}



