import React, { useState } from 'react';
import { LetterItem } from '../../types';
import { Mail, Sparkles, X, ChevronRight, Bookmark, Heart } from 'lucide-react';
import { audioEngine } from '../../utils/audio';

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
        bg: 'bg-gradient-to-br from-[#FFF8EF] via-[#FFD6E7]/70 to-[#FFE0CC]/60',
        border: 'border-[#FFBFD7]',
        seal: 'from-[#FFD6E7] to-[#FF85A1]',
        tag: 'bg-[#FFD6E7] text-[#765563]',
      },
      {
        bg: 'bg-gradient-to-br from-[#FFF8EF] via-[#FFE0CC]/70 to-[#FFF8EF]',
        border: 'border-[#FFE0CC]',
        seal: 'from-[#FFE0CC] to-[#FFA3BA]',
        tag: 'bg-[#FFE0CC] text-[#765563]',
      },
      {
        bg: 'bg-gradient-to-br from-[#FFF8EF] via-[#E9DFFF]/70 to-[#FFD6E7]/50',
        border: 'border-[#E9DFFF]',
        seal: 'from-[#E9DFFF] to-[#C084FC]',
        tag: 'bg-[#E9DFFF] text-[#765563]',
      },
      {
        bg: 'bg-gradient-to-br from-[#FFF8EF] via-[#DFF4E4]/70 to-[#FFF8EF]',
        border: 'border-[#DFF4E4]',
        seal: 'from-[#DFF4E4] to-[#86EFAC]',
        tag: 'bg-[#DFF4E4] text-[#765563]',
      },
      {
        bg: 'bg-gradient-to-br from-[#FFF8EF] via-[#FFE0CC]/60 to-[#E9DFFF]/50',
        border: 'border-[#FFBFD7]',
        seal: 'from-[#FFBFD7] to-[#FFD6E7]',
        tag: 'bg-[#FFBFD7]/60 text-[#765563]',
      },
    ];
    return themes[idx % themes.length];
  };

  return (
    <div className="relative min-h-screen w-full px-3 sm:px-4 py-16 sm:py-24 select-none flex flex-col items-center">
      {/* Soft Pastel Ambient Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[90vw] max-w-[850px] aspect-square rounded-full blur-[100px] sm:blur-[140px] bg-gradient-to-r from-[#FFD6E7]/50 via-[#FFE0CC]/40 to-[#E9DFFF]/40" />
      </div>

      <div className="relative z-10 max-w-5xl w-full text-center">
        {/* Header */}
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full border-2 border-[#FFBFD7] bg-[#FFF8EF]/95 backdrop-blur-md mb-2.5 sm:mb-3 shadow-[0_4px_14px_rgba(255,191,215,0.4)]">
          <span className="text-xs sm:text-sm">💌</span>
          <span className="text-[10px] sm:text-xs font-['Quicksand'] uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#765563] font-bold">
            Open When You Need Me
          </span>
          <span className="text-xs sm:text-sm">🎀</span>
        </div>

        <h2 className="font-['Fredoka'] text-2xl xs:text-3xl sm:text-5xl md:text-6xl text-[#765563] font-semibold tracking-wide text-cute-shadow px-2">
          A Treasure Box of Letters ♡
        </h2>
        <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#FF85A1] font-bold mt-2 sm:mt-3 max-w-lg mx-auto px-2">
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
                  className={`relative min-h-[230px] xs:h-64 rounded-3xl ${theme.bg} border-2 ${theme.border} p-5 sm:p-6 shadow-[0_12px_28px_rgba(255,191,215,0.4)] group-hover:shadow-[0_18px_40px_rgba(255,163,186,0.65)] transition-all duration-300 group-hover:-translate-y-2 flex flex-col justify-between overflow-hidden`}
                >
                  {/* Faux Envelope Flap Fold Line */}
                  <div
                    className="absolute inset-x-0 top-0 h-20 sm:h-24 pointer-events-none opacity-25"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                      background: 'rgba(255, 133, 161, 0.15)',
                      borderBottom: '2px solid rgba(255, 191, 215, 0.5)',
                    }}
                  />

                  {/* Wax Seal / Stamp & Category Tag */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className={`text-[11px] sm:text-xs font-['Quicksand'] tracking-wider uppercase ${theme.tag} px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-white font-bold shadow-xs`}
                    >
                      {letter.category}
                    </span>

                    <div
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br ${theme.seal} border-2 border-white flex items-center justify-center shadow-xs group-hover:scale-115 group-hover:rotate-12 transition-transform`}
                    >
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#765563]" />
                    </div>
                  </div>

                  {/* Letter Title */}
                  <div className="relative z-10 mt-auto pt-4">
                    <h3 className="font-['Fredoka'] text-lg sm:text-2xl text-[#765563] font-semibold leading-snug group-hover:text-[#FF85A1] transition-colors">
                      {letter.title}
                    </h3>
                    <p className="font-['Caveat'] text-lg sm:text-xl text-[#765563]/80 mt-1 line-clamp-2">
                      "{letter.content[0]}"
                    </p>
                  </div>

                  {/* Bottom affordance */}
                  <div className="relative z-10 pt-2.5 sm:pt-3 border-t-2 border-[#FFBFD7]/40 flex items-center justify-between text-xs text-[#765563] font-['Quicksand'] font-bold">
                    <span>Tap to unseal ♡</span>
                    <Sparkles className="w-3.5 h-3.5 text-[#FF85A1] group-hover:rotate-45 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transition to Final Scene */}
        <div className="mt-14 sm:mt-20 flex flex-col items-center px-2">
          <p className="font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#FF85A1] font-bold mb-3 sm:mb-4">
            "And now, come watch the sunset with me..."
          </p>
          <button
            onClick={onNext}
            className="group cursor-pointer px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-[#FFD6E7] via-[#FFBFD7] to-[#FFE0CC] border-2 border-white text-[#765563] hover:shadow-[0_10px_28px_rgba(255,191,215,0.7)] shadow-sm hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 font-['Fredoka'] text-base sm:text-lg font-medium max-w-full"
          >
            <span>The Final Sunset Surprise 🌅</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#765563] group-hover:translate-x-1.5 transition-transform shrink-0" />
          </button>
        </div>
      </div>

      {/* Reading Dedicated Letter Modal in Warm Cream Paper */}
      {selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#765563]/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-[#FFF8EF] border-3 border-[#FFBFD7] rounded-3xl p-5 sm:p-9 md:p-12 text-[#765563] shadow-[0_25px_60px_rgba(255,163,186,0.35)]">
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 text-[#765563] hover:text-[#FF85A1] p-1.5 sm:p-2 rounded-full hover:bg-[#FFD6E7]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Category tag */}
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-['Quicksand'] font-bold text-[#FF85A1] uppercase tracking-widest mb-1.5 sm:mb-2">
              <Bookmark className="w-3.5 h-3.5 text-[#FF85A1]" />
              <span>{selectedLetter.category}</span>
            </div>

            {/* Letter Title */}
            <h3 className="font-['Fredoka'] text-xl xs:text-2xl sm:text-3xl font-semibold text-[#765563] pb-3 sm:pb-4 border-b-2 border-[#FFBFD7]/40 pr-9">
              {selectedLetter.title}
            </h3>

            {/* Letter Content in Warm Brown */}
            <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 font-['Caveat'] text-xl xs:text-2xl sm:text-3xl text-[#765563] leading-relaxed">
              {selectedLetter.content.map((paragraph, pIdx) => (
                <p key={pIdx}>{paragraph}</p>
              ))}
            </div>

            {/* Postscript */}
            {selectedLetter.postscript && (
              <div className="mt-5 sm:mt-6 pt-3.5 sm:pt-4 border-t-2 border-[#FFBFD7]/40 font-['Caveat'] text-xl sm:text-2xl text-[#FF85A1] font-bold">
                {selectedLetter.postscript}
              </div>
            )}

            {/* Signature */}
            <div className="mt-6 sm:mt-8 pt-3.5 sm:pt-4 border-t-2 border-[#FFBFD7]/40 flex flex-col items-end">
              <span className="font-['Caveat'] text-2xl sm:text-4xl font-bold text-[#FF85A1]">
                - {senderName}
              </span>
              <span className="text-xs font-['Quicksand'] font-bold text-[#765563]/80 mt-1">For {recipientName} ♡</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
