/**
 * Thêm / sửa KQNC — Drawer full màn hình, view riêng module quản lý
 */
import React, { useCallback, useEffect, useState } from 'react';
import { history, useAccess, useParams, useSearchParams } from '@umijs/max';
import { Alert, Button, Drawer, Form, Input, Modal, Space, Spin, Tag, message } from 'antd';
import { CheckOutlined, EditOutlined } from '@ant-design/icons';
import AdminPublicationFormFields from './AdminPublicationFormFields';
import {
  validateAndBuildAdminPublicationPayload,
  kiemTraDayDuDeDuyet,
} from './validateAdminPublicationForm';
import {
  findResearchOutputNodeById,
  findResearchOutputPathById,
  normalizePublicationAuthor,
  reassignAuthorOrdersSequential,
  type Publication,
  type PublicationAuthor,
  type ResearchOutputTypeTreeNode,
} from '@/services/api/profilePublications';
import {
  approveAdminPublication,
  createAdminPublication,
  getAdminPublicationAuthors,
  getAdminPublicationById,
  requestAdminPublicationCorrection,
  saveAdminPublicationAuthors,
  updateAdminPublication,
} from '@/services/api/adminPublications';
import {
  PUBLICATION_REVIEW_STATUS_MAP,
  type PublicationReviewStatus,
} from '@/utils/publicationReviewStatus';
import { publishedAtRaDayjs } from '@/utils/publicationDate';
import { laySchemaTheoMaLa, type LeafFormSchema } from '@/services/researchOutputFormSchema';
import { parsePublicationAttachmentUrls } from '@/utils/publicationAttachments';
import { duongDanMenuNhomGoc } from '@/utils/researchOutputMenu';
import { taiCayLoaiKqncQuanLy } from '@/utils/researchOutputCatalogTree';
import {
  HINT_KHONG_QUY_DOI_THIEU_NHOM_CHINH,
  laLoiThieuNhomChinh,
} from '@/utils/authorValidationMessages';

const ResearchOutputFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const access = useAccess();
  const isEdit = Boolean(id && /^\d+$/.test(id));

  const [form] = Form.useForm();
  const [correctionForm] = Form.useForm<{ reason: string }>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [researchOutputTree, setResearchOutputTree] = useState<ResearchOutputTypeTreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [authors, setAuthors] = useState<PublicationAuthor[]>([]);
  const [editingPub, setEditingPub] = useState<Publication | null>(null);
  const [selectedLeafRuleKind, setSelectedLeafRuleKind] = useState<string | null>(null);
  const [selectedLeafSchema, setSelectedLeafSchema] = useState<LeafFormSchema>(() =>
    laySchemaTheoMaLa(null, null)
  );
  const [showAdvancedPubFields, setShowAdvancedPubFields] = useState(false);

  const returnTo =
    searchParams.get('returnTo') ||
    duongDanMenuNhomGoc(searchParams.get('rootTypeId') ? Number(searchParams.get('rootTypeId')) : 'all');

  const quayVeDanhSach = useCallback(() => {
    history.replace(returnTo);
  }, [returnTo]);

  const taiCayDanhMuc = useCallback(async () => {
    setTreeLoading(true);
    try {
      const tree = await taiCayLoaiKqncQuanLy();
      setResearchOutputTree(tree);
    } catch {
      message.error('Không tải được danh mục loại KQNC');
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    taiCayDanhMuc();
  }, [taiCayDanhMuc]);

  useEffect(() => {
    if (!isEdit) {
      form.setFieldsValue({ publicationStatus: 'PUBLISHED' });
    }
  }, [isEdit, form]);

  useEffect(() => {
    if (!isEdit || !id) return;
    const napDuLieu = async () => {
      setLoading(true);
      try {
        const res = await getAdminPublicationById(Number(id));
        if (!res.success || !res.data) throw new Error('Không tải được dữ liệu');
        const pub = res.data;
        setEditingPub(pub as unknown as Publication);

        const rotId = pub.researchOutputTypeId;
        const path =
          rotId && researchOutputTree.length
            ? findResearchOutputPathById(researchOutputTree, rotId)
            : null;
        const leaf =
          rotId && researchOutputTree.length
            ? findResearchOutputNodeById(researchOutputTree, rotId)
            : null;
        setSelectedLeafRuleKind(leaf?.ruleKind ?? null);
        setSelectedLeafSchema(laySchemaTheoMaLa(leaf?.code ?? null, leaf?.ruleKind ?? null));
        setShowAdvancedPubFields(
          Boolean(
            pub.volume ||
              pub.issue ||
              pub.pages ||
              pub.doi ||
              pub.issn ||
              pub.url ||
              pub.attachmentUrl
          )
        );

        form.setFieldsValue({
          researchOutputTypePath: path ?? undefined,
          title: pub.title,
          journalOrConference: pub.journalOrConference,
          fundingOrganization: pub.fundingOrganization ?? undefined,
          publishedAt: publishedAtRaDayjs(pub),
          publicationStatus: pub.publicationStatus ?? 'PUBLISHED',
          hdgsnnScore: pub.hdgsnnScore ?? undefined,
          isbn: pub.isbn,
          volume: pub.volume,
          issue: pub.issue,
          pages: pub.pages,
          doi: pub.doi,
          issn: pub.issn,
          url: pub.url,
          qRankUrl: pub.qRankUrl ?? undefined,
          reputableListUrl: pub.reputableListUrl ?? undefined,
          acceptanceGrade: pub.acceptanceGrade ?? undefined,
          attachmentUrls: parsePublicationAttachmentUrls(pub.attachmentUrl),
        });

        const authRes = await getAdminPublicationAuthors(pub.id);
        const list = (authRes.data ?? []).map((a) => normalizePublicationAuthor(a));
        setAuthors(reassignAuthorOrdersSequential(list));
      } catch {
        message.error('Không tải được kết quả NCKH');
        quayVeDanhSach();
      } finally {
        setLoading(false);
      }
    };
    if (researchOutputTree.length) napDuLieu();
  }, [isEdit, id, researchOutputTree, form, quayVeDanhSach]);

  const reviewStatus = (editingPub?.reviewStatus ?? 'NEW') as PublicationReviewStatus;
  const reviewMeta = PUBLICATION_REVIEW_STATUS_MAP[reviewStatus] ?? PUBLICATION_REVIEW_STATUS_MAP.NEW;

  const handleApprove = async () => {
    if (!id) return;
    // Chặn duyệt khi chưa đủ trường bắt buộc theo loại KQNC (QĐ 1883).
    const values = form.getFieldsValue(true) as Record<string, unknown>;
    const thieu = kiemTraDayDuDeDuyet(
      values,
      authors,
      selectedLeafSchema.leafCode,
      selectedLeafRuleKind
    );
    if (thieu.length > 0) {
      message.error(
        `Chưa đủ điều kiện duyệt. Vui lòng bổ sung và lưu: ${thieu.join(', ')}.`
      );
      return;
    }
    setReviewActionLoading(true);
    try {
      const res = await approveAdminPublication(Number(id));
      if (!res.success || !res.data) throw new Error('Duyệt thất bại');
      setEditingPub(res.data as unknown as Publication);
      message.success('Đã duyệt kết quả NCKH');
    } catch (e: unknown) {
      const err = e as { message?: string };
      message.error(err?.message || 'Không thể duyệt kết quả NCKH');
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleOpenCorrectionModal = () => {
    correctionForm.setFieldsValue({ reason: editingPub?.correctionReason ?? '' });
    setCorrectionModalOpen(true);
  };

  const handleRequestCorrection = async () => {
    if (!id) return;
    try {
      const values = await correctionForm.validateFields();
      setReviewActionLoading(true);
      const res = await requestAdminPublicationCorrection(Number(id), values.reason.trim());
      if (!res.success || !res.data) throw new Error('Gửi yêu cầu hiệu chỉnh thất bại');
      setEditingPub(res.data as unknown as Publication);
      setCorrectionModalOpen(false);
      correctionForm.resetFields();
      message.success('Đã gửi yêu cầu hiệu chỉnh');
    } catch (e: unknown) {
      const err = e as { errorFields?: unknown; message?: string };
      if (err?.errorFields) return;
      message.error(err?.message || 'Không thể gửi yêu cầu hiệu chỉnh');
    } finally {
      setReviewActionLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
      // Validate đủ tất cả trường bắt buộc theo loại KQNC (QĐ 1883) ngay khi Lưu.
      const values = form.getFieldsValue(true) as Record<string, unknown>;
      const thieu = kiemTraDayDuDeDuyet(
        values,
        authors,
        selectedLeafSchema.leafCode,
        selectedLeafRuleKind
      );
      if (thieu.length > 0) {
        message.error(`Vui lòng nhập đủ thông tin bắt buộc: ${thieu.join(', ')}.`);
        return;
      }
      const payload = validateAndBuildAdminPublicationPayload({
        form,
        authors,
        researchOutputTree,
        editingPub,
      });
      if (!payload) return;

      const { finalAuthors, ...rest } = payload;
      setAuthors(finalAuthors);
      setSaving(true);

      const apiBody = rest;

      let pubId: number;
      if (isEdit && id) {
        const res = await updateAdminPublication(Number(id), apiBody);
        if (!res.success) throw new Error('Cập nhật thất bại');
        pubId = Number(id);
        message.success('Đã cập nhật kết quả NCKH');
      } else {
        const res = await createAdminPublication(apiBody);
        if (!res.success || !res.data) throw new Error('Tạo mới thất bại');
        pubId = res.data.id;
        message.success('Đã thêm kết quả NCKH');
      }

      await saveAdminPublicationAuthors(pubId, finalAuthors);
      quayVeDanhSach();
    } catch (e: unknown) {
      const err = e as {
        message?: string;
        response?: { data?: { message?: string; errors?: { message?: string }[] } };
      };
      const data = err?.response?.data;
      let rawMsg = data?.message;
      if (data?.errors?.length) {
        rawMsg = data.errors[0]?.message || rawMsg;
      }
      if (laLoiThieuNhomChinh(rawMsg)) {
        message.warning(HINT_KHONG_QUY_DOI_THIEU_NHOM_CHINH);
        quayVeDanhSach();
        return;
      }
      if (err?.response) return;
      message.error(rawMsg || err?.message || 'Không thể lưu kết quả NCKH');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <Drawer
      title={
        <Space wrap>
          <span>{isEdit ? 'Chỉnh sửa kết quả NCKH' : 'Thêm kết quả NCKH'}</span>
          {isEdit && (
            <Tag color={reviewMeta.color}>{reviewMeta.text}</Tag>
          )}
        </Space>
      }
      open
      onClose={quayVeDanhSach}
      width="100vw"
      destroyOnHidden
      extra={
        <Space wrap>
          {isEdit && access.canReviewResearchOutput && (
            <Button
              icon={<EditOutlined />}
              loading={reviewActionLoading}
              onClick={handleOpenCorrectionModal}
            >
              Yêu cầu hiệu chỉnh
            </Button>
          )}
          {isEdit && access.canApproveResearchOutput && (
            <Button
              type="primary"
              ghost
              icon={<CheckOutlined />}
              loading={reviewActionLoading}
              onClick={handleApprove}
            >
              Duyệt
            </Button>
          )}
          <Button onClick={quayVeDanhSach}>Hủy</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Lưu
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading || treeLoading}>
        {editingPub?.correctionReason && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Lý do hiệu chỉnh gần nhất"
            description={editingPub.correctionReason}
          />
        )}
        <AdminPublicationFormFields
          form={form}
          researchOutputTree={researchOutputTree}
          researchTreeLoading={treeLoading}
          authors={authors}
          onAuthorsChange={setAuthors}
          selectedLeafRuleKind={selectedLeafRuleKind}
          selectedLeafSchema={selectedLeafSchema}
          showAdvancedPubFields={showAdvancedPubFields}
          onShowAdvancedPubFieldsChange={setShowAdvancedPubFields}
          onLeafSelect={(ruleKind, _leafCode, schema) => {
            setSelectedLeafRuleKind(ruleKind);
            setSelectedLeafSchema(schema);
          }}
        />
      </Spin>
    </Drawer>

    <Modal
      title="Yêu cầu hiệu chỉnh kết quả NCKH"
      open={correctionModalOpen}
      onCancel={() => {
        setCorrectionModalOpen(false);
        correctionForm.resetFields();
      }}
      onOk={handleRequestCorrection}
      confirmLoading={reviewActionLoading}
      okText="Gửi yêu cầu"
      cancelText="Hủy"
      destroyOnHidden
    >
      <Form form={correctionForm} layout="vertical">
        <Form.Item
          name="reason"
          label="Lý do hiệu chỉnh"
          rules={[
            { required: true, message: 'Vui lòng nhập lý do hiệu chỉnh' },
            { max: 2000, message: 'Tối đa 2000 ký tự' },
          ]}
        >
          <Input.TextArea rows={4} placeholder="Mô tả nội dung cần hiệu chỉnh..." />
        </Form.Item>
      </Form>
    </Modal>
    </>
  );
};

export default ResearchOutputFormPage;
