# Kết quả test module 1–6

Ngày: 2026-10-10. App: `http://localhost:8001`. Tài khoản: Admin (`admin@university.edu.vn`).

Hồ sơ đã đi hết vòng: **ĐT-2026-003 / TM-2026-0001** (vòng đời Hoàn thành). Hồ sơ đang giữa module 6: **TM-TEST-M56** (Họp hội đồng).

## Đã mở được

- Ý tưởng: danh sách, sơ loại (đã phê duyệt / đã từ chối), xem chi tiết, hội đồng (ý tưởng, thành viên, kết quả).
- Thông báo tuyển chọn: danh sách, chi tiết đợt «Dot tuyen test module 1-6», tin tuyển chọn.
- Đăng ký đề xuất: 3 hồ sơ. ĐT-2026-003 trạng thái Được chọn.
- Phiên xét chọn #1 đã khóa, 1 đồng ý.
- Bảo vệ buổi 1 đã chốt biên bản, kết luận Thông qua.
- Kinh phí TM-2026-0001: phiếu `LD_APPROVED`, 10.000.000 đ. Ba hàng đợi PKH / TC / LĐ mở được, đang trống.
- Hợp đồng: hai bản Đã ký. Chi tiết HD-TM-2026-0001 đủ bước ký. Tải DOCX trả file Word.
- Triển khai TM-TEST-M56: sổ 10 mục, tạm ứng đã ghi sổ, mua sắm đã ghi sổ, tiến độ có nút nộp báo cáo mốc còn thiếu, điều chỉnh đã duyệt, hội đồng cuối kỳ 4 người. Nhắc phản biện trả «Đã nhắc».

## Nghi vấn còn mở

1. Tab Đánh giá cuối kỳ khi đã Hoàn thành không hiện kết quả.

   - Màn `/projects/execution/2`, nhãn **Hoàn thành**. Tab chỉ còn hồ sơ (báo cáo tổng hợp, tóm tắt, file sản phẩm).
   - API `/api/module56/final/2`: xếp loại `DAT_YEU_CAU`, biên bản khóa, quyết toán `QT_DONE`, thanh lý `TL_HIEU_LUC`.
   - `TabCuoiKy.tsx` chỉ vẽ hội đồng / giải trình / quyết toán / thanh lý theo từng trạng thái giữa chừng (`DGCK_HOP_HD`, `DGCK_CHO_QUYET_TOAN`, `DGCK_CHO_THANH_LY`…). Không có nhánh cho `HOAN_THANH`.

2. Bảo vệ và kinh phí của đề tài đã hoàn thành vẫn ghi «Sẵn sàng thực hiện».

   - `/projects/defenses/1`: buổi Đã chốt biên bản, trạng thái TM là Sẵn sàng thực hiện.
   - `/projects/budget-approvals/2`: phiếu đã duyệt, trạng thái TM vẫn Sẵn sàng thực hiện.
   - Hai màn đọc `outline.status` (`SAN_SANG_THUC_HIEN`), không đọc `executionStatus` (`HOAN_THANH`).

3. Menu Nghiệm thu đề tài chưa có nghiệp vụ.
   - `/projects/acceptance` chỉ hiện «Nghiệm thu đề tài - Đang phát triển».

## Không phải lỗi nghiệp vụ

- `where status in ?` trên `project_outlines`: do request thử `scope=all`. Màn kinh phí chỉ gửi `pkh` / `tc` / `ld`, cả ba trả 200.
- `id = NaN`: màn triển khai gọi API khi id URL không phải số. Đã chặn trong `src/pages/projects/execution/index.tsx` (id sai thì báo «Không tìm thấy nhiệm vụ», không gọi API).
