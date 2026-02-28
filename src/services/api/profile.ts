/**
 * Scientific Profile API Service (Hồ sơ khoa học)
 */
import { get, post, put, del, ApiResponse, PaginatedResponse } from '../request';

// Types
export type ProfileStatus = 'DRAFT' | 'UPDATED' | 'VERIFIED' | 'NEED_MORE_INFO';
export type Gender = 'Nam' | 'Nữ' | 'Khác';
export type Degree = 'Cử nhân' | 'Thạc sĩ' | 'Tiến sĩ' | 'Khác';
export type AcademicTitle = 'PGS' | 'GS' | 'Không';
export type AttachmentType = 'CV_PDF' | 'DEGREE' | 'CERTIFICATE' | 'OTHER';
export type PublicationSource = 'INTERNAL' | 'GOOGLE_SCHOLAR' | 'SCV_DHDN';
export type PublicationType = 'JOURNAL' | 'CONFERENCE' | 'BOOK_CHAPTER' | 'BOOK';
export type PublicationRank = 'ISI' | 'SCOPUS' | 'DOMESTIC' | 'OTHER';
export type PublicationStatus = 'PUBLISHED' | 'ACCEPTED' | 'UNDER_REVIEW';
export type AuthorRole = 'CHU_TRI' | 'DONG_TAC_GIA';
export type ProjectRole = 'CHU_NHIEM' | 'THAM_GIA';
export type ProjectStatus = 'DANG_THUC_HIEN' | 'DA_NGHIEM_THU' | 'TAM_DUNG';
export type VerifyAction = 'VERIFY' | 'REQUEST_MORE_INFO' | 'CANCEL_VERIFY';
export type SuggestionStatus = 'PENDING' | 'CONFIRMED' | 'IGNORED';

export interface ProfileLanguage {
  id: number;
  language: string;
  level?: string;
  certificate?: string;
  certificateUrl?: string;
}

