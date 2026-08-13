/**
 * Profile Publications API Service
 * API kết quả NCKH (công bố) của cá nhân
 */
import { get, post, put, del, ApiResponse } from '../request';

// Types
export type PublicationRank = 'ISI' | 'SCOPUS' | 'DOMESTIC' | 'OTHER';
export type Quartile = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'NO_Q';
export type DomesticRuleType = 'HDGSNN_SCORE' | 'CONFERENCE_ISBN';
export type AffiliationType = 'UDN_ONLY' | 'MIXED' | 'OUTSIDE';
/** Giới tính tác giả nhập tay (không chọn từ hồ sơ NCV/sinh viên). */
export type AuthorGender = 'MALE' | 'FEMALE' | 'OTHER';

export const AUTHOR_GENDER_OPTIONS: { value: AuthorGender; label: string }[] = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

const AUTHOR_GENDER_VALUES = new Set<AuthorGender>(['MALE', 'FEMALE', 'OTHER']);

/** Tác giả không liên kết profile_id / student_id — cần nhập giới tính trên form. */
export function laTacGiaNhapTay(
  a: Pick<PublicationAuthor, 'profileId' | 'studentId'>
): boolean {
  return (a.profileId == null || a.profileId === undefined) && (a.studentId == null || a.studentId === undefined);
}

function chuanHoaGioiTinhTacGia(raw: unknown): AuthorGender | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const upper = s.toUpperCase();
  if (upper === 'MALE' || s === 'Nam') return 'MALE';
  if (upper === 'FEMALE' || s === 'Nữ' || s === 'Nu') return 'FEMALE';
  if (upper === 'OTHER' || s === 'Khác' || s === 'Khac') return 'OTHER';
  if (AUTHOR_GENDER_VALUES.has(upper as AuthorGender)) return upper as AuthorGender;
  return null;
}

/** Nhãn hiển thị giới tính trên bảng tác giả. */
export function nhanGioiTinhTacGia(gender?: AuthorGender | null): string {
  return AUTHOR_GENDER_OPTIONS.find((o) => o.value === gender)?.label ?? '—';
}

/** Chuẩn hoá raw gender từ API/lookup về enum FE. */
export const normalizeAuthorGender = chuanHoaGioiTinhTacGia;

/** Danh sách đơn vị trong ĐHĐN cho multi-select cơ quan công tác tác giả. */
export const UDN_AFFILIATION_UNITS = [
  'The University of Danang (Đại học Đà Nẵng)',
  'The University of Danang - University of Science and Technology (Trường Đại học Bách khoa)',
  'The University of Danang - University of Economics (Trường Đại học Kinh tế)',
  'The University of Danang - University of Science and Education (Trường Đại học Sư phạm)',
  'University of Foreign Language Studies - The University of Danang (Trường Đại học Ngoại ngữ)',
  'University of Technology and Education - The University of Danang (Trường Đại học Sư phạm Kỹ thuật)',
  'Vietnam-Korea University of Information and Communication Technology - The University of Danang (Trường Đại học Công nghệ Thông tin và Truyền thông Việt - Hàn)',
  'School of Medicine and Pharmacy - The University of Danang (Trường Y Dược)',
  'The University of Danang Campus in Kon Tum (Phân hiệu Đại học Đà Nẵng tại Kon Tum)',
  'Vietnam-UK Institute for Research and Executive Education - The University of Danang (Viện Nghiên cứu và Đào tạo Việt - Anh)',
  'Danang International Institute of Technology - The University of Danang (Viện Công nghệ Quốc tế DNIIT)',
  'Faculty of Physical Education - The University of Danang (Khoa Giáo dục Thể chất)',
  'Center for Defense and Security Education - The University of Danang (Trung tâm Giáo dục Quốc phòng và An ninh)',
] as const;

export const AUTHOR_WORKPLACE_OTHER_UNIT = 'Other Organization (Đơn vị khác)' as const;
const LEGACY_AUTHOR_WORKPLACE_OTHER_UNIT = 'Đơn vị khác' as const;

/** Lựa chọn cơ quan công tác trên form tác giả (cho phép chọn nhiều). */
export const AUTHOR_AFFILIATION_MULTI_OPTIONS: { value: string; label: string }[] = [
  ...UDN_AFFILIATION_UNITS.map((v) => ({ value: v, label: v })),
  { value: AUTHOR_WORKPLACE_OTHER_UNIT, label: AUTHOR_WORKPLACE_OTHER_UNIT },
];

function uniqueNonEmptyStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const v = String(raw ?? '').trim();
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

/** Suy ra affiliation_type từ danh sách đơn vị người dùng chọn. */
export function deriveAffiliationTypeFromUnits(units: string[]): AffiliationType {
  const picked = uniqueNonEmptyStrings(units);
  const hasOutside = picked.includes(AUTHOR_WORKPLACE_OTHER_UNIT) || picked.includes(LEGACY_AUTHOR_WORKPLACE_OTHER_UNIT);
  const hasUdn = picked.some(
    (v) => v !== AUTHOR_WORKPLACE_OTHER_UNIT && v !== LEGACY_AUTHOR_WORKPLACE_OTHER_UNIT
  );
  if (hasOutside && hasUdn) return 'MIXED';
  if (hasOutside) return 'OUTSIDE';
  return 'UDN_ONLY';
}

/** Đồng bộ dữ liệu cũ: nếu chưa có units thì nội suy từ affiliationType cũ. */
export function normalizeAffiliationUnits(
  units: unknown,
  fallbackAffiliationType: AffiliationType
): string[] {
  const picked = uniqueNonEmptyStrings(units);
  if (picked.length > 0) return picked;
  if (fallbackAffiliationType === 'OUTSIDE') return [AUTHOR_WORKPLACE_OTHER_UNIT];
  if (fallbackAffiliationType === 'MIXED') {
    return [UDN_AFFILIATION_UNITS[0], AUTHOR_WORKPLACE_OTHER_UNIT];
  }
  return [UDN_AFFILIATION_UNITS[0]];
}

/** Chuẩn hoá tác giả từ API về enum hợp lệ của FE, giữ nguyên MIXED để tính đúng điều 1.5. */
export function normalizePublicationAuthor(a: PublicationAuthor & Record<string, unknown>): PublicationAuthor {
  const rawStudent = a.studentId ?? (a as Record<string, unknown>).student_id;
  const studentId =
    rawStudent == null || rawStudent === ''
      ? null
      : Number.isFinite(Number(rawStudent))
        ? Number(rawStudent)
        : null;
  const aff: AffiliationType =
    a.affiliationType === 'UDN_ONLY' || a.affiliationType === 'MIXED' || a.affiliationType === 'OUTSIDE'
      ? a.affiliationType
      : 'OUTSIDE';
  const affiliationUnits = normalizeAffiliationUnits(a.affiliationUnits, aff);
  const derivedAff = deriveAffiliationTypeFromUnits(affiliationUnits);
  const profileId =
    a.profileId == null || a.profileId === ''
      ? null
      : Number.isFinite(Number(a.profileId))
        ? Number(a.profileId)
        : null;
  const rawGender = a.gender ?? (a as Record<string, unknown>).gioi_tinh;
  const gender = chuanHoaGioiTinhTacGia(rawGender);
  const rawContribution =
    a.contributionPercent ?? (a as Record<string, unknown>).contribution_percent;
  const contributionPercent =
    rawContribution == null || rawContribution === '' || !Number.isFinite(Number(rawContribution))
      ? null
      : Number(rawContribution);
  // Vai trò đề xuất: ưu tiên proposalMemberRole, sau đó role từ API
  const rawRole = a.proposalMemberRole ?? (a as Record<string, unknown>).role;
  const roleStr = String(rawRole ?? '')
    .trim()
    .toUpperCase();
  const proposalMemberRole =
    roleStr === 'PRINCIPAL' || roleStr === 'SECRETARY' || roleStr === 'MEMBER'
      ? roleStr
      : undefined;
  return {
    ...a,
    profileId,
    studentId,
    gender,
    affiliationUnits,
    affiliationType: derivedAff,
    isMultiAffiliationOutsideUdn: derivedAff === 'MIXED',
    contributionPercent,
    ...(proposalMemberRole ? { proposalMemberRole } : {}),
  };
}

