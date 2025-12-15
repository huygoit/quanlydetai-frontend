# SPEC – HỒ SƠ KHOA HỌC (GIẢNG VIÊN / NCV) – VIP PRO
## File: `specs/scientific-profile.md`
> Mục tiêu: Xây dựng **CV khoa học điện tử (living profile)**, cập nhật tự động từ hệ thống & nguồn ngoài, có xác thực (tùy chọn), tra cứu & xuất CV theo mẫu chuẩn.

---

## 1. Mục tiêu & Phạm vi

### 1.1 Mục tiêu
- Tạo **cơ sở dữ liệu Hồ sơ khoa học** có cấu trúc (không chỉ upload PDF).
- **Giảm nhập liệu trùng lặp**: dữ liệu từ module Đề tài/Công bố tự đẩy sang hồ sơ.
- Cho phép **xác thực** bởi Phòng KH–CNTT–HTQT (tùy chọn).
- Cho phép **tra cứu** hồ sơ theo tên/chuyên ngành/hướng nghiên cứu.
- Cho phép **xuất CV** theo mẫu chuẩn (Bộ KH&CN, ĐHĐN, mẫu nội bộ Trường…).

### 1.2 Phạm vi V1 (UI + Flow + Mock Data)
- CRUD hồ sơ khoa học (phần nhập tay).
- Hiển thị **phần auto-linked**: Đề tài đã tham gia, Công bố khoa học (đã duyệt/đã xác nhận).
- Workflow xác thực (optional) + log.
- Search/Filter danh sách hồ sơ.
- Export CV (V1: export PDF/Word “mock” – download file mẫu + fill dữ liệu giả lập / hoặc generate PDF đơn giản).
- Tích hợp Notification (chuông header) khi có cập nhật/duyệt/xác thực.

---

## 2. Roles & Quyền

| Role | Quyền chính |
|------|-------------|
| `NCV` (Giảng viên/NCV) | Tạo/Cập nhật hồ sơ của mình, xuất CV, xác nhận công bố gợi ý |
| `PHONG_KH` | Tra cứu toàn trường, xem chi tiết, yêu cầu bổ sung, xác thực thông tin quan trọng, xuất CV |
| `HOI_DONG` | Xem hồ sơ (read-only) khi chấm ý tưởng/đề tài |
| `LANH_DAO` | Xem hồ sơ (read-only), xuất CV |
| `ADMIN` | Toàn quyền |

### 2.1 Access keys (đề xuất)
- `profile.view.self`
- `profile.edit.self`
- `profile.view.all` (PHONG_KH, ADMIN)
- `profile.verify` (PHONG_KH, ADMIN)
- `profile.export` (NCV, PHONG_KH, ADMIN)
- `profile.manage.sources` (ADMIN) – cấu hình tích hợp Google Scholar/SCV

---

## 3. Quy trình nghiệp vụ (Workflow)

### 3.1 Giảng viên tự cập nhật
1) NCV đăng nhập → mở **Hồ sơ khoa học**  
2) Cập nhật các mục nhập tay: cá nhân/đào tạo/công tác/ngoại ngữ/hướng nghiên cứu…  
3) Bấm **Lưu nháp** hoặc **Gửi cập nhật** (đánh dấu hồ sơ “Đã cập nhật”)

### 3.2 Liên kết dữ liệu động (auto-linked)
- **Đề tài đã tham gia**: tự cập nhật từ module Đề tài khi đề tài được duyệt.
- **Công bố khoa học**: cập nhật từ:
  - Module Công bố nội bộ (đã duyệt)
  - Google Scholar (sync)
  - SCV ĐHĐN (sync)
- Với dữ liệu từ nguồn ngoài (Google Scholar/SCV):
  - Hệ thống tạo **gợi ý công bố** (suggestions)
  - NCV chọn: **Xác nhận** (attach) hoặc **Từ chối** (ignore)

### 3.3 Xác thực (tùy chọn) – Phòng KH
- Phòng KH có thể:
  - **Xác thực** các thông tin quan trọng (học vị/học hàm/bằng cấp/công trình chủ lực)
  - **Yêu cầu bổ sung** (kèm lý do)
- Sau xác thực:
  - Hồ sơ có badge “Đã xác thực”
  - Tạo notification cho NCV

### 3.4 Tra cứu & Xuất file
- Phòng KH/Hội đồng/Lãnh đạo tra cứu hồ sơ theo:
  - Tên, đơn vị, học vị, chuyên ngành, hướng nghiên cứu, từ khóa
