/**
 * Chi tiết tin tuyển chọn đã phát hành (countdown)
 */
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Card, Descriptions, Tag, Typography } from 'antd';
import { useParams } from '@umijs/max';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  getPublishedCfp,
  renderCfpProcessTypeTags,
  type CallForProposal,
} from '@/services/api/callForProposals';

const { Paragraph } = Typography;

const CfpNewsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CallForProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!id) return;
    getPublishedCfp(Number(id))
      .then((res) => setData(res.data || null))
      .finally(() => setLoading(false));
  }, [id]);

  const deadline = data?.submissionPeriod?.deadlineAt || data?.deadlineAt;
  const countdown = useMemo(() => {
    if (!deadline) return '';
    const end = dayjs(deadline);
    const diff = end.diff(now, 'minute');
    if (diff <= 0) return 'Đã hết hạn nộp hồ sơ';
    const days = Math.floor(diff / (60 * 24));
    const hours = Math.floor((diff % (60 * 24)) / 60);
    return `Còn ${days} ngày ${hours} giờ đến hạn nộp`;
  }, [deadline, now]);

  const accepting = data?.submissionPeriod?.isAccepting;

  return (
    <PageContainer title={data?.title || 'Chi tiết tin tuyển chọn'} loading={loading}>
      {deadline && (
        <Alert
          type={accepting ? 'info' : 'warning'}
          showIcon
          style={{ marginBottom: 16 }}
          message={countdown}
          description={`Hạn nộp: ${dayjs(deadline).format('DD/MM/YYYY HH:mm')}`}
        />
      )}
      <Card>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Kỳ">
            {data?.periodKind === 'ACADEMIC' ? 'Năm học' : 'Năm TC'} {data?.periodLabel}
          </Descriptions.Item>
          <Descriptions.Item label="Loại / cấp đề tài">
            {data
              ? renderCfpProcessTypeTags(data).map((t) => <Tag key={t.key}>{t.label}</Tag>)
              : null}
          </Descriptions.Item>
          <Descriptions.Item label="Số VB">
            {data?.officialDocNo || '—'}{' '}
            {data?.officialDocDate ? `(${data.officialDocDate})` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="Nội dung hướng dẫn">
            <Paragraph>
              <div dangerouslySetInnerHTML={{ __html: data?.contentHtml || '' }} />
            </Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </PageContainer>
  );
};

export default CfpNewsDetailPage;
