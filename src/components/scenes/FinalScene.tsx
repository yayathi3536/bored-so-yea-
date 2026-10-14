import React, { useState, useEffect } from 'react';
import { Sparkles, Heart, RotateCcw } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

interface FinalSceneProps {
  finalLetter: {
    title: string;
    paragraphs: string[];
    constellationName: string;
    finalWords: string;
  };
  recipientName: string;
  senderName: string;
  onRevisitFirst: () => void;
}

export const FinalScene: React.FC<FinalSceneProps> = ({
  finalLetter,
  recipientName,
  senderName,
  onRevisitFirst,
}) => {
  const [showSunsetIntro, setShowSunsetIntro] = useState(false);
  const [showEnvelope, setShowEnvelope] = useState(false);
  const [isFinalOpened, setIsFinalOpened] = useState(false);
  const [goldenGlow, setGoldenGlow] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setShowSunsetIntro(true);
      audioEngine.playChime(1.15);
    }, 600);

    const t2 = setTimeout(() => {
      setShowEnvelope(true);
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleOpenFinalLetter = () => {
    audioEngine.playPaperRustle();
    audioEngine.playChime(1.3);
    setIsFinalOpened(true);
    setTimeout(() => {
      setGoldenGlow(true);
    }, 800);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-3 sm:px-4 py-16 sm:py-24 select-none overflow-hidden">
      {/* Soft Pastel Sunset Cloud Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[850px] aspect-square rounded-full blur-[100px] sm:blur-[150px] bg-gradient-to-tr from-[#FFE0CC]/70 via-[#E9DFFF]/60 to-[#FFD6E7]/70" />
        <div className="absolute top-1/3 left-1/4 w-[50vw] max-w-[500px] aspect-square rounded-full blur-[80px] sm:blur-[110px] bg-[#DFF4E4]/40" />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] max-w-[500px] aspect-square rounded-full blur-[80px] sm:blur-[110px] bg-[#FFF8EF]/90" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-20 max-w-2xl w-full text-center">
        {/* Intro Sunset Header */}
        <div
          className={`transition-all duration-1000 transform ${
            showSunsetIntro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-[#FFBFD7] bg-[#FFF8EF]/95 backdrop-blur-md shadow-[0_4px_14px_rgba(255,191,215,0.4)] mb-2.5 sm:mb-3">
            <span className="text-xs sm:text-sm">🌅</span>
            <span className="text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.25em] font-['Quicksand'] text-[#765563] font-bold">
              Pastel Sunset & Eternity
            </span>
            <span className="text-xs sm:text-sm">🌸</span>
          </div>
          <h2 className="font-['Fredoka'] text-2xl xs:text-3xl sm:text-5xl text-[#765563] font-semibold tracking-wide text-cute-shadow px-2">
            Under the Soft Evening Sky ♡
          </h2>
          <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#FF85A1] font-bold mt-2 px-2">
            "For my {recipientName}, across every tomorrow."
          </p>
        </div>

        {/* The Final Keepsake Envelope (if not opened yet) */}
        {!isFinalOpened ? (
          <div
            className={`mt-10 sm:mt-12 flex flex-col items-center transition-all duration-1000 transform ${
              showEnvelope ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div
              onClick={handleOpenFinalLetter}
              className="group relative w-[260px] xs:w-72 sm:w-84 h-42 xs:h-48 sm:h-54 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 animate-cute-float"
              title="Click to unseal our final letter"
            >
              {/* Outer Glow */}
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-[#FFE0CC] via-[#FFD6E7] to-[#E9DFFF] rounded-3xl blur-lg sm:blur-xl group-hover:blur-2xl opacity-80 transition-all duration-300" />

              {/* Envelope Body */}
              <div className="relative w-full h-full rounded-3xl bg-gradient-to-b from-[#FFF8EF] via-[#FFD6E7]/30 to-[#FFE0CC]/30 border-3 border-[#FFBFD7] shadow-[0_15px_35px_rgba(255,191,215,0.5)] flex items-center justify-center overflow-hidden">
                {/* Ribbon */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-7 sm:h-8 bg-gradient-to-r from-[#FFD6E7] via-[#FFE0CC] to-[#FFD6E7] border-y border-[#FFBFD7]" />

                {/* Wax Seal */}
                <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#FFD6E7] to-[#FF85A1] border-3 border-white shadow-md flex items-center justify-center group-hover:scale-115 transition-transform">
                  <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white animate-pulse" />
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenFinalLetter}
              className="mt-6 text-xs font-['Quicksand'] font-bold tracking-wider uppercase text-[#765563] flex items-center gap-2 bg-[#FFF8EF] px-5 py-2 rounded-full border-2 border-[#FFBFD7] shadow-xs cursor-pointer hover:border-[#FF85A1] hover:scale-105 transition-transform"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF85A1]" />
              Tap to open the final surprise 🎀
            </button>
          </div>
        ) : (
          /* The Final Letter on Warm Ivory Paper */
          <div
            className={`mt-8 sm:mt-10 p-5 sm:p-10 md:p-14 rounded-3xl bg-[#FFF8EF] border-3 border-[#FFBFD7] shadow-[0_20px_50px_rgba(255,163,186,0.35)] transition-all duration-1000 transform animate-fadeIn text-[#765563] ${
              goldenGlow ? 'shadow-[0_25px_60px_rgba(255,163,186,0.5)]' : ''
            }`}
          >
            <div className="text-center mb-5 sm:mb-6">
              <span className="text-[10px] sm:text-xs font-['Quicksand'] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#FF85A1] font-bold">
                Our Little Universe · Eternal Chapter ♡
              </span>
              <h3 className="font-['Fredoka'] text-2xl xs:text-3xl sm:text-4xl text-[#765563] font-semibold mt-1.5 sm:mt-2 tracking-wide text-cute-shadow">
                {finalLetter.title}
              </h3>
            </div>

            <div className="space-y-3.5 sm:space-y-4 font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#765563] leading-relaxed text-left font-bold">
              {finalLetter.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t-2 border-[#FFBFD7]/40 flex flex-col items-center">
              <span className="font-['Caveat'] text-2xl xs:text-3xl sm:text-4xl text-[#FF85A1] font-bold tracking-wide">
                {finalLetter.finalWords}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#765563]/80 font-['Quicksand'] font-bold mt-2">
                <Sparkles className="w-3.5 h-3.5 text-[#FF85A1]" />
                <span>Written with love, forever and always 🌸</span>
              </div>
            </div>
          </div>
        )}

        {/* Quiet meaningful return button */}
        <div className="mt-10 sm:mt-14 flex items-center justify-center gap-4">
          <button
            onClick={onRevisitFirst}
            className="cursor-pointer px-5 sm:px-6 py-2.5 rounded-full bg-[#FFF8EF] hover:bg-white border-2 border-[#FFBFD7] text-[#765563] text-xs font-['Quicksand'] font-bold tracking-wide transition-all flex items-center gap-2 shadow-xs hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#FF85A1]" />
            <span>Revisit from the beginning ♡</span>
          </button>
        </div>
      </div>
    </div>
  );
};
