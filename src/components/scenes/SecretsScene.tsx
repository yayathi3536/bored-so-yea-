import React, { useState } from 'react';
import { InsideJokeItem } from '../../types';
import { ChevronRight, CheckCircle2, Heart, Sparkles, X, Lock, Unlock } from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { FloatingHeartButton } from '../FloatingHeartButton';

interface SecretsSceneProps {
  insideJokes: InsideJokeItem[];
  onNext: () => void;
}

export const SecretsScene: React.FC<SecretsSceneProps> = ({ insideJokes, onNext }) => {
  const [activeSecretId, setActiveSecretId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});

  const handleSelectKeepsake = (item: InsideJokeItem) => {
    audioEngine.playChime(1.2);
    setActiveSecretId(item.id);
  };

  const handleUnlockSecret = (id: string) => {
    audioEngine.playChime(1.4);
    audioEngine.playPaperRustle();
    setRevealedIds((prev) => ({ ...prev, [id]: true }));
  };

  const activeJoke = insideJokes.find((j) => j.id === activeSecretId);

  const getKeepsakeColor = (idx: number) => {
    const pastelTints = [
      { bg: 'bg-[#F8C8DC]/70 border-[#F8C8DC]', tag: 'bg-[#F8C8DC]', accent: 'text-[#E99AB5]' }, // blush pink
      { bg: 'bg-[#FFD8C2]/70 border-[#FFD8C2]', tag: 'bg-[#FFD8C2]', accent: 'text-[#E99AB5]' }, // peach
      { bg: 'bg-[#E6DDF5]/70 border-[#E6DDF5]', tag: 'bg-[#E6DDF5]', accent: 'text-[#A78BFA]' }, // lavender
      { bg: 'bg-[#FFF0B3]/70 border-[#FFF0B3]', tag: 'bg-[#FFF0B3]', accent: 'text-[#D97706]' }, // butter yellow
    ];
    return pastelTints[idx % pastelTints.length];
  };

  return (
    <div className="relative min-h-screen w-full px-3 sm:px-6 py-20 sm:py-28 select-none flex flex-col items-center overflow-hidden">
      {/* Background Paper Texture & Ambient Glow */}
      <div className="absolute inset-0 paper-texture opacity-75 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[800px] aspect-square rounded-full blur-[140px] bg-gradient-to-tr from-[#E6DDF5]/55 via-[#F8C8DC]/50 to-[#FFF0B3]/45" />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        {/* Section Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#F8C8DC] bg-[#FFF8F0]/95 backdrop-blur-md mb-3 shadow-[0_4px_16px_rgba(248,200,220,0.45)]">
          <span className="text-xs sm:text-sm">🧸</span>
          <span className="text-[11px] sm:text-xs font-['Quicksand'] uppercase tracking-[0.22em] text-[#765563] font-bold">
            Our Secret Language & Keepsakes
          </span>
          <span className="text-xs sm:text-sm">✨</span>
        </div>

        <h2 className="font-['Fredoka'] text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-[#765563] font-semibold tracking-wide text-cute-shadow px-2">
          Whispers & Inside Jokes ♡
        </h2>
        <p className="font-['Caveat'] text-2xl xs:text-3xl sm:text-4xl text-[#E99AB5] font-bold mt-2 sm:mt-3 max-w-lg mx-auto px-2">
          "Little whispered moments, code names, and reasons you make my world glow."
        </p>

        {/* Keepsake Objects Grid */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {insideJokes.map((item, idx) => {
            const isRevealed = Boolean(revealedIds[item.id]);
            const isSelected = activeSecretId === item.id;
            const theme = getKeepsakeColor(idx);

            return (
              <div
                key={item.id}
                onClick={() => handleSelectKeepsake(item)}
                className={`group relative p-5 sm:p-6 rounded-3xl cursor-pointer transition-all duration-300 transform ${
                  isSelected
                    ? 'bg-[#FFF8F0] border-3 border-[#E99AB5] shadow-[0_14px_36px_rgba(233,154,181,0.65)] scale-103'
                    : 'bg-[#FFF8F0]/95 border-2 border-[#F8C8DC] hover:border-[#E99AB5] hover:bg-[#FFF8F0] hover:-translate-y-1.5 polaroid-shadow'
                } backdrop-blur-md flex flex-col items-center justify-center text-center`}
              >
                {/* Cute Washi Corner Tape */}
                <div
                  className="absolute -top-2 left-6 w-14 h-4 opacity-80 pointer-events-none"
                  style={{
                    background: idx % 2 === 0 ? '#F8C8DC' : '#FFF0B3',
                    transform: 'rotate(-4deg)',
                  }}
                />

                {/* Floating symbol in pastel aura */}
                <div
                  className={`w-15 h-15 sm:w-16 sm:h-16 rounded-2xl ${theme.bg} border-2 flex items-center justify-center text-3xl shadow-xs group-hover:scale-115 group-hover:rotate-6 transition-all duration-300 mt-1`}
                >
                  <span>{item.symbol}</span>
                </div>

                <h3 className="font-['Fredoka'] text-base sm:text-lg text-[#765563] mt-3 sm:mt-4 font-semibold leading-snug">
                  {item.title}
                </h3>

                <div className="mt-2 text-[11px] sm:text-xs font-['Quicksand'] font-bold text-[#765563]/75 flex items-center gap-1">
                  {isRevealed ? (
                    <span className="text-[#E99AB5] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unlocked ♡
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#E99AB5]" />
                      Tap to reveal ✨
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active Keepsake Guessing & Revelation Area */}
        {activeJoke && (
          <div className="mt-10 sm:mt-12 p-5 sm:p-8 md:p-10 rounded-3xl bg-[#FFF8F0] border-3 border-[#F8C8DC] shadow-[0_18px_45px_rgba(248,200,220,0.5)] text-left max-w-2xl mx-auto animate-fadeIn text-[#765563] relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 pb-4 border-b-2 border-[#F8C8DC]/60">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl animate-bounce">{activeJoke.symbol}</span>
                <div>
                  <h4 className="font-['Fredoka'] text-xl sm:text-2xl text-[#765563] font-semibold">
                    {activeJoke.title}
                  </h4>
                  <span className="text-[11px] sm:text-xs text-[#E99AB5] font-['Quicksand'] font-bold">
                    Special Keepsake Mystery ♡
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveSecretId(null)}
                className="text-xs text-[#765563] hover:text-[#E99AB5] cursor-pointer font-['Quicksand'] font-bold px-3 py-1 rounded-full hover:bg-[#F8C8DC]/50 transition-colors border border-[#F8C8DC] shrink-0"
              >
                Close
              </button>
            </div>

            {/* Clue Prompt */}
            <div className="mt-5">
              <span className="text-[11px] sm:text-xs font-['Quicksand'] font-bold uppercase tracking-wider text-[#E99AB5]">
                The Memory Clue:
              </span>
              <p className="font-['Caveat'] text-2xl xs:text-3xl text-[#765563] font-bold mt-1 leading-snug">
                "{activeJoke.clue}"
              </p>
            </div>

            {/* Unlock Button or Revelation */}
            {!revealedIds[activeJoke.id] ? (
              <div className="mt-6 flex flex-col items-center p-6 rounded-2xl bg-[#F8C8DC]/20 border-2 border-dashed border-[#F8C8DC] text-center">
                <p className="text-xs font-['Quicksand'] font-bold text-[#765563] mb-3">
                  Do you remember the secret behind this moment? ♡
                </p>
                <button
                  onClick={() => handleUnlockSecret(activeJoke.id)}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#F8C8DC] to-[#FFD8C2] border-2 border-white text-[#765563] font-['Fredoka'] text-sm tracking-wide shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 font-medium"
                >
                  <Unlock className="w-4 h-4 text-[#765563]" />
                  <span>Reveal Secret Revelation ✨</span>
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4 animate-fadeIn">
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF0B3]/35 border-2 border-[#FFF0B3]">
                  <span className="text-[10px] sm:text-xs font-['Quicksand'] font-bold uppercase tracking-wider text-[#D97706]">
                    The Answer:
                  </span>
                  <p className="font-['Fredoka'] text-base sm:text-lg text-[#765563] font-medium mt-1">
                    {activeJoke.revelation}
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-[#E6DDF5]/40 border-2 border-[#E6DDF5]">
                  <span className="text-[10px] sm:text-xs font-['Quicksand'] font-bold uppercase tracking-wider text-[#A78BFA]">
                    Yayathi's Personal Note:
                  </span>
                  <p className="font-['Caveat'] text-2xl sm:text-3xl text-[#765563] font-bold mt-1 leading-relaxed">
                    "{activeJoke.personalNote}"
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transition to next scene */}
        <div className="mt-14 sm:mt-20 text-center flex flex-col items-center px-2">
          <p className="font-['Caveat'] text-2xl xs:text-3xl text-[#E99AB5] font-bold mb-3 sm:mb-4">
            "Now step into the treasure box of letters for every kind of day..."
          </p>
          <FloatingHeartButton
            onClick={onNext}
            className="group cursor-pointer px-6 sm:px-9 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] border-2 border-white text-[#765563] hover:shadow-[0_10px_28px_rgba(248,200,220,0.7)] shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 font-['Fredoka'] text-sm xs:text-base sm:text-lg font-medium max-w-full"
          >
            <span>Open Treasure Box of Letters 💌</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1.5 transition-transform shrink-0" />
          </FloatingHeartButton>
        </div>
      </div>
    </div>
  );
};
