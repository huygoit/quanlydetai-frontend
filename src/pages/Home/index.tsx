/**
 * Home / Dashboard: có quyền báo cáo → charts; không → trang chủ theo vai trò
 */
import { Spin } from 'antd';
import { useModel, useAccess } from '@umijs/max';
import ReportsDashboard from '@/pages/reports/dashboard';
import { HomeForCNDT, HomeForPhongKH, HomeForLanhDao } from './components';
import styles from './index.less';

const HomePage: React.FC = () => {
  const { initialState, loading } = useModel('@@initialState');
  const access = useAccess();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  if (access.canViewReports) {
    return <ReportsDashboard />;
  }

  // Ưu tiên permission: Lãnh đạo (approve order) → PhongKH (manage idea/council) → CNDT
  if (access.canApproveOrder) {
    return <HomeForLanhDao />;
  }
  if (access.canManageIdeaBank || access.canAccessCouncil || access.canReviewProjectProposal) {
    return <HomeForPhongKH />;
  }

  return <HomeForCNDT />;
};

export default HomePage;
