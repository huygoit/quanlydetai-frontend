/**
 * Đề nghị mua sắm — danh sách + sheet phải, bảng hàng hóa editable, footer cố định.
 * Lưu nháp → MS_DRAFT trên danh sách; Nộp → MS_CHO_PKH + thông báo quyền project.contract_manage.
 */
import {
  HAN_FILE,
  MUC_CHI,
  MUC_MUA_SAM,
  NHAN_LOAI_MUA,
  NHAN_MS,
  nhanMuc,
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
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import { uploadFileDon } from '@/services/api/fileUpload';
import {
  CalendarOutlined,
  DeleteOutlined,
  FileProtectOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  EditableProTable,
  type EditableFormInstance,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { VaiTro } from './types';

const { Text, Title } = Typography;

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

type DongHang = HangMua & { id: string };

const MUC = MUC_CHI.filter((m) =>
  (MUC_MUA_SAM as readonly string[]).includes(m.code),
);

function dongTrong(): DongHang {
  return {
    id: `hang-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    unit: '',
    qty: 1,
    unitPrice: 0,
    amount: 0,
    spec: '',
  };
}

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
  const [chiXem, setChiXem] = useState(false);
  const [dang, setDang] = useState<PhieuMua | null>(null);
  const [items, setItems] = useState<DongHang[]>([dongTrong()]);
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);
  const [tep, setTep] = useState<TepModule56[]>([]);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const bangHangRef = useRef<EditableFormInstance<DongHang>>();

  const coQuyenLap = vaiTro.canCnnv || vaiTro.canManage;

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

  const tongTien = useMemo(
    () =>
      items.reduce(
        (s, r) => s + Math.round(Number(r.qty || 0) * Number(r.unitPrice || 0)),
        0,
      ),
    [items],
  );

  const moForm = (row?: PhieuMua, xem = false) => {
    setChiXem(xem);
    setDang(row || null);
    const list: DongHang[] = row?.items?.length
      ? row.items.map((it, i) => ({
          id: `hang-${row.id}-${i}`,
          name: it.name,
          unit: it.unit,
          qty: it.qty,
          unitPrice: it.unitPrice,
          amount: it.amount ?? Math.round(it.qty * it.unitPrice),
          spec: it.spec || '',
        }))
      : [dongTrong()];
    setItems(list);
    // Chỉ cho sửa dòng khi đang nhập / chỉnh nháp
    setEditableKeys(xem ? [] : list.map((x) => x.id));
    setTep(row?.attachments || []);
    form.setFieldsValue({
      kind: row?.kind || 'VAT_TU',
      lineCode: row?.lineCode || 'MUC_03',
      purpose: row?.purpose || '',
      neededBy: row?.neededBy ? dayjs(row.neededBy) : undefined,
    });
    setMo(true);
  };

  const docHangTuBang = (): DongHang[] => {
    const tuBang =
      (bangHangRef.current?.getRowsData?.() as DongHang[] | undefined) || items;
    return tuBang.map((d) => {
      const qty = Number(d.qty || 0);
      const unitPrice = Number(d.unitPrice || 0);
      return {
        ...d,
        name: String(d.name || '').trim(),
        unit: String(d.unit || '').trim(),
        qty,
        unitPrice,
        amount: Math.round(qty * unitPrice),
        spec: String(d.spec || '').trim(),
      };
    });
  };

  const luu = async (submit: boolean) => {
    try {
      const v = await form.validateFields();
      const hang = docHangTuBang().filter(
        (it) => it.name && it.unit && it.qty > 0,
      );
      if (!hang.length) {
        message.warning('Thêm ít nhất một mặt hàng (tên, ĐVT, số lượng).');
        return;
      }
      if (submit && !tep.length) {
        message.warning('Cần đính kèm báo giá (PDF/JPG) trước khi nộp.');
        return;
      }

      setSaving(true);
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
        items: hang.map(({ name, unit, qty, unitPrice, spec, amount }) => ({
          name,
          unit,
          qty,
          unitPrice,
          amount,
          spec,
        })),
        attachments: tep,
      });
      onXong(
        submit
          ? 'Đã nộp đề nghị mua sắm — chờ PKH xử lý'
          : 'Đã lưu nháp đề nghị mua sắm',
      );
      setMo(false);
      await tai();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(bao(e));
    } finally {
      setSaving(false);
    }
  };

  const xoaDong = (id: string) => {
    Modal.confirm({
      title: 'Xóa mặt hàng?',
      content: 'Dòng hàng hóa này sẽ bị gỡ khỏi đề nghị.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setItems((list) => list.filter((d) => d.id !== id));
        setEditableKeys((keys) => keys.filter((k) => k !== id));
      },
    });
  };

  const lyDo = (nhan: string) => {
    const reason = window.prompt(nhan) || '';
    return reason.trim();
  };

  const cotHang: ProColumns<DongHang>[] = [
    {
      title: 'Tên hàng *',
      dataIndex: 'name',
      width: '22%',
      fieldProps: { placeholder: 'Tên hàng hóa…' },
      formItemProps: {
        rules: [{ required: true, message: 'Nhập tên hàng' }],
      },
    },
    {
      title: 'ĐVT *',
      dataIndex: 'unit',
      width: 88,
      fieldProps: { placeholder: 'Cái…' },
      formItemProps: {
        rules: [{ required: true, message: 'ĐVT' }],
      },
    },
    {
      title: 'Số lượng *',
      dataIndex: 'qty',
      valueType: 'digit',
      width: 100,
      fieldProps: { min: 0, style: { width: '100%' } },
      formItemProps: {
        rules: [{ required: true, message: 'SL' }],
      },
    },
    {
      title: 'Đơn giá dự kiến',
      dataIndex: 'unitPrice',
      valueType: 'digit',
      width: 140,
      fieldProps: {
        ...vndInputNumberProps,
        min: 0,
        style: { width: '100%' },
      },
      render: (_, r) => formatVnd(r.unitPrice),
    },
    {
      title: 'Thành tiền',
      dataIndex: 'amount',
      editable: false,
      width: 130,
      render: (_, r) =>
        formatVnd(Math.round(Number(r.qty || 0) * Number(r.unitPrice || 0))),
    },
    {
      title: 'Tiêu chuẩn kỹ thuật',
      dataIndex: 'spec',
      fieldProps: { placeholder: 'Thông số / yêu cầu…' },
    },
    {
      title: '',
      valueType: 'option',
      width: 64,
      render: (_, row) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => xoaDong(row.id)}
        />
      ),
    },
  ];

  return (
    <>
      {loi && <Alert type="error" style={{ marginBottom: 12 }} message={loi} />}

      <Card
        size="small"
        bordered={false}
        style={{
          marginBottom: 12,
          background: 'linear-gradient(135deg, #f0f7ff 0%, #f8fafc 100%)',
          borderRadius: 12,
        }}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space>
            <ShoppingCartOutlined style={{ color: '#1677ff', fontSize: 18 }} />
            <div>
              <Text strong>Đề nghị mua sắm</Text>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Lập danh mục hàng hóa, đính kèm báo giá — nộp để PKH nhận thông
                  báo.
                </Text>
              </div>
            </div>
          </Space>
          {coQuyenLap && (
            <Button
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => moForm()}
            >
              Đề nghị mua sắm
            </Button>
          )}
        </Space>
      </Card>

      <Table
        size="small"
        rowKey="id"
        dataSource={rows}
        locale={{ emptyText: 'Chưa có đề nghị mua sắm' }}
        columns={[
          {
            title: 'Loại',
            dataIndex: 'kind',
            width: 110,
            render: (v) => NHAN_LOAI_MUA[v as 'VAT_TU'] || v,
          },
          {
            title: 'Khoản chi',
            dataIndex: 'lineCode',
            width: 160,
            ellipsis: true,
            render: (v) => nhanMuc(v),
          },
          { title: 'Lý do / mục đích', dataIndex: 'purpose', ellipsis: true },
          {
            title: 'Thành tiền',
            dataIndex: 'totalAmount',
            width: 180,
            render: (v, r) => (
              <Space size={6} wrap>
                <Text strong>{formatVnd(v)}</Text>
                {r.overBudget ? (
                  <Tag color="error" style={{ marginInlineEnd: 0 }}>
                    Vượt dư
                  </Tag>
                ) : null}
              </Space>
            ),
          },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 140,
            render: (v) => <Tag>{NHAN_MS[v] || v}</Tag>,
          },
          {
            title: 'Thao tác',
            width: 280,
            render: (_, r) => (
              <Space wrap>
                <a onClick={() => moForm(r, true)}>Xem</a>
                {coQuyenLap &&
                  (r.status === 'MS_DRAFT' || r.status === 'MS_BS') && (
                    <a onClick={() => moForm(r, false)}>Sửa</a>
                  )}
                {vaiTro.canManage && r.status === 'MS_CHO_PKH' && (
                  <>
                    <a
                      onClick={() =>
                        pkhMuaSam(r.id, { action: 'accept' })
                          .then(() => {
                            onXong('Đã chuyển CSVC');
                            return tai();
                          })
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
        title={
          <Space>
            <ShoppingCartOutlined style={{ color: '#1677ff' }} />
            <span>
              {chiXem
                ? 'Chi tiết yêu cầu mua sắm'
                : dang
                  ? 'Sửa đề nghị mua sắm'
                  : 'Đề nghị mua sắm'}
            </span>
            {dang ? (
              <Tag>{NHAN_MS[dang.status] || dang.status}</Tag>
            ) : null}
          </Space>
        }
        placement="right"
        open={mo}
        onClose={() => setMo(false)}
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
              Tổng thành tiền:{' '}
              <Text strong type="success">
                {formatVnd(tongTien)}
              </Text>
            </Text>
            <Space wrap>
              {chiXem ? (
                <Button type="primary" onClick={() => setMo(false)}>
                  Đóng
                </Button>
              ) : (
                <>
                  <Button onClick={() => setMo(false)}>Hủy</Button>
                  <Button loading={saving} onClick={() => void luu(false)}>
                    Lưu nháp
                  </Button>
                  <Button
                    type="primary"
                    loading={saving}
                    icon={<ShoppingCartOutlined />}
                    onClick={() => void luu(true)}
                  >
                    Nộp đề nghị mua sắm
                  </Button>
                </>
              )}
            </Space>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          disabled={chiXem}
        >
          <Title level={5} style={{ marginTop: 0 }}>
            1. Thông tin đề nghị
          </Title>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="kind"
                label="Loại hàng"
                rules={[{ required: true, message: 'Chọn loại' }]}
              >
                <Select
                  options={Object.entries(NHAN_LOAI_MUA).map(
                    ([value, label]) => ({ value, label }),
                  )}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={16}>
              <Form.Item
                name="lineCode"
                label="Khoản chi"
                rules={[{ required: true, message: 'Chọn khoản chi' }]}
              >
                <Select
                  showSearch
                  optionFilterProp="label"
                  options={MUC.map((m) => ({
                    value: m.code,
                    label: nhanMuc(m.code),
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="purpose"
            label="Lý do, mục đích sử dụng"
            rules={[
              { required: true, message: 'Nhập lý do / mục đích sử dụng' },
            ]}
          >
            <Input.TextArea
              rows={3}
              showCount
              maxLength={2000}
              placeholder="Mô tả rõ lý do mua và mục đích sử dụng…"
            />
          </Form.Item>
          <Form.Item
            name="neededBy"
            label={
              <Space size={4}>
                <CalendarOutlined />
                Thời hạn cần nhận hàng
              </Space>
            }
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Chọn ngày cần nhận"
            />
          </Form.Item>
          <Divider style={{ margin: '8px 0 16px' }} />
          <Title level={5} style={{ marginTop: 0 }}>
            2. Bảng danh mục hàng hóa *
          </Title>
          <EditableProTable<DongHang>
            rowKey="id"
            size="middle"
            value={items}
            onChange={(list) => setItems([...(list || [])])}
            editableFormRef={bangHangRef}
            recordCreatorProps={
              chiXem
                ? false
                : {
                    newRecordType: 'dataSource',
                    record: () => dongTrong(),
                    creatorButtonText: 'Thêm mặt hàng',
                    icon: <PlusOutlined />,
                  }
            }
            columns={cotHang}
            editable={{
              type: 'multiple',
              editableKeys: chiXem ? [] : editableKeys,
              onChange: setEditableKeys,
              onValuesChange: (_record, list) => {
                setItems([...(list || [])]);
              },
              actionRender: (row) =>
                chiXem
                  ? []
                  : [
                      <Button
                        key="xoa"
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => xoaDong(String(row.id))}
                      />,
                    ],
            }}
            pagination={false}
            style={{ marginBottom: 8 }}
          />

          <Divider style={{ margin: '16px 0' }} />
          <Title level={5} style={{ marginTop: 0 }}>
            3. Báo giá đính kèm
          </Title>
          <Form.Item
            label={
              <Space size={4}>
                <FileProtectOutlined />
                File báo giá
                <Text type="danger">*</Text>
              </Space>
            }
            required
            extra="PDF/JPG, tối đa 10MB mỗi file. Bắt buộc khi nộp đề nghị."
          >
            <Upload
              multiple
              accept=".pdf,.jpg,.jpeg,.png,image/*,application/pdf"
              showUploadList={false}
              beforeUpload={async (file) => {
                const okType =
                  file.type === 'application/pdf' ||
                  file.type.startsWith('image/') ||
                  /\.(pdf|jpe?g|png)$/i.test(file.name);
                if (!okType) {
                  message.error('Chỉ nhận PDF hoặc JPG/PNG');
                  return Upload.LIST_IGNORE;
                }
                if (file.size > HAN_FILE.phieu) {
                  message.error('File vượt 10MB');
                  return Upload.LIST_IGNORE;
                }
                try {
                  const up = await uploadFileDon(file, { folder: 'module56' });
                  setTep((s) => [
                    ...s,
                    {
                      fileName: file.name,
                      fileUrl: up.url,
                      fileSize: file.size,
                    },
                  ]);
                  message.success(`Đã thêm ${file.name}`);
                } catch (e: any) {
                  message.error(e?.message || 'Tải file thất bại');
                }
                return Upload.LIST_IGNORE;
              }}
            >
              <Button icon={<UploadOutlined />}>Tải báo giá</Button>
            </Upload>
            {tep.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {tep.map((t) => (
                  <Tag
                    key={t.fileUrl}
                    closable
                    onClose={() =>
                      Modal.confirm({
                        title: 'Gỡ file báo giá?',
                        okText: 'Gỡ',
                        okType: 'danger',
                        cancelText: 'Hủy',
                        onOk: () =>
                          setTep((s) =>
                            s.filter((x) => x.fileUrl !== t.fileUrl),
                          ),
                      })
                    }
                    style={{ marginBottom: 4 }}
                  >
                    {t.fileName}
                  </Tag>
                ))}
              </div>
            )}
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
