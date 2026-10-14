/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { UniverseData, SceneId } from './types';
import { DEFAULT_UNIVERSE } from './data/defaultUniverse';
import { DreamyPastelSky } from './components/DreamyPastelSky';
import { CelestialNav } from './components/CelestialNav';
import { SoundtrackPlayer } from './components/SoundtrackPlayer';
import { OwnerMode } from './components/OwnerMode';
import { PinModal } from './components/PinModal';
import { OpeningScene } from './components/scenes/OpeningScene';
import { EnvelopeScene } from './components/scenes/EnvelopeScene';
import { ScrapbookScene } from './components/scenes/ScrapbookScene';
import { SecretsScene } from './components/scenes/SecretsScene';
import { TreasureBoxScene } from './components/scenes/TreasureBoxScene';
import { FinalScene } from './components/scenes/FinalScene';
import { CuteBunny } from './components/CuteBunny';
import { audioEngine } from './utils/audio';
import { Sparkles, Edit3, Check, X, Shield } from 'lucide-react';

const STORAGE_KEY = 'our_universe_data_v1';
const PIN_STORAGE_KEY = 'romantic_owner_pin_v1';
const DEFAULT_PIN = '1234';

export default function App() {
  const [data, setData] = useState<UniverseData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Force update soundtrack to the user's requested Heat Waves song
        parsed.soundtrack = DEFAULT_UNIVERSE.soundtrack;
        if (parsed.memories?.[0] && (!parsed.memories[0].imageUrl || parsed.memories[0].imageUrl.includes('/src/assets/'))) {
          parsed.memories[0].imageUrl = '/images/original_memory.jpg';
        }
        return { ...DEFAULT_UNIVERSE, ...parsed };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_UNIVERSE;
  });

  const [storedPin, setStoredPin] = useState<string>(() => {
    try {
      return localStorage.getItem(PIN_STORAGE_KEY) || DEFAULT_PIN;
    } catch {
      return DEFAULT_PIN;
    }
  });

  const [currentScene, setCurrentScene] = useState<SceneId>('opening');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isOwnerModeOpen, setIsOwnerModeOpen] = useState(false);
  const [previewData, setPreviewData] = useState<UniverseData | null>(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  // Discreet flower clicks counter
  const [flowerClicks, setFlowerClicks] = useState(0);
  const flowerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active dataset: uses previewData when in preview mode, else saved data
  const activeData = isPreviewActive && previewData ? previewData : data;

  // Keyboard shortcut Shift + O or Shift + E to trigger PIN modal for owner convenience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'O' || e.key === 'o' || e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        setIsPinModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Flower 5-click discreet trigger
  const handleFlowerClick = () => {
    audioEngine.playBlip(1.0 + flowerClicks * 0.12);
    setFlowerClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        audioEngine.playChime(1.2);
        setIsPinModalOpen(true);
        if (flowerTimerRef.current) clearTimeout(flowerTimerRef.current);
        return 0;
      }
      if (flowerTimerRef.current) clearTimeout(flowerTimerRef.current);
      flowerTimerRef.current = setTimeout(() => {
        setFlowerClicks(0);
      }, 3500);
      return next;
    });
  };

  // When PIN entry is verified
  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    setIsOwnerModeOpen(true);
  };

  // Update Owner PIN
  const handleUpdatePin = (newPin: string) => {
    setStoredPin(newPin);
    try {
      localStorage.setItem(PIN_STORAGE_KEY, newPin);
    } catch {}
  };

  // Save changes to localStorage and main state
  const handleSaveData = (newData: UniverseData) => {
    setData(newData);
    setPreviewData(null);
    setIsPreviewActive(false);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch {
      // storage quota or incognito
    }
  };

  // Live preview mode without saving permanently yet
  const handlePreview = (draftData: UniverseData) => {
    setPreviewData(draftData);
    setIsPreviewActive(true);
    setIsOwnerModeOpen(false);
    audioEngine.playChime(1.1);
  };

  const handleResetData = () => {
    setData(DEFAULT_UNIVERSE);
    setPreviewData(null);
    setIsPreviewActive(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    alert('Reset to original universe configuration.');
  };

  const [isTransitioning, setIsTransitioning] = useState(false);

  const changeScene = (nextScene: SceneId) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    audioEngine.playChime(1.1);
    if (currentScene === 'opening' && nextScene === 'envelope') {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentScene(nextScene);
      }, 1200);
      return;
    }
    setCurrentScene(nextScene);
  };

  // Intensity of sky canvas depending on scene
  const skyIntensity =
    currentScene === 'final' ? 'sunset' : currentScene === 'opening' ? 'ambient' : 'bright';

  return (
    <div className="relative min-h-screen w-full bg-[#FFF8EF] text-[#765563] flex flex-col font-['Quicksand'] selection:bg-[#FFD6E7] selection:text-[#765563] overflow-x-hidden">
      {/* 60fps Floating Daisies, Hearts & Pastel Clouds Background */}
      <DreamyPastelSky
        intensity={skyIntensity}
        enableCursorPetals={true}
        isTransitioning={isTransitioning}
      />

      {/* Floating Preview Banner (Only visible when preview mode is active) */}
      {isPreviewActive && (
        <aside aria-label="Preview Mode" className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md bg-[#FFFDF9]/95 backdrop-blur-md border-2 border-[#FFBFD7] shadow-xl px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center justify-between gap-1.5 sm:gap-3 animate-fadeIn">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-['Fredoka'] font-semibold text-[#765563] truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#FF85A1] shrink-0" />
            <span className="truncate">Preview Mode</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                setIsPreviewActive(false);
                setIsOwnerModeOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1 rounded-full bg-[#FFD6E7] hover:bg-[#FFBFD7] text-[#765563] text-[11px] sm:text-xs font-['Quicksand'] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3 h-3 text-[#FF85A1]" />
              <span className="hidden xs:inline">Editor</span>
              <span className="xs:hidden">Edit</span>
            </button>

            <button
              onClick={() => {
                if (previewData) handleSaveData(previewData);
              }}
              className="px-2.5 sm:px-3.5 py-1 rounded-full bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] text-[#765563] text-[11px] sm:text-xs font-['Quicksand'] font-bold border border-[#FFA3BA] flex items-center gap-1 cursor-pointer shadow-xs transition-all"
            >
              <Check className="w-3 h-3 text-[#765563]" />
              <span>Save</span>
            </button>

            <button
              onClick={() => {
                setIsPreviewActive(false);
                setPreviewData(null);
              }}
              title="Discard preview"
              className="p-1 rounded-full text-[#765563]/60 hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      {/* Top Celestial Navigation (Completely clean of editing controls for visitors) */}
      <CelestialNav
        currentScene={currentScene}
        onSelectScene={changeScene}
        recipientName={activeData.recipientName}
      />

      {/* Main Scene Stage */}
      <main className="relative z-10 flex-1 flex flex-col">
        {currentScene === 'opening' && (
          <OpeningScene
            leadText={activeData.opening.lead}
            subText={activeData.opening.sub}
            buttonText={activeData.opening.buttonText}
            recipientName={activeData.recipientName}
            onEnter={() => changeScene('envelope')}
          />
        )}

        {currentScene === 'envelope' && (
          <EnvelopeScene
            greeting={activeData.mainLetter.greeting}
            paragraphs={activeData.mainLetter.paragraphs}
            signature={activeData.mainLetter.signature}
            dateStr={activeData.mainLetter.date}
            onNext={() => changeScene('scrapbook')}
          />
        )}

        {currentScene === 'scrapbook' && (
          <ScrapbookScene
            memories={activeData.memories}
            onNext={() => changeScene('secrets')}
          />
        )}

        {currentScene === 'secrets' && (
          <SecretsScene
            insideJokes={activeData.insideJokes}
            onNext={() => changeScene('treasure')}
          />
        )}

        {currentScene === 'treasure' && (
          <TreasureBoxScene
            letters={activeData.letters}
            recipientName={activeData.recipientName}
            senderName={activeData.senderName}
            onNext={() => changeScene('final')}
          />
        )}

        {currentScene === 'final' && (
          <FinalScene
            finalLetter={activeData.finalLetter}
            recipientName={activeData.recipientName}
            senderName={activeData.senderName}
            onRevisitFirst={() => changeScene('opening')}
          />
        )}
      </main>

      {/* Kawaii Bunny Character holding a pink heart with interactive secret note */}
      <CuteBunny position="fixed" />

      {/* Ambient Soundtrack Floating Player */}
      <SoundtrackPlayer
        trackName={activeData.soundtrack.trackName}
        composer={activeData.soundtrack.composer}
        customAudioUrl={activeData.soundtrack.audioUrl}
      />

      {/* Romantic Subtle Footer with Discreet Owner Flower Trigger */}
      <footer className="relative z-20 pt-8 pb-20 sm:pb-8 px-4 text-center select-none mt-auto">
        <div className="inline-flex max-w-full flex-wrap justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#FFF8EF]/80 backdrop-blur-xs border border-[#FFBFD7]/40 text-[11px] sm:text-xs font-['Quicksand'] text-[#765563]/70 shadow-xs">
          <span>made with so much love for {activeData.recipientName}</span>
          <button
            type="button"
            onClick={handleFlowerClick}
            className="inline-flex items-center justify-center p-0.5 rounded-full hover:scale-130 active:scale-95 transition-transform cursor-pointer focus:outline-none"
            title=""
            aria-label="🌸"
          >
            <span className="text-sm">🌸</span>
          </button>
          <span>forever & always</span>
        </div>

        {/* Subtle sparkle indicator when owner is clicking towards 5 clicks */}
        {flowerClicks > 0 && flowerClicks < 5 && (
          <div className="text-[11px] text-[#FF85A1] font-bold mt-1.5 tracking-widest animate-fadeIn">
            {'✨ '.repeat(flowerClicks)}
          </div>
        )}
      </footer>

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        storedPin={storedPin}
      />

      {/* Owner Mode Modal/Drawer */}
      <OwnerMode
        data={data}
        isOpen={isOwnerModeOpen}
        onClose={() => setIsOwnerModeOpen(false)}
        onSave={handleSaveData}
        onPreview={handlePreview}
        onReset={handleResetData}
        storedPin={storedPin}
        onUpdatePin={handleUpdatePin}
      />
    </div>
  );
}
