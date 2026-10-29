/**
 * Việc của thành viên HĐ — mở sheet phiếu BM.05a
 */
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Card, Space, Table, Tag, message } from 'antd';
import { history } from '@umijs/max';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { listMyDefenseTasks, DEFENSE_STATUS_MAP } from '@/services/api/projectOutlineDefenses';
import Bm05aScoreSheet from '../bm05a/Bm05aScoreSheet';

const MyDefenseTasksPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);
  const [phieuOpen, setPhieuOpen] = useState(false);
  const [phieuSheetId, setPhieuSheetId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listMyDefenseTasks();
      setRows(res.data || []);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const openPhieu = (sheetId: number) => {
    setPhieuSheetId(sheetId);
    setPhieuOpen(true);
  };

  return (
    <PageContainer title="Phiếu đánh giá TM của tôi" loading={loading}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Bấm «Nhập phiếu đánh giá» để mở sheet phiếu BM.05a. Trong sheet có nút xem thuyết minh (BM.04) khi cần đối chiếu."
      />
      {!rows.length && !loading ? (
        <Alert type="warning" message="Bạn chưa được mời vào phiên thẩm định nào." />
      ) : null}
      {rows.map((row) => {
        const st = DEFENSE_STATUS_MAP[row.session.status as keyof typeof DEFENSE_STATUS_MAP];
        return (
          <Card
            key={row.session.id}
            size="small"
            style={{ marginBottom: 12 }}
            title={
              <Space>
                <span>{row.session.title || row.session.decisionCode || `#${row.session.id}`}</span>
                {st ? <Tag color={st.color}>{st.label}</Tag> : null}
                {row.pendingCount > 0 ? (
                  <Tag color="orange">Còn {row.pendingCount} phiếu</Tag>
                ) : (
                  <Tag color="green">Đã nộp đủ</Tag>
                )}
              </Space>
            }
            extra={
              <Button onClick={() => history.push(`/projects/defenses/${row.session.id}`)}>
                Xem phiên
              </Button>
            }
          >
            <div style={{ marginBottom: 8 }}>
              Họp:{' '}
              {row.session.meetingAt
                ? dayjs(row.session.meetingAt).format('HH:mm DD/MM/YYYY')
                : '—'}
            </div>
            <Table
              size="small"
              rowKey="id"
              pagination={false}
              dataSource={row.sheets || []}
              columns={[
                {
                  title: 'Thuyết minh',
                  render: (_: unknown, s: any) =>
                    s.outlineCode
                      ? `${s.outlineCode}${s.outlineTitle ? ` — ${s.outlineTitle}` : ''}`
                      : `TM #${s.projectOutlineId}`,
                },
                {
                  title: 'Trạng thái',
                  width: 110,
                  render: (_: unknown, s: any) =>
                    s.status === 'SUBMITTED' ? (
                      <Tag color="green">Đã nộp</Tag>
                    ) : (
                      <Tag color="orange">Chưa nộp</Tag>
                    ),
                },
                {
                  title: 'Điểm',
                  width: 80,
                  render: (_: unknown, s: any) => s.totalScore ?? '—',
                },
                {
                  title: 'Thao tác',
                  width: 140,
                  render: (_: unknown, s: any) => (
                    <Button type="link" onClick={() => openPhieu(s.id)}>
                      {s.status === 'SUBMITTED' ? 'Xem phiếu' : 'Nhập phiếu đánh giá'}
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        );
      })}

      <Bm05aScoreSheet
        open={phieuOpen}
        sheetId={phieuSheetId}
        onClose={() => {
          setPhieuOpen(false);
          setPhieuSheetId(null);
        }}
        onSaved={() => void load()}
      />
    </PageContainer>
  );
};

export default MyDefenseTasksPage;
