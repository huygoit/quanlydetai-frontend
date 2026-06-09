/**
 * Thêm / sửa KQNC — Drawer full màn hình, view riêng module quản lý
 */
import React, { useCallback, useEffect, useState } from 'react';
import { history, useParams, useSearchParams } from '@umijs/max';
import { Button, Drawer, Form, Space, Spin, message } from 'antd';
import AdminPublicationFormFields from './AdminPublicationFormFields';
import { validateAndBuildAdminPublicationPayload } from './validateAdminPublicationForm';
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
  createAdminPublication,
  getAdminPublicationAuthors,
  getAdminPublicationById,
  saveAdminPublicationAuthors,
  updateAdminPublication,
} from '@/services/api/adminPublications';
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
  const isEdit = Boolean(id && /^\d+$/.test(id));

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    try {
      await form.validateFields();
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
    <Drawer
      title={isEdit ? 'Chỉnh sửa kết quả NCKH' : 'Thêm kết quả NCKH'}
      open
      onClose={quayVeDanhSach}
      width="100vw"
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={quayVeDanhSach}>Hủy</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Lưu
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading || treeLoading}>
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
  );
};

export default ResearchOutputFormPage;
