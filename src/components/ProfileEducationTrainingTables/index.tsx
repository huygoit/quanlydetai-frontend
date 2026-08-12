/**
 * Bảng quá trình đào tạo theo bậc + khóa tập huấn/bồi dưỡng (hồ sơ khoa học).
 */
import React, { useState } from 'react';
import { EditableProTable, type ProColumns } from '@ant-design/pro-components';
import { Typography, message } from 'antd';
import {
  updateMyProfile,
  EDUCATION_RECORD_LEVEL_OPTIONS,
  type EducationRecord,
  type TrainingCourse,
  type ScientificProfile,
} from '@/services/api/profile';
import { chuanHoaProfileTuApi } from '@/utils/profileCatalogOptions';

const { Title, Text } = Typography;

const NAM_TOI_THIEU = 1950;
const namToiDa = () => new Date().getFullYear() + 1;

type Props = {
  profile: ScientificProfile;
  onProfileChange: (p: ScientificProfile) => void;
};

const ProfileEducationTrainingTables: React.FC<Props> = ({ profile, onProfileChange }) => {
  const [eduKeys, setEduKeys] = useState<React.Key[]>([]);
  const [trnKeys, setTrnKeys] = useState<React.Key[]>([]);

  const luuEducation = async (rows: EducationRecord[]) => {
    try {
      const result = await updateMyProfile({ educationRecords: rows } as Partial<ScientificProfile>);
      if (result.success && result.data) {
        onProfileChange(chuanHoaProfileTuApi(result.data));
        message.success('Đã lưu quá trình đào tạo');
        return;
      }
      message.error('Lưu quá trình đào tạo thất bại');
    } catch (e: any) {
      message.error(e?.message || 'Lưu quá trình đào tạo thất bại');
    }
  };

  const luuTraining = async (rows: TrainingCourse[]) => {
    try {
      const result = await updateMyProfile({ trainingCourses: rows } as Partial<ScientificProfile>);
      if (result.success && result.data) {
        onProfileChange(chuanHoaProfileTuApi(result.data));
        message.success('Đã lưu khóa tập huấn / bồi dưỡng');
        return;
      }
      message.error('Lưu khóa bồi dưỡng thất bại');
    } catch (e: any) {
      message.error(e?.message || 'Lưu khóa bồi dưỡng thất bại');
    }
  };

  const educationColumns: ProColumns<EducationRecord>[] = [
    {
      title: 'Bậc đào tạo',
      dataIndex: 'level',
      valueType: 'select',
      width: 150,
      valueEnum: Object.fromEntries(
        EDUCATION_RECORD_LEVEL_OPTIONS.map((o) => [o.value, { text: o.label }]),
      ),
      formItemProps: { rules: [{ required: true, message: 'Chọn bậc' }] },
    },
    {
      title: 'Chuyên ngành',
      dataIndex: 'major',
      width: 160,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Cơ sở đào tạo',
      dataIndex: 'institution',
      width: 180,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Quốc gia',
      dataIndex: 'country',
      width: 120,
    },
    {
      title: 'Năm bắt đầu',
      dataIndex: 'startYear',
      valueType: 'digit',
      width: 110,
      fieldProps: { precision: 0, min: NAM_TOI_THIEU, max: namToiDa() },
    },
    {
      title: 'Năm tốt nghiệp',
      dataIndex: 'endYear',
      valueType: 'digit',
      width: 120,
      fieldProps: { precision: 0, min: NAM_TOI_THIEU, max: namToiDa() },
    },
    {
      title: 'Hình thức',
      dataIndex: 'trainingForm',
      width: 140,
      valueType: 'select',
      valueEnum: {
        'Chính quy': { text: 'Chính quy' },
        'Vừa học vừa làm': { text: 'Vừa học vừa làm' },
        'Từ xa': { text: 'Từ xa' },
        Khác: { text: 'Khác' },
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 140,
      render: (_, row, __, action) => {
        const id = row.id;
        const isEditing = eduKeys.includes(id);
        if (isEditing) {
          return [
            <a key="save" onClick={() => action?.save?.(id)}>
              Lưu
            </a>,
            <a key="cancel" onClick={() => action?.cancel?.(id)}>
              Hủy
            </a>,
          ];
        }
        return [
          <a key="edit" onClick={() => action?.startEditable?.(id)}>
            Sửa
          </a>,
          <a
            key="delete"
            onClick={async () => {
              const next = (profile.educationRecords || []).filter((r) => r.id !== id);
              await luuEducation(next);
            }}
          >
            Xóa
          </a>,
        ];
      },
    },
  ];

  const trainingColumns: ProColumns<TrainingCourse>[] = [
    {
      title: 'Tên khóa',
      dataIndex: 'name',
      width: 200,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Đơn vị tổ chức',
      dataIndex: 'organizer',
      width: 180,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Địa điểm',
      dataIndex: 'location',
      width: 140,
    },
    {
      title: 'Năm bắt đầu',
      dataIndex: 'startYear',
      valueType: 'digit',
      width: 110,
      fieldProps: { precision: 0, min: NAM_TOI_THIEU, max: namToiDa() },
    },
    {
      title: 'Năm kết thúc',
      dataIndex: 'endYear',
      valueType: 'digit',
      width: 110,
      fieldProps: { precision: 0, min: NAM_TOI_THIEU, max: namToiDa() },
    },
    {
      title: 'Chứng chỉ',
      dataIndex: 'certificate',
      width: 140,
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 140,
      render: (_, row, __, action) => {
        const id = row.id;
        const isEditing = trnKeys.includes(id);
        if (isEditing) {
          return [
            <a key="save" onClick={() => action?.save?.(id)}>
              Lưu
            </a>,
            <a key="cancel" onClick={() => action?.cancel?.(id)}>
              Hủy
            </a>,
          ];
        }
        return [
          <a key="edit" onClick={() => action?.startEditable?.(id)}>
            Sửa
          </a>,
          <a
            key="delete"
            onClick={async () => {
              const next = (profile.trainingCourses || []).filter((r) => r.id !== id);
              await luuTraining(next);
            }}
          >
            Xóa
          </a>,
        ];
      },
    },
  ];

  return (
    <>
      <div className="form-section" style={{ marginTop: 8 }}>
        <Title level={5}>Quá trình đào tạo theo bậc</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Bổ sung Đại học, Thạc sĩ, Nghiên cứu sinh, Tiến sĩ… (nhiều dòng).
        </Text>
        <EditableProTable<EducationRecord>
          rowKey="id"
          value={profile.educationRecords || []}
          onChange={async (value) => {
            await luuEducation(value as EducationRecord[]);
          }}
          columns={educationColumns}
          recordCreatorProps={{
            position: 'bottom',
            record: () => ({
              id: `edu-${Date.now()}`,
              level: 'MASTER',
              major: '',
              institution: '',
              country: 'Việt Nam',
            }),
            creatorButtonText: 'Thêm bậc đào tạo',
          }}
          editable={{
            type: 'multiple',
            editableKeys: eduKeys,
            onChange: setEduKeys,
            actionRender: (_row, _config, dom) => [dom.save, dom.cancel, dom.delete],
          }}
          scroll={{ x: 1200 }}
        />
      </div>

      <div className="form-section" style={{ marginTop: 24 }}>
        <Title level={5}>Khóa tập huấn, đào tạo, bồi dưỡng chuyên môn</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Các khóa ngắn hạn, tập huấn, bồi dưỡng ngoài chương trình bằng cấp chính thức.
        </Text>
        <EditableProTable<TrainingCourse>
          rowKey="id"
          value={profile.trainingCourses || []}
          onChange={async (value) => {
            await luuTraining(value as TrainingCourse[]);
          }}
          columns={trainingColumns}
          recordCreatorProps={{
            position: 'bottom',
            record: () => ({
              id: `trn-${Date.now()}`,
              name: '',
              organizer: '',
              location: '',
            }),
            creatorButtonText: 'Thêm khóa bồi dưỡng',
          }}
          editable={{
            type: 'multiple',
            editableKeys: trnKeys,
            onChange: setTrnKeys,
            actionRender: (_row, _config, dom) => [dom.save, dom.cancel, dom.delete],
          }}
          scroll={{ x: 1100 }}
        />
      </div>
    </>
  );
};

export default ProfileEducationTrainingTables;
