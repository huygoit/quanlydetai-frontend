/**
 * Danh mục hệ thống - Admin
 * Quản lý các danh mục cấu hình hệ thống
 */
import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Tabs, Card } from 'antd';
import { useAccess } from '@umijs/max';
import { AppstoreOutlined, SettingOutlined, ApartmentOutlined, ReadOutlined, ClusterOutlined, PartitionOutlined } from '@ant-design/icons';
import ResearchOutputTypes from './ResearchOutputTypes';
import Fields from './Fields';
import Specializations from './Specializations';
import ProjectProcessTypes from './ProjectProcessTypes';
import Departments from '@/pages/admin/departments';

const AdminCatalogPage: React.FC = () => {
  const access = useAccess();

  // Chỉ hiển thị tab mà người dùng có quyền xem
  const items = [
    access.canViewDepartments && {
      key: 'departments',
      label: (
        <span>
          <ClusterOutlined />
          Đơn vị
        </span>
      ),
      children: <Departments />,
    },
    access.canViewCatalog && {
      key: 'research-output-types',
      label: (
        <span>
          <AppstoreOutlined />
          Loại kết quả NCKH
        </span>
      ),
      children: <ResearchOutputTypes />,
    },
    access.canViewFields && {
      key: 'fields',
      label: (
        <span>
          <ApartmentOutlined />
          Lĩnh vực
        </span>
      ),
      children: <Fields />,
    },
    access.canViewSpecializations && {
      key: 'specializations',
      label: (
        <span>
          <ReadOutlined />
          Chuyên ngành
        </span>
      ),
      children: <Specializations />,
    },
    access.canViewProjectProcessTypes && {
      key: 'project-process-types',
      label: (
        <span>
          <PartitionOutlined />
          Loại quy trình đề tài
        </span>
      ),
      children: <ProjectProcessTypes />,
    },
    access.canViewCatalog && {
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
  ].filter(Boolean) as { key: string; label: React.ReactNode; children: React.ReactNode }[];

  const [activeTab, setActiveTab] = useState(items[0]?.key);

  return (
    <PageContainer title="Danh mục hệ thống">
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
    </PageContainer>
  );
};

export default AdminCatalogPage;
