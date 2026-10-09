'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  MapPin,
  Utensils,
  Sparkles,
  Check,
  CheckCircle2,
  Tv,
  Gamepad2,
  Phone,
  Flame,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Camera
} from 'lucide-react';
import styles from './TheatresShowcase.module.css';
import { OccasionType } from '@/types/booking';

interface TheatreInfo {
  id: string;
  roomId: 'red-velvet' | 'angel-wings' | 'royal-butterfly' | 'ps5-gaming';
  occasion: OccasionType;
  title: string;
  themeName: string;
  badge: string;
  capacity: string;
  maxGuests: number;
  originalPrice: number;
  promoPrice: number;
  priceNote: string;
  images: string[];
  features: string[];
  themeSlug: 'red' | 'pink' | 'purple';
}

const THEATRES: TheatreInfo[] = [
  {
    id: 'theatre-couple',
    roomId: 'red-velvet',
    occasion: 'anniversary',
    title: 'Couple Theatre',
    themeName: 'Red Velvet Heart',
    badge: 'Couples & Romantic Dates ❤️',
    capacity: 'Max 3 - 4 People',
    maxGuests: 4,
    originalPrice: 1099,
    promoPrice: 999,
    priceNote: 'Flat ₹999 with Coupon BEEVIBE999',
    themeSlug: 'red',
    images: [
      '/gallery/theme-red.jpg',
      '/gallery/theme-red-heart.jpg',
      '/gallery/theme-red-couch.jpg',
      '/gallery/theme-red-screen.jpg',
    ],
    features: [
      '👥 Max 3 - 4 People',
      '🍿 Food & Cafe Available*',
      '🔒 100% Private & Soundproof Suite',
      '❤️ Floral Heart & "Will You Marry Me" Neon',
      '🎂 Add Cake (₹499), Fog entry etc in next step',
      '🎁 Complimentary Cold Fog & LED Name Board*',
    ],
  },
  {
    id: 'theatre-family',
    roomId: 'angel-wings',
    occasion: 'birthday',
    title: 'Family / Birthday Theatre',
    themeName: 'Angel Wings & Birthday Stage',
    badge: 'Trending Birthday Setup 🩷',
    capacity: 'Max 6 People',
    maxGuests: 6,
    originalPrice: 1299,
    promoPrice: 999,
    priceNote: 'Flat ₹999 with Coupon BEEVIBE999',
    themeSlug: 'pink',
    images: [
      '/gallery/theme-pink.jpg',
      '/gallery/theme-pink-wings.jpg',
      '/gallery/theme-pink-arch.jpg',
      '/gallery/theme-pink-screen.jpg',
    ],
    features: [
      '👥 Max 6 People',
      '🍿 Food & Cafe Available*',
      '🔒 100% Private & Soundproof Suite',
      '🩷 Giant Glowing Angel Wings & Birthday Stage',
      '🎂 Add Cake (₹499), Fog entry etc in next step',
      '🎁 Complimentary Cold Fog & LED Name Board*',
    ],
  },
  {
    id: 'theatre-executive',
    roomId: 'royal-butterfly',
    occasion: 'vip',
    title: 'Executive / VIP Theatre',
    themeName: 'Royal Butterfly VIP',
    badge: 'Flagship VIP Celebration 💜',
    capacity: 'Max 10 People',
    maxGuests: 10,
    originalPrice: 1499,
    promoPrice: 999,
    priceNote: 'Flat ₹999 with Coupon BEEVIBE999',
    themeSlug: 'purple',
    images: [
      '/gallery/theme-purple.jpg',
      '/gallery/theme-purple-stage.jpg',
      '/gallery/theme-purple-couch.jpg',
      '/gallery/theme-purple-screen.jpg',
    ],
    features: [
      '👥 Max 10 People',
      '🍿 Food & Cafe Available*',
      '🔒 100% Private & Soundproof Suite',
      '💜 Grand Triple Canopies & Butterfly Stage',
      '🎂 Add Cake (₹499), Fog entry etc in next step',
      '🎁 Complimentary Cold Fog & LED Name Board*',
    ],
  },
  {
    id: 'theatre-gaming',
    roomId: 'ps5-gaming',
    occasion: 'gaming',
    title: 'PS5 Gaming Lounge',
    themeName: 'Next-Gen 4K Arena',
    badge: '180" 4K Low Latency 🎮',
    capacity: 'Max 4 Players',
    maxGuests: 4,
    originalPrice: 199,
    promoPrice: 99,
    priceNote: '₹99 per person / hour',
    themeSlug: 'purple',
    images: [
      '/gallery/ps5-gaming.jpg',
      '/gaming-banner.jpg',
      '/gallery/theme-purple-screen.jpg',
    ],
    features: [
      '🎮 Max 4 Players',
      '🍿 Cafe & Snack Platter Available*',
      '🔒 100% Private Gaming Arena',
      '⚡ Sony PS5 + 2 Wireless DualSense Controllers',
      '🏆 EA FC 24, Tekken 8, MK1 & Spider-Man 2',
      '🎟️ Only ₹99 / person / hour',
    ],
  },
];

