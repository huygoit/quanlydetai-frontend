/**
 * API thuyết minh chi tiết (US-04-01) — bảng project_outlines
 */
import { API_BASE_URL, ApiResponse, get, getToken, post, put } from '../request';
import type { PublicationAuthor } from './profilePublications';

export type ProjectOutlineStatus =
  | 'THUYETMINH_DRAFT'
  | 'THUYETMINH_PENDING'
  | 'PHANBIEN_KIN'
  | 'BAOVE_PENDING'
  | 'CHINH_SUA_TM'
  | 'CHO_HD_XAC_NHAN_TM'
  | 'CHO_PKH_DUYET_TM'
  | 'CHO_BGH_DUYET_TM'
  | 'CHO_HC_PHAT_HANH_QD'
  | 'CHO_XAC_NHAN_KP'
  | 'CHO_TC_THAM_TRA'
  | 'LDPD_PENDING'
  | 'SAN_SANG_THUC_HIEN'
  | 'KHONG_PHE_DUYET'
  | 'BAOVE_KHONG_DAT'

export type OutlineBudgetGroup = 'NHAN_CONG' | 'VAT_TU' | 'HOI_THAO' | 'KHAC';

export const OUTLINE_STATUS_MAP: Record<
  ProjectOutlineStatus,
  { label: string; color: string }
> = {
  THUYETMINH_DRAFT: { label: 'Bản nháp', color: 'default' },
  THUYETMINH_PENDING: { label: 'Đã nộp — chờ PKH', color: 'processing' },
  PHANBIEN_KIN: { label: 'Phản biện kín', color: 'purple' },
  BAOVE_PENDING: { label: 'Chờ / đang thẩm định', color: 'blue' },
  CHINH_SUA_TM: { label: 'Hoàn thiện theo BM.05b', color: 'orange' },
  CHO_PKH_DUYET_TM: { label: 'Chờ phòng KH duyệt', color: 'purple' },
  CHO_HD_XAC_NHAN_TM: { label: 'Chờ hội đồng xác nhận', color: 'blue' },
  CHO_BGH_DUYET_TM: { label: 'Chờ BGH phê duyệt', color: 'gold' },
  CHO_HC_PHAT_HANH_QD: { label: 'Tồn đọng (flow cũ — chờ mở M5)', color: 'cyan' },
  CHO_XAC_NHAN_KP: { label: '(Cũ) Chờ kinh phí', color: 'default' },
  CHO_TC_THAM_TRA: { label: '(Cũ) TC thẩm tra KP', color: 'default' },
  LDPD_PENDING: { label: '(Cũ) Chờ LĐ phê duyệt', color: 'default' },
  SAN_SANG_THUC_HIEN: { label: 'Được duyệt — sẵn sàng TH', color: 'success' },
  KHONG_PHE_DUYET: { label: 'Từ chối phê duyệt', color: 'error' },
  BAOVE_KHONG_DAT: { label: 'Không thông qua thẩm định', color: 'error' },
};

