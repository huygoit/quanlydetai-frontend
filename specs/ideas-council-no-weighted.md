# SPEC – HỘI ĐỒNG KHOA HỌC & ĐÀO TẠO (CHẤM ĐIỂM Ý TƯỞNG) – `specs/ideas-council.md`

> Mày nói đúng: **hội đồng đang chấm trên Ý TƯỞNG**, không phải ĐỀ TÀI.
> Vì vậy file spec này đặt là **`ideas-council.md`** (không dùng `projects-council.md`).
> `projects-council.md` chỉ dùng khi hội đồng chấm **hồ sơ đề tài** (giai đoạn sau).

---

## 1. Mục tiêu module

Module **Hội đồng KH&ĐT – Chấm điểm Ý tưởng** dùng để:
- Phòng KH tạo **đợt/phiên họp hội đồng** để xem xét các Ý tưởng đạt sơ loại.
- Hội đồng (chủ tịch/thư ký/ủy viên/phản biện) đọc hồ sơ ý tưởng, **chấm điểm theo 4 tiêu chí**, nhập nhận xét.
- Hệ thống tổng hợp điểm (trung bình) và đưa ra kết quả:
  - **Được đề xuất đặt hàng** (status: `PROPOSED_FOR_ORDER`)
  - Hoặc **Từ chối** (status: `REJECTED`, `rejectedStage = HOI_DONG_DE_XUAT`)
- Sau đó chuyển danh sách “Được đề xuất đặt hàng” sang bước **Lãnh đạo phê duyệt đặt hàng**.

---

## 2. Role & Access

### Roles liên quan
- `PHONG_KH` (tổ chức hội đồng, tổng hợp, khóa/mở phiên)
- `HOI_DONG` (chấm điểm)
- `LANH_DAO` (phê duyệt đặt hàng – module khác)
- `ADMIN` (toàn quyền)

### Access keys (đề xuất)
- `canManageIdeaCouncil` → Phòng KH / Admin (tạo phiên, phân công, khóa phiên, tổng hợp)
- `canScoreIdeaCouncil` → Hội đồng (chấm điểm, gửi phiếu)
- `canViewIdeaCouncilResult` → Phòng KH / Hội đồng / Lãnh đạo / Admin (xem kết quả)

---

## 3. Input & Điều kiện đầu vào

### 3.1 Ý tưởng đủ điều kiện vào hội đồng
Chỉ lấy các ý tưởng có:
- `status === 'APPROVED_INTERNAL'`

(Đây là kết quả bước Phòng KH sơ loại trong `ideas.md V3`)

### 3.2 Nguyên tắc
- Mỗi phiên hội đồng có danh sách ý tưởng riêng (có thể lấy từ bộ lọc)
- Một thành viên hội đồng có thể chấm nhiều ý tưởng trong cùng phiên

---

## 4. Thang điểm & tiêu chí chấm

### 4.1 4 tiêu chí bắt buộc (đúng yêu cầu)
1) **Tính mới, sáng tạo**  
2) **Tính khả thi**  
3) **Sự phù hợp định hướng chiến lược** (Nhà trường/ngành/xã hội)  
4) **Năng lực tác giả/nhóm tác giả**

### 4.2 Thang điểm (Version 1 – khuyến nghị)
- Mỗi tiêu chí: **0 – 10 điểm** (InputNumber hoặc Slider)
- Tổng điểm tối đa: **40 điểm**
- `totalScore` tự động tính = tổng 4 tiêu chí

> Version 2 (nâng cấp sau): có thể thêm trọng số (weight), nhưng V1 nên để cộng thẳng cho đơn giản.

### 4.3 Nhận xét bắt buộc
- Mỗi tiêu chí phải có **nhận xét** (TextArea ngắn)
- Có thêm **nhận xét chung** toàn phiếu (TextArea)

---

## 5. Model dữ liệu

### 5.1 Phiên hội đồng (CouncilSession)

