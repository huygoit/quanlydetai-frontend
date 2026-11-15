import { get, put, ApiResponse } from '../request';

export type SchoolOrgProfile = {
  logoUrl?: string | null;
  schoolName: string;
  universitySystem: string;
  daiDienBenA: string;
  chucVuBenA: string;
  diaChiBenA: string;
  dienThoaiBenA: string;
  emailBenA: string;
  taiKhoanBenA: string;
  nganHangBenA: string;
  maSoThueBenA: string;
  mergePreview?: Record<string, string>;
};

export async function getSchoolOrgProfile(): Promise<ApiResponse<SchoolOrgProfile>> {
  return get('/api/admin/school-profile');
}

export async function updateSchoolOrgProfile(
  data: Partial<SchoolOrgProfile>,
): Promise<ApiResponse<SchoolOrgProfile>> {
  return put('/api/admin/school-profile', data);
}
