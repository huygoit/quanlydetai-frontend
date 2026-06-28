/**
 * API quản lý kết quả NCKH — module /research-outputs (không chủ kê khai /profile/me)
 */
import { get, post, put, del, ApiResponse, PaginatedResponse } from '../request';
import type { Publication, PublicationAuthor, ResearchOutputTypeTreeNode } from './profilePublications';

export interface AdminPublicationListItem extends Publication {
  profileId?: number | null;
  profileFullName?: string;
  profileFaculty?: string;
  profileWorkEmail?: string;
}

export interface AdminPublicationQueryParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  academicYear?: string;
  /** Lọc theo nhóm gốc danh mục loại KQNC (node level 1) */
  rootTypeId?: number;
  /** Lọc / kê khai theo hồ sơ khoa học cụ thể */
  profileId?: number;
  /** Lọc ngày xuất bản từ (YYYY-MM-DD) */
  publishedFrom?: string;
  /** Lọc ngày xuất bản đến (YYYY-MM-DD) */
  publishedTo?: string;
  /** Lọc trạng thái duyệt */
  reviewStatus?: string;
  q?: string;
}

export type AdminPublicationPayload = Omit<
  Publication,
  'id' | 'createdAt' | 'updatedAt' | 'researchOutputType'
> & {
  /** Chỉ luồng kê khai hộ đặc biệt — module quản lý không gửi */
  profileId?: number;
};

function publicationAuthorToApiPayload(a: PublicationAuthor) {
  const nhapTay =
    (a.profileId == null || a.profileId === undefined) &&
    (a.studentId == null || a.studentId === undefined);
  return {
    id: typeof a.id === 'number' && Number.isFinite(a.id) ? a.id : undefined,
    profile_id: a.profileId != null && Number.isFinite(Number(a.profileId)) ? Number(a.profileId) : null,
    student_id: a.studentId != null && Number.isFinite(Number(a.studentId)) ? Number(a.studentId) : null,
    gender: nhapTay ? a.gender ?? null : null,
    full_name: a.fullName,
    affiliation_units: Array.isArray(a.affiliationUnits) ? a.affiliationUnits : [],
    author_order: a.authorOrder,
    is_top_author: a.isTopAuthor,
    is_corresponding: a.isCorresponding,
    affiliation_type: a.affiliationType,
    is_multi_affiliation_outside_udn: a.isMultiAffiliationOutsideUdn,
    contribution_percent:
      a.contributionPercent != null && Number.isFinite(Number(a.contributionPercent))
        ? Number(a.contributionPercent)
        : null,
  };
}

/** Danh sách KQNC toàn hệ thống (phân trang, lọc theo nhóm gốc / hồ sơ) */
export async function queryAdminPublications(
  params?: AdminPublicationQueryParams
): Promise<PaginatedResponse<AdminPublicationListItem>> {
  // BE đọc camelCase (perPage, rootTypeId, publishedFrom, …) — không nhân đôi snake_case trên query string.
  return get<PaginatedResponse<AdminPublicationListItem>>('/api/admin/publications', params);
}

/** Cây loại KQNC (node đang bật) — quyền publication.view, không qua /api/profile/me */
export async function getAdminPublicationResearchOutputTypesTree(): Promise<
  ResearchOutputTypeTreeNode[]
> {
  const res = await get<ApiResponse<ResearchOutputTypeTreeNode[]>>(
    '/api/admin/publications/research-output-types/tree'
  );
  if (res.success && Array.isArray(res.data)) return res.data;
  throw new Error(res.message || 'Không tải được danh mục loại KQNC');
}

/** Chi tiết một KQNC (phục vụ trang sửa) */
export async function getAdminPublicationById(
  id: number
): Promise<ApiResponse<AdminPublicationListItem>> {
  return get<ApiResponse<AdminPublicationListItem>>(`/api/admin/publications/${id}`);
}

/** Tạo KQNC — admin kê khai hộ (bắt buộc profileId) */
export async function createAdminPublication(
  payload: AdminPublicationPayload
): Promise<ApiResponse<AdminPublicationListItem>> {
  return post<ApiResponse<AdminPublicationListItem>>('/api/admin/publications', payload);
}

/** Cập nhật KQNC */
export async function updateAdminPublication(
  id: number,
  payload: Partial<AdminPublicationPayload>
): Promise<ApiResponse<AdminPublicationListItem>> {
  return put<ApiResponse<AdminPublicationListItem>>(`/api/admin/publications/${id}`, payload);
}

/** Xóa KQNC */
export async function deleteAdminPublication(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/admin/publications/${id}`);
}

/** Yêu cầu hiệu chỉnh KQNC */
export async function requestAdminPublicationCorrection(
  id: number,
  reason: string
): Promise<ApiResponse<AdminPublicationListItem>> {
  return post<ApiResponse<AdminPublicationListItem>>(
    `/api/admin/publications/${id}/request-correction`,
    { reason }
  );
}

/** Duyệt KQNC */
export async function approveAdminPublication(
  id: number
): Promise<ApiResponse<AdminPublicationListItem>> {
  return post<ApiResponse<AdminPublicationListItem>>(`/api/admin/publications/${id}/approve`);
}

/** Lấy danh sách tác giả */
export async function getAdminPublicationAuthors(
  pubId: number
): Promise<ApiResponse<PublicationAuthor[]>> {
  return get<ApiResponse<PublicationAuthor[]>>(`/api/admin/publications/${pubId}/authors`);
}

/** Lưu danh sách tác giả */
export async function saveAdminPublicationAuthors(
  pubId: number,
  authors: PublicationAuthor[]
): Promise<ApiResponse<PublicationAuthor[]>> {
  return put<ApiResponse<PublicationAuthor[]>>(`/api/admin/publications/${pubId}/authors`, {
    authors: authors.map(publicationAuthorToApiPayload),
  });
}
