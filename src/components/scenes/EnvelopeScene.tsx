import React, { useState } from 'react';
import { Heart, Sparkles, ChevronRight, FastForward } from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { FloatingHeartButton } from '../FloatingHeartButton';

interface EnvelopeSceneProps {
  greeting: string;
  paragraphs: string[];
  signature: string;
  dateStr: string;
  onNext: () => void;
}

type EnvelopePhase = 'sealed' | 'wiggling' | 'breakingSeal' | 'openingFlap' | 'risingLetter' | 'unfolded';

export const EnvelopeScene: React.FC<EnvelopeSceneProps> = ({
  greeting,
  paragraphs,
  signature,
  dateStr,
  onNext,
}) => {
  const [phase, setPhase] = useState<EnvelopePhase>('sealed');
  const [hugCount, setHugCount] = useState(0);
  const [showHugFeedback, setShowHugFeedback] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const handleOpenEnvelope = () => {
    if (phase !== 'sealed') return;

    // Stage 1: Envelope wiggles gently
    setPhase('wiggling');
    audioEngine.playChime(1.1);

    // Stage 2: Seal pops open
    setTimeout(() => {
      setPhase('breakingSeal');
      audioEngine.playChime(1.3);
    }, 450);

    // Stage 3: Flap opens in 3D
    setTimeout(() => {
      setPhase('openingFlap');
      audioEngine.playPaperRustle();
    }, 850);

    // Stage 4: Letter slides out
    setTimeout(() => {
      setPhase('risingLetter');
      audioEngine.playPaperRustle();
    }, 1450);

    // Stage 5: Letter expands into beautiful reading view
    setTimeout(() => {
      setPhase('unfolded');
      audioEngine.playChime(1.4);
    }, 2100);
  };

  const handleInstantUnfold = () => {
    setPhase('unfolded');
    audioEngine.playPaperRustle();
  };

  const handleTouchHeart = (e: React.MouseEvent) => {
    audioEngine.playHeartPulse();
    setHugCount((prev) => prev + 1);
    setShowHugFeedback(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const newHearts = Array.from({ length: 8 }).map((_, i) => ({
      id: Date.now() + i,
      x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 60,
      y: rect.top + (Math.random() - 0.5) * 20,
    }));
    setFloatingHearts((prev) => [...prev, ...newHearts]);

    setTimeout(() => {
      setShowHugFeedback(false);
      setFloatingHearts((prev) => prev.filter((h) => !newHearts.includes(h)));
    }, 2000);
  };

  const isOpened = phase === 'unfolded';

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-20 select-none overflow-x-hidden">
      {/* Soft Pastel Ambient Aura */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          isOpened ? 'opacity-90' : 'opacity-65'
        }`}
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[850px] rounded-full blur-[140px] bg-gradient-to-tr from-[#F8C8DC]/70 via-[#FFD8C2]/60 to-[#E6DDF5]/50" />
      </div>

      {/* Floating Hearts from Hug interaction */}
      {floatingHearts.map((h) => (
        <div
          key={h.id}
          className="fixed pointer-events-none z-50 text-[#FF6584] animate-float-heart"
          style={{
            left: `${h.x}px`,
            top: `${h.y}px`,
            fontSize: `${Math.random() * 16 + 20}px`,
          }}
        >
          💖
        </div>
      ))}

      {/* Skip animation option */}
      {phase !== 'sealed' && phase !== 'unfolded' && (
        <button
          onClick={handleInstantUnfold}
          className="fixed top-20 right-6 z-40 text-xs font-['Quicksand'] font-bold text-[#765563] flex items-center gap-1.5 bg-[#FFF8F0]/95 px-3.5 py-1.5 rounded-full border-2 border-[#F8C8DC] shadow-sm backdrop-blur-md cursor-pointer transition-all hover:bg-[#F8C8DC]"
        >
          <FastForward className="w-3.5 h-3.5 text-[#E99AB5]" />
          <span>skip opening</span>
        </button>
      )}

      {/* Center Stage Container */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {!isOpened ? (
          /* ================= KAWAII CREAM ENVELOPE ================= */
          <div className="flex flex-col items-center w-full">
            <p className="text-[#765563] font-['Fredoka'] text-2xl xs:text-3xl sm:text-4xl mb-6 sm:mb-8 tracking-wide text-center animate-cute-float text-cute-shadow px-2">
              "i have a tiny love letter for you... ♡"
            </p>

            {/* Envelope with Wiggle & 3D Flap */}
            <div
              onClick={handleOpenEnvelope}
              className={`relative w-[280px] xs:w-[320px] sm:w-96 h-48 xs:h-54 sm:h-64 cursor-pointer transition-all duration-300 perspective-1000 group ${
                phase === 'wiggling' ? 'animate-wiggle' : ''
              }`}
              title="Click to unseal our cute letter! ♡"
            >
              {/* Soft Pink Aura */}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#F8C8DC] via-[#FFF0B3] to-[#E6DDF5] rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

              {/* Envelope Body */}
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-b from-[#FFF8F0] via-[#FFF8F0] to-[#F8C8DC]/40 border-3 border-[#F8C8DC] shadow-[0_16px_40px_rgba(248,200,220,0.6)] overflow-hidden flex flex-col justify-end">
                {/* Washi tape at corner */}
                <div
                  className="absolute -top-2 left-6 w-24 h-6 opacity-90 pointer-events-none z-30 shadow-xs border border-white/70"
                  style={{
                    background: 'repeating-linear-gradient(45deg, #F8C8DC, #F8C8DC 8px, #FFD8C2 8px, #FFD8C2 16px)',
                    transform: 'rotate(-4deg)',
                  }}
                />

                {/* Back cavity */}
                <div className="absolute inset-x-2 top-2 bottom-2 rounded-2xl bg-gradient-to-b from-[#E6DDF5]/40 to-[#F8C8DC]/30 border border-[#F8C8DC]/30" />

                {/* Front Bottom Pocket Flap */}
                <div
                  className="absolute inset-x-0 bottom-0 h-32 xs:h-36 sm:h-40 z-10 pointer-events-none"
                  style={{
                    clipPath: 'polygon(0% 100%, 50% 35%, 100% 100%)',
                    background: 'linear-gradient(180deg, rgba(255, 248, 240, 0.99), rgba(248, 200, 220, 0.95))',
                    borderTop: '2px solid rgba(248, 200, 220, 0.9)',
                  }}
                />

                {/* Left and Right Side Fold Flaps */}
                <div
                  className="absolute inset-y-0 left-0 w-28 xs:w-32 sm:w-36 z-10 pointer-events-none"
                  style={{
                    clipPath: 'polygon(0% 0%, 100% 50%, 0% 100%)',
                    background: 'linear-gradient(90deg, rgba(255, 248, 240, 0.98), rgba(248, 200, 220, 0.6))',
                  }}
                />
                <div
                  className="absolute inset-y-0 right-0 w-28 xs:w-32 sm:w-36 z-10 pointer-events-none"
                  style={{
                    clipPath: 'polygon(100% 0%, 0% 50%, 100% 100%)',
                    background: 'linear-gradient(-90deg, rgba(255, 248, 240, 0.98), rgba(248, 200, 220, 0.6))',
                  }}
                />

                {/* Letter Sliding Up from Inside Cavity */}
                <div
                  className={`absolute left-3 right-3 sm:left-4 sm:right-4 h-38 xs:h-42 sm:h-48 paper-texture rounded-2xl shadow-lg border-2 border-[#F8C8DC] p-3 sm:p-4 transition-all duration-700 ease-out z-0 flex flex-col justify-between ${
                    phase === 'risingLetter'
                      ? '-translate-y-24 sm:-translate-y-28 opacity-100 scale-100'
                      : phase === 'openingFlap'
                      ? '-translate-y-6 sm:-translate-y-8 opacity-80 scale-95'
                      : 'translate-y-0 opacity-0 scale-90'
                  }`}
                >
                  <div className="h-2 w-14 sm:w-16 bg-[#F8C8DC] rounded-full" />
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="h-2 w-full bg-[#F8C8DC] rounded-full" />
                    <div className="h-2 w-4/5 bg-[#FFD8C2] rounded-full" />
                    <div className="h-2 w-2/3 bg-[#E6DDF5] rounded-full" />
                  </div>
                  <div className="h-2 w-16 sm:w-20 bg-[#F8C8DC] rounded-full self-end" />
                </div>

                {/* 3D Top Flap Rotating Backward */}
                <div
                  className={`absolute inset-x-0 top-0 h-1/2 origin-top z-20 transition-transform duration-700 ease-in-out transform-style-preserve-3d ${
                    phase === 'sealed' || phase === 'wiggling' || phase === 'breakingSeal'
                      ? 'rotate-x-0'
                      : '-rotate-x-180'
                  }`}
                  style={{
                    clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                    background: 'linear-gradient(180deg, rgba(255, 248, 240, 0.99), rgba(248, 200, 220, 0.99))',
                    borderBottom: '2px solid rgba(233, 154, 181, 0.8)',
                  }}
                />

                {/* Pink Wax Seal with Bow */}
                {(phase === 'sealed' || phase === 'wiggling' || phase === 'breakingSeal') && (
                  <div
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300 ${
                      phase === 'breakingSeal' ? 'scale-125 opacity-0 filter blur-xs' : 'scale-100 opacity-100'
                    }`}
                  >
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#F8C8DC] via-[#E99AB5] to-[#FF85A1] shadow-[0_6px_20px_rgba(233,154,181,0.6)] border-3 border-white flex flex-col items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-xl">🎀</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <span className="mt-8 text-xs font-['Quicksand'] tracking-widest uppercase text-[#765563] font-bold flex items-center gap-2 bg-[#FFF8F0]/95 px-5 py-2 rounded-full border-2 border-[#F8C8DC] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#E99AB5]" />
              tap envelope to open! ♡
            </span>
          </div>
        ) : (
          /* ================= UNFOLDED STATIONERY LETTER ================= */
          <div className="w-full animate-fadeIn transition-all duration-1000">
            {/* Stationery Paper with Washi Tape and Corner Daisies */}
            <div className="relative paper-texture rounded-3xl p-5 sm:p-10 md:p-14 text-[#765563] shadow-[0_20px_50px_rgba(248,200,220,0.45)] border-3 border-[#F8C8DC] overflow-hidden">
              {/* Cute Washi Tape at Top */}
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-7 sm:h-8 opacity-95 pointer-events-none shadow-xs border border-white/70"
                style={{
                  background: 'repeating-linear-gradient(45deg, #F8C8DC, #F8C8DC 10px, #FFF0B3 10px, #FFF0B3 20px)',
                  transform: 'rotate(-1deg)',
                  clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
                }}
              />

              {/* Corner Daisies & Hearts */}
              <div className="absolute top-3 left-3 sm:top-5 sm:left-5 text-base sm:text-xl select-none">🌼</div>
              <div className="absolute top-3 right-3 sm:top-5 sm:right-5 text-base sm:text-xl select-none">🎀</div>
              <div className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 text-base sm:text-xl select-none">🍓</div>
              <div className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 text-base sm:text-xl select-none">🌼</div>

              {/* Handwritten Greeting Header */}
              <div className="mb-5 sm:mb-6 border-b-2 border-dashed border-[#F8C8DC]/70 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-2 pt-2">
                <h2 className="font-['Caveat'] text-4xl xs:text-5xl sm:text-6xl text-[#765563] font-bold tracking-wide">
                  {greeting}
                </h2>
                <span className="text-[11px] sm:text-xs font-['Quicksand'] font-bold text-[#E99AB5] uppercase tracking-wider">
                  central memories · {dateStr || 'forever'}
                </span>
              </div>

              {/* Letter Paragraphs in Warm Brown with Generous Spacing */}
              <div className="space-y-4 sm:space-y-5 font-serif text-base xs:text-lg sm:text-xl text-[#765563] leading-relaxed tracking-normal">
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* Handwritten Signature */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t-2 border-dashed border-[#F8C8DC]/70 flex flex-col items-end">
                <span className="font-['Caveat'] text-3xl xs:text-4xl sm:text-5xl text-[#765563] font-bold tracking-wide">
                  {signature}
                </span>
                <span className="text-xs font-['Quicksand'] text-[#E99AB5] mt-1 font-semibold">
                  forever yours, always ♡
                </span>
              </div>

              {/* Adorable Touch-to-Hug Heart Box */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t-2 border-dotted border-[#F8C8DC] flex flex-col items-center bg-[#F8C8DC]/30 -mx-5 -mb-5 sm:-mx-10 sm:-mb-10 md:-mx-14 md:-mb-14 p-5 sm:p-8 rounded-b-3xl">
                <p className="text-xs sm:text-sm font-['Quicksand'] font-bold text-[#765563] mb-3 text-center px-2">
                  "Now if you want to hug me, you can touch the heart below ♡"
                </p>

                <button
                  onClick={handleTouchHeart}
                  className="group relative cursor-pointer p-4 sm:p-5 rounded-full bg-[#FFF8F0] hover:bg-[#F8C8DC] border-3 border-[#F8C8DC] shadow-[0_6px_20px_rgba(248,200,220,0.8)] hover:scale-115 active:scale-90 transition-all duration-200"
                  title="Touch for a hug! ♡"
                >
                  <Heart className="w-8 h-8 sm:w-9 sm:h-9 text-[#FF6584] fill-[#F8C8DC] animate-pulse" />
                  {showHugFeedback && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#E99AB5] text-white text-xs font-['Quicksand'] font-bold px-3.5 py-1.5 rounded-full shadow-lg animate-bounce">
                      bear hug delivered! 💖
                    </span>
                  )}
                </button>

                {hugCount > 0 ? (
                  <span className="mt-3 text-xs sm:text-sm font-['Quicksand'] font-bold text-[#765563] text-center px-2">
                    {hugCount} {hugCount === 1 ? 'hug' : 'hugs'} sent to you across the distance! ♡
                  </span>
                ) : (
                  <span className="mt-2 text-xs font-['Quicksand'] text-[#765563]/70 text-center">
                    tap whenever you need warmth ♡
                  </span>
                )}
              </div>
            </div>

            {/* Transition Prompt to Next Scene: "there's more, come see ♡" */}
            <div className="mt-10 sm:mt-12 flex flex-col items-center">
              <FloatingHeartButton
                onClick={onNext}
                className="group cursor-pointer px-6 sm:px-9 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] border-2 border-white text-[#765563] font-['Fredoka'] text-base sm:text-lg shadow-[0_8px_25px_rgba(248,200,220,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5 max-w-full"
              >
                <span>there's more, come see ♡</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1 transition-transform shrink-0" />
              </FloatingHeartButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
