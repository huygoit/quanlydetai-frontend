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
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: 'Hệ thống Quản lý KH&CN',
    locale: false,
  },
  routes: [
    // Trang đăng nhập - không hiển thị layout
    {
      path: '/login',
      component: '@/pages/login',
      layout: false,
    },

    // Trang chủ
    {
      path: '/home',
      name: 'Trang chủ',
      icon: 'HomeOutlined',
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
          access: 'canScoreIdea',
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
          path: '/reports/dashboard',
          name: 'Dashboard tổng quan',
          icon: 'AreaChartOutlined',
          component: '@/pages/reports/dashboard',
          access: 'canViewReports',
        },
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

    // Quản trị hệ thống
    {
      path: '/admin',
      name: 'Quản trị hệ thống',
      icon: 'SettingOutlined',
      access: 'canViewAdmin',
      routes: [
        {
          path: '/admin/users',
          name: 'Người dùng & phân quyền',
          icon: 'UserSwitchOutlined',
          component: '@/pages/admin/users',
          access: 'canViewAdmin',
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
