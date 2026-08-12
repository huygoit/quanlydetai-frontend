/**
 * Hồ sơ khoa học của tôi - VIP PRO Layout
 * Theo specs/scientific-profile.md.md
 * 2-column layout: 70% tabs content + 30% sticky summary
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useModel, history, useSearchParams } from '@umijs/max';
import {
  Row,
  Col,
  Card,
  Tag,
  Button,
  Space,
  Tabs,
  Steps,
  message,
  Spin,
  Alert,
  Typography,
  Tooltip,
  Divider,
  Empty,
  Modal,
  Select,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Cascader,
  Upload,
  Dropdown,
} from 'antd';
import type { MenuProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  UserOutlined,
  SaveOutlined,
  SendOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BookOutlined,
  ProjectOutlined,
  FileTextOutlined,
  GlobalOutlined,
  TeamOutlined,
  CloudSyncOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  ImportOutlined,
  UploadOutlined,
  EyeOutlined,
  PaperClipOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  EditableProTable,
  ProList,
} from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import {
  getMyProfile,
  createMyProfile,
  updateMyProfile,
  submitProfile,
  getMySuggestions,
  syncGoogleScholar,
  syncSCV,
  confirmSuggestion,
  ignoreSuggestion,
  PROFILE_STATUS_MAP,
  LANGUAGES,
  PUBLICATION_TYPE_MAP,
  PUBLICATION_RANK_MAP,
  type ScientificProfile,
  type ProfileLanguage,
  type PublicationItem,
  type LinkedProject,
  type PublicationSuggestion,
  type ProfileAttachment,
} from '@/services/api/profile';
import { THU_MUC_UPLOAD_MAC_DINH, uploadFileDon } from '@/services/api/fileUpload';
import { getFieldOptions } from '@/services/api/fields';
import { getSpecializationOptions } from '@/services/api/specializations';
import {
  parsePublicationAttachmentUrls,
  serializePublicationAttachmentUrls,
  tenFileTuUrl,
} from '@/utils/publicationAttachments';
import { getTeacherKpi } from '@/services/api/kpis';
import ProfileNckhMetrics, {
  taoKpiPeriodMacDinh,
  type KpiPeriodState,
} from '@/components/ProfileNckhMetrics';
import { downloadFromUrl } from '@/utils/download';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { laDuongDanAnhChungChi, laDuongDanPdfChungChi } from '@/utils/certificatePreview';
import {
  CO_QUAN_CONG_TAC_OPTIONS,
  gopGiaTriHienCo,
  loadProfileKhoaPhongBanOptions,
  type DonViSelectOption,
} from '@/utils/profileDepartmentOptions';
import {
  chuanHoaAcademicTitleKey,
  chuanHoaDegreeKey,
  chuanHoaPayloadTruocKhiLuuProfile,
  chuanHoaProfileTuApi,
  coHienThiHocHam,
  gopGiaTriHocViHienCo,
  loadScientificProfileCatalogOptions,
  nhanNhanHocHam,
  nhanNhanHocVi,
  type HocViHocHamSelectOption,
} from '@/utils/profileCatalogOptions';
import {
  FALLBACK_ACADEMIC_TITLE_CATALOG,
  FALLBACK_DEGREE_CATALOG,
  layNamNhanBangToiDa,
  NAM_NHAN_BANG_TOI_THIEU,
} from '@/constants/scientificProfileCatalog';
import ReportPeriodFilters, {
  nhanKhoangKyTuState,
  type ReportPeriodFilterState,
} from '@/components/ReportPeriodFilters';
import ProfileEducationTrainingTables from '@/components/ProfileEducationTrainingTables';
import {
  listMyPublications,
  createMyPublication,
  updateMyPublication,
  deleteMyPublication,
  getMyPublicationAuthors,
  saveMyPublicationAuthors,
  normalizePublicationAuthor,
  chuanBiDanhSachTacGiaLuu,
  laTacGiaNhapTay,
  normalizeAuthorGender,
  reassignAuthorOrdersSequential,
  getResearchOutputTypesTree,
  buildResearchOutputCascaderOptions,
  findResearchOutputPathById,
  findResearchOutputNodeById,
  publicationThuocNhomGoc,
  type Publication,
  type PublicationAuthor,
  type ResearchOutputTypeTreeNode,
} from '@/services/api/profilePublications';
import type { OpenAlexPublicationDraft } from '@/services/api/openalex';
import { dayjsRaPublishedAt, layPublishedAtTuApi, publishedAtRaDayjs } from '@/utils/publicationDate';
import {
  coBoLocNgayDangBat,
  moTaKhoangLoc,
  publicationTrongKhoangNgay,
} from '@/utils/publicationDateFilter';
import dayjs from 'dayjs';
import {
  HINT_KHONG_QUY_DOI_THIEU_NHOM_CHINH,
  laLoiThieuNhomChinh,
} from '@/utils/authorValidationMessages';
import {
  PUBLICATION_REVIEW_STATUS_MAP,
  type PublicationReviewStatus,
} from '@/utils/publicationReviewStatus';
import {
  layNodeTheoPath,
  laySchemaTheoMaLa,
  type LeafFormSchema,
} from '@/services/researchOutputFormSchema';
import AuthorsEditor from '@/components/AuthorsEditor';
import {
  PublicationFormFields,
  validateAndBuildPublicationPayload,
} from '@/components/PublicationForm';
import { isAdminKeKhaiUser } from '@/utils/adminKeKhai';
import ConvertedHoursPreviewModal from '@/components/ConvertedHoursPreviewModal';
import ProfileCompletionBar, { type ChecklistItem } from '@/components/ProfileCompletionBar';
import ProfileHeader from '@/components/ProfileHeader';
import OpenAlexImportModal from '@/components/OpenAlexImportModal';

const LANGUAGE_LEVELS = ['Cơ bản', 'Trung cấp', 'Cao cấp', 'Thành thạo', 'Bản ngữ'];
const PUBLICATION_STATUS_MAP: Record<string, { text: string; color: string }> = {
  PUBLISHED: { text: 'Đã xuất bản', color: 'success' },
  ACCEPTED: { text: 'Đã chấp nhận', color: 'processing' },
  UNDER_REVIEW: { text: 'Đang review', color: 'warning' },
};
const AUTHOR_ROLE_MAP: Record<string, { text: string; color: string }> = {
  CHU_TRI: { text: 'Tác giả chính', color: 'gold' },
  DONG_TAC_GIA: { text: 'Đồng tác giả', color: 'blue' },
};

import './index.less';

const { Title, Text } = Typography;

/** Breadcrumb — mục cha không có path (tránh link /profile trắng trang) */
const BREADCRUMB_HO_SO_CUA_TOI = {
  items: [{ title: 'Hồ sơ khoa học' }, { title: 'Hồ sơ của tôi' }],
};

// ========== PUBLICATIONS TAB COMPONENT ==========

interface PublicationsTabProps {
  publications: PublicationItem[];
  suggestions: PublicationSuggestion[];
  onConfirmSuggestion: (id: number) => void;
  onIgnoreSuggestion: (id: number) => void;
  onReloadPublications: () => void;
  /** Hồ sơ khoa học hiện tại — bắt buộc có ít nhất một dòng tác giả là chính mình */
  myProfileId: number;
  myFullName: string;
  myGender?: PublicationAuthor['gender'];
  /** Admin/Super Admin kê khai hộ — không tự chèn admin vào bảng tác giả. */
  isAdminKeKhai?: boolean;
  researchOutputTree: ResearchOutputTypeTreeNode[];
  researchTreeLoading?: boolean;
  rootTypeFilterId: number | null;
  onRootTypeFilterChange: (id: number | null) => void;
  /** Mở form sửa từ thông báo (deep link ?pubId=) */
  openPubId?: number | null;
  onOpenPubIdHandled?: () => void;
}

