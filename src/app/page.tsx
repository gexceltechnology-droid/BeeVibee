'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import {
  Sparkles,
  ChevronDown,
  Tv,
  Gamepad2,
  Volume2,
  Coffee,
  ShieldCheck,
  MapPin,
  Heart,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Phone,
  MessageSquare,
  ArrowRight,
  Star,
  ExternalLink,
  Flame,
  Award,
  HelpCircle,
  Wind,
  Cloud,
  Film,
  Zap,
  Gift,
  Cake
} from 'lucide-react';
import BookingFinder from '@/components/booking/BookingFinder';
import RoomDetailsModal from '@/components/booking/RoomDetailsModal';
import BookingFlowModal from '@/components/booking/BookingFlowModal';
import TheatresShowcase from '@/components/booking/TheatresShowcase';
import WhatsAppBotWidget from '@/components/WhatsAppBotWidget';
import BeeMascot from '@/components/brand/BeeMascot';
import HeroLayeredComposition from '@/components/effects/HeroLayeredComposition';
import CinematicScrollPortal from '@/components/effects/CinematicScrollPortal';
import GalleryLightboxModal, { GalleryLightboxItem } from '@/components/gallery/GalleryLightboxModal';
import { ROOMS, OCCASIONS, RoomExperience, OccasionType, ADD_ONS } from '@/types/booking';
import { GOOGLE_REVIEWS, GOOGLE_BUSINESS_STATS } from '@/data/googleReviews';
import styles from './page.module.css';

