/**
 * Hồ sơ đăng ký thực hiện một nhiệm vụ trong thông báo.
 */
import { get, patch, post, ApiResponse } from '../request';
import type { PublicationAuthor } from './profilePublications';
import { normalizePublicationAuthor } from './profilePublications';

export type TrangThaiHoSoDangKy =
  | 'DRAFT'
  | 'CHO_DON_VI'
  | 'CHO_PKH'
  | 'DKDT_DUOC_CHAP_THUAN'
  | 'DKDT_TU_CHOI';

export type KhungNhiemVu = {
  id: number;
  code: string;
  title: string;
  objectives?: string | null;
  expectedResults?: string | null;
  ownerName: string;
  ownerUnit: string;
  durationMonths: number;
  projectProcessType?: { id: number; code: string; name: string } | null;
};

export type HoSoDangKy = {
  id: number;
  code: string;
  projectProposalId: number;
  callForProposalId: number;
  ownerId: number;
  ownerName: string;
  ownerUnit: string;
  proposedBudget: number;
  durationMonths: number;
  attachmentUrl?: string | null;
  note?: string | null;
  status: TrangThaiHoSoDangKy;
  submittedAt?: string | null;
  unitComment?: string | null;
  pkhReason?: string | null;
};

export type NguCanhDangKy = {
  dangMo: boolean;
  hanNop?: string | null;
  thongBao: { id: number; title: string; status: string };
  nhiemVu: KhungNhiemVu;
  hoSo: HoSoDangKy | null;
  thanhVien: PublicationAuthor[];
};

function thanhVienSangPayload(a: PublicationAuthor) {
  const role = a.proposalMemberRole || 'MEMBER';
  return {
    profile_id: a.profileId ?? null,
    student_id: a.studentId ?? null,
    gender: a.profileId || a.studentId ? null : a.gender ?? null,
    full_name: a.fullName,
    affiliation_units: a.affiliationUnits ?? [],
    member_order: a.authorOrder,
    author_order: a.authorOrder,
    role,
    proposalMemberRole: role,
    affiliation_type: a.affiliationType,
    is_multi_affiliation_outside_udn: a.isMultiAffiliationOutsideUdn,
    contribution_percent: a.contributionPercent ?? null,
  };
}

export async function layNguCanhDangKy(callForProposalId: number, projectProposalId: number) {
  const res = await get<ApiResponse<NguCanhDangKy>>('/api/proposal-registrations/context', {
    callForProposalId,
    projectProposalId,
  });
  if (Array.isArray(res?.data?.thanhVien)) {
    res.data.thanhVien = res.data.thanhVien.map((m) =>
      normalizePublicationAuthor(m as PublicationAuthor),
    );
  }
  return res;
}

export async function luuHoSoDangKy(payload: {
  callForProposalId: number;
  projectProposalId: number;
  proposedBudget: number;
  durationMonths: number;
  attachmentUrl?: string | null;
  note?: string | null;
  members: PublicationAuthor[];
  gui: boolean;
}) {
  return post<ApiResponse<{ hoSo: HoSoDangKy; thanhVien: PublicationAuthor[] }>>(
    '/api/proposal-registrations',
    {
      ...payload,
      members: payload.members.map(thanhVienSangPayload),
    },
  );
}

export type DonChoXacNhan = HoSoDangKy & {
  nhiemVu?: {
    id: number;
    code: string;
    title: string;
    objectives?: string | null;
    expectedResults?: string | null;
  } | null;
};

export async function demDonDangKyChoXacNhan() {
  return get<ApiResponse<{ count: number }>>('/api/proposal-registrations/pending-count');
}

export async function danhSachDonChoXacNhan() {
  return get<ApiResponse<DonChoXacNhan[]> & { coTheXuLy?: boolean }>(
    '/api/proposal-registrations/pending',
  );
}

export async function danhSachDonChoPkh() {
  return get<ApiResponse<DonChoXacNhan[]>>('/api/proposal-registrations/pkh-pending');
}

export type NguoiDangKyTomTat = {
  id: number;
  ten: string;
  donVi: string;
  status: TrangThaiHoSoDangKy;
};

export type NhiemVuXetDuyet = {
  id: number;
  code: string;
  title: string;
  soDon: number;
  choDonVi: number;
  choPhong: number;
  nguoiDangKy: NguoiDangKyTomTat[];
  trangThai: string | null;
  ghiChu?: string | null;
  chuNhiem?: string | null;
};

export type DonSoSanh = {
  id: number;
  code: string;
  ownerId: number;
  ownerName: string;
  ownerUnit: string;
  proposedBudget: number;
  durationMonths: number;
  note?: string | null;
  attachmentUrl?: string | null;
  status: TrangThaiHoSoDangKy;
  pkhReason?: string | null;
  unitComment?: string | null;
  thanhVien: ThanhVienSoSanh[];
};

export type ThanhVienSoSanh = {
  ten: string;
  vaiTro: string;
  hocVi?: string | null;
  hocHam?: string | null;
  diemNckh?: number | null;
  soNhiemVuDangLam: number;
};

export type SoSanhDangKy = {
  nhiemVu: {
    id: number;
    code: string;
    title: string;
    ideaId?: number | null;
    trangThai?: string | null;
    ghiChu?: string | null;
  };
  daPhanCong?: {
    id: number;
    code: string;
    dangKyId: number;
    principalName: string;
    outlineId?: number | null;
  } | null;
  don: DonSoSanh[];
};

export async function danhSachNhiemVuXetDuyet() {
  return get<ApiResponse<NhiemVuXetDuyet[]>>('/api/proposal-registrations/pkh-tasks');
}

export async function soSanhDonDangKy(nhiemVuId: number) {
  return get<ApiResponse<SoSanhDangKy>>(`/api/proposal-registrations/pkh-tasks/${nhiemVuId}`);
}

export async function chapThuanDonDangKy(nhiemVuId: number, registrationId: number, reason?: string) {
  return post<ApiResponse<SoSanhDangKy>>(`/api/proposal-registrations/pkh-tasks/${nhiemVuId}/accept`, {
    registrationId,
    reason: reason || null,
  });
}

export async function suaLyDoTuChoiDon(id: number, reason: string) {
  return patch<ApiResponse<{ id: number; pkhReason: string }>>(
    `/api/proposal-registrations/${id}/pkh-reason`,
    { reason },
  );
}

export async function xacNhanPhanCong(nhiemVuId: number) {
  return post<ApiResponse<{ id: number; code: string; outlineId: number; principalName: string }>>(
    `/api/proposal-registrations/pkh-tasks/${nhiemVuId}/assign`,
  );
}

export async function dongDangKyNhiemVu(nhiemVuId: number, reason: string) {
  return post<ApiResponse<{ id: number; trangThai: string; ghiChu: string }>>(
    `/api/proposal-registrations/pkh-tasks/${nhiemVuId}/close`,
    { reason },
  );
}

export async function chiTietDonDangKy(id: number) {
  return get<
    ApiResponse<{ hoSo: DonChoXacNhan; thanhVien: PublicationAuthor[]; coTheXuLy: boolean }>
  >(`/api/proposal-registrations/${id}`);
}

export async function xacNhanDonDangKy(id: number, note?: string) {
  return post<ApiResponse<DonChoXacNhan>>(`/api/proposal-registrations/${id}/confirm`, {
    note: note || null,
  });
}

export async function traLaiDonDangKy(id: number, reason: string) {
  return post<ApiResponse<DonChoXacNhan>>(`/api/proposal-registrations/${id}/return`, { reason });
}
