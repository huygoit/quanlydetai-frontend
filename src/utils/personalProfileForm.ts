import dayjs, { type Dayjs } from 'dayjs';
import type { CreatePersonalProfilePayload, PersonalProfileItem } from '@/services/api/personalProfiles';

export type PersonalProfileFormValues = {
  userId?: number;
  staffCode?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: Dayjs;
  placeOfBirth?: string;
  phone?: string;
  personalEmail?: string;
  workEmail?: string;
  address?: string;
  departmentId?: number;
  positionTitle?: string;
  employmentType?: string;
  academicDegree?: string;
  academicTitle?: string;
  specialization?: string;
  professionalQualification?: string;
  identityNumber?: string;
  identityIssueDate?: Dayjs;
  identityIssuePlace?: string;
  status?: string;
  note?: string;
};

/** Đổ dữ liệu API vào form. */
export function hoSoCaNhanVaoForm(data: PersonalProfileItem): PersonalProfileFormValues {
  return {
    userId: data.userId,
    staffCode: data.staffCode,
    fullName: data.fullName,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : undefined,
    placeOfBirth: data.placeOfBirth,
    phone: data.phone,
    personalEmail: data.personalEmail,
    workEmail: data.workEmail,
    address: data.address,
    departmentId: data.departmentId,
    positionTitle: data.positionTitle,
    employmentType: data.employmentType,
    academicDegree: data.academicDegree,
    academicTitle: data.academicTitle,
    specialization: data.specialization,
    professionalQualification: data.professionalQualification,
    identityNumber: data.identityNumber,
    identityIssueDate: data.identityIssueDate ? dayjs(data.identityIssueDate) : undefined,
    identityIssuePlace: data.identityIssuePlace,
    status: data.status,
    note: data.note,
  };
}

/** Form → payload lưu API. */
export function formValuesToPersonalProfilePayload(
  values: PersonalProfileFormValues,
  opts?: { includeAdminFields?: boolean },
): Partial<CreatePersonalProfilePayload> {
  const payload: Partial<CreatePersonalProfilePayload> = {
    staffCode: values.staffCode,
    fullName: values.fullName,
    gender: values.gender,
    dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).format('YYYY-MM-DD') : undefined,
    placeOfBirth: values.placeOfBirth,
    phone: values.phone,
    personalEmail: values.personalEmail,
    workEmail: values.workEmail,
    address: values.address,
    departmentId: values.departmentId,
    positionTitle: values.positionTitle,
    employmentType: values.employmentType,
    academicDegree: values.academicDegree,
    academicTitle: values.academicTitle,
    specialization: values.specialization,
    professionalQualification: values.professionalQualification,
    identityNumber: values.identityNumber,
    identityIssueDate: values.identityIssueDate
      ? dayjs(values.identityIssueDate).format('YYYY-MM-DD')
      : undefined,
    identityIssuePlace: values.identityIssuePlace,
  };
  if (opts?.includeAdminFields) {
    payload.status = values.status as CreatePersonalProfilePayload['status'];
    payload.note = values.note;
  }
  return payload;
}
