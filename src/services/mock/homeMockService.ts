// homeMockService.ts - Enterprise Home Mock API

// Loại người dùng hiện tại
export type UserRole =
  | 'NCV'          // Nhà khoa học / Giảng viên
  | 'CNDT'         // Chủ nhiệm đề tài
  | 'TRUONG_DON_VI'
  | 'PHONG_KH'     // Phòng Khoa học
  | 'HOI_DONG'
  | 'LANH_DAO'     // Lãnh đạo
  | 'ADMIN';       // Quản trị viên

// KPI Card Interface
export interface HomeSummaryCard {
  key: string;
  title: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendPercent?: number; // +12% hoặc -5%
  diffText?: string;
  icon?: string; // icon name
  color?: string; // màu chủ đạo
}

// Task với priority
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface HomeTaskItem {
  id: string;
  type:
    | 'NOP_Y_TUONG'
    | 'NOP_DE_XUAT'
    | 'NOP_BAO_CAO_TIEN_DO'
    | 'NOP_HO_SO_NGHIEM_THU'
    | 'XEM_XET_DE_XUAT'
    | 'SO_LOAI_Y_TUONG'
    | 'PHAN_CONG_PHAN_BIEN'
    | 'PHE_DUYET_DAT_HANG'
    | 'DUYET_DE_XUAT'
    | 'PHAN_HOI_DONG';
  title: string;
  description?: string;
  relatedModule: 'IDEA' | 'PROJECT' | 'CV' | 'FINANCE';
  dueDate?: string;
  status: 'PENDING' | 'DONE';
  priority: TaskPriority;
  link?: string;
}

// Notification với priority
export type NotificationPriority = 'URGENT' | 'NORMAL';

export interface HomeNotification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
  type?: 'INFO' | 'WARNING' | 'DEADLINE' | 'SYSTEM' | 'SUCCESS' | 'ERROR';
  priority?: NotificationPriority;
  link?: string;
}

export interface HomeProjectShort {
  id: string;
  code: string;
  title: string;
  level: string;
  status: string;
  role: 'CHU_NHIEM' | 'THANH_VIEN';
  startDate?: string;
  endDate?: string;
  progress?: number; // phần trăm tiến độ
}

export interface HomeIdeaShort {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  score?: number; // điểm đánh giá
}

// Workflow step cho PhongKH
export interface WorkflowStep {
  key: string;
  title: string;
  description: string;
  count: number; // số lượng cần xử lý
  status: 'wait' | 'process' | 'finish';
  link?: string;
}

// Chart data cho LanhDao
export interface ChartDataItem {
  year?: string;
  month?: string;
  name?: string;
  value: number;
  type?: string;
}

export interface HomeCharts {
  projectsByYear: ChartDataItem[];
  projectsByLevel: ChartDataItem[];
  growthTrend: ChartDataItem[];
}

// Top items cho LanhDao
export interface TopProjectItem {
  id: string;
  code: string;
  title: string;
  level: string;
  budget: number;
  progress: number;
}

export interface TopResearcherItem {
  id: string;
  name: string;
  department: string;
  projectCount: number;
  ideaCount: number;
}

export interface WarningItem {
  id: string;
  title: string;
  type: 'DELAY' | 'BUDGET' | 'DEADLINE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  link?: string;
}

// Current User
export interface CurrentUser {
  name: string;
  role: UserRole;
  roleLabel: string;
  avatar?: string;
}

// ============ MOCK API FUNCTIONS ============

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchCurrentUser(): Promise<CurrentUser> {
  await delay(300);
  // Thay đổi role để test menu: NCV, CNDT, PHONG_KH, LANH_DAO, ADMIN
  return {
    name: 'Admin',
    role: 'ADMIN',
    roleLabel: 'Quản trị viên',
  };
}

