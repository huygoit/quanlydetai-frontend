/**
 * Idea Council API Service (Hội đồng chấm điểm ý tưởng)
 */
import { get, post, put, del, ApiResponse, PaginatedResponse } from '../request';

// Types
export type CouncilSessionStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'PUBLISHED';
export type SessionMemberRole = 'CHU_TICH' | 'THU_KY' | 'UY_VIEN' | 'PHAN_BIEN';

export interface CouncilSession {
  id: number;
  code: string;
  title: string;
  year: number;
  meetingDate?: string;
  location?: string;
  status: CouncilSessionStatus;
  createdById: number;
  createdByName: string;
  memberCount: number;
  ideaCount: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMember {
  id: number;
  sessionId: number;
  memberId: number;
  memberName: string;
  memberEmail?: string;
  roleInCouncil: SessionMemberRole;
  unit?: string;
  createdAt: string;
}

export interface SessionIdea {
  id: number;
  sessionId: number;
  ideaId: number;
  ideaCode: string;
  ideaTitle: string;
  ownerName: string;
  ownerUnit: string;
  field: string;
  statusSnapshot: string;
  createdAt: string;
}

export interface IdeaCouncilScore {
  id: number;
  sessionId: number;
  ideaId: number;
  councilMemberId: number;
  councilMemberName: string;
  councilRole: SessionMemberRole;
  noveltyScore: number;
  noveltyComment: string;
  feasibilityScore: number;
  feasibilityComment: string;
  alignmentScore: number;
  alignmentComment: string;
  authorCapacityScore: number;
  authorCapacityComment: string;
  weightedScore: number;
  generalComment?: string;
  submitted: boolean;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IdeaCouncilResult {
  sessionId: number;
  ideaId: number;
  ideaCode: string;
  ideaTitle: string;
  avgWeightedScore: number;
  avgNoveltyScore: number;
  avgFeasibilityScore: number;
  avgAlignmentScore: number;
  avgAuthorCapacityScore: number;
  submittedCount: number;
  memberCount: number;
  recommendation: 'PROPOSE_ORDER' | 'NOT_PROPOSE';
  thresholdScore: number;
}

export interface SessionQueryParams {
  year?: number;
  status?: CouncilSessionStatus;
  keyword?: string;
  page?: number;
  perPage?: number;
}

// API Functions - Sessions

/**
 * Lấy danh sách phiên hội đồng
 */
export async function querySessions(params?: SessionQueryParams): Promise<PaginatedResponse<CouncilSession>> {
  return get<PaginatedResponse<CouncilSession>>('/api/council-sessions', params);
}

/**
 * Lấy chi tiết phiên hội đồng
 */
export async function getSession(id: number): Promise<ApiResponse<CouncilSession & { members: SessionMember[]; ideas: SessionIdea[] }>> {
  return get<ApiResponse<CouncilSession & { members: SessionMember[]; ideas: SessionIdea[] }>>(`/api/council-sessions/${id}`);
}

/**
 * Lấy thống kê tiến độ chấm điểm của phiên
 */
export async function getSessionStats(sessionId: number): Promise<ApiResponse<{
  totalIdeas: number;
  totalMembers: number;
  totalExpectedScores: number;
  submittedScores: number;
  pendingScores: number;
  completionRate: number;
}>> {
  return get<ApiResponse<{
    totalIdeas: number;
    totalMembers: number;
    totalExpectedScores: number;
    submittedScores: number;
    pendingScores: number;
    completionRate: number;
  }>>(`/api/council-sessions/${sessionId}/stats`);
}

/**
 * Tạo phiên hội đồng mới
 */
export async function createSession(data: {
  title: string;
  year: number;
  meetingDate?: string;
  location?: string;
  note?: string;
}): Promise<ApiResponse<CouncilSession>> {
  return post<ApiResponse<CouncilSession>>('/api/council-sessions', data);
}

/**
 * Cập nhật phiên hội đồng (chỉ DRAFT)
 */
export async function updateSession(id: number, data: {
  title?: string;
  meetingDate?: string;
  location?: string;
  note?: string;
}): Promise<ApiResponse<CouncilSession>> {
  return put<ApiResponse<CouncilSession>>(`/api/council-sessions/${id}`, data);
}

/**
 * Mở phiên hội đồng (DRAFT → OPEN)
 */
export async function openSession(id: number): Promise<ApiResponse<CouncilSession>> {
  return post<ApiResponse<CouncilSession>>(`/api/council-sessions/${id}/open`);
}

/**
 * Đóng phiên hội đồng (OPEN → CLOSED)
 * Tự động apply kết quả vào ideas
 */
export async function closeSession(id: number): Promise<ApiResponse<{ proposedCount: number; rejectedCount: number }>> {
  return post<ApiResponse<{ proposedCount: number; rejectedCount: number }>>(`/api/council-sessions/${id}/close`);
}

/**
 * Công bố kết quả (CLOSED → PUBLISHED)
 */
export async function publishSession(id: number): Promise<ApiResponse<CouncilSession>> {
  return post<ApiResponse<CouncilSession>>(`/api/council-sessions/${id}/publish`);
}

// API Functions - Session Members

/**
 * Lấy danh sách thành viên hội đồng
 */
export async function getSessionMembers(sessionId: number): Promise<ApiResponse<SessionMember[]>> {
  return get<ApiResponse<SessionMember[]>>(`/api/council-sessions/${sessionId}/members`);
}

/** Thông tin hồ sơ khoa học có thể chọn làm thành viên hội đồng */
export interface AvailableMember {
  userId: number;
  fullName: string;
  workEmail: string;
  degree?: string | null;
  academicTitle?: string | null;
  organization?: string | null;
  faculty?: string | null;
  department?: string | null;
  unit?: string | null;
  currentTitle?: string | null;
  mainResearchArea?: string | null;
  phone?: string | null;
}

/**
 * Lấy danh sách hồ sơ khoa học chưa có trong phiên - để chọn thêm thành viên
 */
export async function getAvailableMembers(sessionId: number, keyword?: string): Promise<ApiResponse<AvailableMember[]>> {
  return get<ApiResponse<AvailableMember[]>>(`/api/council-sessions/${sessionId}/available-members`, { keyword });
}

/**
 * Thêm thành viên hội đồng
 */
export async function addSessionMember(sessionId: number, data: {
  memberId: number;
  memberName: string;
  memberEmail?: string;
  roleInCouncil: SessionMemberRole;
  unit?: string;
}): Promise<ApiResponse<SessionMember>> {
  return post<ApiResponse<SessionMember>>(`/api/council-sessions/${sessionId}/members`, data);
}

/**
 * Xóa thành viên hội đồng
 */
export async function removeSessionMember(sessionId: number, memberId: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/council-sessions/${sessionId}/members/${memberId}`);
}

// API Functions - Session Ideas

/** Ý tưởng có thể thêm vào phiên (APPROVED_INTERNAL, chưa có trong phiên) */
export interface AvailableIdea {
  id: number;
  code: string;
  title: string;
  summary?: string;
  field: string;
  ownerName: string;
  ownerUnit: string;
  status: string;
}

/**
 * Lấy danh sách ý tưởng đã sơ loại (APPROVED_INTERNAL) chưa có trong phiên - để chọn thêm vào hội đồng
 */
export async function getAvailableIdeas(sessionId: number): Promise<ApiResponse<AvailableIdea[]>> {
  return get<ApiResponse<AvailableIdea[]>>(`/api/council-sessions/${sessionId}/available-ideas`);
}

/**
 * Lấy danh sách ý tưởng trong phiên
 */
export async function getSessionIdeas(sessionId: number): Promise<ApiResponse<SessionIdea[]>> {
  return get<ApiResponse<SessionIdea[]>>(`/api/council-sessions/${sessionId}/ideas`);
}

/**
 * Thêm ý tưởng vào phiên
 */
export async function addSessionIdeas(sessionId: number, ideaIds: number[]): Promise<ApiResponse<SessionIdea[]>> {
  return post<ApiResponse<SessionIdea[]>>(`/api/council-sessions/${sessionId}/ideas`, {
    ideas: ideaIds.map(id => ({ ideaId: id })),
  });
}

/**
 * Xóa ý tưởng khỏi phiên
 */
export async function removeSessionIdea(sessionId: number, ideaId: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/council-sessions/${sessionId}/ideas/${ideaId}`);
}

// API Functions - Scoring

/**
 * Lấy danh sách phiếu chấm điểm của thành viên
 */
export async function getMyScoreSheets(sessionId: number): Promise<ApiResponse<IdeaCouncilScore[]>> {
  return get<ApiResponse<IdeaCouncilScore[]>>(`/api/council-sessions/${sessionId}/my-scores`);
}

/**
 * Lấy phiếu chấm điểm của tôi cho 1 ý tưởng (GET .../ideas/:ideaId/my-score)
 */
export async function getScoreSheet(sessionId: number, ideaId: number): Promise<ApiResponse<IdeaCouncilScore | null>> {
  return get<ApiResponse<IdeaCouncilScore | null>>(`/api/council-sessions/${sessionId}/ideas/${ideaId}/my-score`);
}

/**
 * Lưu phiếu chấm điểm (draft) - POST .../ideas/:ideaId/score
 */
export async function saveScoreSheet(sessionId: number, ideaId: number, data: {
  noveltyScore: number;
  noveltyComment: string;
  feasibilityScore: number;
  feasibilityComment: string;
  alignmentScore: number;
  alignmentComment: string;
  authorCapacityScore: number;
  authorCapacityComment: string;
  generalComment?: string;
}): Promise<ApiResponse<IdeaCouncilScore>> {
  return post<ApiResponse<IdeaCouncilScore>>(`/api/council-sessions/${sessionId}/ideas/${ideaId}/score`, data);
}

/**
 * Nộp phiếu chấm điểm - POST .../ideas/:ideaId/submit (backend tìm phiếu của user và submit)
 */
export async function submitScoreSheet(sessionId: number, ideaId: number): Promise<ApiResponse<IdeaCouncilScore>> {
  return post<ApiResponse<IdeaCouncilScore>>(`/api/council-sessions/${sessionId}/ideas/${ideaId}/submit`);
}

// API Functions - Results

/**
 * Lấy kết quả tổng hợp của phiên
 */
export async function getSessionResults(sessionId: number): Promise<ApiResponse<IdeaCouncilResult[]>> {
  return get<ApiResponse<IdeaCouncilResult[]>>(`/api/council-sessions/${sessionId}/results`);
}

/**
 * Lấy tất cả phiếu chấm của 1 ý tưởng (cho admin xem)
 */
export async function getIdeaAllScores(sessionId: number, ideaId: number): Promise<ApiResponse<IdeaCouncilScore[]>> {
  return get<ApiResponse<IdeaCouncilScore[]>>(`/api/council-sessions/${sessionId}/ideas/${ideaId}/scores`);
}

// Constants
export const SESSION_STATUS_MAP: Record<CouncilSessionStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Chuẩn bị', color: 'default' },
  OPEN: { text: 'Đang chấm', color: 'processing' },
  CLOSED: { text: 'Đã khóa', color: 'warning' },
  PUBLISHED: { text: 'Đã công bố', color: 'success' },
};

