/**
 * Quản lý Vai trò (Roles)
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined, KeyOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import { history } from '@umijs/max';
import {
  queryRoles,
  updateRoleStatus,
  ROLE_STATUS_MAP,
  type RoleItem,
  type RoleStatus,
} from '@/services/api/roles';
import dayjs from 'dayjs';
import RoleForm from './components/RoleForm';

const RolesPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [formVisible, setFormVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RoleItem | null>(null);

  const handleCreate = () => {
    setEditingRecord(null);
    setFormVisible(true);
  };

  const handleEdit = (record: RoleItem) => {
    setEditingRecord(record);
    setFormVisible(true);
  };

  const handleToggleStatus = async (record: RoleItem) => {
    const newStatus: RoleStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updateRoleStatus(record.id, { status: newStatus });
      if (result?.data || result) {
        message.success(`Đã chuyển trạng thái sang "${ROLE_STATUS_MAP[newStatus].text}"`);
        actionRef.current?.reload();
      }
    } catch (error) {
      message.error('Không thể đổi trạng thái');
    }
  };

  const handleAssignPermissions = (record: RoleItem) => {
    history.push(`/admin/iam/roles/${record.id}/permissions`);
  };

  const handleFormSuccess = () => {
    setFormVisible(false);
    setEditingRecord(null);
    actionRef.current?.reload();
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  };

  const columns: ProColumns<RoleItem>[] = [
    {
      title: 'STT',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 60,
      align: 'center',
    },
    {
      title: 'Mã vai trò',
      dataIndex: 'code',
      width: 140,
      copyable: true,
      fieldProps: { placeholder: 'Tìm theo mã' },
      render: (_, record) => (
        <Space>
          <span>{record.code}</span>
          {record.code === 'BASIC' && <Tag color="blue">Hệ thống</Tag>}
        </Space>
      ),
    },
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
      fieldProps: { placeholder: 'Tìm theo tên' },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      width: 250,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => record.description || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: Object.entries(ROLE_STATUS_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text, status: val.status as any };
        return acc;
      }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        const statusConfig = ROLE_STATUS_MAP[record.status];
        return <Badge status={statusConfig.status as any} text={statusConfig.text} />;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      width: 150,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => formatDateTime(record.created_at),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {access.canEditRole && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          )}
          {access.canAssignRolePermission && (
            <Button
              type="link"
              size="small"
              icon={<KeyOutlined />}
              onClick={() => handleAssignPermissions(record)}
            >
              Phân quyền
            </Button>
          )}
          {access.canEditRole && (
            <Popconfirm
              title="Đổi trạng thái"
              description={
                record.status === 'ACTIVE'
                  ? 'Ngừng hoạt động vai trò này?'
                  : 'Kích hoạt lại vai trò này?'
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
      <ProTable<RoleItem>
        headerTitle="Danh sách vai trò"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateRole
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Thêm vai trò
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          const { current, pageSize, code, name, status } = params;

          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }

          const result = await queryRoles({
            page: current,
            perPage: pageSize,
            code,
            name,
            status: status as RoleStatus,
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
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} vai trò`,
        }}
        scroll={{ x: 1200 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />

      <RoleForm
        visible={formVisible}
        editingRecord={editingRecord}
        onCancel={() => {
          setFormVisible(false);
          setEditingRecord(null);
        }}
        onSuccess={handleFormSuccess}
      />
    </PageContainer>
  );
};

export default RolesPage;
