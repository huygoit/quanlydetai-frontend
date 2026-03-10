# Nhiệm vụ
Hãy xây dựng frontend **Ant Design Pro** cho module **Hồ sơ cá nhân** bám đúng API backend module `personal_profiles`.

## Bối cảnh dự án
- Frontend đang dùng **Ant Design Pro**
- Cấu trúc hiện tại theo hướng:
  - route trong `.umirc.ts`
  - page admin trong `src/pages/admin`
  - service API trong `src/services/api`
  - request wrapper trong `src/services/request.ts`
  - access từ `src/access.ts`
- Backend đã/đang có các API:
  - `GET /admin/personal-profiles`
  - `GET /admin/personal-profiles/:id`
  - `GET /admin/personal-profiles/user/:userId`
  - `POST /admin/personal-profiles`
  - `PUT /admin/personal-profiles/:id`
  - `PATCH /admin/personal-profiles/:id/status`

## Mục tiêu
Tạo màn quản lý **Hồ sơ cá nhân** trong khu vực admin, phục vụ:
- xem danh sách hồ sơ cá nhân
- tìm kiếm / lọc
- tạo mới
- cập nhật
- đổi trạng thái
- xem chi tiết nhanh nếu cần

## Phạm vi rất quan trọng
Đây là module **Hồ sơ cá nhân / nhân sự nền**, không phải module hồ sơ khoa học.

### Không làm ở màn này:
- publications
- research projects
- research interests
- awards khoa học
- CV công khai

---

# Yêu cầu giao diện tổng quát

## 1. Màn danh sách
Tạo page admin, ví dụ:
- `src/pages/admin/personal-profiles/index.tsx`

### UI chính
- `PageContainer`
- `ProTable`
- Modal hoặc Drawer cho create/edit

## 2. Các cột nên có trên table
- `staffCode`
- `fullName`
- `gender`
- `dateOfBirth`
- `phone`
- `workEmail`
- `department.name`
- `positionTitle`
- `academicDegree`
- `status`
- `updatedAt`
- `actions`

## 3. Search / filter trên table
- keyword: tìm theo `fullName`, `staffCode`, `phone`, `email`
- `departmentId`
- `status`

Nếu cần, map query params đúng backend:
- `keyword`
- `departmentId`
- `status`
- `page`
- `perPage`

---

# Form create / edit
Tạo form rõ ràng, chia section hợp lý.

## Section 1. Thông tin định danh
- `userId` (chọn user)
- `staffCode`
- `fullName`
- `gender`
- `dateOfBirth`
- `placeOfBirth`

## Section 2. Thông tin liên hệ
- `phone`
- `personalEmail`
- `workEmail`
- `address`

## Section 3. Thông tin tổ chức
- `departmentId`
- `positionTitle`
- `employmentType`

## Section 4. Thông tin chuyên môn nền
- `academicDegree`
- `academicTitle`
- `specialization`
- `professionalQualification`

## Section 5. Giấy tờ cơ bản
- `identityNumber`
- `identityIssueDate`
- `identityIssuePlace`

## Section 6. Trạng thái
- `status`
- `note`

---

# Yêu cầu form
- dùng `ModalForm` hoặc `DrawerForm` theo style source hiện tại
- create và edit dùng lại cùng component nếu hợp lý
- validate cơ bản ở frontend
- field names phải bám đúng API/backend
- nếu backend đang dùng camelCase ở response/request thì frontend dùng camelCase nhất quán

## Rule UX
- `userId` chỉ cho chọn khi tạo mới
- khi edit thì có thể disable `userId` nếu backend không cho đổi chủ hồ sơ
- `status` hiển thị bằng `Select`
- `gender` hiển thị bằng `Select`
- `departmentId` hiển thị bằng `Select`

---

# Dữ liệu select cần thiết
Hãy tận dụng service có sẵn nếu source đã có:
- users list đơn giản để chọn `userId`
- departments list để chọn `departmentId`

