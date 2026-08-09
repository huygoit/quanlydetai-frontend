/**
 * API phân công phản biện kín (US-04-02)
 */
import { get, post, ApiResponse } from '../request';
import type { ProjectOutline } from './projectOutlines';

export type OutlineReviewAssignmentStatus =
  | 'INVITED'
  | 'ACTIVE'
  | 'CANCELLED'
  | 'COMPLETED';

export type OutlineReviewAssignment = {
  id: number;
  projectOutlineId?: number;
  reviewerUserId?: number | null;
  scientificProfileId?: number | null;
  reviewerName: string;
  reviewerEmail?: string | null;
  isExternal: boolean;
  status: OutlineReviewAssignmentStatus;
  deadlineAt?: string | null;
  assignedAt?: string | null;
  cancelReason?: string | null;
  workloadOverrideReason?: string | null;
  expertiseExceptionReason?: string | null;
};

export type AvailableReviewer = {
  scientificProfileId: number;
  reviewerUserId: number | null;
  reviewerName: string;
  reviewerEmail?: string | null;
  degree?: string | null;
  academicTitle?: string | null;
  unit?: string | null;
  isExternal: boolean;
  activeAssignmentsThisMonth: number;
  workloadWarning: boolean;
};

export type AssignReviewerPayload = {
  reviewerUserId?: number | null;
  scientificProfileId?: number | null;
  reviewerName: string;
  reviewerEmail?: string | null;
  isExternal?: boolean;
  expertiseExceptionReason?: string | null;
  workloadOverrideReason?: string | null;
};

export async function listPendingOutlineReviews(): Promise<ApiResponse<ProjectOutline[]>> {
  return get('/api/project-outlines/pending-review');
}

export async function listUnderOutlineReviews(): Promise<
  ApiResponse<Array<ProjectOutline & { assignments: OutlineReviewAssignment[] }>>
> {
  return get('/api/project-outlines/under-review');
}

export async function getAvailableOutlineReviewers(
  outlineId: number,
  keyword?: string,
): Promise<ApiResponse<AvailableReviewer[]>> {
  return get(`/api/project-outlines/${outlineId}/available-reviewers`, { keyword });
}

export async function getOutlineReviewAssignments(
  outlineId: number,
): Promise<ApiResponse<OutlineReviewAssignment[]>> {
  return get(`/api/project-outlines/${outlineId}/review-assignments`);
}

export async function assignOutlineReviewers(
  outlineId: number,
  data: {
    reviewers: AssignReviewerPayload[];
    deadlineAt?: string | null;
    businessDays?: number | null;
    reviewerCountTarget?: number;
  },
): Promise<
  ApiResponse<{
    outline: ProjectOutline;
    assignments: OutlineReviewAssignment[];
    warnings: string[];
  }>
> {
  return post(`/api/project-outlines/${outlineId}/assign-reviewers`, data);
}

export async function replaceOutlineReviewer(
  outlineId: number,
  data: {
    assignmentId: number;
    reason: string;
    reviewer: AssignReviewerPayload;
    deadlineAt?: string | null;
    businessDays?: number | null;
    workloadOverrideReason?: string | null;
  },
): Promise<ApiResponse<{ cancelled: OutlineReviewAssignment; created: OutlineReviewAssignment }>> {
  return post(`/api/project-outlines/${outlineId}/replace-reviewer`, data);
}
