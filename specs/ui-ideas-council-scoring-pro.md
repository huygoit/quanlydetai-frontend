# SPEC UI – CHẤM ĐIỂM HỘI ĐỒNG (PRO, KHÔNG SCROLL) – `specs/ui/ideas-council-scoring-pro.md`

> Mục tiêu: Form chấm điểm **đẹp – gọn – không scroll**, hội đồng dùng “sướng”, đúng Ant Design Pro/Umi Max.

---

## 1) Mục tiêu UX (CHỐT)

1. **Không scroll** trong modal/drawer ở màn hình laptop phổ biến (1366×768, 1440×900).
2. Nhìn 1 phát thấy:
   - 4 tiêu chí + trọng số
   - Điểm tổng có trọng số (0–10)
   - Tình trạng hợp lệ để “Gửi phiếu”
3. Nhập nhanh, ít thao tác chuột:
   - Điểm nhập bằng InputNumber (hoặc Slider tuỳ)
   - Nhận xét ngắn, không cần văn dài

---

## 2) Layout tổng thể (NO-SCROLL)

### 2.1 Container
- Dùng **Modal** hoặc **Drawer** đều được, ưu tiên Modal cho “focus”.
- Size đề xuất:
  - `width: 1000~1100px`
  - `bodyStyle: { padding: 16 }`
  - `style/top: 32`
  - `height` hiển thị theo `80vh`

### 2.2 Bố cục 2 cột
- **Cột trái (70%)**: 4 tiêu chí chấm điểm
- **Cột phải (30%)**: Summary sticky + nút hành động

Grid:
- `Row gutter={16}`
- `Col span={16}` (trái)
- `Col span={8}` (phải)

---

## 3) Header (tối giản, pro)

### 3.1 Thông tin ý tưởng (1–2 dòng)
Trong phần đầu modal (không chiếm nhiều chiều cao):
- Dòng 1: **Mã + Tiêu đề** (bold)
- Dòng 2: Tác giả · Đơn vị · Lĩnh vực (cở vừa và rõ)

Không hiển thị quá nhiều metadata để tránh “lom com”.

---

## 4) Cột trái – 4 tiêu chí (gọn, đồng nhất)

### 4.1 Tiêu chí & trọng số (fixed)
- Tính mới, sáng tạo (30%)
- Tính khả thi (30%)
- Phù hợp định hướng (20%)
- Năng lực tác giả (20%)

### 4.2 Mỗi tiêu chí là 1 `Card size="small"`
**Không dùng TextArea cao**, để tránh scroll.

Mỗi card gồm:
- Title: `Tên tiêu chí` + Tag `% trọng số`
- Subtitle cở vừa và rõ (mô tả 1 câu) (optional)
- Content: Grid 2 cột:
  - Trái: Điểm (InputNumber 0–10)
  - Phải: Nhận xét (TextArea rows=2)

**Chuẩn component gợi ý (AntD/Pro):**
- `Card`, `Tag`
- `Form.Item`
- `InputNumber`
- `Input.TextArea`
- `Row/Col`

### 4.3 Quy chuẩn chiều cao (để NO-SCROLL)
- TextArea: `rows={2}` (tối đa 3 nếu màn hình lớn)
- Form.Item: `marginBottom: 8`
- Card: `marginBottom: 12`
- Không dùng divider lớn / description dài.

### 4.4 Validation (bắt buộc)
- `score`: required, min=0, max=10
- `comment`: required, minLength=10 (khuyến nghị), maxLength=500 (tùy)
- Khi bấm **Gửi phiếu** phải validate full.

---

## 5) Cột phải – Summary sticky (điểm nhấn PRO)

### 5.1 Summary Card (sticky)
- Dùng `Card` + `Affix` hoặc CSS `position: sticky; top: 16px;`
- Nội dung:

1) **Điểm tổng theo trọng số** (to, đậm)
- Hiển thị dạng: `7.6 / 10`
- Tự tính realtime:
  ```text
  weightedScore = novelty*0.30 + feasibility*0.30 + alignment*0.20 + authorCapacity*0.20
  ```

2) **Ngưỡng đề xuất**
- Hiển thị: `≥ 7.0`

3) **Trạng thái hợp lệ**
- Checklist realtime:
  - ✔ Đủ 4 điểm
  - ✔ Đủ 4 nhận xét
  - ✔ Điểm hợp lệ 0–10
- Nếu chưa đủ: show warning “Chưa thể gửi phiếu”.

4) **Kết luận gợi ý (optional)**
- Nếu `weightedScore >= 7.0`: “Đề xuất đặt hàng”
- Else: “Không đề xuất”

### 5.2 Actions (nút hành động)
Đặt trong Summary Card, cuối card:
- `Lưu tạm`
- `Gửi phiếu chấm`
- Confirm khi gửi:
  - “Bạn chắc chắn muốn gửi phiếu? Sau khi gửi sẽ không sửa được.”
- Disable `Gửi` nếu form invalid.

---

## 6) Hành vi trạng thái (DRAFT / SUBMITTED)

### 6.1 Lưu tạm (draft)
- `submitted=false`
- Cho phép mở lại và sửa tiếp.

### 6.2 Gửi phiếu
- `submitted=true`
- `submittedAt=now`
- Sau khi submit:
  - Form chuyển sang read-only (khuyến nghị)

---

## 7) UI States (loading/empty/error)

- Loading: dùng `Skeleton` hoặc `Spin`
- Empty idea data: `Empty`
- Error: `Alert type="error"`

---

## 8) Responsive

- >= 1200px: 2 cột (16/8)
- < 1200px: 1 cột (Summary xuống dưới)

---

## 9) Checklist cho Cursor AI (BẮT BUỘC)

Cursor khi implement phải:
1. Layout 2 cột **NO-SCROLL**
2. 4 card tiêu chí:
   - InputNumber 0–10
   - TextArea rows=2, required
   - Tag trọng số
3. Summary sticky tính `weightedScore` realtime (0–10)
4. Disable “Gửi phiếu” nếu invalid
5. Confirm khi submit
6. Sau submit: read-only

---

## 10) Pseudo-code gợi ý

```tsx
<Modal width={1100} bodyStyle={{padding:16}}>
  <HeaderCompact idea={idea} />

  <Row gutter={16}>
    <Col span={16}>
      <Form form={form} layout="vertical">
        <CriteriaCard code="NOVELTY" weight={0.3} />
        <CriteriaCard code="FEASIBILITY" weight={0.3} />
        <CriteriaCard code="ALIGNMENT" weight={0.2} />
        <CriteriaCard code="AUTHOR_CAPACITY" weight={0.2} />
      </Form>
    </Col>

    <Col span={8}>
      <div style={{position:'sticky', top:16}}>
        <SummaryCard
          weightedScore={weightedScore}
          threshold={7.0}
          valid={isValid}
          onSaveDraft={...}
          onSubmit={...}
        />
      </div>
    </Col>
  </Row>
</Modal>
```
