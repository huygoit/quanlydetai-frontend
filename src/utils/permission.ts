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
  personal_profile: {
    view: 'personal_profile.view',
    create: 'personal_profile.create',
    update: 'personal_profile.update',
    change_status: 'personal_profile.change_status',
  },
} as const;
