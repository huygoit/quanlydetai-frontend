import {
  HAN_FILE,
  ST_CHINH_SUA,
  ST_CHO_QUYET_TOAN,
  ST_KHONG_DAT,
  NHAN_VAI_TRO_HD,
  NHAN_XEP_LOAI,
} from '@/constants/module56';
import {
  giaHanGiaiTrinh,
  hoSoCuoiKy,
  luuBienBan,
  luuGiaiTrinh,
  luuPhieuCham,
  moLaiBienBanCuoiKy,
  quyetDinhKhongDat,
  taiBanGiaiTrinh,
  xacNhanGiaiTrinh,
  type HoSoCuoiKy,
  type TepModule56,
} from '@/services/api/module56';
import { isAdminKeKhaiUser } from '@/utils/adminKeKhai';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { EditableProTable } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Descriptions,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ChonTep } from './ChonTep';
import { PanelHoiDongDgck } from './PanelHoiDongDgck';
import { PanelQuyetToan } from './PanelQuyetToan';
import { PanelThanhLy } from './PanelThanhLy';
import { BienBanDgckXem } from '@/pages/projects/nghiem-thu-thanh-ly/BienBanDgckXem';
import type { VaiTro } from './types';

const { Paragraph } = Typography;

/** Tách từng ý kiến (mỗi dòng xuống hàng = 1 yêu cầu) */
function tachYKienTuBienBan(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/\r?\n/)
    .map((s) =>
      s
        .replace(/^\s*[-–—•]\s*/, '')
        .replace(/^\s*\d+[.)]\s*/, '')
        .trim(),
    )
    .filter(Boolean);
}

/**
 * Nguồn ý kiến giống màn xem biên bản mục 2.2:
 * clarifyContent || quality || recommendationLines || recommendation
 */
function layNoiDungYKienTuBienBan(m: HoSoCuoiKy['minutes']): string {
  if (!m) return '';
  const tuClarify = (m.clarifyContent || '').trim();
  if (tuClarify) return tuClarify;
  const tuQuality = (m.quality || '').trim();
  // quality đôi khi = discussion khi 2.2 trống — vẫn dùng nếu có nhiều dòng
  if (tuQuality) return tuQuality;
  const lines = (m as { recommendationLines?: string[] }).recommendationLines;
  if (Array.isArray(lines) && lines.length) return lines.join('\n');
  return (m.recommendation || '').trim();
}

type DongGiaiTrinh = {
  id: string;
  yKien: string;
  tiepThu: string;
  minhChung: string;
  minhChungFile: TepModule56 | null;
};

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

function PhieuCham({
  outlineId,
  ten,
  onXong,
}: {
  outlineId: number;
  ten: string[];
  onXong: () => void;
}) {
  const [volumeComment, setVolume] = useState('');
  const [qualityComment, setQuality] = useState('');
  const [reportComment, setReport] = useState('');
  const [generalComment, setGeneral] = useState('');
  const [rows, setRows] = useState(
    ten.map((name) => ({ name, actual: '', comment: '' })),
  );
  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
      <Input.TextArea
        rows={2}
        placeholder="Nhận xét khối lượng"
        value={volumeComment}
        onChange={(e) => setVolume(e.target.value)}
      />
      <Input.TextArea
        rows={2}
        placeholder="Nhận xét chất lượng"
        value={qualityComment}
        onChange={(e) => setQuality(e.target.value)}
      />
      <Input.TextArea
        rows={2}
        placeholder="Nhận xét báo cáo"
        value={reportComment}
        onChange={(e) => setReport(e.target.value)}
      />
      <Input.TextArea
        rows={4}
        placeholder="Nhận xét chung (≥ 100 ký tự)"
        value={generalComment}
        onChange={(e) => setGeneral(e.target.value)}
      />
      {rows.map((r, i) => (
        <Space key={r.name}>
          <span>{r.name}</span>
          <Input
            placeholder="Thực tế"
            value={r.actual}
            onChange={(e) =>
              setRows((s) =>
                s.map((x, j) =>
                  j === i ? { ...x, actual: e.target.value } : x,
                ),
              )
            }
          />
          <Input
            placeholder="Nhận xét"
            value={r.comment}
            onChange={(e) =>
              setRows((s) =>
                s.map((x, j) =>
                  j === i ? { ...x, comment: e.target.value } : x,
                ),
              )
            }
          />
        </Space>
      ))}
      <Button
        type="primary"
        onClick={() =>
          luuPhieuCham(outlineId, {
            volumeComment,
            qualityComment,
            reportComment,
            generalComment,
            productRows: rows,
          })
            .then(() => onXong())
            .catch((e) => message.error(bao(e)))
        }
      >
        Nộp phiếu chấm
      </Button>
    </Space>
  );
}

