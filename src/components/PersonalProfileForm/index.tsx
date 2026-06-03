/**
 * Form hồ sơ cá nhân (dùng chung admin + cán bộ tự sửa).
 */
import React from 'react';
import {
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
  ProFormDatePicker,
} from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { Card, Col, Row } from 'antd';
import {
  GENDER_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  PERSONAL_PROFILE_STATUS_OPTIONS,
} from '@/services/api/personalProfiles';

export type PersonalProfileFormMode = 'admin-create' | 'admin-edit' | 'self';

export interface PersonalProfileFormProps {
  mode: PersonalProfileFormMode;
  formRef: React.MutableRefObject<ProFormInstance | undefined>;
  departmentOptions: { id: number; name: string }[];
  userOptions?: { id: number; label: string }[];
}

const PersonalProfileForm: React.FC<PersonalProfileFormProps> = ({
  mode,
  formRef,
  departmentOptions,
  userOptions = [],
}) => {
  const hienChonUser = mode === 'admin-create';
  const hienTrangThaiAdmin = mode === 'admin-create' || mode === 'admin-edit';

  return (
    <ProForm formRef={formRef} submitter={false} layout="vertical" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="1. Thông tin định danh" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              {hienChonUser && (
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
                        (option?.label?.toString() || '')
                          .toLowerCase()
                          .includes(input.toLowerCase()),
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
                <ProFormSelect
                  name="gender"
                  label="Giới tính"
                  placeholder="Chọn giới tính"
                  options={GENDER_OPTIONS}
                />
              </Col>
              <Col xs={24} md={12}>
                <ProFormDatePicker
                  name="dateOfBirth"
                  label="Ngày sinh"
                  placeholder="Chọn ngày"
                  fieldProps={{ format: 'DD/MM/YYYY' }}
                />
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
                      (option?.label?.toString() || '')
                        .toLowerCase()
                        .includes(input.toLowerCase()),
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
                <ProFormText
                  name="professionalQualification"
                  label="Chứng chỉ nghề nghiệp"
                  placeholder="Chứng chỉ"
                />
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
        {hienTrangThaiAdmin && (
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
        )}
      </Row>
    </ProForm>
  );
};

export default PersonalProfileForm;
