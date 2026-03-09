/**
 * Modal gán vai trò nhanh cho user
 */
import { Modal, Select, message, Typography, Space, Descriptions } from 'antd';
import { useState, useEffect } from 'react';
import {
  assignRolesToUser,
  type IAMUserItem,
} from '@/services/api/iamUsers';
import type { RoleItem } from '@/services/api/roles';

const { Text } = Typography;

interface AssignRolesModalProps {
  visible: boolean;
  user: IAMUserItem | null;
  roleOptions: RoleItem[];
  onCancel: () => void;
  onSuccess: () => void;
}

const AssignRolesModal: React.FC<AssignRolesModalProps> = ({
  visible,
  user,
  roleOptions,
  onCancel,
  onSuccess,
}) => {
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setSelectedRoleIds(user.roles?.map((r) => r.id) || []);
    }
  }, [visible, user]);

  const handleOk = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await assignRolesToUser(user.id, { role_ids: selectedRoleIds });
      if (result?.data || result) {
        message.success('Cập nhật vai trò thành công');
        onSuccess();
      }
    } catch (error: any) {
      message.error(error?.message || 'Không thể cập nhật vai trò');
    } finally {
      setLoading(false);
    }
  };

  const activeRoles = roleOptions.filter((r) => r.status === 'ACTIVE');

  return (
    <Modal
      title="Gán vai trò cho người dùng"
      open={visible}
      onCancel={onCancel}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      width={500}
    >
      {user && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Username">
              <Text code>{user.username}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Họ tên">
              {user.full_name}
            </Descriptions.Item>
            <Descriptions.Item label="Đơn vị">
              {user.department?.name || <Text type="secondary">-</Text>}
            </Descriptions.Item>
          </Descriptions>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              Chọn vai trò:
            </Text>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="Chọn vai trò cho người dùng"
              value={selectedRoleIds}
              onChange={setSelectedRoleIds}
              options={activeRoles.map((r) => ({
                value: r.id,
                label: r.name,
              }))}
              filterOption={(input, option) =>
                (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
              }
              optionFilterProp="label"
            />
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default AssignRolesModal;
