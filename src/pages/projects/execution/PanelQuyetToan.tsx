/**
 * Panel Quyết toán kinh phí — CNNV → PKH → KH-TC.
 * Mỗi khoản chi có cột upload chứng từ scan riêng; bảng tổng hợp Excel/PDF riêng.
 */
import { HAN_FILE, MUC_CHI, nhanMuc } from '@/constants/module56';
import {
  luuQuyetToan,
  pkhQuyetToan,
  tcQuyetToan,
  xacNhanChenhLech,
  type HoSoCuoiKy,
  type TepModule56,
} from '@/services/api/module56';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChonTep } from './ChonTep';
import type { VaiTro } from './types';

const NHAN_QT: Record<string, { text: string; color: string }> = {
  QT_DRAFT: { text: 'Nháp', color: 'default' },
  QT_CHO_PKH: { text: 'Chờ PKH&HTQT', color: 'processing' },
  QT_CHO_TC: { text: 'Chờ KH-TC', color: 'warning' },
  QT_BS: { text: 'Cần bổ sung', color: 'error' },
  QT_DONE: { text: 'Đã quyết toán', color: 'success' },
};

function bao(e: unknown) {
  const x = e as { data?: { message?: string }; message?: string };
  return x?.data?.message || x?.message || 'Thất bại';
}

function nhapLyDo(tieuDe: string): Promise<string | null> {
  let text = '';
  return new Promise((resolve) => {
    Modal.confirm({
      title: tieuDe,
      content: (
        <Input.TextArea
          rows={3}
          autoFocus
          placeholder="Nhập lý do…"
          onChange={(e) => {
            text = e.target.value;
          }}
        />
      ),
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: () => {
        if (!text.trim()) {
          message.warning('Cần nhập lý do');
          return Promise.reject();
        }
        resolve(text.trim());
      },
      onCancel: () => resolve(null),
    });
  });
}

type Props = {
  outlineId: number;
  hs: HoSoCuoiKy;
  vaiTro: VaiTro;
  onTai: () => void | Promise<void>;
};

