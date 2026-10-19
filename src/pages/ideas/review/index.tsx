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
  PlayCircleOutlined,
  LinkOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useRef, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useAccess, history, useLocation } from '@umijs/max';
import {
  queryIdeas,
  receiveIdea,
  approveInternalIdea,
  approveOrderIdea,
  rejectIdea,
  IDEA_STATUS_MAP,
  IDEA_PRIORITY_MAP,
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
import {
  labelLevel,
  loadDepartmentSelectOptions,
  loadFieldSelectOptions,
  loadIdeaLevelOptions,
  type LevelMeta,
  type SelectOption,
} from '@/utils/researchCatalogOptions';

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

const TAB_HOP_LE = new Set([
  'pending',
  'approved_internal',
  'proposed',
  'approved',
  'rejected',
]);

const IdeaReviewPage: React.FC = () => {
  const access = useAccess();
  const location = useLocation();
  
  const actionRef = useRef<ActionType>();
  const formRef = useRef<any>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const tab = new URLSearchParams(location.search).get('tab') || '';
    return TAB_HOP_LE.has(tab) ? tab : 'pending';
  });
  const [councilResult, setCouncilResult] = useState<IdeaCouncilResult | null>(null);
  const [unitOptions, setUnitOptions] = useState<SelectOption[]>([]);
  const [fieldOptions, setFieldOptions] = useState<SelectOption[]>([]);
  const [levelMeta, setLevelMeta] = useState<Record<string, LevelMeta>>({});

  // Tải đơn vị / lĩnh vực / cấp từ danh mục
  useEffect(() => {
    void (async () => {
      const [units, fields, levels] = await Promise.all([
        loadDepartmentSelectOptions(),
        loadFieldSelectOptions(),
        loadIdeaLevelOptions(),
      ]);
      setUnitOptions(units);
      setFieldOptions(fields);
      setLevelMeta(levels.meta);
    })();
  }, []);

  // Thông báo lãnh đạo: /ideas/review?tab=proposed → mở tab Đề xuất đặt hàng
  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab') || '';
    if (TAB_HOP_LE.has(tab) && tab !== activeTab) {
      setActiveTab(tab);
      if (formRef.current) {
        formRef.current.setFieldsValue({ status: undefined });
      }
    }
  }, [location.search]);

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
  
  // Phê duyệt đặt hàng: BE tạo luôn đề xuất nháp và báo cho tác giả.
  const handleApproveOrder = async (record: Idea, note?: string) => {
    const result = await approveOrderIdea(record.id, { noteForReview: note });
    if (result.success) {
      message.success(result.message || 'Đã phê duyệt. Đề xuất nháp đã lưu cho tác giả.');
      actionRef.current?.reload();
    } else {
      message.error(result.message || 'Không thể phê duyệt ý tưởng này');
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

  const moDeXuat = (record: Idea) => {
    if (record.linkedProposalId) {
      history.push(`/projects/register/form/${record.linkedProposalId}`);
    }
  };

  // ========== FILTER BY TAB ==========
  
  const getStatusFilterByTab = (tab: string): IdeaStatus[] => {
    switch (tab) {
      case 'pending':
        return ['SUBMITTED', 'REVIEWING'];
      case 'proposed':
        return ['PROPOSED_FOR_ORDER'];
      case 'approved_internal':
        // Đã sơ loại (APPROVED_INTERNAL)
        return ['APPROVED_INTERNAL'];
      case 'approved':
        return ['APPROVED_FOR_ORDER'];
      case 'rejected':
        return ['REJECTED'];
      default:
        return [];
    }
  };

  const xuongDong = {
    ellipsis: false as const,
    onCell: () => ({ style: { whiteSpace: 'normal' as const, wordBreak: 'break-word' as const } }),
  };

  // Columns
  const columns: ProColumns<Idea>[] = [
    {
      title: 'Mã ý tưởng',
      dataIndex: 'code',
      width: 118,
      copyable: true,
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      width: 150,
      ...xuongDong,
    },
    {
      title: 'Người đề xuất',
      dataIndex: 'ownerName',
      width: 120,
      hideInSearch: true,
      ...xuongDong,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'ownerUnit',
      width: 110,
      ...xuongDong,
      valueType: 'select',
      fieldProps: {
        options: unitOptions,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: 'Chọn đơn vị',
      },
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field',
      width: 110,
      ...xuongDong,
      valueType: 'select',
      fieldProps: {
        options: fieldOptions,
        showSearch: true,
        optionFilterProp: 'label',
        placeholder: 'Chọn lĩnh vực',
      },
    },
    {
      title: 'Cấp ý tưởng/đề tài',
      dataIndex: 'suitableLevels',
      width: 180,
      hideInSearch: true,
      ...xuongDong,
      render: (_, record) => (
        <Space size={[4, 4]} wrap style={{ width: '100%' }}>
          {(record.suitableLevels || []).map((level) => {
            const meta = labelLevel(level, levelMeta);
            return (
              <Tag
                key={level}
                color={meta.color}
                style={{ whiteSpace: 'normal', height: 'auto', maxWidth: '100%', display: 'inline-block', wordBreak: 'break-word', marginInlineEnd: 0 }}
              >
                {meta.text}
              </Tag>
            );
          })}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 200,
      ...xuongDong,
      valueType: 'select',
      valueEnum: Object.entries(IDEA_STATUS_MAP)
        .filter(([key]) => key !== 'DRAFT')
        .reduce((acc, [key, val]) => {
          acc[key] = { text: val.text, status: val.color as any };
          return acc;
        }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        const status = IDEA_STATUS_MAP[record.status];
        return (
          <Space direction="vertical" size={0}>
            <Badge status={status.color as any} text={status.text} />
            {record.status === 'APPROVED_FOR_ORDER' && record.linkedProposalId ? (
              <Button
                type="link"
                size="small"
                icon={<LinkOutlined />}
                style={{ paddingInline: 0, height: 'auto' }}
                onClick={() => moDeXuat(record)}
              >
                Xem đề xuất đề tài
              </Button>
            ) : null}
          </Space>
        );
      },
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      width: 108,
      hideInSearch: true,
      render: (_, record) => (record.createdAt ? dayjs(record.createdAt).format('DD-MM-YYYY') : '—'),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 140,
      ...xuongDong,
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
        if ((access.canApproveIdea || access.canApproveOrder) && record.status === 'PROPOSED_FOR_ORDER') {
          actions.push(
            <Popconfirm
              key="approve-order"
              title="Phê duyệt đặt hàng?"
              description="Hệ thống tạo đề xuất nháp và lưu vào danh sách đề xuất của tác giả. Tác giả gửi lên khoa khi sẵn sàng."
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

        // ========== TỪ CHỐI ==========
        // NOTE: Hội đồng không từ chối trực tiếp - chỉ chấm điểm qua phiên
        // Chỉ Phòng KH (sơ loại) và Lãnh đạo (phê duyệt) có quyền từ chối
        if (
          (access.canReviewIdea && ['SUBMITTED', 'REVIEWING'].includes(record.status)) ||
          ((access.canApproveIdea || access.canApproveOrder) && record.status === 'PROPOSED_FOR_ORDER')
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

        return <Space direction="vertical" size={0}>{actions}</Space>;
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
          history.replace(`/ideas/review?tab=${key}`);
        }}
        items={[
          { key: 'pending', label: 'Chờ xử lý' },
          { key: 'approved_internal', label: 'Đã sơ loại' },
          { key: 'proposed', label: 'Đề xuất đặt hàng' },
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
          activeTab === 'approved_internal' ? 'Ý tưởng đã sơ loại' :
          activeTab === 'proposed' ? 'Ý tưởng đề xuất đặt hàng' :
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
            apiStatus = defaultStatus;
          } else if (tab === 'proposed') {
            apiStatus = 'PROPOSED_FOR_ORDER';
          } else if (tab === 'approved_internal') {
            // Tab Đã sơ loại -> query với APPROVED_INTERNAL
            apiStatus = 'APPROVED_INTERNAL';
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
            field: rest.field as string | undefined,
            unit: (rest.ownerUnit || rest.unit) as string | undefined,
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
        tableLayout="fixed"
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
            {(access.canApproveIdea || access.canApproveOrder) && currentIdea?.status === 'PROPOSED_FOR_ORDER' && (
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
            {currentIdea?.status === 'APPROVED_FOR_ORDER' &&
              !!(currentIdea?.linkedProjectId || currentIdea?.linkedProposalId) && (
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={() => {
                  moDeXuat(currentIdea);
                  setDrawerVisible(false);
                }}
              >
                Xem đề xuất đề tài
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
            {currentIdea.linkedProposalId && (
              <Alert
                type="success"
                showIcon
                icon={<LinkOutlined />}
                style={{ marginBottom: 16 }}
                message="Ý tưởng đã được phê duyệt để đăng ký đề xuất đề tài"
                action={
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => moDeXuat(currentIdea)}
                  >
                    Xem đề xuất đề tài
                  </Button>
                }
                description={currentIdea.linkedProjectId ? `Mã đề xuất: ${currentIdea.linkedProjectId}` : undefined}
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
              <Descriptions.Item label="Cấp ý tưởng/đề tài">
                <Space size={[0, 4]} wrap>
                  {currentIdea.suitableLevels.map((level) => {
                    const meta = labelLevel(level, levelMeta);
                    return (
                      <Tag key={level} color={meta.color}>
                        {meta.text}
                      </Tag>
                    );
                  })}
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
