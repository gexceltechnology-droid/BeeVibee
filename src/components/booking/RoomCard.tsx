'use client';

import React from 'react';
import { Users, Clock, Sparkles, Tv, Volume2, ArrowRight, Info, CheckCircle2 } from 'lucide-react';
import { RoomExperience } from '@/types/booking';
import styles from './RoomCard.module.css';

interface RoomCardProps {
  room: RoomExperience;
  onViewSlots: (roomId: string) => void;
  onOpenDetails: (room: RoomExperience) => void;
}

export default function RoomCard({ room, onViewSlots, onOpenDetails }: RoomCardProps) {
  const getStatusBadge = (status: RoomExperience['status']) => {
    switch (status) {
      case 'available':
        return <span className={`${styles.statusBadge} ${styles.statusAvailable}`}>● AVAILABLE TODAY</span>;
      case 'few_left':
        return <span className={`${styles.statusBadge} ${styles.statusFewLeft}`}>⚡ FEW SLOTS LEFT</span>;
      case 'booked':
        return <span className={`${styles.statusBadge} ${styles.statusBooked}`}>✕ FULLY BOOKED</span>;
      default:
        return <span className={`${styles.statusBadge} ${styles.statusUnavailable}`}>UNAVAILABLE</span>;
    }
  };

  return (
    <div className={styles.card}>
      {/* Large Image Header */}
      <div className={styles.imageContainer} onClick={() => onOpenDetails(room)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={room.image} alt={room.name} className={styles.roomImage} />
        <div className={styles.imageOverlayGradient} />

        {/* Top Badges */}
        <div className={styles.topBadgesRow}>
          {getStatusBadge(room.status)}
          {room.badge && <span className={styles.editorialBadge}>{room.badge}</span>}
        </div>

        {/* Quick View Button on Image */}
        <button
          type="button"
          className={styles.quickViewBtn}
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(room);
          }}
          aria-label={`View details for ${room.name}`}
        >
          <Info size={14} /> Quick View
        </button>

        {/* Occasion Label Tag */}
        <div className={styles.bottomTag}>
          <Sparkles size={13} /> {room.occasionLabel}
        </div>
      </div>

      {/* Card Body */}
      <div className={styles.cardBody}>
        <div className={styles.titleRow}>
          <h3 className={styles.roomTitle} onClick={() => onOpenDetails(room)}>
            {room.name}
          </h3>
          <div className={styles.priceContainer}>
            <span className={styles.priceAmount}>₹{room.price}</span>
            <span className={styles.priceDuration}>/ {room.duration}</span>
          </div>
        </div>

        <p className={styles.description}>{room.description}</p>

        {/* Meta Pills (Capacity & Spec) */}
        <div className={styles.metaRow}>
          <span className={styles.metaPill}>
            <Users size={13} /> {room.capacity}
          </span>
          <span className={styles.metaPill}>
            <Clock size={13} /> {room.duration} Session
          </span>
          <span className={styles.metaPill}>
            <Tv size={13} /> 180&quot; 4K Laser
          </span>
        </div>

        {/* Key Inclusions Preview */}
        <div className={styles.featuresPreview}>
          {room.features.slice(0, 3).map((feat, idx) => (
            <div key={idx} className={styles.featureItem}>
              <CheckCircle2 size={13} className={styles.checkIcon} />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionsRow}>
          <button
            type="button"
            className={styles.detailsBtn}
            onClick={() => onOpenDetails(room)}
          >
            Room Details
          </button>
          <button
            type="button"
            className={styles.viewSlotsBtn}
            onClick={() => onViewSlots(room.id)}
          >
            <span>VIEW SLOTS</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
