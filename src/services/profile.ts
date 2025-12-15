/**
 * Mock Service - Hồ sơ khoa học
 * Theo specs/scientific-profile.md.md
 * Frontend-only, localStorage
 */

// ========== TYPES ==========

export type ProfileStatus = 'DRAFT' | 'UPDATED' | 'VERIFIED' | 'NEED_MORE_INFO';

export type Gender = 'Nam' | 'Nữ' | 'Khác';

export type Degree = 'Cử nhân' | 'Thạc sĩ' | 'Tiến sĩ' | 'Khác';

export type AcademicTitle = 'PGS' | 'GS' | 'Không';

export type AttachmentType = 'CV_PDF' | 'DEGREE' | 'CERTIFICATE' | 'OTHER';

export type PublicationSource = 'INTERNAL' | 'GOOGLE_SCHOLAR' | 'SCV_DHDN';

// Publication types (updated)
export type PublicationType = 'JOURNAL' | 'CONFERENCE' | 'BOOK_CHAPTER' | 'BOOK';
export type PublicationRank = 'ISI' | 'SCOPUS' | 'DOMESTIC' | 'OTHER';
export type PublicationStatus = 'PUBLISHED' | 'ACCEPTED' | 'UNDER_REVIEW';
export type AuthorRole = 'CHU_TRI' | 'DONG_TAC_GIA';

export type ProjectRole = 'CHU_NHIEM' | 'THAM_GIA';

export type ProjectStatus = 'DANG_THUC_HIEN' | 'DA_NGHIEM_THU' | 'TAM_DUNG';

export type VerifyAction = 'VERIFY' | 'REQUEST_MORE_INFO' | 'CANCEL_VERIFY';

export type SuggestionStatus = 'PENDING' | 'CONFIRMED' | 'IGNORED';

// ========== INTERFACES ==========

export interface ProfileLanguage {
  id: string;
  language: string;
  level?: string;
  certificate?: string;
  certificateUrl?: string;
}

