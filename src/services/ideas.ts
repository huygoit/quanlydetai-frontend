/**
 * Mock Service - Ngân hàng ý tưởng
 * Theo specs/ideas.md
 */

// ========== TYPES ==========

export type IdeaStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'REVIEWING' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CONVERTED';

export type IdeaPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Idea {
  id: string;
  code: string;
  title: string;
  summary: string;
  field: string;
  level: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  ownerUnit: string;
  status: IdeaStatus;
  priority?: IdeaPriority;
  tags?: string[];
  expectedOutput?: string;
  noteForReview?: string;
  convertedProjectId?: string;
}

export interface IdeaQueryParams {
  keyword?: string;
  field?: string;
  unit?: string;
  status?: IdeaStatus;
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
  level: string;
  summary: string;
  tags?: string[];
  expectedOutput?: string;
}

export interface IdeaReviewData {
  status: IdeaStatus;
  priority?: IdeaPriority;
  noteForReview?: string;
}

// ========== MOCK DATA ==========

const FIELDS = ['Công nghệ thông tin', 'Kinh tế', 'Y học', 'Nông nghiệp', 'Giáo dục', 'Kỹ thuật'];
const UNITS = ['Khoa CNTT', 'Khoa Kinh tế', 'Khoa Y', 'Khoa Nông nghiệp', 'Khoa Sư phạm', 'Phòng KH'];
const LEVELS = ['Cấp cơ sở', 'Cấp Bộ', 'Cấp Nhà nước', 'Cấp Tỉnh'];

// Mock ideas data
let mockIdeas: Idea[] = [
  {
    id: '1',
    code: 'YT-2024-001',
    title: 'Ứng dụng AI trong chẩn đoán bệnh lý hình ảnh',
    summary: 'Nghiên cứu và phát triển hệ thống AI hỗ trợ chẩn đoán bệnh lý qua hình ảnh y tế như X-quang, CT, MRI.',
    field: 'Y học',
    level: 'Cấp Bộ',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
    ownerId: 'user-1',
    ownerName: 'Nguyễn Văn A',
    ownerUnit: 'Khoa Y',
    status: 'SUBMITTED',
    priority: 'HIGH',
    tags: ['AI', 'Y tế', 'Hình ảnh'],
    expectedOutput: 'Hệ thống phần mềm AI hỗ trợ chẩn đoán',
  },
  {
    id: '2',
    code: 'YT-2024-002',
    title: 'Phát triển nền tảng học trực tuyến thế hệ mới',
    summary: 'Xây dựng nền tảng e-learning với tính năng tương tác cao, hỗ trợ VR/AR trong giảng dạy.',
    field: 'Giáo dục',
    level: 'Cấp cơ sở',
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-22T14:00:00Z',
    ownerId: 'user-2',
    ownerName: 'Trần Thị B',
    ownerUnit: 'Khoa Sư phạm',
    status: 'REVIEWING',
    priority: 'MEDIUM',
    tags: ['E-learning', 'VR', 'AR'],
    expectedOutput: 'Nền tảng học trực tuyến với VR/AR',
  },
  {
    id: '3',
    code: 'YT-2024-003',
    title: 'Nghiên cứu giống lúa chịu hạn mới',
    summary: 'Lai tạo và phát triển giống lúa có khả năng chịu hạn cao, phù hợp với biến đổi khí hậu.',
    field: 'Nông nghiệp',
    level: 'Cấp Nhà nước',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-01T09:00:00Z',
    ownerId: 'user-3',
    ownerName: 'Lê Văn C',
    ownerUnit: 'Khoa Nông nghiệp',
    status: 'APPROVED',
    priority: 'HIGH',
    tags: ['Nông nghiệp', 'Biến đổi khí hậu'],
    expectedOutput: 'Giống lúa mới chịu hạn',
    noteForReview: 'Ý tưởng rất tiềm năng, cần triển khai sớm.',
  },
  {
    id: '4',
    code: 'YT-2024-004',
    title: 'Blockchain trong quản lý chuỗi cung ứng',
    summary: 'Ứng dụng công nghệ blockchain để minh bạch hóa và tối ưu hóa chuỗi cung ứng.',
    field: 'Công nghệ thông tin',
    level: 'Cấp cơ sở',
    createdAt: '2024-02-10T11:00:00Z',
    updatedAt: '2024-02-10T11:00:00Z',
    ownerId: 'user-1',
    ownerName: 'Nguyễn Văn A',
    ownerUnit: 'Khoa CNTT',
    status: 'DRAFT',
    tags: ['Blockchain', 'Supply chain'],
    expectedOutput: 'Hệ thống quản lý chuỗi cung ứng trên blockchain',
  },
  {
    id: '5',
    code: 'YT-2024-005',
    title: 'Mô hình kinh tế tuần hoàn cho doanh nghiệp vừa và nhỏ',
    summary: 'Nghiên cứu và đề xuất mô hình kinh tế tuần hoàn phù hợp với SMEs Việt Nam.',
    field: 'Kinh tế',
    level: 'Cấp Tỉnh',
    createdAt: '2024-02-15T14:00:00Z',
    updatedAt: '2024-02-20T09:00:00Z',
    ownerId: 'user-4',
    ownerName: 'Phạm Thị D',
    ownerUnit: 'Khoa Kinh tế',
    status: 'CONVERTED',
    priority: 'MEDIUM',
    tags: ['Kinh tế tuần hoàn', 'SMEs'],
    expectedOutput: 'Bộ công cụ áp dụng kinh tế tuần hoàn cho SMEs',
    convertedProjectId: 'DT-2024-001',
  },
  {
    id: '6',
    code: 'YT-2024-006',
    title: 'Hệ thống IoT giám sát môi trường nuôi trồng thủy sản',
    summary: 'Phát triển hệ thống IoT để giám sát và điều khiển tự động môi trường nuôi trồng thủy sản.',
    field: 'Nông nghiệp',
    level: 'Cấp cơ sở',
    createdAt: '2024-02-25T08:30:00Z',
    updatedAt: '2024-02-25T08:30:00Z',
    ownerId: 'user-5',
    ownerName: 'Hoàng Văn E',
    ownerUnit: 'Khoa Nông nghiệp',
    status: 'SUBMITTED',
    priority: 'LOW',
    tags: ['IoT', 'Thủy sản', 'Tự động hóa'],
    expectedOutput: 'Hệ thống IoT giám sát ao nuôi',
  },
  {
    id: '7',
    code: 'YT-2024-007',
    title: 'Ứng dụng Machine Learning trong dự báo thị trường chứng khoán',
    summary: 'Xây dựng mô hình ML để dự báo xu hướng thị trường chứng khoán Việt Nam.',
    field: 'Kinh tế',
    level: 'Cấp cơ sở',
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-01T10:00:00Z',
    ownerId: 'user-2',
    ownerName: 'Trần Thị B',
    ownerUnit: 'Khoa Kinh tế',
    status: 'REJECTED',
    priority: 'LOW',
    tags: ['Machine Learning', 'Chứng khoán'],
    expectedOutput: 'Mô hình dự báo thị trường',
    noteForReview: 'Ý tưởng chưa khả thi do thiếu dữ liệu đầu vào.',
  },
  {
    id: '8',
    code: 'YT-2024-008',
    title: 'Phần mềm quản lý bệnh viện thông minh',
    summary: 'Phát triển hệ thống quản lý bệnh viện tích hợp AI, hỗ trợ đặt lịch, quản lý bệnh án điện tử.',
    field: 'Y học',
    level: 'Cấp Bộ',
    createdAt: '2024-03-05T09:00:00Z',
    updatedAt: '2024-03-05T09:00:00Z',
    ownerId: 'user-1',
    ownerName: 'Nguyễn Văn A',
    ownerUnit: 'Khoa Y',
    status: 'SUBMITTED',
    priority: 'HIGH',
    tags: ['Bệnh viện', 'AI', 'Quản lý'],
    expectedOutput: 'Phần mềm quản lý bệnh viện',
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
    level: data.level,
    createdAt: now,
    updatedAt: now,
    ownerId,
    ownerName,
    ownerUnit,
    status: 'DRAFT',
    tags: data.tags || [],
    expectedOutput: data.expectedOutput || '',
  };
  
  mockIdeas.unshift(newIdea);
  return { data: newIdea, success: true };
}

