/**
 * Panel Hội đồng đánh giá KQCK — hiển thị đầy đủ + chỉnh sửa (PKH).
 */
import { NHAN_TRIEN_KHAI, NHAN_VAI_TRO_HD } from '@/constants/module56';
import {
  luuHoiDong,
  nhacPhanBien,
  type HoSoCuoiKy,
} from '@/services/api/module56';
import { getAvailableOutlineReviewers } from '@/services/api/projectOutlineReviews';
import { DATETIME_PICKER_FORMAT } from '@/utils/datetime';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  BellOutlined,
  CalendarOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  EditOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import type { VaiTro } from './types';

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

const ROLE_OPTS = Object.entries(NHAN_VAI_TRO_HD).map(([value, label]) => ({
  value,
  label,
}));

type ThanhVienSua = {
  userId: number;
  role: string;
  name?: string;
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
  productRows: { name?: string; soLuong?: string; chatLuong?: string }[];
  laToi: boolean;
};

function bao(e: unknown) {
  const x = e as { data?: { message?: string }; message?: string };
  return x?.data?.message || x?.message || 'Thất bại';
}

function parseMeta(raw: string) {
  try {
    const o = JSON.parse(raw || '{}');
    if (o && typeof o === 'object') return o as Record<string, string>;
  } catch {
    /* bỏ qua */
  }
  return {};
}

function mauVaiTro(role: string) {
  if (role === 'CHU_TICH') return 'magenta';
  if (role === 'THU_KY') return 'purple';
  if (role === 'PHAN_BIEN') return 'geekblue';
  return 'default';
}

type Props = {
  outlineId: number;
  hs: HoSoCuoiKy;
  vaiTro: VaiTro;
  onTai: () => void | Promise<void>;
  onXong: (t: string) => void;
};

