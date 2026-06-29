/**
 * Validate & ghép payload lưu KQNC — module quản lý (/research-outputs)
 * Không dùng profileId chủ kê khai — chỉ validate danh sách tác giả (≥1 NCV link).
 */
import type { FormInstance } from 'antd/es/form';
import { message } from 'antd';
import {
  laTacGiaNhapTay,
  reassignAuthorOrdersSequential,
  type Publication,
  type PublicationAuthor,
  type ResearchOutputTypeTreeNode,
} from '@/services/api/profilePublications';
import { dayjsRaPublishedAt } from '@/utils/publicationDate';
import { serializePublicationAttachmentUrls } from '@/utils/publicationAttachments';
import { laySchemaTheoMaLa, layNodeTheoPath } from '@/services/researchOutputFormSchema';

export type ValidateAdminPublicationOptions = {
  form: FormInstance;
  authors: PublicationAuthor[];
  researchOutputTree: ResearchOutputTypeTreeNode[];
  editingPub?: Publication | null;
};

export type AdminPublicationSavePayload = {
  researchOutputTypeId: number;
  title: string;
  authors: string;
  academicYear?: string;
  publishedAt?: string;
  publicationStatus: Publication['publicationStatus'];
  hdgsnnScore?: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  issn?: string;
  isbn?: string;
  url?: string;
  qRankUrl?: string | null;
  reputableListUrl?: string | null;
  acceptanceGrade?: 'EXCELLENT' | 'PASS_ON_TIME' | 'PASS_LATE' | null;
  attachmentUrl?: string;
  publicationType: Publication['publicationType'];
  journalOrConference: string;
  source: Publication['source'];
  sourceId?: string | null;
  verifiedByNcv: boolean;
  finalAuthors: PublicationAuthor[];
};

/** Ít nhất một tác giả được link NCV qua lookup — rule nghiệp vụ module quản lý */
export function coItNhatMotTacGiaLinkNcv(authors: PublicationAuthor[]): boolean {
  return authors.some((a) => a.profileId != null && Number.isFinite(Number(a.profileId)));
}

export function validateAndBuildAdminPublicationPayload(
  options: ValidateAdminPublicationOptions
): AdminPublicationSavePayload | null {
  const { form, authors, researchOutputTree, editingPub = null } = options;

  const values = form.getFieldsValue(true);
  const rotPath = values.researchOutputTypePath as number[] | undefined;
  if (!rotPath?.length) {
    message.error('Vui lòng chọn loại kết quả NCKH (danh mục) đến mục lá.');
    return null;
  }

  // Lưu yêu cầu đủ trường bắt buộc theo loại KQNC — kiểm tra đầy đủ chạy ở handleSave (kiemTraDayDuDeDuyet).
  const researchOutputTypeId = rotPath[rotPath.length - 1];
  const leafNode = layNodeTheoPath(researchOutputTree, rotPath);
  const coXepLoaiNghiemThu = (leafNode?.ruleKind ?? null) === 'MULTIPLY_C';

  const finalAuthors = reassignAuthorOrdersSequential(authors);

  const tacGiaNhapTayThieuGioiTinh = finalAuthors.filter((a) => laTacGiaNhapTay(a) && !a.gender);
  if (tacGiaNhapTayThieuGioiTinh.length > 0) {
    message.error('Vui lòng chọn giới tính cho các tác giả nhập tay (không chọn từ hệ thống).');
    return null;
  }

  const authorsFromTable = finalAuthors
    .slice()
    .sort((a, b) => a.authorOrder - b.authorOrder)
    .map((a) => a.fullName.trim())
    .filter(Boolean)
    .join(', ');
  if (!authorsFromTable) {
    message.error('Vui lòng nhập họ tên đầy đủ trong bảng tác giả chi tiết.');
    return null;
  }

  if (!coItNhatMotTacGiaLinkNcv(finalAuthors)) {
    message.error(
      'Cần ít nhất một tác giả được liên kết với NCV trong hệ thống — dùng lookup trong bảng tác giả.'
    );
    return null;
  }

  const publicationStatus = (values.publicationStatus || 'PUBLISHED') as Publication['publicationStatus'];
  const journalOrConference =
    (typeof values.journalOrConference === 'string' && values.journalOrConference.trim()) ||
    editingPub?.journalOrConference?.trim() ||
    '—';
  const chuanHoaLink = (v: unknown): string | null =>
    typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;

  return {
    researchOutputTypeId,
    title: values.title,
    authors: authorsFromTable,
    academicYear: values.academicYear,
    publishedAt: dayjsRaPublishedAt(values.publishedAt),
    publicationStatus,
    hdgsnnScore: values.hdgsnnScore,
    volume: values.volume,
    issue: values.issue,
    pages: values.pages,
    doi: values.doi,
    issn: values.issn,
    isbn: values.isbn,
    url: values.url,
    qRankUrl: chuanHoaLink(values.qRankUrl),
    reputableListUrl: chuanHoaLink(values.reputableListUrl),
    acceptanceGrade: coXepLoaiNghiemThu
      ? ((values.acceptanceGrade as AdminPublicationSavePayload['acceptanceGrade']) ?? null)
      : null,
    attachmentUrl: serializePublicationAttachmentUrls(values.attachmentUrls),
    publicationType: (editingPub?.publicationType ?? 'JOURNAL') as Publication['publicationType'],
    journalOrConference,
    source: (editingPub?.source ?? 'INTERNAL') as Publication['source'],
    sourceId: editingPub?.sourceId,
    verifiedByNcv: false,
    finalAuthors,
  };
}

