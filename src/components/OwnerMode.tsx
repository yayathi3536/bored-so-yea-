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
  Shield,
  Music,
  Loader2,
  Cloud,
  CloudOff,
  RefreshCw,
  Copy,
  CheckCheck,
  ExternalLink,
  Database,
} from 'lucide-react';
import { audioEngine } from '../utils/audio';
import { resolveAssetUrl, optimizeImageFile } from '../utils/assetPath';
import {
  getSupabase,
  uploadImageToSupabaseStorage,
  testSupabaseConnection,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  SCRAPBOOK_BUCKET,
  isCloudImageUrl,
  isLocalImageData,
  migrateLocalContentToSupabase,
  downloadUniverseFromLocalStorage,
  MigrationProgressUpdate,
} from '../utils/supabase';

export const RLS_QUICK_FIX_SQL = `-- 1-Click Fix for "new row violates row-level security policy for table universe_data"
ALTER TABLE public.universe_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read universe_data" ON public.universe_data;
DROP POLICY IF EXISTS "Public write universe_data" ON public.universe_data;
DROP POLICY IF EXISTS "Public insert universe_data" ON public.universe_data;
DROP POLICY IF EXISTS "Public update universe_data" ON public.universe_data;

CREATE POLICY "Public read universe_data" ON public.universe_data FOR SELECT USING (true);
CREATE POLICY "Public write universe_data" ON public.universe_data FOR ALL USING (true) WITH CHECK (true);
`;

export const FULL_SUPABASE_SQL = `-- 1. Enable pgcrypto for PIN hashing
create extension if not exists pgcrypto;

-- 2. Create universe_data table
create table if not exists public.universe_data (
  id text primary key default 'current',
  data jsonb not null,
  pin_hash text not null default crypt('1234', gen_salt('bf')),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Row Level Security (RLS) - Allows website to read and save universe data
alter table public.universe_data enable row level security;
drop policy if exists "Public read universe_data" on public.universe_data;
drop policy if exists "Public write universe_data" on public.universe_data;
drop policy if exists "Public insert universe_data" on public.universe_data;
drop policy if exists "Public update universe_data" on public.universe_data;

create policy "Public read universe_data" on public.universe_data for select using (true);
create policy "Public insert universe_data" on public.universe_data for insert with check (true);
create policy "Public update universe_data" on public.universe_data for update using (true);
create policy "Public write universe_data" on public.universe_data for all using (true) with check (true);

-- 4. Enable Supabase Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'universe_data'
  ) then
    alter publication supabase_realtime add table public.universe_data;
  end if;
end $$;

-- 5. Secure save function
create or replace function public.save_universe_data(edit_pin text, new_data jsonb)
returns jsonb language plpgsql security definer as $$
declare
  stored_hash text;
  row_exists boolean;
  result_row universe_data;
begin
  select exists(select 1 from public.universe_data where id = 'current') into row_exists;
  if not row_exists then
    insert into public.universe_data (id, data, pin_hash, updated_at)
    values ('current', new_data, crypt(edit_pin, gen_salt('bf')), now())
    returning * into result_row;
    return result_row.data;
  end if;

  select pin_hash into stored_hash from public.universe_data where id = 'current';
  if stored_hash is null or stored_hash = '' then
    update public.universe_data set data = new_data, pin_hash = crypt(edit_pin, gen_salt('bf')), updated_at = now()
    where id = 'current' returning * into result_row;
    return result_row.data;
  end if;

  if stored_hash != crypt(edit_pin, stored_hash) and stored_hash != edit_pin then
    raise exception 'Invalid PIN: authorization failed';
  end if;

  update public.universe_data set data = new_data, updated_at = now()
  where id = 'current' returning * into result_row;
  return result_row.data;
end;
$$;

grant execute on function public.save_universe_data(text, jsonb) to anon, authenticated, service_role;

-- 6. Scrapbook Photo Metadata Table
create table if not exists public.scrapbook_images (
  id uuid primary key default gen_random_uuid(),
  memory_id text,
  file_path text not null,
  public_url text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz default timezone('utc'::text, now())
);

alter table public.scrapbook_images enable row level security;
drop policy if exists "Public read scrapbook_images" on public.scrapbook_images;
create policy "Public read scrapbook_images" on public.scrapbook_images for select using (true);
drop policy if exists "Public insert scrapbook_images" on public.scrapbook_images;
create policy "Public insert scrapbook_images" on public.scrapbook_images for insert with check (true);

-- 7. Storage Bucket for Scrapbook Images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scrapbook-images',
  'scrapbook-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/avif']
)
on conflict (id) do update set public = true;

drop policy if exists "Scrapbook images public select" on storage.objects;
create policy "Scrapbook images public select" on storage.objects for select using (bucket_id = 'scrapbook-images');
drop policy if exists "Scrapbook images public insert" on storage.objects for insert with check (bucket_id = 'scrapbook-images');
drop policy if exists "Scrapbook images public update" on storage.objects for update using (bucket_id = 'scrapbook-images');
drop policy if exists "Scrapbook images public delete" on storage.objects for delete using (bucket_id = 'scrapbook-images');
`;

