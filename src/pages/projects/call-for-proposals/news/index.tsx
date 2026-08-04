/**
 * Tin tức — danh sách thông báo tuyển chọn đã phát hành + countdown
 */
import { PageContainer } from '@ant-design/pro-components';
import { Card, Empty, List, Tag, Typography } from 'antd';
import { history } from '@umijs/max';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  listPublishedCfp,
  CFP_LEVEL_OPTIONS,
  type CallForProposal,
} from '@/services/api/callForProposals';

const { Text } = Typography;

function Countdown({ deadlineAt }: { deadlineAt?: string | null }) {
  const [now, setNow] = useState(() => dayjs());
  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(t);
  }, []);
  const text = useMemo(() => {
    if (!deadlineAt) return '—';
    const end = dayjs(deadlineAt);
    const diff = end.diff(now, 'minute');
    if (diff <= 0) return 'Đã hết hạn nộp';
    const days = Math.floor(diff / (60 * 24));
    const hours = Math.floor((diff % (60 * 24)) / 60);
    if (days > 0) return `Còn ${days} ngày ${hours} giờ`;
    return `Còn ${hours} giờ`;
  }, [deadlineAt, now]);
  const overdue = deadlineAt ? dayjs(deadlineAt).isBefore(now) : false;
  return <Tag color={overdue ? 'default' : 'red'}>{text}</Tag>;
}

const CfpNewsPage: React.FC = () => {
  const [rows, setRows] = useState<CallForProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPublishedCfp()
      .then((res) => setRows(res.data || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer title="Tin tuyển chọn đề tài">
      <Card loading={loading}>
        {!rows.length && !loading ? (
          <Empty description="Chưa có thông báo nào được phát hành" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={rows}
            renderItem={(item) => (
              <List.Item
                key={item.id}
                actions={[
                  <a
                    key="detail"
                    onClick={() => history.push(`/projects/call-for-proposals/news/${item.id}`)}
                  >
                    Xem chi tiết
                  </a>,
                ]}
                extra={<Countdown deadlineAt={item.submissionPeriod?.deadlineAt || item.deadlineAt} />}
              >
                <List.Item.Meta
                  title={
                    <a onClick={() => history.push(`/projects/call-for-proposals/news/${item.id}`)}>
                      {item.title}
                    </a>
                  }
                  description={
                    <SpaceLike>
                      <Text type="secondary">
                        {item.periodKind === 'ACADEMIC' ? 'Năm học' : 'Năm TC'} {item.periodLabel}
                      </Text>
                      {(item.levels || []).map((lv) => (
                        <Tag key={lv}>{CFP_LEVEL_OPTIONS.find((o) => o.value === lv)?.label || lv}</Tag>
                      ))}
                      <Text type="secondary">
                        Hạn nộp:{' '}
                        {dayjs(item.submissionPeriod?.deadlineAt || item.deadlineAt).format(
                          'DD/MM/YYYY',
                        )}
                      </Text>
                    </SpaceLike>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </PageContainer>
  );
};

/** Spacer nhỏ không import Space để tránh bundle thừa — dùng div flex */
const SpaceLike: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{children}</div>
);

export default CfpNewsPage;
