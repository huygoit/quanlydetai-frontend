import {
  getDepartmentCatalogOptions,
  queryDepartmentCatalog,
  queryDepartments,
  type Department,
  type DepartmentType,
} from '@/services/api/departments';
import { UDN_AFFILIATION_UNITS } from '@/services/api/profilePublications';

export type DonViSelectOption = { label: string; value: string };

const LOAI_KHOA_PHONG_BAN: DepartmentType[] = [
  'FACULTY',
  'OFFICE',
  'CENTER',
  'BOARD',
  'COUNCIL',
  'OTHER',
];

const sapXepTheoTen = (a: { name: string; display_order?: number }, b: { name: string; display_order?: number }) =>
  (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name, 'vi');

const mapOption = (name: string): DonViSelectOption => ({
  label: name,
  value: name,
});

/** Option Cơ quan công tác (trường ĐHĐN) — constant UDN_AFFILIATION_UNITS, cùng bảng tác giả. */
export const CO_QUAN_CONG_TAC_OPTIONS: DonViSelectOption[] = UDN_AFFILIATION_UNITS.map(
  (ten) => ({ label: ten, value: ten }),
);

function chuanHoaLoaiDonVi(type: unknown): DepartmentType | null {
  const t = String(type ?? '').toUpperCase();
  if (
    t === 'UNIVERSITY' ||
    t === 'BOARD' ||
    t === 'OFFICE' ||
    t === 'FACULTY' ||
    t === 'CENTER' ||
    t === 'COUNCIL' ||
    t === 'OTHER'
  ) {
    return t as DepartmentType;
  }
  return null;
}

function layDanhSachTuResponse(ketQua: unknown): Department[] {
  if (!ketQua || typeof ketQua !== 'object') return [];
  const root = ketQua as Record<string, unknown>;
  const cap1 = root.data;
  if (Array.isArray(cap1)) return cap1 as Department[];
  if (cap1 && typeof cap1 === 'object') {
    const cap2 = (cap1 as Record<string, unknown>).data;
    if (Array.isArray(cap2)) return cap2 as Department[];
  }
  return [];
}

function locKhoaPhongBanTuDepartment(danhSach: Department[]): DonViSelectOption[] {
  return danhSach
    .map((d) => ({ ...d, type: chuanHoaLoaiDonVi(d.type) ?? d.type }))
    .filter((d) => d.type && LOAI_KHOA_PHONG_BAN.includes(d.type))
    .sort(sapXepTheoTen)
    .map((d) => mapOption(d.name));
}

export type KetQuaTaiKhoaPhongBan = {
  khoaPhongOptions: DonViSelectOption[];
  tuBangDepartments: boolean;
  dungDanhSachTam: boolean;
  ghiChu?: string;
};

/**
 * Tải Khoa/phòng ban — ưu tiên GET /api/departments/options?scope=khoa_phong_ban
 * (spec: specs/api-departments-catalog-public.md), fallback GET /api/admin/departments.
 */
export async function loadProfileKhoaPhongBanOptions(): Promise<KetQuaTaiKhoaPhongBan> {
  try {
    const catalog = await getDepartmentCatalogOptions({
      scope: 'khoa_phong_ban',
      status: 'ACTIVE',
    });
    const rows = catalog.data ?? [];
    if (rows.length > 0) {
      const opts = [...rows].sort(sapXepTheoTen).map((d) => mapOption(d.name));
      return {
        khoaPhongOptions: opts,
        tuBangDepartments: true,
        dungDanhSachTam: false,
      };
    }
  } catch {
    /* API catalog chưa triển khai — thử bước dưới */
  }

  try {
    const catalogList = await queryDepartmentCatalog({
      scope: 'khoa_phong_ban',
      status: 'ACTIVE',
      perPage: 1000,
    });
    const opts = locKhoaPhongBanTuDepartment(layDanhSachTuResponse(catalogList));
    if (opts.length > 0) {
      return {
        khoaPhongOptions: opts,
        tuBangDepartments: true,
        dungDanhSachTam: false,
      };
    }
  } catch {
    /* tiếp tục fallback admin */
  }

  try {
    const admin = await queryDepartments({ status: 'ACTIVE', perPage: 1000 });
    const opts = locKhoaPhongBanTuDepartment(layDanhSachTuResponse(admin));
    if (opts.length > 0) {
      return {
        khoaPhongOptions: opts,
        tuBangDepartments: true,
        dungDanhSachTam: false,
        ghiChu:
          'Đang dùng GET /api/admin/departments (tạm). Nên chuyển sang GET /api/departments/options khi BE triển khai catalog public.',
      };
    }

    const tatCa = layDanhSachTuResponse(admin);
    if (tatCa.length > 0) {
      const opts = tatCa
        .filter((d) => chuanHoaLoaiDonVi(d.type) !== 'UNIVERSITY')
        .sort(sapXepTheoTen)
        .map((d) => mapOption(d.name));
      if (opts.length > 0) {
        return {
          khoaPhongOptions: opts,
          tuBangDepartments: true,
          dungDanhSachTam: false,
          ghiChu: `Đã tải ${tatCa.length} đơn vị (admin API), lọc bỏ Trường.`,
        };
      }
    }

    return {
      khoaPhongOptions: [],
      tuBangDepartments: false,
      dungDanhSachTam: false,
      ghiChu:
        'Bảng departments có dữ liệu nhưng chưa có dòng phù hợp Khoa/phòng ban. Thêm đơn vị loại FACULTY/OFFICE/… trong Admin.',
    };
  } catch {
    return {
      khoaPhongOptions: [],
      tuBangDepartments: false,
      dungDanhSachTam: false,
      ghiChu:
        'Chưa gọi được danh mục đơn vị. BE cần triển khai GET /api/departments/options (xem specs/api-departments-catalog-public.md).',
    };
  }
}

/** Thêm giá trị đang lưu trong hồ sơ nếu chưa có trong danh mục (dữ liệu cũ). */
export function gopGiaTriHienCo(
  options: DonViSelectOption[],
  giaTriHienTai?: string | null,
): DonViSelectOption[] {
  const ten = giaTriHienTai?.trim();
  if (!ten || options.some((o) => o.value === ten)) {
    return options;
  }
  return [{ label: `${ten} (chưa có trong danh mục)`, value: ten }, ...options];
}
