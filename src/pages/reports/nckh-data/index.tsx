/**
 * Dữ liệu NCKH theo Khoa (biểu mẫu ma trận in/PDF - Cách B: HTML + print)
 * Mỗi giảng viên 1 dòng, đếm số công trình theo từng loại + giờ NCKH.
 */
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Card, Empty, Select, Space, Spin, message } from 'antd';
import { PrinterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { getNckhDataReport, NckhDataReport } from '@/services/api/kpiReports';
import './index.less';

// Năm học gần đây để chọn
function buildAcademicYearOptions(): { label: string; value: string }[] {
  const now = new Date();
  const startYear = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const list: { label: string; value: string }[] = [];
  for (let y = startYear + 1; y >= startYear - 3; y--) {
    const v = `${y}-${y + 1}`;
    list.push({ label: `Năm học ${v}`, value: v });
  }
  return list;
}

const NckhDataReportPage: React.FC = () => {
  const yearOptions = useMemo(() => buildAcademicYearOptions(), []);
  const [academicYear, setAcademicYear] = useState<string>(
    yearOptions[1]?.value ?? yearOptions[0].value,
  );
  const [faculty, setFaculty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<NckhDataReport | null>(null);

  const fetchReport = async (year: string, fac?: string) => {
    setLoading(true);
    try {
      const res = await getNckhDataReport(year, fac);
      if (res.success) {
        setReport(res.data);
        setFaculty(res.data.faculty);
      } else {
        message.error(res.message || 'Không tải được dữ liệu');
      }
    } catch (e: any) {
      message.error(e?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(academicYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const facultyOptions = useMemo(
    () => (report?.faculties || []).map((f) => ({ label: f, value: f })),
    [report?.faculties],
  );

  const hasData = !!report && report.rows.length > 0;
  const t = report?.totals;

  return (
    <PageContainer
      header={{
        title: 'Thống kê kết quả NCKH',
        breadcrumb: {},
        extra: [
          <Space key="controls" wrap>
            <Select
              value={faculty || undefined}
              placeholder="Chọn Khoa/đơn vị"
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
              onChange={(val) => {
                setAcademicYear(val);
                fetchReport(val, faculty);
              }}
              options={yearOptions}
              style={{ width: 180 }}
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
        <Alert
          type="info"
          style={{ marginBottom: 12 }}
          message="Số công trình và Giờ NCKH lấy theo ngày xuất bản nằm trong năm học đã chọn (01/08 → 31/07). Các cột Đề tài / SV NCKH / Sở hữu trí tuệ hiển thị 0 khi chưa có dữ liệu."
        />
        <Spin spinning={loading}>
          {!hasData && !loading ? (
            <Empty description="Chưa có dữ liệu cho Khoa/đơn vị này" />
          ) : (
            <div className="nckh-data-scroll">
              <div id="nckh-print-area" className="nckh-data-doc">
                <div className="nckh-data-title">
                  <div className="nckh-data-title-main">
                    DỮ LIỆU NCKH CỦA {(report?.faculty || '').toUpperCase()}
                  </div>
                  <div className="nckh-data-title-sub">NĂM HỌC {report?.academic_year}</div>
                </div>

                <table className="nckh-data-table">
                  <thead>
                    <tr>
                      <th rowSpan={2}>Số TT</th>
                      <th rowSpan={2} colSpan={2}>
                        Họ và tên
                      </th>
                      <th colSpan={3}>Công trình bài báo khoa học</th>
                      <th colSpan={4}>Công trình đề tài khoa học</th>
                      <th rowSpan={2}>SV NCKH</th>
                      <th rowSpan={2}>Giờ Nghiên cứu khoa học</th>
                      <th rowSpan={2}>Giáo trình</th>
                      <th rowSpan={2}>Sách chuyên khảo</th>
                      <th rowSpan={2}>Tài liệu tham khảo</th>
                      <th rowSpan={2}>Tài liệu bồi dưỡng</th>
                      <th rowSpan={2}>Sở hữu trí tuệ</th>
                      <th rowSpan={2}>Ghi chú</th>
                    </tr>
                    <tr>
                      <th>Bài báo tạp chí trong danh mục Web of Science / Scopus</th>
                      <th>Bài báo đăng Tạp chí quốc tế khác</th>
                      <th>ISBN, được Hội đồng Chức danh công nhận</th>
                      <th>Nhà nước</th>
                      <th>Bộ</th>
                      <th>ĐHĐN / Trường</th>
                      <th>Cơ sở</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report?.rows.map((r) => (
                      <tr key={r.stt}>
                        <td className="c">{r.stt}</td>
                        <td>{r.hoTenDem}</td>
                        <td className="b">{r.ten}</td>
                        <td className="c">{r.wos_scopus || ''}</td>
                        <td className="c">{r.intl_other || ''}</td>
                        <td className="c">{r.isbn_proc || ''}</td>
                        <td className="c">{r.dt_nha_nuoc || ''}</td>
                        <td className="c">{r.dt_bo || ''}</td>
                        <td className="c">{r.dt_truong || ''}</td>
                        <td className="c">{r.dt_co_so || ''}</td>
                        <td className="c">{r.sv_nckh || ''}</td>
                        <td className="c">{r.hours || ''}</td>
                        <td className="c">{r.textbook || ''}</td>
                        <td className="c">{r.monograph || ''}</td>
                        <td className="c">{r.reference || ''}</td>
                        <td className="c">{r.training_doc || ''}</td>
                        <td className="c">{r.ip || ''}</td>
                        <td>{r.note}</td>
                      </tr>
                    ))}
                    {t && (
                      <tr className="nckh-data-total">
                        <td className="c b" colSpan={3}>
                          Tổng cộng
                        </td>
                        <td className="c b">{t.wos_scopus}</td>
                        <td className="c b">{t.intl_other}</td>
                        <td className="c b">{t.isbn_proc}</td>
                        <td className="c b">{t.dt_nha_nuoc}</td>
                        <td className="c b">{t.dt_bo}</td>
                        <td className="c b">{t.dt_truong}</td>
                        <td className="c b">{t.dt_co_so}</td>
                        <td className="c b">{t.sv_nckh}</td>
                        <td className="c b">{t.hours}</td>
                        <td className="c b">{t.textbook}</td>
                        <td className="c b">{t.monograph}</td>
                        <td className="c b">{t.reference}</td>
                        <td className="c b">{t.training_doc}</td>
                        <td className="c b">{t.ip}</td>
                        <td />
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Spin>
      </Card>
    </PageContainer>
  );
};

export default NckhDataReportPage;
