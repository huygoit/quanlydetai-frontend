/**
 * Form duyệt hồ sơ tạm ứng — PKH / Phòng Tài chính.
 * PKH: Đồng ý | Yêu cầu bổ sung
 * TC: Đồng ý thanh toán (số CT + ngày) | Từ chối thanh toán
 */
import { NHAN_BCTD, NHAN_LOAI_CHI, NHAN_YCKT, nhanMuc } from '@/constants/module56';
import {
  chiTietPhieuChi,
  pkhPhieuChi,
  tcPhieuChi,
  type ChiTietPhieuChi,
} from '@/services/api/module56';
import { formatVnd } from '@/utils/format';
import {
  CheckOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  FileProtectOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Divider,
  Empty,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useState } from 'react';

const { Text, Paragraph, Title } = Typography;
const { TextArea } = Input;

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

const PaymentReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const [data, setData] = useState<ChiTietPhieuChi | null>(null);
  const [loi, setLoi] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  // PKH — yêu cầu bổ sung
  const [bsOpen, setBsOpen] = useState(false);
  const [bsNote, setBsNote] = useState('');

  // TC — đồng ý thanh toán
  const [ttOpen, setTtOpen] = useState(false);
  const [voucherNo, setVoucherNo] = useState('');
  const [voucherDate, setVoucherDate] = useState<Dayjs | null>(dayjs());

  // TC — từ chối thanh toán
  const [tcTuChoiOpen, setTcTuChoiOpen] = useState(false);
  const [tcTuChoiNote, setTcTuChoiNote] = useState('');

  const paymentId = Number(id || 0);
  const canPkh = !!access.canContractManage;
  const canTc = !!(access.canBudgetConfirm || access.canConfirmOutlineBudget);

  const tai = useCallback(() => {
    if (!paymentId) {
      setLoi('Thiếu mã hồ sơ');
      setLoading(false);
      return;
    }
    setLoading(true);
    chiTietPhieuChi(paymentId)
      .then((res) => {
        setData(res.data || null);
        setLoi('');
      })
      .catch((e) => {
        setData(null);
        setLoi(bao(e));
      })
      .finally(() => setLoading(false));
  }, [paymentId]);

  useEffect(() => {
    tai();
  }, [tai]);

  const payment = data?.payment;
  const outline = data?.outline;
  const choPkh = payment?.status === 'YCKT_PKH';
  const choTc = payment?.status === 'YCKT_TC';

  const quayLai = () => {
    if (outline?.activeContractId) {
      history.push(`/projects/contracts/${outline.activeContractId}?tab=tamung`);
      return;
    }
    history.back();
  };

  const dongYPkh = () => {
    if (!payment) return;
    Modal.confirm({
      title: 'Đồng ý hồ sơ tạm ứng?',
      content:
        'Hồ sơ sẽ chuyển Phòng Tài chính. Phòng Tài chính sẽ nhận thông báo để kiểm tra.',
      okText: 'Đồng ý',
      cancelText: 'Hủy',
      onOk: async () => {
        setActing(true);
        try {
          await pkhPhieuChi(payment.id, { action: 'accept' });
          message.success('Đã chấp thuận — đã gửi thông báo Phòng Tài chính');
          quayLai();
        } catch (e: any) {
          message.error(bao(e));
          return Promise.reject(e);
        } finally {
          setActing(false);
        }
      },
    });
  };

  const guiBoSung = async () => {
    if (!payment) return;
    if (bsNote.trim().length < 5) {
      message.warning('Nhập lý do bổ sung (tối thiểu 5 ký tự)');
      return Promise.reject();
    }
    setActing(true);
    try {
      await pkhPhieuChi(payment.id, {
        action: 'return',
        reason: bsNote.trim(),
      });
      message.success('Đã yêu cầu bổ sung — đã gửi thông báo và email chủ nhiệm');
      setBsOpen(false);
      quayLai();
    } catch (e: any) {
      message.error(bao(e));
      return Promise.reject();
    } finally {
      setActing(false);
    }
  };

  const guiThanhToan = async () => {
    if (!payment) return;
    if (!voucherNo.trim()) {
      message.warning('Nhập số chứng từ');
      return Promise.reject();
    }
    if (!voucherDate) {
      message.warning('Chọn ngày chứng từ');
      return Promise.reject();
    }
    setActing(true);
    try {
      await tcPhieuChi(payment.id, {
        accept: true,
        voucherNo: voucherNo.trim(),
        voucherDate: voucherDate.format('YYYY-MM-DD'),
      });
      message.success('Đã thanh toán');
      setTtOpen(false);
      quayLai();
    } catch (e: any) {
      message.error(bao(e));
      return Promise.reject();
    } finally {
      setActing(false);
    }
  };

  const guiTuChoiTc = async () => {
    if (!payment) return;
    if (tcTuChoiNote.trim().length < 5) {
      message.warning('Nhập lý do từ chối (tối thiểu 5 ký tự)');
      return Promise.reject();
    }
    setActing(true);
    try {
      await tcPhieuChi(payment.id, {
        accept: false,
        reason: tcTuChoiNote.trim(),
      });
      message.success('Đã từ chối thanh toán — đã thông báo PKH và chủ nhiệm');
      setTcTuChoiOpen(false);
      quayLai();
    } catch (e: any) {
      message.error(bao(e));
      return Promise.reject();
    } finally {
      setActing(false);
    }
  };

  const alertMsg = (() => {
    if (choPkh) return 'Hồ sơ tạm ứng chờ Phòng Khoa học thẩm định';
    if (choTc) return 'Hồ sơ tạm ứng chờ Phòng Tài chính thanh toán';
    return `Trạng thái: ${NHAN_YCKT[payment?.status || ''] || payment?.status || '—'}`;
  })();

  const alertDesc = (() => {
    if (choPkh)
      return 'Đối chiếu nội dung tạm ứng với báo cáo tiến độ bên dưới trước khi Đồng ý hoặc Yêu cầu bổ sung.';
    if (choTc)
      return 'Kiểm tra hồ sơ và báo cáo tiến độ. Đồng ý thanh toán cần nhập số chứng từ và ngày; từ chối sẽ thông báo PKH và chủ nhiệm.';
    return undefined;
  })();

  return (
    <PageContainer
      loading={loading}
      title="Duyệt hồ sơ tạm ứng"
      subTitle={outline ? `${outline.code} — ${outline.title}` : undefined}
      onBack={quayLai}
    >
      {loi && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={loi} />}

      {payment && outline && (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            type={choPkh || choTc ? 'warning' : 'info'}
            showIcon
            message={alertMsg}
            description={alertDesc}
          />

          <Card
            size="small"
            title={
              <Space>
                <FileProtectOutlined style={{ color: '#1677ff' }} />
                <span>Nội dung hồ sơ tạm ứng</span>
              </Space>
            }
          >
            <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
              <Descriptions.Item label="Mã nhiệm vụ">{outline.code}</Descriptions.Item>
              <Descriptions.Item label="Chủ nhiệm">
                {outline.ownerName || '—'}
                {outline.ownerUnit ? ` · ${outline.ownerUnit}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Tên nhiệm vụ" span={2}>
                {outline.title}
              </Descriptions.Item>
              <Descriptions.Item label="Loại">
                {NHAN_LOAI_CHI[payment.kind as 'TAM_UNG'] || payment.kind}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Space>
                  <Tag
                    color={
                      payment.status === 'YCKT_DONE'
                        ? 'success'
                        : payment.status === 'YCKT_TU_CHOI'
                          ? 'error'
                          : choPkh || choTc
                            ? 'orange'
                            : 'default'
                    }
                  >
                    {NHAN_YCKT[payment.status] || payment.status}
                  </Tag>
                  {payment.overBudget && <Tag color="red">Vượt dự toán</Tag>}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Khoản chi">{nhanMuc(payment.lineCode)}</Descriptions.Item>
              <Descriptions.Item label="Số tiền đề nghị">
                <Text strong type="success">
                  {formatVnd(payment.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Nội dung chi" span={2}>
                <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                  {payment.detail || '—'}
                </Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Số tài khoản">{payment.bankAccount}</Descriptions.Item>
              <Descriptions.Item label="Ngân hàng">{payment.bankName}</Descriptions.Item>
              {payment.voucherNo ? (
                <Descriptions.Item label="Số chứng từ">{payment.voucherNo}</Descriptions.Item>
              ) : null}
              {payment.voucherDate ? (
                <Descriptions.Item label="Ngày chứng từ">
                  {dayjs(payment.voucherDate).format('DD/MM/YYYY')}
                </Descriptions.Item>
              ) : null}
              {payment.returnReason ? (
                <Descriptions.Item label="Lý do" span={2}>
                  <Text type="danger">{payment.returnReason}</Text>
                </Descriptions.Item>
              ) : null}
              <Descriptions.Item label="Chứng từ đính kèm" span={2}>
                {(payment.attachments || []).length ? (
                  <Space wrap>
                    {payment.attachments.map((f) => (
                      <Button
                        key={f.fileUrl}
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        href={f.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {f.fileName || 'Tệp'}
                      </Button>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">Chưa có file</Text>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card size="small" title="Báo cáo tiến độ kèm theo (đối chiếu)">
            {(data.progress || []).length === 0 ? (
              <Empty description="Chưa có kỳ báo cáo tiến độ" />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {data.progress.map((p) => (
                  <Card
                    key={p.id}
                    type="inner"
                    size="small"
                    title={
                      <Space wrap>
                        <Text strong>{p.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Hạn {p.dueOn ? dayjs(p.dueOn).format('DD/MM/YYYY') : '—'}
                        </Text>
                        {p.report ? (
                          <Tag>{NHAN_BCTD[p.report.status] || p.report.status}</Tag>
                        ) : (
                          <Tag>Chưa nộp</Tag>
                        )}
                      </Space>
                    }
                  >
                    {!p.report ? (
                      <Text type="secondary">CNNV chưa nộp báo cáo kỳ này.</Text>
                    ) : (
                      <>
                        <Title level={5} style={{ marginTop: 0, fontSize: 14 }}>
                          Nội dung thực hiện
                        </Title>
                        <Table
                          size="small"
                          pagination={false}
                          rowKey={(_, i) => `c-${p.id}-${i}`}
                          dataSource={p.report.contentRows || []}
                          locale={{ emptyText: 'Không có dòng nội dung' }}
                          columns={[
                            {
                              title: 'Nội dung / mốc',
                              dataIndex: 'milestone',
                              ellipsis: true,
                            },
                            {
                              title: 'Tiến độ',
                              dataIndex: 'progress',
                              width: 100,
                            },
                            {
                              title: 'Kết quả đạt được',
                              dataIndex: 'done',
                              ellipsis: true,
                            },
                          ]}
                        />
                        <Divider style={{ margin: '12px 0' }} />
                        <Title level={5} style={{ marginTop: 0, fontSize: 14 }}>
                          Sản phẩm
                        </Title>
                        <Table
                          size="small"
                          pagination={false}
                          rowKey={(_, i) => `sp-${p.id}-${i}`}
                          dataSource={p.report.productRows || []}
                          locale={{ emptyText: 'Không có sản phẩm' }}
                          columns={[
                            { title: 'Sản phẩm', dataIndex: 'name', ellipsis: true },
                            {
                              title: 'Theo kế hoạch',
                              dataIndex: 'planned',
                              width: 140,
                              render: (v) => v || '—',
                            },
                            {
                              title: 'Đạt được',
                              dataIndex: 'achieved',
                              ellipsis: true,
                            },
                          ]}
                        />
                        {p.report.nextPlan ? (
                          <>
                            <Divider style={{ margin: '12px 0' }} />
                            <Text type="secondary">Kế hoạch kỳ tới: </Text>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                              {p.report.nextPlan}
                            </Paragraph>
                          </>
                        ) : null}
                        {p.report.recommendation ? (
                          <>
                            <Text type="secondary">Kiến nghị: </Text>
                            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                              {p.report.recommendation}
                            </Paragraph>
                          </>
                        ) : null}
                        {(p.report.attachments || []).length > 0 && (
                          <Space wrap>
                            <Text type="secondary">Minh chứng:</Text>
                            {p.report.attachments.map((f) => (
                              <Button
                                key={f.fileUrl}
                                type="link"
                                size="small"
                                icon={<DownloadOutlined />}
                                href={f.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {f.fileName || 'Tệp'}
                              </Button>
                            ))}
                          </Space>
                        )}
                      </>
                    )}
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Space>
      )}

      {/* Footer PKH */}
      {canPkh && choPkh && (
        <FooterToolbar>
          <Button onClick={quayLai}>Quay lại</Button>
          <Button
            danger
            icon={<RollbackOutlined />}
            loading={acting}
            onClick={() => {
              setBsNote('');
              setBsOpen(true);
            }}
          >
            Yêu cầu bổ sung
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={acting}
            onClick={dongYPkh}
          >
            Đồng ý
          </Button>
        </FooterToolbar>
      )}

      {/* Footer Phòng Tài chính */}
      {canTc && choTc && (
        <FooterToolbar>
          <Button onClick={quayLai}>Quay lại</Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            loading={acting}
            onClick={() => {
              setTcTuChoiNote('');
              setTcTuChoiOpen(true);
            }}
          >
            Từ chối thanh toán
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={acting}
            onClick={() => {
              setVoucherNo('');
              setVoucherDate(dayjs());
              setTtOpen(true);
            }}
          >
            Đồng ý thanh toán
          </Button>
        </FooterToolbar>
      )}

      <Modal
        title="Yêu cầu bổ sung hồ sơ tạm ứng"
        open={bsOpen}
        onCancel={() => setBsOpen(false)}
        okText="Gửi yêu cầu"
        okButtonProps={{ danger: true, loading: acting }}
        cancelText="Hủy"
        onOk={() => void guiBoSung()}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chủ nhiệm nhiệm vụ sẽ nhận thông báo và email chính thức kèm lý do."
        />
        <Form layout="vertical">
          <Form.Item label="Lý do / nội dung cần bổ sung" required>
            <TextArea
              rows={5}
              value={bsNote}
              onChange={(e) => setBsNote(e.target.value)}
              placeholder="Ghi rõ phần hồ sơ cần bổ sung, chỉnh sửa…"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Đồng ý thanh toán"
        open={ttOpen}
        onCancel={() => setTtOpen(false)}
        okText="Xác nhận thanh toán"
        okButtonProps={{ loading: acting }}
        cancelText="Hủy"
        onOk={() => void guiThanhToan()}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Sau khi xác nhận, hồ sơ chuyển trạng thái Đã thanh toán và ghi sổ kinh phí."
        />
        <Form layout="vertical">
          <Form.Item label="Số chứng từ" required>
            <Input
              value={voucherNo}
              onChange={(e) => setVoucherNo(e.target.value)}
              placeholder="Nhập số chứng từ…"
              maxLength={100}
            />
          </Form.Item>
          <Form.Item label="Ngày chứng từ" required>
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={voucherDate}
              onChange={(v) => setVoucherDate(v)}
              placeholder="dd/mm/yyyy"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Từ chối thanh toán"
        open={tcTuChoiOpen}
        onCancel={() => setTcTuChoiOpen(false)}
        okText="Từ chối"
        okButtonProps={{ danger: true, loading: acting }}
        cancelText="Hủy"
        onOk={() => void guiTuChoiTc()}
        destroyOnClose
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Phòng Khoa học và chủ nhiệm nhiệm vụ sẽ nhận thông báo kèm lý do từ chối."
        />
        <Form layout="vertical">
          <Form.Item label="Lý do từ chối thanh toán" required>
            <TextArea
              rows={5}
              value={tcTuChoiNote}
              onChange={(e) => setTcTuChoiNote(e.target.value)}
              placeholder="Ghi rõ lý do từ chối…"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PaymentReviewPage;
