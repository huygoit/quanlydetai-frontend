/**
 * Menu CNNV — Báo cáo tiến độ BM.08 (theo owner_id).
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
import { history, useAccess } from '@umijs/max';
import { Alert, Button, Space, Tag, Tooltip, Typography } from 'antd';

const ProgressReportsHubPage: React.FC = () => {
  const access = useAccess();
  // Chỉ CNNV workspace mới lập báo cáo từ menu này
  const coQuyenLap = !!access.canViewTaskFinance;

  const columns: ProColumns<ProjectOutline>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 140,
      render: (_, r) => <Typography.Text strong>{r.code}</Typography.Text>,
    },
    { title: 'Tên nhiệm vụ', dataIndex: 'title', ellipsis: true },
    {
      title: 'Trạng thái',
      width: 150,
      search: false,
      render: (_, r) => {
        const meta = OUTLINE_STATUS_MAP[r.status as ProjectOutlineStatus];
        return <Tag color={meta?.color}>{meta?.label || r.status}</Tag>;
      },
    },
    {
      title: 'Triển khai',
      width: 140,
      search: false,
      render: (_, r) =>
        r.executionStatus ? (
          <Tag color="processing">
            {NHAN_TRIEN_KHAI[r.executionStatus] || r.executionStatus}
          </Tag>
        ) : (
          <Typography.Text type="secondary">Chưa mở</Typography.Text>
        ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 260,
      render: (_, r) => {
        const dangThucHien = r.executionStatus === 'DANG_THUC_HIEN';
        const lyDoKhoa = !coQuyenLap
          ? 'Bạn không có quyền lập báo cáo tiến độ'
          : !dangThucHien
            ? r.activeContractId
              ? 'Cần hợp đồng có hiệu lực trước'
              : 'Chờ PKH lập / ký hợp đồng'
            : undefined;

        if (dangThucHien && coQuyenLap) {
          return (
            <Button
              type="primary"
              onClick={() =>
                history.push(`/projects/progress/${r.id}?tab=tiendo`)
              }
            >
              Tạo / nộp báo cáo
            </Button>
          );
        }

        return (
          <Space direction="vertical" size={0}>
            <Tooltip title={lyDoKhoa}>
              <Button type="primary" disabled>
                Tạo / nộp báo cáo
              </Button>
            </Tooltip>
            {r.activeContractId && !dangThucHien ? (
              <Button
                type="link"
                size="small"
                style={{ padding: 0 }}
                onClick={() =>
                  history.push(`/projects/contracts/${r.activeContractId}`)
                }
              >
                Mở hợp đồng
              </Button>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer
      title="Báo cáo tiến độ"
      subTitle="BM.08 — Báo cáo tình hình thực hiện nhiệm vụ KH,CN&ĐMST"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Chọn nhiệm vụ đang thực hiện để lập báo cáo tiến độ theo kỳ."
        description="Hệ thống nhắc email 30/14/7/3 ngày trước hạn. Sau khi nộp, PKH&HTQT ghi nhận hoặc yêu cầu bổ sung."
      />
      <ProTable<ProjectOutline>
        rowKey="id"
        columns={columns}
        search={false}
        options={false}
        pagination={{ pageSize: 10 }}
        request={async () => {
          const res = await dsNhiemVuChuNhiem();
          const data = res.data || [];
          return { data, success: true, total: data.length };
        }}
      />
    </PageContainer>
  );
};

export default ProgressReportsHubPage;