```ts
type CouncilSessionStatus =
  | 'DRAFT'     // chuẩn bị
  | 'OPEN'      // đang chấm
  | 'CLOSED'    // đã khóa, không cho chấm nữa
  | 'PUBLISHED' // công bố kết quả (tùy)
;

interface CouncilSession {
  id: string;
  code: string;              // VD: HDYT-2025-01
  title: string;             // "Hội đồng chấm ý tưởng đợt 1/2025"
  year: number;
  meetingDate?: string;      // ngày họp dự kiến
  location?: string;
  status: CouncilSessionStatus;

  createdById: string;
  createdByName: string;

  memberCount: number;       // số thành viên
  ideaCount: number;         // số ý tưởng

  note?: string;

  createdAt: string;
  updatedAt: string;
}
```

### 5.2 Thành viên hội đồng (SessionMember)

```ts
type SessionMemberRole = 'CHU_TICH' | 'THU_KY' | 'UY_VIEN' | 'PHAN_BIEN';

interface SessionMember {
  id: string;
  sessionId: string;

  memberId: string;
  memberName: string;
  memberEmail?: string;

  roleInCouncil: SessionMemberRole;
  unit?: string;

  createdAt: string;
}
```

### 5.3 Liên kết Ý tưởng trong phiên (SessionIdea)

```ts
interface SessionIdea {
  id: string;
  sessionId: string;

  ideaId: string;
  ideaCode: string;
  ideaTitle: string;
  ownerName: string;
  ownerUnit: string;

  statusSnapshot: string; // snapshot status tại lúc thêm vào phiên (thường là APPROVED_INTERNAL)

  createdAt: string;
}
```

### 5.4 Phiếu chấm (IdeaCouncilScore)

```ts
interface IdeaCouncilScore {
  id: string;
  sessionId: string;
  ideaId: string;

  councilMemberId: string;
  councilMemberName: string;
  councilRole: SessionMemberRole;

  noveltyScore: number;        // 0–10
  noveltyComment: string;

  feasibilityScore: number;    // 0–10
  feasibilityComment: string;

  alignmentScore: number;      // 0–10
  alignmentComment: string;

  authorCapacityScore: number; // 0–10
  authorCapacityComment: string;

  totalScore: number;          // auto = sum 4 tiêu chí

  generalComment?: string;

  submitted: boolean;          // false = lưu tạm, true = đã gửi phiếu
  submittedAt?: string;

  createdAt: string;
  updatedAt: string;
}
```

### 5.5 Tổng hợp kết quả (IdeaCouncilResult)

```ts
interface IdeaCouncilResult {
  sessionId: string;
  ideaId: string;

  // tổng hợp
  avgTotalScore: number;          // điểm TB tổng
  avgNoveltyScore: number;
  avgFeasibilityScore: number;
  avgAlignmentScore: number;
  avgAuthorCapacityScore: number;

  submittedCount: number;         // số phiếu đã gửi
  memberCount: number;            // tổng số thành viên phiên

  // kết luận
  recommendation: 'PROPOSE_ORDER' | 'NOT_PROPOSE';
  recommendationNote?: string;    // ghi chú kết luận

  // ngưỡng cấu hình
  thresholdScore: number;         // mặc định 28/40
}
```

---

## 6. Business rules & Ngưỡng đề xuất đặt hàng

### 6.1 Ngưỡng đề xuất (default)
- `thresholdScore = 28` (tương đương 70% của 40)

### 6.2 Quy tắc khuyến nghị tự động
- Nếu `avgTotalScore >= thresholdScore` → `recommendation = PROPOSE_ORDER`
- Ngược lại → `recommendation = NOT_PROPOSE`

> Phòng KH có thể có quyền “override” recommendation bằng ghi chú (tuỳ chính sách). V1 có thể để auto, V2 mới cho override.

