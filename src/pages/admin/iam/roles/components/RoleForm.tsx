/**
 * Form tạo/sửa vai trò
 */
import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { message } from 'antd';
import { useRef } from 'react';
import {
  createRole,
  updateRole,
  ROLE_STATUS_OPTIONS,
  type RoleItem,
} from '@/services/api/roles';

interface RoleFormProps {
  visible: boolean;
  editingRecord: RoleItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const RoleForm: React.FC<RoleFormProps> = ({
  visible,
  editingRecord,
  onCancel,
  onSuccess,
}) => {
  const formRef = useRef<ProFormInstance>();

  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        const result = await updateRole(editingRecord.id, values);
        if (result?.data || result) {
          message.success('Cập nhật vai trò thành công');
          onSuccess();
          return true;
        }
      } else {
        const result = await createRole(values);
        if (result?.data || result) {
          message.success('Tạo vai trò thành công');
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
      title={editingRecord ? `Sửa vai trò: ${editingRecord.code}` : 'Thêm vai trò mới'}
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
              code: editingRecord.code,
              name: editingRecord.name,
              description: editingRecord.description,
              status: editingRecord.status,
            }
          : {
              status: 'ACTIVE',
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
      width={500}
    >
      <ProFormText
        name="code"
        label="Mã vai trò"
        placeholder="Nhập mã vai trò (VD: ADMIN, LECTURER)"
        rules={[
          { required: true, message: 'Vui lòng nhập mã vai trò' },
          { max: 50, message: 'Mã vai trò tối đa 50 ký tự' },
          { pattern: /^[A-Z0-9_]+$/, message: 'Mã chỉ gồm chữ in hoa, số và dấu _' },
        ]}
        fieldProps={{
          style: { textTransform: 'uppercase' },
        }}
        disabled={!!editingRecord}
      />
      <ProFormText
        name="name"
        label="Tên vai trò"
        placeholder="Nhập tên vai trò"
        rules={[
          { required: true, message: 'Vui lòng nhập tên vai trò' },
          { max: 100, message: 'Tên vai trò tối đa 100 ký tự' },
        ]}
        disabled={editingRecord?.code === 'BASIC'}
        fieldProps={
          editingRecord?.code === 'BASIC'
            ? { title: 'Vai trò hệ thống Basic không được đổi tên' }
            : undefined
        }
      />
      <ProFormTextArea
        name="description"
        label="Mô tả"
        placeholder="Nhập mô tả vai trò (không bắt buộc)"
        fieldProps={{
          rows: 3,
          maxLength: 500,
          showCount: true,
        }}
      />
      <ProFormSelect
        name="status"
        label="Trạng thái"
        placeholder="Chọn trạng thái"
        options={ROLE_STATUS_OPTIONS}
        rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
      />
    </ModalForm>
  );
};

export default RoleForm;
