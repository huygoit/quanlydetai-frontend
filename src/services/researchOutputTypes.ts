/**
 * Research Output Types API Service
 * Quản lý loại kết quả NCKH
 */
import { get, post, put, del } from './request';
import type {
  ResearchOutputTypeNode,
  ResearchOutputTypeDTO,
  CreateTypePayload,
  UpdateTypePayload,
  MoveTypePayload,
  RuleDTO,
  UpsertRulePayload,
} from '@/types/researchOutputs';

const BASE_URL = '/api/admin/research-output-types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Fetch tree of research output types
 */
export async function fetchTree(): Promise<ResearchOutputTypeNode[]> {
  const response = await get<ApiResponse<ResearchOutputTypeNode[]>>(`${BASE_URL}/tree`);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Không thể tải danh sách');
}

/**
 * Create a new research output type
 */
export async function createType(payload: CreateTypePayload): Promise<ResearchOutputTypeDTO> {
  const response = await post<ApiResponse<ResearchOutputTypeDTO>>(BASE_URL, payload);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Không thể tạo loại kết quả');
}

/**
 * Update an existing research output type
 */
export async function updateType(id: number, payload: UpdateTypePayload): Promise<ResearchOutputTypeDTO> {
  const response = await put<ApiResponse<ResearchOutputTypeDTO>>(`${BASE_URL}/${id}`, payload);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Không thể cập nhật');
}

/**
 * Delete a research output type
 * @param id - Type ID
 * @param cascade - If true, delete children as well
 */
export async function deleteType(id: number, cascade?: boolean): Promise<void> {
  const url = cascade ? `${BASE_URL}/${id}?cascade=1` : `${BASE_URL}/${id}`;
  const response = await del<ApiResponse<void>>(url);
  if (!response.success) {
    throw new Error(response.message || 'Không thể xoá');
  }
}

/**
 * Move a research output type to new parent/position
 */
export async function moveType(id: number, payload: MoveTypePayload): Promise<ResearchOutputTypeDTO> {
  const response = await put<ApiResponse<ResearchOutputTypeDTO>>(`${BASE_URL}/${id}/move`, payload);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Không thể di chuyển');
}

/**
 * Get rule for a research output type
 * Returns null if type has no rule (404 with specific message)
 */
export async function getRule(typeId: number): Promise<RuleDTO | null> {
  try {
    const response = await get<ApiResponse<RuleDTO>>(`${BASE_URL}/${typeId}/rule`);
    if (response.success && response.data) {
      return response.data;
    }
    if (response.message?.includes('chưa có rule')) {
      return null;
    }
    throw new Error(response.message || 'Không thể tải rule');
  } catch (error: any) {
    if (error?.message?.includes('chưa có rule') || error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create or update rule for a research output type
 */
export async function upsertRule(typeId: number, payload: UpsertRulePayload): Promise<RuleDTO> {
  const response = await put<ApiResponse<RuleDTO>>(`${BASE_URL}/${typeId}/rule`, payload);
  if (response.success && response.data) {
    return response.data;
  }
  throw new Error(response.message || 'Không thể lưu rule');
}