### 6.3 Điều kiện tổng hợp hợp lệ
- Chỉ tổng hợp khi phiên ở trạng thái `CLOSED` (đã khóa)
- Nếu `submittedCount < memberCount` vẫn cho tổng hợp nhưng phải hiển thị cảnh báo:
  - “Chưa đủ phiếu chấm”

---

## 7. Mapping sang trạng thái Ý tưởng (ideas.md V3 FINAL)

Khi phiên `CLOSED` và Phòng KH bấm “Cập nhật trạng thái ý tưởng theo kết quả”:

### 7.1 Nếu `recommendation = PROPOSE_ORDER`
- Update:
  - `idea.status = 'PROPOSED_FOR_ORDER'`

### 7.2 Nếu `recommendation = NOT_PROPOSE`
- Update:
  - `idea.status = 'REJECTED'`
  - `idea.rejectedStage = 'HOI_DONG_DE_XUAT'`
  - `idea.rejectedByRole = 'HOI_DONG'`
  - `idea.rejectedReason = 'Không đạt điểm hội đồng'` (hoặc note kết luận)
  - `idea.rejectedAt = now`

> ❌ Không có resubmit. Bị REJECTED là kết thúc.

---

## 8. UI / Pages & Routes (Umi Max)

### 8.1 Routes đề xuất
- `/council/ideas/sessions` – Danh sách phiên hội đồng
- `/council/ideas/sessions/:id` – Chi tiết phiên (ý tưởng + thành viên + tổng hợp)
- `/council/ideas/score/:sessionId/:ideaId` – Trang/Drawer chấm điểm cho 1 ý tưởng (theo member)

> Nếu mày muốn gọn, có thể làm chỉ 2 trang:
> - sessions list
> - session detail (trong đó mở Drawer chấm điểm)

### 8.2 Trang: Danh sách phiên – `/council/ideas/sessions`
- `ProTable<CouncilSession>`
- Columns:
  - Mã phiên (code)
  - Tên phiên (title)
  - Năm
  - Ngày họp
  - Trạng thái (badge)
  - Số ý tưởng
  - Số thành viên
  - Actions:
    - Xem chi tiết
    - Mở phiên / Khóa phiên (Phòng KH)
    - Công bố (optional)

- Nút:
  - `Tạo phiên hội đồng` (Phòng KH)

### 8.3 Trang: Chi tiết phiên – `/council/ideas/sessions/:id`

Layout đề xuất (Tabs):
- Tab 1: **Danh sách ý tưởng**
- Tab 2: **Thành viên hội đồng**
- Tab 3: **Kết quả tổng hợp**

#### Tab 1: Danh sách ý tưởng
- `ProTable<SessionIdea>`
- Filter:
  - Từ khóa (mã/tiêu đề)
  - Đơn vị
  - Lĩnh vực (nếu kéo từ Idea)
- Columns:
  - Mã ý tưởng
  - Tiêu đề
  - Tác giả
  - Đơn vị
  - Điểm TB (avgTotalScore) (nếu đã có)
  - Khuyến nghị (Đề xuất/Không)
  - Actions:
    - `Xem hồ sơ` (Drawer chi tiết Idea)
    - `Chấm điểm` (chỉ Hội đồng + phiên OPEN)
    - `Xem phiếu của tôi` (Hội đồng)
    - `Xem phiếu tất cả` (Phòng KH, khi CLOSED)

#### Tab 2: Thành viên hội đồng
- `ProTable<SessionMember>`
- Actions (Phòng KH):
  - Thêm thành viên
  - Xóa thành viên (khi session DRAFT)
  - Gán vai trò (CHU_TICH/THU_KY/...)

#### Tab 3: Kết quả tổng hợp
- Bảng tổng hợp theo từng ý tưởng:
  - avgTotalScore
  - avg từng tiêu chí
  - submittedCount/memberCount
  - recommendation
- Nút (Phòng KH):
  - `Tính tổng hợp` (recompute)
  - `Cập nhật trạng thái ý tưởng theo kết quả` (mapping sang status ideas)

