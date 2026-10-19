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
  DatePicker,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
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
import { coHienThiHocHam, nhanNhanHocHam, nhanNhanHocVi } from '@/utils/profileCatalogOptions';
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

/** Chữ trong ô tìm sau khi chọn — chỉ họ tên. */
function tenOTimThanhVien(m: { fullName?: string | null }): string {
  return (m.fullName || '').trim();
}

function nhanHocHamHienThi(code?: string | null): string {
  if (!coHienThiHocHam(code)) return '';
  return nhanNhanHocHam([], code) || '';
}

function nhanHocViHienThi(code?: string | null): string {
  return nhanNhanHocVi([], code) || '';
}

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
  const [tuKhoaThanhVien, setTuKhoaThanhVien] = useState('');
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
      setTuKhoaThanhVien('');
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
            {(() => {
              const mauTrangThai: Record<string, { nen: string; chu: string; vien: string }> = {
                CREATED: { nen: '#f5f5f5', chu: '#595959', vien: '#d9d9d9' },
                OPEN: { nen: '#e6f4ff', chu: '#0958d9', vien: '#91caff' },
                MINUTES_SAVED: { nen: '#e6fffb', chu: '#08979c', vien: '#87e8de' },
                PENDING_BGH: { nen: '#fff7e6', chu: '#d48806', vien: '#ffd591' },
                LOCKED: { nen: '#f6ffed', chu: '#389e0d', vien: '#b7eb8f' },
                RETURNED: { nen: '#fff2f0', chu: '#cf1322', vien: '#ffccc7' },
              };
              const mau = mauTrangThai[current.status] || mauTrangThai.CREATED;
              const soDeTai = current.itemCount ?? items.length;
              const soThanhVien = current.memberCount ?? members.length;
              const o = (noiDung: JSX.Element, laCuoi?: boolean) => (
                <div
                  style={{
                    padding: '14px 16px',
                    borderRight: laCuoi ? 'none' : '1px solid #eef2f6',
                    minWidth: 0,
                  }}
                >
                  {noiDung}
                </div>
              );
              const nhan = (text: string) => (
                <div style={{ fontSize: 12, color: '#8c8c8c', letterSpacing: 0.2, marginBottom: 6 }}>
                  {text}
                </div>
              );
              return (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.15fr 0.8fr 0.9fr 1.25fr',
                    marginBottom: 16,
                    background: '#fff',
                    border: '1px solid #e6edf5',
                    borderRadius: 12,
                    overflow: 'hidden',
                  }}
                >
                  {o(
                    <>
                      {nhan('Trạng thái')}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: mau.nen,
                          color: mau.chu,
                          border: `1px solid ${mau.vien}`,
                          fontWeight: 600,
                          lineHeight: 1.4,
                        }}
                      >
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            background: mau.chu,
                          }}
                        />
                        {stMeta?.label || current.status}
                      </span>
                    </>,
                  )}
                  {o(
                    <>
                      {nhan('Đề tài')}
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#0c2340', lineHeight: 1.2 }}>
                        {soDeTai}
                      </div>
                    </>,
                  )}
                  {o(
                    <>
                      {nhan('Thành viên')}
                      <div style={{ fontSize: 22, fontWeight: 600, color: '#0c2340', lineHeight: 1.2 }}>
                        {soThanhVien}
                      </div>
                    </>,
                  )}
                  {o(
                    <>
                      {nhan('Ngày họp')}
                      <div style={{ fontSize: 18, fontWeight: 600, color: '#0c2340', lineHeight: 1.2 }}>
                        {dayjs(current.meetingAt).format('DD/MM/YYYY')}
                      </div>
                      {current.location ? (
                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 12,
                            color: '#8c8c8c',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={current.location}
                        >
                          {current.location}
                        </div>
                      ) : null}
                    </>,
                    true,
                  )}
                </div>
              );
            })()}

            {current.status === 'RETURNED' && current.bghComment && (
              <Alert
                style={{ marginBottom: 16 }}
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

            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <Tabs.TabPane tab="Đề tài" key="proposals">
                <ProTable<SelectionSessionItem>
                  headerTitle={false}
                  rowKey="id"
                  columns={proposalColumns}
                  dataSource={items}
                  search={false}
                  options={false}
                  pagination={false}
                  tableLayout="fixed"
                  cardProps={{ bodyStyle: { padding: 0 } }}
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
                  options={false}
                  pagination={false}
                  tableLayout="fixed"
                  cardProps={{ bodyStyle: { padding: 0 } }}
                  toolBarRender={
                    membersEditable
                      ? () => [
                          <Button
                            key="add"
                            type="primary"
                            icon={<UserAddOutlined />}
                            onClick={() => {
                              setAddMemberOpen(true);
                              setSelectedMember(null);
                              setTuKhoaThanhVien('');
                              void loadAvailableMembers();
                            }}
                          >
                            Thêm thành viên
                          </Button>,
                        ]
                      : false
                  }
                />
              </Tabs.TabPane>

              <Tabs.TabPane
                tab="Kết quả"
                key="results"
                disabled={!RESULTS_VISIBLE_STATUSES.includes(current.status)}
              >
                {summary && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      marginBottom: 16,
                      background: '#fff',
                      border: '1px solid #e6edf5',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    {(
                      [
                        ['Đồng ý', summary.totals.dongY, '#389e0d'],
                        ['Không đồng ý', summary.totals.khongDongY, '#cf1322'],
                        ['Tổng', summary.totals.total, '#0c2340'],
                      ] as const
                    ).map(([label, value, color], idx, arr) => (
                      <div
                        key={label}
                        style={{
                          padding: '14px 16px',
                          borderRight: idx === arr.length - 1 ? 'none' : '1px solid #eef2f6',
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 6 }}>{label}</div>
                        <div style={{ fontSize: 22, fontWeight: 600, color, lineHeight: 1.2 }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {summary?.byUnit?.length ? (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#0c2340' }}>Theo đơn vị</div>
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
                  </div>
                ) : null}
                {items.some((i) => i.councilResult) ? (
                  <ProTable<SelectionSessionItem>
                    headerTitle={false}
                    rowKey="id"
                    columns={resultColumns}
                    dataSource={items}
                    search={false}
                    options={false}
                    pagination={false}
                    tableLayout="fixed"
                    cardProps={{ bodyStyle: { padding: 0 } }}
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
          setTuKhoaThanhVien('');
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
          value={tuKhoaThanhVien}
          options={availableMembers.map((m) => {
            const hocHam = nhanHocHamHienThi(m.academicTitle);
            const hocVi = nhanHocViHienThi(m.degree);
            return {
            value: String(m.userId),
            label: (
              <div style={{ padding: '4px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  {hocHam ? <Tag color="blue" style={{ margin: 0 }}>{hocHam}</Tag> : null}
                  {hocVi ? <Tag color="cyan" style={{ margin: 0 }}>{hocVi}</Tag> : null}
                  <span style={{ fontWeight: 500 }}>{m.fullName}</span>
                </div>
                <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                  {[m.department, m.faculty, m.organization].filter(Boolean).join(' · ') ||
                    m.workEmail}
                </div>
              </div>
            ),
            };
          })}
          onChange={(text) => {
            const vuaChon = availableMembers.find((m) => String(m.userId) === text);
            if (vuaChon) {
              setSelectedMember(vuaChon);
              setTuKhoaThanhVien(tenOTimThanhVien(vuaChon));
              return;
            }
            setTuKhoaThanhVien(text);
            setSelectedMember((cur) => (cur && tenOTimThanhVien(cur) === text ? cur : null));
          }}
          onSelect={(val) => {
            const m = availableMembers.find((x) => String(x.userId) === val);
            if (!m) return;
            setSelectedMember(m);
            setTuKhoaThanhVien(tenOTimThanhVien(m));
          }}
          onSearch={(v) => {
            if (availableMembers.some((m) => String(m.userId) === v)) return;
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
              {nhanHocHamHienThi(selectedMember.academicTitle) ? (
                <Tag color="blue" style={{ marginRight: 6 }}>
                  {nhanHocHamHienThi(selectedMember.academicTitle)}
                </Tag>
              ) : null}
              {nhanHocViHienThi(selectedMember.degree) ? (
                <Tag color="cyan" style={{ marginRight: 6 }}>
                  {nhanHocViHienThi(selectedMember.degree)}
                </Tag>
              ) : null}
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
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              onClick={() => {
                setSelectedMember(null);
                setTuKhoaThanhVien('');
              }}
            >
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
            {/* Chỉ giờ:phút + ngày; ẩn cột giây trong panel chọn thời gian */}
            <DatePicker
              showTime={{ format: 'HH:mm', showSecond: false }}
              format="HH:mm DD-MM-YYYY"
              style={{ width: '100%' }}
            />
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
