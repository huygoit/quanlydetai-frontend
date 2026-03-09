/**
 * Access Control - Quản lý quyền truy cập
 * Kết hợp permission-based (IAM) và role-based (legacy)
 */
import { hasPermission, hasAnyPermission as hasAnyPerm, PERM } from '@/utils/permission';

export type UserRole =
  | 'NCV'
  | 'CNDT'
  | 'TRUONG_DON_VI'
  | 'PHONG_KH'
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
  const role = initialState?.currentUser?.role ?? 'NCV';

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const isNCV = role === 'NCV';
  const isCNDT = role === 'CNDT';
  const isTruongDonVi = role === 'TRUONG_DON_VI';
  const isPhongKH = role === 'PHONG_KH';
  const isLanhDao = role === 'LANH_DAO';
  const isHoiDong = role === 'HOI_DONG';
  const isResearcher = isNCV || isCNDT;

  // Permission-based checks cho IAM Admin
  const canViewDepartments = hasPermission(permissions, PERM.department.view);
  const canCreateDepartment = hasPermission(permissions, PERM.department.create);
  const canEditDepartment = hasPermission(permissions, PERM.department.update);
  const canViewUsers = hasPermission(permissions, PERM.user.view);
  const canCreateUser = hasPermission(permissions, PERM.user.create);
  const canEditUser = hasPermission(permissions, PERM.user.update);
  const canAssignUserRole = hasPermission(permissions, PERM.user.assign_role);
  const canResetUserPassword = hasPermission(permissions, PERM.user.reset_password);
  const canViewRoles = hasPermission(permissions, PERM.role.view);
  const canCreateRole = hasPermission(permissions, PERM.role.create);
  const canEditRole = hasPermission(permissions, PERM.role.update);
  const canAssignRolePermission = hasPermission(permissions, PERM.role.assign_permission);
  const canViewPermissions = hasPermission(permissions, PERM.permission.view);

  const hasAdminPermission = hasAnyPerm(permissions, [
    PERM.department.view,
    PERM.user.view,
    PERM.role.view,
    PERM.permission.view,
  ]);

  const canViewAdmin = isAdmin || hasAdminPermission;

  // Fallback: ADMIN/SUPER_ADMIN hoặc permission "*" = có tất cả quyền IAM
  const hasPermsFromBackend = permissions.length > 0;
  const hasWildcard = permissions.includes('*');
  const adminHasAll = (isAdmin && !hasPermsFromBackend) || hasWildcard;

  return {
    isLogin: !!initialState?.currentUser,

    hasPermission: (code: string) => hasPermission(permissions, code),
    hasAnyPermission: (codes: string[]) => hasAnyPerm(permissions, codes),

    canViewAdmin,
    canViewDepartments: canViewDepartments || adminHasAll,
    canCreateDepartment: canCreateDepartment || adminHasAll,
    canEditDepartment: canEditDepartment || adminHasAll,
    canViewUsers: canViewUsers || adminHasAll,
    canCreateUser: canCreateUser || adminHasAll,
    canEditUser: canEditUser || adminHasAll,
    canAssignUserRole: canAssignUserRole || adminHasAll,
    canResetUserPassword: canResetUserPassword || adminHasAll,
    canViewRoles: canViewRoles || adminHasAll,
    canCreateRole: canCreateRole || adminHasAll,
    canEditRole: canEditRole || adminHasAll,
    canAssignRolePermission: canAssignRolePermission || adminHasAll,
    canViewPermissions: canViewPermissions || adminHasAll,

    canViewHome: true,
    canViewProfile: isResearcher || isTruongDonVi || isPhongKH || isHoiDong || isLanhDao || isAdmin,
    canViewProfileSelf: isResearcher || isTruongDonVi || isPhongKH || isLanhDao || isAdmin,
    canEditProfileSelf: isResearcher || isTruongDonVi || isPhongKH || isLanhDao || isAdmin,
    canViewProfileAll: isPhongKH || isHoiDong || isLanhDao || isAdmin,
    canVerifyProfile: isPhongKH || isAdmin,
    canExportProfile: isResearcher || isPhongKH || isLanhDao || isAdmin,
    canViewIdeaBank: isResearcher || isPhongKH || isLanhDao || isHoiDong || isAdmin,
    canManageIdeaBank: isPhongKH || isHoiDong || isLanhDao || isAdmin,
    canReviewIdea: isPhongKH || isAdmin,
    canScoreIdea: isHoiDong || isAdmin,
    canProposeOrder: isHoiDong || isAdmin,
    canApproveOrder: isLanhDao || isAdmin,
    canViewProjectRegister: isResearcher || isTruongDonVi || isPhongKH || isAdmin,
    canViewProjectManage: isCNDT || isPhongKH || isLanhDao || isAdmin,
    canViewProjectCouncil: isHoiDong || isPhongKH || isLanhDao || isAdmin,
    canViewAcceptance: isCNDT || isPhongKH || isHoiDong || isLanhDao || isAdmin,
    canViewFinance: isCNDT || isPhongKH || isLanhDao || isAdmin,
    canViewReports: isPhongKH || isLanhDao || isAdmin,
  };
}
