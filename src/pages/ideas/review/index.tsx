/**
 * Sơ loại & đặt hàng ý tưởng
 * Dùng cho PHONG_KH / LANH_DAO / ADMIN
 */
import { PageContainer, ProTable, ModalForm, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Card, Drawer, Descriptions, Space, Tag, Typography, message, Popconfirm, Tooltip } from 'antd';
import { AuditOutlined, CheckCircleOutlined, EyeOutlined, RocketOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import {
  queryIdeas,
  reviewIdea,
  convertIdeaToProject,
  IDEA_FIELDS,
  IDEA_UNITS,
  IDEA_STATUS_MAP,
  IDEA_PRIORITY_MAP,
  type Idea,
  type IdeaStatus,
  type IdeaPriority,
  type IdeaReviewData,
} from '@/services/ideas';

const { Text } = Typography;

const IdeaReviewPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);

  // Xem chi tiết
  const handleView = (record: Idea) => {
    setCurrentIdea(record);
    setDrawerVisible(true);
  };

  // Mở modal sơ loại
  const handleOpenReview = (record: Idea) => {
    setCurrentIdea(record);
    setReviewModalVisible(true);
  };

  // Submit sơ loại
  const handleReviewSubmit = async (values: IdeaReviewData) => {
    if (!currentIdea) return false;
    
    const result = await reviewIdea(currentIdea.id, values);
    if (result.success) {
      message.success('Đã cập nhật trạng thái ý tưởng');
      setReviewModalVisible(false);
      actionRef.current?.reload();
      return true;
    } else {
      message.error('Không thể cập nhật ý tưởng');
      return false;
    }
  };

  // Đặt hàng (chuyển thành đề tài)
  const handleConvert = async (record: Idea) => {
    const result = await convertIdeaToProject(record.id);
    if (result.success) {
      message.success(`Đã chuyển thành đề tài: ${result.projectId}`);
      actionRef.current?.reload();
    } else {
      message.error('Chỉ có thể đặt hàng ý tưởng đã được duyệt');
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
      width: 220,
    },
    {
      title: 'Người đề xuất',
      dataIndex: 'ownerName',
      width: 140,
      hideInSearch: true,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'ownerUnit',
      width: 130,
      valueType: 'select',
      valueEnum: IDEA_UNITS.reduce((acc, unit) => {
        acc[unit] = { text: unit };
        return acc;
      }, {} as Record<string, { text: string }>),
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field',
      width: 140,
      valueType: 'select',
      valueEnum: IDEA_FIELDS.reduce((acc, field) => {
        acc[field] = { text: field };
        return acc;
      }, {} as Record<string, { text: string }>),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      initialValue: ['SUBMITTED', 'REVIEWING', 'APPROVED'],
      valueEnum: {
        SUBMITTED: { text: 'Đã gửi', status: 'processing' },
        REVIEWING: { text: 'Đang xét', status: 'warning' },
        APPROVED: { text: 'Đã duyệt', status: 'success' },
        REJECTED: { text: 'Từ chối', status: 'error' },
        CONVERTED: { text: 'Đã chuyển đề tài', status: 'purple' },
      },
      render: (_, record) => {
        const status = IDEA_STATUS_MAP[record.status];
        return <Badge status={status.color as any} text={status.text} />;
      },
    },
    {
      title: 'Mức ưu tiên',
      dataIndex: 'priority',
      width: 120,
      valueType: 'select',
      valueEnum: Object.entries(IDEA_PRIORITY_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text };
        return acc;
      }, {} as Record<string, { text: string }>),
      render: (_, record) => {
        if (!record.priority) return <Text type="secondary">Chưa đánh giá</Text>;
        const priority = IDEA_PRIORITY_MAP[record.priority];
        return <Tag color={priority.color}>{priority.text}</Tag>;
      },
    },
    {
      title: 'Ngày gửi',
      dataIndex: 'createdAt',
      width: 110,
      valueType: 'date',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 220,
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

        // Sơ loại - cho phép với SUBMITTED, REVIEWING
        if (['SUBMITTED', 'REVIEWING'].includes(record.status)) {
          actions.push(
            <Button
              key="review"
              type="link"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => handleOpenReview(record)}
            >
              Sơ loại
            </Button>
          );
        }

        // Đặt hàng - chỉ cho phép với APPROVED
        if (record.status === 'APPROVED') {
          actions.push(
            <Popconfirm
              key="convert"
              title="Đặt hàng ý tưởng này?"
              description="Ý tưởng sẽ được chuyển thành đề tài nghiên cứu."
              onConfirm={() => handleConvert(record)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button
                type="link"
                size="small"
                icon={<RocketOutlined />}
                style={{ color: '#722ed1' }}
              >
                Đặt hàng
              </Button>
            </Popconfirm>
          );
        }

        // Đã chuyển đề tài
        if (record.status === 'CONVERTED' && record.convertedProjectId) {
          actions.push(
            <Tooltip key="project" title={`Đề tài: ${record.convertedProjectId}`}>
              <Tag color="purple" icon={<CheckCircleOutlined />}>
                {record.convertedProjectId}
              </Tag>
            </Tooltip>
          );
        }

        return <Space size={0}>{actions}</Space>;
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<Idea>
        headerTitle="Sơ loại & đặt hàng ý tưởng"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const { current, pageSize, code, title, status, ...rest } = params;
          
          // Default filter: only show SUBMITTED, REVIEWING, APPROVED
          let statusFilter = status;
          if (!statusFilter || (Array.isArray(statusFilter) && statusFilter.length === 0)) {
            // Don't filter if user explicitly cleared, but show all reviewable
          }
          
          const result = await queryIdeas({
            current,
            pageSize,
            keyword: code || title,
            status: Array.isArray(statusFilter) ? undefined : statusFilter,
            ...rest,
          });
          
          // Client-side filter for multiple status (mock limitation)
          let data = result.data;
          if (Array.isArray(statusFilter) && statusFilter.length > 0) {
            data = data.filter(i => statusFilter.includes(i.status));
          }
          
          // Filter out DRAFT for review page
          data = data.filter(i => i.status !== 'DRAFT');
          
          return {
            data,
            total: data.length,
            success: result.success,
          };
        }}
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
        scroll={{ x: 1400 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />

      {/* Modal sơ loại */}
      <ModalForm<IdeaReviewData>
        title={`Sơ loại ý tưởng: ${currentIdea?.code}`}
        open={reviewModalVisible}
        onOpenChange={setReviewModalVisible}
        initialValues={{
          status: currentIdea?.status,
          priority: currentIdea?.priority,
          noteForReview: currentIdea?.noteForReview,
        }}
        onFinish={handleReviewSubmit}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
        width={500}
      >
        <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
          <Text strong>{currentIdea?.title}</Text>
          <br />
          <Text type="secondary">{currentIdea?.ownerName} - {currentIdea?.ownerUnit}</Text>
        </Card>
        
        <ProFormSelect
          name="status"
          label="Trạng thái mới"
          placeholder="Chọn trạng thái"
          options={[
            { label: 'Đang xét duyệt', value: 'REVIEWING' },
            { label: 'Đã duyệt', value: 'APPROVED' },
            { label: 'Từ chối', value: 'REJECTED' },
          ]}
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
        />
        <ProFormSelect
          name="priority"
          label="Mức ưu tiên"
          placeholder="Chọn mức ưu tiên"
          options={[
            { label: 'Thấp', value: 'LOW' },
            { label: 'Trung bình', value: 'MEDIUM' },
            { label: 'Cao', value: 'HIGH' },
          ]}
        />
        <ProFormTextArea
          name="noteForReview"
          label="Ghi chú sơ loại"
          placeholder="Nhập ghi chú cho người đề xuất"
          fieldProps={{ rows: 3 }}
        />
      </ModalForm>

      {/* Drawer xem chi tiết */}
      <Drawer
        title="Chi tiết ý tưởng"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            {currentIdea && ['SUBMITTED', 'REVIEWING'].includes(currentIdea.status) && (
              <Button 
                type="primary" 
                icon={<AuditOutlined />}
                onClick={() => {
                  setDrawerVisible(false);
                  handleOpenReview(currentIdea);
                }}
              >
                Sơ loại
              </Button>
            )}
            {currentIdea?.status === 'APPROVED' && (
              <Popconfirm
                title="Đặt hàng ý tưởng này?"
                description="Ý tưởng sẽ được chuyển thành đề tài nghiên cứu."
                onConfirm={() => {
                  handleConvert(currentIdea);
                  setDrawerVisible(false);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button type="primary" icon={<RocketOutlined />} style={{ background: '#722ed1' }}>
                  Đặt hàng
                </Button>
              </Popconfirm>
            )}
            <Button onClick={() => setDrawerVisible(false)}>Đóng</Button>
          </Space>
        }
      >
        {currentIdea && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Mã ý tưởng">{currentIdea.code}</Descriptions.Item>
            <Descriptions.Item label="Tiêu đề">{currentIdea.title}</Descriptions.Item>
            <Descriptions.Item label="Lĩnh vực">{currentIdea.field}</Descriptions.Item>
            <Descriptions.Item label="Cấp quản lý">{currentIdea.level}</Descriptions.Item>
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
            <Descriptions.Item label="Tags">
              {currentIdea.tags?.map(tag => <Tag key={tag}>{tag}</Tag>) || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tóm tắt">{currentIdea.summary}</Descriptions.Item>
            <Descriptions.Item label="Kết quả mong đợi">
              {currentIdea.expectedOutput || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú sơ loại">
              {currentIdea.noteForReview || <Text type="secondary">Chưa có ghi chú</Text>}
            </Descriptions.Item>
            {currentIdea.convertedProjectId && (
              <Descriptions.Item label="Mã đề tài">
                <Tag color="purple" icon={<CheckCircleOutlined />}>
                  {currentIdea.convertedProjectId}
                </Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày gửi">
              {new Date(currentIdea.createdAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              {new Date(currentIdea.updatedAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default IdeaReviewPage;
