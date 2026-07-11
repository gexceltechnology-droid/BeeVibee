'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeTheaterProps {
  vibe: 'amber' | 'cyan' | 'pink' | 'purple';
  scrollProgress: number; // Value from 0 (top of page) to 1 (bottom of page)
}

// Map vibes to hex colors
const VIBE_COLORS = {
  amber: 0xf2a900,
  cyan: 0x00d4ff,
  pink: 0xff2e7e,
  purple: 0x9333ea,
};

// Define camera scrollytelling keyframes
interface CameraState {
  pos: THREE.Vector3;
  target: THREE.Vector3;
}

const KEYFRAMES: CameraState[] = [
  // 0% Scroll: Hero Section (Back of the room looking down at the theater)
  { pos: new THREE.Vector3(0, 4.5, 11), target: new THREE.Vector3(0, 2.2, -8) },
  
  // 33% Scroll: Packages/Vibes (Fly-in over the seats, panning slightly to the right side)
  { pos: new THREE.Vector3(3.8, 2.8, 3), target: new THREE.Vector3(-1.8, 1.8, -5) },
  
  // 66% Scroll: Amenities (Close-up panning left to show panels and glowing lighting strips)
  { pos: new THREE.Vector3(-4.5, 2.2, -1), target: new THREE.Vector3(3.5, 2.0, -1) },
  
  // 100% Scroll: Booking Portal (Immersive front-row centered view looking straight at the screen)
  { pos: new THREE.Vector3(0, 1.6, -3.8), target: new THREE.Vector3(0, 2.4, -8) },
];

