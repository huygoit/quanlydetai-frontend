# SPEC API — Danh mục Học vị / Học hàm (Hồ sơ khoa học) — Catalog Read

## 1. Mục tiêu

- **Một nguồn sự thật** trên backend cho giá trị `degree` và `academicTitle` (validate `PUT /api/profile/me` và dropdown FE cùng danh sách).
- FE **bỏ** constant cứng `DEGREE_OPTIONS` / `ACADEMIC_TITLE_OPTIONS` sau khi API sẵn sàng.
- Cùng mô hình với catalog đơn vị: **chỉ GET**, user **đã đăng nhập**, **không** cần quyền Admin.

**Tham chiếu FE hiện tại:** `src/services/api/profile.ts` (type `Degree`, `AcademicTitle`).

**Tham chiếu nghiệp vụ:** `specs/scientific-profile.md` mục học vị / học hàm.

---

## 2. Phạm vi sử dụng

| Module | Field API | UI |
|--------|-----------|-----|
| Hồ sơ khoa học — tab Đào tạo & Công tác | `degree` | Select học vị |
| Hồ sơ khoa học — cùng tab | `academicTitle` | Select học hàm |
| Hồ sơ khoa học — header tag | `degree`, `academicTitle` | Hiển thị (không gọi API) |
| Danh sách / lọc hồ sơ | `degree` | Filter (sau này) |
| Hồ sơ nhân sự (admin) | `academicDegree`, `academicTitle` | **Tùy chọn** dùng chung catalog (phase 2) |

**Không nằm trong spec này:** `mainResearchArea` (lĩnh vực NC), `organization` (cơ quan ĐHĐN), `departments` (xem `specs/api-departments-catalog-public.md`).

---

## 3. Phân quyền

- **Yêu cầu:** Bearer token hợp lệ (đã login).
- **Không yêu cầu:** permission admin, `profile.verify`, v.v.
- **Read-only:** không POST/PUT/DELETE trên route catalog này.

---

## 4. API đề xuất (ưu tiên — một lần gọi)

### 4.1. Dropdown gộp (khuyến nghị)

```
GET /api/catalog/scientific-profile/options
```

**Mô tả:** Trả đủ học vị + học hàm cho form hồ sơ khoa học (một request khi mở tab Đào tạo & Công tác).

#### Response 200

```json
{
  "success": true,
  "message": "Scientific profile catalog options fetched successfully",
  "data": {
    "degrees": [
      {
        "value": "HIGH_SCHOOL",
        "label": "Tú tài",
        "description": "Tốt nghiệp Trung học Phổ thông.",
        "displayOrder": 1
      },
      {
        "value": "BACHELOR",
        "label": "Cử nhân",
        "description": "Tốt nghiệp đại học các khối ngành kinh tế, luật, xã hội và các ngành tương đương.",
        "displayOrder": 2
      },
      {
        "value": "MASTER",
        "label": "Thạc sĩ",
        "description": "Tốt nghiệp trình độ cao học.",
        "displayOrder": 3
      },
      {
        "value": "DOCTORATE",
        "label": "Tiến sĩ",
        "description": "Trình độ học vị nghiên cứu chuyên sâu, được cấp sau khi bảo vệ thành công luận án tiến sĩ.",
        "displayOrder": 4
      }
    ],
    "academicTitles": [
      { "value": "NONE", "label": "Không", "displayOrder": 1 },
      { "value": "ASSOCIATE_PROFESSOR", "label": "PGS", "displayOrder": 2 },
      { "value": "PROFESSOR", "label": "GS", "displayOrder": 3 }
    ]
  }
}
```

**Quy ước field:**

| Field | Bắt buộc | Ghi chú |
|-------|----------|---------|
| `value` | Có | Giá trị lưu DB / gửi `PUT /api/profile/me` — **trùng khít** enum validate BE |
| `label` | Có | Nhãn hiển thị Select (thường = `value`) |
| `description` | Có | Mô tả ngắn học vị — FE dùng `title` tooltip / hướng dẫn |
| `displayOrder` | Không | Sắp xếp tăng dần; mặc định thứ tự mảng |

**JSON:** `camelCase` (đồng bộ module profile), không snake_case.

#### Lỗi

| HTTP | Trường hợp |
|------|------------|
| 401 | Chưa đăng nhập |
| 500 | Lỗi server |

---

### 4.2. Tách từng nhóm (tùy chọn, nếu BE thích route nhỏ)

```
GET /api/catalog/scientific-profile/degrees/options
GET /api/catalog/scientific-profile/academic-titles/options
```

Response mỗi route:

```json
{
  "success": true,
  "data": [
    { "value": "Tiến sĩ", "label": "Tiến sĩ", "displayOrder": 4, "description": "..." }
  ]
}
```

FE ưu tiên **4.1**; chỉ dùng 4.2 nếu BE không muốn endpoint gộp.

---

## 5. Giá trị chuẩn (phase 1 — enum cố định)

BE **bắt buộc** đồng bộ với validate hiện tại trên model hồ sơ khoa học:

### 5.1. `degree` (học vị) — `value` = **key tiếng Anh**

