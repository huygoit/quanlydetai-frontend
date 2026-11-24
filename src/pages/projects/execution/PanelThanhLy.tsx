/**
 * Panel Thanh lý hợp đồng (BM-05.10 / BM.14) — PKH → BGH → TC-HC → CNNV.
 */
import { HAN_FILE, NHAN_XEP_LOAI } from '@/constants/module56';
import {
  bghThanhLy,
  cnnvThanhLy,
  luuThanhLy,
  phatHanhThanhLy,
  trinhThanhLy,
  type HoSoCuoiKy,
} from '@/services/api/module56';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileDoneOutlined,
  PlusOutlined,
  TrophyOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  InputNumber,
  Modal,
  Radio,
  Row,
  Space,
  Steps,
  Table,
  Tag,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { ChonTep } from './ChonTep';
import type { VaiTro } from './types';

const NHAN_TL: Record<string, { text: string; color: string; step: number }> = {
  TL_DRAFT: { text: 'Nháp', color: 'default', step: 0 },
  TL_TRA_LAI: { text: 'BGH trả lại', color: 'error', step: 0 },
  TL_CHO_BGH: { text: 'Chờ BGH ký', color: 'processing', step: 1 },
  TL_CHO_PHAT_HANH: { text: 'Chờ phát hành', color: 'warning', step: 2 },
  TL_CHO_CNNV: { text: 'Chờ CNNV xác nhận', color: 'cyan', step: 3 },
  TL_HIEU_LUC: { text: 'Đã hoàn thành', color: 'success', step: 4 },
};

