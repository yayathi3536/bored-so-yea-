import React, { useState } from 'react';
import { MemoryItem } from '../../types';
import { Heart, X, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

interface ScrapbookSceneProps {
  memories: MemoryItem[];
  onNext: () => void;
}

export const ScrapbookScene: React.FC<ScrapbookSceneProps> = ({ memories, onNext }) => {
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);

  const handleOpenDetail = (mem: MemoryItem) => {
    audioEngine.playPaperRustle();
    audioEngine.playChime(1.2);
    setSelectedMemory(mem);
  };

  const handleCloseDetail = () => {
    setSelectedMemory(null);
  };

  // Cute washi tape patterns for scrapbook cards
  const washiTapes = [
    {
      bg: 'repeating-linear-gradient(45deg, rgba(255, 214, 231, 0.9), rgba(255, 214, 231, 0.9) 8px, rgba(255, 191, 215, 0.9) 8px, rgba(255, 191, 215, 0.9) 16px)',
      angle: -2,
      sticker: '🎀',
    },
    {
      bg: 'repeating-linear-gradient(-45deg, rgba(233, 223, 255, 0.9), rgba(233, 223, 255, 0.9) 8px, rgba(255, 224, 204, 0.9) 8px, rgba(255, 224, 204, 0.9) 16px)',
      angle: 2.5,
      sticker: '🍓',
    },
    {
      bg: 'repeating-linear-gradient(45deg, rgba(221, 241, 255, 0.9), rgba(221, 241, 255, 0.9) 8px, rgba(255, 214, 231, 0.9) 8px, rgba(255, 214, 231, 0.9) 16px)',
      angle: -1.5,
      sticker: '🌸',
    },
    {
      bg: 'repeating-linear-gradient(-45deg, rgba(223, 244, 228, 0.9), rgba(223, 244, 228, 0.9) 8px, rgba(255, 248, 239, 0.9) 8px, rgba(255, 248, 239, 0.9) 16px)',
      angle: 1.8,
      sticker: '✨',
    },
  ];

  return (
    <div className="relative min-h-screen w-full px-4 py-24 select-none">
      {/* Soft Pastel Ambient Aura */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[850px] h-[750px] rounded-full blur-[140px] bg-gradient-to-tr from-[#FFD6E7]/60 via-[#FFE0CC]/50 to-[#E9DFFF]/45" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-[#FFBFD7] bg-[#FFF8EF]/95 backdrop-blur-md mb-2.5 sm:mb-3 shadow-[0_4px_14px_rgba(255,191,215,0.4)]">
            <span className="text-xs sm:text-sm">🎀</span>
            <span className="text-[10px] sm:text-xs font-['Quicksand'] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#765563] font-bold">
              Cherished Chapters
            </span>
            <span className="text-xs sm:text-sm">🌸</span>
          </div>

          <h2 className="font-['Fredoka'] text-2xl xs:text-3xl sm:text-5xl md:text-6xl text-[#765563] font-semibold tracking-wide text-cute-shadow px-2">
            Our Scrapbook Memories ♡
          </h2>
          <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#FF85A1] font-bold mt-2 sm:mt-3 max-w-lg mx-auto px-2">
            "Every snapshot is a quiet anchor holding our love in the stream of time."
          </p>
        </div>

        {/* Empty state safeguard */}
        {memories.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl border-2 border-[#FFBFD7] bg-[#FFF8EF]/90 backdrop-blur-md max-w-md mx-auto shadow-md">
            <span className="text-3xl">🎀</span>
            <p className="font-['Fredoka'] text-[#765563] text-lg sm:text-xl mt-2">No personal memories added yet.</p>
            <p className="text-xs text-[#765563]/80 mt-2 font-['Quicksand']">
              You can add your own photographs, dates, and stories anytime.
            </p>
          </div>
        ) : (
          /* Hand-arranged Polaroid Scrapbook Grid (Collision-free layout) */
          <div className="relative py-2 sm:py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-14 lg:gap-16 max-w-4xl mx-auto">
              {memories.map((mem, index) => {
                const tape = washiTapes[index % washiTapes.length];
                const defaultRotation = index % 2 === 0 ? -2.2 : 2.2;
                const rotation = mem.rotationDeg ?? defaultRotation;

                return (
                  <div
                    key={mem.id}
                    className="flex justify-center items-center px-1"
                  >
                    {/* Handcrafted Polaroid Card */}
                    <div
                      onClick={() => handleOpenDetail(mem)}
                      className="group cursor-pointer w-full max-w-[290px] xs:max-w-sm transition-all duration-300 hover:z-30"
                      style={{
                        transform: `rotate(${rotation * 0.5}deg)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'rotate(0deg) scale(1.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = `rotate(${rotation * 0.5}deg) scale(1)`;
                      }}
                    >
                      <div className="relative bg-[#FFF8EF] p-3.5 pb-5 sm:p-4 sm:pb-6 rounded-2xl shadow-[0_12px_32px_rgba(255,191,215,0.45),0_2px_8px_rgba(118,85,99,0.08)] border-2 border-[#FFBFD7] group-hover:border-[#FF85A1] group-hover:shadow-[0_16px_40px_rgba(255,163,186,0.65)] transition-all duration-300 flex flex-col items-center">
                        {/* Decorative Pastel Washi Tape at Top */}
                        <div
                          className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 h-7 opacity-90 pointer-events-none shadow-xs border border-white/60"
                          style={{
                            background: tape.bg,
                            transform: `translateX(-50%) rotate(${tape.angle}deg)`,
                            clipPath: 'polygon(5% 0%, 95% 0%, 100% 100%, 0% 100%)',
                          }}
                        />

                        {/* Cute Sticker in Corner */}
                        <div className="absolute top-2 right-2.5 text-lg select-none pointer-events-none group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300">
                          {tape.sticker}
                        </div>

                        {/* Photo Container */}
                        <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#FFE0CC]/30 border border-[#FFBFD7]/70 shadow-inner mt-1">
                          {mem.imageUrl ? (
                            <img
                              src={mem.imageUrl}
                              alt={mem.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8EF] via-[#FFD6E7]/50 to-[#FFE0CC]/40 p-6 text-center">
                              <span className="text-3xl mb-1">🌸</span>
                              <span className="text-base font-['Fredoka'] text-[#765563]">
                                {mem.title}
                              </span>
                              <span className="text-xs text-[#FF85A1] font-['Quicksand'] font-bold mt-1">
                                Cherished Memory
                              </span>
                            </div>
                          )}

                          {/* Subtle warm sunlight sheen */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-[#FFE0CC]/20 via-transparent to-[#FFD6E7]/20 pointer-events-none" />
                        </div>

                        {/* Caption & Clean Button Area (Self-contained, zero collision) */}
                        <div className="w-full mt-4 flex flex-col items-center text-center px-1">
                          {/* Handwritten Title Caption in Caveat */}
                          <h3 className="font-['Caveat'] text-2xl sm:text-3xl text-[#765563] font-bold tracking-wide leading-tight">
                            {mem.title}
                          </h3>

                          {/* Read Story Pill Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(mem);
                            }}
                            className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] border border-[#FFA3BA] text-[#765563] font-['Quicksand'] font-bold text-xs tracking-wider shadow-xs hover:shadow-[0_4px_12px_rgba(255,163,186,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          >
                            <span>Read our story</span>
                            <Heart className="w-3.5 h-3.5 text-[#FF6584] fill-[#FF6584]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Transition to next scene */}
        <div className="mt-14 sm:mt-20 text-center flex flex-col items-center px-2">
          <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#FF85A1] font-bold mb-3 sm:mb-4">
            "Now discover the little keepsakes and whispered jokes we share..."
          </p>
          <button
            onClick={onNext}
            className="group cursor-pointer px-5 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#FFD6E7] via-[#FFBFD7] to-[#FFE0CC] border-2 border-white text-[#765563] hover:shadow-[0_10px_28px_rgba(255,191,215,0.7)] shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 font-['Fredoka'] text-sm xs:text-base sm:text-lg font-medium max-w-full"
          >
            <span>Open our keepsakes & inside jokes 🎀</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1.5 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      {/* Memory Detail Modal Lightbox in Cute Pastel */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#765563]/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[88vh] overflow-y-auto bg-[#FFF8EF] border-3 border-[#FFBFD7] rounded-3xl shadow-[0_20px_50px_rgba(255,163,186,0.35)] p-5 sm:p-8 text-[#765563]">
            {/* Close Button */}
            <button
              onClick={handleCloseDetail}
              className="absolute top-3.5 right-3.5 text-[#765563] hover:text-[#FF85A1] p-1.5 sm:p-2 rounded-full hover:bg-[#FFD6E7]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo Preview */}
            {selectedMemory.imageUrl && (
              <div className="mb-4 sm:mb-5 rounded-2xl overflow-hidden aspect-[16/9] border-2 border-[#FFBFD7]/60 shadow-sm bg-[#FFE0CC]/30">
                <img
                  src={selectedMemory.imageUrl}
                  alt={selectedMemory.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <span className="text-xs sm:text-sm">🌸</span>
              <span className="text-[10px] sm:text-xs font-['Quicksand'] uppercase tracking-widest text-[#FF85A1] font-bold">
                Special Memory
              </span>
            </div>

            <h3 className="font-['Fredoka'] text-xl xs:text-2xl sm:text-3xl text-[#765563] font-semibold pr-8">
              {selectedMemory.title}
            </h3>

            {/* Description in modal */}
            <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t-2 border-[#FFBFD7]/40">
              <p className="font-['Caveat'] text-xl sm:text-2xl text-[#765563] leading-relaxed whitespace-pre-line">
                {selectedMemory.description}
              </p>
            </div>

            <div className="mt-5 sm:mt-6 flex justify-end">
              <button
                onClick={handleCloseDetail}
                className="px-5 sm:px-6 py-2 rounded-full bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] border border-[#FFA3BA] text-[#765563] text-xs font-['Quicksand'] font-bold tracking-wide cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-xs flex items-center gap-1.5"
              >
                <span>Close Memory ♡</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
