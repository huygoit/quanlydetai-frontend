/**
 * Lý lịch khoa học (mẫu Thông tư 08/2011/TT-BGDĐT - Phụ lục V)
 * Cách B: render HTML đúng mẫu → in/lưu PDF bằng trình duyệt (giống biểu mẫu thống kê).
 * Điền sẵn dữ liệu có trong hồ sơ; trường nào DB chưa có thì để dòng chấm để điền tay.
 */
import { Button, Empty, Space, Spin, message } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import { useEffect, useMemo, useState } from 'react';
import {
  getMyProfile,
  type ScientificProfile,
  type Degree,
} from '@/services/api/profile';
import {
  loadScientificProfileCatalogOptions,
  type HocViHocHamSelectOption,
} from '@/utils/profileCatalogOptions';
import './index.less';

const ORG_SUB = 'TRƯỜNG ĐẠI HỌC SƯ PHẠM';

const PROJECT_LEVEL_LABEL: Record<string, string> = {
  NHA_NUOC: 'Nhà nước',
  BO: 'Bộ',
  NGANH: 'Ngành',
  TINH: 'Tỉnh/Thành phố',
  TRUONG: 'Trường',
  CO_SO: 'Cơ sở',
};
const PROJECT_ROLE_LABEL: Record<string, string> = {
  CHU_NHIEM: 'Chủ nhiệm',
  THAM_GIA: 'Tham gia',
};
const GENDER_LABEL: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
  Nam: 'Nam',
  Nữ: 'Nữ',
  Khác: 'Khác',
};

/** Khoảng trống điền tay khi in. */
const Blank: React.FC<{ width?: number }> = ({ width = 160 }) => (
  <span className="cv-blank" style={{ minWidth: width }} />
);

