/**
 * Personal Profiles API Service (Hồ sơ cá nhân)
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

// Types
export type PersonalProfileStatus = 'ACTIVE' | 'INACTIVE';

export interface PersonalProfileItem {
  id: number;
  userId: number;
  staffCode?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  phone?: string;
  personalEmail?: string;
  workEmail?: string;
  address?: string;
  departmentId?: number;
  department?: { id: number; name: string };
  positionTitle?: string;
  employmentType?: string;
  academicDegree?: string;
  academicTitle?: string;
  specialization?: string;
  professionalQualification?: string;
  identityNumber?: string;
  identityIssueDate?: string;
  identityIssuePlace?: string;
  status: PersonalProfileStatus;
  note?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface QueryPersonalProfilesParams {
  page?: number;
  perPage?: number;
  per_page?: number;
  keyword?: string;
  staffCode?: string;
  departmentId?: number;
  status?: PersonalProfileStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreatePersonalProfilePayload {
  userId: number;
  staffCode?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  phone?: string;
  personalEmail?: string;
  workEmail?: string;
  address?: string;
  departmentId?: number;
  positionTitle?: string;
  employmentType?: string;
  academicDegree?: string;
  academicTitle?: string;
  specialization?: string;
  professionalQualification?: string;
  identityNumber?: string;
  identityIssueDate?: string;
  identityIssuePlace?: string;
  status?: PersonalProfileStatus;
  note?: string;
}

export type UpdatePersonalProfilePayload = Partial<CreatePersonalProfilePayload>;

export interface UpdateStatusPayload {
  status: PersonalProfileStatus;
}

// Constants
export const PERSONAL_PROFILE_STATUS_MAP: Record<PersonalProfileStatus, { text: string; status: string }> = {
  ACTIVE: { text: 'Hoạt động', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', status: 'default' },
};

export const PERSONAL_PROFILE_STATUS_OPTIONS = Object.entries(PERSONAL_PROFILE_STATUS_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'FULL_TIME', label: 'Biên chế' },
  { value: 'CONTRACT', label: 'Hợp đồng' },
  { value: 'PART_TIME', label: 'Bán thời gian' },
  { value: 'OTHER', label: 'Khác' },
];

// API
export async function getPersonalProfiles(params?: QueryPersonalProfilesParams): Promise<any> {
  const q: Record<string, any> = { ...params } as any;
  if (q.perPage != null) {
    q.per_page = q.perPage;
  }
  return get<any>('/api/admin/personal-profiles', q);
}

export async function getPersonalProfileById(id: number): Promise<ApiResponse<PersonalProfileItem>> {
  return get<ApiResponse<PersonalProfileItem>>(`/api/admin/personal-profiles/${id}`);
}

export async function getPersonalProfileByUserId(userId: number): Promise<ApiResponse<PersonalProfileItem>> {
  return get<ApiResponse<PersonalProfileItem>>(`/api/admin/personal-profiles/user/${userId}`);
}

export async function createPersonalProfile(payload: CreatePersonalProfilePayload): Promise<ApiResponse<PersonalProfileItem>> {
  return post<ApiResponse<PersonalProfileItem>>('/api/admin/personal-profiles', payload);
}

export async function updatePersonalProfile(id: number, payload: UpdatePersonalProfilePayload): Promise<ApiResponse<PersonalProfileItem>> {
  return put<ApiResponse<PersonalProfileItem>>(`/api/admin/personal-profiles/${id}`, payload);
}

export async function updatePersonalProfileStatus(id: number, payload: UpdateStatusPayload): Promise<ApiResponse<PersonalProfileItem>> {
  return patch<ApiResponse<PersonalProfileItem>>(`/api/admin/personal-profiles/${id}/status`, payload);
}
