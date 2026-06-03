import { API_BASE_URL } from '@/services/request';

/**
 * URL file public từ backend (vd. /storage/profile-attachments/...).
 * Khi API khác origin (UMI_APP_API_URL), ghép base để <img src> tải đúng host.
 */
export function resolvePublicAssetUrl(url?: string | null): string | undefined {
  const raw = url?.trim();
  if (!raw) return undefined;
  if (
    raw.startsWith('http://') ||
    raw.startsWith('https://') ||
    raw.startsWith('blob:') ||
    raw.startsWith('data:')
  ) {
    return raw;
  }
  if (raw.startsWith('/')) {
    const base = API_BASE_URL.replace(/\/+$/, '');
    return base ? `${base}${raw}` : raw;
  }
  return raw;
}
