/**
 * Nghiệm thu, thanh lý — từ Hồ sơ đề nghị ĐGKQNV đến Thanh lý.
 */
import {
  NHAN_TRIEN_KHAI,
  ST_CHINH_SUA,
  ST_CHO_QUYET_TOAN,
} from '@/constants/module56';
import { ModalThanhLapHoiDongDgck } from '@/pages/projects/contracts/detail/ModalThanhLapHoiDongDgck';
import { TabHoSoDeNghiKQNV } from '@/pages/projects/contracts/detail/TabHoSoDeNghiKQNV';
import { TabCuoiKy, type PhanCuoiKy } from '@/pages/projects/execution/TabCuoiKy';
import type { VaiTro } from '@/pages/projects/execution/types';
import {
  getProjectContractFlow,
  PROJECT_CONTRACT_STATUS_MAP,
  type ProjectContractFlow,
  type ProjectContractStatus,
} from '@/services/api/projectContracts';
import { getOutline, type ProjectOutline } from '@/services/api/projectOutlines';
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
  FileSearchOutlined,
  FormOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Alert, Space, Spin, Tabs, Tag, Tooltip, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';

function nhanTab(icon: React.ReactNode, text: string, khoa?: string) {
  const noi = (
    <Space size={6}>
      {icon}
      <span>{text}</span>
    </Space>
  );
  if (khoa) {
    return (
      <Tooltip title={khoa}>
        <span>{noi}</span>
      </Tooltip>
    );
  }
  return noi;
}

const TAB_KEYS = [
  'denghi',
  'hoidong',
  'danhgia',
  'giaitrinh',
  'quyettoan',
  'thanhly',
] as const;
type TabKey = (typeof TAB_KEYS)[number];

function tabTuUrl(search: string): TabKey {
  const tab = new URLSearchParams(search).get('tab') || '';
  // Tab cũ «Hồ sơ nghiệm thu» → đề nghị ĐGKQNV
  if (tab === 'nghiemthu') return 'denghi';
  return (TAB_KEYS as readonly string[]).includes(tab)
    ? (tab as TabKey)
    : 'denghi';
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

function moHoiDong(st?: string | null) {
  return [
    'DGCK_HOP_HD',
    'DGCK_CHINH_SUA',
    'NT_CHINH_SUA',
    'DGCK_CHO_QUYET_TOAN',
    'NT_CHO_QUYETTOAN',
    'DGCK_CHO_THANH_LY',
    'HOAN_THANH',
    'DGCK_KHONG_DAT',
    'NT_KHONG_DAT',
    'DGCK_DINH_CHI',
  ].includes(String(st || ''));
}

/** Mở tab giải trình khi đang bổ sung, hoặc sau đó để xem lại hồ sơ đã nộp. */
function moGiaiTrinh(st?: string | null) {
  const s = String(st || '');
  return (
    ST_CHINH_SUA.includes(s) ||
    ST_CHO_QUYET_TOAN.includes(s) ||
    ['DGCK_CHO_THANH_LY', 'HOAN_THANH'].includes(s)
  );
}

function moQuyetToan(st?: string | null) {
  return (
    ST_CHO_QUYET_TOAN.includes(String(st || '')) ||
    ['DGCK_CHO_THANH_LY', 'HOAN_THANH'].includes(String(st || ''))
  );
}

function moThanhLy(st?: string | null) {
  return ['DGCK_CHO_THANH_LY', 'HOAN_THANH'].includes(String(st || ''));
}

const NghiemThuThanhLyDetailPage: React.FC = () => {
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
  const [epTrangThaiHd, setEpTrangThaiHd] = useState(false);

  useEffect(() => {
    setTab(tabTuUrl(search));
  }, [search]);

  const doiTab = (key: string) => {
    const k = (TAB_KEYS as readonly string[]).includes(key)
      ? (key as TabKey)
      : 'denghi';
    setTab(k);
    const q = new URLSearchParams(search);
    if (k === 'denghi') q.delete('tab');
    else q.set('tab', k);
    const qs = q.toString();
    history.replace(
      `/projects/nghiem-thu-thanh-ly/${contractId}${qs ? `?${qs}` : ''}`,
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
          ? `Nghiệm thu / thanh lý — ${flow.contract_no || flow.id}`
          : 'Nghiệm thu, thanh lý nhiệm vụ'
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
      onBack={() => history.push('/projects/nghiem-thu-thanh-ly')}
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
            activeKey={tab}
            onChange={doiTab}
            items={[
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
                    moTa="CNNV chuẩn bị đơn BM-05.01, báo cáo BM-05.02 và minh chứng kết quả."
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
              {
                key: 'hoidong',
                label: nhanTab(<TeamOutlined />, 'Hội đồng đánh giá'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai && moHoiDong(stTrienKhai)}
                    tieuDe="Chưa tới bước hội đồng"
                    moTa="Mở sau khi PKH duyệt hồ sơ và chuyển họp hội đồng."
                  >
                    {panelCuoi('hoidong')}
                  </TabKhoa>
                ),
              },
              {
                key: 'danhgia',
                label: nhanTab(<AuditOutlined />, 'Biên bản đánh giá'),
                children: (
                  <TabKhoa
                    mo={daMoTrienKhai && moHoiDong(stTrienKhai)}
                    tieuDe="Chưa tới bước đánh giá kết quả"
                    moTa="Lập / xem biên bản BM-05.06 và xếp loại sau khi có hội đồng."
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
                    moTa="Tab này mở khi xếp loại cần bổ sung, hoặc để xem lại sau khi đã nộp."
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
                    moTa="Mở khi đánh giá đạt, hoặc sau khi xác nhận giải trình."
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
                    moTa="Mở sau khi quyết toán hoàn tất."
                  >
                    {panelCuoi('thanhly')}
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
                doiTab('hoidong');
              }}
            />
          )}
        </>
      )}
    </PageContainer>
  );
};

export default NghiemThuThanhLyDetailPage;
