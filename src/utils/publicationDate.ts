import dayjs, { type Dayjs } from 'dayjs';

export type PublicationDateFields = {
  publishedAt?: string | null;
  published_at?: string | null;
  year?: number | null;
};

/** Đọc ngày từ API: ưu tiên publishedAt, fallback year → YYYY-01-01 */
export function layPublishedAtTuApi(src: PublicationDateFields): string | undefined {
  const raw = src.publishedAt ?? src.published_at;
  if (raw) {
    const s = String(raw).slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  }
  if (src.year != null && Number.isFinite(Number(src.year))) {
    return `${Number(src.year)}-01-01`;
  }
  return undefined;
}

/** Giá trị cho DatePicker trong form */
export function publishedAtRaDayjs(src: PublicationDateFields): Dayjs | null {
  const d = layPublishedAtTuApi(src);
  if (!d) return null;
  const dj = dayjs(d);
  return dj.isValid() ? dj : null;
}

/** Gửi BE định dạng YYYY-MM-DD */
export function dayjsRaPublishedAt(value: Dayjs | null | undefined): string | undefined {
  if (!value || !value.isValid()) return undefined;
  return value.format('YYYY-MM-DD');
}
