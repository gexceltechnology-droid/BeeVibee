'use client';

import React, { useState, useEffect } from 'react';

interface BeeMascotProps {
  size?: number;
  className?: string;
  showTrail?: boolean;
}

export default function BeeMascot({
  size = 72,
  className = '',
  showTrail = true,
}: BeeMascotProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handleMouseMove = (e: MouseEvent) => {
      if (mq.matches) return;
      const xPercent = (e.clientX / window.innerWidth - 0.5) * 12;
      const yPercent = (e.clientY / window.innerHeight - 0.5) * 8;
      setTilt({ x: xPercent, y: yPercent });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className={className}
      style={{
        display: 'inline-block',
        position: 'relative',
        userSelect: 'none',
        pointerEvents: 'none',
        transform: reducedMotion
          ? undefined
          : `translate3d(${tilt.x * 0.4}px, ${tilt.y * 0.4}px, 0) rotate(${tilt.x * 0.5}deg)`,
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      aria-hidden="true"
    >
      <style jsx>{`
        @keyframes beeFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(2deg);
          }
        }

        @keyframes wingFlapLeft {
          0%, 100% {
            transform: scaleY(1) rotate(0deg);
          }
          50% {
            transform: scaleY(0.75) rotate(-14deg);
          }
        }

        @keyframes wingFlapRight {
          0%, 100% {
            transform: scaleY(1) rotate(0deg);
          }
          50% {
            transform: scaleY(0.75) rotate(14deg);
          }
        }

        @keyframes sparklePulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.85);
          }
          50% {
            opacity: 0.9;
            transform: scale(1.15);
          }
        }

        .beeRoot {
          animation: ${reducedMotion ? 'none' : 'beeFloat 4s ease-in-out infinite'};
        }

        .wingLeft {
          transform-origin: 32px 30px;
          animation: ${reducedMotion ? 'none' : 'wingFlapLeft 0.18s ease-in-out infinite'};
        }

        .wingRight {
          transform-origin: 48px 30px;
          animation: ${reducedMotion ? 'none' : 'wingFlapRight 0.18s ease-in-out infinite'};
        }

        .sparkleTrail {
          animation: ${reducedMotion ? 'none' : 'sparklePulse 2s ease-in-out infinite'};
        }
      `}</style>

      <div className="beeRoot">
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Ambient Glow */}
          <circle cx="50" cy="52" r="34" fill="rgba(232, 191, 105, 0.18)" filter="blur(6px)" />

          {/* Golden Sparkle Trails if enabled */}
          {showTrail && (
            <g className="sparkleTrail">
              <circle cx="16" cy="62" r="2.5" fill="#E8BF69" opacity="0.8" />
              <circle cx="10" cy="70" r="1.8" fill="#FCE1E2" opacity="0.7" />
              <path
                d="M24 74 L25.5 70 L29.5 68.5 L25.5 67 L24 63 L22.5 67 L18.5 68.5 L22.5 70 Z"
                fill="#E8BF69"
                opacity="0.75"
              />
            </g>
          )}

          {/* Antennae */}
          <path
            d="M44 32 C41 24, 34 22, 33 24"
            stroke="#30211F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="33" cy="24" r="2.8" fill="#E8BF69" />

          <path
            d="M56 32 C59 24, 66 22, 67 24"
            stroke="#30211F"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="67" cy="24" r="2.8" fill="#E8BF69" />

          {/* Wings (Translucent Iridescent Pastel) */}
          <ellipse
            className="wingLeft"
            cx="32"
            cy="27"
            rx="14"
            ry="9"
            transform="rotate(-28 32 27)"
            fill="rgba(240, 225, 255, 0.85)"
            stroke="rgba(232, 191, 105, 0.6)"
            strokeWidth="1.5"
          />
          <ellipse
            className="wingRight"
            cx="68"
            cy="27"
            rx="14"
            ry="9"
            transform="rotate(28 68 27)"
            fill="rgba(240, 225, 255, 0.85)"
            stroke="rgba(232, 191, 105, 0.6)"
            strokeWidth="1.5"
          />

          {/* Stinger */}
          <polygon points="50,78 46,71 54,71" fill="#30211F" />

          {/* Body Base (Plump Oval) */}
          <ellipse cx="50" cy="52" rx="22" ry="24" fill="#F4C748" />

          {/* Espresso Velvet Stripes */}
          <path
            d="M31 46 C37 49, 63 49, 69 46 C69.5 49, 69.5 51, 69 53 C63 56, 37 56, 31 53 C30.5 51, 30.5 49, 31 46 Z"
            fill="#30211F"
          />
          <path
            d="M34 59 C39 62, 61 62, 66 59 C65.5 62, 64.5 64, 63 66 C58 68, 42 68, 37 66 C35.5 64, 34.5 62, 34 59 Z"
            fill="#30211F"
          />

          {/* Rosy Cheeks */}
          <circle cx="41" cy="41" r="3" fill="#F87171" opacity="0.45" />
          <circle cx="59" cy="41" r="3" fill="#F87171" opacity="0.45" />

          {/* Friendly Eyes with Catchlights */}
          <circle cx="44" cy="37" r="3.2" fill="#30211F" />
          <circle cx="45" cy="36" r="1.1" fill="#FFFFFF" />

          <circle cx="56" cy="37" r="3.2" fill="#30211F" />
          <circle cx="57" cy="36" r="1.1" fill="#FFFFFF" />

          {/* Gentle Smile */}
          <path
            d="M47 43 Q50 46 53 43"
            stroke="#30211F"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
    </div>
  );
}