function BienBan({
  outlineId,
  members,
  ten,
  onXong,
}: {
  outlineId: number;
  members: { userId: number; role: string; fullName?: string; name?: string }[];
  ten: string[];
  onXong: () => void;
}) {
  const [present, setPresent] = useState<number[]>([]);
  const [classification, setClassification] = useState('DAT_YEU_CAU');
  const [discussion, setDiscussion] = useState('');
  const [volume, setVolume] = useState('');
  const [quality, setQuality] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {members.map((m) => (
        <Checkbox
          key={m.userId}
          checked={present.includes(m.userId)}
          onChange={(e) =>
            setPresent((s) =>
              e.target.checked
                ? [...s, m.userId]
                : s.filter((id) => id !== m.userId),
            )
          }
        >
          Có mặt {m.fullName || m.name || `#${m.userId}`} (
          {NHAN_VAI_TRO_HD[m.role as 'CHU_TICH'] || m.role})
        </Checkbox>
      ))}
      <Select
        value={classification}
        options={Object.entries(NHAN_XEP_LOAI).map(([value, label]) => ({
          value,
          label,
        }))}
        onChange={setClassification}
      />
      <Input.TextArea
        rows={2}
        placeholder="Thảo luận"
        value={discussion}
        onChange={(e) => setDiscussion(e.target.value)}
      />
      <Input.TextArea
        rows={2}
        placeholder="Khối lượng"
        value={volume}
        onChange={(e) => setVolume(e.target.value)}
      />
      <Input.TextArea
        rows={2}
        placeholder="Chất lượng"
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
      />
      <Input.TextArea
        rows={3}
        placeholder="Mỗi kiến nghị một dòng"
        value={recommendation}
        onChange={(e) => setRecommendation(e.target.value)}
      />
      {ten.map((name) => (
        <Checkbox
          key={name}
          checked={!!marks[name]}
          onChange={(e) =>
            setMarks((s) => ({ ...s, [name]: e.target.checked }))
          }
        >
          Đạt: {name}
        </Checkbox>
      ))}
      <Button
        type="primary"
        onClick={() =>
          luuBienBan(outlineId, {
            presentUserIds: present,
            classification,
            discussion,
            volume,
            quality,
            recommendation,
            productMarks: ten.map((name) => ({ name, met: !!marks[name] })),
          })
            .then(() => onXong())
            .catch((e) => message.error(bao(e)))
        }
      >
        Lưu biên bản
      </Button>
    </Space>
  );
}

