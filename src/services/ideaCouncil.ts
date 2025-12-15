/**
 * Mock Service - Hội đồng KH&ĐT chấm điểm ý tưởng
 * Theo specs/ideas-council-weighted.md (V2 - CÓ TRỌNG SỐ)
 * 
 * - Điểm: weightedScore = novelty*0.30 + feasibility*0.30 + alignment*0.20 + authorCapacity*0.20
 * - Max: 10 điểm
 * - Ngưỡng: 7.0/10 để đề xuất đặt hàng
 */

// ========== TYPES ==========

/**
 * Trạng thái phiên hội đồng
 */
export type CouncilSessionStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'PUBLISHED';

/**
 * Vai trò trong hội đồng
 */
export type SessionMemberRole = 'CHU_TICH' | 'THU_KY' | 'UY_VIEN' | 'PHAN_BIEN';

/**
 * Phiên hội đồng
 */
export interface CouncilSession {
  id: string;
  code: string;
  title: string;
  year: number;
  meetingDate?: string;
  location?: string;
  status: CouncilSessionStatus;

  createdById: string;
  createdByName: string;

  memberCount: number;
  ideaCount: number;

  note?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Thành viên hội đồng trong phiên
 */
export interface SessionMember {
  id: string;
  sessionId: string;

  memberId: string;
  memberName: string;
  memberEmail?: string;

  roleInCouncil: SessionMemberRole;
  unit?: string;

  createdAt: string;
}

/**
 * Ý tưởng trong phiên
 */
export interface SessionIdea {
  id: string;
  sessionId: string;

  ideaId: string;
  ideaCode: string;
  ideaTitle: string;
  ownerName: string;
  ownerUnit: string;
  field: string;

  statusSnapshot: string;

  createdAt: string;
}

/**
 * Phiếu chấm điểm (V2 - CÓ TRỌNG SỐ)
 */
export interface IdeaCouncilScore {
  id: string;
  sessionId: string;
  ideaId: string;

  councilMemberId: string;
  councilMemberName: string;
  councilRole: SessionMemberRole;

  // 4 tiêu chí - mỗi tiêu chí 0-10
  noveltyScore: number;       // Trọng số 30%
  noveltyComment: string;

  feasibilityScore: number;   // Trọng số 30%
  feasibilityComment: string;

  alignmentScore: number;     // Trọng số 20%
  alignmentComment: string;

  authorCapacityScore: number; // Trọng số 20%
  authorCapacityComment: string;

  // Điểm có trọng số (auto-calc), max = 10
  weightedScore: number;

  generalComment?: string;

  submitted: boolean;
  submittedAt?: string;

  createdAt: string;
  updatedAt: string;
}

/**
 * Kết quả tổng hợp cho 1 ý tưởng (V2 - có trọng số)
 */
export interface IdeaCouncilResult {
  sessionId: string;
  ideaId: string;
  ideaCode: string;
  ideaTitle: string;

  // Điểm trung bình có trọng số (max 10)
  avgWeightedScore: number;

  // Điểm trung bình từng tiêu chí
  avgNoveltyScore: number;
  avgFeasibilityScore: number;
  avgAlignmentScore: number;
  avgAuthorCapacityScore: number;

  // Số phiếu
  submittedCount: number;
  memberCount: number;

  // Kết luận
  recommendation: 'PROPOSE_ORDER' | 'NOT_PROPOSE';

