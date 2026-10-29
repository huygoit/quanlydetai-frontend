/**
 * Form biên bản họp HĐ (BM-02.10) — chỉ Thư ký điền/chốt
 */
import {
  getDefenseMinutes,
  saveDefenseMinutes,
  finalizeDefenseSession,
  reopenDefenseMinutes,
  COUNCIL_CONCLUSION_OPTIONS,
  DEFENSE_ROLE_OPTIONS,
  type CouncilMinutesConclusion,
} from '@/services/api/projectOutlineDefenses';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { SaveOutlined, SendOutlined, UnlockOutlined } from '@ant-design/icons';
import { FooterToolbar } from '@ant-design/pro-components';
import { history, useAccess } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const { TextArea } = Input;
const { Text } = Typography;

type Props = { sessionId: number };

const BienBanThamDinh: React.FC<Props> = ({ sessionId }) => {
  const access = useAccess();
  const canPkh = !!access.canManageOutlineDefense;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ctx, setCtx] = useState<any>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDefenseMinutes(sessionId);
      const d = res.data;
      setCtx(d);
      form.setFieldsValue({
        recommendations: d.recommendations || '',
        attendances: Object.fromEntries(
          (d.members || []).map((m: any) => [m.id, m.attendance || 'PENDING']),
        ),
        items: (d.outlines || []).map((b: any) => ({
          projectOutlineId: b.outline.id,
          councilConclusion: b.minutesItem?.councilConclusion || undefined,
          executionContent: b.minutesItem?.executionContent || '',
          adjustmentRequirements: b.minutesItem?.adjustmentRequirements || '',
          adjustmentDeadline: b.minutesItem?.adjustmentDeadline
            ? dayjs(b.minutesItem.adjustmentDeadline)
            : null,
          note: b.minutesItem?.note || '',
        })),
      });
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải biên bản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const buildPayload = () => {
    const v = form.getFieldsValue();
    const attendances = (ctx?.members || []).map((m: any) => ({
      memberId: m.id,
      attendance: v.attendances?.[m.id] || 'PENDING',
    }));
    const items = (v.items || []).map((it: any) => ({
      projectOutlineId: it.projectOutlineId,
      councilConclusion: it.councilConclusion as CouncilMinutesConclusion,
      executionContent: it.executionContent || null,
      adjustmentRequirements: it.adjustmentRequirements || null,
      adjustmentDeadline: it.adjustmentDeadline
        ? (it.adjustmentDeadline as dayjs.Dayjs).toISOString()
        : null,
      note: it.note || null,
    }));
    return {
      recommendations: v.recommendations || null,
      attendances,
      items,
    };
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
    } catch {
      message.warning('Điền đủ kết luận từng nhiệm vụ');
      return;
    }
    setSaving(true);
    try {
      const res = await saveDefenseMinutes(sessionId, buildPayload());
      setCtx({ ...res.data, isThuKy: true });
      message.success(res.message || 'Đã lưu nháp');
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      await form.validateFields();
    } catch {
      message.warning('Điền đủ kết luận từng nhiệm vụ');
      return;
    }
    Modal.confirm({
      title: 'Chốt biên bản thẩm định?',
      content:
        'Hệ thống tạo PDF BM.05b, khóa biên bản và cập nhật trạng thái từng TM. PKH có thể mở khóa nếu BGH chưa duyệt/ký số.',
      okText: 'Chốt biên bản',
      onOk: async () => {
        setSaving(true);
        try {
          const res = await finalizeDefenseSession(sessionId, buildPayload());
          setCtx({ ...res.data, isThuKy: true });
          message.success(res.message || 'Đã chốt');
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Chốt thất bại');
          return Promise.reject();
        } finally {
          setSaving(false);
        }
      },
    });
  };

  if (loading && !ctx) return <Card loading />;

  const locked = !!ctx?.locked;
  const editable = !!ctx?.isThuKy && !locked && !!ctx?.canOpenMinutes;
  // Thư ký hoặc PKH — khi biên bản đã chốt và BGH chưa duyệt/ký
  const canReopen =
    locked && !!ctx?.canReopenMinutes && (!!ctx?.isThuKy || canPkh);
  const chuTri = (ctx?.members || []).find((m: any) => m.roleInCouncil === 'CHU_TICH');
  const thuKy = (ctx?.members || []).find((m: any) => m.roleInCouncil === 'THU_KY');
  const pdfUrl = resolvePublicAssetUrl(ctx?.minutesFileUrl);

  const handleReopen = () => {
    let reason = '';
    Modal.confirm({
      title: 'Mở khóa biên bản để cập nhật?',
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>
            Chỉ được mở khi BGH chưa duyệt và ký số. Sau khi mở khóa, Thư ký chỉnh sửa rồi chốt lại.
          </p>
          <Input.TextArea
            rows={2}
            placeholder="Lý do mở khóa (tuỳ chọn)"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </div>
      ),
      okText: 'Mở khóa',
      onOk: async () => {
        setSaving(true);
        try {
          await reopenDefenseMinutes(sessionId, reason);
          message.success('Đã mở khóa biên bản');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Mở khóa thất bại');
          return Promise.reject();
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {!ctx?.canOpenMinutes && !locked ? (
        <Alert type="warning" showIcon message={ctx?.gateMessage || 'Chưa mở biên bản.'} />
      ) : null}
      {locked ? (
        <Alert
          type="success"
          showIcon
          message="Biên bản đã chốt và khóa"
          description={
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {pdfUrl ? (
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  Tải / xem biên bản BM.05b
                </a>
              ) : null}
              {canReopen ? (
                <>
                  <Text>
                    BGH chưa duyệt/ký — bấm nút dưới để mở khóa và cập nhật lại biên bản.
                  </Text>
                  <Button
                    type="primary"
                    icon={<UnlockOutlined />}
                    loading={saving}
                    onClick={handleReopen}
                  >
                    Mở khóa biên bản
                  </Button>
                </>
              ) : (
                <Text type="secondary">
                  Không mở khóa được khi BGH đã duyệt/ký số hoặc đã phát hành QĐ giao nhiệm vụ.
                </Text>
              )}
            </Space>
          }
        />
      ) : null}
      {!ctx?.isThuKy && !canPkh ? (
        <Alert type="info" showIcon message="Chỉ Thư ký hội đồng của phiên này được ghi/chốt biên bản. Bạn đang xem." />
      ) : null}

      <Card
        size="small"
        title="BIÊN BẢN HỌP HỘI ĐỒNG ĐÁNH GIÁ HỒ SƠ (BM-02.10)"
        extra={
          canReopen ? (
            <Button
              type="primary"
              ghost
              size="small"
              icon={<UnlockOutlined />}
              loading={saving}
              onClick={handleReopen}
            >
              Mở khóa biên bản
            </Button>
          ) : null
        }
      >
        <Descriptions column={1} size="small" style={{ marginBottom: 12 }}>
          <Descriptions.Item label="QĐ thành lập HĐ">{ctx?.decisionCode || '—'}</Descriptions.Item>
          <Descriptions.Item label="1. Thời gian">
            {ctx?.meetingAt ? dayjs(ctx.meetingAt).format('HH:mm DD/MM/YYYY') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Địa điểm / Link">
            {[ctx?.location, ctx?.meetingUrl].filter(Boolean).join(' | ') || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="2. Chủ trì">{chuTri?.memberName || '—'}</Descriptions.Item>
          <Descriptions.Item label="Thư ký">{thuKy?.memberName || '—'}</Descriptions.Item>
        </Descriptions>

        <Form form={form} layout="vertical" disabled={!editable}>
          <Text strong>Điểm danh thành viên</Text>
          <Table
            size="small"
            style={{ marginTop: 8, marginBottom: 16 }}
            pagination={false}
            rowKey="id"
            dataSource={ctx?.members || []}
            columns={[
              { title: 'Họ tên', dataIndex: 'memberName' },
              {
                title: 'Vai trò',
                width: 140,
                render: (_: unknown, m: any) =>
                  DEFENSE_ROLE_OPTIONS.find((o) => o.value === m.roleInCouncil)?.label ||
                  m.roleInCouncil,
              },
              {
                title: 'Có mặt',
                width: 140,
                render: (_: unknown, m: any) => (
                  <Form.Item name={['attendances', m.id]} style={{ marginBottom: 0 }}>
                    <Select
                      options={[
                        { value: 'PRESENT', label: 'Có mặt' },
                        { value: 'ABSENT', label: 'Vắng' },
                        { value: 'PENDING', label: 'Chưa ghi' },
                      ]}
                    />
                  </Form.Item>
                ),
              },
            ]}
          />

          <Text strong>3. Kết quả đánh giá từng nhiệm vụ</Text>
          <Form.List name="items">
            {(fields) => (
              <>
                {fields.map((field, index) => {
                  const block = ctx?.outlines?.[index];
                  const o = block?.outline;
                  const sum = block?.scoreSummary;
                  return (
                    <Card
                      key={field.key}
                      type="inner"
                      size="small"
                      style={{ marginTop: 12 }}
                      title={
                        o ? (
                          <Space>
                            <a onClick={() => history.push(`/projects/outlines/form/${o.id}`)}>
                              {o.code}
                            </a>
                            <span>— {o.title}</span>
                          </Space>
                        ) : (
                          `Nhiệm vụ ${index + 1}`
                        )
                      }
                    >
                      <Form.Item name={[field.name, 'projectOutlineId']} hidden>
                        <Input />
                      </Form.Item>
                      <Space wrap style={{ marginBottom: 8 }}>
                        <Tag>Tổng phiếu: {sum?.totalBallots ?? '—'}</Tag>
                        <Tag color="green">Hợp lệ (đã nộp): {sum?.validBallots ?? '—'}</Tag>
                        <Tag color="orange">Không hợp lệ (chưa nộp): {sum?.invalidBallots ?? '—'}</Tag>
                        <Tag color="blue">Điểm TB: {sum?.averageScore ?? '—'}</Tag>
                      </Space>
                      <Table
                        size="small"
                        pagination={false}
                        rowKey="memberId"
                        style={{ marginBottom: 12 }}
                        dataSource={sum?.memberScores || []}
                        columns={[
                          { title: 'Thành viên HĐ', dataIndex: 'memberName' },
                          {
                            title: 'Vai trò',
                            width: 120,
                            render: (_: unknown, r: any) =>
                              DEFENSE_ROLE_OPTIONS.find((o) => o.value === r.roleInCouncil)
                                ?.label || r.roleInCouncil,
                          },
                          {
                            title: 'Điểm',
                            width: 80,
                            render: (_: unknown, r: any) => r.totalScore ?? '—',
                          },
                          {
                            title: 'Phiếu',
                            width: 110,
                            render: (_: unknown, r: any) =>
                              r.status === 'SUBMITTED' ? (
                                <Tag color="green">Hợp lệ</Tag>
                              ) : (
                                <Tag color="orange">Chưa nộp</Tag>
                              ),
                          },
                        ]}
                      />
                      <Form.Item
                        name={[field.name, 'councilConclusion']}
                        label="5. Kết luận HĐ"
                        rules={[{ required: true, message: 'Chọn kết luận' }]}
                      >
                        <Radio.Group>
                          <Space direction="vertical">
                            {COUNCIL_CONCLUSION_OPTIONS.map((opt) => (
                              <Radio key={opt.value} value={opt.value}>
                                {opt.label}
                              </Radio>
                            ))}
                          </Space>
                        </Radio.Group>
                      </Form.Item>
                      <Form.Item
                        noStyle
                        shouldUpdate={(prev, cur) =>
                          prev.items?.[index]?.councilConclusion !==
                          cur.items?.[index]?.councilConclusion
                        }
                      >
                        {() => {
                          const kl = form.getFieldValue(['items', index, 'councilConclusion']);
                          if (kl === 'HOAN_THIEN') {
                            return (
                              <>
                                <Form.Item
                                  name={[field.name, 'adjustmentRequirements']}
                                  label="Nội dung hoàn thiện (bắt buộc)"
                                  rules={[{ required: true, message: 'Nhập nội dung điều chỉnh' }]}
                                >
                                  <TextArea rows={3} />
                                </Form.Item>
                                <Form.Item
                                  name={[field.name, 'adjustmentDeadline']}
                                  label="Hạn hoàn thiện"
                                  rules={[{ required: true, message: 'Chọn hạn' }]}
                                >
                                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                                </Form.Item>
                              </>
                            );
                          }
                          return null;
                        }}
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'executionContent']}
                        label="Nội dung thực hiện (thời gian / sản phẩm / kinh phí theo kết luận)"
                      >
                        <TextArea rows={2} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'note']} label="Ghi chú">
                        <TextArea rows={2} />
                      </Form.Item>
                    </Card>
                  );
                })}
              </>
            )}
          </Form.List>

          <Form.Item
            name="recommendations"
            label="6. Kiến nghị"
            style={{ marginTop: 16 }}
          >
            <TextArea rows={3} placeholder="Kiến nghị của Hội đồng…" />
          </Form.Item>
        </Form>

      </Card>

      {editable || canReopen ? (
        <FooterToolbar>
          {canReopen ? (
            <Button
              type="primary"
              icon={<UnlockOutlined />}
              loading={saving}
              onClick={handleReopen}
            >
              Mở khóa biên bản
            </Button>
          ) : null}
          {editable ? (
            <>
              <Button
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => void handleSave()}
              >
                Lưu nháp biên bản
              </Button>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={saving}
                onClick={() => void handleFinalize()}
              >
                Chốt biên bản (tạo BM.05b)
              </Button>
            </>
          ) : null}
        </FooterToolbar>
      ) : null}
    </Space>
  );
};

export default BienBanThamDinh;
