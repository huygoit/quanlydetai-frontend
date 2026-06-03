/**
 * Hồ sơ cán bộ của tôi — cùng form admin, tự xem và lưu.
 */
import { PageContainer, FooterToolbar } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { Button, Empty, Spin, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRef, useEffect, useState } from 'react';
import { history, useModel } from '@umijs/max';
import PersonalProfileForm from '@/components/PersonalProfileForm';
import { getMyPersonalProfile, updateMyPersonalProfile } from '@/services/api/personalProfiles';
import { getDepartmentCatalogOptions } from '@/services/api/departments';
import { formValuesToPersonalProfilePayload, hoSoCaNhanVaoForm } from '@/utils/personalProfileForm';

const MyPersonalProfilePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const formRef = useRef<ProFormInstance>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    loadOptions();
    loadProfile();
  }, []);

  const loadOptions = async () => {
    try {
      const res = await getDepartmentCatalogOptions({ status: 'ACTIVE' });
      const rows = res.data ?? [];
      if (rows.length > 0) {
        setDepartmentOptions(
          rows.map((d) => ({
            id: d.id,
            name: d.name,
          })),
        );
      }
    } catch {
      /* đơn vị optional */
    }
  };

  const loadProfile = async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const res = await getMyPersonalProfile();
      if (res.success && res.data) {
        formRef.current?.setFieldsValue(hoSoCaNhanVaoForm(res.data));
      } else {
        setNotFound(true);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        setNotFound(true);
      } else {
        message.error('Không thể tải hồ sơ cán bộ');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await formRef.current?.validateFields?.();
      if (!values) return;
      setSaving(true);
      const payload = formValuesToPersonalProfilePayload(values, { includeAdminFields: false });
      const result = await updateMyPersonalProfile(payload);
      if (result?.success && result.data) {
        message.success('Cập nhật hồ sơ thành công');
        formRef.current?.setFieldsValue(hoSoCaNhanVaoForm(result.data));
      }
    } catch (e: any) {
      if (e?.errorFields && Array.isArray(e.errorFields)) {
        const firstError = e.errorFields[0]?.errors?.[0];
        if (firstError) message.warning(firstError);
        formRef.current?.scrollToFirstError?.();
      } else {
        message.error(e?.response?.data?.message || e?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setSaving(false);
    }
  };

  const tenNguoiDung = initialState?.currentUser?.name ?? 'tôi';

  return (
    <PageContainer
      header={{
        title: 'Hồ sơ cán bộ của tôi',
        subTitle: `Cập nhật thông tin nhân sự — ${tenNguoiDung}`,
        breadcrumb: {
          items: [{ title: 'Trang chủ', href: '/home' }, { title: 'Hồ sơ cán bộ của tôi' }],
        },
      }}
    >
      <Spin spinning={loading}>
        {notFound ? (
          <Empty
            description="Chưa có hồ sơ cá nhân trên hệ thống. Vui lòng liên hệ quản trị (Phòng/Khoa) để được tạo hồ sơ trước khi tự cập nhật."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => history.push('/home')}>
              Về trang chủ
            </Button>
          </Empty>
        ) : (
          <>
            <PersonalProfileForm
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
          </>
        )}
      </Spin>
    </PageContainer>
  );
};

export default MyPersonalProfilePage;
