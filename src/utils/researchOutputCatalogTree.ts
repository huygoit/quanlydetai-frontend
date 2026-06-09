/**
 * Tải cây danh mục loại KQNC cho module quản lý — không gọi /api/profile/me
 * (tài khoản ADMIN/SUPER_ADMIN bị middleware personalWorkspace chặn 403).
 */
import { getAdminPublicationResearchOutputTypesTree } from '@/services/api/adminPublications';
import type { ResearchOutputTypeTreeNode } from '@/services/api/profilePublications';

/** Cây loại KQNC qua API admin publications — chỉ node đang bật (BE đã lọc) */
export async function taiCayLoaiKqncQuanLy(): Promise<ResearchOutputTypeTreeNode[]> {
  return getAdminPublicationResearchOutputTypesTree();
}
