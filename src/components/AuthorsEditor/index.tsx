import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { EditableProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Space, Typography, Tag, Modal, Input, List, Button, Spin } from 'antd';
import type { PublicationAuthor, AffiliationType } from '@/services/api/profilePublications';
import {
  AUTHOR_AFFILIATION_MULTI_OPTIONS,
  AUTHOR_WORKPLACE_OTHER_UNIT,
  deriveAffiliationTypeFromUnits,
  normalizeAffiliationUnits,
  UDN_AFFILIATION_UNITS,
  normalizePublicationAuthor,
  lookupAuthorProfiles,
  type AuthorProfileLookupItem,
} from '@/services/api/profilePublications';
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

interface AuthorsEditorProps {
  value?: PublicationAuthor[];
  onChange?: (authors: PublicationAuthor[]) => void;
  disabled?: boolean;
  /** Bắt buộc có trong danh sách; không cho xóa dòng này (chỉ đổi vai trò sau). */
  ownerProfileId?: number;
}

type AuthorEditableRow = PublicationAuthor & { id: React.Key };

const AuthorsEditor: React.FC<AuthorsEditorProps> = ({
  value = [],
  onChange,
  disabled = false,
  ownerProfileId,
}) => {
  const editableFormRef = useRef<any>();
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<AuthorEditableRow[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerRowKey, setPickerRowKey] = useState<React.Key | null>(null);
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResults, setLookupResults] = useState<AuthorProfileLookupItem[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Bản dataSource mới nhất — dùng khi merge chống Pro Table gọi onChange lần 2 với form rỗng (đặc biệt dòng mới). */
  const dataSourceRef = useRef<AuthorEditableRow[]>([]);
  dataSourceRef.current = dataSource;

  useEffect(() => {
    const mapped = value.map((a, idx) => ({
      ...normalizePublicationAuthor(a),
      id: (a.clientRowKey ?? a.id ?? `new-${idx}`) as React.Key,
    }));
    setDataSource(mapped);
  }, [value]);

  const runLookup = useCallback(async (q: string) => {
    const t = q.trim();
    if (t.length < 2) {
      setLookupResults([]);
      return;
    }
    setLookupLoading(true);
    try {
      const rows = await lookupAuthorProfiles(t, 25);
      setLookupResults(rows);
    } catch {
      setLookupResults([]);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  const scheduleLookup = useCallback(
    (q: string) => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        void runLookup(q);
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

    if (dataSource.length === 0) {
      errors.push('Cần ít nhất 1 tác giả');
    }

    const mainAuthors = dataSource.filter((a) => a.isMainAuthor || a.isCorresponding);
    const correspondingAuthors = dataSource.filter((a) => a.isCorresponding);

    if (mainAuthors.length === 0) {
      errors.push('Cần có ít nhất 1 tác giả trong nhóm chính (chính hoặc liên hệ) (n)');
    }

    if (correspondingAuthors.length === 0) {
      warnings.push('Chưa xác định tác giả liên hệ (p)');
    }

    const n = mainAuthors.length;
    const p = correspondingAuthors.length;

    const orders = dataSource.map((a) => a.authorOrder);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      errors.push('Thứ tự tác giả không được trùng');
    }

    const hasUdnAuthor = dataSource.some((a) => a.affiliationType === 'UDN_ONLY');
    if (!hasUdnAuthor) {
      warnings.push('Không có tác giả thuộc Đại học Đà Nẵng');
    }

    if (ownerProfileId != null && !dataSource.some((a) => rowMatchesOwner(a, ownerProfileId))) {
      errors.push('Phải có ít nhất một tác giả là bạn (hồ sơ đang đăng nhập)');
    }

    const udnNoProfile = dataSource.filter(
      (a) => a.affiliationType === 'UDN_ONLY' && (a.profileId == null || a.profileId === undefined)
    );
    if (udnNoProfile.length > 0) {
      warnings.push(
        `Có ${udnNoProfile.length} dòng cơ quan ĐHĐN chưa liên kết hồ sơ nội bộ — nên bấm “Chọn từ hồ sơ NCV” để gắn profile_id (trừ tác giả ngoài thật sự không có trong hệ thống).`
      );
    }

    return { errors, warnings, n, p, isValid: errors.length === 0 };
  }, [dataSource, ownerProfileId]);

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
      if (prevRow) {
        const tenMoi = String(next.fullName ?? '').trim();
        const tenCu = String(prevRow.fullName ?? '').trim();
        if (!tenMoi && tenCu) next = { ...next, fullName: prevRow.fullName };
        if (next.profileId == null && prevRow.profileId != null) {
          next = { ...next, profileId: prevRow.profileId };
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
    setPickerRowKey(record.id);
    setLookupQuery('');
    setLookupResults([]);
    setPickerOpen(true);
  };

  /** Lấy tên hiển thị từ dòng lookup (đủ biến thể field từ API). */
  function tenTuLookup(it: AuthorProfileLookupItem): string {
    const fn = typeof it.fullName === 'string' ? it.fullName.trim() : '';
    if (fn) return fn;
    const mail = typeof it.workEmail === 'string' ? it.workEmail.trim() : '';
    if (mail) return mail;
    return `Hồ sơ #${it.id}`;
  }

  const applyProfilePick = (item: AuthorProfileLookupItem) => {
    if (pickerRowKey == null) return;
    const hoTen = tenTuLookup(item);
    editableFormRef.current?.setRowData?.(pickerRowKey, { fullName: hoTen, profileId: item.id });
    /** Dùng ref để không bị state closure cũ khi bảng vừa thêm dòng / vừa đổi editable. */
    const newData = dataSourceRef.current.map((r) =>
      String(r.id) === String(pickerRowKey) ? { ...r, fullName: hoTen, profileId: item.id } : r
    );
    handleDataChange(newData);
    setPickerOpen(false);
    setPickerRowKey(null);
  };

  const clearProfileLink = (record: AuthorEditableRow) => {
    if (rowMatchesOwner(record, ownerProfileId)) return;
    const newData = dataSource.map((r) =>
      r.id === record.id ? { ...r, profileId: null } : r
    );
    handleDataChange(newData);
  };

  const columns: ProColumns<AuthorEditableRow>[] = [
    {
      title: 'STT',
      dataIndex: 'authorOrder',
      valueType: 'digit',
      width: 56,
      formItemProps: {
        rules: [{ required: true, message: 'Bắt buộc' }],
      },
      render: (_, record) => <Text>{record.authorOrder}</Text>,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      width: 170,
      formItemProps: {
        rules: [{ required: true, message: 'Bắt buộc' }],
      },
      fieldProps: {
        placeholder: 'Tác giả ngoài: nhập tay. NCV nội bộ: nên bấm “Chọn hồ sơ”.',
      },
    },
    {
      title: 'Liên kết hồ sơ',
      key: 'profileLookup',
      width: 180,
      editable: false,
      render: (_, record) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          {record.profileId != null ? (
            <Tag color="blue">
              Nội bộ
              {record.fullName?.trim() ? ` · ${record.fullName.trim()}` : ''} · ID {record.profileId}
            </Tag>
          ) : (
            <Tag>Tác giả ngoài / nhập tay</Tag>
          )}
          <Space size={4} wrap>
            <Button
              type="link"
              size="small"
              disabled={disabled}
              onClick={() => openPicker(record)}
              style={{ padding: 0 }}
            >
              Chọn từ hồ sơ NCV
            </Button>
            {record.profileId != null && !rowMatchesOwner(record, ownerProfileId) && (
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
      title: 'Tác giả chính',
      dataIndex: 'isMainAuthor',
      valueType: 'switch',
      width: 110,
      fieldProps: {
        checkedChildren: 'Có',
        unCheckedChildren: 'Không',
      },
      render: (_, record) =>
        record.isMainAuthor ? <Tag color="blue">Có</Tag> : <Text type="secondary">Không</Text>,
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
      render: (_, record) =>
        record.isCorresponding ? <Tag color="green">Có</Tag> : <Text type="secondary">Không</Text>,
    },
    {
      title: 'Cơ quan công tác',
      dataIndex: 'affiliationUnits',
      valueType: 'select',
      width: 260,
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
              <Tag key={`${record.id}-${u}`} color={u === AUTHOR_WORKPLACE_OTHER_UNIT ? 'orange' : 'geekblue'}>
                {u}
              </Tag>
            ))}
          </Space>
        );
      },
    },
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
          message="Lỗi danh sách tác giả"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validation.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {validation.warnings.length > 0 && (
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
                    authorOrder: maxOrder + 1,
                    isMainAuthor: false,
                    isCorresponding: false,
                    affiliationUnits: [UDN_AFFILIATION_UNITS[0]],
                    affiliationType: 'UDN_ONLY' as AffiliationType,
                    isMultiAffiliationOutsideUdn: false,
                  };
                },
                creatorButtonText: 'Thêm tác giả',
              }
        }
        editable={{
          type: 'multiple',
          editableKeys,
          onChange: setEditableRowKeys,
          saveText: 'Lưu',
          cancelText: 'Hủy',
          actionRender: (_row, _config, defaultDom) => [defaultDom.save, defaultDom.cancel],
        }}
        bordered
        size="small"
      />

      <Modal
        title="Chọn hồ sơ khoa học nội bộ"
        open={pickerOpen}
        onCancel={() => {
          setPickerOpen(false);
          setPickerRowKey(null);
          setLookupResults([]);
        }}
        footer={null}
        width={560}
        destroyOnClose
      >
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          Gõ tối thiểu 2 ký tự (họ tên, email công tác, đơn vị…).
        </Text>
        <Input.Search
          placeholder="Ví dụ: Nguyễn, @udn, Khoa CNTT…"
          allowClear
          value={lookupQuery}
          onChange={(e) => {
            const v = e.target.value;
            setLookupQuery(v);
            scheduleLookup(v);
          }}
          onSearch={(v) => void runLookup(v)}
          style={{ marginBottom: 12 }}
        />
        <Spin spinning={lookupLoading}>
          <List<AuthorProfileLookupItem>
            dataSource={lookupResults}
            locale={{ emptyText: lookupQuery.trim().length < 2 ? 'Nhập ít nhất 2 ký tự để tìm' : 'Không có kết quả' }}
            renderItem={(item) => (
              <List.Item
                style={{ cursor: 'pointer' }}
                onClick={() => applyProfilePick(item)}
              >
                <List.Item.Meta
                  title={item.fullName}
                  description={
                    <span>
                      {item.workEmail}
                      {item.faculty || item.department
                        ? ` · ${[item.faculty, item.department].filter(Boolean).join(' — ')}`
                        : ''}
                      {item.organization ? ` · ${item.organization}` : ''}
                      {item.status ? ` · ${item.status}` : ''}
                    </span>
                  }
                />
              </List.Item>
            )}
          />
        </Spin>
      </Modal>
    </div>
  );
};

export default AuthorsEditor;

export { AuthorsEditor };
export type { AuthorsEditorProps };
