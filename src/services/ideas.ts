/**
 * Mock Service - Ngân hàng ý tưởng
 * Theo specs/ideas-v3-final.md
 */

// ========== TYPES ==========

/**
 * Cấp đề tài phù hợp (Checkbox - chọn NHIỀU)
 */
export type ProjectLevel =
  | 'TRUONG_THUONG_NIEN'
  | 'TRUONG_DAT_HANG'
  | 'DAI_HOC_DA_NANG'
  | 'BO_GDDT'
  | 'NHA_NUOC'
  | 'NAFOSTED'
  | 'TINH_THANH_PHO'
  | 'DOANH_NGHIEP';

/**
 * Trạng thái ý tưởng (FINAL)
 * DRAFT → SUBMITTED → REVIEWING → APPROVED_INTERNAL → PROPOSED_FOR_ORDER → APPROVED_FOR_ORDER
 * ❌ Bị từ chối tại bất kỳ bước nào → REJECTED (kết thúc)
 */
export type IdeaStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'APPROVED_INTERNAL'
  | 'PROPOSED_FOR_ORDER'
  | 'APPROVED_FOR_ORDER'
  | 'REJECTED';

/**
 * Phân biệt bị từ chối ở đâu (audit)
 */
export type RejectStage =
  | 'PHONG_KH_SO_LOAI'
  | 'HOI_DONG_DE_XUAT'
  | 'LANH_DAO_PHE_DUYET';

export type IdeaPriority = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Model Idea - theo specs V3 Final
 */
export interface Idea {
  id: string;
  code: string;
  title: string;
  summary: string;
  field: string;

  // Cấp đề tài phù hợp (multi-select)
  suitableLevels: ProjectLevel[];

  ownerId: string;
  ownerName: string;
  ownerUnit: string;

  status: IdeaStatus;

  priority?: IdeaPriority;
  noteForReview?: string;

  // Thông tin từ chối
  rejectedStage?: RejectStage;
  rejectedReason?: string;
  rejectedByRole?: 'PHONG_KH' | 'HOI_DONG' | 'LANH_DAO';
  rejectedAt?: string;

  // Liên kết đề tài (sau khi khởi tạo)
  linkedProjectId?: string;

  // Kết quả chấm điểm Hội đồng KH&ĐT (V2 - có trọng số)
  councilSessionId?: string;
  councilAvgWeightedScore?: number;    // Điểm TB có trọng số (0-10)
  councilAvgNoveltyScore?: number;     // Điểm TB tính mới
  councilAvgFeasibilityScore?: number; // Điểm TB khả thi
  councilAvgAlignmentScore?: number;   // Điểm TB phù hợp
  councilAvgAuthorCapacityScore?: number; // Điểm TB năng lực
  councilSubmittedCount?: number;      // Số phiếu đã chấm
  councilMemberCount?: number;         // Tổng số thành viên
  councilRecommendation?: 'PROPOSE_ORDER' | 'NOT_PROPOSE';
  councilScoredAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface IdeaQueryParams {
  keyword?: string;
  field?: string;
  unit?: string;
  status?: IdeaStatus;
  suitableLevels?: ProjectLevel[];
  priority?: IdeaPriority;
  startDate?: string;
  endDate?: string;
  ownerId?: string;
  current?: number;
  pageSize?: number;
}

export interface IdeaCreateData {
  title: string;
  field: string;
  suitableLevels: ProjectLevel[];
  summary: string;
}

export interface IdeaReviewData {
  status: IdeaStatus;
  priority?: IdeaPriority;
  noteForReview?: string;
  rejectedReason?: string;
}

// ========== CONSTANTS ==========

export const IDEA_FIELDS = ['Công nghệ thông tin', 'Kinh tế', 'Y học', 'Nông nghiệp', 'Giáo dục', 'Kỹ thuật'];
export const IDEA_UNITS = ['Khoa CNTT', 'Khoa Kinh tế', 'Khoa Y', 'Khoa Nông nghiệp', 'Khoa Sư phạm', 'Phòng KH'];

/**
 * Cấp đề tài phù hợp - Label mapping
 */
export const PROJECT_LEVEL_MAP: Record<ProjectLevel, { text: string; color: string }> = {
  TRUONG_THUONG_NIEN: { text: 'Cấp trường thường niên', color: 'blue' },
  TRUONG_DAT_HANG: { text: 'Cấp trường đặt hàng', color: 'cyan' },
  DAI_HOC_DA_NANG: { text: 'Cấp Đại học Đà Nẵng', color: 'geekblue' },
  BO_GDDT: { text: 'Cấp Bộ GD&ĐT', color: 'purple' },
  NHA_NUOC: { text: 'Cấp Nhà nước', color: 'magenta' },
  NAFOSTED: { text: 'NAFOSTED', color: 'volcano' },
  TINH_THANH_PHO: { text: 'Cấp Tỉnh/Thành phố', color: 'orange' },
  DOANH_NGHIEP: { text: 'Doanh nghiệp', color: 'gold' },
};

export const PROJECT_LEVELS: ProjectLevel[] = [
  'TRUONG_THUONG_NIEN',
  'TRUONG_DAT_HANG',
  'DAI_HOC_DA_NANG',
  'BO_GDDT',
  'NHA_NUOC',
  'NAFOSTED',
  'TINH_THANH_PHO',
  'DOANH_NGHIEP',
];

/**
 * Trạng thái ý tưởng - Label mapping
 */
export const IDEA_STATUS_MAP: Record<IdeaStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Nháp', color: 'default' },
  SUBMITTED: { text: 'Đã gửi', color: 'processing' },
  REVIEWING: { text: 'Đang sơ loại', color: 'warning' },
  APPROVED_INTERNAL: { text: 'Đã sơ loại', color: 'cyan' },
  PROPOSED_FOR_ORDER: { text: 'Đã đề xuất đặt hàng', color: 'geekblue' },
  APPROVED_FOR_ORDER: { text: 'Đã phê duyệt đặt hàng', color: 'success' },
  REJECTED: { text: 'Từ chối', color: 'error' },
};

