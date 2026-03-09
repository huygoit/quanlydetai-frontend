/**
 * Form tạo/sửa người dùng
 */
import {
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { message, Divider } from 'antd';
import { useRef } from 'react';
import {
  createIAMUser,
  updateIAMUser,
  USER_STATUS_OPTIONS,
  type IAMUserItem,
  type DepartmentOption,
} from '@/services/api/iamUsers';
import type { RoleItem } from '@/services/api/roles';

interface UserFormProps {
  visible: boolean;
  editingRecord: IAMUserItem | null;
  departmentOptions: DepartmentOption[];
  roleOptions: RoleItem[];
  onCancel: () => void;
  onSuccess: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  visible,
  editingRecord,
  departmentOptions,
  roleOptions,
  onCancel,
  onSuccess,
}) => {
  const formRef = useRef<ProFormInstance>();
  const isEditing = !!editingRecord;

  const handleSubmit = async (values: any) => {
    try {
      if (isEditing) {
        const { password, confirmPassword, ...rest } = values;
        const updateData: Record<string, any> = {
          fullName: rest.fullName,
          department_id: rest.departmentId,
          role_ids: rest.roleIds,
          email: rest.email,
          status: rest.status,
        };
        const result = await updateIAMUser(editingRecord.id, updateData);
        if (result?.data || result) {
          message.success('Cập nhật người dùng thành công');
          onSuccess();
          return true;
        }
      } else {
        const createData = {
          fullName: values.fullName,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          password_confirmation: values.confirmPassword,
          department_id: values.departmentId,
          role_ids: values.roleIds || [],
          status: values.status,
        };
        if (values.username) createData.username = values.username;
        const result = await createIAMUser(createData as any);
        if (result?.data || result) {
          message.success('Tạo người dùng thành công');
          onSuccess();
          return true;
        }
      }
      return false;
    } catch (error: any) {
      message.error(error?.message || 'Có lỗi xảy ra');
      return false;
    }
  };

  return (
    <ModalForm
      key={editingRecord ? `edit-${editingRecord.id}` : 'create'}
      title={isEditing ? `Sửa người dùng: ${editingRecord.username}` : 'Thêm người dùng mới'}
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
          formRef.current?.resetFields();
        }
      }}
      formRef={formRef}
      initialValues={
        editingRecord
          ? {
              username: editingRecord.username,
              fullName: editingRecord.full_name || editingRecord.fullName,
              email: editingRecord.email,
              phone: editingRecord.phone,
              departmentId: editingRecord.department?.id || editingRecord.departmentId,
              roleIds: editingRecord.roles?.map((r) => r.id) || editingRecord.roleIds || [],
              status: editingRecord.status,
            }
          : {
              status: 'ACTIVE',
              roleIds: [],
            }
      }
      onFinish={handleSubmit}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
      }}
      submitter={{
        searchConfig: {
          submitText: 'Lưu',
          resetText: 'Hủy',
        },
      }}
      width={600}
      grid
      rowProps={{ gutter: 16 }}
    >
      <Divider orientation="left" plain style={{ marginTop: 0 }}>
        Thông tin tài khoản
      </Divider>

      <ProFormText
        name="fullName"
        label="Họ tên"
        placeholder="Nhập họ tên đầy đủ"
        colProps={{ span: 12 }}
        rules={[
          { required: true, message: 'Vui lòng nhập họ tên' },
          { max: 100, message: 'Họ tên tối đa 100 ký tự' },
        ]}
      />

      <ProFormText
        name="email"
        label="Email"
        placeholder="Nhập email"
        colProps={{ span: 12 }}
        rules={[
          { required: true, message: 'Vui lòng nhập email' },
          { type: 'email', message: 'Email không đúng định dạng' },
        ]}
      />

      {!isEditing && (
        <>
          <ProFormText.Password
            name="password"
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            colProps={{ span: 12 }}
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
            ]}
          />

          <ProFormText.Password
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            colProps={{ span: 12 }}
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
        </>
      )}

      <Divider orientation="left" plain>
        Thông tin tổ chức
      </Divider>

      <ProFormSelect
        name="departmentId"
        label="Đơn vị"
        placeholder="Chọn đơn vị"
        colProps={{ span: 12 }}
        options={departmentOptions.map((d) => ({ value: d.id, label: d.name }))}
        rules={[{ required: true, message: 'Vui lòng chọn đơn vị' }]}
        showSearch
        fieldProps={{
          filterOption: (input, option) =>
            (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase()),
        }}
      />

      <ProFormSelect
        name="status"
        label="Trạng thái"
        placeholder="Chọn trạng thái"
        colProps={{ span: 12 }}
        options={USER_STATUS_OPTIONS}
        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
      />

      <Divider orientation="left" plain>
        Phân quyền
      </Divider>

      <ProFormSelect
        name="roleIds"
        label="Vai trò"
        placeholder="Chọn vai trò"
        colProps={{ span: 24 }}
        mode="multiple"
        options={roleOptions
          .filter((r) => r.status === 'ACTIVE')
          .map((r) => ({ value: r.id, label: r.name }))}
        fieldProps={{
          filterOption: (input, option) =>
            (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase()),
        }}
      />
    </ModalForm>
  );
};

export default UserForm;
