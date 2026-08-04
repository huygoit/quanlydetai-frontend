# SPEC — Thông báo tuyển chọn đề tài KH&CN

| Trường | Nội dung |
|---|---|
| **Nguồn nghiệp vụ** | `C:\quanlydetai\tailieu\module-3-4\user_story_thong_bao_tuyen_chon_de_tai.md` |
| **Module FE** | Thông báo tuyển chọn (menu Đề tài / Báo cáo — quyết định vị trí khi implement) |
| **API prefix** | `/api/call-for-proposals` (CFP) |
| **Phiên bản** | MVP Pha 1 |
| **Ngày** | 2026-07-14 |

---

## 1. Mục tiêu

Số hóa luồng: **PKH soạn → BGH duyệt → HC xác nhận phát hành (thủ công)** → hệ thống tạo **kỳ tiếp nhận** 1–1 với thông báo, gửi email theo danh sách `staffs`, đăng tin + đếm ngược deadline. GV chỉ nộp đề xuất khi kỳ đang `OPEN`.

Thay quy trình Word + email rời (~2,5 ngày) bằng workflow có audit trail trên hệ thống.

---

## 2. Phạm vi MVP (Pha 1) / Ngoài phạm vi

### Trong MVP

| # | Nội dung |
|---|---|
| 1 | CRUD thông báo + lưu nháp |
| 2 | Workflow trạng thái: PKH ↔ BGH ↔ HC |
| 3 | HC **phát hành thủ công** (nhập số VB, ngày phát hành, file PDF ký — không tích hợp VBĐT) |
| 4 | Tạo kỳ tiếp nhận 1–1 khi phát hành; **gia hạn** / **đóng sớm** |
| 5 | Email broadcast theo `staffs.email` sau phát hành (queue / gửi nền, SLA ≤ 5 phút — cố gắng) |
| 6 | Trang tin / danh sách công khai cho user đã login: nội dung + countdown deadline |
| 7 | Audit lịch sử trình duyệt / chỉnh sửa / phát hành / gia hạn / đóng |
| 8 | Seed permission `cfp.*` + gán sẵn vài role chuẩn; Super Admin chỉnh tiếp trên UI |
| 9 | Khóa nộp đề xuất (`project_proposals`) khi không có kỳ OPEN khớp cấp đề tài (nếu đã gắn level) |

### Ngoài MVP (Pha 2+)

- Tích hợp API VBĐT / ký số thật
- Cron nhắc HC mỗi ngày (A2) — MVP: email một lần khi BGH duyệt + nút “Gửi nhắc lại”
- Trang tin công khai không cần login
- Template Word xuất thông báo
- Đồng bộ tự động toàn bộ đơn vị VBĐT

---

## 3. Actor & quyền (IAM)

Hệ thống **permission-driven**. **Không bắt buộc tạo role mới** trừ khi chưa có role phù hợp cho HC.

### 3.1. Permission mới (module `cfp`)

| code | Tên hiển thị (VI) | Ai dùng |
|---|---|---|
| `cfp.view` | Xem thông báo tuyển chọn | Tất cả user login (ít nhất xem bản đã phát hành); PKH/BGH/HC xem theo quyền |
| `cfp.create` | Tạo thông báo | PKH |
| `cfp.update` | Sửa thông báo (nháp / bị trả về) | PKH |
| `cfp.submit` | Trình BGH duyệt | PKH |
| `cfp.approve` | Duyệt / yêu cầu chỉnh sửa | BGH |
| `cfp.publish` | Xác nhận phát hành (sau ký VBĐT thủ công) | HC |
| `cfp.extend` | Gia hạn deadline kỳ | PKH (hoặc BGH — mặc định PKH) |
| `cfp.close` | Đóng sớm kỳ | PKH |

Xem danh sách tin đã phát hành: mọi user có `cfp.view` (hoặc login + cờ public_published — mặc định cần `cfp.view`).

### 3.2. Gợi ý gán role sẵn (seeder)

| Role hiện có (gợi ý) | Quyền gán |
|---|---|
| `RESEARCH_OFFICE` / `QUANLY_KH_CNTT_HTQT` | view, create, update, submit, extend, close |
| Role lãnh đạo (nếu có) hoặc gán tay cho BGH | view, approve |
| Role HC / tạo `HC_OFFICE` nếu chưa có | view, publish |
| `SUPER_ADMIN` | `*` (đã có) |
| `BASIC` | **không** gán create/approve/publish; chỉ `cfp.view` nếu muốn xem tin đã phát hành |

