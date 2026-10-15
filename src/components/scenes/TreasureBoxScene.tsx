import React, { useState } from 'react';
import { LetterItem } from '../../types';
import { Mail, Sparkles, X, ChevronRight, Bookmark, Heart } from 'lucide-react';
import { audioEngine } from '../../utils/audio';
import { FloatingHeartButton } from '../FloatingHeartButton';

interface TreasureBoxSceneProps {
  letters: LetterItem[];
  recipientName: string;
  senderName: string;
  onNext: () => void;
}

export const TreasureBoxScene: React.FC<TreasureBoxSceneProps> = ({
  letters,
  recipientName,
  senderName,
  onNext,
}) => {
  const [selectedLetter, setSelectedLetter] = useState<LetterItem | null>(null);

  const handleOpenLetter = (letter: LetterItem) => {
    audioEngine.playPaperRustle();
    audioEngine.playChime(1.15);
    setSelectedLetter(letter);
  };

  const handleClose = () => {
    setSelectedLetter(null);
  };

  const getPastelEnvelopeTheme = (idx: number) => {
    const themes = [
      {
        bg: 'bg-gradient-to-br from-[#FFF8F0] via-[#F8C8DC]/60 to-[#FFD8C2]/50',
        border: 'border-[#F8C8DC]',
        seal: 'from-[#F8C8DC] to-[#E99AB5]',
        tag: 'bg-[#F8C8DC] text-[#765563]',
      },
      {
        bg: 'bg-gradient-to-br from-[#FFF8F0] via-[#FFD8C2]/60 to-[#FFF8F0]',
        border: 'border-[#FFD8C2]',
        seal: 'from-[#FFD8C2] to-[#E99AB5]',
        tag: 'bg-[#FFD8C2] text-[#765563]',
      },
      {
        bg: 'bg-gradient-to-br from-[#FFF8F0] via-[#E6DDF5]/60 to-[#F8C8DC]/40',
        border: 'border-[#E6DDF5]',
        seal: 'from-[#E6DDF5] to-[#C084FC]',
        tag: 'bg-[#E6DDF5] text-[#765563]',
      },
      {
        bg: 'bg-gradient-to-br from-[#FFF8F0] via-[#FFF0B3]/60 to-[#FFF8F0]',
        border: 'border-[#FFF0B3]',
        seal: 'from-[#FFF0B3] to-[#F59E0B]',
        tag: 'bg-[#FFF0B3] text-[#765563]',
      },
    ];
    return themes[idx % themes.length];
  };

  return (
    <div className="relative min-h-screen w-full px-3 sm:px-6 py-20 sm:py-28 select-none flex flex-col items-center overflow-hidden">
      {/* Background Paper Texture & Ambient Glow */}
      <div className="absolute inset-0 paper-texture opacity-75 pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[90vw] max-w-[850px] aspect-square rounded-full blur-[140px] bg-gradient-to-r from-[#F8C8DC]/50 via-[#FFD8C2]/45 to-[#E6DDF5]/40" />
      </div>

      <div className="relative z-10 max-w-5xl w-full text-center">
        {/* Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#F8C8DC] bg-[#FFF8F0]/95 backdrop-blur-md mb-3 shadow-[0_4px_16px_rgba(248,200,220,0.45)]">
          <span className="text-xs sm:text-sm">💌</span>
          <span className="text-[11px] sm:text-xs font-['Quicksand'] uppercase tracking-[0.22em] text-[#765563] font-bold">
            Open When You Need Me
          </span>
          <span className="text-xs sm:text-sm">🎀</span>
        </div>

        <h2 className="font-['Fredoka'] text-3xl xs:text-4xl sm:text-5xl md:text-6xl text-[#765563] font-semibold tracking-wide text-cute-shadow px-2">
          A Treasure Box of Letters ♡
        </h2>
        <p className="font-['Caveat'] text-2xl xs:text-3xl sm:text-4xl text-[#E99AB5] font-bold mt-2 sm:mt-3 max-w-lg mx-auto px-2">
          "For the quiet days, the heavy days, and the days when you just need to feel loved."
        </p>

        {/* Collection of Floating Pastel Envelopes */}
        <div className="mt-10 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8 text-left">
          {letters.map((letter, idx) => {
            const theme = getPastelEnvelopeTheme(idx);

            return (
              <div
                key={letter.id}
                onClick={() => handleOpenLetter(letter)}
                className="group relative cursor-pointer"
              >
                {/* Envelope Outer Card in Pastel Palette */}
                <div
                  className={`relative min-h-[230px] xs:h-64 rounded-3xl ${theme.bg} border-2 ${theme.border} p-5 sm:p-6 polaroid-shadow group-hover:shadow-[0_18px_40px_rgba(248,200,220,0.7)] transition-all duration-300 group-hover:-translate-y-2 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Faux Envelope Flap Fold Line */}
                  <div
                    className="absolute inset-x-0 top-0 h-20 sm:h-24 pointer-events-none opacity-25"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      background: 'rgba(233, 154, 181, 0.2)',
                      borderBottom: '2px solid rgba(248, 200, 220, 0.6)',
                    }}
                  />

                  {/* Wax Seal / Stamp & Category Tag */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-['Quicksand'] tracking-wider uppercase ${theme.tag} px-3 py-1 rounded-full border border-white font-bold shadow-xs`}
                    >
                      {letter.category}
                    </span>

                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-br ${theme.seal} border-2 border-white flex items-center justify-center shadow-xs group-hover:scale-115 group-hover:rotate-12 transition-transform`}
                    >
                      <Mail className="w-4 h-4 text-[#765563]" />
                    </div>
                  </div>

                  {/* Letter Title */}
                  <div className="relative z-10 mt-auto pt-4">
                    <h3 className="font-['Fredoka'] text-lg sm:text-2xl text-[#765563] font-semibold leading-snug group-hover:text-[#E99AB5] transition-colors">
                      {letter.title}
                    </h3>
                    <p className="font-['Caveat'] text-lg sm:text-xl text-[#765563]/85 mt-1 line-clamp-2">
                      "{letter.content[0]}"
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transition to next scene */}
        <div className="mt-14 sm:mt-20 text-center flex flex-col items-center px-2">
          <p className="font-['Caveat'] text-2xl xs:text-3xl text-[#E99AB5] font-bold mb-3 sm:mb-4">
            "Now let's gaze at the sunset sky made just for us..."
          </p>
          <FloatingHeartButton
            onClick={onNext}
            className="group cursor-pointer px-6 sm:px-9 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] border-2 border-white text-[#765563] hover:shadow-[0_10px_28px_rgba(248,200,220,0.7)] shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 font-['Fredoka'] text-sm xs:text-base sm:text-lg font-medium max-w-full"
          >
            <span>Visit the Sunset Sky 🌅</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1.5 transition-transform shrink-0" />
          </FloatingHeartButton>
        </div>
      </div>

      {/* Full Modal Viewer for Open Letters */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#765563]/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#FFF8F0] border-3 border-[#F8C8DC] rounded-3xl shadow-[0_20px_50px_rgba(248,200,220,0.4)] p-6 sm:p-10 text-[#765563]">
            {/* Top Washi Tape */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-7 opacity-90 pointer-events-none shadow-xs border border-white/70"
              style={{
                background: 'repeating-linear-gradient(45deg, #F8C8DC, #F8C8DC 8px, #FFF0B3 8px, #FFF0B3 16px)',
                transform: 'rotate(-1deg)',
              }}
            />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-[#765563] hover:text-[#E99AB5] p-2 rounded-full hover:bg-[#F8C8DC]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[11px] sm:text-xs font-['Quicksand'] uppercase tracking-widest text-[#E99AB5] font-bold">
              {selectedLetter.category}
            </span>

            <h3 className="font-['Fredoka'] text-2xl xs:text-3xl text-[#765563] font-semibold mt-1 pr-6">
              {selectedLetter.title}
            </h3>

            {/* Paragraphs in lined paper styling */}
            <div className="mt-5 space-y-4 font-serif text-base xs:text-lg text-[#765563] leading-relaxed border-t-2 border-[#F8C8DC]/60 pt-4">
              {selectedLetter.content.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {selectedLetter.postscript && (
              <div className="mt-6 p-4 rounded-2xl bg-[#F8C8DC]/25 border border-[#F8C8DC]">
                <p className="font-['Caveat'] text-2xl text-[#E99AB5] font-bold">
                  {selectedLetter.postscript}
                </p>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleClose}
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#F8C8DC] to-[#FFD8C2] border border-white text-[#765563] text-xs font-['Quicksand'] font-bold tracking-wide cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-xs"
              >
                Tuck Letter Away ♡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
