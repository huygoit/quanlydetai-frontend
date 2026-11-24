/**
 * Phiếu đánh giá thành viên HĐ: form y chang Hồ sơ đề nghị đánh giá KQNV,
 * thêm cột Số lượng / Chất lượng (Đạt|Không đạt) + kết luận kiến nghị.
 */
import {
  EMPTY_EXPECTED_RESULTS,
  type OutlineExpectedAppliedProduct,
  type OutlineExpectedIpProduct,
  type OutlineExpectedPublication,
  type OutlineExpectedTangibleProduct,
  type OutlineExpectedTraining,
  type ProjectOutline,
} from '@/services/api/projectOutlines';
import {
  hoSoCuoiKy,
  luuPhieuCham,
  type HoSoCuoiKy,
  type TepModule56,
} from '@/services/api/module56';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import {
  CheckCircleFilled,
  ExperimentOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  ReadOutlined,
  RocketOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Empty,
  Input,
  Radio,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

type DatKd = 'DAT' | 'KHONG_DAT';
type KetLuan = 'DAT_YEU_CAU' | 'CAN_BO_SUNG' | 'KHONG_DAT';

type DongDg = {
  key: string;
  title: string;
  soLuong?: DatKd;
  chatLuong?: DatKd;
  /** Lý do khi Số lượng = Không đạt */
  soLuongNote: string;
  /** Lý do khi Chất lượng = Không đạt */
  chatLuongNote: string;
};

type MinhChung = {
  key: string;
  title: string;
  fileUrl?: string | null;
  fileName?: string;
  link: string;
};

type Props = {
  outlineId: number;
  outline: ProjectOutline | null;
  userId: number;
  onXong?: (t: string) => void;
};

const STYLE_WRAP: CSSProperties = {
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
  lineHeight: 1.35,
};

const BANG_PROPS = {
  search: false as const,
  options: false as const,
  pagination: false as const,
  toolBarRender: false as false,
  size: 'small' as const,
  cardProps: { bodyStyle: { padding: 0 } },
  /** Không scroll ngang — header/ô dài xuống hàng */
  tableProps: {
    tableLayout: 'fixed' as const,
    style: { width: '100%' },
  },
  tableStyle: {
    whiteSpace: 'normal' as const,
    wordBreak: 'break-word' as const,
    overflowWrap: 'anywhere' as const,
  },
};

const PHAM_VI: Record<string, string> = {
  DOMESTIC: 'Trong nước',
  INTERNATIONAL: 'Quốc tế',
};

function tieuDeWrap(text: string) {
  return <div style={STYLE_WRAP}>{text}</div>;
}

function oWrap(v: unknown) {
  const s = v == null ? '' : String(v).trim();
  return <div style={STYLE_WRAP}>{s || '—'}</div>;
}

function demDong(n: number) {
  return n > 0 ? <Tag>{n}</Tag> : null;
}

/** Radio Đạt/Không đạt — nếu Không đạt hiện textarea ngay dưới (ổn định, không tắt đột ngột) */
function RadioDatKd({
  value,
  onChange,
  disabled,
  lyDo,
  onLyDoChange,
}: {
  value?: DatKd;
  onChange: (v: DatKd) => void;
  disabled?: boolean;
  lyDo?: string;
  onLyDoChange?: (v: string) => void;
}) {
  return (
    <div style={{ width: '100%' }}>
      <Radio.Group
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value as DatKd;
          if (v === 'DAT' || v === 'KHONG_DAT') onChange(v);
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          whiteSpace: 'normal',
        }}
      >
        <Radio value="DAT">Đạt</Radio>
        <Radio value="KHONG_DAT">Không đạt</Radio>
      </Radio.Group>
      {value === 'KHONG_DAT' ? (
        <TextArea
          rows={2}
          disabled={disabled}
          value={lyDo || ''}
          placeholder="Lý do / cần chỉnh sửa"
          style={{ width: '100%', fontSize: 12, marginTop: 6 }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => onLyDoChange?.(e.target.value)}
        />
      ) : null}
    </div>
  );
}

