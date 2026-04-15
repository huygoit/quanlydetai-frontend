/**
 * API nhân sự (bảng staffs) — admin
 */
import { get, ApiResponse } from '../request';

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
  | 'email';

export interface QueryStaffsParams {
  page?: number;
  perPage?: number;
  keyword?: string;
  staffCode?: string;
  departmentId?: number;
  departmentCode?: string;
  staffType?: string;
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
