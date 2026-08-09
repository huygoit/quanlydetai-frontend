/**
 * Đề tài của tôi — đề xuất đủ điều kiện soạn thuyết minh (US-04-01)
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Alert, Button, Progress, Space, Tag, message } from 'antd';
import { history } from '@umijs/max';
import { useRef } from 'react';
import {
  listEligibleProposalsForOutline,
  openOrCreateOutlineFromProposal,
  OUTLINE_STATUS_MAP,
  type EligibleProposalForOutline,
  type ProjectOutlineStatus,
} from '@/services/api/projectOutlines';

const MyProjectsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const moSoanThuyetMinh = async (proposalId: number) => {
    try {
      const res = await openOrCreateOutlineFromProposal(proposalId);
      const id = res.data?.id;
      if (!id) throw new Error('Không tạo được bản thuyết minh');
      history.push(`/projects/outlines/form/${id}`);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không mở được thuyết minh');
    }
  };

  const columns: ProColumns<EligibleProposalForOutline>[] = [
    {
      title: 'Mã đề xuất',
      dataIndex: 'code',
      width: 140,
      render: (_, r) => (
        <a onClick={() => history.push(`/projects/register/form/${r.id}`)}>{r.code}</a>
      ),
    },
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'ownerUnit',
      width: 160,
      search: false,
    },
    {
      title: 'Thuyết minh',
      width: 180,
      search: false,
      render: (_, r) => {
        if (!r.outlineStatus) return <Tag>Chưa soạn</Tag>;
        const m = OUTLINE_STATUS_MAP[r.outlineStatus as ProjectOutlineStatus];
        return <Tag color={m?.color}>{m?.label || r.outlineStatus}</Tag>;
      },
    },
    {
      title: 'Hoàn thành',
      width: 140,
      search: false,
      render: (_, r) =>
        r.outlineId ? (
          <Progress percent={r.completionPercent || 0} size="small" />
        ) : (
          '—'
        ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 180,
      render: (_, r) => [
        <a
          key="outline"
          onClick={() => {
            void moSoanThuyetMinh(r.id);
          }}
        >
          {r.outlineStatus === 'CHINH_SUA_TM'
            ? 'Chỉnh sửa / Nộp hoàn thiện'
            : r.outlineId
              ? 'Tiếp tục soạn'
              : 'Soạn thuyết minh'}
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="Đề tài đủ điều kiện soạn thuyết minh"
        description="Chỉ người đề xuất hoặc Chủ nhiệm đề tài được soạn. Thư ký / thành viên khác không có quyền. Vào đây hoặc Đăng ký đề xuất → Soạn thuyết minh khi trạng thái Được chọn."
      />
      <ProTable<EligibleProposalForOutline>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        toolBarRender={() => [
          <Button key="reload" onClick={() => actionRef.current?.reload()}>
            Làm mới
          </Button>,
        ]}
        request={async () => {
          try {
            const res = await listEligibleProposalsForOutline();
            const rows = res.data || [];
            return { data: rows, success: true, total: rows.length };
          } catch (e: any) {
            message.error(e?.message || 'Không tải được danh sách');
            return { data: [], success: false, total: 0 };
          }
        }}
        headerTitle={
          <Space>
            <span>Đề tài đủ điều kiện</span>
          </Space>
        }
      />
    </PageContainer>
  );
};

export default MyProjectsPage;
