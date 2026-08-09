/**
 * API phiên xét chọn đề tài — US-03-03/03-04
 */
import { get, post, put, del, ApiResponse } from '../request';

export type SelectionSessionStatus =
  | 'CREATED'
  | 'OPEN'
  | 'MINUTES_SAVED'
  | 'PENDING_BGH'
  | 'LOCKED'
  | 'RETURNED';

export type CouncilResult = 'DONG_Y' | 'KHONG_DONG_Y';

export type SelectionMemberRole = 'CHU_TICH' | 'THU_KY' | 'UY_VIEN' | 'PHAN_BIEN';

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

export interface SelectionSessionMember {
  id: number;
  memberId: number;
  memberName: string;
  memberEmail?: string | null;
  roleInCouncil: SelectionMemberRole | string;
  unit?: string | null;
}

export interface SelectionAvailableMember {
  userId: number;
  fullName: string;
  workEmail: string;
  degree?: string | null;
  academicTitle?: string | null;
  organization?: string | null;
  faculty?: string | null;
  department?: string | null;
  unit?: string | null;
  currentTitle?: string | null;
  mainResearchArea?: string | null;
  phone?: string | null;
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
  memberCount?: number;
  items?: SelectionSessionItem[];
}

export const SELECTION_MEMBER_ROLE_MAP: Record<
  SelectionMemberRole,
  { text: string; color: string }
> = {
  CHU_TICH: { text: 'Chủ tịch HĐ', color: 'gold' },
  THU_KY: { text: 'Thư ký', color: 'blue' },
  UY_VIEN: { text: 'Ủy viên', color: 'default' },
  PHAN_BIEN: { text: 'Phản biện', color: 'purple' },
};

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
    totals: { dongY: number; khongDongY: number; total: number };
    byUnit: Array<{
      unit: string;
      dongY: number;
      khongDongY: number;
      total: number;
    }>;
  }>
> {
  return get(`/api/proposal-selection-sessions/${id}/summary`);
}

/** Thành viên hội đồng phiên xét chọn */
export async function getSelectionSessionMembers(
  sessionId: number,
): Promise<ApiResponse<SelectionSessionMember[]>> {
  return get(`/api/proposal-selection-sessions/${sessionId}/members`);
}

export async function getSelectionAvailableMembers(
  sessionId: number,
  keyword?: string,
): Promise<ApiResponse<SelectionAvailableMember[]>> {
  return get(`/api/proposal-selection-sessions/${sessionId}/available-members`, { keyword });
}

export async function addSelectionSessionMember(
  sessionId: number,
  data: {
    memberId: number;
    memberName: string;
    memberEmail?: string;
    roleInCouncil: SelectionMemberRole;
    unit?: string;
  },
): Promise<ApiResponse<SelectionSessionMember[]>> {
  return post(`/api/proposal-selection-sessions/${sessionId}/members`, data);
}

export async function removeSelectionSessionMember(
  sessionId: number,
  memberId: number,
): Promise<ApiResponse<null>> {
  return del(`/api/proposal-selection-sessions/${sessionId}/members/${memberId}`);
}
