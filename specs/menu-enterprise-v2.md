# SPEC – MENU ENTERPRISE V2 CHO HỆ THỐNG QUẢN LÝ KH&CN

## 1. Mục tiêu

Chuẩn hoá và nâng cấp menu bên trái (sidebar) của hệ thống Quản lý Đề tài NCKH theo hướng **enterprise**:

- Cấu trúc menu rõ ràng, theo đúng quy trình nghiệp vụ.
- Dùng **routes trong `.umirc.ts` / `config/config.ts`** làm nguồn sinh menu (không dùng file-system routing).
- Có **icon** rõ ràng cho tất cả menu cấp 1 và các mục quan trọng cấp 2.
- Tên menu ngắn gọn, dễ hiểu, không lạm dụng mã giai đoạn (GD1, GD3…).
- Tích hợp với cơ chế **access** (canView…) hiện tại của hệ thống.

Menu sẽ gồm các nhóm chính:

1. Trang chủ  
2. Hồ sơ khoa học  
3. Ngân hàng ý tưởng  
4. Đề tài nghiên cứu  
5. Tài chính  
6. Báo cáo & thống kê  
7. Quản trị hệ thống  

---

## 2. Vị trí cấu hình

- File cấu hình routes: **`.umirc.ts`** (hoặc `config/config.ts` nếu dự án dùng file đó).
- Menu của Umi Max / Ant Design Pro sẽ được sinh từ `routes` này.

Cursor **phải** cập nhật trường `routes` trong file config tương ứng, không tạo `config/routes.ts` riêng.

---

## 3. Cây menu enterprise V2 (mô tả nghiệp vụ)

### 3.1. Trang chủ

- `Trang chủ`

### 3.2. Hồ sơ khoa học

- `Hồ sơ khoa học`

### 3.3. Ngân hàng ý tưởng

- `Ngân hàng ý tưởng`
  - `Danh sách ý tưởng`
  - `Ý tưởng của tôi`
  - `Sơ loại & đặt hàng`

### 3.4. Đề tài nghiên cứu

- `Đề tài nghiên cứu`
  - `Đăng ký đề xuất`
  - `Đề tài của tôi`
  - `Hội đồng xét duyệt`
  - `Nghiệm thu đề tài`

### 3.5. Tài chính

- `Tài chính`
  - `Đề nghị tạm ứng / thanh toán`
  - `Tổng quan kinh phí`

### 3.6. Báo cáo & thống kê

- `Báo cáo & thống kê`
  - `Dashboard tổng quan`
  - `Theo đơn vị`
  - `Theo cấp đề tài`

### 3.7. Quản trị hệ thống

- `Quản trị hệ thống`
  - `Người dùng & phân quyền`
  - `Cấu hình hệ thống`
  - (Tuỳ chọn nâng cấp) `Nhật ký hệ thống`
  - (Tuỳ chọn nâng cấp) `Danh mục hệ thống`

---

## 4. Access (quyền) gắn với menu

Các key access (tên hàm trong `src/access.ts`) sử dụng cho menu:

- `canViewHome` – xem Trang chủ (có thể optional, tuỳ implement).
- `canViewProfile` – module Hồ sơ khoa học.
- `canViewIdeaBank` – xem Ngân hàng ý tưởng (list + my).
- `canManageIdeaBank` – sơ loại & đặt hàng ý tưởng.
- `canViewProjectRegister` – Đăng ký đề xuất.
- `canViewProjectManage` – Đề tài của tôi.
- `canViewProjectCouncil` – Hội đồng xét duyệt.
- `canViewAcceptance` – Nghiệm thu.
- `canViewFinance` – tất cả module Tài chính.
- `canViewReports` – tất cả module Báo cáo & thống kê.
- `canViewAdmin` – tất cả module Quản trị hệ thống.

Cursor **không được** tự ý đổi tên các access này, mà phải dùng đúng như trên.

---

## 5. Icon đề xuất (Ant Design Icons)

Icon dùng cho menu cấp 1:

- Trang chủ → `HomeOutlined`
- Hồ sơ khoa học → `IdcardOutlined`
- Ngân hàng ý tưởng → `BulbOutlined`
- Đề tài nghiên cứu → `ProjectOutlined`
- Tài chính → `DollarCircleOutlined`
- Báo cáo & thống kê → `BarChartOutlined`
- Quản trị hệ thống → `SettingOutlined`

Một số icon gợi ý cho submenu:

