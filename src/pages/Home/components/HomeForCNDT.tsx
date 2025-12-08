/**
 * HomeForCNDT - Dashboard cho Giảng viên / Chủ nhiệm đề tài
 * Theo specs/home-enterprise.md - Section 3
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
  FloatButton,
  List,
  Progress,
  Row,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  BellOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FireOutlined,
  PlusOutlined,
  ProjectOutlined,
  UploadOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';
import {
  fetchCurrentUser,
  fetchHomeSummary,
  fetchHomeTasks,
  fetchHomeNotifications,
  fetchHomeProjects,
  fetchHomeIdeas,
  type CurrentUser,
  type HomeSummaryCard,
  type HomeTaskItem,
  type HomeNotification,
  type HomeProjectShort,
  type HomeIdeaShort,
} from '@/services/mock/homeMockService';
import styles from './HomeForCNDT.less';

const { Title, Text, Paragraph } = Typography;

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

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return formatDate(dateString);
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

// Màu deadline theo spec 2.3
const getDeadlineColor = (status: 'overdue' | 'today' | 'normal') => {
  const colors = {
    overdue: '#ff4d4f',  // đỏ
    today: '#faad14',     // vàng
    normal: '#52c41a',    // xanh
  };
  return colors[status];
};

// Icon mapping cho KPI
const getKPIIcon = (iconName?: string) => {
  const icons: Record<string, React.ReactNode> = {
    ProjectOutlined: <ProjectOutlined />,
    BulbOutlined: <BulbOutlined />,
    ClockCircleOutlined: <ClockCircleOutlined />,
    BellOutlined: <BellOutlined />,
    CheckCircleOutlined: <CheckCircleOutlined />,
  };
  return icons[iconName || 'ProjectOutlined'] || <ProjectOutlined />;
};

// Icon mapping cho Task type
const getTaskIcon = (type: HomeTaskItem['type']) => {
  const iconMap: Record<string, React.ReactNode> = {
    NOP_Y_TUONG: <BulbOutlined />,
    NOP_DE_XUAT: <FileTextOutlined />,
    NOP_BAO_CAO_TIEN_DO: <ClockCircleOutlined />,
    NOP_HO_SO_NGHIEM_THU: <CheckCircleOutlined />,
    XEM_XET_DE_XUAT: <ProjectOutlined />,
  };
  return iconMap[type] || <FileTextOutlined />;
};

// ============ COUNTER ANIMATION HOOK ============
// Spec 2.1: Counter animation (số tăng dần 0 → value)

const useCountUp = (end: number, duration: number = 1200) => {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Easing function - ease out cubic
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
// Spec 2.1: Icon 32-40px, Value 38px, Trend %, hover scale 1.02, padding 20, borderRadius 12

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

// ============ TASK LIST COMPONENT ============
// Spec 2.3: Icon riêng, Deadline màu (đỏ/vàng/xanh), Badge ưu tiên, Hover highlight

interface TaskListProps {
  tasks: HomeTaskItem[];
  loading?: boolean;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, loading }) => {
  // Priority badge theo spec
  const getPriorityBadge = (priority: HomeTaskItem['priority']) => {
    const config = {
      HIGH: { color: 'red', text: 'High' },
      MEDIUM: { color: 'orange', text: 'Medium' },
      LOW: { color: 'blue', text: 'Low' },
    };
    const { color, text } = config[priority];
    return <Tag color={color} className={styles.priorityTag}>{text}</Tag>;
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
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
            } ${deadlineStatus === 'today' ? styles.taskToday : ''}`}
            actions={[
              task.link && (
                <Button type="link" href={task.link} size="small">
                  Chi tiết
                </Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={
                <div
                  className={styles.taskIcon}
                  style={{
                    backgroundColor:
                      deadlineStatus === 'overdue'
                        ? '#fff1f0'
                        : deadlineStatus === 'today'
                        ? '#fffbe6'
                        : '#f6ffed',
                    color: deadlineColor,
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

// ============ NOTIFICATION LIST COMPONENT ============
// Spec 2.4: Unread background #f6ffed, type icons, priority 🔥/⚠, relative time

interface NotificationListProps {
  notifications: HomeNotification[];
  loading?: boolean;
}

const NotificationList: React.FC<NotificationListProps> = ({ notifications, loading }) => {
  const getNotificationStyle = (type?: HomeNotification['type']) => {
    const styles: Record<string, { icon: React.ReactNode; color: string }> = {
      INFO: { icon: <BellOutlined />, color: '#1890ff' },
      SUCCESS: { icon: <CheckCircleOutlined />, color: '#52c41a' },
      WARNING: { icon: <WarningOutlined />, color: '#faad14' },
      DEADLINE: { icon: <ExclamationCircleOutlined />, color: '#ff4d4f' },
      ERROR: { icon: <ExclamationCircleOutlined />, color: '#ff4d4f' },
      SYSTEM: { icon: <BellOutlined />, color: '#722ed1' },
    };
    return styles[type || 'INFO'];
  };

  if (loading) {
    return <Skeleton active paragraph={{ rows: 5 }} />;
  }

  return (
    <List
      className={styles.notificationList}
      itemLayout="horizontal"
      dataSource={notifications}
      locale={{ emptyText: 'Không có thông báo nào' }}
      renderItem={(noti) => {
        const config = getNotificationStyle(noti.type);

        return (
          <List.Item
            className={`${styles.notificationItem} ${!noti.read ? styles.unread : ''}`}
            actions={[
              noti.link && (
                <Button type="link" href={noti.link} size="small">
                  Xem
                </Button>
              ),
            ]}
          >
            <List.Item.Meta
              avatar={
                <Badge dot={!noti.read} offset={[-4, 4]}>
                  <Avatar
                    size={40}
                    style={{ backgroundColor: config.color }}
                    icon={config.icon}
                  />
                </Badge>
              }
              title={
                <div className={styles.notiTitle}>
                  {noti.priority === 'URGENT' && (
                    <FireOutlined className={styles.urgentIcon} />
                  )}
                  <Text strong={!noti.read} ellipsis={{ tooltip: noti.title }}>
                    {noti.title}
                  </Text>
                </div>
              }
              description={
                <div className={styles.notiMeta}>
                  <Paragraph
                    ellipsis={{ rows: 2 }}
                    className={styles.notiContent}
                  >
                    {noti.content}
                  </Paragraph>
                  <Text type="secondary" className={styles.notiTime}>
                    {formatRelativeTime(noti.createdAt)}
                  </Text>
                </div>
              }
            />
          </List.Item>
        );
      }}
    />
  );
};

// ============ QUICK ACTIONS COMPONENT ============
// Spec 3.2: FloatButton.Group - Nộp ý tưởng, Tạo đề xuất, Upload minh chứng

const QuickActions: React.FC = () => {
  return (
    <FloatButton.Group
      trigger="hover"
      type="primary"
      style={{ right: 24, bottom: 24 }}
      icon={<PlusOutlined />}
      tooltip="Hành động nhanh"
    >
      <Tooltip title="Nộp ý tưởng mới" placement="left">
        <FloatButton
          icon={<BulbOutlined />}
          onClick={() => (window.location.href = '/ideas/new')}
        />
      </Tooltip>
      <Tooltip title="Tạo đề xuất đề tài mới" placement="left">
        <FloatButton
          icon={<FileAddOutlined />}
          onClick={() => (window.location.href = '/projects/proposals/new')}
        />
      </Tooltip>
      <Tooltip title="Upload minh chứng nghiệm thu" placement="left">
        <FloatButton
          icon={<UploadOutlined />}
          onClick={() => (window.location.href = '/projects/evidence')}
        />
      </Tooltip>
    </FloatButton.Group>
  );
};

// ============ MAIN COMPONENT ============

const HomeForCNDT: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [summaryCards, setSummaryCards] = useState<HomeSummaryCard[]>([]);
  const [tasks, setTasks] = useState<HomeTaskItem[]>([]);
  const [notifications, setNotifications] = useState<HomeNotification[]>([]);
  const [projects, setProjects] = useState<HomeProjectShort[]>([]);
  const [ideas, setIdeas] = useState<HomeIdeaShort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);

        const [summary, taskList, notiList, projectList, ideaList] = await Promise.all([
          fetchHomeSummary('CNDT'),
          fetchHomeTasks('CNDT'),
          fetchHomeNotifications('CNDT'),
          fetchHomeProjects('CNDT'),
          fetchHomeIdeas('CNDT'),
        ]);

        setSummaryCards(summary);
        setTasks(taskList);
        setNotifications(notiList);
        setProjects(projectList);
        setIdeas(ideaList);
      } catch (error) {
        console.error('Error loading home data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Project table columns - Spec 2.5
  const projectColumns: ProColumns<HomeProjectShort>[] = [
    {
      title: 'Mã đề tài',
      dataIndex: 'code',
      width: 120,
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
      width: 100,
      filters: [
        { text: 'Cấp Trường', value: 'Cấp Trường' },
        { text: 'Cấp Bộ', value: 'Cấp Bộ' },
        { text: 'Cấp Nhà nước', value: 'Cấp Nhà nước' },
      ],
      onFilter: (value, record) => record.level === value,
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
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      filters: [
        { text: 'Đang thực hiện', value: 'Đang thực hiện' },
        { text: 'Chờ nghiệm thu', value: 'Chờ nghiệm thu' },
        { text: 'Đã nghiệm thu', value: 'Đã nghiệm thu' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const colors: Record<string, string> = {
          'Đang thực hiện': 'processing',
          'Chờ nghiệm thu': 'warning',
          'Đã nghiệm thu': 'success',
        };
        return <Tag color={colors[status as string] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 110,
      render: (role) => (
        <Tag color={role === 'CHU_NHIEM' ? 'volcano' : 'cyan'}>
          {role === 'CHU_NHIEM' ? 'Chủ nhiệm' : 'Thành viên'}
        </Tag>
      ),
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      width: 120,
      sorter: (a, b) => (a.progress || 0) - (b.progress || 0),
      render: (progress) => (
        <Progress
          percent={progress as number}
          size="small"
          status={(progress as number) === 100 ? 'success' : 'active'}
        />
      ),
    },
  ];

  // Idea table columns - Spec 2.5
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
      width: 150,
      filters: [
        { text: 'Mới', value: 'Mới' },
        { text: 'Đã sơ loại', value: 'Đã sơ loại' },
        { text: 'Đề xuất đặt hàng', value: 'Đề xuất đặt hàng' },
        { text: 'Phê duyệt đặt hàng', value: 'Phê duyệt đặt hàng' },
      ],
      onFilter: (value, record) => record.status === value,
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
      width: 80,
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: (score) =>
        score ? (
          <Text strong style={{ color: '#1890ff' }}>
            {score}
          </Text>
        ) : (
          '—'
        ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 110,
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date) => formatDate(date as string),
    },
  ];

  return (
    <PageContainer
      ghost
      header={{ title: '' }}
      loading={loading && !currentUser}
    >
      <div className={styles.container}>
        {/* Header chào mừng */}
        <ProCard className={styles.headerCard} bordered={false}>
          {loading ? (
            <Skeleton active avatar paragraph={{ rows: 1 }} />
          ) : (
            <div className={styles.headerContent}>
              <Avatar
                size={60}
                icon={<UserOutlined />}
                className={styles.avatar}
              />
              <div className={styles.headerText}>
                <Title level={3} className={styles.greeting}>
                  Xin chào, {currentUser?.name}! 👋
                </Title>
                <Space size={8}>
                  <Text className={styles.roleLabel}>Vai trò hiện tại:</Text>
                  <Tag color="blue" icon={<UserOutlined />} className={styles.roleTag}>
                    Chủ nhiệm đề tài
                  </Tag>
                </Space>
              </div>
            </div>
          )}
        </ProCard>

        {/* 4 KPI Cards - Spec 2.1 */}
        <div className={styles.kpiRow}>
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <KPICard key={i} card={{} as HomeSummaryCard} loading />
              ))
            : summaryCards.map((card, index) => (
                <KPICard key={card.key} card={card} delay={index * 100} />
              ))}
        </div>

        {/* Task List + Notifications - Spec 2.3, 2.4 */}
        <Row gutter={20}>
          <Col xs={24} lg={12}>
            <ProCard
              title={
                <Space>
                  <ClockCircleOutlined />
                  <span>Công việc cần làm</span>
                  <Badge
                    count={tasks.filter((t) => t.status === 'PENDING').length}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                </Space>
              }
              bordered
              className={styles.listCard}
              extra={
                <Button type="link" href="/tasks">
                  Xem tất cả
                </Button>
              }
            >
              <TaskList tasks={tasks} loading={loading} />
            </ProCard>
          </Col>
          <Col xs={24} lg={12}>
            <ProCard
              title={
                <Space>
                  <BellOutlined />
                  <span>Thông báo</span>
                  <Badge
                    count={notifications.filter((n) => !n.read).length}
                    style={{ backgroundColor: '#ff4d4f' }}
                  />
                </Space>
              }
              bordered
              className={styles.listCard}
              extra={
                <Button type="link" href="/notifications">
                  Xem tất cả
                </Button>
              }
            >
              <NotificationList notifications={notifications} loading={loading} />
            </ProCard>
          </Col>
        </Row>

        {/* Tabs Đề tài / Ý tưởng - Spec 2.5 */}
        <ProCard
          title={
            <Space>
              <ProjectOutlined />
              <span>Danh sách của tôi</span>
            </Space>
          }
          bordered
          className={styles.tabsCard}
        >
          <Tabs
            defaultActiveKey="projects"
            size="large"
            items={[
              {
                key: 'projects',
                label: (
                  <Space>
                    <ProjectOutlined />
                    Đề tài của tôi
                    <Badge
                      count={projects.length}
                      style={{ backgroundColor: '#1890ff' }}
                    />
                  </Space>
                ),
                children: (
                  <ProTable<HomeProjectShort>
                    columns={projectColumns}
                    dataSource={projects}
                    rowKey="id"
                    search={false}
                    options={{
                      density: true,
                      fullScreen: true,
                      reload: false,
                      setting: true,
                    }}
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} trên tổng ${total} mục`,
                    }}
                  />
                ),
              },
              {
                key: 'ideas',
                label: (
                  <Space>
                    <BulbOutlined />
                    Ý tưởng của tôi
                    <Badge
                      count={ideas.length}
                      style={{ backgroundColor: '#faad14' }}
                    />
                  </Space>
                ),
                children: (
                  <ProTable<HomeIdeaShort>
                    columns={ideaColumns}
                    dataSource={ideas}
                    rowKey="id"
                    search={false}
                    options={{
                      density: true,
                      fullScreen: true,
                      reload: false,
                      setting: true,
                    }}
                    pagination={{
                      pageSize: 5,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} trên tổng ${total} mục`,
                    }}
                  />
                ),
              },
            ]}
          />
        </ProCard>

        {/* Quick Actions - Spec 3.2 */}
        <QuickActions />
      </div>
    </PageContainer>
  );
};

export default HomeForCNDT;