export async function fetchHomeSummary(role: UserRole): Promise<HomeSummaryCard[]> {
  await delay(400);

  if (role === 'PHONG_KH') {
    return [
      {
        key: 'proposals_pending',
        title: 'Đề xuất mới chờ xử lý',
        value: 12,
        trend: 'up',
        trendPercent: 25,
        icon: 'FileTextOutlined',
        color: '#1890ff',
      },
      {
        key: 'ideas_pending',
        title: 'Ý tưởng mới chờ sơ loại',
        value: 8,
        trend: 'up',
        trendPercent: 15,
        icon: 'BulbOutlined',
        color: '#faad14',
      },
      {
        key: 'projects_managing',
        title: 'Đề tài đang quản lý',
        value: 45,
        trend: 'flat',
        icon: 'ProjectOutlined',
        color: '#52c41a',
      },
      {
        key: 'registration_open',
        title: 'Đợt đăng ký đang mở',
        value: 2,
        trend: 'up',
        trendPercent: 100,
        icon: 'CalendarOutlined',
        color: '#722ed1',
      },
    ];
  }

  if (role === 'LANH_DAO') {
    return [
      {
        key: 'total_projects_year',
        title: 'Tổng đề tài trong năm',
        value: 128,
        trend: 'up',
        trendPercent: 18,
        icon: 'ProjectOutlined',
        color: '#1890ff',
      },
      {
        key: 'budget_disbursed',
        title: 'Kinh phí giải ngân',
        value: 12.5,
        unit: 'tỷ đồng',
        trend: 'up',
        trendPercent: 22,
        icon: 'DollarOutlined',
        color: '#52c41a',
      },
      {
        key: 'acceptance_rate',
        title: 'Tỷ lệ nghiệm thu',
        value: 85,
        unit: '%',
        trend: 'up',
        trendPercent: 5,
        icon: 'CheckCircleOutlined',
        color: '#722ed1',
      },
      {
        key: 'idea_conversion',
        title: 'Ý tưởng → Đề tài',
        value: 32,
        unit: '%',
        trend: 'down',
        trendPercent: -3,
        icon: 'RiseOutlined',
        color: '#faad14',
      },
    ];
  }

  // Default: CNDT / NCV
  return [
    {
      key: 'projects_in_progress',
      title: 'Đề tài đang thực hiện',
      value: 3,
      trend: 'up',
      trendPercent: 50,
      icon: 'ProjectOutlined',
      color: '#1890ff',
    },
    {
      key: 'projects_pending_acceptance',
      title: 'Chờ nghiệm thu',
      value: 1,
      trend: 'flat',
      icon: 'ClockCircleOutlined',
      color: '#52c41a',
    },
    {
      key: 'ideas_submitted',
      title: 'Ý tưởng đã nộp',
      value: 5,
      trend: 'up',
      trendPercent: 25,
      icon: 'BulbOutlined',
      color: '#faad14',
    },
    {
      key: 'notifications_unread',
      title: 'Thông báo chưa đọc',
      value: 4,
      trend: 'down',
      trendPercent: -20,
      icon: 'BellOutlined',
      color: '#ff4d4f',
    },
  ];
}

