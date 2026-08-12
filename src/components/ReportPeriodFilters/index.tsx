/**
 * Bộ lọc thời gian báo cáo NCKH — cùng logic /research-outputs/all
 * (Lọc theo + khoảng ngày + Năm khi cần).
 */
import { DatePicker, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo } from 'react';
import {
  khoangMacDinhChiSoNckh,
  khoangNgayTheoPreset,
  namThamChieuBoLoc,
  namThamChieuNamTaiChinh,
  presetCanChonNam,
  PRESET_LOC_KQNC,
  type PublicationFilterPreset,
} from '@/utils/publicationDateFilter';
import type { NckhReportPeriodParams } from '@/services/api/kpiReports';

export type ReportPeriodFilterState = {
  filterPreset: PublicationFilterPreset;
  filterRefYear: number;
  publishedAtRange: [Dayjs, Dayjs] | null;
};

export function trangThaiLocKyMacDinh(): ReportPeriodFilterState {
  return {
    filterPreset: 'fiscal_year',
    filterRefYear: namThamChieuNamTaiChinh(),
    publishedAtRange: khoangMacDinhChiSoNckh(),
  };
}

/** State bộ lọc → query API báo cáo */
export function stateThanhQueryBaoCao(
  state: ReportPeriodFilterState,
  faculty?: string,
): NckhReportPeriodParams {
  const preset = state.filterPreset;
  if (preset === 'all') {
    return { all: true, faculty: faculty || '' };
  }
  let range = state.publishedAtRange;
  if (!range?.[0] || !range?.[1]) {
    range = khoangNgayTheoPreset(preset, namThamChieuBoLoc(preset, state.filterRefYear));
  }
  if (!range?.[0] || !range?.[1]) {
    return { all: true, faculty: faculty || '' };
  }
  return {
    publishedFrom: range[0].format('YYYY-MM-DD'),
    publishedTo: range[1].format('YYYY-MM-DD'),
    faculty: faculty || '',
  };
}

export function nhanKhoangKyTuState(state: ReportPeriodFilterState): string {
  if (state.filterPreset === 'all') return 'Tất cả';
  const range = state.publishedAtRange;
  if (range?.[0] && range?.[1]) {
    return `${range[0].format('DD/MM/YYYY')} – ${range[1].format('DD/MM/YYYY')}`;
  }
  return '';
}

type Props = {
  value: ReportPeriodFilterState;
  onChange: (next: ReportPeriodFilterState) => void;
  /** Đổi bộ lọc xong thì gọi (ví dụ tải lại báo cáo) */
  onApply?: (next: ReportPeriodFilterState) => void;
  /** Giữ các ô lọc trên một hàng (không wrap) */
  singleRow?: boolean;
  size?: 'small' | 'middle' | 'large';
};

const ReportPeriodFilters: React.FC<Props> = ({
  value,
  onChange,
  onApply,
  singleRow = false,
  size = 'middle',
}) => {
  const presetOptions = useMemo(
    () =>
      PRESET_LOC_KQNC.filter((o) => o.value !== 'custom').map((o) => ({
        label: o.label,
        value: o.value,
      })),
    [],
  );

  const yearOptions = useMemo(() => {
    const y = dayjs().year();
    return Array.from({ length: 8 }, (_, i) => {
      const year = y - i;
      return { label: String(year), value: year };
    });
  }, []);

  const hienNam = presetCanChonNam(value.filterPreset);

  const apDung = (next: ReportPeriodFilterState) => {
    onChange(next);
    onApply?.(next);
  };

  return (
    <Space
      size="small"
      wrap={!singleRow}
      className={singleRow ? 'report-period-filters--single-row' : undefined}
      style={
        singleRow
          ? { flexWrap: 'nowrap', whiteSpace: 'nowrap', display: 'inline-flex' }
          : undefined
      }
    >
      <Select
        size={size}
        value={value.filterPreset}
        options={presetOptions}
        style={{ width: singleRow ? 200 : 188 }}
        popupMatchSelectWidth={false}
        onChange={(preset: PublicationFilterPreset) => {
          if (preset === 'all') {
            apDung({ ...value, filterPreset: preset, publishedAtRange: null });
            return;
          }
          const refYear = namThamChieuBoLoc(preset, value.filterRefYear);
          const range = khoangNgayTheoPreset(preset, refYear);
          apDung({
            ...value,
            filterPreset: preset,
            publishedAtRange: range,
          });
        }}
      />
      <DatePicker.RangePicker
        size={size}
        value={value.publishedAtRange}
        format="DD/MM/YYYY"
        placeholder={['Từ ngày', 'Đến ngày']}
        style={{ width: 260 }}
        allowClear={value.filterPreset === 'all'}
        onChange={(dates) => {
          const range =
            dates?.[0] && dates?.[1]
              ? ([dates[0], dates[1]] as [Dayjs, Dayjs])
              : null;
          apDung({
            ...value,
            filterPreset: range ? value.filterPreset : 'all',
            publishedAtRange: range,
          });
        }}
      />
      {hienNam && (
        <Select
          size={size}
          value={value.filterRefYear}
          options={yearOptions}
          style={{ width: 88 }}
          onChange={(year: number) => {
            const preset = value.filterPreset;
            const range = khoangNgayTheoPreset(preset, year);
            apDung({
              ...value,
              filterRefYear: year,
              publishedAtRange: range,
            });
          }}
        />
      )}
    </Space>
  );
};

export default ReportPeriodFilters;
