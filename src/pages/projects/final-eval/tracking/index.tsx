/**
 * Theo dõi phiếu ĐGCK — PKH / Thư ký xem tiến độ nộp phiếu trước khi họp.
 */
import { NHAN_TRIEN_KHAI, NHAN_VAI_TRO_HD } from '@/constants/module56';
import {
  danhSachTheoDoiPhieuDgck,
  type TheoDoiPhieuDgck,
} from '@/services/api/module56';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  FileSearchOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Progress,
  Row,
  Segmented,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Text, Title, Paragraph } = Typography;

type BoLoc = 'ALL' | 'CHO' | 'DU' | 'KHOA';

const BO_LOC_OPTIONS = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chưa đủ phiếu', value: 'CHO' },
  { label: 'Đã đủ phiếu', value: 'DU' },
  { label: 'Đã khóa biên bản', value: 'KHOA' },
];

function mauTienDo(pct: number, du: boolean, khoa: boolean) {
  if (khoa) return '#8c8c8c';
  if (du) return '#52c41a';
  if (pct >= 50) return '#1677ff';
  return '#fa8c16';
}

const TrackingListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TheoDoiPhieuDgck[]>([]);
  const [boLoc, setBoLoc] = useState<BoLoc>('ALL');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await danhSachTheoDoiPhieuDgck();
      setRows(res.data || []);
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Không tải được danh sách'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const thongKe = useMemo(() => {
    const tong = rows.length;
    const du = rows.filter((r) => r.duPhieu && !r.minutesLocked).length;
    const cho = rows.filter((r) => !r.duPhieu && !r.minutesLocked).length;
    const khoa = rows.filter((r) => r.minutesLocked).length;
    return { tong, du, cho, khoa };
  }, [rows]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (boLoc === 'CHO' && (r.duPhieu || r.minutesLocked)) return false;
      if (boLoc === 'DU' && (!r.duPhieu || r.minutesLocked)) return false;
      if (boLoc === 'KHOA' && !r.minutesLocked) return false;
      if (!key) return true;
      const hay = `${r.code} ${r.title} ${r.ownerName || ''}`.toLowerCase();
      return hay.includes(key);
    });
  }, [rows, boLoc, q]);

  return (
    <PageContainer
      title={false}
      loading={loading}
      style={{ background: 'transparent' }}
    >
      <div
        style={{
          marginBottom: 20,
          padding: '22px 24px',
          borderRadius: 16,
          background:
            'linear-gradient(135deg, #0b3a6e 0%, #1677ff 48%, #69b1ff 100%)',
          color: '#fff',
          boxShadow: '0 10px 28px rgba(22,119,255,0.22)',
        }}
      >
        <Space align="start" size={14}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileSearchOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              Theo dõi phiếu đánh giá cuối kỳ
            </Title>
            <Paragraph
              style={{ color: 'rgba(255,255,255,0.88)', margin: '6px 0 0' }}
            >
              Tổng hợp tiến độ nộp phiếu của hội đồng — đủ phiếu rồi mới tổ
              chức họp.
            </Paragraph>
          </div>
        </Space>
      </div>

      <Row gutter={[14, 14]} style={{ marginBottom: 18 }}>
        {[
          {
            label: 'Nhiệm vụ đang theo dõi',
            value: thongKe.tong,
            color: '#1677ff',
            bg: '#e6f4ff',
          },
          {
            label: 'Chưa đủ phiếu',
            value: thongKe.cho,
            color: '#d46b08',
            bg: '#fff7e6',
          },
          {
            label: 'Đã đủ phiếu',
            value: thongKe.du,
            color: '#389e0d',
            bg: '#f6ffed',
          },
          {
            label: 'Đã khóa biên bản',
            value: thongKe.khoa,
            color: '#595959',
            bg: '#fafafa',
          },
        ].map((s) => (
          <Col xs={12} md={6} key={s.label}>
            <Card
              size="small"
              styles={{ body: { padding: '14px 16px' } }}
              style={{
                borderRadius: 14,
                border: `1px solid ${s.bg}`,
                background: s.bg,
              }}
            >
              <Text type="secondary" style={{ fontSize: 13 }}>
                {s.label}
              </Text>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: s.color,
                  lineHeight: 1.2,
                  marginTop: 4,
                }}
              >
                {s.value}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        size="small"
        style={{ borderRadius: 14, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Segmented
            value={boLoc}
            options={BO_LOC_OPTIONS}
            onChange={(v) => setBoLoc(v as BoLoc)}
          />
          <Input.Search
            allowClear
            placeholder="Tìm mã / tên nhiệm vụ / chủ nhiệm"
            style={{ width: 320, maxWidth: '100%' }}
            onSearch={setQ}
            onChange={(e) => {
              if (!e.target.value) setQ('');
            }}
          />
        </Space>
      </Card>

      {!filtered.length && !loading ? (
        <Card style={{ borderRadius: 14 }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              rows.length
                ? 'Không có nhiệm vụ khớp bộ lọc.'
                : 'Chưa có hội đồng ĐGCK nào để theo dõi (chỉ PKH hoặc Thư ký HĐ).'
            }
          />
        </Card>
      ) : (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          {filtered.map((r) => {
            const color = mauTienDo(
              r.progressPercent,
              r.duPhieu,
              r.minutesLocked,
            );
            const st = r.executionStatus || '';
            return (
              <Card
                key={r.outlineId}
                style={{
                  borderRadius: 16,
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                  overflow: 'hidden',
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 0,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      background: color,
                      flexShrink: 0,
                      minHeight: 120,
                    }}
                  />
                  <div style={{ flex: 1, padding: '16px 18px', minWidth: 0 }}>
                    <Space
                      wrap
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Space wrap size={8}>
                        <Tag
                          color="blue"
                          style={{ margin: 0, fontWeight: 600 }}
                        >
                          {r.code}
                        </Tag>
                        <Tag style={{ margin: 0 }}>
                          {NHAN_TRIEN_KHAI[st] || st || '—'}
                        </Tag>
                        {r.minutesLocked ? (
                          <Tag color="default" style={{ margin: 0 }}>
                            Đã khóa biên bản
                          </Tag>
                        ) : r.duPhieu ? (
                          <Tag color="success" style={{ margin: 0 }}>
                            <CheckCircleFilled /> Đủ phiếu — có thể họp
                          </Tag>
                        ) : (
                          <Tag color="warning" style={{ margin: 0 }}>
                            <ClockCircleOutlined /> Còn {r.pendingCount} phiếu
                          </Tag>
                        )}
                      </Space>
                      <Button
                        type="primary"
                        onClick={() =>
                          history.push(
                            `/projects/final-eval/tracking/${r.outlineId}`,
                          )
                        }
                      >
                        Xem chi tiết
                      </Button>
                    </Space>

                    <Title
                      level={5}
                      style={{ margin: '0 0 6px', lineHeight: 1.35 }}
                    >
                      {r.title}
                    </Title>

                    <Space wrap size={[16, 6]} style={{ marginBottom: 12 }}>
                      <Text type="secondary">
                        <UserOutlined /> Chủ nhiệm: {r.ownerName || '—'}
                      </Text>
                      <Text type="secondary">
                        <TeamOutlined /> HĐ: {r.memberCount} thành viên
                      </Text>
                      <Text type="secondary">
                        Họp:{' '}
                        {r.meetingAt
                          ? dayjs(r.meetingAt).format('HH:mm DD/MM/YYYY')
                          : 'Chưa chốt lịch'}
                        {r.location ? ` · ${r.location}` : ''}
                      </Text>
                    </Space>

                    <div style={{ maxWidth: 420, marginBottom: 12 }}>
                      <Space
                        style={{
                          width: '100%',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Text strong style={{ fontSize: 13 }}>
                          Tiến độ phiếu
                        </Text>
                        <Text style={{ fontSize: 13, color }}>
                          {`${r.submittedCount}/${r.memberCount} đã nộp`}
                        </Text>
                      </Space>
                      <Progress
                        percent={r.progressPercent}
                        strokeColor={color}
                        trailColor="#f0f0f0"
                        showInfo={false}
                        size={['100%', 10]}
                      />
                    </div>

                    <Avatar.Group
                      max={{ count: 8 }}
                      size="small"
                      style={{ marginBottom: 4 }}
                    >
                      {r.members.map((m) => (
                        <Avatar
                          key={m.userId}
                          style={{
                            backgroundColor:
                              m.sheetStatus === 'DA_NOP' ? '#52c41a' : '#faad14',
                            verticalAlign: 'middle',
                          }}
                          title={`${m.fullName} — ${
                            m.sheetStatus === 'DA_NOP' ? 'Đã nộp' : 'Chưa nộp'
                          }`}
                        >
                          {(m.fullName || '?').charAt(0).toUpperCase()}
                        </Avatar>
                      ))}
                    </Avatar.Group>
                    <div style={{ marginTop: 6 }}>
                      <Space size={[6, 6]} wrap>
                        {r.members.slice(0, 6).map((m) => (
                          <Tag
                            key={m.userId}
                            color={
                              m.sheetStatus === 'DA_NOP' ? 'success' : 'orange'
                            }
                            style={{ margin: 0 }}
                          >
                            {m.fullName}
                            {m.role
                              ? ` (${
                                  m.roleLabel ||
                                  NHAN_VAI_TRO_HD[
                                    m.role as keyof typeof NHAN_VAI_TRO_HD
                                  ] ||
                                  m.role
                                })`
                              : ''}
                          </Tag>
                        ))}
                        {r.members.length > 6 ? (
                          <Tag style={{ margin: 0 }}>
                            +{r.members.length - 6} thành viên
                          </Tag>
                        ) : null}
                      </Space>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </Space>
      )}
    </PageContainer>
  );
};

export default TrackingListPage;