export const MEMBER_ROLE_MAP: Record<SessionMemberRole, { text: string; color: string }> = {
  CHU_TICH: { text: 'Chủ tịch HĐ', color: 'gold' },
  THU_KY: { text: 'Thư ký', color: 'blue' },
  UY_VIEN: { text: 'Ủy viên', color: 'default' },
  PHAN_BIEN: { text: 'Phản biện', color: 'purple' },
};

export const SCORING_CRITERIA = [
  { key: 'novelty', name: 'Tính mới, sáng tạo', description: 'Mức độ mới, khác biệt, giá trị khoa học', weight: 0.30, maxScore: 10 },
  { key: 'feasibility', name: 'Tính khả thi', description: 'Khả năng triển khai với nguồn lực hiện có', weight: 0.30, maxScore: 10 },
  { key: 'alignment', name: 'Phù hợp định hướng', description: 'Phù hợp chiến lược Trường / ngành / xã hội', weight: 0.20, maxScore: 10 },
  { key: 'authorCapacity', name: 'Năng lực tác giả', description: 'Năng lực NCV / nhóm tác giả', weight: 0.20, maxScore: 10 },
];

export const MAX_WEIGHTED_SCORE = 10;
export const THRESHOLD_SCORE = 7.0;

/**
 * Tính điểm có trọng số
 */
export function calculateWeightedScore(scores: {
  novelty: number;
  feasibility: number;
  alignment: number;
  authorCapacity: number;
}): number {
  const weighted =
    scores.novelty * 0.30 +
    scores.feasibility * 0.30 +
    scores.alignment * 0.20 +
    scores.authorCapacity * 0.20;
  return Math.round(weighted * 100) / 100;
}
