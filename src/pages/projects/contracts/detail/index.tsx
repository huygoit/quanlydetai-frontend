/**
 * Chi tiết hợp đồng — hub Module 5–6:
 * Triển khai (tạm ứng / tiến độ / ĐC / mua sắm) + Nghiệm thu US-06-01…06.
 */
import { NHAN_TRIEN_KHAI } from '@/constants/module56';
import {
  getProjectContractFlow,
  PROJECT_CONTRACT_STATUS_MAP,
  type ProjectContractFlow,
  type ProjectContractStatus,
} from '@/services/api/projectContracts';
import { getOutline, type ProjectOutline } from '@/services/api/projectOutlines';
import { TabCuoiKy, type PhanCuoiKy } from '@/pages/projects/execution/TabCuoiKy';
import { TabDieuChinh } from '@/pages/projects/execution/TabDieuChinh';
import { TabMuaSam } from '@/pages/projects/execution/TabMuaSam';
import { TabPhieuChi } from '@/pages/projects/execution/TabPhieuChi';
import { TabTienDo } from '@/pages/projects/execution/TabTienDo';
import type { VaiTro } from '@/pages/projects/execution/types';
import { PageContainer } from '@ant-design/pro-components';
import {
  history,
  useAccess,
  useLocation,
  useModel,
  useParams,
} from '@umijs/max';
import {
  AuditOutlined,
  BankOutlined,
  FileDoneOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FormOutlined,
  ScheduleOutlined,
  ShoppingCartOutlined,
  SolutionOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Alert, Card, Space, Spin, Steps, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TabHopDong } from './TabHopDong';

const { Text } = Typography;

function nhanTab(icon: React.ReactNode, text: string, khoa?: string) {
  const noi = (
    <Space size={6}>
      {icon}
      <span>{text}</span>
    </Space>
  );
  // Tab bị khóa → hiện tooltip lý do, không cho click
  if (khoa) {
    return (
      <Tooltip title={khoa}>
        <span>{noi}</span>
      </Tooltip>
    );
  }
  return noi;
}

