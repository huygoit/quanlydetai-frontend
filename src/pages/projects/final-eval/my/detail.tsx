/**
 * Chi tiết hội đồng ĐGCK — thông tin HĐ + phiếu thành viên + phiếu của tôi
 * (+ hồ sơ giải trình BM-05.07 khi Thư ký / Chủ tịch nhận thông báo).
 */
import { NHAN_TRIEN_KHAI, NHAN_VAI_TRO_HD, ST_CHINH_SUA } from '@/constants/module56';
import { GiaiTrinh } from '@/pages/projects/execution/TabCuoiKy';
import type { VaiTro } from '@/pages/projects/execution/types';
import { hoSoCuoiKy, type HoSoCuoiKy } from '@/services/api/module56';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  FileTextOutlined,
  FormOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useLocation, useModel, useParams } from '@umijs/max';
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  reportComment: string;
  volumeComment: string;
  qualityComment: string;
  generalComment: string;
  productRows: any[];
  laToi: boolean;
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

const MyCouncilDetailPage: React.FC = () => {
  const { outlineId: raw } = useParams<{ outlineId: string }>();
  const outlineId = Number(raw);
  const { search } = useLocation();
  const focus = new URLSearchParams(search).get('focus') || '';
  const { initialState } = useModel('@@initialState');
  const userId = Number(
    (initialState?.currentUser as { id?: number } | undefined)?.id || 0,
  );
  const refGiaiTrinh = useRef<HTMLDivElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [hs, setHs] = useState<HoSoCuoiKy | null>(null);
  const [xem, setXem] = useState<DongTv | null>(null);

  const load = useCallback(async () => {
    if (!outlineId) return;
    setLoading(true);
    try {
      const res = await hoSoCuoiKy(outlineId);
      setHs(res.data);
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Không tải được hội đồng'));
      setHs(null);
    } finally {
      setLoading(false);
    }
  }, [outlineId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (focus !== 'giaitrinh' || loading || !hs) return;
    const t = window.setTimeout(() => {
      refGiaiTrinh.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
    return () => window.clearTimeout(t);
  }, [focus, loading, hs]);

  const dongTv: DongTv[] = useMemo(() => {
    if (!hs) return [];
    return (hs.council?.members || []).map((m: any) => {
      const uid = Number(m.userId ?? m.user_id);
      const sheet = (hs.sheets || []).find((s) => Number(s.userId) === uid);
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
        reportComment: kl,
        volumeComment: sheet?.volumeComment || '',
        qualityComment: sheet?.qualityComment || '',
        generalComment: sheet?.generalComment || '',
        productRows: (sheet as any)?.productRows || [],
        laToi: Number(uid) === Number(userId),
      };
    });
  }, [hs, userId]);

  const submitted = dongTv.filter((d) => d.daNop).length;
  const total = dongTv.length;
  const pct = total ? Math.round((submitted / total) * 100) : 0;
  const phieuToi = dongTv.find((d) => d.laToi);
  const daNopToi = !!phieuToi?.daNop;
  const khoa = !!hs?.minutesLocked;
  const st = hs?.executionStatus || '';
  const vaiTroToi = phieuToi?.roleLabel || '—';
  const laThuKy = phieuToi?.role === 'THU_KY';
  const duPhieu = total > 0 && submitted === total;
  const hienBienBan =
    laThuKy &&
    st === 'DGCK_HOP_HD' &&
    !khoa &&
    (duPhieu || submitted > 0);
  const metaXem = xem ? parseMeta(xem.generalComment) : {};

  const stGt = hs?.explanation?.status || '';
  const canGiaiTrinh =
    ST_CHINH_SUA.includes(String(st)) ||
    !!stGt ||
    hs?.classification === 'CAN_BO_SUNG' ||
    focus === 'giaitrinh';
  const vaiTroHd: VaiTro = {
    canManage: false,
    canCnnv: false,
    canBgh: false,
    canPublish: false,
    canTc: false,
    canCsvc: false,
    canLead: false,
    userId,
  };
  const toiRole = phieuToi?.role;

  return (
    <PageContainer title={false} loading={loading}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        style={{ paddingLeft: 0, marginBottom: 8 }}
        onClick={() => history.push('/projects/final-eval/my')}
      >
        Quay lại hội đồng của tôi
      </Button>

      <div
        style={{
          marginBottom: 18,
          padding: '20px 22px',
          borderRadius: 16,
          background:
            'linear-gradient(120deg, #e6f4ff 0%, #ffffff 50%, #f6ffed 100%)',
          border: '1px solid #bae0ff',
        }}
      >
        <Space wrap size={8} style={{ marginBottom: 8 }}>
          <Tag color="blue" style={{ fontWeight: 600 }}>
            {hs?.code || '—'}
          </Tag>
          <Tag>{NHAN_TRIEN_KHAI[st] || st || '—'}</Tag>
          <Tag color="geekblue">Vai trò của tôi: {vaiTroToi}</Tag>
          {daNopToi ? (
            <Tag color="success" icon={<CheckCircleFilled />}>
              Phiếu của tôi: Đã nộp
            </Tag>
          ) : (
            <Tag color="warning">Phiếu của tôi: Chưa nộp</Tag>
          )}
        </Space>
        <Title level={4} style={{ margin: '0 0 10px' }}>
          {hs?.title || 'Chi tiết hội đồng'}
        </Title>
        <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Chủ nhiệm">
            {hs?.ownerName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian họp">
            <CalendarOutlined />{' '}
            {hs?.council?.meetingAt
              ? dayjs(hs.council.meetingAt).format('HH:mm DD/MM/YYYY')
              : 'Chưa chốt'}
          </Descriptions.Item>
          <Descriptions.Item label="Địa điểm">
            <EnvironmentOutlined /> {hs?.council?.location || '—'}
          </Descriptions.Item>
        </Descriptions>
        <div style={{ marginTop: 14 }}>
          <Space wrap>
            <Button
              type={hienBienBan ? 'default' : 'primary'}
              size="large"
              onClick={() => history.push(`/projects/final-eval/${outlineId}`)}
            >
              {daNopToi || khoa
                ? 'Xem phiếu đánh giá của tôi'
                : 'Nhập phiếu đánh giá'}
            </Button>
            {hienBienBan ? (
              <Button
                type="primary"
                size="large"
                onClick={() =>
                  history.push(`/projects/final-eval/my/${outlineId}/minutes`)
                }
              >
                Tạo biên bản họp
              </Button>
            ) : null}
            {khoa && hs?.minutesFileUrl ? (
              <Button
                size="large"
                onClick={() =>
                  history.push(`/projects/final-eval/my/${outlineId}/minutes`)
                }
              >
                Xem biên bản
              </Button>
            ) : null}
            {canGiaiTrinh ? (
              <Button
                size="large"
                type={
                  stGt === 'CHO_THU_KY' || stGt === 'CHO_CHU_TICH'
                    ? 'primary'
                    : 'default'
                }
                icon={<FormOutlined />}
                onClick={() =>
                  refGiaiTrinh.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  })
                }
              >
                Hồ sơ giải trình BM-05.07
              </Button>
            ) : null}
          </Space>
        </div>
      </div>

      <Row gutter={[14, 14]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={10}>
          <Card size="small" style={{ borderRadius: 14, height: '100%' }}>
            <Text type="secondary">
              <TeamOutlined /> Tiến độ phiếu hội đồng
            </Text>
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
              <Text type="secondary">đã nộp</Text>
            </div>
            <Progress
              percent={pct}
              strokeColor={submitted === total && total > 0 ? '#52c41a' : '#1677ff'}
              size={['100%', 12]}
            />
          </Card>
        </Col>
        <Col xs={24} md={14}>
          {!daNopToi && !khoa ? (
            <Alert
              type="warning"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Bạn chưa nộp phiếu đánh giá"
              description="Vào «Nhập phiếu đánh giá» để hoàn thành trước cuộc họp."
            />
          ) : submitted === total && total > 0 ? (
            <Alert
              type="success"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Hội đồng đã đủ phiếu"
              description="Có thể đối chiếu kết luận các thành viên trước khi họp."
            />
          ) : (
            <Alert
              type="info"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Đang chờ thành viên khác nộp phiếu"
              description={`Còn ${total - submitted} phiếu chưa nộp.`}
            />
          )}
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Thành phần hội đồng & phiếu đánh giá</span>
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
                  <Space size={6}>
                    <Text strong>{r.fullName}</Text>
                    {r.laToi ? <Tag color="blue">Tôi</Tag> : null}
                  </Space>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {r.roleLabel}
                    </Text>
                  </div>
                </div>
              ),
            },
            {
              title: 'Trạng thái',
              width: 120,
              render: (_, r) =>
                r.daNop ? (
                  <Tag color="success">Đã nộp</Tag>
                ) : (
                  <Tag color="orange">Chưa nộp</Tag>
                ),
            },
            {
              title: 'Nộp lúc',
              width: 150,
              render: (_, r) =>
                r.submittedAt
                  ? dayjs(r.submittedAt).format('DD/MM/YYYY HH:mm')
                  : '—',
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
              width: 160,
              render: (_, r) => {
                if (r.laToi) {
                  return (
                    <Button
                      type="link"
                      onClick={() =>
                        history.push(`/projects/final-eval/${outlineId}`)
                      }
                    >
                      {r.daNop || khoa ? 'Xem phiếu' : 'Nhập phiếu'}
                    </Button>
                  );
                }
                if (r.daNop) {
                  return (
                    <Button type="link" onClick={() => setXem(r)}>
                      Xem tóm tắt
                    </Button>
                  );
                }
                return <Text type="secondary">—</Text>;
              },
            },
          ]}
        />
      </Card>

      {hs && canGiaiTrinh ? (
        <div ref={refGiaiTrinh} style={{ marginTop: 16 }}>
          <Card
            title={
              <Space>
                <FormOutlined />
                <span>Hồ sơ giải trình (BM-05.07)</span>
              </Space>
            }
            style={{ borderRadius: 14 }}
          >
            <GiaiTrinh
              hs={hs}
              vaiTro={vaiTroHd}
              toiRole={toiRole}
              outlineId={outlineId}
              onXong={() => {
                message.success('Đã cập nhật hồ sơ giải trình');
                void load();
              }}
            />
          </Card>
        </div>
      ) : null}

      <Drawer
        title={xem ? `Tóm tắt phiếu — ${xem.fullName}` : 'Tóm tắt phiếu'}
        open={!!xem}
        width="50vw"
        onClose={() => setXem(null)}
        destroyOnClose
      >
        {xem ? (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Chỉ xem tóm tắt kết luận của thành viên đã nộp.
            </Paragraph>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Vai trò">
                {xem.roleLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Nộp lúc">
                {xem.submittedAt
                  ? dayjs(xem.submittedAt).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="KQ báo cáo">
                {NHAN_DAT_KD[xem.volumeComment] || xem.volumeComment || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Kết luận">
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
              <Table
                size="small"
                pagination={false}
                rowKey={(_, i) => String(i)}
                dataSource={xem.productRows}
                columns={[
                  { title: 'Sản phẩm', dataIndex: 'name', ellipsis: true },
                  {
                    title: 'SL',
                    width: 80,
                    render: (_, p: any) =>
                      NHAN_DAT_KD[p.soLuong] || p.soLuong || '—',
                  },
                  {
                    title: 'CL',
                    width: 80,
                    render: (_, p: any) =>
                      NHAN_DAT_KD[p.chatLuong] || p.chatLuong || '—',
                  },
                ]}
              />
            ) : null}
          </Space>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default MyCouncilDetailPage;
