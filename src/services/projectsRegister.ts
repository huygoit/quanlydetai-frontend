/**
 * Mock Service - Module Đăng ký đề xuất đề tài (Giai đoạn 1)
 * specs/projects-register.md
 */

// ============ TYPES ============

export type ProposalStatus =
  | 'DRAFT'          // Bản nháp – chỉ CNĐT thấy
  | 'SUBMITTED'      // CNĐT đã gửi đề xuất
  | 'UNIT_REVIEWED'  // Trưởng đơn vị đã cho ý kiến
  | 'APPROVED'       // Phòng KH / Lãnh đạo duyệt
  | 'REJECTED'       // Không được duyệt
  | 'WITHDRAWN';     // CNĐT xin rút

export interface ProjectProposal {
  id: string;
  code: string;             // Mã đề xuất, vd: ĐT-2025-001
  title: string;            // Tên đề tài đề xuất
  field: string;            // Lĩnh vực khoa học
  level: string;            // Cấp quản lý dự kiến
  year: number;             // Năm đề xuất
  durationMonths: number;   // Thời gian thực hiện (tháng)
  keywords?: string[];      // Từ khoá
  createdAt: string;
  updatedAt: string;

  // Chủ nhiệm + nhóm
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerUnit: string;
  coAuthors?: string[];     // Danh sách tham gia khác

  // Nội dung khoa học
  objectives: string;       // Mục tiêu
  summary: string;          // Tóm tắt
  contentOutline?: string;  // Nội dung chính / đề cương
  expectedResults?: string; // Kết quả / sản phẩm dự kiến
  applicationPotential?: string; // Khả năng ứng dụng

  // Kinh phí
  requestedBudgetTotal?: number; // Kinh phí đề nghị tổng (VNĐ)
  requestedBudgetDetail?: string; // Mô tả chi tiết

  // Trạng thái & ý kiến
  status: ProposalStatus;
  unitComment?: string;     // Ý kiến Trưởng đơn vị
  unitApproved?: boolean;   // Đơn vị đề xuất/không đề xuất
  sciDeptComment?: string;  // Ý kiến Phòng KH
  sciDeptPriority?: 'LOW' | 'MEDIUM' | 'HIGH'; // Ưu tiên Phòng KH
}

// ============ STATUS CONFIG ============

export const PROPOSAL_STATUS_CONFIG: Record<ProposalStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'default' },
  SUBMITTED: { label: 'Đã gửi', color: 'processing' },
  UNIT_REVIEWED: { label: 'Đơn vị đã duyệt', color: 'cyan' },
  APPROVED: { label: 'Đã phê duyệt', color: 'success' },
  REJECTED: { label: 'Không phê duyệt', color: 'error' },
  WITHDRAWN: { label: 'Đã rút', color: 'warning' },
};

export const PRIORITY_OPTIONS = [
  { label: 'Thấp', value: 'LOW', color: 'default' },
  { label: 'Trung bình', value: 'MEDIUM', color: 'blue' },
  { label: 'Cao', value: 'HIGH', color: 'red' },
];

export const FIELD_OPTIONS = [
  'Công nghệ thông tin',
  'Kinh tế - Quản lý',
  'Khoa học xã hội',
  'Kỹ thuật - Công nghệ',
  'Y - Dược',
  'Nông nghiệp - Sinh học',
  'Khoa học tự nhiên',
  'Giáo dục',
];

export const LEVEL_OPTIONS = [
  { label: 'Cấp cơ sở', value: 'CO_SO' },
  { label: 'Cấp Trường', value: 'TRUONG' },
  { label: 'Cấp Bộ', value: 'BO' },
  { label: 'Cấp Nhà nước', value: 'NHA_NUOC' },
];

export const UNIT_OPTIONS = [
  'Khoa Công nghệ thông tin',
  'Khoa Kinh tế',
  'Khoa Ngoại ngữ',
  'Khoa Luật',
  'Khoa Y',
  'Khoa Dược',
  'Khoa Nông nghiệp',
  'Viện Nghiên cứu CNTT',
  'Trung tâm Khoa học Xã hội',
];

