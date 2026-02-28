Bạn là senior frontend engineer Ant Design Pro (Umi + React + TypeScript + ProComponents).

Bối cảnh:
Trang hồ sơ cá nhân: src/pages/profile/me/index.tsx
Header hồ sơ hiện có: avatar + tên + đơn vị + badge (ví dụ “Đã cập nhật”, “Thạc sĩ”).
Hiện “Xuất CV” đang nằm trong menu/tab, không đúng vị trí.

Mục tiêu:
- Đưa action “Xuất CV (PDF)” lên Header Hồ sơ (profile header card), bố trí đẹp VIP PRO.
- Hiện tại chỉ cần 1 loại: PDF.
- UI/UX: rõ ràng, gọn, đúng style Ant Design Pro.

Yêu cầu UI:
1) Nút “Xuất CV (PDF)” đặt ở góc phải của Header card (same row với tên/đơn vị).
2) Nút có icon Download / FilePdf (ant-design icons hoặc @ant-design/icons).
3) Khi bấm:
   - gọi API GET /api/profile/me/cv.pdf (nếu đã có) hoặc endpoint hiện tại của hệ thống
   - tải file PDF về (download)
4) Trong lúc tải:
   - show loading trên button
   - disable button
5) Nếu lỗi:
   - message.error("Không thể xuất CV. Vui lòng thử lại.")
6) Nếu endpoint backend trả về URL (presigned) thay vì stream:
   - hỗ trợ cả 2:
     a) response là blob -> download blob
     b) response là { url } -> window.open(url)

Implementation Details:
- Layout header dùng ProCard / Card + Row/Col hoặc Flex.
- Bên trái: avatar + name + org text
- Bên phải: action group gồm:
  - Button “Xuất CV (PDF)” (primary hoặc default tùy style)
  - (nếu còn badge “Đã cập nhật”, “Thạc sĩ” thì giữ cạnh tên như hiện tại)

Code requirements:
- Tạo service function:
  src/services/profile.ts
    export async function exportMyCvPdf(): Promise<Blob | { url: string }>
- Tạo helper download:
  src/utils/download.ts
    export function downloadBlob(blob, filename)
- Trong page index.tsx, wire button onClick:
  - setLoading(true)
  - call exportMyCvPdf()
  - handle blob or url
  - setLoading(false)

Output:
- Danh sách file chỉnh/sửa
- Code đầy đủ cho:
  - src/pages/profile/me/index.tsx (header section updated)
  - src/services/profile.ts (exportMyCvPdf)
  - src/utils/download.ts (downloadBlob)
- Không sửa phần tabs/publications.
- Không thêm tính năng khác ngoài xuất PDF.