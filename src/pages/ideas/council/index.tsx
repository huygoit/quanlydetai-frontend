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
import { coHienThiHocHam, nhanNhanHocHam, nhanNhanHocVi } from '@/utils/profileCatalogOptions';
import PhieuChamModal, { donViHienThi, TheKetQuaChung, tinhKetQuaChung } from './PhieuChamModal';
import { history, useAccess, useLocation, useModel } from '@umijs/max';

/** Học hàm NONE là "không có học hàm" — không gắn trước tên. */
function nhanHocHamHienThi(code?: string | null): string {
  if (!coHienThiHocHam(code)) return '';
  return nhanNhanHocHam([], code) || '';
}

function nhanHocViHienThi(code?: string | null): string {
  return nhanNhanHocVi([], code) || '';
}

/** Chữ trong ô tìm sau khi chọn — chỉ họ tên, học hàm/học vị nằm badge trong danh sách. */
function tenOTimThanhVien(m: { fullName?: string | null }): string {
  return (m.fullName || '').trim();
}

/** Phần tiếng Việt trong ngoặc của tên trường song ngữ. */
function tenTruongHienThi(organization?: string | null): string {
  const raw = organization?.trim() ?? '';
  if (!raw) return '';
  const khop = raw.match(/\(([^)]+)\)\s*$/);
  return (khop?.[1] ?? raw).trim();
}

