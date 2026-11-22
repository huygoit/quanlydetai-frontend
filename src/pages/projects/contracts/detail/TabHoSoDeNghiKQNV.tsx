/**
 * Tab Hồ sơ đề nghị đánh giá KQNV:
 * a) Đơn BM-05.01 · b) Báo cáo BM-05.02 · c) Bảng KQDK giống thuyết minh + cột Minh chứng.
 */
import { HAN_FILE } from '@/constants/module56';
import { ChonTep } from '@/pages/projects/execution/ChonTep';
import type { VaiTro } from '@/pages/projects/execution/types';
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
  duyetHoSoCuoiKy,
  hoSoCuoiKy,
  luuHoSoDeNghiDanhGia,
  taiBaoCaoTongKet,
  taiDonDeNghiDanhGia,
  type TepModule56,
} from '@/services/api/module56';
import { uploadFileDon } from '@/services/api/fileUpload';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import {
  CheckCircleFilled,
  DeleteOutlined,
  DownloadOutlined,
  ExperimentOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  LinkOutlined,
  ReadOutlined,
  RocketOutlined,
  RollbackOutlined,
  SendOutlined,
  SolutionOutlined,
  TeamOutlined,
  UploadOutlined,
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
  Modal,
  Space,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';

const { TextArea } = Input;
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from 'react';

const { Text, Title, Paragraph } = Typography;

type MinhChung = {
  key: string;
  title: string;
  file?: TepModule56 | null;
  link: string;
};

type Props = {
  outlineId: number;
  outline: ProjectOutline | null;
  vaiTro: VaiTro;
  onXong?: (t: string) => void;
  /** PKH mở popup thành lập HĐ (sau khi duyệt đủ → DGCK_HOP_HD) */
  onThanhLapHoiDong?: () => void;
};

const PHAM_VI: Record<string, string> = {
  DOMESTIC: 'Trong nước',
  INTERNATIONAL: 'Quốc tế',
};

function demDong(n: number) {
  return n > 0 ? <Tag>{n}</Tag> : null;
}

/** Header / ô dài → xuống dòng bình thường (không cắt …) */
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
  tableStyle: { whiteSpace: 'normal' as const },
};

function tieuDeWrap(text: string) {
  return <div style={STYLE_WRAP}>{text}</div>;
}

function oWrap(v: unknown) {
  const s = v == null ? '' : String(v).trim();
  return <div style={STYLE_WRAP}>{s || '—'}</div>;
}

function cotMinhChung<T extends { id: string }>(opts: {
  keyOf: (row: T) => string;
  titleOf: (row: T) => string;
  map: Record<string, MinhChung>;
  setMap: Dispatch<SetStateAction<Record<string, MinhChung>>>;
  editable: boolean;
}): ProColumns<T> {
  const { keyOf, titleOf, map, setMap, editable } = opts;
  return {
    title: tieuDeWrap('Minh chứng'),
    key: 'minh_chung',
    width: 280,
    fixed: 'right',
    onHeaderCell: () => ({ style: STYLE_WRAP }),
    onCell: () => ({ style: { ...STYLE_WRAP, verticalAlign: 'top' } }),
    render: (_, row) => {
      const k = keyOf(row);
      const mc = map[k] || {
        key: k,
        title: titleOf(row),
        link: '',
        file: null,
      };
      const coMc = !!(mc.file?.fileUrl || mc.link?.trim());
      return (
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <Space size={6} wrap>
            {coMc ? (
              <CheckCircleFilled
                style={{ color: '#52c41a', fontSize: 16 }}
                title="Đã có minh chứng"
              />
            ) : (
              <Tag style={{ margin: 0 }}>Chưa có</Tag>
            )}
            {mc.file?.fileUrl ? (
              <a href={mc.file.fileUrl} target="_blank" rel="noreferrer">
                {mc.file.fileName || 'File'}
              </a>
            ) : null}
          </Space>
          {editable ? (
            <>
              <ChonTep
                maxBytes={HAN_FILE.tomTat}
                nhan={mc.file?.fileUrl ? 'Đổi file' : 'Chọn file'}
                onCo={(t) =>
                  setMap((s) => ({
                    ...s,
                    [k]: {
                      key: k,
                      title: titleOf(row),
                      link: s[k]?.link || '',
                      file: t,
                    },
                  }))
                }
              />
              <Input
                size="small"
                prefix={<LinkOutlined />}
                placeholder="Hoặc nhập URL tài liệu"
                value={mc.link}
                onChange={(e) =>
                  setMap((s) => ({
                    ...s,
                    [k]: {
                      key: k,
                      title: titleOf(row),
                      file: s[k]?.file || null,
                      link: e.target.value,
                    },
                  }))
                }
              />
            </>
          ) : mc.link?.trim() ? (
            <a href={mc.link} target="_blank" rel="noreferrer">
              {mc.link}
            </a>
          ) : null}
        </Space>
      );
    },
  };
}

