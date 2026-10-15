import React, { useState, useEffect } from 'react';
import { Sparkles, Music, Heart, ArrowRight } from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { FloatingHeartButton } from '../FloatingHeartButton';

interface OpeningSceneProps {
  leadText: string;
  subText: string;
  buttonText: string;
  recipientName: string;
  onEnter: () => void;
}

export const OpeningScene: React.FC<OpeningSceneProps> = ({
  leadText,
  subText,
  buttonText,
  recipientName,
  onEnter,
}) => {
  const [showDedication, setShowDedication] = useState(false);
  const [showLead, setShowLead] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showCenterpiece, setShowCenterpiece] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [soundOption, setSoundOption] = useState(true);
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; symbol: string; x: number; y: number }>>([]);

  useEffect(() => {
    const t0 = setTimeout(() => setShowDedication(true), 200);
    const t1 = setTimeout(() => setShowLead(true), 600);
    const t2 = setTimeout(() => setShowSub(true), 1300);
    const t3 = setTimeout(() => setShowCenterpiece(true), 1900);
    const t4 = setTimeout(() => setShowButton(true), 2500);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleOpenWorld = (e?: React.MouseEvent) => {
    if (isTransitioning) return;

    // Spawn heart burst around click or center
    const burstOriginX = e ? e.clientX : window.innerWidth / 2;
    const burstOriginY = e ? e.clientY : window.innerHeight / 2;
    const particles = Array.from({ length: 14 }, (_, i) => ({
      id: Date.now() + i,
      symbol: ['💖', '🌸', '✨', '🎀', '💕', '⭐', '🍓'][i % 7],
      x: burstOriginX + (Math.random() - 0.5) * 140,
      y: burstOriginY + (Math.random() - 0.5) * 100,
    }));
    setFloatingParticles(particles);

    audioEngine.playChime(1.3);

    if (soundOption) {
      setTimeout(() => {
        audioEngine.play('/audio/heat_waves.mp3');
      }, 250);
    }

    // Smooth dreamy fade transition into main website
    setIsTransitioning(true);

    setTimeout(() => {
      onEnter();
    }, 1100);
  };

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 sm:py-24 select-none overflow-hidden transition-all duration-1000 ${
        isTransitioning
          ? 'scale-105 opacity-0 filter blur-md pointer-events-none'
          : 'scale-100 opacity-100'
      }`}
    >
      {/* Dreamy Paper Background Texture */}
      <div className="absolute inset-0 paper-texture opacity-80 pointer-events-none" />

      {/* Soft Pastel Ambient Halos (Blush Pink, Cream, Lavender, Butter Yellow, Peach) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top left blush aura */}
        <div className="absolute -top-20 -left-20 w-[65vw] max-w-[550px] aspect-square rounded-full blur-[110px] bg-gradient-to-br from-[#F8C8DC]/70 via-[#FFD8C2]/50 to-transparent" />
        {/* Center warm cream & lavender glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[85vw] max-w-[700px] aspect-square rounded-full blur-[130px] bg-gradient-to-tr from-[#FFF8F0]/90 via-[#E6DDF5]/55 to-[#FFF0B3]/45" />
        {/* Bottom right peach glow */}
        <div className="absolute -bottom-24 -right-20 w-[60vw] max-w-[500px] aspect-square rounded-full blur-[100px] bg-gradient-to-tl from-[#FFD8C2]/65 via-[#F8C8DC]/45 to-transparent" />
      </div>

      {/* Floating Gentle Clouds in Background */}
      <div className="absolute top-12 left-6 sm:top-20 sm:left-16 pointer-events-none opacity-40 animate-cute-float">
        <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
          <path
            d="M25 45 C15 45 8 38 8 28 C8 19 15 12 25 12 C28 5 36 0 46 0 C58 0 68 8 70 18 C75 14 83 14 88 18 C95 12 105 15 108 24 C116 26 120 33 118 41 C116 48 109 53 100 53 L25 53 Z"
            fill="#FFF8F0"
          />
        </svg>
      </div>

      <div className="absolute top-32 right-8 sm:top-28 sm:right-24 pointer-events-none opacity-35 animate-cute-float" style={{ animationDelay: '2.5s' }}>
        <svg width="100" height="50" viewBox="0 0 100 50" fill="none">
          <path
            d="M20 38 C12 38 6 32 6 24 C6 16 12 10 20 10 C23 4 30 0 38 0 C48 0 56 7 58 15 C62 12 69 12 73 15 C79 10 87 13 90 20 C96 22 100 28 98 35 C96 40 91 44 83 44 L20 44 Z"
            fill="#FFF8F0"
          />
        </svg>
      </div>

      {/* Floating Doodles & Stickers in Corners */}
      <div className="absolute top-10 left-5 sm:top-14 sm:left-14 text-xl sm:text-3xl animate-cute-float opacity-80 pointer-events-none select-none">
        🎀
      </div>
      <div className="absolute top-16 right-5 sm:top-18 sm:right-16 text-lg sm:text-2xl animate-cute-float opacity-75 pointer-events-none select-none" style={{ animationDelay: '1.8s' }}>
        🌸
      </div>
      <div className="hidden sm:block absolute bottom-28 left-16 text-2xl animate-cute-float opacity-75 pointer-events-none select-none" style={{ animationDelay: '3s' }}>
        🍓
      </div>
      <div className="hidden sm:block absolute bottom-20 right-20 text-2xl animate-cute-float opacity-85 pointer-events-none select-none" style={{ animationDelay: '1.2s' }}>
        ✨
      </div>
      <div className="hidden md:block absolute top-1/2 left-10 text-xl animate-cute-float opacity-70 pointer-events-none select-none" style={{ animationDelay: '2.2s' }}>
        🧸
      </div>

      {/* Floating Heart Burst on Trigger */}
      {floatingParticles.map((p) => (
        <span
          key={p.id}
          className="fixed pointer-events-none z-50 animate-subtle-floating-heart text-xl sm:text-2xl select-none"
          style={{ left: `${p.x}px`, top: `${p.y}px` }}
        >
          {p.symbol}
        </span>
      ))}

      {/* Centerpiece Content Box */}
      <div className="relative z-10 max-w-3xl w-full text-center flex flex-col items-center">
        {/* Personalized Ribbon Badge */}
        <div
          className={`transition-all duration-1000 transform ${
            showDedication ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#F8C8DC] bg-[#FFF8F0]/95 backdrop-blur-md shadow-[0_4px_16px_rgba(248,200,220,0.5)] mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm">🎀</span>
            <span className="font-['Quicksand'] text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#765563] font-bold">
              a sweet universe for {recipientName} ♡
            </span>
            <span className="text-xs sm:text-sm">🌸</span>
          </div>
        </div>

        {/* Lead sentence in cute bubbly font */}
        <h1
          className={`font-['Fredoka'] text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-[#765563] font-semibold tracking-wide leading-tight text-cute-shadow px-2 transition-all duration-1000 transform ${
            showLead ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ textWrap: 'balance' }}
        >
          {leadText || 'pssst... someone made something for you ♡'}
        </h1>

        {/* Handwritten Subtitle in Caveat */}
        <p
          className={`font-['Caveat'] text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-[#E99AB5] font-bold mt-2 sm:mt-4 px-2 leading-relaxed transition-all duration-1000 transform ${
            showSub ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ textWrap: 'balance' }}
        >
          "{subText || "and it's filled with a little bit of love"}"
        </p>

        {/* Decorative Romantic Keepsake Emblem (Replaces the letter) */}
        <div
          className={`mt-6 sm:mt-10 mb-4 sm:mb-6 transition-all duration-1000 transform ${
            showCenterpiece ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-90'
          }`}
        >
          <div className="relative flex items-center justify-center">
            {/* Soft pulsing aura */}
            <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] blur-xl opacity-70 animate-pulse pointer-events-none" />

            {/* Pastel Ribbon & Heart Medallion */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FFF8F0] border-3 border-[#F8C8DC] shadow-[0_10px_30px_rgba(248,200,220,0.6)] flex flex-col items-center justify-center animate-cute-float">
              {/* Cute top bow */}
              <div className="absolute -top-3 text-2xl select-none">🎀</div>

              {/* Beating Heart Icon */}
              <Heart className="w-10 h-10 sm:w-12 sm:h-12 text-[#FF6584] fill-[#F8C8DC] animate-pulse drop-shadow-sm mt-1" />

              <span className="font-['Caveat'] text-xs sm:text-sm font-bold text-[#E99AB5] mt-0.5">
                pure love ♡
              </span>
            </div>
          </div>
        </div>

        {/* Surprise Button */}
        <div
          className={`mt-6 sm:mt-8 w-full flex flex-col items-center transition-all duration-1000 transform ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <FloatingHeartButton
            onClick={handleOpenWorld}
            className="group relative cursor-pointer px-7 sm:px-11 py-3.5 sm:py-4.5 rounded-full font-['Fredoka'] text-base xs:text-lg sm:text-2xl tracking-wide text-[#765563] bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] border-3 border-white shadow-[0_12px_32px_rgba(248,200,220,0.7),0_0_20px_rgba(255,255,255,0.9)] hover:shadow-[0_16px_42px_rgba(233,154,181,0.85)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2.5 sm:gap-3 overflow-hidden backdrop-blur-md animate-cute-float max-w-full"
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

            <span className="font-semibold drop-shadow-xs">
              {buttonText || 'Open your little world 💌'}
            </span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1.5 transition-transform shrink-0" />
          </FloatingHeartButton>

          {/* Sound preference badge */}
          <div className="mt-5 sm:mt-6 flex items-center gap-2 max-w-full">
            <button
              onClick={() => setSoundOption(!soundOption)}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none bg-[#FFF8F0]/95 border-2 border-[#F8C8DC] rounded-full px-4 py-1.5 hover:border-[#E99AB5] transition-colors shadow-xs max-w-full"
            >
              <Music className={`w-3.5 h-3.5 shrink-0 ${soundOption ? 'text-[#E99AB5] animate-bounce' : 'text-stone-400'}`} />
              <span className="text-[11px] sm:text-xs font-['Quicksand'] font-bold text-[#765563] truncate">
                {soundOption ? 'Playing: Heat Waves — Glass Animals 🍓' : 'Music muted'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
