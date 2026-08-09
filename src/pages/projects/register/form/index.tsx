/**
 * Form nộp hồ sơ đề xuất đề tài — full page + FooterToolbar cố định
 * Phân cấp đề tài = danh mục Loại quy trình đề tài (QT-I … QT-V)
 */
import {
  PageContainer,
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
  ProFormDigit,
  FooterToolbar,
  type ProFormInstance,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { history, useAccess, useModel, useParams } from '@umijs/max';
import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { vndInputNumberProps } from '@/utils/format';
import {
  createProposal,
  updateProposal,
  getProposal,
  submitProposal,
  resubmitProposalToPkh,
  submitCouncilAdjustment,
  getProposalAdjustmentVersions,
  extendProposalAdjustment,
  getProposalMembers,
  saveProposalMembers,
  FIELD_OPTIONS,
  PROPOSAL_STATUS_MAP,
  type ProposalCreateData,
  type ProposalLevel,
  type ProjectProposal,
  type ProposalAdjustmentVersion,
} from '@/services/api/projectProposals';
import type { PublicationAuthor } from '@/services/api/profilePublications';
import { getActiveSubmissionPeriod } from '@/services/api/callForProposals';
import {
  getProjectProcessTypeOptions,
  type ProjectProcessTypeOption,
} from '@/services/api/projectProcessTypes';
import { openOrCreateOutlineFromProposal } from '@/services/api/projectOutlines';
import ProposalAttachmentUpload from '@/components/ProposalAttachmentUpload';
import AuthorsEditor from '@/components/AuthorsEditor';

const { Text, Title, Paragraph } = Typography;

/** Ánh xạ mã QT → cấp kiểm tra kỳ CFP (khớp backend) */
const QT_CODE_TO_LEVEL: Record<string, ProposalLevel> = {
  'QT-I': 'TRUONG',
  'QT-II': 'BO',
  'QT-III': 'CO_SO',
  'QT-IV': 'NHA_NUOC',
  'QT-V': 'CO_SO',
};

const ProposalFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser as { id?: number | string } | undefined;
  const formRef = useRef<ProFormInstance>();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [proposal, setProposal] = useState<ProjectProposal | null>(null);
  const [processTypes, setProcessTypes] = useState<ProjectProcessTypeOption[]>([]);
  const [kyMo, setKyMo] = useState<{
    title: string;
    deadlineAt: string;
    levels: string[];
  } | null>(null);
  const [kyHetHan, setKyHetHan] = useState(false);
  const [members, setMembers] = useState<PublicationAuthor[]>([]);
  const [explanation, setExplanation] = useState('');
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versions, setVersions] = useState<ProposalAdjustmentVersion[]>([]);

  const isOwner =
    !!currentUser?.id && !!proposal && Number(currentUser.id) === Number(proposal.ownerId);
  const dangDieuChinh = proposal?.status === 'DIEU_CHINH' && isOwner;
  const khoaTruongDieuChinh = dangDieuChinh && !!proposal?.adjustmentOverdue;

  const coTheSua =
    !isEdit ||
    proposal?.status === 'DRAFT' ||
    proposal?.status === 'RETURNED' ||
    proposal?.status === 'YEU_CAU_BS';

  /** Form mở khi sửa thường hoặc đang điều chỉnh HĐ (chưa quá hạn) */
  const formMo =
    (coTheSua && (!kyHetHan || proposal?.status === 'YEU_CAU_BS')) ||
    (dangDieuChinh && !khoaTruongDieuChinh);
  const khoaTruongKhac =
    !coTheSua || dangDieuChinh || (kyHetHan && proposal?.status !== 'YEU_CAU_BS');

  const processTypeOptions = useMemo(
    () =>
      processTypes.map((p) => ({
        value: p.id,
        label: `${p.code}: ${p.name}`,
      })),
    [processTypes],
  );

  const levelTuProcessTypeId = (processTypeId: number): ProposalLevel => {
    const row = processTypes.find((p) => Number(p.id) === Number(processTypeId));
    return (row && QT_CODE_TO_LEVEL[row.code]) || 'TRUONG';
  };

  const kiemTraKy = async (level: ProposalLevel, processTypeId?: number | null) => {
    try {
      const res = await getActiveSubmissionPeriod(level, processTypeId);
      const d = res?.data;
      if (d) {
        setKyMo({
          title: d.title,
          deadlineAt: d.deadlineAt,
          levels: d.levels || [],
        });
        setKyHetHan(false);
        return true;
      }
      setKyMo(null);
      setKyHetHan(true);
      return false;
    } catch {
      setKyMo(null);
      setKyHetHan(true);
      return false;
    }
  };

  // Load danh mục loại quy trình đề tài
  useEffect(() => {
    let cancelled = false;
    setLoadingTypes(true);
    getProjectProcessTypeOptions()
      .then((res) => {
        if (cancelled) return;
        // Hỗ trợ cả { data: [] } và mảng trực tiếp
        const rows = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? (res as unknown as ProjectProcessTypeOption[])
            : [];
        setProcessTypes(rows);
        const qtI = rows.find((r) => r.code === 'QT-I');
        const defaultLevel = (qtI && QT_CODE_TO_LEVEL[qtI.code]) || 'TRUONG';
        void kiemTraKy(defaultLevel, qtI?.id);
      })
      .catch((e) => {
        if (!cancelled) {
          setProcessTypes([]);
          message.error(e?.message || 'Không tải được danh mục loại quy trình đề tài');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    Promise.all([getProposal(Number(id)), getProposalMembers(Number(id))])
      .then(([res, memRes]) => {
        const d = res.data;
        if (!d) return;
        setProposal(d);
        setMembers(Array.isArray(memRes?.data) ? memRes.data : []);
        void kiemTraKy(d.level, d.projectProcessTypeId);
        if (
          d.status !== 'DRAFT' &&
          d.status !== 'RETURNED' &&
          d.status !== 'YEU_CAU_BS' &&
          d.status !== 'DIEU_CHINH'
        ) {
          message.info('Hồ sơ đã gửi — chỉ xem, không sửa được.');
        }
        if (d.status === 'DIEU_CHINH') {
          setExplanation(d.adjustmentExplanation || '');
        }
      })
      .catch((e) => message.error(e?.message || 'Không tải được đề xuất'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  /** Lưu danh sách thành viên sau khi có id đề xuất */
  const luuThanhVien = async (proposalId: number) => {
    await saveProposalMembers(proposalId, members);
  };

  if (!access.canCreateProjectProposal) {
    return <PageContainer>Bạn không có quyền nộp đề xuất đề tài.</PageContainer>;
  }

  const buildPayload = (values: Record<string, unknown>): ProposalCreateData => {
    const projectProcessTypeId = Number(values.projectProcessTypeId);
    return {
      title: String(values.title || '').trim(),
      field: String(values.field || ''),
      projectProcessTypeId,
      level: levelTuProcessTypeId(projectProcessTypeId),
      year: Number(values.year) || dayjs().year(),
      durationMonths: Number(values.durationMonths),
      objectives: String(values.objectives || '').trim(),
      summary: String(values.objectives || '').trim().slice(0, 2000),
      expectedResults: String(values.expectedResults || '').trim(),
      researchDirection: values.researchDirection
        ? String(values.researchDirection).trim()
        : null,
      requestedBudgetTotal: Number(values.requestedBudgetTotal),
      // coAuthors đồng bộ từ bảng members trên BE sau khi saveProposalMembers
      coAuthors: members.map((m) => m.fullName).filter(Boolean),
      attachmentUrl: (values.attachmentUrl as string) || null,
    };
  };

  const luuNhap = async () => {
    try {
      await formRef.current?.validateFields();
    } catch {
      return;
    }
    const raw = formRef.current?.getFieldsValue?.(true) || {};
    const payload = buildPayload(raw as Record<string, unknown>);
    if (!payload.projectProcessTypeId) {
      message.warning('Vui lòng chọn Phân cấp đề tài');
      return;
    }
    if (!(await kiemTraKy(payload.level || 'TRUONG', payload.projectProcessTypeId))) {
      message.error('Không có kỳ tiếp nhận đang mở cho cấp đề tài này.');
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        const res = await updateProposal(Number(id), payload);
        setProposal(res.data || null);
        await luuThanhVien(Number(id));
        message.success('Đã lưu nháp');
      } else {
        const res = await createProposal(payload);
        const newId = res.data?.id;
        if (newId) {
          await luuThanhVien(newId);
          message.success('Đã tạo nháp');
          history.replace(`/projects/register/form/${newId}`);
        } else {
          message.success('Đã tạo nháp');
        }
      }
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const guiHoSo = async () => {
    try {
      await formRef.current?.validateFields();
    } catch {
      return;
    }
    const raw = formRef.current?.getFieldsValue?.(true) || {};
    const payload = buildPayload(raw as Record<string, unknown>);
    if (!payload.attachmentUrl) {
      message.warning('Vui lòng đính kèm file biểu mẫu PDF/DOCX');
      return;
    }
    const dangBoSungPkh = proposal?.status === 'YEU_CAU_BS';
    if (!dangBoSungPkh && !(await kiemTraKy(payload.level || 'TRUONG', payload.projectProcessTypeId))) {
      message.error('Kỳ tiếp nhận đã hết hạn — không gửi được.');
      return;
    }
    setSubmitting(true);
    try {
      let pid = isEdit ? Number(id) : 0;
      if (isEdit) {
        await updateProposal(pid, payload);
      } else {
        const res = await createProposal(payload);
        pid = res.data?.id || 0;
      }
      if (!pid) throw new Error('Không có mã đề xuất');
      await luuThanhVien(pid);
      if (dangBoSungPkh) {
        await resubmitProposalToPkh(pid);
        message.success('Đã gửi lại hồ sơ cho PKH');
      } else {
        await submitProposal(pid);
        message.success('Đã gửi hồ sơ lên Khoa');
      }
      history.push('/projects/register');
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Gửi thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  /** US-03-05 — nộp lại điều chỉnh HĐ */
  const nopDieuChinh = async () => {
    if (!proposal || !dangDieuChinh) return;
    try {
      await formRef.current?.validateFields(['title', 'objectives']);
    } catch {
      return;
    }
    const raw = formRef.current?.getFieldsValue?.(true) || {};
    const title = String(raw.title || '').trim();
    const objectives = String(raw.objectives || '').trim();
    const note = explanation.trim();
    if (note.length < 50) {
      message.error('Ghi chú giải trình tối thiểu 50 ký tự');
      return;
    }
    if (title === proposal.title.trim() && objectives === proposal.objectives.trim()) {
      message.error('Cần cập nhật Tên đề tài và/hoặc Mục tiêu');
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitCouncilAdjustment(proposal.id, {
        title,
        objectives,
        explanation: note,
      });
      setProposal(res.data || null);
      message.success('Đã nộp lại điều chỉnh — trạng thái Được chọn. Soạn thuyết minh đã mở.');
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Nộp điều chỉnh thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const moSoSanhVersion = async () => {
    if (!proposal) return;
    try {
      const res = await getProposalAdjustmentVersions(proposal.id);
      setVersions(Array.isArray(res.data) ? res.data : []);
      setVersionsOpen(true);
    } catch (e: any) {
      message.error(e?.message || 'Không tải được phiên bản điều chỉnh');
    }
  };

  const stMeta = proposal?.status ? PROPOSAL_STATUS_MAP[proposal.status] : null;
  const defaultProcessTypeId =
    proposal?.projectProcessTypeId ??
    processTypes.find((p) => p.code === 'QT-I')?.id;

  return (
    <PageContainer
      loading={(loading && isEdit) || loadingTypes}
      title={isEdit ? 'Chỉnh sửa đề xuất đề tài' : 'Nộp hồ sơ đề xuất đề tài'}
      subTitle={proposal?.code}
    >
      <Space direction="vertical" size={16} style={{ width: '100%', paddingBottom: 72 }}>
        {kyMo && (
          <Alert
            type="success"
            showIcon
            message={
              <span>
                Kỳ đang mở: <strong>{kyMo.title}</strong> — hạn nộp{' '}
                <strong>{dayjs(kyMo.deadlineAt).format('DD/MM/YYYY')}</strong>
              </span>
            }
          />
        )}
        {kyHetHan && (
          <Alert
            type="error"
            showIcon
            message="Kỳ tiếp nhận đã hết hạn hoặc chưa mở"
            description="Bạn chỉ được xem hồ sơ. Không tạo/gửi đề xuất mới cho đến khi có kỳ OPEN."
          />
        )}
        {proposal?.status === 'RETURNED' && proposal.unitComment && (
          <Alert
            type="warning"
            showIcon
            message="Khoa yêu cầu chỉnh sửa"
            description={proposal.unitComment}
          />
        )}
        {proposal?.status === 'YEU_CAU_BS' && (
          <Alert
            type="warning"
            showIcon
            message={
              proposal.supplementOverdue
                ? 'PKH yêu cầu bổ sung — đã quá hạn'
                : 'PKH yêu cầu bổ sung hồ sơ'
            }
            description={
              <>
                {proposal.pkhComment || 'Vui lòng cập nhật hồ sơ và gửi lại PKH.'}
                {proposal.supplementDueAt && (
                  <div>
                    Hạn bổ sung: {dayjs(proposal.supplementDueAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                )}
              </>
            }
          />
        )}
        {proposal?.status === 'DIEU_CHINH' && (
          <Alert
            type={proposal.adjustmentOverdue ? 'error' : 'warning'}
            showIcon
            message={
              proposal.adjustmentOverdue
                ? 'Cần điều chỉnh — đã quá hạn'
                : 'Cần điều chỉnh theo yêu cầu Hội đồng'
            }
            description={
              <>
                <div>
                  <strong>Yêu cầu Hội đồng:</strong>{' '}
                  {proposal.councilAdjustmentNote || '—'}
                </div>
                {proposal.adjustmentNotifiedAt && (
                  <div>
                    Ngày thông báo:{' '}
                    {dayjs(proposal.adjustmentNotifiedAt).format('DD/MM/YYYY HH:mm')}
                  </div>
                )}
                {proposal.adjustmentDueAt && (
                  <div>
                    Hạn nộp lại: {dayjs(proposal.adjustmentDueAt).format('DD/MM/YYYY HH:mm')}
                    {proposal.adjustmentOverdue ? ' (quá hạn)' : ' (còn hạn)'}
                  </div>
                )}
                <div>Chỉ được sửa Tên đề tài và Mục tiêu. Ghi chú giải trình bắt buộc (≥50 ký tự).</div>
              </>
            }
          />
        )}
        {proposal?.status === 'DUOC_CHON' && proposal.canWriteOutline && (
          <Alert
            type="success"
            showIcon
            message="Đề xuất được tuyển chọn — có thể soạn thuyết minh"
            description={
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {proposal.councilAdjustmentNote && (
                  <div>
                    <strong>Góp ý Hội đồng (tham khảo khi soạn thuyết minh):</strong>{' '}
                    {proposal.councilAdjustmentNote}
                  </div>
                )}
                <Space wrap>
                  <Button
                    type="primary"
                    size="small"
                    onClick={async () => {
                      try {
                        const res = await openOrCreateOutlineFromProposal(proposal.id);
                        if (res.data?.id) {
                          history.push(`/projects/outlines/form/${res.data.id}`);
                        }
                      } catch (e: any) {
                        message.error(
                          e?.data?.message || e?.message || 'Không mở được thuyết minh',
                        );
                      }
                    }}
                  >
                    Soạn thuyết minh
                  </Button>
                  <Button size="small" onClick={() => void moSoSanhVersion()}>
                    Xem bản trước/sau điều chỉnh
                  </Button>
                </Space>
              </Space>
            }
          />
        )}
        {proposal?.status === 'KHONG_CHON' && (
          <Alert
            type="error"
            showIcon
            message="Đề xuất không được tuyển chọn trong kỳ này"
            description="Không áp dụng chức năng Soạn thuyết minh."
          />
        )}
        {!loadingTypes && processTypeOptions.length === 0 && (
          <Alert
            type="warning"
            showIcon
            message="Chưa có dữ liệu danh mục Loại quy trình đề tài"
            description="Vào Hệ thống → Danh mục hệ thống → Loại quy trình đề tài để kiểm tra / seed dữ liệu."
          />
        )}
        {stMeta && (
          <Tag color={stMeta.color} style={{ fontSize: 14, padding: '2px 10px' }}>
            {stMeta.label}
          </Tag>
        )}

        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <Title level={5} style={{ marginTop: 0 }}>
            Thông tin đề xuất
          </Title>
          <Paragraph type="secondary" style={{ marginBottom: 24 }}>
            Điền đủ các trường bắt buộc, đính kèm biểu mẫu, lưu nháp rồi gửi lên Khoa khi sẵn sàng.
          </Paragraph>

          {!loadingTypes && (
            <ProForm
              formRef={formRef}
              submitter={false}
              disabled={false}
              initialValues={
                proposal
                  ? {
                      title: proposal.title,
                      field: proposal.field,
                      projectProcessTypeId: proposal.projectProcessTypeId,
                      year: proposal.year,
                      durationMonths: proposal.durationMonths,
                      objectives: proposal.objectives,
                      expectedResults: proposal.expectedResults,
                      researchDirection: proposal.researchDirection,
                      requestedBudgetTotal: proposal.requestedBudgetTotal,
                      attachmentUrl: proposal.attachmentUrl,
                    }
                  : {
                      projectProcessTypeId: defaultProcessTypeId,
                      year: dayjs().year(),
                      durationMonths: 12,
                      field: FIELD_OPTIONS[0],
                    }
              }
              key={
                proposal
                  ? `p-${proposal.id}-${proposal.updatedAt}`
                  : `new-${processTypes.map((p) => p.id).join('-')}`
              }
            >
              <Row gutter={[16, 0]}>
                <Col span={24}>
                  <ProFormText
                    name="title"
                    label="Tên đề tài"
                    placeholder="Nhập tên đầy đủ của đề tài"
                    rules={[{ required: true, message: 'Bắt buộc' }]}
                    disabled={!formMo}
                    fieldProps={{ size: 'large' }}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <ProFormSelect
                    name="projectProcessTypeId"
                    label="Phân cấp đề tài"
                    options={processTypeOptions}
                    rules={[{ required: true, message: 'Bắt buộc' }]}
                    disabled={khoaTruongKhac}
                    placeholder={
                      processTypeOptions.length
                        ? 'Chọn loại quy trình đề tài'
                        : 'Không có dữ liệu danh mục'
                    }
                    fieldProps={{
                      size: 'large',
                      showSearch: true,
                      optionFilterProp: 'label',
                      loading: loadingTypes,
                      onChange: (v: number) =>
                        void kiemTraKy(levelTuProcessTypeId(v), v),
                    }}
                    extra="Nguồn: danh mục Loại quy trình đề tài (QT-I … QT-V)"
                  />
                </Col>
                <Col xs={24} md={12}>
                  <ProFormSelect
                    name="field"
                    label="Lĩnh vực"
                    options={FIELD_OPTIONS.map((f) => ({ label: f, value: f }))}
                    rules={[{ required: true, message: 'Bắt buộc' }]}
                    disabled={khoaTruongKhac}
                    fieldProps={{ size: 'large' }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <ProFormDigit
                    name="year"
                    label="Năm đề xuất"
                    min={2020}
                    max={2035}
                    rules={[{ required: true }]}
                    disabled={khoaTruongKhac}
                    fieldProps={{ size: 'large', style: { width: '100%' } }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <ProFormDigit
                    name="durationMonths"
                    label="Thời gian thực hiện (tháng)"
                    min={1}
                    max={60}
                    rules={[{ required: true, message: 'Bắt buộc' }]}
                    disabled={khoaTruongKhac}
                    fieldProps={{ size: 'large', style: { width: '100%' } }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <ProFormDigit
                    name="requestedBudgetTotal"
                    label="Kinh phí dự kiến (VNĐ)"
                    min={0}
                    rules={[{ required: true, message: 'Bắt buộc' }]}
                    disabled={khoaTruongKhac}
                    fieldProps={{
                      size: 'large',
                      style: { width: '100%' },
                      ...vndInputNumberProps,
                      addonAfter: 'đ',
                    }}
                  />
                </Col>
                <Col span={24}>
                  <ProFormText
                    name="researchDirection"
                    label="Hướng nghiên cứu chính"
                    placeholder="Không bắt buộc"
                    disabled={khoaTruongKhac}
                    fieldProps={{ size: 'large' }}
                  />
                </Col>
                <Col span={24}>
                  <ProFormTextArea
                    name="objectives"
                    label="Mục tiêu tổng quát"
                    rules={[{ required: true, message: 'Bắt buộc' }]}
                    disabled={!formMo}
                    fieldProps={{ rows: 4, showCount: true, maxLength: 4000 }}
                  />
                </Col>
                {dangDieuChinh && (
                  <Col span={24}>
                    <Form.Item
                      label="Ghi chú giải trình"
                      required
                      extra="Bắt buộc · tối thiểu 50 ký tự · mô tả cách tiếp thu yêu cầu Hội đồng"
                    >
                      <Input.TextArea
                        rows={4}
                        showCount
                        maxLength={4000}
                        value={explanation}
                        disabled={khoaTruongDieuChinh}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="Giải trình cách đã chỉnh sửa theo góp ý Hội đồng..."
                      />
                    </Form.Item>
                  </Col>
                )}
                <Col span={24}>
                  <ProFormTextArea
                    name="expectedResults"
                    label="Sản phẩm dự kiến"
                    rules={[{ required: true, message: 'Bắt buộc' }]}
                    disabled={khoaTruongKhac}
                    fieldProps={{ rows: 4, showCount: true, maxLength: 4000 }}
                  />
                </Col>
                <Col span={24}>
                  <Divider orientation="left" plain>
                    Danh sách thành viên
                  </Divider>
                  <Form.Item
                    label="Thành viên tham gia"
                    extra="Chọn từ hồ sơ NCV/sinh viên hoặc nhập tay. Không bắt buộc. Có thể bỏ trống."
                  >
                    <AuthorsEditor
                      value={members}
                      onChange={setMembers}
                      disabled={khoaTruongKhac}
                      hideRoleColumns
                      showContribution
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="attachmentUrl"
                    label="File biểu mẫu đề xuất"
                    extra="Bắt buộc khi gửi Khoa. Chỉ PDF hoặc DOCX, tối đa 10MB."
                  >
                    <ProposalAttachmentUpload disabled={khoaTruongKhac} />
                  </Form.Item>
                </Col>
              </Row>
            </ProForm>
          )}

          {currentUser?.id && proposal && Number(currentUser.id) !== Number(proposal.ownerId) && (
            <Text type="secondary">Bạn đang xem hồ sơ của người khác.</Text>
          )}
        </Card>
      </Space>

      <FooterToolbar>
        <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/projects/register')}>
          Quay lại
        </Button>
        {(proposal?.status === 'DIEU_CHINH' || proposal?.status === 'DUOC_CHON') && (
          <Button onClick={() => void moSoSanhVersion()}>Xem bản gốc / sau điều chỉnh</Button>
        )}
        {access.canExtendProposalAdjustment && proposal?.status === 'DIEU_CHINH' && (
          <Button
            onClick={async () => {
              try {
                const res = await extendProposalAdjustment(proposal.id, {
                  businessDays: 5,
                  reason: 'PKH gia hạn 5 ngày làm việc',
                });
                setProposal(res.data || proposal);
                message.success('Đã gia hạn điều chỉnh');
              } catch (e: any) {
                message.error(e?.data?.message || e?.message || 'Gia hạn thất bại');
              }
            }}
          >
            PKH gia hạn (+5 ngày LV)
          </Button>
        )}
        {dangDieuChinh && !khoaTruongDieuChinh && (
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={submitting}
            onClick={() => void nopDieuChinh()}
          >
            Nộp lại điều chỉnh
          </Button>
        )}
        {coTheSua && (!kyHetHan || proposal?.status === 'YEU_CAU_BS') && (
          <>
            <Button icon={<SaveOutlined />} loading={saving} onClick={() => void luuNhap()}>
              Lưu
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={() => void guiHoSo()}
            >
              {proposal?.status === 'YEU_CAU_BS' ? 'Gửi lại PKH' : 'Gửi lên Khoa'}
            </Button>
          </>
        )}
      </FooterToolbar>

      <Modal
        title="Đối chiếu bản gốc / sau điều chỉnh"
        open={versionsOpen}
        onCancel={() => setVersionsOpen(false)}
        footer={null}
        width={800}
      >
        {versions.length === 0 ? (
          <p>Chưa có phiên bản điều chỉnh.</p>
        ) : (
          versions.map((v) => (
            <Card
              key={v.id}
              size="small"
              title={v.versionType === 'ORIGINAL' ? 'Bản gốc (trước điều chỉnh)' : 'Bản sau nộp lại'}
              style={{ marginBottom: 12 }}
            >
              <p>
                <strong>Tên đề tài:</strong> {v.title}
              </p>
              <p>
                <strong>Mục tiêu:</strong> {v.objectives}
              </p>
              {v.explanationNote && (
                <p>
                  <strong>Giải trình:</strong> {v.explanationNote}
                </p>
              )}
              {v.createdAt && (
                <Text type="secondary">{dayjs(v.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
              )}
            </Card>
          ))
        )}
      </Modal>
    </PageContainer>
  );
};

export default ProposalFormPage;
