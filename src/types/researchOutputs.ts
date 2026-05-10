/**
 * Research Output Types - Type Definitions
 * Quản lý loại kết quả NCKH
 */

export type RuleKind =
  | 'FIXED'
  | 'MULTIPLY_A'
  | 'HDGSNN_POINTS_TO_HOURS'
  | 'MULTIPLY_C'
  | 'RANGE_REVENUE'
  | 'BONUS_ADD';

/** QĐ 1883: phạm vi tập tác giả khi tính hệ số a (cấu hình trên node lá trong danh mục). */
export type PhamViHeSoA1883 = 'authors' | 'chiTacGiaChinh';

export const PHAM_VI_HE_SO_A_1883_LABELS: Record<PhamViHeSoA1883, string> = {
  chiTacGiaChinh: 'Nhóm tác giả chính (đầu ∪ liên hệ) — mục 1–2',
  authors: 'Toàn bộ tác giả — mục 3',
};

export const PHAM_VI_HE_SO_A_1883_OPTIONS = (
  Object.entries(PHAM_VI_HE_SO_A_1883_LABELS) as Array<[PhamViHeSoA1883, string]>
).map(([value, label]) => ({ value, label }));

export interface ResearchOutputTypeNode {
  id: number;
  code: string;
  name: string;
  level: 1 | 2 | 3;
  sortOrder: number;
  isActive: boolean;
  hasRule: boolean;
  /** Từ API admin tree: loại rule của lá (nếu có). */
  ruleKind?: string | null;
  /** QĐ 1883: phạm vi tính hệ số a (thường cấu hình tại mục lá). */
  phamViHeSoA1883?: PhamViHeSoA1883 | null;
  children: ResearchOutputTypeNode[];
}

export interface ResearchOutputTypeDTO {
  id: number;
  code: string;
  name: string;
  level: 1 | 2 | 3;
  sortOrder: number;
  isActive: boolean;
  hasRule: boolean;
  parentId: number | null;
  phamViHeSoA1883?: PhamViHeSoA1883 | null;
}

export interface CreateTypePayload {
  code: string;
  name: string;
  level: 1 | 2 | 3;
  sortOrder?: number;
  isActive?: boolean;
  parentId: number | null;
  phamViHeSoA1883?: PhamViHeSoA1883 | null;
}

export interface UpdateTypePayload {
  code?: string;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
  phamViHeSoA1883?: PhamViHeSoA1883 | null;
}

export interface MoveTypePayload {
  newParentId: number | null;
  newSortOrder: number;
}

export interface RangeItem {
  min: number;
  max: number | null;
  points: number;
  hours: number;
}

export interface CMapItem {
  EXCELLENT: number;
  PASS_ON_TIME: number;
  PASS_LATE: number;
}

export interface RuleMeta {
  hours_per_point?: number;
  c_map?: CMapItem;
  ranges?: RangeItem[];
  [key: string]: any;
}

export interface RuleDTO {
  id: number;
  typeId: number;
  ruleKind: RuleKind;
  pointsValue?: number;
  hoursValue?: number;
  hoursMultiplierVar?: string;
  hoursBonus?: number;
  meta: RuleMeta;
  evidenceRequirements?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertRulePayload {
  ruleKind: RuleKind;
  pointsValue?: number;
  hoursValue?: number;
  hoursMultiplierVar?: string;
  hoursBonus?: number;
  meta?: RuleMeta;
  evidenceRequirements?: string;
}

/**
 * Nhãn hiển thị admin — khớp `research_output_rules.rule_kind` & engine QĐ 1883.
 * RANGE_REVENUE / BONUS_ADD vẫn được lưu DB; seeder mẫu chưa tạo lá dùng 2 loại này.
 */
export const RULE_KIND_LABELS: Record<RuleKind, string> = {
  FIXED: 'Cố định (điểm + giờ theo bảng)',
  MULTIPLY_A: 'Nhân hệ số a',
  HDGSNN_POINTS_TO_HOURS: 'HĐGSNN: điểm → giờ (600 giờ/điểm)',
  MULTIPLY_C: 'Nhân hệ số c (nghiệm thu đề tài)',
  RANGE_REVENUE: 'Doanh thu — theo dải (CGCN / không áp bài báo)',
  BONUS_ADD: 'Cộng thưởng giờ (giờ cơ sở + giờ thưởng)',
};

export const RULE_KIND_OPTIONS = Object.entries(RULE_KIND_LABELS).map(([value, label]) => ({
  value,
  label,
}));
