/**
 * Phiếu đánh giá KQCK của tôi — danh sách nhiệm vụ được mời vào HĐ ĐGCK.
 */
import { NHAN_TRIEN_KHAI, NHAN_VAI_TRO_HD } from '@/constants/module56';
import {
  danhSachPhieuDgckCuaToi,
  type PhieuDgckCuaToi,
} from '@/services/api/module56';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { Alert, Button, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useRef } from 'react';

const MyFinalEvalSheetsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<PhieuDgckCuaToi>[] = [
    {
      title: 'Mã NV',
      dataIndex: 'code',
      width: 130,
    },
    {
      title: 'Tên nhiệm vụ',
      dataIndex: 'title',
      ellipsis: false,
      onCell: () => ({
        style: {
          whiteSpace: 'normal',
          wordBreak: 'break-word',
        },
      }),
    },
    {
      title: 'Chủ nhiệm',
      dataIndex: 'ownerName',
      width: 160,
      render: (_, r) => r.ownerName || '—',
    },
    {
      title: 'Vai trò HĐ',
      width: 120,
      render: (_, r) =>
        r.roleLabel ||
        NHAN_VAI_TRO_HD[(r.role || '') as keyof typeof NHAN_VAI_TRO_HD] ||
        r.role ||
        '—',
    },
    {
      title: 'Thời gian họp',
      width: 150,
      render: (_, r) =>
        r.meetingAt ? dayjs(r.meetingAt).format('HH:mm DD/MM/YYYY') : '—',
    },
    {
      title: 'Trạng thái NV',
      width: 150,
      render: (_, r) => {
        const st = r.executionStatus || '';
        return (
          <Tag color="processing">
            {NHAN_TRIEN_KHAI[st] || st || '—'}
          </Tag>
        );
      },
    },
    {
      title: 'Phiếu của tôi',
      width: 110,
      render: (_, r) =>
        r.sheetSubmittedAt ? (
          <Tag color="green">Đã nộp</Tag>
        ) : (
          <Tag color="orange">Chưa nộp</Tag>
        ),
    },
    {
      title: 'Thao tác',
      width: 160,
      render: (_, r) => (
        <Button
          type="link"
          onClick={() => history.push(`/projects/final-eval/${r.outlineId}`)}
        >
          {r.sheetSubmittedAt || r.minutesLocked
            ? 'Xem phiếu đánh giá'
            : 'Nhập phiếu đánh giá'}
        </Button>
      ),
    },
  ];

  return (
    <PageContainer title="Phiếu đánh giá KQCK của tôi">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Danh sách nhiệm vụ bạn được mời vào Hội đồng đánh giá cuối kỳ. Bấm «Nhập phiếu đánh giá» để mở form."
      />
      <ProTable<PhieuDgckCuaToi>
        actionRef={actionRef}
        rowKey="outlineId"
        search={false}
        options={{ reload: true }}
        columns={columns}
        request={async () => {
          try {
            const res = await danhSachPhieuDgckCuaToi();
            const rows = res.data || [];
            return { data: rows, success: true, total: rows.length };
          } catch (e) {
            message.error(layThongBaoLoi(e, 'Không tải được danh sách'));
            return { data: [], success: false, total: 0 };
          }
        }}
        locale={{
          emptyText: 'Bạn chưa được mời vào hội đồng đánh giá cuối kỳ nào.',
        }}
      />
    </PageContainer>
  );
};

export default MyFinalEvalSheetsPage;
