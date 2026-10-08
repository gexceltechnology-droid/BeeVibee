'use client';

import React, { useState } from 'react';
import { Calendar, Users, Clock, Sparkles, Search, ArrowRight } from 'lucide-react';
import { OCCASIONS, OccasionType } from '@/types/booking';
import styles from './BookingFinder.module.css';

interface BookingFinderProps {
  onSearch: (params: {
    date: string;
    occasion: OccasionType;
    guestCount: number;
    preferredTime: string;
  }) => void;
  initialDate?: string;
  initialOccasion?: OccasionType;
  initialGuests?: number;
}

export default function BookingFinder({
  onSearch,
  initialDate,
  initialOccasion = 'birthday',
  initialGuests = 2,
}: BookingFinderProps) {
  // Default to today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(initialDate || todayStr);
  const [occasion, setOccasion] = useState<OccasionType>(initialOccasion);
  const [guestCount, setGuestCount] = useState<number>(initialGuests);
  const [preferredTime, setPreferredTime] = useState<string>('any');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      date,
      occasion,
      guestCount,
      preferredTime,
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
              <option value="midnight">Midnight (10 PM - 12 AM)</option>
            </select>
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
