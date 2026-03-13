/**
 * Drawer quản lý vai trò của user
 */
import {
  Drawer,
  List,
  Tag,
  Button,
  Space,
  Select,
  Spin,
  message,
  Popconfirm,
  Empty,
  Divider,
  Typography,
  Switch,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import {
  getUserRoles,
  assignRoleToUser,
  updateAssignmentStatus,
  removeUserRole,
  type UserRoleAssignment,
} from '@/services/api/userRoles';
import type { IAMUserItem } from '@/services/api/iamUsers';
import { queryRoles, type RoleItem } from '@/services/api/roles';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface UserRoleDrawerProps {
  visible: boolean;
  user: IAMUserItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserRoleDrawer: React.FC<UserRoleDrawerProps> = ({
  visible,
  user,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (visible && user) {
      loadData();
    }
  }, [visible, user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [assignmentsRes, rolesRes] = await Promise.all([
        getUserRoles(user.id),
        queryRoles({ status: 'ACTIVE', perPage: 100 }),
      ]);

      if (assignmentsRes?.data) {
        setAssignments(assignmentsRes.data);
      }

      if (rolesRes?.data) {
        setAvailableRoles(rolesRes.data);
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!user || !selectedRoleId) {
      message.warning('Vui lòng chọn vai trò');
      return;
    }

    const alreadyAssigned = assignments.some((a) => (a.role_id ?? a.roleId) === selectedRoleId);
    if (alreadyAssigned) {
      message.warning('Vai trò này đã được gán cho người dùng');
      return;
    }

    setAssigning(true);
    try {
      const result = await assignRoleToUser(user.id, {
        role_id: selectedRoleId,
        is_active: true,
      });

      if (result?.data || result) {
        message.success('Gán vai trò thành công');
        setSelectedRoleId(null);
        loadData();
        onSuccess();
      }
    } catch (error: any) {
      message.error(error?.message || 'Không thể gán vai trò');
    } finally {
      setAssigning(false);
    }
  };

  const handleToggleStatus = async (assignment: UserRoleAssignment) => {
    if (!user) return;
    const assignmentId = assignment.id ?? assignment.assignmentId;
    if (assignmentId == null) {
      message.error('Không thể cập nhật: thiếu ID assignment');
      return;
    }

    try {
      const currentlyActive = assignment.is_active ?? assignment.isActive ?? false;
      const result = await updateAssignmentStatus(user.id, assignmentId, {
        is_active: !currentlyActive,
      });

      if (result?.data || result) {
        message.success(
          (assignment.is_active ?? assignment.isActive) ? 'Đã tắt vai trò' : 'Đã bật vai trò'
        );
        loadData();
        onSuccess();
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? error?.data?.message ?? error?.message ?? 'Không thể cập nhật trạng thái';
      message.error(msg);
      console.error('[updateAssignmentStatus]', { userId: user.id, assignmentId, error });
    }
  };

  const handleRemoveRole = async (assignment: UserRoleAssignment) => {
    if (!user) return;

    try {
      const assignmentId = assignment.id ?? assignment.assignmentId;
      if (assignmentId == null) {
        message.error('Không thể thu hồi: thiếu ID assignment');
        return;
      }
      const result = await removeUserRole(user.id, assignmentId);

      if (result?.data || result) {
        message.success('Đã thu hồi vai trò');
        loadData();
        onSuccess();
      }
    } catch (error: any) {
      message.error(error?.message || 'Không thể thu hồi vai trò');
    }
  };

  const assignedRoleIds = assignments.map((a) => a.role_id ?? a.roleId).filter(Boolean);
  const unassignedRoles = availableRoles.filter(
    (role) => !assignedRoleIds.includes(role.id)
  );

  return (
    <Drawer
      title={
        <Space>
          <Avatar icon={<UserOutlined />} />
          <span>Quản lý vai trò: {user?.full_name ?? user?.fullName ?? '-'}</span>
        </Space>
      }
      placement="right"
      width={500}
      open={visible}
      onClose={onClose}
      styles={{ body: { paddingTop: 0 } }}
    >
      <Spin spinning={loading}>
        {user && (
          <>
            <div style={{ marginBottom: 16, padding: '12px', background: '#fafafa', borderRadius: 8 }}>
              <Text type="secondary">Email: </Text>
              <Text>{user.email}</Text>
              <br />
              <Text type="secondary">Đơn vị: </Text>
              <Text>{user.department?.name || '-'}</Text>
            </div>

            <Divider orientation="left">Gán vai trò mới</Divider>

            <Space.Compact style={{ width: '100%', marginBottom: 24 }}>
              <Select
                style={{ flex: 1 }}
                placeholder="Chọn vai trò để gán"
                value={selectedRoleId}
                onChange={setSelectedRoleId}
                options={unassignedRoles.map((role) => ({
                  value: role.id,
                  label: (
                    <Space>
                      <span>{role.name}</span>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({role.code})
                      </Text>
                    </Space>
                  ),
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label?.toString() || '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                notFoundContent={
                  unassignedRoles.length === 0
                    ? 'Không còn vai trò nào để gán'
                    : 'Không tìm thấy vai trò'
                }
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAssignRole}
                loading={assigning}
                disabled={!selectedRoleId}
              >
                Gán
              </Button>
            </Space.Compact>

            <Divider orientation="left">
              Vai trò hiện tại ({assignments.length})
            </Divider>

            {assignments.length > 0 ? (
              <List
                dataSource={assignments}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Switch
                        key="switch"
                        checked={item.is_active}
                        onChange={() => handleToggleStatus(item)}
                        checkedChildren="Bật"
                        unCheckedChildren="Tắt"
                      />,
                      <Popconfirm
                        key="delete"
                        title="Thu hồi vai trò"
                        description="Bạn có chắc muốn thu hồi vai trò này?"
                        onConfirm={() => handleRemoveRole(item)}
                        okText="Thu hồi"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{item.role?.name ?? item.roleName ?? item.roleCode ?? `Role #${item.role_id ?? item.roleId ?? item.id ?? item.assignmentId}`}</span>
                          <Tag color={(item.is_active ?? item.isActive) ? 'green' : 'default'}>
                            {(item.is_active ?? item.isActive) ? 'Đang hoạt động' : 'Đã tắt'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={0}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Mã: {item.role?.code ?? item.roleCode ?? '-'}
                          </Text>
                          {item.created_at && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Gán lúc: {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
                            </Text>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Chưa có vai trò nào được gán" />
            )}
          </>
        )}
      </Spin>
    </Drawer>
  );
};

export default UserRoleDrawer;