/** Form BM-05.07 — dùng ở tab nghiệm thu và «Hội đồng của tôi». */
export function GiaiTrinh({
  hs,
  vaiTro,
  toiRole,
  outlineId,
  onXong,
}: {
  hs: HoSoCuoiKy;
  vaiTro: VaiTro;
  toiRole?: string;
  outlineId: number;
  onXong: () => void;
}) {
  const coTheSua =
    vaiTro.canCnnv &&
    (!hs.explanation.status || hs.explanation.status === 'TRA_LAI');

  const khoiTaoDong = (): DongGiaiTrinh[] => {
    const daLuu = hs.explanation.items || [];
    const daLuuCoNoiDung = daLuu.some(
      (it) =>
        (it.recommendation || it.text || '').trim() ||
        (it.response || '').trim() ||
        (it.evidence || '').trim() ||
        it.evidenceFile,
    );
    if (daLuuCoNoiDung) {
      return daLuu.map((it, i) => ({
        id: `gt-${i}-${Date.now()}`,
        yKien: it.recommendation || it.text || '',
        tiepThu: it.response || '',
        minhChung: it.evidence || '',
        minhChungFile: it.evidenceFile || null,
      }));
    }
    // Fill sẵn từ biên bản mục 2.2 (mỗi dòng xuống hàng = 1 ý kiến)
    const tuBb = tachYKienTuBienBan(layNoiDungYKienTuBienBan(hs.minutes));
    if (tuBb.length) {
      return tuBb.map((yKien, i) => ({
        id: `yk-${i}-${Date.now()}`,
        yKien,
        tiepThu: '',
        minhChung: '',
        minhChungFile: null,
      }));
    }
    return [
      {
        id: `trong-${Date.now()}`,
        yKien: '',
        tiepThu: '',
        minhChung: '',
        minhChungFile: null,
      },
    ];
  };

  const [rows, setRows] = useState<DongGiaiTrinh[]>([]);
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);
  const [baoCaoTongKet, setBaoCaoTongKet] = useState<TepModule56 | null>(
    hs.explanation.reportFile,
  );
  const [dangNop, setDangNop] = useState(false);
  const [dangXacNhan, setDangXacNhan] = useState(false);

  const stGt = hs.explanation.status;
  const nhanStGt =
    stGt === 'CHO_THU_KY'
      ? 'Chờ Thư ký HĐ xác nhận'
      : stGt === 'CHO_CHU_TICH'
        ? 'Chờ Chủ tịch HĐ xác nhận'
        : stGt === 'TRA_LAI'
          ? 'Trả lại — CNNV chỉnh sửa'
          : stGt === 'XONG'
            ? 'Đã xác nhận — chờ quyết toán'
            : 'Đang soạn / chưa nộp';

  const xacNhan = async (accept: boolean) => {
    let reason = '';
    if (!accept) {
      reason =
        window.prompt(
          'Nhập lý do trả lại để CNNV chỉnh sửa thêm (bắt buộc):',
        ) || '';
      if (!reason.trim()) {
        message.warning('Cần nhập lý do trả lại');
        return;
      }
    } else {
      const ok = window.confirm(
        toiRole === 'CHU_TICH'
          ? 'Xác nhận đồng ý bản giải trình và báo cáo tổng kết? Hệ thống chuyển sang chờ quyết toán và thông báo Phòng KH&HTQT.'
          : 'Xác nhận bản giải trình đạt yêu cầu? Chuyển sang Chủ tịch HĐ.',
      );
      if (!ok) return;
    }
    setDangXacNhan(true);
    try {
      await xacNhanGiaiTrinh(outlineId, {
        accept,
        reason: reason.trim() || undefined,
      });
      message.success(
        accept
          ? toiRole === 'CHU_TICH'
            ? 'Đã xác nhận — chuyển chờ quyết toán'
            : 'Thư ký đã xác nhận — chờ Chủ tịch'
          : 'Đã trả lại CNNV chỉnh sửa',
      );
      onXong();
    } catch (e) {
      message.error(bao(e));
    } finally {
      setDangXacNhan(false);
    }
  };

  useEffect(() => {
    const next = khoiTaoDong();
    setRows(next);
    setEditableKeys(coTheSua ? next.map((r) => r.id) : []);
    setBaoCaoTongKet(hs.explanation.reportFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hs.explanation.status,
    hs.explanation.items,
    hs.explanation.reportFile,
    hs.minutes?.clarifyContent,
    hs.minutes?.quality,
    hs.minutes?.recommendation,
    coTheSua,
  ]);

  const capNhatDong = (id: string, patch: Partial<DongGiaiTrinh>) => {
    setRows((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const cot: ProColumns<DongGiaiTrinh>[] = useMemo(
    () => [
      {
        title: 'STT',
        dataIndex: 'stt',
        width: 56,
        editable: false,
        align: 'center',
        render: (_, __, i) => i + 1,
      },
      {
        title: 'Ý kiến/yêu cầu đánh giá',
        dataIndex: 'yKien',
        editable: false,
        render: (_, r) =>
          coTheSua ? (
            <Input.TextArea
              rows={3}
              placeholder="Từ mục 2.2 biên bản — có thể chỉnh"
              value={r.yKien}
              onChange={(e) => capNhatDong(r.id, { yKien: e.target.value })}
            />
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{r.yKien || '—'}</div>
          ),
      },
      {
        title: 'Nội dung tiếp thu, giải trình hoặc hoàn thiện',
        dataIndex: 'tiepThu',
        editable: false,
        render: (_, r) =>
          coTheSua ? (
            <Input.TextArea
              rows={3}
              placeholder="CNNV nêu nội dung đã tiếp thu / hoàn thiện…"
              value={r.tiepThu}
              onChange={(e) => capNhatDong(r.id, { tiepThu: e.target.value })}
            />
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{r.tiepThu || '—'}</div>
          ),
      },
      {
        title: 'Vị trí/tài liệu minh chứng',
        dataIndex: 'minhChung',
        width: 280,
        editable: false,
        render: (_, r) => (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {coTheSua ? (
              <Input.TextArea
                rows={2}
                placeholder="Mô tả vị trí / tên tài liệu…"
                value={r.minhChung}
                onChange={(e) =>
                  capNhatDong(r.id, { minhChung: e.target.value })
                }
              />
            ) : (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {r.minhChung || '—'}
              </div>
            )}
            {coTheSua ? (
              <Space wrap size={6}>
                <ChonTep
                  maxBytes={HAN_FILE.tomTat}
                  nhan={r.minhChungFile ? 'Đổi file' : 'Upload minh chứng'}
                  onCo={(tep) => capNhatDong(r.id, { minhChungFile: tep })}
                />
                {r.minhChungFile?.fileName ? (
                  <a
                    href={resolvePublicAssetUrl(r.minhChungFile.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.minhChungFile.fileName}
                  </a>
                ) : (
                  <Tag>Chưa có file</Tag>
                )}
                {r.minhChungFile ? (
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() =>
                      capNhatDong(r.id, { minhChungFile: null })
                    }
                  >
                    Xóa file
                  </Button>
                ) : null}
              </Space>
            ) : r.minhChungFile?.fileName ? (
              <a
                href={resolvePublicAssetUrl(r.minhChungFile.fileUrl)}
                target="_blank"
                rel="noreferrer"
              >
                {r.minhChungFile.fileName}
              </a>
            ) : (
              <Tag>Chưa có file</Tag>
            )}
          </Space>
        ),
      },
      {
        title: '',
        valueType: 'option',
        width: 56,
        hideInTable: !coTheSua,
      },
    ],
    [coTheSua],
  );

  const nop = async (submit: boolean) => {
    if (!rows.length) {
      message.warning('Cần ít nhất một dòng giải trình');
      return;
    }
    if (submit) {
      if (rows.some((r) => !r.yKien.trim() || !r.tiepThu.trim())) {
        message.warning('Mỗi dòng cần đủ Ý kiến và Nội dung tiếp thu');
        return;
      }
      if (rows.some((r) => !r.minhChung.trim() && !r.minhChungFile)) {
        message.warning(
          'Mỗi dòng cần mô tả minh chứng hoặc upload tài liệu minh chứng',
        );
        return;
      }
      if (!baoCaoTongKet) {
        message.warning('Cần upload báo cáo tổng kết');
        return;
      }
    }
    setDangNop(true);
    try {
      await luuGiaiTrinh(outlineId, {
        submit,
        reportFile: baoCaoTongKet,
        items: rows.map((r) => ({
          recommendation: r.yKien.trim(),
          response: r.tiepThu.trim(),
          evidence: r.minhChung.trim() || undefined,
          evidenceFile: r.minhChungFile || null,
        })),
      });
      onXong();
    } catch (e) {
      message.error(bao(e));
    } finally {
      setDangNop(false);
    }
  };

  const ngayDanhGia = hs.council?.meetingAt
    ? dayjs(hs.council.meetingAt).format('DD/MM/YYYY')
    : '—';
  const tenHoiDong =
    (hs.council?.members || [])
      .map((m) => m.fullName)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ') || 'Hội đồng đánh giá kết quả';

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Space wrap>
        <Tag
          color={
            stGt === 'XONG'
              ? 'success'
              : stGt === 'TRA_LAI'
                ? 'error'
                : stGt === 'CHO_THU_KY' || stGt === 'CHO_CHU_TICH'
                  ? 'processing'
                  : 'default'
          }
        >
          {nhanStGt}
        </Tag>
        {hs.explanation.deadline ? (
          <Tag color="orange">
            Hạn nộp: {dayjs(hs.explanation.deadline).format('DD/MM/YYYY')}
          </Tag>
        ) : null}
      </Space>
      {hs.explanation.returnReason && (
        <Alert
          type="warning"
          showIcon
          message="Lý do trả lại"
          description={hs.explanation.returnReason}
        />
      )}

      <Card
        size="small"
        title="1. Thông tin nhiệm vụ"
        style={{ borderRadius: 12 }}
      >
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Tên nhiệm vụ" span={2}>
            {hs.title || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Mã số">{hs.code || '—'}</Descriptions.Item>
          <Descriptions.Item label="Chủ nhiệm">
            {hs.ownerName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Ngày đánh giá">
            {ngayDanhGia}
          </Descriptions.Item>
          <Descriptions.Item label="Hội đồng / chuyên gia">
            {tenHoiDong}
            {(hs.council?.members || []).length > 3
              ? ` (+${(hs.council?.members || []).length - 3})`
              : ''}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        size="small"
        title="2. Nội dung tiếp thu, hoàn thiện"
        extra={
          rows.length > 0 ? (
            <Tag color="blue">{rows.length} ý kiến</Tag>
          ) : null
        }
        style={{ borderRadius: 12 }}
        styles={{ body: { paddingTop: 8 } }}
      >
        <EditableProTable<DongGiaiTrinh>
          rowKey="id"
          size="middle"
          value={rows}
          onChange={(list) => {
            const next = [...(list || [])].map((r) => ({
              minhChungFile: null as TepModule56 | null,
              ...r,
              minhChung: r.minhChung || '',
              minhChungFile:
                r.minhChungFile === undefined ? null : r.minhChungFile,
            }));
            setRows(next);
            if (coTheSua) setEditableKeys(next.map((r) => r.id));
          }}
          recordCreatorProps={
            coTheSua
              ? {
                  newRecordType: 'dataSource',
                  record: () => ({
                    id: `moi-${Date.now()}`,
                    yKien: '',
                    tiepThu: '',
                    minhChung: '',
                    minhChungFile: null,
                  }),
                  creatorButtonText: 'Thêm dòng',
                  icon: <PlusOutlined />,
                }
              : false
          }
          columns={cot}
          editable={{
            type: 'multiple',
            editableKeys: coTheSua ? editableKeys : [],
            onChange: setEditableKeys,
            onValuesChange: (_r, list) => {
              setRows((cu) => {
                const byId = new Map(cu.map((x) => [x.id, x]));
                return [...(list || [])].map((r) => {
                  const cuDong = byId.get(r.id);
                  return {
                    ...r,
                    minhChung: r.minhChung ?? cuDong?.minhChung ?? '',
                    minhChungFile:
                      r.minhChungFile !== undefined
                        ? r.minhChungFile
                        : cuDong?.minhChungFile || null,
                  };
                });
              });
              if (coTheSua) {
                setEditableKeys((list || []).map((r) => r.id));
              }
            },
            actionRender: (row) =>
              coTheSua
                ? [
                    <Button
                      key="xoa"
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        setRows((s) => s.filter((x) => x.id !== row.id));
                        setEditableKeys((ks) =>
                          ks.filter((k) => k !== row.id),
                        );
                      }}
                    />,
                  ]
                : [],
          }}
          pagination={false}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Card
        size="small"
        title="3. Báo cáo tổng kết"
        style={{ borderRadius: 12 }}
      >
        <Space wrap align="start">
          {coTheSua ? (
            <>
              <ChonTep
                maxBytes={HAN_FILE.tomTat}
                nhan={
                  baoCaoTongKet ? 'Đổi báo cáo tổng kết' : 'Upload báo cáo tổng kết'
                }
                onCo={setBaoCaoTongKet}
              />
              {baoCaoTongKet?.fileName ? (
                <>
                  <a
                    href={resolvePublicAssetUrl(baoCaoTongKet.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {baoCaoTongKet.fileName}
                  </a>
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => setBaoCaoTongKet(null)}
                  >
                    Xóa file
                  </Button>
                </>
              ) : (
                <Tag>Chưa upload</Tag>
              )}
            </>
          ) : baoCaoTongKet?.fileName ? (
            <a
              href={resolvePublicAssetUrl(baoCaoTongKet.fileUrl)}
              target="_blank"
              rel="noreferrer"
            >
              {baoCaoTongKet.fileName}
            </a>
          ) : (
            <Tag>Chưa có báo cáo tổng kết</Tag>
          )}
        </Space>
      </Card>

      {coTheSua && (
        <Space wrap>
          <Button loading={dangNop} onClick={() => void nop(false)}>
            Lưu nháp
          </Button>
          <Button type="primary" loading={dangNop} onClick={() => void nop(true)}>
            Nộp bản giải trình
          </Button>
        </Space>
      )}

      {/* Thư ký HĐ — xác nhận / trả lại */}
      {toiRole === 'THU_KY' && stGt === 'CHO_THU_KY' && (
        <Card
          size="small"
          title="Thư ký HĐ — xác nhận bản giải trình"
          style={{ borderRadius: 12, borderColor: '#91caff' }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Xem bảng giải trình và báo cáo tổng kết phía trên. Đồng ý → chuyển
            Chủ tịch HĐ; Chưa đạt → trả CNNV chỉnh sửa.
          </Paragraph>
          <Space wrap>
            <Button
              type="primary"
              loading={dangXacNhan}
              onClick={() => void xacNhan(true)}
            >
              Đồng ý — chuyển Chủ tịch
            </Button>
            <Button
              danger
              loading={dangXacNhan}
              onClick={() => void xacNhan(false)}
            >
              Chưa đạt — trả CNNV
            </Button>
          </Space>
        </Card>
      )}

      {/* Chủ tịch HĐ ĐGCK — review + ký xác nhận */}
      {toiRole === 'CHU_TICH' && stGt === 'CHO_CHU_TICH' && (
        <Card
          size="small"
          title="Chủ tịch HĐ ĐGCK — review & ký xác nhận"
          style={{ borderRadius: 12, borderColor: '#b7eb8f' }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Xem lại bảng giải trình và báo cáo tổng kết (+ file minh chứng).
            Đồng ý → Phòng KH&amp;HTQT nhận thông báo, chuyển chờ quyết toán.
            Chưa đạt → nhập lý do, trả CNNV chỉnh sửa thêm.
          </Paragraph>
          <Space wrap>
            <Button
              type="primary"
              loading={dangXacNhan}
              onClick={() => void xacNhan(true)}
            >
              Đồng ý — ký xác nhận
            </Button>
            <Button
              danger
              loading={dangXacNhan}
              onClick={() => void xacNhan(false)}
            >
              Chưa đạt — trả CNNV
            </Button>
          </Space>
        </Card>
      )}

      {stGt === 'CHO_THU_KY' && toiRole !== 'THU_KY' && (
        <Alert
          type="info"
          showIcon
          message="Đã nộp — chờ Thư ký HĐ xác nhận"
        />
      )}
      {stGt === 'CHO_CHU_TICH' && toiRole !== 'CHU_TICH' && (
        <Alert
          type="info"
          showIcon
          message="Thư ký đã xác nhận — chờ Chủ tịch HĐ ĐGCK review"
        />
      )}
      {stGt === 'XONG' && (
        <Alert
          type="success"
          showIcon
          message="Chủ tịch đã xác nhận — hồ sơ chuyển chờ quyết toán (Phòng KH&HTQT)"
        />
      )}

      {vaiTro.canManage && (
        <Button
          onClick={() => {
            const deadline = window.prompt('Hạn mới YYYY-MM-DD') || '';
            if (!deadline.trim()) return;
            giaHanGiaiTrinh(outlineId, deadline.trim())
              .then(onXong)
              .catch((e) => message.error(bao(e)));
          }}
        >
          Gia hạn giải trình
        </Button>
      )}
    </Space>
  );
}

/** Phân tab trên chi tiết hợp đồng — `all` giữ màn triển khai gộp. */
export type PhanCuoiKy =
  | 'all'
  | 'hoidong'
  | 'giaitrinh'
  | 'danhgia'
  | 'quyettoan'
  | 'thanhly';

export function TabCuoiKy({
  outlineId,
  vaiTro,
  sanPham,
  // Giữ prop tương thích; không còn khóa nộp theo hạn 30 ngày.
  ketThuc: _ketThuc,
  onXong,
  onDaMoLai,
  phan = 'all',
}: {
  outlineId: number;
  vaiTro: VaiTro;
  sanPham: string[];
  ketThuc?: string | null;
  onXong: (t: string) => void;
  onDaMoLai?: () => void;
  /** Chỉ hiện một bước luồng nghiệm thu / HĐ / giải trình / ĐG / QT / TL */
  phan?: PhanCuoiKy;
}) {
  const chi = (k: PhanCuoiKy) => phan === 'all' || phan === k;
  const { initialState } = useModel('@@initialState');
  const laAdmin = isAdminKeKhaiUser(initialState?.currentUser);
  const [hs, setHs] = useState<HoSoCuoiKy | null>(null);
  const [loi, setLoi] = useState('');
  const [products, setProducts] = useState<{ name: string }[]>([]);
  const [dangTaiBm0507, setDangTaiBm0507] = useState(false);

  const taiBm0507Panel = async () => {
    setDangTaiBm0507(true);
    try {
      await taiBanGiaiTrinh(
        outlineId,
        `BM-05.07_Ban_giai_trinh_${hs?.code || outlineId}.docx`,
      );
      message.success('Đã tải bản giải trình BM-05.07');
    } catch (e) {
      message.error(bao(e));
    } finally {
      setDangTaiBm0507(false);
    }
  };

  const tai = () =>
    hoSoCuoiKy(outlineId)
      .then((res) => {
        const d = res.data;
        setHs(d);
        setLoi('');
        const ten = sanPham.length
          ? sanPham
          : (d.dossier.products || []).map((p) => p.name);
        setProducts(ten.map((name) => ({ name })));
      })
      .catch((e) => setLoi(bao(e)));

  useEffect(() => {
    tai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId, sanPham.join('|')]);

  if (loi && !hs) return <Alert type="error" message={loi} />;
  if (!hs) return <Alert type="info" message="Đang tải hồ sơ đánh giá..." />;

  const st = hs.executionStatus;
  const toi = hs.council.members.find((m) => m.userId === vaiTro.userId);

  const stHoiDong = [
    'DGCK_HOP_HD',
    'DGCK_CHINH_SUA',
    'NT_CHINH_SUA',
    'DGCK_CHO_QUYET_TOAN',
    'NT_CHO_QUYETTOAN',
    'DGCK_CHO_THANH_LY',
    'HOAN_THANH',
    'DGCK_KHONG_DAT',
    'NT_KHONG_DAT',
    'DGCK_DINH_CHI',
  ].includes(String(st));
  const stGiaiTrinh =
    ST_CHINH_SUA.includes(String(st)) ||
    !!hs.explanation.status ||
    hs.classification === 'CAN_BO_SUNG';
  const stDanhGia =
    st === 'DGCK_HOP_HD' ||
    hs.minutesLocked ||
    [
      'DGCK_CHO_QUYET_TOAN',
      'NT_CHO_QUYETTOAN',
      'DGCK_CHO_THANH_LY',
      'HOAN_THANH',
      'DGCK_CHINH_SUA',
      'NT_CHINH_SUA',
      'DGCK_KHONG_DAT',
      'NT_KHONG_DAT',
    ].includes(String(st));
  const stQuyetToan =
    ST_CHO_QUYET_TOAN.includes(String(st)) ||
    ['DGCK_CHO_THANH_LY', 'HOAN_THANH'].includes(String(st));
  const stThanhLy = ['DGCK_CHO_THANH_LY', 'HOAN_THANH'].includes(String(st));

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {hs.overdueExplanation && (
        <Alert type="warning" showIcon message="Đã quá hạn giải trình." />
      )}
      {hs.reviewDeadlineTight && chi('hoidong') && (
        <Alert type="warning" showIcon message="Hạn phản biện đang sát." />
      )}
      {hs.minutesLocked && laAdmin && chi('danhgia') && (
        <Button
          onClick={() => {
            let reason = '';
            Modal.confirm({
              title: 'Mở lại biên bản',
              okText: 'Mở lại',
              cancelText: 'Hủy',
              content: (
                <Input.TextArea
                  rows={3}
                  placeholder="Lý do (tối thiểu 5 ký tự)"
                  onChange={(e) => {
                    reason = e.target.value;
                  }}
                />
              ),
              onOk: async () => {
                if (reason.trim().length < 5) {
                  message.warning('Lý do tối thiểu 5 ký tự');
                  return Promise.reject();
                }
                await moLaiBienBanCuoiKy(outlineId, reason.trim());
                onXong('Đã mở lại biên bản');
                await tai();
                onDaMoLai?.();
              },
            });
          }}
        >
          Mở lại biên bản
        </Button>
      )}

      {chi('hoidong') && stHoiDong && (
        <PanelHoiDongDgck
          outlineId={outlineId}
          hs={hs}
          vaiTro={vaiTro}
          onTai={tai}
          onXong={onXong}
        />
      )}

      {phan === 'hoidong' && !stHoiDong && (
        <Alert
          type="info"
          showIcon
          message="Hội đồng mở sau khi PKH duyệt hồ sơ đề nghị đánh giá KQNV"
          description="CNNV nộp hồ sơ đề nghị → PKH duyệt và chuyển họp hội đồng."
        />
      )}

      {chi('danhgia') && stDanhGia && (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {vaiTro.canManage &&
            !hs.minutesLocked &&
            st === 'DGCK_HOP_HD' &&
            hs.council.members.length > 0 && (
              <Card size="small" title="Lập biên bản hội đồng">
                <BienBan
                  outlineId={outlineId}
                  members={hs.council.members}
                  ten={products.map((p) => p.name)}
                  onXong={tai}
                />
              </Card>
            )}
          {hs.minutesLocked && hs.minutes ? (
            <BienBanDgckXem hs={hs} />
          ) : null}
          {ST_KHONG_DAT.includes(String(st)) && vaiTro.canManage && (
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  type="warning"
                  showIcon
                  message="Xếp loại Không đạt — PKH&HTQT quyết định hướng xử lý"
                  description="Cho làm lại (chuyển chỉnh sửa / hoàn thiện) hoặc đình chỉ nhiệm vụ."
                />
                <Space>
                  <Button
                    type="primary"
                    onClick={() =>
                      quyetDinhKhongDat(outlineId, true)
                        .then(tai)
                        .catch((e) => message.error(bao(e)))
                    }
                  >
                    Cho làm lại / hoàn thiện
                  </Button>
                  <Button
                    danger
                    onClick={() =>
                      quyetDinhKhongDat(outlineId, false)
                        .then(tai)
                        .catch((e) => message.error(bao(e)))
                    }
                  >
                    Đình chỉ
                  </Button>
                </Space>
              </Space>
            </Card>
          )}
        </Space>
      )}

      {phan === 'danhgia' && !stDanhGia && (
        <Alert
          type="info"
          showIcon
          message="Đánh giá kết quả mở khi hội đồng họp hoặc sau khi xếp loại"
          description="Lập biên bản / xếp loại tại bước này. Nếu cần bổ sung → qua tab Giải trình; đạt yêu cầu → Quyết toán."
        />
      )}

      {chi('giaitrinh') && stGiaiTrinh && (
        <Card
          size="small"
          title="Nộp hồ sơ giải trình (BM-05.07)"
          extra={
            <Button
              size="small"
              type="primary"
              ghost
              loading={dangTaiBm0507}
              onClick={() => void taiBm0507Panel()}
            >
              Tải BM-05.07
            </Button>
          }
        >
          <GiaiTrinh
            hs={hs}
            vaiTro={vaiTro}
            toiRole={toi?.role}
            outlineId={outlineId}
            onXong={tai}
          />
        </Card>
      )}

      {phan === 'giaitrinh' && !stGiaiTrinh && (
        <Alert
          type="info"
          showIcon
          message="Tab giải trình mở khi hội đồng xếp loại cần bổ sung"
          description="Sau khi CNNV nộp lại và Chủ tịch + Thư ký xác nhận, hệ thống mở Quyết toán và Thanh lý."
        />
      )}

      {chi('quyettoan') && stQuyetToan && (
        <PanelQuyetToan
          outlineId={outlineId}
          hs={hs}
          vaiTro={vaiTro}
          onTai={tai}
        />
      )}

      {phan === 'quyettoan' && !stQuyetToan && (
        <Alert type="info" showIcon message="Chưa đến bước quyết toán" />
      )}

      {chi('thanhly') && stThanhLy && (
        <PanelThanhLy
          outlineId={outlineId}
          hs={hs}
          vaiTro={vaiTro}
          onTai={tai}
        />
      )}

      {phan === 'thanhly' && !stThanhLy && (
        <Alert type="info" showIcon message="Chưa đến bước thanh lý" />
      )}
    </Space>
  );
}

function TextStrong({ children }: { children: React.ReactNode }) {
  return <span style={{ fontWeight: 600 }}>{children}</span>;
}
