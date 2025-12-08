/**
 * Đăng ký đề xuất đề tài - Giai đoạn 1
 * specs/projects-register.md
 */
import React, { useState, useRef, useMemo } from 'react';
import { PageContainer, ProTable, StepsForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormDigit } from '@ant-design/pro-components';
import type { ProColumns, ActionType, ProFormInstance } from '@ant-design/pro-components';
import { Button, Drawer, Tag, Space, Descriptions, Divider, Modal, message, Card, Typography, Form, Input, Radio, Badge } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, SendOutlined, DeleteOutlined, UndoOutlined, CheckCircleOutlined, CloseCircleOutlined, CommentOutlined } from '@ant-design/icons';
import { useModel } from '@umijs/max';
import type { UserRole } from '@/access';
import {
  queryProjectProposals,
  createProjectProposal,
  updateProjectProposal,
  submitProjectProposal,
  withdrawProjectProposal,
  deleteProjectProposal,
  unitReviewProjectProposal,
  sciDeptReviewProjectProposal,
  PROPOSAL_STATUS_CONFIG,
  FIELD_OPTIONS,
  LEVEL_OPTIONS,
  UNIT_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/services/projectsRegister';
import type { ProjectProposal, ProposalStatus } from '@/services/projectsRegister';

const { Text, Title, Paragraph } = Typography;

// ============ COMPONENT ============

const ProjectRegisterPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const role = (currentUser?.role || 'NCV') as UserRole;

  // Refs
  const tableRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();

  // State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProjectProposal | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProposal, setEditingProposal] = useState<ProjectProposal | null>(null);
  const [unitReviewVisible, setUnitReviewVisible] = useState(false);
  const [sciDeptReviewVisible, setSciDeptReviewVisible] = useState(false);
  const [reviewProposal, setReviewProposal] = useState<ProjectProposal | null>(null);

  // Role checks
  const isResearcher = role === 'NCV' || role === 'CNDT';
  const isTruongDonVi = role === 'TRUONG_DON_VI';
  const isPhongKHOrHigher = role === 'PHONG_KH' || role === 'LANH_DAO' || role === 'ADMIN';
  const canCreate = isResearcher;

  // Current user info for filtering
  const currentUserId = 'user-001'; // Mock: thay bằng currentUser?.id
  const currentUserUnit = currentUser?.roleLabel === 'Trưởng khoa' ? 'Khoa Công nghệ thông tin' : undefined;

  // ============ TABLE COLUMNS ============

  const columns: ProColumns<ProjectProposal>[] = [
    {
      title: 'Mã đề xuất',
      dataIndex: 'code',
      width: 130,
      fixed: 'left',
      copyable: true,
    },
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      width: 300,
      ellipsis: true,
      render: (_, record) => (
        <a onClick={() => handleView(record)}>{record.title}</a>
      ),
    },
    {
      title: 'Chủ nhiệm',
      dataIndex: 'ownerName',
      width: 150,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: 'Đơn vị',
      dataIndex: 'ownerUnit',
      width: 180,
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        options: UNIT_OPTIONS.map((u) => ({ label: u, value: u })),
        showSearch: true,
      },
      hideInSearch: isResearcher, // NCV/CNDT không cần filter đơn vị
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field',
      width: 150,
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        options: FIELD_OPTIONS.map((f) => ({ label: f, value: f })),
        showSearch: true,
      },
    },
    {
      title: 'Cấp',
      dataIndex: 'level',
      width: 100,
      valueType: 'select',
      fieldProps: {
        options: LEVEL_OPTIONS,
      },
      render: (_, record) => {
        const level = LEVEL_OPTIONS.find((l) => l.value === record.level);
        return level?.label || record.level;
      },
    },
    {
      title: 'Kinh phí',
      dataIndex: 'requestedBudgetTotal',
      width: 130,
      hideInSearch: true,
      render: (_, record) =>
        record.requestedBudgetTotal
          ? `${(record.requestedBudgetTotal / 1000000).toFixed(0)} tr`
          : '-',
    },
    {
      title: 'Năm',
      dataIndex: 'year',
      width: 80,
      valueType: 'select',
      initialValue: new Date().getFullYear(),
      fieldProps: {
        options: [2024, 2025, 2026].map((y) => ({ label: String(y), value: y })),
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      fieldProps: {
        options: Object.entries(PROPOSAL_STATUS_CONFIG).map(([key, val]) => ({
          label: val.label,
          value: key,
        })),
      },
      render: (_, record) => {
        const config = PROPOSAL_STATUS_CONFIG[record.status];
        return <Tag color={config?.color}>{config?.label || record.status}</Tag>;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 140,
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'Từ khóa',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm theo mã, tên, chủ nhiệm...',
      },
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 200,
      fixed: 'right',
      render: (_, record) => renderActions(record),
    },
  ];

  // ============ ACTIONS RENDER ============

  const renderActions = (record: ProjectProposal) => {
    const actions: React.ReactNode[] = [];

    // Xem - tất cả đều có
    actions.push(
      <a key="view" onClick={() => handleView(record)}>
        <EyeOutlined /> Xem
      </a>
    );

    // Actions cho NCV/CNDT (là owner)
    if (isResearcher && record.ownerId === currentUserId) {
      // Sửa - chỉ DRAFT hoặc REJECTED
      if (record.status === 'DRAFT' || record.status === 'REJECTED') {
        actions.push(
          <a key="edit" onClick={() => handleEdit(record)}>
            <EditOutlined /> Sửa
          </a>
        );
      }

      // Gửi đề xuất - chỉ DRAFT
      if (record.status === 'DRAFT') {
        actions.push(
          <a key="submit" onClick={() => handleSubmit(record)}>
            <SendOutlined /> Gửi
          </a>
        );
      }

      // Rút đề xuất - chỉ SUBMITTED
      if (record.status === 'SUBMITTED') {
        actions.push(
          <a key="withdraw" style={{ color: '#faad14' }} onClick={() => handleWithdraw(record)}>
            <UndoOutlined /> Rút
          </a>
        );
      }

      // Xoá - chỉ DRAFT
      if (record.status === 'DRAFT') {
        actions.push(
          <a key="delete" style={{ color: '#ff4d4f' }} onClick={() => handleDelete(record)}>
            <DeleteOutlined /> Xoá
          </a>
        );
      }
    }

    // Actions cho TRUONG_DON_VI
    if (isTruongDonVi && record.status === 'SUBMITTED') {
      actions.push(
        <a key="unitReview" style={{ color: '#1890ff' }} onClick={() => handleUnitReview(record)}>
          <CommentOutlined /> Ý kiến
        </a>
      );
    }

    // Actions cho PHONG_KH / LANH_DAO / ADMIN
    if (isPhongKHOrHigher && (record.status === 'SUBMITTED' || record.status === 'UNIT_REVIEWED')) {
      actions.push(
        <a key="sciDeptReview" style={{ color: '#52c41a' }} onClick={() => handleSciDeptReview(record)}>
          <CheckCircleOutlined /> Sơ duyệt
        </a>
      );
    }

    return <Space size="small">{actions}</Space>;
  };

  // ============ HANDLERS ============

  const handleView = (record: ProjectProposal) => {
    setSelectedProposal(record);
    setDrawerVisible(true);
  };

  const handleCreate = () => {
    setEditingProposal(null);
    setFormVisible(true);
  };

  const handleEdit = (record: ProjectProposal) => {
    setEditingProposal(record);
    setFormVisible(true);
  };

  const handleSubmit = (record: ProjectProposal) => {
    Modal.confirm({
      title: 'Gửi đề xuất',
      content: `Bạn có chắc chắn muốn gửi đề xuất "${record.title}"?`,
      okText: 'Gửi',
      cancelText: 'Huỷ',
      onOk: async () => {
        const result = await submitProjectProposal(record.id);
        if (result.success) {
          message.success('Đã gửi đề xuất thành công!');
          tableRef.current?.reload();
        } else {
          message.error(result.message || 'Có lỗi xảy ra');
        }
      },
    });
  };

  const handleWithdraw = (record: ProjectProposal) => {
    Modal.confirm({
      title: 'Rút đề xuất',
      content: `Bạn có chắc chắn muốn rút đề xuất "${record.title}"?`,
      okText: 'Rút đề xuất',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => {
        const result = await withdrawProjectProposal(record.id);
        if (result.success) {
          message.success('Đã rút đề xuất!');
          tableRef.current?.reload();
        } else {
          message.error(result.message || 'Có lỗi xảy ra');
        }
      },
    });
  };

  const handleDelete = (record: ProjectProposal) => {
    Modal.confirm({
      title: 'Xoá đề xuất',
      content: `Bạn có chắc chắn muốn xoá đề xuất "${record.title}"? Hành động này không thể hoàn tác.`,
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => {
        const result = await deleteProjectProposal(record.id);
        if (result.success) {
          message.success('Đã xoá đề xuất!');
          tableRef.current?.reload();
        } else {
          message.error(result.message || 'Có lỗi xảy ra');
        }
      },
    });
  };

  const handleUnitReview = (record: ProjectProposal) => {
    setReviewProposal(record);
    setUnitReviewVisible(true);
  };

  const handleSciDeptReview = (record: ProjectProposal) => {
    setReviewProposal(record);
    setSciDeptReviewVisible(true);
  };

  // ============ FORM SUBMIT ============

  const handleFormFinish = async (values: any) => {
    const proposalData: Partial<ProjectProposal> = {
      ...values,
      ownerId: currentUserId,
      ownerName: currentUser?.name || 'Người dùng',
      ownerUnit: values.ownerUnit || 'Khoa Công nghệ thông tin',
      ownerEmail: 'user@university.edu.vn',
    };

    let result;
    if (editingProposal) {
      result = await updateProjectProposal(editingProposal.id, proposalData);
      if (result.success) {
        message.success('Cập nhật đề xuất thành công!');
      }
    } else {
      result = await createProjectProposal(proposalData);
      if (result.success) {
        message.success('Tạo đề xuất mới thành công!');
      }
    }

    if (result.success) {
      setFormVisible(false);
      tableRef.current?.reload();
    } else {
      message.error(result.message || 'Có lỗi xảy ra');
    }

    return result.success;
  };

  const handleFormFinishAndSubmit = async (values: any) => {
    const proposalData: Partial<ProjectProposal> = {
      ...values,
      ownerId: currentUserId,
      ownerName: currentUser?.name || 'Người dùng',
      ownerUnit: values.ownerUnit || 'Khoa Công nghệ thông tin',
      ownerEmail: 'user@university.edu.vn',
      status: 'SUBMITTED',
    };

    let result;
    if (editingProposal) {
      result = await updateProjectProposal(editingProposal.id, { ...proposalData, status: 'SUBMITTED' });
    } else {
      result = await createProjectProposal(proposalData);
    }

    if (result.success) {
      message.success(editingProposal ? 'Cập nhật và gửi đề xuất thành công!' : 'Tạo và gửi đề xuất thành công!');
      setFormVisible(false);
      tableRef.current?.reload();
    } else {
      message.error(result.message || 'Có lỗi xảy ra');
    }

    return result.success;
  };

  // ============ UNIT REVIEW SUBMIT ============

  const [unitReviewForm] = Form.useForm();

  const handleUnitReviewSubmit = async () => {
    try {
      const values = await unitReviewForm.validateFields();
      const result = await unitReviewProjectProposal(reviewProposal!.id, {
        unitApproved: values.unitApproved,
        unitComment: values.unitComment,
      });

      if (result.success) {
        message.success('Đã lưu ý kiến đơn vị!');
        setUnitReviewVisible(false);
        unitReviewForm.resetFields();
        tableRef.current?.reload();
      } else {
        message.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Validate failed:', error);
    }
  };

  // ============ SCI DEPT REVIEW SUBMIT ============

  const [sciDeptReviewForm] = Form.useForm();

  const handleSciDeptReviewSubmit = async () => {
    try {
      const values = await sciDeptReviewForm.validateFields();
      const result = await sciDeptReviewProjectProposal(reviewProposal!.id, {
        status: values.status,
        sciDeptPriority: values.sciDeptPriority,
        sciDeptComment: values.sciDeptComment,
      });

      if (result.success) {
        message.success(values.status === 'APPROVED' ? 'Đã phê duyệt đề xuất!' : 'Đã từ chối đề xuất!');
        setSciDeptReviewVisible(false);
        sciDeptReviewForm.resetFields();
        tableRef.current?.reload();
      } else {
        message.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Validate failed:', error);
    }
  };

  // ============ RENDER ============

  return (
    <PageContainer
      header={{
        title: 'Đăng ký đề xuất đề tài',
        subTitle: 'Quản lý các đề xuất đề tài nghiên cứu khoa học - Giai đoạn 1',
      }}
    >
      <ProTable<ProjectProposal>
        actionRef={tableRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1500 }}
        request={async (params, sort) => {
          const queryParams: any = {
            pageSize: params.pageSize,
            current: params.current,
            keyword: params.keyword,
            year: params.year,
            status: params.status,
            level: params.level,
            field: params.field,
          };

          // Filter by role
          if (isResearcher) {
            queryParams.ownerOnly = true;
            queryParams.ownerId = currentUserId;
          } else if (isTruongDonVi) {
            queryParams.unit = currentUserUnit || params.ownerUnit;
          } else {
            queryParams.unit = params.ownerUnit;
          }

          const result = await queryProjectProposals(queryParams);
          return {
            data: result.data,
            total: result.total,
            success: result.success,
          };
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} trên tổng ${total} đề xuất`,
        }}
        toolBarRender={() => [
          canCreate && (
            <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo đề xuất mới
            </Button>
          ),
        ]}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        dateFormatter="string"
      />

      {/* ============ DETAIL DRAWER ============ */}
      <Drawer
        title={selectedProposal?.title || 'Chi tiết đề xuất'}
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Space>
            {selectedProposal && (
              <Tag color={PROPOSAL_STATUS_CONFIG[selectedProposal.status]?.color}>
                {PROPOSAL_STATUS_CONFIG[selectedProposal.status]?.label}
              </Tag>
            )}
          </Space>
        }
      >
        {selectedProposal && (
          <>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Mã đề xuất">{selectedProposal.code}</Descriptions.Item>
              <Descriptions.Item label="Năm">{selectedProposal.year}</Descriptions.Item>
              <Descriptions.Item label="Chủ nhiệm">{selectedProposal.ownerName}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedProposal.ownerEmail || '-'}</Descriptions.Item>
              <Descriptions.Item label="Đơn vị" span={2}>{selectedProposal.ownerUnit}</Descriptions.Item>
              <Descriptions.Item label="Lĩnh vực">{selectedProposal.field}</Descriptions.Item>
              <Descriptions.Item label="Cấp quản lý">
                {LEVEL_OPTIONS.find((l) => l.value === selectedProposal.level)?.label || selectedProposal.level}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian">{selectedProposal.durationMonths} tháng</Descriptions.Item>
              <Descriptions.Item label="Kinh phí đề nghị">
                {selectedProposal.requestedBudgetTotal
                  ? new Intl.NumberFormat('vi-VN').format(selectedProposal.requestedBudgetTotal) + ' VNĐ'
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Từ khóa" span={2}>
                {selectedProposal.keywords?.map((k) => <Tag key={k}>{k}</Tag>) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Thành viên" span={2}>
                {selectedProposal.coAuthors?.join(', ') || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">Nội dung khoa học</Divider>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5}>Mục tiêu</Title>
              <Paragraph>{selectedProposal.objectives || '-'}</Paragraph>
              <Title level={5}>Tóm tắt</Title>
              <Paragraph>{selectedProposal.summary || '-'}</Paragraph>
              {selectedProposal.contentOutline && (
                <>
                  <Title level={5}>Nội dung / Đề cương</Title>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{selectedProposal.contentOutline}</Paragraph>
                </>
              )}
              {selectedProposal.expectedResults && (
                <>
                  <Title level={5}>Kết quả dự kiến</Title>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{selectedProposal.expectedResults}</Paragraph>
                </>
              )}
              {selectedProposal.applicationPotential && (
                <>
                  <Title level={5}>Khả năng ứng dụng</Title>
                  <Paragraph>{selectedProposal.applicationPotential}</Paragraph>
                </>
              )}
              {selectedProposal.requestedBudgetDetail && (
                <>
                  <Title level={5}>Chi tiết kinh phí</Title>
                  <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{selectedProposal.requestedBudgetDetail}</Paragraph>
                </>
              )}
            </Card>

            {(selectedProposal.unitComment || selectedProposal.sciDeptComment) && (
              <>
                <Divider orientation="left">Ý kiến đánh giá</Divider>
                {selectedProposal.unitComment && (
                  <Card size="small" style={{ marginBottom: 16 }}>
                    <Title level={5}>
                      Ý kiến Đơn vị{' '}
                      <Badge
                        status={selectedProposal.unitApproved ? 'success' : 'error'}
                        text={selectedProposal.unitApproved ? 'Đề xuất' : 'Không đề xuất'}
                      />
                    </Title>
                    <Paragraph>{selectedProposal.unitComment}</Paragraph>
                  </Card>
                )}
                {selectedProposal.sciDeptComment && (
                  <Card size="small">
                    <Title level={5}>
                      Ý kiến Phòng KH{' '}
                      {selectedProposal.sciDeptPriority && (
                        <Tag color={PRIORITY_OPTIONS.find((p) => p.value === selectedProposal.sciDeptPriority)?.color}>
                          Ưu tiên: {PRIORITY_OPTIONS.find((p) => p.value === selectedProposal.sciDeptPriority)?.label}
                        </Tag>
                      )}
                    </Title>
                    <Paragraph>{selectedProposal.sciDeptComment}</Paragraph>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </Drawer>

      {/* ============ CREATE/EDIT STEPS FORM ============ */}
      <StepsForm
        formRef={formRef}
        onFinish={handleFormFinish}
        formProps={{
          validateMessages: {
            required: '${label} là bắt buộc',
          },
        }}
        stepsFormRender={(dom, submitter) => (
          <Modal
            title={editingProposal ? 'Chỉnh sửa đề xuất' : 'Tạo đề xuất mới'}
            width={900}
            open={formVisible}
            onCancel={() => setFormVisible(false)}
            footer={submitter}
            destroyOnClose
          >
            {dom}
          </Modal>
        )}
      >
        {/* Step 1: Thông tin chung */}
        <StepsForm.StepForm
          name="basicInfo"
          title="Thông tin chung"
          initialValues={
            editingProposal
              ? editingProposal
              : { year: new Date().getFullYear(), durationMonths: 12, level: 'TRUONG' }
          }
        >
          <ProFormSelect
            name="year"
            label="Năm đề xuất"
            width="sm"
            options={[2024, 2025, 2026].map((y) => ({ label: String(y), value: y }))}
            rules={[{ required: true }]}
          />
          <ProFormText
            name="title"
            label="Tên đề tài"
            placeholder="Nhập tên đề tài đề xuất"
            rules={[{ required: true }, { max: 500, message: 'Tối đa 500 ký tự' }]}
          />
          <ProFormSelect
            name="level"
            label="Cấp quản lý dự kiến"
            width="md"
            options={LEVEL_OPTIONS}
            rules={[{ required: true }]}
          />
          <ProFormSelect
            name="field"
            label="Lĩnh vực"
            width="md"
            options={FIELD_OPTIONS.map((f) => ({ label: f, value: f }))}
            rules={[{ required: true }]}
            showSearch
          />
          <ProFormDigit
            name="durationMonths"
            label="Thời gian thực hiện (tháng)"
            width="sm"
            min={6}
            max={60}
            rules={[{ required: true }]}
          />
          <ProFormSelect
            name="keywords"
            label="Từ khóa"
            mode="tags"
            placeholder="Nhập từ khóa và Enter"
            fieldProps={{
              tokenSeparators: [','],
            }}
          />
        </StepsForm.StepForm>

        {/* Step 2: Nội dung khoa học */}
        <StepsForm.StepForm
          name="scientificContent"
          title="Nội dung khoa học"
          initialValues={editingProposal || {}}
        >
          <ProFormTextArea
            name="objectives"
            label="Mục tiêu nghiên cứu"
            placeholder="Mô tả mục tiêu của đề tài"
            rules={[{ required: true }]}
            fieldProps={{ rows: 3 }}
          />
          <ProFormTextArea
            name="summary"
            label="Tóm tắt đề tài"
            placeholder="Tóm tắt nội dung chính của đề tài"
            rules={[{ required: true }]}
            fieldProps={{ rows: 4 }}
          />
          <ProFormTextArea
            name="contentOutline"
            label="Nội dung / Đề cương chi tiết"
            placeholder="Mô tả chi tiết các nội dung nghiên cứu"
            fieldProps={{ rows: 5 }}
          />
          <ProFormTextArea
            name="expectedResults"
            label="Kết quả / Sản phẩm dự kiến"
            placeholder="Liệt kê các kết quả và sản phẩm dự kiến"
            fieldProps={{ rows: 3 }}
          />
          <ProFormTextArea
            name="applicationPotential"
            label="Khả năng ứng dụng"
            placeholder="Mô tả khả năng ứng dụng của kết quả nghiên cứu"
            fieldProps={{ rows: 3 }}
          />
        </StepsForm.StepForm>

        {/* Step 3: Nhân sự & Kinh phí */}
        <StepsForm.StepForm
          name="personnelBudget"
          title="Nhân sự & Kinh phí"
          initialValues={
            editingProposal || {
              ownerName: currentUser?.name || 'Người dùng',
              ownerUnit: 'Khoa Công nghệ thông tin',
            }
          }
        >
          <ProFormText
            name="ownerName"
            label="Chủ nhiệm đề tài"
            disabled
            tooltip="Thông tin lấy từ tài khoản đăng nhập"
          />
          <ProFormSelect
            name="ownerUnit"
            label="Đơn vị"
            disabled
            options={UNIT_OPTIONS.map((u) => ({ label: u, value: u }))}
          />
          <ProFormSelect
            name="coAuthors"
            label="Thành viên tham gia"
            mode="tags"
            placeholder="Nhập tên thành viên và Enter"
          />
          <ProFormDigit
            name="requestedBudgetTotal"
            label="Kinh phí đề nghị tổng (VNĐ)"
            width="md"
            min={0}
            fieldProps={{
              formatter: (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
              parser: (value) => value!.replace(/\$\s?|(,*)/g, ''),
            }}
          />
          <ProFormTextArea
            name="requestedBudgetDetail"
            label="Mô tả chi tiết kinh phí"
            placeholder="Chi tiết các khoản chi dự kiến"
            fieldProps={{ rows: 4 }}
          />
        </StepsForm.StepForm>
      </StepsForm>

      {/* ============ UNIT REVIEW MODAL ============ */}
      <Modal
        title="Ý kiến Đơn vị"
        open={unitReviewVisible}
        onCancel={() => {
          setUnitReviewVisible(false);
          unitReviewForm.resetFields();
        }}
        onOk={handleUnitReviewSubmit}
        okText="Lưu ý kiến"
        cancelText="Huỷ"
      >
        <Form form={unitReviewForm} layout="vertical">
          <Form.Item
            name="unitApproved"
            label="Quyết định của đơn vị"
            rules={[{ required: true, message: 'Vui lòng chọn' }]}
          >
            <Radio.Group>
              <Radio value={true}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Đề xuất thực hiện
              </Radio>
              <Radio value={false}>
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Không đề xuất
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="unitComment" label="Ý kiến nhận xét">
            <Input.TextArea rows={4} placeholder="Nhập ý kiến nhận xét của đơn vị..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ============ SCI DEPT REVIEW MODAL ============ */}
      <Modal
        title="Sơ duyệt đề xuất"
        open={sciDeptReviewVisible}
        onCancel={() => {
          setSciDeptReviewVisible(false);
          sciDeptReviewForm.resetFields();
        }}
        onOk={handleSciDeptReviewSubmit}
        okText="Xác nhận"
        cancelText="Huỷ"
        width={500}
      >
        <Form form={sciDeptReviewForm} layout="vertical">
          <Form.Item
            name="status"
            label="Quyết định"
            rules={[{ required: true, message: 'Vui lòng chọn quyết định' }]}
          >
            <Radio.Group>
              <Radio value="APPROVED">
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Phê duyệt
              </Radio>
              <Radio value="REJECTED">
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Không phê duyệt
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="sciDeptPriority" label="Mức ưu tiên">
            <Radio.Group>
              {PRIORITY_OPTIONS.map((p) => (
                <Radio key={p.value} value={p.value}>
                  <Tag color={p.color}>{p.label}</Tag>
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item name="sciDeptComment" label="Ý kiến Phòng Khoa học">
            <Input.TextArea rows={4} placeholder="Nhập ý kiến nhận xét..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProjectRegisterPage;
