/**
 * Trang tạo/sửa hồ sơ cá nhân (quản trị)
 */
import { PageContainer, FooterToolbar } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { Button, message, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRef, useEffect, useState } from 'react';
import { history, useParams } from '@umijs/max';
import PersonalProfileForm from '@/components/PersonalProfileForm';
import {
  getPersonalProfileById,
  createPersonalProfile,
  updatePersonalProfile,
  type CreatePersonalProfilePayload,
} from '@/services/api/personalProfiles';
import { queryIAMUsers, getDepartmentOptions } from '@/services/api/iamUsers';
import { formValuesToPersonalProfilePayload, hoSoCaNhanVaoForm } from '@/utils/personalProfileForm';

const PersonalProfileEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const profileId = id && id !== 'new' ? Number(id) : null;
  const isEditing = !!profileId;

  const formRef = useRef<ProFormInstance>();
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<{ id: number; name: string }[]>([]);
  const [userOptions, setUserOptions] = useState<{ id: number; label: string }[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    if (isEditing && profileId) {
      loadProfile(profileId);
    } else {
      setLoading(false);
      formRef.current?.setFieldsValue({ status: 'ACTIVE' });
    }
  }, [profileId, isEditing]);

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
      console.error('Load options error:', e);
    }
  };

  const loadProfile = async (pid: number) => {
    setLoading(true);
    try {
      const res = await getPersonalProfileById(pid);
      const data = res?.data || (res as any);
      if (data) {
        formRef.current?.setFieldsValue(hoSoCaNhanVaoForm(data));
      }
    } catch {
      message.error('Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await formRef.current?.validateFields?.();
      if (!values) return;

      const payload = formValuesToPersonalProfilePayload(values, { includeAdminFields: true });

      setSaving(true);
      if (isEditing && profileId) {
        const result = await updatePersonalProfile(profileId, payload);
        if (result?.data || result) {
          message.success('Cập nhật hồ sơ thành công');
          history.push('/admin/personal-profiles');
        }
      } else {
        if (!values.userId) {
          message.error('Vui lòng chọn người dùng');
          return;
        }
        const result = await createPersonalProfile({
          userId: values.userId,
          ...payload,
        } as CreatePersonalProfilePayload);
        if (result?.data || result) {
          message.success('Tạo hồ sơ thành công');
          history.push('/admin/personal-profiles');
        }
      }
    } catch (e: any) {
      if (e?.errorFields && Array.isArray(e.errorFields)) {
        const firstError = e.errorFields[0]?.errors?.[0];
        if (firstError) message.warning(firstError);
        formRef.current?.scrollToFirstError?.();
      } else {
        message.error(e?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      header={{
        title: isEditing ? 'Chỉnh sửa hồ sơ cá nhân' : 'Thêm hồ sơ cá nhân',
        breadcrumb: {
          items: [
            { title: 'Hệ thống' },
            { title: 'Hồ sơ cá nhân', href: '/admin/personal-profiles' },
            { title: isEditing ? 'Chỉnh sửa' : 'Thêm mới' },
          ],
        },
      }}
    >
      <Spin spinning={loading}>
        <PersonalProfileForm
          mode={isEditing ? 'admin-edit' : 'admin-create'}
          formRef={formRef}
          departmentOptions={departmentOptions}
          userOptions={userOptions}
        />
        <FooterToolbar>
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/admin/personal-profiles')}>
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

export default PersonalProfileEditPage;
