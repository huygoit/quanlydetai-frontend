/**
 * User Roles API Service (Quản lý gán role cho user)
 */
import { get, post, patch, del, ApiResponse, PaginatedResponse } from '../request';
import type { RoleItem } from './roles';

// Types
export interface UserItem {
  id: number;
  full_name: string;
  username: string;
  email: string;
  department?: {
    id: number;
    name: string;
    code?: string;
  };
  status?: string;
  roles?: RoleItem[];
  created_at?: string;
  updated_at?: string;
}

export interface UserRoleAssignment {
  id?: number;
  assignmentId?: number;
  role_id?: number;
  roleId?: number;
  user_id?: number;
  role?: RoleItem;
  roleCode?: string;
  roleName?: string;
  is_active?: boolean;
  isActive?: boolean;
  start_at?: string | null;
  startAt?: string | null;
  end_at?: string | null;
  endAt?: string | null;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface QueryUsersParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  full_name?: string;
  username?: string;
  email?: string;
  department_id?: number;
  status?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface AssignRolePayload {
  role_id: number;
  /** Mặc định true - vai trò mới gán nên bật ngay */
  is_active?: boolean;
  start_at?: string | null;
  end_at?: string | null;
  note?: string;
}

export interface UpdateAssignmentStatusPayload {
  is_active?: boolean;
  isActive?: boolean;
}

// Constants
export const USER_STATUS_MAP: Record<string, { text: string; color: string; status: string }> = {
  ACTIVE: { text: 'Hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
  PENDING: { text: 'Chờ kích hoạt', color: 'warning', status: 'warning' },
  LOCKED: { text: 'Bị khóa', color: 'error', status: 'error' },
};

export const USER_STATUS_OPTIONS = Object.entries(USER_STATUS_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

// API Functions

/**
 * Lấy danh sách user (có phân trang, tìm kiếm)
 */
export async function queryUsers(params?: QueryUsersParams): Promise<any> {
  const q: Record<string, any> = {};
  if (params?.page != null) q.page = params.page;
  if (params?.perPage != null) q.per_page = params.perPage;
  if (params?.keyword) q.keyword = params.keyword;
  if (params?.full_name) q.full_name = params.full_name;
  if (params?.username) q.username = params.username;
  if (params?.email) q.email = params.email;
  if (params?.department_id != null) q.department_id = params.department_id;
  if (params?.status) q.status = params.status;
  if (params?.sortBy) q.sortBy = params.sortBy;
  if (params?.order) q.order = params.order;
  return get<any>('/api/admin/users', q);
}

/**
 * Lấy chi tiết user
 */
export async function getUserDetail(id: number): Promise<ApiResponse<UserItem>> {
  return get<ApiResponse<UserItem>>(`/api/admin/users/${id}`);
}

/**
 * Lấy danh sách role assignments của user
 */
export async function getUserRoles(userId: number): Promise<ApiResponse<UserRoleAssignment[]>> {
  return get<ApiResponse<UserRoleAssignment[]>>(`/api/admin/users/${userId}/roles`);
}

/**
 * Gán role cho user
 */
export async function assignRoleToUser(userId: number, payload: AssignRolePayload): Promise<ApiResponse<UserRoleAssignment>> {
  return post<ApiResponse<UserRoleAssignment>>(`/api/admin/users/${userId}/roles`, payload);
}

/**
 * Cập nhật trạng thái assignment (bật/tắt)
 * PATCH /api/admin/users/:id/roles/:assignmentId/status
 * Body: { is_active: boolean } hoặc { isActive: boolean }
 */
export async function updateAssignmentStatus(
  userId: number,
  assignmentId: number,
  payload: UpdateAssignmentStatusPayload
): Promise<ApiResponse<UserRoleAssignment>> {
  const val = payload.is_active ?? payload.isActive;
  if (typeof val !== 'boolean') {
    throw new Error('is_active phải là boolean');
  }
  const data = { is_active: val };
  const url = `/api/admin/users/${Number(userId)}/roles/${Number(assignmentId)}/status`;
  return patch<ApiResponse<UserRoleAssignment>>(url, data);
}

/**
 * Thu hồi role của user (xóa assignment)
 */
export async function removeUserRole(userId: number, assignmentId: number): Promise<ApiResponse<any>> {
  return del<ApiResponse<any>>(`/api/admin/users/${userId}/roles/${assignmentId}`);
}
