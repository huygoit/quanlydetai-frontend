import { DEGREE_KEY_LABEL_MAP, LEGACY_DEGREE_TO_KEY } from '@/constants/scientificProfileCatalog';
import { chuanHoaDegreeKey } from '@/utils/profileCatalogOptions';

// 示例方法，没有实际意义
export function trim(str: string) {
  return str.trim();
}

/**
 * Dòng hiển thị dưới họ tên: cơ quan công tác + tên khoa/phòng ban (một đoạn).
 * @param organization — Cơ quan công tác (trường ĐHĐN)
 * @param departmentName — Tên khoa/phòng ban (thường lấy từ field `faculty` trên hồ sơ)
 */
export function formatProfileOrganizationLine(
  organization?: string | null,
  departmentName?: string | null,
): string {
  const parts = [organization, departmentName]
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);
  return parts.join(' · ');
}

/** Chuẩn hóa khóa so khớp học vị (gộp Tiến sĩ / Tiến sỹ, bỏ dấu). */
export function chuanHoaHocViKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/sỹ/g, 'sĩ')
    .replace(/sy\b/g, 'si')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/** Chuẩn hóa chuỗi chung (không dùng cho học vị — dùng {@link chuanHoaHocViKey}). */
export function chuanHoaChuoiSoSanh(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ');
}

/** Các nhãn học vị (tiếng Việt) — trùng thì không hiện lại ở tag lĩnh vực NC. */
const GIA_TRI_HOC_VI_CHUAN = Object.values(DEGREE_KEY_LABEL_MAP);

/** Hai chuỗi có cùng nghĩa học vị (vd. Tiến sĩ vs Tiến sỹ). */
export function trungKhopHocVi(a?: string | null, b?: string | null): boolean {
  const sa = (a ?? '').trim();
  const sb = (b ?? '').trim();
  if (!sa || !sb) return false;
  const ka = chuanHoaDegreeKey(sa) ?? sa;
  const kb = chuanHoaDegreeKey(sb) ?? sb;
  if (ka === kb) return true;
  return chuanHoaHocViKey(sa) === chuanHoaHocViKey(sb);
}

/** Chuỗi giống một học vị trong danh mục (key EN hoặc nhãn VI cũ / gõ nhầm). */
export function laGiaTriHocVi(value?: string | null): boolean {
  const s = (value ?? '').trim();
  if (!s) return false;
  if (chuanHoaDegreeKey(s) in DEGREE_KEY_LABEL_MAP) return true;
  if (LEGACY_DEGREE_TO_KEY[s]) return true;
  const key = chuanHoaHocViKey(s);
  return GIA_TRI_HOC_VI_CHUAN.some((d) => chuanHoaHocViKey(d) === key);
}

/** Có nên hiện `mainResearchArea` dưới họ tên khi đã có tag học vị. */
export function nenHienThiTagLinhVucNc(
  mainResearchArea?: string | null,
  degree?: string | null,
): boolean {
  const lv = (mainResearchArea ?? '').trim();
  if (!lv) return false;
  if (trungKhopHocVi(lv, degree)) return false;
  if (laGiaTriHocVi(lv)) return false;
  return true;
}

/** @deprecated Dùng formatProfileOrganizationLine — chỉ organization + một tên đơn vị con */
export function formatProfileOrganization(
  organization?: string | null,
  faculty?: string | null,
  _department?: string | null,
): string {
  return formatProfileOrganizationLine(organization, faculty);
}
