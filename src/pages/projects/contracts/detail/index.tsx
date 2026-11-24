/**
 * Chi tiết hợp đồng — Module 5:
 * Hợp đồng → tạm ứng / tiến độ / ĐC / mua sắm → Hồ sơ đề nghị ĐGKQNV (tab cuối).
 * Nghiệm thu / thanh lý chuyển sang menu «Nghiệm thu, thanh lý nhiệm vụ».
 */
import { NHAN_TRIEN_KHAI } from '@/constants/module56';
import {
  getProjectContractFlow,
  PROJECT_CONTRACT_STATUS_MAP,
  type ProjectContractFlow,
  type ProjectContractStatus,
} from '@/services/api/projectContracts';
import { getOutline, type ProjectOutline } from '@/services/api/projectOutlines';
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
  FileProtectOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Alert, Space, Spin, Tabs, Tag, Tooltip, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { ModalThanhLapHoiDongDgck } from './ModalThanhLapHoiDongDgck';
import { TabHopDong } from './TabHopDong';
import { TabHoSoDeNghiKQNV } from './TabHoSoDeNghiKQNV';

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

/** Tab URL — chỉ đến Hồ sơ đề nghị ĐGKQNV */
const TAB_KEYS = [
  'hopdong',
  'tamung',
  'tiendo',
  'dieuchinh',
  'muasam',
  'denghi',
] as const;
type TabKey = (typeof TAB_KEYS)[number];

/** Tab cũ thuộc nghiệm thu → chuyển sang menu mới */
const TAB_NT_CU = [
  'hoidong',
  'danhgia',
  'giaitrinh',
  'quyettoan',
  'thanhly',
] as const;

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
  const [moModalHd, setMoModalHd] = useState(false);
  /** Sau PKH duyệt đủ, ép modal nhận DGCK_HOP_HD trước khi outline refresh xong */
  const [epTrangThaiHd, setEpTrangThaiHd] = useState(false);

  useEffect(() => {
    const raw = new URLSearchParams(search).get('tab') || '';
    // Link cũ tab nghiệm thu / HĐ… → menu Nghiệm thu, thanh lý
    if (raw === 'nghiemthu' && idHopLe) {
      history.replace(
        `/projects/nghiem-thu-thanh-ly/${contractId}?tab=denghi`,
      );
      return;
    }
    if ((TAB_NT_CU as readonly string[]).includes(raw) && idHopLe) {
      history.replace(
        `/projects/nghiem-thu-thanh-ly/${contractId}?tab=${raw}`,
      );
      return;
    }
    setTab(tabTuUrl(search));
  }, [search, contractId, idHopLe]);

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
                    hienThanhLapHoiDong={
                      daMoTrienKhai && !!vaiTro.canManage
                    }
                    onThanhLapHoiDong={() => {
                      setEpTrangThaiHd(false);
                      setMoModalHd(true);
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
                key: 'denghi',
                label: nhanTab(
                  <FileSearchOutlined />,
                  'Hồ sơ đề nghị đánh giá KQNV',
                ),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai}
                    tieuDe="Mở sau khi hợp đồng đã ký"
                    moTa="CNNV chuẩn bị đơn BM-05.01, báo cáo BM-05.02 và minh chứng. Sau khi nộp, tiếp tục tại menu «Nghiệm thu, thanh lý nhiệm vụ»."
                  >
                    {outlineId > 0 ? (
                      <TabHoSoDeNghiKQNV
                        outlineId={outlineId}
                        outline={outline}
                        vaiTro={vaiTro}
                        onXong={(t) => {
                          if (t) message.success(t);
                          void taiOutline(outlineId);
                        }}
                        onThanhLapHoiDong={() => {
                          setEpTrangThaiHd(true);
                          setMoModalHd(true);
                        }}
                      />
                    ) : null}
                  </TabKhoa>
                ),
              },
            ]}
          />

          {outlineId > 0 && (
            <ModalThanhLapHoiDongDgck
              open={moModalHd}
              outlineId={outlineId}
              executionStatus={
                epTrangThaiHd ? 'DGCK_HOP_HD' : stTrienKhai
              }
              onClose={() => {
                setMoModalHd(false);
                setEpTrangThaiHd(false);
              }}
              onDone={() => {
                setEpTrangThaiHd(false);
                void taiOutline(outlineId);
                history.push(
                  `/projects/nghiem-thu-thanh-ly/${contractId}?tab=hoidong`,
                );
              }}
            />
          )}
        </>
      )}
    </PageContainer>
  );
};

export default ProjectContractDetailPage;
