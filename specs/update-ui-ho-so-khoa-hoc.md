Bạn là senior frontend engineer + UI/UX designer. Hãy refactor lại component ProfileHeader hiện tại trong dự án Umi Max + Ant Design Pro + React + TypeScript + Ant Design.

Yêu cầu mới quan trọng:
Phần avatar không chỉ là icon mặc định nữa. Avatar phải là ảnh nhân viên/giảng viên và cho phép upload ảnh mới để thay đổi avatar.

Mục tiêu UI:
Thiết kế lại phần header hồ sơ giảng viên thành một profile card hiện đại, chuyên nghiệp, clean theo phong cách Ant Design Pro enterprise dashboard.

Thông tin hiển thị:
- Tên: Trần Thị Hồng
- Đơn vị: Trường Đại học Sư phạm - Đại học Đà Nẵng · Khoa Lý - Hóa, Trường ĐHSP · Khoa Lý - Hóa, Trường ĐHSP
- Tags:
  - Nháp
  - Địa - GDCD_SP
  - Tiến sỹ
- Thống kê:
  - Số giờ NCKH: 885 giờ
  - Điểm quy đổi: 1.48 điểm
- Action chính:
  - Xuất CV (PDF)
- Avatar:
  - Hiển thị ảnh nhân viên nếu có avatarUrl
  - Nếu chưa có ảnh thì hiển thị icon UserOutlined
  - Cho phép upload ảnh mới để thay đổi avatar

Yêu cầu avatar upload:
1. Avatar dùng component Avatar của Ant Design.
2. Bọc avatar bằng Upload của Ant Design.
3. Khi hover vào avatar, hiện overlay mờ với icon CameraOutlined hoặc EditOutlined và text “Đổi ảnh”.
4. Click avatar để chọn file ảnh.
5. Chỉ cho phép upload file ảnh:
   - image/jpeg
   - image/png
   - image/webp
6. Giới hạn dung lượng file, ví dụ tối đa 2MB hoặc 5MB.
7. Trước khi upload cần validate:
   - Nếu không phải ảnh thì message.error("Chỉ được tải lên file ảnh")
   - Nếu quá dung lượng thì message.error("Ảnh không được vượt quá 2MB")
8. Sau khi chọn ảnh:
   - Preview ảnh ngay trên avatar bằng URL.createObjectURL hoặc FileReader.
   - Gọi callback prop onAvatarChange?: (file: File) => Promise<void> | void để parent xử lý upload API.
9. Khi đang upload:
   - Hiển thị loading overlay hoặc Spin nhỏ trên avatar.
   - Disable upload tạm thời.
10. Nếu upload thất bại:
   - message.error("Cập nhật ảnh đại diện thất bại")
   - Có thể rollback về avatar cũ nếu cần.
11. Không auto upload bằng action URL cứng. Dùng customRequest hoặc beforeUpload return false để parent tự xử lý.
12. Component phải tái sử dụng được, không phụ thuộc API cụ thể.

Yêu cầu thiết kế tổng thể:
1. Làm lại layout thành card lớn, bo góc mềm, shadow nhẹ, background trắng hoặc gradient rất nhẹ.
2. Avatar khoảng 80px - 96px, không quá lớn.
3. Thông tin chính đặt bên phải avatar:
   - Tên font-size khoảng 22px - 26px, font-weight 600/700.
   - Dòng đơn vị màu secondary, dễ đọc.
   - Tags đặt bên dưới đơn vị.
4. Thống kê NCKH chuyển thành 2 metric cards nhỏ, không dùng block xanh lớn bên trái nữa.
5. Button “Xuất CV (PDF)” đặt góc phải trên, dùng Button type="primary", icon FilePdfOutlined hoặc DownloadOutlined.
6. Responsive:
   - Desktop: avatar + info bên trái, button bên phải.
   - Mobile: xếp dọc, button full width, metrics thành 1 cột hoặc 2 cột tùy màn hình.
7. Dùng Ant Design components:
   - Card
   - Avatar
   - Upload
   - Space
   - Typography
   - Tag
   - Button
   - Spin
   - message
   - Row/Col hoặc Flex
8. Dùng CSS Module hoặc Less module theo convention của Umi Max / Ant Design Pro.
9. Dùng Ant Design theme token:
   - token.colorPrimary
   - token.colorText
   - token.colorTextSecondary
   - token.colorBorderSecondary
   - token.colorBgContainer
   - token.colorFillAlter
   - token.boxShadowSecondary
10. Không dùng màu gắt, không hard-code quá nhiều màu.

Interface props đề xuất:

interface ProfileHeaderProps {
  name: string;
  organization: string;
  avatarUrl?: string;
  status?: string;
  majorCode?: string;
  degree?: string;
  researchHours: number;
  convertedPoint: number;
  avatarUploading?: boolean;
  onAvatarChange?: (file: File) => Promise<void> | void;
  onExportCV?: () => void;
}

Yêu cầu code:
1. Tạo/refactor component ProfileHeader.tsx bằng React + TypeScript.
2. Tạo file style ProfileHeader.less hoặc index.less.
3. Dữ liệu nhận qua props, không hard-code trực tiếp trong JSX.
4. Có validate file upload rõ ràng.
5. Có preview ảnh sau khi chọn.
6. Có loading state khi đang cập nhật avatar.
7. Giữ logic export CV qua callback onExportCV.
8. Code production-ready, dễ maintain, chạy tốt trong Umi Max + Ant Design Pro.
9. Không thêm thư viện ngoài nếu không cần.

Gợi ý UX avatar:
- Avatar nằm trong div .avatarWrapper.
- Khi hover .avatarOverlay opacity từ 0 lên 1.
- Overlay có background rgba(0,0,0,0.45), border-radius 50%.
- Icon CameraOutlined ở giữa.
- Text nhỏ “Đổi ảnh” dưới icon.
- Cursor pointer.
- Nếu avatarUploading = true thì overlay hiện Spin.

Hãy viết code hoàn chỉnh.