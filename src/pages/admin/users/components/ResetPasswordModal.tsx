/**
 * Modal reset mật khẩu người dùng
 */
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { message, Typography, Alert } from 'antd';
import { useRef } from 'react';
import {
  resetIAMUserPassword,
  type IAMUserItem,
} from '@/services/api/iamUsers';

const { Text } = Typography;

interface ResetPasswordModalProps {
  visible: boolean;
  user: IAMUserItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  user,
  onCancel,
  onSuccess,
}) => {
  const formRef = useRef<ProFormInstance>();

  const handleSubmit = async (values: any) => {
    if (!user) return false;

    try {
      const result = await resetIAMUserPassword(user.id, {
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      if (result?.data || result) {
        message.success('Đặt lại mật khẩu thành công');
        onSuccess();
        return true;
      }
      return false;
    } catch (error: any) {
      message.error(error?.message || 'Không thể đặt lại mật khẩu');
      return false;
    }
  };

  return (
    <ModalForm
      key={user ? `reset-${user.id}` : 'reset'}
      title="Đặt lại mật khẩu"
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
          formRef.current?.resetFields();
        }
      }}
      formRef={formRef}
      onFinish={handleSubmit}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
      }}
      submitter={{
        searchConfig: {
          submitText: 'Đặt lại mật khẩu',
          resetText: 'Hủy',
        },
      }}
      width={450}
    >
      {user && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <span>
              Đặt lại mật khẩu cho: <Text strong>{user.full_name}</Text>{' '}
              (<Text code>{user.username}</Text>)
            </span>
          }
        />
      )}

      <ProFormText.Password
        name="password"
        label="Mật khẩu mới"
        placeholder="Nhập mật khẩu mới"
        rules={[
          { required: true, message: 'Vui lòng nhập mật khẩu mới' },
          { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
        ]}
      />

      <ProFormText.Password
        name="confirmPassword"
        label="Xác nhận mật khẩu"
        placeholder="Nhập lại mật khẩu mới"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Vui lòng xác nhận mật khẩu' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
            },
          }),
        ]}
      />
    </ModalForm>
  );
};

export default ResetPasswordModal;
