/**
 * US-04-02 — PKH phân công phản biện kín
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  Alert,
  AutoComplete,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
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
  getOutline,
  type ProjectOutline,
  type ProjectOutlineStatus,
} from '@/services/api/projectOutlines';
import {
  listPendingOutlineReviews,
  listUnderOutlineReviews,
  getAvailableOutlineReviewers,
  assignOutlineReviewers,
  replaceOutlineReviewer,
  type AvailableReviewer,
  type AssignReviewerPayload,
  type OutlineReviewAssignment,
} from '@/services/api/projectOutlineReviews';
import { getOutlineReviewScoreSummary } from '@/services/api/projectOutlineScores';

type TabKey = 'pending' | 'assigned';

const BlindReviewAssignPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [tab, setTab] = useState<TabKey>('pending');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [current, setCurrent] = useState<ProjectOutline | null>(null);
  const [picked, setPicked] = useState<AssignReviewerPayload[]>([]);
  const [searchOpts, setSearchOpts] = useState<{ value: string; label: string; raw: AvailableReviewer }[]>(
    [],
  );
  const [assignForm] = Form.useForm();
  const [externalForm] = Form.useForm();
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState<OutlineReviewAssignment | null>(null);
  const [replaceForm] = Form.useForm();
  const [assignedRows, setAssignedRows] = useState<
    Array<ProjectOutline & { assignments: OutlineReviewAssignment[] }>
  >([]);

  if (!access.canAssignOutlineBlindReview) {
    return (
      <PageContainer>
        <Alert type="error" message="Chỉ PKH được phân công phản biện kín." />
      </PageContainer>
    );
  }

  const openAssign = async (row: ProjectOutline) => {
    try {
      const res = await getOutline(row.id);
      setCurrent(res.data || row);
      setPicked([]);
      assignForm.setFieldsValue({ businessDays: 10 });
      setDrawerOpen(true);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không mở được hồ sơ');
    }
  };

  const searchReviewers = async (keyword: string) => {
    if (!current || !keyword.trim()) {
      setSearchOpts([]);
      return;
    }
    try {
      const res = await getAvailableOutlineReviewers(current.id, keyword.trim());
      setSearchOpts(
        (res.data || []).map((r) => ({
          value: String(r.scientificProfileId),
          label: `${r.reviewerName}${r.unit ? ` — ${r.unit}` : ''}${
            r.workloadWarning ? ' (cảnh báo tải)' : ''
          }`,
          raw: r,
        })),
      );
    } catch {
      setSearchOpts([]);
    }
  };

  const addPicked = (r: AvailableReviewer) => {
    if (picked.some((p) => p.scientificProfileId === r.scientificProfileId)) {
      message.warning('Đã chọn phản biện này');
      return;
    }
    setPicked((prev) => [
      ...prev,
      {
        scientificProfileId: r.scientificProfileId,
        reviewerUserId: r.reviewerUserId,
        reviewerName: r.reviewerName,
        reviewerEmail: r.reviewerEmail,
        isExternal: false,
        workloadOverrideReason: r.workloadWarning ? undefined : null,
      },
    ]);
  };

  const themNgoaiTruong = async () => {
    const v = await externalForm.validateFields();
    setPicked((prev) => [
      ...prev,
      {
        reviewerName: v.name,
        reviewerEmail: v.email,
        isExternal: true,
        reviewerUserId: null,
        scientificProfileId: null,
      },
    ]);
    externalForm.resetFields();
    message.success('Đã thêm chuyên gia ngoài trường');
  };

  const xacNhanPhanCong = async () => {
    if (!current) return;
    if (picked.length < 1) {
      message.error('Chọn ít nhất một phản biện');
      return;
    }
    const v = await assignForm.validateFields();
    for (const p of picked) {
      const opt = searchOpts.find((o) => o.raw.scientificProfileId === p.scientificProfileId);
      if (opt?.raw.workloadWarning && !p.workloadOverrideReason?.trim()) {
        Modal.warning({
          title: 'Cần lý do vượt tải',
          content: `${p.reviewerName} đã nhận nhiều nhiệm vụ trong tháng. Nhập lý do tiếp tục ở cột tương ứng.`,
        });
        // Cho phép nhập inline: đánh dấu field
        setPicked((prev) =>
          prev.map((x) =>
            x.scientificProfileId === p.scientificProfileId
              ? { ...x, workloadOverrideReason: x.workloadOverrideReason ?? '' }
              : x,
          ),
        );
        return;
      }
    }

    Modal.confirm({
      title: 'Xác nhận phân công phản biện kín',
      content: `Phân công ${picked.length} phản biện cho "${current.title}"? Trạng thái chuyển sang Phản biện kín.`,
      okText: 'Xác nhận',
      onOk: async () => {
        try {
          const deadlineAt = v.deadlineAt
            ? dayjs(v.deadlineAt).endOf('day').toISOString()
            : null;
          const res = await assignOutlineReviewers(current.id, {
            reviewers: picked.map((p) => ({
              ...p,
              workloadOverrideReason: p.workloadOverrideReason?.trim() || null,
            })),
            deadlineAt,
            businessDays: deadlineAt ? null : Number(v.businessDays || 10),
            reviewerCountTarget: picked.length,
          });
          message.success(res.message || 'Đã phân công');
          if (res.data?.warnings?.length) {
            message.warning(res.data.warnings.join(' | '));
          }
          setDrawerOpen(false);
          actionRef.current?.reload();
          void loadAssigned();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Phân công thất bại');
          throw e;
        }
      },
    });
  };

  const loadAssigned = async () => {
    try {
      const res = await listUnderOutlineReviews();
      setAssignedRows(res.data || []);
    } catch {
      setAssignedRows([]);
    }
  };

  const columnsPending: ProColumns<ProjectOutline>[] = [
    { title: 'Mã', dataIndex: 'code', width: 130, copyable: true },
    { title: 'Tên thuyết minh', dataIndex: 'title', ellipsis: true },
    { title: 'Chủ nhiệm', dataIndex: 'ownerName', width: 140 },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 160 },
    { title: 'Lĩnh vực', dataIndex: 'field', width: 140 },
    {
      title: 'Nộp lúc',
      dataIndex: 'submittedAt',
      width: 140,
      render: (_, r) => (r.submittedAt ? dayjs(r.submittedAt).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 160,
      render: (_, r) => [
        <a key="assign" onClick={() => void openAssign(r)}>
          Phân công
        </a>,
        <a key="view" onClick={() => history.push(`/projects/outlines/form/${r.id}`)}>
          Xem TM
        </a>,
      ],
    },
  ];

  return (
    <PageContainer
      tabList={[
        { key: 'pending', tab: 'Chờ phân công' },
        { key: 'assigned', tab: 'Đang phản biện kín' },
      ]}
      tabActiveKey={tab}
      onTabChange={(k) => {
        setTab(k as TabKey);
        if (k === 'assigned') void loadAssigned();
      }}
    >
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="Phản biện kín"
        description="CNĐT/thành viên đề tài không thấy danh tính phản biện trong giai đoạn đánh giá. Không phân công người thuộc đề tài. Cảnh báo nếu phản biện đã nhận >3 nhiệm vụ trong tháng."
      />

      {tab === 'pending' ? (
        <ProTable<ProjectOutline>
          actionRef={actionRef}
          rowKey="id"
          search={false}
          columns={columnsPending}
          headerTitle="Thuyết minh chờ phân công phản biện"
          request={async () => {
            try {
              const res = await listPendingOutlineReviews();
              const rows = res.data || [];
              return { data: rows, success: true, total: rows.length };
            } catch (e: any) {
              message.error(e?.message || 'Không tải được danh sách');
              return { data: [], success: false, total: 0 };
            }
          }}
        />
      ) : (
        <Table
          rowKey="id"
          dataSource={assignedRows}
          pagination={false}
          columns={[
            { title: 'Mã', dataIndex: 'code', width: 130 },
            { title: 'Tên', dataIndex: 'title', ellipsis: true },
            {
              title: 'Trạng thái',
              width: 140,
              render: (_, r) => {
                const m = OUTLINE_STATUS_MAP[r.status as ProjectOutlineStatus];
                return <Tag color={m?.color}>{m?.label || r.status}</Tag>;
              },
            },
            {
              title: 'Phản biện',
              render: (_, r) =>
                (r.assignments || [])
                  .filter((a) => a.status !== 'CANCELLED')
                  .map((a) => (
                    <Tag key={a.id} color={a.isExternal ? 'orange' : 'blue'}>
                      {a.reviewerName}
                      {a.deadlineAt ? ` · hạn ${dayjs(a.deadlineAt).format('DD/MM')}` : ''}
                    </Tag>
                  )),
            },
            {
              title: 'Điểm TB',
              width: 100,
              render: (_, r) => {
                if (r.reviewScoresCompletedAt && r.reviewAverageScore != null) {
                  return (
                    <Tag color={r.reviewBelowThreshold ? 'error' : 'success'}>
                      {r.reviewAverageScore}
                    </Tag>
                  );
                }
                return <Tag>Chưa đủ phiếu</Tag>;
              },
            },
            {
              title: 'Thao tác',
              width: 180,
              render: (_, r) => (
                <Space>
                  <a
                    onClick={() => {
                      const active = (r.assignments || []).find(
                        (a) => a.status === 'INVITED' || a.status === 'ACTIVE',
                      );
                      if (!active) {
                        message.info('Không còn phân công đang hoạt động');
                        return;
                      }
                      setCurrent(r);
                      setReplaceTarget(active);
                      replaceForm.resetFields();
                      setReplaceOpen(true);
                    }}
                  >
                    Thay PB
                  </a>
                  <a
                    onClick={async () => {
                      try {
                        const res = await getOutlineReviewScoreSummary(r.id);
                        const d = res.data;
                        Modal.info({
                          title: `Tổng hợp điểm — ${d.code}`,
                          width: 640,
                          content: (
                            <div>
                              <p>
                                Điểm TB:{' '}
                                <strong>
                                  {d.averageScore != null ? d.averageScore : '— (chưa đủ phiếu)'}
                                </strong>
                                {d.belowThreshold ? ' · Dưới ngưỡng' : ''}
                              </p>
                              {(d.assignments || []).map((row) => (
                                <p key={row.assignment.id}>
                                  {row.assignment.reviewerName}:{' '}
                                  {row.scoreSheet?.status === 'SUBMITTED'
                                    ? d.blindAggregation && !d.completedAt
                                      ? 'Đã nộp (ẩn điểm — blind)'
                                      : `Điểm ${row.scoreSheet.totalScore ?? '—'}`
                                    : row.scoreSheet?.status === 'DRAFT'
                                      ? 'Đang nháp'
                                      : 'Chưa mở phiếu'}
                                </p>
                              ))}
                            </div>
                          ),
                        });
                      } catch (e: any) {
                        message.error(e?.data?.message || e?.message || 'Không tải tổng hợp');
                      }
                    }}
                  >
                    Tổng hợp
                  </a>
                </Space>
              ),
            },
          ]}
        />
      )}

      <Drawer
        title={current ? `Phân công — ${current.code}` : 'Phân công'}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          <Button type="primary" onClick={() => void xacNhanPhanCong()}>
            Xác nhận phân công
          </Button>
        }
      >
        {current && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type="info"
              showIcon
              message={current.title}
              description={`Chủ nhiệm: ${current.ownerName} · ${current.ownerUnit || ''} · Lĩnh vực: ${
                current.field || '—'
              }`}
            />

            <Form form={assignForm} layout="vertical">
              <Form.Item label="Hạn hoàn thành (ngày cụ thể)">
                <Form.Item name="deadlineAt" noStyle>
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Form.Item>
              <Form.Item
                name="businessDays"
                label="Hoặc số ngày kể từ lúc phân công"
                extra="Dùng khi không chọn ngày cụ thể (không cố định 14 ngày)."
              >
                <InputNumber min={1} max={90} style={{ width: '100%' }} />
              </Form.Item>
            </Form>

            <div>
              <strong>Tìm phản biện trong trường</strong>
              <AutoComplete
                style={{ width: '100%', marginTop: 8 }}
                options={searchOpts}
                onSearch={(t) => void searchReviewers(t)}
                onSelect={(_, opt) => {
                  const raw = (opt as any).raw as AvailableReviewer;
                  if (raw) addPicked(raw);
                }}
                placeholder="Gõ tên / email / đơn vị..."
              />
            </div>

            <div>
              <strong>Thêm chuyên gia ngoài trường</strong>
              <Form form={externalForm} layout="inline" style={{ marginTop: 8 }}>
                <Form.Item name="name" rules={[{ required: true }]}>
                  <Input placeholder="Họ tên" />
                </Form.Item>
                <Form.Item name="email" rules={[{ required: true, type: 'email' }]}>
                  <Input placeholder="Email" style={{ width: 200 }} />
                </Form.Item>
                <Button onClick={() => void themNgoaiTruong()}>Thêm</Button>
              </Form>
            </div>

            <Table
              size="small"
              pagination={false}
              rowKey={(_, i) => `r-${i}`}
              dataSource={picked}
              columns={[
                {
                  title: 'Phản biện',
                  render: (_, r) => (
                    <span>
                      {r.reviewerName}{' '}
                      {r.isExternal ? <Tag color="orange">Ngoài</Tag> : <Tag>Trong trường</Tag>}
                    </span>
                  ),
                },
                { title: 'Email', dataIndex: 'reviewerEmail', width: 180 },
                {
                  title: 'Lý do vượt tải (nếu có)',
                  render: (_, __, i) => (
                    <Input
                      placeholder="Bắt buộc nếu cảnh báo tải"
                      value={picked[i]?.workloadOverrideReason || ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPicked((prev) => {
                          const next = [...prev];
                          next[i] = { ...next[i], workloadOverrideReason: v };
                          return next;
                        });
                      }}
                    />
                  ),
                },
                {
                  title: '',
                  width: 70,
                  render: (_, __, i) => (
                    <Button
                      type="link"
                      danger
                      onClick={() => setPicked((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      Xóa
                    </Button>
                  ),
                },
              ]}
            />
          </Space>
        )}
      </Drawer>

      <Modal
        title="Thay phản biện"
        open={replaceOpen}
        onCancel={() => setReplaceOpen(false)}
        onOk={async () => {
          if (!current || !replaceTarget) return;
          const v = await replaceForm.validateFields();
          try {
            await replaceOutlineReviewer(current.id, {
              assignmentId: replaceTarget.id,
              reason: v.reason,
              reviewer: {
                reviewerName: v.name,
                reviewerEmail: v.email,
                isExternal: true,
              },
              businessDays: Number(v.businessDays || 10),
            });
            message.success('Đã thay phản biện');
            setReplaceOpen(false);
            void loadAssigned();
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
            throw e;
          }
        }}
      >
        <Form form={replaceForm} layout="vertical">
          <Form.Item name="reason" label="Lý do thay" rules={[{ required: true, min: 5 }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="name" label="Phản biện mới (họ tên)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="businessDays" label="Số ngày hạn mới" initialValue={10}>
            <InputNumber min={1} max={90} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BlindReviewAssignPage;
