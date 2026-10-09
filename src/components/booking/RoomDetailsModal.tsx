'use client';

import React, { useState } from 'react';
import { X, Users, Clock, Tv, Volume2, Shield, Sparkles, Check, ArrowRight, Calendar } from 'lucide-react';
import { RoomExperience, ADD_ONS } from '@/types/booking';
import styles from './RoomDetailsModal.module.css';

interface RoomDetailsModalProps {
  room: RoomExperience | null;
  onClose: () => void;
  onSelectAndBook: (roomId: string) => void;
}

export default function RoomDetailsModal({
  room,
  onClose,
  onSelectAndBook,
}: RoomDetailsModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!room) return null;

  const gallery = room.galleryImages && room.galleryImages.length > 0 ? room.galleryImages : [room.image];
  const activeImage = gallery[activeImageIdx] || room.image;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Scroll Container */}
        <div className={styles.scrollArea}>
          {/* Main Visual Gallery Stage */}
          <div className={styles.galleryStage}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeImage} alt={room.name} className={styles.mainImg} />
            <div className={styles.galleryOverlay}>
              <div className={styles.badgeRow}>
                <span className={styles.occasionBadge}>
                  <Sparkles size={13} /> {room.occasionLabel}
                </span>
                <span className={styles.verifiedBadge}>
                  📸 Authentic BeeVibe Setup
                </span>
              </div>
            </div>

            {/* Thumbnail switcher if multiple photos */}
            {gallery.length > 1 && (
              <div className={styles.thumbRow}>
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`${styles.thumbBtn} ${activeImageIdx === idx ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImageIdx(idx)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`View ${idx + 1}`} className={styles.thumbImg} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Room Content Header */}
          <div className={styles.detailsContent}>
            <div className={styles.headerRow}>
              <div>
                <span className={styles.themeSubtitle}>{room.theme}</span>
                <h2 className={styles.roomName}>{room.name}</h2>
              </div>
              <div className={styles.headerDurationBadge}>
                <Clock size={14} />
                <span>{room.duration} Session</span>
              </div>
            </div>

            <p className={styles.description}>{room.description}</p>

            {/* Key Specifications Grid */}
            <div className={styles.specsGrid}>
              <div className={styles.specBox}>
                <Users size={18} className={styles.specIcon} />
                <div className={styles.specText}>
                  <strong>Capacity</strong>
                  <span>{room.capacity}</span>
                </div>
              </div>
              <div className={styles.specBox}>
                <Clock size={18} className={styles.specIcon} />
                <div className={styles.specText}>
                  <strong>Duration</strong>
                  <span>{room.duration} Included</span>
                </div>
              </div>
              <div className={styles.specBox}>
                <Tv size={18} className={styles.specIcon} />
                <div className={styles.specText}>
                  <strong>Display</strong>
                  <span>180&quot; 4K Laser Screen</span>
                </div>
              </div>
              <div className={styles.specBox}>
                <Volume2 size={18} className={styles.specIcon} />
                <div className={styles.specText}>
                  <strong>Audio</strong>
                  <span>7.1 Dolby Atmos</span>
                </div>
              </div>
            </div>

            {/* Features Checklist */}
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>What&apos;s Included In This Suite</h4>
              <div className={styles.featuresList}>
                {room.features.map((feat, idx) => (
                  <div key={idx} className={styles.featureItem}>
                    <div className={styles.checkBullet}>
                      <Check size={13} />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Available Add-Ons Highlights */}
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>Customizable Add-Ons Available</h4>
              <p className={styles.sectionSubtitle}>You can add any of these during your booking step:</p>
              <div className={styles.addonsList}>
                {ADD_ONS.slice(0, 4).map((addon) => (
                  <div key={addon.id} className={styles.addonItem}>
                    <span className={styles.addonIcon}>{addon.icon}</span>
                    <div className={styles.addonInfo}>
                      <strong>{addon.name}</strong>
                      <span>{addon.description}</span>
                    </div>
                    <span className={styles.addonTag}>Available</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Location & Policies reminder */}
            <div className={styles.policyNotice}>
              <Shield size={16} className={styles.policyIcon} />
              <span>
                100% Private &amp; Soundproof Suite in Jayanagar 9th Block. No other guests share your hall. Advance deposit required to lock slot.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className={styles.modalFooter}>
          <div className={styles.footerPerks}>
            <span className={styles.footerPerkText}>100% Private Celebration Suite • Jayanagar 9th Block</span>
          </div>
          <button
            type="button"
            className={styles.bookNowBtn}
            onClick={() => onSelectAndBook(room.id)}
          >
            <span>CONTINUE BOOKING</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
