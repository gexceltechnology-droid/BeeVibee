'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import GallerySection from '@/components/GallerySection';
import WhatsAppBotWidget from '@/components/WhatsAppBotWidget';
import styles from './gallery.module.css';
import pageStyles from '../page.module.css';
import {
  Sparkles,
  ChevronRight,
  Phone,
  MapPin,
  Clock,
  Home as HomeIcon,
  Tv,
  Gamepad2,
  Volume2,
  ShieldCheck
} from 'lucide-react';

const Instagram = ({ size = 20, color = "currentColor", ...props }: React.SVGProps<SVGSVGElement> & { size?: number | string }) => (
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

export default function GalleryPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className={styles.galleryPageMain} data-vibe="purple">
      <div className="ambient-glow-bg" />
      <div className="gradient-overlay" />
      <WhatsAppBotWidget />

      {/* Header Container */}
      <div className={styles.headerContainer}>
        <div className="container">
          <header className={styles.header}>
            <Link href="/" className={styles.logoWrapper}>
              <img
                src="/bee-vibe-logo.png?v=4"
                alt="BeeVibe Mini Private Theater"
                className={styles.logoImg}
              />
            </Link>

            <nav className={styles.navLinks}>
              <li><Link href="/" className={styles.navLink}>Home</Link></li>
              <li><Link href="/gaming" className={styles.navLink} style={{ color: '#00f0ff', fontWeight: 'bold' }}>Gaming World 🎮</Link></li>
              <li><Link href="/gallery" className={styles.navLink} style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Gallery 📸</Link></li>
              <li><Link href="/#vibes" className={styles.navLink}>Packages</Link></li>
              <li><Link href="/#features" className={styles.navLink}>Amenities</Link></li>
              <li><Link href="/book" className={styles.navLink}>Book Now</Link></li>
            </nav>

            <div className={pageStyles.headerActions}>
              <Link href="/book" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                Book Now
              </Link>
              <button
                className={`${pageStyles.hamburger} ${isMobileMenuOpen ? pageStyles.hamburgerActive : ''}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                <span className={pageStyles.hamburgerLine} />
                <span className={pageStyles.hamburgerLine} />
                <span className={pageStyles.hamburgerLine} />
              </button>
            </div>
          </header>

          {/* Mobile Menu Drawer */}
          <div className={`${pageStyles.mobileMenu} ${isMobileMenuOpen ? pageStyles.mobileMenuActive : ''}`}>
            <ul className={pageStyles.mobileNavLinks}>
              <li><Link href="/" className={pageStyles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Home</Link></li>
              <li><Link href="/gaming" className={pageStyles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)} style={{ color: '#00f0ff', fontWeight: 'bold' }}>Gaming World 🎮</Link></li>
              <li><Link href="/gallery" className={pageStyles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)} style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Gallery 📸</Link></li>
              <li><Link href="/#vibes" className={pageStyles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Our Vibes</Link></li>
              <li><Link href="/#features" className={pageStyles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Amenities</Link></li>
              <li><Link href="/book" className={pageStyles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Booking Portal</Link></li>
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
      <div className="container">
        <div className={styles.galleryHero}>
          <div className={styles.breadcrumb}>
            <Link href="/"><HomeIcon size={14} /> Home</Link>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--text-primary)' }}>Visual Gallery</span>
          </div>

          <div className={styles.heroTag}>
            <Sparkles size={14} /> REAL CELEBRATIONS & THEATER AMBIANCE
          </div>

          <h1 className={styles.heroTitle}>
            Bee Vibe Photo & Experience Gallery
          </h1>

          <p className={styles.heroSubtitle}>
            Take a look inside Bangalore’s top private celebration theater and mini party hall in Jayanagar 9th Block. See our custom lighting vibes, 180" 4K screens, fog entry, PS5 multiplayer gaming lounge, and romantic couple decors.
          </p>

          {/* Quick Highlight Stats */}
          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>180" 4K</div>
              <div className={styles.statLabel}>Projection Screen</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>7.1 Dolby</div>
              <div className={styles.statLabel}>Surround Sound</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>1x PS5</div>
              <div className={styles.statLabel}>2 Controllers Ready</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statValue}>100%</div>
              <div className={styles.statLabel}>Soundproof Privacy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Gallery Component */}
      <GallerySection isStandalonePage={true} />

      {/* Footer */}
      <footer className={pageStyles.footer}>
        <div className="container">
          <div className={pageStyles.footerGrid}>
            <div className={pageStyles.footerCol}>
              <Link href="/" className={pageStyles.logoWrapper}>
                <img
                  src="/bee-vibe-logo.png?v=4"
                  alt="BeeVibe Mini Private Theater"
                  className={pageStyles.logoImg}
                  style={{ height: '90px', width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Premium private celebration theaters across Bangalore designed for birthdays, anniversaries, couple dates, private screenings, and PS5 gaming tournaments.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Phone size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <a href="tel:9900106474" style={{ color: 'inherit', textDecoration: 'none' }}>+91 99001 06474</a>
                </span>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <Instagram size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <a href="https://www.instagram.com/beevibe_partyhall/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>@beevibe_partyhall</a>
                </span>
                <span style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <MapPin size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span>1340, 2nd floor, 41st Cross road, 4th gate, opposite to Jain University, Jayanagara 9th Block, Bengaluru, Karnataka 560041</span>
                </span>
              </div>
            </div>

            <div className={pageStyles.footerCol}>
              <h4 className={pageStyles.footerTitle}>Quick Links</h4>
              <ul className={pageStyles.footerLinks}>
                <li><Link href="/" className={pageStyles.footerLink}>Home</Link></li>
                <li><Link href="/gaming" className={pageStyles.footerLink}>PS5 Gaming Lounge</Link></li>
                <li><Link href="/gallery" className={pageStyles.footerLink}>Photo Gallery</Link></li>
                <li><Link href="/#vibes" className={pageStyles.footerLink}>Packages</Link></li>
                <li><Link href="/#features" className={pageStyles.footerLink}>Amenities</Link></li>
                <li><Link href="/book" className={pageStyles.footerLink}>Book Tickets</Link></li>
              </ul>
            </div>

            <div className={pageStyles.footerCol}>
              <h4 className={pageStyles.footerTitle}>Opening Hours</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} color="var(--accent)" /> Daily: 10:00 AM - 11:30 PM</span>
                <span>Pre-booking mandatory. Pre-decoration available on demand.</span>
              </div>
            </div>
          </div>

          <div className={pageStyles.copyright}>
            <p>&copy; {new Date().getFullYear()} Bee Vibe Party Hall & Private Celebration Theater. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
