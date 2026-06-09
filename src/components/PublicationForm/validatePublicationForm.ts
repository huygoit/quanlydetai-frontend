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
    source: (pendingOpenAlexSourceId && !editingPub
      ? 'OPENALEX'
      : editingPub?.source ?? 'INTERNAL') as Publication['source'],
    sourceId:
      pendingOpenAlexSourceId && !editingPub ? pendingOpenAlexSourceId : editingPub?.sourceId,
    verifiedByNcv: false,
    finalAuthors,
  };
}
