import {
  ACADEMIC_TITLE_KEY_LABEL_MAP,
  DEGREE_KEY_LABEL_MAP,
  FALLBACK_ACADEMIC_TITLE_CATALOG,
  FALLBACK_DEGREE_CATALOG,
  LEGACY_ACADEMIC_TITLE_TO_KEY,
  LEGACY_DEGREE_TO_KEY,
  type AcademicTitleKey,
  type DegreeKey,
} from '@/constants/scientificProfileCatalog';
import { getScientificProfileCatalogOptions, type ProfileCatalogOption } from '@/services/api/profileCatalog';
import type { ScientificProfile } from '@/services/api/profile';

export type HocViHocHamSelectOption = { value: string; label: string; title?: string };

const sapXepCatalog = (a: ProfileCatalogOption, b: ProfileCatalogOption) =>
  (a.displayOrder ?? 0) - (b.displayOrder ?? 0) ||
  a.label.localeCompare(b.label, 'vi');

export function mapDegreesToSelectOptions(items: ProfileCatalogOption[]): HocViHocHamSelectOption[] {
  return [...items].sort(sapXepCatalog).map((d) => ({
    value: d.value,
    label: d.label,
    title: d.description,
  }));
}

export function mapAcademicTitlesToSelectOptions(
  items: ProfileCatalogOption[],
): HocViHocHamSelectOption[] {
  return [...items].sort(sapXepCatalog).map((d) => ({
    value: d.value,
    label: d.label,
    title: d.description,
  }));
}

function fallbackDegreeOptions(): HocViHocHamSelectOption[] {
  return FALLBACK_DEGREE_CATALOG.map((d) => ({
    value: d.value,
    label: d.label,
    title: d.description,
  }));
}

function fallbackAcademicTitleOptions(): HocViHocHamSelectOption[] {
  return FALLBACK_ACADEMIC_TITLE_CATALOG.map((d) => ({
    value: d.value,
    label: d.label,
  }));
}

/** Chuẩn hóa giá trị cũ (tiếng Việt) → key tiếng Anh. */
export function chuanHoaDegreeKey(raw?: string | null): string | undefined {
  const s = raw?.trim();
  if (!s) return undefined;
  if (LEGACY_DEGREE_TO_KEY[s]) return LEGACY_DEGREE_TO_KEY[s];
  if (s in DEGREE_KEY_LABEL_MAP) return s;
  return s;
}

export function chuanHoaAcademicTitleKey(raw?: string | null): string | undefined {
  const s = raw?.trim();
  if (!s) return undefined;
  if (LEGACY_ACADEMIC_TITLE_TO_KEY[s]) return LEGACY_ACADEMIC_TITLE_TO_KEY[s];
  if (s in ACADEMIC_TITLE_KEY_LABEL_MAP) return s;
  return s;
}

/** Học hàm có hiển thị tag (không phải NONE / Không). */
export function coHienThiHocHam(academicTitle?: string | null): boolean {
  const key = chuanHoaAcademicTitleKey(academicTitle);
  return !!key && key !== 'NONE';
}

/** Nhãn tiếng Việt từ key + catalog (hoặc fallback map). */
export function nhanNhanTuCatalog(
  options: HocViHocHamSelectOption[],
  rawValue?: string | null,
  fallbackMap?: Record<string, string>,
): string | undefined {
  const raw = rawValue?.trim();
  if (!raw) return undefined;

  const key = chuanHoaDegreeKey(raw) ?? chuanHoaAcademicTitleKey(raw) ?? raw;
  const tuCatalog = options.find((o) => o.value === key || o.value === raw);
  if (tuCatalog) return tuCatalog.label;

  if (fallbackMap?.[key]) return fallbackMap[key];
  if (LEGACY_DEGREE_TO_KEY[raw]) {
    return DEGREE_KEY_LABEL_MAP[LEGACY_DEGREE_TO_KEY[raw]];
  }
  if (LEGACY_ACADEMIC_TITLE_TO_KEY[raw]) {
    return ACADEMIC_TITLE_KEY_LABEL_MAP[LEGACY_ACADEMIC_TITLE_TO_KEY[raw]];
  }

  return raw;
}

export function nhanNhanHocVi(
  options: HocViHocHamSelectOption[],
  degree?: string | null,
): string | undefined {
  return nhanNhanTuCatalog(options, degree, DEGREE_KEY_LABEL_MAP);
}

export function nhanNhanHocHam(
  options: HocViHocHamSelectOption[],
  academicTitle?: string | null,
): string | undefined {
  return nhanNhanTuCatalog(options, academicTitle, ACADEMIC_TITLE_KEY_LABEL_MAP);
}

