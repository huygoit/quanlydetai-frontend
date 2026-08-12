/**
 * Options select dùng chung cho ý tưởng / đề xuất / đề tài:
 * đơn vị (departments), lĩnh vực (fields),
 * cấp ý tưởng/đề tài (project_process_types QT-I…QT-V).
 */
import { getCatalogByType, type CatalogOption } from '@/services/api/catalogs';
import { getDepartmentCatalogOptions } from '@/services/api/departments';
import { getFieldOptions } from '@/services/api/fields';
import { getProjectProcessTypeOptions } from '@/services/api/projectProcessTypes';

export type SelectOption = { label: string; value: string };

export type LevelMeta = { text: string; color: string };

/** Màu hiển thị theo mã QT (danh mục Cấp ý tưởng/đề tài). */
const PROCESS_TYPE_COLORS: Record<string, string> = {
  'QT-I': 'blue',
  'QT-II': 'purple',
  'QT-III': 'orange',
  'QT-IV': 'magenta',
  'QT-V': 'cyan',
};

/** Fallback mã IDEA_LEVEL cũ (dữ liệu lịch sử). */
const LEGACY_IDEA_LEVEL_COLORS: Record<string, string> = {
  TRUONG_THUONG_NIEN: 'blue',
  TRUONG_DAT_HANG: 'cyan',
  DAI_HOC_DA_NANG: 'geekblue',
  BO_GDDT: 'purple',
  NHA_NUOC: 'magenta',
  NAFOSTED: 'volcano',
  TINH_THANH_PHO: 'orange',
  DOANH_NGHIEP: 'gold',
};

const PROJECT_LEVEL_COLORS: Record<string, string> = {
  CO_SO: 'default',
  TRUONG: 'blue',
  BO: 'purple',
  NHA_NUOC: 'magenta',
};

function sapXepTheoLabel(a: SelectOption, b: SelectOption) {
  return a.label.localeCompare(b.label, 'vi');
}

/** Lĩnh vực từ bảng fields (danh mục chính). */
export async function loadFieldSelectOptions(): Promise<SelectOption[]> {
  try {
    const res = await getFieldOptions({ status: 'ACTIVE' });
    const rows = res.data ?? [];
    return rows
      .map((f) => ({ label: f.name, value: f.name }))
      .sort(sapXepTheoLabel);
  } catch {
    return [];
  }
}

/** Đơn vị từ bảng departments (khoa/phòng ban). */
export async function loadDepartmentSelectOptions(): Promise<SelectOption[]> {
  try {
    const res = await getDepartmentCatalogOptions({
      scope: 'khoa_phong_ban',
      status: 'ACTIVE',
    });
    const rows = res.data ?? [];
    return rows
      .map((d) => ({ label: d.name, value: d.name }))
      .sort(sapXepTheoLabel);
  } catch {
    return [];
  }
}

function mapLevelOptions(
  rows: CatalogOption[],
  colorMap: Record<string, string>,
): { options: SelectOption[]; meta: Record<string, LevelMeta> } {
  const options: SelectOption[] = [];
  const meta: Record<string, LevelMeta> = {};
  for (const row of rows) {
    options.push({ label: row.name, value: row.code });
    meta[row.code] = {
      text: row.name,
      color: colorMap[row.code] || 'blue',
    };
  }
  return { options, meta };
}

/**
 * Cấp ý tưởng/đề tài — cùng danh mục với đề xuất (project_process_types).
 * value = mã QT (QT-I…QT-V) lưu vào suitableLevels.
 */
export async function loadIdeaLevelOptions(): Promise<{
  options: SelectOption[];
  meta: Record<string, LevelMeta>;
}> {
  try {
    const res = await getProjectProcessTypeOptions({ status: 'ACTIVE' });
    const rows = res.data ?? [];
    const options: SelectOption[] = [];
    const meta: Record<string, LevelMeta> = {};
    for (const row of rows) {
      const label = `${row.code} — ${row.name}`;
      options.push({ label, value: row.code });
      meta[row.code] = {
        text: label,
        color: PROCESS_TYPE_COLORS[row.code] || 'blue',
      };
    }
    return { options, meta };
  } catch {
    return { options: [], meta: {} };
  }
}

/** Cấp nội bộ CFP (CO_SO/TRUONG/…) từ catalogs PROJECT_LEVEL — dùng hiển thị phụ. */
export async function loadProjectLevelOptions(): Promise<{
  options: SelectOption[];
  meta: Record<string, LevelMeta>;
}> {
  try {
    const res = await getCatalogByType('PROJECT_LEVEL');
    return mapLevelOptions(res.data ?? [], PROJECT_LEVEL_COLORS);
  } catch {
    return { options: [], meta: {} };
  }
}

/** Nhãn cấp: ưu tiên meta từ danh mục, fallback mã + màu cố định. */
export function labelLevel(
  code: string,
  meta?: Record<string, LevelMeta>,
): LevelMeta {
  if (meta?.[code]) return meta[code];
  return {
    text: code,
    color:
      PROCESS_TYPE_COLORS[code] ||
      LEGACY_IDEA_LEVEL_COLORS[code] ||
      PROJECT_LEVEL_COLORS[code] ||
      'blue',
  };
}
