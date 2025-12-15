# SPEC – HỘI ĐỒNG KHOA HỌC & ĐÀO TẠO (CHẤM ĐIỂM Ý TƯỞNG – CÓ TRỌNG SỐ)
## `specs/ideas-council.md` – VERSION CÓ WEIGHT (FINAL)

> Bản này **mở rộng spec trước** bằng cách **bổ sung TRỌNG SỐ** cho 4 tiêu chí chấm điểm,
> đúng nghiệp vụ hội đồng KH&CN, dễ giải trình và dễ tổng hợp báo cáo.

---

## 1. Nguyên tắc chấm điểm (CHỐT)

- Mỗi **ý tưởng** được chấm bởi **nhiều thành viên hội đồng**
- Mỗi thành viên có **1 phiếu chấm / 1 ý tưởng**
- Phiếu chấm gồm:
  - Điểm từng tiêu chí (0–10)
  - Nhận xét cho từng tiêu chí
- **Điểm cuối cùng dùng để xét đề xuất đặt hàng = ĐIỂM CÓ TRỌNG SỐ**

---

## 2. Tiêu chí & Trọng số (ÁP DỤNG CHÍNH THỨC)

| # | Tiêu chí | Mô tả | Điểm | Trọng số |
|---|---------|------|------|---------|
| 1 | **Tính mới, sáng tạo** | Mức độ mới, khác biệt, giá trị khoa học | 0–10 | **30%** |
| 2 | **Tính khả thi** | Khả năng triển khai với nguồn lực hiện có | 0–10 | **30%** |
| 3 | **Phù hợp định hướng** | Phù hợp chiến lược Trường / ngành / xã hội | 0–10 | **20%** |
| 4 | **Năng lực tác giả** | Năng lực NCV / nhóm tác giả | 0–10 | **20%** |

👉 **Tổng trọng số = 100%**

---

## 3. Công thức tính điểm (RẤT QUAN TRỌNG)

### 3.1 Điểm có trọng số của 1 phiếu

```text
weightedScore =
  noveltyScore        * 0.30 +
  feasibilityScore    * 0.30 +
  alignmentScore      * 0.20 +
  authorCapacityScore * 0.20
```

---

### 3.2 Điểm trung bình hội đồng

```text
avgWeightedScore =
  sum(weightedScore của các thành viên đã gửi)
  / số phiếu hợp lệ
```

---

## 4. Ngưỡng đề xuất đặt hàng

| Điều kiện | Kết luận |
|---------|---------|
| `avgWeightedScore ≥ 7.0` | **ĐƯỢC ĐỀ XUẤT ĐẶT HÀNG** |
| `avgWeightedScore < 7.0` | Không đề xuất |

---

## 5. Model dữ liệu (UPDATE)

### 5.1 Cấu hình tiêu chí

```ts
interface CouncilCriteriaConfig {
  code: 'NOVELTY' | 'FEASIBILITY' | 'ALIGNMENT' | 'AUTHOR_CAPACITY';
  name: string;
  weight: number;
  maxScore: number;
  order: number;
  active: boolean;
}
```

---

### 5.2 Phiếu chấm (UPDATED)

```ts
interface IdeaCouncilScore {
  id: string;
  sessionId: string;
  ideaId: string;

  councilMemberId: string;
  councilMemberName: string;
  councilRole: 'CHU_TICH' | 'THU_KY' | 'UY_VIEN' | 'PHAN_BIEN';

  noveltyScore: number;
  noveltyComment: string;

  feasibilityScore: number;
  feasibilityComment: string;

  alignmentScore: number;
  alignmentComment: string;

  authorCapacityScore: number;
  authorCapacityComment: string;

  weightedScore: number; // auto-calc

  generalComment?: string;

  submitted: boolean;
  submittedAt?: string;

  createdAt: string;
  updatedAt: string;
}
```

---

## 6. Tổng hợp kết quả

```ts
interface IdeaCouncilResult {
  sessionId: string;
  ideaId: string;

  avgWeightedScore: number;

  avgNoveltyScore: number;
  avgFeasibilityScore: number;
  avgAlignmentScore: number;
  avgAuthorCapacityScore: number;

  submittedCount: number;
  memberCount: number;

  recommendation: 'PROPOSE_ORDER' | 'NOT_PROPOSE';
  thresholdScore: number; // 7.0
}
```

---

## 7. Mapping sang Ý tưởng

- `avgWeightedScore ≥ 7.0` → `PROPOSED_FOR_ORDER`
- Ngược lại → `REJECTED` (`HOI_DONG_DE_XUAT`)

---

## 8. UI yêu cầu

- Hiển thị **trọng số (%)** ngay tiêu đề tiêu chí
- Hiển thị **Điểm có trọng số** cuối form
- Không cho nhập tay weightedScore

---

## 9. Yêu cầu cho Cursor

- Áp dụng đúng trọng số
- Dùng avgWeightedScore xét đề xuất
- Không dùng tổng điểm 40
