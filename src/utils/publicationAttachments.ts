/**
 * Chuỗi `attachmentUrl` từ API — một URL hoặc JSON mảng URL.
 */
export function parsePublicationAttachmentUrls(raw?: string | null): string[] {
  const s = raw?.trim();
  if (!s) return [];
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
      }
    } catch {
      /* bỏ qua, thử tách theo ký tự phân cách */
    }
  }
  if (s.includes('|')) {
    return s.split('|').map((x) => x.trim()).filter(Boolean);
  }
  return [s];
}

export function serializePublicationAttachmentUrls(urls: string[] | undefined): string | undefined {
  const clean = (urls ?? []).map((u) => u.trim()).filter(Boolean);
  if (!clean.length) return undefined;
  if (clean.length === 1) return clean[0];
  return JSON.stringify(clean);
}

export function tenFileTuUrl(url: string): string {
  const path = url.split('?')[0];
  const name = path.split('/').pop();
  return name && name.length > 0 ? decodeURIComponent(name) : 'Tệp đính kèm';
}
