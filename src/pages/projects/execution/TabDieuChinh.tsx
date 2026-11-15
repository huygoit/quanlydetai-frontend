/**
 * BM.09 — Điều chỉnh nhiệm vụ: thời gian / CNNV / nội dung+tiến độ (editable).
 */
import {
  ACADEMIC_TITLE_KEY_LABEL_MAP,
  DEGREE_KEY_LABEL_MAP,
  type AcademicTitleKey,
  type DegreeKey,
} from '@/constants/scientificProfileCatalog';
import { NHAN_BCTD, NHAN_DC } from '@/constants/module56';
import {
  bghDieuChinh,
  dsDieuChinh,
  leadDieuChinh,
  luuDieuChinh,
  manDieuChinh,
  pkhDieuChinh,
  timChuNhiemDieuChinh,
  type ManDieuChinh,
  type NguoiDieuChinh,
  type PhieuDieuChinh,
  type TepModule56,
} from '@/services/api/module56';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  CalendarOutlined,
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  FormOutlined,
  PaperClipOutlined,
  PlusOutlined,
  RollbackOutlined,
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  EditableProTable,
  type EditableFormInstance,
  type ProColumns,
} from '@ant-design/pro-components';
import { history, useLocation } from '@umijs/max';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChonTep } from './ChonTep';
import type { VaiTro } from './types';

const { Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const OPT_PHAN_TRAM = Array.from({ length: 10 }, (_, i) => {
  const n = (i + 1) * 10;
  return { value: String(n), label: `${n}%` };
});

type DongNoiDung = {
  id: string;
  content?: string;
  thoiGianRange?: [Dayjs, Dayjs] | null;
  progress?: string;
  done?: string;
  periodId?: number | null;
  reportStatus?: string | null;
  expectedResult?: string | null;
};

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

function mauNgay(v?: string | null) {
  return v ? dayjs(v).format('DD/MM/YYYY') : '—';
}

function nhanMaHocHam(v?: string | null) {
  if (!v || v === 'NONE') return '';
  return (
    ACADEMIC_TITLE_KEY_LABEL_MAP[v as AcademicTitleKey] || v
  );
}

function nhanMaHocVi(v?: string | null) {
  if (!v) return '';
  return DEGREE_KEY_LABEL_MAP[v as DegreeKey] || v;
}

/** Một dòng: PGS · Tiến sĩ (không hiện mã enum dài) */
function nhanHocHamVi(p?: NguoiDieuChinh | null) {
  if (!p) return '—';
  const parts = [nhanMaHocHam(p.academicTitle), nhanMaHocVi(p.degree)].filter(
    Boolean,
  );
  return parts.length ? parts.join(' · ') : 'Chưa cập nhật';
}

function TheNguoi({
  p,
  tieuDe,
}: {
  p?: NguoiDieuChinh | null;
  tieuDe: string;
}) {
  return (
    <Card
      size="small"
      title={
        <Space>
          <UserOutlined style={{ color: '#1677ff' }} />
          <span>{tieuDe}</span>
        </Space>
      }
      style={{ height: '100%' }}
    >
      {!p ? (
        <Text type="secondary">Chưa chọn</Text>
      ) : (
        <Space align="start" size={12}>
          <Avatar size={40} style={{ background: '#1677ff' }}>
            {(p.fullName || '?').charAt(0)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <div style={{ lineHeight: 1.4 }}>
              {(() => {
                const hv = nhanHocHamVi(p);
                return hv && hv !== 'Chưa cập nhật' ? (
                  <>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {hv}
                    </Text>
                    <Text strong>{` ${p.fullName || '—'}`}</Text>
                  </>
                ) : (
                  <Text strong>{p.fullName || '—'}</Text>
                );
              })()}
            </div>
            <div style={{ marginTop: 2, lineHeight: 1.4 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {p.unit || '—'}
              </Text>
              <Tag color="green" style={{ marginLeft: 8, marginInlineEnd: 0 }}>
                NCKH: {p.nckhHours != null ? `${p.nckhHours} giờ` : '—'}
              </Tag>
            </div>
          </div>
        </Space>
      )}
    </Card>
  );
}

export function TabDieuChinh({
  outlineId,
  extensionCount,
  vaiTro,
  onXong,
}: {
  outlineId: number;
  extensionCount: number;
  vaiTro: VaiTro;
  onXong: (t: string) => void;
}) {
  const [rows, setRows] = useState<PhieuDieuChinh[]>([]);
  const [ctx, setCtx] = useState<ManDieuChinh | null>(null);
  const [loi, setLoi] = useState('');
  const [mo, setMo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dangId, setDangId] = useState<number | null>(null);
  const [endMoi, setEndMoi] = useState<Dayjs | null>(null);
  const [cnnvMoi, setCnnvMoi] = useState<NguoiDieuChinh | null>(null);
  const [optsCnnv, setOptsCnnv] = useState<NguoiDieuChinh[]>([]);
  const [dongNd, setDongNd] = useState<DongNoiDung[]>([]);
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);
  const [tepMinhChung, setTepMinhChung] = useState<TepModule56[]>([]);
  const [xemPhieu, setXemPhieu] = useState<PhieuDieuChinh | null>(null);
  const [acting, setActing] = useState(false);
  const [bsOpen, setBsOpen] = useState(false);
  const [bsNote, setBsNote] = useState('');
  const [form] = Form.useForm();
  const bangRef = useRef<EditableFormInstance<DongNoiDung>>();
  const { search, pathname } = useLocation();
  const daMoTuUrl = useRef(false);

  const tai = async () => {
    try {
      const [listRes, ctxRes] = await Promise.all([
        dsDieuChinh(outlineId),
        manDieuChinh(outlineId),
      ]);
      setRows(listRes.data || []);
      setCtx(ctxRes.data || null);
      setLoi('');
      return listRes.data || [];
    } catch (e: any) {
      setLoi(bao(e));
      return [] as PhieuDieuChinh[];
    }
  };

  useEffect(() => {
    void tai();
    daMoTuUrl.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId]);

  // Thông báo → ?tab=dieuchinh&adjustmentId= → mở sheet chi tiết
  useEffect(() => {
    if (daMoTuUrl.current) return;
    const aid = Number(new URLSearchParams(search).get('adjustmentId') || 0);
    if (!aid) return;
    void tai().then((list) => {
      const hit = list.find((x) => x.id === aid);
      if (!hit) return;
      daMoTuUrl.current = true;
      setXemPhieu(hit);
      // Xóa query để F5 không mở lại trùng
      const q = new URLSearchParams(search);
      q.delete('adjustmentId');
      const qs = q.toString();
      history.replace(`${pathname}${qs ? `?${qs}` : ''}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, outlineId]);

  const napDongTuCtx = (c: ManDieuChinh) => {
    const fromMs = (c.milestones || []).map((m, i) => {
      const start = m.startDate ? dayjs(m.startDate) : null;
      const end = m.endDate ? dayjs(m.endDate) : null;
      return {
        id: `ms-${i}-${Date.now()}`,
        content: m.content,
        thoiGianRange:
          start?.isValid() && end?.isValid()
            ? ([start, end] as [Dayjs, Dayjs])
            : null,
        progress: m.progress || '',
        done: '',
        periodId: m.periodId ?? null,
        reportStatus: m.reportStatus ?? null,
        expectedResult: m.expectedResult ?? null,
      } satisfies DongNoiDung;
    });
    // Kỳ báo cáo chưa có trong milestones → vẫn cho chỉnh
    const titles = new Set(fromMs.map((x) => x.content));
    for (const p of c.progressRows || []) {
      if (titles.has(p.title) || titles.has(p.milestone)) continue;
      fromMs.push({
        id: `pr-${p.periodId}`,
        content: p.title || p.milestone,
        thoiGianRange: p.dueOn
          ? ([dayjs(p.dueOn), dayjs(p.dueOn)] as [Dayjs, Dayjs])
          : null,
        progress: p.progress || '',
        done: p.done || '',
        periodId: p.periodId,
        reportStatus: p.reportStatus,
      });
    }
    setDongNd(fromMs);
    setEditableKeys(fromMs.map((x) => x.id));
  };

  const moThem = () => {
    if (!ctx) {
      message.warning('Đang tải ngữ cảnh nhiệm vụ…');
      return;
    }
    setDangId(null);
    setEndMoi(null);
    setCnnvMoi(null);
    setTepMinhChung([]);
    form.setFieldsValue({ reason: '' });
    napDongTuCtx(ctx);
    setMo(true);
  };

  const moSua = (r: PhieuDieuChinh) => {
    if (!ctx) return;
    setDangId(r.id);
    form.setFieldsValue({ reason: r.reason });
    setTepMinhChung(r.evidenceAttachments || []);
    setEndMoi(r.changes?.endDate ? dayjs(r.changes.endDate) : null);
    setCnnvMoi(
      r.principalProfile ||
        (r.changes?.principalUserId
          ? {
              userId: r.changes.principalUserId,
              fullName: `User #${r.changes.principalUserId}`,
              nckhHours: null,
            }
          : null),
    );
    if (r.principalProfile) {
      setOptsCnnv([r.principalProfile]);
    }
    if (r.changes?.milestones?.length) {
      const dongs = r.changes.milestones.map((m, i) => {
        const pu = r.changes.progressUpdates?.find(
          (x) => x.title === m.content,
        );
        const start = m.startDate ? dayjs(m.startDate) : null;
        const end = m.endDate ? dayjs(m.endDate) : null;
        return {
          id: `edit-${i}`,
          content: m.content,
          thoiGianRange:
            start?.isValid() && end?.isValid()
              ? ([start, end] as [Dayjs, Dayjs])
              : null,
          progress: pu?.progress || (m as { progress?: string }).progress || '',
          done: pu?.done || '',
          periodId: pu?.periodId ?? null,
          reportStatus: null,
          expectedResult: m.expectedResult ?? null,
        } satisfies DongNoiDung;
      });
      setDongNd(dongs);
      setEditableKeys(dongs.map((x) => x.id));
    } else {
      napDongTuCtx(ctx);
    }
    setMo(true);
  };

  const timCnnv = async (kw: string) => {
    if (!kw.trim() || kw.trim().length < 2) {
      setOptsCnnv([]);
      return;
    }
    try {
      const res = await timChuNhiemDieuChinh(outlineId, kw.trim());
      setOptsCnnv(res.data || []);
    } catch {
      setOptsCnnv([]);
    }
  };

  const luu = async (submit: boolean) => {
    try {
      const v = await form.validateFields();
      // getRowsData chỉ có field form — gộp lại với dongNd để giữ periodId / progress
      const tuForm =
        (bangRef.current?.getRowsData?.() as DongNoiDung[] | undefined) || [];
      const tuBang = (tuForm.length ? tuForm : dongNd).map((d) => {
        const goc = dongNd.find((x) => x.id === d.id);
        return {
          ...goc,
          ...d,
          periodId: d.periodId ?? goc?.periodId ?? null,
          reportStatus: d.reportStatus ?? goc?.reportStatus ?? null,
          progress:
            d.progress !== undefined && d.progress !== null
              ? d.progress
              : goc?.progress || '',
          expectedResult:
            d.expectedResult !== undefined
              ? d.expectedResult
              : goc?.expectedResult ?? null,
        } satisfies DongNoiDung;
      });
      const milestones = tuBang
        .filter((d) => String(d.content || '').trim())
        .map((d) => ({
          content: String(d.content).trim(),
          startDate: d.thoiGianRange?.[0]?.format('YYYY-MM-DD') || null,
          endDate: d.thoiGianRange?.[1]?.format('YYYY-MM-DD') || null,
          expectedResult: d.expectedResult || null,
          // Giữ % trên mốc để lưu nháp / mở lại không mất
          progress: d.progress ? String(d.progress) : null,
        }));
      const progressUpdates = tuBang
        .filter((d) => d.periodId || d.progress)
        .map((d) => ({
          periodId: Number(d.periodId || 0),
          progress: d.progress || null,
          done: d.done || null,
          title: String(d.content || '').trim() || null,
          dueOn: d.thoiGianRange?.[1]?.format('YYYY-MM-DD') || null,
        }));

      const changes: Record<string, unknown> = {};
      if (endMoi) changes.endDate = endMoi.format('YYYY-MM-DD');
      if (cnnvMoi?.userId) changes.principalUserId = cnnvMoi.userId;
      if (milestones.length) changes.milestones = milestones;
      if (progressUpdates.length) changes.progressUpdates = progressUpdates;

      if (!Object.keys(changes).length) {
        message.warning('Cần ít nhất một nội dung thay đổi');
        return;
      }

      setSaving(true);
      await luuDieuChinh({
        id: dangId || undefined,
        projectOutlineId: outlineId,
        submit,
        reason: v.reason,
        evidenceAttachments: tepMinhChung,
        changes,
      });
      onXong(submit ? 'Đã nộp điều chỉnh' : 'Đã lưu nháp điều chỉnh');
      setMo(false);
      await tai();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(bao(e));
    } finally {
      setSaving(false);
    }
  };

  const cotDong: ProColumns<DongNoiDung>[] = useMemo(
    () => [
      {
        title: 'Nội dung công việc',
        dataIndex: 'content',
        formItemProps: {
          rules: [{ required: true, message: 'Nhập nội dung' }],
        },
        render: (_, r) => (
          <Space direction="vertical" size={0}>
            <Text>{r.content || '—'}</Text>
            {r.reportStatus ? (
              <Tag style={{ marginTop: 2 }}>
                {NHAN_BCTD[r.reportStatus] || r.reportStatus}
              </Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: 'Thời gian',
        dataIndex: 'thoiGianRange',
        width: 240,
        renderFormItem: () => (
          <RangePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
        ),
        render: (_, r) =>
          r.thoiGianRange?.[0] && r.thoiGianRange?.[1]
            ? `${r.thoiGianRange[0].format('DD/MM/YYYY')} → ${r.thoiGianRange[1].format('DD/MM/YYYY')}`
            : '—',
      },
      {
        title: 'Tiến độ %',
        dataIndex: 'progress',
        width: 120,
        valueType: 'select',
        fieldProps: { options: OPT_PHAN_TRAM, allowClear: true, placeholder: '%' },
        render: (_, r) => {
          const pct = Number(r.progress || 0);
          if (!pct) return <Text type="secondary">—</Text>;
          return <Progress percent={pct} size="small" />;
        },
      },
      {
        title: 'Sản phẩm/kết quả',
        dataIndex: 'expectedResult',
        valueType: 'textarea',
        fieldProps: { rows: 2, placeholder: 'Sản phẩm / kết quả…' },
        render: (_, r) => (
          <Text type="secondary" style={{ whiteSpace: 'pre-wrap' }}>
            {r.expectedResult || '—'}
          </Text>
        ),
      },
      {
        title: '',
        valueType: 'option',
        width: 72,
        render: (_, row) => (
          <Button
            type="link"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Xóa dòng nội dung?',
                okText: 'Xóa',
                okType: 'danger',
                cancelText: 'Hủy',
                onOk: () => {
                  setDongNd((list) => list.filter((d) => d.id !== row.id));
                  setEditableKeys((keys) => keys.filter((k) => k !== row.id));
                },
              });
            }}
          >
            Xóa
          </Button>
        ),
      },
    ],
    [],
  );

  const o = ctx?.outline;

  const dongSheetSauXuLy = async (msg: string) => {
    onXong(msg);
    setXemPhieu(null);
    setBsOpen(false);
    await tai();
  };

  const duyetPkh = async () => {
    if (!xemPhieu) return;
    setActing(true);
    try {
      await pkhDieuChinh(xemPhieu.id, { action: 'accept' });
      await dongSheetSauXuLy('Đã duyệt — chờ BGH');
    } catch (e: any) {
      message.error(bao(e));
    } finally {
      setActing(false);
    }
  };

  const guiBoSung = async () => {
    if (!xemPhieu) return;
    if (!bsNote.trim()) {
      message.warning('Nhập nội dung cần bổ sung');
      return;
    }
    setActing(true);
    try {
      await pkhDieuChinh(xemPhieu.id, {
        action: 'return',
        note: bsNote.trim(),
      });
      await dongSheetSauXuLy('Đã yêu cầu bổ sung');
    } catch (e: any) {
      message.error(bao(e));
    } finally {
      setActing(false);
    }
  };

  const duyetBgh = async () => {
    if (!xemPhieu) return;
    setActing(true);
    try {
      await bghDieuChinh(xemPhieu.id, { accept: true });
      await dongSheetSauXuLy('BGH đã duyệt — dữ liệu nhiệm vụ đã cập nhật');
    } catch (e: any) {
      message.error(bao(e));
    } finally {
      setActing(false);
    }
  };

  const tuChoiBgh = async (note: string) => {
    if (!xemPhieu) return;
    setActing(true);
    try {
      await bghDieuChinh(xemPhieu.id, { accept: false, note });
      await dongSheetSauXuLy('BGH đã từ chối điều chỉnh');
    } catch (e: any) {
      message.error(bao(e));
    } finally {
      setActing(false);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {loi && <Alert type="error" showIcon message={loi} />}

      <Card
        size="small"
        bordered={false}
        style={{
          background: '#fafbfc',
          border: '1px solid #f0f0f0',
          borderRadius: 8,
        }}
        bodyStyle={{ padding: '12px 14px' }}
      >
        <Space
          style={{ width: '100%', justifyContent: 'space-between' }}
          wrap
        >
          <div>
            <Space>
              <FormOutlined style={{ color: '#1677ff' }} />
              <Text strong>Điều chỉnh nhiệm vụ</Text>
            </Space>
            <div style={{ marginTop: 2, marginLeft: 24 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đã gia hạn {extensionCount} lần
                {extensionCount >= 1
                  ? ' — lần 2 trở đi cần xác nhận trước khi PKH trình BGH'
                  : ''}
              </Text>
            </div>
          </div>
          {vaiTro.canCnnv && (
            <Button type="primary" icon={<PlusOutlined />} onClick={moThem}>
              Tạo đề nghị điều chỉnh
            </Button>
          )}
        </Space>
      </Card>

      <Table
        size="small"
        rowKey="id"
        dataSource={rows}
        locale={{ emptyText: 'Chưa có phiếu điều chỉnh' }}
        columns={[
          { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 140,
            render: (v) => <Tag>{NHAN_DC[v] || v}</Tag>,
          },
          {
            title: 'Phụ lục',
            width: 110,
            render: (_, r) =>
              r.appendixFileUrl ? (
                <a
                  href={resolvePublicAssetUrl(r.appendixFileUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Tải DOCX
                </a>
              ) : (
                '—'
              ),
          },
          {
            title: 'Thao tác',
            width: 200,
            render: (_, r) => (
              <Space wrap>
                <a onClick={() => setXemPhieu(r)}>
                  <EyeOutlined /> Xem
                </a>
                {vaiTro.canLead &&
                  r.status === 'DC_PENDING_PKH' &&
                  !!r.changes?.endDate &&
                  extensionCount >= 1 &&
                  !r.leadConfirmed && (
                    <a
                      onClick={() =>
                        leadDieuChinh(r.id)
                          .then(() => {
                            onXong('Đã xác nhận gia hạn');
                            return tai();
                          })
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Xác nhận gia hạn
                    </a>
                  )}
                {vaiTro.canCnnv &&
                  (r.status === 'DC_DRAFT' || r.status === 'DC_BS') && (
                    <a onClick={() => moSua(r)}>Sửa</a>
                  )}
              </Space>
            ),
          },
        ]}
      />

      <Drawer
        title={
          <Space size={8} wrap style={{ maxWidth: '100%' }}>
            <SwapOutlined style={{ color: '#1677ff' }} />
            <span>
              {dangId ? 'Sửa đề nghị điều chỉnh' : 'Tạo đề nghị điều chỉnh'}
            </span>
            <Text type="secondary">·</Text>
            <Text
              type="secondary"
              ellipsis={{ tooltip: true }}
              style={{ maxWidth: 420, fontWeight: 500 }}
            >
              {o ? `${o.code} — ${o.title}` : 'Đang tải…'}
            </Text>
          </Space>
        }
        open={mo}
        onClose={() => setMo(false)}
        maskClosable={false}
        width={
          typeof window !== 'undefined'
            ? Math.min(1100, Math.floor(window.innerWidth * 0.92))
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
              justifyContent: 'flex-end',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <Button onClick={() => setMo(false)}>Hủy</Button>
            <Button loading={saving} onClick={() => void luu(false)}>
              Lưu nháp
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() => void luu(true)}
            >
              Nộp điều chỉnh
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {/* Hạng mục 1 — thời gian */}
            <Card
              size="small"
              title={
                <Space>
                  <CalendarOutlined style={{ color: '#1677ff' }} />
                  <span>1. Điều chỉnh thời gian</span>
                </Space>
              }
              styles={{
                header: { background: '#f0f5ff', borderBottom: '1px solid #d6e4ff' },
              }}
            >
              <Row gutter={[16, 12]}>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 6, color: '#8c8c8c', fontSize: 12 }}>
                    Thời gian hiện tại
                  </div>
                  <Space size={8} wrap>
                    <Text type="secondary">Từ ngày</Text>
                    <Text strong>{mauNgay(o?.startDate)}</Text>
                    <Text type="secondary">→</Text>
                    <Text type="secondary">Đến ngày</Text>
                    <Text strong>{mauNgay(o?.endDate)}</Text>
                  </Space>
                </Col>
                <Col xs={24} md={12}>
                  <div style={{ marginBottom: 6, color: '#8c8c8c', fontSize: 12 }}>
                    Thời gian mới (chỉ sửa ngày kết thúc)
                  </div>
                  <Space size={8} wrap style={{ width: '100%' }}>
                    <Text type="secondary">Từ ngày</Text>
                    <Text strong>{mauNgay(o?.startDate)}</Text>
                    <Text type="secondary">→</Text>
                    <Text type="secondary">Đến ngày</Text>
                    <DatePicker
                      format="DD/MM/YYYY"
                      value={endMoi}
                      onChange={(v) => setEndMoi(v)}
                      placeholder="dd/mm/yyyy"
                      disabledDate={(d) =>
                        !!o?.startDate && d.isBefore(dayjs(o.startDate), 'day')
                      }
                    />
                  </Space>
                </Col>
              </Row>
            </Card>

            {/* Hạng mục 2 — chủ nhiệm */}
            <Card
              size="small"
              title={
                <Space>
                  <TeamOutlined style={{ color: '#52c41a' }} />
                  <span>2. Điều chỉnh chủ nhiệm nhiệm vụ</span>
                </Space>
              }
              styles={{
                header: { background: '#f6ffed', borderBottom: '1px solid #b7eb8f' },
              }}
            >
              <Row gutter={[16, 12]}>
                <Col xs={24} md={12}>
                  <TheNguoi p={ctx?.ownerProfile} tieuDe="Chủ nhiệm hiện tại" />
                </Col>
                <Col xs={24} md={12}>
                  <Card
                    size="small"
                    type="inner"
                    title={
                      <Space>
                        <SwapOutlined style={{ color: '#52c41a' }} />
                        <span>Chủ nhiệm mới</span>
                      </Space>
                    }
                  >
                    <Select
                      showSearch
                      allowClear
                      style={{ width: '100%', marginBottom: 12 }}
                      placeholder="Gõ tên / email để tìm…"
                      filterOption={false}
                      value={cnnvMoi?.userId}
                      options={optsCnnv.map((u) => {
                        const hv = nhanHocHamVi(u);
                        return {
                          value: u.userId,
                          label:
                            hv && hv !== 'Chưa cập nhật'
                              ? `${hv} ${u.fullName}`
                              : u.fullName,
                        };
                      })}
                      onSearch={(kw) => void timCnnv(kw)}
                      onChange={(uid) => {
                        const hit =
                          optsCnnv.find((x) => x.userId === uid) || null;
                        setCnnvMoi(hit);
                      }}
                      notFoundContent={
                        <Text type="secondary">
                          Gõ ít nhất 2 ký tự để tìm
                        </Text>
                      }
                    />
                    {cnnvMoi ? (
                      <Space align="start" size={12}>
                        <Avatar size={40} style={{ background: '#52c41a' }}>
                          {(cnnvMoi.fullName || '?').charAt(0)}
                        </Avatar>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ lineHeight: 1.4 }}>
                            {(() => {
                              const hv = nhanHocHamVi(cnnvMoi);
                              return hv && hv !== 'Chưa cập nhật' ? (
                                <>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    {hv}
                                  </Text>
                                  <Text strong>{` ${cnnvMoi.fullName}`}</Text>
                                </>
                              ) : (
                                <Text strong>{cnnvMoi.fullName}</Text>
                              );
                            })()}
                          </div>
                          <div style={{ marginTop: 2, lineHeight: 1.4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {cnnvMoi.unit || '—'}
                            </Text>
                            <Tag
                              color="green"
                              style={{ marginLeft: 8, marginInlineEnd: 0 }}
                            >
                              NCKH:{' '}
                              {cnnvMoi.nckhHours != null
                                ? `${cnnvMoi.nckhHours} giờ`
                                : '—'}
                            </Tag>
                          </div>
                        </div>
                      </Space>
                    ) : (
                      <Text type="secondary">
                        Chọn người để xem học hàm / học vị / NCKH
                      </Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Hạng mục 3 — nội dung & tiến độ */}
            <Card
              size="small"
              title={
                <Space>
                  <FormOutlined style={{ color: '#fa8c16' }} />
                  <span>3. Điều chỉnh nội dung &amp; tiến độ</span>
                </Space>
              }
              styles={{
                header: { background: '#fff7e6', borderBottom: '1px solid #ffd591' },
              }}
            >
              <EditableProTable<DongNoiDung>
                rowKey="id"
                size="middle"
                value={dongNd}
                onChange={(list) => setDongNd([...(list || [])])}
                editableFormRef={bangRef}
                recordCreatorProps={{
                  newRecordType: 'dataSource',
                  record: () => ({
                    id: `new-${Date.now()}`,
                    content: '',
                    thoiGianRange: null,
                    progress: '',
                    expectedResult: '',
                    periodId: null,
                  }),
                  creatorButtonText: 'Thêm nội dung',
                  icon: <PlusOutlined />,
                }}
                columns={cotDong}
                editable={{
                  type: 'multiple',
                  editableKeys,
                  onChange: setEditableKeys,
                  onValuesChange: (_r, list) => setDongNd([...(list || [])]),
                  actionRender: (row) => [
                    <Button
                      key="xoa"
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setDongNd((list) =>
                          list.filter((d) => d.id !== row.id),
                        );
                        setEditableKeys((keys) =>
                          keys.filter((k) => k !== row.id),
                        );
                      }}
                    >
                      Xóa
                    </Button>,
                  ],
                }}
                pagination={false}
                scroll={{ x: 960 }}
              />
            </Card>

            {/* Hạng mục 4 — lý do & minh chứng */}
            <Card
              size="small"
              title={
                <Space>
                  <PaperClipOutlined style={{ color: '#722ed1' }} />
                  <span>4. Lý do giải trình &amp; minh chứng</span>
                </Space>
              }
              styles={{
                header: { background: '#f9f0ff', borderBottom: '1px solid #d3adf7' },
              }}
            >
              <Form.Item
                name="reason"
                label="Lý do giải trình"
                rules={[
                  { required: true, message: 'Nhập lý do giải trình' },
                ]}
                style={{ marginBottom: 16 }}
              >
                <TextArea
                  rows={3}
                  placeholder="Nêu rõ lý do đề nghị điều chỉnh…"
                />
              </Form.Item>
              <div style={{ marginBottom: 8 }}>
                <Text strong>File minh chứng</Text>
              </div>
              <ChonTep
                maxBytes={20 * 1024 * 1024}
                nhan="Tải file minh chứng"
                onCo={(t) => setTepMinhChung((prev) => [...prev, t])}
              />
              {tepMinhChung.length > 0 && (
                <Space
                  direction="vertical"
                  size={4}
                  style={{ marginTop: 8, width: '100%' }}
                >
                  {tepMinhChung.map((t, i) => (
                    <Space key={`${t.fileUrl}-${i}`}>
                      <PaperClipOutlined />
                      <a
                        href={resolvePublicAssetUrl(t.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t.fileName || `File ${i + 1}`}
                      </a>
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          setTepMinhChung((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                      >
                        Xóa
                      </Button>
                    </Space>
                  ))}
                </Space>
              )}
            </Card>
          </Space>
        </Form>
      </Drawer>

      {/* Sheet chi tiết nộp ĐC — footer đóng băng PKH / BGH */}
      <Drawer
        title={
          <Space size={8} wrap>
            <EyeOutlined style={{ color: '#1677ff' }} />
            <span>Chi tiết nộp hồ sơ điều chỉnh</span>
            {xemPhieu ? (
              <Tag>{NHAN_DC[xemPhieu.status] || xemPhieu.status}</Tag>
            ) : null}
            {o ? (
              <Text type="secondary" ellipsis style={{ maxWidth: 360 }}>
                · {o.code} — {o.title}
              </Text>
            ) : null}
          </Space>
        }
        open={!!xemPhieu}
        onClose={() => setXemPhieu(null)}
        maskClosable={false}
        width={
          typeof window !== 'undefined'
            ? Math.min(960, Math.floor(window.innerWidth * 0.9))
            : 880
        }
        styles={{
          body: { paddingBottom: 88 },
          footer: {
            borderTop: '1px solid #f0f0f0',
            padding: '12px 16px',
            background: '#fff',
          },
        }}
        footer={
          xemPhieu ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <Button onClick={() => setXemPhieu(null)}>Đóng</Button>
              {vaiTro.canManage && xemPhieu.status === 'DC_PENDING_PKH' && (
                <>
                  <Button
                    danger
                    icon={<RollbackOutlined />}
                    loading={acting}
                    onClick={() => {
                      setBsNote('');
                      setBsOpen(true);
                    }}
                  >
                    Yêu cầu bổ sung
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={acting}
                    onClick={() => void duyetPkh()}
                  >
                    Duyệt điều chỉnh
                  </Button>
                </>
              )}
              {vaiTro.canBgh && xemPhieu.status === 'DC_PENDING_BGH' && (
                <>
                  <Button
                    danger
                    loading={acting}
                    onClick={() => {
                      const note = window.prompt('Lý do từ chối') || '';
                      if (!note.trim()) return;
                      void tuChoiBgh(note.trim());
                    }}
                  >
                    Từ chối
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={acting}
                    onClick={() => void duyetBgh()}
                  >
                    Duyệt điều chỉnh
                  </Button>
                </>
              )}
              {vaiTro.canCnnv &&
                (xemPhieu.status === 'DC_DRAFT' ||
                  xemPhieu.status === 'DC_BS') && (
                  <Button
                    type="primary"
                    onClick={() => {
                      const r = xemPhieu;
                      setXemPhieu(null);
                      moSua(r);
                    }}
                  >
                    Sửa / bổ sung
                  </Button>
                )}
            </div>
          ) : null
        }
      >
        {xemPhieu && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {xemPhieu.status === 'DC_PENDING_PKH' &&
              !!xemPhieu.changes?.endDate &&
              extensionCount >= 1 &&
              !xemPhieu.leadConfirmed && (
                <Alert
                  type="warning"
                  showIcon
                  message="Gia hạn từ lần 2 cần xác nhận lãnh đạo đơn vị trước khi PKH duyệt."
                />
              )}
            {xemPhieu.decisionNote && (
              <Alert
                type="info"
                showIcon
                message="Ghi chú xử lý"
                description={xemPhieu.decisionNote}
              />
            )}

            <Card size="small" title="Lý do giải trình & minh chứng">
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Lý do">
                  {xemPhieu.reason || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Minh chứng">
                  {(xemPhieu.evidenceAttachments || []).length ? (
                    <Space direction="vertical" size={4}>
                      {(xemPhieu.evidenceAttachments || []).map((t, i) => (
                        <a
                          key={`${t.fileUrl}-${i}`}
                          href={resolvePublicAssetUrl(t.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <PaperClipOutlined /> {t.fileName || `File ${i + 1}`}
                        </a>
                      ))}
                    </Space>
                  ) : (
                    '—'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="1. Thời gian">
              <Space size={8} wrap>
                <Text type="secondary">Hiện tại:</Text>
                <Text>
                  {mauNgay(o?.startDate)} → {mauNgay(o?.endDate)}
                </Text>
                {xemPhieu.changes?.endDate ? (
                  <>
                    <Text type="secondary">| Mới:</Text>
                    <Text strong>
                      {mauNgay(o?.startDate)} →{' '}
                      {mauNgay(xemPhieu.changes.endDate)}
                    </Text>
                  </>
                ) : (
                  <Text type="secondary">— không đổi</Text>
                )}
              </Space>
            </Card>

            <Card size="small" title="2. Chủ nhiệm nhiệm vụ">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <TheNguoi p={ctx?.ownerProfile} tieuDe="Chủ nhiệm hiện tại" />
                </Col>
                <Col xs={24} md={12}>
                  {xemPhieu.principalProfile ||
                  xemPhieu.changes?.principalUserId ? (
                    <TheNguoi
                      p={
                        xemPhieu.principalProfile || {
                          userId: Number(xemPhieu.changes?.principalUserId),
                          fullName: `User #${xemPhieu.changes?.principalUserId}`,
                        }
                      }
                      tieuDe="Chủ nhiệm mới"
                    />
                  ) : (
                    <Text type="secondary">Không đổi chủ nhiệm</Text>
                  )}
                </Col>
              </Row>
            </Card>

            <Card size="small" title="3. Nội dung & tiến độ">
              {(xemPhieu.changes?.milestones || []).length ? (
                <Table
                  size="small"
                  rowKey={(_, i) => String(i)}
                  pagination={false}
                  dataSource={xemPhieu.changes?.milestones || []}
                  columns={[
                    { title: 'Nội dung công việc', dataIndex: 'content' },
                    {
                      title: 'Thời gian',
                      width: 200,
                      render: (_, m) =>
                        m.startDate || m.endDate
                          ? `${mauNgay(m.startDate)} → ${mauNgay(m.endDate)}`
                          : '—',
                    },
                    {
                      title: 'Sản phẩm/kết quả',
                      dataIndex: 'expectedResult',
                      render: (v) => v || '—',
                    },
                    {
                      title: 'Tiến độ',
                      width: 140,
                      render: (_, m) => {
                        const pu = xemPhieu.changes?.progressUpdates?.find(
                          (x) => x.title === m.content,
                        );
                        const pct = Number(
                          pu?.progress ||
                            (m as { progress?: string | null }).progress ||
                            0,
                        );
                        if (!pct) {
                          return <Text type="secondary">—</Text>;
                        }
                        return <Progress percent={pct} size="small" />;
                      },
                    },
                  ]}
                />
              ) : (
                <Text type="secondary">Không đổi nội dung / tiến độ</Text>
              )}
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        title="Yêu cầu bổ sung điều chỉnh"
        open={bsOpen}
        onCancel={() => setBsOpen(false)}
        okText="Gửi yêu cầu"
        okButtonProps={{ danger: true, loading: acting }}
        cancelText="Hủy"
        onOk={() => void guiBoSung()}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chủ nhiệm nhiệm vụ sẽ nhận thông báo — trạng thái Chờ bổ sung."
        />
        <Form layout="vertical">
          <Form.Item label="Nội dung cần bổ sung" required>
            <TextArea
              rows={4}
              value={bsNote}
              onChange={(e) => setBsNote(e.target.value)}
              placeholder="Nêu rõ hạng mục / hồ sơ cần bổ sung…"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
