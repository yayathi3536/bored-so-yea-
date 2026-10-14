import React, { useState, useEffect } from 'react';
import { Sparkles, Music, ArrowRight, Heart } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

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
  const [showButton, setShowButton] = useState(false);
  const [isBrightening, setIsBrightening] = useState(false);
  const [soundOption, setSoundOption] = useState(true);

  useEffect(() => {
    const t0 = setTimeout(() => setShowDedication(true), 300);
    const t1 = setTimeout(() => setShowLead(true), 1000);
    const t2 = setTimeout(() => setShowSub(true), 2400);
    const t3 = setTimeout(() => setShowButton(true), 3800);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleOpenSurprise = () => {
    setIsBrightening(true);
    audioEngine.playChime(1.3);
    if (soundOption) {
      setTimeout(() => {
        audioEngine.play('/audio/heat_waves.mp3');
      }, 300);
    }
    // Smooth transition
    setTimeout(() => {
      onEnter();
    }, 1200);
  };

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-16 sm:py-20 overflow-hidden select-none transition-all duration-1200 ${
        isBrightening
          ? 'scale-105 opacity-0 filter blur-sm pointer-events-none'
          : 'scale-100 opacity-100'
      }`}
    >
      {/* Decorative Bows & Daisies Floating in Corners */}
      <div className="absolute top-12 left-4 sm:top-16 sm:left-12 text-lg sm:text-2xl animate-cute-float opacity-80 pointer-events-none">
        🎀
      </div>
      <div className="absolute top-14 right-4 sm:top-20 sm:right-16 text-base sm:text-xl animate-cute-float opacity-75 pointer-events-none" style={{ animationDelay: '2s' }}>
        🌸
      </div>
      <div className="hidden sm:block absolute bottom-24 right-14 text-2xl animate-cute-float opacity-80 pointer-events-none" style={{ animationDelay: '1.5s' }}>
        ✨
      </div>
      <div className="hidden sm:block absolute top-1/2 left-8 text-xl animate-cute-float opacity-70 pointer-events-none" style={{ animationDelay: '3s' }}>
        🍓
      </div>

      {/* Center Dreamy Atmosphere Halo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[720px] aspect-square rounded-full blur-[100px] sm:blur-[130px] bg-gradient-to-tr from-[#FFD6E7]/70 via-[#FFE0CC]/60 to-[#E9DFFF]/55 pointer-events-none" />

      {/* Center Cinematic Kawaii Typography Content */}
      <div className="relative z-10 max-w-3xl w-full text-center flex flex-col items-center">
        {/* Soft Dedication Ribbon */}
        <div
          className={`mb-5 sm:mb-6 transition-all duration-1000 transform ${
            showDedication ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-[#FFBFD7] bg-[#FFF8EF]/95 backdrop-blur-md shadow-[0_4px_16px_rgba(255,191,215,0.4)]">
            <span className="text-xs sm:text-sm">🎀</span>
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] font-['Quicksand'] text-[#765563] font-bold">
              a sweet universe for {recipientName}
            </span>
            <span className="text-xs sm:text-sm">🌸</span>
          </div>
        </div>

        {/* Lead sentence in cute rounded font */}
        <h1
          className={`font-['Fredoka'] text-2xl xs:text-3xl sm:text-5xl md:text-6xl text-[#765563] font-semibold tracking-wide leading-tight transition-all duration-1200 transform text-cute-shadow px-2`}
          style={{ textWrap: 'balance' }}
        >
          {leadText}
        </h1>

        {/* Sub sentence in cursive handwriting */}
        <p
          className={`font-['Caveat'] text-xl xs:text-2xl sm:text-4xl md:text-5xl text-[#FF85A1] font-bold mt-3 sm:mt-5 transition-all duration-1200 transform px-2 ${
            showSub ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ textWrap: 'balance' }}
        >
          "{subText}"
        </p>

        {/* Adorable Pink Surprise Button: open your little surprise 🎀 */}
        <div
          className={`mt-8 sm:mt-14 w-full flex flex-col items-center transition-all duration-1200 transform px-2 ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <button
            onClick={handleOpenSurprise}
            className="group relative cursor-pointer px-6 py-3.5 sm:px-11 sm:py-4.5 rounded-full font-['Fredoka'] text-base xs:text-lg sm:text-2xl tracking-wide text-[#765563] bg-gradient-to-r from-[#FFD6E7] via-[#FFBFD7] to-[#FFE0CC] border-3 border-[#FFFFFF] shadow-[0_10px_28px_rgba(255,191,215,0.7),0_0_20px_rgba(255,255,255,0.9)] hover:shadow-[0_14px_38px_rgba(255,163,186,0.9),0_0_30px_rgba(255,255,255,1)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 overflow-hidden backdrop-blur-md animate-cute-float max-w-full"
          >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none" />

            <span className="font-semibold drop-shadow-xs">{buttonText}</span>
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1.5 transition-transform shrink-0" />
          </button>

          {/* Sound preference badge */}
          <div className="mt-5 sm:mt-6 flex items-center gap-2 max-w-full">
            <button
              onClick={() => setSoundOption(!soundOption)}
              className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none bg-[#FFF8EF]/95 border-2 border-[#FFBFD7]/60 rounded-full px-3.5 sm:px-4 py-1.5 hover:border-[#FF85A1] transition-colors shadow-xs max-w-full"
            >
              <Music className={`w-3.5 h-3.5 shrink-0 ${soundOption ? 'text-[#FF85A1] animate-bounce' : 'text-stone-400'}`} />
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
