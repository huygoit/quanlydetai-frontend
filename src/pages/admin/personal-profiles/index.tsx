/**
 * Quản lý Hồ sơ cá nhân
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space, Typography } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { useAccess, history } from '@umijs/max';
import {
  getPersonalProfiles,
  updatePersonalProfileStatus,
  PERSONAL_PROFILE_STATUS_MAP,
  type PersonalProfileItem,
  type PersonalProfileStatus,
} from '@/services/api/personalProfiles';
import { getDepartmentOptions } from '@/services/api/iamUsers';
import dayjs from 'dayjs';

const PersonalProfilesPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [departmentOptions, setDepartmentOptions] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const depts = await getDepartmentOptions();
      if (depts) setDepartmentOptions(depts);
    } catch (e) {
      console.error('Load options error:', e);
    }
  };

  const handleCreate = () => {
    history.push('/admin/personal-profiles/new');
  };

  const handleEdit = (record: PersonalProfileItem) => {
    history.push(`/admin/personal-profiles/${record.id}/edit`);
  };

  const handleToggleStatus = async (record: PersonalProfileItem) => {
    const newStatus: PersonalProfileStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updatePersonalProfileStatus(record.id, { status: newStatus });
      if (result?.data || result) {
        message.success(`Đã chuyển trạng thái sang "${PERSONAL_PROFILE_STATUS_MAP[newStatus].text}"`);
        actionRef.current?.reload();
      }
    } catch (error) {
      message.error('Không thể đổi trạng thái');
    }
  };

  const formatDate = (d?: string) => (d ? dayjs(d).format('DD/MM/YYYY') : '-');
  const formatDateTime = (d?: string) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '-');

  const columns: ProColumns<PersonalProfileItem>[] = [
    { title: 'STT', dataIndex: 'index', valueType: 'indexBorder', width: 60, align: 'center' },
    { title: 'Mã NV', dataIndex: 'staffCode', width: 100, fieldProps: { placeholder: 'Tìm mã NV' } },
    { title: 'Họ tên', dataIndex: 'fullName', width: 180, fieldProps: { placeholder: 'Tìm họ tên' } },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      width: 90,
      valueEnum: { MALE: { text: 'Nam' }, FEMALE: { text: 'Nữ' }, OTHER: { text: 'Khác' } },
    },
    {
      title: 'Ngày sinh',
      dataIndex: 'dateOfBirth',
      width: 110,
      hideInSearch: true,
      render: (_, r) => formatDate(r.dateOfBirth),
    },
    { title: 'Điện thoại', dataIndex: 'phone', width: 120, hideInSearch: true },
    { title: 'Email', dataIndex: 'workEmail', width: 180, fieldProps: { placeholder: 'Tìm email' } },
    {
      title: 'Đơn vị',
      dataIndex: 'departmentId',
      width: 150,
      valueType: 'select',
      fieldProps: {
        options: departmentOptions.map((d) => ({ value: d.id, label: d.name })),
        placeholder: 'Chọn đơn vị',
      },
      render: (_, r) => r.department?.name || '-',
    },
    { title: 'Chức danh', dataIndex: 'positionTitle', width: 150, hideInSearch: true },
    { title: 'Học vị', dataIndex: 'academicDegree', width: 120, hideInSearch: true },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
      valueEnum: Object.entries(PERSONAL_PROFILE_STATUS_MAP).reduce(
        (acc, [k, v]) => {
          acc[k] = { text: v.text, status: v.status as any };
          return acc;
        },
        {} as Record<string, { text: string; status: string }>
      ),
      render: (_, r) => (
        <Badge status={PERSONAL_PROFILE_STATUS_MAP[r.status]?.status as any} text={PERSONAL_PROFILE_STATUS_MAP[r.status]?.text} />
      ),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 140,
      hideInSearch: true,
      render: (_, r) => formatDateTime(r.updatedAt),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {access.canEditPersonalProfile && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Sửa
            </Button>
          )}
          {access.canChangePersonalProfileStatus && (
            <Popconfirm
              title="Đổi trạng thái"
              description={
                record.status === 'ACTIVE' ? 'Ngừng hoạt động hồ sơ này?' : 'Kích hoạt lại hồ sơ này?'
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
      <ProTable<PersonalProfileItem>
        headerTitle="Danh sách hồ sơ cá nhân"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreatePersonalProfile
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Thêm mới
                </Button>,
              ]
            : []
        }
        request={async (params) => {
          const { current, pageSize, keyword, staffCode, fullName, workEmail, departmentId, status } = params;
          const mergedKeyword =
            (typeof keyword === 'string' && keyword.trim()) ||
            (typeof fullName === 'string' && fullName.trim()) ||
            (typeof workEmail === 'string' && workEmail.trim()) ||
            undefined;
          const result = await getPersonalProfiles({
            page: current,
            perPage: pageSize,
            keyword: mergedKeyword,
            staffCode: typeof staffCode === 'string' && staffCode.trim() ? staffCode.trim() : undefined,
            departmentId,
            status: status as PersonalProfileStatus,
          });
          const data = Array.isArray(result?.data) ? result.data : result?.data?.data ?? [];
          const total = result?.meta?.total ?? result?.data?.meta?.total ?? 0;
          return { data, total, success: true };
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6 },
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} / ${t} hồ sơ`,
        }}
        scroll={{ x: 1500 }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
      />
    </PageContainer>
  );
};

export default PersonalProfilesPage;