interface SlotItem {
  id: string;
  time: string;
  label: string;
  basePrice: number;
  isBooked: boolean;
}

interface TheatresShowcaseProps {
  onBookSlot?: (roomId: string, occasion: OccasionType, slotTime?: string, date?: string) => void;
  onInspectRoom?: (roomId: string) => void;
}

export default function TheatresShowcase({ onBookSlot, onInspectRoom }: TheatresShowcaseProps) {
  // Current IST date (YYYY-MM-DD)
  const getTodayIST = () => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayIST);
  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<string, number>>({
    'red-velvet': 0,
    'angel-wings': 0,
    'royal-butterfly': 0,
    'ps5-gaming': 0,
  });

  // Selected slot per card before confirming book
  const [selectedSlotsByRoom, setSelectedSlotsByRoom] = useState<Record<string, string>>({});

  // Availability cache per room
  const [roomsSlots, setRoomsSlots] = useState<Record<string, SlotItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const todayIST = useMemo(() => getTodayIST(), []);
  const tomorrowIST = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
  }, []);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    let isCancelled = false;

    const fetchAllRoomsSlots = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/slots?date=${selectedDate}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.roomsAvailability) {
            const mapped: Record<string, SlotItem[]> = {};
            for (const [rid, roomObj] of Object.entries(data.roomsAvailability as Record<string, any>)) {
              mapped[rid] = (roomObj.slots || []) as SlotItem[];
            }
            setRoomsSlots(mapped);
            return;
          }
        }
      } catch (e) {
        console.error('Error fetching live theatre slots:', e);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchAllRoomsSlots();

    return () => {
      isCancelled = true;
    };
  }, [selectedDate]);

  // Image slider handlers
  const handleNextImage = (e: React.MouseEvent, roomId: string, maxImages: number) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) + 1) % maxImages,
    }));
  };

  const handlePrevImage = (e: React.MouseEvent, roomId: string, maxImages: number) => {
    e.stopPropagation();
    setActiveImageIndexes((prev) => ({
      ...prev,
      [roomId]: ((prev[roomId] || 0) - 1 + maxImages) % maxImages,
    }));
  };

  const handleSlotClick = (theatre: TheatreInfo, slot: SlotItem) => {
    if (slot.isBooked) return;
    setSelectedSlotsByRoom((prev) => ({
      ...prev,
      [theatre.roomId]: slot.time,
    }));

    // Trigger booking immediately with this slot pre-selected
    if (onBookSlot) {
      onBookSlot(theatre.roomId, theatre.occasion, slot.time, selectedDate);
    }
  };

  const handleBookNowBtn = (theatre: TheatreInfo) => {
    const chosenSlot = selectedSlotsByRoom[theatre.roomId];
    if (onBookSlot) {
      onBookSlot(theatre.roomId, theatre.occasion, chosenSlot || undefined, selectedDate);
    }
  };

  return (
    <section id="theatres" className={styles.showcaseSection}>
      <div className="container">
        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <div className={styles.badgeRow}>
            <span className={styles.liveIndicator}>
              <span className={styles.liveDot} /> LIVE SCHEDULE
            </span>
            <span className={styles.headerSubtitleTag}>📍 JAYANAGAR 9TH BLOCK, BENGALURU</span>
          </div>

          <h2 className={styles.headingTitle}>
            Choose Your Private Theatre &amp; Time Slot
          </h2>
          <p className={styles.headingDesc}>
            Each private suite has its own independent availability. Pick your celebration date and click any time slot to lock your private theater instantly!
          </p>

          {/* Quick Date Selector Controls */}
          <div className={styles.dateBar}>
            <div className={styles.datePills}>
              <button
                type="button"
                className={`${styles.datePill} ${selectedDate === todayIST ? styles.datePillActive : ''}`}
                onClick={() => setSelectedDate(todayIST)}
              >
                Today ({new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })})
              </button>
              <button
                type="button"
                className={`${styles.datePill} ${selectedDate === tomorrowIST ? styles.datePillActive : ''}`}
                onClick={() => setSelectedDate(tomorrowIST)}
              >
                Tomorrow ({(() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                })()})
              </button>
            </div>

            <div className={styles.datePickerInputWrap}>
              <Calendar size={16} className={styles.calendarIcon} />
              <input
                type="date"
                id="theatres-date-picker"
                value={selectedDate}
                min={todayIST}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={styles.dateInput}
                title="Select Date"
              />
            </div>

            {isLoading && <span className={styles.loadingSlotsNotice}>Checking live slots...</span>}
          </div>
        </div>

        {/* Theatres Grid (Binge Town Style) */}
        <div className={styles.theatresGrid}>
          {THEATRES.map((theatre) => {
            const currentImgIdx = activeImageIndexes[theatre.roomId] || 0;
            const activeImg = theatre.images[currentImgIdx] || theatre.images[0];
            const slots = roomsSlots[theatre.roomId] || [];
            const availableSlotsCount = slots.filter((s) => !s.isBooked).length;
            const chosenSlot = selectedSlotsByRoom[theatre.roomId];

            return (
              <div key={theatre.id} className={styles.theatreCard}>
                {/* 1. Media Carousel Wrap */}
                <div className={styles.imageWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImg}
                    alt={theatre.title}
                    className={styles.theatreImage}
                  />

                  {/* Top Badge */}
                  <div className={styles.topBadgeTag}>
                    <Sparkles size={12} /> {theatre.badge}
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    type="button"
                    className={`${styles.arrowBtn} ${styles.arrowLeft}`}
                    onClick={(e) => handlePrevImage(e, theatre.roomId, theatre.images.length)}
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.arrowBtn} ${styles.arrowRight}`}
                    onClick={(e) => handleNextImage(e, theatre.roomId, theatre.images.length)}
                    aria-label="Next Photo"
                  >
                    <ChevronRight size={18} />
                  </button>

                  {/* Bottom Image Action Pills */}
                  <div className={styles.imageOverlayPills}>
                    <button
                      type="button"
                      className={styles.imgActionPill}
                      onClick={() => onInspectRoom?.(theatre.roomId)}
                    >
                      <Camera size={12} /> Photo Tour ({theatre.images.length})
                    </button>
                    <span className={styles.imgActionPillSec}>
                      <Tv size={12} /> 180&quot; 4K Laser
                    </span>
                  </div>

                  {/* Dot Indicators */}
                  <div className={styles.dotsRow}>
                    {theatre.images.map((_, dotIdx) => (
                      <span
                        key={dotIdx}
                        className={`${styles.dot} ${dotIdx === currentImgIdx ? styles.dotActive : ''}`}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. Title & Action Icons Row */}
                <div className={styles.cardHeader}>
                  <div className={styles.titleCol}>
                    <h3 className={styles.theatreTitle}>{theatre.title}</h3>
                    <span className={styles.theatreTheme}>{theatre.themeName}</span>
                  </div>

                  <div className={styles.quickActionButtons}>
                    <a
                      href="https://maps.app.goo.gl/c4TBh9zeaUDJEh7X8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.quickIconBtn}
                      title="View Location on Google Maps"
                    >
                      <MapPin size={14} />
                      <span>MAPS</span>
                    </a>
                    <Link
                      href={`/menu?theme=${theatre.themeSlug}`}
                      className={styles.quickIconBtn}
                      title="View Food & Cafe Menu"
                    >
                      <Utensils size={14} />
                      <span>FOOD</span>
                    </Link>
                  </div>
                </div>

                {/* 3. Location & Availability Status Badge */}
                <div className={styles.locationAvailabilityRow}>
                  <div className={styles.locationBadge}>
                    <MapPin size={13} /> Jayanagar 9th Block
                  </div>
                  <div
                    className={`${styles.slotsCountBadge} ${
                      availableSlotsCount > 0 ? styles.slotsAvailable : styles.slotsFull
                    }`}
                  >
                    {availableSlotsCount > 0
                      ? `${availableSlotsCount} Slots Available`
                      : '0 Slots Available'}
                  </div>
                </div>

                {/* 4. Specifications & Highlights List */}
                <div className={styles.featuresList}>
                  {theatre.features.map((feat, fIdx) => (
                    <div key={fIdx} className={styles.featureItem}>
                      <span className={styles.featureText}>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* 5. Select Time Slot Section (The Core Interactive Slot Picker) */}
                <div className={styles.slotsSection}>
                  <div className={styles.slotsSectionTitle}>
                    <span>Select Time Slot</span>
                    {chosenSlot && (
                      <span className={styles.selectedSlotPill}>
                        Selected: <strong>{chosenSlot}</strong>
                      </span>
                    )}
                  </div>

                  {slots.length === 0 ? (
                    <div className={styles.noSlotsBox}>
                      <Clock size={16} />
                      <span>All slots for today have concluded. Select tomorrow!</span>
                    </div>
                  ) : (
                    <div className={styles.slotsGrid}>
                      {slots.map((slot) => {
                        const isSelected = chosenSlot === slot.time;
                        const isBooked = slot.isBooked;

                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={isBooked}
                            className={`${styles.slotBtn} ${isSelected ? styles.slotBtnSelected : ''} ${
                              isBooked ? styles.slotBtnBooked : ''
                            }`}
                            onClick={() => handleSlotClick(theatre, slot)}
                            title={isBooked ? 'Slot Booked' : `Select ${slot.time}`}
                          >
                            <span className={styles.slotBtnTime}>
                              {slot.time.replace('-', '–')}
                            </span>
                            <span className={styles.slotBtnBadge}>
                              {isBooked ? '❌ Booked' : '₹999 offer'}
                            </span>
                            {isSelected && <Check size={12} className={styles.slotCheckmark} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 6. Card Bottom Pricing & CTA */}
                <div className={styles.cardFooter}>
                  <div className={styles.priceContainer}>
                    <div className={styles.priceRow}>
                      <span className={styles.priceOriginal}>₹{theatre.originalPrice}</span>
                      <span className={styles.priceCurrent}>₹{theatre.promoPrice}</span>
                      <span className={styles.priceUnit}>/ 2 hrs</span>
                    </div>
                    <span className={styles.pricePromoNote}>{theatre.priceNote}</span>
                  </div>

                  <button
                    type="button"
                    className={styles.bookNowBtn}
                    onClick={() => handleBookNowBtn(theatre)}
                  >
                    <span>BOOK NOW</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
