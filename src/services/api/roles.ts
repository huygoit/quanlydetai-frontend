/**
 * Roles API Service (Quản lý vai trò)
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

// Types
export type RoleStatus = 'ACTIVE' | 'INACTIVE';

export interface RoleItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: RoleStatus;
  created_at?: string;
  updated_at?: string;
}

export interface QueryRolesParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  code?: string;
  name?: string;
  status?: RoleStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateRolePayload {
  code: string;
  name: string;
  description?: string;
  status?: RoleStatus;
}

export interface UpdateRolePayload {
  code?: string;
  name?: string;
  description?: string;
  status?: RoleStatus;
}

export interface UpdateRoleStatusPayload {
  status: RoleStatus;
}

export interface UpdateRolePermissionsPayload {
  permission_ids: number[];
}

// Constants
export const ROLE_STATUS_MAP: Record<RoleStatus, { text: string; color: string; status: string }> = {
  ACTIVE: { text: 'Hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

export const ROLE_STATUS_OPTIONS = Object.entries(ROLE_STATUS_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

// API Functions

/**
 * Lấy danh sách vai trò
 */
export async function queryRoles(params?: QueryRolesParams): Promise<PaginatedResponse<RoleItem>> {
  return get<PaginatedResponse<RoleItem>>('/api/admin/roles', params);
}

/**
 * Lấy chi tiết vai trò
 */
export async function getRoleDetail(id: number): Promise<ApiResponse<RoleItem>> {
  return get<ApiResponse<RoleItem>>(`/api/admin/roles/${id}`);
}

/**
 * Tạo vai trò mới
 */
export async function createRole(payload: CreateRolePayload): Promise<ApiResponse<RoleItem>> {
  return post<ApiResponse<RoleItem>>('/api/admin/roles', payload);
}

/**
 * Cập nhật vai trò
 */
export async function updateRole(id: number, payload: UpdateRolePayload): Promise<ApiResponse<RoleItem>> {
  return put<ApiResponse<RoleItem>>(`/api/admin/roles/${id}`, payload);
}

/**
 * Đổi trạng thái vai trò
 */
export async function updateRoleStatus(id: number, payload: UpdateRoleStatusPayload): Promise<ApiResponse<RoleItem>> {
  return patch<ApiResponse<RoleItem>>(`/api/admin/roles/${id}/status`, payload);
}

/**
 * Lấy danh sách permission của role
 */
export async function getRolePermissions(id: number): Promise<ApiResponse<number[]>> {
  return get<ApiResponse<number[]>>(`/api/admin/roles/${id}/permissions`);
}

/**
 * Cập nhật permissions cho role
 */
export async function updateRolePermissions(id: number, payload: UpdateRolePermissionsPayload): Promise<ApiResponse<any>> {
  return put<ApiResponse<any>>(`/api/admin/roles/${id}/permissions`, payload);
}

/**
 * Lấy tất cả roles (không phân trang) để dùng cho select
 */
export async function getAllRoles(): Promise<ApiResponse<RoleItem[]>> {
  return get<ApiResponse<RoleItem[]>>('/api/admin/roles/all');
}
