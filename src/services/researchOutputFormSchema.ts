import type { ResearchOutputTypeTreeNode } from '@/services/api/profilePublications';

/** Các trường form điều khiển hiển thị/bắt buộc theo từng loại kết quả NCKH (QĐ 1883). */
export type FormFieldKey =
  | 'title'
  | 'researchOutputTypePath'
  | 'journalName'
  | 'fundingOrganization'
  | 'doi'
  | 'qRankUrl'
  | 'reputableListUrl'
  | 'hdgsnnScore'
  | 'isbn'
  | 'publishedAt'
  | 'volume'
  | 'issue'
  | 'pages'
  | 'issn'
  | 'url'
  | 'attachment'
  | 'contributionRate'
  | 'authors';

/** Xếp loại nghiệm thu đề tài (rule MULTIPLY_C) — map sang hệ số c cấu hình trong danh mục. */
export type XepLoaiNghiemThu = 'EXCELLENT' | 'PASS_ON_TIME' | 'PASS_LATE';

export const XEP_LOAI_NGHIEM_THU_OPTIONS: Array<{ value: XepLoaiNghiemThu; label: string }> = [
  { value: 'EXCELLENT', label: 'Xuất sắc' },
  { value: 'PASS_ON_TIME', label: 'Đạt đúng hạn' },
  { value: 'PASS_LATE', label: 'Đạt chậm' },
];

export interface LeafFormSchema {
  leafCode: string;
  tenHienThi: string;
  /** Trường HIỂN THỊ trên form cho loại này (loại khác sẽ ẩn hẳn). */
  hienThiForm: FormFieldKey[];
  /** Trường BẮT BUỘC khi DUYỆT (CB phòng KH) — luôn là tập con của hienThiForm. User vẫn lưu nháp được. */
  batBuocForm: FormFieldKey[];
  ghiChuTinhToan: string[];
}

/** Metadata phụ của bài báo (volume/issue/pages/issn/url) — nằm trong phần mở rộng. */
const META_BAI_BAO: FormFieldKey[] = ['volume', 'issue', 'pages', 'issn', 'url'];

const MAC_DINH: LeafFormSchema = {
  leafCode: 'DEFAULT',
  tenHienThi: 'Loại kết quả NCKH',
  // Tối giản: loại chưa map chỉ hiện trường an toàn, KHÔNG hiện DOI/tạp chí.
  hienThiForm: ['title', 'researchOutputTypePath', 'publishedAt', 'attachment', 'authors'],
  batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
  ghiChuTinhToan: [
    'Dùng công thức theo rule của mục lá trong danh mục.',
    'Nên khai báo danh sách tác giả chi tiết để tính n/p chính xác.',
  ],
};

/**
 * Phân loại mục lá KQNC theo mã QĐ 1883 thật trên DB.
 * Catalog dùng mã QD_R<n> (1.1→QD_R2 ... 21.x→QD_R74) + QD_R14_P* (tạp chí mục 4).
 */
type LoaiKqnc =
  | 'INTL_ARTICLE' // mục 1,2: WoS/Scopus có DOI + xếp hạng Q
  | 'DOMESTIC_ARTICLE' // mục 4: tạp chí trong nước/khác — KHÔNG DOI/Q
  | 'CONF_ISBN' // mục 5: hội thảo/kỷ yếu có ISBN
  | 'REPORT' // mục 3: tham luận/báo cáo tại sự kiện
  | 'BOOK' // mục 6: sách, giáo trình — ISBN + % đóng góp
  | 'PROJECT' // mục 8,9,10: đề tài/nhiệm vụ KHCN — % đóng góp
  | 'MENTOR' // mục 11: hướng dẫn SV NCKH
  | 'IP_TRANSFER' // mục 12,13: SHTT, chuyển giao — % đóng góp
  | 'INNOVATION' // mục 14,15,16,17: khởi nghiệp/sáng kiến — % đóng góp
  | 'AWARD' // mục 18-21: khen thưởng, hoạt động khác
  | 'DEFAULT';

const TITLE_TYPE: FormFieldKey[] = ['title', 'researchOutputTypePath'];

/** Lấy số thứ tự rule từ mã QD_R<n> (bỏ qua hậu tố _P025…). */
function soRule(code: string): number | null {
  const m = /^QD_R(\d+)/.exec(code);
  return m ? Number(m[1]) : null;
}

