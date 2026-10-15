import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UniverseData } from '../types';

// Storage keys for custom Supabase credentials configured via Owner Mode
const SUPABASE_URL_KEY = 'romantic_supabase_url_v1';
const SUPABASE_KEY_KEY = 'romantic_supabase_key_v1';
export const SCRAPBOOK_BUCKET = 'scrapbook-images';

/**
 * Retrieves the effective Supabase URL and Anon Key.
 * Checks build-time environment variables first, then localStorage config.
 */
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

/**
 * Saves or clears custom Supabase credentials in local storage.
 */
export function saveSupabaseCredentials(url: string, key: string) {
  try {
    if (!url.trim() && !key.trim()) {
      localStorage.removeItem(SUPABASE_URL_KEY);
      localStorage.removeItem(SUPABASE_KEY_KEY);
    } else {
      localStorage.setItem(SUPABASE_URL_KEY, url.trim());
      localStorage.setItem(SUPABASE_KEY_KEY, key.trim());
    }
    // Invalidate cached client
    cachedClient = null;
  } catch (err) {
    console.error('Failed to save Supabase credentials:', err);
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

/**
 * Returns a initialized Supabase client or null if credentials are not configured.
 */
export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) {
    return null;
  }

  if (cachedClient && lastUsedUrl === url && lastUsedKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
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

/**
 * Tests connection to the Supabase database.
 */
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
    // 1. Test database access
    const { data: dbData, error: dbError } = await supabase
      .from('universe_data')
      .select('id, updated_at')
      .limit(1);

    const connected = !dbError || dbError.code !== 'PGRST301'; // PGRST301 is JWT error
    const tableFound = !dbError;

    // 2. Test storage access
    let storageFound = false;
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      if (!storageError && buckets) {
        storageFound = buckets.some((b) => b.name === SCRAPBOOK_BUCKET);
      }
    } catch {}

    if (tableFound) {
      return {
        connected: true,
        tableFound: true,
        storageFound,
        message: storageFound
          ? 'Connected to Supabase! Database and Storage are fully operational.'
          : 'Connected to Supabase Database! Note: "scrapbook-images" storage bucket was not found.',
      };
    } else {
      return {
        connected: true,
        tableFound: false,
        storageFound,
        message: `Connected to Supabase API, but table 'universe_data' was not found: ${dbError?.message || 'Run schema SQL'}.`,
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      tableFound: false,
      storageFound: false,
      message: `Connection failed: ${err.message || String(err)}`,
    };
  }
}

/**
 * Fetches the latest Universe data from Supabase.
 * Returns null if not configured, or if table is empty.
 */
export async function fetchUniverseFromSupabase(): Promise<{
  data: UniverseData | null;
  updatedAt?: string;
  error?: string;
}> {
  const supabase = getSupabase();
  if (!supabase) return { data: null };

  try {
    const { data, error } = await supabase
      .from('universe_data')
      .select('data, updated_at')
      .eq('id', 'current')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return { data: null, error: error.message };
    }

    if (data && data.data) {
      return {
        data: data.data as UniverseData,
        updatedAt: data.updated_at,
      };
    }

    return { data: null };
  } catch (err: any) {
    console.error('Failed to fetch from Supabase:', err);
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

/**
 * Saves Universe data to Supabase.
 * Attempts secure Postgres RPC function first with PIN verification.
 * Falls back to direct upsert if RPC is not installed.
 */
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
    // 1. Try secure Postgres RPC function
    const { data: rpcData, error: rpcError } = await supabase.rpc('save_universe_data', {
      edit_pin: pin,
      new_data: universeData,
    });

    if (!rpcError) {
      return {
        success: true,
        message: 'Saved and synchronized successfully with Supabase!',
      };
    }

    // If error was explicitly "Invalid PIN" or unauthorized
    if (rpcError.message.toLowerCase().includes('invalid pin') || rpcError.message.toLowerCase().includes('unauthorized')) {
      return {
        success: false,
        message: 'Authorization failed: Invalid owner PIN in Supabase database.',
      };
    }

    console.warn('RPC save_universe_data failed, attempting direct upsert:', rpcError.message);

    // 2. Fallback to direct table upsert (for setups using standard table policies)
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

/**
 * Updates the Owner PIN on Supabase.
 */
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

/**
 * Uploads a scrapbook image file directly to Supabase Storage.
 * Returns the permanent public CDN URL.
 */
export async function uploadImageToSupabaseStorage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { url: '', error: 'Supabase storage is not configured.' };
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `scrapbook/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanFileName}`;

    if (onProgress) onProgress(30);

    const { error: uploadError } = await supabase.storage
      .from(SCRAPBOOK_BUCKET)
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return {
        url: '',
        error: `Storage upload failed: ${uploadError.message}. Make sure the "${SCRAPBOOK_BUCKET}" bucket exists with public read access.`,
      };
    }

    if (onProgress) onProgress(90);

    const { data: urlData } = supabase.storage
      .from(SCRAPBOOK_BUCKET)
      .getPublicUrl(filePath);

    if (onProgress) onProgress(100);

    return { url: urlData.publicUrl };
  } catch (err: any) {
    console.error('Storage upload exception:', err);
    return { url: '', error: err.message || 'Failed to upload image' };
  }
}

/**
 * Subscribes to Realtime changes on universe_data.
 * Whenever anyone updates the database, callback receives the new data.
 */
export function subscribeToUniverseChanges(
  onUpdate: (newData: UniverseData) => void
): () => void {
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
          if (payload.new && payload.new.data) {
            onUpdate(payload.new.data as UniverseData);
          }
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          // Subscribed
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (err) {
    console.error('Error creating Realtime subscription:', err);
    return () => {};
  }
}
