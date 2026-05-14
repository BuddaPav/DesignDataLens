import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import type { Weather } from '@/types/game';

export function LightningFlash({ weather }: { weather: Weather }) {
  const light = useRef<THREE.PointLight>(null);
  const acc = useRef(0);
  const next = useRef(0);
  const flash = useRef(0);
  const { gl } = useThree();
  const overlay = useMemo(() => {
    const el = document.createElement('div');
    el.style.cssText =
      'pointer-events:none;position:absolute;inset:0;background:#fff;opacity:0;z-index:12;transition:opacity 45ms linear';
    return el;
  }, []);

  useEffect(() => {
    const p = gl.domElement.parentElement;
    if (!p) return;
    const prev = p.style.position;
    if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
    p.appendChild(overlay);
    return () => {
      overlay.remove();
      p.style.position = prev;
    };
  }, [gl, overlay]);

  useFrame((_, dt) => {
    const l = light.current;
    if (!l || (weather !== 'stormy' && weather !== 'rainy')) {
      l && (l.intensity = 0);
      return;
    }
    acc.current += dt;
    flash.current = Math.max(0, flash.current - dt * 14);
    l.intensity = flash.current * 95;
    if (acc.current >= next.current) {
      acc.current = 0;
      next.current = 1.8 + Math.random() * 4.2;
      if (Math.random() < 0.45) {
        flash.current = 1;
        l.position.set((Math.random() - 0.5) * 120, 48 + Math.random() * 40, (Math.random() - 0.5) * 120);
        overlay.style.opacity = '0.14';
        setTimeout(() => {
          overlay.style.opacity = '0';
        }, 55);
      }
    }
  });

  if (weather !== 'stormy' && weather !== 'rainy') return null;
  return (
    <pointLight
      ref={light}
      distance={220}
      decay={2}
      color="#e0f2fe"
      intensity={0}
      position={[40, 60, 20]}
    />
  );
}
