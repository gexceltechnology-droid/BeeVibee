'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import BookingPortal from '@/components/BookingPortal';
import styles from './book.module.css';
import { Phone, MapPin } from 'lucide-react';

const BeeVibeLogoIcon = ({ size = 44 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 4px 14px rgba(242, 169, 0, 0.5))' }}
  >
    <defs>
      <linearGradient id="goldBodyBook" x1="10" y1="35" x2="68" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff7b8" />
        <stop offset="25%" stopColor="#f7cd48" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="75%" stopColor="#a3760d" />
        <stop offset="100%" stopColor="#5c3f00" />
      </linearGradient>

      <linearGradient id="goldReelBook" x1="15" y1="10" x2="45" y2="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffcc" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#7a5500" />
      </linearGradient>

      <linearGradient id="goldReelBigBook" x1="40" y1="5" x2="75" y2="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffcc" />
        <stop offset="50%" stopColor="#f7cd48" />
        <stop offset="100%" stopColor="#8a6000" />
      </linearGradient>

      <linearGradient id="goldLensBook" x1="68" y1="40" x2="95" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff3a8" />
        <stop offset="40%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#5c3f00" />
      </linearGradient>

      <linearGradient id="goldHighlightBook" x1="0" y1="0" x2="0" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Small Reel Top Left */}
    <circle cx="28" cy="27" r="16" fill="url(#goldReelBook)" stroke="#4a3400" strokeWidth="1.2" />
    <circle cx="28" cy="27" r="14.5" fill="none" stroke="url(#goldHighlightBook)" strokeWidth="0.9" />
    <circle cx="28" cy="27" r="3.8" fill="#141006" />
    <circle cx="28" cy="17.5" r="2.6" fill="#141006" />
    <circle cx="28" cy="36.5" r="2.6" fill="#141006" />
    <circle cx="18.5" cy="27" r="2.6" fill="#141006" />
    <circle cx="37.5" cy="27" r="2.6" fill="#141006" />

    {/* Large Reel Top Right */}
    <circle cx="58" cy="22" r="20" fill="url(#goldReelBigBook)" stroke="#4a3400" strokeWidth="1.2" />
    <circle cx="58" cy="22" r="18.5" fill="none" stroke="url(#goldHighlightBook)" strokeWidth="0.9" />
    <circle cx="58" cy="22" r="4.8" fill="#141006" />
    <circle cx="58" cy="10" r="3.4" fill="#141006" />
    <circle cx="58" cy="34" r="3.4" fill="#141006" />
    <circle cx="46" cy="22" r="3.4" fill="#141006" />
    <circle cx="70" cy="22" r="3.4" fill="#141006" />

    {/* Main Camera Body (Rounded Box) */}
    <rect x="12" y="42" width="56" height="38" rx="8.5" fill="url(#goldBodyBook)" stroke="#4a3400" strokeWidth="1.4" />
    <rect x="13.5" y="43.5" width="53" height="35" rx="7" fill="none" stroke="url(#goldHighlightBook)" strokeWidth="1.1" />

    {/* Camera Lens Cone (Trapezoid) */}
    <path d="M 68 49 L 92 38 L 92 80 L 68 69 Z" fill="url(#goldLensBook)" stroke="#4a3400" strokeWidth="1.4" />
    <path d="M 69.5 51 L 90.5 41.5 L 90.5 76.5 L 69.5 67 Z" fill="none" stroke="url(#goldHighlightBook)" strokeWidth="0.9" />
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
              <span className={styles.logoSub}>PRIVATE CELEBRATION THEATER</span>
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
