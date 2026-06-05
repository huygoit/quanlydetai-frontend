/**
 * KPI giờ NCKH (QĐ 1883) — NCV xem theo profileId + khoảng thời gian (ngày xuất bản).
 */
import { get, ApiResponse } from '../request';

export interface TeacherKpiQuery {
  fromDate: string;
  toDate: string;
}

export interface TeacherKpiResponseData {
  profileId: number;
  periodFrom: string;
  periodTo: string;
  fromDate?: string;
  toDate?: string;
  totalHours: number;
  /** Tổng điểm quy đổi trong kỳ đã chọn */
  totalPoints: number;
  metQuota: boolean;
  quota: number;
  breakdown: unknown;
  allWarnings: string[];
  cachedAt: string | null;
}

/**
 * Tổng giờ/điểm quy đổi NCV trong khoảng ngày (mặc định BE: năm tài chính hiện tại).
 */
export async function getTeacherKpi(
  profileId: number,
  period: TeacherKpiQuery
): Promise<ApiResponse<TeacherKpiResponseData>> {
  return get<ApiResponse<TeacherKpiResponseData>>(`/api/kpis/teachers/${profileId}`, {
    from_date: period.fromDate,
    to_date: period.toDate,
  });
}
