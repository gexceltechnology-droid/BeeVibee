'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Zap
} from 'lucide-react';
import BookingFinder from '@/components/booking/BookingFinder';
import RoomDetailsModal from '@/components/booking/RoomDetailsModal';
import BookingFlowModal from '@/components/booking/BookingFlowModal';
import WhatsAppBotWidget from '@/components/WhatsAppBotWidget';
import { ROOMS, OCCASIONS, RoomExperience, OccasionType } from '@/types/booking';
import styles from './page.module.css';

export default function Home() {
  const todayStr = new Date().toISOString().split('T')[0];

  // Active Search / Filter State
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeOccasionFilter, setActiveOccasionFilter] = useState<'all' | OccasionType>('all');
  const [guestCount, setGuestCount] = useState<number>(2);
  const [preferredTime, setPreferredTime] = useState<string>('any');

  // Modal States
  const [inspectingRoom, setInspectingRoom] = useState<RoomExperience | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string>('angel-wings');
  const [preselectedOccasion, setPreselectedOccasion] = useState<OccasionType>('birthday');

  // UI state
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeGalleryTab, setActiveGalleryTab] = useState<'all' | 'birthday' | 'romantic' | 'vip' | 'gaming'>('all');

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
  }) => {
    setSelectedDate(params.date);
    setActiveOccasionFilter(params.occasion);
    setPreselectedOccasion(params.occasion);
    setGuestCount(params.guestCount);
    setPreferredTime(params.preferredTime);
    setIsBookingModalOpen(true);
  };

  // Open booking flow directly for a specific room
  const handleBookRoom = (roomId: string) => {
    const targetRoom = ROOMS.find((r) => r.id === roomId);
    setPreselectedRoomId(roomId);
    if (targetRoom) {
      setPreselectedOccasion(targetRoom.occasion);
    }
    setInspectingRoom(null);
    setIsBookingModalOpen(true);
  };

  // Reviews Data
  const reviews = [
    {
      name: 'Ananya & Vikram',
      occasion: 'Birthday Celebration 🎂',
      quote:
        'Celebrated my boyfriend\'s 25th birthday here in Jayanagar. The 180-inch screen and personalized LED name board had us stunned! 100% private and soundproof.',
      rating: 5,
    },
    {
      name: 'Sneha R.',
      occasion: 'Surprise Party 🩷',
      quote:
        'Booked the Angel Wings & Neon room for my sister\'s surprise party. The fog entry effect during cake cutting was pure cinema. Booking online took less than 2 minutes!',
      rating: 5,
    },
    {
      name: 'Pradeep K.',
      occasion: 'PS5 Gaming Night 🎮',
      quote:
        'The PS5 setup on the 180-inch 4K screen with 7.1 surround sound is insane. Played EA FC 24 and Tekken 8 with friends. Best private gaming lounge in Bangalore.',
      rating: 5,
    },
  ];

  // Gallery Data
  const galleryItems = [
    { id: 1, category: 'birthday', title: 'Angel Wings & Birthday Stage', image: '/gallery/theme-pink.jpg' },
    { id: 2, category: 'romantic', title: 'Red Velvet Heart Romance Suite', image: '/gallery/theme-red.jpg' },
    { id: 3, category: 'vip', title: 'Royal Butterfly Grandeur VIP', image: '/gallery/theme-purple.jpg' },
    { id: 4, category: 'gaming', title: 'PS5 4K Gaming Arena with DualSense', image: '/gallery/ps5-gaming.jpg' },
    { id: 5, category: 'birthday', title: 'Celebration Stage with Cake Pedestal', image: '/gallery/birthday-celebration.jpg' },
    { id: 6, category: 'romantic', title: 'Candlelight & Floral Heart Setup', image: '/gallery/romantic-date.jpg' },
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
      <WhatsAppBotWidget />

      {/* ══════════════════════════════════════════════════
          NAVBAR
          ══════════════════════════════════════════════════ */}
      <div className={`${styles.headerContainer} ${isScrolled ? styles.headerContainerScrolled : ''}`}>
        {/* Scrolling Announcement Bar */}
        <div
          className={styles.tickerBar}
          onClick={() => {
            setPreselectedRoomId('angel-wings');
            setIsBookingModalOpen(true);
          }}
        >
          <div className={styles.tickerWrapper}>
            <div className={styles.tickerTrack}>
              <span>🎉 SPECIAL CELEBRATION OFFER: Apply Coupon Code <strong className={styles.tickerBadge}>BEEVIBE999</strong> at checkout — Every Theme for flat ₹999/- with Complimentary Fog Entry, LED Name Board, Rose Petal Table Decor &amp; All OTT Platforms!</span>
              <span className={styles.tickerDivider}>✦</span>
              <span>📍 100% Private Celebration Theatre in Jayanagar 9th Block</span>
              <span className={styles.tickerDivider}>✦</span>
              <span>✨ Tap to Check Live Availability &amp; Book Your Private Suite →</span>
              <span className={styles.tickerDivider}>✦</span>
              <span>🎉 SPECIAL CELEBRATION OFFER: Apply Coupon Code <strong className={styles.tickerBadge}>BEEVIBE999</strong> at checkout — Every Theme for flat ₹999/- with Complimentary Fog Entry, LED Name Board, Rose Petal Table Decor &amp; All OTT Platforms!</span>
              <span className={styles.tickerDivider}>✦</span>
              <span>📍 100% Private Celebration Theatre in Jayanagar 9th Block</span>
              <span className={styles.tickerDivider}>✦</span>
              <span>✨ Tap to Check Live Availability &amp; Book Your Private Suite →</span>
            </div>
          </div>
        </div>

        <div className="container">
          <header className={styles.header}>
            <Link href="/" className={styles.logoWrapper}>
              <div>
                <span className={styles.logoText}>
                  BEE<span className={styles.logoTextHighlight}>VIBE</span>
                </span>
                <span className={styles.logoTagline}>Private Celebration Theatre</span>
              </div>
            </Link>

            <nav className={styles.desktopNav}>
              <ul className={styles.navLinks}>
                <li><Link href="/" className={styles.navLink}>Home</Link></li>
                <li><Link href="/themes" className={styles.navLink}>Themes</Link></li>
                <li><a href="#why-beevibe" className={styles.navLink}>Why BeeVibe</a></li>
                <li><a href="#how-it-works" className={styles.navLink}>How It Works</a></li>
                <li><a href="#gallery" className={styles.navLink}>Gallery</a></li>
                <li><a href="#location" className={styles.navLink}>Location</a></li>
              </ul>
            </nav>

            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.headerBookBtn}
                onClick={() => {
                  setPreselectedRoomId('angel-wings');
                  setIsBookingModalOpen(true);
                }}
              >
                <span>QUICK BOOK</span>
                <ArrowRight size={14} />
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
              <li><Link href="/" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Home</Link></li>
              <li><Link href="/themes" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Themes</Link></li>
              <li><a href="#why-beevibe" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Why BeeVibe</a></li>
              <li><a href="#how-it-works" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>How It Works</a></li>
              <li><a href="#gallery" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Gallery</a></li>
              <li><a href="#location" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>Location</a></li>
              <li style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsBookingModalOpen(true);
                  }}
                >
                  QUICK BOOK NOW →
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          1. HERO SECTION + PROMINENT BOOKING FINDER
          ══════════════════════════════════════════════════ */}
      <section className={styles.heroSection}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <Sparkles size={14} /> Private celebration theatre in Bengaluru
            </div>

            <h1 className={styles.heroTitle}>
              Your Private Cinema.<br />
              <span className={styles.heroTitleHighlight}>Unforgettable Celebrations.</span>
            </h1>

            <p className={styles.heroDescription}>
              Bangalore&apos;s premier private celebration theatre &amp; party hall in Jayanagar 9th Block. Book 100% private soundproof suites with 180-inch 4K laser projection, 7.1 Dolby Atmos sound, custom lighting, and dedicated PS5 gaming.
            </p>

            <div className={styles.heroCtas}>
              <Link href="/themes" className="btn btn-primary">
                <span>Explore Themes</span>
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                className="btn btn-navy"
                onClick={() => setIsBookingModalOpen(true)}
              >
                <Sparkles size={16} /> Quick Booking
              </button>
              <a
                href="https://wa.me/919900106474?text=Hi%20Bee%20Vibe!%20I%20want%20to%20inquire%20about%20booking%20a%20private%20celebration%20theatre."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <MessageSquare size={16} /> WhatsApp Us
              </a>
            </div>

            {/* Trust Points Bar */}
            <div className={styles.heroTrustBar}>
              <div className={styles.trustItem}>
                <span className={styles.trustItemIcon}>🎬</span>
                <span>180&quot; 4K Cinema</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustItemIcon}>🔊</span>
                <span>7.1 Surround Sound</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustItemIcon}>🔒</span>
                <span>100% Private</span>
              </div>
              <div className={styles.trustItem}>
                <span className={styles.trustItemIcon}>📍</span>
                <span>Jayanagar 9th Block</span>
              </div>
            </div>
          </div>

          {/* Prominent Booking / Search Finder Card */}
          <BookingFinder
            onSearch={handleFinderSearch}
            initialDate={selectedDate}
            initialOccasion={activeOccasionFilter === 'all' ? 'birthday' : activeOccasionFilter}
            initialGuests={guestCount}
          />

          {/* Authentic BeeVibe Theatre Venue Ambience */}
          <div className={styles.venueShowcaseBanner}>
            <div className={styles.venueShowcaseImgWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/gallery/birthday-celebration.jpg"
                alt="BeeVibe Private Celebration Theatre in Jayanagar"
                className={styles.venueShowcaseImg}
              />
              <div className={styles.venueShowcaseOverlay}>
                <div className={styles.venueBadge}>
                  <Sparkles size={14} /> JAYANAGAR 9TH BLOCK, BENGALURU
                </div>
                <h3 className={styles.venueBannerTitle}>A Private World For Your Special Moments</h3>
                <p className={styles.venueBannerText}>
                  Experience 100% soundproof acoustic privacy with giant 180&quot; 4K laser cinema, Dolby Atmos audio, cozy celebration lounge, and personalized lighting.
                </p>
                <div className={styles.venueBannerActions}>
                  <Link href="/themes" className="btn btn-primary">
                    <span>View All Themes &amp; Setups</span>
                    <ArrowRight size={15} />
                  </Link>
                  <button
                    type="button"
                    className="btn btn-soft"
                    onClick={() => setIsBookingModalOpen(true)}
                  >
                    Quick Book A Slot
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          2. WHAT IS BEEVIBE? (THE CONCEPT & VENUE INFO)
          ══════════════════════════════════════════════════ */}
      <section id="about" className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Sparkles size={13} /> THE BEEVIBE CONCEPT
            </div>
            <h2 className={styles.sectionTitle}>What is a Private Celebration Theatre?</h2>
            <p className={styles.sectionSubtitle}>
              Tired of noisy restaurants and generic party halls? BeeVibe offers an exclusive, high-tech private sanctuary designed specifically for memorable celebrations.
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
                Immersive surround sound acoustics tuned to fill the room with cinematic punch, crisp dialogues, and bone-rattling bass for movies and music playlists.
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

          {/* Callout Card to the dedicated Themes Page */}
          <div className={styles.exploreThemesCallout}>
            <div className={styles.calloutText}>
              <span className={styles.calloutTag}>CURATED CELEBRATION SUITES</span>
              <h3 className={styles.calloutTitle}>Explore Our Unique Celebration Themes</h3>
              <p className={styles.calloutDesc}>
                We have distinct rooms designed for Birthdays, Romantic Dates, Grand VIP Galas, and Gaming. Visit our dedicated Themes page to see full setups, photos, and inclusions.
              </p>
            </div>
            <div className={styles.calloutActions}>
              <Link href="/themes" className="btn btn-primary">
                <span>View Themes &amp; Setups</span>
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsBookingModalOpen(true)}
              >
                Quick Book Directly
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. WHY BEEVIBE (THE CELEBRATION EXPERIENCE)
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
              <div className={styles.featureIconWrap}>
                <Tv size={26} />
              </div>
              <h3 className={styles.featureTitle}>180&quot; 4K Laser Cinema</h3>
              <p className={styles.featureDesc}>
                True-to-life 4K laser projection delivering crystal-sharp visuals on a massive 15-foot theatre display.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Volume2 size={26} />
              </div>
              <h3 className={styles.featureTitle}>7.1 Dolby Atmos Sound</h3>
              <p className={styles.featureDesc}>
                Directional surround speakers calibrated for room-shaking audio with acoustic soundproofing for total isolation.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <ShieldCheck size={26} />
              </div>
              <h3 className={styles.featureTitle}>100% Private &amp; AC</h3>
              <p className={styles.featureDesc}>
                Zero interruptions or shared halls. The entire air-conditioned suite is exclusively yours for the booked slot.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Sparkles size={26} />
              </div>
              <h3 className={styles.featureTitle}>Cold Fog &amp; LED Decor</h3>
              <p className={styles.featureDesc}>
                Elevate cake cutting with ground-hugging dry ice fog effects, balloon arches, and custom LED name boards.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Gamepad2 size={26} />
              </div>
              <h3 className={styles.featureTitle}>PS5 Gaming Arena</h3>
              <p className={styles.featureDesc}>
                Sony PlayStation 5 console with DualSense wireless controllers. Play EA FC 24, Tekken 8, MK1 &amp; Spider-Man 2.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Coffee size={26} />
              </div>
              <h3 className={styles.featureTitle}>All OTTs &amp; Snacks</h3>
              <p className={styles.featureDesc}>
                Stream from Netflix, Prime, Hotstar, YouTube, or connect your own device. Warm popcorn &amp; food options available.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. HOW BOOKING WORKS
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
              <h3 className={styles.stepCardTitle}>Select Your Theme</h3>
              <p className={styles.stepCardDesc}>
                Explore our <Link href="/themes" style={{ color: 'var(--royal)', fontWeight: 700, textDecoration: 'underline' }}>Themes Page</Link> for curated birthday, romantic, VIP, or gaming setups.
              </p>
            </div>

            <div className={styles.stepCard}>
              <span className={styles.stepNumber}>03</span>
              <h3 className={styles.stepCardTitle}>Pick Your Time</h3>
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
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. REAL ROOM PHOTO GALLERY
          ══════════════════════════════════════════════════ */}
      <section id="gallery" className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Sparkles size={13} /> VENUE PHOTOGRAPHY
            </div>
            <h2 className={styles.sectionTitle}>Real Room Gallery</h2>
            <p className={styles.sectionSubtitle}>
              Authentic photography taken right inside our Jayanagar 9th Block celebration suites.
            </p>
          </div>

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

          <div className={styles.galleryGrid}>
            {filteredGallery.map((item) => (
              <div
                key={item.id}
                className={styles.galleryCard}
                onClick={() => {
                  const matched = ROOMS.find((r) => r.occasion === item.category);
                  if (matched) setInspectingRoom(matched);
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.title} className={styles.galleryImg} />
                <div className={styles.galleryOverlay}>
                  <span className={styles.galleryCaption}>{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. FEATURES TO HIGHLIGHT
          ══════════════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Award size={13} /> PREMIUM AMENITIES
            </div>
            <h2 className={styles.sectionTitle}>Features That Set Us Apart</h2>
            <p className={styles.sectionSubtitle}>
              Every BeeVibe suite is engineered with state-of-the-art audiovisuals and luxury party amenities.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Tv size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>180&quot; 4K Private Cinema</h3>
              <p className={styles.featureCardDesc}>
                Giant laser-sharp 4K projection for movies, memories &amp; slide shows.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Volume2 size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>7.1 Surround Sound</h3>
              <p className={styles.featureCardDesc}>
                Immersive acoustic calibration with bone-rattling bass &amp; crystal vocals.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Wind size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>Air Conditioning</h3>
              <p className={styles.featureCardDesc}>
                High-capacity climate control keeping your celebration fresh and cool.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Gamepad2 size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>PS5 Gaming</h3>
              <p className={styles.featureCardDesc}>
                PlayStation 5 with 4 DualSense wireless pads and latest multiplayer hits.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Sparkles size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>Custom Lighting</h3>
              <p className={styles.featureCardDesc}>
                Vibrant neon photo wings, ambient ceiling coves, and dimmable mood lights.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Cloud size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>Fog Entry</h3>
              <p className={styles.featureCardDesc}>
                Cinematic cold fog ground smoke for dramatic grand cake cutting entries.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Zap size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>LED Name Board</h3>
              <p className={styles.featureCardDesc}>
                Personalized glowing LED lightbox displaying your custom message or name.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <ShieldCheck size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>Private Room</h3>
              <p className={styles.featureCardDesc}>
                100% exclusive booking for your group with zero outsiders &amp; full soundproofing.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Film size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>Movies / OTT</h3>
              <p className={styles.featureCardDesc}>
                Pre-logged into Netflix, Prime Video, Disney+, Hotstar, YouTube &amp; HDMI plug-in.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIconWrap}>
                <Coffee size={22} />
              </div>
              <h3 className={styles.featureCardTitle}>Snacks &amp; Drinks</h3>
              <p className={styles.featureCardDesc}>
                Warm butter popcorn, mocktails, chips, and chilled soft drinks delivered inside.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. CUSTOMER REVIEWS
          ══════════════════════════════════════════════════ */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>
              <Star size={13} /> 4.9 STAR RATED VENUE
            </div>
            <h2 className={styles.sectionTitle}>Loved by Guests Across Bengaluru</h2>
            <p className={styles.sectionSubtitle}>
              Read how couples, birthday hosts, and gamers experienced BeeVibe celebration theatre.
            </p>
          </div>

          <div className={styles.reviewsGrid}>
            {reviews.map((rev, idx) => (
              <div key={idx} className={styles.reviewCard}>
                <div>
                  <div className={styles.reviewStars}>★★★★★</div>
                  <p className={styles.reviewQuote}>&ldquo;{rev.quote}&rdquo;</p>
                </div>
                <div className={styles.reviewerRow}>
                  <div className={styles.reviewerAvatar}>{rev.name[0]}</div>
                  <div className={styles.reviewerInfo}>
                    <strong className={styles.reviewerName}>{rev.name}</strong>
                    <span className={styles.reviewerTag}>{rev.occasion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          8. LOCATION & GOOGLE MAPS
          ══════════════════════════════════════════════════ */}
      <section id="location" className={`${styles.section} ${styles.sectionAlt}`}>
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
                <Clock size={16} /> Open Daily: 10:00 AM – 12:00 AM Midnight
              </div>

              <p className={styles.locationAddress}>
                <strong>BeeVibe Private Celebration Theatre</strong><br />
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
                  <MapPin size={16} /> Open in Google Maps
                </a>
                <a
                  href="https://wa.me/919900106474"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <MessageSquare size={16} /> WhatsApp Us
                </a>
                <a
                  href="tel:+919900106474"
                  className="btn btn-soft"
                >
                  <Phone size={16} /> Call Venue
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          9. FREQUENTLY ASKED QUESTIONS (FAQ)
          ══════════════════════════════════════════════════ */}
      <section className={styles.section}>
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
          10. FINAL HIGH-IMPACT BOOKING CTA
          ══════════════════════════════════════════════════ */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className="container">
          <div className={styles.finalCtaBanner}>
            <h2 className={styles.finalCtaTitle}>Ready to Create Unforgettable Memories?</h2>
            <p className={styles.finalCtaSub}>
              Slots fill up quickly on weekends and evenings. Explore our themes or use quick booking to lock your private celebration theatre in Jayanagar today.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/themes" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
                <span>EXPLORE THEMES</span>
                <ArrowRight size={18} />
              </Link>
              <button
                type="button"
                className={styles.finalCtaBtn}
                onClick={() => {
                  setPreselectedRoomId('angel-wings');
                  setIsBookingModalOpen(true);
                }}
              >
                <span>QUICK BOOK NOW</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          10. FOOTER
          ══════════════════════════════════════════════════ */}
      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <span className={styles.logoText}>
                BEE<span className={styles.logoTextHighlight}>VIBE</span>
              </span>
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
                <li><Link href="/themes">Celebration Themes</Link></li>
                <li><a href="#why-beevibe">Why BeeVibe</a></li>
                <li><a href="#how-it-works">How It Works</a></li>
                <li><a href="#gallery">Photo Gallery</a></li>
                <li><a href="#location">Venue Location</a></li>
              </ul>
            </div>

            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Contact</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 10px 0' }}>
                📞 +91 9900106474<br />
                ⏰ 10:00 AM – 12:00 AM Daily
              </p>
              <a
                href="https://wa.me/919900106474"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 14px' }}
              >
                <MessageSquare size={14} /> WhatsApp Support
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
        <Link href="/themes" className={styles.mobileStickyThemeBtn}>
          Themes
        </Link>
        <button
          type="button"
          className={styles.stickyBtn}
          onClick={() => {
            setPreselectedRoomId('angel-wings');
            setIsBookingModalOpen(true);
          }}
        >
          QUICK BOOK →
        </button>
      </div>

      {/* ─── Room Details Inspection Modal ─── */}
      <RoomDetailsModal
        room={inspectingRoom}
        onClose={() => setInspectingRoom(null)}
        onSelectAndBook={(roomId) => handleBookRoom(roomId)}
      />

      {/* ─── Interactive Booking Engine Modal ─── */}
      <BookingFlowModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        initialRoomId={preselectedRoomId}
        initialOccasion={preselectedOccasion}
        initialDate={selectedDate}
        initialGuests={guestCount}
      />
    </div>
  );
}
