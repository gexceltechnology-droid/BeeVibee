'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './InteractiveShowcase.module.css';

interface InteractiveShowcaseProps {
  vibe: 'pink' | 'purple' | 'red';
}

const VIBE_COLORS = {
  pink: { accent: '#ff2e7e', rgb: '255, 46, 126', name: 'Rose Pink' },
  purple: { accent: '#9333ea', rgb: '147, 51, 234', name: 'Neon Purple' },
  red: { accent: '#ef4444', rgb: '239, 68, 68', name: 'Crimson Red' },
};

interface Balloon {
  x: number;
  y: number;
  radius: number;
  speed: number;
  vibeType: 'pink' | 'purple' | 'red' | 'bomb';
  color: string;
  swayOffset: number;
  swaySpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export default function InteractiveShowcase({ vibe }: InteractiveShowcaseProps) {
  const current = VIBE_COLORS[vibe] || VIBE_COLORS.pink;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Game States
  const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);

  // Refs for animation loop variables
  const gameStateRef = useRef(gameState);
  const vibeRef = useRef(vibe);
  const scoreRef = useRef(score);
  const livesRef = useRef(lives);
  
  const playerXRef = useRef(150);
  const lastPlayerXRef = useRef(150);
  const walkCycleRef = useRef(0);
  const scrollYRef = useRef(0);

