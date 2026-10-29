/**
 * Tổ chức thẩm định — nhóm TM → lập HĐ → trình QĐ
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
import type { ProjectOutline } from '@/services/api/projectOutlines';
import { DATETIME_PICKER_FORMAT } from '@/utils/datetime';
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [eligibleRows, setEligibleRows] = useState<ProjectOutline[]>([]);
  const [members, setMembers] = useState<DefenseMember[]>([]);
  const [searchOpts, setSearchOpts] = useState<{ value: string; label: string; raw: any }[]>([]);
  const [form] = Form.useForm();
  const [extForm] = Form.useForm();

  if (!access.canManageOutlineDefense) {
    return (
      <PageContainer>
        <Alert type="error" message="Chỉ PKH tổ chức thẩm định thuyết minh." />
      </PageContainer>
    );
  }

  const openCreate = () => {
    if (!selectedIds.length) {
      message.warning('Chọn ít nhất một thuyết minh');
      return;
    }
    setMembers([]);
    form.setFieldsValue({
      meetingMode: 'IN_PERSON',
      meetingAt: dayjs().add(7, 'day').hour(9).minute(0),
      shortNoticeOverride: false,
      title: `Phiên thẩm định ${dayjs().format('DD/MM/YYYY')}`,
    });
    setOpen(true);
  };

  const searchMembers = async (keyword: string) => {
    const firstId = selectedIds[0];
    if (!firstId || !keyword.trim()) {
      setSearchOpts([]);
      return;
    }
    try {
      const res = await getAvailableOutlineReviewers(firstId, keyword.trim());
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

  const submitCreate = async () => {
    try {
      const v = await form.validateFields();
      const need = ['CHU_TICH', 'THU_KY', 'PHAN_BIEN_1', 'PHAN_BIEN_2'] as DefenseCouncilRole[];
      for (const role of need) {
        if (members.filter((m) => m.roleInCouncil === role).length !== 1) {
          message.warning(`Cần đúng 1 ${DEFENSE_ROLE_OPTIONS.find((o) => o.value === role)?.label}`);
          return;
        }
      }
      if (!members.some((m) => m.roleInCouncil === 'UY_VIEN')) {
        message.warning('Cần ít nhất 1 Ủy viên');
        return;
      }
      const res = await createDefenseSession({
        projectOutlineIds: selectedIds,
        title: v.title || null,
        meetingMode: v.meetingMode as DefenseMeetingMode,
        meetingAt: (v.meetingAt as dayjs.Dayjs).toISOString(),
        location: v.location || null,
        meetingUrl: v.meetingUrl || null,
        shortNoticeOverride: !!v.shortNoticeOverride,
        shortNoticeReason: v.shortNoticeReason || null,
        members,
      });
      message.success(res.message || 'Đã tạo phiên nháp');
      setOpen(false);
      setSelectedIds([]);
      actionRef.current?.reload();
      if (res.data?.id) history.push(`/projects/defenses/${res.data.id}`);
    } catch (e: any) {
      if (e?.data?.code === 'LESS_THAN_5_BUSINESS_DAYS') {
        Modal.confirm({
          title: 'Lịch dưới 5 ngày làm việc',
          content: 'Bật ghi đè và nhập lý do rồi thử lại.',
          okText: 'Đã hiểu',
        });
      }
      message.error(e?.data?.message || e?.message || 'Tạo phiên thất bại');
    }
  };

  const columnsEligible: ProColumns<ProjectOutline>[] = [
    { title: 'Mã', dataIndex: 'code', width: 130 },
    { title: 'Tên', dataIndex: 'title', ellipsis: true },
    { title: 'CNĐT', dataIndex: 'ownerName', width: 160 },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 160, ellipsis: true },
    { title: 'Trạng thái', dataIndex: 'status', width: 140 },
  ];

  return (
    <PageContainer title="Tổ chức thẩm định thuyết minh">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Flow: nhóm TM → lập HĐ → dự thảo QĐ → BGH ký → TC-HC phát hành → thành viên nhập BM.05a"
      />
      <Space style={{ marginBottom: 16 }}>
        <Button type={tab === 'eligible' ? 'primary' : 'default'} onClick={() => setTab('eligible')}>
          TM chờ thẩm định
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
          Phiên thẩm định
        </Button>
        {tab === 'eligible' ? (
          <Button type="primary" onClick={openCreate} disabled={!selectedIds.length}>
            Tạo phiên ({selectedIds.length} TM)
          </Button>
        ) : null}
      </Space>

      {tab === 'eligible' ? (
        <ProTable<ProjectOutline>
          actionRef={actionRef}
          rowKey="id"
          search={false}
          columns={columnsEligible}
          headerTitle="Chọn các TM để nhóm vào một phiên"
          rowSelection={{
            selectedRowKeys: selectedIds,
            onChange: (keys) => setSelectedIds(keys as number[]),
          }}
          tableAlertRender={false}
          request={async () => {
            const res = await listEligibleForDefense();
            const rows = res.data || [];
            setEligibleRows(rows);
            return { data: rows, success: true, total: rows.length };
          }}
          locale={{
            emptyText: 'Chưa có TM chờ tổ chức thẩm định.',
          }}
        />
      ) : (
        <Table
          rowKey="id"
          dataSource={sessions}
          pagination={false}
          columns={[
            {
              title: 'Phiên',
              render: (_, r) => r.title || r.decisionCode || `#${r.id}`,
            },
            {
              title: 'Số TM',
              width: 80,
              render: (_, r) => r.outlines?.length || 1,
            },
            {
              title: 'Thời gian',
              width: 150,
              render: (_, r) =>
                r.meetingAt ? dayjs(r.meetingAt).format('HH:mm DD/MM/YYYY') : '—',
            },
            {
              title: 'Trạng thái',
              width: 200,
              render: (_, r) => {
                const m = DEFENSE_STATUS_MAP[r.status];
                return <Tag color={m?.color}>{m?.label || r.status}</Tag>;
              },
            },
            {
              title: 'BM.05a',
              width: 100,
              render: (_, r) =>
                r.scoreProgress
                  ? `${r.scoreProgress.submitted}/${r.scoreProgress.total}`
                  : '—',
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
        title={`Tạo phiên thẩm định — ${selectedIds.length} TM`}
        width={760}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Button type="primary" onClick={() => void submitCreate()}>
            Lưu nháp phiên
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={eligibleRows
            .filter((r) => selectedIds.includes(r.id))
            .map((r) => r.code)
            .join(', ')}
        />
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Tên phiên">
            <Input />
          </Form.Item>
          <Form.Item name="meetingMode" label="Hình thức" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'IN_PERSON', label: 'Trực tiếp' },
                { value: 'ONLINE', label: 'Trực tuyến' },
                { value: 'HYBRID', label: 'Kết hợp' },
              ]}
            />
          </Form.Item>
          <Form.Item name="meetingAt" label="Ngày họp" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} format={DATETIME_PICKER_FORMAT} />
          </Form.Item>
          <Form.Item name="location" label="Địa điểm">
            <Input />
          </Form.Item>
          <Form.Item name="meetingUrl" label="Link họp">
            <Input />
          </Form.Item>
          <Form.Item name="shortNoticeOverride" valuePropName="checked">
            <Checkbox>Ghi đè quy tắc 5 ngày làm việc</Checkbox>
          </Form.Item>
          <Form.Item name="shortNoticeReason" label="Lý do ghi đè">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 8, fontWeight: 600 }}>Thành phần hội đồng</div>
        <Space style={{ marginBottom: 8 }} wrap>
          <AutoComplete
            style={{ width: 320 }}
            options={searchOpts}
            onSearch={(v) => void searchMembers(v)}
            onSelect={(_, opt) => addMember((opt as any).raw, 'UY_VIEN')}
            placeholder="Tìm theo họ tên / email"
          />
        </Space>
        <Table
          size="small"
          rowKey={(_, i) => String(i)}
          pagination={false}
          dataSource={members}
          columns={[
            { title: 'Họ tên', dataIndex: 'memberName' },
            {
              title: 'Vai trò',
              width: 150,
              render: (_, r, idx) => (
                <Select
                  style={{ width: 140 }}
                  value={r.roleInCouncil}
                  options={DEFENSE_ROLE_OPTIONS}
                  onChange={(role) => {
                    setMembers((prev) =>
                      prev.map((m, i) =>
                        i === idx ? { ...m, roleInCouncil: role as DefenseCouncilRole } : m,
                      ),
                    );
                  }}
                />
              ),
            },
            {
              title: '',
              width: 70,
              render: (_, __, idx) => (
                <a
                  onClick={() => setMembers((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Xóa
                </a>
              ),
            },
          ]}
        />

        <div style={{ marginTop: 16, fontWeight: 600 }}>Thành viên ngoài (nếu có)</div>
        <Form form={extForm} layout="inline" style={{ marginTop: 8 }}>
          <Form.Item name="name" rules={[{ required: true }]}>
            <Input placeholder="Họ tên" />
          </Form.Item>
          <Form.Item name="email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="source" rules={[{ required: true }]}>
            <Input placeholder="Nguồn đề xuất" />
          </Form.Item>
          <Button onClick={() => void addExternal()}>Thêm ngoài</Button>
        </Form>
      </Drawer>
    </PageContainer>
  );
};

export default DefensesPage;
