/**
 * Countries API — danh mục quốc gia
 * - Admin CRUD: /api/admin/countries
 * - Options dropdown: /api/countries/options
 */
import { get, post, put, patch, ApiResponse, PaginatedResponse } from '../request';

export type CountryStatus = 'ACTIVE' | 'INACTIVE';

export interface Country {
  id: number;
  code: string;
  name: string;
  display_order: number;
  status: CountryStatus;
  created_at: string;
  updated_at: string;
}

export interface QueryCountriesParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  status?: CountryStatus;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateCountryPayload {
  code: string;
  name: string;
  displayOrder?: number;
  status?: CountryStatus;
}

export interface UpdateCountryPayload {
  code?: string;
  name?: string;
  displayOrder?: number;
  status?: CountryStatus;
}

export interface UpdateCountryStatusPayload {
  status: CountryStatus;
}

export const COUNTRY_STATUS_MAP: Record<
  CountryStatus,
  { text: string; color: string; status: string }
> = {
  ACTIVE: { text: 'Đang hoạt động', color: 'success', status: 'success' },
  INACTIVE: { text: 'Ngừng hoạt động', color: 'default', status: 'default' },
};

export const COUNTRY_STATUS_OPTIONS = Object.entries(COUNTRY_STATUS_MAP).map(([value, config]) => ({
  value,
  label: config.text,
}));

export type CountryOptionRow = {
  id: number;
  code: string;
  name: string;
  label: string;
  value: string;
};

/** Dropdown quốc gia — GET /api/countries/options */
export async function getCountryOptions(): Promise<ApiResponse<CountryOptionRow[]>> {
  return get<ApiResponse<CountryOptionRow[]>>('/api/countries/options');
}

/** Admin: danh sách phân trang */
export async function queryCountries(
  params?: QueryCountriesParams,
): Promise<PaginatedResponse<Country>> {
  return get<PaginatedResponse<Country>>('/api/admin/countries', params);
}

export async function createCountry(
  payload: CreateCountryPayload,
): Promise<ApiResponse<Country>> {
  return post<ApiResponse<Country>>('/api/admin/countries', payload);
}

export async function updateCountry(
  id: number,
  payload: UpdateCountryPayload,
): Promise<ApiResponse<Country>> {
  return put<ApiResponse<Country>>(`/api/admin/countries/${id}`, payload);
}

export async function updateCountryStatus(
  id: number,
  payload: UpdateCountryStatusPayload,
): Promise<ApiResponse<Country>> {
  return patch<ApiResponse<Country>>(`/api/admin/countries/${id}/status`, payload);
}
