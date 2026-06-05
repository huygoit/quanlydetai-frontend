import type { AuthorStudentLookupItem } from '@/services/api/profilePublications';

/** Dòng tiêu đề: Họ tên (kèm mã SV nếu có) */
export function formatStudentLookupTitle(item: AuthorStudentLookupItem): string {
  const ten = item.fullName?.trim();
  const ma = item.studentCode?.trim();
  if (ten && ma) return `${ten} · ${ma}`;
  if (ten) return ten;
  if (ma) return ma;
  const mail = item.schoolEmail?.trim() || item.personalEmail?.trim();
  if (mail) return mail;
  return `Sinh viên #${item.id}`;
}

/** Dòng phụ: Lớp · Ngành · Đơn vị */
export function formatStudentLookupSubtitle(item: AuthorStudentLookupItem): string | undefined {
  const parts: string[] = [];
  const lop = item.className?.trim() || item.classCode?.trim();
  const nganh = item.majorName?.trim();
  const donVi = item.department?.trim();
  if (lop) parts.push(lop);
  if (nganh && nganh !== lop) parts.push(nganh);
  if (donVi) parts.push(donVi);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}
