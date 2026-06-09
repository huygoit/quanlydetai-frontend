import dayjs, { type Dayjs } from 'dayjs';

export type PublicationDateFields = {
  publishedAt?: string | null;
  published_at?: string | null;
  year?: number | null;
};

/** Định dạng hiển thị ngày trên giao diện (Việt Nam) */
export const DINH_DANG_NGAY_HIEN_THI = 'DD/MM/YYYY';

/** Đọc ngày từ API: ưu tiên publishedAt, fallback year → YYYY-01-01 */
export function layPublishedAtTuApi(src: PublicationDateFields): string | undefined {
  const raw = src.publishedAt ?? src.published_at;
  if (raw != null && String(raw).trim() !== '') {
    const s = String(raw).trim();
    const head = s.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
    const dj = dayjs(s);
    if (dj.isValid()) return dj.format('YYYY-MM-DD');
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

/** Hiển thị ngày XB: luôn DD/MM/YYYY (kể cả bản ghi import chỉ có year → 01/01/năm); không có → — */
export function hienThiNgayXuatBan(src: PublicationDateFields): string {
  const iso = layPublishedAtTuApi(src);
  if (!iso) return '—';
  const dj = dayjs(iso);
  return dj.isValid() ? dj.format(DINH_DANG_NGAY_HIEN_THI) : '—';
}
