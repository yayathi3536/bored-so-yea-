import React from 'react';

interface CosmicMoonProps {
  size?: number;
  className?: string;
  glowIntensity?: 'normal' | 'luminous' | 'subtle';
}

export const CosmicMoon: React.FC<CosmicMoonProps> = ({
  size = 240,
  className = '',
  glowIntensity = 'luminous',
}) => {
  return (
    <div
      className={`relative select-none pointer-events-none transition-all duration-1000 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Outer Volumetric Atmospheric Moon Glow */}
      <div
        className="absolute inset-[-55%] rounded-full blur-[75px] transition-all duration-1000"
        style={{
          background:
            glowIntensity === 'luminous'
              ? 'radial-gradient(circle, rgba(254, 243, 199, 0.42) 0%, rgba(253, 224, 71, 0.15) 35%, rgba(147, 197, 253, 0.08) 60%, transparent 80%)'
              : 'radial-gradient(circle, rgba(254, 243, 199, 0.22) 0%, transparent 70%)',
        }}
      />

      {/* Golden Coronal Halo */}
      <div
        className="absolute inset-[-20%] rounded-full blur-[30px] opacity-80"
        style={{
          background:
            'radial-gradient(circle, rgba(254, 240, 138, 0.55) 0%, rgba(253, 186, 116, 0.2) 55%, transparent 75%)',
        }}
      />

      {/* Moon Light Rays (Subtle radial shimmer) */}
      <div
        className="absolute inset-[-30%] rounded-full opacity-30 animate-spin"
        style={{
          animationDuration: '120s',
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(254, 243, 199, 0.15) 30deg, transparent 60deg, rgba(254, 243, 199, 0.2) 90deg, transparent 130deg, rgba(254, 243, 199, 0.12) 180deg, transparent 230deg, rgba(254, 243, 199, 0.18) 290deg, transparent 360deg)',
        }}
      />

      {/* Realistic Moon Sphere */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden shadow-[0_0_60px_rgba(254,240,138,0.5),inset_-10px_-10px_35px_rgba(30,41,59,0.7)]"
        style={{
          background:
            'radial-gradient(circle at 35% 35%, #ffffff 0%, #fef9c3 30%, #fde68a 55%, #cbd5e1 85%, #94a3b8 100%)',
        }}
      >
        {/* Maria (Dark basaltic plains) */}
        <div
          className="absolute inset-0 opacity-45 mix-blend-multiply"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 65% 35%, rgba(71, 85, 105, 0.6) 0%, transparent 35%),
              radial-gradient(ellipse at 40% 60%, rgba(71, 85, 105, 0.65) 0%, transparent 40%),
              radial-gradient(circle at 75% 65%, rgba(100, 116, 139, 0.5) 0%, transparent 28%),
              radial-gradient(circle at 28% 25%, rgba(100, 116, 139, 0.4) 0%, transparent 22%),
              radial-gradient(circle at 18% 55%, rgba(71, 85, 105, 0.5) 0%, transparent 25%),
              radial-gradient(ellipse at 50% 20%, rgba(100, 116, 139, 0.35) 0%, transparent 25%)
            `,
          }}
        />

        {/* Detailed Craters with Highlight Rim & Cast Shadow */}
        <div className="absolute top-[25%] left-[60%] w-8 h-8 rounded-full border-t border-l border-white/60 bg-slate-500/25 shadow-inner" />
        <div className="absolute top-[48%] left-[36%] w-10 h-10 rounded-full border-t border-l border-white/60 bg-slate-500/20 shadow-inner" />
        <div className="absolute top-[68%] left-[54%] w-7 h-7 rounded-full border-t border-l border-white/60 bg-slate-500/25 shadow-inner" />
        <div className="absolute top-[32%] left-[20%] w-6 h-6 rounded-full border-t border-l border-white/60 bg-slate-500/20 shadow-inner" />
        <div className="absolute top-[75%] left-[30%] w-5 h-5 rounded-full border-t border-l border-white/50 bg-slate-500/20 shadow-inner" />

        {/* Realistic Sphere Specular Rim Gradient */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0) 50%, rgba(15, 23, 42, 0.5) 100%)',
          }}
        />
      </div>

      {/* Layer 1 Drifting Atmospheric Clouds (Foreground) */}
      <div
        className="absolute -inset-x-16 top-1/4 h-20 opacity-40 blur-md pointer-events-none animate-pulse-glow"
        style={{
          background:
            'radial-gradient(ellipse at 45% 50%, rgba(254, 249, 195, 0.5) 0%, rgba(203, 213, 225, 0.2) 65%, transparent 100%)',
        }}
      />

      {/* Layer 2 Drifting Atmospheric Clouds (Lower) */}
      <div
        className="absolute -inset-x-20 bottom-1/6 h-16 opacity-30 blur-lg pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 65% 50%, rgba(248, 250, 252, 0.45) 0%, rgba(226, 232, 240, 0.15) 70%, transparent 100%)',
        }}
      />
    </div>
  );
};
