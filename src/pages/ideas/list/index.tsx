/**
 * Danh sách ý tưởng
 * Hiển thị toàn bộ ý tưởng trong hệ thống
 * Theo specs/ideas-v3-final.md
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Card, Col, Drawer, Descriptions, Progress, Row, Space, Tag, Typography, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, LinkOutlined, TrophyOutlined } from '@ant-design/icons';
import { THRESHOLD_SCORE, MAX_WEIGHTED_SCORE, SCORING_CRITERIA } from '@/services/ideaCouncil';
import { useRef, useState } from 'react';
import {
  queryIdeas,
  IDEA_FIELDS,
  IDEA_UNITS,
  IDEA_STATUS_MAP,
  IDEA_PRIORITY_MAP,
  PROJECT_LEVEL_MAP,
  PROJECT_LEVELS,
  REJECT_STAGE_MAP,
  type Idea,
  type IdeaStatus,
  type ProjectLevel,
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
      title: 'Cấp đề tài phù hợp',
      dataIndex: 'suitableLevels',
      width: 220,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        placeholder: 'Chọn cấp đề tài',
      },
      valueEnum: PROJECT_LEVELS.reduce((acc, level) => {
        acc[level] = { text: PROJECT_LEVEL_MAP[level].text };
        return acc;
      }, {} as Record<string, { text: string }>),
      render: (_, record) => (
        <Space size={[0, 4]} wrap>
          {record.suitableLevels.map(level => (
            <Tag key={level} color={PROJECT_LEVEL_MAP[level].color}>
              {PROJECT_LEVEL_MAP[level].text}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 160,
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
      title: 'Điểm HĐ',
      dataIndex: 'councilAvgWeightedScore',
      width: 100,
      align: 'center',
      hideInSearch: true,
      render: (_, record) => {
        if (!record.councilAvgWeightedScore) return <Text type="secondary">-</Text>;
        const isPass = record.councilAvgWeightedScore >= THRESHOLD_SCORE;
        return (
          <Tag color={isPass ? 'success' : 'warning'} icon={<TrophyOutlined />}>
            {record.councilAvgWeightedScore.toFixed(1)}
          </Tag>
        );
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
          const { current, pageSize, code, title, suitableLevels, ...rest } = params;
          const result = await queryIdeas({
            current,
            pageSize,
            keyword: code || title,
            suitableLevels: suitableLevels as ProjectLevel[],
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
        scroll={{ x: 1500 }}
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
        width={640}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            <Button onClick={() => setDrawerVisible(false)}>Đóng</Button>
          </Space>
        }
      >
        {currentIdea && (
          <>
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

            {/* Kết quả chấm điểm Hội đồng */}
            {currentIdea.councilAvgWeightedScore !== undefined && (
              <Card 
                title={
                  <Space>
                    <TrophyOutlined />
                    <span>Kết quả chấm điểm Hội đồng KH&ĐT</span>
                  </Space>
                }
                size="small" 
                style={{ marginBottom: 16 }}
              >
                <Row gutter={16}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>Điểm TB (trọng số)</div>
                      <div style={{ 
                        fontSize: 28, 
                        fontWeight: 'bold',
                        color: currentIdea.councilRecommendation === 'PROPOSE_ORDER' ? '#52c41a' : '#ff4d4f',
                      }}>
                        {currentIdea.councilAvgWeightedScore.toFixed(2)}
                        <span style={{ fontSize: 14, color: '#8c8c8c' }}> / {MAX_WEIGHTED_SCORE}</span>
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, color: '#8c8c8c', marginBottom: 4 }}>Số phiếu</div>
                      <div style={{ fontSize: 24, fontWeight: 500 }}>
                        {currentIdea.councilSubmittedCount}/{currentIdea.councilMemberCount}
                      </div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center', paddingTop: 8 }}>
                      {currentIdea.councilRecommendation === 'PROPOSE_ORDER' ? (
                        <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>
                          ĐỀ XUẤT ĐẶT HÀNG
                        </Tag>
                      ) : (
                        <Tag color="error" icon={<CloseCircleOutlined />} style={{ fontSize: 13, padding: '4px 12px' }}>
                          KHÔNG ĐỀ XUẤT
                        </Tag>
                      )}
                    </div>
                  </Col>
                </Row>
                <div style={{ marginTop: 12 }}>
                  <Row gutter={[8, 8]}>
                    {SCORING_CRITERIA.map(criteria => {
                      const avgKey = `councilAvg${criteria.key.charAt(0).toUpperCase() + criteria.key.slice(1)}Score` as keyof typeof currentIdea;
                      const avgScore = (currentIdea[avgKey] as number) || 0;
                      return (
                        <Col span={12} key={criteria.key}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text type="secondary" style={{ fontSize: 13 }}>
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
                </div>
                {currentIdea.councilScoredAt && (
                  <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                    Chấm điểm: {new Date(currentIdea.councilScoredAt).toLocaleString('vi-VN')}
                  </Text>
                )}
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
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tóm tắt">{currentIdea.summary}</Descriptions.Item>
              {currentIdea.noteForReview && (
                <Descriptions.Item label="Ghi chú xét duyệt">
                  <Text type="secondary">{currentIdea.noteForReview}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Ngày tạo">
                {new Date(currentIdea.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật">
                {new Date(currentIdea.updatedAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default IdeaListPage;
