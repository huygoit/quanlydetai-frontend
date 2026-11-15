/**
 * BM.08 — Báo cáo tiến độ: danh sách + sheet bên phải (footer cố định).
 * Nội dung tiến độ chọn từ danh sách tiến độ thực hiện trên hợp đồng.
 */
import { HAN_FILE, NHAN_BCTD } from '@/constants/module56';
import {
  luuTienDo,
  manTienDo,
  pkhTienDo,
  xoaTienDo,
  type KyTienDo,
  type ManTienDo,
  type MocHopDong,
  type TepModule56,
} from '@/services/api/module56';
import { formatVnd } from '@/utils/format';
import {
  CalendarOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ChonTep } from './ChonTep';
import type { VaiTro } from './types';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

/** Tiến độ % — chọn nhanh 10 → 100 */
const OPT_PHAN_TRAM = Array.from({ length: 10 }, (_, i) => {
  const n = (i + 1) * 10;
  return { value: String(n), label: `${n}%` };
});

/** Màu thanh tiến trình theo % */
function mauTienDo(pct: number): 'exception' | 'normal' | 'success' | 'active' {
  if (pct <= 0) return 'normal';
  if (pct < 40) return 'exception';
  if (pct < 100) return 'active';
  return 'success';
}

function phanTramTuBaoCao(r: KyTienDo): number {
  const raw = r.report?.contentRows?.[0]?.progress;
  const n = Number(String(raw || '').replace('%', '').trim());
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
}

/** Số ngày còn lại tới hạn — ưu tiên API, thiếu thì tự tính từ dueOn */
function soNgayConLai(r: KyTienDo): number | null {
  if (typeof r.daysLeft === 'number' && Number.isFinite(r.daysLeft)) {
    return r.daysLeft;
  }
  if (!r.dueOn) return null;
  const due = dayjs(r.dueOn).startOf('day');
  if (!due.isValid()) return null;
  return due.diff(dayjs().startOf('day'), 'day');
}

type DongNoiDung = {
  id: string;
  milestone: string;
  progress: string;
  done: string;
  /** Sản phẩm theo TM / hợp đồng — cùng hàng với nội dung công việc */
  productName: string;
  productAchieved: string;
};

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

function mauNgay(v?: string | null) {
  return v ? dayjs(v).format('DD/MM/YYYY') : '—';
}

/** Chuẩn hóa chuỗi tiến độ về 10..100 (bước 10) */
function chuanPhanTram(raw?: string | null) {
  const n = Number(String(raw || '').replace('%', '').trim());
  if (!Number.isFinite(n) || n <= 0) return '';
  const buoc = Math.min(100, Math.max(10, Math.round(n / 10) * 10));
  return String(buoc);
}

