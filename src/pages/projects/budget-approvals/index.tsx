/**
 * US-04-06 — Danh sách xác nhận kinh phí / phê duyệt theo vai trò
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Button, Space, Tag } from 'antd';
import { history, useAccess } from '@umijs/max';
import { useMemo, useState } from 'react';
import { formatVnd } from '@/utils/format';
import {
  listBudgetConfirmations,
  type BudgetConfirmation,
} from '@/services/api/projectOutlineBudgets';
import { OUTLINE_STATUS_MAP, type ProjectOutlineStatus } from '@/services/api/projectOutlines';

type Scope = 'pkh' | 'tc' | 'ld';

const BudgetApprovalsPage: React.FC = () => {
  const access = useAccess();
  const defaultScope: Scope = access.canProposeOutlineBudget
    ? 'pkh'
    : access.canConfirmOutlineBudget
      ? 'tc'
      : 'ld';
  const [scope, setScope] = useState<Scope>(defaultScope);

  if (!access.canViewOutlineBudgetFlow) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền xem luồng xác nhận kinh phí." />
      </PageContainer>
    );
  }

  const scopes = useMemo(() => {
    const s: Array<{ key: Scope; label: string; show: boolean }> = [
      { key: 'pkh', label: 'PKH đề xuất', show: !!access.canProposeOutlineBudget },
      { key: 'tc', label: 'TC thẩm tra', show: !!access.canConfirmOutlineBudget },
      { key: 'ld', label: 'LĐ phê duyệt', show: !!access.canApproveOutlineBudget },
    ];
    return s.filter((x) => x.show);
  }, [access]);

  const columns: ProColumns<BudgetConfirmation>[] = [
    {
      title: 'Mã TM',
      width: 130,
      render: (_, r) => r.outline?.code || r.projectOutlineId,
    },
    {
      title: 'Tên đề tài',
      ellipsis: true,
      render: (_, r) => r.outline?.title || '—',
    },
    {
      title: 'CNĐT',
      width: 150,
      render: (_, r) => r.outline?.ownerName || '—',
    },
    {
      title: 'KP đề nghị',
      width: 130,
      render: (_, r) => formatVnd(r.requestedBudgetSnapshot),
    },
    {
      title: 'PKH đề xuất',
      width: 130,
      render: (_, r) => (r.pkhProposedBudget != null ? formatVnd(r.pkhProposedBudget) : '—'),
    },
    {
      title: 'TC xác nhận',
      width: 130,
      render: (_, r) => (r.tcConfirmedBudget != null ? formatVnd(r.tcConfirmedBudget) : '—'),
    },
    {
      title: 'TM',
      width: 150,
      render: (_, r) => {
        const st = r.outline?.status as ProjectOutlineStatus | undefined;
        const m = st ? OUTLINE_STATUS_MAP[st] : null;
        return m ? <Tag color={m.color}>{m.label}</Tag> : r.outline?.status;
      },
    },
    {
      title: '',
      width: 90,
      render: (_, r) => (
        <a onClick={() => history.push(`/projects/budget-approvals/${r.projectOutlineId}`)}>
          Chi tiết
        </a>
      ),
    },
  ];

  return (
    <PageContainer title="Xác nhận kinh phí & phê duyệt">
      <Space style={{ marginBottom: 16 }}>
        {scopes.map((s) => (
          <Button
            key={s.key}
            type={scope === s.key ? 'primary' : 'default'}
            onClick={() => setScope(s.key)}
          >
            {s.label}
          </Button>
        ))}
      </Space>
      <ProTable<BudgetConfirmation>
        rowKey="id"
        search={false}
        columns={columns}
        params={{ scope }}
        headerTitle={
          scope === 'pkh'
            ? 'Hồ sơ chờ PKH đề xuất kinh phí'
            : scope === 'tc'
              ? 'Hồ sơ chờ TC thẩm tra'
              : 'Hồ sơ chờ Lãnh đạo phê duyệt'
        }
        request={async () => {
          const res = await listBudgetConfirmations(scope);
          const rows = res.data || [];
          return { data: rows, success: true, total: rows.length };
        }}
      />
    </PageContainer>
  );
};

export default BudgetApprovalsPage;
