/**
 * API hỗ trợ chọn người phản biện / thẩm định — dùng chung defenses & triển khai.
 * Các API chỉ phục vụ màn phân công phản biện kín đã gỡ tạm.
 */
import { get, ApiResponse } from '../request';

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

export async function getAvailableOutlineReviewers(
  outlineId: number,
  keyword?: string,
): Promise<ApiResponse<AvailableReviewer[]>> {
  return get(`/api/project-outlines/${outlineId}/available-reviewers`, { keyword });
}
