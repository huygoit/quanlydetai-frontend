/**
 * US-03-03 — PKH kiểm tra, tổng hợp và chuẩn bị họp Hội đồng xét chọn
 * Thao tác Hợp lệ / Bổ sung / Loại nằm trong drawer xem chi tiết (không trên list).
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  message,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FieldTimeOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  queryProposals,
  getProposal,
  getPkhProposalStats,
  markProposalValid,
  requestProposalSupplement,
  extendProposalSupplement,
  rejectProposalByPkh,
  exportPkhProposalsExcel,
  PROPOSAL_STATUS_MAP,
  LEVEL_OPTIONS,
  type ProjectProposal,
  type ProposalStatus,
  type PkhProposalStats,
} from '@/services/api/projectProposals';
import { listCallForProposals, type CallForProposal } from '@/services/api/callForProposals';
import { downloadBlob } from '@/utils/download';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { formatVnd } from '@/utils/format';

/** Trạng thái thuộc pipeline PKH (không gồm Chờ Khoa / nháp) */
const PKH_LIST_STATUSES: ProposalStatus[] = ['CHO_PKH', 'HOP_LE', 'YEU_CAU_BS', 'DA_LOAI'];

const PkhReviewPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [cfpList, setCfpList] = useState<CallForProposal[]>([]);
  const [cfpId, setCfpId] = useState<number | undefined>();
  const [stats, setStats] = useState<PkhProposalStats | null>(null);
  /** 'ALL' = Tất cả status PKH (không gồm Chờ Khoa) */
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'ALL'>('CHO_PKH');
  const [loadingStats, setLoadingStats] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [acting, setActing] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ProjectProposal | null>(null);

  const [supplementOpen, setSupplementOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [current, setCurrent] = useState<ProjectProposal | null>(null);
  const [supplementForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [extendForm] = Form.useForm();

  useEffect(() => {
    listCallForProposals()
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? (res as any) : [];
        setCfpList(rows);
        if (rows.length && !cfpId) setCfpId(Number(rows[0].id));
      })
      .catch(() => setCfpList([]));
  }, []);

  const loadStats = async (id?: number) => {
    if (!id) {
      setStats(null);
      return;
    }
    setLoadingStats(true);
    try {
      const res = await getPkhProposalStats(id);
      setStats(res.data || null);
    } catch (e: any) {
      message.error(e?.message || 'Không tải được thống kê');
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    void loadStats(cfpId);
    actionRef.current?.reload();
  }, [cfpId]);

  if (!access.canReviewProjectProposal) {
    return <PageContainer>Bạn không có quyền thao tác màn hình PKH.</PageContainer>;
  }

  const refreshAll = () => {
    void loadStats(cfpId);
    actionRef.current?.reload();
  };

  const coTheXuLyPkh = (p: ProjectProposal | null | undefined) =>
    p?.status === 'CHO_PKH' || p?.status === 'UNIT_REVIEWED';

  const moChiTiet = async (record: ProjectProposal) => {
    try {
      const full = await getProposal(record.id);
      setSelected(full.data || record);
    } catch {
      setSelected(record);
    }
    setDrawerOpen(true);
  };

  const taiLaiChiTiet = async (id: number) => {
    refreshAll();
    if (drawerOpen && selected?.id === id) {
      try {
        const full = await getProposal(id);
        setSelected(full.data || null);
      } catch {
        /* giữ bản cũ */
      }
    }
  };

  const handleMarkValid = (record: ProjectProposal) => {
    Modal.confirm({
      title: 'Xác nhận hợp lệ',
      content: 'Bạn có chắc muốn đánh dấu đề xuất này là Hợp lệ?',
      okText: 'Hợp lệ',
      cancelText: 'Hủy',
      onOk: async () => {
        setActing(true);
        try {
          await markProposalValid(record.id);
          message.success('Đã xác nhận hợp lệ');
          await taiLaiChiTiet(record.id);
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
          throw e;
        } finally {
          setActing(false);
        }
      },
    });
  };

  const nutXuLyPkh = (record: ProjectProposal | null) => {
    if (!record || !coTheXuLyPkh(record)) return null;
    return (
      <Space size={8} wrap>
        <Button
          type="primary"
          size="small"
          icon={<CheckOutlined />}
          loading={acting}
          onClick={() => handleMarkValid(record)}
        >
          Hợp lệ
        </Button>
        <Button
          size="small"
          icon={<EditOutlined />}
          loading={acting}
          onClick={() => {
            setCurrent(record);
            supplementForm.resetFields();
            setSupplementOpen(true);
          }}
        >
          Bổ sung
        </Button>
        <Button
          danger
          size="small"
          icon={<CloseOutlined />}
          loading={acting}
          onClick={() => {
            setCurrent(record);
            rejectForm.resetFields();
            setRejectOpen(true);
          }}
        >
          Loại
        </Button>
      </Space>
    );
  };

  const columns: ProColumns<ProjectProposal>[] = [
    { title: 'Mã', dataIndex: 'code', width: 120, copyable: true },
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, r) => <a onClick={() => void moChiTiet(r)}>{r.title}</a>,
    },
    { title: 'Chủ nhiệm', dataIndex: 'ownerName', width: 140 },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 160, ellipsis: true },
    {
      title: 'Phân cấp',
      width: 160,
      ellipsis: true,
      render: (_, r) =>
        r.projectProcessType
          ? `${r.projectProcessType.code} ${r.projectProcessType.name}`
          : r.level,
    },
    {
      title: 'Kinh phí',
      dataIndex: 'requestedBudgetTotal',
      width: 120,
      render: (_, r) =>
        r.requestedBudgetTotal != null
          ? formatVnd(r.requestedBudgetTotal)
          : '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      render: (_, r) => {
        const meta = PROPOSAL_STATUS_MAP[r.status] || { label: r.status, color: 'default' };
        return (
          <Space direction="vertical" size={0}>
            <Tag color={meta.color}>{meta.label}</Tag>
            {r.supplementOverdue && <Tag color="red">Quá hạn bổ sung</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 140,
      render: (_, r) => {
        const acts: React.ReactNode[] = [
          <a key="view" onClick={() => void moChiTiet(r)}>
            <EyeOutlined /> Xem
          </a>,
        ];
        // Gia hạn chỉ khi đang yêu cầu bổ sung — thao tác phụ trên list vẫn ổn
        if (r.status === 'YEU_CAU_BS') {
          acts.push(
            <a
              key="extend"
              onClick={() => {
                setCurrent(r);
                extendForm.setFieldsValue({
                  dueAt: r.supplementDueAt ? dayjs(r.supplementDueAt) : dayjs().add(3, 'day'),
                });
                setExtendOpen(true);
              }}
            >
              <FieldTimeOutlined /> Gia hạn
            </a>,
          );
        }
        return acts;
      },
    },
  ];

  return (
    <PageContainer title="Kiểm duyệt và tổng hợp đề xuất đề tài">
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card size="small">
          <Space wrap>
            <span>Kỳ tiếp nhận:</span>
            <Select
              style={{ minWidth: 360 }}
              placeholder="Chọn kỳ CFP"
              value={cfpId}
              onChange={(v) => setCfpId(v)}
              options={cfpList.map((c) => ({
                value: c.id,
                label: `${c.title} (${c.periodLabel}) — ${c.status}`,
              }))}
              showSearch
              optionFilterProp="label"
            />
            <Select
              placeholder="Lọc trạng thái"
              style={{ width: 180 }}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                actionRef.current?.reload();
              }}
              options={[
                { value: 'ALL', label: 'Tất cả' },
                { value: 'CHO_PKH', label: 'Chờ PKH' },
                { value: 'YEU_CAU_BS', label: 'Yêu cầu bổ sung' },
                { value: 'HOP_LE', label: 'Hợp lệ' },
                { value: 'DA_LOAI', label: 'Đã loại' },
              ]}
            />
            <Button
              icon={<DownloadOutlined />}
              loading={exporting}
              disabled={!cfpId}
              onClick={async () => {
                if (!cfpId) return;
                setExporting(true);
                try {
                  const blob = await exportPkhProposalsExcel(cfpId);
                  downloadBlob(blob, `danh-muc-hop-le-cfp-${cfpId}.xlsx`);
                  message.success('Đã tải Excel danh mục hợp lệ');
                } catch (e: any) {
                  message.error(e?.message || 'Xuất Excel thất bại');
                } finally {
                  setExporting(false);
                }
              }}
            >
              Tổng hợp danh mục
            </Button>
            <Button
              type="primary"
              icon={<TeamOutlined />}
              onClick={() => history.push('/projects/selection-sessions')}
            >
              Hội đồng xét chọn
            </Button>
          </Space>
        </Card>

        <Row gutter={16}>
          <Col xs={12} md={4}>
            <Card loading={loadingStats} size="small">
              <Statistic title="Đã nhận" value={stats?.totalReceived ?? 0} />
            </Card>
          </Col>
          <Col xs={12} md={5}>
            <Card loading={loadingStats} size="small">
              <Statistic title="Chờ PKH" value={stats?.choPkh ?? 0} />
            </Card>
          </Col>
          <Col xs={12} md={5}>
            <Card loading={loadingStats} size="small">
              <Statistic title="Hợp lệ" value={stats?.hopLe ?? 0} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col xs={12} md={5}>
            <Card loading={loadingStats} size="small">
              <Statistic
                title="Chờ bổ sung"
                value={stats?.choBoSung ?? 0}
                valueStyle={{ color: '#d46b08' }}
              />
            </Card>
          </Col>
          <Col xs={12} md={5}>
            <Card loading={loadingStats} size="small">
              <Statistic
                title="Đã loại"
                value={stats?.daLoai ?? 0}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <ProTable<ProjectProposal>
          actionRef={actionRef}
          rowKey="id"
          columns={columns}
          search={false}
          pagination={{ pageSize: 10 }}
          params={{ cfpId, statusFilter }}
          request={async (params) => {
            if (!cfpId) return { data: [], success: true, total: 0 };
            const res = await queryProposals({
              callForProposalId: cfpId,
              // Tất cả = pipeline PKH; không gồm Chờ Khoa (SUBMITTED)
              ...(statusFilter === 'ALL'
                ? { statuses: PKH_LIST_STATUSES.join(',') }
                : { status: statusFilter }),
              page: params.current,
              perPage: params.pageSize,
            });
            return {
              data: res.data || [],
              success: true,
              total: res.meta?.total ?? res.data?.length ?? 0,
            };
          }}
        />
      </Space>

      <Drawer
        title={
          selected?.id ? (
            <a onClick={() => history.push(`/projects/register/form/${selected.id}`)}>
              {selected.code || 'Chi tiết đề xuất'}
            </a>
          ) : (
            selected?.code || 'Chi tiết đề xuất'
          )
        }
        width="66.666vw"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
        extra={
          coTheXuLyPkh(selected) ? (
            nutXuLyPkh(selected)
          ) : selected?.status === 'YEU_CAU_BS' ? (
            <Space size={8} wrap>
              <Button
                size="small"
                icon={<FieldTimeOutlined />}
                onClick={() => {
                  setCurrent(selected);
                  extendForm.setFieldsValue({
                    dueAt: selected.supplementDueAt
                      ? dayjs(selected.supplementDueAt)
                      : dayjs().add(3, 'day'),
                  });
                  setExtendOpen(true);
                }}
              >
                Gia hạn
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseOutlined />}
                onClick={() => {
                  setCurrent(selected);
                  rejectForm.resetFields();
                  setRejectOpen(true);
                }}
              >
                Loại
              </Button>
            </Space>
          ) : null
        }
      >
        {selected && (
          <Descriptions
            column={1}
            bordered
            size="small"
            labelStyle={{ width: 200, maxWidth: 200 }}
          >
            <Descriptions.Item label="Trạng thái">
              <Tag color={PROPOSAL_STATUS_MAP[selected.status]?.color}>
                {PROPOSAL_STATUS_MAP[selected.status]?.label}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tên đề tài">{selected.title}</Descriptions.Item>
            <Descriptions.Item label="Chủ nhiệm">
              {selected.ownerName} · {selected.ownerUnit}
            </Descriptions.Item>
            <Descriptions.Item label="Cấp / quy trình">
              {selected.projectProcessType
                ? `${selected.projectProcessType.code} ${selected.projectProcessType.name}`
                : LEVEL_OPTIONS.find((l) => l.value === selected.level)?.label || selected.level}
              {' · '}
              {selected.field}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian / kinh phí">
              {selected.durationMonths} tháng ·{' '}
              {selected.requestedBudgetTotal != null
                ? formatVnd(selected.requestedBudgetTotal)
                : '—'}
            </Descriptions.Item>
            {selected.researchDirection && (
              <Descriptions.Item label="Hướng NC">{selected.researchDirection}</Descriptions.Item>
            )}
            <Descriptions.Item label="Mục tiêu">{selected.objectives}</Descriptions.Item>
            <Descriptions.Item label="Tóm tắt">{selected.summary || '—'}</Descriptions.Item>
            <Descriptions.Item label="Sản phẩm dự kiến">
              {selected.expectedResults || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Thành viên">
              {(selected.coAuthors || []).join(', ') || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="File biểu mẫu">
              {selected.attachmentUrl ? (
                <a
                  href={resolvePublicAssetUrl(selected.attachmentUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Tải / xem file
                </a>
              ) : (
                '—'
              )}
            </Descriptions.Item>
            {selected.unitComment && (
              <Descriptions.Item label="Phản hồi Khoa">{selected.unitComment}</Descriptions.Item>
            )}
            {selected.pkhComment && (
              <Descriptions.Item label="Ghi chú PKH">{selected.pkhComment}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title="Yêu cầu bổ sung hồ sơ"
        open={supplementOpen}
        onCancel={() => setSupplementOpen(false)}
        confirmLoading={acting}
        onOk={async () => {
          const v = await supplementForm.validateFields();
          if (!current) return;
          setActing(true);
          try {
            await requestProposalSupplement(current.id, v.note);
            message.success('Đã gửi yêu cầu bổ sung');
            setSupplementOpen(false);
            await taiLaiChiTiet(current.id);
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
          } finally {
            setActing(false);
          }
        }}
        destroyOnClose
      >
        <Form form={supplementForm} layout="vertical">
          <Form.Item
            name="note"
            label="Nội dung yêu cầu bổ sung"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Loại hồ sơ"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        okButtonProps={{ danger: true }}
        confirmLoading={acting}
        onOk={async () => {
          const v = await rejectForm.validateFields();
          if (!current) return;
          setActing(true);
          try {
            await rejectProposalByPkh(current.id, v.reason);
            message.success('Đã loại hồ sơ');
            setRejectOpen(false);
            await taiLaiChiTiet(current.id);
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
          } finally {
            setActing(false);
          }
        }}
        destroyOnClose
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" label="Lý do loại" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Gia hạn bổ sung"
        open={extendOpen}
        onCancel={() => setExtendOpen(false)}
        onOk={async () => {
          const v = await extendForm.validateFields();
          if (!current) return;
          try {
            await extendProposalSupplement(current.id, {
              dueAt: (v.dueAt as dayjs.Dayjs).toISOString(),
              reason: v.reason,
            });
            message.success('Đã gia hạn');
            setExtendOpen(false);
            await taiLaiChiTiet(current.id);
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
          }
        }}
        destroyOnClose
      >
        <Form form={extendForm} layout="vertical">
          <Form.Item name="dueAt" label="Hạn mới" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Lý do (tuỳ chọn)">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PkhReviewPage;
