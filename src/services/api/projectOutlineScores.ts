/**
 * Kiểu phiếu chấm BM-02.09 — dùng chung phiếu thẩm định (BM.05a).
 * API nhiệm vụ phản biện kín đã gỡ tạm cùng menu rác.
 */
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