---

## 9. UI: Form chấm điểm (Drawer/Modal) – bắt buộc

### 9.1 Điều kiện hiển thị
- Chỉ user thuộc `HOI_DONG` (member của session)
- Session status phải là `OPEN`
- Mỗi member chỉ có 1 phiếu/idea trong session (upsert)

### 9.2 Nội dung form
Cho từng tiêu chí:
- Điểm (0–10): InputNumber hoặc Slider
- Nhận xét: TextArea (bắt buộc)

Bố cục gợi ý:

1) Tính mới, sáng tạo  
   - Điểm: [0..10]
   - Nhận xét: …

2) Tính khả thi  
3) Phù hợp định hướng  
4) Năng lực tác giả

Cuối form:
- Tổng điểm (readonly): auto sum
- Nhận xét chung (optional)

Buttons:
- `Lưu tạm` → `submitted=false`
- `Gửi phiếu chấm` → confirm → `submitted=true`, set submittedAt

Validation:
- Điểm nằm trong 0..10
- Comment cho 4 tiêu chí: required
- Khi “Gửi phiếu chấm” phải pass validate

---

## 10. Mock service (frontend-only)

### 10.1 File đề xuất
- `src/services/ideaCouncil.ts`

### 10.2 API mock
```ts
// sessions
export async function queryIdeaCouncilSessions(params) {}
export async function createIdeaCouncilSession(data) {}
export async function updateIdeaCouncilSession(id, data) {}
export async function openSession(id) {}
export async function closeSession(id) {}

// members
export async function querySessionMembers(sessionId) {}
export async function addSessionMember(sessionId, member) {}
export async function removeSessionMember(sessionId, memberId) {}

// ideas in session
export async function querySessionIdeas(sessionId, params) {}
export async function addIdeasToSession(sessionId, ideaIds: string[]) {} // chỉ lấy ideas.status === APPROVED_INTERNAL

// scoring
export async function getMyScore(sessionId, ideaId, memberId) {}
export async function saveMyScoreDraft(payload: IdeaCouncilScore) {}     // submitted=false
export async function submitMyScore(payload: IdeaCouncilScore) {}         // submitted=true

// aggregation
export async function computeSessionResults(sessionId) {}
export async function applyResultsToIdeas(sessionId) {} // cập nhật idea.status: PROPOSED_FOR_ORDER hoặc REJECTED (HOI_DONG_DE_XUAT)
```

Data mock có thể lưu trong bộ nhớ:
- sessions[], sessionMembers[], sessionIdeas[], scores[], results[]

---

## 11. UX & Quy tắc chung

- Ngôn ngữ: **Tiếng Việt**
- Badge trạng thái phiên:
  - DRAFT: “Chuẩn bị”
  - OPEN: “Đang chấm”
  - CLOSED: “Đã khóa”
  - PUBLISHED: “Đã công bố” (optional)
- Cảnh báo khi chưa đủ phiếu chấm
- Sau khi CLOSED: khóa form, không cho sửa (trừ Admin, nếu cần)
- Nút thao tác quan trọng phải có confirm (Mở phiên/Khóa phiên/Cập nhật trạng thái)

---

## 12. Yêu cầu cho Cursor AI

Khi đọc `specs/ideas-council.md`, Cursor phải:
1. Tạo routes/pages theo mục 8 (tối thiểu: sessions list + session detail)
2. Dựng UI ProTable + Tabs + Drawer/Modal chấm điểm
3. Implement mock service `src/services/ideaCouncil.ts` với API ở mục 10
4. Điểm 4 tiêu chí 0–10 + comment bắt buộc
5. Tổng hợp avg + ngưỡng 28/40
6. Apply kết quả cập nhật trạng thái ý tưởng:
   - PROPOSED_FOR_ORDER hoặc REJECTED (rejectedStage=HOI_DONG_DE_XUAT)
7. Không tạo “converted” status trong ý tưởng
