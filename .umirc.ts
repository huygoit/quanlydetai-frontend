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

    // Hồ sơ khoa học - NCV thấy "Hồ sơ của tôi", PHONG_KH/ADMIN thấy "Danh sách hồ sơ"
    {
      path: '/profile',
      name: 'Hồ sơ khoa học',
      icon: 'IdcardOutlined',
      access: 'canViewProfile',
      routes: [
        {
          path: '/profile/me',
          name: 'Hồ sơ của tôi',
          icon: 'UserOutlined',
          component: '@/pages/profile/me',
          access: 'canViewProfileSelf',
        },
        {
          path: '/profile/list',
          name: 'Danh sách hồ sơ',
          icon: 'TeamOutlined',
          component: '@/pages/profile/list',
          access: 'canViewProfileAll',
        },
      ],
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
      name: 'Ngân hàng ý tưởng',
      icon: 'BulbOutlined',
      access: 'canViewIdeaBank',
      routes: [
        {
          path: '/ideas/new',
          name: 'Tạo ý tưởng mới',
          component: '@/pages/ideas/new',
          access: 'canViewIdeaBank',
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
          access: 'canViewIdeaBank',
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
      name: 'Đề tài nghiên cứu',
      icon: 'ProjectOutlined',
      access: 'canViewProjectManage',
      routes: [
        {
          path: '/projects/register',
          name: 'Đăng ký đề xuất',
          icon: 'FormOutlined',
          component: '@/pages/projects/register',
          access: 'canViewProjectRegister',
        },
        {
          path: '/projects/my',
          name: 'Đề tài của tôi',
          icon: 'FolderOpenOutlined',
          component: '@/pages/projects/my',
          access: 'canViewProjectManage',
        },
        {
          path: '/projects/council',
          name: 'Hội đồng xét duyệt',
          icon: 'TeamOutlined',
          component: '@/pages/projects/council',
          access: 'canViewProjectCouncil',
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
        },
        {
          path: '/reports/by-level',
          name: 'Theo cấp đề tài',
          icon: 'SlidersOutlined',
          component: '@/pages/reports/by-level',
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
        {
          path: '/admin/departments',
          name: 'Quản lý đơn vị',
          icon: 'ClusterOutlined',
          component: '@/pages/admin/departments',
          access: 'canViewDepartments',
        },
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
        {
          path: '/admin/personal-profiles',
          name: 'Hồ sơ cá nhân',
          icon: 'IdcardOutlined',
          component: '@/pages/admin/personal-profiles',
          access: 'canViewPersonalProfiles',
        },
        {
          path: '/admin/personal-profiles/new',
          component: '@/pages/admin/personal-profiles/edit',
          access: 'canViewPersonalProfiles',
          hideInMenu: true,
        },
        {
          path: '/admin/personal-profiles/:id/edit',
          component: '@/pages/admin/personal-profiles/edit',
          access: 'canViewPersonalProfiles',
          hideInMenu: true,
        },
        {
          path: '/admin/config',
          name: 'Cấu hình hệ thống',
          icon: 'ControlOutlined',
          component: '@/pages/admin/config',
          access: 'canViewAdmin',
        },
        {
          path: '/admin/audit-log',
          name: 'Nhật ký hệ thống',
          icon: 'FileSearchOutlined',
          component: '@/pages/admin/audit-log',
          access: 'canViewAdmin',
        },
        {
          path: '/admin/catalog',
          name: 'Danh mục hệ thống',
          icon: 'AppstoreOutlined',
          component: '@/pages/admin/catalog',
          access: 'canViewAdmin',
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
