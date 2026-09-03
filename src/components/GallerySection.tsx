'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Camera,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  Cake,
  Gamepad2,
  Film,
  Calendar,
  Layers,
  ArrowRight,
  Share2
} from 'lucide-react';
import styles from './GallerySection.module.css';

// Custom Instagram icon
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

export type GalleryCategory = 'all' | 'birthday' | 'romantic' | 'gaming' | 'cinema' | 'decor';

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  categoryLabel: string;
  theme: string;
  themeColor: string;
  image: string;
  description: string;
  tags: string[];
  bookingLink?: string;
  highlights: string[];
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'theme-red-heart',
    title: 'Red Velvet Romance & Floral Heart',
    category: 'romantic',
    categoryLabel: 'Romantic Dates & Anniversary ❤️',
    theme: 'Red Theme ❤️ (₹799)',
    themeColor: '#ef4444',
    image: '/gallery/theme-red.jpg',
    description: 'Immersive Red Velvet setup featuring a huge floral heart with "Happy Anniversary" neon light, red shimmer backdrop, lighted arch, plush velvet seating, and 180" 4K theater screen.',
    tags: ['Floral Red Heart', 'Happy Anniversary Neon', 'Red Shimmer Wall', '180" 4K Screen', '7.1 Dolby Atmos'],
    highlights: ['₹799 for 2 Hours (Base 2 Guests)', '100% Private & Soundproof Suite', 'Complimentary Rose Petal Setup'],
    bookingLink: '/book?theme=red'
  },
  {
    id: 'theme-pink-wings',
    title: 'Pink Angel Wings & Neon Magic',
    category: 'birthday',
    categoryLabel: 'Birthday Celebration 🩷',
    theme: 'Pink Theme 🩷 (₹899)',
    themeColor: '#ec4899',
    image: '/gallery/theme-pink.jpg',
    description: 'Vibrant pink birthday setup with giant illuminated glowing angel wings, balloon cluster, pink sequin shimmer arch with "Happy Birthday" neon, and hot pink velvet recliners.',
    tags: ['Giant Glowing Angel Wings', 'Happy Birthday Neon', 'Pink Shimmer Arch', '180" 4K Cinema', 'Picket Fence Decor'],
    highlights: ['₹899 for 2 Hours (Base 2 Guests)', 'Private Cake Cutting Stage', 'Custom Movie / OTT Screening'],
    bookingLink: '/book?theme=pink'
  },
  {
    id: 'theme-purple-butterfly',
    title: 'Royal Purple Floral & Butterfly Wings',
    category: 'birthday',
    categoryLabel: 'VIP Birthday Celebration 💜',
    theme: 'Purple Theme 💜 (₹999)',
    themeColor: '#a855f7',
    image: '/gallery/theme-purple.jpg',
    description: 'Grand triple-arched purple celebration suite with lush balloon arches, glowing butterfly wings neon, gold sequin backdrop, marquee lighted "HAPPY BIRTHDAY" letters, and cake table.',
    tags: ['Triple Arch Setup', 'Butterfly Wings Neon', 'Marquee Lighted Letters', 'Gold Sequin Wall', '180" 4K Screen'],
    highlights: ['₹999 for 2 Hours (Base 2 Guests)', 'VIP Photo-Op Backdrops', 'Surround Sound Audio'],
    bookingLink: '/book?theme=purple'
  },
  {
    id: 'gaming-ps5-lounge',
    title: 'PS5 Pro Multiplayer Gaming Realm',
    category: 'gaming',
    categoryLabel: 'PS5 Gaming Arena 🎮',
    theme: 'Cyber Gaming 🎮 (₹399/hr)',
    themeColor: '#00f0ff',
    image: '/gallery/ps5-gaming.jpg',
    description: 'Private high-octane gaming lounge with Sony PlayStation 5, DualSense wireless controllers, top AAA games (FC 24, Tekken 8, MK1, Spider-Man 2), and 180" 4K display.',
    tags: ['Sony PlayStation 5', '2x DualSense Controllers', 'EA Sports FC 24', 'Tekken 8', '180" 4K Screen'],
    highlights: ['₹399 / Hour (Min 1 Hr)', 'No Waiting / Full Room Privacy', 'Instant Snack & Drinks Service'],
    bookingLink: '/gaming/book'
  },
  {
    id: 'fog-entry-effect',
    title: 'Cinematic Special Fog Entry',
    category: 'decor',
    categoryLabel: 'Special Effects 🌫️',
    theme: 'Special Effects (₹300)',
    themeColor: '#f2a900',
    image: '/gallery/fog-decor.jpg',
    description: 'Create unforgettable cinematic memories with ground-hugging cold fog effects across the private theater floor during cake cutting or surprise entry.',
    tags: ['Cold Fog Machine', 'Surprise Grand Entry', 'Photo & Video Friendly'],
    highlights: ['Add-on from ₹300', 'Safe & Odorless', 'Available on All Themes'],
    bookingLink: '/book'
  }
];

