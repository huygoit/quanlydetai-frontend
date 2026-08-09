# US-04-04 – PKH tổ chức và ghi nhận buổi bảo vệ thuyết minh

## 1. User Story

> Là PKH, tôi muốn thành lập hội đồng, lên lịch bảo vệ và ghi nhận biên bản/kết luận để quyết định hồ sơ được thông qua, cần chỉnh sửa hay không đạt.

## 2. Actor

- Actor chính: PKH hoặc Thư ký HĐ được phân quyền.
- Actor liên quan: CNĐT, Chủ tịch HĐ, Thư ký, Ủy viên, thành viên ngoài trường.

## 3. Precondition

- Đã đủ phiếu phản biện hợp lệ theo cấu hình.
- Kết quả phản biện đã được tổng hợp.
- Hồ sơ đang ở `PHANBIEN_KIN` và chưa có buổi bảo vệ hiệu lực khác bị trùng.

## 4. Đường dẫn

**Module 4 → Hồ sơ đủ điều kiện bảo vệ → Lên lịch bảo vệ**

## 5. Main Flow

1. PKH chọn hồ sơ đủ điều kiện và nhấn **Lên lịch bảo vệ**.
2. PKH chọn hình thức: trực tiếp, trực tuyến hoặc kết hợp.
3. PKH nhập ngày giờ, địa điểm và/hoặc link họp.
4. PKH chọn thành phần HĐ: Chủ tịch, Thư ký, Ủy viên và thành viên ngoài trường theo cấu hình.
5. Hệ thống kiểm tra trùng lịch, thành phần tối thiểu và xung đột lợi ích.
6. PKH xác nhận lịch; hệ thống chuyển sang `BAOVE_PENDING` và gửi email/calendar invite cho HĐ và CNĐT.
7. Sau buổi họp, PKH/Thư ký nhập ý kiến, điểm tổng kết và kết luận.
8. Kết luận gồm: **Thông qua**, **Thông qua có điều chỉnh**, **Không thông qua**.
9. Hệ thống lưu biên bản, tạo PDF và gửi cho CNĐT.
10. Hệ thống chuyển trạng thái theo kết luận.

## 6. Quy tắc hội đồng và lịch họp

- Hỗ trợ thành viên trong và ngoài trường.
- Số người ngoài trường tối thiểu lấy từ cấu hình; ghi chú nguồn đề xuất 1–2 người.
- Hình thức trực tuyến cho phép nhập/tạo link Microsoft Teams nếu có tích hợp.
- Email lịch họp gửi ngay sau khi xác nhận; cảnh báo nếu lịch được tạo ít hơn 5 ngày trước buổi bảo vệ.
- Việc vẫn cho phép lên lịch dưới 5 ngày phụ thuộc quyền override của PKH.

## 7. Quy tắc kết luận

| Kết luận | Trạng thái/luồng tiếp theo |
| --- | --- |
| Thông qua | Chuyển sang bước xác nhận kinh phí tại US-04-06 |
| Thông qua có điều chỉnh | `CHINH_SUA_TM` → US-04-05 |
| Không thông qua | Chuyển trạng thái kết thúc không đạt của Module 4; tên enum TBD |

- Không dùng `SOTUYEN_REJECTED` cho kết quả không thông qua ở giai đoạn này vì đó là trạng thái của sơ tuyển.
- Trường hợp đề tài có nguồn kinh phí lớn có thể cần hội đồng/bước xét duyệt kinh phí riêng trước khi trình LĐ; quy tắc kích hoạt ở US-04-06.

## 8. Nội dung biên bản

- Thông tin đề tài.
- Thời gian, địa điểm/hình thức họp.
- Thành phần HĐ và tình trạng tham dự.
- Điểm từng phản biện và điểm trung bình.
- Ý kiến thảo luận/kết luận.
- Yêu cầu chỉnh sửa nếu có.
- Thời hạn chỉnh sửa do PKH chọn nếu kết luận có điều chỉnh.
- Chữ ký/xác nhận theo quy trình hiện hành.

## 9. Luồng thay thế/ngoại lệ

- Còn thiếu phiếu phản biện: không cho xác nhận lịch bảo vệ.
- Thành phần không đủ hoặc vi phạm xung đột: chặn xác nhận.
- Thay đổi lịch/thành viên: lưu phiên bản/lịch sử và gửi thông báo cập nhật.
- Hủy buổi họp: bắt buộc lý do, không xóa lịch sử.
- Thành viên vắng mặt làm HĐ không đủ điều kiện: không cho chốt biên bản.

## 10. Acceptance Criteria

1. Không thể lên lịch khi chưa đủ phiếu phản biện hợp lệ.
2. Hỗ trợ trực tiếp, trực tuyến và kết hợp.
3. Thành phần HĐ đáp ứng cấu hình vai trò, số lượng và người ngoài trường.
4. Hệ thống kiểm tra trùng lịch và xung đột lợi ích.
5. Lịch xác nhận thành công gửi email/calendar invite và chuyển sang `BAOVE_PENDING`.
6. Cảnh báo khi ngày họp cách ngày gửi ít hơn 5 ngày.
7. PDF biên bản chứa đầy đủ hồ sơ, thành phần, điểm, ý kiến và kết luận.
8. Kết luận **Có điều chỉnh** chuyển `CHINH_SUA_TM`; **Thông qua** sang xác nhận kinh phí; **Không thông qua** kết thúc đúng trạng thái Module 4.
9. Không thể chốt biên bản hai lần do request lặp/đồng thời.
10. Mọi thay đổi lịch, thành phần và kết luận được audit.

## 11. Đầu vào

- Kết quả phản biện từ US-04-03.
- Cấu hình hội đồng và thành viên.
- Thông tin lịch/hình thức họp.
- Nội dung biên bản và kết luận.

## 12. Đầu ra

- Lịch bảo vệ và lời mời.
- Biên bản PDF.
- Kết luận và trạng thái tiếp theo.

## 13. Liên kết User Story

- Nhận kết quả từ [US-04-03](./US-04-03-phan-bien-cham-diem.md).
- Có điều chỉnh → [US-04-05](./US-04-05-chinh-sua-thuyet-minh.md).
- Thông qua → [US-04-06](./US-04-06-xac-nhan-kinh-phi-va-phe-duyet.md).

## 14. TBD

1. Số thành viên ngoài trường tối thiểu theo từng loại hội đồng.
2. Quyền cho phép lên lịch dưới 5 ngày.
3. Trạng thái chính thức khi không thông qua.
4. Điều kiện thành lập hội đồng xét duyệt kinh phí riêng.

