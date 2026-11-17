/**
 * Ma trận kinh phí thuyết minh — khoản chi (cột) & nguồn (dòng).
 * Dùng chung FE; BE mirror tại app/constants/outline_budget_matrix.ts
 */

/** Mã khoản chi (cột 4–15 trên biểu) */
export const OUTLINE_BUDGET_EXPENSE_CODES = [
  'THU_LAO',
  'VAT_LIEU',
  'HOI_NGHI',
  'THUE_NGOAI',
  'DIEU_TRA',
  'VAN_PHONG',
  'CONG_BO',
  'TU_DANH_GIA',
  'TU_VAN_SHTT',
  'PHO_BIEN',
  'QUAN_LY',
  'CHI_KHAC',
] as const;

export type OutlineBudgetExpenseCode =
  (typeof OUTLINE_BUDGET_EXPENSE_CODES)[number];

export type OutlineBudgetExpenseMeta = {
  code: OutlineBudgetExpenseCode;
  /** Số cột trên biểu (4…15) */
  colNo: number;
  label: string;
  /** Gợi ý ngắn dưới header */
  hint?: string;
  /** Tự tính (không nhập tay) */
  auto?: boolean;
};

/** Định nghĩa cột khoản chi — khai báo 1 chỗ */
export const OUTLINE_BUDGET_EXPENSE_COLUMNS: OutlineBudgetExpenseMeta[] = [
  {
    code: 'THU_LAO',
    colNo: 4,
    label: 'Thù lao thực hiện nhiệm vụ; chi thuê chuyên gia (nếu có)',
  },
  {
    code: 'VAT_LIEU',
    colNo: 5,
    label:
      'Nguyên, nhiên, vật liệu, công cụ, dụng cụ, mua sắm, sửa chữa',
    hint: 'Khoán chi',
  },
  {
    code: 'HOI_NGHI',
    colNo: 6,
    label: 'Công tác tổ chức, tham gia hội nghị',
    hint: 'Khoán chi',
  },
  {
    code: 'THUE_NGOAI',
    colNo: 7,
    label: 'Dịch vụ thuê ngoài',
  },
  {
    code: 'DIEU_TRA',
    colNo: 8,
    label: 'Điều tra, khảo sát thu thập số liệu',
  },
  {
    code: 'VAN_PHONG',
    colNo: 9,
    label: 'Văn phòng phẩm, thông tin liên lạc, in ấn',
  },
  {
    code: 'CONG_BO',
    colNo: 10,
    label:
      'Công bố công trình khoa học và công nghệ trong nước và quốc tế',
  },
  {
    code: 'TU_DANH_GIA',
    colNo: 11,
    label: 'Tự đánh giá kết quả thực hiện nhiệm vụ',
  },
  {
    code: 'TU_VAN_SHTT',
    colNo: 12,
    label:
      'Tư vấn xây dựng đăng ký bảo hộ quyền sở hữu trí tuệ ở trong nước và nước ngoài',
  },
  {
    code: 'PHO_BIEN',
    colNo: 13,
    label: 'Phổ biến, tuyên truyền kết quả của nhiệm vụ',
  },
  {
    code: 'QUAN_LY',
    colNo: 14,
    label: 'Công tác quản lý chung nhiệm vụ',
    hint: 'Bằng 5% tổng kinh phí',
    auto: true,
  },
  {
    code: 'CHI_KHAC',
    colNo: 15,
    label:
      'Chi khác có liên quan trực tiếp đến triển khai thực hiện nhiệm vụ',
  },
];

/** Cột nhập tay (không gồm QUAN_LY) */
export const OUTLINE_BUDGET_EDITABLE_EXPENSE_CODES =
  OUTLINE_BUDGET_EXPENSE_COLUMNS.filter((c) => !c.auto).map((c) => c.code);

/** Mã dòng nguồn kinh phí */
export const OUTLINE_BUDGET_SOURCE_KEYS = [
  'TOTAL',
  'STATE',
  'STATE_LUMP',
  'STATE_NON_LUMP',
  'NON_STATE',
] as const;

export type OutlineBudgetSourceKey =
  (typeof OUTLINE_BUDGET_SOURCE_KEYS)[number];

export type OutlineBudgetSourceMeta = {
  key: OutlineBudgetSourceKey;
  stt: string;
  label: string;
  /** total | group | input | header */
  kind: 'total' | 'group' | 'input' | 'header';
  indent?: number;
};

