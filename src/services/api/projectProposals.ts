/**
 * Project Proposals API — Đăng ký / nộp đề xuất đề tài (US 05)
 */
import { get, post, put, del, ApiResponse, PaginatedResponse } from '../request';
import type { PublicationAuthor } from './profilePublications';
import { normalizePublicationAuthor } from './profilePublications';

export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'RETURNED'
  | 'CHO_PKH'
  | 'YEU_CAU_BS'
  | 'HOP_LE'
  | 'DA_LOAI'
  | 'DUOC_CHON'
  | 'DIEU_CHINH'
  | 'KHONG_CHON'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'UNIT_REVIEWED'; // legacy

export type ProposalLevel = 'CO_SO' | 'TRUONG' | 'BO' | 'NHA_NUOC';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectProposal {
  id: number;
  code: string;
  title: string;
  field: string;
  level: ProposalLevel;
  year: number;
  durationMonths: number;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
  ownerId: number;
  ownerName: string;
  ownerEmail?: string;
  ownerUnit: string;
  coAuthors?: string[];
  objectives: string;
  summary: string;
  contentOutline?: string;
  expectedResults?: string;
  applicationPotential?: string;
  requestedBudgetTotal?: number;
  requestedBudgetDetail?: string;
  status: ProposalStatus;
  unitComment?: string;
  unitApproved?: boolean;
  sciDeptComment?: string;
  sciDeptPriority?: Priority;
  researchOutputTypeId?: number | null;
  researchOutputType?: { id: number; code: string; name: string } | null;
  researchDirection?: string | null;
  attachmentUrl?: string | null;
  callForProposalId?: number | null;
  projectProcessTypeId?: number | null;
  projectProcessType?: { id: number; code: string; name: string } | null;
  supplementDueAt?: string | null;
  supplementOverdue?: boolean;
  pkhComment?: string | null;
  canWriteOutline?: boolean;
  councilAdjustmentNote?: string | null;
  adjustmentNotifiedAt?: string | null;
  adjustmentDueAt?: string | null;
  adjustmentOverdue?: boolean;
  adjustmentReminderSentAt?: string | null;
  adjustmentExplanation?: string | null;
}

export interface ProposalAudit {
  id: number;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  actorUserId: number;
  actorName?: string | null;
  createdAt?: string | null;
}

export interface ProposalQueryParams {
  keyword?: string;
  year?: number;
  status?: ProposalStatus;
  /** Nhiều trạng thái (vd. màn PKH — Tất cả) */
  statuses?: ProposalStatus[] | string;
  level?: ProposalLevel;
  field?: string;
  unit?: string;
  ownerOnly?: boolean;
  callForProposalId?: number;
  page?: number;
  perPage?: number;
}

export interface ProposalCreateData {
  title: string;
  field: string;
  /** Phân cấp đề tài = loại quy trình (QT-I…) */
  projectProcessTypeId: number;
  /** Tuỳ chọn — BE tự suy từ QT nếu thiếu */
  level?: ProposalLevel;
  year: number;
  durationMonths: number;
  keywords?: string[];
  coAuthors?: string[];
  objectives: string;
  summary?: string;
  contentOutline?: string;
  expectedResults?: string;
  applicationPotential?: string;
  requestedBudgetTotal?: number;
  requestedBudgetDetail?: string;
  researchOutputTypeId?: number | null;
  researchDirection?: string | null;
  attachmentUrl?: string | null;
}

export async function queryProposals(
  params?: ProposalQueryParams,
): Promise<PaginatedResponse<ProjectProposal>> {
  return get<PaginatedResponse<ProjectProposal>>('/api/project-proposals', params);
}

export async function getProposal(id: number): Promise<ApiResponse<ProjectProposal>> {
  return get<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}`);
}

export async function getProposalAudits(id: number): Promise<ApiResponse<ProposalAudit[]>> {
  return get<ApiResponse<ProposalAudit[]>>(`/api/project-proposals/${id}/audits`);
}

export async function createProposal(
  data: ProposalCreateData,
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>('/api/project-proposals', data);
}

export async function updateProposal(
  id: number,
  data: Partial<ProposalCreateData>,
): Promise<ApiResponse<ProjectProposal>> {
  return put<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}`, data);
}

