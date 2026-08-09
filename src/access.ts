/**
 * Access Control - CHỈ dùng IAM permission, không dùng role
 */
import { hasPermission, hasAnyPermission as hasAnyPerm, PERM } from '@/utils/permission';
import { isAdminKeKhaiUser } from '@/utils/adminKeKhai';

export type UserRole =
  | 'NCV'
  | 'CNDT'
  | 'TRUONG_DON_VI'
  | 'PHONG_KH'
  | 'QUANLY_KH_CNTT_HTQT'
  | 'HOI_DONG'
  | 'LANH_DAO'
  | 'ADMIN'
  | 'SUPER_ADMIN';

export interface AccessInitialState {
  currentUser?: {
    name: string;
    role?: UserRole;
    roleLabel?: string;
    avatar?: string;
    permissions?: string[];
    roles?: Array<{ code?: string }>;
  };
  permissions?: string[];
  loading?: boolean;
}

export default function access(initialState: AccessInitialState | undefined) {
  const permissions = initialState?.permissions ?? initialState?.currentUser?.permissions ?? [];
  const hasWildcard = permissions.includes('*');
  const currentUser = initialState?.currentUser;
  const isAdminSystemAccount = isAdminKeKhaiUser(currentUser);
  /** NCV/CNDT/… — không áp dụng cho tài khoản ADMIN/SUPER_ADMIN vận hành hệ thống. */
  const canUsePersonalWorkspace = !!currentUser && !isAdminSystemAccount;

  const has = (code: string) => hasPermission(permissions, code) || hasWildcard;
  const hasAny = (codes: string[]) => hasAnyPerm(permissions, codes) || hasWildcard;

  const hasAdminPermission = hasAny([
    PERM.department.view,
    PERM.field.view,
    PERM.specialization.view,
    PERM.project_process_type.view,
    PERM.user.view,
    PERM.role.view,
    PERM.permission.view,
    PERM.personal_profile.view,
  ]);

  return {
    isLogin: !!initialState?.currentUser,
    isAdminSystemAccount,
    canUsePersonalWorkspace,
    /** Super Admin: có wildcard '*' (chỉ role SUPER_ADMIN). */
    isSuperAdmin: hasWildcard,

    hasPermission: (code: string) => has(code),
    hasAnyPermission: (codes: string[]) => hasAny(codes),

    canViewAdmin: hasAdminPermission || hasWildcard,
    /** Menu "Danh mục hệ thống" — hiện khi có bất kỳ quyền xem danh mục con nào. */
    canViewCatalog: hasAny([
      PERM.department.view,
      PERM.field.view,
      PERM.specialization.view,
      PERM.project_process_type.view,
    ]),
    canViewDepartments: has(PERM.department.view),
    canCreateDepartment: has(PERM.department.create),
    canEditDepartment: has(PERM.department.update),
    canViewFields: has(PERM.field.view),
    canCreateField: has(PERM.field.create),
    canEditField: has(PERM.field.update),
    canViewSpecializations: has(PERM.specialization.view),
    canCreateSpecialization: has(PERM.specialization.create),
    canEditSpecialization: has(PERM.specialization.update),
    canViewProjectProcessTypes: has(PERM.project_process_type.view),
    canCreateProjectProcessType: has(PERM.project_process_type.create),
    canEditProjectProcessType: has(PERM.project_process_type.update),
    canViewUsers: has(PERM.user.view),
    canCreateUser: has(PERM.user.create),
    canEditUser: has(PERM.user.update),
    canAssignUserRole: has(PERM.user.assign_role),
    canResetUserPassword: has(PERM.user.reset_password),
    canViewRoles: has(PERM.role.view),
    canCreateRole: has(PERM.role.create),
    canEditRole: has(PERM.role.update),
    canAssignRolePermission: has(PERM.role.assign_permission),
    canViewPermissions: has(PERM.permission.view),
    canViewPersonalProfiles: has(PERM.personal_profile.view),
    canCreatePersonalProfile: has(PERM.personal_profile.create),
    canEditPersonalProfile: has(PERM.personal_profile.update),
    canChangePersonalProfileStatus: has(PERM.personal_profile.change_status),
    /** Danh sách nhân sự master (staffs) */
    canViewStaffDirectory: hasAny([PERM.department.view, PERM.personal_profile.view]),

    canViewHome: true,
    canViewProfile: hasAny([PERM.profile.view_own, PERM.profile.view_department, PERM.profile.view_all]),
    // Menu cha "Hồ sơ": hiện cho user thường (mục cá nhân) lẫn admin (mục quản lý)
    canViewProfileMenu:
      canUsePersonalWorkspace ||
      has(PERM.profile.view_all) ||
      has(PERM.personal_profile.view) ||
      has(PERM.department.view),
    canViewProfileSelf:
      canUsePersonalWorkspace &&
      hasAny([PERM.profile.view_own, PERM.profile.view_department, PERM.profile.view_all]),
    canEditProfileSelf: canUsePersonalWorkspace && has(PERM.profile.update_own),
    canViewProfileAll: has(PERM.profile.view_all),
    canVerifyProfile: has(PERM.profile.verify),
    canExportProfile: has(PERM.profile.export),
    canViewIdeaBank: has(PERM.idea.view),
    canViewMyIdeas: canUsePersonalWorkspace && has(PERM.idea.view),
    canManageIdeaBank: has(PERM.idea.manage),
    canReviewIdea: has(PERM.idea.review),
    canScoreIdea: has(PERM.council.score),
    // Menu Hội đồng chấm điểm: ai có council.view hoặc council.score (từ IAM) đều vào được
    canAccessCouncil: hasAny([PERM.council.view, PERM.council.score]),
    canProposeOrder: has(PERM.council.propose_order),
    canApproveOrder: has(PERM.council.approve_order),
    canViewProjectRegister:
      hasAny([PERM.project.create, PERM.project.submit, PERM.project.unit_review]) ||
      has(PERM.project.review),
    /** GV soạn thuyết minh: workspace cá nhân + quyền tạo/nộp/xem đề tài */
    canViewMyProjects:
      canUsePersonalWorkspace &&
      hasAny([PERM.project.view, PERM.project.create, PERM.project.submit]),
    canCreateProjectProposal: hasAny([PERM.project.create, PERM.project.submit]),
    /** Soạn / nộp thuyết minh chi tiết (US-04-01) */
    canWriteProjectOutline:
      canUsePersonalWorkspace &&
      hasAny([
        PERM.project.outline_manage,
        PERM.project.create,
        PERM.project.submit,
        PERM.project.update,
      ]),
    canUnitReviewProjectProposal: has(PERM.project.unit_review),
    canReviewProjectProposal: has(PERM.project.review) || has(PERM.project.selection_manage),
    /** PKH phân công phản biện kín (US-04-02) */
    canAssignOutlineBlindReview:
      has(PERM.project.blind_review_assign) ||
      has(PERM.project.review) ||
      has(PERM.project.selection_manage),
    /** Xem / chấm nhiệm vụ phản biện được phân công (US-04-03) */
    canViewOutlineReviewTasks:
      has(PERM.project.blind_review_score) ||
      canUsePersonalWorkspace ||
      has(PERM.project.review) ||
      has(PERM.project.selection_manage),
    /** PKH tổ chức bảo vệ (US-04-04) */
    canManageOutlineDefense:
      has(PERM.project.defense_manage) ||
      has(PERM.project.review) ||
      has(PERM.project.selection_manage),
    /** PKH gia hạn chỉnh sửa TM (US-04-05) */
    canExtendOutlineRevision:
      has(PERM.project.outline_revision_extend) ||
      has(PERM.project.adjustment_extend) ||
      has(PERM.project.review) ||
      has(PERM.project.selection_manage),
    /** US-04-06 — PKH đề xuất kinh phí */
    canProposeOutlineBudget:
      has(PERM.project.budget_propose) ||
      has(PERM.project.review) ||
      has(PERM.project.selection_manage),
    /** US-04-06 — TC thẩm tra KP */
    canConfirmOutlineBudget:
      has(PERM.project.budget_confirm) || has(PERM.project.liquidation),
    /** US-04-06 — LĐ phê duyệt */
    canApproveOutlineBudget:
      has(PERM.project.outline_approve) ||
      has(PERM.project.approve) ||
      has(PERM.project.selection_approve),
    canViewOutlineBudgetFlow:
      has(PERM.project.budget_propose) ||
      has(PERM.project.budget_confirm) ||
      has(PERM.project.outline_approve) ||
      has(PERM.project.review) ||
      has(PERM.project.liquidation) ||
      has(PERM.project.approve) ||
      has(PERM.project.selection_manage) ||
      has(PERM.project.selection_approve),
    canApproveProjectProposal:
      has(PERM.project.approve) || has(PERM.project.selection_approve),
    canManageSelectionSession:
      has(PERM.project.selection_manage) || has(PERM.project.review),
    canApproveSelectionSession:
      has(PERM.project.selection_approve) || has(PERM.project.approve),
    canExtendProposalAdjustment:
      has(PERM.project.adjustment_extend) ||
      has(PERM.project.review) ||
      has(PERM.project.selection_manage),
    canViewProjectManage: has(PERM.project.view),
    canViewProjectCouncil:
      has(PERM.council.view) ||
      has(PERM.project.review) ||
      has(PERM.project.approve) ||
      has(PERM.project.selection_manage) ||
      has(PERM.project.selection_approve),
    canViewAcceptance: has(PERM.project.acceptance),
    canViewFinance: has(PERM.finance.view),
    canViewReports: hasAny([
      PERM.report.view,
      PERM.report.view_department,
      PERM.report.view_all,
      PERM.report.export,
      PERM.dashboard.view_department,
      PERM.dashboard.view_all,
    ]),

    /** Thông báo tuyển chọn đề tài */
    canViewCfp: has(PERM.cfp.view),
    canCreateCfp: has(PERM.cfp.create),
    canUpdateCfp: has(PERM.cfp.update),
    canSubmitCfp: has(PERM.cfp.submit),
    canApproveCfp: has(PERM.cfp.approve),
    canPublishCfp: has(PERM.cfp.publish),
    canExtendCfp: has(PERM.cfp.extend),
    canCloseCfp: has(PERM.cfp.close),
    /** Menu Đề tài: hiện nếu có quyền đề tài / CFP / PKH review */
    canViewProjectsSection:
      has(PERM.project.view) ||
      has(PERM.project.create) ||
      has(PERM.project.submit) ||
      has(PERM.cfp.view) ||
      has(PERM.project.review) ||
      has(PERM.project.approve) ||
      hasWildcard,

    /** Menu Kết quả nghiên cứu khoa học — admin vận hành hoặc user có quyền publication / xem toàn trường */
    canViewResearchOutputs:
      isAdminSystemAccount ||
      has(PERM.publication.view) ||
      has(PERM.profile.view_all),
    canCreateResearchOutput: isAdminSystemAccount || has(PERM.publication.create),
    canUpdateResearchOutput: isAdminSystemAccount || has(PERM.publication.update),
    canDeleteResearchOutput: isAdminSystemAccount || has(PERM.publication.delete),
    canReviewResearchOutput: isAdminSystemAccount || has(PERM.publication.review),
    canApproveResearchOutput: isAdminSystemAccount || has(PERM.publication.approve),
  };
}