> “Phân quyền tự động” = seeder gắn sẵn; sau đó chỉnh trên UI Phân quyền như module khác.

### 3.3. Ánh xạ actor US → hệ thống

| Actor US | Hành động |
|---|---|
| PKH | create / update / submit / extend / close |
| BGH | approve / return (yêu cầu chỉnh sửa) |
| HC | publish (manual) |

---

## 4. Trạng thái & workflow

### 4.1. Trạng thái thông báo (`call_for_proposals.status`)

```
DRAFT ──submit──► PENDING_BGH ──approve──► APPROVED ──publish──► PUBLISHED
                      │                         │
                      │◄──return── PKH sửa ──────┘ (APPROVED chỉ khi chưa publish)
                      │            về DRAFT hoặc RETURNED
                      │
                      └── return ──► RETURNED ──PKH sửa / submit lại──► PENDING_BGH
```

| status | Ý nghĩa | Ai sửa nội dung |
|---|---|---|
| `DRAFT` | Nháp | PKH |
| `PENDING_BGH` | Chờ BGH | Chỉ BGH đọc; PKH không sửa (trừ rút lại — optional MVP bỏ) |
| `RETURNED` | BGH yêu cầu chỉnh sửa | PKH |
| `APPROVED` | BGH đã duyệt, chờ HC | PKH không sửa nội dung; HC publish |
| `PUBLISHED` | Đã phát hành | Không sửa nội dung; chỉ extend/close kỳ |

### 4.2. Trạng thái kỳ (`submission_periods.status`)

| status | Ý nghĩa |
|---|---|
| `OPEN` | Cho phép nộp đề xuất (trong hạn hoặc đã gia hạn) |
| `CLOSED` | Đóng sớm hoặc quá hạn (job đóng quá hạn — Pha 2; MVP: đóng sớm tay **hoặc** check realtime `now > deadline`) |

**Quy tắc realtime (MVP):** kỳ coi là mở nếu `status = OPEN` **và** `now <= deadline_at`. Quá hạn → coi như đóng (không cần cron).

### 4.3. Quan hệ 1–1

- Mỗi `call_for_proposals` **PUBLISHED** có đúng **1** `submission_periods`.
- Đợt tuyển mới = tạo thông báo mới (không tái mở thông báo cũ đã đóng ngoài gia hạn).

---

## 5. Mô hình dữ liệu

### 5.1. `call_for_proposals` (thông báo)

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | bigserial PK | |
| `title` | string | Tiêu đề (*) |
| `period_kind` | enum `ACADEMIC` \| `FINANCIAL` | Năm học (01/08–31/07) hoặc Năm TC (01/04–31/03) (*) |
| `period_label` | string | VD `2026-2027` hoặc `2026` (*) |
| `deadline_at` | timestamptz | Thời hạn nộp hồ sơ (*) — AC1: ≥ today + 10 ngày lúc tạo/submit |
| `levels` | jsonb | Mảng `ProjectProposalLevel`: `CO_SO` \| `TRUONG` \| `BO` \| `NHA_NUOC` (*) — chọn ≥ 1 |
| `content_html` | text | Nội dung hướng dẫn rich text |
| `attachment_urls` | jsonb | File biểu mẫu (mảng URL) |
| `status` | string | Xem §4.1 |
| `created_by` | FK users | PKH tạo |
| `submitted_at` | timestamptz null | |
| `approved_by` | FK users null | BGH |
| `approved_at` | timestamptz null | |
| `return_reason` | text null | Lý do BGH trả về |
| `published_by` | FK users null | HC |
| `published_at` | timestamptz null | |
| `official_doc_no` | string null | Số văn bản (HC nhập khi publish) |
| `official_doc_date` | date null | Ngày phát hành VB |
| `signed_file_url` | string null | PDF đã ký (optional) |
| `created_at` / `updated_at` | | |

### 5.2. `submission_periods` (kỳ tiếp nhận)

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | bigserial PK | |
| `call_for_proposal_id` | FK unique | 1–1 |
| `deadline_at` | timestamptz | Ban đầu copy từ thông báo; đổi khi gia hạn |
| `status` | `OPEN` \| `CLOSED` | |
| `closed_at` | timestamptz null | Đóng sớm |
| `closed_by` | FK users null | |
| `created_at` / `updated_at` | | |

