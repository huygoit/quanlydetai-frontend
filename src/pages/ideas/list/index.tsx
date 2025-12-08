/**
 * Danh sách ý tưởng
 * Hiển thị toàn bộ ý tưởng trong hệ thống
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Card, Drawer, Descriptions, Space, Tag, Typography, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import {
  queryIdeas,
  IDEA_FIELDS,
  IDEA_UNITS,
  IDEA_STATUS_MAP,
  IDEA_PRIORITY_MAP,
  type Idea,
  type IdeaStatus,
  type IdeaPriority,
} from '@/services/ideas';

const { Text } = Typography;

const IdeaListPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(null);

  // Xem chi tiết ý tưởng
  const handleView = (record: Idea) => {
    setCurrentIdea(record);
    setDrawerVisible(true);
  };

  // Columns definition
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
      width: 250,
    },
    {
      title: 'Người đề xuất',
      dataIndex: 'ownerName',
      width: 150,
      hideInSearch: true,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'ownerUnit',
      width: 150,
      valueType: 'select',
      valueEnum: IDEA_UNITS.reduce((acc, unit) => {
        acc[unit] = { text: unit };
        return acc;
      }, {} as Record<string, { text: string }>),
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
      width: 130,
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
      width: 120,
      valueType: 'date',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: 'Thời gian',
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
      search: {
        transform: (value) => ({
          startDate: value[0],
          endDate: value[1],
        }),
      },
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 100,
      fixed: 'right',
      render: (_, record) => [
        <Button
          key="view"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          Xem
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<Idea>
        headerTitle="Danh sách ý tưởng"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={async (params) => {
          const { current, pageSize, code, title, ...rest } = params;
          const result = await queryIdeas({
            current,
            pageSize,
            keyword: code || title,
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
          defaultCollapsed: false,
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} trên tổng ${total} mục`,
        }}
        scroll={{ x: 1300 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />

      {/* Drawer xem chi tiết */}
      <Drawer
        title="Chi tiết ý tưởng"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
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
              ) : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tags">
              {currentIdea.tags?.map(tag => <Tag key={tag}>{tag}</Tag>) || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Tóm tắt">{currentIdea.summary}</Descriptions.Item>
            <Descriptions.Item label="Kết quả mong đợi">
              {currentIdea.expectedOutput || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Ghi chú sơ loại">
              {currentIdea.noteForReview || '-'}
            </Descriptions.Item>
            {currentIdea.convertedProjectId && (
              <Descriptions.Item label="Mã đề tài">
                <Tag color="purple">{currentIdea.convertedProjectId}</Tag>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày tạo">
              {new Date(currentIdea.createdAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật">
              {new Date(currentIdea.updatedAt).toLocaleString('vi-VN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default IdeaListPage;
