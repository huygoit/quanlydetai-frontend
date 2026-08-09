# US-04-05 – CNĐT chỉnh sửa thuyết minh và nộp bản hoàn thiện

## 1. User Story

> Là CNĐT có hồ sơ được yêu cầu điều chỉnh, tôi muốn xem góp ý, sửa thuyết minh, giải trình và nộp phiên bản hoàn thiện trước thời hạn để tiếp tục quy trình xác nhận kinh phí/phê duyệt.

## 2. Actor

- Actor chính: CNĐT/người được quyền chỉnh sửa hồ sơ.
- Actor liên quan: PKH, HĐ, TC, LĐ.

## 3. Precondition

- Hồ sơ ở `CHINH_SUA_TM`.
- Biên bản và yêu cầu chỉnh sửa đã được phát hành.
- PKH đã chọn deadline chỉnh sửa.

## 4. Đường dẫn

**Thuyết minh của tôi → Hồ sơ cần chỉnh sửa → Chỉnh sửa/Nộp bản hoàn thiện**

## 5. Main Flow

1. CNĐT mở hồ sơ cần chỉnh sửa.
2. Hệ thống hiển thị biên bản, ý kiến HĐ, deadline và các nội dung cần xử lý.
3. CNĐT chỉnh sửa các phần được phép trên form.
4. CNĐT upload file thuyết minh phiên bản mới và nhập giải trình.
5. Hệ thống lưu nháp mà không thay đổi phiên bản đã nộp trước đó.
6. CNĐT nhấn **Nộp bản hoàn thiện**.
7. Hệ thống kiểm tra dữ liệu, file, giải trình và deadline.
8. Nếu hợp lệ, hệ thống khóa phiên bản mới, lưu liên kết phiên bản trước/sau và chuyển hồ sơ sang bước xác nhận kinh phí tại US-04-06.
9. PKH và các bên liên quan nhận thông báo.

## 6. Quy tắc phiên bản

- Không ghi đè hoặc xóa bản đã được HĐ đánh giá.
- Mỗi lần nộp hoàn thiện tạo một phiên bản bất biến.
- Lưu người tạo, thời gian, lý do, file, dữ liệu form và phiên bản cha.
- Chức năng so sánh phải chỉ rõ thay đổi nội dung; chỉ so tên file/kích thước/ngày upload chưa được xem là diff nội dung.
- Nếu hệ thống chưa hỗ trợ diff DOCX/PDF thực tế, tối thiểu hiển thị metadata và các field form thay đổi; ghi rõ giới hạn.

## 7. Deadline

- PKH tự chọn deadline chỉnh sửa, không cố định 7 ngày.
- Có thể lấy mặc định từ cấu hình theo loại đề tài/kết luận.
- Hệ thống nhắc trước deadline theo số ngày cấu hình; giá trị tham khảo là 2 ngày.
- Việc gia hạn phải lưu lý do và lịch sử deadline cũ/mới.

## 8. Bước kinh phí liên quan

- Nếu hồ sơ thuộc ngưỡng cần xét duyệt kinh phí riêng, sau khi bản hoàn thiện được chấp nhận sẽ chuyển sang hội đồng/bước xét duyệt kinh phí.
- Nếu không thuộc diện này, chuyển trực tiếp sang PKH + TC xác nhận kinh phí tại US-04-06.
- Điều kiện xác định “kinh phí lớn” phải cấu hình và được nghiệp vụ chốt.

## 9. Luồng thay thế/ngoại lệ

- Chưa đủ dữ liệu: cho lưu nháp, không cho nộp hoàn thiện.
- Quá deadline: khóa nộp, trừ khi PKH gia hạn/mở lại.
- Virus scan/file không hợp lệ: từ chối file và không cho nộp.
- Nộp lặp/đồng thời: chỉ tạo một phiên bản hoàn thiện.
- Hồ sơ đã đổi trạng thái bởi tác vụ khác: từ chối với thông báo tải lại dữ liệu.

## 10. Acceptance Criteria

1. Chỉ hồ sơ `CHINH_SUA_TM` và đúng CNĐT/người được ủy quyền mới được sửa.
2. Hệ thống hiển thị biên bản, góp ý và deadline.
3. Giải trình bắt buộc, tối thiểu 100 ký tự.
4. Deadline do PKH chọn hoặc lấy từ cấu hình; không hard-code 7 ngày.
5. Hệ thống nhắc trước deadline theo cấu hình.
6. Bản cũ và bản mới đều được lưu, không ghi đè.
7. Hệ thống hiển thị khác biệt giữa phiên bản ở mức được hỗ trợ và nêu rõ loại diff.
8. Nộp thành công khóa phiên bản và chuyển sang bước xác nhận kinh phí.
9. PKH nhận thông báo; LĐ chỉ nhận khi hồ sơ đã qua bước kinh phí cần thiết.
10. Request lặp không tạo phiên bản trùng.

## 11. Đầu vào

- Biên bản và góp ý từ US-04-04.
- Deadline do PKH chọn.
- Nội dung chỉnh sửa, file mới và giải trình.

## 12. Đầu ra

- Phiên bản thuyết minh hoàn thiện bất biến.
- Bản giải trình và dữ liệu so sánh phiên bản.
- Hồ sơ chờ xác nhận kinh phí.

## 13. Liên kết User Story

- Nhận yêu cầu từ [US-04-04](./US-04-04-to-chuc-bao-ve.md).
- Bàn giao hồ sơ hoàn thiện cho [US-04-06](./US-04-06-xac-nhan-kinh-phi-va-phe-duyet.md).

## 14. TBD

1. Có yêu cầu HĐ/PKH xác nhận lại bản chỉnh sửa trước bước kinh phí hay không.
2. Ngưỡng và cơ chế hội đồng xét duyệt kinh phí riêng.
3. Phạm vi diff bắt buộc: field form, DOCX, PDF hay toàn bộ.

