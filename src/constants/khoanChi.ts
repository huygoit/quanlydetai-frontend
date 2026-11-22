/**
 * Danh mục khoản chi dùng chung — chuẩn = cột thuyết minh.
 * Hợp đồng / tạm ứng / mua sắm cùng mã với ma trận kinh phí TM.
 */

import {
  OUTLINE_BUDGET_EXPENSE_COLUMNS,
  type OutlineBudgetExpenseCode,
} from '@/constants/outlineBudgetMatrix';

export type KhoanChiDef = {
  code: OutlineBudgetExpenseCode;
  stt: number;
  label: string;
  isQuanLyChung?: boolean;
};

export const KHOAN_CHI: KhoanChiDef[] = OUTLINE_BUDGET_EXPENSE_COLUMNS.map(
  (c, index) => ({
    code: c.code,
    stt: index + 1,
    label: c.label,
    isQuanLyChung: c.code === 'QUAN_LY',
  }),
);

export const KHOAN_CHI_CODES = KHOAN_CHI.map((k) => k.code);

export const KHOAN_CHI_QUAN_LY = 'QUAN_LY' as const;

/** Mua sắm: NVL/mua sắm + thuê ngoài */
export const KHOAN_CHI_MUA_SAM = ['VAT_LIEU', 'THUE_NGOAI'] as const;

export function nhanKhoanChi(code: string) {
  const hit = KHOAN_CHI.find((k) => k.code === code);
  if (!hit) return code;
  return `${hit.stt}. ${hit.label}`;
}

export function optionKhoanChi() {
  return KHOAN_CHI.map((k) => ({
    value: k.code,
    label: `${k.stt}. ${k.label}`,
  }));
}
