/**
 * API phiên xét chọn đề tài — US-03-03/03-04
 */
import { get, post, put, ApiResponse } from '../request';

export type SelectionSessionStatus =
  | 'CREATED'
  | 'OPEN'
  | 'MINUTES_SAVED'
  | 'PENDING_BGH'
  | 'LOCKED'
  | 'RETURNED';

export type CouncilResult = 'DONG_Y' | 'DONG_Y_DIEU_CHINH' | 'KHONG_DONG_Y';

export interface SelectionSessionItem {
  id: number;
  projectProposalId: number;
  councilOpinion?: string | null;
  councilResult?: CouncilResult | null;
  adjustmentNote?: string | null;
  resultEnteredAt?: string | null;
  proposal?: {
    id: number;
    code: string;
    title: string;
    ownerName: string;
    ownerUnit: string;
    status: string;
    requestedBudgetTotal?: number | null;
  } | null;
}

export interface SelectionSession {
  id: number;
  title: string;
  callForProposalId: number;
  meetingAt: string;
  location: string;
  status: SelectionSessionStatus;
  forceConfirmed?: boolean;
  councilMembers?: { name: string; role?: string }[];
  minutesFileUrl?: string | null;
  submittedAt?: string | null;
  bghReviewedAt?: string | null;
  bghComment?: string | null;
  lockedAt?: string | null;
  version: number;
  itemCount?: number;
  items?: SelectionSessionItem[];
}

export const SESSION_STATUS_MAP: Record<SelectionSessionStatus, { label: string; color: string }> = {
  CREATED: { label: 'Đã tạo', color: 'default' },
  OPEN: { label: 'Đang họp / nhập kết quả', color: 'processing' },
  MINUTES_SAVED: { label: 'Đã lưu biên bản', color: 'cyan' },
  PENDING_BGH: { label: 'Chờ BGH', color: 'warning' },
  LOCKED: { label: 'Đã khóa', color: 'success' },
  RETURNED: { label: 'BGH trả lại', color: 'error' },
};

export const COUNCIL_RESULT_OPTIONS: { value: CouncilResult; label: string }[] = [
  { value: 'DONG_Y', label: 'Đồng ý' },
  { value: 'DONG_Y_DIEU_CHINH', label: 'Đồng ý có điều chỉnh' },
  { value: 'KHONG_DONG_Y', label: 'Không đồng ý' },
];

export async function listSelectionSessions(): Promise<ApiResponse<SelectionSession[]>> {
  return get<ApiResponse<SelectionSession[]>>('/api/proposal-selection-sessions');
}

export async function getSelectionSession(
  id: number,
): Promise<ApiResponse<SelectionSession>> {
  return get<ApiResponse<SelectionSession>>(`/api/proposal-selection-sessions/${id}`);
}

export async function createSelectionSession(data: {
  callForProposalId: number;
  meetingAt: string;
  location: string;
  forceConfirm?: boolean;
}): Promise<ApiResponse<Record<string, unknown>>> {
  return post<ApiResponse<Record<string, unknown>>>('/api/proposal-selection-sessions', data);
}

export async function updateSelectionSessionMeta(
  id: number,
  data: { title?: string; councilMembers?: { name: string; role?: string }[] },
): Promise<ApiResponse<SelectionSession>> {
  return put<ApiResponse<SelectionSession>>(`/api/proposal-selection-sessions/${id}`, data);
}

export async function saveSelectionSessionResults(
  id: number,
  data: {
    expectedVersion?: number;
    items: Array<{
      projectProposalId: number;
      councilOpinion: string;
      councilResult: CouncilResult;
      adjustmentNote?: string | null;
    }>;
  },
): Promise<ApiResponse<SelectionSession>> {
  return put<ApiResponse<SelectionSession>>(
    `/api/proposal-selection-sessions/${id}/results`,
    data,
  );
}

export async function saveSelectionMinutes(id: number): Promise<ApiResponse<SelectionSession>> {
  return post<ApiResponse<SelectionSession>>(
    `/api/proposal-selection-sessions/${id}/save-minutes`,
  );
}

export async function submitSelectionToBgh(id: number): Promise<ApiResponse<SelectionSession>> {
  return post<ApiResponse<SelectionSession>>(
    `/api/proposal-selection-sessions/${id}/submit-bgh`,
  );
}

export async function bghApproveSelection(id: number): Promise<ApiResponse<SelectionSession>> {
  return post<ApiResponse<SelectionSession>>(
    `/api/proposal-selection-sessions/${id}/bgh-approve`,
  );
}

export async function bghRejectSelection(
  id: number,
  reason: string,
): Promise<ApiResponse<SelectionSession>> {
  return post<ApiResponse<SelectionSession>>(
    `/api/proposal-selection-sessions/${id}/bgh-reject`,
    { reason },
  );
}

export async function getSelectionSummary(id: number): Promise<
  ApiResponse<{
    totals: { dongY: number; dieuChinh: number; khongDongY: number; total: number };
    byUnit: Array<{
      unit: string;
      dongY: number;
      dieuChinh: number;
      khongDongY: number;
      total: number;
    }>;
  }>
> {
  return get(`/api/proposal-selection-sessions/${id}/summary`);
}
