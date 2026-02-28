/**
 * Danh mục hệ thống (redirect to /admin/catalog)
 * @deprecated Use /admin/catalog instead
 */
import { Navigate } from '@umijs/max';

const AdminCatalogsPage: React.FC = () => {
  return <Navigate to="/admin/catalog" replace />;
};

export default AdminCatalogsPage;
