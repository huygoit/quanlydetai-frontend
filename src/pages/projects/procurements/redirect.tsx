/**
 * Redirect /projects/procurements/:id → menu CSVC ?id=
 */
import { getMuaSam } from '@/services/api/module56';
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Alert, Spin } from 'antd';
import { useEffect, useState } from 'react';

const ProcurementRedirectPage: React.FC = () => {
  const { id: raw } = useParams<{ id: string }>();
  const id = Number(raw);
  const [loi, setLoi] = useState('');

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) {
      setLoi('Không tìm thấy yêu cầu mua sắm.');
      return;
    }
    getMuaSam(id)
      .then((res) => {
        const to = res.data?.redirectTo || `/projects/procurements?id=${id}`;
        history.replace(to);
      })
      .catch((e: any) => {
        setLoi(
          e?.data?.message || e?.message || 'Không tải được yêu cầu mua sắm.',
        );
      });
  }, [id]);

  return (
    <PageContainer title="Đang mở yêu cầu mua sắm…">
      {loi ? <Alert type="error" showIcon message={loi} /> : <Spin />}
    </PageContainer>
  );
};

export default ProcurementRedirectPage;