export interface ProfileAttachment {
  id: string;
  type: AttachmentType;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface LinkedProject {
  id: string;
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
  id: string;

  // Thông tin chính
  title: string;
  authors: string;                     // Danh sách tác giả
  correspondingAuthor?: string;        // Tác giả liên hệ
  myRole?: AuthorRole;                 // Vai trò của tôi

  // Xuất bản
  publicationType: PublicationType;
  journalOrConference: string;         // Tên tạp chí / hội thảo
  year?: number;
  volume?: string;
  issue?: string;
  pages?: string;

  // Phân loại
  rank?: PublicationRank;
  quartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4';

  // Định danh
  doi?: string;
  issn?: string;
  isbn?: string;
  url?: string;

  // Trạng thái
  publicationStatus: PublicationStatus;

  // Nguồn & xác nhận
  source: PublicationSource;
  sourceId?: string;
  verifiedByNcv: boolean;              // NCV đã xác nhận gắn vào hồ sơ
  approvedInternal?: boolean;          // Với công bố nội bộ

  // Minh chứng
  attachmentUrl?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PublicationSuggestion {
  id: string;
  profileId: string;
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
  id: string;
  profileId: string;
  action: VerifyAction;
  note?: string;
  actorRole: 'PHONG_KH' | 'ADMIN';
  actorName: string;
  createdAt: string;
}

export interface ScientificProfile {
  id: string;
  userId: string;

  // 1) Thông tin cá nhân
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

  // 2) Công tác
  organization: string;
  faculty?: string;
  department?: string;
  currentTitle?: string;
  managementRole?: string;
  startWorkingAt?: string;

  // 3) Học hàm/học vị
  degree?: Degree;
  academicTitle?: AcademicTitle;
  degreeYear?: number;
  degreeInstitution?: string;
  degreeCountry?: string;

  // 4) Hướng nghiên cứu
  mainResearchArea?: string;
  subResearchAreas?: string[];
  keywords?: string[];

  // 5) Ngoại ngữ
  languages?: ProfileLanguage[];

  // 6) Tệp đính kèm
  attachments?: ProfileAttachment[];

  // 7) Auto-linked data (read-only)
  linkedProjects?: LinkedProject[];
  publications?: PublicationItem[];

  // Meta
  status: ProfileStatus;
  completeness: number;
  verifiedAt?: string;
  verifiedBy?: string;
  needMoreInfoReason?: string;

  createdAt: string;
  updatedAt: string;
}

// ========== CONSTANTS ==========

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

export const LANGUAGES = [
  'Tiếng Anh',
  'Tiếng Pháp',
  'Tiếng Đức',
  'Tiếng Nhật',
  'Tiếng Trung',
  'Tiếng Hàn',
];

export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS 5.0-6.0', 'IELTS 6.5-7.0', 'IELTS 7.5+', 'TOEIC 600+', 'TOEIC 800+'];

// Publication constants
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

export const PUBLICATION_STATUS_MAP: Record<PublicationStatus, { text: string; color: string }> = {
  PUBLISHED: { text: 'Đã xuất bản', color: 'success' },
  ACCEPTED: { text: 'Đã chấp nhận', color: 'processing' },
  UNDER_REVIEW: { text: 'Đang phản biện', color: 'warning' },
};

export const AUTHOR_ROLE_MAP: Record<AuthorRole, { text: string; color: string }> = {
  CHU_TRI: { text: 'Chủ trì', color: 'gold' },
  DONG_TAC_GIA: { text: 'Đồng tác giả', color: 'default' },
};

export const QUARTILE_OPTIONS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

// ========== STORAGE KEYS ==========
// Version 2: Updated Publication structure with ISI/Scopus/Quartile
const PROFILES_KEY = 'khcn-profiles-v2';
const SUGGESTIONS_KEY = 'khcn-suggestions-v2';
const VERIFY_LOGS_KEY = 'khcn-verify-logs-v2';

// ========== MOCK DATA ==========

const defaultProfiles: ScientificProfile[] = [
  {
    id: 'profile-1',
    userId: 'user-1',
    fullName: 'TS. Nguyễn Văn A',
    dateOfBirth: '1985-03-15',
    gender: 'Nam',
    workEmail: 'nguyenvana@university.edu.vn',
    phone: '0901234567',
    orcid: '0000-0001-2345-6789',
    googleScholarUrl: 'https://scholar.google.com/citations?user=abc123',
    scopusId: '12345678',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=NVA',
    bio: 'Tiến sĩ chuyên ngành Trí tuệ nhân tạo, nghiên cứu về Machine Learning và Deep Learning ứng dụng trong Y học.',
    organization: 'Trường Đại học Bách khoa - ĐHĐN',
    faculty: 'Khoa Công nghệ thông tin',
    department: 'Bộ môn Khoa học máy tính',
    currentTitle: 'Giảng viên chính',
    managementRole: 'Trưởng bộ môn',
    startWorkingAt: '2010-09-01',
    degree: 'Tiến sĩ',
    academicTitle: 'Không',
    degreeYear: 2015,
    degreeInstitution: 'University of Technology Sydney',
    degreeCountry: 'Australia',
    mainResearchArea: 'Công nghệ thông tin',
    subResearchAreas: ['Machine Learning', 'Deep Learning', 'Computer Vision'],
    keywords: ['AI', 'Healthcare', 'Medical Imaging', 'CNN', 'Transfer Learning'],
    languages: [
      { id: 'lang-1', language: 'Tiếng Anh', level: 'C1', certificate: 'IELTS 7.5' },
      { id: 'lang-2', language: 'Tiếng Nhật', level: 'N3', certificate: 'JLPT N3' },
    ],
    attachments: [
      { id: 'att-1', type: 'DEGREE', name: 'Bằng Tiến sĩ.pdf', url: '#', uploadedAt: '2024-01-15' },
    ],
    linkedProjects: [
      {
        id: 'proj-1',
        code: 'DT-2023-001',
        title: 'Ứng dụng AI trong chẩn đoán hình ảnh y tế',
        level: 'Cấp Bộ GD&ĐT',
        role: 'CHU_NHIEM',
        startDate: '2023-01-01',
        endDate: '2024-12-31',
        status: 'DANG_THUC_HIEN',
        decisionNo: 'QĐ-123/2023',
      },
      {
        id: 'proj-2',
        code: 'DT-2022-015',
        title: 'Nghiên cứu thuật toán phân cụm dữ liệu lớn',
        level: 'Cấp Trường',
        role: 'THAM_GIA',
        startDate: '2022-03-01',
        endDate: '2023-02-28',
        status: 'DA_NGHIEM_THU',
        decisionNo: 'QĐ-456/2022',
      },
    ],
    publications: [
      {
        id: 'pub-1',
        title: 'Deep Learning for Medical Image Analysis: A Comprehensive Survey',
        authors: 'Nguyen Van A, Tran Thi B, Le Van C',
        correspondingAuthor: 'Nguyen Van A',
        myRole: 'CHU_TRI',
        publicationType: 'JOURNAL',
        journalOrConference: 'IEEE Transactions on Medical Imaging',
        year: 2023,
        volume: '42',
        issue: '8',
        pages: '2456-2478',
        rank: 'ISI',
        quartile: 'Q1',
        doi: '10.1109/TMI.2023.123456',
        issn: '0278-0062',
        publicationStatus: 'PUBLISHED',
        source: 'INTERNAL',
        verifiedByNcv: true,
        approvedInternal: true,
        createdAt: '2023-08-15T00:00:00Z',
        updatedAt: '2023-08-15T00:00:00Z',
      },
      {
        id: 'pub-2',
        title: 'Transfer Learning in Healthcare: Challenges and Opportunities',
        authors: 'Nguyen Van A, Smith J, et al.',
        correspondingAuthor: 'Nguyen Van A',
        myRole: 'CHU_TRI',
        publicationType: 'JOURNAL',
        journalOrConference: 'Nature Scientific Reports',
        year: 2022,
        volume: '12',
        pages: '1-15',
        rank: 'ISI',
        quartile: 'Q2',
        doi: '10.1038/s41598-022-12345',
        issn: '2045-2322',
        publicationStatus: 'PUBLISHED',
        source: 'GOOGLE_SCHOLAR',
        verifiedByNcv: true,
        createdAt: '2022-06-20T00:00:00Z',
        updatedAt: '2022-06-20T00:00:00Z',
      },
      {
        id: 'pub-3',
        title: 'CNN-based Approaches for COVID-19 Detection from Chest X-rays',
        authors: 'Nguyen Van A, Tran B',
        myRole: 'DONG_TAC_GIA',
        publicationType: 'CONFERENCE',
        journalOrConference: 'IEEE International Conference on Medical Imaging (ICMI 2023)',
        year: 2023,
        pages: '145-152',
        rank: 'SCOPUS',
        doi: '10.1109/ICMI.2023.98765',
        publicationStatus: 'PUBLISHED',
        source: 'INTERNAL',
        verifiedByNcv: true,
        approvedInternal: true,
        createdAt: '2023-05-10T00:00:00Z',
        updatedAt: '2023-05-10T00:00:00Z',
      },
    ],
    status: 'VERIFIED',
    completeness: 95,
    verifiedAt: '2024-01-20T10:00:00Z',
    verifiedBy: 'Phòng KH',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'profile-2',
    userId: 'user-2',
    fullName: 'ThS. Trần Thị B',
    dateOfBirth: '1990-07-22',
    gender: 'Nữ',
    workEmail: 'tranthib@university.edu.vn',
    phone: '0912345678',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=TTB',
    bio: 'Thạc sĩ ngành Giáo dục học, nghiên cứu về phương pháp giảng dạy và công nghệ giáo dục.',
    organization: 'Trường Đại học Sư phạm - ĐHĐN',
    faculty: 'Khoa Sư phạm',
    department: 'Bộ môn Giáo dục học',
    currentTitle: 'Giảng viên',
    startWorkingAt: '2015-09-01',
    degree: 'Thạc sĩ',
    academicTitle: 'Không',
    degreeYear: 2018,
    degreeInstitution: 'Đại học Sư phạm Hà Nội',
    degreeCountry: 'Việt Nam',
    mainResearchArea: 'Giáo dục',
    subResearchAreas: ['E-Learning', 'Educational Technology'],
    keywords: ['Online Learning', 'Blended Learning', 'LMS'],
    languages: [
      { id: 'lang-3', language: 'Tiếng Anh', level: 'B2', certificate: 'IELTS 6.5' },
    ],
    linkedProjects: [
      {
        id: 'proj-3',
        code: 'DT-2024-008',
        title: 'Phát triển nền tảng học trực tuyến thế hệ mới',
        level: 'Cấp Đại học Đà Nẵng',
        role: 'CHU_NHIEM',
        startDate: '2024-01-01',
        status: 'DANG_THUC_HIEN',
      },
    ],
    publications: [
      {
        id: 'pub-4',
        title: 'Effectiveness of Blended Learning in Higher Education',
        authors: 'Tran Thi B, Nguyen Van D',
        correspondingAuthor: 'Tran Thi B',
        myRole: 'CHU_TRI',
        publicationType: 'JOURNAL',
        journalOrConference: 'Journal of Educational Technology',
        year: 2023,
        volume: '15',
        issue: '2',
        pages: '89-105',
        rank: 'DOMESTIC',
        publicationStatus: 'PUBLISHED',
        source: 'INTERNAL',
        verifiedByNcv: true,
        approvedInternal: true,
        createdAt: '2023-04-12T00:00:00Z',
        updatedAt: '2023-04-12T00:00:00Z',
      },
    ],
    status: 'UPDATED',
    completeness: 75,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-03-15T14:30:00Z',
  },
  {
    id: 'profile-3',
    userId: 'user-3',
    fullName: 'PGS.TS. Lê Văn C',
    dateOfBirth: '1975-11-08',
    gender: 'Nam',
    workEmail: 'levanc@university.edu.vn',
    phone: '0903456789',
    orcid: '0000-0002-3456-7890',
    googleScholarUrl: 'https://scholar.google.com/citations?user=xyz789',
    scopusId: '87654321',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=LVC',
    bio: 'Phó Giáo sư, Tiến sĩ chuyên ngành Nông nghiệp, nghiên cứu về giống cây trồng và biến đổi khí hậu.',
    organization: 'Trường Đại học Nông Lâm - ĐHĐN',
    faculty: 'Khoa Nông nghiệp',
    department: 'Bộ môn Trồng trọt',
    currentTitle: 'Giảng viên cao cấp',
    managementRole: 'Phó trưởng Khoa',
    startWorkingAt: '2000-09-01',
    degree: 'Tiến sĩ',
    academicTitle: 'PGS',
    degreeYear: 2008,
    degreeInstitution: 'Wageningen University',
    degreeCountry: 'Hà Lan',
    mainResearchArea: 'Nông nghiệp',
    subResearchAreas: ['Plant Breeding', 'Climate Change', 'Sustainable Agriculture'],
    keywords: ['Rice', 'Drought Tolerance', 'Biotechnology', 'Food Security'],
    languages: [
      { id: 'lang-4', language: 'Tiếng Anh', level: 'C1', certificate: 'IELTS 7.0' },
      { id: 'lang-5', language: 'Tiếng Đức', level: 'B1' },
    ],
    attachments: [
      { id: 'att-2', type: 'DEGREE', name: 'Bằng Tiến sĩ.pdf', url: '#', uploadedAt: '2024-01-10' },
      { id: 'att-3', type: 'CERTIFICATE', name: 'Chứng nhận PGS.pdf', url: '#', uploadedAt: '2024-01-10' },
    ],
    linkedProjects: [
      {
        id: 'proj-4',
        code: 'DT-2023-025',
        title: 'Nghiên cứu giống lúa chịu hạn mới',
        level: 'Cấp Nhà nước',
        role: 'CHU_NHIEM',
        startDate: '2023-06-01',
        status: 'DANG_THUC_HIEN',
        decisionNo: 'QĐ-789/2023',
      },
    ],
    publications: [
      {
        id: 'pub-5',
        title: 'Development of Drought-Tolerant Rice Varieties for Southeast Asia',
        authors: 'Le Van C, Nguyen H, Tran K, et al.',
        correspondingAuthor: 'Le Van C',
        myRole: 'CHU_TRI',
        publicationType: 'JOURNAL',
        journalOrConference: 'Nature Plants',
        year: 2023,
        volume: '9',
        pages: '234-248',
        rank: 'ISI',
        quartile: 'Q1',
        doi: '10.1038/s41477-023-01234',
        issn: '2055-0278',
        publicationStatus: 'PUBLISHED',
        source: 'INTERNAL',
        verifiedByNcv: true,
        approvedInternal: true,
        createdAt: '2023-03-18T00:00:00Z',
        updatedAt: '2023-03-18T00:00:00Z',
      },
      {
        id: 'pub-6',
        title: 'Climate Change Adaptation in Vietnamese Agriculture',
        authors: 'Le Van C, Nguyen Thi E',
        correspondingAuthor: 'Le Van C',
        myRole: 'CHU_TRI',
        publicationType: 'JOURNAL',
        journalOrConference: 'Agricultural Systems',
        year: 2022,
        volume: '198',
        pages: '103456',
        rank: 'ISI',
        quartile: 'Q1',
        doi: '10.1016/j.agsy.2022.103456',
        issn: '0308-521X',
        publicationStatus: 'PUBLISHED',
        source: 'GOOGLE_SCHOLAR',
        verifiedByNcv: true,
        createdAt: '2022-05-22T00:00:00Z',
        updatedAt: '2022-05-22T00:00:00Z',
      },
      {
        id: 'pub-7',
        title: 'CRISPR-Cas9 Applications in Rice Breeding: A Review',
        authors: 'Le Van C',
        myRole: 'CHU_TRI',
        publicationType: 'BOOK_CHAPTER',
        journalOrConference: 'Advances in Plant Biotechnology (Springer)',
        year: 2022,
        pages: '45-78',
        rank: 'SCOPUS',
        isbn: '978-3-030-12345-6',
        publicationStatus: 'PUBLISHED',
        source: 'INTERNAL',
        verifiedByNcv: true,
        approvedInternal: true,
        createdAt: '2022-09-10T00:00:00Z',
        updatedAt: '2022-09-10T00:00:00Z',
      },
    ],
    status: 'VERIFIED',
    completeness: 100,
    verifiedAt: '2024-02-01T08:00:00Z',
    verifiedBy: 'Admin',
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'profile-4',
    userId: 'user-4',
    fullName: 'ThS. Phạm Thị D',
    dateOfBirth: '1988-05-12',
    gender: 'Nữ',
    workEmail: 'phamthid@university.edu.vn',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=PTD',
    bio: 'Thạc sĩ Kinh tế, nghiên cứu về kinh tế tuần hoàn và phát triển bền vững.',
    organization: 'Trường Đại học Kinh tế - ĐHĐN',
    faculty: 'Khoa Kinh tế',
    department: 'Bộ môn Kinh tế học',
    currentTitle: 'Giảng viên',
    startWorkingAt: '2014-09-01',
    degree: 'Thạc sĩ',
    academicTitle: 'Không',
    degreeYear: 2016,
    mainResearchArea: 'Kinh tế',
    subResearchAreas: ['Circular Economy', 'Sustainable Development'],
    keywords: ['SMEs', 'Green Economy', 'Business Model'],
    languages: [
      { id: 'lang-6', language: 'Tiếng Anh', level: 'B2' },
    ],
    status: 'NEED_MORE_INFO',
    completeness: 60,
    needMoreInfoReason: 'Cần bổ sung thông tin về học vị và chứng chỉ ngoại ngữ.',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'profile-5',
    userId: 'user-5',
    fullName: 'KS. Hoàng Văn E',
    dateOfBirth: '1992-09-30',
    gender: 'Nam',
    workEmail: 'hoangvane@university.edu.vn',
    avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=HVE',
    organization: 'Trường Đại học Bách khoa - ĐHĐN',
    faculty: 'Khoa Kỹ thuật',
    currentTitle: 'Nghiên cứu viên',
    degree: 'Cử nhân',
    academicTitle: 'Không',
    mainResearchArea: 'Kỹ thuật',
    status: 'DRAFT',
    completeness: 35,
    createdAt: '2024-03-20T00:00:00Z',
    updatedAt: '2024-03-20T00:00:00Z',
  },
];

const defaultSuggestions: PublicationSuggestion[] = [
  {
    id: 'sug-1',
    profileId: 'profile-1',
    source: 'GOOGLE_SCHOLAR',
    title: 'A Novel Approach to Medical Image Segmentation using Transformers',
    year: 2024,
    journalOrConference: 'CVPR 2024',
    authors: 'Nguyen Van A, et al.',
    url: 'https://arxiv.org/abs/2401.12345',
    publicationType: 'CONFERENCE',
    status: 'PENDING',
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: 'sug-2',
    profileId: 'profile-1',
    source: 'SCV_DHDN',
    title: 'Federated Learning for Privacy-Preserving Healthcare AI',
    year: 2024,
    journalOrConference: 'Journal of Biomedical Informatics',
    authors: 'Nguyen Van A, Tran Thi B',
    publicationType: 'JOURNAL',
    status: 'PENDING',
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-03-05T00:00:00Z',
  },
  {
    id: 'sug-3',
    profileId: 'profile-3',
    source: 'GOOGLE_SCHOLAR',
    title: 'CRISPR-based Gene Editing for Crop Improvement',
    year: 2024,
    journalOrConference: 'Nature Biotechnology',
    authors: 'Le Van C, et al.',
    publicationType: 'JOURNAL',
    status: 'PENDING',
    createdAt: '2024-03-10T00:00:00Z',
    updatedAt: '2024-03-10T00:00:00Z',
  },
];

const defaultVerifyLogs: ProfileVerifyLog[] = [
  {
    id: 'log-1',
    profileId: 'profile-1',
    action: 'VERIFY',
    note: 'Hồ sơ đầy đủ, đã kiểm tra bằng cấp và các công bố.',
    actorRole: 'PHONG_KH',
    actorName: 'Nguyễn Thị Hương',
    createdAt: '2024-01-20T10:00:00Z',
  },
  {
    id: 'log-2',
    profileId: 'profile-3',
    action: 'VERIFY',
    note: 'Xác thực thông tin PGS và các công trình nghiên cứu.',
    actorRole: 'ADMIN',
    actorName: 'Admin System',
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'log-3',
    profileId: 'profile-4',
    action: 'REQUEST_MORE_INFO',
    note: 'Cần bổ sung thông tin về học vị và chứng chỉ ngoại ngữ.',
    actorRole: 'PHONG_KH',
    actorName: 'Nguyễn Thị Hương',
    createdAt: '2024-03-10T09:00:00Z',
  },
];

// ========== HELPER FUNCTIONS ==========

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Load from localStorage or use default
const loadProfiles = (): ScientificProfile[] => {
  const stored = localStorage.getItem(PROFILES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultProfiles;
    }
  }
  localStorage.setItem(PROFILES_KEY, JSON.stringify(defaultProfiles));
  return defaultProfiles;
};

const saveProfiles = (profiles: ScientificProfile[]) => {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

const loadSuggestions = (): PublicationSuggestion[] => {
  const stored = localStorage.getItem(SUGGESTIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultSuggestions;
    }
  }
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(defaultSuggestions));
  return defaultSuggestions;
};