- NCV/Phòng KH xuất CV theo mẫu:
  - Bộ KH&CN
  - ĐHĐN
  - Nội bộ Trường

---

## 4. Dữ liệu & Model (Mock-friendly)

### 4.1 Profile status
```ts
type ProfileStatus =
  | 'DRAFT'              // NCV đang nhập
  | 'UPDATED'            // NCV đã gửi cập nhật
  | 'VERIFIED'           // Phòng KH xác thực
  | 'NEED_MORE_INFO'     // Yêu cầu bổ sung
;
```

### 4.2 ScientificProfile (core)
```ts
interface ScientificProfile {
  id: string;
  userId: string;

  // 1) Thông tin cá nhân
  fullName: string;
  dateOfBirth?: string;
  gender?: 'Nam' | 'Nữ' | 'Khác';
  workEmail: string;
  phone?: string;

  orcid?: string;
  googleScholarUrl?: string;
  scopusId?: string;
  researchGateUrl?: string;
  personalWebsite?: string;

  avatarUrl?: string;
  bio?: string; // 1-2 đoạn ngắn

  // 2) Công tác
  organization: string;     // Trường
  faculty?: string;         // Khoa/Phòng
  department?: string;      // Bộ môn
  currentTitle?: string;    // Chức danh (GV/NCV…)
  managementRole?: string;  // Trưởng bộ môn/… (optional)
  startWorkingAt?: string;

  // 3) Học hàm/học vị
  degree?: 'Cử nhân' | 'Thạc sĩ' | 'Tiến sĩ' | 'Khác';
  academicTitle?: 'PGS' | 'GS' | 'Không';
  degreeYear?: number;
  degreeInstitution?: string;
  degreeCountry?: string;

  // 4) Hướng nghiên cứu
  mainResearchArea?: string;
  subResearchAreas?: string[];
  keywords?: string[];

  // 5) Ngoại ngữ
  languages?: ProfileLanguage[];

  // 10) Tệp đính kèm
  attachments?: ProfileAttachment[];

  // meta
  status: ProfileStatus;
  completeness: number; // 0-100 (auto-calc)
  verifiedAt?: string;
  verifiedBy?: string;

  createdAt: string;
  updatedAt: string;
}
```

### 4.3 Languages
```ts
interface ProfileLanguage {
  id: string;
  language: string;          // English, Japanese...
  level?: string;            // B1/C1/IELTS 7.0...
  certificate?: string;      // IELTS/TOEIC...
  certificateUrl?: string;   // file link
}
```

### 4.4 Attachments
```ts
interface ProfileAttachment {
  id: string;
  type: 'CV_PDF' | 'DEGREE' | 'CERTIFICATE' | 'OTHER';
  name: string;
  url: string;
  uploadedAt: string;
}
```

### 4.5 Auto-linked: Projects (read-only)
> Lấy từ module Đề tài (không cho sửa trong Hồ sơ)
```ts
interface LinkedProject {
  id: string;
  code: string;
  title: string;
  level: string;            // Cấp Trường/Cấp Bộ/...
  role: 'CHU_NHIEM' | 'THAM_GIA';
  startDate?: string;
  endDate?: string;
  status: 'DANG_THUC_HIEN' | 'DA_NGHIEM_THU' | 'TAM_DUNG';
  decisionNo?: string;
}
```

### 4.6 Auto-linked: Publications (internal approved + external confirmed)
```ts
type PublicationSource = 'INTERNAL' | 'GOOGLE_SCHOLAR' | 'SCV_DHDN';

interface PublicationItem {
  id: string;
  title: string;
  year?: number;
  venue?: string;      // journal/conf
  authors?: string;
  doi?: string;
  url?: string;

  source: PublicationSource;
  sourceId?: string;   // id từ nguồn ngoài
  verifiedByNcv: boolean; // external: true nếu NCV confirm attach
  approvedInternal?: boolean; // internal module
}
```

### 4.7 Publication Suggestions (external)
```ts
interface PublicationSuggestion {
  id: string;
  profileId: string;
  source: PublicationSource; // GOOGLE_SCHOLAR/SCV
  title: string;
  year?: number;
  url?: string;

  status: 'PENDING' | 'CONFIRMED' | 'IGNORED';
  createdAt: string;
  updatedAt: string;
}
```

### 4.8 Verify Log
```ts
interface ProfileVerifyLog {
  id: string;
  profileId: string;
  action: 'VERIFY' | 'REQUEST_MORE_INFO' | 'CANCEL_VERIFY';
  note?: string;
  actorRole: 'PHONG_KH' | 'ADMIN';
  actorName: string;
  createdAt: string;
}
```