/** Chuẩn hóa field catalog trên hồ sơ sau GET (map dữ liệu Việt cũ → key). */
export function chuanHoaProfileCatalogFields<T extends Partial<ScientificProfile>>(profile: T): T {
  const raw = profile as T & {
    academic_title_year?: number | null;
    education_records?: ScientificProfile['educationRecords'];
    training_courses?: ScientificProfile['trainingCourses'];
  };
  const academicTitleYear =
    profile.academicTitleYear ?? raw.academic_title_year ?? undefined;

  let academicTitle = profile.academicTitle;
  if (academicTitle) {
    academicTitle = chuanHoaAcademicTitleKey(academicTitle) as T['academicTitle'];
  }

  const namHocHam =
    academicTitleYear != null && !Number.isNaN(Number(academicTitleYear))
      ? Number(academicTitleYear)
      : undefined;

  return {
    ...profile,
    degree: profile.degree
      ? (chuanHoaDegreeKey(profile.degree) as T['degree'])
      : profile.degree,
    academicTitle,
    academicTitleYear: coHienThiHocHam(academicTitle) ? namHocHam : null,
    educationRecords: profile.educationRecords ?? raw.education_records ?? [],
    trainingCourses: profile.trainingCourses ?? raw.training_courses ?? [],
  };
}

/** Chuẩn hóa response GET profile (camelCase + snake_case). */
export function chuanHoaProfileTuApi<T extends Partial<ScientificProfile>>(profile: T): T {
  return chuanHoaProfileCatalogFields(profile);
}

/** Trước PUT — NONE thì xóa academicTitleYear. */
export function chuanHoaPayloadTruocKhiLuuProfile(
  values: Record<string, unknown>,
): Record<string, unknown> {
  const academicTitle = values.academicTitle
    ? chuanHoaAcademicTitleKey(String(values.academicTitle))
    : values.academicTitle;

  const payload: Record<string, unknown> = {
    ...values,
    academicTitle,
  };

  if (!payload.degree) {
    payload.degreeYear = null;
  } else if (payload.degreeYear === '' || payload.degreeYear === undefined) {
    payload.degreeYear = null;
  }

  if (!coHienThiHocHam(academicTitle as string | undefined)) {
    payload.academicTitleYear = null;
  } else if (
    payload.academicTitleYear === '' ||
    payload.academicTitleYear === undefined
  ) {
    payload.academicTitleYear = null;
  }

  return payload;
}

export type KetQuaTaiCatalogHocViHocHam = {
  degreeOptions: HocViHocHamSelectOption[];
  academicTitleOptions: HocViHocHamSelectOption[];
  tuApi: boolean;
  ghiChu?: string;
};

/**
 * Tải học vị + học hàm — GET /api/catalog/scientific-profile/options
 * `value` = key tiếng Anh, `label` = tiếng Việt.
 */
export async function loadScientificProfileCatalogOptions(): Promise<KetQuaTaiCatalogHocViHocHam> {
  try {
    const res = await getScientificProfileCatalogOptions();
    const degrees = res.data?.degrees ?? [];
    const academicTitles = res.data?.academicTitles ?? [];

    if (degrees.length > 0 && academicTitles.length > 0) {
      return {
        degreeOptions: mapDegreesToSelectOptions(degrees),
        academicTitleOptions: mapAcademicTitlesToSelectOptions(academicTitles),
        tuApi: true,
      };
    }

    return {
      degreeOptions: fallbackDegreeOptions(),
      academicTitleOptions: fallbackAcademicTitleOptions(),
      tuApi: false,
      ghiChu: 'API catalog trả rỗng — đang dùng danh mục tạm trên FE.',
    };
  } catch {
    return {
      degreeOptions: fallbackDegreeOptions(),
      academicTitleOptions: fallbackAcademicTitleOptions(),
      tuApi: false,
      ghiChu:
        'Chưa gọi được catalog học vị/học hàm. Kiểm tra GET /api/catalog/scientific-profile/options.',
    };
  }
}

/** Thêm giá trị đang lưu nếu chưa có trong danh mục (key lạ / dữ liệu cũ). */
export function gopGiaTriHocViHienCo(
  options: HocViHocHamSelectOption[],
  giaTriHienTai?: string | null,
  chuanHoaKey?: (raw?: string | null) => string | undefined,
): HocViHocHamSelectOption[] {
  const raw = giaTriHienTai?.trim();
  if (!raw) return options;

  const key = chuanHoaKey?.(raw) ?? raw;
  if (options.some((o) => o.value === key || o.value === raw)) {
    return options;
  }

  const label =
    nhanNhanTuCatalog(options, raw) ??
    DEGREE_KEY_LABEL_MAP[key as DegreeKey] ??
    ACADEMIC_TITLE_KEY_LABEL_MAP[key as AcademicTitleKey] ??
    raw;

  return [
    {
      label: `${label} (chưa có trong danh mục)`,
      value: key,
      title: 'Giá trị cũ — nên chọn lại theo danh mục',
    },
    ...options,
  ];
}
