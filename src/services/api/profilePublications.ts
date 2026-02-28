/**
 * Profile Publications API Service
 * Quản lý công bố khoa học của cá nhân
 */
import { get, post, put, del, ApiResponse } from '../request';

// Types
export type PublicationRank = 'ISI' | 'SCOPUS' | 'DOMESTIC' | 'OTHER';
export type Quartile = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'NO_Q';
export type DomesticRuleType = 'HDGSNN_SCORE' | 'CONFERENCE_ISBN';
export type AffiliationType = 'UDN_ONLY' | 'MIXED' | 'OUTSIDE';

export interface PublicationAuthor {
  id?: number;
  fullName: string;
  profileId?: number | null;
  authorOrder: number;
  isMainAuthor: boolean;
  isCorresponding: boolean;
  affiliationType: AffiliationType;
  isMultiAffiliationOutsideUdn: boolean;
}

export interface Publication {
  id: number;
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
  source: 'INTERNAL' | 'GOOGLE_SCHOLAR' | 'SCV_DHDN';
  sourceId?: string;
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
  unitCoefficient: number;
  totalConvertedHours: number;
  n: number;
  p: number;
  authorBreakdown: Array<{
    authorName: string;
    authorOrder: number;
    isMainAuthor: boolean;
    isCorresponding: boolean;
    convertedHours: number;
    coefficient: number;
  }>;
  warnings?: string[];
}

// API Functions

/**
 * Lấy danh sách công bố của tôi
 */
export async function listMyPublications(
  params?: PublicationQueryParams
): Promise<ApiResponse<Publication[]>> {
  return get<ApiResponse<Publication[]>>('/api/profile/me/publications', params);
}

/**
 * Tạo công bố mới
 */
export async function createMyPublication(
  payload: Omit<Publication, 'id' | 'createdAt' | 'updatedAt'>
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

/**
 * Lưu danh sách tác giả của công bố
 */
export async function saveMyPublicationAuthors(
  pubId: number,
  authors: PublicationAuthor[]
): Promise<ApiResponse<PublicationAuthor[]>> {
  return put<ApiResponse<PublicationAuthor[]>>(
    `/api/profile/me/publications/${pubId}/authors`,
    { authors }
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

export const AFFILIATION_TYPE_OPTIONS: { value: AffiliationType; label: string }[] = [
  { value: 'UDN_ONLY', label: 'Chỉ ĐH Đà Nẵng' },
  { value: 'MIXED', label: 'Hỗn hợp (có ngoài ĐHĐN)' },
  { value: 'OUTSIDE', label: 'Ngoài ĐHĐN' },
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
