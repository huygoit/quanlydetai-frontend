/**
 * Danh mục nhân sự (staffs) — đọc từ API admin, lọc theo đơn vị / loại / liên kết user
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Descriptions, Drawer, Space, Spin, Typography } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useRef, useState, useEffect, useCallback } from 'react';
import { queryStaffs, getStaff, type StaffSummary, type StaffDetail, type StaffSortField, type QueryStaffsParams } from '@/services/api/staffs';
import { getDepartmentOptions } from '@/services/api/iamUsers';
import dayjs from 'dayjs';

const { Text } = Typography;

const SORT_WHITELIST: StaffSortField[] = [
  'id',
  'fullName',
  'staffCode',
  'departmentName',
  'createdAt',
  'staffType',
  'email',
];

const StaffsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [departmentOptions, setDepartmentOptions] = useState<{ id: number; name: string }[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<StaffDetail | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const depts = await getDepartmentOptions();
        if (depts?.length) setDepartmentOptions(depts.map((d) => ({ id: d.id, name: d.name })));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const openDetail = useCallback(async (id: number) => {
    setDrawerOpen(true);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await getStaff(id);
      const row = res?.data;
      if (row) setDetail(row);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const formatDt = (d?: string | null) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—');
  const formatD = (d?: string | null) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');

  const columns: ProColumns<StaffSummary>[] = [
    { title: 'STT', valueType: 'indexBorder', width: 58, align: 'center', search: false },
    {
      title: 'Từ khóa',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: 'Họ tên, mã NV, email, SĐT, đơn vị…' },
    },
    {
      title: 'Mã NV',
      dataIndex: 'staffCode',
      width: 110,
      copyable: true,
      search: false,
      sorter: true,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      width: 200,
      ellipsis: true,
      search: false,
      sorter: true,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'departmentId',
      width: 180,
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        options: departmentOptions.map((d) => ({ value: d.id, label: d.name })),
        placeholder: 'Chọn đơn vị',
        allowClear: true,
      },
      render: (_, r) => r.departmentName || '—',
    },
    {
      title: 'Mã ĐV',
      dataIndex: 'departmentCode',
      width: 100,
      search: false,
      ellipsis: true,
    },
    {
      title: 'Loại CB',
      dataIndex: 'staffType',
      width: 120,
      ellipsis: true,
      fieldProps: { placeholder: 'Vd: GV, NV…' },
    },
    {
      title: 'Chức danh',
      dataIndex: 'positionTitle',
      width: 140,
      ellipsis: true,
      search: false,
    },
    {
      title: 'Công việc',
      dataIndex: 'currentJob',
      width: 160,
      ellipsis: true,
      search: false,
    },
    { title: 'Email', dataIndex: 'email', width: 190, ellipsis: true, search: false, sorter: true },
    { title: 'Điện thoại', dataIndex: 'phone', width: 120, search: false },
    {
      title: 'Tài khoản',
      dataIndex: 'hasUser',
      width: 120,
      valueType: 'select',
      valueEnum: {
        all: { text: 'Tất cả' },
        'true': { text: 'Đã liên kết' },
        'false': { text: 'Chưa liên kết' },
      },
      initialValue: 'all',
      render: (_, r) =>
        r.userId != null ? <Badge status="success" text="Đã liên kết" /> : <Badge status="default" text="Chưa liên kết" />,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 150,
      search: false,
      render: (_, r) => formatDt(r.updatedAt),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(record.id)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<StaffSummary>
        headerTitle="Danh sách nhân sự"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params, sort) => {
          const { current, pageSize, keyword, departmentId, staffType, hasUser } = params;

          let sortBy: StaffSortField = 'fullName';
          let order: 'asc' | 'desc' = 'asc';
          const sortEntries = Object.entries(sort || {}).filter(([, v]) => v);
          if (sortEntries.length > 0) {
            const [key, ord] = sortEntries[0];
            if (SORT_WHITELIST.includes(key as StaffSortField)) {
              sortBy = key as StaffSortField;
              order = ord === 'descend' ? 'desc' : 'asc';
            }
          }

          const kw = typeof keyword === 'string' ? keyword.trim() : '';
          const deptId =
            departmentId !== undefined && departmentId !== '' && departmentId != null
              ? Number(departmentId)
              : undefined;

          const payload: QueryStaffsParams = {
            page: current,
            perPage: pageSize,
            keyword: kw || undefined,
            departmentId: Number.isFinite(deptId) ? deptId : undefined,
            staffType: typeof staffType === 'string' && staffType.trim() ? staffType.trim() : undefined,
            sortBy,
            order,
          };
          const hu = hasUser as string | boolean | undefined;
          if (hu === true || hu === 'true') payload.hasUser = 'true';
          else if (hu === false || hu === 'false') payload.hasUser = 'false';

          const result = await queryStaffs(payload);
          const data = Array.isArray(result?.data) ? result.data : [];
          const total = result?.meta?.total ?? 0;
          return { data, total, success: true };
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t, range) => `${range[0]}-${range[1]} / ${t} nhân sự`,
        }}
        scroll={{ x: 1400 }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
      />

      <Drawer
        title={detail?.fullName || 'Chi tiết nhân sự'}
        width={720}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDetail(null);
        }}
        destroyOnClose
      >
        {detailLoading ? (
          <Spin />
        ) : detail ? (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2} title="Thông tin chung">
              <Descriptions.Item label="Mã NV">{detail.staffCode || '—'}</Descriptions.Item>
              <Descriptions.Item label="Họ tên">{detail.fullName}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">{formatD(detail.dateOfBirth)}</Descriptions.Item>
              <Descriptions.Item label="Giới tính">{detail.gender || '—'}</Descriptions.Item>
              <Descriptions.Item label="CCCD/CMND">{detail.identityNumber || '—'}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">{detail.phone || '—'}</Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {detail.email || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị" span={2}>
                {detail.departmentName || '—'}{' '}
                {detail.departmentCode ? <Text type="secondary">({detail.departmentCode})</Text> : null}
              </Descriptions.Item>
              <Descriptions.Item label="Loại CB">{detail.staffType || '—'}</Descriptions.Item>
              <Descriptions.Item label="Chức danh">{detail.positionTitle || '—'}</Descriptions.Item>
              <Descriptions.Item label="Công việc hiện tại" span={2}>
                {detail.currentJob || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="User ID">{detail.userId ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật">{formatDt(detail.updatedAt)}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={2} title="Đào tạo & học hàm">
              <Descriptions.Item label="Học vị">{detail.professionalDegree || '—'}</Descriptions.Item>
              <Descriptions.Item label="Học hàm">{detail.professionalTitle || '—'}</Descriptions.Item>
              <Descriptions.Item label="Chuyên ngành">{detail.major || '—'}</Descriptions.Item>
              <Descriptions.Item label="Năm TN">{detail.graduationYear ?? '—'}</Descriptions.Item>
            </Descriptions>

            <Descriptions bordered size="small" column={1} title="Ghi chú">
              <Descriptions.Item label="">{detail.note || '—'}</Descriptions.Item>
            </Descriptions>
          </Space>
        ) : (
          <Text type="secondary">Không tải được dữ liệu.</Text>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default StaffsPage;
