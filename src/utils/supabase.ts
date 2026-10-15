import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
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
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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

// -------------------------------------------------------------
// Supabase Authentication Methods for Admin Access
// -------------------------------------------------------------

export async function getCurrentAdminUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function adminSignIn(
  email: string,
  password: string
): Promise<{ user: User | null; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { user: null, error: 'Supabase credentials not configured.' };

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    return { user: data.user };
  } catch (err: any) {
    return { user: null, error: err.message || 'Failed to sign in' };
  }
}

export async function adminSignUp(
  email: string,
  password: string
): Promise<{ user: User | null; error?: string; confirmationSent?: boolean }> {
  const supabase = getSupabase();
  if (!supabase) return { user: null, error: 'Supabase credentials not configured.' };

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    // If email confirmation is required by Supabase project settings
    if (data.user && !data.session) {
      return { user: data.user, confirmationSent: true };
    }

    return { user: data.user };
  } catch (err: any) {
    return { user: null, error: err.message || 'Failed to sign up' };
  }
}

export async function adminSignOut(): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return {};

  try {
    const { error } = await supabase.auth.signOut();
    return { error: error?.message };
  } catch (err: any) {
    return { error: err.message || 'Failed to sign out' };
  }
}

export function onAdminAuthStateChange(callback: (user: User | null) => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  } catch {
    return () => {};
  }
}

// -------------------------------------------------------------
// Signed URLs & Private Bucket Handling
// -------------------------------------------------------------

// In-memory cache for signed URLs to minimize round-trips
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

export function getSignedUrlFromCache(storagePath: string): string | null {
  if (!storagePath) return null;
  const cached = signedUrlCache.get(storagePath);
  if (cached && cached.expiresAt > Date.now() + 60 * 1000) {
    return cached.url;
  }
  return null;
}

export async function createSignedUrlForPath(
  storagePath: string,
  expiresInSeconds = 604800 // 7 days
): Promise<{ url: string | null; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { url: null, error: 'Supabase not initialized' };

  const cleanPath = storagePath.startsWith('scrapbook/')
    ? storagePath
    : storagePath.replace(/^\/+/, '');

  // Check cache first
  const cached = getSignedUrlFromCache(cleanPath);
  if (cached) return { url: cached };

  try {
    const { data, error } = await supabase.storage
      .from(SCRAPBOOK_BUCKET)
      .createSignedUrl(cleanPath, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return { url: null, error: error?.message || 'Failed to generate signed URL' };
    }

    // Cache the signed URL
    signedUrlCache.set(cleanPath, {
      url: data.signedUrl,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    });

    return { url: data.signedUrl };
  } catch (err: any) {
    return { url: null, error: err.message || 'Signed URL error' };
  }
}

/**
 * Ensures all memories with storagePath or private paths have fresh,
 * active signed URLs so they display seamlessly on any visitor's phone or computer.
 */
export async function refreshUniverseSignedUrls(universeData: UniverseData): Promise<UniverseData> {
  const supabase = getSupabase();
  if (!supabase || !universeData?.memories || universeData.memories.length === 0) {
    return universeData;
  }

  const updatedMemories: MemoryItem[] = await Promise.all(
    universeData.memories.map(async (mem) => {
      const path = mem.storagePath || (mem.imageUrl?.startsWith('scrapbook/') ? mem.imageUrl : null);
      if (!path) return mem;

      // Extract storage path from signed URL if already there
      const cleanPath = path.startsWith('scrapbook/') ? path : `scrapbook/${path.replace(/^.*scrapbook\//, '')}`;

      const { url } = await createSignedUrlForPath(cleanPath, 604800);
      if (url) {
        return {
          ...mem,
          storagePath: cleanPath,
          imageUrl: url,
        };
      }
      return mem;
    })
  );

  return {
    ...universeData,
    memories: updatedMemories,
  };
}

// -------------------------------------------------------------
// Connection Diagnostics & Health Check
// -------------------------------------------------------------

