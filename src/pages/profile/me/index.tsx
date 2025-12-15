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
  Radio,
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  SendOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  BookOutlined,
  ProjectOutlined,
  FileTextOutlined,
  GlobalOutlined,
  TeamOutlined,
  SafetyCertificateOutlined,
  CloudSyncOutlined,
  ClockCircleOutlined,
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
  queryMyProfile,
  createMyProfile,
  updateMyProfile,
  submitProfileUpdate,
  getSuggestions,
  syncFromGoogleScholar,
  syncFromSCV,
  confirmSuggestion,
  ignoreSuggestion,
  exportCV,
  calculateCompleteness,
  PROFILE_STATUS_MAP,
  DEGREE_OPTIONS,
  ACADEMIC_TITLE_OPTIONS,
  RESEARCH_AREAS,
  FACULTIES,
  LANGUAGES,
  LANGUAGE_LEVELS,
  PUBLICATION_TYPE_MAP,
  PUBLICATION_RANK_MAP,
  PUBLICATION_STATUS_MAP,
  AUTHOR_ROLE_MAP,
  QUARTILE_OPTIONS,
} from '@/services/profile';
import type {
  ScientificProfile,
  ProfileLanguage,
  PublicationItem,
  LinkedProject,
  PublicationSuggestion,
  ProfileAttachment,
  CVTemplate,
  ExportFormat,
  PublicationType,
  PublicationRank,
} from '@/services/profile';
import {
  notifyProfileSubmitted,
  notifyPublicationSync,
} from '@/services/notification';
import './index.less';

const { Title, Text, Paragraph } = Typography;

// ========== PUBLICATIONS TAB COMPONENT ==========

interface PublicationsTabProps {
  publications: PublicationItem[];
  suggestions: PublicationSuggestion[];
  onConfirmSuggestion: (id: string) => void;
  onIgnoreSuggestion: (id: string) => void;
}

