/**
 * API Admin — mẫu DOCX theo loại (hợp đồng, thanh lý, …)
 */
import {
  get,
  patch,
  post,
  del,
  ApiResponse,
  PaginatedResponse,
  API_BASE_URL,
  getToken,
} from '../request';

export type ContractTemplateStatus = 'ACTIVE' | 'INACTIVE';
export type ContractTemplateType = 'HOP_DONG' | 'THANH_LY' | 'THONG_BAO';

export interface DocTemplateTypeDef {
  code: ContractTemplateType;
  label: string;
  defaultFormCode: string | null;
  description: string;
}

export interface ThongBaoMergeConfig {
  ky_hieu: string;
  noi_nhan: string;
  tham_quyen_ky: string;
  ho_ten_nguoi_ky: string;
  so_moi_nhat: number;
}

export interface ContractTemplate {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  template_type: ContractTemplateType;
  template_type_label?: string;
  form_code: string;
  merge_config?: ThongBaoMergeConfig | null;
  file_name: string;
  stored_file_name: string;
  file_url: string;
  file_size?: number | null;
  detected_variables: string[];
  unknown_variables?: string[];
  missing_known_variables?: string[];
  is_default: boolean;
  status: ContractTemplateStatus;
  version: number;
  uploaded_by?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Bm06VariableDef {
  key: string;
  label: string;
  group: string;
}

export const CONTRACT_TEMPLATE_STATUS_MAP: Record<
  ContractTemplateStatus,
  { text: string; color: string }
> = {
  ACTIVE: { text: 'Đang dùng', color: 'success' },
  INACTIVE: { text: 'Ngừng', color: 'default' },
};

export const CONTRACT_TEMPLATE_TYPE_OPTIONS: Array<{
  value: ContractTemplateType;
  label: string;
}> = [
  { value: 'HOP_DONG', label: 'Hợp đồng' },
  { value: 'THANH_LY', label: 'Biên bản thanh lý hợp đồng' },
  { value: 'THONG_BAO', label: 'Thông báo' },
];

export async function getContractTemplateTypes(): Promise<ApiResponse<DocTemplateTypeDef[]>> {
  return get<ApiResponse<DocTemplateTypeDef[]>>('/api/admin/contract-templates/types');
}

export async function queryContractTemplates(params?: {
  page?: number;
  perPage?: number;
  keyword?: string;
  status?: ContractTemplateStatus;
  templateType?: ContractTemplateType;
  formCode?: string;
}): Promise<PaginatedResponse<ContractTemplate>> {
  return get<PaginatedResponse<ContractTemplate>>('/api/admin/contract-templates', params);
}

export async function getContractTemplateVariableCatalog(
  templateType?: ContractTemplateType,
): Promise<ApiResponse<Bm06VariableDef[]>> {
  return get<ApiResponse<Bm06VariableDef[]>>('/api/admin/contract-templates/variables', {
    templateType,
  });
}

export async function createContractTemplate(
  form: FormData,
): Promise<ApiResponse<ContractTemplate>> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/contract-templates`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(new Error(json?.message || 'Tạo mẫu thất bại'), { data: json });
  }
  return json;
}

export async function updateContractTemplate(
  id: number,
  form: FormData,
): Promise<ApiResponse<ContractTemplate>> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/contract-templates/${id}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw Object.assign(new Error(json?.message || 'Cập nhật thất bại'), { data: json });
  }
  return json;
}

export async function updateContractTemplateStatus(
  id: number,
  payload: { status: ContractTemplateStatus },
): Promise<ApiResponse<ContractTemplate>> {
  return patch<ApiResponse<ContractTemplate>>(
    `/api/admin/contract-templates/${id}/status`,
    payload,
  );
}

export async function setDefaultContractTemplate(
  id: number,
): Promise<ApiResponse<ContractTemplate>> {
  return post<ApiResponse<ContractTemplate>>(`/api/admin/contract-templates/${id}/set-default`);
}

export async function deleteContractTemplate(id: number): Promise<ApiResponse<unknown>> {
  return del<ApiResponse<unknown>>(`/api/admin/contract-templates/${id}`);
}

export async function downloadContractTemplate(id: number, fileName: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}/api/admin/contract-templates/${id}/download`, {
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
  a.download = fileName || 'template.docx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