export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tableFound: boolean;
  storageFound: boolean;
  storageWritable?: boolean;
  hasCloudData: boolean;
  cloudPhotoCount: number;
  isAdminAuthenticated: boolean;
  adminEmail?: string;
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
      isAdminAuthenticated: false,
      message: 'Supabase Anon Key is not configured yet. Set it in GitHub Secrets or Owner Mode.',
    };
  }

  try {
    // 0. Check admin authentication status
    let isAdminAuthenticated = false;
    let adminEmail: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        isAdminAuthenticated = true;
        adminEmail = user.email;
      }
    } catch {}

    // 1. Test database table (public select)
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
      cloudPhotoCount = memories.filter((m) => Boolean(m.storagePath || isCloudImageUrl(m.imageUrl))).length;
    }

    // 2. Test storage bucket
    let storageFound = false;
    try {
      const { data: objectList, error: listError } = await supabase.storage
        .from(SCRAPBOOK_BUCKET)
        .list('', { limit: 1 });

      if (!listError) {
        storageFound = true;
      } else {
        const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
        if (!storageError && buckets) {
          storageFound = buckets.some((bucket) => bucket.name === SCRAPBOOK_BUCKET);
        }
      }
    } catch (e) {
      console.warn('Storage connection check notice:', e);
    }

    let message = '';
    if (tableFound && storageFound) {
      if (isAdminAuthenticated) {
        message = `Connected & Authenticated as ${adminEmail}! Cloud database and private storage are ready.`;
      } else {
        message = hasCloudData
          ? `Connected to Supabase! Public read is active (${cloudPhotoCount} photos available). Sign in to enable admin edits.`
          : 'Connected to Supabase! Database and Storage are ready. Sign in to start syncing content.';
      }
    } else if (tableFound && !storageFound) {
      message = 'Connected to Database! Note: "scrapbook-images" storage bucket not found. Run the SQL setup script.';
    } else if (!tableFound && storageFound) {
      message = 'Connected to Storage! Note: "universe_data" table not found. Run supabase-schema.sql.';
    } else {
      message = 'Connected to Supabase API, but database table and storage bucket were not found. Run supabase-schema.sql in SQL Editor.';
    }

    return {
      connected: true,
      tableFound,
      storageFound,
      hasCloudData,
      cloudPhotoCount,
      isAdminAuthenticated,
      adminEmail,
      message,
    };
  } catch (err: any) {
    return {
      connected: false,
      tableFound: false,
      storageFound: false,
      hasCloudData: false,
      cloudPhotoCount: 0,
      isAdminAuthenticated: false,
      message: `Connection failed: ${err.message || String(err)}`,
    };
  }
}

// -------------------------------------------------------------
// Database Operations: Fetch & Authorized Save
// -------------------------------------------------------------

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

    // Refresh signed URLs for private bucket images
    const rawData = data.data as UniverseData;
    const refreshed = await refreshUniverseSignedUrls(rawData);
    return { data: refreshed };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown network error' };
  }
}

export async function saveUniverseToSupabase(
  universeData: UniverseData,
  pin: string
): Promise<{ success: boolean; message: string; requiresAuth?: boolean }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase credentials not configured. Saved locally to this browser.',
    };
  }

  try {
    // Check if user is authenticated with Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        requiresAuth: true,
        message: 'Admin authentication required: Please sign in with your Supabase Admin account to save changes to the cloud database.',
      };
    }

    // 1. Direct authorized table upsert (preferred Supabase Auth pattern)
    const { error: upsertError } = await supabase.from('universe_data').upsert(
      {
        id: 'current',
        data: universeData,
        pin_hash: 'admin-auth',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (!upsertError) {
      return {
        success: true,
        message: 'Saved and synchronized successfully with Supabase Cloud!',
      };
    }

    console.warn('Direct upsert returned error, trying RPC fallback:', upsertError);

    // 2. RPC fallback: save_universe_data
    const { error: rpcError } = await supabase.rpc('save_universe_data', {
      new_data: universeData,
      edit_pin: pin,
    });

    if (!rpcError) {
      return {
        success: true,
        message: 'Saved and synchronized successfully via secure RPC!',
      };
    }

    console.error('Supabase direct upsert error:', upsertError, 'RPC error:', rpcError);

    if (
      upsertError.message.toLowerCase().includes('row-level security') ||
      upsertError.message.toLowerCase().includes('violates row-level security policy')
    ) {
      return {
        success: false,
        message:
          'Database save error: row violates row-level security policy for table "universe_data". Run the updated SQL setup script in Supabase SQL Editor to grant authenticated write permissions.',
      };
    }

    return {
      success: false,
      message: `Database save error: ${upsertError.message || rpcError.message}`,
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

// -------------------------------------------------------------
// Image Utilities: Detect, Convert, Upload to Private Bucket
// -------------------------------------------------------------

export function isCloudImageUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.includes('.supabase.co/storage/v1/object/') ||
    trimmed.includes('/storage/v1/object/public/') ||
    trimmed.includes('/storage/v1/object/sign/') ||
    (trimmed.startsWith('https://') && trimmed.includes('/storage/v1/'))
  );
}

export function isLocalImageData(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/images/') ||
    trimmed.startsWith('images/') ||
    trimmed.includes('mail.google.com') ||
    trimmed.includes('googleusercontent.com')
  );
}

