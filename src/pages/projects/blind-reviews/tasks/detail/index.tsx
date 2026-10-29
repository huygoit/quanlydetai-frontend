/**
 * US-04-03 — Phiếu đánh giá theo mẫu BM-02.09
 */
import OutlinePreviewSheet from '@/components/OutlinePreviewSheet';
import {
  extendOutlineReviewDeadline,
  getOutlineReviewTask,
  reopenOutlineReviewScore,
  saveOutlineReviewScoreDraft,
  submitOutlineReviewScore,
  type ReviewScoreSheet,
  type ReviewScoreTaskDetail,
} from '@/services/api/projectOutlineScores';
import { formatVnd } from '@/utils/format';
import {
  ArrowLeftOutlined,
  ReadOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Space,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import PhieuDanhGiaBm0209 from './PhieuDanhGiaBm0209';

const { Text } = Typography;

const OutlineReviewScorePage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const access = useAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<ReviewScoreTaskDetail | null>(null);
  const [sheet, setSheet] = useState<ReviewScoreSheet | null>(null);
  const [tmOpen, setTmOpen] = useState(false);
  const [form] = Form.useForm();

  const id = Number(assignmentId);
  const editable =
    !!detail?.isReviewer &&
    sheet?.status === 'DRAFT' &&
    !detail?.pastDeadline &&
    sheet?.editable;

  /** Gom payload phiếu BM-02.09 từ form */
  const buildPayload = () => {
    const values = form.getFieldsValue();
    return {
      generalComment: values.generalComment,
      conclusion: values.conclusion,
      precheckEligible: !!values.precheckEligible,
      precheckConflictCleared: !!values.precheckConflictCleared,
      precheckEthicsOk: !!values.precheckEthicsOk,
      lines: buildLinesPayload(),
    };
  };

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
          precheckEligible: !!d.scoreSheet.precheckEligible,
          precheckConflictCleared: !!d.scoreSheet.precheckConflictCleared,
          precheckEthicsOk: !!d.scoreSheet.precheckEthicsOk,
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
      const res = await saveOutlineReviewScoreDraft(id, buildPayload());
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
      message.warning('Vui lòng hoàn thiện điểm, kết luận và nhận xét');
      return;
    }
    Modal.confirm({
      title: 'Nộp phiếu đánh giá?',
      content: 'Sau khi nộp, phiếu bị khóa. Chỉ PKH mới mở lại được.',
      okText: 'Nộp phiếu',
      cancelText: 'Hủy',
      onOk: async () => {
        setSaving(true);
        try {
          const res = await submitOutlineReviewScore(id, buildPayload());
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
      title={o ? `Phiếu đánh giá BM-02.09 — ${o.code}` : 'Phiếu đánh giá BM-02.09'}
      onBack={() => history.push('/projects/blind-reviews/tasks')}
    >
      <div style={{ paddingBottom: 72 }}>
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
            }${
              sheet.submittedAt
                ? ` lúc ${dayjs(sheet.submittedAt).format('HH:mm DD/MM/YYYY')}`
                : ''
            }`}
          />
        )}

        {o && (
          <Card size="small" style={{ marginBottom: 16 }}>
            <Space
              wrap
              style={{ width: '100%', justifyContent: 'space-between' }}
            >
              <Descriptions column={2} size="small" style={{ flex: 1 }}>
                <Descriptions.Item label="Mã">{o.code}</Descriptions.Item>
                <Descriptions.Item label="CNĐT">{o.ownerName}</Descriptions.Item>
                <Descriptions.Item label="Kinh phí">
                  {formatVnd(o.requestedBudget)}
                </Descriptions.Item>
                <Descriptions.Item label="Hạn nộp">
                  {detail?.assignment.deadlineAt
                    ? dayjs(detail.assignment.deadlineAt).format('DD/MM/YYYY')
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Tên đề tài" span={2}>
                  <Text strong>{o.title}</Text>
                </Descriptions.Item>
              </Descriptions>
              <Button
                type="primary"
                ghost
                icon={<ReadOutlined />}
                onClick={() => setTmOpen(true)}
              >
                Xem thuyết minh
              </Button>
            </Space>
          </Card>
        )}

        {!sheet ? (
          <Alert type="warning" message="Chưa có phiếu đánh giá." />
        ) : (
          <PhieuDanhGiaBm0209
            form={form}
            lines={sheet.lines || []}
            editable={!!editable}
            previewTotal={
              sheet.status === 'SUBMITTED' && sheet.totalScore != null
                ? sheet.totalScore
                : previewTotal
            }
            evaluatorName={detail?.assignment?.reviewerName}
            submittedAtLabel={
              sheet.submittedAt
                ? `Đà Nẵng, ${dayjs(sheet.submittedAt).format(
                    '[ngày] DD [tháng] MM [năm] YYYY',
                  )}`
                : null
            }
          />
        )}
      </div>

      <OutlinePreviewSheet
        open={tmOpen}
        onClose={() => setTmOpen(false)}
        outline={o as any}
      />

      <FooterToolbar>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => history.push('/projects/blind-reviews/tasks')}
        >
          Quay lại
        </Button>
        {o ? (
          <Button icon={<ReadOutlined />} onClick={() => setTmOpen(true)}>
            Xem thuyết minh
          </Button>
        ) : null}
        {detail?.isPkh && sheet?.status === 'SUBMITTED' ? (
          <Button onClick={handleReopen}>Mở lại phiếu</Button>
        ) : null}
        {detail?.isPkh ? (
          <Button onClick={handleExtend}>Gia hạn hạn nộp</Button>
        ) : null}
        {editable ? (
          <>
            <Button
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSaveDraft}
            >
              Lưu nháp
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={saving}
              onClick={handleSubmit}
            >
              Nộp phiếu
            </Button>
          </>
        ) : null}
      </FooterToolbar>
    </PageContainer>
  );
};

export default OutlineReviewScorePage;
