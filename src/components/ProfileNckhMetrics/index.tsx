import React from 'react';
import { Spin, Tooltip, theme } from 'antd';
import { FieldTimeOutlined, TrophyOutlined } from '@ant-design/icons';
import ReportPeriodFilters, {
  nhanKhoangKyTuState,
  trangThaiLocKyMacDinh,
  type ReportPeriodFilterState,
} from '@/components/ReportPeriodFilters';
import { moTaKhoangLoc } from '@/utils/publicationDateFilter';
import './index.less';

export type KpiPeriodState = ReportPeriodFilterState;

export function taoKpiPeriodMacDinh(): KpiPeriodState {
  return trangThaiLocKyMacDinh();
}

export interface ProfileNckhMetricsProps {
  researchHours: number | null;
  convertedPoint: number | null;
  loading?: boolean;
  period: KpiPeriodState;
  onPeriodChange: (next: KpiPeriodState) => void;
}

const ProfileNckhMetrics: React.FC<ProfileNckhMetricsProps> = ({
  researchHours,
  convertedPoint,
  loading = false,
  period,
  onPeriodChange,
}) => {
  const { token } = theme.useToken();

  const dinhDangSo = (value: number | null) => {
    if (loading) return <Spin size="small" />;
    if (value == null) return '—';
    return Math.round(value * 100) / 100;
  };

  const moTaKy =
    period.filterPreset === 'all'
      ? 'Tất cả'
      : moTaKhoangLoc(period.publishedAtRange?.[0], period.publishedAtRange?.[1]) ||
        nhanKhoangKyTuState(period);

  const goiYTheoKy = (loai: 'gio' | 'diem') =>
    moTaKy
      ? loai === 'gio'
        ? `Tổng giờ NCKH quy đổi (${moTaKy}). Chỉ tính KQNC có ngày xuất bản trong kỳ.`
        : `Tổng điểm quy đổi (${moTaKy}). Chỉ tính KQNC có ngày xuất bản trong kỳ.`
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
        {/* Cùng bộ lọc kỳ với Báo cáo và thống kê */}
        <ReportPeriodFilters value={period} onChange={onPeriodChange} singleRow size="small" />
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
