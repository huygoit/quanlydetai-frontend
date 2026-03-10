/**
 * Trang tạo/sửa hồ sơ cá nhân - Advanced Form với FooterToolbar
 */
import { PageContainer, FooterToolbar, ProForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormDatePicker } from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { Button, Card, Col, message, Row, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRef, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { history, useParams } from '@umijs/max';
import {
  getPersonalProfileById,
  createPersonalProfile,
  updatePersonalProfile,
  GENDER_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  PERSONAL_PROFILE_STATUS_OPTIONS,
  type PersonalProfileItem,
  type CreatePersonalProfilePayload,
} from '@/services/api/personalProfiles';
import { queryIAMUsers, getDepartmentOptions } from '@/services/api/iamUsers';

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
          }))
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
        formRef.current?.setFieldsValue({
          userId: data.userId,
          staffCode: data.staffCode,
          fullName: data.fullName,
          gender: data.gender,
          dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : undefined,
          placeOfBirth: data.placeOfBirth,
          phone: data.phone,
          personalEmail: data.personalEmail,
          workEmail: data.workEmail,
          address: data.address,
          departmentId: data.departmentId,
          positionTitle: data.positionTitle,
          employmentType: data.employmentType,
          academicDegree: data.academicDegree,
          academicTitle: data.academicTitle,
          specialization: data.specialization,
          professionalQualification: data.professionalQualification,
          identityNumber: data.identityNumber,
          identityIssueDate: data.identityIssueDate ? dayjs(data.identityIssueDate) : undefined,
          identityIssuePlace: data.identityIssuePlace,
          status: data.status,
          note: data.note,
        });
      }
    } catch (e) {
      message.error('Không thể tải hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await formRef.current?.validateFields?.();
      if (!values) return;

      const payload: Partial<CreatePersonalProfilePayload> = {
        staffCode: values.staffCode,
        fullName: values.fullName,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).format('YYYY-MM-DD') : undefined,
        placeOfBirth: values.placeOfBirth,
        phone: values.phone,
        personalEmail: values.personalEmail,
        workEmail: values.workEmail,
        address: values.address,
        departmentId: values.departmentId,
        positionTitle: values.positionTitle,
        employmentType: values.employmentType,
        academicDegree: values.academicDegree,
        academicTitle: values.academicTitle,
        specialization: values.specialization,
        professionalQualification: values.professionalQualification,
        identityNumber: values.identityNumber,
        identityIssueDate: values.identityIssueDate ? dayjs(values.identityIssueDate).format('YYYY-MM-DD') : undefined,
        identityIssuePlace: values.identityIssuePlace,
        status: values.status,
        note: values.note,
      };

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
        if (firstError) {
          message.warning(firstError);
        }
        formRef.current?.scrollToFirstError?.();
      } else {
        message.error(e?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    history.push('/admin/personal-profiles');
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
        <ProForm
          formRef={formRef}
          submitter={false}
          layout="vertical"
          style={{ width: '100%' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
          <Card title="1. Thông tin định danh" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              {!isEditing && (
                <Col xs={24} md={12}>
                  <ProFormSelect
                    name="userId"
                    label="Người dùng"
                    placeholder="Chọn tài khoản"
                    options={userOptions.map((u) => ({ value: u.id, label: u.label }))}
                    rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
                    showSearch
                    fieldProps={{
                      filterOption: (input, option) =>
                        (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase()),
                    }}
                  />
                </Col>
              )}
              <Col xs={24} md={12}>
                <ProFormText name="staffCode" label="Mã nhân viên" placeholder="Nhập mã NV" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText
                  name="fullName"
                  label="Họ và tên"
                  placeholder="Họ tên đầy đủ"
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                />
              </Col>
              <Col xs={24} md={12}>
                <ProFormSelect name="gender" label="Giới tính" placeholder="Chọn giới tính" options={GENDER_OPTIONS} />
              </Col>
              <Col xs={24} md={12}>
                <ProFormDatePicker name="dateOfBirth" label="Ngày sinh" placeholder="Chọn ngày" fieldProps={{ format: 'DD/MM/YYYY' }} />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="placeOfBirth" label="Nơi sinh" placeholder="Nhập nơi sinh" />
              </Col>
            </Row>
          </Card>
            </Col>
            <Col xs={24} lg={12}>
          <Card title="2. Thông tin liên hệ" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <ProFormText name="phone" label="Điện thoại" placeholder="Số điện thoại" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="personalEmail" label="Email cá nhân" placeholder="Email cá nhân" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="workEmail" label="Email công việc" placeholder="Email công việc" />
              </Col>
              <Col xs={24}>
                <ProFormText name="address" label="Địa chỉ" placeholder="Địa chỉ thường trú" />
              </Col>
            </Row>
          </Card>
            </Col>
            <Col xs={24} lg={12}>
          <Card title="3. Thông tin tổ chức" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <ProFormSelect
                  name="departmentId"
                  label="Đơn vị"
                  placeholder="Chọn đơn vị"
                  options={departmentOptions.map((d) => ({ value: d.id, label: d.name }))}
                  showSearch
                  fieldProps={{
                    filterOption: (input, option) =>
                      (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase()),
                  }}
                />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="positionTitle" label="Chức danh" placeholder="VD: Giảng viên, NCS" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormSelect
                  name="employmentType"
                  label="Loại hình công tác"
                  placeholder="Chọn loại hình"
                  options={EMPLOYMENT_TYPE_OPTIONS}
                />
              </Col>
            </Row>
          </Card>
            </Col>
            <Col xs={24} lg={12}>
          <Card title="4. Thông tin chuyên môn" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <ProFormText name="academicDegree" label="Học vị" placeholder="VD: ThS, TS" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="academicTitle" label="Học hàm" placeholder="VD: PGS, GS" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="specialization" label="Chuyên ngành" placeholder="Chuyên ngành" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="professionalQualification" label="Chứng chỉ nghề nghiệp" placeholder="Chứng chỉ" />
              </Col>
            </Row>
          </Card>
            </Col>
            <Col xs={24} lg={12}>
          <Card title="5. Giấy tờ cơ bản" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <ProFormText name="identityNumber" label="Số CMND/CCCD" placeholder="Số giấy tờ" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormDatePicker
                  name="identityIssueDate"
                  label="Ngày cấp"
                  placeholder="Chọn ngày"
                  fieldProps={{ format: 'DD/MM/YYYY' }}
                />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="identityIssuePlace" label="Nơi cấp" placeholder="Nơi cấp giấy tờ" />
              </Col>
            </Row>
          </Card>
            </Col>
            <Col xs={24} lg={12}>
          <Card title="6. Trạng thái" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <ProFormSelect
                  name="status"
                  label="Trạng thái"
                  placeholder="Chọn trạng thái"
                  options={PERSONAL_PROFILE_STATUS_OPTIONS}
                  rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
                />
              </Col>
              <Col xs={24}>
                <ProFormTextArea name="note" label="Ghi chú" placeholder="Ghi chú nội bộ" rows={3} />
              </Col>
            </Row>
          </Card>
            </Col>
          </Row>
        </ProForm>

        <FooterToolbar>
          <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
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
