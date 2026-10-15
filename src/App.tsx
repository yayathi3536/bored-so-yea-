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
import { HeartRain } from './components/HeartRain';
import { audioEngine } from './utils/audio';
import { Sparkles, Edit3, Check, X, Shield, Cloud, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  fetchUniverseFromSupabase,
  saveUniverseToSupabase,
  updateOwnerPinOnSupabase,
  subscribeToUniverseChanges,
  getSupabaseCredentials,
  testSupabaseConnection,
  migrateLocalContentToSupabase,
  downloadUniverseFromLocalStorage,
} from './utils/supabase';

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
        if (Array.isArray(parsed.memories)) {
          parsed.memories = parsed.memories.map((m: any, idx: number) => {
            if (idx === 0 && (!m.imageUrl || m.imageUrl.includes('/src/assets/') || m.imageUrl.includes('1000080965.jpg'))) {
              return { ...m, imageUrl: '/images/original_memory.jpg' };
            }
            if (typeof m.imageUrl === 'string') {
              const cleaned = m.imageUrl.replace(/^\/bored-so-yea-\//, '/');
              return { ...m, imageUrl: cleaned };
            }
            return m;
          });
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

  const [currentOwnerPin, setCurrentOwnerPin] = useState<string>(() => {
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

  // Cloud status and notification toast
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    tableFound: boolean;
    storageFound: boolean;
    source: 'env' | 'local' | 'none';
  }>({ connected: false, tableFound: false, storageFound: false, source: 'none' });

  // Show cute pastel toast message
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastNotification({ message, type });
    setTimeout(() => {
      setToastNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Discreet flower clicks counter
  const [flowerClicks, setFlowerClicks] = useState(0);
  const flowerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active dataset: uses previewData when in preview mode, else saved data
  const activeData = isPreviewActive && previewData ? previewData : data;

  // Supabase Initial Fetch, Auto-Seed, and Realtime Subscription
  useEffect(() => {
    let isMounted = true;

    const initCloud = async () => {
      const creds = getSupabaseCredentials();
      if (!isMounted) return;
      setSupabaseStatus((prev) => ({ ...prev, source: creds.source }));

      if (creds.source !== 'none') {
        setCloudSyncStatus('syncing');
        try {
          const testRes = await testSupabaseConnection();
          if (!isMounted) return;
          setSupabaseStatus({
            connected: testRes.connected,
            tableFound: testRes.tableFound,
            storageFound: testRes.storageFound,
            source: creds.source,
          });

          // Fetch cloud data
          const { data: cloudData, error } = await fetchUniverseFromSupabase();
          if (!isMounted) return;

          if (cloudData) {
            setData(cloudData);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            } catch {}
            setCloudSyncStatus('synced');
          } else if (!error && testRes.tableFound) {
            // Table exists but is empty: automatically seed with current data
            console.log('Seeding initial website data to Supabase database...');
            await saveUniverseToSupabase(data, storedPin);
            setCloudSyncStatus('synced');
          } else {
            setCloudSyncStatus(testRes.connected ? 'synced' : 'error');
          }
        } catch (err) {
          console.warn('Supabase initialization notice:', err);
          if (isMounted) setCloudSyncStatus('error');
        }
      }
    };

    initCloud();

    // Supabase Realtime channel subscription
    const unsubscribe = subscribeToUniverseChanges((newData) => {
      if (!isMounted) return;
      setData(newData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      } catch {}
      audioEngine.playBlip(1.2);
      showToast('✨ Updated from another device in real-time!', 'success');
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

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
  const handlePinSuccess = (verifiedPin: string) => {
    setCurrentOwnerPin(verifiedPin);
    setIsPinModalOpen(false);
    setIsOwnerModeOpen(true);
  };

  // Update Owner PIN
  const handleUpdatePin = async (newPin: string): Promise<{ success: boolean; message: string }> => {
    setStoredPin(newPin);
    setCurrentOwnerPin(newPin);
    try {
      localStorage.setItem(PIN_STORAGE_KEY, newPin);
    } catch {}

    const result = await updateOwnerPinOnSupabase(currentOwnerPin || storedPin, newPin);
    return result;
  };

  // Save changes to localStorage and Supabase Cloud
  const handleSaveData = async (newData: UniverseData): Promise<{ success: boolean; message: string }> => {
    setData(newData);
    setPreviewData(null);
    setIsPreviewActive(false);

    // Save to local cache first
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    } catch (err) {
      console.warn('LocalStorage save quota notice:', err);
    }

    // Save to Supabase Cloud with verified PIN
    const pinToUse = currentOwnerPin || storedPin;
    const result = await saveUniverseToSupabase(newData, pinToUse);

    if (result.success) {
      setCloudSyncStatus('synced');
      showToast(result.message, 'success');
    } else {
      setCloudSyncStatus('error');
      showToast(result.message, 'error');
    }

    return result;
  };

  // Manually push local edits to Supabase, including uploading all local photos to Supabase Storage
  const handleMigrateToSupabase = async (forceOverwrite: boolean = true): Promise<{ success: boolean; message: string }> => {
    const pinToUse = currentOwnerPin || storedPin;
    setCloudSyncStatus('syncing');
    const result = await migrateLocalContentToSupabase({
      pin: pinToUse,
      forceOverwriteServer: forceOverwrite,
    });
    if (result.success) {
      const refreshed = downloadUniverseFromLocalStorage();
      if (refreshed) setData(refreshed);
      setCloudSyncStatus('synced');
      showToast(result.message, 'success');
    } else {
      setCloudSyncStatus('error');
      showToast(result.message, 'error');
    }
    return result;
  };

  // Manually pull latest from Supabase
  const handleRefreshFromSupabase = async (): Promise<{ success: boolean; message: string }> => {
    const { data: remoteData, error } = await fetchUniverseFromSupabase();
    if (remoteData) {
      setData(remoteData);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
      } catch {}
      setCloudSyncStatus('synced');
      return { success: true, message: 'Loaded latest cloud data from Supabase!' };
    }
    return { success: false, message: error || 'No cloud data found on Supabase.' };
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
  const [heartRainBurstId, setHeartRainBurstId] = useState(0);

  const SCENE_ORDER: SceneId[] = ['opening', 'envelope', 'scrapbook', 'secrets', 'treasure', 'final'];

  const triggerHeartRain = () => {
    setHeartRainBurstId((prev) => prev + 1);
  };

  const handleNextInNavigation = () => {
    const currentIndex = SCENE_ORDER.indexOf(currentScene);
    const nextIdx = (currentIndex + 1) % SCENE_ORDER.length;
    const nextScene = SCENE_ORDER[nextIdx];
    triggerHeartRain();
    changeScene(nextScene, true);
  };

  const changeScene = (nextScene: SceneId, isExplicitNext: boolean = false) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    audioEngine.playChime(1.1);

    const currIdx = SCENE_ORDER.indexOf(currentScene);
    const nextIdx = SCENE_ORDER.indexOf(nextScene);
    if (isExplicitNext || nextIdx > currIdx) {
      triggerHeartRain();
    }

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
    <div className="relative min-h-screen w-full bg-[#FFF8F0] text-[#765563] flex flex-col font-['Quicksand'] selection:bg-[#F8C8DC] selection:text-[#765563] overflow-x-hidden">
      {/* 60fps Floating Daisies, Hearts & Pastel Clouds Background */}
      <DreamyPastelSky
        intensity={skyIntensity}
        enableCursorPetals={true}
        isTransitioning={isTransitioning}
      />

      {/* Screen-wide Heart Rain Particle Effect on Next Navigation */}
      <HeartRain burstId={heartRainBurstId} />

      {/* Floating Preview Banner (Only visible when preview mode is active) */}
      {isPreviewActive && (
        <aside aria-label="Preview Mode" className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md bg-[#FFF8F0]/95 backdrop-blur-md border-2 border-[#F8C8DC] shadow-xl px-3 sm:px-4 py-1.5 sm:py-2 rounded-full flex items-center justify-between gap-1.5 sm:gap-3 animate-fadeIn">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-['Fredoka'] font-semibold text-[#765563] truncate">
            <Sparkles className="w-3.5 h-3.5 text-[#E99AB5] shrink-0" />
            <span className="truncate">Preview Mode</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                setIsPreviewActive(false);
                setIsOwnerModeOpen(true);
              }}
              className="px-2.5 sm:px-3 py-1 rounded-full bg-[#F8C8DC] hover:bg-[#E99AB5]/30 text-[#765563] text-[11px] sm:text-xs font-['Quicksand'] font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3 h-3 text-[#E99AB5]" />
              <span className="hidden xs:inline">Editor</span>
              <span className="xs:hidden">Edit</span>
            </button>

            <button
              onClick={() => {
                if (previewData) handleSaveData(previewData);
              }}
              className="px-2.5 sm:px-3.5 py-1 rounded-full bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] hover:from-[#E99AB5] hover:to-[#F8C8DC] text-[#765563] text-[11px] sm:text-xs font-['Quicksand'] font-bold border border-white flex items-center gap-1 cursor-pointer shadow-xs transition-all"
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

      {/* Top Celestial Navigation */}
      <CelestialNav
        currentScene={currentScene}
        onSelectScene={(scene) => changeScene(scene)}
        onNextScene={handleNextInNavigation}
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
            onEnter={() => changeScene('envelope', true)}
          />
        )}

        {currentScene === 'envelope' && (
          <EnvelopeScene
            greeting={activeData.mainLetter.greeting}
            paragraphs={activeData.mainLetter.paragraphs}
            signature={activeData.mainLetter.signature}
            dateStr={activeData.mainLetter.date}
            onNext={() => changeScene('scrapbook', true)}
          />
        )}

        {currentScene === 'scrapbook' && (
          <ScrapbookScene
            memories={activeData.memories}
            onNext={() => changeScene('secrets', true)}
          />
        )}

        {currentScene === 'secrets' && (
          <SecretsScene
            insideJokes={activeData.insideJokes}
            onNext={() => changeScene('treasure', true)}
          />
        )}

        {currentScene === 'treasure' && (
          <TreasureBoxScene
            letters={activeData.letters}
            recipientName={activeData.recipientName}
            senderName={activeData.senderName}
            onNext={() => changeScene('final', true)}
          />
        )}

        {currentScene === 'final' && (
          <FinalScene
            finalLetter={activeData.finalLetter}
            recipientName={activeData.recipientName}
            senderName={activeData.senderName}
            onRevisitFirst={() => changeScene('opening', true)}
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
        <div className="inline-flex max-w-full flex-wrap justify-center items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#FFF8F0]/90 backdrop-blur-xs border border-[#F8C8DC] text-[11px] sm:text-xs font-['Quicksand'] text-[#765563]/80 shadow-xs">
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
          <div className="text-[11px] text-[#E99AB5] font-bold mt-1.5 tracking-widest animate-fadeIn">
            {'✨ '.repeat(flowerClicks)}
          </div>
        )}
      </footer>

      {/* Realtime Toast Notification */}
      {toastNotification && (
        <aside
          aria-label="Cloud sync notification"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] bg-[#FFF8F0]/95 backdrop-blur-md border-2 border-[#F8C8DC] shadow-xl px-4 py-2.5 rounded-2xl flex items-center gap-2.5 animate-fadeIn text-[#765563]"
        >
          <Sparkles className="w-4 h-4 text-[#E99AB5] shrink-0" />
          <span className="text-xs font-['Quicksand'] font-semibold flex-1">
            {toastNotification.message}
          </span>
          <button
            onClick={() => setToastNotification(null)}
            className="p-1 text-[#765563]/60 hover:text-[#765563] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

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
        currentVerifiedPin={currentOwnerPin}
        onUpdatePin={handleUpdatePin}
        onMigrateToSupabase={handleMigrateToSupabase}
        onRefreshFromSupabase={handleRefreshFromSupabase}
        supabaseStatus={supabaseStatus}
      />
    </div>
  );
}
