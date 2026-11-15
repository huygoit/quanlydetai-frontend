/**
 * Tab Hợp đồng — dự thảo BM-02.14 + luồng ký.
 */
import {
  bghReturnContract,
  bghSignContract,
  cnnvConfirmContract,
  cnnvReturnContract,
  downloadProjectContract,
  generateProjectContract,
  getProjectContractFlow,
  PROJECT_CONTRACT_STATUS_MAP,
  saveContractDraftForm,
  submitContractBgh,
  submitContractCnnv,
  type ContractFundingRow,
  type ContractMilestoneRow,
  type ProjectContractFlow,
  type ProjectContractStatus,
} from '@/services/api/projectContracts';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import {
  BankOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FileWordOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ScheduleOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  EditableProTable,
  FooterToolbar,
  type ProColumns,
} from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

const { Text, Title } = Typography;

const BUOC = [
  { key: 'HOP_DONG_DRAFT', title: 'Dự thảo' },
  { key: 'HOP_DONG_CHO_CNNV', title: 'CNNV' },
  { key: 'HOP_DONG_CHO_KY', title: 'BGH' },
  { key: 'HOP_DONG_DA_KY', title: 'Đã ký' },
];

type MilestoneEdit = ContractMilestoneRow & {
  id: string;
  thoiGianRange?: [Dayjs, Dayjs] | null;
};

function thongBaoLoi(e: any, macDinh: string) {
  message.error(e?.data?.message || e?.message || macDinh);
}

function hoiChuoi(tieuDe: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let text = '';
    Modal.confirm({
      title: tieuDe,
      content: (
        <Input.TextArea
          rows={3}
          onChange={(ev) => {
            text = ev.target.value;
          }}
        />
      ),
      onOk: () => {
        if (!text.trim()) {
          message.warning('Nhập nội dung');
          return Promise.reject();
        }
        resolve(text.trim());
      },
      onCancel: () => reject(new Error('huy')),
    });
  });
}

function parseNgay(value?: string | null): Dayjs | null {
  if (!value) return null;
  const d = dayjs(value, ['DD/MM/YYYY', 'YYYY-MM-DD', 'D/M/YYYY'], true);
  return d.isValid() ? d : null;
}

function formatNgay(value: Dayjs | null): string {
  return value ? value.format('DD/MM/YYYY') : '';
}

function parseThoiGianRange(raw?: string | null): [Dayjs, Dayjs] | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .split(/\s*(?:→|->|–|—|\s-\s|đến|toi|tới)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) {
    const one = parseNgay(raw);
    return one ? [one, one] : null;
  }
  const a = parseNgay(parts[0]);
  const b = parseNgay(parts[1]);
  if (!a || !b) return null;
  return [a, b];
}

function formatThoiGianRange(range?: [Dayjs, Dayjs] | null): string {
  if (!range?.[0] || !range?.[1]) return '';
  return `${range[0].format('DD/MM/YYYY')} → ${range[1].format('DD/MM/YYYY')}`;
}

