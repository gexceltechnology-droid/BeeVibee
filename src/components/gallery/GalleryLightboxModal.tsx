'use client';

import React, { useEffect } from 'react';
import { X, Sparkles, Calendar, ArrowRight, ShieldCheck, Tv, MapPin } from 'lucide-react';
import styles from './GalleryLightboxModal.module.css';

export interface GalleryLightboxItem {
  id: number | string;
  category: string;
  title: string;
  image: string;
  description?: string;
}

interface GalleryLightboxModalProps {
  item: GalleryLightboxItem | null;
  onClose: () => void;
  onBookExperience: (category: string) => void;
}

export default function GalleryLightboxModal({
  item,
  onClose,
  onBookExperience,
}: GalleryLightboxModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (item) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Close Lightbox"
        >
          <X size={20} />
        </button>

        {/* High-Resolution Photo Display */}
        <div className={styles.photoStage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.image} alt={item.title} className={styles.photoImg} />
          
          <div className={styles.categoryPill}>
            <Sparkles size={12} /> {item.category.toUpperCase()} SUITE
          </div>
        </div>

        {/* Details & Instant Booking Action */}
        <div className={styles.detailsContent}>
          <div className={styles.titleRow}>
            <h3 className={styles.photoTitle}>{item.title}</h3>
            <span className={styles.venueBadge}>
              <MapPin size={12} /> Jayanagar 9th Block
            </span>
          </div>

          <p className={styles.photoDesc}>
            Authentic photography captured inside BeeVibe. Includes 180&quot; 4K laser projection cinema, 7.1 Dolby Atmos sound, custom theme decor, and complete 100% private soundproof hall.
          </p>

          <div className={styles.perksRow}>
            <span className={styles.perkItem}><Tv size={13} /> 180&quot; 4K Screen</span>
            <span className={styles.perkItem}><ShieldCheck size={13} /> 100% Private</span>
            <span className={styles.perkItem}><Sparkles size={13} /> Complimentary Cold Fog</span>
          </div>

          <div className={styles.actionsRow}>
            <button
              type="button"
              className={styles.bookThemeBtn}
              onClick={() => onBookExperience(item.category)}
            >
              <span>Book This Experience Now</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className={styles.closeSecondaryBtn}
              onClick={onClose}
            >
              Back to Gallery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