/**
 * Detects external URLs (such as Gmail attachments) that cannot be fetched
 * by browser scripts due to authentication cookies or CORS policies.
 */
export function isUnfetchableExternalUrl(url?: string): { blocked: boolean; reason?: string } {
  if (!url) return { blocked: false };
  const trimmed = url.trim().toLowerCase();

  if (
    trimmed.includes('mail.google.com') ||
    trimmed.includes('googleusercontent.com/mail') ||
    trimmed.includes('mail-attachment.googleusercontent.com')
  ) {
    return {
      blocked: true,
      reason: 'Gmail attachment URL requires your personal Google session cookies; browser fetch is blocked by CORS. Please download this photo from Gmail and select that file directly.',
    };
  }

  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com')
  ) {
    return {
      blocked: true,
      reason: 'Google Drive/Docs URL requires authentication cookies. Please select the image file directly from your computer.',
    };
  }

  return { blocked: false };
}

export interface ImageConversionResult {
  blob: Blob | null;
  mimeType: string;
  isBlocked?: boolean;
  reason?: string;
}

export async function imageSourceToBlob(source: string): Promise<ImageConversionResult> {
  if (!source) return { blob: null, mimeType: '', reason: 'Empty image source' };
  const trimmed = source.trim();

  // 1. Direct Base64 Data URL decoding (offline, safe, never touches network)
  if (trimmed.startsWith('data:')) {
    try {
      const parts = trimmed.split(';base64,');
      if (parts.length === 2) {
        const mimeType = parts[0].replace('data:', '').trim() || 'image/jpeg';
        const cleanBase64 = parts[1].trim().replace(/\s/g, '');
        const binaryStr = atob(cleanBase64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return { blob: new Blob([bytes], { type: mimeType }), mimeType };
      }
    } catch (e) {
      console.warn('Base64 direct conversion failed, trying fetch fallback:', e);
    }
  }

  // 2. Proactively detect blocked external URLs (e.g. Gmail attachments) WITHOUT triggering fetch errors
  const urlCheck = isUnfetchableExternalUrl(trimmed);
  if (urlCheck.blocked) {
    return {
      blob: null,
      mimeType: '',
      isBlocked: true,
      reason: urlCheck.reason,
    };
  }

  // 3. Browser native fetch for blob:, relative local paths, or public URLs
  try {
    const res = await fetch(trimmed);
    if (res.ok) {
      const blob = await res.blob();
      const mimeType = blob.type || 'image/jpeg';
      return { blob, mimeType };
    }
    return {
      blob: null,
      mimeType: '',
      reason: `HTTP ${res.status}: Server returned error for image URL`,
    };
  } catch (err: any) {
    return {
      blob: null,
      mimeType: '',
      isBlocked: true,
      reason: `Could not fetch image (${err?.message || 'network/CORS restriction'}). Please select the image file directly from your computer.`,
    };
  }
}

export const base64ToBlob = (base64DataUrl: string) => {
  try {
    const parts = base64DataUrl.split(';base64,');
    if (parts.length !== 2) return null;
    const mimeType = parts[0].replace('data:', '').trim() || 'image/jpeg';
    const binaryStr = atob(parts[1].trim().replace(/\s/g, ''));
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return { blob: new Blob([bytes], { type: mimeType }), mimeType };
  } catch {
    return null;
  }
};

/**
 * Uploads an image to the private scrapbook-images bucket and generates a 7-day signed URL.
 * Preserves the permanent storagePath for database storage.
 */
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
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: 'Admin authentication required to upload photos. Please sign in to Supabase Auth.' };
    }

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
        error: `Storage upload failed: ${uploadError.message}. Make sure you are signed in as Admin and the private bucket policy is set up.`,
      };
    }

    if (onProgress) onProgress(75);

    // Generate signed URL (7 days = 604800 seconds) for private bucket access
    const { url: signedUrl, error: signError } = await createSignedUrlForPath(filePath, 604800);

    if (signError || !signedUrl) {
      return { error: `File uploaded to ${filePath}, but failed to generate signed URL: ${signError}` };
    }

    // Non-blocking metadata insert for tracking
    try {
      await supabase.from('scrapbook_images').insert({
        file_path: filePath,
        public_url: signedUrl,
        file_name: cleanFileName,
        mime_type: file.type || 'image/jpeg',
        size_bytes: file.size,
      });
    } catch {}

    if (onProgress) onProgress(100);

    return { url: signedUrl, path: filePath };
  } catch (err: any) {
    console.error('Storage upload exception:', err);
    return { error: err.message || 'Failed to upload image' };
  }
}

