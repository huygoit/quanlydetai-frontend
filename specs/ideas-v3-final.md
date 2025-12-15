# SPEC – MODULE NGÂN HÀNG Ý TƯỞNG (IDEA BANK) – `specs/ideas.md` (V3 – FINAL)

> **Bản FINAL – chốt theo đúng nghiệp vụ quản lý KH&CN**
> - “Cấp quản lý dự kiến” ➜ **Cấp đề tài phù hợp** (Checkbox chọn NHIỀU)
> - Ý tưởng ≠ Đề tài (2 model tách biệt)
> - Hội đồng KH&ĐT **đề xuất đặt hàng**
> - Lãnh đạo **phê duyệt đặt hàng**
> - ❌ **KHÔNG cho nộp lại** – bị từ chối là kết thúc
> - “Chuyển thành đề tài” là **ACTION**, không phải STATUS

---

## 1. Mục tiêu

Module **Ngân hàng Ý tưởng** dùng để:
- Thu thập, lưu trữ ý tưởng nghiên cứu trong toàn đơn vị.
- Cho phép **NCV/CNDT** gửi ý tưởng.
- Cho phép **Phòng KH**, **Hội đồng KH&ĐT**, **Lãnh đạo** thực hiện quy trình:
  - Sơ loại
  - Đề xuất đặt hàng
  - Phê duyệt đặt hàng
- Sau khi được phê duyệt → **khởi tạo hồ sơ Đề tài**.

---

## 2. Role & Access

### Vai trò
- `ADMIN`
- `NCV`, `CNDT`
- `TRUONG_DON_VI`
- `PHONG_KH`
- `HOI_DONG`
- `LANH_DAO`

### Access key
- `canViewIdeaBank` → xem danh sách / ý tưởng của tôi
- `canReviewIdea` → Phòng KH
- `canProposeOrder` → Hội đồng KH&ĐT
- `canApproveOrder` → Lãnh đạo

---

## 3. Model dữ liệu

### 3.1 Cấp đề tài phù hợp (Checkbox – chọn nhiều)

```ts
type ProjectLevel =
  | 'TRUONG_THUONG_NIEN'
  | 'TRUONG_DAT_HANG'
  | 'DAI_HOC_DA_NANG'
  | 'BO_GDDT'
  | 'NHA_NUOC'
  | 'NAFOSTED'
  | 'TINH_THANH_PHO'
  | 'DOANH_NGHIEP';
```

---

### 3.2 Trạng thái Ý tưởng (FINAL)

```ts
type IdeaStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'APPROVED_INTERNAL'
  | 'PROPOSED_FOR_ORDER'
  | 'APPROVED_FOR_ORDER'
  | 'REJECTED';
```

---

### 3.3 Phân biệt bị từ chối ở đâu (audit)

```ts
type RejectStage =
  | 'PHONG_KH_SO_LOAI'
  | 'HOI_DONG_DE_XUAT'
  | 'LANH_DAO_PHE_DUYET';
```

---

### 3.4 Model Idea

```ts
interface Idea {
  id: string;
  code: string;
  title: string;
  summary: string;
  field: string;

  suitableLevels: ProjectLevel[];

  ownerId: string;
  ownerName: string;
  ownerUnit: string;

  status: IdeaStatus;

  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  noteForReview?: string;

  rejectedStage?: RejectStage;
  rejectedReason?: string;
  rejectedByRole?: 'PHONG_KH' | 'HOI_DONG' | 'LANH_DAO';
  rejectedAt?: string;

  linkedProjectId?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

## 4. Quy trình nghiệp vụ (FINAL)

```
DRAFT
 → SUBMITTED
 → REVIEWING            (Phòng KH)
 → APPROVED_INTERNAL
 → PROPOSED_FOR_ORDER   (Hội đồng KH&ĐT)
 → APPROVED_FOR_ORDER   (Lãnh đạo)
 → [ACTION] Khởi tạo Đề tài
```

❌ Bị từ chối tại bất kỳ bước nào → `REJECTED` (kết thúc).

---

## 5. Quyền chuyển trạng thái

| Bước | Vai trò |
|----|--------|
| DRAFT → SUBMITTED | NCV / CNDT |
| SUBMITTED → REVIEWING | Phòng KH |
| REVIEWING → APPROVED_INTERNAL | Phòng KH |
| APPROVED_INTERNAL → PROPOSED_FOR_ORDER | Hội đồng KH&ĐT |
| PROPOSED_FOR_ORDER → APPROVED_FOR_ORDER | Lãnh đạo |
| Any → REJECTED | Vai trò tại bước đó |

---

## 6. Các trang UI

### `/ideas/list`
- Xem danh sách ý tưởng
- Filter:
  - Trạng thái
  - Đơn vị
  - Lĩnh vực
  - **Cấp đề tài phù hợp (multi)**

### `/ideas/my`
- Tạo / sửa ý tưởng
- Checkbox “Cấp đề tài phù hợp”
- Lưu nháp / Gửi

### `/ideas/review`
- Phòng KH: sơ loại
- Hội đồng: đề xuất đặt hàng
- Lãnh đạo: phê duyệt đặt hàng

---

## 7. Action: Khởi tạo đề tài

- Điều kiện: `status === APPROVED_FOR_ORDER`
- Sinh Project
- Gán `linkedProjectId`

---

## 8. Nguyên tắc

- ❌ Không cho nộp lại
- ❌ Không sửa sau khi bị từ chối
- ✔ Muốn làm lại → tạo ý tưởng mới
- ✔ Action kỹ thuật tách khỏi status

---

## 9. Yêu cầu cho Cursor

- Không dùng `CONVERTED`
- Không sinh resubmit
- Checkbox multi cho `suitableLevels`
- Action “Khởi tạo đề tài” riêng