const saveSuggestions = (suggestions: PublicationSuggestion[]) => {
  localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(suggestions));
};

const loadVerifyLogs = (): ProfileVerifyLog[] => {
  const stored = localStorage.getItem(VERIFY_LOGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultVerifyLogs;
    }
  }
  localStorage.setItem(VERIFY_LOGS_KEY, JSON.stringify(defaultVerifyLogs));
  return defaultVerifyLogs;
};

const saveVerifyLogs = (logs: ProfileVerifyLog[]) => {
  localStorage.setItem(VERIFY_LOGS_KEY, JSON.stringify(logs));
};

// Calculate completeness score
export const calculateCompleteness = (profile: Partial<ScientificProfile>): number => {
  let score = 0;
  const checks = [
    { field: 'fullName', weight: 10 },
    { field: 'workEmail', weight: 10 },
    { field: 'organization', weight: 10 },
    { field: 'faculty', weight: 5 },
    { field: 'degree', weight: 10 },
    { field: 'mainResearchArea', weight: 10 },
    { field: 'bio', weight: 5 },
    { field: 'phone', weight: 5 },
    { field: 'orcid', weight: 5 },
    { field: 'googleScholarUrl', weight: 5 },
  ];

  checks.forEach(({ field, weight }) => {
    if ((profile as any)[field]) {
      score += weight;
    }
  });

  // Languages
  if (profile.languages && profile.languages.length > 0) {
    score += 10;
  }

  // Publications
  if (profile.publications && profile.publications.length > 0) {
    score += 10;
  }

  // Projects
  if (profile.linkedProjects && profile.linkedProjects.length > 0) {
    score += 5;
  }

  return Math.min(score, 100);
};