### 5.3. `call_for_proposal_audits` (AC5)

| Cột | Kiểu | Mô tả |
|---|---|---|
| `id` | bigserial PK | |
| `call_for_proposal_id` | FK | |
| `actor_user_id` | FK users | |
| `action` | string | `CREATE` \| `UPDATE` \| `SUBMIT` \| `APPROVE` \| `RETURN` \| `PUBLISH` \| `EXTEND` \| `CLOSE` |
| `note` | text null | Lý do trả / ghi chú gia hạn |
| `diff_json` | jsonb null | Snapshot thay đổi (field cũ → mới), không bắt buộc mọi action |
| `created_at` | | |

### 5.4. (Optional MVP) `cfp_email_jobs`

Theo dõi gửi email: `cfp_id`, `status` (`PENDING`/`RUNNING`/`DONE`/`FAILED`), `total`, `sent`, `error`, timestamps. Dùng để AC2 và retry.

---

## 6. API đề xuất

Base: `/api/call-for-proposals` — auth Bearer. Mỗi route ghi permission.

### 6.1. Danh sách / chi tiết (nội bộ)

| Method | Path | Permission | Mô tả |
|---|---|---|---|
| GET | `/` | `cfp.view` | Lọc `status`, `period_label`, keyword |
| GET | `/:id` | `cfp.view` | Chi tiết + kỳ (nếu có) + audits ngắn |
| GET | `/:id/audits` | `cfp.view` | Full audit |

User chỉ có `cfp.view` (BASIC): chỉ thấy `status = PUBLISHED`.

### 6.2. PKH

| Method | Path | Permission | Mô tả |
|---|---|---|---|
| POST | `/` | `cfp.create` | Tạo nháp (`DRAFT`) |
| PUT | `/:id` | `cfp.update` | Sửa khi `DRAFT` hoặc `RETURNED` |
| POST | `/:id/submit` | `cfp.submit` | → `PENDING_BGH`; thông báo nội bộ + email BGH (người có `cfp.approve`) |

### 6.3. BGH

| Method | Path | Permission | Mô tả |
|---|---|---|---|
| POST | `/:id/approve` | `cfp.approve` | `PENDING_BGH` → `APPROVED`; email/notify người có `cfp.publish` |
| POST | `/:id/return` | `cfp.approve` | Body `{ reason }` → `RETURNED`; email PKH (`created_by`) |

### 6.4. HC

| Method | Path | Permission | Mô tả |
|---|---|---|---|
| POST | `/:id/publish` | `cfp.publish` | Body: `officialDocNo`, `officialDocDate`, `signedFileUrl?`. Chỉ khi `APPROVED`. → `PUBLISHED` + tạo `submission_periods` OPEN + enqueue email `staffs` |

### 6.5. Kỳ

| Method | Path | Permission | Mô tả |
|---|---|---|---|
| POST | `/:id/extend` | `cfp.extend` | Body `{ deadlineAt }` — phải > deadline hiện tại; cập nhật kỳ + audit |
| POST | `/:id/close` | `cfp.close` | Đóng sớm kỳ `CLOSED` |

### 6.6. Công khai trong hệ thống (tin tức)

| Method | Path | Permission | Mô tả |
|---|---|---|---|
| GET | `/published` | login + `cfp.view` | Danh sách đã phát hành (title, deadline, countdown fields, levels) |
| GET | `/published/:id` | login + `cfp.view` | Chi tiết tin + `contentHtml`, attachments |

### 6.7. Check nộp đề xuất (dùng module Đề tài)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/call-for-proposals/active-period?level=TRUONG` | Trả kỳ OPEN còn hạn khớp `levels` chứa null nếu không có — FE khóa form đăng ký |

Khi `POST` tạo/submit `project_proposals`: backend **bắt buộc** có kỳ OPEN còn hạn chứa `level` của đề xuất; không thì 422.

---

## 7. Validation (AC1)

| Rule | Chi tiết |
|---|---|
| Bắt buộc | `title`, `periodKind`, `periodLabel`, `deadlineAt`, `levels` (≥ 1) |
| Deadline | Khi **create** và khi **submit**: `deadlineAt` ≥ `startOfDay(today) + 10 days` |
| Gia hạn | `deadlineAt` mới > `deadlineAt` kỳ hiện tại |
| Publish | Chỉ `APPROVED`; bắt buộc `officialDocNo`, `officialDocDate` |
| Return | Bắt buộc `reason` không rỗng |

