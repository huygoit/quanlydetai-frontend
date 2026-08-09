/**
 * API thuyết minh chi tiết (US-04-01) — bảng project_outlines
 */
import { get, post, put, ApiResponse } from '../request';
import type { PublicationAuthor } from './profilePublications';

export type ProjectOutlineStatus =
  | 'THUYETMINH_DRAFT'
  | 'THUYETMINH_PENDING'
  | 'PHANBIEN_KIN'
  | 'BAOVE_PENDING'
  | 'CHINH_SUA_TM'
  | 'CHO_XAC_NHAN_KP'
  | 'CHO_TC_THAM_TRA'
  | 'LDPD_PENDING'
  | 'SAN_SANG_THUC_HIEN'
  | 'KHONG_PHE_DUYET'
  | 'BAOVE_KHONG_DAT';

export type OutlineBudgetGroup = 'NHAN_CONG' | 'VAT_TU' | 'HOI_THAO' | 'KHAC';

export const OUTLINE_STATUS_MAP: Record<
  ProjectOutlineStatus,
  { label: string; color: string }
> = {
  THUYETMINH_DRAFT: { label: 'Bản nháp', color: 'default' },
  THUYETMINH_PENDING: { label: 'Đã nộp — chờ PKH', color: 'processing' },
  PHANBIEN_KIN: { label: 'Phản biện kín', color: 'purple' },
  BAOVE_PENDING: { label: 'Chờ / đang bảo vệ', color: 'blue' },
  CHINH_SUA_TM: { label: 'Chỉnh sửa thuyết minh', color: 'orange' },
  CHO_XAC_NHAN_KP: { label: 'Chờ đề xuất kinh phí', color: 'cyan' },
  CHO_TC_THAM_TRA: { label: 'Chờ TC thẩm tra KP', color: 'geekblue' },
  LDPD_PENDING: { label: 'Chờ LĐ phê duyệt', color: 'gold' },
  SAN_SANG_THUC_HIEN: { label: 'Sẵn sàng thực hiện', color: 'success' },
  KHONG_PHE_DUYET: { label: 'Không phê duyệt', color: 'error' },
  BAOVE_KHONG_DAT: { label: 'Không thông qua bảo vệ', color: 'error' },
};

export const BUDGET_GROUP_OPTIONS: { value: OutlineBudgetGroup; label: string }[] = [
  { value: 'NHAN_CONG', label: 'Nhân công' },
  { value: 'VAT_TU', label: 'Vật tư' },
  { value: 'HOI_THAO', label: 'Hội thảo' },
  { value: 'KHAC', label: 'Khác' },
];

export const OUTLINE_MEMBER_ROLE_OPTIONS = [
  { value: 'PRINCIPAL', label: 'Chủ nhiệm' },
  { value: 'SECRETARY', label: 'Thư ký' },
  { value: 'MEMBER', label: 'Thành viên' },
];

export type OutlineMilestone = {
  content: string;
  startDate?: string | null;
  endDate?: string | null;
  expectedResult?: string | null;
};

export type OutlineProduct = {
  name: string;
  quantity?: string | null;
  quality?: string | null;
};

export type OutlinePartnerUnit = {
  name: string;
  role?: string | null;
};

export type OutlineMember = PublicationAuthor & {
  participationHours?: number | null;
};

export type OutlineBudgetLine = {
  id?: number;
  groupCode: OutlineBudgetGroup;
  content: string;
  amount: number;
  note?: string | null;
  lineOrder?: number;
};

export type OutlineRevisionContext = {
  status: string;
  revisionDeadline?: string | null;
  pastDeadline: boolean;
  needsReminder: boolean;
  reminderDays: number;
  revisionExplanation?: string | null;
  adjustmentRequirements?: string | null;
  discussionNotes?: string | null;
  conclusion?: string | null;
  minutesFileUrl?: string | null;
  finalScore?: number | null;
  diffLimitNote?: string;
  minExplanationLength: number;
  editable: boolean;
  canSubmit: boolean;
};

export type OutlineFieldDiff = {
  field: string;
  label: string;
  before: string;
  after: string;
  kind: 'text' | 'number' | 'json' | 'file';
};

