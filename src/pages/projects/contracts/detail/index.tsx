/**
 * Chi tiết hợp đồng: phân bổ mục chi và luồng ký BM.06.
 */
import { HAN_FILE, MUC_CHI } from '@/constants/module56';
import { ChonTep } from '@/pages/projects/execution/ChonTep';
import { soMucChi, type DongMucChi } from '@/services/api/module56';
import {
  bghReturnContract,
  bghSignContract,
  cnnvConfirmContract,
  cnnvReturnContract,
  cnnvSignContract,
  downloadProjectContract,
  generateProjectContract,
  getProjectContractFlow,
  PROJECT_CONTRACT_STATUS_MAP,
  publishContract,
  saveContractBudgetLines,
  saveContractClauses,
  saveContractExternal,
  setContractSignMode,
  submitContractBgh,
  submitContractCnnv,
  type ContractClauseField,
  type ProjectContractFlow,
  type ProjectContractStatus,
} from '@/services/api/projectContracts';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Space,
  Steps,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

const BUOC = [
  { key: 'HOP_DONG_DRAFT', title: 'Dự thảo' },
  { key: 'HOP_DONG_CHO_CNNV', title: 'CNNV' },
  { key: 'HOP_DONG_CHO_KY', title: 'BGH' },
  { key: 'HOP_DONG_CHO_PHAT_HANH', title: 'Phát hành' },
  { key: 'HOP_DONG_DA_KY', title: 'Đã ký' },
];

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

const ProjectContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProjectContractFlow | null>(null);
  const [so, setSo] = useState<DongMucChi[]>([]);
  const [amounts, setAmounts] = useState<Record<string, number>>({});
  const [ext] = Form.useForm();
  const [signedUrl, setSignedUrl] = useState('');
  const [signMode, setSignMode] = useState<'ONLINE' | 'GIAY'>('ONLINE');
  const [dieuKhoan, setDieuKhoan] = useState<Record<string, string>>({});

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getProjectContractFlow(Number(id));
      setData(res.data);
      setSignMode(res.data.workflow?.signMode === 'GIAY' ? 'GIAY' : 'ONLINE');
      ext.setFieldsValue({
        externalContractNo: res.data.workflow?.externalContractNo,
        externalAgency: res.data.workflow?.externalAgency,
        externalFileUrl: res.data.workflow?.externalFileUrl,
      });
      const snap = await soMucChi(res.data.project_outline_id).catch(
        () => null,
      );
      const lines = snap?.data || [];
      setSo(lines);
      const next: Record<string, number> = {};
      MUC_CHI.forEach((m) => {
        next[m.code] = lines.find((l) => l.code === m.code)?.planned || 0;
      });
      setAmounts(next);
      const nd: Record<string, string> = {};
      (res.data.clauseFields || []).forEach((f) => {
        nd[f.key] = f.value || '';
      });
      setDieuKhoan(nd);
    } catch (e: any) {
      thongBaoLoi(e, 'Không tải được hợp đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSignedUrl('');
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!access.canViewProjectContracts && !access.canOpenModule56) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền." />
      </PageContainer>
    );
  }

  const wf = data?.workflow;
  const roles = data?.roles;
  const status = data?.status as ProjectContractStatus | undefined;
  const stMap = status ? PROJECT_CONTRACT_STATUS_MAP[status] : null;
  const buoc = BUOC.findIndex((b) => b.key === status);
  const tong = MUC_CHI.reduce((s, m) => s + Number(amounts[m.code] || 0), 0);
  const duyet = Number(data?.outline?.approved_budget || 0);
  const muc09 = Number(amounts.MUC_09 || 0);
  const tran09 = Math.round(tong * 0.05);
  const nhomDieuKhoan: { group: string; items: ContractClauseField[] }[] = [];
  (data?.clauseFields || []).forEach((f) => {
    const co = nhomDieuKhoan.find((n) => n.group === f.group);
    if (co) co.items.push(f);
    else nhomDieuKhoan.push({ group: f.group, items: [f] });
  });
  const suaDieuKhoan =
    !!roles?.canManage && (data?.clauseFields || []).some((f) => f.editable);

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

  return (
    <PageContainer
      loading={loading}
      title={data ? `Hợp đồng ${data.contract_no || data.id}` : 'Hợp đồng'}
      onBack={() => history.push('/projects/contracts')}
      extra={
        data ? (
          <Space wrap>
            {(status === 'HOP_DONG_DA_KY' || data.executionStatus) && (
              <Button
                onClick={() =>
                  history.push(`/projects/execution/${data.project_outline_id}`)
                }
              >
                Triển khai
              </Button>
            )}
            {roles?.canManage && status === 'HOP_DONG_DRAFT' && (
              <Button
                icon={<ReloadOutlined />}
                loading={saving}
                onClick={() =>
                  chay(
                    () =>
                      generateProjectContract(data.project_outline_id, {
                        forceRegen: true,
                      }),
                    'Đã tạo lại dự thảo',
                  )
                }
              >
                Tạo lại dự thảo
              </Button>
            )}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() =>
                downloadProjectContract(data.id, data.file_name).catch((e) =>
                  thongBaoLoi(e, 'Tải thất bại'),
                )
              }
            >
              Tải DOCX
            </Button>
          </Space>
        ) : null
      }
    >
      {data && (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
          <Card size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Số hợp đồng">
                {data.contract_no || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {stMap ? (
                  <Tag color={stMap.color}>{stMap.text}</Tag>
                ) : (
                  data.status
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Mã TM">
                {data.outline?.code}
              </Descriptions.Item>
              <Descriptions.Item label="Phiên bản">
                v{data.version}
              </Descriptions.Item>
              <Descriptions.Item label="Tên nhiệm vụ" span={2}>
                {data.outline?.title}
              </Descriptions.Item>
              <Descriptions.Item label="CNNV">
                {data.outline?.owner_name}
              </Descriptions.Item>
              <Descriptions.Item label="KP đã duyệt">
                {formatVnd(duyet)}
              </Descriptions.Item>
              <Descriptions.Item label="CNNV xác nhận">
                {wf?.cnnvConfirmedAt
                  ? dayjs(wf.cnnvConfirmedAt).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="BGH ký">
                {wf?.bghSignedAt
                  ? dayjs(wf.bghSignedAt).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Số phát hành">
                {wf?.issueNo || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cách ký">
                {wf?.signMode === 'GIAY' ? 'Bản giấy' : 'Trực tuyến'}
              </Descriptions.Item>
              <Descriptions.Item label="CNNV ký">
                {wf?.cnnvSignedAt
                  ? dayjs(wf.cnnvSignedAt).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {nhomDieuKhoan.length > 0 && (
            <Card size="small" title="Điều khoản hợp đồng">
              {nhomDieuKhoan.map((nhom) => (
                <div key={nhom.group} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>
                    {nhom.group}
                  </div>
                  {nhom.items.map((f) =>
                    f.editable ? (
                      <div key={f.key} style={{ marginBottom: 8 }}>
                        <div>{f.label}</div>
                        <Input.TextArea
                          rows={2}
                          value={dieuKhoan[f.key] ?? ''}
                          onChange={(ev) =>
                            setDieuKhoan((s) => ({
                              ...s,
                              [f.key]: ev.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <div key={f.key} style={{ marginBottom: 4 }}>
                        {f.label}: {f.value || '—'}
                      </div>
                    ),
                  )}
                </div>
              ))}
              {suaDieuKhoan && (
                <Button
                  loading={saving}
                  onClick={() =>
                    chay(async () => {
                      const fields: Record<string, string> = {};
                      (data?.clauseFields || []).forEach((f) => {
                        if (f.editable) fields[f.key] = dieuKhoan[f.key] ?? '';
                      });
                      await saveContractClauses(data!.id, fields);
                      await downloadProjectContract(data!.id, data!.file_name);
                    }, 'Đã lưu điều khoản và tải lại DOCX')
                  }
                >
                  Lưu điều khoản
                </Button>
              )}
            </Card>
          )}

          <Card size="small" title="Phân bổ 10 mục chi">
            <Table
              size="small"
              pagination={false}
              rowKey="code"
              dataSource={[...MUC_CHI]}
              columns={[
                { title: 'Mã', dataIndex: 'code', width: 90 },
                { title: 'Nội dung', dataIndex: 'label' },
                {
                  title: 'Số tiền',
                  width: 180,
                  render: (_, m) =>
                    roles?.canManage && status === 'HOP_DONG_DRAFT' ? (
                      <InputNumber
                        {...vndInputNumberProps}
                        min={0}
                        style={{ width: '100%' }}
                        value={amounts[m.code]}
                        onChange={(v) =>
                          setAmounts((s) => ({
                            ...s,
                            [m.code]: Number(v || 0),
                          }))
                        }
                      />
                    ) : (
                      formatVnd(
                        so.find((l) => l.code === m.code)?.planned ??
                          amounts[m.code],
                      )
                    ),
                },
              ]}
            />
            <div style={{ marginTop: 8 }}>
              Tổng phân bổ: <b>{formatVnd(tong)}</b> / đã duyệt{' '}
              {formatVnd(duyet)}
              {muc09 > tran09 && tong > 0 ? ' — mục 09 đang vượt 5%' : ''}
            </div>
            {roles?.canManage && status === 'HOP_DONG_DRAFT' && (
              <Button
                style={{ marginTop: 8 }}
                loading={saving}
                onClick={() =>
                  chay(
                    () =>
                      saveContractBudgetLines(
                        data.id,
                        MUC_CHI.map((m) => ({
                          code: m.code,
                          amount: Number(amounts[m.code] || 0),
                        })),
                      ),
                    'Đã lưu mục chi',
                  )
                }
              >
                Lưu mục chi
              </Button>
            )}
          </Card>

          {roles?.canManage && (
            <Card size="small" title="Hợp đồng ngoài (nếu có)">
              <Form form={ext} layout="vertical">
                <Form.Item name="externalContractNo" label="Số hợp đồng ngoài">
                  <Input />
                </Form.Item>
                <Form.Item name="externalAgency" label="Cơ quan">
                  <Input />
                </Form.Item>
                <Form.Item name="externalFileUrl" label="File">
                  <Input placeholder="Đường dẫn sau khi tải lên" />
                </Form.Item>
                <ChonTep
                  maxBytes={HAN_FILE.phieu}
                  nhan="Tải file hợp đồng ngoài"
                  onCo={(tep) =>
                    ext.setFieldValue('externalFileUrl', tep.fileUrl)
                  }
                />
                <Button
                  style={{ marginTop: 8 }}
                  loading={saving}
                  onClick={() =>
                    chay(
                      () => saveContractExternal(data.id, ext.getFieldsValue()),
                      'Đã lưu',
                    )
                  }
                >
                  Lưu hợp đồng ngoài
                </Button>
              </Form>
            </Card>
          )}

          <Card size="small" title="Ký và chuyển trạng thái">
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {roles?.canManage && status !== 'HOP_DONG_DA_KY' && (
                <Space wrap>
                  <Radio.Group
                    value={signMode}
                    onChange={(e) => setSignMode(e.target.value)}
                  >
                    <Radio value="ONLINE">Trực tuyến</Radio>
                    <Radio value="GIAY">Bản giấy</Radio>
                  </Radio.Group>
                  <Button
                    loading={saving}
                    onClick={() =>
                      chay(
                        () => setContractSignMode(data.id, signMode),
                        'Đã lưu cách ký',
                      )
                    }
                  >
                    Lưu cách ký
                  </Button>
                </Space>
              )}
              <Space wrap>
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
                        type="primary"
                        loading={saving}
                        onClick={() =>
                          chay(
                            () => cnnvConfirmContract(data.id),
                            'Đã xác nhận',
                          )
                        }
                      >
                        CNNV xác nhận nội dung
                      </Button>
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
                      type="primary"
                      loading={saving}
                      onClick={() =>
                        chay(() => bghSignContract(data.id), 'Đã ký')
                      }
                    >
                      BGH ký
                    </Button>
                    <Button
                      danger
                      loading={saving}
                      onClick={() =>
                        chay(
                          async () =>
                            bghReturnContract(
                              data.id,
                              await hoiChuoi('Lý do trả lại'),
                            ),
                          'Đã trả',
                        )
                      }
                    >
                      Trả lại
                    </Button>
                  </>
                )}
                {roles?.canPublish &&
                  status === 'HOP_DONG_CHO_PHAT_HANH' &&
                  !wf?.publishedAt && (
                    <Button
                      type="primary"
                      loading={saving}
                      onClick={() =>
                        chay(
                          async () =>
                            publishContract(
                              data.id,
                              await hoiChuoi('Số phát hành'),
                            ),
                          'Đã phát hành',
                        )
                      }
                    >
                      Phát hành
                    </Button>
                  )}
                {roles?.canCnnv &&
                  status === 'HOP_DONG_CHO_PHAT_HANH' &&
                  !!wf?.publishedAt &&
                  (wf?.signMode === 'GIAY' ? (
                    <Space>
                      <ChonTep
                        maxBytes={HAN_FILE.phieu}
                        nhan="File scan hợp đồng đã ký"
                        onCo={(t) => setSignedUrl(t.fileUrl)}
                      />
                      {signedUrl ? <span>Đã chọn file scan</span> : null}
                      <Button
                        type="primary"
                        loading={saving}
                        disabled={!signedUrl}
                        onClick={() => {
                          if (!signedUrl) {
                            message.warning(
                              'Ký bản giấy cần file scan hợp đồng đã ký.',
                            );
                            return;
                          }
                          void chay(
                            () => cnnvSignContract(data.id, signedUrl),
                            'Đã ký',
                          );
                        }}
                      >
                        CNNV ký
                      </Button>
                    </Space>
                  ) : (
                    <Button
                      type="primary"
                      loading={saving}
                      onClick={() =>
                        chay(() => cnnvSignContract(data.id), 'Đã ký')
                      }
                    >
                      CNNV ký
                    </Button>
                  ))}
              </Space>
            </Space>
          </Card>
        </Space>
      )}
    </PageContainer>
  );
};

export default ProjectContractDetailPage;
