/**
 * API nhân sự (bảng staffs) — master hồ sơ nhân sự
 */
import { get, post, put, ApiResponse } from '../request';

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
  { value: 'OTHER', label: 'Khác' },
];

export interface StaffWritePayload {
  staffCode?: string;
  fullName?: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  currentAddress?: string | null;
  departmentId?: number | null;
  /** Chuỗi ID danh mục POSITION, cách nhau bởi dấu phẩy */
  positionTitle?: string | null;
  /** Chuỗi ID danh mục PARTY, cách nhau bởi dấu phẩy */
  partyPosition?: string | null;
  staffType?: string | null;
  currentJob?: string | null;
  professionalDegree?: string | null;
  academicTitle?: string | null;
  major?: string | null;
  identityNumber?: string | null;
  identityIssueDate?: string | null;
  identityIssuePlace?: string | null;
  userId?: number | null;
  note?: string | null;
}

/** Bản ghi danh sách (khớp serializeStaffSummary backend) */
export interface StaffSummary {
  id: number;
  staffCode: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  departmentId: number | null;
  departmentCode: string | null;
  departmentName: string | null;
  staffType: string | null;
  positionTitle: string | null;
  /** Chức danh (nv_chức danh) */
  professionalTitle?: string | null;
  currentJob: string | null;
  userId: number | null;
  createdAt: string;
  updatedAt: string | null;
}

export type StaffSortField =
  | 'id'
  | 'fullName'
  | 'staffCode'
  | 'departmentName'
  | 'createdAt'
  | 'staffType'
  | 'email'
  | 'positionTitle'
  | 'professionalTitle';

export interface QueryStaffsParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  staffCode?: string;
  departmentId?: number;
  departmentCode?: string;
  staffType?: string;
  /** Lọc theo ID danh mục POSITION (có trong chuỗi position_title) */
  positionTitle?: string | number;
  /** Lọc theo ID danh mục PARTY (có trong chuỗi party_position) */
  partyPosition?: string | number;
  /** Chuỗi 'true' | 'false' theo query backend */
  hasUser?: string;
  sortBy?: StaffSortField;
  order?: 'asc' | 'desc';
}

/** Phản hồi phân trang (backend không bắt buộc trường success) */
export interface StaffsListResponse {
  message?: string;
  data: StaffSummary[];
  meta: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
}

/** Chi tiết nhân sự (khớp serializeStaffDetail, có thể có sourceData) */
export type StaffDetail = StaffSummary & {
  dateOfBirth?: string | null;
  gender?: string | null;
  maritalStatus?: string | null;
  religionOrEthnicity?: string | null;
  priorityGroup?: string | null;
  identityNumber?: string | null;
  identityIssuePlace?: string | null;
  identityIssueDate?: string | null;
  insuranceNumber?: string | null;
  hometown?: string | null;
  placeOfBirth?: string | null;
  permanentAddress?: string | null;
  currentAddress?: string | null;
  hiredAt?: string | null;
  rankedAt?: string | null;
  receivingAgency?: string | null;
  recruitmentWorkType?: string | null;
  socialInsuranceLeave?: string | null;
  appointedAt?: string | null;
  concurrentPosition?: string | null;
  highestPosition?: string | null;
  partyJoinedAtRaw?: string | null;
  partyPosition?: string | null;
  isUnionMember?: boolean | null;
  professionalDegree?: string | null;
  industryGroup?: string | null;
  field?: string | null;
  major?: string | null;
  professionalTitle?: string | null;
  trainingPlace?: string | null;
  trainingMode?: string | null;
  trainingCountry?: string | null;
  trainingInstitution?: string | null;
  graduationYear?: number | null;
  politicalLevel?: string | null;
  stateManagementLevel?: string | null;
  itLevel?: string | null;
  titleAward?: string | null;
  recognitionYear?: number | null;
  academicTitle?: string | null;
  is85Program?: boolean | null;
  jobTitleType?: string | null;
  salaryStep?: string | null;
  salaryCoefficient?: string | number | null;
  note?: string | null;
  sourceData?: Record<string, unknown> | null;
};

/**
 * Danh sách nhân sự có phân trang & lọc
 */
export async function queryStaffs(params?: QueryStaffsParams): Promise<StaffsListResponse> {
  return get<StaffsListResponse>('/api/admin/staffs', params);
}

/**
 * Chi tiết một nhân sự
 */
export async function getStaff(id: number, includeSourceData?: boolean): Promise<ApiResponse<StaffDetail>> {
  return get<ApiResponse<StaffDetail>>(
    `/api/admin/staffs/${id}`,
    includeSourceData ? { includeSourceData: '1' } : undefined,
  );
}

export async function createStaff(payload: StaffWritePayload): Promise<ApiResponse<StaffDetail>> {
  return post<ApiResponse<StaffDetail>>('/api/admin/staffs', payload);
}

export async function updateStaff(
  id: number,
  payload: StaffWritePayload,
): Promise<ApiResponse<StaffDetail>> {
  return put<ApiResponse<StaffDetail>>(`/api/admin/staffs/${id}`, payload);
}

/** Hồ sơ nhân sự của user đang đăng nhập */
export async function getMyStaffProfile(): Promise<ApiResponse<StaffDetail>> {
  return get<ApiResponse<StaffDetail>>('/api/me/staff-profile');
}

export async function updateMyStaffProfile(
  payload: StaffWritePayload,
): Promise<ApiResponse<StaffDetail>> {
  return put<ApiResponse<StaffDetail>>('/api/me/staff-profile', payload);
}
