/**
 * Bảng quá trình giảng dạy/công tác + khóa tập huấn/bồi dưỡng trên hồ sơ.
 * Thời gian công tác: 1 ô DatePicker tháng/năm (Ant Design picker="month").
 * Quốc gia: Select từ danh mục hệ thống.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { EditableProTable, type ProColumns } from '@ant-design/pro-components';
import { DatePicker, Typography, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  updateMyProfile,
  type TrainingCourse,
  type TeachingWorkRecord,
  type ScientificProfile,
} from '@/services/api/profile';
import { getCountryOptions } from '@/services/api/countries';
import { chuanHoaProfileTuApi } from '@/utils/profileCatalogOptions';
import {
  NAM_NHAN_BANG_TOI_THIEU,
  layNamNhanBangToiDa,
  taoOptionsNam,
} from '@/constants/scientificProfileCatalog';

const { Title, Text } = Typography;

type Props = {
  profile: ScientificProfile;
  onProfileChange: (p: ScientificProfile) => void;
};

/** Hàng hiển thị bảng — thêm trường ảo tháng/năm gộp */
type TeachingWorkRow = TeachingWorkRecord & {
  fromPeriod?: Dayjs | null;
  toPeriod?: Dayjs | null;
};

/** Ghép tháng + năm → dayjs (ngày 1) */
function ghepThangNam(month?: number | null, year?: number | null): Dayjs | null {
  if (!year || !Number.isFinite(Number(year))) return null;
  const m = month && Number.isFinite(Number(month)) ? Number(month) : 1;
  return dayjs(`${year}-${String(m).padStart(2, '0')}-01`);
}

/** Hiển thị MM/YYYY */
function hienThiThangNam(month?: number | null, year?: number | null): string {
  if (!year) return '—';
  if (!month) return String(year);
  return `${String(month).padStart(2, '0')}/${year}`;
}

/** Tách dayjs → month/year; bỏ field ảo trước khi gọi API */
function chuanHoaHangCongTac(row: TeachingWorkRow): TeachingWorkRecord {
  const from = row.fromPeriod ? dayjs(row.fromPeriod) : ghepThangNam(row.fromMonth, row.fromYear);
  const to = row.isCurrent
    ? null
    : row.toPeriod
      ? dayjs(row.toPeriod)
      : ghepThangNam(row.toMonth, row.toYear);

  const { fromPeriod: _f, toPeriod: _t, ...rest } = row;
  return {
    ...rest,
    fromMonth: from?.isValid() ? from.month() + 1 : null,
    fromYear: from?.isValid() ? from.year() : null,
    toMonth: to?.isValid() ? to.month() + 1 : null,
    toYear: to?.isValid() ? to.year() : null,
  };
}

