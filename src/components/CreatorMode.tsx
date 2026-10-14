import React, { useState } from 'react';
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
  Music,
  Heart,
  FileText,
  Key,
  Info,
} from 'lucide-react';

interface CreatorModeProps {
  data: UniverseData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newData: UniverseData) => void;
  onReset: () => void;
}

export const CreatorMode: React.FC<CreatorModeProps> = ({
  data,
  isOpen,
  onClose,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<UniverseData>(data);
  const [activeTab, setActiveTab] = useState<
    'names' | 'opening' | 'mainLetter' | 'memories' | 'jokes' | 'letters' | 'final' | 'soundtrack' | 'backup'
  >('names');
  const [savedNotification, setSavedNotification] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  };

  const handleExportJSON = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(formData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `our-universe-backup-${Date.now()}.json`);
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
          alert('Universe backup restored successfully!');
        } else {
          alert('Invalid universe backup format.');
        }
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddMemory = () => {
    const newMemory: MemoryItem = {
      id: `mem-${Date.now()}`,
      title: 'New Cherished Memory',
      date: 'Special Day',
      location: 'Together',
      description: 'A brief sentence describing what made this memory unforgettable.',
      story: 'The deeper story behind this moment...',
      tags: ['Love'],
      rotationDeg: (Math.random() - 0.5) * 4,
    };
    setFormData({
      ...formData,
      memories: [...formData.memories, newMemory],
    });
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
      symbol: '💫',
      title: 'New Inside Joke',
      clue: 'What happened that one time...?',
      revelation: 'The true story!',
      personalNote: 'Forever laughing at this.',
    };
    setFormData({
      ...formData,
      insideJokes: [...formData.insideJokes, newJoke],
    });
  };

  const handleDeleteJoke = (id: string) => {
    setFormData({
      ...formData,
      insideJokes: formData.insideJokes.filter((j) => j.id !== id),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#59443F]/40 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[90vh] bg-[#FFFDF9] border-2 border-[#D6B779]/50 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#59443F]">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#D6B779]/25 flex items-center justify-between bg-[#FFF8F0]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#D6B779]" />
            <h2 className="font-serif text-lg font-medium text-[#59443F]">
              Universe Creator & Memory Editor
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {savedNotification && (
              <span className="text-xs text-emerald-600 font-sans font-medium">
                ✓ Saved to browser storage!
              </span>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#F6D8C8] to-[#F8E1E7] border border-[#D6B779]/50 text-[#59443F] font-sans text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm transition-all"
            >
              <Save className="w-3.5 h-3.5 text-[#59443F]" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#7A5C54] hover:text-[#59443F] p-1 rounded-md cursor-pointer hover:bg-[#F8E1E7]/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto px-6 py-2.5 border-b border-[#D6B779]/20 bg-[#FAF5EE] text-xs font-sans">
          {[
            { id: 'names', label: 'Names & Dates' },
            { id: 'opening', label: 'Opening Scene' },
            { id: 'mainLetter', label: 'Main Letter' },
            { id: 'memories', label: 'Scrapbook Photos' },
            { id: 'jokes', label: 'Inside Jokes' },
            { id: 'letters', label: 'Letter Box' },
            { id: 'final', label: 'Final Surprise' },
            { id: 'soundtrack', label: 'Soundtrack' },
            { id: 'backup', label: 'Backup & Restore' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#F8E1E7] text-[#59443F] border border-[#D6B779]/50 font-medium shadow-xs'
                  : 'text-[#7A5C54] hover:text-[#59443F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB: Names & Dates */}
          {activeTab === 'names' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">
                  Recipient's Name or Nickname
                </label>
                <input
                  type="text"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={formData.senderName}
                  onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">
                  Where you first met
                </label>
                <input
                  type="text"
                  value={formData.firstMetLocation}
                  onChange={(e) => setFormData({ ...formData, firstMetLocation: e.target.value })}
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* TAB: Opening Scene */}
          {activeTab === 'opening' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">Opening Line</label>
                <input
                  type="text"
                  value={formData.opening.lead}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      opening: { ...formData.opening, lead: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">Second Line</label>
                <input
                  type="text"
                  value={formData.opening.sub}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      opening: { ...formData.opening, sub: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">Button Text</label>
                <input
                  type="text"
                  value={formData.opening.buttonText}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      opening: { ...formData.opening, buttonText: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* TAB: Main Letter */}
          {activeTab === 'mainLetter' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">Greeting</label>
                <input
                  type="text"
                  value={formData.mainLetter.greeting}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mainLetter: { ...formData.mainLetter, greeting: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">
                  Letter Paragraphs (one paragraph per box)
                </label>
                <div className="space-y-3">
                  {formData.mainLetter.paragraphs.map((p, idx) => (
                    <div key={idx} className="flex gap-2">
                      <textarea
                        rows={2}
                        value={p}
                        onChange={(e) => {
                          const newParagraphs = [...formData.mainLetter.paragraphs];
                          newParagraphs[idx] = e.target.value;
                          setFormData({
                            ...formData,
                            mainLetter: { ...formData.mainLetter, paragraphs: newParagraphs },
                          });
                        }}
                        className="flex-1 bg-slate-900 border border-white/15 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={() => {
                          const newParagraphs = formData.mainLetter.paragraphs.filter(
                            (_, i) => i !== idx
                          );
                          setFormData({
                            ...formData,
                            mainLetter: { ...formData.mainLetter, paragraphs: newParagraphs },
                          });
                        }}
                        className="text-slate-500 hover:text-rose-400 p-2 cursor-pointer"
                        title="Remove paragraph"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setFormData({
                        ...formData,
                        mainLetter: {
                          ...formData.mainLetter,
                          paragraphs: [...formData.mainLetter.paragraphs, 'New paragraph...'],
                        },
                      });
                    }}
                    className="text-xs text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add paragraph</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-sans text-slate-400 mb-1">Signature</label>
                  <input
                    type="text"
                    value={formData.mainLetter.signature}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainLetter: { ...formData.mainLetter, signature: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-sans text-slate-400 mb-1">Date</label>
                  <input
                    type="text"
                    value={formData.mainLetter.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mainLetter: { ...formData.mainLetter, date: e.target.value },
                      })
                    }
                    className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Scrapbook Photos */}
          {activeTab === 'memories' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-sans">
                  Polaroid Scrapbook Memories ({formData.memories.length})
                </span>
                <button
                  onClick={handleAddMemory}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-sans flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Memory</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.memories.map((mem, idx) => (
                  <div
                    key={mem.id}
                    className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-sans text-amber-300 font-medium">
                        Memory #{idx + 1}
                      </span>
                      <button
                        onClick={() => handleDeleteMemory(mem.id)}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Title</label>
                        <input
                          type="text"
                          value={mem.title}
                          onChange={(e) => {
                            const updated = [...formData.memories];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, memories: updated });
                          }}
                          className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Date</label>
                        <input
                          type="text"
                          value={mem.date}
                          onChange={(e) => {
                            const updated = [...formData.memories];
                            updated[idx].date = e.target.value;
                            setFormData({ ...formData, memories: updated });
                          }}
                          className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Location</label>
                        <input
                          type="text"
                          value={mem.location}
                          onChange={(e) => {
                            const updated = [...formData.memories];
                            updated[idx].location = e.target.value;
                            setFormData({ ...formData, memories: updated });
                          }}
                          className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">
                        Image URL (or local path, e.g. /src/assets/original_memory.jpg)
                      </label>
                      <input
                        type="text"
                        value={mem.imageUrl || ''}
                        onChange={(e) => {
                          const updated = [...formData.memories];
                          updated[idx].imageUrl = e.target.value;
                          setFormData({ ...formData, memories: updated });
                        }}
                        placeholder="/src/assets/original_memory.jpg or image URL"
                        className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Description</label>
                      <textarea
                        rows={2}
                        value={mem.description}
                        onChange={(e) => {
                          const updated = [...formData.memories];
                          updated[idx].description = e.target.value;
                          setFormData({ ...formData, memories: updated });
                        }}
                        className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Inside Jokes */}
          {activeTab === 'jokes' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-sans">
                  Inside Jokes & Secrets ({formData.insideJokes.length})
                </span>
                <button
                  onClick={handleAddJoke}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 text-xs font-sans flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Keepsake</span>
                </button>
              </div>

              <div className="space-y-4">
                {formData.insideJokes.map((joke, idx) => (
                  <div
                    key={joke.id}
                    className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={joke.symbol}
                          onChange={(e) => {
                            const updated = [...formData.insideJokes];
                            updated[idx].symbol = e.target.value;
                            setFormData({ ...formData, insideJokes: updated });
                          }}
                          className="w-10 text-center bg-slate-950 border border-white/15 rounded py-1 text-sm text-white"
                          title="Icon or emoji"
                        />
                        <input
                          type="text"
                          value={joke.title}
                          onChange={(e) => {
                            const updated = [...formData.insideJokes];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, insideJokes: updated });
                          }}
                          className="bg-slate-950 border border-white/15 rounded px-2 py-1 text-xs text-white"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteJoke(joke.id)}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Clue</label>
                      <input
                        type="text"
                        value={joke.clue}
                        onChange={(e) => {
                          const updated = [...formData.insideJokes];
                          updated[idx].clue = e.target.value;
                          setFormData({ ...formData, insideJokes: updated });
                        }}
                        className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Revelation</label>
                      <textarea
                        rows={2}
                        value={joke.revelation}
                        onChange={(e) => {
                          const updated = [...formData.insideJokes];
                          updated[idx].revelation = e.target.value;
                          setFormData({ ...formData, insideJokes: updated });
                        }}
                        className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
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
              <span className="text-xs text-slate-400 font-sans">
                Themed Treasure Letters ({formData.letters.length})
              </span>

              <div className="space-y-4">
                {formData.letters.map((letter, idx) => (
                  <div
                    key={letter.id}
                    className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Category</label>
                        <input
                          type="text"
                          value={letter.category}
                          onChange={(e) => {
                            const updated = [...formData.letters];
                            updated[idx].category = e.target.value;
                            setFormData({ ...formData, letters: updated });
                          }}
                          className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">Title</label>
                        <input
                          type="text"
                          value={letter.title}
                          onChange={(e) => {
                            const updated = [...formData.letters];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, letters: updated });
                          }}
                          className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-0.5">Letter Body</label>
                      <textarea
                        rows={4}
                        value={letter.content.join('\n\n')}
                        onChange={(e) => {
                          const updated = [...formData.letters];
                          updated[idx].content = e.target.value.split('\n\n');
                          setFormData({ ...formData, letters: updated });
                        }}
                        className="w-full bg-slate-950 border border-white/15 rounded px-2.5 py-1.5 text-xs text-white font-serif leading-relaxed"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Final Climax */}
          {activeTab === 'final' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">
                  Final Message Title
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
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">
                  Constellation Name
                </label>
                <input
                  type="text"
                  value={formData.finalLetter.constellationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      finalLetter: { ...formData.finalLetter, constellationName: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">
                  Final Letter Paragraphs
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
                  className="w-full bg-slate-900 border border-white/15 rounded-lg p-2.5 text-sm text-white font-serif leading-relaxed focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">
                  Final Words / Sign-off
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
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* TAB: Soundtrack */}
          {activeTab === 'soundtrack' && (
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">Track Name</label>
                <input
                  type="text"
                  value={formData.soundtrack.trackName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soundtrack: { ...formData.soundtrack, trackName: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">Composer / Info</label>
                <input
                  type="text"
                  value={formData.soundtrack.composer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soundtrack: { ...formData.soundtrack, composer: e.target.value },
                    })
                  }
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-slate-400 mb-1">
                  Custom Audio URL (leave blank to use the built-in ambient celestial synth)
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
                  placeholder="https://example.com/soundtrack.mp3"
                  className="w-full bg-slate-900 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* TAB: Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-xl">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-start gap-3 text-xs text-slate-300">
                <Info className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <p>
                  Your changes are saved to browser local storage. To ensure you never lose your
                  precious words across browsers or updates, download a JSON backup file below.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={handleExportJSON}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-amber-400/30 text-amber-200 text-xs font-sans flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup (.json)</span>
                </button>

                <label className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/15 text-slate-200 text-xs font-sans flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Restore from Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    if (confirm('Reset everything to the original defaults?')) {
                      onReset();
                    }
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to original defaults</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
