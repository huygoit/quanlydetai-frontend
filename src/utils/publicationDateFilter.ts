import dayjs, { type Dayjs } from 'dayjs';
import { layPublishedAtTuApi, type PublicationDateFields } from '@/utils/publicationDate';

/** Tháng bắt đầu năm tài chính (mặc định 4 = 01/04 → 31/03 năm sau). */
export const THANG_BAT_DAU_NAM_TAI_CHINH = 4;

export type PublicationFilterPreset =
  | 'all'
  | 'month_this'
  | 'month_prev'
  | 'q1'
  | 'q2'
  | 'q3'
  | 'q4'
  | 'year'
  | 'fiscal_year'
  | 'custom';

/** Preset cho bộ lọc tổng giờ/điểm trên header (không có «Tất cả»). */
export const PRESET_LOC_CHI_SO_NCKH: { value: PublicationFilterPreset; label: string }[] = [
  { value: 'fiscal_year', label: 'Năm tài chính' },
  { value: 'year', label: 'Cả năm dương lịch' },
  { value: 'q1', label: 'Quý 1 (T1–T3)' },
  { value: 'q2', label: 'Quý 2 (T4–T6)' },
  { value: 'q3', label: 'Quý 3 (T7–T9)' },
  { value: 'q4', label: 'Quý 4 (T10–T12)' },
  { value: 'month_this', label: 'Tháng này' },
  { value: 'month_prev', label: 'Tháng trước' },
  { value: 'custom', label: 'Tùy chọn ngày' },
];

/** Năm gắn nhãn «Năm TC Y» — tháng 1–3 thuộc năm TC (Y-1). */
export function namThamChieuNamTaiChinh(ref = dayjs()): number {
  const m = ref.month() + 1;
  if (m >= THANG_BAT_DAU_NAM_TAI_CHINH) return ref.year();
  return ref.year() - 1;
}

/** Khoảng mặc định khi mở hồ sơ: năm tài chính hiện tại. */
export function khoangMacDinhChiSoNckh(): [Dayjs, Dayjs] {
  const refYear = namThamChieuNamTaiChinh();
  return khoangNgayTheoPreset('fiscal_year', refYear) as [Dayjs, Dayjs];
}

export const PRESET_LOC_KQNC: { value: PublicationFilterPreset; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'month_this', label: 'Tháng này' },
  { value: 'month_prev', label: 'Tháng trước' },
  { value: 'q1', label: 'Quý 1 (T1–T3)' },
  { value: 'q2', label: 'Quý 2 (T4–T6)' },
  { value: 'q3', label: 'Quý 3 (T7–T9)' },
  { value: 'q4', label: 'Quý 4 (T10–T12)' },
  { value: 'year', label: 'Cả năm dương lịch' },
  { value: 'fiscal_year', label: 'Năm tài chính' },
  { value: 'custom', label: 'Tùy chọn (khoảng ngày)' },
];

const PRESET_CAN_NAM: PublicationFilterPreset[] = ['q1', 'q2', 'q3', 'q4', 'year', 'fiscal_year'];

export function presetCanChonNam(preset: PublicationFilterPreset): boolean {
  return PRESET_CAN_NAM.includes(preset);
}

/** Khoảng ngày [đầu, cuối] theo preset; `refYear` dùng cho quý / năm / năm TC. */
export function khoangNgayTheoPreset(
  preset: PublicationFilterPreset,
  refYear = dayjs().year(),
): [Dayjs, Dayjs] | null {
  const now = dayjs();
  const y = refYear;
  switch (preset) {
    case 'month_this':
      return [now.startOf('month'), now.endOf('month')];
    case 'month_prev': {
      const prev = now.subtract(1, 'month');
      return [prev.startOf('month'), prev.endOf('month')];
    }
    case 'q1':
      return [dayjs(`${y}-01-01`), dayjs(`${y}-03-31`)];
    case 'q2':
      return [dayjs(`${y}-04-01`), dayjs(`${y}-06-30`)];
    case 'q3':
      return [dayjs(`${y}-07-01`), dayjs(`${y}-09-30`)];
    case 'q4':
      return [dayjs(`${y}-10-01`), dayjs(`${y}-12-31`)];
    case 'year':
      return [dayjs(`${y}-01-01`), dayjs(`${y}-12-31`)];
    case 'fiscal_year': {
      const mm = String(THANG_BAT_DAU_NAM_TAI_CHINH).padStart(2, '0');
      const start = dayjs(`${y}-${mm}-01`);
      return [start, start.add(1, 'year').subtract(1, 'day')];
    }
    default:
      return null;
  }
}

export function publicationTrongKhoangNgay(
  pub: PublicationDateFields,
  from: Dayjs | null | undefined,
  to: Dayjs | null | undefined,
): boolean {
  if (!from && !to) return true;
  const iso = layPublishedAtTuApi(pub);
  if (!iso) return false;
  const d = dayjs(iso);
  if (!d.isValid()) return false;
  if (from && d.isBefore(from.startOf('day'))) return false;
  if (to && d.isAfter(to.endOf('day'))) return false;
  return true;
}

/** Chỉ coi là đang lọc khi đủ cả từ ngày và đến ngày. */
export function coBoLocNgayDangBat(from?: Dayjs | null, to?: Dayjs | null): boolean {
  return Boolean(from && to && from.isValid() && to.isValid());
}

/** Năm gợi ý cho Select (từ dữ liệu + năm hiện tại). */
export function layDanhSachNamLoc(publications: PublicationDateFields[]): number[] {
  const set = new Set<number>();
  set.add(dayjs().year());
  for (const p of publications) {
    const iso = layPublishedAtTuApi(p);
    if (iso) set.add(dayjs(iso).year());
    else if (p.year != null && Number.isFinite(Number(p.year))) set.add(Number(p.year));
  }
  return [...set].sort((a, b) => b - a);
}

export function moTaKhoangLoc(from?: Dayjs | null, to?: Dayjs | null): string | null {
  if (!from && !to) return null;
  const a = from ? from.format('DD/MM/YYYY') : '…';
  const b = to ? to.format('DD/MM/YYYY') : '…';
  return `${a} – ${b}`;
}
