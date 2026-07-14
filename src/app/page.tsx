'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import dynamic from 'next/dynamic';
import BookingPortal from '@/components/BookingPortal';

const ThreeTheater = dynamic(() => import('@/components/ThreeTheater'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: 'var(--text-muted)',
      fontFamily: 'var(--font-title)',
      fontSize: '0.9rem'
    }}>
      Loading interactive room preview...
    </div>
  )
});
import {
  Tv,
  Volume2,
  Smile,
  Heart,
  Gamepad2,
  Sparkles,
  ShieldCheck,
  Coffee,
  Cake,
  Phone,
  MapPin,
  Clock,
  Instagram
} from 'lucide-react';

type VibeType = 'amber' | 'cyan' | 'pink' | 'purple';

export default function Home() {
  const [vibe, setVibe] = useState<VibeType>('amber');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // 1. Calculate scroll progress (0 to 1) for the scrollytelling camera path and check scroll offset
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const totalScrollable = docHeight - windowHeight;

      if (totalScrollable <= 0) return;

      const progress = Math.min(Math.max(window.scrollY / totalScrollable, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Trigger initial calculation
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 2. Set up IntersectionObserver to trigger scroll-reveal animations on grid elements
  useEffect(() => {
    const observerOptions = {
      root: null, // viewport
      threshold: 0.1, // trigger when 10% visible
      rootMargin: '0px 0px -50px 0px', // slightly offset trigger point
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealActive);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Query and observe elements with the 'reveal' class
    const revealElements = document.querySelectorAll(`.${styles.reveal}`);
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // 3. Track cursor positions on cards for spotlight hover effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const cards = document.querySelectorAll(`.${styles.showcaseCard}, .${styles.featureCard}`);
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const vibeLabels = {
    amber: 'Honey Amber (Cozy Vibe)',
    cyan: 'Cyber Cyan (Gaming Vibe)',
    pink: 'Rose Pink (Romance Vibe)',
    purple: 'Neon Purple (Party Vibe)',
  };

  return (
    <div className={styles.main} data-vibe={vibe}>
      {/* Scroll Progress Bar */}
      <div className={styles.scrollProgressBar} style={{ transform: `scaleX(${scrollProgress})`, transformOrigin: 'left' }} />

      {/* Dynamic Background Glows */}
      <div className="ambient-glow-bg" />
      <div className="gradient-overlay" />

      {/* Navigation Header */}
      <div className={`${styles.headerContainer} ${isScrolled ? styles.headerContainerScrolled : ''}`}>
        <div className="container" style={{ position: 'relative' }}>
          <header className={styles.header}>
            <div className={styles.logo}>
              <Image
                src="/bee-vibe-logo.png"
                alt="Bee Vibe Logo"
                width={160}
                height={60}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <nav className={styles.desktopNav}>
              <ul className={styles.navLinks}>
                <li><a href="#vibes" className={styles.navLink}>Our Vibes</a></li>
                <li><a href="#features" className={styles.navLink}>Amenities</a></li>
                <li><a href="#book" className={styles.navLink}>Booking Portal</a></li>
                <li style={{ display: 'flex', alignItems: 'center' }}>
                  <a
                    href="https://www.instagram.com/beevibe_partyhall/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.navLink}
                    aria-label="Instagram"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <Instagram size={18} style={{ verticalAlign: 'middle' }} />
                  </a>
                </li>
              </ul>
            </nav>
            <div className={styles.headerActions}>
              <a href="#book" className="btn btn-primary btn-nav" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                Book Now
              </a>
              <button
                className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerActive : ''}`}
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
          <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuActive : ''}`}>
            <ul className={styles.mobileNavLinks}>
              <li>
                <a href="#vibes" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  Our Vibes
                </a>
              </li>
              <li>
                <a href="#features" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  Amenities
                </a>
              </li>
              <li>
                <a href="#book" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
                  Booking Portal
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/beevibe_partyhall/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.mobileNavLink}
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Instagram size={20} /> Instagram
                </a>
              </li>
              <li style={{ width: '100%', marginTop: '12px' }}>
                <a href="#book" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsMobileMenuOpen(false)}>
                  Book Now
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Split Scrollytelling Screen Layout */}
      <div className="container" style={{ position: 'relative' }}>
        <div className={styles.splitLayout}>

          {/* Left Column: Normal Scrollable text sections */}
          <div className={styles.scrollingContent}>

            {/* Section 1: Hero */}
            <section id="hero" className={styles.heroSection}>
              <div className={styles.heroContent}>
                <div className={styles.tagline}>Mini Private Theater</div>
                <h1 className={styles.heroTitle}>
                  Your Private Cinema.<br />
                  <span className="text-glow" style={{ color: 'var(--accent)', transition: 'color 0.5s' }}>
                    Your Custom Vibe.
                  </span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Experience luxury entertainment designed for small celebrations, romantic dates, gamer sessions, or birthday bashes. Gather up to 10 guests and enjoy massive screens, premium audio, and customizable mood lighting.
                </p>

                {/* Vibe Selection Panel */}
                <div className={styles.vibePanel}>
                  <div className={styles.vibeTitle}>Set Room Mood Lighting:</div>
                  <div className={styles.vibeButtons}>
                    <button
                      className={`${styles.vibeBtn} ${vibe === 'amber' ? styles.vibeBtnActive : ''}`}
                      onClick={() => setVibe('amber')}
                    >
                      <span className={styles.colorIndicator} style={{ backgroundColor: '#f2a900' }} />
                      Amber
                    </button>
                    <button
                      className={`${styles.vibeBtn} ${vibe === 'cyan' ? styles.vibeBtnActive : ''}`}
                      onClick={() => setVibe('cyan')}
                    >
                      <span className={styles.colorIndicator} style={{ backgroundColor: '#00d4ff' }} />
                      Cyan
                    </button>
                    <button
                      className={`${styles.vibeBtn} ${vibe === 'pink' ? styles.vibeBtnActive : ''}`}
                      onClick={() => setVibe('pink')}
                    >
                      <span className={styles.colorIndicator} style={{ backgroundColor: '#ff2e7e' }} />
                      Pink
                    </button>
                    <button
                      className={`${styles.vibeBtn} ${vibe === 'purple' ? styles.vibeBtnActive : ''}`}
                      onClick={() => setVibe('purple')}
                    >
                      <span className={styles.colorIndicator} style={{ backgroundColor: '#9333ea' }} />
                      Purple
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                    Currently active: {vibeLabels[vibe]}
                  </div>
                </div>

                <div className={styles.heroCtas}>
                  <a href="#book" className="btn btn-primary">
                    Reserve Your Screen
                  </a>
                  <a href="#vibes" className="btn btn-secondary">
                    Explore Packages
                  </a>
                </div>
              </div>
            </section>

            {/* Section 2: Packages (Trigger camera shift 1) */}
            <section id="vibes" className={`${styles.section} ${styles.reveal}`}>
              <h2 className={styles.sectionTitle}>Signature Celebration Packages</h2>
              <p className={styles.sectionSub}>
                Every package includes a full 2-hour private theater screen reservation, massive Dolby acoustics, and comfortable seating — starting from just ₹999.
              </p>

              <div className={styles.vibeShowcaseGrid}>
                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#f2a900' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>🎥 Movie Vibe Pack</h3>
                    <div className={styles.showcasePrice}>₹999 + slot fee</div>
                    <ul className={styles.showcaseList}>
                      <li>Exclusive 2-hour screen booking</li>
                      <li>4K Projection & Dolby Surround sound</li>
                      <li>2 Large popcorn tubs + beverages</li>
                      <li>Warm amber ambient lighting controls</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#9333ea' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>🎂 Birthday Bash Vibe</h3>
                    <div className={styles.showcasePrice}>₹1,999 + slot fee</div>
                    <ul className={styles.showcaseList}>
                      <li>Full birthday balloon decorations (Gold/Black)</li>
                      <li>1kg Rich Chocolate Fudge Cake included</li>
                      <li>Custom screen greeting animation intro</li>
                      <li>Party poppers and party props</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#ff2e7e' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>💖 Cozy Romance Vibe</h3>
                    <div className={styles.showcasePrice}>₹2,499 + slot fee</div>
                    <ul className={styles.showcaseList}>
                      <li>Red carpet and glowing candle pathway</li>
                      <li>Rose petals floor decorations</li>
                      <li>Fresh welcome mocktails & rose bouquet</li>
                      <li>Custom photo slide projections on screen</li>
                    </ul>
                  </div>
                </div>

                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#00d4ff' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>🎮 Ultimate Gaming Vibe</h3>
                    <div className={styles.showcasePrice}>₹1,499 + slot fee</div>
                    <ul className={styles.showcaseList}>
                      <li>Massive screen multiplayer console connections</li>
                      <li>4 Premium wireless controllers</li>
                      <li>Cyberpunk neon ambient light settings</li>
                      <li>Gamer Snack Platter (Nachos, Energy Drinks)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Amenities (Trigger camera shift 2) */}
            <section id="features" className={`${styles.section} ${styles.reveal}`}>
              <h2 className={styles.sectionTitle}>Designed for Ultimate Comfort</h2>
              <p className={styles.sectionSub}>
                We combine high-end cinema electronics with custom interior designing to deliver an premium private space.
              </p>

              <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}><Tv /></div>
                  <h3 className={styles.featureTitle}>180" 4K Projector Screen</h3>
                  <p className={styles.featureDesc}>Stunning high-contrast cinematic screens that support Netflix, Hotstar, YouTube, or your custom media files.</p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}><Volume2 /></div>
                  <h3 className={styles.featureTitle}>7.1 Dolby surround sound</h3>
                  <p className={styles.featureDesc}>Full room-shaking audio calibration that places you directly inside the cinematic action.</p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}><Sparkles /></div>
                  <h3 className={styles.featureTitle}>Custom Vibe Lighting</h3>
                  <p className={styles.featureDesc}>Interactive control over ambient colors, panel lights, and spotlights to suit the mood of your party.</p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}><Coffee /></div>
                  <h3 className={styles.featureTitle}>Snack Bar & Kitchen</h3>
                  <p className={styles.featureDesc}>Hot popcorn, cold drinks, cakes, mocktails, and finger foods prepared fresh and served straight to your seats.</p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}><ShieldCheck /></div>
                  <h3 className={styles.featureTitle}>100% Private & Soundproof</h3>
                  <p className={styles.featureDesc}>Total security and acoustic isolation so you can shout, play, sing, or talk without disturbances.</p>
                </div>

                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}><Cake /></div>
                  <h3 className={styles.featureTitle}>Decoration Assistance</h3>
                  <p className={styles.featureDesc}>Custom design setup for proposal setups, anniversaries, promotions, baby showers, or children's birthdays.</p>
                </div>
              </div>
            </section>

            {/* Section 4: Booking Center (Trigger camera shift 3) */}
            <section id="book" className={`${styles.section} ${styles.reveal}`}>
              <h2 className={styles.sectionTitle}>Book Your Celebration</h2>
              <p className={styles.sectionSub}>
                Select a date, check available slots, select a package, and reserve your private cinema ticket instantly.
              </p>

              <div className={styles.bookingBox}>
                <BookingPortal />
              </div>
            </section>

          </div>

          {/* Right Column: Sticky viewport container holding the 3D canvas */}
          <div className={styles.stickyColumn}>
            <div className={styles.canvasWrapper}>
              <ThreeTheater vibe={vibe} scrollProgress={scrollProgress} />
            </div>
          </div>

        </div>
      </div>

      {/* Full Width Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <div className={styles.logo}>
                <Image
                  src="/bee-vibe-logo.png"
                  alt="Bee Vibe Logo"
                  width={160}
                  height={60}
                  style={{ objectFit: 'contain' }}
                />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Premium mini private theaters across the city designed for celebrations, dates, movies, and gaming events. Your premium space, your custom vibe.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="var(--accent)" />
                  <a href="tel:8123501013" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-accent">
                    +91 81235 01013
                  </a>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Instagram size={16} color="var(--accent)" />
                  <a
                    href="https://www.instagram.com/beevibe_partyhall/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none' }}
                    className="hover-accent"
                  >
                    @beevibe_partyhall
                  </a>
                </span>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=1340%2C+41st+cross+road%2C+near+jain+university+4th+grade%2C+jayanagar+9th+block%2C+bangalore%2C+India"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none', lineHeight: '1.4' }}
                    className="hover-accent"
                  >
                    1340, 41st cross road, near jain university 4th grade, jayanagar 9th block, bangalore, India
                  </a>
                </span>
              </div>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerTitle}>Quick Links</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#vibes" className={styles.footerLink}>Packages</a></li>
                <li><a href="#features" className={styles.footerLink}>Amenities</a></li>
                <li><a href="#book" className={styles.footerLink}>Book Tickets</a></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerTitle}>Opening Hours</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} color="var(--accent)" /> Daily: 10:00 AM - 11:30 PM</span>
                <span>Pre-booking mandatory. Pre-decoration available on demand.</span>
              </div>
            </div>
          </div>

          <div className={styles.copyright}>
            <p>&copy; {new Date().getFullYear()} Bee Vibe Mini Private Theater. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
