/**
 * API Báo cáo KPI / giờ NCKH
 * - GET /api/kpis/nckh-hours-report?publishedFrom=&publishedTo=&faculty=
 * - GET /api/kpis/nckh-data-report?...
 * - GET|PUT /api/kpis/nckh-data-report/column-config
 */
import { get, put, ApiResponse } from '../request';

export interface NckhReportPeriodParams {
  /** ISO date YYYY-MM-DD — bỏ trống cả cặp + all=true khi «Tất cả» */
  publishedFrom?: string;
  publishedTo?: string;
  /** true = không lọc ngày */
  all?: boolean;
  faculty?: string;
}

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
  period_from?: string | null;
  period_to?: string | null;
  period_label?: string;
  faculty: string;
  faculties: string[];
  generated_at: string;
  total_people: number;
  grand_total: number;
  units: NckhReportUnit[];
}

function buildReportQuery(params: NckhReportPeriodParams) {
  const q: Record<string, string> = {
    faculty: params.faculty || '',
  };
  if (params.all) {
    q.all = '1';
  } else if (params.publishedFrom && params.publishedTo) {
    q.publishedFrom = params.publishedFrom;
    q.publishedTo = params.publishedTo;
  }
  return q;
}

export const getNckhHoursReport = (params: NckhReportPeriodParams) =>
  get<NckhHoursReport>(
    '/api/kpis/nckh-hours-report',
    buildReportQuery(params),
  ) as Promise<ApiResponse<NckhHoursReport>>;

/** Node cột header báo cáo (L1/L2/L3 đã chọn). */
export interface NckhDataColumnNode {
  id: number;
  code: string;
  name: string;
  level: number;
  children: NckhDataColumnNode[];
}

export interface NckhDataLeafColumn {
  id: number;
  code: string;
  name: string;
  level1Id: number;
  level2Id: number;
}

export interface NckhDataColumnSelection {
  level1Ids: number[];
  level2Ids: number[];
  level3Ids: number[];
}

export interface NckhDataRow {
  stt: number;
  fullName: string;
  hoTenDem: string;
  ten: string;
  hours: number;
  note: string;
  /** Số lượng theo id loại L3 (key = string id) */
  counts: Record<string, number>;
}

export interface NckhDataTotals {
  hours: number;
  counts: Record<string, number>;
}

export interface NckhDataReport {
  academic_year: string;
  period_from?: string | null;
  period_to?: string | null;
  period_label?: string;
  faculty: string;
  generated_at: string;
  faculties: string[];
  isDefaultAll?: boolean;
  selection?: NckhDataColumnSelection;
  columnTree: NckhDataColumnNode[];
  leafColumns: NckhDataLeafColumn[];
  rows: NckhDataRow[];
  totals: NckhDataTotals;
}

export interface NckhDataColumnConfig {
  selection: NckhDataColumnSelection;
  isDefaultAll: boolean;
  canConfigure: boolean;
  catalogTree: NckhDataColumnNode[];
}

export const getNckhDataReport = (params: NckhReportPeriodParams) =>
  get<NckhDataReport>(
    '/api/kpis/nckh-data-report',
    buildReportQuery(params),
  ) as Promise<ApiResponse<NckhDataReport>>;

/** Tải Excel theo cùng filter + cột cấu hình */
export async function exportNckhDataReportExcel(
  params: NckhReportPeriodParams,
): Promise<Blob> {
  const { getToken, API_BASE_URL } = await import('../request');
  const token = getToken();
  const q = new URLSearchParams(buildReportQuery(params));
  const url = `${API_BASE_URL}/api/kpis/nckh-data-report/export-excel?${q.toString()}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = 'Xuất Excel thất bại';
    try {
      const j = await res.json();
      msg = j?.message || msg;
    } catch {
      /* bỏ qua */
    }
    throw new Error(msg);
  }
  return res.blob();
}

export const getNckhDataColumnConfig = () =>
  get<NckhDataColumnConfig>(
    '/api/kpis/nckh-data-report/column-config',
  ) as Promise<ApiResponse<NckhDataColumnConfig>>;

export const saveNckhDataColumnConfig = (selection: NckhDataColumnSelection) =>
  put<{ selection: NckhDataColumnSelection }>(
    '/api/kpis/nckh-data-report/column-config',
    selection,
  ) as Promise<ApiResponse<{ selection: NckhDataColumnSelection }>>;
