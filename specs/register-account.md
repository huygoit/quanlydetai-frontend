Bạn là senior frontend engineer Ant Design Pro (Umi + React + TS + ProComponents).

Mục tiêu:
- Thêm trang đăng ký /user/register
- Form gồm email, password, confirmPassword
- Call POST /api/auth/register
- Response thành công trả:
  { success:true, data:{ user:{...}, token:{ type:'bearer', token:'oat_...', expiresAt:{...} } } }
- Lưu token đúng theo login: token.token
- Redirect sau đăng ký tới: /profile/me?onboarding=1

==================================================
1) FILES
==================================================
A) Page:
src/pages/user/Register/index.tsx
(giống style Login page trong dự án: layout=false)

B) Service:
src/services/auth.ts
- register(payload)
(giữ coding style giống login service nếu đã có)

C) Token utils (nếu project chưa có):
src/utils/token.ts
- setToken(tokenStr)
- getToken()
- removeToken()
Lưu tokenStr vào localStorage key: "access_token"
(hoặc dùng key đang tồn tại trong project, hãy search "access_token" / "token" trong code và reuse đúng key)

==================================================
2) REGISTER PAGE UI
==================================================
- Dùng ProForm hoặc Form AntD cho giống Login.
Fields:
- Email (Input)
- Mật khẩu (Input.Password)
- Nhập lại mật khẩu (Input.Password)

Validation:
- email required + email format
- password required min 8
- confirmPassword must equal password (custom validator)

Button:
- Primary "Đăng ký"
- Link "Đã có tài khoản? Đăng nhập" -> /user/login

On submit:
- set loading
- call register()
- on success:
   - setToken(res.data.token.token)
   - (optional) save user in initialState/model if project uses it
   - message.success("Đăng ký thành công")
   - history.push('/profile/me?onboarding=1')
- on error:
   - message.error(err.message)

If already logged in:
- redirect /profile/me

==================================================
3) REQUEST / AUTH HEADER
==================================================
- Ensure request client attaches Authorization header:
  Authorization: Bearer <token>
If project already does this in utils/request.ts or app.ts, do not duplicate.
If not:
- modify request interceptor to read getToken() and set header.

==================================================
4) OUTPUT
==================================================
- Code đầy đủ Register page + auth service register
- Add link from Login page to Register
- Ensure routing works
Không sửa backend.