export function TabHopDong({
  contractId,
  onChanged,
}: {
  contractId: number;
  onChanged?: (data: ProjectContractFlow) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProjectContractFlow | null>(null);
  const [soThang, setSoThang] = useState<number | null>(null);
  const [ngayBd, setNgayBd] = useState<Dayjs | null>(null);
  const [ngayKt, setNgayKt] = useState<Dayjs | null>(null);
  const [tongKp, setTongKp] = useState(0);
  const [milestones, setMilestones] = useState<MilestoneEdit[]>([]);
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);
  const [funding, setFunding] = useState<ContractFundingRow[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getProjectContractFlow(contractId);
      setData(res.data);
      onChanged?.(res.data);
      const form = res.data.draftForm;
      if (form) {
        setSoThang(form.soThang ? Number(form.soThang) || null : null);
        setNgayBd(parseNgay(form.ngayBatDau));
        setNgayKt(parseNgay(form.ngayKetThuc));
        setTongKp(Number(form.tongKinhPhi) || 0);
        const rows = (form.milestones || []).map((m, i) => ({
          ...m,
          id: `ms-${i}-${Date.now()}`,
          thoiGianRange: parseThoiGianRange(m.thoiGian),
        }));
        setMilestones(rows);
        setEditableKeys(rows.map((r) => r.id));
        setFunding(form.funding || []);
      }
    } catch (e: any) {
      thongBaoLoi(e, 'Không tải được hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contractId]);

  const tongNguon = useMemo(
    () => funding.reduce((s, r) => s + Number(r.amount || 0), 0),
    [funding],
  );

  const wf = data?.workflow;
  const roles = data?.roles;
  const status = data?.status as ProjectContractStatus | undefined;
  const stMap = status ? PROJECT_CONTRACT_STATUS_MAP[status] : null;
  const buoc =
    status === 'HOP_DONG_CHO_PHAT_HANH'
      ? BUOC.length - 1
      : BUOC.findIndex((b) => b.key === status);
  const canEdit = !!roles?.canManage && !!data?.canEditDraft;

  const chay = async (viec: () => Promise<unknown>, ok: string) => {
    setSaving(true);
    try {
      const res = (await viec()) as { message?: string };
      message.success(res?.message || ok);
      await load();
    } catch (e: any) {
      if (e?.message === 'huy') return;
      thongBaoLoi(e, 'Thất bại');
    } finally {
      setSaving(false);
    }
  };

  const luuVaXuatWord = () => {
    if (!data) return;
    if (tongNguon > 0 && tongKp > 0 && tongNguon !== tongKp) {
      message.warning('Tổng nguồn kinh phí phải bằng tổng kinh phí hợp đồng.');
      return;
    }
    void chay(
      () =>
        saveContractDraftForm(data.id, {
          soThang: soThang ?? '',
          ngayBatDau: formatNgay(ngayBd),
          ngayKetThuc: formatNgay(ngayKt),
          tongKinhPhi: tongKp,
          milestones: milestones.map(
            ({ content, thoiGian, thoiGianRange, sanPham }) => ({
              content,
              thoiGian: formatThoiGianRange(thoiGianRange) || thoiGian || '',
              sanPham,
            }),
          ),
          funding: funding.map((f) => ({ code: f.code, amount: f.amount })),
        }),
      'Đã lưu dự thảo và cập nhật Word',
    );
  };

  const milestoneCols: ProColumns<MilestoneEdit>[] = [
    {
      title: 'STT',
      width: 56,
      editable: false,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Nội dung công việc',
      dataIndex: 'content',
      formItemProps: { rules: [{ required: true, message: 'Nhập nội dung' }] },
    },
    {
      title: 'Thời gian thực hiện',
      dataIndex: 'thoiGianRange',
      valueType: 'dateRange',
      width: 280,
      fieldProps: {
        format: 'DD/MM/YYYY',
        placeholder: ['Từ ngày', 'Đến ngày'],
        allowEmpty: [true, true] as [boolean, boolean],
        style: { width: '100%' },
      },
      transform: (value: any) => {
        if (!value) return { thoiGianRange: null };
        const a = Array.isArray(value) ? value[0] : null;
        const b = Array.isArray(value) ? value[1] : null;
        const da = a ? dayjs(a) : null;
        const db = b ? dayjs(b) : null;
        if (da?.isValid() && db?.isValid()) {
          return { thoiGianRange: [da, db] as [Dayjs, Dayjs] };
        }
        return { thoiGianRange: null };
      },
      render: (_, row) =>
        formatThoiGianRange(row.thoiGianRange) || row.thoiGian || '—',
    },
    {
      title: 'Sản phẩm/kết quả',
      dataIndex: 'sanPham',
      width: 220,
    },
    {
      title: '',
      valueType: 'option',
      width: 72,
      render: () => null,
    },
  ];

  if (loading && !data) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spin />
      </div>
    );
  }

  if (!data) {
    return <Alert type="error" message="Không tải được hợp đồng." />;
  }

  const footerTrai = (
    <Space wrap size={[8, 8]} align="center">
      {canEdit && (
        <Button
          icon={<ReloadOutlined />}
          loading={saving}
          onClick={() =>
            chay(
              () =>
                generateProjectContract(data.project_outline_id, {
                  forceRegen: true,
                }),
              'Đã làm mới từ thuyết minh',
            )
          }
        >
          Làm mới từ TM
        </Button>
      )}
      <Button
        icon={<FileWordOutlined style={{ color: '#2b579a' }} />}
        onClick={() =>
          downloadProjectContract(data.id, data.file_name).catch((e) =>
            thongBaoLoi(e, 'Tải thất bại'),
          )
        }
      >
        Tải hợp đồng
      </Button>
    </Space>
  );

  const footerPhai = (
    <Space wrap size={[8, 8]}>
      {canEdit && (
        <Button
          type="primary"
          ghost
          icon={<SaveOutlined />}
          loading={saving}
          onClick={luuVaXuatWord}
        >
          Lưu hợp đồng
        </Button>
      )}
      {roles?.canManage && status === 'HOP_DONG_DRAFT' && (
        <Button
          type="primary"
          loading={saving}
          onClick={() =>
            chay(() => submitContractCnnv(data.id), 'Đã trình CNNV')
          }
        >
          Trình CNNV
        </Button>
      )}
      {roles?.canCnnv &&
        status === 'HOP_DONG_CHO_CNNV' &&
        !wf?.cnnvConfirmedAt && (
          <>
            <Button
              danger
              loading={saving}
              onClick={() =>
                chay(
                  async () =>
                    cnnvReturnContract(
                      data.id,
                      await hoiChuoi('Lý do trả lại'),
                    ),
                  'Đã trả',
                )
              }
            >
              Trả lại
            </Button>
            <Button
              type="primary"
              loading={saving}
              onClick={() =>
                chay(() => cnnvConfirmContract(data.id), 'Đã xác nhận')
              }
            >
              CNNV xác nhận
            </Button>
          </>
        )}
      {roles?.canManage &&
        status === 'HOP_DONG_CHO_CNNV' &&
        !!wf?.cnnvConfirmedAt && (
          <Button
            type="primary"
            loading={saving}
            onClick={() =>
              chay(() => submitContractBgh(data.id), 'Đã trình BGH')
            }
          >
            Trình BGH
          </Button>
        )}
      {roles?.canBgh && status === 'HOP_DONG_CHO_KY' && (
        <>
          <Button
            danger
            loading={saving}
            onClick={() =>
              chay(
                async () =>
                  bghReturnContract(data.id, await hoiChuoi('Lý do trả lại')),
                'Đã trả',
              )
            }
          >
            Trả lại
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={() =>
              chay(
                () => bghSignContract(data.id),
                'Đã ký & phát hành — đang thực hiện',
              )
            }
          >
            BGH ký & phát hành
          </Button>
        </>
      )}
      {(roles?.canBgh || roles?.canManage) &&
        status === 'HOP_DONG_CHO_PHAT_HANH' && (
          <Button
            type="primary"
            loading={saving}
            onClick={() =>
              chay(
                () => bghSignContract(data.id),
                'Đã phát hành & hoàn tất hợp đồng',
              )
            }
          >
            Phát hành & hoàn tất
          </Button>
        )}
    </Space>
  );

  return (
    <>
      <Space
        direction="vertical"
        size={16}
        style={{ width: '100%', paddingBottom: 88 }}
      >
        <Steps
          size="small"
          current={buoc < 0 ? 0 : buoc}
          items={BUOC.map((b) => ({ title: b.title }))}
        />
        {wf?.returnReason && (
          <Alert
            type="warning"
            showIcon
            message="Lý do trả lại"
            description={wf.returnReason}
          />
        )}

        <Card
          size="small"
          title={
            <Space>
              <FileTextOutlined style={{ color: '#1677ff' }} />
              <span>Thông tin nhiệm vụ</span>
            </Space>
          }
          extra={stMap ? <Tag color={stMap.color}>{stMap.text}</Tag> : undefined}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
            <Descriptions.Item
              label={
                <Space size={4}>
                  <FileTextOutlined />
                  Tên nhiệm vụ
                </Space>
              }
              span={3}
            >
              <Text strong>
                {data.draftForm?.tenNhiemVu || data.outline?.title}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space size={4}>
                  <BankOutlined />
                  Mã số
                </Space>
              }
            >
              {data.draftForm?.maSo || data.outline?.code}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space size={4}>
                  <UserOutlined />
                  CNNV
                </Space>
              }
            >
              {data.draftForm?.cnnv || data.outline?.owner_name || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space size={4}>
                  <TeamOutlined />
                  Đơn vị
                </Space>
              }
            >
              {data.draftForm?.donVi || data.outline?.owner_unit || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space size={4}>
                  <CalendarOutlined />
                  Thời gian
                </Space>
              }
            >
              {data.draftForm?.thoiGian || '—'}
            </Descriptions.Item>
            <Descriptions.Item
              label={
                <Space size={4}>
                  <WalletOutlined />
                  Kinh phí
                </Space>
              }
            >
              <Text type="success" strong>
                {formatVnd(tongKp || data.draftForm?.tongKinhPhi)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số HĐ">
              {data.contract_no || '—'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <ScheduleOutlined style={{ color: '#13c2c2' }} />
              <span>Thời gian thực hiện</span>
            </Space>
          }
        >
          <Row gutter={[16, 12]}>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 4, color: '#64748b' }}>Số tháng</div>
              <InputNumber
                min={1}
                max={120}
                style={{ width: '100%' }}
                disabled={!canEdit}
                value={soThang ?? undefined}
                onChange={(v) => setSoThang(v == null ? null : Number(v))}
                addonAfter="tháng"
              />
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 4, color: '#64748b' }}>Từ ngày</div>
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabled={!canEdit}
                value={ngayBd}
                onChange={setNgayBd}
              />
            </Col>
            <Col xs={24} sm={8}>
              <div style={{ marginBottom: 4, color: '#64748b' }}>Đến ngày</div>
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                disabled={!canEdit}
                value={ngayKt}
                onChange={setNgayKt}
              />
            </Col>
          </Row>
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <ScheduleOutlined style={{ color: '#722ed1' }} />
              <span>Tiến độ thực hiện</span>
            </Space>
          }
        >
          <EditableProTable<MilestoneEdit>
            rowKey="id"
            size="small"
            value={milestones}
            onChange={(rows) => setMilestones([...(rows || [])])}
            recordCreatorProps={
              canEdit
                ? {
                    newRecordType: 'dataSource',
                    record: () => ({
                      id: `ms-${Date.now()}`,
                      content: '',
                      thoiGian: '',
                      thoiGianRange: null,
                      sanPham: '',
                    }),
                    creatorButtonText: 'Thêm dòng tiến độ',
                    icon: <PlusOutlined />,
                  }
                : false
            }
            columns={milestoneCols}
            editable={{
              type: 'multiple',
              editableKeys: canEdit ? editableKeys : [],
              onChange: setEditableKeys,
              actionRender: (_row, _cfg, defaultDom) =>
                canEdit ? [defaultDom.delete] : [],
            }}
            pagination={false}
          />
        </Card>

        <Card
          size="small"
          title={
            <Space>
              <WalletOutlined style={{ color: '#fa8c16' }} />
              <span>Điều 3. Kinh phí thực hiện nhiệm vụ</span>
            </Space>
          }
        >
          <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 4, color: '#64748b' }}>
                Tổng kinh phí (số)
              </div>
              <InputNumber
                {...vndInputNumberProps}
                min={0}
                style={{ width: '100%' }}
                disabled={!canEdit}
                value={tongKp}
                onChange={(v) => setTongKp(Number(v || 0))}
              />
            </Col>
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 4, color: '#64748b' }}>Bằng chữ</div>
              <Input
                readOnly
                value={data.draftForm?.kinhPhiBangChu || '—'}
                style={{ background: '#f8fafc' }}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Hệ thống tự điền bằng chữ khi lưu / xuất Word.
              </Text>
            </Col>
          </Row>

          <Title level={5} style={{ marginTop: 0, marginBottom: 8 }}>
            Nguồn kinh phí
          </Title>
          <Table
            size="small"
            pagination={false}
            rowKey="code"
            dataSource={funding}
            columns={[
              { title: 'Nguồn kinh phí', dataIndex: 'label' },
              {
                title: 'Số tiền',
                width: 220,
                render: (_, row) =>
                  canEdit ? (
                    <InputNumber
                      {...vndInputNumberProps}
                      min={0}
                      style={{ width: '100%' }}
                      value={row.amount}
                      onChange={(v) =>
                        setFunding((list) =>
                          list.map((f) =>
                            f.code === row.code
                              ? { ...f, amount: Number(v || 0) }
                              : f,
                          ),
                        )
                      }
                    />
                  ) : (
                    formatVnd(row.amount)
                  ),
              },
            ]}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0}>
                  <Text strong>Tổng cộng</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <Text
                    strong
                    type={tongNguon === tongKp ? undefined : 'danger'}
                  >
                    {formatVnd(tongNguon)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
          {canEdit && tongNguon !== tongKp && tongKp > 0 && (
            <Alert
              style={{ marginTop: 12 }}
              type="warning"
              showIcon
              message="Tổng nguồn đang lệch tổng kinh phí — hãy chỉnh cho khớp trước khi lưu."
            />
          )}
        </Card>
      </Space>

      <FooterToolbar extra={footerTrai}>{footerPhai}</FooterToolbar>
    </>
  );
}
