/**
 * API Tổ chức thẩm định thuyết minh (flow 6 bước)
 */
import { get, post, put, ApiResponse } from '../request';
import type { ProjectOutline } from './projectOutlines';

export type DefenseSessionStatus =
  | 'DRAFT'
  | 'PENDING_BGH'
  | 'BGH_SIGNED'
  | 'PUBLISHED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'FINALIZED';

export type DefenseMeetingMode = 'IN_PERSON' | 'ONLINE' | 'HYBRID';
export type DefenseConclusion = 'THONG_QUA' | 'THONG_QUA_DIEU_CHINH' | 'KHONG_THONG_QUA';
export type DefenseCouncilRole =
  | 'CHU_TICH'
  | 'THU_KY'
  | 'PHAN_BIEN_1'
  | 'PHAN_BIEN_2'
  | 'UY_VIEN';

export type DefenseMember = {
  id?: number;
  userId?: number | null;
  scientificProfileId?: number | null;
  memberName: string;
  memberEmail?: string | null;
  roleInCouncil: DefenseCouncilRole;
  isExternal?: boolean;
  unit?: string | null;
  proposedSourceNote?: string | null;
  attendance?: 'PENDING' | 'PRESENT' | 'ABSENT' | null;
};

export type DefenseScoreLine = {
  code: string;
  name: string;
  maxScore: number;
  score: number | null;
};

export type DefenseScoreSheet = {
  id: number;
  sessionId: number;
  memberId: number;
  projectOutlineId: number;
  status: 'DRAFT' | 'SUBMITTED';
  precheckEligible?: boolean | null;
  precheckConflictCleared?: boolean | null;
  precheckEthicsOk?: boolean | null;
  scores: DefenseScoreLine[];
  totalScore?: number | null;
  conclusion?: string | null;
  generalComment?: string | null;
  submittedAt?: string | null;
  remindedAt?: string | null;
};

export type DefenseSessionOutline = {
  id: number;
  code: string;
  title: string;
  status: string;
  ownerName?: string | null;
  ownerUnit?: string | null;
  field?: string | null;
};

export type DefenseSession = {
  id: number;
  projectOutlineId: number;
  title?: string | null;
  status: DefenseSessionStatus;
  meetingMode: DefenseMeetingMode;
  meetingAt?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  shortNoticeOverride?: boolean;
  shortNoticeReason?: string | null;
  earlyMeetingOpened?: boolean;
  earlyMeetingOpenedAt?: string | null;
  decisionDraftHtml?: string | null;
  decisionCode?: string | null;
  decisionFileUrl?: string | null;
  submittedToBghAt?: string | null;
  bghSignedAt?: string | null;
  bghSignNote?: string | null;
  publishedAt?: string | null;
  cancelReason?: string | null;
  discussionNotes?: string | null;
  conclusion?: DefenseConclusion | null;
  finalScore?: number | null;
  adjustmentRequirements?: string | null;
  adjustmentDeadline?: string | null;
  minutesFileUrl?: string | null;
  finalizedAt?: string | null;
  version?: number;
  members: DefenseMember[];
  outlines?: DefenseSessionOutline[];
  scoreSheets?: DefenseScoreSheet[];
  scoreProgress?: { total: number; submitted: number; draft: number };
  outline?: DefenseSessionOutline;
};

export const DEFENSE_STATUS_MAP: Record<DefenseSessionStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp — lập HĐ', color: 'default' },
  PENDING_BGH: { label: 'Chờ BGH ký QĐ', color: 'gold' },
  BGH_SIGNED: { label: 'BGH đã ký — chờ TC-HC', color: 'blue' },
  PUBLISHED: { label: 'Đã phát hành — mở BM.05a', color: 'processing' },
  CONFIRMED: { label: 'Đã phát hành', color: 'processing' },
  CANCELLED: { label: 'Đã hủy', color: 'error' },
  FINALIZED: { label: 'Đã chốt biên bản', color: 'success' },
};

export const DEFENSE_CONCLUSION_MAP: Record<DefenseConclusion, string> = {
  THONG_QUA: 'Thông qua',
  THONG_QUA_DIEU_CHINH: 'Thông qua có điều chỉnh',
  KHONG_THONG_QUA: 'Không thông qua',
};

export const DEFENSE_ROLE_OPTIONS = [
  { value: 'CHU_TICH', label: 'Chủ tịch' },
  { value: 'THU_KY', label: 'Thư ký' },
  { value: 'PHAN_BIEN_1', label: 'Phản biện 1' },
  { value: 'PHAN_BIEN_2', label: 'Phản biện 2' },
  { value: 'UY_VIEN', label: 'Ủy viên' },
];

export async function listEligibleForDefense(): Promise<ApiResponse<ProjectOutline[]>> {
  return get('/api/project-outline-defenses/eligible');
}

export async function listDefenseSessions(): Promise<ApiResponse<DefenseSession[]>> {
  return get('/api/project-outline-defenses');
}

