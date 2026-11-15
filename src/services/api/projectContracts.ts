/**
 * API dự thảo hợp đồng BM.06 / BM-02.14
 */
import {
  API_BASE_URL,
  ApiResponse,
  get,
  getToken,
  PaginatedResponse,
  post,
  put,
} from '../request';

export type ProjectContractStatus =
  | 'HOP_DONG_DRAFT'
  | 'HOP_DONG_CHO_CNNV'
  | 'HOP_DONG_CHO_KY'
  | 'HOP_DONG_CHO_PHAT_HANH'
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
  HOP_DONG_CHO_CNNV: { text: 'Chờ CNNV xác nhận', color: 'gold' },
  HOP_DONG_CHO_KY: { text: 'Chờ BGH ký', color: 'orange' },
  HOP_DONG_CHO_PHAT_HANH: { text: 'Chờ phát hành', color: 'purple' },
  HOP_DONG_DA_KY: { text: 'Đã ký', color: 'cyan' },
  DANG_THUC_HIEN: { text: 'Đang thực hiện', color: 'success' },
};

export type ContractWorkflow = {
  returnReason: string | null;
  cnnvConfirmedAt: string | null;
  bghSignedAt: string | null;
  publishedAt: string | null;
  issueNo: string | null;
  cnnvSignedAt: string | null;
  signedFileUrl: string | null;
  effectiveAt: string | null;
  signMode?: 'ONLINE' | 'GIAY' | null;
};

export type ContractFlowRoles = {
  canManage: boolean;
  canCnnv: boolean;
  canBgh: boolean;
  canPublish: boolean;
};

export type ContractMilestoneRow = {
  content: string;
  thoiGian: string;
  sanPham: string;
};

export type ContractFundingCode =
  | 'NSNN'
  | 'KP_TRUONG'
  | 'DOI_UNG'
  | 'NGUON_KHAC';

export type ContractFundingRow = {
  code: ContractFundingCode;
  label: string;
  amount: number;
};

export type ContractDraftForm = {
  tenNhiemVu: string;
  maSo: string;
  cnnv: string;
  donVi: string;
  thoiGian: string;
  kinhPhi: string;
  soThang: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  tongKinhPhi: number;
  kinhPhiBangChu: string;
  milestones: ContractMilestoneRow[];
  funding: ContractFundingRow[];
};

export type ProjectContractFlow = ProjectContract & {
  workflow: ContractWorkflow;
  executionStatus: string | null;
  roles: ContractFlowRoles;
  draftForm?: ContractDraftForm;
  canEditDraft?: boolean;
};

export async function queryProjectContracts(params?: {
  page?: number;
  perPage?: number;
  status?: string;
  keyword?: string;
}): Promise<PaginatedResponse<ProjectContract>> {
  return get<PaginatedResponse<ProjectContract>>(
    '/api/project-contracts',
    params,
  );
}

export async function getProjectContract(
  id: number,
): Promise<ApiResponse<ProjectContract>> {
  return get<ApiResponse<ProjectContract>>(`/api/project-contracts/${id}`);
}

export async function getProjectContractByOutline(
  outlineId: number,
): Promise<ApiResponse<ProjectContract>> {
  return get<ApiResponse<ProjectContract>>(
    `/api/project-contracts/by-outline/${outlineId}`,
  );
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

export async function downloadProjectContract(
  id: number,
  fileName: string,
): Promise<void> {
  const token = getToken();
  const res = await fetch(
    `${API_BASE_URL}/api/project-contracts/${id}/download`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    },
  );
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

export async function getProjectContractFlow(
  id: number,
): Promise<ApiResponse<ProjectContractFlow>> {
  return get(`/api/project-contracts/${id}/flow`);
}

export async function saveContractDraftForm(
  id: number,
  body: {
    soThang?: string | number;
    ngayBatDau?: string;
    ngayKetThuc?: string;
    tongKinhPhi?: number;
    milestones: ContractMilestoneRow[];
    funding: { code: string; amount: number }[];
  },
) {
  return put<ApiResponse<ProjectContractFlow>>(
    `/api/project-contracts/${id}/draft-form`,
    body,
  );
}

export async function submitContractCnnv(id: number) {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/${id}/submit-cnnv`,
  );
}

export async function cnnvConfirmContract(id: number) {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/${id}/cnnv-confirm`,
  );
}

export async function cnnvReturnContract(id: number, reason: string) {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/${id}/cnnv-return`,
    { reason },
  );
}

export async function submitContractBgh(id: number) {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/${id}/submit-bgh`,
  );
}

export async function bghSignContract(id: number) {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/${id}/bgh-sign`,
  );
}

export async function bghReturnContract(id: number, reason: string) {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/${id}/bgh-return`,
    { reason },
  );
}

export async function publishContract(id: number, issueNo: string) {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/${id}/publish`,
    { issueNo },
  );
}

export async function setContractSignMode(
  id: number,
  signMode: 'ONLINE' | 'GIAY',
) {
  return put<ApiResponse<ContractWorkflow>>(
    `/api/project-contracts/${id}/sign-mode`,
    {
      signMode,
    },
  );
}

export async function cnnvSignContract(id: number, signedFileUrl?: string) {
  return post<ApiResponse<ProjectContract>>(
    `/api/project-contracts/${id}/cnnv-sign`,
    {
      signedFileUrl: signedFileUrl || '',
    },
  );
}
