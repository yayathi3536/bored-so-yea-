import React, { useState, useEffect, useRef } from 'react';
import { Lock, Heart, X, Eye, EyeOff, Sparkles, KeyRound } from 'lucide-react';
import { audioEngine } from '../utils/audio';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storedPin: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storedPin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg('');
      setIsShaking(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMsg('Please enter your PIN');
      return;
    }

    if (pinInput.trim() === storedPin) {
      audioEngine.playChime(1.2);
      onSuccess();
    } else {
      audioEngine.playBlip(0.6);
      setErrorMsg('Incorrect PIN. Please try again ♡');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#765563]/30 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#FFFDF9] border-2 border-[#FFBFD7] rounded-3xl shadow-2xl p-5 sm:p-6 text-[#765563] transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#765563]/60 hover:text-[#765563] hover:bg-[#FFD6E7]/50 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cute Header Icon */}
        <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#FFD6E7] to-[#FFE0CC] border border-[#FFBFD7] flex items-center justify-center shadow-xs mb-2.5 sm:mb-3">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF85A1]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFD6E7]/50 text-xs font-['Fredoka'] font-medium text-[#765563] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#FF85A1]" />
            <span>Owner Mode Access</span>
          </div>
          <h3 className="font-['Fredoka'] text-lg sm:text-xl font-semibold text-[#765563]">
            Enter Secret PIN
          </h3>
          <p className="font-['Quicksand'] text-[11px] sm:text-xs text-[#765563]/75 mt-1">
            Only for the website owner to customize memories & love notes.
          </p>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPin ? 'text' : 'password'}
              maxLength={12}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="Enter PIN (Default: 1234)"
              className="w-full text-center tracking-widest text-base sm:text-lg font-mono font-bold bg-[#FFF8EF] border-2 border-[#FFBFD7] rounded-2xl py-2.5 sm:py-3 px-8 sm:px-10 text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7] transition-all placeholder:font-['Quicksand'] placeholder:tracking-normal placeholder:text-xs placeholder:text-[#765563]/50"
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#765563]/60 hover:text-[#765563] p-1 cursor-pointer"
              title={showPin ? 'Hide PIN' : 'Show PIN'}
            >
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {errorMsg && (
            <p className="text-center text-xs font-['Quicksand'] text-rose-500 font-semibold animate-pulse">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl border border-[#FFBFD7] text-[#765563] text-xs font-['Quicksand'] font-bold hover:bg-[#FFD6E7]/40 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] text-[#765563] text-xs font-['Quicksand'] font-bold shadow-xs hover:shadow-sm border border-[#FFA3BA] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-[#FF85A1] text-[#FF85A1]" />
              <span>Unlock Editor</span>
            </button>
          </div>
        </form>

        {/* Discreet PIN Hint */}
        <div className="mt-3.5 sm:mt-4 pt-3 border-t border-[#FFBFD7]/40 text-center">
          <p className="text-[10px] sm:text-[11px] font-['Quicksand'] text-[#765563]/60 flex items-center justify-center gap-1">
            <KeyRound className="w-3 h-3 text-[#FF85A1]" />
            <span>Default PIN is <strong className="text-[#765563]">1234</strong>. You can change it inside.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
