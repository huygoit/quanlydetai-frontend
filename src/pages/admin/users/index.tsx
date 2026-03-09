/**
 * Quản lý Người dùng (IAM Users)
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space, Tag, Typography } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SwapOutlined,
  TeamOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { useAccess } from '@umijs/max';
import {
  queryIAMUsers,
  changeIAMUserStatus,
  getDepartmentOptions,
  getRoleOptions,
  USER_STATUS_MAP,
  type IAMUserItem,
  type UserStatus,
  type DepartmentOption,
} from '@/services/api/iamUsers';
import type { RoleItem } from '@/services/api/roles';
import dayjs from 'dayjs';
import UserForm from './components/UserForm';
import AssignRolesModal from './components/AssignRolesModal';
import ResetPasswordModal from './components/ResetPasswordModal';

const { Text } = Typography;

const UsersPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IAMUserItem | null>(null);
  const [assignRolesVisible, setAssignRolesVisible] = useState(false);
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IAMUserItem | null>(null);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<RoleItem[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [depts, roles] = await Promise.all([
        getDepartmentOptions(),
        getRoleOptions(),
      ]);
      if (depts) setDepartmentOptions(depts);
      if (roles) setRoleOptions(roles);
    } catch (error) {
      console.error('Load options error:', error);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: IAMUserItem) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleToggleStatus = async (record: IAMUserItem) => {
    const newStatus: UserStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await changeIAMUserStatus(record.id, { status: newStatus });
      if (result?.data || result) {
        message.success(`Đã chuyển trạng thái sang "${USER_STATUS_MAP[newStatus].text}"`);
        actionRef.current?.reload();
      }
    } catch (error) {
      message.error('Không thể đổi trạng thái');
    }
  };

  const handleAssignRoles = (record: IAMUserItem) => {
    setSelectedUser(record);
    setAssignRolesVisible(true);
  };

  const handleResetPassword = (record: IAMUserItem) => {
    setSelectedUser(record);
    setResetPasswordVisible(true);
  };

  const handleFormSuccess = () => {
    setFormVisible(false);
    setEditingRecord(null);
    actionRef.current?.reload();
  };

  const handleAssignRolesSuccess = () => {
    setAssignRolesVisible(false);
    setSelectedUser(null);
    actionRef.current?.reload();
  };

  const handleResetPasswordSuccess = () => {
    setResetPasswordVisible(false);
    setSelectedUser(null);
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  };

  const columns: ProColumns<IAMUserItem>[] = [
    {
      title: 'Họ tên',
      dataIndex: ['full_name', 'fullName'],
      width: 180,
      ellipsis: true,
      fieldProps: { placeholder: 'Tìm họ tên' },
      render: (_, record) => record.full_name || record.fullName || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      width: 200,
      ellipsis: true,
      copyable: true,
      fieldProps: { placeholder: 'Tìm email' },
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.phone || <Text type="secondary">-</Text>,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'department_id',
      width: 160,
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        options: departmentOptions.map((d) => ({ value: d.id, label: d.name })),
        placeholder: 'Chọn đơn vị',
      },
      render: (_, record) =>
        record.department?.name || <Text type="secondary">-</Text>,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role_id',
      width: 200,
      valueType: 'select',
      fieldProps: {
        options: roleOptions.map((r) => ({ value: r.id, label: r.name })),
        placeholder: 'Chọn vai trò',
      },
      render: (_, record) => {
        if (!record.roles || record.roles.length === 0) {
          return <Text type="secondary">Chưa gán vai trò</Text>;
        }
        return (
          <Space wrap size={[4, 4]}>
            {record.roles.slice(0, 2).map((role) => (
              <Tag key={role.id} color="blue">{role.name}</Tag>
            ))}
            {record.roles.length > 2 && (
              <Tag>+{record.roles.length - 2}</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
      valueEnum: Object.entries(USER_STATUS_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text, status: val.status as any };
        return acc;
      }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        const statusConfig = USER_STATUS_MAP[record.status];
        return <Badge status={statusConfig.status as any} text={statusConfig.text} />;
      },
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'last_login_at',
      width: 140,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => formatDateTime(record.last_login_at),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      width: 140,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => formatDateTime(record.created_at),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          {access.canEditUser && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          )}
          {access.canAssignUserRole && (
            <Button
              type="link"
              size="small"
              icon={<TeamOutlined />}
              onClick={() => handleAssignRoles(record)}
            >
              Vai trò
            </Button>
          )}
          {access.canResetUserPassword && (
            <Button
              type="link"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleResetPassword(record)}
            >
              Đặt lại MK
            </Button>
          )}
          {access.canEditUser && (
            <Popconfirm
              title="Đổi trạng thái"
              description={
                record.status === 'ACTIVE'
                  ? 'Ngừng hoạt động người dùng này?'
                  : 'Kích hoạt lại người dùng này?'
              }
              onConfirm={() => handleToggleStatus(record)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="link"
                size="small"
                icon={<SwapOutlined />}
                danger={record.status === 'ACTIVE'}
              >
                {record.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<IAMUserItem>
        headerTitle="Danh sách người dùng"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateUser
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Thêm người dùng
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          const { current, pageSize, full_name, email, department_id, role_id, status } = params;

          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }

          const result = await queryIAMUsers({
            page: current,
            perPage: pageSize,
            full_name,
            email,
            department_id,
            role_id,
            status: status as UserStatus,
            sortBy,
            order,
          });

          const data = Array.isArray(result?.data) ? result.data : result?.data?.data || [];
          const total = result?.meta?.total ?? result?.data?.meta?.total ?? 0;

          return {
            data,
            total,
            success: true,
          };
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 4 },
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} người dùng`,
        }}
        scroll={{ x: 1600 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />

      <UserForm
        visible={formVisible}
        editingRecord={editingRecord}
        departmentOptions={departmentOptions}
        roleOptions={roleOptions}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSuccess={handleFormSuccess}
      />

      <AssignRolesModal
        visible={assignRolesVisible}
        user={selectedUser}
        roleOptions={roleOptions}
        onCancel={() => {
          setAssignRolesVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={handleAssignRolesSuccess}
      />

      <ResetPasswordModal
        visible={resetPasswordVisible}
        user={selectedUser}
        onCancel={() => {
          setResetPasswordVisible(false);
          setSelectedUser(null);
        }}
        onSuccess={handleResetPasswordSuccess}
      />
    </PageContainer>
  );
};

export default UsersPage;
