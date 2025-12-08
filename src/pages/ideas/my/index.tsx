/**
 * Ý tưởng của tôi
 * Dành cho người đề xuất xem & quản lý ý tưởng của mình
 */
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Card, Drawer, Descriptions, Space, Tag, Typography, message, Popconfirm, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useModel } from '@umijs/max';
import {
  queryIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  submitIdea,
  IDEA_FIELDS,
  IDEA_LEVELS,
  IDEA_STATUS_MAP,
  IDEA_PRIORITY_MAP,
  type Idea,
  type IdeaCreateData,
} from '@/services/ideas';

const { Text } = Typography;

const MyIdeasPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  
  const actionRef = useRef<ActionType>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  // Xem chi tiết
  const handleView = (record: Idea) => {
    setCurrentIdea(record);
    setDrawerVisible(true);
  };

  // Mở modal thêm mới
  const handleAdd = () => {
    setEditingIdea(null);
    setModalVisible(true);
  };

  // Mở modal sửa
  const handleEdit = (record: Idea) => {
    setEditingIdea(record);
    setModalVisible(true);
  };

  // Xóa ý tưởng
  const handleDelete = async (id: string) => {
    const result = await deleteIdea(id);
    if (result.success) {
      message.success('Đã xóa ý tưởng');
      actionRef.current?.reload();
    } else {
      message.error('Không thể xóa ý tưởng này');
    }
  };

  // Gửi ý tưởng
  const handleSubmit = async (id: string) => {
    const result = await submitIdea(id);
    if (result.success) {
      message.success('Đã gửi ý tưởng');
      actionRef.current?.reload();
    } else {
      message.error('Không thể gửi ý tưởng này');
    }
  };

  // Submit form thêm/sửa
  const handleFormSubmit = async (values: IdeaCreateData) => {
    if (editingIdea) {
      // Update
      const result = await updateIdea(editingIdea.id, values);
      if (result.success) {
        message.success('Đã cập nhật ý tưởng');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      } else {
        message.error('Không thể cập nhật ý tưởng');
        return false;
      }
    } else {
      // Create
      const result = await createIdea(
        values,
        currentUser?.name ? 'user-current' : 'user-1',
        currentUser?.name || 'Người dùng',
        'Khoa CNTT'
      );
      if (result.success) {
        message.success('Đã tạo ý tưởng mới');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      } else {
        message.error('Không thể tạo ý tưởng');
        return false;
      }
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
      width: 280,
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field',
      width: 150,
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
      valueEnum: Object.entries(IDEA_STATUS_MAP).reduce((acc, [key, val]) => {
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
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        if (!record.priority) return <Text type="secondary">-</Text>;
        const priority = IDEA_PRIORITY_MAP[record.priority];
        return <Tag color={priority.color}>{priority.text}</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 120,
      valueType: 'date',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 200,
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

        // Cho phép sửa khi DRAFT hoặc SUBMITTED
        if (['DRAFT', 'SUBMITTED'].includes(record.status)) {
          actions.push(
            <Button
              key="edit"
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          );
        }

        // Cho phép gửi khi DRAFT
        if (record.status === 'DRAFT') {
          actions.push(
            <Popconfirm
              key="submit"
              title="Gửi ý tưởng?"
              description="Sau khi gửi, ý tưởng sẽ được chuyển cho Phòng KH xem xét."
              onConfirm={() => handleSubmit(record.id)}
              okText="Gửi"
              cancelText="Hủy"
            >
              <Button type="link" size="small" icon={<SendOutlined />} style={{ color: '#52c41a' }}>
                Gửi
              </Button>
            </Popconfirm>
          );
        }

        // Cho phép xóa khi DRAFT
        if (record.status === 'DRAFT') {
          actions.push(
            <Popconfirm
              key="delete"
              title="Xóa ý tưởng?"
              description="Hành động này không thể hoàn tác."
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          );
        }

        return <Space size={0}>{actions}</Space>;
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<Idea>
        headerTitle="Ý tưởng của tôi"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const { current, pageSize, code, title, ...rest } = params;
          // Chỉ lấy ý tưởng của user hiện tại (mock: user-1)
          const result = await queryIdeas({
            current,
            pageSize,
            keyword: code || title,
            ownerId: 'user-1', // Mock current user
            ...rest,
          });
          return {
            data: result.data,
            total: result.total,
            success: result.success,
          };
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Thêm ý tưởng mới
          </Button>,
        ]}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} trên tổng ${total} mục`,
        }}
        scroll={{ x: 1200 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Bạn chưa có ý tưởng nào"
            >
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                Thêm ý tưởng đầu tiên
              </Button>
            </Empty>
          ),
        }}
      />

      {/* Modal thêm/sửa */}
      <ModalForm<IdeaCreateData>
        title={editingIdea ? 'Chỉnh sửa ý tưởng' : 'Thêm ý tưởng mới'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={editingIdea || {}}
        onFinish={handleFormSubmit}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
        width={600}
      >
        <ProFormText
          name="title"
          label="Tiêu đề"
          placeholder="Nhập tiêu đề ý tưởng"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        />
        <ProFormSelect
          name="field"
          label="Lĩnh vực"
          placeholder="Chọn lĩnh vực"
          options={IDEA_FIELDS.map(f => ({ label: f, value: f }))}
          rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực' }]}
        />
        <ProFormSelect
          name="level"
          label="Cấp quản lý dự kiến"
          placeholder="Chọn cấp quản lý"
          options={IDEA_LEVELS.map(l => ({ label: l, value: l }))}
          rules={[{ required: true, message: 'Vui lòng chọn cấp quản lý' }]}
        />
        <ProFormTextArea
          name="summary"
          label="Tóm tắt"
          placeholder="Mô tả ngắn gọn về ý tưởng"
          rules={[{ required: true, message: 'Vui lòng nhập tóm tắt' }]}
          fieldProps={{ rows: 4 }}
        />
        <ProFormSelect
          name="tags"
          label="Tags"
          placeholder="Nhập tags (Enter để thêm)"
          mode="tags"
          fieldProps={{
            tokenSeparators: [','],
          }}
        />
        <ProFormTextArea
          name="expectedOutput"
          label="Kết quả mong đợi"
          placeholder="Mô tả kết quả dự kiến của nghiên cứu"
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
            {currentIdea?.status === 'DRAFT' && (
              <Button 
                type="primary" 
                icon={<SendOutlined />}
                onClick={() => {
                  handleSubmit(currentIdea.id);
                  setDrawerVisible(false);
                }}
              >
                Gửi ý tưởng
              </Button>
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
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tags">
              {currentIdea.tags?.map(tag => <Tag key={tag}>{tag}</Tag>) || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tóm tắt">{currentIdea.summary}</Descriptions.Item>
            <Descriptions.Item label="Kết quả mong đợi">
              {currentIdea.expectedOutput || '-'}
            </Descriptions.Item>
            {currentIdea.noteForReview && (
              <Descriptions.Item label="Ghi chú từ Phòng KH">
                <Text type="secondary">{currentIdea.noteForReview}</Text>
              </Descriptions.Item>
            )}
            {currentIdea.convertedProjectId && (
              <Descriptions.Item label="Mã đề tài">
                <Tag color="purple">{currentIdea.convertedProjectId}</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày tạo">
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

export default MyIdeasPage;
