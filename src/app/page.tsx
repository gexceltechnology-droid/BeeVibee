'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import InteractiveShowcase from '@/components/InteractiveShowcase';
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
  Clock
} from 'lucide-react';

// Custom Instagram icon component for maximum reliability
const Instagram = ({ size = 24, color = "currentColor", ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const PartyPopperIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="#f2a900"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ filter: 'drop-shadow(0 0 6px rgba(242, 169, 0, 0.5))' }}
  >
    <path d="M5.8 11.3 2 22l10.7-3.8C11 15.6 8.4 13 5.8 11.3Z" />
    <path d="m4 15 3 3" />
    <path d="M13 13c1.4-1.4 3.7-1.4 5.1 0 1.4 1.4 1.4 3.7 0 5.1-1.4 1.4-3.7 1.4-5.1 0-1.4-1.4-1.4-3.7 0-5.1Z" />
    <line x1="13" y1="9" x2="13" y2="7" />
    <line x1="17" y1="5" x2="18" y2="4" />
    <line x1="21" y1="9" x2="22" y2="8" />
  </svg>
);

type VibeType = 'pink' | 'purple' | 'red';

export default function Home() {
  const [vibe, setVibe] = useState<VibeType>('pink');

  // Load saved vibe from localStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem('beevibe_theme') as VibeType | null;
    if (saved && ['pink', 'purple', 'red'].includes(saved)) {
      setVibe(saved);
    }
  }, []);

  // Save vibe to localStorage whenever it changes so /book page can read it
  useEffect(() => {
    localStorage.setItem('beevibe_theme', vibe);
  }, [vibe]);
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
    pink: 'Rose Pink Theme (₹799/2hrs)',
    purple: 'Neon Purple Theme (₹999/2hrs)',
    red: 'Crimson Red Theme (₹599/2hrs)',
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
            <div className={styles.logoWrapper}>
              <div className={styles.logoIcon}>
                <PartyPopperIcon />
              </div>
              <div className={styles.logoText}>
                <span className={styles.logoBrand}>BeeVibe</span>
                <span className={styles.logoSub}>MINI PRIVATE THEATER</span>
              </div>
            </div>
            <nav className={styles.desktopNav}>
              <ul className={styles.navLinks}>
                <li><a href="#vibes" className={styles.navLink}>Our Vibes</a></li>
                <li><a href="#features" className={styles.navLink}>Amenities</a></li>
                <li><Link href="/book" className={styles.navLink}>Booking Portal</Link></li>
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
              <Link href="/book" className="btn btn-primary btn-nav" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                Book Now
              </Link>
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
                <Link href="/book" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsMobileMenuOpen(false)}>
                  Book Now
                </Link>
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
                    <button
                      className={`${styles.vibeBtn} ${vibe === 'red' ? styles.vibeBtnActive : ''}`}
                      onClick={() => setVibe('red')}
                    >
                      <span className={styles.colorIndicator} style={{ backgroundColor: '#ef4444' }} />
                      Red
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '4px' }}>
                    Currently active: {vibeLabels[vibe]}
                  </div>
                </div>

                <div className={styles.mobileShowcase}>
                  <InteractiveShowcase vibe={vibe} />
                </div>

                <div className={styles.heroCtas}>
                  <Link href="/book" className="btn btn-primary">
                    Reserve Your Screen
                  </Link>
                  <a href="#vibes" className="btn btn-secondary">
                    Explore Packages
                  </a>
                </div>
              </div>
            </section>

            {/* Section 2: Packages (Trigger camera shift 1) */}
            <section id="vibes" className={`${styles.section} ${styles.reveal}`}>
              <h2 className={styles.sectionTitle}>Signature Celebration Themes</h2>
              <p className={styles.sectionSub}>
                Book the entire private party hall for your special screening. All themes include HD Projector, AC, and high-speed Wi-Fi.
              </p>

              <div className={styles.vibeShowcaseGrid}>
                {/* Pink Theme */}
                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#ff2e7e' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>🌸 Pink Theme</h3>
                    <div className={styles.showcasePrice}>₹799 / 2 Hrs</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Base price for 2 members</div>
                    <ul className={styles.showcaseList}>
                      <li>2-Hour full private hall booking</li>
                      <li>Warm Pink ambient lighting decor</li>
                      <li>Extra guest: ₹100 per head</li>
                      <li>DSLR Photo: ₹500/hr (optional)</li>
                      <li>Fog entry: ₹300 flat (optional)</li>
                    </ul>
                  </div>
                </div>

                {/* Purple Theme */}
                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#9333ea' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>🎂 Purple Theme</h3>
                    <div className={styles.showcasePrice}>₹999 / 2 Hrs</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Base price for 2 members</div>
                    <ul className={styles.showcaseList}>
                      <li>2-Hour full private hall booking</li>
                      <li>Vibrant Purple party lighting decor</li>
                      <li>Extra guest: ₹100 per head</li>
                      <li>DSLR Photo: ₹500/hr (optional)</li>
                      <li>Fog entry: ₹300 flat (optional)</li>
                    </ul>
                  </div>
                </div>

                {/* Red Theme */}
                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#ef4444' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>❤️ Red Theme</h3>
                    <div className={styles.showcasePrice}>₹599 / 2 Hrs</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Base price for 2 members</div>
                    <ul className={styles.showcaseList}>
                      <li>2-Hour full private hall booking</li>
                      <li>Romantic Crimson Red lighting setup</li>
                      <li>Extra guest: ₹100 per head</li>
                      <li>DSLR Photo: ₹500/hr (optional)</li>
                      <li>Fog entry: ₹300 flat (optional)</li>
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


          </div>

          {/* Right Column: Sticky viewport container holding the 3D canvas */}
          <div className={styles.stickyColumn}>
            <div className={styles.canvasWrapper}>
              <InteractiveShowcase vibe={vibe} />
            </div>
          </div>

        </div>
      </div>

      {/* Full Width Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <PartyPopperIcon />
                </div>
                <div className={styles.logoText}>
                  <span className={styles.logoBrand}>BeeVibe</span>
                  <span className={styles.logoSub}>MINI PRIVATE THEATER</span>
                </div>
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
                <li><Link href="/book" className={styles.footerLink}>Book Tickets</Link></li>
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
