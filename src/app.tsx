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
import { isAdminKeKhaiUser, isPersonalWorkspacePath } from '@/utils/adminKeKhai';
import { hasAnyPermission, PERM } from '@/utils/permission';
import {
  ganMenuConKetQuaNckh,
  taiNhomGocMenuKqnc,
  taiSoLuongKqncTheoNhom,
  type ResearchOutputMenuRoot,
} from '@/utils/researchOutputMenu';
import './global.less';

/**
 * Chỉ tài khoản có quyền xem KQNC mới gọi API admin để dựng menu con /research-outputs.
 * NCV thường không có quyền publication.view → tránh gọi gây 403 (mirror access.canViewResearchOutputs).
 */
function coTheXemMenuKqnc(user?: { permissions?: string[] } | null): boolean {
  const perms = user?.permissions ?? [];
  if (perms.includes('*')) return true;
  if (isAdminKeKhaiUser(user as never)) return true;
  return hasAnyPermission(perms, [PERM.publication.view, PERM.profile.view_all]);
}

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

// Việt hóa toàn bộ message validate mặc định của Form (tránh lọt tiếng Trung khi rule không set message riêng)
const VALIDATE_MESSAGES_VI = {
  default: 'Giá trị của trường ${label} không hợp lệ',
  required: 'Vui lòng nhập ${label}',
  enum: '${label} phải là một trong [${enum}]',
  whitespace: '${label} không được để trống',
  date: {
    format: '${label} sai định dạng ngày',
    parse: '${label} không chuyển được sang ngày',
    invalid: '${label} là ngày không hợp lệ',
  },
  types: {
    string: '${label} không phải chuỗi hợp lệ',
    method: '${label} không phải hàm hợp lệ',
    array: '${label} không phải mảng hợp lệ',
    object: '${label} không phải đối tượng hợp lệ',
    number: '${label} không phải số hợp lệ',
    date: '${label} không phải ngày hợp lệ',
    boolean: '${label} không phải boolean hợp lệ',
    integer: '${label} không phải số nguyên hợp lệ',
    float: '${label} không phải số thực hợp lệ',
    regexp: '${label} không phải biểu thức chính quy hợp lệ',
    email: '${label} không phải email hợp lệ',
    url: '${label} không phải URL hợp lệ',
  },
  string: {
    len: '${label} phải đủ ${len} ký tự',
    min: '${label} tối thiểu ${min} ký tự',
    max: '${label} tối đa ${max} ký tự',
    range: '${label} phải từ ${min} đến ${max} ký tự',
  },
  number: {
    len: '${label} phải bằng ${len}',
    min: '${label} tối thiểu là ${min}',
    max: '${label} tối đa là ${max}',
    range: '${label} phải từ ${min} đến ${max}',
  },
  array: {
    len: 'Phải có ${len} phần tử ${label}',
    min: 'Tối thiểu ${min} phần tử ${label}',
    max: 'Tối đa ${max} phần tử ${label}',
    range: 'Số phần tử ${label} phải từ ${min} đến ${max}',
  },
  pattern: {
    mismatch: '${label} không khớp mẫu ${pattern}',
  },
};

/**
 * rootContainer - Wrap app với ConfigProvider
 */
