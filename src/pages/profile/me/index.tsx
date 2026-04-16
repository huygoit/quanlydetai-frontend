/**
 * Hồ sơ khoa học của tôi - VIP PRO Layout
 * Theo specs/scientific-profile.md.md
 * 2-column layout: 70% tabs content + 30% sticky summary
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useModel, history, useSearchParams } from '@umijs/max';
import {
  Row,
  Col,
  Card,
  Avatar,
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
} from 'antd';
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
  SafetyCertificateOutlined,
  CloudSyncOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalculatorOutlined,
  ImportOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormDatePicker,
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
  exportMyCvPdf,
  PROFILE_STATUS_MAP,
  DEGREE_OPTIONS,
  ACADEMIC_TITLE_OPTIONS,
  RESEARCH_AREAS,
  FACULTIES,
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
import { getTeacherKpi } from '@/services/api/kpis';
import { downloadBlob, downloadFromUrl } from '@/utils/download';
import {
  listMyPublications,
  createMyPublication,
  updateMyPublication,
  deleteMyPublication,
  getMyPublicationAuthors,
  saveMyPublicationAuthors,
  normalizePublicationAuthor,
  ensureOwnerAuthorInList,
  reassignAuthorOrdersSequential,
  generateAcademicYears,
  getResearchOutputTypesTree,
  buildResearchOutputCascaderOptions,
  findResearchOutputPathById,
  findResearchOutputNodeById,
  type Publication,
  type PublicationAuthor,
  type ResearchOutputTypeTreeNode,
} from '@/services/api/profilePublications';
import type { OpenAlexPublicationDraft } from '@/services/api/openalex';
import {
  layNodeTheoPath,
  laySchemaTheoMaLa,
  type LeafFormSchema,
} from '@/services/researchOutputFormSchema';
import AuthorsEditor from '@/components/AuthorsEditor';
import ConvertedHoursPreviewModal from '@/components/ConvertedHoursPreviewModal';
import ProfileCompletionBar, { type ChecklistItem } from '@/components/ProfileCompletionBar';
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
}

const PublicationsTab: React.FC<PublicationsTabProps> = ({
  publications,
  suggestions,
  onConfirmSuggestion,
  onIgnoreSuggestion,
  onReloadPublications,
  myProfileId,
  myFullName,
}) => {
  const [form] = Form.useForm();
  const [filterYear, setFilterYear] = useState<number | undefined>();
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
  const [showAdvancedPubFields, setShowAdvancedPubFields] = useState(false);
  const [researchOutputTree, setResearchOutputTree] = useState<ResearchOutputTypeTreeNode[]>([]);
  const [researchTreeLoading, setResearchTreeLoading] = useState(false);
  const [selectedLeafRuleKind, setSelectedLeafRuleKind] = useState<string | null>(null);
  const [selectedLeafCode, setSelectedLeafCode] = useState<string | null>(null);
  const [selectedLeafSchema, setSelectedLeafSchema] = useState<LeafFormSchema>(() =>
    laySchemaTheoMaLa(null, null)
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setResearchTreeLoading(true);
      try {
        const res = await getResearchOutputTypesTree();
        if (!cancelled && res.success && res.data) setResearchOutputTree(res.data);
      } finally {
        if (!cancelled) setResearchTreeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Academic years options
  const academicYearOptions = generateAcademicYears(10).map((y) => ({ label: y, value: y }));

  // Filter publications
  const filteredPublications = publications.filter((pub) => {
    if (filterYear && pub.year !== filterYear) return false;
    return true;
  });

  // Get unique years for filter
  const years = [...new Set(publications.map((p) => p.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0));

  // View publication detail
  const handleViewDetail = (pub: PublicationItem) => {
    setSelectedPub(pub);
    setDetailModalVisible(true);
  };

  // Open drawer for create
  const handleCreate = () => {
    setEditingPub(null);
    setAuthors(ensureOwnerAuthorInList([], myProfileId, myFullName));
    setSelectedLeafRuleKind(null);
    setSelectedLeafCode(null);
    setSelectedLeafSchema(laySchemaTheoMaLa(null, null));
    setShowAdvancedPubFields(false);
    form.resetFields();
    setDrawerVisible(true);
  };

  // Open drawer for edit
  const handleEdit = async (pub: PublicationItem) => {
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
          pub.url
      )
    );
    form.setFieldsValue({
      title: pub.title,
      academicYear: pub.academicYear,
      year: pub.year,
      hdgsnnScore: pub.hdgsnnScore ?? undefined,
      isbn: pub.isbn,
      publicationStatus: pub.publicationStatus,
      volume: pub.volume,
      issue: pub.issue,
      pages: pub.pages,
      doi: pub.doi,
      issn: pub.issn,
      url: pub.url,
      researchOutputTypePath: path ?? undefined,
    });
    
    // Load authors
    try {
      const res = await getMyPublicationAuthors(pub.id);
      if (res.success && res.data) {
        setAuthors(
          ensureOwnerAuthorInList(
            reassignAuthorOrdersSequential(res.data.map(normalizePublicationAuthor)),
            myProfileId,
            myFullName
          )
        );
      } else {
        setAuthors(ensureOwnerAuthorInList([], myProfileId, myFullName));
      }
    } catch (e) {
      setAuthors(ensureOwnerAuthorInList([], myProfileId, myFullName));
    }
    
    setDrawerVisible(true);
  };

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
    const rotId = draft.researchOutputTypeId ?? null;
    const path = rotId && researchOutputTree.length ? findResearchOutputPathById(researchOutputTree, rotId) : null;
    const leaf = rotId && researchOutputTree.length ? findResearchOutputNodeById(researchOutputTree, rotId) : null;
    setSelectedLeafRuleKind(leaf?.ruleKind ?? null);
    setSelectedLeafCode(leaf?.code ?? draft.researchOutputTypeCode ?? null);
    setSelectedLeafSchema(laySchemaTheoMaLa(leaf?.code ?? draft.researchOutputTypeCode ?? null, leaf?.ruleKind ?? null));
    setShowAdvancedPubFields(Boolean(draft.volume || draft.issue || draft.pages || draft.doi || draft.issn || draft.url));
    form.setFieldsValue({
      title: draft.title,
      year: draft.year ?? undefined,
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
      ensureOwnerAuthorInList(
        reassignAuthorOrdersSequential((draft.authors || []).map(normalizePublicationAuthor)),
        myProfileId,
        myFullName
      )
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

  const handleImportOpenAlexDraft = async (draft: OpenAlexPublicationDraft) => {
    if (!draft.researchOutputTypeId) {
      message.warning('Bài báo này chưa map được loại kết quả NCKH. Tôi sẽ mở form để bạn chọn mục lá rồi lưu.');
      handleApplyOpenAlexDraft(draft);
      return;
    }
    const importedAuthors = ensureOwnerAuthorInList(
      reassignAuthorOrdersSequential((draft.authors || []).map(normalizePublicationAuthor)),
      myProfileId,
      myFullName
    );
    const authorsFromTable = importedAuthors
      .slice()
      .sort((a, b) => a.authorOrder - b.authorOrder)
      .map((a) => a.fullName.trim())
      .filter(Boolean)
      .join(', ');
    if (!authorsFromTable) {
      message.error('Bài báo OpenAlex không có danh sách tác giả hợp lệ để import.');
      return;
    }
    const created = await createMyPublication({
      researchOutputTypeId: draft.researchOutputTypeId,
      title: draft.title,
      authors: authorsFromTable,
      correspondingAuthor:
        importedAuthors.find((a) => a.isCorresponding)?.fullName ?? undefined,
      publicationType: draft.publicationType,
      journalOrConference: draft.journalOrConference || 'Không rõ nguồn công bố',
      year: draft.year ?? undefined,
      volume: draft.volume ?? undefined,
      issue: draft.issue ?? undefined,
      pages: draft.pages ?? undefined,
      doi: draft.doi ?? undefined,
      issn: draft.issn ?? undefined,
      url: draft.url ?? undefined,
      publicationStatus: 'PUBLISHED',
      source: 'OPENALEX',
      sourceId: draft.sourceId || undefined,
      needsIndexConfirmation: !!draft.needsIndexConfirmation,
      indexMappedCode: draft.researchOutputTypeCode ?? undefined,
      indexMappingReason: draft.typeMappingReason ?? undefined,
      verifiedByNcv: false,
      academicYear: undefined,
      rank: undefined,
      quartile: undefined,
      domesticRuleType: undefined,
      hdgsnnScore: undefined,
      isbn: undefined,
      approvedInternal: false,
      attachmentUrl: undefined,
    });
    if (!created.success || !created.data) {
      throw new Error('Tạo bài báo từ OpenAlex thất bại.');
    }
    await saveMyPublicationAuthors(created.data.id, importedAuthors);
    if (draft.needsIndexConfirmation) {
      message.warning('Đã import bài báo, nhưng cần xác nhận lại chỉ mục/Q trước khi chốt KPI.');
    } else {
      message.success('Đã import bài báo từ OpenAlex và tạo danh sách tác giả.');
    }
    await onReloadPublications();
  };

  // Save publication
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const rotPath = values.researchOutputTypePath as number[] | undefined;
      if (!rotPath?.length) {
        message.error('Vui lòng chọn loại kết quả NCKH (danh mục) đến mục lá.');
        return;
      }
      const researchOutputTypeId = rotPath[rotPath.length - 1];
      const leafNode = layNodeTheoPath(researchOutputTree, rotPath);
      const schema = laySchemaTheoMaLa(leafNode?.code ?? null, leafNode?.ruleKind ?? null);
      const batBuocThieu: string[] = [];
      if (schema.batBuocForm.includes('hdgsnnScore') && !(Number(values.hdgsnnScore) > 0)) {
        batBuocThieu.push('Điểm HĐGSNN');
      }
      if (
        schema.batBuocForm.includes('isbn') &&
        !(typeof values.isbn === 'string' && values.isbn.trim().length > 0)
      ) {
        batBuocThieu.push('ISBN');
      }
      if (batBuocThieu.length) {
        message.error(`Thiếu trường bắt buộc cho ${schema.tenHienThi}: ${batBuocThieu.join(', ')}`);
        return;
      }
      const publicationStatus = (values.publicationStatus || 'PUBLISHED') as Publication['publicationStatus'];
      const journalOrConference =
        editingPub?.journalOrConference?.trim() || '—';
      /** Chuẩn hoá STT 1..n (tránh trùng / khoảng trống do thêm dòng), rồi đảm bảo dòng chủ hồ sơ. */
      const finalAuthors = ensureOwnerAuthorInList(
        reassignAuthorOrdersSequential(authors),
        myProfileId,
        myFullName
      );
      setAuthors(finalAuthors);
      /** API bắt buộc chuỗi `authors` (cột DB); nếu chỉ nhập bảng chi tiết thì ghép họ tên. */
      const authorsFromTable = finalAuthors
        .slice()
        .sort((a, b) => a.authorOrder - b.authorOrder)
        .map((a) => a.fullName.trim())
        .filter(Boolean)
        .join(', ');
      if (!authorsFromTable) {
        message.error('Vui lòng nhập họ tên đầy đủ trong bảng tác giả chi tiết.');
        return;
      }
      const apiBody = {
        researchOutputTypeId,
        title: values.title,
        authors: authorsFromTable,
        academicYear: values.academicYear,
        year: values.year,
        publicationStatus,
        hdgsnnScore: values.hdgsnnScore,
        volume: values.volume,
        issue: values.issue,
        pages: values.pages,
        doi: values.doi,
        issn: values.issn,
        isbn: values.isbn,
        url: values.url,
        publicationType: (editingPub?.publicationType ?? 'JOURNAL') as Publication['publicationType'],
        journalOrConference,
        source: 'INTERNAL' as const,
        verifiedByNcv: false,
      };
      setSaving(true);

      let pubId: number;
      
      if (editingPub) {
        // Update
        const res = await updateMyPublication(editingPub.id, apiBody);
        if (!res.success) {
          throw new Error('Cập nhật thất bại');
        }
        pubId = editingPub.id;
        message.success('Đã cập nhật kết quả NCKH');
      } else {
        // Create
        const res = await createMyPublication(apiBody);
        if (!res.success || !res.data) {
          throw new Error('Tạo mới thất bại');
        }
        pubId = res.data.id;
        message.success('Đã thêm kết quả NCKH');
      }

      await saveMyPublicationAuthors(pubId, finalAuthors);

      setDrawerVisible(false);
      onReloadPublications();
    } catch (e: any) {
      message.error(e.message || 'Có lỗi xảy ra');
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

        {/* Filters */}
        <div className="publications-filters" style={{ marginTop: 16 }}>
          <Space wrap>
            <Select
              placeholder="Năm"
              allowClear
              style={{ width: 100 }}
              value={filterYear}
              onChange={setFilterYear}
              options={years.map((y) => ({ label: y, value: y }))}
            />
            {filterYear && (
              <Button
                type="link"
                onClick={() => {
                  setFilterYear(undefined);
                }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </Space>
          <div className="filter-stats">
            <Text type="secondary">
              Hiển thị {filteredPublications.length} / {publications.length} kết quả NCKH
            </Text>
          </div>
        </div>

        {/* Publications table */}
        {filteredPublications.length > 0 ? (
          <div className="publications-table">
            <ProList<PublicationItem>
              dataSource={filteredPublications.sort((a, b) => (b.year || 0) - (a.year || 0))}
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
        onClose={() => setDrawerVisible(false)}
        width="100vw"
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Hủy</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>
              Lưu
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="researchOutputTypePath"
                label="Loại kết quả NCKH (danh mục — chọn đến mục lá)"
                rules={[{ required: true, message: 'Vui lòng chọn mục lá trong cây danh mục' }]}
              >
                <Cascader
                  options={buildResearchOutputCascaderOptions(researchOutputTree)}
                  placeholder="Chọn nhóm → … → mục lá"
                  showSearch
                  changeOnSelect={false}
                  loading={researchTreeLoading}
                  style={{ width: '100%' }}
                  onChange={(_val, selectedOptions) => {
                    const last = selectedOptions?.[selectedOptions.length - 1] as
                      | { ruleKind?: string | null; code?: string | null }
                      | undefined;
                    const nextRuleKind = last?.ruleKind ?? null;
                    const nextLeafCode = (last?.code as string | undefined) ?? null;
                    const nextSchema = laySchemaTheoMaLa(nextLeafCode, nextRuleKind);
                    setSelectedLeafRuleKind(nextRuleKind);
                    setSelectedLeafCode(nextLeafCode);
                    setSelectedLeafSchema(nextSchema);
                    // Đổi lá xong thì dọn giá trị field ẩn để không gửi nhầm payload.
                    if (!nextSchema.batBuocForm.includes('isbn')) {
                      form.setFieldValue('isbn', undefined);
                    }
                    if (!nextSchema.batBuocForm.includes('hdgsnnScore')) {
                      form.setFieldValue('hdgsnnScore', undefined);
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name="title"
                label="Tiêu đề kết quả NCKH"
                rules={[{ required: true, message: 'Vui lòng nhập tiêu đề kết quả NCKH' }]}
              >
                <Input.TextArea rows={2} placeholder="Nhập tiêu đề đầy đủ" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="academicYear"
                label="Năm học (tuỳ chọn, dùng để lọc/thống kê)"
              >
                <Select allowClear options={academicYearOptions} placeholder="Chọn năm học" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="year" label="Năm xuất bản">
                <InputNumber style={{ width: '100%' }} min={1900} max={2100} placeholder="VD: 2024" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="publicationStatus" label="Trạng thái">
                <Select
                  options={[
                    { label: 'Đã xuất bản', value: 'PUBLISHED' },
                    { label: 'Đã chấp nhận', value: 'ACCEPTED' },
                    { label: 'Đang review', value: 'UNDER_REVIEW' },
                  ]}
                  placeholder="Chọn trạng thái"
                />
              </Form.Item>
            </Col>

            {(selectedLeafRuleKind === 'HDGSNN_POINTS_TO_HOURS' ||
              selectedLeafSchema.batBuocForm.includes('hdgsnnScore')) && (
              <Col span={12}>
                <Form.Item
                  name="hdgsnnScore"
                  label="Điểm HĐGSNN (quy đổi giờ)"
                  rules={[{ required: true, message: 'Vui lòng nhập điểm HĐGSNN' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    max={10}
                    step={0.25}
                    placeholder="VD: 0.75"
                  />
                </Form.Item>
              </Col>
            )}

            <Col span={24}>
              <Button type="link" style={{ paddingLeft: 0 }} onClick={() => setShowAdvancedPubFields((v) => !v)}>
                {showAdvancedPubFields ? 'Ẩn thông tin bài báo mở rộng' : 'Hiện thông tin bài báo mở rộng'}
              </Button>
            </Col>

            {selectedLeafSchema.batBuocForm.includes('isbn') && (
              <Col span={12}>
                <Form.Item
                  name="isbn"
                  label="ISBN"
                  rules={[{ required: true, message: 'Vui lòng nhập ISBN cho loại kết quả này' }]}
                >
                  <Input placeholder="VD: 978-..." />
                </Form.Item>
              </Col>
            )}

            {showAdvancedPubFields && (
              <>
                <Col span={8}>
                  <Form.Item name="volume" label="Volume">
                    <Input placeholder="VD: 15" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="issue" label="Issue">
                    <Input placeholder="VD: 3" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="pages" label="Trang">
                    <Input placeholder="VD: 123-145" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="doi" label="DOI">
                    <Input placeholder="VD: 10.1234/example" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="issn" label="ISSN">
                    <Input placeholder="VD: 1234-5678" />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Form.Item name="url" label="Link (URL)">
                    <Input placeholder="https://..." />
                  </Form.Item>
                </Col>
              </>
            )}
          </Row>

          <Divider>Danh sách tác giả chi tiết (để tính quy đổi giờ)</Divider>

          <AuthorsEditor
            value={authors}
            onChange={setAuthors}
            ownerProfileId={myProfileId}
          />
        </Form>
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
        onImportDraft={handleImportOpenAlexDraft}
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

  const [profile, setProfile] = useState<ScientificProfile | null>(null);
  const [suggestions, setSuggestions] = useState<PublicationSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<string>('general');
  const [languageEditableKeys, setLanguageEditableKeys] = useState<React.Key[]>([]);

  /** Tổng giờ NCKH + điểm quy đổi (năm học mặc định theo API). */
  const [nckhHours, setNckhHours] = useState<number | null>(null);
  const [nckhPoints, setNckhPoints] = useState<number | null>(null);
  const [nckhLoading, setNckhLoading] = useState(false);

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await getMyProfile();

      if (result.success && result.data) {
        setProfile(result.data);
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
          setProfile(createResult.data);
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

  const isOnboarding = searchParams.get('onboarding') === '1';

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    setNckhLoading(true);
    getTeacherKpi(profile.id)
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
  }, [profile?.id]);

  const dismissOnboarding = () => {
    history.replace('/profile/me');
  };

  // Save draft
  const handleSaveDraft = async (values: any) => {
    if (!profile) return;

    setSaving(true);
    try {
      const result = await updateMyProfile({
        ...values,
        status: 'DRAFT',
      });

      if (result.success && result.data) {
        setProfile(result.data);
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
        setProfile(result.data);
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

  // Export CV as PDF
  const handleExportCvPdf = async () => {
    if (!profile) return;

    setExporting(true);
    try {
      const result = await exportMyCvPdf();

      if (result instanceof Blob) {
        const filename = `CV_${profile.fullName.replace(/\s+/g, '_')}.pdf`;
        downloadBlob(result, filename);
        message.success('Đã tải CV thành công');
      } else if (result.url) {
        downloadFromUrl(result.url, `CV_${profile.fullName}.pdf`);
        message.success('Đã tải CV thành công');
      }
    } catch (error) {
      message.error('Không thể xuất CV. Vui lòng thử lại.');
    } finally {
      setExporting(false);
    }
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
      title: 'Link file',
      dataIndex: 'certificateUrl',
      width: 200,
      render: (_, record) => 
        record.certificateUrl ? (
          <a href={record.certificateUrl} target="_blank" rel="noopener noreferrer">
            Xem file
          </a>
        ) : '-',
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
      <PageContainer>
        <div className="profile-loading">
          <Spin size="large" tip="Đang tải hồ sơ..." />
        </div>
      </PageContainer>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
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
    >
      {/* Header compact */}
      <Card className="profile-header-card" bordered={false}>
        <div className="profile-header">
          <div className="profile-header-left">
            <div className="profile-avatar-nckh">
              <div className="profile-avatar-ring">
                <Avatar
                  size={72}
                  src={profile.avatarUrl}
                  icon={<UserOutlined />}
                  className="profile-avatar"
                />
              </div>
              {profile.id != null && (
                <Tooltip
                  title="Giờ và điểm quy đổi theo năm học hiện tại (tháng 9 đổi năm), từ loại kết quả NCKH đã gán và bảng tác giả."
                >
                  <div
                    className="profile-nckh-highlight"
                    aria-label="Số giờ NCKH và điểm quy đổi"
                  >
                    <div className="profile-nckh-metric">
                      <span className="profile-nckh-highlight-label">Số giờ NCKH</span>
                      <span className="profile-nckh-highlight-value">
                        {nckhLoading ? (
                          <Spin size="small" />
                        ) : nckhHours != null ? (
                          <>{Math.round(nckhHours * 100) / 100} giờ</>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                    <div className="profile-nckh-divider" aria-hidden />
                    <div className="profile-nckh-metric">
                      <span className="profile-nckh-highlight-label">Điểm quy đổi</span>
                      <span className="profile-nckh-highlight-value profile-nckh-points">
                        {nckhLoading ? (
                          <Spin size="small" />
                        ) : nckhPoints != null ? (
                          <>{Math.round(nckhPoints * 100) / 100} điểm</>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>
                  </div>
                </Tooltip>
              )}
            </div>
            <div className="profile-header-info">
              <Title level={4} className="profile-name">
                {profile.fullName}
                {profile.status === 'VERIFIED' && (
                  <Tooltip title="Hồ sơ đã xác thực">
                    <SafetyCertificateOutlined className="verified-badge" />
                  </Tooltip>
                )}
              </Title>
              <Text type="secondary">
                {[profile.organization, profile.faculty, profile.department]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <div className="profile-badges">
                <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
                {profile.degree && <Tag>{profile.degree}</Tag>}
                {profile.academicTitle && profile.academicTitle !== 'Không' && (
                  <Tag color="gold">{profile.academicTitle}</Tag>
                )}
              </div>
            </div>
          </div>
          <div className="profile-header-actions">
            <Button
              type="primary"
              icon={<FilePdfOutlined />}
              loading={exporting}
              onClick={handleExportCvPdf}
            >
              Xuất CV (PDF)
            </Button>
          </div>
        </div>
      </Card>

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
                        <Row gutter={16}>
                          <Col xs={24} md={8}>
                            <ProFormSelect
                              name="degree"
                              label="Học vị"
                              options={DEGREE_OPTIONS.map(d => ({ label: d, value: d }))}
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <ProFormSelect
                              name="academicTitle"
                              label="Học hàm"
                              options={ACADEMIC_TITLE_OPTIONS.map(t => ({ label: t, value: t }))}
                            />
                          </Col>
                          <Col xs={24} md={8}>
                            <ProFormText
                              name="degreeYear"
                              label="Năm nhận học vị"
                              fieldProps={{ type: 'number' }}
                            />
                          </Col>
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

                      <div className="form-section">
                        <Title level={5}>Thông tin công tác</Title>
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <ProFormText
                              name="organization"
                              label="Đơn vị"
                              rules={[{ required: true }]}
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormSelect
                              name="faculty"
                              label="Khoa / Phòng"
                              options={FACULTIES.map(f => ({ label: f, value: f }))}
                              showSearch
                            />
                          </Col>
                          <Col xs={24} md={12}>
                            <ProFormText name="department" label="Bộ môn" />
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
                          const result = await updateMyProfile(profile.id, {
                            languages: value as ProfileLanguage[],
                          });
                          if (result.data) {
                            setProfile(result.data);
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
                          onSave: async () => {
                            message.success('Đã lưu');
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
                              name="mainResearchArea"
                              label="Lĩnh vực nghiên cứu chính"
                              options={RESEARCH_AREAS.map(r => ({ label: r, value: r }))}
                              rules={[{ required: true }]}
                            />
                          </Col>
                          <Col xs={24}>
                            <ProFormSelect
                              name="subResearchAreas"
                              label="Lĩnh vực phụ"
                              mode="tags"
                              placeholder="Nhập và Enter để thêm"
                              fieldProps={{
                                tokenSeparators: [','],
                              }}
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
                    <span>
                      <FileTextOutlined />
                      Kết quả NCKH
                      {suggestions.length > 0 && (
                        <Tag color="red" className="tab-badge">{suggestions.length}</Tag>
                      )}
                    </span>
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
    </PageContainer>
  );
};

export default MyProfilePage;

