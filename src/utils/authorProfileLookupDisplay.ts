import {
  FALLBACK_ACADEMIC_TITLE_CATALOG,
  FALLBACK_DEGREE_CATALOG,
} from '@/constants/scientificProfileCatalog';
import type { AuthorProfileLookupItem } from '@/services/api/profilePublications';
import {
  chuanHoaAcademicTitleKey,
  chuanHoaDegreeKey,
  coHienThiHocHam,
} from '@/utils/profileCatalogOptions';

function nhanHocHam(key?: string | null): string | undefined {
  if (!key || !coHienThiHocHam(key)) return undefined;
  const k = chuanHoaAcademicTitleKey(key);
  return FALLBACK_ACADEMIC_TITLE_CATALOG.find((c) => c.value === k)?.label;
}

function nhanHocVi(key?: string | null): string | undefined {
  if (!key) return undefined;
  const k = chuanHoaDegreeKey(key);
  return FALLBACK_DEGREE_CATALOG.find((c) => c.value === k)?.label;
}

/** Dòng tiêu đề: Học hàm. Học vị. Họ và tên */
export function formatAuthorLookupTitle(item: AuthorProfileLookupItem): string {
  const parts: string[] = [];
  const ham = nhanHocHam(item.academicTitle);
  const vi = nhanHocVi(item.degree);
  const ten = item.fullName?.trim();
  if (ham) parts.push(ham);
  if (vi) parts.push(vi);
  if (ten) parts.push(ten);
  if (parts.length > 0) return parts.join('. ');
  const mail = item.workEmail?.trim();
  if (mail) return mail;
  return `Hồ sơ #${item.id}`;
}

/** Dòng phụ: Cơ quan công tác · Department (không email / trạng thái) */
export function formatAuthorLookupSubtitle(item: AuthorProfileLookupItem): string | undefined {
  const coQuan = item.organization?.trim();
  const khoa = item.department?.trim();
  const parts: string[] = [];
  if (coQuan) parts.push(coQuan);
  if (khoa && khoa !== coQuan) parts.push(khoa);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}
