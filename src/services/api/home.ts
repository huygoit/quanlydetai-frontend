/**
 * Home/Dashboard API Service
 */
import { get, ApiResponse } from '../request';
import type { UserRole } from '../mock/homeMockService';

// Types
export interface HomeSummaryCard {
  key: string;
  title: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  trendPercent?: number;
  diffText?: string;
  icon?: string;
  color?: string;
}

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface HomeTaskItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  relatedModule: 'IDEA' | 'PROJECT' | 'CV' | 'FINANCE';
  dueDate?: string;
  status: 'PENDING' | 'DONE';
  priority: TaskPriority;
  link?: string;
}

export type HomeNotificationType = 'INFO' | 'WARNING' | 'DEADLINE' | 'SYSTEM' | 'SUCCESS' | 'ERROR';
export type HomeNotificationPriority = 'URGENT' | 'NORMAL';

export interface HomeNotification {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
  type?: HomeNotificationType;
  priority?: HomeNotificationPriority;
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
  progress?: number;
}

export interface HomeIdeaShort {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  score?: number;
}

export interface WorkflowStep {
  key: string;
  title: string;
  description: string;
  count: number;
  status: 'wait' | 'process' | 'finish';
  link?: string;
}

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

export interface OverviewKpis {
  totalLecturers: number;
  totalStudents: number;
  verifiedProfiles: number;
  researchProjects: number;
  studentResearchProjects: number;
  startupProjects: number;
  activeUnits: number;
  activeFields: number;
}

export interface OverviewTrendPoint {
  year: number;
  researchProject: number;
  studentResearch: number;
  startup: number;
}

export interface OverviewUnitStat {
  unit: string;
  researchProject: number;
  studentResearch: number;
  startup: number;
  total: number;
}

export interface OverviewFieldStat {
  field: string;
  researchProject: number;
  studentResearch: number;
  startup: number;
  total: number;
}

export interface OverviewAlert {
  key: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface HomeOverviewData {
  filters: {
    year: number | null;
    departmentId: number | null;
    field: string | null;
    yearOptions: number[];
    departments: Array<{ id: number; name: string }>;
    fields: string[];
  };
  kpis: OverviewKpis;
  trend: OverviewTrendPoint[];
  unitStats: OverviewUnitStat[];
  fieldStats: OverviewFieldStat[];
  topUnits: OverviewUnitStat[];
  topFields: OverviewFieldStat[];
  alerts: OverviewAlert[];
}

// API Functions

/**
 * Lấy KPI summary theo role
 */
export async function fetchHomeSummary(): Promise<ApiResponse<HomeSummaryCard[]>> {
  return get<ApiResponse<HomeSummaryCard[]>>('/api/home/summary');
}

/**
 * Lấy danh sách công việc theo role
 */
export async function fetchHomeTasks(): Promise<ApiResponse<HomeTaskItem[]>> {
  return get<ApiResponse<HomeTaskItem[]>>('/api/home/tasks');
}

/**
 * Lấy thông báo gần nhất (5 items)
 */
export async function fetchHomeNotifications(): Promise<ApiResponse<HomeNotification[]> & { unreadCount: number }> {
  return get<ApiResponse<HomeNotification[]> & { unreadCount: number }>('/api/home/notifications');
}

/**
 * Lấy danh sách đề tài của user (NCV/CNDT)
 */
export async function fetchHomeProjects(): Promise<ApiResponse<HomeProjectShort[]>> {
  return get<ApiResponse<HomeProjectShort[]>>('/api/home/my-projects');
}

/**
 * Lấy danh sách ý tưởng của user (NCV)
 */
export async function fetchHomeIdeas(): Promise<ApiResponse<HomeIdeaShort[]>> {
  return get<ApiResponse<HomeIdeaShort[]>>('/api/home/my-ideas');
}

/**
 * Lấy workflow steps (PHONG_KH)
 */
export async function fetchWorkflowSteps(): Promise<ApiResponse<WorkflowStep[]>> {
  return get<ApiResponse<WorkflowStep[]>>('/api/home/workflow-steps');
}

/**
 * Lấy đề xuất chờ duyệt (PHONG_KH)
 */
export async function fetchPendingProposals(): Promise<ApiResponse<HomeProjectShort[]>> {
  return get<ApiResponse<HomeProjectShort[]>>('/api/home/pending-proposals');
}

/**
 * Lấy đề tài chậm tiến độ (PHONG_KH)
 */
export async function fetchDelayedProjects(): Promise<ApiResponse<HomeProjectShort[]>> {
  return get<ApiResponse<HomeProjectShort[]>>('/api/home/delayed-projects');
}

/**
 * Lấy dữ liệu biểu đồ (LANH_DAO)
 */
export async function fetchHomeCharts(): Promise<ApiResponse<HomeCharts>> {
  return get<ApiResponse<HomeCharts>>('/api/home/charts');
}

/**
 * Lấy top đề tài (LANH_DAO)
 */
export async function fetchTopProjects(): Promise<ApiResponse<TopProjectItem[]>> {
  return get<ApiResponse<TopProjectItem[]>>('/api/home/top-projects');
}

/**
 * Lấy top nhà nghiên cứu (LANH_DAO)
 */
export async function fetchTopResearchers(): Promise<ApiResponse<TopResearcherItem[]>> {
  return get<ApiResponse<TopResearcherItem[]>>('/api/home/top-researchers');
}

/**
 * Lấy cảnh báo (LANH_DAO)
 */
export async function fetchWarnings(): Promise<ApiResponse<WarningItem[]>> {
  return get<ApiResponse<WarningItem[]>>('/api/home/warnings');
}

/**
 * Dashboard tổng quát theo dữ liệu thực tế (giảng viên, sinh viên, đề tài, startup)
 */
export async function fetchHomeOverview(params?: {
  year?: number;
  departmentId?: number;
  field?: string;
}): Promise<ApiResponse<HomeOverviewData>> {
  return get<ApiResponse<HomeOverviewData>>('/api/home/overview', params);
}
