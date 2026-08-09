/**
 * Hội đồng xét chọn đề tài — list phiên + Chi tiết (drawer)
 * Pattern giống /ideas/council: Thành viên | Đề tài | Kết quả
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  FormOutlined,
  PlusOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  listSelectionSessions,
  getSelectionSession,
  getSelectionSessionMembers,
  getSelectionAvailableMembers,
  addSelectionSessionMember,
  removeSelectionSessionMember,
  getSelectionSummary,
  createSelectionSession,
  SESSION_STATUS_MAP,
  SELECTION_MEMBER_ROLE_MAP,
  COUNCIL_RESULT_OPTIONS,
  type SelectionSession,
  type SelectionSessionItem,
  type SelectionSessionMember,
  type SelectionAvailableMember,
  type SelectionMemberRole,
  type SelectionSessionStatus,
} from '@/services/api/proposalSelectionSessions';
import { listCallForProposals, type CallForProposal } from '@/services/api/callForProposals';

const { Text } = Typography;

const EDITABLE_MEMBER_STATUSES: SelectionSessionStatus[] = ['CREATED', 'OPEN', 'RETURNED'];
const RESULTS_VISIBLE_STATUSES: SelectionSessionStatus[] = [
  'OPEN',
  'MINUTES_SAVED',
  'PENDING_BGH',
  'LOCKED',
  'RETURNED',
];

const SelectionSessionsPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const canPkh = access.canManageSelectionSession || access.canReviewProjectProposal;

  const [detailOpen, setDetailOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('proposals');
  const [current, setCurrent] = useState<SelectionSession | null>(null);
  const [items, setItems] = useState<SelectionSessionItem[]>([]);
  const [members, setMembers] = useState<SelectionSessionMember[]>([]);
  const [summary, setSummary] = useState<{
    totals: { dongY: number; khongDongY: number; total: number };
    byUnit: Array<{
      unit: string;
      dongY: number;
      khongDongY: number;
      total: number;
    }>;
  } | null>(null);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [availableMembers, setAvailableMembers] = useState<SelectionAvailableMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<SelectionAvailableMember | null>(null);
  const [memberRole, setMemberRole] = useState<SelectionMemberRole>('UY_VIEN');

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [cfpList, setCfpList] = useState<CallForProposal[]>([]);
  /** CFP đã có phiên — mỗi kỳ chỉ 1 phiên */
  const [cfpDaCoPhien, setCfpDaCoPhien] = useState<Set<number>>(new Set());
  const [createForm] = Form.useForm();

  useEffect(() => {
    if (!canPkh) return;
    void listCallForProposals()
      .then((res) => {
        const rows = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? (res as CallForProposal[])
            : [];
        setCfpList(rows);
      })
      .catch(() => setCfpList([]));
  }, [canPkh]);

  /** Kỳ còn tạo được phiên (chưa có phiên nào) */
  const cfpChuaCoPhien = cfpList.filter((c) => !cfpDaCoPhien.has(Number(c.id)));

  if (!access.canViewProjectCouncil && !access.canReviewProjectProposal && !access.canApproveProjectProposal) {
    return <PageContainer>Bạn không có quyền xem phiên xét chọn.</PageContainer>;
  }

  const membersEditable =
    !!current && canPkh && EDITABLE_MEMBER_STATUSES.includes(current.status);

  const loadDetail = async (sessionId: number, tab: string = 'proposals') => {
    try {
      const res = await getSelectionSession(sessionId);
      const d = res.data;
      if (!d) return;
      setCurrent(d);
      setItems(d.items || []);
      setDetailOpen(true);
      setActiveTab(tab);
      const [memRes, sumRes] = await Promise.all([
        getSelectionSessionMembers(sessionId),
        getSelectionSummary(sessionId).catch(() => ({ data: null })),
      ]);
      setMembers(Array.isArray(memRes.data) ? memRes.data : []);
      setSummary(sumRes.data || null);
    } catch (e: any) {
      message.error(e?.message || 'Không tải được chi tiết phiên');
    }
  };

  /** Tạo phiên → reload list → mở luôn Chi tiết */
  const taoPhien = async (payload: {
    callForProposalId: number;
    meetingAt: string;
    location: string;
    forceConfirm?: boolean;
  }) => {
    setCreating(true);
    try {
      const res = await createSelectionSession(payload);
      const newId = Number((res?.data as { id?: number })?.id);
      message.success(payload.forceConfirm ? 'Đã tạo phiên (ngoại lệ < 5 ngày LV)' : 'Đã tạo phiên xét chọn');
      setCreateOpen(false);
      createForm.resetFields();
      await actionRef.current?.reload();
      if (Number.isFinite(newId) && newId > 0) {
        // Phiên mới → mở Chi tiết tab Thành viên để cấu hình HĐ ngay
        await loadDetail(newId, 'members');
      }
    } catch (e: any) {
      const code = e?.data?.code || e?.code;
      if (code === 'SESSION_ALREADY_EXISTS') {
        const existingId = Number(e?.data?.data?.existingSessionId);
        message.warning(e?.data?.message || 'Kỳ này đã có phiên xét chọn.');
        setCreateOpen(false);
        if (Number.isFinite(existingId) && existingId > 0) {
          await loadDetail(existingId, 'members');
        }
        return;
      }
      if (code === 'LESS_THAN_5_BUSINESS_DAYS' || e?.data?.warning) {
        Modal.confirm({
          title: 'Cảnh báo thời hạn thư mời',
          content:
            e?.data?.message ||
            'Ít hơn 5 ngày làm việc trước ngày họp. Vẫn tạo phiên (xác nhận ngoại lệ)?',
          onOk: async () => {
            await taoPhien({ ...payload, forceConfirm: true });
          },
        });
        return;
      }
      message.error(e?.data?.message || e?.message || 'Tạo phiên thất bại');
    } finally {
      setCreating(false);
    }
  };

  const refreshMembers = async (sessionId: number) => {
    const memRes = await getSelectionSessionMembers(sessionId);
    setMembers(Array.isArray(memRes.data) ? memRes.data : []);
    const res = await getSelectionSession(sessionId);
    if (res.data) setCurrent(res.data);
    actionRef.current?.reload();
  };

  const loadAvailableMembers = async (keyword?: string) => {
    if (!current) return;
    setLoadingMembers(true);
    try {
      const res = await getSelectionAvailableMembers(current.id, keyword);
      setAvailableMembers(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAvailableMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddMember = async () => {
    if (!current || !selectedMember) {
      message.warning('Vui lòng chọn thành viên từ danh sách');
      return;
    }
    try {
      await addSelectionSessionMember(current.id, {
        memberId: selectedMember.userId,
        memberName: selectedMember.fullName,
        memberEmail: selectedMember.workEmail,
        roleInCouncil: memberRole,
        unit: selectedMember.unit || undefined,
      });
      message.success('Đã thêm thành viên');
      setAddMemberOpen(false);
      setSelectedMember(null);
      setMemberRole('UY_VIEN');
      await refreshMembers(current.id);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không thể thêm thành viên');
    }
  };

  const handleRemoveMember = async (m: SelectionSessionMember) => {
    if (!current) return;
    try {
      await removeSelectionSessionMember(current.id, m.memberId);
      message.success('Đã xóa thành viên');
      await refreshMembers(current.id);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không thể xóa thành viên');
    }
  };

  const columns: ProColumns<SelectionSession>[] = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Tên phiên', dataIndex: 'title', ellipsis: true },
    {
      title: 'Ngày họp',
      dataIndex: 'meetingAt',
      width: 160,
      render: (_, r) => dayjs(r.meetingAt).format('DD/MM/YYYY HH:mm'),
    },
    { title: 'Địa điểm', dataIndex: 'location', ellipsis: true, width: 160 },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 160,
      render: (_, r) => {
        const m = SESSION_STATUS_MAP[r.status] || { label: r.status, color: 'default' };
        return <Tag color={m.color}>{m.label}</Tag>;
      },
    },
    { title: 'Đề tài', dataIndex: 'itemCount', width: 80, align: 'center' },
    { title: 'Thành viên', dataIndex: 'memberCount', width: 100, align: 'center' },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 220,
      render: (_, r) => [
        <a key="detail" onClick={() => void loadDetail(r.id)}>
          <EyeOutlined /> Chi tiết
        </a>,
        <a key="open" onClick={() => history.push(`/projects/selection-sessions/${r.id}`)}>
          <FormOutlined /> Nhập kết quả
        </a>,
      ],
    },
  ];

  const memberColumns: ProColumns<SelectionSessionMember>[] = [
    { title: 'Họ tên', dataIndex: 'memberName', width: 200 },
    { title: 'Email', dataIndex: 'memberEmail', width: 200 },
    { title: 'Đơn vị', dataIndex: 'unit', width: 160, ellipsis: true },
    {
      title: 'Vai trò',
      dataIndex: 'roleInCouncil',
      width: 120,
      render: (_, r) => {
        const role = SELECTION_MEMBER_ROLE_MAP[r.roleInCouncil as SelectionMemberRole];
        return role ? <Tag color={role.color}>{role.text}</Tag> : r.roleInCouncil;
      },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 90,
      render: (_, r) =>
        membersEditable ? (
          <Popconfirm title="Xóa thành viên này?" onConfirm={() => void handleRemoveMember(r)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  const proposalColumns: ProColumns<SelectionSessionItem>[] = [
    {
      title: 'Mã',
      width: 120,
      render: (_, r) =>
        r.proposal?.id ? (
          <a href={`/projects/register/form/${r.proposal.id}`} target="_blank" rel="noreferrer">
            {r.proposal.code}
          </a>
        ) : (
          '—'
        ),
    },
    {
      title: 'Tên đề tài',
      ellipsis: true,
      render: (_, r) => r.proposal?.title || '—',
    },
    {
      title: 'Chủ nhiệm',
      width: 160,
      render: (_, r) => r.proposal?.ownerName || '—',
    },
    {
      title: 'Đơn vị',
      width: 160,
      ellipsis: true,
      render: (_, r) => r.proposal?.ownerUnit || '—',
    },
    {
      title: 'Kết quả HĐ',
      width: 160,
      render: (_, r) =>
        COUNCIL_RESULT_OPTIONS.find((o) => o.value === r.councilResult)?.label || '—',
    },
  ];

  const resultColumns: ProColumns<SelectionSessionItem>[] = [
    {
      title: 'Mã',
      width: 110,
      render: (_, r) => r.proposal?.code || '—',
    },
    {
      title: 'Tên đề tài',
      ellipsis: true,
      render: (_, r) => r.proposal?.title || '—',
    },
    {
      title: 'Đơn vị',
      width: 140,
      ellipsis: true,
      render: (_, r) => r.proposal?.ownerUnit || '—',
    },
    {
      title: 'Ý kiến HĐ',
      ellipsis: true,
      render: (_, r) => r.councilOpinion || '—',
    },
    {
      title: 'Kết quả',
      width: 140,
      render: (_, r) => {
        const label = COUNCIL_RESULT_OPTIONS.find((o) => o.value === r.councilResult)?.label;
        if (!label) return '—';
        return <Tag color={r.councilResult === 'DONG_Y' ? 'success' : 'error'}>{label}</Tag>;
      },
    },
    {
      title: 'Góp ý hội đồng',
      ellipsis: true,
      width: 200,
      render: (_, r) => r.adjustmentNote || '—',
    },
  ];

  const stMeta = current ? SESSION_STATUS_MAP[current.status] : null;

  return (
    <PageContainer title="Hội đồng xét chọn đề tài">
      <ProTable<SelectionSession>
        headerTitle="Phiên xét chọn đề tài"
        actionRef={actionRef}
        rowKey="id"
        search={false}
        columns={columns}
        toolBarRender={() =>
          canPkh
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  disabled={cfpChuaCoPhien.length === 0 && cfpList.length > 0}
                  title={
                    cfpChuaCoPhien.length === 0 && cfpList.length > 0
                      ? 'Mọi kỳ đã có phiên — mỗi thông báo chỉ 1 phiên'
                      : undefined
                  }
                  onClick={() => {
                    createForm.resetFields();
                    createForm.setFieldsValue({
                      callForProposalId: cfpChuaCoPhien[0]?.id,
                      meetingAt: dayjs().add(10, 'day').hour(8).minute(0),
                      location: '',
                    });
                    setCreateOpen(true);
                  }}
                >
                  Tạo phiên mới
                </Button>,
              ]
            : []
        }
        request={async () => {
          const res = await listSelectionSessions();
          const data = Array.isArray(res?.data) ? res.data : [];
          setCfpDaCoPhien(new Set(data.map((s) => Number(s.callForProposalId)).filter(Boolean)));
          return { data, success: true, total: data.length };
        }}
      />

      <Drawer
        title={`Chi tiết phiên: ${current?.title || ''}`}
        width={1000}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          current ? (
            <Space>
              <Button
                type="primary"
                icon={<FormOutlined />}
                onClick={() => history.push(`/projects/selection-sessions/${current.id}`)}
              >
                Nhập kết quả
              </Button>
            </Space>
          ) : null
        }
      >
        {current && (
          <>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title="Trạng thái"
                    value={stMeta?.label || current.status}
                  />
                </Col>
                <Col span={6}>
                  <Statistic title="Số đề tài" value={current.itemCount ?? items.length} />
                </Col>
                <Col span={6}>
                  <Statistic title="Thành viên" value={current.memberCount ?? members.length} />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="Ngày họp"
                    value={dayjs(current.meetingAt).format('DD/MM/YYYY')}
                  />
                </Col>
              </Row>
              {current.location && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary">Địa điểm: {current.location}</Text>
                </div>
              )}
              {current.status === 'RETURNED' && current.bghComment && (
                <Alert
                  style={{ marginTop: 12 }}
                  type="error"
                  showIcon
                  message="BGH từ chối danh mục"
                  description={
                    <>
                      <div>
                        <strong>Nguyên nhân:</strong> {current.bghComment}
                      </div>
                      <div style={{ marginTop: 4 }}>
                        PKH chỉnh sửa rồi trình lại, hoặc tạo kỳ tuyển chọn mới.
                      </div>
                    </>
                  }
                />
              )}
            </Card>

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <Tabs.TabPane tab="Đề tài" key="proposals">
                <ProTable<SelectionSessionItem>
                  headerTitle={false}
                  rowKey="id"
                  columns={proposalColumns}
                  dataSource={items}
                  search={false}
                  pagination={false}
                  toolBarRender={false}
                />
              </Tabs.TabPane>

              <Tabs.TabPane tab="Thành viên" key="members">
                <ProTable<SelectionSessionMember>
                  headerTitle={false}
                  rowKey="id"
                  columns={memberColumns}
                  dataSource={members}
                  search={false}
                  pagination={false}
                  toolBarRender={() =>
                    membersEditable
                      ? [
                          <Button
                            key="add"
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={() => {
                              setAddMemberOpen(true);
                              setSelectedMember(null);
                              void loadAvailableMembers();
                            }}
                          >
                            Thêm thành viên
                          </Button>,
                        ]
                      : []
                  }
                />
              </Tabs.TabPane>

              <Tabs.TabPane
                tab="Kết quả"
                key="results"
                disabled={!RESULTS_VISIBLE_STATUSES.includes(current.status)}
              >
                {summary && (
                  <Row gutter={12} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="Đồng ý" value={summary.totals.dongY} />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="Không đồng ý" value={summary.totals.khongDongY} />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="Tổng" value={summary.totals.total} />
                      </Card>
                    </Col>
                  </Row>
                )}
                {summary?.byUnit?.length ? (
                  <Card size="small" title="Theo đơn vị" style={{ marginBottom: 16 }}>
                    <Table
                      size="small"
                      pagination={false}
                      rowKey="unit"
                      dataSource={summary.byUnit}
                      columns={[
                        { title: 'Đơn vị', dataIndex: 'unit' },
                        { title: 'Đồng ý', dataIndex: 'dongY', width: 100 },
                        { title: 'Không đồng ý', dataIndex: 'khongDongY', width: 120 },
                        { title: 'Tổng', dataIndex: 'total', width: 80 },
                      ]}
                    />
                  </Card>
                ) : null}
                {items.some((i) => i.councilResult) ? (
                  <ProTable<SelectionSessionItem>
                    headerTitle={false}
                    rowKey="id"
                    columns={resultColumns}
                    dataSource={items}
                    search={false}
                    pagination={false}
                    toolBarRender={false}
                  />
                ) : (
                  <Empty description="Chưa có kết quả hội đồng" />
                )}
              </Tabs.TabPane>
            </Tabs>
          </>
        )}
      </Drawer>

      <Modal
        title="Thêm thành viên hội đồng"
        open={addMemberOpen}
        onCancel={() => {
          setAddMemberOpen(false);
          setSelectedMember(null);
          setMemberRole('UY_VIEN');
        }}
        onOk={() => void handleAddMember()}
        okText="Thêm thành viên"
        cancelText="Hủy"
        destroyOnClose
        width={560}
        okButtonProps={{ disabled: !selectedMember }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Tìm và chọn từ danh sách hồ sơ khoa học (đã có trong hệ thống)
          </Text>
        </div>

        <AutoComplete
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Gõ tên, email hoặc đơn vị để tìm kiếm..."
          options={availableMembers.map((m) => ({
            value: String(m.userId),
            label: (
              <div style={{ padding: '4px 0' }}>
                <div style={{ fontWeight: 500 }}>
                  {m.academicTitle && `${m.academicTitle}. `}
                  {m.degree && `${m.degree} `}
                  {m.fullName}
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {[m.department, m.faculty, m.organization].filter(Boolean).join(' · ') ||
                    m.workEmail}
                </div>
              </div>
            ),
          }))}
          onSelect={(val) => {
            const m = availableMembers.find((x) => String(x.userId) === val);
            if (m) setSelectedMember(m);
          }}
          onSearch={(v) => {
            if (!v.trim()) void loadAvailableMembers();
            else void loadAvailableMembers(v);
          }}
          onFocus={() => {
            if (!availableMembers.length) void loadAvailableMembers();
          }}
          notFoundContent={loadingMembers ? 'Đang tải...' : 'Không tìm thấy. Thử từ khóa khác.'}
          filterOption={false}
        />

        {selectedMember && (
          <Card size="small" style={{ marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {selectedMember.academicTitle && (
                <Tag color="blue" style={{ marginRight: 6 }}>
                  {selectedMember.academicTitle}
                </Tag>
              )}
              {selectedMember.degree && (
                <Tag color="cyan" style={{ marginRight: 6 }}>
                  {selectedMember.degree}
                </Tag>
              )}
              {selectedMember.fullName}
            </div>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>
              {[selectedMember.department, selectedMember.faculty, selectedMember.organization]
                .filter(Boolean)
                .join(' · ') || '—'}
            </div>
            {selectedMember.workEmail && (
              <div style={{ fontSize: 12, color: '#8c8c8c' }}>{selectedMember.workEmail}</div>
            )}
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => setSelectedMember(null)}>
              Chọn lại
            </Button>
          </Card>
        )}

        {selectedMember && (
          <Form layout="vertical">
            <Form.Item label="Vai trò trong hội đồng" required>
              <Select
                value={memberRole}
                onChange={setMemberRole}
                options={[
                  { label: 'Chủ tịch HĐ', value: 'CHU_TICH' },
                  { label: 'Thư ký', value: 'THU_KY' },
                  { label: 'Phản biện', value: 'PHAN_BIEN' },
                  { label: 'Ủy viên', value: 'UY_VIEN' },
                ]}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="Tạo phiên xét chọn"
        open={createOpen}
        confirmLoading={creating}
        onCancel={() => setCreateOpen(false)}
        onOk={async () => {
          const v = await createForm.validateFields();
          await taoPhien({
            callForProposalId: Number(v.callForProposalId),
            meetingAt: (v.meetingAt as dayjs.Dayjs).toISOString(),
            location: v.location,
            forceConfirm: false,
          });
        }}
        destroyOnClose
        width={520}
        okText="Tạo phiên"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="callForProposalId"
            label="Kỳ thông báo (CFP)"
            rules={[{ required: true, message: 'Bắt buộc' }]}
            extra="Mỗi kỳ chỉ 1 phiên. Hệ thống đưa toàn bộ hồ sơ Hợp lệ của kỳ vào phiên."
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={
                cfpChuaCoPhien.length ? 'Chọn kỳ chưa có phiên' : 'Không còn kỳ nào tạo được phiên'
              }
              options={cfpChuaCoPhien.map((c) => ({
                value: c.id,
                label: `${c.title} (${c.periodLabel}) — ${c.status}`,
              }))}
              notFoundContent="Mọi kỳ đã có phiên xét chọn"
            />
          </Form.Item>
          <Form.Item
            name="meetingAt"
            label="Thời gian họp"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="location"
            label="Địa điểm"
            rules={[{ required: true, message: 'Bắt buộc' }]}
          >
            <Input placeholder="Phòng họp / online..." />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default SelectionSessionsPage;