/** Tab URL — Module 5 + US-06-01…06 */
const TAB_KEYS = [
  'hopdong',
  'tamung',
  'tiendo',
  'dieuchinh',
  'muasam',
  'nghiemthu', // US-06-01
  'hoidong', // US-06-02
  'danhgia', // US-06-03
  'giaitrinh', // US-06-04
  'quyettoan', // US-06-05
  'thanhly', // US-06-06
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function tabTuUrl(search: string): TabKey {
  const tab = new URLSearchParams(search).get('tab') || '';
  return (TAB_KEYS as readonly string[]).includes(tab)
    ? (tab as TabKey)
    : 'hopdong';
}

function TabKhoa({
  children,
  mo,
  tieuDe,
  moTa,
}: {
  children: React.ReactNode;
  mo: boolean;
  tieuDe: string;
  moTa?: string;
}) {
  if (mo) return <>{children}</>;
  return (
    <Alert
      type="info"
      showIcon
      message={tieuDe}
      description={moTa}
      style={{ marginTop: 8 }}
    />
  );
}

/** Bước Module 6 trên Steps — map executionStatus */
function buocModule6(st?: string | null): number {
  switch (st) {
    case 'DGCK_DRAFT':
    case 'DGCK_BS':
    case 'DGCK_CHO_PKH':
      return 0;
    case 'DGCK_HOP_HD':
      return 1;
    case 'DGCK_CHINH_SUA':
    case 'DGCK_KHONG_DAT':
      return 3;
    case 'DGCK_CHO_QUYET_TOAN':
      return 4;
    case 'DGCK_CHO_THANH_LY':
      return 5;
    case 'HOAN_THANH':
      return 6;
    case 'DGCK_DINH_CHI':
      return 3;
    default:
      // DANG_THUC_HIEN / null → vẫn mở được nộp hồ sơ khi tới hạn
      return 0;
  }
}

function moHoiDong(st?: string | null) {
  return [
    'DGCK_HOP_HD',
    'DGCK_CHINH_SUA',
    'DGCK_CHO_QUYET_TOAN',
    'DGCK_CHO_THANH_LY',
    'HOAN_THANH',
    'DGCK_KHONG_DAT',
    'DGCK_DINH_CHI',
  ].includes(String(st || ''));
}

function moDanhGia(st?: string | null) {
  return moHoiDong(st);
}

function moGiaiTrinh(st?: string | null) {
  return ['DGCK_CHINH_SUA', 'DGCK_KHONG_DAT'].includes(String(st || ''));
}

function moQuyetToan(st?: string | null) {
  return ['DGCK_CHO_QUYET_TOAN', 'DGCK_CHO_THANH_LY', 'HOAN_THANH'].includes(
    String(st || ''),
  );
}

function moThanhLy(st?: string | null) {
  return ['DGCK_CHO_THANH_LY', 'HOAN_THANH'].includes(String(st || ''));
}

const ProjectContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const contractId = Number(id);
  const idHopLe = Number.isFinite(contractId) && contractId > 0;
  const access = useAccess();
  const { search } = useLocation();
  const { initialState } = useModel('@@initialState');
  const userId = Number(
    (initialState?.currentUser as { id?: number } | undefined)?.id || 0,
  );

  const [tab, setTab] = useState<TabKey>(tabTuUrl(search));
  const [flow, setFlow] = useState<ProjectContractFlow | null>(null);
  const [outline, setOutline] = useState<ProjectOutline | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);

  useEffect(() => {
    setTab(tabTuUrl(search));
  }, [search]);

  const doiTab = (key: string) => {
    const k = (TAB_KEYS as readonly string[]).includes(key)
      ? (key as TabKey)
      : 'hopdong';
    setTab(k);
    const q = new URLSearchParams(search);
    if (k === 'hopdong') q.delete('tab');
    else q.set('tab', k);
    const qs = q.toString();
    history.replace(
      `/projects/contracts/${contractId}${qs ? `?${qs}` : ''}`,
    );
  };

  const taiOutline = async (outlineId: number) => {
    try {
      const res = await getOutline(outlineId);
      setOutline(res.data);
    } catch {
      setOutline(null);
    }
  };

  useEffect(() => {
    if (!idHopLe) {
      setLoadingMeta(false);
      return;
    }
    setLoadingMeta(true);
    getProjectContractFlow(contractId)
      .then(async (res) => {
        setFlow(res.data);
        await taiOutline(res.data.project_outline_id);
      })
      .catch(() => setFlow(null))
      .finally(() => setLoadingMeta(false));
  }, [contractId, idHopLe]);

  const vaiTro: VaiTro = useMemo(
    () => ({
      canManage: !!access.canContractManage || !!flow?.roles?.canManage,
      canCnnv:
        !!flow?.roles?.canCnnv ||
        (!!outline && Number(outline.ownerId) === Number(userId)),
      canBgh: !!access.canBghSign || !!flow?.roles?.canBgh,
      canPublish: !!access.canPublishContract || !!flow?.roles?.canPublish,
      canTc: !!access.canConfirmOutlineBudget,
      canCsvc: !!access.canHandleProcurement,
      canLead: !!access.canLeadConfirmContract,
      userId,
    }),
    [access, flow, outline, userId],
  );

  if (!access.canViewProjectContracts && !access.canOpenModule56) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền." />
      </PageContainer>
    );
  }

  if (!idHopLe) {
    return (
      <PageContainer>
        <Alert type="error" message="Không tìm thấy hợp đồng." />
      </PageContainer>
    );
  }

  const status = flow?.status as ProjectContractStatus | undefined;
  const stMap = status ? PROJECT_CONTRACT_STATUS_MAP[status] : null;
  const outlineId = flow?.project_outline_id || outline?.id || 0;
  const daMoTrienKhai =
    status === 'HOP_DONG_DA_KY' ||
    !!flow?.executionStatus ||
    !!outline?.executionStatus;
  const stTrienKhai = outline?.executionStatus || flow?.executionStatus || null;
  // Báo cáo tiến độ: CNNV / PKH / TC mới được vào; và HĐ đã mở triển khai
  const coQuyenTienDo =
    vaiTro.canCnnv || vaiTro.canManage || vaiTro.canTc;
  const khoaTienDo = !daMoTrienKhai
    ? 'Mở sau khi hợp đồng đã ký'
    : !coQuyenTienDo
      ? 'Bạn không có quyền xem / lập báo cáo tiến độ'
      : undefined;
  // URL/tab đang trỏ tiến độ nhưng bị khóa → hiện tab hợp đồng
  const tabHien: TabKey = tab === 'tiendo' && khoaTienDo ? 'hopdong' : tab;
  const sanPham = (outline?.expectedProducts || []).map((p) => p.name);
  const ketThuc = outline?.endDate;

  const refreshCuoiKy = (t: string) => {
    if (t) message.success(t);
    if (outlineId) void taiOutline(outlineId);
  };

  const panelCuoi = (phan: PhanCuoiKy) =>
    outlineId > 0 ? (
      <TabCuoiKy
        outlineId={outlineId}
        vaiTro={vaiTro}
        sanPham={sanPham}
        ketThuc={ketThuc}
        phan={phan}
        onXong={refreshCuoiKy}
        onDaMoLai={() => void taiOutline(outlineId)}
      />
    ) : null;

  return (
    <PageContainer
      loading={loadingMeta && !flow}
      title={
        flow
          ? `Hợp đồng ${flow.contract_no || flow.id}`
          : 'Chi tiết hợp đồng'
      }
      subTitle={
        stMap || stTrienKhai ? (
          <>
            {stMap ? <Tag color={stMap.color}>{stMap.text}</Tag> : null}
            {stTrienKhai ? (
              <Tag color="processing">
                {NHAN_TRIEN_KHAI[stTrienKhai] || stTrienKhai}
              </Tag>
            ) : null}
          </>
        ) : undefined
      }
      onBack={() => history.push('/projects/contracts')}
    >
      {!flow && !loadingMeta ? (
        <Alert type="error" message="Không tải được hợp đồng." />
      ) : !flow ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <>
          {daMoTrienKhai && (
            <Card
              size="small"
              bordered={false}
              style={{
                marginBottom: 16,
                borderRadius: 12,
                background:
                  'linear-gradient(135deg, #f8fbff 0%, #f3f7fc 55%, #ffffff 100%)',
              }}
              bodyStyle={{ padding: '16px 20px 8px' }}
            >
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                <Text strong>Luồng nghiệm thu — quyết toán — thanh lý</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  US-06-01 → 06-06 · từng tab mở đúng bước, làm lần lượt cho rõ ràng.
                </Text>
                <Steps
                  size="small"
                  current={buocModule6(stTrienKhai)}
                  style={{ marginTop: 12 }}
                  items={[
                    { title: 'Hồ sơ', description: 'US-06-01' },
                    { title: 'Hội đồng', description: 'US-06-02' },
                    { title: 'Đánh giá', description: 'US-06-03' },
                    { title: 'Giải trình', description: 'US-06-04' },
                    { title: 'Quyết toán', description: 'US-06-05' },
                    { title: 'Thanh lý', description: 'US-06-06' },
                  ]}
                />
              </Space>
            </Card>
          )}

          <Tabs
            destroyInactiveTabPane
            activeKey={tabHien}
            onChange={doiTab}
            items={[
              {
                key: 'hopdong',
                label: nhanTab(<FileTextOutlined />, 'Hợp đồng'),
                children: (
                  <TabHopDong
                    contractId={contractId}
                    onChanged={(d) => {
                      setFlow(d);
                      void taiOutline(d.project_outline_id);
                    }}
                  />
                ),
              },
              {
                key: 'tamung',
                label: nhanTab(<WalletOutlined />, 'Hồ sơ tạm ứng'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai}
                    tieuDe="Mở sau khi hợp đồng đã ký"
                    moTa="Hoàn tất tab Hợp đồng (BGH ký) để dùng tạm ứng."
                  >
                    {outlineId > 0 ? (
                      <TabPhieuChi
                        outlineId={outlineId}
                        vaiTro={vaiTro}
                        onXong={(t) => t && message.success(t)}
                      />
                    ) : null}
                  </TabKhoa>
                ),
              },
              {
                key: 'tiendo',
                label: nhanTab(
                  <ScheduleOutlined />,
                  'Báo cáo tiến độ',
                  khoaTienDo,
                ),
                disabled: !!khoaTienDo,
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai && coQuyenTienDo}
                    tieuDe={khoaTienDo || 'Không mở được tab'}
                    moTa="Lập báo cáo theo mốc tiến độ trên hợp đồng."
                  >
                    {outlineId > 0 ? (
                      <TabTienDo
                        outlineId={outlineId}
                        vaiTro={vaiTro}
                        onXong={(t) => t && message.success(t)}
                      />
                    ) : null}
                  </TabKhoa>
                ),
              },
              {
                key: 'dieuchinh',
                label: nhanTab(<FileProtectOutlined />, 'Điều chỉnh nhiệm vụ'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai}
                    tieuDe="Mở sau khi hợp đồng đã ký"
                  >
                    {outlineId > 0 ? (
                      <TabDieuChinh
                        outlineId={outlineId}
                        extensionCount={outline?.extensionCount || 0}
                        vaiTro={vaiTro}
                        onXong={(t) => t && message.success(t)}
                      />
                    ) : null}
                  </TabKhoa>
                ),
              },
              {
                key: 'muasam',
                label: nhanTab(<ShoppingCartOutlined />, 'Mua sắm vật tư'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai}
                    tieuDe="Mở sau khi hợp đồng đã ký"
                  >
                    {outlineId > 0 ? (
                      <TabMuaSam
                        outlineId={outlineId}
                        vaiTro={vaiTro}
                        onXong={(t) => t && message.success(t)}
                      />
                    ) : null}
                  </TabKhoa>
                ),
              },
              {
                key: 'nghiemthu',
                label: nhanTab(<SolutionOutlined />, 'Hồ sơ nghiệm thu'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai}
                    tieuDe="Mở sau khi hợp đồng đã ký"
                    moTa="US-06-01: CNNV nộp BM.10/BM.11 (báo cáo, sản phẩm, kết quả)."
                  >
                    {panelCuoi('hoso')}
                  </TabKhoa>
                ),
              },
              {
                key: 'hoidong',
                label: nhanTab(<TeamOutlined />, 'Hội đồng đánh giá'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai && moHoiDong(stTrienKhai)}
                    tieuDe="Chưa tới bước hội đồng"
                    moTa="US-06-02: mở sau khi PKH duyệt hồ sơ nghiệm thu và chuyển họp hội đồng."
                  >
                    {panelCuoi('hoidong')}
                  </TabKhoa>
                ),
              },
              {
                key: 'danhgia',
                label: nhanTab(<AuditOutlined />, 'Đánh giá kết quả'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai && moDanhGia(stTrienKhai)}
                    tieuDe="Chưa tới bước đánh giá kết quả"
                    moTa="US-06-03: lập / xem biên bản BM.12b và xếp loại sau khi có hội đồng."
                  >
                    {panelCuoi('danhgia')}
                  </TabKhoa>
                ),
              },
              {
                key: 'giaitrinh',
                label: nhanTab(<FormOutlined />, 'Hồ sơ giải trình'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai && moGiaiTrinh(stTrienKhai)}
                    tieuDe="Chưa cần giải trình"
                    moTa="US-06-04: chỉ mở khi xếp loại cần bổ sung / chỉnh sửa. CNNV nộp → Thư ký → Chủ tịch xác nhận."
                  >
                    {panelCuoi('giaitrinh')}
                  </TabKhoa>
                ),
              },
              {
                key: 'quyettoan',
                label: nhanTab(<BankOutlined />, 'Quyết toán'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai && moQuyetToan(stTrienKhai)}
                    tieuDe="Chưa mở quyết toán"
                    moTa="US-06-05: mở khi đánh giá đạt, hoặc sau khi Chủ tịch & Thư ký xác nhận giải trình."
                  >
                    {panelCuoi('quyettoan')}
                  </TabKhoa>
                ),
              },
              {
                key: 'thanhly',
                label: nhanTab(<FileDoneOutlined />, 'Thanh lý hợp đồng'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai && moThanhLy(stTrienKhai)}
                    tieuDe="Chưa mở thanh lý"
                    moTa="US-06-06 (BM.14): mở sau khi quyết toán hoàn tất."
                  >
                    {panelCuoi('thanhly')}
                  </TabKhoa>
                ),
              },
            ]}
          />
        </>
      )}
    </PageContainer>
  );
};

export default ProjectContractDetailPage;
