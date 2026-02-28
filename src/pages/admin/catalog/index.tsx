/**
 * Danh mục hệ thống - Admin
 * Quản lý các danh mục cấu hình hệ thống
 */
import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Tabs, Card } from 'antd';
import { AppstoreOutlined, SettingOutlined } from '@ant-design/icons';
import ResearchOutputTypes from './ResearchOutputTypes';

const AdminCatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('research-output-types');

  return (
    <PageContainer title="Danh mục hệ thống">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'research-output-types',
            label: (
              <span>
                <AppstoreOutlined />
                Loại kết quả NCKH
              </span>
            ),
            children: <ResearchOutputTypes />,
          },
          {
            key: 'other',
            label: (
              <span>
                <SettingOutlined />
                Danh mục khác
              </span>
            ),
            children: (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  Các danh mục khác sẽ được thêm sau...
                </div>
              </Card>
            ),
          },
        ]}
      />
    </PageContainer>
  );
};

export default AdminCatalogPage;
