# Nhiệm vụ
Hãy xây dựng **frontend chức năng quản lý department** cho dự án **React + Umi Max + Ant Design Pro** hiện có, bám sát cấu trúc source hiện tại và kết nối với API backend department đã/hoặc sẽ được tạo.

## Bối cảnh dự án frontend hiện tại
Dự án hiện đang dùng:
- Umi Max
- Ant Design Pro
- TypeScript
- Ant Design
- `@ant-design/pro-components`
- request wrapper riêng tại `src/services/request.ts`
- route cấu hình trong `.umirc.ts`
- access control trong `src/access.ts`

## Kiến trúc hiện tại cần bám theo
- Trang admin đang nằm trong: `src/pages/admin/...`
- Các page admin hiện tại đang dùng `PageContainer`
- Service API đang nằm trong: `src/services/api/...`
- Request helper đang dùng:
  - `get`
  - `post`
  - `put`
  - `patch`
  từ `src/services/request.ts`
- Route admin đang khai báo trong `.umirc.ts`
- Access control hiện tại dùng `access: 'canViewAdmin'`

## Thực trạng hiện tại
- Đã có menu `/admin`
- Đã có trang `src/pages/admin/users/index.tsx`
- Đã có trang `src/pages/admin/config/index.tsx`
- Đã có trang `src/pages/admin/catalog/index.tsx`
- Chưa có chức năng quản lý department

## Mục tiêu
Xây dựng hoàn chỉnh frontend cho **Department Management** trong khu vực Admin.

---

# Phạm vi chức năng cần làm

## 1. Tạo page quản lý department
Tạo page mới theo đường dẫn:
- `src/pages/admin/departments/index.tsx`

Trang này dùng:
- `PageContainer`
- `ProTable`
- `ModalForm` hoặc `DrawerForm` để tạo/sửa
- `Tag`, `Badge`, `Popconfirm`, `Button`, `Space`, `message` nếu cần

## 2. Tính năng cần có trên page

### Danh sách department
Hiển thị các cột:
- `code`
- `name`
- `short_name`
- `type`
- `display_order`
- `status`
- `note`
- `created_at`
- `updated_at`
- cột hành động

### Tìm kiếm / lọc
Phải hỗ trợ:
- tìm theo từ khóa `keyword` (mã hoặc tên)
- lọc theo `type`
- lọc theo `status`

### Tạo mới department
Form gồm:
- `code`
- `name`
- `short_name`
- `type`
- `display_order`
- `status`
- `note`

### Cập nhật department
Cho phép sửa từ action ở mỗi dòng.

### Đổi trạng thái nhanh
Có action đổi `ACTIVE/INACTIVE` bằng nút hoặc switch có confirm.

---

# Yêu cầu UI/UX

## 1. Giao diện
- Phù hợp phong cách các page hiện tại trong dự án
- Dùng `PageContainer`
- Dùng `ProTable` làm trung tâm
- Modal tạo/sửa gọn, rõ ràng
- Cột trạng thái hiển thị đẹp bằng `Tag` hoặc `Badge`
- Cột loại đơn vị hiển thị bằng `Tag`
- Có action rõ ràng: `Sửa`, `Đổi trạng thái`

## 2. Trải nghiệm người dùng
- Sau khi tạo/sửa/đổi trạng thái thành công phải reload table
- Có thông báo thành công/thất bại bằng `message`
- Search form gọn, dễ dùng
- Pagination theo chuẩn `ProTable`

---

# API backend cần tích hợp
Giả sử backend có các API sau:

## 1. GET `/admin/departments`
### Query params
- `page`
- `perPage`
- `keyword`
- `type`
- `status`
- `sortBy`
- `order`

### Response mẫu
```json
{
  "message": "Departments fetched successfully",
  "data": [
    {
      "id": 1,
      "code": "PTO",
      "name": "Phòng Tổ chức",
      "short_name": "P. Tổ chức",
      "type": "OFFICE",
      "display_order": 1,
      "status": "ACTIVE",
      "note": null,
      "created_at": "2026-03-09T09:00:00.000Z",
      "updated_at": "2026-03-09T09:00:00.000Z"
    }
  ],
  "meta": {
    "total": 10,
    "perPage": 10,
    "currentPage": 1,
    "lastPage": 1
  }
}
```

## 2. GET `/admin/departments/:id`

## 3. POST `/admin/departments`

## 4. PUT `/admin/departments/:id`

## 5. PATCH `/admin/departments/:id/status`
### Body mẫu
```json
{
  "status": "INACTIVE"
}
```

---

# Quy ước dữ liệu cần dùng ở frontend

## 1. Type options
Tạo constant/value enum để hiển thị các loại đơn vị:
- `UNIVERSITY` -> `Trường`
- `BOARD` -> `Ban`
- `OFFICE` -> `Phòng`
- `FACULTY` -> `Khoa`
- `CENTER` -> `Trung tâm`
- `COUNCIL` -> `Hội đồng`
- `OTHER` -> `Khác`

## 2. Status options
- `ACTIVE` -> `Đang hoạt động`
- `INACTIVE` -> `Ngừng hoạt động`

Nên có map cấu hình để dùng chung cho:
- render table
- form select
- search filter

---