  // Ngưỡng (7.0/10)
  thresholdScore: number;
}

// ========== CONSTANTS ==========

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

/**
 * 4 tiêu chí chấm điểm (V2 - CÓ TRỌNG SỐ)
 * Tổng trọng số = 100%
 */
export const SCORING_CRITERIA = [
  {
    key: 'novelty',
    name: 'Tính mới, sáng tạo',
    description: 'Mức độ mới, khác biệt, giá trị khoa học',
    weight: 0.30, // 30%
    maxScore: 10,
  },
  {
    key: 'feasibility',
    name: 'Tính khả thi',
    description: 'Khả năng triển khai với nguồn lực hiện có',
    weight: 0.30, // 30%
    maxScore: 10,
  },
  {
    key: 'alignment',
    name: 'Phù hợp định hướng',
    description: 'Phù hợp chiến lược Trường / ngành / xã hội',
    weight: 0.20, // 20%
    maxScore: 10,
  },
  {
    key: 'authorCapacity',
    name: 'Năng lực tác giả',
    description: 'Năng lực NCV / nhóm tác giả',
    weight: 0.20, // 20%
    maxScore: 10,
  },
];

export const MAX_WEIGHTED_SCORE = 10;
export const THRESHOLD_SCORE = 7.0; // Ngưỡng đề xuất đặt hàng

// ========== MOCK DATA ==========

// Mock phiên hội đồng
let mockSessions: CouncilSession[] = [
  {
    id: 'session-1',
    code: 'HDYT-2024-01',
    title: 'Hội đồng chấm ý tưởng đợt 1/2024',
    year: 2024,
    meetingDate: '2024-03-15',
    location: 'Phòng họp A1',
    status: 'OPEN',
    createdById: 'phongkh-1',
    createdByName: 'Phòng KH',
    memberCount: 5,
    ideaCount: 2,
    note: 'Đợt xét duyệt ý tưởng quý 1/2024',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-01T08:00:00Z',
  },
  {
    id: 'session-2',
    code: 'HDYT-2024-02',
    title: 'Hội đồng chấm ý tưởng đợt 2/2024',
    year: 2024,
    status: 'DRAFT',
    createdById: 'phongkh-1',
    createdByName: 'Phòng KH',
    memberCount: 0,
    ideaCount: 0,
    createdAt: '2024-03-10T08:00:00Z',
    updatedAt: '2024-03-10T08:00:00Z',
  },
];

// Mock thành viên
let mockMembers: SessionMember[] = [
  { id: 'sm-1', sessionId: 'session-1', memberId: 'member-1', memberName: 'PGS.TS Nguyễn Văn Chủ tịch', memberEmail: 'nvct@email.com', roleInCouncil: 'CHU_TICH', unit: 'Khoa CNTT', createdAt: '2024-03-01T08:00:00Z' },
  { id: 'sm-2', sessionId: 'session-1', memberId: 'member-2', memberName: 'TS. Trần Thị Thư ký', memberEmail: 'tttk@email.com', roleInCouncil: 'THU_KY', unit: 'Phòng KH', createdAt: '2024-03-01T08:00:00Z' },
  { id: 'sm-3', sessionId: 'session-1', memberId: 'member-3', memberName: 'PGS.TS Lê Văn Phản biện', memberEmail: 'lvpb@email.com', roleInCouncil: 'PHAN_BIEN', unit: 'Khoa Y', createdAt: '2024-03-01T08:00:00Z' },
  { id: 'sm-4', sessionId: 'session-1', memberId: 'member-4', memberName: 'TS. Phạm Văn Ủy viên', memberEmail: 'pvuv@email.com', roleInCouncil: 'UY_VIEN', unit: 'Khoa Kinh tế', createdAt: '2024-03-01T08:00:00Z' },
  { id: 'sm-5', sessionId: 'session-1', memberId: 'member-5', memberName: 'TS. Hoàng Thị Ủy viên', memberEmail: 'htuv@email.com', roleInCouncil: 'UY_VIEN', unit: 'Khoa Nông nghiệp', createdAt: '2024-03-01T08:00:00Z' },
];

// Mock ý tưởng trong phiên
let mockSessionIdeas: SessionIdea[] = [
  { id: 'si-1', sessionId: 'session-1', ideaId: '3', ideaCode: 'YT-2024-003', ideaTitle: 'Nghiên cứu giống lúa chịu hạn mới', ownerName: 'Lê Văn C', ownerUnit: 'Khoa Nông nghiệp', field: 'Nông nghiệp', statusSnapshot: 'APPROVED_INTERNAL', createdAt: '2024-03-01T08:00:00Z' },
  { id: 'si-2', sessionId: 'session-1', ideaId: '6', ideaCode: 'YT-2024-006', ideaTitle: 'Hệ thống IoT giám sát môi trường nuôi trồng thủy sản', ownerName: 'Hoàng Văn E', ownerUnit: 'Khoa Nông nghiệp', field: 'Nông nghiệp', statusSnapshot: 'APPROVED_INTERNAL', createdAt: '2024-03-01T08:00:00Z' },
];

// Mock phiếu chấm (V2 - có trọng số)
let mockScores: IdeaCouncilScore[] = [
  {
    id: 'score-1',
    sessionId: 'session-1',
    ideaId: '3',
    councilMemberId: 'member-1',
    councilMemberName: 'PGS.TS Nguyễn Văn Chủ tịch',
    councilRole: 'CHU_TICH',
    noveltyScore: 8,
    noveltyComment: 'Ý tưởng mới, có tính đột phá trong bối cảnh biến đổi khí hậu.',
    feasibilityScore: 7,
    feasibilityComment: 'Có thể triển khai được với nguồn lực hiện có của nhóm.',
    alignmentScore: 9,
    alignmentComment: 'Rất phù hợp với định hướng phát triển nông nghiệp bền vững.',
    authorCapacityScore: 8,
    authorCapacityComment: 'Nhóm tác giả có kinh nghiệm trong lĩnh vực này.',
    weightedScore: 7.9, // 8*0.30 + 7*0.30 + 9*0.20 + 8*0.20 = 2.4 + 2.1 + 1.8 + 1.6 = 7.9
    generalComment: 'Đề xuất thông qua để đặt hàng.',
    submitted: true,
    submittedAt: '2024-03-05T10:00:00Z',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-05T10:00:00Z',
  },
  {
    id: 'score-2',
    sessionId: 'session-1',
    ideaId: '3',
    councilMemberId: 'member-3',
    councilMemberName: 'PGS.TS Lê Văn Phản biện',
    councilRole: 'PHAN_BIEN',
    noveltyScore: 7,
    noveltyComment: 'Có một số nghiên cứu tương tự nhưng đề xuất vẫn có điểm mới.',
    feasibilityScore: 8,
    feasibilityComment: 'Kế hoạch triển khai rõ ràng.',
    alignmentScore: 8,
    alignmentComment: 'Phù hợp chiến lược phát triển.',
    authorCapacityScore: 7,
    authorCapacityComment: 'Nhóm cần bổ sung thêm chuyên gia.',
    weightedScore: 7.5, // 7*0.30 + 8*0.30 + 8*0.20 + 7*0.20 = 2.1 + 2.4 + 1.6 + 1.4 = 7.5
    generalComment: 'Đồng ý đề xuất với một số góp ý bổ sung.',
    submitted: true,
    submittedAt: '2024-03-05T11:00:00Z',
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-05T11:00:00Z',
  },
];

// ========== HELPER FUNCTIONS ==========

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Tính điểm có trọng số (V2)
 * weightedScore = novelty*0.30 + feasibility*0.30 + alignment*0.20 + authorCapacity*0.20
 */
export function calculateWeightedScore(
  novelty: number,
  feasibility: number,
  alignment: number,
  authorCapacity: number
): number {
  const score = 
    novelty * 0.30 +
    feasibility * 0.30 +
    alignment * 0.20 +
    authorCapacity * 0.20;
  return Math.round(score * 100) / 100; // Làm tròn 2 chữ số
}

// ========== SESSION API ==========

/**
 * Lấy danh sách phiên hội đồng
 */
export async function queryCouncilSessions(params?: {
  year?: number;
  status?: CouncilSessionStatus;
  keyword?: string;
}): Promise<{ data: CouncilSession[]; total: number; success: boolean }> {
  await delay(300);
  
  let filtered = [...mockSessions];
  
  if (params?.year) {
    filtered = filtered.filter(s => s.year === params.year);
  }
  if (params?.status) {
    filtered = filtered.filter(s => s.status === params.status);
  }
  if (params?.keyword) {
    const kw = params.keyword.toLowerCase();
    filtered = filtered.filter(s => 
      s.code.toLowerCase().includes(kw) || 
      s.title.toLowerCase().includes(kw)
    );
  }
  
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return { data: filtered, total: filtered.length, success: true };
}

/**
 * Lấy chi tiết phiên
 */
export async function getCouncilSession(id: string): Promise<{ data: CouncilSession | null; success: boolean }> {
  await delay(200);
  const session = mockSessions.find(s => s.id === id);
  return { data: session || null, success: !!session };
}

/**
 * Tạo phiên hội đồng mới
 */
export async function createCouncilSession(data: {
  title: string;
  year: number;
  meetingDate?: string;
  location?: string;
  note?: string;
}): Promise<{ data: CouncilSession; success: boolean }> {
  await delay(300);
  
  const year = data.year;
  const count = mockSessions.filter(s => s.year === year).length + 1;
  const code = `HDYT-${year}-${String(count).padStart(2, '0')}`;
  
  const now = new Date().toISOString();
  const newSession: CouncilSession = {
    id: generateId(),
    code,
    title: data.title,
    year: data.year,
    meetingDate: data.meetingDate,
    location: data.location,
    status: 'DRAFT',
    createdById: 'phongkh-1',
    createdByName: 'Phòng KH',
    memberCount: 0,
    ideaCount: 0,
    note: data.note,
    createdAt: now,
    updatedAt: now,
  };
  
  mockSessions.unshift(newSession);
  return { data: newSession, success: true };
}

/**
 * Cập nhật phiên
 */
export async function updateCouncilSession(
  id: string,
  data: Partial<Pick<CouncilSession, 'title' | 'meetingDate' | 'location' | 'note'>>
): Promise<{ data: CouncilSession | null; success: boolean }> {
  await delay(300);
  
  const index = mockSessions.findIndex(s => s.id === id);
  if (index === -1) return { data: null, success: false };
  
  const session = mockSessions[index];
  if (session.status !== 'DRAFT') {
    return { data: null, success: false }; // Chỉ sửa được khi DRAFT
  }
  
  const updated = { ...session, ...data, updatedAt: new Date().toISOString() };
  mockSessions[index] = updated;
  return { data: updated, success: true };
}

/**
 * Mở phiên (DRAFT → OPEN)
 */
export async function openSession(id: string): Promise<{ data: CouncilSession | null; success: boolean }> {
  await delay(300);
  
  const index = mockSessions.findIndex(s => s.id === id);
  if (index === -1) return { data: null, success: false };
  
  const session = mockSessions[index];
  if (session.status !== 'DRAFT') return { data: null, success: false };
  if (session.memberCount === 0) return { data: null, success: false }; // Phải có thành viên
  if (session.ideaCount === 0) return { data: null, success: false }; // Phải có ý tưởng
  
  const updated = { ...session, status: 'OPEN' as const, updatedAt: new Date().toISOString() };
  mockSessions[index] = updated;
  return { data: updated, success: true };
}

/**
 * Khóa phiên (OPEN → CLOSED)
 * Tự động áp dụng kết quả: ý tưởng đạt ngưỡng → PROPOSED_FOR_ORDER
 */
export async function closeSession(id: string): Promise<{ 
  data: CouncilSession | null; 
  success: boolean;
  proposedCount?: number;
  rejectedCount?: number;
}> {
  await delay(300);
  
  const index = mockSessions.findIndex(s => s.id === id);
  if (index === -1) return { data: null, success: false };
  
  const session = mockSessions[index];
  if (session.status !== 'OPEN') return { data: null, success: false };
  
  // Khóa phiên
  const updated = { ...session, status: 'CLOSED' as const, updatedAt: new Date().toISOString() };
  mockSessions[index] = updated;
  
  // Tự động áp dụng kết quả vào ý tưởng
  const applyResult = await applyResultsToIdeas(id);
  
  return { 
    data: updated, 
    success: true,
    proposedCount: applyResult.proposedCount,
    rejectedCount: applyResult.rejectedCount,
  };
}

/**
 * Công bố kết quả (CLOSED → PUBLISHED)
 */
export async function publishSession(id: string): Promise<{ data: CouncilSession | null; success: boolean }> {
  await delay(300);
  
  const index = mockSessions.findIndex(s => s.id === id);
  if (index === -1) return { data: null, success: false };
  
  const session = mockSessions[index];
  if (session.status !== 'CLOSED') return { data: null, success: false };
  
  const updated = { ...session, status: 'PUBLISHED' as const, updatedAt: new Date().toISOString() };
  mockSessions[index] = updated;
  return { data: updated, success: true };
}

// ========== MEMBER API ==========

/**
 * Lấy danh sách thành viên trong phiên
 */
export async function querySessionMembers(sessionId: string): Promise<{ data: SessionMember[]; success: boolean }> {
  await delay(200);
  const members = mockMembers.filter(m => m.sessionId === sessionId);
  return { data: members, success: true };
}

/**
 * Thêm thành viên vào phiên
 */
export async function addSessionMember(
  sessionId: string,
  data: { memberName: string; memberEmail?: string; roleInCouncil: SessionMemberRole; unit?: string }
): Promise<{ data: SessionMember; success: boolean }> {
  await delay(300);
  
  const session = mockSessions.find(s => s.id === sessionId);
  if (!session || session.status !== 'DRAFT') {
    return { data: null as any, success: false };
  }
  
  const newMember: SessionMember = {
    id: generateId(),
    sessionId,
    memberId: generateId(),
    memberName: data.memberName,
    memberEmail: data.memberEmail,
    roleInCouncil: data.roleInCouncil,
    unit: data.unit,
    createdAt: new Date().toISOString(),
  };
  
  mockMembers.push(newMember);
  
  // Update member count
  const idx = mockSessions.findIndex(s => s.id === sessionId);
  if (idx >= 0) {
    mockSessions[idx].memberCount = mockMembers.filter(m => m.sessionId === sessionId).length;
  }
  
  return { data: newMember, success: true };
}

/**
 * Xóa thành viên khỏi phiên
 */
export async function removeSessionMember(sessionId: string, memberId: string): Promise<{ success: boolean }> {
  await delay(300);
  
  const session = mockSessions.find(s => s.id === sessionId);
  if (!session || session.status !== 'DRAFT') {
    return { success: false };
  }
  
  const index = mockMembers.findIndex(m => m.sessionId === sessionId && m.id === memberId);
  if (index === -1) return { success: false };
  
  mockMembers.splice(index, 1);
  
  // Update member count
  const idx = mockSessions.findIndex(s => s.id === sessionId);
  if (idx >= 0) {
    mockSessions[idx].memberCount = mockMembers.filter(m => m.sessionId === sessionId).length;
  }
  
  return { success: true };
}

// ========== SESSION IDEAS API ==========

/**
 * Lấy danh sách ý tưởng trong phiên
 */
export async function querySessionIdeas(sessionId: string): Promise<{ data: SessionIdea[]; success: boolean }> {
  await delay(200);
  const ideas = mockSessionIdeas.filter(i => i.sessionId === sessionId);
  return { data: ideas, success: true };
}

/**
 * Thêm ý tưởng vào phiên (chỉ APPROVED_INTERNAL)
 */
export async function addIdeasToSession(
  sessionId: string,
  ideas: Array<{ ideaId: string; ideaCode: string; ideaTitle: string; ownerName: string; ownerUnit: string; field: string }>
): Promise<{ data: SessionIdea[]; success: boolean }> {
  await delay(300);
  
  const session = mockSessions.find(s => s.id === sessionId);
  if (!session || session.status !== 'DRAFT') {
    return { data: [], success: false };
  }
  
  const newIdeas: SessionIdea[] = ideas.map(idea => ({
    id: generateId(),
    sessionId,
    ideaId: idea.ideaId,
    ideaCode: idea.ideaCode,
    ideaTitle: idea.ideaTitle,
    ownerName: idea.ownerName,
    ownerUnit: idea.ownerUnit,
    field: idea.field,
    statusSnapshot: 'APPROVED_INTERNAL',
    createdAt: new Date().toISOString(),
  }));
  
  mockSessionIdeas.push(...newIdeas);
  
  // Update idea count
  const idx = mockSessions.findIndex(s => s.id === sessionId);
  if (idx >= 0) {
    mockSessions[idx].ideaCount = mockSessionIdeas.filter(i => i.sessionId === sessionId).length;
  }
  
  return { data: newIdeas, success: true };
}

/**
 * Xóa ý tưởng khỏi phiên
 */
export async function removeIdeaFromSession(sessionId: string, sessionIdeaId: string): Promise<{ success: boolean }> {
  await delay(300);
  
  const session = mockSessions.find(s => s.id === sessionId);
  if (!session || session.status !== 'DRAFT') {
    return { success: false };
  }
  
  const index = mockSessionIdeas.findIndex(i => i.sessionId === sessionId && i.id === sessionIdeaId);
  if (index === -1) return { success: false };
  
  mockSessionIdeas.splice(index, 1);
  
  // Update idea count
  const idx = mockSessions.findIndex(s => s.id === sessionId);
  if (idx >= 0) {
    mockSessions[idx].ideaCount = mockSessionIdeas.filter(i => i.sessionId === sessionId).length;
  }
  
  return { success: true };
}

// ========== SCORING API ==========

/**
 * Lấy phiếu chấm của tôi cho 1 ý tưởng
 */
export async function getMyScore(
  sessionId: string,
  ideaId: string,
  memberId: string = 'member-1'
): Promise<{ data: IdeaCouncilScore | null; success: boolean }> {
  await delay(200);
  const score = mockScores.find(
    s => s.sessionId === sessionId && s.ideaId === ideaId && s.councilMemberId === memberId
  );
  return { data: score || null, success: true };
}

/**
 * Lưu tạm phiếu chấm
 */
export async function saveScoreDraft(data: {
  sessionId: string;
  ideaId: string;
  memberId?: string;
  memberName?: string;
  memberRole?: SessionMemberRole;
  noveltyScore: number;
  noveltyComment: string;
  feasibilityScore: number;
  feasibilityComment: string;
  alignmentScore: number;
  alignmentComment: string;
  authorCapacityScore: number;
  authorCapacityComment: string;
  generalComment?: string;
}): Promise<{ data: IdeaCouncilScore; success: boolean }> {
  await delay(300);
  
  const session = mockSessions.find(s => s.id === data.sessionId);
  if (!session || session.status !== 'OPEN') {
    return { data: null as any, success: false };
  }
  
  const memberId = data.memberId || 'member-1';
  const weightedScore = calculateWeightedScore(
    data.noveltyScore,
    data.feasibilityScore,
    data.alignmentScore,
    data.authorCapacityScore
  );
  
  const existingIndex = mockScores.findIndex(
    s => s.sessionId === data.sessionId && s.ideaId === data.ideaId && s.councilMemberId === memberId
  );
  
  const now = new Date().toISOString();
  
  if (existingIndex >= 0) {
    // Update
    const existing = mockScores[existingIndex];
    if (existing.submitted) {
      return { data: existing, success: false }; // Đã gửi rồi, không sửa được
    }
    
    const updated: IdeaCouncilScore = {
      ...existing,
      noveltyScore: data.noveltyScore,
      noveltyComment: data.noveltyComment,
      feasibilityScore: data.feasibilityScore,
      feasibilityComment: data.feasibilityComment,
      alignmentScore: data.alignmentScore,
      alignmentComment: data.alignmentComment,
      authorCapacityScore: data.authorCapacityScore,
      authorCapacityComment: data.authorCapacityComment,
      weightedScore,
      generalComment: data.generalComment,
      updatedAt: now,
    };
    mockScores[existingIndex] = updated;
    return { data: updated, success: true };
  } else {
    // Create
    const member = mockMembers.find(m => m.memberId === memberId) || mockMembers[0];
    const newScore: IdeaCouncilScore = {
      id: generateId(),
      sessionId: data.sessionId,
      ideaId: data.ideaId,
      councilMemberId: memberId,
      councilMemberName: data.memberName || member?.memberName || 'Unknown',
      councilRole: data.memberRole || member?.roleInCouncil || 'UY_VIEN',
      noveltyScore: data.noveltyScore,
      noveltyComment: data.noveltyComment,
      feasibilityScore: data.feasibilityScore,
      feasibilityComment: data.feasibilityComment,
      alignmentScore: data.alignmentScore,
      alignmentComment: data.alignmentComment,
      authorCapacityScore: data.authorCapacityScore,
      authorCapacityComment: data.authorCapacityComment,
      weightedScore,
      generalComment: data.generalComment,
      submitted: false,
      createdAt: now,
      updatedAt: now,
    };
    mockScores.push(newScore);
    return { data: newScore, success: true };
  }
}

/**
 * Gửi phiếu chấm (không thể sửa sau khi gửi)
 */
export async function submitScore(scoreId: string): Promise<{ data: IdeaCouncilScore | null; success: boolean }> {
  await delay(300);
  
  const index = mockScores.findIndex(s => s.id === scoreId);
  if (index === -1) return { data: null, success: false };
  
  const score = mockScores[index];
  if (score.submitted) return { data: score, success: false };
  
  const session = mockSessions.find(s => s.id === score.sessionId);
  if (!session || session.status !== 'OPEN') {
    return { data: null, success: false };
  }
  
  const now = new Date().toISOString();
  const updated: IdeaCouncilScore = {
    ...score,
    submitted: true,
    submittedAt: now,
    updatedAt: now,
  };
  mockScores[index] = updated;
  return { data: updated, success: true };
}

/**
 * Lấy tất cả phiếu chấm cho 1 ý tưởng
 */
export async function getScoresForIdea(
  sessionId: string,
  ideaId: string
): Promise<{ data: IdeaCouncilScore[]; success: boolean }> {
  await delay(200);
  const scores = mockScores.filter(s => s.sessionId === sessionId && s.ideaId === ideaId);
  return { data: scores, success: true };
}

// ========== AGGREGATION API ==========

/**
 * Tính kết quả tổng hợp cho 1 ý tưởng
 */
export async function computeIdeaResult(
  sessionId: string,
  ideaId: string
): Promise<{ data: IdeaCouncilResult | null; success: boolean }> {
  await delay(300);
  
  const session = mockSessions.find(s => s.id === sessionId);
  if (!session) return { data: null, success: false };
  
  const sessionIdea = mockSessionIdeas.find(i => i.sessionId === sessionId && i.ideaId === ideaId);
  if (!sessionIdea) return { data: null, success: false };
  
  const scores = mockScores.filter(s => s.sessionId === sessionId && s.ideaId === ideaId && s.submitted);
  const members = mockMembers.filter(m => m.sessionId === sessionId);
  
  if (scores.length === 0) {
    return { data: null, success: false };
  }
  
  const count = scores.length;
  const avgWeightedScore = Math.round((scores.reduce((sum, s) => sum + s.weightedScore, 0) / count) * 100) / 100;
  const avgNoveltyScore = Math.round((scores.reduce((sum, s) => sum + s.noveltyScore, 0) / count) * 100) / 100;
  const avgFeasibilityScore = Math.round((scores.reduce((sum, s) => sum + s.feasibilityScore, 0) / count) * 100) / 100;
  const avgAlignmentScore = Math.round((scores.reduce((sum, s) => sum + s.alignmentScore, 0) / count) * 100) / 100;
  const avgAuthorCapacityScore = Math.round((scores.reduce((sum, s) => sum + s.authorCapacityScore, 0) / count) * 100) / 100;
  
  const result: IdeaCouncilResult = {
    sessionId,
    ideaId,
    ideaCode: sessionIdea.ideaCode,
    ideaTitle: sessionIdea.ideaTitle,
    avgWeightedScore,
    avgNoveltyScore,
    avgFeasibilityScore,
    avgAlignmentScore,
    avgAuthorCapacityScore,
    submittedCount: count,
    memberCount: members.length,
    recommendation: avgWeightedScore >= THRESHOLD_SCORE ? 'PROPOSE_ORDER' : 'NOT_PROPOSE',
    thresholdScore: THRESHOLD_SCORE,
  };
  
  return { data: result, success: true };
}

/**
 * Tính kết quả tổng hợp cho tất cả ý tưởng trong phiên
 */
export async function computeSessionResults(sessionId: string): Promise<{ data: IdeaCouncilResult[]; success: boolean }> {
  await delay(400);
  
  const sessionIdeas = mockSessionIdeas.filter(i => i.sessionId === sessionId);
  const results: IdeaCouncilResult[] = [];
  
  for (const idea of sessionIdeas) {
    const res = await computeIdeaResult(sessionId, idea.ideaId);
    if (res.data) {
      results.push(res.data);
    }
  }
  
  return { data: results, success: true };
}

/**
 * Áp dụng kết quả vào trạng thái ý tưởng
 * - PROPOSE_ORDER (≥ 7.0) → idea.status = 'PROPOSED_FOR_ORDER'
 * - NOT_PROPOSE (< 7.0) → idea.status = 'REJECTED', rejectedStage = 'HOI_DONG_DE_XUAT'
 * 
 * NOTE: Được gọi tự động khi khóa phiên (closeSession)
 */
export async function applyResultsToIdeas(sessionId: string): Promise<{ 
  success: boolean; 
  proposedCount: number; 
  rejectedCount: number;
}> {
  await delay(200);
  
  const session = mockSessions.find(s => s.id === sessionId);
  if (!session || !['CLOSED', 'OPEN'].includes(session.status)) {
    return { success: false, proposedCount: 0, rejectedCount: 0 };
  }
  
  const results = await computeSessionResults(sessionId);
  
  let proposedCount = 0;
  let rejectedCount = 0;
  
  // Import updateIdeaCouncilResult from ideas service
  const { updateIdeaCouncilResult } = await import('./ideas');
  
  for (const result of results.data) {
    // Cập nhật kết quả vào ý tưởng
    await updateIdeaCouncilResult(result.ideaId, {
      councilSessionId: sessionId,
      councilAvgWeightedScore: result.avgWeightedScore,
      councilAvgNoveltyScore: result.avgNoveltyScore,
      councilAvgFeasibilityScore: result.avgFeasibilityScore,
      councilAvgAlignmentScore: result.avgAlignmentScore,
      councilAvgAuthorCapacityScore: result.avgAuthorCapacityScore,
      councilSubmittedCount: result.submittedCount,
      councilMemberCount: result.memberCount,
      councilRecommendation: result.recommendation,
    });
    
    if (result.recommendation === 'PROPOSE_ORDER') {
      proposedCount++;
    } else {
      rejectedCount++;
    }
  }
  
  return { success: true, proposedCount, rejectedCount };
}

/**
 * Lấy thống kê chấm điểm cho phiên
 */
export async function getSessionScoringStats(sessionId: string): Promise<{
  data: {
    totalIdeas: number;
    totalMembers: number;
    totalExpectedScores: number;
    submittedScores: number;
    pendingScores: number;
    completionRate: number;
  };
  success: boolean;
}> {
  await delay(200);
  
  const ideas = mockSessionIdeas.filter(i => i.sessionId === sessionId);
  const members = mockMembers.filter(m => m.sessionId === sessionId);
  const scores = mockScores.filter(s => s.sessionId === sessionId);
  
  const totalExpected = ideas.length * members.length;
  const submitted = scores.filter(s => s.submitted).length;
  
  return {
    data: {
      totalIdeas: ideas.length,
      totalMembers: members.length,
      totalExpectedScores: totalExpected,
      submittedScores: submitted,
      pendingScores: totalExpected - submitted,
      completionRate: totalExpected > 0 ? Math.round((submitted / totalExpected) * 100) : 0,
    },
    success: true,
  };
}

