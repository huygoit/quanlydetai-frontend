# US-04-06 – Xác nhận kinh phí và Lãnh đạo phê duyệt chính thức

## 1. User Story

> Là PKH và Phòng Tài chính – Kế hoạch, chúng tôi muốn phối hợp thẩm tra, đề xuất và xác nhận mức kinh phí; sau đó Lãnh đạo xem hồ sơ và mức kinh phí đã xác nhận để ra quyết định phê duyệt chính thức.

## 2. Actor

- Actor chính theo bước: PKH, TC, LĐ.
- Actor liên quan: CNĐT.

## 3. Nguyên tắc nghiệp vụ

- LĐ không trực tiếp nhập hoặc tự tính mức kinh phí được cấp.
- PKH phối hợp TC lập/xác nhận mức kinh phí trình LĐ.
- LĐ phê duyệt hoặc không phê duyệt dựa trên hồ sơ và đề xuất kinh phí đã xác nhận.
- Chỉ sau quyết định phê duyệt mới mở Module 5 và quy trình hợp đồng/tạm ứng.

## 4. Precondition

- Hồ sơ đã được HĐ thông qua; hoặc đã nộp/chấp nhận bản hoàn thiện sau chỉnh sửa.
- Có đầy đủ thuyết minh cuối, kết quả phản biện, biên bản HĐ và lịch sử phiên bản.
- Chưa có quyết định phê duyệt hiệu lực.

## 5. Đường dẫn

- PKH: **Module 4 → Hồ sơ chờ xác nhận kinh phí → Đề xuất kinh phí**.
- TC: **Hồ sơ chờ thẩm tra kinh phí → Xác nhận/Yêu cầu điều chỉnh**.
- LĐ: **Chờ phê duyệt → Xem hồ sơ → Phê duyệt/Không phê duyệt**.

## 6. Main Flow

### 6.1. PKH đề xuất kinh phí

1. PKH mở hồ sơ đã được HĐ thông qua.
2. PKH xem kinh phí đề nghị, kinh phí chi tiết, ý kiến HĐ và phiên bản cuối.
3. PKH nhập mức kinh phí đề xuất và căn cứ/ghi chú.
4. Nếu hồ sơ vượt ngưỡng cấu hình, hệ thống yêu cầu hoàn tất bước/hội đồng xét duyệt kinh phí trước khi gửi TC.
5. PKH gửi hồ sơ sang TC thẩm tra.

### 6.2. TC thẩm tra và xác nhận

1. TC xem hồ sơ, mức đề nghị và mức PKH đề xuất.
2. TC có thể:
   - Xác nhận mức kinh phí;
   - Điều chỉnh mức kinh phí kèm căn cứ;
   - Trả lại PKH để bổ sung/điều chỉnh.
3. Khi xác nhận, hệ thống lưu mức kinh phí trình phê duyệt và chuyển `LDPD_PENDING`.

### 6.3. LĐ phê duyệt

1. LĐ mở danh sách `LDPD_PENDING`.
2. LĐ xem thuyết minh cuối, kết quả phản biện, biên bản HĐ, lịch sử chỉnh sửa và mức kinh phí đã được PKH+TC xác nhận.
3. LĐ chọn:
   - **Phê duyệt**: nhập ghi chú nếu cần; hệ thống chuyển `SAN_SANG_THUC_HIEN`.
   - **Không phê duyệt**: bắt buộc nhập lý do; hệ thống chuyển trạng thái kết thúc không phê duyệt của Module 4.
   - **Yêu cầu xem xét lại** nếu quy trình cho phép: trả về PKH/TC, giữ lịch sử.
4. Hệ thống ghi quyết định và audit log, thông báo CNĐT cùng các đơn vị liên quan.
5. Với hồ sơ được phê duyệt, Module 5 được mở; quy trình hợp đồng/tạm ứng chỉ bắt đầu sau đó.

## 7. Quy tắc kinh phí

```text
deviation_rate = ABS(approved_budget - requested_budget) / requested_budget * 100
```

- Nếu kinh phí đề nghị bằng 0, không dùng công thức tỷ lệ; phải xử lý ngoại lệ rõ ràng.
- Cảnh báo khi mức trình phê duyệt chênh trên 20% so với mức đề nghị.
- Cảnh báo không đồng nghĩa tự động chặn; quyền tiếp tục phải theo cấu hình/quy định.
- Mức trình phê duyệt phải là số dương, trừ loại đề tài không cấp kinh phí nếu nghiệp vụ có hỗ trợ.
- Mọi thay đổi mức kinh phí phải có căn cứ, người thao tác và thời điểm.

