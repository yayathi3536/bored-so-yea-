import React from 'react';
import { SceneId } from '../types';

interface CelestialNavProps {
  currentScene: SceneId;
  onSelectScene: (scene: SceneId) => void;
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
  recipientName,
}) => {
  if (currentScene === 'opening') {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto bg-[#FFF8EF]/90 backdrop-blur-md px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#FFBFD7]/60 shadow-xs">
          <span className="text-xs sm:text-sm">🎀</span>
          <span className="font-['Fredoka'] text-[#765563] text-xs sm:text-sm tracking-wide font-medium">
            Our Little Universe
          </span>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-[#FFF8EF]/95 border-b-2 border-[#FFBFD7]/50 px-2.5 sm:px-8 py-2 sm:py-3 flex items-center justify-between gap-2 transition-all duration-300 shadow-xs">
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
      <nav className="flex items-center gap-1 sm:gap-2.5 text-xs font-['Quicksand'] font-bold tracking-wider overflow-x-auto py-0.5 scrollbar-none min-w-0 flex-1 justify-end touch-pan-x">
        {SCENES.map((s) => {
          const isActive = currentScene === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelectScene(s.id)}
              className={`relative shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer transition-all duration-200 whitespace-nowrap flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs ${
                isActive
                  ? 'bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] text-[#765563] font-bold shadow-xs scale-102 border border-[#FFA3BA]'
                  : 'text-[#765563]/80 hover:text-[#765563] hover:bg-[#FFD6E7]/40'
              }`}
            >
              <span className="text-[11px] sm:text-xs">{s.icon}</span>
              <span className="hidden xs:inline">{s.label}</span>
              <span className="xs:hidden">{s.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
