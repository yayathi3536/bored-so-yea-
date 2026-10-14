import React, { useEffect, useRef } from 'react';

interface CosmicSkyProps {
  intensity?: 'ambient' | 'bright' | 'climax';
  enableCursorStars?: boolean;
  warpSpeed?: boolean;
}

interface Star {
  x: number;
  y: number;
  z: number; // depth
  size: number;
  brightness: number;
  baseBrightness: number;
  twinkleSpeed: number;
  driftX: number;
  driftY: number;
  color: string;
  isDiamond?: boolean;
}

interface Meteor {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  life: number;
  maxLife: number;
  color: string;
}

interface Stardust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export const CosmicSky: React.FC<CosmicSkyProps> = ({
  intensity = 'ambient',
  enableCursorStars = true,
  warpSpeed = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stardustRef = useRef<Stardust[]>([]);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);
  const warpSpeedRef = useRef(warpSpeed);
  warpSpeedRef.current = warpSpeed;

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
      initStars();
    };

    window.addEventListener('resize', handleResize);

    // Multi-layer star palette: diamond white, warm celestial gold, sapphire blue, rose gold
    const starColors = [
      '#ffffff',
      '#ffffff',
      '#fef08a', // warm gold
      '#fed7aa', // amber
      '#c7d2fe', // soft indigo
      '#fbcfe8', // celestial rose
      '#93c5fd', // starlight cyan
    ];

    let stars: Star[] = [];
    const starCount = Math.min(320, Math.floor((width * height) / 3600));

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        const z = Math.random() * 0.8 + 0.2; // depth factor (0.2 far, 1.0 close)
        const base = Math.random() * 0.6 + 0.3;
        const isDiamond = Math.random() < 0.08 && z > 0.6; // 8% are bright 4-point diamond stars
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z,
          size: (Math.random() * 1.8 + 0.6) * z * (isDiamond ? 1.6 : 1),
          brightness: base,
          baseBrightness: base,
          twinkleSpeed: (Math.random() * 0.03 + 0.01) * (1 / z),
          driftX: (Math.random() - 0.5) * 0.05 * z,
          driftY: (Math.random() - 0.5) * 0.05 * z,
          color: starColors[Math.floor(Math.random() * starColors.length)],
          isDiamond,
        });
      }
    };

    initStars();

    // Meteors / shooting stars
    let meteors: Meteor[] = [];
    let nextMeteorTime = Date.now() + 2000 + Math.random() * 4000;

    const spawnMeteor = () => {
      const startX = Math.random() * width * 0.7 + width * 0.15;
      const startY = Math.random() * height * 0.35;
      meteors.push({
        x: startX,
        y: startY,
        length: 110 + Math.random() * 90,
        speed: 12 + Math.random() * 10,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25,
        opacity: 0.95,
        life: 0,
        maxLife: 45 + Math.random() * 25,
        color: Math.random() > 0.3 ? '#fef08a' : '#ffffff',
      });
      nextMeteorTime = Date.now() + 4000 + Math.random() * 7000;
    };

    // Stardust tracking cursor
    const handleMouseMove = (e: MouseEvent) => {
      if (!enableCursorStars || window.innerWidth < 768) return;
      const { clientX, clientY } = e;
      if (lastMousePos.current) {
        const dx = clientX - lastMousePos.current.x;
        const dy = clientY - lastMousePos.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 6 && stardustRef.current.length < 50) {
          stardustRef.current.push({
            x: clientX + (Math.random() - 0.5) * 8,
            y: clientY + (Math.random() - 0.5) * 8,
            vx: (Math.random() - 0.5) * 0.9,
            vy: Math.random() * 0.6 + 0.2,
            alpha: 0.85,
            size: Math.random() * 2.2 + 0.8,
            color: Math.random() > 0.4 ? '#fef08a' : '#fbcfe8',
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

      const isWarping = warpSpeedRef.current;
      const intensityMult = intensity === 'climax' ? 1.4 : intensity === 'bright' ? 1.2 : 1.0;

      // Draw Stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Animate twinkle
        s.brightness = s.baseBrightness + Math.sin(time * s.twinkleSpeed * 60) * 0.35;

        // Position drift or warp zoom
        if (isWarping) {
          s.y += s.z * 12;
          s.size = Math.min(6, s.size * 1.02);
        } else {
          s.x += s.driftX;
          s.y += s.driftY;
        }

        // Edge wrapping
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const alpha = Math.max(0.12, Math.min(1, s.brightness * intensityMult));

        ctx.save();
        ctx.fillStyle = s.color;
        ctx.globalAlpha = alpha;

        if (s.isDiamond) {
          // Draw bright 4-point cross diffraction spike star
          const sz = s.size * 1.8;
          ctx.beginPath();
          ctx.arc(s.x, s.y, sz * 0.6, 0, Math.PI * 2);
          ctx.fill();

          // Horizontal spike
          ctx.beginPath();
          ctx.moveTo(s.x - sz * 2.5, s.y);
          ctx.lineTo(s.x + sz * 2.5, s.y);
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.7;
          ctx.stroke();

          // Vertical spike
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - sz * 2.5);
          ctx.lineTo(s.x, s.y + sz * 2.5);
          ctx.stroke();
        } else {
          // Standard star with soft glow for foreground
          if (s.z > 0.7) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(254, 240, 138, 0.18)';
            ctx.fill();
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();
        }

        ctx.restore();
      }

      // Spawn Meteors
      if (Date.now() > nextMeteorTime && !isWarping) {
        spawnMeteor();
      }

      // Draw Meteors
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life++;
        const progress = m.life / m.maxLife;
        m.x += Math.cos(m.angle) * m.speed;
        m.y += Math.sin(m.angle) * m.speed;

        const currentOpacity = (1 - progress) * m.opacity;
        const tailX = m.x - Math.cos(m.angle) * m.length;
        const tailY = m.y - Math.sin(m.angle) * m.length;

        const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
        grad.addColorStop(0.25, `rgba(254, 240, 138, ${currentOpacity * 0.9})`);
        grad.addColorStop(0.7, `rgba(244, 114, 182, ${currentOpacity * 0.4})`);
        grad.addColorStop(1, 'rgba(254, 240, 138, 0)');

        ctx.save();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Bright sparkling head
        ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (progress >= 1 || m.x > width + 150 || m.y > height + 150) {
          meteors.splice(i, 1);
        }
      }

      // Draw Cursor Stardust
      const dust = stardustRef.current;
      for (let i = dust.length - 1; i >= 0; i--) {
        const p = dust[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.018;

        if (p.alpha <= 0) {
          dust.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = 'rgba(254, 240, 138, 0.7)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
  }, [intensity, enableCursorStars]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep cinematic midnight canvas gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#01040f] via-[#04081c] to-[#020512]" />

      {/* Atmospheric Aurora Nebulae */}
      <div
        className="absolute -top-40 left-1/4 w-[850px] h-[650px] rounded-full blur-[160px] opacity-35 pointer-events-none animate-pulse-glow"
        style={{
          background:
            'radial-gradient(circle, rgba(59, 130, 246, 0.35) 0%, rgba(139, 92, 246, 0.2) 45%, rgba(244, 63, 94, 0.1) 70%, transparent 85%)',
        }}
      />
      <div
        className="absolute top-1/3 -right-32 w-[650px] h-[650px] rounded-full blur-[150px] opacity-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(234, 179, 8, 0.28) 0%, rgba(244, 63, 94, 0.18) 50%, transparent 80%)',
        }}
      />
      <div
        className="absolute -bottom-36 -left-24 w-[750px] h-[550px] rounded-full blur-[170px] opacity-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, rgba(99, 102, 241, 0.15) 60%, transparent 80%)',
        }}
      />

      {/* Subtle organic starry vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-soft-light"
        style={{
          backgroundImage:
            'radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.8) 100%)',
        }}
      />

      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
