/**
 * Thống kê giờ NCKH (biểu mẫu in/PDF - Cách B: HTML + print)
 * Lấy dữ liệu giờ NCKH đã tính (kpi_results) gom theo Khoa/đơn vị.
 */
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Card, Empty, Select, Space, Spin, message } from 'antd';
import { PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { getNckhHoursReport, NckhHoursReport } from '@/services/api/kpiReports';
import './index.less';

// Tạo danh sách năm học gần đây để chọn (vd 2023-2024 ... 2027-2028)
function buildAcademicYearOptions(): { label: string; value: string }[] {
  const now = new Date();
  // Năm học bắt đầu từ tháng 8; trước tháng 8 vẫn thuộc năm học trước
  const startYear = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const list: { label: string; value: string }[] = [];
  for (let y = startYear + 1; y >= startYear - 3; y--) {
    const v = `${y}-${y + 1}`;
    list.push({ label: `Năm học ${v}`, value: v });
  }
  return list;
}

const ORG_TOP = 'ĐẠI HỌC ĐÀ NẴNG';
const ORG_SUB = 'TRƯỜNG ĐẠI HỌC SƯ PHẠM';

const NckhHoursReportPage: React.FC = () => {
  const yearOptions = useMemo(() => buildAcademicYearOptions(), []);
  const [academicYear, setAcademicYear] = useState<string>(yearOptions[1]?.value ?? yearOptions[0].value);
  const [faculty, setFaculty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<NckhHoursReport | null>(null);

  const fetchReport = async (year: string, fac?: string) => {
    setLoading(true);
    try {
      const res = await getNckhHoursReport(year, fac);
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
    fetchReport(academicYear, faculty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChangeYear = (val: string) => {
    setAcademicYear(val);
    fetchReport(val, faculty);
  };

  // Tất cả đơn vị (value rỗng) + các đơn vị có hồ sơ
  const facultyOptions = useMemo(
    () => [
      { label: 'Tất cả đơn vị', value: '' },
      ...(report?.faculties || []).map((f) => ({ label: f, value: f })),
    ],
    [report?.faculties],
  );

  const hasData = !!report && report.units.length > 0;

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
                fetchReport(academicYear, val);
              }}
              options={facultyOptions}
              style={{ width: 280 }}
              showSearch
            />
            <Select
              value={academicYear}
              onChange={handleChangeYear}
              options={yearOptions}
              style={{ width: 200 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => fetchReport(academicYear, faculty)}>
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
            <Empty description={`Chưa có dữ liệu giờ NCKH cho ${academicYear}. Hãy chạy "Tính lại KPI" cho năm học này.`} />
          ) : (
            <div id="nckh-print-area" className="nckh-doc">
              {/* Phần đầu trang: quốc hiệu */}
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

              {/* Tiêu đề */}
              <div className="nckh-title">
                <div className="nckh-title-main">THỐNG KÊ GIỜ NGHIÊN CỨU KHOA HỌC</div>
                <div className="nckh-title-sub">Năm học {report?.academic_year}</div>
              </div>

              {/* Bảng theo từng Khoa/đơn vị */}
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

              {/* Tổng cộng toàn trường */}
              <div className="nckh-grand">
                Tổng cộng: <span className="nckh-bold">{report?.grand_total}</span> giờ /{' '}
                {report?.total_people} người
              </div>

              {/* Chữ ký */}
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
