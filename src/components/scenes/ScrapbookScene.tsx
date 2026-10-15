import React, { useState } from 'react';
import { MemoryItem } from '../../types';
import { Heart, X, ChevronRight, Sparkles, BookOpen, Calendar, MapPin, Tag } from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { resolveAssetUrl } from '../../utils/assetPath';
import { FloatingHeartButton } from '../FloatingHeartButton';

interface ScrapbookSceneProps {
  memories: MemoryItem[];
  onNext: () => void;
}

export const ScrapbookScene: React.FC<ScrapbookSceneProps> = ({ memories, onNext }) => {
  const [selectedMemory, setSelectedMemory] = useState<MemoryItem | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites'>('all');
  const [lovedMemories, setLovedMemories] = useState<Record<string, boolean>>({});

  const handleOpenDetail = (mem: MemoryItem) => {
    audioEngine.playPaperRustle();
    audioEngine.playChime(1.2);
    setSelectedMemory(mem);
  };

  const handleCloseDetail = () => {
    setSelectedMemory(null);
  };

  const toggleLoveMemory = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    audioEngine.playHeartPulse();
    setLovedMemories((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderMemoryVisual = (mem: MemoryItem, isModal = false) => {
    const hasValidImage = Boolean(mem.imageUrl && !failedImages[mem.id]);

    if (hasValidImage) {
      return (
        <img
          src={resolveAssetUrl(mem.imageUrl)}
          alt={mem.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          onError={() => {
            setFailedImages((prev) => ({ ...prev, [mem.id]: true }));
          }}
        />
      );
    }

    // Handcrafted romantic illustrations when custom image is not yet uploaded
    if (mem.id === 'mem-1' || mem.title.toLowerCase().includes('central')) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFD8C2] via-[#FFF8F0] to-[#F8C8DC] p-4 text-center select-none relative overflow-hidden">
          <div className="absolute inset-0 paper-texture opacity-60" />
          <span className="text-4xl sm:text-5xl mb-2 animate-gentle-bounce drop-shadow-sm">📍</span>
          <span className="text-base sm:text-xl font-['Fredoka'] text-[#765563] font-semibold tracking-wide">
            Central · 4:30 PM
          </span>
          <span className="text-xs text-[#E99AB5] font-['Quicksand'] font-bold mt-1 tracking-widest uppercase">
            Where the spark begun ✨
          </span>
          <div className="mt-2 text-xs font-['Caveat'] text-[#765563]/80">
            "Your face, your voice, your words..."
          </div>
        </div>
      );
    }

    if (
      mem.id === 'mem-2' ||
      mem.title.toLowerCase().includes('infatuation') ||
      mem.title.toLowerCase().includes('late-night')
    ) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#E6DDF5] via-[#FFF8F0] to-[#F8C8DC] p-4 text-center select-none relative overflow-hidden">
          <div className="absolute inset-0 paper-texture opacity-60" />
          <div className="flex items-center gap-2 mb-2 text-3xl sm:text-4xl">
            <span className="animate-gentle-bounce">🌙</span>
            <span className="text-base">✨</span>
            <span className="animate-gentle-bounce">⭐</span>
          </div>
          <span className="text-base sm:text-xl font-['Fredoka'] text-[#765563] font-semibold tracking-wide">
            Under Quiet Stars
          </span>
          <span className="text-xs text-[#A78BFA] font-['Quicksand'] font-bold mt-1 tracking-widest uppercase">
            Endless Late-Night Whispers ♡
          </span>
        </div>
      );
    }

    if (
      mem.id === 'mem-3' ||
      mem.title.toLowerCase().includes('storm') ||
      mem.title.toLowerCase().includes('stronger')
    ) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF0B3] via-[#FFF8F0] to-[#F8C8DC] p-4 text-center select-none relative overflow-hidden">
          <div className="absolute inset-0 paper-texture opacity-60" />
          <div className="flex items-center gap-2 mb-2 text-3xl sm:text-4xl">
            <span className="animate-gentle-bounce">🌈</span>
            <span className="text-2xl">🌸</span>
          </div>
          <span className="text-base sm:text-xl font-['Fredoka'] text-[#765563] font-semibold tracking-wide">
            Through Every Storm
          </span>
          <span className="text-xs text-[#E99AB5] font-['Quicksand'] font-bold mt-1 tracking-widest uppercase">
            Unbreakable Bond 🎀
          </span>
        </div>
      );
    }

    if (
      mem.id === 'mem-4' ||
      mem.title.toLowerCase().includes('hug') ||
      mem.title.toLowerCase().includes('comfort')
    ) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F8C8DC] via-[#FFF8F0] to-[#FFD8C2] p-4 text-center select-none relative overflow-hidden">
          <div className="absolute inset-0 paper-texture opacity-60" />
          <div className="flex items-center gap-2 mb-2 text-3xl sm:text-4xl">
            <span className="animate-gentle-bounce">🧸</span>
            <span className="text-2xl">💕</span>
          </div>
          <span className="text-base sm:text-xl font-['Fredoka'] text-[#765563] font-semibold tracking-wide">
            Safe In My Arms
          </span>
          <span className="text-xs text-[#E99AB5] font-['Quicksand'] font-bold mt-1 tracking-widest uppercase">
            Warmest Bear Hugs ♡
          </span>
        </div>
      );
    }

    // Default custom memory illustration
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8F0] via-[#F8C8DC]/40 to-[#FFF0B3]/40 p-4 text-center select-none relative overflow-hidden">
        <span className="text-4xl mb-2 animate-gentle-bounce">🌸</span>
        <span className="text-base font-['Fredoka'] text-[#765563] font-semibold">
          {mem.title}
        </span>
        <span className="text-xs text-[#E99AB5] font-['Quicksand'] font-bold mt-1 tracking-wider uppercase">
          Cherished Memory
        </span>
      </div>
    );
  };

  // Cute washi tapes and scrapbook stickers
  const washiTapes = [
    {
      bg: 'repeating-linear-gradient(45deg, #F8C8DC, #F8C8DC 8px, #FFF8F0 8px, #FFF8F0 16px)',
      angle: -3,
      sticker: '🎀',
    },
    {
      bg: 'repeating-linear-gradient(-45deg, #E6DDF5, #E6DDF5 8px, #FFD8C2 8px, #FFD8C2 16px)',
      angle: 2.5,
      sticker: '🍓',
    },
    {
      bg: 'repeating-linear-gradient(45deg, #FFF0B3, #FFF0B3 8px, #F8C8DC 8px, #F8C8DC 16px)',
      angle: -2,
      sticker: '🌸',
    },
    {
      bg: 'repeating-linear-gradient(-45deg, #FFD8C2, #FFD8C2 8px, #FFF8F0 8px, #FFF8F0 16px)',
      angle: 3,
      sticker: '✨',
    },
  ];

  return (
    <div className="relative min-h-screen w-full px-3 sm:px-6 py-20 sm:py-28 select-none overflow-hidden">
      {/* Background Paper Texture & Ambient Glows */}
      <div className="absolute inset-0 paper-texture opacity-75 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[90vw] max-w-[850px] aspect-square rounded-full blur-[140px] bg-gradient-to-tr from-[#F8C8DC]/60 via-[#FFF0B3]/45 to-[#E6DDF5]/45" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#F8C8DC] bg-[#FFF8F0]/95 backdrop-blur-md mb-3 shadow-[0_4px_16px_rgba(248,200,220,0.45)]">
            <span className="text-xs sm:text-sm">📷</span>
            <span className="text-[11px] sm:text-xs font-['Quicksand'] uppercase tracking-[0.22em] text-[#765563] font-bold">
              Our Handmade Love Scrapbook
            </span>
            <span className="text-xs sm:text-sm">🎀</span>
          </div>

          <h2 className="font-['Fredoka'] text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-[#765563] font-semibold tracking-wide text-cute-shadow px-2">
            Memories Taped With Love ♡
          </h2>
          <p className="font-['Caveat'] text-2xl xs:text-3xl sm:text-4xl text-[#E99AB5] font-bold mt-2 sm:mt-3 max-w-xl mx-auto px-2">
            "Every snapshot is a quiet anchor holding our love in the stream of time."
          </p>
        </div>

        {/* Empty state safeguard */}
        {memories.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-3xl border-3 border-[#F8C8DC] bg-[#FFF8F0]/95 backdrop-blur-md max-w-md mx-auto shadow-md">
            <span className="text-4xl">🎀</span>
            <p className="font-['Fredoka'] text-[#765563] text-xl mt-3">No scrapbook memories added yet.</p>
            <p className="text-xs text-[#765563]/80 mt-2 font-['Quicksand']">
              You can add your own photographs, dates, and stories anytime via the admin panel.
            </p>
          </div>
        ) : (
          /* ================= SCRAPBOOK JOURNAL BINDER ================= */
          <div className="relative scrapbook-paper rounded-3xl sm:rounded-[36px] border-3 sm:border-4 border-[#F8C8DC] shadow-[0_20px_60px_rgba(248,200,220,0.5),0_4px_16px_rgba(118,85,99,0.06)] p-4 sm:p-8 md:p-12">
            {/* Scrapbook Spiral / Stitch Marks at Top */}
            <div className="absolute -top-3.5 inset-x-8 sm:inset-x-16 flex justify-between pointer-events-none z-30">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-6 rounded-full bg-gradient-to-b from-[#FFF8F0] via-[#E6DDF5] to-[#F8C8DC] border border-[#E99AB5]/60 shadow-xs"
                />
              ))}
            </div>

            {/* Collage Layout with Varied Card Sizes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 lg:gap-14 pt-4">
              {memories.map((mem, index) => {
                const tape = washiTapes[index % washiTapes.length];
                const defaultRotation = index % 2 === 0 ? -2.2 : 2.2;
                const rotation = mem.rotationDeg ?? defaultRotation;
                const isLoved = Boolean(lovedMemories[mem.id]);
                const isFeatured = index === 0;

                return (
                  <div
                    key={mem.id}
                    className={`flex justify-center items-center ${
                      isFeatured ? 'md:col-span-2' : ''
                    }`}
                  >
                    {/* Polaroid Scrapbook Card */}
                    <div
                      onClick={() => handleOpenDetail(mem)}
                      className={`group cursor-pointer w-full transition-all duration-300 hover:z-30 ${
                        isFeatured ? 'max-w-2xl' : 'max-w-sm'
                      }`}
                      style={{
                        transform: `rotate(${rotation * 0.4}deg)`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'rotate(0deg) scale(1.03)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = `rotate(${rotation * 0.4}deg) scale(1)`;
                      }}
                    >
                      <div className="relative bg-[#FFF8F0] p-4 pb-6 sm:p-5 sm:pb-7 rounded-2xl polaroid-shadow group-hover:polaroid-shadow-hover border-2 border-[#F8C8DC] group-hover:border-[#E99AB5] transition-all duration-300 flex flex-col items-center">
                        {/* Washi Tape on Top Center */}
                        <div
                          className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-28 sm:w-36 h-7 opacity-95 pointer-events-none shadow-xs border border-white/70 z-20"
                          style={{
                            background: tape.bg,
                            transform: `translateX(-50%) rotate(${tape.angle}deg)`,
                            clipPath: 'polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)',
                          }}
                        />

                        {/* Cute Sticker in Corner */}
                        <div className="absolute top-2.5 right-3 text-xl sm:text-2xl select-none pointer-events-none group-hover:scale-125 group-hover:rotate-12 transition-transform duration-300 z-20">
                          {tape.sticker}
                        </div>

                        {/* Love Heart Stamp Button */}
                        <button
                          onClick={(e) => toggleLoveMemory(mem.id, e)}
                          className="absolute top-2.5 left-3 z-20 p-1.5 rounded-full bg-[#FFF8F0]/90 border border-[#F8C8DC] hover:scale-115 active:scale-90 transition-transform shadow-xs cursor-pointer"
                          title="Heart this memory ♡"
                        >
                          <Heart
                            className={`w-4 h-4 transition-colors ${
                              isLoved
                                ? 'text-[#FF6584] fill-[#FF6584] animate-pulse'
                                : 'text-[#765563]/50 hover:text-[#E99AB5]'
                            }`}
                          />
                        </button>

                        {/* Photo Container */}
                        <div
                          className={`relative w-full rounded-xl overflow-hidden bg-[#FFD8C2]/25 border border-[#F8C8DC] shadow-inner mt-2 ${
                            isFeatured ? 'aspect-[16/9]' : 'aspect-[4/3]'
                          }`}
                        >
                          {renderMemoryVisual(mem, false)}

                          {/* Subtle warm sunlight sheen */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-[#FFD8C2]/15 via-transparent to-[#F8C8DC]/20 pointer-events-none" />
                        </div>

                        {/* Handwritten Caption & Metadata Area */}
                        <div className="w-full mt-4 flex flex-col items-center text-center px-1">
                          {/* Memory Date & Location Stamp */}
                          {(mem.date || mem.location) && (
                            <div className="flex items-center gap-2 text-[11px] font-['Quicksand'] font-bold text-[#E99AB5] tracking-wider mb-1">
                              {mem.date && <span>📅 {mem.date}</span>}
                              {mem.date && mem.location && <span>·</span>}
                              {mem.location && <span>📍 {mem.location}</span>}
                            </div>
                          )}

                          {/* Handwritten Title Caption in Caveat */}
                          <h3 className="font-['Caveat'] text-2xl xs:text-3xl sm:text-4xl text-[#765563] font-bold tracking-wide leading-tight mt-0.5">
                            {mem.title}
                          </h3>

                          {/* Short description quote */}
                          {mem.description && (
                            <p className="font-['Caveat'] text-lg sm:text-xl text-[#765563]/85 line-clamp-2 mt-1">
                              "{mem.description}"
                            </p>
                          )}

                          {/* Read Story Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(mem);
                            }}
                            className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] border border-white text-[#765563] font-['Quicksand'] font-bold text-xs tracking-wider shadow-xs hover:shadow-[0_4px_14px_rgba(233,154,181,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
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
          <p className="font-['Caveat'] text-2xl xs:text-3xl text-[#E99AB5] font-bold mb-3 sm:mb-4">
            "Now discover the little keepsakes and whispered jokes we share..."
          </p>
          <FloatingHeartButton
            onClick={onNext}
            className="group cursor-pointer px-6 sm:px-9 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] border-2 border-white text-[#765563] hover:shadow-[0_10px_28px_rgba(248,200,220,0.7)] shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 font-['Fredoka'] text-sm xs:text-base sm:text-lg font-medium max-w-full"
          >
            <span>Open our keepsakes & inside jokes 🎀</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1.5 transition-transform shrink-0" />
          </FloatingHeartButton>
        </div>
      </div>

      {/* Memory Detail Modal Lightbox in Real Scrapbook Paper Style */}
      {selectedMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#765563]/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#FFF8F0] border-3 border-[#F8C8DC] rounded-3xl shadow-[0_20px_50px_rgba(233,154,181,0.4)] p-5 sm:p-8 text-[#765563]">
            {/* Close Button */}
            <button
              onClick={handleCloseDetail}
              className="absolute top-4 right-4 text-[#765563] hover:text-[#E99AB5] p-2 rounded-full hover:bg-[#F8C8DC]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Photo Preview in Modal */}
            <div className="mb-4 sm:mb-5 rounded-2xl overflow-hidden aspect-[16/9] border-2 border-[#F8C8DC] shadow-sm bg-[#FFD8C2]/30 relative">
              {renderMemoryVisual(selectedMemory, true)}
              <div className="absolute inset-0 bg-gradient-to-tr from-[#FFD8C2]/15 via-transparent to-[#F8C8DC]/15 pointer-events-none" />
            </div>

            {/* Date & Location Pill Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-2 text-xs font-['Quicksand'] font-bold text-[#E99AB5]">
              {selectedMemory.date && (
                <span className="flex items-center gap-1 bg-[#FFF0B3]/60 px-2.5 py-0.5 rounded-full border border-[#FFF0B3]">
                  <Calendar className="w-3 h-3" /> {selectedMemory.date}
                </span>
              )}
              {selectedMemory.location && (
                <span className="flex items-center gap-1 bg-[#E6DDF5]/60 px-2.5 py-0.5 rounded-full border border-[#E6DDF5]">
                  <MapPin className="w-3 h-3" /> {selectedMemory.location}
                </span>
              )}
            </div>

            <h3 className="font-['Fredoka'] text-2xl xs:text-3xl text-[#765563] font-semibold pr-8 mt-1">
              {selectedMemory.title}
            </h3>

            {/* Description / Story in Lined Journal Paper */}
            <div className="mt-4 pt-4 border-t-2 border-[#F8C8DC]/50">
              <p className="font-['Caveat'] text-2xl sm:text-3xl text-[#765563] leading-relaxed whitespace-pre-line font-bold">
                {selectedMemory.story || selectedMemory.description}
              </p>
            </div>

            {/* Tags */}
            {selectedMemory.tags && selectedMemory.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedMemory.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-['Quicksand'] font-bold text-[#765563] bg-[#F8C8DC]/40 px-2.5 py-0.5 rounded-full border border-[#F8C8DC]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={(e) => toggleLoveMemory(selectedMemory.id, e)}
                className="inline-flex items-center gap-1.5 text-xs font-['Quicksand'] font-bold text-[#E99AB5] cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              >
                <Heart
                  className={`w-4 h-4 ${
                    lovedMemories[selectedMemory.id]
                      ? 'fill-[#FF6584] text-[#FF6584]'
                      : 'text-[#E99AB5]'
                  }`}
                />
                <span>
                  {lovedMemories[selectedMemory.id] ? 'Cherished forever ♡' : 'Touch to cherish ♡'}
                </span>
              </button>

              <button
                onClick={handleCloseDetail}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#F8C8DC] to-[#FFD8C2] border border-white text-[#765563] text-xs font-['Quicksand'] font-bold tracking-wide cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-xs"
              >
                Close Memory ♡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