export async function deleteProposal(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/project-proposals/${id}`);
}

export async function submitProposal(id: number): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/submit`);
}

export async function withdrawProposal(id: number): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/withdraw`);
}

export async function unitReviewProposal(
  id: number,
  data: { unitApproved: boolean; unitComment: string },
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/unit-review`, data);
}

export async function unitReturnProposal(
  id: number,
  reason: string,
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/unit-return`, { reason });
}

export async function markProposalValid(id: number): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/mark-valid`);
}

export async function requestProposalSupplement(
  id: number,
  note: string,
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/request-supplement`, {
    note,
  });
}

export async function resubmitProposalToPkh(id: number): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/resubmit-to-pkh`);
}

export async function extendProposalSupplement(
  id: number,
  data: { dueAt: string; reason?: string },
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(
    `/api/project-proposals/${id}/extend-supplement`,
    data,
  );
}

export async function rejectProposalByPkh(
  id: number,
  reason: string,
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/reject-by-pkh`, {
    reason,
  });
}

/** US-03-05 — GV nộp lại điều chỉnh theo yêu cầu Hội đồng */
export async function submitCouncilAdjustment(
  id: number,
  data: { title: string; objectives: string; explanation: string },
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(
    `/api/project-proposals/${id}/submit-council-adjustment`,
    data,
  );
}

export interface ProposalAdjustmentVersion {
  id: number;
  versionType: 'ORIGINAL' | 'SUBMITTED';
  title: string;
  objectives: string;
  councilAdjustmentNote?: string | null;
  explanationNote?: string | null;
  createdBy?: number | null;
  createdAt?: string | null;
}

export async function getProposalAdjustmentVersions(
  id: number,
): Promise<ApiResponse<ProposalAdjustmentVersion[]>> {
  return get<ApiResponse<ProposalAdjustmentVersion[]>>(
    `/api/project-proposals/${id}/adjustment-versions`,
  );
}

export async function extendProposalAdjustment(
  id: number,
  data: { dueAt?: string; businessDays?: number; reason?: string },
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(
    `/api/project-proposals/${id}/extend-adjustment`,
    data,
  );
}

export interface PkhProposalStats {
  totalReceived: number;
  hopLe: number;
  choBoSung: number;
  daLoai: number;
  choPkh: number;
}

export async function getPkhProposalStats(
  callForProposalId: number,
): Promise<ApiResponse<PkhProposalStats>> {
  return get<ApiResponse<PkhProposalStats>>('/api/project-proposals/pkh/stats', {
    callForProposalId,
  });
}

/** Tải Excel danh mục HOP_LE */
export async function exportPkhProposalsExcel(callForProposalId: number): Promise<Blob> {
  const { getToken, API_BASE_URL } = await import('../request');
  const token = getToken();
  const url = `${API_BASE_URL}/api/project-proposals/pkh/export-excel?callForProposalId=${callForProposalId}`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    let msg = 'Xuất Excel thất bại';
    try {
      const j = await res.json();
      msg = j?.message || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.blob();
}

export async function createProposalSelectionSession(data: {
  callForProposalId: number;
  meetingAt: string;
  location: string;
  forceConfirm?: boolean;
}): Promise<ApiResponse<Record<string, unknown>>> {
  const { createSelectionSession } = await import('./proposalSelectionSessions');
  return createSelectionSession(data);
}

export async function getPendingUnitProposalCount(): Promise<ApiResponse<{ count: number }>> {
  return get<ApiResponse<{ count: number }>>('/api/project-proposals/pending-unit-count');
}

/** Thành viên đề xuất — cùng shape AuthorsEditor (PublicationAuthor). */
export type ProjectProposalMember = PublicationAuthor;

function memberToApiPayload(a: PublicationAuthor) {
  const role = a.proposalMemberRole || 'MEMBER';
  return {
    id: typeof a.id === 'number' ? a.id : undefined,
    profile_id: a.profileId ?? null,
    student_id: a.studentId ?? null,
    gender: a.profileId || a.studentId ? null : a.gender ?? null,
    full_name: a.fullName,
    affiliation_units: a.affiliationUnits ?? [],
    member_order: a.authorOrder,
    author_order: a.authorOrder,
    role,
    proposalMemberRole: role,
    affiliation_type: a.affiliationType,
    is_multi_affiliation_outside_udn: a.isMultiAffiliationOutsideUdn,
    contribution_percent: a.contributionPercent ?? null,
  };
}

/** GET /api/project-proposals/:id/members */
export async function getProposalMembers(
  proposalId: number,
): Promise<ApiResponse<ProjectProposalMember[]>> {
  const res = await get<ApiResponse<ProjectProposalMember[]>>(
    `/api/project-proposals/${proposalId}/members`,
  );
  if (Array.isArray(res?.data)) {
    res.data = res.data.map((m) => normalizePublicationAuthor(m as PublicationAuthor));
  }
  return res;
}

/** PUT /api/project-proposals/:id/members — upsert toàn bộ danh sách */
export async function saveProposalMembers(
  proposalId: number,
  members: PublicationAuthor[],
): Promise<ApiResponse<ProjectProposalMember[]>> {
  return put<ApiResponse<ProjectProposalMember[]>>(
    `/api/project-proposals/${proposalId}/members`,
    { members: members.map(memberToApiPayload) },
  );
}

export const FIELD_OPTIONS: string[] = [];

/** Fallback khi chưa tải catalogs PROJECT_LEVEL — options thật lấy từ danh mục. */
export const LEVEL_OPTIONS = [
  { value: 'CO_SO' as ProposalLevel, label: 'Cấp cơ sở' },
  { value: 'TRUONG' as ProposalLevel, label: 'Cấp Trường' },
  { value: 'BO' as ProposalLevel, label: 'Cấp Bộ' },
  { value: 'NHA_NUOC' as ProposalLevel, label: 'Cấp Nhà nước' },
];

export const UNIT_OPTIONS: string[] = [];

export const PRIORITY_OPTIONS: { label: string; value: Priority; color: string }[] = [
  { label: 'Thấp', value: 'LOW', color: 'default' },
  { label: 'Trung bình', value: 'MEDIUM', color: 'blue' },
  { label: 'Cao', value: 'HIGH', color: 'red' },
];

/** Nhãn trạng thái theo user story nộp đề tài / PKH */
export const PROPOSAL_STATUS_MAP: Record<ProposalStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'default' },
  SUBMITTED: { label: 'Chờ Khoa', color: 'processing' },
  RETURNED: { label: 'Khoa trả lại', color: 'warning' },
  CHO_PKH: { label: 'Chờ PKH', color: 'cyan' },
  YEU_CAU_BS: { label: 'Yêu cầu bổ sung', color: 'orange' },
  HOP_LE: { label: 'Hợp lệ', color: 'success' },
  DA_LOAI: { label: 'Đã loại', color: 'error' },
  DUOC_CHON: { label: 'Được chọn', color: 'success' },
  DIEU_CHINH: { label: 'Cần điều chỉnh', color: 'warning' },
  KHONG_CHON: { label: 'Không chọn', color: 'error' },
  UNIT_REVIEWED: { label: 'Chờ PKH', color: 'cyan' },
  APPROVED: { label: 'Đã phê duyệt', color: 'success' },
  REJECTED: { label: 'Không phê duyệt', color: 'error' },
  WITHDRAWN: { label: 'Đã rút', color: 'default' },
};

export const PROPOSAL_AUDIT_ACTION_LABEL: Record<string, string> = {
  CREATE: 'Tạo nháp',
  UPDATE: 'Cập nhật',
  SUBMIT: 'Gửi lên Khoa',
  WITHDRAW: 'Rút về Nháp',
  UNIT_CONFIRM: 'Khoa xác nhận',
  UNIT_RETURN: 'Khoa trả lại',
  PKH_MARK_VALID: 'PKH xác nhận hợp lệ',
  PKH_REQUEST_SUPPLEMENT: 'PKH yêu cầu bổ sung',
  RESUBMIT_TO_PKH: 'GV gửi lại PKH',
  PKH_EXTEND_SUPPLEMENT: 'PKH gia hạn bổ sung',
  PKH_REJECT: 'PKH loại hồ sơ',
  SCI_APPROVE: 'PKH phê duyệt',
  SCI_REJECT: 'PKH từ chối',
};
