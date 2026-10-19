/**
 * Tin tức tuyển chọn nhiệm vụ — bài nổi bật và danh sách thẻ.
 */
import { PageContainer } from '@ant-design/pro-components';
import { Empty, Skeleton, Tag } from 'antd';
import { history } from '@umijs/max';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  listPublishedCfp,
  renderCfpProcessTypeTags,
  type CallForProposal,
} from '@/services/api/callForProposals';
import './tin.less';

function hanNop(item: CallForProposal) {
  return item.submissionPeriod?.deadlineAt || item.deadlineAt || null;
}

function dangNhan(item: CallForProposal, bayGio: dayjs.Dayjs) {
  if (item.submissionPeriod) return !!item.submissionPeriod.isAccepting;
  const han = hanNop(item);
  return han ? dayjs(han).isAfter(bayGio) : false;
}

function tomTat(html?: string | null, doDai = 220) {
  const chu = (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (chu.length <= doDai) return chu;
  return `${chu.slice(0, doDai).replace(/\s+\S*$/, '')}…`;
}

function ngay(giaTri?: string | null) {
  if (!giaTri) return '';
  const d = dayjs(giaTri);
  return d.isValid() ? d.format('DD/MM/YYYY') : '';
}

function tenKy(item: CallForProposal) {
  const loai = item.periodKind === 'ACADEMIC' ? 'Năm học' : 'Năm tài chính';
  return `${loai} ${item.periodLabel || ''}`.trim();
}

function demNguoc(han: string | null, bayGio: dayjs.Dayjs) {
  if (!han) return { het: false, so: '—', donVi: 'Chưa có hạn nộp', phu: '' };
  const end = dayjs(han);
  const phut = end.diff(bayGio, 'minute');
  if (phut <= 0) return { het: true, so: 'Hết hạn', donVi: 'Đã đóng nhận hồ sơ', phu: ngay(han) };
  const ngayCon = Math.floor(phut / (60 * 24));
  const gio = Math.floor((phut % (60 * 24)) / 60);
  if (ngayCon > 0) return { het: false, so: String(ngayCon), donVi: `ngày ${gio} giờ`, phu: ngay(han) };
  return { het: false, so: String(Math.max(gio, 1)), donVi: 'giờ', phu: ngay(han) };
}

function moTin(id: number) {
  history.push(`/projects/call-for-proposals/news/${id}`);
}

const CfpNewsPage: React.FC = () => {
  const [rows, setRows] = useState<CallForProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [bayGio, setBayGio] = useState(() => dayjs());

  useEffect(() => {
    const t = setInterval(() => setBayGio(dayjs()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    listPublishedCfp()
      .then((res) => setRows(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  const { noiBat, conLai } = useMemo(() => {
    const sapXep = [...rows].sort((a, b) => {
      const moA = dangNhan(a, bayGio) ? 1 : 0;
      const moB = dangNhan(b, bayGio) ? 1 : 0;
      if (moA !== moB) return moB - moA;
      return dayjs(b.publishedAt || 0).valueOf() - dayjs(a.publishedAt || 0).valueOf();
    });
    return { noiBat: sapXep[0], conLai: sapXep.slice(1) };
  }, [rows, bayGio]);

  return (
    <PageContainer title="Tin tức tuyển chọn nhiệm vụ">
      <div className="cfp-tin">
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : !noiBat ? (
          <Empty description="Chưa có thông báo nào được phát hành" />
        ) : (
          <>
            <BaiNoiBat item={noiBat} bayGio={bayGio} />
            {conLai.length > 0 && (
              <>
                <div className="cfp-tin-nhom">Thông báo khác</div>
                <div className="cfp-tin-luoi">
                  {conLai.map((item) => (
                    <TheTin key={item.id} item={item} bayGio={bayGio} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};

function TheLoai({ item }: { item: CallForProposal }) {
  const ds = renderCfpProcessTypeTags(item);
  const hien = ds.slice(0, 3);
  const du = ds.length - hien.length;
  return (
    <>
      {hien.map((t) => (
        <Tag key={t.key}>{t.label}</Tag>
      ))}
      {du > 0 ? <Tag>+{du}</Tag> : null}
    </>
  );
}

function BaiNoiBat({ item, bayGio }: { item: CallForProposal; bayGio: dayjs.Dayjs }) {
  const mo = dangNhan(item, bayGio);
  const dem = demNguoc(hanNop(item), bayGio);
  const trich = tomTat(item.contentHtml, 280);
  return (
    <article className="cfp-tin-noi-bat">
      <div className="cfp-tin-noi-bat-than">
        <div className="cfp-tin-kicker">
          <Tag color={mo ? 'green' : 'default'}>{mo ? 'Đang nhận hồ sơ' : 'Đã đóng'}</Tag>
          <Tag>{tenKy(item)}</Tag>
          <TheLoai item={item} />
        </div>
        <h2 className="cfp-tin-tieu-de" onClick={() => moTin(item.id)}>
          {item.title}
        </h2>
        {trich ? <p className="cfp-tin-tom-tat">{trich}</p> : null}
        <div className="cfp-tin-meta">
          {ngay(item.publishedAt) ? <span>Phát hành {ngay(item.publishedAt)}</span> : null}
          {item.officialDocNo ? <span>Số {item.officialDocNo}</span> : null}
        </div>
      </div>
      <aside className={`cfp-tin-han${dem.het ? ' het' : ''}`}>
        <div className="cfp-tin-han-nhan">{mo ? 'Còn lại' : 'Trạng thái'}</div>
        <div className="cfp-tin-han-so">{dem.so}</div>
        <div className="cfp-tin-han-don-vi">{dem.donVi}</div>
        {dem.phu ? <div className="cfp-tin-han-ngay">Hạn nộp {dem.phu}</div> : null}
        <button type="button" className="cfp-tin-nut" onClick={() => moTin(item.id)}>
          Đọc thông báo
        </button>
      </aside>
    </article>
  );
}

function TheTin({ item, bayGio }: { item: CallForProposal; bayGio: dayjs.Dayjs }) {
  const mo = dangNhan(item, bayGio);
  const dem = demNguoc(hanNop(item), bayGio);
  const trich = tomTat(item.contentHtml, 140);
  return (
    <button type="button" className="cfp-tin-the" onClick={() => moTin(item.id)}>
      <div className="cfp-tin-kicker">
        <Tag color={mo ? 'green' : 'default'}>{mo ? 'Đang nhận' : 'Đã đóng'}</Tag>
        <Tag>{tenKy(item)}</Tag>
      </div>
      <h3 className="cfp-tin-the-ten">{item.title}</h3>
      {trich ? <p className="cfp-tin-the-tom-tat">{trich}</p> : null}
      <div className="cfp-tin-the-chan">
        <span>{dem.phu ? `Hạn ${dem.phu}` : 'Chưa có hạn nộp'}</span>
        <span className={`cfp-tin-con${dem.het ? ' het' : ''}`}>
          {dem.het ? 'Hết hạn' : `Còn ${dem.so} ${dem.donVi}`}
        </span>
      </div>
    </button>
  );
}

export default CfpNewsPage;