export interface PhotoAnalysisItem {
  id: string;
  title: string;
  date: string;
  imageUrl?: string;
  storagePath?: string;
  isLocal: boolean;
  isCloud: boolean;
  isGmailOrExternalBlocked?: boolean;
  blockedReason?: string;
  sizeEstimate: string;
}

export function analyzeUniversePhotos(data: UniverseData): {
  totalMemories: number;
  localCount: number;
  cloudCount: number;
  emptyCount: number;
  unfetchableCount: number;
  items: PhotoAnalysisItem[];
} {
  const memories = data.memories || [];
  let localCount = 0;
  let cloudCount = 0;
  let emptyCount = 0;
  let unfetchableCount = 0;

  const items: PhotoAnalysisItem[] = memories.map((m, idx) => {
    const img = (m.imageUrl || '').trim();
    const hasPath = Boolean(m.storagePath);
    const isCloud = hasPath || isCloudImageUrl(img);
    const blockedCheck = isUnfetchableExternalUrl(img);
    const isGmailOrExternalBlocked = !isCloud && blockedCheck.blocked;
    const isLocal = !isCloud && (isLocalImageData(img) || isGmailOrExternalBlocked);
    const isEmpty = !img && !hasPath;

    if (isCloud) cloudCount++;
    else if (isGmailOrExternalBlocked) {
      unfetchableCount++;
      localCount++;
    } else if (isLocal) localCount++;
    else if (isEmpty) emptyCount++;
    else localCount++;

    let sizeEstimate = 'N/A';
    if (img.startsWith('data:')) {
      const bytes = Math.round((img.length * 3) / 4);
      sizeEstimate = bytes > 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
    } else if (isCloud) {
      sizeEstimate = 'Cloud Storage';
    } else if (isGmailOrExternalBlocked) {
      sizeEstimate = 'Gmail Attachment (Manual Upload)';
    } else if (img) {
      sizeEstimate = 'Local File';
    }

    return {
      id: m.id || `mem-${idx + 1}`,
      title: m.title || `Memory #${idx + 1}`,
      date: m.date || 'Special Day',
      imageUrl: m.imageUrl,
      storagePath: m.storagePath,
      isLocal,
      isCloud,
      isGmailOrExternalBlocked,
      blockedReason: blockedCheck.reason,
      sizeEstimate,
    };
  });

  return {
    totalMemories: memories.length,
    localCount,
    cloudCount,
    emptyCount,
    unfetchableCount,
    items,
  };
}

export interface MigrationProgressUpdate {
  stage: 'checking' | 'uploading' | 'saving' | 'complete' | 'error';
  totalImages: number;
  currentImageIndex: number;
  currentImageTitle: string;
  message: string;
}

export interface MigrationItemResult {
  id: string;
  title: string;
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
  isManualRequired?: boolean;
}