export default function ThreeTheater({ vibe, scrollProgress }: ThreeTheaterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<number>(0);
  const lightsRef = useRef<{
    ambient: THREE.AmbientLight;
    ledLeft: THREE.PointLight;
    ledRight: THREE.PointLight;
    screenGlow: THREE.PointLight;
    strips: THREE.Mesh[];
  } | null>(null);

  // Sync scrollProgress to ref for use inside animation loop (avoids useEffect re-init)
  useEffect(() => {
    scrollRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    if (!containerRef.current) return;

    const currentContainer = containerRef.current;
    let width = currentContainer.clientWidth || 500;
    let height = currentContainer.clientHeight || 400;

    // --- 1. Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050508);
    scene.fog = new THREE.FogExp2(0x050508, 0.06);

    // --- 2. Camera Setup ---
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    // Initialize at keyframe 0
    camera.position.copy(KEYFRAMES[0].pos);
    camera.lookAt(KEYFRAMES[0].target);

    // --- 3. Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    currentContainer.appendChild(renderer.domElement);

    // --- 4. Create Theater Elements ---
    const currentHexColor = VIBE_COLORS[vibe];

    // Room dimensions
    const roomWidth = 14;
    const roomHeight = 6;
    const roomLength = 16;

    // Floor (dark carpet pattern)
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomLength);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111116,
      roughness: 0.8,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls (Cozy dark acoustic panels)
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.9,
    });

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    backWall.position.set(0, roomHeight / 2, roomLength / 2);
    backWall.rotation.y = Math.PI;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Front wall
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    frontWall.position.set(0, roomHeight / 2, -roomLength / 2);
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomLength), wallMat);
    ceiling.position.set(0, roomHeight, 0);
    ceiling.rotation.x = Math.PI / 2;
    scene.add(ceiling);

    // --- Cinema Screen ---
    const screenWidth = 9;
    const screenHeight = 4.2;
    const screenFrameGeo = new THREE.BoxGeometry(screenWidth + 0.4, screenHeight + 0.4, 0.1);
    const screenFrameMat = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.5 });
    const screenFrame = new THREE.Mesh(screenFrameGeo, screenFrameMat);
    screenFrame.position.set(0, roomHeight / 2 - 0.2, -roomLength / 2 + 0.15);
    scene.add(screenFrame);

    const screenGeo = new THREE.PlaneGeometry(screenWidth, screenHeight);
    
    // Create canvas texture for screen
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 256;
    const ctx = screenCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#06060c';
      ctx.fillRect(0, 0, 512, 256);
      
      ctx.fillStyle = '#ffb71a';
      ctx.font = 'bold 52px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(242, 169, 0, 0.8)';
      ctx.shadowBlur = 15;
      ctx.fillText('Bee Vibe', 256, 110);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '22px Outfit, sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText('MINI PRIVATE THEATER', 256, 170);
    }
    const screenTexture = new THREE.CanvasTexture(screenCanvas);

    const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, roomHeight / 2 - 0.2, -roomLength / 2 + 0.22);
    scene.add(screen);

    // --- Recliner Seats ---
    const chairMat = new THREE.MeshStandardMaterial({
      color: 0x16161c,
      roughness: 0.7,
      metalness: 0.1,
    });
    const cushionMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e12,
      roughness: 0.8,
    });

    function createRecliner(): THREE.Group {
      const chairGroup = new THREE.Group();
      
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), chairMat);
      base.position.y = 0.15;
      base.castShadow = true;
      base.receiveShadow = true;
      chairGroup.add(base);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), cushionMat);
      seat.position.set(0, 0.35, 0.05);
      seat.castShadow = true;
      seat.receiveShadow = true;
      chairGroup.add(seat);

      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.22), cushionMat);
      backrest.position.set(0, 0.8, 0.4);
      backrest.rotation.x = -0.15;
      backrest.castShadow = true;
      backrest.receiveShadow = true;
      chairGroup.add(backrest);

      const armLeft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.85), chairMat);
      armLeft.position.set(-0.46, 0.45, 0.05);
      armLeft.castShadow = true;
      chairGroup.add(armLeft);

      const armRight = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.85), chairMat);
      armRight.position.set(0.46, 0.45, 0.05);
      armRight.castShadow = true;
      chairGroup.add(armRight);

      const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.18), cushionMat);
      headrest.position.set(0, 1.3, 0.46);
      headrest.rotation.x = -0.15;
      headrest.castShadow = true;
      chairGroup.add(headrest);

      // Cup holder glow
      const cupGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
      const cupMat = new THREE.MeshBasicMaterial({ color: currentHexColor });
      const cupHolder = new THREE.Mesh(cupGeo, cupMat);
      cupHolder.position.set(0.46, 0.74, -0.2);
      chairGroup.add(cupHolder);

      return chairGroup;
    }

    const rows = 3;
    const seatsPerRow = 4;
    const rowSpacing = 2.8;
    const seatSpacing = 1.6;
    const startZ = 4.5;
    const startX = -((seatsPerRow - 1) * seatSpacing) / 2;

    for (let r = 0; r < rows; r++) {
      const stepHeight = r * 0.45;
      
      if (r > 0) {
        const platform = new THREE.Mesh(
          new THREE.BoxGeometry(roomWidth - 0.2, stepHeight, 2.2),
          floorMat
        );
        platform.position.set(0, stepHeight / 2, startZ - r * rowSpacing + 0.1);
        platform.receiveShadow = true;
        scene.add(platform);
      }

      for (let s = 0; s < seatsPerRow; s++) {
        const seat = createRecliner();
        seat.position.set(startX + s * seatSpacing, stepHeight, startZ - r * rowSpacing);
        scene.add(seat);
      }
    }

    // --- 5. Neon LED Strip Lights & Lighting ---
    const ambientLight = new THREE.AmbientLight(currentHexColor, 0.04);
    scene.add(ambientLight);

    const stripGeom = new THREE.BoxGeometry(0.05, 0.15, roomLength - 2);
    const stripLeftMat = new THREE.MeshBasicMaterial({ color: currentHexColor });
    const stripLeft = new THREE.Mesh(stripGeom, stripLeftMat);
    stripLeft.position.set(-roomWidth / 2 + 0.05, roomHeight / 2 + 0.5, 0);
    scene.add(stripLeft);

    const stripRightMat = new THREE.MeshBasicMaterial({ color: currentHexColor });
    const stripRight = new THREE.Mesh(stripGeom, stripRightMat);
    stripRight.position.set(roomWidth / 2 - 0.05, roomHeight / 2 + 0.5, 0);
    scene.add(stripRight);

    const ledLeftLight = new THREE.PointLight(currentHexColor, 4, 12);
    ledLeftLight.position.set(-roomWidth / 2 + 0.2, roomHeight / 2 + 0.5, 0);
    scene.add(ledLeftLight);

    const ledRightLight = new THREE.PointLight(currentHexColor, 4, 12);
    ledRightLight.position.set(roomWidth / 2 - 0.2, roomHeight / 2 + 0.5, 0);
    scene.add(ledRightLight);

    const projectorLight = new THREE.SpotLight(0xffffff, 8, 25, Math.PI / 10, 0.5, 1);
    projectorLight.position.set(0, roomHeight - 0.5, roomLength / 2 - 1);
    projectorLight.target = screen;
    projectorLight.castShadow = false;
    scene.add(projectorLight);
    scene.add(projectorLight.target);

    const screenBounceGlow = new THREE.PointLight(currentHexColor, 2.5, 10);
    screenBounceGlow.position.set(0, roomHeight / 2, -roomLength / 2 + 1);
    scene.add(screenBounceGlow);

    lightsRef.current = {
      ambient: ambientLight,
      ledLeft: ledLeftLight,
      ledRight: ledRightLight,
      screenGlow: screenBounceGlow,
      strips: [stripLeft, stripRight],
    };

    // --- 6. Scrollytelling LERP States ---
    const cameraPos = new THREE.Vector3().copy(KEYFRAMES[0].pos);
    const cameraLook = new THREE.Vector3().copy(KEYFRAMES[0].target);

    // --- 7. Animation Loop ---
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      const elapsedTime = (performance.now() - startTime) * 0.001;
      
      // Light pulses
      if (lightsRef.current) {
        const pulse = 1.0 + Math.sin(elapsedTime * 1.5) * 0.12;
        lightsRef.current.ledLeft.intensity = 4 * pulse;
        lightsRef.current.ledRight.intensity = 4 * pulse;
        lightsRef.current.screenGlow.intensity = 2.5 * (1.0 + Math.sin(elapsedTime * 2.5) * 0.08);
      }

      // --- Calculate Scrollytelling Camera Position & lookAt target ---
      const progress = scrollRef.current;
      const numSegments = KEYFRAMES.length - 1;
      const rawVal = progress * numSegments;
      const segment = Math.min(Math.floor(rawVal), numSegments - 1);
      const t = rawVal - segment; // fraction within segment

      const startState = KEYFRAMES[segment];
      const endState = KEYFRAMES[segment + 1];

      // Targets
      const targetPos = new THREE.Vector3().lerpVectors(startState.pos, endState.pos, t);
      const targetLookAt = new THREE.Vector3().lerpVectors(startState.target, endState.target, t);

      // Smooth damping (lerp actual values towards target values)
      cameraPos.lerp(targetPos, 0.05); // 0.05 damping factor
      cameraLook.lerp(targetLookAt, 0.05);

      camera.position.copy(cameraPos);
      camera.lookAt(cameraLook);

      renderer.render(scene, camera);
    };

    animate();

    // --- 8. Handle Resize using ResizeObserver (Robust for grid rendering shifts) ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w === 0 || h === 0) continue;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });

    resizeObserver.observe(currentContainer);

    // --- Cleanup ---
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      });
      
      if (currentContainer && renderer.domElement.parentNode) {
        currentContainer.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update lights dynamically when the vibe changes
  useEffect(() => {
    if (!lightsRef.current) return;

    const hexColor = VIBE_COLORS[vibe];
    const targetColor = new THREE.Color(hexColor);

    let step = 0;
    const duration = 25; // frames
    const initialAmbient = lightsRef.current.ambient.color.clone();
    const initialLedLeft = lightsRef.current.ledLeft.color.clone();
    const initialLedRight = lightsRef.current.ledRight.color.clone();
    const initialScreenGlow = lightsRef.current.screenGlow.color.clone();

    let transitionFrameId: number;

    const transitionColor = () => {
      if (step < duration) {
        step++;
        const t = step / duration;
        
        if (lightsRef.current) {
          lightsRef.current.ambient.color.lerpColors(initialAmbient, targetColor, t);
          lightsRef.current.ledLeft.color.lerpColors(initialLedLeft, targetColor, t);
          lightsRef.current.ledRight.color.lerpColors(initialLedRight, targetColor, t);
          lightsRef.current.screenGlow.color.lerpColors(initialScreenGlow, targetColor, t);

          lightsRef.current.strips.forEach((strip) => {
            if (Array.isArray(strip.material)) {
              // No-op for arrays
            } else if (strip.material instanceof THREE.MeshBasicMaterial) {
              strip.material.color.lerpColors(initialAmbient, targetColor, t);
            }
          });
        }

        transitionFrameId = requestAnimationFrame(transitionColor);
      }
    };

    transitionColor();

    return () => {
      cancelAnimationFrame(transitionFrameId);
    };
  }, [vibe]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
