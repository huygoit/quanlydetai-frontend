// homeMockService.ts

// Loại người dùng hiện tại (để điều chỉnh nội dung dashboard)
export type UserRole =
  | 'NCV'          // Nhà khoa học / Giảng viên
  | 'CNDT'         // Chủ nhiệm đề tài
  | 'TRUONG_DON_VI'
  | 'PHONG_KH'
  | 'HOI_DONG'
  | 'LANH_DAO';

export interface HomeSummaryCard {
  key: string;
  title: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  diffText?: string; // ví dụ: "↑ +2 so với năm trước"
}

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
    | 'PHE_DUYET_DAT_HANG';
  title: string;
  description?: string;
  relatedModule: 'IDEA' | 'PROJECT' | 'CV' | 'FINANCE';
  dueDate?: string; // ISO
  status: 'PENDING' | 'DONE';
  link?: string; // đường dẫn đến màn hình chi tiết
}

export interface HomeNotification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
  type?: 'INFO' | 'WARNING' | 'DEADLINE' | 'SYSTEM';
  link?: string;
}

export interface HomeProjectShort {
  id: string;
  code: string;
  title: string;
  level: string; // Cấp Trường / Bộ / Nhà nước...
  status: string; // Đang thực hiện / Đã nghiệm thu / Đề xuất / ...
  role: 'CHU_NHIEM' | 'THANH_VIEN';
  startDate?: string;
  endDate?: string;
}

export interface HomeIdeaShort {
  id: string;
  title: string;
  status: string;   // Mới / Đã sơ loại / Đề xuất đặt hàng / Phê duyệt đặt hàng
  createdAt: string;
}

// Mock current user info
export interface CurrentUser {
  name: string;
  role: UserRole;
  roleLabel: string;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return Promise.resolve({
    name: 'Nguyễn Văn A',
    role: 'CNDT',
    roleLabel: 'Chủ nhiệm đề tài',
  });
}

export async function fetchHomeSummary(role: UserRole): Promise<HomeSummaryCard[]> {
  // Tùy role trả mock khác nhau, hiện tại có thể hard-code:
  return Promise.resolve([
    {
      key: 'projects_in_progress',
      title: 'Đề tài đang thực hiện',
      value: 3,
      diffText: '+1 so với năm trước',
      trend: 'up',
    },
    {
      key: 'projects_pending_acceptance',
      title: 'Chờ nghiệm thu',
      value: 1,
      trend: 'flat',
    },
    {
      key: 'ideas_submitted',
      title: 'Ý tưởng đã nộp',
      value: 5,
      diffText: '+2 so với năm trước',
      trend: 'up',
    },
    {
      key: 'notifications_unread',
      title: 'Thông báo chưa đọc',
      value: 4,
      diffText: '-3 so với tuần trước',
      trend: 'down',
    },
  ]);
}

export async function fetchHomeTasks(role: UserRole): Promise<HomeTaskItem[]> {
  return Promise.resolve([
    {
      id: 'task1',
      type: 'NOP_BAO_CAO_TIEN_DO',
      title: 'Nộp báo cáo tiến độ đề tài ABC',
      description: 'Đợt 2 năm 2025, hạn nộp 31/12/2025.',
      relatedModule: 'PROJECT',
      dueDate: '2025-12-31T00:00:00Z',
      status: 'PENDING',
      link: '/projects/abc/progress',
    },
    {
      id: 'task2',
      type: 'NOP_Y_TUONG',
      title: 'Hoàn thiện ý tưởng mới về quản lý phòng thí nghiệm',
      relatedModule: 'IDEA',
      status: 'PENDING',
      link: '/ideas/new',
    },
    {
      id: 'task3',
      type: 'NOP_HO_SO_NGHIEM_THU',
      title: 'Nộp hồ sơ nghiệm thu đề tài XYZ',
      description: 'Chuẩn bị đầy đủ hồ sơ theo mẫu.',
      relatedModule: 'PROJECT',
      dueDate: '2026-01-15T00:00:00Z',
      status: 'PENDING',
      link: '/projects/xyz/acceptance',
    },
    {
      id: 'task4',
      type: 'XEM_XET_DE_XUAT',
      title: 'Xem xét đề xuất đề tài mới từ nhóm nghiên cứu',
      relatedModule: 'PROJECT',
      status: 'DONE',
      link: '/projects/proposals',
    },
  ]);
}

export async function fetchHomeNotifications(role: UserRole): Promise<HomeNotification[]> {
  return Promise.resolve([
    {
      id: 'noti1',
      title: 'Nhắc nộp báo cáo tiến độ đề tài ABC',
      content: 'Hạn nộp: 31/12/2025. Vui lòng hoàn tất trên hệ thống.',
      createdAt: '2025-12-01T08:00:00Z',
      read: false,
      type: 'DEADLINE',
      link: '/projects/abc/progress',
    },
    {
      id: 'noti2',
      title: 'Kết quả sơ tuyển đề tài XYZ',
      content: 'Đề tài XYZ đã được chấp thuận về mặt chủ trương.',
      createdAt: '2025-11-30T09:30:00Z',
      read: true,
      type: 'INFO',
      link: '/projects/xyz',
    },
    {
      id: 'noti3',
      title: 'Thông báo hệ thống',
      content: 'Hệ thống sẽ bảo trì vào ngày 15/12/2025 từ 22:00-24:00.',
      createdAt: '2025-11-28T14:00:00Z',
      read: false,
      type: 'SYSTEM',
    },
    {
      id: 'noti4',
      title: 'Cảnh báo hạn chót',
      content: 'Còn 7 ngày để hoàn thành báo cáo tiến độ.',
      createdAt: '2025-12-05T07:00:00Z',
      read: false,
      type: 'WARNING',
      link: '/projects/abc/progress',
    },
  ]);
}

export async function fetchHomeProjects(role: UserRole): Promise<HomeProjectShort[]> {
  return Promise.resolve([
    {
      id: 'p1',
      code: 'CS-2025-01',
      title: 'Xây dựng hệ thống quản lý khoa học cho trường',
      level: 'Cấp Trường',
      status: 'Đang thực hiện',
      role: 'CHU_NHIEM',
      startDate: '2025-01-01T00:00:00Z',
      endDate: '2026-12-31T00:00:00Z',
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
    },
  ]);
}

export async function fetchHomeIdeas(role: UserRole): Promise<HomeIdeaShort[]> {
  return Promise.resolve([
    {
      id: 'i1',
      title: 'Ngân hàng ý tưởng số dùng cho quản lý đề tài',
      status: 'Đề xuất đặt hàng',
      createdAt: '2025-10-15T00:00:00Z',
    },
    {
      id: 'i2',
      title: 'Ứng dụng blockchain trong quản lý chứng chỉ',
      status: 'Phê duyệt đặt hàng',
      createdAt: '2025-09-20T00:00:00Z',
    },
    {
      id: 'i3',
      title: 'Hệ thống IoT giám sát phòng thí nghiệm',
      status: 'Đã sơ loại',
      createdAt: '2025-08-10T00:00:00Z',
    },
    {
      id: 'i4',
      title: 'Chatbot hỗ trợ sinh viên',
      status: 'Mới',
      createdAt: '2025-11-25T00:00:00Z',
    },
  ]);
}
