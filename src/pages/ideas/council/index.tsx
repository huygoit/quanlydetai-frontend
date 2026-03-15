/**
 * Hội đồng KH&ĐT - Chấm điểm ý tưởng
 * Theo specs/ideas-council-weighted.md (V2 - CÓ TRỌNG SỐ)
 * 
 * - Quản lý phiên hội đồng (DRAFT → OPEN → CLOSED → PUBLISHED)
 * - Chấm điểm 4 tiêu chí với trọng số: 30% + 30% + 20% + 20%
 * - Điểm có trọng số max = 10, ngưỡng 7.0/10
 */
import { PageContainer, ProTable, ProForm, ProFormText, ProFormDigit, ProFormTextArea, ProFormDatePicker, ProFormSelect, ModalForm } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { 
  Alert, 
  AutoComplete,
  Badge, 
  Button, 
  Card, 
  Col, 
  Drawer, 
  Form,
  message, 
  Modal, 
  Popconfirm,
  Progress, 
  Row, 
  Select,
  Space, 
  Statistic, 
  Table, 
  Tabs,
  Tag, 
  Typography,
  Empty,
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined, 
  FormOutlined,
  LockOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
  TeamOutlined,
  TrophyOutlined,
  UnlockOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { useAccess } from '@umijs/max';
import {
  querySessions,
  getSession,
  createSession,
  openSession,
  closeSession,
  getSessionMembers,
  getAvailableMembers,
  addSessionMember,
  removeSessionMember,
  getSessionIdeas,
  getAvailableIdeas,
  addSessionIdeas,
  removeSessionIdea,
  getScoreSheet,
  saveScoreSheet,
  submitScoreSheet,
  getIdeaAllScores,
  getSessionResults,
  calculateWeightedScore,
  SESSION_STATUS_MAP,
  MEMBER_ROLE_MAP,
  SCORING_CRITERIA,
  MAX_WEIGHTED_SCORE,
  THRESHOLD_SCORE,
  type CouncilSession,
  type CouncilSessionStatus,
  type SessionMember,
  type SessionMemberRole,
  type SessionIdea,
  type IdeaCouncilScore,
  type IdeaCouncilResult,
  type AvailableIdea,
  type AvailableMember,
} from '@/services/api/ideaCouncil';

const { Text, Title } = Typography;

const CouncilPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  
  // Session list state
  const [sessions, setSessions] = useState<CouncilSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // Session detail state
  const [currentSession, setCurrentSession] = useState<CouncilSession | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('ideas');
  
  // Members & Ideas
  const [members, setMembers] = useState<SessionMember[]>([]);
  const [sessionIdeas, setSessionIdeas] = useState<SessionIdea[]>([]);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [addIdeaModalVisible, setAddIdeaModalVisible] = useState(false);
  const [availableIdeas, setAvailableIdeas] = useState<AvailableIdea[]>([]);
  const [selectedIdeaIds, setSelectedIdeaIds] = useState<number[]>([]);
  const [loadingAvailableIdeas, setLoadingAvailableIdeas] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<AvailableMember | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberRole, setMemberRole] = useState<SessionMemberRole>('UY_VIEN');
  
  // Scoring
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<SessionIdea | null>(null);
  const [myScore, setMyScore] = useState<IdeaCouncilScore | null>(null);
  const [formValues, setFormValues] = useState({
    noveltyScore: 0,
    noveltyComment: '',
    feasibilityScore: 0,
    feasibilityComment: '',
    alignmentScore: 0,
    alignmentComment: '',
    authorCapacityScore: 0,
    authorCapacityComment: '',
    generalComment: '',
  });
  const [calculatedWeightedScore, setCalculatedWeightedScore] = useState(0);
  
  // Results
  const [results, setResults] = useState<IdeaCouncilResult[]>([]);
  const [scoringStats, setScoringStats] = useState<any>(null);
  const [allScoresDrawerVisible, setAllScoresDrawerVisible] = useState(false);
  const [ideaScores, setIdeaScores] = useState<IdeaCouncilScore[]>([]);

  // Load sessions
  const loadSessions = async () => {
    setLoading(true);
    const res = await querySessions();
    if (res.success) {
      setSessions(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Recalculate weighted score
  useEffect(() => {
    const weighted = calculateWeightedScore(
      formValues.noveltyScore || 0,
      formValues.feasibilityScore || 0,
      formValues.alignmentScore || 0,
      formValues.authorCapacityScore || 0
    );
    setCalculatedWeightedScore(weighted);
  }, [formValues.noveltyScore, formValues.feasibilityScore, formValues.alignmentScore, formValues.authorCapacityScore]);

  // Load session detail data
  const loadSessionDetail = async (session: CouncilSession) => {
    setCurrentSession(session);
    setDetailDrawerVisible(true);
    
    // Load members
    const membersRes = await getSessionMembers(session.id);
    if (membersRes.success) setMembers(membersRes.data);
    
    // Load ideas
    const ideasRes = await getSessionIdeas(session.id);
    if (ideasRes.success) setSessionIdeas(ideasRes.data);
    
    // Load results if closed
    if (['CLOSED', 'PUBLISHED'].includes(session.status)) {
      const resultsRes = await getSessionResults(session.id);
      if (resultsRes.success) setResults(resultsRes.data);
    }
    
    // Load stats from session detail
    const sessionRes = await getSession(session.id);
    if (sessionRes.success && sessionRes.data) {
      setScoringStats({
        totalIdeas: sessionRes.data.ideaCount,
        memberCount: sessionRes.data.memberCount,
        completionRate: Math.round((sessionRes.data.scoredIdeas || 0) / Math.max(1, sessionRes.data.ideaCount) * 100),
      });
    }
  };

  // Create session
  const handleCreateSession = async (values: any) => {
    const res = await createSession(values);
    if (res.success) {
      message.success('Đã tạo phiên hội đồng mới');
      setCreateModalVisible(false);
      loadSessions();
      return true;
    }
    message.error('Không thể tạo phiên');
    return false;
  };

  // Open session
  const handleOpenSession = async (session: CouncilSession) => {
    if (session.memberCount === 0) {
      message.warning('Phải thêm thành viên trước khi mở phiên');
      return;
    }
    if (session.ideaCount === 0) {
      message.warning('Phải thêm ý tưởng trước khi mở phiên');
      return;
    }
    
    const res = await openSession(session.id);
    if (res.success) {
      message.success('Đã mở phiên - Thành viên có thể bắt đầu chấm điểm');
      loadSessions();
      if (currentSession?.id === session.id) {
        setCurrentSession(res.data);
      }
    } else {
      message.error('Không thể mở phiên');
    }
  };

  // Close session - Tự động áp dụng kết quả
  const handleCloseSession = async (session: CouncilSession) => {
    const res = await closeSession(session.id);
    if (res.success) {
      message.success(
        `Đã khóa phiên và cập nhật trạng thái ý tưởng: ${res.proposedCount} đề xuất đặt hàng, ${res.rejectedCount} không đạt ngưỡng`
      );
      loadSessions();
      if (currentSession?.id === session.id) {
        setCurrentSession(res.data);
        // Load results
        const resultsRes = await getSessionResults(session.id);
        if (resultsRes.success) setResults(resultsRes.data);
      }
    } else {
      message.error('Không thể khóa phiên');
    }
  };

  // Load available members for council
  const loadAvailableMembers = async (keyword?: string) => {
    if (!currentSession) return;
    setLoadingMembers(true);
    try {
      const res = await getAvailableMembers(currentSession.id, keyword);
      if (res?.data) setAvailableMembers(res.data);
      else setAvailableMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Add member
  const handleAddMember = async () => {
    if (!currentSession || !selectedMember) {
      message.warning('Vui lòng chọn thành viên từ danh sách');
      return;
    }
    const unit = selectedMember.unit || selectedMember.department || selectedMember.faculty || selectedMember.organization || undefined;
    const res = await addSessionMember(currentSession.id, {
      memberId: selectedMember.userId,
      memberName: selectedMember.fullName,
      memberEmail: selectedMember.workEmail,
      roleInCouncil: memberRole,
      unit,
    });
    if (res.success) {
      message.success('Đã thêm thành viên');
      const membersRes = await getSessionMembers(currentSession.id);
      if (membersRes.success) setMembers(membersRes.data);
      const sessionRes = await getSession(currentSession.id);
      if (sessionRes.data) setCurrentSession(sessionRes.data);
      setAddMemberModalVisible(false);
      setSelectedMember(null);
      setMemberRole('UY_VIEN');
    } else {
      message.error('Không thể thêm thành viên');
    }
  };

  // Remove member
  const handleRemoveMember = async (member: SessionMember) => {
    if (!currentSession) return;
    const res = await removeSessionMember(currentSession.id, member.id);
    if (res.success) {
      message.success('Đã xóa thành viên');
      const membersRes = await getSessionMembers(currentSession.id);
      if (membersRes.success) setMembers(membersRes.data);
      
      const sessionRes = await getSession(currentSession.id);
      if (sessionRes.data) setCurrentSession(sessionRes.data);
    }
  };

  // Load available ideas (APPROVED_INTERNAL, chưa có trong phiên) - API chuyên dụng
  const loadAvailableIdeas = async () => {
    if (!currentSession) return;
    setLoadingAvailableIdeas(true);
    try {
      const res = await getAvailableIdeas(currentSession.id);
      if (res?.data) {
        setAvailableIdeas(res.data);
        setSelectedIdeaIds([]);
      } else {
        setAvailableIdeas([]);
        setSelectedIdeaIds([]);
      }
    } finally {
      setLoadingAvailableIdeas(false);
    }
  };

  // Add ideas to session (chỉ thêm được APPROVED_INTERNAL)
  const handleAddIdeas = async (selectedIds: (string | number)[]) => {
    if (!currentSession) return;
    const ids = availableIdeas
      .filter(i => selectedIds.includes(i.id) && i.status === 'APPROVED_INTERNAL')
      .map(i => i.id);
    if (ids.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 ý tưởng đã sơ loại (APPROVED_INTERNAL)');
      return;
    }
    const res = await addSessionIdeas(currentSession.id, ids);
    if (res.success) {
      message.success(`Đã thêm ${ids.length} ý tưởng`);
      const ideasRes = await getSessionIdeas(currentSession.id);
      if (ideasRes.success) setSessionIdeas(ideasRes.data);
      
      const sessionRes = await getSession(currentSession.id);
      if (sessionRes.data) setCurrentSession(sessionRes.data);
      
      setAddIdeaModalVisible(false);
    }
  };

  // Remove idea from session
  const handleRemoveIdea = async (idea: SessionIdea) => {
    if (!currentSession) return;
    const res = await removeSessionIdea(currentSession.id, idea.id);
    if (res.success) {
      message.success('Đã xóa ý tưởng');
      const ideasRes = await getSessionIdeas(currentSession.id);
      if (ideasRes.success) setSessionIdeas(ideasRes.data);
      
      const sessionRes = await getSession(currentSession.id);
      if (sessionRes.data) setCurrentSession(sessionRes.data);
    }
  };

  // Open scoring modal
  const handleOpenScoreModal = async (idea: SessionIdea) => {
    if (!currentSession) return;
    
    setCurrentIdea(idea);
    
    // Load existing score
    const res = await getScoreSheet(currentSession.id, idea.ideaId);
    if (res.data) {
      setMyScore(res.data);
      setFormValues({
        noveltyScore: res.data.noveltyScore,
        noveltyComment: res.data.noveltyComment,
        feasibilityScore: res.data.feasibilityScore,
        feasibilityComment: res.data.feasibilityComment,
        alignmentScore: res.data.alignmentScore,
        alignmentComment: res.data.alignmentComment,
        authorCapacityScore: res.data.authorCapacityScore,
        authorCapacityComment: res.data.authorCapacityComment,
        generalComment: res.data.generalComment || '',
      });
    } else {
      setMyScore(null);
      setFormValues({
        noveltyScore: 0,
        noveltyComment: '',
        feasibilityScore: 0,
        feasibilityComment: '',
        alignmentScore: 0,
        alignmentComment: '',
        authorCapacityScore: 0,
        authorCapacityComment: '',
        generalComment: '',
      });
    }
    
    setScoreModalVisible(true);
  };

  // Save score draft
  const handleSaveScore = async () => {
    if (!currentSession || !currentIdea) return;
    
    const res = await saveScoreSheet(currentSession.id, currentIdea.ideaId, formValues);
    
    if (res.success) {
      message.success('Đã lưu nháp');
      setMyScore(res.data);
    } else {
      message.error('Không thể lưu');
    }
  };

  // Submit score
  const handleSubmitScore = async () => {
    if (!currentSession || !currentIdea) return;
    
    // Validate
    if (
      formValues.noveltyScore === 0 ||
      formValues.feasibilityScore === 0 ||
      formValues.alignmentScore === 0 ||
      formValues.authorCapacityScore === 0
    ) {
      message.warning('Vui lòng chấm điểm đầy đủ 4 tiêu chí');
      return;
    }
    
    if (
      !formValues.noveltyComment ||
      !formValues.feasibilityComment ||
      !formValues.alignmentComment ||
      !formValues.authorCapacityComment
    ) {
      message.warning('Vui lòng nhập nhận xét cho từng tiêu chí');
      return;
    }
    
    // Save first
    const saveRes = await saveScoreSheet(currentSession.id, currentIdea.ideaId, formValues);
    
    if (!saveRes.success) {
      message.error('Không thể lưu phiếu');
      return;
    }
    
    // Submit
    const submitRes = await submitScoreSheet(currentSession.id, currentIdea.ideaId);
    if (submitRes.success) {
      message.success('Đã gửi phiếu chấm điểm');
      setScoreModalVisible(false);
      
      // Refresh stats from session detail
      const sessionRes = await getSession(currentSession.id);
      if (sessionRes.success && sessionRes.data) {
        setScoringStats({
          totalIdeas: sessionRes.data.ideaCount,
          memberCount: sessionRes.data.memberCount,
          completionRate: Math.round((sessionRes.data.scoredIdeas || 0) / Math.max(1, sessionRes.data.ideaCount) * 100),
        });
      }
    } else {
      message.error('Không thể gửi phiếu');
    }
  };

  // View all scores for an idea
  const handleViewAllScores = async (idea: SessionIdea) => {
    if (!currentSession) return;
    
    setCurrentIdea(idea);
    const res = await getIdeaAllScores(currentSession.id, idea.ideaId);
    if (res.success) {
      setIdeaScores(res.data);
      setAllScoresDrawerVisible(true);
    }
  };

  // NOTE: Kết quả được tự động áp dụng khi khóa phiên (handleCloseSession)

  // Session columns
  const sessionColumns: ProColumns<CouncilSession>[] = [
    {
      title: 'Mã phiên',
      dataIndex: 'code',
      width: 140,
    },
    {
      title: 'Tên phiên',
      dataIndex: 'title',
      ellipsis: true,
      width: 250,
    },
    {
      title: 'Năm',
      dataIndex: 'year',
      width: 80,
    },
    {
      title: 'Ngày họp',
      dataIndex: 'meetingDate',
      width: 120,
      valueType: 'date',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 120,
      render: (_, record) => {
        const status = SESSION_STATUS_MAP[record.status];
        return <Badge status={status.color as any} text={status.text} />;
      },
    },
    {
      title: 'Ý tưởng',
      dataIndex: 'ideaCount',
      width: 80,
      align: 'center',
    },
    {
      title: 'Thành viên',
      dataIndex: 'memberCount',
      width: 100,
      align: 'center',
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => loadSessionDetail(record)}
          >
            Chi tiết
          </Button>
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Mở phiên chấm điểm?"
              description="Sau khi mở, thành viên có thể bắt đầu chấm điểm."
              onConfirm={() => handleOpenSession(record)}
            >
              <Button type="link" size="small" icon={<UnlockOutlined />} style={{ color: '#52c41a' }}>
                Mở phiên
              </Button>
            </Popconfirm>
          )}
          {record.status === 'OPEN' && (
            <Popconfirm
              title="Khóa phiên chấm điểm?"
              description="Khi khóa, ý tưởng đạt ngưỡng ≥7.0 sẽ tự động chuyển sang 'Đã đề xuất đặt hàng'."
              onConfirm={() => handleCloseSession(record)}
              okText="Khóa"
              cancelText="Hủy"
            >
              <Button type="link" size="small" icon={<LockOutlined />} style={{ color: '#faad14' }}>
                Khóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Member columns
  const memberColumns: ProColumns<SessionMember>[] = [
    { title: 'Họ tên', dataIndex: 'memberName', width: 200 },
    { title: 'Email', dataIndex: 'memberEmail', width: 200 },
    { title: 'Đơn vị', dataIndex: 'unit', width: 150 },
    {
      title: 'Vai trò',
      dataIndex: 'roleInCouncil',
      width: 120,
      render: (_, record) => {
        const role = MEMBER_ROLE_MAP[record.roleInCouncil];
        return <Tag color={role.color}>{role.text}</Tag>;
      },
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 100,
      render: (_, record) => (
        currentSession?.status === 'DRAFT' && (
          <Popconfirm title="Xóa thành viên này?" onConfirm={() => handleRemoveMember(record)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        )
      ),
    },
  ];

  // Idea columns (in session)
  const ideaColumns: ProColumns<SessionIdea>[] = [
    { title: 'Mã', dataIndex: 'ideaCode', width: 130 },
    { title: 'Tiêu đề', dataIndex: 'ideaTitle', ellipsis: true, width: 250 },
    { title: 'Tác giả', dataIndex: 'ownerName', width: 150 },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 140 },
    { title: 'Lĩnh vực', dataIndex: 'field', width: 130 },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 200,
      render: (_, record) => (
        <Space>
          {currentSession?.status === 'OPEN' && (
            <Button
              type="primary"
              size="small"
              icon={<FormOutlined />}
              onClick={() => handleOpenScoreModal(record)}
            >
              Chấm điểm
            </Button>
          )}
          {['CLOSED', 'PUBLISHED'].includes(currentSession?.status || '') && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewAllScores(record)}
            >
              Xem phiếu
            </Button>
          )}
          {currentSession?.status === 'DRAFT' && (
            <Popconfirm title="Xóa ý tưởng này?" onConfirm={() => handleRemoveIdea(record)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Result columns
  const resultColumns: ProColumns<IdeaCouncilResult>[] = [
    { title: 'Mã', dataIndex: 'ideaCode', width: 130 },
    { title: 'Tiêu đề', dataIndex: 'ideaTitle', ellipsis: true, width: 200 },
    {
      title: 'Điểm TB (trọng số)',
      dataIndex: 'avgWeightedScore',
      width: 140,
      align: 'center',
      render: (_, record) => (
        <Tag color={record.avgWeightedScore >= THRESHOLD_SCORE ? 'success' : 'warning'}>
          {record.avgWeightedScore.toFixed(2)}/{MAX_WEIGHTED_SCORE}
        </Tag>
      ),
    },
    { title: 'Tính mới (30%)', dataIndex: 'avgNoveltyScore', width: 100, align: 'center', render: (v) => (v as number).toFixed(1) },
    { title: 'Khả thi (30%)', dataIndex: 'avgFeasibilityScore', width: 100, align: 'center', render: (v) => (v as number).toFixed(1) },
    { title: 'Phù hợp (20%)', dataIndex: 'avgAlignmentScore', width: 100, align: 'center', render: (v) => (v as number).toFixed(1) },
    { title: 'Năng lực (20%)', dataIndex: 'avgAuthorCapacityScore', width: 100, align: 'center', render: (v) => (v as number).toFixed(1) },
    {
      title: 'Số phiếu',
      width: 90,
      align: 'center',
      render: (_, record) => `${record.submittedCount}/${record.memberCount}`,
    },
    {
      title: 'Kết luận',
      dataIndex: 'recommendation',
      width: 150,
      render: (_, record) => (
        record.recommendation === 'PROPOSE_ORDER' ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Đề xuất đặt hàng</Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>Không đề xuất</Tag>
        )
      ),
    },
  ];

  // Render criteria input - Compact PRO (không scroll)
  const renderCriteriaInputCompact = (key: string, name: string, description: string, weight: number) => (
    <Card 
      size="small" 
      style={{ marginBottom: 12 }}
      title={
        <Space>
          <Text strong style={{ fontSize: 14 }}>{name}</Text>
          <Tag color="blue" style={{ marginLeft: 4 }}>{(weight * 100).toFixed(0)}%</Tag>
        </Space>
      }
      extra={
        <Text type="secondary" style={{ fontSize: 13 }}>{description}</Text>
      }
      bodyStyle={{ padding: '10px 12px' }}
    >
      <Row gutter={12} align="top">
        <Col span={5}>
          <ProFormDigit
            name={`${key}Score`}
            min={0}
            max={10}
            fieldProps={{
              precision: 0,
              style: { width: '100%' },
              onChange: (val) => setFormValues(prev => ({ ...prev, [`${key}Score`]: val || 0 })),
            }}
            rules={[{ required: true, message: 'Bắt buộc' }]}
            formItemProps={{ style: { marginBottom: 0 } }}
          />
        </Col>
        <Col span={19}>
          <ProFormTextArea
            name={`${key}Comment`}
            placeholder="Nhận xét ngắn gọn..."
            rules={[{ required: true, message: 'Nhập nhận xét' }]}
            fieldProps={{
              rows: 2,
              maxLength: 500,
              onChange: (e) => setFormValues(prev => ({ ...prev, [`${key}Comment`]: e.target.value })),
            }}
            formItemProps={{ style: { marginBottom: 0 } }}
          />
        </Col>
      </Row>
    </Card>
  );

  // Check form validity for submit button
  const isFormValid = () => {
    return SCORING_CRITERIA.every(c => {
      const score = formValues[`${c.key}Score` as keyof typeof formValues];
      const comment = formValues[`${c.key}Comment` as keyof typeof formValues];
      return score !== undefined && score !== null && comment && String(comment).trim().length > 0;
    });
  };

  return (
    <PageContainer>
      {/* Session List */}
      <ProTable<CouncilSession>
        headerTitle="Phiên hội đồng chấm điểm ý tưởng"
        actionRef={actionRef}
        rowKey="id"
        columns={sessionColumns}
        dataSource={sessions}
        loading={loading}
        search={false}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Tạo phiên mới
          </Button>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      {/* Create Session Modal */}
      <ModalForm
        title="Tạo phiên hội đồng mới"
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreateSession}
        modalProps={{ destroyOnClose: true }}
        width={500}
      >
        <ProFormText
          name="title"
          label="Tên phiên"
          placeholder="VD: Hội đồng chấm ý tưởng đợt 1/2024"
          rules={[{ required: true }]}
        />
        <ProFormDigit
          name="year"
          label="Năm"
          initialValue={new Date().getFullYear()}
          rules={[{ required: true }]}
        />
        <ProFormDatePicker name="meetingDate" label="Ngày họp dự kiến" />
        <ProFormText name="location" label="Địa điểm" />
        <ProFormTextArea name="note" label="Ghi chú" />
      </ModalForm>

      {/* Session Detail Drawer */}
      <Drawer
        title={`Chi tiết phiên: ${currentSession?.code}`}
        width={1000}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        extra={
          <Space>
            {currentSession?.status === 'DRAFT' && (
              <Button type="primary" icon={<UnlockOutlined />} onClick={() => handleOpenSession(currentSession)}>
                Mở phiên
              </Button>
            )}
            {currentSession?.status === 'OPEN' && (
              <Popconfirm
                title="Khóa phiên chấm điểm?"
                description="Khi khóa, ý tưởng đạt ngưỡng ≥7.0 sẽ tự động chuyển sang 'Đã đề xuất đặt hàng' để Lãnh đạo phê duyệt."
                onConfirm={() => handleCloseSession(currentSession)}
                okText="Khóa phiên"
                cancelText="Hủy"
              >
                <Button icon={<LockOutlined />}>
                  Khóa phiên
                </Button>
              </Popconfirm>
            )}
            {/* NOTE: Kết quả được tự động áp dụng khi khóa phiên */}
          </Space>
        }
      >
        {currentSession && (
          <>
            {/* Session info */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="Trạng thái" value={SESSION_STATUS_MAP[currentSession.status].text} />
                </Col>
                <Col span={6}>
                  <Statistic title="Số ý tưởng" value={currentSession.ideaCount} />
                </Col>
                <Col span={6}>
                  <Statistic title="Thành viên" value={currentSession.memberCount} />
                </Col>
                <Col span={6}>
                  {scoringStats && (
                    <Statistic
                      title="Tiến độ chấm"
                      value={scoringStats.completionRate}
                      suffix="%"
                      valueStyle={{ color: scoringStats.completionRate === 100 ? '#52c41a' : '#faad14' }}
                    />
                  )}
                </Col>
              </Row>
            </Card>

            {/* Tabs */}
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <Tabs.TabPane tab="Ý tưởng" key="ideas">
                <ProTable<SessionIdea>
                  headerTitle={false}
                  rowKey="id"
                  columns={ideaColumns}
                  dataSource={sessionIdeas}
                  search={false}
                  pagination={false}
                  toolBarRender={() => 
                    currentSession.status === 'DRAFT' ? [
                      <Button
                        key="add"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={async () => {
                          setAddIdeaModalVisible(true);
                          await loadAvailableIdeas();
                        }}
                      >
                        Thêm ý tưởng
                      </Button>,
                    ] : []
                  }
                />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Thành viên" key="members">
                <ProTable<SessionMember>
                  headerTitle={false}
                  rowKey="id"
                  columns={memberColumns}
                  dataSource={members}
                  search={false}
                  pagination={false}
                  toolBarRender={() =>
                    currentSession.status === 'DRAFT' ? [
                      <Button
                        key="add"
                        type="primary"
                        icon={<UserAddOutlined />}
                        onClick={() => {
                          setAddMemberModalVisible(true);
                          setSelectedMember(null);
                          loadAvailableMembers();
                        }}
                      >
                        Thêm thành viên
                      </Button>,
                    ] : []
                  }
                />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Kết quả" key="results" disabled={!['CLOSED', 'PUBLISHED'].includes(currentSession.status)}>
                {results.length > 0 ? (
                  <>
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message={`Ngưỡng đề xuất đặt hàng: ${THRESHOLD_SCORE}/${MAX_WEIGHTED_SCORE} điểm (có trọng số)`}
                    />
                    <ProTable<IdeaCouncilResult>
                      headerTitle={false}
                      rowKey="ideaId"
                      columns={resultColumns}
                      dataSource={results}
                      search={false}
                      pagination={false}
                    />
                  </>
                ) : (
                  <Empty description="Chưa có kết quả" />
                )}
              </Tabs.TabPane>
            </Tabs>
          </>
        )}
      </Drawer>

      {/* Add Member Modal - Chọn từ danh sách hồ sơ khoa học */}
      <Modal
        title="Thêm thành viên hội đồng"
        open={addMemberModalVisible}
        onCancel={() => {
          setAddMemberModalVisible(false);
          setSelectedMember(null);
          setMemberRole('UY_VIEN');
        }}
        onOk={handleAddMember}
        okText="Thêm thành viên"
        cancelText="Hủy"
        destroyOnClose
        width={560}
        okButtonProps={{ disabled: !selectedMember }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tìm và chọn từ danh sách hồ sơ khoa học (đã có trong hệ thống)
          </Text>
        </div>

        <AutoComplete
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Gõ tên, email hoặc đơn vị để tìm kiếm..."
          options={availableMembers.map((m) => ({
            value: String(m.userId),
            label: (
              <div style={{ padding: '4px 0' }}>
                <div style={{ fontWeight: 500 }}>
                  {m.academicTitle && `${m.academicTitle}. `}
                  {m.degree && `${m.degree} `}
                  {m.fullName}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {[m.department, m.faculty, m.organization].filter(Boolean).join(' · ') || m.workEmail}
                </div>
              </div>
            ),
          }))}
          onSelect={(val) => {
            const m = availableMembers.find((x) => String(x.userId) === val);
            if (m) setSelectedMember(m);
          }}
          onSearch={(v) => {
            if (!v.trim()) loadAvailableMembers();
            else loadAvailableMembers(v);
          }}
          onFocus={() => !availableMembers.length && loadAvailableMembers()}
          loading={loadingMembers}
          notFoundContent={loadingMembers ? 'Đang tải...' : 'Không tìm thấy. Thử từ khóa khác.'}
          filterOption={false}
        />

        {selectedMember && (
          <Card
            size="small"
            style={{
              marginBottom: 16,
              background: 'linear-gradient(135deg, #f8f9fc 0%, #eef1f7 100%)',
              border: '1px solid #e8ecf4',
              borderRadius: 8,
            }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {selectedMember.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: '#1a1a1a' }}>
                  {selectedMember.academicTitle && (
                    <Tag color="blue" style={{ marginRight: 6 }}>
                      {selectedMember.academicTitle}
                    </Tag>
                  )}
                  {selectedMember.degree && (
                    <Tag color="cyan" style={{ marginRight: 6 }}>
                      {selectedMember.degree}
                    </Tag>
                  )}
                  {selectedMember.fullName}
                </div>
                {selectedMember.currentTitle && (
                  <div style={{ fontSize: 13, color: '#595959', marginBottom: 2 }}>{selectedMember.currentTitle}</div>
                )}
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {[selectedMember.department, selectedMember.faculty, selectedMember.organization]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </div>
                {selectedMember.workEmail && (
                  <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>📧 {selectedMember.workEmail}</div>
                )}
                {selectedMember.mainResearchArea && (
                  <div style={{ fontSize: 11, color: '#bfbfbf', marginTop: 4, fontStyle: 'italic' }}>
                    {selectedMember.mainResearchArea}
                  </div>
                )}
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, marginTop: 4, fontSize: 12 }}
                  onClick={() => setSelectedMember(null)}
                >
                  Chọn lại
                </Button>
              </div>
            </div>
          </Card>
        )}

        {selectedMember && (
          <Form layout="vertical" style={{ marginTop: 16 }}>
            <Form.Item label="Vai trò trong hội đồng" required>
              <Select
                value={memberRole}
                onChange={setMemberRole}
                options={[
                  { label: 'Chủ tịch HĐ', value: 'CHU_TICH' },
                  { label: 'Thư ký', value: 'THU_KY' },
                  { label: 'Phản biện', value: 'PHAN_BIEN' },
                  { label: 'Ủy viên', value: 'UY_VIEN' },
                ]}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Add Ideas Modal */}
      <Modal
        title="Thêm ý tưởng vào phiên"
        open={addIdeaModalVisible}
        onCancel={() => {
          setAddIdeaModalVisible(false);
          setSelectedIdeaIds([]);
        }}
        footer={null}
        width={700}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Chỉ ý tưởng đã sơ loại (Đã sơ loại) mới thêm được. Ý tưởng đang sơ loại cần duyệt xong tại trang Sơ loại ý tưởng."
        />
        {loadingAvailableIdeas ? (
          <div style={{ padding: 24, textAlign: 'center' }}>Đang tải danh sách ý tưởng...</div>
        ) : availableIdeas.length > 0 ? (
          <Table<AvailableIdea>
            rowKey="id"
            dataSource={availableIdeas}
            pagination={false}
            size="small"
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedIdeaIds,
              onChange: (keys) => setSelectedIdeaIds(keys as number[]),
              getCheckboxProps: (record) => ({
                disabled: record.status !== 'APPROVED_INTERNAL',
              }),
            }}
            columns={[
              { title: 'Mã', dataIndex: 'code', width: 110 },
              { title: 'Tiêu đề', dataIndex: 'title', ellipsis: true },
              { title: 'Tác giả', dataIndex: 'ownerName', width: 130 },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                width: 120,
                render: (s: string) =>
                  s === 'APPROVED_INTERNAL' ? (
                    <Tag color="success">Đã sơ loại</Tag>
                  ) : (
                    <Tag color="warning">Đang sơ loại</Tag>
                  ),
              },
            ]}
            footer={() => {
              const addableCount = availableIdeas.filter(i => i.status === 'APPROVED_INTERNAL').length;
              return (
                <Space>
                  <Button
                    type="primary"
                    disabled={selectedIdeaIds.length === 0}
                    onClick={() => handleAddIdeas(selectedIdeaIds)}
                  >
                    Thêm đã chọn ({selectedIdeaIds.filter(id => availableIdeas.find(i => i.id === id)?.status === 'APPROVED_INTERNAL').length})
                  </Button>
                  <Button
                    disabled={addableCount === 0}
                    onClick={() => handleAddIdeas(availableIdeas.filter(i => i.status === 'APPROVED_INTERNAL').map(i => i.id))}
                  >
                    Thêm tất cả đã sơ loại ({addableCount})
                  </Button>
                </Space>
              );
            }}
          />
        ) : (
          <Empty description="Không có ý tưởng nào (đã sơ loại hoặc đang sơ loại). Tạo ý tưởng và duyệt tại trang Sơ loại ý tưởng." />
        )}
      </Modal>

      {/* Scoring Modal - PRO Layout 2 cột NO-SCROLL */}
      <Modal
        title={null}
        open={scoreModalVisible}
        onCancel={() => setScoreModalVisible(false)}
        width={1100}
        style={{ top: 32 }}
        bodyStyle={{ padding: 16, maxHeight: '80vh', overflow: 'auto' }}
        footer={null}
        destroyOnClose
      >
        {currentIdea && (
          <>
            {/* Header compact */}
            <div style={{ marginBottom: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
              <Space>
                <Tag color="blue" style={{ fontSize: 13 }}>{currentIdea.ideaCode}</Tag>
                <Text strong style={{ fontSize: 16 }}>{currentIdea.ideaTitle}</Text>
              </Space>
              <div style={{ marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 14 }}>
                  {currentIdea.ownerName} · {currentIdea.ownerUnit} · {currentIdea.field}
                </Text>
              </div>
            </div>

            {myScore?.submitted && (
              <Alert
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
                style={{ marginBottom: 12 }}
                message={`Phiếu đã gửi lúc ${new Date(myScore.submittedAt!).toLocaleString('vi-VN')}`}
              />
            )}

            {/* Layout 2 cột */}
            <Row gutter={16}>
              {/* Cột trái: 4 tiêu chí */}
              <Col span={16}>
                <ProForm submitter={false} initialValues={formValues} disabled={myScore?.submitted}>
                  {SCORING_CRITERIA.map(c => renderCriteriaInputCompact(c.key, c.name, c.description, c.weight))}
                  
                  {/* Nhận xét chung - compact */}
                  <Card size="small" bodyStyle={{ padding: '10px 12px' }}>
                    <ProFormTextArea
                      name="generalComment"
                      label={<Text type="secondary" style={{ fontSize: 13 }}>Nhận xét chung (không bắt buộc)</Text>}
                      placeholder="Nhận xét tổng quan..."
                      fieldProps={{
                        rows: 2,
                        maxLength: 500,
                        onChange: (e) => setFormValues(prev => ({ ...prev, generalComment: e.target.value })),
                      }}
                      formItemProps={{ style: { marginBottom: 0 } }}
                    />
                  </Card>
                </ProForm>
              </Col>

              {/* Cột phải: Summary sticky */}
              <Col span={8}>
                <div style={{ position: 'sticky', top: 0 }}>
                  <Card 
                    size="small" 
                    style={{ background: calculatedWeightedScore >= THRESHOLD_SCORE ? '#f6ffed' : '#fffbe6' }}
                  >
                    {/* Điểm tổng */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: '#595959', marginBottom: 6, fontWeight: 500 }}>ĐIỂM CÓ TRỌNG SỐ</div>
                      <div style={{ 
                        fontSize: 40, 
                        fontWeight: 'bold',
                        color: calculatedWeightedScore >= THRESHOLD_SCORE ? '#52c41a' : '#faad14',
                      }}>
                        {calculatedWeightedScore.toFixed(2)}
                        <span style={{ fontSize: 18, color: '#8c8c8c' }}> / {MAX_WEIGHTED_SCORE}</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <Progress
                      percent={(calculatedWeightedScore / MAX_WEIGHTED_SCORE) * 100}
                      strokeColor={calculatedWeightedScore >= THRESHOLD_SCORE ? '#52c41a' : '#faad14'}
                      showInfo={false}
                      style={{ marginBottom: 12 }}
                    />

                    {/* Ngưỡng & Kết luận */}
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <Text type="secondary" style={{ fontSize: 13 }}>Ngưỡng: ≥ {THRESHOLD_SCORE}</Text>
                      <div style={{ marginTop: 6 }}>
                        {calculatedWeightedScore >= THRESHOLD_SCORE ? (
                          <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>ĐỀ XUẤT ĐẶT HÀNG</Tag>
                        ) : (
                          <Tag color="warning" icon={<ExclamationCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>CHƯA ĐẠT NGƯỠNG</Tag>
                        )}
                      </div>
                    </div>

                    {/* Checklist valid */}
                    <div style={{ background: '#fff', borderRadius: 6, padding: 12, marginBottom: 16 }}>
                      <div style={{ fontSize: 13, color: '#595959', marginBottom: 8, fontWeight: 500 }}>Kiểm tra</div>
                      {SCORING_CRITERIA.map(c => {
                        const score = formValues[`${c.key}Score` as keyof typeof formValues];
                        const comment = formValues[`${c.key}Comment` as keyof typeof formValues];
                        const hasScore = score !== undefined && score !== null;
                        const hasComment = comment && String(comment).trim().length > 0;
                        return (
                          <div key={c.key} style={{ fontSize: 13, marginBottom: 4 }}>
                            {hasScore && hasComment ? (
                              <Text type="success"><CheckCircleOutlined /> {c.name}</Text>
                            ) : (
                              <Text type="secondary"><CloseCircleOutlined /> {c.name}</Text>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    {!myScore?.submitted && (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button block onClick={handleSaveScore}>
                          <SaveOutlined /> Lưu tạm
                        </Button>
                        <Popconfirm
                          title="Xác nhận gửi phiếu"
                          description="Sau khi gửi sẽ không sửa được. Bạn chắc chắn?"
                          onConfirm={handleSubmitScore}
                          okText="Gửi"
                          cancelText="Hủy"
                          disabled={!isFormValid()}
                        >
                          <Button 
                            type="primary" 
                            block 
                            icon={<SendOutlined />}
                            disabled={!isFormValid()}
                          >
                            Gửi phiếu chấm
                          </Button>
                        </Popconfirm>
                        {!isFormValid() && (
                          <Text type="warning" style={{ fontSize: 13, display: 'block', textAlign: 'center', marginTop: 8 }}>
                            <ExclamationCircleOutlined /> Điền đủ điểm & nhận xét để gửi
                          </Text>
                        )}
                      </Space>
                    )}

                    {myScore?.submitted && (
                      <Button block onClick={() => setScoreModalVisible(false)}>
                        Đóng
                      </Button>
                    )}
                  </Card>
                </div>
              </Col>
            </Row>
          </>
        )}
      </Modal>

      {/* All Scores Drawer */}
      <Drawer
        title={`Phiếu chấm: ${currentIdea?.ideaCode}`}
        width={700}
        open={allScoresDrawerVisible}
        onClose={() => setAllScoresDrawerVisible(false)}
      >
        <Table
          dataSource={ideaScores}
          rowKey="id"
          pagination={false}
          size="small"
          columns={[
            {
              title: 'Thành viên',
              dataIndex: 'councilMemberName',
              width: 200,
              render: (name, record) => (
                <Space>
                  <Text>{name}</Text>
                  <Tag color={MEMBER_ROLE_MAP[record.councilRole].color}>
                    {MEMBER_ROLE_MAP[record.councilRole].text}
                  </Tag>
                </Space>
              ),
            },
            { title: 'Tính mới (30%)', dataIndex: 'noveltyScore', width: 100, align: 'center' },
            { title: 'Khả thi (30%)', dataIndex: 'feasibilityScore', width: 100, align: 'center' },
            { title: 'Phù hợp (20%)', dataIndex: 'alignmentScore', width: 100, align: 'center' },
            { title: 'Năng lực (20%)', dataIndex: 'authorCapacityScore', width: 100, align: 'center' },
            {
              title: 'Điểm TT',
              dataIndex: 'weightedScore',
              width: 100,
              align: 'center',
              render: (score) => (
                <Tag color={score >= THRESHOLD_SCORE ? 'success' : 'warning'}>{score?.toFixed(2)}</Tag>
              ),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'submitted',
              width: 100,
              render: (submitted) =>
                submitted ? <Badge status="success" text="Đã gửi" /> : <Badge status="processing" text="Nháp" />,
            },
          ]}
        />
      </Drawer>
    </PageContainer>
  );
};

export default CouncilPage;

