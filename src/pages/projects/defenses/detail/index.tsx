/**
 * US-04-04 — Chi tiết buổi bảo vệ + biên bản / kết luận
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { history, useAccess, useParams } from '@umijs/max';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  getDefenseSession,
  confirmDefenseSession,
  cancelDefenseSession,
  saveDefenseMinutes,
  finalizeDefenseSession,
  DEFENSE_STATUS_MAP,
  DEFENSE_CONCLUSION_MAP,
  DEFENSE_ROLE_OPTIONS,
  type DefenseSession,
  type DefenseConclusion,
} from '@/services/api/projectOutlineDefenses';
import { OUTLINE_STATUS_MAP, type ProjectOutlineStatus } from '@/services/api/projectOutlines';

const DefenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<DefenseSession | null>(null);
  const [form] = Form.useForm();
  const sessionId = Number(id);

  const load = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await getDefenseSession(sessionId);
      setSession(res.data);
      const att: Record<number, string> = {};
      (res.data.members || []).forEach((m) => {
        if (m.id) att[m.id] = m.attendance || 'PENDING';
      });
      form.setFieldsValue({
        discussionNotes: res.data.discussionNotes,
        finalScore: res.data.finalScore,
        conclusion: res.data.conclusion,
        adjustmentRequirements: res.data.adjustmentRequirements,
        adjustmentDeadline: res.data.adjustmentDeadline
          ? dayjs(res.data.adjustmentDeadline)
          : null,
        attendances: att,
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
  }, [sessionId]);

  if (!access.canManageOutlineDefense) {
    return (
      <PageContainer>
        <Alert type="error" message="Chỉ PKH thao tác buổi bảo vệ." />
      </PageContainer>
    );
  }

  const editableMinutes = session?.status === 'CONFIRMED';
  const canConfirm = session?.status === 'DRAFT';
  const canCancel = session?.status === 'DRAFT' || session?.status === 'CONFIRMED';

  const buildAttendances = (strict: boolean) => {
    const att = form.getFieldValue('attendances') || {};
    return (session?.members || [])
      .filter((m) => m.id)
      .map((m) => ({
        memberId: m.id!,
        attendance: (att[m.id!] || (strict ? 'PRESENT' : 'PENDING')) as any,
      }));
  };

  const handleConfirm = () => {
    Modal.confirm({
      title: 'Xác nhận lịch bảo vệ?',
      content: 'Hệ thống sẽ chuyển thuyết minh sang BAOVE_PENDING và gửi lời mời.',
      onOk: async () => {
        try {
          const res = await confirmDefenseSession(sessionId);
          setSession(res.data);
          message.success(res.message || 'Đã xác nhận');
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
        }
      },
    });
  };

  const handleCancel = () => {
    let reason = '';
    Modal.confirm({
      title: 'Hủy buổi bảo vệ',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Lý do hủy (≥ 5 ký tự)"
          onChange={(e) => {
            reason = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        if (!reason.trim() || reason.trim().length < 5) {
          message.warning('Nhập lý do');
          return Promise.reject();
        }
        try {
          const res = await cancelDefenseSession(sessionId, reason.trim());
          setSession(res.data);
          message.success('Đã hủy');
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
          return Promise.reject();
        }
      },
    });
  };

  const handleSaveMinutes = async () => {
    try {
      const v = await form.validateFields(['discussionNotes']);
      const res = await saveDefenseMinutes(sessionId, {
        discussionNotes: v.discussionNotes,
        finalScore: form.getFieldValue('finalScore'),
        conclusion: form.getFieldValue('conclusion'),
        adjustmentRequirements: form.getFieldValue('adjustmentRequirements'),
        adjustmentDeadline: form.getFieldValue('adjustmentDeadline')
          ? dayjs(form.getFieldValue('adjustmentDeadline')).toISOString()
          : null,
        attendances: buildAttendances(false),
      });
      setSession(res.data);
      message.success('Đã lưu nháp biên bản');
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
    }
  };

  const handleFinalize = async () => {
    try {
      const v = await form.validateFields();
      Modal.confirm({
        title: 'Chốt biên bản?',
        content: 'Không thể chốt lại. Trạng thái thuyết minh sẽ chuyển theo kết luận.',
        onOk: async () => {
          try {
            const res = await finalizeDefenseSession(sessionId, {
              discussionNotes: v.discussionNotes,
              finalScore: v.finalScore ?? null,
              conclusion: v.conclusion as DefenseConclusion,
              adjustmentRequirements: v.adjustmentRequirements || null,
              adjustmentDeadline: v.adjustmentDeadline
                ? dayjs(v.adjustmentDeadline).toISOString()
                : null,
              attendances: buildAttendances(true).map((a) => ({
                memberId: a.memberId,
                attendance: a.attendance === 'ABSENT' ? 'ABSENT' : 'PRESENT',
              })),
            });
            setSession(res.data);
            message.success(res.message || 'Đã chốt');
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Chốt thất bại');
          }
        },
      });
    } catch {
      message.warning('Hoàn thiện biểu mẫu trước khi chốt');
    }
  };

  const o = session?.outline;
  const outlineStatus = o?.status as ProjectOutlineStatus | undefined;

  return (
    <PageContainer
      loading={loading}
      title={o ? `Bảo vệ — ${o.code}` : 'Chi tiết bảo vệ'}
      onBack={() => history.push('/projects/defenses')}
      extra={
        <Space>
          {canConfirm && (
            <Button type="primary" onClick={handleConfirm}>
              Xác nhận lịch
            </Button>
          )}
          {canCancel && <Button danger onClick={handleCancel}>Hủy buổi</Button>}
          {editableMinutes && (
            <>
              <Button onClick={() => void handleSaveMinutes()}>Lưu nháp biên bản</Button>
              <Button type="primary" onClick={() => void handleFinalize()}>
                Chốt biên bản
              </Button>
            </>
          )}
          {session?.minutesFileUrl && (
            <Button href={session.minutesFileUrl} target="_blank">
              Xem biên bản
            </Button>
          )}
        </Space>
      }
    >
      {session && (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Trạng thái buổi">
                <Tag color={DEFENSE_STATUS_MAP[session.status]?.color}>
                  {DEFENSE_STATUS_MAP[session.status]?.label || session.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái TM">
                {outlineStatus ? (
                  <Tag color={OUTLINE_STATUS_MAP[outlineStatus]?.color}>
                    {OUTLINE_STATUS_MAP[outlineStatus]?.label}
                  </Tag>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian">
                {session.meetingAt
                  ? dayjs(session.meetingAt).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Hình thức">{session.meetingMode}</Descriptions.Item>
              <Descriptions.Item label="Địa điểm">{session.location || '—'}</Descriptions.Item>
              <Descriptions.Item label="Link">{session.meetingUrl || '—'}</Descriptions.Item>
              <Descriptions.Item label="Đề tài" span={2}>
                {o?.title}
              </Descriptions.Item>
              <Descriptions.Item label="CNĐT">
                {o?.ownerName}
                {o?.ownerUnit ? ` — ${o.ownerUnit}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Điểm TB phản biện">
                {o?.reviewAverageScore ?? '—'}
              </Descriptions.Item>
              {session.conclusion && (
                <Descriptions.Item label="Kết luận" span={2}>
                  {DEFENSE_CONCLUSION_MAP[session.conclusion]}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card size="small" title="Thành phần hội đồng" style={{ marginBottom: 16 }}>
            <Table
              size="small"
              pagination={false}
              rowKey={(r) => String(r.id || r.memberName)}
              dataSource={session.members || []}
              columns={[
                { title: 'Họ tên', dataIndex: 'memberName' },
                {
                  title: 'Vai trò',
                  width: 120,
                  render: (_, r) =>
                    DEFENSE_ROLE_OPTIONS.find((x) => x.value === r.roleInCouncil)?.label ||
                    r.roleInCouncil,
                },
                {
                  title: 'Ngoài',
                  width: 80,
                  render: (_, r) => (r.isExternal ? <Tag color="orange">Ngoài</Tag> : '—'),
                },
                {
                  title: 'Có mặt',
                  width: 140,
                  render: (_, r) =>
                    editableMinutes && r.id ? (
                      <Form form={form} component={false}>
                        <Form.Item name={['attendances', r.id]} noStyle>
                          <Select
                            style={{ width: 120 }}
                            options={[
                              { value: 'PRESENT', label: 'Có mặt' },
                              { value: 'ABSENT', label: 'Vắng' },
                              { value: 'PENDING', label: 'Chưa ghi' },
                            ]}
                          />
                        </Form.Item>
                      </Form>
                    ) : (
                      r.attendance || '—'
                    ),
                },
              ]}
            />
          </Card>

          {(editableMinutes || session.status === 'FINALIZED') && (
            <Card size="small" title="Biên bản / kết luận">
              <Form form={form} layout="vertical" disabled={!editableMinutes}>
                <Form.Item
                  name="discussionNotes"
                  label="Ý kiến thảo luận / kết luận"
                  rules={[{ required: true, min: 10 }]}
                >
                  <Input.TextArea rows={5} showCount maxLength={20000} />
                </Form.Item>
                <Form.Item name="finalScore" label="Điểm tổng kết HĐ (tuỳ chọn)">
                  <InputNumber min={0} max={100} step={0.5} style={{ width: 160 }} />
                </Form.Item>
                <Form.Item
                  name="conclusion"
                  label="Kết luận"
                  rules={[{ required: true, message: 'Chọn kết luận' }]}
                >
                  <Select
                    options={[
                      { value: 'THONG_QUA', label: 'Thông qua' },
                      { value: 'THONG_QUA_DIEU_CHINH', label: 'Thông qua có điều chỉnh' },
                      { value: 'KHONG_THONG_QUA', label: 'Không thông qua' },
                    ]}
                    style={{ width: 280 }}
                  />
                </Form.Item>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.conclusion !== cur.conclusion}
                >
                  {() =>
                    form.getFieldValue('conclusion') === 'THONG_QUA_DIEU_CHINH' ? (
                      <>
                        <Form.Item
                          name="adjustmentRequirements"
                          label="Yêu cầu chỉnh sửa"
                          rules={[{ required: true }]}
                        >
                          <Input.TextArea rows={3} />
                        </Form.Item>
                        <Form.Item
                          name="adjustmentDeadline"
                          label="Hạn chỉnh sửa"
                          rules={[{ required: true }]}
                        >
                          <DatePicker style={{ width: 200 }} />
                        </Form.Item>
                      </>
                    ) : null
                  }
                </Form.Item>
              </Form>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
};

export default DefenseDetailPage;
