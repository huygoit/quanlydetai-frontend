import { soMucChi, type DongMucChi } from '@/services/api/module56';
import { formatVnd } from '@/utils/format';
import { Alert, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';

export function TabSoMuc({ outlineId }: { outlineId: number }) {
  const [rows, setRows] = useState<DongMucChi[]>([]);
  const [loi, setLoi] = useState('');

  useEffect(() => {
    soMucChi(outlineId)
      .then((res) => setRows(res.data || []))
      .catch((e) =>
        setLoi(e?.data?.message || e?.message || 'Không tải được sổ'),
      );
  }, [outlineId]);

  if (loi) return <Alert type="error" message={loi} />;

  return (
    <Table
      size="small"
      rowKey="code"
      pagination={false}
      dataSource={rows}
      columns={[
        { title: 'Mã', dataIndex: 'code', width: 90 },
        { title: 'Nội dung', dataIndex: 'label' },
        { title: 'Dự toán', dataIndex: 'planned', render: (v) => formatVnd(v) },
        {
          title: 'Tạm ứng',
          dataIndex: 'advanced',
          render: (v) => formatVnd(v),
        },
        { title: 'Đã chi', dataIndex: 'spent', render: (v) => formatVnd(v) },
        {
          title: 'Quyết toán',
          dataIndex: 'settled',
          render: (v) => formatVnd(v),
        },
        {
          title: 'Còn lại',
          dataIndex: 'remaining',
          render: (v: number) =>
            v < 0 ? <Tag color="red">{formatVnd(v)}</Tag> : formatVnd(v),
        },
      ]}
    />
  );
}