export const REJECT_STAGE_MAP: Record<RejectStage, string> = {
  PHONG_KH_SO_LOAI: 'Phòng KH từ chối (sơ loại)',
  HOI_DONG_DE_XUAT: 'Hội đồng KH&ĐT từ chối (đề xuất)',
  LANH_DAO_PHE_DUYET: 'Lãnh đạo từ chối (phê duyệt)',
};

export const IDEA_PRIORITY_MAP: Record<IdeaPriority, { text: string; color: string }> = {
  LOW: { text: 'Thấp', color: 'default' },
  MEDIUM: { text: 'Trung bình', color: 'blue' },
  HIGH: { text: 'Cao', color: 'red' },
};

// ========== MOCK DATA ==========

let mockIdeas: Idea[] = [
  {
    id: '1',
    code: 'YT-2024-001',
    title: 'Ứng dụng AI trong chẩn đoán bệnh lý hình ảnh',
    summary: 'Nghiên cứu và phát triển hệ thống AI hỗ trợ chẩn đoán bệnh lý qua hình ảnh y tế như X-quang, CT, MRI.',
    field: 'Y học',
    suitableLevels: ['BO_GDDT', 'NHA_NUOC'],
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    ownerId: 'user-1',
    ownerName: 'Nguyễn Văn A',
    ownerUnit: 'Khoa Y',
    status: 'SUBMITTED',
    priority: 'HIGH',
  },
  {
    id: '2',
    code: 'YT-2024-002',
    title: 'Phát triển nền tảng học trực tuyến thế hệ mới',
    summary: 'Xây dựng nền tảng e-learning với tính năng tương tác cao, hỗ trợ VR/AR trong giảng dạy.',
    field: 'Giáo dục',
    suitableLevels: ['TRUONG_THUONG_NIEN', 'DAI_HOC_DA_NANG'],
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-22T14:00:00Z',
    ownerId: 'user-2',
    ownerName: 'Trần Thị B',
    ownerUnit: 'Khoa Sư phạm',
    status: 'REVIEWING',
    priority: 'MEDIUM',
  },
  {
    id: '3',
    code: 'YT-2024-003',
    title: 'Nghiên cứu giống lúa chịu hạn mới',
    summary: 'Lai tạo và phát triển giống lúa có khả năng chịu hạn cao, phù hợp với biến đổi khí hậu.',
    field: 'Nông nghiệp',
    suitableLevels: ['NHA_NUOC', 'TINH_THANH_PHO'],
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
    ownerId: 'user-3',
    ownerName: 'Lê Văn C',
    ownerUnit: 'Khoa Nông nghiệp',
    status: 'APPROVED_INTERNAL',
    priority: 'HIGH',
    noteForReview: 'Ý tưởng rất tiềm năng, phù hợp với xu hướng nghiên cứu hiện tại.',
  },
  {
    id: '4',
    code: 'YT-2024-004',
    title: 'Blockchain trong quản lý chuỗi cung ứng',
    summary: 'Ứng dụng công nghệ blockchain để minh bạch hóa và tối ưu hóa chuỗi cung ứng.',
    field: 'Công nghệ thông tin',
    suitableLevels: ['TRUONG_THUONG_NIEN', 'DOANH_NGHIEP'],
    createdAt: '2024-02-10T11:00:00Z',
    updatedAt: '2024-02-10T11:00:00Z',
    ownerId: 'user-1',
    ownerName: 'Nguyễn Văn A',
    ownerUnit: 'Khoa CNTT',
    status: 'DRAFT',
  },
  {
    id: '5',
    code: 'YT-2024-005',
    title: 'Mô hình kinh tế tuần hoàn cho doanh nghiệp vừa và nhỏ',
    summary: 'Nghiên cứu và đề xuất mô hình kinh tế tuần hoàn phù hợp với SMEs Việt Nam.',
    field: 'Kinh tế',
    suitableLevels: ['TINH_THANH_PHO', 'DOANH_NGHIEP'],
    createdAt: '2024-02-15T14:00:00Z',
    updatedAt: '2024-02-20T09:00:00Z',
    ownerId: 'user-4',
    ownerName: 'Phạm Thị D',
    ownerUnit: 'Khoa Kinh tế',
    status: 'APPROVED_FOR_ORDER',
    priority: 'MEDIUM',
    noteForReview: 'Đề xuất rất phù hợp với nhu cầu địa phương.',
    linkedProjectId: 'DT-2024-001',
  },
  {
    id: '6',
    code: 'YT-2024-006',
    title: 'Hệ thống IoT giám sát môi trường nuôi trồng thủy sản',
    summary: 'Phát triển hệ thống IoT để giám sát và điều khiển tự động môi trường nuôi trồng thủy sản.',
    field: 'Nông nghiệp',
    suitableLevels: ['TRUONG_THUONG_NIEN', 'TRUONG_DAT_HANG'],
    createdAt: '2024-02-25T08:30:00Z',
    updatedAt: '2024-02-25T08:30:00Z',
    ownerId: 'user-5',
    ownerName: 'Hoàng Văn E',
    ownerUnit: 'Khoa Nông nghiệp',
    status: 'PROPOSED_FOR_ORDER',
    priority: 'HIGH',
    noteForReview: 'Ý tưởng có tính ứng dụng cao.',
  },
  {
    id: '7',
    code: 'YT-2024-007',
    title: 'Ứng dụng Machine Learning trong dự báo thị trường chứng khoán',
    summary: 'Xây dựng mô hình ML để dự báo xu hướng thị trường chứng khoán Việt Nam.',
    field: 'Kinh tế',
    suitableLevels: ['TRUONG_THUONG_NIEN'],
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    ownerId: 'user-2',
    ownerName: 'Trần Thị B',
    ownerUnit: 'Khoa Kinh tế',
    status: 'REJECTED',
    priority: 'LOW',
    rejectedStage: 'PHONG_KH_SO_LOAI',
    rejectedReason: 'Ý tưởng chưa khả thi do thiếu dữ liệu đầu vào và nguồn lực nghiên cứu.',
    rejectedByRole: 'PHONG_KH',
    rejectedAt: '2024-03-05T10:00:00Z',
  },
  {
    id: '8',
    code: 'YT-2024-008',
    title: 'Phần mềm quản lý bệnh viện thông minh',
    summary: 'Phát triển hệ thống quản lý bệnh viện tích hợp AI, hỗ trợ đặt lịch, quản lý bệnh án điện tử.',
    field: 'Y học',
    suitableLevels: ['BO_GDDT', 'TINH_THANH_PHO'],
    createdAt: '2024-03-05T09:00:00Z',
    updatedAt: '2024-03-05T09:00:00Z',
    ownerId: 'user-1',
    ownerName: 'Nguyễn Văn A',
    ownerUnit: 'Khoa Y',
    status: 'SUBMITTED',
    priority: 'HIGH',
  },
];

