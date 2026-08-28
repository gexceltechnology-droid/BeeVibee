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
  MonitorCheck,
  Rocket
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

const THEME_CONTENT: Record<string, {
  containerClass: string;
  badgeText: string;
  heroTitle: string;
  heroSubtitle: string;
  btnPrimary: string;
  btnSecondary: string;
  specsTitle: string;
  specsSub: string;
  spec1Badge: string;
  spec2Badge: string;
  spec3Badge: string;
  spec4Badge: string;
  ctaTitle: string;
  ctaSub: string;
  ctaBtn: string;
}> = {
  cyberpunk: {
    containerClass: styles.containerCyberpunk,
    badgeText: '⚡ PS5 GAMING LOUNGE: ₹399 / HOUR (MIN 1 HOUR)',
    heroTitle: 'ENTER THE PS5 CYBER REALM',
    heroSubtitle: 'Equipped with 1 Sony PlayStation 5 Console, 2 DualSense Wireless Controllers, and 4K raytracing on a 180" 4K Projector Screen with 7.1 Dolby Surround Sound.',
    btnPrimary: 'PRESS START TO BOOK ⚡',
    btnSecondary: 'EXPLORE GAME LIBRARY 🎮',
    specsTitle: 'NEXT-GEN HARDWARE SPECS',
    specsSub: 'UNCOMPROMISED PERFORMANCE & ZERO LATENCY',
    spec1Badge: 'PS5 Ultra HD Hardware',
    spec2Badge: '2-Player Couch Multiplayer',
    spec3Badge: '180" Cinematic Display',
    spec4Badge: 'Full Spatial Surround',
    ctaTitle: 'READY TO CLAIM YOUR HIGH SCORE?',
    ctaSub: 'Book your private PS5 gaming slot at Bee Vibe Lounge, Jayanagar. 1 PS5 console, 2 controllers, 180" screen, and gourmet snacks delivered to your seat!',
    ctaBtn: 'BOOK PS5 GAMING LOUNGE NOW ⚡',
  },
  pixel: {
    containerClass: styles.containerPixel,
    badgeText: '👾 PS5 GAMING LOUNGE: ₹399 / HOUR (MIN 1 HOUR)',
    heroTitle: 'INSERT COIN: 8-BIT PIXEL REALM',
    heroSubtitle: 'Retro 8-bit vibes, arcade scanlines, 1 Sony PS5 Console, 2 DualSense controllers, and 100% nostalgia on our massive 180" 4K screen!',
    btnPrimary: 'INSERT COIN TO BOOK 🕹️',
    btnSecondary: 'VIEW PIXEL GAMES 🏆',
    specsTitle: 'RETRO ARCADE HARDWARE',
    specsSub: 'PIXEL PERFECT GRAPHICS & 8-BIT SOUND',
    spec1Badge: '8-bit Retro Engine',
    spec2Badge: '2 Controllers Ready',
    spec3Badge: '180 Inch Arcade Screen',
    spec4Badge: '100% Retro Vibe Lounge',
    ctaTitle: 'PRESS START TO CONTINUE?',
    ctaSub: 'Insert coin and reserve your 8-bit private gaming lounge in Jayanagar 9th Block!',
    ctaBtn: 'PRESS START TO BOOK 🕹️',
  },
  warzone: {
    containerClass: styles.containerWarzone,
    badgeText: '🔴 /// TACTICAL DEPLOYMENT ACTIVE',
    heroTitle: 'TACTICAL DEPLOYMENT: WARZONE ARENA',
    heroSubtitle: 'Full combat readiness! 1 Sony PS5 Console, 2 DualSense Wireless Controllers, 7.1 Dolby explosive audio, and zero-latency competitive warfare.',
    btnPrimary: 'DEPLOY TO WARZONE ARENA 💣',
    btnSecondary: 'VIEW COMBAT LOADOUTS ⚔️',
    specsTitle: 'TACTICAL COMBAT SPECS',
    specsSub: 'MAXIMUM FRAME RATE & EXPLOSIVE AUDIO',
    spec1Badge: 'Combat Engine',
    spec2Badge: 'Squad Duo Play (2 Controllers)',
    spec3Badge: '180" Tactical Screen',
    spec4Badge: 'Soundproof Command Center',
    ctaTitle: 'COMMAND CENTER READY FOR DEPLOYMENT',
    ctaSub: 'Deploy your squad to Bee Vibe Warzone Arena, Jayanagar. Reserve your 2-hour competitive combat session!',
    ctaBtn: 'SECURE WARZONE ARENA NOW 🔴',
  },
  galaxy: {
    containerClass: styles.containerGalaxy,
    badgeText: '🌌 JOURNEY INTO COSMIC HYPERSPACE',
    heroTitle: 'JOURNEY INTO COSMIC GALAXY LOUNGE',
    heroSubtitle: 'Float through infinite space! Relax in plush recliners under ultraviolet starfield lighting with 1 PS5 Console, 2 DualSense controllers, and 180" 4K projections.',
    btnPrimary: 'LAUNCH INTO GALAXY 🚀',
    btnSecondary: 'EXPLORE COSMIC GAMES 🪐',
    specsTitle: 'COSMIC HYPERSPACE HARDWARE',
    specsSub: 'NEBULA STARFIELD LIGHTING & 7.1 AUDIO',
    spec1Badge: 'Starlight Engine',
    spec2Badge: '2 Starship Controllers',
    spec3Badge: '180" Galaxy Projection',
    spec4Badge: 'Deep Space Sanctuary',
    ctaTitle: 'READY FOR COSMIC DISCOVERY?',
    ctaSub: 'Embark on an interstellar game night at Bee Vibe Galaxy Lounge, Jayanagar. Reserve your private cosmic sanctuary!',
    ctaBtn: 'LAUNCH INTO GALAXY LOUNGE 🌌',
  },
};

