# Nhiệm vụ
Hãy xây dựng frontend **Ant Design Pro** cho module **quản lý phân quyền (IAM)** trong dự án hiện tại.

Mục tiêu là tạo các màn hình quản trị để làm việc với backend IAM đã/đang được xây dựng ở AdonisJS v6, bao gồm:

1. **Quản lý Roles**
2. **Quản lý Permissions**
3. **Gán role cho user**

---

# Bối cảnh dự án frontend
Dự án frontend hiện tại đang dùng **Ant Design Pro** và có các convention thực tế sau:

- route cấu hình ở **`.umirc.ts`**
- page admin đặt trong **`src/pages/admin`**
- page layout dùng **`PageContainer`**
- list page ưu tiên dùng **`ProTable`**
- form dùng **`ModalForm` / `DrawerForm` / `ProForm`** tùy ngữ cảnh
- service API đặt ở **`src/services/api`**
- request wrapper dùng **`src/services/request.ts`**
- access control hiện có dạng như **`canViewAdmin`**

## Yêu cầu quan trọng
- Phải **bám sát cấu trúc dự án hiện tại**
- Không tự tạo kiến trúc lạ nếu không cần
- Không over-engineering
- Code phải đồng bộ phong cách với source đang có
- Ưu tiên code rõ ràng, dễ maintain

---

# Phạm vi chức năng cần làm

## 1. Màn quản lý Roles
Cho phép:
- xem danh sách role
- tìm kiếm role theo code, name
- lọc theo status
- tạo mới role
- cập nhật role
- đổi trạng thái active/inactive
- mở màn gán permission cho role

## 2. Màn quản lý Permissions
Cho phép:
- xem danh sách permission
- tìm kiếm theo code, name, module
- lọc theo module, status
- chỉ cần **xem danh sách** ở phase này nếu backend không cho CRUD permission
- nếu backend có API CRUD permission thì hãy chuẩn bị cấu trúc service để mở rộng sau, nhưng UI phase này ưu tiên **list/read-only**

## 3. Màn gán permission cho role
Cho phép:
- từ danh sách role, bấm vào action “Gán quyền”
- mở giao diện chọn permission cho role
- hiển thị permission theo nhóm `module`
- có checkbox chọn/bỏ chọn
- submit cập nhật toàn bộ permission của role

## 4. Màn gán role cho user
Cho phép:
- xem danh sách user
- tìm kiếm user theo tên, email, username
- xem các role hiện tại của user
- gán thêm role cho user
- bật/tắt role assignment
- thu hồi role nếu backend hỗ trợ

---

# Giả định backend API
Hãy code frontend theo hướng service rõ ràng để map vào backend IAM. Giả sử backend cung cấp các API sau:

## Roles
- `GET /admin/roles`
- `GET /admin/roles/:id`
- `POST /admin/roles`
- `PUT /admin/roles/:id`
- `PATCH /admin/roles/:id/status`
- `GET /admin/roles/:id/permissions`
- `PUT /admin/roles/:id/permissions`

## Permissions
- `GET /admin/permissions`
- `GET /admin/permissions/grouped`

## Users + role assignments
- `GET /admin/users`
- `GET /admin/users/:id/roles`
- `POST /admin/users/:id/roles`
- `PATCH /admin/users/:id/roles/:assignmentId/status`
- `DELETE /admin/users/:id/roles/:assignmentId`

Nếu project backend thực tế khác nhẹ về endpoint, hãy tổ chức code sao cho dễ sửa URL ở layer service.

---

# Yêu cầu UI/UX

## 1. Roles List Page
Tạo page trong khu admin, ví dụ:
- `src/pages/admin/iam/roles/index.tsx`

### Chức năng
- dùng `PageContainer`
- dùng `ProTable`
- có toolbar button `Thêm vai trò`
- có search theo:
  - code
  - name
  - status
- cột hiển thị:
  - STT
  - code
  - name
  - description
  - status
  - createdAt
  - action

