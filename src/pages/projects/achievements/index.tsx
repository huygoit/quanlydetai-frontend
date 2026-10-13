/**
 * Nhiệm vụ đã hoàn thành. Không đọc mảng thành tựu trong hồ sơ khoa học.
 */
import { NHAN_XEP_LOAI } from '@/constants/module56';
import { getDepartmentCatalogOptions } from '@/services/api/departments';
import { danhSachThanhTuu, type ThanhTuu } from '@/services/api/module56';
import { OUTLINE_MEMBER_ROLE_OPTIONS } from '@/services/api/projectOutlines';
import { formatVnd } from '@/utils/format';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Tag, message } from 'antd';
import dayjs from 'dayjs';

const namNay = dayjs().year();
const NAM = Array.from({ length: 8 }, (_, i) => namNay - i);

function nhanVaiTro(role: string) {
  return (
    OUTLINE_MEMBER_ROLE_OPTIONS.find((o) => o.value === role)?.label || role
  );
}

const AchievementsPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const quyen =
    initialState?.currentUser?.permissions || initialState?.permissions || [];
  const xemRong =
    quyen.includes('*') ||
    quyen.includes('project.view') ||
    quyen.includes('project.review');

  const columns: ProColumns<ThanhTuu>[] = [
    {
      title: 'Năm',
      dataIndex: 'year',
      valueType: 'select',
      hideInTable: true,
      fieldProps: {
        options: NAM.map((y) => ({ value: y, label: String(y) })),
        allowClear: true,
      },
      formItemProps: {
        extra: 'Theo ngày chủ nhiệm xác nhận thanh lý.',
      },
    },
    ...(xemRong
      ? ([
          {
            title: 'Đơn vị',
            dataIndex: 'departmentId',
            valueType: 'select',
            hideInTable: true,
            request: async () => {
              const res = await getDepartmentCatalogOptions({
                scope: 'khoa_phong_ban',
                status: 'ACTIVE',
              }).catch(() => null);
              return (res?.data || []).map((d) => ({
                value: d.id,
                label: d.short_name ? `${d.short_name} — ${d.name}` : d.name,
              }));
            },
            fieldProps: {
              showSearch: true,
              optionFilterProp: 'label',
              allowClear: true,
            },
          },
          {
            title: 'Mã người dùng',
            dataIndex: 'userId',
            valueType: 'digit',
            hideInTable: true,
            fieldProps: { precision: 0, min: 1 },
          },
        ] as ProColumns<ThanhTuu>[])
      : []),
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 150,
      search: false,
      render: (_, r) => (
        <a onClick={() => history.push(`/projects/execution/${r.outlineId}`)}>
          {r.code}
        </a>
      ),
    },
    {
      title: 'Tên nhiệm vụ',
      dataIndex: 'title',
      ellipsis: true,
      search: false,
    },
    { title: 'Chủ nhiệm', dataIndex: 'ownerName', width: 160, search: false },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 160, search: false },
    {
      title: 'Kinh phí',
      dataIndex: 'budget',
      width: 140,
      search: false,
      render: (_, r) => formatVnd(r.budget),
    },
    {
      title: 'Xếp loại',
      dataIndex: 'classification',
      width: 140,
      search: false,
      render: (_, r) => {
        if (!r.classification) return '—';
        const nhan =
          (NHAN_XEP_LOAI as Record<string, string>)[r.classification] ||
          r.classification;
        const mau =
          r.classification === 'DAT_YEU_CAU'
            ? 'success'
            : r.classification === 'KHONG_DAT'
            ? 'error'
            : 'warning';
        return <Tag color={mau}>{nhan}</Tag>;
      },
    },
    {
      title: 'Hoàn thành',
      dataIndex: 'completedAt',
      width: 120,
      search: false,
      render: (_, r) =>
        r.completedAt ? dayjs(r.completedAt).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Thành viên',
      search: false,
      render: (_, r) =>
        r.members?.length
          ? r.members
              .map((m) => `${m.fullName} (${nhanVaiTro(m.role)})`)
              .join(', ')
          : '—',
    },
  ];

  return (
    <PageContainer>
      <ProTable<ThanhTuu>
        rowKey="outlineId"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 20 }}
        request={async (params) => {
          try {
            const res = await danhSachThanhTuu({
              year: params.year ? Number(params.year) : undefined,
              userId:
                xemRong && params.userId ? Number(params.userId) : undefined,
              departmentId:
                xemRong && params.departmentId
                  ? Number(params.departmentId)
                  : undefined,
            });
            const rows = res.data || [];
            return { data: rows, success: true, total: rows.length };
          } catch (e: any) {
            message.error(
              e?.response?.data?.message ||
                e?.message ||
                'Không tải được thành tựu',
            );
            return { data: [], success: false, total: 0 };
          }
        }}
      />
    </PageContainer>
  );
};

export default AchievementsPage;