/** Tên đơn vị từ danh mục, kèm tên trường. Bỏ chuỗi đơn vị cũ và tên tiếng Anh. */
function donViThanhVien(m: {
  unit?: string | null;
  faculty?: string | null;
  organization?: string | null;
}): string {
  const tuApi = m.unit?.trim() ?? '';
  const laChuoiCu = tuApi.includes('University of') || tuApi.includes(' – ');
  const truong = tenTruongHienThi(m.organization);
  if (tuApi && !laChuoiCu) {
    if (truong && !tuApi.includes(truong)) return `${tuApi}, ${truong}`;
    return tuApi;
  }
  const donVi = m.faculty?.trim() || '';
  return [donVi, truong && !donVi.includes(truong) ? truong : ''].filter(Boolean).join(', ');
}
import {
  querySessions,
  getSession,
  getSessionStats,
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
  const location = useLocation();
  const { initialState } = useModel('@@initialState');
  const maNguoiDung = Number(initialState?.currentUser?.id);
  const laNguoiTaoPhien = (session: CouncilSession) =>
    Number.isFinite(maNguoiDung) && maNguoiDung > 0 && maNguoiDung === Number(session.createdById);
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
  const [tuKhoaThanhVien, setTuKhoaThanhVien] = useState('');
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
  const [phieuDangXem, setPhieuDangXem] = useState<IdeaCouncilScore | null>(null);

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

  // Recalculate weighted score khi đổi điểm thành phần (binding với form bên trái)
  useEffect(() => {
    const weighted = calculateWeightedScore({
      novelty: Number(formValues.noveltyScore) || 0,
      feasibility: Number(formValues.feasibilityScore) || 0,
      alignment: Number(formValues.alignmentScore) || 0,
      authorCapacity: Number(formValues.authorCapacityScore) || 0,
    });
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
    
    if (session.status !== 'DRAFT') {
      const resultsRes = await getSessionResults(session.id);
      if (resultsRes.success) setResults(resultsRes.data ?? []);
    } else {
      setResults([]);
    }
    
    // Load stats từ API stats (tính theo số phiếu chấm đã submit)
    const statsRes = await getSessionStats(session.id);
    if (statsRes.success && statsRes.data) {
      setScoringStats({
        totalIdeas: statsRes.data.totalIdeas,
        memberCount: statsRes.data.totalMembers,
        completionRate: statsRes.data.completionRate,
      });
    }
  };

  // Thông báo mở phiên dẫn về danh sách, rồi tự mở Chi tiết đúng phiên.
  useEffect(() => {
    const phienId = Number(new URLSearchParams(location.search).get('phien'));
    if (!Number.isFinite(phienId) || phienId <= 0) return;
    let daHuy = false;
    (async () => {
      try {
        const res = await getSession(phienId);
        if (!daHuy && res?.success && res.data) {
          await loadSessionDetail(res.data);
        }
      } catch {
        if (!daHuy) message.warning('Không mở được phiên từ thông báo.');
      } finally {
        if (!daHuy) history.replace('/ideas/council');
      }
    })();
    return () => {
      daHuy = true;
    };
  }, [location.search]);

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
    let res;
    try {
      res = await closeSession(session.id);
    } catch {
      return;
    }
    if (res.success) {
      const deXuat = res.data?.proposedCount ?? 0;
      const khongDat = res.data?.rejectedCount ?? 0;
      message.success(
        `Đã khóa phiên và cập nhật trạng thái ý tưởng: ${deXuat} đề xuất đặt hàng, ${khongDat} không đạt ngưỡng`
      );
      loadSessions();
      if (currentSession?.id === session.id) {
        const sessionRes = await getSession(session.id);
        if (sessionRes.success && sessionRes.data) setCurrentSession(sessionRes.data);
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
    const unit = donViThanhVien(selectedMember) || undefined;
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
      setTuKhoaThanhVien('');
      setMemberRole('UY_VIEN');
    } else {
      message.error('Không thể thêm thành viên');
    }
  };

  // Remove member
  const handleRemoveMember = async (member: SessionMember) => {
    if (!currentSession) return;
    // API xóa theo member_id (user), không phải id dòng trong bảng phiên.
    const res = await removeSessionMember(currentSession.id, member.memberId);
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
      const ideasRes = await getSessionIdeas(currentSession.id);
      if (ideasRes.success) setSessionIdeas(ideasRes.data);
      const resultsRes = await getSessionResults(currentSession.id);
      if (resultsRes.success) setResults(resultsRes.data ?? []);

      // Refresh stats từ API stats
      const statsRes = await getSessionStats(currentSession.id);
      if (statsRes.success && statsRes.data) {
        setScoringStats({
          totalIdeas: statsRes.data.totalIdeas,
          memberCount: statsRes.data.totalMembers,
          completionRate: statsRes.data.completionRate,
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
    if (!res.success) return;
    const ds = res.data ?? [];
    setIdeaScores(ds);
    if (ds.length === 0) {
      message.info('Chưa có phiếu đã gửi.');
      return;
    }
    setAllScoresDrawerVisible(true);
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
          {record.status === 'OPEN' && laNguoiTaoPhien(record) && (
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

  const xuongDong = {
    ellipsis: false as const,
    onCell: () => ({ style: { whiteSpace: 'normal' as const, wordBreak: 'break-word' as const } }),
  };

  const memberColumns: ProColumns<SessionMember>[] = [
    { title: 'Họ tên', dataIndex: 'memberName', width: 180, ...xuongDong },
    { title: 'Email', dataIndex: 'memberEmail', width: 210, ...xuongDong },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      width: 260,
      ...xuongDong,
      render: (_, record) => donViHienThi(record.unit),
    },
    {
      title: 'Vai trò',
      dataIndex: 'roleInCouncil',
      width: 120,
      render: (_, record) => {
        const role = MEMBER_ROLE_MAP[record.roleInCouncil];
        return <Tag color={role?.color}>{role?.text || record.roleInCouncil}</Tag>;
      },
    },
    ...(currentSession?.status === 'DRAFT'
      ? [{
          title: 'Hành động',
          valueType: 'option' as const,
          width: 90,
          render: (_: unknown, record: SessionMember) => (
            <Popconfirm title="Xóa thành viên này?" onConfirm={() => handleRemoveMember(record)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          ),
        }]
      : []),
  ];

  // Idea columns (in session)
  const ideaColumns: ProColumns<SessionIdea>[] = [
    { title: 'Mã', dataIndex: 'ideaCode', width: 118, ...xuongDong },
    { title: 'Tiêu đề', dataIndex: 'ideaTitle', width: 160, ...xuongDong },
    { title: 'Tác giả', dataIndex: 'ownerName', width: 120, ...xuongDong },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 150, ...xuongDong },
    { title: 'Lĩnh vực', dataIndex: 'field', width: 120, ...xuongDong },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 130,
      render: (_, record) => (
        <Space>
          {currentSession?.status === 'OPEN' &&
            access.canScoreIdea &&
            members.some((m) => Number(m.memberId) === maNguoiDung) && (
            <Button
              type="primary"
              size="small"
              icon={<FormOutlined />}
              onClick={() => handleOpenScoreModal(record)}
            >
              Chấm điểm
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

  // Result columns — cùng lề với tab Ý tưởng, giữ đủ cột điểm.
  const resultColumns: ProColumns<IdeaCouncilResult>[] = [
    { title: 'Mã', dataIndex: 'ideaCode', width: 100, ...xuongDong },
    { title: 'Tiêu đề', dataIndex: 'ideaTitle', width: 120, ...xuongDong },
    {
      title: 'Điểm TB',
      dataIndex: 'avgWeightedScore',
      width: 88,
      align: 'center',
      render: (_, record) => (
        <Tag
          color={Number(record.avgWeightedScore) >= THRESHOLD_SCORE ? 'success' : 'warning'}
          style={{ margin: 0 }}
        >
          {Number(record.avgWeightedScore).toFixed(2)}/{MAX_WEIGHTED_SCORE}
        </Tag>
      ),
    },
    {
      title: 'Tính mới (30%)',
      dataIndex: 'avgNoveltyScore',
      width: 72,
      align: 'center',
      onHeaderCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
      render: (v) => (v == null ? '—' : Number(v).toFixed(1)),
    },
    {
      title: 'Khả thi (30%)',
      dataIndex: 'avgFeasibilityScore',
      width: 72,
      align: 'center',
      onHeaderCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
      render: (v) => (v == null ? '—' : Number(v).toFixed(1)),
    },
    {
      title: 'Phù hợp (20%)',
      dataIndex: 'avgAlignmentScore',
      width: 72,
      align: 'center',
      onHeaderCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
      render: (v) => (v == null ? '—' : Number(v).toFixed(1)),
    },
    {
      title: 'Năng lực (20%)',
      dataIndex: 'avgAuthorCapacityScore',
      width: 72,
      align: 'center',
      onHeaderCell: () => ({ style: { whiteSpace: 'normal', wordBreak: 'break-word' } }),
      render: (v) => (v == null ? '—' : Number(v).toFixed(1)),
    },
    {
      title: 'Số phiếu',
      width: 148,
      align: 'center',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            const yTuong = sessionIdeas.find((muc) => Number(muc.ideaId) === Number(record.ideaId));
            if (yTuong) handleViewAllScores(yTuong);
          }}
        >
          {`Xem phiếu (${record.submittedCount}/${record.memberCount})`}
        </Button>
      ),
    },
    {
      title: 'Kết luận',
      dataIndex: 'recommendation',
      width: 168,
      ...xuongDong,
      render: (_, record) => {
        if (!record.submittedCount) return '—';
        return (
          <Space direction="vertical" size={6} align="start">
            {record.recommendation === 'PROPOSE_ORDER' ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>Đề xuất đặt hàng</Tag>
            ) : (
              <Tag color="error" icon={<CloseCircleOutlined />}>Không đề xuất</Tag>
            )}
            {record.linkedProposalId ? (
              <Button
                size="small"
                type="primary"
                onClick={() => history.push(`/projects/register/form/${record.linkedProposalId}`)}
              >
                Xem đề xuất đề tài
              </Button>
            ) : null}
          </Space>
        );
      },
    },
  ];

  const mauNenTieuChi = ['#e6f4ff', '#f6ffed', '#fff7e6', '#f9f0ff'];

  // Một nhãn: tên tiêu chí + mô tả và trọng số in nghiêng. Ô điểm và ô nhận xét cùng một hàng.
  const renderCriteriaInputCompact = (key: string, name: string, description: string, weight: number, thuTu: number) => (
    <div
      style={{
        marginBottom: 12,
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: mauNenTieuChi[thuTu % mauNenTieuChi.length],
          padding: '8px 12px',
          lineHeight: 1.45,
        }}
      >
        <Text strong style={{ fontSize: 14 }}>{name}</Text>
        <Text style={{ fontSize: 13, color: '#595959', fontStyle: 'italic' }}>
          {` (${description}, trọng số ${(weight * 100).toFixed(0)}%)`}
        </Text>
      </div>
      <Row gutter={12} align="middle" style={{ padding: '10px 12px' }}>
        <Col flex="96px">
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
        <Col flex="auto" style={{ minWidth: 0 }}>
          <ProFormTextArea
            name={`${key}Comment`}
            placeholder="Nhận xét ngắn gọn..."
            rules={[{ required: true, message: 'Nhập nhận xét' }]}
            fieldProps={{
              rows: 1,
              maxLength: 500,
              style: { height: 32, minHeight: 32, maxHeight: 32, resize: 'none', paddingTop: 4 },
              onChange: (e) => setFormValues(prev => ({ ...prev, [`${key}Comment`]: e.target.value })),
            }}
            formItemProps={{ style: { marginBottom: 0 } }}
          />
        </Col>
      </Row>
    </div>
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
            {currentSession?.status === 'OPEN' && laNguoiTaoPhien(currentSession) && (
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
            {(() => {
              const mauTrangThai: Record<string, { nen: string; chu: string; vien: string }> = {
                DRAFT: { nen: '#f5f5f5', chu: '#595959', vien: '#d9d9d9' },
                OPEN: { nen: '#e6f4ff', chu: '#0958d9', vien: '#91caff' },
                CLOSED: { nen: '#fff7e6', chu: '#d48806', vien: '#ffd591' },
                PUBLISHED: { nen: '#f6ffed', chu: '#389e0d', vien: '#b7eb8f' },
              };
              const mau = mauTrangThai[currentSession.status] || mauTrangThai.DRAFT;
              const tienDo = Number(scoringStats?.completionRate ?? 0);
              const xong = tienDo >= 100;
              const o = (noiDung: JSX.Element, laCuoi?: boolean) => (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRight: laCuoi ? 'none' : '1px solid #eef2f6',
                    minWidth: 0,
                  }}
                >
                  {noiDung}
                </div>
              );
              const nhan = (text: string) => (
                <div style={{ fontSize: 12, color: '#8c8c8c', letterSpacing: 0.2, marginBottom: 6 }}>{text}</div>
              );
              return (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.15fr 0.8fr 0.9fr 1.25fr',
                    marginBottom: 16,
                    background: '#fff',
                    border: '1px solid #e6edf5',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {o(
                    <>
                      {nhan('Trạng thái')}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: mau.nen,
                          color: mau.chu,
                          border: `1px solid ${mau.vien}`,
                          fontWeight: 600,
                          lineHeight: 1.4,
                        }}
                      >
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: mau.chu }} />
                        {SESSION_STATUS_MAP[currentSession.status]?.text || '—'}
                      </span>
                    </>,
                  )}
                  {o(
                    <>
                      {nhan('Ý tưởng')}
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#0c2340', lineHeight: 1.2 }}>
                        {currentSession.ideaCount}
                      </div>
                    </>,
                  )}
                  {o(
                    <>
                      {nhan('Thành viên')}
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#0c2340', lineHeight: 1.2 }}>
                        {currentSession.memberCount}
                      </div>
                    </>,
                  )}
                  {o(
                    <>
                      {nhan('Tiến độ chấm')}
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                        <span style={{ fontSize: 22, fontWeight: 600, color: xong ? '#389e0d' : '#d48806', lineHeight: 1.2 }}>
                          {tienDo}
                        </span>
                        <span style={{ color: '#8c8c8c' }}>%</span>
                      </div>
                      <Progress
                        percent={tienDo}
                        showInfo={false}
                        strokeColor={xong ? '#52c41a' : '#faad14'}
                        trailColor="#f0f0f0"
                        size="small"
                      />
                    </>,
                    true,
                  )}
                </div>
              );
            })()}

            {/* Tabs */}
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <Tabs.TabPane tab="Ý tưởng" key="ideas">
                <ProTable<SessionIdea>
                  headerTitle={false}
                  rowKey="id"
                  columns={ideaColumns}
                  dataSource={sessionIdeas}
                  search={false}
                  options={false}
                  pagination={false}
                  tableLayout="fixed"
                  cardProps={{ bodyStyle: { padding: 0 } }}
                  toolBarRender={currentSession.status === 'DRAFT' ? () => [
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
                    ]
                    : false
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
                  options={false}
                  pagination={false}
                  tableLayout="fixed"
                  cardProps={{ bodyStyle: { padding: 0 } }}
                  toolBarRender={
                    currentSession.status === 'DRAFT'
                      ? () => [
                          <Button
                            key="add"
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={() => {
                              setAddMemberModalVisible(true);
                              setSelectedMember(null);
                              setTuKhoaThanhVien('');
                              loadAvailableMembers();
                            }}
                          >
                            Thêm thành viên
                          </Button>,
                        ]
                      : false
                  }
                />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Kết quả" key="results" disabled={currentSession.status === 'DRAFT'}>
                {results.some((muc) => muc.submittedCount > 0) ? (
                  <ProTable<IdeaCouncilResult>
                    headerTitle={false}
                    rowKey="ideaId"
                    columns={resultColumns}
                    dataSource={results.filter((muc) => muc.submittedCount > 0)}
                    search={false}
                    options={false}
                    pagination={false}
                    tableLayout="fixed"
                    cardProps={{ bodyStyle: { padding: 0 } }}
                    toolBarRender={false}
                  />
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
          setTuKhoaThanhVien('');
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
          value={tuKhoaThanhVien}
          options={availableMembers.map((m) => {
            const hocHam = nhanHocHamHienThi(m.academicTitle);
            const hocVi = nhanHocViHienThi(m.degree);
            return {
            value: String(m.userId),
            label: (
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  {hocHam ? <Tag color="blue" style={{ margin: 0 }}>{hocHam}</Tag> : null}
                  {hocVi ? <Tag color="cyan" style={{ margin: 0 }}>{hocVi}</Tag> : null}
                  <span style={{ fontWeight: 500 }}>{m.fullName}</span>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {donViThanhVien(m) || m.workEmail}
                </div>
              </div>
            ),
            };
          })}
          onChange={(text) => {
            const vuaChon = availableMembers.find((m) => String(m.userId) === text);
            if (vuaChon) {
              setSelectedMember(vuaChon);
              setTuKhoaThanhVien(tenOTimThanhVien(vuaChon));
              return;
            }
            setTuKhoaThanhVien(text);
            setSelectedMember((cur) => (cur && tenOTimThanhVien(cur) === text ? cur : null));
          }}
          onSelect={(val) => {
            const m = availableMembers.find((x) => String(x.userId) === val);
            if (!m) return;
            setSelectedMember(m);
            setTuKhoaThanhVien(tenOTimThanhVien(m));
          }}
          onSearch={(v) => {
            if (availableMembers.some((m) => String(m.userId) === v)) return;
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
                  {nhanHocHamHienThi(selectedMember.academicTitle) ? (
                    <Tag color="blue" style={{ marginRight: 6 }}>
                      {nhanHocHamHienThi(selectedMember.academicTitle)}
                    </Tag>
                  ) : null}
                  {nhanHocViHienThi(selectedMember.degree) ? (
                    <Tag color="cyan" style={{ marginRight: 6 }}>
                      {nhanHocViHienThi(selectedMember.degree)}
                    </Tag>
                  ) : null}
                  {selectedMember.fullName}
                </div>
                {selectedMember.currentTitle && (
                  <div style={{ fontSize: 13, color: '#595959', marginBottom: 2 }}>{selectedMember.currentTitle}</div>
                )}
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {donViThanhVien(selectedMember) || '—'}
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
                  onClick={() => {
                    setSelectedMember(null);
                    setTuKhoaThanhVien('');
                  }}
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
        width="min(1100px, calc(100vw - 32px))"
        style={{ top: 32 }}
        bodyStyle={{ padding: 16, maxHeight: '80vh', overflowX: 'hidden', overflowY: 'auto' }}
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
                  {SCORING_CRITERIA.map((c, i) => renderCriteriaInputCompact(c.key, c.name, c.description, c.weight, i))}
                  
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

      <Drawer
        title={`Xem phiếu: ${currentIdea?.ideaCode || ''}`}
        width={480}
        open={allScoresDrawerVisible}
        onClose={() => setAllScoresDrawerVisible(false)}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {(() => {
            const ketQua = tinhKetQuaChung(ideaScores, currentSession?.memberCount || ideaScores.length);
            return ketQua ? <TheKetQuaChung ketQua={ketQua} /> : null;
          })()}
          <Text strong>Từng phiếu</Text>
          {ideaScores.map((phieu) => {
            const vaiTro = MEMBER_ROLE_MAP[phieu.councilRole];
            const donVi = members.find((m) => Number(m.memberId) === Number(phieu.councilMemberId))?.unit;
            return (
              <Card key={phieu.id} size="small" bodyStyle={{ padding: 14 }}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text strong>{phieu.councilMemberName}</Text>
                    <Tag color={Number(phieu.weightedScore) >= THRESHOLD_SCORE ? 'success' : 'warning'}>
                      {Number(phieu.weightedScore).toFixed(2)}/10
                    </Tag>
                  </Space>
                  <Space size={6}>
                    <Tag color={vaiTro?.color}>{vaiTro?.text}</Tag>
                    {donVi ? <Text type="secondary">{donViHienThi(donVi)}</Text> : null}
                  </Space>
                  <Button type="primary" block icon={<EyeOutlined />} onClick={() => setPhieuDangXem(phieu)}>
                    Mở phiếu
                  </Button>
                </Space>
              </Card>
            );
          })}
        </Space>
      </Drawer>

      <PhieuChamModal
        open={!!phieuDangXem}
        onClose={() => setPhieuDangXem(null)}
        phieu={phieuDangXem}
        yTuong={currentIdea}
        phien={currentSession}
        thanhVien={
          members.find((m) => Number(m.memberId) === Number(phieuDangXem?.councilMemberId)) ?? null
        }
        tenChuTich={members.find((m) => m.roleInCouncil === 'CHU_TICH')?.memberName}
        tenThuKy={members.find((m) => m.roleInCouncil === 'THU_KY')?.memberName}
        ketQuaChung={tinhKetQuaChung(ideaScores, currentSession?.memberCount || ideaScores.length)}
      />
    </PageContainer>
  );
};

export default CouncilPage;

