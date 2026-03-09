/**
 * Xét duyệt ý tưởng - Workflow 3 bước
 * Theo specs/ideas-v3-final.md & specs/ideas-council-weighted.md
 * 
 * 1. Phòng KH: Sơ loại (SUBMITTED → REVIEWING → APPROVED_INTERNAL)
 * 2. Hội đồng KH&ĐT: Chấm điểm + Đề xuất đặt hàng (APPROVED_INTERNAL → PROPOSED_FOR_ORDER)
 * 3. Lãnh đạo: Phê duyệt đặt hàng (PROPOSED_FOR_ORDER → APPROVED_FOR_ORDER)
 * 
 * ❌ Bị từ chối tại bất kỳ bước nào → REJECTED (kết thúc, không cho nộp lại)
 */
import { PageContainer, ProTable, ModalForm, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Card, Drawer, Descriptions, Space, Tag, Typography, message, Popconfirm, Alert, Tabs, Steps, Row, Col, Statistic, Progress, Divider } from 'antd';
import { 
  AuditOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  RocketOutlined,
  PlayCircleOutlined,
  LinkOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import { useAccess, useModel, history } from '@umijs/max';
import {
  queryIdeas,
  receiveIdea,
  approveInternalIdea,
  approveOrderIdea,
  rejectIdea,
  createProjectFromIdea,
  IDEA_FIELDS,
  IDEA_UNITS,
  IDEA_STATUS_MAP,
  IDEA_PRIORITY_MAP,
  PROJECT_LEVEL_MAP,
  type Idea,
  type IdeaStatus,
  type IdeaPriority,
} from '@/services/api/ideas';
import {
  getSessionResults,
  SCORING_CRITERIA,
  THRESHOLD_SCORE,
  MAX_WEIGHTED_SCORE,
  type IdeaCouncilResult,
} from '@/services/api/ideaCouncil';

const REJECT_STAGE_MAP: Record<string, string> = {
  PHONG_KH_SO_LOAI: 'Bị từ chối ở giai đoạn sơ loại (Phòng KH)',
  HOI_DONG_DE_XUAT: 'Bị từ chối ở giai đoạn Hội đồng đề xuất',
  LANH_DAO_PHE_DUYET: 'Bị từ chối ở giai đoạn Lãnh đạo phê duyệt',
};

const { Text } = Typography;

/**
 * Helper: Xác định bước hiện tại trong workflow
 */
const getWorkflowStep = (status: IdeaStatus): number => {
  switch (status) {
    case 'SUBMITTED': return 0;
    case 'REVIEWING': return 1;
    case 'APPROVED_INTERNAL': return 2;
    case 'PROPOSED_FOR_ORDER': return 3;
    case 'APPROVED_FOR_ORDER': return 4;
    case 'REJECTED': return -1;
    default: return -1;
  }
};

const IdeaReviewPage: React.FC = () => {
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  
  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [councilResult, setCouncilResult] = useState<IdeaCouncilResult | null>(null);

  // ========== DEFAULT STATUS FILTER BY ROLE ==========
  const getDefaultStatusByRole = (): IdeaStatus | undefined => {
    // Lãnh đạo: Đã đề xuất đặt hàng
    if (access.canApproveOrder && !access.canReviewIdea) {
      return 'PROPOSED_FOR_ORDER';
    }
    // Hội đồng: Đã sơ duyệt (chờ chấm điểm)
    if (access.canScoreIdea && !access.canReviewIdea && !access.canApproveOrder) {
      return 'APPROVED_INTERNAL';
    }
    // Phòng KH/CNTT/HTQT: Đã gửi (chờ sơ loại)
    if (access.canReviewIdea) {
      return 'SUBMITTED';
    }
    return undefined;
  };

  const defaultStatus = getDefaultStatusByRole();

  // Xem chi tiết
  const handleView = async (record: Idea) => {
    setCurrentIdea(record);
    setCouncilResult(null);
    setDrawerVisible(true);
    
    // Load council result if idea has been scored by council
    if (record.councilSessionId) {
      const res = await getSessionResults(record.councilSessionId);
      if (res.success && res.data) {
        const result = res.data.find((r: IdeaCouncilResult) => r.ideaId === record.id);
        if (result) setCouncilResult(result);
      }
    }
  };

  // ========== PHÒNG KH ACTIONS ==========
  
  // Tiếp nhận (SUBMITTED → REVIEWING)
  const handleReceive = async (record: Idea) => {
    const result = await receiveIdea(record.id);
    if (result.success) {
      message.success('Đã tiếp nhận ý tưởng');
      actionRef.current?.reload();
    } else {
      message.error('Không thể tiếp nhận ý tưởng này');
    }
  };

  // Sơ loại xong (REVIEWING → APPROVED_INTERNAL)
  const handleApproveInternal = async (record: Idea, priority?: IdeaPriority, note?: string) => {
    const result = await approveInternalIdea(record.id, { priority, noteForReview: note });
    if (result.success) {
      message.success('Đã sơ loại xong - Chuyển Hội đồng KH&ĐT');
      actionRef.current?.reload();
    } else {
      message.error('Không thể sơ loại ý tưởng này');
    }
  };

  // ========== HỘI ĐỒNG ACTIONS ==========
  // NOTE: Hội đồng chấm điểm qua phiên hội đồng (council session)
  // Khi khóa phiên, ý tưởng đạt ngưỡng sẽ TỰ ĐỘNG chuyển sang PROPOSED_FOR_ORDER

  // ========== LÃNH ĐẠO ACTIONS ==========
  
  // Phê duyệt đặt hàng (PROPOSED_FOR_ORDER → APPROVED_FOR_ORDER)
  const handleApproveOrder = async (record: Idea, note?: string) => {
    const result = await approveOrderIdea(record.id, { noteForReview: note });
    if (result.success) {
      message.success('Đã phê duyệt đặt hàng');
      actionRef.current?.reload();
    } else {
      message.error('Không thể phê duyệt ý tưởng này');
    }
  };

  // ========== COMMON ACTIONS ==========
  
  // Từ chối (Any → REJECTED)
  const handleReject = async (values: { rejectedReason: string }) => {
    if (!currentIdea) return false;
    
    // Determine role based on current status
    let rejectedByRole: 'PHONG_KH' | 'HOI_DONG' | 'LANH_DAO';
    if (['SUBMITTED', 'REVIEWING'].includes(currentIdea.status)) {
      rejectedByRole = 'PHONG_KH';
    } else if (currentIdea.status === 'APPROVED_INTERNAL') {
      rejectedByRole = 'HOI_DONG';
    } else {
      rejectedByRole = 'LANH_DAO';
    }
    
    const result = await rejectIdea(currentIdea.id, {
      rejectedByRole,
      rejectedReason: values.rejectedReason,
    });
    
    if (result.success) {
      message.success('Đã từ chối ý tưởng');
      setRejectModalVisible(false);
      setDrawerVisible(false);
      actionRef.current?.reload();
      return true;
    } else {
      message.error('Không thể từ chối ý tưởng này');
      return false;
    }
  };

  // Khởi tạo đề tài (ACTION - không phải status change)
  const handleCreateProject = async (record: Idea) => {
    const result = await createProjectFromIdea(record.id);
    if (result.success && result.data) {
      message.success(`Đã khởi tạo đề tài: ${result.data.linkedProjectId}`);
      actionRef.current?.reload();
    } else {
      message.error('Chỉ có thể khởi tạo đề tài từ ý tưởng đã được phê duyệt đặt hàng');
    }
  };

  // ========== FILTER BY TAB ==========
  
  const getStatusFilterByTab = (tab: string): IdeaStatus[] => {
    switch (tab) {
      case 'pending':
        // Pending: Các trạng thái cần xử lý
        if (access.canApproveOrder) {
          return ['SUBMITTED', 'REVIEWING', 'APPROVED_INTERNAL', 'PROPOSED_FOR_ORDER'];
        }
        if (access.canProposeOrder) {
          return ['SUBMITTED', 'REVIEWING', 'APPROVED_INTERNAL'];
        }
        return ['SUBMITTED', 'REVIEWING'];
      case 'approved':
        return ['APPROVED_FOR_ORDER'];
      case 'rejected':
        return ['REJECTED'];
      default:
        return [];
    }
  };

  // Columns
  const columns: ProColumns<Idea>[] = [
    {
      title: 'Mã ý tưởng',
      dataIndex: 'code',
      width: 130,
      copyable: true,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: 'Người đề xuất',
      dataIndex: 'ownerName',
      width: 130,
      hideInSearch: true,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'ownerUnit',
      width: 120,
      valueType: 'select',
      valueEnum: IDEA_UNITS.reduce((acc, unit) => {
        acc[unit] = { text: unit };
        return acc;
      }, {} as Record<string, { text: string }>),
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field',
      width: 130,
      valueType: 'select',
      valueEnum: IDEA_FIELDS.reduce((acc, field) => {
        acc[field] = { text: field };
        return acc;
      }, {} as Record<string, { text: string }>),
    },
    {
      title: 'Cấp đề tài',
      dataIndex: 'suitableLevels',
      width: 180,
      hideInSearch: true,
      render: (_, record) => (
        <Space size={[0, 4]} wrap>
          {record.suitableLevels.slice(0, 2).map(level => (
            <Tag key={level} color={PROJECT_LEVEL_MAP[level].color}>
              {PROJECT_LEVEL_MAP[level].text}
            </Tag>
          ))}
          {record.suitableLevels.length > 2 && (
            <Tag>+{record.suitableLevels.length - 2}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 170,
      valueType: 'select',
      valueEnum: Object.entries(IDEA_STATUS_MAP)
        .filter(([key]) => key !== 'DRAFT')
        .reduce((acc, [key, val]) => {
          acc[key] = { text: val.text, status: val.color as any };
          return acc;
        }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        const status = IDEA_STATUS_MAP[record.status];
        return <Badge status={status.color as any} text={status.text} />;
      },
    },
    {
      title: 'Mức ưu tiên',
      dataIndex: 'priority',
      width: 110,
      valueType: 'select',
      valueEnum: Object.entries(IDEA_PRIORITY_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text };
        return acc;
      }, {} as Record<string, { text: string }>),
      render: (_, record) => {
        if (!record.priority) return <Text type="secondary">-</Text>;
        const priority = IDEA_PRIORITY_MAP[record.priority];
        return <Tag color={priority.color}>{priority.text}</Tag>;
      },
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      width: 100,
      valueType: 'date',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 280,
      fixed: 'right',
      render: (_, record) => {
        const actions = [
          <Button
            key="view"
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Xem
          </Button>,
        ];

        // ========== PHÒNG KH ==========
        if (access.canReviewIdea) {
          // Tiếp nhận
          if (record.status === 'SUBMITTED') {
            actions.push(
              <Popconfirm
                key="receive"
                title="Tiếp nhận ý tưởng?"
                onConfirm={() => handleReceive(record)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button type="link" size="small" icon={<PlayCircleOutlined />}>
                  Tiếp nhận
                </Button>
              </Popconfirm>
            );
          }
          
          // Sơ loại xong
          if (record.status === 'REVIEWING') {
            actions.push(
              <Popconfirm
                key="approve-internal"
                title="Sơ loại xong - Chuyển Hội đồng?"
                onConfirm={() => handleApproveInternal(record)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#13c2c2' }}>
                  Sơ loại xong
                </Button>
              </Popconfirm>
            );
          }
        }

        // ========== HỘI ĐỒNG KH&ĐT ==========
        // NOTE: Hội đồng chấm điểm qua phiên hội đồng (council session)
        // Khi khóa phiên, ý tưởng đạt ngưỡng sẽ tự động chuyển sang PROPOSED_FOR_ORDER
        // Không có hành động riêng lẻ trên từng ý tưởng

        // ========== LÃNH ĐẠO ==========
        if (access.canApproveOrder && record.status === 'PROPOSED_FOR_ORDER') {
          actions.push(
            <Popconfirm
              key="approve-order"
              title="Phê duyệt đặt hàng?"
              description="Ý tưởng sẽ được phê duyệt và có thể khởi tạo đề tài."
              onConfirm={() => handleApproveOrder(record)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}>
                Phê duyệt
              </Button>
            </Popconfirm>
          );
        }

        // ========== KHỞI TẠO ĐỀ TÀI (ACTION) ==========
        if (record.status === 'APPROVED_FOR_ORDER' && !record.linkedProjectId) {
          actions.push(
            <Popconfirm
              key="create-project"
              title="Khởi tạo đề tài từ ý tưởng?"
              description="Hệ thống sẽ tạo hồ sơ đề tài mới từ ý tưởng này."
              onConfirm={() => handleCreateProject(record)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button type="link" size="small" icon={<RocketOutlined />} style={{ color: '#722ed1' }}>
                Khởi tạo đề tài
              </Button>
            </Popconfirm>
          );
        }

        // Hiển thị mã đề tài đã khởi tạo
        if (record.linkedProjectId) {
          actions.push(
            <Tag key="project" color="purple" icon={<LinkOutlined />}>
              {record.linkedProjectId}
            </Tag>
          );
        }

        // ========== TỪ CHỐI ==========
        // NOTE: Hội đồng không từ chối trực tiếp - chỉ chấm điểm qua phiên
        // Chỉ Phòng KH (sơ loại) và Lãnh đạo (phê duyệt) có quyền từ chối
        if (
          (access.canReviewIdea && ['SUBMITTED', 'REVIEWING'].includes(record.status)) ||
          (access.canApproveOrder && record.status === 'PROPOSED_FOR_ORDER')
        ) {
          actions.push(
            <Button
              key="reject"
              type="link"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setCurrentIdea(record);
                setRejectModalVisible(true);
              }}
            >
              Từ chối
            </Button>
          );
        }

        return <Space size={0} wrap>{actions}</Space>;
      },
    },
  ];

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          // Reset status filter khi chuyển tab
          if (formRef.current) {
            formRef.current.setFieldsValue({ status: undefined });
          }
        }}
        items={[
          { key: 'pending', label: 'Chờ xử lý' },
          { key: 'approved', label: 'Đã phê duyệt' },
          { key: 'rejected', label: 'Đã từ chối' },
        ]}
      />
      
      <ProTable<Idea>
        headerTitle={
          activeTab === 'pending' ? (
            defaultStatus ? 
              `Ý tưởng chờ xử lý (mặc định: ${IDEA_STATUS_MAP[defaultStatus].text})` : 
              'Ý tưởng chờ xử lý'
          ) :
          activeTab === 'approved' ? 'Ý tưởng đã phê duyệt đặt hàng' :
          'Ý tưởng đã từ chối'
        }
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        params={{ activeTab }}
        request={async (params) => {
          const { current, pageSize, code, title, status, activeTab: tab, ...rest } = params;
          
          // Lấy danh sách status cho phép theo tab
          const allowedStatuses = getStatusFilterByTab(tab || 'pending');
          
          // Xác định status để query API
          let apiStatus: IdeaStatus | undefined;
          
          if (status) {
            // User đã chọn status cụ thể trong form filter
            apiStatus = status;
          } else if (tab === 'pending' && defaultStatus) {
            // Tab pending + có defaultStatus theo role -> query với defaultStatus
            apiStatus = defaultStatus;
          } else if (tab === 'approved') {
            // Tab approved -> query với APPROVED_FOR_ORDER
            apiStatus = 'APPROVED_FOR_ORDER';
          } else if (tab === 'rejected') {
            // Tab rejected -> query với REJECTED
            apiStatus = 'REJECTED';
          }
          // Nếu không có gì, sẽ query tất cả và filter client-side
          
          // Query API - ProTable dùng current/pageSize, API dùng page/perPage
          const result = await queryIdeas({
            page: current,
            perPage: pageSize,
            keyword: code || title,
            status: apiStatus,
          });
          
          // Filter dữ liệu theo tab (để đảm bảo chỉ hiển thị đúng tab)
          let data = result.data.filter(i => {
            // Exclude DRAFT
            if (i.status === 'DRAFT') return false;
            
            // Nếu có status filter từ form, filter theo nó
            if (status) return i.status === status;
            
            // Nếu không có filter, filter theo các status được phép của tab
            return allowedStatuses.includes(i.status);
          });
          
          return {
            data,
            total: data.length,
            success: result.success,
          };
        }}
        formRef={formRef}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} trên tổng ${total} mục`,
        }}
        scroll={{ x: 1600 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />

      {/* Modal từ chối */}
      <ModalForm<{ rejectedReason: string }>
        title={`Từ chối ý tưởng: ${currentIdea?.code}`}
        open={rejectModalVisible}
        onOpenChange={setRejectModalVisible}
        onFinish={handleReject}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
        width={500}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Lưu ý: Ý tưởng bị từ chối sẽ KHÔNG thể nộp lại"
          description="Người đề xuất sẽ cần tạo ý tưởng mới nếu muốn tiếp tục."
        />
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Text strong>{currentIdea?.title}</Text>
          <br />
          <Text type="secondary">{currentIdea?.ownerName} - {currentIdea?.ownerUnit}</Text>
        </Card>
        <ProFormTextArea
          name="rejectedReason"
          label="Lý do từ chối"
          placeholder="Nhập lý do từ chối ý tưởng"
          rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
          fieldProps={{ rows: 4 }}
        />
      </ModalForm>

      {/* Drawer xem chi tiết */}
      <Drawer
        title="Chi tiết ý tưởng"
        width={700}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            {/* Buttons based on status and access */}
            {access.canReviewIdea && currentIdea?.status === 'SUBMITTED' && (
              <Button 
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  handleReceive(currentIdea);
                  setDrawerVisible(false);
                }}
              >
                Tiếp nhận
              </Button>
            )}
            {access.canReviewIdea && currentIdea?.status === 'REVIEWING' && (
              <Button 
                type="primary"
                style={{ background: '#13c2c2' }}
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  handleApproveInternal(currentIdea);
                  setDrawerVisible(false);
                }}
              >
                Sơ loại xong
              </Button>
            )}
            {/* NOTE: Hội đồng chấm điểm qua phiên, không có nút đề xuất riêng */}
            {access.canApproveOrder && currentIdea?.status === 'PROPOSED_FOR_ORDER' && (
              <Button 
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => {
                  handleApproveOrder(currentIdea);
                  setDrawerVisible(false);
                }}
              >
                Phê duyệt đặt hàng
              </Button>
            )}
            {currentIdea?.status === 'APPROVED_FOR_ORDER' && !currentIdea?.linkedProjectId && (
              <Button 
                type="primary"
                style={{ background: '#722ed1' }}
                icon={<RocketOutlined />}
                onClick={() => {
                  handleCreateProject(currentIdea);
                  setDrawerVisible(false);
                }}
              >
                Khởi tạo đề tài
              </Button>
            )}
            <Button onClick={() => setDrawerVisible(false)}>Đóng</Button>
          </Space>
        }
      >
        {currentIdea && (
          <>
            {/* Workflow Steps */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Steps
                size="small"
                current={getWorkflowStep(currentIdea.status)}
                status={currentIdea.status === 'REJECTED' ? 'error' : 'process'}
                items={[
                  { title: 'Đã gửi' },
                  { title: 'Đang sơ loại' },
                  { title: 'Đã sơ loại' },
                  { title: 'Đề xuất đặt hàng' },
                  { title: 'Phê duyệt đặt hàng' },
                ]}
              />
            </Card>

            {/* Thông báo nếu bị từ chối */}
            {currentIdea.status === 'REJECTED' && currentIdea.rejectedStage && (
              <Alert
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
                message={REJECT_STAGE_MAP[currentIdea.rejectedStage]}
                description={
                  <>
                    <div><strong>Lý do:</strong> {currentIdea.rejectedReason || 'Không có lý do'}</div>
                    {currentIdea.rejectedAt && (
                      <div><strong>Thời gian:</strong> {new Date(currentIdea.rejectedAt).toLocaleString('vi-VN')}</div>
                    )}
                  </>
                }
              />
            )}

            {/* Thông báo nếu đã khởi tạo đề tài */}
            {currentIdea.linkedProjectId && (
              <Alert
                type="success"
                showIcon
                icon={<LinkOutlined />}
                style={{ marginBottom: 16 }}
                message="Ý tưởng đã được khởi tạo thành đề tài"
                description={
                  <Tag color="purple" style={{ marginTop: 8 }}>
                    Mã đề tài: {currentIdea.linkedProjectId}
                  </Tag>
                }
              />
            )}

            {/* Kết quả chấm điểm Hội đồng (V2 - CÓ TRỌNG SỐ) */}
            {councilResult && (
              <Card 
                title={
                  <Space>
                    <TrophyOutlined />
                    <span>Kết quả chấm điểm Hội đồng KH&ĐT</span>
                  </Space>
                }
                size="small" 
                style={{ marginBottom: 16 }}
                extra={
                  <Button 
                    size="small" 
                    onClick={() => history.push('/ideas/council')}
                  >
                    Xem chi tiết
                  </Button>
                }
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Điểm TB có trọng số"
                      value={councilResult.avgWeightedScore}
                      precision={2}
                      valueStyle={{ 
                        color: councilResult.recommendation === 'PROPOSE_ORDER' ? '#52c41a' : '#ff4d4f',
                        fontSize: 28,
                      }}
                      suffix={`/ ${MAX_WEIGHTED_SCORE}`}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="Số phiếu chấm"
                      value={councilResult.submittedCount}
                      suffix={`/ ${councilResult.memberCount}`}
                    />
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', paddingTop: 8 }}>
                      {councilResult.recommendation === 'PROPOSE_ORDER' ? (
                        <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                          ĐẠT NGƯỠNG ĐỀ XUẤT
                        </Tag>
                      ) : (
                        <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 14, padding: '4px 12px' }}>
                          KHÔNG ĐẠT NGƯỠNG
                        </Tag>
                      )}
                    </div>
                  </Col>
                </Row>
                <Divider style={{ margin: '12px 0' }} />
                <Row gutter={[8, 8]}>
                  {SCORING_CRITERIA.map(criteria => {
                    const avgKey = `avg${criteria.key.charAt(0).toUpperCase() + criteria.key.slice(1)}Score` as keyof IdeaCouncilResult;
                    const avgScore = councilResult[avgKey] as number;
                    return (
                      <Col span={12} key={criteria.key}>
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Text type="secondary">
                            {criteria.name} ({(criteria.weight * 100).toFixed(0)}%)
                          </Text>
                          <Progress
                            percent={avgScore * 10}
                            size="small"
                            style={{ width: 100 }}
                            format={() => avgScore.toFixed(1)}
                            strokeColor={avgScore >= 7 ? '#52c41a' : avgScore >= 5 ? '#faad14' : '#ff4d4f'}
                          />
                        </Space>
                      </Col>
                    );
                  })}
                </Row>
                <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                  Ngưỡng đề xuất: {THRESHOLD_SCORE}/{MAX_WEIGHTED_SCORE} điểm (có trọng số)
                </Text>
              </Card>
            )}

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Mã ý tưởng">{currentIdea.code}</Descriptions.Item>
              <Descriptions.Item label="Tiêu đề">{currentIdea.title}</Descriptions.Item>
              <Descriptions.Item label="Lĩnh vực">{currentIdea.field}</Descriptions.Item>
              <Descriptions.Item label="Cấp đề tài phù hợp">
                <Space size={[0, 4]} wrap>
                  {currentIdea.suitableLevels.map(level => (
                    <Tag key={level} color={PROJECT_LEVEL_MAP[level].color}>
                      {PROJECT_LEVEL_MAP[level].text}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Người đề xuất">{currentIdea.ownerName}</Descriptions.Item>
              <Descriptions.Item label="Đơn vị">{currentIdea.ownerUnit}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Badge 
                  status={IDEA_STATUS_MAP[currentIdea.status].color as any} 
                  text={IDEA_STATUS_MAP[currentIdea.status].text} 
                />
              </Descriptions.Item>
              <Descriptions.Item label="Mức ưu tiên">
                {currentIdea.priority ? (
                  <Tag color={IDEA_PRIORITY_MAP[currentIdea.priority].color}>
                    {IDEA_PRIORITY_MAP[currentIdea.priority].text}
                  </Tag>
                ) : <Text type="secondary">Chưa đánh giá</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Tóm tắt">{currentIdea.summary}</Descriptions.Item>
              {currentIdea.noteForReview && (
                <Descriptions.Item label="Ghi chú xét duyệt">
                  <Text type="secondary">{currentIdea.noteForReview}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Ngày gửi">
                {new Date(currentIdea.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {new Date(currentIdea.updatedAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default IdeaReviewPage;
