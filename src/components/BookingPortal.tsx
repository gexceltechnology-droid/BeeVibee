'use client';

import React, { useState, useEffect } from 'react';
import styles from './BookingPortal.module.css';

// Packages Constant
const PACKAGES = [
  {
    id: 'pkg-movie',
    name: 'Movie Vibe Pack',
    price: 999,
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
    price: 1999,
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
    price: 2499,
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
    price: 1499,
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
  { id: 'add-rose', name: 'Fresh Rose Bouquet', price: 499 },
  { id: 'add-nachos', name: 'Gourmet Nachos & Dip Platter', price: 349 },
  { id: 'add-cake', name: '1kg Red Velvet Designer Cake', price: 1199 },
  { id: 'add-photo', name: '30-Mins Photo Shoot & Digital Copy', price: 1499 },
  { id: 'add-balloons', name: 'Extra Premium Helium Balloons (x30)', price: 799 },
  { id: 'add-fog', name: 'Special Screen Entry Fog Effect', price: 599 },
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
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
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

  // Fetch slots on date change
  useEffect(() => {
    let active = true;

    async function fetchSlots() {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!selectedDate || !dateRegex.test(selectedDate)) {
        setSlots([]);
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

        setSlots(data.slots || []);

        if (selectedSlot) {
          const stillAvailable = data.slots?.find(
            (s: Slot) => s.time === selectedSlot.time && !s.isBooked
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
  }, [selectedDate]);

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
    if (step === 1 && !selectedSlot) {
      setError('Please select a time slot to proceed.');
      return;
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
        <div>
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
        </div>
      )}

      {/* STEP 2: Choose Celebration Theme / Package */}
      {step === 2 && (
        <div>
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
                <div className={styles.packagePrice}>+₹{pkg.price}</div>
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
        <div>
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
                    <span className={styles.addonPrice}>+₹{addon.price}</span>
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
        <div>
          <h3 style={{ marginBottom: '8px', fontFamily: 'var(--font-title)' }}>Booking details & Customer Info</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Review your booking summary and enter your contact details.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
            <h4 style={{ fontFamily: 'var(--font-title)', color: 'var(--accent)', marginBottom: '12px' }}>Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.9rem' }}>
              <div><strong>Date:</strong> {selectedDate}</div>
              <div><strong>Time Slot:</strong> {selectedSlot?.time} ({selectedSlot?.label})</div>
              <div><strong>Vibe Package:</strong> {selectedPackage.name}</div>
              <div>
                <strong>Add-ons selected:</strong>{' '}
                {selectedAddons.length > 0
                  ? selectedAddons.map((id) => ADDONS.find((a) => a.id === id)?.name).join(', ')
                  : 'None'}
              </div>
              <div style={{ gridColumn: 'span 2', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', paddingTop: '8px', fontSize: '1.1rem', color: 'var(--accent)', fontWeight: 'bold' }}>
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
                placeholder="Ex. +91 98765 43210"
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
          <h2 style={{ fontFamily: 'var(--font-title)', marginBottom: '8px' }}>Booking Successful!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
            Your celebration slot is reserved. Present this digital ticket at the entrance.
          </p>

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

          <button
            className="btn btn-secondary"
            style={{ marginTop: '20px' }}
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