const PublicationsTab: React.FC<PublicationsTabProps> = ({
  publications,
  suggestions,
  onConfirmSuggestion,
  onIgnoreSuggestion,
  onReloadPublications,
  myProfileId,
  myFullName,
  myGender,
  isAdminKeKhai = false,
  researchOutputTree,
  researchTreeLoading = false,
  rootTypeFilterId,
  onRootTypeFilterChange,
  openPubId,
  onOpenPubIdHandled,
}) => {
  const [form] = Form.useForm();
  // Cùng bộ lọc kỳ với Báo cáo và thống kê
  const [periodFilter, setPeriodFilter] = useState<ReportPeriodFilterState>({
    filterPreset: 'all',
    filterRefYear: dayjs().year(),
    publishedAtRange: null,
  });
  const [selectedPub, setSelectedPub] = useState<PublicationItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // New states for CRUD
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPub, setEditingPub] = useState<Publication | null>(null);
  const [saving, setSaving] = useState(false);
  const [authors, setAuthors] = useState<PublicationAuthor[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewPubId, setPreviewPubId] = useState<number | null>(null);
  const [previewPubTitle, setPreviewPubTitle] = useState<string>('');
  const [openAlexModalVisible, setOpenAlexModalVisible] = useState(false);
  /** Sau「Nạp vào form」từ OpenAlex — gửi source/sourceId khi lưu mới */
  const [pendingOpenAlexSourceId, setPendingOpenAlexSourceId] = useState<string | null>(null);
  const [showAdvancedPubFields, setShowAdvancedPubFields] = useState(false);
  const [selectedLeafRuleKind, setSelectedLeafRuleKind] = useState<string | null>(null);
  const [selectedLeafCode, setSelectedLeafCode] = useState<string | null>(null);
  const [selectedLeafSchema, setSelectedLeafSchema] = useState<LeafFormSchema>(() =>
    laySchemaTheoMaLa(null, null)
  );
  const [daMoPubTuThongBao, setDaMoPubTuThongBao] = useState(false);

  const kqncCanHieuChinh = useMemo(
    () => publications.filter((p) => p.reviewStatus === 'CORRECTION_REQUESTED'),
    [publications]
  );

  const tenNhomGocDangLoc = useMemo(() => {
    if (!rootTypeFilterId) return null;
    return researchOutputTree.find((n) => n.id === rootTypeFilterId)?.name ?? null;
  }, [rootTypeFilterId, researchOutputTree]);

  const filteredPublications = useMemo(() => {
    const from = periodFilter.publishedAtRange?.[0];
    const to = periodFilter.publishedAtRange?.[1];
    let list = publications;
    if (rootTypeFilterId != null) {
      list = list.filter((pub) => publicationThuocNhomGoc(researchOutputTree, pub, rootTypeFilterId));
    }
    if (periodFilter.filterPreset !== 'all' && coBoLocNgayDangBat(from, to)) {
      list = list.filter((pub) => publicationTrongKhoangNgay(pub, from, to));
    }
    return list;
  }, [publications, periodFilter, rootTypeFilterId, researchOutputTree]);

  const moTaBoLoc =
    periodFilter.filterPreset === 'all'
      ? ''
      : nhanKhoangKyTuState(periodFilter) ||
        moTaKhoangLoc(periodFilter.publishedAtRange?.[0], periodFilter.publishedAtRange?.[1]);

  /** Bài OpenAlex đã lưu hồ sơ — khớp sourceId để disable「Nạp vào form」 */
  const importedOpenAlexSourceIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of publications) {
      if (p.source === 'OPENALEX' && p.sourceId) {
        ids.add(String(p.sourceId).trim());
      }
    }
    return ids;
  }, [publications]);

  // View publication detail
  const handleViewDetail = (pub: PublicationItem) => {
    setSelectedPub(pub);
    setDetailModalVisible(true);
  };

  const chuanBiTacGia = (list: PublicationAuthor[]) =>
    chuanBiDanhSachTacGiaLuu(list, {
      ownerProfileId: myProfileId,
      ownerFullName: myFullName,
      ownerGender: myGender,
      adminKeKhai: isAdminKeKhai,
    });

  // Open drawer for create
  const handleCreate = () => {
    setEditingPub(null);
    setPendingOpenAlexSourceId(null);
    setAuthors(chuanBiTacGia([]));
    setSelectedLeafRuleKind(null);
    setSelectedLeafCode(null);
    setSelectedLeafSchema(laySchemaTheoMaLa(null, null));
    setShowAdvancedPubFields(false);
    form.resetFields();
    setDrawerVisible(true);
  };

  // Open drawer for edit
  const handleEdit = async (pub: PublicationItem) => {
    setPendingOpenAlexSourceId(null);
    setEditingPub(pub as unknown as Publication);
    const rotId = pub.researchOutputTypeId;
    const path =
      rotId && researchOutputTree.length ? findResearchOutputPathById(researchOutputTree, rotId) : null;
    const leaf = rotId && researchOutputTree.length ? findResearchOutputNodeById(researchOutputTree, rotId) : null;
    setSelectedLeafRuleKind(leaf?.ruleKind ?? null);
    setSelectedLeafCode(leaf?.code ?? null);
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
      title: pub.title,
      academicYear: pub.academicYear,
      journalOrConference: pub.journalOrConference,
      publishedAt: publishedAtRaDayjs(pub),
      hdgsnnScore: pub.hdgsnnScore ?? undefined,
      isbn: pub.isbn,
      publicationStatus: pub.publicationStatus,
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
      researchOutputTypePath: path ?? undefined,
    });
    
    // Load authors
    try {
      const res = await getMyPublicationAuthors(pub.id);
      if (res.success && res.data) {
        setAuthors(
          chuanBiTacGia(reassignAuthorOrdersSequential(res.data.map(normalizePublicationAuthor)))
        );
      } else {
        setAuthors(chuanBiTacGia([]));
      }
    } catch (e) {
      setAuthors(chuanBiTacGia([]));
    }
    
    setDrawerVisible(true);
  };

  useEffect(() => {
    if (!openPubId || daMoPubTuThongBao || !publications.length) return;
    const pub = publications.find((p) => p.id === openPubId);
    if (!pub) return;
    setDaMoPubTuThongBao(true);
    void handleEdit(pub);
    onOpenPubIdHandled?.();
  }, [openPubId, publications, daMoPubTuThongBao, onOpenPubIdHandled]);

  useEffect(() => {
    if (!drawerVisible || !editingPub || !researchOutputTree.length) return;
    const rotId = (editingPub as Publication).researchOutputTypeId;
    if (!rotId) return;
    const path = findResearchOutputPathById(researchOutputTree, rotId);
    if (path?.length) {
      form.setFieldsValue({ researchOutputTypePath: path });
      const leaf = findResearchOutputNodeById(researchOutputTree, rotId);
      setSelectedLeafRuleKind(leaf?.ruleKind ?? null);
      setSelectedLeafCode(leaf?.code ?? null);
      setSelectedLeafSchema(laySchemaTheoMaLa(leaf?.code ?? null, leaf?.ruleKind ?? null));
    }
  }, [drawerVisible, editingPub, researchOutputTree, form]);

  // Delete publication
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteMyPublication(id);
      if (res.success) {
        message.success('Đã xóa kết quả NCKH');
        onReloadPublications();
      }
    } catch (e) {
      message.error('Có lỗi xảy ra');
    }
  };

  // Preview converted hours
  const handlePreviewHours = (pub: PublicationItem) => {
    setPreviewPubId(pub.id);
    setPreviewPubTitle(pub.title);
    setPreviewModalVisible(true);
  };

  const handleApplyOpenAlexDraft = (draft: OpenAlexPublicationDraft) => {
    setEditingPub(null);
    setPendingOpenAlexSourceId(String(draft.sourceId ?? '').trim() || null);
    const rotId = draft.researchOutputTypeId ?? null;
    const path = rotId && researchOutputTree.length ? findResearchOutputPathById(researchOutputTree, rotId) : null;
    const leaf = rotId && researchOutputTree.length ? findResearchOutputNodeById(researchOutputTree, rotId) : null;
    setSelectedLeafRuleKind(leaf?.ruleKind ?? null);
    setSelectedLeafCode(leaf?.code ?? draft.researchOutputTypeCode ?? null);
    setSelectedLeafSchema(laySchemaTheoMaLa(leaf?.code ?? draft.researchOutputTypeCode ?? null, leaf?.ruleKind ?? null));
    setShowAdvancedPubFields(Boolean(draft.volume || draft.issue || draft.pages || draft.doi || draft.issn || draft.url));
    form.setFieldsValue({
      title: draft.title,
      publishedAt: publishedAtRaDayjs({ year: draft.year ?? undefined }),
      publicationStatus: draft.publicationStatus,
      volume: draft.volume ?? undefined,
      issue: draft.issue ?? undefined,
      pages: draft.pages ?? undefined,
      doi: draft.doi ?? undefined,
      issn: draft.issn ?? undefined,
      url: draft.url ?? undefined,
      researchOutputTypePath: path ?? undefined,
    });
    setAuthors(
      chuanBiTacGia(reassignAuthorOrdersSequential((draft.authors || []).map(normalizePublicationAuthor)))
    );
    setDrawerVisible(true);
    if (!rotId) {
      message.warning('OpenAlex chưa map được loại kết quả NCKH phù hợp, vui lòng chọn lại mục lá.');
      return;
    }
    if (!path?.length) {
      message.warning(
        `Đã nạp bài báo nhưng chưa tìm thấy mã loại ${draft.researchOutputTypeCode || 'N/A'} trong danh mục hiện tại.`
      );
    }
  };

  // Save publication
  const handleSave = async () => {
    try {
      await form.validateFields();
      const built = validateAndBuildPublicationPayload({
        form,
        authors,
        researchOutputTree,
        ownerProfileId: myProfileId,
        ownerFullName: myFullName,
        isAdminKeKhai,
        editingPub,
        pendingOpenAlexSourceId,
      });
      if (!built) return;

      const { finalAuthors, ...apiBody } = built;
      setAuthors(finalAuthors);
      setSaving(true);

      let pubId: number;

      if (editingPub) {
        const res = await updateMyPublication(editingPub.id, apiBody);
        if (!res.success) {
          throw new Error('Cập nhật thất bại');
        }
        pubId = editingPub.id;
        message.success('Đã cập nhật kết quả NCKH');
      } else {
        const res = await createMyPublication(apiBody);
        if (!res.success || !res.data) {
          throw new Error('Tạo mới thất bại');
        }
        pubId = res.data.id;
        message.success('Đã thêm kết quả NCKH');
      }

      await saveMyPublicationAuthors(pubId, finalAuthors);

      setPendingOpenAlexSourceId(null);
      setDrawerVisible(false);
      onReloadPublications();
    } catch (e: any) {
      if (e?.response) {
        const data = e.response.data ?? {};
        let rawMsg = data.message as string | undefined;
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
          rawMsg = (data.errors[0]?.message as string) || rawMsg;
        }
        if (laLoiThieuNhomChinh(rawMsg)) {
          message.warning(HINT_KHONG_QUY_DOI_THIEU_NHOM_CHINH);
          setDrawerVisible(false);
          onReloadPublications();
          return;
        }
        return;
      }
      message.error(e?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="publications-tab">
      {/* Section B: Suggestions from external sources */}
      {suggestions.length > 0 && (
        <div className="suggestions-section">
          <div className="section-header">
            <Title level={5}>
              <CloudSyncOutlined /> Gợi ý kết quả NCKH từ nguồn ngoài ({suggestions.length})
            </Title>
            <Text type="secondary">
              Xác nhận để thêm vào hồ sơ hoặc bỏ qua nếu không phải của bạn
            </Text>
          </div>
          <div className="suggestions-list">
            {suggestions.map((sug) => (
              <div key={sug.id} className="suggestion-item">
                <div className="suggestion-content">
                  <div className="suggestion-title">{sug.title}</div>
                  <div className="suggestion-meta">
                    <Space split="·" size="small">
                      {sug.year && <span>{sug.year}</span>}
                      {sug.journalOrConference && <span>{sug.journalOrConference}</span>}
                      {sug.publicationType && (
                        <Tag color={PUBLICATION_TYPE_MAP[sug.publicationType]?.color}>
                          {PUBLICATION_TYPE_MAP[sug.publicationType]?.text}
                        </Tag>
                      )}
                      <Tag color={sug.source === 'GOOGLE_SCHOLAR' ? 'green' : 'purple'}>
                        {sug.source === 'GOOGLE_SCHOLAR' ? 'Google Scholar' : 'SCV ĐHĐN'}
                      </Tag>
                    </Space>
                  </div>
                  {sug.authors && (
                    <div className="suggestion-authors">
                      <Text type="secondary">{sug.authors}</Text>
                    </div>
                  )}
                </div>
                <div className="suggestion-actions">
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onConfirmSuggestion(sug.id)}
                  >
                    Xác nhận
                  </Button>
                  <Button size="small" onClick={() => onIgnoreSuggestion(sug.id)}>
                    Bỏ qua
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Divider />
        </div>
      )}

      {kqncCanHieuChinh.length > 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Có ${kqncCanHieuChinh.length} kết quả NCKH cần hiệu chỉnh`}
          description={
            <Space direction="vertical" size={4}>
              {kqncCanHieuChinh.map((p) => (
                <div key={p.id}>
                  <Text strong>{p.title}</Text>
                  {p.correctionReason ? (
                    <div>
                      <Text type="secondary">Lý do: {p.correctionReason}</Text>
                    </div>
                  ) : null}
                </div>
              ))}
            </Space>
          }
          action={
            <Button
              size="small"
              type="primary"
              onClick={() => kqncCanHieuChinh[0] && handleEdit(kqncCanHieuChinh[0])}
            >
              Hiệu chỉnh ngay
            </Button>
          }
        />
      )}

      {/* Section A: Publications attached to profile */}
      <div className="publications-main-section">
        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Title level={5} style={{ margin: 0 }}>
            <BookOutlined /> Kết quả NCKH ({publications.length})
          </Title>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm kết quả NCKH
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setOpenAlexModalVisible(true)}>
              Thêm kết quả NCKH từ Open Alex
            </Button>
          </Space>
        </div>

        {/* Bộ lọc theo ngày xuất bản — cùng ReportPeriodFilters với báo cáo */}
        <div className="publications-filters" style={{ marginTop: 16 }}>
          <Space wrap={false} align="center" size="middle" style={{ flexWrap: 'nowrap' }}>
            {tenNhomGocDangLoc && (
              <Tag
                closable
                color="blue"
                onClose={(e) => {
                  e.preventDefault();
                  onRootTypeFilterChange(null);
                }}
              >
                Nhóm: {tenNhomGocDangLoc}
              </Tag>
            )}
            <ReportPeriodFilters
              value={periodFilter}
              onChange={setPeriodFilter}
              singleRow
            />
          </Space>
          <div className="filter-stats" style={{ marginTop: 8 }}>
            <Text type="secondary">
              Hiển thị {filteredPublications.length} / {publications.length} kết quả NCKH
              {moTaBoLoc ? ` · ${moTaBoLoc}` : ''}
            </Text>
          </div>
        </div>

        {/* Publications table */}
        {filteredPublications.length > 0 ? (
          <div className="publications-table">
            <ProList<PublicationItem>
              dataSource={[...filteredPublications].sort((a, b) => {
                // Mới thêm / mới chỉnh sửa gần nhất lên đầu (theo updatedAt, fallback createdAt, rồi ngày xuất bản).
                const moc = (p: PublicationItem) =>
                  p.updatedAt || p.createdAt || layPublishedAtTuApi(p) || '';
                const cmp = moc(b).localeCompare(moc(a));
                if (cmp !== 0) return cmp;
                return (layPublishedAtTuApi(b) || '').localeCompare(layPublishedAtTuApi(a) || '');
              })}
              rowKey="id"
              metas={{
                title: {
                  render: (_, record) => (
                    <a onClick={() => handleViewDetail(record)} className="pub-title-link">
                      {record.title}
                    </a>
                  ),
                },
                description: {
                  render: (_, record) => (
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space split="·" wrap size="small">
                        <Text type="secondary">{record.journalOrConference}</Text>
                        {record.year && <Text type="secondary">{record.year}</Text>}
                        {record.volume && <Text type="secondary">Vol. {record.volume}</Text>}
                        {record.issue && <Text type="secondary">No. {record.issue}</Text>}
                        {record.pages && <Text type="secondary">pp. {record.pages}</Text>}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.authors}
                      </Text>
                    </Space>
                  ),
                },
                subTitle: {
                  render: (_, record) => (
                    <Space size={4}>
                      {record.researchOutputType?.name && (
                        <Tag color="geekblue">{record.researchOutputType.name}</Tag>
                      )}
                      {record.publicationType && (
                        <Tag color={PUBLICATION_TYPE_MAP[record.publicationType]?.color}>
                          {PUBLICATION_TYPE_MAP[record.publicationType]?.text}
                        </Tag>
                      )}
                      {record.rank && (
                        <Tag color={PUBLICATION_RANK_MAP[record.rank]?.color}>
                          {PUBLICATION_RANK_MAP[record.rank]?.text}
                        </Tag>
                      )}
                      {record.quartile && (
                        <Tag
                          color={
                            record.quartile === 'Q1'
                              ? 'red'
                              : record.quartile === 'Q2'
                              ? 'orange'
                              : 'blue'
                          }
                        >
                          {record.quartile}
                        </Tag>
                      )}
                      {record.myRole && (
                        <Tag color={AUTHOR_ROLE_MAP[record.myRole]?.color}>
                          {AUTHOR_ROLE_MAP[record.myRole]?.text}
                        </Tag>
                      )}
                      {record.needsIndexConfirmation && (
                        <Tag color="orange">Cần xác nhận chỉ mục/Q</Tag>
                      )}
                      {record.reviewStatus && record.reviewStatus !== 'NEW' && (
                        <Tag
                          color={
                            PUBLICATION_REVIEW_STATUS_MAP[
                              record.reviewStatus as PublicationReviewStatus
                            ]?.color
                          }
                        >
                          {
                            PUBLICATION_REVIEW_STATUS_MAP[
                              record.reviewStatus as PublicationReviewStatus
                            ]?.text
                          }
                        </Tag>
                      )}
                    </Space>
                  ),
                },
                actions: {
                  render: (_, record) => [
                    <Button
                      key="edit"
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEdit(record)}
                    >
                      Sửa
                    </Button>,
                    <Popconfirm
                      key="delete"
                      title="Xóa kết quả NCKH này?"
                      onConfirm={() => handleDelete(record.id)}
                    >
                      <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                        Xóa
                      </Button>
                    </Popconfirm>,
                    <Button
                      key="preview"
                      type="link"
                      size="small"
                      icon={<CalculatorOutlined />}
                      onClick={() => handlePreviewHours(record)}
                    >
                      Xem quy đổi giờ NCKH
                    </Button>,
                  ],
                },
              }}
            />
          </div>
        ) : (
          <Empty
            description={
              publications.length > 0
                ? 'Không có kết quả NCKH nào phù hợp với bộ lọc'
                : 'Chưa có kết quả NCKH nào'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Thêm kết quả NCKH
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setOpenAlexModalVisible(true)}>
                Thêm kết quả NCKH từ Open Alex
              </Button>
            </Space>
          </Empty>
        )}
      </div>

      {/* Publication Detail Modal */}
      <Modal
        title="Chi tiết kết quả NCKH"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          <Button key="edit" type="primary" onClick={() => { setDetailModalVisible(false); selectedPub && handleEdit(selectedPub); }}>
            Chỉnh sửa
          </Button>,
        ]}
        width={700}
      >
        {selectedPub && (
          <div className="publication-detail">
            <Title level={5} style={{ marginBottom: 16 }}>
              {selectedPub.title}
            </Title>

            <div className="detail-tags">
              <Space wrap>
                {selectedPub.researchOutputType?.name && (
                  <Tag color="geekblue">Loại NCKH: {selectedPub.researchOutputType.name}</Tag>
                )}
                {selectedPub.publicationType && (
                  <Tag color={PUBLICATION_TYPE_MAP[selectedPub.publicationType]?.color}>
                    {PUBLICATION_TYPE_MAP[selectedPub.publicationType]?.text}
                  </Tag>
                )}
                {selectedPub.rank && (
                  <Tag color={PUBLICATION_RANK_MAP[selectedPub.rank]?.color}>
                    {PUBLICATION_RANK_MAP[selectedPub.rank]?.text}
                  </Tag>
                )}
                {selectedPub.quartile && (
                  <Tag
                    color={
                      selectedPub.quartile === 'Q1'
                        ? 'red'
                        : selectedPub.quartile === 'Q2'
                        ? 'orange'
                        : 'blue'
                    }
                  >
                    {selectedPub.quartile}
                  </Tag>
                )}
                <Tag color={PUBLICATION_STATUS_MAP[selectedPub.publicationStatus]?.color}>
                  {PUBLICATION_STATUS_MAP[selectedPub.publicationStatus]?.text}
                </Tag>
              </Space>
            </div>

            <Divider />

            <div className="detail-info">
              <Row gutter={[16, 12]}>
                <Col span={24}>
                  <Text strong>Tác giả:</Text>
                  <br />
                  <Text>{selectedPub.authors}</Text>
                  {selectedPub.correspondingAuthor && (
                    <Text type="secondary"> (Tác giả liên hệ: {selectedPub.correspondingAuthor})</Text>
                  )}
                </Col>

                <Col span={24}>
                  <Text strong>
                    {selectedPub.publicationType === 'CONFERENCE' ? 'Hội thảo:' : 'Tạp chí:'}
                  </Text>
                  <br />
                  <Text>{selectedPub.journalOrConference}</Text>
                </Col>

                <Col span={12}>
                  <Text strong>Năm học:</Text>
                  <br />
                  <Text>{selectedPub.academicYear || '-'}</Text>
                </Col>

                <Col span={12}>
                  <Text strong>Năm xuất bản:</Text>
                  <br />
                  <Text>{selectedPub.year || '-'}</Text>
                </Col>

                {selectedPub.volume && (
                  <Col span={8}>
                    <Text strong>Volume:</Text>
                    <br />
                    <Text>{selectedPub.volume}</Text>
                  </Col>
                )}

                {selectedPub.issue && (
                  <Col span={8}>
                    <Text strong>Issue:</Text>
                    <br />
                    <Text>{selectedPub.issue}</Text>
                  </Col>
                )}

                {selectedPub.pages && (
                  <Col span={8}>
                    <Text strong>Trang:</Text>
                    <br />
                    <Text>{selectedPub.pages}</Text>
                  </Col>
                )}

                {selectedPub.myRole && (
                  <Col span={8}>
                    <Text strong>Vai trò:</Text>
                    <br />
                    <Tag color={AUTHOR_ROLE_MAP[selectedPub.myRole]?.color}>
                      {AUTHOR_ROLE_MAP[selectedPub.myRole]?.text}
                    </Tag>
                  </Col>
                )}

                {selectedPub.doi && (
                  <Col span={24}>
                    <Text strong>DOI:</Text>
                    <br />
                    <a
                      href={`https://doi.org/${selectedPub.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedPub.doi}
                    </a>
                  </Col>
                )}

                {selectedPub.issn && (
                  <Col span={12}>
                    <Text strong>ISSN:</Text>
                    <br />
                    <Text>{selectedPub.issn}</Text>
                  </Col>
                )}

                {selectedPub.isbn && (
                  <Col span={12}>
                    <Text strong>ISBN:</Text>
                    <br />
                    <Text>{selectedPub.isbn}</Text>
                  </Col>
                )}

                {selectedPub.url && (
                  <Col span={24}>
                    <Text strong>Link:</Text>
                    <br />
                    <a href={selectedPub.url} target="_blank" rel="noopener noreferrer">
                      {selectedPub.url}
                    </a>
                  </Col>
                )}

                {parsePublicationAttachmentUrls(selectedPub.attachmentUrl).length > 0 && (
                  <Col span={24}>
                    <Text strong>File đính kèm:</Text>
                    <br />
                    <Space direction="vertical" size={4} style={{ marginTop: 4 }}>
                      {parsePublicationAttachmentUrls(selectedPub.attachmentUrl).map((url) => {
                        const href = resolvePublicAssetUrl(url);
                        const ten = tenFileTuUrl(url);
                        return (
                          <Button
                            key={url}
                            type="link"
                            size="small"
                            icon={<PaperClipOutlined />}
                            style={{ padding: 0, height: 'auto' }}
                            onClick={() => href && downloadFromUrl(href, ten)}
                          >
                            {ten}
                          </Button>
                        );
                      })}
                    </Space>
                  </Col>
                )}

                <Col span={24}>
                  <Text strong>Nguồn dữ liệu:</Text>
                  <br />
                  <Tag
                    color={
                      selectedPub.source === 'INTERNAL'
                        ? 'blue'
                        : selectedPub.source === 'OPENALEX'
                        ? 'cyan'
                        : selectedPub.source === 'GOOGLE_SCHOLAR'
                        ? 'green'
                        : 'purple'
                    }
                  >
                    {selectedPub.source === 'INTERNAL'
                      ? 'Nội bộ'
                      : selectedPub.source === 'OPENALEX'
                      ? 'OpenAlex'
                      : selectedPub.source === 'GOOGLE_SCHOLAR'
                      ? 'Google Scholar'
                      : 'SCV ĐHĐN'}
                  </Tag>
                  {selectedPub.verifiedByNcv && (
                    <Tag color="success" icon={<CheckCircleOutlined />}>
                      Đã xác nhận
                    </Tag>
                  )}
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>

      {/* Publication Form Drawer */}
      <Drawer
        title={editingPub ? 'Chỉnh sửa kết quả NCKH' : 'Thêm kết quả NCKH'}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          setPendingOpenAlexSourceId(null);
        }}
        width="100vw"
        extra={
          <Space>
            <Button
              onClick={() => {
                setDrawerVisible(false);
                setPendingOpenAlexSourceId(null);
              }}
            >
              Hủy
            </Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              Lưu
            </Button>
          </Space>
        }
      >
        {editingPub?.reviewStatus === 'CORRECTION_REQUESTED' && editingPub.correctionReason && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
            message="Yêu cầu hiệu chỉnh"
            description={editingPub.correctionReason}
          />
        )}
        <PublicationFormFields
          form={form}
          researchOutputTree={researchOutputTree}
          researchTreeLoading={researchTreeLoading}
          authors={authors}
          onAuthorsChange={setAuthors}
          ownerProfileId={myProfileId}
          isAdminKeKhai={isAdminKeKhai}
          selectedLeafRuleKind={selectedLeafRuleKind}
          selectedLeafSchema={selectedLeafSchema}
          showAdvancedPubFields={showAdvancedPubFields}
          onShowAdvancedPubFieldsChange={setShowAdvancedPubFields}
          onLeafSelect={(nextRuleKind, nextLeafCode, nextSchema) => {
            setSelectedLeafRuleKind(nextRuleKind);
            setSelectedLeafCode(nextLeafCode);
            setSelectedLeafSchema(nextSchema);
          }}
        />
      </Drawer>

      {/* Converted Hours Preview Modal */}
      <ConvertedHoursPreviewModal
        open={previewModalVisible}
        publicationId={previewPubId}
        publicationTitle={previewPubTitle}
        onClose={() => setPreviewModalVisible(false)}
      />

      {/* OpenAlex Import Modal */}
      <OpenAlexImportModal
        open={openAlexModalVisible}
        onClose={() => setOpenAlexModalVisible(false)}
        onSelectDraft={handleApplyOpenAlexDraft}
        importedOpenAlexSourceIds={importedOpenAlexSourceIds}
      />
    </div>
  );
};

