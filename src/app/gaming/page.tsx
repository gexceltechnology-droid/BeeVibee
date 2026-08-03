'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './gaming.module.css';
import {
  Gamepad2,
  Tv,
  Volume2,
  ShieldCheck,
  Zap,
  Users,
  Trophy,
  ArrowLeft,
  Sparkles,
  Play,
  MonitorCheck
} from 'lucide-react';

interface GameItem {
  id: string;
  title: string;
  genre: 'sports' | 'fighting' | 'action' | 'coop';
  players: string;
  description: string;
  bgGradient: string;
  features: string[];
}

const GAMES: GameItem[] = [
  {
    id: 'eafc24',
    title: 'EA SPORTS FC 24 / FIFA',
    genre: 'sports',
    players: '1 - 2 Players (Vs / Co-Op)',
    description: 'Experience intense 1v1 football rivalries or tournament co-op on our massive 180" 4K screen with realistic crowd ambient sound.',
    bgGradient: 'linear-gradient(135deg, #0052d4 0%, #4364f7 50%, #6fb1fc 100%)',
    features: ['2 DualSense Controllers', '4K High Refresh Rate', 'Tournament Mode Available']
  },
  {
    id: 'tekken8',
    title: 'Tekken 8',
    genre: 'fighting',
    players: '1 - 2 Players (Head-to-Head)',
    description: 'Next-gen 3D fighting action with visceral visual effects, bone-crunching haptic feedback on DualSense, and zero display lag.',
    bgGradient: 'linear-gradient(135deg, #e52d27 0%, #b31217 100%)',
    features: ['Low Latency 4K Projection', 'Head-to-Head Arcade Feel', 'Dolby Atmos Sound']
  },
  {
    id: 'mk1',
    title: 'Mortal Kombat 1',
    genre: 'fighting',
    players: '1 - 2 Players (Head-to-Head)',
    description: 'Unleash cinematic Fatalities on the 180" display. A reborn Mortal Kombat Universe designed for intense couch multiplayer competition.',
    bgGradient: 'linear-gradient(135deg, #bf953f 0%, #fcf6ba 50%, #b38728 100%)',
    features: ['Kameo Fighter Assist', 'Haptic Controller Feedback', 'Full Sound Isolation']
  },
  {
    id: 'spiderman2',
    title: 'Marvel\'s Spider-Man 2',
    genre: 'action',
    players: '1 Player (Pass the Controller)',
    description: 'Swing through Marvel\'s New York with near-instant loading, ray-traced visuals, and custom ambient neon room lighting.',
    bgGradient: 'linear-gradient(135deg, #ed213a 0%, #93291e 100%)',
    features: ['Ultra 4K Ray-Tracing', '3D Spatial Audio', 'Haptic DualSense Triggers']
  },
  {
    id: 'codmw3',
    title: 'Call of Duty: Modern Warfare',
    genre: 'action',
    players: '1 - 2 Players (Split Screen / Online)',
    description: 'High-octane FPS combat in full 7.1 surround sound so you hear every enemy footstep and shot around you in real-time.',
    bgGradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    features: ['7.1 Dolby Audio Precision', 'Split-Screen Multiplayer', 'Responsive Controllers']
  },
  {
    id: 'gt7',
    title: 'Gran Turismo 7',
    genre: 'sports',
    players: '1 - 2 Players (2-Player Split Screen)',
    description: 'Feel every turn, gear shift, and curb rumble through DualSense haptics on ultra-wide 180" cinematic projection.',
    bgGradient: 'linear-gradient(135deg, #8e2de2 0%, #4a00e0 100%)',
    features: ['Real Driving Simulator', '2-Player Split Screen', 'Dolby Surround']
  },
  {
    id: 'ittakestwo',
    title: 'It Takes Two',
    genre: 'coop',
    players: '2 Players (Pure Co-Op)',
    description: 'The ultimate 2-player cooperative adventure game. Perfect for couples, best friends, or family gaming sessions.',
    bgGradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    features: ['Co-Op Masterpiece', 'Romantic Date Night Pick', 'Comfy Recliner Seating']
  },
  {
    id: 'sf6',
    title: 'Street Fighter 6',
    genre: 'fighting',
    players: '1 - 2 Players (Arcade Battles)',
    description: 'Modern battle controls and iconic special moves popping in rich HDR color on our private celebration screen.',
    bgGradient: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
    features: ['Arcade Fighting Experience', '2 Wireless DualSense', 'RGB Ambient Sync']
  }
];