const ProfileEducationTrainingTables: React.FC<Props> = ({ profile, onProfileChange }) => {
  const [trnKeys, setTrnKeys] = useState<React.Key[]>([]);
  const [twKeys, setTwKeys] = useState<React.Key[]>([]);
  const [countryOptions, setCountryOptions] = useState<{ label: string; value: string }[]>([]);

  const yearOptions = useMemo(
    () => taoOptionsNam(NAM_NHAN_BANG_TOI_THIEU, layNamNhanBangToiDa()),
    [],
  );

  const teachingRows: TeachingWorkRow[] = useMemo(
    () =>
      (profile.teachingWorkRecords || []).map((r) => ({
        ...r,
        fromPeriod: ghepThangNam(r.fromMonth, r.fromYear),
        toPeriod: r.isCurrent ? null : ghepThangNam(r.toMonth, r.toYear),
      })),
    [profile.teachingWorkRecords],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCountryOptions();
        if (cancelled) return;
        setCountryOptions(
          (res.data ?? []).map((c) => ({
            label: c.label || c.name,
            value: c.value || c.name,
          })),
        );
      } catch {
        /* thiếu danh mục — vẫn nhập được nếu cần */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const luuTeachingWork = async (rows: TeachingWorkRow[]) => {
    try {
      const payload = rows.map(chuanHoaHangCongTac);
      const result = await updateMyProfile({
        teachingWorkRecords: payload,
      } as Partial<ScientificProfile>);
      if (result.success && result.data) {
        onProfileChange(chuanHoaProfileTuApi(result.data));
        message.success('Đã lưu quá trình giảng dạy / công tác');
        return;
      }
      message.error('Lưu quá trình công tác thất bại');
    } catch (e: any) {
      message.error(e?.message || 'Lưu quá trình công tác thất bại');
    }
  };

  const teachingColumns: ProColumns<TeachingWorkRow>[] = [
    {
      title: 'Từ tháng/năm',
      dataIndex: 'fromPeriod',
      width: 150,
      render: (_, row) => hienThiThangNam(row.fromMonth, row.fromYear),
      renderFormItem: () => (
        <DatePicker
          picker="month"
          format="MM/YYYY"
          style={{ width: '100%' }}
          placeholder="Chọn tháng/năm"
          allowClear
        />
      ),
    },
    {
      title: 'Đến tháng/năm',
      dataIndex: 'toPeriod',
      width: 150,
      render: (_, row) => (row.isCurrent ? 'đến nay' : hienThiThangNam(row.toMonth, row.toYear)),
      formItemProps: (_form, { entity }) => ({
        hidden: Boolean(entity?.isCurrent),
      }),
      renderFormItem: () => (
        <DatePicker
          picker="month"
          format="MM/YYYY"
          style={{ width: '100%' }}
          placeholder="Chọn tháng/năm"
          allowClear
        />
      ),
    },
    {
      title: 'Đến nay',
      dataIndex: 'isCurrent',
      valueType: 'switch',
      width: 80,
    },
    {
      title: 'Chức vụ / vai trò',
      dataIndex: 'role',
      width: 160,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Cơ quan / đơn vị',
      dataIndex: 'organization',
      width: 180,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Quốc gia',
      dataIndex: 'country',
      valueType: 'select',
      width: 140,
      fieldProps: {
        options: countryOptions,
        showSearch: true,
        optionFilterProp: 'label',
        allowClear: true,
        placeholder: 'Chọn quốc gia',
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      ellipsis: true,
      width: 140,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 140,
      render: (_, row, __, action) => {
        const id = row.id;
        const isEditing = twKeys.includes(id);
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
              const next = teachingRows.filter((r) => r.id !== id);
              await luuTeachingWork(next);
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
      valueType: 'select',
      width: 110,
      fieldProps: {
        options: yearOptions,
        showSearch: true,
        allowClear: true,
        placeholder: 'Chọn năm',
      },
    },
    {
      title: 'Năm kết thúc',
      dataIndex: 'endYear',
      valueType: 'select',
      width: 110,
      fieldProps: {
        options: yearOptions,
        showSearch: true,
        allowClear: true,
        placeholder: 'Chọn năm',
      },
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
        <Title level={5}>Quá trình giảng dạy và công tác</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Chọn tháng/năm trên một ô; bật «Đến nay» nếu đang làm việc tại đơn vị đó.
        </Text>
        <EditableProTable<TeachingWorkRow>
          rowKey="id"
          value={teachingRows}
          onChange={async (value) => {
            await luuTeachingWork(value as TeachingWorkRow[]);
          }}
          columns={teachingColumns}
          recordCreatorProps={{
            position: 'bottom',
            record: () => ({
              id: `tw-${Date.now()}`,
              role: '',
              organization: '',
              country: 'Việt Nam',
              isCurrent: false,
              fromPeriod: null,
              toPeriod: null,
            }),
            creatorButtonText: 'Thêm quá trình công tác',
          }}
          editable={{
            type: 'multiple',
            editableKeys: twKeys,
            onChange: setTwKeys,
            saveText: 'Lưu',
            cancelText: 'Hủy',
            deleteText: 'Xóa',
            actionRender: (_row, _config, dom) => [dom.save, dom.cancel],
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
            saveText: 'Lưu',
            cancelText: 'Hủy',
            deleteText: 'Xóa',
            actionRender: (_row, _config, dom) => [dom.save, dom.cancel],
          }}
          scroll={{ x: 1100 }}
        />
      </div>
    </>
  );
};

export default ProfileEducationTrainingTables;