## 8. Hội đồng/bước xét duyệt kinh phí lớn

- Hệ thống hỗ trợ cấu hình ngưỡng kích hoạt bước xét duyệt kinh phí tăng cường.
- Khi vượt ngưỡng, hồ sơ không được chuyển thẳng tới TC/LĐ nếu chưa có kết quả của bước này.
- Thành phần, hình thức họp trực tiếp/trực tuyến/kết hợp và biên bản áp dụng nguyên tắc hội đồng tại US-04-04.
- Chi tiết thành phần và thẩm quyền là TBD.

## 9. Luồng thay thế/ngoại lệ

- TC trả lại: hồ sơ quay về PKH với lý do; không mất lịch sử đề xuất trước.
- LĐ yêu cầu xem xét lại: trả về đúng bước được cấu hình, không tự đổi mức kinh phí.
- LĐ không phê duyệt: không dùng `SOTUYEN_REJECTED`; dùng trạng thái kết thúc riêng của Module 4.
- Hồ sơ đã được người khác xử lý: optimistic locking/state check ngăn ghi đè.
- Request phê duyệt lặp: chỉ tạo một quyết định hiệu lực và một lần mở Module 5.

## 10. Acceptance Criteria

1. PKH nhập đề xuất kinh phí; TC thẩm tra/xác nhận; LĐ không trực tiếp nhập mức cấp.
2. Hồ sơ vượt ngưỡng phải hoàn tất bước xét duyệt kinh phí tăng cường nếu cấu hình yêu cầu.
3. TC có thể xác nhận, điều chỉnh kèm căn cứ hoặc trả lại PKH.
4. Chỉ hồ sơ đã được TC xác nhận mới chuyển `LDPD_PENDING`.
5. LĐ xem đầy đủ hồ sơ và mức kinh phí đã xác nhận trước khi quyết định.
6. Cảnh báo khi chênh lệch trên 20%; xử lý đúng trường hợp kinh phí đề nghị bằng 0.
7. Phê duyệt thành công chuyển đúng một lần sang `SAN_SANG_THUC_HIEN` và mở Module 5.
8. Không phê duyệt dùng trạng thái kết thúc Module 4, không dùng `SOTUYEN_REJECTED`.
9. Audit log quyết định, mức kinh phí, người thao tác và timestamp không thể bị xóa qua luồng nghiệp vụ thông thường.
10. Thông báo CNĐT nêu kết quả, mức kinh phí được phê duyệt nếu có và liên kết phù hợp.
11. Quy trình tạm ứng không bắt đầu trước khi có quyết định phê duyệt.
12. Concurrency/request lặp không tạo hai quyết định hoặc mở Module 5 nhiều lần.

## 11. Đầu vào

- Hồ sơ cuối từ US-04-04 hoặc US-04-05.
- Kinh phí đề nghị và bảng kinh phí chi tiết.
- Đề xuất của PKH, thẩm tra của TC và kết quả hội đồng kinh phí nếu có.

## 12. Đầu ra

- Mức kinh phí đã được PKH+TC xác nhận.
- Quyết định phê duyệt/không phê duyệt của LĐ.
- Trạng thái `SAN_SANG_THUC_HIEN` hoặc trạng thái kết thúc.
- Thông báo, audit log và tín hiệu mở Module 5.

## 13. Liên kết User Story

- Nhận hồ sơ thông qua trực tiếp từ [US-04-04](./US-04-04-to-chuc-bao-ve.md) hoặc bản hoàn thiện từ [US-04-05](./US-04-05-chinh-sua-thuyet-minh.md).
- Bàn giao hồ sơ được phê duyệt sang Module 5 để lập hợp đồng và triển khai/tạm ứng.

## 14. TBD

1. Tên trạng thái chờ TC xác nhận.
2. Tên trạng thái không phê duyệt ở Module 4.
3. Ngưỡng và điều kiện bắt buộc lập hội đồng xét duyệt kinh phí.
4. LĐ có quyền trả lại PKH/TC hay chỉ phê duyệt/không phê duyệt.
5. Loại đề tài không cấp kinh phí có được phép mức phê duyệt bằng 0 hay không.

