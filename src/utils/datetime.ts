/**
 * Chuẩn hiển thị ngày/giờ toàn dự án.
 * - Ngày: DD/MM/YYYY
 * - Ngày giờ: HH:mm DD/MM/YYYY (giờ trước, ngày sau)
 */
import dayjs, { type ConfigType } from 'dayjs';

/** Chỉ ngày (hạn nộp, kỳ, … không kèm giờ) */
export const DATE_FORMAT = 'DD/MM/YYYY';

/** Ngày giờ chuẩn — dùng mọi chỗ có thời điểm */
export const DATETIME_FORMAT = 'HH:mm DD/MM/YYYY';

/** Format Ant Design DatePicker/TimePicker (có giờ) */
export const DATETIME_PICKER_FORMAT = DATETIME_FORMAT;

/** Format Ant Design DatePicker (chỉ ngày) */
export const DATE_PICKER_FORMAT = DATE_FORMAT;

export function formatDate(
  value?: ConfigType | null,
  empty: string = '—',
): string {
  if (value === null || value === undefined || value === '') return empty;
  const d = dayjs(value);
  return d.isValid() ? d.format(DATE_FORMAT) : empty;
}

export function formatDateTime(
  value?: ConfigType | null,
  empty: string = '—',
): string {
  if (value === null || value === undefined || value === '') return empty;
  const d = dayjs(value);
  return d.isValid() ? d.format(DATETIME_FORMAT) : empty;
}
