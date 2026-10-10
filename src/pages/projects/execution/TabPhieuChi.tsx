import {
  HAN_FILE,
  MUC_CHI,
  NHAN_LOAI_CHI,
  NHAN_YCKT,
  nhanMuc,
} from '@/constants/module56';
import {
  dsPhieuChi,
  luuPhieuChi,
  pkhPhieuChi,
  tcPhieuChi,
  type PhieuChi,
  type TepModule56,
} from '@/services/api/module56';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import {
  Alert,
  Button,
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

export function TabPhieuChi({
  outlineId,
  vaiTro,
  onXong,
}: {
  outlineId: number;
  vaiTro: VaiTro;
  onXong: (t: string) => void;
}) {
  const [rows, setRows] = useState<PhieuChi[]>([]);
  const [loi, setLoi] = useState('');
  const [mo, setMo] = useState(false);
  const [dang, setDang] = useState<PhieuChi | null>(null);
  const [tep, setTep] = useState<TepModule56[]>([]);
  const [form] = Form.useForm();

  const tai = () =>
    dsPhieuChi(outlineId)
      .then((res) => {
        setRows(res.data || []);
        setLoi('');
      })
      .catch((e) => setLoi(bao(e)));

  useEffect(() => {
    tai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId]);

  const moForm = (row?: PhieuChi) => {
    setDang(row || null);
    setTep(row?.attachments || []);
    form.setFieldsValue({
      kind: row?.kind || 'TAM_UNG',
      lineCode: row?.lineCode || 'MUC_01',
      amount: row?.amount,
      detail: row?.detail,
      bankAccount: row?.bankAccount,
      bankName: row?.bankName,
    });
    setMo(true);
  };

  const luu = async (submit: boolean) => {
    const v = await form.validateFields();
    if (submit && !tep.length) {
      message.warning('Cần ít nhất một file đính kèm');
      return;
    }
    try {
      await luuPhieuChi({
        id: dang?.id ?? null,
        projectOutlineId: outlineId,
        submit,
        ...v,
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

  return (
    <>
      {loi && <Alert type="error" style={{ marginBottom: 12 }} message={loi} />}
      {vaiTro.canCnnv && (
        <Button
          type="primary"
          style={{ marginBottom: 12 }}
          onClick={() => moForm()}
        >
          Tạo phiếu
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
            render: (v) => NHAN_LOAI_CHI[v as 'TAM_UNG'] || v,
          },
          { title: 'Mục', dataIndex: 'lineCode', render: (v) => nhanMuc(v) },
          {
            title: 'Số tiền',
            dataIndex: 'amount',
            render: (v) => formatVnd(v),
          },
          { title: 'Nội dung', dataIndex: 'detail', ellipsis: true },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (v, r) => (
              <Space>
                <Tag>{NHAN_YCKT[v] || v}</Tag>
                {r.overBudget && <Tag color="red">Vượt dư</Tag>}
              </Space>
            ),
          },
          {
            title: '',
            render: (_, r) => (
              <Space>
                {vaiTro.canCnnv &&
                  (r.status === 'YCKT_DRAFT' || r.status === 'YCKT_BS') && (
                    <a onClick={() => moForm(r)}>Sửa</a>
                  )}
                {vaiTro.canManage && r.status === 'YCKT_PKH' && (
                  <>
                    <a
                      onClick={() =>
                        pkhPhieuChi(r.id, { action: 'accept' })
                          .then(() => {
                            onXong('Đã chuyển KH-TC');
                            tai();
                          })
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Duyệt
                    </a>
                    <a
                      onClick={() => {
                        const reason = window.prompt('Lý do trả lại') || '';
                        if (!reason.trim()) return;
                        pkhPhieuChi(r.id, {
                          action: 'return',
                          reason: reason.trim(),
                        })
                          .then(tai)
                          .catch((e) => message.error(bao(e)));
                      }}
                    >
                      Trả
                    </a>
                    <a
                      onClick={() => {
                        const reason = window.prompt('Lý do từ chối') || '';
                        if (!reason.trim()) return;
                        pkhPhieuChi(r.id, {
                          action: 'reject',
                          reason: reason.trim(),
                        })
                          .then(tai)
                          .catch((e) => message.error(bao(e)));
                      }}
                    >
                      Từ chối
                    </a>
                  </>
                )}
                {vaiTro.canTc && r.status === 'YCKT_TC' && (
                  <>
                    <a
                      onClick={() => {
                        const voucherNo = window.prompt('Số chứng từ') || '';
                        const voucherDate =
                          window.prompt(
                            'Ngày chứng từ YYYY-MM-DD',
                            dayjs().format('YYYY-MM-DD'),
                          ) || '';
                        if (!voucherNo.trim() || !voucherDate.trim()) return;
                        tcPhieuChi(r.id, {
                          accept: true,
                          voucherNo: voucherNo.trim(),
                          voucherDate: voucherDate.trim(),
                        })
                          .then(() => {
                            onXong('Đã ghi sổ');
                            tai();
                          })
                          .catch((e) => message.error(bao(e)));
                      }}
                    >
                      Ghi sổ
                    </a>
                    <a
                      onClick={() => {
                        const reason = window.prompt('Lý do trả PKH') || '';
                        if (!reason.trim()) return;
                        tcPhieuChi(r.id, {
                          accept: false,
                          reason: reason.trim(),
                        })
                          .then(tai)
                          .catch((e) => message.error(bao(e)));
                      }}
                    >
                      Trả PKH
                    </a>
                  </>
                )}
              </Space>
            ),
          },
        ]}
      />
      <Drawer
        title="Phiếu tạm ứng / thanh toán"
        open={mo}
        onClose={() => setMo(false)}
        width={480}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="kind" label="Loại" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'TAM_UNG', label: 'Tạm ứng' },
                { value: 'THANH_TOAN', label: 'Thanh toán' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="lineCode"
            label="Mục chi"
            rules={[{ required: true }]}
          >
            <Select
              options={MUC_CHI.map((m) => ({
                value: m.code,
                label: `${m.code} — ${m.label}`,
              }))}
            />
          </Form.Item>
          <Form.Item name="amount" label="Số tiền" rules={[{ required: true }]}>
            <InputNumber
              {...vndInputNumberProps}
              min={1}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="detail"
            label="Nội dung"
            rules={[{ required: true }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="bankAccount"
            label="Số tài khoản"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="bankName"
            label="Ngân hàng"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <ChonTep
            maxBytes={HAN_FILE.phieu}
            onCo={(t) => setTep((s) => [...s, t])}
          />
          <ul>
            {tep.map((t) => (
              <li key={t.fileUrl}>{t.fileName}</li>
            ))}
          </ul>
          <Space>
            <Button onClick={() => luu(false).catch((e) => onXong(e.message))}>
              Lưu nháp
            </Button>
            <Button
              type="primary"
              onClick={() => luu(true).catch((e) => onXong(e.message))}
            >
              Nộp
            </Button>
          </Space>
        </Form>
      </Drawer>
    </>
  );
}
