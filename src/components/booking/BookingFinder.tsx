'use client';

import React, { useState } from 'react';
import { Calendar, Users, Clock, Sparkles, Search, ArrowRight, Phone } from 'lucide-react';
import { OCCASIONS, OccasionType } from '@/types/booking';
import styles from './BookingFinder.module.css';

interface BookingFinderProps {
  onSearch: (params: {
    date: string;
    occasion: OccasionType;
    guestCount: number;
    preferredTime: string;
    phone?: string;
  }) => void;
  initialDate?: string;
  initialOccasion?: OccasionType;
  initialGuests?: number;
  initialPhone?: string;
}

export default function BookingFinder({
  onSearch,
  initialDate,
  initialOccasion = 'birthday',
  initialGuests = 2,
  initialPhone = '',
}: BookingFinderProps) {
  // Default to today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate || todayStr);
  const [occasion, setOccasion] = useState<OccasionType>(initialOccasion);
  const [guestCount, setGuestCount] = useState<number>(initialGuests);
  const [preferredTime, setPreferredTime] = useState<string>('any');
  const [phone, setPhone] = useState<string>(initialPhone);
  const [phoneError, setPhoneError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError('');

    // Directly capture the LEAD to BeeVibe CRM tool
    const occLabel = OCCASIONS.find((o) => o.id === occasion)?.label || 'Birthday Celebration';
    const isGaming = occasion === 'gaming';
    const leadPayload = {
      customer_name: 'Website Lead',
      phone: cleanPhone,
      interest: isGaming ? 'Gaming' : 'Party Hall',
      occasion: occLabel,
      event_date: date,
      guest_count: guestCount,
      source: 'Website',
      notes: `Availability search on homepage (Preferred Time: ${preferredTime}, Guests: ${guestCount})`,
    };

    // 1. Forward through server-side /api/leads
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadPayload),
    }).catch((err) => {
      console.error('Failed to sync lead via /api/leads:', err);
    });

    // 2. Direct forward to Cloudflare Lead Manager CRM endpoint
    try {
      fetch('https://rental-license-ment-consideration.trycloudflare.com/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadPayload),
      }).catch((crmError) => {
        console.error('Lead Manager CRM direct sync error:', crmError);
      });
    } catch (crmErr) {
      console.error('Lead Manager CRM sync error:', crmErr);
    }

    onSearch({
      date,
      occasion,
      guestCount,
      preferredTime,
      phone: cleanPhone,
    });
  };

  return (
    <div className={styles.finderCard}>
      <div className={styles.finderHeader}>
        <div className={styles.finderBadge}>
          <Sparkles size={14} /> LIVE AVAILABILITY ENGINE
        </div>
        <h3 className={styles.finderTitle}>Find your BeeVibe experience</h3>
        <p className={styles.finderSubtitle}>
          Select date, occasion, and guests to reveal available private celebration theatres
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.finderForm}>
        <div className={styles.fieldsGrid}>
          {/* Field 1: Date */}
          <div className={styles.fieldBox}>
            <label className={styles.fieldLabel} htmlFor="finder-date">
              <Calendar size={15} className={styles.fieldIcon} />
              <span>Select Date</span>
            </label>
            <input
              id="finder-date"
              type="date"
              className={styles.fieldInput}
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Field 2: Occasion */}
          <div className={styles.fieldBox}>
            <label className={styles.fieldLabel} htmlFor="finder-occasion">
              <span className={styles.fieldIconEmoji}>🎉</span>
              <span>Occasion</span>
            </label>
            <select
              id="finder-occasion"
              className={styles.fieldSelect}
              value={occasion}
              onChange={(e) => setOccasion(e.target.value as OccasionType)}
            >
              {OCCASIONS.map((occ) => (
                <option key={occ.id} value={occ.id}>
                  {occ.icon} {occ.label}
                </option>
              ))}
            </select>
          </div>

          {/* Field 3: Number of Guests */}
          <div className={styles.fieldBox}>
            <label className={styles.fieldLabel} htmlFor="finder-guests">
              <Users size={15} className={styles.fieldIcon} />
              <span>Number of Guests</span>
            </label>
            <select
              id="finder-guests"
              className={styles.fieldSelect}
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
            >
              <option value={2}>2 Guests (Couple / Besties)</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests (Small Group)</option>
              <option value={5}>5 Guests</option>
              <option value={6}>6 Guests</option>
              <option value={8}>8 Guests (Party Group)</option>
              <option value={10}>10 Guests (Max VIP Hall)</option>
            </select>
          </div>

          {/* Field 4: Preferred Time */}
          <div className={styles.fieldBox}>
            <label className={styles.fieldLabel} htmlFor="finder-time">
              <Clock size={15} className={styles.fieldIcon} />
              <span>Preferred Time</span>
            </label>
            <select
              id="finder-time"
              className={styles.fieldSelect}
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
            >
              <option value="any">Any Time Slot</option>
              <option value="morning">Morning (10 AM - 12 PM)</option>
              <option value="matinee">Matinee (12:30 PM - 2:30 PM)</option>
              <option value="afternoon">Afternoon (3 PM - 5 PM)</option>
              <option value="evening">Sunset (5:30 PM - 7:30 PM)</option>
              <option value="night">Night (8 PM - 10 PM)</option>
              <option value="midnight">Midnight (10 PM - 12 AM) (+₹500)</option>
              <option value="latenight">Late Night (11 PM - 1 AM) (+₹500)</option>
            </select>
          </div>

          {/* Field 5: Phone Number */}
          <div className={`${styles.fieldBox} ${phoneError ? styles.fieldBoxError : ''}`}>
            <label className={styles.fieldLabel} htmlFor="finder-phone">
              <Phone size={15} className={styles.fieldIcon} />
              <span>Phone Number</span>
            </label>
            <input
              id="finder-phone"
              type="tel"
              className={styles.fieldInput}
              placeholder="10-digit mobile"
              value={phone}
              maxLength={10}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                setPhone(clean);
                if (phoneError) setPhoneError('');
              }}
              required
            />
            {phoneError && <span className={styles.errorText}>{phoneError}</span>}
          </div>
        </div>

        {/* Submit Action */}
        <div className={styles.submitContainer}>
          <button type="submit" className={styles.submitBtn}>
            <span>CHECK AVAILABILITY</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
