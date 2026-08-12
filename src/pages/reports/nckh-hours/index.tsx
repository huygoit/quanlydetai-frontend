/**
 * Thống kê giờ NCKH (biểu mẫu in/PDF - Cách B: HTML + print)
 * Lọc theo khoảng ngày xuất bản (cùng bộ lọc /research-outputs/all) + đơn vị.
 */
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Empty, Select, Space, Spin, message } from 'antd';
import { PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { getNckhHoursReport, NckhHoursReport } from '@/services/api/kpiReports';
import ReportPeriodFilters, {
  nhanKhoangKyTuState,
  stateThanhQueryBaoCao,
  trangThaiLocKyMacDinh,
  type ReportPeriodFilterState,
} from '@/components/ReportPeriodFilters';
import './index.less';

const ORG_TOP = 'ĐẠI HỌC ĐÀ NẴNG';
const ORG_SUB = 'TRƯỜNG ĐẠI HỌC SƯ PHẠM';

const NckhHoursReportPage: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<ReportPeriodFilterState>(trangThaiLocKyMacDinh);
  const [faculty, setFaculty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<NckhHoursReport | null>(null);

  const fetchReport = async (period: ReportPeriodFilterState, fac?: string) => {
    setLoading(true);
    try {
      const res = await getNckhHoursReport(stateThanhQueryBaoCao(period, fac));
      if (res.success) {
        setReport(res.data);
      } else {
        message.error(res.message || 'Không tải được dữ liệu thống kê');
      }
    } catch (e: any) {
      message.error(e?.message || 'Lỗi tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(periodFilter, faculty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const facultyOptions = useMemo(
    () => [
      { label: 'Tất cả đơn vị', value: '' },
      ...(report?.faculties || []).map((f) => ({ label: f, value: f })),
    ],
    [report?.faculties],
  );

  const hasData = !!report && report.units.length > 0;
  const periodLabel =
    report?.period_label || nhanKhoangKyTuState(periodFilter) || report?.academic_year || '';

  return (
    <PageContainer
      header={{
        title: 'Thống kê giờ NCKH',
        breadcrumb: {},
        extra: [
          <Space key="controls" wrap>
            <Select
              value={faculty}
              placeholder="Chọn đơn vị"
              onChange={(val) => {
                setFaculty(val);
                fetchReport(periodFilter, val);
              }}
              options={facultyOptions}
              style={{ width: 280 }}
              showSearch
            />
            <ReportPeriodFilters
              value={periodFilter}
              onChange={setPeriodFilter}
              onApply={(next) => fetchReport(next, faculty)}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchReport(periodFilter, faculty)}>
              Tải lại
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              disabled={!hasData}
              onClick={() => window.print()}
            >
              In / Lưu PDF
            </Button>
          </Space>,
        ],
      }}
    >
      <Card>
        <Spin spinning={loading}>
          {!hasData && !loading ? (
            <Empty
              description={`Chưa có dữ liệu giờ NCKH cho khoảng ${periodLabel || 'đã chọn'}.`}
            />
          ) : (
            <div id="nckh-print-area" className="nckh-doc">
              <div className="nckh-header">
                <div className="nckh-header-left">
                  <div>{ORG_TOP}</div>
                  <div className="nckh-bold">{ORG_SUB}</div>
                  <div className="nckh-line-short" />
                </div>
                <div className="nckh-header-right">
                  <div className="nckh-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="nckh-bold">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="nckh-line-short" />
                </div>
              </div>

              <div className="nckh-title">
                <div className="nckh-title-main">THỐNG KÊ GIỜ NGHIÊN CỨU KHOA HỌC</div>
                <div className="nckh-title-sub">{periodLabel}</div>
              </div>

              {report?.units.map((u) => (
                <div className="nckh-unit" key={u.unit}>
                  <div className="nckh-unit-name">{u.unit}</div>
                  <table className="nckh-table">
                    <thead>
                      <tr>
                        <th style={{ width: '6%' }}>STT</th>
                        <th style={{ width: '40%' }}>Họ và tên đệm</th>
                        <th style={{ width: '18%' }}>Tên</th>
                        <th style={{ width: '18%' }}>Tổng giờ NCKH</th>
                        <th style={{ width: '18%' }}>Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {u.rows.map((r) => (
                        <tr key={r.stt}>
                          <td className="nckh-center">{r.stt}</td>
                          <td>{r.hoTenDem}</td>
                          <td className="nckh-bold">{r.ten}</td>
                          <td className="nckh-center">{r.hours}</td>
                          <td>{r.note}</td>
                        </tr>
                      ))}
                      <tr className="nckh-subtotal">
                        <td colSpan={3} className="nckh-right nckh-bold">
                          Cộng
                        </td>
                        <td className="nckh-center nckh-bold">{u.subtotal}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}

              <div className="nckh-grand">
                Tổng cộng: <span className="nckh-bold">{report?.grand_total}</span> giờ /{' '}
                {report?.total_people} người
              </div>

              <div className="nckh-sign">
                <div className="nckh-sign-box">
                  <div className="nckh-bold">HIỆU TRƯỞNG</div>
                  <div className="nckh-sign-space" />
                </div>
              </div>
            </div>
          )}
        </Spin>
      </Card>
    </PageContainer>
  );
};

export default NckhHoursReportPage;
