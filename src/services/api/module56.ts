/**
 * API Module 5–6: sổ mục chi, tạm ứng, mua sắm, tiến độ, điều chỉnh, đánh giá cuối kỳ.
 */
import { ApiResponse, del, get, post, put } from '../request';

export type TepModule56 = {
  fileName: string;
  fileUrl: string;
  fileSize: number;
};

export type DongMucChi = {
  code: string;
  label: string;
  planned: number;
  advanced: number;
  spent: number;
  settled: number;
  remaining: number;
};

export type PhieuChi = {
  id: number;
  projectOutlineId: number;
  kind: 'TAM_UNG' | 'THANH_TOAN';
  lineCode: string;
  amount: number;
  detail: string;
  bankAccount: string;
  bankName: string;
  attachments: TepModule56[];
  status: string;
  overBudget: boolean;
  returnReason?: string | null;
  voucherNo?: string | null;
  voucherDate?: string | null;
};

export type HangMua = {
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  spec?: string;
  amount?: number;
};

export type PhieuMua = {
  id: number;
  projectOutlineId: number;
  kind: string;
  lineCode: string;
  purpose: string;
  neededBy?: string | null;
  items: HangMua[];
  attachments: TepModule56[];
  totalAmount: number;
  status: string;
  overBudget: boolean;
  overBudgetNote?: string | null;
  csvcMethod?: string | null;
  returnReason?: string | null;
  voucherNo?: string | null;
  voucherDate?: string | null;
  /** Inbox CSVC */
  outlineCode?: string | null;
  outlineTitle?: string | null;
  contractId?: number | null;
  contractNo?: string | null;
  redirectTo?: string;
};

export type BaoCaoTienDo = {
  id: number;
  periodId: number;
  status: string;
  contentRows: { milestone: string; progress: string; done: string }[];
  productRows: { name: string; planned?: string; achieved: string }[];
  nextPlan?: string | null;
  recommendation?: string | null;
  attachments: TepModule56[];
  pkhNote?: string | null;
  submittedAt?: string | null;
};

export type KyTienDo = {
  id: number;
  title: string;
  dueOn: string;
  kind: 'MILESTONE' | 'MIDPOINT';
  overdue: boolean;
  daysLeft?: number;
  report: BaoCaoTienDo | null;
};

export type MocHopDong = {
  content: string;
  thoiGian?: string;
  sanPham?: string;
  endDate?: string | null;
};

export type ManTienDo = {
  outline?: {
    id: number;
    code: string;
    title: string;
    ownerName?: string | null;
    ownerUnit?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    budget?: number;
    executionStatus?: string | null;
  };
  /** Tiến độ thực hiện trên hợp đồng — chọn để báo cáo */
  milestones?: MocHopDong[];
  templates?: {
    contentRows: {
      milestone: string;
      progress: string;
      done: string;
      thoiGian?: string;
      sanPham?: string;
    }[];
    productRows: { name: string; planned?: string; achieved: string }[];
  };
  finance: {
    advanced: number;
    spent: number;
    settled: number;
    lines: DongMucChi[];
  };
  periods: KyTienDo[];
};

export type PhieuDieuChinh = {
  id: number;
  projectOutlineId: number;
  status: string;
  reason: string;
  evidenceAttachments?: TepModule56[];
  changes: {
    endDate?: string | null;
    principalUserId?: number | null;
    content?: string | null;
    milestones?: {
      content: string;
      startDate?: string | null;
      endDate?: string | null;
      expectedResult?: string | null;
      /** % tiến độ lưu trên phiếu ĐC (nháp / nộp) */
      progress?: string | null;
    }[];
    budgetLines?: { code: string; amount: number }[];
    progressUpdates?: {
      periodId: number;
      progress?: string | null;
      done?: string | null;
      title?: string | null;
      dueOn?: string | null;
    }[];
  };
  leadConfirmed: boolean;
  decisionNote?: string | null;
  appendixFileUrl?: string | null;
  /** Hồ sơ chủ nhiệm mới (khi changes.principalUserId có) */
  principalProfile?: NguoiDieuChinh | null;
};

export type NguoiDieuChinh = {
  userId: number;
  fullName: string;
  email?: string | null;
  degree?: string | null;
  academicTitle?: string | null;
  unit?: string | null;
  nckhHours?: number | null;
};