export async function fetchHomeTasks(role: UserRole): Promise<HomeTaskItem[]> {
  await delay(350);

  if (role === 'PHONG_KH') {
    return [
      {
        id: 'task1',
        type: 'SO_LOAI_Y_TUONG',
        title: 'Sơ loại 5 ý tưởng mới từ Khoa CNTT',
        description: 'Đợt 1 năm 2025',
        relatedModule: 'IDEA',
        dueDate: '2025-12-10T00:00:00Z',
        status: 'PENDING',
        priority: 'HIGH',
        link: '/ideas/review',
      },
      {
        id: 'task2',
        type: 'PHAN_HOI_DONG',
        title: 'Phân hội đồng 2A cho 3 đề xuất',
        relatedModule: 'PROJECT',
        dueDate: '2025-12-08T00:00:00Z',
        status: 'PENDING',
        priority: 'HIGH',
        link: '/projects/council',
      },
      {
        id: 'task3',
        type: 'DUYET_DE_XUAT',
        title: 'Duyệt đề xuất đề tài cấp Bộ',
        description: 'Từ PGS. Trần Văn B',
        relatedModule: 'PROJECT',
        dueDate: '2025-12-15T00:00:00Z',
        status: 'PENDING',
        priority: 'MEDIUM',
        link: '/projects/proposals/review',
      },
      {
        id: 'task4',
        type: 'XEM_XET_DE_XUAT',
        title: 'Xem xét báo cáo tiến độ Q4',
        relatedModule: 'PROJECT',
        status: 'PENDING',
        priority: 'LOW',
        link: '/projects/progress',
      },
    ];
  }

  if (role === 'LANH_DAO') {
    return [
      {
        id: 'task1',
        type: 'PHE_DUYET_DAT_HANG',
        title: 'Phê duyệt đặt hàng 3 ý tưởng chiến lược',
        relatedModule: 'IDEA',
        dueDate: '2025-12-08T00:00:00Z',
        status: 'PENDING',
        priority: 'HIGH',
        link: '/ideas/approve',
      },
      {
        id: 'task2',
        type: 'XEM_XET_DE_XUAT',
        title: 'Xem xét báo cáo tổng kết năm 2025',
        relatedModule: 'PROJECT',
        dueDate: '2025-12-20T00:00:00Z',
        status: 'PENDING',
        priority: 'HIGH',
        link: '/reports/annual',
      },
      {
        id: 'task3',
        type: 'DUYET_DE_XUAT',
        title: 'Duyệt kinh phí đề tài trọng điểm',
        description: 'Tổng: 2.5 tỷ đồng',
        relatedModule: 'FINANCE',
        status: 'PENDING',
        priority: 'MEDIUM',
        link: '/finance/approve',
      },
    ];
  }

  // CNDT
  return [
    {
      id: 'task1',
      type: 'NOP_BAO_CAO_TIEN_DO',
      title: 'Nộp báo cáo tiến độ đề tài ABC',
      description: 'Đợt 2 năm 2025, hạn nộp 31/12/2025.',
      relatedModule: 'PROJECT',
      dueDate: '2025-12-07T00:00:00Z', // Hôm nay
      status: 'PENDING',
      priority: 'HIGH',
      link: '/projects/abc/progress',
    },
    {
      id: 'task2',
      type: 'NOP_Y_TUONG',
      title: 'Hoàn thiện ý tưởng quản lý phòng thí nghiệm',
      relatedModule: 'IDEA',
      dueDate: '2025-12-05T00:00:00Z', // Quá hạn
      status: 'PENDING',
      priority: 'HIGH',
      link: '/ideas/new',
    },
    {
      id: 'task3',
      type: 'NOP_HO_SO_NGHIEM_THU',
      title: 'Nộp hồ sơ nghiệm thu đề tài XYZ',
      description: 'Chuẩn bị đầy đủ hồ sơ theo mẫu.',
      relatedModule: 'PROJECT',
      dueDate: '2025-12-20T00:00:00Z',
      status: 'PENDING',
      priority: 'MEDIUM',
      link: '/projects/xyz/acceptance',
    },
    {
      id: 'task4',
      type: 'NOP_DE_XUAT',
      title: 'Bổ sung thuyết minh đề xuất mới',
      relatedModule: 'PROJECT',
      dueDate: '2025-12-25T00:00:00Z',
      status: 'PENDING',
      priority: 'LOW',
      link: '/projects/proposals/edit',
    },
    {
      id: 'task5',
      type: 'XEM_XET_DE_XUAT',
      title: 'Xem xét đề xuất từ nhóm nghiên cứu',
      relatedModule: 'PROJECT',
      status: 'DONE',
      priority: 'MEDIUM',
      link: '/projects/proposals',
    },
  ];
}

