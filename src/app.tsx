/**
 * Runtime Config - Umi Max
 * Theo specs/auth-login.md + specs/layout-branding.md
 */
import { history, Link } from '@umijs/max';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { Avatar, ConfigProvider, Dropdown, Space, message } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import * as allIcons from '@ant-design/icons';
import type { UserRole } from '@/services/mock/homeMockService';
import NotificationBell from '@/components/NotificationBell';
import { getCurrentUser, logout as apiLogout, normalizePermissions } from '@/services/api/auth';
import { getToken, removeToken } from '@/services/request';
import './global.less';

// Custom Vietnamese locale với pagination text tùy chỉnh
const customViVN = {
  ...viVN,
  Table: {
    ...viVN.Table,
    filterTitle: 'Bộ lọc',
    filterConfirm: 'Đồng ý',
    filterReset: 'Làm mới',
    filterEmptyText: 'Không có bộ lọc',
    selectAll: 'Chọn tất cả trang hiện tại',
    selectInvert: 'Đảo ngược trang hiện tại',
    selectionAll: 'Chọn tất cả dữ liệu',
    sortTitle: 'Sắp xếp',
    expand: 'Mở rộng dòng',
    collapse: 'Thu gọn dòng',
    triggerDesc: 'Nhấn để sắp xếp giảm dần',
    triggerAsc: 'Nhấn để sắp xếp tăng dần',
    cancelSort: 'Nhấn để hủy sắp xếp',
  },
  Pagination: {
    ...viVN.Pagination,
    items_per_page: '/ trang',
    jump_to: 'Đi tới',
    jump_to_confirm: 'xác nhận',
    page: 'Trang',
    prev_page: 'Trang trước',
    next_page: 'Trang sau',
    prev_5: '5 trang trước',
    next_5: '5 trang sau',
    prev_3: '3 trang trước',
    next_3: '3 trang sau',
    page_size: 'Số mục mỗi trang',
  },
};

/**
 * rootContainer - Wrap app với ConfigProvider
 */
export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider
      locale={customViVN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      {container}
    </ConfigProvider>
  );
}

// Interface cho CurrentUser
export interface CurrentUser {
  id?: number;
  name: string;
  email?: string;
  role?: UserRole;
  roleLabel?: string;
  avatar?: string;
  permissions?: string[];
  roles?: Array<{ id: number; code: string; name: string }>;
}

// Interface cho InitialState
export interface InitialState {
  currentUser?: CurrentUser;
  permissions?: string[];
  fetchUserInfo?: () => Promise<CurrentUser | undefined>;
  loading?: boolean;
}

// Key lưu trong localStorage (để lưu cache user info)
const USER_STORAGE_KEY = 'khcn-current-user';

// Hàm logout
const handleLogout = async () => {
  try {
    await apiLogout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    removeToken();
    localStorage.removeItem(USER_STORAGE_KEY);
    history.push('/login');
  }
};

/**
 * getInitialState - Load user info khi app khởi động
 * Kiểm tra token và fetch user từ API
 */
