/**
 * Hàng chờ phê duyệt thuyết minh (BGH / TC-HC)
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import { Alert, Segmented, Space, Tag, Typography } from 'antd';
import { useMemo, useRef, useState } from 'react';
import { formatVnd } from '@/utils/format';
import {
  listOutlineApprovals,
  type OutlineApprovalListItem,
} from '@/services/api/projectOutlineApprovals';
import { OUTLINE_STATUS_MAP, type ProjectOutlineStatus } from '@/services/api/projectOutlines';
import './outline-approvals.less';

type Scope = 'bgh' | 'hc' | 'done';

const OutlineApprovalsPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<any>();
  const defaultScope: Scope = access.canApproveOutlineRevisionBgh
    ? 'bgh'
    : access.canPublishContract
      ? 'hc'
      : 'bgh';
  const [scope, setScope] = useState<Scope>(defaultScope);

  const canView =
    access.canApproveOutlineRevisionBgh ||
    access.canPublishContract ||
    access.canManageOutlineDefense;

  const scopes = useMemo(() => {
    const items: { label: string; value: Scope }[] = [];
    if (access.canApproveOutlineRevisionBgh || access.canManageOutlineDefense) {
      items.push({ label: 'Chờ BGH phê duyệt', value: 'bgh' });
    }
    if (access.canPublishContract || access.canManageOutlineDefense) {
      items.push({ label: 'Chờ HC phát hành QĐ', value: 'hc' });
    }
    items.push({ label: 'Đã xử lý', value: 'done' });
    return items;
  }, [access]);

  if (!canView) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền xem hàng chờ phê duyệt thuyết minh." />
      </PageContainer>
    );
  }

  const columns: ProColumns<OutlineApprovalListItem>[] = [
    {
      title: 'Mã TM',
      dataIndex: 'code',
      width: 140,
      render: (_, r) => (
        <a onClick={() => history.push(`/projects/outline-approvals/${r.id}`)}>
          {r.code}
        </a>
      ),
    },
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'Chủ nhiệm',
      dataIndex: 'ownerName',
      width: 160,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <span>{r.ownerName || '—'}</span>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {r.ownerUnit || ''}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Điểm TB BM.05a',
      dataIndex: 'averageScore',
      width: 120,
      render: (v) =>
        v != null ? <Tag color="blue">{Number(v).toFixed(2)}</Tag> : '—',
    },
    {
      title: 'KP đề nghị',
      dataIndex: 'requestedBudget',
      width: 140,
      render: (v) => formatVnd(Number(v || 0)),
    },
    {
      title: 'KP duyệt',
      dataIndex: 'approvedBudget',
      width: 140,
      render: (v) => (v != null ? formatVnd(Number(v)) : '—'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 180,
      render: (_, r) => {
        const meta = OUTLINE_STATUS_MAP[r.status as ProjectOutlineStatus];
        return <Tag color={meta?.color || 'default'}>{meta?.label || r.status}</Tag>;
      },
    },
  ];

  return (
    <PageContainer
      title="Phê duyệt thuyết minh"
      subTitle="BGH xem hồ sơ → ký duyệt / từ chối → TC-HC phát hành QĐ giao thực hiện"
      className="oa-list-page"
    >
      <div className="oa-list-hero">
        <div>
          <Typography.Title level={4} style={{ margin: 0, color: '#fff' }}>
            Hàng chờ phê duyệt cuối Module 4
          </Typography.Title>
          <Typography.Paragraph style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.85)' }}>
            Hồ sơ gồm BM.04 cuối, điểm BM.05a, biên bản BM.05b và lịch sử chỉnh sửa.
          </Typography.Paragraph>
        </div>
        <Segmented
          value={scope}
          options={scopes}
          onChange={(v) => {
            setScope(v as Scope);
            actionRef.current?.reload?.();
          }}
        />
      </div>

      <ProTable<OutlineApprovalListItem>
        actionRef={actionRef}
        rowKey="id"
        search={false}
        options={{ reload: true }}
        pagination={{ pageSize: 20 }}
        columns={columns}
        params={{ scope }}
        request={async () => {
          const res = await listOutlineApprovals(scope);
          return { data: res.data || [], success: true };
        }}
        onRow={(r) => ({
          onClick: () => history.push(`/projects/outline-approvals/${r.id}`),
          style: { cursor: 'pointer' },
        })}
      />
    </PageContainer>
  );
};

export default OutlineApprovalsPage;
