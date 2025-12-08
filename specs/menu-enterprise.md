# MENU ENTERPRISE – SPEC CHO UMI MAX + ANT DESIGN PRO

## 1. Mục tiêu
Menu bên trái của hệ thống KH&CN phải:
- Hiển thị đúng theo role người dùng.
- Tự động ẩn/hiện dựa vào access trong `src/access.ts`.
- Dựa vào cấu trúc thư mục `src/pages`.
- Không tự sinh menu ngoài spec.
- Giữ đúng icon, tên menu, thứ tự và quyền.

---

## 2. Quy tắc tạo menu trong Umi Max

### 2.1 Menu được sinh từ thư mục `src/pages/**`
Mỗi thư mục có file `index.tsx` sẽ tạo ra một menu item.

Ví dụ:

- `src/pages/ideas/index.tsx` → menu "Ngân hàng ý tưởng"
- `src/pages/projects/index.tsx` → menu "Đề tài nghiên cứu"

### 2.2 Submenu được sinh từ folder con

Ví dụ:

- `src/pages/projects/my/index.tsx` → submenu "Đề tài của tôi"

### 2.3 File nhóm menu phải return null

Các file nhóm (chỉ dùng để tạo menu cha) không nên render nội dung, chỉ:

```tsx
export default () => null;
```

---

## 3. Layout meta (bắt buộc mỗi page)

Mỗi trang phải có:

```tsx
export const layout = {
  name: 'Tên menu',
  icon: 'IconName',
  order: SốThứTự,
};
```

- Submenu (trang con) chỉ cần `name`, không cần `icon` và `order`.

---

## 4. Access meta (bắt buộc)

Mỗi trang phải gắn đúng quyền:

```tsx
export const access = 'tên_quyền_trong_access_ts';
```

Cursor không được tự đặt tên quyền khác.

---

## 5. Danh sách quyền CHUẨN trong `access.ts`

Các quyền dùng cho menu:

- `canViewProfile`
- `canViewIdeaBank`
- `canManageIdeaBank`
- `canViewProjectRegister`
- `canViewProjectManage`
- `canViewProjectCouncil`
- `canViewAcceptance`
- `canViewFinance`
- `canViewReports`
- `canViewAdmin`

Ý nghĩa:

- `canViewProfile`: xem module Hồ sơ khoa học.
- `canViewIdeaBank`: xem Ngân hàng ý tưởng, danh sách, ý tưởng của tôi.
- `canManageIdeaBank`: quyền sơ loại & đặt hàng ý tưởng (Phòng KH, Lãnh đạo, Admin).
- `canViewProjectRegister`: quyền sử dụng chức năng đăng ký đề xuất đề tài (GĐ1).
- `canViewProjectManage`: quyền xem/quản lý "Đề tài của tôi" (GĐ3).
- `canViewProjectCouncil`: quyền vào module Hội đồng xét duyệt (2A/2B).
- `canViewAcceptance`: quyền vào module Nghiệm thu (GĐ4).
- `canViewFinance`: quyền vào module Tài chính đề tài.
- `canViewReports`: quyền vào module Báo cáo & Thống kê.
- `canViewAdmin`: quyền vào module Quản trị hệ thống.

---

## 6. Cấu trúc menu CHUẨN của hệ thống KH&CN

Cây menu chuẩn:

- Trang chủ
- Hồ sơ khoa học
- Ngân hàng ý tưởng
  - Danh sách ý tưởng
  - Ý tưởng của tôi
  - Sơ loại & đặt hàng
- Đề tài nghiên cứu
  - Đăng ký đề xuất (Giai đoạn 1)
  - Đề tài của tôi (Giai đoạn 3)
  - Hội đồng xét duyệt (2A/2B)
  - Nghiệm thu đề tài (Giai đoạn 4)
- Tài chính đề tài
  - Đề nghị tạm ứng/thanh toán
  - Tổng quan kinh phí
- Báo cáo & thống kê
  - Dashboard tổng quan
  - Theo đơn vị
  - Theo cấp đề tài
- Quản trị hệ thống
  - Người dùng & phân quyền
  - Cấu hình hệ thống

---

## 7. Icon menu (Ant Design Icons – CHUẨN)

Icon sử dụng cho menu cấp 1:

- Trang chủ → `HomeOutlined`
- Hồ sơ khoa học → `IdcardOutlined`
- Ngân hàng ý tưởng → `BulbOutlined`
- Đề tài nghiên cứu → `ProjectOutlined`
- Tài chính đề tài → `DollarCircleOutlined`
- Báo cáo & thống kê → `BarChartOutlined`
- Quản trị hệ thống → `SettingOutlined`

Submenu (cấp 2) không bắt buộc phải có icon riêng.

---

## 8. Thứ tự menu

Thứ tự các menu cấp 1 (dùng trong `layout.order`):

