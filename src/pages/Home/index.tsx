/**
 * Home Page - Entry point
 * Mapping Role → Home layout theo specs/auth-login.md Section 6
 */
import { Spin } from 'antd';
import { useModel } from '@umijs/max';
import { HomeForCNDT, HomeForPhongKH, HomeForLanhDao } from './components';
import styles from './index.less';

const HomePage: React.FC = () => {
  const { initialState, loading } = useModel('@@initialState');

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  // Lấy role từ currentUser
  const role = initialState?.currentUser?.role || 'NCV';

  /**
   * Mapping Role → Home layout (theo specs/auth-login.md Section 6)
   * - PHONG_KH, HOI_DONG → HomeForPhongKH
   * - LANH_DAO, ADMIN → HomeForLanhDao
   * - NCV, CNDT, TRUONG_DON_VI và mặc định → HomeForCNDT
   */
  if (role === 'PHONG_KH' || role === 'HOI_DONG') {
    return <HomeForPhongKH />;
  }

  if (role === 'LANH_DAO' || role === 'ADMIN') {
    return <HomeForLanhDao />;
  }

  // NCV, CNDT, TRUONG_DON_VI và mặc định
  return <HomeForCNDT />;
};

export default HomePage;
