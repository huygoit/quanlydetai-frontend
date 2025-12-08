# SPEC – MÀN HÌNH LOGIN (EMAIL + MẬT KHẨU) & FLOW ROLE → HOME

## 1. Mục tiêu

Xây dựng **màn hình đăng nhập demo (mock)** cho hệ thống Quản lý Đề tài NCKH, với giao diện và hành vi giống hệ thống thật:

- Form đăng nhập có **Email + Mật khẩu** như hệ thống production.
- Người dùng **chọn Vai trò (role)** để mô phỏng phân quyền (vì chưa gọi backend).
- Sau khi đăng nhập:
  - Lưu thông tin user (mock) vào `initialState.currentUser` (và `localStorage` nếu chọn “Ghi nhớ tôi”).
  - Điều hướng tới **Home layout tương ứng** với role.

Không gọi backend, không kiểm tra mật khẩu thật – chỉ là **mock UI & flow** để:
- Test 3 layout Home,
- Demo cho người dùng cuối.

---

## 2. Route & file

- Đường dẫn: `/login`
- File trang login: `src/pages/login/index.tsx`
- Sau login thành công:
  - Gọi `setInitialState` để set `currentUser`.
  - Redirect tới `/home`.

Route gợi ý trong `.umirc.ts` hoặc `config.ts`:

```ts
{
  path: '/login',
  name: 'Đăng nhập',
  component: '@/pages/login',
  layout: false, // dùng layout riêng, không hiển thị menu trái khi login
}
```

---

## 3. Danh sách Role

Role sử dụng thống nhất toàn hệ thống (KHÔNG được đổi tên):

- `NCV`
- `CNDT`
- `TRUONG_DON_VI`
- `PHONG_KH`
- `HOI_DONG`
- `LANH_DAO`
- `ADMIN`

Label hiển thị thân thiện trên UI (gợi ý):

- `NCV` → "Giảng viên / Nhà khoa học (NCV)"
- `CNDT` → "Chủ nhiệm đề tài (CNĐT)"
- `TRUONG_DON_VI` → "Trưởng đơn vị"
- `PHONG_KH` → "Phòng Khoa học"
- `HOI_DONG` → "Hội đồng"
- `LANH_DAO` → "Lãnh đạo"
- `ADMIN` → "Quản trị hệ thống"

---

## 4. UI/UX trang Login

### 4.1 Bố cục

- Nền sáng, đơn giản, có thể thêm logo trường/hệ thống ở trên.
- Khối `Card` nằm giữa màn hình (theo chiều ngang và dọc).
- Card chứa:
  - Tiêu đề: **"Đăng nhập hệ thống Quản lý Đề tài NCKH"**
  - Mô tả nhỏ: **"Đây là bản demo, bạn có thể nhập email/mật khẩu bất kỳ và chọn vai trò."**
  - Form đăng nhập.

### 4.2 Các trường trong Form

Form sử dụng `Form` hoặc `ProForm` của Ant Design.

**1. Email**

- Label: `Email`
- Component: `Input`
- Placeholder: `"Nhập email"`
- Rules:
  - Bắt buộc: `"Vui lòng nhập email"`
  - Có thể thêm rule định dạng email (tùy dev)

**2. Mật khẩu**

- Label: `Mật khẩu`
- Component: `Input.Password`
- Placeholder: `"Nhập mật khẩu"`
- Rules:
  - Bắt buộc: `"Vui lòng nhập mật khẩu"`
- Không cần kiểm tra đúng/sai – bất kỳ mật khẩu nào cũng coi là hợp lệ nếu không rỗng.

**3. Vai trò**

- Label: `Vai trò`
- Component: `Select`
- Options: 7 role như phần 3.
- Rules:
  - Bắt buộc: `"Vui lòng chọn vai trò"`

**4. Ghi nhớ tôi**

- Component: `Checkbox`
- Label: `"Ghi nhớ tôi"`
- Nếu được tick:
  - Sau khi login, lưu user vào `localStorage`.

**5. Nút Đăng nhập**

- Label: `"Đăng nhập"`
- Type: `primary`
- Width: full (block)
- Có trạng thái `loading` 300–500ms khi submit (để cảm giác “đang xử lý”).

---

## 5. Logic login (mock)

### 5.1 Kiểu dữ liệu user

```ts
type UserRole =
  | 'NCV'
  | 'CNDT'
  | 'TRUONG_DON_VI'
  | 'PHONG_KH'
  | 'HOI_DONG'
  | 'LANH_DAO'
  | 'ADMIN';

interface CurrentUser {
  name: string;
  email: string;
  role: UserRole;
  unit?: string; // có thể để trống, sẽ cập nhật sau tại trang Hồ sơ
}
```

### 5.2 Tạo user mock từ form

Khi form valid và người dùng bấm "Đăng nhập":

