'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { EXPERIENCES, ExperiencePackage } from '@/lib/experiences';
import { Sparkles, ShieldCheck, Check, MessageCircle, Calendar, Clock, User, Phone, ArrowRight } from 'lucide-react';
import styles from './QuickBookingModal.module.css';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTheme?: 'pink' | 'purple' | 'red';
  onSwitchToFullPortal?: () => void;
}

const TIME_SLOTS = [
  '11:00 AM - 01:00 PM',
  '01:30 PM - 03:30 PM',
  '04:00 PM - 06:00 PM',
  '06:30 PM - 08:30 PM',
  '09:00 PM - 11:00 PM',
];

const OCCASIONS = [
  '🎂 Birthday',
  '❤️ Romantic Date',
  '💍 Anniversary',
  '🍿 Friends & Movie',
  '🎉 Celebration',
];

export default function QuickBookingModal({
  isOpen,
  onClose,
  initialTheme = 'purple',
  onSwitchToFullPortal,
}: QuickBookingModalProps) {
  // Find initial package
  const resolvePackage = (vibeName: string): ExperiencePackage => {
    return (
      EXPERIENCES.find((p) => p.slug.includes(vibeName)) ||
      EXPERIENCES[0]
    );
  };

  const [prevInitialTheme, setPrevInitialTheme] = useState(initialTheme);
  const [selectedTheme, setSelectedTheme] = useState<'pink' | 'purple' | 'red'>(initialTheme);

  // Sync initial theme if prop changes
  if (initialTheme !== prevInitialTheme) {
    setPrevInitialTheme(initialTheme);
    setSelectedTheme(initialTheme);
  }

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[2]); // 04:00 PM - 06:00 PM default
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentPackage = resolvePackage(selectedTheme);
  const todayStr = new Date().toISOString().split('T')[0];

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (e.g. 9900106474).');
      return;
    }

    if (!date) {
      setErrorMessage('Please select a booking date.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create reservation in backend database & trigger server notifications
      const bookingPayload = {
        customerName: trimmedName,
        email: `${cleanPhone}@guest.beevibe.in`,
        phone: cleanPhone,
        date: date,
        timeSlot: timeSlot,
        packageName: currentPackage.name,
        addOns: occasion ? [`Occasion: ${occasion}`] : ['Quick Booking'],
        totalPrice: currentPackage.price,
        guestCount: 2,
        advancePaid: 0,
        balanceDue: currentPackage.price,
        paymentStatus: 'pending',
        paymentMode: 'PAY_AT_VENUE',
        isQuickReservation: true,
        specialRequests: `Quick popup booking. Occasion: ${occasion}. Contact: +91 ${cleanPhone}.`,
        utrNumber: '',
      };

      try {
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload),
        });
        const resData = await res.json();
        if (!res.ok) {
          console.error('Booking submission notice:', resData.error);
        }
      } catch (err) {
        console.warn('Backend booking sync warning:', err);
      }

      // Automatically launch WhatsApp with the pre-filled booking inquiry to +91 9900106474
      const waUrl = getWhatsAppBookingUrl();
      if (typeof window !== 'undefined') {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // Non-blocking for WhatsApp fallback
    } finally {
      setIsSubmitting(false);
      setIsSuccess(true);
    }
  };

  // WhatsApp Pre-filled message generator
  const getWhatsAppBookingUrl = () => {
    const text = 
`*New Private Theater Booking - Bee Vibe* 🐝
━━━━━━━━━━━━━━━━━━
👤 *Name:* ${name.trim()}
📞 *Phone:* +91 ${phone}
🎬 *Room:* ${currentPackage.shortName} (2 Hours Private Suite)
🎁 *Inclusions:* Fog Entry, Floor Balloons, Table Decor, LED Name Board, All OTTs
📅 *Date:* ${date}
⏰ *Time Slot:* ${timeSlot}
🎉 *Occasion:* ${occasion}
━━━━━━━━━━━━━━━━━━
Please confirm my slot reservation!`;

    return `https://wa.me/919900106474?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.cardGlow} />

        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        {!isSuccess ? (
          <>
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.pillBadge}>
                <Sparkles size={13} />
                <span>Quick 30-Sec Reservation</span>
              </div>
              <h2 className={styles.title}>
                Book Your <span className={styles.titleGold}>Private Suite</span>
              </h2>
              <p className={styles.subtitle}>
                No complicated steps. Just enter your name & phone number to reserve your slot.
              </p>
            </div>

            {/* Room Selector */}
            <div className={styles.sectionLabel}>
              <span>1. Choose Experience</span>
              <span className={styles.sectionLabelSub}>All suites 100% private</span>
            </div>

            <div className={styles.roomGrid}>
              {EXPERIENCES.map((pkg) => {
                const pkgVibe = pkg.slug.includes('pink')
                  ? 'pink'
                  : pkg.slug.includes('red')
                  ? 'red'
                  : 'purple';
                const isSelected = selectedTheme === pkgVibe;

                return (
                  <div
                    key={pkg.id}
                    className={`${styles.roomCard} ${isSelected ? styles.roomCardActive : ''}`}
                    onClick={() => setSelectedTheme(pkgVibe)}
                  >
                    <div className={styles.roomThumbWrapper}>
                      <Image
                        src={pkg.image}
                        alt={pkg.name}
                        fill
                        className={styles.roomThumb}
                        sizes="160px"
                      />
                      {isSelected && (
                        <div className={styles.activeCheckBadge}>
                          ✓
                        </div>
                      )}
                    </div>
                    <div className={styles.roomName}>{pkg.shortName}</div>
                    <div className={styles.roomDuration}>2 Hours Private Suite</div>
                  </div>
                );
              })}
            </div>

            {/* Month Offer Inclusions Banner */}
            <div style={{
              background: 'rgba(217, 70, 239, 0.12)',
              border: '1px solid rgba(217, 70, 239, 0.32)',
              borderRadius: '10px',
              padding: '8px 12px',
              marginBottom: '14px',
              fontSize: '0.74rem',
              color: '#f8f6fe',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              🎁 <strong>Coupon &quot;BEEVIBE999&quot; Offer: Flat ₹999 on Any Theme</strong> + Free Fog Entry + LED Name Board + Rose Petal Table Decor + All OTT Platforms!
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.sectionLabel} style={{ marginBottom: '2px' }}>
                <span>2. Basic Details</span>
              </div>

              {/* Name Input */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <User size={13} /> Your Name <span>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className={styles.textInput}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                />
              </div>

              {/* Phone Input with +91 Prefix */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <Phone size={13} /> WhatsApp / Mobile Number <span>*</span>
                </label>
                <div className={styles.phoneInputWrapper}>
                  <span className={styles.phonePrefix}>+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit phone number"
                    className={styles.phoneInput}
                    value={phone}
                    onChange={handlePhoneChange}
                  />
                </div>
              </div>

              {/* Date & Slot in 2 columns */}
              <div className={styles.row2}>
                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <Calendar size={13} /> Date <span>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={styles.selectInput}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label className={styles.inputLabel}>
                    <Clock size={13} /> Time Slot <span>*</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className={styles.selectInput}
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Occasion chips */}
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  <Sparkles size={13} /> Occasion
                </label>
                <div className={styles.occasionGrid}>
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ}
                      type="button"
                      className={`${styles.occasionChip} ${occasion === occ ? styles.occasionChipActive : ''}`}
                      onClick={() => setOccasion(occ)}
                    >
                      {occ}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className={styles.errorMessage}>
                  {errorMessage}
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitBtn}
              >
                {isSubmitting ? (
                  'Reserving Your Slot...'
                ) : (
                  <>
                    <span>Book Slot Instantly</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className={styles.trustFooter}>
                <ShieldCheck size={14} color="var(--accent)" />
                <span>Zero advance required to hold slot • Pay at venue</span>
              </div>

              {/* Link to full customization portal if user desires */}
              {onSwitchToFullPortal && (
                <div className={styles.switchPortalLink}>
                  <button
                    type="button"
                    onClick={onSwitchToFullPortal}
                    className={styles.switchPortalBtn}
                  >
                    Want to add custom cakes, fog & pay advance online? Customize Full Package →
                  </button>
                </div>
              )}
            </form>
          </>
        ) : (
          /* Success Screen */
          <div className={styles.successCard}>
            <div className={styles.successIconBadge}>
              <Check size={32} />
            </div>
            <h2 className={styles.successTitle}>🎉 Slot Reserved!</h2>
            <p className={styles.successSub}>
              Thank you, <strong>{name}</strong>! We have received your booking request for the{' '}
              <strong>{currentPackage.shortName}</strong> suite.
            </p>

            <div className={styles.summaryBox}>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Room:</span>
                <span className={styles.summaryValue}>{currentPackage.name}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Session:</span>
                <span className={styles.summaryValueGold}>2 Hours VIP Private Suite</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Inclusions:</span>
                <span className={styles.summaryValue} style={{ fontSize: '0.75rem', textAlign: 'right', color: '#e0e0f0' }}>Fog Entry + Floor Balloons + Table Decor + LED Name Board + All OTTs</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Date & Time:</span>
                <span className={styles.summaryValue}>{date} ({timeSlot})</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Mobile:</span>
                <span className={styles.summaryValue}>+91 {phone}</span>
              </div>
              <div className={styles.summaryRow}>
                <span className={styles.summaryLabel}>Occasion:</span>
                <span className={styles.summaryValue}>{occasion}</span>
              </div>
            </div>

            <a
              href={getWhatsAppBookingUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappCtaBtn}
            >
              <MessageCircle size={18} />
              <span>Confirm on WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className={styles.closeSuccessBtn}
            >
              Done & Explore Website
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
