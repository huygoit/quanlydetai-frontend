/**
 * Home / Dashboard theo vai trò
 * Cán bộ/GV → HomeForCNDT (tổng quan hồ sơ từ DB)
 * Phòng KH / Lãnh đạo → dashboard nghiệp vụ tương ứng
 */
import { Spin } from 'antd';
import { useModel, useAccess } from '@umijs/max';
import { HomeForCNDT, HomeForPhongKH, HomeForLanhDao } from './components';
import styles from './index.less';

const HomePage: React.FC = () => {
  const { loading } = useModel('@@initialState');
  const access = useAccess();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  // Lãnh đạo → Phòng KH → cán bộ/GV. Thành viên hội đồng chỉ có quyền chấm, không mở dashboard Phòng KH.
  if (access.canApproveOrder) {
    return <HomeForLanhDao />;
  }
  if (access.canManageIdeaBank || access.canReviewProjectProposal) {
    return <HomeForPhongKH />;
  }

  return <HomeForCNDT />;
};

export default HomePage;