1. Trang chủ
2. Hồ sơ khoa học
3. Ngân hàng ý tưởng
4. Đề tài nghiên cứu
5. Tài chính đề tài
6. Báo cáo & thống kê
7. Quản trị hệ thống

Ví dụ:

```tsx
export const layout = {
  name: 'Đề tài nghiên cứu',
  icon: 'ProjectOutlined',
  order: 4,
};
```

---

## 9. Mapping Role → Menu hiển thị

Các role trong hệ thống:

- `NCV`
- `CNDT`
- `TRUONG_DON_VI`
- `PHONG_KH`
- `HOI_DONG`
- `LANH_DAO`
- `ADMIN`

Quy tắc hiển thị menu:

- **NCV**
  - Trang chủ
  - Hồ sơ khoa học
  - Ngân hàng ý tưởng (tất cả submenu)
  - Đăng ký đề xuất (trong Đề tài nghiên cứu)

- **CNDT**
  - Như NCV
  - Thêm "Đề tài của tôi"
  - Thêm "Tài chính đề tài"

- **TRUONG_DON_VI**
  - Như CNDT
  - Có thể thêm quyền phê duyệt đề xuất (tuỳ logic access)

- **PHONG_KH**
  - Toàn bộ Ngân hàng ý tưởng (bao gồm Sơ loại & đặt hàng)
  - Toàn bộ Đề tài nghiên cứu (Đăng ký, Đề tài của tôi, Hội đồng, Nghiệm thu)
  - Tài chính đề tài
  - Báo cáo & thống kê

- **HOI_DONG**
  - Hội đồng xét duyệt
  - Có thể xem thêm Ngân hàng ý tưởng (tham khảo)

- **LANH_DAO**
  - Trang chủ (Home lãnh đạo)
  - Báo cáo & thống kê (Dashboard, theo đơn vị, theo cấp)
  - Xem tất cả module ở chế độ quan sát (read-only, phụ thuộc access chi tiết)

- **ADMIN**
  - Full menu không hạn chế

Việc ẩn/hiện thực tế sẽ do `src/access.ts` quyết định, spec này chỉ mô tả ý nghĩa.

---

## 10. Template chuẩn cho từng loại page

### 10.1 Page nhóm menu (parent)

Ví dụ: `src/pages/ideas/index.tsx` – chỉ để tạo menu "Ngân hàng ý tưởng":

```tsx
export const layout = {
  name: 'Ngân hàng ý tưởng',
  icon: 'BulbOutlined',
  order: 3,
};

export const access = 'canViewIdeaBank';

export default () => null;
```

### 10.2 Trang submenu (con)

Ví dụ: `src/pages/ideas/list/index.tsx` – "Danh sách ý tưởng":

```tsx
export const layout = {
  name: 'Danh sách ý tưởng',
};

export const access = 'canViewIdeaBank';

const IdeaListPage: React.FC = () => {
  return <div>Danh sách ý tưởng – TODO UI</div>;
};

export default IdeaListPage;
```

Ví dụ: `src/pages/ideas/review/index.tsx` – "Sơ loại & đặt hàng" (chỉ Phòng KH, Lãnh đạo, Admin):

```tsx
export const layout = {
  name: 'Sơ loại & đặt hàng',
};

export const access = 'canManageIdeaBank';

const IdeaReviewPage: React.FC = () => {
  return <div>Sơ loại & đặt hàng ý tưởng – TODO UI</div>;
};

export default IdeaReviewPage;
```

---

## 11. Quy tắc cho Cursor khi tạo file mới

Khi Cursor sinh code liên quan menu, bắt buộc phải:

1. Tạo đúng thư mục trong `src/pages` để tương ứng với cấu trúc menu trong spec.
2. Thêm `export const layout` với:
   - `name` đúng theo spec.
   - `icon` + `order` cho menu cấp 1.
3. Thêm `export const access` với tên quyền đúng trong danh sách:
   - `canViewProfile`, `canViewIdeaBank`, ...
4. Các file nhóm (menu cha) phải `export default () => null;`.
5. Không tự ý thêm menu mới không có trong mục 6 (Cấu trúc menu chuẩn).
6. Không đổi tên menu, icon, thứ tự hoặc quyền ngoài spec.
7. Luôn tương thích với `src/access.ts` (Cursor có thể mở access.ts để tham chiếu).

---

## 12. Kết luận

Menu trái của hệ thống KH&CN là menu đa cấp, role-based, và phải tuân theo các nguyên tắc:

- Cấu trúc module → submenu đúng như mục 6.
- Icon, thứ tự, tên menu thống nhất.
- Quyền truy cập dựa vào các access đã định nghĩa.
- Các file trang luôn khai báo `layout` và `access` đúng chuẩn.

Khi sinh code, Cursor phải đọc và tuân theo file `specs/menu-enterprise.md` này 100%.