### Actions mỗi dòng
- Xem / Sửa
- Đổi trạng thái
- Gán permission

### Form create/update role
- dùng `ModalForm` hoặc `DrawerForm`
- field:
  - code
  - name
  - description
  - status
- validate form cơ bản
- submit gọi service
- reload table sau khi thành công

---

## 2. Permissions List Page
Tạo page ví dụ:
- `src/pages/admin/iam/permissions/index.tsx`

### Chức năng
- `PageContainer`
- `ProTable`
- search theo:
  - code
  - name
  - module
  - status
- cột:
  - STT
  - code
  - name
  - module
  - action
  - status

### Lưu ý
- phase này ưu tiên read-only
- không cần làm create/update permission nếu backend chưa có
- nếu backend chỉ list thì UI chỉ hiển thị danh sách đẹp, filter tốt

---

## 3. Role Permission Assignment Page / Modal
Khi bấm “Gán quyền” ở role list:

### Yêu cầu
- mở `Modal` hoặc `Drawer`
- load danh sách permission nhóm theo `module`
- hiển thị dạng nhóm:
  - Department
  - User
  - Role
  - Project
  - Idea
  - Council
  - Publication
  - Report
  - ...
- trong mỗi group có checkbox list
- các permission đã có của role phải được checked sẵn
- có nút:
  - Lưu
  - Hủy
- khi submit, gọi API cập nhật permissions cho role

### Gợi ý UI
Có thể dùng:
- `Collapse` + `Checkbox.Group`
hoặc
- `Card` + `Checkbox`

Ưu tiên giao diện rõ ràng, dễ dùng cho admin.

---

## 4. User Role Assignment Page
Tạo page ví dụ:
- `src/pages/admin/iam/user-roles/index.tsx`

### Chức năng
- list user bằng `ProTable`
- search theo:
  - full_name
  - username
  - email
- cột:
  - STT
  - full_name
  - username
  - email
  - department
  - roles hiện tại
  - status
  - action

### Action mỗi dòng
- `Gán role`
- `Xem role`

### Drawer/Modal gán role cho user
Yêu cầu:
- load danh sách tất cả role đang active
- load các role assignment hiện tại của user
- hiển thị role hiện có dạng tag/list
- cho phép thêm role mới
- có thể bật/tắt assignment status nếu backend hỗ trợ
- có thể thu hồi role nếu backend hỗ trợ

### Gợi ý triển khai thực tế
Có thể chia làm 2 phần trong drawer:

#### Phần A: danh sách role hiện tại
- role name
- status
- action: bật/tắt / xóa

#### Phần B: form gán role mới
- chọn role từ select
- note nếu cần
- submit

---

# Tổ chức file đề xuất
Hãy tạo code theo cấu trúc gần giống sau, nhưng có thể điều chỉnh để khớp project thực tế:

```txt
src/
  pages/
    admin/
      iam/
        roles/
          index.tsx
          components/
            RoleForm.tsx
            RolePermissionModal.tsx
        permissions/
          index.tsx
        user-roles/
          index.tsx
          components/
            UserRoleDrawer.tsx

  services/
    api/
      roles.ts
      permissions.ts
      user-roles.ts

  access.ts
  .umirc.ts
```

---

# Yêu cầu service API
Hãy tạo service rõ ràng, tách riêng từng domain.

## `src/services/api/roles.ts`
Các hàm gợi ý:
- `getRoles(params)`
- `getRoleDetail(id)`
- `createRole(data)`
- `updateRole(id, data)`
- `changeRoleStatus(id, data)`
- `getRolePermissions(id)`
- `updateRolePermissions(id, data)`

## `src/services/api/permissions.ts`
- `getPermissions(params)`
- `getGroupedPermissions()`

## `src/services/api/user-roles.ts`
- `getUsers(params)`
- `getUserRoles(userId)`
- `assignRoleToUser(userId, data)`
- `changeUserRoleStatus(userId, assignmentId, data)`
- `removeUserRole(userId, assignmentId)`