- Lấy `email`, `password` (bỏ qua check đúng/sai), `role`.
- Tạo `name` mặc định từ email, ví dụ:  
  - Nếu email = `"nguyenvana@abc.com"` → name = `"nguyenvana"`  
  - Nếu không parse được, dùng `"Người dùng demo"`.

Ví dụ:

```ts
const user: CurrentUser = {
  email,
  role,
  name: email?.split('@')?.[0] || 'Người dùng demo',
};
```

### 5.3 Lưu vào initialState

Dùng model `@@initialState` của Umi Max:

```ts
const { initialState, setInitialState } = useModel('@@initialState');

await setInitialState((s) => ({
  ...s,
  currentUser: user,
}));
```

### 5.4 Lưu vào localStorage (nếu chọn “Ghi nhớ tôi”)

Nếu checkbox `remember` được tick:

```ts
localStorage.setItem('khcn-current-user', JSON.stringify(user));
```

### 5.5 Redirect sau login

Sau khi lưu user thành công vào initialState:

```ts
history.push('/home'); // hoặc useNavigate nếu dùng hooks tương ứng
```

---

## 6. Mapping Role → Home layout

Trang `src/pages/home/index.tsx` phải chọn layout theo role như sau:

```ts
const role = initialState?.currentUser?.role || 'NCV';

if (role === 'PHONG_KH' || role === 'HOI_DONG') {
  return <HomeForPhongKH />;
}

if (role === 'LANH_DAO' || role === 'ADMIN') {
  return <HomeForLanhDao />;
}

// NCV, CNDT, TRUONG_DON_VI và mặc định
return <HomeForCNDT />;
```

Cursor **phải tôn trọng mapping này**, không được tự ý đổi.

---

## 7. Logic Logout

Logout nên được đặt trong:

- Avatar dropdown góc trên phải, hoặc
- Menu “Tài khoản” → “Đăng xuất”.

Khi người dùng chọn “Đăng xuất”:

1. Xoá user khỏi localStorage:

```ts
localStorage.removeItem('khcn-current-user');
```

2. Xoá khỏi initialState:

```ts
setInitialState((s) => ({
  ...s,
  currentUser: undefined,
}));
```

3. Điều hướng về `/login`:

```ts
history.push('/login');
```

---

## 8. Trạng thái “chưa đăng nhập”

Khi người dùng truy cập các route cần bảo vệ (ví dụ `/home`, `/projects`, `/ideas`, …):

- Nếu `initialState.currentUser` không tồn tại,
- Và không có user trong localStorage,

Hệ thống phải:

- Redirect về `/login`.

Điều này có thể được cấu hình:

- Trong `app.ts` (`getInitialState` đọc localStorage và set `currentUser` nếu có), hoặc
- Trong layout hoặc route guard.

---

## 9. Hỗ trợ “Ghi nhớ tôi” với localStorage + getInitialState

Mô tả cách sử dụng localStorage khi load app:

1. Trong `getInitialState` (thường ở `src/app.ts`):

   - Đọc key `khcn-current-user` từ localStorage,
   - Nếu có, parse JSON và đặt làm `currentUser` mặc định.

   Ví dụ pseudo-code:

   ```ts
   export async function getInitialState(): Promise<{
     currentUser?: CurrentUser;
   }> {
     const local = localStorage.getItem('khcn-current-user');
     if (local) {
       try {
         const user = JSON.parse(local);
         return { currentUser: user };
       } catch (e) {
         console.error(e);
       }
     }
     return { currentUser: undefined };
   }
   ```

2. Khi đã có `currentUser` từ getInitialState:
   - Home sẽ render đúng layout theo role.

---

## 10. Yêu cầu Cursor khi generate code

Cursor phải:

1. Tạo file `src/pages/login/index.tsx` với UI đầy đủ:
   - Email
   - Mật khẩu
   - Vai trò
   - Ghi nhớ tôi
   - Nút Đăng nhập

2. Dùng Ant Design (Form, Input, Input.Password, Select, Checkbox, Button).

3. Không gọi bất kỳ API backend nào; tất cả login là mock.

4. Tích hợp với `@@initialState`:
   - Đọc và set `currentUser`.

5. Lưu user vào localStorage nếu chọn “Ghi nhớ tôi”.

6. Redirect đúng `/home` sau khi login.

7. Áp dụng mapping role → Home layout như mục 6.

8. Sinh logic Logout (xóa localStorage + initialState + redirect).

9. Toàn bộ label, placeholder, message validate sử dụng **Tiếng Việt**.

---

## 11. Lưu ý

- Email & Mật khẩu chỉ là mock, mục đích là **UI giống thật để gây ấn tượng với người dùng**.
- Role vẫn phải chọn thủ công trên màn hình login trong giai đoạn chưa có backend.
- Về sau, nếu có API đăng nhập thật:
  - Có thể bỏ Select role,
  - Role sẽ lấy từ backend, nhưng phần còn lại của flow (Home layout, logout, nhớ tài khoản) vẫn dùng được.
