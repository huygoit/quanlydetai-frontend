# SPEC – MODULE ĐĂNG KÝ ĐỀ XUẤT ĐỀ TÀI (GIAI ĐOẠN 1) – `specs/projects-register.md`

## 1. Mục tiêu

Module **Đăng ký đề xuất** (Giai đoạn 1) dùng để:

- Cho phép **NCV/CNĐT** tạo, lưu nháp và gửi **hồ sơ đề xuất đề tài**.
- Cho phép **Trưởng đơn vị** xem và cho ý kiến trên đề xuất thuộc đơn vị mình.
- Cho phép **Phòng KH** tổng hợp, sơ duyệt, chuyển tiếp cho các bước tiếp theo (Hội đồng…).
- Là nguồn dữ liệu đầu vào cho các giai đoạn sau (xét duyệt, thực hiện, nghiệm thu).

Module này tương ứng với menu:

- `Đề tài nghiên cứu` → `Đăng ký đề xuất` – route: `/projects/register`

---

## 2. Role & Access

Role đã thống nhất:

- `NCV`
- `CNDT`
- `TRUONG_DON_VI`
- `PHONG_KH`
- `HOI_DONG`
- `LANH_DAO`
- `ADMIN`

Access key sử dụng:

- `canViewProjectRegister` – xem & thao tác tại module Đăng ký đề xuất.

Gợi ý mapping (cho access.ts – không bắt Cursor implement logic backend, chỉ dùng key):

- `NCV`, `CNDT` → được tạo/sửa/gửi đề xuất của chính mình.
- `TRUONG_DON_VI` → xem các đề xuất thuộc đơn vị mình, nhập ý kiến đơn vị.
- `PHONG_KH`, `LANH_DAO`, `ADMIN` → xem tất cả, sơ duyệt, cập nhật trạng thái.

---

## 3. Model dữ liệu Đề xuất (Proposal)

Dùng riêng cho Giai đoạn 1 (có thể tái sử dụng cho Project tổng thể về sau).

```ts
type ProposalStatus =
  | 'DRAFT'          // Bản nháp – chỉ CNĐT thấy
  | 'SUBMITTED'      // CNĐT đã gửi đề xuất
  | 'UNIT_REVIEWED'  // Trưởng đơn vị đã cho ý kiến
  | 'APPROVED'       // Phòng KH / Lãnh đạo duyệt đưa vào danh sách
  | 'REJECTED'       // Không được duyệt
  | 'WITHDRAWN';     // CNĐT xin rút

interface ProjectProposal {
  id: string;
  code: string;             // Mã đề xuất, vd: ĐT-2025-001
  title: string;            // Tên đề tài đề xuất
  field: string;            // Lĩnh vực khoa học
  level: string;            // Cấp quản lý dự kiến (Cơ sở / Trường / Bộ / ...)
  year: number;             // Năm đề xuất
  durationMonths: number;   // Thời gian thực hiện (tháng)
  keywords?: string[];      // Từ khoá
  createdAt: string;
  updatedAt: string;

  // Chủ nhiệm + nhóm
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  ownerUnit: string;
  coAuthors?: string[];     // Danh sách tham gia khác (text đơn giản)

  // Nội dung khoa học
  objectives: string;       // Mục tiêu
  summary: string;          // Tóm tắt
  contentOutline?: string;  // Nội dung chính / đề cương
  expectedResults?: string; // Kết quả / sản phẩm dự kiến
  applicationPotential?: string; // Khả năng ứng dụng

  // Kinh phí
  requestedBudgetTotal?: number; // Kinh phí đề nghị tổng (VNĐ)
  requestedBudgetDetail?: string; // Mô tả chi tiết (text)

  // Trạng thái & ý kiến
  status: ProposalStatus;
  unitComment?: string;     // Ý kiến Trưởng đơn vị
  unitApproved?: boolean;   // Đơn vị đề xuất/không đề xuất
  sciDeptComment?: string;  // Ý kiến Phòng KH
  sciDeptPriority?: 'LOW' | 'MEDIUM' | 'HIGH'; // Ưu tiên Phòng KH
}
```

Cursor phải dùng tối thiểu các field trên trong type/type alias ở frontend.

---

## 4. Route & Page

Route chính:

- `path: '/projects/register'`
- `component: '@/pages/projects/register'`
- `access: 'canViewProjectRegister'`

Page tương ứng:

- `src/pages/projects/register/index.tsx`

---

## 5. Layout tổng thể trang `/projects/register`

Sử dụng:

- `PageContainer` (Ant Design Pro)
- Bên trong là **`ProTable<ProjectProposal>`** hiển thị danh sách đề xuất.

Trên header:

- Tiêu đề: `Đăng ký đề xuất đề tài`
- Nút **“Tạo đề xuất mới”** cho user có quyền tạo (NCV, CNDT).

---

## 6. Bộ lọc (Search / Filter) trên bảng

Filter đặt trong toolbar hoặc search form của ProTable:

- Năm đề xuất (Select, default = năm hiện tại)
- Trạng thái (Select: DRAFT, SUBMITTED, UNIT_REVIEWED, APPROVED, REJECTED, WITHDRAWN)
- Cấp quản lý (level)
- Lĩnh vực (field)
- Đơn vị (ownerUnit) – đối với Phòng KH / Lãnh đạo / Admin
- Từ khoá (keyword – tìm theo mã, tiêu đề, chủ nhiệm)

Hạn chế theo role:

- **NCV/CNDT**: chỉ thấy đề xuất mà `ownerId` = currentUser.
- **TRUONG_DON_VI**: mặc định filter theo `ownerUnit` = đơn vị của currentUser.
- **PHONG_KH / LANH_DAO / ADMIN**: thấy tất cả, có filter thêm đơn vị.

---

## 7. Cột bảng (columns)

Các cột chính:

1. `code` – Mã đề xuất  
2. `title` – Tên đề tài  
3. `ownerName` – Chủ nhiệm đề xuất  
4. `ownerUnit` – Đơn vị  
5. `field` – Lĩnh vực  
6. `level` – Cấp quản lý  
7. `requestedBudgetTotal` – Kinh phí đề nghị (format tiền VNĐ)  
8. `status` – Trạng thái (badge màu)  
9. `year` – Năm  
10. `updatedAt` – Cập nhật (dd/MM/yyyy HH:mm)  
11. `actions` – Hành động (tuỳ role)

### Hiển thị trạng thái (badge)

Map:

- `DRAFT` → “Nháp”
- `SUBMITTED` → “Đã gửi”
- `UNIT_REVIEWED` → “Đơn vị đã duyệt”
- `APPROVED` → “Đã phê duyệt”
- `REJECTED` → “Không phê duyệt”
- `WITHDRAWN` → “Đã rút”

---

## 8. Hành động theo Role

### 8.1. NCV / CNDT (là chủ nhiệm)

Trên mỗi dòng (nếu là owner):

- `Xem` – mở Drawer chi tiết.
- `Sửa` – nếu status ∈ { DRAFT, SUBMITTED (tuỳ policy), REJECTED, WITHDRAWN? } – gợi ý: **chỉ DRAFT + REJECTED**.
- `Gửi đề xuất` – nếu status = DRAFT.
- `Rút đề xuất` – nếu status = SUBMITTED (đổi sang WITHDRAWN).
- `Xoá` – nếu status = DRAFT (confirm).

### 8.2. TRƯỞNG ĐƠN VỊ

- Xem danh sách đề xuất của đơn vị mình.
- Hành động:
  - `Xem` – Drawer chi tiết.
  - `Ý kiến đơn vị` – mở Modal/Drawer nhập:
    - `unitApproved` (checkbox / radio: Đề xuất / Không đề xuất)
    - `unitComment` (TextArea)
  - Chỉ cho phép ý kiến khi status = `SUBMITTED`.

Sau khi lưu, status có thể chuyển từ `SUBMITTED` → `UNIT_REVIEWED`.

### 8.3. PHÒNG KH / LÃNH ĐẠO / ADMIN

Thêm hành động:

- `Sơ duyệt` – chỉnh:
  - `sciDeptPriority` (LOW / MEDIUM / HIGH)
  - `sciDeptComment`
  - cập nhật `status`: APPROVED hoặc REJECTED

(Bước Hội đồng chi tiết sẽ thuộc module `projects-council`, spec riêng, nên tại đây chỉ cần đến APPROVED / REJECTED).

---

## 9. Form “Tạo / Sửa đề xuất”

Sử dụng:

- `StepsForm` (Ant Design Pro) hoặc `ModalForm` với Tabs (t tuỳ Cursor nhưng ưu tiên StepsForm).

### Gợi ý chia bước:

**Bước 1 – Thông tin chung**

- Năm đề xuất (year) – default = năm hiện tại.
- Tên đề tài (title) – bắt buộc.
- Cấp quản lý dự kiến (level) – Select.
- Lĩnh vực (field) – Select.
- Thời gian thực hiện (durationMonths) – InputNumber.
- Từ khoá (keywords) – Select mode="tags".

**Bước 2 – Nội dung khoa học**

- Mục tiêu (objectives) – TextArea.
- Tóm tắt (summary) – TextArea.
- Nội dung chính / đề cương (contentOutline) – TextArea.
- Kết quả dự kiến (expectedResults) – TextArea.
- Khả năng ứng dụng (applicationPotential) – TextArea.