export async function fetchHomeNotifications(role: UserRole): Promise<HomeNotification[]> {
  await delay(300);

  const baseNotifications: HomeNotification[] = [
    {
      id: 'noti1',
      title: 'Nhắc nộp báo cáo tiến độ đề tài ABC',
      content: 'Hạn nộp: 31/12/2025. Vui lòng hoàn tất trên hệ thống.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 giờ trước
      read: false,
      type: 'DEADLINE',
      priority: 'URGENT',
      link: '/projects/abc/progress',
    },
    {
      id: 'noti2',
      title: 'Kết quả sơ tuyển đề tài XYZ',
      content: 'Đề tài XYZ đã được chấp thuận về mặt chủ trương.',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // hôm qua
      read: true,
      type: 'SUCCESS',
      priority: 'NORMAL',
      link: '/projects/xyz',
    },
    {
      id: 'noti3',
      title: 'Cảnh báo hạn chót',
      content: 'Còn 7 ngày để hoàn thành báo cáo tiến độ.',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 giờ trước
      read: false,
      type: 'WARNING',
      priority: 'URGENT',
      link: '/projects/abc/progress',
    },
    {
      id: 'noti4',
      title: 'Thông báo hệ thống',
      content: 'Hệ thống sẽ bảo trì vào ngày 15/12/2025 từ 22:00-24:00.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 ngày trước
      read: false,
      type: 'SYSTEM',
      priority: 'NORMAL',
    },
    {
      id: 'noti5',
      title: 'Ý tưởng được phê duyệt',
      content: 'Ý tưởng "Ngân hàng ý tưởng số" đã được phê duyệt đặt hàng.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 ngày trước
      read: true,
      type: 'SUCCESS',
      priority: 'NORMAL',
      link: '/ideas/i1',
    },
  ];

  return baseNotifications;
}

export async function fetchHomeProjects(role: UserRole): Promise<HomeProjectShort[]> {
  await delay(400);
  return [
    {
      id: 'p1',
      code: 'CS-2025-01',
      title: 'Xây dựng hệ thống quản lý khoa học cho trường',
      level: 'Cấp Trường',
      status: 'Đang thực hiện',
      role: 'CHU_NHIEM',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2026-12-31T00:00:00Z',
      progress: 45,
    },
    {
      id: 'p2',
      code: 'CS-2024-05',
      title: 'Nghiên cứu ứng dụng AI trong giáo dục',
      level: 'Cấp Bộ',
      status: 'Đã nghiệm thu',
      role: 'THANH_VIEN',
      startDate: '2024-03-01T00:00:00Z',
      endDate: '2025-03-01T00:00:00Z',
      progress: 100,
    },
    {
      id: 'p3',
      code: 'CS-2025-08',
      title: 'Phát triển nền tảng học trực tuyến',
      level: 'Cấp Trường',
      status: 'Chờ nghiệm thu',
      role: 'THANH_VIEN',
      startDate: '2025-02-01T00:00:00Z',
      endDate: '2025-12-31T00:00:00Z',
      progress: 90,
    },
    {
      id: 'p4',
      code: 'CS-2025-12',
      title: 'Nghiên cứu Blockchain trong chứng chỉ số',
      level: 'Cấp Nhà nước',
      status: 'Đang thực hiện',
      role: 'CHU_NHIEM',
      startDate: '2025-06-01T00:00:00Z',
      endDate: '2027-06-01T00:00:00Z',
      progress: 25,
    },
  ];
}

export async function fetchHomeIdeas(role: UserRole): Promise<HomeIdeaShort[]> {
  await delay(350);
  return [
    {
      id: 'i1',
      title: 'Ngân hàng ý tưởng số dùng cho quản lý đề tài',
      status: 'Đề xuất đặt hàng',
      createdAt: '2025-10-15T00:00:00Z',
      score: 8.5,
    },
    {
      id: 'i2',
      title: 'Ứng dụng blockchain trong quản lý chứng chỉ',
      status: 'Phê duyệt đặt hàng',
      createdAt: '2025-09-20T00:00:00Z',
      score: 9.2,
    },
    {
      id: 'i3',
      title: 'Hệ thống IoT giám sát phòng thí nghiệm',
      status: 'Đã sơ loại',
      createdAt: '2025-08-10T00:00:00Z',
      score: 7.0,
    },
    {
      id: 'i4',
      title: 'Chatbot hỗ trợ sinh viên',
      status: 'Mới',
      createdAt: '2025-11-25T00:00:00Z',
    },
    {
      id: 'i5',
      title: 'Hệ thống quản lý tài sản số',
      status: 'Mới',
      createdAt: '2025-12-01T00:00:00Z',
    },
  ];
}

// ============ PHONG_KH specific ============

