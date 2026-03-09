/**
 * Departments API Service (Quản lý đơn vị)
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

// Types
export type DepartmentType = 
  | 'UNIVERSITY'
  | 'BOARD'
  | 'OFFICE'
  | 'FACULTY'
  | 'CENTER'
  | 'COUNCIL'
  | 'OTHER';

export type DepartmentStatus = 'ACTIVE' | 'INACTIVE';

export interface Department {
  id: number;
  code: string;
  name: string;
  short_name: string;
  type: DepartmentType;
  display_order: number;
  status: DepartmentStatus;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface QueryDepartmentsParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  type?: DepartmentType;
  status?: DepartmentStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateDepartmentPayload {
  code: string;
  name: string;
  short_name?: string;
  type: DepartmentType;
  display_order?: number;
  status?: DepartmentStatus;
  note?: string;
}

export interface UpdateDepartmentPayload {
  code?: string;
  name?: string;
  short_name?: string;
  type?: DepartmentType;
  display_order?: number;
  status?: DepartmentStatus;
  note?: string;
}

export interface UpdateDepartmentStatusPayload {
  status: DepartmentStatus;
}

// Constants - Type Map
export const DEPARTMENT_TYPE_MAP: Record<DepartmentType, { text: string; color: string }> = {
  UNIVERSITY: { text: 'Trường', color: 'purple' },
  BOARD: { text: 'Ban', color: 'blue' },
  OFFICE: { text: 'Phòng', color: 'cyan' },
  FACULTY: { text: 'Khoa', color: 'green' },
  CENTER: { text: 'Trung tâm', color: 'orange' },
  COUNCIL: { text: 'Hội đồng', color: 'gold' },
  OTHER: { text: 'Khác', color: 'default' },
};

// Constants - Status Map
export const DEPARTMENT_STATUS_MAP: Record<DepartmentStatus, { text: string; color: string; status: string }> = {
  ACTIVE: { text: 'Đang hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

// Options for Select components
export const DEPARTMENT_TYPE_OPTIONS = Object.entries(DEPARTMENT_TYPE_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

export const DEPARTMENT_STATUS_OPTIONS = Object.entries(DEPARTMENT_STATUS_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

// API Functions

/**
 * Lấy danh sách đơn vị (có phân trang và lọc)
 */
export async function queryDepartments(
  params?: QueryDepartmentsParams
): Promise<PaginatedResponse<Department>> {
  return get<PaginatedResponse<Department>>('/api/admin/departments', params);
}

/**
 * Lấy chi tiết một đơn vị
 */
export async function getDepartment(id: number): Promise<ApiResponse<Department>> {
  return get<ApiResponse<Department>>(`/api/admin/departments/${id}`);
}

/**
 * Tạo đơn vị mới
 */
export async function createDepartment(
  payload: CreateDepartmentPayload
): Promise<ApiResponse<Department>> {
  return post<ApiResponse<Department>>('/api/admin/departments', payload);
}

/**
 * Cập nhật thông tin đơn vị
 */
export async function updateDepartment(
  id: number,
  payload: UpdateDepartmentPayload
): Promise<ApiResponse<Department>> {
  return put<ApiResponse<Department>>(`/api/admin/departments/${id}`, payload);
}

/**
 * Đổi trạng thái đơn vị (ACTIVE/INACTIVE)
 */
export async function updateDepartmentStatus(
  id: number,
  payload: UpdateDepartmentStatusPayload
): Promise<ApiResponse<Department>> {
  return patch<ApiResponse<Department>>(`/api/admin/departments/${id}/status`, payload);
}
