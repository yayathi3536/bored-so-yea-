import React, { useState } from 'react';
import { InsideJokeItem } from '../../types';
import { Eye, ChevronRight, CheckCircle2, Heart } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

interface SecretsSceneProps {
  insideJokes: InsideJokeItem[];
  onNext: () => void;
}

export const SecretsScene: React.FC<SecretsSceneProps> = ({ insideJokes, onNext }) => {
  const [activeSecretId, setActiveSecretId] = useState<string | null>(null);
  const [guessedIds, setGuessedIds] = useState<Record<string, 'yes' | 'no' | 'peeked'>>({});

  const handleSelectKeepsake = (item: InsideJokeItem) => {
    audioEngine.playChime(1.2);
    setActiveSecretId(item.id);
  };

  const handleGuess = (id: string, response: 'yes' | 'no') => {
    audioEngine.playChime(response === 'yes' ? 1.4 : 1.0);
    setGuessedIds((prev) => ({ ...prev, [id]: response }));
  };

  const handlePeekDirectly = (id: string) => {
    audioEngine.playChime(1.1);
    setGuessedIds((prev) => ({ ...prev, [id]: 'peeked' }));
  };

  const activeJoke = insideJokes.find((j) => j.id === activeSecretId);

  const getKeepsakeColor = (idx: number) => {
    const pastelTints = [
      'bg-[#FFD6E7]/80 border-[#FFBFD7]', // baby pink
      'bg-[#FFE0CC]/80 border-[#FFD6E7]', // peach
      'bg-[#E9DFFF]/80 border-[#DDF1FF]', // lavender
      'bg-[#DFF4E4]/80 border-[#D9E9DE]', // mint
    ];
    return pastelTints[idx % pastelTints.length];
  };

  return (
    <div className="relative min-h-screen w-full px-3 sm:px-4 py-16 sm:py-24 select-none flex flex-col items-center">
      {/* Soft Pastel Ambient Aura */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[750px] aspect-square rounded-full blur-[100px] sm:blur-[140px] bg-gradient-to-tr from-[#E9DFFF]/50 via-[#FFD6E7]/50 to-[#FFE0CC]/40" />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        {/* Section Header */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-[#FFBFD7] bg-[#FFF8EF]/95 backdrop-blur-md mb-2.5 sm:mb-3 shadow-[0_4px_14px_rgba(255,191,215,0.4)]">
          <span className="text-xs sm:text-sm">🧸</span>
          <span className="text-[10px] sm:text-xs font-['Quicksand'] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#765563] font-bold">
            Our Secret Language
          </span>
          <span className="text-xs sm:text-sm">✨</span>
        </div>

        <h2 className="font-['Fredoka'] text-2xl xs:text-3xl sm:text-5xl md:text-6xl text-[#765563] font-semibold tracking-wide text-cute-shadow px-2">
          Keepsakes & Inside Jokes ♡
        </h2>
        <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#FF85A1] font-bold mt-2 sm:mt-3 max-w-md mx-auto px-2">
          "Little whispered moments, code names, and memories that make us smile."
        </p>

        {/* Keepsake Objects Grid */}
        <div className="mt-10 sm:mt-14 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {insideJokes.map((item, idx) => {
            const isRevealed = !!guessedIds[item.id];
            const isSelected = activeSecretId === item.id;
            const tint = getKeepsakeColor(idx);

            return (
              <div
                key={item.id}
                onClick={() => handleSelectKeepsake(item)}
                className={`group relative p-4 sm:p-6 rounded-3xl cursor-pointer transition-all duration-300 transform ${
                  isSelected
                    ? 'bg-[#FFF8EF] border-3 border-[#FF85A1] shadow-[0_12px_32px_rgba(255,163,186,0.6)] scale-102 sm:scale-105'
                    : 'bg-[#FFF8EF]/90 border-2 border-[#FFBFD7] hover:border-[#FF85A1] hover:bg-[#FFF8EF] hover:-translate-y-1.5 shadow-sm'
                } backdrop-blur-md flex flex-col items-center justify-center text-center`}
              >
                {/* Floating symbol in pastel aura */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${tint} border-2 flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:scale-115 group-hover:rotate-6 transition-all duration-300`}
                >
                  <span>{item.symbol}</span>
                </div>

                <h3 className="font-['Fredoka'] text-base sm:text-lg text-[#765563] mt-3 sm:mt-4 font-semibold">
                  {item.title}
                </h3>

                <span className="text-[11px] sm:text-xs font-['Quicksand'] font-bold text-[#765563]/70 mt-1.5 sm:mt-2 flex items-center gap-1">
                  {isRevealed ? (
                    <span className="text-[#FF85A1] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Revealed ♡
                    </span>
                  ) : (
                    <span>Tap to unlock secret ✨</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Active Keepsake Guessing & Revelation Area */}
        {activeJoke && (
          <div className="mt-10 sm:mt-12 p-4 sm:p-7 md:p-9 rounded-3xl bg-[#FFF8EF] border-3 border-[#FFBFD7] shadow-[0_15px_40px_rgba(255,191,215,0.4)] text-left max-w-2xl mx-auto animate-fadeIn text-[#765563]">
            <div className="flex items-center justify-between gap-2 pb-3 sm:pb-4 border-b-2 border-[#FFBFD7]/40">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-2xl sm:text-3xl animate-bounce">{activeJoke.symbol}</span>
                <div>
                  <h4 className="font-['Fredoka'] text-lg sm:text-2xl text-[#765563] font-semibold">
                    {activeJoke.title}
                  </h4>
                  <span className="text-[10px] sm:text-xs text-[#FF85A1] font-['Quicksand'] font-bold">Inside Mystery ♡</span>
                </div>
              </div>
              <button
                onClick={() => setActiveSecretId(null)}
                className="text-xs text-[#765563] hover:text-[#FF85A1] cursor-pointer font-['Quicksand'] font-bold px-3 py-1 rounded-full hover:bg-[#FFD6E7]/50 transition-colors border border-[#FFBFD7] shrink-0"
              >
                Close
              </button>
            </div>

            {/* Clue Prompt */}
            <div className="mt-4 sm:mt-5">
              <span className="text-[10px] sm:text-xs font-['Quicksand'] font-bold uppercase tracking-wider text-[#FF85A1]">
                The Clue:
              </span>
              <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#765563] font-bold mt-1 leading-snug">
                "{activeJoke.clue}"
              </p>
            </div>

            {/* Guessing Buttons or Revealed Content */}
            {!guessedIds[activeJoke.id] ? (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-[#FFBFD7]/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <p className="text-xs font-['Quicksand'] font-bold text-[#765563]/80 text-center sm:text-left">Do you remember what this means? ♡</p>
                <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => handleGuess(activeJoke.id, 'yes')}
                    className="px-3.5 sm:px-4 py-2 rounded-full bg-[#DFF4E4] hover:bg-[#cbf0d3] border-2 border-[#b5e7c2] text-[#765563] text-xs font-['Quicksand'] font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95 shadow-xs text-center"
                  >
                    Yes, I remember! ♡
                  </button>
                  <button
                    onClick={() => handlePeekDirectly(activeJoke.id)}
                    className="px-3.5 sm:px-4 py-2 rounded-full bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border-2 border-[#FFA3BA] text-[#765563] text-xs font-['Quicksand'] font-bold cursor-pointer transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Reveal mystery</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Heartwarming Revelation in Pastel Box */
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-6 border-t-2 border-[#FFBFD7]/40 space-y-3.5 sm:space-y-4 animate-fadeIn">
                <div className="bg-[#FFE0CC]/40 p-3.5 sm:p-5 rounded-2xl border-2 border-[#FFBFD7]/70 shadow-inner">
                  <span className="text-[10px] sm:text-xs font-['Quicksand'] uppercase tracking-wider text-[#FF85A1] font-bold">
                    The Memory:
                  </span>
                  <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#765563] mt-1 leading-relaxed font-bold">
                    {activeJoke.revelation}
                  </p>
                </div>

                {activeJoke.personalNote && (
                  <p className="font-['Caveat'] text-xl sm:text-2xl text-[#FF85A1] font-bold px-1">
                    "{activeJoke.personalNote}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Transition to next scene */}
        <div className="mt-14 sm:mt-20 flex flex-col items-center px-2">
          <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#FF85A1] font-bold mb-3 sm:mb-4">
            "Now let me take you to our treasure box of letters..."
          </p>
          <button
            onClick={onNext}
            className="group cursor-pointer px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#FFD6E7] via-[#FFBFD7] to-[#FFE0CC] border-2 border-white text-[#765563] hover:shadow-[0_10px_28px_rgba(255,191,215,0.7)] shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 font-['Fredoka'] text-base sm:text-lg font-medium max-w-full"
          >
            <span>Open our Letter Box 💌</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1.5 transition-transform shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};
