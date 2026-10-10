/**
 * Màn triển khai một nhiệm vụ: sổ chi, phiếu, mua sắm, tiến độ, điều chỉnh, đánh giá cuối kỳ.
 */
import { NHAN_TRIEN_KHAI } from '@/constants/module56';
import {
  getOutline,
  type ProjectOutline,
} from '@/services/api/projectOutlines';
import { PageContainer } from '@ant-design/pro-components';
import {
  history,
  useAccess,
  useLocation,
  useModel,
  useParams,
} from '@umijs/max';
import { Alert, Tabs, Tag, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { TabCuoiKy } from './TabCuoiKy';
import { TabDieuChinh } from './TabDieuChinh';
import { TabMuaSam } from './TabMuaSam';
import { TabPhieuChi } from './TabPhieuChi';
import { TabSoMuc } from './TabSoMuc';
import { TabTienDo } from './TabTienDo';
import type { VaiTro } from './types';

function tabMacDinh(path: string) {
  if (path.includes('/final/')) return 'cuoi';
  if (path.includes('/progress/')) return 'tiendo';
  return 'so';
}

const ExecutionPage: React.FC = () => {
  const { outlineId: raw } = useParams<{ outlineId: string }>();
  const outlineId = Number(raw);
  const idHopLe = Number.isFinite(outlineId) && outlineId > 0;
  const access = useAccess();
  const { pathname } = useLocation();
  const { initialState } = useModel('@@initialState');
  const userId = Number(
    (initialState?.currentUser as { id?: number } | undefined)?.id || 0,
  );
  const [outline, setOutline] = useState<ProjectOutline | null>(null);
  const [tab, setTab] = useState(tabMacDinh(pathname));

  useEffect(() => {
    setTab(tabMacDinh(pathname));
  }, [pathname]);

  useEffect(() => {
    if (!idHopLe) return;
    getOutline(outlineId)
      .then((res) => setOutline(res.data))
      .catch(() => setOutline(null));
  }, [idHopLe, outlineId]);

  const vaiTro: VaiTro = useMemo(
    () => ({
      canManage: !!access.canContractManage,
      canCnnv: !!outline && outline.ownerId === userId,
      canBgh: !!access.canBghSign,
      canPublish: !!access.canPublishContract,
      canTc: !!access.canConfirmOutlineBudget,
      canCsvc: !!access.canHandleProcurement,
      canLead: !!access.canLeadConfirmContract,
      userId,
    }),
    [access, outline, userId],
  );

  if (!access.canOpenModule56) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền." />
      </PageContainer>
    );
  }

  // Id route không phải số thì không gọi API, tránh query project_outlines với NaN.
  if (!idHopLe) {
    return (
      <PageContainer>
        <Alert type="error" message="Không tìm thấy nhiệm vụ." />
      </PageContainer>
    );
  }

  const st = outline?.executionStatus;

  return (
    <PageContainer
      title={
        outline ? `${outline.code} — ${outline.title}` : 'Triển khai nhiệm vụ'
      }
      subTitle={st ? <Tag>{NHAN_TRIEN_KHAI[st] || st}</Tag> : undefined}
      onBack={() => history.push('/projects/contracts')}
    >
      <Tabs
        destroyInactiveTabPane
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'so',
            label: 'Sổ mục chi',
            children: <TabSoMuc outlineId={outlineId} />,
          },
          {
            key: 'chi',
            label: 'Tạm ứng / thanh toán',
            children: (
              <TabPhieuChi
                outlineId={outlineId}
                vaiTro={vaiTro}
                onXong={(t) => t && message.success(t)}
              />
            ),
          },
          {
            key: 'mua',
            label: 'Mua sắm',
            children: (
              <TabMuaSam
                outlineId={outlineId}
                vaiTro={vaiTro}
                onXong={(t) => t && message.success(t)}
              />
            ),
          },
          {
            key: 'tiendo',
            label: 'Tiến độ',
            children: (
              <TabTienDo
                outlineId={outlineId}
                vaiTro={vaiTro}
                onXong={(t) => t && message.success(t)}
              />
            ),
          },
          {
            key: 'dieuchinh',
            label: 'Điều chỉnh',
            children: (
              <TabDieuChinh
                outlineId={outlineId}
                extensionCount={outline?.extensionCount || 0}
                vaiTro={vaiTro}
                onXong={(t) => t && message.success(t)}
              />
            ),
          },
          {
            key: 'cuoi',
            label: 'Đánh giá cuối kỳ',
            children: (
              <TabCuoiKy
                outlineId={outlineId}
                vaiTro={vaiTro}
                sanPham={(outline?.expectedProducts || []).map((p) => p.name)}
                ketThuc={outline?.endDate}
                onXong={(t) => t && message.success(t)}
              />
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default ExecutionPage;
