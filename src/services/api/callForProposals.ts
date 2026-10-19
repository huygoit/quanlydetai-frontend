/**
 * API Thông báo tuyển chọn đề tài (CFP)
 * Spec: specs/call-for-proposal-notice.md
 */
import { get, post, put, ApiResponse, PaginatedResponse, API_BASE_URL, getToken } from '../request';

export type CfpStatus =
  | 'DRAFT'
  | 'PENDING_TRUONG_PHONG'
  | 'PENDING_BGH'
  | 'RETURNED'
  | 'APPROVED'
  | 'PUBLISHED';
export type CfpPeriodKind = 'ACADEMIC' | 'FINANCIAL';
export type CfpLevel = 'CO_SO' | 'TRUONG' | 'BO' | 'NHA_NUOC';

export interface CfpSubmissionPeriod {
  id: number;
  deadlineAt: string | null;
  status: 'OPEN' | 'CLOSED';
  closedAt?: string | null;
  isAccepting?: boolean;
}

export interface CfpAudit {
  id: number;
  action: string;
  note?: string | null;
  actorUserId: number;
  actorName?: string | null;
  createdAt?: string | null;
  diffJson?: Record<string, unknown> | null;
}

export interface CallForProposal {
  id: number;
  title: string;
  periodKind: CfpPeriodKind;
  periodLabel: string;
  deadlineAt: string | null;
  levels: CfpLevel[];
  /** ID loại quy trình đề tài từ danh mục */
  projectProcessTypeIds?: number[];
  projectProcessTypes?: Array<{ id: number; code: string; name: string }>;
  contentHtml?: string | null;
  attachmentUrls?: string[];
  status: CfpStatus;
  createdBy: number;
  creatorName?: string | null;
  submittedAt?: string | null;
  approvedBy?: number | null;
  approvedAt?: string | null;
  returnReason?: string | null;
  publishedBy?: number | null;
  publishedAt?: string | null;
  officialDocNo?: string | null;
  /** Số/ký hiệu đang hiện trên file thông báo */
  soVanBan?: string | null;
  officialDocDate?: string | null;
  signedFileUrl?: string | null;
  /** false thì hồ sơ nộp đi thẳng phòng KH, không qua khoa */
  requireUnitReview?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
  submissionPeriod?: CfpSubmissionPeriod | null;
  audits?: CfpAudit[];
}

export interface CfpWritePayload {
  title: string;
  periodKind: CfpPeriodKind;
  periodLabel: string;
  deadlineAt: string;
  /** Chọn từ danh mục loại quy trình đề tài */
  projectProcessTypeIds: number[];
  levels?: CfpLevel[];
  contentHtml?: string | null;
  attachmentUrls?: string[];
  requireUnitReview?: boolean;
}

export const CFP_STATUS_MAP: Record<
  CfpStatus,
  { text: string; color: string }
> = {
  DRAFT: { text: 'Nháp', color: 'default' },
  PENDING_TRUONG_PHONG: { text: 'Chờ trưởng phòng', color: 'gold' },
  PENDING_BGH: { text: 'Chờ ban giám hiệu', color: 'processing' },
  RETURNED: { text: 'Yêu cầu chỉnh sửa', color: 'warning' },
  APPROVED: { text: 'Đã duyệt — chờ phát hành', color: 'cyan' },
  PUBLISHED: { text: 'Đã phát hành', color: 'success' },
};

/** @deprecated Dùng danh mục loại quy trình đề tài */
export const CFP_LEVEL_OPTIONS = [
  { value: 'NHA_NUOC', label: 'Cấp Nhà nước' },
  { value: 'BO', label: 'Cấp Bộ' },
  { value: 'TRUONG', label: 'Cấp Trường' },
  { value: 'CO_SO', label: 'Cấp cơ sở' },
];

export const CFP_LEVEL_LABEL: Record<CfpLevel, string> = {
  NHA_NUOC: 'Cấp Nhà nước',
  BO: 'Cấp Bộ',
  TRUONG: 'Cấp Trường',
  CO_SO: 'Cấp cơ sở',
};

/** Hiển thị loại đề tài: ưu tiên danh mục, fallback cấp cũ */
export function renderCfpProcessTypeTags(
  r: Pick<CallForProposal, 'projectProcessTypes' | 'levels'>,
) {
  const types = r.projectProcessTypes || [];
  if (types.length > 0) {
    return types.map((t) => ({
      key: String(t.id),
      label: t.code ? `${t.code} — ${t.name}` : t.name,
    }));
  }
  return (r.levels || []).map((lv) => ({
    key: lv,
    label:
      CFP_LEVEL_LABEL[lv] ||
      CFP_LEVEL_OPTIONS.find((o) => o.value === lv)?.label ||
      lv,
  }));
}

export const CFP_PERIOD_KIND_OPTIONS = [
  { value: 'ACADEMIC', label: 'Năm học (01/08 → 31/07)' },
  { value: 'FINANCIAL', label: 'Năm tài chính (01/04 → 31/03)' },
];

export async function listCallForProposals(params?: {
  status?: string;
  periodLabel?: string;
  keyword?: string;
}) {
  return get<CallForProposal[]>('/api/call-for-proposals', {
    status: params?.status,
    period_label: params?.periodLabel,
    keyword: params?.keyword,
  }) as Promise<ApiResponse<CallForProposal[]>>;
}

