/**
 * API Báo cáo KPI / giờ NCKH
 * - GET /api/kpis/nckh-hours-report?academic_year=2024-2025
 */
import { get, ApiResponse } from '../request';

export interface NckhReportRow {
  stt: number;
  fullName: string;
  hoTenDem: string;
  ten: string;
  hours: number;
  note: string;
}

export interface NckhReportUnit {
  unit: string;
  subtotal: number;
  rows: NckhReportRow[];
}

export interface NckhHoursReport {
  academic_year: string;
  generated_at: string;
  total_people: number;
  grand_total: number;
  units: NckhReportUnit[];
}

export const getNckhHoursReport = (academicYear: string) =>
  get<NckhHoursReport>('/api/kpis/nckh-hours-report', { academic_year: academicYear }) as Promise<
    ApiResponse<NckhHoursReport>
  >;

export interface NckhDataCounts {
  wos_scopus: number;
  intl_other: number;
  isbn_proc: number;
  dt_nha_nuoc: number;
  dt_bo: number;
  dt_truong: number;
  dt_co_so: number;
  sv_nckh: number;
  hours: number;
  textbook: number;
  monograph: number;
  reference: number;
  training_doc: number;
  ip: number;
}

export interface NckhDataRow extends NckhDataCounts {
  stt: number;
  fullName: string;
  hoTenDem: string;
  ten: string;
  note: string;
}

export interface NckhDataReport {
  academic_year: string;
  faculty: string;
  generated_at: string;
  faculties: string[];
  rows: NckhDataRow[];
  totals: NckhDataCounts;
}

export const getNckhDataReport = (academicYear: string, faculty?: string) =>
  get<NckhDataReport>('/api/kpis/nckh-data-report', {
    academic_year: academicYear,
    faculty: faculty || '',
  }) as Promise<ApiResponse<NckhDataReport>>;