export function PanelQuyetToan({ outlineId, hs, vaiTro, onTai }: Props) {
  const st = hs.settlement.status;
  const nhan = st ? NHAN_QT[st] || { text: st, color: 'default' } : null;
  const coTheSua =
    vaiTro.canCnnv && (!st || st === 'QT_DRAFT' || st === 'QT_BS');

  const [khai, setKhai] = useState<Record<string, number>>({});
  const [chungTu, setChungTu] = useState<Record<string, TepModule56[]>>({});
  const [bangTongHop, setBangTongHop] = useState<TepModule56 | null>(null);
  const [dangLuu, setDangLuu] = useState(false);
  const ngayTcRef = useRef<Dayjs>(dayjs());

  useEffect(() => {
    const map: Record<string, number> = {};
    const ct: Record<string, TepModule56[]> = {};
    MUC_CHI.forEach((m) => {
      const daKhai = hs.settlement.lines.find((l) => l.code === m.code);
      const spent =
        hs.finance.lines.find((l) => l.code === m.code)?.spent || 0;
      map[m.code] = daKhai ? Number(daKhai.declaredAmount || 0) : spent;
      ct[m.code] = daKhai?.evidenceFiles?.length
        ? [...daKhai.evidenceFiles]
        : [];
    });
    setKhai(map);
    setChungTu(ct);
    // files[] = chỉ bảng tổng hợp (không còn lẫn chứng từ chung)
    setBangTongHop((hs.settlement.files || [])[0] || null);
  }, [hs.settlement.lines, hs.settlement.files, hs.finance.lines]);

  const tongHop = useMemo(() => {
    const lines = hs.finance.lines || [];
    const theoHd = lines.reduce((s, l) => s + Number(l.planned || 0), 0);
    const daGiaiNgan = lines.reduce((s, l) => s + Number(l.advanced || 0), 0);
    const daChi = lines.reduce((s, l) => s + Number(l.spent || 0), 0);
    const tongKhai = MUC_CHI.reduce(
      (s, m) => s + Number(khai[m.code] || 0),
      0,
    );
    return {
      theoHd,
      daGiaiNgan,
      daChi,
      tonDu: theoHd - daGiaiNgan,
      tongKhai,
    };
  }, [hs.finance.lines, khai]);

  const coChenh = MUC_CHI.some((m) => {
    const spent =
      hs.finance.lines.find((l) => l.code === m.code)?.spent || 0;
    return Number(khai[m.code] || 0) !== spent;
  });

  const themChungTu = (code: string, tep: TepModule56) => {
    setChungTu((s) => ({
      ...s,
      [code]: [...(s[code] || []), tep],
    }));
  };

  const xoaChungTu = (code: string, fileUrl: string) => {
    setChungTu((s) => ({
      ...s,
      [code]: (s[code] || []).filter((t) => t.fileUrl !== fileUrl),
    }));
  };

  const dongBang = MUC_CHI.map((m, i) => {
    const fin = hs.finance.lines.find((l) => l.code === m.code);
    const spent = Number(fin?.spent || 0);
    const soKhai = Number(khai[m.code] || 0);
    return {
      key: m.code,
      stt: i + 1,
      code: m.code,
      label: nhanMuc(m.code),
      planned: Number(fin?.planned || 0),
      advanced: Number(fin?.advanced || 0),
      spent,
      khai: soKhai,
      chenh: soKhai !== spent,
      files: chungTu[m.code] || [],
    };
  });

  const nop = async (submit: boolean) => {
    if (submit) {
      if (!bangTongHop) {
        message.warning('Cần upload bảng quyết toán tổng hợp (Excel/PDF)');
        return;
      }
      const thieu = MUC_CHI.filter(
        (m) =>
          Number(khai[m.code] || 0) > 0 && !(chungTu[m.code] || []).length,
      );
      if (thieu.length) {
        message.warning(
          `Chưa có chứng từ cho: ${thieu
            .slice(0, 3)
            .map((m) => nhanMuc(m.code))
            .join(', ')}${thieu.length > 3 ? '…' : ''}`,
        );
        return;
      }
    }
    setDangLuu(true);
    try {
      await luuQuyetToan(outlineId, {
        submit,
        lines: MUC_CHI.map((m) => ({
          code: m.code,
          declaredAmount: Number(khai[m.code] || 0),
          evidenceFiles: chungTu[m.code] || [],
        })),
        files: bangTongHop ? [bangTongHop] : [],
      });
      message.success(submit ? 'Đã nộp hồ sơ quyết toán' : 'Đã lưu nháp');
      await onTai();
    } catch (e) {
      message.error(bao(e));
    } finally {
      setDangLuu(false);
    }
  };

  const pkhXuLy = async (accept: boolean) => {
    if (!accept) {
      const note = await nhapLyDo('Lý do trả bổ sung');
      if (!note) return;
      setDangLuu(true);
      try {
        await pkhQuyetToan(outlineId, { accept: false, note });
        message.success('Đã trả CNNV bổ sung');
        await onTai();
      } catch (e) {
        message.error(bao(e));
      } finally {
        setDangLuu(false);
      }
      return;
    }
    if (coChenh && !hs.settlement.varianceAck) {
      message.warning('Cần xác nhận chênh lệch trước khi chuyển KH-TC');
      return;
    }
    Modal.confirm({
      title: 'Chuyển KH-TC thẩm định?',
      okText: 'Chuyển',
      cancelText: 'Hủy',
      onOk: async () => {
        setDangLuu(true);
        try {
          await pkhQuyetToan(outlineId, { accept: true });
          message.success('Đã chuyển KH-TC');
          await onTai();
        } catch (e) {
          message.error(bao(e));
          throw e;
        } finally {
          setDangLuu(false);
        }
      },
    });
  };

  const xacNhanChenh = async () => {
    const reason = await nhapLyDo('Lý do chênh lệch với sổ chi');
    if (!reason) return;
    try {
      await xacNhanChenhLech(outlineId, reason);
      message.success('Đã xác nhận chênh lệch');
      await onTai();
    } catch (e) {
      message.error(bao(e));
    }
  };

  const tcXuLy = async (accept: boolean) => {
    if (!accept) {
      const reason = await nhapLyDo('Lý do từ chối / yêu cầu bổ sung');
      if (!reason) return;
      setDangLuu(true);
      try {
        await tcQuyetToan(outlineId, { accept: false, reason });
        message.success('Đã trả CNNV bổ sung');
        await onTai();
      } catch (e) {
        message.error(bao(e));
      } finally {
        setDangLuu(false);
      }
      return;
    }
    if (coChenh && !hs.settlement.varianceAck) {
      message.warning('Cần xác nhận chênh lệch trước khi quyết toán');
      return;
    }
    ngayTcRef.current = dayjs();
    Modal.confirm({
      title: 'Xác nhận quyết toán',
      content: (
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 8 }}>Ngày quyết toán</div>
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            defaultValue={dayjs()}
            onChange={(v) => {
              if (v) ngayTcRef.current = v;
            }}
          />
        </div>
      ),
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        setDangLuu(true);
        try {
          await tcQuyetToan(outlineId, {
            accept: true,
            date: (ngayTcRef.current || dayjs()).format('YYYY-MM-DD'),
          });
          message.success('Đã xác nhận quyết toán');
          await onTai();
        } catch (e) {
          message.error(bao(e));
          throw e;
        } finally {
          setDangLuu(false);
        }
      },
    });
  };

  const theTong = [
    {
      label: 'Theo HĐ',
      value: tongHop.theoHd,
      color: '#1677ff',
      bg: '#e6f4ff',
    },
    {
      label: 'Đã giải ngân',
      value: tongHop.daGiaiNgan,
      color: '#d46b08',
      bg: '#fff7e6',
    },
    {
      label: 'Tồn dư',
      value: tongHop.tonDu,
      color: tongHop.tonDu >= 0 ? '#389e0d' : '#cf1322',
      bg: tongHop.tonDu >= 0 ? '#f6ffed' : '#fff1f0',
    },
    {
      label: 'Khai QT',
      value: tongHop.tongKhai,
      color: '#531dab',
      bg: '#f9f0ff',
    },
  ];

  const canAckVariance =
    coChenh &&
    !hs.settlement.varianceAck &&
    ((vaiTro.canManage && st === 'QT_CHO_PKH') ||
      (vaiTro.canTc && st === 'QT_CHO_TC'));

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <Space wrap>
        {nhan ? (
          <Tag color={nhan.color} style={{ margin: 0 }}>
            {nhan.text}
          </Tag>
        ) : (
          <Tag style={{ margin: 0 }}>Chưa lập hồ sơ</Tag>
        )}
        {hs.settlement.date ? (
          <Tag color="blue" style={{ margin: 0 }}>
            Ngày QT: {dayjs(hs.settlement.date).format('DD/MM/YYYY')}
          </Tag>
        ) : null}
        {hs.settlement.varianceAck ? (
          <Tag color="orange" style={{ margin: 0 }}>
            Đã xác nhận chênh lệch
          </Tag>
        ) : coChenh && st && st !== 'QT_DRAFT' && st !== 'QT_BS' ? (
          <Tag color="error" style={{ margin: 0 }}>
            Có chênh lệch sổ chi
          </Tag>
        ) : null}
      </Space>

      {hs.settlement.returnReason ? (
        <Alert
          type="warning"
          showIcon
          message="Yêu cầu bổ sung"
          description={hs.settlement.returnReason}
        />
      ) : null}

      <Row gutter={[12, 12]}>
        {theTong.map((t) => (
          <Col xs={12} md={6} key={t.label}>
            <Card
              size="small"
              style={{
                borderRadius: 12,
                background: t.bg,
                borderColor: t.bg,
              }}
              styles={{ body: { padding: '12px 14px' } }}
            >
              <div style={{ fontSize: 12, color: '#64748b' }}>{t.label}</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: t.color,
                  marginTop: 4,
                  lineHeight: 1.25,
                }}
              >
                {formatVnd(t.value)}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        size="small"
        title={
          <Space>
            <FileTextOutlined />
            <span>Bảng quyết toán tổng hợp (Excel/PDF)</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        {coTheSua ? (
          <Space wrap>
            <ChonTep
              maxBytes={HAN_FILE.tomTat}
              nhan={bangTongHop ? 'Đổi file' : 'Upload bảng'}
              onCo={setBangTongHop}
            />
            {bangTongHop ? (
              <>
                <a
                  href={resolvePublicAssetUrl(bangTongHop.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {bangTongHop.fileName}
                </a>
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => setBangTongHop(null)}
                >
                  Xóa file
                </Button>
              </>
            ) : (
              <Tag color="error">Bắt buộc khi nộp</Tag>
            )}
          </Space>
        ) : bangTongHop || (hs.settlement.files || [])[0] ? (
          <a
            href={resolvePublicAssetUrl(
              (bangTongHop || hs.settlement.files[0]).fileUrl,
            )}
            target="_blank"
            rel="noreferrer"
          >
            {(bangTongHop || hs.settlement.files[0]).fileName}
          </a>
        ) : (
          <Tag>Chưa có</Tag>
        )}
      </Card>

      <Card
        size="small"
        title={
          <Space>
            <WalletOutlined />
            <span>Chi tiết theo khoản chi + chứng từ</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
        styles={{ body: { paddingTop: 8 } }}
      >
        <Table
          size="middle"
          pagination={false}
          rowKey="key"
          scroll={{ x: 1100 }}
          dataSource={dongBang}
          rowClassName={(r) => (r.chenh ? 'qt-row-chenh' : '')}
          columns={[
            {
              title: 'STT',
              dataIndex: 'stt',
              width: 52,
              align: 'center',
            },
            {
              title: 'Khoản chi',
              dataIndex: 'label',
              width: 180,
              ellipsis: true,
            },
            {
              title: 'Theo HĐ',
              width: 110,
              align: 'right',
              render: (_, r) => formatVnd(r.planned),
            },
            {
              title: 'Đã chi',
              width: 110,
              align: 'right',
              render: (_, r) => formatVnd(r.spent),
            },
            {
              title: 'Khai QT',
              width: 140,
              render: (_, r) =>
                coTheSua ? (
                  <InputNumber
                    {...vndInputNumberProps}
                    min={0}
                    status={r.chenh ? 'warning' : undefined}
                    style={{ width: '100%' }}
                    value={r.khai}
                    onChange={(v) =>
                      setKhai((s) => ({
                        ...s,
                        [r.code]: Number(v || 0),
                      }))
                    }
                  />
                ) : (
                  <span
                    style={{
                      fontWeight: 600,
                      color: r.chenh ? '#d46b08' : undefined,
                    }}
                  >
                    {formatVnd(r.khai)}
                  </span>
                ),
            },
            {
              title: 'Chứng từ scan',
              width: 260,
              render: (_, r) => (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {r.files.map((t) => (
                    <Space key={t.fileUrl} size={4} wrap>
                      <a
                        href={resolvePublicAssetUrl(t.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12 }}
                      >
                        {t.fileName}
                      </a>
                      {coTheSua ? (
                        <Button
                          type="link"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => xoaChungTu(r.code, t.fileUrl)}
                        />
                      ) : null}
                    </Space>
                  ))}
                  {coTheSua ? (
                    <ChonTep
                      maxBytes={HAN_FILE.tomTat}
                      nhan={r.files.length ? 'Thêm file' : 'Upload'}
                      onCo={(t) => themChungTu(r.code, t)}
                    />
                  ) : !r.files.length ? (
                    <Tag>Chưa có</Tag>
                  ) : null}
                  {coTheSua &&
                  r.khai > 0 &&
                  !r.files.length ? (
                    <Tag color="warning" style={{ margin: 0 }}>
                      Cần chứng từ
                    </Tag>
                  ) : null}
                </Space>
              ),
            },
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <strong>Tổng</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <strong>{formatVnd(tongHop.theoHd)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} align="right">
                <strong>{formatVnd(tongHop.daChi)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} align="right">
                <strong>{formatVnd(tongHop.tongKhai)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} />
            </Table.Summary.Row>
          )}
        />
        <style>{`.qt-row-chenh td { background: #fffbe6 !important; }`}</style>
      </Card>

      {coTheSua && (
        <Space wrap>
          <Button loading={dangLuu} onClick={() => void nop(false)}>
            Lưu nháp
          </Button>
          <Button
            type="primary"
            loading={dangLuu}
            onClick={() => void nop(true)}
          >
            Nộp quyết toán
          </Button>
        </Space>
      )}

      {vaiTro.canManage && st === 'QT_CHO_PKH' && (
        <Card size="small" title="PKH&HTQT" style={{ borderRadius: 12 }}>
          <Space wrap>
            {canAckVariance ? (
              <Button onClick={() => void xacNhanChenh()}>
                Xác nhận chênh lệch
              </Button>
            ) : null}
            <Button
              type="primary"
              loading={dangLuu}
              onClick={() => void pkhXuLy(true)}
            >
              Chuyển KH-TC
            </Button>
            <Button
              danger
              loading={dangLuu}
              onClick={() => void pkhXuLy(false)}
            >
              Trả bổ sung
            </Button>
          </Space>
        </Card>
      )}

      {vaiTro.canTc && st === 'QT_CHO_TC' && (
        <Card size="small" title="KH-TC" style={{ borderRadius: 12 }}>
          <Space wrap>
            {canAckVariance ? (
              <Button onClick={() => void xacNhanChenh()}>
                Xác nhận chênh lệch
              </Button>
            ) : null}
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={dangLuu}
              onClick={() => void tcXuLy(true)}
            >
              Xác nhận quyết toán
            </Button>
            <Button
              danger
              loading={dangLuu}
              onClick={() => void tcXuLy(false)}
            >
              Từ chối / yêu cầu bổ sung
            </Button>
          </Space>
        </Card>
      )}
    </Space>
  );
}
