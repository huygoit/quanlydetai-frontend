/**
 * Access Control - Quản lý quyền truy cập
 * Dựa trên specs/menu-enterprise.md
 */

export type UserRole =
  | 'NCV'           // Nhà khoa học / Giảng viên
  | 'CNDT'          // Chủ nhiệm đề tài
  | 'TRUONG_DON_VI' // Trưởng đơn vị
  | 'PHONG_KH'      // Phòng Khoa học
  | 'HOI_DONG'      // Hội đồng
  | 'LANH_DAO'      // Lãnh đạo
  | 'ADMIN';        // Admin

// Interface phải khớp với getInitialState() trong app.ts
export interface InitialState {
  currentUser?: {
    name: string;
    role: UserRole;
    roleLabel: string;
    avatar?: string;
  };
  loading?: boolean;
}

/**
 * Access function - Trả về object các quyền
 * Được gọi tự động bởi Umi Max với initialState từ app.ts
 */
export default function access(initialState?: InitialState) {
  const role = initialState?.currentUser?.role ?? 'NCV';

  // Role checks
  const isAdmin = role === 'ADMIN';
  const isNCV = role === 'NCV';
  const isCNDT = role === 'CNDT';
  const isTruongDonVi = role === 'TRUONG_DON_VI';
  const isPhongKH = role === 'PHONG_KH';
  const isLanhDao = role === 'LANH_DAO';
  const isHoiDong = role === 'HOI_DONG';

  // Nhóm quyền cơ bản
  const isResearcher = isNCV || isCNDT; // Người làm nghiên cứu

  return {
    // ============ MENU ACCESS - theo specs/menu-enterprise.md ============

    // 1. Trang chủ - Ai cũng xem được
    canViewHome: true,

    // 2. Hồ sơ khoa học
    canViewProfile: isResearcher || isTruongDonVi || isPhongKH || isLanhDao || isAdmin,

    // 3. Ngân hàng ý tưởng - theo specs/ideas-v3-final.md & ideas-council-weighted.md
    canViewIdeaBank: isResearcher || isPhongKH || isLanhDao || isHoiDong || isAdmin,
    canManageIdeaBank: isPhongKH || isHoiDong || isLanhDao || isAdmin, // Menu: Sơ loại & đặt hàng
    canReviewIdea: isPhongKH || isAdmin, // Phòng KH: sơ loại (SUBMITTED → REVIEWING → APPROVED_INTERNAL)
    canScoreIdea: isHoiDong || isAdmin, // Hội đồng KH&ĐT: chấm điểm ý tưởng (specs/ideas-council-weighted.md)
    canProposeOrder: isHoiDong || isAdmin, // Hội đồng KH&ĐT: đề xuất đặt hàng (APPROVED_INTERNAL → PROPOSED_FOR_ORDER)
    canApproveOrder: isLanhDao || isAdmin, // Lãnh đạo: phê duyệt đặt hàng (PROPOSED_FOR_ORDER → APPROVED_FOR_ORDER)

    // 4. Đề tài nghiên cứu
    canViewProjectRegister: isResearcher || isTruongDonVi || isPhongKH || isAdmin, // Đăng ký đề xuất GĐ1
    canViewProjectManage: isCNDT || isPhongKH || isLanhDao || isAdmin, // Đề tài của tôi GĐ3
    canViewProjectCouncil: isHoiDong || isPhongKH || isLanhDao || isAdmin, // Hội đồng 2A/2B
    canViewAcceptance: isCNDT || isPhongKH || isHoiDong || isLanhDao || isAdmin, // Nghiệm thu GĐ4

    // 5. Tài chính đề tài
    canViewFinance: isCNDT || isPhongKH || isLanhDao || isAdmin,

    // 6. Báo cáo & thống kê
    canViewReports: isPhongKH || isLanhDao || isAdmin,

    // 7. Quản trị hệ thống
    canViewAdmin: isAdmin,
  };
}
