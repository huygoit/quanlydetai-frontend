/**
 * Danh mục dùng chung (catalogs): IDEA_LEVEL, PROJECT_LEVEL, ...
 * BE: GET /api/catalogs/by-type/:type
 */
import { get, ApiResponse } from '../request';

export type CatalogType =
  | 'FIELD'
  | 'UNIT'
  | 'PROJECT_LEVEL'
  | 'IDEA_LEVEL'
  | 'LANGUAGE'
  | string;

export type CatalogOption = {
  code: string;
  name: string;
};

/** Lấy danh mục theo loại (chỉ bản ghi đang active). */
export async function getCatalogByType(
  type: CatalogType,
): Promise<ApiResponse<CatalogOption[]>> {
  return get<ApiResponse<CatalogOption[]>>(`/api/catalogs/by-type/${type}`);
}
