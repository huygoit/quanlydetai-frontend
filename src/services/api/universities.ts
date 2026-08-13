/**
 * Universities API — danh mục trường đại học / học viện
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

export type UniversityStatus = 'ACTIVE' | 'INACTIVE';
export type UniversityRegion =
  | 'HA_NOI'
  | 'HCM'
  | 'MIEN_BAC'
  | 'MIEN_NAM'
  | 'MIEN_TRUNG'
  | 'QUAN_DOI'
  | 'CONG_AN';
export type UniversitySchoolBlock = 'CIVIL' | 'MILITARY' | 'POLICE';

export interface University {
  id: number;
  code: string;
  name: string;
  region: UniversityRegion;
  region_label?: string;
  school_block: UniversitySchoolBlock;
  school_block_label?: string;
  country_id?: number | null;
  country?: { id: number; code: string; name: string } | null;
  is_private: boolean;
  display_order: number;
  status: UniversityStatus;
  created_at: string;
  updated_at: string;
}

export interface QueryUniversitiesParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  status?: UniversityStatus;
  region?: UniversityRegion;
  schoolBlock?: UniversitySchoolBlock;
  countryId?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateUniversityPayload {
  code: string;
  name: string;
  region?: UniversityRegion;
  schoolBlock?: UniversitySchoolBlock;
  countryId?: number | null;
  isPrivate?: boolean;
  displayOrder?: number;
  status?: UniversityStatus;
}

export interface UpdateUniversityPayload {
  code?: string;
  name?: string;
  region?: UniversityRegion;
  schoolBlock?: UniversitySchoolBlock;
  countryId?: number | null;
  isPrivate?: boolean;
  displayOrder?: number;
  status?: UniversityStatus;
}

export const UNIVERSITY_STATUS_MAP: Record<
  UniversityStatus,
  { text: string; color: string; status: string }
> = {
  ACTIVE: { text: 'Đang hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

export const UNIVERSITY_STATUS_OPTIONS = Object.entries(UNIVERSITY_STATUS_MAP).map(
  ([value, config]) => ({ value, label: config.text }),
);

export type UniversityOptionRow = {
  id: number;
  code: string;
  name: string;
  label: string;
  value: string;
  region: UniversityRegion;
  region_label: string;
  school_block: UniversitySchoolBlock;
  school_block_label: string;
  country_id?: number | null;
  country_name?: string | null;
  is_private: boolean;
};

export async function getUniversityOptions(params?: {
  keyword?: string;
  region?: UniversityRegion;
  schoolBlock?: UniversitySchoolBlock;
  countryId?: number;
}): Promise<ApiResponse<UniversityOptionRow[]>> {
  return get<ApiResponse<UniversityOptionRow[]>>('/api/universities/options', params);
}

export async function queryUniversities(
  params?: QueryUniversitiesParams,
): Promise<PaginatedResponse<University>> {
  return get<PaginatedResponse<University>>('/api/admin/universities', params);
}

export async function createUniversity(
  payload: CreateUniversityPayload,
): Promise<ApiResponse<University>> {
  return post<ApiResponse<University>>('/api/admin/universities', payload);
}

export async function updateUniversity(
  id: number,
  payload: UpdateUniversityPayload,
): Promise<ApiResponse<University>> {
  return put<ApiResponse<University>>(`/api/admin/universities/${id}`, payload);
}

export async function updateUniversityStatus(
  id: number,
  payload: { status: UniversityStatus },
): Promise<ApiResponse<University>> {
  return patch<ApiResponse<University>>(`/api/admin/universities/${id}/status`, payload);
}
