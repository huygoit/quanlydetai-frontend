import type { ResearchOutputTypeTreeNode } from '@/services/api/profilePublications';

export interface LeafFormSchema {
  leafCode: string;
  tenHienThi: string;
  batBuocForm: Array<'title' | 'researchOutputTypePath' | 'hdgsnnScore' | 'isbn' | 'authors'>;
  batBuocApiPayload: Array<'researchOutputTypeId' | 'title' | 'hdgsnnScore' | 'isbn' | 'authors'>;
  ghiChuTinhToan: string[];
}

const MAC_DINH: LeafFormSchema = {
  leafCode: 'DEFAULT',
  tenHienThi: 'Loại kết quả NCKH',
  batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
  batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
  ghiChuTinhToan: [
    'Dùng công thức theo rule của mục lá trong danh mục.',
    'Nên khai báo danh sách tác giả chi tiết để tính n/p chính xác.',
    'Năm học là metadata để lọc/thống kê, không phải điều kiện đầu vào công thức.',
  ],
};

const PUB_THEO_LA: Record<string, LeafFormSchema> = {
  PUB_DOMESTIC_HDGNN: {
    leafCode: 'PUB_DOMESTIC_HDGNN',
    tenHienThi: 'Bài báo tính theo điểm HĐGSNN',
    batBuocForm: ['title', 'researchOutputTypePath', 'hdgsnnScore', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'hdgsnnScore', 'authors'],
    ghiChuTinhToan: [
      'Giờ gốc B0 = 600 × điểm HĐGSNN.',
      'Sau đó áp hệ số a, chia theo n/p, điều kiện nữ và kiêm nhiệm ngoài.',
    ],
  },
  PUB_CONF_ISBN: {
    leafCode: 'PUB_CONF_ISBN',
    tenHienThi: 'Hội thảo có ISBN',
    batBuocForm: ['title', 'researchOutputTypePath', 'isbn', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'isbn', 'authors'],
    ghiChuTinhToan: [
      'Giờ/điểm gốc lấy từ rule mục lá PUB_CONF_ISBN.',
      'Cần ISBN để minh chứng đúng loại kết quả.',
    ],
  },
  PUB_WOS_Q1: {
    leafCode: 'PUB_WOS_Q1',
    tenHienThi: 'Bài báo WOS/SCIE/SSCI/AHCI Q1',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: [
      'B0 từ danh mục lá (Q1/Q2/Q3/Q4/NO_Q) và nhân hệ số a theo điều 1.1.',
      'Chia theo n/p: nhóm chính hoặc liên hệ nhận B/(3n)+2B/(3p).',
    ],
  },
  PUB_WOS_Q2: {
    leafCode: 'PUB_WOS_Q2',
    tenHienThi: 'Bài báo WOS/SCIE/SSCI/AHCI Q2',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
  PUB_WOS_Q3: {
    leafCode: 'PUB_WOS_Q3',
    tenHienThi: 'Bài báo WOS/SCIE/SSCI/AHCI Q3',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
  PUB_WOS_Q4: {
    leafCode: 'PUB_WOS_Q4',
    tenHienThi: 'Bài báo WOS/SCIE/SSCI/AHCI Q4',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
  PUB_WOS_NO_Q: {
    leafCode: 'PUB_WOS_NO_Q',
    tenHienThi: 'Bài báo WOS/SCIE/SSCI/AHCI chưa có Q',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
  PUB_SCOPUS_Q1: {
    leafCode: 'PUB_SCOPUS_Q1',
    tenHienThi: 'Bài báo Scopus/ESCI Q1',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
  PUB_SCOPUS_Q2: {
    leafCode: 'PUB_SCOPUS_Q2',
    tenHienThi: 'Bài báo Scopus/ESCI Q2',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
  PUB_SCOPUS_Q3: {
    leafCode: 'PUB_SCOPUS_Q3',
    tenHienThi: 'Bài báo Scopus/ESCI Q3',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
  PUB_SCOPUS_Q4: {
    leafCode: 'PUB_SCOPUS_Q4',
    tenHienThi: 'Bài báo Scopus/ESCI Q4',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
  PUB_SCOPUS_NO_Q: {
    leafCode: 'PUB_SCOPUS_NO_Q',
    tenHienThi: 'Bài báo Scopus/ESCI chưa có Q',
    batBuocForm: ['title', 'researchOutputTypePath', 'authors'],
    batBuocApiPayload: ['researchOutputTypeId', 'title', 'authors'],
    ghiChuTinhToan: ['Áp công thức mục 1.1-1.3 giống nhóm WOS/Scopus.'],
  },
};

export function laySchemaTheoMaLa(
  leafCode?: string | null,
  ruleKind?: string | null
): LeafFormSchema {
  const code = String(leafCode ?? '').trim().toUpperCase();
  if (code && PUB_THEO_LA[code]) return PUB_THEO_LA[code];
  if (code.startsWith('PUB_')) {
    return {
      ...MAC_DINH,
      leafCode: code,
      tenHienThi: 'Công bố khoa học',
      ghiChuTinhToan: [
        'Bài công bố áp quy định 1.1 -> 1.7: hệ số a, chia n/p, điều kiện nữ và kiêm nhiệm ngoài.',
        'Nên khai báo rõ tác giả liên hệ để hệ số a được suy đúng theo tập liên hệ.',
      ],
    };
  }
  if ((ruleKind ?? '').toUpperCase() === 'HDGSNN_POINTS_TO_HOURS') {
    return PUB_THEO_LA.PUB_DOMESTIC_HDGNN;
  }
  return { ...MAC_DINH, leafCode: code || MAC_DINH.leafCode };
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

