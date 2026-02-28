import React, { useState, useEffect, useMemo } from 'react';
import { EditableProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Alert, Select, InputNumber, Checkbox, Space, Typography, message } from 'antd';
import type {
  PublicationAuthor,
  AffiliationType,
} from '@/services/api/profilePublications';
import { AFFILIATION_TYPE_OPTIONS } from '@/services/api/profilePublications';
import './index.less';

const { Text } = Typography;

interface AuthorsEditorProps {
  value?: PublicationAuthor[];
  onChange?: (authors: PublicationAuthor[]) => void;
  disabled?: boolean;
  profileOptions?: { value: number; label: string }[];
}

type AuthorEditableRow = PublicationAuthor & { id: React.Key };

const AuthorsEditor: React.FC<AuthorsEditorProps> = ({
  value = [],
  onChange,
  disabled = false,
  profileOptions = [],
}) => {
  const [editableKeys, setEditableRowKeys] = useState<React.Key[]>([]);
  const [dataSource, setDataSource] = useState<AuthorEditableRow[]>([]);

  useEffect(() => {
    const mapped = value.map((a, idx) => ({
      ...a,
      id: a.id ?? `new-${idx}`,
    }));
    setDataSource(mapped);
  }, [value]);

  const validation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (dataSource.length === 0) {
      errors.push('Cần ít nhất 1 tác giả');
    }

    const mainAuthors = dataSource.filter((a) => a.isMainAuthor);
    const correspondingAuthors = dataSource.filter((a) => a.isCorresponding);

    if (mainAuthors.length === 0) {
      errors.push('Cần có ít nhất 1 tác giả chính (n)');
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

    const hasUdnAuthor = dataSource.some(
      (a) => a.affiliationType === 'UDN_ONLY' || a.affiliationType === 'MIXED'
    );
    if (!hasUdnAuthor) {
      warnings.push('Không có tác giả thuộc ĐHĐN');
    }

    return { errors, warnings, n, p, isValid: errors.length === 0 };
  }, [dataSource]);

  const handleDataChange = (newData: AuthorEditableRow[]) => {
    setDataSource(newData);
    if (onChange) {
      const cleaned = newData.map(({ id, ...rest }) => ({
        ...rest,
        id: typeof id === 'number' ? id : undefined,
      }));
      onChange(cleaned as PublicationAuthor[]);
    }
  };

  const columns: ProColumns<AuthorEditableRow>[] = [
    {
      title: 'STT',
      dataIndex: 'authorOrder',
      valueType: 'digit',
      width: 70,
      formItemProps: {
        rules: [{ required: true, message: 'Bắt buộc' }],
      },
    },
    {
      title: 'Họ tên tác giả',
      dataIndex: 'fullName',
      width: 180,
      formItemProps: {
        rules: [{ required: true, message: 'Bắt buộc' }],
      },
    },
    {
      title: 'GV nội bộ',
      dataIndex: 'profileId',
      width: 180,
      renderFormItem: () => (
        <Select
          allowClear
          showSearch
          placeholder="Chọn GV (nếu có)"
          options={profileOptions}
          filterOption={(input, option) =>
            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
          }
        />
      ),
      render: (_, record) => {
        const found = profileOptions.find((p) => p.value === record.profileId);
        return found ? found.label : <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Tác giả chính',
      dataIndex: 'isMainAuthor',
      valueType: 'checkbox',
      width: 100,
      render: (_, record) => (record.isMainAuthor ? 'Có' : '-'),
      renderFormItem: (_, { record }) => (
        <Checkbox checked={record?.isMainAuthor} />
      ),
    },
    {
      title: 'Liên hệ',
      dataIndex: 'isCorresponding',
      valueType: 'checkbox',
      width: 80,
      render: (_, record) => (record.isCorresponding ? 'Có' : '-'),
      renderFormItem: (_, { record }) => (
        <Checkbox checked={record?.isCorresponding} />
      ),
    },
    {
      title: 'Đơn vị',
      dataIndex: 'affiliationType',
      width: 150,
      valueType: 'select',
      fieldProps: {
        options: AFFILIATION_TYPE_OPTIONS,
      },
      render: (_, record) => {
        const found = AFFILIATION_TYPE_OPTIONS.find(
          (o) => o.value === record.affiliationType
        );
        return found?.label || '-';
      },
    },
    {
      title: 'Nhiều đơn vị ngoài ĐHĐN',
      dataIndex: 'isMultiAffiliationOutsideUdn',
      valueType: 'checkbox',
      width: 120,
      render: (_, record) => (record.isMultiAffiliationOutsideUdn ? 'Có' : '-'),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 100,
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
            const newData = dataSource.filter((item) => item.id !== record.id);
            handleDataChange(newData);
          }}
          style={{ color: '#ff4d4f' }}
        >
          Xóa
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

      <Space style={{ marginBottom: 12 }}>
        <Text>
          <strong>n</strong> (tác giả chính): {validation.n}
        </Text>
        <Text>
          <strong>p</strong> (tác giả liên hệ): {validation.p}
        </Text>
      </Space>

      <EditableProTable<AuthorEditableRow>
        rowKey="id"
        columns={columns}
        value={dataSource}
        onChange={handleDataChange}
        recordCreatorProps={
          disabled
            ? false
            : {
                position: 'bottom',
                record: () => ({
                  id: `new-${Date.now()}`,
                  fullName: '',
                  profileId: null,
                  authorOrder: dataSource.length + 1,
                  isMainAuthor: false,
                  isCorresponding: false,
                  affiliationType: 'UDN_ONLY' as AffiliationType,
                  isMultiAffiliationOutsideUdn: false,
                }),
                creatorButtonText: 'Thêm tác giả',
              }
        }
        editable={{
          type: 'multiple',
          editableKeys,
          onChange: setEditableRowKeys,
          actionRender: (row, config, defaultDom) => [
            defaultDom.save,
            defaultDom.cancel,
          ],
        }}
        scroll={{ x: 1000 }}
        bordered
        size="small"
      />
    </div>
  );
};

export default AuthorsEditor;

export { AuthorsEditor };
export type { AuthorsEditorProps };
