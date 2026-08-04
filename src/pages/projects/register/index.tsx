/**
 * Danh sách đề xuất đề tài + xử lý Khoa / PKH
 * Form tạo/sửa: /projects/register/form (+ FooterToolbar)
 */
import React, { useEffect, useRef, useState } from 'react';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  Badge,
  Button,
  Drawer,
  Tag,
  Space,
  Descriptions,
  Divider,
  Modal,
  message,
  Typography,
  Form,
  Input,
  Radio,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  DeleteOutlined,
  UndoOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CommentOutlined,
} from '@ant-design/icons';
import { useModel, useAccess, history } from '@umijs/max';
import dayjs from 'dayjs';
import {
  queryProposals,
  getProposal,
  getProposalAudits,
  submitProposal,
  withdrawProposal,
  deleteProposal,
  unitReviewProposal,
  getPendingUnitProposalCount,
  PROPOSAL_STATUS_MAP,
  FIELD_OPTIONS,
  LEVEL_OPTIONS,
  UNIT_OPTIONS,
  PROPOSAL_AUDIT_ACTION_LABEL,
  type ProjectProposal,
  type ProposalStatus,
  type ProposalAudit,
} from '@/services/api/projectProposals';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';

const { Title, Paragraph } = Typography;

const ProjectRegisterPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const access = useAccess();
  const currentUser = initialState?.currentUser as { id?: number | string; name?: string } | undefined;
  const tableRef = useRef<ActionType>();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProjectProposal | null>(null);
  const [audits, setAudits] = useState<ProposalAudit[]>([]);
  const [unitReviewVisible, setUnitReviewVisible] = useState(false);
  const [reviewProposal, setReviewProposal] = useState<ProjectProposal | null>(null);
  const [pendingUnitCount, setPendingUnitCount] = useState(0);
  const [unitReviewForm] = Form.useForm();

  const canCreate = access.canCreateProjectProposal;
  const canUnitReview = access.canUnitReviewProjectProposal;
  const canPkhReview = access.canReviewProjectProposal;
  const hideUnitSearch = !canPkhReview && !canUnitReview;
  const currentUserId = Number(currentUser?.id || 0);

  useEffect(() => {
    if (!canUnitReview) return;
    getPendingUnitProposalCount()
      .then((res) => setPendingUnitCount(res.data?.count || 0))
      .catch(() => setPendingUnitCount(0));
  }, [canUnitReview]);

  const reloadPending = () => {
    if (!canUnitReview) return;
    getPendingUnitProposalCount()
      .then((res) => setPendingUnitCount(res.data?.count || 0))
      .catch(() => undefined);
  };

  const handleView = async (record: ProjectProposal) => {
    const full = await getProposal(record.id);
    setSelectedProposal(full.data || record);
    setDrawerVisible(true);
    try {
      const a = await getProposalAudits(record.id);
      setAudits(a.data || []);
    } catch {
      setAudits([]);
    }
  };

  const handleSubmit = (record: ProjectProposal) => {
    Modal.confirm({
      title: 'Gửi lên Khoa',
      content: `Gửi đề xuất "${record.title}" lên Khoa xác nhận?`,
      okText: 'Gửi',
      onOk: async () => {
        try {
          await submitProposal(record.id);
          message.success('Đã gửi lên Khoa');
          tableRef.current?.reload();
          reloadPending();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Gửi thất bại');
        }
      },
    });
  };

  const handleWithdraw = (record: ProjectProposal) => {
    Modal.confirm({
      title: 'Rút đề xuất',
      content: `Rút đề xuất "${record.title}"?`,
      okText: 'Rút',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await withdrawProposal(record.id);
          message.success('Đã rút đề xuất');
          tableRef.current?.reload();
          reloadPending();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Rút thất bại');
        }
      },
    });
  };

  const handleDelete = (record: ProjectProposal) => {
    Modal.confirm({
      title: 'Xóa nháp',
      content: `Xóa đề xuất "${record.title}"?`,
      okText: 'Xóa',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteProposal(record.id);
          message.success('Đã xóa');
          tableRef.current?.reload();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Xóa thất bại');
        }
      },
    });
  };

  const renderActions = (record: ProjectProposal) => {
    const actions: React.ReactNode[] = [
      <a key="view" onClick={() => void handleView(record)}>
        <EyeOutlined /> Xem
      </a>,
    ];

    if (canCreate && Number(record.ownerId) === currentUserId) {
      if (record.status === 'DRAFT' || record.status === 'RETURNED') {
        actions.push(
          <a key="edit" onClick={() => history.push(`/projects/register/form/${record.id}`)}>
            <EditOutlined /> Sửa
          </a>,
        );
        actions.push(
          <a key="submit" onClick={() => handleSubmit(record)}>
            <SendOutlined /> Gửi Khoa
          </a>,
        );
      }
      if (record.status === 'SUBMITTED') {
        actions.push(
          <a key="withdraw" style={{ color: '#faad14' }} onClick={() => handleWithdraw(record)}>
            <UndoOutlined /> Rút
          </a>,
        );
      }
      if (record.status === 'DRAFT') {
        actions.push(
          <a key="delete" style={{ color: '#ff4d4f' }} onClick={() => handleDelete(record)}>
            <DeleteOutlined /> Xóa
          </a>,
        );
      }
    }

    if (canUnitReview && record.status === 'SUBMITTED') {
      actions.push(
        <a
          key="unit"
          style={{ color: '#1890ff' }}
          onClick={() => {
            setReviewProposal(record);
            setUnitReviewVisible(true);
          }}
        >
          <CommentOutlined /> Xử lý Khoa
        </a>,
      );
    }

    if (
      canPkhReview &&
      (record.status === 'CHO_PKH' ||
        record.status === 'UNIT_REVIEWED' ||
        record.status === 'YEU_CAU_BS' ||
        record.status === 'HOP_LE')
    ) {
      actions.push(
        <a key="pkh" style={{ color: '#52c41a' }} onClick={() => history.push('/projects/pkh-review')}>
          <CheckCircleOutlined /> Xử lý tại PKH
        </a>,
      );
    }

    return <Space size="small">{actions}</Space>;
  };

  const columns: ProColumns<ProjectProposal>[] = [
    { title: 'Mã', dataIndex: 'code', width: 120, copyable: true, hideInSearch: true },
    { title: 'Tên đề tài', dataIndex: 'title', ellipsis: true, hideInSearch: true },
    { title: 'Chủ nhiệm', dataIndex: 'ownerName', width: 140, hideInSearch: true },
    {
      title: 'Đơn vị',
      dataIndex: 'ownerUnit',
      width: 160,
      valueType: 'select',
      fieldProps: { options: UNIT_OPTIONS.map((u) => ({ label: u, value: u })), showSearch: true },
      hideInSearch: hideUnitSearch,
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field',
      width: 140,
      valueType: 'select',
      fieldProps: { options: FIELD_OPTIONS.map((f) => ({ label: f, value: f })), showSearch: true },
    },
    {
      title: 'Cấp / quy trình',
      dataIndex: 'projectProcessTypeId',
      width: 180,
      hideInSearch: true,
      render: (_, r) =>
        r.projectProcessType
          ? `${r.projectProcessType.code}`
          : LEVEL_OPTIONS.find((l) => l.value === r.level)?.label || r.level,
    },
    {
      title: 'Kinh phí',
      dataIndex: 'requestedBudgetTotal',
      width: 110,
      hideInSearch: true,
      render: (_, r) =>
        r.requestedBudgetTotal != null
          ? `${(r.requestedBudgetTotal / 1_000_000).toFixed(0)} tr`
          : '—',
    },
    {
      title: 'Năm',
      dataIndex: 'year',
      width: 80,
      valueType: 'select',
      fieldProps: {
        options: [2024, 2025, 2026, 2027].map((y) => ({ label: String(y), value: y })),
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
      fieldProps: {
        options: Object.entries(PROPOSAL_STATUS_MAP).map(([value, v]) => ({
          label: v.label,
          value,
        })),
      },
      render: (_, r) => {
        const m = PROPOSAL_STATUS_MAP[r.status as ProposalStatus];
        return (
          <Space size={4} wrap>
            <Tag color={m?.color}>{m?.label || r.status}</Tag>
            {r.status === 'DIEU_CHINH' && (
              <Tag color="gold">Cần điều chỉnh</Tag>
            )}
            {r.status === 'DIEU_CHINH' && r.adjustmentDueAt && (
              <Tag color={r.adjustmentOverdue ? 'red' : 'blue'}>
                {r.adjustmentOverdue
                  ? 'Quá hạn'
                  : `Hạn ${dayjs(r.adjustmentDueAt).format('DD/MM')}`}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Từ khóa',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: 'Mã / tên / chủ nhiệm' },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_, r) => renderActions(r),
    },
  ];

  return (
    <PageContainer
      header={{
        title: 'Đăng ký đề xuất đề tài',
        subTitle: 'Nộp hồ sơ trực tuyến · Khoa xác nhận · PKH tiếp nhận',
      }}
    >
      <ProTable<ProjectProposal>
        actionRef={tableRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1280 }}
        request={async (params) => {
          const isCreatorOnly = canCreate && !canUnitReview && !canPkhReview;
          const result = await queryProposals({
            keyword: params.keyword,
            year: params.year,
            status: params.status,
            level: params.level,
            field: params.field,
            unit: params.ownerUnit,
            ownerOnly: isCreatorOnly || undefined,
            page: params.current,
            perPage: params.pageSize,
          });
          return {
            data: result.data,
            total: result.meta?.total || 0,
            success: !!result.success,
          };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        toolBarRender={() => [
          canUnitReview && pendingUnitCount > 0 ? (
            <Badge key="pending" count={pendingUnitCount} offset={[0, 0]}>
              <Tag color="processing">Chờ Khoa xác nhận</Tag>
            </Badge>
          ) : null,
          canPkhReview ? (
            <Button key="pkh" onClick={() => history.push('/projects/pkh-review')}>
              Màn PKH kiểm tra
            </Button>
          ) : null,
          canCreate ? (
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => history.push('/projects/register/form')}
            >
              Nộp hồ sơ đề xuất
            </Button>
          ) : null,
        ]}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
      />

      <Drawer
        title={selectedProposal?.code || 'Chi tiết đề xuất'}
        width={720}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedProposal && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Trạng thái">
                <Tag color={PROPOSAL_STATUS_MAP[selectedProposal.status]?.color}>
                  {PROPOSAL_STATUS_MAP[selectedProposal.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tên đề tài">{selectedProposal.title}</Descriptions.Item>
              <Descriptions.Item label="Chủ nhiệm">
                {selectedProposal.ownerName} · {selectedProposal.ownerUnit}
              </Descriptions.Item>
              <Descriptions.Item label="Cấp / quy trình">
                {selectedProposal.projectProcessType
                  ? `${selectedProposal.projectProcessType.code}: ${selectedProposal.projectProcessType.name}`
                  : LEVEL_OPTIONS.find((l) => l.value === selectedProposal.level)?.label ||
                    selectedProposal.level}
                {' · '}
                {selectedProposal.field}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian / kinh phí">
                {selectedProposal.durationMonths} tháng ·{' '}
                {selectedProposal.requestedBudgetTotal != null
                  ? `${selectedProposal.requestedBudgetTotal.toLocaleString('vi-VN')} đ`
                  : '—'}
              </Descriptions.Item>
              {selectedProposal.researchDirection && (
                <Descriptions.Item label="Hướng NC">
                  {selectedProposal.researchDirection}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Mục tiêu">{selectedProposal.objectives}</Descriptions.Item>
              <Descriptions.Item label="Sản phẩm dự kiến">
                {selectedProposal.expectedResults || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Thành viên">
                {(selectedProposal.coAuthors || []).join(', ') || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="File biểu mẫu">
                {selectedProposal.attachmentUrl ? (
                  <a
                    href={resolvePublicAssetUrl(selectedProposal.attachmentUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Tải / xem file
                  </a>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              {selectedProposal.unitComment && (
                <Descriptions.Item label="Phản hồi Khoa">
                  {selectedProposal.unitComment}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />
            <Title level={5}>Lịch sử trạng thái</Title>
            <Timeline
              items={audits.map((a) => ({
                children: (
                  <div>
                    <strong>{PROPOSAL_AUDIT_ACTION_LABEL[a.action] || a.action}</strong>
                    {a.fromStatus || a.toStatus
                      ? ` · ${a.fromStatus || '—'} → ${a.toStatus || '—'}`
                      : ''}
                    {a.actorName ? ` — ${a.actorName}` : ''}
                    <div style={{ color: '#888', fontSize: 12 }}>
                      {a.createdAt ? dayjs(a.createdAt).format('DD/MM/YYYY HH:mm') : ''}
                    </div>
                    {a.note && <Paragraph style={{ marginBottom: 0 }}>{a.note}</Paragraph>}
                  </div>
                ),
              }))}
            />
            {!audits.length && <div style={{ color: '#999' }}>Chưa có lịch sử.</div>}
          </>
        )}
      </Drawer>

      <Modal
        title="Khoa xử lý hồ sơ"
        open={unitReviewVisible}
        onCancel={() => {
          setUnitReviewVisible(false);
          unitReviewForm.resetFields();
        }}
        onOk={async () => {
          const values = await unitReviewForm.validateFields();
          try {
            await unitReviewProposal(reviewProposal!.id, {
              unitApproved: values.unitApproved,
              unitComment: values.unitComment,
            });
            message.success(
              values.unitApproved ? 'Đã xác nhận — chuyển chờ PKH' : 'Đã trả lại giảng viên',
            );
            setUnitReviewVisible(false);
            unitReviewForm.resetFields();
            tableRef.current?.reload();
            reloadPending();
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
          }
        }}
        okText="Xác nhận"
      >
        <Form form={unitReviewForm} layout="vertical">
          <Form.Item
            name="unitApproved"
            label="Quyết định"
            rules={[{ required: true, message: 'Chọn quyết định' }]}
          >
            <Radio.Group>
              <Radio value={true}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Xác nhận hồ sơ (→ Chờ PKH)
              </Radio>
              <Radio value={false}>
                <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Trả lại giảng viên chỉnh sửa
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="unitComment"
            label="Nội dung / yêu cầu chỉnh sửa"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập nhận xét..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProjectRegisterPage;