export default function GamingWorldPage() {
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'sports' | 'fighting' | 'action' | 'coop'>('all');
  
  // 4 Interactive Live Themes State
  const [activeTheme, setActiveTheme] = useState<'cyberpunk' | 'pixel' | 'warzone' | 'galaxy'>('cyberpunk');

  // Load saved theme from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem('bee_vibe_gaming_theme') as any;
    if (saved && ['cyberpunk', 'pixel', 'warzone', 'galaxy'].includes(saved)) {
      setActiveTheme(saved);
    }
  }, []);

  const handleThemeChange = (theme: 'cyberpunk' | 'pixel' | 'warzone' | 'galaxy') => {
    setActiveTheme(theme);
    sessionStorage.setItem('bee_vibe_gaming_theme', theme);
  };

  const THEMES = [
    { id: 'cyberpunk', name: '⚡ Cyberpunk Neon', color: '#00f0ff', activeClass: styles.themeCyberpunkActive },
    { id: 'pixel', name: '👾 Pixel Arcade', color: '#ffe600', activeClass: styles.themePixelActive },
    { id: 'warzone', name: '🔴 Crimson Warzone', color: '#ff0033', activeClass: styles.themeWarzoneActive },
    { id: 'galaxy', name: '🌌 Cosmic Galaxy', color: '#c084fc', activeClass: styles.themeGalaxyActive },
  ];

  const THEME_HERO_TITLES: Record<string, { span: string }> = {
    cyberpunk: { span: 'PS5 CYBER REALM' },
    pixel: { span: '8-BIT PIXEL REALM' },
    warzone: { span: 'CRIMSON WARZONE ARENA' },
    galaxy: { span: 'COSMIC GALAXY LOUNGE' },
  };

  // Space Warp Animation States
  const [warpActive, setWarpActive] = useState(true);
  const [warpFading, setWarpFading] = useState(false);
  const [warpProgress, setWarpProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const warpCanvasRef = useRef<HTMLCanvasElement>(null);

  // Trigger Space Warp Launch
  const triggerSpaceWarp = () => {
    setWarpFading(false);
    setWarpProgress(0);
    setWarpActive(true);
  };

  // Hyperspace 3D Starfield Canvas Animation
  useEffect(() => {
    if (!warpActive) return;

    const canvas = warpCanvasRef.current;
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

    const numStars = 400;
    const fov = 300;
    let speed = 2;
    const colors = ['#00f0ff', '#ff0055', '#ffe600', '#ffffff', '#7000ff'];

    const stars = Array.from({ length: numStars }).map(() => ({
      x: (Math.random() - 0.5) * width * 2,
      y: (Math.random() - 0.5) * height * 2,
      z: Math.random() * width,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 2 + 1,
    }));

    let startTime = Date.now();
    const duration = 2800; // 2.8 seconds space flight

    function renderWarp() {
      if (!ctx) return;
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setWarpProgress(Math.floor(progress * 100));

      // Accelerate warp speed over time
      speed = 4 + Math.pow(progress * 4.5, 2.5);

      ctx.fillStyle = 'rgba(2, 2, 8, 0.35)';
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      stars.forEach((s) => {
        const prevZ = s.z;
        s.z -= speed;

        if (s.z <= 1) {
          s.z = width;
          s.x = (Math.random() - 0.5) * width * 2;
          s.y = (Math.random() - 0.5) * height * 2;
        }

        // Project 3D to 2D
        const k = fov / s.z;
        const px = s.x * k + cx;
        const py = s.y * k + cy;

        const prevK = fov / prevZ;
        const prevPx = s.x * prevK + cx;
        const prevPy = s.y * prevK + cy;

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          // Draw streak line
          ctx.beginPath();
          ctx.moveTo(prevPx, prevPy);
          ctx.lineTo(px, py);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = Math.min(s.size * (1 + (1 - s.z / width) * 2), 4);
          ctx.stroke();
        }
      });

      if (progress < 1) {
        animId = requestAnimationFrame(renderWarp);
      } else {
        // Fade out transition
        setWarpFading(true);
        setTimeout(() => {
          setWarpActive(false);
          setWarpFading(false);
        }, 800);
      }
    }

    renderWarp();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [warpActive]);

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

  const currentContent = THEME_CONTENT[activeTheme] || THEME_CONTENT.cyberpunk;

  return (
    <div className={`${styles.container} ${currentContent.containerClass}`}>
      {/* Space Warp Entry Animation Overlay */}
      {warpActive && (
        <div className={`${styles.spaceWarpOverlay} ${warpFading ? styles.spaceWarpOverlayFading : ''}`}>
          <canvas ref={warpCanvasRef} className={styles.warpCanvas} />
          <div className={styles.warpTextContainer}>
            <div className={styles.warpStatus}>🚀 WARP DRIVE INITIALIZING... {warpProgress}%</div>
            <h2 className={styles.warpTitle}>{currentContent.heroTitle}</h2>
            <div className={styles.warpMeterBar}>
              <div className={styles.warpMeterFill} style={{ width: `${warpProgress}%` }} />
            </div>
            <div style={{ fontFamily: 'var(--font-vt323), monospace', fontSize: '1.2rem', color: '#00f0ff' }}>
              DESTINATION: BEE VIBE PS5 GAMING LOUNGE
            </div>
          </div>
          <button
            type="button"
            className={styles.skipWarpBtn}
            onClick={() => {
              setWarpFading(true);
              setTimeout(() => setWarpActive(false), 300);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setWarpFading(true);
              setTimeout(() => setWarpActive(false), 300);
            }}
          >
            Skip Launch ⚡
          </button>
        </div>
      )}

      {/* Optional CRT Scanline Overlay */}
      {(crtEnabled || activeTheme === 'pixel') && <div className={styles.crtOverlay} />}

      {/* Background Interactive Pixel Canvas */}
      <canvas ref={canvasRef} className={styles.pixelCanvas} />

      {/* Header Bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backBtn}>
            <ArrowLeft size={18} /> Main Theater
          </Link>
          <div className={styles.pixelLogo}>
            <Gamepad2 size={20} color="#ffe600" /> BEE VIBE GAMING REALM
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.toggleCrtBtn}
            onClick={triggerSpaceWarp}
            title="Re-launch Hyperspace Warp Flight"
          >
            <Rocket size={15} style={{ display: 'inline', marginRight: '6px' }} /> Space Launch
          </button>
          <button
            type="button"
            className={styles.toggleCrtBtn}
            onClick={() => setCrtEnabled(!crtEnabled)}
          >
            {crtEnabled ? '📺 CRT: ON' : '📺 CRT: OFF'}
          </button>
          <Link href="/gaming/book" className={styles.bookHeaderBtn}>
            BOOK GAMING SLOT
          </Link>
        </div>
      </header>

      {/* Live Interactive Theme Switcher Bar */}
      <div className={styles.themeSwitcherBar}>
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`${styles.themePill} ${activeTheme === t.id ? t.activeClass : ''}`}
            onClick={() => handleThemeChange(t.id as any)}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Main Hero Realm */}
      <section className={styles.hero}>
        <div className={styles.pixelBadge}>
          <Zap size={18} /> {currentContent.badgeText}
        </div>
        <h1 className={styles.heroTitle}>
          {currentContent.heroTitle}
        </h1>
        <p className={styles.heroSubtitle}>
          {currentContent.heroSubtitle}
        </p>

        <div className={styles.heroCtas}>
          <Link href="/gaming/book" className={styles.pixelBtnPrimary}>
            <Play size={18} fill="currentColor" /> {currentContent.btnPrimary}
          </Link>
          <a href="#games-library" className={styles.pixelBtnSecondary}>
            <Trophy size={18} /> {currentContent.btnSecondary}
          </a>
        </div>
      </section>

      {/* Hardware Specs Section */}
      <section className={styles.specsSection}>
        <div className={styles.sectionHeading}>
          <h2 className={styles.sectionTitle}>{currentContent.specsTitle}</h2>
          <p className={styles.sectionSub}>{currentContent.specsSub}</p>
        </div>

        <div className={styles.specsGrid}>
          {/* Spec 1: PS5 Console */}
          <div className={styles.specCard}>
            <div className={styles.specIconWrapper}>
              <Gamepad2 size={28} />
            </div>
            <h3 className={styles.specTitle}>1x Sony PlayStation 5 Console</h3>
            <p className={styles.specDesc}>
              Powered by ultra-high-speed SSD for instant game loading and true 4K HDR graphics rendering at smooth frame rates.
            </p>
            <span className={styles.highlightBadge}>{currentContent.spec1Badge}</span>
          </div>

          {/* Spec 2: 2 Controllers */}
          <div className={styles.specCard}>
            <div className={styles.specIconWrapper}>
              <Users size={28} />
            </div>
            <h3 className={styles.specTitle}>2x DualSense Wireless Controllers</h3>
            <p className={styles.specDesc}>
              Equipped with 2 wireless gamepads featuring immersive haptic feedback and dynamic adaptive triggers for 1v1 multiplayer or co-op.
            </p>
            <span className={styles.highlightBadge}>{currentContent.spec2Badge}</span>
          </div>

          {/* Spec 3: 180" Screen */}
          <div className={styles.specCard}>
            <div className={styles.specIconWrapper}>
              <Tv size={28} />
            </div>
            <h3 className={styles.specTitle}>180" 4K Projector Screen</h3>
            <p className={styles.specDesc}>
              Immerse your entire vision on a gigantic wall-filling 180-inch screen with low latency projection tuned specifically for gaming.
            </p>
            <span className={styles.highlightBadge}>{currentContent.spec3Badge}</span>
          </div>

          {/* Spec 4: 7.1 Dolby Audio */}
          <div className={styles.specCard}>
            <div className={styles.specIconWrapper}>
              <Volume2 size={28} />
            </div>
            <h3 className={styles.specTitle}>7.1 Dolby Surround Audio</h3>
            <p className={styles.specDesc}>
              Room-shaking spatial sound so every car engine roar, stadium roar, or footstep comes alive with cinematic clarity.
            </p>
            <span className={styles.highlightBadge}>{currentContent.spec4Badge}</span>
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
        <h2 className={styles.ctaTitle}>{currentContent.ctaTitle}</h2>
        <p className={styles.ctaSub}>
          {currentContent.ctaSub}
        </p>
        <Link href="/gaming/book" className={styles.pixelBtnPrimary}>
          <MonitorCheck size={20} /> {currentContent.ctaBtn}
        </Link>
      </section>
    </div>
  );
}
