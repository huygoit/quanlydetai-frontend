import React, { useMemo } from 'react';
import { DatePicker, Select, Spin, Tooltip, theme } from 'antd';
import { CalendarOutlined, FieldTimeOutlined, TrophyOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  PRESET_LOC_CHI_SO_NCKH,
  type PublicationFilterPreset,
  khoangNgayTheoPreset,
  moTaKhoangLoc,
  namThamChieuBoLoc,
  namThamChieuNamTaiChinh,
  presetCanChonNam,
} from '@/utils/publicationDateFilter';
import './index.less';

const { RangePicker } = DatePicker;

export interface KpiPeriodState {
  preset: PublicationFilterPreset;
  refYear: number;
  dateRange: [Dayjs, Dayjs] | null;
}

export function taoKpiPeriodMacDinh(): KpiPeriodState {
  const refYear = namThamChieuNamTaiChinh();
  return {
    preset: 'fiscal_year',
    refYear,
    dateRange: khoangNgayTheoPreset('fiscal_year', refYear),
  };
}

export interface ProfileNckhMetricsProps {
  researchHours: number | null;
  convertedPoint: number | null;
  loading?: boolean;
  period: KpiPeriodState;
  onPeriodChange: (next: KpiPeriodState) => void;
  yearOptions?: number[];
}

const ProfileNckhMetrics: React.FC<ProfileNckhMetricsProps> = ({
  researchHours,
  convertedPoint,
  loading = false,
  period,
  onPeriodChange,
  yearOptions,
}) => {
  const { token } = theme.useToken();

  const years = useMemo(() => {
    if (yearOptions?.length) return yearOptions;
    const y = dayjs().year();
    return Array.from({ length: 10 }, (_, i) => y - i);
  }, [yearOptions]);

  const doiPreset = (preset: PublicationFilterPreset) => {
    if (preset === 'custom') {
      onPeriodChange({ ...period, preset });
      return;
    }
    const refYear = namThamChieuBoLoc(preset, period.refYear);
    const range = khoangNgayTheoPreset(preset, refYear);
    onPeriodChange({ preset, refYear, dateRange: range });
  };

  const doiNam = (year: number) => {
    const range = presetCanChonNam(period.preset)
      ? khoangNgayTheoPreset(period.preset, year)
      : period.dateRange;
    onPeriodChange({ ...period, refYear: year, dateRange: range });
  };

  const dinhDangSo = (value: number | null) => {
    if (loading) return <Spin size="small" />;
    if (value == null) return '—';
    return Math.round(value * 100) / 100;
  };

  const moTaKy = moTaKhoangLoc(period.dateRange?.[0], period.dateRange?.[1]);
  const nhanKy =
    PRESET_LOC_CHI_SO_NCKH.find((o) => o.value === period.preset)?.label ?? 'Kỳ đã chọn';

  const goiYTheoKy = (loai: 'gio' | 'diem') =>
    moTaKy
      ? loai === 'gio'
        ? `Tổng giờ NCKH quy đổi (${nhanKy}: ${moTaKy}). Chỉ tính KQNC có ngày xuất bản trong kỳ.`
        : `Tổng điểm quy đổi (${nhanKy}: ${moTaKy}). Chỉ tính KQNC có ngày xuất bản trong kỳ.`
      : loai === 'gio'
        ? 'Tổng giờ NCKH quy đổi theo kỳ đang chọn.'
        : 'Tổng điểm quy đổi theo kỳ đang chọn.';

  return (
    <div
      className="profile-nckh-metrics"
      style={
        {
          '--nckh-primary': token.colorPrimary,
          '--nckh-border': token.colorBorderSecondary,
          '--nckh-fill': token.colorFillAlter,
        } as React.CSSProperties
      }
    >
      <div className="profile-nckh-metrics__filter">
        <div className="profile-nckh-metrics__filterRow">
          <CalendarOutlined className="profile-nckh-metrics__filterIcon" aria-hidden />
          <Select
            size="small"
            className="profile-nckh-metrics__preset"
            value={period.preset}
            onChange={(v) => doiPreset(v as PublicationFilterPreset)}
            options={PRESET_LOC_CHI_SO_NCKH.map((o) => ({ label: o.label, value: o.value }))}
            popupMatchSelectWidth={240}
          />
          {presetCanChonNam(period.preset) && (
            <Select
              size="small"
              className="profile-nckh-metrics__year"
              value={period.refYear}
              onChange={doiNam}
              options={years.map((y) => ({ label: String(y), value: y }))}
            />
          )}
          {period.preset === 'custom' && (
            <RangePicker
              size="small"
              format="DD/MM/YYYY"
              value={period.dateRange}
              onChange={(vals) => {
                if (!vals?.[0] || !vals?.[1]) {
                  onPeriodChange({ ...period, dateRange: null });
                  return;
                }
                onPeriodChange({
                  preset: 'custom',
                  refYear: period.refYear,
                  dateRange: [vals[0], vals[1]],
                });
              }}
              allowClear
            />
          )}
        </div>
      </div>

      <div className="profile-nckh-metrics__stats" aria-label="Thống kê giờ NCKH và điểm quy đổi">
        <Tooltip
          title={goiYTheoKy('gio')}
          placement="top"
          mouseEnterDelay={0.4}
          mouseLeaveDelay={0.05}
        >
          <div className="profile-nckh-metrics__statCardWrap">
          <div className="profile-nckh-metrics__statCard profile-nckh-metrics__statCard--hours">
            <div className="profile-nckh-metrics__statIconWrap" aria-hidden>
              <FieldTimeOutlined className="profile-nckh-metrics__statIcon" />
            </div>
            <div className="profile-nckh-metrics__statContent">
              <div className="profile-nckh-metrics__statValue">
                {dinhDangSo(researchHours)}
                {!loading && researchHours != null && (
                  <span className="profile-nckh-metrics__statUnit">giờ</span>
                )}
              </div>
            </div>
          </div>
          </div>
        </Tooltip>
        <Tooltip
          title={goiYTheoKy('diem')}
          placement="top"
          mouseEnterDelay={0.4}
          mouseLeaveDelay={0.05}
        >
          <div className="profile-nckh-metrics__statCardWrap">
          <div className="profile-nckh-metrics__statCard profile-nckh-metrics__statCard--points">
            <div className="profile-nckh-metrics__statIconWrap" aria-hidden>
              <TrophyOutlined className="profile-nckh-metrics__statIcon" />
            </div>
            <div className="profile-nckh-metrics__statContent">
              <div className="profile-nckh-metrics__statValue">
                {dinhDangSo(convertedPoint)}
                {!loading && convertedPoint != null && (
                  <span className="profile-nckh-metrics__statUnit">điểm</span>
                )}
              </div>
            </div>
          </div>
          </div>
        </Tooltip>
      </div>
    </div>
  );
};

export default ProfileNckhMetrics;
