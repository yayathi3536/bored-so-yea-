import React, { useState } from 'react';
import { SceneId } from '../types';
import { ChevronRight } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface CelestialNavProps {
  currentScene: SceneId;
  onSelectScene: (scene: SceneId) => void;
  onNextScene?: () => void;
  recipientName: string;
}

const SCENES: Array<{ id: SceneId; label: string; icon: string }> = [
  { id: 'opening', label: 'Garden', icon: '🌸' },
  { id: 'envelope', label: 'Letter', icon: '💌' },
  { id: 'scrapbook', label: 'Scrapbook', icon: '📷' },
  { id: 'secrets', label: 'Keepsakes', icon: '🧸' },
  { id: 'treasure', label: 'Letters', icon: '🎀' },
  { id: 'final', label: 'Sunset', icon: '🌅' },
];

export const CelestialNav: React.FC<CelestialNavProps> = ({
  currentScene,
  onSelectScene,
  onNextScene,
  recipientName,
}) => {
  const [floatingHearts, setFloatingHearts] = useState<Array<{ id: number; key: string }>>([]);

  const spawnFloatingHeart = () => {
    const newHeart = { id: Date.now(), key: Math.random().toString(36).substring(2, 8) };
    setFloatingHearts((prev) => [...prev, newHeart]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== newHeart.id));
    }, 1500);
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    spawnFloatingHeart();
    audioEngine.playBlip(1.25);

    if (onNextScene) {
      onNextScene();
    } else {
      const currentIndex = SCENES.findIndex((s) => s.id === currentScene);
      const nextIdx = (currentIndex + 1) % SCENES.length;
      onSelectScene(SCENES[nextIdx].id);
    }
  };

  const handleSceneClick = (sceneId: SceneId) => {
    const currentIndex = SCENES.findIndex((s) => s.id === currentScene);
    const targetIndex = SCENES.findIndex((s) => s.id === sceneId);
    if (targetIndex > currentIndex) {
      spawnFloatingHeart();
    }
    onSelectScene(sceneId);
  };

  if (currentScene === 'opening') {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto bg-[#FFF8F0]/95 backdrop-blur-md px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border border-[#F8C8DC] shadow-xs">
          <span className="text-xs sm:text-sm">🎀</span>
          <span className="font-['Fredoka'] text-[#765563] text-xs sm:text-sm tracking-wide font-medium">
            Our Little Universe
          </span>
        </div>

        {/* Next navigation button on opening screen */}
        <button
          type="button"
          onClick={handleNextClick}
          className="relative pointer-events-auto px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] hover:from-[#E99AB5] hover:to-[#F8C8DC] text-[#765563] font-['Quicksand'] font-bold text-xs flex items-center gap-1 border border-white shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Go to next scene ♡"
        >
          <span>Next ♡</span>
          <ChevronRight className="w-3.5 h-3.5 text-[#765563]" />

          {/* Subtle floating heart animation on click */}
          {floatingHearts.map((h) => (
            <span
              key={h.key}
              className="absolute -top-3 left-1/2 pointer-events-none text-base sm:text-lg animate-subtle-floating-heart select-none z-50 drop-shadow-[0_2px_6px_rgba(233,154,181,0.6)]"
              aria-hidden="true"
            >
              💖
            </span>
          ))}
        </button>
      </header>
    );
  }

  const currentIndex = SCENES.findIndex((s) => s.id === currentScene);
  const isFinalScene = currentIndex === SCENES.length - 1;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-[#FFF8F0]/95 border-b-2 border-[#F8C8DC]/60 px-2.5 sm:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 transition-all duration-300 shadow-xs">
      {/* Brand Zone */}
      <div
        onClick={() => onSelectScene('opening')}
        className="shrink-0 flex items-center gap-1.5 cursor-pointer select-none group"
      >
        <span className="text-xs sm:text-sm group-hover:scale-125 group-hover:rotate-12 transition-transform">🎀</span>
        <span className="font-['Fredoka'] text-[#765563] text-xs sm:text-base tracking-wide whitespace-nowrap font-medium max-w-[120px] sm:max-w-none truncate">
          For {recipientName} ♡
        </span>
      </div>

      {/* Cute Pastel Nav Zone with smooth horizontal swipe on mobile */}
      <nav className="flex items-center gap-1 sm:gap-2 text-xs font-['Quicksand'] font-bold tracking-wider overflow-x-auto py-0.5 scrollbar-none min-w-0 flex-1 justify-end touch-pan-x">
        {SCENES.map((s) => {
          const isActive = currentScene === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSceneClick(s.id)}
              className={`relative shrink-0 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer transition-all duration-200 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs ${
                isActive
                  ? 'bg-gradient-to-r from-[#F8C8DC] to-[#FFD8C2] text-[#765563] font-bold shadow-xs scale-102 border border-white'
                  : 'text-[#765563]/80 hover:text-[#765563] hover:bg-[#F8C8DC]/40'
              }`}
            >
              <span className="text-[11px] sm:text-xs">{s.icon}</span>
              <span className="hidden xs:inline">{s.label}</span>
              <span className="xs:hidden">{s.label}</span>
            </button>
          );
        })}

        {/* Dedicated Next Button in navigation with subtle floating heart & rain trigger */}
        <button
          type="button"
          onClick={handleNextClick}
          className="relative shrink-0 ml-1 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] hover:from-[#E99AB5] hover:to-[#F8C8DC] text-[#765563] font-bold text-[11px] sm:text-xs flex items-center gap-0.5 sm:gap-1 border border-white shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer select-none"
          title={isFinalScene ? 'Revisit Garden 🌸' : 'Next Chapter ♡'}
        >
          <span>{isFinalScene ? 'Replay 🌸' : 'Next ♡'}</span>
          <ChevronRight className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#765563] shrink-0" />

          {/* Subtle floating heart animation on click */}
          {floatingHearts.map((h) => (
            <span
              key={h.key}
              className="absolute -top-3 left-1/2 pointer-events-none text-base sm:text-lg animate-subtle-floating-heart select-none z-50 drop-shadow-[0_2px_6px_rgba(233,154,181,0.6)]"
              aria-hidden="true"
            >
              💖
            </span>
          ))}
        </button>
      </nav>
    </header>
  );
};