- Danh sách ý tưởng → `UnorderedListOutlined`
- Ý tưởng của tôi → `UserOutlined`
- Sơ loại & đặt hàng → `AuditOutlined`
- Đăng ký đề xuất → `FormOutlined`
- Đề tài của tôi → `FolderOpenOutlined`
- Hội đồng xét duyệt → `TeamOutlined`
- Nghiệm thu đề tài → `CheckCircleOutlined`
- Đề nghị tạm ứng / thanh toán → `WalletOutlined`
- Tổng quan kinh phí → `FundOutlined`
- Dashboard tổng quan → `AreaChartOutlined`
- Theo đơn vị → `ClusterOutlined`
- Theo cấp đề tài → `SlidersOutlined`
- Người dùng & phân quyền → `UserSwitchOutlined`
- Cấu hình hệ thống → `ControlOutlined`
- Nhật ký hệ thống → `FileSearchOutlined`
- Danh mục hệ thống → `AppstoreOutlined`

---

## 6. Cấu hình `routes` chuẩn trong `.umirc.ts`

Cursor phải sinh/ghi đè `routes` theo cấu trúc sau (có thể điều chỉnh import/format cho phù hợp, nhưng **không được đổi meaning**):

```ts
routes: [
  // Trang chủ
  {
    path: '/home',
    name: 'Trang chủ',
    icon: 'HomeOutlined',
    component: '@/pages/home',
    access: 'canViewHome', // nếu chưa dùng access cho home có thể tạm bỏ
  },

  // Hồ sơ khoa học
  {
    path: '/profile',
    name: 'Hồ sơ khoa học',
    icon: 'IdcardOutlined',
    component: '@/pages/profile',
    access: 'canViewProfile',
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
    ],
  },

  // Đề tài nghiên cứu
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

  // Tài chính
  {
    path: '/finance',
    name: 'Tài chính',
    icon: 'DollarCircleOutlined',
    access: 'canViewFinance',
    routes: [
      {
        path: '/finance/requests',
        name: 'Đề nghị tạm ứng / thanh toán',
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
    name: 'Bá cáo & thống kê',
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
      // Tuỳ chọn nâng cấp:
      {
        path: '/admin/audit-log',
        name: 'Nhật ký hệ thống',
        icon: 'FileSearchOutlined',
        component: '@/pages/admin/audit-log',
        access: 'canViewAdmin',
      },
      {
        path: '/admin/catalogs',
        name: 'Danh mục hệ thống',
        icon: 'AppstoreOutlined',
        component: '@/pages/admin/catalogs',
        access: 'canViewAdmin',
      },
    ],
  },

  // Redirect mặc định
  {
    path: '/',
    redirect: '/home',
  },
];
```

---

## 7. Yêu cầu Cursor khi thực thi spec

Khi đọc file spec menu này, Cursor phải:

1. **Cập nhật file `.umirc.ts` (hoặc `config/config.ts`)**:
   - Thay thế/điều chỉnh trường `routes` theo đúng cấu trúc ở mục 6.
   - Không tạo thêm file routes config khác.
2. **Tạo các file component tương ứng** trong `src/pages` nếu chưa tồn tại:
   - `src/pages/home/index.tsx`
   - `src/pages/profile/index.tsx`
   - `src/pages/ideas/list/index.tsx`
   - `src/pages/ideas/my/index.tsx`
   - `src/pages/ideas/review/index.tsx`
   - `src/pages/projects/register/index.tsx`
   - `src/pages/projects/my/index.tsx`
   - `src/pages/projects/council/index.tsx`
   - `src/pages/projects/acceptance/index.tsx`
   - `src/pages/finance/requests/index.tsx`
   - `src/pages/finance/overview/index.tsx`
   - `src/pages/reports/dashboard/index.tsx`
   - `src/pages/reports/by-unit/index.tsx`
   - `src/pages/reports/by-level/index.tsx`
   - `src/pages/admin/users/index.tsx`
   - `src/pages/admin/config/index.tsx`
   - `src/pages/admin/audit-log/index.tsx`
   - `src/pages/admin/catalogs/index.tsx`
3. Mỗi file component ban đầu chỉ cần:
   - Export một React component đơn giản (placeholder), ví dụ `<div>Tên trang …</div>`.
   - Đặt đúng tên file và path để match với `routes`.
4. Không đổi tên menu, icon hoặc access ngoài nội dung đã cho.
5. Đảm bảo menu hiển thị đúng trong sidebar sau khi chạy dự án.