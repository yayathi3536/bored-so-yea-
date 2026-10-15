import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, Heart } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface SoundtrackPlayerProps {
  trackName?: string;
  composer?: string;
  customAudioUrl?: string;
}

export const SoundtrackPlayer: React.FC<SoundtrackPlayerProps> = ({
  trackName = 'Heat Waves',
  composer = 'Glass Animals',
  customAudioUrl = '/audio/heat_waves.mp3',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = audioEngine.subscribe((state) => {
      setIsPlaying(state.isPlaying);
      setIsMuted(state.isMuted);
      setVolume(state.volume);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    audioEngine.togglePlay(customAudioUrl);
  };

  const handleMute = () => {
    audioEngine.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    audioEngine.setVolume(val);
  };

  return (
    <aside
      aria-label="Soundtrack Player"
      className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 flex items-center transition-all duration-300 max-w-[calc(100vw-5rem)] sm:max-w-none"
    >
      <div
        className={`flex items-center gap-2 sm:gap-3 backdrop-blur-xl bg-[#FFF8F0]/95 border-2 border-[#F8C8DC] rounded-full px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[0_8px_30px_rgba(248,200,220,0.5),0_2px_8px_rgba(118,85,99,0.06)] transition-all duration-300 ${
          isExpanded ? 'pr-3 sm:pr-4' : ''
        }`}
      >
        {/* Circular Play Button with Soft Rose Pink Gradient */}
        <button
          onClick={handleToggle}
          title={isPlaying ? 'Pause music' : 'Play soundtrack'}
          className="relative group w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gradient-to-tr from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] border border-white flex items-center justify-center text-[#765563] transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
        >
          {/* Animated Soft Ring when playing */}
          {isPlaying && (
            <div className="absolute -inset-1 rounded-full border-2 border-[#E99AB5]/60 animate-ping opacity-60 pointer-events-none" />
          )}

          {isPlaying ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#765563] text-[#765563]" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-[#765563] text-[#765563] ml-0.5" />
          )}
        </button>

        {/* Track Title & Animated Waveform */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer select-none flex flex-col justify-center min-w-[75px] xs:min-w-[95px] sm:min-w-[115px] max-w-[110px] xs:max-w-[130px] sm:max-w-[165px]"
        >
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="text-[11px] sm:text-xs font-['Fredoka'] font-medium text-[#765563] tracking-wide truncate">
              {trackName}
            </span>
            {/* Waveform indicator with pink bars */}
            {isPlaying && (
              <div className="flex items-end gap-0.5 h-2.5 sm:h-3 shrink-0" aria-hidden="true">
                <span className="w-0.5 bg-[#E99AB5] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-1.5 sm:h-2" />
                <span className="w-0.5 bg-[#FF6584] rounded-full animate-[pulse_1.2s_ease-in-out_infinite_0.2s] h-2.5 sm:h-3" />
                <span className="w-0.5 bg-[#E99AB5] rounded-full animate-[pulse_0.9s_ease-in-out_infinite_0.4s] h-1 sm:h-1.5" />
              </div>
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#E99AB5] font-['Quicksand'] font-bold truncate">
            {isPlaying ? composer : 'Tap to listen 🍓'}
          </span>
        </div>

        {/* Mute and Volume controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-l border-[#F8C8DC]/60 pl-1.5 sm:pl-2 shrink-0">
          <button
            onClick={handleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="text-[#765563] hover:text-[#E99AB5] transition-colors p-1 cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </button>

          {/* Collapsible volume slider */}
          {isExpanded && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-12 sm:w-16 h-1 bg-[#F8C8DC] rounded-lg appearance-none cursor-pointer accent-[#E99AB5]"
              title="Volume"
            />
          )}
        </div>
      </div>
    </aside>
  );
};