export function PanelHoiDongDgck({
  outlineId,
  hs,
  vaiTro,
  onTai,
  onXong,
}: Props) {
  const khoa = !!hs.minutesLocked;
  const st = hs.executionStatus || '';
  const coTheSua = vaiTro.canManage && !khoa;

  const [meetingAt, setMeetingAt] = useState<string | null>(
    hs.council.meetingAt,
  );
  const [location, setLocation] = useState(hs.council.location || '');
  const [thanhVien, setThanhVien] = useState<ThanhVienSua[]>([]);
  const [nguoiOpts, setNguoiOpts] = useState<
    { value: number; label: string }[]
  >([]);
  const [dangLuu, setDangLuu] = useState(false);
  const [nhacId, setNhacId] = useState<number | null>(null);
  const [xem, setXem] = useState<DongTv | null>(null);

  useEffect(() => {
    setMeetingAt(hs.council.meetingAt);
    setLocation(hs.council.location || '');
    setThanhVien(
      (hs.council.members || []).map((m) => ({
        userId: m.userId,
        role: m.role,
        name: m.fullName || m.name,
      })),
    );
  }, [hs]);

  const dongTv: DongTv[] = useMemo(() => {
    return (hs.council.members || []).map((m) => {
      const uid = Number(m.userId);
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
        ketLuan: NHAN_KET_LUAN[kl] || (kl || null),
        bcKetQua: sheet?.volumeComment
          ? NHAN_DAT_KD[sheet.volumeComment] || sheet.volumeComment
          : null,
        generalComment: sheet?.generalComment || '',
        volumeComment: sheet?.volumeComment || '',
        qualityComment: sheet?.qualityComment || '',
        reportComment: kl,
        productRows: sheet?.productRows || [],
        laToi: Number(uid) === Number(vaiTro.userId),
      };
    });
  }, [hs, vaiTro.userId]);

  const submitted = dongTv.filter((d) => d.daNop).length;
  const total = dongTv.length;
  const pct = total ? Math.round((submitted / total) * 100) : 0;
  const duPhieu = total > 0 && submitted === total;
  const toi = dongTv.find((d) => d.laToi);
  const metaXem = xem ? parseMeta(xem.generalComment) : {};

  const demVai = useMemo(() => {
    const dem: Record<string, number> = {};
    dongTv.forEach((d) => {
      dem[d.role] = (dem[d.role] || 0) + 1;
    });
    return dem;
  }, [dongTv]);

  const timNguoi = async (kw: string) => {
    if (!kw.trim()) {
      setNguoiOpts([]);
      return;
    }
    try {
      const res = await getAvailableOutlineReviewers(outlineId, kw.trim());
      setNguoiOpts(
        (res?.data || [])
          .filter((r) => r.reviewerUserId)
          .map((r) => ({
            value: r.reviewerUserId as number,
            label: r.reviewerName,
          })),
      );
    } catch {
      setNguoiOpts([]);
    }
  };

  const luu = async () => {
    const dem = (role: string) =>
      thanhVien.filter((m) => m.role === role).length;
    if (thanhVien.length > 0) {
      if (dem('CHU_TICH') !== 1) {
        message.warning('Cần đúng 1 Chủ tịch');
        return;
      }
      if (dem('THU_KY') !== 1) {
        message.warning('Cần đúng 1 Thư ký');
        return;
      }
      if (dem('PHAN_BIEN') < 2) {
        message.warning('Cần ít nhất 2 Phản biện');
        return;
      }
    }
    setDangLuu(true);
    try {
      await luuHoiDong(outlineId, {
        meetingAt,
        location: location.trim() || null,
        members: thanhVien.map((m) => ({
          userId: m.userId,
          role: m.role,
        })),
      });
      onXong('Đã lưu hội đồng');
      await onTai();
    } catch (e) {
      message.error(bao(e));
    } finally {
      setDangLuu(false);
    }
  };

  const nhac = async (userId: number) => {
    setNhacId(userId);
    try {
      await nhacPhanBien(outlineId, userId);
      onXong('Đã gửi nhắc nộp phiếu');
    } catch (e) {
      message.error(bao(e));
    } finally {
      setNhacId(null);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {/* Đầu trang — thông tin hội đồng */}
      <div
        style={{
          padding: '20px 22px',
          borderRadius: 16,
          background:
            'linear-gradient(120deg, #062a4a 0%, #0e5cad 48%, #3b9eff 100%)',
          color: '#fff',
          boxShadow: '0 10px 28px rgba(14,92,173,0.22)',
        }}
      >
        <Space wrap size={8} style={{ marginBottom: 10 }}>
          <Tag
            color="blue"
            style={{
              margin: 0,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.95)',
            }}
          >
            {hs.code || '—'}
          </Tag>
          <Tag style={{ margin: 0, background: 'rgba(255,255,255,0.18)', color: '#fff', border: 'none' }}>
            {NHAN_TRIEN_KHAI[st] || st || '—'}
          </Tag>
          {khoa ? (
            <Tag style={{ margin: 0 }}>Đã khóa biên bản</Tag>
          ) : duPhieu ? (
            <Tag
              color="success"
              icon={<CheckCircleFilled />}
              style={{ margin: 0 }}
            >
              Đủ phiếu — sẵn sàng họp
            </Tag>
          ) : total > 0 ? (
            <Tag
              color="warning"
              icon={<ClockCircleOutlined />}
              style={{ margin: 0 }}
            >
              Còn {total - submitted} phiếu chưa nộp
            </Tag>
          ) : (
            <Tag color="default" style={{ margin: 0 }}>
              Chưa có thành viên
            </Tag>
          )}
        </Space>

        <Title level={4} style={{ color: '#fff', margin: '0 0 6px' }}>
          Hội đồng đánh giá kết quả nhiệm vụ
        </Title>
        <Paragraph
          style={{ color: 'rgba(255,255,255,0.9)', margin: '0 0 14px' }}
        >
          {hs.title || '—'}
        </Paragraph>

        <Row gutter={[12, 10]}>
          <Col xs={24} sm={12} md={8}>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
              <UserOutlined /> Chủ nhiệm
            </Text>
            <div style={{ fontWeight: 600 }}>{hs.ownerName || '—'}</div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
              <CalendarOutlined /> Thời gian họp
            </Text>
            <div style={{ fontWeight: 600 }}>
              {hs.council.meetingAt
                ? dayjs(hs.council.meetingAt).format('HH:mm — DD/MM/YYYY')
                : 'Chưa chốt lịch'}
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
              <EnvironmentOutlined /> Địa điểm
            </Text>
            <div style={{ fontWeight: 600 }}>
              {hs.council.location || 'Chưa ghi'}
            </div>
          </Col>
          {hs.council.reviewDeadline ? (
            <Col xs={24} sm={12} md={8}>
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
                <ClockCircleOutlined /> Hạn phản biện
              </Text>
              <div style={{ fontWeight: 600 }}>
                {dayjs(hs.council.reviewDeadline).format('DD/MM/YYYY HH:mm')}
              </div>
            </Col>
          ) : null}
          <Col xs={24} sm={12} md={8}>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>
              <TeamOutlined /> Thành phần
            </Text>
            <div style={{ fontWeight: 600 }}>{total} thành viên</div>
          </Col>
        </Row>
      </div>

      {/* Thống kê tiến độ */}
      <Row gutter={[14, 14]}>
        <Col xs={24} md={10}>
          <Card
            size="small"
            style={{ borderRadius: 14, height: '100%' }}
            styles={{ body: { padding: 16 } }}
          >
            <Text type="secondary">
              <TeamOutlined /> Tiến độ nộp phiếu
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
                {submitted}/{total || '—'}
              </span>
              <Text type="secondary">đã nộp</Text>
            </div>
            <Progress
              percent={pct}
              strokeColor={duPhieu ? '#52c41a' : '#1677ff'}
              size={['100%', 12]}
            />
            {total > 0 ? (
              <Space wrap size={[6, 6]} style={{ marginTop: 12 }}>
                {Object.entries(NHAN_VAI_TRO_HD).map(([k, label]) =>
                  demVai[k] ? (
                    <Tag key={k} color={mauVaiTro(k)} style={{ margin: 0 }}>
                      {label}: {demVai[k]}
                    </Tag>
                  ) : null,
                )}
              </Space>
            ) : null}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          {toi && !khoa ? (
            <Alert
              type={toi.daNop ? 'success' : 'warning'}
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message={
                toi.daNop
                  ? `Bạn (${toi.roleLabel}) đã nộp phiếu`
                  : `Bạn là ${toi.roleLabel} — chưa nộp phiếu`
              }
              description={
                toi.daNop
                  ? 'Có thể xem lại phiếu tại menu «Hội đồng đánh giá của tôi».'
                  : 'Vào menu «Hội đồng đánh giá của tôi» → Nhập phiếu đánh giá.'
              }
            />
          ) : khoa ? (
            <Alert
              type="info"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Biên bản đã khóa"
              description="Thông tin hội đồng và phiếu chỉ xem — không chỉnh sửa / nhắc nộp thêm."
            />
          ) : duPhieu ? (
            <Alert
              type="success"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Hội đồng đã đủ phiếu"
              description="Có thể tổ chức họp và lập biên bản đánh giá (BM-05.06)."
            />
          ) : total === 0 ? (
            <Alert
              type="warning"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Chưa thành lập thành phần hội đồng"
              description={
                coTheSua
                  ? 'Mở phần «Chỉnh sửa hội đồng» bên dưới để thêm thành viên, hoặc dùng nút Thành lập hội đồng từ hồ sơ đề nghị.'
                  : 'Chờ Phòng KH&HTQT thành lập hội đồng đánh giá.'
              }
            />
          ) : (
            <Alert
              type="info"
              showIcon
              style={{ borderRadius: 14, height: '100%' }}
              message="Đang chờ thành viên nộp phiếu"
              description={`Còn ${total - submitted} phiếu. PKH có thể nhắc từng người trong bảng bên dưới.`}
            />
          )}
        </Col>
      </Row>

      {/* Bảng thành viên */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Thành phần hội đồng & trạng thái phiếu</span>
          </Space>
        }
        style={{ borderRadius: 14 }}
        styles={{ body: { paddingTop: 8 } }}
      >
        {!dongTv.length ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có thành viên hội đồng"
          />
        ) : (
          <Table<DongTv>
            rowKey="userId"
            size="middle"
            pagination={false}
            dataSource={dongTv}
            columns={[
              {
                title: 'Thành viên',
                render: (_, r) => (
                  <Space>
                    <Avatar
                      style={{
                        backgroundColor: r.daNop ? '#52c41a' : '#faad14',
                      }}
                    >
                      {(r.fullName || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Space size={6}>
                        <Text strong>{r.fullName}</Text>
                        {r.laToi ? <Tag color="blue">Tôi</Tag> : null}
                      </Space>
                      <div>
                        <Tag
                          color={mauVaiTro(r.role)}
                          style={{ marginTop: 2, marginInlineEnd: 0 }}
                        >
                          {r.roleLabel}
                        </Tag>
                      </div>
                    </div>
                  </Space>
                ),
              },
              {
                title: 'Phiếu',
                width: 120,
                render: (_, r) =>
                  r.daNop ? (
                    <Tag color="success" icon={<CheckCircleFilled />}>
                      Đã nộp
                    </Tag>
                  ) : (
                    <Tag color="orange" icon={<ClockCircleOutlined />}>
                      Chưa nộp
                    </Tag>
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
                title: 'KQ báo cáo',
                width: 110,
                render: (_, r) => r.bcKetQua || '—',
              },
              {
                title: 'Kết luận',
                width: 130,
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
                width: 180,
                render: (_, r) => (
                  <Space>
                    {r.daNop ? (
                      <Button type="link" onClick={() => setXem(r)}>
                        Xem phiếu
                      </Button>
                    ) : null}
                    {!r.daNop && !khoa && vaiTro.canManage ? (
                      <Button
                        type="link"
                        icon={<BellOutlined />}
                        loading={nhacId === r.userId}
                        onClick={() => void nhac(r.userId)}
                      >
                        Nhắc
                      </Button>
                    ) : null}
                    {!r.daNop && !vaiTro.canManage ? (
                      <Text type="secondary">—</Text>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
        )}
        {hs.minutesFileUrl ? (
          <div style={{ marginTop: 12 }}>
            <a
              href={resolvePublicAssetUrl(hs.minutesFileUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Tải biên bản đã lưu
            </a>
          </div>
        ) : null}
      </Card>

      {/* PKH chỉnh sửa */}
      {coTheSua ? (
        <Collapse
          style={{ borderRadius: 14, overflow: 'hidden' }}
          items={[
            {
              key: 'sua',
              label: (
                <Space>
                  <EditOutlined />
                  <span>Chỉnh sửa hội đồng (thời gian / địa điểm / thành viên)</span>
                </Space>
              ),
              children: (
                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                  <Row gutter={12}>
                    <Col xs={24} md={12}>
                      <div style={{ marginBottom: 4, fontWeight: 500 }}>
                        Thời gian họp
                      </div>
                      <DatePicker
                        showTime
                        style={{ width: '100%' }}
                        format={DATETIME_PICKER_FORMAT}
                        value={meetingAt ? dayjs(meetingAt) : null}
                        onChange={(v) =>
                          setMeetingAt(v ? v.toISOString() : null)
                        }
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <div style={{ marginBottom: 4, fontWeight: 500 }}>
                        Địa điểm
                      </div>
                      <Input
                        placeholder="Phòng họp / link trực tuyến"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </Col>
                  </Row>

                  <div>
                    <div style={{ marginBottom: 6, fontWeight: 500 }}>
                      Thêm thành viên
                    </div>
                    <Select
                      showSearch
                      filterOption={false}
                      style={{ width: '100%' }}
                      placeholder="Tìm theo họ tên…"
                      options={nguoiOpts}
                      value={undefined}
                      onSearch={(kw) => void timNguoi(kw)}
                      onChange={(userId, opt) => {
                        const label = (opt as { label?: string })?.label;
                        setThanhVien((s) =>
                          s.some((m) => m.userId === userId)
                            ? s
                            : [
                                ...s,
                                {
                                  userId,
                                  role: 'UY_VIEN',
                                  name: label,
                                },
                              ],
                        );
                      }}
                    />
                  </div>

                  <Table
                    size="small"
                    rowKey="userId"
                    pagination={false}
                    dataSource={thanhVien}
                    locale={{ emptyText: 'Chưa thêm thành viên' }}
                    columns={[
                      {
                        title: 'Họ tên',
                        render: (_, r) => r.name || `#${r.userId}`,
                      },
                      {
                        title: 'Vai trò',
                        width: 170,
                        render: (_, r) => (
                          <Select
                            style={{ width: 158 }}
                            value={r.role}
                            options={ROLE_OPTS}
                            onChange={(role) =>
                              setThanhVien((s) =>
                                s.map((x) =>
                                  x.userId === r.userId ? { ...x, role } : x,
                                ),
                              )
                            }
                          />
                        ),
                      },
                      {
                        title: '',
                        width: 64,
                        render: (_, r) => (
                          <a
                            onClick={() =>
                              setThanhVien((s) =>
                                s.filter((x) => x.userId !== r.userId),
                              )
                            }
                          >
                            Xóa
                          </a>
                        ),
                      },
                    ]}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Bắt buộc khi có thành viên: 1 Chủ tịch, 1 Thư ký, ≥ 2 Phản
                    biện.
                  </Text>
                  <Button type="primary" loading={dangLuu} onClick={() => void luu()}>
                    Lưu hội đồng
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      ) : null}

      <Drawer
        title={xem ? `Phiếu — ${xem.fullName}` : 'Phiếu đánh giá'}
        open={!!xem}
        width="50vw"
        onClose={() => setXem(null)}
        destroyOnClose
      >
        {xem ? (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Tóm tắt kết luận phiếu đánh giá đã nộp.
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
                      render: (_, p) =>
                        NHAN_DAT_KD[p.soLuong || ''] || p.soLuong || '—',
                    },
                    {
                      title: 'CL',
                      width: 90,
                      render: (_, p) =>
                        NHAN_DAT_KD[p.chatLuong || ''] || p.chatLuong || '—',
                    },
                  ]}
                />
              </div>
            ) : null}
          </Space>
        ) : null}
      </Drawer>
    </Space>
  );
}
