'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ChevronDown,
  Phone,
  Clock,
  Film,
  Music,
  Tv,
  Gamepad2,
  Volume2,
  Coffee,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Heart,
  Cake,
  Star,
  Zap,
  ArrowRight
} from 'lucide-react';
import WhatsAppBotWidget from '@/components/WhatsAppBotWidget';
import GallerySection from '@/components/GallerySection';
import styles from './page.module.css';

export default function Home() {
  const [vibe, setVibe] = useState<'pink' | 'purple' | 'red'>('purple');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // 1. Scroll listener for sticky header styling & scroll progress
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

  // 2. Intersection Observer for scroll reveal animations
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

  const vibeLabels = {
    red: 'Red Velvet Romance Theme (₹799/2hrs)',
    pink: 'Pink Angel Wings Theme (₹899/2hrs)',
    purple: 'Royal Purple Butterfly Theme (₹999/2hrs)',
  };

  const THEMES_PREVIEWS = [
    {
      id: 'red',
      name: 'Red Theme (Red Velvet Romance)',
      price: '₹799',
      duration: '2 Hours',
      badge: 'Anniversary & Romantic Dates ❤️',
      color: '#ef4444',
      image: '/themes/theme-red.jpg',
      features: ['Floral Heart & "Happy Anniversary" Neon', 'Red Shimmer Backdrop & Lighted Arch', 'Plush Velvet Seating & Marble Table', '180" 4K Screen & 7.1 Dolby Sound'],
    },
    {
      id: 'pink',
      name: 'Pink Theme (Angel Wings & Neon)',
      price: '₹899',
      duration: '2 Hours',
      badge: 'Birthday & Parties 🩷',
      color: '#ec4899',
      image: '/themes/theme-pink.jpg',
      features: ['Giant Glowing Angel Wings Backdrop', 'Pink Shimmer Arch with "Happy Birthday" Neon', 'Hot Pink Velvet Recliners & Picket Fence', '180" 4K Screen & 7.1 Dolby Sound'],
    },
    {
      id: 'purple',
      name: 'Purple Theme (Royal Butterfly Grandeur)',
      price: '₹999',
      duration: '2 Hours',
      badge: 'VIP Grand Celebration Setup 💜',
      color: '#a855f7',
      image: '/themes/theme-purple.jpg',
      features: ['Grand Triple Arched Decor & Balloon Arches', 'Illuminated Butterfly Wings & Gold Sequin Wall', 'Lighted "HAPPY BIRTHDAY" Marquee Letters', '180" 4K Screen & 7.1 Dolby Sound'],
    },
  ];

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
              <Link href="/book" className="btn btn-primary btn-nav" style={{ padding: '10px 20px', fontSize: '0.88rem', fontWeight: 'bold' }}>
                Book Now
              </Link>
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
                <Link href="/book" className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsMobileMenuOpen(false)}>
                  Book Now
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section id="hero" className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroWrapper}>
            <div className={styles.heroBadge}>
              <Sparkles size={16} color="var(--accent)" />
              <span>BANGALORE'S PREMIER PRIVATE CELEBRATION THEATER & LOUNGE</span>
            </div>

            <h1 className={styles.heroTitle}>
              Your Private Cinema.<br />
              <span className="text-glow" style={{ color: 'var(--accent)', transition: 'color 0.5s' }}>
                Unforgettable Celebrations.
              </span>
            </h1>

            <p className={styles.heroSubtitle}>
              Experience Bangalore's most luxurious private party hall and celebration theater in Jayanagar 9th Block. Book our 100% private suites with <strong>180-inch 4K screen</strong>, <strong>7.1 Dolby Atmos sound</strong>, custom lighting, and dedicated <strong>PS5 Gaming</strong> for birthdays, anniversaries, and date nights.
            </p>

            {/* Room Mood Lighting Buttons */}
            <div className={styles.vibePanel}>
              <div className={styles.vibeTitle}>Set Room Mood Lighting:</div>
              <div className={styles.vibeButtons}>
                <button
                  className={styles.vibeBtn + (vibe === 'red' ? ' ' + styles.vibeBtnActive : '')}
                  onClick={() => setVibe('red')}
                >
                  <span className={styles.colorIndicator} style={{ backgroundColor: '#ef4444' }} />
                  ❤️ Red (₹799)
                </button>
                <button
                  className={styles.vibeBtn + (vibe === 'pink' ? ' ' + styles.vibeBtnActive : '')}
                  onClick={() => setVibe('pink')}
                >
                  <span className={styles.colorIndicator} style={{ backgroundColor: '#ec4899' }} />
                  🩷 Pink (₹899)
                </button>
                <button
                  className={styles.vibeBtn + (vibe === 'purple' ? ' ' + styles.vibeBtnActive : '')}
                  onClick={() => setVibe('purple')}
                >
                  <span className={styles.colorIndicator} style={{ backgroundColor: '#9333ea' }} />
                  💜 Purple (₹999)
                </button>
              </div>
            </div>

            <div className={styles.heroCtas}>
              <Link href="/book" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem', fontWeight: 700 }}>
                Reserve Your Hall Now →
              </Link>
              <Link href="/gaming" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem', borderColor: '#00f0ff', color: '#00f0ff' }}>
                PS5 Gaming Lounge 🎮
              </Link>
              <a href="#vibes" className="btn btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem' }}>
                View 3 Themes ↓
              </a>
            </div>

            {/* Live Visual 3-Theme Preview Banner */}
            <div className={styles.heroThemesShowcase}>
              {THEMES_PREVIEWS.map((item) => (
                <div
                  key={item.id}
                  className={styles.heroThemeCard + (vibe === item.id ? ' ' + styles.heroThemeCardActive : '')}
                  onClick={() => setVibe(item.id as any)}
                >
                  <div className={styles.heroThemeImgWrapper}>
                    <img src={item.image} alt={item.name} className={styles.heroThemeImg} />
                    <span className={styles.heroThemeBadge} style={{ background: item.color }}>
                      {item.price} / 2 Hrs
                    </span>
                  </div>
                  <div className={styles.heroThemeInfo}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: item.color }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: '#a0a0c0' }}>{item.badge}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Metrics Bar */}
            <div className={styles.trustBar}>
              <div className={styles.trustItem}>
                <span className={styles.trustIcon}>🎬</span>
                <div>
                  <strong>180" 4K Laser Screen</strong>
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
              Choose from our 3 authentic handcrafted celebration themes. Every booking gets 100% private access to the entire air-conditioned theater suite with 180" 4K screen and Dolby sound.
            </p>
          </div>

          <div className={styles.vibeShowcaseGrid}>
            {THEMES_PREVIEWS.map((pkg) => (
              <div
                key={'theme-' + pkg.id}
                className={styles.showcaseCard}
                style={{
                  border: '1px solid ' + pkg.color + '44',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 20px ' + pkg.color + '18'
                }}
              >
                <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
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
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '60px',
                    background: 'linear-gradient(to top, rgba(10, 10, 14, 0.95), transparent)'
                  }} />
                </div>

                <div className={styles.showcaseContent} style={{ padding: '24px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <h3 className={styles.showcaseTitle} style={{ color: pkg.color, fontSize: '1.25rem', marginBottom: '4px' }}>{pkg.name}</h3>
                  <div className={styles.showcasePrice} style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                    {pkg.price} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {pkg.duration} (Base 2 Guests)</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    Extra guests: ₹100/head (Capacity up to 10 guests)
                  </div>
                  <ul className={styles.showcaseList} style={{ flexGrow: 1, marginBottom: '20px' }}>
                    {pkg.features.map((f, i) => (
                      <li key={i} style={{ display: 'flex', gap: '8px', fontSize: '0.88rem', marginBottom: '8px' }}>
                        <span style={{ color: pkg.color, fontWeight: 'bold' }}>✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/book"
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: pkg.color,
                      borderColor: pkg.color,
                      fontWeight: 700,
                      fontSize: '0.95rem'
                    }}
                  >
                    Book {pkg.name.split(' ')[0]} Theme →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2.5: PS5 Pixel Gaming Realm Showcase */}
      <section id="gaming-banner" className={styles.section + ' ' + styles.reveal} style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.12) 0%, rgba(255, 0, 85, 0.12) 100%)',
            border: '2px solid #00f0ff',
            borderRadius: '24px',
            padding: '36px',
            boxShadow: '0 15px 50px rgba(0, 0, 0, 0.7), 0 0 35px rgba(0, 240, 255, 0.25)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffe600', fontFamily: 'var(--font-vt323), monospace', fontSize: '1.4rem', marginBottom: '8px' }}>
                <Gamepad2 size={24} color="#00f0ff" /> NEW: PIXEL EDITION PS5 GAMING LOUNGE — ₹399/HOUR
              </div>
              <h2 className={styles.sectionTitle} style={{ textAlign: 'left', marginBottom: '12px', color: '#ffffff', fontSize: '2rem' }}>
                Sony PlayStation 5 Console + 2 Wireless Controllers
              </h2>
              <p style={{ color: '#c0c0e0', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                Step into Bangalore's premier private PS5 gaming lounge. Equipped with <strong>1 Sony PlayStation 5</strong>, <strong>2 DualSense Wireless Controllers</strong>, and top multiplayer games (EA FC 24 / FIFA, Tekken 8, Mortal Kombat 1, Spider-Man 2, Call of Duty, Gran Turismo 7) on our 180" 4K Screen with 7.1 Dolby surround sound!
              </p>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link href="/gaming" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #7000ff 100%)', border: '1px solid #00f0ff', color: '#ffffff', fontWeight: 700 }}>
                  Enter Gaming World 🎮
                </Link>
                <Link href="/gaming/book" className="btn btn-secondary" style={{ borderColor: 'rgba(255,255,255,0.3)', color: '#ffffff' }}>
                  Book PS5 Gaming Slot
                </Link>
              </div>
            </div>

            <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0, 240, 255, 0.4)', height: '240px' }}>
              <img src="/gallery/ps5-gaming.jpg" alt="PS5 Gaming Lounge" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', background: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #00f0ff', color: '#00f0ff', fontSize: '0.85rem', fontWeight: 'bold' }}>
                ₹399 / Hour (Min 1 Hr) · Till 12 AM Midnight
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
              <h3 className={styles.featureTitle}>180" 4K Projector Screen</h3>
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

      {/* Section 4: Photo Gallery */}
      <GallerySection />

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
                a: 'Our private celebration theater comfortably accommodates up to 10 guests. Base price covers 2 members, and additional guests can be added at just ₹100 per head.',
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
                a: 'Yes, a transparent ₹500 advance deposit is required via UPI (GPay, PhonePe, Paytm) to lock your date and time slot. The remaining balance is paid upon check-in at the venue.',
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
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>{faq.q}</span>
                  <ChevronDown size={18} className={styles.faqIcon} />
                </div>
                {activeFaq === idx && (
                  <div className={styles.faqAnswer} style={{ padding: '12px 18px', color: '#c0c0d8', fontSize: '0.9rem', lineHeight: '1.5' }}>
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
                <img
                  src="/bee-vibe-logo.png?v=4"
                  alt="BeeVibe Mini Private Theater"
                  className={styles.logoImg}
                  style={{ height: '80px', width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <p className={styles.footerDesc}>
                Bangalore's #1 Luxury Private Party Hall, Mini Cinema & PS5 Gaming Space in Jayanagar 9th Block.
              </p>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Quick Links</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/gaming">PS5 Gaming Lounge 🎮</Link></li>
                <li><a href="#vibes">Our 3 Themes</a></li>
                <li><a href="#gallery">Photo Gallery</a></li>
                <li><Link href="/book">Book Celebration</Link></li>
                <li><Link href="/admin/login">Staff Portal</Link></li>
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
    </div>
  );
}