// ============ MOCK DATA ============

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let mockProposals: ProjectProposal[] = [
  {
    id: '1',
    code: 'ĐT-2025-001',
    title: 'Nghiên cứu ứng dụng AI trong chẩn đoán bệnh lý hình ảnh y khoa',
    field: 'Công nghệ thông tin',
    level: 'TRUONG',
    year: 2025,
    durationMonths: 18,
    keywords: ['AI', 'Deep Learning', 'Y khoa', 'Chẩn đoán hình ảnh'],
    createdAt: '2025-01-15T08:30:00Z',
    updatedAt: '2025-01-20T14:20:00Z',
    ownerId: 'user-001',
    ownerName: 'Nguyễn Văn An',
    ownerEmail: 'an.nguyen@university.edu.vn',
    ownerUnit: 'Khoa Công nghệ thông tin',
    coAuthors: ['PGS.TS. Trần Minh Hoàng', 'ThS. Lê Thị Mai'],
    objectives: 'Phát triển hệ thống AI hỗ trợ chẩn đoán bệnh lý từ ảnh X-quang và CT scan.',
    summary: 'Đề tài tập trung nghiên cứu và phát triển thuật toán deep learning cho việc phân tích hình ảnh y khoa, hỗ trợ bác sĩ trong chẩn đoán các bệnh lý phổ biến.',
    contentOutline: '1. Tổng quan về AI trong y khoa\n2. Thu thập và xử lý dữ liệu\n3. Xây dựng mô hình\n4. Đánh giá và triển khai',
    expectedResults: '- Bộ dữ liệu ảnh y khoa chuẩn hóa\n- Mô hình AI đạt độ chính xác > 90%\n- 02 bài báo khoa học quốc tế',
    applicationPotential: 'Ứng dụng trong các bệnh viện, phòng khám để hỗ trợ chẩn đoán nhanh và chính xác.',
    requestedBudgetTotal: 450000000,
    requestedBudgetDetail: 'Chi phí nhân sự: 200tr\nThiết bị: 150tr\nVật tư, hóa chất: 50tr\nCông bố khoa học: 50tr',
    status: 'SUBMITTED',
  },
  {
    id: '2',
    code: 'ĐT-2025-002',
    title: 'Đánh giá hiệu quả mô hình kinh tế tuần hoàn tại các doanh nghiệp Việt Nam',
    field: 'Kinh tế - Quản lý',
    level: 'BO',
    year: 2025,
    durationMonths: 24,
    keywords: ['Kinh tế tuần hoàn', 'Phát triển bền vững', 'Doanh nghiệp'],
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-25T09:15:00Z',
    ownerId: 'user-002',
    ownerName: 'Trần Thị Bích',
    ownerEmail: 'bich.tran@university.edu.vn',
    ownerUnit: 'Khoa Kinh tế',
    coAuthors: ['TS. Phạm Văn Dũng'],
    objectives: 'Đánh giá hiệu quả và đề xuất giải pháp phát triển mô hình kinh tế tuần hoàn.',
    summary: 'Nghiên cứu thực trạng áp dụng kinh tế tuần hoàn tại 50 doanh nghiệp, từ đó xây dựng bộ tiêu chí đánh giá và đề xuất chính sách.',
    expectedResults: '- Báo cáo khảo sát 50 doanh nghiệp\n- Bộ tiêu chí đánh giá kinh tế tuần hoàn\n- Khuyến nghị chính sách',
    requestedBudgetTotal: 600000000,
    status: 'UNIT_REVIEWED',
    unitApproved: true,
    unitComment: 'Đề tài có ý nghĩa thực tiễn cao, phù hợp với định hướng nghiên cứu của Khoa.',
  },
  {
    id: '3',
    code: 'ĐT-2025-003',
    title: 'Phát triển hệ thống IoT giám sát môi trường nông nghiệp thông minh',
    field: 'Kỹ thuật - Công nghệ',
    level: 'TRUONG',
    year: 2025,
    durationMonths: 12,
    keywords: ['IoT', 'Nông nghiệp thông minh', 'Cảm biến', 'Cloud'],
    createdAt: '2025-02-01T08:00:00Z',
    updatedAt: '2025-02-01T08:00:00Z',
    ownerId: 'user-001',
    ownerName: 'Nguyễn Văn An',
    ownerUnit: 'Khoa Công nghệ thông tin',
    objectives: 'Xây dựng hệ thống IoT giám sát nhiệt độ, độ ẩm, ánh sáng cho nhà kính.',
    summary: 'Phát triển bộ cảm biến và phần mềm quản lý cho nông nghiệp công nghệ cao.',
    requestedBudgetTotal: 200000000,
    status: 'DRAFT',
  },
  {
    id: '4',
    code: 'ĐT-2025-004',
    title: 'Nghiên cứu tác động của chuyển đổi số đến năng suất lao động',
    field: 'Kinh tế - Quản lý',
    level: 'CO_SO',
    year: 2025,
    durationMonths: 12,
    keywords: ['Chuyển đổi số', 'Năng suất', 'Lao động'],
    createdAt: '2025-01-20T14:00:00Z',
    updatedAt: '2025-02-05T10:30:00Z',
    ownerId: 'user-003',
    ownerName: 'Lê Minh Châu',
    ownerUnit: 'Khoa Kinh tế',
    objectives: 'Đánh giá tác động của chuyển đổi số đến năng suất lao động trong doanh nghiệp.',
    summary: 'Khảo sát và phân tích dữ liệu từ 100 doanh nghiệp về hiệu quả chuyển đổi số.',
    requestedBudgetTotal: 150000000,
    status: 'APPROVED',
    unitApproved: true,
    unitComment: 'Đề tài phù hợp, đề nghị phê duyệt.',
    sciDeptPriority: 'HIGH',
    sciDeptComment: 'Đề tài có tính thời sự cao, đề nghị ưu tiên thực hiện.',
  },
  {
    id: '5',
    code: 'ĐT-2025-005',
    title: 'Phân tích và dự báo biến động thị trường chứng khoán bằng Machine Learning',
    field: 'Công nghệ thông tin',
    level: 'CO_SO',
    year: 2025,
    durationMonths: 12,
    keywords: ['Machine Learning', 'Chứng khoán', 'Dự báo'],
    createdAt: '2025-02-10T09:00:00Z',
    updatedAt: '2025-02-10T09:00:00Z',
    ownerId: 'user-004',
    ownerName: 'Phạm Hoàng Duy',
    ownerUnit: 'Viện Nghiên cứu CNTT',
    objectives: 'Xây dựng mô hình dự báo xu hướng thị trường chứng khoán.',
    summary: 'Áp dụng các thuật toán ML để phân tích và dự báo giá cổ phiếu.',
    requestedBudgetTotal: 100000000,
    status: 'REJECTED',
    unitApproved: false,
    unitComment: 'Đề tài thiếu tính khả thi về mặt dữ liệu.',
    sciDeptComment: 'Không đủ điều kiện triển khai.',
  },
  {
    id: '6',
    code: 'ĐT-2025-006',
    title: 'Nghiên cứu phát triển vaccine thế hệ mới cho bệnh truyền nhiễm',
    field: 'Y - Dược',
    level: 'NHA_NUOC',
    year: 2025,
    durationMonths: 36,
    keywords: ['Vaccine', 'Truyền nhiễm', 'Y học'],
    createdAt: '2025-01-05T08:00:00Z',
    updatedAt: '2025-02-15T16:00:00Z',
    ownerId: 'user-005',
    ownerName: 'GS.TS. Nguyễn Thị Hoa',
    ownerUnit: 'Khoa Y',
    coAuthors: ['PGS.TS. Trần Văn Minh', 'TS. Lê Hoàng Nam', 'ThS. Phạm Thị Lan'],
    objectives: 'Nghiên cứu và phát triển vaccine mRNA cho bệnh truyền nhiễm mới nổi.',
    summary: 'Đề tài tập trung vào công nghệ mRNA để phát triển vaccine có hiệu quả cao.',
    contentOutline: '1. Nghiên cứu tổng quan\n2. Thiết kế và tổng hợp mRNA\n3. Thử nghiệm tiền lâm sàng\n4. Đánh giá hiệu quả',
    expectedResults: '- Quy trình tổng hợp mRNA vaccine\n- Kết quả thử nghiệm tiền lâm sàng\n- 03 bài báo quốc tế ISI',
    applicationPotential: 'Ứng dụng trong y tế công cộng, phòng chống dịch bệnh.',
    requestedBudgetTotal: 2500000000,
    requestedBudgetDetail: 'Thiết bị: 1.5 tỷ\nVật tư, hóa chất: 500tr\nNhân công: 300tr\nCông bố: 200tr',
    status: 'SUBMITTED',
  },
  {
    id: '7',
    code: 'ĐT-2024-015',
    title: 'Đánh giá tác động của biến đổi khí hậu đến sản xuất lúa vùng ĐBSCL',
    field: 'Nông nghiệp - Sinh học',
    level: 'BO',
    year: 2024,
    durationMonths: 24,
    keywords: ['Biến đổi khí hậu', 'Lúa', 'ĐBSCL'],
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-12-20T14:00:00Z',
    ownerId: 'user-006',
    ownerName: 'TS. Võ Minh Tuấn',
    ownerUnit: 'Khoa Nông nghiệp',
    objectives: 'Đánh giá tác động và đề xuất giải pháp thích ứng.',
    summary: 'Nghiên cứu ảnh hưởng của xâm nhập mặn, hạn hán đến năng suất lúa.',
    requestedBudgetTotal: 800000000,
    status: 'APPROVED',
    unitApproved: true,
    sciDeptPriority: 'HIGH',
  },
];

