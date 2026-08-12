/**
 * Form hồ sơ nhân sự — 2 multi-select chức vụ (lưu ID cách phẩy).
 */
import React, { useEffect, useState } from 'react';
import {
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
  ProFormDatePicker,
} from '@ant-design/pro-components';
import type { ProFormInstance } from '@ant-design/pro-components';
import { Card, Col, Row } from 'antd';
import { GENDER_OPTIONS } from '@/services/api/staffs';
import {
  getStaffPositionOptions,
  STAFF_POSITION_KIND_MAP,
  type StaffPositionOption,
} from '@/services/api/staffPositions';
import {
  catalogThanhSelectOptions,
  gopIdChucVuVaoOptions,
} from '@/utils/staffPositionIds';

export type StaffProfileFormMode = 'admin-create' | 'admin-edit' | 'self';

export interface StaffProfileFormProps {
  mode: StaffProfileFormMode;
  formRef: React.MutableRefObject<ProFormInstance | undefined>;
  departmentOptions: { id: number; name: string }[];
  userOptions?: { id: number; label: string }[];
}

const StaffProfileForm: React.FC<StaffProfileFormProps> = ({
  mode,
  formRef,
  departmentOptions,
  userOptions = [],
}) => {
  const hienChonUser = mode === 'admin-create' || mode === 'admin-edit';
  const khoaMaNv = mode === 'self';
  const hienGhiChuAdmin = mode === 'admin-create' || mode === 'admin-edit';

  const [optsPosition, setOptsPosition] = useState<StaffPositionOption[]>([]);
  const [optsParty, setOptsParty] = useState<StaffPositionOption[]>([]);

  useEffect(() => {
    Promise.all([
      getStaffPositionOptions({ kind: 'POSITION' }),
      getStaffPositionOptions({ kind: 'PARTY' }),
    ]).then(([pos, party]) => {
      setOptsPosition(pos.data || []);
      setOptsParty(party.data || []);
    });
  }, []);

  const selectMulti = {
    mode: 'multiple' as const,
    showSearch: true,
    allowClear: true,
    filterOption: (input: string, option?: { label?: React.ReactNode }) =>
      (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase()),
  };

  const positionIds: number[] = formRef.current?.getFieldValue?.('positionIds') || [];
  const partyPositionIds: number[] = formRef.current?.getFieldValue?.('partyPositionIds') || [];

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
                    label="Tài khoản liên kết"
                    placeholder="Chọn tài khoản (tuỳ chọn)"
                    options={userOptions.map((u) => ({ value: u.id, label: u.label }))}
                    showSearch
                    allowClear
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
                <ProFormText
                  name="staffCode"
                  label="Mã nhân viên"
                  placeholder="Nhập mã NV"
                  disabled={khoaMaNv}
                  rules={
                    mode === 'admin-create'
                      ? [{ required: true, message: 'Vui lòng nhập mã NV' }]
                      : undefined
                  }
                />
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
                <ProFormText name="email" label="Email" placeholder="Email công việc" />
              </Col>
              <Col xs={24}>
                <ProFormText
                  name="currentAddress"
                  label="Địa chỉ"
                  placeholder="Địa chỉ hiện tại"
                />
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
                <ProFormText name="staffType" label="Loại cán bộ" placeholder="VD: GV, NV…" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="currentJob" label="Công việc hiện tại" placeholder="Công việc" />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="4. Chức vụ" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              <Col xs={24}>
                <ProFormSelect
                  name="positionIds"
                  label={STAFF_POSITION_KIND_MAP.POSITION.text}
                  placeholder="Chọn một hoặc nhiều chức vụ"
                  options={gopIdChucVuVaoOptions(
                    catalogThanhSelectOptions(optsPosition),
                    positionIds,
                  )}
                  fieldProps={selectMulti}
                />
              </Col>
              <Col xs={24}>
                <ProFormSelect
                  name="partyPositionIds"
                  label={STAFF_POSITION_KIND_MAP.PARTY.text}
                  placeholder="Chọn một hoặc nhiều chức vụ Đảng"
                  options={gopIdChucVuVaoOptions(
                    catalogThanhSelectOptions(optsParty),
                    partyPositionIds,
                  )}
                  fieldProps={selectMulti}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="5. Thông tin chuyên môn" style={{ marginBottom: 0 }}>
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <ProFormText
                  name="professionalDegree"
                  label="Học vị"
                  placeholder="VD: ThS, TS"
                />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="academicTitle" label="Học hàm" placeholder="VD: PGS, GS" />
              </Col>
              <Col xs={24} md={12}>
                <ProFormText name="major" label="Chuyên ngành" placeholder="Chuyên ngành" />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="6. Giấy tờ cơ bản" style={{ marginBottom: 0 }}>
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
                <ProFormText name="identityIssuePlace" label="Nơi cấp" placeholder="Nơi cấp" />
              </Col>
            </Row>
          </Card>
        </Col>
        {hienGhiChuAdmin && (
          <Col xs={24} lg={12}>
            <Card title="7. Ghi chú" style={{ marginBottom: 0 }}>
              <ProFormTextArea name="note" label="Ghi chú nội bộ" placeholder="Ghi chú" rows={3} />
            </Card>
          </Col>
        )}
      </Row>
    </ProForm>
  );
};

export default StaffProfileForm;
