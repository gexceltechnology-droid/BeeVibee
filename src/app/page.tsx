'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import styles from './page.module.css';

const InteractiveShowcase = dynamic(() => import('@/components/InteractiveShowcase'), {
  ssr: false,
  loading: () => (
    <div style={{ height: '350px', width: '100%', borderRadius: '20px', background: 'rgba(20, 20, 27, 0.4)', border: '1px solid rgba(255,255,255,0.05)' }} />
  ),
});
import WhatsAppBotWidget from '@/components/WhatsAppBotWidget';
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
  <img
    src="/bee-vibe-logo.png?v=2"
    alt="BeeVibe Mini Private Theater"
    style={{ height: size, width: 'auto', objectFit: 'contain' }}
  />
);

type VibeType = 'pink' | 'purple' | 'red';

export default function Home() {
  const [vibe, setVibe] = useState<VibeType>('purple');

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
      q: 'Do you have PS5 gaming available in the room?',
      a: 'Yes! We feature 1 Sony PS5 console equipped with 2 wireless DualSense controllers and popular games (EA FC 24 / FIFA, Tekken 8, Mortal Kombat 1, Spider-Man 2, Call of Duty, Gran Turismo 7). You can play 2-player multiplayer games on our 180" 4K screen with 7.1 Dolby surround sound.'
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

      {/* Interactive WhatsApp Bot Widget */}
      <WhatsAppBotWidget />

      {/* Navigation Header */}
      <div className={`${styles.headerContainer} ${isScrolled ? styles.headerContainerScrolled : ''}`}>

        <div className="container" style={{ position: 'relative' }}>
          <header className={styles.header}>
            <Link href="/" className={styles.logoWrapper}>
              <img
                src="/bee-vibe-logo.png?v=4"
                alt="BeeVibe Mini Private Theater"
                className={styles.logoImg}
                style={{ height: '115px', width: 'auto', objectFit: 'contain' }}
              />
            </Link>
            <nav className={styles.desktopNav}>
              <ul className={styles.navLinks}>
                <li><Link href="/gaming" className={styles.navLink} style={{ color: '#00f0ff', fontWeight: 'bold' }}>Gaming World 🎮</Link></li>
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
                <Link href="/gaming" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#00f0ff', fontWeight: 'bold' }}>
                  Gaming World 🎮
                </Link>
              </li>
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
                <div className={styles.tagline}>Bee Vibe Party Hall & Private Theater</div>
                <h1 className={styles.heroTitle}>
                  Bee Vibe Party Hall.<br />
                  <span className="text-glow" style={{ color: 'var(--accent)', transition: 'color 0.5s' }}>
                    Your Private Cinema & Space.
                  </span>
                </h1>
                <p className={styles.heroSubtitle}>
                  Experience Bangalore's top luxury private party hall and celebration theater in Jayanagar. Book custom mini party halls for intimate birthday bashes, anniversary surprises, romantic couple date nights, or multiplayer gaming with up to 10 guests.
                </p>

                {/* Vibe Selection Panel */}
                <div className={styles.vibePanel}>
                  <div className={styles.vibeTitle}>Set Room Mood Lighting:</div>
                  <div className={styles.vibeButtons}>
                    <button
                      className={`${styles.vibeBtn} ${vibe === 'purple' ? styles.vibeBtnActive : ''}`}
                      onClick={() => setVibe('purple')}
                    >
                      <span className={styles.colorIndicator} style={{ backgroundColor: '#9333ea' }} />
                      Purple
                    </button>
                    <button
                      className={`${styles.vibeBtn} ${vibe === 'pink' ? styles.vibeBtnActive : ''}`}
                      onClick={() => setVibe('pink')}
                    >
                      <span className={styles.colorIndicator} style={{ backgroundColor: '#ff2e7e' }} />
                      Pink
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
                {/* Purple Theme */}
                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#9333ea' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>💜 Purple Theme</h3>
                    <div className={styles.showcasePrice}>₹999 / 2 Hrs</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Base price for 2 members</div>
                    <ul className={styles.showcaseList}>
                      <li>2-Hour full private hall booking</li>
                      <li>Vibrant Purple party lighting decor</li>
                      <li>Extra guest: ₹100 per head</li>
                      <li>DSLR Photo: from ₹300 (optional)</li>
                      <li>Fog entry: from ₹300 (optional)</li>
                    </ul>
                  </div>
                </div>

                {/* Pink Theme */}
                <div className={styles.showcaseCard}>
                  <div className={styles.cardBanner} style={{ backgroundColor: '#ff2e7e' }} />
                  <div className={styles.showcaseContent}>
                    <h3 className={styles.showcaseTitle}>🩷 Pink Theme</h3>
                    <div className={styles.showcasePrice}>₹799 / 2 Hrs</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Base price for 2 members</div>
                    <ul className={styles.showcaseList}>
                      <li>2-Hour full private hall booking</li>
                      <li>Warm Pink ambient lighting decor</li>
                      <li>Extra guest: ₹100 per head</li>
                      <li>DSLR Photo: from ₹300 (optional)</li>
                      <li>Fog entry: from ₹300 (optional)</li>
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
                      <li>DSLR Photo: from ₹300 (optional)</li>
                      <li>Fog entry: from ₹300 (optional)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2.5: PS5 Pixel Gaming Realm Showcase */}
            <section id="gaming-banner" className={`${styles.section} ${styles.reveal}`} style={{
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(255, 0, 85, 0.12) 100%)',
              border: '2px solid #00f0ff',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 240, 255, 0.25)',
              marginBottom: '40px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffe600', fontFamily: 'var(--font-vt323), monospace', fontSize: '1.3rem', marginBottom: '8px' }}>
                <Gamepad2 size={22} color="#00f0ff" /> NEW: PIXEL EDITION PS5 GAMING LOUNGE — ₹399/HOUR (MIN 1 HR)
              </div>
              <h2 className={styles.sectionTitle} style={{ textAlign: 'left', marginBottom: '12px', color: '#ffffff' }}>
                1x PS5 Console + 2 Controllers & Top Games
              </h2>
              <p style={{ color: '#c0c0e0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
                Step into Bangalore's premier private PS5 gaming lounge. Equipped with <strong>1 Sony PlayStation 5 Console</strong>, <strong>2 DualSense Wireless Controllers</strong>, and top multiplayer games (EA FC 24 / FIFA, Tekken 8, Mortal Kombat 1, Spider-Man 2, Call of Duty, Gran Turismo 7) played on our 180" 4K Screen with 7.1 Dolby surround sound!
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link href="/gaming" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)', border: '1px solid #00f0ff', color: '#ffffff' }}>
                  Enter Gaming World 🎮
                </Link>
                <Link href="/gaming/book" className="btn btn-secondary">
                  Book PS5 Slot Now
                </Link>
              </div>
            </section>

            {/* Section 3: Amenities (Trigger camera shift 2) */}
            <section id="features" className={`${styles.section} ${styles.reveal}`}>
              <h2 className={styles.sectionTitle}>Designed for Ultimate Comfort</h2>
              <p className={styles.sectionSub}>
                We combine high-end cinema electronics with custom interior designing to deliver a premium private space.
              </p>

              <div className={styles.featuresGrid}>
                <div className={styles.featureCard}>
                  <div className={styles.featureIcon}><Gamepad2 /></div>
                  <h3 className={styles.featureTitle}>PS5 + 2 Controllers</h3>
                  <p className={styles.featureDesc}>1x Sony PlayStation 5 with 2 DualSense wireless controllers & top games for head-to-head multiplayer battles.</p>
                </div>

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

            {/* Section 4: SEO About Bee Vibe Party Hall */}
            <section id="about-beevibe" className={`${styles.section} ${styles.reveal}`}>
              <h2 className={styles.sectionTitle}>Bee Vibe Party Hall Bangalore</h2>
              <p className={styles.sectionSub}>
                Bangalore's Top Rated Mini Party Hall & Private Celebration Theater in Jayanagar
              </p>
              <div style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '16px',
                padding: '24px',
                color: 'var(--text-secondary)',
                lineHeight: '1.7',
                fontSize: '0.95rem'
              }}>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.15rem' }}>
                  Looking for Bee Vibe Party Hall in Bangalore?
                </h3>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Bee Vibe Party Hall</strong> is your exclusive destination for private celebration halls, mini birthday party venues, romantic couple date nights, and immersive private cinema screenings in Jayanagar 9th Block, Bangalore.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  Whether you are planning a surprise birthday party for your loved one, celebrating an anniversary, hosting a private movie screening with friends, or enjoying a multiplayer PS5 gaming session, <strong>Bee Vibe Party Hall Bangalore</strong> provides 100% private, soundproof theater rooms equipped with massive 180-inch 4K projection screens, 7.1 Dolby Atmos sound systems, custom RGB ambient mood lighting, and full decoration setups.
                </p>
                <p style={{ marginBottom: '0' }}>
                  Conveniently situated opposite Jain University in Jayanagar 9th Block, <strong>Bee Vibe Party Hall</strong> easily serves guests from Jayanagar 4th Block, JP Nagar, BTM Layout, Koramangala, Banashankari, and across South Bangalore. Book your slot online today at www.beevibe.org!
                </p>
              </div>
            </section>

            {/* Section 5: FAQ */}
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
              <Link href="/" className={styles.logoWrapper}>
                <img
                  src="/bee-vibe-logo.png?v=4"
                  alt="BeeVibe Mini Private Theater"
                  className={styles.logoImg}
                  style={{ height: '100px', width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Premium private celebration theaters across the city designed for celebrations, dates, movies, and gaming events. Your premium space, your custom vibe.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Phone size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <a href="tel:9900106474" style={{ color: 'inherit', textDecoration: 'none' }} className="hover-accent">
                    +91 99001 06474
                  </a>
                </span>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Instagram size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
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
                    href="https://maps.app.goo.gl/c4TBh9zeaUDJEh7X8"
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
            <p>&copy; {new Date().getFullYear()} Bee Vibe Party Hall & Private Celebration Theater. All Rights Reserved.</p>
            <p style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Bee Vibe Party Hall - Premium Private Celebration Space, Birthday Hall, and Private Cinema in Jayanagar 9th Block, Bangalore. Serving Jayanagar 4th Block, JP Nagar, BTM Layout, Koramangala & Banashankari.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
