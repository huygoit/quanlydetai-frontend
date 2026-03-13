/**
 * Permission helpers - Kiểm tra quyền theo permission codes
 */

export type PermissionCode = string;

/**
 * Kiểm tra user có permission cụ thể
 * Hỗ trợ wildcard "*" = có tất cả quyền
 */
export function hasPermission(
  permissions: string[] | undefined,
  code: PermissionCode
): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(code);
}

/**
 * Kiểm tra user có ít nhất 1 trong các permission
 * Hỗ trợ wildcard "*" = có tất cả quyền
 */
export function hasAnyPermission(
  permissions: string[] | undefined,
  codes: PermissionCode[]
): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  if (permissions.includes('*')) return true;
  return codes.some((code) => permissions.includes(code));
}

/**
 * Kiểm tra user có tất cả các permission
 */
export function hasAllPermissions(
  permissions: string[] | undefined,
  codes: PermissionCode[]
): boolean {
  if (!permissions || !Array.isArray(permissions)) return false;
  return codes.every((code) => permissions.includes(code));
}

/** Permission codes cho IAM Admin */
export const PERM = {
  department: {
    view: 'department.view',
    create: 'department.create',
    update: 'department.update',
    delete: 'department.delete',
  },
  user: {
    view: 'user.view',
    create: 'user.create',
    update: 'user.update',
    delete: 'user.delete',
    assign_role: 'user.assign_role',
    reset_password: 'user.reset_password',
  },
  role: {
    view: 'role.view',
    create: 'role.create',
    update: 'role.update',
    delete: 'role.delete',
    assign_permission: 'role.assign_permission',
  },
  permission: {
    view: 'permission.view',
  },
  report: {
    view: 'report.view',
    view_department: 'report.view_department',
    view_all: 'report.view_all',
    export: 'report.export',
  },
  /** Hồ sơ khoa học (profile module) - khớp backend */
  profile: {
    view: 'profile.view_own',
    view_own: 'profile.view_own',
    view_department: 'profile.view_department',
    view_all: 'profile.view_all',
    update: 'profile.update_own',
    update_own: 'profile.update_own',
    verify: 'profile.verify',
    export: 'profile.export',
  },
  /** Ngân hàng ý tưởng - khớp backend (idea.manage = idea.review | idea.approve) */
  idea: {
    view: 'idea.view',
    manage: 'idea.review',
    review: 'idea.review',
    approve: 'idea.approve',
    create: 'idea.create',
    update: 'idea.update',
    submit: 'idea.submit',
    delete: 'idea.delete',
  },
  /** Hội đồng - khớp backend */
  council: {
    view: 'council.view',
    create: 'council.create',
    update: 'council.update',
    assign_member: 'council.assign_member',
    score: 'council.score',
    propose_order: 'council.propose_order',
    approve_order: 'council.approve_order',
  },
  /** Đề tài nghiên cứu - khớp backend (project.register = project.create | project.submit) */
  project: {
    view: 'project.view',
    register: 'project.create',
    create: 'project.create',
    update: 'project.update',
    submit: 'project.submit',
    unit_review: 'project.assign_reviewer',
    review: 'project.review',
    approve: 'project.approve',
    assign_reviewer: 'project.assign_reviewer',
    acceptance: 'project.acceptance',
    liquidation: 'project.liquidation',
  },
  /** Tài chính - backend dùng project.liquidation */
  finance: {
    view: 'project.liquidation',
  },
  /** Dashboard/Report - backend dùng dashboard.* */
  dashboard: {
    view_department: 'dashboard.view_department',
    view_all: 'dashboard.view_all',
  },
  personal_profile: {
    view: 'personal_profile.view',
    create: 'personal_profile.create',
    update: 'personal_profile.update',
    change_status: 'personal_profile.change_status',
  },
} as const;