export function TabTienDo({
  outlineId,
  vaiTro,
  onXong,
}: {
  outlineId: number;
  vaiTro: VaiTro;
  onXong: (t: string) => void;
}) {
  const [data, setData] = useState<ManTienDo | null>(null);
  const [loi, setLoi] = useState('');
  const [ky, setKy] = useState<KyTienDo | null>(null);
  const [contentRows, setContentRows] = useState<DongNoiDung[]>([]);
  const [nextPlan, setNextPlan] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [tep, setTep] = useState<TepModule56[]>([]);
  const [saving, setSaving] = useState(false);
  const [traLaiOpen, setTraLaiOpen] = useState(false);
  const [traLaiId, setTraLaiId] = useState<number | null>(null);
  const [traLaiNote, setTraLaiNote] = useState('');

  const tai = () =>
    manTienDo(outlineId)
      .then((res) => {
        setData(res.data);
        setLoi('');
      })
      .catch((e) => setLoi(bao(e)));

  useEffect(() => {
    tai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId]);

  const tongTep = useMemo(
    () => tep.reduce((s, t) => s + (t.fileSize || 0), 0),
    [tep],
  );

  const mocHd: MocHopDong[] = data?.milestones?.length
    ? data.milestones
    : (data?.templates?.contentRows || []).map((r) => ({
        content: r.milestone,
        thoiGian: r.thoiGian,
        sanPham: r.sanPham,
      }));

  const coQuyenLap = vaiTro.canCnnv || vaiTro.canManage;

  function suaDuoc(row: KyTienDo) {
    return (
      coQuyenLap &&
      (!row.report ||
        row.report.status === 'BCTD_DRAFT' ||
        row.report.status === 'BCTD_BS')
    );
  }

  const chiXem = (row: KyTienDo) => !!row.report && !suaDuoc(row);

  const napForm = (row: KyTienDo) => {
    const bc = row.report;
    setKy(row);
    // Mỗi kỳ chỉ báo đúng 1 mốc tiến độ (theo tên kỳ / hợp đồng)
    const hit =
      mocHd.find((m) => m.content === row.title) ||
      mocHd.find((m) => m.content === bc?.contentRows?.[0]?.milestone) ||
      mocHd[0];
    const milestone = hit?.content || row.title;
    const tuBc =
      bc?.contentRows?.find((r) => r.milestone === milestone) ||
      bc?.contentRows?.[0];
    const tmplSp = data?.templates?.productRows || [];
    const spDaLuu = bc?.productRows || [];
    // Sản phẩm cùng hàng: ưu tiên sp trên mốc HĐ, rồi template / đã lưu
    const productName =
      (hit?.sanPham || '').trim() ||
      spDaLuu[0]?.name ||
      tmplSp[0]?.name ||
      '';
    const productAchieved =
      spDaLuu.find((p) => p.name === productName)?.achieved ||
      spDaLuu[0]?.achieved ||
      '';
    setContentRows([
      {
        id: `c-0-${milestone}`,
        milestone,
        progress: chuanPhanTram(tuBc?.progress),
        done: tuBc?.done || '',
        productName,
        productAchieved,
      },
    ]);
    setNextPlan(bc?.nextPlan || '');
    setRecommendation(bc?.recommendation || '');
    setTep(bc?.attachments || []);
  };

  const luu = async (submit: boolean) => {
    if (!ky) return;
    if (tongTep > HAN_FILE.tienDo) {
      message.warning('Tổng minh chứng vượt 50MB');
      return;
    }
    const rows = contentRows.filter((r) => r.milestone.trim()).slice(0, 1);
    if (!rows.length) {
      message.warning('Thiếu nội dung tiến độ theo mốc hợp đồng.');
      return;
    }
    if (submit) {
      const pct = Number(rows[0]!.progress);
      if (!pct || pct < 10 || pct > 100) {
        message.warning('Chọn tiến độ thực hiện từ 10% đến 100%.');
        return;
      }
      if (!rows[0]!.done.trim()) {
        message.warning('Nhập nội dung đã thực hiện.');
        return;
      }
      if (rows[0]!.productName.trim() && !rows[0]!.productAchieved.trim()) {
        message.warning('Nhập Sản phẩm đã đạt.');
        return;
      }
      if (!nextPlan.trim()) {
        message.warning('Kế hoạch tiếp theo là bắt buộc.');
        return;
      }
    }
    setSaving(true);
    try {
      const dong = rows[0]!;
      await luuTienDo(ky.id, {
        outlineId,
        submit,
        contentRows: [
          {
            milestone: dong.milestone,
            progress: dong.progress,
            done: dong.done,
          },
        ],
        productRows: dong.productName.trim()
          ? [
              {
                name: dong.productName.trim(),
                achieved: dong.productAchieved.trim(),
              },
            ]
          : [],
        nextPlan,
        recommendation,
        attachments: tep,
      });
      onXong(
        submit
          ? 'Đã nộp báo cáo tiến độ — chờ PKH ghi nhận'
          : 'Đã lưu nháp báo cáo tiến độ',
      );
      setKy(null);
      await tai();
    } catch (e: any) {
      message.error(bao(e));
    } finally {
      setSaving(false);
    }
  };

  /** Tải báo cáo/minh chứng — sau này nối xuất BM.08 */
  const taiBaoCao = (row: KyTienDo) => {
    const files = row.report?.attachments || [];
    if (files.length) {
      files.forEach((f) => {
        if (f.fileUrl) window.open(f.fileUrl, '_blank', 'noopener,noreferrer');
      });
      return;
    }
    if (!row.report) {
      message.info('Chưa có báo cáo để tải. Hãy tạo và nộp báo cáo trước.');
      return;
    }
    message.info(
      'Biểu mẫu báo cáo tiến độ (BM.08) sẽ được bổ sung để tải về. Hiện chưa có file đính kèm.',
    );
  };

  const xoaBaoCao = (row: KyTienDo) => {
    if (!row.report?.id) return;
    Modal.confirm({
      title: 'Xóa báo cáo tiến độ?',
      content: `Xóa báo cáo「${row.title}」? Thao tác không hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await xoaTienDo(row.report!.id);
          onXong('Đã xóa báo cáo tiến độ');
          await tai();
        } catch (e: any) {
          message.error(bao(e));
          return Promise.reject(e);
        }
      },
    });
  };

  const o = data?.outline;
  const fin = data?.finance;
  const dangSua = ky ? suaDuoc(ky) : false;

  return (
    <>
      {loi && <Alert type="error" style={{ marginBottom: 12 }} message={loi} />}

      <Table
        size="small"
        rowKey="id"
        dataSource={data?.periods || []}
        scroll={{ x: 980 }}
        locale={{ emptyText: 'Chưa có kỳ báo cáo — kiểm tra tiến độ trên hợp đồng' }}
        columns={[
          {
            title: 'Nội dung công việc',
            dataIndex: 'title',
            ellipsis: true,
            render: (v, r) => (
              <Space direction="vertical" size={0}>
                <Text strong>{v}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {r.kind === 'MIDPOINT' ? 'Giữa kỳ' : 'Theo mốc hợp đồng'}
                </Text>
              </Space>
            ),
          },
          {
            title: 'Hạn nộp',
            dataIndex: 'dueOn',
            width: 140,
            // Tránh ant-table cắt dòng 2 (Còn X ngày) khi cột bị ép hẹp
            onCell: () => ({
              style: {
                whiteSpace: 'normal',
                verticalAlign: 'top',
                overflow: 'visible',
              },
            }),
            render: (v, r) => {
              const conLai = soNgayConLai(r);
              const quaHan = conLai != null && conLai < 0;
              return (
                <div style={{ lineHeight: 1.45 }}>
                  <div>{mauNgay(v)}</div>
                  {/* Luôn hiện dưới hạn nộp — kể cả đã ghi nhận */}
                  {quaHan ? (
                    <div style={{ marginTop: 2, fontSize: 12, color: '#cf1322' }}>
                      Quá hạn
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 12,
                        color: conLai != null && conLai <= 7 ? '#cf1322' : '#8c8c8c',
                      }}
                    >
                      Còn {conLai ?? '—'} ngày
                    </div>
                  )}
                </div>
              );
            },
          },
          {
            title: 'Tiến độ',
            width: 160,
            render: (_, r) => {
              const pct = phanTramTuBaoCao(r);
              if (!r.report || pct <= 0) {
                return <Text type="secondary">—</Text>;
              }
              return (
                <div style={{ paddingRight: 8 }}>
                  <Progress
                    percent={pct}
                    size="small"
                    status={mauTienDo(pct)}
                    strokeColor={
                      pct >= 100
                        ? undefined
                        : {
                            from: '#69b1ff',
                            to: pct >= 70 ? '#52c41a' : '#1677ff',
                          }
                    }
                    format={(p) => `${p}%`}
                  />
                </div>
              );
            },
          },
          {
            title: 'Trạng thái',
            width: 150,
            render: (_, r) => {
              const st = r.report?.status;
              return st ? (
                <Tag
                  color={
                    st === 'BCTD_DONE'
                      ? 'success'
                      : st === 'BCTD_BS'
                        ? 'warning'
                        : 'processing'
                  }
                >
                  {NHAN_BCTD[st] || st}
                </Tag>
              ) : (
                <Tag>Chưa nộp</Tag>
              );
            },
          },
          {
            title: 'Tải báo cáo',
            width: 120,
            align: 'center',
            render: (_, r) => (
              <Tooltip
                title={
                  r.report?.attachments?.length
                    ? 'Tải minh chứng đính kèm'
                    : r.report
                      ? 'Biểu mẫu BM.08 sẽ bổ sung sau'
                      : 'Chưa có báo cáo'
                }
              >
                <Button
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  disabled={!r.report}
                  onClick={() => taiBaoCao(r)}
                >
                  Tải về
                </Button>
              </Tooltip>
            ),
          },
          {
            title: 'Thao tác',
            width: 260,
            render: (_, r) => (
              <Space wrap>
                {suaDuoc(r) && (
                  <>
                    {r.report ? (
                      <a onClick={() => napForm(r)}>Sửa</a>
                    ) : (
                      <Button
                        type="link"
                        size="small"
                        style={{ padding: 0 }}
                        onClick={() => napForm(r)}
                      >
                        Tạo báo cáo mới
                      </Button>
                    )}
                    {r.report &&
                      (r.report.status === 'BCTD_DRAFT' ||
                        r.report.status === 'BCTD_BS') && (
                        <a
                          style={{ color: '#ff4d4f' }}
                          onClick={() => xoaBaoCao(r)}
                        >
                          Xóa
                        </a>
                      )}
                  </>
                )}
                {chiXem(r) && <a onClick={() => napForm(r)}>Xem</a>}
                {vaiTro.canManage && r.report?.status === 'BCTD_CHO_PKH' && (
                  <>
                    <a
                      onClick={() =>
                        pkhTienDo(r.report!.id, { accept: true })
                          .then(() => {
                            onXong('Đã ghi nhận báo cáo tiến độ');
                            return tai();
                          })
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Ghi nhận
                    </a>
                    <a
                      style={{ color: '#ff4d4f' }}
                      onClick={() => {
                        setTraLaiId(r.report!.id);
                        setTraLaiNote('');
                        setTraLaiOpen(true);
                      }}
                    >
                      Yêu cầu bổ sung
                    </a>
                  </>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1677ff' }} />
            <span>
              {ky
                ? dangSua
                  ? ky.report
                    ? 'Sửa báo cáo tiến độ'
                    : 'Thêm báo cáo tiến độ'
                  : 'Xem báo cáo tiến độ'
                : 'Báo cáo tiến độ'}
            </span>
          </Space>
        }
        placement="right"
        open={!!ky}
        onClose={() => setKy(null)}
        width={
          typeof window !== 'undefined'
            ? Math.floor(window.innerWidth * 0.75)
            : 960
        }
        destroyOnClose
        styles={{
          body: { paddingBottom: 88 },
          footer: {
            borderTop: '1px solid #f0f0f0',
            padding: '12px 16px',
            background: '#fff',
          },
        }}
        footer={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <Text type="secondary">
              <CalendarOutlined />{' '}
              {ky ? `${ky.title} · hạn ${mauNgay(ky.dueOn)}` : ''}
            </Text>
            <Space wrap>
              <Button onClick={() => setKy(null)}>
                {dangSua ? 'Hủy' : 'Đóng'}
              </Button>
              {dangSua && (
                <>
                  <Button loading={saving} onClick={() => void luu(false)}>
                    Lưu nháp
                  </Button>
                  <Button
                    type="primary"
                    loading={saving}
                    onClick={() => void luu(true)}
                  >
                    Nộp báo cáo tiến độ
                  </Button>
                </>
              )}
            </Space>
          </div>
        }
      >
        {ky && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {ky.report?.status === 'BCTD_BS' && ky.report.pkhNote ? (
              <Alert
                type="warning"
                showIcon
                message="PKH yêu cầu bổ sung"
                description={ky.report.pkhNote}
              />
            ) : null}

            <Card size="small" title="1. Thông tin chung">
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="Tên nhiệm vụ" span={2}>
                  {o?.title || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Mã số">{o?.code || '—'}</Descriptions.Item>
                <Descriptions.Item label="Chủ nhiệm">
                  {o?.ownerName || '—'}
                  {o?.ownerUnit ? ` — ${o.ownerUnit}` : ''}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian">
                  {mauNgay(o?.startDate)} → {mauNgay(o?.endDate)}
                </Descriptions.Item>
                <Descriptions.Item label="Kinh phí duyệt">
                  {formatVnd(Number(o?.budget || 0))}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="2. Nội dung tiến độ (theo hợp đồng)">
              {!contentRows.length ? (
                <Alert
                  type="warning"
                  showIcon
                  message="Không xác định được mốc tiến độ cho kỳ này."
                />
              ) : (
                <Table
                  size="small"
                  pagination={false}
                  rowKey="id"
                  scroll={{ x: 900 }}
                  dataSource={contentRows.slice(0, 1)}
                  columns={[
                    {
                      title: 'Nội dung công việc',
                      dataIndex: 'milestone',
                      render: (v) => <Text strong>{v}</Text>,
                    },
                    {
                      title: 'Tiến độ *',
                      dataIndex: 'progress',
                      width: 200,
                      render: (v, row) => {
                        const pct = Number(chuanPhanTram(v) || 0);
                        return (
                          <Space direction="vertical" size={6} style={{ width: '100%' }}>
                            {dangSua ? (
                              <Select
                                style={{ width: 96 }}
                                value={v || undefined}
                                placeholder="Chọn %"
                                options={OPT_PHAN_TRAM}
                                onChange={(val) =>
                                  setContentRows((s) =>
                                    s.map((x) =>
                                      x.id === row.id
                                        ? { ...x, progress: val }
                                        : x,
                                    ),
                                  )
                                }
                              />
                            ) : null}
                            {pct > 0 ? (
                              <Progress
                                percent={pct}
                                size="small"
                                status={mauTienDo(pct)}
                                strokeColor={
                                  pct >= 100
                                    ? undefined
                                    : {
                                        from: '#69b1ff',
                                        to: pct >= 70 ? '#52c41a' : '#1677ff',
                                      }
                                }
                                format={(p) => `${p}%`}
                              />
                            ) : (
                              !dangSua && <Text type="secondary">—</Text>
                            )}
                          </Space>
                        );
                      },
                    },
                    {
                      title: 'Nội dung đã thực hiện *',
                      dataIndex: 'done',
                      render: (v, row) =>
                        dangSua ? (
                          <TextArea
                            rows={2}
                            value={v}
                            placeholder="Đã hoàn thành…"
                            onChange={(e) =>
                              setContentRows((s) =>
                                s.map((x) =>
                                  x.id === row.id
                                    ? { ...x, done: e.target.value }
                                    : x,
                                ),
                              )
                            }
                          />
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{v || '—'}</div>
                        ),
                    },
                    {
                      title: 'Sản phẩm theo TM',
                      dataIndex: 'productName',
                      width: '18%',
                      render: (v) => v || <Text type="secondary">—</Text>,
                    },
                    {
                      title: 'Sản phẩm đã đạt *',
                      dataIndex: 'productAchieved',
                      width: '20%',
                      render: (v, row) =>
                        dangSua ? (
                          <TextArea
                            rows={2}
                            value={v}
                            placeholder="Sản phẩm đã đạt…"
                            disabled={!row.productName}
                            onChange={(e) =>
                              setContentRows((s) =>
                                s.map((x) =>
                                  x.id === row.id
                                    ? {
                                        ...x,
                                        productAchieved: e.target.value,
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        ) : (
                          <div style={{ whiteSpace: 'pre-wrap' }}>{v || '—'}</div>
                        ),
                    },
                  ]}
                />
              )}

              <Divider style={{ margin: '16px 0 12px' }} />
              <Text strong>Kinh phí (chỉ xem)</Text>
              <Descriptions size="small" column={3} style={{ marginTop: 8 }} bordered>
                <Descriptions.Item label="Tạm ứng">
                  {formatVnd(fin?.advanced || 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Đã chi">
                  {formatVnd(fin?.spent || 0)}
                </Descriptions.Item>
                <Descriptions.Item label="Quyết toán">
                  {formatVnd(fin?.settled || 0)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="3. Kế hoạch tiếp theo *">
              {dangSua ? (
                <TextArea
                  rows={4}
                  value={nextPlan}
                  placeholder="Mô tả kế hoạch công việc tiếp theo…"
                  onChange={(e) => setNextPlan(e.target.value)}
                />
              ) : (
                <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {nextPlan || '—'}
                </Paragraph>
              )}
            </Card>

            <Card size="small" title="4. Kiến nghị">
              {dangSua ? (
                <TextArea
                  rows={3}
                  value={recommendation}
                  placeholder="Kiến nghị (nếu có)…"
                  onChange={(e) => setRecommendation(e.target.value)}
                />
              ) : (
                <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
                  {recommendation || '—'}
                </Paragraph>
              )}
            </Card>

            <Card size="small" title="Minh chứng (tổng ≤ 50MB)">
              {dangSua && (
                <ChonTep
                  maxBytes={HAN_FILE.tienDo}
                  onCo={(t) => setTep((s) => [...s, t])}
                />
              )}
              <Text type="secondary" style={{ display: 'block', margin: '8px 0' }}>
                Đã chọn: {(tongTep / (1024 * 1024)).toFixed(2)} / 50 MB
              </Text>
              {tep.length === 0 ? (
                <Text type="secondary">Chưa có file</Text>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {tep.map((t) => (
                    <Space
                      key={t.fileUrl}
                      style={{ justifyContent: 'space-between', width: '100%' }}
                    >
                      <a href={t.fileUrl} target="_blank" rel="noreferrer">
                        {t.fileName}
                      </a>
                      {dangSua && (
                        <Button
                          type="link"
                          danger
                          size="small"
                          onClick={() =>
                            Modal.confirm({
                              title: 'Gỡ file minh chứng?',
                              okText: 'Gỡ',
                              okType: 'danger',
                              cancelText: 'Hủy',
                              onOk: () =>
                                setTep((s) =>
                                  s.filter((x) => x.fileUrl !== t.fileUrl),
                                ),
                            })
                          }
                        >
                          Gỡ
                        </Button>
                      )}
                    </Space>
                  ))}
                </Space>
              )}
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        title="Yêu cầu bổ sung báo cáo tiến độ"
        open={traLaiOpen}
        onCancel={() => setTraLaiOpen(false)}
        okText="Gửi yêu cầu"
        okButtonProps={{ danger: true }}
        onOk={async () => {
          if (!traLaiId) return;
          if (traLaiNote.trim().length < 5) {
            message.warning('Nhập nội dung cần bổ sung (tối thiểu 5 ký tự)');
            return Promise.reject();
          }
          try {
            await pkhTienDo(traLaiId, {
              accept: false,
              note: traLaiNote.trim(),
            });
            message.success('Đã gửi yêu cầu bổ sung');
            setTraLaiOpen(false);
            await tai();
          } catch (e: any) {
            message.error(bao(e));
            return Promise.reject();
          }
        }}
      >
        <Form layout="vertical">
          <Form.Item label="Nội dung cần bổ sung" required>
            <TextArea
              rows={4}
              value={traLaiNote}
              onChange={(e) => setTraLaiNote(e.target.value)}
              placeholder="Ghi rõ phần CNNV cần bổ sung…"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