function phanLoaiKqnc(code: string, ruleKind?: string | null): LoaiKqnc {
  const c = code.toUpperCase();
  if (c.startsWith('QD_R14_P') || c === 'QD_R24') return 'DOMESTIC_ARTICLE';
  const n = soRule(c);
  // Tương thích ngược mã cũ (nếu còn dữ liệu test).
  if (c.startsWith('PUB_WOS_') || c.startsWith('PUB_SCOPUS_')) return 'INTL_ARTICLE';
  if (c === 'PUB_DOMESTIC_HDGNN') return 'DOMESTIC_ARTICLE';
  if (c === 'PUB_CONF_ISBN' || c === 'QD_R15') return 'CONF_ISBN';
  if (c.startsWith('PROJECT_')) return 'PROJECT';
  if (n != null) {
    if (n >= 2 && n <= 11) return 'INTL_ARTICLE';
    if (n === 12 || n === 13) return 'REPORT';
    if (n >= 16 && n <= 23) return 'BOOK';
    if (n >= 25 && n <= 31) return 'PROJECT';
    if (n >= 32 && n <= 37) return 'MENTOR';
    if (n >= 38 && n <= 44) return 'IP_TRANSFER';
    if (n >= 45 && n <= 52) return 'INNOVATION';
    if (n >= 53 && n <= 74) return 'AWARD';
  }
  if ((ruleKind ?? '').toUpperCase() === 'HDGSNN_POINTS_TO_HOURS') return 'DOMESTIC_ARTICLE';
  return 'DEFAULT';
}

