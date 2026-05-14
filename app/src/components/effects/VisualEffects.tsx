// Visual Effects Components

import { useEffect, useRef, useState } from 'react';

// Floating magical orbs background
export function MagicalOrbs() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Orb {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      pulsePhase: number;
    }

    const orbs: Orb[] = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 20 + Math.random() * 60,
      color: ['#8b5cf6', '#d946ef', '#6366f1', '#a855f7'][Math.floor(Math.random() * 4)],
      alpha: 0.03 + Math.random() * 0.05,
      pulsePhase: Math.random() * Math.PI * 2
    }));

    let animationId: number;
    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbs.forEach(orb => {
        // Update position
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Wrap around
        if (orb.x < -orb.radius) orb.x = canvas.width + orb.radius;
        if (orb.x > canvas.width + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = canvas.height + orb.radius;
        if (orb.y > canvas.height + orb.radius) orb.y = -orb.radius;

        // Pulse effect
        const pulse = Math.sin(time * 0.001 + orb.pulsePhase) * 0.5 + 0.5;
        const currentAlpha = orb.alpha * (0.7 + pulse * 0.3);

        // Draw orb
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius
        );
        gradient.addColorStop(0, orb.color + Math.floor(currentAlpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, orb.color + Math.floor(currentAlpha * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

// Animated gradient mesh
export function GradientMesh() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      
      {/* Animated gradient orbs */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
          top: '-20%',
          left: '-10%',
          animation: 'float-orb-1 20s ease-in-out infinite',
          filter: 'blur(60px)'
        }}
      />
      <div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(217, 70, 239, 0.4) 0%, transparent 70%)',
          bottom: '-10%',
          right: '-5%',
          animation: 'float-orb-2 25s ease-in-out infinite',
          filter: 'blur(80px)'
        }}
      />
      <div 
        className="absolute w-[400px] h-[400px] rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
          top: '40%',
          left: '60%',
          animation: 'float-orb-3 18s ease-in-out infinite',
          filter: 'blur(40px)'
        }}
      />

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      <style>{`
        @keyframes float-orb-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, 30px) scale(1.1); }
          50% { transform: translate(20px, 60px) scale(0.95); }
          75% { transform: translate(-30px, 40px) scale(1.05); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, -50px) scale(1.15); }
          66% { transform: translate(30px, -30px) scale(0.9); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-60px, 20px) scale(1.2); }
        }
      `}</style>
    </div>
  );
}

// Glow border effect
export function GlowBorder({ children, color = 'violet', intensity = 'medium' }: { 
  children: React.ReactNode; 
  color?: 'violet' | 'fuchsia' | 'amber' | 'emerald' | 'rose';
  intensity?: 'low' | 'medium' | 'high';
}) {
  const colors = {
    violet: '139, 92, 246',
    fuchsia: '217, 70, 239',
    amber: '245, 158, 11',
    emerald: '16, 185, 129',
    rose: '244, 63, 94'
  };

  const intensities = {
    low: '0.2',
    medium: '0.4',
    high: '0.7'
  };

  return (
    <div className="relative">
      <div 
        className="absolute -inset-[1px] rounded-xl blur-sm transition-opacity"
        style={{
          background: `linear-gradient(135deg, rgba(${colors[color]}, ${intensities[intensity]}), rgba(${colors[color]}, ${parseFloat(intensities[intensity]) * 0.5}))`,
        }}
      />
      <div className="relative bg-slate-900 rounded-xl">
        {children}
      </div>
    </div>
  );
}

// Shimmer loading effect
export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent)',
          animation: 'shimmer-slide 2s infinite'
        }}
      />
      <style>{`
        @keyframes shimmer-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// Animated stat bar
export function AnimatedStatBar({ 
  value, 
  max, 
  color = 'violet',
  animated = true 
}: { 
  value: number; 
  max: number; 
  color?: 'violet' | 'red' | 'blue' | 'green' | 'amber';
  animated?: boolean;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colors = {
    violet: 'from-violet-500 to-fuchsia-500',
    red: 'from-red-500 to-rose-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-emerald-500 to-green-500',
    amber: 'from-amber-500 to-yellow-500'
  };

  return (
    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
      <div 
        className={`h-full bg-gradient-to-r ${colors[color]} relative ${animated ? 'transition-all duration-500 ease-out' : ''}`}
        style={{ width: `${percentage}%` }}
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse" />
      </div>
    </div>
  );
}

// Card with 3D tilt effect
export function TiltCard({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  };

  return (
    <div
      ref={cardRef}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}

// Text scramble effect
export function ScrambleText({ 
  text, 
  className = '',
  trigger = true 
}: { 
  text: string; 
  className?: string;
  trigger?: boolean;
}) {
  const [displayText, setDisplayText] = useState(text);
  const chars = '!<>-_\\/[]{}—=+*^?#________';

  useEffect(() => {
    if (!trigger) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    const maxIterations = text.length * 3;
    
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration / 3) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      iteration++;
      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [text, trigger]);

  return <span className={className}>{displayText}</span>;
}

// Neon text effect
export function NeonText({ 
  children, 
  color = 'violet',
  className = '' 
}: { 
  children: React.ReactNode; 
  color?: 'violet' | 'fuchsia' | 'cyan' | 'amber';
  className?: string;
}) {
  const colors = {
    violet: '#8b5cf6',
    fuchsia: '#d946ef',
    cyan: '#06b6d4',
    amber: '#f59e0b'
  };

  return (
    <span 
      className={`font-bold ${className}`}
      style={{
        color: colors[color],
        textShadow: `
          0 0 5px ${colors[color]},
          0 0 10px ${colors[color]},
          0 0 20px ${colors[color]},
          0 0 40px ${colors[color]}80
        `
      }}
    >
      {children}
    </span>
  );
}

// Ripple effect button
export function RippleButton({ 
  children, 
  onClick, 
  className = '' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
}) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    
    setRipples(prev => [...prev, { x, y, id }]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 600);

    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      className={`relative overflow-hidden ${className}`}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)'
          }}
        />
      ))}
      {children}
      <style>{`
        @keyframes ripple {
          to {
            width: 200%;
            height: 200%;
            opacity: 0;
          }
        }
        .animate-ripple {
          width: 0;
          height: 0;
          animation: ripple 0.6s ease-out;
        }
      `}</style>
    </button>
  );
}
