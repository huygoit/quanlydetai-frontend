import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {
    configProvider: {},
  },
  locale: {
    default: 'vi-VN',
    antd: true,
    baseNavigator: false,
  },
  // Proxy /api sang backend (dev). Đổi target nếu chạy API cổng khác.
  proxy: {
    '/api': {
      target: 'http://localhost:3333',
      changeOrigin: true,
    },
    /**
     * Proxy file tĩnh upload (chứng chỉ/đính kèm) sang backend.
     * Backend phục vụ theo route: GET /storage/profile-attachments/:filename
     */
    '/storage': {
      target: 'http://localhost:3333',
      changeOrigin: true,
    },
    /** Biên bản xét chọn (HTML) trong public/uploads */
    '/uploads': {
      target: 'http://localhost:3333',
      changeOrigin: true,
    },
  },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'KHCN & ĐMST',
    locale: false,
  },
  routes: [
    // Trang đăng nhập - không hiển thị layout
    {
      path: '/login',
      component: '@/pages/login',
      layout: false,
    },
    // Trang đăng ký - không hiển thị layout
    {
      path: '/register',
      component: '@/pages/user/Register',
      layout: false,
    },

    {
      path: '/home',
      name: 'Dashboard',
      icon: 'AreaChartOutlined',
      component: '@/pages/Home',
      access: 'canViewHome',
    },

    // Hồ sơ - cha chung: user thấy 2 mục cá nhân, admin thấy 2 mục quản lý (tự lọc theo quyền)
    {
      name: 'Hồ sơ',
      icon: 'IdcardOutlined',
      access: 'canViewProfileMenu',
      routes: [
        {
          path: '/profile/me',
          name: 'Hồ sơ khoa học của tôi',
          icon: 'SolutionOutlined',
          component: '@/pages/profile/me',
          access: 'canViewProfileSelf',
        },
        {
          path: '/my-personal-profile',
          name: 'Hồ sơ cán bộ của tôi',
          icon: 'UserOutlined',
          component: '@/pages/my-personal-profile',
          access: 'canUsePersonalWorkspace',
        },
        {
          path: '/profile/list',
          name: 'Danh sách Hồ sơ khoa học',
          icon: 'TeamOutlined',
          component: '@/pages/profile/list',
          access: 'canViewProfileAll',
        },
        {
          // Master nhân sự = staffs (personal_profiles chỉ còn lớp legacy/form)
          path: '/admin/staffs',
          name: 'Danh sách hồ sơ nhân sự',
          icon: 'IdcardOutlined',
          component: '@/pages/admin/staffs',
          access: 'canViewStaffDirectory',
        },
      ],
    },
    // Lý lịch khoa học - trang in/PDF standalone (không layout Pro để in sạch)
    {
      path: '/profile/cv',
      name: 'Lý lịch khoa học',
      component: '@/pages/profile/cv',
      access: 'canViewProfileSelf',
      layout: false,
      hideInMenu: true,
    },
    // Chi tiết hồ sơ (hidden route)
    {
      path: '/profile/:id',
      name: 'Chi tiết hồ sơ',
      component: '@/pages/profile/detail',
      access: 'canViewProfileAll',
      hideInMenu: true,
    },

    // Ngân hàng ý tưởng
    {
      path: '/ideas',
      name: 'Ý tưởng',
      icon: 'BulbOutlined',
      access: 'canViewIdeaBank',
      routes: [
        {
          path: '/ideas/new',
          name: 'Tạo ý tưởng mới',
          component: '@/pages/ideas/new',
          access: 'canViewMyIdeas',
          hideInMenu: true,
        },
        {
          path: '/ideas/list',
          name: 'Danh sách ý tưởng',
          icon: 'UnorderedListOutlined',
          component: '@/pages/ideas/list',
          access: 'canViewIdeaBank',
        },
        {
          path: '/ideas/my',
          name: 'Ý tưởng của tôi',
          icon: 'UserOutlined',
          component: '@/pages/ideas/my',
          access: 'canViewMyIdeas',
        },
        {
          path: '/ideas/review',
          name: 'Sơ loại & đặt hàng',
          icon: 'AuditOutlined',
          component: '@/pages/ideas/review',
          access: 'canManageIdeaBank',
        },
        {
          path: '/ideas/council',
          name: 'Hội đồng chấm điểm',
          icon: 'TrophyOutlined',
          component: '@/pages/ideas/council',
          access: 'canAccessCouncil',
        },
      ],
    },

    // Đề tài nghiên cứu (quy trình)
    {
      path: '/projects',
      name: 'Đề tài',
      icon: 'ProjectOutlined',
      access: 'canViewProjectsSection',
      routes: [
        {
          path: '/projects/call-for-proposals',
          name: 'Thông báo tuyển chọn',
          icon: 'NotificationOutlined',
          component: '@/pages/projects/call-for-proposals',
          access: 'canViewCfp',
        },
        {
          path: '/projects/call-for-proposals/form',
          name: 'Tạo thông báo tuyển chọn',
          component: '@/pages/projects/call-for-proposals/form',
          access: 'canCreateCfp',
          hideInMenu: true,
        },
        {
          path: '/projects/call-for-proposals/form/:id',
          name: 'Sửa thông báo tuyển chọn',
          component: '@/pages/projects/call-for-proposals/form',
          access: 'canUpdateCfp',
          hideInMenu: true,
        },
        {
          path: '/projects/call-for-proposals/news',
          name: 'Tin tuyển chọn đề tài',
          icon: 'ReadOutlined',
          component: '@/pages/projects/call-for-proposals/news',
          access: 'canViewCfp',
        },
        {
          path: '/projects/call-for-proposals/news/:id',
          name: 'Chi tiết tin tuyển chọn',
          component: '@/pages/projects/call-for-proposals/news/detail',
          access: 'canViewCfp',
          hideInMenu: true,
        },
        {
          path: '/projects/call-for-proposals/:id',
          name: 'Chi tiết thông báo tuyển chọn',
          component: '@/pages/projects/call-for-proposals/detail',
          access: 'canViewCfp',
          hideInMenu: true,
        },
        {
          path: '/projects/register',
          name: 'Đăng ký đề xuất đề tài',
          icon: 'FormOutlined',
          component: '@/pages/projects/register',
          access: 'canViewProjectRegister',
        },
        {
          path: '/projects/pkh-review',
          name: 'Kiểm duyệt và tổng hợp đề xuất',
          icon: 'AuditOutlined',
          component: '@/pages/projects/pkh-review',
          access: 'canReviewProjectProposal',
        },
        {
          path: '/projects/blind-reviews',
          name: 'Phân công phản biện',
          icon: 'AuditOutlined',
          component: '@/pages/projects/blind-reviews',
          access: 'canAssignOutlineBlindReview',
        },
        {
          path: '/projects/blind-reviews/tasks',
          name: 'Công việc phản biện',
          icon: 'FormOutlined',
          component: '@/pages/projects/blind-reviews/tasks',
          access: 'canViewOutlineReviewTasks',
        },
        {
          path: '/projects/blind-reviews/tasks/:assignmentId',
          name: 'Phiếu chấm phản biện',
          component: '@/pages/projects/blind-reviews/tasks/detail',
          access: 'canViewOutlineReviewTasks',
          hideInMenu: true,
        },
        {
          path: '/projects/defenses',
          name: 'Tổ chức bảo vệ',
          icon: 'TeamOutlined',
          component: '@/pages/projects/defenses',
          access: 'canManageOutlineDefense',
        },
        {
          path: '/projects/defenses/:id',
          name: 'Chi tiết bảo vệ',
          component: '@/pages/projects/defenses/detail',
          access: 'canManageOutlineDefense',
          hideInMenu: true,
        },
        {
          path: '/projects/budget-approvals',
          name: 'Xác nhận kinh phí',
          icon: 'AccountBookOutlined',
          component: '@/pages/projects/budget-approvals',
          access: 'canViewOutlineBudgetFlow',
        },
        {
          path: '/projects/budget-approvals/:id',
          name: 'Chi tiết xác nhận kinh phí',
          component: '@/pages/projects/budget-approvals/detail',
          access: 'canViewOutlineBudgetFlow',
          hideInMenu: true,
        },
        {
          path: '/projects/register/form',
          name: 'Nộp hồ sơ đề xuất',
          component: '@/pages/projects/register/form',
          access: 'canCreateProjectProposal',
          hideInMenu: true,
        },
        {
          path: '/projects/register/form/:id',
          name: 'Sửa hồ sơ đề xuất',
          component: '@/pages/projects/register/form',
          access: 'canCreateProjectProposal',
          hideInMenu: true,
        },
        {
          path: '/projects/my',
          name: 'Đề tài của tôi',
          icon: 'FolderOpenOutlined',
          component: '@/pages/projects/my',
          access: 'canWriteProjectOutline',
        },
        {
          path: '/projects/outlines/form/:id',
          name: 'Soạn thuyết minh',
          component: '@/pages/projects/outlines/form',
          access: 'canWriteProjectOutline',
          hideInMenu: true,
        },
        {
          path: '/projects/council',
          name: 'Hội đồng xét chọn',
          icon: 'TeamOutlined',
          redirect: '/projects/selection-sessions',
          access: 'canViewProjectCouncil',
        },
        {
          path: '/projects/selection-sessions',
          name: 'Phiên xét chọn đề tài',
          icon: 'TeamOutlined',
          component: '@/pages/projects/selection-sessions',
          access: 'canViewProjectCouncil',
        },
        {
          path: '/projects/selection-sessions/:id',
          name: 'Chi tiết phiên xét chọn',
          component: '@/pages/projects/selection-sessions/detail',
          access: 'canViewProjectCouncil',
          hideInMenu: true,
        },
        {
          path: '/projects/acceptance',
          name: 'Nghiệm thu đề tài',
          icon: 'CheckCircleOutlined',
          component: '@/pages/projects/acceptance',
          access: 'canViewAcceptance',
        },
      ],
    },

    // Tài chính đề tài
    {
      path: '/finance',
      name: 'Tài chính',
      icon: 'DollarCircleOutlined',
      access: 'canViewFinance',
      routes: [
        {
          path: '/finance/requests',
          name: 'Tạm ứng & thanh toán',
          icon: 'WalletOutlined',
          component: '@/pages/finance/requests',
          access: 'canViewFinance',
        },
        {
          path: '/finance/overview',
          name: 'Tổng quan kinh phí',
          icon: 'FundOutlined',
          component: '@/pages/finance/overview',
          access: 'canViewFinance',
        },
      ],
    },

    // Kết quả NCKH — menu con sinh động từ nhóm gốc danh mục loại KQNC
    {
      path: '/research-outputs',
      name: 'Kết quả NCKH',
      icon: 'ExperimentOutlined',
      access: 'canViewResearchOutputs',
      routes: [
        {
          path: '/research-outputs',
          redirect: '/research-outputs/all',
        },
        {
          path: '/research-outputs/new',
          name: 'Thêm kết quả NCKH',
          component: '@/pages/research-outputs/form',
          access: 'canCreateResearchOutput',
          hideInMenu: true,
        },
        {
          path: '/research-outputs/edit/:id',
          name: 'Sửa kết quả NCKH',
          component: '@/pages/research-outputs/form',
          access: 'canUpdateResearchOutput',
          hideInMenu: true,
        },
        {
          path: '/research-outputs/:rootTypeKey',
          component: '@/pages/research-outputs/list',
          access: 'canViewResearchOutputs',
          hideInMenu: true,
        },
      ],
    },

    // Báo cáo & thống kê
    {
      path: '/reports',
      name: 'Báo cáo & thống kê',
      icon: 'BarChartOutlined',
      access: 'canViewReports',
      routes: [
        {
          path: '/reports/by-unit',
          name: 'Theo đơn vị',
          icon: 'ClusterOutlined',
          component: '@/pages/reports/by-unit',
          access: 'canViewReports',
          hideInMenu: true,
        },
        {
          path: '/reports/by-level',
          name: 'Theo cấp đề tài',
          icon: 'SlidersOutlined',
          component: '@/pages/reports/by-level',
          access: 'canViewReports',
          hideInMenu: true,
        },
        {
          path: '/reports/nckh-hours',
          name: 'Thống kê giờ NCKH',
          icon: 'FieldTimeOutlined',
          component: '@/pages/reports/nckh-hours',
          access: 'canViewReports',
        },
        {
          path: '/reports/nckh-data',
          name: 'Thống kê kết quả NCKH',
          icon: 'TableOutlined',
          component: '@/pages/reports/nckh-data',
          access: 'canViewReports',
        },
      ],
    },
    {
      path: '/reports/dashboard',
      redirect: '/home',
      hideInMenu: true,
    },

    // Hệ thống - Quản trị hệ thống
    {
      path: '/admin',
      name: 'Hệ thống',
      icon: 'SettingOutlined',
      access: 'canViewAdmin',
      routes: [
        // --- Nhóm 1: Người dùng & phân quyền ---
        {
          path: '/admin/users',
          name: 'Quản lý người dùng',
          icon: 'UserOutlined',
          component: '@/pages/admin/users',
          access: 'canViewUsers',
        },
        {
          path: '/admin/iam/roles',
          name: 'Vai trò',
          icon: 'CrownOutlined',
          component: '@/pages/admin/iam/roles',
          access: 'canViewRoles',
        },
        {
          path: '/admin/iam/roles/:id/permissions',
          name: 'Phân quyền vai trò',
          component: '@/pages/admin/iam/roles/permissions',
          access: 'canViewRoles',
          hideInMenu: true,
        },
        {
          path: '/admin/iam/permissions',
          name: 'Quyền',
          icon: 'KeyOutlined',
          component: '@/pages/admin/iam/permissions',
          access: 'canViewPermissions',
        },
        {
          path: '/admin/iam/user-roles',
          name: 'Gán vai trò người dùng',
          icon: 'UserSwitchOutlined',
          component: '@/pages/admin/iam/user-roles',
          access: 'canViewUsers',
        },
        // --- Nhóm 2: Danh mục / Nhật ký / Cấu hình (cách nhóm trên bằng gạch phân cách qua CSS) ---
        {
          path: '/admin/catalog',
          name: 'Danh mục hệ thống',
          icon: 'AppstoreOutlined',
          component: '@/pages/admin/catalog',
          access: 'canViewCatalog',
        },
        {
          path: '/admin/audit-log',
          name: 'Nhật ký hệ thống',
          icon: 'FileSearchOutlined',
          component: '@/pages/admin/audit-log',
          access: 'canViewAdmin',
        },
        {
          path: '/admin/config',
          name: 'Cấu hình hệ thống',
          icon: 'ControlOutlined',
          component: '@/pages/admin/config',
          access: 'canViewAdmin',
        },
        // Route ẩn (truy cập qua nút bấm, không hiện trên menu)
        {
          path: '/admin/staffs/new',
          component: '@/pages/admin/staffs/edit',
          access: 'canCreatePersonalProfile',
          hideInMenu: true,
        },
        {
          path: '/admin/staffs/:id/edit',
          component: '@/pages/admin/staffs/edit',
          access: 'canEditPersonalProfile',
          hideInMenu: true,
        },
      ],
    },

    // Redirect mặc định
    {
      path: '/',
      redirect: '/home',
    },
  ],
  npmClient: 'npm',
});
