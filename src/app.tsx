/**
 * Runtime Config - Umi Max
 * Theo specs/auth-login.md + specs/layout-branding.md
 */
import { history, Link } from '@umijs/max';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { Avatar, ConfigProvider, Dropdown, Space } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import * as allIcons from '@ant-design/icons';
import type { UserRole } from '@/services/mock/homeMockService';
import NotificationBell from '@/components/NotificationBell';
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
  name: string;
  email?: string;
  role: UserRole;
  roleLabel?: string;
  avatar?: string;
}

// Interface cho InitialState
export interface InitialState {
  currentUser?: CurrentUser;
  loading?: boolean;
}

// Key lưu trong localStorage
const STORAGE_KEY = 'khcn-current-user';

// Hàm logout
const handleLogout = () => {
  localStorage.removeItem(STORAGE_KEY);
  history.push('/login');
};

/**
 * getInitialState - Load user info khi app khởi động
 * Đọc từ localStorage nếu có (Ghi nhớ tôi)
 */
export async function getInitialState(): Promise<InitialState> {
  // Đọc user từ localStorage (nếu có)
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const user = JSON.parse(stored) as CurrentUser;
      return { currentUser: user };
    } catch (e) {
      console.error('Error parsing stored user:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // Nếu không có user và không phải trang login -> redirect
  const { pathname } = history.location;
  if (pathname !== '/login') {
    // Chưa đăng nhập, redirect về login
    history.push('/login');
  }

  return { currentUser: undefined };
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
    logo: '/logo-khcn.png',
    title: 'Hệ thống Quản lý KH&CN',
    menu: {
      locale: false,
    },
    fixedHeader: true,
    fixSiderbar: true,
    // Render tất cả menu item với icon
    menuItemRender: (item: any, dom: React.ReactNode) => {
      // Debug: xem cấu trúc item (mở DevTools Console để xem)
      console.log('Menu item:', item.name, 'icon:', item.icon, 'parent:', item.pro_layout_parentKeys);
      
      // Kiểm tra nếu là child menu (có parent)
      const hasParent = item.pro_layout_parentKeys && item.pro_layout_parentKeys.length > 0;
      
      if (hasParent) {
        // Lấy icon từ item.icon (có thể là string hoặc React element)
        let iconElement = null;
        if (typeof item.icon === 'string') {
          iconElement = getIcon(item.icon);
        } else if (item.icon) {
          iconElement = item.icon;
        }
        
        return (
          <Link to={item.path || '/'} className="khcn-submenu-item">
            {iconElement}
            <span>{item.name}</span>
          </Link>
        );
      }
      
      return <Link to={item.path || '/'}>{dom}</Link>;
    },
    // Custom menu header với logo + 2 dòng chữ
    menuHeaderRender: (logoDom, _titleDom, props) => {
      if (props?.collapsed) {
        return <div className="khcn-menu-header-collapsed">{logoDom}</div>;
      }
      return (
        <div className="khcn-menu-header">
          <div className="khcn-logo">{logoDom}</div>
          <div className="khcn-title-wrap">
            <div className="khcn-title-main">Hệ thống Quản lý</div>
            <div className="khcn-title-sub">Khoa học &amp; Công nghệ</div>
          </div>
        </div>
      );
    },
    // Header bên phải: Chuông thông báo + User info + Logout
    rightContentRender: () => {
      if (!currentUser) return null;
      
      return (
        <Space size={16} className="khcn-header-right">
          {/* Chuông thông báo với dropdown */}
          <NotificationBell userId={currentUser.role} />
          
          {/* User dropdown */}
          <Dropdown
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
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Đăng xuất',
                  onClick: handleLogout,
                },
              ],
            }}
            placement="bottomRight"
          >
            <Space className="khcn-user-trigger">
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                src={currentUser.avatar}
                style={{ backgroundColor: '#1890ff' }}
              />
              <span className="khcn-user-name-header">{currentUser.name}</span>
            </Space>
          </Dropdown>
        </Space>
      );
    },
    // Logout handler
    logout: handleLogout,
  };
};
