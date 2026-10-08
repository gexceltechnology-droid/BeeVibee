'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Sparkles,
  ChevronDown,
  Tv,
  Gamepad2,
  Volume2,
  Coffee,
  ShieldCheck,
  MapPin,
  Heart
} from 'lucide-react';
import WhatsAppBotWidget from '@/components/WhatsAppBotWidget';
import GallerySection from '@/components/GallerySection';
import QuickBookingModal from '@/components/QuickBookingModal';
import { EXPERIENCES } from '@/lib/experiences';
import styles from './page.module.css';

const BookingPortal = dynamic(() => import('@/components/BookingPortal'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0c0' }}>
      Loading Booking Portal...
    </div>
  ),
});

export default function Home() {
  const [vibe, setVibe] = useState<'pink' | 'purple' | 'red'>('purple');
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isFullBookingOpen, setIsFullBookingOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedCodeToast, setCopiedCodeToast] = useState(false);

  const handleCopyCouponCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('BEEVIBE999');
    }
    setCopiedCodeToast(true);
    setTimeout(() => {
      setCopiedCodeToast(false);
    }, 3000);
  };

  // Read saved vibe from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('beevibe_theme') as 'pink' | 'purple' | 'red' | null;
      if (saved && ['pink', 'purple', 'red'].includes(saved)) {
        setVibe(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Automatically trigger quick booking popup with basic details & phone when customer opens the website
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsQuickBookingOpen(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Update vibe and synchronize with storage
  const handleSelectVibe = (newVibe: 'pink' | 'purple' | 'red') => {
    setVibe(newVibe);
    try {
      localStorage.setItem('beevibe_theme', newVibe);
    } catch {
      /* ignore */
    }
  };

  // Open quick booking modal with specific or current theme
  const handleOpenBooking = (theme?: 'pink' | 'purple' | 'red') => {
    if (theme) {
      handleSelectVibe(theme);
    }
    setIsQuickBookingOpen(true);
  };

  // Switch from quick modal to full customization portal if requested
  const handleSwitchToFullPortal = () => {
    setIsQuickBookingOpen(false);
    setIsFullBookingOpen(true);
  };

  // Lock body scroll and listen for Escape key when full modal is open
  useEffect(() => {
    if (isFullBookingOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsFullBookingOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else if (!isQuickBookingOpen) {
      document.body.style.overflow = 'unset';
    }
  }, [isFullBookingOpen, isQuickBookingOpen]);

  // Scroll listener for sticky header styling & scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 40);

      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? winScroll / height : 0;
      setScrollProgress(scrolled);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll reveal animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.12,
    };

    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealActive);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    const revealElements = document.querySelectorAll('.' + styles.reveal);
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const activeExperience = EXPERIENCES.find((exp) => exp.slug.includes(vibe)) || EXPERIENCES[2];

  const THEMES_PREVIEWS = EXPERIENCES.map((exp) => ({
    id: exp.slug.replace('-theme', ''),
    name: exp.name,
    shortName: exp.shortName,
    originalPrice: exp.originalPrice,
    price: exp.price,
    duration: exp.durationLabel,
    badge: exp.badge,
    color: exp.color,
    image: exp.image,
    features: exp.details.slice(0, 4),
  }));

  return (
    <div className={styles.main} data-vibe={vibe}>
      {/* Scroll Progress Bar */}
      <div className={styles.scrollProgressBar} style={{ transform: 'scaleX(' + scrollProgress + ')', transformOrigin: 'left' }} />

      {/* Dynamic Background Glows */}
      <div className="ambient-glow-bg" />
      <div className="gradient-overlay" />

      {/* Interactive WhatsApp Bot Widget */}
      <WhatsAppBotWidget />

      {/* Navigation Header */}
      <div className={styles.headerContainer + (isScrolled ? ' ' + styles.headerContainerScrolled : '')}>
        <div className="container" style={{ position: 'relative' }}>
          <header className={styles.header}>
            <Link href="/" className={styles.logoWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bee-vibe-logo.png?v=4"
                alt="BeeVibe Mini Private Theater"
                className={styles.logoImg}
                style={{ height: '90px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
            <nav className={styles.desktopNav}>
              <ul className={styles.navLinks}>
                <li><Link href="/gaming" className={styles.navLink} style={{ color: '#00f0ff', fontWeight: 'bold' }}>Gaming World 🎮</Link></li>
                <li><a href="#vibes" className={styles.navLink}>Our 3 Themes</a></li>
                <li><a href="#gallery" className={styles.navLink}>Gallery 📸</a></li>
                <li><a href="#features" className={styles.navLink}>Amenities</a></li>
                <li><a href="#location" className={styles.navLink}>Location</a></li>
                <li><a href="#faq" className={styles.navLink}>FAQ</a></li>
                <li><Link href="/book" className={styles.navLink}>Booking Portal</Link></li>
              </ul>
            </nav>
            <div className={styles.headerActions}>
              <button
                type="button"
                onClick={() => handleOpenBooking()}
                className="btn btn-primary btn-nav"
                style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Book Now
              </button>
              <button
                className={styles.hamburger + (isMobileMenuOpen ? ' ' + styles.hamburgerActive : '')}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
              </button>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          <div className={styles.mobileMenu + (isMobileMenuOpen ? ' ' + styles.mobileMenuActive : '')}>
            <ul className={styles.mobileNavLinks}>
              <li>
                <Link href="/gaming" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#00f0ff', fontWeight: 'bold' }}>
                  Gaming World 🎮
                </Link>
              </li>
              <li>
                <a href="#vibes" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  Our 3 Themes
                </a>
              </li>
              <li>
                <a href="#gallery" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  Gallery 📸
                </a>
              </li>
              <li>
                <a href="#features" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  Amenities
                </a>
              </li>
              <li>
                <a href="#location" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  Location & Map
                </a>
              </li>
              <li>
                <a href="#faq" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  FAQ
                </a>
              </li>
              <li>
                <Link href="/book" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  Booking Portal
                </Link>
              </li>
              <li style={{ width: '100%', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleOpenBooking();
                  }}
                >
                  Book Now
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Infinite Horizontal Scrolling Coupon Code Marquee Ticker */}
      <div
        className={styles.tickerContainer}
        onClick={handleCopyCouponCode}
        title="Tap to copy coupon code BEEVIBE999"
      >
        <div className={styles.tickerTrack}>
          {[1, 2, 3, 4].map((idx) => (
            <div key={idx} className={styles.tickerItem}>
              <span>🎉 SPECIAL MONTH PROMO:</span>
              <span className={styles.tickerCouponBadge}>🎟️ CODE: BEEVIBE999</span>
              <span>✦ Apply at Payment for Special Theme Rate ✦ Includes Free Fog Entry + Floor Balloons + Table Decor + LED Name Board + All OTTs!</span>
              <span className={styles.tickerCopyPrompt}>Tap to Copy Code</span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero Section: Interactive Split Spotlight with Real Photography */}
      <section id="hero" className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroSplitGrid}>
            {/* Left Column: Headline, Controls, CTAs */}
            <div className={styles.heroContentCol}>
              <div className={styles.heroBadge}>
                <Sparkles size={16} color="var(--accent)" />
                <span>BANGALORE&apos;S PREMIER PRIVATE CELEBRATION THEATER &amp; LOUNGE</span>
              </div>

              <h1 className={styles.heroTitle}>
                Your Private Cinema.<br />
                <span className="text-glow" style={{ color: activeExperience.color, transition: 'color 0.4s ease' }}>
                  Unforgettable Celebrations.
                </span>
              </h1>

              <p className={styles.heroSubtitle}>
                Experience Bangalore&apos;s most luxurious private party hall and celebration theater in Jayanagar 9th Block. Book our 100% private suites with <strong>180-inch 4K laser projection</strong>, <strong>7.1 Dolby Atmos sound</strong>, custom lighting, and dedicated <strong>PS5 Gaming</strong> for birthdays, anniversaries, and date nights.
              </p>

              {/* Room Mood Lighting & Theme Switcher */}
              <div className={styles.vibePanel} style={{ alignItems: 'flex-start', width: '100%' }}>
                <div className={styles.vibeTitle}>Select Real Room Setup:</div>
                <div className={styles.vibeButtons} style={{ justifyContent: 'flex-start' }}>
                  <button
                    type="button"
                    className={styles.vibeBtn + (vibe === 'red' ? ' ' + styles.vibeBtnActive : '')}
                    onClick={() => handleSelectVibe('red')}
                  >
                    <span className={styles.colorIndicator} style={{ backgroundColor: '#ef4444' }} />
                    ❤️ Red Velvet Romance
                  </button>
                  <button
                    type="button"
                    className={styles.vibeBtn + (vibe === 'pink' ? ' ' + styles.vibeBtnActive : '')}
                    onClick={() => handleSelectVibe('pink')}
                  >
                    <span className={styles.colorIndicator} style={{ backgroundColor: '#ec4899' }} />
                    🩷 Angel Wings &amp; Neon
                  </button>
                  <button
                    type="button"
                    className={styles.vibeBtn + (vibe === 'purple' ? ' ' + styles.vibeBtnActive : '')}
                    onClick={() => handleSelectVibe('purple')}
                  >
                    <span className={styles.colorIndicator} style={{ backgroundColor: '#a855f7' }} />
                    💜 Royal Butterfly
                  </button>
                </div>
              </div>

              {/* Special Month Coupon Offer Banner */}
              <div style={{
                background: '#f8fafc',
                border: '1.5px dashed #09090b',
                borderRadius: '14px',
                padding: '12px 18px',
                margin: '16px 0 22px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.6rem' }}>🎟️</span>
                  <div>
                    <div style={{ color: '#09090b', fontWeight: 800, fontSize: '0.94rem' }}>
                      Limited Month Promo: Apply Coupon &quot;BEEVIBE999&quot; at Checkout!
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '2px' }}>
                      Includes Complimentary <strong>Fog Entry</strong> + <strong>Floor Balloons</strong> + <strong>Table Decor</strong> + <strong>LED Name Board</strong> + <strong>All OTTs</strong>!
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopyCouponCode}
                    style={{
                      background: '#09090b',
                      color: '#ffffff',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      letterSpacing: '0.5px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  >
                    📋 Copy Code BEEVIBE999
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenBooking(vibe)}
                    style={{ background: '#ffffff', color: '#09090b', padding: '6px 14px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  >
                    Book Experience →
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={styles.heroCtas} style={{ justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  onClick={() => handleOpenBooking(vibe)}
                  className="btn btn-primary"
                  style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Reserve VIP Suite →
                </button>
                <Link href="/gaming" className="btn btn-secondary" style={{ padding: '14px 22px', fontSize: '1rem', borderColor: '#00f0ff', color: '#00f0ff' }}>
                  PS5 Gaming Lounge 🎮
                </Link>
                <a href="#vibes" className="btn btn-secondary" style={{ padding: '14px 20px', fontSize: '1rem' }}>
                  View 3 Themes ↓
                </a>
              </div>
            </div>

            {/* Right Column: Hero Real Photography Showcase */}
            <div className={styles.heroVisualCol}>
              <div
                className={styles.heroShowcaseStage}
                style={{
                  borderColor: activeExperience.color + '66',
                  boxShadow: `0 20px 60px rgba(0, 0, 0, 0.85), 0 0 35px ${activeExperience.color}25`
                }}
              >
                {/* 3 Real Room Photos Stacked (Cross-fade smooth transition) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/themes/theme-red.jpg"
                  alt="Real Red Velvet Romance Private Suite Setup at BeeVibe"
                  className={`${styles.heroRealRoomImg} ${vibe === 'red' ? styles.heroRealRoomImgActive : ''}`}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/themes/theme-pink.jpg"
                  alt="Real Angel Wings & Neon Birthday Private Suite Setup at BeeVibe"
                  className={`${styles.heroRealRoomImg} ${vibe === 'pink' ? styles.heroRealRoomImgActive : ''}`}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/themes/theme-purple.jpg"
                  alt="Real Royal Butterfly VIP Private Suite Setup at BeeVibe"
                  className={`${styles.heroRealRoomImg} ${vibe === 'purple' ? styles.heroRealRoomImgActive : ''}`}
                />

                {/* Top Overlay Badges */}
                <div className={styles.heroStageTopOverlay}>
                  <span className={styles.heroStageRealBadge}>
                    📸 Authentic BeeVibe Room Setup
                  </span>
                  <span className={styles.heroStagePriceBadge} style={{ background: activeExperience.color }}>
                    <strong>✨ 2 Hours VIP Suite</strong>
                  </span>
                </div>

                {/* Bottom Overlay Info & Action */}
                <div className={styles.heroStageBottomOverlay}>
                  <div>
                    <h3 className={styles.heroStageTitle}>{activeExperience.name}</h3>
                    <p className={styles.heroStageInclusions}>
                      {activeExperience.badge} · 180&quot; 4K Screen · Dolby 7.1 · Upto 10 Guests
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.heroStageBookBtn}
                    style={{ background: activeExperience.color, color: '#ffffff' }}
                    onClick={() => handleOpenBooking(vibe)}
                  >
                    Book This Room →
                  </button>
                </div>
              </div>

              {/* 3 Quick Thumbnails Selector */}
              <div className={styles.heroThumbnailsRow}>
                {EXPERIENCES.map((exp) => {
                  const expVibe = exp.slug.replace('-theme', '') as 'pink' | 'purple' | 'red';
                  const isActive = vibe === expVibe;
                  return (
                    <button
                      type="button"
                      key={exp.id}
                      className={`${styles.heroThumbBtn} ${isActive ? styles.heroThumbBtnActive : ''}`}
                      style={{ borderColor: isActive ? exp.color : undefined }}
                      onClick={() => handleSelectVibe(expVibe)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={exp.image} alt={exp.shortName} className={styles.heroThumbImg} />
                      <div className={styles.heroThumbText}>
                        <span className={styles.heroThumbName}>{exp.shortName}</span>
                        <span className={styles.heroThumbPrice} style={{ color: exp.color, fontWeight: 700 }}>
                          2 Hours Suite
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Trust Metrics Bar */}
          <div className={styles.trustBar}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🎬</span>
              <div>
                <strong>180&quot; 4K Laser Screen</strong>
                <span>Cinematic Visuals</span>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🔊</span>
              <div>
                <strong>7.1 Dolby Atmos</strong>
                <span>Immersive Surround</span>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🔒</span>
              <div>
                <strong>100% Private Room</strong>
                <span>Acoustic Soundproof</span>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>🎮</span>
              <div>
                <strong>PS5 Gaming Arena</strong>
                <span>2 DualSense Controllers</span>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>⏰</span>
              <div>
                <strong>10 AM – 12 AM (Midnight)</strong>
                <span>Flexible Time Slots</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Signature Themes */}
      <section id="vibes" className={styles.section + ' ' + styles.reveal}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className={styles.heroBadge} style={{ display: 'inline-flex', marginBottom: '12px' }}>
              <Heart size={14} color="var(--accent)" /> OUR 3 OFFICIAL THEMES
            </div>
            <h2 className={styles.sectionTitle} style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
              Signature Celebration Setups
            </h2>
            <p className={styles.sectionSub} style={{ maxWidth: '680px', margin: '0 auto' }}>
              Choose from our 3 authentic handcrafted celebration themes. Every booking gets 100% private access to the entire air-conditioned theater suite with 180&quot; 4K screen and Dolby sound.
            </p>
          </div>

          <div className={styles.vibeShowcaseGrid}>
            {THEMES_PREVIEWS.map((pkg) => {
              const pkgVibe = pkg.id as 'pink' | 'purple' | 'red';
              const isActive = vibe === pkgVibe;
              return (
                <div
                  key={'theme-' + pkg.id}
                  className={`${styles.showcaseCard} ${isActive ? styles.showcaseCardActive : ''}`}
                  onClick={() => handleSelectVibe(pkgVibe)}
                  style={{
                    border: isActive ? `2px solid ${pkg.color}` : `1px solid ${pkg.color}33`,
                    boxShadow: isActive
                      ? `0 16px 45px rgba(0, 0, 0, 0.8), 0 0 30px ${pkg.color}35`
                      : `0 12px 36px rgba(0, 0, 0, 0.6), 0 0 16px ${pkg.color}15`,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pkg.image} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: pkg.color,
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '5px 12px',
                      borderRadius: '20px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}>
                      {pkg.badge}
                    </div>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      background: 'rgba(10, 10, 14, 0.85)',
                      backdropFilter: 'blur(8px)',
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}>
                      📸 Real Room Photo
                    </div>
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '60px',
                      background: 'linear-gradient(to top, rgba(10, 10, 14, 0.95), transparent)'
                    }} />
                  </div>

                  <div className={styles.showcaseContent} style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <h3 className={styles.showcaseTitle} style={{ color: pkg.color, fontSize: '1.25rem', marginBottom: '4px' }}>{pkg.name}</h3>
                    <div className={styles.showcasePrice} style={{ fontSize: '1.2rem', fontWeight: 800, color: '#09090b', marginBottom: '8px' }}>
                      <span style={{ color: '#09090b' }}>2 Hours Private Suite</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}> · All VIP Amenities Included</span>
                    </div>
                    <div style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      marginBottom: '14px',
                      fontSize: '0.82rem',
                      color: '#09090b',
                      lineHeight: '1.5'
                    }}>
                      <div style={{ color: '#09090b', fontWeight: 800, marginBottom: '6px' }}>
                        🎁 Complimentary Inclusions with Coupon Code BEEVIBE999:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '0.78rem', color: '#475569' }}>
                        <span>🌫️ Fog Entry Effect</span>
                        <span>🎈 Floor Balloons Setup</span>
                        <span>🕯️ Candle &amp; Table Decor</span>
                        <span>💡 Custom LED Name Board</span>
                        <span style={{ gridColumn: 'span 2' }}>📺 All OTT Platforms (Netflix, Prime, Hotstar &amp; More)</span>
                      </div>
                    </div>
                    <ul className={styles.showcaseList} style={{ flexGrow: 1, marginBottom: '20px' }}>
                      {pkg.features.map((f, i) => (
                        <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', marginBottom: '8px', color: '#334155' }}>
                          <span style={{ color: pkg.color, fontWeight: 'bold' }}>✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBooking(pkgVibe);
                      }}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: pkg.color,
                        borderColor: pkg.color,
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                    >
                      Book {pkg.shortName} Theme →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 2.5: PS5 Pixel Gaming Realm Showcase */}
      <section id="gaming-banner" className={styles.section + ' ' + styles.reveal} style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #00f0ff',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.05), 0 0 25px rgba(0, 240, 255, 0.12)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0891b2', fontFamily: 'var(--font-vt323), monospace', fontSize: '1.4rem', marginBottom: '8px' }}>
                <Gamepad2 size={24} color="#0891b2" /> NEW: PIXEL EDITION PS5 GAMING LOUNGE
              </div>
              <h2 className={styles.sectionTitle} style={{ textAlign: 'left', marginBottom: '12px', color: '#09090b', fontSize: '2rem' }}>
                Sony PlayStation 5 Console + 2 Wireless Controllers
              </h2>
              <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Step into Bangalore&apos;s premier private PS5 gaming lounge. Equipped with <strong>1 Sony PlayStation 5</strong>, <strong>2 DualSense Wireless Controllers</strong>, and top multiplayer games (EA FC 24 / FIFA, Tekken 8, Mortal Kombat 1, Spider-Man 2, Call of Duty, Gran Turismo 7) on our 180&quot; 4K Screen with 7.1 Dolby surround sound!
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link href="/gaming" className="btn btn-primary" style={{ background: '#09090b', border: '1px solid #09090b', color: '#ffffff', fontWeight: 700 }}>
                  Enter Gaming World 🎮
                </Link>
                <Link href="/gaming/book" className="btn btn-secondary" style={{ borderColor: '#cbd5e1', color: '#09090b' }}>
                  Book PS5 Gaming Slot
                </Link>
              </div>
            </div>

            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.4)', height: '240px' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/gallery/ps5-gaming.jpg" alt="PS5 Gaming Lounge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #00f0ff', color: '#00f0ff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                180&quot; 4K Laser Display · DualSense Wireless · Till 12 AM
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Amenities */}
      <section id="features" className={styles.section + ' ' + styles.reveal}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 className={styles.sectionTitle} style={{ fontSize: '2.5rem' }}>Designed for Ultimate Comfort</h2>
            <p className={styles.sectionSub} style={{ maxWidth: '600px', margin: '0 auto' }}>
              We combine high-end cinema electronics with custom interior designing to deliver a premium private space.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Gamepad2 color="#00f0ff" /></div>
              <h3 className={styles.featureTitle}>PS5 + 2 Controllers</h3>
              <p className={styles.featureDesc}>1x Sony PlayStation 5 with 2 DualSense wireless controllers & top games for head-to-head multiplayer battles.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Tv color="#f2a900" /></div>
              <h3 className={styles.featureTitle}>180&quot; 4K Projector Screen</h3>
              <p className={styles.featureDesc}>Stunning high-contrast cinematic screens that support Netflix, Hotstar, YouTube, or your custom media files.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Volume2 color="#a855f7" /></div>
              <h3 className={styles.featureTitle}>7.1 Dolby surround sound</h3>
              <p className={styles.featureDesc}>Full room-shaking audio calibration that places you directly inside the cinematic action.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Sparkles color="#ec4899" /></div>
              <h3 className={styles.featureTitle}>Custom Vibe Lighting</h3>
              <p className={styles.featureDesc}>Interactive control over ambient colors, panel lights, and spotlights to suit the mood of your party.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><Coffee color="#10b981" /></div>
              <h3 className={styles.featureTitle}>Snack Bar & Kitchen</h3>
              <p className={styles.featureDesc}>Hot popcorn, cold drinks, cakes, mocktails, and finger foods prepared fresh and served straight to your seats.</p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}><ShieldCheck color="#3b82f6" /></div>
              <h3 className={styles.featureTitle}>100% Private & Soundproof</h3>
              <p className={styles.featureDesc}>Total security and acoustic isolation so you can shout, play, sing, or talk without disturbances.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Photo Gallery with Authentic BeeVibe Photography */}
      <GallerySection />

      {/* Interactive Google Map Location Section */}
      <section id="location" style={{ padding: '60px 0', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className={styles.heroBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="#09090b" /> OUR LOCATION
            </div>
            <h2 className={styles.sectionTitle} style={{ marginTop: '8px' }}>
              Visit Bee Vibe Theater
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '0.95rem' }}>
              1340, 2nd floor, 41st Cross road, 4th gate, opposite to Jain University, Jayanagara 9th Block, Bengaluru, Karnataka 560041
            </p>
          </div>

          <div style={{
            position: 'relative',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
            background: '#ffffff',
            height: '420px',
            width: '100%'
          }}>
            <iframe
              title="Bee Vibe Private Celebration Theater Location Map"
              src="https://maps.google.com/maps?q=1340%2C+2nd+floor%2C+41st+Cross+road%2C+4th+gate%2C+opposite+to+Jain+University%2C+Jayanagara+9th+Block%2C+Bengaluru%2C+Karnataka+560041&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              zIndex: 10
            }}>
              <a
                href="https://maps.app.goo.gl/c4TBh9zeaUDJEh7X8"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  fontSize: '0.85rem',
                  borderRadius: '30px'
                }}
              >
                <MapPin size={16} /> Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: FAQ */}
      <section id="faq" className={styles.section + ' ' + styles.reveal}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.sectionSub}>Everything you need to know about celebrating at Bee Vibe.</p>
          </div>

          <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              {
                q: 'How many guests can occupy the private theater?',
                a: 'Our private celebration theater comfortably accommodates up to 10 guests. Base package covers 2 members, and additional guests can be comfortably accommodated with plush couch seating.',
              },
              {
                q: 'What are the operating hours and can we book after 12 AM?',
                a: 'Bee Vibe operates daily from 10:00 AM to 12:00 AM Midnight. Our venue closes strictly at 12:00 AM Midnight to ensure compliance and guest safety.',
              },
              {
                q: 'Can we play our own movies, videos, and music?',
                a: 'Yes! You can connect your phone, laptop, or USB to our 180" 4K screen, or stream through Netflix, Prime Video, YouTube, Disney+ Hotstar, and Spotify.',
              },
              {
                q: 'Is an advance payment required for booking confirmation?',
                a: 'Yes, a nominal advance deposit is required via UPI (GPay, PhonePe, Paytm) to lock your date and time slot. The remaining balance is paid upon check-in at the venue.',
              },
              {
                q: 'Are food, cakes, and snacks allowed inside?',
                a: 'You are welcome to bring your celebration cake. We also offer fresh popcorn, cold drinks, mocktails, and finger foods from our in-house menu.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className={styles.faqItem + (activeFaq === idx ? ' ' + styles.faqItemActive : '')}
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div className={styles.faqQuestion}>
                  <span style={{ fontWeight: 600, color: '#09090b' }}>{faq.q}</span>
                  <ChevronDown size={18} className={styles.faqIcon} />
                </div>
                {activeFaq === idx && (
                  <div className={styles.faqAnswer} style={{ padding: '12px 18px', color: '#475569', fontSize: '0.9rem', lineHeight: '1.5' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Width Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <Link href="/" className={styles.logoWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bee-vibe-logo.png?v=4"
                  alt="BeeVibe Mini Private Theater"
                  className={styles.logoImg}
                  style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <p className={styles.footerDesc}>
                Bangalore&apos;s #1 Luxury Private Party Hall, Mini Cinema &amp; PS5 Gaming Space in Jayanagar 9th Block.
              </p>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Quick Links</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/gaming">PS5 Gaming Lounge 🎮</Link></li>
                <li><a href="#vibes">Our 3 Themes</a></li>
                <li><a href="#gallery">Photo Gallery</a></li>
                <li><Link href="/book">Book Celebration</Link></li>
                <li><Link href="/secret-owner-portal">Staff Portal</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Location & Timing</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.6' }}>
                1340, 2nd floor, 41st Cross road, 4th gate, opposite to Jain University, Jayanagara 9th Block, Bengaluru, Karnataka 560041
              </p>
              <p style={{ color: 'var(--accent)', fontSize: '0.85rem', fontWeight: 600, marginTop: '8px' }}>
                ⏰ Open Daily: 10:00 AM – 12:00 AM Midnight
              </p>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Contact & WhatsApp</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                📞 +91 9900106474
              </p>
              <a
                href="https://wa.me/919900106474"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px 16px', fontSize: '0.85rem', backgroundColor: '#25D366', borderColor: '#25D366', color: '#ffffff' }}
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} Bee Vibe Party Hall. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile Booking CTA */}
      <div className={styles.stickyMobileCta}>
        <div className={styles.stickyMobileCtaText}>
          <span className={styles.stickyFrom}>
            {activeExperience.shortName} VIP Suite · 2 Hours
          </span>
          <span className={styles.stickySub}>Includes Fog, Balloons, LED &amp; OTT</span>
        </div>
        <button
          type="button"
          onClick={() => handleOpenBooking(vibe)}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}
        >
          Reserve VIP Suite →
        </button>
      </div>

      {/* Tap-to-Copy Coupon Toast Feedback */}
      {copiedCodeToast && (
        <div className={styles.tickerToast}>
          <span>✓</span>
          <span>Coupon Code <strong>BEEVIBE999</strong> Copied! Apply it at payment checkout.</span>
        </div>
      )}

      {/* Quick Booking Modal with Basic Details & Number */}
      <QuickBookingModal
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        initialTheme={vibe}
        onSwitchToFullPortal={handleSwitchToFullPortal}
      />

      {/* Full Customizer Lightbox Modal (only if explicitly requested) */}
      {isFullBookingOpen && (
        <div className={styles.bookingModalBackdrop} onClick={() => setIsFullBookingOpen(false)}>
          <div className={styles.bookingModalContainer} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.bookingModalClose}
              onClick={() => setIsFullBookingOpen(false)}
              aria-label="Close booking modal"
            >
              ✕
            </button>
            <BookingPortal
              initialTheme={vibe}
              isModal={true}
              onClose={() => setIsFullBookingOpen(false)}
              onPackageSelect={(pkg) => {
                if (pkg.slug.includes('pink')) handleSelectVibe('pink');
                else if (pkg.slug.includes('purple')) handleSelectVibe('purple');
                else if (pkg.slug.includes('red')) handleSelectVibe('red');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
