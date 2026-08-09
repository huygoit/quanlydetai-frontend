/**
 * US-04-04 — Danh sách hồ sơ đủ điều kiện bảo vệ + buổi đã lên lịch
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  Alert,
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import { history, useAccess } from '@umijs/max';
import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  OUTLINE_STATUS_MAP,
  type ProjectOutline,
  type ProjectOutlineStatus,
} from '@/services/api/projectOutlines';
import {
  listEligibleForDefense,
  listDefenseSessions,
  createDefenseSession,
  DEFENSE_STATUS_MAP,
  DEFENSE_ROLE_OPTIONS,
  type DefenseSession,
  type DefenseMember,
  type DefenseMeetingMode,
  type DefenseCouncilRole,
} from '@/services/api/projectOutlineDefenses';
import { getAvailableOutlineReviewers } from '@/services/api/projectOutlineReviews';

type TabKey = 'eligible' | 'sessions';

const DefensesPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [tab, setTab] = useState<TabKey>('eligible');
  const [sessions, setSessions] = useState<DefenseSession[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ProjectOutline | null>(null);
  const [members, setMembers] = useState<DefenseMember[]>([]);
  const [searchOpts, setSearchOpts] = useState<
    { value: string; label: string; raw: any }[]
  >([]);
  const [form] = Form.useForm();
  const [extForm] = Form.useForm();

  if (!access.canManageOutlineDefense) {
    return (
      <PageContainer>
        <Alert type="error" message="Chỉ PKH tổ chức bảo vệ thuyết minh." />
      </PageContainer>
    );
  }

  const openSchedule = (row: ProjectOutline) => {
    setCurrent(row);
    setMembers([]);
    form.setFieldsValue({
      meetingMode: 'IN_PERSON',
      meetingAt: dayjs().add(7, 'day').hour(9).minute(0),
      shortNoticeOverride: false,
    });
    setOpen(true);
  };

  const searchMembers = async (keyword: string) => {
    if (!current || !keyword.trim()) {
      setSearchOpts([]);
      return;
    }
    // Tái dùng API tìm người từ hồ sơ KH (available reviewers endpoint có profile)
    try {
      const res = await getAvailableOutlineReviewers(current.id, keyword.trim());
      setSearchOpts(
        (res.data || []).map((r) => ({
          value: String(r.scientificProfileId),
          label: `${r.reviewerName}${r.unit ? ` — ${r.unit}` : ''}`,
          raw: r,
        })),
      );
    } catch {
      setSearchOpts([]);
    }
  };

  const addMember = (raw: any, role: DefenseCouncilRole = 'UY_VIEN') => {
    if (members.some((m) => m.scientificProfileId === raw.scientificProfileId)) {
      message.warning('Đã thêm người này');
      return;
    }
    setMembers((prev) => [
      ...prev,
      {
        userId: raw.reviewerUserId ?? raw.userId ?? null,
        scientificProfileId: raw.scientificProfileId,
        memberName: raw.reviewerName || raw.memberName,
        memberEmail: raw.reviewerEmail || raw.memberEmail,
        roleInCouncil: role,
        isExternal: false,
        unit: raw.unit,
      },
    ]);
  };

  const addExternal = async () => {
    try {
      const v = await extForm.validateFields();
      setMembers((prev) => [
        ...prev,
        {
          memberName: v.name,
          memberEmail: v.email,
          roleInCouncil: 'UY_VIEN',
          isExternal: true,
          proposedSourceNote: v.source,
          unit: v.unit || null,
        },
      ]);
      extForm.resetFields();
    } catch {
      /* validate */
    }
  };

  const submitSchedule = async (confirm: boolean) => {
    if (!current) return;
    try {
      const v = await form.validateFields();
      if (!members.length) {
        message.warning('Thêm thành phần hội đồng');
        return;
      }
      const res = await createDefenseSession({
        projectOutlineId: current.id,
        meetingMode: v.meetingMode as DefenseMeetingMode,
        meetingAt: (v.meetingAt as dayjs.Dayjs).toISOString(),
        location: v.location || null,
        meetingUrl: v.meetingUrl || null,
        shortNoticeOverride: !!v.shortNoticeOverride,
        shortNoticeReason: v.shortNoticeReason || null,
        confirm,
        members,
      });
      message.success(res.message || 'Thành công');
      setOpen(false);
      actionRef.current?.reload();
      if (confirm && res.data?.id) {
        history.push(`/projects/defenses/${res.data.id}`);
      } else if (res.data?.id) {
        history.push(`/projects/defenses/${res.data.id}`);
      }
    } catch (e: any) {
      if (e?.data?.code === 'LESS_THAN_5_BUSINESS_DAYS') {
        Modal.confirm({
          title: 'Lịch dưới 5 ngày làm việc',
          content: 'Bật ghi đè và nhập lý do rồi thử lại.',
          okText: 'Đã hiểu',
        });
      }
      message.error(e?.data?.message || e?.message || 'Lên lịch thất bại');
    }
  };

  const columnsEligible: ProColumns<ProjectOutline>[] = [
    { title: 'Mã', dataIndex: 'code', width: 130 },
    { title: 'Tên', dataIndex: 'title', ellipsis: true },
    { title: 'CNĐT', dataIndex: 'ownerName', width: 160 },
    {
      title: 'Điểm TB PB',
      width: 100,
      render: (_, r) => r.reviewAverageScore ?? '—',
    },
    {
      title: 'Thao tác',
      width: 140,
      render: (_, r) => <a onClick={() => openSchedule(r)}>Lên lịch bảo vệ</a>,
    },
  ];

  return (
    <PageContainer title="Tổ chức bảo vệ thuyết minh">
      <Space style={{ marginBottom: 16 }}>
        <Button type={tab === 'eligible' ? 'primary' : 'default'} onClick={() => setTab('eligible')}>
          Đủ điều kiện bảo vệ
        </Button>
        <Button
          type={tab === 'sessions' ? 'primary' : 'default'}
          onClick={async () => {
            setTab('sessions');
            try {
              const res = await listDefenseSessions();
              setSessions(res.data || []);
            } catch (e: any) {
              message.error(e?.message || 'Không tải được danh sách');
            }
          }}
        >
          Buổi bảo vệ
        </Button>
      </Space>

      {tab === 'eligible' ? (
        <ProTable<ProjectOutline>
          actionRef={actionRef}
          rowKey="id"
          search={false}
          columns={columnsEligible}
          headerTitle="Hồ sơ đã đủ phiếu phản biện"
          request={async () => {
            const res = await listEligibleForDefense();
            const rows = res.data || [];
            return { data: rows, success: true, total: rows.length };
          }}
        />
      ) : (
        <Table
          rowKey="id"
          dataSource={sessions}
          pagination={false}
          columns={[
            {
              title: 'Mã TM',
              render: (_, r) => r.outline?.code || r.projectOutlineId,
              width: 130,
            },
            { title: 'Tên', render: (_, r) => r.outline?.title, ellipsis: true },
            {
              title: 'Thời gian',
              width: 150,
              render: (_, r) =>
                r.meetingAt ? dayjs(r.meetingAt).format('DD/MM/YYYY HH:mm') : '—',
            },
            {
              title: 'Trạng thái',
              width: 140,
              render: (_, r) => {
                const m = DEFENSE_STATUS_MAP[r.status];
                return <Tag color={m?.color}>{m?.label || r.status}</Tag>;
              },
            },
            {
              title: 'TM',
              width: 140,
              render: (_, r) => {
                const st = r.outline?.status as ProjectOutlineStatus | undefined;
                const m = st ? OUTLINE_STATUS_MAP[st] : null;
                return m ? <Tag color={m.color}>{m.label}</Tag> : r.outline?.status;
              },
            },
            {
              title: 'Thao tác',
              width: 100,
              render: (_, r) => (
                <a onClick={() => history.push(`/projects/defenses/${r.id}`)}>Chi tiết</a>
              ),
            },
          ]}
        />
      )}

      <Drawer
        title={current ? `Lên lịch bảo vệ — ${current.code}` : 'Lên lịch'}
        width={720}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Space>
            <Button onClick={() => void submitSchedule(false)}>Lưu nháp</Button>
            <Button type="primary" onClick={() => void submitSchedule(true)}>
              Xác nhận lịch
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="meetingMode" label="Hình thức" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'IN_PERSON', label: 'Trực tiếp' },
                { value: 'ONLINE', label: 'Trực tuyến' },
                { value: 'HYBRID', label: 'Kết hợp' },
              ]}
            />
          </Form.Item>
          <Form.Item name="meetingAt" label="Ngày giờ họp" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} format="DD/MM/YYYY HH:mm" />
          </Form.Item>
          <Form.Item name="location" label="Địa điểm">
            <Input />
          </Form.Item>
          <Form.Item name="meetingUrl" label="Link họp (Teams/…)">
            <Input />
          </Form.Item>
          <Form.Item name="shortNoticeOverride" valuePropName="checked">
            <Checkbox>Ghi đè khi dưới 5 ngày làm việc</Checkbox>
          </Form.Item>
          <Form.Item name="shortNoticeReason" label="Lý do ghi đè">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16 }}>
          <strong>Thành phần hội đồng</strong>
          <AutoComplete
            style={{ width: '100%', marginTop: 8 }}
            options={searchOpts}
            onSearch={(t) => void searchMembers(t)}
            onSelect={(_, opt) => addMember((opt as any).raw)}
            placeholder="Tìm thành viên trong trường..."
          />
          <Form form={extForm} layout="inline" style={{ marginTop: 12 }}>
            <Form.Item name="name" rules={[{ required: true }]}>
              <Input placeholder="Họ tên (ngoài)" />
            </Form.Item>
            <Form.Item name="email" rules={[{ type: 'email' }]}>
              <Input placeholder="Email" style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="source" rules={[{ required: true }]}>
              <Input placeholder="Nguồn đề xuất" style={{ width: 160 }} />
            </Form.Item>
            <Button onClick={() => void addExternal()}>Thêm ngoài trường</Button>
          </Form>
          <Table
            style={{ marginTop: 12 }}
            size="small"
            pagination={false}
            rowKey={(_, i) => String(i)}
            dataSource={members}
            columns={[
              { title: 'Họ tên', dataIndex: 'memberName' },
              {
                title: 'Vai trò',
                width: 140,
                render: (_, r, idx) => (
                  <Select
                    value={r.roleInCouncil}
                    style={{ width: 120 }}
                    options={DEFENSE_ROLE_OPTIONS}
                    onChange={(v) => {
                      setMembers((prev) =>
                        prev.map((m, i) => (i === idx ? { ...m, roleInCouncil: v } : m)),
                      );
                    }}
                  />
                ),
              },
              {
                title: 'Ngoài',
                width: 70,
                render: (_, r) => (r.isExternal ? <Tag color="orange">Ngoài</Tag> : null),
              },
              {
                title: '',
                width: 60,
                render: (_, __, idx) => (
                  <a
                    onClick={() => setMembers((prev) => prev.filter((_, i) => i !== idx))}
                    style={{ color: '#ff4d4f' }}
                  >
                    Xóa
                  </a>
                ),
              },
            ]}
          />
          <Alert
            style={{ marginTop: 12 }}
            type="info"
            showIcon
            message="Cần 1 Chủ tịch, 1 Thư ký, ≥1 Ủy viên và tối thiểu 1 người ngoài trường (có nguồn đề xuất)."
          />
        </div>
      </Drawer>
    </PageContainer>
  );
};

export default DefensesPage;
