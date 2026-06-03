/**
 * KPI giờ NCKH (QĐ 1883) — NCV xem theo profileId + năm học.
 */
import { get, ApiResponse } from '../request';

/** Năm học hiện tại (tháng 9 chuyển năm), khớp logic backend. */
export function getDefaultAcademicYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  if (m >= 9) return `${y}-${y + 1}`;
  return `${y - 1}-${y}`;
}

/** Danh sách năm học gần đây cho Select. */
export function buildRecentAcademicYears(count = 8): string[] {
  const base = getDefaultAcademicYear();
  const startYear = parseInt(base.slice(0, 4), 10);
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    const y0 = startYear - i;
    list.push(`${y0}-${y0 + 1}`);
  }
  return list;
}

export interface TeacherKpiResponseData {
  profileId: number;
  academicYear: string;
  totalHours: number;
  /** Tổng điểm quy đổi theo danh mục KQNC / điểm HĐGSNN (cùng năm học với giờ) */
  totalPoints: number;
  metQuota: boolean;
  quota: number;
  breakdown: unknown;
  allWarnings: string[];
  cachedAt: string | null;
}

/**
 * Tổng giờ/điểm quy đổi NCV theo năm học (header hồ sơ).
 * BE phải cộng mọi KQNC có tác giả gắn profile_id — không lọc theo người tạo bản ghi.
 * @see specs/api-kpis-teacher-totals.md
 */
export async function getTeacherKpi(
  profileId: number,
  academicYear?: string
): Promise<ApiResponse<TeacherKpiResponseData>> {
  return get<ApiResponse<TeacherKpiResponseData>>(`/api/kpis/teachers/${profileId}`, {
    academic_year: academicYear || getDefaultAcademicYear(),
  });
}
