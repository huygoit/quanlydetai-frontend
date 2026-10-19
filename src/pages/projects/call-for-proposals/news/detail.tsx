/**
 * Chi tiết tin tuyển chọn — cùng bố cục trang chi tiết thông báo.
 * Nội dung chỉ hiện một đoạn, bấm Xem thêm mới mở hết.
 */
import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Descriptions, Drawer, Tag, Typography, message } from 'antd';
import { history, useParams } from '@umijs/max';
import { useCallback, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  CFP_STATUS_MAP,
  downloadCfpNotice,
  getCallForProposal,
  renderCfpProcessTypeTags,
  type CallForProposal,
  type CfpNhiemVu,
  type CfpStatus,
} from '@/services/api/callForProposals';
import { getProposal, PROPOSAL_STATUS_MAP, type ProjectProposal } from '@/services/api/projectProposals';
import NhiemVuThongBao from '../detail/NhiemVuThongBao';

const { Text } = Typography;
const CAO_RUT = 72;

function chuDem(han: string | null, bayGio: dayjs.Dayjs, daDong: boolean) {
  const hanChu = han ? dayjs(han).format('HH:mm DD/MM/YYYY') : '';
  if (daDong) return { het: true, chinh: 'Đã hết hạn đăng ký', phu: hanChu };
  if (!han) return { het: true, chinh: 'Chưa có hạn đăng ký', phu: '' };
  const con = dayjs(han).diff(bayGio, 'second');
  if (con <= 0) return { het: true, chinh: 'Đã hết hạn đăng ký', phu: hanChu };
  const ngay = Math.floor(con / 86400);
  const gio = Math.floor((con % 86400) / 3600);
  const phut = Math.floor((con % 3600) / 60);
  const giay = con % 60;
  const phan = [
    ngay > 0 ? `${ngay} ngày` : '',
    `${gio} giờ`,
    `${phut} phút`,
    `${giay} giây`,
  ].filter(Boolean);
  return { het: false, chinh: phan.join(' '), phu: hanChu };
}

const CfpNewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CallForProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [dangTai, setDangTai] = useState(false);
  const [moHet, setMoHet] = useState(false);
  const [dai, setDai] = useState(false);
  const hopRef = useRef<HTMLDivElement>(null);
  const [moXem, setMoXem] = useState(false);
  const [dangXem, setDangXem] = useState(false);
  const [nhiemVuXem, setNhiemVuXem] = useState<ProjectProposal | null>(null);
  const [bayGio, setBayGio] = useState(() => dayjs());

  const tai = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getCallForProposal(Number(id));
      setData(res.data || null);
    } catch (e: any) {
      message.error(e?.message || 'Không tải được tin');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void tai();
  }, [tai]);

  useEffect(() => {
    const t = setInterval(() => setBayGio(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setMoHet(false);
  }, [data?.id]);

  useEffect(() => {
    const el = hopRef.current;
    if (!el || moHet) return;
    setDai(el.scrollHeight > el.clientHeight + 8);
  }, [data?.contentHtml, moHet, loading]);

  const st = data?.status as CfpStatus | undefined;
  const stMeta = st ? CFP_STATUS_MAP[st] : undefined;
  const hanDangKy = data?.submissionPeriod?.deadlineAt || data?.deadlineAt || null;
  const daDong = data?.submissionPeriod ? !data.submissionPeriod.isAccepting : false;
  const dem = chuDem(hanDangKy, bayGio, daDong);
  const ngayVanBan = data?.officialDocDate
    ? dayjs(data.officialDocDate).isValid()
      ? dayjs(data.officialDocDate).format('DD/MM/YYYY')
      : data.officialDocDate
    : '';

  const taiThongBao = async () => {
    if (!id) return;
    setDangTai(true);
    try {
      await downloadCfpNotice(Number(id));
    } catch (e: any) {
      message.error(e?.message || 'Tải thông báo thất bại');
    } finally {
      setDangTai(false);
    }
  };

  const xemNhiemVu = async (row: CfpNhiemVu) => {
    setMoXem(true);
    setDangXem(true);
    setNhiemVuXem(null);
    try {
      const res = await getProposal(row.id);
      setNhiemVuXem(res.data || null);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được nhiệm vụ');
      setMoXem(false);
    } finally {
      setDangXem(false);
    }
  };

  return (
    <PageContainer
      loading={loading}
      className="cfp-chi-tiet"
      title={data?.title || 'Tin tức tuyển chọn nhiệm vụ'}
      onBack={() => history.push('/projects/call-for-proposals/news')}
    >
      <style>{`
        .cfp-chi-tiet .cfp-tom-tat {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .cfp-chi-tiet .cfp-o {
          background: #f7f9fc;
          border: 1px solid #eef1f6;
          border-radius: 10px;
          padding: 12px 14px;
          min-height: 72px;
        }
        .cfp-chi-tiet .cfp-nhan { color: #8c8c8c; font-size: 12px; margin-bottom: 6px; }
        .cfp-chi-tiet .cfp-gia-tri { font-weight: 600; color: #1f1f1f; line-height: 1.45; }
        .cfp-chi-tiet .cfp-noi-dung {
          margin-top: 12px;
          padding: 10px 14px 4px;
          background: #fff;
          border: 1px solid #f0f0f0;
          border-radius: 10px;
          line-height: 1.6;
        }
        .cfp-chi-tiet .cfp-noi-dung-rut { max-height: ${CAO_RUT}px; overflow: hidden; position: relative; }
        .cfp-chi-tiet .cfp-noi-dung-rut.co-mo::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: 0;
          height: 28px;
          background: linear-gradient(transparent, #fff);
        }
        .cfp-chi-tiet .cfp-dong {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 24px;
          margin-top: 16px;
        }
        .cfp-chi-tiet .cfp-dau {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: -4px 0 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #f0f0f0;
        }
        .cfp-chi-tiet .cfp-dem-dong {
          color: #142033;
          font-size: 20px;
          font-weight: 650;
          line-height: 1.4;
        }
        .cfp-chi-tiet .cfp-dem-dong.het { color: #8a96a3; }
        .cfp-chi-tiet .cfp-dem-dong span { color: #0b3a6e; font-weight: 700; }
        @media (max-width: 900px) {
          .cfp-chi-tiet .cfp-tom-tat { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {data ? (
        <>
          <Card style={{ marginBottom: 16 }}>
            <div className="cfp-dau">
              <div className={`cfp-dem-dong${dem.het ? ' het' : ''}`}>
                {dem.phu ? <>Hạn nộp: {dem.phu} </> : null}
                <span>({dem.het ? dem.chinh : `Còn ${dem.chinh}`})</span>
              </div>
              <Button loading={dangTai} onClick={() => void taiThongBao()}>
                Tải thông báo
              </Button>
            </div>
            <div className="cfp-tom-tat">
              <div className="cfp-o">
                <div className="cfp-nhan">Trạng thái</div>
                <div className="cfp-gia-tri">
                  <Tag color={stMeta?.color} style={{ marginInlineEnd: 0 }}>
                    {stMeta?.text || '—'}
                  </Tag>
                </div>
              </div>
              <div className="cfp-o">
                <div className="cfp-nhan">Kỳ thực hiện</div>
                <div className="cfp-gia-tri">
                  {data.periodKind === 'ACADEMIC' ? 'Năm học' : 'Năm tài chính'} {data.periodLabel}
                </div>
              </div>
              <div className="cfp-o">
                <div className="cfp-nhan">Hạn nộp hồ sơ</div>
                <div className="cfp-gia-tri">
                  {data.deadlineAt ? dayjs(data.deadlineAt).format('DD/MM/YYYY HH:mm') : '—'}
                </div>
              </div>
              <div className="cfp-o">
                <div className="cfp-nhan">Số văn bản</div>
                <div className="cfp-gia-tri">
                  {data.soVanBan || data.officialDocNo || '—'}
                  {ngayVanBan ? <Text type="secondary"> · {ngayVanBan}</Text> : null}
                </div>
              </div>
            </div>

            <div className="cfp-dong">
              <div>
                <Text type="secondary">Cấp đề tài </Text>
                {renderCfpProcessTypeTags(data).map((t) => (
                  <Tag key={t.key} color="blue">
                    {t.label}
                  </Tag>
                ))}
              </div>
              <div>
                <Text type="secondary">Người tạo </Text>
                <Text strong>
                  {data.createdBy} - {data.creatorName || '—'}
                </Text>
              </div>
              {data.submissionPeriod ? (
                <div>
                  <Text type="secondary">Kỳ tiếp nhận </Text>
                  <Tag color={data.submissionPeriod.isAccepting ? 'green' : 'default'}>
                    {data.submissionPeriod.isAccepting ? 'Đang nhận hồ sơ' : 'Đã đóng'}
                  </Tag>
                  <Text type="secondary">
                    hạn {dayjs(data.submissionPeriod.deadlineAt).format('DD/MM/YYYY')}
                  </Text>
                </div>
              ) : null}
            </div>

            <div className="cfp-noi-dung">
              <div className="cfp-nhan">Nội dung</div>
              <div
                ref={hopRef}
                className={!moHet ? `cfp-noi-dung-rut${dai ? ' co-mo' : ''}` : undefined}
                dangerouslySetInnerHTML={{
                  __html: data.contentHtml || '<span style="color:#8c8c8c">Chưa có nội dung.</span>',
                }}
              />
              {dai ? (
                <Button type="link" style={{ paddingLeft: 0 }} onClick={() => setMoHet((v) => !v)}>
                  {moHet ? 'Thu gọn' : 'Xem thêm'}
                </Button>
              ) : null}
            </div>
          </Card>

          <NhiemVuThongBao
            cfpId={Number(data.id)}
            coTheSua={false}
            tieuDe="Danh sách nhiệm vụ trong thông báo"
            onXem={xemNhiemVu}
            onDangKy={(row) =>
              history.push(`/projects/dang-ky?callForProposalId=${data.id}&nhiemVuId=${row.id}`)
            }
          />

          <Drawer
            title={nhiemVuXem?.code || 'Chi tiết nhiệm vụ'}
            width={640}
            open={moXem}
            onClose={() => setMoXem(false)}
            destroyOnClose
          >
            {dangXem ? (
              <div>Đang tải...</div>
            ) : nhiemVuXem ? (
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Trạng thái">
                  <Tag color={PROPOSAL_STATUS_MAP[nhiemVuXem.status]?.color}>
                    {PROPOSAL_STATUS_MAP[nhiemVuXem.status]?.label || nhiemVuXem.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tên nhiệm vụ">{nhiemVuXem.title}</Descriptions.Item>
                <Descriptions.Item label="Chủ nhiệm">
                  {nhiemVuXem.ownerName}
                  {nhiemVuXem.ownerUnit ? ` · ${nhiemVuXem.ownerUnit}` : ''}
                </Descriptions.Item>
                <Descriptions.Item label="Cấp">
                  {nhiemVuXem.projectProcessType
                    ? `${nhiemVuXem.projectProcessType.code} · ${nhiemVuXem.projectProcessType.name}`
                    : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Thời gian">
                  {nhiemVuXem.durationMonths ? `${nhiemVuXem.durationMonths} tháng` : '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Mục tiêu">{nhiemVuXem.objectives || '—'}</Descriptions.Item>
                <Descriptions.Item label="Sản phẩm dự kiến">
                  {nhiemVuXem.expectedResults || '—'}
                </Descriptions.Item>
              </Descriptions>
            ) : null}
          </Drawer>

        </>
      ) : !loading ? (
        <div>Không tìm thấy thông báo.</div>
      ) : null}
    </PageContainer>
  );
};

export default CfpNewsDetailPage;