/** Chuẩn hoá họ tên — khớp với BE khi so dòng chủ hồ sơ */
function chuanHoaHoTen(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Đã có dòng đại diện chủ hồ sơ: cùng profileId (so sánh số) hoặc trùng tên (chuẩn hoá / không phân biệt hoa thường) khi chưa gắn profileId */
function hasOwnerRepresentative(
  authors: PublicationAuthor[],
  ownerProfileId: number,
  ownerFullName: string
): boolean {
  const ownerNorm = chuanHoaHoTen(ownerFullName);
  const ownerTrimLower = ownerFullName.trim().toLowerCase();
  return authors.some((a) => {
    if (a.profileId != null && Number(a.profileId) === Number(ownerProfileId)) return true;
    if (a.profileId != null) return false;
    if (ownerNorm.length >= 2 && chuanHoaHoTen(a.fullName) === ownerNorm) return true;
    if (ownerTrimLower.length > 0 && a.fullName.trim().toLowerCase() === ownerTrimLower) return true;
    return false;
  });
}

/**
 * Luôn có ít nhất một dòng tác giả đại diện chủ hồ sơ (profileId chủ hoặc dòng trùng họ tên chủ).
 * Đã có rồi thì không chèn thêm (tránh mở form edit là nhân đôi "Admin").
 * Nếu chỉ trùng tên mà thiếu profileId: gắn profileId để lần sau khớp số.
 * Nếu thật sự thiếu: chèn dòng đầu, dồn STT; chính/liên hệ mặc định chỉ khi danh sách trước đó rỗng.
 */
export function ensureOwnerAuthorInList(
  authors: PublicationAuthor[],
  ownerProfileId: number,
  ownerFullName: string,
  ownerGender?: AuthorGender | null
): PublicationAuthor[] {
  const normalized = authors.map((a) => normalizePublicationAuthor(a));
  const ownerGenderNorm = ownerGender != null ? chuanHoaGioiTinhTacGia(ownerGender) : null;
  if (hasOwnerRepresentative(normalized, ownerProfileId, ownerFullName)) {
    const ownerNorm = chuanHoaHoTen(ownerFullName);
    const ownerTrimLower = ownerFullName.trim().toLowerCase();
    return normalized.map((a) => {
      if (a.profileId != null && Number(a.profileId) === Number(ownerProfileId)) {
        return a.gender ? a : { ...a, gender: a.gender ?? ownerGenderNorm };
      }
      if (a.profileId != null) return a;
      const nameMatch =
        (ownerNorm.length >= 2 && chuanHoaHoTen(a.fullName) === ownerNorm) ||
        (ownerTrimLower.length > 0 && a.fullName.trim().toLowerCase() === ownerTrimLower);
      if (nameMatch) {
        return {
          ...a,
          profileId: ownerProfileId,
          gender: a.gender ?? ownerGenderNorm,
        };
      }
      return a;
    });
  }
  const displayName = ownerFullName.trim() || 'Tác giả';
  const wasEmpty = normalized.length === 0;
  const bumped = normalized.map((a) => ({
    ...a,
    authorOrder: a.authorOrder + 1,
  }));
  bumped.unshift({
    profileId: ownerProfileId,
    fullName: displayName,
    gender: ownerGenderNorm,
    affiliationUnits: [UDN_AFFILIATION_UNITS[0]],
    authorOrder: 1,
    isTopAuthor: wasEmpty,
    isCorresponding: wasEmpty,
    affiliationType: 'UDN_ONLY' as AffiliationType,
    isMultiAffiliationOutsideUdn: false,
  });
  return bumped;
}

/**
 * Gán lại author_order liên tục 1..n theo thứ tự hiện tại (ổn định khi trùng STT: giữ thứ tự mảng gốc).
 * Dùng trước khi lưu API / sau khi tải — tránh lỗi "Thứ tự tác giả không được trùng" khi STT không liên tục hoặc trùng số.
 */
export function reassignAuthorOrdersSequential(authors: PublicationAuthor[]): PublicationAuthor[] {
  if (authors.length === 0) return [];
  const withIdx = authors.map((a, i) => ({ a, i }));
  withIdx.sort((x, y) => {
    const ox = Number(x.a.authorOrder);
    const oy = Number(y.a.authorOrder);
    const dx = (Number.isFinite(ox) ? ox : 0) - (Number.isFinite(oy) ? oy : 0);
    if (dx !== 0) return dx;
    return x.i - y.i;
  });
  return withIdx.map(({ a }, j) => ({ ...a, authorOrder: j + 1 }));
}

/** Loại dòng tác giả gắn hồ sơ admin — tài khoản vận hành không phải NCV. */
export function loaiBoTacGiaAdminKhoiDanhSach(
  authors: PublicationAuthor[],
  adminProfileId: number
): PublicationAuthor[] {
  return authors.filter(
    (a) => a.profileId == null || Number(a.profileId) !== Number(adminProfileId)
  );
}

/** Chuẩn bị danh sách tác giả trước lưu: NCV tự kê khai vs admin kê khai hộ. */
export function chuanBiDanhSachTacGiaLuu(
  authors: PublicationAuthor[],
  options: {
    ownerProfileId: number;
    ownerFullName: string;
    ownerGender?: AuthorGender | null;
    adminKeKhai?: boolean;
  }
): PublicationAuthor[] {
  const ordered = reassignAuthorOrdersSequential(authors);
  if (options.adminKeKhai) {
    return loaiBoTacGiaAdminKhoiDanhSach(ordered, options.ownerProfileId);
  }
  return ensureOwnerAuthorInList(
    ordered,
    options.ownerProfileId,
    options.ownerFullName,
    options.ownerGender
  );
}

/** Node cây loại kết quả NCKH (GET /api/profile/me/research-output-types/tree) */
export interface ResearchOutputTypeTreeNode {
  id: number;
  code: string;
  name: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  hasRule: boolean;
  ruleKind: string | null;
  /** QĐ 1883: yêu cầu minh chứng cho loại này (text nhiều dòng, từ rule của mục lá). */
  evidenceRequirements?: string | null;
  children: ResearchOutputTypeTreeNode[];
}

export interface PublicationAuthor {
  id?: number;
  /**
   * Khóa dòng chỉ dùng trên FE (không gửi API — payload chỉ lấy field cố định).
   * Giữ ổn định cho dòng “Thêm tác giả” trước khi có id DB; tránh Pro Table ghi đè họ tên sau khi chọn NCV.
   */
  clientRowKey?: string;
  fullName: string;
  profileId?: number | null;
  /** Liên kết bảng students (tác giả là sinh viên). */
  studentId?: number | null;
  /** Bắt buộc khi nhập tay (không có profileId/studentId). */
  gender?: AuthorGender | null;
  authorOrder: number;
  isTopAuthor: boolean;
  isCorresponding: boolean;
  /**
   * Vai trò thành viên đề xuất (PRINCIPAL/SECRETARY/MEMBER).
   * Chỉ dùng khi AuthorsEditor hideRoleColumns — không liên quan tác giả bài báo.
   */
  proposalMemberRole?: 'PRINCIPAL' | 'SECRETARY' | 'MEMBER';
  affiliationUnits: string[];
  affiliationType: AffiliationType;
  isMultiAffiliationOutsideUdn: boolean;
  /** Tỉ lệ % đóng góp (QĐ 1883 điều 1.4) — dùng cho sách/đề tài/sáng kiến. */
  contributionPercent?: number | null;
}

export interface Publication {
  id: number;
  /** Lá danh mục NCKH (bắt buộc khi tạo mới) */
  researchOutputTypeId: number;
  researchOutputType?: { id: number; code: string; name: string; level?: number } | null;
  title: string;
  authors: string;
  correspondingAuthor?: string;
  publicationType: 'JOURNAL' | 'CONFERENCE' | 'BOOK_CHAPTER' | 'BOOK';
  journalOrConference: string;
  /** Đơn vị tài trợ (bài báo khoa học) */
  fundingOrganization?: string | null;
  /** Ngày xuất bản đầy đủ (YYYY-MM-DD) */
  publishedAt?: string | null;
  year?: number;
  academicYear?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  rank?: PublicationRank;
  quartile?: Quartile;
  domesticRuleType?: DomesticRuleType;
  hdgsnnScore?: number;
  doi?: string;
  issn?: string;
  isbn?: string;
  url?: string;
  /** Link minh chứng mức xếp hạng Q (Scimago/WoS) */
  qRankUrl?: string | null;
  /** Link danh mục tạp chí uy tín (HĐGSNN/WoS/Scopus) */
  reputableListUrl?: string | null;
  /** Xếp loại nghiệm thu (đề tài rule MULTIPLY_C) — map sang hệ số c. */
  acceptanceGrade?: 'EXCELLENT' | 'PASS_ON_TIME' | 'PASS_LATE' | null;
  publicationStatus: 'PUBLISHED' | 'ACCEPTED' | 'UNDER_REVIEW';
  /** Trạng thái duyệt nội bộ */
  reviewStatus?: 'NEW' | 'CORRECTION_REQUESTED' | 'CORRECTED' | 'APPROVED';
  correctionReason?: string | null;
  source: 'INTERNAL' | 'GOOGLE_SCHOLAR' | 'SCV_DHDN' | 'OPENALEX';
  sourceId?: string;
  needsIndexConfirmation?: boolean;
  indexMappedCode?: string;
  indexMappingReason?: string;
  verifiedByNcv: boolean;
  approvedInternal?: boolean;
  attachmentUrl?: string;
  structuredAuthors?: PublicationAuthor[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicationQueryParams {
  rank?: PublicationRank;
  academicYear?: string;
  q?: string;
}

export interface ConvertedHoursBreakdown {
  baseHours: number;
  /** Hệ số a mục 1.1 — chỉ dùng khi rule công bố là MULTIPLY_A; loại khác null (hiển thị NA) */
  unitCoefficient: number | null;
  /** Mã rule_kind từ backend (FIXED, MULTIPLY_A, …) — phục vụ mô tả công thức trên UI */
  ruleKind?: string | null;
  /** Giải thích unitCoefficient hoặc lý do không áp dụng a */
  unitCoefficientReason?: string | null;
  /** Điểm danh mục P0 trước chia tác giả */
  basePoints?: number;
  /** Tổng giờ công trình B (sau B0×a, trước chia n/p) — khác phần giờ một NCV */
  poolHoursB?: number;
  /** Tổng điểm công trình P theo loại kết quả */
  poolPointsP?: number;
  totalConvertedHours: number;
  /** Điểm quy đổi phần NCV đang xem */
  totalConvertedPoints?: number;
  /** B (pool) — trùng poolHoursB nếu có */
  totalHours?: number | null;
  /** P (pool) — trùng poolPointsP nếu có */
  totalPoints?: number | null;
  n: number;
  p: number;
  authorBreakdown: Array<{
    authorName: string;
    authorOrder: number;
    isTopAuthor: boolean;
    isCorresponding: boolean;
    convertedHours: number;
    convertedPoints?: number;
    isViewerRow?: boolean;
    coefficient: number;
  }>;
  warnings?: string[];
  affiliationCompositeA?: number | null;
  authorUnitFactor?: number;
}

// API Functions

/** Một hồ sơ khoa học trả về từ lookup tác giả (API /api/lookup/author-profiles) */
export interface AuthorProfileLookupItem {
  id: number;
  fullName: string;
  workEmail: string;
  degree?: string | null;
  academicTitle?: string | null;
  organization: string;
  faculty: string | null;
  department: string | null;
  status: string;
  gender?: AuthorGender | null;
}

/**
 * Lookup hồ sơ NCV dùng chung — GET /api/lookup/author-profiles (chỉ cần đăng nhập).
 */
export async function lookupAuthorProfiles(
  q: string,
  limit = 20
): Promise<AuthorProfileLookupItem[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const res = await get<ApiResponse<AuthorProfileLookupItem[]>>(
    '/api/lookup/author-profiles',
    { q: trimmed, limit }
  );
  if (!res.success || !Array.isArray(res.data)) return [];
  /** Backend/proxy có thể trả snake_case hoặc tên cột khác — gom về fullName để ô họ tên nhận đúng sau khi chọn. */
  return res.data.map((row: Record<string, unknown>) => {
    const hoTen =
      [row.fullName, row.full_name, row.name, row.displayName, row.display_name, row.hoTen, row.ho_ten].find(
        (v): v is string => typeof v === 'string' && v.trim().length > 0
      )?.trim() ?? '';
    const degreeRaw = row.degree ?? row.hoc_vi;
    const academicTitleRaw = row.academicTitle ?? row.academic_title ?? row.hoc_ham;
    return {
      id: Number(row.id) || 0,
      fullName: hoTen,
      workEmail: String(row.workEmail ?? row.work_email ?? ''),
      degree: typeof degreeRaw === 'string' ? degreeRaw : null,
      academicTitle: typeof academicTitleRaw === 'string' ? academicTitleRaw : null,
      organization: String(row.organization ?? row.co_quan_cong_tac ?? ''),
      faculty: (row.faculty as string | null) ?? null,
      department: (row.department as string | null) ?? null,
      status: String(row.status ?? ''),
      gender: chuanHoaGioiTinhTacGia(row.gender ?? row.gioi_tinh),
    };
  }).filter((r) => r.id > 0);
}

/** Một sinh viên trả về từ lookup (API /api/lookup/author-students) */
export interface AuthorStudentLookupItem {
  id: number;
  fullName: string | null;
  studentCode?: string | null;
  schoolEmail?: string | null;
  personalEmail?: string | null;
  classCode?: string | null;
  className?: string | null;
  majorName?: string | null;
  department?: string | null;
  status?: string | null;
  gender?: AuthorGender | null;
}

/**
 * Lookup sinh viên dùng chung — GET /api/lookup/author-students (chỉ cần đăng nhập).
 */
export async function lookupAuthorStudents(
  q: string,
  limit = 20
): Promise<AuthorStudentLookupItem[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const res = await get<ApiResponse<AuthorStudentLookupItem[]>>(
    '/api/lookup/author-students',
    { q: trimmed, limit }
  );
  if (!res.success || !Array.isArray(res.data)) return [];
  return res.data
    .map((row: Record<string, unknown>) => {
      const hoTen =
        [row.fullName, row.full_name, row.name, row.hoTen, row.ho_ten].find(
          (v): v is string => typeof v === 'string' && v.trim().length > 0
        )?.trim() ?? '';
      return {
        id: Number(row.id) || 0,
        fullName: hoTen || null,
        studentCode:
          typeof (row.studentCode ?? row.student_code) === 'string'
            ? String(row.studentCode ?? row.student_code)
            : null,
        schoolEmail: String(row.schoolEmail ?? row.school_email ?? '') || null,
        personalEmail: String(row.personalEmail ?? row.personal_email ?? '') || null,
        classCode:
          typeof (row.classCode ?? row.class_code) === 'string'
            ? String(row.classCode ?? row.class_code)
            : null,
        className:
          typeof (row.className ?? row.class_name) === 'string'
            ? String(row.className ?? row.class_name)
            : null,
        majorName:
          typeof (row.majorName ?? row.major_name) === 'string'
            ? String(row.majorName ?? row.major_name)
            : null,
        department:
          typeof row.department === 'string'
            ? row.department
            : typeof (row.department as { name?: string } | null)?.name === 'string'
              ? (row.department as { name: string }).name
              : null,
        status: typeof row.status === 'string' ? row.status : null,
        gender: chuanHoaGioiTinhTacGia(row.gender ?? row.gioi_tinh),
      };
    })
    .filter((r) => r.id > 0);
}

/**
 * Lấy danh sách công bố của tôi
 */
export async function listMyPublications(
  params?: PublicationQueryParams
): Promise<ApiResponse<Publication[]>> {
  return get<ApiResponse<Publication[]>>('/api/profile/me/publications', params);
}

/**
 * Cây danh mục loại kết quả NCKH (chỉ node đang bật) — chọn lá khi khai báo công bố.
 */
export async function getResearchOutputTypesTree(): Promise<ApiResponse<ResearchOutputTypeTreeNode[]>> {
  return get<ApiResponse<ResearchOutputTypeTreeNode[]>>('/api/profile/me/research-output-types/tree');
}

/** Chuẩn hoá node cây cho Ant Design Cascader */
export function buildResearchOutputCascaderOptions(nodes: ResearchOutputTypeTreeNode[]) {
  return nodes.map((n) => ({
    value: n.id,
    label: n.name,
    code: n.code,
    ruleKind: n.ruleKind,
    children: n.children?.length ? buildResearchOutputCascaderOptions(n.children) : undefined,
  }));
}

function chuanHoaIdLoaiNckh(id: number | string | undefined | null): number | null {
  if (id == null || id === '') return null;
  const n = Number(id);
  return Number.isFinite(n) ? n : null;
}

/** ID loại NCKH trên bản ghi publication (ưu tiên cột, fallback object lồng). */
export function layResearchOutputTypeId(pub: {
  researchOutputTypeId?: number | string | null;
  researchOutputType?: { id: number | string } | null;
}): number | null {
  return chuanHoaIdLoaiNckh(pub.researchOutputTypeId ?? pub.researchOutputType?.id ?? null);
}

export function findResearchOutputPathById(
  nodes: ResearchOutputTypeTreeNode[],
  targetId: number | string | undefined | null,
  acc: number[] = []
): number[] | null {
  const target = chuanHoaIdLoaiNckh(targetId);
  if (target == null) return null;
  for (const n of nodes) {
    const path = [...acc, n.id];
    if (Number(n.id) === target) return path;
    if (n.children?.length) {
      const sub = findResearchOutputPathById(n.children, target, path);
      if (sub) return sub;
    }
  }
  return null;
}

/** KQNC thuộc nhóm gốc `rootTypeId` (node gốc trên cây hoặc tổ tiên của loại lá). */
export function publicationThuocNhomGoc(
  tree: ResearchOutputTypeTreeNode[],
  pub: {
    researchOutputTypeId?: number | string | null;
    researchOutputType?: { id: number | string } | null;
  },
  rootTypeId: number | string | null | undefined,
): boolean {
  const root = chuanHoaIdLoaiNckh(rootTypeId);
  if (root == null) return true;
  const typeId = layResearchOutputTypeId(pub);
  if (typeId == null) return false;
  const path = findResearchOutputPathById(tree, typeId);
  return path != null && path.some((id) => Number(id) === root);
}

export function findResearchOutputNodeById(
  nodes: ResearchOutputTypeTreeNode[],
  targetId: number
): ResearchOutputTypeTreeNode | null {
  const target = Number(targetId);
  for (const n of nodes) {
    if (Number(n.id) === target) return n;
    if (n.children?.length) {
      const f = findResearchOutputNodeById(n.children, target);
      if (f) return f;
    }
  }
  return null;
}

/** Nhãn loại KQNC theo cấp — cột: level 2 + lá; tooltip: đủ 3 cấp. */
export type NhanLoaiKqncTheoCap = {
  level1: string | null;
  level2: string | null;
  leaf: string;
};

export function layNhanLoaiKqncTheoCap(
  tree: ResearchOutputTypeTreeNode[],
  pub: {
    researchOutputTypeId?: number | string | null;
    researchOutputType?: { id?: number | string; name?: string; level?: number } | null;
  },
): NhanLoaiKqncTheoCap | null {
  const typeId = layResearchOutputTypeId(pub);
  const leafFallback = pub.researchOutputType?.name?.trim();
  if (typeId == null) {
    return leafFallback ? { level1: null, level2: null, leaf: leafFallback } : null;
  }

  const path = findResearchOutputPathById(tree, typeId);
  if (!path?.length) {
    return leafFallback ? { level1: null, level2: null, leaf: leafFallback } : null;
  }

  const chain: ResearchOutputTypeTreeNode[] = [];
  let siblings = tree;
  for (const id of path) {
    const node = siblings.find((n) => Number(n.id) === Number(id));
    if (!node) break;
    chain.push(node);
    siblings = node.children ?? [];
  }

  const leafNode = chain[chain.length - 1];
  const level1Node = chain.find((n) => n.level === 1) ?? (chain.length >= 1 ? chain[0] : undefined);
  const level2Node = chain.find((n) => n.level === 2) ?? (chain.length >= 2 ? chain[1] : undefined);

  return {
    level1: level1Node?.name ?? null,
    level2: level2Node?.name ?? null,
    leaf: leafNode?.name ?? leafFallback ?? '—',
  };
}

/**
 * Tạo công bố mới
 */
export async function createMyPublication(
  payload: Omit<Publication, 'id' | 'createdAt' | 'updatedAt' | 'researchOutputType'>
): Promise<ApiResponse<Publication>> {
  return post<ApiResponse<Publication>>('/api/profile/me/publications', payload);
}

/**
 * Cập nhật công bố
 */
export async function updateMyPublication(
  id: number,
  payload: Partial<Publication>
): Promise<ApiResponse<Publication>> {
  return put<ApiResponse<Publication>>(`/api/profile/me/publications/${id}`, payload);
}

/**
 * Xóa công bố
 */
export async function deleteMyPublication(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/profile/me/publications/${id}`);
}

/**
 * Lấy danh sách tác giả của công bố
 */
export async function getMyPublicationAuthors(
  pubId: number
): Promise<ApiResponse<PublicationAuthor[]>> {
  return get<ApiResponse<PublicationAuthor[]>>(
    `/api/profile/me/publications/${pubId}/authors`
  );
}

/** Danh sách tác giả khi xem hồ sơ người khác (PHONG_KH / ADMIN). */
export async function getProfilePublicationAuthors(
  profileId: number,
  pubId: number
): Promise<ApiResponse<PublicationAuthor[]>> {
  return get<ApiResponse<PublicationAuthor[]>>(
    `/api/profiles/${profileId}/publications/${pubId}/authors`
  );
}

/** Chuỗi số → id DB; tránh mất id khi Pro Table trả id kiểu string */
function coerceAuthorRowId(id: PublicationAuthor['id']): number | undefined {
  if (typeof id === 'number' && Number.isFinite(id)) return id;
  if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id);
  return undefined;
}

function coerceProfileId(v: PublicationAuthor['profileId']): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function coerceStudentId(v: PublicationAuthor['studentId']): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Body PUT authors theo schema Vine (snake_case) trên API. */
function publicationAuthorToApiPayload(a: PublicationAuthor) {
  const nhapTay = laTacGiaNhapTay(a);
  return {
    id: coerceAuthorRowId(a.id),
    profile_id: coerceProfileId(a.profileId),
    student_id: coerceStudentId(a.studentId),
    gender: nhapTay ? a.gender ?? null : null,
    full_name: a.fullName,
    affiliation_units: uniqueNonEmptyStrings(a.affiliationUnits),
    author_order: a.authorOrder,
    is_top_author: a.isTopAuthor,
    is_corresponding: a.isCorresponding,
    affiliation_type: a.affiliationType,
    is_multi_affiliation_outside_udn: a.isMultiAffiliationOutsideUdn,
    contribution_percent: a.contributionPercent ?? null,
  };
}

/**
 * Lưu danh sách tác giả của công bố
 */
export async function saveMyPublicationAuthors(
  pubId: number,
  authors: PublicationAuthor[]
): Promise<ApiResponse<PublicationAuthor[]>> {
  return put<ApiResponse<PublicationAuthor[]>>(
    `/api/profile/me/publications/${pubId}/authors`,
    { authors: authors.map(publicationAuthorToApiPayload) }
  );
}

/**
 * Xem trước quy đổi giờ NCKH của công bố
 */
export async function previewPublicationConvertedHours(
  pubId: number,
  options?: { profileId?: number }
): Promise<ApiResponse<ConvertedHoursBreakdown>> {
  const params =
    options?.profileId != null && Number.isFinite(options.profileId)
      ? { profile_id: options.profileId }
      : undefined;
  return get<ApiResponse<ConvertedHoursBreakdown>>(
    `/api/kpis/publications/${pubId}/breakdown`,
    params
  );
}

// Constants
export const RANK_OPTIONS: { value: PublicationRank; label: string }[] = [
  { value: 'ISI', label: 'ISI' },
  { value: 'SCOPUS', label: 'Scopus' },
  { value: 'DOMESTIC', label: 'Trong nước' },
  { value: 'OTHER', label: 'Khác' },
];

export const QUARTILE_OPTIONS: { value: Quartile; label: string }[] = [
  { value: 'Q1', label: 'Q1' },
  { value: 'Q2', label: 'Q2' },
  { value: 'Q3', label: 'Q3' },
  { value: 'Q4', label: 'Q4' },
  { value: 'NO_Q', label: 'Không xếp hạng Q' },
];

export const DOMESTIC_RULE_TYPE_OPTIONS: { value: DomesticRuleType; label: string }[] = [
  { value: 'HDGSNN_SCORE', label: 'Điểm HĐGSNN' },
  { value: 'CONFERENCE_ISBN', label: 'Hội thảo có ISBN' },
];

/** Giữ cho chỗ khác cần đủ 3 giá trị KPI; form tác giả dùng AUTHOR_WORKPLACE_OPTIONS. */
export const AFFILIATION_TYPE_OPTIONS: { value: AffiliationType; label: string }[] = [
  { value: 'UDN_ONLY', label: 'Đơn vị trong ĐHĐN' },
  { value: 'MIXED', label: 'Hỗn hợp (có ngoài ĐHĐN)' },
  { value: 'OUTSIDE', label: AUTHOR_WORKPLACE_OTHER_UNIT },
];

/**
 * Tạo danh sách năm học (academic year) gần đây
 */
export function generateAcademicYears(count: number = 10): string[] {
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let i = 0; i < count; i++) {
    const startYear = currentYear - i;
    years.push(`${startYear}-${startYear + 1}`);
  }
  return years;
}
