Bạn là senior frontend engineer Ant Design Pro (Umi + React + TS + ProComponents).

Publications không phải page riêng, nằm trong module Profile:
- src/pages/profile/me/index.tsx (tab "Công bố khoa học & Bài báo") editable
- src/pages/profile/detail/index.tsx (section publications) read-only

Mục tiêu:
Bổ sung UI để nhập đủ dữ liệu phục vụ “quy đổi giờ NCKH”.
Không dùng chữ KPI trên UI.

========================
1) SERVICES (theo routes thật)
========================
Tạo src/services/profilePublications.ts:

- listMyPublications(params):
   GET /api/profile/me/publications?rank=&academic_year=&q=

- createMyPublication(payload):
   POST /api/profile/me/publications

- updateMyPublication(id, payload):
   PUT /api/profile/me/publications/:id

- deleteMyPublication(id):
   DELETE /api/profile/me/publications/:id

Authors endpoints (mới):
- getMyPublicationAuthors(pubId):
   GET /api/profile/me/publications/:id/authors

- saveMyPublicationAuthors(pubId, authors):
   PUT /api/profile/me/publications/:id/authors

Preview quy đổi giờ:
- previewPublicationConvertedHours(pubId):
   GET /api/kpis/publications/:id/breakdown
(UI label không dùng KPI)

========================
2) COMPONENTS
========================
Create component:
src/components/AuthorsEditor/index.tsx
- EditableProTable nhập authors structured:
  full_name, profile_id(select gv nội bộ), author_order,
  is_main_author, is_corresponding,
  affiliation_type(UDN_ONLY/MIXED/OUTSIDE),
  is_multi_affiliation_outside_udn
- Validate n/p và show Alert
- Disable Save nếu invalid

Create component:
src/components/ConvertedHoursPreviewModal/index.tsx
- gọi previewPublicationConvertedHours(pubId)
- hiển thị:
  "Giờ chuẩn (B0)", "Hệ số đơn vị (a)", "Tổng giờ quy đổi (B)", "n", "p"
  bảng giờ theo tác giả + warnings

========================
3) UPDATE src/pages/profile/me/index.tsx
========================
Trong tab "Công bố khoa học & Bài báo":
- ProTable list publications
- Drawer/Modal Create & Edit publication

Form fields thêm:
- academic_year (Select YYYY-YYYY required)
- rank (ISI/SCOPUS/DOMESTIC/OTHER)
- quartile (Q1..Q4/NO_Q)

Conditional DOMESTIC/OTHER:
- domestic_rule_type (HDGSNN_SCORE | CONFERENCE_ISBN)
- hdgsnn_score (number, required when HDGSNN_SCORE)

Embed AuthorsEditor trong form.

Save flow:
1) create/update publication
2) save authors via PUT /api/profile/me/publications/:id/authors
3) show success

Row actions:
- Edit
- Delete
- "Xem thử quy đổi giờ" => open ConvertedHoursPreviewModal (uses /api/kpis/publications/:id/breakdown)

========================
4) UPDATE src/pages/profile/detail/index.tsx
========================
- Read-only list publications
- Có thể có nút "Xem thử quy đổi giờ" nếu quyền cho phép
- Không cho chỉnh sửa

========================
OUTPUT
========================
- File list + code đầy đủ components/services + update 2 page
- Không tạo page publication riêng
- Không dùng chữ KPI trên UI