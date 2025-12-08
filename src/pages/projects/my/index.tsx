/**
 * Đề tài của tôi
 */
import { PageContainer } from '@ant-design/pro-components';
import { Card } from 'antd';

const MyProjectsPage: React.FC = () => {
  return (
    <PageContainer>
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          📁 Đề tài của tôi - Đang phát triển
        </div>
      </Card>
    </PageContainer>
  );
};

export default MyProjectsPage;