/**
 * Update idea
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
  
  // Only allow update if DRAFT or SUBMITTED
  if (!['DRAFT', 'SUBMITTED'].includes(idea.status)) {
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
 * Submit idea (change from DRAFT to SUBMITTED)
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
 * Review idea (change status, priority, note)
 */
export async function reviewIdea(
  id: string,
  data: IdeaReviewData
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
  
  const updated: Idea = {
    ...idea,
    status: data.status,
    priority: data.priority || idea.priority,
    noteForReview: data.noteForReview || idea.noteForReview,
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, success: true };
}

/**
 * Convert idea to project
 */
export async function convertIdeaToProject(id: string): Promise<{
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
  
  // Only allow convert if APPROVED
  if (idea.status !== 'APPROVED') {
    return { data: null, projectId: null, success: false };
  }
  
  const projectId = `DT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
  const updated: Idea = {
    ...idea,
    status: 'CONVERTED',
    convertedProjectId: projectId,
    updatedAt: new Date().toISOString(),
  };
  
  mockIdeas[index] = updated;
  return { data: updated, projectId, success: true };
}

// ========== CONSTANTS EXPORTS ==========

export const IDEA_FIELDS = FIELDS;
export const IDEA_UNITS = UNITS;
export const IDEA_LEVELS = LEVELS;

export const IDEA_STATUS_MAP: Record<IdeaStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Nháp', color: 'default' },
  SUBMITTED: { text: 'Đã gửi', color: 'processing' },
  REVIEWING: { text: 'Đang xét', color: 'warning' },
  APPROVED: { text: 'Đã duyệt', color: 'success' },
  REJECTED: { text: 'Từ chối', color: 'error' },
  CONVERTED: { text: 'Đã chuyển đề tài', color: 'purple' },
};

export const IDEA_PRIORITY_MAP: Record<IdeaPriority, { text: string; color: string }> = {
  LOW: { text: 'Thấp', color: 'default' },
  MEDIUM: { text: 'Trung bình', color: 'blue' },
  HIGH: { text: 'Cao', color: 'red' },
};


