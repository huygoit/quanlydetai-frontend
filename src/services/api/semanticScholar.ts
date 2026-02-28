/**
 * Semantic Scholar Integration Service
 * Import publications từ Semantic Scholar
 */
import { post, ApiResponse } from '../request';
import type { Publication } from './profilePublications';

export interface SemanticScholarImportParams {
  doi?: string;
  orcid?: string;
  authorName?: string;
  year?: number;
}

export interface SemanticScholarImportResult {
  imported: number;
  publications: Publication[];
  errors?: string[];
}

/**
 * Import publications từ Semantic Scholar
 * Yêu cầu ít nhất 1 trong: doi, orcid, authorName
 */
export async function importFromSemanticScholar(
  params: SemanticScholarImportParams
): Promise<ApiResponse<SemanticScholarImportResult>> {
  return post<ApiResponse<SemanticScholarImportResult>>(
    '/api/integrations/semantic-scholar/import',
    params
  );
}

/**
 * Validate params - cần ít nhất 1 field
 */
export function validateImportParams(params: SemanticScholarImportParams): boolean {
  return !!(params.doi || params.orcid || params.authorName);
}
