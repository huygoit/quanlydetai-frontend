/**
 * US-05-01 bước 1 — danh sách dự thảo hợp đồng BM.06
 */
import {
  downloadProjectContract,
  PROJECT_CONTRACT_STATUS_MAP,
  queryProjectContracts,
  type ProjectContract,
  type ProjectContractStatus,
} from '@/services/api/projectContracts';
import { formatVnd } from '@/utils/format';
import { DownloadOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import { Alert, Button, message, Space, Tag } from 'antd';
import dayjs from 'dayjs';

const ProjectContractsPage: React.FC = () => {
  const access = useAccess();

  if (!access.canViewProjectContracts) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền xem dự thảo hợp đồng." />
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
      render: (_, r) => r.outline?.code || r.project_outline_id,
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
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
      valueEnum: {
        HOP_DONG_DRAFT: { text: 'Dự thảo' },
        HOP_DONG_CHO_CNNV: { text: 'Chờ CNNV xác nhận' },
        HOP_DONG_CHO_KY: { text: 'Chờ BGH ký' },
        HOP_DONG_CHO_PHAT_HANH: { text: 'Chờ phát hành' },
        HOP_DONG_DA_KY: { text: 'Đã ký' },
      },
      render: (_, r) => {
        const m =
          PROJECT_CONTRACT_STATUS_MAP[r.status as ProjectContractStatus];
        return m ? <Tag color={m.color}>{m.text}</Tag> : r.status;
      },
    },
    {
      title: 'Phiên bản',
      dataIndex: 'version',
      width: 90,
      hideInSearch: true,
    },
    {
      title: 'Sinh lúc',
      width: 150,
      hideInSearch: true,
      render: (_, r) =>
        r.generated_at ? dayjs(r.generated_at).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: '',
      width: 220,
      hideInSearch: true,
      render: (_, r) => (
        <Space>
          <a onClick={() => history.push(`/projects/contracts/${r.id}`)}>
            Chi tiết
          </a>
          {r.status === 'HOP_DONG_DA_KY' && (
            <a
              onClick={() =>
                history.push(`/projects/execution/${r.project_outline_id}`)
              }
            >
              Triển khai
            </a>
          )}
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadProjectContract(r.id, r.file_name).catch((e) =>
                message.error(e?.message || 'Tải thất bại'),
              )
            }
          >
            Tải
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Hợp đồng nhiệm vụ">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Hệ thống tự sinh dự thảo khi lãnh đạo phê duyệt thuyết minh."
        description="Mở chi tiết để phân bổ mục chi, trình CNNV, BGH ký và TC-HC phát hành. Sau khi đã ký, vào Triển khai để theo dõi chi và đánh giá."
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
            status: params.status as string | undefined,
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

export default ProjectContractsPage;