// Sleek Google multi-colored 'G' icon
const GoogleIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function Home() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Active Search / Filter State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeOccasionFilter, setActiveOccasionFilter] = useState<'all' | OccasionType>('all');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [preferredTime, setPreferredTime] = useState<string>('any');

  // Modal States
  const [inspectingRoom, setInspectingRoom] = useState<RoomExperience | null>(null);
  const [activeLightboxItem, setActiveLightboxItem] = useState<GalleryLightboxItem | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string>('');
  const [preselectedOccasion, setPreselectedOccasion] = useState<OccasionType | ''>('');
  const [preselectedSlot, setPreselectedSlot] = useState<string>('');
  const [preselectedPhone, setPreselectedPhone] = useState<string>('');

  // UI state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState<'all' | 'birthday' | 'romantic' | 'vip' | 'gaming'>('all');
  const [activeReviewFilter, setActiveReviewFilter] = useState<'all' | 'birthday' | 'romance' | 'gaming' | 'party'>('all');

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 40);

      const winScroll = document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(height > 0 ? winScroll / height : 0);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filtered rooms for dynamic booking results
  const filteredRooms = ROOMS.filter((room) => {
    if (activeOccasionFilter === 'all') return true;
    return room.occasion === activeOccasionFilter;
  });

  // Handle Search from Hero Booking Finder
  const handleFinderSearch = (params: {
    date: string;
    occasion: OccasionType;
    guestCount: number;
    preferredTime: string;
    phone?: string;
  }) => {
    setSelectedDate(params.date);
    setActiveOccasionFilter(params.occasion);
    setPreselectedOccasion(params.occasion);
    setPreselectedRoomId('');
    setGuestCount(params.guestCount);
    setPreferredTime(params.preferredTime);
    if (params.phone) {
      setPreselectedPhone(params.phone);
    }
    setIsBookingModalOpen(true);
  };

  // Open booking flow directly for a specific room
  const handleBookRoom = (roomId: string) => {
    const targetRoom = ROOMS.find((r) => r.id === roomId);
    if (targetRoom) {
      setPreselectedRoomId(targetRoom.id);
      setPreselectedOccasion(targetRoom.occasion);
    } else {
      setPreselectedRoomId(roomId);
    }
    setIsBookingModalOpen(true);
  };

  // Open booking flow from Theatres Showcase with specific room, date, and slot
  const handleBookSlotFromShowcase = (
    roomId: string,
    occasion: OccasionType,
    slotTime?: string,
    date?: string
  ) => {
    setPreselectedRoomId(roomId);
    setPreselectedOccasion(occasion);
    setPreselectedSlot(slotTime || '');
    if (date) setSelectedDate(date);
    setIsBookingModalOpen(true);
  };

  // Google Reviews Filtering (100+ Reviews on Google Maps)
  const filteredReviews = GOOGLE_REVIEWS.filter((rev) => {
    if (activeReviewFilter === 'all') return true;
    if (activeReviewFilter === 'birthday') return rev.occasion.toLowerCase().includes('birthday');
    if (activeReviewFilter === 'romance') return rev.occasion.toLowerCase().includes('anniversary') || rev.occasion.toLowerCase().includes('romance') || rev.occasion.toLowerCase().includes('date');
    if (activeReviewFilter === 'gaming') return rev.occasion.toLowerCase().includes('gaming') || rev.occasion.toLowerCase().includes('ps5');
    if (activeReviewFilter === 'party') return rev.occasion.toLowerCase().includes('bachelorette') || rev.occasion.toLowerCase().includes('movie') || rev.occasion.toLowerCase().includes('vip') || rev.occasion.toLowerCase().includes('party');
    return true;
  });

  // Authentic Gallery Data
  const galleryItems = [
    { id: 1, category: 'birthday', title: 'Angel Wings & Birthday Stage', image: '/gallery/theme-pink.jpg' },
    { id: 2, category: 'birthday', title: 'Giant Glowing Angel Wings & Stage', image: '/gallery/theme-pink-wings.jpg' },
    { id: 3, category: 'romantic', title: 'Red Velvet Heart Romance Suite', image: '/gallery/theme-red.jpg' },
    { id: 4, category: 'romantic', title: 'Will You Marry Me? Floral Heart Stage', image: '/gallery/theme-red-heart.jpg' },
    { id: 5, category: 'romantic', title: 'Plush Red Velvet Lounge & Cake Table', image: '/gallery/theme-red-couch.jpg' },
    { id: 6, category: 'vip', title: 'Royal Butterfly Grandeur VIP', image: '/gallery/theme-purple.jpg' },
    { id: 7, category: 'vip', title: 'Royal Butterfly Illuminated Stage', image: '/gallery/theme-purple-stage.jpg' },
    { id: 8, category: 'vip', title: 'VIP Velvet Sectional Lounge', image: '/gallery/theme-purple-couch.jpg' },
    { id: 9, category: 'birthday', title: '180" 4K Laser Cinema in Pink Suite', image: '/gallery/theme-pink-screen.jpg' },
    { id: 10, category: 'romantic', title: '180" 4K Laser Cinema in Red Suite', image: '/gallery/theme-red-screen.jpg' },
    { id: 11, category: 'vip', title: '180" 4K Laser Cinema in Purple Suite', image: '/gallery/theme-purple-movie.jpg' },
    { id: 12, category: 'gaming', title: 'PS5 4K Gaming Arena with DualSense', image: '/gallery/ps5-gaming.jpg' },
  ];

  const filteredGallery = galleryItems.filter((item) => {
    if (activeGalleryTab === 'all') return true;
    return item.category === activeGalleryTab;
  });

  return (
    <div className={styles.main}>
      {/* Scroll Progress Bar */}
      <div className={styles.scrollProgressBar} style={{ transform: `scaleX(${scrollProgress})` }} />

      {/* Floating WhatsApp Widget */}
      <WhatsAppBotWidget offsetForBottomBar={true} />

      {/* ══════════════════════════════════════════════════
          1. MINIMAL TRANSLUCENT NAVIGATION (FLOATING PILL)
          ══════════════════════════════════════════════════ */}
      <div className={`${styles.headerContainer} ${isScrolled ? styles.headerContainerScrolled : ''}`}>
        {/* Scrolling Announcement Bar */}
        <div
          className={styles.tickerBar}
          onClick={() => {
            setPreselectedRoomId('');
            setPreselectedOccasion('');
            setIsBookingModalOpen(true);
          }}
        >
          <div className={styles.tickerWrapper}>
            <div className={styles.tickerTrack}>
              <span>🎉 CELEBRATION OFFER: Apply Coupon Code <strong className={styles.tickerBadge}>BEEVIBE999</strong> — All Suites Flat ₹999 with Complimentary Cold Fog Entry, LED Name Board &amp; Table Decor!</span>
              <span className={styles.tickerDivider}>✦</span>
              <span>📍 100% Private Celebration Theatre in Jayanagar 9th Block, Bengaluru</span>
              <span className={styles.tickerDivider}>✦</span>
              <span>✨ Tap to Check Live Availability &amp; Book Your Private Suite →</span>
              <span className={styles.tickerDivider}>✦</span>
              <span>🎉 CELEBRATION OFFER: Apply Coupon Code <strong className={styles.tickerBadge}>BEEVIBE999</strong> — All Suites Flat ₹999 with Complimentary Cold Fog Entry, LED Name Board &amp; Table Decor!</span>
            </div>
          </div>
        </div>

        <div className="container" style={{ marginTop: '10px' }}>
          <header className={styles.header}>
            <Link href="/" className={styles.logoWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/bee-vibe-logo-light.png"
                alt="BeeVibe Mini Private Theater"
                className={styles.logoImg}
              />
            </Link>

            <nav className={styles.desktopNav}>
              <ul className={styles.navLinks}>
                <li><a href="#gallery" className={styles.navLink}>Gallery</a></li>
                <li><a href="#theatres" className={styles.navLink}>Packages</a></li>
                <li><a href="#add-ons" className={styles.navLink}>Add-ons</a></li>
                <li><a href="#why-beevibe" className={styles.navLink}>Why Us</a></li>
                <li><a href="#location" className={styles.navLink}>Location</a></li>
                <li><a href="tel:+919900106474" className={styles.navLink}>Contact</a></li>
              </ul>
            </nav>

            <div className={styles.headerActions}>
              <a
                href="tel:+919900106474"
                className={styles.headerCallBtn}
                title="Book a Slot on Call (+91 99001 06474)"
              >
                <Phone size={13} />
                <span>Call to Book</span>
              </a>

              <button
                type="button"
                className={styles.headerBookBtn}
                onClick={() => {
                  setPreselectedRoomId('');
                  setPreselectedOccasion('');
                  setIsBookingModalOpen(true);
                }}
              >
                <span>Book Now</span>
              </button>

              <button
                type="button"
                className={`${styles.hamburger} ${isMobileMenuOpen ? styles.hamburgerActive : ''}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle navigation"
              >
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
                <span className={styles.hamburgerLine} />
              </button>
            </div>
          </header>

          {/* Mobile Drawer */}
          <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuActive : ''}`}>
            <ul className={styles.mobileNavLinks}>
              <li><a href="#gallery" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Gallery</a></li>
              <li><a href="#theatres" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Packages</a></li>
              <li><a href="#add-ons" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Add-ons</a></li>
              <li><a href="#why-beevibe" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Why Us</a></li>
              <li><a href="#location" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Location</a></li>
              <li><a href="tel:+919900106474" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Contact Concierge</a></li>
              <li style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <a
                  href="tel:+919900106474"
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Phone size={15} /> CALL TO BOOK (9900106474)
                </a>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setPreselectedRoomId('');
                    setPreselectedOccasion('');
                    setIsBookingModalOpen(true);
                  }}
                >
                  BOOK NOW →
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          2. TWO-COLUMN HERO WITH SERIF TYPOGRAPHY & OVERLAPPING PHOTO COLLAGE
          ══════════════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroGrid}>
            {/* Left Column: Serif Typography, Description & Verified Trust Stats */}
            <div className={styles.heroContentLeft}>
              <div className={styles.heroBadgeRow}>
                <div className={styles.heroLocationBadge}>
                  ⭐ Bangalore&apos;s most loved private celebration spot
                </div>
                <BeeMascot size={52} className={styles.heroBeeMascot} />
              </div>

              <h1 className={styles.heroTitle}>
                Create Your<br />
                <span className={styles.heroTitleHighlight}>Perfect Celebration</span> <span className={styles.sparkleIcon}>✨</span>
              </h1>

              <p className={styles.heroDescription}>
                Private cabana setups for birthdays, surprises &amp; special moments — curated with warm lights, balloons, and a vibe that feels straight out of a dream.
              </p>

              <div className={styles.heroCtas}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setPreselectedRoomId('');
                    setPreselectedOccasion('');
                    setIsBookingModalOpen(true);
                  }}
                >
                  Book Now
                </button>

                <a href="#theatres" className="btn btn-secondary">
                  Explore Experiences
                </a>
              </div>

              {/* Trust Indicators Below Buttons */}
              <div className={styles.heroTrustStats}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>500+</span>
                  <span className={styles.statLabel}>Celebrations</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>4.9★</span>
                  <span className={styles.statLabel}>Avg. Rating</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>100%</span>
                  <span className={styles.statLabel}>Private</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3D Depth Layered Composition */}
            <div className={styles.heroCollageWrapper}>
              <HeroLayeredComposition
                onInspectPhoto={(photoUrl) => {
                  const matched = galleryItems.find((g) => g.image === photoUrl);
                  if (matched) {
                    setActiveLightboxItem(matched);
                  } else {
                    setActiveLightboxItem({
                      id: 99,
                      title: 'Authentic BeeVibe Suite',
                      image: photoUrl,
                      category: 'vip',
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2.5 CINEMATIC SCROLL CHOREOGRAPHY & IMMERSIVE PORTAL
          ══════════════════════════════════════════════════ */}
      <CinematicScrollPortal
        onExploreTheatres={() => {
          const el = document.getElementById('theatres');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onBookNow={() => {
          setPreselectedRoomId('');
          setPreselectedOccasion('');
          setIsBookingModalOpen(true);
        }}
      />

      {/* ══════════════════════════════════════════════════
          3. ELEGANT GALLERY SECTION IMMEDIATELY BELOW HERO
          ══════════════════════════════════════════════════ */}
      <section id="gallery" className={styles.galleryHeroSection}>
        <div className="container">
          <div className={styles.galleryHeaderCentered}>
            <span className={styles.galleryOverline}>GALLERY</span>
            <h2 className={styles.galleryMainHeading}>
              Real Celebrations at <span className={styles.heroTitleHighlight}>BeeVibe</span>
            </h2>
            <p className={styles.gallerySubHeading}>
              Authentic photography taken right inside our Jayanagar 9th Block celebration suites.
            </p>
          </div>

          {/* Interactive Category Filter Chips */}
          <div className={styles.resultsFilterRow}>
            <button
              type="button"
              className={`${styles.filterChip} ${activeGalleryTab === 'all' ? styles.filterChipActive : ''}`}
              onClick={() => setActiveGalleryTab('all')}
            >
              All Photos
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${activeGalleryTab === 'birthday' ? styles.filterChipActive : ''}`}
              onClick={() => setActiveGalleryTab('birthday')}
            >
              Birthday Suites
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${activeGalleryTab === 'romantic' ? styles.filterChipActive : ''}`}
              onClick={() => setActiveGalleryTab('romantic')}
            >
              Romantic Date
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${activeGalleryTab === 'vip' ? styles.filterChipActive : ''}`}
              onClick={() => setActiveGalleryTab('vip')}
            >
              VIP Butterfly
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${activeGalleryTab === 'gaming' ? styles.filterChipActive : ''}`}
              onClick={() => setActiveGalleryTab('gaming')}
            >
              PS5 Gaming
            </button>
          </div>

          {/* Authentic Gallery Grid */}
          <div className={styles.galleryGrid}>
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className={styles.galleryCard}
                onClick={() => {
                  setActiveLightboxItem(item);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.title} className={styles.galleryImg} loading="lazy" />
                <div className={styles.galleryOverlay}>
                  <span className={styles.galleryCaption}>{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. PROMINENT BOOKING FINDER BAR
          ══════════════════════════════════════════════════ */}
      <section style={{ padding: '20px 0 60px' }}>
        <div className="container">
          <BookingFinder
            onSearch={handleFinderSearch}
            initialDate={selectedDate}
            initialOccasion={activeOccasionFilter === 'all' ? 'birthday' : activeOccasionFilter}
            initialGuests={guestCount}
            initialPhone={preselectedPhone}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. LIVE THEATRES & SELECT TIME SLOTS SHOWCASE
          ══════════════════════════════════════════════════ */}
      <div id="theatres">
        <TheatresShowcase
          onBookSlot={handleBookSlotFromShowcase}
          onInspectRoom={(roomId) => handleBookRoom(roomId)}
        />
      </div>

      {/* ══════════════════════════════════════════════════
          6. CELEBRATION PACKAGES & ADD-ONS SECTION
          ══════════════════════════════════════════════════ */}
      <section id="add-ons" className={styles.addonsSection}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Gift size={13} /> CURATED CELEBRATION ADD-ONS
            </div>
            <h2 className={styles.sectionTitle}>Elevate Your Celebration</h2>
            <p className={styles.sectionSubtitle}>
              Handcrafted extras to make your private theatre experience truly magical.
            </p>
          </div>

          <div className={styles.addonsGrid}>
            {ADD_ONS.map((addon) => (
              <div key={addon.id} className={styles.addonCard}>
                {addon.popular && (
                  <span className={styles.addonBadge}>Popular</span>
                )}
                <div className={styles.addonIconWrap}>{addon.icon}</div>
                <h3 className={styles.addonTitle}>{addon.name}</h3>
                <div className={styles.addonPrice}>₹{addon.price}</div>
                <p className={styles.addonDesc}>{addon.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. WHAT IS BEEVIBE? (THE CONCEPT & VENUE INFO)
          ══════════════════════════════════════════════════ */}
      <section id="about" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Sparkles size={13} /> THE BEEVIBE EXPERIENCE
            </div>
            <h2 className={styles.sectionTitle}>What is a Private Celebration Theatre?</h2>
            <p className={styles.sectionSubtitle}>
              Tired of crowded restaurants and generic party halls? BeeVibe offers an exclusive, high-tech private sanctuary designed specifically for unforgettable celebrations.
            </p>
          </div>

          <div className={styles.conceptGrid}>
            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>🔒</div>
              <h3 className={styles.conceptTitle}>100% Dedicated Private Suite</h3>
              <p className={styles.conceptDesc}>
                When you book a session at BeeVibe, the entire hall is reserved exclusively for you and your guests. No strangers, no interruptions, and zero outside noise.
              </p>
            </div>

            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>🎬</div>
              <h3 className={styles.conceptTitle}>Giant 180&quot; 4K Laser Cinema</h3>
              <p className={styles.conceptDesc}>
                Watch favorite blockbusters on Netflix, Disney+ &amp; Prime, stream YouTube video montages of memories, or hook up laptops and phones on a theater-scale screen.
              </p>
            </div>

            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>🔊</div>
              <h3 className={styles.conceptTitle}>7.1 Dolby Atmos Sound</h3>
              <p className={styles.conceptDesc}>
                Immersive surround sound acoustics tuned to fill the room with cinematic punch, crisp dialogues, and room-calibrated bass for movies and music playlists.
              </p>
            </div>

            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>🎂</div>
              <h3 className={styles.conceptTitle}>Curated Thematic Setups</h3>
              <p className={styles.conceptDesc}>
                Each suite features handcrafted ambient lighting, glowing neon photo backdrops, cake pedestals, and romantic or party props ready before you arrive.
              </p>
            </div>

            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>🎮</div>
              <h3 className={styles.conceptTitle}>Next-Gen PS5 Gaming</h3>
              <p className={styles.conceptDesc}>
                Enjoy private multiplayer gaming tournaments on PlayStation 5 with 4 wireless DualSense controllers and the latest AAA sports and fighting titles.
              </p>
            </div>

            <div className={styles.conceptCard}>
              <div className={styles.conceptIcon}>✨</div>
              <h3 className={styles.conceptTitle}>Magical Celebration Effects</h3>
              <p className={styles.conceptDesc}>
                Elevate your cake-cutting ceremony with dramatic cold fog smoke entries, personalized glowing LED name boards, and custom floor balloon decor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8. WHY CHOOSE BEEVIBE (THE STANDARDS)
          ══════════════════════════════════════════════════ */}
      <section id="why-beevibe" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Award size={13} /> THE BEEVIBE STANDARD
            </div>
            <h2 className={styles.sectionTitle}>Why Choose BeeVibe?</h2>
            <p className={styles.sectionSubtitle}>
              We engineered a private cinema experience specifically tailored for high-energy birthdays, intimate date nights, and gaming marathons.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}><Tv size={24} /></div>
              <h3 className={styles.featureTitle}>180&quot; 4K Laser Cinema</h3>
              <p className={styles.featureDesc}>
                True-to-life 4K laser projection delivering crystal-sharp visuals on a massive 15-foot theatre display.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}><Volume2 size={24} /></div>
              <h3 className={styles.featureTitle}>7.1 Dolby Atmos Sound</h3>
              <p className={styles.featureDesc}>
                Directional surround speakers calibrated for room-shaking audio with acoustic soundproofing for total isolation.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}><ShieldCheck size={24} /></div>
              <h3 className={styles.featureTitle}>100% Private &amp; AC</h3>
              <p className={styles.featureDesc}>
                Zero interruptions or shared halls. The entire air-conditioned suite is exclusively yours for the booked slot.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}><Sparkles size={24} /></div>
              <h3 className={styles.featureTitle}>Cold Fog &amp; LED Decor</h3>
              <p className={styles.featureDesc}>
                Elevate cake cutting with ground-hugging dry ice fog effects, balloon arches, and custom LED name boards.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}><Gamepad2 size={24} /></div>
              <h3 className={styles.featureTitle}>PS5 Gaming Arena</h3>
              <p className={styles.featureDesc}>
                Sony PlayStation 5 console with DualSense wireless controllers. Play EA FC 24, Tekken 8, MK1 &amp; Spider-Man 2.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}><Coffee size={24} /></div>
              <h3 className={styles.featureTitle}>All OTTs &amp; Snacks</h3>
              <p className={styles.featureDesc}>
                Stream from Netflix, Prime, Hotstar, YouTube, or connect your own device. Warm popcorn &amp; food options available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          9. HOW BOOKING WORKS
          ══════════════════════════════════════════════════ */}
      <section id="how-it-works" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Clock size={13} /> SIMPLE &amp; INSTANT
            </div>
            <h2 className={styles.sectionTitle}>How Booking Works</h2>
            <p className={styles.sectionSubtitle}>
              Reserve your private theatre experience in under 2 minutes with instant digital pass generation.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>01</span>
              <h3 className={styles.stepCardTitle}>Choose Occasion</h3>
              <p className={styles.stepCardDesc}>
                Select Birthday, Date / Anniversary, VIP Celebration, or PS5 Gaming.
              </p>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>02</span>
              <h3 className={styles.stepCardTitle}>Select Suite</h3>
              <p className={styles.stepCardDesc}>
                Explore our themed suites designed for couple romance, birthdays, or grand celebrations.
              </p>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>03</span>
              <h3 className={styles.stepCardTitle}>Pick Time Slot</h3>
              <p className={styles.stepCardDesc}>
                Choose your date and check real-time available 2-hour slots.
              </p>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>04</span>
              <h3 className={styles.stepCardTitle}>Customize</h3>
              <p className={styles.stepCardDesc}>
                Add celebration cakes, cold fog entry, custom LED name board, and snacks.
              </p>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>05</span>
              <h3 className={styles.stepCardTitle}>Pay &amp; Confirm</h3>
              <p className={styles.stepCardDesc}>
                Pay a nominal advance deposit via UPI to instantly lock your slot.
              </p>
            </div>
          </div>

          {/* Option to Book on Call Callout */}
          <div className={styles.bookOnCallBanner}>
            <div className={styles.bookOnCallLeft}>
              <div className={styles.bookOnCallIconWrap}>
                <Phone size={24} />
              </div>
              <div>
                <h3 className={styles.bookOnCallTitle}>Option to Book a Slot on Call</h3>
                <p className={styles.bookOnCallSubtitle}>
                  Prefer booking with concierge assistance? Speak directly with our team. We will check live slot availability and reserve your private suite instantly over the phone.
                </p>
              </div>
            </div>
            <div className={styles.bookOnCallActions}>
              <a href="tel:+919900106474" className="btn btn-primary">
                <Phone size={15} />
                <span>Call +91 99001 06474</span>
              </a>
              <span className={styles.bookOnCallTiming}>Daily 10:00 AM – 12:00 AM Midnight</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          10. VERIFIED GOOGLE REVIEWS (100+ REVIEWS)
          ══════════════════════════════════════════════════ */}
      <section id="reviews" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <GoogleIcon size={14} /> 4.9★ ON GOOGLE MAPS
            </div>
            <h2 className={styles.sectionTitle}>Loved by 100+ Guests Across Bengaluru</h2>
            <p className={styles.sectionSubtitle}>
              Authentic Google reviews from couples, birthday celebrants, and gamers who experienced BeeVibe.
            </p>
          </div>

          {/* Google Business Rating Overview Card */}
          <div className={styles.googleRatingCard}>
            <div className={styles.googleRatingLeft}>
              <div className={styles.googleLogoBadge} title="Verified Google Business Profile">
                <GoogleIcon size={30} />
              </div>
              <div className={styles.googleScoreWrap}>
                <div className={styles.googleScoreRow}>
                  <span className={styles.googleScoreNum}>{GOOGLE_BUSINESS_STATS.rating}</span>
                  <div className={styles.googleScoreStars}>★★★★★</div>
                </div>
                <div className={styles.googleScoreLabel}>
                  {GOOGLE_BUSINESS_STATS.reviewCountDisplay} Verified Google Reviews
                </div>
                <div className={styles.googleScoreSub}>
                  {GOOGLE_BUSINESS_STATS.verifiedBusinessName} • {GOOGLE_BUSINESS_STATS.location}
                </div>
              </div>
            </div>

            <div className={styles.googleRatingActions}>
              <a
                href={GOOGLE_BUSINESS_STATS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.googleBtnPrimary}
              >
                <span>Read all on Google</span>
                <ExternalLink size={14} />
              </a>
              <a
                href={GOOGLE_BUSINESS_STATS.writeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.googleBtnSecondary}
              >
                <Star size={14} fill="#FBBC05" color="#FBBC05" />
                <span>Write a Review</span>
              </a>
            </div>
          </div>

          {/* Live Auto-Updating Google Reviews */}
          <div className={styles.elfsightWidgetWrapper}>
            <Script src="https://elfsightcdn.com/platform.js" strategy="afterInteractive" />
            <div className="elfsight-app-5bec4ea5-b93d-4f6e-9663-ffdfffb94cdf" data-elfsight-app-lazy />
          </div>

          {/* Reviews Grid */}
          <div className={styles.reviewsGrid}>
            {filteredReviews.slice(0, 6).map((rev) => (
              <div key={rev.id} className={styles.reviewCard}>
                <div>
                  <div className={styles.reviewCardTop}>
                    <span className={styles.googleVerifiedPill}>
                      <GoogleIcon size={12} /> Google Verified
                    </span>
                    <span className={styles.reviewTimeAgo}>{rev.timeAgo}</span>
                  </div>

                  <div className={styles.reviewStars}>★★★★★</div>

                  {rev.theme && (
                    <div className={styles.reviewThemeBadge}>
                      ✦ {rev.theme}
                    </div>
                  )}

                  <p className={styles.reviewQuote}>&ldquo;{rev.quote}&rdquo;</p>
                </div>

                <div className={styles.reviewerRow}>
                  <div className={styles.reviewerAvatar}>
                    {rev.name[0]}
                  </div>
                  <div className={styles.reviewerInfo}>
                    <strong className={styles.reviewerName}>
                      {rev.name}
                      <CheckCircle2 size={13} color="#1A73E8" fill="#E8F0FE" />
                    </strong>
                    <span className={styles.reviewerTag}>{rev.occasion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          11. LOCATION & GOOGLE MAPS
          ══════════════════════════════════════════════════ */}
      <section id="location" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <MapPin size={13} /> VISIT OUR VENUE
            </div>
            <h2 className={styles.sectionTitle}>Location &amp; Directions</h2>
            <p className={styles.sectionSubtitle}>
              Conveniently located in Jayanagar 9th Block, opposite Jain University. Easy parking and access.
            </p>
          </div>

          <div className={styles.locationCard}>
            <div className={styles.locationMapWrap}>
              <iframe
                title="Bee Vibe Location Map"
                src="https://maps.google.com/maps?q=1340%2C+2nd+floor%2C+41st+Cross+road%2C+4th+gate%2C+opposite+to+Jain+University%2C+Jayanagara+9th+Block%2C+Bengaluru%2C+Karnataka+560041&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className={styles.locationContent}>
              <div className={styles.locationTiming}>
                <Clock size={15} /> Open Daily: 10:00 AM – 12:00 AM Midnight
              </div>

              <p className={styles.locationAddress}>
                <strong>BeeVibe Private Celebration Theatre</strong>
                1340, 2nd Floor, 41st Cross Road, 4th Gate,<br />
                Opposite Jain University, Jayanagar 9th Block,<br />
                Bengaluru, Karnataka 560041
              </p>

              <div className={styles.locationButtons}>
                <a
                  href="https://maps.app.goo.gl/c4TBh9zeaUDJEh7X8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  <MapPin size={15} /> Open in Google Maps
                </a>
                <a
                  href="https://wa.me/919900106474"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <MessageSquare size={15} /> WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          12. FREQUENTLY ASKED QUESTIONS (FAQ)
          ══════════════════════════════════════════════════ */}
      <section id="faq" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <HelpCircle size={13} /> QUESTIONS &amp; ANSWERS
            </div>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.sectionSubtitle}>
              Everything you need to know about booking and enjoying your celebration at BeeVibe.
            </p>
          </div>

          <div className={styles.faqList}>
            {[
              {
                q: 'How does the booking process work?',
                a: 'Simply choose your preferred occasion and room, pick an available date and time slot, customize any add-ons (cake, fog entry, LED board), and pay a nominal advance deposit via UPI. You will instantly receive a digital booking pass with venue directions.',
              },
              {
                q: 'Is the theatre 100% private to my group?',
                a: 'Yes, 100%! When you book a slot, the entire air-conditioned theatre hall is reserved exclusively for you and your guests. Zero outside people, complete acoustic soundproofing, and full privacy.',
              },
              {
                q: 'Are food and outside cakes allowed?',
                a: 'Yes! You are welcome to bring outside food, snacks, and cakes. We also offer fresh celebration cakes and theater snack combos as convenient add-ons during booking.',
              },
              {
                q: 'What is the advance payment policy?',
                a: 'A nominal advance deposit is paid online to lock your slot on our calendar. The remaining balance is paid conveniently via cash or UPI upon check-in at the venue.',
              },
              {
                q: 'Can we play our own custom videos or stream OTT?',
                a: 'Absolutely! Our systems are equipped with high-speed internet and all major OTT apps (Netflix, Prime Video, Hotstar, YouTube). You can also cast or plug in custom birthday video montages directly onto the 180-inch screen.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className={`${styles.faqItem} ${activeFaq === idx ? styles.faqItemOpen : ''}`}
              >
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`${styles.faqIcon} ${activeFaq === idx ? styles.faqIconRotate : ''}`}
                  />
                </button>
                {activeFaq === idx && <div className={styles.faqAnswer}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          13. FINAL HIGH-IMPACT CELEBRATION CTA
          ══════════════════════════════════════════════════ */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className="container">
          <div className={styles.finalCtaBanner}>
            <h2 className={styles.finalCtaTitle}>Ready to Create Your Perfect Celebration?</h2>
            <p className={styles.finalCtaSub}>
              Slots fill up quickly on weekends and evenings. Explore our suites or use quick booking to lock your private celebration theatre in Jayanagar today.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '14px 34px', fontSize: '1rem' }}
                onClick={() => {
                  setPreselectedRoomId('');
                  setPreselectedOccasion('');
                  setIsBookingModalOpen(true);
                }}
              >
                <span>Book Now</span>
                <ArrowRight size={18} />
              </button>
              <a
                href="#theatres"
                className="btn btn-secondary"
                style={{ padding: '14px 30px', fontSize: '1rem' }}
              >
                <span>Explore Experiences</span>
              </a>
              <a
                href="tel:+919900106474"
                className="btn btn-secondary"
                style={{ padding: '14px 28px', fontSize: '1rem' }}
              >
                <Phone size={16} />
                <span>Call Concierge</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          14. FOOTER
          ══════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <Link href="/" style={{ display: 'inline-block', marginBottom: '14px' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/bee-vibe-logo-light.png"
                  alt="BeeVibe Mini Private Theater"
                  className={styles.footerLogoImg}
                />
              </Link>
              <p className={styles.footerDesc}>
                Bangalore&apos;s premier private celebration theatre, mini party hall &amp; PS5 gaming lounge in Jayanagar 9th Block.
              </p>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Themes &amp; Suites</h4>
              <ul className={styles.footerLinks}>
                <li><Link href="/themes">Angel Wings &amp; Neon</Link></li>
                <li><Link href="/themes">Red Velvet Romance</Link></li>
                <li><Link href="/themes">Royal Butterfly VIP</Link></li>
                <li><Link href="/themes">PS5 Gaming Lounge</Link></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Quick Links</h4>
              <ul className={styles.footerLinks}>
                <li><a href="#gallery">Photo Gallery</a></li>
                <li><a href="#theatres">Celebration Packages</a></li>
                <li><a href="#add-ons">Curated Add-ons</a></li>
                <li><a href="#why-beevibe">Why BeeVibe</a></li>
                <li><a href="#location">Venue Location</a></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Contact</h4>
              <p style={{ color: '#786B68', fontSize: '0.85rem', margin: '0 0 10px 0', lineHeight: '1.6' }}>
                <a href="tel:+919900106474" style={{ color: '#30211F', fontWeight: 800, textDecoration: 'none' }}>
                  📞 Call to Book: +91 99001 06474
                </a><br />
                ⏰ 10:00 AM – 12:00 AM Daily
              </p>
              <a
                href="https://wa.me/919900106474"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              >
                <MessageSquare size={14} /> WhatsApp Concierge
              </a>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>&copy; {new Date().getFullYear()} BeeVibe Private Celebration Theatre. All rights reserved. Jayanagar 9th Block, Bengaluru.</p>
          </div>
        </div>
      </footer>

      {/* ─── Sticky Mobile Booking Bar ─── */}
      <div className={styles.stickyMobileBar}>
        <a href="#theatres" className={styles.mobileStickyThemeBtn}>
          Experiences
        </a>
        <button
          type="button"
          className={styles.stickyBtn}
          onClick={() => {
            setPreselectedRoomId('');
            setPreselectedOccasion('');
            setIsBookingModalOpen(true);
          }}
        >
          BOOK NOW →
        </button>
      </div>

      {/* ─── Room Details Inspection Modal ─── */}
      <RoomDetailsModal
        room={inspectingRoom}
        onClose={() => setInspectingRoom(null)}
        onSelectAndBook={(roomId) => handleBookRoom(roomId)}
      />

      {/* ─── Gallery Full-Resolution Lightbox Modal ─── */}
      <GalleryLightboxModal
        item={activeLightboxItem}
        onClose={() => setActiveLightboxItem(null)}
        onBookExperience={(category) => {
          setActiveLightboxItem(null);
          const matched = ROOMS.find((r) => r.occasion === category || r.id === category);
          if (matched) {
            handleBookRoom(matched.id);
          } else {
            setIsBookingModalOpen(true);
          }
        }}
      />

      {/* ─── Interactive Booking Engine Modal ─── */}
      <BookingFlowModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialRoomId={preselectedRoomId}
        initialOccasion={preselectedOccasion}
        initialDate={selectedDate}
        initialGuests={guestCount}
        initialSlot={preselectedSlot}
        initialPhone={preselectedPhone}
      />
    </div>
  );
}