### Yêu cầu
- dùng wrapper request hiện có của dự án
- typing cơ bản bằng TypeScript
- không hardcode linh tinh trong page nếu có thể tách vào service

---

# Access control frontend
Dự án hiện có `canViewAdmin`. Hãy mở rộng theo hướng rõ ràng hơn nhưng vẫn tương thích style hiện tại.

## Yêu cầu
- route IAM chỉ hiển thị cho user có quyền admin phù hợp
- có thể tiếp tục dùng `canViewAdmin` cho phase đầu
- nếu project đã có access object từ user permissions, hãy bổ sung thêm các key như:
  - `canViewRoles`
  - `canManageRoles`
  - `canViewPermissions`
  - `canAssignRoleToUser`

Nếu chưa có dữ liệu permission thực từ backend khi login, hãy vẫn code theo cách dễ nâng cấp sau.

---

# Route/menu cần thêm
Cập nhật `.umirc.ts` để thêm menu admin IAM.

## Gợi ý menu
- Quản trị hệ thống
  - Phòng ban
  - Vai trò
  - Quyền
  - Gán role người dùng

### Lưu ý
- phải bám style route/menu hiện tại của project
- không phá route cũ
- đặt icon hợp lý nếu project đang dùng icon

---

# Kiểu dữ liệu gợi ý

## Role
```ts
export interface RoleItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
  updated_at?: string;
}
```

## Permission
```ts
export interface PermissionItem {
  id: number;
  code: string;
  name: string;
  module: string;
  action?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}
```

## User item
```ts
export interface UserItem {
  id: number;
  full_name: string;
  username: string;
  email: string;
  department?: {
    id: number;
    name: string;
  };
  status?: string;
  roles?: RoleItem[];
}
```

## User role assignment
```ts
export interface UserRoleAssignmentItem {
  id: number;
  role_id: number;
  user_id: number;
  role: RoleItem;
  is_active: boolean;
  start_at?: string | null;
  end_at?: string | null;
}
```

---

# Quy ước response backend cần tương thích
Giả sử API trả về dạng:

## List
```json
{
  "message": "Fetched successfully",
  "data": [],
  "meta": {
    "total": 10,
    "perPage": 10,
    "currentPage": 1,
    "lastPage": 1
  }
}
```

## Detail
```json
{
  "message": "Fetched successfully",
  "data": {}
}
```

Frontend cần map đúng format này vào `ProTable`.

---

# Yêu cầu coding style
- dùng TypeScript
- component tách hợp lý, không dồn 1 file quá dài nếu có thể tránh
- giữ code dễ hiểu
- ưu tiên `ProTable`, `ModalForm`, `Drawer`, `Tag`, `Space`, `Popconfirm`, `message`
- xử lý loading đầy đủ
- có thông báo thành công/thất bại
- sau khi create/update/assign thành công thì reload dữ liệu liên quan
- không làm state management phức tạp nếu chưa cần
- ưu tiên local state + hooks rõ ràng

---

# Yêu cầu đầu ra
Hãy thực hiện toàn bộ thay đổi cần thiết và trả về:

1. Danh sách file mới / file sửa
2. Nội dung code đầy đủ cho từng file
3. Nếu sửa `.umirc.ts`, hãy đưa chính xác phần cần chèn/sửa
4. Nếu cần thêm access rule, hãy nêu rõ phần code đề xuất
5. Code phải chạy được, đồng bộ với style Ant Design Pro hiện tại của dự án

---

# Mục tiêu cuối cùng
Sau khi hoàn thành, admin có thể:
- vào menu Vai trò để CRUD role
- vào menu Quyền để xem permission
- từ role có thể gán permission
- vào menu Gán role người dùng để gán role cho user

Hãy code đầy đủ, nhất quán, dễ maintain, và bám sát structure hiện tại của dự án.
