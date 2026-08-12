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
  FormOutlined,
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
  unitReturnProposal,
  getPendingUnitProposalCount,
  PROPOSAL_STATUS_MAP,
  LEVEL_OPTIONS,
  PROPOSAL_AUDIT_ACTION_LABEL,
  type ProjectProposal,
  type ProposalStatus,
  type ProposalAudit,
} from '@/services/api/projectProposals';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { formatVnd } from '@/utils/format';
import { openOrCreateOutlineFromProposal } from '@/services/api/projectOutlines';
import {
  loadDepartmentSelectOptions,
  loadFieldSelectOptions,
  loadProjectLevelOptions,
  type SelectOption,
} from '@/utils/researchCatalogOptions';

const { Title, Paragraph } = Typography;

const ProjectRegisterPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const access = useAccess();
  const currentUser = initialState?.currentUser as { id?: number | string; name?: string } | undefined;
  const tableRef = useRef<ActionType>();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProjectProposal | null>(null);
  const [audits, setAudits] = useState<ProposalAudit[]>([]);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnTarget, setReturnTarget] = useState<ProjectProposal | null>(null);
  const [pendingUnitCount, setPendingUnitCount] = useState(0);
  const [unitActing, setUnitActing] = useState(false);
  const [returnForm] = Form.useForm();
  const [unitOptions, setUnitOptions] = useState<SelectOption[]>([]);
  const [fieldOptions, setFieldOptions] = useState<SelectOption[]>([]);
  const [levelOptions, setLevelOptions] = useState(LEVEL_OPTIONS);

  // Tải đơn vị / lĩnh vực / cấp từ danh mục
  useEffect(() => {
    void (async () => {
      const [units, fields, levels] = await Promise.all([
        loadDepartmentSelectOptions(),
        loadFieldSelectOptions(),
        loadProjectLevelOptions(),
      ]);
      setUnitOptions(units);
      setFieldOptions(fields);
      if (levels.options.length > 0) {
        setLevelOptions(
          levels.options.map((o) => ({
            value: o.value as ProjectProposal['level'],
            label: o.label,
          })),
        );
      }
    })();
  }, []);

  const canCreate = access.canCreateProjectProposal;
  const canUnitReview = access.canUnitReviewProjectProposal;
  const canPkhReview = access.canReviewProjectProposal;
  const hideUnitSearch = !canPkhReview && !canUnitReview;
  const currentUserId = Number(currentUser?.id || 0);

  /** Trưởng đơn vị xử lý khi hồ sơ đang Chờ Khoa */
  const coTheXuLyKhoa = (p: ProjectProposal | null | undefined) =>
    Boolean(canUnitReview) && (p?.status === 'SUBMITTED' || p?.status === 'UNIT_REVIEWED');

  const nutXuLyKhoa = (record: ProjectProposal | null) => {
    if (!record || !coTheXuLyKhoa(record)) return null;
    return (
      <Space size={8} wrap>
        <Button
          danger
          size="small"
          icon={<CloseCircleOutlined />}
          loading={unitActing}
          onClick={() => openUnitReturn(record)}
        >
          Yêu cầu chỉnh sửa
        </Button>
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          loading={unitActing}
          onClick={() => handleUnitApprove(record)}
        >
          Duyệt
        </Button>
      </Space>
    );
  };

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

  const sauKhiXuLyKhoa = async (proposalId: number) => {
    tableRef.current?.reload();
    reloadPending();
    if (drawerVisible && selectedProposal?.id === proposalId) {
      try {
        const full = await getProposal(proposalId);
        setSelectedProposal(full.data || null);
        const a = await getProposalAudits(proposalId);
        setAudits(a.data || []);
      } catch {
        /* giữ bản cũ trên drawer */
      }
    }
  };

  /** Khoa duyệt → Chờ PKH */
  const handleUnitApprove = (record: ProjectProposal) => {
    Modal.confirm({
      title: 'Xác nhận duyệt',
      content: 'Bạn có chắc là muốn duyệt đề xuất này không?',
      okText: 'Duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        setUnitActing(true);
        try {
          await unitReviewProposal(record.id, {
            unitApproved: true,
            unitComment: 'Khoa đã duyệt đề xuất',
          });
          message.success('Đã duyệt — chuyển chờ PKH');
          await sauKhiXuLyKhoa(record.id);
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Duyệt thất bại');
          throw e;
        } finally {
          setUnitActing(false);
        }
      },
    });
  };

  /** Mở popup yêu cầu chỉnh sửa */
  const openUnitReturn = (record: ProjectProposal) => {
    setReturnTarget(record);
    returnForm.resetFields();
    setReturnOpen(true);
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
      content: `Rút đề xuất "${record.title}" về trạng thái Nháp để chỉnh sửa và gửi lại?`,
      okText: 'Rút về Nháp',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await withdrawProposal(record.id);
          message.success('Đã rút về Nháp');
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
      // GV có đề xuất Được chọn → vào soạn thuyết minh ngay từ danh sách
      if (record.status === 'DUOC_CHON' && record.canWriteOutline) {
        actions.push(
          <a
            key="outline"
            style={{ color: '#1677ff', fontWeight: 600 }}
            onClick={() => {
              void (async () => {
                try {
                  const res = await openOrCreateOutlineFromProposal(record.id);
                  if (res.data?.id) {
                    history.push(`/projects/outlines/form/${res.data.id}`);
                  }
                } catch (e: any) {
                  message.error(
                    e?.data?.message || e?.message || 'Không mở được thuyết minh',
                  );
                }
              })();
            }}
          >
            <FormOutlined /> Soạn thuyết minh
          </a>,
        );
      }
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
      fieldProps: { options: unitOptions, showSearch: true, optionFilterProp: 'label' },
      hideInSearch: hideUnitSearch,
    },
    {
      title: 'Lĩnh vực',
      dataIndex: 'field',
      width: 140,
      valueType: 'select',
      fieldProps: { options: fieldOptions, showSearch: true, optionFilterProp: 'label' },
    },
    {
      title: 'Cấp ý tưởng/đề tài',
      dataIndex: 'projectProcessTypeId',
      width: 180,
      hideInSearch: true,
      render: (_, r) =>
        r.projectProcessType
          ? `${r.projectProcessType.code} ${r.projectProcessType.name}`
          : levelOptions.find((l) => l.value === r.level)?.label || r.level,
    },
    {
      title: 'Kinh phí',
      dataIndex: 'requestedBudgetTotal',
      width: 150,
      hideInSearch: true,
      render: (_, r) =>
        r.requestedBudgetTotal != null ? formatVnd(r.requestedBudgetTotal) : '—',
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
    <PageContainer header={{ title: 'Đăng ký đề xuất đề tài' }}>
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
        width="66.666vw"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose
        extra={nutXuLyKhoa(selectedProposal)}
      >
        {selectedProposal && (
          <>
            {canUnitReview &&
              selectedProposal.status !== 'SUBMITTED' &&
              selectedProposal.status !== 'UNIT_REVIEWED' && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    background: '#fffbe6',
                    border: '1px solid #ffe58f',
                    borderRadius: 8,
                    color: '#876800',
                  }}
                >
                  Nút Duyệt / Yêu cầu chỉnh sửa chỉ hiện khi đề xuất ở trạng thái{' '}
                  <strong>Chờ Khoa</strong> (hiện tại:{' '}
                  {PROPOSAL_STATUS_MAP[selectedProposal.status]?.label || selectedProposal.status}).
                </div>
              )}
            <Descriptions
              column={1}
              bordered
              size="small"
              labelStyle={{ width: 200, maxWidth: 200 }}
            >
              <Descriptions.Item label="Trạng thái">
                <Tag color={PROPOSAL_STATUS_MAP[selectedProposal.status]?.color}>
                  {PROPOSAL_STATUS_MAP[selectedProposal.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tên đề tài">{selectedProposal.title}</Descriptions.Item>
              <Descriptions.Item label="Chủ nhiệm">
                {selectedProposal.ownerName} · {selectedProposal.ownerUnit}
              </Descriptions.Item>
              <Descriptions.Item label="Cấp ý tưởng/đề tài">
                {selectedProposal.projectProcessType
                  ? `${selectedProposal.projectProcessType.code} ${selectedProposal.projectProcessType.name}`
                  : levelOptions.find((l) => l.value === selectedProposal.level)?.label ||
                    selectedProposal.level}
                {' · '}
                {selectedProposal.field}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian / kinh phí">
                {selectedProposal.durationMonths} tháng ·{' '}
                {selectedProposal.requestedBudgetTotal != null
                  ? formatVnd(selectedProposal.requestedBudgetTotal)
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
        title="Yêu cầu chỉnh sửa đề xuất"
        open={returnOpen}
        onCancel={() => {
          setReturnOpen(false);
          returnForm.resetFields();
        }}
        confirmLoading={unitActing}
        okText="Gửi yêu cầu"
        okButtonProps={{ danger: true }}
        onOk={async () => {
          const values = await returnForm.validateFields();
          if (!returnTarget) return;
          setUnitActing(true);
          try {
            await unitReturnProposal(returnTarget.id, values.reason);
            message.success('Đã gửi yêu cầu chỉnh sửa cho giảng viên');
            setReturnOpen(false);
            returnForm.resetFields();
            await sauKhiXuLyKhoa(returnTarget.id);
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
          } finally {
            setUnitActing(false);
          }
        }}
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item
            name="reason"
            label="Nội dung yêu cầu chỉnh sửa"
            rules={[{ required: true, message: 'Nhập nội dung yêu cầu chỉnh sửa' }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Mô tả các điểm cần chỉnh sửa..."
              maxLength={2000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProjectRegisterPage;
