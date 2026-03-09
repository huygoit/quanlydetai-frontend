# Nhiệm vụ
Hãy tích hợp cơ chế **access control theo permission thật từ backend** cho dự án frontend **Ant Design Pro**, để menu, route và các nút action tự động ẩn/hiện đúng theo quyền của user sau khi đăng nhập.

## Bối cảnh dự án
- Frontend đang dùng **Ant Design Pro**
- Dự án hiện có:
  - `.umirc.ts` để cấu hình route
  - `src/access.ts`
  - `src/app.tsx` hoặc cơ chế `getInitialState`
  - `src/services/request.ts`
  - các page admin đã có hoặc đang được build
- Backend AdonisJS đã/đang có API:
  - login
  - profile/current user
  - user info kèm role và permission

## Mục tiêu
Sau khi user login hoặc reload app:
1. Frontend lấy được thông tin current user từ backend
2. Frontend lấy được danh sách role và permission thật của user
3. `getInitialState` lưu thông tin này
4. `src/access.ts` sinh ra các rule access từ permission
5. Route/menu trong `.umirc.ts` có thể dùng access để ẩn/hiện
6. Các button/action trong từng page cũng ẩn/hiện theo permission thật

---

# Giả định dữ liệu backend trả về
Hãy giả định API current user/profile trả về dữ liệu theo hướng như sau (nếu source hiện tại khác nhẹ thì hãy map cho tương thích, không phá code cũ):

```json
{
  "data": {
    "id": 1,
    "username": "admin",
    "full_name": "System Admin",
    "email": "admin@example.com",
    "department_id": 1,
    "department": {
      "id": 1,
      "name": "Phòng KHCN"
    },
    "roles": [
      {
        "id": 1,
        "code": "SYSTEM_ADMIN",
        "name": "System Admin"
      }
    ],
    "permissions": [
      "department.view",
      "department.create",
      "department.update",
      "user.view",
      "user.create",
      "user.update",
      "user.assign_role",
      "role.view",
      "role.create"
    ]
  }
}
```

## Lưu ý
- `permissions` nên được frontend chuẩn hóa thành `string[]`
- Nếu backend hiện tại trả permissions lồng trong role thì hãy viết code transform để flatten thành mảng permission codes
- Không yêu cầu backend thay đổi nếu có thể xử lý được ở frontend

---

# Yêu cầu triển khai

## 1. Chuẩn hóa current user model ở frontend
Hãy tạo hoặc cập nhật type/interface cho current user, ví dụ:
- `CurrentUser`
- `RoleItem`
- `PermissionCode`

Current user nên có:
- `id`
- `username`
- `full_name`
- `email`
- `department_id`
- `department`
- `roles`
- `permissions`

Nếu project đã có type sẵn thì mở rộng đúng convention hiện tại.

---

## 2. Cập nhật `getInitialState`
Hãy đọc cấu trúc project hiện tại và tích hợp đúng theo style đang dùng.

Mục tiêu:
- nếu đã có token/session hợp lệ thì gọi API current user/profile
- lưu `currentUser`
- lưu `permissions`
- lưu `roles`
- expose ra `initialState`

Ví dụ `initialState` nên có:
- `currentUser`
- `permissions`
- `roles`
- `fetchUserInfo`
- `settings` (nếu project đang có)

### Yêu cầu
- Không phá cơ chế login hiện có
- Nếu chưa đăng nhập thì `currentUser = undefined`
- Nếu fetch profile fail do hết phiên thì xử lý an toàn
- Code sạch, dễ đọc

---

## 3. Tạo helper xử lý permission
Hãy thêm helper utility nếu cần, ví dụ:
- `hasPermission`
- `hasAnyPermission`
- `hasAllPermissions`

Ví dụ:
- `hasPermission(permissions, 'department.create')`
- `hasAnyPermission(permissions, ['user.update', 'user.assign_role'])`

Có thể đặt ở:
- `src/utils/permission.ts`
hoặc vị trí phù hợp với source hiện tại.

---

## 4. Cập nhật `src/access.ts`
Đây là phần rất quan trọng.

Hãy cập nhật `src/access.ts` để access không còn chỉ là các boolean thô kiểu `canViewAdmin`, mà sinh ra cả rule theo permission thật.

## Access nên hỗ trợ tối thiểu:
- `isLogin`
- `canViewAdmin`
- `canViewDepartments`
- `canCreateDepartment`
- `canEditDepartment`
- `canViewUsers`
- `canCreateUser`
- `canEditUser`
- `canAssignUserRole`
- `canResetUserPassword`
- `canViewRoles`
- `canCreateRole`
- `canEditRole`
- `canAssignRolePermission`

Ngoài ra nên có helper tổng quát:
- `hasPermission(permissionCode: string)`
- `hasAnyPermission(permissionCodes: string[])`