export const BUDGET_GROUP_OPTIONS: {
  value: OutlineBudgetGroup;
  label: string;
}[] = [
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

export type OutlineExpectedPublication = {
  id: string;
  category: 'DOMESTIC' | 'INTERNATIONAL' | string;
  content: string;
  quantity?: string | null;
  scienceRequirement?: string | null;
  note?: string | null;
};

export type OutlineExpectedAppliedProduct = {
  id: string;
  name: string;
  scienceRequirement?: string | null;
  note?: string | null;
};

export type OutlineExpectedTangibleProduct = {
  id: string;
  name: string;
  unit?: string | null;
  qualityRequired?: string | null;
  qualitySampleDomestic?: string | null;
  qualitySampleWorld?: string | null;
  quantityScale?: string | null;
};

export type OutlineExpectedIpProduct = {
  id: string;
  name: string;
  scienceRequirement?: string | null;
  note?: string | null;
};

export type OutlineExpectedTraining = {
  id: string;
  level: string;
  quantity?: string | null;
  major?: string | null;
  note?: string | null;
};

export type OutlineExpectedResults = {
  publications: OutlineExpectedPublication[];
  appliedProducts: OutlineExpectedAppliedProduct[];
  tangibleProducts: OutlineExpectedTangibleProduct[];
  ipProducts: OutlineExpectedIpProduct[];
  postgraduateTraining: OutlineExpectedTraining[];
};

export const EMPTY_EXPECTED_RESULTS: OutlineExpectedResults = {
  publications: [],
  appliedProducts: [],
  tangibleProducts: [],
  ipProducts: [],
  postgraduateTraining: [],
};

/** Nội dung khác — các mục mô tả (HTML) */
export type OutlineOtherContents = {
  applicationTransferHtml?: string | null;
  outputEffectivenessHtml?: string | null;
  impactAssessmentHtml?: string | null;
  riskManagementHtml?: string | null;
  ethicsDataApprovalHtml?: string | null;
  dataManagementPlanHtml?: string | null;
  ipProtectionHtml?: string | null;
  aiUsageHtml?: string | null;
};

export const EMPTY_OTHER_CONTENTS: OutlineOtherContents = {
  applicationTransferHtml: '',
  outputEffectivenessHtml: '',
  impactAssessmentHtml: '',
  riskManagementHtml: '',
  ethicsDataApprovalHtml: '',
  dataManagementPlanHtml: '',
  ipProtectionHtml: '',
  aiUsageHtml: '',
};

export type OutlinePartnerUnit = {
  name: string;
  orgCode?: string | null;
  phone?: string | null;
  address?: string | null;
  /** Giữ tương thích dữ liệu cũ */
  role?: string | null;
};

/** Tổ chức chủ trì nhiệm vụ */
export type OutlineHostOrganization = {
  name: string;
  orgCode?: string | null;
  phone?: string | null;
  address?: string | null;
  leaderName?: string | null;
  experienceHtml?: string | null;
  teamCapacityHtml?: string | null;
};

/** Snapshot chủ nhiệm nhiệm vụ */
export type OutlinePrincipalInfo = {
  profileId?: number | null;
  fullName?: string | null;
  identityNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  academicTitleDegree?: string | null;
  professionalTitle?: string | null;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  organization?: string | null;
  workAddress?: string | null;
};

/** Phương thức khoán chi (BM-02.02 §5) */
export type OutlineLumpSumMode = 'FULL' | 'PARTIAL';

/**
 * Phân bổ nguồn kinh phí đề xuất (BM-02.02 §4–5).
 * a) theo chủ thể: schoolFund + externalFund
 * b) theo tính chất: stateBudget + nonStateBudget
 * §5 khoán chi: lumpSumMode + lumpSumAmount + nonLumpSumAmount
 * Trường legacy (externalStateLocal…) chỉ dùng khi đọc dữ liệu cũ.
 */
export type OutlineFundingBreakdown = {
  schoolFund: number;
  /** Kinh phí ngoài Trường */
  externalFund: number;
  stateBudget: number;
  nonStateBudget: number;
  /** FULL = khoán đến SP cuối; PARTIAL = khoán từng phần */
  lumpSumMode: OutlineLumpSumMode | null;
  /** Kinh phí khoán */
  lumpSumAmount: number;
  /** Kinh phí không khoán */
  nonLumpSumAmount: number;
  /** @deprecated dữ liệu cũ — gộp vào externalFund khi đọc */
  externalStateLocal?: number;
  /** @deprecated */
  externalEnterprise?: number;
  /** @deprecated */
  externalSponsor?: number;
  /** @deprecated */
  externalOther?: number;
};

export const EMPTY_FUNDING_BREAKDOWN: OutlineFundingBreakdown = {
  schoolFund: 0,
  externalFund: 0,
  stateBudget: 0,
  nonStateBudget: 0,
  lumpSumMode: null,
  lumpSumAmount: 0,
  nonLumpSumAmount: 0,
};

function money0(v: unknown): number {
  const n = Math.round(Number(v || 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Gộp nguồn ngoài Trường (ưu tiên externalFund; fallback tổng các mục cũ). */
export function fundingExternalTotal(f: OutlineFundingBreakdown): number {
  const direct = money0(f.externalFund);
  if (direct > 0) return direct;
  return (
    money0(f.externalStateLocal) +
    money0(f.externalEnterprise) +
    money0(f.externalSponsor) +
    money0(f.externalOther)
  );
}

export function fundingTotalByEntity(f: OutlineFundingBreakdown): number {
  return money0(f.schoolFund) + fundingExternalTotal(f);
}

export function fundingTotalByNature(f: OutlineFundingBreakdown): number {
  return money0(f.stateBudget) + money0(f.nonStateBudget);
}

/** Chuẩn hóa JSON funding — tương thích bản ghi cũ. */
export function normalizeFundingBreakdown(
  raw?: Partial<OutlineFundingBreakdown> | null,
): OutlineFundingBreakdown {
  const schoolFund = money0(raw?.schoolFund);
  const legacyExternal =
    money0(raw?.externalStateLocal) +
    money0(raw?.externalEnterprise) +
    money0(raw?.externalSponsor) +
    money0(raw?.externalOther);
  const externalFund = money0(raw?.externalFund) || legacyExternal;
  let stateBudget = money0(raw?.stateBudget);
  let nonStateBudget = money0(raw?.nonStateBudget);
  // Chỉ suy tính chất từ chi tiết cũ khi bản ghi chưa có b) và còn breakdown ngoài Trường cũ
  if (!stateBudget && !nonStateBudget && legacyExternal > 0 && !money0(raw?.externalFund)) {
    stateBudget = schoolFund + money0(raw?.externalStateLocal);
    nonStateBudget =
      money0(raw?.externalEnterprise) +
      money0(raw?.externalSponsor) +
      money0(raw?.externalOther);
  }
  const modeRaw = String(raw?.lumpSumMode || '').toUpperCase();
  const lumpSumMode: OutlineLumpSumMode | null =
    modeRaw === 'FULL' || modeRaw === 'PARTIAL' ? modeRaw : null;
  return {
    schoolFund,
    externalFund,
    stateBudget,
    nonStateBudget,
    lumpSumMode,
    lumpSumAmount: money0(raw?.lumpSumAmount),
    nonLumpSumAmount: money0(raw?.nonLumpSumAmount),
  };
}

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

export type { OutlineBudgetMatrix } from '@/constants/outlineBudgetMatrix';

export type RevisionGateStatus =
  | 'CHO_PKH'
  | 'CHO_THU_KY'
  | 'CHO_CHU_TICH'
  | 'CHO_BGH';

export type OutlineVersionMeta = {
  id: number;
  versionNo: number;
  versionType: string;
  outlineFileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  uploadedAt?: string | null;
  lockedAt?: string | null;
  createdAt?: string | null;
  explanation?: string | null;
};

export type OutlineRevisionContext = {
  status: string;
  revisionGateStatus?: RevisionGateStatus | null;
  revisionReturnReason?: string | null;
  revisionDeadline?: string | null;
  pastDeadline: boolean;
  needsReminder: boolean;
  reminderDays: number;
  revisionExplanation?: string | null;
  adjustmentRequirements?: string | null;
  discussionNotes?: string | null;
  minutesNote?: string | null;
  councilConclusion?: string | null;
  conclusion?: string | null;
  minutesFileUrl?: string | null;
  finalScore?: number | null;
  baselineVersion?: OutlineVersionMeta | null;
  submittedVersion?: OutlineVersionMeta | null;
  diffLimitNote?: string;
  minExplanationLength: number;
  editable: boolean;
  canSubmit: boolean;
  /** UserId Thư ký / Chủ tịch HĐ — dùng hiện nút duyệt, không cần gọi API phiên HĐ. */
  thuKyUserId?: number | null;
  chuTichUserId?: number | null;
  flowSteps?: string[];
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
  fundingBreakdown?: OutlineFundingBreakdown | null;
  principalInfo?: OutlinePrincipalInfo | null;
  hostUnit?: string | null;
  hostOrganization?: OutlineHostOrganization | null;
  partnerUnits: OutlinePartnerUnit[];
  urgency?: string | null;
  detailedObjectives?: string | null;
  researchContent?: string | null;
  methodology?: string | null;
  milestones: OutlineMilestone[];
  expectedProducts: OutlineProduct[];
  expectedResults?: OutlineExpectedResults | null;
  otherContents?: OutlineOtherContents | null;
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
  activeDefenseSessionId?: number | null;
  revisionDeadline?: string | null;
  revisionExplanation?: string | null;
  revisionBaselineVersionId?: number | null;
  revisionSubmittedVersionId?: number | null;
  revisionSubmittedAt?: string | null;
  revisionContext?: OutlineRevisionContext | null;
  approvedBudget?: number | null;
  module5Opened?: boolean;
  activeContractId?: number | null;
  contractStatus?: string | null;
  executionStatus?: string | null;
  extensionCount?: number;
  members: OutlineMember[];
  budgetLines: OutlineBudgetLine[];
  budgetMatrix?: import('@/constants/outlineBudgetMatrix').OutlineBudgetMatrix | null;
  totalDetailBudget?: number;
  budgetDifference?: number;
  /** Trạng thái cho phép sửa form (nháp / đang hoàn thiện) — không gồm quyền user. */
  editable?: boolean;
  /** Quyền lưu/nộp của user đang đăng nhập (CNĐT / đề xuất / được giao). */
  canWrite?: boolean;
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
  fundingBreakdown: OutlineFundingBreakdown | null;
  principalInfo: OutlinePrincipalInfo | null;
  hostUnit: string | null;
  hostOrganization: OutlineHostOrganization | null;
  partnerUnits: OutlinePartnerUnit[];
  urgency: string | null;
  detailedObjectives: string | null;
  researchContent: string | null;
  methodology: string | null;
  milestones: OutlineMilestone[];
  expectedProducts: OutlineProduct[];
  expectedResults: OutlineExpectedResults | null;
  otherContents: OutlineOtherContents | null;
  summary: string | null;
  outlineFileUrl: string | null;
  appendixFileUrl: string | null;
  revisionExplanation?: string | null;
  members: OutlineMember[];
  budgetLines: OutlineBudgetLine[];
  budgetMatrix: import('@/constants/outlineBudgetMatrix').OutlineBudgetMatrix | null;
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

export async function getOutline(
  id: number,
): Promise<ApiResponse<ProjectOutline>> {
  return get(`/api/project-outlines/${id}`);
}

/** Tải file Word thuyết minh (BM-02.02) đã đổ biến từ mẫu mặc định */
export async function exportOutlineDocx(
  id: number,
  fileName?: string,
): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/project-outlines/${id}/export-docx`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message || 'Xuất thuyết minh thất bại');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || `BM-02.02_TM-${id}.docx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function saveOutlineDraft(
  id: number,
  data: OutlineDraftPayload,
): Promise<ApiResponse<ProjectOutline>> {
  return put(`/api/project-outlines/${id}`, data);
}

export async function submitOutline(
  id: number,
): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/${id}/submit`);
}

export async function withdrawOutline(
  id: number,
): Promise<ApiResponse<ProjectOutline>> {
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

export async function confirmOutlineRevisionCouncil(
  id: number,
  body: { accept: boolean; reason?: string },
): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/${id}/revision-council`, body);
}

export async function confirmOutlineRevisionPkh(
  id: number,
  body: { accept: boolean; reason?: string },
): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/${id}/revision-pkh`, body);
}

export async function extendOutlineRevisionDeadline(
  id: number,
  data: { deadlineAt: string; reason: string },
): Promise<ApiResponse<ProjectOutline>> {
  return post(`/api/project-outlines/${id}/extend-revision-deadline`, data);
}

export type OutlineFileDiff = {
  before: {
    fileName?: string | null;
    fileSize?: number | null;
    uploadedAt?: string | null;
    url?: string | null;
  };
  after: {
    fileName?: string | null;
    fileSize?: number | null;
    uploadedAt?: string | null;
    url?: string | null;
  };
};

export async function getOutlineRevisionDiff(
  id: number,
  params?: { fromVersionId?: number; toVersionId?: number },
): Promise<
  ApiResponse<{
    diffs: OutlineFieldDiff[];
    baseline: OutlineVersionMeta | null;
    after: OutlineVersionMeta | null;
    fileDiff?: OutlineFileDiff | null;
    diffLimitNote: string;
  }>
> {
  return get(`/api/project-outlines/${id}/revision-diff`, params);
}
