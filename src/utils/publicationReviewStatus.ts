/** Trạng thái duyệt kết quả NCKH */
export type PublicationReviewStatus =
  | 'NEW'
  | 'CORRECTION_REQUESTED'
  | 'CORRECTED'
  | 'APPROVED';

export const PUBLICATION_REVIEW_STATUS_MAP: Record<
  PublicationReviewStatus,
  { text: string; color: string }
> = {
  NEW: { text: 'Mới', color: 'default' },
  CORRECTION_REQUESTED: { text: 'Yêu cầu hiệu chỉnh', color: 'warning' },
  CORRECTED: { text: 'Đã hiệu chỉnh', color: 'processing' },
  APPROVED: { text: 'Đã duyệt', color: 'success' },
};

export const PUBLICATION_REVIEW_STATUS_OPTIONS = (
  Object.keys(PUBLICATION_REVIEW_STATUS_MAP) as PublicationReviewStatus[]
).map((value) => ({
  value,
  label: PUBLICATION_REVIEW_STATUS_MAP[value].text,
}));