// ========== MAIN PAGE COMPONENT ==========

const MyProfilePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const [searchParams] = useSearchParams();
  const currentUser = initialState?.currentUser;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [profile, setProfile] = useState<ScientificProfile | null>(null);
  const [suggestions, setSuggestions] = useState<PublicationSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [languageEditableKeys, setLanguageEditableKeys] = useState<React.Key[]>([]);
  const [researchOutputTree, setResearchOutputTree] = useState<ResearchOutputTypeTreeNode[]>([]);
  const [researchTreeLoading, setResearchTreeLoading] = useState(false);
  const [pubRootTypeFilterId, setPubRootTypeFilterId] = useState<number | null>(null);
  const [pendingOpenPubId, setPendingOpenPubId] = useState<number | null>(null);

  /** Popup xem file chứng chỉ ngoại ngữ (ảnh/PDF) thay vì mở tab mới ngay. */
  const [popupChungChi, setPopupChungChi] = useState<{
    mo: boolean;
    url: string;
    /** Tiêu đề modal — thường gắn với tên ngôn ngữ để người dùng biết đang xem chứng chỉ nào. */
    tieuDe: string;
  }>({ mo: false, url: '', tieuDe: 'Xem chứng chỉ' });
  const [loiXemChungChi, setLoiXemChungChi] = useState<string | null>(null);

  /** Tổng giờ/điểm theo kỳ (mặc định: năm tài chính hiện tại). */
  const [kpiPeriod, setKpiPeriod] = useState<KpiPeriodState>(() => taoKpiPeriodMacDinh());
  const [nckhHours, setNckhHours] = useState<number | null>(null);
  const [nckhPoints, setNckhPoints] = useState<number | null>(null);
  const [nckhLoading, setNckhLoading] = useState(false);

  /** Khoa/phòng ban từ bảng departments (Admin → Quản lý đơn vị). */
  const [khoaPhongOptions, setKhoaPhongOptions] = useState<DonViSelectOption[]>([]);

  /** Danh mục lĩnh vực / chuyên ngành (label hiển thị, value = id). */
  const [fieldOptions, setFieldOptions] = useState<{ label: string; value: number }[]>([]);
  const [specializationOptions, setSpecializationOptions] = useState<
    { label: string; value: number }[]
  >([]);

  /** Học vị / học hàm từ GET /api/catalog/scientific-profile/options */
  const [degreeOptions, setDegreeOptions] = useState<HocViHocHamSelectOption[]>(() =>
    FALLBACK_DEGREE_CATALOG.map((d) => ({
      value: d.value,
      label: d.label,
      title: d.description,
    })),
  );
  const [academicTitleOptions, setAcademicTitleOptions] = useState<HocViHocHamSelectOption[]>(() =>
    FALLBACK_ACADEMIC_TITLE_CATALOG.map((d) => ({ value: d.value, label: d.label })),
  );
  const [catalogTuApi, setCatalogTuApi] = useState(false);
  const [catalogGhiChu, setCatalogGhiChu] = useState<string | undefined>();

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      setResearchTreeLoading(true);
      try {
        const res = await getResearchOutputTypesTree();
        if (!cancelled && res.success && res.data) setResearchOutputTree(res.data);
      } catch {
        /* danh mục loại NCKH — tab vẫn dùng được nếu lỗi */
      } finally {
        if (!cancelled) setResearchTreeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  // Nạp danh mục lĩnh vực + chuyên ngành để select hiển thị tên (value = id).
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    (async () => {
      try {
        const [fieldRes, specRes] = await Promise.all([
          getFieldOptions(),
          getSpecializationOptions(),
        ]);
        if (cancelled) return;
        // BE trả id dạng chuỗi; ép về number để khớp value số trên hồ sơ.
        setFieldOptions((fieldRes.data ?? []).map((f) => ({ label: f.name, value: Number(f.id) })));
        setSpecializationOptions(
          (specRes.data ?? []).map((s) => ({ label: s.name, value: Number(s.id) })),
        );
      } catch {
        /* lỗi danh mục — select vẫn nhập tay được */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  /** Số KQNC theo nhóm gốc danh mục — hiển thị cuối dòng menu tab. */
  const chonLocNhomGoc = useCallback((key: string) => {
    setActiveTab('publications');
    if (key === 'all') setPubRootTypeFilterId(null);
    else setPubRootTypeFilterId(Number(key));
  }, []);

  const soLuongKqncTheoNhomGoc = useMemo(() => {
    const theoNhom = new Map<number, number>();
    const pubs = profile?.publications ?? [];
    for (const pub of pubs) {
      for (const n of researchOutputTree) {
        if (publicationThuocNhomGoc(researchOutputTree, pub, n.id)) {
          theoNhom.set(n.id, (theoNhom.get(n.id) ?? 0) + 1);
        }
      }
    }
    return { theoNhom, tong: pubs.length };
  }, [profile?.publications, researchOutputTree]);

  const menuNhomGocLoaiNckh = useMemo((): MenuProps => {
    const { theoNhom, tong } = soLuongKqncTheoNhomGoc;
    const taoNhanMenu = (key: string, ten: string, soLuong: number) => (
      <span
        className="publications-tab-menu-item"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          chonLocNhomGoc(key);
        }}
      >
        {ten}{' '}
        <span className="publications-tab-menu-count">({soLuong})</span>
      </span>
    );
    const items: MenuProps['items'] = [
      { key: 'all', label: taoNhanMenu('all', 'Tất cả nhóm', tong) },
      ...(researchOutputTree.length
        ? [
            { type: 'divider' as const },
            ...researchOutputTree.map((n) => ({
              key: String(n.id),
              label: taoNhanMenu(String(n.id), n.name, theoNhom.get(n.id) ?? 0),
            })),
          ]
        : []),
    ];
    return {
      items,
      selectedKeys: pubRootTypeFilterId != null ? [String(pubRootTypeFilterId)] : ['all'],
      onClick: ({ key, domEvent }) => {
        domEvent?.preventDefault();
        domEvent?.stopPropagation();
        chonLocNhomGoc(String(key));
      },
    };
  }, [researchOutputTree, soLuongKqncTheoNhomGoc, pubRootTypeFilterId, chonLocNhomGoc]);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await getMyProfile();

      if (result.success && result.data) {
        setProfile(chuanHoaProfileTuApi(result.data));
        const sugResult = await getMySuggestions();
        if (sugResult.success) {
          setSuggestions(sugResult.data);
        }
      } else {
        // Chưa có hồ sơ -> tạo mới (không show message, đây là luồng bình thường)
        const createResult = await createMyProfile({
          fullName: currentUser.name,
          workEmail: currentUser.email || `${currentUser.name.toLowerCase().replace(/\s+/g, '')}@university.edu.vn`,
          organization: 'Trường Đại học Bách khoa - ĐHĐN',
        });
        if (createResult.success && createResult.data) {
          setProfile(chuanHoaProfileTuApi(createResult.data));
        }
      }
    } catch (error: any) {
      if (!error?.response) {
        message.error('Không thể tải hồ sơ. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const pubIdRaw = searchParams.get('pubId');
    if (tab === 'publications') {
      setActiveTab('publications');
    }
    if (pubIdRaw && /^\d+$/.test(pubIdRaw)) {
      setPendingOpenPubId(Number(pubIdRaw));
    }
  }, [searchParams]);

  useEffect(() => {
    loadProfileKhoaPhongBanOptions().then(({ khoaPhongOptions: opts }) => {
      setKhoaPhongOptions(opts);
    });
  }, []);

  useEffect(() => {
    loadScientificProfileCatalogOptions().then(
      ({ degreeOptions: hocVi, academicTitleOptions: hocHam, tuApi, ghiChu }) => {
        setDegreeOptions(hocVi);
        setAcademicTitleOptions(hocHam);
        setCatalogTuApi(tuApi);
        setCatalogGhiChu(ghiChu);
      },
    );
  }, []);

  const isOnboarding = searchParams.get('onboarding') === '1';

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  /** Tổng giờ/điểm — BE lọc theo from_date / to_date (publishedAt). */
  useEffect(() => {
    if (!profile?.id) return;
    const from = kpiPeriod.publishedAtRange?.[0];
    const to = kpiPeriod.publishedAtRange?.[1];
    // «Tất cả»: lấy khoảng rộng để tính tổng
    const fromDate =
      kpiPeriod.filterPreset === 'all' || !from
        ? '1990-01-01'
        : from.format('YYYY-MM-DD');
    const toDate =
      kpiPeriod.filterPreset === 'all' || !to
        ? dayjs().add(1, 'year').format('YYYY-MM-DD')
        : to.format('YYYY-MM-DD');
    let cancelled = false;
    setNckhLoading(true);
    getTeacherKpi(profile.id, { fromDate, toDate })
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setNckhHours(res.data.totalHours);
          setNckhPoints(
            typeof res.data.totalPoints === 'number' ? res.data.totalPoints : null,
          );
        } else {
          setNckhHours(null);
          setNckhPoints(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNckhHours(null);
          setNckhPoints(null);
        }
      })
      .finally(() => {
        if (!cancelled) setNckhLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    profile?.id,
    kpiPeriod.publishedAtRange,
    kpiPeriod.filterPreset,
    kpiPeriod.filterRefYear,
  ]);

  const dismissOnboarding = () => {
    history.replace('/profile/me');
  };

  // Save draft
  const handleSaveDraft = async (values: any) => {
    if (!profile) return;

    setSaving(true);
    try {
      const { department: _boMonBo, ...phanConLai } = values;
      const result = await updateMyProfile({
        ...chuanHoaPayloadTruocKhiLuuProfile(phanConLai),
        department: '',
        status: 'DRAFT',
      } as Parameters<typeof updateMyProfile>[0]);

      if (result.success && result.data) {
        setProfile(chuanHoaProfileTuApi(result.data));
        message.success('Đã lưu nháp');
      }
    } catch (error) {
      message.error('Lỗi lưu nháp');
    } finally {
      setSaving(false);
    }
  };

  // Submit update
  const handleSubmitUpdate = async () => {
    if (!profile) return;

    setSubmitting(true);
    try {
      const result = await submitProfile();

      if (result.success && result.data) {
        setProfile(chuanHoaProfileTuApi(result.data));
        message.success('Đã gửi cập nhật hồ sơ');
      }
    } catch (error) {
      message.error('Lỗi gửi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  // Sync from external sources
  const handleSync = async (source: 'scholar' | 'scv') => {
    if (!profile || !currentUser) return;

    setSyncing(true);
    try {
      let result;
      if (source === 'scholar') {
        result = await syncGoogleScholar();
      } else {
        result = await syncSCV();
      }

      if (result.success) {
        // Reload suggestions
        const sugResult = await getMySuggestions();
        if (sugResult.success) {
          setSuggestions(sugResult.data);
        }

        if (result.data?.newCount && result.data.newCount > 0) {
          message.success(`Tìm thấy ${result.data.newCount} gợi ý kết quả NCKH mới`);
        } else {
          message.info('Không có gợi ý kết quả NCKH mới');
        }
      }
    } catch (error) {
      message.error('Lỗi đồng bộ');
    } finally {
      setSyncing(false);
    }
  };

  // Confirm suggestion
  const handleConfirmSuggestion = async (suggestionId: number) => {
    if (!profile) return;
    const result = await confirmSuggestion(suggestionId);
    if (result.success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      // Reload profile to get updated publications
      await loadProfile();
      message.success('Đã thêm kết quả NCKH vào hồ sơ');
    }
  };

  // Ignore suggestion
  const handleIgnoreSuggestion = async (suggestionId: number) => {
    if (!profile) return;
    const result = await ignoreSuggestion(suggestionId);
    if (result.success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      message.success('Đã bỏ qua');
    }
  };

  // Cập nhật ảnh đại diện
  const handleAvatarChange = async (file: File) => {
    if (!profile) return;

    setAvatarUploading(true);
    try {
      const ketQuaUpload = await uploadFileDon(file, { folder: 'profile/avatars' });
      const ketQuaCapNhat = await updateMyProfile({ avatarUrl: ketQuaUpload.url });
      if (ketQuaCapNhat.success && ketQuaCapNhat.data) {
        setProfile(chuanHoaProfileTuApi(ketQuaCapNhat.data));
        message.success('Đã cập nhật ảnh đại diện');
      } else {
        throw new Error('Cập nhật thất bại');
      }
    } catch {
      throw new Error('Cập nhật ảnh đại diện thất bại');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Mở trang Lý lịch khoa học (mẫu Bộ) để xem trước rồi in/lưu PDF bằng trình duyệt.
  const handleExportCvPdf = () => {
    if (!profile) return;
    history.push('/profile/cv');
  };

  // Language columns for editable table
  const languageColumns: ProColumns<ProfileLanguage>[] = [
    {
      title: 'Ngôn ngữ',
      dataIndex: 'language',
      valueType: 'select',
      fieldProps: {
        options: LANGUAGES.map(l => ({ label: l, value: l })),
      },
      width: 150,
    },
    {
      title: 'Trình độ',
      dataIndex: 'level',
      valueType: 'select',
      fieldProps: {
        options: LANGUAGE_LEVELS.map(l => ({ label: l, value: l })),
      },
      width: 130,
    },
    {
      title: 'Chứng chỉ',
      dataIndex: 'certificate',
      width: 150,
    },
    {
      title: 'File chứng chỉ',
      dataIndex: 'certificateUrl',
      width: 220,
      render: (_, record) => {
        const id = record.id as unknown as React.Key;
        const isEditing = languageEditableKeys.includes(id);
        if (isEditing) {
          return <Tag color="processing">Đang sửa…</Tag>;
        }
        if (record.certificateUrl) {
          return (
            <Space size={8} wrap>
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                style={{ padding: 0 }}
                onClick={() => {
                  setLoiXemChungChi(null);
                  setPopupChungChi({
                    mo: true,
                    url: record.certificateUrl!,
                    tieuDe: record.language
                      ? `Xem chứng chỉ — ${record.language}`
                      : 'Xem chứng chỉ',
                  });
                }}
              >
                Xem chứng chỉ
              </Button>
              <Button
                size="small"
                icon={<UploadOutlined />}
                onClick={() => setLanguageEditableKeys((prev) => (prev.includes(id) ? prev : [...prev, id]))}
              >
                Đổi file
              </Button>
            </Space>
          );
        }
        return (
          <Button
            size="small"
            icon={<UploadOutlined />}
            onClick={() => setLanguageEditableKeys((prev) => (prev.includes(id) ? prev : [...prev, id]))}
          >
            Tải lên
          </Button>
        );
      },
      renderFormItem: (_schema, config, form) => {
        const recordKey = (config as any)?.recordKey as React.Key;
        const currentUrl =
          typeof recordKey !== 'undefined'
            ? (form as any)?.getFieldValue?.([recordKey, 'certificateUrl'])
            : undefined;

        return (
          <Space.Compact style={{ width: '100%' }}>
            <Upload
              accept=".pdf,.png,.jpg,.jpeg"
              showUploadList={false}
              customRequest={async (options) => {
                const file = options.file as File;
                try {
                  const kq = await uploadFileDon(file, { folder: THU_MUC_UPLOAD_MAC_DINH });
                  (form as any)?.setFieldValue?.([recordKey, 'certificateUrl'], kq.url);
                  message.success('Đã tải file lên, vui lòng bấm “Lưu” dòng này để ghi nhận.');
                  options.onSuccess?.(kq as any);
                } catch (e: any) {
                  message.error(e?.message || 'Tải file lên thất bại');
                  options.onError?.(e);
                }
              }}
            >
              <Button icon={<UploadOutlined />}>Tải lên</Button>
            </Upload>
            <Input
              value={currentUrl}
              placeholder="URL file sẽ tự điền sau khi tải lên"
              onChange={(ev) => (form as any)?.setFieldValue?.([recordKey, 'certificateUrl'], ev.target.value)}
            />
            <Button
              onClick={() => (form as any)?.setFieldValue?.([recordKey, 'certificateUrl'], undefined)}
              disabled={!currentUrl}
            >
              Xóa
            </Button>
          </Space.Compact>
        );
      },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 100,
    },
  ];

  // Project columns
  const projectColumns: ProColumns<LinkedProject>[] = [
    {
      title: 'Mã đề tài',
      dataIndex: 'code',
      width: 120,
      render: (text, record) => (
        <a onClick={() => history.push(`/projects/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'Cấp',
      dataIndex: 'level',
      width: 140,
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 100,
      render: (role) => (
        <Tag color={role === 'CHU_NHIEM' ? 'blue' : 'default'}>
          {role === 'CHU_NHIEM' ? 'Chủ nhiệm' : 'Tham gia'}
        </Tag>
      ),
    },
    {
      title: 'Thời gian',
      width: 180,
      render: (_, record) => (
        <span>
          {record.startDate?.substring(0, 7)} → {record.endDate?.substring(0, 7) || 'Nay'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      render: (status) => {
        const map: Record<string, { text: string; color: string }> = {
          DANG_THUC_HIEN: { text: 'Đang thực hiện', color: 'processing' },
          DA_NGHIEM_THU: { text: 'Đã nghiệm thu', color: 'success' },
          TAM_DUNG: { text: 'Tạm dừng', color: 'warning' },
        };
        const { text, color } = map[status as string] || { text: status, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  // Publication columns
  const publicationColumns: ProColumns<PublicationItem>[] = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'Năm',
      dataIndex: 'year',
      width: 70,
    },
    {
      title: 'Nơi đăng',
      dataIndex: 'venue',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Nguồn',
      dataIndex: 'source',
      width: 130,
      render: (source) => {
        const map: Record<string, { text: string; color: string }> = {
          INTERNAL: { text: 'Nội bộ', color: 'blue' },
          GOOGLE_SCHOLAR: { text: 'Google Scholar', color: 'green' },
          SCV_DHDN: { text: 'SCV ĐHĐN', color: 'purple' },
        };
        const { text, color } = map[source as string] || { text: source, color: 'default' };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'DOI/Link',
      width: 100,
      render: (_, record) =>
        record.doi ? (
          <a href={`https://doi.org/${record.doi}`} target="_blank" rel="noopener noreferrer">
            DOI
          </a>
        ) : record.url ? (
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            Link
          </a>
        ) : '-',
    },
  ];

  if (loading) {
    return (
      <PageContainer breadcrumb={BREADCRUMB_HO_SO_CUA_TOI}>
        <div className="profile-loading">
          <Spin size="large" tip="Đang tải hồ sơ..." />
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer breadcrumb={BREADCRUMB_HO_SO_CUA_TOI}>
        <Empty description="Không tìm thấy hồ sơ" />
      </PageContainer>
    );
  }

  const statusConfig = PROFILE_STATUS_MAP[profile.status];

  // Checklist for completeness - with tab navigation
  const checklist: ChecklistItem[] = [
    { key: 'email', label: 'Email & Đơn vị', done: !!profile.workEmail && !!profile.organization, tabKey: 'general' },
    { key: 'degree', label: 'Học vị', done: !!profile.degree, tabKey: 'education' },
    { key: 'research', label: 'Hướng nghiên cứu', done: !!profile.mainResearchArea, tabKey: 'research' },
    { key: 'language', label: 'Ngoại ngữ', done: (profile.languages?.length || 0) > 0, tabKey: 'languages' },
    { key: 'publications', label: 'Kết quả NCKH / Đề tài', done: (profile.publications?.length || 0) > 0 || (profile.linkedProjects?.length || 0) > 0, tabKey: 'publications' },
  ];

  // Handle checklist item click - navigate to tab
  const handleChecklistItemClick = (item: ChecklistItem) => {
    if (item.tabKey) {
      setActiveTab(item.tabKey);
    }
  };

  return (
    <PageContainer
      title={false}
      className="profile-me-page"
      breadcrumb={BREADCRUMB_HO_SO_CUA_TOI}
    >
      <ProfileHeader
        name={profile.fullName}
        organization={profile.organization}
        faculty={profile.faculty}
        department={profile.department}
        avatarUrl={profile.avatarUrl}
        status={statusConfig.text}
        statusColor={statusConfig.color}
        researchArea={profile.mainResearchArea}
        degree={profile.degree}
        degreeLabel={nhanNhanHocVi(degreeOptions, profile.degree)}
        degreeYear={profile.degreeYear}
        academicTitle={profile.academicTitle}
        academicTitleLabel={nhanNhanHocHam(academicTitleOptions, profile.academicTitle)}
        academicTitleYear={profile.academicTitleYear}
        researchHours={profile.id != null ? nckhHours : null}
        convertedPoint={profile.id != null ? nckhPoints : null}
        metricsLoading={nckhLoading}
        metricsSlot={
          profile.id != null ? (
            <ProfileNckhMetrics
              researchHours={nckhHours}
              convertedPoint={nckhPoints}
              loading={nckhLoading}
              period={kpiPeriod}
              onPeriodChange={setKpiPeriod}
            />
          ) : undefined
        }
        verified={profile.status === 'VERIFIED'}
        avatarUploading={avatarUploading}
        onAvatarChange={handleAvatarChange}
        onExportCV={handleExportCvPdf}
        exportLoading={exporting}
      />

      {/* Need more info alert */}
      {profile.status === 'NEED_MORE_INFO' && profile.needMoreInfoReason && (
        <Alert
          message="Yêu cầu bổ sung hồ sơ"
          description={profile.needMoreInfoReason}
          type="warning"
          showIcon
          className="profile-alert"
          action={
            <Button size="small" type="primary" onClick={() => setActiveTab('general')}>
              Cập nhật ngay
            </Button>
          }
        />
      )}

      {/* Onboarding banner - hướng dẫn từng bước cho người đăng ký mới */}
      {isOnboarding && (
        <Card className="profile-onboarding-banner" bordered={false}>
          <div className="profile-onboarding-header">
            <div>
              <Title level={5} style={{ margin: 0 }}>
                Chào mừng bạn! Hoàn thiện hồ sơ khoa học
              </Title>
              <Text type="secondary">Làm lần lượt các bước bên dưới để cập nhật hồ sơ của bạn.</Text>
            </div>
            <Button type="link" size="small" onClick={dismissOnboarding}>
              Đã hiểu
            </Button>
          </div>
          <Steps
            current={
              checklist.findIndex((c) => !c.done) === -1
                ? checklist.length
                : checklist.findIndex((c) => !c.done)
            }
            size="small"
            style={{ marginTop: 16 }}
          >
            {checklist.map((item, idx) => (
              <Steps.Step
                key={item.key}
                title={item.label}
                status={item.done ? 'finish' : idx === checklist.findIndex((c) => !c.done) ? 'process' : 'wait'}
                icon={item.done ? <CheckCircleOutlined /> : undefined}
              />
            ))}
          </Steps>
          {checklist.some((c) => !c.done) && (
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Bước tiếp theo: </Text>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, height: 'auto' }}
                onClick={() => {
                  const next = checklist.find((c) => !c.done);
                  if (next) handleChecklistItemClick(next);
                }}
              >
                {checklist.find((c) => !c.done)?.label}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Profile Completion Bar */}
      <ProfileCompletionBar
        completeness={profile.completeness}
        checklist={checklist}
        onItemClick={handleChecklistItemClick}
      />

      <Row gutter={24} className="profile-content">
        {/* Main content - full width */}
        <Col span={24}>
          <Card bordered={false} className="profile-tabs-card">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'general',
                  label: (
                    <span>
                      <UserOutlined />
                      Thông tin chung
                    </span>
                  ),
                  children: (
                    <ProForm
                      initialValues={profile}
                      onFinish={handleSaveDraft}
                      submitter={false}
                      layout="vertical"
                    >
                      <div className="form-section">
                        <Title level={5}>Thông tin cá nhân</Title>
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="fullName"
                              label="Họ và tên"
                              rules={[{ required: true }]}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="workEmail"
                              label="Email công việc"
                              rules={[{ required: true, type: 'email' }]}
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <ProFormDatePicker
                              name="dateOfBirth"
                              label="Ngày sinh"
                              width="100%"
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <ProFormSelect
                              name="gender"
                              label="Giới tính"
                              options={[
                                { label: 'Nam', value: 'Nam' },
                                { label: 'Nữ', value: 'Nữ' },
                                { label: 'Khác', value: 'Khác' },
                              ]}
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <ProFormText name="phone" label="Số điện thoại" />
                          </Col>
                        </Row>
                        <ProFormTextArea
                          name="bio"
                          label="Giới thiệu ngắn"
                          fieldProps={{ rows: 3, maxLength: 500, showCount: true }}
                          placeholder="Giới thiệu ngắn về bản thân và hướng nghiên cứu..."
                        />
                      </div>

                      <Divider />

                      <div className="form-section">
                        <Title level={5}>Liên kết học thuật</Title>
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="orcid"
                              label="ORCID"
                              placeholder="0000-0001-2345-6789"
                              fieldProps={{
                                prefix: <GlobalOutlined />,
                              }}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="googleScholarUrl"
                              label="Google Scholar"
                              placeholder="URL Google Scholar"
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="scopusId"
                              label="Scopus ID"
                              placeholder="12345678"
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="researchGateUrl"
                              label="ResearchGate"
                              placeholder="URL ResearchGate"
                            />
                          </Col>
                          <Col xs={24}>
                            <ProFormText
                              name="personalWebsite"
                              label="Website cá nhân"
                              placeholder="https://..."
                            />
                          </Col>
                        </Row>
                      </div>

                      <div className="form-actions">
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={saving}
                          onClick={() => {
                            const form = document.querySelector('.ant-pro-form') as HTMLFormElement;
                            form?.dispatchEvent(new Event('submit', { bubbles: true }));
                          }}
                        >
                          Lưu thông tin
                        </Button>
                      </div>
                    </ProForm>
                  ),
                },
                {
                  key: 'education',
                  label: (
                    <span>
                      <BookOutlined />
                      Đào tạo & Công tác
                    </span>
                  ),
                  children: (
                    <ProForm
                      initialValues={profile}
                      onFinish={handleSaveDraft}
                      submitter={false}
                      layout="vertical"
                    >
                      <div className="form-section">
                        <Title level={5}>Học vị / Học hàm</Title>
                        {!catalogTuApi && catalogGhiChu && (
                          <Alert
                            type="warning"
                            showIcon
                            style={{ marginBottom: 16 }}
                            message="Danh mục học vị / học hàm"
                            description={catalogGhiChu}
                          />
                        )}
                        <Row gutter={16} align="bottom" className="profile-hoc-vi-hoc-ham-row">
                          <Col xs={24} lg={12}>
                            <Row gutter={16} align="bottom">
                              <Col xs={24} sm={14}>
                                <ProFormSelect
                                  name="degree"
                                  label="Học vị"
                                  fieldProps={{
                                    showSearch: true,
                                    optionFilterProp: 'label',
                                  }}
                                  options={gopGiaTriHocViHienCo(
                                    degreeOptions,
                                    profile.degree,
                                    chuanHoaDegreeKey,
                                  )}
                                />
                              </Col>
                              <Col xs={24} sm={10}>
                                <ProFormDigit
                                  name="degreeYear"
                                  label="Năm nhận học vị"
                                  min={NAM_NHAN_BANG_TOI_THIEU}
                                  max={layNamNhanBangToiDa()}
                                  fieldProps={{ precision: 0 }}
                                  rules={[
                                    {
                                      type: 'number',
                                      min: NAM_NHAN_BANG_TOI_THIEU,
                                      max: layNamNhanBangToiDa(),
                                      message: `Năm từ ${NAM_NHAN_BANG_TOI_THIEU} đến ${layNamNhanBangToiDa()}`,
                                    },
                                  ]}
                                />
                              </Col>
                            </Row>
                          </Col>
                          <Col xs={24} lg={12}>
                            <ProFormDependency name={['academicTitle']}>
                              {({ academicTitle }) => (
                                <Row gutter={16} align="bottom">
                                  <Col
                                    xs={24}
                                    sm={coHienThiHocHam(academicTitle) ? 14 : 24}
                                  >
                                    <ProFormSelect
                                      name="academicTitle"
                                      label="Học hàm"
                                      fieldProps={{
                                        showSearch: true,
                                        optionFilterProp: 'label',
                                      }}
                                      options={gopGiaTriHocViHienCo(
                                        academicTitleOptions,
                                        profile.academicTitle,
                                        chuanHoaAcademicTitleKey,
                                      )}
                                    />
                                  </Col>
                                  {coHienThiHocHam(academicTitle) ? (
                                    <Col xs={24} sm={10}>
                                      <ProFormDigit
                                        name="academicTitleYear"
                                        label="Năm đạt học hàm"
                                        min={NAM_NHAN_BANG_TOI_THIEU}
                                        max={layNamNhanBangToiDa()}
                                        fieldProps={{ precision: 0 }}
                                        rules={[
                                          {
                                            type: 'number',
                                            min: NAM_NHAN_BANG_TOI_THIEU,
                                            max: layNamNhanBangToiDa(),
                                            message: `Năm từ ${NAM_NHAN_BANG_TOI_THIEU} đến ${layNamNhanBangToiDa()}`,
                                          },
                                        ]}
                                      />
                                    </Col>
                                  ) : null}
                                </Row>
                              )}
                            </ProFormDependency>
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col xs={24}>
                            <ProFormSelect
                              name="specializationId"
                              label="Chuyên ngành"
                              showSearch
                              placeholder="Chọn chuyên ngành đào tạo"
                              options={specializationOptions}
                              fieldProps={{ optionFilterProp: 'label' }}
                            />
                          </Col>
                        </Row>
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="degreeInstitution"
                              label="Cơ sở đào tạo"
                              placeholder="Tên trường / viện"
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="degreeCountry"
                              label="Quốc gia"
                              placeholder="Việt Nam, Australia..."
                            />
                          </Col>
                        </Row>
                      </div>

                      <Divider />

                      <ProfileEducationTrainingTables
                        profile={profile}
                        onProfileChange={setProfile}
                      />

                      <Divider />

                      <div className="form-section">
                        <Title level={5}>Thông tin công tác</Title>
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <ProFormSelect
                              name="organization"
                              label="Cơ quan công tác"
                              rules={[{ required: true, message: 'Vui lòng chọn cơ quan công tác' }]}
                              options={gopGiaTriHienCo(
                                CO_QUAN_CONG_TAC_OPTIONS,
                                profile.organization,
                              )}
                              showSearch
                              fieldProps={{
                                optionFilterProp: 'label',
                                placeholder: 'Chọn cơ quan công tác (ĐHĐN)',
                              }}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormSelect
                              name="faculty"
                              label="Khoa/phòng ban"
                              options={gopGiaTriHienCo(khoaPhongOptions, profile.faculty)}
                              showSearch
                              allowClear
                              fieldProps={{
                                optionFilterProp: 'label',
                                placeholder: 'Chọn khoa/phòng ban',
                              }}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="currentTitle"
                              label="Chức danh"
                              placeholder="Giảng viên, Nghiên cứu viên..."
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="managementRole"
                              label="Vai trò quản lý"
                              placeholder="Trưởng bộ môn, Phó khoa..."
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormDatePicker
                              name="startWorkingAt"
                              label="Ngày bắt đầu công tác"
                              width="100%"
                            />
                          </Col>
                        </Row>
                      </div>

                      <div className="form-actions">
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={saving}
                          htmlType="submit"
                        >
                          Lưu thông tin
                        </Button>
                      </div>
                    </ProForm>
                  ),
                },
                {
                  key: 'languages',
                  label: (
                    <span>
                      <GlobalOutlined />
                      Ngoại ngữ
                    </span>
                  ),
                  children: (
                    <div className="form-section">
                      <EditableProTable<ProfileLanguage>
                        rowKey="id"
                        value={profile.languages || []}
                        onChange={async (value) => {
                          try {
                            const result = await updateMyProfile({
                              languages: value as ProfileLanguage[],
                            });
                            if (result.success && result.data) {
                              setProfile(chuanHoaProfileTuApi(result.data));
                              message.success('Đã lưu ngoại ngữ');
                              return;
                            }
                            message.error('Lưu ngoại ngữ thất bại');
                          } catch (e: any) {
                            message.error(e?.message || 'Lưu ngoại ngữ thất bại');
                          }
                        }}
                        columns={languageColumns}
                        recordCreatorProps={{
                          position: 'bottom',
                          record: () => ({
                            id: `lang-${Date.now()}`,
                            language: '',
                            level: '',
                          }),
                          creatorButtonText: 'Thêm ngoại ngữ',
                        }}
                        editable={{
                          type: 'multiple',
                          editableKeys: languageEditableKeys,
                          onChange: setLanguageEditableKeys,
                          saveText: 'Lưu',
                          cancelText: 'Hủy',
                          onSave: async () => {
                            // Việc lưu thực tế được thực hiện trong onChange khi người dùng bấm lưu dòng/xóa dòng.
                          },
                          actionRender: (row, config, dom) => [dom.save, dom.cancel, dom.delete],
                        }}
                      />
                    </div>
                  ),
                },
                {
                  key: 'research',
                  label: (
                    <span>
                      <BookOutlined />
                      Hướng nghiên cứu
                    </span>
                  ),
                  children: (
                    <ProForm
                      initialValues={profile}
                      onFinish={handleSaveDraft}
                      submitter={false}
                      layout="vertical"
                    >
                      <div className="form-section">
                        <Row gutter={16}>
                          <Col xs={24}>
                            <ProFormSelect
                              name="researchFieldId"
                              label="Lĩnh vực nghiên cứu chính"
                              showSearch
                              rules={[{ required: true }]}
                              options={fieldOptions}
                              fieldProps={{ optionFilterProp: 'label' }}
                            />
                          </Col>
                          <Col xs={24}>
                            <ProFormSelect
                              name="subResearchAreas"
                              label="Hướng nghiên cứu phụ"
                              mode="multiple"
                              showSearch
                              placeholder="Chọn từ danh mục lĩnh vực"
                              options={fieldOptions.map((o) => ({ label: o.label, value: o.label }))}
                              fieldProps={{ optionFilterProp: 'label' }}
                            />
                          </Col>
                          <Col xs={24}>
                            <ProFormSelect
                              name="keywords"
                              label="Từ khóa nghiên cứu"
                              mode="tags"
                              placeholder="Nhập từ khóa và Enter"
                              fieldProps={{
                                tokenSeparators: [','],
                              }}
                            />
                          </Col>
                        </Row>
                      </div>

                      <div className="form-actions">
                        <Button
                          type="primary"
                          icon={<SaveOutlined />}
                          loading={saving}
                          htmlType="submit"
                        >
                          Lưu thông tin
                        </Button>
                      </div>
                    </ProForm>
                  ),
                },
                {
                  key: 'publications',
                  label: (
                    <Dropdown menu={menuNhomGocLoaiNckh} trigger={['hover']} placement="bottomLeft">
                      <span className="publications-tab-label">
                        <FileTextOutlined />
                        Kết quả NCKH
                        <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
                        {suggestions.length > 0 && (
                          <Tag color="red" className="tab-badge">
                            {suggestions.length}
                          </Tag>
                        )}
                      </span>
                    </Dropdown>
                  ),
                  children: (
                    <PublicationsTab
                      publications={profile.publications || []}
                      suggestions={suggestions}
                      onConfirmSuggestion={handleConfirmSuggestion}
                      onIgnoreSuggestion={handleIgnoreSuggestion}
                      onReloadPublications={loadProfile}
                      myProfileId={profile.id}
                      myFullName={profile.fullName || ''}
                      myGender={normalizeAuthorGender(profile.gender)}
                      isAdminKeKhai={isAdminKeKhaiUser(currentUser)}
                      researchOutputTree={researchOutputTree}
                      researchTreeLoading={researchTreeLoading}
                      rootTypeFilterId={pubRootTypeFilterId}
                      onRootTypeFilterChange={setPubRootTypeFilterId}
                      openPubId={pendingOpenPubId}
                      onOpenPubIdHandled={() => {
                        setPendingOpenPubId(null);
                        history.replace('/profile/me?tab=publications');
                      }}
                    />
                  ),
                },
                {
                  key: 'projects',
                  label: (
                    <span>
                      <ProjectOutlined />
                      Đề tài ({profile.linkedProjects?.length || 0})
                    </span>
                  ),
                  children: (
                    <div className="projects-tab">
                      <div className="section-header">
                        <Title level={5}>
                          <ProjectOutlined /> Đề tài đã tham gia
                        </Title>
                        <Text type="secondary">
                          Dữ liệu được cập nhật tự động từ module Đề tài
                        </Text>
                      </div>
                      {profile.linkedProjects && profile.linkedProjects.length > 0 ? (
                        <ProList<LinkedProject>
                          dataSource={profile.linkedProjects}
                          rowKey="id"
                          metas={{
                            title: {
                              render: (_, record) => (
                                <Space>
                                  <Tag color="blue">{record.code}</Tag>
                                  <span>{record.title}</span>
                                </Space>
                              ),
                            },
                            description: {
                              render: (_, record) => (
                                <Space split="·" wrap>
                                  <span>{record.level}</span>
                                  <Tag color={record.role === 'CHU_NHIEM' ? 'gold' : 'default'}>
                                    {record.role === 'CHU_NHIEM' ? 'Chủ nhiệm' : 'Tham gia'}
                                  </Tag>
                                  <span>
                                    {record.startDate?.substring(0, 7)} → {record.endDate?.substring(0, 7) || 'Nay'}
                                  </span>
                                </Space>
                              ),
                            },
                            subTitle: {
                              render: (_, record) => {
                                const statusMap: Record<string, { text: string; color: string }> = {
                                  DANG_THUC_HIEN: { text: 'Đang thực hiện', color: 'processing' },
                                  DA_NGHIEM_THU: { text: 'Đã nghiệm thu', color: 'success' },
                                  TAM_DUNG: { text: 'Tạm dừng', color: 'warning' },
                                };
                                const config = statusMap[record.status];
                                return <Tag color={config.color}>{config.text}</Tag>;
                              },
                            },
                          }}
                        />
                      ) : (
                        <Empty description="Chưa tham gia đề tài nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title={popupChungChi.tieuDe}
        open={popupChungChi.mo}
        onCancel={() => setPopupChungChi((s) => ({ ...s, mo: false }))}
        afterOpenChange={(open) => {
          if (open) setLoiXemChungChi(null);
        }}
        footer={
          <Space wrap>
            <Button
              onClick={() => {
                const url = resolvePublicAssetUrl(popupChungChi.url);
                if (url) window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              Mở tab mới
            </Button>
            <Button type="primary" onClick={() => setPopupChungChi((s) => ({ ...s, mo: false }))}>
              Đóng
            </Button>
          </Space>
        }
        width={Math.min(920, typeof window !== 'undefined' ? window.innerWidth - 48 : 920)}
        centered
        destroyOnClose
      >
        {popupChungChi.url ? (() => {
          const certificateViewUrl = resolvePublicAssetUrl(popupChungChi.url)!;
          const handleImgLoad = () => setLoiXemChungChi(null);
          const handleImgError = () => {
            setLoiXemChungChi(
              'Ảnh không tải được. Thử «Mở tab mới» hoặc tải lại chứng chỉ.',
            );
          };

          return (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {loiXemChungChi && (
                <Alert
                  type="warning"
                  showIcon
                  message="Không xem được chứng chỉ trong popup"
                  description={loiXemChungChi}
                />
              )}

              {laDuongDanAnhChungChi(certificateViewUrl) ? (
                <div style={{ textAlign: 'center', minHeight: 120 }}>
                  <img
                    key={certificateViewUrl}
                    src={certificateViewUrl}
                    alt="Ảnh chứng chỉ"
                    style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
                    onLoad={handleImgLoad}
                    onError={handleImgError}
                  />
                </div>
              ) : laDuongDanPdfChungChi(certificateViewUrl) ? (
                <object
                  key={certificateViewUrl}
                  data={certificateViewUrl}
                  type="application/pdf"
                  style={{ width: '100%', height: '75vh' }}
                >
                  <iframe
                    title="Tệp PDF chứng chỉ"
                    src={certificateViewUrl}
                    style={{ width: '100%', height: '75vh', border: 'none' }}
                  />
                </object>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <img
                    key={certificateViewUrl}
                    src={certificateViewUrl}
                    alt="Chứng chỉ"
                    style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                    onLoad={handleImgLoad}
                    onError={handleImgError}
                  />
                </div>
              )}
            </Space>
          );
        })() : null}
      </Modal>
    </PageContainer>
  );
};

export default MyProfilePage;

