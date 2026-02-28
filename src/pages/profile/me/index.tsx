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
  Progress,
  Button,
  Space,
  Tabs,
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
  ClockCircleOutlined,
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
  type PublicationType,
  type PublicationRank,
} from '@/services/api/profile';
import { downloadBlob, downloadFromUrl } from '@/utils/download';
import {
  listMyPublications,
  createMyPublication,
  updateMyPublication,
  deleteMyPublication,
  getMyPublicationAuthors,
  saveMyPublicationAuthors,
  RANK_OPTIONS,
  QUARTILE_OPTIONS,
  DOMESTIC_RULE_TYPE_OPTIONS,
  generateAcademicYears,
  type Publication,
  type PublicationAuthor,
  type PublicationRank as PubRank,
  type Quartile,
  type DomesticRuleType,
} from '@/services/api/profilePublications';
import AuthorsEditor from '@/components/AuthorsEditor';
import ConvertedHoursPreviewModal from '@/components/ConvertedHoursPreviewModal';
import ProfileCompletionBar, { type ChecklistItem } from '@/components/ProfileCompletionBar';
import SemanticScholarImportModal from '@/components/SemanticScholarImportModal';

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
}

const PublicationsTab: React.FC<PublicationsTabProps> = ({
  publications,
  suggestions,
  onConfirmSuggestion,
  onIgnoreSuggestion,
  onReloadPublications,
}) => {
  const [form] = Form.useForm();
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<PublicationType | undefined>();
  const [filterRank, setFilterRank] = useState<PublicationRank | undefined>();
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
  const [semanticScholarModalVisible, setSemanticScholarModalVisible] = useState(false);

  // Watch rank field for conditional rendering
  const watchRank = Form.useWatch('rank', form);

  // Academic years options
  const academicYearOptions = generateAcademicYears(10).map((y) => ({ label: y, value: y }));

  // Filter publications
  const filteredPublications = publications.filter((pub) => {
    if (filterYear && pub.year !== filterYear) return false;
    if (filterType && pub.publicationType !== filterType) return false;
    if (filterRank && pub.rank !== filterRank) return false;
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
    setAuthors([]);
    form.resetFields();
    setDrawerVisible(true);
  };

  // Open drawer for edit
  const handleEdit = async (pub: PublicationItem) => {
    setEditingPub(pub as unknown as Publication);
    form.setFieldsValue({
      ...pub,
      academicYear: (pub as any).academicYear,
      domesticRuleType: (pub as any).domesticRuleType,
      hdgsnnScore: (pub as any).hdgsnnScore,
    });
    
    // Load authors
    try {
      const res = await getMyPublicationAuthors(pub.id);
      if (res.success && res.data) {
        setAuthors(res.data);
      }
    } catch (e) {
      setAuthors([]);
    }
    
    setDrawerVisible(true);
  };

  // Delete publication
  const handleDelete = async (id: number) => {
    try {
      const res = await deleteMyPublication(id);
      if (res.success) {
        message.success('Đã xóa công bố');
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

  // Save publication
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      let pubId: number;
      
      if (editingPub) {
        // Update
        const res = await updateMyPublication(editingPub.id, values);
        if (!res.success) {
          throw new Error('Cập nhật thất bại');
        }
        pubId = editingPub.id;
        message.success('Đã cập nhật công bố');
      } else {
        // Create
        const res = await createMyPublication({
          ...values,
          source: 'INTERNAL',
          verifiedByNcv: false,
          publicationStatus: values.publicationStatus || 'PUBLISHED',
        });
        if (!res.success || !res.data) {
          throw new Error('Tạo mới thất bại');
        }
        pubId = res.data.id;
        message.success('Đã thêm công bố mới');
      }

      // Save authors if any
      if (authors.length > 0) {
        await saveMyPublicationAuthors(pubId, authors);
      }

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
              <CloudSyncOutlined /> Gợi ý công bố mới từ nguồn ngoài ({suggestions.length})
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
            <BookOutlined /> Công bố khoa học ({publications.length})
          </Title>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Thêm thủ công
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setSemanticScholarModalVisible(true)}>
              Thêm từ Semantic Scholar
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
            <Select
              placeholder="Loại công bố"
              allowClear
              style={{ width: 150 }}
              value={filterType}
              onChange={setFilterType}
              options={Object.entries(PUBLICATION_TYPE_MAP).map(([value, { text }]) => ({
                label: text,
                value,
              }))}
            />
            <Select
              placeholder="Phân hạng"
              allowClear
              style={{ width: 120 }}
              value={filterRank}
              onChange={setFilterRank}
              options={Object.entries(PUBLICATION_RANK_MAP).map(([value, { text }]) => ({
                label: text,
                value,
              }))}
            />
            {(filterYear || filterType || filterRank) && (
              <Button
                type="link"
                onClick={() => {
                  setFilterYear(undefined);
                  setFilterType(undefined);
                  setFilterRank(undefined);
                }}
              >
                Xóa bộ lọc
              </Button>
            )}
          </Space>
          <div className="filter-stats">
            <Text type="secondary">
              Hiển thị {filteredPublications.length} / {publications.length} bài báo
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
                      title="Xóa công bố này?"
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
                      Xem thử quy đổi giờ
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
                ? 'Không có bài báo nào phù hợp với bộ lọc'
                : 'Chưa có công bố khoa học nào'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Thêm thủ công
              </Button>
              <Button icon={<ImportOutlined />} onClick={() => setSemanticScholarModalVisible(true)}>
                Thêm từ Semantic Scholar
              </Button>
            </Space>
          </Empty>
        )}
      </div>

      {/* Publication Detail Modal */}
      <Modal
        title="Chi tiết bài báo khoa học"
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

                <Col span={8}>
                  <Text strong>Năm:</Text>
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
                        : selectedPub.source === 'GOOGLE_SCHOLAR'
                        ? 'green'
                        : 'purple'
                    }
                  >
                    {selectedPub.source === 'INTERNAL'
                      ? 'Nội bộ'
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
        title={editingPub ? 'Chỉnh sửa công bố' : 'Thêm công bố mới'}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={800}
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
                name="title"
                label="Tên bài báo"
                rules={[{ required: true, message: 'Vui lòng nhập tên bài báo' }]}
              >
                <Input.TextArea rows={2} placeholder="Nhập tên bài báo đầy đủ" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="academicYear"
                label="Năm học"
                rules={[{ required: true, message: 'Vui lòng chọn năm học' }]}
              >
                <Select options={academicYearOptions} placeholder="Chọn năm học" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="year" label="Năm xuất bản">
                <InputNumber style={{ width: '100%' }} min={1900} max={2100} placeholder="VD: 2024" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="publicationType"
                label="Loại công bố"
                rules={[{ required: true, message: 'Vui lòng chọn loại công bố' }]}
              >
                <Select
                  options={Object.entries(PUBLICATION_TYPE_MAP).map(([value, { text }]) => ({
                    label: text,
                    value,
                  }))}
                  placeholder="Chọn loại"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="journalOrConference" label="Tạp chí / Hội thảo">
                <Input placeholder="Tên tạp chí hoặc hội thảo" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="rank"
                label="Phân hạng"
                rules={[{ required: true, message: 'Vui lòng chọn phân hạng' }]}
              >
                <Select options={RANK_OPTIONS} placeholder="Chọn phân hạng" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="quartile"
                label="Quartile"
                rules={[
                  {
                    required: watchRank === 'ISI' || watchRank === 'SCOPUS',
                    message: 'Vui lòng chọn Q',
                  },
                ]}
              >
                <Select
                  options={QUARTILE_OPTIONS}
                  placeholder="Chọn Q"
                  disabled={watchRank !== 'ISI' && watchRank !== 'SCOPUS'}
                />
              </Form.Item>
            </Col>

            <Col span={8}>
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

            {/* Conditional fields for DOMESTIC/OTHER */}
            {(watchRank === 'DOMESTIC' || watchRank === 'OTHER') && (
              <>
                <Col span={12}>
                  <Form.Item
                    name="domesticRuleType"
                    label="Quy tắc tính giờ"
                    rules={[{ required: true, message: 'Vui lòng chọn quy tắc' }]}
                  >
                    <Select options={DOMESTIC_RULE_TYPE_OPTIONS} placeholder="Chọn quy tắc" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) => prev.domesticRuleType !== cur.domesticRuleType}
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('domesticRuleType') === 'HDGSNN_SCORE' ? (
                        <Form.Item
                          name="hdgsnnScore"
                          label="Điểm HĐGSNN"
                          rules={[{ required: true, message: 'Vui lòng nhập điểm' }]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={0}
                            max={10}
                            step={0.25}
                            placeholder="VD: 0.75"
                          />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>
                </Col>
              </>
            )}

            <Col span={24}>
              <Form.Item name="authors" label="Danh sách tác giả (text)">
                <Input.TextArea rows={2} placeholder="VD: Nguyễn Văn A, Trần Thị B, ..." />
              </Form.Item>
            </Col>

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
              <Form.Item name="url" label="Link bài báo">
                <Input placeholder="https://..." />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Danh sách tác giả chi tiết (để tính quy đổi giờ)</Divider>

          <AuthorsEditor value={authors} onChange={setAuthors} />
        </Form>
      </Drawer>

      {/* Converted Hours Preview Modal */}
      <ConvertedHoursPreviewModal
        open={previewModalVisible}
        publicationId={previewPubId}
        publicationTitle={previewPubTitle}
        onClose={() => setPreviewModalVisible(false)}
      />

      {/* Semantic Scholar Import Modal */}
      <SemanticScholarImportModal
        open={semanticScholarModalVisible}
        onClose={() => setSemanticScholarModalVisible(false)}
        onSuccess={onReloadPublications}
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

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const result = await getMyProfile();
      
      if (result.success && result.data) {
        setProfile(result.data);
        // Load suggestions
        const sugResult = await getMySuggestions();
        if (sugResult.success) {
          setSuggestions(sugResult.data);
        }
      } else {
        // Create new profile if not exists
        const createResult = await createMyProfile({
          fullName: currentUser.name,
          workEmail: `${currentUser.name.toLowerCase().replace(/\s+/g, '')}@university.edu.vn`,
          organization: 'Trường Đại học Bách khoa - ĐHĐN',
        });
        if (createResult.success) {
          setProfile(createResult.data);
        }
      }
    } catch (error) {
      message.error('Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle tab from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
          message.success(`Tìm thấy ${result.data.newCount} công bố gợi ý mới`);
        } else {
          message.info('Không có công bố mới');
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
      message.success('Đã thêm công bố vào hồ sơ');
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
    { key: 'publications', label: 'Công bố/Đề tài', done: (profile.publications?.length || 0) > 0 || (profile.linkedProjects?.length || 0) > 0, tabKey: 'publications' },
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
            <Avatar 
              size={72} 
              src={profile.avatarUrl} 
              icon={<UserOutlined />}
              className="profile-avatar"
            />
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
                      Công bố khoa học & Bài báo
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

