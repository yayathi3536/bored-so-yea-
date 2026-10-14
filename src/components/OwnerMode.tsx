import React, { useState, useEffect } from 'react';
import { UniverseData, MemoryItem, InsideJokeItem, LetterItem } from '../types';
import {
  X,
  Save,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Heart,
  Camera,
  BookOpen,
  Mail,
  KeyRound,
  Info,
  Eye,
  Check,
  AlertCircle,
  HelpCircle,
  Shield,
  Music,
} from 'lucide-react';
import { audioEngine } from '../utils/audio';
import { resolveAssetUrl } from '../utils/assetPath';

interface OwnerModeProps {
  data: UniverseData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newData: UniverseData) => void;
  onPreview: (previewData: UniverseData) => void;
  onReset: () => void;
  storedPin: string;
  onUpdatePin: (newPin: string) => void;
}

type TabType =
  | 'names'
  | 'opening'
  | 'mainLetter'
  | 'memories'
  | 'jokes'
  | 'letters'
  | 'final'
  | 'soundtrack'
  | 'security'
  | 'backup';

export const OwnerMode: React.FC<OwnerModeProps> = ({
  data,
  isOpen,
  onClose,
  onSave,
  onPreview,
  onReset,
  storedPin,
  onUpdatePin,
}) => {
  const [formData, setFormData] = useState<UniverseData>(data);
  const [activeTab, setActiveTab] = useState<TabType>('names');
  const [savedBanner, setSavedBanner] = useState(false);

  // PIN settings state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync internal formData when opened with latest data
  useEffect(() => {
    if (isOpen) {
      setFormData(data);
      setSavedBanner(false);
      setPinFeedback(null);
      setNewPin('');
      setConfirmPin('');
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleSave = () => {
    audioEngine.playChime(1.2);
    onSave(formData);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handlePreview = () => {
    audioEngine.playBlip(1.1);
    onPreview(formData);
  };

  const handleExportJSON = () => {
    audioEngine.playBlip(1.0);
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(formData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `romantic-website-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.recipientName && parsed.mainLetter) {
          setFormData(parsed);
          onSave(parsed);
          audioEngine.playChime(1.3);
          alert('✨ Backup restored successfully! All custom memories have been loaded.');
        } else {
          alert('Invalid romantic universe backup format.');
        }
      } catch {
        alert('Could not parse JSON file. Please ensure it is a valid backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleImageUpload = (memoryIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('Photo is too large (over 8MB). Please choose a smaller photo for optimal performance.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const updated = [...formData.memories];
      updated[memoryIndex].imageUrl = base64Url;
      setFormData({ ...formData, memories: updated });
      audioEngine.playBlip(1.2);
    };
    reader.readAsDataURL(file);
  };

  const handleAddMemory = () => {
    const newMemory: MemoryItem = {
      id: `mem-${Date.now()}`,
      title: 'Our Sweet Memory ♡',
      date: 'A lovely day',
      location: 'Together',
      description: 'A sweet caption describing this precious moment.',
      story: 'The full story of what happened on this unforgettable day...',
      imageUrl: '/images/original_memory.jpg',
      tags: ['Love', 'Sweet'],
      rotationDeg: Number(((Math.random() - 0.5) * 4).toFixed(1)),
    };
    setFormData({
      ...formData,
      memories: [...formData.memories, newMemory],
    });
    audioEngine.playBlip(1.1);
  };

  const handleDeleteMemory = (id: string) => {
    setFormData({
      ...formData,
      memories: formData.memories.filter((m) => m.id !== id),
    });
  };

  const handleAddJoke = () => {
    const newJoke: InsideJokeItem = {
      id: `joke-${Date.now()}`,
      symbol: '🧸',
      title: 'Our Secret Inside Joke',
      clue: 'Remember when...?',
      revelation: 'The real story we still laugh about!',
      personalNote: 'Forever one of my favorite moments with you ♡',
    };
    setFormData({
      ...formData,
      insideJokes: [...formData.insideJokes, newJoke],
    });
    audioEngine.playBlip(1.1);
  };

  const handleDeleteJoke = (id: string) => {
    setFormData({
      ...formData,
      insideJokes: formData.insideJokes.filter((j) => j.id !== id),
    });
  };

  const handleAddLetter = () => {
    const newLetter: LetterItem = {
      id: `letter-${Date.now()}`,
      category: 'Special Note',
      title: 'A Little Note for You',
      envelopeColor: 'parchment',
      content: [
        'My dearest,',
        'Every single day with you is my favorite adventure. Thank you for being you.',
      ],
      postscript: 'With all my love, forever.',
    };
    setFormData({
      ...formData,
      letters: [...formData.letters, newLetter],
    });
    audioEngine.playBlip(1.1);
  };

  const handleDeleteLetter = (id: string) => {
    setFormData({
      ...formData,
      letters: formData.letters.filter((l) => l.id !== id),
    });
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim()) {
      setPinFeedback({ type: 'error', message: 'PIN cannot be empty' });
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setPinFeedback({ type: 'error', message: 'PINs do not match' });
      return;
    }
    onUpdatePin(newPin.trim());
    setPinFeedback({ type: 'success', message: 'PIN updated successfully! Remember your new PIN.' });
    setNewPin('');
    setConfirmPin('');
    audioEngine.playChime(1.3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 xs:p-2 sm:p-4 md:p-6 bg-[#765563]/40 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[95vh] sm:h-[92vh] bg-[#FFFDF9] border-2 border-[#FFBFD7] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#765563]">
        {/* Top Header */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#FFBFD7]/60 flex items-center justify-between gap-2 bg-gradient-to-r from-[#FFF8EF] via-[#FFD6E7]/25 to-[#FFF8EF]">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFD6E7] flex items-center justify-center text-xs sm:text-sm border border-[#FFBFD7] shrink-0">
              🎀
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="font-['Fredoka'] text-sm sm:text-lg font-semibold text-[#765563] truncate">
                  Owner Mode Editor
                </h2>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-[#FFD6E7] text-[#765563] font-bold shrink-0">
                  Private
                </span>
              </div>
              <p className="font-['Quicksand'] text-[11px] text-[#765563]/70 hidden sm:block truncate">
                Customize love letters, scrapbook photos, and special memories without touching code.
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {savedBanner && (
              <span className="hidden md:inline-flex items-center gap-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 animate-fadeIn">
                <Check className="w-3.5 h-3.5" />
                Saved!
              </span>
            )}

            <button
              onClick={handlePreview}
              title="Preview changes on website"
              className="px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-[#FFE0CC]/50 border border-[#FFBFD7] text-[#765563] font-['Quicksand'] text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#FF85A1]" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button
              onClick={handleSave}
              title="Save changes to localStorage"
              className="px-2.5 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-[#765563] font-['Quicksand'] text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-all"
            >
              <Save className="w-3.5 h-3.5 text-[#765563]" />
              <span>Save</span>
            </button>

            <button
              onClick={onClose}
              title="Cancel & Close"
              className="p-1 sm:p-1.5 rounded-full text-[#765563]/70 hover:text-[#765563] hover:bg-[#FFD6E7]/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto px-2.5 sm:px-6 py-2 sm:py-2.5 border-b border-[#FFBFD7]/40 bg-[#FFF8EF] text-xs font-['Quicksand'] font-bold select-none scrollbar-none touch-pan-x">
          {[
            { id: 'names', label: 'Names & Met', icon: '💖' },
            { id: 'opening', label: 'Opening Scene', icon: '🌸' },
            { id: 'mainLetter', label: 'Main Letter', icon: '💌' },
            { id: 'memories', label: `Scrapbook (${formData.memories.length})`, icon: '📷' },
            { id: 'jokes', label: `Keepsakes (${formData.insideJokes.length})`, icon: '🧸' },
            { id: 'letters', label: `Letter Box (${formData.letters.length})`, icon: '🎀' },
            { id: 'final', label: 'Sunset Letter', icon: '🌅' },
            { id: 'soundtrack', label: 'Soundtrack', icon: '🎵' },
            { id: 'security', label: 'PIN & Limitations', icon: '🔒' },
            { id: 'backup', label: 'Backup / Sync', icon: '📦' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] text-[#765563] border border-[#FFA3BA] shadow-xs scale-102'
                  : 'text-[#765563]/80 hover:text-[#765563] hover:bg-[#FFD6E7]/40'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Body Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#FFFDF9]">
          {/* TAB: Names & Dates */}
          {activeTab === 'names' && (
            <div className="space-y-5 max-w-2xl">
              <div className="p-3.5 rounded-2xl bg-[#FFD6E7]/30 border border-[#FFBFD7] text-xs font-['Quicksand'] text-[#765563] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF85A1] shrink-0" />
                <span>
                  These names personalize the navigation bar, love letters, and final sunrise wishes.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#765563] mb-1.5">
                    Recipient's Name or Nickname ♡
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#765563] mb-1.5">
                    Your Name (Sender)
                  </label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#765563] mb-1.5">
                    Where you first met
                  </label>
                  <input
                    type="text"
                    value={formData.firstMetLocation}
                    onChange={(e) => setFormData({ ...formData, firstMetLocation: e.target.value })}
                    className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#765563] mb-1.5">
                    Anniversary / Special Date
                  </label>
                  <input
                    type="text"
                    value={formData.anniversaryDate}
                    onChange={(e) => setFormData({ ...formData, anniversaryDate: e.target.value })}
                    className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Opening Scene */}
          {activeTab === 'opening' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Opening First Line
                </label>
                <input
                  type="text"
                  value={formData.opening.lead}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      opening: { ...formData.opening, lead: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Opening Second Line
                </label>
                <input
                  type="text"
                  value={formData.opening.sub}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      opening: { ...formData.opening, sub: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Opening Button Label
                </label>
                <input
                  type="text"
                  value={formData.opening.buttonText}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      opening: { ...formData.opening, buttonText: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>
            </div>
          )}

          {/* TAB: Main Love Letter */}
          {activeTab === 'mainLetter' && (
            <div className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#765563] mb-1.5">
                    Letter Greeting
                  </label>
                  <input
                    type="text"
                    value={formData.mainLetter.greeting}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainLetter: { ...formData.mainLetter, greeting: e.target.value },
                      })
                    }
                    className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#765563] mb-1.5">
                    Date Line
                  </label>
                  <input
                    type="text"
                    value={formData.mainLetter.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainLetter: { ...formData.mainLetter, date: e.target.value },
                      })
                    }
                    className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#765563]">
                    Love Letter Paragraphs ({formData.mainLetter.paragraphs.length})
                  </label>
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        mainLetter: {
                          ...formData.mainLetter,
                          paragraphs: [...formData.mainLetter.paragraphs, 'New heartfelt paragraph...'],
                        },
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#FFD6E7] hover:bg-[#FFBFD7] text-[#765563] text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Paragraph</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.mainLetter.paragraphs.map((para, pIdx) => (
                    <div key={pIdx} className="relative">
                      <textarea
                        rows={3}
                        value={para}
                        onChange={(e) => {
                          const updated = [...formData.mainLetter.paragraphs];
                          updated[pIdx] = e.target.value;
                          setFormData({
                            ...formData,
                            mainLetter: { ...formData.mainLetter, paragraphs: updated },
                          });
                        }}
                        className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl p-3 pr-10 text-sm font-['Quicksand'] text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                      />
                      {formData.mainLetter.paragraphs.length > 1 && (
                        <button
                          onClick={() => {
                            setFormData({
                              ...formData,
                              mainLetter: {
                                ...formData.mainLetter,
                                paragraphs: formData.mainLetter.paragraphs.filter((_, i) => i !== pIdx),
                              },
                            });
                          }}
                          title="Delete paragraph"
                          className="absolute right-2.5 top-2.5 text-[#765563]/50 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Signature
                </label>
                <input
                  type="text"
                  value={formData.mainLetter.signature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mainLetter: { ...formData.mainLetter, signature: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>
            </div>
          )}

          {/* TAB: Scrapbook Memories */}
          {activeTab === 'memories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-[#FFF8EF] p-4 rounded-2xl border border-[#FFBFD7]">
                <div>
                  <h3 className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                    Polaroid Scrapbook Memories ({formData.memories.length})
                  </h3>
                  <p className="text-xs text-[#765563]/70 font-['Quicksand']">
                    Add photos, write cute handwritten captions, and share your memorable moments.
                  </p>
                </div>
                <button
                  onClick={handleAddMemory}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-[#765563] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Memory Polaroid</span>
                </button>
              </div>

              <div className="space-y-5">
                {formData.memories.map((mem, idx) => (
                  <div
                    key={mem.id}
                    className="p-5 rounded-2xl bg-[#FFF8EF] border-2 border-[#FFBFD7] space-y-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#FFBFD7]/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#FFD6E7] text-xs font-bold flex items-center justify-center text-[#765563]">
                          #{idx + 1}
                        </span>
                        <span className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                          {mem.title || 'Untitled Memory'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="text-[#765563]/60 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left: Photo preview & upload */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-[#765563]">
                          Polaroid Photo
                        </label>
                        <div className="w-full aspect-square max-w-[200px] rounded-xl overflow-hidden border-2 border-[#FFBFD7] bg-white relative group shadow-inner">
                          {mem.imageUrl ? (
                            <img
                              src={resolveAssetUrl(mem.imageUrl)}
                              alt={mem.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#765563]/40 text-xs">
                              No photo selected
                            </div>
                          )}
                        </div>

                        {/* Local File Picker */}
                        <div className="pt-1">
                          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFD6E7]/50 border border-[#FFBFD7] text-xs font-['Quicksand'] font-bold text-[#765563] cursor-pointer shadow-xs transition-colors">
                            <Camera className="w-3.5 h-3.5 text-[#FF85A1]" />
                            <span>Upload from Device</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(idx, e)}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-[#765563]/60 mt-1">
                            Pick any photo from phone/laptop!
                          </p>
                        </div>

                        {/* Or URL */}
                        <div className="pt-1">
                          <label className="block text-[11px] font-bold text-[#765563]/80 mb-1">
                            Or Image URL
                          </label>
                          <input
                            type="text"
                            value={mem.imageUrl}
                            placeholder="https://... or /images/..."
                            onChange={(e) => {
                              const updated = [...formData.memories];
                              updated[idx].imageUrl = e.target.value;
                              setFormData({ ...formData, memories: updated });
                            }}
                            className="w-full bg-white border border-[#FFBFD7] rounded-lg px-2.5 py-1.5 text-xs text-[#765563]"
                          />
                        </div>
                      </div>

                      {/* Right: Details & Story */}
                      <div className="md:col-span-2 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-[#765563] mb-1">
                              Memory Title
                            </label>
                            <input
                              type="text"
                              value={mem.title}
                              onChange={(e) => {
                                const updated = [...formData.memories];
                                updated[idx].title = e.target.value;
                                setFormData({ ...formData, memories: updated });
                              }}
                              className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs font-semibold text-[#765563]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-[#765563] mb-1">
                              Date / Moment
                            </label>
                            <input
                              type="text"
                              value={mem.date}
                              onChange={(e) => {
                                const updated = [...formData.memories];
                                updated[idx].date = e.target.value;
                                setFormData({ ...formData, memories: updated });
                              }}
                              className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs font-semibold text-[#765563]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#765563] mb-1">
                            Polaroid Caption (Shown on scrapbook frame)
                          </label>
                          <input
                            type="text"
                            value={mem.description}
                            onChange={(e) => {
                              const updated = [...formData.memories];
                              updated[idx].description = e.target.value;
                              setFormData({ ...formData, memories: updated });
                            }}
                            placeholder="Sweet handwritten caption..."
                            className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs text-[#765563]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#765563] mb-1">
                            Full Story (Shown in the pop-up modal when clicked)
                          </label>
                          <textarea
                            rows={3}
                            value={mem.story}
                            onChange={(e) => {
                              const updated = [...formData.memories];
                              updated[idx].story = e.target.value;
                              setFormData({ ...formData, memories: updated });
                            }}
                            placeholder="Tell the full sweet story of what made this moment special..."
                            className="w-full bg-white border border-[#FFBFD7] rounded-xl p-3 text-xs text-[#765563]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Keepsakes & Inside Jokes */}
          {activeTab === 'jokes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-[#FFF8EF] p-4 rounded-2xl border border-[#FFBFD7]">
                <div>
                  <h3 className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                    Inside Jokes & Keepsakes ({formData.insideJokes.length})
                  </h3>
                  <p className="text-xs text-[#765563]/70 font-['Quicksand']">
                    Little moments and shared secrets that only the two of you understand.
                  </p>
                </div>
                <button
                  onClick={handleAddJoke}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-[#765563] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Inside Joke</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.insideJokes.map((joke, idx) => (
                  <div
                    key={joke.id}
                    className="p-5 rounded-2xl bg-[#FFF8EF] border-2 border-[#FFBFD7] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#FFBFD7]/60 pb-2">
                      <span className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                        Keepsake #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteJoke(joke.id)}
                        className="text-[#765563]/60 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-xs font-bold text-[#765563] mb-1">
                          Symbol / Emoji
                        </label>
                        <input
                          type="text"
                          value={joke.symbol}
                          onChange={(e) => {
                            const updated = [...formData.insideJokes];
                            updated[idx].symbol = e.target.value;
                            setFormData({ ...formData, insideJokes: updated });
                          }}
                          className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-center text-lg"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-[#765563] mb-1">
                          Joke Title
                        </label>
                        <input
                          type="text"
                          value={joke.title}
                          onChange={(e) => {
                            const updated = [...formData.insideJokes];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, insideJokes: updated });
                          }}
                          className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs font-semibold text-[#765563]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#765563] mb-1">
                        Teaser Clue
                      </label>
                      <input
                        type="text"
                        value={joke.clue}
                        onChange={(e) => {
                          const updated = [...formData.insideJokes];
                          updated[idx].clue = e.target.value;
                          setFormData({ ...formData, insideJokes: updated });
                        }}
                        className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs text-[#765563]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#765563] mb-1">
                        The Revelation / Punchline
                      </label>
                      <textarea
                        rows={2}
                        value={joke.revelation}
                        onChange={(e) => {
                          const updated = [...formData.insideJokes];
                          updated[idx].revelation = e.target.value;
                          setFormData({ ...formData, insideJokes: updated });
                        }}
                        className="w-full bg-white border border-[#FFBFD7] rounded-xl p-3 text-xs text-[#765563]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#765563] mb-1">
                        Personal Note
                      </label>
                      <input
                        type="text"
                        value={joke.personalNote}
                        onChange={(e) => {
                          const updated = [...formData.insideJokes];
                          updated[idx].personalNote = e.target.value;
                          setFormData({ ...formData, insideJokes: updated });
                        }}
                        className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs text-[#765563]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Letter Box */}
          {activeTab === 'letters' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-[#FFF8EF] p-4 rounded-2xl border border-[#FFBFD7]">
                <div>
                  <h3 className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                    Love Letters in the Treasure Box ({formData.letters.length})
                  </h3>
                  <p className="text-xs text-[#765563]/70 font-['Quicksand']">
                    The intimate letters tucked inside ribbons in the secret treasure box.
                  </p>
                </div>
                <button
                  onClick={handleAddLetter}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-[#765563] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Letter</span>
                </button>
              </div>

              <div className="space-y-5">
                {formData.letters.map((letter, idx) => (
                  <div
                    key={letter.id}
                    className="p-5 rounded-2xl bg-[#FFF8EF] border-2 border-[#FFBFD7] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#FFBFD7]/60 pb-2">
                      <span className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                        Letter #{idx + 1}: {letter.title}
                      </span>
                      <button
                        onClick={() => handleDeleteLetter(letter.id)}
                        className="text-[#765563]/60 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#765563] mb-1">
                          Letter Title
                        </label>
                        <input
                          type="text"
                          value={letter.title}
                          onChange={(e) => {
                            const updated = [...formData.letters];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, letters: updated });
                          }}
                          className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs font-semibold text-[#765563]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#765563] mb-1">
                          Category / Occasion
                        </label>
                        <input
                          type="text"
                          value={letter.category}
                          onChange={(e) => {
                            const updated = [...formData.letters];
                            updated[idx].category = e.target.value;
                            setFormData({ ...formData, letters: updated });
                          }}
                          placeholder="e.g. When you miss me"
                          className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs text-[#765563]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#765563] mb-1">
                          Envelope Color Theme
                        </label>
                        <select
                          value={letter.envelopeColor}
                          onChange={(e) => {
                            const updated = [...formData.letters];
                            updated[idx].envelopeColor = e.target.value as any;
                            setFormData({ ...formData, letters: updated });
                          }}
                          className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs text-[#765563] font-semibold"
                        >
                          <option value="parchment">Parchment Warm (Peach)</option>
                          <option value="crimson">Crimson Rose (Pink)</option>
                          <option value="navy">Lavender Dream (Purple)</option>
                          <option value="emerald">Mint Sage (Green)</option>
                          <option value="amber">Peach Glow (Warm)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#765563] mb-1">
                        Optional Postscript / P.S.
                      </label>
                      <input
                        type="text"
                        value={letter.postscript || ''}
                        onChange={(e) => {
                          const updated = [...formData.letters];
                          updated[idx].postscript = e.target.value;
                          setFormData({ ...formData, letters: updated });
                        }}
                        placeholder="P.S. I love you more than all the stars..."
                        className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-xs text-[#765563]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#765563] mb-1">
                        Letter Body (paragraphs joined by newlines)
                      </label>
                      <textarea
                        rows={4}
                        value={letter.content.join('\n\n')}
                        onChange={(e) => {
                          const updated = [...formData.letters];
                          updated[idx].content = e.target.value.split('\n\n');
                          setFormData({ ...formData, letters: updated });
                        }}
                        className="w-full bg-white border border-[#FFBFD7] rounded-xl p-3 text-xs text-[#765563]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Final Surprise */}
          {activeTab === 'final' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Final Scene Title
                </label>
                <input
                  type="text"
                  value={formData.finalLetter.title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      finalLetter: { ...formData.finalLetter, title: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Final Letter Body
                </label>
                <textarea
                  rows={5}
                  value={formData.finalLetter.paragraphs.join('\n\n')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      finalLetter: {
                        ...formData.finalLetter,
                        paragraphs: e.target.value.split('\n\n'),
                      },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl p-3 text-xs font-['Quicksand'] text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Final Sign-off Words
                </label>
                <input
                  type="text"
                  value={formData.finalLetter.finalWords}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      finalLetter: { ...formData.finalLetter, finalWords: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>
            </div>
          )}

          {/* TAB: Soundtrack */}
          {activeTab === 'soundtrack' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Track Name
                </label>
                <input
                  type="text"
                  value={formData.soundtrack.trackName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soundtrack: { ...formData.soundtrack, trackName: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Composer / Artist
                </label>
                <input
                  type="text"
                  value={formData.soundtrack.composer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soundtrack: { ...formData.soundtrack, composer: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#765563] mb-1.5">
                  Audio URL (MP3 stream or custom file)
                </label>
                <input
                  type="text"
                  value={formData.soundtrack.audioUrl}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soundtrack: { ...formData.soundtrack, audioUrl: e.target.value },
                    })
                  }
                  className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-xl px-3.5 py-2.5 text-xs text-[#765563] focus:outline-none focus:border-[#FF85A1] focus:ring-2 focus:ring-[#FFD6E7]"
                />
              </div>
            </div>
          )}

          {/* TAB: Security & Limitations */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              {/* Change PIN Form */}
              <div className="p-5 rounded-2xl bg-[#FFF8EF] border-2 border-[#FFBFD7] space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#FF85A1]" />
                  <h3 className="font-['Fredoka'] text-base font-semibold text-[#765563]">
                    Change Owner PIN
                  </h3>
                </div>
                <p className="text-xs font-['Quicksand'] text-[#765563]/80">
                  Current PIN is: <strong className="text-[#765563] font-mono">{storedPin}</strong>
                </p>

                <form onSubmit={handleSavePin} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#765563] mb-1">
                        New PIN
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="e.g. 2024 or love"
                        className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-sm text-[#765563] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#765563] mb-1">
                        Confirm New PIN
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="Re-enter new PIN"
                        className="w-full bg-white border border-[#FFBFD7] rounded-xl px-3 py-2 text-sm text-[#765563] font-mono font-bold"
                      />
                    </div>
                  </div>

                  {pinFeedback && (
                    <p
                      className={`text-xs font-semibold ${
                        pinFeedback.type === 'success' ? 'text-emerald-600' : 'text-rose-500'
                      }`}
                    >
                      {pinFeedback.message}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-[#765563] text-xs font-bold cursor-pointer transition-all shadow-xs"
                  >
                    Update Secret PIN
                  </button>
                </form>
              </div>

              {/* Clear Technical Limitations Callout */}
              <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-200/80 space-y-3 text-[#765563]">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <h4 className="font-['Fredoka'] text-sm font-semibold text-amber-900">
                    Important Limitations Notice (How It Works)
                  </h4>
                </div>
                <div className="text-xs space-y-2 leading-relaxed font-['Quicksand'] text-amber-950">
                  <p>
                    <strong>1. Browser LocalStorage:</strong> Edits you make here are saved directly
                    inside your current browser's storage. They will stay intact when you refresh or
                    reopen the page in this same browser.
                  </p>
                  <p>
                    <strong>2. Cross-Device Synchronization:</strong> Because this site runs with no
                    external databases or accounts (per your privacy requirement), changes made on
                    your phone or laptop do <em>not</em> automatically transmit to a different device.
                    To show your edits on your girlfriend's phone, you can either open it together on
                    your device, or use the <strong>Export Backup (.json)</strong> feature in the
                    Backup tab and import it on her device!
                  </p>
                  <p>
                    <strong>3. PIN Privacy:</strong> The secret PIN provides friendly privacy on
                    shared screens so visitors don't accidentally open editor tools. It is a
                    convenience lock rather than military-grade banking cryptography.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Backup / Sync */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-2xl">
              <div className="p-5 rounded-2xl bg-[#FFF8EF] border-2 border-[#FFBFD7] space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF85A1]" />
                  <h4 className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                    Export & Import Your Romantic Universe
                  </h4>
                </div>
                <p className="text-xs font-['Quicksand'] text-[#765563]/80 leading-relaxed">
                  Download a backup file containing all your customized text, photos, polaroids, and
                  letters. You can keep this safe on your computer or import it onto another device!
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleExportJSON}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-[#765563] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Backup (.json)</span>
                  </button>

                  <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-[#FFD6E7]/50 border border-[#FFBFD7] text-[#765563] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-4 h-4 text-[#FF85A1]" />
                    <span>Restore from Backup File</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportJSON}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[#FFBFD7]/50">
                <button
                  onClick={() => {
                    if (
                      confirm(
                        'Are you sure you want to reset everything back to the original default romantic configuration?'
                      )
                    ) {
                      onReset();
                    }
                  }}
                  className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset everything to original defaults</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-t border-[#FFBFD7]/60 bg-[#FFF8EF] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-['Quicksand'] text-[#765563]/70 shrink-0">
            <Shield className="w-3.5 h-3.5 text-[#FF85A1]" />
            <span className="hidden sm:inline">Owner Mode active</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 justify-end w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-2 rounded-xl border border-[#FFBFD7] text-[#765563] font-['Quicksand'] text-xs font-bold hover:bg-[#FFD6E7]/40 transition-colors cursor-pointer"
            >
              <span className="hidden xs:inline">Cancel / Close</span>
              <span className="xs:hidden">Cancel</span>
            </button>
            <button
              onClick={handlePreview}
              className="px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-[#FFE0CC]/50 border border-[#FFBFD7] text-[#765563] font-['Quicksand'] text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#FF85A1]" />
              <span className="hidden sm:inline">Preview Live Site</span>
              <span className="sm:hidden">Preview</span>
            </button>
            <button
              onClick={handleSave}
              className="px-3.5 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-[#765563] font-['Quicksand'] text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs hover:shadow-sm transition-all"
            >
              <Heart className="w-3.5 h-3.5 fill-[#FF85A1] text-[#FF85A1]" />
              <span className="hidden xs:inline">Save & Apply</span>
              <span className="xs:hidden">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
