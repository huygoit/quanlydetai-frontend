/**
 * Tiện ích menu Kết quả NCKH — nhóm con từ node gốc danh mục loại KQNC
 */
import { queryAdminPublications } from '@/services/api/adminPublications';
import { getAdminPublicationResearchOutputTypesTree } from '@/services/api/adminPublications';

export type ResearchOutputMenuRoot = {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
};

type NodeCayLoaiKqnc = {
  id: number;
  code: string;
  name: string;
  level?: number;
  sortOrder?: number;
  isActive?: boolean;
  children?: NodeCayLoaiKqnc[];
};

/** Lấy các node gốc (mảng cấp 1 của cây API) để dựng menu con */
export function layNhomGocMenuTuCay(
  tree: NodeCayLoaiKqnc[] | undefined | null
): ResearchOutputMenuRoot[] {
  if (!Array.isArray(tree)) return [];
  return tree
    .filter((n) => n.isActive !== false)
    .map((n) => ({
      id: n.id,
      code: n.code,
      name: n.name,
      sortOrder: n.sortOrder ?? 0,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'));
}

/** Đường dẫn menu con theo id nhóm gốc */
export function duongDanMenuNhomGoc(rootId: number | 'all'): string {
  return `/research-outputs/${rootId}`;
}

/** Nhãn menu kèm số lượng — VD: "Bài báo (12)" */
export function tenMenuKemSoLuong(ten: string, soLuong?: number): string {
  if (soLuong == null || !Number.isFinite(soLuong)) return ten;
  return `${ten} (${soLuong})`;
}

export type SoLuongKqncTheoNhom = Map<number | 'all', number>;

/** Tải số lượng KQNC theo nhóm gốc — cùng nguồn GET /api/admin/publications (không lọc theo profile như dashboard). */
export async function taiSoLuongKqncTheoNhom(
  roots: ResearchOutputMenuRoot[]
): Promise<SoLuongKqncTheoNhom> {
  const ketQua: SoLuongKqncTheoNhom = new Map();

  try {
    const [tatCa, ...theoNhom] = await Promise.all([
      queryAdminPublications({ page: 1, perPage: 1 }),
      ...roots.map((r) =>
        queryAdminPublications({ page: 1, perPage: 1, rootTypeId: r.id })
      ),
    ]);
    ketQua.set('all', tatCa.meta?.total ?? 0);
    roots.forEach((r, i) => {
      ketQua.set(r.id, theoNhom[i]?.meta?.total ?? 0);
    });
  } catch (e) {
    console.warn('Không tải được số lượng KQNC cho menu:', e);
  }

  return ketQua;
}

/** Dựng mục menu con cho ProLayout (chỉ các nhóm gốc — không thêm mục «Tất cả» trùng tên menu cha) */
export function taoMenuConKetQuaNckh(
  roots: ResearchOutputMenuRoot[],
  soLuong?: SoLuongKqncTheoNhom
) {
  return roots.map((r) => ({
    path: duongDanMenuNhomGoc(r.id),
    name: tenMenuKemSoLuong(r.name, soLuong?.get(r.id)),
    icon: 'FileTextOutlined',
  }));
}

/**
 * Tải nhóm gốc danh mục loại KQNC cho menu.
 * Module quản lý: ưu tiên API admin (SUPER_ADMIN không dùng /api/profile/me).
 */
export async function taiNhomGocMenuKqnc(): Promise<ResearchOutputMenuRoot[]> {
  try {
    const tree = await getAdminPublicationResearchOutputTypesTree();
    if (Array.isArray(tree) && tree.length > 0) {
      return layNhomGocMenuTuCay(tree);
    }
  } catch (e) {
    console.warn('Không tải được danh mục loại KQNC cho menu:', e);
  }

  return [];
}

/** Gắn menu con vào cây menu ProLayout */
export function ganMenuConKetQuaNckh(
  menuData: any[],
  roots: ResearchOutputMenuRoot[],
  soLuong?: SoLuongKqncTheoNhom
): any[] {
  const childMenus = taoMenuConKetQuaNckh(roots, soLuong);
  return menuData.map((item) => {
    if (item.path !== '/research-outputs') return item;
    return { ...item, routes: childMenus, children: childMenus };
  });
}