export const OUTLINE_BUDGET_SOURCE_ROWS: OutlineBudgetSourceMeta[] = [
  { key: 'TOTAL', stt: '1', label: 'Tổng kinh phí', kind: 'total' },
  {
    key: 'STATE',
    stt: '1.1',
    label: 'Ngân sách nhà nước',
    kind: 'group',
    indent: 1,
  },
  {
    key: 'STATE_LUMP',
    stt: '',
    label: 'a. Kinh phí khoán chi',
    kind: 'input',
    indent: 2,
  },
  {
    key: 'STATE_NON_LUMP',
    stt: '',
    label: 'b. Kinh phí không khoán chi',
    kind: 'input',
    indent: 2,
  },
  {
    key: 'NON_STATE',
    stt: '1.2',
    label: 'Nguồn ngoài ngân sách nhà nước',
    kind: 'input',
    indent: 1,
  },
];

/** Dòng người dùng nhập */
export const OUTLINE_BUDGET_INPUT_SOURCE_KEYS: OutlineBudgetSourceKey[] = [
  'STATE_LUMP',
  'STATE_NON_LUMP',
  'NON_STATE',
];

export type OutlineBudgetExpenseAmounts = Partial<
  Record<OutlineBudgetExpenseCode, number>
>;

/** Dữ liệu lưu DB — chỉ 3 dòng nhập; các dòng tổng tự cộng */
export type OutlineBudgetMatrix = {
  STATE_LUMP: OutlineBudgetExpenseAmounts;
  STATE_NON_LUMP: OutlineBudgetExpenseAmounts;
  NON_STATE: OutlineBudgetExpenseAmounts;
};

export const EMPTY_BUDGET_MATRIX: OutlineBudgetMatrix = {
  STATE_LUMP: {},
  STATE_NON_LUMP: {},
  NON_STATE: {},
};

export function money0(v: unknown): number {
  const n = Math.round(Number(v || 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Tổng các khoản nhập tay (không gồm QUAN_LY) */
export function sumEditableExpenses(row: OutlineBudgetExpenseAmounts): number {
  return OUTLINE_BUDGET_EDITABLE_EXPENSE_CODES.reduce(
    (s, code) => s + money0(row[code]),
    0,
  );
}

/**
 * Quản lý = 5% tổng kinh phí; tổng = khoản nhập + quản lý
 * ⇒ quanLy = round(editable * 0.05 / 0.95); tong = editable + quanLy
 */
export function calcQuanLyFromEditable(editableSum: number): number {
  if (editableSum <= 0) return 0;
  return Math.round((editableSum * 0.05) / 0.95);
}

export function calcRowTotal(row: OutlineBudgetExpenseAmounts): {
  editableSum: number;
  quanLy: number;
  tong: number;
  amounts: Record<OutlineBudgetExpenseCode, number>;
} {
  const editableSum = sumEditableExpenses(row);
  const quanLy = calcQuanLyFromEditable(editableSum);
  const amounts = {} as Record<OutlineBudgetExpenseCode, number>;
  for (const code of OUTLINE_BUDGET_EDITABLE_EXPENSE_CODES) {
    amounts[code] = money0(row[code]);
  }
  amounts.QUAN_LY = quanLy;
  return { editableSum, quanLy, tong: editableSum + quanLy, amounts };
}

export function addExpenseRows(
  a: OutlineBudgetExpenseAmounts,
  b: OutlineBudgetExpenseAmounts,
): OutlineBudgetExpenseAmounts {
  const out: OutlineBudgetExpenseAmounts = {};
  for (const code of OUTLINE_BUDGET_EDITABLE_EXPENSE_CODES) {
    out[code] = money0(a[code]) + money0(b[code]);
  }
  return out;
}

export function normalizeBudgetMatrix(
  raw?: Partial<OutlineBudgetMatrix> | null,
): OutlineBudgetMatrix {
  const pick = (r?: OutlineBudgetExpenseAmounts | null) => {
    const o: OutlineBudgetExpenseAmounts = {};
    for (const code of OUTLINE_BUDGET_EDITABLE_EXPENSE_CODES) {
      o[code] = money0(r?.[code]);
    }
    return o;
  };
  return {
    STATE_LUMP: pick(raw?.STATE_LUMP),
    STATE_NON_LUMP: pick(raw?.STATE_NON_LUMP),
    NON_STATE: pick(raw?.NON_STATE),
  };
}

/** Map khoản chi → nhóm budget_lines cũ */
export const EXPENSE_TO_BUDGET_GROUP: Record<
  OutlineBudgetExpenseCode,
  'NHAN_CONG' | 'VAT_TU' | 'HOI_THAO' | 'KHAC'
> = {
  THU_LAO: 'NHAN_CONG',
  VAT_LIEU: 'VAT_TU',
  HOI_NGHI: 'HOI_THAO',
  THUE_NGOAI: 'KHAC',
  DIEU_TRA: 'KHAC',
  VAN_PHONG: 'KHAC',
  CONG_BO: 'KHAC',
  TU_DANH_GIA: 'KHAC',
  TU_VAN_SHTT: 'KHAC',
  PHO_BIEN: 'KHAC',
  QUAN_LY: 'KHAC',
  CHI_KHAC: 'KHAC',
};
