/**
 * Ý tưởng của tôi
 * Dành cho NCV/CNDT xem & quản lý ý tưởng của mình
 * Theo specs/ideas-v3-final.md
 */
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormCheckbox } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Card, Col, Drawer, Descriptions, Progress, Row, Space, Tag, Typography, message, Popconfirm, Empty, Alert } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SendOutlined, LinkOutlined, TrophyOutlined } from '@ant-design/icons';
import { THRESHOLD_SCORE, MAX_WEIGHTED_SCORE, SCORING_CRITERIA } from '@/services/api/ideaCouncil';
import { useRef, useState } from 'react';
import { useModel } from '@umijs/max';
import {
  queryMyIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  submitIdea,
  IDEA_FIELDS,
  IDEA_STATUS_MAP,
  IDEA_PRIORITY_MAP,
  PROJECT_LEVEL_MAP,
  type Idea,
  type IdeaCreateData,
  type ProjectLevel,
} from '@/services/api/ideas';

const PROJECT_LEVELS: ProjectLevel[] = Object.keys(PROJECT_LEVEL_MAP) as ProjectLevel[];

const REJECT_STAGE_MAP: Record<string, string> = {
  PHONG_KH_SO_LOAI: 'Bị từ chối ở giai đoạn sơ loại (Phòng KH)',
  HOI_DONG_DE_XUAT: 'Bị từ chối ở giai đoạn Hội đồng đề xuất',
  LANH_DAO_PHE_DUYET: 'Bị từ chối ở giai đoạn Lãnh đạo phê duyệt',
};

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

  // Mở modal sửa (chỉ khi DRAFT)
  const handleEdit = (record: Idea) => {
    setEditingIdea(record);
    setModalVisible(true);
  };

  // Xóa ý tưởng (chỉ khi DRAFT)
  const handleDelete = async (id: number) => {
    try {
      const result = await deleteIdea(id);
      if (result.success) {
        message.success('Đã xóa ý tưởng');
        actionRef.current?.reload();
      }
    } catch (error) {
      message.error('Chỉ có thể xóa ý tưởng ở trạng thái Nháp');
    }
  };

  // Gửi ý tưởng (DRAFT → SUBMITTED)
  const handleSubmit = async (id: number) => {
    try {
      const result = await submitIdea(id);
      if (result.success) {
        message.success('Đã gửi ý tưởng thành công');
        actionRef.current?.reload();
      }
    } catch (error) {
      message.error('Không thể gửi ý tưởng này');
    }
  };

  // Submit form thêm/sửa
  const handleFormSubmit = async (values: IdeaCreateData) => {
    try {
      if (editingIdea) {
        // Update (chỉ khi DRAFT)
        const result = await updateIdea(editingIdea.id, values);
        if (result.success) {
          message.success('Đã cập nhật ý tưởng');
          setModalVisible(false);
          actionRef.current?.reload();
          return true;
        }
        return false;
      } else {
        // Create
        const result = await createIdea(values);
        if (result.success) {
          message.success('Đã tạo ý tưởng mới');
          setModalVisible(false);
          actionRef.current?.reload();
          return true;
        }
        return false;
      }
    } catch (error) {
      message.error(editingIdea ? 'Chỉ có thể sửa ý tưởng ở trạng thái Nháp' : 'Không thể tạo ý tưởng');
      return false;
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
      width: 250,
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
      width: 200,
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
      hideInSearch: true,
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

        // Cho phép sửa chỉ khi DRAFT (không cho sửa sau khi đã gửi)
        if (record.status === 'DRAFT') {
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
              description="Sau khi gửi, ý tưởng sẽ được chuyển cho Phòng KH xem xét. Bạn sẽ không thể chỉnh sửa sau khi gửi."
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
          const result = await queryMyIdeas({
            page: current,
            perPage: pageSize,
            keyword: code || title,
            ...rest,
          });
          return {
            data: result.data,
            total: result.meta?.total || 0,
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
        scroll={{ x: 1300 }}
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
        width={640}
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
        <ProFormCheckbox.Group
          name="suitableLevels"
          label="Cấp đề tài phù hợp"
          rules={[{ required: true, message: 'Vui lòng chọn ít nhất một cấp đề tài' }]}
          options={PROJECT_LEVELS.map(level => ({
            label: PROJECT_LEVEL_MAP[level].text,
            value: level,
          }))}
        />
        <ProFormTextArea
          name="summary"
          label="Tóm tắt"
          placeholder="Mô tả ngắn gọn về ý tưởng nghiên cứu"
          rules={[{ required: true, message: 'Vui lòng nhập tóm tắt' }]}
          fieldProps={{ rows: 4 }}
        />
      </ModalForm>

      {/* Drawer xem chi tiết */}
      <Drawer
        title="Chi tiết ý tưởng"
        width={640}
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
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary">
                        Ý tưởng bị từ chối không thể nộp lại. Vui lòng tạo ý tưởng mới nếu muốn tiếp tục.
                      </Text>
                    </div>
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

export default MyIdeasPage;