export function TabHoSoDeNghiKQNV({
  outlineId,
  outline,
  vaiTro,
  onXong,
  onThanhLapHoiDong,
}: Props) {
  const er = outline?.expectedResults || EMPTY_EXPECTED_RESULTS;
  const [donDeNghi, setDonDeNghi] = useState<TepModule56 | null>(null);
  const [baoCao, setBaoCao] = useState<TepModule56 | null>(null);
  const [mcMap, setMcMap] = useState<Record<string, MinhChung>>({});
  const [dangTaiDon, setDangTaiDon] = useState(false);
  const [dangTaiBc, setDangTaiBc] = useState(false);
  const [dangUploadDon, setDangUploadDon] = useState(false);
  const [dangUploadBc, setDangUploadBc] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [daNop, setDaNop] = useState(false);
  const [pkhNote, setPkhNote] = useState<string | null>(null);
  const [stTrienKhai, setStTrienKhai] = useState<string | null>(
    outline?.executionStatus || null,
  );
  const [moBs, setMoBs] = useState(false);
  const [lyDoBs, setLyDoBs] = useState('');
  const [dangPkh, setDangPkh] = useState(false);

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
    setStTrienKhai(outline?.executionStatus || null);
  }, [outline?.executionStatus]);

  useEffect(() => {
    if (!outlineId) return;
    hoSoCuoiKy(outlineId)
      .then((res) => {
        const hs = res.data;
        setDaNop(!!hs?.dossier?.submittedAt);
        setPkhNote(hs?.dossier?.pkhNote || null);
        if (hs?.executionStatus) setStTrienKhai(hs.executionStatus);
        const summary = hs?.dossier?.summaryFile;
        if (summary?.fileUrl) {
          setDonDeNghi({
            fileName: summary.fileName || 'BM-05.01',
            fileUrl: summary.fileUrl,
            fileSize: summary.fileSize || 0,
          });
        }
        const brief = hs?.dossier?.briefFile;
        if (brief?.fileUrl) {
          setBaoCao({
            fileName: brief.fileName || 'BM-05.02',
            fileUrl: brief.fileUrl,
            fileSize: brief.fileSize || 0,
          });
        }
        const products = hs?.dossier?.products || [];
        if (!products.length) return;
        setMcMap((cu) => {
          const next = { ...cu };
          for (const row of tatCaKeys) {
            const hit = products.find((p) => p.name === row.title);
            if (!hit) continue;
            next[row.key] = {
              key: row.key,
              title: row.title,
              link: hit.link || '',
              file: hit.fileUrl
                ? {
                    fileName: hit.name,
                    fileUrl: hit.fileUrl,
                    fileSize: 0,
                  }
                : null,
            };
          }
          return next;
        });
      })
      .catch(() => undefined);
  }, [outlineId, tatCaKeys]);

  const choPkh = stTrienKhai === 'DGCK_CHO_PKH';
  const canBoSungLai =
    vaiTro.canCnnv &&
    (!daNop || stTrienKhai === 'DGCK_BS' || stTrienKhai === 'DGCK_DRAFT');
  const coQuyenNop = canBoSungLai;
  const thieuMinhChung = tatCaKeys.filter((r) => {
    const mc = mcMap[r.key];
    return !(mc?.file?.fileUrl || mc?.link?.trim());
  });
  const daCoMc = tatCaKeys.length - thieuMinhChung.length;

  const bodyLuu = (submit: boolean) => {
    const products = tatCaKeys.map((r) => {
      const mc = mcMap[r.key];
      return {
        name: r.title,
        fileUrl: mc?.file?.fileUrl || null,
        link: mc?.link?.trim() || null,
      };
    });
    return {
      submit,
      donFile: donDeNghi,
      reportFile: baoCao,
      products,
      evidences: tatCaKeys.map((r) => {
        const mc = mcMap[r.key];
        return {
          key: r.key,
          title: r.title,
          fileUrl: mc?.file?.fileUrl || null,
          fileName: mc?.file?.fileName || null,
          link: mc?.link?.trim() || null,
        };
      }),
    };
  };

  const taiDon = async () => {
    setDangTaiDon(true);
    try {
      await taiDonDeNghiDanhGia(
        outlineId,
        `BM-05.01_Don_de_nghi_${outline?.code || outlineId}.docx`,
      );
      message.success('Đã tải đơn đề nghị (BM-05.01)');
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Tải đơn thất bại'));
    } finally {
      setDangTaiDon(false);
    }
  };

  const taiBaoCao = async () => {
    setDangTaiBc(true);
    try {
      await taiBaoCaoTongKet(
        outlineId,
        `BM-05.02_Bao_cao_tong_ket_${outline?.code || outlineId}.docx`,
      );
      message.success('Đã tải báo cáo tổng kết (BM-05.02)');
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Tải báo cáo thất bại'));
    } finally {
      setDangTaiBc(false);
    }
  };

  const uploadVaLuu = async (
    file: File,
    loai: 'don' | 'baocao',
  ) => {
    if (file.size > HAN_FILE.tomTat) {
      message.error(
        `File vượt ${Math.round(HAN_FILE.tomTat / 1024 / 1024)}MB`,
      );
      return Upload.LIST_IGNORE;
    }
    const setLoading = loai === 'don' ? setDangUploadDon : setDangUploadBc;
    setLoading(true);
    try {
      const up = await uploadFileDon(file, { folder: 'module56' });
      const tep: TepModule56 = {
        fileName: file.name,
        fileUrl: up.url,
        fileSize: file.size,
      };
      if (loai === 'don') setDonDeNghi(tep);
      else setBaoCao(tep);
      await luuHoSoDeNghiDanhGia(outlineId, {
        ...bodyLuu(false),
        donFile: loai === 'don' ? tep : donDeNghi,
        reportFile: loai === 'baocao' ? tep : baoCao,
      });
      message.success(
        loai === 'don'
          ? `Đã tải lên đơn đề nghị: ${file.name}`
          : `Đã tải lên báo cáo: ${file.name}`,
      );
    } catch (e) {
      message.error(
        layThongBaoLoi(
          e,
          loai === 'don' ? 'Tải lên đơn thất bại' : 'Tải lên báo cáo thất bại',
        ),
      );
    } finally {
      setLoading(false);
    }
    return Upload.LIST_IGNORE;
  };

  const luuNhap = async () => {
    setDangGui(true);
    try {
      await luuHoSoDeNghiDanhGia(outlineId, bodyLuu(false));
      onXong?.('Đã lưu nháp hồ sơ đề nghị');
    } catch (e) {
      message.error(layThongBaoLoi(e));
    } finally {
      setDangGui(false);
    }
  };

  const nopHoSo = () => {
    if (!tatCaKeys.length) {
      message.warning('Thuyết minh chưa có kết quả dự kiến để nộp minh chứng.');
      return;
    }
    if (thieuMinhChung.length) {
      message.warning(
        `Còn ${thieuMinhChung.length} dòng chưa có minh chứng (file hoặc URL).`,
      );
      return;
    }
    Modal.confirm({
      title: 'Nộp hồ sơ đánh giá KQNV?',
      content:
        'Sau khi nộp, PKH sẽ tiếp nhận hồ sơ đề nghị đánh giá kết quả nhiệm vụ.',
      okText: 'Nộp hồ sơ',
      cancelText: 'Hủy',
      onOk: async () => {
        setDangGui(true);
        try {
          await luuHoSoDeNghiDanhGia(outlineId, bodyLuu(true));
          setDaNop(true);
          setStTrienKhai('DGCK_CHO_PKH');
          onXong?.('Đã nộp hồ sơ đề nghị đánh giá KQNV');
        } catch (e) {
          message.error(layThongBaoLoi(e));
          return Promise.reject(e);
        } finally {
          setDangGui(false);
        }
      },
    });
  };

  /** PKH: đủ → chuyển họp HĐ rồi mở popup thành lập */
  const pkhThanhLapHoiDong = async () => {
    setDangPkh(true);
    try {
      await duyetHoSoCuoiKy(outlineId, {
        accept: true,
        briefPagesOk: true,
      });
      setStTrienKhai('DGCK_HOP_HD');
      onXong?.('Đã chuyển họp hội đồng');
      onThanhLapHoiDong?.();
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Duyệt hồ sơ thất bại'));
    } finally {
      setDangPkh(false);
    }
  };

  /** PKH: thiếu → trả bổ sung + thông báo CNNV */
  const pkhYeuCauBoSung = async () => {
    const note = lyDoBs.trim();
    if (!note) {
      message.warning('Nhập nội dung cần bổ sung');
      return;
    }
    setDangPkh(true);
    try {
      await duyetHoSoCuoiKy(outlineId, {
        accept: false,
        briefPagesOk: false,
        note,
      });
      setDaNop(false);
      setPkhNote(note);
      setStTrienKhai('DGCK_BS');
      setMoBs(false);
      setLyDoBs('');
      onXong?.('Đã yêu cầu bổ sung — đã thông báo chủ nhiệm');
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Yêu cầu bổ sung thất bại'));
    } finally {
      setDangPkh(false);
    }
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

  const cotPub: ProColumns<OutlineExpectedPublication>[] = useMemo(
    () => [
      {
        title: tieuDeWrap('STT'),
        width: 56,
        onHeaderCell: () => ({ style: STYLE_WRAP }),
        render: (_, __, i) => i + 1,
      },
      {
        title: tieuDeWrap('Phạm vi'),
        dataIndex: 'category',
        width: 110,
        onHeaderCell: () => ({ style: STYLE_WRAP }),
        onCell: () => ({ style: { ...STYLE_WRAP, verticalAlign: 'top' } }),
        render: (v) => oWrap(PHAM_VI[String(v)] || v),
      },
      cotVanBan('Bài báo; sách chuyên khảo và sản phẩm khác', 'content'),
      cotVanBan('Số lượng', 'quantity', 90),
      cotVanBan('Yêu cầu khoa học cần đạt', 'scienceRequirement'),
      cotVanBan('Ghi chú', 'note', 120),
      cotMinhChung<OutlineExpectedPublication>({
        keyOf: (r) => `pub:${r.id}`,
        titleOf: (r) => r.content.trim(),
        map: mcMap,
        setMap: setMcMap,
        editable: coQuyenNop,
      }),
    ],
    [mcMap, coQuyenNop],
  );

  const cotApp: ProColumns<OutlineExpectedAppliedProduct>[] = useMemo(
    () => [
      {
        title: tieuDeWrap('STT'),
        width: 56,
        onHeaderCell: () => ({ style: STYLE_WRAP }),
        render: (_, __, i) => i + 1,
      },
      cotVanBan('Tên sản phẩm', 'name'),
      cotVanBan('Yêu cầu khoa học cần đạt', 'scienceRequirement'),
      cotVanBan('Ghi chú', 'note', 120),
      cotMinhChung<OutlineExpectedAppliedProduct>({
        keyOf: (r) => `app:${r.id}`,
        titleOf: (r) => r.name.trim(),
        map: mcMap,
        setMap: setMcMap,
        editable: coQuyenNop,
      }),
    ],
    [mcMap, coQuyenNop],
  );

  const cotTan: ProColumns<OutlineExpectedTangibleProduct>[] = useMemo(
    () => [
      {
        title: tieuDeWrap('STT'),
        width: 56,
        onHeaderCell: () => ({ style: STYLE_WRAP }),
        render: (_, __, i) => i + 1,
      },
      cotVanBan('Tên sản phẩm & chỉ tiêu chất lượng chủ yếu', 'name', 200),
      cotVanBan('Đơn vị đo', 'unit', 90),
      cotVanBan('Mức CL cần đạt', 'qualityRequired', 120),
      cotVanBan('Mẫu tương tự (trong nước)', 'qualitySampleDomestic', 140),
      cotVanBan('Mẫu tương tự (thế giới)', 'qualitySampleWorld', 140),
      cotVanBan('Số lượng / quy mô', 'quantityScale', 120),
      cotMinhChung<OutlineExpectedTangibleProduct>({
        keyOf: (r) => `tan:${r.id}`,
        titleOf: (r) => r.name.trim(),
        map: mcMap,
        setMap: setMcMap,
        editable: coQuyenNop,
      }),
    ],
    [mcMap, coQuyenNop],
  );

  const cotIp: ProColumns<OutlineExpectedIpProduct>[] = useMemo(
    () => [
      {
        title: tieuDeWrap('STT'),
        width: 56,
        onHeaderCell: () => ({ style: STYLE_WRAP }),
        render: (_, __, i) => i + 1,
      },
      cotVanBan('Tên sản phẩm', 'name'),
      cotVanBan('Yêu cầu khoa học cần đạt', 'scienceRequirement'),
      cotVanBan('Ghi chú', 'note', 120),
      cotMinhChung<OutlineExpectedIpProduct>({
        keyOf: (r) => `ip:${r.id}`,
        titleOf: (r) => r.name.trim(),
        map: mcMap,
        setMap: setMcMap,
        editable: coQuyenNop,
      }),
    ],
    [mcMap, coQuyenNop],
  );

  const cotTrn: ProColumns<OutlineExpectedTraining>[] = useMemo(
    () => [
      {
        title: tieuDeWrap('STT'),
        width: 56,
        onHeaderCell: () => ({ style: STYLE_WRAP }),
        render: (_, __, i) => i + 1,
      },
      cotVanBan('Cấp đào tạo', 'level', 140),
      cotVanBan('Số lượng', 'quantity', 90),
      cotVanBan('Chuyên ngành đào tạo', 'major'),
      cotVanBan('Ghi chú', 'note', 120),
      cotMinhChung<OutlineExpectedTraining>({
        keyOf: (r) => `trn:${r.id}`,
        titleOf: (r) =>
          [r.level?.trim(), r.major?.trim(), r.quantity?.trim()]
            .filter(Boolean)
            .join(' — '),
        map: mcMap,
        setMap: setMcMap,
        editable: coQuyenNop,
      }),
    ],
    [mcMap, coQuyenNop],
  );

  const panelStyle = (border: string, bg: string) => ({
    marginBottom: 12,
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: bg,
    overflow: 'hidden' as const,
  });

  const coDuLieu =
    pubs.length + apps.length + tans.length + ips.length + trns.length > 0;

  return (
    <div style={{ paddingBottom: 96 }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ marginBottom: 4 }}>
            Hồ sơ đề nghị đánh giá kết quả nhiệm vụ
          </Title>
          <Text type="secondary">
            Chuẩn bị đơn BM-05.01, báo cáo BM-05.02 và minh chứng theo kết quả dự
            kiến trên thuyết minh.
          </Text>
        </div>

        {stTrienKhai === 'DGCK_BS' && (
          <Alert
            type="warning"
            showIcon
            message="PKH yêu cầu bổ sung hồ sơ"
            description={
              pkhNote?.trim() ||
              'Vui lòng bổ sung theo yêu cầu rồi nộp lại.'
            }
          />
        )}
        {choPkh && (
          <Alert
            type="info"
            showIcon
            message="Hồ sơ đang chờ PKH kiểm tra"
            description="Đủ → Thành lập hội đồng đánh giá cuối kỳ. Thiếu → Yêu cầu bổ sung."
          />
        )}
        {daNop && !choPkh && stTrienKhai !== 'DGCK_BS' && (
          <Alert
            type="success"
            showIcon
            message="Đã nộp hồ sơ đề nghị đánh giá KQNV"
            description="PKH đang tiếp nhận / đã chuyển bước tiếp theo. Tab này chuyển sang chế độ xem."
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
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Space
              align="start"
              style={{ width: '100%', justifyContent: 'space-between' }}
              wrap
            >
              <Space align="start" size={12}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#1677ff',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 18 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 15 }}>
                    a) Đơn đề nghị đánh giá kết quả thực hiện nhiệm vụ KHCN&ĐMST
                  </Text>
                  <Paragraph
                    type="secondary"
                    style={{ margin: '6px 0 0', maxWidth: 640 }}
                  >
                    1) Tải mẫu hệ thống đã đổ sẵn → 2) Ký / xác nhận → 3) Tải lên
                    file đơn hoàn chỉnh (≤{' '}
                    {Math.round(HAN_FILE.tomTat / 1024 / 1024)}MB).
                  </Paragraph>
                </div>
              </Space>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                loading={dangTaiDon}
                onClick={() => void taiDon()}
              >
                Tải mẫu đơn đề nghị
              </Button>
            </Space>

            {donDeNghi?.fileUrl ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleFilled />}
                message={
                  <Space wrap>
                    <span>Đã có file đơn đề nghị hoàn chỉnh:</span>
                    <a
                      href={donDeNghi.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {donDeNghi.fileName}
                    </a>
                    {coQuyenNop && (
                      <>
                        <Upload
                          showUploadList={false}
                          maxCount={1}
                          disabled={dangUploadDon}
                          beforeUpload={(f) => {
                            void uploadVaLuu(f as File, 'don');
                            return Upload.LIST_IGNORE;
                          }}
                        >
                          <Button size="small" loading={dangUploadDon}>
                            Đổi file
                          </Button>
                        </Upload>
                        <Button
                          size="small"
                          danger
                          type="link"
                          icon={<DeleteOutlined />}
                          onClick={() => setDonDeNghi(null)}
                        >
                          Xóa
                        </Button>
                      </>
                    )}
                  </Space>
                }
              />
            ) : coQuyenNop ? (
              <Upload.Dragger
                multiple={false}
                showUploadList={false}
                disabled={dangUploadDon}
                beforeUpload={(file) => {
                  void uploadVaLuu(file as File, 'don');
                  return Upload.LIST_IGNORE;
                }}
                style={{ background: '#fff', borderRadius: 10 }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ color: '#1677ff' }} />
                </p>
                <p className="ant-upload-text">
                  Kéo thả hoặc bấm để tải lên đơn đề nghị hoàn chỉnh
                </p>
                <p className="ant-upload-hint">
                  PDF / Word · tối đa{' '}
                  {Math.round(HAN_FILE.tomTat / 1024 / 1024)}MB
                </p>
              </Upload.Dragger>
            ) : (
              <Alert
                type="info"
                showIcon
                message={
                  daNop
                    ? 'Hồ sơ đã nộp — chỉ xem file đơn (nếu có).'
                    : 'Chỉ chủ nhiệm được tải lên đơn đề nghị hoàn chỉnh.'
                }
              />
            )}
          </Space>
        </Card>

        <Card
          size="small"
          styles={{ body: { padding: '16px 20px' } }}
          style={{
            borderRadius: 12,
            border: '1px solid #b7eb8f',
            background:
              'linear-gradient(135deg, #f6ffed 0%, #ffffff 55%, #fafafa 100%)',
          }}
        >
          <Space
            direction="vertical"
            size={12}
            style={{ width: '100%' }}
          >
            <Space
              align="start"
              style={{ width: '100%', justifyContent: 'space-between' }}
              wrap
            >
              <Space align="start" size={12}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#52c41a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <UploadOutlined style={{ fontSize: 18 }} />
                </div>
                <div>
                  <Text strong style={{ fontSize: 15 }}>
                    b) Báo cáo tổng kết kết quả thực hiện nhiệm vụ (BM-05.02)
                  </Text>
                  <Paragraph
                    type="secondary"
                    style={{ margin: '6px 0 0', maxWidth: 640 }}
                  >
                    1) Tải mẫu hệ thống đã đổ sẵn → 2) Hoàn thiện nội dung / ký →
                    3) Tải lên file báo cáo hoàn chỉnh (≤{' '}
                    {Math.round(HAN_FILE.tomTat / 1024 / 1024)}MB).
                  </Paragraph>
                </div>
              </Space>
              <Button
                type="primary"
                ghost
                icon={<DownloadOutlined />}
                loading={dangTaiBc}
                onClick={() => void taiBaoCao()}
              >
                Tải mẫu báo cáo
              </Button>
            </Space>

            {baoCao?.fileUrl ? (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleFilled />}
                message={
                  <Space wrap>
                    <span>Đã có file báo cáo hoàn chỉnh:</span>
                    <a href={baoCao.fileUrl} target="_blank" rel="noreferrer">
                      {baoCao.fileName}
                    </a>
                    {coQuyenNop && (
                      <>
                        <Upload
                          showUploadList={false}
                          maxCount={1}
                          disabled={dangUploadBc}
                          beforeUpload={(f) => {
                            void uploadVaLuu(f as File, 'baocao');
                            return Upload.LIST_IGNORE;
                          }}
                        >
                          <Button size="small" loading={dangUploadBc}>
                            Đổi file
                          </Button>
                        </Upload>
                        <Button
                          size="small"
                          danger
                          type="link"
                          icon={<DeleteOutlined />}
                          onClick={() => setBaoCao(null)}
                        >
                          Xóa
                        </Button>
                      </>
                    )}
                  </Space>
                }
              />
            ) : coQuyenNop ? (
              <Upload.Dragger
                multiple={false}
                showUploadList={false}
                disabled={dangUploadBc}
                beforeUpload={(file) => {
                  void uploadVaLuu(file as File, 'baocao');
                  return Upload.LIST_IGNORE;
                }}
                style={{ background: '#fff', borderRadius: 10 }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined style={{ color: '#52c41a' }} />
                </p>
                <p className="ant-upload-text">
                  Kéo thả hoặc bấm để tải lên báo cáo tổng kết hoàn chỉnh
                </p>
                <p className="ant-upload-hint">
                  PDF / Word · tối đa{' '}
                  {Math.round(HAN_FILE.tomTat / 1024 / 1024)}MB
                </p>
              </Upload.Dragger>
            ) : (
              <Alert
                type="info"
                showIcon
                message={
                  daNop
                    ? 'Hồ sơ đã nộp — chỉ xem file báo cáo (nếu có).'
                    : 'Chỉ chủ nhiệm được tải lên báo cáo hoàn chỉnh.'
                }
              />
            )}
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
          extra={
            tatCaKeys.length ? (
              <Tag color={thieuMinhChung.length ? 'warning' : 'success'}>
                {daCoMc}/{tatCaKeys.length} đã có minh chứng
              </Tag>
            ) : null
          }
          style={{ borderRadius: 12 }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Giữ nguyên cột như thuyết minh. Cột <Text strong>Minh chứng</Text>:
            chọn file (≤ {Math.round(HAN_FILE.tomTat / 1024 / 1024)}MB) hoặc
            nhập URL. Có minh chứng sẽ hiện{' '}
            <CheckCircleFilled style={{ color: '#52c41a' }} />.
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
                          scroll={{ x: 1100 }}
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
                          scroll={{ x: 960 }}
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
                          scroll={{ x: 1200 }}
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
                          scroll={{ x: 960 }}
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
                          scroll={{ x: 960 }}
                        />
                      ),
                    }
                  : null,
              ].filter(Boolean) as any}
            />
          )}
        </Card>
      </Space>

      <div
        style={{
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
          marginTop: 24,
          padding: '12px 16px',
          borderTop: '1px solid #f0f0f0',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(6px)',
          borderRadius: '12px 12px 0 0',
          boxShadow: '0 -6px 16px rgba(0,0,0,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          {choPkh && vaiTro.canManage
            ? 'PKH kiểm tra: đủ → thành lập HĐ · thiếu → yêu cầu bổ sung'
            : stTrienKhai === 'DGCK_BS'
              ? 'Cần bổ sung theo yêu cầu PKH rồi nộp lại'
              : daNop
                ? 'Hồ sơ đã nộp'
                : thieuMinhChung.length
                  ? `Còn ${thieuMinhChung.length} dòng chưa có minh chứng`
                  : tatCaKeys.length
                    ? 'Đủ minh chứng — có thể nộp hồ sơ'
                    : 'Chưa có kết quả dự kiến trên thuyết minh'}
        </Text>
        <Space wrap>
          {choPkh && vaiTro.canManage ? (
            <>
              <Button
                danger
                icon={<RollbackOutlined />}
                loading={dangPkh}
                onClick={() => {
                  setLyDoBs(pkhNote || '');
                  setMoBs(true);
                }}
              >
                Yêu cầu bổ sung
              </Button>
              <Button
                type="primary"
                icon={<TeamOutlined />}
                loading={dangPkh}
                onClick={() => void pkhThanhLapHoiDong()}
              >
                Thành lập hội đồng đánh giá cuối kỳ
              </Button>
            </>
          ) : vaiTro.canCnnv ? (
            <>
              {coQuyenNop && (
                <Button loading={dangGui} onClick={() => void luuNhap()}>
                  Lưu nháp
                </Button>
              )}
              {coQuyenNop && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={dangGui}
                  onClick={nopHoSo}
                >
                  {stTrienKhai === 'DGCK_BS'
                    ? 'Nộp lại hồ sơ đánh giá KQNV'
                    : 'Nộp hồ sơ đánh giá KQNV'}
                </Button>
              )}
            </>
          ) : null}
        </Space>
      </div>

      <Modal
        title="Yêu cầu bổ sung hồ sơ đề nghị đánh giá"
        open={moBs}
        onCancel={() => setMoBs(false)}
        okText="Gửi yêu cầu"
        okButtonProps={{ danger: true, loading: dangPkh }}
        cancelText="Hủy"
        onOk={() => void pkhYeuCauBoSung()}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chủ nhiệm nhiệm vụ sẽ nhận chuông + email kèm nội dung cần bổ sung."
        />
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Nội dung cần bổ sung
        </Text>
        <TextArea
          rows={4}
          value={lyDoBs}
          onChange={(e) => setLyDoBs(e.target.value)}
          placeholder="Ví dụ: thiếu minh chứng sản phẩm A; báo cáo BM-05.02 chưa ký…"
        />
      </Modal>
    </div>
  );
}

export default TabHoSoDeNghiKQNV;
