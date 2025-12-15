/**
 * HomeForPhongKH - Dashboard cho Phòng Khoa học
 * Theo specs/home-enterprise.md - Section 4
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
  List,
  Progress,
  Row,
  Skeleton,
  Space,
  Steps,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ArrowRightOutlined,
  AuditOutlined,
  BellOutlined,
  BulbOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  FileTextOutlined,
  ProjectOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';
import {
  fetchCurrentUser,
  fetchHomeSummary,
  fetchHomeTasks,
  fetchHomeIdeas,
  fetchWorkflowSteps,
  fetchPendingProposals,
  fetchDelayedProjects,
  type CurrentUser,
  type HomeSummaryCard,
  type HomeTaskItem,
  type HomeIdeaShort,
  type HomeProjectShort,
  type WorkflowStep,
} from '@/services/mock/homeMockService';
import styles from './HomeForPhongKH.less';

const { Title, Text } = Typography;

// ============ HELPER FUNCTIONS ============

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Kiểm tra deadline status
const getDeadlineStatus = (dueDate?: string): 'overdue' | 'today' | 'normal' => {
  if (!dueDate) return 'normal';
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'overdue';
  if (diffDays === 0) return 'today';
  return 'normal';
};

const getDeadlineColor = (status: 'overdue' | 'today' | 'normal') => {
  const colors = {
    overdue: '#ff4d4f',
    today: '#faad14',
    normal: '#52c41a',
  };
  return colors[status];
};

// Icon mapping cho KPI - Spec 4.1
const getKPIIcon = (iconName?: string) => {
  const icons: Record<string, React.ReactNode> = {
    FileTextOutlined: <FileTextOutlined />,
    BulbOutlined: <BulbOutlined />,
    ProjectOutlined: <ProjectOutlined />,
    CalendarOutlined: <CalendarOutlined />,
  };
  return icons[iconName || 'FileTextOutlined'] || <FileTextOutlined />;
};

// Icon mapping cho Task
const getTaskIcon = (type: HomeTaskItem['type']) => {
  const iconMap: Record<string, React.ReactNode> = {
    SO_LOAI_Y_TUONG: <FileSearchOutlined />,
    PHAN_HOI_DONG: <TeamOutlined />,
    DUYET_DE_XUAT: <AuditOutlined />,
    XEM_XET_DE_XUAT: <FileTextOutlined />,
    PHAN_CONG_PHAN_BIEN: <UserOutlined />,
    PHE_DUYET_DAT_HANG: <SafetyCertificateOutlined />,
  };
  return iconMap[type] || <FileTextOutlined />;
};

// ============ COUNTER ANIMATION HOOK ============

const useCountUp = (end: number, duration: number = 1200) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [end, duration]);

  return count;
};

// ============ KPI CARD COMPONENT ============

interface KPICardProps {
  card: HomeSummaryCard;
  loading?: boolean;
  delay?: number;
}

const KPICard: React.FC<KPICardProps> = ({ card, loading, delay = 0 }) => {
  const animatedValue = useCountUp(loading ? 0 : card.value, 1200);
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

// ============ WORKFLOW PANEL COMPONENT ============
// Spec 4.2: Sơ loại → 2A → 2B → GĐ3 → GĐ4

interface WorkflowPanelProps {
  steps: WorkflowStep[];
  loading?: boolean;
}

const WorkflowPanel: React.FC<WorkflowPanelProps> = ({ steps, loading }) => {
  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  const currentStep = steps.findIndex((s) => s.status === 'process');

  // Workflow icons
  const getStepIcon = (key: string) => {
    const icons: Record<string, React.ReactNode> = {
      idea_review: <FileSearchOutlined />,
      council_2a: <TeamOutlined />,
      scoring_2b: <AuditOutlined />,
      tracking_gd3: <ProjectOutlined />,
      acceptance_gd4: <SafetyCertificateOutlined />,
    };
    return icons[key] || <FileTextOutlined />;
  };

  return (
    <div className={styles.workflowPanel}>
      {/* Steps view */}
      <Steps
        current={currentStep >= 0 ? currentStep : 0}
        className={styles.workflowSteps}
        items={steps.map((step) => ({
          title: (
            <div className={styles.stepTitle}>
              <span>{step.title}</span>
              {step.count > 0 && (
                <Badge
                  count={step.count}
                  style={{
                    backgroundColor:
                      step.status === 'process' ? '#1890ff' : '#d9d9d9',
                    marginLeft: 8,
                  }}
                />
              )}
            </div>
          ),
          description: step.description,
          status: step.status,
          icon: getStepIcon(step.key),
        }))}
      />

      {/* Action cards */}
      <div className={styles.workflowCards}>
        {steps
          .filter((s) => s.count > 0)
          .map((step) => (
            <div
              key={step.key}
              className={`${styles.workflowCard} ${
                step.status === 'process' ? styles.active : ''
              }`}
            >
              <div className={styles.workflowCardIcon}>
                {getStepIcon(step.key)}
              </div>
              <div className={styles.workflowCardInfo}>
                <Text strong>{step.title}</Text>
                <div className={styles.workflowCardCount}>
                  <Badge
                    count={step.count}
                    style={{
                      backgroundColor:
                        step.status === 'process' ? '#1890ff' : '#8c8c8c',
                    }}
                  />
                  <Text type="secondary">cần xử lý</Text>
                </div>
              </div>
              <Button
                type={step.status === 'process' ? 'primary' : 'default'}
                size="small"
                href={step.link}
                icon={<ArrowRightOutlined />}
              >
                Xử lý
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
};

// ============ TASK LIST FOR APPROVAL ============
// Spec 4.3: Công việc cần duyệt trong tuần

interface ApprovalTaskListProps {
  tasks: HomeTaskItem[];
  loading?: boolean;
}

const ApprovalTaskList: React.FC<ApprovalTaskListProps> = ({ tasks, loading }) => {
  const getPriorityBadge = (priority: HomeTaskItem['priority']) => {
    const config = {
      HIGH: { color: 'red', text: 'Cao' },
      MEDIUM: { color: 'orange', text: 'TB' },
      LOW: { color: 'blue', text: 'Thấp' },
    };
    const { color, text } = config[priority];
    return <Tag color={color} className={styles.priorityTag}>{text}</Tag>;
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 4 }} />;
  }

  const pendingTasks = tasks.filter((t) => t.status === 'PENDING');

  return (
    <List
      className={styles.taskList}
      itemLayout="horizontal"
      dataSource={pendingTasks}
      locale={{ emptyText: 'Không có công việc nào' }}
      renderItem={(task) => {
        const deadlineStatus = getDeadlineStatus(task.dueDate);
        const deadlineColor = getDeadlineColor(deadlineStatus);

        return (
          <List.Item
            className={`${styles.taskItem} ${
              deadlineStatus === 'overdue' ? styles.taskOverdue : ''
            }`}
            actions={[
              <Button type="primary" size="small" href={task.link}>
                Xử lý
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <div
                  className={styles.taskIcon}
                  style={{
                    backgroundColor:
                      deadlineStatus === 'overdue' ? '#fff1f0' : '#e6f7ff',
                    color: deadlineStatus === 'overdue' ? '#ff4d4f' : '#1890ff',
                  }}
                >
                  {getTaskIcon(task.type)}
                </div>
              }
              title={
                <div className={styles.taskTitle}>
                  <Text ellipsis={{ tooltip: task.title }} className={styles.taskName}>
                    {task.title}
                  </Text>
                  {getPriorityBadge(task.priority)}
                </div>
              }
              description={
                <div className={styles.taskMeta}>
                  {task.description && (
                    <Text type="secondary" className={styles.taskDesc}>
                      {task.description}
                    </Text>
                  )}
                  {task.dueDate && (
                    <div
                      className={styles.taskDeadline}
                      style={{ color: deadlineColor }}
                    >
                      <ClockCircleOutlined />
                      <span>
                        {deadlineStatus === 'overdue' && 'Quá hạn: '}
                        {deadlineStatus === 'today' && 'Hôm nay: '}
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

// ============ MAIN COMPONENT ============

const HomeForPhongKH: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [summaryCards, setSummaryCards] = useState<HomeSummaryCard[]>([]);
  const [tasks, setTasks] = useState<HomeTaskItem[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [pendingProposals, setPendingProposals] = useState<HomeProjectShort[]>([]);
  const [topIdeas, setTopIdeas] = useState<HomeIdeaShort[]>([]);
  const [delayedProjects, setDelayedProjects] = useState<HomeProjectShort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);

        const [
          summary,
          taskList,
          workflow,
          proposals,
          ideas,
          delayed,
        ] = await Promise.all([
          fetchHomeSummary('PHONG_KH'),
          fetchHomeTasks('PHONG_KH'),
          fetchWorkflowSteps(),
          fetchPendingProposals(),
          fetchHomeIdeas('PHONG_KH'),
          fetchDelayedProjects(),
        ]);

        setSummaryCards(summary);
        setTasks(taskList);
        setWorkflowSteps(workflow);
        setPendingProposals(proposals);
        // Filter top ideas by score
        setTopIdeas(ideas.filter((i) => i.score && i.score >= 7).sort((a, b) => (b.score || 0) - (a.score || 0)));
        setDelayedProjects(delayed);
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Pending Proposals columns - Spec 4.3
  const proposalColumns: ProColumns<HomeProjectShort>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 110,
      render: (_, record) => (
        <a href={`/proposals/${record.id}`}>{record.code}</a>
      ),
    },
    {
      title: 'Tên đề xuất',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'Cấp',
      dataIndex: 'level',
      width: 100,
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
      title: 'Thao tác',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" href={`/proposals/${record.id}/review`}>
          Xét duyệt
        </Button>
      ),
    },
  ];

  // Top Ideas columns - Spec 4.3
  const ideaColumns: ProColumns<HomeIdeaShort>[] = [
    {
      title: 'Tên ý tưởng',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, record) => (
        <a href={`/ideas/${record.id}`}>{record.title}</a>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      render: (status) => {
        const colors: Record<string, string> = {
          Mới: 'default',
          'Đã sơ loại': 'warning',
          'Đề xuất đặt hàng': 'processing',
          'Phê duyệt đặt hàng': 'success',
        };
        return <Tag color={colors[status as string] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Điểm',
      dataIndex: 'score',
      width: 70,
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: (score) =>
        score ? (
          <Tag color="blue" style={{ fontWeight: 600 }}>
            {score}
          </Tag>
        ) : (
          '—'
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 100,
      render: (date) => formatDate(date as string),
    },
  ];

  // Delayed Projects columns - Spec 4.3
  const delayedColumns: ProColumns<HomeProjectShort>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 110,
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
      title: 'Tiến độ',
      dataIndex: 'progress',
      width: 100,
      render: (progress) => (
        <Progress
          percent={progress as number}
          size="small"
          status="exception"
          strokeColor="#ff4d4f"
        />
      ),
    },
    {
      title: 'Hạn',
      dataIndex: 'endDate',
      width: 100,
      render: (date) => (
        <Text type="danger" style={{ fontSize: 12 }}>
          {formatDate(date as string)}
        </Text>
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
                icon={<TeamOutlined />}
                className={styles.avatar}
              />
              <div className={styles.headerText}>
                <Title level={3} className={styles.greeting}>
                  Phòng Khoa học 🔬
                </Title>
                <Space size={8}>
                  <Text className={styles.roleLabel}>Quản lý nghiệp vụ khoa học</Text>
                  <Tag color="purple" icon={<SafetyCertificateOutlined />}>
                    Phòng KH
                  </Tag>
                </Space>
              </div>
            </div>
          )}
        </ProCard>

        {/* KPI Cards - Spec 4.1 */}
        <div className={styles.kpiRow}>
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <KPICard key={i} card={{} as HomeSummaryCard} loading />
              ))
            : summaryCards.map((card, index) => (
                <KPICard key={card.key} card={card} delay={index * 100} />
              ))}
        </div>

        {/* Workflow Panel - Spec 4.2 */}
        <ProCard
          title={
            <Space>
              <ProjectOutlined />
              <span>Quy trình xử lý nghiệp vụ</span>
            </Space>
          }
          bordered
          className={styles.workflowCard}
          extra={
            <Button type="link" href="/workflow">
              Xem chi tiết
            </Button>
          }
        >
          <WorkflowPanel steps={workflowSteps} loading={loading} />
        </ProCard>

        {/* Tables Row 1: Đề xuất mới + Ý tưởng chất lượng cao - Spec 4.3 */}
        <Row gutter={20}>
          <Col xs={24} lg={12}>
            <ProCard
              title={
                <Space>
                  <FileTextOutlined />
                  <span>Đề xuất mới chờ duyệt</span>
                  <Badge
                    count={pendingProposals.length}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                </Space>
              }
              bordered
              className={styles.tableCard}
              extra={
                <Button type="link" href="/proposals">
                  Xem tất cả
                </Button>
              }
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : (
                <ProTable<HomeProjectShort>
                  columns={proposalColumns}
                  dataSource={pendingProposals}
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
                  <BulbOutlined />
                  <span>Ý tưởng chất lượng cao</span>
                  <Badge
                    count={topIdeas.length}
                    style={{ backgroundColor: '#faad14' }}
                  />
                </Space>
              }
              bordered
              className={styles.tableCard}
              extra={
                <Button type="link" href="/ideas">
                  Xem tất cả
                </Button>
              }
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : (
                <ProTable<HomeIdeaShort>
                  columns={ideaColumns}
                  dataSource={topIdeas}
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

        {/* Tables Row 2: Đề tài chậm tiến độ + Công việc chờ duyệt - Spec 4.3 */}
        <Row gutter={20}>
          <Col xs={24} lg={12}>
            <ProCard
              title={
                <Space>
                  <WarningOutlined style={{ color: '#ff4d4f' }} />
                  <span>Đề tài chậm tiến độ</span>
                  <Badge
                    count={delayedProjects.length}
                    style={{ backgroundColor: '#ff4d4f' }}
                  />
                </Space>
              }
              bordered
              className={styles.tableCard}
              extra={
                <Button type="link" href="/projects/delayed">
                  Xem tất cả
                </Button>
              }
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : (
                <ProTable<HomeProjectShort>
                  columns={delayedColumns}
                  dataSource={delayedProjects}
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
                  <ClockCircleOutlined />
                  <span>Công việc chờ duyệt trong tuần</span>
                  <Badge
                    count={tasks.filter((t) => t.status === 'PENDING').length}
                    style={{ backgroundColor: '#722ed1' }}
                  />
                </Space>
              }
              bordered
              className={styles.tableCard}
              extra={
                <Button type="link" href="/tasks">
                  Xem tất cả
                </Button>
              }
            >
              <ApprovalTaskList tasks={tasks} loading={loading} />
            </ProCard>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default HomeForPhongKH;





