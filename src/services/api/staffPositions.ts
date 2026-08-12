/**
 * API danh mục chức vụ nhân sự
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

export type StaffPositionStatus = 'ACTIVE' | 'INACTIVE';

/** 2 loại: Chức vụ | Chức vụ Đảng */
export type StaffPositionKind = 'POSITION' | 'PARTY';

export interface StaffPosition {
  id: number;
  kind: StaffPositionKind;
  code: string;
  name: string;
  display_order: number;
  status: StaffPositionStatus;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QueryStaffPositionsParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  kind?: StaffPositionKind;
  status?: StaffPositionStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateStaffPositionPayload {
  kind: StaffPositionKind;
  code: string;
  name: string;
  displayOrder?: number;
  display_order?: number;
  status?: StaffPositionStatus;
}

export type UpdateStaffPositionPayload = Partial<CreateStaffPositionPayload>;

export const STAFF_POSITION_KIND_MAP: Record<StaffPositionKind, { text: string; color: string }> = {
  POSITION: { text: 'Chức vụ', color: 'blue' },
  PARTY: { text: 'Chức vụ Đảng', color: 'volcano' },
};

export const STAFF_POSITION_KIND_OPTIONS = Object.entries(STAFF_POSITION_KIND_MAP).map(
  ([value, config]) => ({
    value,
    label: config.text,
  }),
);

export const STAFF_POSITION_STATUS_MAP: Record<
  StaffPositionStatus,
  { text: string; color: string; status: string }
> = {
  ACTIVE: { text: 'Đang hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

export const STAFF_POSITION_STATUS_OPTIONS = Object.entries(STAFF_POSITION_STATUS_MAP).map(
  ([value, config]) => ({
    value,
    label: config.text,
  }),
);

export type StaffPositionOption = Pick<StaffPosition, 'id' | 'kind' | 'code' | 'name'>;

export async function getStaffPositionOptions(
  params?: Pick<QueryStaffPositionsParams, 'status' | 'keyword' | 'kind'>,
): Promise<ApiResponse<StaffPositionOption[]>> {
  const res = await get<any>('/api/staff-positions/options', params);
  const raw = res?.data ?? res;
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return {
    success: res?.success !== false,
    data: list.map((r: any) => ({
      id: Number(r.id),
      kind: r.kind as StaffPositionKind,
      code: String(r.code),
      name: String(r.name),
    })),
    message: res?.message,
  };
}

export async function queryStaffPositions(
  params?: QueryStaffPositionsParams,
): Promise<PaginatedResponse<StaffPosition>> {
  return get<PaginatedResponse<StaffPosition>>('/api/admin/staff-positions', params);
}

export async function getStaffPosition(id: number): Promise<ApiResponse<StaffPosition>> {
  return get<ApiResponse<StaffPosition>>(`/api/admin/staff-positions/${id}`);
}

export async function createStaffPosition(
  payload: CreateStaffPositionPayload,
): Promise<ApiResponse<StaffPosition>> {
  return post<ApiResponse<StaffPosition>>('/api/admin/staff-positions', payload);
}

export async function updateStaffPosition(
  id: number,
  payload: UpdateStaffPositionPayload,
): Promise<ApiResponse<StaffPosition>> {
  return put<ApiResponse<StaffPosition>>(`/api/admin/staff-positions/${id}`, payload);
}

export async function updateStaffPositionStatus(
  id: number,
  payload: { status: StaffPositionStatus },
): Promise<ApiResponse<StaffPosition>> {
  return patch<ApiResponse<StaffPosition>>(`/api/admin/staff-positions/${id}/status`, payload);
}