export type ManDieuChinh = {
  outline: {
    id: number;
    code: string;
    title: string;
    startDate: string | null;
    endDate: string | null;
    ownerId: number | null;
    ownerName?: string | null;
    ownerUnit?: string | null;
    researchContent?: string | null;
    extensionCount: number;
    activeContractId?: number | null;
  };
  ownerProfile: NguoiDieuChinh | null;
  milestones: {
    content: string;
    startDate?: string | null;
    endDate?: string | null;
    expectedResult?: string | null;
    progress?: string;
    periodId?: number | null;
    reportStatus?: string | null;
    sourceIndex?: number;
  }[];
  progressRows: {
    periodId: number;
    title: string;
    dueOn: string | null;
    kind: string;
    reportStatus: string | null;
    progress: string;
    done: string;
    milestone: string;
  }[];
};

export type ThanhVienHoiDong = {
  userId: number;
  role: string;
  name?: string;
  fullName?: string;
};

export type HoSoCuoiKy = {
  projectOutlineId: number;
  code: string;
  title: string;
  executionStatus: string | null;
  overdueExplanation: boolean;
  dossier: {
    notifiedAt: string | null;
    submittedAt: string | null;
    summaryFile: TepModule56 | null;
    briefFile: TepModule56 | null;
    briefPagesOk: boolean;
    resultVi: string | null;
    resultEn: string | null;
    products: { name: string; fileUrl?: string | null; link?: string | null }[];
    councilFile: TepModule56 | null;
    publicationsNote: string | null;
    pkhNote: string | null;
  };
  council: {
    meetingAt: string | null;
    location: string | null;
    reviewDeadline?: string | null;
    members: ThanhVienHoiDong[];
  };
  sheets: {
    userId: number;
    productRows: { name: string; actual?: string; comment?: string }[];
    volumeComment: string;
    qualityComment: string;
    reportComment: string;
    generalComment: string;
    submittedAt: string | null;
  }[];
  minutes: {
    discussion?: string;
    volume?: string;
    quality?: string;
    recommendation?: string;
    presentUserIds?: number[];
    productMarks?: { name: string; met: boolean }[];
  } | null;
  minutesLocked: boolean;
  minutesFileUrl: string | null;
  classification: string | null;
  explanation: {
    status: string | null;
    items: { response?: string; text?: string }[];
    deadline: string | null;
    reportFile: TepModule56 | null;
    returnReason: string | null;
  };
  settlement: {
    status: string | null;
    lines: { code: string; declaredAmount: number }[];
    files: TepModule56[];
    varianceAck: boolean;
    varianceReason: string | null;
    date: string | null;
    returnReason: string | null;
  };
  liquidation: {
    status: string | null;
    surplusHandling: string | null;
    surplus: number;
    recognitionFileUrl: string | null;
    fileUrl: string | null;
    issueNo: string | null;
    bghSignedAt: string | null;
    publishedAt: string | null;
    cnnvSignedAt: string | null;
  };
  finance: {
    advanced: number;
    spent: number;
    settled: number;
    lines: DongMucChi[];
  };
  assets: {
    id?: number;
    name: string;
    quantity?: string | null;
    amount: number;
    note?: string | null;
  }[];
  reviewDeadlineTight?: boolean;
};

export function soMucChi(outlineId: number) {
  return get<ApiResponse<DongMucChi[]>>(`/api/module56/budget/${outlineId}`);
}

export function dsPhieuChi(outlineId: number) {
  return get<ApiResponse<PhieuChi[]>>('/api/module56/payments', { outlineId });
}

/** Chi tiết hồ sơ tạm ứng + báo cáo tiến độ (PKH đối chiếu). */
export type ChiTietPhieuChi = {
  payment: PhieuChi;
  outline: {
    id: number;
    code: string;
    title: string;
    ownerName?: string | null;
    ownerUnit?: string | null;
    activeContractId?: number | null;
    executionStatus?: string | null;
  };
  progress: {
    id: number;
    title: string;
    dueOn: string | null;
    kind: string;
    report: BaoCaoTienDo | null;
  }[];
};

export function chiTietPhieuChi(id: number) {
  return get<ApiResponse<ChiTietPhieuChi>>(`/api/module56/payments/${id}`);
}

export function luuPhieuChi(body: Record<string, unknown>) {
  return post<ApiResponse<PhieuChi>>('/api/module56/payments', body);
}

export function xoaPhieuChi(id: number) {
  return del<ApiResponse<{ id: number }>>(`/api/module56/payments/${id}`);
}