export async function getInitialState(): Promise<InitialState> {
  const { pathname } = history.location;
  const token = getToken();

  // Nếu không có token và không phải trang login/register -> redirect
  if (!token) {
    if (pathname !== '/login' && pathname !== '/register') {
      history.push('/login');
    }
    return { currentUser: undefined };
  }

  const fetchUserInfo = async (): Promise<CurrentUser | undefined> => {
    try {
      const response = await getCurrentUser();
      if (response?.data) {
        const userData = response.data as any;
        const perms = normalizePermissions(userData);
        const role = userData.role ?? userData.roles?.[0]?.code;
        const currentUser: CurrentUser = {
          id: userData.id,
          name: userData.fullName ?? userData.full_name ?? userData.email ?? '',
          email: userData.email,
          role: role,
          roleLabel: getRoleLabel(role),
          avatar: userData.avatar,
          permissions: perms,
          roles: userData.roles,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
        return currentUser;
      }
    } catch (e) {
      console.error('fetchUserInfo error:', e);
    }
    return undefined;
  };

  try {
    const currentUser = await fetchUserInfo();
    if (currentUser) {
      return {
        currentUser,
        permissions: currentUser.permissions ?? [],
        fetchUserInfo,
      };
    }
  } catch (error) {
    console.error('Error fetching current user:', error);
    removeToken();
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  const cached = localStorage.getItem(USER_STORAGE_KEY);
  if (cached) {
    try {
      const user = JSON.parse(cached) as CurrentUser;
      return {
        currentUser: user,
        permissions: user.permissions ?? [],
        fetchUserInfo,
      };
    } catch (e) {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }

  if (pathname !== '/login') {
    history.push('/login');
  }
  return { currentUser: undefined };
}

// Helper để lấy label cho role
function getRoleLabel(role: UserRole | string | undefined): string {
  const roleLabels: Record<string, string> = {
    NCV: 'Nghiên cứu viên',
    CNDT: 'Chủ nhiệm đề tài',
    TRUONG_DON_VI: 'Trưởng đơn vị',
    PHONG_KH: 'Phòng KH',
    QUANLY_KH_CNTT_HTQT: 'Phòng KH CNTT & HTQT',
    HOI_DONG: 'Thành viên hội đồng',
    LANH_DAO: 'Lãnh đạo',
    ADMIN: 'Quản trị viên',
    SUPER_ADMIN: 'Super Admin',
  };
  return roleLabels[role || ''] || (role as string) || '';
}

/**
 * Layout config - theo specs/layout-branding.md
 */
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  const currentUser = initialState?.currentUser;

  // Helper function để lấy icon component từ tên
  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (allIcons as any)[iconName];
    if (IconComponent) {
      return <IconComponent style={{ marginRight: 8 }} />;
    }
    return null;
  };

  return {
    // ========== TOP MENU LAYOUT ==========
    layout: 'top',
    logo: '/logo-khcn.png',
    title: 'KH&CN',
    navTheme: 'light',
    contentWidth: 'Fluid',
    fixedHeader: true,
    splitMenus: false,
    menu: {
      locale: false,
      defaultOpenAll: false,
      autoClose: false,
    },
    token: {
      header: {
        colorBgHeader: 'transparent',
        colorHeaderTitle: '#ffffff',
        colorTextMenu: '#ffffff',
        colorTextMenuSecondary: '#ffffff',
        colorTextMenuSelected: '#ffffff',
        colorBgMenuItemSelected: 'rgba(255,255,255,0.25)',
        colorTextMenuActive: '#ffffff',
        colorBgMenuItemHover: 'rgba(255,255,255,0.15)',
        colorTextRightActionsItem: '#ffffff',
        heightLayoutHeader: 60,
      },
      sider: {
        colorMenuBackground: 'transparent',
        colorTextMenu: '#ffffff',
        colorTextMenuSelected: '#ffffff',
        colorBgMenuItemSelected: 'rgba(255,255,255,0.25)',
      },
      pageContainer: {
        paddingBlockPageContainerContent: 24,
        paddingInlinePageContainerContent: 32,
      },
    },
    // Custom logo + title trên header - 2 dòng
    headerTitleRender: (logo, title, props) => {
      return (
        <Link to="/home" className="khcn-top-header-logo">
          <div className="khcn-logo-wrapper">
            {logo}
          </div>
          <div className="khcn-title-wrapper">
            <span className="khcn-title-line1">KHCN</span>
            <span className="khcn-title-line2">ĐMST</span>
          </div>
        </Link>
      );
    },
    // Menu item render
    menuItemRender: (item: any, dom: React.ReactNode) => {
      return <Link to={item.path || '/'}>{dom}</Link>;
    },
    // Submenu item render với icon
    subMenuItemRender: (item: any, dom: React.ReactNode) => {
      return dom;
    },
    // Header bên phải: Chuông thông báo + User info + Logout
    actionsRender: () => {
      if (!currentUser) return [];
      
      return [
        <NotificationBell key="notifications" userId={currentUser.role} />,
        <Dropdown
          key="user"
          menu={{
            items: [
              {
                key: 'userInfo',
                label: (
                  <div className="khcn-user-dropdown-info">
                    <div className="khcn-user-name">{currentUser.name}</div>
                    <div className="khcn-user-role">{currentUser.roleLabel || currentUser.role}</div>
                  </div>
                ),
                disabled: true,
              },
              { type: 'divider' },
              {
                key: 'personalProfile',
                label: 'Hồ sơ cán bộ của tôi',
                onClick: () => history.push('/admin/personal-profiles'),
              },
              {
                key: 'scientificProfile',
                label: 'Hồ sơ khoa học của tôi',
                onClick: () => history.push('/profile/me'),
              },
              {
                key: 'myIdeas',
                label: 'Ý tưởng của tôi',
                onClick: () => history.push('/ideas/my'),
              },
              {
                key: 'myProjects',
                label: 'Đề tài của tôi',
                onClick: () => history.push('/projects/my'),
              },
              { type: 'divider' },
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Đăng xuất',
                onClick: handleLogout,
                danger: true,
              },
            ],
          }}
          placement="bottomRight"
        >
          <Space className="khcn-user-trigger-top">
            <Avatar 
              size="small" 
              icon={<UserOutlined />} 
              src={currentUser.avatar}
              style={{ backgroundColor: '#1890ff' }}
            />
            <span className="khcn-user-name-top">{currentUser.name}</span>
          </Space>
        </Dropdown>,
      ];
    },
    // Logout handler
    logout: handleLogout,
  };
};