export async function migrateLocalContentToSupabase(options: {
  pin: string;
  sourceData?: UniverseData;
  forceOverwriteServer?: boolean;
  onProgress?: (update: MigrationProgressUpdate) => void;
  onItemComplete?: (itemResult: MigrationItemResult) => void;
}): Promise<{
  success: boolean;
  message: string;
  uploadedCount: number;
  alreadyCloudCount: number;
  failedCount: number;
  serverHasExistingData?: boolean;
  errors: Array<{ id?: string; title: string; error: string; isManualRequired?: boolean; originalUrl?: string }>;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase credentials are not configured. Please enter your Supabase Anon Key in Owner Mode.',
      uploadedCount: 0,
      alreadyCloudCount: 0,
      failedCount: 0,
      errors: [],
    };
  }

  // Check admin authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      message: 'Admin authentication required: Please sign in with your Supabase Admin account before migrating photos.',
      uploadedCount: 0,
      alreadyCloudCount: 0,
      failedCount: 0,
      errors: [],
    };
  }

  // Use provided sourceData or read from localStorage
  const localData = options.sourceData || downloadUniverseFromLocalStorage();
  if (!localData) {
    return {
      success: false,
      message: 'No saved memories found to migrate. Please export or restore your JSON backup first.',
      uploadedCount: 0,
      alreadyCloudCount: 0,
      failedCount: 0,
      errors: [],
    };
  }

  options.onProgress?.({
    stage: 'checking',
    totalImages: localData.memories.length,
    currentImageIndex: 0,
    currentImageTitle: '',
    message: 'Verifying Supabase connection and checking existing cloud data...',
  });

  // Check if server already has data
  if (!options.forceOverwriteServer) {
    const { data: serverData } = await fetchUniverseFromSupabase();
    if (serverData && serverData.memories && serverData.memories.length > 0) {
      const serverHasCloudImages = serverData.memories.some((m) => Boolean(m.storagePath || isCloudImageUrl(m.imageUrl)));
      if (serverHasCloudImages) {
        return {
          success: false,
          serverHasExistingData: true,
          message:
            'Supabase Cloud already contains saved memories and photos. Confirm if you want to upload and synchronize your computer’s local content to update the cloud database.',
          uploadedCount: 0,
          alreadyCloudCount: serverData.memories.filter((m) => Boolean(m.storagePath || isCloudImageUrl(m.imageUrl))).length,
          failedCount: 0,
          errors: [],
        };
      }
    }
  }

  let uploadedCount = 0;
  let alreadyCloudCount = 0;
  let failedCount = 0;
  const errors: Array<{ id?: string; title: string; error: string; isManualRequired?: boolean; originalUrl?: string }> = [];
  const updatedMemories: MemoryItem[] = [...localData.memories];

  for (let i = 0; i < updatedMemories.length; i++) {
    const memory = { ...updatedMemories[i] };
    const imageUrl = (memory.imageUrl || '').trim();
    const storagePath = (memory.storagePath || '').trim();

    // Skip duplicate upload if already in Supabase Cloud
    if (storagePath || isCloudImageUrl(imageUrl)) {
      alreadyCloudCount++;
      options.onItemComplete?.({
        id: memory.id,
        title: memory.title,
        success: true,
        url: imageUrl,
        path: storagePath,
      });
      continue;
    }

    // If memory has a local image or base64 or blob or relative path
    if (imageUrl) {
      options.onProgress?.({
        stage: 'uploading',
        totalImages: updatedMemories.length,
        currentImageIndex: i + 1,
        currentImageTitle: memory.title || `Memory #${i + 1}`,
        message: `Processing photo ${i + 1} of ${updatedMemories.length} ("${memory.title}")...`,
      });

      const parsed = await imageSourceToBlob(imageUrl);
      if (parsed.blob) {
        const cleanTitle = (memory.title || `memory_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
        const fileExt = parsed.mimeType.split('/')[1] || 'jpg';
        const fileName = `${memory.id || `mem_${i + 1}`}_${cleanTitle}.${fileExt}`;

        const uploadResult = await uploadImageToSupabaseStorage(parsed.blob, fileName);
        if (uploadResult.url && uploadResult.path) {
          memory.imageUrl = uploadResult.url;
          memory.storagePath = uploadResult.path;
          uploadedCount++;
          updatedMemories[i] = memory;
          options.onItemComplete?.({
            id: memory.id,
            title: memory.title,
            success: true,
            url: uploadResult.url,
            path: uploadResult.path,
          });
        } else {
          failedCount++;
          const errMsg = uploadResult.error || 'Upload failed';
          errors.push({ id: memory.id, title: memory.title, error: errMsg, originalUrl: imageUrl });
          options.onItemComplete?.({
            id: memory.id,
            title: memory.title,
            success: false,
            error: errMsg,
          });
        }
      } else {
        // Skipped because unfetchable (e.g. Gmail attachment) or fetch failed
        failedCount++;
        const errMsg = parsed.reason || 'Could not fetch image';
        errors.push({
          id: memory.id,
          title: memory.title,
          error: errMsg,
          isManualRequired: Boolean(parsed.isBlocked),
          originalUrl: imageUrl,
        });
        options.onItemComplete?.({
          id: memory.id,
          title: memory.title,
          success: false,
          error: errMsg,
          isManualRequired: Boolean(parsed.isBlocked),
        });
        // Note: We preserve updatedMemories[i] intact so original data is not lost!
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
    // Preserve local data safely by updating cache with permanent URLs (no deletion)
    try {
      localStorage.setItem('our_universe_data_v1', JSON.stringify(migratedData));
    } catch {}

    const successMessage =
      uploadedCount > 0
        ? `✨ Processed! ${uploadedCount} photos were uploaded to Supabase Storage.${
            failedCount > 0
              ? ` Note: ${failedCount} item(s) (such as Gmail attachments) require manual file selection below.`
              : ''
          }`
        : failedCount > 0
        ? `Note: ${failedCount} item(s) could not be fetched automatically (such as Gmail attachments). Please select the downloaded image files manually using the buttons below.`
        : 'All photos are already synchronized!';

    options.onProgress?.({
      stage: 'complete',
      totalImages: updatedMemories.length,
      currentImageIndex: updatedMemories.length,
      currentImageTitle: '',
      message: successMessage,
    });

    return {
      success: true,
      message: successMessage,
      uploadedCount,
      alreadyCloudCount,
      failedCount,
      errors,
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
      message: `Photos were processed (${uploadedCount} uploaded), but saving to the database failed: ${saveResult.message}`,
      uploadedCount,
      alreadyCloudCount,
      failedCount,
      errors,
    };
  }
}

/**
 * Uploads a user-selected image file from disk for a specific memory,
 * updates the memory's storagePath and signed imageUrl,
 * and saves the updated universe to Supabase and localStorage.
 */
export async function uploadSingleMemoryImageFile(
  memoryId: string,
  file: File,
  currentUniverse: UniverseData,
  onProgress?: (percent: number) => void
): Promise<{ success: boolean; updatedUniverse?: UniverseData; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase credentials not configured' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Admin authentication required. Please sign in to Supabase Auth in the Backup tab.' };
  }

  const memoryIndex = currentUniverse.memories.findIndex((m) => m.id === memoryId);
  if (memoryIndex === -1) {
    return { success: false, error: `Memory with ID ${memoryId} not found` };
  }

  const memory = currentUniverse.memories[memoryIndex];
  const cleanTitle = (memory.title || `memory_${memoryIndex + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  const fileExt = file.type ? file.type.split('/')[1] || 'jpg' : 'jpg';
  const fileName = `${memory.id}_${cleanTitle}.${fileExt}`;

  const uploadRes = await uploadImageToSupabaseStorage(file, fileName, onProgress);
  if (!uploadRes.url || !uploadRes.path) {
    return { success: false, error: uploadRes.error || 'Upload failed' };
  }

  const updatedMemories = [...currentUniverse.memories];
  updatedMemories[memoryIndex] = {
    ...memory,
    storagePath: uploadRes.path,
    imageUrl: uploadRes.url,
  };

  const newUniverse: UniverseData = {
    ...currentUniverse,
    memories: updatedMemories,
  };

  // Save to database
  const saveRes = await saveUniverseToSupabase(newUniverse, '1234');
  if (!saveRes.success) {
    return {
      success: false,
      error: `Uploaded to storage (${uploadRes.path}), but saving to database failed: ${saveRes.message}`,
    };
  }

  // Update local cache safely
  try {
    localStorage.setItem('our_universe_data_v1', JSON.stringify(newUniverse));
  } catch {}

  return { success: true, updatedUniverse: newUniverse };
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
        async (payload: any) => {
          if (payload?.new?.data) {
            const rawData = payload.new.data as UniverseData;
            const refreshed = await refreshUniverseSignedUrls(rawData);
            onUpdate(refreshed);
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

  // Check signed URL cache for scrapbook storage paths
  if (trimmed.startsWith('scrapbook/')) {
    const cached = getSignedUrlFromCache(trimmed);
    if (cached) return cached;
  }

  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const clean = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  return `${cleanBase}${clean}`;
}

export const STORAGE_PERMISSIONS_SQL = `-- 1-Click Fix for Supabase Storage Bucket & Private Access Policies
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'scrapbook-images',
  'scrapbook-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/avif']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/avif'];

drop policy if exists "Scrapbook images select" on storage.objects;
drop policy if exists "Scrapbook images public select" on storage.objects;
create policy "Scrapbook images select"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'scrapbook-images');

drop policy if exists "Scrapbook images insert" on storage.objects;
drop policy if exists "Scrapbook images public insert" on storage.objects;
create policy "Scrapbook images insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'scrapbook-images');

drop policy if exists "Scrapbook images update" on storage.objects;
drop policy if exists "Scrapbook images public update" on storage.objects;
create policy "Scrapbook images update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'scrapbook-images')
  with check (bucket_id = 'scrapbook-images');

drop policy if exists "Scrapbook images delete" on storage.objects;
drop policy if exists "Scrapbook images public delete" on storage.objects;
create policy "Scrapbook images delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'scrapbook-images');
`;
