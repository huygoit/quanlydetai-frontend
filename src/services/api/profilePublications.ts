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
export function normalizePublicationAuthor(a: PublicationAuthor): PublicationAuthor {
  const aff: AffiliationType =
    a.affiliationType === 'UDN_ONLY' || a.affiliationType === 'MIXED' || a.affiliationType === 'OUTSIDE'
      ? a.affiliationType
      : 'OUTSIDE';
  const affiliationUnits = normalizeAffiliationUnits(a.affiliationUnits, aff);
  const derivedAff = deriveAffiliationTypeFromUnits(affiliationUnits);
  return {
    ...a,
    affiliationUnits,
    affiliationType: derivedAff,
    isMultiAffiliationOutsideUdn: derivedAff === 'MIXED',
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
  ownerFullName: string
): PublicationAuthor[] {
  const normalized = authors.map((a) => normalizePublicationAuthor(a));
  if (hasOwnerRepresentative(normalized, ownerProfileId, ownerFullName)) {
    const ownerNorm = chuanHoaHoTen(ownerFullName);
    const ownerTrimLower = ownerFullName.trim().toLowerCase();
    return normalized.map((a) => {
      if (a.profileId != null) return a;
      const nameMatch =
        (ownerNorm.length >= 2 && chuanHoaHoTen(a.fullName) === ownerNorm) ||
        (ownerTrimLower.length > 0 && a.fullName.trim().toLowerCase() === ownerTrimLower);
      if (nameMatch) return { ...a, profileId: ownerProfileId };
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
    affiliationUnits: [UDN_AFFILIATION_UNITS[0]],
    authorOrder: 1,
    isMainAuthor: wasEmpty,
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
  authorOrder: number;
  isMainAuthor: boolean;
  isCorresponding: boolean;
  affiliationUnits: string[];
  affiliationType: AffiliationType;
  isMultiAffiliationOutsideUdn: boolean;
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
  publicationStatus: 'PUBLISHED' | 'ACCEPTED' | 'UNDER_REVIEW';
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
  /** Hệ số a QĐ trên cả nhóm tác giả (VD cùng ĐHĐN = 2) */
  unitCoefficient: number;
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
  n: number;
  p: number;
  authorBreakdown: Array<{
    authorName: string;
    authorOrder: number;
    isMainAuthor: boolean;
    isCorresponding: boolean;
    convertedHours: number;
    convertedPoints?: number;
    isViewerRow?: boolean;
    coefficient: number;
  }>;
  warnings?: string[];
  affiliationCompositeA?: number;
  authorUnitFactor?: number;
}

// API Functions

/** Một hồ sơ khoa học trả về từ lookup tác giả (API /api/profile/me/author-profiles-lookup) */
export interface AuthorProfileLookupItem {
  id: number;
  fullName: string;
  workEmail: string;
  organization: string;
  faculty: string | null;
  department: string | null;
  status: string;
}

/**
 * Tìm hồ sơ nội bộ để gắn profile_id cho dòng tác giả (từ 2 ký tự trở lên).
 */
export async function lookupAuthorProfiles(
  q: string,
  limit = 20
): Promise<AuthorProfileLookupItem[]> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return [];
  const res = await get<ApiResponse<AuthorProfileLookupItem[]>>(
    '/api/profile/me/author-profiles-lookup',
    { q: trimmed, limit }
  );
  if (!res.success || !Array.isArray(res.data)) return [];
  /** Backend/proxy có thể trả snake_case hoặc tên cột khác — gom về fullName để ô họ tên nhận đúng sau khi chọn. */
  return res.data.map((row: Record<string, unknown>) => {
    const hoTen =
      [row.fullName, row.full_name, row.name, row.displayName, row.display_name, row.hoTen, row.ho_ten].find(
        (v): v is string => typeof v === 'string' && v.trim().length > 0
      )?.trim() ?? '';
    return {
    id: Number(row.id) || 0,
    fullName: hoTen,
    workEmail: String(row.workEmail ?? row.work_email ?? ''),
    organization: String(row.organization ?? ''),
    faculty: (row.faculty as string | null) ?? null,
    department: (row.department as string | null) ?? null,
    status: String(row.status ?? ''),
  };
  }).filter((r) => r.id > 0);
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

export function findResearchOutputPathById(
  nodes: ResearchOutputTypeTreeNode[],
  targetId: number,
  acc: number[] = []
): number[] | null {
  for (const n of nodes) {
    const path = [...acc, n.id];
    if (n.id === targetId) return path;
    if (n.children?.length) {
      const sub = findResearchOutputPathById(n.children, targetId, path);
      if (sub) return sub;
    }
  }
  return null;
}

export function findResearchOutputNodeById(
  nodes: ResearchOutputTypeTreeNode[],
  targetId: number
): ResearchOutputTypeTreeNode | null {
  for (const n of nodes) {
    if (n.id === targetId) return n;
    if (n.children?.length) {
      const f = findResearchOutputNodeById(n.children, targetId);
      if (f) return f;
    }
  }
  return null;
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

/** Body PUT authors theo schema Vine (snake_case) trên API. */
function publicationAuthorToApiPayload(a: PublicationAuthor) {
  return {
    id: coerceAuthorRowId(a.id),
    profile_id: coerceProfileId(a.profileId),
    full_name: a.fullName,
    affiliation_units: uniqueNonEmptyStrings(a.affiliationUnits),
    author_order: a.authorOrder,
    is_main_author: a.isMainAuthor,
    is_corresponding: a.isCorresponding,
    affiliation_type: a.affiliationType,
    is_multi_affiliation_outside_udn: a.isMultiAffiliationOutsideUdn,
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
  pubId: number
): Promise<ApiResponse<ConvertedHoursBreakdown>> {
  return get<ApiResponse<ConvertedHoursBreakdown>>(
    `/api/kpis/publications/${pubId}/breakdown`
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
