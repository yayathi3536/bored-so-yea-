/**
 * Resolves a public asset path to properly respect Vite's base URL
 * (e.g., for GitHub Pages subpath /bored-so-yea-/ or local dev /).
 */
export function resolveAssetUrl(url: string | undefined): string {
  if (!url) return '';
  // Keep absolute web URLs, data URIs, and blob URLs as-is
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${cleanBase}${cleanPath}`;
}