export interface GallerySectionProps {
  initialCategory?: GalleryCategory;
  isStandalonePage?: boolean;
}

export default function GallerySection({ initialCategory = 'all', isStandalonePage = false }: GallerySectionProps) {
  const [activeCategory, setActiveCategory] = useState<GalleryCategory>(initialCategory);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [imageLoadedMap, setImageLoadedMap] = useState<Record<string, boolean>>({});
  const [visibleCards, setVisibleCards] = useState<Set<string>>(new Set());
  const [sectionVisible, setSectionVisible] = useState(false);
  const galleryGridRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const filteredItems = activeCategory === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === activeCategory);

  const activeItem = selectedIdx !== null ? filteredItems[selectedIdx] : null;

  // Mark image as loaded
  const handleImageLoad = useCallback((id: string) => {
    setImageLoadedMap((prev) => ({ ...prev, [id]: true }));
  }, []);

  const handleNext = useCallback(() => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0));
  }, [selectedIdx, filteredItems.length]);

  const handlePrev = useCallback(() => {
    if (selectedIdx === null) return;
    setSelectedIdx((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1));
  }, [selectedIdx, filteredItems.length]);

  const handleClose = useCallback(() => {
    setSelectedIdx(null);
  }, []);

  // Share functionality
  const handleShare = useCallback(async (item: GalleryItem) => {
    const shareData = {
      title: `${item.title} — Bee Vibe Party Hall`,
      text: item.description,
      url: `https://www.beevibe.org/gallery#${item.id}`,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      } catch { /* fallback */ }
    }
  }, []);

  // Keyboard navigation support for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIdx === null) return;
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, handleClose, handleNext, handlePrev]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedIdx !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedIdx]);

  // Section header reveal on scroll
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Staggered card reveal with IntersectionObserver
  useEffect(() => {
    const grid = galleryGridRef.current;
    if (!grid) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardId = (entry.target as HTMLElement).dataset.cardId;
            if (cardId) {
              setVisibleCards((prev) => new Set(prev).add(cardId));
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const cards = grid.querySelectorAll('[data-card-id]');
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [filteredItems, activeCategory]);

  // Reset visible cards when category changes (for re-triggering stagger)
  useEffect(() => {
    setVisibleCards(new Set());
  }, [activeCategory]);

  const categories: { id: GalleryCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Highlights', icon: <Layers size={14} /> },
    { id: 'birthday', label: 'Birthdays 🎂', icon: <Cake size={14} /> },
    { id: 'romantic', label: 'Couples & Dates 💖', icon: <Heart size={14} /> },
    { id: 'gaming', label: 'PS5 Gaming 🎮', icon: <Gamepad2 size={14} /> },
    { id: 'cinema', label: 'Private Cinema 🍿', icon: <Film size={14} /> },
    { id: 'decor', label: 'Decor & Fog ✨', icon: <Sparkles size={14} /> },
  ];

  // Compute stagger delay for a card based on its position in the filtered list
  const getStaggerDelay = (idx: number): string => {
    return `${idx * 80}ms`;
  };

  return (
    <section id="gallery" className={styles.gallerySection} ref={sectionRef}>
      <div className="container">
        {/* Section Header with reveal animation */}
        <div className={`${styles.sectionHeader} ${sectionVisible ? styles.sectionHeaderVisible : ''}`}>
          <div className={styles.badge}>
            <Camera size={14} /> Bee Vibe Visual Experience
          </div>
          <h2 className={styles.title}>
            {isStandalonePage ? 'Bee Vibe Photo & Experience Gallery' : 'Our Celebration & Theater Gallery'}
          </h2>
          <p className={styles.subtitle}>
            Explore real moments, custom mood setups, PS5 gaming battles, romantic surprises, and celebration decorations hosted at Bee Vibe Party Hall Bangalore.
          </p>
        </div>

        {/* Category Filters with active indicator animation */}
        <div className={`${styles.filterContainer} ${sectionVisible ? styles.filterContainerVisible : ''}`}>
          {categories.map((cat) => {
            const count = cat.id === 'all'
              ? GALLERY_ITEMS.length
              : GALLERY_ITEMS.filter((i) => i.category === cat.id).length;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                className={`${styles.filterBtn} ${isActive ? styles.filterBtnActive : ''}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedIdx(null);
                }}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span className={styles.filterCount}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Gallery Grid with staggered entrance animations */}
        <div className={styles.galleryGrid} ref={galleryGridRef}>
          {filteredItems.map((item, idx) => {
            const isLoaded = imageLoadedMap[item.id] || false;
            const isVisible = visibleCards.has(item.id);

            return (
              <div
                key={item.id}
                data-card-id={item.id}
                className={`${styles.card} ${isVisible ? styles.cardVisible : ''}`}
                style={{ transitionDelay: getStaggerDelay(idx) }}
                onClick={() => setSelectedIdx(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedIdx(idx);
                  }
                }}
              >
                <div className={styles.imageWrapper}>
                  <div
                    className={styles.cardThemeBadge}
                    style={{ borderLeft: `3px solid ${item.themeColor}` }}
                  >
                    {item.theme}
                  </div>

                  {/* Skeleton shimmer placeholder */}
                  {!isLoaded && (
                    <div className={styles.skeleton}>
                      <div className={styles.skeletonShimmer} />
                    </div>
                  )}

                  <img
                    src={item.image}
                    alt={item.title}
                    className={`${styles.image} ${isLoaded ? styles.imageLoaded : styles.imageLoading}`}
                    loading="lazy"
                    onLoad={() => handleImageLoad(item.id)}
                  />
                  <div className={styles.imageOverlay}>
                    <div className={styles.overlayAction}>
                      <Eye size={16} /> View Details
                    </div>
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardMeta}>
                    <span className={styles.cardCategoryLabel}>{item.categoryLabel}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardDesc}>{item.description}</p>
                  <div className={styles.cardTags}>
                    {item.tags.slice(0, 3).map((tag, tIdx) => (
                      <span key={tIdx} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Results count indicator */}
        <div className={styles.resultsCount}>
          Showing {filteredItems.length} of {GALLERY_ITEMS.length} experiences
        </div>

        {/* Instagram Reel & Live Stories Banner */}
        <div className={styles.instagramBanner}>
          <div className={styles.instaLeft}>
            <div className={styles.instaIconWrap}>
              <Instagram size={28} color="#ffffff" />
            </div>
            <div>
              <h3 className={styles.instaTitle}>Want to see live reels & daily tagged stories?</h3>
              <p className={styles.instaSub}>
                Follow <strong>@beevibe_partyhall</strong> on Instagram for real customer videos, celebration inspiration, and behind-the-scenes vibes.
              </p>
            </div>
          </div>
          <a
            href="https://www.instagram.com/beevibe_partyhall/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.instaBtn}
          >
            <Instagram size={18} /> Follow on Instagram
          </a>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeItem && selectedIdx !== null && (
        <div className={styles.modalBackdrop} onClick={handleClose}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.modalCloseBtn}
              onClick={handleClose}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className={styles.modalBody}>
              {/* Image Preview & Arrows */}
              <div className={styles.modalImageArea}>
                <button
                  className={`${styles.navArrow} ${styles.prevArrow}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>

                <img
                  src={activeItem.image}
                  alt={activeItem.title}
                  className={styles.modalImage}
                />

                {/* Image counter */}
                <div className={styles.imageCounter}>
                  {selectedIdx + 1} / {filteredItems.length}
                </div>

                <button
                  className={`${styles.navArrow} ${styles.nextArrow}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Information & Booking Actions */}
              <div className={styles.modalDetails}>
                <div
                  className={styles.modalThemeBadge}
                  style={{
                    backgroundColor: `${activeItem.themeColor}22`,
                    border: `1px solid ${activeItem.themeColor}`,
                    color: activeItem.themeColor
                  }}
                >
                  <Sparkles size={14} /> {activeItem.theme}
                </div>

                <h3 className={styles.modalTitle}>{activeItem.title}</h3>
                <p className={styles.modalDesc}>{activeItem.description}</p>

                <div className={styles.highlightsTitle}>What's Included:</div>
                <ul className={styles.highlightsList}>
                  {activeItem.highlights.map((hl, hIdx) => (
                    <li key={hIdx} className={styles.highlightItem}>
                      <span className={styles.highlightDot} style={{ backgroundColor: activeItem.themeColor }} />
                      {hl}
                    </li>
                  ))}
                  {activeItem.tags.map((tag, tIdx) => (
                    <li key={`tag-${tIdx}`} className={styles.highlightItem}>
                      <span className={styles.highlightDot} style={{ backgroundColor: activeItem.themeColor }} />
                      {tag}
                    </li>
                  ))}
                </ul>

                <div className={styles.modalActions}>
                  <Link
                    href={activeItem.bookingLink || '/book'}
                    className={`btn btn-primary ${styles.modalBookBtn}`}
                    onClick={handleClose}
                  >
                    <Calendar size={18} /> Book This Experience Now <ArrowRight size={16} />
                  </Link>
                  <button
                    className={`btn btn-secondary ${styles.modalShareBtn}`}
                    onClick={() => handleShare(activeItem)}
                  >
                    <Share2 size={16} /> Share This Setup
                  </button>
                </div>
              </div>
            </div>

            {/* Thumbnail Tray */}
            <div className={styles.thumbnailTray}>
              {filteredItems.map((item, tIdx) => (
                <button
                  key={item.id}
                  className={`${styles.thumbBtn} ${selectedIdx === tIdx ? styles.thumbBtnActive : ''}`}
                  onClick={() => setSelectedIdx(tIdx)}
                >
                  <img src={item.image} alt={item.title} className={styles.thumbImg} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
