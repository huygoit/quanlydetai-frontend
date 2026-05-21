/**
 * Key tiếng Anh — đồng bộ BE catalog + validate PUT /api/profile/me
 * Label tiếng Việt chỉ dùng hiển thị (API catalog hoặc map dưới đây).
 */

export type DegreeKey = 'HIGH_SCHOOL' | 'BACHELOR' | 'MASTER' | 'DOCTORATE';

export type AcademicTitleKey = 'NONE' | 'ASSOCIATE_PROFESSOR' | 'PROFESSOR';

/** Map giá trị tiếng Việt cũ (hoặc gõ nhầm) → key BE */
export const LEGACY_DEGREE_TO_KEY: Record<string, DegreeKey> = {
  'Tú tài': 'HIGH_SCHOOL',
  'Cử nhân': 'BACHELOR',
  'Thạc sĩ': 'MASTER',
  'Tiến sĩ': 'DOCTORATE',
  'Tiến sỹ': 'DOCTORATE',
  Khác: 'BACHELOR',
};

export const LEGACY_ACADEMIC_TITLE_TO_KEY: Record<string, AcademicTitleKey> = {
  Không: 'NONE',
  PGS: 'ASSOCIATE_PROFESSOR',
  GS: 'PROFESSOR',
};

/** Năm nhận học vị / năm đạt học hàm — khớp validator BE */
export const NAM_NHAN_BANG_TOI_THIEU = 1900;

export const layNamNhanBangToiDa = (): number => new Date().getFullYear() + 1;

/** @deprecated Dùng NAM_NHAN_BANG_TOI_THIEU */
export const NAM_HOC_HAM_TOI_THIEU = NAM_NHAN_BANG_TOI_THIEU;

/** @deprecated Dùng layNamNhanBangToiDa */
export const layNamHocHamToiDa = layNamNhanBangToiDa;

/** Fallback khi chưa gọi được catalog API */
export const FALLBACK_DEGREE_CATALOG: {
  value: DegreeKey;
  label: string;
  description: string;
  displayOrder: number;
}[] = [
  {
    value: 'HIGH_SCHOOL',
    label: 'Tú tài',
    description: 'Tốt nghiệp Trung học Phổ thông.',
    displayOrder: 1,
  },
  {
    value: 'BACHELOR',
    label: 'Cử nhân',
    description:
      'Tốt nghiệp đại học các khối ngành kinh tế, luật, xã hội và các ngành tương đương.',
    displayOrder: 2,
  },
  {
    value: 'MASTER',
    label: 'Thạc sĩ',
    description: 'Tốt nghiệp trình độ cao học.',
    displayOrder: 3,
  },
  {
    value: 'DOCTORATE',
    label: 'Tiến sĩ',
    description:
      'Trình độ học vị nghiên cứu chuyên sâu, được cấp sau khi bảo vệ thành công luận án tiến sĩ.',
    displayOrder: 4,
  },
];

export const FALLBACK_ACADEMIC_TITLE_CATALOG: {
  value: AcademicTitleKey;
  label: string;
  displayOrder: number;
}[] = [
  { value: 'NONE', label: 'Không', displayOrder: 1 },
  { value: 'ASSOCIATE_PROFESSOR', label: 'PGS', displayOrder: 2 },
  { value: 'PROFESSOR', label: 'GS', displayOrder: 3 },
];

export const DEGREE_KEY_LABEL_MAP = Object.fromEntries(
  FALLBACK_DEGREE_CATALOG.map((d) => [d.value, d.label]),
) as Record<DegreeKey, string>;

export const ACADEMIC_TITLE_KEY_LABEL_MAP = Object.fromEntries(
  FALLBACK_ACADEMIC_TITLE_CATALOG.map((d) => [d.value, d.label]),
) as Record<AcademicTitleKey, string>;
