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

export interface ResearchOutputTypeNode {
  id: number;
  code: string;
  name: string;
  level: 1 | 2 | 3;
  sortOrder: number;
  isActive: boolean;
  hasRule: boolean;
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
}

export interface CreateTypePayload {
  code: string;
  name: string;
  level: 1 | 2 | 3;
  sortOrder?: number;
  isActive?: boolean;
  parentId: number | null;
}

export interface UpdateTypePayload {
  code?: string;
  name?: string;
  sortOrder?: number;
  isActive?: boolean;
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

export const RULE_KIND_LABELS: Record<RuleKind, string> = {
  FIXED: 'Cố định',
  MULTIPLY_A: 'Nhân hệ số A',
  HDGSNN_POINTS_TO_HOURS: 'HĐGSNN điểm → giờ',
  MULTIPLY_C: 'Nhân hệ số C',
  RANGE_REVENUE: 'Theo dải doanh thu',
  BONUS_ADD: 'Cộng thưởng',
};

export const RULE_KIND_OPTIONS = Object.entries(RULE_KIND_LABELS).map(([value, label]) => ({
  value,
  label,
}));
