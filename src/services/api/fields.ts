/**
 * Fields API Service (Quản lý lĩnh vực khoa học)
 * - Admin CRUD: /api/admin/fields
 * - Catalog dùng chung (đã đăng nhập): /api/fields, /api/fields/options
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

export type FieldStatus = 'ACTIVE' | 'INACTIVE';

export interface Field {
  id: number;
  code: string;
  name: string;
  display_order: number;
  status: FieldStatus;
  created_at: string;
  updated_at: string;
}

export interface QueryFieldsParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  status?: FieldStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateFieldPayload {
  code: string;
  name: string;
  display_order?: number;
  status?: FieldStatus;
}

export interface UpdateFieldPayload {
  code?: string;
  name?: string;
  display_order?: number;
  status?: FieldStatus;
}

export interface UpdateFieldStatusPayload {
  status: FieldStatus;
}

// Constants - Status Map
export const FIELD_STATUS_MAP: Record<FieldStatus, { text: string; color: string; status: string }> = {
  ACTIVE: { text: 'Đang hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

export const FIELD_STATUS_OPTIONS = Object.entries(FIELD_STATUS_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

// Catalog dùng chung
export type FieldOptionRow = Pick<Field, 'id' | 'code' | 'name'>;

/**
 * Danh mục lĩnh vực dùng chung (đã đăng nhập, không cần quyền admin).
 * BE: GET /api/fields
 */
export async function queryFieldCatalog(
  params?: Pick<QueryFieldsParams, 'status' | 'keyword' | 'page' | 'perPage' | 'sortBy' | 'order'>,
): Promise<PaginatedResponse<Field>> {
  return get<PaginatedResponse<Field>>('/api/fields', params);
}

/**
 * Dropdown gọn: GET /api/fields/options
 */
export async function getFieldOptions(
  params?: Pick<QueryFieldsParams, 'status' | 'keyword'>,
): Promise<ApiResponse<FieldOptionRow[]>> {
  return get<ApiResponse<FieldOptionRow[]>>('/api/fields/options', params);
}

// Admin CRUD

/** Danh sách lĩnh vực (phân trang + lọc) — quản trị Admin */
export async function queryFields(
  params?: QueryFieldsParams,
): Promise<PaginatedResponse<Field>> {
  return get<PaginatedResponse<Field>>('/api/admin/fields', params);
}

/** Chi tiết một lĩnh vực */
export async function getField(id: number): Promise<ApiResponse<Field>> {
  return get<ApiResponse<Field>>(`/api/admin/fields/${id}`);
}

/** Tạo lĩnh vực mới */
export async function createField(
  payload: CreateFieldPayload,
): Promise<ApiResponse<Field>> {
  return post<ApiResponse<Field>>('/api/admin/fields', payload);
}

/** Cập nhật lĩnh vực */
export async function updateField(
  id: number,
  payload: UpdateFieldPayload,
): Promise<ApiResponse<Field>> {
  return put<ApiResponse<Field>>(`/api/admin/fields/${id}`, payload);
}

/** Đổi trạng thái lĩnh vực (ACTIVE/INACTIVE) */
export async function updateFieldStatus(
  id: number,
  payload: UpdateFieldStatusPayload,
): Promise<ApiResponse<Field>> {
  return patch<ApiResponse<Field>>(`/api/admin/fields/${id}/status`, payload);
}
