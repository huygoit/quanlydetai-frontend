/**
 * Chi tiết hồ sơ khoa học - Xem (Read-only)
 * Theo specs/scientific-profile.md.md Section 5.4
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useModel, useAccess, history } from '@umijs/max';
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
  Spin,
  Empty,
  Typography,
  Tooltip,
  Divider,
  Drawer,
  Form,
  Input,
  message,
  Timeline,
  Descriptions,
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  ProjectOutlined,
  FileTextOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  TrophyOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { PageContainer, ProList } from '@ant-design/pro-components';
import {
  getProfileById,
  getVerifyLogs,
  verifyProfile,
  requestMoreInfo,
  PROFILE_STATUS_MAP,
  PUBLICATION_TYPE_MAP,
  PUBLICATION_RANK_MAP,
  type ScientificProfile,
  type ProfileVerifyLog,
  type PublicationItem,
  type LinkedProject,
  type ProfileLanguage,
  type PublicationType,
  type PublicationRank,
} from '@/services/api/profile';

const PUBLICATION_STATUS_MAP: Record<string, { text: string; color: string }> = {
  PUBLISHED: { text: 'Đã xuất bản', color: 'success' },
  ACCEPTED: { text: 'Đã chấp nhận', color: 'processing' },
  UNDER_REVIEW: { text: 'Đang review', color: 'warning' },
};
const AUTHOR_ROLE_MAP: Record<string, { text: string; color: string }> = {
  CHU_TRI: { text: 'Tác giả chính', color: 'gold' },
  DONG_TAC_GIA: { text: 'Đồng tác giả', color: 'blue' },
};
import ConvertedHoursPreviewModal from '@/components/ConvertedHoursPreviewModal';
import './index.less';

const { Title, Text, Paragraph } = Typography;

const ProfileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { initialState } = useModel('@@initialState');
  const access = useAccess();
  const currentUser = initialState?.currentUser;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ScientificProfile | null>(null);
  const [verifyLogs, setVerifyLogs] = useState<ProfileVerifyLog[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const [verifyDrawerVisible, setVerifyDrawerVisible] = useState(false);
  const [verifyAction, setVerifyAction] = useState<'verify' | 'request'>('verify');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyForm] = Form.useForm();

  // Preview converted hours
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewPubId, setPreviewPubId] = useState<number | null>(null);
  const [previewPubTitle, setPreviewPubTitle] = useState<string>('');

  const canVerify = access.canVerifyProfile;
  const canViewHoursConversion = access.canVerifyProfile;

  // Handle preview hours
  const handlePreviewHours = (pub: PublicationItem) => {
    setPreviewPubId(pub.id);
    setPreviewPubTitle(pub.title);
    setPreviewModalVisible(true);
  };

  // Load data
  const loadData = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [profileResult, logsResult] = await Promise.all([
        getProfileById(Number(id)),
        getVerifyLogs(Number(id)),
      ]);

      if (profileResult.success && profileResult.data) {
        setProfile(profileResult.data);
      }
      if (logsResult.success) {
        setVerifyLogs(logsResult.data);
      }
    } catch (error) {
      message.error('Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle verify/request
  const handleOpenVerify = (action: 'verify' | 'request') => {
    setVerifyAction(action);
    verifyForm.resetFields();
    setVerifyDrawerVisible(true);
  };

  const handleVerifySubmit = async () => {
    if (!profile || !currentUser) return;

    const values = await verifyForm.validateFields();
    setVerifyLoading(true);

    try {
      if (verifyAction === 'verify') {
        const result = await verifyProfile(profile.id, values.note || '');

        if (result.success) {
          message.success('Đã xác thực hồ sơ');
          setVerifyDrawerVisible(false);
          loadData();
        }
      } else {
        const result = await requestMoreInfo(profile.id, values.note || '');

        if (result.success) {
          message.success('Đã gửi yêu cầu bổ sung');
          setVerifyDrawerVisible(false);
          loadData();
        }
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setVerifyLoading(false);
    }
  };

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

  return (
    <PageContainer
      title={false}
      className="profile-detail-page"
      header={{
        breadcrumb: {},
      }}
    >
      {/* Back button */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => history.back()}
        className="back-btn"
      >
        Quay lại
      </Button>

      {/* Header card */}
      <Card className="profile-header-card" bordered={false}>
        <Row gutter={24} align="middle">
          <Col xs={24} md={16}>
            <div className="profile-header">
              <Avatar
                size={80}
                src={profile.avatarUrl}
                icon={<UserOutlined />}
                className="profile-avatar"
              />
              <div className="profile-header-info">
                <Title level={3} className="profile-name">
                  {profile.fullName}
                  {profile.status === 'VERIFIED' && (
                    <Tooltip title="Hồ sơ đã xác thực">
                      <SafetyCertificateOutlined className="verified-badge" />
                    </Tooltip>
                  )}
                </Title>
                <Text type="secondary" className="profile-org">
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
                  {profile.currentTitle && <Tag color="cyan">{profile.currentTitle}</Tag>}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div className="profile-actions">
              {canVerify && (
                <Space>
                  {profile.status !== 'VERIFIED' && (
                    <Button
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleOpenVerify('verify')}
                    >
                      Xác thực
                    </Button>
                  )}
                  {profile.status !== 'NEED_MORE_INFO' && (
                    <Button
                      danger
                      icon={<ExclamationCircleOutlined />}
                      onClick={() => handleOpenVerify('request')}
                    >
                      Yêu cầu bổ sung
                    </Button>
                  )}
                </Space>
              )}
              <div className="completeness">
                <Text type="secondary">Hoàn thiện:</Text>
                <Progress
                  percent={profile.completeness}
                  size="small"
                  status={profile.completeness >= 80 ? 'success' : 'normal'}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        {/* Main content */}
        <Col xs={24} lg={17}>
          <Card bordered={false} className="profile-tabs-card">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'overview',
                  label: (
                    <span>
                      <UserOutlined />
                      Tổng quan
                    </span>
                  ),
                  children: (
                    <div className="tab-content">
                      {/* Bio */}
                      {profile.bio && (
                        <div className="section">
                          <Title level={5}>Giới thiệu</Title>
                          <Paragraph>{profile.bio}</Paragraph>
                        </div>
                      )}

                      {/* Contact info */}
                      <div className="section">
                        <Title level={5}>Thông tin liên hệ</Title>
                        <Descriptions column={{ xs: 1, sm: 2 }} size="small">
                          <Descriptions.Item label={<><MailOutlined /> Email</>}>
                            {profile.workEmail}
                          </Descriptions.Item>
                          {profile.phone && (
                            <Descriptions.Item label={<><PhoneOutlined /> Điện thoại</>}>
                              {profile.phone}
                            </Descriptions.Item>
                          )}
                          {profile.dateOfBirth && (
                            <Descriptions.Item label="Ngày sinh">
                              {new Date(profile.dateOfBirth).toLocaleDateString('vi-VN')}
                            </Descriptions.Item>
                          )}
                          {profile.gender && (
                            <Descriptions.Item label="Giới tính">
                              {profile.gender}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </div>

                      {/* Academic links */}
                      {(profile.orcid || profile.googleScholarUrl || profile.scopusId) && (
                        <div className="section">
                          <Title level={5}>Liên kết học thuật</Title>
                          <Space wrap>
                            {profile.orcid && (
                              <Tag icon={<GlobalOutlined />} color="green">
                                ORCID: {profile.orcid}
                              </Tag>
                            )}
                            {profile.googleScholarUrl && (
                              <a href={profile.googleScholarUrl} target="_blank" rel="noopener noreferrer">
                                <Tag icon={<BookOutlined />} color="blue">Google Scholar</Tag>
                              </a>
                            )}
                            {profile.scopusId && (
                              <Tag icon={<FileTextOutlined />} color="orange">
                                Scopus: {profile.scopusId}
                              </Tag>
                            )}
                            {profile.researchGateUrl && (
                              <a href={profile.researchGateUrl} target="_blank" rel="noopener noreferrer">
                                <Tag color="cyan">ResearchGate</Tag>
                              </a>
                            )}
                          </Space>
                        </div>
                      )}

                      {/* Education */}
                      <div className="section">
                        <Title level={5}>Đào tạo</Title>
                        <Descriptions column={1} size="small">
                          {profile.degree && (
                            <Descriptions.Item label="Học vị">
                              {profile.degree}
                              {profile.degreeYear && ` (${profile.degreeYear})`}
                            </Descriptions.Item>
                          )}
                          {profile.academicTitle && profile.academicTitle !== 'Không' && (
                            <Descriptions.Item label="Học hàm">
                              {profile.academicTitle}
                            </Descriptions.Item>
                          )}
                          {profile.degreeInstitution && (
                            <Descriptions.Item label="Cơ sở đào tạo">
                              {profile.degreeInstitution}
                              {profile.degreeCountry && `, ${profile.degreeCountry}`}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </div>

                      {/* Work */}
                      <div className="section">
                        <Title level={5}>Công tác</Title>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label={<><HomeOutlined /> Đơn vị</>}>
                            {profile.organization}
                          </Descriptions.Item>
                          {profile.faculty && (
                            <Descriptions.Item label="Khoa/Phòng">
                              {profile.faculty}
                            </Descriptions.Item>
                          )}
                          {profile.department && (
                            <Descriptions.Item label="Bộ môn">
                              {profile.department}
                            </Descriptions.Item>
                          )}
                          {profile.currentTitle && (
                            <Descriptions.Item label="Chức danh">
                              {profile.currentTitle}
                            </Descriptions.Item>
                          )}
                          {profile.managementRole && (
                            <Descriptions.Item label="Vai trò quản lý">
                              {profile.managementRole}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </div>

                      {/* Research areas */}
                      {profile.mainResearchArea && (
                        <div className="section">
                          <Title level={5}>Hướng nghiên cứu</Title>
                          <div className="research-tags">
                            <Tag color="blue" icon={<TrophyOutlined />}>
                              {profile.mainResearchArea}
                            </Tag>
                            {profile.subResearchAreas?.map((area, idx) => (
                              <Tag key={idx}>{area}</Tag>
                            ))}
                          </div>
                          {profile.keywords && profile.keywords.length > 0 && (
                            <div className="keywords">
                              <Text type="secondary">Từ khóa: </Text>
                              {profile.keywords.map((kw, idx) => (
                                <Tag key={idx} className="keyword-tag">{kw}</Tag>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'publications',
                  label: (
                    <span>
                      <BookOutlined />
                      Kết quả NCKH ({profile.publications?.length || 0})
                    </span>
                  ),
                  children: (
                    <div className="tab-content">
                      {profile.publications && profile.publications.length > 0 ? (
                        <ProList<PublicationItem>
                          dataSource={profile.publications.sort((a, b) => (b.year || 0) - (a.year || 0))}
                          rowKey="id"
                          metas={{
                            title: {
                              dataIndex: 'title',
                            },
                            description: {
                              render: (_, record) => (
                                <Space direction="vertical" size={4}>
                                  <Space split="·" wrap size="small">
                                    <Text type="secondary">{record.journalOrConference}</Text>
                                    {record.year && <Text type="secondary">{record.year}</Text>}
                                    {record.volume && <Text type="secondary">Vol. {record.volume}</Text>}
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
                              render: (_, record) =>
                                [
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
                                  record.url && !record.doi && (
                                    <a
                                      key="url"
                                      href={record.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Link
                                    </a>
                                  ),
                                  canViewHoursConversion && (
                                    <Button
                                      key="preview"
                                      type="link"
                                      size="small"
                                      icon={<CalculatorOutlined />}
                                      onClick={() => handlePreviewHours(record)}
                                    >
                                      Xem thử quy đổi giờ
                                    </Button>
                                  ),
                                ].filter(Boolean),
                            },
                          }}
                        />
                      ) : (
                        <Empty description="Chưa có kết quả NCKH nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </div>
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
                    <div className="tab-content">
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
                  key: 'languages',
                  label: (
                    <span>
                      <GlobalOutlined />
                      Ngoại ngữ ({profile.languages?.length || 0})
                    </span>
                  ),
                  children: (
                    <div className="tab-content">
                      {profile.languages && profile.languages.length > 0 ? (
                        <ProList<ProfileLanguage>
                          dataSource={profile.languages}
                          rowKey="id"
                          metas={{
                            title: {
                              dataIndex: 'language',
                            },
                            description: {
                              render: (_, record) => (
                                <Space>
                                  {record.level && <Tag>{record.level}</Tag>}
                                  {record.certificate && <Tag color="blue">{record.certificate}</Tag>}
                                </Space>
                              ),
                            },
                          }}
                        />
                      ) : (
                        <Empty description="Chưa có thông tin ngoại ngữ" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </div>
                  ),
                },
                {
                  key: 'logs',
                  label: (
                    <span>
                      <HistoryOutlined />
                      Lịch sử xác thực
                    </span>
                  ),
                  children: (
                    <div className="tab-content">
                      {verifyLogs.length > 0 ? (
                        <Timeline
                          items={verifyLogs.map((log) => ({
                            color: log.action === 'VERIFY' ? 'green' : log.action === 'REQUEST_MORE_INFO' ? 'orange' : 'gray',
                            children: (
                              <div className="timeline-item">
                                <div className="timeline-header">
                                  <Tag
                                    color={
                                      log.action === 'VERIFY'
                                        ? 'success'
                                        : log.action === 'REQUEST_MORE_INFO'
                                        ? 'warning'
                                        : 'default'
                                    }
                                  >
                                    {log.action === 'VERIFY'
                                      ? 'Xác thực'
                                      : log.action === 'REQUEST_MORE_INFO'
                                      ? 'Yêu cầu bổ sung'
                                      : 'Hủy xác thực'}
                                  </Tag>
                                  <Text type="secondary">
                                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                                  </Text>
                                </div>
                                <div className="timeline-content">
                                  <Text>Bởi: {log.actorName} ({log.actorRole})</Text>
                                  {log.note && (
                                    <div className="timeline-note">
                                      <Text type="secondary">{log.note}</Text>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ),
                          }))}
                        />
                      ) : (
                        <Empty description="Chưa có lịch sử xác thực" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={7}>
          <div className="profile-sidebar">
            {/* Quick stats */}
            <Card className="stats-card" bordered={false}>
              <div className="stat-item">
                <div className="stat-value">{profile.publications?.length || 0}</div>
                <div className="stat-label">Kết quả NCKH</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{profile.linkedProjects?.length || 0}</div>
                <div className="stat-label">Đề tài</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{profile.languages?.length || 0}</div>
                <div className="stat-label">Ngoại ngữ</div>
              </div>
            </Card>

            {/* Verify info */}
            {profile.verifiedAt && (
              <Card className="verify-card" bordered={false}>
                <div className="verify-header">
                  <SafetyCertificateOutlined className="icon" />
                  <span>Đã xác thực</span>
                </div>
                <div className="verify-info">
                  <div>
                    <ClockCircleOutlined /> {new Date(profile.verifiedAt).toLocaleDateString('vi-VN')}
                  </div>
                  {profile.verifiedBy && (
                    <div>
                      <UserOutlined /> {profile.verifiedBy}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Last updated */}
            <div className="last-updated">
              <Text type="secondary">
                Cập nhật: {new Date(profile.updatedAt).toLocaleString('vi-VN')}
              </Text>
            </div>
          </div>
        </Col>
      </Row>

      {/* Verify Drawer */}
      <Drawer
        title={verifyAction === 'verify' ? 'Xác thực hồ sơ' : 'Yêu cầu bổ sung'}
        open={verifyDrawerVisible}
        onClose={() => setVerifyDrawerVisible(false)}
        width={480}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setVerifyDrawerVisible(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleVerifySubmit}
              loading={verifyLoading}
              danger={verifyAction !== 'verify'}
            >
              {verifyAction === 'verify' ? 'Xác thực' : 'Gửi yêu cầu'}
            </Button>
          </Space>
        }
      >
        <div className="verify-drawer-content">
          <div className="profile-summary">
            <Avatar size={48} src={profile.avatarUrl} icon={<UserOutlined />} />
            <div>
              <div className="name">{profile.fullName}</div>
              <div className="info">{profile.faculty}</div>
              <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            </div>
          </div>

          <Form form={verifyForm} layout="vertical">
            <Form.Item
              name="note"
              label={verifyAction === 'verify' ? 'Ghi chú xác thực' : 'Lý do yêu cầu bổ sung'}
              rules={[
                {
                  required: verifyAction !== 'verify',
                  message: 'Vui lòng nhập lý do',
                },
              ]}
            >
              <Input.TextArea
                rows={4}
                placeholder={
                  verifyAction === 'verify'
                    ? 'Nhập ghi chú xác thực (không bắt buộc)...'
                    : 'Nhập lý do yêu cầu bổ sung...'
                }
              />
            </Form.Item>
          </Form>

          {verifyAction === 'verify' && (
            <div className="verify-checklist">
              <div className="checklist-title">Checklist xác thực:</div>
              <ul>
                <li>Kiểm tra thông tin cá nhân</li>
                <li>Xác minh học vị / học hàm</li>
                <li>Kiểm tra bằng cấp đính kèm</li>
                <li>Xác minh các kết quả NCKH</li>
              </ul>
            </div>
          )}
        </div>
      </Drawer>

      {/* Converted Hours Preview Modal */}
      <ConvertedHoursPreviewModal
        open={previewModalVisible}
        publicationId={previewPubId}
        publicationTitle={previewPubTitle}
        onClose={() => setPreviewModalVisible(false)}
      />
    </PageContainer>
  );
};

export default ProfileDetailPage;

