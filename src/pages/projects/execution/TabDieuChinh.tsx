import { MUC_CHI, NHAN_DC } from '@/constants/module56';
import {
  bghDieuChinh,
  dsDieuChinh,
  leadDieuChinh,
  luuDieuChinh,
  pkhDieuChinh,
  type PhieuDieuChinh,
} from '@/services/api/module56';
import { getAvailableOutlineReviewers } from '@/services/api/projectOutlineReviews';
import { vndInputNumberProps } from '@/utils/format';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  Alert,
  Button,
  DatePicker,
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
  const [loi, setLoi] = useState('');
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [kemKinhPhi, setKemKinhPhi] = useState(false);
  const [nguoi, setNguoi] = useState<{ value: number; label: string }[]>([]);
  const [form] = Form.useForm();

  const tai = () =>
    dsDieuChinh(outlineId)
      .then((res) => {
        setRows(res.data || []);
        setLoi('');
      })
      .catch((e) => setLoi(bao(e)));

  useEffect(() => {
    tai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId]);

  const luu = async (submit: boolean) => {
    const v = await form.validateFields();
    const changes: Record<string, unknown> = {};
    if (v.endDate) changes.endDate = dayjs(v.endDate).format('YYYY-MM-DD');
    if (v.principalUserId) changes.principalUserId = Number(v.principalUserId);
    if (v.content) changes.content = v.content;
    if (v.moc) {
      changes.milestones = [
        {
          content: v.moc,
          startDate: null,
          endDate: v.mocEnd ? dayjs(v.mocEnd).format('YYYY-MM-DD') : null,
          expectedResult: null,
        },
      ];
    }
    if (kemKinhPhi) {
      changes.budgetLines = MUC_CHI.map((m) => ({
        code: m.code,
        amount: Number(amounts[m.code] || 0),
      }));
    }
    if (!Object.keys(changes).length) {
      message.warning('Cần ít nhất một nội dung thay đổi');
      return;
    }
    try {
      await luuDieuChinh({
        id: v.id || undefined,
        projectOutlineId: outlineId,
        submit,
        reason: v.reason,
        evidenceUrl: v.evidenceUrl,
        changes,
      });
      onXong(submit ? 'Đã nộp điều chỉnh' : 'Đã lưu nháp');
      form.resetFields();
      await tai();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(bao(e));
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {loi && <Alert type="error" message={loi} />}
      <Alert
        type="info"
        message={`Đã gia hạn ${extensionCount} lần. Gia hạn lần 2 trở đi cần người có quyền xác nhận trước khi PKH trình BGH.`}
      />
      {vaiTro.canCnnv && (
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="evidenceUrl" label="Minh chứng">
            <Input placeholder="Đường dẫn file" />
          </Form.Item>
          <ChonTep
            maxBytes={20 * 1024 * 1024}
            nhan="Tải minh chứng"
            onCo={(t) => form.setFieldValue('evidenceUrl', t.fileUrl)}
          />
          <Form.Item name="endDate" label="Ngày kết thúc mới">
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="principalUserId" label="Chủ nhiệm mới">
            <Select
              showSearch
              allowClear
              filterOption={false}
              placeholder="Gõ tên để tìm"
              options={nguoi}
              onSearch={async (kw) => {
                if (!kw.trim()) return;
                const res = await getAvailableOutlineReviewers(
                  outlineId,
                  kw,
                ).catch(() => null);
                setNguoi(
                  (res?.data || [])
                    .filter((r) => r.reviewerUserId)
                    .map((r) => ({
                      value: r.reviewerUserId as number,
                      label: r.reviewerName,
                    })),
                );
              }}
            />
          </Form.Item>
          <Form.Item name="content" label="Nội dung nghiên cứu mới">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="moc" label="Mốc mới (nếu đổi)">
            <Input />
          </Form.Item>
          <Form.Item name="mocEnd" label="Hạn mốc mới">
            <DatePicker format="DD/MM/YYYY" />
          </Form.Item>
          <Button
            style={{ marginBottom: 8 }}
            onClick={() => setKemKinhPhi((v) => !v)}
          >
            {kemKinhPhi ? 'Bỏ kinh phí' : 'Kèm 10 mục kinh phí'}
          </Button>
          {kemKinhPhi &&
            MUC_CHI.map((m) => (
              <div key={m.code} style={{ marginBottom: 8 }}>
                {m.label}{' '}
                <InputNumber
                  {...vndInputNumberProps}
                  min={0}
                  value={amounts[m.code] || 0}
                  onChange={(v) =>
                    setAmounts((s) => ({ ...s, [m.code]: Number(v || 0) }))
                  }
                />
              </div>
            ))}
          <Space>
            <Button onClick={() => luu(false)}>Lưu nháp</Button>
            <Button type="primary" onClick={() => luu(true)}>
              Nộp
            </Button>
          </Space>
        </Form>
      )}
      <Table
        size="small"
        rowKey="id"
        dataSource={rows}
        columns={[
          { title: 'Lý do', dataIndex: 'reason', ellipsis: true },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (v) => <Tag>{NHAN_DC[v] || v}</Tag>,
          },
          {
            title: 'Phụ lục',
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
            title: '',
            render: (_, r) => {
              const canLead =
                vaiTro.canLead &&
                r.status === 'DC_PENDING_PKH' &&
                !!r.changes?.endDate &&
                extensionCount >= 1 &&
                !r.leadConfirmed;
              return (
                <Space>
                  {canLead && (
                    <a
                      onClick={() =>
                        leadDieuChinh(r.id)
                          .then(tai)
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Xác nhận gia hạn
                    </a>
                  )}
                  {vaiTro.canManage && r.status === 'DC_PENDING_PKH' && (
                    <>
                      <a
                        onClick={() =>
                          pkhDieuChinh(r.id, { action: 'accept' })
                            .then(tai)
                            .catch((e) => message.error(bao(e)))
                        }
                      >
                        Trình BGH
                      </a>
                      <a
                        onClick={() => {
                          const note = window.prompt('Lý do trả') || '';
                          if (!note.trim()) return;
                          pkhDieuChinh(r.id, {
                            action: 'return',
                            note: note.trim(),
                          })
                            .then(tai)
                            .catch((e) => message.error(bao(e)));
                        }}
                      >
                        Trả
                      </a>
                    </>
                  )}
                  {vaiTro.canBgh && r.status === 'DC_PENDING_BGH' && (
                    <>
                      <a
                        onClick={() =>
                          bghDieuChinh(r.id, { accept: true })
                            .then(tai)
                            .catch((e) => message.error(bao(e)))
                        }
                      >
                        Duyệt
                      </a>
                      <a
                        onClick={() => {
                          const note = window.prompt('Lý do từ chối') || '';
                          if (!note.trim()) return;
                          bghDieuChinh(r.id, {
                            accept: false,
                            note: note.trim(),
                          })
                            .then(tai)
                            .catch((e) => message.error(bao(e)));
                        }}
                      >
                        Từ chối
                      </a>
                    </>
                  )}
                  {vaiTro.canCnnv &&
                    (r.status === 'DC_DRAFT' || r.status === 'DC_BS') && (
                      <a
                        onClick={() => {
                          form.setFieldsValue({
                            id: r.id,
                            reason: r.reason,
                            evidenceUrl: r.evidenceUrl,
                            content: r.changes?.content,
                            endDate: r.changes?.endDate
                              ? dayjs(r.changes.endDate)
                              : undefined,
                            principalUserId: r.changes?.principalUserId,
                          });
                        }}
                      >
                        Sửa
                      </a>
                    )}
                </Space>
              );
            },
          },
        ]}
      />
    </Space>
  );
}
