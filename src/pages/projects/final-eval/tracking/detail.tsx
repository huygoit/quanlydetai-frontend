/**
 * Chi tiết tổng hợp phiếu ĐGCK — từng thành viên, nhắc nộp, xem kết luận.
 */
import { NHAN_TRIEN_KHAI, NHAN_VAI_TRO_HD } from '@/constants/module56';
import {
  hoSoCuoiKy,
  nhacPhanBien,
  type HoSoCuoiKy,
} from '@/services/api/module56';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import {
  ArrowLeftOutlined,
  BellOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Text, Title, Paragraph } = Typography;

const NHAN_KET_LUAN: Record<string, string> = {
  DAT_YEU_CAU: 'Đạt',
  CAN_BO_SUNG: 'Cần bổ sung',
  KHONG_DAT: 'Không đạt',
};

const NHAN_DAT_KD: Record<string, string> = {
  DAT: 'Đạt',
  KHONG_DAT: 'Không đạt',
};

type DongTv = {
  userId: number;
  fullName: string;
  role: string;
  roleLabel: string;
  daNop: boolean;
  submittedAt: string | null;
  ketLuan: string | null;
  bcKetQua: string | null;
  generalComment: string;
  volumeComment: string;
  qualityComment: string;
  reportComment: string;
  productRows: any[];
};

function parseMeta(raw: string) {
  try {
    const o = JSON.parse(raw || '{}');
    if (o && typeof o === 'object') return o as Record<string, string>;
  } catch {
    /* bỏ qua */
  }
  return {};
}

