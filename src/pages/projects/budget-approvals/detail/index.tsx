/**
 * US-04-06 — Chi tiết đề xuất / thẩm tra / phê duyệt kinh phí
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Tag,
  message,
} from 'antd';
import { history, useAccess, useParams } from '@umijs/max';
import { useEffect, useState } from 'react';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import {
  getBudgetConfirmation,
  pkhProposeBudget,
  tcBudgetAction,
  ldBudgetDecide,
  type BudgetConfirmation,
} from '@/services/api/projectOutlineBudgets';
import { OUTLINE_STATUS_MAP, type ProjectOutlineStatus } from '@/services/api/projectOutlines';

const { TextArea } = Input;

const BudgetApprovalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const outlineId = Number(id);
  const access = useAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BudgetConfirmation | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    if (!outlineId) return;
    setLoading(true);
    try {
      const res = await getBudgetConfirmation(outlineId);
      setData(res.data);
      form.setFieldsValue({
        proposedBudget: res.data.pkhProposedBudget ?? res.data.requestedBudgetSnapshot,
        note: res.data.pkhNote,
        largeBudgetCouncilDone: res.data.largeBudgetCouncilDone,
        largeBudgetCouncilNote: res.data.largeBudgetCouncilNote,
        largeBudgetMinutesUrl: res.data.largeBudgetMinutesUrl,
        confirmedBudget: res.data.tcConfirmedBudget ?? res.data.pkhProposedBudget,
        tcNote: res.data.tcNote,
      });
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId]);

  if (!access.canViewOutlineBudgetFlow) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền." />
      </PageContainer>
    );
  }

  const roles = data?.roles;
  const o = data?.outline;
  const outlineStatus = o?.status as ProjectOutlineStatus | undefined;
  const canPkh =
    roles?.canPkhPropose && outlineStatus === 'CHO_XAC_NHAN_KP' && access.canProposeOutlineBudget;
  const canTc =
    roles?.canTcConfirm && outlineStatus === 'CHO_TC_THAM_TRA' && access.canConfirmOutlineBudget;
  const canLd =
    roles?.canLdApprove && outlineStatus === 'LDPD_PENDING' && access.canApproveOutlineBudget;

  const savePkh = async (sendToTc: boolean) => {
    if (!data) return;
    try {
      const v = await form.validateFields(['proposedBudget']);
      setSaving(true);
      const res = await pkhProposeBudget(outlineId, {
        proposedBudget: Number(v.proposedBudget),
        note: form.getFieldValue('note'),
        sendToTc,
        largeBudgetCouncilDone: form.getFieldValue('largeBudgetCouncilDone'),
        largeBudgetCouncilNote: form.getFieldValue('largeBudgetCouncilNote'),
        largeBudgetMinutesUrl: form.getFieldValue('largeBudgetMinutesUrl'),
        expectedVersion: data.version,
      });
      message.success(res.message || 'OK');
      await load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.data?.message || e?.message || 'Thất bại');
    } finally {
      setSaving(false);
    }
  };

  const doTc = (action: 'CONFIRM' | 'RETURN') => {
    if (!data) return;
    if (action === 'RETURN') {
      let reason = '';
      Modal.confirm({
        title: 'Trả lại PKH',
        content: (
          <TextArea
            rows={3}
            placeholder="Lý do (≥ 5 ký tự)"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        ),
        onOk: async () => {
          if (reason.trim().length < 5) {
            message.warning('Nhập lý do');
            return Promise.reject();
          }
          setSaving(true);
          try {
            const res = await tcBudgetAction(outlineId, {
              action: 'RETURN',
              returnReason: reason.trim(),
              note: form.getFieldValue('tcNote'),
              expectedVersion: data.version,
            });
            message.success(res.message);
            await load();
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
            return Promise.reject();
          } finally {
            setSaving(false);
          }
        },
      });
      return;
    }
    Modal.confirm({
      title: 'Xác nhận mức kinh phí trình LĐ?',
      content: 'LĐ sẽ không tự nhập mức cấp — dùng mức TC xác nhận.',
      onOk: async () => {
        setSaving(true);
        try {
          const res = await tcBudgetAction(outlineId, {
            action: 'CONFIRM',
            confirmedBudget: form.getFieldValue('confirmedBudget'),
            note: form.getFieldValue('tcNote'),
            expectedVersion: data.version,
          });
          message.success(res.message);
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const doLd = (decision: 'APPROVE' | 'REJECT' | 'RETURN') => {
    if (!data) return;
    if (decision === 'REJECT') {
      let reason = '';
      Modal.confirm({
        title: 'Không phê duyệt',
        content: (
          <TextArea
            rows={3}
            placeholder="Lý do bắt buộc"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        ),
        onOk: async () => {
          if (reason.trim().length < 5) {
            message.warning('Nhập lý do');
            return Promise.reject();
          }
          setSaving(true);
          try {
            const res = await ldBudgetDecide(outlineId, {
              decision: 'REJECT',
              rejectReason: reason.trim(),
              expectedVersion: data.version,
            });
            message.success(res.message);
            await load();
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
            return Promise.reject();
          } finally {
            setSaving(false);
          }
        },
      });
      return;
    }
    if (decision === 'RETURN') {
      Modal.confirm({
        title: 'Yêu cầu xem xét lại — trả PKH?',
        onOk: async () => {
          setSaving(true);
          try {
            const res = await ldBudgetDecide(outlineId, {
              decision: 'RETURN',
              returnTarget: 'PKH',
              note: 'LĐ yêu cầu xem xét lại',
              expectedVersion: data.version,
            });
            message.success(res.message);
            await load();
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
          } finally {
            setSaving(false);
          }
        },
      });
      return;
    }
    Modal.confirm({
      title: 'Phê duyệt chính thức?',
      content: `Mức kinh phí: ${formatVnd(data.tcConfirmedBudget)}. Mở Module 5 sau phê duyệt.`,
      onOk: async () => {
        setSaving(true);
        try {
          const res = await ldBudgetDecide(outlineId, {
            decision: 'APPROVE',
            expectedVersion: data.version,
          });
          message.success(res.message);
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const proposedWatch = Form.useWatch('proposedBudget', form);
  const showLarge =
    Number(proposedWatch || data?.pkhProposedBudget || 0) >=
    Number(data?.largeBudgetThreshold || 500_000_000);

  return (
    <PageContainer
      loading={loading}
      title={o ? `Kinh phí — ${o.code}` : 'Xác nhận kinh phí'}
      onBack={() => history.push('/projects/budget-approvals')}
    >
      {data && (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Đề tài" span={2}>
                {o?.title}
              </Descriptions.Item>
              <Descriptions.Item label="CNĐT">{o?.ownerName}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái TM">
                {outlineStatus ? (
                  <Tag color={OUTLINE_STATUS_MAP[outlineStatus]?.color}>
                    {OUTLINE_STATUS_MAP[outlineStatus]?.label}
                  </Tag>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="KP đề nghị">
                {formatVnd(data.requestedBudgetSnapshot)}
              </Descriptions.Item>
              <Descriptions.Item label="Phiếu KP">{data.status}</Descriptions.Item>
              {data.deviationWarning && (
                <Descriptions.Item label="Cảnh báo" span={2}>
                  <Alert
                    type="warning"
                    showIcon
                    message={
                      data.requestedZeroException
                        ? 'Kinh phí đề nghị = 0 — không dùng công thức tỷ lệ chênh lệch.'
                        : `Chênh lệch > 20% so với đề nghị (hiện ${data.deviationRate}%). Không tự chặn.`
                    }
                  />
                </Descriptions.Item>
              )}
              {data.tcReturnReason && (
                <Descriptions.Item label="TC trả lại" span={2}>
                  {data.tcReturnReason}
                </Descriptions.Item>
              )}
              {data.approvedBudget != null && (
                <Descriptions.Item label="KP đã phê duyệt" span={2}>
                  <strong>{formatVnd(data.approvedBudget)}</strong>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Form form={form} layout="vertical">
            {canPkh && (
              <Card
                size="small"
                title="PKH đề xuất kinh phí"
                style={{ marginBottom: 16 }}
                extra={
                  <Space>
                    <Button loading={saving} onClick={() => void savePkh(false)}>
                      Lưu nháp
                    </Button>
                    <Button type="primary" loading={saving} onClick={() => void savePkh(true)}>
                      Gửi TC thẩm tra
                    </Button>
                  </Space>
                }
              >
                <Form.Item
                  name="proposedBudget"
                  label="Mức kinh phí đề xuất (VNĐ)"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    style={{ width: 280 }}
                    min={0}
                    {...vndInputNumberProps}
                    addonAfter="đ"
                  />
                </Form.Item>
                <Form.Item name="note" label="Căn cứ / ghi chú">
                  <TextArea rows={3} />
                </Form.Item>
                {showLarge && (
                  <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message={`Vượt ngưỡng KP lớn (${formatVnd(data.largeBudgetThreshold)}). Cần hoàn tất HĐ xét duyệt KP tăng cường trước khi gửi TC.`}
                  />
                )}
                {showLarge && (
                  <>
                    <Form.Item name="largeBudgetCouncilDone" valuePropName="checked">
                      <Checkbox>Đã hoàn tất bước xét duyệt kinh phí tăng cường</Checkbox>
                    </Form.Item>
                    <Form.Item name="largeBudgetCouncilNote" label="Ghi chú / kết quả HĐ KP">
                      <TextArea rows={2} />
                    </Form.Item>
                    <Form.Item name="largeBudgetMinutesUrl" label="Link biên bản (nếu có)">
                      <Input />
                    </Form.Item>
                  </>
                )}
              </Card>
            )}

            {canTc && (
              <Card
                size="small"
                title="TC thẩm tra / xác nhận"
                style={{ marginBottom: 16 }}
                extra={
                  <Space>
                    <Button danger loading={saving} onClick={() => doTc('RETURN')}>
                      Trả PKH
                    </Button>
                    <Button type="primary" loading={saving} onClick={() => doTc('CONFIRM')}>
                      Xác nhận → LĐ
                    </Button>
                  </Space>
                }
              >
                <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
                  <Descriptions.Item label="PKH đề xuất">
                    {formatVnd(data.pkhProposedBudget)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú PKH">{data.pkhNote || '—'}</Descriptions.Item>
                </Descriptions>
                <Form.Item name="confirmedBudget" label="Mức TC xác nhận / điều chỉnh">
                  <InputNumber
                    style={{ width: 280 }}
                    min={0}
                    {...vndInputNumberProps}
                    addonAfter="đ"
                  />
                </Form.Item>
                <Form.Item
                  name="tcNote"
                  label="Căn cứ (bắt buộc nếu điều chỉnh khác mức PKH)"
                >
                  <TextArea rows={3} />
                </Form.Item>
              </Card>
            )}

            {canLd && (
              <Card
                size="small"
                title="Lãnh đạo phê duyệt"
                extra={
                  <Space>
                    <Button onClick={() => doLd('RETURN')}>Yêu cầu xem xét lại</Button>
                    <Button danger loading={saving} onClick={() => doLd('REJECT')}>
                      Không phê duyệt
                    </Button>
                    <Button type="primary" loading={saving} onClick={() => doLd('APPROVE')}>
                      Phê duyệt
                    </Button>
                  </Space>
                }
              >
                <Alert
                  type="info"
                  showIcon
                  message="LĐ không nhập mức kinh phí cấp. Mức trình duyệt do PKH+TC xác nhận."
                  description={`Mức trình: ${formatVnd(data.tcConfirmedBudget)}`}
                />
              </Card>
            )}

            {!canPkh && !canTc && !canLd && (
              <Alert
                type="success"
                showIcon
                message="Chỉ xem — hồ sơ không ở bước bạn được thao tác hoặc đã kết thúc."
              />
            )}
          </Form>
        </>
      )}
    </PageContainer>
  );
};

export default BudgetApprovalDetailPage;