let proposalIdCounter = 8;

// ============ API FUNCTIONS ============

export interface QueryProposalParams {
  pageSize?: number;
  current?: number;
  keyword?: string;
  year?: number;
  status?: ProposalStatus;
  level?: string;
  field?: string;
  unit?: string;
  ownerOnly?: boolean;
  ownerId?: string;
}

export async function queryProjectProposals(params: QueryProposalParams): Promise<{
  data: ProjectProposal[];
  total: number;
  success: boolean;
}> {
  await delay(400);

  let filtered = [...mockProposals];

  // Filter by owner (for NCV/CNDT)
  if (params.ownerOnly && params.ownerId) {
    filtered = filtered.filter((p) => p.ownerId === params.ownerId);
  }

  // Filter by unit (for TRUONG_DON_VI)
  if (params.unit) {
    filtered = filtered.filter((p) => p.ownerUnit === params.unit);
  }

  // Filter by year
  if (params.year) {
    filtered = filtered.filter((p) => p.year === params.year);
  }

  // Filter by status
  if (params.status) {
    filtered = filtered.filter((p) => p.status === params.status);
  }

  // Filter by level
  if (params.level) {
    filtered = filtered.filter((p) => p.level === params.level);
  }

  // Filter by field
  if (params.field) {
    filtered = filtered.filter((p) => p.field === params.field);
  }

  // Filter by keyword (search in code, title, ownerName)
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.code.toLowerCase().includes(kw) ||
        p.title.toLowerCase().includes(kw) ||
        p.ownerName.toLowerCase().includes(kw)
    );
  }

  // Sort by updatedAt desc
  filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Pagination
  const pageSize = params.pageSize || 10;
  const current = params.current || 1;
  const start = (current - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  return {
    data: paged,
    total: filtered.length,
    success: true,
  };
}

