Bạn là senior frontend engineer Ant Design Pro (Umi + React + TS + ProComponents).

Bối cảnh:
Trang src/pages/profile/me/index.tsx hiện layout 3 cột:
- Cột 1: Sider menu (Ant Design Pro layout) — GIỮ NGUYÊN
- Cột 2: Main content (tabs + section)
- Cột 3: Sidebar phải (Hoàn thiện hồ sơ, Trạng thái, nút Lưu nháp...) — SẼ BỎ

Mục tiêu:
1) Chuyển layout từ 3 cột -> 2 cột bằng cách:
   - XÓA sidebar phải
   - Main content (tabs + lists) chiếm toàn bộ phần còn lại (full width trong vùng content)
2) “Hoàn thiện hồ sơ” không mất, mà chuyển thành 1 dải ngang (horizontal) nằm trên Tabs (hoặc ngay dưới header profile card).
3) Trong tab “Công bố khoa học & Bài báo”:
   - Đổi nút hiện tại thành “Thêm thủ công”
   - Thêm nút cạnh bên: “Thêm từ Semantic Scholar”
   - Dành chiều rộng cho Tabs bằng cách giảm padding/margin và tránh chia cột trong content

==================================================
A) REFACTOR LAYOUT (2 CỘT)
==================================================

Trong src/pages/profile/me/index.tsx:

- Tìm chỗ đang dùng <Row> với 2 <Col> chính:
  Col content (vd span=16/17/18)
  Col sidebar phải (vd span=8/7/6)

- XÓA hoàn toàn Col sidebar phải
- Set Col content span=24 (hoặc flex:1) để full width.

Nếu đang dùng ProCard split="vertical/horizontal":
- bỏ split, dùng ProCard direction="column" hoặc chỉ render 1 ProCard cho content.

==================================================
B) TẠO DẢI NGANG “HOÀN THIỆN HỒ SƠ”
==================================================

Tạo component mới (hoặc inline):

src/components/ProfileCompletionBar/index.tsx

Yêu cầu UI:
- đặt trong main content phía trên Tabs
- layout ngang:
  - trái: Progress (80%) dạng Progress Circle nhỏ hoặc Progress Line
  - phải: danh sách checklist dạng Tag/Badge (wrap) cùng hàng
- click vào từng item checklist -> chuyển tab tương ứng + scroll tới section:
  - “Công bố/Đề tài” => focus tab “Công bố khoa học & Bài báo”
  - “Ngoại ngữ” => tab Ngoại ngữ
  - “Hướng nghiên cứu” => tab Hướng nghiên cứu
... (tuỳ tab id)

==================================================
C) TAB “CÔNG BỐ KHOA HỌC & BÀI BÁO” — NÚT THÊM
==================================================

Trong block header “Công bố khoa học (x)”:

- Thay nút "+ Thêm công bố" thành 2 nút:

1) Primary button: "Thêm thủ công"
2) Default button: "Thêm từ Semantic Scholar"

- Responsive:
  - Desktop: 2 nút cùng hàng, gap 8px
  - Mobile: wrap xuống dòng

==================================================
D) MODAL “THÊM TỪ SEMANTIC SCHOLAR”
==================================================

Tạo modal component:

src/components/SemanticScholarImportModal/index.tsx

Form fields:
- DOI (optional)
- ORCID (optional)
- Họ và tên tác giả (optional)
- Năm (optional)
Validation: yêu cầu ít nhất 1 trong (DOI / ORCID / Author name)

Submit:
POST /api/integrations/semantic-scholar/import
body: { doi?, orcid?, authorName?, year? }

Nếu backend chưa có endpoint:
- show message "Chưa cấu hình chức năng import" và không crash UI.

Success:
- refresh list publications trong tab

==================================================
E) DÀNH CHIỀU RỘNG CHO TABS
==================================================

- đảm bảo Tabs container full width
- giảm padding content (nếu đang có padding lớn 24 -> có thể xuống 16)
- tránh đặt filter/toolbar thành 2 cột không cần thiết

==================================================
OUTPUT
==================================================

Trả về:
- danh sách file sửa/tạo
- code cập nhật src/pages/profile/me/index.tsx
- code ProfileCompletionBar
- code SemanticScholarImportModal
- service semantic scholar:
  src/services/semanticScholar.ts
- không thay đổi Sider menu, chỉ bỏ sidebar phải và tối ưu content