const SCHEMA_THEO_LOAI: Record<LoaiKqnc, Omit<LeafFormSchema, 'leafCode'>> = {
  INTL_ARTICLE: {
    tenHienThi: 'Bài báo quốc tế (WoS/Scopus)',
    hienThiForm: [
      ...TITLE_TYPE,
      'journalName',
      'fundingOrganization',
      'doi',
      'qRankUrl',
      'reputableListUrl',
      'publishedAt',
      'attachment',
      ...META_BAI_BAO,
      'authors',
    ],
    batBuocForm: [
      ...TITLE_TYPE,
      'journalName',
      'doi',
      'qRankUrl',
      'reputableListUrl',
      'publishedAt',
      'attachment',
      'authors',
    ],
    ghiChuTinhToan: [
      'Mức Q lấy theo mục lá (1.1→Q1 …). Cần DOI + link minh chứng Q + link danh mục uy tín.',
      'Chia giờ theo n/p: nhóm chính nhận B/(3n)+2B/(3p).',
    ],
  },
  DOMESTIC_ARTICLE: {
    tenHienThi: 'Bài báo trong nước / tạp chí khác',
    hienThiForm: [
      ...TITLE_TYPE,
      'journalName',
      'fundingOrganization',
      'reputableListUrl',
      'publishedAt',
      'attachment',
      ...META_BAI_BAO,
      'authors',
    ],
    batBuocForm: [
      ...TITLE_TYPE,
      'journalName',
      'publishedAt',
      'attachment',
      'authors',
    ],
    ghiChuTinhToan: [
      'Không có DOI/xếp hạng Q. Điểm/giờ lấy theo mục lá đã chọn.',
      // Mục 4 vẫn là công bố khoa học — chia n/p (1.2–1.3), không bắt % đóng góp (điều 1.4).
      'Chia giờ theo n/p giống bài báo: nhóm chính nhận B/(3n)+2B/(3p).',
    ],
  },
  CONF_ISBN: {
    tenHienThi: 'Hội thảo/kỷ yếu có ISBN',
    hienThiForm: [
      ...TITLE_TYPE,
      'journalName',
      'fundingOrganization',
      'isbn',
      'publishedAt',
      'attachment',
      'pages',
      'url',
      'authors',
    ],
    batBuocForm: [
      ...TITLE_TYPE,
      'journalName',
      'isbn',
      'publishedAt',
      'attachment',
      'authors',
    ],
    ghiChuTinhToan: [
      'Cần ISBN của kỷ yếu để minh chứng đúng loại.',
      // Mục 5 vẫn là công bố khoa học — chia n/p, không bắt % đóng góp.
      'Chia giờ theo n/p giống bài báo: nhóm chính nhận B/(3n)+2B/(3p).',
    ],
  },
  REPORT: {
    tenHienThi: 'Tham luận/báo cáo tại sự kiện',
    hienThiForm: [...TITLE_TYPE, 'publishedAt', 'attachment', 'url', 'authors'],
    batBuocForm: [...TITLE_TYPE, 'publishedAt', 'attachment', 'authors'],
    ghiChuTinhToan: ['Báo cáo/tham luận — minh chứng văn bản tham gia.'],
  },
  BOOK: {
    tenHienThi: 'Sách, giáo trình',
    hienThiForm: [...TITLE_TYPE, 'isbn', 'publishedAt', 'attachment', 'contributionRate', 'authors'],
    batBuocForm: [...TITLE_TYPE, 'isbn', 'publishedAt', 'attachment', 'contributionRate', 'authors'],
    ghiChuTinhToan: [
      'Cần ISBN. Nhiều người viết: chia giờ theo tỉ lệ % đóng góp (điều 1.4).',
    ],
  },
  PROJECT: {
    tenHienThi: 'Đề tài / nhiệm vụ KHCN',
    hienThiForm: [...TITLE_TYPE, 'publishedAt', 'attachment', 'contributionRate', 'authors'],
    batBuocForm: [...TITLE_TYPE, 'attachment', 'contributionRate', 'authors'],
    ghiChuTinhToan: [
      'Giờ = base × c (c theo xếp loại nghiệm thu).',
      'Nhiều người: chia theo tỉ lệ % đóng góp (điều 1.4).',
    ],
  },
  MENTOR: {
    tenHienThi: 'Hướng dẫn SV NCKH',
    hienThiForm: [...TITLE_TYPE, 'publishedAt', 'attachment', 'contributionRate', 'authors'],
    batBuocForm: [...TITLE_TYPE, 'attachment', 'authors'],
    ghiChuTinhToan: [
      'Mức giải/đạt lấy theo mục lá đã chọn.',
      'Sản phẩm khác (điều 1.4): nhiều người thì chia giờ theo % đóng góp.',
    ],
  },
  IP_TRANSFER: {
    tenHienThi: 'SHTT / chuyển giao công nghệ',
    hienThiForm: [...TITLE_TYPE, 'publishedAt', 'attachment', 'contributionRate', 'authors'],
    batBuocForm: [...TITLE_TYPE, 'attachment', 'contributionRate', 'authors'],
    ghiChuTinhToan: ['Cần minh chứng (bằng/hồ sơ/hợp đồng). Nhiều người: chia theo % đóng góp.'],
  },
  INNOVATION: {
    tenHienThi: 'Đổi mới sáng tạo / khởi nghiệp / sáng kiến',
    hienThiForm: [...TITLE_TYPE, 'publishedAt', 'attachment', 'contributionRate', 'authors'],
    batBuocForm: [...TITLE_TYPE, 'attachment', 'authors'],
    ghiChuTinhToan: ['Sáng kiến/đề án: khai % đóng góp khi có nhiều người để chia giờ.'],
  },
  AWARD: {
    tenHienThi: 'Khen thưởng / hoạt động khác',
    hienThiForm: [...TITLE_TYPE, 'publishedAt', 'attachment', 'contributionRate', 'authors'],
    batBuocForm: [...TITLE_TYPE, 'attachment', 'authors'],
    ghiChuTinhToan: [
      'Cấp/giải lấy theo mục lá đã chọn; cần minh chứng quyết định/giấy chứng nhận.',
      'Sản phẩm khác (điều 1.4): nhiều người thì chia giờ theo % đóng góp.',
    ],
  },
  DEFAULT: {
    tenHienThi: MAC_DINH.tenHienThi,
    hienThiForm: MAC_DINH.hienThiForm,
    batBuocForm: MAC_DINH.batBuocForm,
    ghiChuTinhToan: MAC_DINH.ghiChuTinhToan,
  },
};

export function laySchemaTheoMaLa(
  leafCode?: string | null,
  ruleKind?: string | null
): LeafFormSchema {
  const code = String(leafCode ?? '').trim().toUpperCase();
  const loai = phanLoaiKqnc(code, ruleKind);
  return { leafCode: code || 'DEFAULT', ...SCHEMA_THEO_LOAI[loai] };
}

export function layNodeTheoPath(
  tree: ResearchOutputTypeTreeNode[],
  path?: number[]
): ResearchOutputTypeTreeNode | null {
  if (!path?.length) return null;
  let children = tree;
  let found: ResearchOutputTypeTreeNode | null = null;
  for (const id of path) {
    found = children.find((n) => Number(n.id) === Number(id)) ?? null;
    if (!found) return null;
    children = found.children ?? [];
  }
  return found;
}

