# Nhiệm vụ
Hãy xây dựng **frontend Ant Design Pro** cho chức năng **quản lý user trong module IAM** của dự án hiện tại.

## Bối cảnh dự án
- Frontend đang dùng **Ant Design Pro**
- Route đang cấu hình trong **`.umirc.ts`**
- Service API đang tổ chức trong **`src/services/api`**
- Wrapper request đang dùng **`src/services/request.ts`**
- Các page admin đang theo style:
  - `PageContainer`
  - `ProTable`
  - `ModalForm` hoặc `DrawerForm`
- Access hiện tại đang có convention kiểu `canViewAdmin`, nhưng với module này hãy thiết kế theo hướng dễ mở rộng sang permission-based access.

## Mục tiêu chức năng
Xây dựng màn hình **Quản lý user trong IAM** để:
- xem danh sách user
- tìm kiếm / lọc user
- tạo user mới
- cập nhật user
- gán department cho user
- gán nhiều role cho user
- đổi trạng thái user
- reset mật khẩu user
- xem nhanh role của user

## Lưu ý rất quan trọng
- **Backend API quản lý user IAM đã làm riêng**
- **Table `users` đã tồn tại từ trước**
- Frontend chỉ làm UI bám đúng API mới, không giả định tạo bảng mới
- Role của user lấy từ API IAM mới, không phụ thuộc vào field legacy `users.role`
- Không tự ý thiết kế khác logic backend

---

# Phạm vi màn hình cần làm

## 1. Trang danh sách user
Tạo page quản lý user IAM trong khu vực admin.

### Chức năng chính
- hiển thị danh sách user bằng `ProTable`
- search theo keyword
- filter theo department
- filter theo role
- filter theo status
- phân trang
- sort nếu API hỗ trợ
- action: xem / sửa / gán role / đổi trạng thái / reset mật khẩu

### Các cột nên có
- username
- full_name
- email
- phone
- department
- roles
- status
- last_login_at
- created_at
- actions

### `roles` hiển thị
- hiển thị dạng tag hoặc danh sách ngắn gọn
- nếu nhiều role thì hiển thị đẹp, không quá rối

### `status` hiển thị
- dùng `Badge` hoặc `Tag`
- phân biệt rõ `ACTIVE`, `INACTIVE`, `LOCKED` nếu backend có hỗ trợ
- nếu backend hiện chỉ có `ACTIVE/INACTIVE` thì code theo đó nhưng viết dễ mở rộng

---

## 2. Modal hoặc Drawer tạo user
Tạo form tạo mới user.

### Field cần có
#### Thông tin tài khoản
- `username` *
- `full_name` *
- `email` *
- `phone`
- `password` *
- `confirm_password` *

#### Thông tin tổ chức
- `department_id` *

#### Phân quyền
- `role_ids` (multiple select)

#### Trạng thái
- `status` *

#### Ghi chú
- `note`

### Validate UI
- username bắt buộc
- full_name bắt buộc
- email đúng format
- password bắt buộc khi tạo mới
- confirm_password phải khớp password
- department bắt buộc
- status bắt buộc

---

## 3. Modal hoặc Drawer cập nhật user
Tạo form sửa user.

### Field cần có
- `username`
- `full_name`
- `email`
- `phone`
- `department_id`
- `role_ids`
- `status`
- `note`

### Lưu ý
- **Không sửa password trong form edit chung**
- password phải tách thành action riêng `Reset password`
- form edit phải load dữ liệu detail từ API nếu cần

---

## 4. Modal gán role riêng
Ngoài việc chọn role trong form edit, hãy tạo thêm action riêng `Gán vai trò`.

### Mục tiêu
Cho admin mở nhanh popup gán role cho 1 user mà không cần mở form edit đầy đủ.

### Nội dung modal
- hiển thị thông tin user cơ bản:
  - username
  - full_name
  - department
- hiển thị multi select role
- submit cập nhật role cho user

### Lưu ý
- bám đúng API IAM mới
- nếu backend có API riêng cho assign role thì dùng API đó
- nếu backend dùng API update user có `role_ids` thì tái sử dụng đúng API hiện có

---

## 5. Action đổi trạng thái user
Tạo action nhanh trên bảng để:
- đổi `ACTIVE` -> `INACTIVE`
- hoặc ngược lại
- nếu backend có `LOCKED` thì hỗ trợ theo API

### Yêu cầu
- dùng `Popconfirm` trước khi đổi trạng thái
- sau khi thành công thì refresh table
- hiển thị message success/error rõ ràng

---

## 6. Action reset mật khẩu
Tạo action `Reset password` riêng.

### UI đề xuất
- mở `ModalForm`
- field:
  - `new_password`
  - `confirm_password`

### Validate
- bắt buộc nhập
- confirm phải khớp

### Sau khi thành công
- đóng modal
- show success message

---

# API integration
Hãy bám đúng API backend IAM mới cho user.

## API dự kiến cần dùng
> Lưu ý: hãy kiểm tra prompt/backend hiện có và map đúng endpoint thực tế. Nếu route thực tế khác, hãy sửa theo backend thay vì tự bịa.

