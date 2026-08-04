import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { EditableProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Space, Typography, Tag, Modal, Input, List, Button, Spin, Tabs } from 'antd';
import type { PublicationAuthor, AffiliationType } from '@/services/api/profilePublications';
import {
  AUTHOR_AFFILIATION_MULTI_OPTIONS,
  AUTHOR_GENDER_OPTIONS,
  AUTHOR_WORKPLACE_OTHER_UNIT,
  deriveAffiliationTypeFromUnits,
  laTacGiaNhapTay,
  normalizeAffiliationUnits,
  normalizeAuthorGender,
  nhanGioiTinhTacGia,
  UDN_AFFILIATION_UNITS,
  normalizePublicationAuthor,
  lookupAuthorProfiles,
  lookupAuthorStudents,
  type AuthorProfileLookupItem,
  type AuthorStudentLookupItem,
} from '@/services/api/profilePublications';
import {
  formatAuthorLookupSubtitle,
  formatAuthorLookupTitle,
} from '@/utils/authorProfileLookupDisplay';
import {
  formatStudentLookupSubtitle,
  formatStudentLookupTitle,
} from '@/utils/authorStudentLookupDisplay';
import './index.less';

const { Text } = Typography;

/** So khớp chủ hồ sơ (API có thể trả profileId kiểu số hoặc client so sánh lỏng) */
function rowMatchesOwner(
  record: { profileId?: number | null },
  ownerProfileId?: number
): boolean {
  if (ownerProfileId == null) return false;
  return record.profileId != null && Number(record.profileId) === Number(ownerProfileId);
}

/** Dòng tác giả là chủ hồ sơ đang đăng nhập — chỉ được đổi vai trò (tác giả đầu / liên hệ). */
function laDongChuDangNhap(
  record: { profileId?: number | null },
  ownerProfileId?: number
): boolean {
  return rowMatchesOwner(record, ownerProfileId);
}

interface AuthorsEditorProps {
  value?: PublicationAuthor[];
  onChange?: (authors: PublicationAuthor[]) => void;
  disabled?: boolean;
  /** Bắt buộc có trong danh sách; không cho xóa dòng này (chỉ đổi vai trò sau). */
  ownerProfileId?: number;
  /** Hiện cột Tỉ lệ % đóng góp (sách/đề tài/sáng kiến — QĐ 1883 điều 1.4). */
  showContribution?: boolean;
  /**
   * Ẩn cột Tác giả đầu / Tác giả liên hệ — dùng cho danh sách thành viên đề xuất đề tài.
   * Khi bật: không bắt buộc ≥1 dòng, bỏ cảnh báo vai trò.
   */
  hideRoleColumns?: boolean;
  /** Nhãn nút thêm dòng (mặc định: Thêm tác giả / Thêm thành viên khi hideRoleColumns). */
  addRowLabel?: string;
}

type AuthorEditableRow = PublicationAuthor & { id: React.Key };

