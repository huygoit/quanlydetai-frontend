/**
 * Quản lý gán Role cho User
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Space, Tag, Typography } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import {
  queryUsers,
  USER_STATUS_MAP,
  type UserItem,
} from '@/services/api/userRoles';
import UserRoleDrawer from './components/UserRoleDrawer';

const { Text } = Typography;

const UserRolesPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const handleManageRoles = (record: UserItem) => {
    setSelectedUser(record);
    setDrawerVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setSelectedUser(null);
  };

  const handleSuccess = () => {
    actionRef.current?.reload();
  };

  const columns: ProColumns<UserItem>[] = [
    {
      title: 'STT',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 60,
      align: 'center',
    },
    {
      title: 'Họ tên',
      dataIndex: 'full_name',
      width: 200,
      ellipsis: true,
      fieldProps: { placeholder: 'Tìm theo tên' },
    },
    {
      title: 'Username',
      dataIndex: 'username',
      width: 150,
      fieldProps: { placeholder: 'Tìm theo username' },
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          {record.username}
        </Text>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      width: 220,
      ellipsis: true,
      fieldProps: { placeholder: 'Tìm theo email' },
    },
    {
      title: 'Đơn vị',
      dataIndex: ['department', 'name'],
      width: 180,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) =>
        record.department?.name || <Text type="secondary">-</Text>,
    },
    {
      title: 'Vai trò hiện tại',
      dataIndex: 'roles',
      width: 250,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.roles || record.roles.length === 0) {
          return <Text type="secondary">Chưa gán vai trò</Text>;
        }
        return (
          <Space wrap size={[4, 4]}>
            {record.roles.slice(0, 3).map((role) => (
              <Tag key={role.id} color="blue">
                {role.name}
              </Tag>
            ))}
            {record.roles.length > 3 && (
              <Tag>+{record.roles.length - 3}</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: Object.entries(USER_STATUS_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text, status: val.status as any };
        return acc;
      }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        if (!record.status) return <Text type="secondary">-</Text>;
        const statusConfig = USER_STATUS_MAP[record.status];
        if (!statusConfig) return record.status;
        return <Badge status={statusConfig.status as any} text={statusConfig.text} />;
      },
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          icon={<TeamOutlined />}
          onClick={() => handleManageRoles(record)}
        >
          Quản lý vai trò
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<UserItem>
        headerTitle="Danh sách người dùng"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params, sort) => {
          const { current, pageSize, full_name, username, email, status } = params;

          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }

          const result = await queryUsers({
            page: current,
            perPage: pageSize,
            full_name,
            username,
            email,
            status,
            sortBy,
            order,
          });

          return {
            data: result.data,
            total: result.meta?.total || 0,
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
        scroll={{ x: 1400 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />

      <UserRoleDrawer
        visible={drawerVisible}
        user={selectedUser}
        onClose={handleDrawerClose}
        onSuccess={handleSuccess}
      />
    </PageContainer>
  );
};

export default UserRolesPage;
