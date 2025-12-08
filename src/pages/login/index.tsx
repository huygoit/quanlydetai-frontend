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
  Select,
  Typography,
  message,
  Space,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useModel, history } from '@umijs/max';
import type { UserRole } from '@/services/mock/homeMockService';
import styles from './index.less';

const { Title, Text } = Typography;

// Danh sách role với label hiển thị
const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'NCV', label: 'Nhà khoa học / Giảng viên / NCV' },
  { value: 'CNDT', label: 'Chủ nhiệm đề tài' },
  { value: 'TRUONG_DON_VI', label: 'Trưởng khoa' },
  { value: 'PHONG_KH', label: 'Phòng khoa học, CNTT và HTQT' },
  { value: 'HOI_DONG', label: 'Hội đồng' },
  { value: 'LANH_DAO', label: 'Lãnh đạo' },
  { value: 'ADMIN', label: 'Quản trị hệ thống' },
];

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
  role: UserRole;
  remember: boolean;
}

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { setInitialState } = useModel('@@initialState');

  // Handle login submit
  const handleSubmit = async (values: LoginFormValues) => {
    const { email, role, remember } = values;

    setLoading(true);

    // Simulate network delay (300-500ms)
    await new Promise((resolve) => setTimeout(resolve, 400));

    try {
      // Tạo user mock từ form
      const user = {
        email,
        role,
        name: email?.split('@')?.[0] || 'Người dùng demo',
        roleLabel: ROLE_LABELS[role],
      };

      // Lưu vào initialState
      await setInitialState((prev: any) => ({
        ...prev,
        currentUser: user,
      }));

      // Lưu vào localStorage nếu chọn "Ghi nhớ tôi"
      if (remember) {
        localStorage.setItem('khcn-current-user', JSON.stringify(user));
      }

      message.success(`Đăng nhập thành công! Xin chào ${user.name}`);

      // Redirect về Home
      history.push('/home');
    } catch (error) {
      message.error('Đăng nhập thất bại, vui lòng thử lại');
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
            role: 'CNDT',
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

          {/* Vai trò */}
          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              placeholder="Chọn vai trò"
              options={ROLE_OPTIONS}
              suffixIcon={<SafetyCertificateOutlined />}
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
          <Text type="secondary">
            Hệ thống Quản lý Khoa học & Công nghệ © 2025
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;