// ========== HELPER FUNCTIONS ==========

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const generateCode = () => {
  const year = new Date().getFullYear();
  const num = String(mockIdeas.length + 1).padStart(3, '0');
  return `YT-${year}-${num}`;
};

// ========== API FUNCTIONS ==========

/**
 * Query ideas with filters
 */
export async function queryIdeas(params: IdeaQueryParams = {}): Promise<{
  data: Idea[];
  total: number;
  success: boolean;
}> {
  await delay(300);
  
  let filtered = [...mockIdeas];
  
  // Filter by keyword
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(
      i => i.title.toLowerCase().includes(kw) || 
           i.code.toLowerCase().includes(kw) ||
           i.summary.toLowerCase().includes(kw)
    );
  }
  
  // Filter by field
  if (params.field) {
    filtered = filtered.filter(i => i.field === params.field);
  }
  
  // Filter by unit
  if (params.unit) {
    filtered = filtered.filter(i => i.ownerUnit === params.unit);
  }
  
  // Filter by status
  if (params.status) {
    filtered = filtered.filter(i => i.status === params.status);
  }
  
  // Filter by suitableLevels (multi-select - match ANY)
  if (params.suitableLevels && params.suitableLevels.length > 0) {
    filtered = filtered.filter(i => 
      i.suitableLevels.some(level => params.suitableLevels!.includes(level))
    );
  }
  
  // Filter by priority
  if (params.priority) {
    filtered = filtered.filter(i => i.priority === params.priority);
  }
  
  // Filter by owner
  if (params.ownerId) {
    filtered = filtered.filter(i => i.ownerId === params.ownerId);
  }
  
  // Sort by createdAt desc
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const total = filtered.length;
  
  // Pagination
  const current = params.current || 1;
  const pageSize = params.pageSize || 10;
  const start = (current - 1) * pageSize;
  const end = start + pageSize;
  const data = filtered.slice(start, end);
  
  return { data, total, success: true };
}

