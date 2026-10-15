import React, { useState, useEffect, useRef } from 'react';
import { Lock, Heart, X, Eye, EyeOff, Sparkles, KeyRound, Loader2, ShieldCheck, Mail, LogIn, UserPlus } from 'lucide-react';
import { audioEngine } from '../utils/audio';
import { getSupabase, getCurrentAdminUser, adminSignIn, adminSignUp } from '../utils/supabase';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verifiedPin: string) => void;
  storedPin: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  storedPin,
}) => {
  const [authMode, setAuthMode] = useState<'auth' | 'pin'>('auth');
  const [adminEmail, setAdminEmail] = useState('karanamyayathi9@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<string | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setAdminPassword('');
      setErrorMsg('');
      setSuccessMsg('');
      setIsShaking(false);
      setIsVerifying(false);

      // Check if user is already signed in via Supabase Auth
      getCurrentAdminUser().then((user) => {
        if (user?.email) {
          setCurrentAdmin(user.email);
        } else {
          setCurrentAdmin(null);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdminAuthSubmit = async (e: React.FormEvent, isSignUp = false) => {
    e.preventDefault();
    if (!adminEmail.trim()) {
      setErrorMsg('Please enter your administrator email.');
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (isSignUp) {
      const res = await adminSignUp(adminEmail, adminPassword);
      setIsVerifying(false);
      if (res.error) {
        setErrorMsg(`Sign up error: ${res.error}`);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      } else if (res.confirmationSent) {
        setSuccessMsg('Account created! If confirmation email was sent, please verify it or check Supabase Auth settings.');
      } else if (res.user) {
        audioEngine.playChime(1.2);
        setCurrentAdmin(res.user.email || adminEmail);
        setSuccessMsg('Admin account created and authenticated! ✨');
        setTimeout(() => onSuccess(storedPin), 700);
      }
    } else {
      const res = await adminSignIn(adminEmail, adminPassword);
      setIsVerifying(false);
      if (res.error) {
        setErrorMsg(`Sign in failed: ${res.error}`);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      } else if (res.user) {
        audioEngine.playChime(1.2);
        setCurrentAdmin(res.user.email || adminEmail);
        onSuccess(storedPin);
      }
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinInput.trim();
    if (!pin) {
      setErrorMsg('Please enter your PIN');
      return;
    }

    setIsVerifying(true);

    // 1. First check local PIN
    if (pin === storedPin) {
      audioEngine.playChime(1.2);
      setIsVerifying(false);
      onSuccess(pin);
      return;
    }

    // 2. Also check with Supabase RPC verify_owner_pin if backend is configured
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data: isValid, error } = await supabase.rpc('verify_owner_pin', { check_pin: pin });
        if (!error && isValid === true) {
          audioEngine.playChime(1.2);
          setIsVerifying(false);
          onSuccess(pin);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend PIN verification check notice:', err);
    }

    setIsVerifying(false);
    audioEngine.playBlip(0.6);
    setErrorMsg('Incorrect PIN. Please try again ♡');
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#765563]/30 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-[#FFF8F0] border-2 border-[#F8C8DC] rounded-3xl shadow-2xl p-5 sm:p-6 text-[#765563] transition-transform ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-[#765563]/60 hover:text-[#765563] hover:bg-[#F8C8DC]/50 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#F8C8DC] to-[#FFD8C2] border border-[#F8C8DC] flex items-center justify-center shadow-xs mb-2.5 sm:mb-3">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-[#E99AB5]" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F8C8DC]/50 text-xs font-['Fredoka'] font-medium text-[#765563] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#E99AB5]" />
            <span>Owner Mode Access</span>
          </div>
          <h3 className="font-['Fredoka'] text-lg sm:text-xl font-semibold text-[#765563]">
            Owner & Admin Access
          </h3>
          <p className="font-['Quicksand'] text-[11px] sm:text-xs text-[#765563]/75 mt-0.5">
            Authenticate to customize memories & synchronize photos.
          </p>
        </div>

        {/* Already Logged In Banner */}
        {currentAdmin && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-['Quicksand'] font-bold text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Signed in as Admin:</span>
            </div>
            <p className="text-xs font-mono text-emerald-900 truncate pl-6 font-semibold">{currentAdmin}</p>
            <button
              onClick={() => {
                audioEngine.playChime(1.2);
                onSuccess(storedPin);
              }}
              className="mt-1 w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-['Fredoka'] text-xs font-bold rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              Enter Owner Mode (Authenticated) ✨
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-[#F8C8DC]/35 p-1 mb-4 text-xs font-['Fredoka']">
          <button
            type="button"
            onClick={() => {
              setAuthMode('auth');
              setErrorMsg('');
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              authMode === 'auth'
                ? 'bg-white text-[#765563] font-bold shadow-xs'
                : 'text-[#765563]/70 hover:text-[#765563]'
            }`}
          >
            Supabase Auth
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('pin');
              setErrorMsg('');
              setTimeout(() => pinInputRef.current?.focus(), 100);
            }}
            className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
              authMode === 'pin'
                ? 'bg-white text-[#765563] font-bold shadow-xs'
                : 'text-[#765563]/70 hover:text-[#765563]'
            }`}
          >
            PIN Quick Unlock
          </button>
        </div>

        {/* Tab 1: Supabase Auth Form */}
        {authMode === 'auth' && (
          <form onSubmit={(e) => handleAdminAuthSubmit(e, false)} className="space-y-3">
            <div>
              <label className="block text-[11px] font-['Quicksand'] font-bold text-[#765563] mb-1">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full text-xs font-['Quicksand'] bg-[#FFF8F0] border border-[#F8C8DC] rounded-xl py-2 pl-8 pr-3 text-[#765563] focus:outline-none focus:border-[#E99AB5]"
                />
                <Mail className="w-3.5 h-3.5 text-[#E99AB5] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-['Quicksand'] font-bold text-[#765563] mb-1">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter Supabase password"
                  required
                  className="w-full text-xs font-['Quicksand'] bg-[#FFF8F0] border border-[#F8C8DC] rounded-xl py-2 pl-8 pr-9 text-[#765563] focus:outline-none focus:border-[#E99AB5]"
                />
                <Lock className="w-3.5 h-3.5 text-[#E99AB5] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#765563]/50 hover:text-[#765563] p-0.5"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-center text-xs font-['Quicksand'] text-rose-500 font-semibold animate-pulse">
                {errorMsg}
              </p>
            )}

            {successMsg && (
              <p className="text-center text-xs font-['Quicksand'] text-emerald-600 font-semibold">
                {successMsg}
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] hover:from-[#E99AB5] hover:to-[#F8C8DC] text-[#765563] text-xs font-['Quicksand'] font-bold shadow-xs border border-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5 text-[#E99AB5]" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isVerifying}
                onClick={(e) => handleAdminAuthSubmit(e, true)}
                className="py-2 px-3 rounded-xl border border-[#F8C8DC] bg-white hover:bg-[#F8C8DC]/30 text-[#765563] text-xs font-['Quicksand'] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Create this admin account in Supabase project"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#E99AB5]" />
                <span>Register</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Quick PIN Form */}
        {authMode === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-3.5">
            <div className="relative">
              <input
                ref={pinInputRef}
                type={showPin ? 'text' : 'password'}
                maxLength={12}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="Enter PIN (Default: 1234)"
                className="w-full text-center tracking-widest text-base font-mono font-bold bg-[#FFF8F0] border-2 border-[#F8C8DC] rounded-2xl py-2.5 px-8 text-[#765563] focus:outline-none focus:border-[#E99AB5] focus:ring-2 focus:ring-[#F8C8DC] transition-all placeholder:font-['Quicksand'] placeholder:tracking-normal placeholder:text-xs placeholder:text-[#765563]/50"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#765563]/60 hover:text-[#765563] p-1 cursor-pointer"
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
                className="flex-1 py-2 px-3 rounded-xl border border-[#F8C8DC] text-[#765563] text-xs font-['Quicksand'] font-bold hover:bg-[#F8C8DC]/40 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVerifying}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#F8C8DC] via-[#FFD8C2] to-[#FFF0B3] hover:from-[#E99AB5] hover:to-[#F8C8DC] text-[#765563] text-xs font-['Quicksand'] font-bold shadow-xs hover:shadow-sm border border-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 fill-[#FF6584] text-[#FF6584]" />
                    <span>Unlock</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer Hint */}
        <div className="mt-3.5 pt-3 border-t border-[#F8C8DC]/50 text-center">
          <p className="text-[10px] font-['Quicksand'] text-[#765563]/65 flex items-center justify-center gap-1">
            <KeyRound className="w-3 h-3 text-[#E99AB5]" />
            <span>Default PIN is <strong className="text-[#765563]">1234</strong>. Supabase Auth enables cloud saving.</span>
          </p>
        </div>
      </div>
    </div>
  );
};
