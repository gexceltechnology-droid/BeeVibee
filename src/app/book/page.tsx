'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BookingPortal from '@/components/BookingPortal';
import styles from './book.module.css';
import { Phone, MapPin } from 'lucide-react';

const PartyPopperIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ff2e7e"
    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ filter: 'drop-shadow(0 0 6px rgba(255, 46, 126, 0.5))' }}>
    <path d="M5.8 11.3 2 22l10.7-3.8C11 15.6 8.4 13 5.8 11.3Z" />
    <path d="m4 15 3 3" />
    <path d="M13 13c1.4-1.4 3.7-1.4 5.1 0 1.4 1.4 1.4 3.7 0 5.1-1.4 1.4-3.7 1.4-5.1 0-1.4-1.4-1.4-3.7 0-5.1Z" />
    <line x1="13" y1="9" x2="13" y2="7" />
    <line x1="17" y1="5" x2="18" y2="4" />
    <line x1="21" y1="9" x2="22" y2="8" />
  </svg>
);

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

type VibeType = 'pink' | 'purple' | 'red';

export default function BookPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [vibe, setVibe] = useState<VibeType>('pink');

  // Read saved vibe from localStorage (set by home page)
  useEffect(() => {
    const saved = localStorage.getItem('beevibe_theme') as VibeType | null;
    if (saved && ['pink', 'purple', 'red'].includes(saved)) {
      setVibe(saved);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.page} data-vibe={vibe}>

      {/* Ambient Background */}
      <div className={styles.ambientGlow} />
      <div className={styles.gridPattern} />

      {/* Header */}
      <div className={`${styles.header} ${isScrolled ? styles.headerScrolled : ''}`}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}><PartyPopperIcon /></div>
            <div className={styles.logoText}>
              <span className={styles.logoBrand}>BeeVibe</span>
              <span className={styles.logoSub}>MINI PRIVATE THEATER</span>
            </div>
          </Link>
          <Link href="/" className={styles.backBtn}>
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Page Content */}
      <main className={styles.main}>

        {/* Hero Banner */}
        <div className={styles.heroBanner}>
          <div className={styles.heroBadge}>🎉 RESERVATIONS</div>
          <h1 className={styles.heroTitle}>
            Book Your<br />
            <span className={styles.heroAccent}>Celebration Space</span>
          </h1>
          <p className={styles.heroSub}>
            Choose a date, pick your vibe theme, and reserve your private party hall in minutes.
            HD Projector · AC · Wi-Fi · Snacks on order.
          </p>

          {/* Quick Info Pills */}
          <div className={styles.infoPills}>
            <span className={styles.pill}>🌸 Pink Theme — ₹799/2hrs</span>
            <span className={styles.pill}>🎂 Purple Theme — ₹999/2hrs</span>
            <span className={styles.pill}>❤️ Red Theme — ₹599/2hrs</span>
          </div>
          <p className={styles.extraInfo}>
            Base price for 2 guests · Extra guests: ₹100/head · DSLR Camera: ₹500/hr · Fog Entry: ₹300 flat
          </p>
        </div>

        {/* Booking Portal */}
        <div className={styles.portalWrapper}>
          <BookingPortal />
        </div>

        {/* Contact Strip */}
        <div className={styles.contactStrip}>
          <div className={styles.contactItem}>
            <Phone size={16} className={styles.contactIcon} />
            <a href="tel:9900106474">+91 99001 06474</a>
          </div>
          <div className={styles.contactItem}>
            <InstagramIcon size={16} />
            <a href="https://www.instagram.com/beevibe_partyhall/" target="_blank" rel="noopener noreferrer">
              @beevibe_partyhall
            </a>
          </div>
          <div className={styles.contactItem}>
            <MapPin size={16} className={styles.contactIcon} />
            <a href="https://www.google.com/maps/search/?api=1&query=1340%2C+41st+cross+road%2C+jayanagar+9th+block%2C+bangalore"
              target="_blank" rel="noopener noreferrer">
              Jayanagar 9th Block, Bangalore
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