export interface ProfileAttachment {
  id: number;
  type: AttachmentType;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface LinkedProject {
  id: number;
  code: string;
  title: string;
  level: string;
  role: ProjectRole;
  startDate?: string;
  endDate?: string;
  status: ProjectStatus;
  decisionNo?: string;
}

export interface PublicationItem {
  id: number;
  title: string;
  authors: string;
  correspondingAuthor?: string;
  myRole?: AuthorRole;
  publicationType: PublicationType;
  journalOrConference: string;
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  rank?: PublicationRank;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  doi?: string;
  issn?: string;
  isbn?: string;
  url?: string;
  publicationStatus: PublicationStatus;
  source: PublicationSource;
  sourceId?: string;
  verifiedByNcv: boolean;
  approvedInternal?: boolean;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicationSuggestion {
  id: number;
  profileId: number;
  source: PublicationSource;
  title: string;
  year?: number;
  journalOrConference?: string;
  authors?: string;
  url?: string;
  publicationType?: PublicationType;
  status: SuggestionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileVerifyLog {
  id: number;
  profileId: number;
  action: VerifyAction;
  note?: string;
  actorRole: 'PHONG_KH' | 'ADMIN';
  actorName: string;
  createdAt: string;
}

export interface ScientificProfile {
  id: number;
  userId: number;
  fullName: string;
  dateOfBirth?: string;
  gender?: Gender;
  workEmail: string;
  phone?: string;
  orcid?: string;
  googleScholarUrl?: string;
  scopusId?: string;
  researchGateUrl?: string;
  personalWebsite?: string;
  avatarUrl?: string;
  bio?: string;
  organization: string;
  faculty?: string;
  department?: string;
  currentTitle?: string;
  managementRole?: string;
  startWorkingAt?: string;
  degree?: Degree;
  academicTitle?: AcademicTitle;
  degreeYear?: number;
  degreeInstitution?: string;
  degreeCountry?: string;
  mainResearchArea?: string;
  subResearchAreas?: string[];
  keywords?: string[];
  languages?: ProfileLanguage[];
  attachments?: ProfileAttachment[];
  linkedProjects?: LinkedProject[];
  publications?: PublicationItem[];
  status: ProfileStatus;
  completeness: number;
  verifiedAt?: string;
  verifiedBy?: string;
  needMoreInfoReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileQueryParams {
  keyword?: string;
  faculty?: string;
  degree?: Degree;
  mainResearchArea?: string;
  status?: ProfileStatus;
  page?: number;
  perPage?: number;
}

// API Functions - Profile của bản thân

/**
 * Lấy hồ sơ của mình
 */
export async function getMyProfile(): Promise<ApiResponse<ScientificProfile | null>> {
  return get<ApiResponse<ScientificProfile | null>>('/api/profile/me');
}

/**
 * Tạo hồ sơ mới
 */
export async function createMyProfile(data: {
  fullName: string;
  workEmail: string;
  organization: string;
}): Promise<ApiResponse<ScientificProfile>> {
  return post<ApiResponse<ScientificProfile>>('/api/profile/me', data);
}

/**
 * Cập nhật hồ sơ
 */
export async function updateMyProfile(data: Partial<ScientificProfile>): Promise<ApiResponse<ScientificProfile>> {
  return put<ApiResponse<ScientificProfile>>('/api/profile/me', data);
}

/**
 * Gửi hồ sơ để xác thực
 */
export async function submitProfile(): Promise<ApiResponse<ScientificProfile>> {
  return post<ApiResponse<ScientificProfile>>('/api/profile/me/submit');
}

// Languages sub-resource

export async function getMyLanguages(): Promise<ApiResponse<ProfileLanguage[]>> {
  return get<ApiResponse<ProfileLanguage[]>>('/api/profile/me/languages');
}

export async function addLanguage(data: Omit<ProfileLanguage, 'id'>): Promise<ApiResponse<ProfileLanguage>> {
  return post<ApiResponse<ProfileLanguage>>('/api/profile/me/languages', data);
}

export async function updateLanguage(id: number, data: Partial<ProfileLanguage>): Promise<ApiResponse<ProfileLanguage>> {
  return put<ApiResponse<ProfileLanguage>>(`/api/profile/me/languages/${id}`, data);
}

export async function deleteLanguage(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/profile/me/languages/${id}`);
}

// Attachments sub-resource

export async function getMyAttachments(): Promise<ApiResponse<ProfileAttachment[]>> {
  return get<ApiResponse<ProfileAttachment[]>>('/api/profile/me/attachments');
}

export async function deleteAttachment(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/profile/me/attachments/${id}`);
}

// Publications sub-resource

export async function getMyPublications(): Promise<ApiResponse<PublicationItem[]>> {
  return get<ApiResponse<PublicationItem[]>>('/api/profile/me/publications');
}

export async function addPublication(data: Omit<PublicationItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PublicationItem>> {
  return post<ApiResponse<PublicationItem>>('/api/profile/me/publications', data);
}

export async function updatePublication(id: number, data: Partial<PublicationItem>): Promise<ApiResponse<PublicationItem>> {
  return put<ApiResponse<PublicationItem>>(`/api/profile/me/publications/${id}`, data);
}

export async function deletePublication(id: number): Promise<ApiResponse<null>> {
  return del<ApiResponse<null>>(`/api/profile/me/publications/${id}`);
}

// Publication suggestions

export async function getMySuggestions(): Promise<ApiResponse<PublicationSuggestion[]>> {
  return get<ApiResponse<PublicationSuggestion[]>>('/api/profile/me/suggestions');
}

export async function syncGoogleScholar(): Promise<ApiResponse<{ data: PublicationSuggestion[]; newCount: number }>> {
  return post<ApiResponse<{ data: PublicationSuggestion[]; newCount: number }>>('/api/profile/me/suggestions/sync-google-scholar');
}

export async function syncSCV(): Promise<ApiResponse<{ data: PublicationSuggestion[]; newCount: number }>> {
  return post<ApiResponse<{ data: PublicationSuggestion[]; newCount: number }>>('/api/profile/me/suggestions/sync-scv');
}

export async function confirmSuggestion(id: number): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>(`/api/profile/me/suggestions/${id}/confirm`);
}

export async function ignoreSuggestion(id: number): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>(`/api/profile/me/suggestions/${id}/ignore`);
}

// API Functions - Admin/Phòng KH

/**
 * Lấy danh sách hồ sơ (PHONG_KH, ADMIN)
 */
export async function queryProfiles(params?: ProfileQueryParams): Promise<PaginatedResponse<ScientificProfile>> {
  return get<PaginatedResponse<ScientificProfile>>('/api/profiles', params);
}

/**
 * Lấy chi tiết hồ sơ
 */
export async function getProfileById(id: number): Promise<ApiResponse<ScientificProfile>> {
  return get<ApiResponse<ScientificProfile>>(`/api/profiles/${id}`);
}

/**
 * Xác thực hồ sơ (PHONG_KH, ADMIN)
 */
export async function verifyProfile(id: number, note: string): Promise<ApiResponse<ScientificProfile>> {
  return post<ApiResponse<ScientificProfile>>(`/api/profiles/${id}/verify`, { note });
}

/**
 * Yêu cầu bổ sung (PHONG_KH, ADMIN)
 */
export async function requestMoreInfo(id: number, note: string): Promise<ApiResponse<ScientificProfile>> {
  return post<ApiResponse<ScientificProfile>>(`/api/profiles/${id}/request-more-info`, { note });
}

/**
 * Lấy lịch sử xác thực
 */
export async function getVerifyLogs(profileId: number): Promise<ApiResponse<ProfileVerifyLog[]>> {
  return get<ApiResponse<ProfileVerifyLog[]>>(`/api/profiles/${profileId}/verify-logs`);
}

// Constants
export const PROFILE_STATUS_MAP: Record<ProfileStatus, { text: string; color: string }> = {
  DRAFT: { text: 'Nháp', color: 'default' },
  UPDATED: { text: 'Đã cập nhật', color: 'processing' },
  VERIFIED: { text: 'Đã xác thực', color: 'success' },
  NEED_MORE_INFO: { text: 'Yêu cầu bổ sung', color: 'warning' },
};

export const DEGREE_OPTIONS: Degree[] = ['Cử nhân', 'Thạc sĩ', 'Tiến sĩ', 'Khác'];
export const ACADEMIC_TITLE_OPTIONS: AcademicTitle[] = ['Không', 'PGS', 'GS'];

export const RESEARCH_AREAS = [
  'Công nghệ thông tin',
  'Kinh tế',
  'Y học',
  'Nông nghiệp',
  'Giáo dục',
  'Kỹ thuật',
  'Khoa học tự nhiên',
  'Khoa học xã hội',
  'Luật',
  'Kiến trúc',
];

export const FACULTIES = [
  'Khoa Công nghệ thông tin',
  'Khoa Kinh tế',
  'Khoa Y',
  'Khoa Nông nghiệp',
  'Khoa Sư phạm',
  'Khoa Kỹ thuật',
  'Khoa Khoa học tự nhiên',
  'Khoa Luật',
  'Phòng KH-CNTT-HTQT',
];

export const LANGUAGES = ['Tiếng Anh', 'Tiếng Pháp', 'Tiếng Đức', 'Tiếng Nhật', 'Tiếng Trung', 'Tiếng Hàn'];

export const PUBLICATION_TYPE_MAP: Record<PublicationType, { text: string; color: string }> = {
  JOURNAL: { text: 'Bài báo tạp chí', color: 'blue' },
  CONFERENCE: { text: 'Bài hội thảo', color: 'green' },
  BOOK_CHAPTER: { text: 'Chương sách', color: 'orange' },
  BOOK: { text: 'Sách chuyên khảo', color: 'purple' },
};

export const PUBLICATION_RANK_MAP: Record<PublicationRank, { text: string; color: string }> = {
  ISI: { text: 'ISI', color: 'red' },
  SCOPUS: { text: 'Scopus', color: 'volcano' },
  DOMESTIC: { text: 'Trong nước', color: 'blue' },
  OTHER: { text: 'Khác', color: 'default' },
};

// ========== CV Export ==========

export type CvExportResponse = Blob | { url: string };

/**
 * Export my CV as PDF
 * Returns either a Blob (for direct download) or { url } for presigned URL
 */
export async function exportMyCvPdf(): Promise<CvExportResponse> {
  const response = await fetch('/api/profile/me/cv.pdf', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to export CV');
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const json = await response.json();
    if (json.url) {
      return { url: json.url };
    }
    throw new Error('Invalid response format');
  }

  return await response.blob();
}
