/**
 * Danh sách hồ sơ khoa học - PHONG_KH, ADMIN
 * Theo specs/scientific-profile.md.md Section 5.3
 */
import React, { useEffect, useRef, useState } from 'react';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { history, useModel, useAccess } from '@umijs/max';
import {
  Avatar,
  Tag,
  Space,
  Button,
  Progress,
  message,
  Drawer,
  Form,
  Input,
} from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  PageContainer,
  ProTable,
} from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  queryProfiles,
  verifyProfile,
  requestMoreInfo,
  PROFILE_STATUS_MAP,
  RESEARCH_AREAS,
  type ScientificProfile,
  type ProfileStatus,
  type Degree,
  type AcademicTitle,
} from '@/services/api/profile';
import {
  coHienThiHocHam,
  loadScientificProfileCatalogOptions,
  nhanNhanHocHam,
  nhanNhanHocVi,
  type HocViHocHamSelectOption,
} from '@/utils/profileCatalogOptions';
import {
  FALLBACK_ACADEMIC_TITLE_CATALOG,
  FALLBACK_DEGREE_CATALOG,
} from '@/constants/scientificProfileCatalog';
import {
  getStaffPositionOptions,
  STAFF_POSITION_KIND_MAP,
  type StaffPositionOption,
} from '@/services/api/staffPositions';
import {
  loadProfileKhoaPhongBanOptions,
  type DonViSelectOption,
} from '@/utils/profileDepartmentOptions';
import { nhanChucVuTuIds } from '@/utils/staffPositionIds';
import './index.less';

type ChucVuFilterOpt = { value: number; label: string };

const chuoiIdLocChucVu = (v: unknown): string | undefined => {
  if (v === undefined || v === null || v === '') return undefined;
  const s = String(v).trim();
  return s || undefined;
};

const ProfileListPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const access = useAccess();
  const currentUser = initialState?.currentUser;
  const actionRef = useRef<ActionType>();

  const [verifyDrawerVisible, setVerifyDrawerVisible] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ScientificProfile | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyForm] = Form.useForm();

  const [degreeFilterOptions, setDegreeFilterOptions] = useState<HocViHocHamSelectOption[]>(() =>
    FALLBACK_DEGREE_CATALOG.map((d) => ({
      value: d.value,
      label: d.label,
      title: d.description,
    })),
  );

  // Tùy chọn lọc học hàm — fallback trước, rồi thay bằng catalog API
  const [academicTitleFilterOptions, setAcademicTitleFilterOptions] = useState<
    HocViHocHamSelectOption[]
  >(() => FALLBACK_ACADEMIC_TITLE_CATALOG.map((d) => ({ value: d.value, label: d.label })));

  // Tùy chọn lọc 2 loại chức vụ (value = ID danh mục)
  const [optsPosition, setOptsPosition] = useState<ChucVuFilterOpt[]>([]);
  const [optsParty, setOptsParty] = useState<ChucVuFilterOpt[]>([]);
  const [catalogPosition, setCatalogPosition] = useState<StaffPositionOption[]>([]);
  // Đơn vị công tác — từ danh mục departments (không hardcode)
  const [optsDonVi, setOptsDonVi] = useState<DonViSelectOption[]>([]);

  useEffect(() => {
    loadScientificProfileCatalogOptions().then(({ degreeOptions, academicTitleOptions }) => {
      setDegreeFilterOptions(degreeOptions);
      setAcademicTitleFilterOptions(academicTitleOptions);
    });
    loadProfileKhoaPhongBanOptions().then(({ khoaPhongOptions }) => {
      setOptsDonVi(khoaPhongOptions);
    });
    const loadPos = async () => {
      const [pos, party] = await Promise.all([
        getStaffPositionOptions({ kind: 'POSITION' }),
        getStaffPositionOptions({ kind: 'PARTY' }),
      ]);
      const posList = pos.data || [];
      setCatalogPosition(posList);
      setOptsPosition(posList.map((r) => ({ value: r.id, label: r.name })));
      setOptsParty((party.data || []).map((r) => ({ value: r.id, label: r.name })));
    };
    void loadPos();
  }, []);

  const canVerify = access.canVerifyProfile;

  // Handle verify
  const handleOpenVerify = (profile: ScientificProfile, action: 'verify' | 'request') => {
    setSelectedProfile(profile);
    verifyForm.setFieldsValue({
      action,
      note: '',
    });
    setVerifyDrawerVisible(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedProfile || !currentUser) return;

    const values = await verifyForm.validateFields();
    setVerifyLoading(true);

    try {
      if (values.action === 'verify') {
        const result = await verifyProfile(selectedProfile.id, values.note || '');

        if (result.success) {
          message.success('Đã xác thực hồ sơ');
          setVerifyDrawerVisible(false);
          actionRef.current?.reload();
        }
      } else {
        const result = await requestMoreInfo(selectedProfile.id, values.note || '');

        if (result.success) {
          message.success('Đã gửi yêu cầu bổ sung');
          setVerifyDrawerVisible(false);
          actionRef.current?.reload();
        }
      }
    } catch (error) {
      message.error('Có lỗi xảy ra');
    } finally {
      setVerifyLoading(false);
    }
  };

  const columns: ProColumns<ScientificProfile>[] = [
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      width: 240,
      render: (_, record) => (
        <div className="profile-cell">
          <Avatar
            size={40}
            src={resolvePublicAssetUrl(record.avatarUrl)}
            icon={<UserOutlined />}
            className="profile-avatar"
          />
          <div className="profile-info">
            <div className="profile-name">
              {record.fullName}
              {record.status === 'VERIFIED' && (
                <SafetyCertificateOutlined className="verified-icon" />
              )}
            </div>
            <div className="profile-email">{record.workEmail}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Học vị',
      dataIndex: 'degree',
      width: 100,
      valueType: 'select',
      sorter: true,
      fieldProps: {
        options: degreeFilterOptions,
        allowClear: true,
        placeholder: 'Chọn học vị',
      },
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          {coHienThiHocHam(record.academicTitle) && (
            <Tag color="gold" style={{ marginBottom: 4 }}>
              {nhanNhanHocHam(academicTitleFilterOptions, record.academicTitle) ||
                record.academicTitle}
            </Tag>
          )}
          <span>{nhanNhanHocVi(degreeFilterOptions, record.degree) || record.degree || '-'}</span>
        </Space>
      ),
    },
    {
      title: 'Đơn vị công tác',
      dataIndex: 'faculty',
      width: 200,
      valueType: 'select',
      sorter: true,
      defaultSortOrder: 'ascend',
      fieldProps: {
        options: optsDonVi,
        allowClear: true,
        showSearch: true,
        placeholder: 'Chọn đơn vị',
        filterOption: (input: string, option?: { label?: React.ReactNode }) =>
          (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase()),
      },
      render: (_, record) => (
        <div>
          <div>{record.faculty || '-'}</div>
          {record.department && (
            <div className="text-secondary">{record.department}</div>
          )}
        </div>
      ),
    },
    {
      // Cột chỉ dùng cho form tìm kiếm — học hàm đã hiện tag dưới cột Học vị
      title: 'Học hàm',
      dataIndex: 'academicTitle',
      valueType: 'select',
      hideInTable: true,
      fieldProps: {
        options: academicTitleFilterOptions,
        allowClear: true,
        placeholder: 'Chọn học hàm',
        showSearch: true,
      },
    },
    {
      title: STAFF_POSITION_KIND_MAP.POSITION.text,
      dataIndex: 'positionTitle',
      width: 180,
      ellipsis: true,
      valueType: 'select',
      sorter: true,
      fieldProps: {
        options: optsPosition,
        allowClear: true,
        showSearch: true,
        placeholder: 'Chọn chức vụ',
      },
      render: (_, record) =>
        record.positionTitleLabel ||
        nhanChucVuTuIds(record.positionTitle, catalogPosition) ||
        '—',
    },
    {
      title: STAFF_POSITION_KIND_MAP.PARTY.text,
      dataIndex: 'partyPosition',
      valueType: 'select',
      hideInTable: true,
      fieldProps: {
        options: optsParty,
        allowClear: true,
        showSearch: true,
        placeholder: 'Chọn chức vụ Đảng',
      },
    },
    {
      title: 'Hướng NC chính',
      dataIndex: 'mainResearchArea',
      width: 180,
      valueType: 'select',
      fieldProps: {
        options: RESEARCH_AREAS.map(r => ({ label: r, value: r })),
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
      fieldProps: {
        options: Object.entries(PROFILE_STATUS_MAP).map(([value, { text }]) => ({
          label: text,
          value,
        })),
      },
      render: (_, record) => {
        const config = PROFILE_STATUS_MAP[record.status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Hoàn thiện',
      dataIndex: 'completeness',
      width: 100,
      search: false,
      sorter: true,
      render: (_, record) => (
        <Progress
          percent={record.completeness}
          size="small"
          status={record.completeness >= 80 ? 'success' : record.completeness >= 50 ? 'normal' : 'exception'}
          strokeWidth={6}
        />
      ),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      width: 110,
      valueType: 'date',
      search: false,
      sorter: true,
      render: (_, record) => (
        <span className="text-secondary">
          {new Date(record.updatedAt).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      width: 180,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => history.push(`/profile/${record.id}`)}
          >
            Xem
          </Button>
          {canVerify && record.status !== 'VERIFIED' && (
            <>
              <Button
                type="link"
                icon={<CheckCircleOutlined />}
                onClick={() => handleOpenVerify(record, 'verify')}
              >
                Xác thực
              </Button>
            </>
          )}
          {canVerify && record.status !== 'NEED_MORE_INFO' && (
            <Button
              type="link"
              danger
              icon={<ExclamationCircleOutlined />}
              onClick={() => handleOpenVerify(record, 'request')}
            >
              Bổ sung
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Danh sách hồ sơ khoa học"
      subTitle="Tra cứu và quản lý hồ sơ khoa học toàn trường"
      className="profile-list-page"
    >
      <ProTable<ScientificProfile>
        actionRef={actionRef}
        columns={columns}
        request={async (params, sort) => {
          let sortBy = 'faculty';
          let order: 'asc' | 'desc' = 'asc';
          const sortEntries = Object.entries(sort || {}).filter(([, v]) => v);
          if (sortEntries.length > 0) {
            const [key, ord] = sortEntries[0];
            if (
              key === 'positionTitle' ||
              key === 'fullName' ||
              key === 'updatedAt' ||
              key === 'faculty' ||
              key === 'degree'
            ) {
              sortBy = key;
              order = ord === 'ascend' ? 'asc' : 'desc';
            }
          }

          const result = await queryProfiles({
            keyword: params.fullName,
            faculty: params.faculty,
            degree: params.degree as Degree,
            academicTitle: params.academicTitle as AcademicTitle | undefined,
            positionTitle: chuoiIdLocChucVu(params.positionTitle),
            partyPosition: chuoiIdLocChucVu(params.partyPosition),
            mainResearchArea: params.mainResearchArea,
            status: params.status as ProfileStatus,
            page: params.current,
            perPage: params.pageSize,
            sortBy,
            order,
          });

          return {
            data: result.data,
            total: result.meta?.total || 0,
            success: result.success,
          };
        }}
        rowKey="id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} hồ sơ`,
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        dateFormatter="string"
        toolBarRender={() => []}
        scroll={{ x: 1400 }}
      />

      {/* Verify Drawer */}
      <Drawer
        title={
          verifyForm.getFieldValue('action') === 'verify'
            ? 'Xác thực hồ sơ'
            : 'Yêu cầu bổ sung'
        }
        open={verifyDrawerVisible}
        onClose={() => setVerifyDrawerVisible(false)}
        width={480}
        footer={
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setVerifyDrawerVisible(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleVerifySubmit}
              loading={verifyLoading}
              danger={verifyForm.getFieldValue('action') !== 'verify'}
            >
              {verifyForm.getFieldValue('action') === 'verify' ? 'Xác thực' : 'Gửi yêu cầu'}
            </Button>
          </Space>
        }
      >
        {selectedProfile && (
          <div className="verify-drawer-content">
            <div className="profile-summary">
              <Avatar
                size={48}
                src={resolvePublicAssetUrl(selectedProfile.avatarUrl)}
                icon={<UserOutlined />}
              />
              <div>
                <div className="name">{selectedProfile.fullName}</div>
                <div className="info">{selectedProfile.faculty}</div>
                <Tag color={PROFILE_STATUS_MAP[selectedProfile.status].color}>
                  {PROFILE_STATUS_MAP[selectedProfile.status].text}
                </Tag>
              </div>
            </div>

            <Form form={verifyForm} layout="vertical">
              <Form.Item name="action" hidden>
                <Input />
              </Form.Item>
              <Form.Item
                name="note"
                label={
                  verifyForm.getFieldValue('action') === 'verify'
                    ? 'Ghi chú xác thực'
                    : 'Lý do yêu cầu bổ sung'
                }
                rules={[
                  {
                    required: verifyForm.getFieldValue('action') !== 'verify',
                    message: 'Vui lòng nhập lý do',
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder={
                    verifyForm.getFieldValue('action') === 'verify'
                      ? 'Nhập ghi chú xác thực (không bắt buộc)...'
                      : 'Nhập lý do yêu cầu bổ sung...'
                  }
                />
              </Form.Item>
            </Form>

            {verifyForm.getFieldValue('action') === 'verify' && (
              <div className="verify-checklist">
                <div className="checklist-title">Checklist xác thực:</div>
                <ul>
                  <li>Kiểm tra thông tin cá nhân</li>
                  <li>Xác minh học vị / học hàm</li>
                  <li>Kiểm tra bằng cấp đính kèm</li>
                  <li>Xác minh các kết quả NCKH</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ProfileListPage;

