/**
 * US-04-03 — Danh sách công việc phản biện của tôi
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Tag } from 'antd';
import { history, useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  listMyOutlineReviewTasks,
  type ReviewScoreTaskItem,
} from '@/services/api/projectOutlineScores';

const STATUS_SHEET: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'default' },
  SUBMITTED: { label: 'Đã nộp', color: 'success' },
};

const OutlineReviewTasksPage: React.FC = () => {
  const access = useAccess();

  if (!access.canViewOutlineReviewTasks) {
    return (
      <PageContainer>
        <Alert type="error" message="Bạn không có quyền xem công việc phản biện." />
      </PageContainer>
    );
  }

  const columns: ProColumns<ReviewScoreTaskItem>[] = [
    {
      title: 'Mã TM',
      width: 130,
      render: (_, r) => r.outline?.code || '—',
    },
    {
      title: 'Tên thuyết minh',
      ellipsis: true,
      render: (_, r) => r.outline?.title || '—',
    },
    {
      title: 'CNĐT',
      width: 160,
      ellipsis: true,
      render: (_, r) => r.outline?.ownerName || '—',
    },
    {
      title: 'Hạn nộp',
      width: 120,
      render: (_, r) =>
        r.assignment.deadlineAt ? dayjs(r.assignment.deadlineAt).format('DD/MM/YYYY') : '—',
    },
    {
      title: 'Phiếu',
      width: 110,
      render: (_, r) => {
        if (!r.scoreSheetStatus) return <Tag>Chưa mở</Tag>;
        const m = STATUS_SHEET[r.scoreSheetStatus];
        return <Tag color={m?.color}>{m?.label || r.scoreSheetStatus}</Tag>;
      },
    },
    {
      title: 'Điểm',
      width: 80,
      render: (_, r) => (r.totalScore != null ? r.totalScore : '—'),
    },
    {
      title: 'Cảnh báo',
      width: 100,
      render: (_, r) =>
        r.pastDeadline && r.scoreSheetStatus !== 'SUBMITTED' ? (
          <Tag color="error">Quá hạn</Tag>
        ) : null,
    },
    {
      title: 'Thao tác',
      width: 100,
      fixed: 'right',
      render: (_, r) => (
        <a onClick={() => history.push(`/projects/blind-reviews/tasks/${r.assignment.id}`)}>
          Mở phiếu
        </a>
      ),
    },
  ];

  return (
    <PageContainer title="Công việc phản biện">
      <ProTable<ReviewScoreTaskItem>
        rowKey={(r) => r.assignment.id}
        search={false}
        columns={columns}
        headerTitle="Thuyết minh được phân công phản biện"
        request={async () => {
          const res = await listMyOutlineReviewTasks();
          const rows = res.data || [];
          return { data: rows, success: true, total: rows.length };
        }}
      />
    </PageContainer>
  );
};

export default OutlineReviewTasksPage;