# Yêu cầu kỹ thuật chi tiết

## 1. Tạo service API mới
Tạo file mới:
- `src/services/api/departments.ts`

Trong file này, hãy định nghĩa:

### Types/interfaces
- `DepartmentType`
- `DepartmentStatus`
- `Department`
- `QueryDepartmentsParams`
- `CreateDepartmentPayload`
- `UpdateDepartmentPayload`
- `UpdateDepartmentStatusPayload`

### Constants
- `DEPARTMENT_TYPE_MAP`
- `DEPARTMENT_STATUS_MAP`
- `DEPARTMENT_TYPE_OPTIONS`
- `DEPARTMENT_STATUS_OPTIONS`

### API functions
- `queryDepartments(params)`
- `getDepartment(id)`
- `createDepartment(payload)`
- `updateDepartment(id, payload)`
- `updateDepartmentStatus(id, payload)`

### Yêu cầu
- Dùng request helper hiện có từ `src/services/request.ts`
- Export đúng convention hiện có của dự án
- Kiểu dữ liệu rõ ràng
- Không viết kiểu any bừa bãi

---

## 2. Cập nhật export service index
Cập nhật file:
- `src/services/api/index.ts`

Để export thêm service `departments`

---

## 3. Tạo page mới
Tạo file:
- `src/pages/admin/departments/index.tsx`

### Yêu cầu triển khai
- dùng `PageContainer`
- dùng `ProTable<Department>`
- dùng `ActionType` + `useRef`
- dùng `ModalForm` để tạo/sửa
- request của `ProTable` phải gọi `queryDepartments`
- map `params.current` -> `page`
- map `params.pageSize` -> `perPage`
- map đúng `keyword`, `type`, `status`
- trả về format mà `ProTable` cần:
  - `data`
  - `success`
  - `total`

### Form tạo/sửa
Dùng `ModalForm` + `ProFormText` + `ProFormSelect` + `ProFormDigit` + `ProFormTextArea`

Field gồm:
- code
- name
- short_name
- type
- display_order
- status
- note

### Hành vi form
- Nếu đang tạo mới -> gọi `createDepartment`
- Nếu đang sửa -> gọi `updateDepartment`
- Sau khi thành công:
  - đóng modal
  - reset selected record
  - reload table
  - hiện message thành công

---

## 4. Action trên table
Trong cột hành động cần có:

### Nút Sửa
- mở modal
- đổ dữ liệu record vào form

### Nút đổi trạng thái
- nếu record đang `ACTIVE` -> hỏi xác nhận chuyển `INACTIVE`
- nếu record đang `INACTIVE` -> hỏi xác nhận chuyển `ACTIVE`
- dùng `Popconfirm`
- gọi `updateDepartmentStatus`
- thành công thì reload bảng

---

## 5. Render cột đẹp và rõ ràng

### Cột `type`
Render bằng `Tag`

### Cột `status`
Render bằng `Badge` hoặc `Tag`

### Cột `note`
- nếu rỗng thì hiện `-`
- có thể ellipsis nếu dài

### Cột thời gian
- format thân thiện kiểu `DD/MM/YYYY HH:mm`
- nếu dự án đã có util format date thì tái sử dụng
- nếu chưa có util phù hợp thì có thể format inline gọn gàng

---

## 6. Cập nhật route trong `.umirc.ts`
Thêm menu con mới trong nhóm `/admin`:

- path: `/admin/departments`
- name: `Quản lý đơn vị`
- icon: `ClusterOutlined`
- component: `@/pages/admin/departments`
- access: `canViewAdmin`

Đặt vị trí hợp lý trong menu admin.

---

# Tiêu chuẩn code cần tuân thủ
- Bám sát style source hiện tại
- Không over-engineering
- Không thêm Redux/model phức tạp nếu chưa cần
- Không tạo cấu trúc xa lạ với project hiện tại
- Không đổi convention request hiện có
- Không đụng vào module khác ngoài phạm vi cần thiết
- Không thêm tree/parent department
- Không thêm import thừa
- Viết code sạch, compile được

---

# Mong muốn về output
Hãy thực hiện toàn bộ thay đổi cần thiết và trả về:

1. Danh sách file mới / file đã sửa
2. Nội dung code đầy đủ cho từng file
3. Phần route cần chèn vào `.umirc.ts`
4. Giải thích ngắn gọn cách hoạt động
5. Đảm bảo code chạy được trong project hiện tại

---

# Gợi ý triển khai mong muốn
Nên tạo tối thiểu các file sau:

- `src/services/api/departments.ts`
- `src/pages/admin/departments/index.tsx`
- cập nhật `src/services/api/index.ts`
- cập nhật `.umirc.ts`

Nếu cần, có thể tách thêm constant nhỏ trong cùng file service, nhưng ưu tiên gọn.

---

# Mức độ hoàn thiện kỳ vọng
Đây không phải demo placeholder. Hãy code thành một màn hình quản lý department sử dụng được thật:
- xem danh sách
- tìm kiếm
- lọc
- tạo mới
- chỉnh sửa
- đổi trạng thái
- có menu admin để truy cập

Hãy viết code hoàn chỉnh, nhất quán, production-ready ở mức phù hợp với codebase hiện tại.
