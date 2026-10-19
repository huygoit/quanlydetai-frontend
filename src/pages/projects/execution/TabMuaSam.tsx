import {
  HAN_FILE,
  MUC_CHI,
  NHAN_LOAI_MUA,
  NHAN_MS,
} from '@/constants/module56';
import {
  csvcMuaSam,
  dsMuaSam,
  luuMuaSam,
  nhanMuaSam,
  pkhMuaSam,
  tcMuaSam,
  type HangMua,
  type PhieuMua,
  type TepModule56,
} from '@/services/api/module56';
import { formatVnd } from '@/utils/format';
import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { ChonTep } from './ChonTep';
import type { VaiTro } from './types';

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

const MUC = MUC_CHI.filter(
  (m) => m.code === 'MUC_02' || m.code === 'MUC_03' || m.code === 'MUC_05',
);

export function TabMuaSam({
  outlineId,
  vaiTro,
  onXong,
}: {
  outlineId: number;
  vaiTro: VaiTro;
  onXong: (t: string) => void;
}) {
  const [rows, setRows] = useState<PhieuMua[]>([]);
  const [loi, setLoi] = useState('');
  const [mo, setMo] = useState(false);
  const [dang, setDang] = useState<PhieuMua | null>(null);
  const [items, setItems] = useState<HangMua[]>([
    { name: '', unit: '', qty: 1, unitPrice: 0, spec: '' },
  ]);
  const [tep, setTep] = useState<TepModule56[]>([]);
  const [form] = Form.useForm();

  const tai = () =>
    dsMuaSam(outlineId)
      .then((res) => {
        setRows(res.data || []);
        setLoi('');
      })
      .catch((e) => setLoi(bao(e)));

  useEffect(() => {
    tai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId]);

  const moForm = (row?: PhieuMua) => {
    setDang(row || null);
    setItems(
      row?.items?.length
        ? row.items
        : [{ name: '', unit: '', qty: 1, unitPrice: 0, spec: '' }],
    );
    setTep(row?.attachments || []);
    form.setFieldsValue({
      kind: row?.kind || 'VAT_TU',
      lineCode: row?.lineCode || 'MUC_02',
      purpose: row?.purpose,
      neededBy: row?.neededBy ? dayjs(row.neededBy) : undefined,
      overBudgetNote: row?.overBudgetNote,
    });
    setMo(true);
  };

  const luu = async (submit: boolean) => {
    const v = await form.validateFields();
    const hang = items.filter((it) => it.name.trim());
    if (!hang.length) {
      message.warning('Nhập ít nhất một mặt hàng');
      return;
    }
    try {
      await luuMuaSam({
        id: dang?.id,
        projectOutlineId: outlineId,
        submit,
        kind: v.kind,
        lineCode: v.lineCode,
        purpose: v.purpose,
        neededBy: v.neededBy
          ? dayjs(v.neededBy).format('YYYY-MM-DD')
          : undefined,
        overBudgetNote: v.overBudgetNote || '',
        items: hang,
        attachments: tep,
      });
      onXong(submit ? 'Đã nộp' : 'Đã lưu nháp');
      setMo(false);
      await tai();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(bao(e));
    }
  };

  const lyDo = (nhan: string) => {
    const reason = window.prompt(nhan) || '';
    return reason.trim();
  };

  return (
    <>
      {loi && <Alert type="error" style={{ marginBottom: 12 }} message={loi} />}
      {vaiTro.canCnnv && (
        <Button
          type="primary"
          style={{ marginBottom: 12 }}
          onClick={() => moForm()}
        >
          Đề nghị mua sắm
        </Button>
      )}
      <Table
        size="small"
        rowKey="id"
        dataSource={rows}
        columns={[
          {
            title: 'Loại',
            dataIndex: 'kind',
            render: (v) => NHAN_LOAI_MUA[v as 'VAT_TU'] || v,
          },
          { title: 'Mục đích', dataIndex: 'purpose', ellipsis: true },
          {
            title: 'Thành tiền',
            dataIndex: 'totalAmount',
            render: (v) => formatVnd(v),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (v, r) => (
              <Space>
                <Tag>{NHAN_MS[v] || v}</Tag>
                {r.overBudget && <Tag color="red">Vượt dư</Tag>}
              </Space>
            ),
          },
          {
            title: '',
            width: 280,
            render: (_, r) => (
              <Space wrap>
                {vaiTro.canCnnv &&
                  (r.status === 'MS_DRAFT' || r.status === 'MS_BS') && (
                    <a onClick={() => moForm(r)}>Sửa</a>
                  )}
                {vaiTro.canManage && r.status === 'MS_CHO_PKH' && (
                  <>
                    <a
                      onClick={() =>
                        pkhMuaSam(r.id, { action: 'accept' })
                          .then(tai)
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Chuyển CSVC
                    </a>
                    <a
                      onClick={() => {
                        const reason = lyDo('Lý do bổ sung');
                        if (!reason) return;
                        pkhMuaSam(r.id, { action: 'return', reason })
                          .then(tai)
                          .catch((e) => message.error(bao(e)));
                      }}
                    >
                      Trả
                    </a>
                  </>
                )}
                {vaiTro.canManage &&
                  (r.status === 'MS_TU_CHOI' ||
                    r.status === 'MS_DAU_THAU_THAT_BAI') && (
                    <a
                      onClick={() =>
                        pkhMuaSam(r.id, { action: 'to_bs' })
                          .then(tai)
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Mở lại
                    </a>
                  )}
                {vaiTro.canManage &&
                  (r.status === 'MS_TU_CHOI' ||
                    r.status === 'MS_DAU_THAU_THAT_BAI' ||
                    r.status === 'MS_BS') && (
                    <a
                      onClick={() =>
                        pkhMuaSam(r.id, { action: 'close' })
                          .then(tai)
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Đóng
                    </a>
                  )}
                {vaiTro.canCsvc && r.status === 'MS_CHO_CSVC' && (
                  <>
                    <a
                      onClick={() => {
                        const method =
                          window.prompt(
                            'MUA_TRUC_TIEP hoặc DAU_THAU',
                            'MUA_TRUC_TIEP',
                          ) || '';
                        if (method !== 'MUA_TRUC_TIEP' && method !== 'DAU_THAU')
                          return;
                        csvcMuaSam(r.id, { action: 'supply', method })
                          .then(tai)
                          .catch((e) => message.error(bao(e)));
                      }}
                    >
                      Cung ứng
                    </a>
                    <a
                      onClick={() => {
                        const reason = lyDo('Lý do từ chối');
                        if (!reason) return;
                        csvcMuaSam(r.id, { action: 'reject', reason })
                          .then(tai)
                          .catch((e) => message.error(bao(e)));
                      }}
                    >
                      Từ chối
                    </a>
                    <a
                      onClick={() =>
                        csvcMuaSam(r.id, { action: 'bid_fail' })
                          .then(tai)
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Đấu thầu hỏng
                    </a>
                  </>
                )}
                {vaiTro.canCnnv && r.status === 'MS_CHO_NHAN' && (
                  <a
                    onClick={() =>
                      nhanMuaSam(r.id)
                        .then(tai)
                        .catch((e) => message.error(bao(e)))
                    }
                  >
                    Đã nhận
                  </a>
                )}
                {vaiTro.canTc && r.status === 'MS_CHO_TC' && (
                  <a
                    onClick={() => {
                      const voucherNo = window.prompt('Số chứng từ') || '';
                      const voucherDate =
                        window.prompt(
                          'Ngày YYYY-MM-DD',
                          dayjs().format('YYYY-MM-DD'),
                        ) || '';
                      if (!voucherNo.trim()) return;
                      tcMuaSam(r.id, {
                        accept: true,
                        voucherNo: voucherNo.trim(),
                        voucherDate: voucherDate.trim(),
                      })
                        .then(tai)
                        .catch((e) => message.error(bao(e)));
                    }}
                  >
                    Ghi sổ
                  </a>
                )}
              </Space>
            ),
          },
        ]}
      />
      <Drawer
        title="Đề nghị mua sắm"
        open={mo}
        onClose={() => setMo(false)}
        width={640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="kind" label="Loại" rules={[{ required: true }]}>
            <Select
              options={Object.entries(NHAN_LOAI_MUA).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="lineCode"
            label="Mục chi"
            rules={[{ required: true }]}
          >
            <Select
              options={MUC.map((m) => ({ value: m.code, label: m.label }))}
            />
          </Form.Item>
          <Form.Item
            name="purpose"
            label="Mục đích"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="neededBy" label="Cần trước ngày">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item
            name="overBudgetNote"
            label="Giải trình nếu vượt dư (bắt buộc khi nộp vượt)"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          {items.map((it, i) => (
            <Space
              key={i}
              style={{ display: 'flex', marginBottom: 8 }}
              align="start"
            >
              <Input
                placeholder="Tên"
                value={it.name}
                onChange={(e) =>
                  setItems((s) =>
                    s.map((x, j) =>
                      j === i ? { ...x, name: e.target.value } : x,
                    ),
                  )
                }
              />
              <Input
                placeholder="ĐVT"
                style={{ width: 80 }}
                value={it.unit}
                onChange={(e) =>
                  setItems((s) =>
                    s.map((x, j) =>
                      j === i ? { ...x, unit: e.target.value } : x,
                    ),
                  )
                }
              />
              <InputNumber
                min={0}
                value={it.qty}
                onChange={(v) =>
                  setItems((s) =>
                    s.map((x, j) =>
                      j === i ? { ...x, qty: Number(v || 0) } : x,
                    ),
                  )
                }
              />
              <InputNumber
                min={0}
                value={it.unitPrice}
                onChange={(v) =>
                  setItems((s) =>
                    s.map((x, j) =>
                      j === i ? { ...x, unitPrice: Number(v || 0) } : x,
                    ),
                  )
                }
              />
            </Space>
          ))}
          <Button
            style={{ marginBottom: 8 }}
            onClick={() =>
              setItems((s) => [
                ...s,
                { name: '', unit: '', qty: 1, unitPrice: 0, spec: '' },
              ])
            }
          >
            Thêm dòng
          </Button>
          <div style={{ marginBottom: 8 }}>
            <ChonTep
              maxBytes={HAN_FILE.phieu}
              onCo={(t) => setTep((s) => [...s, t])}
            />
            {tep.map((t) => (
              <div key={t.fileUrl}>{t.fileName}</div>
            ))}
          </div>
          <Space>
            <Button onClick={() => luu(false)}>Lưu nháp</Button>
            <Button type="primary" onClick={() => luu(true)}>
              Nộp
            </Button>
          </Space>
        </Form>
      </Drawer>
    </>
  );
}
