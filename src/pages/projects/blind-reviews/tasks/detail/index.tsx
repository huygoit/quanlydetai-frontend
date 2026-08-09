/**
 * US-04-03 — Phiếu chấm điểm phản biện kín
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { history, useAccess, useParams } from '@umijs/max';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { formatVnd } from '@/utils/format';
import {
  getOutlineReviewTask,
  saveOutlineReviewScoreDraft,
  submitOutlineReviewScore,
  reopenOutlineReviewScore,
  extendOutlineReviewDeadline,
  type ReviewScoreSheet,
  type ReviewScoreTaskDetail,
} from '@/services/api/projectOutlineScores';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;

const OutlineReviewScorePage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const access = useAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ReviewScoreTaskDetail | null>(null);
  const [sheet, setSheet] = useState<ReviewScoreSheet | null>(null);
  const [form] = Form.useForm();

  const id = Number(assignmentId);
  const minComment = sheet?.criteriaSnapshot?.minCommentLength ?? 50;
  const editable =
    !!detail?.isReviewer &&
    sheet?.status === 'DRAFT' &&
    !detail?.pastDeadline &&
    sheet?.editable;

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getOutlineReviewTask(id);
      const d = res.data;
      setDetail(d);
      setSheet(d.scoreSheet);
      if (d.scoreSheet) {
        form.setFieldsValue({
          generalComment: d.scoreSheet.generalComment,
          conclusion: d.scoreSheet.conclusion,
          lines: (d.scoreSheet.lines || []).map((l) => ({
            criterionCode: l.criterionCode,
            score: l.score,
            comment: l.comment,
          })),
        });
      }
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được nhiệm vụ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const liveTotal = Form.useWatch('lines', form);
  const previewTotal = useMemo(() => {
    if (!sheet?.lines?.length) return null;
    const vals: Array<{ score?: number | null }> = liveTotal || [];
    let sum = 0;
    sheet.lines.forEach((l, i) => {
      const s = vals[i]?.score;
      if (s == null || Number.isNaN(Number(s))) return;
      sum += Number(s) * Number(l.weight || 1);
    });
    return Math.round(sum * 100) / 100;
  }, [liveTotal, sheet]);

  const buildLinesPayload = () => {
    const vals = form.getFieldValue('lines') || [];
    return (sheet?.lines || []).map((l, i) => ({
      criterionCode: l.criterionCode,
      score: vals[i]?.score ?? null,
      comment: vals[i]?.comment ?? null,
    }));
  };

  const handleSaveDraft = async () => {
    if (!id || !editable) return;
    setSaving(true);
    try {
      const values = form.getFieldsValue();
      const res = await saveOutlineReviewScoreDraft(id, {
        generalComment: values.generalComment,
        conclusion: values.conclusion,
        lines: buildLinesPayload(),
      });
      setSheet(res.data);
      message.success(res.message || 'Đã lưu nháp');
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!id || !editable) return;
    try {
      await form.validateFields();
    } catch {
      message.warning('Vui lòng hoàn thiện điểm và nhận xét bắt buộc');
      return;
    }
    Modal.confirm({
      title: 'Nộp phiếu chấm?',
      content: 'Sau khi nộp, phiếu bị khóa. Chỉ PKH mới mở lại được.',
      okText: 'Nộp phiếu',
      cancelText: 'Hủy',
      onOk: async () => {
        setSaving(true);
        try {
          const values = form.getFieldsValue();
          const res = await submitOutlineReviewScore(id, {
            generalComment: values.generalComment,
            conclusion: values.conclusion,
            lines: buildLinesPayload(),
          });
          setSheet(res.data);
          message.success(res.message || 'Đã nộp phiếu');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Nộp thất bại');
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const handleReopen = () => {
    if (!id || !detail?.isPkh) return;
    let reason = '';
    Modal.confirm({
      title: 'Mở lại phiếu chấm',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Lý do mở lại (≥ 5 ký tự)"
          onChange={(e) => {
            reason = e.target.value;
          }}
        />
      ),
      okText: 'Mở lại',
      onOk: async () => {
        if (!reason.trim() || reason.trim().length < 5) {
          message.warning('Nhập lý do ≥ 5 ký tự');
          return Promise.reject();
        }
        try {
          await reopenOutlineReviewScore(id, reason.trim());
          message.success('Đã mở lại phiếu');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
          return Promise.reject();
        }
      },
    });
  };

  const handleExtend = () => {
    if (!id || !detail?.isPkh) return;
    let deadlineAt = '';
    let reason = '';
    Modal.confirm({
      title: 'Gia hạn deadline',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            type="date"
            onChange={(e) => {
              deadlineAt = e.target.value;
            }}
          />
          <Input.TextArea
            rows={2}
            placeholder="Lý do (tuỳ chọn)"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </Space>
      ),
      okText: 'Gia hạn',
      onOk: async () => {
        if (!deadlineAt) {
          message.warning('Chọn ngày hạn mới');
          return Promise.reject();
        }
        try {
          await extendOutlineReviewDeadline(id, {
            deadlineAt,
            reason: reason.trim() || null,
          });
          message.success('Đã gia hạn');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
          return Promise.reject();
        }
      },
    });
  };

  if (!access.canViewOutlineReviewTasks && !access.canReviewProjectProposal) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền truy cập." />
      </PageContainer>
    );
  }

  const o = detail?.outline;

  return (
    <PageContainer
      loading={loading}
      title={o ? `Chấm phản biện — ${o.code}` : 'Phiếu chấm phản biện'}
      onBack={() => history.push('/projects/blind-reviews/tasks')}
      extra={
        <Space>
          {detail?.isPkh && sheet?.status === 'SUBMITTED' && (
            <Button onClick={handleReopen}>Mở lại phiếu</Button>
          )}
          {detail?.isPkh && (
            <Button onClick={handleExtend}>Gia hạn hạn nộp</Button>
          )}
          {editable && (
            <>
              <Button loading={saving} onClick={handleSaveDraft}>
                Lưu nháp
              </Button>
              <Button type="primary" loading={saving} onClick={handleSubmit}>
                Nộp phiếu chấm
              </Button>
            </>
          )}
        </Space>
      }
    >
      {detail?.pastDeadline && sheet?.status !== 'SUBMITTED' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Đã quá deadline — không lưu/nộp được. Liên hệ PKH gia hạn hoặc mở lại."
        />
      )}
      {sheet?.status === 'SUBMITTED' && (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Phiếu đã nộp${
            sheet.totalScore != null ? ` — tổng điểm: ${sheet.totalScore}` : ''
          }${sheet.submittedAt ? ` lúc ${dayjs(sheet.submittedAt).format('DD/MM/YYYY HH:mm')}` : ''}`}
        />
      )}

      {o && (
        <Card size="small" title="Hồ sơ thuyết minh (chỉ đọc)" style={{ marginBottom: 16 }}>
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Mã">{o.code}</Descriptions.Item>
            <Descriptions.Item label="CNĐT">{o.ownerName}</Descriptions.Item>
            <Descriptions.Item label="Đơn vị">{o.ownerUnit || '—'}</Descriptions.Item>
            <Descriptions.Item label="Lĩnh vực">{o.field || '—'}</Descriptions.Item>
            <Descriptions.Item label="Kinh phí">
              {formatVnd(o.requestedBudget)}
            </Descriptions.Item>
            <Descriptions.Item label="Hạn nộp phiếu">
              {detail?.assignment.deadlineAt
                ? dayjs(detail.assignment.deadlineAt).format('DD/MM/YYYY')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Tên đề tài" span={2}>
              {o.title}
            </Descriptions.Item>
          </Descriptions>
          {o.urgency && (
            <>
              <Text strong>Tính cấp thiết</Text>
              <Paragraph>{o.urgency}</Paragraph>
            </>
          )}
          {o.detailedObjectives && (
            <>
              <Text strong>Mục tiêu</Text>
              <div dangerouslySetInnerHTML={{ __html: o.detailedObjectives }} />
            </>
          )}
          {o.methodology && (
            <>
              <Text strong>Phương pháp</Text>
              <div dangerouslySetInnerHTML={{ __html: o.methodology }} />
            </>
          )}
          {!!o.members?.length && (
            <Table
              style={{ marginTop: 12 }}
              size="small"
              pagination={false}
              rowKey={(m) => String(m.id || m.fullName)}
              dataSource={o.members}
              columns={[
                { title: 'Họ tên', dataIndex: 'fullName' },
                { title: 'Vai trò', dataIndex: 'roleInProject', width: 140 },
                { title: 'Đơn vị', dataIndex: 'unit', ellipsis: true },
              ]}
            />
          )}
        </Card>
      )}

      <Card
        size="small"
        title={
          <Space>
            <span>Phiếu đánh giá</span>
            {sheet?.criteriaSnapshot?.setName && (
              <Tag>{sheet.criteriaSnapshot.setName}</Tag>
            )}
            {previewTotal != null && <Tag color="blue">Tổng (xem trước): {previewTotal}</Tag>}
            {sheet?.totalScore != null && sheet.status === 'SUBMITTED' && (
              <Tag color="green">Tổng đã nộp: {sheet.totalScore}</Tag>
            )}
          </Space>
        }
      >
        {!sheet ? (
          <Alert type="warning" message="Chưa có phiếu chấm." />
        ) : (
          <Form form={form} layout="vertical" disabled={!editable}>
            <Form.List name="lines">
              {(fields) => (
                <>
                  {fields.map((field, index) => {
                    const meta = sheet.lines[index];
                    if (!meta) return null;
                    return (
                      <Card
                        key={field.key}
                        type="inner"
                        size="small"
                        style={{ marginBottom: 12 }}
                        title={`${index + 1}. ${meta.criterionName} (0–${meta.maxScore})`}
                      >
                        <Form.Item name={[field.name, 'criterionCode']} hidden>
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'score']}
                          label="Điểm"
                          rules={[
                            { required: true, message: 'Nhập điểm' },
                            {
                              type: 'number',
                              min: 0,
                              max: Number(meta.maxScore),
                              message: `Điểm từ 0 đến ${meta.maxScore}`,
                            },
                          ]}
                        >
                          <InputNumber min={0} max={Number(meta.maxScore)} step={0.5} style={{ width: 160 }} />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'comment']}
                          label={`Nhận xét${meta.commentRequired ? ` (≥ ${minComment} ký tự)` : ''}`}
                          rules={
                            meta.commentRequired
                              ? [
                                  { required: true, message: 'Nhập nhận xét' },
                                  {
                                    min: minComment,
                                    message: `Tối thiểu ${minComment} ký tự`,
                                  },
                                ]
                              : []
                          }
                        >
                          <TextArea rows={3} showCount maxLength={4000} />
                        </Form.Item>
                      </Card>
                    );
                  })}
                </>
              )}
            </Form.List>

            <Form.Item name="generalComment" label="Nhận xét chung">
              <TextArea rows={3} showCount maxLength={4000} />
            </Form.Item>
            <Form.Item name="conclusion" label="Kết luận (tuỳ chọn)">
              <Select
                allowClear
                options={[
                  { value: 'DAT', label: 'Đạt' },
                  { value: 'KHONG_DAT', label: 'Không đạt' },
                ]}
                style={{ width: 200 }}
              />
            </Form.Item>
          </Form>
        )}
      </Card>
    </PageContainer>
  );
};

export default OutlineReviewScorePage;
