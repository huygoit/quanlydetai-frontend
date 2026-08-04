/**
 * Danh sách quản lý Thông báo tuyển chọn đề tài
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { history, useAccess, useNavigate } from '@umijs/max';
import { useRef } from 'react';
import {
  listCallForProposals,
  CFP_STATUS_MAP,
  CFP_LEVEL_OPTIONS,
  type CallForProposal,
  type CfpStatus,
} from '@/services/api/callForProposals';
import dayjs from 'dayjs';

const CallForProposalsListPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const navigate = useNavigate();

  const columns: ProColumns<CallForProposal>[] = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      ellipsis: true,
      copyable: false,
    },
    {
      title: 'Kỳ',
      dataIndex: 'periodLabel',
      width: 120,
      search: false,
      render: (_, r) =>
        `${r.periodKind === 'ACADEMIC' ? 'NH' : 'TC'} ${r.periodLabel}`,
    },
    {
      title: 'Cấp đề tài',
      dataIndex: 'levels',
      search: false,
      width: 200,
      render: (_, r) =>
        (r.levels || []).map((lv) => {
          const opt = CFP_LEVEL_OPTIONS.find((o) => o.value === lv);
          return (
            <Tag key={lv} style={{ marginBottom: 2 }}>
              {opt?.label || lv}
            </Tag>
          );
        }),
    },
    {
      title: 'Hạn nộp',
      dataIndex: 'deadlineAt',
      width: 120,
      search: false,
      render: (_, r) => (r.deadlineAt ? dayjs(r.deadlineAt).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 180,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(CFP_STATUS_MAP).map(([k, v]) => [k, { text: v.text }]),
      ),
      render: (_, r) => {
        const m = CFP_STATUS_MAP[r.status as CfpStatus];
        return <Tag color={m?.color}>{m?.text || r.status}</Tag>;
      },
    },
    {
      title: 'Người tạo',
      dataIndex: 'creatorName',
      width: 140,
      search: false,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 100,
      render: (_, r) => [
        <a key="view" onClick={() => navigate(`/projects/call-for-proposals/${r.id}`)}>
          Chi tiết
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<CallForProposal>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          access.canCreateCfp ? (
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => history.push('/projects/call-for-proposals/form')}
            >
              Tạo thông báo mới
            </Button>
          ) : null,
        ]}
        request={async (params) => {
          try {
            const res = await listCallForProposals({
              status: params.status,
              keyword: params.title || params.keyword,
            });
            const rows = res.data || [];
            return { data: rows, success: res.success !== false, total: rows.length };
          } catch (e: any) {
            message.error(e?.message || 'Không tải được danh sách');
            return { data: [], success: false, total: 0 };
          }
        }}
        pagination={{ pageSize: 20 }}
      />
    </PageContainer>
  );
};

export default CallForProposalsListPage;
