import type { PublicationAuthor } from '@/services/api/profilePublications';

/** Thông báo thống nhất khi thiếu tác giả đầu hoặc tác giả liên hệ */
export const LOI_THIEU_TAC_GIA_NHOM_CHINH =
  'Cần ít nhất 1 tác giả đầu hoặc 1 tác giả liên hệ trong danh sách tác giả';

/** Hint trong modal quy đổi giờ khi chưa có nhóm chính (đầu hoặc liên hệ) */
export const HINT_KHONG_QUY_DOI_THIEU_NHOM_CHINH =
  'Hệ thống chưa thể quy đổi giờ NCKH đối với bài báo này do thiếu tác giả thuộc nhóm chính';

/** Có ít nhất một tác giả đầu hoặc tác giả liên hệ */
export function coNhomChinhTacGia(
  authors: Array<Pick<PublicationAuthor, 'isTopAuthor' | 'isCorresponding'>>
): boolean {
  return authors.some((a) => a.isTopAuthor || a.isCorresponding);
}

const MAU_LOI_NHOM_CHINH =
  /is_top_author|is_corresponding|nh[oó]m ch[ií]nh|cần ít nhất 1 tác giả trong nhóm/i;

/** Chuẩn hoá message từ BE/FE — tránh hiện mã kỹ thuật is_top_author */
export function chuanHoaLoiTacGia(message: unknown): string {
  const raw = String(message ?? '').trim();
  if (!raw) return '';
  if (MAU_LOI_NHOM_CHINH.test(raw)) return LOI_THIEU_TAC_GIA_NHOM_CHINH;
  return raw;
}

export function laLoiThieuNhomChinh(message: unknown): boolean {
  const raw = String(message ?? '').trim();
  if (!raw) return false;
  if (chuanHoaLoiTacGia(message) === LOI_THIEU_TAC_GIA_NHOM_CHINH) return true;
  if (raw.includes('thiếu tác giả thuộc nhóm chính')) return true;
  return MAU_LOI_NHOM_CHINH.test(raw);
}