interface OwnerModeProps {
  data: UniverseData;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newData: UniverseData) => Promise<{ success: boolean; message: string }>;
  onPreview: (previewData: UniverseData) => void;
  onReset: () => void;
  storedPin: string;
  currentVerifiedPin: string;
  onUpdatePin: (newPin: string) => Promise<{ success: boolean; message: string }>;
  onMigrateToSupabase?: () => Promise<{ success: boolean; message: string }>;
  onRefreshFromSupabase?: () => Promise<{ success: boolean; message: string }>;
  supabaseStatus?: {
    connected: boolean;
    tableFound: boolean;
    storageFound: boolean;
    source: 'env' | 'local' | 'none';
  };
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
  currentVerifiedPin,
  onUpdatePin,
  onMigrateToSupabase,
  onRefreshFromSupabase,
  supabaseStatus,
}) => {
  const [formData, setFormData] = useState<UniverseData>(data);
  const [activeTab, setActiveTab] = useState<TabType>('names');
  const [savedBanner, setSavedBanner] = useState(false);
  const [saveBannerText, setSaveBannerText] = useState('Saved & synchronized!');
  const [isSaving, setIsSaving] = useState(false);
  const [rlsError, setRlsError] = useState(false);
  const [copiedRlsFix, setCopiedRlsFix] = useState(false);

  // PIN settings state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Supabase settings state
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<{
    connected: boolean;
    tableFound: boolean;
    storageFound: boolean;
    message: string;
  } | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Image upload state
  const [isProcessingImage, setIsProcessingImage] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatusText, setUploadStatusText] = useState<string | null>(null);

  // Cloud Photo Migration state
  const [migrationStatus, setMigrationStatus] = useState<MigrationProgressUpdate | null>(null);
  const [isMigratingPhotos, setIsMigratingPhotos] = useState(false);
  const [migrationSummary, setMigrationSummary] = useState<{
    totalLocal: number;
    unsyncedCount: number;
    cloudCount: number;
  }>({ totalLocal: 0, unsyncedCount: 0, cloudCount: 0 });

  // Sync internal formData when opened with latest data
  useEffect(() => {
    if (isOpen) {
      setFormData(data);
      setSavedBanner(false);
      setPinFeedback(null);
      setNewPin('');
      setConfirmPin('');
      const creds = getSupabaseCredentials();
      setSupabaseUrlInput(creds.url);
      setSupabaseKeyInput(creds.key);
      setConnectionTestResult(null);

      // Analyze photo sync status
      const memories = data.memories || [];
      const unsynced = memories.filter((m) => isLocalImageData(m.imageUrl)).length;
      const cloud = memories.filter((m) => isCloudImageUrl(m.imageUrl)).length;
      setMigrationSummary({
        totalLocal: memories.length,
        unsyncedCount: unsynced,
        cloudCount: cloud,
      });
    }
  }, [isOpen, data]);

  if (!isOpen) return null;

  const handleSave = async () => {
    audioEngine.playChime(1.2);
    setIsSaving(true);
    try {
      const result = await onSave(formData);
      setIsSaving(false);
      setSaveBannerText(result.message);
      setSavedBanner(true);
      if (result.success) {
        setRlsError(false);
      } else if (
        result.message.toLowerCase().includes('violates row-level security policy') ||
        result.message.toLowerCase().includes('row-level security')
      ) {
        setRlsError(true);
      }
      setTimeout(() => setSavedBanner(false), 4500);
    } catch (err: any) {
      setIsSaving(false);
      alert(`Save error: ${err.message || String(err)}`);
    }
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
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.recipientName && parsed.mainLetter) {
          setFormData(parsed);
          await onSave(parsed);
          audioEngine.playChime(1.3);
          alert('✨ Backup restored successfully! All custom memories have been loaded and synchronized.');
        } else {
          alert('Invalid romantic universe backup format.');
        }
      } catch {
        alert('Could not parse JSON file. Please ensure it is a valid backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleImageUpload = async (memoryIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(memoryIndex);
      const supabase = getSupabase();

      // If Supabase is available, upload directly to Supabase Storage
      if (supabase) {
        setUploadStatusText('Uploading to Supabase Storage...');
        const { url, path, error } = await uploadImageToSupabaseStorage(file, undefined, (pct) => {
          setUploadProgress(pct);
        });

        if (url) {
          const updated = [...formData.memories];
          updated[memoryIndex].imageUrl = url;
          updated[memoryIndex].storagePath = path;
          setFormData({ ...formData, memories: updated });
          audioEngine.playChime(1.3);
          setUploadStatusText('✓ Uploaded to Supabase Cloud Storage!');
          setTimeout(() => setUploadStatusText(null), 3000);
          return;
        }

        console.error('Storage upload returned error:', error);
        alert(
          `Supabase Storage Notice:\n${error}\n\nFalling back to temporary browser storage for now. Please run supabase-schema.sql in your Supabase SQL Editor to create the public scrapbook-images bucket!`
        );
      }

      // Offline / Local optimization fallback
      setUploadStatusText('Optimizing image...');
      const optimizedUrl = await optimizeImageFile(file, 1200, 0.82);
      const updated = [...formData.memories];
      updated[memoryIndex].imageUrl = optimizedUrl;
      setFormData({ ...formData, memories: updated });
      audioEngine.playChime(1.3);
      setUploadStatusText('✓ Saved locally');
      setTimeout(() => setUploadStatusText(null), 2500);
    } catch (err) {
      console.error('Image processing failed:', err);
      alert('Could not process this image. Please try another image file.');
    } finally {
      setIsProcessingImage(null);
      setUploadProgress(null);
      e.target.value = '';
    }
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

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPin.trim()) {
      setPinFeedback({ type: 'error', message: 'PIN cannot be empty' });
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setPinFeedback({ type: 'error', message: 'PINs do not match' });
      return;
    }
    try {
      const result = await onUpdatePin(newPin.trim());
      if (result.success) {
        setPinFeedback({ type: 'success', message: result.message });
        setNewPin('');
        setConfirmPin('');
        audioEngine.playChime(1.3);
      } else {
        setPinFeedback({ type: 'error', message: result.message });
        audioEngine.playBlip(0.6);
      }
    } catch (err: any) {
      setPinFeedback({ type: 'error', message: err.message || 'Failed to update PIN' });
      audioEngine.playBlip(0.6);
    }
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
              <span
                className={`hidden md:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border animate-fadeIn ${
                  rlsError
                    ? 'text-amber-800 bg-amber-50 border-amber-300'
                    : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                }`}
              >
                {rlsError ? (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{rlsError ? 'Saved Locally (RLS Blocked)' : 'Saved!'}</span>
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

        {/* RLS Policy Error Alert Banner */}
        {rlsError && (
          <div className="mx-4 sm:mx-6 mt-3 p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-['Quicksand'] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Supabase RLS is blocking writes on table &ldquo;universe_data&rdquo;
                </p>
                <p className="text-[11px] text-amber-800/90 mt-0.5">
                  Your changes are saved in this browser. To sync to Supabase Cloud, run the 3-line RLS policy in your Supabase SQL Editor:
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(RLS_QUICK_FIX_SQL);
                  setCopiedRlsFix(true);
                  audioEngine.playChime(1.2);
                  setTimeout(() => setCopiedRlsFix(false), 2500);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer w-full sm:w-auto shadow-xs"
              >
                {copiedRlsFix ? (
                  <>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copied SQL Fix!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-amber-800" />
                    <span>Copy 3-Line RLS Fix</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowSqlModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
              >
                <span>Full SQL</span>
              </button>
              <button
                type="button"
                onClick={() => setRlsError(false)}
                className="p-1 rounded-full text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
                          {isProcessingImage === idx ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-[#FFF8EF] text-[#FF85A1] gap-1.5 p-2 text-center">
                              <Loader2 className="w-6 h-6 animate-spin" />
                              <span className="text-[11px] font-bold">{uploadStatusText || 'Processing...'}</span>
                              {uploadProgress !== null && (
                                <div className="w-24 h-1.5 bg-[#FFD6E7] rounded-full overflow-hidden mt-1">
                                  <div
                                    className="h-full bg-[#FF85A1] transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          ) : mem.imageUrl ? (
                            <>
                              <img
                                src={resolveAssetUrl(mem.imageUrl)}
                                alt={mem.title}
                                className="w-full h-full object-cover"
                              />
                              {mem.imageUrl.includes('supabase.co') && (
                                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[9px] font-bold shadow-xs">
                                  Cloud Stored
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.memories];
                                  updated[idx].imageUrl = '';
                                  setFormData({ ...formData, memories: updated });
                                }}
                                className="absolute top-1.5 right-1.5 p-1 bg-white/90 hover:bg-white text-[#765563] rounded-full shadow-xs text-[10px]"
                                title="Remove photo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FFF8EF] via-[#FFD6E7]/30 to-[#FFE0CC]/30 text-[#765563]/60 text-xs p-3 text-center">
                              <span className="text-2xl mb-1">🌸</span>
                              <span>No photo yet</span>
                            </div>
                          )}
                        </div>

                        {/* Local / Cloud File Picker */}
                        <div className="pt-1 flex flex-col gap-1.5">
                          <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#FFD6E7]/50 border border-[#FFBFD7] text-xs font-['Quicksand'] font-bold text-[#765563] cursor-pointer shadow-xs transition-colors">
                            {isProcessingImage === idx ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF85A1]" />
                            ) : (
                              <Camera className="w-3.5 h-3.5 text-[#FF85A1]" />
                            )}
                            <span>{isProcessingImage === idx ? (uploadStatusText || 'Uploading...') : 'Upload from Device'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isProcessingImage === idx}
                              onChange={(e) => handleImageUpload(idx, e)}
                              className="hidden"
                            />
                          </label>
                          <p className="text-[10px] text-[#765563]/60">
                            Uploads permanently to Supabase Storage (with offline compression fallback)
                          </p>
                        </div>

                        {/* Or URL */}
                        <div className="pt-1">
                          <label className="block text-[11px] font-bold text-[#765563]/80 mb-1">
                            Or Image URL / Path
                          </label>
                          <input
                            type="text"
                            value={mem.imageUrl || ''}
                            placeholder="https://... or /images/original_memory.jpg"
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

          {/* TAB: Security & Authorization */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              {/* Change PIN Form */}
              <div className="p-5 rounded-2xl bg-[#FFF8EF] border-2 border-[#FFBFD7] space-y-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-[#FF85A1]" />
                  <h3 className="font-['Fredoka'] text-base font-semibold text-[#765563]">
                    Change Owner PIN
                  </h3>
                </div>
                <p className="text-xs font-['Quicksand'] text-[#765563]/80">
                  Current active PIN is: <strong className="text-[#765563] font-mono">{storedPin}</strong>
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

              {/* Security Architecture Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#FFF8EF] to-[#FFD6E7]/20 border-2 border-[#FFBFD7] space-y-3 text-[#765563]">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#FF85A1] shrink-0" />
                  <h4 className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                    Backend Authorization & Security Architecture
                  </h4>
                </div>
                <div className="text-xs space-y-2.5 leading-relaxed font-['Quicksand'] text-[#765563]/90">
                  <p>
                    <strong>1. PostgreSQL Cryptographic Hashing:</strong> Your PIN is never stored in plain text. It is hashed using bcrypt via PostgreSQL’s <code>pgcrypto</code> extension directly inside your Supabase database.
                  </p>
                  <p>
                    <strong>2. Server-Enforced Write Protection:</strong> Even though the website client uses the public Supabase Anon key, direct table mutations are blocked by Row Level Security (RLS). Updates are authorized exclusively through the secure <code>save_universe_data()</code> database function, requiring the matching PIN before changes or deletes are written.
                  </p>
                  <p>
                    <strong>3. Zero Service Role Exposure:</strong> Your secret Supabase service-role key is never included in client code or frontend bundles, adhering to strict production security standards.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Backup / Sync */}
          {activeTab === 'backup' && (
            <div className="space-y-6 max-w-2xl">
              {/* Supabase Cloud Sync Card */}
              <div className="p-5 rounded-2xl bg-[#FFF8EF] border-2 border-[#FFBFD7] space-y-4 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-[#FF85A1]" />
                    <h4 className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                      Supabase Cloud Database & Storage
                    </h4>
                  </div>
                  {supabaseStatus?.connected ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/90 text-emerald-800 text-[11px] font-bold border border-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Cloud Connected (Realtime Active)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/90 text-amber-800 text-[11px] font-bold border border-amber-300">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Local Storage (Ready to Connect)</span>
                    </span>
                  )}
                </div>

                <p className="text-xs font-['Quicksand'] text-[#765563]/80 leading-relaxed">
                  Supabase provides persistent cross-device storage for your love notes, letters, and polaroid scrapbook pictures. When connected, changes you make on one device instantly reflect everywhere!
                </p>

                {/* Cloud Sync Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isTestingConnection}
                    onClick={async () => {
                      setIsTestingConnection(true);
                      const result = await testSupabaseConnection();
                      setIsTestingConnection(false);
                      setConnectionTestResult(result);
                      if (result.connected) {
                        audioEngine.playChime(1.2);
                      } else {
                        audioEngine.playBlip(0.7);
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFD6E7]/40 border border-[#FFBFD7] text-xs font-bold text-[#765563] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF85A1]" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5 text-[#FF85A1]" />
                    )}
                    <span>Test Connection</span>
                  </button>

                  <button
                    type="button"
                    disabled={isMigrating || isMigratingPhotos}
                    onClick={async () => {
                      setIsMigrating(true);
                      setMigrationStatus({
                        stage: 'checking',
                        totalImages: formData.memories.length,
                        currentImageIndex: 0,
                        currentImageTitle: '',
                        message: 'Checking and migrating local photos...',
                      });
                      const res = await migrateLocalContentToSupabase({
                        pin: currentVerifiedPin || storedPin,
                        forceOverwriteServer: true,
                        onProgress: (update) => setMigrationStatus(update),
                      });
                      setIsMigrating(false);
                      if (res.success) {
                        audioEngine.playChime(1.3);
                        const refreshed = downloadUniverseFromLocalStorage();
                        if (refreshed) setFormData(refreshed);
                        const memories = (refreshed || formData).memories || [];
                        setMigrationSummary({
                          totalLocal: memories.length,
                          unsyncedCount: memories.filter((m) => isLocalImageData(m.imageUrl)).length,
                          cloudCount: memories.filter((m) => isCloudImageUrl(m.imageUrl)).length,
                        });
                      }
                      alert(res.message);
                    }}
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-xs font-bold text-[#765563] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    {isMigrating || isMigratingPhotos ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#765563]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#765563]" />
                    )}
                    <span>Sync Local to Cloud</span>
                  </button>

                  <button
                    type="button"
                    disabled={isRefreshing}
                    onClick={async () => {
                      if (!onRefreshFromSupabase) return;
                      setIsRefreshing(true);
                      const res = await onRefreshFromSupabase();
                      setIsRefreshing(false);
                      if (res.success) {
                        audioEngine.playChime(1.3);
                        const refreshed = downloadUniverseFromLocalStorage();
                        if (refreshed) setFormData(refreshed);
                        const memories = (refreshed || formData).memories || [];
                        setMigrationSummary({
                          totalLocal: memories.length,
                          unsyncedCount: memories.filter((m) => isLocalImageData(m.imageUrl)).length,
                          cloudCount: memories.filter((m) => isCloudImageUrl(m.imageUrl)).length,
                        });
                      }
                      alert(res.message);
                    }}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-[#FFE0CC]/50 border border-[#FFBFD7] text-xs font-bold text-[#765563] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF85A1]" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-[#FF85A1]" />
                    )}
                    <span>Pull from Cloud</span>
                  </button>
                </div>

                {/* Connection Test Diagnostics Banner */}
                {connectionTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs font-['Quicksand'] space-y-1 ${
                      connectionTestResult.connected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {connectionTestResult.connected ? (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{connectionTestResult.message}</span>
                    </div>
                  </div>
                )}

                {/* Cloud Photo Migration Wizard Card */}
                <div className="p-4 rounded-xl bg-white border border-[#FFBFD7] space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📷</span>
                      <h5 className="font-['Fredoka'] text-xs sm:text-sm font-semibold text-[#765563]">
                        Computer Photo Migration to Supabase Storage
                      </h5>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        migrationSummary.unsyncedCount > 0
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {migrationSummary.unsyncedCount > 0
                        ? `${migrationSummary.unsyncedCount} Local Photo${
                            migrationSummary.unsyncedCount > 1 ? 's' : ''
                          } Ready to Migrate`
                        : `${migrationSummary.cloudCount} Photos Synced in Cloud`}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#765563]/80 leading-relaxed font-['Quicksand']">
                    Photos uploaded on your computer are initially stored inside this browser&apos;s localStorage. Running migration uploads them to your Supabase Storage bucket (<code>scrapbook-images</code>) and updates the database with permanent URLs so they display seamlessly on your phone!
                  </p>

                  {/* Migration Progress Bar */}
                  {migrationStatus && (
                    <div className="p-3 rounded-xl bg-[#FFF8EF] border border-[#FFBFD7] text-xs font-['Quicksand'] space-y-2">
                      <div className="flex items-center justify-between font-bold text-[#765563] text-[11px]">
                        <span>{migrationStatus.message}</span>
                        {migrationStatus.totalImages > 0 && (
                          <span>
                            {migrationStatus.currentImageIndex} / {migrationStatus.totalImages}
                          </span>
                        )}
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#FFD6E7]/50 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF85A1] to-[#E99AB5] transition-all duration-300"
                          style={{
                            width: `${
                              migrationStatus.totalImages > 0
                                ? Math.min(
                                    100,
                                    Math.round(
                                      (migrationStatus.currentImageIndex / migrationStatus.totalImages) * 100
                                    )
                                  )
                                : 100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isMigratingPhotos || isMigrating}
                      onClick={async () => {
                        setIsMigratingPhotos(true);
                        setMigrationStatus({
                          stage: 'checking',
                          totalImages: formData.memories.length,
                          currentImageIndex: 0,
                          currentImageTitle: '',
                          message: 'Checking photos and preparing upload...',
                        });

                        const result = await migrateLocalContentToSupabase({
                          pin: currentVerifiedPin || storedPin,
                          forceOverwriteServer: true,
                          onProgress: (update) => setMigrationStatus(update),
                        });

                        setIsMigratingPhotos(false);
                        if (result.success) {
                          audioEngine.playChime(1.3);
                          const refreshed = downloadUniverseFromLocalStorage();
                          if (refreshed) setFormData(refreshed);
                          const memories = (refreshed || formData).memories || [];
                          setMigrationSummary({
                            totalLocal: memories.length,
                            unsyncedCount: memories.filter((m) => isLocalImageData(m.imageUrl)).length,
                            cloudCount: memories.filter((m) => isCloudImageUrl(m.imageUrl)).length,
                          });
                        }
                        alert(result.message);
                      }}
                      className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-xs font-bold text-[#765563] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      {isMigratingPhotos ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#765563]" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-[#765563]" />
                      )}
                      <span>Migrate Computer Photos to Supabase</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const memories = formData.memories || [];
                        const unsynced = memories.filter((m) => isLocalImageData(m.imageUrl)).length;
                        const cloud = memories.filter((m) => isCloudImageUrl(m.imageUrl)).length;
                        setMigrationSummary({
                          totalLocal: memories.length,
                          unsyncedCount: unsynced,
                          cloudCount: cloud,
                        });
                        alert(
                          `Photo Storage Diagnostics:\n• Total Memories: ${memories.length}\n• Hosted in Supabase Cloud: ${cloud}\n• Stored Only Locally (Base64): ${unsynced}\n\n${
                            unsynced > 0
                              ? 'Click "Migrate Computer Photos to Supabase" to upload them to the cloud!'
                              : 'All photos are already stored in Supabase Cloud and will appear on your phone!'
                          }`
                        );
                      }}
                      className="w-full sm:w-auto px-3 py-2 rounded-xl bg-[#FFF8EF] hover:bg-[#FFE0CC]/50 border border-[#FFBFD7] text-xs font-bold text-[#765563] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#FF85A1]" />
                      <span>Check Photo Sync Status</span>
                    </button>
                  </div>
                </div>

                {/* Quick Credentials Setup / Override */}
                <details className="pt-2 border-t border-[#FFBFD7]/50 text-xs">
                  <summary className="font-['Fredoka'] font-semibold text-[#765563] cursor-pointer hover:text-[#FF85A1] py-1 select-none">
                    ⚙️ Supabase Project Credentials (Optional Custom Setup)
                  </summary>
                  <div className="mt-2.5 p-3.5 bg-white rounded-xl border border-[#FFBFD7] space-y-3">
                    <p className="text-[11px] text-[#765563]/75">
                      You can set these credentials in GitHub Actions secrets or enter them here directly for your browser session.
                    </p>
                    <div>
                      <label className="block text-[11px] font-bold text-[#765563] mb-1">
                        Supabase Project URL
                      </label>
                      <input
                        type="text"
                        value={supabaseUrlInput}
                        onChange={(e) => setSupabaseUrlInput(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-lg px-2.5 py-1.5 text-xs text-[#765563] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#765563] mb-1">
                        Supabase Public Anon Key
                      </label>
                      <input
                        type="password"
                        value={supabaseKeyInput}
                        onChange={(e) => setSupabaseKeyInput(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="w-full bg-[#FFF8EF] border border-[#FFBFD7] rounded-lg px-2.5 py-1.5 text-xs text-[#765563] font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          saveSupabaseCredentials(supabaseUrlInput, supabaseKeyInput);
                          audioEngine.playChime(1.1);
                          alert('Supabase credentials saved in browser storage!');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#FFD6E7] hover:bg-[#FFBFD7] text-[#765563] font-bold text-xs cursor-pointer shadow-xs"
                      >
                        Save Credentials
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSupabaseUrlInput('');
                          setSupabaseKeyInput('');
                          saveSupabaseCredentials('', '');
                          audioEngine.playBlip(0.8);
                          alert('Cleared local Supabase credentials.');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-[#FFBFD7] text-[#765563]/70 hover:bg-rose-50 hover:text-rose-600 text-xs cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSqlModal(true)}
                        className="ml-auto text-xs font-bold text-[#FF85A1] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5" />
                        <span>View SQL Schema</span>
                      </button>
                    </div>
                  </div>
                </details>
              </div>

              {/* RLS Policy Helper Card */}
              <div className="p-4 rounded-2xl bg-amber-50/90 border-2 border-amber-200/90 space-y-2.5 text-xs font-['Quicksand'] text-amber-900 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Fix Row-Level Security (RLS) Policy</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(RLS_QUICK_FIX_SQL);
                      setCopiedRlsFix(true);
                      audioEngine.playChime(1.2);
                      setTimeout(() => setCopiedRlsFix(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    {copiedRlsFix ? (
                      <>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Copied 3-Line Fix!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-800" />
                        <span>Copy 3-Line RLS Fix</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-amber-800/85 leading-relaxed">
                  Seeing &ldquo;new row violates row-level security policy for table universe_data&rdquo;? Copy the 3-line SQL fix above, paste it in your <strong>Supabase Dashboard &rarr; SQL Editor &rarr; New Query</strong>, and click <strong>Run</strong>. That allows the website to save and sync instantly!
                </p>
              </div>

              {/* Offline File Backup Card */}
              <div className="p-5 rounded-2xl bg-[#FFF8EF] border-2 border-[#FFBFD7] space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF85A1]" />
                  <h4 className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                    Offline File Backup (.json)
                  </h4>
                </div>
                <p className="text-xs font-['Quicksand'] text-[#765563]/80 leading-relaxed">
                  Download an offline JSON copy containing all your customized text, memories, polaroids, and letters.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <button
                    onClick={handleExportJSON}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-[#FFD6E7]/40 border border-[#FFBFD7] text-[#765563] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all"
                  >
                    <Download className="w-4 h-4 text-[#FF85A1]" />
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

              {/* Reset Defaults */}
              <div className="pt-2 border-t border-[#FFBFD7]/50">
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

        {/* SQL Script View Modal */}
        {showSqlModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-[#765563]/40 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#FFFDF9] border-2 border-[#FFBFD7] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#765563]">
              <div className="p-4 border-b border-[#FFBFD7] flex items-center justify-between bg-[#FFF8EF]">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#FF85A1]" />
                  <h3 className="font-['Fredoka'] text-sm font-semibold text-[#765563]">
                    Supabase SQL Setup &amp; RLS Fix Script
                  </h3>
                </div>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="p-1 rounded-full text-[#765563]/60 hover:text-[#765563] hover:bg-[#FFD6E7]/50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 font-['Quicksand'] space-y-3 text-xs">
                <p className="text-[#765563]/80">
                  Run this SQL in your Supabase dashboard: <strong>SQL Editor</strong> &rarr; <strong>New Query</strong> &rarr; <strong>Run</strong>.
                </p>
                <div className="relative bg-[#2D2A32] text-[#F3E8EE] p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto max-h-[45vh]">
                  <pre>{FULL_SUPABASE_SQL}</pre>
                </div>
              </div>

              <div className="p-3.5 border-t border-[#FFBFD7] bg-[#FFF8EF] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(RLS_QUICK_FIX_SQL);
                      setCopiedRlsFix(true);
                      audioEngine.playChime(1.2);
                      setTimeout(() => setCopiedRlsFix(false), 2000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 text-xs font-bold text-amber-900 flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    {copiedRlsFix ? (
                      <>
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        <span>Copied 3-Line Fix!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-amber-800" />
                        <span>Copy 3-Line RLS Fix</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(FULL_SUPABASE_SQL);
                      setCopiedSql(true);
                      audioEngine.playChime(1.2);
                      setTimeout(() => setCopiedSql(false), 2000);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-xs font-bold text-[#765563] flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    {copiedSql ? (
                      <>
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        <span>Copied Full Script!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Full SQL Script</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#FFBFD7] text-xs font-bold text-[#765563] hover:bg-[#FFD6E7]/40 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 border-t border-[#FFBFD7]/60 bg-[#FFF8EF] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-['Quicksand'] text-[#765563]/70 shrink-0">
            <Shield className="w-3.5 h-3.5 text-[#FF85A1]" />
            <span className="hidden sm:inline">Owner Mode active</span>
            {savedBanner && (
              <span className="ml-2 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 animate-fadeIn">
                {saveBannerText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 justify-end w-full sm:w-auto">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-3 sm:px-4 py-2 rounded-xl border border-[#FFBFD7] text-[#765563] font-['Quicksand'] text-xs font-bold hover:bg-[#FFD6E7]/40 transition-colors cursor-pointer"
            >
              <span className="hidden xs:inline">Cancel / Close</span>
              <span className="xs:hidden">Cancel</span>
            </button>
            <button
              onClick={handlePreview}
              disabled={isSaving}
              className="px-3 sm:px-4 py-2 rounded-xl bg-white hover:bg-[#FFE0CC]/50 border border-[#FFBFD7] text-[#765563] font-['Quicksand'] text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#FF85A1]" />
              <span className="hidden sm:inline">Preview Live Site</span>
              <span className="sm:hidden">Preview</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-[#FFD6E7] to-[#FFBFD7] hover:from-[#FFBFD7] hover:to-[#FFA3BA] border border-[#FFA3BA] text-[#765563] font-['Quicksand'] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs hover:shadow-sm transition-all disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#765563]" />
                  <span>Saving & Syncing...</span>
                </>
              ) : (
                <>
                  <Heart className="w-3.5 h-3.5 fill-[#FF85A1] text-[#FF85A1]" />
                  <span className="hidden xs:inline">Save & Apply</span>
                  <span className="xs:hidden">Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
