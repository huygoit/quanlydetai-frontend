/**
 * Hội đồng đánh giá của tôi — danh sách HĐ ĐGCK thành viên được mời.
 */
import { NHAN_TRIEN_KHAI, NHAN_VAI_TRO_HD } from '@/constants/module56';
import {
  danhSachPhieuDgckCuaToi,
  type PhieuDgckCuaToi,
} from '@/services/api/module56';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import {
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EnvironmentOutlined,
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

type BoLoc = 'ALL' | 'CHUA_NOP' | 'DA_NOP' | 'DU_HD';

const BO_LOC = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Phiếu của tôi chưa nộp', value: 'CHUA_NOP' },
  { label: 'Tôi đã nộp', value: 'DA_NOP' },
  { label: 'HĐ đã đủ phiếu', value: 'DU_HD' },
];

const MyCouncilsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PhieuDgckCuaToi[]>([]);
  const [boLoc, setBoLoc] = useState<BoLoc>('ALL');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await danhSachPhieuDgckCuaToi();
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
    const chuaNop = rows.filter((r) => !r.sheetSubmittedAt && !r.minutesLocked)
      .length;
    const daNop = rows.filter((r) => !!r.sheetSubmittedAt).length;
    const duHd = rows.filter((r) => r.duPhieu).length;
    return { tong, chuaNop, daNop, duHd };
  }, [rows]);

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (boLoc === 'CHUA_NOP' && (r.sheetSubmittedAt || r.minutesLocked))
        return false;
      if (boLoc === 'DA_NOP' && !r.sheetSubmittedAt) return false;
      if (boLoc === 'DU_HD' && !r.duPhieu) return false;
      if (!key) return true;
      return `${r.code} ${r.title} ${r.ownerName || ''}`.toLowerCase().includes(key);
    });
  }, [rows, boLoc, q]);

  return (
    <PageContainer title={false} loading={loading}>
      <div
        style={{
          marginBottom: 20,
          padding: '22px 24px',
          borderRadius: 16,
          background:
            'linear-gradient(135deg, #062a4a 0%, #0e5cad 50%, #3b9eff 100%)',
          color: '#fff',
          boxShadow: '0 10px 28px rgba(14,92,173,0.25)',
        }}
      >
        <Space align="start" size={14}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(255,255,255,0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TeamOutlined style={{ fontSize: 24 }} />
          </div>
          <div>
            <Title level={4} style={{ color: '#fff', margin: 0 }}>
              Hội đồng đánh giá của tôi
            </Title>
            <Paragraph
              style={{ color: 'rgba(255,255,255,0.88)', margin: '6px 0 0' }}
            >
              Các hội đồng đánh giá kết quả cuối kỳ bạn được mời. Xem thông tin
              nhiệm vụ, thành phần HĐ và nộp phiếu đánh giá.
            </Paragraph>
          </div>
        </Space>
      </div>

      <Row gutter={[14, 14]} style={{ marginBottom: 16 }}>
        {[
          { label: 'Hội đồng của tôi', value: thongKe.tong, color: '#1677ff', bg: '#e6f4ff' },
          { label: 'Phiếu chưa nộp', value: thongKe.chuaNop, color: '#d46b08', bg: '#fff7e6' },
          { label: 'Tôi đã nộp', value: thongKe.daNop, color: '#389e0d', bg: '#f6ffed' },
          { label: 'HĐ đủ phiếu', value: thongKe.duHd, color: '#08979c', bg: '#e6fffb' },
        ].map((s) => (
          <Col xs={12} md={6} key={s.label}>
            <Card
              size="small"
              styles={{ body: { padding: '14px 16px' } }}
              style={{ borderRadius: 14, background: s.bg, borderColor: s.bg }}
            >
              <Text type="secondary" style={{ fontSize: 13 }}>
                {s.label}
              </Text>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: s.color,
                  marginTop: 4,
                  lineHeight: 1.2,
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
            options={BO_LOC}
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
                ? 'Không có hội đồng khớp bộ lọc.'
                : 'Bạn chưa được mời vào hội đồng đánh giá cuối kỳ nào.'
            }
          />
        </Card>
      ) : (
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          {filtered.map((r) => {
            const st = r.executionStatus || '';
            const daNop = !!r.sheetSubmittedAt;
            const bar = r.minutesLocked
              ? '#8c8c8c'
              : r.duPhieu
                ? '#52c41a'
                : daNop
                  ? '#1677ff'
                  : '#fa8c16';
            return (
              <Card
                key={r.outlineId}
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 16px rgba(15,23,42,0.04)',
                }}
                styles={{ body: { padding: 0 } }}
              >
                <div style={{ display: 'flex' }}>
                  <div
                    style={{
                      width: 6,
                      background: bar,
                      flexShrink: 0,
                      minHeight: 140,
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
                        <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                          {r.code}
                        </Tag>
                        <Tag style={{ margin: 0 }}>
                          {NHAN_TRIEN_KHAI[st] || st || '—'}
                        </Tag>
                        <Tag color="geekblue" style={{ margin: 0 }}>
                          Vai trò:{' '}
                          {r.roleLabel ||
                            NHAN_VAI_TRO_HD[
                              (r.role || '') as keyof typeof NHAN_VAI_TRO_HD
                            ] ||
                            r.role ||
                            '—'}
                        </Tag>
                        {r.minutesLocked ? (
                          <Tag style={{ margin: 0 }}>Đã khóa biên bản</Tag>
                        ) : daNop ? (
                          <Tag color="success" style={{ margin: 0 }}>
                            <CheckCircleFilled /> Phiếu của tôi: Đã nộp
                          </Tag>
                        ) : (
                          <Tag color="warning" style={{ margin: 0 }}>
                            <ClockCircleOutlined /> Phiếu của tôi: Chưa nộp
                          </Tag>
                        )}
                      </Space>
                      <Space wrap>
                        <Button
                          onClick={() =>
                            history.push(`/projects/final-eval/my/${r.outlineId}`)
                          }
                        >
                          Xem hội đồng
                        </Button>
                        <Button
                          type="primary"
                          onClick={() =>
                            history.push(`/projects/final-eval/${r.outlineId}`)
                          }
                        >
                          {daNop || r.minutesLocked
                            ? 'Xem phiếu của tôi'
                            : 'Nhập phiếu đánh giá'}
                        </Button>
                        {r.role === 'THU_KY' &&
                        r.executionStatus === 'DGCK_HOP_HD' &&
                        !r.minutesLocked ? (
                          <Button
                            onClick={() =>
                              history.push(
                                `/projects/final-eval/my/${r.outlineId}/minutes`,
                              )
                            }
                          >
                            Tạo biên bản
                          </Button>
                        ) : null}
                      </Space>
                    </Space>

                    <Title level={5} style={{ margin: '0 0 8px', lineHeight: 1.35 }}>
                      {r.title}
                    </Title>

                    <Space wrap size={[16, 6]} style={{ marginBottom: 12 }}>
                      <Text type="secondary">
                        <UserOutlined /> Chủ nhiệm: {r.ownerName || '—'}
                        {r.ownerUnit ? ` (${r.ownerUnit})` : ''}
                      </Text>
                      <Text type="secondary">
                        <CalendarOutlined /> Họp:{' '}
                        {r.meetingAt
                          ? dayjs(r.meetingAt).format('HH:mm DD/MM/YYYY')
                          : 'Chưa chốt lịch'}
                      </Text>
                      <Text type="secondary">
                        <EnvironmentOutlined /> {r.location || '—'}
                      </Text>
                      <Text type="secondary">
                        <TeamOutlined /> {r.memberCount || 0} thành viên
                      </Text>
                    </Space>

                    <div style={{ maxWidth: 420, marginBottom: 10 }}>
                      <Space
                        style={{
                          width: '100%',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <Text strong style={{ fontSize: 13 }}>
                          Tiến độ phiếu HĐ
                        </Text>
                        <Text style={{ fontSize: 13, color: bar }}>
                          {r.submittedCount ?? 0}/{r.memberCount ?? 0} đã nộp
                        </Text>
                      </Space>
                      <Progress
                        percent={r.progressPercent ?? 0}
                        strokeColor={bar}
                        trailColor="#f0f0f0"
                        showInfo={false}
                        size={['100%', 10]}
                      />
                    </div>

                    <Avatar.Group max={{ count: 8 }} size="small">
                      {(r.members || []).map((m) => (
                        <Avatar
                          key={m.userId}
                          style={{
                            backgroundColor:
                              m.sheetStatus === 'DA_NOP' ? '#52c41a' : '#faad14',
                          }}
                          title={`${m.fullName} — ${
                            m.sheetStatus === 'DA_NOP' ? 'Đã nộp' : 'Chưa nộp'
                          }`}
                        >
                          {(m.fullName || '?').charAt(0).toUpperCase()}
                        </Avatar>
                      ))}
                    </Avatar.Group>
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

export default MyCouncilsPage;
