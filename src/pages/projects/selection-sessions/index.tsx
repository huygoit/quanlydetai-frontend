/**
 * Danh sách phiên xét chọn đề tài — US-03-04
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Tag } from 'antd';
import { history, useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  listSelectionSessions,
  SESSION_STATUS_MAP,
  type SelectionSession,
} from '@/services/api/proposalSelectionSessions';

const SelectionSessionsPage: React.FC = () => {
  const access = useAccess();
  if (!access.canViewProjectCouncil && !access.canReviewProjectProposal && !access.canApproveProjectProposal) {
    return <PageContainer>Bạn không có quyền xem phiên xét chọn.</PageContainer>;
  }

  const columns: ProColumns<SelectionSession>[] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Tên phiên', dataIndex: 'title', ellipsis: true },
    {
      title: 'Ngày họp',
      dataIndex: 'meetingAt',
      width: 160,
      render: (_, r) => dayjs(r.meetingAt).format('DD/MM/YYYY HH:mm'),
    },
    { title: 'Địa điểm', dataIndex: 'location', ellipsis: true, width: 180 },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 160,
      render: (_, r) => {
        const m = SESSION_STATUS_MAP[r.status] || { label: r.status, color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    { title: 'Số đề xuất', dataIndex: 'itemCount', width: 100 },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 120,
      render: (_, r) => [
        <a key="open" onClick={() => history.push(`/projects/selection-sessions/${r.id}`)}>
          Mở phiên
        </a>,
      ],
    },
  ];

  return (
    <PageContainer
      title="Phiên xét chọn đề tài"
      extra={
        access.canReviewProjectProposal ? (
          <Button type="primary" onClick={() => history.push('/projects/pkh-review')}>
            Tạo phiên từ màn PKH
          </Button>
        ) : null
      }
    >
      <ProTable<SelectionSession>
        rowKey="id"
        search={false}
        columns={columns}
        request={async () => {
          const res = await listSelectionSessions();
          const data = Array.isArray(res?.data) ? res.data : [];
          return { data, success: true, total: data.length };
        }}
      />
    </PageContainer>
  );
};

export default SelectionSessionsPage;
