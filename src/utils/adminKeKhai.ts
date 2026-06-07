/** Role tài khoản vận hành — không dùng workspace cá nhân (hồ sơ NCV, ý tưởng/đề tài của tôi). */
export const ADMIN_KE_KHAI_ROLE_CODES = ['ADMIN', 'SUPER_ADMIN'] as const;

/** Route chỉ dành NCV/CNDT — admin hệ thống không truy cập. */
export const PERSONAL_WORKSPACE_PATHS = [
  '/profile/me',
  '/my-personal-profile',
  '/ideas/my',
  '/ideas/new',
  '/projects/my',
] as const;

export interface AdminKeKhaiUserLike {
  role?: string;
  roles?: Array<{ code?: string }>;
}

/** User đang đăng nhập là admin vận hành (ADMIN / SUPER_ADMIN). */
export function isAdminKeKhaiUser(user?: AdminKeKhaiUserLike | null): boolean {
  if (!user) return false;
  if (user.role && (ADMIN_KE_KHAI_ROLE_CODES as readonly string[]).includes(user.role)) {
    return true;
  }
  return (user.roles ?? []).some(
    (r) => r.code && (ADMIN_KE_KHAI_ROLE_CODES as readonly string[]).includes(r.code)
  );
}

export function isPersonalWorkspacePath(pathname: string): boolean {
  const path = pathname.split('?')[0] ?? pathname;
  return PERSONAL_WORKSPACE_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}
