/**
 * API danh mục Loại quy trình đề tài (QT-I … QT-V)
 * - Admin: /api/admin/project-process-types
 * - Catalog: /api/project-process-types, /options
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

export type ProjectProcessTypeStatus = 'ACTIVE' | 'INACTIVE';

export interface ProjectProcessType {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  display_order: number;
  status: ProjectProcessTypeStatus;
  created_at?: string;
  updated_at?: string;
}

export interface QueryProjectProcessTypesParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  status?: ProjectProcessTypeStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateProjectProcessTypePayload {
  code: string;
  name: string;
  description?: string | null;
  displayOrder?: number;
  display_order?: number;
  status?: ProjectProcessTypeStatus;
}

export type UpdateProjectProcessTypePayload = Partial<CreateProjectProcessTypePayload>;

export const PROJECT_PROCESS_TYPE_STATUS_MAP: Record<
  ProjectProcessTypeStatus,
  { text: string; color: string; status: string }
> = {
  ACTIVE: { text: 'Đang hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

export const PROJECT_PROCESS_TYPE_STATUS_OPTIONS = Object.entries(
  PROJECT_PROCESS_TYPE_STATUS_MAP,
).map(([value, config]) => ({
  value,
  label: config.text,
}));

export type ProjectProcessTypeOption = Pick<ProjectProcessType, 'id' | 'code' | 'name'>;

export async function getProjectProcessTypeOptions(
  params?: Pick<QueryProjectProcessTypesParams, 'status' | 'keyword'>,
): Promise<ApiResponse<ProjectProcessTypeOption[]>> {
  const res = await get<any>('/api/project-process-types/options', params);
  // Chuẩn hóa: { success, data: [] } hoặc data lồng nhau
  const raw = res?.data ?? res;
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return {
    success: res?.success !== false,
    data: list.map((r: any) => ({
      id: Number(r.id),
      code: String(r.code),
      name: String(r.name),
    })),
    message: res?.message,
  };
}

export async function queryProjectProcessTypes(
  params?: QueryProjectProcessTypesParams,
): Promise<PaginatedResponse<ProjectProcessType>> {
  return get<PaginatedResponse<ProjectProcessType>>('/api/admin/project-process-types', params);
}

export async function createProjectProcessType(
  payload: CreateProjectProcessTypePayload,
): Promise<ApiResponse<ProjectProcessType>> {
  return post<ApiResponse<ProjectProcessType>>('/api/admin/project-process-types', {
    ...payload,
    displayOrder: payload.displayOrder ?? payload.display_order,
  });
}

export async function updateProjectProcessType(
  id: number,
  payload: UpdateProjectProcessTypePayload,
): Promise<ApiResponse<ProjectProcessType>> {
  return put<ApiResponse<ProjectProcessType>>(`/api/admin/project-process-types/${id}`, {
    ...payload,
    displayOrder: payload.displayOrder ?? payload.display_order,
  });
}

export async function updateProjectProcessTypeStatus(
  id: number,
  payload: { status: ProjectProcessTypeStatus },
): Promise<ApiResponse<ProjectProcessType>> {
  return patch<ApiResponse<ProjectProcessType>>(
    `/api/admin/project-process-types/${id}/status`,
    payload,
  );
}
