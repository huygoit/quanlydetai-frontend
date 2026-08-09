/**
 * API xác nhận kinh phí & phê duyệt (US-04-06)
 */
import { get, post, ApiResponse } from '../request';
import type { ProjectOutline } from './projectOutlines';

export type BudgetConfirmation = {
  id: number;
  projectOutlineId: number;
  status: string;
  requestedBudgetSnapshot: number;
  pkhProposedBudget: number | null;
  pkhNote?: string | null;
  tcConfirmedBudget: number | null;
  tcNote?: string | null;
  tcAdjusted?: boolean;
  tcReturnReason?: string | null;
  requiresLargeBudgetCouncil: boolean;
  largeBudgetCouncilDone: boolean;
  largeBudgetCouncilNote?: string | null;
  largeBudgetMinutesUrl?: string | null;
  ldDecision?: string | null;
  ldNote?: string | null;
  ldRejectReason?: string | null;
  approvedBudget?: number | null;
  version: number;
  deviationRate?: number | null;
  deviationWarning?: boolean;
  requestedZeroException?: boolean;
  largeBudgetThreshold?: number;
  outline?: {
    id: number;
    code: string;
    title: string;
    status: string;
    ownerName?: string | null;
    ownerUnit?: string | null;
    requestedBudget?: number;
  };
  outlineDetail?: ProjectOutline;
  roles?: {
    canPkhPropose: boolean;
    canTcConfirm: boolean;
    canLdApprove: boolean;
  };
};

export async function listBudgetConfirmations(
  scope: 'pkh' | 'tc' | 'ld',
): Promise<ApiResponse<BudgetConfirmation[]>> {
  return get('/api/project-outline-budgets', { scope });
}

export async function getBudgetConfirmation(
  outlineId: number,
): Promise<ApiResponse<BudgetConfirmation>> {
  return get(`/api/project-outline-budgets/${outlineId}`);
}

export async function pkhProposeBudget(
  outlineId: number,
  data: {
    proposedBudget: number;
    note?: string | null;
    sendToTc?: boolean;
    largeBudgetCouncilDone?: boolean;
    largeBudgetCouncilNote?: string | null;
    largeBudgetMinutesUrl?: string | null;
    expectedVersion?: number;
  },
): Promise<ApiResponse<BudgetConfirmation>> {
  return post(`/api/project-outline-budgets/${outlineId}/pkh-propose`, data);
}

export async function tcBudgetAction(
  outlineId: number,
  data: {
    action: 'CONFIRM' | 'RETURN';
    confirmedBudget?: number | null;
    note?: string | null;
    returnReason?: string | null;
    expectedVersion?: number;
  },
): Promise<ApiResponse<BudgetConfirmation>> {
  return post(`/api/project-outline-budgets/${outlineId}/tc-action`, data);
}

export async function ldBudgetDecide(
  outlineId: number,
  data: {
    decision: 'APPROVE' | 'REJECT' | 'RETURN';
    note?: string | null;
    rejectReason?: string | null;
    returnTarget?: 'PKH' | 'TC';
    expectedVersion?: number;
  },
): Promise<ApiResponse<BudgetConfirmation>> {
  return post(`/api/project-outline-budgets/${outlineId}/ld-decide`, data);
}
