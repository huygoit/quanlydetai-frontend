# SPEC – HỒ SƠ KHOA HỌC (GIẢNG VIÊN / NCV) – VIP PRO (UPDATED)
## File: `specs/scientific-profile.md`
> Phiên bản cập nhật: **Bổ sung & chuẩn hoá BÀI BÁO KHOA HỌC / CÔNG BỐ KHOA HỌC**  
> Mục tiêu: Xây dựng **CV khoa học điện tử (living profile)**, cập nhật tự động, có xác thực, dùng xuyên suốt hệ thống KH&CN.

---

## I. Nguyên tắc CHỐT (sau khi update)

1. **Bài báo khoa học (Publications) là một TRỤ CỘT RIÊNG**, ngang hàng với Đề tài.
2. Publications **không nhập tay tuỳ tiện**, mà:
   - Tự động từ hệ thống / nguồn ngoài
   - Có bước **xác nhận của NCV**
3. Hồ sơ khoa học là **nguồn dữ liệu gốc** cho:
   - Hội đồng chấm
   - Xuất CV
   - Báo cáo tổng hợp
4. Không dùng ranking, **chỉ dùng completeness & trạng thái xác thực**.

---

## II. Cấu trúc Hồ sơ khoa học (FINAL)

```
Hồ sơ khoa học
├─ 1. Thông tin chung
├─ 2. Đào tạo & công tác
├─ 3. Ngoại ngữ
├─ 4. Hướng nghiên cứu
├─ 🔥 5. Công bố khoa học & Bài báo (Publications)
├─ 6. Đề tài nghiên cứu (auto-linked)
├─ 7. Hoạt động học thuật khác
├─ 8. Tệp đính kèm
└─ 9. Xuất CV khoa học
```

---

## III. PHẦN 5 – CÔNG BỐ KHOA HỌC & BÀI BÁO (CORE MODULE)

### 5.1 Khái niệm
**Công bố khoa học / Bài báo khoa học** là các sản phẩm học thuật bao gồm:
- Bài báo tạp chí
- Bài hội thảo
- Chương sách khoa học
- Sách chuyên khảo

👉 Đây là **nguồn dữ liệu chính** để:
- Hội đồng đánh giá năng lực
- Xuất CV khoa học
- Tổng hợp báo cáo KH&CN

---

### 5.2 Nguồn dữ liệu Publications

| Nguồn | Mô tả |
|------|------|
| Nội bộ | Module Công bố khoa học (đã duyệt) |
| Google Scholar | Đồng bộ & gợi ý |
| SCV ĐHĐN | Đồng bộ & gợi ý |

📌 **Dữ liệu từ nguồn ngoài luôn ở trạng thái “Gợi ý” cho đến khi NCV xác nhận.**

---

### 5.3 Phân loại công bố

| Nhóm | Giá trị |
|----|-------|
| Loại công bố | Bài báo / Hội thảo / Chương sách / Sách |
| Phân hạng | ISI / Scopus / Trong nước |
| Quartile | Q1 / Q2 / Q3 / Q4 (nếu có) |
| Trạng thái | Đã xuất bản / Đã chấp nhận / Đang phản biện |

---

### 5.4 Cấu trúc dữ liệu BÀI BÁO KHOA HỌC (CHUẨN)

```ts
type PublicationType = 'JOURNAL' | 'CONFERENCE' | 'BOOK_CHAPTER' | 'BOOK';
type PublicationRank = 'ISI' | 'SCOPUS' | 'DOMESTIC' | 'OTHER';
type PublicationStatus = 'PUBLISHED' | 'ACCEPTED' | 'UNDER_REVIEW';

interface Publication {
  id: string;

  // Thông tin chính
  title: string;
  authors: string;                 // Danh sách tác giả
  correspondingAuthor?: string;    // Tác giả liên hệ
  myRole?: 'CHU_TRI' | 'DONG_TAC_GIA';

  // Xuất bản
  publicationType: PublicationType;
  journalOrConference: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;

  // Phân loại
  rank?: PublicationRank;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';

  // Định danh
  doi?: string;
  issn?: string;
  isbn?: string;
  url?: string;

  // Trạng thái
  status: PublicationStatus;

  // Nguồn & xác nhận
  source: 'INTERNAL' | 'GOOGLE_SCHOLAR' | 'SCV_DHDN';
  sourceId?: string;
  verifiedByNcv: boolean;           // NCV đã xác nhận gắn vào hồ sơ
  approvedInternal?: boolean;       // Với công bố nội bộ

  // Minh chứng
  attachmentUrl?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

### 5.5 Publication Suggestions (nguồn ngoài)

```ts
interface PublicationSuggestion {
  id: string;
  profileId: string;
  source: 'GOOGLE_SCHOLAR' | 'SCV_DHDN';

