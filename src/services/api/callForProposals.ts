/**
 * API Thông báo tuyển chọn đề tài (CFP)
 * Spec: specs/call-for-proposal-notice.md
 */
import { get, post, put, ApiResponse } from '../request';

export type CfpStatus = 'DRAFT' | 'PENDING_BGH' | 'RETURNED' | 'APPROVED' | 'PUBLISHED';
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
  officialDocDate?: string | null;
  signedFileUrl?: string | null;
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
  levels: CfpLevel[];
  contentHtml?: string | null;
  attachmentUrls?: string[];
}

export const CFP_STATUS_MAP: Record<CfpStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Nháp', color: 'default' },
  PENDING_BGH: { text: 'Chờ BGH duyệt', color: 'processing' },
  RETURNED: { text: 'Yêu cầu chỉnh sửa', color: 'warning' },
  APPROVED: { text: 'Đã duyệt — chờ phát hành', color: 'cyan' },
  PUBLISHED: { text: 'Đã phát hành', color: 'success' },
};

export const CFP_LEVEL_OPTIONS = [
  { value: 'NHA_NUOC', label: 'Cấp Nhà nước' },
  { value: 'BO', label: 'Cấp Bộ' },
  { value: 'TRUONG', label: 'Cấp Trường' },
  { value: 'CO_SO', label: 'Cấp cơ sở' },
];

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
  return get<CfpAudit[]>(`/api/call-for-proposals/${id}/audits`) as Promise<ApiResponse<CfpAudit[]>>;
}

export async function createCallForProposal(data: CfpWritePayload) {
  return post<CallForProposal>('/api/call-for-proposals', data) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function updateCallForProposal(id: number, data: Partial<CfpWritePayload>) {
  return put<CallForProposal>(`/api/call-for-proposals/${id}`, data) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function submitCallForProposal(id: number) {
  return post<CallForProposal>(`/api/call-for-proposals/${id}/submit`, {}) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function approveCallForProposal(id: number) {
  return post<CallForProposal>(`/api/call-for-proposals/${id}/approve`, {}) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function returnCallForProposal(id: number, reason: string) {
  return post<CallForProposal>(`/api/call-for-proposals/${id}/return`, { reason }) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function publishCallForProposal(
  id: number,
  data: { officialDocNo: string; officialDocDate: string; signedFileUrl?: string | null },
) {
  return post<CallForProposal>(`/api/call-for-proposals/${id}/publish`, data) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function extendCallForProposal(id: number, deadlineAt: string) {
  return post<CallForProposal>(`/api/call-for-proposals/${id}/extend`, { deadlineAt }) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function closeCallForProposal(id: number) {
  return post<CallForProposal>(`/api/call-for-proposals/${id}/close`, {}) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function listPublishedCfp() {
  return get<CallForProposal[]>('/api/call-for-proposals/published') as Promise<
    ApiResponse<CallForProposal[]>
  >;
}

export async function getPublishedCfp(id: number) {
  return get<CallForProposal>(`/api/call-for-proposals/published/${id}`) as Promise<
    ApiResponse<CallForProposal>
  >;
}

export async function getActiveSubmissionPeriod(level: CfpLevel) {
  return get<{
    callForProposalId: number;
    title: string;
    periodId: number;
    deadlineAt: string;
    levels: CfpLevel[];
  } | null>('/api/call-for-proposals/active-period', { level }) as Promise<
    ApiResponse<{
      callForProposalId: number;
      title: string;
      periodId: number;
      deadlineAt: string;
      levels: CfpLevel[];
    } | null>
  >;
}
