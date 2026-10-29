/**
 * Phê duyệt cuối thuyết minh — BGH ký → TC-HC phát hành QĐ
 */
import { ApiResponse, get, post } from '../request';

export type OutlineApprovalListItem = {
  id: number;
  code: string;
  title: string;
  status: string;
  ownerName?: string | null;
  ownerUnit?: string | null;
  requestedBudget: number;
  approvedBudget?: number | null;
  outlineFileUrl?: string | null;
  averageScore?: number | null;
  minutesFileUrl?: string | null;
  defenseConclusion?: string | null;
  bghSignedAt?: string | null;
  hcPublishedAt?: string | null;
  updatedAt?: string | null;
};

export type OutlineApprovalDossier = {
  outline: Record<string, any> & {
    id: number;
    code: string;
    title: string;
    status: string;
    requestedBudget: number;
    approvedBudget?: number | null;
    outlineFileUrl?: string | null;
    bghDecisionNote?: string | null;
    bghSignedAt?: string | null;
    bghRejectReason?: string | null;
    assignmentDecisionUrl?: string | null;
    hcPublishedAt?: string | null;
    ownerName?: string;
  };
  appraisal: {
    averageScore?: number | null;
    minutesFileUrl?: string | null;
    discussionNotes?: string | null;
    adjustmentRequirements?: string | null;
    councilConclusion?: string | null;
    defenseConclusion?: string | null;
    sessionId?: number | null;
    sessionCode?: string | null;
  };
  finalFile: {
    url?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    label: string;
  };
  versions: Array<{
    id: number;
    versionNo: number;
    versionType: string;
    fileName?: string | null;
    fileSize?: number | null;
    uploadedAt?: string | null;
    outlineFileUrl?: string | null;
    explanation?: string | null;
  }>;
  revisionDiff?: {
    diffs?: unknown[];
    fileDiff?: unknown;
    diffLimitNote?: string;
  } | null;
  canApprove: boolean;
  canPublish: boolean;
  permissions?: { canBgh: boolean; canHc: boolean };
};

export async function listOutlineApprovals(scope: 'bgh' | 'hc' | 'done' = 'bgh') {
  return get<ApiResponse<OutlineApprovalListItem[]>>(
    '/api/project-outline-approvals',
    { scope },
  );
}

export async function getOutlineApprovalDossier(id: number) {
  return get<ApiResponse<OutlineApprovalDossier>>(
    `/api/project-outline-approvals/${id}`,
  );
}

export async function bghApproveOutline(
  id: number,
  data: { approvedBudget: number; note?: string },
) {
  return post<ApiResponse<OutlineApprovalDossier>>(
    `/api/project-outline-approvals/${id}/bgh-approve`,
    data,
  );
}

export async function bghRejectOutline(id: number, reason: string) {
  return post<ApiResponse<OutlineApprovalDossier>>(
    `/api/project-outline-approvals/${id}/bgh-reject`,
    { reason },
  );
}

export async function hcPublishOutlineDecision(
  id: number,
  data?: { decisionFileUrl?: string | null },
) {
  return post<ApiResponse<OutlineApprovalDossier>>(
    `/api/project-outline-approvals/${id}/hc-publish`,
    data || {},
  );
}
