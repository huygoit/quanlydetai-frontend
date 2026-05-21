/**
 * Catalog học vị / học hàm — hồ sơ khoa học
 * Spec: specs/api-profile-catalog-options.md
 */
import { get, ApiResponse } from '../request';

export interface ProfileCatalogOption {
  value: string;
  label: string;
  description?: string;
  displayOrder?: number;
}

export interface ScientificProfileCatalogData {
  degrees: ProfileCatalogOption[];
  academicTitles: ProfileCatalogOption[];
}

/** GET /api/catalog/scientific-profile/options — gộp học vị + học hàm */
export async function getScientificProfileCatalogOptions(): Promise<
  ApiResponse<ScientificProfileCatalogData>
> {
  return get<ApiResponse<ScientificProfileCatalogData>>(
    '/api/catalog/scientific-profile/options',
  );
}

/** GET /api/catalog/scientific-profile/degrees/options */
export async function getScientificProfileDegreeOptions(): Promise<
  ApiResponse<ProfileCatalogOption[]>
> {
  return get<ApiResponse<ProfileCatalogOption[]>>(
    '/api/catalog/scientific-profile/degrees/options',
  );
}

/** GET /api/catalog/scientific-profile/academic-titles/options */
export async function getScientificProfileAcademicTitleOptions(): Promise<
  ApiResponse<ProfileCatalogOption[]>
> {
  return get<ApiResponse<ProfileCatalogOption[]>>(
    '/api/catalog/scientific-profile/academic-titles/options',
  );
}
