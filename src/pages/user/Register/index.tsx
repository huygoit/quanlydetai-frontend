/**
 * Trang Đăng ký
 * Theo specs/register-account.md
 */
import { useState, useEffect } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  message,
} from 'antd';
import {
  LockOutlined,
  MailOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useModel, history, Link } from '@umijs/max';
import { getToken, setToken } from '@/services/request';
import type { UserRole } from '@/services/mock/homeMockService';
import { register } from '@/services/api/auth';
import styles from './index.less';

const { Title, Text } = Typography;

const ROLE_LABELS: Record<UserRole, string> = {
  NCV: 'Nhà khoa học / Giảng viên / NCV',
  CNDT: 'Chủ nhiệm đề tài',
  TRUONG_DON_VI: 'Trưởng khoa',
  PHONG_KH: 'Phòng khoa học, CNTT và HTQT',
  HOI_DONG: 'Hội đồng',
  LANH_DAO: 'Lãnh đạo',
  ADMIN: 'Quản trị hệ thống',
};

interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');

  // Nếu đã đăng nhập (có token + currentUser) -> redirect /profile/me
  useEffect(() => {
    const token = getToken();
    if (token && initialState?.currentUser) {
      history.replace('/profile/me');
    }
  }, [initialState?.currentUser]);

  const handleSubmit = async (values: RegisterFormValues) => {
    const { email, password, confirmPassword } = values;

    setLoading(true);

    try {
      const response = await register({ email, password, confirmPassword });

      if (response.success && response.data) {
        const { user, token } = response.data;

        setToken(token.token);

        const currentUser = {
          email: user.email,
          role: user.role,
          name: user.fullName || user.email,
          roleLabel: ROLE_LABELS[user.role],
        };
        localStorage.setItem('khcn-current-user', JSON.stringify(currentUser));

        await setInitialState((prev: any) => ({
          ...prev,
          currentUser,
        }));

        history.replace('/profile/me?onboarding=1');
      } else {
        message.error(response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      // request.ts đã hiển thị message cho lỗi API (có error.response); chỉ hiện khi lỗi khác (vd: mạng)
      if (!error?.response) {
        message.error(error?.message || 'Đăng ký thất bại, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.bgDecoration} />

      <Card className={styles.registerCard} bordered={false}>
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
            Đăng ký tài khoản
          </Title>
          <Title level={5} className={styles.subtitle}>
            Hệ thống Quản lý Khoa học & Công nghệ
          </Title>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          layout="vertical"
          size="large"
        >
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

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="Nhập mật khẩu"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Nhập lại mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu không trùng khớp'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              icon={<UserAddOutlined />}
              className={styles.registerButton}
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <div className={styles.footer}>
          <Text type="secondary">Đã có tài khoản? </Text>
          <Link to="/login" style={{ marginLeft: 4 }}>Đăng nhập</Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
