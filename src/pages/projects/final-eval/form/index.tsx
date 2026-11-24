/**
 * Trang độc lập — form Phiếu đánh giá kết quả cuối kỳ (thành viên HĐ).
 * Không dùng getOutline (thành viên HĐ thường không có quyền xem TM).
 */
import { FormDanhGiaThanhVienHd } from '@/pages/projects/contracts/detail/FormDanhGiaThanhVienHd';
import { hoSoCuoiKy, type HoSoCuoiKy } from '@/services/api/module56';
import type { ProjectOutline } from '@/services/api/projectOutlines';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel, useParams } from '@umijs/max';
import { Alert, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';

const FinalEvalFormPage: React.FC = () => {
  const { outlineId: raw } = useParams<{ outlineId: string }>();
  const outlineId = Number(raw);
  const { initialState } = useModel('@@initialState');
  const userId = Number(
    (initialState?.currentUser as { id?: number } | undefined)?.id || 0,
  );

  const [hs, setHs] = useState<HoSoCuoiKy | null>(null);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(outlineId) || outlineId <= 0) {
      setLoi('Không tìm thấy nhiệm vụ.');
      setLoading(false);
      return;
    }
    setLoading(true);
    hoSoCuoiKy(outlineId)
      .then((res) => {
        setHs(res.data);
        setLoi(null);
      })
      .catch((e) => {
        setHs(null);
        setLoi(layThongBaoLoi(e, 'Không tải được hồ sơ đánh giá'));
      })
      .finally(() => setLoading(false));
  }, [outlineId]);

  /** Outline tối thiểu để Form đọc expectedResults */
  const outlineLite = useMemo(() => {
    if (!hs) return null;
    return {
      id: hs.projectOutlineId,
      code: hs.code,
      title: hs.title,
      expectedResults: hs.expectedResults || null,
    } as ProjectOutline;
  }, [hs]);

  const laThanhVienHd = useMemo(() => {
    if (!hs || !userId) return false;
    return (hs.council?.members || []).some(
      (m) => Number(m.userId) === Number(userId),
    );
  }, [hs, userId]);

  return (
    <PageContainer
      title="Phiếu đánh giá kết quả cuối kỳ"
      subTitle={hs ? `${hs.code || ''} — ${hs.title || ''}` : undefined}
      extra={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() =>
            history.push(`/projects/final-eval/my/${outlineId}`)
          }
        >
          Về hội đồng của tôi
        </Button>
      }
    >
      {loading ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Spin />
        </div>
      ) : loi ? (
        <Alert type="error" showIcon message={loi} />
      ) : !userId ? (
        <Alert type="error" showIcon message="Chưa đăng nhập." />
      ) : !laThanhVienHd ? (
        <Alert
          type="warning"
          showIcon
          message="Bạn không nằm trong hội đồng đánh giá của nhiệm vụ này."
          description="Chỉ thành viên đã được PKH thêm vào hội đồng mới được nhập phiếu."
        />
      ) : (
        <FormDanhGiaThanhVienHd
          outlineId={outlineId}
          outline={outlineLite}
          userId={userId}
          onXong={(t) => {
            if (t) message.success(t);
          }}
        />
      )}
    </PageContainer>
  );
};

export default FinalEvalFormPage;