const TrackingDetailPage: React.FC = () => {
  const params = useParams<{ outlineId: string }>();
  const outlineId = Number(params.outlineId);
  const [loading, setLoading] = useState(true);
  const [hs, setHs] = useState<HoSoCuoiKy | null>(null);
  const [nhacId, setNhacId] = useState<number | null>(null);
  const [xem, setXem] = useState<DongTv | null>(null);

  const load = useCallback(async () => {
    if (!outlineId) return;
    setLoading(true);
    try {
      const res = await hoSoCuoiKy(outlineId);
      setHs(res.data);
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Không tải được hồ sơ'));
      setHs(null);
    } finally {
      setLoading(false);
    }
  }, [outlineId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dongTv: DongTv[] = useMemo(() => {
    if (!hs) return [];
    const sheets = hs.sheets || [];
    return (hs.council?.members || []).map((m: any) => {
      const uid = Number(m.userId ?? m.user_id);
      const sheet = sheets.find((s) => Number(s.userId) === uid);
      const role = String(m.role || '');
      const kl = String(sheet?.reportComment || '');
      return {
        userId: uid,
        fullName: m.fullName || m.name || `#${uid}`,
        role,
        roleLabel:
          NHAN_VAI_TRO_HD[role as keyof typeof NHAN_VAI_TRO_HD] || role || '—',
        daNop: !!sheet?.submittedAt,
        submittedAt: sheet?.submittedAt || null,
        ketLuan: NHAN_KET_LUAN[kl] || kl || null,
        bcKetQua: sheet?.volumeComment
          ? NHAN_DAT_KD[sheet.volumeComment] || sheet.volumeComment
          : null,
        generalComment: sheet?.generalComment || '',
        volumeComment: sheet?.volumeComment || '',
        qualityComment: sheet?.qualityComment || '',
        reportComment: sheet?.reportComment || '',
        productRows: (sheet as any)?.productRows || [],
      };
    });
  }, [hs]);

  const submitted = dongTv.filter((d) => d.daNop).length;
  const total = dongTv.length;
  const pct = total ? Math.round((submitted / total) * 100) : 0;
  const duPhieu = total > 0 && submitted === total;
  const khoa = !!hs?.minutesLocked;
  const st = hs?.executionStatus || '';
  const metaXem = xem ? parseMeta(xem.generalComment) : {};

  const nhac = async (userId: number) => {
    setNhacId(userId);
    try {
      await nhacPhanBien(outlineId, userId);
      message.success('Đã gửi nhắc nộp phiếu');
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Nhắc thất bại'));
    } finally {
      setNhacId(null);
    }
  };

  return (
    <PageContainer
      loading={loading}
      title={false}
      onBack={() => history.push('/projects/final-eval/tracking')}
    >
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        style={{ paddingLeft: 0, marginBottom: 8 }}
        onClick={() => history.push('/projects/final-eval/tracking')}
      >
        Quay lại danh sách theo dõi
      </Button>

      <div
        style={{
          marginBottom: 18,
          padding: '20px 22px',
          borderRadius: 16,
          background:
            'linear-gradient(120deg, #f0f5ff 0%, #ffffff 45%, #f6ffed 100%)',
          border: '1px solid #d6e4ff',
        }}
      >
        <Space wrap size={8} style={{ marginBottom: 8 }}>
          <Tag color="blue" style={{ fontWeight: 600 }}>
            {hs?.code || '—'}
          </Tag>
          <Tag>{NHAN_TRIEN_KHAI[st] || st || '—'}</Tag>
          {khoa ? (
            <Tag>Đã khóa biên bản</Tag>
          ) : duPhieu ? (
            <Tag color="success" icon={<CheckCircleFilled />}>
              Đủ phiếu — sẵn sàng họp
            </Tag>
          ) : (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              Còn {total - submitted} phiếu chưa nộp
            </Tag>
          )}
        </Space>
        <Title level={4} style={{ margin: '0 0 8px' }}>
          {hs?.title || 'Chi tiết phiếu ĐGCK'}
        </Title>
        <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Chủ nhiệm">
            {hs?.ownerName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian họp">
            {hs?.council?.meetingAt
              ? dayjs(hs.council.meetingAt).format('HH:mm DD/MM/YYYY')
              : 'Chưa chốt'}
          </Descriptions.Item>
          <Descriptions.Item label="Địa điểm">
            {hs?.council?.location || '—'}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <Row gutter={[14, 14]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <Card
            size="small"
            style={{ borderRadius: 14, height: '100%' }}
            styles={{ body: { padding: 16 } }}
          >
            <Text type="secondary">Tiến độ nộp phiếu</Text>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
                margin: '8px 0 12px',
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 700, color: '#1677ff' }}>
                {submitted}/{total}
              </span>
              <Text type="secondary">thành viên đã nộp</Text>
            </div>
            <Progress
              percent={pct}
              strokeColor={duPhieu ? '#52c41a' : '#1677ff'}
              size={['100%', 12]}
            />
          </Card>
        </Col>
        <Col xs={24} md={14}>
          {duPhieu && !khoa ? (
            <Alert
              type="success"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Đã đủ phiếu đánh giá"
              description="Có thể tổ chức họp hội đồng. Thư ký/PKH đối chiếu kết luận các phiếu trước khi lập biên bản."
            />
          ) : khoa ? (
            <Alert
              type="info"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Biên bản đã khóa"
              description="Phiếu chỉ xem — không nhắc nộp thêm."
            />
          ) : (
            <Alert
              type="warning"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Chưa đủ phiếu"
              description="Nhắc các thành viên còn thiếu trước khi yêu cầu cuộc họp hội đồng."
            />
          )}
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Danh sách phiếu theo thành viên</span>
          </Space>
        }
        style={{ borderRadius: 14 }}
      >
        <Table<DongTv>
          rowKey="userId"
          size="middle"
          pagination={false}
          dataSource={dongTv}
          columns={[
            {
              title: 'Thành viên',
              render: (_, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {r.roleLabel}
                  </Text>
                </div>
              ),
            },
            {
              title: 'Trạng thái phiếu',
              width: 140,
              render: (_, r) =>
                r.daNop ? (
                  <Tag color="success">Đã nộp</Tag>
                ) : (
                  <Tag color="orange">Chưa nộp</Tag>
                ),
            },
            {
              title: 'Nộp lúc',
              width: 160,
              render: (_, r) =>
                r.submittedAt
                  ? dayjs(r.submittedAt).format('DD/MM/YYYY HH:mm')
                  : '—',
            },
            {
              title: 'KQ báo cáo',
              width: 110,
              render: (_, r) => r.bcKetQua || '—',
            },
            {
              title: 'Kết luận',
              width: 140,
              render: (_, r) =>
                r.ketLuan ? (
                  <Tag
                    color={
                      r.reportComment === 'DAT_YEU_CAU'
                        ? 'success'
                        : r.reportComment === 'KHONG_DAT'
                          ? 'error'
                          : 'warning'
                    }
                  >
                    {r.ketLuan}
                  </Tag>
                ) : (
                  '—'
                ),
            },
            {
              title: 'Thao tác',
              width: 200,
              render: (_, r) => (
                <Space>
                  {r.daNop ? (
                    <Button type="link" onClick={() => setXem(r)}>
                      Xem phiếu
                    </Button>
                  ) : !khoa ? (
                    <Button
                      type="link"
                      icon={<BellOutlined />}
                      loading={nhacId === r.userId}
                      onClick={() => void nhac(r.userId)}
                    >
                      Nhắc nộp
                    </Button>
                  ) : (
                    '—'
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        title={xem ? `Phiếu — ${xem.fullName}` : 'Phiếu đánh giá'}
        open={!!xem}
        width={520}
        onClose={() => setXem(null)}
        destroyOnClose
      >
        {xem ? (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Vai trò">
                {xem.roleLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Nộp lúc">
                {xem.submittedAt
                  ? dayjs(xem.submittedAt).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Kết quả báo cáo">
                {xem.bcKetQua || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Kết luận đề nghị">
                {xem.ketLuan || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Ghi chú báo cáo">
                {xem.qualityComment || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung bổ sung">
                {metaXem.supplementContent || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Kiến nghị khác">
                {metaXem.otherRecommendation || '—'}
              </Descriptions.Item>
            </Descriptions>
            {xem.productRows?.length ? (
              <div>
                <Paragraph strong style={{ marginBottom: 8 }}>
                  Đánh giá sản phẩm ({xem.productRows.length})
                </Paragraph>
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(_, i) => String(i)}
                  dataSource={xem.productRows}
                  columns={[
                    {
                      title: 'Sản phẩm',
                      dataIndex: 'name',
                      ellipsis: true,
                    },
                    {
                      title: 'SL',
                      width: 90,
                      render: (_, p: any) =>
                        NHAN_DAT_KD[p.soLuong] || p.soLuong || '—',
                    },
                    {
                      title: 'CL',
                      width: 90,
                      render: (_, p: any) =>
                        NHAN_DAT_KD[p.chatLuong] || p.chatLuong || '—',
                    },
                  ]}
                />
              </div>
            ) : null}
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default TrackingDetailPage;
