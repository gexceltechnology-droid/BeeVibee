'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from './book.module.css';
import { Phone, MapPin } from 'lucide-react';

const BookingPortal = dynamic(() => import('@/components/BookingPortal'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '500px', width: '100%', borderRadius: '20px', background: 'rgba(20, 20, 27, 0.4)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading Booking Engine...</div>
    </div>
  ),
});

const BeeVibeLogoIcon = ({ size = 44 }: { size?: number }) => (
  <img
    src="/bee-vibe-logo.png?v=2"
    alt="BeeVibe Mini Private Theater"
    style={{ height: size, width: 'auto', objectFit: 'contain' }}
  />
);

const InstagramIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

type VibeType = 'pink' | 'purple' | 'red';

export default function BookPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [vibe, setVibe] = useState<VibeType>('purple');

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
            <img
              src="/bee-vibe-logo.png?v=4"
              alt="BeeVibe Mini Private Theater"
              className={styles.logoImg}
              style={{ height: '105px', width: 'auto', objectFit: 'contain' }}
            />
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
            <span className={styles.pill}>💜 Purple Theme — ₹999/2hrs</span>
            <span className={styles.pill}>🩷 Pink Theme — ₹799/2hrs</span>
            <span className={styles.pill}>❤️ Red Theme — ₹599/2hrs</span>
          </div>
          <p className={styles.extraInfo}>
            Base price for 2 guests · Extra guests: ₹100/head · DSLR Camera: from ₹300 · Fog Entry: from ₹300
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
            <InstagramIcon size={16} className={styles.contactIcon} />
            <a href="https://www.instagram.com/beevibe_partyhall/" target="_blank" rel="noopener noreferrer">
              @beevibe_partyhall
            </a>
          </div>
          <div className={styles.contactItem}>
            <MapPin size={16} className={styles.contactIcon} />
            <a href="https://maps.app.goo.gl/c4TBh9zeaUDJEh7X8"
              target="_blank" rel="noopener noreferrer">
              1340, 2nd floor, 41st Cross road, 4th gate, opposite to Jain University, Jayanagara 9th Block, Bengaluru, Karnataka 560041
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