/**
 * Kiểm tra đủ điều kiện DUYỆT theo schema loại KQNC (QĐ 1883).
 * Trả về danh sách nhãn trường còn thiếu — rỗng nghĩa là đủ điều kiện.
 */
export function kiemTraDayDuDeDuyet(
  values: Record<string, unknown>,
  authors: PublicationAuthor[],
  leafCode?: string | null,
  ruleKind?: string | null
): string[] {
  const schema = laySchemaTheoMaLa(leafCode ?? null, ruleKind ?? null);
  const thieu: string[] = [];
  const coChuoi = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const req = (k: Parameters<typeof schema.batBuocForm.includes>[0]) =>
    schema.batBuocForm.includes(k);

  if (req('journalName') && !coChuoi(values.journalOrConference)) thieu.push('Tên tạp chí / hội thảo');
  if (req('doi') && !coChuoi(values.doi)) thieu.push('Link DOI');
  if (req('qRankUrl') && !coChuoi(values.qRankUrl)) thieu.push('Link mức xếp hạng Q');
  if (req('reputableListUrl') && !coChuoi(values.reputableListUrl))
    thieu.push('Link danh mục tạp chí uy tín');
  if (req('hdgsnnScore') && !(Number(values.hdgsnnScore) > 0)) thieu.push('Điểm HĐGSNN');
  if (req('isbn') && !coChuoi(values.isbn)) thieu.push('ISBN');
  if (req('publishedAt') && values.publishedAt == null) thieu.push('Ngày xuất bản');
  // Rule "Nhân hệ số c" (đề tài): bắt buộc xếp loại nghiệm thu.
  if ((ruleKind ?? '').toUpperCase() === 'MULTIPLY_C' && !coChuoi(values.acceptanceGrade))
    thieu.push('Xếp loại nghiệm thu');
  if (req('attachment')) {
    const att = values.attachmentUrls;
    const coFile = Array.isArray(att) ? att.length > 0 : coChuoi(att);
    if (!coFile) thieu.push('File minh chứng');
  }
  if (req('contributionRate')) {
    const tong = authors.reduce(
      (s, a) => s + (a.contributionPercent != null ? Number(a.contributionPercent) : 0),
      0
    );
    const thieuTacGia = authors.some(
      (a) => a.contributionPercent == null || !(Number(a.contributionPercent) > 0)
    );
    if (authors.length === 0 || thieuTacGia || tong <= 0) thieu.push('Tỉ lệ % đóng góp của tác giả');
  }
  // Tổng % đóng góp phải bằng 100% (điều 1.4) — áp dụng cho mọi loại khi đã nhập %.
  const tongPhanTramDongGop = authors.reduce(
    (s, a) => s + (a.contributionPercent != null ? Number(a.contributionPercent) : 0),
    0
  );
  if (tongPhanTramDongGop > 0 && Math.abs(tongPhanTramDongGop - 100) > 0.01) {
    thieu.push(`Tổng tỉ lệ % đóng góp phải bằng 100% (hiện ${tongPhanTramDongGop}%)`);
  }
  return thieu;
}
