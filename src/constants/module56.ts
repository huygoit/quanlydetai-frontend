/** Nhãn nghiệp vụ Module 5–6, khớp mã API. */

export const MUC_CHI = [
  { code: 'MUC_01', label: 'Công lao động trực tiếp' },
  { code: 'MUC_02', label: 'Vật tư' },
  { code: 'MUC_03', label: 'TSCĐ' },
  { code: 'MUC_04', label: 'Hội thảo / công tác phí' },
  { code: 'MUC_05', label: 'Thuê ngoài' },
  { code: 'MUC_06', label: 'Điều tra, khảo sát' },
  { code: 'MUC_07', label: 'Văn phòng phẩm' },
  { code: 'MUC_08', label: 'Họp hội đồng' },
  { code: 'MUC_09', label: 'Quản lý chung' },
  { code: 'MUC_10', label: 'Chi khác' },
] as const;

export const MUC_MUA_SAM = ['MUC_02', 'MUC_03', 'MUC_05'];

export const HAN_FILE = {
  phieu: 10 * 1024 * 1024,
  tienDo: 50 * 1024 * 1024,
  tomTat: 30 * 1024 * 1024,
  tomTatNgan: 10 * 1024 * 1024,
};

export const NHAN_TRIEN_KHAI: Record<string, string> = {
  DANG_THUC_HIEN: 'Đang thực hiện',
  DGCK_DRAFT: 'Hồ sơ cuối kỳ (nháp)',
  DGCK_CHO_PKH: 'Hồ sơ chờ PKH',
  DGCK_BS: 'Hồ sơ cần bổ sung',
  DGCK_HOP_HD: 'Họp hội đồng',
  DGCK_CHINH_SUA: 'Chỉnh sửa / giải trình',
  DGCK_KHONG_DAT: 'Không đạt',
  DGCK_DINH_CHI: 'Đình chỉ',
  DGCK_CHO_QUYET_TOAN: 'Chờ quyết toán',
  DGCK_CHO_THANH_LY: 'Chờ thanh lý',
  HOAN_THANH: 'Hoàn thành',
};

export const NHAN_YCKT: Record<string, string> = {
  YCKT_DRAFT: 'Nháp',
  YCKT_PKH: 'Chờ PKH',
  YCKT_BS: 'Cần bổ sung',
  YCKT_TC: 'Chờ KH-TC',
  YCKT_DONE: 'Đã ghi sổ',
};

export const NHAN_MS: Record<string, string> = {
  MS_DRAFT: 'Nháp',
  MS_CHO_PKH: 'Chờ PKH',
  MS_BS: 'Cần bổ sung',
  MS_CHO_CSVC: 'Chờ CSVC',
  MS_TU_CHOI: 'CSVC từ chối',
  MS_DAU_THAU_THAT_BAI: 'Đấu thầu hỏng',
  MS_DONG: 'Đã đóng',
  MS_CHO_NHAN: 'Chờ CNNV nhận',
  MS_CHO_TC: 'Chờ KH-TC',
  MS_DONE: 'Đã ghi sổ',
};

export const NHAN_BCTD: Record<string, string> = {
  BCTD_DRAFT: 'Nháp',
  BCTD_CHO_PKH: 'Chờ PKH',
  BCTD_BS: 'Cần bổ sung',
  BCTD_DONE: 'Đã duyệt',
};

export const NHAN_DC: Record<string, string> = {
  DC_DRAFT: 'Nháp',
  DC_PENDING_PKH: 'Chờ PKH',
  DC_BS: 'Cần bổ sung',
  DC_PENDING_BGH: 'Chờ BGH',
  DC_APPROVED: 'Đã duyệt',
  DC_REJECTED: 'Từ chối',
};

export const NHAN_LOAI_CHI = {
  TAM_UNG: 'Tạm ứng',
  THANH_TOAN: 'Thanh toán',
};

export const NHAN_LOAI_MUA = {
  VAT_TU: 'Vật tư',
  DUNG_CU: 'Dụng cụ',
  THIET_BI: 'Thiết bị',
  THUE_NGOAI: 'Thuê ngoài',
};

export const NHAN_VAI_TRO_HD = {
  CHU_TICH: 'Chủ tịch',
  THU_KY: 'Thư ký',
  PHAN_BIEN: 'Phản biện',
  UY_VIEN: 'Ủy viên',
};

export const NHAN_XEP_LOAI = {
  DAT_YEU_CAU: 'Đạt yêu cầu',
  CAN_BO_SUNG: 'Cần bổ sung',
  KHONG_DAT: 'Không đạt',
};

export function nhanMuc(code: string) {
  return MUC_CHI.find((m) => m.code === code)?.label || code;
}
