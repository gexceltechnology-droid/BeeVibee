'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Camera } from 'lucide-react';
import styles from './HeroLayeredComposition.module.css';

interface HeroLayeredCompositionProps {
  onInspectPhoto?: (photoUrl: string) => void;
}

export default function HeroLayeredComposition({ onInspectPhoto }: HeroLayeredCompositionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const isTouchOnly = !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setIsTouch(isTouchOnly || prefersReducedMotion);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouch || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setMouseOffset({ x, y });
  };

  const handleMouseLeave = () => {
    if (isTouch) return;
    setMouseOffset({ x: 0, y: 0 });
  };

  // Parallax multipliers for depth layers
  const l1X = mouseOffset.x * -14;
  const l1Y = mouseOffset.y * -14;

  const l2X = mouseOffset.x * -24;
  const l2Y = mouseOffset.y * -24;

  const l3X = mouseOffset.x * -36;
  const l3Y = mouseOffset.y * -36;

  return (
    <div
      ref={containerRef}
      className={styles.stageContainer}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label="Interactive 3D Layered Composition of BeeVibe Suites"
    >
      {/* Ambient Champagne Gold Lighting Glow */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Layer 1 (Back / Top-Right): Royal Butterfly VIP Suite with BeeVibe Screen */}
      <div
        className={`${styles.layerCard} ${styles.layer1}`}
        style={{
          transform: isTouch
            ? undefined
            : `translate3d(${l1X}px, ${l1Y}px, 0px) rotate(${mouseOffset.x * 3}deg)`,
        }}
        onClick={() => onInspectPhoto?.('/gallery/beevibe-royal-butterfly-vip.jpg')}
      >
        <div className={styles.cardInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gallery/beevibe-royal-butterfly-vip.jpg"
            alt="Royal Butterfly VIP Suite"
            className={styles.cardPhoto}
            loading="eager"
          />
          <div className={styles.cardPillBadge}>
            <Sparkles size={11} /> Royal Butterfly VIP
          </div>
        </div>
      </div>

      {/* Layer 2 (Bottom-Left): Pink Angel Wings Birthday Suite */}
      <div
        className={`${styles.layerCard} ${styles.layer2}`}
        style={{
          transform: isTouch
            ? undefined
            : `translate3d(${l2X}px, ${l2Y}px, 0px) rotate(${mouseOffset.x * -2}deg)`,
        }}
        onClick={() => onInspectPhoto?.('/gallery/beevibe-pink-angel-wings.jpg')}
      >
        <div className={styles.cardInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gallery/beevibe-pink-angel-wings.jpg"
            alt="Pink Angel Wings Birthday Suite"
            className={styles.cardPhoto}
            loading="eager"
          />
          <div className={styles.cardPillBadge}>
            <Sparkles size={11} /> Angel Wings Birthday
          </div>
        </div>
      </div>

      {/* Layer 3 (Middle / Center Front): Red Velvet Romance Heart Suite */}
      <div
        className={`${styles.layerCard} ${styles.layer3}`}
        style={{
          transform: isTouch
            ? undefined
            : `translate3d(${l3X}px, ${l3Y}px, 0px) rotate(${mouseOffset.x * 4}deg) scale(1.02)`,
        }}
        onClick={() => onInspectPhoto?.('/gallery/beevibe-red-velvet-heart.jpg')}
      >
        <div className={styles.cardInner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gallery/beevibe-red-velvet-heart.jpg"
            alt="Red Velvet Heart Romance Suite"
            className={styles.cardPhoto}
            loading="eager"
          />
          <div className={`${styles.cardPillBadge} ${styles.badgeGold}`}>
            <Sparkles size={11} /> Red Velvet Romance
          </div>
        </div>
      </div>

      {/* Floating Trust Indicator Pill */}
      <div className={styles.floatingFloatingTag} aria-hidden="true">
        <Camera size={13} className={styles.tagIcon} />
        <span>100% Real BeeVibe Suites</span>
      </div>
    </div>
  );
}