type TaiSanDong = {
  key: string;
  name: string;
  quantity: string;
  amount: number;
  note: string;
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

export function PanelThanhLy({ outlineId, hs, vaiTro, onTai }: Props) {
  const tl = hs.liquidation;
  const st = tl.status;
  const nhan = st ? NHAN_TL[st] || { text: st, color: 'default', step: 0 } : null;
  const coTheSua =
    vaiTro.canManage && (!st || st === 'TL_DRAFT' || st === 'TL_TRA_LAI');

  const [surplus, setSurplus] = useState<'HOAN_TRA' | 'KHONG_PHAT_SINH'>(
    'KHONG_PHAT_SINH',
  );
  const [taiSan, setTaiSan] = useState<TaiSanDong[]>([]);
  const [fileCongNhan, setFileCongNhan] = useState('');
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    setSurplus(
      (tl.surplusHandling as 'HOAN_TRA' | 'KHONG_PHAT_SINH') ||
        'KHONG_PHAT_SINH',
    );
    setFileCongNhan(tl.recognitionFileUrl || '');
    setTaiSan(
      (hs.assets || []).map((a, i) => ({
        key: String(a.id || `a-${i}`),
        name: a.name || '',
        quantity: a.quantity || '1',
        amount: Number(a.amount || 0),
        note: a.note || '',
      })),
    );
  }, [tl.surplusHandling, tl.recognitionFileUrl, hs.assets]);

  const tongHop = useMemo(() => {
    const daCap = Number(hs.finance.advanced || 0);
    const daChi = Number(hs.finance.spent || 0);
    const daQt = Number(hs.finance.settled || 0);
    const tonDu = Number(tl.surplus || daCap + daChi - daQt);
    return { daCap, daChi, daQt, tonDu };
  }, [hs.finance, tl.surplus]);

  const xepLoai = hs.classification
    ? NHAN_XEP_LOAI[hs.classification] || hs.classification
    : '—';

  const sanPham = (hs.dossier?.products || [])
    .map((p) => p.name)
    .filter(Boolean);

  const xemTruoc = () => {
    if (!tl.fileUrl) {
      message.info('Chưa có dự thảo — bấm «Lưu & sinh dự thảo» trước');
      return;
    }
    window.open(resolvePublicAssetUrl(tl.fileUrl), '_blank', 'noopener');
  };

  const luu = async () => {
    setDangLuu(true);
    try {
      await luuThanhLy(outlineId, {
        surplusHandling: surplus,
        assets: taiSan
          .filter((r) => r.name.trim())
          .map((r) => ({
            name: r.name.trim(),
            quantity: r.quantity,
            amount: r.amount,
            note: r.note || null,
          })),
        recognitionFileUrl: fileCongNhan || null,
      });
      message.success('Đã lưu và sinh dự thảo biên bản');
      await onTai();
    } catch (e) {
      message.error(bao(e));
    } finally {
      setDangLuu(false);
    }
  };

  const trinhBgh = async () => {
    if (!surplus) {
      message.warning('Chọn cách xử lý tồn dư');
      return;
    }
    Modal.confirm({
      title: 'Trình BGH ký biên bản thanh lý?',
      content: 'Hệ thống sẽ sinh BM-05.10 và chuyển chờ BGH ký số.',
      okText: 'Trình BGH',
      cancelText: 'Hủy',
      onOk: async () => {
        setDangLuu(true);
        try {
          // Lưu trước để chắc dữ liệu mới nhất
          await luuThanhLy(outlineId, {
            surplusHandling: surplus,
            assets: taiSan
              .filter((r) => r.name.trim())
              .map((r) => ({
                name: r.name.trim(),
                quantity: r.quantity,
                amount: r.amount,
                note: r.note || null,
              })),
            recognitionFileUrl: fileCongNhan || null,
          });
          await trinhThanhLy(outlineId);
          message.success('Đã trình BGH');
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

  const bghXuLy = async (accept: boolean) => {
    if (!accept) {
      const reason = await nhapLyDo('Lý do trả lại PKH');
      if (!reason) return;
      setDangLuu(true);
      try {
        await bghThanhLy(outlineId, { accept: false, reason });
        message.success('Đã trả lại PKH');
        await onTai();
      } catch (e) {
        message.error(bao(e));
      } finally {
        setDangLuu(false);
      }
      return;
    }
    Modal.confirm({
      title: 'Xác nhận ký biên bản thanh lý?',
      okText: 'Ký',
      cancelText: 'Hủy',
      onOk: async () => {
        setDangLuu(true);
        try {
          await bghThanhLy(outlineId, { accept: true });
          message.success('BGH đã ký — chờ TC-HC phát hành');
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

  const phatHanh = () => {
    let issueNo = tl.issueNo || '';
    Modal.confirm({
      title: 'Phát hành biên bản thanh lý',
      content: (
        <div style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 8 }}>Số phát hành *</div>
          <Input
            defaultValue={issueNo}
            placeholder="VD: 12/TL-KHCNĐMST/ĐHSP"
            onChange={(e) => {
              issueNo = e.target.value;
            }}
          />
        </div>
      ),
      okText: 'Phát hành',
      cancelText: 'Hủy',
      onOk: async () => {
        if (!issueNo.trim()) {
          message.warning('Cần nhập số phát hành');
          return Promise.reject();
        }
        setDangLuu(true);
        try {
          await phatHanhThanhLy(outlineId, issueNo.trim());
          message.success('Đã phát hành — chờ CNNV xác nhận');
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

  const cnnvKy = () => {
    Modal.confirm({
      title: 'Xác nhận ký biên bản thanh lý?',
      content:
        'Sau khi xác nhận, nhiệm vụ chuyển sang Hoàn thành và cập nhật hồ sơ khoa học.',
      okText: 'Xác nhận hoàn thành',
      cancelText: 'Hủy',
      onOk: async () => {
        setDangLuu(true);
        try {
          await cnnvThanhLy(outlineId);
          message.success('Đã hoàn thành nhiệm vụ');
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
      label: 'KP đã cấp',
      value: tongHop.daCap,
      color: '#d46b08',
      bg: '#fff7e6',
    },
    {
      label: 'KP quyết toán',
      value: tongHop.daQt,
      color: '#531dab',
      bg: '#f9f0ff',
    },
    {
      label: 'Tồn dư',
      value: tongHop.tonDu,
      color: tongHop.tonDu >= 0 ? '#389e0d' : '#cf1322',
      bg: tongHop.tonDu >= 0 ? '#f6ffed' : '#fff1f0',
    },
  ];

  const stepHien = nhan?.step ?? 0;

  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
        <Space wrap>
          {nhan ? (
            <Tag color={nhan.color} style={{ margin: 0 }}>
              {nhan.text}
            </Tag>
          ) : (
            <Tag style={{ margin: 0 }}>Chưa lập hồ sơ</Tag>
          )}
          {tl.issueNo ? (
            <Tag color="blue" style={{ margin: 0 }}>
              Số: {tl.issueNo}
            </Tag>
          ) : null}
          {hs.classification ? (
            <Tag color="geekblue" style={{ margin: 0 }}>
              Xếp loại: {xepLoai}
            </Tag>
          ) : null}
        </Space>
        <Button
          icon={<EyeOutlined />}
          onClick={xemTruoc}
          disabled={!tl.fileUrl}
        >
          Xem trước BM
        </Button>
      </Space>

      {tl.returnReason ? (
        <Alert
          type="warning"
          showIcon
          message="BGH trả lại"
          description={tl.returnReason}
        />
      ) : null}

      <Card size="small" style={{ borderRadius: 12 }} styles={{ body: { paddingBottom: 8 } }}>
        <Steps
          size="small"
          current={stepHien}
          items={[
            { title: 'PKH soạn' },
            { title: 'BGH ký' },
            { title: 'Phát hành' },
            { title: 'CNNV xác nhận' },
            { title: 'Hoàn thành' },
          ]}
        />
      </Card>

      <Row gutter={[12, 12]}>
        {theTong.map((t) => (
          <Col xs={12} md={8} key={t.label}>
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
            <TrophyOutlined />
            <span>Điều 1 — Xác nhận kết quả</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
          <Descriptions.Item label="Tên nhiệm vụ">
            {hs.title || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Mã số">{hs.code || '—'}</Descriptions.Item>
          <Descriptions.Item label="Xếp loại ĐGCK">
            <Tag color="blue">{xepLoai}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Ngày quyết toán">
            {hs.settlement.date
              ? dayjs(hs.settlement.date).format('DD/MM/YYYY')
              : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Sản phẩm bàn giao" span={2}>
            {sanPham.length ? sanPham.join('; ') : '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        size="small"
        title={
          <Space>
            <WalletOutlined />
            <span>Điều 2 — Xử lý tài chính</span>
          </Space>
        }
        style={{ borderRadius: 12 }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Descriptions column={{ xs: 1, sm: 3 }} size="small">
            <Descriptions.Item label="KP đã cấp">
              {formatVnd(tongHop.daCap)}
            </Descriptions.Item>
            <Descriptions.Item label="KP quyết toán">
              {formatVnd(tongHop.daQt)}
            </Descriptions.Item>
            <Descriptions.Item label="Tồn dư">
              <strong style={{ color: tongHop.tonDu ? '#d46b08' : undefined }}>
                {formatVnd(tongHop.tonDu)}
              </strong>
            </Descriptions.Item>
          </Descriptions>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Cách xử lý tồn dư *
            </div>
            <Radio.Group
              value={surplus}
              disabled={!coTheSua}
              onChange={(e) => setSurplus(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { value: 'KHONG_PHAT_SINH', label: 'Không phát sinh' },
                { value: 'HOAN_TRA', label: 'Hoàn trả' },
              ]}
            />
          </div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              File quyết định công nhận (tuỳ chọn)
            </div>
            <Space wrap>
              {coTheSua ? (
                <ChonTep
                  maxBytes={HAN_FILE.phieu}
                  nhan={fileCongNhan ? 'Đổi file' : 'Upload'}
                  onCo={(t) => setFileCongNhan(t.fileUrl)}
                />
              ) : null}
              {fileCongNhan ? (
                <>
                  <a
                    href={resolvePublicAssetUrl(fileCongNhan)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Xem file
                  </a>
                  {coTheSua ? (
                    <Button
                      type="link"
                      danger
                      size="small"
                      onClick={() => setFileCongNhan('')}
                    >
                      Xóa
                    </Button>
                  ) : null}
                </>
              ) : (
                <Tag>Chưa có</Tag>
              )}
            </Space>
          </div>
        </Space>
      </Card>

      <Card
        size="small"
        title={
          <Space>
            <FileDoneOutlined />
            <span>Điều 3 — Tài sản bàn giao</span>
          </Space>
        }
        extra={
          coTheSua ? (
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() =>
                setTaiSan((s) => [
                  ...s,
                  {
                    key: `n-${Date.now()}`,
                    name: '',
                    quantity: '1',
                    amount: 0,
                    note: '',
                  },
                ])
              }
            >
              Thêm dòng
            </Button>
          ) : null
        }
        style={{ borderRadius: 12 }}
      >
        <Table
          size="middle"
          pagination={false}
          rowKey="key"
          dataSource={taiSan}
          locale={{ emptyText: 'Chưa có tài sản bàn giao' }}
          columns={[
            {
              title: 'Tên tài sản',
              render: (_, r, i) =>
                coTheSua ? (
                  <Input
                    value={r.name}
                    placeholder="Tên thiết bị / tài sản"
                    onChange={(e) =>
                      setTaiSan((s) =>
                        s.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ) : (
                  r.name
                ),
            },
            {
              title: 'SL',
              width: 90,
              render: (_, r, i) =>
                coTheSua ? (
                  <Input
                    value={r.quantity}
                    onChange={(e) =>
                      setTaiSan((s) =>
                        s.map((x, j) =>
                          j === i ? { ...x, quantity: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ) : (
                  r.quantity
                ),
            },
            {
              title: 'Thành tiền',
              width: 150,
              render: (_, r, i) =>
                coTheSua ? (
                  <InputNumber
                    {...vndInputNumberProps}
                    min={0}
                    style={{ width: '100%' }}
                    value={r.amount}
                    onChange={(v) =>
                      setTaiSan((s) =>
                        s.map((x, j) =>
                          j === i ? { ...x, amount: Number(v || 0) } : x,
                        ),
                      )
                    }
                  />
                ) : (
                  formatVnd(r.amount)
                ),
            },
            ...(coTheSua
              ? [
                  {
                    title: '',
                    width: 56,
                    render: (_: unknown, __: TaiSanDong, i: number) => (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() =>
                          setTaiSan((s) => s.filter((_, j) => j !== i))
                        }
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>

      {coTheSua && (
        <Space wrap>
          <Button loading={dangLuu} onClick={() => void luu()}>
            Lưu & sinh dự thảo
          </Button>
          <Button
            icon={<EyeOutlined />}
            disabled={!tl.fileUrl}
            onClick={xemTruoc}
          >
            Xem trước
          </Button>
          <Button
            type="primary"
            loading={dangLuu}
            onClick={() => void trinhBgh()}
          >
            Trình BGH ký
          </Button>
        </Space>
      )}

      {vaiTro.canBgh && st === 'TL_CHO_BGH' && (
        <Card size="small" title="BGH — ký biên bản" style={{ borderRadius: 12 }}>
          <Space wrap>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={dangLuu}
              onClick={() => void bghXuLy(true)}
            >
              Ký biên bản
            </Button>
            <Button danger loading={dangLuu} onClick={() => void bghXuLy(false)}>
              Trả lại
            </Button>
            <Button icon={<EyeOutlined />} onClick={xemTruoc} disabled={!tl.fileUrl}>
              Xem trước
            </Button>
          </Space>
        </Card>
      )}

      {vaiTro.canPublish && st === 'TL_CHO_PHAT_HANH' && (
        <Card
          size="small"
          title="TC-HC — phát hành"
          style={{ borderRadius: 12 }}
        >
          <Space wrap>
            <Button
              type="primary"
              loading={dangLuu}
              onClick={phatHanh}
            >
              Phát hành BM
            </Button>
            <Button icon={<EyeOutlined />} onClick={xemTruoc} disabled={!tl.fileUrl}>
              Xem trước
            </Button>
          </Space>
        </Card>
      )}

      {vaiTro.canCnnv && st === 'TL_CHO_CNNV' && (
        <Card
          size="small"
          title="CNNV — xác nhận ký"
          style={{ borderRadius: 12 }}
        >
          <Space wrap>
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={dangLuu}
              onClick={cnnvKy}
            >
              Xác nhận hoàn thành
            </Button>
            <Button icon={<EyeOutlined />} onClick={xemTruoc} disabled={!tl.fileUrl}>
              Xem biên bản
            </Button>
          </Space>
        </Card>
      )}

      {st === 'TL_HIEU_LUC' && (
        <Alert
          type="success"
          showIcon
          message="Biên bản thanh lý đã có hiệu lực — nhiệm vụ hoàn thành"
          description={
            <Space wrap>
              {tl.publishedAt
                ? `Phát hành: ${dayjs(tl.publishedAt).format('DD/MM/YYYY HH:mm')}`
                : null}
              {tl.cnnvSignedAt
                ? ` · CNNV xác nhận: ${dayjs(tl.cnnvSignedAt).format('DD/MM/YYYY HH:mm')}`
                : null}
              {tl.fileUrl ? (
                <Button type="link" size="small" icon={<EyeOutlined />} onClick={xemTruoc}>
                  Xem BM
                </Button>
              ) : null}
            </Space>
          }
        />
      )}
    </Space>
  );
}
