import dayjs, { type Dayjs } from 'dayjs';
import type { StaffDetail, StaffWritePayload } from '@/services/api/staffs';

export type StaffFormValues = {
  userId?: number;
  staffCode?: string;
  fullName?: string;
  gender?: string;
  dateOfBirth?: Dayjs;
  placeOfBirth?: string;
  phone?: string;
  email?: string;
  currentAddress?: string;
  departmentId?: number;
  positionTitle?: string;
  staffType?: string;
  currentJob?: string;
  professionalDegree?: string;
  academicTitle?: string;
  major?: string;
  identityNumber?: string;
  identityIssueDate?: Dayjs;
  identityIssuePlace?: string;
  note?: string;
};

/** API staff → giá trị form */
export function staffVaoForm(data: StaffDetail): StaffFormValues {
  return {
    userId: data.userId ?? undefined,
    staffCode: data.staffCode ?? undefined,
    fullName: data.fullName,
    gender: data.gender ?? undefined,
    dateOfBirth: data.dateOfBirth ? dayjs(data.dateOfBirth) : undefined,
    placeOfBirth: data.placeOfBirth ?? undefined,
    phone: data.phone ?? undefined,
    email: data.email ?? undefined,
    currentAddress: data.currentAddress ?? undefined,
    departmentId: data.departmentId ?? undefined,
    positionTitle: data.positionTitle ?? undefined,
    staffType: data.staffType ?? undefined,
    currentJob: data.currentJob ?? undefined,
    professionalDegree: data.professionalDegree ?? undefined,
    academicTitle: data.academicTitle ?? undefined,
    major: data.major ?? undefined,
    identityNumber: data.identityNumber ?? undefined,
    identityIssueDate: data.identityIssueDate ? dayjs(data.identityIssueDate) : undefined,
    identityIssuePlace: data.identityIssuePlace ?? undefined,
    note: data.note ?? undefined,
  };
}

/** Form → payload API staff */
export function formValuesToStaffPayload(
  values: StaffFormValues,
  opts?: { includeAdminFields?: boolean },
): StaffWritePayload {
  const payload: StaffWritePayload = {
    staffCode: values.staffCode,
    fullName: values.fullName,
    gender: values.gender || null,
    dateOfBirth: values.dateOfBirth ? dayjs(values.dateOfBirth).format('YYYY-MM-DD') : null,
    placeOfBirth: values.placeOfBirth || null,
    phone: values.phone || null,
    email: values.email || null,
    currentAddress: values.currentAddress || null,
    departmentId: values.departmentId ?? null,
    positionTitle: values.positionTitle || null,
    staffType: values.staffType || null,
    currentJob: values.currentJob || null,
    professionalDegree: values.professionalDegree || null,
    academicTitle: values.academicTitle || null,
    major: values.major || null,
    identityNumber: values.identityNumber || null,
    identityIssueDate: values.identityIssueDate
      ? dayjs(values.identityIssueDate).format('YYYY-MM-DD')
      : null,
    identityIssuePlace: values.identityIssuePlace || null,
  };
  if (opts?.includeAdminFields) {
    payload.userId = values.userId ?? null;
    payload.note = values.note || null;
  }
  return payload;
}