// ========== API FUNCTIONS ==========

/**
 * Get current user's profile
 */
export async function queryMyProfile(userId: string): Promise<{
  data: ScientificProfile | null;
  success: boolean;
}> {
  await delay(300);
  const profiles = loadProfiles();
  const profile = profiles.find(p => p.userId === userId);
  return { data: profile || null, success: true };
}

/**
 * Create new profile for user
 */
export async function createMyProfile(
  userId: string,
  fullName: string,
  workEmail: string,
  organization: string
): Promise<{ data: ScientificProfile; success: boolean }> {
  await delay(300);
  const profiles = loadProfiles();

  const now = new Date().toISOString();
  const newProfile: ScientificProfile = {
    id: `profile-${generateId()}`,
    userId,
    fullName,
    workEmail,
    organization,
    status: 'DRAFT',
    completeness: 20,
    createdAt: now,
    updatedAt: now,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${fullName.replace(/\s+/g, '')}`,
  };

  newProfile.completeness = calculateCompleteness(newProfile);
  profiles.push(newProfile);
  saveProfiles(profiles);

  return { data: newProfile, success: true };
}

/**
 * Update profile
 */
export async function updateMyProfile(
  profileId: string,
  data: Partial<ScientificProfile>
): Promise<{ data: ScientificProfile | null; success: boolean }> {
  await delay(400);
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === profileId);

  if (index === -1) {
    return { data: null, success: false };
  }

  const updated: ScientificProfile = {
    ...profiles[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  updated.completeness = calculateCompleteness(updated);

  profiles[index] = updated;
  saveProfiles(profiles);

  return { data: updated, success: true };
}

/**
 * Submit profile update (DRAFT/NEED_MORE_INFO → UPDATED)
 */
export async function submitProfileUpdate(profileId: string): Promise<{
  data: ScientificProfile | null;
  success: boolean;
}> {
  await delay(300);
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === profileId);

  if (index === -1) {
    return { data: null, success: false };
  }

  const profile = profiles[index];
  if (profile.status !== 'DRAFT' && profile.status !== 'NEED_MORE_INFO') {
    return { data: null, success: false };
  }

  const updated: ScientificProfile = {
    ...profile,
    status: 'UPDATED',
    needMoreInfoReason: undefined,
    updatedAt: new Date().toISOString(),
  };

  profiles[index] = updated;
  saveProfiles(profiles);

  return { data: updated, success: true };
}

/**
 * Query all profiles (PHONG_KH, ADMIN)
 */
export async function queryProfiles(params: {
  keyword?: string;
  faculty?: string;
  degree?: Degree;
  mainResearchArea?: string;
  status?: ProfileStatus;
  current?: number;
  pageSize?: number;
} = {}): Promise<{ data: ScientificProfile[]; total: number; success: boolean }> {
  await delay(300);
  let profiles = loadProfiles();

  // Filters
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    profiles = profiles.filter(
      p =>
        p.fullName.toLowerCase().includes(kw) ||
        p.workEmail.toLowerCase().includes(kw) ||
        (p.keywords && p.keywords.some(k => k.toLowerCase().includes(kw)))
    );
  }

  if (params.faculty) {
    profiles = profiles.filter(p => p.faculty === params.faculty);
  }

  if (params.degree) {
    profiles = profiles.filter(p => p.degree === params.degree);
  }

  if (params.mainResearchArea) {
    profiles = profiles.filter(p => p.mainResearchArea === params.mainResearchArea);
  }

  if (params.status) {
    profiles = profiles.filter(p => p.status === params.status);
  }

  // Sort by updatedAt desc
  profiles.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const total = profiles.length;

  // Pagination
  const current = params.current || 1;
  const pageSize = params.pageSize || 10;
  const start = (current - 1) * pageSize;
  const data = profiles.slice(start, start + pageSize);

  return { data, total, success: true };
}

/**
 * Get profile by ID
 */
export async function getProfileById(id: string): Promise<{
  data: ScientificProfile | null;
  success: boolean;
}> {
  await delay(200);
  const profiles = loadProfiles();
  const profile = profiles.find(p => p.id === id);
  return { data: profile || null, success: !!profile };
}

/**
 * Verify profile (PHONG_KH/ADMIN)
 */
export async function verifyProfile(
  profileId: string,
  note: string,
  actorRole: 'PHONG_KH' | 'ADMIN',
  actorName: string
): Promise<{ data: ScientificProfile | null; success: boolean }> {
  await delay(400);
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === profileId);

  if (index === -1) {
    return { data: null, success: false };
  }

  const now = new Date().toISOString();
  const updated: ScientificProfile = {
    ...profiles[index],
    status: 'VERIFIED',
    verifiedAt: now,
    verifiedBy: actorName,
    needMoreInfoReason: undefined,
    updatedAt: now,
  };

  profiles[index] = updated;
  saveProfiles(profiles);

  // Add verify log
  const logs = loadVerifyLogs();
  logs.push({
    id: `log-${generateId()}`,
    profileId,
    action: 'VERIFY',
    note,
    actorRole,
    actorName,
    createdAt: now,
  });
  saveVerifyLogs(logs);

  return { data: updated, success: true };
}

/**
 * Request more info (PHONG_KH/ADMIN)
 */
export async function requestMoreInfo(
  profileId: string,
  note: string,
  actorRole: 'PHONG_KH' | 'ADMIN',
  actorName: string
): Promise<{ data: ScientificProfile | null; success: boolean }> {
  await delay(400);
  const profiles = loadProfiles();
  const index = profiles.findIndex(p => p.id === profileId);

  if (index === -1) {
    return { data: null, success: false };
  }

  const now = new Date().toISOString();
  const updated: ScientificProfile = {
    ...profiles[index],
    status: 'NEED_MORE_INFO',
    needMoreInfoReason: note,
    updatedAt: now,
  };

  profiles[index] = updated;
  saveProfiles(profiles);

  // Add verify log
  const logs = loadVerifyLogs();
  logs.push({
    id: `log-${generateId()}`,
    profileId,
    action: 'REQUEST_MORE_INFO',
    note,
    actorRole,
    actorName,
    createdAt: now,
  });
  saveVerifyLogs(logs);

  return { data: updated, success: true };
}

/**
 * Get verify logs for profile
 */
export async function getVerifyLogs(profileId: string): Promise<{
  data: ProfileVerifyLog[];
  success: boolean;
}> {
  await delay(200);
  const logs = loadVerifyLogs();
  const filtered = logs
    .filter(l => l.profileId === profileId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { data: filtered, success: true };
}

// ========== PUBLICATION SUGGESTIONS API ==========

/**
 * Get suggestions for profile
 */
export async function getSuggestions(profileId: string): Promise<{
  data: PublicationSuggestion[];
  success: boolean;
}> {
  await delay(200);
  const suggestions = loadSuggestions();
  const filtered = suggestions
    .filter(s => s.profileId === profileId && s.status === 'PENDING')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return { data: filtered, success: true };
}

/**
 * Sync from Google Scholar (mock)
 */
export async function syncFromGoogleScholar(profileId: string): Promise<{
  data: PublicationSuggestion[];
  newCount: number;
  success: boolean;
}> {
  await delay(1000);
  const suggestions = loadSuggestions();
  const profiles = loadProfiles();
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return { data: [], newCount: 0, success: false };
  }

  // Mock: Generate 1-3 random suggestions
  const mockPublications = [
    { title: 'Advanced Machine Learning Techniques for Data Analysis', type: 'JOURNAL' as PublicationType, venue: 'IEEE Access' },
    { title: 'A Systematic Review of Deep Neural Networks', type: 'JOURNAL' as PublicationType, venue: 'ACM Computing Surveys' },
    { title: 'Novel Approaches in Natural Language Processing', type: 'CONFERENCE' as PublicationType, venue: 'ACL 2024' },
    { title: 'Big Data Analytics: Current Trends and Future Directions', type: 'JOURNAL' as PublicationType, venue: 'Journal of Big Data' },
    { title: 'Artificial Intelligence in Modern Healthcare Systems', type: 'BOOK_CHAPTER' as PublicationType, venue: 'AI in Healthcare (Springer)' },
  ];

  const now = new Date().toISOString();
  const newSuggestions: PublicationSuggestion[] = [];
  const count = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < count; i++) {
    const pub = mockPublications[Math.floor(Math.random() * mockPublications.length)];
    const uniqueTitle = `${pub.title} (${profile.fullName.split(' ').pop()})`;
    // Check if already exists
    if (!suggestions.find(s => s.profileId === profileId && s.title === uniqueTitle)) {
      newSuggestions.push({
        id: `sug-${generateId()}`,
        profileId,
        source: 'GOOGLE_SCHOLAR',
        title: uniqueTitle,
        year: 2024,
        journalOrConference: pub.venue,
        authors: `${profile.fullName}, et al.`,
        url: 'https://scholar.google.com/...',
        publicationType: pub.type,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (newSuggestions.length > 0) {
    suggestions.push(...newSuggestions);
    saveSuggestions(suggestions);
  }

  return { data: newSuggestions, newCount: newSuggestions.length, success: true };
}

/**
 * Sync from SCV ĐHĐN (mock)
 */
export async function syncFromSCV(profileId: string): Promise<{
  data: PublicationSuggestion[];
  newCount: number;
  success: boolean;
}> {
  await delay(1000);
  const suggestions = loadSuggestions();
  const profiles = loadProfiles();
  const profile = profiles.find(p => p.id === profileId);

  if (!profile) {
    return { data: [], newCount: 0, success: false };
  }

  const mockPublications = [
    { title: 'Nghiên cứu ứng dụng công nghệ trong giáo dục', type: 'JOURNAL' as PublicationType, venue: 'Tạp chí Khoa học ĐHĐN' },
    { title: 'Phát triển bền vững tại Việt Nam: Thách thức và cơ hội', type: 'JOURNAL' as PublicationType, venue: 'Tạp chí Kinh tế và Phát triển' },
    { title: 'Đổi mới sáng tạo trong doanh nghiệp vừa và nhỏ', type: 'CONFERENCE' as PublicationType, venue: 'Hội thảo Quốc gia về Kinh tế số' },
  ];

  const now = new Date().toISOString();
  const newSuggestions: PublicationSuggestion[] = [];
  const count = Math.floor(Math.random() * 2) + 1;

  for (let i = 0; i < count; i++) {
    const pub = mockPublications[Math.floor(Math.random() * mockPublications.length)];
    if (!suggestions.find(s => s.profileId === profileId && s.title === pub.title)) {
      newSuggestions.push({
        id: `sug-${generateId()}`,
        profileId,
        source: 'SCV_DHDN',
        title: pub.title,
        year: 2024,
        journalOrConference: pub.venue,
        authors: profile.fullName,
        publicationType: pub.type,
        status: 'PENDING',
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  if (newSuggestions.length > 0) {
    suggestions.push(...newSuggestions);
    saveSuggestions(suggestions);
  }

  return { data: newSuggestions, newCount: newSuggestions.length, success: true };
}

/**
 * Confirm suggestion (add to publications)
 */
export async function confirmSuggestion(suggestionId: string): Promise<{
  success: boolean;
}> {
  await delay(300);
  const suggestions = loadSuggestions();
  const index = suggestions.findIndex(s => s.id === suggestionId);

  if (index === -1) {
    return { success: false };
  }

  const suggestion = suggestions[index];
  const profiles = loadProfiles();
  const profileIndex = profiles.findIndex(p => p.id === suggestion.profileId);

  if (profileIndex === -1) {
    return { success: false };
  }

  // Update suggestion status
  suggestions[index] = {
    ...suggestion,
    status: 'CONFIRMED',
    updatedAt: new Date().toISOString(),
  };
  saveSuggestions(suggestions);

  // Add to profile publications
  const profile = profiles[profileIndex];
  const now = new Date().toISOString();
  const newPublication: PublicationItem = {
    id: `pub-${generateId()}`,
    title: suggestion.title,
    authors: suggestion.authors || profile.fullName,
    publicationType: suggestion.publicationType || 'JOURNAL',
    journalOrConference: suggestion.journalOrConference || '',
    year: suggestion.year,
    url: suggestion.url,
    publicationStatus: 'PUBLISHED',
    source: suggestion.source,
    sourceId: suggestion.id,
    verifiedByNcv: true,
    createdAt: now,
    updatedAt: now,
  };

  const publications = profile.publications || [];
  publications.push(newPublication);

  profiles[profileIndex] = {
    ...profile,
    publications,
    updatedAt: new Date().toISOString(),
  };
  saveProfiles(profiles);

  return { success: true };
}

/**
 * Ignore suggestion
 */
export async function ignoreSuggestion(suggestionId: string): Promise<{
  success: boolean;
}> {
  await delay(200);
  const suggestions = loadSuggestions();
  const index = suggestions.findIndex(s => s.id === suggestionId);

  if (index === -1) {
    return { success: false };
  }

  suggestions[index] = {
    ...suggestions[index],
    status: 'IGNORED',
    updatedAt: new Date().toISOString(),
  };
  saveSuggestions(suggestions);

  return { success: true };
}

// ========== EXPORT CV ==========

export type CVTemplate = 'BO_KHCN' | 'DHDN' | 'NOI_BO';
export type ExportFormat = 'PDF' | 'DOCX';

/**
 * Export CV (V1: Mock - download placeholder)
 */
export async function exportCV(
  profileId: string,
  template: CVTemplate,
  format: ExportFormat
): Promise<{ success: boolean; downloadUrl: string }> {
  await delay(1500); // Simulate processing

  // V1: Return mock download URL
  const templateNames: Record<CVTemplate, string> = {
    BO_KHCN: 'Bộ KH&CN',
    DHDN: 'ĐHĐN',
    NOI_BO: 'Nội bộ',
  };

  console.log(`Exporting CV for profile ${profileId} using template ${templateNames[template]} in ${format} format`);

  // In real implementation, this would generate the actual file
  // For V1, we just return a mock URL
  return {
    success: true,
    downloadUrl: `#mock-cv-${profileId}-${template}.${format.toLowerCase()}`,
  };
}

