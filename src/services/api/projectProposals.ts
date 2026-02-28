/**
 * Project Proposals API Service (Đăng ký đề xuất đề tài)
 */
import { get, post, put, del, ApiResponse, PaginatedResponse } from '../request';

// Types
export type ProposalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNIT_REVIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type ProposalLevel = 'CO_SO' | 'TRUONG' | 'BO' | 'NHA_NUOC';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ProjectProposal {
  id: number;
  code: string;
  title: string;
  field: string;
  level: ProposalLevel;
  year: number;
  durationMonths: number;
  keywords?: string[];
  createdAt: string;
  updatedAt: string;
  ownerId: number;
  ownerName: string;
  ownerEmail?: string;
  ownerUnit: string;
  coAuthors?: string[];
  objectives: string;
  summary: string;
  contentOutline?: string;
  expectedResults?: string;
  applicationPotential?: string;
  requestedBudgetTotal?: number;
  requestedBudgetDetail?: string;
  status: ProposalStatus;
  unitComment?: string;
  unitApproved?: boolean;
  sciDeptComment?: string;
  sciDeptPriority?: Priority;
}

export interface ProposalQueryParams {
  keyword?: string;
  year?: number;
  status?: ProposalStatus;
  level?: ProposalLevel;
  field?: string;
  unit?: string;
  ownerOnly?: boolean;
  page?: number;
  perPage?: number;
}

export interface ProposalCreateData {
  title: string;
  field: string;
  level: ProposalLevel;
  year: number;
  durationMonths: number;
  keywords?: string[];
  coAuthors?: string[];
  objectives: string;
  summary: string;
  contentOutline?: string;
  expectedResults?: string;
  applicationPotential?: string;
  requestedBudgetTotal?: number;
  requestedBudgetDetail?: string;
}

// API Functions

/**
 * Lấy danh sách đề xuất
 */
export async function queryProposals(params?: ProposalQueryParams): Promise<PaginatedResponse<ProjectProposal>> {
  return get<PaginatedResponse<ProjectProposal>>('/api/project-proposals', params);
}

/**
 * Lấy chi tiết đề xuất
 */
export async function getProposal(id: number): Promise<ApiResponse<ProjectProposal>> {
  return get<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}`);
}

/**
 * Tạo đề xuất mới
 */
export async function createProposal(data: ProposalCreateData): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>('/api/project-proposals', data);
}

/**
 * Cập nhật đề xuất (chỉ DRAFT)
 */
export async function updateProposal(id: number, data: Partial<ProposalCreateData>): Promise<ApiResponse<ProjectProposal>> {
  return put<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}`, data);
}

/**
 * Xóa đề xuất (chỉ DRAFT)
 */
export async function deleteProposal(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/project-proposals/${id}`);
}

/**
 * Gửi đề xuất (DRAFT → SUBMITTED)
 */
export async function submitProposal(id: number): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/submit`);
}

/**
 * Rút đề xuất (SUBMITTED → WITHDRAWN)
 */
export async function withdrawProposal(id: number): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/withdraw`);
}

/**
 * Trưởng đơn vị: Cho ý kiến (SUBMITTED → UNIT_REVIEWED)
 */
export async function unitReviewProposal(
  id: number,
  data: { unitApproved: boolean; unitComment?: string }
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/unit-review`, data);
}

/**
 * Phòng KH: Phê duyệt hoặc từ chối (UNIT_REVIEWED → APPROVED/REJECTED)
 */
export async function sciDeptReviewProposal(
  id: number,
  data: {
    status: 'APPROVED' | 'REJECTED';
    sciDeptPriority?: Priority;
    sciDeptComment?: string;
  }
): Promise<ApiResponse<ProjectProposal>> {
  return post<ApiResponse<ProjectProposal>>(`/api/project-proposals/${id}/sci-dept-review`, data);
}

// Constants
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
  { code: 'CO_SO' as ProposalLevel, name: 'Cấp cơ sở' },
  { code: 'TRUONG' as ProposalLevel, name: 'Cấp Trường' },
  { code: 'BO' as ProposalLevel, name: 'Cấp Bộ' },
  { code: 'NHA_NUOC' as ProposalLevel, name: 'Cấp Nhà nước' },
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

export const PRIORITY_OPTIONS: { label: string; value: Priority; color: string }[] = [
  { label: 'Thấp', value: 'LOW', color: 'default' },
  { label: 'Trung bình', value: 'MEDIUM', color: 'blue' },
  { label: 'Cao', value: 'HIGH', color: 'red' },
];

export const PROPOSAL_STATUS_MAP: Record<ProposalStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'default' },
  SUBMITTED: { label: 'Đã gửi', color: 'processing' },
  UNIT_REVIEWED: { label: 'Đơn vị đã duyệt', color: 'cyan' },
  APPROVED: { label: 'Đã phê duyệt', color: 'success' },
  REJECTED: { label: 'Không phê duyệt', color: 'error' },
  WITHDRAWN: { label: 'Đã rút', color: 'warning' },
};
