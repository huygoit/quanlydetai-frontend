/**
 * Redirect thông báo cũ /projects/adjustments/:id
 * → hub HĐ ?tab=dieuchinh&adjustmentId=
 */
import { getDieuChinh } from '@/services/api/module56';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Alert, Spin } from 'antd';
import { useEffect, useState } from 'react';

const AdjustmentRedirectPage: React.FC = () => {
  const { id: raw } = useParams<{ id: string }>();
  const id = Number(raw);
  const [loi, setLoi] = useState('');

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoi('Không tìm thấy phiếu điều chỉnh.');
      return;
    }
    getDieuChinh(id)
      .then((res) => {
        const to = res.data?.redirectTo;
        if (to) history.replace(to);
        else setLoi('Không xác định được đường dẫn điều chỉnh.');
      })
      .catch((e: any) => {
        setLoi(e?.data?.message || e?.message || 'Không tải được phiếu điều chỉnh.');
      });
  }, [id]);

  return (
    <PageContainer title="Đang mở phiếu điều chỉnh…">
      {loi ? <Alert type="error" showIcon message={loi} /> : <Spin />}
    </PageContainer>
  );
};

export default AdjustmentRedirectPage;
