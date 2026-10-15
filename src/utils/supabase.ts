import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UniverseData, MemoryItem } from '../types';

export const DEFAULT_SUPABASE_URL = 'https://updbgvanowpgjbkdliyo.supabase.co';
export const SCRAPBOOK_BUCKET = 'scrapbook-images';
const SUPABASE_URL_KEY = 'romantic_supabase_url_v1';
const SUPABASE_KEY_KEY = 'romantic_supabase_key_v1';

export function getSupabaseCredentials(): { url: string; key: string; source: 'env' | 'local' | 'none' } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL)?.trim();
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (envUrl && envKey && !envKey.includes('placeholder') && envKey !== 'your-anon-key-here') {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  try {
    const localUrl = localStorage.getItem(SUPABASE_URL_KEY)?.trim() || envUrl || DEFAULT_SUPABASE_URL;
    const localKey = localStorage.getItem(SUPABASE_KEY_KEY)?.trim() || '';
    if (localUrl && localKey) {
      return { url: localUrl, key: localKey, source: 'local' };
    }
  } catch {}

  // If we have the project URL but need the Anon Key
  return { url: envUrl || DEFAULT_SUPABASE_URL, key: '', source: 'none' };
}

export function saveSupabaseCredentials(url: string, key: string) {
  try {
    if (!url.trim() && !key.trim()) {
      localStorage.removeItem(SUPABASE_URL_KEY);
      localStorage.removeItem(SUPABASE_KEY_KEY);
    } else {
      localStorage.setItem(SUPABASE_URL_KEY, (url.trim() || DEFAULT_SUPABASE_URL));
      localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
    }
    cachedClient = null;
  } catch (err) {
    console.error('Failed to save Supabase credentials:', err);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastUsedUrl = url;
    lastUsedKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Error initializing Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tableFound: boolean;
  storageFound: boolean;
  hasCloudData: boolean;
  cloudPhotoCount: number;
  message: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      connected: false,
      tableFound: false,
      storageFound: false,
      hasCloudData: false,
      cloudPhotoCount: 0,
      message: 'Supabase Anon Key is not configured yet. Set it in GitHub Secrets or Owner Mode.',
    };
  }

  try {
    // 1. Test database table
    let tableFound = false;
    let hasCloudData = false;
    let cloudPhotoCount = 0;

    const { data: tableData, error: tableError } = await supabase
      .from('universe_data')
      .select('id, data')
      .limit(1);

    tableFound = !tableError;
    if (tableFound && tableData && tableData.length > 0) {
      hasCloudData = true;
      const memories = (tableData[0]?.data as UniverseData)?.memories || [];
      cloudPhotoCount = memories.filter((m) => isCloudImageUrl(m.imageUrl)).length;
    }

    // 2. Test storage bucket
    let storageFound = false;
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (!storageError && buckets) {
        storageFound = buckets.some((bucket) => bucket.name === SCRAPBOOK_BUCKET);
      }

      // If bucket not found, attempt to auto-create it
      if (!storageFound) {
        const { error: createError } = await supabase.storage.createBucket(SCRAPBOOK_BUCKET, {
          public: true,
          fileSizeLimit: 10485760,
        });
        if (!createError) {
          storageFound = true;
        }
      }
    } catch {}

    let message = '';
    if (tableFound && storageFound) {
      message = hasCloudData
        ? `Connected to Supabase! Cloud data is active (${cloudPhotoCount} photos stored in cloud).`
        : 'Connected to Supabase! Database and Storage are ready (empty table, ready to seed or migrate).';
    } else if (tableFound && !storageFound) {
      message = 'Connected to Database! Note: "scrapbook-images" storage bucket was not found. Run supabase-schema.sql.';
    } else if (!tableFound && storageFound) {
      message = 'Connected to Storage! Note: "universe_data" table was not found. Run supabase-schema.sql.';
    } else {
      message = 'Connected to Supabase API, but database table and storage bucket were not found. Run supabase-schema.sql in SQL Editor.';
    }

    return {
      connected: true,
      tableFound,
      storageFound,
      hasCloudData,
      cloudPhotoCount,
      message,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableFound: false,
      storageFound: false,
      hasCloudData: false,
      cloudPhotoCount: 0,
      message: `Connection failed: ${err.message || String(err)}`,
    };
  }
}