export type ProjectOutline = {
  id: number;
  projectProposalId: number;
  code: string;
  status: ProjectOutlineStatus;
  title: string;
  projectProcessTypeId?: number | null;
  level?: string | null;
  field?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  requestedBudget: number;
  hostUnit?: string | null;
  partnerUnits: OutlinePartnerUnit[];
  applicationScope?: string | null;
  urgency?: string | null;
  detailedObjectives?: string | null;
  researchContent?: string | null;
  methodology?: string | null;
  milestones: OutlineMilestone[];
  expectedProducts: OutlineProduct[];
  summary?: string | null;
  councilFeedback?: string | null;
  outlineFileUrl?: string | null;
  appendixFileUrl?: string | null;
  completionPercent: number;
  ownerId: number;
  ownerName: string;
  ownerEmail?: string | null;
  ownerUnit?: string | null;
  submittedAt?: string | null;
  withdrawnAt?: string | null;
  reviewAverageScore?: number | null;
  reviewBelowThreshold?: boolean | null;
  reviewScoresCompletedAt?: string | null;
  defenseConclusion?: string | null;
  revisionDeadline?: string | null;
  revisionExplanation?: string | null;
  revisionBaselineVersionId?: number | null;
  revisionSubmittedVersionId?: number | null;
  revisionSubmittedAt?: string | null;
  revisionContext?: OutlineRevisionContext | null;
  members: OutlineMember[];
  budgetLines: OutlineBudgetLine[];
  totalDetailBudget?: number;
  budgetDifference?: number;
  editable?: boolean;
  projectProposal?: {
    id: number;
    code: string;
    status: string;
    canWriteOutline: boolean;
  };
};

export type EligibleProposalForOutline = {
  id: number;
  code: string;
  title: string;
  status: string;
  canWriteOutline: boolean;
  ownerUnit?: string;
  councilAdjustmentNote?: string | null;
  outlineId?: number | null;
  outlineCode?: string | null;
  outlineStatus?: ProjectOutlineStatus | null;
  completionPercent?: number;
};

export type OutlineDraftPayload = Partial<{
  title: string;
  projectProcessTypeId: number | null;
  level: string | null;
  field: string | null;
  startDate: string | null;
  endDate: string | null;
  requestedBudget: number;
  hostUnit: string | null;
  partnerUnits: OutlinePartnerUnit[];
  applicationScope: string | null;
  urgency: string | null;
  detailedObjectives: string | null;
  researchContent: string | null;
  methodology: string | null;
  milestones: OutlineMilestone[];
  expectedProducts: OutlineProduct[];
  summary: string | null;
  outlineFileUrl: string | null;
  appendixFileUrl: string | null;
  revisionExplanation?: string | null;
  members: OutlineMember[];
  budgetLines: OutlineBudgetLine[];
}>;

export async function listEligibleProposalsForOutline(): Promise<
  ApiResponse<EligibleProposalForOutline[]>
> {
  return get('/api/project-outlines/eligible');
}

export async function listMyOutlines(params?: {
  status?: ProjectOutlineStatus;
}): Promise<ApiResponse<ProjectOutline[]>> {
  return get('/api/project-outlines', params);
}

export async function openOrCreateOutlineFromProposal(
  proposalId: number,
): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/from-proposal/${proposalId}`);
}

export async function getOutline(id: number): Promise<ApiResponse<ProjectOutline>> {
  return get(`/api/project-outlines/${id}`);
}

export async function saveOutlineDraft(
  id: number,
  data: OutlineDraftPayload,
): Promise<ApiResponse<ProjectOutline>> {
  return put(`/api/project-outlines/${id}`, data);
}

export async function submitOutline(id: number): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/${id}/submit`);
}

export async function withdrawOutline(id: number): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/${id}/withdraw`);
}

export async function getOutlineRevisionContext(
  id: number,
): Promise<ApiResponse<OutlineRevisionContext>> {
  return get(`/api/project-outlines/${id}/revision-context`);
}

export async function submitOutlineRevision(
  id: number,
  explanation: string,
): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/${id}/submit-revision`, { explanation });
}

export async function extendOutlineRevisionDeadline(
  id: number,
  data: { deadlineAt: string; reason: string },
): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/${id}/extend-revision-deadline`, data);
}

export async function getOutlineRevisionDiff(
  id: number,
  params?: { fromVersionId?: number; toVersionId?: number },
): Promise<
  ApiResponse<{
    diffs: OutlineFieldDiff[];
    baseline: unknown;
    after: unknown;
    diffLimitNote: string;
  }>
> {
  return get(`/api/project-outlines/${id}/revision-diff`, params);
}
