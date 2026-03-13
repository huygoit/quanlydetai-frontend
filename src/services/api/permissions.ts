/**
 * Permissions API Service (Quản lý quyền)
 */
import { get, post, ApiResponse, PaginatedResponse } from '../request';

// Types
export type PermissionStatus = 'ACTIVE' | 'INACTIVE';

export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  module: string;
  action?: string;
  description?: string;
  status?: PermissionStatus;
  created_at?: string;
  updated_at?: string;
}

export interface GroupedPermissions {
  [module: string]: PermissionItem[];
}

export interface QueryPermissionsParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  code?: string;
  name?: string;
  module?: string;
  status?: PermissionStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

// Constants
export const PERMISSION_STATUS_MAP: Record<PermissionStatus, { text: string; color: string; status: string }> = {
  ACTIVE: { text: 'Hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

export const PERMISSION_STATUS_OPTIONS = Object.entries(PERMISSION_STATUS_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

// Module names mapping
export const PERMISSION_MODULE_MAP: Record<string, string> = {
  department: 'Phòng ban',
  user: 'Người dùng',
  role: 'Vai trò',
  permission: 'Quyền',
  project: 'Đề tài',
  idea: 'Ý tưởng',
  council: 'Hội đồng',
  publication: 'Công bố khoa học',
  report: 'Báo cáo',
  finance: 'Tài chính',
  profile: 'Hồ sơ',
  notification: 'Thông báo',
  system: 'Hệ thống',
};

// API Functions

/**
 * Lấy danh sách quyền (có phân trang)
 */
export async function queryPermissions(params?: QueryPermissionsParams): Promise<PaginatedResponse<PermissionItem>> {
  return get<PaginatedResponse<PermissionItem>>('/api/admin/permissions', params);
}

/**
 * Lấy danh sách quyền nhóm theo module
 */
export async function getGroupedPermissions(): Promise<ApiResponse<GroupedPermissions>> {
  return get<ApiResponse<GroupedPermissions>>('/api/admin/permissions/grouped');
}

/**
 * Lấy tất cả permissions (không phân trang)
 */
export async function getAllPermissions(): Promise<ApiResponse<PermissionItem[]>> {
  return get<ApiResponse<PermissionItem[]>>('/api/admin/permissions/all');
}

/**
 * Lấy danh sách modules có permission
 */
export async function getPermissionModules(): Promise<ApiResponse<string[]>> {
  return get<ApiResponse<string[]>>('/api/admin/permissions/modules');
}

/**
 * Bổ sung các quyền chuẩn còn thiếu (profile.view_own, idea.view, ...) vào DB.
 * Admin có thể gọi để các quyền mới hiện trên trang phân quyền.
 */
export async function syncMissingPermissions(): Promise<
  ApiResponse<{ added: number; permissions: PermissionItem[] }>
> {
  return post<ApiResponse<{ added: number; permissions: PermissionItem[] }>>(
    '/api/admin/permissions/sync-missing',
  );
}
