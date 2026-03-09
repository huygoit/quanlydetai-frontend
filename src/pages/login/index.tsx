/**
 * Trang Đăng nhập
 * Theo specs/auth-login.md
 */
import { useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Form,
  Input,
  Typography,
  message,
} from 'antd';
import {
  LockOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { history, Link } from '@umijs/max';
import type { UserRole } from '@/services/mock/homeMockService';
import { login } from '@/services/api/auth';
import styles from './index.less';

const { Title, Text } = Typography;

// Role label mapping
const ROLE_LABELS: Record<UserRole, string> = {
  NCV: 'Nhà khoa học / Giảng viên / NCV',
  CNDT: 'Chủ nhiệm đề tài',
  TRUONG_DON_VI: 'Trưởng khoa',
  PHONG_KH: 'Phòng khoa học, CNTT và HTQT',
  HOI_DONG: 'Hội đồng',
  LANH_DAO: 'Lãnh đạo',
  ADMIN: 'Quản trị hệ thống',
};

// Form values interface
interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Handle login submit
  const handleSubmit = async (values: LoginFormValues) => {
    const { email, password, remember } = values;

    setLoading(true);

    try {
      const response = await login({ email, password });

      if (response.success && response.data) {
        const userData = response.data.user;
        const user = {
          email: userData.email,
          role: userData.role,
          name: userData.fullName,
          roleLabel: ROLE_LABELS[userData.role],
        };
        if (remember) {
          localStorage.setItem('khcn-current-user', JSON.stringify(user));
        }
        message.success(`Đăng nhập thành công! Xin chào ${user.name}`);
        // Redirect + reload để getInitialState chạy lại và fetch full profile + permissions
        window.location.href = '/home';
      } else {
        message.error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      const errorMsg = error?.data?.message || 'Đăng nhập thất bại, vui lòng thử lại';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      {/* Background decoration */}
      <div className={styles.bgDecoration} />

      {/* Login Card */}
      <Card className={styles.loginCard} bordered={false}>
        {/* Logo & Header */}
        <div className={styles.header}>
          <div className={styles.logoWrapper}>
            <img
              src="/logo.png"
              alt="Logo"
              className={styles.logo}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <Title level={3} className={styles.title}>
            Đăng nhập hệ thống
          </Title>
          <Title level={5} className={styles.subtitle}>
            Quản lý đề tài nghiên cứu khoa học
          </Title>
        </div>

        {/* Login Form */}
        <Form
          form={form}
          name="login"
          onFinish={handleSubmit}
          layout="vertical"
          initialValues={{
            remember: true,
          }}
          size="large"
        >
          {/* Email */}
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<MailOutlined className={styles.inputIcon} />}
              placeholder="Nhập email"
              autoComplete="email"
            />
          </Form.Item>

          {/* Mật khẩu */}
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>

          {/* Ghi nhớ tôi */}
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>Ghi nhớ tôi</Checkbox>
          </Form.Item>

          {/* Nút Đăng nhập */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className={styles.loginButton}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        {/* Footer */}
        <div className={styles.footer}>
          <Text type="secondary">Chưa có tài khoản? </Text>
          <Link to="/register">Đăng ký</Link>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              Hệ thống Quản lý Khoa học & Công nghệ © 2025
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;

