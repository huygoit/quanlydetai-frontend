import type { StaffPositionOption } from '@/services/api/staffPositions';

/** Parse chuỗi ID từ DB → number[] */
export function parseChucVuIds(raw?: string | null): number[] {
  if (!raw) return [];
  const seen = new Set<number>();
  const out: number[] = [];
  for (const part of String(raw).split(',')) {
    const n = Number(part.trim());
    if (!Number.isFinite(n) || n <= 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

/** number[] → chuỗi lưu DB */
export function chuoiChucVuIds(ids?: number[] | null): string | null {
  if (!ids?.length) return null;
  const seen = new Set<number>();
  const out: number[] = [];
  for (const n of ids) {
    if (!Number.isFinite(n) || n <= 0 || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out.length ? out.join(',') : null;
}

/** Hiển thị tên từ danh sách ID */
export function nhanChucVuTuIds(
  raw: string | null | undefined,
  catalog: StaffPositionOption[],
): string {
  const ids = parseChucVuIds(raw);
  if (!ids.length) return '';
  const byId = new Map(catalog.map((c) => [c.id, c.name]));
  return ids
    .map((id) => byId.get(id) || `#${id}`)
    .filter(Boolean)
    .join(', ');
}

/** Options select — value là id số */
export function catalogThanhSelectOptions(
  catalog: StaffPositionOption[],
): { value: number; label: string }[] {
  return catalog.map((c) => ({ value: c.id, label: c.name }));
}

/** Gộp ID đang lưu nhưng không còn trong catalog (hiển thị #id) */
export function gopIdChucVuVaoOptions(
  options: { value: number; label: string }[],
  ids?: number[],
): { value: number; label: string }[] {
  if (!ids?.length) return options;
  const have = new Set(options.map((o) => o.value));
  const extra = ids
    .filter((id) => !have.has(id))
    .map((id) => ({ value: id, label: `#${id} (ngoài danh mục)` }));
  return [...extra, ...options];
}
