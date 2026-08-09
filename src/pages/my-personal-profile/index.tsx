/**
 * Hồ sơ cán bộ của tôi — đọc/ghi staffs theo user đăng nhập.
 */
import { PageContainer, FooterToolbar } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { Button, Empty, Spin, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRef, useEffect, useState } from 'react';
import { history } from '@umijs/max';
import StaffProfileForm from '@/components/StaffProfileForm';
import { getMyStaffProfile, updateMyStaffProfile } from '@/services/api/staffs';
import { getDepartmentCatalogOptions } from '@/services/api/departments';
import { formValuesToStaffPayload, staffVaoForm } from '@/utils/staffForm';

const MyStaffProfilePage: React.FC = () => {
  const formRef = useRef<ProFormInstance>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    void loadOptions();
    void loadProfile();
  }, []);

  const loadOptions = async () => {
    try {
      const res = await getDepartmentCatalogOptions({ status: 'ACTIVE' });
      const rows = res.data ?? [];
      if (rows.length > 0) {
        setDepartmentOptions(rows.map((d) => ({ id: d.id, name: d.name })));
      }
    } catch {
      /* optional */
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await getMyStaffProfile();
      if (res.success && res.data) {
        formRef.current?.setFieldsValue(staffVaoForm(res.data));
      } else {
        setNotFound(true);
      }
    } catch (e: any) {
      if (e?.response?.status === 404) setNotFound(true);
      else message.error('Không thể tải hồ sơ nhân sự');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await formRef.current?.validateFields?.();
      if (!values) return;
      setSaving(true);
      const payload = formValuesToStaffPayload(values, { includeAdminFields: false });
      const result = await updateMyStaffProfile(payload);
      if (result?.success && result.data) {
        message.success('Cập nhật hồ sơ thành công');
        formRef.current?.setFieldsValue(staffVaoForm(result.data));
      }
    } catch (e: any) {
      if (e?.errorFields && Array.isArray(e.errorFields)) {
        const firstError = e.errorFields[0]?.errors?.[0];
        if (firstError) message.warning(firstError);
        formRef.current?.scrollToFirstError?.();
      } else {
        message.error(e?.data?.message || e?.message || 'Không lưu được hồ sơ');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!loading && notFound) {
    return (
      <PageContainer title="Hồ sơ cán bộ của tôi">
        <Empty description="Chưa có hồ sơ nhân sự gắn tài khoản. Vui lòng liên hệ quản trị." />
        <Button style={{ marginTop: 16 }} onClick={() => history.push('/home')}>
          Về trang chủ
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Hồ sơ cán bộ của tôi">
      <Spin spinning={loading}>
        <StaffProfileForm
          mode="self"
          formRef={formRef}
          departmentOptions={departmentOptions}
        />
        <FooterToolbar>
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/home')}>
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

export default MyStaffProfilePage;
