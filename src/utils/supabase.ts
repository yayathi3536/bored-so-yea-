import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UniverseData } from '../types';

const SUPABASE_URL_KEY = 'romantic_supabase_url_v1';
const SUPABASE_KEY_KEY = 'romantic_supabase_key_v1';
export const SCRAPBOOK_BUCKET = 'scrapbook-images';

export function getSupabaseCredentials(): { url: string; key: string; source: 'env' | 'local' | 'none' } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (envUrl && envKey && !envUrl.includes('placeholder') && !envKey.includes('placeholder')) {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  try {
    const localUrl = localStorage.getItem(SUPABASE_URL_KEY)?.trim() || '';
    const localKey = localStorage.getItem(SUPABASE_KEY_KEY)?.trim() || '';
    if (localUrl && localKey) {
      return { url: localUrl, key: localKey, source: 'local' };
    }
  } catch {}

  return { url: '', key: '', source: 'none' };
}

export function saveSupabaseCredentials(url: string, key: string) {
  try {
    if (!url.trim() && !key.trim()) {
      localStorage.removeItem(SUPABASE_URL_KEY);
      localStorage.removeItem(SUPABASE_KEY_KEY);
    } else {
      localStorage.setItem(SUPABASE_URL_KEY, url.trim());
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
  message: string;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      connected: false,
      tableFound: false,
      storageFound: false,
      message: 'Supabase credentials are not configured yet.',
    };
  }

  try {
    const { error: tableError } = await supabase.from('universe_data').select('id').limit(1);
    const tableFound = !tableError;

    let storageFound = false;
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (!storageError && buckets) {
        storageFound = buckets.some((bucket) => bucket.name === SCRAPBOOK_BUCKET);
      }
    } catch {}

    return {
      connected: true,
      tableFound,
      storageFound,
      message: tableFound
        ? storageFound
          ? 'Connected to Supabase! Database and Storage are fully operational.'
          : 'Connected to Supabase Database! Note: "scrapbook-images" storage bucket was not found.'
        : 'Connected to Supabase API, but table "universe_data" was not found. Run schema SQL.',
    };
  } catch (err: any) {
    return {
      connected: false,
      tableFound: false,
      storageFound: false,
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
    const { error: rpcError } = await supabase.rpc('save_universe_data', {
      edit_pin: pin,
      new_data: universeData,
    });

    if (!rpcError) {
      return {
        success: true,
        message: 'Saved and synchronized successfully with Supabase!',
      };
    }

    if (rpcError.message.toLowerCase().includes('invalid pin') || rpcError.message.toLowerCase().includes('unauthorized')) {
      return {
        success: false,
        message: 'Authorization failed: Invalid owner PIN in Supabase database.',
      };
    }

    const { error: upsertError } = await supabase.from('universe_data').upsert(
      {
        id: 'current',
        data: universeData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (upsertError) {
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

export async function uploadImageToSupabaseStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url?: string; path?: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Supabase storage is not configured.' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `scrapbook/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanFileName}.${fileExt}`;

    if (onProgress) onProgress(30);

    const { error: uploadError } = await supabase.storage.from(SCRAPBOOK_BUCKET).upload(filePath, file, {
      cacheControl: '31536000',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return {
        error: `Storage upload failed: ${uploadError.message}. Make sure the "${SCRAPBOOK_BUCKET}" bucket exists and is private.`,
      };
    }

    if (onProgress) onProgress(90);

    const { data, error: signedUrlError } = await supabase.storage.from(SCRAPBOOK_BUCKET).createSignedUrl(filePath, 60 * 60);
    if (signedUrlError) {
      return { error: signedUrlError.message };
    }

    if (onProgress) onProgress(100);

    return { url: data?.signedUrl, path: filePath };
  } catch (err: any) {
    console.error('Storage upload exception:', err);
    return { error: err.message || 'Failed to upload image' };
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
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const base = import.meta.env.BASE_URL || '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const clean = url.startsWith('/') ? url.slice(1) : url;
  return `${normalizedBase}${clean}`;
}
