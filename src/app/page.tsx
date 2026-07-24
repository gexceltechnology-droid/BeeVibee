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
  Clock,
  ChevronDown,
  HelpCircle
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
      <linearGradient id="goldBodyPage" x1="10" y1="35" x2="68" y2="85" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff7b8" />
        <stop offset="25%" stopColor="#f7cd48" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="75%" stopColor="#a3760d" />
        <stop offset="100%" stopColor="#5c3f00" />
      </linearGradient>

      <linearGradient id="goldReelPage" x1="15" y1="10" x2="45" y2="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffcc" />
        <stop offset="50%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#7a5500" />
      </linearGradient>

      <linearGradient id="goldReelBigPage" x1="40" y1="5" x2="75" y2="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffffcc" />
        <stop offset="50%" stopColor="#f7cd48" />
        <stop offset="100%" stopColor="#8a6000" />
      </linearGradient>

      <linearGradient id="goldLensPage" x1="68" y1="40" x2="95" y2="75" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#fff3a8" />
        <stop offset="40%" stopColor="#d4af37" />
        <stop offset="100%" stopColor="#5c3f00" />
      </linearGradient>

      <linearGradient id="goldHighlightPage" x1="0" y1="0" x2="0" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Small Reel Top Left */}
    <circle cx="28" cy="27" r="16" fill="url(#goldReelPage)" stroke="#4a3400" strokeWidth="1.2" />
    <circle cx="28" cy="27" r="14.5" fill="none" stroke="url(#goldHighlightPage)" strokeWidth="0.9" />
    <circle cx="28" cy="27" r="3.8" fill="#141006" />
    <circle cx="28" cy="17.5" r="2.6" fill="#141006" />
    <circle cx="28" cy="36.5" r="2.6" fill="#141006" />
    <circle cx="18.5" cy="27" r="2.6" fill="#141006" />
    <circle cx="37.5" cy="27" r="2.6" fill="#141006" />

    {/* Large Reel Top Right */}
    <circle cx="58" cy="22" r="20" fill="url(#goldReelBigPage)" stroke="#4a3400" strokeWidth="1.2" />
    <circle cx="58" cy="22" r="18.5" fill="none" stroke="url(#goldHighlightPage)" strokeWidth="0.9" />
    <circle cx="58" cy="22" r="4.8" fill="#141006" />
    <circle cx="58" cy="10" r="3.4" fill="#141006" />
    <circle cx="58" cy="34" r="3.4" fill="#141006" />
    <circle cx="46" cy="22" r="3.4" fill="#141006" />
    <circle cx="70" cy="22" r="3.4" fill="#141006" />

    {/* Main Camera Body (Rounded Box) */}
    <rect x="12" y="42" width="56" height="38" rx="8.5" fill="url(#goldBodyPage)" stroke="#4a3400" strokeWidth="1.4" />
    <rect x="13.5" y="43.5" width="53" height="35" rx="7" fill="none" stroke="url(#goldHighlightPage)" strokeWidth="1.1" />

    {/* Camera Lens Cone (Trapezoid) */}
    <path d="M 68 49 L 92 38 L 92 80 L 68 69 Z" fill="url(#goldLensPage)" stroke="#4a3400" strokeWidth="1.4" />
    <path d="M 69.5 51 L 90.5 41.5 L 90.5 76.5 L 69.5 67 Z" fill="none" stroke="url(#goldHighlightPage)" strokeWidth="0.9" />
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: 'How many guests can fit in the private theater?',
      a: 'The theater holds up to 10 guests. The base package covers 2 members, and additional guests can join for ₹100 per head.'
    },
    {
      q: 'How can I play my own content or movies?',
      a: 'We provide casting support, Chromecast, and high-speed Wi-Fi to screen from your preferred platforms (Netflix, Prime Video, Hotstar, YouTube, etc.) or connect custom files via HDMI.'
    },
    {
      q: 'Is outside food and drinks allowed?',
      a: 'We have an on-site gourmet snack bar serving fresh popcorn, mocktails, and hot appetizers. Outside beverages and main courses are restricted, but celebration cakes and baby food are fully allowed.'
    },
    {
      q: 'What is the refund and rescheduling policy?',
      a: 'You can reschedule your slot free of charge up to 24 hours prior to your booking. Cancellations made 24 hours in advance receive a full refund minus a 5% processing fee.'
    },
    {
      q: 'Do you provide decorations for special occasions?',
      a: 'Yes! Custom celebration lighting is included. For premium setups (balloon arches, flower paths, proposal signs, and fog entry), you can add decorations in Step 3 of the booking process.'
    }
  ];

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
                <BeeVibeLogoIcon />
              </div>
              <div className={styles.logoText}>
                <span className={styles.logoBrand}>BeeVibe</span>
                <span className={styles.logoSub}>PRIVATE CELEBRATION THEATER</span>
              </div>
            </div>
            <nav className={styles.desktopNav}>
              <ul className={styles.navLinks}>
                <li><a href="#vibes" className={styles.navLink}>Our Vibes</a></li>
                <li><a href="#features" className={styles.navLink}>Amenities</a></li>
                <li><a href="#location" className={styles.navLink}>Location</a></li>
                <li><a href="#faq" className={styles.navLink}>FAQ</a></li>
                <li><Link href="/book" className={styles.navLink}>Booking Portal</Link></li>
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
                <div className={styles.tagline}>Private Celebration Theater</div>
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

            {/* Section 4: FAQ */}
            <section id="faq" className={`${styles.section} ${styles.reveal}`}>
              <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
              <p className={styles.sectionSub}>
                Everything you need to know about booking, amenities, media streaming, and celebration planning.
              </p>

              <div className={styles.faqAccordion}>
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}
                    >
                      <button
                        className={styles.faqQuestion}
                        onClick={() => setOpenFaq(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                      >
                        <span className={styles.faqQuestText}>
                          <HelpCircle size={18} className={styles.faqQuestIcon} style={{ flexShrink: 0 }} />
                          {faq.q}
                        </span>
                        <ChevronDown size={18} className={styles.faqArrow} />
                      </button>
                      <div className={styles.faqAnswer}>
                        <div className={styles.faqAnswerInner}>
                          <p>{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {/* Interactive Google Map Location Section */}
      <section id="location" style={{ padding: '60px 0', borderTop: '1px solid var(--glass-border)', background: 'rgba(10, 10, 12, 0.4)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className={styles.heroBadge} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={14} color="var(--accent)" /> OUR LOCATION
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
            border: '1px solid var(--glass-border)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(242, 169, 0, 0.08)',
            background: 'var(--glass-bg)',
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
                href="https://www.google.com/maps/search/?api=1&query=1340%2C+2nd+floor%2C+41st+Cross+road%2C+4th+gate%2C+opposite+to+Jain+University%2C+Jayanagara+9th+Block%2C+Bengaluru%2C+Karnataka+560041"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  fontSize: '0.85rem',
                  borderRadius: '30px',
                  boxShadow: '0 8px 24px rgba(242, 169, 0, 0.4)'
                }}
              >
                <MapPin size={16} /> Open in Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Full Width Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <div className={styles.logoWrapper}>
                <div className={styles.logoIcon}>
                  <BeeVibeLogoIcon />
                </div>
                <div className={styles.logoText}>
                  <span className={styles.logoBrand}>BeeVibe</span>
                  <span className={styles.logoSub}>PRIVATE CELEBRATION THEATER</span>
                </div>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Premium private celebration theaters across the city designed for celebrations, dates, movies, and gaming events. Your premium space, your custom vibe.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={16} color="var(--accent)" />
                  <a href="tel:9900106474" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-accent">
                    +91 99001 06474
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
                    href="https://www.google.com/maps/search/?api=1&query=1340%2C+2nd+floor%2C+41st+Cross+road%2C+4th+gate%2C+opposite+to+Jain+University%2C+Jayanagara+9th+Block%2C+Bengaluru%2C+Karnataka+560041"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'inherit', textDecoration: 'none', lineHeight: '1.4' }}
                    className="hover-accent"
                  >
                    1340, 2nd floor, 41st Cross road, 4th gate, opposite to Jain University, Jayanagara 9th Block, Bengaluru, Karnataka 560041
                  </a>
                </span>
              </div>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerTitle}>Quick Links</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#vibes" className={styles.footerLink}>Packages</a></li>
                <li><a href="#features" className={styles.footerLink}>Amenities</a></li>
                <li><a href="#location" className={styles.footerLink}>Location Map</a></li>
                <li><a href="#faq" className={styles.footerLink}>FAQ</a></li>
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
            <p>&copy; {new Date().getFullYear()} Bee Vibe Private Celebration Theater. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
