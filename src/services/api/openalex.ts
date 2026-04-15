import { get, ApiResponse } from '../request';
import type { PublicationAuthor, Publication } from './profilePublications';

export interface OpenAlexPublicationDraft {
  source: 'OPENALEX';
  sourceId: string;
  title: string;
  year: number | null;
  doi: string | null;
  issn: string | null;
  volume: string | null;
  issue: string | null;
  pages: string | null;
  url: string | null;
  journalOrConference: string;
  publicationType: Publication['publicationType'];
  publicationStatus: Publication['publicationStatus'];
  authorsText: string;
  researchOutputTypeId: number | null;
  researchOutputTypeCode: string | null;
  typeMappingReason: string;
  needsIndexConfirmation: boolean;
  authors: PublicationAuthor[];
}

export interface GetOpenAlexDraftsParams {
  year?: number;
  perPage?: number;
}

export async function getMyOpenAlexPublicationDrafts(
  params?: GetOpenAlexDraftsParams
): Promise<ApiResponse<OpenAlexPublicationDraft[]>> {
  return get<ApiResponse<OpenAlexPublicationDraft[]>>('/api/profile/me/openalex/publication-drafts', params);
}