Nếu chưa có service lấy dropdown ngắn gọn, hãy dùng API list hiện có của user/department theo cách ít phá source nhất.

---

# Các action trên table
## Nên có
- Xem / Sửa
- Đổi trạng thái

## Có thể gộp
- nút `Thêm mới`
- nút `Sửa`
- dropdown action nếu source đang dùng pattern đó

## Chưa cần
- xóa cứng
- import excel
- export excel
- lịch sử thay đổi chi tiết

---

# Access / permission
Nếu frontend đã có access theo permission, tích hợp theo các key sau:
- `personal_profile.view`
- `personal_profile.create`
- `personal_profile.update`
- `personal_profile.change_status`

## Ẩn/hiện UI theo access
- chỉ hiện menu nếu có `personal_profile.view`
- chỉ hiện nút `Thêm mới` nếu có `personal_profile.create`
- chỉ hiện nút `Sửa` nếu có `personal_profile.update`
- chỉ hiện nút đổi trạng thái nếu có `personal_profile.change_status`

Nếu access trong source chưa có các key này thì thêm theo convention hiện tại.

---

# Service API frontend
Tạo service API tương ứng, ví dụ:
- `src/services/api/personalProfiles.ts`

## Các hàm cần có
- `getPersonalProfiles(params)`
- `getPersonalProfileById(id)`
- `getPersonalProfileByUserId(userId)`
- `createPersonalProfile(payload)`
- `updatePersonalProfile(id, payload)`
- `updatePersonalProfileStatus(id, payload)`

Hãy bám đúng wrapper request hiện tại của source frontend.

---

# Route / menu
Thêm route admin cho module này vào `.umirc.ts` theo convention hiện tại.

## Gợi ý
- path: `/admin/personal-profiles`
- name: `Hồ sơ cá nhân`
- access: `canViewPersonalProfiles` hoặc key tương ứng trong `access.ts`

Nếu menu admin đang có nhóm phù hợp thì đặt module này vào đúng nhóm.

---

# Access.ts
Nếu source đã dùng access theo permission, cập nhật thêm:
- `canViewPersonalProfiles`
- `canCreatePersonalProfile`
- `canEditPersonalProfile`
- `canChangePersonalProfileStatus`

Mapping gợi ý:
- `canViewPersonalProfiles` -> `personal_profile.view`
- `canCreatePersonalProfile` -> `personal_profile.create`
- `canEditPersonalProfile` -> `personal_profile.update`
- `canChangePersonalProfileStatus` -> `personal_profile.change_status`

---

# Kiểu dữ liệu frontend
Tạo type/interface rõ ràng, ví dụ:
- `PersonalProfileItem`
- `PersonalProfileFormValues`
- `PersonalProfileListParams`

## Field tối thiểu
- `id`
- `userId`
- `staffCode`
- `fullName`
- `gender`
- `dateOfBirth`
- `placeOfBirth`
- `phone`
- `personalEmail`
- `workEmail`
- `address`
- `departmentId`
- `department`
- `positionTitle`
- `employmentType`
- `academicDegree`
- `academicTitle`
- `specialization`
- `professionalQualification`
- `identityNumber`
- `identityIssueDate`
- `identityIssuePlace`
- `status`
- `note`
- `updatedAt`

---

# Coding style yêu cầu
- bám sát style source hiện tại
- ưu tiên clean UI, dễ maintain
- không over-engineering
- không tự thêm module Hồ sơ khoa học trong prompt này
- dùng lại component chung nếu source hiện tại đã có pattern phù hợp

---

# Yêu cầu đầu ra
Hãy thực hiện toàn bộ thay đổi cần thiết và trả về:

1. Danh sách file mới / file đã sửa
2. Giải thích ngắn gọn thay đổi
3. Nội dung code đầy đủ cho các file quan trọng
4. Nếu cần sửa `.umirc.ts`, `access.ts`, service API, page component thì đưa đầy đủ
5. Đảm bảo page chạy được, form submit được, list load được theo API backend

Hãy code hoàn chỉnh, nhất quán, chạy được.
