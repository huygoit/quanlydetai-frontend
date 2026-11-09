/**
 * Layer sheet nhập / xem phiếu BM.05a
 */
import OutlinePreviewSheet from '@/components/OutlinePreviewSheet';
import PhieuDanhGiaBm0209 from '@/components/PhieuDanhGiaBm0209';
import {
  getDefenseScoreSheet,
  saveDefenseScoreSheet,
  type DefenseScoreSheet,
} from '@/services/api/projectOutlineDefenses';
import {
  ReadOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Drawer,
  Form,
  Modal,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import './bm05a-score-sheet.less';

const { Text } = Typography;

type Props = {
  open: boolean;
  sheetId: number | null;
  onClose: () => void;
  onSaved?: () => void;
};

const Bm05aScoreSheet: React.FC<Props> = ({
  open,
  sheetId,
  onClose,
  onSaved,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState<DefenseScoreSheet | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [tmOpen, setTmOpen] = useState(false);
  const [form] = Form.useForm();

  const editable = sheet?.status === 'DRAFT';
  const o = meta?.outline;

  const load = async (id: number) => {
    setLoading(true);
    try {
      const res = await getDefenseScoreSheet(id);
      const d = res.data;
      setMeta(d);
      setSheet(d.sheet);
      form.setFieldsValue({
        generalComment: d.sheet?.generalComment,
        conclusion: d.sheet?.conclusion,
        precheckEligible: !!d.sheet?.precheckEligible,
        precheckConflictCleared: !!d.sheet?.precheckConflictCleared,
        precheckEthicsOk: !!d.sheet?.precheckEthicsOk,
        lines: (d.sheet?.scores || []).map((l: any) => ({
          criterionCode: l.code,
          score: l.score,
        })),
      });
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được phiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && sheetId) {
      void load(sheetId);
      setTmOpen(false);
    }
    if (!open) {
      setSheet(null);
      setMeta(null);
      form.resetFields();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sheetId]);

  const liveLines = Form.useWatch('lines', form);
  const previewTotal = useMemo(() => {
    const scores = sheet?.scores || [];
    const vals: Array<{ score?: number | null }> = liveLines || [];
    let sum = 0;
    let ok = false;
    scores.forEach((_l, i) => {
      const s = vals[i]?.score;
      if (s == null || Number.isNaN(Number(s))) return;
      ok = true;
      sum += Number(s);
    });
    return ok ? Math.round(sum * 100) / 100 : null;
  }, [liveLines, sheet]);

  const buildPayload = (submit?: boolean) => {
    const values = form.getFieldsValue();
    const scores = (sheet?.scores || []).map((l, i) => ({
      code: l.code,
      score: values.lines?.[i]?.score ?? null,
    }));
    return {
      generalComment: values.generalComment,
      conclusion: values.conclusion,
      precheckEligible: !!values.precheckEligible,
      precheckConflictCleared: !!values.precheckConflictCleared,
      precheckEthicsOk: !!values.precheckEthicsOk,
      scores,
      submit: !!submit,
    };
  };

  const handleSave = async (submit: boolean) => {
    if (!sheetId || !editable) return;
    if (submit) {
      try {
        await form.validateFields();
      } catch {
        message.warning('Hoàn thiện điểm, kết luận và nhận xét');
        return;
      }
      Modal.confirm({
        title: 'Nộp phiếu BM.05a?',
        content: 'Sau khi nộp sẽ khóa phiếu.',
        onOk: async () => {
          setSaving(true);
          try {
            const res = await saveDefenseScoreSheet(sheetId, buildPayload(true));
            setSheet(res.data);
            message.success(res.message || 'Đã nộp');
            onSaved?.();
            await load(sheetId);
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Nộp thất bại');
          } finally {
            setSaving(false);
          }
        },
      });
      return;
    }
    setSaving(true);
    try {
      const res = await saveDefenseScoreSheet(sheetId, buildPayload(false));
      setSheet(res.data);
      message.success(res.message || 'Đã lưu nháp');
      onSaved?.();
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const linesForForm = (sheet?.scores || []).map((s) => ({
    id: undefined,
    criterionCode: s.code,
    criterionName: s.name,
    maxScore: s.maxScore,
    weight: 1,
    sortOrder: 0,
    commentRequired: false,
    score: s.score,
    comment: null,
  }));

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        placement="right"
        width={880}
        className="bm05a-score-sheet"
        destroyOnClose
        title={
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Phiếu đánh giá BM.05a
            </Text>
            <span>
              {o
                ? `${o.code} — ${o.title || ''}`
                : sheetId
                  ? `Phiếu #${sheetId}`
                  : 'Nhập phiếu đánh giá'}
            </span>
          </Space>
        }
        extra={
          <Space wrap>
            <Button
              icon={<ReadOutlined />}
              onClick={() => setTmOpen(true)}
              disabled={!o}
            >
              Xem thuyết minh
            </Button>
            <Button onClick={onClose}>Đóng</Button>
          </Space>
        }
        footer={
          <div className="bm05a-score-sheet__footer">
            <Button onClick={onClose}>Đóng</Button>
            <Space wrap>
              <Button
                icon={<ReadOutlined />}
                onClick={() => setTmOpen(true)}
                disabled={!o}
              >
                Xem thuyết minh
              </Button>
              {editable ? (
                <>
                  <Button
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => void handleSave(false)}
                  >
                    Lưu nháp
                  </Button>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={saving}
                    onClick={() => void handleSave(true)}
                  >
                    Nộp phiếu
                  </Button>
                </>
              ) : null}
            </Space>
          </div>
        }
      >
        <Spin spinning={loading}>
          {sheet?.status === 'SUBMITTED' ? (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 12 }}
              message={`Đã nộp phiếu${
                sheet.totalScore != null ? ` — tổng ${sheet.totalScore}` : ''
              }${
                sheet.submittedAt
                  ? ` lúc ${dayjs(sheet.submittedAt).format('HH:mm DD/MM/YYYY')}`
                  : ''
              }`}
            />
          ) : (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="Nhập điểm BM.05a tại đây. Bấm «Xem thuyết minh» nếu cần đối chiếu hồ sơ BM.04."
            />
          )}

          {sheet ? (
            <PhieuDanhGiaBm0209
              form={form}
              lines={linesForForm}
              editable={!!editable}
              previewTotal={
                sheet.status === 'SUBMITTED' && sheet.totalScore != null
                  ? sheet.totalScore
                  : previewTotal
              }
              evaluatorName={meta?.member?.memberName}
              submittedAtLabel={
                sheet.submittedAt
                  ? `Đà Nẵng, ${dayjs(sheet.submittedAt).format(
                      '[ngày] DD [tháng] MM [năm] YYYY',
                    )}`
                  : null
              }
            />
          ) : !loading ? (
            <Alert type="warning" message="Chưa có phiếu." />
          ) : null}
        </Spin>
      </Drawer>

      <OutlinePreviewSheet
        open={tmOpen}
        onClose={() => setTmOpen(false)}
        outline={o}
      />
    </>
  );
};

export default Bm05aScoreSheet;