export function pkhPhieuChi(
  id: number,
  body: { action: 'accept' | 'return' | 'reject'; reason?: string },
) {
  return post<ApiResponse<PhieuChi>>(`/api/module56/payments/${id}/pkh`, body);
}

export function tcPhieuChi(
  id: number,
  body: {
    accept: boolean;
    voucherNo?: string;
    voucherDate?: string;
    reason?: string;
  },
) {
  return post<ApiResponse<PhieuChi>>(`/api/module56/payments/${id}/tc`, body);
}

export function dsMuaSam(outlineId: number) {
  return get<ApiResponse<PhieuMua[]>>('/api/module56/procurements', {
    outlineId,
  });
}

/** Inbox CSVC — không truyền outlineId */
export function dsMuaSamCsvc(params?: { status?: string }) {
  return get<ApiResponse<PhieuMua[]>>('/api/module56/procurements', params);
}

export function getMuaSam(id: number) {
  return get<ApiResponse<PhieuMua>>(`/api/module56/procurements/${id}`);
}

export function luuMuaSam(body: Record<string, unknown>) {
  return post<ApiResponse<PhieuMua>>('/api/module56/procurements', body);
}

export function pkhMuaSam(
  id: number,
  body: { action: string; reason?: string },
) {
  return post<ApiResponse<PhieuMua>>(
    `/api/module56/procurements/${id}/pkh`,
    body,
  );
}

export function csvcMuaSam(
  id: number,
  body: { action: string; method?: string; reason?: string },
) {
  return post<ApiResponse<PhieuMua>>(
    `/api/module56/procurements/${id}/csvc`,
    body,
  );
}

export function nhanMuaSam(id: number) {
  return post<ApiResponse<PhieuMua>>(
    `/api/module56/procurements/${id}/receive`,
  );
}

export function tcMuaSam(
  id: number,
  body: {
    accept: boolean;
    voucherNo?: string;
    voucherDate?: string;
    reason?: string;
  },
) {
  return post<ApiResponse<PhieuMua>>(
    `/api/module56/procurements/${id}/tc`,
    body,
  );
}

/** Nhiệm vụ mình là chủ nhiệm (Module 5) — không phụ thuộc quyền soạn TM */
export function dsNhiemVuChuNhiem() {
  return get<ApiResponse<import('./projectOutlines').ProjectOutline[]>>(
    '/api/module56/my-owned-tasks',
  );
}

export function manTienDo(outlineId: number) {
  return get<ApiResponse<ManTienDo>>('/api/module56/progress', { outlineId });
}

export function luuTienDo(periodId: number, body: Record<string, unknown>) {
  return post<ApiResponse<BaoCaoTienDo>>(
    `/api/module56/progress/periods/${periodId}`,
    body,
  );
}

export function pkhTienDo(
  id: number,
  body: { accept: boolean; note?: string },
) {
  return post<ApiResponse<BaoCaoTienDo>>(
    `/api/module56/progress/${id}/pkh`,
    body,
  );
}

export function xoaTienDo(id: number) {
  return del<ApiResponse<{ id: number }>>(`/api/module56/progress/${id}`);
}

export function dsDieuChinh(outlineId: number) {
  return get<ApiResponse<PhieuDieuChinh[]>>('/api/module56/adjustments', {
    outlineId,
  });
}

export function manDieuChinh(outlineId: number) {
  return get<ApiResponse<ManDieuChinh>>('/api/module56/adjustments/context', {
    outlineId,
  });
}

export function timChuNhiemDieuChinh(outlineId: number, keyword: string) {
  return get<ApiResponse<NguoiDieuChinh[]>>('/api/module56/adjustments/principals', {
    outlineId,
    keyword,
  });
}

export function luuDieuChinh(body: Record<string, unknown>) {
  return post<ApiResponse<PhieuDieuChinh>>('/api/module56/adjustments', body);
}

export function getDieuChinh(id: number) {
  return get<
    ApiResponse<
      PhieuDieuChinh & {
        redirectTo: string;
        activeContractId?: number | null;
        outlineCode?: string;
      }
    >
  >(`/api/module56/adjustments/${id}`);
}

export function pkhDieuChinh(
  id: number,
  body: { action: 'accept' | 'return'; note?: string },
) {
  return post(`/api/module56/adjustments/${id}/pkh`, body);
}

export function leadDieuChinh(id: number) {
  return post(`/api/module56/adjustments/${id}/lead-confirm`);
}

export function bghDieuChinh(
  id: number,
  body: { accept: boolean; note?: string },
) {
  return post(`/api/module56/adjustments/${id}/bgh`, body);
}