/**
 * Get idea by ID
 */
export async function getIdea(id: string): Promise<{
  data: Idea | null;
  success: boolean;
}> {
  await delay(200);
  const idea = mockIdeas.find(i => i.id === id);
  return { data: idea || null, success: !!idea };
}

/**
 * Create new idea
 */
export async function createIdea(
  data: IdeaCreateData,
  ownerId: string,
  ownerName: string,
  ownerUnit: string
): Promise<{
  data: Idea;
  success: boolean;
}> {
  await delay(300);
  
  const now = new Date().toISOString();
  const newIdea: Idea = {
    id: generateId(),
    code: generateCode(),
    title: data.title,
    summary: data.summary,
    field: data.field,
    suitableLevels: data.suitableLevels,
    createdAt: now,
    updatedAt: now,
    ownerId,
    ownerName,
    ownerUnit,
    status: 'DRAFT',
  };
  
  mockIdeas.unshift(newIdea);
  return { data: newIdea, success: true };
}

/**
 * Update idea (only DRAFT)
 */
export async function updateIdea(
  id: string,
  data: Partial<IdeaCreateData>
): Promise<{
  data: Idea | null;
  success: boolean;
}> {
  await delay(300);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) {
    return { data: null, success: false };
  }
  
  const idea = mockIdeas[index];
  
  // Only allow update if DRAFT
  if (idea.status !== 'DRAFT') {
    return { data: null, success: false };
  }
  
  const updated: Idea = {
    ...idea,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * Delete idea (only DRAFT)
 */
export async function deleteIdea(id: string): Promise<{
  success: boolean;
}> {
  await delay(300);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) {
    return { success: false };
  }
  
  const idea = mockIdeas[index];
  
  // Only allow delete if DRAFT
  if (idea.status !== 'DRAFT') {
    return { success: false };
  }
  
  mockIdeas.splice(index, 1);
  return { success: true };
}

