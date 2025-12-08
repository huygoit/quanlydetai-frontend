# SPEC – BRANDING LAYOUT (LOGO + TÊN HỆ THỐNG)

## 1. Mục tiêu

Chuẩn hoá hiển thị logo + tên hệ thống trong sider của Ant Design Pro / Umi Max:
- Logo + tên hệ thống phải **gọn gàng, chuyên nghiệp**.
- Khi sider bình thường: hiển thị logo + 2 dòng chữ.
- Khi sider thu gọn: chỉ hiển thị logo.
- Không dùng title mặc định, phải tự custom `menuHeaderRender`.

Tên hệ thống chuẩn:
**“Hệ thống Quản lý Khoa học & Công nghệ”**

## 2. Vị trí cấu hình
- File layout: `src/app.tsx`
- Style global: `src/global.less`
- Logo đặt tại: `public/logo-khcn.png`

## 3. Hành vi mong muốn
### Khi sider bình thường:
[LOGO]  Hệ thống Quản lý
        Khoa học & Công nghệ

### Khi sider thu gọn:
- Chỉ hiện logo, căn giữa.

## 4. Code yêu cầu trong `src/app.tsx`
```
import type { RunTimeLayoutConfig } from '@umijs/max';

export const layout: RunTimeLayoutConfig = () => {
  return {
    logo: '/logo-khcn.png',
    title: 'Hệ thống Quản lý KH&CN',
    menuHeaderRender: (logoDom, _titleDom, props) => {
      if (props?.collapsed) {
        return <div className="khcn-menu-header-collapsed">{logoDom}</div>;
      }
      return (
        <div className="khcn-menu-header">
          <div className="khcn-logo">{logoDom}</div>
          <div className="khcn-title-wrap">
            <div className="khcn-title-main">Hệ thống Quản lý</div>
            <div className="khcn-title-sub">Khoa học &amp; Công nghệ</div>
          </div>
        </div>
      );
    },
  };
};
```

## 5. CSS/LESS yêu cầu
```
.khcn-menu-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 12px;
}

.khcn-menu-header-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
}

.khcn-logo img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.khcn-title-wrap {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.khcn-title-main {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.khcn-title-sub {
  font-size: 11px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.6);
  white-space: nowrap;
}
```

## 6. Yêu cầu Cursor
- Thêm `menuHeaderRender` theo đúng JSX trên.
- Thêm đủ CSS.
- Không dùng title mặc định.
- Logo lấy từ `/logo-khcn.png`.
- Giữ nguyên cấu trúc layout.
