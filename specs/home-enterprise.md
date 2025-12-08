# HOME ENTERPRISE PRO MAX SPEC – Umi Max + Ant Design Pro

## 1. Mục tiêu tổng thể
Trang Home phải đạt tiêu chuẩn **enterprise dashboard**:

- Giao diện trực quan, mạnh mẽ, sang trọng.
- 3 Home khác nhau theo role.
- Có animation nhẹ, modern UI.
- Dùng mock API hoàn toàn (không backend).
- Các layout block có thể tái sử dụng.
- Responsive tốt cho laptop / tablet / mobile.
- Style thống nhất toàn hệ thống.

---

## 2. Thành phần UI nâng cấp (áp dụng cho tất cả các Home)

### 2.1 Summary KPI (KPI Cards)
**Quy tắc:**

- Dùng `StatisticCard` hoặc `ProCard` custom.
- Mỗi KPI có:
  - Icon lớn 32–40px
  - Value rõ ràng (38px)
  - Trend: +X% hoặc -X% so kỳ trước
  - Background màu nhẹ (token colorFillQuaternary)
- Animation:
  - Counter animation (số tăng dần 0 → value)
  - Hover effect: scale nhẹ 1.02
- Spacing: `padding: 20`
- Góc bo: `borderRadius: 12`

### 2.2 Loading State
- Dùng `Skeleton` cho header và KPI.
- Khi load mock API → fade animation.

### 2.3 Task List nâng cao
Mỗi task:

- Icon riêng theo loại công việc
- Deadline màu:
  - Quá hạn → đỏ (#ff4d4f)
  - Hôm nay → vàng (#faad14)
  - Bình thường → xanh
- Có badge ưu tiên: `High`, `Medium`, `Low`
- Hover → highlight card

### 2.4 Notification nâng cao
- Unread → background màu nhẹ (#f6ffed)
- Có type: Success / Warning / Error / Info
- Có priority icon:
  - 🔥 Khẩn
  - ⚠ Thường
- Thời gian hiển thị dạng relative: "3 giờ trước", "hôm qua"

### 2.5 Tabs nội bộ Home
- Tab “Đề tài của tôi”  
- Tab “Ý tưởng của tôi”
- Dùng `ProTable`
- Có phân trang, search, filter

---

## 3. HomeForCNDT (Giảng viên / Chủ nhiệm đề tài)

### 3.1 Layout tổng thể


### 3.2 Quick Actions (NÊN CÓ)
- Nộp ý tưởng mới
- Tạo đề xuất đề tài mới
- Upload minh chứng nghiệm thu

Dùng `FloatButton.Group` hoặc 3 button ngay dưới header.

---

## 4. HomeForPhongKH (Phòng Khoa học)

### 4.1 KPI (4 block)
- Đề xuất mới chờ xử lý
- Ý tưởng mới chờ sơ loại
- Đề tài đang quản lý
- Đợt đăng ký đang mở

### 4.2 Workflow Panel (PANEL QUAN TRỌNG)
- Sơ loại ý tưởng
- Phân hội đồng 2A
- Chấm điểm 2B
- Theo dõi đề tài GĐ3
- Nghiệm thu GĐ4

**UI:**  
Dạng `Steps` mở rộng hoặc `Timeline` tùy Cursor.

### 4.3 Các bảng nghiệp vụ
- Top đề xuất mới
- Top ý tưởng chất lượng cao
- Đề tài chậm tiến độ
- Công việc cần duyệt trong tuần

---

## 5. HomeForLanhDao (Lãnh đạo)

### 5.1 KPI
- Tổng số đề tài trong năm
- Kinh phí giải ngân
- Tỷ lệ nghiệm thu
- Tỷ lệ ý tưởng chuyển thành đề tài

### 5.2 Biểu đồ
- Cột: đề tài theo năm
- Donut: tỷ lệ đề tài theo cấp (Trường / Bộ / Nhà nước)
- Line: tăng trưởng số lượng đề tài 5 năm

### 5.3 Danh sách nhanh
- 10 đề tài trọng điểm
- 10 chủ nhiệm hoạt động mạnh

### 5.4 Card cảnh báo
- Các đề tài rủi ro (chậm tiến độ)
- Chu kỳ nghiên cứu có dấu hiệu giảm

---

## 6. Mock API Spec

Tạo file:


Các API:

```ts
export async function getSummary(role: string) {}
export async function getTasks(role: string) {}
export async function getNotifications(role: string) {}
export async function getMyProjects(role: string) {}
export async function getMyIdeas(role: string) {}
export async function getCharts(role: string) {}
