import React, { useEffect, useState } from 'react';

export interface HeartParticle {
  id: string;
  left: number; // percentage (0 - 100)
  size: number; // in pixels
  symbol: string;
  delay: number; // in seconds
  duration: number; // in seconds
  rotation: number; // degrees
}

interface HeartRainProps {
  burstId: number;
}

const HEART_SYMBOLS = ['💖', '💕', '💗', '🌸', '🎀', '✨', '💝', '🌷'];

export const HeartRain: React.FC<HeartRainProps> = ({ burstId }) => {
  const [particles, setParticles] = useState<HeartParticle[]>([]);

  useEffect(() => {
    if (!burstId) return;

    // Generate a fresh shower of heart particles across the viewport
    const count = 30;
    const newParticles: HeartParticle[] = Array.from({ length: count }, (_, i) => ({
      id: `${burstId}-${i}`,
      left: Math.floor(Math.random() * 94) + 3, // 3% to 97%
      size: Math.floor(Math.random() * 16) + 14, // 14px to 30px
      symbol: HEART_SYMBOLS[Math.floor(Math.random() * HEART_SYMBOLS.length)],
      delay: Number((Math.random() * 0.45).toFixed(2)),
      duration: Number((1.8 + Math.random() * 0.9).toFixed(2)),
      rotation: Math.floor(Math.random() * 40) - 20,
    }));

    setParticles(newParticles);

    // Clean up particles after longest animation completes
    const timer = setTimeout(() => {
      setParticles([]);
    }, 3200);

    return () => clearTimeout(timer);
  }, [burstId]);

  if (particles.length === 0) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 select-none animate-heart-rain drop-shadow-[0_2px_8px_rgba(255,163,186,0.6)]"
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              '--rain-duration': `${p.duration}s`,
              transform: `rotate(${p.rotation}deg)`,
            } as React.CSSProperties
          }
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
};