---

## 5. UI/UX – VIP PRO (Ant Design Pro)

## 5.1 Entry points
### Menu trái (role-based)
- NCV: `Hồ sơ khoa học` (my profile)
- PHONG_KH/ADMIN: `Hồ sơ khoa học` (list) + `Hồ sơ khoa học của tôi` (optional)

### Routes đề xuất
- `/profile/me` – Hồ sơ của tôi (NCV)
- `/profiles` – Danh sách hồ sơ (PHONG_KH, ADMIN)
- `/profiles/:id` – Xem chi tiết hồ sơ (PHONG_KH, HOI_DONG, LANH_DAO, ADMIN)
- `/profiles/:id/verify` – Xác thực (PHONG_KH, ADMIN) (có thể gộp trong detail)

---

## 5.2 Trang `/profile/me` – Hồ sơ của tôi (NCV)
### Layout: 2 cột (không rối)
- **Cột trái (70%)**: Tabs nội dung
- **Cột phải (30%)**: Summary sticky (progress + trạng thái + actions)

#### 5.2.1 Header compact (1-2 dòng)
- Avatar + Họ tên (bold)
- Đơn vị · Khoa · Bộ môn
- Badge status: Nháp / Đã cập nhật / Đã xác thực / Yêu cầu bổ sung

#### 5.2.2 Tabs (nội dung)
Tab A) **Thông tin chung**
- Thông tin cá nhân, liên hệ, liên kết học thuật (ORCID/Scholar/Scopus)
- UI: `ProFormText`, `ProFormDatePicker`, `ProFormSelect`, `ProFormTextArea (rows=2)`

Tab B) **Đào tạo & Công tác**
- Học vị/học hàm + quá trình đào tạo (V1 có thể 1 record)
- Thông tin công tác hiện tại
- UI: Card nhỏ, gọn

Tab C) **Ngoại ngữ**
- Table editable (add/remove)
- Columns: Ngôn ngữ / Trình độ / Chứng chỉ / Link file
- UI: `EditableProTable`

Tab D) **Hướng nghiên cứu**
- Lĩnh vực chính (Select)
- Lĩnh vực phụ (TagSelect)
- Từ khóa (Tags input)

Tab E) **Công bố khoa học (Tự động)**
- 2 section:
  1) “Đã gắn vào hồ sơ” (approved/confirmed)
  2) “Gợi ý từ Google Scholar/SCV” (PENDING)
- Action:
  - Confirm / Ignore
- UI: `ProList` hoặc `ProTable` compact, có filter theo năm/nguồn

Tab F) **Đề tài đã tham gia (Tự động)**
- Table read-only: code, title, level, role, time, status
- Link sang module Đề tài

Tab G) **Tệp đính kèm**
- Upload CV PDF, bằng cấp, chứng chỉ
- V1 mock: upload giả lập (link) hoặc attach URL

Tab H) **Xuất CV**
- Chọn mẫu: Bộ KH&CN / ĐHĐN / Nội bộ
- Chọn định dạng: PDF / DOCX
- Nút: `Xuất CV`
- V1 mock: generate file mẫu + fill dữ liệu cơ bản hoặc download placeholder

#### 5.2.3 Summary sticky (cột phải)
- **Progress hoàn thiện hồ sơ** (0–100%)
  - `Progress` + checklist thiếu mục
- Trạng thái xác thực
- Các nút:
  - `Lưu nháp`
  - `Gửi cập nhật` (đổi status UPDATED)
  - `Đồng bộ từ Scholar/SCV` (mock button tạo suggestions)
- Nếu status `NEED_MORE_INFO`: hiển thị box lý do + CTA “Cập nhật lại”

✅ Mục tiêu: không cần scroll nhiều, mọi action quan trọng nằm bên phải.

---

## 5.3 Trang `/profiles` – Danh sách hồ sơ (PHONG_KH, ADMIN)
- `ProTable<ScientificProfile>`
- Search:
  - Tên
  - Đơn vị/Khoa
  - Học vị
  - Hướng nghiên cứu (keyword)
  - Trạng thái (status)
- Columns:
  - Họ tên + avatar
  - Khoa/Bộ môn
  - Học vị
  - Hướng nghiên cứu chính
  - Status badge
  - Completeness %
  - UpdatedAt
- Actions:
  - `Xem`
  - `Yêu cầu bổ sung`
  - `Xác thực` (nếu có quyền)

---

