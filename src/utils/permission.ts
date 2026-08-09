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
  /** Lĩnh vực (danh mục lĩnh vực khoa học) - khớp backend */
  field: {
    view: 'field.view',
    create: 'field.create',
    update: 'field.update',
    delete: 'field.delete',
  },
  /** Chuyên ngành (danh mục chuyên ngành) - khớp backend */
  specialization: {
    view: 'specialization.view',
    create: 'specialization.create',
    update: 'specialization.update',
    delete: 'specialization.delete',
  },
  /** Loại quy trình đề tài (QT-I … QT-V) */
  project_process_type: {
    view: 'project_process_type.view',
    create: 'project_process_type.create',
    update: 'project_process_type.update',
    delete: 'project_process_type.delete',
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
    /** US-03-04 — quản lý phiên xét chọn */
    selection_manage: 'project.selection_manage',
    /** US-03-04 — BGH duyệt danh mục xét chọn */
    selection_approve: 'project.selection_approve',
    /** US-03-05 — gia hạn điều chỉnh */
    adjustment_extend: 'project.adjustment_extend',
    /** US-04-01 — soạn / nộp / chỉnh sửa thuyết minh */
    outline_manage: 'project.outline_manage',
    /** US-04-02 — phân công phản biện kín */
    blind_review_assign: 'project.blind_review_assign',
    /** US-04-03 — chấm phản biện kín */
    blind_review_score: 'project.blind_review_score',
    /** US-04-04 — tổ chức bảo vệ */
    defense_manage: 'project.defense_manage',
    /** US-04-05 — gia hạn chỉnh sửa TM */
    outline_revision_extend: 'project.outline_revision_extend',
    /** US-04-06 — PKH đề xuất KP */
    budget_propose: 'project.budget_propose',
    /** US-04-06 — TC xác nhận KP */
    budget_confirm: 'project.budget_confirm',
    /** US-04-06 — LĐ phê duyệt TM */
    outline_approve: 'project.outline_approve',
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
  /** Kết quả nghiên cứu khoa học — khớp module publication trên IAM */
  publication: {
    view: 'publication.view',
    create: 'publication.create',
    update: 'publication.update',
    delete: 'publication.delete',
    review: 'publication.review',
    approve: 'publication.approve',
  },
  /** Thông báo tuyển chọn đề tài (CFP) */
  cfp: {
    view: 'cfp.view',
    create: 'cfp.create',
    update: 'cfp.update',
    submit: 'cfp.submit',
    approve: 'cfp.approve',
    publish: 'cfp.publish',
    extend: 'cfp.extend',
    close: 'cfp.close',
  },
} as const;