/**
 * Submit idea (DRAFT → SUBMITTED)
 */
export async function submitIdea(id: string): Promise<{
  data: Idea | null;
  success: boolean;
}> {
  await delay(300);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) {
    return { data: null, success: false };
  }
  
  const idea = mockIdeas[index];
  
  if (idea.status !== 'DRAFT') {
    return { data: null, success: false };
  }
  
  const updated: Idea = {
    ...idea,
    status: 'SUBMITTED',
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * Phòng KH: Tiếp nhận (SUBMITTED → REVIEWING)
 */
export async function receiveIdea(id: string): Promise<{
  data: Idea | null;
  success: boolean;
}> {
  await delay(300);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) return { data: null, success: false };
  
  const idea = mockIdeas[index];
  if (idea.status !== 'SUBMITTED') return { data: null, success: false };
  
  const updated: Idea = {
    ...idea,
    status: 'REVIEWING',
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * Phòng KH: Sơ loại xong (REVIEWING → APPROVED_INTERNAL)
 */
export async function approveInternalIdea(
  id: string,
  data: { priority?: IdeaPriority; noteForReview?: string }
): Promise<{
  data: Idea | null;
  success: boolean;
}> {
  await delay(300);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) return { data: null, success: false };
  
  const idea = mockIdeas[index];
  if (idea.status !== 'REVIEWING') return { data: null, success: false };
  
  const updated: Idea = {
    ...idea,
    status: 'APPROVED_INTERNAL',
    priority: data.priority || idea.priority,
    noteForReview: data.noteForReview || idea.noteForReview,
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * Hội đồng KH&ĐT: Đề xuất đặt hàng (APPROVED_INTERNAL → PROPOSED_FOR_ORDER)
 */
export async function proposeOrderIdea(
  id: string,
  data: { priority?: IdeaPriority; noteForReview?: string }
): Promise<{
  data: Idea | null;
  success: boolean;
}> {
  await delay(300);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) return { data: null, success: false };
  
  const idea = mockIdeas[index];
  if (idea.status !== 'APPROVED_INTERNAL') return { data: null, success: false };
  
  const updated: Idea = {
    ...idea,
    status: 'PROPOSED_FOR_ORDER',
    priority: data.priority || idea.priority,
    noteForReview: data.noteForReview || idea.noteForReview,
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * Lãnh đạo: Phê duyệt đặt hàng (PROPOSED_FOR_ORDER → APPROVED_FOR_ORDER)
 */
export async function approveOrderIdea(
  id: string,
  data: { noteForReview?: string }
): Promise<{
  data: Idea | null;
  success: boolean;
}> {
  await delay(300);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) return { data: null, success: false };
  
  const idea = mockIdeas[index];
  if (idea.status !== 'PROPOSED_FOR_ORDER') return { data: null, success: false };
  
  const updated: Idea = {
    ...idea,
    status: 'APPROVED_FOR_ORDER',
    noteForReview: data.noteForReview || idea.noteForReview,
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * Từ chối ý tưởng (Any → REJECTED)
 * ❌ KHÔNG cho nộp lại
 */
export async function rejectIdea(
  id: string,
  rejectData: {
    rejectedByRole: 'PHONG_KH' | 'HOI_DONG' | 'LANH_DAO';
    rejectedReason: string;
  }
): Promise<{
  data: Idea | null;
  success: boolean;
}> {
  await delay(300);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) return { data: null, success: false };
  
  const idea = mockIdeas[index];
  
  // Determine reject stage based on current status
  let rejectedStage: RejectStage;
  if (idea.status === 'REVIEWING' || idea.status === 'SUBMITTED') {
    rejectedStage = 'PHONG_KH_SO_LOAI';
  } else if (idea.status === 'APPROVED_INTERNAL') {
    rejectedStage = 'HOI_DONG_DE_XUAT';
  } else if (idea.status === 'PROPOSED_FOR_ORDER') {
    rejectedStage = 'LANH_DAO_PHE_DUYET';
  } else {
    return { data: null, success: false };
  }
  
  const updated: Idea = {
    ...idea,
    status: 'REJECTED',
    rejectedStage,
    rejectedReason: rejectData.rejectedReason,
    rejectedByRole: rejectData.rejectedByRole,
    rejectedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * ACTION: Khởi tạo đề tài từ ý tưởng
 * Điều kiện: status === APPROVED_FOR_ORDER
 * NOTE: "Khởi tạo đề tài" là ACTION, không phải STATUS
 */
export async function createProjectFromIdea(id: string): Promise<{
  data: Idea | null;
  projectId: string | null;
  success: boolean;
}> {
  await delay(500);
  
  const index = mockIdeas.findIndex(i => i.id === id);
  if (index === -1) {
    return { data: null, projectId: null, success: false };
  }
  
  const idea = mockIdeas[index];
  
  // Only allow if APPROVED_FOR_ORDER
  if (idea.status !== 'APPROVED_FOR_ORDER') {
    return { data: null, projectId: null, success: false };
  }
  
  // Already has linked project
  if (idea.linkedProjectId) {
    return { data: idea, projectId: idea.linkedProjectId, success: false };
  }
  
  const projectId = `DT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
  const updated: Idea = {
    ...idea,
    linkedProjectId: projectId,
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, projectId, success: true };
}

// ========== COUNCIL SCORING API ==========

/**
 * Cập nhật kết quả chấm điểm Hội đồng vào ý tưởng
 */
export async function updateIdeaCouncilResult(
  ideaId: string,
  councilData: {
    councilSessionId: string;
    councilAvgWeightedScore: number;
    councilAvgNoveltyScore: number;
    councilAvgFeasibilityScore: number;
    councilAvgAlignmentScore: number;
    councilAvgAuthorCapacityScore: number;
    councilSubmittedCount: number;
    councilMemberCount: number;
    councilRecommendation: 'PROPOSE_ORDER' | 'NOT_PROPOSE';
  }
): Promise<{ data: Idea | null; success: boolean }> {
  await delay(200);

  const index = mockIdeas.findIndex(i => i.id === ideaId);
  if (index === -1) {
    return { data: null, success: false };
  }

  const idea = mockIdeas[index];
  const now = new Date().toISOString();

  // Cập nhật status dựa trên kết quả
  let newStatus: IdeaStatus = idea.status;
  let rejectedStage: RejectStage | undefined = undefined;
  let rejectedReason: string | undefined = undefined;
  let rejectedByRole: 'PHONG_KH' | 'HOI_DONG' | 'LANH_DAO' | undefined = undefined;
  let rejectedAt: string | undefined = undefined;

  if (councilData.councilRecommendation === 'PROPOSE_ORDER') {
    newStatus = 'PROPOSED_FOR_ORDER';
  } else {
    newStatus = 'REJECTED';
    rejectedStage = 'HOI_DONG_DE_XUAT';
    rejectedReason = `Điểm trung bình ${councilData.councilAvgWeightedScore.toFixed(2)}/10 không đạt ngưỡng 7.0`;
    rejectedByRole = 'HOI_DONG';
    rejectedAt = now;
  }

  const updated: Idea = {
    ...idea,
    status: newStatus,
    councilSessionId: councilData.councilSessionId,
    councilAvgWeightedScore: councilData.councilAvgWeightedScore,
    councilAvgNoveltyScore: councilData.councilAvgNoveltyScore,
    councilAvgFeasibilityScore: councilData.councilAvgFeasibilityScore,
    councilAvgAlignmentScore: councilData.councilAvgAlignmentScore,
    councilAvgAuthorCapacityScore: councilData.councilAvgAuthorCapacityScore,
    councilSubmittedCount: councilData.councilSubmittedCount,
    councilMemberCount: councilData.councilMemberCount,
    councilRecommendation: councilData.councilRecommendation,
    councilScoredAt: now,
    rejectedStage,
    rejectedReason,
    rejectedByRole,
    rejectedAt,
    updatedAt: now,
  };

  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * Lấy ý tưởng theo ID (để dùng trong ideaCouncil)
 */
export async function getIdeaById(id: string): Promise<{ data: Idea | null; success: boolean }> {
  await delay(100);
  const idea = mockIdeas.find(i => i.id === id);
  return { data: idea || null, success: !!idea };
}

/**
 * Export mockIdeas để các service khác có thể truy cập
 */
export { mockIdeas };