export async function getDefenseSession(id: number): Promise<ApiResponse<DefenseSession>> {
  return get(`/api/project-outline-defenses/${id}`);
}

export async function getDefenseAvailableMembers(
  sessionId: number,
  keyword?: string,
): Promise<
  ApiResponse<
    Array<{
      scientificProfileId: number;
      userId: number | null;
      memberName: string;
      memberEmail?: string | null;
      unit?: string | null;
      isExternal: boolean;
    }>
  >
> {
  return get(`/api/project-outline-defenses/${sessionId}/available-members`, { keyword });
}

export async function createDefenseSession(data: {
  projectOutlineIds: number[];
  title?: string | null;
  meetingMode: DefenseMeetingMode;
  meetingAt: string;
  location?: string | null;
  meetingUrl?: string | null;
  shortNoticeOverride?: boolean;
  shortNoticeReason?: string | null;
  members: DefenseMember[];
}): Promise<ApiResponse<DefenseSession>> {
  return post('/api/project-outline-defenses', data);
}

export async function updateDefenseSession(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiResponse<DefenseSession>> {
  return put(`/api/project-outline-defenses/${id}`, data);
}

export async function submitDefenseToBgh(id: number): Promise<ApiResponse<DefenseSession>> {
  return post(`/api/project-outline-defenses/${id}/submit-bgh`, {});
}

export async function bghSignDefense(
  id: number,
  note?: string | null,
): Promise<ApiResponse<DefenseSession>> {
  return post(`/api/project-outline-defenses/${id}/bgh-sign`, { note });
}

export async function publishDefense(id: number): Promise<ApiResponse<DefenseSession>> {
  return post(`/api/project-outline-defenses/${id}/publish`, {});
}

export async function remindDefenseMember(
  sessionId: number,
  memberId: number,
): Promise<ApiResponse<{ reminded: number }>> {
  return post(`/api/project-outline-defenses/${sessionId}/remind/${memberId}`, {});
}

export async function getDefenseScoreProgress(sessionId: number): Promise<ApiResponse<any[]>> {
  return get(`/api/project-outline-defenses/${sessionId}/score-progress`);
}

export async function listMyDefenseTasks(): Promise<ApiResponse<any[]>> {
  return get('/api/project-outline-defenses/my-tasks');
}

export async function getDefenseScoreSheet(sheetId: number): Promise<ApiResponse<any>> {
  return get(`/api/project-outline-defenses/score-sheets/${sheetId}`);
}

export async function saveDefenseScoreSheet(
  sheetId: number,
  data: Record<string, unknown>,
): Promise<ApiResponse<DefenseScoreSheet>> {
  return put(`/api/project-outline-defenses/score-sheets/${sheetId}`, data);
}

export async function cancelDefenseSession(
  id: number,
  reason: string,
): Promise<ApiResponse<DefenseSession>> {
  return post(`/api/project-outline-defenses/${id}/cancel`, { reason });
}

/** PKH xác nhận họp trước ngày dự kiến — mở biên bản cho Thư ký */
export async function openEarlyDefenseMeeting(
  id: number,
): Promise<ApiResponse<DefenseSession>> {
  return post(`/api/project-outline-defenses/${id}/open-early-meeting`);
}

export type CouncilMinutesConclusion =
  | 'DE_XUAT_XET'
  | 'GIAO_TRUC_TIEP'
  | 'HOAN_THIEN'
  | 'KHONG_DE_XUAT';

export const COUNCIL_CONCLUSION_OPTIONS = [
  { value: 'DE_XUAT_XET', label: 'Đề nghị xét tài trợ/đặt hàng/lựa chọn' },
  { value: 'GIAO_TRUC_TIEP', label: 'Đề nghị giao trực tiếp' },
  { value: 'HOAN_THIEN', label: 'Đề nghị hoàn thiện hồ sơ' },
  { value: 'KHONG_DE_XUAT', label: 'Không đề nghị xét / giao trực tiếp' },
];

export async function getDefenseMinutes(id: number): Promise<ApiResponse<any>> {
  return get(`/api/project-outline-defenses/${id}/minutes`);
}

export async function saveDefenseMinutes(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiResponse<any>> {
  return put(`/api/project-outline-defenses/${id}/minutes`, data);
}

export async function finalizeDefenseSession(
  id: number,
  data: Record<string, unknown>,
): Promise<ApiResponse<any>> {
  return post(`/api/project-outline-defenses/${id}/finalize`, data);
}

/** PKH mở khóa biên bản đã chốt (khi BGH chưa duyệt/ký) */
export async function reopenDefenseMinutes(
  id: number,
  reason?: string | null,
): Promise<ApiResponse<any>> {
  return post(`/api/project-outline-defenses/${id}/reopen-minutes`, { reason: reason || null });
}

/** @deprecated dùng submitDefenseToBgh / publishDefense */
export async function confirmDefenseSession(
  id: number,
  data?: { shortNoticeOverride?: boolean; shortNoticeReason?: string | null },
): Promise<ApiResponse<DefenseSession>> {
  return submitDefenseToBgh(id);
}
