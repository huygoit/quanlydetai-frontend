/**
 * HomeForLanhDao - Dashboard cho Lãnh đạo
 * Theo specs/home-enterprise.md - Section 5
 */
import {
  PageContainer,
  ProCard,
  ProTable,
} from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import {
  Avatar,
  Badge,
  Button,
  Col,
  Progress,
  Row,
  Skeleton,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  FundProjectionScreenOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ProjectOutlined,
  RiseOutlined,
  BarChartOutlined,
  TrophyOutlined,
  UserOutlined,
  WarningOutlined,
  AlertOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';
import {
  fetchCurrentUser,
  fetchHomeSummary,
  fetchHomeCharts,
  fetchTopProjects,
  fetchTopResearchers,
  fetchWarnings,
  type CurrentUser,
  type HomeSummaryCard,
  type HomeCharts,
  type TopProjectItem,
  type TopResearcherItem,
  type WarningItem,
} from '@/services/mock/homeMockService';
import styles from './HomeForLanhDao.less';

const { Title, Text } = Typography;

// ============ HELPER FUNCTIONS ============

const formatCurrency = (value: number) => {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)} tỷ`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)} triệu`;
  }
  return value.toLocaleString('vi-VN');
};

// Icon mapping cho KPI - Spec 5.1
const getKPIIcon = (iconName?: string) => {
  const icons: Record<string, React.ReactNode> = {
    ProjectOutlined: <ProjectOutlined />,
    DollarOutlined: <DollarOutlined />,
    CheckCircleOutlined: <CheckCircleOutlined />,
    RiseOutlined: <RiseOutlined />,
  };
  return icons[iconName || 'ProjectOutlined'] || <ProjectOutlined />;
};

// ============ COUNTER ANIMATION HOOK ============

const useCountUp = (end: number, duration: number = 1200, decimals: number = 0) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = easeOut * end;
      setCount(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration, decimals]);

  return count;
};

// ============ KPI CARD COMPONENT ============

interface KPICardProps {
  card: HomeSummaryCard;
  loading?: boolean;
  delay?: number;
}

