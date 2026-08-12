/**
 * Danh mục nhân sự (staffs) — master hồ sơ nhân sự.
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Alert, Badge, Button } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { history, useAccess } from '@umijs/max';
import {
  queryStaffs,
  type StaffSummary,
  type StaffSortField,
  type QueryStaffsParams,
} from '@/services/api/staffs';
import { getDepartmentOptions } from '@/services/api/iamUsers';
import {
  getStaffPositionOptions,
  STAFF_POSITION_KIND_MAP,
  type StaffPositionOption,
} from '@/services/api/staffPositions';
import { nhanChucVuTuIds } from '@/utils/staffPositionIds';
import dayjs from 'dayjs';

const SORT_WHITELIST: StaffSortField[] = [
  'id',
  'fullName',
  'staffCode',
  'departmentName',
  'createdAt',
  'staffType',
  'email',
  'positionTitle',
  'professionalTitle',
];

type ChucVuFilterOpt = { value: number; label: string };

const chuoiIdLocChucVu = (v: unknown): string | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).trim();
  return s || undefined;
};

const StaffsPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [departmentOptions, setDepartmentOptions] = useState<{ id: number; name: string }[]>([]);
  const [optsPosition, setOptsPosition] = useState<ChucVuFilterOpt[]>([]);
  const [optsParty, setOptsParty] = useState<ChucVuFilterOpt[]>([]);
  const [catalogPosition, setCatalogPosition] = useState<StaffPositionOption[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const depts = await getDepartmentOptions();
        if (depts?.length) {
          setDepartmentOptions(
            [...depts]
              .map((d) => ({ id: d.id, name: d.name }))
              .sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })),
          );
        }
      } catch (e) {
        console.error(e);
      }
    };
    void load();

    const loadPos = async () => {
      const [pos, party] = await Promise.all([
        getStaffPositionOptions({ kind: 'POSITION' }),
        getStaffPositionOptions({ kind: 'PARTY' }),
      ]);
      const posList = pos.data || [];
      setCatalogPosition(posList);
      setOptsPosition(posList.map((r) => ({ value: r.id, label: r.name })));
      setOptsParty((party.data || []).map((r) => ({ value: r.id, label: r.name })));
    };
    void loadPos();
  }, []);

  const formatDt = (d?: string | null) => (d ? dayjs(d).format('DD/MM/YYYY HH:mm') : '—');

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
      width: 160,
      copyable: true,
      fieldProps: { placeholder: 'Nhập mã NV' },
      sorter: true,
      render: (_, r) => (
        <span style={{ whiteSpace: 'nowrap' }}>{r.staffCode || '—'}</span>
      ),
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
      valueType: 'select',
      sorter: true,
      defaultSortOrder: 'ascend',
      fieldProps: {
        options: departmentOptions.map((d) => ({ value: d.id, label: d.name })),
        placeholder: 'Chọn đơn vị',
        allowClear: true,
      },
      render: (_, r) => (
        <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {r.departmentName || '—'}
        </span>
      ),
    },
    {
      title: STAFF_POSITION_KIND_MAP.POSITION.text,
      dataIndex: 'positionTitle',
      width: 180,
      sorter: true,
      valueType: 'select',
      fieldProps: {
        options: optsPosition,
        allowClear: true,
        showSearch: true,
        placeholder: 'Chọn chức vụ',
      },
      render: (_, r) => (
        <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {nhanChucVuTuIds(r.positionTitle, catalogPosition) || '—'}
        </span>
      ),
    },
    {
      title: 'Chức danh',
      dataIndex: 'professionalTitle',
      width: 160,
      search: false,
      sorter: true,
      render: (_, r) => (
        <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {r.professionalTitle || '—'}
        </span>
      ),
    },
    {
      title: STAFF_POSITION_KIND_MAP.PARTY.text,
      dataIndex: 'partyPosition',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: optsParty,
        allowClear: true,
        showSearch: true,
        placeholder: 'Chọn chức vụ Đảng',
      },
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
        true: { text: 'Đã liên kết' },
        false: { text: 'Chưa liên kết' },
      },
      initialValue: 'all',
      render: (_, r) =>
        r.userId != null ? (
          <Badge status="success" text="Đã liên kết" />
        ) : (
          <Badge status="default" text="Chưa liên kết" />
        ),
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
      render: (_, record) =>
        access.canEditPersonalProfile ? (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => history.push(`/admin/staffs/${record.id}/edit`)}
          >
            Sửa
          </Button>
        ) : null,
    },
  ];

  return (
    <PageContainer title="Danh sách hồ sơ nhân sự">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Danh mục nhân sự chính (staffs)."
        description="Tạo/sửa ghi trực tiếp vào bảng staffs — dùng cho mail phát hành, import đề tài/bài báo."
      />
      <ProTable<StaffSummary>
        headerTitle="Danh sách hồ sơ nhân sự"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreatePersonalProfile
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => history.push('/admin/staffs/new')}
                >
                  Thêm mới
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          const {
            current,
            pageSize,
            keyword,
            staffCode,
            departmentId,
            hasUser,
            positionTitle,
            partyPosition,
          } = params;

          let sortBy: StaffSortField = 'departmentName';
          let order: 'asc' | 'desc' = 'asc';
          const sortEntries = Object.entries(sort || {}).filter(([, v]) => v);
          if (sortEntries.length > 0) {
            const [key, ord] = sortEntries[0];
            // Cột lọc theo departmentId nhưng sort theo tên đơn vị
            const mapped =
              key === 'departmentId' ? 'departmentName' : (key as StaffSortField);
            if (SORT_WHITELIST.includes(mapped)) {
              sortBy = mapped;
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
            staffCode: typeof staffCode === 'string' && staffCode.trim() ? staffCode.trim() : undefined,
            departmentId: Number.isFinite(deptId) ? deptId : undefined,
            positionTitle: chuoiIdLocChucVu(positionTitle),
            partyPosition: chuoiIdLocChucVu(partyPosition),
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
    </PageContainer>
  );
};

export default StaffsPage;
