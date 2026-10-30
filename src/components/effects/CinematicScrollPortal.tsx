'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Tv, Volume2, ShieldCheck, ArrowRight, Film } from 'lucide-react';
import styles from './CinematicScrollPortal.module.css';

interface CinematicScrollPortalProps {
  onExploreTheatres?: () => void;
  onBookNow?: () => void;
}

export default function CinematicScrollPortal({
  onExploreTheatres,
  onBookNow,
}: CinematicScrollPortalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    let rafId: number;
    const handleScroll = () => {
      if (!containerRef.current || mq.matches) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowH = window.innerHeight;
      
      // Calculate progress between when container enters viewport and when it leaves
      const totalDist = windowH + rect.height;
      const currentPos = windowH - rect.top;
      const progress = Math.max(0, Math.min(1, currentPos / totalDist));
      
      setScrollProgress(progress);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Calculate zoom and opacity based on scroll progress (0.2 to 0.8 is prime view)
  const scale = reducedMotion ? 1 : 0.94 + scrollProgress * 0.12;
  const chevronOffset = (scrollProgress * 120) % 60;

  return (
    <section ref={containerRef} className={styles.portalSection} id="cinematic-experience">
      {/* Decorative Champagne Gold Flowing Chevron Lines */}
      <div className={styles.chevronGuideLeft} aria-hidden="true">
        <svg width="24" height="280" viewBox="0 0 24 280" fill="none">
          <path
            d="M12 0 L12 280"
            stroke="url(#goldGradL)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />
          <g style={{ transform: `translateY(${chevronOffset}px)`, transition: 'transform 0.1s linear' }}>
            <polyline points="4,40 12,50 20,40" stroke="#E8BF69" strokeWidth="1.6" fill="none" />
            <polyline points="4,100 12,110 20,100" stroke="#E8BF69" strokeWidth="1.6" fill="none" />
            <polyline points="4,160 12,170 20,160" stroke="#E8BF69" strokeWidth="1.6" fill="none" />
            <polyline points="4,220 12,230 20,220" stroke="#E8BF69" strokeWidth="1.6" fill="none" />
          </g>
          <defs>
            <linearGradient id="goldGradL" x1="0" y1="0" x2="0" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E8BF69" stopOpacity="0" />
              <stop offset="0.3" stopColor="#E8BF69" stopOpacity="0.75" />
              <stop offset="0.7" stopColor="#E8BF69" stopOpacity="0.75" />
              <stop offset="1" stopColor="#E8BF69" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className={styles.chevronGuideRight} aria-hidden="true">
        <svg width="24" height="280" viewBox="0 0 24 280" fill="none">
          <path
            d="M12 0 L12 280"
            stroke="url(#goldGradR)"
            strokeWidth="1.2"
            strokeDasharray="4 6"
          />
          <g style={{ transform: `translateY(${chevronOffset}px)`, transition: 'transform 0.1s linear' }}>
            <polyline points="4,40 12,50 20,40" stroke="#E8BF69" strokeWidth="1.6" fill="none" />
            <polyline points="4,100 12,110 20,100" stroke="#E8BF69" strokeWidth="1.6" fill="none" />
            <polyline points="4,160 12,170 20,160" stroke="#E8BF69" strokeWidth="1.6" fill="none" />
            <polyline points="4,220 12,230 20,220" stroke="#E8BF69" strokeWidth="1.6" fill="none" />
          </g>
          <defs>
            <linearGradient id="goldGradR" x1="0" y1="0" x2="0" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E8BF69" stopOpacity="0" />
              <stop offset="0.3" stopColor="#E8BF69" stopOpacity="0.75" />
              <stop offset="0.7" stopColor="#E8BF69" stopOpacity="0.75" />
              <stop offset="1" stopColor="#E8BF69" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="container">
        {/* Section Intro Tag */}
        <div className={styles.portalHeader}>
          <span className={styles.portalOverline}>
            <Sparkles size={13} /> CINEMATIC CELEBRATION PORTAL
          </span>
          <h2 className={styles.portalHeading}>
            Step Into a World of <span className={styles.goldText}>Private Splendour</span>
          </h2>
          <p className={styles.portalSubheading}>
            Not an ordinary theatre — every suite is an acoustically tuned, 100% private wonderland designed exclusively for your special day.
          </p>
        </div>

        {/* Scroll-Driven Panoramic Canvas */}
        <div className={styles.canvasFrame}>
          <div
            className={styles.canvasImageWrapper}
            style={{
              transform: `scale3d(${scale}, ${scale}, 1)`,
              transition: reducedMotion ? undefined : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gallery/beevibe-royal-butterfly-vip.jpg"
              alt="BeeVibe Luxury Private Theatre Experience"
              className={styles.panoramicImg}
              loading="lazy"
            />
            
            {/* Elegant Vignette & Lighting Gradient */}
            <div className={styles.panoramicVignette} />

            {/* In-Scene Floating Pill Highlights */}
            <div className={styles.inScenePills}>
              <div className={styles.scenePill}>
                <Tv size={14} className={styles.pillIcon} />
                <span>180&quot; 4K Laser Cinema Screen</span>
              </div>
              <div className={styles.scenePill}>
                <Volume2 size={14} className={styles.pillIcon} />
                <span>Dolby Atmos 7.1 Room Calibrated</span>
              </div>
              <div className={styles.scenePill}>
                <ShieldCheck size={14} className={styles.pillIcon} />
                <span>100% Soundproof Private Suite</span>
              </div>
            </div>

            {/* Bottom In-Scene Callout Card */}
            <div className={styles.sceneCardBottom}>
              <div className={styles.sceneCardLeft}>
                <span className={styles.sceneTag}>BEEVIBE EXCLUSIVE</span>
                <h3 className={styles.sceneTitle}>Royal Butterfly &amp; Romance Suites</h3>
                <p className={styles.sceneDesc}>
                  Warm marquee letters, custom cake stages, balloon arches, and private dining served right inside.
                </p>
              </div>
              <div className={styles.sceneCardRight}>
                <button
                  type="button"
                  className={styles.sceneBookBtn}
                  onClick={onBookNow}
                >
                  Reserve Your Suite →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
