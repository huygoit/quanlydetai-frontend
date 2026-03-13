/**
 * Access Control - CHỈ dùng IAM permission, không dùng role
 */
import { hasPermission, hasAnyPermission as hasAnyPerm, PERM } from '@/utils/permission';

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
  };
  permissions?: string[];
  loading?: boolean;
}

export default function access(initialState: AccessInitialState | undefined) {
  const permissions = initialState?.permissions ?? initialState?.currentUser?.permissions ?? [];
  const hasWildcard = permissions.includes('*');

  const has = (code: string) => hasPermission(permissions, code) || hasWildcard;
  const hasAny = (codes: string[]) => hasAnyPerm(permissions, codes) || hasWildcard;

  const hasAdminPermission = hasAny([
    PERM.department.view,
    PERM.user.view,
    PERM.role.view,
    PERM.permission.view,
    PERM.personal_profile.view,
  ]);

  return {
    isLogin: !!initialState?.currentUser,

    hasPermission: (code: string) => has(code),
    hasAnyPermission: (codes: string[]) => hasAny(codes),

    canViewAdmin: hasAdminPermission || hasWildcard,
    canViewDepartments: has(PERM.department.view),
    canCreateDepartment: has(PERM.department.create),
    canEditDepartment: has(PERM.department.update),
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

    canViewHome: true,
    canViewProfile: hasAny([PERM.profile.view_own, PERM.profile.view_department, PERM.profile.view_all]),
    canViewProfileSelf: hasAny([PERM.profile.view_own, PERM.profile.view_department, PERM.profile.view_all]),
    canEditProfileSelf: has(PERM.profile.update_own),
    canViewProfileAll: has(PERM.profile.view_all),
    canVerifyProfile: has(PERM.profile.verify),
    canExportProfile: has(PERM.profile.export),
    canViewIdeaBank: has(PERM.idea.view),
    canManageIdeaBank: has(PERM.idea.manage),
    canReviewIdea: has(PERM.idea.review),
    canScoreIdea: has(PERM.council.score),
    canAccessCouncil: has(PERM.council.view),
    canProposeOrder: has(PERM.council.propose_order),
    canApproveOrder: has(PERM.council.approve_order),
    canViewProjectRegister: hasAny([PERM.project.create, PERM.project.submit]),
    canCreateProjectProposal: hasAny([PERM.project.create, PERM.project.submit]),
    canUnitReviewProjectProposal: has(PERM.project.unit_review),
    canReviewProjectProposal: has(PERM.project.review),
    canViewProjectManage: has(PERM.project.view),
    canViewProjectCouncil: has(PERM.council.view),
    canViewAcceptance: has(PERM.project.acceptance),
    canViewFinance: has(PERM.finance.view),
    canViewReports: hasAny([PERM.report.view, PERM.report.view_department, PERM.report.view_all, PERM.report.export]),
  };
}
