/**
 * Ideas API Service (Ngân hàng ý tưởng)
 */
import { get, post, put, del, ApiResponse, PaginatedResponse } from '../request';

// Types
export type ProjectLevel =
  | 'TRUONG_THUONG_NIEN'
  | 'TRUONG_DAT_HANG'
  | 'DAI_HOC_DA_NANG'
  | 'BO_GDDT'
  | 'NHA_NUOC'
  | 'NAFOSTED'
  | 'TINH_THANH_PHO'
  | 'DOANH_NGHIEP';

export type IdeaStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'APPROVED_INTERNAL'
  | 'PROPOSED_FOR_ORDER'
  | 'APPROVED_FOR_ORDER'
  | 'REJECTED';

export type IdeaPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type RejectStage =
  | 'PHONG_KH_SO_LOAI'
  | 'HOI_DONG_DE_XUAT'
  | 'LANH_DAO_PHE_DUYET';

export interface Idea {
  id: number;
  code: string;
  title: string;
  summary: string;
  field: string;
  suitableLevels: ProjectLevel[];
  ownerId: number;
  ownerName: string;
  ownerUnit: string;
  status: IdeaStatus;
  priority?: IdeaPriority;
  noteForReview?: string;
  rejectedStage?: RejectStage;
  rejectedReason?: string;
  rejectedByRole?: 'PHONG_KH' | 'HOI_DONG' | 'LANH_DAO';
  rejectedAt?: string;
  linkedProjectId?: string;
  councilSessionId?: number;
  councilAvgWeightedScore?: number;
  councilAvgNoveltyScore?: number;
  councilAvgFeasibilityScore?: number;
  councilAvgAlignmentScore?: number;
  councilAvgAuthorCapacityScore?: number;
  councilSubmittedCount?: number;
  councilMemberCount?: number;
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
  ownerId?: number;
  page?: number;
  perPage?: number;
}

export interface IdeaCreateData {
  title: string;
  field: string;
  suitableLevels: ProjectLevel[];
  summary: string;
}

// API Functions

/**
 * Lấy danh sách ý tưởng (tất cả / filter - dùng cho Danh sách ý tưởng)
 */
export async function queryIdeas(params?: IdeaQueryParams): Promise<PaginatedResponse<Idea>> {
  return get<PaginatedResponse<Idea>>('/api/ideas', params);
}

/**
 * Lấy danh sách ý tưởng của tôi (chỉ của user đang đăng nhập)
 */
export async function queryMyIdeas(params?: Omit<IdeaQueryParams, 'ownerId'>): Promise<PaginatedResponse<Idea>> {
  return get<PaginatedResponse<Idea>>('/api/ideas/my', params);
}

/**
 * Lấy chi tiết ý tưởng
 */
export async function getIdea(id: number): Promise<ApiResponse<Idea>> {
  return get<ApiResponse<Idea>>(`/api/ideas/${id}`);
}

/**
 * Tạo ý tưởng mới
 */
export async function createIdea(data: IdeaCreateData): Promise<ApiResponse<Idea>> {
  return post<ApiResponse<Idea>>('/api/ideas', data);
}

/**
 * Cập nhật ý tưởng (chỉ DRAFT)
 */
export async function updateIdea(id: number, data: Partial<IdeaCreateData>): Promise<ApiResponse<Idea>> {
  return put<ApiResponse<Idea>>(`/api/ideas/${id}`, data);
}

/**
 * Xóa ý tưởng (chỉ DRAFT)
 */
export async function deleteIdea(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/ideas/${id}`);
}

/**
 * Gửi ý tưởng (DRAFT → SUBMITTED)
 */
export async function submitIdea(id: number): Promise<ApiResponse<Idea>> {
  return post<ApiResponse<Idea>>(`/api/ideas/${id}/submit`);
}

/**
 * Phòng KH: Tiếp nhận (SUBMITTED → REVIEWING)
 */
export async function receiveIdea(id: number): Promise<ApiResponse<Idea>> {
  return post<ApiResponse<Idea>>(`/api/ideas/${id}/receive`);
}

/**
 * Phòng KH: Sơ loại xong (REVIEWING → APPROVED_INTERNAL)
 */
export async function approveInternalIdea(
  id: number,
  data: { priority?: IdeaPriority; noteForReview?: string }
): Promise<ApiResponse<Idea>> {
  return post<ApiResponse<Idea>>(`/api/ideas/${id}/approve-internal`, data);
}

/**
 * Hội đồng: Đề xuất đặt hàng (APPROVED_INTERNAL → PROPOSED_FOR_ORDER)
 */
export async function proposeOrderIdea(
  id: number,
  data: { priority?: IdeaPriority; noteForReview?: string }
): Promise<ApiResponse<Idea>> {
  return post<ApiResponse<Idea>>(`/api/ideas/${id}/propose-order`, data);
}

/**
 * Lãnh đạo: Phê duyệt đặt hàng (PROPOSED_FOR_ORDER → APPROVED_FOR_ORDER)
 */
export async function approveOrderIdea(
  id: number,
  data: { noteForReview?: string }
): Promise<ApiResponse<Idea>> {
  return post<ApiResponse<Idea>>(`/api/ideas/${id}/approve-order`, data);
}

/**
 * Từ chối ý tưởng
 */
export async function rejectIdea(
  id: number,
  data: { rejectedReason: string; rejectedByRole?: 'PHONG_KH' | 'HOI_DONG' | 'LANH_DAO' }
): Promise<ApiResponse<Idea>> {
  return post<ApiResponse<Idea>>(`/api/ideas/${id}/reject`, data);
}

/**
 * Khởi tạo đề tài từ ý tưởng
 */
export async function createProjectFromIdea(
  id: number
): Promise<ApiResponse<{ ideaId: number; linkedProjectId: string }>> {
  return post<ApiResponse<{ ideaId: number; linkedProjectId: string }>>(`/api/ideas/${id}/create-project`);
}

// Constants
export const IDEA_FIELDS = ['Công nghệ thông tin', 'Kinh tế', 'Y học', 'Nông nghiệp', 'Giáo dục', 'Kỹ thuật'];
export const IDEA_UNITS = ['Khoa CNTT', 'Khoa Kinh tế', 'Khoa Y', 'Khoa Nông nghiệp', 'Khoa Sư phạm', 'Phòng KH'];

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

export const IDEA_STATUS_MAP: Record<IdeaStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Nháp', color: 'default' },
  SUBMITTED: { text: 'Đã gửi', color: 'processing' },
  REVIEWING: { text: 'Đang sơ loại', color: 'warning' },
  APPROVED_INTERNAL: { text: 'Đã sơ loại', color: 'cyan' },
  PROPOSED_FOR_ORDER: { text: 'Đã đề xuất đặt hàng', color: 'geekblue' },
  APPROVED_FOR_ORDER: { text: 'Đã phê duyệt đặt hàng', color: 'success' },
  REJECTED: { text: 'Từ chối', color: 'error' },
};

export const IDEA_PRIORITY_MAP: Record<IdeaPriority, { text: string; color: string }> = {
  LOW: { text: 'Thấp', color: 'default' },
  MEDIUM: { text: 'Trung bình', color: 'blue' },
  HIGH: { text: 'Cao', color: 'red' },
};