export async function fetchUniverseFromSupabase(): Promise<{ data: UniverseData | null; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { data: null, error: 'Supabase credentials not configured.' };

  try {
    const { data, error } = await supabase
      .from('universe_data')
      .select('data, updated_at')
      .eq('id', 'current')
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || !data.data) {
      return { data: null };
    }

    return { data: data.data as UniverseData };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

export async function saveUniverseToSupabase(
  universeData: UniverseData,
  pin: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase credentials not configured. Saved locally to this browser.',
    };
  }

  try {
    // Attempt secure PIN-verified RPC function first
    const { error: rpcError } = await supabase.rpc('save_universe_data', {
      edit_pin: pin,
      new_data: universeData,
    });

    if (!rpcError) {
      return {
        success: true,
        message: 'Saved and synchronized successfully with Supabase Cloud!',
      };
    }

    console.warn('Supabase RPC save_universe_data response:', rpcError);

    if (
      rpcError.message.toLowerCase().includes('invalid pin') ||
      rpcError.message.toLowerCase().includes('authorization failed') ||
      rpcError.message.toLowerCase().includes('unauthorized')
    ) {
      return {
        success: false,
        message: 'Authorization failed: Invalid owner PIN in Supabase database.',
      };
    }

    // Fallback: direct table upsert
    const { error: upsertError } = await supabase.from('universe_data').upsert(
      {
        id: 'current',
        data: universeData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
      console.error('Supabase direct upsert error:', upsertError);

      if (
        upsertError.message.toLowerCase().includes('row-level security') ||
        upsertError.message.toLowerCase().includes('violates row-level security policy')
      ) {
        return {
          success: false,
          message:
            'Database save error: new row violates row-level security policy for table "universe_data". To fix this, run the RLS SQL policy in Supabase SQL Editor (Open Owner Mode > Backup > View SQL Schema or run supabase-schema.sql).',
        };
      }

      return {
        success: false,
        message: `Database save error: ${upsertError.message}`,
      };
    }

    return {
      success: true,
      message: 'Saved to Supabase database (direct upsert)!',
    };
  } catch (err: any) {
    console.error('Exception in saveUniverseToSupabase:', err);
    return {
      success: false,
      message: `Failed to save to Supabase: ${err.message || String(err)}`,
    };
  }
}