Các API mà frontend cần tích hợp sẽ tương ứng với các chức năng:
- lấy danh sách user
- lấy chi tiết user
- tạo user
- cập nhật user
- đổi trạng thái user
- reset mật khẩu user
- lấy danh sách departments để đổ dropdown
- lấy danh sách roles để đổ dropdown
- gán role cho user

## Yêu cầu service
Tạo hoặc cập nhật service trong `src/services/api` theo convention hiện tại của dự án.

Ví dụ nhóm service có thể là:
- `src/services/api/iam-user.ts`
- hoặc theo structure hiện có của dự án

### Service nên có các hàm
- `getUsers(params)`
- `getUserDetail(id)`
- `createUser(data)`
- `updateUser(id, data)`
- `changeUserStatus(id, data)`
- `resetUserPassword(id, data)`
- `getDepartmentOptions()`
- `getRoleOptions()`
- `assignRolesToUser(id, data)` hoặc dùng `updateUser`

Hãy bám naming convention đang dùng trong dự án.

---

# Route frontend
Thêm route trong `.umirc.ts` cho trang quản lý user IAM.

## Yêu cầu
- đặt trong khu vực admin
- route name rõ ràng
- component path đúng với structure hiện tại
- chỉ hiện ở menu admin

### Ví dụ tên menu
- `Quản lý người dùng`
- hoặc `Người dùng`

### Lưu ý access
Nếu dự án hiện đang dùng access như `canViewAdmin`, hãy bám convention hiện có.
Nhưng code nên viết dễ nâng cấp sang permission như:
- `canViewUsers`
- `canManageUsers`

---

# Cấu trúc file frontend đề xuất
Hãy bám style dự án hiện tại. Có thể theo dạng:

- `src/pages/admin/users/index.tsx`
- `src/pages/admin/users/components/UserForm.tsx`
- `src/pages/admin/users/components/AssignRolesModal.tsx`
- `src/pages/admin/users/components/ResetPasswordModal.tsx`
- `src/services/api/iam-user.ts`
- cập nhật `.umirc.ts`

Nếu dự án đang có convention khác thì follow convention hiện tại.

---

# Yêu cầu UI/UX

## 1. Trang danh sách
- dùng `PageContainer`
- dùng `ProTable`
- toolbar có nút `Thêm người dùng`
- filter/search rõ ràng
- action button gọn gàng
- responsive cơ bản

## 2. Form
- dùng `ModalForm` hoặc `DrawerForm`
- label tiếng Việt rõ ràng
- select department/role phải load async
- hỗ trợ initialValues khi edit

## 3. Message
- thông báo success/error rõ ràng bằng `message.success`, `message.error`

## 4. Re-fetch
- sau create/update/change status/reset password/assign role phải refresh lại table

---

# Mapping field UI đề xuất

## User list item
```ts
{
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  last_login_at?: string;
  created_at: string;
  department?: {
    id: number;
    name: string;
  };
  roles?: Array<{
    id: number;
    code: string;
    name: string;
  }>;
}
```

## Form create/update
```ts
{
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  password?: string;
  confirm_password?: string;
  department_id: number;
  role_ids: number[];
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  note?: string;
}
```

---

# Yêu cầu coding style
- Bám sát style hiện tại của frontend project
- Không tự tạo state management phức tạp nếu project chưa dùng
- Ưu tiên React hooks đơn giản
- Không over-engineering
- Tách component vừa phải, dễ maintain
- Dùng TypeScript type/interface rõ ràng
- Dùng các component của Ant Design Pro hợp lý
- Không hardcode dữ liệu mock nếu đã có API
- Không phá vỡ cấu trúc cũ của dự án

---

# Xử lý access
Hãy thêm guard hiển thị UI theo access hiện tại của dự án.

## Ít nhất cần hỗ trợ logic:
- có quyền vào trang quản lý user
- có quyền tạo user thì mới thấy nút tạo
- có quyền sửa thì mới thấy nút sửa
- có quyền gán role thì mới thấy nút gán vai trò
- có quyền reset password thì mới thấy nút reset password

Nếu hiện tại project chưa có helper `hasPermission`, hãy code theo convention access hiện có và comment rõ chỗ có thể nâng cấp sau.

---

# Những gì không làm trong scope này
- không làm module profile cá nhân
- không làm HRM
- không làm phân quyền sâu theo scope dữ liệu ở frontend
- không refactor toàn bộ hệ access cũ
- không tạo module mới ngoài phạm vi user IAM

---

# Yêu cầu đầu ra
Hãy trả về:

1. Danh sách file mới / file đã sửa
2. Code đầy đủ cho từng file
3. Đoạn route cần thêm vào `.umirc.ts`
4. Nếu cần sửa access hoặc menu, nêu rõ phần code cần chỉnh
5. Code phải chạy được và bám đúng backend API IAM mới

Hãy code hoàn chỉnh, nhất quán, dễ maintain.