const KPICard: React.FC<KPICardProps> = ({ card, loading, delay = 0 }) => {
  const isDecimal = card.unit === 'tỷ đồng';
  const animatedValue = useCountUp(
    loading ? 0 : card.value,
    1200,
    isDecimal ? 1 : 0
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (loading) {
    return (
      <ProCard className={styles.kpiCard}>
        <Skeleton active paragraph={{ rows: 2 }} />
      </ProCard>
    );
  }

  return (
    <ProCard
      className={`${styles.kpiCard} ${visible ? styles.visible : ''}`}
      hoverable
    >
      <div className={styles.kpiContent}>
        <div
          className={styles.kpiIcon}
          style={{
            backgroundColor: `${card.color}15`,
            color: card.color,
          }}
        >
          {getKPIIcon(card.icon)}
        </div>
        <div className={styles.kpiInfo}>
          <Text className={styles.kpiTitle}>{card.title}</Text>
          <div className={styles.kpiValue} style={{ color: card.color }}>
            {animatedValue}
            {card.unit && <span className={styles.kpiUnit}>{card.unit}</span>}
          </div>
          {card.trendPercent !== undefined && (
            <div className={styles.kpiTrend}>
              {card.trend === 'up' ? (
                <ArrowUpOutlined className={styles.trendUp} />
              ) : card.trend === 'down' ? (
                <ArrowDownOutlined className={styles.trendDown} />
              ) : null}
              <Text
                className={
                  card.trend === 'up'
                    ? styles.trendUp
                    : card.trend === 'down'
                    ? styles.trendDown
                    : ''
                }
              >
                {card.trend === 'up' ? '+' : ''}
                {card.trendPercent}%
              </Text>
              <Text type="secondary" className={styles.trendText}>
                so với kỳ trước
              </Text>
            </div>
          )}
        </div>
      </div>
    </ProCard>
  );
};

// ============ BAR CHART COMPONENT - Spec 5.2 ============
// Chart cột: đề tài theo năm

interface BarChartProps {
  data: { year?: string; value: number }[];
  loading?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({ data, loading }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={styles.barChart}>
      <div className={styles.barChartBars}>
        {data.map((item, index) => (
          <div key={item.year} className={styles.barItem}>
            <div className={styles.barWrapper}>
              <Tooltip title={`${item.value} đề tài`}>
                <div
                  className={styles.bar}
                  style={{
                    height: animated ? `${(item.value / maxValue) * 100}%` : '0%',
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <span className={styles.barValue}>{item.value}</span>
                </div>
              </Tooltip>
            </div>
            <div className={styles.barLabel}>{item.year}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ DONUT CHART COMPONENT - Spec 5.2 ============
// Chart donut: tỷ lệ đề tài theo cấp

interface DonutChartProps {
  data: { name?: string; value: number }[];
  loading?: boolean;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, loading }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = ['#1890ff', '#52c41a', '#722ed1'];

  // Calculate percentages for donut segments
  let cumulativePercent = 0;

  return (
    <div className={styles.donutChart}>
      <div className={styles.donutContainer}>
        <svg viewBox="0 0 100 100" className={styles.donutSvg}>
          {data.map((item, index) => {
            const percent = (item.value / total) * 100;
            const strokeDasharray = animated
              ? `${percent} ${100 - percent}`
              : '0 100';
            const strokeDashoffset = -cumulativePercent;
            cumulativePercent += percent;

            return (
              <circle
                key={item.name}
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                stroke={colors[index]}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-dasharray 1s ease-out',
                  transitionDelay: `${index * 200}ms`,
                }}
                transform="rotate(-90 50 50)"
              />
            );
          })}
          <text
            x="50"
            y="50"
            textAnchor="middle"
            dy="0.3em"
            className={styles.donutTotal}
          >
            {total}
          </text>
        </svg>
      </div>
      <div className={styles.donutLegend}>
        {data.map((item, index) => {
          const percent = ((item.value / total) * 100).toFixed(1);
          return (
            <div key={item.name} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: colors[index] }}
              />
              <div className={styles.legendInfo}>
                <Text>{item.name}</Text>
                <Space size={8}>
                  <Text strong>{item.value}</Text>
                  <Text type="secondary">({percent}%)</Text>
                </Space>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============ LINE CHART COMPONENT - Spec 5.2 ============
// Chart line: tăng trưởng số lượng đề tài

interface LineChartProps {
  data: { month?: string; value: number; type?: string }[];
  loading?: boolean;
}

const LineChart: React.FC<LineChartProps> = ({ data, loading }) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  // Group by type
  const newProjects = data.filter((d) => d.type === 'Đề tài mới');
  const accepted = data.filter((d) => d.type === 'Nghiệm thu');

  const allValues = data.map((d) => d.value);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const range = maxValue - minValue || 1;

  // Create SVG path
  const createPath = (items: typeof data) => {
    if (items.length === 0) return '';
    const width = 100;
    const height = 60;
    const padding = 5;

    return items
      .map((item, i) => {
        const x = padding + (i / (items.length - 1)) * (width - padding * 2);
        const y =
          height - padding - ((item.value - minValue) / range) * (height - padding * 2);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  return (
    <div className={styles.lineChart}>
      <svg viewBox="0 0 100 70" className={styles.lineSvg}>
        {/* Grid lines */}
        <g className={styles.gridLines}>
          {[0, 1, 2, 3, 4].map((i) => (
            <line
              key={i}
              x1="5"
              y1={5 + i * 15}
              x2="95"
              y2={5 + i * 15}
              stroke="#f0f0f0"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* New projects line */}
        <path
          d={createPath(newProjects)}
          fill="none"
          stroke="#1890ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? styles.lineAnimated : styles.lineHidden}
        />

        {/* Accepted line */}
        <path
          d={createPath(accepted)}
          fill="none"
          stroke="#52c41a"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="4 2"
          className={animated ? styles.lineAnimated : styles.lineHidden}
        />
      </svg>

      <div className={styles.lineLegend}>
        <div className={styles.lineLegendItem}>
          <div className={styles.lineLegendLine} style={{ backgroundColor: '#1890ff' }} />
          <Text>Đề tài mới</Text>
        </div>
        <div className={styles.lineLegendItem}>
          <div
            className={styles.lineLegendLine}
            style={{ backgroundColor: '#52c41a', borderStyle: 'dashed' }}
          />
          <Text>Nghiệm thu</Text>
        </div>
      </div>
    </div>
  );
};

// ============ WARNING CARDS COMPONENT - Spec 5.4 ============

interface WarningCardsProps {
  warnings: WarningItem[];
  loading?: boolean;
}

const WarningCards: React.FC<WarningCardsProps> = ({ warnings, loading }) => {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  const getSeverityConfig = (severity: WarningItem['severity']) => {
    const configs = {
      HIGH: { color: '#ff4d4f', bg: '#fff2f0', icon: <AlertOutlined /> },
      MEDIUM: { color: '#faad14', bg: '#fffbe6', icon: <WarningOutlined /> },
      LOW: { color: '#1890ff', bg: '#e6f7ff', icon: <ExclamationCircleOutlined /> },
    };
    return configs[severity];
  };

  const getTypeIcon = (type: WarningItem['type']) => {
    const icons = {
      DELAY: <ClockCircleOutlined />,
      BUDGET: <DollarOutlined />,
      DEADLINE: <ExclamationCircleOutlined />,
    };
    return icons[type];
  };

  return (
    <div className={styles.warningCards}>
      {warnings.map((warning) => {
        const config = getSeverityConfig(warning.severity);
        return (
          <div
            key={warning.id}
            className={styles.warningCard}
            style={{
              borderLeftColor: config.color,
              backgroundColor: config.bg,
            }}
          >
            <div className={styles.warningHeader}>
              <div
                className={styles.warningIcon}
                style={{ color: config.color }}
              >
                {getTypeIcon(warning.type)}
              </div>
              <div className={styles.warningContent}>
                <Text strong className={styles.warningTitle}>
                  {warning.title}
                </Text>
                <Text type="secondary" className={styles.warningDesc}>
                  {warning.description}
                </Text>
              </div>
              <Tag
                color={config.color}
                className={styles.severityTag}
              >
                {warning.severity === 'HIGH'
                  ? 'Cao'
                  : warning.severity === 'MEDIUM'
                  ? 'TB'
                  : 'Thấp'}
              </Tag>
            </div>
            {warning.link && (
              <Button
                type="link"
                size="small"
                href={warning.link}
                className={styles.warningLink}
              >
                Xem chi tiết →
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============ MAIN COMPONENT ============

const HomeForLanhDao: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [summaryCards, setSummaryCards] = useState<HomeSummaryCard[]>([]);
  const [charts, setCharts] = useState<HomeCharts | null>(null);
  const [topProjects, setTopProjects] = useState<TopProjectItem[]>([]);
  const [topResearchers, setTopResearchers] = useState<TopResearcherItem[]>([]);
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);

        const [summary, chartsData, projects, researchers, warningList] =
          await Promise.all([
            fetchHomeSummary('LANH_DAO'),
            fetchHomeCharts(),
            fetchTopProjects(),
            fetchTopResearchers(),
            fetchWarnings(),
          ]);

        setSummaryCards(summary);
        setCharts(chartsData);
        setTopProjects(projects);
        setTopResearchers(researchers);
        setWarnings(warningList);
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Top Projects columns - Spec 5.3
  const topProjectColumns: ProColumns<TopProjectItem>[] = [
    {
      title: '#',
      dataIndex: 'index',
      width: 40,
      render: (_, __, index) => (
        <Badge
          count={index + 1}
          style={{
            backgroundColor:
              index === 0 ? '#faad14' : index === 1 ? '#bfbfbf' : index === 2 ? '#d48806' : '#8c8c8c',
          }}
        />
      ),
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 100,
      render: (_, record) => (
        <a href={`/projects/${record.id}`}>{record.code}</a>
      ),
    },
    {
      title: 'Tên đề tài',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'Cấp',
      dataIndex: 'level',
      width: 90,
      render: (level) => {
        const colors: Record<string, string> = {
          'Cấp Trường': 'blue',
          'Cấp Bộ': 'gold',
          'Cấp Nhà nước': 'purple',
        };
        return <Tag color={colors[level as string] || 'default'}>{level}</Tag>;
      },
    },
    {
      title: 'Kinh phí',
      dataIndex: 'budget',
      width: 100,
      render: (budget) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(budget as number)}
        </Text>
      ),
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      width: 100,
      render: (progress) => (
        <Progress
          percent={progress as number}
          size="small"
          status={(progress as number) >= 70 ? 'success' : 'active'}
        />
      ),
    },
  ];

  // Top Researchers columns - Spec 5.3
  const topResearcherColumns: ProColumns<TopResearcherItem>[] = [
    {
      title: '#',
      dataIndex: 'index',
      width: 40,
      render: (_, __, index) => (
        <Badge
          count={index + 1}
          style={{
            backgroundColor:
              index === 0 ? '#faad14' : index === 1 ? '#bfbfbf' : index === 2 ? '#d48806' : '#8c8c8c',
          }}
        />
      ),
    },
    {
      title: 'Họ tên',
      dataIndex: 'name',
      ellipsis: true,
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <a href={`/researchers/${record.id}`}>{record.name}</a>
        </Space>
      ),
    },
    {
      title: 'Đơn vị',
      dataIndex: 'department',
      width: 120,
      ellipsis: true,
    },
    {
      title: 'Đề tài',
      dataIndex: 'projectCount',
      width: 70,
      align: 'center',
      render: (count) => (
        <Tag color="blue">{count}</Tag>
      ),
    },
    {
      title: 'Ý tưởng',
      dataIndex: 'ideaCount',
      width: 70,
      align: 'center',
      render: (count) => (
        <Tag color="gold">{count}</Tag>
      ),
    },
  ];

  return (
    <PageContainer
      ghost
      header={{ title: '' }}
      loading={loading && !currentUser}
    >
      <div className={styles.container}>
        {/* Header */}
        <ProCard className={styles.headerCard} bordered={false}>
          {loading ? (
            <Skeleton active avatar paragraph={{ rows: 1 }} />
          ) : (
            <div className={styles.headerContent}>
              <Avatar
                size={60}
                icon={<CrownOutlined />}
                className={styles.avatar}
              />
              <div className={styles.headerText}>
                <Title level={3} className={styles.greeting}>
                  Dashboard Lãnh đạo 👔
                </Title>
                <Space size={8}>
                  <Text className={styles.roleLabel}>Tổng quan toàn hệ thống</Text>
                  <Tag color="gold" icon={<CrownOutlined />}>
                    Lãnh đạo
                  </Tag>
                </Space>
              </div>
            </div>
          )}
        </ProCard>

        {/* KPI Cards - Spec 5.1 */}
        <div className={styles.kpiRow}>
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <KPICard key={i} card={{} as HomeSummaryCard} loading />
              ))
            : summaryCards.map((card, index) => (
                <KPICard key={card.key} card={card} delay={index * 100} />
              ))}
        </div>

        {/* Charts Row - Spec 5.2 */}
        <Row gutter={20}>
          <Col xs={24} md={8}>
            <ProCard
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#1890ff' }} />
                  <span>Đề tài theo năm</span>
                </Space>
              }
              bordered
              className={styles.chartCard}
            >
              <BarChart
                data={charts?.projectsByYear || []}
                loading={loading}
              />
            </ProCard>
          </Col>
          <Col xs={24} md={8}>
            <ProCard
              title={
                <Space>
                  <PieChartOutlined style={{ color: '#722ed1' }} />
                  <span>Phân bố theo cấp</span>
                </Space>
              }
              bordered
              className={styles.chartCard}
            >
              <DonutChart
                data={charts?.projectsByLevel || []}
                loading={loading}
              />
            </ProCard>
          </Col>
          <Col xs={24} md={8}>
            <ProCard
              title={
                <Space>
                  <LineChartOutlined style={{ color: '#52c41a' }} />
                  <span>Xu hướng năm 2025</span>
                </Space>
              }
              bordered
              className={styles.chartCard}
            >
              <LineChart
                data={charts?.growthTrend || []}
                loading={loading}
              />
            </ProCard>
          </Col>
        </Row>

        {/* Warning Cards - Spec 5.4 */}
        <ProCard
          title={
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              <span>Cảnh báo & Rủi ro</span>
              <Badge
                count={warnings.filter((w) => w.severity === 'HIGH').length}
                style={{ backgroundColor: '#ff4d4f' }}
              />
            </Space>
          }
          bordered
          className={styles.warningSection}
          extra={
            <Button type="link" href="/warnings">
              Xem tất cả
            </Button>
          }
        >
          <WarningCards warnings={warnings} loading={loading} />
        </ProCard>

        {/* Top Lists - Spec 5.3 */}
        <Row gutter={20}>
          <Col xs={24} lg={12}>
            <ProCard
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#faad14' }} />
                  <span>Top 10 đề tài trọng điểm</span>
                </Space>
              }
              bordered
              className={styles.tableCard}
              extra={
                <Button type="link" href="/projects/top">
                  Xem tất cả
                </Button>
              }
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <ProTable<TopProjectItem>
                  columns={topProjectColumns}
                  dataSource={topProjects.slice(0, 10)}
                  rowKey="id"
                  search={false}
                  options={false}
                  pagination={false}
                  size="small"
                />
              )}
            </ProCard>
          </Col>
          <Col xs={24} lg={12}>
            <ProCard
              title={
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <span>Top 10 chủ nhiệm hoạt động mạnh</span>
                </Space>
              }
              bordered
              className={styles.tableCard}
              extra={
                <Button type="link" href="/researchers/top">
                  Xem tất cả
                </Button>
              }
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : (
                <ProTable<TopResearcherItem>
                  columns={topResearcherColumns}
                  dataSource={topResearchers.slice(0, 10)}
                  rowKey="id"
                  search={false}
                  options={false}
                  pagination={false}
                  size="small"
                />
              )}
            </ProCard>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default HomeForLanhDao;