export async function updateOwnerPinOnSupabase(
  currentPin: string,
  newPin: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: true, message: 'Updated locally (Supabase not configured).' };
  }

  try {
    const { error } = await supabase.rpc('update_owner_pin', {
      current_pin: currentPin,
      new_pin: newPin,
    });

    if (error) {
      if (error.message.toLowerCase().includes('function') && error.message.toLowerCase().includes('does not exist')) {
        return { success: true, message: 'PIN updated locally. (Run supabase-schema.sql to enable backend PIN hashing).' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Owner PIN updated securely on Supabase!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update PIN on Supabase.' };
  }
}

export function isCloudImageUrl(url?: string): boolean {
  if (!url) return false;
  return url.includes('.supabase.co/storage/v1/object/') || url.includes('/storage/v1/object/public/');
}

export function isLocalImageData(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('data:image/') || url.startsWith('blob:');
}

export function base64ToBlob(base64DataUrl: string): { blob: Blob; mimeType: string } | null {
  try {
    const parts = base64DataUrl.split(';base64,');
    if (parts.length !== 2) return null;
    const mimeType = parts[0].replace('data:', '') || 'image/jpeg';
    const binaryStr = atob(parts[1]);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return { blob: new Blob([bytes], { type: mimeType }), mimeType };
  } catch (err) {
    console.error('Failed to parse base64 image data:', err);
    return null;
  }
}

export async function uploadImageToSupabaseStorage(
  file: File | Blob,
  customFileName?: string,
  onProgress?: (percent: number) => void
): Promise<{ url?: string; path?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase storage is not configured. Please enter your Supabase Anon Key.' };
  }

  try {
    const defaultExt = file.type ? file.type.split('/')[1] || 'jpg' : 'jpg';
    let cleanFileName = customFileName
      ? customFileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      : (file as File).name
      ? (file as File).name.replace(/[^a-zA-Z0-9.-]/g, '_')
      : `photo_${Date.now()}.${defaultExt}`;

    if (!cleanFileName.includes('.')) {
      cleanFileName = `${cleanFileName}.${defaultExt}`;
    }

    const filePath = `scrapbook/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanFileName}`;

    if (onProgress) onProgress(30);

    const { error: uploadError } = await supabase.storage.from(SCRAPBOOK_BUCKET).upload(filePath, file, {
      cacheControl: '31536000',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return {
        error: `Storage upload failed: ${uploadError.message}. Make sure the "${SCRAPBOOK_BUCKET}" bucket exists and is set to public.`,
      };
    }

    if (onProgress) onProgress(90);

    // Retrieve permanent public URL (never expires, loads on phone and desktop)
    const { data: publicUrlData } = supabase.storage.from(SCRAPBOOK_BUCKET).getPublicUrl(filePath);
    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      return { error: 'Failed to generate public URL for uploaded file.' };
    }

    // Non-blocking metadata insert for tracking
    try {
      await supabase.from('scrapbook_images').insert({
        file_path: filePath,
        public_url: publicUrl,
        file_name: cleanFileName,
        mime_type: file.type || 'image/jpeg',
        size_bytes: file.size,
      });
    } catch {}

    if (onProgress) onProgress(100);

    return { url: publicUrl, path: filePath };
  } catch (err: any) {
    console.error('Storage upload exception:', err);
    return { error: err.message || 'Failed to upload image' };
  }
}

export interface MigrationProgressUpdate {
  stage: 'checking' | 'uploading' | 'saving' | 'complete' | 'error';
  totalImages: number;
  currentImageIndex: number;
  currentImageTitle: string;
  message: string;
}

export async function migrateLocalContentToSupabase(options: {
  pin: string;
  forceOverwriteServer?: boolean;
  onProgress?: (update: MigrationProgressUpdate) => void;
}): Promise<{
  success: boolean;
  message: string;
  uploadedCount: number;
  alreadyCloudCount: number;
  serverHasExistingData?: boolean;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase credentials are not configured. Please enter your Supabase Anon Key in Owner Mode.',
      uploadedCount: 0,
      alreadyCloudCount: 0,
    };
  }

  const localData = downloadUniverseFromLocalStorage();
  if (!localData) {
    return {
      success: false,
      message: 'No saved memories found in this browser’s localStorage (key: "our_universe_data_v1").',
      uploadedCount: 0,
      alreadyCloudCount: 0,
    };
  }

  options.onProgress?.({
    stage: 'checking',
    totalImages: localData.memories.length,
    currentImageIndex: 0,
    currentImageTitle: '',
    message: 'Verifying Supabase connection and checking existing cloud data...',
  });

  // Check if server already has data and contains photos
  if (!options.forceOverwriteServer) {
    const { data: serverData } = await fetchUniverseFromSupabase();
    if (serverData && serverData.memories && serverData.memories.length > 0) {
      const serverHasCloudImages = serverData.memories.some((m) => isCloudImageUrl(m.imageUrl));
      if (serverHasCloudImages) {
        return {
          success: false,
          serverHasExistingData: true,
          message:
            'Supabase Cloud already contains saved memories and photos. Confirm if you want to upload and synchronize your computer’s local content to update the cloud database.',
          uploadedCount: 0,
          alreadyCloudCount: serverData.memories.filter((m) => isCloudImageUrl(m.imageUrl)).length,
        };
      }
    }
  }

  let uploadedCount = 0;
  let alreadyCloudCount = 0;
  const updatedMemories: MemoryItem[] = [...localData.memories];

  for (let i = 0; i < updatedMemories.length; i++) {
    const memory = { ...updatedMemories[i] };
    const imageUrl = memory.imageUrl || '';

    if (isCloudImageUrl(imageUrl)) {
      alreadyCloudCount++;
      continue;
    }

    if (isLocalImageData(imageUrl)) {
      options.onProgress?.({
        stage: 'uploading',
        totalImages: updatedMemories.length,
        currentImageIndex: i + 1,
        currentImageTitle: memory.title || `Memory #${i + 1}`,
        message: `Uploading photo ${i + 1} of ${updatedMemories.length} ("${memory.title}") to Supabase Storage...`,
      });

      const parsed = base64ToBlob(imageUrl);
      if (parsed) {
        const cleanTitle = (memory.title || `memory_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
        const fileExt = parsed.mimeType.split('/')[1] || 'jpg';
        const fileName = `${memory.id || `mem_${i + 1}`}_${cleanTitle}.${fileExt}`;

        const uploadResult = await uploadImageToSupabaseStorage(parsed.blob, fileName);
        if (uploadResult.url) {
          memory.imageUrl = uploadResult.url;
          memory.storagePath = uploadResult.path;
          uploadedCount++;
          updatedMemories[i] = memory;
        } else {
          console.error(`Failed to upload image for memory ${memory.title}:`, uploadResult.error);
        }
      }
    }
  }

  options.onProgress?.({
    stage: 'saving',
    totalImages: updatedMemories.length,
    currentImageIndex: updatedMemories.length,
    currentImageTitle: '',
    message: 'Saving updated scrapbook memories & permanent photo URLs to Supabase database...',
  });

  const migratedData: UniverseData = {
    ...localData,
    memories: updatedMemories,
  };

  const saveResult = await saveUniverseToSupabase(migratedData, options.pin);

  if (saveResult.success) {
    try {
      localStorage.setItem('our_universe_data_v1', JSON.stringify(migratedData));
    } catch {}

    options.onProgress?.({
      stage: 'complete',
      totalImages: updatedMemories.length,
      currentImageIndex: updatedMemories.length,
      currentImageTitle: '',
      message: `✨ Successfully uploaded ${uploadedCount} photos to Supabase Storage and synchronized with the database!`,
    });

    return {
      success: true,
      message: `✨ Success! ${uploadedCount} photos were uploaded to Supabase Storage, and all content is now saved to your cloud database. Photos will now load on your phone and any device!`,
      uploadedCount,
      alreadyCloudCount,
    };
  } else {
    options.onProgress?.({
      stage: 'error',
      totalImages: updatedMemories.length,
      currentImageIndex: updatedMemories.length,
      currentImageTitle: '',
      message: `Failed to save to database: ${saveResult.message}`,
    });

    return {
      success: false,
      message: `Photos were processed, but saving to the database failed: ${saveResult.message}`,
      uploadedCount,
      alreadyCloudCount,
    };
  }
}

export function subscribeToUniverseChanges(onUpdate: (newData: UniverseData) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:universe_data')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'universe_data',
          filter: 'id=eq.current',
        },
        (payload: any) => {
          if (payload?.new?.data) {
            onUpdate(payload.new.data as UniverseData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Error creating Realtime subscription:', err);
    return () => {};
  }
}

export function downloadUniverseFromLocalStorage(): UniverseData | null {
  try {
    const raw =
      localStorage.getItem('our_universe_data_v1') ||
      localStorage.getItem('romantic-universe-data') ||
      localStorage.getItem('our_universe_data');
    if (!raw) return null;
    return JSON.parse(raw) as UniverseData;
  } catch {
    return null;
  }
}

export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const clean = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${cleanBase}${clean}`;
}
