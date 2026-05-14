// Advanced Particle System for Visual Effects

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  type: 'sparkle' | 'magic' | 'fire' | 'heal' | 'levelup';
}

interface ParticleSystemProps {
  type: 'sparkle' | 'magic' | 'fire' | 'heal' | 'levelup';
  intensity?: 'low' | 'medium' | 'high';
  trigger?: boolean;
  position?: { x: number; y: number };
  className?: string;
}

export function ParticleSystem({ 
  type, 
  intensity = 'medium', 
  trigger = true,
  position,
  className = '' 
}: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);

  const getParticleConfig = useCallback(() => {
    const configs = {
      sparkle: {
        colors: ['#8b5cf6', '#d946ef', '#f59e0b', '#ffffff'],
        sizeRange: [1, 3],
        speedRange: [0.5, 2],
        gravity: 0.02,
        fadeRate: 0.01
      },
      magic: {
        colors: ['#8b5cf6', '#6366f1', '#a855f7', '#ec4899'],
        sizeRange: [2, 5],
        speedRange: [1, 3],
        gravity: -0.01,
        fadeRate: 0.008
      },
      fire: {
        colors: ['#ef4444', '#f97316', '#fbbf24', '#dc2626'],
        sizeRange: [3, 8],
        speedRange: [2, 5],
        gravity: -0.05,
        fadeRate: 0.015
      },
      heal: {
        colors: ['#22c55e', '#4ade80', '#86efac', '#ffffff'],
        sizeRange: [2, 4],
        speedRange: [1, 2],
        gravity: -0.03,
        fadeRate: 0.01
      },
      levelup: {
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#8b5cf6'],
        sizeRange: [3, 6],
        speedRange: [3, 6],
        gravity: -0.08,
        fadeRate: 0.012
      }
    };
    return configs[type];
  }, [type]);

  const createParticle = useCallback((canvas: HTMLCanvasElement): Particle => {
    const config = getParticleConfig();
    const centerX = position ? position.x * canvas.width : canvas.width / 2;
    const centerY = position ? position.y * canvas.height : canvas.height / 2;
    
    const angle = Math.random() * Math.PI * 2;
    const speed = config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]);
    
    return {
      x: centerX + (Math.random() - 0.5) * 50,
      y: centerY + (Math.random() - 0.5) * 50,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      alpha: 1,
      type
    };
  }, [getParticleConfig, position, type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const config = getParticleConfig();
    const particleCount = intensity === 'low' ? 20 : intensity === 'medium' ? 40 : 80;

    // Initialize particles
    particlesRef.current = Array.from({ length: particleCount }, () => createParticle(canvas));

    const animate = () => {
      if (!isActiveRef.current) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += config.gravity;
        
        // Update life
        particle.life -= config.fadeRate;
        particle.alpha = particle.life;

        // Reset dead particles
        if (particle.life <= 0 && trigger) {
          particlesRef.current[index] = createParticle(canvas);
        }

        // Draw particle
        if (particle.life > 0) {
          ctx.save();
          ctx.globalAlpha = particle.alpha;
          
          // Glow effect
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Core
          ctx.fillStyle = particle.color;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    if (trigger) {
      animate();
    }

    return () => {
      isActiveRef.current = false;
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [createParticle, getParticleConfig, intensity, trigger, type]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none absolute inset-0 z-0', className)}
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

// Burst effect for one-time events
interface ParticleBurstProps {
  trigger: boolean;
  type: 'sparkle' | 'magic' | 'fire' | 'heal' | 'levelup';
  onComplete?: () => void;
}

export function ParticleBurst({ trigger, type, onComplete }: ParticleBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!trigger) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const configs = {
      sparkle: {
        colors: ['#8b5cf6', '#d946ef', '#f59e0b', '#ffffff'],
        count: 30,
        sizeRange: [2, 5],
        speedRange: [5, 12]
      },
      magic: {
        colors: ['#8b5cf6', '#6366f1', '#a855f7', '#ec4899'],
        count: 50,
        sizeRange: [3, 8],
        speedRange: [8, 15]
      },
      fire: {
        colors: ['#ef4444', '#f97316', '#fbbf24'],
        count: 40,
        sizeRange: [4, 10],
        speedRange: [10, 20]
      },
      heal: {
        colors: ['#22c55e', '#4ade80', '#86efac', '#ffffff'],
        count: 35,
        sizeRange: [3, 6],
        speedRange: [6, 12]
      },
      levelup: {
        colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#8b5cf6'],
        count: 80,
        sizeRange: [4, 10],
        speedRange: [10, 25]
      }
    };

    const config = configs[type];
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Create burst particles
    particlesRef.current = Array.from({ length: config.count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = config.speedRange[0] + Math.random() * (config.speedRange[1] - config.speedRange[0]);
      
      return {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1 + Math.random() * 0.5,
        maxLife: 1.5,
        size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        alpha: 1,
        type
      };
    });

    let frameCount = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let activeParticles = 0;

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.98; // Air resistance
        particle.vy *= 0.98;
        particle.vy += 0.2; // Gravity
        
        // Update life
        particle.life -= 0.02;
        particle.alpha = Math.max(0, particle.life / particle.maxLife);

        // Draw particle
        if (particle.life > 0) {
          activeParticles++;
          ctx.save();
          ctx.globalAlpha = particle.alpha;
          
          // Glow effect
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 3
          );
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(0.5, particle.color + '80');
          gradient.addColorStop(1, 'transparent');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      });

      frameCount++;

      if (activeParticles > 0 && frameCount < 180) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [trigger, type, onComplete]);

  if (!trigger) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
