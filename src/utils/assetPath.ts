/**
 * Resolves a public asset path to properly respect Vite's base URL
 * (e.g., for GitHub Pages subpath /bored-so-yea-/ or local dev /).
 */
export function resolveAssetUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Keep absolute web URLs, data URIs, and blob URLs as-is
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // If path is a Supabase Storage path like scrapbook/...
  if (trimmed.startsWith('scrapbook/')) {
    const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('romantic_supabase_url_v1') : null;
    const baseSupabaseUrl = (customUrl?.trim() || import.meta.env.VITE_SUPABASE_URL || 'https://updbgvanowpgjbkdliyo.supabase.co').replace(/\/+$/, '');
    return `${baseSupabaseUrl}/storage/v1/object/public/scrapbook-images/${trimmed}`;
  }

  // Normalize legacy image names or aliases
  let clean = trimmed;
  if (clean.includes('1000080965.jpg')) {
    clean = 'images/original_memory.jpg';
  } else if (clean.includes('/src/assets/')) {
    clean = clean.replace(/\/src\/assets\//g, 'images/');
  }

  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const baseWithoutSlashes = base.replace(/^\/+|\/+$/g, '');

  // Strip leading slash
  if (clean.startsWith('/')) {
    clean = clean.slice(1);
  }

  // If path already starts with base folder name, prevent duplicate prefixing
  if (baseWithoutSlashes && clean.startsWith(baseWithoutSlashes)) {
    clean = clean.slice(baseWithoutSlashes.length);
    if (clean.startsWith('/')) {
      clean = clean.slice(1);
    }
  }

  return `${cleanBase}${clean}`;
}

/**
 * Optimizes and downscales a user-selected file into a compact,
 * high-quality base64 Data URL so it fits easily within localStorage quotas.
 */
export function optimizeImageFile(file: File, maxDimension = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    // If SVG or already very small, use as is
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized JPEG data url
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Unable to decode image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