---

## 8. Email & thông báo nội bộ

| Sự kiện | Kênh | Người nhận |
|---|---|---|
| Submit | In-app + email | User có `cfp.approve` |
| Return | In-app + email | `created_by` |
| Approve | In-app + email | User có `cfp.publish` |
| Publish | Email hàng loạt | `staffs` có `email` không rỗng (AC2) + in-app optional theo `user_id` |
| Extend / Close | In-app (optional MVP) | PKH + BGH đã duyệt |

**Nguồn staff:** bảng `staffs` — dùng `email`, `full_name`, `department_name` / `department_id`. Bỏ qua dòng không email.

**SLA AC2:** sau `publish`, job gửi trong nền; UI hiện “Đang gửi email… / Đã gửi x/y”. Không block HTTP request publish quá lâu.

---

## 9. Màn hình FE

| Màn | Path gợi ý | Ai | Chức năng |
|---|---|---|---|
| Danh sách quản lý | `/projects/call-for-proposals` | PKH/BGH/HC | Filter status; nút theo quyền |
| Form tạo/sửa | `/projects/call-for-proposals/form/:id?` | PKH | Fields § US + rich text + upload |
| Chi tiết + timeline audit | `/projects/call-for-proposals/:id` | PKH/BGH/HC | Action: Trình / Duyệt / Trả về / Phát hành / Gia hạn / Đóng |
| Modal phát hành | — | HC | Số VB, ngày, file ký |
| Modal gia hạn | — | PKH | Ngày mới |
| Tin tức / đã phát hành | `/projects/call-for-proposals/news` hoặc Home widget | User có `cfp.view` | Countdown deadline |
| Đăng ký đề xuất | `/projects/register` | CNDT | Disable + message nếu không có kỳ OPEN |

---

## 10. Acceptance Criteria → Kiểm thử

| AC | Cách verify |
|---|---|
| AC1 | Submit deadline < today+10 → 422; đủ field (*) bắt buộc |
| AC2 | Sau publish, job email chạy; hầu hết `staffs.email` nhận trong ~5 phút (log `cfp_email_jobs`) |
| AC3 | `/published` hiện tin + `deadlineAt`; FE đếm ngược |
| AC4 | Có period OPEN còn hạn → cho nộp; đóng sớm / hết hạn → 422 khi nộp |
| AC5 | Mọi submit/approve/return/publish/extend/close ghi `call_for_proposal_audits` |

**SLA nghiệp vụ** (PKH 1 ngày / BGH 1 ngày / HC 0.5 ngày): theo dõi bằng audit timestamps — không hard-block hệ thống.

---

## 11. Quyết định đã chốt (từ phân tích)

| Hạng mục | Quyết định |
|---|---|
| VBĐT / ký số | **Manual** (HC nhập số VB + ngày + file) |
| Người nhận email | Bảng **`staffs`** |
| Loại đề tài | `project_proposals.level` — **multi-select** |
| Năm | **`period_kind`**: `ACADEMIC` hoặc `FINANCIAL` |
| Thông báo ↔ kỳ | **1–1**; có **gia hạn** + **đóng sớm** |
| IAM | Thêm **permission `cfp.*`**, gán role sẵn; role HC mới chỉ nếu thiếu |
| A2 cron nhắc HC | **Pha 2**; MVP: email khi approve + nút nhắc lại (optional) |

---

## 12. Thứ tự implement đề xuất

1. Migration + model + permission seeder  
2. API workflow DRAFT → … → PUBLISHED + audit  
3. Tạo kỳ + check khi nộp đề xuất  
4. FE màn quản lý + form + chi tiết action  
5. Email job staffs + trang tin / countdown  
6. (Pha 2) Cron nhắc HC, VBĐT thật  

---

## 13. Open points còn lại (không chặn MVP)

1. Vị trí menu chính xác (con của Đề tài vs menu riêng).  
2. Có cho PKH **rút lại** khi đang `PENDING_BGH` không? (MVP: không.)  
3. Một kỳ OPEN cho nhiều thông báo khác `levels` chồng nhau: cho phép; check nộp theo `level ∈ levels` của từng kỳ còn mở.  
4. Rich text editor: dùng sẵn trong dự án (nếu có) hoặc Ant Design đơn giản + HTML sanitize.
