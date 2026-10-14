import React, { useState } from 'react';
import { Heart, Sparkles, ChevronRight, FastForward } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

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
          isOpened ? 'opacity-90' : 'opacity-60'
        }`}
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[850px] rounded-full blur-[140px] bg-gradient-to-tr from-[#FFD6E7]/70 via-[#FFE0CC]/60 to-[#E9DFFF]/50" />
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
          className="fixed top-20 right-6 z-40 text-xs font-['Quicksand'] font-bold text-[#765563] flex items-center gap-1.5 bg-[#FFF8EF]/95 px-3.5 py-1.5 rounded-full border-2 border-[#FFBFD7] shadow-sm backdrop-blur-md cursor-pointer transition-all hover:bg-[#FFD6E7]"
        >
          <FastForward className="w-3.5 h-3.5 text-[#FF85A1]" />
          <span>skip opening</span>
        </button>
      )}

      {/* Center Stage Container */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        {!isOpened ? (
          /* ================= KAWAII CREAM ENVELOPE ================= */
          <div className="flex flex-col items-center w-full">
            <p className="text-[#765563] font-['Fredoka'] text-xl xs:text-2xl sm:text-3xl mb-6 sm:mb-8 tracking-wide text-center animate-cute-float text-cute-shadow px-2">
              "i have a tiny something for you... ♡"
            </p>

            {/* Envelope with Wiggle & 3D Flap */}
            <div
              onClick={handleOpenEnvelope}
              className={`relative w-[270px] xs:w-[310px] sm:w-96 h-44 xs:h-52 sm:h-62 cursor-pointer transition-all duration-300 perspective-1000 group ${
                phase === 'wiggling' ? 'animate-wiggle' : ''
              }`}
              title="Click to unseal our cute letter! ♡"
            >
              {/* Soft Pink Aura */}
              <div
                className={`absolute -inset-3 sm:-inset-6 rounded-3xl blur-xl sm:blur-2xl transition-all duration-700 ${
                  phase === 'sealed'
                    ? 'bg-[#FFBFD7]/60 group-hover:bg-[#FFD6E7]/80 group-hover:scale-105'
                    : 'bg-[#FFBFD7]/80 scale-110'
                }`}
              />

              {/* Cream Envelope Body */}
              <div className="relative w-full h-full rounded-3xl overflow-visible bg-gradient-to-b from-[#FFFDF9] to-[#FFF0E5] border-3 border-[#FFBFD7] shadow-[0_16px_40px_rgba(255,191,215,0.45)] transform-style-preserve-3d">
                {/* Paper Lining Pattern */}
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#FFBFD7_1.2px,transparent_1.2px)] [background-size:16px_16px]" />

                {/* Satin Pink Ribbon across envelope */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 sm:h-8 bg-gradient-to-r from-[#FFD6E7] via-[#FFBFD7] to-[#FFD6E7] border-y border-[#FF85A1]/40 shadow-xs z-10 pointer-events-none flex items-center justify-center">
                  {/* Little Decorative Daisy on ribbon left */}
                  <span className="absolute left-4 sm:left-6 text-xs sm:text-sm">🌼</span>
                  {/* Little Decorative Daisy on ribbon right */}
                  <span className="absolute right-4 sm:right-6 text-xs sm:text-sm">🌼</span>
                </div>

                {/* Left Folded Flap */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    clipPath: 'polygon(0 0, 50% 50%, 0 100%)',
                    background: 'linear-gradient(135deg, rgba(255, 253, 249, 0.98), rgba(255, 235, 240, 0.98))',
                    borderRight: '1.5px solid rgba(255, 191, 215, 0.6)',
                  }}
                />

                {/* Right Folded Flap */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    clipPath: 'polygon(100% 0, 50% 50%, 100% 100%)',
                    background: 'linear-gradient(225deg, rgba(255, 253, 249, 0.98), rgba(255, 235, 240, 0.98))',
                    borderLeft: '1.5px solid rgba(255, 191, 215, 0.6)',
                  }}
                />

                {/* Bottom Folded Flap */}
                <div
                  className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    clipPath: 'polygon(0 100%, 50% 48%, 100% 100%)',
                    background: 'linear-gradient(0deg, rgba(255, 245, 240, 0.99), rgba(255, 230, 238, 0.99))',
                    borderTop: '1.5px solid rgba(255, 191, 215, 0.7)',
                  }}
                />

                {/* Letter Sliding Up from Inside Cavity */}
                <div
                  className={`absolute left-3 right-3 sm:left-4 sm:right-4 h-38 xs:h-42 sm:h-48 paper-texture rounded-2xl shadow-lg border-2 border-[#FFBFD7] p-3 sm:p-4 transition-all duration-700 ease-out z-0 flex flex-col justify-between ${
                    phase === 'risingLetter'
                      ? '-translate-y-24 sm:-translate-y-28 opacity-100 scale-100'
                      : phase === 'openingFlap'
                      ? '-translate-y-6 sm:-translate-y-8 opacity-80 scale-95'
                      : 'translate-y-0 opacity-0 scale-90'
                  }`}
                >
                  <div className="h-2 w-14 sm:w-16 bg-[#FFBFD7] rounded-full" />
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="h-2 w-full bg-[#FFD6E7] rounded-full" />
                    <div className="h-2 w-4/5 bg-[#FFE0CC] rounded-full" />
                    <div className="h-2 w-2/3 bg-[#E9DFFF] rounded-full" />
                  </div>
                  <div className="h-2 w-16 sm:w-20 bg-[#FFBFD7] rounded-full self-end" />
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
                    background: 'linear-gradient(180deg, rgba(255, 250, 246, 0.99), rgba(255, 235, 242, 0.99))',
                    borderBottom: '2px solid rgba(255, 191, 215, 0.8)',
                  }}
                />

                {/* Pink Wax Seal with Bow */}
                {(phase === 'sealed' || phase === 'wiggling' || phase === 'breakingSeal') && (
                  <div
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300 ${
                      phase === 'breakingSeal' ? 'scale-125 opacity-0 filter blur-sm' : 'scale-100 opacity-100'
                    }`}
                  >
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#FFD6E7] via-[#FFBFD7] to-[#FF85A1] shadow-[0_6px_20px_rgba(255,133,161,0.5)] border-3 border-[#FFFFFF] flex flex-col items-center justify-center group-hover:scale-110 transition-transform">
                      {/* Cute Bow Icon on Seal */}
                      <span className="text-xl">🎀</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <span className="mt-8 text-xs font-['Quicksand'] tracking-widest uppercase text-[#765563] font-bold flex items-center gap-2 bg-[#FFF8EF]/95 px-5 py-2 rounded-full border-2 border-[#FFBFD7] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FF85A1]" />
              tap envelope to open! ♡
            </span>
          </div>
        ) : (
          /* ================= UNFOLDED STATIONERY LETTER ================= */
          <div className="w-full animate-fadeIn transition-all duration-1000">
            {/* Stationery Paper with Washi Tape and Corner Daisies */}
            <div className="relative paper-texture rounded-3xl p-5 sm:p-10 md:p-14 text-[#765563] shadow-[0_20px_50px_rgba(255,191,215,0.35)] border-3 border-[#FFBFD7] overflow-hidden">
              {/* Cute Washi Tape at Top */}
              <div
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-7 sm:h-8 opacity-90 pointer-events-none shadow-xs"
                style={{
                  background: 'repeating-linear-gradient(45deg, #FFD6E7, #FFD6E7 10px, #FFE0CC 10px, #FFE0CC 20px)',
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
              <div className="mb-5 sm:mb-6 border-b-2 border-dashed border-[#FFBFD7]/60 pb-3 sm:pb-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-2 pt-2">
                <h2 className="font-['Caveat'] text-3xl xs:text-4xl sm:text-6xl text-[#765563] font-bold tracking-wide">
                  {greeting}
                </h2>
                <span className="text-[10px] sm:text-xs font-['Quicksand'] font-bold text-[#FF85A1] uppercase tracking-wider">
                  central memories · forever
                </span>
              </div>

              {/* Letter Paragraphs in Warm Brown with Generous Spacing */}
              <div className="space-y-3.5 sm:space-y-5 font-serif text-sm xs:text-base sm:text-lg text-[#765563] leading-relaxed tracking-normal">
                {paragraphs.map((p, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {p}
                  </p>
                ))}
              </div>

              {/* Handwritten Signature */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t-2 border-dashed border-[#FFBFD7]/60 flex flex-col items-end">
                <span className="font-['Caveat'] text-2xl xs:text-3xl sm:text-4xl text-[#765563] font-bold tracking-wide">
                  {signature}
                </span>
                <span className="text-[11px] sm:text-xs font-['Quicksand'] text-[#FF85A1] mt-1 font-semibold">
                  forever yours, always ♡
                </span>
              </div>

              {/* Adorable Touch-to-Hug Heart Box */}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t-2 border-dotted border-[#FFBFD7] flex flex-col items-center bg-[#FFD6E7]/35 -mx-5 -mb-5 sm:-mx-10 sm:-mb-10 md:-mx-14 md:-mb-14 p-5 sm:p-8 rounded-b-3xl">
                <p className="text-xs sm:text-sm font-['Quicksand'] font-bold text-[#765563] mb-3 text-center px-2">
                  "Now if you want to hug me, you can touch the heart below ♡"
                </p>

                <button
                  onClick={handleTouchHeart}
                  className="group relative cursor-pointer p-3.5 sm:p-4 rounded-full bg-[#FFF8EF] hover:bg-[#FFD6E7] border-3 border-[#FFBFD7] shadow-[0_6px_20px_rgba(255,191,215,0.8)] hover:scale-115 active:scale-90 transition-all duration-200"
                  title="Touch for a hug! ♡"
                >
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF6584] fill-[#FFD6E7] animate-pulse" />
                  {showHugFeedback && (
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#FF85A1] text-white text-[11px] sm:text-xs font-['Quicksand'] font-bold px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full shadow-lg animate-bounce">
                      bear hug delivered! 💖
                    </span>
                  )}
                </button>

                {hugCount > 0 ? (
                  <span className="mt-2.5 text-xs font-['Quicksand'] font-bold text-[#765563] text-center px-2">
                    {hugCount} {hugCount === 1 ? 'hug' : 'hugs'} sent to you across the distance! ♡
                  </span>
                ) : (
                  <span className="mt-2 text-[11px] font-['Quicksand'] text-[#765563]/60 text-center">
                    tap whenever you need warmth ♡
                  </span>
                )}
              </div>
            </div>

            {/* Transition Prompt to Next Scene: "there's more, come see ♡" */}
            <div className="mt-10 sm:mt-12 flex flex-col items-center">
              <button
                onClick={onNext}
                className="group cursor-pointer px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#FFD6E7] via-[#FFBFD7] to-[#FFE0CC] border-2 border-white text-[#765563] font-['Fredoka'] text-base sm:text-lg shadow-[0_8px_25px_rgba(255,191,215,0.7)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5 max-w-full"
              >
                <span>there's more, come see ♡</span>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