export function FormDanhGiaThanhVienHd({
  outlineId,
  outline,
  userId,
  onXong,
}: Props) {
  const [hs, setHs] = useState<HoSoCuoiKy | null>(null);
  const er =
    hs?.expectedResults ||
    outline?.expectedResults ||
    EMPTY_EXPECTED_RESULTS;
  const [mcMap, setMcMap] = useState<Record<string, MinhChung>>({});
  const [dongMap, setDongMap] = useState<Record<string, DongDg>>({});
  /** Ref luôn mới — cột bảng đọc từ đây, tránh stale closure khi useMemo cột */
  const dongMapRef = useRef(dongMap);
  dongMapRef.current = dongMap;
  const [bcKetQua, setBcKetQua] = useState<DatKd | undefined>();
  const [bcGhiChu, setBcGhiChu] = useState('');
  const [ketLuan, setKetLuan] = useState<KetLuan | undefined>();
  const [boSung, setBoSung] = useState('');
  const [kienNghi, setKienNghi] = useState('');
  const [dangGui, setDangGui] = useState(false);
  const [daNopPhieu, setDaNopPhieu] = useState(false);

  const pubs = useMemo(
    () => (er.publications || []).filter((r) => r.content?.trim()),
    [er.publications],
  );
  const apps = useMemo(
    () => (er.appliedProducts || []).filter((r) => r.name?.trim()),
    [er.appliedProducts],
  );
  const tans = useMemo(
    () => (er.tangibleProducts || []).filter((r) => r.name?.trim()),
    [er.tangibleProducts],
  );
  const ips = useMemo(
    () => (er.ipProducts || []).filter((r) => r.name?.trim()),
    [er.ipProducts],
  );
  const trns = useMemo(
    () =>
      (er.postgraduateTraining || []).filter(
        (r) => r.level?.trim() || r.major?.trim(),
      ),
    [er.postgraduateTraining],
  );

  const tatCaKeys = useMemo(() => {
    const rows: { key: string; title: string }[] = [];
    pubs.forEach((r) =>
      rows.push({ key: `pub:${r.id}`, title: r.content.trim() }),
    );
    apps.forEach((r) =>
      rows.push({ key: `app:${r.id}`, title: r.name.trim() }),
    );
    tans.forEach((r) =>
      rows.push({ key: `tan:${r.id}`, title: r.name.trim() }),
    );
    ips.forEach((r) => rows.push({ key: `ip:${r.id}`, title: r.name.trim() }));
    trns.forEach((r) => {
      const title = [r.level?.trim(), r.major?.trim(), r.quantity?.trim()]
        .filter(Boolean)
        .join(' — ');
      rows.push({ key: `trn:${r.id}`, title });
    });
    return rows;
  }, [pubs, apps, tans, ips, trns]);

  useEffect(() => {
    if (!outlineId) return;
    let huy = false;
    hoSoCuoiKy(outlineId)
      .then((res) => {
        if (huy) return;
        const data = res.data;
        setHs(data);
        const sheet = (data.sheets || []).find(
          (s) => Number(s.userId) === Number(userId),
        );
        if (sheet?.submittedAt) setDaNopPhieu(true);

        const products = data.dossier?.products || [];
        // Dựng key từ expectedResults trên hồ sơ (không phụ thuộc tatCaKeys lúc fetch)
        const erHs = data.expectedResults || EMPTY_EXPECTED_RESULTS;
        const rows: { key: string; title: string }[] = [];
        (erHs.publications || [])
          .filter((r) => r.content?.trim())
          .forEach((r) =>
            rows.push({ key: `pub:${r.id}`, title: r.content.trim() }),
          );
        (erHs.appliedProducts || [])
          .filter((r) => r.name?.trim())
          .forEach((r) =>
            rows.push({ key: `app:${r.id}`, title: r.name.trim() }),
          );
        (erHs.tangibleProducts || [])
          .filter((r) => r.name?.trim())
          .forEach((r) =>
            rows.push({ key: `tan:${r.id}`, title: r.name.trim() }),
          );
        (erHs.ipProducts || [])
          .filter((r) => r.name?.trim())
          .forEach((r) =>
            rows.push({ key: `ip:${r.id}`, title: r.name.trim() }),
          );
        (erHs.postgraduateTraining || [])
          .filter((r) => r.level?.trim() || r.major?.trim())
          .forEach((r) => {
            const title = [r.level?.trim(), r.major?.trim(), r.quantity?.trim()]
              .filter(Boolean)
              .join(' — ');
            rows.push({ key: `trn:${r.id}`, title });
          });

        const mc: Record<string, MinhChung> = {};
        const dgFromApi: Record<string, DongDg> = {};
        for (const row of rows) {
          const hit = products.find((p) => p.name === row.title);
          mc[row.key] = {
            key: row.key,
            title: row.title,
            link: hit?.link || '',
            fileUrl: hit?.fileUrl || null,
            fileName: hit?.name,
          };
          const old = (sheet?.productRows || []).find(
            (p: any) => p.key === row.key || p.name === row.title,
          ) as any;
          const oldNote = String(old?.note || old?.comment || '');
          const sl = old?.soLuong || old?.quantityOk;
          const cl = old?.chatLuong || old?.qualityOk;
          dgFromApi[row.key] = {
            key: row.key,
            title: row.title,
            soLuong: sl,
            chatLuong: cl,
            soLuongNote:
              String(old?.soLuongNote || '') ||
              (sl === 'KHONG_DAT' ? oldNote : ''),
            chatLuongNote:
              String(old?.chatLuongNote || '') ||
              (cl === 'KHONG_DAT' && !old?.soLuongNote ? oldNote : ''),
          };
        }
        setMcMap(mc);
        // Giữ lựa chọn user đang nhập — không ghi đè khi effect chạy lại
        setDongMap((prev) => {
          const next: Record<string, DongDg> = {};
          for (const row of rows) {
            const cu = prev[row.key];
            const tuApi = dgFromApi[row.key];
            if (
              cu &&
              (cu.soLuong || cu.chatLuong || cu.soLuongNote || cu.chatLuongNote)
            ) {
              next[row.key] = { ...tuApi, ...cu };
            } else {
              next[row.key] = tuApi;
            }
          }
          return next;
        });

        if (sheet) {
          const rq = (sheet.volumeComment || '') as DatKd;
          if (rq === 'DAT' || rq === 'KHONG_DAT') setBcKetQua(rq);
          setBcGhiChu(sheet.qualityComment || '');
          const kl = (sheet.reportComment || '') as KetLuan;
          if (
            kl === 'DAT_YEU_CAU' ||
            kl === 'CAN_BO_SUNG' ||
            kl === 'KHONG_DAT'
          ) {
            setKetLuan(kl);
          }
          try {
            const meta = JSON.parse(sheet.generalComment || '{}');
            if (meta && typeof meta === 'object') {
              setBoSung(meta.supplementContent || '');
              setKienNghi(meta.otherRecommendation || '');
            }
          } catch {
            /* bỏ qua */
          }
        }
      })
      .catch(() => undefined);
    return () => {
      huy = true;
    };
    // Chỉ tải 1 lần theo đề tài / user — không phụ thuộc danh sách dòng
  }, [outlineId, userId]);

  const khoa = daNopPhieu || !!hs?.minutesLocked;

  const capNhatDong = (key: string, title: string, patch: Partial<DongDg>) => {
    setDongMap((s) => ({
      ...s,
      [key]: {
        key,
        title,
        soLuongNote: '',
        chatLuongNote: '',
        ...s[key],
        ...patch,
      },
    }));
  };

  const cotVanBan = (
    title: string,
    dataIndex: string,
    width?: number,
  ): ProColumns<any> => ({
    title: tieuDeWrap(title),
    dataIndex,
    width,
    ellipsis: false,
    onHeaderCell: () => ({ style: STYLE_WRAP }),
    onCell: () => ({ style: { ...STYLE_WRAP, verticalAlign: 'top' } }),
    render: (_, row) => oWrap(row?.[dataIndex]),
  });

  const cotDgStyle = {
    onHeaderCell: () => ({ style: STYLE_WRAP }),
    onCell: () => ({
      style: { ...STYLE_WRAP, verticalAlign: 'top' as const },
    }),
  };

  const cotMinhChungXem = <T extends { id: string }>(opts: {
    keyOf: (row: T) => string;
  }): ProColumns<T> => ({
    title: tieuDeWrap('Minh chứng'),
    key: 'minh_chung',
    onHeaderCell: () => ({ style: STYLE_WRAP }),
    onCell: () => ({ style: { ...STYLE_WRAP, verticalAlign: 'top' } }),
    render: (_, row) => {
      const mc = mcMap[opts.keyOf(row)];
      const co = !!(mc?.fileUrl || mc?.link?.trim());
      return (
        <Space direction="vertical" size={4}>
          <Space size={6} wrap>
            {co ? (
              <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
            ) : (
              <Tag style={{ margin: 0 }}>Chưa có</Tag>
            )}
            {mc?.fileUrl ? (
              <a href={mc.fileUrl} target="_blank" rel="noreferrer">
                {mc.fileName || 'File'}
              </a>
            ) : null}
          </Space>
          {mc?.link?.trim() ? (
            <a href={mc.link} target="_blank" rel="noreferrer">
              {mc.link}
            </a>
          ) : null}
        </Space>
      );
    },
  });

  /**
   * 2 cột đánh giá — dùng % width + cố định phải
   * để mọi bảng (công bố / SP / ĐT…) thẳng hàng nhau.
   */
  const cotDgThem = <T extends { id: string }>(opts: {
    keyOf: (row: T) => string;
    titleOf: (row: T) => string;
  }): ProColumns<T>[] => [
    {
      title: tieuDeWrap('Số lượng'),
      key: 'dg_so_luong',
      width: '22%',
      fixed: 'right',
      ...cotDgStyle,
      render: (_, row) => {
        const k = opts.keyOf(row);
        // Đọc ref — luôn đúng giá trị mới sau khi chọn Không đạt
        const d = dongMapRef.current[k];
        return (
          <RadioDatKd
            value={d?.soLuong}
            disabled={khoa}
            lyDo={d?.soLuongNote}
            onChange={(v) => {
              const cur = dongMapRef.current[k];
              capNhatDong(k, opts.titleOf(row), {
                soLuong: v,
                soLuongNote: v === 'DAT' ? '' : cur?.soLuongNote || '',
              });
            }}
            onLyDoChange={(text) =>
              capNhatDong(k, opts.titleOf(row), { soLuongNote: text })
            }
          />
        );
      },
    },
    {
      title: tieuDeWrap('Chất lượng'),
      key: 'dg_chat_luong',
      width: '22%',
      fixed: 'right',
      ...cotDgStyle,
      render: (_, row) => {
        const k = opts.keyOf(row);
        const d = dongMapRef.current[k];
        return (
          <RadioDatKd
            value={d?.chatLuong}
            disabled={khoa}
            lyDo={d?.chatLuongNote}
            onChange={(v) => {
              const cur = dongMapRef.current[k];
              capNhatDong(k, opts.titleOf(row), {
                chatLuong: v,
                chatLuongNote: v === 'DAT' ? '' : cur?.chatLuongNote || '',
              });
            }}
            onLyDoChange={(text) =>
              capNhatDong(k, opts.titleOf(row), { chatLuongNote: text })
            }
          />
        );
      },
    },
  ];

  // Không memo cột — mỗi lần chọn radio cần render lại textarea
  const cotPub: ProColumns<OutlineExpectedPublication>[] = [
    {
      title: tieuDeWrap('STT'),
      width: 40,
      render: (_, __, i) => i + 1,
    },
    {
      title: tieuDeWrap('Phạm vi'),
      dataIndex: 'category',
      width: 64,
      onHeaderCell: () => ({ style: STYLE_WRAP }),
      onCell: () => ({ style: { ...STYLE_WRAP, verticalAlign: 'top' } }),
      render: (v) => oWrap(PHAM_VI[String(v)] || v),
    },
    cotVanBan('Nội dung', 'content', 100),
    cotVanBan('SL', 'quantity', 44),
    cotVanBan('Yêu cầu KH', 'scienceRequirement', 90),
    { ...cotMinhChungXem({ keyOf: (r) => `pub:${r.id}` }), width: 88 },
    ...cotDgThem({
      keyOf: (r) => `pub:${r.id}`,
      titleOf: (r) => r.content.trim(),
    }),
  ];

  const cotApp: ProColumns<OutlineExpectedAppliedProduct>[] = [
    {
      title: tieuDeWrap('STT'),
      width: 40,
      render: (_, __, i) => i + 1,
    },
    cotVanBan('Tên SP', 'name', 100),
    cotVanBan('Yêu cầu KH', 'scienceRequirement', 90),
    { ...cotMinhChungXem({ keyOf: (r) => `app:${r.id}` }), width: 88 },
    ...cotDgThem({
      keyOf: (r) => `app:${r.id}`,
      titleOf: (r) => r.name.trim(),
    }),
  ];

  const cotTan: ProColumns<OutlineExpectedTangibleProduct>[] = [
    {
      title: tieuDeWrap('STT'),
      width: 40,
      render: (_, __, i) => i + 1,
    },
    cotVanBan('Tên SP', 'name', 100),
    cotVanBan('ĐVT', 'unit', 44),
    cotVanBan('Mức CL', 'qualityRequired', 72),
    cotVanBan('Mẫu TN', 'qualitySampleDomestic', 72),
    cotVanBan('Mẫu TG', 'qualitySampleWorld', 72),
    cotVanBan('SL', 'quantityScale', 52),
    { ...cotMinhChungXem({ keyOf: (r) => `tan:${r.id}` }), width: 88 },
    ...cotDgThem({
      keyOf: (r) => `tan:${r.id}`,
      titleOf: (r) => r.name.trim(),
    }),
  ];

  const cotIp: ProColumns<OutlineExpectedIpProduct>[] = [
    {
      title: tieuDeWrap('STT'),
      width: 40,
      render: (_, __, i) => i + 1,
    },
    cotVanBan('Tên SP', 'name', 100),
    cotVanBan('Yêu cầu KH', 'scienceRequirement', 90),
    { ...cotMinhChungXem({ keyOf: (r) => `ip:${r.id}` }), width: 88 },
    ...cotDgThem({
      keyOf: (r) => `ip:${r.id}`,
      titleOf: (r) => r.name.trim(),
    }),
  ];

  const cotTrn: ProColumns<OutlineExpectedTraining>[] = [
    {
      title: tieuDeWrap('STT'),
      width: 40,
      render: (_, __, i) => i + 1,
    },
    cotVanBan('Cấp ĐT', 'level', 72),
    cotVanBan('SL', 'quantity', 44),
    cotVanBan('Chuyên ngành', 'major', 100),
    { ...cotMinhChungXem({ keyOf: (r) => `trn:${r.id}` }), width: 88 },
    ...cotDgThem({
      keyOf: (r) => `trn:${r.id}`,
      titleOf: (r) =>
        [r.level?.trim(), r.major?.trim(), r.quantity?.trim()]
          .filter(Boolean)
          .join(' — '),
    }),
  ];

  const panelStyle = (border: string, bg: string) => ({
    marginBottom: 12,
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: bg,
    overflow: 'hidden' as const,
  });

  const coDuLieu =
    pubs.length + apps.length + tans.length + ips.length + trns.length > 0;

  const kiemTra = () => {
    for (const r of tatCaKeys) {
      const d = dongMap[r.key];
      if (!d?.soLuong || !d?.chatLuong) {
        message.warning(`Chưa đánh giá đủ: ${r.title}`);
        return false;
      }
      if (d.soLuong === 'KHONG_DAT' && !d.soLuongNote?.trim()) {
        message.warning(`Số lượng không đạt — nhập lý do: ${r.title}`);
        return false;
      }
      if (d.chatLuong === 'KHONG_DAT' && !d.chatLuongNote?.trim()) {
        message.warning(`Chất lượng không đạt — nhập lý do: ${r.title}`);
        return false;
      }
    }
    if (!bcKetQua) {
      message.warning('Chưa đánh giá Kết quả báo cáo tổng kết');
      return false;
    }
    if (bcKetQua === 'KHONG_DAT' && !bcGhiChu.trim()) {
      message.warning('Báo cáo không đạt — nhập ghi chú chỉnh sửa');
      return false;
    }
    if (!ketLuan) {
      message.warning('Chưa chọn kết luận đề nghị');
      return false;
    }
    if (ketLuan === 'CAN_BO_SUNG' && !boSung.trim()) {
      message.warning('Nhập nội dung cần bổ sung, hoàn thiện');
      return false;
    }
    return true;
  };

  const nopPhieu = async () => {
    if (!kiemTra()) return;
    setDangGui(true);
    try {
      await luuPhieuCham(outlineId, {
        evalVersion: 2,
        submit: true,
        productRows: tatCaKeys.map((r) => {
          const d = dongMap[r.key];
          const note = [d?.soLuongNote, d?.chatLuongNote]
            .map((x) => (x || '').trim())
            .filter(Boolean)
            .join(' | ');
          return {
            key: r.key,
            name: r.title,
            soLuong: d?.soLuong,
            chatLuong: d?.chatLuong,
            soLuongNote: d?.soLuongNote || '',
            chatLuongNote: d?.chatLuongNote || '',
            note,
            actual: d?.soLuong || '',
            comment: note,
          };
        }),
        volumeComment: bcKetQua,
        qualityComment: bcGhiChu.trim(),
        reportComment: ketLuan,
        generalComment: JSON.stringify({
          supplementContent: boSung.trim(),
          otherRecommendation: kienNghi.trim(),
        }),
      });
      setDaNopPhieu(true);
      onXong?.('Đã nộp phiếu đánh giá');
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Nộp phiếu thất bại'));
    } finally {
      setDangGui(false);
    }
  };

  const don = hs?.dossier?.summaryFile as TepModule56 | null | undefined;
  const baoCao = hs?.dossier?.briefFile as TepModule56 | null | undefined;

  return (
    <div style={{ paddingBottom: 88 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ marginBottom: 4 }}>
            Phiếu đánh giá kết quả cuối kỳ
          </Title>
          <Text type="secondary">
            Dựa trên hồ sơ đề nghị CNNV đã nộp; đánh giá Số lượng / Chất lượng
            và kết luận kiến nghị.
          </Text>
        </div>

        {daNopPhieu && (
          <Alert
            type="success"
            showIcon
            message="Bạn đã nộp phiếu đánh giá"
            description="Phiếu đã khóa — chỉ xem."
          />
        )}

        <Card
          size="small"
          styles={{ body: { padding: '16px 20px' } }}
          style={{
            borderRadius: 12,
            border: '1px solid #d6e4ff',
            background:
              'linear-gradient(135deg, #f0f5ff 0%, #ffffff 55%, #fafafa 100%)',
          }}
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space>
              <FileTextOutlined style={{ color: '#1677ff' }} />
              <Text strong>
                a) Đơn đề nghị đánh giá kết quả thực hiện nhiệm vụ KHCN&ĐMST
              </Text>
            </Space>
            {don?.fileUrl ? (
              <a href={don.fileUrl} target="_blank" rel="noreferrer">
                {don.fileName || 'Tải đơn BM-05.01'}
              </a>
            ) : (
              <Text type="secondary">Chưa có file đơn</Text>
            )}
          </Space>
        </Card>

        <Card
          size="small"
          styles={{ body: { padding: '16px 20px' } }}
          style={{ borderRadius: 12, border: '1px solid #b7eb8f' }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space>
              <FileProtectOutlined style={{ color: '#52c41a' }} />
              <Text strong>
                b) Báo cáo tổng kết kết quả thực hiện nhiệm vụ (BM-05.02)
              </Text>
            </Space>
            {baoCao?.fileUrl ? (
              <a href={baoCao.fileUrl} target="_blank" rel="noreferrer">
                {baoCao.fileName || 'Tải báo cáo BM-05.02'}
              </a>
            ) : (
              <Text type="secondary">Chưa có file báo cáo</Text>
            )}
            <div>
              <Text strong>Kết quả: </Text>
              <RadioDatKd
                value={bcKetQua}
                disabled={khoa}
                lyDo={bcGhiChu}
                onChange={(v) => {
                  setBcKetQua(v);
                  if (v === 'DAT') setBcGhiChu('');
                }}
                onLyDoChange={setBcGhiChu}
              />
            </div>
          </Space>
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <ExperimentOutlined />
              <span>
                c) Danh mục sản phẩm, tài liệu và minh chứng kết quả thực hiện
              </span>
            </Space>
          }
          style={{ borderRadius: 12 }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Cột <Text strong>Số lượng</Text> / <Text strong>Chất lượng</Text>:
            chọn Đạt hoặc Không đạt. Chọn Không đạt → nhập lý do ngay bên dưới.
          </Paragraph>

          {!coDuLieu ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Thuyết minh chưa khai báo kết quả dự kiến."
            />
          ) : (
            <Collapse
              bordered={false}
              defaultActiveKey={['pub', 'app', 'tan', 'ip', 'trn']}
              style={{ background: 'transparent' }}
              items={[
                pubs.length
                  ? {
                      key: 'pub',
                      label: (
                        <Space>
                          <ReadOutlined style={{ color: '#1677ff' }} />
                          <Text strong>Công bố khoa học</Text>
                          {demDong(pubs.length)}
                        </Space>
                      ),
                      style: panelStyle(
                        '#91caff',
                        'linear-gradient(180deg, #e6f4ff 0%, #fff 48px)',
                      ),
                      children: (
                        <ProTable<OutlineExpectedPublication>
                          {...BANG_PROPS}
                          rowKey="id"
                          dataSource={pubs}
                          columns={cotPub}
                        />
                      ),
                    }
                  : null,
                apps.length
                  ? {
                      key: 'app',
                      label: (
                        <Space>
                          <SolutionOutlined style={{ color: '#13c2c2' }} />
                          <Text strong>
                            Nguyên lý, phương pháp, tiêu chuẩn, phần mềm & sản
                            phẩm khác
                          </Text>
                          {demDong(apps.length)}
                        </Space>
                      ),
                      style: panelStyle(
                        '#87e8de',
                        'linear-gradient(180deg, #e6fffb 0%, #fff 48px)',
                      ),
                      children: (
                        <ProTable<OutlineExpectedAppliedProduct>
                          {...BANG_PROPS}
                          rowKey="id"
                          dataSource={apps}
                          columns={cotApp}
                        />
                      ),
                    }
                  : null,
                tans.length
                  ? {
                      key: 'tan',
                      label: (
                        <Space>
                          <ExperimentOutlined style={{ color: '#fa8c16' }} />
                          <Text strong>Sản phẩm dạng mẫu / vật thể</Text>
                          {demDong(tans.length)}
                        </Space>
                      ),
                      style: panelStyle(
                        '#ffd591',
                        'linear-gradient(180deg, #fff7e6 0%, #fff 48px)',
                      ),
                      children: (
                        <ProTable<OutlineExpectedTangibleProduct>
                          {...BANG_PROPS}
                          rowKey="id"
                          dataSource={tans}
                          columns={cotTan}
                        />
                      ),
                    }
                  : null,
                ips.length
                  ? {
                      key: 'ip',
                      label: (
                        <Space>
                          <FileProtectOutlined style={{ color: '#722ed1' }} />
                          <Text strong>Sở hữu trí tuệ</Text>
                          {demDong(ips.length)}
                        </Space>
                      ),
                      style: panelStyle(
                        '#d3adf7',
                        'linear-gradient(180deg, #f9f0ff 0%, #fff 48px)',
                      ),
                      children: (
                        <ProTable<OutlineExpectedIpProduct>
                          {...BANG_PROPS}
                          rowKey="id"
                          dataSource={ips}
                          columns={cotIp}
                        />
                      ),
                    }
                  : null,
                trns.length
                  ? {
                      key: 'trn',
                      label: (
                        <Space>
                          <RocketOutlined style={{ color: '#eb2f96' }} />
                          <Text strong>Đào tạo sau đại học</Text>
                          {demDong(trns.length)}
                        </Space>
                      ),
                      style: panelStyle(
                        '#ffadd2',
                        'linear-gradient(180deg, #fff0f6 0%, #fff 48px)',
                      ),
                      children: (
                        <ProTable<OutlineExpectedTraining>
                          {...BANG_PROPS}
                          rowKey="id"
                          dataSource={trns}
                          columns={cotTrn}
                        />
                      ),
                    }
                  : null,
              ].filter(Boolean) as any}
            />
          )}
        </Card>

        <Card
          size="small"
          title="3. Kết luận và kiến nghị"
          style={{ borderRadius: 12, borderColor: '#91caff' }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Paragraph strong style={{ marginBottom: 8 }}>
                Kết luận đề nghị:
              </Paragraph>
              <Radio.Group
                disabled={khoa}
                value={ketLuan}
                onChange={(e) => setKetLuan(e.target.value)}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                }}
                options={[
                  { value: 'DAT_YEU_CAU', label: 'Đạt' },
                  {
                    value: 'CAN_BO_SUNG',
                    label:
                      'Cần bổ sung, hoàn thiện để đủ cơ sở kết luận',
                  },
                  { value: 'KHONG_DAT', label: 'Không đạt' },
                ]}
              />
            </div>
            <div>
              <Text strong>
                Nội dung cần bổ sung, hoàn thiện (nếu có):
              </Text>
              <TextArea
                rows={3}
                disabled={khoa}
                style={{ marginTop: 6 }}
                value={boSung}
                placeholder=""
                onChange={(e) => setBoSung(e.target.value)}
              />
            </div>
            <div>
              <Text strong>Kiến nghị khác (nếu có):</Text>
              <TextArea
                rows={3}
                disabled={khoa}
                style={{ marginTop: 6 }}
                value={kienNghi}
                placeholder=""
                onChange={(e) => setKienNghi(e.target.value)}
              />
            </div>
          </Space>
        </Card>
      </Space>

      {!khoa && (
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            marginTop: 24,
            padding: '12px 16px',
            borderTop: '1px solid #f0f0f0',
            background: 'rgba(255,255,255,0.96)',
            display: 'flex',
            justifyContent: 'flex-end',
            boxShadow: '0 -6px 16px rgba(0,0,0,0.04)',
            borderRadius: '12px 12px 0 0',
          }}
        >
          <Button
            type="primary"
            loading={dangGui}
            onClick={() => void nopPhieu()}
          >
            Nộp phiếu đánh giá
          </Button>
        </div>
      )}
    </div>
  );
}

export default FormDanhGiaThanhVienHd;