export type ThanhTuu = {
  outlineId: number;
  code: string;
  title: string;
  ownerId: number;
  ownerName: string;
  ownerUnit?: string | null;
  budget?: number | null;
  classification?: string | null;
  completedAt?: string | null;
  members: {
    fullName: string;
    role: string;
    profileId?: number | null;
    departmentId?: number | null;
  }[];
};

export function danhSachThanhTuu(params?: {
  year?: number;
  userId?: number;
  departmentId?: number;
}) {
  return get<ApiResponse<ThanhTuu[]>>('/api/module56/achievements', params);
}

export function moLaiBienBanCuoiKy(outlineId: number, reason: string) {
  return post(`/api/module56/final/${outlineId}/minutes-reopen`, { reason });
}

export function hoSoCuoiKy(outlineId: number) {
  return get<ApiResponse<HoSoCuoiKy>>(`/api/module56/final/${outlineId}`);
}

export function thongBaoCuoiKy(outlineId: number) {
  return post(`/api/module56/final/${outlineId}/notify`);
}

export function luuHoSoCuoiKy(
  outlineId: number,
  body: Record<string, unknown>,
) {
  return put<ApiResponse<HoSoCuoiKy>>(
    `/api/module56/final/${outlineId}/dossier`,
    body,
  );
}

export function duyetHoSoCuoiKy(
  outlineId: number,
  body: { accept: boolean; briefPagesOk?: boolean; note?: string },
) {
  return post(`/api/module56/final/${outlineId}/dossier-review`, body);
}

export function luuHoiDong(outlineId: number, body: Record<string, unknown>) {
  return put<ApiResponse<HoSoCuoiKy>>(
    `/api/module56/final/${outlineId}/council`,
    body,
  );
}

export function nhacPhanBien(outlineId: number, userId: number) {
  return post(`/api/module56/final/${outlineId}/remind/${userId}`);
}

export function luuPhieuCham(outlineId: number, body: Record<string, unknown>) {
  return put(`/api/module56/final/${outlineId}/sheet`, body);
}

export function luuBienBan(outlineId: number, body: Record<string, unknown>) {
  return post<ApiResponse<HoSoCuoiKy>>(
    `/api/module56/final/${outlineId}/minutes`,
    body,
  );
}

export function quyetDinhKhongDat(outlineId: number, retry: boolean) {
  return post(`/api/module56/final/${outlineId}/fail-decision`, { retry });
}

export function luuGiaiTrinh(outlineId: number, body: Record<string, unknown>) {
  return put(`/api/module56/final/${outlineId}/explanation`, body);
}

export function xacNhanGiaiTrinh(
  outlineId: number,
  body: { accept: boolean; reason?: string },
) {
  return post(`/api/module56/final/${outlineId}/explanation-confirm`, body);
}

export function giaHanGiaiTrinh(outlineId: number, deadline: string) {
  return post(`/api/module56/final/${outlineId}/explanation-extend`, {
    deadline,
  });
}

export function luuQuyetToan(outlineId: number, body: Record<string, unknown>) {
  return put(`/api/module56/final/${outlineId}/settlement`, body);
}

export function pkhQuyetToan(
  outlineId: number,
  body: { accept: boolean; note?: string },
) {
  return post(`/api/module56/final/${outlineId}/settlement-pkh`, body);
}

export function xacNhanChenhLech(outlineId: number, reason: string) {
  return post(`/api/module56/final/${outlineId}/variance`, { reason });
}

export function tcQuyetToan(
  outlineId: number,
  body: { accept: boolean; date?: string; reason?: string },
) {
  return post(`/api/module56/final/${outlineId}/settlement-tc`, body);
}

export function luuThanhLy(outlineId: number, body: Record<string, unknown>) {
  return put(`/api/module56/final/${outlineId}/liquidation`, body);
}

export function trinhThanhLy(outlineId: number) {
  return post(`/api/module56/final/${outlineId}/liquidation-submit`);
}

export function bghThanhLy(
  outlineId: number,
  body: { accept: boolean; reason?: string },
) {
  return post(`/api/module56/final/${outlineId}/liquidation-bgh`, body);
}

export function phatHanhThanhLy(outlineId: number, issueNo: string) {
  return post(`/api/module56/final/${outlineId}/liquidation-publish`, {
    issueNo,
  });
}

export function cnnvThanhLy(outlineId: number) {
  return post(`/api/module56/final/${outlineId}/liquidation-cnnv`);
}
