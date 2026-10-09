'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Users,
  Tv,
  Volume2,
  Info,
  Calendar,
  MessageSquare,
  Phone,
  Flame,
  Award
} from 'lucide-react';
import RoomCard from '@/components/booking/RoomCard';
import RoomDetailsModal from '@/components/booking/RoomDetailsModal';
import BookingFlowModal from '@/components/booking/BookingFlowModal';
import WhatsAppBotWidget from '@/components/WhatsAppBotWidget';
import { ROOMS, OCCASIONS, RoomExperience, OccasionType, ADD_ONS } from '@/types/booking';
import styles from './themes.module.css';

export default function ThemesPage() {
  const [activeOccasionFilter, setActiveOccasionFilter] = useState<'all' | OccasionType>('all');
  const [inspectingRoom, setInspectingRoom] = useState<RoomExperience | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string>('angel-wings');
  const [preselectedOccasion, setPreselectedOccasion] = useState<OccasionType>('birthday');

  // Filtered rooms
  const filteredRooms = ROOMS.filter((room) => {
    if (activeOccasionFilter === 'all') return true;
    return room.occasion === activeOccasionFilter;
  });

  // Open booking modal directly with specific room
  const handleQuickBook = (roomId: string) => {
    const target = ROOMS.find((r) => r.id === roomId);
    setPreselectedRoomId(roomId);
    if (target) {
      setPreselectedOccasion(target.occasion);
    }
    setInspectingRoom(null);
    setIsBookingModalOpen(true);
  };

  return (
    <div className={styles.main}>
      <WhatsAppBotWidget />

      {/* ══════════════════════════════════════════════════
          HEADER NAVBAR
          ══════════════════════════════════════════════════ */}
      <header className={styles.header}>
        <div className="container">
          <div className={styles.headerInner}>
            <Link href="/" className={styles.backHomeBtn}>
              <ChevronLeft size={18} />
              <span>Back to Home</span>
            </Link>

            <Link href="/" className={styles.brandLogo}>
              <span>BEE<span className={styles.brandHighlight}>VIBE</span></span>
              <span className={styles.brandSub}>Private Celebration Theatre</span>
            </Link>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleQuickBook('angel-wings')}
            >
              <span>QUICK BOOK</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          HERO BANNER
          ══════════════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Sparkles size={14} /> EXPLORE OUR CURATED THEMES
            </div>
            <h1 className={styles.heroTitle}>
              Celebration Themes &amp; Private Suites
            </h1>
            <p className={styles.heroDescription}>
              Every suite at BeeVibe is designed for specific celebrations — birthdays, anniversaries, proposals, VIP galas, and next-gen PS5 gaming. Step inside to see what each theme includes and book instantly.
            </p>

            {/* Occasion Filter Tabs */}
            <div className={styles.filterTabs}>
              <button
                type="button"
                className={`${styles.filterChip} ${activeOccasionFilter === 'all' ? styles.filterChipActive : ''}`}
                onClick={() => setActiveOccasionFilter('all')}
              >
                All Themes ({ROOMS.length})
              </button>
              {OCCASIONS.map((occ) => (
                <button
                  type="button"
                  key={occ.id}
                  className={`${styles.filterChip} ${activeOccasionFilter === occ.id ? styles.filterChipActive : ''}`}
                  onClick={() => setActiveOccasionFilter(occ.id)}
                >
                  <span>{occ.icon}</span>
                  <span>{occ.shortLabel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          DEEP DIVE THEME SHOWCASE CARDS (WHAT'S INSIDE)
          ══════════════════════════════════════════════════ */}
      <section className={styles.themesSection}>
        <div className="container">
          <div className={styles.themesList}>
            {filteredRooms.map((room, idx) => (
              <div key={room.id} id={room.id} className={styles.themeShowcaseCard}>
                {/* Visual Image Gallery Side */}
                <div className={styles.themeMediaCol}>
                  <div className={styles.themeMainImgWrap} onClick={() => setInspectingRoom(room)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={room.image} alt={room.name} className={styles.themeMainImg} />
                    <div className={styles.themeImgBadge}>
                      <Sparkles size={13} /> {room.occasionLabel}
                    </div>
                    {room.badge && (
                      <span className={styles.editorialBadge}>{room.badge}</span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  <div className={styles.themeThumbsRow}>
                    {room.galleryImages.map((img, i) => (
                      <div
                        key={i}
                        className={styles.themeThumb}
                        onClick={() => setInspectingRoom(room)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`${room.name} preview ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Theme Inclusions & Information Side */}
                <div className={styles.themeInfoCol}>
                  <div className={styles.themeHeaderRow}>
                    <div>
                      <span className={styles.themeSubCategory}>{room.theme}</span>
                      <h2 className={styles.themeName}>{room.name}</h2>
                    </div>
                    <span className={styles.durationPill}>
                      <Clock size={14} /> {room.duration} Session
                    </span>
                  </div>

                  {/* Theme Price & Coupon Offer Bar */}
                  <div className={styles.themePriceBanner}>
                    <div className={styles.themePriceTag}>
                      <span className={styles.priceLabel}>Standard Price:</span>
                      <span className={styles.priceAmount}>₹{room.price}/-</span>
                    </div>
                    {room.occasion !== 'gaming' && (
                      <div className={styles.couponOfferTag}>
                        <Sparkles size={14} />
                        <span>With Coupon <strong>BEEVIBE999</strong>: Flat <strong>₹999/-</strong></span>
                      </div>
                    )}
                  </div>

                  {room.occasion !== 'gaming' && (
                    <div className={styles.couponInclusionsAlert}>
                      🎟️ <strong>Included with Coupon BEEVIBE999 at ₹999/-:</strong> Cold Fog Entry + Custom LED Name Board + Table Decor with Rose Petals &amp; Floor Balloons + All OTT Platforms!
                    </div>
                  )}

                  <p className={styles.themeDesc}>{room.description}</p>

                  {/* Spec Icons Row */}
                  <div className={styles.specBadgesRow}>
                    <div className={styles.specBadge}>
                      <Users size={15} />
                      <span>{room.capacity}</span>
                    </div>
                    <div className={styles.specBadge}>
                      <Tv size={15} />
                      <span>180&quot; 4K Laser Projection</span>
                    </div>
                    <div className={styles.specBadge}>
                      <Volume2 size={15} />
                      <span>7.1 Dolby Atmos Sound</span>
                    </div>
                  </div>

                  {/* What's Inside This Theme */}
                  <div className={styles.inclusionsSection}>
                    <h3 className={styles.inclusionsTitle}>What Will Be Inside This Suite:</h3>
                    <div className={styles.inclusionsGrid}>
                      {room.features.map((feat, fIdx) => (
                        <div key={fIdx} className={styles.inclusionItem}>
                          <CheckCircle2 size={16} className={styles.checkIcon} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Available Add-Ons for this Theme */}
                  <div className={styles.addonPreviewRow}>
                    <span className={styles.addonLabel}>Popular Add-ons for this suite:</span>
                    <div className={styles.addonChips}>
                      {ADD_ONS.slice(0, 4).map((addon) => (
                        <span key={addon.id} className={styles.addonChip}>
                          <span>{addon.icon}</span> {addon.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action CTAs */}
                  <div className={styles.themeCtasRow}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleQuickBook(room.id)}
                    >
                      <span>QUICK BOOK THIS THEME</span>
                      <ArrowRight size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => setInspectingRoom(room)}
                    >
                      <Info size={15} /> View Full Specs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          WHY CELEBRATE IN A BEEVIBE SUITE
          ══════════════════════════════════════════════════ */}
      <section className={styles.bannerSection}>
        <div className="container">
          <div className={styles.bannerCard}>
            <div className={styles.bannerText}>
              <h2 className={styles.bannerTitle}>All Themes Include 100% Total Privacy</h2>
              <p className={styles.bannerSub}>
                When you book any BeeVibe theme, the entire hall is reserved exclusively for your party. Acoustic soundproofing, ultra-comfortable seating, and zero outside interruption in Jayanagar 9th Block.
              </p>
            </div>
            <div className={styles.bannerButtons}>
              <button
                type="button"
                className="btn btn-navy"
                onClick={() => handleQuickBook('angel-wings')}
              >
                <span>OPEN QUICK BOOKING</span>
                <ArrowRight size={16} />
              </button>
              <a
                href="https://wa.me/919900106474?text=Hi%20BeeVibe!%20I%20want%20to%20inquire%20about%20your%20celebration%20themes."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <MessageSquare size={16} /> WhatsApp Inquiry
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          FOOTER
          ══════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div>
              <div className={styles.footerLogo}>BEEVIBE</div>
              <p className={styles.footerAddress}>
                1340, 2nd Floor, 41st Cross Road, 4th Gate, Opposite Jain University, Jayanagar 9th Block, Bengaluru.
              </p>
            </div>
            <div className={styles.footerLinks}>
              <Link href="/">Home</Link>
              <Link href="/themes">All Themes</Link>
              <Link href="/#location">Location</Link>
              <Link href="/#faq">FAQ</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════
          MODALS: ROOM DETAILS & QUICK BOOKING FLOW
          ══════════════════════════════════════════════════ */}
      <RoomDetailsModal
        room={inspectingRoom}
        onClose={() => setInspectingRoom(null)}
        onSelectAndBook={handleQuickBook}
      />

      <BookingFlowModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialRoomId={preselectedRoomId}
        initialOccasion={preselectedOccasion}
      />
    </div>
  );
}
