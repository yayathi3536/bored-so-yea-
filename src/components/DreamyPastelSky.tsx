import React, { useEffect, useRef } from 'react';

interface DreamyPastelSkyProps {
  intensity?: 'ambient' | 'bright' | 'sunset';
  enableCursorPetals?: boolean;
  isTransitioning?: boolean;
}

interface FloatingDaisy {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface FloatingHeart {
  x: number;
  y: number;
  size: number;
  vy: number;
  vx: number;
  rotation: number;
  alpha: number;
  color: string;
}

interface Sparkle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  speed: number;
  color: string;
}

interface CursorPetal {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  alpha: number;
  size: number;
}

export const DreamyPastelSky: React.FC<DreamyPastelSkyProps> = ({
  intensity = 'ambient',
  enableCursorPetals = true,
  isTransitioning = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cursorPetalsRef = useRef<CursorPetal[]>([]);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const isTransitioningRef = useRef(isTransitioning);
  isTransitioningRef.current = isTransitioning;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initElements();
    };

    window.addEventListener('resize', handleResize);

    // Floating Daisies, Hearts, and Sparkles
    let daisies: FloatingDaisy[] = [];
    let hearts: FloatingHeart[] = [];
    let sparkles: Sparkle[] = [];

    const heartColors = ['#FFD6E7', '#FFBFD7', '#FFA3BA', '#E9DFFF', '#FFE0CC'];
    const sparkleColors = ['#FFF8EF', '#FFBFD7', '#FFE0CC', '#D6B779', '#DDF1FF'];

    const daisyCount = Math.min(22, Math.floor((width * height) / 38000));
    const heartCount = Math.min(18, Math.floor((width * height) / 45000));
    const sparkleCount = Math.min(55, Math.floor((width * height) / 18000));

    const initElements = () => {
      daisies = [];
      for (let i = 0; i < daisyCount; i++) {
        daisies.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 8 + 12,
          vx: Math.random() * 0.5 + 0.2,
          vy: Math.random() * 0.6 + 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          opacity: Math.random() * 0.45 + 0.55,
        });
      }

      hearts = [];
      for (let i = 0; i < heartCount; i++) {
        hearts.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 8 + 8,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(Math.random() * 0.6 + 0.3), // float gently up
          rotation: (Math.random() - 0.5) * 0.4,
          alpha: Math.random() * 0.4 + 0.45,
          color: heartColors[Math.floor(Math.random() * heartColors.length)],
        });
      }

      sparkles = [];
      for (let i = 0; i < sparkleCount; i++) {
        sparkles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.3,
          baseAlpha: Math.random() * 0.5 + 0.3,
          speed: Math.random() * 0.03 + 0.015,
          color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
        });
      }
    };

    initElements();

    // Mouse movement spawns tiny floating hearts & sparkles
    const handleMouseMove = (e: MouseEvent) => {
      if (!enableCursorPetals || window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      if (lastMousePos.current) {
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 12 && cursorPetalsRef.current.length < 24) {
          cursorPetalsRef.current.push({
            x: clientX + (Math.random() - 0.5) * 8,
            y: clientY + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 0.7,
            vy: Math.random() * 0.5 + 0.2,
            rotation: Math.random() * Math.PI * 2,
            alpha: 0.8,
            size: Math.random() * 4 + 6,
          });
        }
      }
      lastMousePos.current = { x: clientX, y: clientY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let time = 0;

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      const isWarp = isTransitioningRef.current;
      const speedMult = isWarp ? 2.8 : 1.0;

      // Draw Twinkling Sparkles
      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.alpha = s.baseAlpha + Math.sin(time * s.speed * 60) * 0.3;
        const currentAlpha = Math.max(0.1, Math.min(0.9, s.alpha));

        ctx.save();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = currentAlpha;

        const r = s.size;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y - r * 2.2);
        ctx.lineTo(s.x + r * 0.6, s.y);
        ctx.lineTo(s.x, s.y + r * 2.2);
        ctx.lineTo(s.x - r * 0.6, s.y);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw Floating Hearts (upward drift)
      for (let i = 0; i < hearts.length; i++) {
        const h = hearts[i];
        h.y += h.vy * speedMult;
        h.x += (h.vx + Math.sin(time + i) * 0.25) * speedMult;

        if (h.y < -30) {
          h.y = height + 20;
          h.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rotation);
        ctx.globalAlpha = h.alpha;
        ctx.fillStyle = h.color;

        // Draw cute little heart shape
        const s = h.size * 0.5;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.3);
        ctx.bezierCurveTo(-s, -s * 0.8, -s * 1.8, s * 0.4, 0, s * 1.8);
        ctx.bezierCurveTo(s * 1.8, s * 0.4, s, -s * 0.8, 0, s * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // Draw Floating Daisies (rotates & falls gently)
      for (let i = 0; i < daisies.length; i++) {
        const d = daisies[i];
        d.rotation += d.rotationSpeed * speedMult;
        d.x += (d.vx + Math.sin(time * 0.7 + i) * 0.3) * speedMult;
        d.y += (d.vy + Math.cos(time * 0.4 + i) * 0.2) * speedMult;

        if (d.x > width + 40) d.x = -30;
        if (d.y > height + 40) d.y = -30;

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.globalAlpha = d.opacity;

        // Draw 8 white daisy petals
        const petalLen = d.size * 0.65;
        const petalW = d.size * 0.28;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#FFE0CC';
        ctx.lineWidth = 0.5;

        for (let p = 0; p < 8; p++) {
          ctx.save();
          ctx.rotate((p * Math.PI) / 4);
          ctx.beginPath();
          ctx.ellipse(0, -petalLen * 0.6, petalW * 0.5, petalLen * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        // Yellow Daisy Center
        ctx.beginPath();
        ctx.arc(0, 0, d.size * 0.24, 0, Math.PI * 2);
        ctx.fillStyle = '#FCD34D';
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        ctx.restore();
      }

      // Draw Cursor interactive petals
      const dust = cursorPetalsRef.current;
      for (let i = dust.length - 1; i >= 0; i--) {
        const cp = dust[i];
        cp.x += cp.vx;
        cp.y += cp.vy;
        cp.rotation += 0.02;
        cp.alpha -= 0.016;

        if (cp.alpha <= 0) {
          dust.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(cp.x, cp.y);
        ctx.rotate(cp.rotation);
        ctx.globalAlpha = cp.alpha;

        ctx.beginPath();
        ctx.ellipse(0, 0, cp.size * 0.5, cp.size, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFBFD7';
        ctx.fill();

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity, enableCursorPetals]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Warm Cream and Pastel Sky Backdrop */}
      <div
        className={`absolute inset-0 transition-all duration-1000 ${
          intensity === 'sunset'
            ? 'bg-gradient-to-b from-[#FFF8EF] via-[#FFE0CC]/70 to-[#E9DFFF]/75'
            : intensity === 'bright'
            ? 'bg-gradient-to-b from-[#FFFDF9] via-[#FFD6E7]/40 to-[#FFF8EF]'
            : 'bg-gradient-to-b from-[#FFF8EF] via-[#FFD6E7]/35 to-[#FFF8EF]'
        }`}
      />

      {/* Fluffy SVG Cloud Illustrations in the Background */}
      <div className="absolute top-10 left-8 opacity-45 pointer-events-none animate-cute-float" style={{ animationDelay: '0s' }}>
        <svg width="220" height="90" viewBox="0 0 220 90" fill="none">
          <path
            d="M40 70C25 70 12 58 12 43C12 30 22 19 35 18C43 6 58 0 75 0C96 0 113 11 120 28C126 24 133 22 142 22C160 22 175 35 178 52C182 50 187 49 192 49C207 49 220 60 220 74C220 89 207 90 192 90H40C25 90 25 70 40 70Z"
            fill="url(#cloudGrad1)"
          />
          <defs>
            <linearGradient id="cloudGrad1" x1="0" y1="0" x2="220" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="1" stopColor="#FFD6E7" stopOpacity="0.6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="absolute top-28 right-12 opacity-40 pointer-events-none animate-cute-float" style={{ animationDelay: '2.5s' }}>
        <svg width="260" height="100" viewBox="0 0 260 100" fill="none">
          <path
            d="M45 80C28 80 15 67 15 50C15 35 26 23 41 21C50 8 68 0 88 0C113 0 133 13 141 33C148 28 156 26 167 26C188 26 206 41 209 61C214 59 220 58 226 58C244 58 260 71 260 87C260 100 244 100 226 100H45C28 100 28 80 45 80Z"
            fill="url(#cloudGrad2)"
          />
          <defs>
            <linearGradient id="cloudGrad2" x1="0" y1="0" x2="260" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="1" stopColor="#FFE0CC" stopOpacity="0.55" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Animated Butterfly */}
      <div className="absolute top-1/3 left-16 pointer-events-none z-10 animate-butterfly">
        <svg width="34" height="34" viewBox="0 0 40 40" className="drop-shadow-sm">
          {/* Butterfly wings in soft lavender & pink */}
          <ellipse cx="14" cy="14" rx="10" ry="12" fill="#E9DFFF" stroke="#FFBFD7" strokeWidth="1.2" transform="rotate(-25 14 14)" />
          <ellipse cx="26" cy="14" rx="10" ry="12" fill="#E9DFFF" stroke="#FFBFD7" strokeWidth="1.2" transform="rotate(25 26 14)" />
          <ellipse cx="15" cy="26" rx="7" ry="9" fill="#FFD6E7" stroke="#FFBFD7" strokeWidth="1.2" transform="rotate(-15 15 26)" />
          <ellipse cx="25" cy="26" rx="7" ry="9" fill="#FFD6E7" stroke="#FFBFD7" strokeWidth="1.2" transform="rotate(15 25 26)" />
          {/* Body */}
          <ellipse cx="20" cy="20" rx="2.5" ry="10" fill="#765563" />
        </svg>
      </div>

      <div className="absolute bottom-1/4 right-20 pointer-events-none z-10 animate-butterfly" style={{ animationDelay: '4s' }}>
        <svg width="28" height="28" viewBox="0 0 40 40" className="drop-shadow-sm">
          <ellipse cx="14" cy="14" rx="9" ry="11" fill="#FFD6E7" stroke="#FFA3BA" strokeWidth="1.2" transform="rotate(-25 14 14)" />
          <ellipse cx="26" cy="14" rx="9" ry="11" fill="#FFD6E7" stroke="#FFA3BA" strokeWidth="1.2" transform="rotate(25 26 14)" />
          <ellipse cx="15" cy="26" rx="6" ry="8" fill="#FFE0CC" stroke="#FFA3BA" strokeWidth="1.2" transform="rotate(-15 15 26)" />
          <ellipse cx="25" cy="26" rx="6" ry="8" fill="#FFE0CC" stroke="#FFA3BA" strokeWidth="1.2" transform="rotate(15 25 26)" />
          <ellipse cx="20" cy="20" rx="2.2" ry="9" fill="#765563" />
        </svg>
      </div>

      {/* Layer 1: Soft Pastel Cloud Billows */}
      <div
        className="absolute -top-36 -left-36 w-[750px] h-[600px] rounded-full blur-[130px] opacity-45 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 214, 231, 0.8) 0%, rgba(233, 223, 255, 0.5) 50%, transparent 80%)',
        }}
      />
      <div
        className="absolute top-1/4 -right-28 w-[700px] h-[700px] rounded-full blur-[140px] opacity-40 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(255, 224, 204, 0.75) 0%, rgba(255, 191, 215, 0.45) 55%, transparent 80%)',
        }}
      />

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
