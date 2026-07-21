'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BookingPortal from '@/components/BookingPortal';
import styles from './book.module.css';
import { Phone, MapPin } from 'lucide-react';

const BeeVibeLogoIcon = () => (
  <svg
    viewBox="0 0 32 32"
    width="42"
    height="42"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 0 6px var(--accent))' }}
  >
    {/* Film reel outer ring */}
    <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.8" />
    {/* Film reel inner circle */}
    <circle cx="16" cy="16" r="4" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
    {/* Play triangle center */}
    <path d="M14 13.5l6 2.5-6 2.5v-5z" fill="currentColor" />
    {/* Film strip holes - top */}
    <circle cx="16" cy="7" r="1.2" fill="currentColor" />
    <circle cx="21.2" cy="9.4" r="1.2" fill="currentColor" />
    <circle cx="10.8" cy="9.4" r="1.2" fill="currentColor" />
    {/* Film strip holes - bottom */}
    <circle cx="16" cy="25" r="1.2" fill="currentColor" />
    <circle cx="21.2" cy="22.6" r="1.2" fill="currentColor" />
    <circle cx="10.8" cy="22.6" r="1.2" fill="currentColor" />
    {/* Sparkle top-right */}
    <path d="M26 5l.6 1.4L28 7l-1.4.6L26 9l-.6-1.4L24 7l1.4-.6z" fill="currentColor" />
    {/* Sparkle small */}
    <path d="M28 12l.3.7.7.3-.7.3-.3.7-.3-.7-.7-.3.7-.3z" fill="currentColor" />
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
            <div className={styles.logoIcon}><BeeVibeLogoIcon /></div>
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