## 5.4 Trang `/profiles/:id` – Xem chi tiết hồ sơ
- Read-only view (giống `/profile/me` nhưng không có edit)
- Có tab “Log xác thực”
- Nếu user = PHONG_KH:
  - nút `Xác thực`
  - nút `Yêu cầu bổ sung`

---

## 5.5 Xác thực hồ sơ (PHONG_KH)
### UI gợi ý
- Drawer “Xác thực”
- Checklist các mục cần xác thực:
  - Học vị/học hàm
  - Bằng cấp (file)
  - Công bố chủ lực (optional)
- Input note
- Actions:
  - `Xác thực` → status VERIFIED
  - `Yêu cầu bổ sung` → status NEED_MORE_INFO (note bắt buộc)

---

## 6. Quy tắc nghiệp vụ (Business Rules)

### 6.1 Phân tách dữ liệu nhập tay vs auto-linked
- NCV chỉ edit các phần:
  - Personal/Work/Degree/Languages/Research/Attachments
- Auto-linked:
  - Projects (đề tài)
  - Publications (internal approved + external confirmed)
- External publications:
  - chỉ attach vào hồ sơ khi NCV confirm

### 6.2 Completeness score (0–100) – không phải ranking
- Auto-calc theo checklist mục tối thiểu:
  - Có email + đơn vị (bắt buộc)
  - Có học vị
  - Có hướng nghiên cứu
  - Có tối thiểu 1 ngoại ngữ hoặc bỏ qua (tùy chính sách)
  - Có tối thiểu 1 công bố hoặc 1 đề tài (tùy)
- Dùng để nhắc NCV bổ sung, không xếp hạng.

### 6.3 Audit log
- Lưu thay đổi profile (V1 mock lưu log đơn giản)
- Lưu verify logs.

---

## 7. Notification (chuông header) – bắt buộc có trong flow

### 7.1 Các event tạo thông báo
- NCV bấm “Gửi cập nhật”:
  - PHONG_KH nhận: “Hồ sơ khoa học của {Tên} đã gửi cập nhật.”
- PHONG_KH xác thực:
  - NCV nhận: “Hồ sơ khoa học của bạn đã được xác thực.”
- PHONG_KH yêu cầu bổ sung:
  - NCV nhận: “Hồ sơ khoa học cần bổ sung: {lý do}.”
- Đồng bộ Scholar/SCV tạo suggestions:
  - NCV nhận: “Có {n} công bố gợi ý mới từ Google Scholar/SCV.”

---

## 8. Mock Services (frontend-only, localStorage)

### 8.1 Files đề xuất
- `src/services/profile.ts`
- `src/services/publicationSync.ts`
- `src/services/notification.ts`

### 8.2 API mock (đề xuất)
```ts
// profile
queryMyProfile()
updateMyProfile(payload)
submitProfileUpdate()            // status -> UPDATED

// admin/phongkh
queryProfiles(params)
getProfileById(id)
requestMoreInfo(profileId, note) // status -> NEED_MORE_INFO
verifyProfile(profileId, note)   // status -> VERIFIED

// publications sync (mock)
syncFromGoogleScholar(profileId) // create suggestions
syncFromSCV(profileId)           // create suggestions
confirmSuggestion(id)
ignoreSuggestion(id)

// notifications
queryNotifications(userId)
markRead(id)
markAllRead()
pushNotification(payload)
```

---

## 9. Acceptance Criteria (Đạt “VIP PRO”)

1) UI `/profile/me` có layout 2 cột + summary sticky, nhìn “enterprise”.
2) Tabs rõ ràng, không rối, nhập nhanh.
3) Auto-linked Projects/Publications hiển thị read-only, có filter.
4) Suggestions công bố có Confirm/Ignore.
5) PHONG_KH có list + verify/request more info.
6) Export CV có flow chọn mẫu + định dạng (V1 mock được).
7) Notification bắn đúng theo event.
8) Dữ liệu mock lưu localStorage, refresh không mất.

---

## 10. Prompt cho Cursor AI (copy/paste)

**Prompt:**
> Implement module “Hồ sơ khoa học” theo file `specs/scientific-profile.md`.  
> Tech: Umi Max + Ant Design Pro, frontend-only, mock data lưu localStorage.  
> Pages: `/profile/me`, `/profiles`, `/profiles/:id`.  
> UI yêu cầu VIP PRO: 2-column layout với summary sticky, tabs gọn, ProTable/ProForm/EditableProTable.  
> Auto-linked: Projects/Publications read-only + publication suggestions confirm/ignore.  
> Add notifications (bell header) events: submit update, verify, request more info, sync suggestions.  
> Export CV V1: mock download placeholder file nhưng giữ UI flow đúng.

