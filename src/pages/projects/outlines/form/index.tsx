/**
 * Form soạn / nộp thuyết minh + hoàn thiện theo biên bản BM.05b
 */
import AuthorsEditor from '@/components/AuthorsEditor';
import ProposalAttachmentUpload from '@/components/ProposalAttachmentUpload';
import RichTextHtmlField, {
  cleanRichHtml,
} from '@/components/RichTextHtmlField';
import {
  getAuthorPrincipalInfo,
  lookupAuthorProfiles,
  normalizePublicationAuthor,
  type AuthorProfileLookupItem,
  type PublicationAuthor,
} from '@/services/api/profilePublications';
import {
  OUTLINE_STATUS_MAP,
  confirmOutlineRevisionCouncil,
  confirmOutlineRevisionPkh,
  exportOutlineDocx,
  extendOutlineRevisionDeadline,
  getOutline,
  getOutlineRevisionDiff,
  listEligibleProposalsForOutline,
  saveOutlineDraft,
  submitOutline,
  submitOutlineRevision,
  withdrawOutline,
  type OutlineFieldDiff,
  type OutlineFileDiff,
  type OutlineMilestone,
  EMPTY_EXPECTED_RESULTS,
  EMPTY_FUNDING_BREAKDOWN,
  EMPTY_OTHER_CONTENTS,
  fundingExternalTotal,
  fundingTotalByEntity,
  fundingTotalByNature,
  normalizeFundingBreakdown,
  type OutlineExpectedResults,
  type OutlineFundingBreakdown,
  type OutlineHostOrganization,
  type OutlineOtherContents,
  type OutlinePartnerUnit,
  type OutlinePrincipalInfo,
  type OutlineRevisionContext,
  type ProjectOutline,
} from '@/services/api/projectOutlines';
import {
  getProjectProcessTypeOptions,
  type ProjectProcessTypeOption,
} from '@/services/api/projectProcessTypes';
import { formatDate } from '@/utils/datetime';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import {
  loadFieldSelectOptions,
  type SelectOption,
} from '@/utils/researchCatalogOptions';
import {
  ArrowLeftOutlined,
  BankOutlined,
  DollarOutlined,
  DownloadOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  FooterToolbar,
  PageContainer,
  ProForm,
  ProFormDatePicker,
  ProFormSelect,
  ProFormText,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { history, useAccess, useModel, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import BudgetMatrixTable, {
  EMPTY_BUDGET_MATRIX,
} from './BudgetMatrixTable';
import ExpectedResultsPanels from './ExpectedResultsPanels';
import OtherContentsPanels from './OtherContentsPanels';
import RevisionWorkbench from './RevisionWorkbench';
import {
  addExpenseRows,
  calcRowTotal,
  normalizeBudgetMatrix,
  type OutlineBudgetMatrix,
} from '@/constants/outlineBudgetMatrix';

const { Text } = Typography;
const { TextArea } = Input;

/** Hiển thị giá trị hồ sơ; thiếu thì "Chưa có" */
function hienThiHoSo(v?: string | null): string {
  const s = String(v || '').trim();
  return s || 'Chưa có';
}

function chuanHoaGioiTinh(g?: string | null): 'MALE' | 'FEMALE' | null {
  const s = String(g || '')
    .trim()
    .toUpperCase();
  if (!s) return null;
  if (s === 'MALE' || s === 'NAM' || s === 'M') return 'MALE';
  if (s === 'FEMALE' || s === 'NỮ' || s === 'NU' || s === 'F') return 'FEMALE';
  return null;
}

const OutlineFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const userId = Number(initialState?.currentUser?.id || 0);
  const quyen =
    initialState?.currentUser?.permissions || initialState?.permissions || [];
  const duocDuyetPkh =
    quyen.includes('*') ||
    quyen.includes('project.review') ||
    quyen.includes('project.selection_manage');
  const outlineId = Number(id);
  const formRef = useRef<ProFormInstance>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [outline, setOutline] = useState<ProjectOutline | null>(null);
  const [revisionCtx, setRevisionCtx] = useState<OutlineRevisionContext | null>(
    null,
  );
  const [explanation, setExplanation] = useState('');
  const [diffOpen, setDiffOpen] = useState(false);
  const [diffs, setDiffs] = useState<OutlineFieldDiff[]>([]);
  const [fileDiff, setFileDiff] = useState<OutlineFileDiff | null>(null);
  const [diffNote, setDiffNote] = useState('');
  const [formReadyKey, setFormReadyKey] = useState(0);
  const [formInitial, setFormInitial] = useState<Record<string, unknown>>({});
  const [processTypes, setProcessTypes] = useState<ProjectProcessTypeOption[]>(
    [],
  );
  const [fieldOptions, setFieldOptions] = useState<SelectOption[]>([]);
  const [members, setMembers] = useState<PublicationAuthor[]>([]);
  const [budgetMatrix, setBudgetMatrix] = useState<OutlineBudgetMatrix>({
    ...EMPTY_BUDGET_MATRIX,
  });
  const [milestones, setMilestones] = useState<OutlineMilestone[]>([]);
  const [expectedResults, setExpectedResults] =
    useState<OutlineExpectedResults>({ ...EMPTY_EXPECTED_RESULTS });
  const [otherContents, setOtherContents] = useState<OutlineOtherContents>({
    ...EMPTY_OTHER_CONTENTS,
  });
  const [partners, setPartners] = useState<OutlinePartnerUnit[]>([]);
  const [funding, setFunding] = useState<OutlineFundingBreakdown>({
    ...EMPTY_FUNDING_BREAKDOWN,
  });
  const [principal, setPrincipal] = useState<OutlinePrincipalInfo | null>(null);
  const [principalSearch, setPrincipalSearch] = useState('');
  const [principalOptions, setPrincipalOptions] = useState<
    AuthorProfileLookupItem[]
  >([]);
  const [principalSearching, setPrincipalSearching] = useState(false);
  const [principalLoading, setPrincipalLoading] = useState(false);
  const principalSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [duocSoan, setDuocSoan] = useState(false);
  const [tabMuc, setTabMuc] = useState('A');

  const isRevision = outline?.status === 'CHINH_SUA_TM';
  const dangChoDuyetTm =
    outline?.status === 'CHO_PKH_DUYET_TM' ||
    outline?.status === 'CHO_HD_XAC_NHAN_TM' ||
    outline?.status === 'CHO_BGH_DUYET_TM' ||
    outline?.status === 'CHO_HC_PHAT_HANH_QD';
  const hienBangHoanThien = isRevision || dangChoDuyetTm;
  const editable =
    duocSoan &&
    (outline?.status === 'THUYETMINH_DRAFT' ||
      (isRevision && !!revisionCtx?.editable));
  // Lấy từ revisionContext — không gọi API phiên HĐ (CNĐT không phải thành viên HĐ sẽ bị 403).
  const thuKyId = revisionCtx?.thuKyUserId;
  const chuTichId = revisionCtx?.chuTichUserId;
  const dangChoHd = outline?.status === 'CHO_HD_XAC_NHAN_TM';
  const gate = revisionCtx?.revisionGateStatus;
  // Thư ký chỉ duyệt khi đang chờ thư ký (và không phải chính mình là chủ tịch đang hiện nút chủ tịch).
  const hienThuKy =
    dangChoHd &&
    gate === 'CHO_THU_KY' &&
    !!userId &&
    Number(thuKyId) === userId &&
    Number(chuTichId) !== userId;
  // Chủ tịch duyệt được khi chờ thư ký hoặc chờ chủ tịch.
  const hienChuTich =
    dangChoHd &&
    (gate === 'CHO_THU_KY' || gate === 'CHO_CHU_TICH') &&
    !!userId &&
    Number(chuTichId) === userId;
  const hienPkh =
    outline?.status === 'CHO_PKH_DUYET_TM' &&
    revisionCtx?.revisionGateStatus === 'CHO_PKH' &&
    duocDuyetPkh;
  const hienBgh =
    outline?.status === 'CHO_BGH_DUYET_TM' &&
    !!access.canApproveOutlineRevisionBgh;
  const stMeta = outline ? OUTLINE_STATUS_MAP[outline.status] : null;

  const totalDetail = useMemo(() => {
    const m = normalizeBudgetMatrix(budgetMatrix);
    return calcRowTotal(
      addExpenseRows(
        addExpenseRows(m.STATE_LUMP, m.STATE_NON_LUMP),
        m.NON_STATE,
      ),
    ).tong;
  }, [budgetMatrix]);
  const externalTong = useMemo(() => fundingExternalTotal(funding), [funding]);
  const tongTheoChuThe = useMemo(
    () => fundingTotalByEntity(funding),
    [funding],
  );
  const tongTheoTinhChat = useMemo(
    () => fundingTotalByNature(funding),
    [funding],
  );
  const fundingNatureMismatch = useMemo(
    () => Math.abs(tongTheoChuThe - tongTheoTinhChat) > 0,
    [tongTheoChuThe, tongTheoTinhChat],
  );

  /** Cập nhật số tiền nguồn kinh phí / khoán chi */
  const doiFunding = (
    key:
      | 'schoolFund'
      | 'externalFund'
      | 'stateBudget'
      | 'nonStateBudget'
      | 'lumpSumAmount'
      | 'nonLumpSumAmount',
    value: number | null,
  ) => {
    setFunding((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.round(Number(value || 0))),
    }));
  };

  /** Chọn phương thức khoán chi (§5) */
  const doiPhuongThucKhoan = (mode: 'FULL' | 'PARTIAL') => {
    setFunding((prev) => {
      if (mode === 'FULL') {
        return {
          ...prev,
          lumpSumMode: 'FULL',
          lumpSumAmount: 0,
          nonLumpSumAmount: 0,
        };
      }
      return { ...prev, lumpSumMode: 'PARTIAL' };
    });
  };

  /** Tìm NCV cho ô chọn chủ nhiệm */
  const timChuNhiem = (q: string) => {
    setPrincipalSearch(q);
    if (principalSearchTimer.current) clearTimeout(principalSearchTimer.current);
    if (q.trim().length < 2) {
      setPrincipalOptions([]);
      return;
    }
    principalSearchTimer.current = setTimeout(async () => {
      setPrincipalSearching(true);
      try {
        const rows = await lookupAuthorProfiles(q, 20);
        setPrincipalOptions(rows);
      } catch {
        setPrincipalOptions([]);
      } finally {
        setPrincipalSearching(false);
      }
    }, 300);
  };

  /** Chọn hồ sơ → nạp chi tiết chủ nhiệm + đồng bộ thành viên PRINCIPAL */
  const chonChuNhiem = async (profileId: number) => {
    if (!profileId) return;
    setPrincipalLoading(true);
    try {
      const info = await getAuthorPrincipalInfo(profileId);
      if (!info) {
        message.warning('Không tải được thông tin hồ sơ');
        return;
      }
      const snap: OutlinePrincipalInfo = {
        profileId: info.profileId,
        fullName: info.fullName || null,
        identityNumber: info.identityNumber || null,
        dateOfBirth: info.dateOfBirth || null,
        gender: info.gender || null,
        academicTitleDegree: info.academicTitleDegree || null,
        professionalTitle: info.professionalTitle || null,
        position: info.position || null,
        phone: info.phone || null,
        email: info.email || null,
        organization: info.organization || null,
        workAddress: info.workAddress || null,
      };
      setPrincipal(snap);
      setPrincipalSearch(info.fullName || '');
      setMembers((prev) => {
        const next = [...prev];
        const idx = next.findIndex(
          (m) => m.proposalMemberRole === 'PRINCIPAL',
        );
        const row = normalizePublicationAuthor({
          ...(idx >= 0 ? next[idx] : {}),
          profileId: info.profileId,
          studentId: null,
          fullName: info.fullName || '',
          gender: chuanHoaGioiTinh(info.gender),
          proposalMemberRole: 'PRINCIPAL',
          authorOrder: 1,
          isTopAuthor: true,
          isCorresponding: false,
          affiliationUnits: info.organization ? [info.organization] : [],
          affiliationType: 'UDN',
          isMultiAffiliationOutsideUdn: false,
        } as PublicationAuthor);
        if (idx >= 0) next[idx] = row;
        else next.unshift(row);
        return next.map((m, i) => ({ ...m, authorOrder: i + 1 }));
      });
    } catch (e: any) {
      message.error(e?.message || 'Không tải được thông tin chủ nhiệm');
    } finally {
      setPrincipalLoading(false);
    }
  };

  const load = async () => {
    if (!Number.isFinite(outlineId)) return;
    setLoading(true);
    try {
      const [res, opts, fields] = await Promise.all([
        getOutline(outlineId),
        getProjectProcessTypeOptions(),
        loadFieldSelectOptions(),
      ]);
      const d = res.data;
      if (!d) throw new Error('Không tải được thuyết minh');
      // Ưu tiên cờ canWrite từ API (CNĐT PRINCIPAL / owner / được giao).
      // Fallback: ownerId hoặc danh sách đề xuất đủ điều kiện — tránh sót chủ nhiệm thật.
      let duoc = !!d.canWrite;
      if (!duoc) {
        const laChu = Number(d.ownerId) === userId && userId > 0;
        duoc = laChu;
        if (!duoc && access.canWriteProjectOutline) {
          const duDieuKien = await listEligibleProposalsForOutline().catch(
            () => null,
          );
          duoc = (duDieuKien?.data || []).some(
            (p) => p.outlineId === d.id || p.id === d.projectProposalId,
          );
        }
      }
      setDuocSoan(duoc);
      setOutline(d);
      setRevisionCtx(d.revisionContext || null);
      setExplanation(
        d.revisionContext?.revisionExplanation || d.revisionExplanation || '',
      );
      setProcessTypes(opts.data || []);
      // Giữ giá trị cũ nếu chưa có trong danh mục (dữ liệu lịch sử nhập tay)
      const fieldCu = String(d.field || '').trim();
      setFieldOptions(
        fieldCu && !fields.some((f) => f.value === fieldCu)
          ? [{ label: fieldCu, value: fieldCu }, ...fields]
          : fields,
      );
      setMembers(
        (d.members?.length ? d.members : []).map((m) =>
          normalizePublicationAuthor(m as PublicationAuthor),
        ),
      );
      setBudgetMatrix(
        d.budgetMatrix
          ? normalizeBudgetMatrix(d.budgetMatrix)
          : { ...EMPTY_BUDGET_MATRIX },
      );
      setMilestones(
        d.milestones?.length
          ? d.milestones.map((m) => ({
              ...m,
              content: cleanRichHtml(m.content),
              expectedResult: cleanRichHtml(m.expectedResult),
            }))
          : [{ content: '' }],
      );
      setExpectedResults(
        d.expectedResults
          ? {
              publications: d.expectedResults.publications || [],
              appliedProducts: d.expectedResults.appliedProducts || [],
              tangibleProducts: d.expectedResults.tangibleProducts || [],
              ipProducts: d.expectedResults.ipProducts || [],
              postgraduateTraining:
                d.expectedResults.postgraduateTraining || [],
            }
          : { ...EMPTY_EXPECTED_RESULTS },
      );
      setOtherContents(
        d.otherContents
          ? {
              ...EMPTY_OTHER_CONTENTS,
              ...d.otherContents,
              applicationTransferHtml: cleanRichHtml(
                d.otherContents.applicationTransferHtml,
              ),
              outputEffectivenessHtml: cleanRichHtml(
                d.otherContents.outputEffectivenessHtml,
              ),
              impactAssessmentHtml: cleanRichHtml(
                d.otherContents.impactAssessmentHtml,
              ),
              riskManagementHtml: cleanRichHtml(
                d.otherContents.riskManagementHtml,
              ),
              ethicsDataApprovalHtml: cleanRichHtml(
                d.otherContents.ethicsDataApprovalHtml,
              ),
              dataManagementPlanHtml: cleanRichHtml(
                d.otherContents.dataManagementPlanHtml,
              ),
              ipProtectionHtml: cleanRichHtml(
                d.otherContents.ipProtectionHtml,
              ),
              aiUsageHtml: cleanRichHtml(d.otherContents.aiUsageHtml),
            }
          : { ...EMPTY_OTHER_CONTENTS },
      );
      setPartners(d.partnerUnits?.length ? d.partnerUnits : []);
      // Nguồn kinh phí: ưu tiên JSON; nếu trống thì đổ tổng cũ vào phần Trường
      const fb = d.fundingBreakdown;
      if (fb && typeof fb === 'object') {
        setFunding(normalizeFundingBreakdown(fb));
      } else {
        setFunding(
          normalizeFundingBreakdown({
            ...EMPTY_FUNDING_BREAKDOWN,
            schoolFund: Number(d.requestedBudget || 0),
          }),
        );
      }
      // Chủ nhiệm: snapshot đã lưu hoặc nạp lại từ profileId thành viên PRINCIPAL
      if (d.principalInfo?.fullName || d.principalInfo?.profileId) {
        setPrincipal(d.principalInfo);
        setPrincipalSearch(d.principalInfo.fullName || '');
      } else {
        const cn = (d.members || []).find(
          (m) =>
            (m as { role?: string }).role === 'PRINCIPAL' ||
            (m as { proposalMemberRole?: string }).proposalMemberRole ===
              'PRINCIPAL',
        );
        const pid = Number((cn as { profileId?: number } | undefined)?.profileId || 0);
        if (pid > 0) {
          void getAuthorPrincipalInfo(pid).then((info) => {
            if (!info) return;
            setPrincipal({
              profileId: info.profileId,
              fullName: info.fullName || null,
              identityNumber: info.identityNumber || null,
              dateOfBirth: info.dateOfBirth || null,
              gender: info.gender || null,
              academicTitleDegree: info.academicTitleDegree || null,
              professionalTitle: info.professionalTitle || null,
              position: info.position || null,
              phone: info.phone || null,
              email: info.email || null,
              organization: info.organization || null,
              workAddress: info.workAddress || null,
            });
            setPrincipalSearch(info.fullName || '');
          });
        } else {
          setPrincipal(null);
          setPrincipalSearch('');
        }
      }
      // Gán initialValues + remount form để chắc chắn đổ data từ đề xuất
      const hostOrg: OutlineHostOrganization = {
        name: d.hostOrganization?.name || d.hostUnit || '',
        orgCode: d.hostOrganization?.orgCode || '',
        phone: d.hostOrganization?.phone || '',
        address: d.hostOrganization?.address || '',
        leaderName: d.hostOrganization?.leaderName || '',
        experienceHtml: cleanRichHtml(d.hostOrganization?.experienceHtml),
        teamCapacityHtml: cleanRichHtml(d.hostOrganization?.teamCapacityHtml),
      };
      setFormInitial({
        title: d.title,
        projectProcessTypeId: d.projectProcessTypeId,
        field: d.field,
        startDate: d.startDate ? dayjs(d.startDate) : undefined,
        endDate: d.endDate ? dayjs(d.endDate) : undefined,
        requestedBudget: d.requestedBudget,
        hostUnit: hostOrg.name || d.hostUnit,
        hostOrganization: hostOrg,
        urgency: cleanRichHtml(d.urgency),
        detailedObjectives: cleanRichHtml(d.detailedObjectives),
        researchContent: cleanRichHtml(d.researchContent),
        methodology: cleanRichHtml(d.methodology),
        summary: d.summary || '',
        outlineFileUrl: d.outlineFileUrl,
        appendixFileUrl: d.appendixFileUrl,
      });
      setFormReadyKey((k) => k + 1);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId, userId]);

  const buildPayload = () => {
    const v = formRef.current?.getFieldsValue() || {};
    const ho = (v.hostOrganization || {}) as OutlineHostOrganization;
    const hostName = String(ho.name || v.hostUnit || '').trim();
    const hostOrganization: OutlineHostOrganization = {
      name: hostName,
      orgCode: String(ho.orgCode || '').trim() || null,
      phone: String(ho.phone || '').trim() || null,
      address: String(ho.address || '').trim() || null,
      leaderName: String(ho.leaderName || '').trim() || null,
      experienceHtml: ho.experienceHtml ?? null,
      teamCapacityHtml: ho.teamCapacityHtml ?? null,
    };
    return {
      title: v.title,
      projectProcessTypeId: v.projectProcessTypeId ?? null,
      field: v.field ?? null,
      startDate: v.startDate ? dayjs(v.startDate).toISOString() : null,
      endDate: v.endDate ? dayjs(v.endDate).toISOString() : null,
      fundingBreakdown: normalizeFundingBreakdown(funding),
      requestedBudget: fundingTotalByEntity(funding),
      principalInfo: principal,
      hostUnit: hostName || null,
      hostOrganization,
      partnerUnits: partners
        .filter((p) => p.name?.trim())
        .map((p) => ({
          name: String(p.name || '').trim(),
          orgCode: String(p.orgCode || '').trim() || null,
          phone: String(p.phone || '').trim() || null,
          address: String(p.address || '').trim() || null,
        })),
      urgency: v.urgency ?? null,
      detailedObjectives: v.detailedObjectives ?? null,
      researchContent: v.researchContent ?? null,
      methodology: v.methodology ?? null,
      milestones: milestones.filter(
        (m) =>
          !!(m.content || '')
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .trim() ||
          m.startDate ||
          m.endDate ||
          m.expectedResult,
      ),
      expectedResults,
      otherContents,
      summary: v.summary ?? null,
      outlineFileUrl: v.outlineFileUrl ?? null,
      appendixFileUrl: v.appendixFileUrl ?? null,
      revisionExplanation: isRevision ? explanation : undefined,
      members: members.map((m, i) => ({
        id: typeof m.id === 'number' ? m.id : undefined,
        profileId: m.profileId ?? null,
        studentId: m.studentId ?? null,
        fullName: m.fullName?.trim() || '',
        memberOrder: m.authorOrder || i + 1,
        authorOrder: m.authorOrder || i + 1,
        role: m.proposalMemberRole || 'MEMBER',
        proposalMemberRole: m.proposalMemberRole || 'MEMBER',
        affiliationType: m.affiliationType ?? null,
        affiliationUnits: m.affiliationUnits ?? [],
        contributionPercent: m.contributionPercent ?? null,
        gender: m.gender ?? null,
        isMultiAffiliationOutsideUdn: !!m.isMultiAffiliationOutsideUdn,
      })),
      budgetMatrix: normalizeBudgetMatrix(budgetMatrix),
    };
  };

  const luuNhap = async (opts?: { silent?: boolean }) => {
    if (!outline || !editable) return false;
    setSaving(true);
    try {
      const res = await saveOutlineDraft(outline.id, buildPayload());
      if (!opts?.silent) message.success('Đã lưu nháp');
      // Chỉ cập nhật meta/progress — không remount form (tránh mất ngày/nội dung đang nhập)
      if (res.data) {
        setOutline(res.data);
        setRevisionCtx(res.data.revisionContext || null);
        setMembers(
          (res.data.members || []).map((m) =>
            normalizePublicationAuthor(m as PublicationAuthor),
          ),
        );
        if (res.data.budgetMatrix) {
          setBudgetMatrix(normalizeBudgetMatrix(res.data.budgetMatrix));
        }
        if (res.data.milestones?.length) setMilestones(res.data.milestones);
        if (res.data.expectedResults) {
          setExpectedResults({
            publications: res.data.expectedResults.publications || [],
            appliedProducts: res.data.expectedResults.appliedProducts || [],
            tangibleProducts: res.data.expectedResults.tangibleProducts || [],
            ipProducts: res.data.expectedResults.ipProducts || [],
            postgraduateTraining:
              res.data.expectedResults.postgraduateTraining || [],
          });
        }
        if (res.data.otherContents) {
          setOtherContents({
            ...EMPTY_OTHER_CONTENTS,
            ...res.data.otherContents,
          });
        }
        if (res.data.partnerUnits?.length) setPartners(res.data.partnerUnits);
        formRef.current?.setFieldsValue({
          completionPercent: res.data.completionPercent,
        });
      }
      return true;
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
      return false;
    } finally {
      setSaving(false);
    }
  };

  /** Xuất Word BM-02.02; nếu đang sửa thì lưu nháp trước */
  const xuatThuyetMinh = async () => {
    if (!outline?.id) return;
    setExporting(true);
    try {
      if (editable) {
        const ok = await luuNhap({ silent: true });
        if (!ok) return;
      }
      await exportOutlineDocx(
        outline.id,
        `BM-02.02_${outline.code || outline.id}.docx`,
      );
      message.success('Đã xuất file thuyết minh');
    } catch (e: any) {
      message.error(e?.message || 'Xuất thuyết minh thất bại');
    } finally {
      setExporting(false);
    }
  };

  const nopChinhThuc = () => {
    if (!outline || !editable || isRevision) return;
    Modal.confirm({
      title: 'Xác nhận nộp thuyết minh',
      content:
        'Bạn có chắc nộp chính thức bản thuyết minh? Sau khi nộp, form sẽ khóa và Phòng Khoa học nhận thông báo.',
      okText: 'Nộp chính thức',
      cancelText: 'Hủy',
      onOk: async () => {
        setSaving(true);
        try {
          await saveOutlineDraft(outline.id, buildPayload());
          const res = await submitOutline(outline.id);
          message.success(res.message || 'Đã nộp thuyết minh');
          setOutline(res.data || outline);
          await load();
        } catch (e: any) {
          const errs = e?.data?.errors as string[] | undefined;
          message.error(
            errs?.[0] || e?.data?.message || e?.message || 'Nộp thất bại',
          );
          throw e;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const nopBanHoanThien = () => {
    if (!outline || !isRevision || !revisionCtx?.canSubmit) return;
    const minLen = revisionCtx.minExplanationLength || 100;
    if ((explanation || '').trim().length < minLen) {
      message.warning(`Giải trình bắt buộc ≥ ${minLen} ký tự`);
      return;
    }
    Modal.confirm({
      title: 'Nộp bản hoàn thiện cho phòng khoa học?',
      content:
        'Hệ thống giữ nguyên bản gốc HĐ đã đánh giá, khóa bản hoàn thiện mới, rồi chuyển Phòng KH → Hội đồng → BGH phê duyệt (không qua xác nhận kinh phí cũ).',
      okText: 'Nộp cho phòng khoa học',
      cancelText: 'Hủy',
      onOk: async () => {
        setSaving(true);
        try {
          await saveOutlineDraft(outline.id, buildPayload());
          const res = await submitOutlineRevision(
            outline.id,
            explanation.trim(),
          );
          message.success(res.message || 'Đã nộp bản hoàn thiện cho PKH');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Nộp thất bại');
          throw e;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const moSoSanh = async () => {
    if (!outline) return;
    try {
      const res = await getOutlineRevisionDiff(outline.id);
      setDiffs(res.data?.diffs || []);
      setFileDiff(res.data?.fileDiff || null);
      setDiffNote(res.data?.diffLimitNote || '');
      setDiffOpen(true);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không so sánh được');
    }
  };

  const giaHan = () => {
    if (!outline || !access.canExtendOutlineRevision) return;
    let deadlineAt = '';
    let reason = '';
    Modal.confirm({
      title: 'Gia hạn chỉnh sửa thuyết minh',
      content: (
        <Space direction="vertical" style={{ width: '100%' }}>
          <DatePicker
            style={{ width: '100%' }}
            onChange={(d) => {
              deadlineAt = d ? d.endOf('day').toISOString() : '';
            }}
          />
          <TextArea
            rows={2}
            placeholder="Lý do gia hạn (≥ 5 ký tự)"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </Space>
      ),
      okText: 'Gia hạn',
      onOk: async () => {
        if (!deadlineAt || reason.trim().length < 5) {
          message.warning('Chọn hạn mới và nhập lý do');
          return Promise.reject();
        }
        try {
          await extendOutlineRevisionDeadline(outline.id, {
            deadlineAt,
            reason: reason.trim(),
          });
          message.success('Đã gia hạn');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Gia hạn thất bại');
          return Promise.reject();
        }
      },
    });
  };

  const xacNhanBanHoanThien = (accept: boolean) => {
    if (!outline) return;
    const gui = async (reason?: string) => {
      const body = { accept, reason };
      let res;
      if (outline.status === 'CHO_PKH_DUYET_TM') {
        res = await confirmOutlineRevisionPkh(outline.id, body);
      } else {
        res = await confirmOutlineRevisionCouncil(outline.id, body);
      }
      message.success(res.message || (accept ? 'Đã xác nhận' : 'Đã trả lại'));
      await load();
    };
    if (accept) {
      Modal.confirm({
        title: 'Đồng ý bản hoàn thiện?',
        okText: 'Đồng ý',
        cancelText: 'Hủy',
        onOk: () => gui(),
      });
      return;
    }
    let reason = '';
    Modal.confirm({
      title: 'Trả lại bản hoàn thiện',
      okText: 'Trả lại',
      cancelText: 'Hủy',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Lý do trả lại (tối thiểu 5 ký tự)"
          onChange={(e) => {
            reason = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        if (reason.trim().length < 5) {
          message.warning('Lý do tối thiểu 5 ký tự');
          return Promise.reject();
        }
        await gui(reason.trim());
      },
    });
  };

  const rutLai = () => {
    if (!outline || outline.status !== 'THUYETMINH_PENDING') return;
    Modal.confirm({
      title: 'Rút lại thuyết minh',
      content: 'Bản thuyết minh sẽ trở về trạng thái nháp để chỉnh sửa.',
      okText: 'Rút lại',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const res = await withdrawOutline(outline.id);
          message.success(res.message || 'Đã rút lại');
          await load();
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Rút lại thất bại');
          throw e;
        }
      },
    });
  };

  const budgetDiff = Math.abs(totalDetail - tongTheoChuThe);

  return (
    <PageContainer
      loading={loading}
      title={outline ? `Thuyết minh ${outline.code}` : 'Soạn thuyết minh'}
      subTitle={
        stMeta ? (
          <Space>
            <Tag color={stMeta.color}>{stMeta.label}</Tag>
            {outline?.projectProposal?.code && (
              <Text type="secondary">
                Đề xuất: {outline.projectProposal.code}
              </Text>
            )}
          </Space>
        ) : undefined
      }
      extra={
        outline?.activeContractId || outline?.executionStatus ? (
          <Space>
            {outline.activeContractId ? (
              <Button
                onClick={() =>
                  history.push(
                    `/projects/contracts/${outline.activeContractId}`,
                  )
                }
              >
                Hợp đồng
              </Button>
            ) : null}
            {outline.executionStatus ? (
              <Button
                type="primary"
                onClick={() =>
                  history.push(`/projects/execution/${outline.id}`)
                }
              >
                Triển khai
              </Button>
            ) : null}
          </Space>
        ) : undefined
      }
    >
      <Space
        direction="vertical"
        size={16}
        style={{ width: '100%', paddingBottom: 72 }}
      >
        {outline?.councilFeedback && (
          <Alert
            type="info"
            showIcon
            message="Góp ý Hội đồng (tham khảo khi soạn thuyết minh)"
            description={outline.councilFeedback}
          />
        )}
        {!editable && outline?.status === 'THUYETMINH_PENDING' && (
          <Alert
            type="success"
            showIcon
            message="Đã nộp chính thức — form chỉ đọc"
            description="Bạn có thể rút lại nếu PKH chưa phân công phản biện."
          />
        )}
        {outline?.status === 'PHANBIEN_KIN' && (
          <Alert
            type="info"
            showIcon
            message="Đang phản biện kín"
            description="Danh tính phản biện được bảo mật với chủ nhiệm và thành viên đề tài trong suốt quá trình đánh giá. Không thể rút lại thuyết minh."
          />
        )}
        {!duocSoan &&
          (outline?.status === 'THUYETMINH_DRAFT' || isRevision) && (
            <Alert
              type="info"
              showIcon
              message="Bạn được xem thuyết minh này, không sửa được."
            />
          )}
        {isRevision && duocSoan && revisionCtx?.pastDeadline && (
          <Alert
            type="error"
            showIcon
            message="Đã quá hạn hoàn thiện thuyết minh"
            description="Form đang khóa. Liên hệ Phòng Khoa học để gia hạn, sau đó mới sửa và nộp lại được."
          />
        )}
        {isRevision && duocSoan && !revisionCtx?.pastDeadline && (
          <Alert
            type="warning"
            showIcon
            message="Cần hoàn thiện thuyết minh theo biên bản BM.05b"
            description="Sửa form / upload BM.04 mới, viết giải trình, rồi nộp cho Phòng Khoa học. Xem yêu cầu điều chỉnh ở bảng bên dưới."
          />
        )}
        {hienBangHoanThien && (
          <RevisionWorkbench
            status={outline?.status}
            ctx={revisionCtx}
            editable={editable}
            canExtend={!!access.canExtendOutlineRevision}
            hienPkh={hienPkh}
            hienThuKy={hienThuKy}
            hienChuTich={hienChuTich}
            hienBgh={hienBgh}
            explanationLen={(explanation || '').trim().length}
            onDiff={() => void moSoSanh()}
            onExtend={giaHan}
            onApprove={xacNhanBanHoanThien}
            onSubmit={nopBanHoanThien}
            onOpenBghApproval={() =>
              history.push(`/projects/outline-approvals/${outline?.id}`)
            }
          />
        )}

        {!hienBangHoanThien && (
          <Progress
            percent={outline?.completionPercent || 0}
            status={editable ? 'active' : 'success'}
            size="small"
            style={{ marginBottom: 4 }}
          />
        )}

        {outline && (
          <ProForm
            key={formReadyKey}
            formRef={formRef}
            submitter={false}
            disabled={!editable}
            layout="vertical"
            initialValues={formInitial}
          >
            <Tabs
              type="card"
              activeKey={tabMuc}
              onChange={setTabMuc}
              destroyInactiveTabPane={false}
              style={{ marginBottom: 8 }}
              items={[
                {
                  key: 'A',
                  label: 'A. Thông tin chung',
                  forceRender: true,
                  children: (
                    <div style={{ paddingTop: 8 }}>
              <ProFormText
                name="title"
                label="Tên nhiệm vụ"
                rules={[{ required: true }]}
              />
              <Row gutter={16}>
                <Col span={12}>
                  <ProFormSelect
                    name="projectProcessTypeId"
                    label="Cấp ý tưởng/đề tài"
                    options={processTypes.map((t) => ({
                      value: t.id,
                      label: `${t.code} — ${t.name}`,
                    }))}
                    rules={[{ required: true }]}
                  />
                </Col>
                <Col span={12}>
                  <ProFormSelect
                    name="field"
                    label="Lĩnh vực"
                    placeholder="Chọn lĩnh vực"
                    options={fieldOptions}
                    rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực' }]}
                    fieldProps={{
                      showSearch: true,
                      optionFilterProp: 'label',
                      disabled: !editable,
                    }}
                  />
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <ProFormDatePicker
                    name="startDate"
                    label="Ngày bắt đầu"
                    rules={[{ required: true }]}
                  />
                </Col>
                <Col span={12}>
                  <ProFormDatePicker
                    name="endDate"
                    label="Ngày kết thúc"
                    rules={[{ required: true }]}
                  />
                </Col>
              </Row>

              <Collapse
                defaultActiveKey={['principal']}
                bordered={false}
                style={{ background: 'transparent', marginBottom: 12 }}
                items={[
                  {
                    key: 'principal',
                    label: (
                      <Space>
                        <UserOutlined style={{ color: '#1677ff' }} />
                        <Typography.Text strong>
                          Chủ nhiệm nhiệm vụ
                        </Typography.Text>
                        {principal?.fullName ? (
                          <Tag color="blue">{principal.fullName}</Tag>
                        ) : null}
                      </Space>
                    ),
                    style: {
                      background:
                        'linear-gradient(180deg, #f9f0ff 0%, #ffffff 52px)',
                      borderRadius: 10,
                      border: '1px solid #d3adf7',
                      overflow: 'hidden',
                    },
                    children: (
                      <Spin spinning={principalLoading}>
                        <Space
                          direction="vertical"
                          size={14}
                          style={{ width: '100%', paddingTop: 4 }}
                        >
                          <Form.Item
                            label="Chọn chủ nhiệm"
                            style={{ marginBottom: 0 }}
                            extra="Gõ ít nhất 2 ký tự để tìm theo họ tên / email / đơn vị"
                          >
                            <Select
                              showSearch
                              allowClear
                              disabled={!editable}
                              filterOption={false}
                              placeholder="Tìm và chọn chủ nhiệm nhiệm vụ…"
                              value={
                                principal?.profileId
                                  ? principal.profileId
                                  : undefined
                              }
                              searchValue={principalSearch}
                              onSearch={timChuNhiem}
                              loading={principalSearching}
                              options={[
                                ...(principal?.profileId &&
                                !principalOptions.some(
                                  (o) => o.id === principal.profileId,
                                )
                                  ? [
                                      {
                                        value: principal.profileId,
                                        label: principal.fullName || `#${principal.profileId}`,
                                      },
                                    ]
                                  : []),
                                ...principalOptions.map((o) => ({
                                  value: o.id,
                                  label: `${o.fullName}${
                                    o.organization
                                      ? ` — ${o.organization}`
                                      : ''
                                  }`,
                                })),
                              ]}
                              onChange={(id) => {
                                if (!id) {
                                  setPrincipal(null);
                                  setPrincipalSearch('');
                                  return;
                                }
                                void chonChuNhiem(Number(id));
                              }}
                              style={{ width: '100%' }}
                              notFoundContent={
                                principalSearching
                                  ? 'Đang tìm…'
                                  : principalSearch.trim().length < 2
                                    ? 'Nhập ít nhất 2 ký tự'
                                    : 'Không có kết quả'
                              }
                            />
                          </Form.Item>

                          {principal ? (
                            <Card
                              size="small"
                              title={
                                <Typography.Text strong>
                                  Thông tin chủ nhiệm
                                </Typography.Text>
                              }
                              headStyle={{ minHeight: 40 }}
                              bodyStyle={{ paddingTop: 12 }}
                            >
                              <Row gutter={[16, 8]}>
                                <Col xs={24} md={14}>
                                  <Form.Item
                                    label="Họ và tên"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(principal.fullName)}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={10}>
                                  <Form.Item
                                    label="Số định danh cá nhân"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(
                                        principal.identityNumber,
                                      )}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={10}>
                                  <Form.Item
                                    label="Ngày, tháng, năm sinh"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={
                                        principal.dateOfBirth
                                          ? formatDate(principal.dateOfBirth)
                                          : 'Chưa có'
                                      }
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={14}>
                                  <Form.Item
                                    label="Giới tính"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Radio.Group
                                      disabled
                                      value={chuanHoaGioiTinh(principal.gender)}
                                    >
                                      <Radio value="MALE">Nam</Radio>
                                      <Radio value="FEMALE">Nữ</Radio>
                                    </Radio.Group>
                                    {!chuanHoaGioiTinh(principal.gender) && (
                                      <Text
                                        type="secondary"
                                        style={{ marginLeft: 8 }}
                                      >
                                        Chưa có
                                      </Text>
                                    )}
                                  </Form.Item>
                                </Col>
                                <Col span={24}>
                                  <Form.Item
                                    label="Học hàm, học vị / Trình độ chuyên môn"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(
                                        principal.academicTitleDegree,
                                      )}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                  <Form.Item
                                    label="Chức danh nghề nghiệp"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(
                                        principal.professionalTitle,
                                      )}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                  <Form.Item
                                    label="Chức vụ"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(principal.position)}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                  <Form.Item
                                    label="Điện thoại"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(principal.phone)}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                  <Form.Item
                                    label="E-mail"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(principal.email)}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={24}>
                                  <Form.Item
                                    label="Tên tổ chức đang công tác"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(
                                        principal.organization,
                                      )}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={24}>
                                  <Form.Item
                                    label="Địa chỉ công tác"
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input
                                      disabled
                                      value={hienThiHoSo(
                                        principal.workAddress,
                                      )}
                                    />
                                  </Form.Item>
                                </Col>
                              </Row>
                            </Card>
                          ) : (
                            <Typography.Text type="secondary">
                              Chưa chọn chủ nhiệm. Dùng ô tìm kiếm phía trên để
                              chọn từ danh mục hồ sơ.
                            </Typography.Text>
                          )}
                        </Space>
                      </Spin>
                    ),
                  },
                ]}
              />

              <Collapse
                defaultActiveKey={['members']}
                bordered={false}
                style={{ background: 'transparent', marginBottom: 12 }}
                items={[
                  {
                    key: 'members',
                    label: (
                      <Space>
                        <TeamOutlined style={{ color: '#1677ff' }} />
                        <Typography.Text strong>
                          Thành viên tham gia
                        </Typography.Text>
                        {members.filter((m) => m.fullName?.trim()).length >
                          0 && (
                          <Tag>
                            {
                              members.filter((m) => m.fullName?.trim())
                                .length
                            }
                          </Tag>
                        )}
                      </Space>
                    ),
                    style: {
                      background:
                        'linear-gradient(180deg, #fff7e6 0%, #ffffff 48px)',
                      borderRadius: 10,
                      border: '1px solid #ffd591',
                      overflow: 'hidden',
                    },
                    children: (
                      <div style={{ paddingTop: 4 }}>
                        <AuthorsEditor
                          value={members}
                          onChange={setMembers}
                          disabled={!editable}
                          hideRoleColumns
                          showContribution
                        />
                      </div>
                    ),
                  },
                ]}
              />

              <Collapse
                defaultActiveKey={['funding']}
                bordered={false}
                style={{ background: 'transparent', marginBottom: 16 }}
                items={[
                  {
                    key: 'funding',
                    label: (
                      <Space>
                        <DollarOutlined style={{ color: '#1677ff' }} />
                        <Typography.Text strong>
                          Tổng kinh phí và nguồn kinh phí
                        </Typography.Text>
                        <Tag color="blue">{formatVnd(tongTheoChuThe)}</Tag>
                      </Space>
                    ),
                    style: {
                      background:
                        'linear-gradient(180deg, #e6f4ff 0%, #ffffff 52px)',
                      borderRadius: 10,
                      border: '1px solid #91caff',
                      overflow: 'hidden',
                    },
                    children: (
                      <Space
                        direction="vertical"
                        size={14}
                        style={{ width: '100%', paddingTop: 4 }}
                      >
                        {/* Tổng — tự cộng từ a) */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            flexWrap: 'wrap',
                            padding: '12px 16px',
                            borderRadius: 8,
                            background: '#f0f5ff',
                            border: '1px solid #adc6ff',
                          }}
                        >
                          <div>
                            <Typography.Text type="secondary">
                              Tổng kinh phí
                            </Typography.Text>
                            <div>
                              <Typography.Text
                                strong
                                style={{ fontSize: 22, color: '#1677ff' }}
                              >
                                {formatVnd(tongTheoChuThe)}
                              </Typography.Text>
                              <Typography.Text type="secondary">
                                {' '}
                                đồng
                              </Typography.Text>
                            </div>
                          </div>
                          <Typography.Text
                            type="secondary"
                            style={{ maxWidth: 360 }}
                          >
                            Tự cộng từ phần a) theo chủ thể bố trí kinh phí.
                          </Typography.Text>
                        </div>

                        {/* a) Theo chủ thể */}
                        <Card
                          size="small"
                          title={
                            <Typography.Text strong>
                              a) Theo chủ thể bố trí kinh phí
                            </Typography.Text>
                          }
                          headStyle={{ minHeight: 40 }}
                        >
                          <Row gutter={[16, 8]}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                label="Kinh phí từ Trường"
                                style={{ marginBottom: 8 }}
                              >
                                <InputNumber
                                  disabled={!editable}
                                  min={0}
                                  precision={0}
                                  value={funding.schoolFund}
                                  onChange={(v) => doiFunding('schoolFund', v)}
                                  style={{ width: '100%' }}
                                  {...vndInputNumberProps}
                                  addonAfter="đồng"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                label="Kinh phí ngoài Trường"
                                style={{ marginBottom: 8 }}
                              >
                                <InputNumber
                                  disabled={!editable}
                                  min={0}
                                  precision={0}
                                  value={externalTong}
                                  onChange={(v) =>
                                    doiFunding('externalFund', v)
                                  }
                                  style={{ width: '100%' }}
                                  {...vndInputNumberProps}
                                  addonAfter="đồng"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>

                        {/* b) Theo tính chất — nhập độc lập */}
                        <Card
                          size="small"
                          title={
                            <Space>
                              <Typography.Text strong>
                                b) Theo tính chất nguồn kinh phí
                              </Typography.Text>
                              <Tag>Tổng: {formatVnd(tongTheoTinhChat)}</Tag>
                            </Space>
                          }
                          headStyle={{ minHeight: 40 }}
                        >
                          <Row gutter={[16, 0]}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                label="Ngân sách nhà nước"
                                style={{ marginBottom: 8 }}
                              >
                                <InputNumber
                                  disabled={!editable}
                                  min={0}
                                  precision={0}
                                  value={funding.stateBudget}
                                  onChange={(v) =>
                                    doiFunding('stateBudget', v)
                                  }
                                  style={{ width: '100%' }}
                                  {...vndInputNumberProps}
                                  addonAfter="đồng"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                label="Ngoài ngân sách nhà nước (từ nguồn Quỹ KHCN của Trường Đại học Sư phạm - ĐHĐN)"
                                style={{ marginBottom: 8 }}
                              >
                                <InputNumber
                                  disabled={!editable}
                                  min={0}
                                  precision={0}
                                  value={funding.nonStateBudget}
                                  onChange={(v) =>
                                    doiFunding('nonStateBudget', v)
                                  }
                                  style={{ width: '100%' }}
                                  {...vndInputNumberProps}
                                  addonAfter="đồng"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          {fundingNatureMismatch ? (
                            <Typography.Text type="warning">
                              Tổng a) ({formatVnd(tongTheoChuThe)}) khác tổng
                              b) ({formatVnd(tongTheoTinhChat)}). Nên bằng nhau
                              theo BM-02.02.
                            </Typography.Text>
                          ) : null}
                        </Card>
                      </Space>
                    ),
                  },
                ]}
              />

              <Collapse
                defaultActiveKey={['lump-sum']}
                bordered={false}
                style={{ background: 'transparent', marginBottom: 16 }}
                items={[
                  {
                    key: 'lump-sum',
                    label: (
                      <Space>
                        <DollarOutlined style={{ color: '#fa8c16' }} />
                        <Typography.Text strong>
                          Phương thức khoán chi
                        </Typography.Text>
                        {funding.lumpSumMode === 'FULL' ? (
                          <Tag color="orange">Khoán đến sản phẩm cuối</Tag>
                        ) : funding.lumpSumMode === 'PARTIAL' ? (
                          <Tag color="orange">Khoán từng phần</Tag>
                        ) : (
                          <Tag>Chưa chọn</Tag>
                        )}
                      </Space>
                    ),
                    style: {
                      background:
                        'linear-gradient(180deg, #fff7e6 0%, #ffffff 52px)',
                      borderRadius: 10,
                      border: '1px solid #ffd591',
                      overflow: 'hidden',
                    },
                    children: (
                      <Space
                        direction="vertical"
                        size={12}
                        style={{ width: '100%', paddingTop: 4 }}
                      >
                        <Radio.Group
                          disabled={!editable}
                          value={funding.lumpSumMode || undefined}
                          onChange={(e) =>
                            doiPhuongThucKhoan(e.target.value)
                          }
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          <Radio value="FULL">
                            Khoán chi đến sản phẩm cuối cùng
                          </Radio>
                          <Radio value="PARTIAL">
                            Khoán chi từng phần, trong đó:
                          </Radio>
                        </Radio.Group>

                        {funding.lumpSumMode === 'PARTIAL' ? (
                          <Row gutter={[16, 8]} style={{ paddingLeft: 24 }}>
                            <Col xs={24} md={12}>
                              <Form.Item
                                label="Kinh phí khoán"
                                style={{ marginBottom: 8 }}
                              >
                                <InputNumber
                                  disabled={!editable}
                                  min={0}
                                  precision={0}
                                  value={funding.lumpSumAmount}
                                  onChange={(v) =>
                                    doiFunding('lumpSumAmount', v)
                                  }
                                  style={{ width: '100%' }}
                                  {...vndInputNumberProps}
                                  addonAfter="đồng"
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                              <Form.Item
                                label="Kinh phí không khoán"
                                style={{ marginBottom: 8 }}
                              >
                                <InputNumber
                                  disabled={!editable}
                                  min={0}
                                  precision={0}
                                  value={funding.nonLumpSumAmount}
                                  onChange={(v) =>
                                    doiFunding('nonLumpSumAmount', v)
                                  }
                                  style={{ width: '100%' }}
                                  {...vndInputNumberProps}
                                  addonAfter="đồng"
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        ) : null}
                      </Space>
                    ),
                  },
                ]}
              />

                    </div>
                  ),
                },
                {
                  key: 'ORG',
                  label: 'Tổ chức chủ trì & đơn vị phối hợp',
                  forceRender: true,
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <Collapse
                        defaultActiveKey={['host-org']}
                        bordered={false}
                        style={{
                          background: 'transparent',
                          marginBottom: 16,
                        }}
                        items={[
                          {
                            key: 'host-org',
                            label: (
                              <Space>
                                <BankOutlined style={{ color: '#1677ff' }} />
                                <Typography.Text strong>
                                  Tổ chức chủ trì nhiệm vụ
                                </Typography.Text>
                              </Space>
                            ),
                            style: {
                              marginBottom: 0,
                              background:
                                'linear-gradient(180deg, #f0f5ff 0%, #ffffff 48px)',
                              borderRadius: 10,
                              border: '1px solid #d6e4ff',
                              overflow: 'hidden',
                            },
                            children: (
                              <Space
                                direction="vertical"
                                size={16}
                                style={{ width: '100%', paddingTop: 4 }}
                              >
                                {/* 7.1 Thông tin tổ chức */}
                                <Card
                                  size="small"
                                  title={
                                    <Typography.Text strong>
                                      Thông tin tổ chức
                                    </Typography.Text>
                                  }
                                  headStyle={{
                                    borderBottom: '1px solid #f0f0f0',
                                    minHeight: 40,
                                  }}
                                  bodyStyle={{ paddingTop: 16 }}
                                >
                                  <Row gutter={[16, 0]}>
                                    <Col xs={24} md={16}>
                                      <ProFormText
                                        name={[
                                          'hostOrganization',
                                          'name',
                                        ]}
                                        label="Tên tổ chức chủ trì nhiệm vụ"
                                        placeholder="Ví dụ: Trường Đại học Sư phạm – Đại học Đà Nẵng"
                                        rules={[
                                          {
                                            required: true,
                                            message: 'Bắt buộc nhập tên tổ chức',
                                          },
                                        ]}
                                        fieldProps={{ disabled: !editable }}
                                      />
                                    </Col>
                                    <Col xs={24} md={8}>
                                      <ProFormText
                                        name={[
                                          'hostOrganization',
                                          'orgCode',
                                        ]}
                                        label="Mã số tổ chức"
                                        placeholder="Mã số / mã đơn vị"
                                        fieldProps={{ disabled: !editable }}
                                      />
                                    </Col>
                                    <Col xs={24} md={8}>
                                      <ProFormText
                                        name={[
                                          'hostOrganization',
                                          'phone',
                                        ]}
                                        label="Điện thoại"
                                        placeholder="Số điện thoại liên hệ"
                                        // Khóa không cho nhập — chờ nguồn dữ liệu hệ thống
                                        fieldProps={{ disabled: true }}
                                      />
                                    </Col>
                                    <Col xs={24} md={16}>
                                      <ProFormText
                                        name={[
                                          'hostOrganization',
                                          'address',
                                        ]}
                                        label="Địa chỉ"
                                        placeholder="Địa chỉ trụ sở tổ chức chủ trì"
                                        fieldProps={{ disabled: !editable }}
                                      />
                                    </Col>
                                    <Col span={24}>
                                      <ProFormText
                                        name={[
                                          'hostOrganization',
                                          'leaderName',
                                        ]}
                                        label="Họ và tên thủ trưởng tổ chức"
                                        placeholder="Họ tên thủ trưởng / hiệu trưởng"
                                        fieldProps={{ disabled: !editable }}
                                      />
                                    </Col>
                                  </Row>
                                </Card>

                                {/* 7.2 Năng lực, kinh nghiệm */}
                                <Card
                                  size="small"
                                  title={
                                    <Space>
                                      <TeamOutlined
                                        style={{ color: '#1677ff' }}
                                      />
                                      <Typography.Text strong>
                                        Năng lực, kinh nghiệm của tổ chức chủ trì
                                      </Typography.Text>
                                    </Space>
                                  }
                                  headStyle={{
                                    borderBottom: '1px solid #f0f0f0',
                                    minHeight: 40,
                                  }}
                                  bodyStyle={{ paddingTop: 16 }}
                                >
                                  <Form.Item
                                    name={[
                                      'hostOrganization',
                                      'experienceHtml',
                                    ]}
                                    label="Kinh nghiệm, năng lực, cơ sở vật chất, công nghệ"
                                    extra={
                                      <Typography.Text type="secondary">
                                        Nêu tóm tắt các công trình, dự án đã thực
                                        hiện liên quan đến vấn đề nghiên cứu
                                        (không quá ½ trang A4).
                                      </Typography.Text>
                                    }
                                    style={{ marginBottom: 20 }}
                                  >
                                    <RichTextHtmlField
                                      disabled={!editable}
                                      minHeight={160}
                                      placeholder="Mô tả năng lực, CSVC, công nghệ và các dự án liên quan…"
                                    />
                                  </Form.Item>
                                  <Form.Item
                                    name={[
                                      'hostOrganization',
                                      'teamCapacityHtml',
                                    ]}
                                    label="Đội ngũ nhân lực thực hiện nhiệm vụ"
                                    extra={
                                      <Typography.Text type="secondary">
                                        Trình bày năng lực, kinh nghiệm của đội
                                        ngũ chính (không quá 01 trang A4).
                                      </Typography.Text>
                                    }
                                    style={{ marginBottom: 0 }}
                                  >
                                    <RichTextHtmlField
                                      disabled={!editable}
                                      minHeight={200}
                                      placeholder="Mô tả năng lực, kinh nghiệm đội ngũ chính thực hiện nhiệm vụ…"
                                    />
                                  </Form.Item>
                                </Card>
                              </Space>
                            ),
                          },
                        ]}
                      />

                      <Collapse
                        defaultActiveKey={['partners']}
                        bordered={false}
                        style={{ background: 'transparent' }}
                        items={[
                          {
                            key: 'partners',
                            label: (
                              <Space>
                                <TeamOutlined style={{ color: '#1677ff' }} />
                                <Typography.Text strong>
                                  Đơn vị phối hợp
                                </Typography.Text>
                                {partners.filter((p) => p.name?.trim())
                                  .length > 0 && (
                                  <Tag>
                                    {
                                      partners.filter((p) => p.name?.trim())
                                        .length
                                    }
                                  </Tag>
                                )}
                              </Space>
                            ),
                            style: {
                              background:
                                'linear-gradient(180deg, #f6ffed 0%, #ffffff 48px)',
                              borderRadius: 10,
                              border: '1px solid #d9f7be',
                              overflow: 'hidden',
                            },
                            children: (
                              <Space
                                direction="vertical"
                                size={12}
                                style={{ width: '100%', paddingTop: 4 }}
                              >
                                {partners.length === 0 && (
                                  <Typography.Text type="secondary">
                                    Chưa có đơn vị phối hợp. Thêm nếu nhiệm vụ
                                    có tổ chức phối hợp thực hiện.
                                  </Typography.Text>
                                )}
                                {partners.map((p, i) => (
                                  <Card
                                    key={`partner-${i}`}
                                    size="small"
                                    title={
                                      <Typography.Text strong>
                                        Tên tổ chức {i + 1}
                                      </Typography.Text>
                                    }
                                    extra={
                                      editable ? (
                                        <Button
                                          type="link"
                                          danger
                                          size="small"
                                          onClick={() =>
                                            setPartners(
                                              partners.filter(
                                                (_, idx) => idx !== i,
                                              ),
                                            )
                                          }
                                        >
                                          Xóa
                                        </Button>
                                      ) : null
                                    }
                                    headStyle={{
                                      borderBottom: '1px solid #f0f0f0',
                                      minHeight: 40,
                                    }}
                                    bodyStyle={{ paddingTop: 12 }}
                                  >
                                    <Row gutter={[16, 0]}>
                                      <Col xs={24} md={16}>
                                        <Form.Item
                                          label="Tên tổ chức"
                                          style={{ marginBottom: 12 }}
                                        >
                                          <Input
                                            disabled={!editable}
                                            value={p.name || ''}
                                            placeholder="Tên tổ chức phối hợp"
                                            style={{ width: '100%' }}
                                            onChange={(e) => {
                                              const next = [...partners];
                                              next[i] = {
                                                ...next[i],
                                                name: e.target.value,
                                              };
                                              setPartners(next);
                                            }}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={8}>
                                        <Form.Item
                                          label="Mã số tổ chức"
                                          style={{ marginBottom: 12 }}
                                        >
                                          <Input
                                            disabled={!editable}
                                            value={p.orgCode || ''}
                                            placeholder="Mã số / mã đơn vị"
                                            style={{ width: '100%' }}
                                            onChange={(e) => {
                                              const next = [...partners];
                                              next[i] = {
                                                ...next[i],
                                                orgCode: e.target.value,
                                              };
                                              setPartners(next);
                                            }}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={8}>
                                        <Form.Item
                                          label="Điện thoại"
                                          style={{ marginBottom: 0 }}
                                        >
                                          {/* Khóa không cho nhập — chờ nguồn dữ liệu hệ thống */}
                                          <Input
                                            disabled
                                            value={p.phone || ''}
                                            placeholder="Số điện thoại liên hệ"
                                            style={{ width: '100%' }}
                                          />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} md={16}>
                                        <Form.Item
                                          label="Địa chỉ"
                                          style={{ marginBottom: 0 }}
                                        >
                                          <Input
                                            disabled={!editable}
                                            value={p.address || ''}
                                            placeholder="Địa chỉ tổ chức phối hợp"
                                            style={{ width: '100%' }}
                                            onChange={(e) => {
                                              const next = [...partners];
                                              next[i] = {
                                                ...next[i],
                                                address: e.target.value,
                                              };
                                              setPartners(next);
                                            }}
                                          />
                                        </Form.Item>
                                      </Col>
                                    </Row>
                                  </Card>
                                ))}
                                {editable && (
                                  <Button
                                    type="dashed"
                                    icon={<PlusOutlined />}
                                    block
                                    onClick={() =>
                                      setPartners([
                                        ...partners,
                                        {
                                          name: '',
                                          orgCode: '',
                                          phone: '',
                                          address: '',
                                        },
                                      ])
                                    }
                                  >
                                    Thêm tổ chức phối hợp
                                  </Button>
                                )}
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: 'B',
                  label: 'B. Thuyết minh khoa học',
                  forceRender: true,
                  children: (
                    <div style={{ paddingTop: 8 }}>
              <Form.Item
                name="urgency"
                label="Tính cấp thiết"
                rules={[{ required: true }]}
              >
                <RichTextHtmlField disabled={!editable} minHeight={140} />
              </Form.Item>
              <Form.Item
                name="detailedObjectives"
                label="Mục tiêu"
                rules={[{ required: true }]}
              >
                <RichTextHtmlField disabled={!editable} minHeight={140} />
              </Form.Item>
              <Form.Item
                name="researchContent"
                label="Nội dung và phương pháp thực hiện"
                rules={[{ required: true }]}
              >
                <RichTextHtmlField disabled={!editable} minHeight={180} />
              </Form.Item>
              {/* Tạm ẩn phương pháp nghiên cứu */}
              {/*
              <Form.Item name="methodology" label="Phương pháp nghiên cứu">
                <RichTextHtmlField disabled={!editable} minHeight={140} />
              </Form.Item>
              */}

              <Form.Item label="Tiến độ thực hiện">
                <Table
                  size="small"
                  pagination={false}
                  rowKey={(_, i) => `m-${i}`}
                  dataSource={milestones}
                  columns={[
                    {
                      title: 'Nội dung',
                      render: (_, __, i) => (
                        <RichTextHtmlField
                          disabled={!editable}
                          minHeight={80}
                          value={milestones[i]?.content}
                          onChange={(html) => {
                            setMilestones((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], content: html };
                              return next;
                            });
                          }}
                        />
                      ),
                    },
                    {
                      title: 'Bắt đầu',
                      width: 140,
                      render: (_, __, i) => (
                        <Input
                          type="date"
                          disabled={!editable}
                          value={milestones[i]?.startDate?.slice(0, 10) || ''}
                          onChange={(e) => {
                            const v = e.target.value || null;
                            setMilestones((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], startDate: v };
                              return next;
                            });
                          }}
                        />
                      ),
                    },
                    {
                      title: 'Kết thúc',
                      width: 140,
                      render: (_, __, i) => (
                        <Input
                          type="date"
                          disabled={!editable}
                          value={milestones[i]?.endDate?.slice(0, 10) || ''}
                          onChange={(e) => {
                            const v = e.target.value || null;
                            setMilestones((prev) => {
                              const next = [...prev];
                              next[i] = { ...next[i], endDate: v };
                              return next;
                            });
                          }}
                        />
                      ),
                    },
                    {
                      title: 'Sản phẩm/Kết quả',
                      render: (_, __, i) => (
                        <RichTextHtmlField
                          disabled={!editable}
                          minHeight={80}
                          value={milestones[i]?.expectedResult || ''}
                          onChange={(html) => {
                            setMilestones((prev) => {
                              const next = [...prev];
                              next[i] = {
                                ...next[i],
                                expectedResult: html,
                              };
                              return next;
                            });
                          }}
                        />
                      ),
                    },
                    {
                      title: '',
                      width: 70,
                      render: (_, __, i) =>
                        editable ? (
                          <Button
                            type="link"
                            danger
                            onClick={() =>
                              setMilestones((prev) =>
                                prev.filter((_, idx) => idx !== i),
                              )
                            }
                          >
                            Xóa
                          </Button>
                        ) : null,
                    },
                  ]}
                />
                {editable && (
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    style={{ marginTop: 8 }}
                    onClick={() =>
                      setMilestones((prev) => [...prev, { content: '' }])
                    }
                  >
                    Thêm mốc tiến độ
                  </Button>
                )}
              </Form.Item>

                    </div>
                  ),
                },
                {
                  key: 'RESULTS',
                  label: 'Kết quả dự kiến',
                  forceRender: true,
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <Typography.Paragraph type="secondary">
                        Kết quả/sản phẩm chính dự kiến đạt được của nhiệm vụ và yêu
                        cầu về số lượng, chất lượng khoa học cần đạt. Điền các mục
                        phù hợp; mục không áp dụng có thể để trống.
                      </Typography.Paragraph>
                      <ExpectedResultsPanels
                        value={expectedResults}
                        onChange={setExpectedResults}
                        editable={editable}
                      />
                    </div>
                  ),
                },
                {
                  key: 'D',
                  label: 'Kinh phí thực hiện',
                  forceRender: true,
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 12,
                          marginBottom: 12,
                          alignItems: 'center',
                        }}
                      >
                        <Tag color="blue">
                          Tổng ma trận: {formatVnd(totalDetail)}
                        </Tag>
                        <Tag>Đề xuất: {formatVnd(tongTheoChuThe)}</Tag>
                        <Text type={budgetDiff > 1000 ? 'danger' : 'secondary'}>
                          Chênh lệch: {formatVnd(budgetDiff)} (cho phép ≤{' '}
                          {formatVnd(1000)})
                        </Text>
                      </div>
                      <BudgetMatrixTable
                        value={budgetMatrix}
                        onChange={setBudgetMatrix}
                        editable={editable}
                        stateBudgetHint={funding.stateBudget}
                        nonStateBudgetHint={funding.nonStateBudget}
                      />
                    </div>
                  ),
                },
                {
                  key: 'OTHER',
                  label: 'Nội dung khác',
                  forceRender: true,
                  children: (
                    <div style={{ paddingTop: 8 }}>
                      <Typography.Paragraph type="secondary">
                        Các mục mô tả bổ sung: ứng dụng &amp; chuyển giao, hiệu
                        quả/tác động, quản lý rủi ro, đạo đức–dữ liệu–SHTT–AI.
                        Dùng trình soạn thảo giống Tính cấp thiết / Mục tiêu.
                      </Typography.Paragraph>
                      <OtherContentsPanels
                        value={otherContents}
                        onChange={setOtherContents}
                        editable={editable}
                      />
                    </div>
                  ),
                },
                {
                  key: 'E',
                  label: isRevision
                    ? 'E. File BM.04 mới'
                    : 'E. Tài liệu đính kèm',
                  forceRender: true,
                  children: (
                    <div style={{ paddingTop: 8 }}>
              <Form.Item
                name="outlineFileUrl"
                label={
                  isRevision
                    ? 'BM.04 — thuyết minh hoàn thiện (PDF/DOCX ≤20MB)'
                    : 'File thuyết minh (PDF/DOCX ≤20MB)'
                }
                rules={[{ required: true, message: 'Bắt buộc khi nộp' }]}
                extra={
                  isRevision
                    ? 'Upload bản mới theo yêu cầu BM.05b. Bản gốc HĐ được giữ riêng.'
                    : undefined
                }
              >
                <ProposalAttachmentUpload
                  folder="projects/outline-files"
                  maxMb={20}
                  disabled={!editable}
                  buttonText={
                    isRevision ? 'Tải lên BM.04 mới' : undefined
                  }
                />
              </Form.Item>
              <Form.Item
                name="appendixFileUrl"
                label="Tài liệu phụ lục (tuỳ chọn)"
              >
                <ProposalAttachmentUpload
                  folder="projects/outline-files"
                  maxMb={20}
                  disabled={!editable}
                />
              </Form.Item>
                    </div>
                  ),
                },
                ...(isRevision
                  ? [
                      {
                        key: 'F',
                        label: 'F. Giải trình BM.05b',
                        forceRender: true,
                        children: (
                          <div
                            style={{
                              paddingTop: 8,
                              borderColor: '#fde68a',
                              background:
                                'linear-gradient(180deg, #fffbeb 0%, #ffffff 70%)',
                              borderRadius: 8,
                              padding: 12,
                            }}
                          >
                            <Text type="secondary">
                              Bắt buộc khi nộp (≥{' '}
                              {revisionCtx?.minExplanationLength || 100} ký tự).
                              Mô tả rõ đã chỉnh những mục nào theo biên bản.
                            </Text>
                            <TextArea
                              style={{ marginTop: 8 }}
                              rows={5}
                              disabled={!editable}
                              value={explanation}
                              showCount
                              maxLength={20000}
                              onChange={(e) => setExplanation(e.target.value)}
                              placeholder="Ví dụ: Đã bổ sung mục tiêu chi tiết theo mục 3 biên bản; cập nhật kinh phí nhân công; đính kèm BM.04 phiên bản mới..."
                            />
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </ProForm>
        )}
      </Space>

      <Drawer
        title="So sánh bản gốc HĐ ↔ bản hoàn thiện"
        width={780}
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={diffNote}
        />
        {fileDiff && (
          <Card
            size="small"
            title="File thuyết minh (metadata)"
            style={{ marginBottom: 12 }}
          >
            <Table
              size="small"
              pagination={false}
              rowKey="k"
              dataSource={[
                {
                  k: 'name',
                  label: 'Tên file',
                  before: fileDiff.before.fileName || '—',
                  after: fileDiff.after.fileName || '—',
                },
                {
                  k: 'size',
                  label: 'Dung lượng',
                  before:
                    fileDiff.before.fileSize != null
                      ? `${(fileDiff.before.fileSize / 1024).toFixed(1)} KB`
                      : '—',
                  after:
                    fileDiff.after.fileSize != null
                      ? `${(fileDiff.after.fileSize / 1024).toFixed(1)} KB`
                      : '—',
                },
                {
                  k: 'date',
                  label: 'Ngày upload',
                  before: fileDiff.before.uploadedAt
                    ? dayjs(fileDiff.before.uploadedAt).format(
                        'HH:mm DD/MM/YYYY',
                      )
                    : '—',
                  after: fileDiff.after.uploadedAt
                    ? dayjs(fileDiff.after.uploadedAt).format(
                        'HH:mm DD/MM/YYYY',
                      )
                    : '—',
                },
              ]}
              columns={[
                { title: '', dataIndex: 'label', width: 120 },
                { title: 'Bản gốc HĐ', dataIndex: 'before' },
                { title: 'Bản hoàn thiện', dataIndex: 'after' },
              ]}
            />
          </Card>
        )}
        <Table
          size="small"
          rowKey="field"
          pagination={false}
          dataSource={diffs}
          locale={{ emptyText: 'Không có khác biệt trường form' }}
          columns={[
            { title: 'Trường', dataIndex: 'label', width: 160 },
            { title: 'Loại', dataIndex: 'kind', width: 70 },
            {
              title: 'Trước (bản HĐ)',
              dataIndex: 'before',
              ellipsis: true,
              render: (t) => (
                <Text style={{ whiteSpace: 'pre-wrap' }}>{t || '—'}</Text>
              ),
            },
            {
              title: 'Sau (hiện tại)',
              dataIndex: 'after',
              ellipsis: true,
              render: (t) => (
                <Text style={{ whiteSpace: 'pre-wrap' }}>{t || '—'}</Text>
              ),
            },
          ]}
        />
      </Drawer>

      <FooterToolbar>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => history.push('/projects/my')}
        >
          Quay lại
        </Button>
        {outline?.id ? (
          <Button
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={() => void xuatThuyetMinh()}
          >
            Xuất thuyết minh
          </Button>
        ) : null}
        {editable && (
          <>
            <Button
              icon={<SaveOutlined />}
              loading={saving}
              onClick={() => void luuNhap()}
            >
              Lưu nháp
            </Button>
            {!isRevision && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={saving}
                onClick={() => nopChinhThuc()}
              >
                Nộp chính thức
              </Button>
            )}
            {isRevision && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={saving}
                onClick={() => nopBanHoanThien()}
              >
                Nộp cho phòng khoa học
              </Button>
            )}
          </>
        )}
        {/* PKH / Thư ký / Chủ tịch — duyệt bản hoàn thiện trên footer cố định */}
        {(hienPkh || hienThuKy || hienChuTich) && (
          <>
            <Button
              type="primary"
              loading={saving}
              onClick={() => xacNhanBanHoanThien(true)}
            >
              Đồng ý
            </Button>
            <Button
              danger
              loading={saving}
              onClick={() => xacNhanBanHoanThien(false)}
            >
              Trả lại CNNV
            </Button>
          </>
        )}
        {hienBgh && (
          <Button
            type="primary"
            onClick={() =>
              history.push(`/projects/outline-approvals/${outline?.id}`)
            }
          >
            Mở Chờ phê duyệt
          </Button>
        )}
        {duocSoan && outline?.status === 'THUYETMINH_PENDING' && (
          <Button danger onClick={() => rutLai()}>
            Rút lại
          </Button>
        )}
      </FooterToolbar>
    </PageContainer>
  );
};

export default OutlineFormPage;
