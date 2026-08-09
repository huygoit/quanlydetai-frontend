/**
 * Tạo / sửa hồ sơ nhân sự — ghi thẳng API staffs
 */
import { PageContainer, FooterToolbar } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { Button, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRef, useEffect, useState } from 'react';
import { history, useParams } from '@umijs/max';
import StaffProfileForm from '@/components/StaffProfileForm';
import {
  getStaff,
  createStaff,
  updateStaff,
  type StaffWritePayload,
} from '@/services/api/staffs';
import { queryIAMUsers, getDepartmentOptions } from '@/services/api/iamUsers';
import { formValuesToStaffPayload, staffVaoForm } from '@/utils/staffForm';

const StaffEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const staffId = id && id !== 'new' ? Number(id) : null;
  const isEditing = !!staffId && Number.isFinite(staffId);

  const formRef = useRef<ProFormInstance>();
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<{ id: number; name: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => {
    void loadOptions();
  }, []);

  useEffect(() => {
    if (isEditing && staffId) {
      void loadStaff(staffId);
    } else {
      setLoading(false);
    }
  }, [staffId, isEditing]);

  const loadOptions = async () => {
    try {
      const [depts, usersRes] = await Promise.all([
        getDepartmentOptions(),
        queryIAMUsers({ perPage: 500 }),
      ]);
      if (depts) setDepartmentOptions(depts);
      const userList = Array.isArray(usersRes?.data) ? usersRes.data : usersRes?.data?.data ?? [];
      if (userList.length > 0) {
        setUserOptions(
          userList.map((u: any) => ({
            id: u.id,
            label: `${u.full_name || u.fullName || u.email} (${u.email})`,
          })),
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadStaff = async (sid: number) => {
    setLoading(true);
    try {
      const res = await getStaff(sid);
      const data = res?.data || (res as any);
      if (data) formRef.current?.setFieldsValue(staffVaoForm(data));
    } catch {
      message.error('Không thể tải hồ sơ nhân sự');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await formRef.current?.validateFields?.();
      if (!values) return;
      const payload = formValuesToStaffPayload(values, { includeAdminFields: true });
      setSaving(true);
      if (isEditing && staffId) {
        const result = await updateStaff(staffId, payload);
        if (result?.data || result) {
          message.success('Cập nhật hồ sơ nhân sự thành công');
          history.push('/admin/staffs');
        }
      } else {
        if (!payload.staffCode || !payload.fullName) {
          message.error('Vui lòng nhập mã NV và họ tên');
          return;
        }
        const result = await createStaff(payload as StaffWritePayload);
        if (result?.data || result) {
          message.success('Tạo hồ sơ nhân sự thành công');
          history.push('/admin/staffs');
        }
      }
    } catch (e: any) {
      if (e?.errorFields && Array.isArray(e.errorFields)) {
        const firstError = e.errorFields[0]?.errors?.[0];
        if (firstError) message.warning(firstError);
        formRef.current?.scrollToFirstError?.();
      } else {
        message.error(e?.data?.message || e?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      header={{
        title: isEditing ? 'Chỉnh sửa hồ sơ nhân sự' : 'Thêm hồ sơ nhân sự',
        breadcrumb: {
          items: [
            { title: 'Hồ sơ' },
            { title: 'Danh sách hồ sơ nhân sự', href: '/admin/staffs' },
            { title: isEditing ? 'Chỉnh sửa' : 'Thêm mới' },
          ],
        },
      }}
    >
      <Spin spinning={loading}>
        <StaffProfileForm
          mode={isEditing ? 'admin-edit' : 'admin-create'}
          formRef={formRef}
          departmentOptions={departmentOptions}
          userOptions={userOptions}
        />
        <FooterToolbar>
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/admin/staffs')}>
            Quay lại
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            Lưu
          </Button>
        </FooterToolbar>
      </Spin>
    </PageContainer>
  );
};

export default StaffEditPage;