const AuthorsEditor: React.FC<AuthorsEditorProps> = ({
  value = [],
  onChange,
  disabled = false,
  ownerProfileId,
  showContribution = false,
  hideRoleColumns = false,
  addRowLabel,
}) => {
  const nhanDong = hideRoleColumns ? 'thành viên' : 'tác giả';
  const nhanThemDong = addRowLabel || (hideRoleColumns ? 'Thêm thành viên' : 'Thêm tác giả');
  const editableFormRef = useRef<any>();
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<AuthorEditableRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRowKey, setPickerRowKey] = useState<React.Key | null>(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [pickerTab, setPickerTab] = useState<'staff' | 'student'>('staff');
  const [lookupResults, setLookupResults] = useState<
    AuthorProfileLookupItem[] | AuthorStudentLookupItem[]
  >([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bản dataSource mới nhất — dùng khi merge chống Pro Table gọi onChange lần 2 với form rỗng (đặc biệt dòng mới). */
  const dataSourceRef = useRef<AuthorEditableRow[]>([]);
  /** Dòng vừa bấm "Bỏ liên kết" — không khôi phục profileId/studentId trong merge. */
  const unlinkingRowIdsRef = useRef<Set<string>>(new Set());
  dataSourceRef.current = dataSource;

  useEffect(() => {
    const mapped = value.map((a, idx) => ({
      ...normalizePublicationAuthor(a),
      id: (a.clientRowKey ?? a.id ?? `new-${idx}`) as React.Key,
    }));
    setDataSource(mapped);
  }, [value]);

  const runLookup = useCallback(async (q: string, tab: 'staff' | 'student') => {
    const t = q.trim();
    if (t.length < 2) {
      setLookupResults([]);
      return;
    }
    setLookupLoading(true);
    try {
      const rows =
        tab === 'student'
          ? await lookupAuthorStudents(t, 25)
          : await lookupAuthorProfiles(t, 25);
      setLookupResults(rows);
    } catch {
      setLookupResults([]);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const scheduleLookup = useCallback(
    (q: string, tab: 'staff' | 'student') => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void runLookup(q, tab);
      }, 320);
    },
    [runLookup]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const mainAuthors = dataSource.filter((a) => a.isTopAuthor || a.isCorresponding);
    const correspondingAuthors = dataSource.filter((a) => a.isCorresponding);

    if (!hideRoleColumns && dataSource.length === 0) {
      errors.push('Cần ít nhất 1 tác giả');
    }

    if (!hideRoleColumns && correspondingAuthors.length === 0) {
      warnings.push('Chưa xác định tác giả liên hệ (p)');
    }

    const n = mainAuthors.length;
    const p = correspondingAuthors.length;

    const orders = dataSource.map((a) => a.authorOrder);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      errors.push(`Thứ tự ${nhanDong} không được trùng`);
    }

    const hasUdnAuthor = dataSource.some((a) => a.affiliationType === 'UDN_ONLY');
    if (dataSource.length > 0 && !hasUdnAuthor) {
      warnings.push(`Không có ${nhanDong} thuộc Đại học Đà Nẵng`);
    }

    if (
      !hideRoleColumns &&
      ownerProfileId != null &&
      !dataSource.some((a) => rowMatchesOwner(a, ownerProfileId))
    ) {
      errors.push('Phải có ít nhất một tác giả là bạn (hồ sơ đang đăng nhập)');
    }

    const udnNoProfile = dataSource.filter(
      (a) =>
        a.affiliationType === 'UDN_ONLY' &&
        laTacGiaNhapTay(a)
    );
    if (udnNoProfile.length > 0) {
      warnings.push(
        `Có ${udnNoProfile.length} dòng cơ quan ĐHĐN chưa liên kết hồ sơ nội bộ — nên bấm “Chọn từ hồ sơ NCV” để gắn profile_id (trừ ${nhanDong} ngoài thật sự không có trong hệ thống).`
      );
    }

    const nhapTayThieuGioiTinh = dataSource.filter((a) => laTacGiaNhapTay(a) && !a.gender);
    if (nhapTayThieuGioiTinh.length > 0) {
      const nhan = hideRoleColumns ? 'Thành viên' : 'Tác giả';
      errors.push(
        nhapTayThieuGioiTinh.length === 1
          ? `${nhan} "${nhapTayThieuGioiTinh[0].fullName?.trim() || 'nhập tay'}" cần chọn giới tính`
          : `Có ${nhapTayThieuGioiTinh.length} ${nhanDong} nhập tay chưa chọn giới tính`
      );
    }

    // Tổng % đóng góp phải bằng 100% khi đã nhập tỉ lệ.
    if (showContribution) {
      const tongPhanTram = dataSource.reduce(
        (s, a) => s + (a.contributionPercent != null ? Number(a.contributionPercent) : 0),
        0
      );
      if (tongPhanTram > 0 && Math.abs(tongPhanTram - 100) > 0.01) {
        errors.push(
          `Tổng tỉ lệ % đóng góp của các ${nhanDong} phải bằng 100% (hiện ${tongPhanTram}%)`
        );
      }
    }

    return { errors, warnings, n, p, isValid: errors.length === 0 };
  }, [dataSource, ownerProfileId, showContribution, hideRoleColumns, nhanDong]);

  /** Tìm dòng tương ứng trước đó: ưu id (cả so khớp chuỗi), rồi profileId, rồi STT — tránh mất merge khi Pro Table đổi kiểu key hoặc gửi form rỗng. */
  function timDongTuongUng(prevDs: AuthorEditableRow[], row: AuthorEditableRow): AuthorEditableRow | undefined {
    const byId = prevDs.find((p) => p.id === row.id);
    if (byId) return byId;
    const byIdStr = prevDs.find((p) => String(p.id) === String(row.id));
    if (byIdStr) return byIdStr;
    if (row.profileId != null && Number(row.profileId) > 0) {
      const byProf = prevDs.find(
        (p) => p.profileId != null && Number(p.profileId) === Number(row.profileId)
      );
      if (byProf) return byProf;
    }
    return prevDs.find((p) => p.authorOrder === row.authorOrder);
  }

  /** Gộp dòng mới từ Pro Table với bản trước: không mất họ tên / profile_id sau khi chọn NCV nếu bản sau trả ô trống. */
  function mergeBangTacGia(
    prevDs: AuthorEditableRow[],
    incoming: AuthorEditableRow[]
  ): AuthorEditableRow[] {
    return incoming.map((row) => {
      const prevRow = timDongTuongUng(prevDs, row);
      let next = { ...row };
      if (prevRow && laDongChuDangNhap(prevRow, ownerProfileId)) {
        /** Dòng chủ hồ sơ: chỉ nhận thay đổi vai trò (đầu/liên hệ) và tỉ lệ % đóng góp. */
        return {
          ...prevRow,
          isTopAuthor: next.isTopAuthor,
          isCorresponding: next.isCorresponding,
          contributionPercent: next.contributionPercent,
        };
      }
      if (prevRow) {
        const rowKey = String(prevRow.id);
        const vuaBoLienKet = unlinkingRowIdsRef.current.has(rowKey);
        const tenMoi = String(next.fullName ?? '').trim();
        const tenCu = String(prevRow.fullName ?? '').trim();
        if (!tenMoi && tenCu) next = { ...next, fullName: prevRow.fullName };
        if (!vuaBoLienKet && next.profileId == null && prevRow.profileId != null) {
          next = { ...next, profileId: prevRow.profileId };
        }
        if (!vuaBoLienKet && next.studentId == null && prevRow.studentId != null) {
          next = { ...next, studentId: prevRow.studentId };
        }
        if (!vuaBoLienKet && next.gender == null && prevRow.gender != null) {
          next = { ...next, gender: prevRow.gender };
        }
      }
      const legacyAff: AffiliationType =
        next.affiliationType === 'UDN_ONLY' || next.affiliationType === 'MIXED' || next.affiliationType === 'OUTSIDE'
          ? next.affiliationType
          : 'OUTSIDE';
      const affiliationUnits = normalizeAffiliationUnits(next.affiliationUnits, legacyAff);
      const affiliationType = deriveAffiliationTypeFromUnits(affiliationUnits);
      return {
        ...next,
        affiliationUnits,
        affiliationType,
        isMultiAffiliationOutsideUdn: affiliationType === 'MIXED',
      };
    });
  }

  /** Đẩy lên parent: id DB số; giữ clientRowKey cho dòng new-* để không đổi key khi re-render. */
  function bangSangTacGiaApi(rows: AuthorEditableRow[]): PublicationAuthor[] {
    return rows.map(({ id, ...rest }) => {
      let nid: number | undefined;
      let clientRowKey = rest.clientRowKey;
      if (typeof id === 'number' && Number.isFinite(id)) nid = id;
      else if (typeof id === 'string' && /^\d+$/.test(id)) nid = Number(id);
      else if (typeof id === 'string' && id.startsWith('new-')) clientRowKey = id;
      const { clientRowKey: _k, ...r } = rest;
      return { ...r, id: nid, clientRowKey };
    }) as PublicationAuthor[];
  }

  const handleDataChange = (newData: AuthorEditableRow[]) => {
    const prev = dataSourceRef.current;
    const normalized = mergeBangTacGia(prev, newData);
    dataSourceRef.current = normalized;
    setDataSource(normalized);
    if (onChange) onChange(bangSangTacGiaApi(normalized));
  };

  const openPicker = (record: AuthorEditableRow) => {
    if (laDongChuDangNhap(record, ownerProfileId)) return;
    setPickerRowKey(record.id);
    setPickerTab('staff');
    setLookupQuery('');
    setLookupResults([]);
    setPickerOpen(true);
  };

  /** Họ tên ghi vào ô sau khi chọn — thành viên đề tài kèm học hàm/học vị. */
  function tenTuLookup(it: AuthorProfileLookupItem): string {
    if (hideRoleColumns) {
      return formatAuthorLookupTitle(it);
    }
    const fn = typeof it.fullName === 'string' ? it.fullName.trim() : '';
    if (fn) return fn;
    const mail = typeof it.workEmail === 'string' ? it.workEmail.trim() : '';
    if (mail) return mail;
    return `Hồ sơ #${it.id}`;
  }

  const applyProfilePick = (item: AuthorProfileLookupItem) => {
    if (pickerRowKey == null) return;
    const hoTen = tenTuLookup(item);
    const gender = normalizeAuthorGender(item.gender);
    editableFormRef.current?.setRowData?.(pickerRowKey, {
      fullName: hoTen,
      profileId: item.id,
      studentId: null,
      gender,
    });
    const newData = dataSourceRef.current.map((r) =>
      String(r.id) === String(pickerRowKey)
        ? { ...r, fullName: hoTen, profileId: item.id, studentId: null, gender }
        : r
    );
    handleDataChange(newData);
    setPickerOpen(false);
    setPickerRowKey(null);
  };

  function tenTuStudentLookup(it: AuthorStudentLookupItem): string {
    const fn = typeof it.fullName === 'string' ? it.fullName.trim() : '';
    if (fn) return fn;
    const ma = typeof it.studentCode === 'string' ? it.studentCode.trim() : '';
    if (ma) return ma;
    const mail =
      (typeof it.schoolEmail === 'string' ? it.schoolEmail.trim() : '') ||
      (typeof it.personalEmail === 'string' ? it.personalEmail.trim() : '');
    if (mail) return mail;
    return `Sinh viên #${it.id}`;
  }

  const applyStudentPick = (item: AuthorStudentLookupItem) => {
    if (pickerRowKey == null) return;
    const hoTen = tenTuStudentLookup(item);
    const gender = normalizeAuthorGender(item.gender);
    editableFormRef.current?.setRowData?.(pickerRowKey, {
      fullName: hoTen,
      profileId: null,
      studentId: item.id,
      gender,
    });
    const newData = dataSourceRef.current.map((r) =>
      String(r.id) === String(pickerRowKey)
        ? { ...r, fullName: hoTen, profileId: null, studentId: item.id, gender }
        : r
    );
    handleDataChange(newData);
    setPickerOpen(false);
    setPickerRowKey(null);
  };

  const clearProfileLink = (record: AuthorEditableRow) => {
    if (rowMatchesOwner(record, ownerProfileId)) return;
    const rowKey = String(record.id);
    unlinkingRowIdsRef.current.add(rowKey);
    const newData = dataSourceRef.current.map((r) =>
      String(r.id) === rowKey
        ? { ...r, profileId: null, studentId: null, gender: null }
        : r
    );
    editableFormRef.current?.setRowData?.(record.id, {
      profileId: null,
      studentId: null,
      gender: null,
    });
    handleDataChange(newData);
    queueMicrotask(() => {
      unlinkingRowIdsRef.current.delete(rowKey);
    });
  };

  const renderLookupPanel = (tab: 'staff' | 'student') => (
    <>
      <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        {tab === 'staff'
          ? 'Gõ tối thiểu 2 ký tự (họ tên, email công tác, đơn vị…).'
          : 'Gõ tối thiểu 2 ký tự (họ tên, mã SV, email, lớp, ngành…).'}
      </Text>
      <Input.Search
        placeholder={
          tab === 'staff' ? 'Ví dụ: Nguyễn, @udn, Khoa CNTT…' : 'Ví dụ: Nguyễn, 1022…, CNTT…'
        }
        allowClear
        value={lookupQuery}
        onChange={(e) => {
          const v = e.target.value;
          setLookupQuery(v);
          scheduleLookup(v, tab);
        }}
        onSearch={(v) => void runLookup(v, tab)}
        style={{ marginBottom: 12 }}
      />
      <Spin spinning={lookupLoading}>
        {tab === 'staff' ? (
          <List<AuthorProfileLookupItem>
            dataSource={lookupResults as AuthorProfileLookupItem[]}
            locale={{
              emptyText:
                lookupQuery.trim().length < 2 ? 'Nhập ít nhất 2 ký tự để tìm' : 'Không có kết quả',
            }}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => applyProfilePick(item)}
              >
                <List.Item.Meta
                  title={formatAuthorLookupTitle(item)}
                  description={formatAuthorLookupSubtitle(item)}
                />
              </List.Item>
            )}
          />
        ) : (
          <List<AuthorStudentLookupItem>
            dataSource={lookupResults as AuthorStudentLookupItem[]}
            locale={{
              emptyText:
                lookupQuery.trim().length < 2 ? 'Nhập ít nhất 2 ký tự để tìm' : 'Không có kết quả',
            }}
            renderItem={(item) => (
              <List.Item style={{ cursor: 'pointer' }} onClick={() => applyStudentPick(item)}>
                <List.Item.Meta
                  title={formatStudentLookupTitle(item)}
                  description={formatStudentLookupSubtitle(item)}
                />
              </List.Item>
            )}
          />
        )}
      </Spin>
    </>
  );

  const hienThiOGioiTinh = (record: AuthorEditableRow) => {
    const label = nhanGioiTinhTacGia(record.gender);
    if (label === '—') {
      return laTacGiaNhapTay(record) ? (
        <Text type="danger">Chưa chọn</Text>
      ) : (
        <Text type="secondary">—</Text>
      );
    }
    const tuHeThong = !laTacGiaNhapTay(record);
    return (
      <Space direction="vertical" size={0}>
        <Tag color={record.gender === 'FEMALE' ? 'magenta' : record.gender === 'MALE' ? 'blue' : 'default'}>
          {label}
        </Tag>
        {tuHeThong && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            Từ hệ thống
          </Text>
        )}
      </Space>
    );
  };

  /** Cột thông tin cá nhân — khóa với dòng chủ hồ sơ đang đăng nhập. */
  const choPhepSuaThongTin = (record: AuthorEditableRow) =>
    !disabled && !laDongChuDangNhap(record, ownerProfileId);

  const columns: ProColumns<AuthorEditableRow>[] = [
    {
      title: 'STT',
      dataIndex: 'authorOrder',
      valueType: 'digit',
      width: 56,
      editable: (_, record) => choPhepSuaThongTin(record),
      formItemProps: {
        rules: [{ required: true, message: 'Bắt buộc' }],
      },
      render: (_, record) => <Text>{record.authorOrder}</Text>,
    },
    {
      title: hideRoleColumns ? 'Họ và tên' : 'Họ tên',
      dataIndex: 'fullName',
      width: hideRoleColumns ? 220 : 170,
      editable: (_, record) => choPhepSuaThongTin(record),
      formItemProps: {
        rules: [{ required: true, message: 'Bắt buộc' }],
      },
      fieldProps: {
        placeholder: hideRoleColumns
          ? 'Thành viên ngoài: nhập tay. NCV nội bộ: nên bấm “Chọn hồ sơ”.'
          : 'Tác giả ngoài: nhập tay. NCV nội bộ: nên bấm “Chọn hồ sơ”.',
      },
    },
    {
      title: 'Liên kết hồ sơ',
      key: 'profileLookup',
      width: 180,
      editable: false,
      render: (_, record) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {laDongChuDangNhap(record, ownerProfileId) && (
            <Tag color="purple" style={{ marginBottom: 2 }}>
              Bạn (chỉ đổi vai trò)
            </Tag>
          )}
          {record.profileId != null ? (
            <Tag color="blue">
              Cán bộ/GV
              {record.fullName?.trim() ? ` · ${record.fullName.trim()}` : ''} · ID {record.profileId}
            </Tag>
          ) : record.studentId != null ? (
            <Tag color="cyan">
              Sinh viên
              {record.fullName?.trim() ? ` · ${record.fullName.trim()}` : ''} · ID {record.studentId}
            </Tag>
          ) : (
            <Tag>Tác giả ngoài / nhập tay</Tag>
          )}
          <Space size={4} wrap>
            <Button
              type="link"
              size="small"
              disabled={disabled || laDongChuDangNhap(record, ownerProfileId)}
              onClick={() => openPicker(record)}
              style={{ padding: 0 }}
            >
              Chọn từ hồ sơ NCV
            </Button>
            {(record.profileId != null || record.studentId != null) &&
              !rowMatchesOwner(record, ownerProfileId) && (
              <Button
                type="link"
                size="small"
                danger
                disabled={disabled}
                onClick={() => clearProfileLink(record)}
                style={{ padding: 0 }}
              >
                Bỏ liên kết
              </Button>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      valueType: 'select',
      width: 110,
      editable: (_, record) => choPhepSuaThongTin(record) && laTacGiaNhapTay(record),
      fieldProps: {
        options: AUTHOR_GENDER_OPTIONS,
        placeholder: 'Chọn',
      },
      formItemProps: (_form, { entity }) => ({
        rules: [
          {
            validator: async (_, value) => {
              const row = entity as AuthorEditableRow | undefined;
              if (!row || !laTacGiaNhapTay(row)) return;
              if (value) return;
              throw new Error('Bắt buộc với tác giả nhập tay');
            },
          },
        ],
      }),
      render: (_, record) => hienThiOGioiTinh(record),
      renderFormItem: (_, { defaultRender, record }) => {
        if (record && !laTacGiaNhapTay(record)) {
          return hienThiOGioiTinh(record);
        }
        return defaultRender ? defaultRender(_) : null;
      },
    },
    ...(!hideRoleColumns
      ? ([
          {
            title: 'Tác giả đầu',
            dataIndex: 'isTopAuthor',
            valueType: 'switch',
            width: 110,
            fieldProps: {
              checkedChildren: 'Có',
              unCheckedChildren: 'Không',
            },
            render: (_: unknown, record: AuthorEditableRow) =>
              record.isTopAuthor ? (
                <Tag color="blue">Có</Tag>
              ) : (
                <Text type="secondary">Không</Text>
              ),
          },
          {
            title: 'Tác giả liên hệ',
            dataIndex: 'isCorresponding',
            valueType: 'switch',
            width: 120,
            fieldProps: {
              checkedChildren: 'Có',
              unCheckedChildren: 'Không',
            },
            render: (_: unknown, record: AuthorEditableRow) =>
              record.isCorresponding ? (
                <Tag color="green">Có</Tag>
              ) : (
                <Text type="secondary">Không</Text>
              ),
          },
        ] as ProColumns<AuthorEditableRow>[])
      : []),
    {
      title: 'Cơ quan công tác',
      dataIndex: 'affiliationUnits',
      valueType: 'select',
      width: 260,
      editable: (_, record) => choPhepSuaThongTin(record),
      fieldProps: {
        mode: 'multiple',
        options: AUTHOR_AFFILIATION_MULTI_OPTIONS,
        maxTagCount: 'responsive',
        placeholder: 'Chọn một hoặc nhiều đơn vị',
      },
      formItemProps: {
        rules: [
          { required: true, message: 'Chọn cơ quan công tác' },
          {
            validator: async (_, value: unknown) => {
              if (Array.isArray(value) && value.length > 0) return;
              throw new Error('Cần chọn ít nhất 1 đơn vị');
            },
          },
        ],
      },
      render: (_, record) => {
        if (!Array.isArray(record.affiliationUnits) || record.affiliationUnits.length === 0) return '-';
        return (
          <Space size={[4, 4]} wrap>
            {record.affiliationUnits.map((u) => (
              <Tag
                key={`${record.id}-${u}`}
                color={u === AUTHOR_WORKPLACE_OTHER_UNIT ? 'orange' : 'geekblue'}
                style={{
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  lineHeight: '18px',
                  height: 'auto',
                  maxWidth: '100%',
                }}
              >
                {u}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    ...(showContribution
      ? ([
          {
            title: 'Tỉ lệ % đóng góp',
            dataIndex: 'contributionPercent',
            valueType: 'digit',
            width: 130,
            // Tỉ lệ % được phép sửa cả với dòng chủ hồ sơ đang đăng nhập (chỉ cần không bị disable).
            editable: () => !disabled,
            fieldProps: { min: 0, max: 100, step: 1, precision: 0, placeholder: 'VD: 50' },
            render: (_, record) =>
              record.contributionPercent != null ? (
                <Tag color="gold">{record.contributionPercent}%</Tag>
              ) : (
                <Text type="secondary">—</Text>
              ),
          },
        ] as ProColumns<AuthorEditableRow>[])
      : []),
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 90,
      render: (_, record, __, action) => [
        <a
          key="edit"
          onClick={() => {
            action?.startEditable?.(record.id);
          }}
        >
          Sửa
        </a>,
        <a
          key="delete"
          onClick={() => {
            if (rowMatchesOwner(record, ownerProfileId)) {
              return;
            }
            const newData = dataSource.filter((item) => item.id !== record.id);
            handleDataChange(newData);
          }}
          style={{
            color: rowMatchesOwner(record, ownerProfileId) ? '#d9d9d9' : '#ff4d4f',
            cursor: rowMatchesOwner(record, ownerProfileId) ? 'not-allowed' : 'pointer',
          }}
        >
          {rowMatchesOwner(record, ownerProfileId) ? 'Không thể xóa' : 'Xóa'}
        </a>,
      ],
    },
  ];

  return (
    <div className="authors-editor">
      {validation.errors.length > 0 && (
        <Alert
          type="error"
          message={
            validation.errors.length === 1
              ? validation.errors[0]
              : hideRoleColumns
                ? 'Lỗi danh sách thành viên'
                : 'Lỗi danh sách tác giả'
          }
          description={
            validation.errors.length === 1 ? undefined : (
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validation.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {validation.warnings.length > 0 && validation.errors.length === 0 && (
        <Alert
          type="warning"
          message="Cảnh báo"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validation.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      <EditableProTable<AuthorEditableRow>
        rowKey="id"
        /** Bật chế độ value điều khiển từ ngoài: mỗi lần dữ liệu dòng đổi thì Form trong bảng được cập nhật; nếu tắt thì sau khi chọn NCV ô họ tên vẫn trống dù state đã có tên. */
        controlled
        editableFormRef={editableFormRef}
        columns={columns}
        value={dataSource}
        onChange={(rows) => handleDataChange(rows as AuthorEditableRow[])}
        recordCreatorProps={
          disabled
            ? false
            : {
                position: 'bottom',
                record: () => {
                  const key = `new-${Date.now()}`;
                  const maxOrder =
                    dataSource.length === 0
                      ? 0
                      : Math.max(...dataSource.map((r) => (Number.isFinite(Number(r.authorOrder)) ? Number(r.authorOrder) : 0)));
                  return {
                    id: key,
                    clientRowKey: key,
                    fullName: '',
                    profileId: null,
                    studentId: null,
                    gender: null,
                    authorOrder: maxOrder + 1,
                    isTopAuthor: false,
                    isCorresponding: false,
                    affiliationUnits: [UDN_AFFILIATION_UNITS[0]],
                    affiliationType: 'UDN_ONLY' as AffiliationType,
                    isMultiAffiliationOutsideUdn: false,
                    contributionPercent: null,
                  };
                },
                creatorButtonText: nhanThemDong,
              }
        }
        editable={{
          type: 'multiple',
          editableKeys,
          onChange: setEditableRowKeys,
          saveText: 'Lưu',
          cancelText: 'Hủy',
          actionRender: (_row, _config, defaultDom) => [defaultDom.save, defaultDom.cancel],
          onSave: async (rowKey, row) => {
            if (laDongChuDangNhap(row as AuthorEditableRow, ownerProfileId)) {
              const prev = dataSourceRef.current.find((r) => String(r.id) === String(rowKey));
              if (prev) {
                return {
                  ...prev,
                  isTopAuthor: (row as AuthorEditableRow).isTopAuthor,
                  isCorresponding: (row as AuthorEditableRow).isCorresponding,
                  contributionPercent: (row as AuthorEditableRow).contributionPercent,
                };
              }
            }
            return row;
          },
        }}
        rowClassName={(record) =>
          laDongChuDangNhap(record, ownerProfileId) ? 'authors-editor-owner-row' : ''
        }
        bordered
        size="small"
      />

      <Modal
        title="Chọn liên kết nội bộ"
        open={pickerOpen}
        onCancel={() => {
          setPickerOpen(false);
          setPickerRowKey(null);
          setLookupResults([]);
          setLookupQuery('');
        }}
        footer={null}
        width={580}
        destroyOnClose
      >
        <Tabs
          activeKey={pickerTab}
          onChange={(key) => {
            const tab = key === 'student' ? 'student' : 'staff';
            setPickerTab(tab);
            setLookupResults([]);
            if (lookupQuery.trim().length >= 2) {
              void runLookup(lookupQuery, tab);
            }
          }}
          items={[
            {
              key: 'staff',
              label: 'Cán bộ/Giảng viên',
              children: renderLookupPanel('staff'),
            },
            {
              key: 'student',
              label: 'Sinh viên',
              children: renderLookupPanel('student'),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default AuthorsEditor;

export { AuthorsEditor };
export type { AuthorsEditorProps };
