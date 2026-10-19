/**
 * Nhiệm vụ của tôi — thuyết minh chủ nhiệm, thành viên hoặc hội đồng được xem.
 */
import {
  listEligibleProposalsForOutline,
  listMyOutlines,
  openOrCreateOutlineFromProposal,
  OUTLINE_STATUS_MAP,
  type EligibleProposalForOutline,
  type ProjectOutline,
  type ProjectOutlineStatus,
} from '@/services/api/projectOutlines';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useAccess, useModel } from '@umijs/max';
import { Alert, Button, message, Progress, Space, Tag } from 'antd';
import { useRef } from 'react';

const MyProjectsPage: React.FC = () => {
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const userId = Number(initialState?.currentUser?.id || 0);
  const actionRef = useRef<ActionType>();
  const outlineRef = useRef<ActionType>();

  const moSoanThuyetMinh = async (proposalId: number) => {
    try {
      const res = await openOrCreateOutlineFromProposal(proposalId);
      const id = res.data?.id;
      if (!id) throw new Error('Không tạo được bản thuyết minh');
      history.push(`/projects/outlines/form/${id}`);
    } catch (e: any) {
      message.error(
        e?.data?.message || e?.message || 'Không mở được thuyết minh',
      );
    }
  };

  const cotDeXuat: ProColumns<EligibleProposalForOutline>[] = [
    {
      title: 'Mã đề xuất',
      dataIndex: 'code',
      width: 140,
      render: (_, r) => (
        <a onClick={() => history.push(`/projects/register/form/${r.id}`)}>
          {r.code}
        </a>
      ),
    },
    { title: 'Tên đề tài', dataIndex: 'title', ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 160, search: false },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 160,
      render: (_, r) => [
        <a key="outline" onClick={() => void moSoanThuyetMinh(r.id)}>
          Soạn thuyết minh
        </a>,
      ],
    },
  ];

  const cotThuyetMinh: ProColumns<ProjectOutline>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 150,
      render: (_, r) => (
        <a onClick={() => history.push(`/projects/outlines/form/${r.id}`)}>
          {r.code}
        </a>
      ),
    },
    { title: 'Tên nhiệm vụ', dataIndex: 'title', ellipsis: true },
    { title: 'Chủ nhiệm', dataIndex: 'ownerName', width: 160, search: false },
    {
      title: 'Trạng thái',
      width: 200,
      search: false,
      render: (_, r) => {
        const m = OUTLINE_STATUS_MAP[r.status as ProjectOutlineStatus];
        return <Tag color={m?.color}>{m?.label || r.status}</Tag>;
      },
    },
    {
      title: 'Hoàn thành',
      width: 140,
      search: false,
      render: (_, r) => (
        <Progress percent={r.completionPercent || 0} size="small" />
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 120,
      render: (_, r) => {
        const laChu = userId > 0 && Number(r.ownerId) === userId;
        const dangSua =
          r.status === 'THUYETMINH_DRAFT' || r.status === 'CHINH_SUA_TM';
        return [
          <a
            key="mo"
            onClick={() => history.push(`/projects/outlines/form/${r.id}`)}
          >
            {laChu && dangSua ? 'Soạn' : 'Xem'}
          </a>,
        ];
      },
    },
  ];

  return (
    <PageContainer>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="Thuyết minh bạn được xem"
        description="Danh sách gồm nhiệm vụ bạn chủ nhiệm, tham gia với tư cách thành viên, hoặc nằm trong hội đồng bảo vệ. Thành viên và hội đồng chỉ xem, không sửa."
      />
      <ProTable<ProjectOutline>
        actionRef={outlineRef}
        rowKey="id"
        columns={cotThuyetMinh}
        search={false}
        headerTitle="Thuyết minh"
        toolBarRender={() => [
          <Button key="reload" onClick={() => outlineRef.current?.reload()}>
            Làm mới
          </Button>,
        ]}
        request={async () => {
          try {
            const res = await listMyOutlines();
            const rows = res.data || [];
            return { data: rows, success: true, total: rows.length };
          } catch (e: any) {
            message.error(
              e?.response?.data?.message ||
                e?.message ||
                'Không tải được thuyết minh',
            );
            return { data: [], success: false, total: 0 };
          }
        }}
      />
      {access.canWriteProjectOutline && (
        <ProTable<EligibleProposalForOutline>
          style={{ marginTop: 16 }}
          actionRef={actionRef}
          rowKey="id"
          columns={cotDeXuat}
          search={false}
          headerTitle={
            <Space>
              <span>Đề xuất chưa soạn thuyết minh</span>
            </Space>
          }
          request={async () => {
            try {
              const res = await listEligibleProposalsForOutline();
              const rows = (res.data || []).filter((r) => !r.outlineId);
              return { data: rows, success: true, total: rows.length };
            } catch (e: any) {
              message.error(e?.message || 'Không tải được đề xuất');
              return { data: [], success: false, total: 0 };
            }
          }}
        />
      )}
    </PageContainer>
  );
};

export default MyProjectsPage;