export async function getCallForProposal(id: number) {
  return get<CallForProposal>(`/api/call-for-proposals/${id}`) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function getCfpAudits(id: number) {
  return get<CfpAudit[]>(`/api/call-for-proposals/${id}/audits`) as Promise<
    ApiResponse<CfpAudit[]>
  >;
}

export async function createCallForProposal(data: CfpWritePayload) {
  return post<CallForProposal>('/api/call-for-proposals', data) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function updateCallForProposal(
  id: number,
  data: Partial<CfpWritePayload>,
) {
  return put<CallForProposal>(`/api/call-for-proposals/${id}`, data) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function submitCallForProposal(id: number) {
  return post<CallForProposal>(
    `/api/call-for-proposals/${id}/submit`,
    {},
  ) as Promise<ApiResponse<CallForProposal>>;
}

export async function headApproveCallForProposal(id: number) {
  return post<CallForProposal>(
    `/api/call-for-proposals/${id}/head-approve`,
    {},
  ) as Promise<ApiResponse<CallForProposal>>;
}

export async function approveCallForProposal(id: number) {
  return post<CallForProposal>(
    `/api/call-for-proposals/${id}/approve`,
    {},
  ) as Promise<ApiResponse<CallForProposal>>;
}

export async function returnCallForProposal(id: number, reason: string) {
  return post<CallForProposal>(`/api/call-for-proposals/${id}/return`, {
    reason,
  }) as Promise<ApiResponse<CallForProposal>>;
}

export async function publishCallForProposal(
  id: number,
  data: {
    officialDocNo: string;
    officialDocDate: string;
    signedFileUrl?: string | null;
  },
) {
  return post<CallForProposal>(
    `/api/call-for-proposals/${id}/publish`,
    data,
  ) as Promise<ApiResponse<CallForProposal>>;
}

export async function extendCallForProposal(id: number, deadlineAt: string) {
  return post<CallForProposal>(`/api/call-for-proposals/${id}/extend`, {
    deadlineAt,
  }) as Promise<ApiResponse<CallForProposal>>;
}

export async function closeCallForProposal(id: number) {
  return post<CallForProposal>(
    `/api/call-for-proposals/${id}/close`,
    {},
  ) as Promise<ApiResponse<CallForProposal>>;
}

export async function listPublishedCfp() {
  return get<CallForProposal[]>('/api/call-for-proposals/published') as Promise<
    ApiResponse<CallForProposal[]>
  >;
}

export async function getPublishedCfp(id: number) {
  return get<CallForProposal>(
    `/api/call-for-proposals/published/${id}`,
  ) as Promise<ApiResponse<CallForProposal>>;
}

/** Nhiệm vụ (đề xuất) gắn với thông báo tuyển chọn */
export interface CfpNhiemVu {
  id: number;
  code: string;
  title: string;
  ownerName: string;
  ownerUnit: string;
  status: string;
  projectProcessType?: { id: number; code: string; name: string } | null;
  callForProposalId?: number | null;
  callForProposalTitle?: string | null;
}

export async function listCfpProposals(id: number) {
  return get<CfpNhiemVu[]>(`/api/call-for-proposals/${id}/proposals`) as Promise<
    ApiResponse<CfpNhiemVu[]>
  >;
}

export async function listProposalCandidatesByTypes(params: {
  projectProcessTypeIds: number[];
  keyword?: string;
  page?: number;
  perPage?: number;
}) {
  return get<PaginatedResponse<CfpNhiemVu>>('/api/call-for-proposals/proposal-candidates', {
    ...params,
    projectProcessTypeIds: params.projectProcessTypeIds.join(','),
  });
}

export async function listCfpProposalCandidates(
  id: number,
  params: { keyword?: string; page?: number; perPage?: number },
) {
  return get<PaginatedResponse<CfpNhiemVu>>(
    `/api/call-for-proposals/${id}/proposal-candidates`,
    params,
  );
}

export async function attachCfpProposals(id: number, proposalIds: number[]) {
  return post<{ attached: number; moved: number }>(`/api/call-for-proposals/${id}/proposals`, {
    proposalIds,
  }) as Promise<ApiResponse<{ attached: number; moved: number }>>;
}

export async function detachCfpProposals(id: number, proposalIds: number[]) {
  return post<{ removed: number }>(`/api/call-for-proposals/${id}/proposals/detach`, {
    proposalIds,
  }) as Promise<ApiResponse<{ removed: number }>>;
}

export async function getActiveSubmissionPeriod(
  level: CfpLevel,
  projectProcessTypeId?: number | null,
) {
  return get<{
    callForProposalId: number;
    title: string;
    periodId: number;
    deadlineAt: string;
    levels: CfpLevel[];
    projectProcessTypeIds?: number[];
  } | null>('/api/call-for-proposals/active-period', {
    level,
    projectProcessTypeId: projectProcessTypeId || undefined,
  }) as Promise<
    ApiResponse<{
      callForProposalId: number;
      title: string;
      periodId: number;
      deadlineAt: string;
      levels: CfpLevel[];
      projectProcessTypeIds?: number[];
    } | null>
  >;
}

export interface CfpNoticeHang {
  stt: string;
  tenNhiemVu: string;
  mucTieu: string;
  sanPhamDuKien: string;
  thoiGianThucHien: string;
}

export interface CfpNoticeView {
  id: number;
  status: CfpStatus;
  truong: Record<string, string>;
  hang: CfpNoticeHang[];
}

export async function getCfpNoticeView(id: number) {
  return get<CfpNoticeView>(`/api/call-for-proposals/${id}/notice-view`) as Promise<
    ApiResponse<CfpNoticeView>
  >;
}

export async function previewCfpNotice(id: number) {
  return get<{ text: string }>(`/api/call-for-proposals/${id}/notice-preview`) as Promise<
    ApiResponse<{ text: string }>
  >;
}

export async function downloadCfpNotice(id: number) {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/call-for-proposals/${id}/notice-file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message || 'Tải thông báo thất bại');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Thong-bao-tuyen-chon.docx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
