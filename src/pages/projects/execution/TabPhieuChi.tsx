/**
 * Hồ sơ tạm ứng / thanh toán — form nhiều khoản chi (14 mục).
 */
import { HAN_FILE, NHAN_LOAI_CHI, NHAN_YCKT, nhanMuc } from '@/constants/module56';
import { optionKhoanChi } from '@/constants/khoanChi';
import {
  dsPhieuChi,
  luuPhieuChi,
  xoaPhieuChi,
  type PhieuChi,
  type TepModule56,
} from '@/services/api/module56';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import {
  BankOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FileProtectOutlined,
  MoneyCollectOutlined,
  PlusOutlined,
  UploadOutlined,
  WalletOutlined,
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
  Divider,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { uploadFileDon } from '@/services/api/fileUpload';
import { history } from '@umijs/max';
import type { VaiTro } from './types';

const { Text, Title } = Typography;

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

type DongKhoan = {
  id: string;
  lineCode?: string;
  amount?: number;
};

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
  const [dongChi, setDongChi] = useState<DongKhoan[]>([]);
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  // Ref form nội bộ EditableProTable — lấy đúng giá trị đang nhập lúc Lưu/Nộp
  const bangDongRef = useRef<EditableFormInstance<DongKhoan>>();

  const opts = useMemo(() => optionKhoanChi(), []);

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

  const tongTamUng = useMemo(
    () => dongChi.reduce((s, r) => s + Number(r.amount || 0), 0),
    [dongChi],
  );

  // Tổng tiền các hồ sơ tạm ứng trên danh sách (bỏ phiếu từ chối)
  const tongTienDanhSach = useMemo(
    () =>
      rows
        .filter((r) => r.status !== 'YCKT_TU_CHOI')
        .reduce((s, r) => s + Number(r.amount || 0), 0),
    [rows],
  );

  const moThem = () => {
    setDang(null);
    setTep([]);
    form.setFieldsValue({
      detail: '',
      bankAccount: '',
      bankName: '',
    });
    const first: DongKhoan = {
      id: `line-${Date.now()}`,
      lineCode: undefined,
      amount: undefined,
    };
    setDongChi([first]);
    setEditableKeys([first.id]);
    setMo(true);
  };

  const moSua = (row: PhieuChi) => {
    setDang(row);
    setTep(row.attachments || []);
    form.setFieldsValue({
      detail: row.detail,
      bankAccount: row.bankAccount,
      bankName: row.bankName,
    });
    const one: DongKhoan = {
      id: `line-${row.id}`,
      lineCode: row.lineCode,
      amount: row.amount,
    };
    setDongChi([one]);
    setEditableKeys([one.id]);
    setMo(true);
  };

  const luu = async (submit: boolean) => {
    try {
      const v = await form.validateFields();
      // Ưu tiên đọc từ form bảng (đang edit), fallback state
      const tuBang =
        (bangDongRef.current?.getRowsData?.() as DongKhoan[] | undefined) ||
        dongChi;
      const lines = tuBang
        .map((d) => ({
          lineCode: String(d.lineCode || '').trim(),
          amount: Number(d.amount || 0),
        }))
        .filter((d) => d.lineCode && d.amount > 0);

      if (!lines.length) {
        message.warning('Thêm ít nhất một khoản chi có số tiền.');
        return;
      }
      const codes = lines.map((l) => l.lineCode);
      if (new Set(codes).size !== codes.length) {
        message.warning('Không chọn trùng khoản chi.');
        return;
      }
      if (submit && !tep.length) {
        message.warning('Cần upload chứng từ scan trước khi nộp.');
        return;
      }

      setSaving(true);
      const chung = {
        projectOutlineId: outlineId,
        submit,
        kind: 'TAM_UNG' as const,
        detail: v.detail,
        bankAccount: v.bankAccount,
        bankName: v.bankName,
        attachments: tep,
      };
      if (dang?.id) {
        // Cập nhật phiếu đang sửa bằng dòng đầu
        await luuPhieuChi({
          id: dang.id,
          ...chung,
          lineCode: lines[0]!.lineCode,
          amount: lines[0]!.amount,
        });
        // Các khoản chi thêm lúc sửa → tạo phiếu mới cùng hồ sơ
        if (lines.length > 1) {
          await luuPhieuChi({
            ...chung,
            lines: lines.slice(1),
          });
        }
      } else {
        await luuPhieuChi({
          ...chung,
          lines,
        });
      }
      onXong(submit ? 'Đã nộp hồ sơ tạm ứng' : 'Đã lưu nháp tạm ứng');
      setMo(false);
      await tai();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(bao(e));
    } finally {
      setSaving(false);
    }
  };

  // Xóa một dòng khoản chi khỏi bảng — luôn hỏi xác nhận
  const xoaDong = (id: string) => {
    Modal.confirm({
      title: 'Xóa khoản chi?',
      content: 'Dòng khoản chi này sẽ bị gỡ khỏi yêu cầu tạm ứng.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: () => {
        setDongChi((list) => list.filter((d) => d.id !== id));
        setEditableKeys((keys) => keys.filter((k) => k !== id));
      },
    });
  };

  /** Tải báo cáo/chứng từ — sau này nối xuất BM.07 */
  const taiBaoCao = (row: PhieuChi) => {
    const files = row.attachments || [];
    if (files.length) {
      files.forEach((f) => {
        if (f.fileUrl) window.open(f.fileUrl, '_blank', 'noopener,noreferrer');
      });
      return;
    }
    message.info(
      'Biểu mẫu tạm ứng (BM.07) sẽ được bổ sung để tải về. Hiện chưa có file đính kèm.',
    );
  };

  // Xóa yêu cầu tạm ứng trên danh sách (nháp / cần bổ sung)
  const xoaPhieu = (row: PhieuChi) => {
    Modal.confirm({
      title: 'Xóa yêu cầu tạm ứng?',
      content: `Xóa khoản「${nhanMuc(row.lineCode)}」— ${formatVnd(row.amount)}? Thao tác không hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await xoaPhieuChi(row.id);
          onXong('Đã xóa yêu cầu tạm ứng');
          await tai();
        } catch (e: any) {
          message.error(bao(e));
          return Promise.reject(e);
        }
      },
    });
  };

  /** Nộp hồ sơ từ danh sách → PKH nhận thông báo */
  const nopHoSo = (row: PhieuChi) => {
    if (!row.attachments?.length) {
      message.warning('Cần upload chứng từ trước khi nộp. Mở Sửa để bổ sung file.');
      return;
    }
    if (!row.detail?.trim() || !row.bankAccount?.trim() || !row.bankName?.trim()) {
      message.warning('Hồ sơ chưa đủ thông tin. Mở Sửa để hoàn thiện.');
      return;
    }
    Modal.confirm({
      title: 'Nộp hồ sơ tạm ứng?',
      content:
        'Hồ sơ sẽ chuyển Phòng Khoa học thẩm định. Phòng Khoa học sẽ nhận thông báo.',
      okText: 'Nộp hồ sơ',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await luuPhieuChi({
            id: row.id,
            projectOutlineId: outlineId,
            submit: true,
            kind: row.kind,
            detail: row.detail,
            bankAccount: row.bankAccount,
            bankName: row.bankName,
            attachments: row.attachments,
            lineCode: row.lineCode,
            amount: row.amount,
          });
          onXong('Đã nộp hồ sơ tạm ứng');
          await tai();
        } catch (e: any) {
          message.error(bao(e));
          return Promise.reject(e);
        }
      },
    });
  };

  // Mã khoản chi đã chọn trên các dòng khác → không cho trùng
  const maDaChon = useMemo(
    () =>
      new Set(
        dongChi.map((d) => String(d.lineCode || '').trim()).filter(Boolean),
      ),
    [dongChi],
  );

  const cotDong: ProColumns<DongKhoan>[] = [
    {
      title: 'Khoản chi',
      dataIndex: 'lineCode',
      width: '62%',
      valueType: 'select',
      fieldProps: (_form, { entity }) => {
        const maDong = String(entity?.lineCode || '').trim();
        return {
          showSearch: true,
          allowClear: true,
          options: opts.map((o) => ({
            ...o,
            // Khóa option đã dùng ở dòng khác (giữ option của chính dòng đang sửa)
            disabled: maDaChon.has(String(o.value)) && String(o.value) !== maDong,
          })),
          optionFilterProp: 'label',
          placeholder: 'Gõ để tìm / chọn khoản chi…',
          style: { width: '100%' },
        };
      },
      formItemProps: (_form, { entity }) => ({
        rules: [
          { required: true, message: 'Chọn khoản chi' },
          {
            // Validate trùng khoản chi giữa các dòng trong bảng
            validator: async (_rule, value) => {
              const ma = String(value || '').trim();
              if (!ma) return;
              const trung = dongChi.some(
                (d) =>
                  d.id !== entity?.id &&
                  String(d.lineCode || '').trim() === ma,
              );
              if (trung) {
                throw new Error('Khoản chi này đã được chọn ở dòng khác');
              }
            },
          },
        ],
      }),
      render: (_, r) =>
        r.lineCode ? (
          <Text>{nhanMuc(r.lineCode)}</Text>
        ) : (
          <Text type="secondary">Chưa chọn</Text>
        ),
    },
    {
      title: 'Kinh phí (VNĐ)',
      dataIndex: 'amount',
      width: '28%',
      valueType: 'digit',
      fieldProps: {
        ...vndInputNumberProps,
        min: 0,
        style: { width: '100%' },
        placeholder: '0',
      },
      formItemProps: {
        rules: [{ required: true, message: 'Nhập kinh phí' }],
      },
      render: (_, r) => formatVnd(r.amount),
    },
    {
      title: '',
      valueType: 'option',
      width: 72,
      // Nút xóa hiển thị cả lúc xem/sửa dòng
      render: (_, row) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => xoaDong(row.id)}
        >
          Xóa
        </Button>
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
          background: '#fafbfc',
          borderRadius: 8,
          border: '1px solid #f0f0f0',
        }}
        bodyStyle={{ padding: '10px 14px' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Space size={8} align="center">
              <WalletOutlined style={{ color: '#1677ff', fontSize: 16 }} />
              <Text strong>Hồ sơ tạm ứng</Text>
            </Space>
            <div style={{ marginTop: 2, marginLeft: 24 }}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Tổng tiền tạm ứng:{' '}
              </Text>
              <Text
                strong
                style={{
                  color: '#237804',
                  fontSize: 15,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                <MoneyCollectOutlined style={{ marginRight: 4 }} />
                {formatVnd(tongTienDanhSach)}
              </Text>
            </div>
          </div>

          <Tooltip
            title={
              vaiTro.canCnnv
                ? undefined
                : 'Chỉ chủ nhiệm nhiệm vụ được tạo / nộp hồ sơ tạm ứng'
            }
          >
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              disabled={!vaiTro.canCnnv}
              onClick={moThem}
            >
              Thêm yêu cầu tạm ứng
            </Button>
          </Tooltip>
        </div>
      </Card>

      <Table
        size="small"
        rowKey="id"
        dataSource={rows}
        locale={{ emptyText: 'Chưa có hồ sơ tạm ứng' }}
        columns={[
          {
            title: 'Loại',
            dataIndex: 'kind',
            width: 100,
            render: (v) => NHAN_LOAI_CHI[v as 'TAM_UNG'] || v,
          },
          {
            title: 'Khoản chi',
            dataIndex: 'lineCode',
            ellipsis: true,
            render: (v) => nhanMuc(v),
          },
          {
            title: 'Số tiền',
            dataIndex: 'amount',
            width: 140,
            render: (v) => formatVnd(v),
          },
          { title: 'Nội dung', dataIndex: 'detail', ellipsis: true },
          {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: 150,
            render: (v, r) => (
              <Space>
                <Tag>{NHAN_YCKT[v] || v}</Tag>
                {r.overBudget && (
                  <Tag color="red" title="Số tiền vượt dư toán còn lại của khoản chi này">
                    Vượt dư toán
                  </Tag>
                )}
              </Space>
            ),
          },
          {
            title: 'Tải báo cáo',
            width: 120,
            align: 'center',
            render: (_, r) => (
              <Tooltip
                title={
                  r.attachments?.length
                    ? 'Tải chứng từ đính kèm'
                    : 'Biểu mẫu BM.07 sẽ bổ sung sau'
                }
              >
                <Button
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => taiBaoCao(r)}
                >
                  Tải về
                </Button>
              </Tooltip>
            ),
          },
          {
            title: 'Thao tác',
            width: 300,
            render: (_, r) => {
              const nhapHoacBs =
                r.status === 'YCKT_DRAFT' || r.status === 'YCKT_BS';
              return (
                <Space wrap>
                  {nhapHoacBs && (
                    <>
                      {vaiTro.canCnnv ? (
                        <>
                          <a onClick={() => moSua(r)}>Sửa</a>
                          <a onClick={() => nopHoSo(r)}>Nộp hồ sơ</a>
                          <a
                            style={{ color: '#ff4d4f' }}
                            onClick={() => xoaPhieu(r)}
                          >
                            Xóa
                          </a>
                        </>
                      ) : (
                        <Tooltip title="Chỉ chủ nhiệm nhiệm vụ được nộp / sửa hồ sơ tạm ứng">
                          <Space>
                            <Button type="link" size="small" disabled>
                              Sửa
                            </Button>
                            <Button type="link" size="small" disabled>
                              Nộp hồ sơ
                            </Button>
                            <Button type="link" size="small" danger disabled>
                              Xóa
                            </Button>
                          </Space>
                        </Tooltip>
                      )}
                    </>
                  )}
                  {/* PKH duyệt */}
                  {vaiTro.canManage && r.status === 'YCKT_PKH' && (
                    <a
                      onClick={() => history.push(`/projects/payments/${r.id}`)}
                    >
                      Xem xét
                    </a>
                  )}
                  {/* TC thanh toán */}
                  {vaiTro.canTc && r.status === 'YCKT_TC' && (
                    <a
                      onClick={() => history.push(`/projects/payments/${r.id}`)}
                    >
                      Thanh toán
                    </a>
                  )}
                  {/* CNNV xem hồ sơ đã nộp (chờ PKH / chờ TC / kết thúc) */}
                  {vaiTro.canCnnv &&
                    !vaiTro.canManage &&
                    (r.status === 'YCKT_PKH' ||
                      r.status === 'YCKT_TC' ||
                      r.status === 'YCKT_DONE' ||
                      r.status === 'YCKT_TU_CHOI') && (
                      <a
                        onClick={() =>
                          history.push(`/projects/payments/${r.id}`)
                        }
                      >
                        Xem
                      </a>
                    )}
                  {/* PKH / TC xem hồ sơ đã kết thúc */}
                  {(vaiTro.canManage || vaiTro.canTc) &&
                    (r.status === 'YCKT_DONE' ||
                      r.status === 'YCKT_TU_CHOI') && (
                      <a
                        onClick={() =>
                          history.push(`/projects/payments/${r.id}`)
                        }
                      >
                        Xem
                      </a>
                    )}
                </Space>
              );
            },
          },
        ]}
      />

      <Drawer
        title={
          <Space>
            <WalletOutlined style={{ color: '#1677ff' }} />
            <span>
              {dang ? 'Sửa yêu cầu tạm ứng' : 'Thêm yêu cầu tạm ứng'}
            </span>
          </Space>
        }
        placement="right"
        open={mo}
        onClose={() => setMo(false)}
        width={720}
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
              Tổng tạm ứng:{' '}
              <Text strong type="success">
                {formatVnd(tongTamUng)}
              </Text>
            </Text>
            <Space wrap>
              <Button onClick={() => setMo(false)}>Hủy</Button>
              <Tooltip
                title={
                  vaiTro.canCnnv
                    ? undefined
                    : 'Chỉ chủ nhiệm nhiệm vụ được lưu / nộp hồ sơ tạm ứng'
                }
              >
                <Button
                  loading={saving}
                  disabled={!vaiTro.canCnnv}
                  onClick={() => void luu(false)}
                >
                  Lưu nháp
                </Button>
              </Tooltip>
              <Tooltip
                title={
                  vaiTro.canCnnv
                    ? undefined
                    : 'Chỉ chủ nhiệm nhiệm vụ được nộp hồ sơ tạm ứng'
                }
              >
                <Button
                  type="primary"
                  loading={saving}
                  disabled={!vaiTro.canCnnv}
                  onClick={() => void luu(true)}
                >
                  Nộp hồ sơ tạm ứng
                </Button>
              </Tooltip>
            </Space>
          </div>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Chọn một hoặc nhiều khoản chi từ danh mục 14 mục, nhập kinh phí từng dòng."
        />

        <Title level={5} style={{ marginTop: 0 }}>
          1. Khoản chi tạm ứng
        </Title>
        <EditableProTable<DongKhoan>
          rowKey="id"
          size="middle"
          value={dongChi}
          onChange={(list) => setDongChi([...(list || [])])}
          editableFormRef={bangDongRef}
          recordCreatorProps={{
            newRecordType: 'dataSource',
            record: () => ({
              id: `line-${Date.now()}`,
              lineCode: undefined,
              amount: undefined,
            }),
            creatorButtonText: 'Thêm dòng khoản chi',
            icon: <PlusOutlined />,
          }}
          columns={cotDong}
          editable={{
            type: 'multiple',
            editableKeys,
            onChange: setEditableKeys,
            // Đồng bộ giá trị đang nhập (select/số tiền) vào state — tránh lưu vẫn thấy trống
            onValuesChange: (_record, list) => {
              setDongChi([...(list || [])]);
            },
            actionRender: (row) => [
              <Button
                key="xoa"
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => xoaDong(String(row.id))}
              >
                Xóa
              </Button>,
            ],
          }}
          pagination={false}
          style={{ marginBottom: 8 }}
        />

        <Divider style={{ margin: '16px 0' }} />

        <Title level={5} style={{ marginTop: 0 }}>
          2. Thông tin nhận tạm ứng
        </Title>
        <Form form={form} layout="vertical" requiredMark="optional">
          <Form.Item
            name="detail"
            label="Nội dung chi tiết"
            rules={[{ required: true, message: 'Nhập nội dung chi tiết' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả rõ mục đích tạm ứng, giai đoạn thực hiện…"
              showCount
              maxLength={2000}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="bankAccount"
                label={
                  <Space size={4}>
                    <BankOutlined />
                    Số tài khoản nhận
                  </Space>
                }
                rules={[{ required: true, message: 'Nhập số tài khoản' }]}
              >
                <Input placeholder="Số tài khoản thụ hưởng" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="bankName"
                label="Ngân hàng"
                rules={[{ required: true, message: 'Nhập tên ngân hàng' }]}
              >
                <Input placeholder="VD: Vietcombank — CN Đà Nẵng" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={
              <Space size={4}>
                <FileProtectOutlined />
                Chứng từ scan
                <Text type="danger">*</Text>
              </Space>
            }
            required
            extra="Bắt buộc khi nộp hồ sơ. PDF/ảnh, tối đa 10MB mỗi file."
          >
            <Upload
              multiple
              showUploadList={false}
              beforeUpload={async (file) => {
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
              <Button icon={<UploadOutlined />}>Tải chứng từ scan</Button>
            </Upload>
            {tep.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {tep.map((t) => (
                  <Tag
                    key={t.fileUrl}
                    closable
                    onClose={() =>
                      setTep((s) => s.filter((x) => x.fileUrl !== t.fileUrl))
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
