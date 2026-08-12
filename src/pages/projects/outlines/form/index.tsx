/**
 * Form soạn / nộp thuyết minh chi tiết (US-04-01) + chỉnh sửa sau bảo vệ (US-04-05)
 */
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  type ProFormInstance,
} from '@ant-design/pro-components';
import RichTextHtmlField, { cleanRichHtml } from '@/components/RichTextHtmlField';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, PlusOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { history, useAccess, useParams } from '@umijs/max';
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import ProposalAttachmentUpload from '@/components/ProposalAttachmentUpload';
import AuthorsEditor from '@/components/AuthorsEditor';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import {
  getOutline,
  saveOutlineDraft,
  submitOutline,
  withdrawOutline,
  submitOutlineRevision,
  extendOutlineRevisionDeadline,
  getOutlineRevisionDiff,
  BUDGET_GROUP_OPTIONS,
  OUTLINE_STATUS_MAP,
  type OutlineBudgetLine,
  type OutlineFieldDiff,
  type OutlineMilestone,
  type OutlinePartnerUnit,
  type OutlineProduct,
  type OutlineRevisionContext,
  type ProjectOutline,
} from '@/services/api/projectOutlines';
import {
  getProjectProcessTypeOptions,
  type ProjectProcessTypeOption,
} from '@/services/api/projectProcessTypes';
import {
  normalizePublicationAuthor,
  type PublicationAuthor,
} from '@/services/api/profilePublications';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const OutlineFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const outlineId = Number(id);
  const formRef = useRef<ProFormInstance>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [outline, setOutline] = useState<ProjectOutline | null>(null);
  const [revisionCtx, setRevisionCtx] = useState<OutlineRevisionContext | null>(null);
  const [explanation, setExplanation] = useState('');
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffs, setDiffs] = useState<OutlineFieldDiff[]>([]);
  const [diffNote, setDiffNote] = useState('');
  const [formReadyKey, setFormReadyKey] = useState(0);
  const [formInitial, setFormInitial] = useState<Record<string, unknown>>({});
  const [processTypes, setProcessTypes] = useState<ProjectProcessTypeOption[]>([]);
  const [members, setMembers] = useState<PublicationAuthor[]>([]);
  const [budgetLines, setBudgetLines] = useState<OutlineBudgetLine[]>([]);
  const [milestones, setMilestones] = useState<OutlineMilestone[]>([]);
  const [products, setProducts] = useState<OutlineProduct[]>([]);
  const [partners, setPartners] = useState<OutlinePartnerUnit[]>([]);

  const isRevision = outline?.status === 'CHINH_SUA_TM';
  const editable =
    outline?.status === 'THUYETMINH_DRAFT' || (isRevision && !!revisionCtx?.editable);
  const stMeta = outline ? OUTLINE_STATUS_MAP[outline.status] : null;

  const totalDetail = useMemo(
    () => budgetLines.reduce((s, l) => s + Number(l.amount || 0), 0),
    [budgetLines],
  );
  const load = async () => {
    if (!Number.isFinite(outlineId)) return;
    setLoading(true);
    try {
      const [res, opts] = await Promise.all([
        getOutline(outlineId),
        getProjectProcessTypeOptions(),
      ]);
      const d = res.data;
      if (!d) throw new Error('Không tải được thuyết minh');
      setOutline(d);
      setRevisionCtx(d.revisionContext || null);
      setExplanation(d.revisionContext?.revisionExplanation || d.revisionExplanation || '');
      setProcessTypes(opts.data || []);
      setMembers(
        (d.members?.length ? d.members : []).map((m) =>
          normalizePublicationAuthor(m as PublicationAuthor),
        ),
      );
      setBudgetLines(d.budgetLines?.length ? d.budgetLines : []);
      setMilestones(
        d.milestones?.length
          ? d.milestones.map((m) => ({ ...m, content: cleanRichHtml(m.content) }))
          : [{ content: '' }],
      );
      setProducts(d.expectedProducts?.length ? d.expectedProducts : [{ name: '' }]);
      setPartners(d.partnerUnits?.length ? d.partnerUnits : []);
      // Gán initialValues + remount form để chắc chắn đổ data từ đề xuất
      setFormInitial({
        title: d.title,
        projectProcessTypeId: d.projectProcessTypeId,
        field: d.field,
        startDate: d.startDate ? dayjs(d.startDate) : undefined,
        endDate: d.endDate ? dayjs(d.endDate) : undefined,
        requestedBudget: d.requestedBudget,
        hostUnit: d.hostUnit,
        applicationScope: cleanRichHtml(d.applicationScope),
        urgency: cleanRichHtml(d.urgency),
        detailedObjectives: cleanRichHtml(d.detailedObjectives),
        researchContent: cleanRichHtml(d.researchContent),
        methodology: cleanRichHtml(d.methodology),
        summary: d.summary || '',
        outlineFileUrl: d.outlineFileUrl,
        appendixFileUrl: d.appendixFileUrl,
      });
      setFormReadyKey((k) => k + 1);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId]);

  const buildPayload = () => {
    const v = formRef.current?.getFieldsValue() || {};
    return {
      title: v.title,
      projectProcessTypeId: v.projectProcessTypeId ?? null,
      field: v.field ?? null,
      startDate: v.startDate ? dayjs(v.startDate).toISOString() : null,
      endDate: v.endDate ? dayjs(v.endDate).toISOString() : null,
      requestedBudget: Number(v.requestedBudget || 0),
      hostUnit: v.hostUnit ?? null,
      partnerUnits: partners.filter((p) => p.name?.trim()),
      applicationScope: v.applicationScope ?? null,
      urgency: v.urgency ?? null,
      detailedObjectives: v.detailedObjectives ?? null,
      researchContent: v.researchContent ?? null,
      methodology: v.methodology ?? null,
      milestones: milestones.filter(
        (m) =>
          !!(m.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim() ||
          m.startDate ||
          m.endDate ||
          m.expectedResult,
      ),
      expectedProducts: products.filter((p) => p.name?.trim()),
      summary: v.summary ?? null,
      outlineFileUrl: v.outlineFileUrl ?? null,
      appendixFileUrl: v.appendixFileUrl ?? null,
      revisionExplanation: isRevision ? explanation : undefined,
      members: members.map((m, i) => ({
        id: typeof m.id === 'number' ? m.id : undefined,
        profileId: m.profileId ?? null,
        studentId: m.studentId ?? null,
        fullName: m.fullName?.trim() || '',
        memberOrder: m.authorOrder || i + 1,
        authorOrder: m.authorOrder || i + 1,
        role: m.proposalMemberRole || 'MEMBER',
        proposalMemberRole: m.proposalMemberRole || 'MEMBER',
        affiliationType: m.affiliationType ?? null,
        affiliationUnits: m.affiliationUnits ?? [],
        contributionPercent: m.contributionPercent ?? null,
        gender: m.gender ?? null,
        isMultiAffiliationOutsideUdn: !!m.isMultiAffiliationOutsideUdn,
      })),
      budgetLines: budgetLines.map((l, i) => ({
        ...l,
        lineOrder: i + 1,
        amount: Number(l.amount || 0),
      })),
    };
  };

  const luuNhap = async () => {
    if (!outline || !editable) return;
    setSaving(true);
    try {
      const res = await saveOutlineDraft(outline.id, buildPayload());
      message.success('Đã lưu nháp');
      // Chỉ cập nhật meta/progress — không remount form (tránh mất ngày/nội dung đang nhập)
      if (res.data) {
        setOutline(res.data);
        setRevisionCtx(res.data.revisionContext || null);
        setMembers(
          (res.data.members || []).map((m) =>
            normalizePublicationAuthor(m as PublicationAuthor),
          ),
        );
        setBudgetLines(res.data.budgetLines || []);
        if (res.data.milestones?.length) setMilestones(res.data.milestones);
        if (res.data.expectedProducts?.length) setProducts(res.data.expectedProducts);
        if (res.data.partnerUnits?.length) setPartners(res.data.partnerUnits);
        formRef.current?.setFieldsValue({
          completionPercent: res.data.completionPercent,
        });
      }
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const nopChinhThuc = () => {
    if (!outline || !editable || isRevision) return;
    Modal.confirm({
      title: 'Xác nhận nộp thuyết minh',
      content:
        'Bạn có chắc nộp chính thức bản thuyết minh? Sau khi nộp, form sẽ khóa và Phòng Khoa học nhận thông báo.',
      okText: 'Nộp chính thức',
      cancelText: 'Hủy',
      onOk: async () => {
        setSaving(true);
        try {
          await saveOutlineDraft(outline.id, buildPayload());
          const res = await submitOutline(outline.id);
          message.success(res.message || 'Đã nộp thuyết minh');
          setOutline(res.data || outline);
          await load();
        } catch (e: any) {
          const errs = e?.data?.errors as string[] | undefined;
          message.error(errs?.[0] || e?.data?.message || e?.message || 'Nộp thất bại');
          throw e;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const nopBanHoanThien = () => {
    if (!outline || !isRevision || !revisionCtx?.canSubmit) return;
    const minLen = revisionCtx.minExplanationLength || 100;
    if ((explanation || '').trim().length < minLen) {
      message.warning(`Giải trình bắt buộc ≥ ${minLen} ký tự`);
      return;
    }
    Modal.confirm({
      title: 'Nộp bản hoàn thiện?',
      content:
        'Hệ thống khóa phiên bản mới (không ghi đè bản HĐ đã đánh giá) và chuyển sang chờ xác nhận kinh phí.',
      okText: 'Nộp bản hoàn thiện',
      cancelText: 'Hủy',
      onOk: async () => {
        setSaving(true);
        try {
          await saveOutlineDraft(outline.id, buildPayload());
          const res = await submitOutlineRevision(outline.id, explanation.trim());
          message.success(res.message || 'Đã nộp bản hoàn thiện');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Nộp thất bại');
          throw e;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const moSoSanh = async () => {
    if (!outline) return;
    try {
      const res = await getOutlineRevisionDiff(outline.id);
      setDiffs(res.data?.diffs || []);
      setDiffNote(res.data?.diffLimitNote || '');
      setDiffOpen(true);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không so sánh được');
    }
  };

  const giaHan = () => {
    if (!outline || !access.canExtendOutlineRevision) return;
    let deadlineAt = '';
    let reason = '';
    Modal.confirm({
      title: 'Gia hạn chỉnh sửa thuyết minh',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <DatePicker
            style={{ width: '100%' }}
            onChange={(d) => {
              deadlineAt = d ? d.endOf('day').toISOString() : '';
            }}
          />
          <TextArea
            rows={2}
            placeholder="Lý do gia hạn (≥ 5 ký tự)"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </Space>
      ),
      okText: 'Gia hạn',
      onOk: async () => {
        if (!deadlineAt || reason.trim().length < 5) {
          message.warning('Chọn hạn mới và nhập lý do');
          return Promise.reject();
        }
        try {
          await extendOutlineRevisionDeadline(outline.id, {
            deadlineAt,
            reason: reason.trim(),
          });
          message.success('Đã gia hạn');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Gia hạn thất bại');
          return Promise.reject();
        }
      },
    });
  };

  const rutLai = () => {
    if (!outline || outline.status !== 'THUYETMINH_PENDING') return;
    Modal.confirm({
      title: 'Rút lại thuyết minh',
      content: 'Bản thuyết minh sẽ trở về trạng thái nháp để chỉnh sửa.',
      okText: 'Rút lại',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await withdrawOutline(outline.id);
          message.success(res.message || 'Đã rút lại');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Rút lại thất bại');
          throw e;
        }
      },
    });
  };

  const requestedBudget = Number(formRef.current?.getFieldValue('requestedBudget') || outline?.requestedBudget || 0);
  const budgetDiff = Math.abs(totalDetail - requestedBudget);

  return (
    <PageContainer
      loading={loading}
      title={outline ? `Thuyết minh ${outline.code}` : 'Soạn thuyết minh'}
      subTitle={
        stMeta ? (
          <Space>
            <Tag color={stMeta.color}>{stMeta.label}</Tag>
            {outline?.projectProposal?.code && (
              <Text type="secondary">Đề xuất: {outline.projectProposal.code}</Text>
            )}
          </Space>
        ) : undefined
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%', paddingBottom: 72 }}>
        {outline?.councilFeedback && (
          <Alert
            type="info"
            showIcon
            message="Góp ý Hội đồng (tham khảo khi soạn thuyết minh)"
            description={outline.councilFeedback}
          />
        )}
        {!editable && outline?.status === 'THUYETMINH_PENDING' && (
          <Alert
            type="success"
            showIcon
            message="Đã nộp chính thức — form chỉ đọc"
            description="Bạn có thể rút lại nếu PKH chưa phân công phản biện."
          />
        )}
        {outline?.status === 'PHANBIEN_KIN' && (
          <Alert
            type="info"
            showIcon
            message="Đang phản biện kín"
            description="Danh tính phản biện được bảo mật với chủ nhiệm và thành viên đề tài trong suốt quá trình đánh giá. Không thể rút lại thuyết minh."
          />
        )}
        {(isRevision || outline?.status === 'CHO_XAC_NHAN_KP') && revisionCtx && (
          <Alert
            type={revisionCtx.pastDeadline ? 'error' : 'warning'}
            showIcon
            message={
              isRevision
                ? 'Hồ sơ cần chỉnh sửa theo kết luận bảo vệ'
                : 'Đã nộp bản hoàn thiện — chờ xác nhận kinh phí'
            }
            description={
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {revisionCtx.revisionDeadline && (
                  <div>
                    Hạn chỉnh sửa:{' '}
                    <strong>{dayjs(revisionCtx.revisionDeadline).format('DD/MM/YYYY')}</strong>
                    {revisionCtx.pastDeadline ? ' — đã quá hạn' : ''}
                    {revisionCtx.needsReminder && !revisionCtx.pastDeadline
                      ? ` — còn ≤ ${revisionCtx.reminderDays} ngày`
                      : ''}
                  </div>
                )}
                {revisionCtx.adjustmentRequirements && (
                  <div>
                    <Text strong>Yêu cầu chỉnh sửa: </Text>
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                      {revisionCtx.adjustmentRequirements}
                    </Paragraph>
                  </div>
                )}
                {revisionCtx.discussionNotes && (
                  <div>
                    <Text strong>Ý kiến HĐ: </Text>
                    <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                      {revisionCtx.discussionNotes}
                    </Paragraph>
                  </div>
                )}
                <Space wrap>
                  {revisionCtx.minutesFileUrl && (
                    <a href={revisionCtx.minutesFileUrl} target="_blank" rel="noreferrer">
                      Xem biên bản bảo vệ
                    </a>
                  )}
                  <a onClick={() => void moSoSanh()}>So sánh với bản đã đánh giá</a>
                  {access.canExtendOutlineRevision && isRevision && (
                    <a onClick={giaHan}>PKH gia hạn deadline</a>
                  )}
                </Space>
                <Text type="secondary">{revisionCtx.diffLimitNote}</Text>
              </Space>
            }
          />
        )}

        <Card size="small" title="Tiến độ hoàn thành">
          <Progress percent={outline?.completionPercent || 0} status={editable ? 'active' : 'success'} />
        </Card>

        {outline && (
        <ProForm
          key={formReadyKey}
          formRef={formRef}
          submitter={false}
          disabled={!editable}
          layout="vertical"
          initialValues={formInitial}
        >
          <Card title="A. Thông tin chung" size="small" style={{ marginBottom: 16 }}>
            <ProFormText name="title" label="Tên đề tài" rules={[{ required: true }]} />
            <Row gutter={16}>
              <Col span={12}>
                <ProFormSelect
                  name="projectProcessTypeId"
                  label="Cấp ý tưởng/đề tài"
                  options={processTypes.map((t) => ({
                    value: t.id,
                    label: `${t.code} — ${t.name}`,
                  }))}
                  rules={[{ required: true }]}
                />
              </Col>
              <Col span={12}>
                <ProFormText name="field" label="Lĩnh vực" />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <ProFormDatePicker name="startDate" label="Ngày bắt đầu" rules={[{ required: true }]} />
              </Col>
              <Col span={8}>
                <ProFormDatePicker name="endDate" label="Ngày kết thúc" rules={[{ required: true }]} />
              </Col>
              <Col span={8}>
                <ProFormDigit
                  name="requestedBudget"
                  label="Kinh phí đề nghị (VNĐ)"
                  min={0}
                  fieldProps={{
                    precision: 0,
                    style: { width: '100%' },
                    ...vndInputNumberProps,
                    addonAfter: 'đ',
                  }}
                  rules={[{ required: true }]}
                />
              </Col>
            </Row>
            <ProFormText name="hostUnit" label="Đơn vị chủ trì" rules={[{ required: true }]} />
            <Form.Item label="Đơn vị phối hợp">
              <Table
                size="small"
                pagination={false}
                rowKey={(_, i) => `p-${i}`}
                dataSource={partners}
                columns={[
                  {
                    title: 'Tên đơn vị',
                    render: (_, __, i) => (
                      <Input
                        disabled={!editable}
                        value={partners[i]?.name}
                        onChange={(e) => {
                          const next = [...partners];
                          next[i] = { ...next[i], name: e.target.value };
                          setPartners(next);
                        }}
                      />
                    ),
                  },
                  {
                    title: 'Vai trò',
                    width: 200,
                    render: (_, __, i) => (
                      <Input
                        disabled={!editable}
                        value={partners[i]?.role || ''}
                        onChange={(e) => {
                          const next = [...partners];
                          next[i] = { ...next[i], role: e.target.value };
                          setPartners(next);
                        }}
                      />
                    ),
                  },
                  {
                    title: '',
                    width: 70,
                    render: (_, __, i) =>
                      editable ? (
                        <Button
                          type="link"
                          danger
                          onClick={() => setPartners(partners.filter((_, idx) => idx !== i))}
                        >
                          Xóa
                        </Button>
                      ) : null,
                  },
                ]}
              />
              {editable && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                  onClick={() => setPartners([...partners, { name: '', role: '' }])}
                >
                  Thêm đơn vị phối hợp
                </Button>
              )}
            </Form.Item>
            <Form.Item
              name="applicationScope"
              label="Phạm vi ứng dụng"
              rules={[{ required: true, message: 'Bắt buộc khi nộp' }]}
            >
              <RichTextHtmlField disabled={!editable} minHeight={120} />
            </Form.Item>
          </Card>

          <Card title="B. Thuyết minh khoa học" size="small" style={{ marginBottom: 16 }}>
            <Form.Item name="urgency" label="Tính cấp thiết" rules={[{ required: true }]}>
              <RichTextHtmlField disabled={!editable} minHeight={140} />
            </Form.Item>
            <Form.Item name="detailedObjectives" label="Mục tiêu chi tiết" rules={[{ required: true }]}>
              <RichTextHtmlField disabled={!editable} minHeight={140} />
            </Form.Item>
            <Form.Item name="researchContent" label="Nội dung nghiên cứu" rules={[{ required: true }]}>
              <RichTextHtmlField disabled={!editable} minHeight={180} />
            </Form.Item>
            <Form.Item name="methodology" label="Phương pháp nghiên cứu" rules={[{ required: true }]}>
              <RichTextHtmlField disabled={!editable} minHeight={140} />
            </Form.Item>

            <Form.Item label="Tiến độ thực hiện">
              <Table
                size="small"
                pagination={false}
                rowKey={(_, i) => `m-${i}`}
                dataSource={milestones}
                columns={[
                  {
                    title: 'Nội dung',
                    render: (_, __, i) => (
                      <RichTextHtmlField
                        disabled={!editable}
                        minHeight={80}
                        value={milestones[i]?.content}
                        onChange={(html) => {
                          setMilestones((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], content: html };
                            return next;
                          });
                        }}
                      />
                    ),
                  },
                  {
                    title: 'Bắt đầu',
                    width: 140,
                    render: (_, __, i) => (
                      <Input
                        type="date"
                        disabled={!editable}
                        value={milestones[i]?.startDate?.slice(0, 10) || ''}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          setMilestones((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], startDate: v };
                            return next;
                          });
                        }}
                      />
                    ),
                  },
                  {
                    title: 'Kết thúc',
                    width: 140,
                    render: (_, __, i) => (
                      <Input
                        type="date"
                        disabled={!editable}
                        value={milestones[i]?.endDate?.slice(0, 10) || ''}
                        onChange={(e) => {
                          const v = e.target.value || null;
                          setMilestones((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], endDate: v };
                            return next;
                          });
                        }}
                      />
                    ),
                  },
                  {
                    title: 'Kết quả dự kiến',
                    render: (_, __, i) => (
                      <Input
                        disabled={!editable}
                        value={milestones[i]?.expectedResult || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setMilestones((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], expectedResult: v };
                            return next;
                          });
                        }}
                      />
                    ),
                  },
                  {
                    title: '',
                    width: 70,
                    render: (_, __, i) =>
                      editable ? (
                        <Button
                          type="link"
                          danger
                          onClick={() =>
                            setMilestones((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          Xóa
                        </Button>
                      ) : null,
                  },
                ]}
              />
              {editable && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                  onClick={() =>
                    setMilestones((prev) => [...prev, { content: '' }])
                  }
                >
                  Thêm mốc tiến độ
                </Button>
              )}
            </Form.Item>

            <Form.Item label="Sản phẩm dự kiến">
              <Table
                size="small"
                pagination={false}
                rowKey={(_, i) => `pr-${i}`}
                dataSource={products}
                columns={[
                  {
                    title: 'Tên sản phẩm',
                    render: (_, __, i) => (
                      <Input
                        disabled={!editable}
                        value={products[i]?.name}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProducts((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], name: v };
                            return next;
                          });
                        }}
                      />
                    ),
                  },
                  {
                    title: 'Số lượng',
                    width: 120,
                    render: (_, __, i) => (
                      <Input
                        disabled={!editable}
                        value={products[i]?.quantity || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProducts((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], quantity: v };
                            return next;
                          });
                        }}
                      />
                    ),
                  },
                  {
                    title: 'Yêu cầu chất lượng',
                    render: (_, __, i) => (
                      <Input
                        disabled={!editable}
                        value={products[i]?.quality || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setProducts((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], quality: v };
                            return next;
                          });
                        }}
                      />
                    ),
                  },
                  {
                    title: '',
                    width: 70,
                    render: (_, __, i) =>
                      editable ? (
                        <Button
                          type="link"
                          danger
                          onClick={() =>
                            setProducts((prev) => prev.filter((_, idx) => idx !== i))
                          }
                        >
                          Xóa
                        </Button>
                      ) : null,
                  },
                ]}
              />
              {editable && (
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  style={{ marginTop: 8 }}
                  onClick={() => setProducts((prev) => [...prev, { name: '' }])}
                >
                  Thêm sản phẩm
                </Button>
              )}
            </Form.Item>
          </Card>

          <Card title="C. Thành viên tham gia đề tài" size="small" style={{ marginBottom: 16 }}>
              <AuthorsEditor
                value={members}
                onChange={setMembers}
                disabled={!editable}
                hideRoleColumns
                showContribution
              />
          </Card>

          <Card title="D. Kinh phí chi tiết" size="small" style={{ marginBottom: 16 }}>
            <Table
              size="small"
              pagination={false}
              rowKey={(_, i) => `b-${i}`}
              dataSource={budgetLines}
              columns={[
                {
                  title: 'Nhóm chi',
                  width: 150,
                  render: (_, __, i) => (
                    <Select
                      style={{ width: '100%' }}
                      disabled={!editable}
                      options={BUDGET_GROUP_OPTIONS}
                      value={budgetLines[i]?.groupCode}
                      onChange={(v) => {
                        setBudgetLines((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], groupCode: v };
                          return next;
                        });
                      }}
                    />
                  ),
                },
                {
                  title: 'Nội dung chi',
                  render: (_, __, i) => (
                    <Input
                      disabled={!editable}
                      value={budgetLines[i]?.content}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBudgetLines((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], content: v };
                          return next;
                        });
                      }}
                    />
                  ),
                },
                {
                  title: 'Số tiền',
                  width: 150,
                  render: (_, __, i) => (
                    <InputNumber
                      style={{ width: '100%' }}
                      min={0}
                      disabled={!editable}
                      value={budgetLines[i]?.amount}
                      {...vndInputNumberProps}
                      addonAfter="đ"
                      onChange={(v) => {
                        setBudgetLines((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], amount: Number(v || 0) };
                          return next;
                        });
                      }}
                    />
                  ),
                },
                {
                  title: 'Ghi chú',
                  render: (_, __, i) => (
                    <Input
                      disabled={!editable}
                      value={budgetLines[i]?.note || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setBudgetLines((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], note: v };
                          return next;
                        });
                      }}
                    />
                  ),
                },
                {
                  title: '',
                  width: 70,
                  render: (_, __, i) =>
                    editable ? (
                      <Button
                        type="link"
                        danger
                        onClick={() =>
                          setBudgetLines((prev) => prev.filter((_, idx) => idx !== i))
                        }
                      >
                        Xóa
                      </Button>
                    ) : null,
                },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={2}>
                    <strong>Tổng chi tiết</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <strong>{formatVnd(totalDetail)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} colSpan={2}>
                    <Text type={budgetDiff > 1000 ? 'danger' : 'secondary'}>
                      Chênh lệch: {formatVnd(budgetDiff)} (≤ {formatVnd(1000)})
                    </Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
            {editable && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                style={{ marginTop: 8 }}
                onClick={() =>
                  setBudgetLines((prev) => [
                    ...prev,
                    { groupCode: 'NHAN_CONG', content: '', amount: 0, note: '' },
                  ])
                }
              >
                Thêm dòng kinh phí
              </Button>
            )}
          </Card>

          <Card title="E. Tài liệu đính kèm" size="small" style={{ marginBottom: 16 }}>
            <Form.Item
              name="outlineFileUrl"
              label="File thuyết minh (PDF/DOCX ≤20MB)"
              rules={[{ required: true, message: 'Bắt buộc khi nộp' }]}
            >
              <ProposalAttachmentUpload
                folder="projects/outline-files"
                maxMb={20}
                disabled={!editable}
              />
            </Form.Item>
            <Form.Item name="appendixFileUrl" label="Tài liệu phụ lục (tuỳ chọn)">
              <ProposalAttachmentUpload
                folder="projects/outline-files"
                maxMb={20}
                disabled={!editable}
              />
            </Form.Item>
          </Card>

          {isRevision && (
            <Card title="F. Giải trình chỉnh sửa" size="small">
              <Text type="secondary">
                Bắt buộc khi nộp bản hoàn thiện (≥ {revisionCtx?.minExplanationLength || 100} ký
                tự). Bản HĐ đã đánh giá được giữ nguyên.
              </Text>
              <TextArea
                style={{ marginTop: 8 }}
                rows={5}
                disabled={!editable}
                value={explanation}
                showCount
                maxLength={20000}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Mô tả đã chỉnh sửa những gì theo góp ý HĐ..."
              />
            </Card>
          )}
        </ProForm>
        )}
      </Space>

      <Drawer
        title="So sánh với bản đã đánh giá"
        width={720}
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
      >
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message={diffNote} />
        <Table
          size="small"
          rowKey="field"
          pagination={false}
          dataSource={diffs}
          locale={{ emptyText: 'Không có khác biệt trường form' }}
          columns={[
            { title: 'Trường', dataIndex: 'label', width: 160 },
            { title: 'Loại', dataIndex: 'kind', width: 70 },
            {
              title: 'Trước (bản HĐ)',
              dataIndex: 'before',
              ellipsis: true,
              render: (t) => <Text style={{ whiteSpace: 'pre-wrap' }}>{t || '—'}</Text>,
            },
            {
              title: 'Sau (hiện tại)',
              dataIndex: 'after',
              ellipsis: true,
              render: (t) => <Text style={{ whiteSpace: 'pre-wrap' }}>{t || '—'}</Text>,
            },
          ]}
        />
      </Drawer>

      <FooterToolbar>
        <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/projects/my')}>
          Quay lại
        </Button>
        {editable && (
          <>
            <Button icon={<SaveOutlined />} loading={saving} onClick={() => void luuNhap()}>
              Lưu nháp
            </Button>
            {!isRevision && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={saving}
                onClick={() => nopChinhThuc()}
              >
                Nộp chính thức
              </Button>
            )}
            {isRevision && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={saving}
                onClick={() => nopBanHoanThien()}
              >
                Nộp bản hoàn thiện
              </Button>
            )}
          </>
        )}
        {outline?.status === 'THUYETMINH_PENDING' && (
          <Button danger onClick={() => rutLai()}>
            Rút lại
          </Button>
        )}
      </FooterToolbar>
    </PageContainer>
  );
};

export default OutlineFormPage;