export async function getProjectProposal(id: string): Promise<ProjectProposal | null> {
  await delay(200);
  return mockProposals.find((p) => p.id === id) || null;
}

export async function createProjectProposal(
  data: Partial<ProjectProposal>
): Promise<{ success: boolean; data?: ProjectProposal; message?: string }> {
  await delay(300);

  const now = new Date().toISOString();
  const newProposal: ProjectProposal = {
    id: String(proposalIdCounter++),
    code: `ĐT-${data.year || new Date().getFullYear()}-${String(proposalIdCounter).padStart(3, '0')}`,
    title: data.title || '',
    field: data.field || '',
    level: data.level || 'CO_SO',
    year: data.year || new Date().getFullYear(),
    durationMonths: data.durationMonths || 12,
    keywords: data.keywords || [],
    createdAt: now,
    updatedAt: now,
    ownerId: data.ownerId || '',
    ownerName: data.ownerName || '',
    ownerEmail: data.ownerEmail,
    ownerUnit: data.ownerUnit || '',
    coAuthors: data.coAuthors || [],
    objectives: data.objectives || '',
    summary: data.summary || '',
    contentOutline: data.contentOutline,
    expectedResults: data.expectedResults,
    applicationPotential: data.applicationPotential,
    requestedBudgetTotal: data.requestedBudgetTotal,
    requestedBudgetDetail: data.requestedBudgetDetail,
    status: data.status || 'DRAFT',
  };

  mockProposals.unshift(newProposal);

  return { success: true, data: newProposal };
}

