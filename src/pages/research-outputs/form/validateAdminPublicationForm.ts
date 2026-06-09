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
import { layNodeTheoPath, laySchemaTheoMaLa } from '@/services/researchOutputFormSchema';

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

  const researchOutputTypeId = rotPath[rotPath.length - 1];
  const leafNode = layNodeTheoPath(researchOutputTree, rotPath);
  const schema = laySchemaTheoMaLa(leafNode?.code ?? null, leafNode?.ruleKind ?? null);
  const batBuocThieu: string[] = [];
  if (schema.batBuocForm.includes('hdgsnnScore') && !(Number(values.hdgsnnScore) > 0)) {
    batBuocThieu.push('Điểm HĐGSNN');
  }
  if (
    schema.batBuocForm.includes('isbn') &&
    !(typeof values.isbn === 'string' && values.isbn.trim().length > 0)
  ) {
    batBuocThieu.push('ISBN');
  }
  if (batBuocThieu.length) {
    message.error(`Thiếu trường bắt buộc cho ${schema.tenHienThi}: ${batBuocThieu.join(', ')}`);
    return null;
  }

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
  const journalOrConference = editingPub?.journalOrConference?.trim() || '—';

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
    attachmentUrl: serializePublicationAttachmentUrls(values.attachmentUrls),
    publicationType: (editingPub?.publicationType ?? 'JOURNAL') as Publication['publicationType'],
    journalOrConference,
    source: (editingPub?.source ?? 'INTERNAL') as Publication['source'],
    sourceId: editingPub?.sourceId,
    verifiedByNcv: false,
    finalAuthors,
  };
}
