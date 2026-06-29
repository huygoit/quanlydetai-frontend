/**
 * Validate & ghép payload lưu KQNC — hồ sơ cá nhân (/profile/me)
 */
import type { FormInstance } from 'antd/es/form';
import { message } from 'antd';
import {
  chuanBiDanhSachTacGiaLuu,
  laTacGiaNhapTay,
  reassignAuthorOrdersSequential,
  type Publication,
  type PublicationAuthor,
  type ResearchOutputTypeTreeNode,
} from '@/services/api/profilePublications';
import { dayjsRaPublishedAt } from '@/utils/publicationDate';
import { serializePublicationAttachmentUrls } from '@/utils/publicationAttachments';
import { layNodeTheoPath, laySchemaTheoMaLa } from '@/services/researchOutputFormSchema';

export type ValidatePublicationOptions = {
  form: FormInstance;
  authors: PublicationAuthor[];
  researchOutputTree: ResearchOutputTypeTreeNode[];
  ownerProfileId: number;
  ownerFullName: string;
  isAdminKeKhai?: boolean;
  editingPub?: Publication | null;
  pendingOpenAlexSourceId?: string | null;
};

export type PublicationSavePayload = {
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

export function validateAndBuildPublicationPayload(
  options: ValidatePublicationOptions
): PublicationSavePayload | null {
  const {
    form,
    authors,
    researchOutputTree,
    ownerProfileId,
    ownerFullName,
    isAdminKeKhai = false,
    editingPub = null,
    pendingOpenAlexSourceId = null,
  } = options;

  const values = form.getFieldsValue(true);
  const rotPath = values.researchOutputTypePath as number[] | undefined;
  if (!rotPath?.length) {
    message.error('Vui lòng chọn loại kết quả NCKH (danh mục) đến mục lá.');
    return null;
  }

  const researchOutputTypeId = rotPath[rotPath.length - 1];
  const leafNode = layNodeTheoPath(researchOutputTree, rotPath);
  const schema = laySchemaTheoMaLa(leafNode?.code ?? null, leafNode?.ruleKind ?? null);

  // Validate đủ tất cả trường bắt buộc theo loại KQNC (QĐ 1883) ngay khi Lưu.
  const coChuoi = (v: unknown) => typeof v === 'string' && v.trim().length > 0;
  const req = (k: Parameters<typeof schema.batBuocForm.includes>[0]) =>
    schema.batBuocForm.includes(k);
  const batBuocThieu: string[] = [];
  if (req('journalName') && !coChuoi(values.journalOrConference))
    batBuocThieu.push('Tên tạp chí / hội thảo');
  if (req('doi') && !coChuoi(values.doi)) batBuocThieu.push('Link DOI');
  if (req('qRankUrl') && !coChuoi(values.qRankUrl)) batBuocThieu.push('Link mức xếp hạng Q');
  if (req('reputableListUrl') && !coChuoi(values.reputableListUrl))
    batBuocThieu.push('Link danh mục tạp chí uy tín');
  if (req('hdgsnnScore') && !(Number(values.hdgsnnScore) > 0)) batBuocThieu.push('Điểm HĐGSNN');
  if (req('isbn') && !coChuoi(values.isbn)) batBuocThieu.push('ISBN');
  if (req('publishedAt') && values.publishedAt == null) batBuocThieu.push('Ngày xuất bản');
  // Rule "Nhân hệ số c" (đề tài): bắt buộc xếp loại nghiệm thu.
  const coXepLoaiNghiemThu = (leafNode?.ruleKind ?? null) === 'MULTIPLY_C';
  if (coXepLoaiNghiemThu && !coChuoi(values.acceptanceGrade)) batBuocThieu.push('Xếp loại nghiệm thu');
  if (req('attachment')) {
    const att = values.attachmentUrls;
    const coFile = Array.isArray(att) ? att.length > 0 : coChuoi(att);
    if (!coFile) batBuocThieu.push('File minh chứng');
  }
  if (req('contributionRate')) {
    const thieuTacGia = authors.some(
      (a) => a.contributionPercent == null || !(Number(a.contributionPercent) > 0)
    );
    if (authors.length === 0 || thieuTacGia) batBuocThieu.push('Tỉ lệ % đóng góp của tác giả');
  }
  // Tổng % đóng góp phải bằng 100% (áp dụng cho mọi loại khi đã nhập %).
  const tongPhanTramDongGop = authors.reduce(
    (s, a) => s + (a.contributionPercent != null ? Number(a.contributionPercent) : 0),
    0
  );
  if (tongPhanTramDongGop > 0 && Math.abs(tongPhanTramDongGop - 100) > 0.01) {
    message.error(`Tổng tỉ lệ % đóng góp của các tác giả phải bằng 100% (hiện ${tongPhanTramDongGop}%)`);
    return null;
  }
  if (batBuocThieu.length) {
    message.error(`Thiếu trường bắt buộc cho ${schema.tenHienThi}: ${batBuocThieu.join(', ')}`);
    return null;
  }

  const finalAuthors = chuanBiDanhSachTacGiaLuu(reassignAuthorOrdersSequential(authors), {
    ownerProfileId,
    ownerFullName,
    adminKeKhai: isAdminKeKhai,
  });

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
      ? ((values.acceptanceGrade as PublicationSavePayload['acceptanceGrade']) ?? null)
      : null,
    attachmentUrl: serializePublicationAttachmentUrls(values.attachmentUrls),
    publicationType: (editingPub?.publicationType ?? 'JOURNAL') as Publication['publicationType'],
    journalOrConference,
    source: (pendingOpenAlexSourceId && !editingPub
      ? 'OPENALEX'
      : editingPub?.source ?? 'INTERNAL') as Publication['source'],
    sourceId:
      pendingOpenAlexSourceId && !editingPub ? pendingOpenAlexSourceId : editingPub?.sourceId,
    verifiedByNcv: false,
    finalAuthors,
  };
}