export async function fetchWorkflowSteps(): Promise<WorkflowStep[]> {
  await delay(300);
  return [
    {
      key: 'idea_review',
      title: 'Sơ loại ý tưởng',
      description: 'Xem xét và sơ loại ý tưởng mới',
      count: 8,
      status: 'process',
      link: '/workflow/ideas',
    },
    {
      key: 'council_2a',
      title: 'Phân hội đồng 2A',
      description: 'Phân công hội đồng xét duyệt',
      count: 3,
      status: 'wait',
      link: '/workflow/council-2a',
    },
    {
      key: 'scoring_2b',
      title: 'Chấm điểm 2B',
      description: 'Hội đồng chấm điểm đề xuất',
      count: 5,
      status: 'wait',
      link: '/workflow/scoring',
    },
    {
      key: 'tracking_gd3',
      title: 'Theo dõi GĐ3',
      description: 'Theo dõi tiến độ thực hiện',
      count: 15,
      status: 'finish',
      link: '/workflow/tracking',
    },
    {
      key: 'acceptance_gd4',
      title: 'Nghiệm thu GĐ4',
      description: 'Nghiệm thu và đánh giá',
      count: 4,
      status: 'wait',
      link: '/workflow/acceptance',
    },
  ];
}

export async function fetchPendingProposals(): Promise<HomeProjectShort[]> {
  await delay(300);
  return [
    {
      id: 'prop1',
      code: 'DX-2025-15',
      title: 'Nghiên cứu AI trong y tế',
      level: 'Cấp Bộ',
      status: 'Chờ duyệt',
      role: 'CHU_NHIEM',
      progress: 0,
    },
    {
      id: 'prop2',
      code: 'DX-2025-16',
      title: 'Ứng dụng Big Data trong giáo dục',
      level: 'Cấp Trường',
      status: 'Chờ duyệt',
      role: 'CHU_NHIEM',
      progress: 0,
    },
    {
      id: 'prop3',
      code: 'DX-2025-17',
      title: 'Hệ thống Smart Campus',
      level: 'Cấp Trường',
      status: 'Chờ duyệt',
      role: 'CHU_NHIEM',
      progress: 0,
    },
  ];
}

export async function fetchDelayedProjects(): Promise<HomeProjectShort[]> {
  await delay(300);
  return [
    {
      id: 'delay1',
      code: 'CS-2024-08',
      title: 'Nghiên cứu năng lượng tái tạo',
      level: 'Cấp Bộ',
      status: 'Chậm tiến độ',
      role: 'CHU_NHIEM',
      progress: 35,
      endDate: '2025-06-30T00:00:00Z',
    },
    {
      id: 'delay2',
      code: 'CS-2024-12',
      title: 'Phát triển vật liệu mới',
      level: 'Cấp Nhà nước',
      status: 'Chậm tiến độ',
      role: 'CHU_NHIEM',
      progress: 50,
      endDate: '2025-09-30T00:00:00Z',
    },
  ];
}

// ============ LANH_DAO specific ============

export async function fetchHomeCharts(): Promise<HomeCharts> {
  await delay(500);
  return {
    projectsByYear: [
      { year: '2021', value: 85 },
      { year: '2022', value: 95 },
      { year: '2023', value: 108 },
      { year: '2024', value: 118 },
      { year: '2025', value: 128 },
    ],
    projectsByLevel: [
      { name: 'Cấp Trường', value: 75 },
      { name: 'Cấp Bộ', value: 38 },
      { name: 'Cấp Nhà nước', value: 15 },
    ],
    growthTrend: [
      { month: 'T1', value: 10, type: 'Đề tài mới' },
      { month: 'T2', value: 12, type: 'Đề tài mới' },
      { month: 'T3', value: 8, type: 'Đề tài mới' },
      { month: 'T4', value: 15, type: 'Đề tài mới' },
      { month: 'T5', value: 11, type: 'Đề tài mới' },
      { month: 'T6', value: 14, type: 'Đề tài mới' },
      { month: 'T7', value: 9, type: 'Đề tài mới' },
      { month: 'T8', value: 13, type: 'Đề tài mới' },
      { month: 'T9', value: 16, type: 'Đề tài mới' },
      { month: 'T10', value: 12, type: 'Đề tài mới' },
      { month: 'T11', value: 18, type: 'Đề tài mới' },
      { month: 'T12', value: 20, type: 'Đề tài mới' },
      { month: 'T1', value: 5, type: 'Nghiệm thu' },
      { month: 'T2', value: 7, type: 'Nghiệm thu' },
      { month: 'T3', value: 6, type: 'Nghiệm thu' },
      { month: 'T4', value: 8, type: 'Nghiệm thu' },
      { month: 'T5', value: 9, type: 'Nghiệm thu' },
      { month: 'T6', value: 10, type: 'Nghiệm thu' },
      { month: 'T7', value: 7, type: 'Nghiệm thu' },
      { month: 'T8', value: 8, type: 'Nghiệm thu' },
      { month: 'T9', value: 11, type: 'Nghiệm thu' },
      { month: 'T10', value: 9, type: 'Nghiệm thu' },
      { month: 'T11', value: 12, type: 'Nghiệm thu' },
      { month: 'T12', value: 15, type: 'Nghiệm thu' },
    ],
  };
}

