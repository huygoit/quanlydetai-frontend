/**
 * API dự thảo hợp đồng BM.06 (US-05-01 bước 1)
 */
import {
  get,
  post,
  ApiResponse,
  PaginatedResponse,
  API_BASE_URL,
  getToken,
} from '../request';

export type ProjectContractStatus =
  | 'HOP_DONG_DRAFT'
  | 'HOP_DONG_CHO_KY'
  | 'HOP_DONG_DA_KY'
  | 'DANG_THUC_HIEN';

export interface ProjectContract {
  id: number;
  project_outline_id: number;
  contract_template_id?: number | null;
  status: ProjectContractStatus;
  contract_no?: string | null;
  file_name: string;
  stored_file_name: string;
  file_url: string;
  file_size?: number | null;
  merge_payload?: Record<string, string>;
  version: number;
  generated_by?: number | null;
  generated_at?: string | null;
  note?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  roles?: { canManage?: boolean };
  outline?: {
    id: number;
    code: string;
    title: string;
    status: string;
    owner_name?: string;
    owner_unit?: string | null;
    approved_budget?: number | null;
    module5_opened?: boolean;
  };
}

export const PROJECT_CONTRACT_STATUS_MAP: Record<
  ProjectContractStatus,
  { text: string; color: string }
> = {
  HOP_DONG_DRAFT: { text: 'Dự thảo', color: 'blue' },
  HOP_DONG_CHO_KY: { text: 'Chờ ký', color: 'gold' },
  HOP_DONG_DA_KY: { text: 'Đã ký', color: 'cyan' },
  DANG_THUC_HIEN: { text: 'Đang thực hiện', color: 'success' },
};

export async function queryProjectContracts(params?: {
  page?: number;
  perPage?: number;
  status?: string;
  keyword?: string;
}): Promise<PaginatedResponse<ProjectContract>> {
  return get<PaginatedResponse<ProjectContract>>('/api/project-contracts', params);
}

export async function getProjectContract(id: number): Promise<ApiResponse<ProjectContract>> {
  return get<ApiResponse<ProjectContract>>(`/api/project-contracts/${id}`);
}

export async function getProjectContractByOutline(
  outlineId: number,
): Promise<ApiResponse<ProjectContract>> {
  return get<ApiResponse<ProjectContract>>(`/api/project-contracts/by-outline/${outlineId}`);
}

export async function generateProjectContract(
  outlineId: number,
  opts?: { forceRegen?: boolean },
): Promise<ApiResponse<ProjectContract>> {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/by-outline/${outlineId}/generate`,
    { forceRegen: !!opts?.forceRegen },
  );
}

export async function downloadProjectContract(id: number, fileName: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/project-contracts/${id}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.message || 'Tải file thất bại');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName || 'hop-dong.docx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
