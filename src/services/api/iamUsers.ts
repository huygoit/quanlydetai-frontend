/**
 * IAM Users API Service (Quản lý người dùng IAM)
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';
import type { RoleItem } from './roles';

// Types
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'LOCKED';

export interface DepartmentOption {
  id: number;
  name: string;
  code?: string;
}

export interface UserRoleItem {
  id: number;
  code: string;
  name: string;
}

export interface IAMUserItem {
  id: number;
  username?: string;
  full_name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  status: UserStatus;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
  department?: DepartmentOption;
  roles?: UserRoleItem[];
  note?: string;
}

export interface QueryIAMUsersParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  username?: string;
  full_name?: string;
  email?: string;
  department_id?: number;
  role_id?: number;
  status?: UserStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateUserPayload {
  username?: string;
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation?: string;
  department_id: number;
  role_ids?: number[];
  status: UserStatus;
  note?: string;
}

export interface UpdateUserPayload {
  username?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  department_id?: number;
  role_ids?: number[];
  status?: UserStatus;
  note?: string;
}

export interface ChangeUserStatusPayload {
  status: UserStatus;
}

export interface ResetPasswordPayload {
  new_password: string;
}

export interface AssignRolesPayload {
  role_ids: number[];
}

// Constants
export const USER_STATUS_MAP: Record<UserStatus, { text: string; color: string; status: string }> = {
  ACTIVE: { text: 'Hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
  LOCKED: { text: 'Bị khóa', color: 'error', status: 'error' },
};

export const USER_STATUS_OPTIONS = Object.entries(USER_STATUS_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

// API Functions

/**
 * Lấy danh sách users (có phân trang)
 */
export async function queryIAMUsers(params?: QueryIAMUsersParams): Promise<any> {
  const q: Record<string, any> = {};
  if (params?.page != null) q.page = params.page;
  if (params?.perPage != null) q.per_page = params.perPage;
  if (params?.keyword) q.keyword = params.keyword;
  if (params?.full_name) q.full_name = params.full_name;
  if (params?.email) q.email = params.email;
  if (params?.department_id != null) q.department_id = params.department_id;
  if (params?.role_id != null) q.role_id = params.role_id;
  if (params?.status) q.status = params.status;
  if (params?.sortBy) q.sortBy = params.sortBy;
  if (params?.order) q.order = params.order;
  return get<any>('/api/admin/users', q);
}

/**
 * Lấy chi tiết user
 */
export async function getIAMUserDetail(id: number): Promise<ApiResponse<IAMUserItem>> {
  return get<ApiResponse<IAMUserItem>>(`/api/admin/users/${id}`);
}

/**
 * Tạo user mới
 */
export async function createIAMUser(payload: CreateUserPayload): Promise<ApiResponse<IAMUserItem>> {
  return post<ApiResponse<IAMUserItem>>('/api/admin/users', payload);
}

/**
 * Cập nhật user
 */
export async function updateIAMUser(id: number, payload: UpdateUserPayload): Promise<ApiResponse<IAMUserItem>> {
  return put<ApiResponse<IAMUserItem>>(`/api/admin/users/${id}`, payload);
}

/**
 * Đổi trạng thái user
 */
export async function changeIAMUserStatus(id: number, payload: ChangeUserStatusPayload): Promise<ApiResponse<IAMUserItem>> {
  return patch<ApiResponse<IAMUserItem>>(`/api/admin/users/${id}/status`, payload);
}

/**
 * Reset mật khẩu user
 */
export async function resetIAMUserPassword(id: number, payload: ResetPasswordPayload): Promise<ApiResponse<any>> {
  return post<ApiResponse<any>>(`/api/admin/users/${id}/reset-password`, payload);
}

/**
 * Gán roles cho user
 * Gửi cả role_ids (snake_case) và roleIds (camelCase) để tương thích backend
 */
export async function assignRolesToUser(id: number, payload: AssignRolesPayload): Promise<ApiResponse<IAMUserItem>> {
  const ids = (payload.role_ids || []).map((rid) => Number(rid));
  const data = { role_ids: ids, roleIds: ids };
  return put<ApiResponse<IAMUserItem>>(`/api/admin/users/${id}/roles`, data);
}

/**
 * Lấy danh sách departments cho dropdown (dùng API list với status=ACTIVE)
 */
export async function getDepartmentOptions(): Promise<DepartmentOption[]> {
  const result = await get<PaginatedResponse<any>>('/api/admin/departments', {
    status: 'ACTIVE',
    perPage: 200,
  });
  return result.data?.map((d: any) => ({
    id: d.id,
    name: d.name,
    code: d.code,
  })) || [];
}

/**
 * Lấy danh sách roles cho dropdown (dùng API list với status=ACTIVE)
 */
export async function getRoleOptions(): Promise<RoleItem[]> {
  const result = await get<PaginatedResponse<RoleItem>>('/api/admin/roles', {
    status: 'ACTIVE',
    perPage: 200,
  });
  return result.data || [];
}
