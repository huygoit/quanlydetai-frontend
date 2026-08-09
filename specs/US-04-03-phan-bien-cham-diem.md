# US-04-03 – Phản biện đánh giá và chấm điểm theo tiêu chí

## 1. User Story

> Là phản biện được phân công, tôi muốn xem hồ sơ, đánh giá theo bộ tiêu chí áp dụng, ghi nhận xét và nộp phiếu trước deadline để PKH tổng hợp kết quả.

## 2. Actor

- Actor chính: Phản biện/HĐ.
- Actor liên quan: PKH.

## 3. Precondition

- Có assignment phản biện còn hiệu lực.
- Người dùng đã đăng nhập đúng tài khoản được mời.
- Thuyết minh ở `PHANBIEN_KIN`.
- Chưa quá deadline hoặc đã được PKH gia hạn/mở lại hợp lệ.

## 4. Đường dẫn

**Công việc phản biện → Thuyết minh được phân công → Phiếu đánh giá**

## 5. Main Flow

1. Phản biện mở nhiệm vụ được phân công.
2. Hệ thống hiển thị hồ sơ thuyết minh, thông tin nhân sự/tiềm lực cần đánh giá và bộ tiêu chí đã snapshot.
3. Phản biện nhập điểm, nhận xét theo từng tiêu chí và nhận xét/kết luận chung nếu mẫu yêu cầu.
4. Phản biện có thể lưu nháp nhiều lần trước deadline.
5. Hệ thống tính tổng điểm theo trọng số/thang điểm của mẫu.
6. Phản biện nhấn **Nộp phiếu chấm** và xác nhận.
7. Hệ thống validation toàn bộ phiếu, ghi nhận thời điểm nộp và khóa phiếu.
8. Khi đủ số phiếu hợp lệ, hệ thống tính kết quả tổng hợp và thông báo PKH.

## 6. Bộ tiêu chí

- Bộ tiêu chí lấy theo mẫu được ADMIN cấu hình và có thể thay đổi theo loại đề tài/đợt xét.
- Nội dung tối thiểu cần hỗ trợ gồm: tiềm lực thực hiện, tính cấp thiết, mục tiêu, phương pháp, tính khả thi/sản phẩm và kinh phí.
- Không hard-code năm tiêu chí 20 điểm nếu mẫu chính thức khác.
- Mỗi đợt đánh giá phải lưu snapshot tên tiêu chí, điểm tối đa, trọng số, thứ tự và quy tắc nhận xét.

## 7. Công thức và ngưỡng

```text
review_total_score = SUM(score hoặc weighted_score của các tiêu chí)
average_score = ROUND(SUM(review_total_score của các phiếu hợp lệ) / số phiếu hợp lệ, 2)
```

- Điểm từng tiêu chí phải nằm trong khoảng từ 0 đến điểm tối đa của tiêu chí.
- Ngưỡng tự động không đạt dưới 50 hoặc 60 điểm chưa chốt; phải lấy từ cấu hình sau khi nghiệp vụ xác nhận.
- Nếu dưới ngưỡng cấu hình, hệ thống đánh dấu **không đạt theo điểm**, nhưng không tự chuyển sang trạng thái kết thúc nếu quy trình còn yêu cầu PKH/HĐ xác nhận.

## 8. Hình thức đánh giá

- Phiếu đánh giá được nhập và nộp trên hệ thống.
- Hoạt động trao đổi/họp nếu có có thể trực tiếp, trực tuyến hoặc kết hợp.
- Trực tuyến cho phép gắn link họp; ưu tiên Microsoft Teams khi có tích hợp.

## 9. Luồng thay thế/ngoại lệ

- Lưu nháp: cho phép phiếu chưa hoàn chỉnh.
- Quá deadline: khóa nộp, trừ khi PKH gia hạn/mở lại.
- Phiếu đã nộp: phản biện không tự sửa; PKH chỉ mở lại khi nhập lý do và lưu audit log.
- Thiếu phiếu: hệ thống gửi nhắc theo cấu hình; mặc định tham khảo 3 ngày trước deadline.
- Assignment bị thay/hủy: phản biện cũ mất quyền truy cập/nộp theo quy tắc bảo toàn lịch sử.

## 10. Acceptance Criteria

1. Chỉ phản biện có assignment còn hiệu lực mới xem và chấm hồ sơ.
2. Điểm từng tiêu chí nằm trong giới hạn cấu hình; validation có ở backend.
3. Nhận xét bắt buộc và tối thiểu 50 ký tự cho từng tiêu chí nếu mẫu quy định.
4. Phiếu đã nộp bị khóa; chỉ PKH mở lại kèm lý do và audit log.
5. Hệ thống gửi nhắc trước deadline theo cấu hình nếu chưa nộp.
6. PKH không xem điểm riêng của từng phản biện trước khi đủ tất cả phiếu, nếu chế độ blind aggregation được bật.
7. Điểm trung bình được làm tròn 2 chữ số thập phân.
8. Tiêu chí và ngưỡng đạt lấy từ snapshot cấu hình, không hard-code.
9. Khi đủ phiếu, PKH nhận đúng một thông báo.
10. Hai request nộp đồng thời không tạo hai kết quả hoặc thay đổi phiếu đã khóa.

## 11. Đầu vào

- Assignment từ US-04-02.
- Hồ sơ thuyết minh và thông tin năng lực thực hiện.
- Snapshot bộ tiêu chí, thang điểm, ngưỡng và deadline.

## 12. Đầu ra

- Phiếu chấm đã khóa hoặc bản nháp phiếu.
- Tổng điểm từng phản biện.
- Điểm trung bình và kết quả theo ngưỡng.
- Thông báo cho PKH khi đủ phiếu.

## 13. Liên kết User Story

- Nhận assignment từ [US-04-02](./US-04-02-phan-cong-phan-bien-kin.md).
- Bàn giao kết quả cho [US-04-04](./US-04-04-to-chuc-bao-ve.md).

## 14. TBD

1. Ngưỡng không đạt là 50, 60 hay theo từng loại đề tài.
2. Nhận xét bắt buộc theo từng tiêu chí hay chỉ nhận xét chung.
3. Có bắt buộc họp phản biện riêng trước bảo vệ hay không.