  // Sync state to refs for closure-safe animation access
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { vibeRef.current = vibe; }, [vibe]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('beevibe_highscore');
    if (saved) {
      setHighScore(parseInt(saved, 10));
    }
  }, []);

  // Window scroll listener for parallax background scrolling
  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize Game Loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    
    // Set resolution bounds
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game variables
    let balloons: Balloon[] = [];
    let particles: Particle[] = [];
    let starfield: { x: number; y: number; size: number; speed: number }[] = [];

    // Create background stars
    for (let i = 0; i < 40; i++) {
      starfield.push({
        x: Math.random() * 500,
        y: Math.random() * 500,
        size: Math.random() * 1.8 + 0.5,
        speed: Math.random() * 0.4 + 0.1,
      });
    }

    const spawnBalloon = () => {
      const vibes: ('pink' | 'purple' | 'red' | 'bomb')[] = ['pink', 'purple', 'red', 'bomb'];
      // Weigh active vibe slightly higher, bomb lower
      const rand = Math.random();
      let type: 'pink' | 'purple' | 'red' | 'bomb' = 'bomb';
      
      if (rand < 0.35) {
        type = vibeRef.current; // active vibe
      } else if (rand < 0.75) {
        const others = vibes.filter(v => v !== vibeRef.current && v !== 'bomb');
        type = others[Math.floor(Math.random() * others.length)] as any;
      } else {
        type = 'bomb';
      }

      const colors = {
        pink: '#ff2e7e',
        purple: '#9333ea',
        red: '#ef4444',
        bomb: '#ffffff',
      };

      balloons.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        radius: type === 'bomb' ? 10 : Math.random() * 4 + 10,
        speed: type === 'bomb' ? 2.5 + Math.random() * 1.5 : 1.8 + Math.random() * 2,
        vibeType: type,
        color: colors[type],
        swayOffset: Math.random() * 100,
        swaySpeed: 0.02 + Math.random() * 0.03,
      });
    };

    let spawnTimer = 0;

    // Game loop
    const update = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;

      // 1. Draw Starfield with Scroll Parallax
      ctx.fillStyle = '#ffffff';
      starfield.forEach((star) => {
        // Shift stars vertical position using page scroll offset * speed
        const scrollOffset = scrollYRef.current * star.speed * 0.15;
        let starY = (star.y + scrollOffset) % h;
        if (starY < 0) starY += h;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(time * 0.003 + star.x) * 0.4})`;
        ctx.fillRect(star.x % w, starY, star.size, star.size);
      });

      // 2. Draw Scrolling Perspective Floor Grid (Scroll Animation)
      const horizonY = h * 0.3;
      const gridHeight = h - horizonY;
      
      ctx.strokeStyle = `rgba(var(--accent-rgb), 0.08)`;
      ctx.lineWidth = 1;
      
      // Vertical converging lines
      const lineCount = 12;
      for (let i = -lineCount / 2; i <= lineCount / 2; i++) {
        const startX = w / 2 + i * (w / 14);
        const endX = w / 2 + i * (w / 4);
        ctx.beginPath();
        ctx.moveTo(startX, horizonY);
        ctx.lineTo(endX, h);
        ctx.stroke();
      }

      // Horizontal lines shifting with page scroll
      const gridSpacing = 28;
      // Scroll shifts the lines forward/backward
      const scrollOffset = scrollYRef.current * 0.4;
      const offset = (scrollOffset) % gridSpacing;

      ctx.strokeStyle = `rgba(var(--accent-rgb), 0.12)`;
      for (let yOffset = offset; yOffset < gridHeight; yOffset += gridSpacing) {
        const y = horizonY + yOffset;
        const normY = yOffset / gridHeight;
        ctx.lineWidth = normY * 1.5 + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const activeColor = VIBE_COLORS[vibeRef.current] || VIBE_COLORS.pink;

      // 3. Game Render States
      if (gameStateRef.current === 'START') {
        balloons = [];
        particles = [];

        // Title text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('VIBE CATCHER', w / 2, h * 0.35);

        ctx.font = '13px Plus Jakarta Sans, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillText('Catch falling balloons to decorate the party hall!', w / 2, h * 0.43);
        ctx.fillText('Score 50+ to unlock an exclusive ₹100 discount code.', w / 2, h * 0.48);

        // Highlight matching color tip
        ctx.fillStyle = activeColor.accent;
        ctx.font = 'bold 13px Outfit, sans-serif';
        ctx.fillText(`TIP: Catching ${activeColor.name} balloons gives DOUBLE points!`, w / 2, h * 0.55);

        // Button Mock
        ctx.fillStyle = activeColor.accent;
        ctx.shadowColor = activeColor.accent;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(w / 2 - 80, h * 0.65, 160, 42, 8);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillText('PLAY ARCADE', w / 2, h * 0.65 + 26);

      } else if (gameStateRef.current === 'PLAYING') {
        spawnTimer++;
        if (spawnTimer > 35) {
          spawnBalloon();
          spawnTimer = 0;
        }

        // Draw Animated Walking Robot Player (Holding glowing party tray)
        const catcherWidth = 76;
        const catcherHeight = 12;
        const catcherX = Math.min(Math.max(playerXRef.current - catcherWidth / 2, 10), w - catcherWidth - 10);
        const catcherY = h - 62;

        // Calculate movement velocity for walking leg animation
        const vx = playerXRef.current - (lastPlayerXRef.current || playerXRef.current);
        lastPlayerXRef.current = playerXRef.current;
        const isMoving = Math.abs(vx) > 0.3;

        // Update walk cycle phase
        walkCycleRef.current += isMoving ? Math.min(Math.abs(vx) * 0.12 + 0.15, 0.35) : 0.04;
        const walkPhase = walkCycleRef.current;

        const robotX = catcherX + catcherWidth / 2;

        // 1. Animated Robot Legs & Feet (Walking Step Cycle)
        const hipY = catcherY + 42;
        const legLength = 14;
        const footY = h - 8;

        const leftSwing = Math.sin(walkPhase) * (isMoving ? 14 : 3);
        const rightSwing = Math.sin(walkPhase + Math.PI) * (isMoving ? 14 : 3);

        // Left Leg
        const leftHipX = robotX - 10;
        const leftFootX = leftHipX + leftSwing;
        const leftKneeX = (leftHipX + leftFootX) / 2 - 3;
        const leftKneeY = hipY + legLength / 2 - Math.abs(Math.sin(walkPhase)) * 2;

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(leftHipX, hipY);
        ctx.lineTo(leftKneeX, leftKneeY);
        ctx.lineTo(leftFootX, footY);
        ctx.stroke();

        // Left Foot
        ctx.fillStyle = activeColor.accent;
        ctx.beginPath();
        ctx.roundRect(leftFootX - 6, footY - 2, 12, 6, 3);
        ctx.fill();

        // Right Leg
        const rightHipX = robotX + 10;
        const rightFootX = rightHipX + rightSwing;
        const rightKneeX = (rightHipX + rightFootX) / 2 + 3;
        const rightKneeY = hipY + legLength / 2 - Math.abs(Math.sin(walkPhase + Math.PI)) * 2;

        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rightHipX, hipY);
        ctx.lineTo(rightKneeX, rightKneeY);
        ctx.lineTo(rightFootX, footY);
        ctx.stroke();

        // Right Foot
        ctx.fillStyle = activeColor.accent;
        ctx.beginPath();
        ctx.roundRect(rightFootX - 6, footY - 2, 12, 6, 3);
        ctx.fill();

        // 2. Robot Torso / Body
        const bodyY = catcherY + 22;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(robotX - 16, bodyY, 32, 22, 6);
        ctx.fill();
        ctx.stroke();

        // Glowing Power Core Reactor in Chest
        ctx.fillStyle = activeColor.accent;
        ctx.shadowColor = activeColor.accent;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(robotX, bodyY + 11, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 3. Robot Arms & Hands (Holding up the Catcher Tray)
        // Left Arm & Hand
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(robotX - 16, bodyY + 6);
        ctx.lineTo(catcherX + 8, catcherY + 8);
        ctx.stroke();

        ctx.fillStyle = activeColor.accent;
        ctx.beginPath();
        ctx.arc(catcherX + 8, catcherY + 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // Right Arm & Hand
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(robotX + 16, bodyY + 6);
        ctx.lineTo(catcherX + catcherWidth - 8, catcherY + 8);
        ctx.stroke();

        ctx.fillStyle = activeColor.accent;
        ctx.beginPath();
        ctx.arc(catcherX + catcherWidth - 8, catcherY + 8, 4, 0, Math.PI * 2);
        ctx.fill();

        // 4. Robot Head & Antenna
        const headY = catcherY + 6;
        // Antenna Stem
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(robotX, headY);
        ctx.lineTo(robotX, headY - 7);
        ctx.stroke();

        // Glowing Antenna Light Bulb
        const antennaGlow = 0.5 + Math.sin(time * 0.008) * 0.5;
        ctx.fillStyle = activeColor.accent;
        ctx.shadowColor = activeColor.accent;
        ctx.shadowBlur = 10 * antennaGlow;
        ctx.beginPath();
        ctx.arc(robotX, headY - 9, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Head Box
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(robotX - 12, headY, 24, 15, 5);
        ctx.fill();
        ctx.stroke();

        // Glowing Cyber Visor / Eyes
        ctx.fillStyle = activeColor.accent;
        ctx.shadowColor = activeColor.accent;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(robotX - 8, headY + 3, 16, 5, 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 5. Catcher Glowing Party Tray (Held above robot head)
        ctx.fillStyle = activeColor.accent;
        ctx.shadowColor = activeColor.accent;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.roundRect(catcherX, catcherY, catcherWidth, catcherHeight, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Catcher Handles / Neon Accents
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(catcherX + 4, catcherY - 3, 4, 3);
        ctx.fillRect(catcherX + catcherWidth - 8, catcherY - 3, 4, 3);

        // Update and Draw Balloons
        balloons.forEach((balloon, bIndex) => {
          balloon.x += Math.sin(time * balloon.swaySpeed + balloon.swayOffset) * 0.6;
          balloon.y += balloon.speed;
          balloon.x = Math.min(Math.max(balloon.x, balloon.radius), w - balloon.radius);

          // Draw string
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(balloon.x, balloon.y + balloon.radius);
          ctx.quadraticCurveTo(
            balloon.x + Math.sin(time * 0.05) * 8, 
            balloon.y + balloon.radius + 15, 
            balloon.x, 
            balloon.y + balloon.radius + 32
          );
          ctx.stroke();

          // Draw balloon bulb
          ctx.fillStyle = balloon.color;
          ctx.beginPath();
          ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
          ctx.fill();

          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.beginPath();
          ctx.arc(balloon.x - balloon.radius * 0.3, balloon.y - balloon.radius * 0.3, balloon.radius * 0.25, 0, Math.PI * 2);
          ctx.fill();

          // Draw bomb label (white bubble spike)
          if (balloon.vibeType === 'bomb') {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('X', balloon.x, balloon.y + 4.5);
          }

          // Check Catcher Collision
          if (
            balloon.y + balloon.radius >= catcherY &&
            balloon.y - balloon.radius <= catcherY + catcherHeight &&
            balloon.x + balloon.radius >= catcherX &&
            balloon.x - balloon.radius <= catcherX + catcherWidth
          ) {
            if (balloon.vibeType === 'bomb') {
              setLives((l) => {
                const nl = l - 1;
                if (nl <= 0) {
                  setGameState('GAMEOVER');
                }
                return nl;
              });
            } else {
              const points = balloon.vibeType === vibeRef.current ? 10 : 5;
              setScore((s) => s + points);
            }

            // Create explosion particles
            for (let p = 0; p < 12; p++) {
              particles.push({
                x: balloon.x,
                y: balloon.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6 - 2,
                radius: Math.random() * 3 + 2,
                color: balloon.color,
                alpha: 1,
              });
            }

            balloons.splice(bIndex, 1);
            return;
          }

          // Check Screen Bottom Out
          if (balloon.y - balloon.radius > h) {
            if (balloon.vibeType !== 'bomb') {
              setLives((l) => {
                const nl = l - 1;
                if (nl <= 0) {
                  setGameState('GAMEOVER');
                }
                return nl;
              });
            }
            balloons.splice(bIndex, 1);
          }
        });

        // Update and Draw Particles
        particles.forEach((part, pIndex) => {
          part.x += part.vx;
          part.y += part.vy;
          part.vy += 0.08;
          part.alpha -= 0.025;

          if (part.alpha <= 0) {
            particles.splice(pIndex, 1);
            return;
          }

          ctx.save();
          ctx.globalAlpha = part.alpha;
          ctx.fillStyle = part.color;
          ctx.shadowColor = part.color;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(part.x, part.y, part.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        // Top UI Text Info
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillText(`SCORE: ${scoreRef.current}`, 20, 30);

        ctx.textAlign = 'right';
        ctx.fillText(`LIVES: ${'❤️'.repeat(livesRef.current)}`, w - 20, 30);

      } else if (gameStateRef.current === 'GAMEOVER') {
        const finalScore = scoreRef.current;
        const currentHigh = parseInt(localStorage.getItem('beevibe_highscore') || '0', 10);
        
        if (finalScore > currentHigh) {
          localStorage.setItem('beevibe_highscore', finalScore.toString());
          setHighScore(finalScore);
        }

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PARTY OVER', w / 2, h * 0.3);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Outfit, sans-serif';
        ctx.fillText(`Final Score: ${finalScore}`, w / 2, h * 0.39);

        if (finalScore >= 50) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 15px Outfit, sans-serif';
          ctx.fillText('🎉 CODE UNLOCKED: BEEVIBEPLAY', w / 2, h * 0.47);
          ctx.font = '12px Plus Jakarta Sans, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.fillText('Enter BEEVIBEPLAY at checkout to get ₹100 off!', w / 2, h * 0.52);
        } else {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.font = '13px Plus Jakarta Sans, sans-serif';
          ctx.fillText('Score 50+ to unlock a discount promo code!', w / 2, h * 0.48);
        }

        ctx.fillStyle = activeColor.accent;
        ctx.shadowColor = activeColor.accent;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.roundRect(w / 2 - 80, h * 0.62, 160, 42, 8);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.fillText('PLAY AGAIN', w / 2, h * 0.62 + 26);
      }

      animFrameId = requestAnimationFrame(update);
    };

    animFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const w = canvas.width;
    const h = canvas.height;

    if (gameState === 'START') {
      if (
        clickX >= w / 2 - 80 && 
        clickX <= w / 2 + 80 && 
        clickY >= h * 0.65 && 
        clickY <= h * 0.65 + 42
      ) {
        setScore(0);
        setLives(3);
        setGameState('PLAYING');
      }
    } else if (gameState === 'GAMEOVER') {
      if (
        clickX >= w / 2 - 80 && 
        clickX <= w / 2 + 80 && 
        clickY >= h * 0.62 && 
        clickY <= h * 0.62 + 42
      ) {
        setScore(0);
        setLives(3);
        setGameState('PLAYING');
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      playerXRef.current = e.clientX - rect.left;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (gameState !== 'PLAYING') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && e.touches[0]) {
      if (e.cancelable) e.preventDefault();
      playerXRef.current = e.touches[0].clientX - rect.left;
    }
  };

  return (
    <div 
      className={styles.showcaseContainer} 
      style={{ 
        '--accent-color': current.accent, 
        '--accent-rgb': current.rgb 
      } as React.CSSProperties}
    >
      <div className={styles.gameFrame}>
        <canvas
          ref={canvasRef}
          className={styles.gameCanvas}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchMove}
        >
          <div className={styles.canvasError}>
            Arcade game requires a graphics-compatible browser.
          </div>
        </canvas>

        <div className={styles.gameInfoPanel}>
          <div className={styles.infoLeft}>
            <span className={styles.infoDot} />
            <span>Interactive Vibe Catcher Game</span>
          </div>
          <div className={styles.infoRight}>
            High Score: {highScore}
          </div>
        </div>
      </div>
    </div>
  );
}