function dinhDangNgay(v?: string | null): string {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function nhanTuOption(
  options: HocViHocHamSelectOption[],
  value?: string | null
): string {
  if (!value) return '';
  return options.find((o) => o.value === value)?.label ?? String(value);
}

function donViCongTac(p: ScientificProfile): string {
  return [p.organization, p.faculty, p.department].filter(Boolean).join(' - ');
}

const CvPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ScientificProfile | null>(null);
  const [degreeOptions, setDegreeOptions] = useState<HocViHocHamSelectOption[]>([]);
  const [titleOptions, setTitleOptions] = useState<HocViHocHamSelectOption[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pf, cat] = await Promise.all([
          getMyProfile(),
          loadScientificProfileCatalogOptions(),
        ]);
        if (pf.success) setProfile(pf.data);
        setDegreeOptions(cat.degreeOptions);
        setTitleOptions(cat.academicTitleOptions);
      } catch {
        message.error('Không tải được hồ sơ để lập lý lịch khoa học.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const projects = useMemo(() => profile?.linkedProjects ?? [], [profile]);
  const publications = useMemo(() => profile?.publications ?? [], [profile]);
  const languages = useMemo(() => profile?.languages ?? [], [profile]);

  // Học vị cao nhất → dòng tương ứng ở mục II (điền sẵn năm/nơi nếu có).
  const degree: Degree | undefined = profile?.degree;
  const hocViNoiNam = {
    nam: profile?.degreeYear ? String(profile.degreeYear) : '',
    noi: profile?.degreeInstitution ?? '',
    nuoc: profile?.degreeCountry ?? '',
  };

  return (
    <div className="cv-screen">
      <div className="cv-toolbar">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.push('/profile/me')}>
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<PrinterOutlined />}
            disabled={!profile}
            onClick={() => window.print()}
          >
            In / Lưu PDF
          </Button>
        </Space>
      </div>
      <div className="cv-screen-body">
        <Spin spinning={loading}>
          {!profile && !loading ? (
            <Empty description="Chưa có hồ sơ khoa học. Vui lòng tạo hồ sơ trước." />
          ) : profile ? (
            <div id="cv-print-area" className="cv-doc">
              {/* Quốc hiệu */}
              <div className="cv-national">
                <div className="cv-bold">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="cv-bold">Độc lập - Tự do - Hạnh phúc</div>
                <div className="cv-line-short" />
              </div>

              {/* Tiêu đề */}
              <div className="cv-title">
                <div className="cv-title-main">LÝ LỊCH KHOA HỌC</div>
                <div className="cv-title-sub">
                  (Theo mẫu tại Thông tư số 08/2011/TT-BGDĐT ngày 17/02/2011 của Bộ trưởng Bộ GDĐT - Phụ lục V)
                </div>
              </div>

              {/* I. Lý lịch sơ lược */}
              <div className="cv-section">I. Lý lịch sơ lược</div>
              <div className="cv-row">
                Họ và tên: <span className="cv-bold">{profile.fullName}</span>
                {'   '}Giới tính: {(profile.gender && (GENDER_LABEL[profile.gender] ?? profile.gender)) || <Blank width={80} />}
              </div>
              <div className="cv-row">
                Ngày, tháng, năm sinh: {dinhDangNgay(profile.dateOfBirth) || <Blank width={120} />}
                {'   '}Nơi sinh: <Blank width={180} />
              </div>
              <div className="cv-row">
                Quê quán: <Blank width={220} />
                {'   '}Dân tộc: <Blank width={100} />
              </div>
              <div className="cv-row">
                Học vị cao nhất: {nhanTuOption(degreeOptions, profile.degree) || <Blank width={140} />}
                {'   '}Năm, nước nhận học vị: {hocViNoiNam.nam}
                {hocViNoiNam.nuoc ? `, ${hocViNoiNam.nuoc}` : ''}
                {!hocViNoiNam.nam && !hocViNoiNam.nuoc ? <Blank width={120} /> : null}
              </div>
              <div className="cv-row">
                Chức danh khoa học cao nhất: {nhanTuOption(titleOptions, profile.academicTitle) || <Blank width={120} />}
                {'   '}Năm bổ nhiệm: {profile.academicTitleYear || <Blank width={80} />}
              </div>
              <div className="cv-row">
                Chức vụ (hiện tại hoặc trước khi nghỉ hưu): {profile.managementRole || profile.currentTitle || <Blank width={200} />}
              </div>
              <div className="cv-row">
                Đơn vị công tác (hiện tại hoặc trước khi nghỉ hưu): {donViCongTac(profile) || <Blank width={200} />}
              </div>
              <div className="cv-row">
                Chỗ ở riêng hoặc địa chỉ liên lạc: <Blank width={320} />
              </div>
              <div className="cv-row">
                Điện thoại liên hệ: CQ: <Blank width={90} /> NR: <Blank width={90} /> DĐ: {profile.phone || <Blank width={90} />}
              </div>
              <div className="cv-row">
                Fax: <Blank width={120} /> E-mail: {profile.workEmail || <Blank width={160} />}
              </div>
              <div className="cv-row">
                Số CMND/CCCD: <Blank width={120} /> Ngày cấp: <Blank width={90} /> Nơi cấp: <Blank width={140} />
              </div>

              {/* II. Quá trình đào tạo */}
              <div className="cv-section">II. Quá trình đào tạo</div>
              <div className="cv-subsection">1. Đại học</div>
              <div className="cv-row">Hệ đào tạo: <Blank width={220} /></div>
              <div className="cv-row">
                Nơi đào tạo: {degree === 'BACHELOR' ? hocViNoiNam.noi || <Blank width={220} /> : <Blank width={220} />}
              </div>
              <div className="cv-row">Ngành học: <Blank width={220} /></div>
              <div className="cv-row">
                Nước đào tạo: {degree === 'BACHELOR' ? hocViNoiNam.nuoc || <Blank width={140} /> : <Blank width={140} />}
                {'   '}Năm tốt nghiệp: {degree === 'BACHELOR' ? hocViNoiNam.nam || <Blank width={80} /> : <Blank width={80} />}
              </div>

              <div className="cv-subsection">2. Sau đại học</div>
              <div className="cv-row">
                - Thạc sĩ chuyên ngành: {degree === 'MASTER' ? profile.mainResearchArea || <Blank width={200} /> : <Blank width={200} />}
                {'   '}Năm cấp bằng: {degree === 'MASTER' ? hocViNoiNam.nam || <Blank width={80} /> : <Blank width={80} />}
              </div>
              <div className="cv-row">
                Nơi đào tạo: {degree === 'MASTER' ? hocViNoiNam.noi || <Blank width={220} /> : <Blank width={220} />}
              </div>
              <div className="cv-row">
                - Tiến sĩ chuyên ngành: {degree === 'DOCTORATE' ? profile.mainResearchArea || <Blank width={200} /> : <Blank width={200} />}
                {'   '}Năm cấp bằng: {degree === 'DOCTORATE' ? hocViNoiNam.nam || <Blank width={80} /> : <Blank width={80} />}
              </div>
              <div className="cv-row">
                Nơi đào tạo: {degree === 'DOCTORATE' ? hocViNoiNam.noi || <Blank width={220} /> : <Blank width={220} />}
              </div>
              <div className="cv-row">Tên luận án: <Blank width={420} /></div>

              <div className="cv-subsection">3. Ngoại ngữ</div>
              {languages.length > 0 ? (
                languages.map((l, i) => (
                  <div className="cv-row" key={l.id ?? i}>
                    {i + 1}. {l.language} — Mức độ sử dụng: {l.level || <Blank width={120} />}
                  </div>
                ))
              ) : (
                <>
                  <div className="cv-row">1. <Blank width={160} /> Mức độ sử dụng: <Blank width={140} /></div>
                  <div className="cv-row">2. <Blank width={160} /> Mức độ sử dụng: <Blank width={140} /></div>
                </>
              )}

              {/* III. Quá trình công tác chuyên môn */}
              <div className="cv-section">III. Quá trình công tác chuyên môn</div>
              <table className="cv-table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Thời gian</th>
                    <th style={{ width: '40%' }}>Nơi công tác</th>
                    <th style={{ width: '32%' }}>Công việc đảm nhiệm</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.startWorkingAt ? (
                    <tr>
                      <td>{dinhDangNgay(profile.startWorkingAt)} - nay</td>
                      <td>{donViCongTac(profile)}</td>
                      <td>{profile.currentTitle || profile.managementRole || ''}</td>
                    </tr>
                  ) : (
                    <tr>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* IV. Quá trình nghiên cứu khoa học */}
              <div className="cv-section">IV. Quá trình nghiên cứu khoa học</div>
              <div className="cv-subsection">1. Các đề tài nghiên cứu khoa học đã và đang tham gia</div>
              <table className="cv-table">
                <thead>
                  <tr>
                    <th style={{ width: '6%' }}>TT</th>
                    <th style={{ width: '40%' }}>Tên đề tài nghiên cứu</th>
                    <th style={{ width: '16%' }}>Năm bắt đầu/ hoàn thành</th>
                    <th style={{ width: '18%' }}>Đề tài cấp</th>
                    <th style={{ width: '20%' }}>Trách nhiệm tham gia</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length > 0 ? (
                    projects.map((p, i) => (
                      <tr key={p.id}>
                        <td className="cv-center">{i + 1}</td>
                        <td>{p.title}</td>
                        <td className="cv-center">
                          {[dinhDangNgay(p.startDate), dinhDangNgay(p.endDate)].filter(Boolean).join(' / ')}
                        </td>
                        <td>{PROJECT_LEVEL_LABEL[p.level] ?? p.level}</td>
                        <td>{PROJECT_ROLE_LABEL[p.role] ?? p.role}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="cv-center">&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="cv-subsection">2. Các công trình khoa học đã công bố</div>
              <table className="cv-table">
                <thead>
                  <tr>
                    <th style={{ width: '6%' }}>TT</th>
                    <th style={{ width: '54%' }}>Tên công trình</th>
                    <th style={{ width: '14%' }}>Năm công bố</th>
                    <th style={{ width: '26%' }}>Tên tạp chí</th>
                  </tr>
                </thead>
                <tbody>
                  {publications.length > 0 ? (
                    publications.map((p, i) => (
                      <tr key={p.id}>
                        <td className="cv-center">{i + 1}</td>
                        <td>{p.title}</td>
                        <td className="cv-center">{p.year ?? ''}</td>
                        <td>{p.journalOrConference}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="cv-center">&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Ngày, chữ ký */}
              <div className="cv-date">
                ......, ngày ... tháng ... năm 20...
              </div>
              <div className="cv-sign">
                <div className="cv-sign-box">
                  <div className="cv-bold">Xác nhận của</div>
                  <div className="cv-bold">{ORG_SUB} - ĐHĐN</div>
                  <div className="cv-sign-space" />
                </div>
                <div className="cv-sign-box">
                  <div className="cv-bold">Người khai ký tên</div>
                  <div className="cv-italic">(Ghi rõ chức danh, học vị)</div>
                  <div className="cv-sign-space" />
                </div>
              </div>
            </div>
          ) : null}
        </Spin>
      </div>
    </div>
  );
};

export default CvPage;
