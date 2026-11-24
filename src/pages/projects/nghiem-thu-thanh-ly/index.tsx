/**
 * Nghiệm thu, thanh lý nhiệm vụ — danh sách HĐ đã ký / đang đánh giá cuối kỳ.
 */
import {
  PROJECT_CONTRACT_STATUS_MAP,
  queryProjectContracts,
  type ProjectContract,
  type ProjectContractStatus,
} from '@/services/api/projectContracts';
import { formatVnd } from '@/utils/format';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import { Alert, Tag } from 'antd';

const NghiemThuThanhLyPage: React.FC = () => {
  const access = useAccess();

  if (!access.canViewProjectContracts && !access.canOpenModule56) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền." />
      </PageContainer>
    );
  }

  const columns: ProColumns<ProjectContract>[] = [
    {
      title: 'Số HĐ',
      dataIndex: 'contract_no',
      width: 140,
      render: (_, r) => r.contract_no || '—',
    },
    {
      title: 'Mã TM',
      width: 130,
      render: (_, r) => r.outline?.code || String(r.project_outline_id),
    },
    {
      title: 'Tên nhiệm vụ',
      ellipsis: true,
      render: (_, r) => r.outline?.title || '—',
    },
    {
      title: 'CNNV',
      width: 140,
      hideInSearch: true,
      render: (_, r) => r.outline?.owner_name || '—',
    },
    {
      title: 'KP duyệt',
      width: 120,
      hideInSearch: true,
      render: (_, r) =>
        r.outline?.approved_budget !== null &&
        r.outline?.approved_budget !== undefined
          ? formatVnd(r.outline.approved_budget)
          : '—',
    },
    {
      title: 'Trạng thái HĐ',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: {
        HOP_DONG_DA_KY: { text: 'Đã ký' },
        HOP_DONG_CHO_PHAT_HANH: { text: 'Chờ phát hành' },
        HOP_DONG_DRAFT: { text: 'Dự thảo' },
        HOP_DONG_CHO_CNNV: { text: 'Chờ CNNV' },
        HOP_DONG_CHO_KY: { text: 'Chờ BGH ký' },
      },
      render: (_, r) => {
        const m =
          PROJECT_CONTRACT_STATUS_MAP[r.status as ProjectContractStatus];
        return m ? <Tag color={m.color}>{m.text}</Tag> : r.status;
      },
    },
    {
      title: '',
      width: 120,
      hideInSearch: true,
      render: (_, r) => (
        <a
          onClick={() =>
            history.push(`/projects/nghiem-thu-thanh-ly/${r.id}?tab=denghi`)
          }
        >
          Mở hồ sơ
        </a>
      ),
    },
  ];

  return (
    <PageContainer title="Nghiệm thu, thanh lý nhiệm vụ">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Đề nghị đánh giá KQNV → hội đồng → biên bản → giải trình / quyết toán → thanh lý"
        description="Tab bắt đầu từ «Hồ sơ đề nghị đánh giá KQNV». Phần hợp đồng / tạm ứng / tiến độ nằm ở menu Hợp đồng nhiệm vụ."
      />
      <ProTable<ProjectContract>
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params) => {
          const res = await queryProjectContracts({
            page: params.current,
            perPage: params.pageSize,
            keyword: params.contract_no || params.keyword,
            status: (params.status as string | undefined) || 'HOP_DONG_DA_KY',
          });
          return {
            data: res.data || [],
            success: res.success !== false,
            total: res.meta?.total ?? 0,
          };
        }}
        pagination={{ pageSize: 10 }}
      />
    </PageContainer>
  );
};

export default NghiemThuThanhLyPage;