export default function GamingWorldPage() {
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'sports' | 'fighting' | 'action' | 'coop'>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Background 8-bit Pixel Particles Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const pixelColors = ['#00f0ff', '#ff0055', '#ffe600', '#7000ff', '#00ff66'];
    const pixels = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 6 + 4,
      vy: -(Math.random() * 0.8 + 0.3),
      vx: (Math.random() - 0.5) * 0.4,
      color: pixelColors[Math.floor(Math.random() * pixelColors.length)],
      alpha: Math.random() * 0.7 + 0.3,
    }));

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Grid mesh pattern
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Floating 8-bit pixels
      pixels.forEach((p) => {
        p.y += p.vy;
        p.x += p.vx;

        if (p.y < -20) p.y = height + 20;
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        // Snap to pixel square look
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
      });

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  const filteredGames = activeCategory === 'all'
    ? GAMES
    : GAMES.filter(g => g.genre === activeCategory);

  return (
    <div className={styles.container}>
      {/* Optional CRT Scanline Overlay */}
      {crtEnabled && <div className={styles.crtOverlay} />}

      {/* Background Interactive Pixel Canvas */}
      <canvas ref={canvasRef} className={styles.pixelCanvas} />

      {/* Header Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={18} /> Main Theater
          </Link>
          <div className={styles.pixelLogo}>
            <Gamepad2 size={20} color="#ffe600" /> BEE VIBE PIXEL REALM
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.toggleCrtBtn}
            onClick={() => setCrtEnabled(!crtEnabled)}
          >
            {crtEnabled ? '📺 CRT: ON' : '📺 CRT: OFF'}
          </button>
          <Link href="/book?mode=gaming" className={styles.bookHeaderBtn}>
            BOOK GAMING SLOT
          </Link>
        </div>
      </header>

      {/* Main Hero Realm */}
      <section className={styles.hero}>
        <div className={styles.pixelBadge}>
          <Zap size={18} /> LEVEL UP YOUR GAME NIGHT IN BANGALORE
        </div>
        <h1 className={styles.heroTitle}>
          ENTER THE <span className={styles.cyanGlow}>PS5 PIXEL REALM</span>
        </h1>
        <p className={styles.heroSubtitle}>
          We’ve loaded Bee Vibe with <strong>1 Sony PlayStation 5 Console</strong>, <strong>2 DualSense Wireless Controllers</strong>, and a curated library of top AAA multiplayer games. Play head-to-head or co-op on our massive 180" 4K Projector Screen with 7.1 Dolby Surround Sound in a 100% private, soundproof lounge.
        </p>

        <div className={styles.heroCtas}>
          <Link href="/book?mode=gaming" className={styles.pixelBtnPrimary}>
            <Play size={18} fill="currentColor" /> PRESS START TO BOOK
          </Link>
          <a href="#games-library" className={styles.pixelBtnSecondary}>
            <Trophy size={18} /> EXPLORE GAME LIBRARY
          </a>
        </div>
      </section>

      {/* Hardware Specs Section */}
      <section className={styles.specsSection}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>NEXT-GEN GAMING SETUP</h2>
          <p className={styles.sectionSub}>UNCOMPROMISED HARDWARE & ZERO DISTRACTIONS</p>
        </div>

        <div className={styles.specsGrid}>
          {/* Spec 1: PS5 Console */}
          <div className={specCardStyle(styles)}>
            <div className={styles.specIconWrapper}>
              <Gamepad2 size={28} />
            </div>
            <h3 className={styles.specTitle}>1x Sony PlayStation 5 Console</h3>
            <p className={styles.specDesc}>
              Powered by ultra-high-speed SSD for instant game loading and true 4K HDR graphics rendering at smooth frame rates.
            </p>
            <span className={styles.highlightBadge}>PS5 Ultra HD Hardware</span>
          </div>

          {/* Spec 2: 2 Controllers */}
          <div className={specCardStyle(styles)}>
            <div className={styles.specIconWrapper}>
              <Users size={28} />
            </div>
            <h3 className={styles.specTitle}>2x DualSense Wireless Controllers</h3>
            <p className={styles.specDesc}>
              Equipped with 2 wireless gamepads featuring immersive haptic feedback and dynamic adaptive triggers for 1v1 multiplayer or co-op.
            </p>
            <span className={styles.highlightBadge}>2-Player Couch Multiplayer</span>
          </div>

          {/* Spec 3: 180" Screen */}
          <div className={specCardStyle(styles)}>
            <div className={styles.specIconWrapper}>
              <Tv size={28} />
            </div>
            <h3 className={styles.specTitle}>180" 4K Projector Screen</h3>
            <p className={styles.specDesc}>
              Immerse your entire vision on a gigantic wall-filling 180-inch screen with low latency projection tuned specifically for gaming.
            </p>
            <span className={styles.highlightBadge}>180" Cinematic Display</span>
          </div>

          {/* Spec 4: 7.1 Dolby Audio */}
          <div className={specCardStyle(styles)}>
            <div className={styles.specIconWrapper}>
              <Volume2 size={28} />
            </div>
            <h3 className={styles.specTitle}>7.1 Dolby Surround Audio</h3>
            <p className={styles.specDesc}>
              Room-shaking spatial sound so every car engine roar, stadium roar, or footstep comes alive with cinematic clarity.
            </p>
            <span className={styles.highlightBadge}>Full Spatial Surround</span>
          </div>

          {/* Spec 5: 100% Private Lounge */}
          <div className={specCardStyle(styles)}>
            <div className={styles.specIconWrapper}>
              <ShieldCheck size={28} />
            </div>
            <h3 className={styles.specTitle}>Private Soundproof Lounge</h3>
            <p className={styles.specDesc}>
              No screaming kids or crowded gaming parlors. Enjoy 100% private soundproof hall access for you and your squad (Up to 10 guests).
            </p>
            <span className={styles.highlightBadge}>100% VIP Privacy</span>
          </div>

          {/* Spec 6: Custom RGB Vibe */}
          <div className={specCardStyle(styles)}>
            <div className={styles.specIconWrapper}>
              <Sparkles size={28} />
            </div>
            <h3 className={styles.specTitle}>Custom RGB Gaming Lighting</h3>
            <p className={styles.specDesc}>
              Switch ambient room colors (Neon Purple, Rose Pink, or Cyber Red) to sync your room's mood with your favorite game theme.
            </p>
            <span className={styles.highlightBadge}>Interactive RGB Lighting</span>
          </div>
        </div>
      </section>

      {/* Games Library Showcase */}
      <section id="games-library" className={styles.gamesSection}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>CURATED GAMES LIBRARY</h2>
          <p className={styles.sectionSub}>CHOOSE YOUR CHALLENGE & READY YOUR CONTROLLERS</p>
        </div>

        {/* Category Tabs */}
        <div className={styles.gameFilterTabs}>
          {(['all', 'sports', 'fighting', 'action', 'coop'] as const).map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${activeCategory === cat ? styles.filterBtnActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'all' && '🕹️ All Titles'}
              {cat === 'sports' && '⚽ Sports & Racing'}
              {cat === 'fighting' && '🥊 1v1 Fighting'}
              {cat === 'action' && '💥 Action & FPS'}
              {cat === 'coop' && '🤝 2-Player Co-Op'}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div className={styles.gamesGrid}>
          {filteredGames.map((game) => (
            <div key={game.id} className={styles.gameCard}>
              <div className={styles.gameCardHeader} style={{ background: game.bgGradient }}>
                <span className={styles.gameGenreTag}>{game.genre.toUpperCase()}</span>
                <span className={styles.playersTag}>{game.players}</span>
              </div>
              <div className={styles.gameCardBody}>
                <div>
                  <h3 className={styles.gameTitle}>{game.title}</h3>
                  <p className={styles.gameDesc}>{game.description}</p>
                </div>
                <div className={styles.gameFeatures}>
                  {game.features.map((feat, i) => (
                    <span key={i} className={styles.featurePill}>✓ {feat}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className={styles.ctaBanner}>
        <h2 className={styles.ctaTitle}>READY TO CLAIM YOUR HIGH SCORE?</h2>
        <p className={styles.ctaSub}>
          Book your private PS5 gaming slot at Bee Vibe Party Hall, Jayanagar. 1 PS5 console, 2 controllers, 180" screen, and gourmet snacks delivered to your seats!
        </p>
        <Link href="/book?mode=gaming" className={styles.pixelBtnPrimary}>
          <MonitorCheck size={20} /> BOOK PS5 GAMING LOUNGE NOW
        </Link>
      </section>
    </div>
  );
}

function specCardStyle(styles: any) {
  return styles.specCard;
}
