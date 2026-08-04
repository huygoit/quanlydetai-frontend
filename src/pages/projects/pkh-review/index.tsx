/**
 * US-03-03 — PKH kiểm tra, tổng hợp và chuẩn bị họp Hội đồng xét chọn
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Button,
  Card,
  Col,
  DatePicker,
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
  FieldTimeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  queryProposals,
  getPkhProposalStats,
  markProposalValid,
  requestProposalSupplement,
  extendProposalSupplement,
  rejectProposalByPkh,
  exportPkhProposalsExcel,
  createProposalSelectionSession,
  PROPOSAL_STATUS_MAP,
  type ProjectProposal,
  type ProposalStatus,
  type PkhProposalStats,
} from '@/services/api/projectProposals';
import { listCallForProposals, type CallForProposal } from '@/services/api/callForProposals';
import { downloadBlob } from '@/utils/download';

const PkhReviewPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [cfpList, setCfpList] = useState<CallForProposal[]>([]);
  const [cfpId, setCfpId] = useState<number | undefined>();
  const [stats, setStats] = useState<PkhProposalStats | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | undefined>();
  const [loadingStats, setLoadingStats] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [supplementOpen, setSupplementOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [current, setCurrent] = useState<ProjectProposal | null>(null);
  const [supplementForm] = Form.useForm();
  const [rejectForm] = Form.useForm();
  const [extendForm] = Form.useForm();
  const [sessionForm] = Form.useForm();

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

  const columns: ProColumns<ProjectProposal>[] = [
    { title: 'Mã', dataIndex: 'code', width: 120, copyable: true },
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, r) => (
        <a onClick={() => history.push(`/projects/register/form/${r.id}`)}>{r.title}</a>
      ),
    },
    { title: 'Chủ nhiệm', dataIndex: 'ownerName', width: 140 },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 160, ellipsis: true },
    {
      title: 'Phân cấp',
      width: 160,
      ellipsis: true,
      render: (_, r) =>
        r.projectProcessType
          ? `${r.projectProcessType.code}: ${r.projectProcessType.name}`
          : r.level,
    },
    {
      title: 'Kinh phí',
      dataIndex: 'requestedBudgetTotal',
      width: 120,
      render: (_, r) =>
        r.requestedBudgetTotal != null
          ? Number(r.requestedBudgetTotal).toLocaleString('vi-VN')
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
      width: 280,
      render: (_, r) => {
        const acts: React.ReactNode[] = [
          <a key="view" onClick={() => history.push(`/projects/register/form/${r.id}`)}>
            Xem
          </a>,
        ];
        if (r.status === 'CHO_PKH' || r.status === 'UNIT_REVIEWED') {
          acts.push(
            <a
              key="ok"
              onClick={async () => {
                try {
                  await markProposalValid(r.id);
                  message.success('Đã xác nhận hợp lệ');
                  refreshAll();
                } catch (e: any) {
                  message.error(e?.data?.message || e?.message || 'Thất bại');
                }
              }}
            >
              <CheckOutlined /> Hợp lệ
            </a>,
            <a
              key="bs"
              onClick={() => {
                setCurrent(r);
                supplementForm.resetFields();
                setSupplementOpen(true);
              }}
            >
              <EditOutlined /> Bổ sung
            </a>,
            <a
              key="loai"
              style={{ color: '#ff4d4f' }}
              onClick={() => {
                setCurrent(r);
                rejectForm.resetFields();
                setRejectOpen(true);
              }}
            >
              <CloseOutlined /> Loại
            </a>,
          );
        }
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
            <a
              key="loai2"
              style={{ color: '#ff4d4f' }}
              onClick={() => {
                setCurrent(r);
                rejectForm.resetFields();
                setRejectOpen(true);
              }}
            >
              Loại
            </a>,
          );
        }
        return acts;
      },
    },
  ];

  return (
    <PageContainer title="PKH — Kiểm tra & tổng hợp đề xuất">
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
              allowClear
              placeholder="Lọc trạng thái"
              style={{ width: 180 }}
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                actionRef.current?.reload();
              }}
              options={[
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
              icon={<PlusOutlined />}
              disabled={!cfpId}
              onClick={() => {
                sessionForm.resetFields();
                sessionForm.setFieldsValue({
                  meetingAt: dayjs().add(10, 'day').hour(8).minute(0),
                  location: '',
                });
                setSessionOpen(true);
              }}
            >
              Tạo phiên xét chọn
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
              status: statusFilter,
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

      <Modal
        title="Yêu cầu bổ sung hồ sơ"
        open={supplementOpen}
        onCancel={() => setSupplementOpen(false)}
        onOk={async () => {
          const v = await supplementForm.validateFields();
          if (!current) return;
          try {
            await requestProposalSupplement(current.id, v.note);
            message.success('Đã gửi yêu cầu bổ sung');
            setSupplementOpen(false);
            refreshAll();
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
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
        onOk={async () => {
          const v = await rejectForm.validateFields();
          if (!current) return;
          try {
            await rejectProposalByPkh(current.id, v.reason);
            message.success('Đã loại hồ sơ');
            setRejectOpen(false);
            refreshAll();
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
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
            refreshAll();
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

      <Modal
        title="Tạo phiên xét chọn"
        open={sessionOpen}
        onCancel={() => setSessionOpen(false)}
        onOk={async () => {
          const v = await sessionForm.validateFields();
          if (!cfpId) return;
          const meetingAt = (v.meetingAt as dayjs.Dayjs).toISOString();
          try {
            const res = await createProposalSelectionSession({
              callForProposalId: cfpId,
              meetingAt,
              location: v.location,
              forceConfirm: false,
            });
            message.success('Đã tạo phiên xét chọn');
            setSessionOpen(false);
            const newId = Number((res?.data as { id?: number })?.id);
            history.push(
              Number.isFinite(newId) && newId > 0
                ? `/projects/selection-sessions/${newId}`
                : '/projects/selection-sessions',
            );
          } catch (e: any) {
            const code = e?.data?.code || e?.code;
            if (code === 'LESS_THAN_5_BUSINESS_DAYS' || e?.data?.warning) {
              Modal.confirm({
                title: 'Cảnh báo thời hạn thư mời',
                content:
                  e?.data?.message ||
                  'Ít hơn 5 ngày làm việc trước ngày họp. Vẫn tạo phiên (xác nhận ngoại lệ)?',
                onOk: async () => {
                  const res = await createProposalSelectionSession({
                    callForProposalId: cfpId,
                    meetingAt,
                    location: v.location,
                    forceConfirm: true,
                  });
                  message.success('Đã tạo phiên (ngoại lệ < 5 ngày LV)');
                  setSessionOpen(false);
                  const newId = Number((res?.data as { id?: number })?.id);
                  history.push(
                    Number.isFinite(newId) && newId > 0
                      ? `/projects/selection-sessions/${newId}`
                      : '/projects/selection-sessions',
                  );
                },
              });
              return;
            }
            message.error(e?.data?.message || e?.message || 'Tạo phiên thất bại');
          }
        }}
        destroyOnClose
      >
        <Form form={sessionForm} layout="vertical">
          <Form.Item name="meetingAt" label="Ngày họp" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="location"
            label="Địa điểm họp"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <Input placeholder="VD: Hội trường A, tầng 3" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PkhReviewPage;