| value (key) | label (VI) | displayOrder | description |
|-------------|------------|--------------|-------------|
| HIGH_SCHOOL | Tú tài | 1 | Tốt nghiệp Trung học Phổ thông. |
| BACHELOR | Cử nhân | 2 | Tốt nghiệp đại học các khối ngành kinh tế, luật, xã hội… |
| MASTER | Thạc sĩ | 3 | Tốt nghiệp trình độ cao học. |
| DOCTORATE | Tiến sĩ | 4 | Học vị NC sau bảo vệ luận án tiến sĩ. |

**Chốt:** `PUT /api/profile/me` lưu **key** (`degree: "DOCTORATE"`), không lưu nhãn tiếng Việt.

**Dữ liệu cũ:** Hồ sơ đang lưu `Khác` hoặc giá trị ngoài danh mục — BE/PM quyết định map thủ công (vd. `Khác` → `Cử nhân`) hoặc bắt NCV chọn lại khi sửa hồ sơ.

### 5.2. `academicTitle` (học hàm) — `value` = **key**

| value (key) | label (VI) | displayOrder | Ghi chú UI |
|-------------|------------|--------------|------------|
| NONE | Không | 1 | Không hiện tag header; xóa `academicTitleYear` |
| ASSOCIATE_PROFESSOR | PGS | 2 | Tag vàng |
| PROFESSOR | GS | 3 | Tag vàng |

### 5.3. `academicTitleYear` (năm đạt học hàm)

| Field API | Kiểu | Ghi chú |
|-----------|------|---------|
| `academicTitleYear` | integer \| null | Optional; 1900 … (năm hiện tại + 1) |
| `academic_title_year` | integer \| null | Cùng giá trị, snake_case trên response |

**Quy tắc:** `academicTitle: "NONE"` → BE set `academicTitleYear` = null. FE gửi `null` khi chọn Không.

**Không** thêm giá trị mới qua API nếu validator `PUT /api/profile/me` chưa cho phép — tránh FE chọn được nhưng lưu 422.

---

## 6. Cách triển khai Backend (gợi ý)

### Phase 1 (đủ cho FE — khuyến nghị làm trước)

- Khai báo enum / constant trong code Adonis (hoặc file config).
- Controller trả danh sách từ enum — **không cần bảng DB**.
- Validate `degree` / `academicTitle` trên profile **import cùng enum** (một file nguồn).

### Phase 2 (tùy chọn sau)

- Bảng `catalog_profile_options` (`group`, `value`, `label`, `display_order`, `status`).
- Trang Admin CRUD danh mục — khi đó mới cho phép mở rộng giá trị có kiểm soát.

---

## 7. Quy tắc nghiệp vụ

1. Catalog chỉ trả option **đang dùng** (phase 1 = tất cả enum).
2. Thứ tự ổn định: `displayOrder` ASC, rồi `value` ASC.
3. `label` có thể khác `value` sau này (VD value `TS`, label `Tiến sĩ`) — phase 1 giữ bằng nhau.
4. Không cache phía BE quá lâu nếu phase 2 có Admin sửa danh mục.
5. **Deprecate không bắt buộc:** FE giữ fallback constant đến khi API production ổn định.

---

## 8. FE sau khi BE xong (tham chiếu — team UI làm)

```ts
// src/services/api/profileCatalog.ts (dự kiến)
export type ProfileCatalogOption = {
  value: string;
  label: string;
  description?: string;
  displayOrder?: number;
};

export async function getScientificProfileCatalogOptions() {
  return get<ApiResponse<{
    degrees: ProfileCatalogOption[];
    academicTitles: ProfileCatalogOption[];
  }>>('/api/catalog/scientific-profile/options');
}
```

- `profile/me`: load một lần khi mở tab → map `value`/`label` vào `<Select>`.
- Service: `src/services/api/profileCatalog.ts` — `getScientificProfileCatalogOptions()`.
- Loader: `src/utils/profileCatalogOptions.ts` — `loadScientificProfileCatalogOptions()` (fallback `DEGREE_CATALOG` / `ACADEMIC_TITLE_OPTIONS` khi API lỗi).
- Form: `src/pages/profile/me/index.tsx` — tab Đào tạo & Công tác.

---

## 9. Checklist Backend

- [ ] `GET /api/catalog/scientific-profile/options` — auth login
- [ ] Response `data.degrees` + `data.academicTitles`, camelCase
- [ ] Giá trị `value` trùng validator `PUT /api/profile/me`
- [ ] Enum nguồn dùng chung cho API + validate (không duplicate khác file)
- [ ] Document OpenAPI / Postman
- [ ] (Tùy chọn) Route tách 4.2

---

## 10. Ví dụ curl

```bash
curl -H "Authorization: Bearer <token>" \
  "https://<host>/api/catalog/scientific-profile/options"
```

---

## 11. Liên quan tài liệu khác

| File | Nội dung |
|------|----------|
| `specs/api-departments-catalog-public.md` | Catalog khoa/phòng ban (`faculty`) |
| `specs/scientific-profile.md` | Model hồ sơ khoa học |
| `specs/prompt_cursor_backend_adonis_departments_catalog.md` | Mẫu triển khai Adonis (departments) |

---

**Phiên bản:** 1.2  
**Ngày:** 2026-05-21  
**Cập nhật 1.2:** Chốt 4 học vị: Tú tài, Cử nhân, Thạc sĩ, Tiến sĩ.  
**Người yêu cầu:** Team FE Hồ sơ khoa học — thay constant `DEGREE_OPTIONS` / `ACADEMIC_TITLE_OPTIONS`