  title: string;
  year?: number;
  journalOrConference?: string;
  url?: string;

  status: 'PENDING' | 'CONFIRMED' | 'IGNORED';
  createdAt: string;
}
```

---

## IV. UI/UX – TAB “CÔNG BỐ KHOA HỌC & BÀI BÁO”

### 4.1 Vị trí UI
- Tab **“Công bố khoa học & Bài báo”** trong Hồ sơ khoa học
- Icon đề xuất: 📄 / 🧪 / 📚

---

### 4.2 Cấu trúc Tab (2 section rõ ràng)

#### A. **Bài báo đã gắn vào hồ sơ**
- Table read-only (V1)
- Cột:
  - Tên bài báo
  - Loại
  - Tạp chí / Hội thảo
  - Năm
  - Phân hạng (ISI/Scopus/…)
  - Q (Q1–Q4)
  - Vai trò
  - Trạng thái
  - Nguồn
- Filter:
  - Năm
  - Loại công bố
  - Phân hạng
- Action:
  - Xem chi tiết
  - Mở DOI/URL
  - Tải file minh chứng (nếu có)

---

#### B. **Gợi ý công bố mới (từ Scholar / SCV)**
- Table compact
- Cột:
  - Tên bài
  - Năm
  - Tạp chí/Hội thảo
  - Nguồn
- Action:
  - ✔ Xác nhận đưa vào hồ sơ
  - ✖ Bỏ qua

📌 Khi NCV xác nhận → record chuyển sang section A.

---

## V. Mapping Publications → Xuất CV

### 5.1 Nguyên tắc
- **Chỉ lấy Publications đã gắn vào hồ sơ**
- Sắp xếp:
  - Mới → cũ
  - Theo phân hạng (ISI/Scopus → trong nước)

### 5.2 Mẫu xuất CV (ví dụ)
```
Nguyễn Văn A (2024).
Ứng dụng AI trong chẩn đoán bệnh lý.
Tạp chí ABC (ISI, Q1), Tập 12, Số 3, tr. 45–56. DOI: xxx
```

---

## VI. Tác động đến Completeness (không phải ranking)

- Hồ sơ được coi là “đầy đủ” khi:
  - Có ≥ 1 công bố khoa học **hoặc**
  - Có ≥ 1 đề tài đã tham gia
- Thiếu Publications → cảnh báo nhẹ trong summary sticky.

---

## VII. Notification liên quan Publications

| Event | Người nhận | Nội dung |
|----|---------|---------|
| Sync Scholar/SCV | NCV | Có X công bố gợi ý mới |
| NCV confirm publication | NCV | Đã thêm bài báo vào hồ sơ |
| Hồ sơ được xác thực | NCV | Công bố khoa học đã được ghi nhận |

---

## VIII. Prompt cho Cursor AI (UPDATED)

**Prompt:**
> Update module “Hồ sơ khoa học” theo spec mới, bổ sung trụ cột **Công bố khoa học & Bài báo**.  
> Implement entity Publication với đầy đủ field (ISI/Scopus/Q/DOI…).  
> UI: Tab riêng “Công bố khoa học & Bài báo” gồm 2 section:  
> (A) Publications đã gắn vào hồ sơ (table + filter)  
> (B) Gợi ý từ Google Scholar/SCV (confirm/ignore).  
> Dữ liệu mock lưu localStorage, không backend.  
> Mapping Publications dùng cho Export CV.

