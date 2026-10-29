/**
 * Chi tiết hồ sơ phê duyệt TM — BGH / TC-HC
 */
import ProposalAttachmentUpload from '@/components/ProposalAttachmentUpload';
import {
  bghApproveOutline,
  bghRejectOutline,
  getOutlineApprovalDossier,
  hcPublishOutlineDecision,
  type OutlineApprovalDossier,
} from '@/services/api/projectOutlineApprovals';
import {
  OUTLINE_STATUS_MAP,
  type ProjectOutlineStatus,
} from '@/services/api/projectOutlines';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilePdfOutlined,
  FileProtectOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import '../outline-approvals.less';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

function formatSize(bytes?: number | null) {
  if (bytes == null || !Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const OutlineApprovalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const outlineId = Number(id);
  const access = useAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<OutlineApprovalDossier | null>(null);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [publishForm] = Form.useForm();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const load = useCallback(async () => {
    if (!Number.isFinite(outlineId)) return;
    setLoading(true);
    try {
      const res = await getOutlineApprovalDossier(outlineId);
      setData(res.data || null);
      if (res.data?.outline?.requestedBudget != null) {
        approveForm.setFieldsValue({
          approvedBudget: res.data.outline.approvedBudget ?? res.data.outline.requestedBudget,
          note: res.data.outline.bghDecisionNote || '',
        });
      }
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [outlineId, approveForm]);

  useEffect(() => {
    void load();
  }, [load]);

  const o = data?.outline;
  const stMeta = o
    ? OUTLINE_STATUS_MAP[o.status as ProjectOutlineStatus]
    : null;
  const canBgh =
    !!data?.permissions?.canBgh &&
    !!data?.canApprove &&
    !!access.canApproveOutlineRevisionBgh;
  const canHc =
    !!data?.permissions?.canHc &&
    !!data?.canPublish &&
    !!access.canPublishContract;

  const pheDuyet = async () => {
    try {
      const v = await approveForm.validateFields();
      setSaving(true);
      const res = await bghApproveOutline(outlineId, {
        approvedBudget: Number(v.approvedBudget),
        note: v.note?.trim() || undefined,
      });
      message.success(res.message || 'Đã ký phê duyệt');
      setApproveOpen(false);
      setData(res.data || null);
      await load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.data?.message || e?.message || 'Phê duyệt thất bại');
    } finally {
      setSaving(false);
    }
  };

  const tuChoi = async () => {
    try {
      const v = await rejectForm.validateFields();
      setSaving(true);
      const res = await bghRejectOutline(outlineId, v.reason.trim());
      message.success(res.message || 'Đã từ chối');
      setRejectOpen(false);
      await load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.data?.message || e?.message || 'Từ chối thất bại');
    } finally {
      setSaving(false);
    }
  };

  const phatHanh = async () => {
    Modal.confirm({
      title: 'Phát hành QĐ giao thực hiện?',
      content:
        'Sau khi phát hành, thuyết minh chuyển được duyệt (TM_DUOC_DUYET), mở Module 5 và gửi email CNNV kèm kinh phí.',
      okText: 'Phát hành',
      cancelText: 'Hủy',
      onOk: async () => {
        setSaving(true);
        try {
          const url = publishForm.getFieldValue('decisionFileUrl');
          const res = await hcPublishOutlineDecision(outlineId, {
            decisionFileUrl: url || null,
          });
          message.success(res.message || 'Đã phát hành QĐ');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Phát hành thất bại');
          throw e;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  return (
    <PageContainer
      className="oa-detail"
      loading={loading}
      title={o ? `Phê duyệt ${o.code}` : 'Hồ sơ phê duyệt'}
      onBack={() => history.push('/projects/outline-approvals')}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => history.push('/projects/outline-approvals')}
        >
          Danh sách
        </Button>
      }
    >
      {!data || !o ? (
        <Spin />
      ) : (
        <>
          <div className="oa-hero">
            <Space wrap>
              <Tag color="gold">US-04 · Phê duyệt cuối</Tag>
              {stMeta && <Tag color={stMeta.color}>{stMeta.label}</Tag>}
              {data.appraisal.councilConclusion && (
                <Tag color="cyan">{data.appraisal.councilConclusion}</Tag>
              )}
            </Space>
            <Title level={3} className="oa-hero__title">
              {o.title}
            </Title>
            <Paragraph className="oa-hero__sub">
              CNNV: {o.ownerName || '—'} · KP đề nghị{' '}
              {formatVnd(Number(o.requestedBudget || 0))}
            </Paragraph>
          </div>

          <div className="oa-stat-grid">
            <div className="oa-stat">
              <div className="oa-stat__label">Điểm TB BM.05a</div>
              <div className="oa-stat__value">
                {data.appraisal.averageScore != null
                  ? Number(data.appraisal.averageScore).toFixed(2)
                  : '—'}
              </div>
            </div>
            <div className="oa-stat">
              <div className="oa-stat__label">Kinh phí đề nghị</div>
              <div className="oa-stat__value">
                {formatVnd(Number(o.requestedBudget || 0))}
              </div>
            </div>
            <div className="oa-stat">
              <div className="oa-stat__label">Kinh phí được duyệt</div>
              <div className="oa-stat__value">
                {o.approvedBudget != null
                  ? formatVnd(Number(o.approvedBudget))
                  : 'Chưa có'}
              </div>
            </div>
            <div className="oa-stat">
              <div className="oa-stat__label">Phiên bản file</div>
              <div className="oa-stat__value">{data.versions?.length || 0}</div>
            </div>
          </div>

          {o.status === 'KHONG_PHE_DUYET' && o.bghRejectReason && (
            <Alert
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              message="Đã từ chối phê duyệt (TM_TU_CHOI)"
              description={o.bghRejectReason}
            />
          )}

          {o.status === 'SAN_SANG_THUC_HIEN' && (
            <Alert
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              message="Đã phê duyệt — Module 5 đã mở (TM_DUOC_DUYET)"
              description={
                <Space>
                  <span>
                    KP duyệt: {formatVnd(Number(o.approvedBudget || 0))}
                  </span>
                  <a onClick={() => history.push(`/projects/execution/${o.id}`)}>
                    Mở Module 5
                  </a>
                </Space>
              }
            />
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <div className="oa-panel" style={{ marginBottom: 16 }}>
                <div className="oa-panel__title">
                  <FileProtectOutlined /> BM.04 — File thuyết minh cuối
                </div>
                <div className="oa-file">
                  <Space direction="vertical" size={2}>
                    <Text strong>
                      {data.finalFile.fileName || 'Chưa có file'}
                    </Text>
                    <Text type="secondary">
                      {formatSize(data.finalFile.fileSize)}
                    </Text>
                  </Space>
                  {data.finalFile.url ? (
                    <Button
                      type="primary"
                      icon={<FilePdfOutlined />}
                      href={resolvePublicAssetUrl(data.finalFile.url)}
                      target="_blank"
                    >
                      Xem thuyết minh
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="oa-panel" style={{ marginBottom: 16 }}>
                <div className="oa-panel__title">
                  <FilePdfOutlined /> Biên bản BM.05b
                </div>
                {data.appraisal.adjustmentRequirements && (
                  <>
                    <Text type="secondary">Nội dung điều chỉnh</Text>
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                      {data.appraisal.adjustmentRequirements}
                    </Paragraph>
                  </>
                )}
                {data.appraisal.discussionNotes && (
                  <>
                    <Text type="secondary">Thảo luận HĐ</Text>
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                      {data.appraisal.discussionNotes}
                    </Paragraph>
                  </>
                )}
                {data.appraisal.minutesFileUrl ? (
                  <Button
                    icon={<FilePdfOutlined />}
                    href={resolvePublicAssetUrl(data.appraisal.minutesFileUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Xem biên bản BM.05b
                  </Button>
                ) : (
                  <Text type="secondary">Chưa có file biên bản</Text>
                )}
              </div>
            </Col>

            <Col xs={24} lg={10}>
              <div className="oa-panel" style={{ marginBottom: 16 }}>
                <div className="oa-panel__title">
                  <HistoryOutlined /> Lịch sử chỉnh sửa / phiên bản
                </div>
                {(data.versions || []).length === 0 ? (
                  <Text type="secondary">
                    Chưa có version khóa (thường khi thông qua không qua hoàn
                    thiện).
                  </Text>
                ) : (
                  data.versions.map((v) => (
                    <div key={v.id} className="oa-version">
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag>
                            v{v.versionNo} · {v.versionType}
                          </Tag>
                          {v.outlineFileUrl && (
                            <a href={v.outlineFileUrl} target="_blank" rel="noreferrer">
                              File
                            </a>
                          )}
                        </Space>
                        <Text ellipsis={{ tooltip: v.fileName || undefined }}>{v.fileName || '—'}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {formatSize(v.fileSize)} ·{' '}
                          {v.uploadedAt
                            ? dayjs(v.uploadedAt).format('HH:mm DD/MM/YYYY')
                            : '—'}
                        </Text>
                        {v.explanation && (
                          <Paragraph
                            type="secondary"
                            ellipsis={{ rows: 2 }}
                            style={{ marginBottom: 0, fontSize: 12 }}
                          >
                            {v.explanation}
                          </Paragraph>
                        )}
                      </Space>
                    </div>
                  ))
                )}
                {data.revisionDiff?.fileDiff ? (
                  <Table
                    size="small"
                    pagination={false}
                    style={{ marginTop: 8 }}
                    rowKey="k"
                    dataSource={[
                      {
                        k: '1',
                        label: 'Tên file',
                        before: (data.revisionDiff.fileDiff as any)?.before
                          ?.fileName,
                        after: (data.revisionDiff.fileDiff as any)?.after
                          ?.fileName,
                      },
                      {
                        k: '2',
                        label: 'Dung lượng',
                        before: formatSize(
                          (data.revisionDiff.fileDiff as any)?.before?.fileSize,
                        ),
                        after: formatSize(
                          (data.revisionDiff.fileDiff as any)?.after?.fileSize,
                        ),
                      },
                    ]}
                    columns={[
                      { title: '', dataIndex: 'label', width: 100 },
                      { title: 'Gốc HĐ', dataIndex: 'before' },
                      { title: 'Hoàn thiện', dataIndex: 'after' },
                    ]}
                  />
                ) : null}
              </div>

              {o.bghSignedAt && (
                <div className="oa-panel">
                  <div className="oa-panel__title">
                    <SafetyCertificateOutlined /> Kết quả ký BGH
                  </div>
                  <Paragraph style={{ marginBottom: 4 }}>
                    Ký lúc:{' '}
                    {dayjs(o.bghSignedAt).format('HH:mm DD/MM/YYYY')}
                  </Paragraph>
                  {o.bghDecisionNote && (
                    <Paragraph type="secondary">{o.bghDecisionNote}</Paragraph>
                  )}
                </div>
              )}

              {canHc && (
                <div className="oa-panel" style={{ marginTop: 16 }}>
                  <div className="oa-panel__title">
                    <SendOutlined /> TC-HC phát hành QĐ giao thực hiện
                  </div>
                  <Text type="secondary">
                    Đính kèm file QĐ (tuỳ chọn), rồi bấm phát hành ở thanh dưới.
                  </Text>
                  <Form form={publishForm} layout="vertical" style={{ marginTop: 12 }}>
                    <Form.Item
                      name="decisionFileUrl"
                      label="File QĐ giao thực hiện (PDF/DOCX)"
                      style={{ marginBottom: 0 }}
                    >
                      <ProposalAttachmentUpload
                        folder="projects/assignment-decisions"
                        maxMb={20}
                        buttonText="Tải lên QĐ"
                      />
                    </Form.Item>
                  </Form>
                </div>
              )}
            </Col>
          </Row>

          <FooterToolbar>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => history.push('/projects/outline-approvals')}
            >
              Quay lại
            </Button>
            {canBgh ? (
              <>
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => setRejectOpen(true)}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => setApproveOpen(true)}
                >
                  Phê duyệt & ký số
                </Button>
              </>
            ) : null}
            {canHc ? (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={saving}
                onClick={() => void phatHanh()}
              >
                Phát hành QĐ → mở Module 5
              </Button>
            ) : null}
          </FooterToolbar>

          <Modal
            title="Phê duyệt & ký số"
            open={approveOpen}
            onCancel={() => setApproveOpen(false)}
            onOk={() => void pheDuyet()}
            confirmLoading={saving}
            okText="Ký phê duyệt"
            destroyOnClose
          >
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="Ký số trên hệ thống (ghi nhận người ký + thời điểm). Sau đó TC-HC phát hành QĐ."
            />
            <Form form={approveForm} layout="vertical">
              <Form.Item
                name="approvedBudget"
                label="Kinh phí được duyệt (VNĐ)"
                rules={[{ required: true, message: 'Bắt buộc' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  {...vndInputNumberProps}
                  addonAfter="đ"
                />
              </Form.Item>
              <Form.Item name="note" label="Ghi chú">
                <TextArea rows={3} maxLength={2000} showCount placeholder="Ghi chú phê duyệt..." />
              </Form.Item>
            </Form>
          </Modal>

          <Modal
            title="Từ chối phê duyệt"
            open={rejectOpen}
            onCancel={() => setRejectOpen(false)}
            onOk={() => void tuChoi()}
            confirmLoading={saving}
            okText="Xác nhận từ chối"
            okButtonProps={{ danger: true }}
            destroyOnClose
          >
            <Form form={rejectForm} layout="vertical">
              <Form.Item
                name="reason"
                label="Lý do từ chối"
                rules={[
                  { required: true, message: 'Bắt buộc' },
                  { min: 5, message: 'Tối thiểu 5 ký tự' },
                ]}
              >
                <TextArea rows={4} maxLength={5000} showCount />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </PageContainer>
  );
};

export default OutlineApprovalDetailPage;