### Quy tắc
Ví dụ:
- `canViewDepartments` khi có `department.view`
- `canCreateDepartment` khi có `department.create`
- `canEditDepartment` khi có `department.update`
- `canViewUsers` khi có `user.view`
- `canAssignUserRole` khi có `user.assign_role`
- `canViewRoles` khi có `role.view`

### `canViewAdmin`
Có thể trả về `true` nếu user có ít nhất 1 quyền admin như:
- `department.view`
- `user.view`
- `role.view`
- `permission.view`

---

## 5. Tích hợp route access trong `.umirc.ts`
Hãy đọc route hiện tại và cập nhật các route admin theo access mới.

Ví dụ:
- route department dùng `access: 'canViewDepartments'`
- route users IAM dùng `access: 'canViewUsers'`
- route roles dùng `access: 'canViewRoles'`

Nếu có layout route admin cha, có thể để:
- route cha admin dùng `access: 'canViewAdmin'`

### Yêu cầu
- Không làm hỏng route hiện tại
- Không đổi cấu trúc route không cần thiết
- Chỉ bổ sung access đúng chỗ

---

## 6. Tích hợp ẩn/hiện menu theo access
Hãy đảm bảo khi route có `access`, menu tương ứng của Ant Design Pro cũng tự ẩn nếu không có quyền.

Nếu project đang có custom menu logic thì hãy chỉnh theo convention hiện tại.

---

## 7. Tích hợp ẩn/hiện button/action trong page
Hãy đưa ví dụ áp dụng vào các màn đang hoặc sẽ có:
- Department Management
- User Management
- Role Management

### Ví dụ ở Department page
- chỉ hiện nút “Thêm mới” khi `access.canCreateDepartment`
- chỉ hiện nút “Sửa” khi `access.canEditDepartment`

### Ví dụ ở User page
- chỉ hiện nút “Tạo user” khi `access.canCreateUser`
- chỉ hiện nút “Gán vai trò” khi `access.canAssignUserRole`
- chỉ hiện nút “Reset mật khẩu” khi `access.canResetUserPassword`

### Ví dụ ở Role page
- chỉ hiện nút “Tạo role” khi `access.canCreateRole`
- chỉ hiện nút “Gán quyền” khi `access.canAssignRolePermission`

### Yêu cầu
- Dùng hook/access pattern đúng style Ant Design Pro
- Không hardcode role name như `admin`
- Chỉ dựa vào permission

---

## 8. Cập nhật login flow nếu cần
Nếu current login flow chưa tự fetch lại profile/current user sau login thành công, hãy bổ sung.

Mục tiêu:
- login thành công
- gọi lại `fetchUserInfo` hoặc refresh `initialState`
- menu và access cập nhật ngay mà không cần reload tay

Nếu dự án hiện tại đã có flow này thì chỉ chỉnh vừa đủ.

---

## 9. Xử lý logout / hết phiên
Khi logout:
- xóa current user khỏi state
- xóa permissions/roles khỏi state

Khi token hết hạn:
- request interceptor hoặc fetch profile fail thì redirect/login theo convention hiện tại
- không để access cũ còn sót

---

## 10. Yêu cầu type-safe và clean code
- Ưu tiên TypeScript rõ ràng
- Không dùng `any` bừa bãi
- Nếu cần utility function thì tách riêng
- Bám sát convention hiện tại của source frontend
- Không over-engineering

---

# Kết quả mong muốn

## A. Sau khi login bằng tài khoản có quyền
- thấy menu admin phù hợp
- thấy menu department/users/roles theo quyền
- thấy các nút create/edit/assign theo quyền

## B. Sau khi login bằng tài khoản ít quyền hơn
- menu bị ẩn đúng
- route bị chặn đúng
- nút action bị ẩn đúng

## C. Không dùng hardcoded role
Mọi thứ phải dựa trên permission thật từ backend.

---

# Các file có thể cần sửa
Hãy đọc source thực tế rồi sửa đúng chỗ, có thể gồm:
- `.umirc.ts`
- `src/access.ts`
- `src/app.tsx`
- `src/services/...`
- `src/models/...` hoặc `src/types/...`
- `src/utils/permission.ts`
- các page IAM / Department / Role / User nếu cần tích hợp button access

Không bắt buộc đúng chính xác tên file trên, hãy bám theo source thực tế.

---

# Yêu cầu đầu ra
Hãy thực hiện toàn bộ thay đổi cần thiết và trả về:

1. Danh sách file đã sửa / file mới
2. Giải thích ngắn gọn thay đổi chính
3. Nội dung code đầy đủ cho từng file quan trọng
4. Chỉ rõ cách access hoạt động từ:
   - backend current user response
   - initialState
   - access.ts
   - route/page button

Hãy code hoàn chỉnh, nhất quán, chạy được, không phá flow cũ.