const PublicationsTab: React.FC<PublicationsTabProps> = ({
  publications,
  suggestions,
  onConfirmSuggestion,
  onIgnoreSuggestion,
}) => {
  const [filterYear, setFilterYear] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<PublicationType | undefined>();
  const [filterRank, setFilterRank] = useState<PublicationRank | undefined>();
  const [selectedPub, setSelectedPub] = useState<PublicationItem | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  // Publication table columns
  const publicationColumns: ProColumns<PublicationItem>[] = [
    {
      title: 'Tên bài báo',
      dataIndex: 'title',
      width: 280,
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => handleViewDetail(record)} className="pub-title-link">
          {record.title}
        </a>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'publicationType',
      width: 120,
      render: (type) => {
        const config = PUBLICATION_TYPE_MAP[type as PublicationType];
        return config ? <Tag color={config.color}>{config.text}</Tag> : '-';
      },
    },
    {
      title: 'Tạp chí / Hội thảo',
      dataIndex: 'journalOrConference',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Năm',
      dataIndex: 'year',
      width: 70,
      align: 'center',
    },
    {
      title: 'Phân hạng',
      dataIndex: 'rank',
      width: 90,
      align: 'center',
      render: (rank) => {
        if (!rank) return '-';
        const config = PUBLICATION_RANK_MAP[rank as PublicationRank];
        return config ? <Tag color={config.color}>{config.text}</Tag> : rank;
      },
    },
    {
      title: 'Q',
      dataIndex: 'quartile',
      width: 60,
      align: 'center',
      render: (q) => {
        if (!q) return '-';
        const colorMap: Record<string, string> = {
          Q1: 'red',
          Q2: 'orange',
          Q3: 'blue',
          Q4: 'default',
        };
        return <Tag color={colorMap[q] || 'default'}>{q}</Tag>;
      },
    },
    {
      title: 'Vai trò',
      dataIndex: 'myRole',
      width: 100,
      render: (role) => {
        if (!role) return '-';
        const config = AUTHOR_ROLE_MAP[role as keyof typeof AUTHOR_ROLE_MAP];
        return config ? <Tag color={config.color}>{config.text}</Tag> : role;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'publicationStatus',
      width: 110,
      render: (status) => {
        const config = PUBLICATION_STATUS_MAP[status as keyof typeof PUBLICATION_STATUS_MAP];
        return config ? <Tag color={config.color}>{config.text}</Tag> : status;
      },
    },
    {
      title: 'Nguồn',
      dataIndex: 'source',
      width: 110,
      render: (source) => {
        const sourceMap: Record<string, { text: string; color: string }> = {
          INTERNAL: { text: 'Nội bộ', color: 'blue' },
          GOOGLE_SCHOLAR: { text: 'Scholar', color: 'green' },
          SCV_DHDN: { text: 'SCV', color: 'purple' },
        };
        const config = sourceMap[source as string];
        return config ? <Tag color={config.color}>{config.text}</Tag> : source;
      },
    },
    {
      title: 'DOI/Link',
      width: 80,
      align: 'center',
      render: (_, record) =>
        record.doi ? (
          <a href={`https://doi.org/${record.doi}`} target="_blank" rel="noopener noreferrer">
            <GlobalOutlined /> DOI
          </a>
        ) : record.url ? (
          <a href={record.url} target="_blank" rel="noopener noreferrer">
            <GlobalOutlined /> Link
          </a>
        ) : (
          '-'
        ),
    },
  ];

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
        <div className="section-header">
          <Title level={5}>
            <BookOutlined /> Bài báo đã gắn vào hồ sơ ({publications.length})
          </Title>
        </div>

        {/* Filters */}
        <div className="publications-filters">
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
                    <Button key="view" type="link" size="small" onClick={() => handleViewDetail(record)}>
                      Chi tiết
                    </Button>,
                    record.doi && (
                      <a
                        key="doi"
                        href={`https://doi.org/${record.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        DOI
                      </a>
                    ),
                    record.attachmentUrl && (
                      <a key="file" href={record.attachmentUrl} target="_blank" rel="noopener noreferrer">
                        Minh chứng
                      </a>
                    ),
                  ].filter(Boolean),
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
          />
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
          selectedPub?.doi && (
            <Button
              key="doi"
              type="primary"
              href={`https://doi.org/${selectedPub.doi}`}
              target="_blank"
            >
              Mở DOI
            </Button>
          ),
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
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportTemplate, setExportTemplate] = useState<CVTemplate>('DHDN');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('PDF');

  // Load profile data
  const loadProfile = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      // Use user role as userId for demo (in real app, use actual userId)
      const userId = currentUser.role === 'NCV' ? 'user-1' : 
                    currentUser.role === 'CNDT' ? 'user-2' : 
                    `user-${currentUser.role.toLowerCase()}`;

      const result = await queryMyProfile(userId);
      
      if (result.data) {
        setProfile(result.data);
        // Load suggestions
        const sugResult = await getSuggestions(result.data.id);
        setSuggestions(sugResult.data);
      } else {
        // Create new profile if not exists
        const createResult = await createMyProfile(
          userId,
          currentUser.name,
          `${currentUser.name.toLowerCase().replace(/\s+/g, '')}@university.edu.vn`,
          'Trường Đại học Bách khoa - ĐHĐN'
        );
        setProfile(createResult.data);
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
      const result = await updateMyProfile(profile.id, {
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
      const result = await submitProfileUpdate(profile.id);

      if (result.success && result.data) {
        setProfile(result.data);
        // Notify Phong KH
        await notifyProfileSubmitted(result.data.id, result.data.fullName);
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
        result = await syncFromGoogleScholar(profile.id);
      } else {
        result = await syncFromSCV(profile.id);
      }

      if (result.success) {
        // Reload suggestions
        const sugResult = await getSuggestions(profile.id);
        setSuggestions(sugResult.data);

        if (result.newCount > 0) {
          // Notify user about new suggestions
          await notifyPublicationSync(
            profile.userId,
            result.newCount,
            source === 'scholar' ? 'Google Scholar' : 'SCV ĐHĐN'
          );
          message.success(`Tìm thấy ${result.newCount} công bố gợi ý mới`);
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
  const handleConfirmSuggestion = async (suggestionId: string) => {
    const result = await confirmSuggestion(suggestionId);
    if (result.success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      // Reload profile to get updated publications
      await loadProfile();
      message.success('Đã thêm công bố vào hồ sơ');
    }
  };

  // Ignore suggestion
  const handleIgnoreSuggestion = async (suggestionId: string) => {
    const result = await ignoreSuggestion(suggestionId);
    if (result.success) {
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      message.success('Đã bỏ qua');
    }
  };

  // Export CV
  const handleExportCV = async () => {
    if (!profile) return;

    setExporting(true);
    try {
      const result = await exportCV(profile.id, exportTemplate, exportFormat);

      if (result.success) {
        message.success(`Đang tạo CV mẫu ${exportTemplate} định dạng ${exportFormat}...`);
        // V1: Mock download - in real app, trigger actual download
        setTimeout(() => {
          message.info('CV đã được tạo (V1 Mock - file placeholder)');
          setExportModalVisible(false);
        }, 500);
      }
    } catch (error) {
      message.error('Lỗi xuất CV');
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

  // Checklist for completeness
  const checklist = [
    { label: 'Email & Đơn vị', done: !!profile.workEmail && !!profile.organization },
    { label: 'Học vị', done: !!profile.degree },
    { label: 'Hướng nghiên cứu', done: !!profile.mainResearchArea },
    { label: 'Ngoại ngữ', done: (profile.languages?.length || 0) > 0 },
    { label: 'Công bố/Đề tài', done: (profile.publications?.length || 0) > 0 || (profile.linkedProjects?.length || 0) > 0 },
  ];

  return (
    <PageContainer
      title={false}
      className="profile-me-page"
    >
      {/* Header compact */}
      <Card className="profile-header-card" bordered={false}>
        <div className="profile-header">
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

      <Row gutter={24} className="profile-content">
        {/* Left column: Tabs content (70%) */}
        <Col xs={24} lg={17}>
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
                {
                  key: 'attachments',
                  label: (
                    <span>
                      <FileTextOutlined />
                      Tệp đính kèm
                    </span>
                  ),
                  children: (
                    <div className="attachments-tab">
                      <div className="section-header">
                        <Title level={5}>Tệp đính kèm</Title>
                        <Text type="secondary">
                          Bằng cấp, chứng chỉ, CV PDF...
                        </Text>
                      </div>
                      {profile.attachments && profile.attachments.length > 0 ? (
                        <ProList<ProfileAttachment>
                          dataSource={profile.attachments}
                          rowKey="id"
                          metas={{
                            title: {
                              dataIndex: 'name',
                            },
                            description: {
                              render: (_, record) => (
                                <Space>
                                  <Tag>
                                    {record.type === 'CV_PDF'
                                      ? 'CV PDF'
                                      : record.type === 'DEGREE'
                                      ? 'Bằng cấp'
                                      : record.type === 'CERTIFICATE'
                                      ? 'Chứng chỉ'
                                      : 'Khác'}
                                  </Tag>
                                  <Text type="secondary">{record.uploadedAt}</Text>
                                </Space>
                              ),
                            },
                            actions: {
                              render: () => [
                                <a key="download" href="#">
                                  Tải xuống
                                </a>,
                              ],
                            },
                          }}
                        />
                      ) : (
                        <Empty description="Chưa có tệp đính kèm" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                          <Button type="dashed" disabled>
                            Upload file (V1 Mock)
                          </Button>
                        </Empty>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'export',
                  label: (
                    <span>
                      <DownloadOutlined />
                      Xuất CV
                    </span>
                  ),
                  children: (
                    <div className="export-tab">
                      <div className="export-intro">
                        <Title level={5}>Xuất CV theo mẫu chuẩn</Title>
                        <Paragraph type="secondary">
                          Chọn mẫu CV và định dạng file để xuất. Hệ thống sẽ tự động điền thông tin từ hồ sơ khoa học của bạn.
                        </Paragraph>
                      </div>

                      <div className="export-options">
                        <div className="option-group">
                          <Text strong>Mẫu CV:</Text>
                          <Radio.Group
                            value={exportTemplate}
                            onChange={(e) => setExportTemplate(e.target.value)}
                            optionType="button"
                            buttonStyle="solid"
                          >
                            <Radio.Button value="BO_KHCN">Bộ KH&CN</Radio.Button>
                            <Radio.Button value="DHDN">ĐHĐN</Radio.Button>
                            <Radio.Button value="NOI_BO">Nội bộ Trường</Radio.Button>
                          </Radio.Group>
                        </div>

                        <div className="option-group">
                          <Text strong>Định dạng:</Text>
                          <Radio.Group
                            value={exportFormat}
                            onChange={(e) => setExportFormat(e.target.value)}
                            optionType="button"
                          >
                            <Radio.Button value="PDF">PDF</Radio.Button>
                            <Radio.Button value="DOCX">DOCX</Radio.Button>
                          </Radio.Group>
                        </div>

                        <Button
                          type="primary"
                          size="large"
                          icon={<DownloadOutlined />}
                          loading={exporting}
                          onClick={handleExportCV}
                          className="export-btn"
                        >
                          Xuất CV
                        </Button>

                        <Alert
                          message="V1 Mock"
                          description="Phiên bản V1 sẽ tạo file placeholder. Tính năng generate CV thực sẽ được phát triển ở phiên bản sau."
                          type="info"
                          showIcon
                          style={{ marginTop: 24 }}
                        />
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Right column: Summary sticky (30%) */}
        <Col xs={24} lg={7}>
          <div className="profile-summary-sticky">
            {/* Progress card */}
            <Card className="summary-card progress-card" bordered={false}>
              <div className="progress-header">
                <Title level={5}>Hoàn thiện hồ sơ</Title>
                <Progress
                  type="circle"
                  percent={profile.completeness}
                  width={80}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </div>
              <div className="checklist">
                {checklist.map((item, index) => (
                  <div key={index} className={`checklist-item ${item.done ? 'done' : ''}`}>
                    {item.done ? (
                      <CheckCircleOutlined className="icon done" />
                    ) : (
                      <ExclamationCircleOutlined className="icon pending" />
                    )}
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Status card */}
            <Card className="summary-card status-card" bordered={false}>
              <div className="status-header">
                <Title level={5}>Trạng thái</Title>
                <Tag color={statusConfig.color} className="status-tag">
                  {statusConfig.text}
                </Tag>
              </div>
              {profile.verifiedAt && (
                <div className="verify-info">
                  <Text type="secondary">
                    <ClockCircleOutlined /> Xác thực: {new Date(profile.verifiedAt).toLocaleDateString('vi-VN')}
                  </Text>
                  {profile.verifiedBy && (
                    <Text type="secondary">
                      <TeamOutlined /> Bởi: {profile.verifiedBy}
                    </Text>
                  )}
                </div>
              )}
            </Card>

            {/* Actions card */}
            <Card className="summary-card actions-card" bordered={false}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  block
                  icon={<SaveOutlined />}
                  onClick={() => {
                    const form = document.querySelector('.ant-pro-form') as HTMLFormElement;
                    form?.dispatchEvent(new Event('submit', { bubbles: true }));
                  }}
                  loading={saving}
                >
                  Lưu nháp
                </Button>

                {(profile.status === 'DRAFT' || profile.status === 'NEED_MORE_INFO') && (
                  <Button
                    block
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSubmitUpdate}
                    loading={submitting}
                  >
                    Gửi cập nhật
                  </Button>
                )}

                <Divider style={{ margin: '12px 0', fontSize: 13 }}>Đồng bộ công bố khoa học & bài báo</Divider>

                <Button
                  block
                  icon={<SyncOutlined spin={syncing} />}
                  onClick={() => handleSync('scholar')}
                  loading={syncing}
                >
                  Google Scholar
                </Button>

                <Button
                  block
                  icon={<SyncOutlined spin={syncing} />}
                  onClick={() => handleSync('scv')}
                  loading={syncing}
                >
                  SCV ĐHĐN
                </Button>
              </Space>
            </Card>

            {/* Last updated */}
            <div className="last-updated">
              <Text type="secondary">
                Cập nhật: {new Date(profile.updatedAt).toLocaleString('vi-VN')}
              </Text>
            </div>
          </div>
        </Col>
      </Row>

      {/* Export Modal */}
      <Modal
        title="Xuất CV"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        onOk={handleExportCV}
        confirmLoading={exporting}
        okText="Xuất"
        cancelText="Hủy"
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>Mẫu CV:</Text>
            <Select
              value={exportTemplate}
              onChange={setExportTemplate}
              style={{ width: '100%', marginTop: 8 }}
              options={[
                { label: 'Bộ KH&CN', value: 'BO_KHCN' },
                { label: 'ĐHĐN', value: 'DHDN' },
                { label: 'Nội bộ Trường', value: 'NOI_BO' },
              ]}
            />
          </div>
          <div>
            <Text strong>Định dạng:</Text>
            <Select
              value={exportFormat}
              onChange={setExportFormat}
              style={{ width: '100%', marginTop: 8 }}
              options={[
                { label: 'PDF', value: 'PDF' },
                { label: 'DOCX', value: 'DOCX' },
              ]}
            />
          </div>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default MyProfilePage;