export async function fetchTopProjects(): Promise<TopProjectItem[]> {
  await delay(300);
  return [
    {
      id: 't1',
      code: 'CS-2025-01',
      title: 'Hệ thống quản lý khoa học thông minh',
      level: 'Cấp Bộ',
      budget: 2500000000,
      progress: 65,
    },
    {
      id: 't2',
      code: 'CS-2025-02',
      title: 'Nghiên cứu AI trong chẩn đoán y tế',
      level: 'Cấp Nhà nước',
      budget: 5000000000,
      progress: 40,
    },
    {
      id: 't3',
      code: 'CS-2025-03',
      title: 'Phát triển vật liệu nano',
      level: 'Cấp Bộ',
      budget: 3000000000,
      progress: 55,
    },
    {
      id: 't4',
      code: 'CS-2025-04',
      title: 'Blockchain trong giáo dục',
      level: 'Cấp Trường',
      budget: 800000000,
      progress: 80,
    },
    {
      id: 't5',
      code: 'CS-2025-05',
      title: 'IoT cho nông nghiệp thông minh',
      level: 'Cấp Bộ',
      budget: 1500000000,
      progress: 30,
    },
  ];
}

export async function fetchTopResearchers(): Promise<TopResearcherItem[]> {
  await delay(300);
  return [
    {
      id: 'r1',
      name: 'PGS.TS. Nguyễn Văn A',
      department: 'Khoa CNTT',
      projectCount: 5,
      ideaCount: 8,
    },
    {
      id: 'r2',
      name: 'TS. Trần Thị B',
      department: 'Khoa Điện tử',
      projectCount: 4,
      ideaCount: 6,
    },
    {
      id: 'r3',
      name: 'PGS.TS. Lê Văn C',
      department: 'Khoa Cơ khí',
      projectCount: 4,
      ideaCount: 5,
    },
    {
      id: 'r4',
      name: 'TS. Phạm Thị D',
      department: 'Khoa Kinh tế',
      projectCount: 3,
      ideaCount: 7,
    },
    {
      id: 'r5',
      name: 'GS.TS. Hoàng Văn E',
      department: 'Khoa Vật lý',
      projectCount: 3,
      ideaCount: 4,
    },
  ];
}

export async function fetchWarnings(): Promise<WarningItem[]> {
  await delay(300);
  return [
    {
      id: 'w1',
      title: 'Đề tài CS-2024-08 chậm tiến độ nghiêm trọng',
      type: 'DELAY',
      severity: 'HIGH',
      description: 'Tiến độ chỉ đạt 35% so với kế hoạch 70%',
      link: '/projects/CS-2024-08',
    },
    {
      id: 'w2',
      title: 'Kinh phí Q4 chưa giải ngân',
      type: 'BUDGET',
      severity: 'MEDIUM',
      description: '3 đề tài chưa hoàn thành thủ tục giải ngân Q4',
      link: '/finance/pending',
    },
    {
      id: 'w3',
      title: 'Deadline nghiệm thu cuối năm',
      type: 'DEADLINE',
      severity: 'HIGH',
      description: '5 đề tài cần nghiệm thu trước 31/12/2025',
      link: '/projects/acceptance',
    },
    {
      id: 'w4',
      title: 'Số lượng ý tưởng mới giảm',
      type: 'DELAY',
      severity: 'LOW',
      description: 'Giảm 15% so với cùng kỳ năm trước',
      link: '/ideas/statistics',
    },
  ];
}