**Bước 3 – Nhân sự & kinh phí**

- Chủ nhiệm đề tài: auto-fill từ currentUser (ownerName, ownerUnit) – chỉ hiển thị, không cho sửa.
- Thành viên tham gia (coAuthors) – Tags / List tên.
- Kinh phí đề nghị tổng (requestedBudgetTotal) – InputNumber định dạng VNĐ.
- Mô tả kinh phí chi tiết (requestedBudgetDetail) – TextArea.

### Nút

- `Lưu nháp` – lưu/ cập nhật status = DRAFT.
- `Lưu & Gửi` – set status = SUBMITTED (nếu pass validate).

---

## 10. Drawer chi tiết đề xuất

Khi bấm `Xem`:

Hiển thị panel chi tiết bên phải (Drawer):

- Thông tin chung
- Nội dung khoa học
- Nhân sự
- Kinh phí
- Ý kiến Đơn vị (nếu có)
- Ý kiến Phòng KH (nếu có)
- Thông tin trạng thái & lịch sử đơn giản (tuỳ khả năng, có thể mock).

---

## 11. Mock service (`src/services/projectsRegister.ts`)

Tạo file:

- `src/services/projectsRegister.ts`

Với các hàm:

```ts
export async function queryProjectProposals(params: {
  pageSize?: number;
  current?: number;
  keyword?: string;
  year?: number;
  status?: ProposalStatus;
  level?: string;
  field?: string;
  unit?: string;
  ownerOnly?: boolean; // true: chỉ lấy đề xuất của currentUser
}) {
  // return { data: ProjectProposal[], total: number, success: boolean }
}

export async function createProjectProposal(data: Partial<ProjectProposal>) {
  // tạo mới, default status = DRAFT
}

export async function updateProjectProposal(id: string, data: Partial<ProjectProposal>) {
  // cập nhật (tùy status)
}

export async function submitProjectProposal(id: string) {
  // DRAFT -> SUBMITTED
}

export async function withdrawProjectProposal(id: string) {
  // SUBMITTED -> WITHDRAWN
}

export async function deleteProjectProposal(id: string) {
  // xoá đề xuất nếu DRAFT
}

export async function unitReviewProjectProposal(id: string, data: {
  unitApproved: boolean;
  unitComment?: string;
}) {
  // cập nhật ý kiến đơn vị, status -> UNIT_REVIEWED
}

export async function sciDeptReviewProjectProposal(id: string, data: {
  status: ProposalStatus; // APPROVED hoặc REJECTED
  sciDeptPriority?: 'LOW' | 'MEDIUM' | 'HIGH';
  sciDeptComment?: string;
}) {
  // cập nhật ý kiến phòng KH
}
```

Data có thể được lưu mock trong bộ nhớ (frontend-only) hoặc dùng mock plugin của Umi.

---

## 12. UX & Quy tắc chung

- Tất cả label, title, placeholder **dùng tiếng Việt**.
- Validate:
  - Bắt buộc: title, field, level, objectives, summary, year.
  - Kinh phí tổng có thể optional ban đầu (tuỳ chính sách, nhưng nên cho nhập).
- Pagination:
  - Default pageSize = 10 / 20.
- Trạng thái hiển thị bằng badge màu, nhất quán với module khác.
- Khi thao tác quan trọng (Gửi, Rút, Xoá, Phê duyệt, Không phê duyệt), phải có `Modal.confirm`.

---

## 13. Yêu cầu Cursor khi generate code

Khi đọc `specs/projects-register.md`, Cursor phải:

1. Tạo / cập nhật page:
   - `src/pages/projects/register/index.tsx`
2. Trang sử dụng:
   - `PageContainer`
   - `ProTable<ProjectProposal>`
   - Drawer chi tiết
   - Form (StepsForm/ModalForm) cho tạo/sửa đề xuất
3. Tích hợp với `@@initialState` để lấy `currentUser`:
   - Gán ownerName, ownerUnit, ownerId cho đề xuất mới.
   - Lọc dữ liệu theo role (ownerOnly, unit, v.v.)
4. Tạo file service:
   - `src/services/projectsRegister.ts` với các hàm mock như mục 11.
5. Tích hợp access:
   - Route `/projects/register` dùng `access: 'canViewProjectRegister'`.
   - Ẩn/hiện action theo role (NCV/CNDT, TRUONG_DON_VI, PHONG_KH/LÃNH_ĐẠO/ADMIN).
6. Không đổi route hoặc cấu trúc menu đã được định nghĩa trong `menu-enterprise-v2` trước đó.
7. Code dùng TypeScript, tuân thủ model `ProjectProposal` & `ProposalStatus` nêu ở trên.
