# SPEC – MODULE NGÂN HÀNG Ý TƯỞNG (`specs/ideas.md`)

## 1. Mục tiêu

Module **Ngân hàng ý tưởng** dùng để:
- Thu thập, lưu trữ và quản lý ý tưởng nghiên cứu / sáng kiến.
- Cho phép NCV/CNĐT gửi ý tưởng và theo dõi trạng thái.
- Cho phép Phòng KH / Lãnh đạo sơ loại, ưu tiên và đặt hàng ý tưởng.

Module gồm 3 trang:
1. `/ideas/list` – Danh sách ý tưởng
2. `/ideas/my` – Ý tưởng của tôi
3. `/ideas/review` – Sơ loại & đặt hàng

---

## 2. Role & Access

- `canViewIdeaBank`: NCV, CNDT, TRUONG_DON_VI, PHONG_KH, LANH_DAO, ADMIN, HOI_DONG
- `canManageIdeaBank`: PHONG_KH, LANH_DAO, ADMIN

---

## 3. Model dữ liệu Idea

type IdeaStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED';

interface Idea {
  id: string;
  code: string;
  title: string;
  summary: string;
  field: string;
  level: string[];
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  ownerName: string;
  ownerUnit: string;
  status: IdeaStatus;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  tags?: string[];
  expectedOutput?: string;
  noteForReview?: string;
  convertedProjectId?: string;
}

---

## 4. Routes

- `/ideas/list` → Danh sách ý tưởng
- `/ideas/my` → Ý tưởng của tôi
- `/ideas/review` → Sơ loại & đặt hàng

---

## 5. Trang: `/ideas/list`

### Mục tiêu
Hiển thị toàn bộ ý tưởng trong trường.

### Filter:
- Từ khoá
- Lĩnh vực
- Đơn vị
- Trạng thái
- Mức ưu tiên
- Khoảng thời gian gửi

### Columns:
- Mã ý tưởng
- Tiêu đề
- Người đề xuất
- Đơn vị
- Lĩnh vực
- Trạng thái (badge)
- Mức ưu tiên
- Ngày gửi
- Hành động: Xem chi tiết (Drawer)

---

## 6. Trang: `/ideas/my`

### Mục tiêu
Dành cho người đề xuất xem & quản lý ý tưởng của mình.

### Chức năng:
- Hiển thị danh sách ý tưởng của user
- Thêm ý tưởng mới
- Sửa (khi DRAFT, SUBMITTED)
- Xoá (chỉ DRAFT)
- Xem chi tiết

### Form thêm/sửa:
- Tiêu đề
- Lĩnh vực
- Cấp quản lý dự kiến
- Tóm tắt
- Tags
- Kết quả mong đợi

---

## 7. Trang: `/ideas/review`

### Mục tiêu
Dùng cho PHONG_KH / LANH_DAO / ADMIN sơ loại & đặt hàng.

### Filter:
Giống list nhưng mặc định chỉ hiển thị SUBMITTED / REVIEWING / APPROVED.

### Columns:
- Mã ý tưởng
- Tiêu đề
- Người đề xuất
- Đơn vị
- Lĩnh vực
- Trạng thái
- Mức ưu tiên (editable)
- Ngày gửi
- Hành động:
  - Sơ loại
  - Đặt hàng

### Hành động:
#### Sơ loại (Drawer/Modal):
- Trạng thái mới: SUBMITTED / REVIEWING / APPROVED / REJECTED
- Mức ưu tiên
- Ghi chú sơ loại

#### Đặt hàng:
- Xác nhận → status = CONVERTED
- Gán convertedProjectId (mock)

---

## 8. Mock service (`src/services/ideas.ts`)

export async function queryIdeas(params) {}
export async function createIdea(data) {}
export async function updateIdea(id, data) {}
export async function deleteIdea(id) {}
export async function reviewIdea(id, data) {}
export async function convertIdeaToProject(id) {}

---

## 9. UX quy định

- Tất cả label hiển thị tiếng Việt.
- Empty state cho `/ideas/my` và `/ideas/review`.
- Status dùng badge màu.
- Loading state khi fetch mock API.
- Pagination mặc định pageSize 10–20.

---

## 10. Yêu cầu Cursor khi generate code

Cursor phải:

1. Tạo 3 page:
   - `src/pages/ideas/list/index.tsx`
   - `src/pages/ideas/my/index.tsx`
   - `src/pages/ideas/review/index.tsx`

2. Dùng `PageContainer` + `ProTable`.

3. Tạo `src/services/ideas.ts` với mock API theo section 8.

4. Tích hợp access:
   - `/ideas/list` & `/ideas/my` → `canViewIdeaBank`
   - `/ideas/review` → `canManageIdeaBank`

5. `/ideas/my`:
   - Chỉ load ý tưởng của currentUser
   - Có nút “Thêm ý tưởng mới”

6. `/ideas/review`:
   - Chỉ cho user có `canManageIdeaBank`
   - Có action sơ loại + đặt hàng

7. Không đổi route hoặc cấu trúc menu đã có.

8. Code TypeScript, đúng chuẩn Ant Design Pro.