export async function updateProjectProposal(
  id: string,
  data: Partial<ProjectProposal>
): Promise<{ success: boolean; message?: string }> {
  await delay(300);

  const index = mockProposals.findIndex((p) => p.id === id);
  if (index === -1) {
    return { success: false, message: 'Không tìm thấy đề xuất' };
  }

  mockProposals[index] = {
    ...mockProposals[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };

  return { success: true };
}

export async function submitProjectProposal(id: string): Promise<{ success: boolean; message?: string }> {
  await delay(300);

  const proposal = mockProposals.find((p) => p.id === id);
  if (!proposal) {
    return { success: false, message: 'Không tìm thấy đề xuất' };
  }

  if (proposal.status !== 'DRAFT') {
    return { success: false, message: 'Chỉ có thể gửi đề xuất ở trạng thái Nháp' };
  }

  proposal.status = 'SUBMITTED';
  proposal.updatedAt = new Date().toISOString();

  return { success: true };
}

export async function withdrawProjectProposal(id: string): Promise<{ success: boolean; message?: string }> {
  await delay(300);

  const proposal = mockProposals.find((p) => p.id === id);
  if (!proposal) {
    return { success: false, message: 'Không tìm thấy đề xuất' };
  }

  if (proposal.status !== 'SUBMITTED') {
    return { success: false, message: 'Chỉ có thể rút đề xuất ở trạng thái Đã gửi' };
  }

  proposal.status = 'WITHDRAWN';
  proposal.updatedAt = new Date().toISOString();

  return { success: true };
}

export async function deleteProjectProposal(id: string): Promise<{ success: boolean; message?: string }> {
  await delay(300);

  const index = mockProposals.findIndex((p) => p.id === id);
  if (index === -1) {
    return { success: false, message: 'Không tìm thấy đề xuất' };
  }

  if (mockProposals[index].status !== 'DRAFT') {
    return { success: false, message: 'Chỉ có thể xoá đề xuất ở trạng thái Nháp' };
  }

  mockProposals.splice(index, 1);

  return { success: true };
}

export async function unitReviewProjectProposal(
  id: string,
  data: { unitApproved: boolean; unitComment?: string }
): Promise<{ success: boolean; message?: string }> {
  await delay(300);

  const proposal = mockProposals.find((p) => p.id === id);
  if (!proposal) {
    return { success: false, message: 'Không tìm thấy đề xuất' };
  }

  if (proposal.status !== 'SUBMITTED') {
    return { success: false, message: 'Chỉ có thể cho ý kiến đề xuất ở trạng thái Đã gửi' };
  }

  proposal.unitApproved = data.unitApproved;
  proposal.unitComment = data.unitComment;
  proposal.status = 'UNIT_REVIEWED';
  proposal.updatedAt = new Date().toISOString();

  return { success: true };
}

export async function sciDeptReviewProjectProposal(
  id: string,
  data: {
    status: 'APPROVED' | 'REJECTED';
    sciDeptPriority?: 'LOW' | 'MEDIUM' | 'HIGH';
    sciDeptComment?: string;
  }
): Promise<{ success: boolean; message?: string }> {
  await delay(300);

  const proposal = mockProposals.find((p) => p.id === id);
  if (!proposal) {
    return { success: false, message: 'Không tìm thấy đề xuất' };
  }

  proposal.status = data.status;
  proposal.sciDeptPriority = data.sciDeptPriority;
  proposal.sciDeptComment = data.sciDeptComment;
  proposal.updatedAt = new Date().toISOString();

  return { success: true };
}



