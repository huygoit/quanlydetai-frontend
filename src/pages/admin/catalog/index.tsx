/**
 * Danh mục hệ thống - Admin
 * Quản lý các danh mục cấu hình hệ thống
 */
import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Tabs, Card } from 'antd';
import { AppstoreOutlined, SettingOutlined, ApartmentOutlined, ReadOutlined, ClusterOutlined } from '@ant-design/icons';
import ResearchOutputTypes from './ResearchOutputTypes';
import Fields from './Fields';
import Specializations from './Specializations';
import Departments from '@/pages/admin/departments';

const AdminCatalogPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('departments');

  return (
    <PageContainer title="Danh mục hệ thống">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'departments',
            label: (
              <span>
                <ClusterOutlined />
                Đơn vị
              </span>
            ),
            children: <Departments />,
          },
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
            key: 'fields',
            label: (
              <span>
                <ApartmentOutlined />
                Lĩnh vực
              </span>
            ),
            children: <Fields />,
          },
          {
            key: 'specializations',
            label: (
              <span>
                <ReadOutlined />
                Chuyên ngành
              </span>
            ),
            children: <Specializations />,
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
