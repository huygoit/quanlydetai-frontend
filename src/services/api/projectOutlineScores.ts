/**
 * API phiếu chấm phản biện kín (US-04-03)
 */
import { get, put, post, ApiResponse } from '../request';
import type { ProjectOutline } from './projectOutlines';
import type { OutlineReviewAssignment } from './projectOutlineReviews';

export type ReviewScoreLine = {
  id?: number;
  criterionCode: string;
  criterionName: string;
  maxScore: number;
  weight: number;
  sortOrder: number;
  commentRequired: boolean;
  score: number | null;
  comment: string | null;
};

export type ReviewScoreSheet = {
  id: number;
  assignmentId: number;
  projectOutlineId: number;
  status: 'DRAFT' | 'SUBMITTED';
  totalScore: number | null;
  generalComment: string | null;
  conclusion: string | null;
  submittedAt?: string | null;
  reopenedAt?: string | null;
  reopenReason?: string | null;
  editable: boolean;
  criteriaSnapshot?: {
    setName?: string;
    failThreshold?: number;
    blindAggregation?: boolean;
    minCommentLength?: number;
  };
  lines: ReviewScoreLine[];
};

export type ReviewScoreTaskItem = {
  assignment: OutlineReviewAssignment;
  outline: {
    id: number;
    code: string;
    title: string;
    status: string;
    ownerName?: string | null;
    ownerUnit?: string | null;
    field?: string | null;
  } | null;
  scoreSheetStatus: 'DRAFT' | 'SUBMITTED' | null;
  totalScore: number | null;
  pastDeadline: boolean;
};

export type ReviewScoreTaskDetail = {
  assignment: OutlineReviewAssignment;
  outline: ProjectOutline;
  scoreSheet: ReviewScoreSheet | null;
  pastDeadline: boolean;
  isReviewer: boolean;
  isPkh: boolean;
};

export type ScoreLineInput = {
  criterionCode: string;
  score?: number | null;
  comment?: string | null;
};

export async function listMyOutlineReviewTasks(): Promise<ApiResponse<ReviewScoreTaskItem[]>> {
  return get('/api/project-outline-review-tasks');
}

export async function getOutlineReviewTask(
  assignmentId: number,
): Promise<ApiResponse<ReviewScoreTaskDetail>> {
  return get(`/api/project-outline-review-tasks/${assignmentId}`);
}

export async function saveOutlineReviewScoreDraft(
  assignmentId: number,
  data: {
    generalComment?: string | null;
    conclusion?: string | null;
    lines?: ScoreLineInput[];
  },
): Promise<ApiResponse<ReviewScoreSheet>> {
  return put(`/api/project-outline-review-tasks/${assignmentId}/score-draft`, data);
}

export async function submitOutlineReviewScore(
  assignmentId: number,
  data: {
    generalComment?: string | null;
    conclusion?: string | null;
    lines: ScoreLineInput[];
  },
): Promise<ApiResponse<ReviewScoreSheet>> {
  return post(`/api/project-outline-review-tasks/${assignmentId}/score-submit`, data);
}

export async function reopenOutlineReviewScore(
  assignmentId: number,
  reason: string,
): Promise<ApiResponse<ReviewScoreSheet>> {
  return post(`/api/project-outline-review-tasks/${assignmentId}/score-reopen`, { reason });
}

export async function extendOutlineReviewDeadline(
  assignmentId: number,
  data: { deadlineAt: string; reason?: string | null },
): Promise<ApiResponse<OutlineReviewAssignment>> {
  return post(`/api/project-outline-review-tasks/${assignmentId}/extend-deadline`, data);
}

export async function getOutlineReviewScoreSummary(outlineId: number): Promise<
  ApiResponse<{
    outlineId: number;
    code: string;
    averageScore: number | null;
    belowThreshold: boolean | null;
    completedAt: string | null;
    blindAggregation: boolean;
    assignments: Array<{
      assignment: OutlineReviewAssignment;
      scoreSheet: ReviewScoreSheet | null;
    }>;
  }>
> {
  return get(`/api/project-outlines/${outlineId}/review-score-summary`);
}
