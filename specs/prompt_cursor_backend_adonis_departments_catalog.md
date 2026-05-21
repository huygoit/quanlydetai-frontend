# Prompt Cursor — Backend AdonisJS v6: API Catalog Departments (đọc chung)

> **Dùng kèm** `specs/api-departments-catalog-public.md` (hợp đồng API cho FE).  
> File này là **hướng dẫn triển khai Adonis** — đưa thẳng cho dev BE / Cursor backend.

---

## Bối cảnh

- Dự án: **AdonisJS v6** + Lucid ORM.
- Bảng: **`departments`** (đã có — Admin CRUD tại `/api/admin/departments`).
- Vấn đề: FE (hồ sơ khoa học, nhân sự, IAM…) cần **đọc danh mục ACTIVE** mà **không** bắt permission `department.view` / role Admin.
- Mục tiêu: Thêm route catalog **chỉ GET**, middleware **`auth`** (đã login), **không** middleware permission admin.

---

## API cần làm (khớp FE)

| Method | Route | Auth |
|--------|-------|------|
| GET | `/api/departments` | `auth` |
| GET | `/api/departments/options` | `auth` |
| GET | `/api/departments/:id` | `auth` (tùy chọn) |

**Không** thêm POST/PUT/PATCH/DELETE trên `/api/departments` — CRUD giữ `/api/admin/departments`.

---

## Query params (validate bằng Vine)

```ts
// ví dụ validator
{
  status: vine.enum(['ACTIVE', 'INACTIVE']).optional(),
  type: vine.enum(['UNIVERSITY','FACULTY','OFFICE','CENTER','BOARD','COUNCIL','OTHER']).optional(),
  scope: vine.enum(['all', 'khoa_phong_ban', 'truong']).optional(),
  keyword: vine.string().trim().optional(),
  page: vine.number().min(1).optional(),
  perPage: vine.number().min(1).max(1000).optional(),
  sortBy: vine.enum(['display_order', 'name', 'code']).optional(),
  order: vine.enum(['asc', 'desc']).optional(),
}
```

**Mặc định:**

- `status` = `ACTIVE` nếu không gửi.
- `scope` = `all` nếu không gửi.
- `sortBy` = `display_order`, `order` = `asc`.
- `/options`: không phân trang, `perPage` tối đa 1000 (hoặc bỏ paginate).

---

## Logic `scope` (service dùng chung)

```ts
const KHOA_PHONG_BAN_TYPES = ['FACULTY', 'OFFICE', 'CENTER', 'BOARD', 'COUNCIL', 'OTHER'] as const

function applyScope(query: ModelQueryBuilderContract<typeof Department>, scope: string) {
  if (scope === 'khoa_phong_ban') {
    query.whereIn('type', KHOA_PHONG_BAN_TYPES)
  } else if (scope === 'truong') {
    query.where('type', 'UNIVERSITY')
  }
  // scope === 'all' => không lọc thêm type
  return query
}
```

---

## Response format (bắt buộc khớp FE hiện tại)

FE đang expect **snake_case** và wrapper:

### List có phân trang — `GET /api/departments`

```json
{
  "success": true,
  "message": "Departments fetched successfully",
  "data": [
    {
      "id": 1,
      "code": "K_LH",
      "name": "Khoa Lý - Hóa",
      "short_name": "Khoa Lý - Hóa",
      "type": "FACULTY",
      "display_order": 10,
      "status": "ACTIVE"
    }
  ],
  "meta": {
    "total": 45,
    "perPage": 500,
    "currentPage": 1,
    "lastPage": 1
  }
}
```

### Options — `GET /api/departments/options`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "code": "K_LH",
      "name": "Khoa Lý - Hóa",
      "short_name": "Khoa Lý - Hóa",
      "type": "FACULTY"
    }
  ]
}
```

### Lỗi

- **401** — chưa auth (middleware auth).
- **422** — validation fail, body Adonis chuẩn:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "scope", "rule": "enum", "message": "..." }
  ]
}
```

FE đã xử lý `errors[]` trong `request.ts`.

---

## Gợi ý cấu trúc file Adonis

```
app/
  controllers/
    departments_catalog_controller.ts    # index, options, show
  validators/
    department_catalog_query.ts
  services/
    department_catalog_service.ts        # buildQuery, applyScope, keyword search
routes/
  api.ts                                 # hoặc routes/departments.ts
```

### Routes (ví dụ `start/routes.ts` hoặc group api)

```ts
router
  .group(() => {
    router.get('/', [DepartmentsCatalogController, 'index'])
    router.get('/options', [DepartmentsCatalogController, 'options'])
    router.get('/:id', [DepartmentsCatalogController, 'show'])
  })
  .prefix('/api/departments')
  .use(middleware.auth()) // CHỈ auth — KHÔNG department.view
```

**Lưu ý:** Khai báo route `/options` **trước** `/:id` để không bị nuốt param.

---

## Lucid query (gợi ý)

```ts
let query = Department.query().where('status', filters.status ?? 'ACTIVE')

query = applyScope(query, filters.scope ?? 'all')

if (filters.type) {
  query.where('type', filters.type)
}

if (filters.keyword) {
  const kw = `%${filters.keyword.trim()}%`
  query.where((q) => {
    q.whereILike('code', kw)
      .orWhereILike('name', kw)
      .orWhereILike('short_name', kw)
  })
}

query.orderBy(filters.sortBy ?? 'display_order', filters.order ?? 'asc')
```

**Model `Department`:** serialize JSON **snake_case** (`short_name`, `display_order`) — giống Admin API đang trả.

---

## Tách khỏi Admin controller

- **Không** copy toàn bộ `AdminDepartmentsController` — trích **query đọc** ra `DepartmentCatalogService`.
- Admin `index` có thể refactor sau để gọi chung service (tránh lệch logic).
- Catalog **không** trả `note`, `created_at`, `updated_at` ở `/options` (select cột tối thiểu).

---

## Phân quyền — quan trọng

| Route | Middleware |
|-------|------------|
| `/api/admin/departments/*` | `auth` + check `department.view` / create / update |
| `/api/departments/*` | **`auth` only** |

User NCV có `profile.update_own` nhưng **không** có `department.view` vẫn phải gọi được `/api/departments/options`.

---

## Test nhanh (curl)

```bash
# Sau login lấy token
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3333/api/departments/options?scope=khoa_phong_ban&status=ACTIVE"
```

---

## Checklist triển khai Adonis

- [ ] Route group `/api/departments` + `middleware.auth()` only
- [ ] Vine validator query
- [ ] `DepartmentCatalogService` + `scope` khoa_phong_ban / truong / all
- [ ] `index` paginate + meta giống admin list
- [ ] `options` không paginate, select id, code, name, short_name, type
- [ ] Response snake_case + `{ success, data, meta? }`
- [ ] 422 validation format có `errors[]`
- [ ] Không yêu cầu permission `department.view`
- [ ] (Tùy chọn) Feature test 2 route

---

## FE đã sẵn sàng

Sau khi deploy, FE gọi:

- `GET /api/departments/options?scope=khoa_phong_ban` — hồ sơ khoa học (`faculty`)
- `GET /api/departments/options?status=ACTIVE` — dropdown chung

File FE: `src/services/api/departments.ts` (`getDepartmentCatalogOptions`, `queryDepartmentCatalog`).

---

**Kết luận cho PM/BE:** Spec API (`api-departments-catalog-public.md`) = hợp đồng. File prompt này = cách làm trên Adonis v6 cho đúng convention dự án.
