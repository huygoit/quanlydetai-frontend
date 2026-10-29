/**
 * Route BM.05a — mở layer sheet form nhập phiếu (không mở TM mặc định)
 */
import { PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { useEffect, useState } from 'react';
import Bm05aScoreSheet from './Bm05aScoreSheet';

const Bm05aPage: React.FC = () => {
  const { sheetId } = useParams<{ sheetId: string }>();
  const id = Number(sheetId);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [id]);

  const close = () => {
    setOpen(false);
    history.push('/projects/defenses/my-tasks');
  };

  return (
    <PageContainer title="Phiếu BM.05a" onBack={close}>
      <Bm05aScoreSheet
        open={open && Number.isFinite(id)}
        sheetId={Number.isFinite(id) ? id : null}
        onClose={close}
      />
    </PageContainer>
  );
};

export default Bm05aPage;