export function rootContainer(container: React.ReactNode) {
  return (
    <ConfigProvider
      locale={customViVN}
      form={{ validateMessages: VALIDATE_MESSAGES_VI }}
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
  /** Nhóm gốc danh mục loại KQNC — dùng sinh menu con */
  researchOutputMenuRoots?: ResearchOutputMenuRoot[];
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
        const hienThi = layVaiTroHienThi(userData.roles, userData.role);
        // role chính: ưu tiên vai trò không phải BASIC (phục vụ logic cũ)
        const role =
          hienThi.codes[0] ||
          (userData.role && !laVaiTroAnTrenUi(userData.role) ? userData.role : undefined) ||
          userData.roles?.find((r: any) => !laVaiTroAnTrenUi(r?.code))?.code;
        const currentUser: CurrentUser = {
          id: userData.id,
          name: userData.fullName ?? userData.full_name ?? userData.email ?? '',
          email: userData.email,
          role: role,
          roleLabel: hienThi.label,
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
      const researchOutputMenuRoots = coTheXemMenuKqnc(currentUser)
        ? await taiNhomGocMenuKqnc()
        : [];
      return {
        currentUser,
        permissions: currentUser.permissions ?? [],
        researchOutputMenuRoots,
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
      const researchOutputMenuRoots = coTheXemMenuKqnc(user)
        ? await taiNhomGocMenuKqnc()
        : [];
      return {
        currentUser: user,
        permissions: user.permissions ?? [],
        researchOutputMenuRoots,
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

// Helper để lấy label cho role (map legacy code → tên hiển thị)
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
    BASIC: 'Cơ bản',
  };
  return roleLabels[role || ''] || (role as string) || '';
}

/** BASIC là vai trò nền — không hiển thị trên header user */
const laVaiTroAnTrenUi = (code?: string | null) =>
  String(code || '')
    .trim()
    .toUpperCase() === 'BASIC';

/**
 * Danh sách vai trò hiển thị: ưu tiên name từ API, bỏ BASIC.
 * Nếu chỉ còn BASIC → không hiện gì (hoặc để trống).
 */
function layVaiTroHienThi(
  roles?: Array<{ id?: number; code?: string; name?: string }> | null,
  fallbackRole?: string,
): { codes: string[]; label: string } {
  const list = Array.isArray(roles) ? roles : [];
  const visible = list.filter((r) => !laVaiTroAnTrenUi(r?.code));
  if (visible.length > 0) {
    const labels = visible.map(
      (r) => (r.name || '').trim() || getRoleLabel(r.code) || String(r.code || ''),
    );
    return {
      codes: visible.map((r) => String(r.code || '')).filter(Boolean),
      label: labels.filter(Boolean).join(', '),
    };
  }
  // Không có roles từ API — fallback role đơn (vẫn ẩn BASIC)
  if (fallbackRole && !laVaiTroAnTrenUi(fallbackRole)) {
    return { codes: [fallbackRole], label: getRoleLabel(fallbackRole) };
  }
  return { codes: [], label: '' };
}

/**
 * Layout config - theo specs/layout-branding.md
 */
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  const currentUser = initialState?.currentUser;
  const canUsePersonalWorkspace = !!currentUser && !isAdminKeKhaiUser(currentUser);

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
      /** Tải lại nhóm gốc khi render menu — đảm bảo admin vẫn có menu con */
      request: async (_params: Record<string, unknown>, defaultMenuData: any[]) => {
        // Chỉ user có quyền xem KQNC mới gọi API admin (tránh 403 với NCV thường).
        const coQuyen = coTheXemMenuKqnc(currentUser);
        let roots = initialState?.researchOutputMenuRoots ?? [];
        if (!roots.length && coQuyen) {
          roots = await taiNhomGocMenuKqnc();
        }
        const soLuong =
          roots.length > 0 && coQuyen ? await taiSoLuongKqncTheoNhom(roots) : undefined;
        return ganMenuConKetQuaNckh(defaultMenuData, roots, soLuong);
      },
    },
    onPageChange: () => {
      const { pathname } = history.location;
      if (currentUser && isAdminKeKhaiUser(currentUser) && isPersonalWorkspacePath(pathname)) {
        message.warning(
          'Tài khoản quản trị không dùng chức năng cá nhân. Vui lòng dùng tài khoản NCV hoặc trang quản lý hệ thống.'
        );
        history.replace('/home');
      }
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
    // Menu item render — menu cha có con thì không bọc Link (để hiện dropdown)
    menuItemRender: (item: any, dom: React.ReactNode) => {
      const coMenuCon =
        (Array.isArray(item.children) && item.children.length > 0) ||
        (Array.isArray(item.routes) && item.routes.length > 0);
      if (item.isUrl || coMenuCon) {
        return dom;
      }
      return <Link to={item.path || '/'}>{dom}</Link>;
    },
    // Submenu item render — mục lá trong dropdown cần Link
    subMenuItemRender: (item: any, dom: React.ReactNode) => {
      if (!item.path || item.isUrl) return dom;
      return <Link to={item.path}>{dom}</Link>;
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
                    {currentUser.roleLabel ? (
                      <div className="khcn-user-role" title={currentUser.roleLabel}>
                        {currentUser.roleLabel}
                      </div>
                    ) : null}
                  </div>
                ),
                disabled: true,
              },
              { type: 'divider' },
              ...(canUsePersonalWorkspace
                ? [
                    {
                      key: 'personalProfile',
                      label: 'Hồ sơ cán bộ của tôi',
                      onClick: () => history.push('/my-personal-profile'),
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
                    { type: 'divider' as const },
                  ]
                : []),
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
