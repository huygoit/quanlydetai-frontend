/**
 * Quản lý Quyền (Permissions) - Read-only
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Tag, Typography } from 'antd';
import { useRef } from 'react';
import {
  queryPermissions,
  PERMISSION_STATUS_MAP,
  PERMISSION_MODULE_MAP,
  type PermissionItem,
  type PermissionStatus,
} from '@/services/api/permissions';

const { Text } = Typography;

// Tạo module options từ constant map
const moduleOptions = Object.entries(PERMISSION_MODULE_MAP).map(([value, label]) => ({
  value,
  label,
}));

const PermissionsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const getModuleName = (module: string) => {
    return PERMISSION_MODULE_MAP[module] || module;
  };

  const getModuleColor = (module: string): string => {
    const colorMap: Record<string, string> = {
      department: 'blue',
      user: 'cyan',
      role: 'purple',
      permission: 'magenta',
      project: 'green',
      idea: 'gold',
      council: 'orange',
      publication: 'geekblue',
      report: 'volcano',
      finance: 'lime',
      profile: 'default',
      notification: 'pink',
      system: 'red',
    };
    return colorMap[module] || 'default';
  };

  const columns: ProColumns<PermissionItem>[] = [
    {
      title: 'STT',
      dataIndex: 'index',
      valueType: 'indexBorder',
      width: 60,
      align: 'center',
    },
    {
      title: 'Mã quyền',
      dataIndex: 'code',
      width: 200,
      copyable: true,
      fieldProps: { placeholder: 'Tìm theo mã' },
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          {record.code}
        </Text>
      ),
    },
    {
      title: 'Tên quyền',
      dataIndex: 'name',
      width: 250,
      ellipsis: true,
      fieldProps: { placeholder: 'Tìm theo tên' },
    },
    {
      title: 'Module',
      dataIndex: 'module',
      width: 140,
      valueType: 'select',
      fieldProps: {
        options: moduleOptions,
        placeholder: 'Chọn module',
      },
      render: (_, record) => (
        <Tag color={getModuleColor(record.module)}>{getModuleName(record.module)}</Tag>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.action || <Text type="secondary">-</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      width: 300,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => record.description || <Text type="secondary">-</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: Object.entries(PERMISSION_STATUS_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text, status: val.status as any };
        return acc;
      }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        if (!record.status) return <Text type="secondary">-</Text>;
        const statusConfig = PERMISSION_STATUS_MAP[record.status];
        return <Badge status={statusConfig.status as any} text={statusConfig.text} />;
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<PermissionItem>
        headerTitle="Danh sách quyền"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params, sort) => {
          const { current, pageSize, code, name, module, status } = params;

          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }

          const result = await queryPermissions({
            page: current,
            perPage: pageSize,
            code,
            name,
            module,
            status: status as PermissionStatus,
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
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} quyền`,
        }}
        scroll={{ x: 1200 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />
    </PageContainer>
  );
};

export default PermissionsPage;
