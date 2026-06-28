/**
 * Specializations API Service (Quản lý chuyên ngành)
 * - Admin CRUD: /api/admin/specializations
 * - Catalog dùng chung (đã đăng nhập): /api/specializations, /api/specializations/options
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

export type SpecializationStatus = 'ACTIVE' | 'INACTIVE';

export interface Specialization {
  id: number;
  code: string;
  name: string;
  display_order: number;
  status: SpecializationStatus;
  created_at: string;
  updated_at: string;
}

export interface QuerySpecializationsParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  status?: SpecializationStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateSpecializationPayload {
  code: string;
  name: string;
  display_order?: number;
  status?: SpecializationStatus;
}

export interface UpdateSpecializationPayload {
  code?: string;
  name?: string;
  display_order?: number;
  status?: SpecializationStatus;
}

export interface UpdateSpecializationStatusPayload {
  status: SpecializationStatus;
}

// Constants - Status Map
export const SPECIALIZATION_STATUS_MAP: Record<
  SpecializationStatus,
  { text: string; color: string; status: string }
> = {
  ACTIVE: { text: 'Đang hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

export const SPECIALIZATION_STATUS_OPTIONS = Object.entries(SPECIALIZATION_STATUS_MAP).map(
  ([value, config]) => ({
    value,
    label: config.text,
  }),
);

// Catalog dùng chung
export type SpecializationOptionRow = Pick<Specialization, 'id' | 'code' | 'name'>;

/**
 * Danh mục chuyên ngành dùng chung (đã đăng nhập, không cần quyền admin).
 * BE: GET /api/specializations
 */
export async function querySpecializationCatalog(
  params?: Pick<
    QuerySpecializationsParams,
    'status' | 'keyword' | 'page' | 'perPage' | 'sortBy' | 'order'
  >,
): Promise<PaginatedResponse<Specialization>> {
  return get<PaginatedResponse<Specialization>>('/api/specializations', params);
}

/**
 * Dropdown gọn: GET /api/specializations/options
 */
export async function getSpecializationOptions(
  params?: Pick<QuerySpecializationsParams, 'status' | 'keyword'>,
): Promise<ApiResponse<SpecializationOptionRow[]>> {
  return get<ApiResponse<SpecializationOptionRow[]>>('/api/specializations/options', params);
}

// Admin CRUD

/** Danh sách chuyên ngành (phân trang + lọc) — quản trị Admin */
export async function querySpecializations(
  params?: QuerySpecializationsParams,
): Promise<PaginatedResponse<Specialization>> {
  return get<PaginatedResponse<Specialization>>('/api/admin/specializations', params);
}

/** Chi tiết một chuyên ngành */
export async function getSpecialization(id: number): Promise<ApiResponse<Specialization>> {
  return get<ApiResponse<Specialization>>(`/api/admin/specializations/${id}`);
}

/** Tạo chuyên ngành mới */
export async function createSpecialization(
  payload: CreateSpecializationPayload,
): Promise<ApiResponse<Specialization>> {
  return post<ApiResponse<Specialization>>('/api/admin/specializations', payload);
}

/** Cập nhật chuyên ngành */
export async function updateSpecialization(
  id: number,
  payload: UpdateSpecializationPayload,
): Promise<ApiResponse<Specialization>> {
  return put<ApiResponse<Specialization>>(`/api/admin/specializations/${id}`, payload);
}

/** Đổi trạng thái chuyên ngành (ACTIVE/INACTIVE) */
export async function updateSpecializationStatus(
  id: number,
  payload: UpdateSpecializationStatusPayload,
): Promise<ApiResponse<Specialization>> {
  return patch<ApiResponse<Specialization>>(`/api/admin/specializations/${id}/status`, payload);
}
