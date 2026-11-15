/**
 * Tài chính nhiệm vụ — CNNV chọn nhiệm vụ để lập BM.07.
 * Lấy theo owner_id (API my-owned-tasks), không lọc qua quyền soạn TM.
 */
import { NHAN_TRIEN_KHAI } from '@/constants/module56';
import { dsNhiemVuChuNhiem } from '@/services/api/module56';
import {
  OUTLINE_STATUS_MAP,
  type ProjectOutline,
  type ProjectOutlineStatus,
} from '@/services/api/projectOutlines';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Alert, Button, Space, Tag, Typography } from 'antd';

function hopDongConHieuLuc(r: ProjectOutline) {
  return (
    r.executionStatus === 'DANG_THUC_HIEN' ||
    r.contractStatus === 'HOP_DONG_DA_KY'
  );
}

const FinanceRequestsPage: React.FC = () => {
  const columns: ProColumns<ProjectOutline>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 140,
      render: (_, r) => <Typography.Text strong>{r.code}</Typography.Text>,
    },
    { title: 'Tên nhiệm vụ', dataIndex: 'title', ellipsis: true },
    {
      title: 'Hợp đồng',
      width: 160,
      search: false,
      render: (_, r) => {
        if (hopDongConHieuLuc(r)) return <Tag color="success">Có hiệu lực</Tag>;
        if (r.activeContractId || r.contractStatus) {
          return <Tag color="warning">{r.contractStatus || 'Đang xử lý'}</Tag>;
        }
        return <Tag>Chưa có HĐ</Tag>;
      },
    },
    {
      title: 'Triển khai',
      width: 140,
      search: false,
      render: (_, r) => {
        const st = r.executionStatus;
        return st ? (
          <Tag color="processing">{NHAN_TRIEN_KHAI[st] || st}</Tag>
        ) : (
          <Typography.Text type="secondary">Chưa mở</Typography.Text>
        );
      },
    },
    {
      title: 'Trạng thái TM',
      width: 150,
      search: false,
      render: (_, r) => {
        const meta = OUTLINE_STATUS_MAP[r.status as ProjectOutlineStatus];
        return <Tag color={meta?.color}>{meta?.label || r.status}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 260,
      render: (_, r) => {
        if (r.executionStatus === 'DANG_THUC_HIEN') {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => history.push(`/projects/execution/${r.id}?tab=chi`)}
            >
              Tạo yêu cầu tạm ứng / thanh toán
            </Button>
          );
        }
        if (r.activeContractId) {
          return (
            <Space direction="vertical" size={0}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Cần hoàn tất ký HĐ trước khi tạm ứng / thanh toán
              </Typography.Text>
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() => history.push(`/projects/contracts/${r.activeContractId}`)}
              >
                Mở hợp đồng
              </Button>
            </Space>
          );
        }
        return (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Chờ PKH lập hợp đồng BM.06
          </Typography.Text>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Tài chính nhiệm vụ"
      subTitle="Lập giấy đề nghị tạm ứng / thanh toán (BM.07)"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Chỉ tạo được yêu cầu khi hợp đồng đã có hiệu lực (nhiệm vụ Đang thực hiện)."
        description="Nếu thấy nhiệm vụ nhưng nút tạo chưa hiện: vào Hợp đồng → hoàn tất xác nhận / ký / phát hành theo quy trình."
      />
      <ProTable<ProjectOutline>
        rowKey="id"
        columns={columns}
        search={false}
        options={false}
        pagination={{ pageSize: 10 }}
        request={async () => {
          try {
            const res = await dsNhiemVuChuNhiem();
            const data = res.data || [];
            return { data, success: true, total: data.length };
          } catch (e: any) {
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
      />
    </PageContainer>
  );
};

export default FinanceRequestsPage;
