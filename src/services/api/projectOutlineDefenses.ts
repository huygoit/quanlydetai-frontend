/**
 * API tổ chức bảo vệ thuyết minh (US-04-04)
 */
import { get, post, put, ApiResponse } from '../request';
import type { ProjectOutline } from './projectOutlines';

export type DefenseSessionStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'FINALIZED';
export type DefenseMeetingMode = 'IN_PERSON' | 'ONLINE' | 'HYBRID';
export type DefenseConclusion = 'THONG_QUA' | 'THONG_QUA_DIEU_CHINH' | 'KHONG_THONG_QUA';
export type DefenseCouncilRole = 'CHU_TICH' | 'THU_KY' | 'UY_VIEN';

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

export type DefenseSession = {
  id: number;
  projectOutlineId: number;
  status: DefenseSessionStatus;
  meetingMode: DefenseMeetingMode;
  meetingAt?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  shortNoticeOverride?: boolean;
  shortNoticeReason?: string | null;
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
  outline?: {
    id: number;
    code: string;
    title: string;
    status: string;
    ownerName?: string | null;
    ownerUnit?: string | null;
    field?: string | null;
    reviewAverageScore?: number | null;
    reviewBelowThreshold?: boolean | null;
  };
};

export const DEFENSE_STATUS_MAP: Record<DefenseSessionStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'default' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'processing' },
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
  projectOutlineId: number;
  meetingMode: DefenseMeetingMode;
  meetingAt: string;
  location?: string | null;
  meetingUrl?: string | null;
  shortNoticeOverride?: boolean;
  shortNoticeReason?: string | null;
  confirm?: boolean;
  members: DefenseMember[];
}): Promise<ApiResponse<DefenseSession>> {
  return post('/api/project-outline-defenses', data);
}

export async function updateDefenseSession(
  id: number,
  data: Partial<{
    meetingMode: DefenseMeetingMode;
    meetingAt: string;
    location: string | null;
    meetingUrl: string | null;
    members: DefenseMember[];
  }>,
): Promise<ApiResponse<DefenseSession>> {
  return put(`/api/project-outline-defenses/${id}`, data);
}

export async function confirmDefenseSession(
  id: number,
  data?: { shortNoticeOverride?: boolean; shortNoticeReason?: string | null },
): Promise<ApiResponse<DefenseSession>> {
  return post(`/api/project-outline-defenses/${id}/confirm`, data || {});
}

export async function cancelDefenseSession(
  id: number,
  reason: string,
): Promise<ApiResponse<DefenseSession>> {
  return post(`/api/project-outline-defenses/${id}/cancel`, { reason });
}

export async function saveDefenseMinutes(
  id: number,
  data: {
    discussionNotes: string;
    finalScore?: number | null;
    conclusion?: DefenseConclusion | null;
    adjustmentRequirements?: string | null;
    adjustmentDeadline?: string | null;
    attendances?: Array<{ memberId: number; attendance: 'PENDING' | 'PRESENT' | 'ABSENT' }>;
  },
): Promise<ApiResponse<DefenseSession>> {
  return put(`/api/project-outline-defenses/${id}/minutes`, data);
}

export async function finalizeDefenseSession(
  id: number,
  data: {
    discussionNotes: string;
    finalScore?: number | null;
    conclusion: DefenseConclusion;
    adjustmentRequirements?: string | null;
    adjustmentDeadline?: string | null;
    attendances: Array<{ memberId: number; attendance: 'PRESENT' | 'ABSENT' }>;
  },
): Promise<ApiResponse<DefenseSession>> {
  return post(`/api/project-outline-defenses/${id}/finalize`, data);
}
