/**
 * Vai trò thành viên đề xuất đề tài — khớp BE app/constants/proposal_member_role.ts
 */
export const PROPOSAL_MEMBER_ROLES = {
  PRINCIPAL: 'PRINCIPAL',
  SECRETARY: 'SECRETARY',
  MEMBER: 'MEMBER',
} as const;

export type ProposalMemberRole =
  (typeof PROPOSAL_MEMBER_ROLES)[keyof typeof PROPOSAL_MEMBER_ROLES];

export const PROPOSAL_MEMBER_ROLE_OPTIONS: Array<{
  value: ProposalMemberRole;
  label: string;
}> = [
  { value: 'PRINCIPAL', label: 'Chủ nhiệm' },
  { value: 'SECRETARY', label: 'Thư ký' },
  { value: 'MEMBER', label: 'Thành viên' },
];

export const PROPOSAL_MEMBER_ROLE_LABEL: Record<ProposalMemberRole, string> = {
  PRINCIPAL: 'Chủ nhiệm',
  SECRETARY: 'Thư ký',
  MEMBER: 'Thành viên',
};

export const PROPOSAL_MEMBER_ROLE_COLOR: Record<ProposalMemberRole, string> = {
  PRINCIPAL: 'blue',
  SECRETARY: 'purple',
  MEMBER: 'default',
};

/** Chuẩn hoá role từ API; mặc định Thành viên. */
export function resolveProposalMemberRole(raw: unknown): ProposalMemberRole {
  const s = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (s === 'PRINCIPAL' || s === 'SECRETARY' || s === 'MEMBER') return s;
  return 'MEMBER';
}
