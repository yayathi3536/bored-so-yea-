import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, X } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface CuteBunnyProps {
  onSecretFound?: () => void;
  position?: 'fixed' | 'inline';
}

export const CuteBunny: React.FC<CuteBunnyProps> = ({ position = 'fixed' }) => {
  const [speechIndex, setSpeechIndex] = useState(0);
  const [showSpeech, setShowSpeech] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);

  const speechMessages = [
    'for you! ♡',
    'you are so special! ✨',
    'yayathi loves you! 🍓',
    'heeeey cutie! 🎀',
    'boop! ♡',
  ];

  useEffect(() => {
    // Show speech bubble periodically
    const interval = setInterval(() => {
      setShowSpeech(true);
      setSpeechIndex((prev) => (prev + 1) % speechMessages.length);
      setTimeout(() => setShowSpeech(false), 3800);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const handleClickBunny = () => {
    audioEngine.playChime(1.4);
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1200);
    setShowSecretModal(true);
  };

  return (
    <>
      <div
        className={`${
          position === 'fixed'
            ? 'fixed bottom-3 left-3 sm:bottom-5 sm:left-5 z-40'
            : 'relative'
        } select-none group cursor-pointer animate-gentle-bounce`}
        onClick={handleClickBunny}
        title="Click the cute bunny for a secret! ♡"
      >
        {/* Cute Speech Bubble */}
        <div
          className={`absolute -top-8 left-3 sm:-top-10 sm:left-6 whitespace-nowrap bg-[#FFF8EF] border-2 border-[#FFBFD7] text-[#765563] text-[10px] sm:text-xs font-['Quicksand'] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md transition-all duration-300 pointer-events-none max-w-[160px] truncate ${
            showSpeech ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-2'
          }`}
        >
          {speechMessages[speechIndex]}
          <div className="absolute -bottom-1.5 left-4 w-2.5 h-2.5 bg-[#FFF8EF] border-b-2 border-r-2 border-[#FFBFD7] transform rotate-45" />
        </div>

        {/* SVG Handcrafted Kawaii Bunny holding a Pink Heart */}
        <div className="relative w-14 h-18 sm:w-20 sm:h-24 transition-transform duration-300 group-hover:scale-110">
          <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-md overflow-visible">
            {/* Left Ear */}
            <g className="animate-ear-wiggle origin-bottom">
              <ellipse cx="36" cy="26" rx="9" ry="24" fill="#FFFFFF" stroke="#FFBFD7" strokeWidth="2.5" />
              <ellipse cx="36" cy="26" rx="5" ry="16" fill="#FFD6E7" />
            </g>

            {/* Right Ear */}
            <g className="origin-bottom" style={{ transformOrigin: '64px 45px' }}>
              <ellipse cx="64" cy="26" rx="9" ry="24" fill="#FFFFFF" stroke="#FFBFD7" strokeWidth="2.5" />
              <ellipse cx="64" cy="26" rx="5" ry="16" fill="#FFD6E7" />
              {/* Little Pink Bow on right ear */}
              <circle cx="70" cy="42" r="3" fill="#FF85A1" />
              <path d="M66 42 Q60 38 65 46 Z" fill="#FFA3BA" />
              <path d="M74 42 Q80 38 75 46 Z" fill="#FFA3BA" />
            </g>

            {/* Round Bunny Body */}
            <ellipse cx="50" cy="85" rx="30" ry="26" fill="#FFFFFF" stroke="#FFBFD7" strokeWidth="2.5" />

            {/* Little Feet */}
            <ellipse cx="34" cy="108" rx="8" ry="6" fill="#FFFFFF" stroke="#FFBFD7" strokeWidth="2" />
            <ellipse cx="66" cy="108" rx="8" ry="6" fill="#FFFFFF" stroke="#FFBFD7" strokeWidth="2" />

            {/* Bunny Head */}
            <circle cx="50" cy="56" r="26" fill="#FFFFFF" stroke="#FFBFD7" strokeWidth="2.5" />

            {/* Pink Cheeks (Blush) */}
            <ellipse cx="32" cy="62" rx="5.5" ry="3.5" fill="#FFBFD7" opacity="0.85" />
            <ellipse cx="68" cy="62" rx="5.5" ry="3.5" fill="#FFBFD7" opacity="0.85" />

            {/* Eyes (Blinking anime dots with highlight) */}
            <ellipse cx="38" cy="53" rx="3.5" ry="4" fill="#765563" />
            <circle cx="39.5" cy="51.5" r="1.3" fill="#FFFFFF" />

            <ellipse cx="62" cy="53" rx="3.5" ry="4" fill="#765563" />
            <circle cx="63.5" cy="51.5" r="1.3" fill="#FFFFFF" />

            {/* Tiny Cute Bunny Nose & Mouth */}
            <path d="M49 59 Q50 61 51 59" stroke="#FF85A1" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M47 62 Q50 64 53 62" stroke="#765563" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Heart being held by paws */}
            <g className="transform transition-transform duration-300 group-hover:scale-110 origin-center">
              <path
                d="M50 74 C50 70 43 65 39 71 C34 77 44 87 50 91 C56 87 66 77 61 71 C57 65 50 70 50 74 Z"
                fill="#FF9EBE"
                stroke="#FF6584"
                strokeWidth="1.2"
              />
              <path
                d="M44 72 Q43 69 46 70"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* Paws holding the heart */}
            <circle cx="39" cy="80" r="5" fill="#FFFFFF" stroke="#FFBFD7" strokeWidth="1.8" />
            <circle cx="61" cy="80" r="5" fill="#FFFFFF" stroke="#FFBFD7" strokeWidth="1.8" />
          </svg>
        </div>
      </div>

      {/* Secret Easter Egg Modal */}
      {showSecretModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#765563]/30 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#FFF8EF] border-3 border-[#FFBFD7] rounded-3xl p-5 sm:p-6 shadow-2xl text-center text-[#765563]">
            <button
              onClick={() => setShowSecretModal(false)}
              className="absolute top-3.5 right-3.5 text-[#765563] hover:text-[#FF85A1] p-1.5 rounded-full hover:bg-[#FFD6E7]/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2.5 rounded-full bg-[#FFD6E7] border-2 border-[#FFBFD7] flex items-center justify-center text-2xl sm:text-3xl shadow-sm animate-bounce">
              🎁
            </div>

            <span className="text-[11px] sm:text-xs font-['Quicksand'] uppercase tracking-widest text-[#FF85A1] font-bold">
              secret easter egg! ♡
            </span>

            <h3 className="font-['Fredoka'] text-xl sm:text-2xl text-[#765563] mt-1 font-semibold">
              You found bunny's gift!
            </h3>

            <div className="mt-3.5 p-3.5 sm:p-4 rounded-2xl bg-[#FFE0CC]/40 border border-[#FFBFD7] font-['Caveat'] text-xl sm:text-2xl text-[#765563] leading-relaxed">
              "Every single heartbeat, every quiet evening, every little laugh... you make my whole world so much softer and happier. Yayathi loves you to the moon and back!" ♡
            </div>

            <button
              onClick={() => setShowSecretModal(false)}
              className="mt-4 sm:mt-5 px-5 sm:px-6 py-2 rounded-full bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] border border-[#FF85A1]/40 text-[#765563] font-['Quicksand'] font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              Awww, thank you bunny! ♡
            </button>
          </div>
        </div>
      )}
    </>
  );
};
