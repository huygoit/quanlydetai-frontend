/**
 * Universities — Quản lý danh mục trường đại học / học viện
 * Tạm ẩn khu vực/khối; quốc gia lấy từ danh mục (mặc định Việt Nam).
 */
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
  ProFormSwitch,
} from '@ant-design/pro-components';
import type { ProColumns, ActionType, ProFormInstance } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  queryUniversities,
  createUniversity,
  updateUniversity,
  updateUniversityStatus,
  UNIVERSITY_STATUS_MAP,
  UNIVERSITY_STATUS_OPTIONS,
  type University,
  type UniversityStatus,
} from '@/services/api/universities';
import { getCountryOptions } from '@/services/api/countries';

const Universities: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<University | null>(null);
  const [countryOptions, setCountryOptions] = useState<{ label: string; value: number }[]>([]);
  const [vietnamCountryId, setVietnamCountryId] = useState<number | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getCountryOptions();
        if (cancelled) return;
        const opts = (res.data ?? []).map((c) => ({
          label: c.label || c.name,
          value: Number(c.id),
        }));
        setCountryOptions(opts);
        const vn = (res.data ?? []).find((c) => String(c.code).toUpperCase() === 'VN');
        if (vn) setVietnamCountryId(Number(vn.id));
      } catch {
        /* thiếu danh mục quốc gia */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const epCountryId = (raw: unknown): number | undefined => {
    if (raw == null || raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };

  const handleSubmit = async (values: {
    code: string;
    name: string;
    country_id?: number;
    is_private?: boolean;
    display_order?: number;
    status?: UniversityStatus;
  }) => {
    const payload = {
      code: values.code,
      name: values.name,
      countryId: epCountryId(values.country_id) ?? vietnamCountryId ?? null,
      isPrivate: Boolean(values.is_private),
      displayOrder: values.display_order ?? 0,
      status: values.status,
    };
    try {
      if (editingRecord) {
        const result = await updateUniversity(editingRecord.id, payload);
        if (result?.success !== false && (result?.data || result)) {
          message.success('Cập nhật trường thành công');
          setModalVisible(false);
          setEditingRecord(null);
          actionRef.current?.reload();
          return true;
        }
        message.error(result?.message || 'Cập nhật thất bại');
        return false;
      }
      const result = await createUniversity(payload);
      if (result?.success !== false && (result?.data || result)) {
        message.success('Tạo trường thành công');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      }
      message.error(result?.message || 'Tạo trường thất bại');
      return false;
    } catch (error: any) {
      message.error(error?.message || 'Có lỗi xảy ra');
      return false;
    }
  };

  const handleToggleStatus = async (record: University) => {
    const newStatus: UniversityStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updateUniversityStatus(record.id, { status: newStatus });
      if (result.success) {
        message.success(`Đã chuyển trạng thái sang "${UNIVERSITY_STATUS_MAP[newStatus].text}"`);
        actionRef.current?.reload();
      }
    } catch {
      message.error('Không thể đổi trạng thái');
    }
  };

  const columns: ProColumns<University>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 100,
      copyable: true,
      hideInSearch: true,
    },
    {
      title: 'Tên trường',
      dataIndex: 'name',
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: 'Từ khóa',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: 'Tìm theo mã hoặc tên' },
    },
    {
      title: 'Quốc gia',
      dataIndex: 'country_id',
      width: 140,
      valueType: 'select',
      fieldProps: {
        options: countryOptions,
        showSearch: true,
        optionFilterProp: 'label',
        allowClear: true,
      },
      render: (_, r) => r.country?.name || '—',
    },
    {
      title: 'Tư thục',
      dataIndex: 'is_private',
      width: 90,
      hideInSearch: true,
      render: (_, r) => (r.is_private ? <Tag color="orange">Tư thục</Tag> : <Tag>Công lập</Tag>),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      width: 80,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: Object.entries(UNIVERSITY_STATUS_MAP).reduce(
        (acc, [key, val]) => {
          acc[key] = { text: val.text, status: val.status as any };
          return acc;
        },
        {} as Record<string, { text: string; status: string }>,
      ),
      render: (_, record) => {
        const c = UNIVERSITY_STATUS_MAP[record.status];
        return <Badge status={c.status as any} text={c.text} />;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updated_at',
      width: 140,
      hideInSearch: true,
      render: (_, r) => (r.updated_at ? dayjs(r.updated_at).format('DD/MM/YYYY HH:mm') : '-'),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {access.canEditUniversity && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingRecord(record);
                setModalVisible(true);
              }}
            >
              Sửa
            </Button>
          )}
          {access.canEditUniversity && (
            <Popconfirm
              title="Đổi trạng thái"
              onConfirm={() => handleToggleStatus(record)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button
                type="link"
                size="small"
                icon={<SwapOutlined />}
                danger={record.status === 'ACTIVE'}
              >
                {record.status === 'ACTIVE' ? 'Ngừng HĐ' : 'Kích hoạt'}
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<University>
        headerTitle="Danh sách trường đại học / học viện"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateUniversity
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingRecord(null);
                    setModalVisible(true);
                  }}
                >
                  Thêm trường
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          const { current, pageSize, keyword, status, country_id } = params as any;
          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }
          const result = await queryUniversities({
            page: current,
            perPage: pageSize,
            keyword,
            status: status as UniversityStatus,
            countryId: country_id ? Number(country_id) : undefined,
            sortBy,
            order,
          });
          return {
            data: result.data,
            total: result.meta?.total || 0,
            success: true,
          };
        }}
        search={{ labelWidth: 'auto', defaultCollapsed: true }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} / ${total} trường`,
        }}
        scroll={{ x: 1100 }}
      />

      <ModalForm
        key={
          editingRecord
            ? `edit-${editingRecord.id}-${epCountryId(editingRecord.country_id) ?? 'x'}`
            : `create-${vietnamCountryId ?? 'x'}`
        }
        title={editingRecord ? `Chỉnh sửa: ${editingRecord.code}` : 'Thêm trường mới'}
        open={modalVisible}
        onOpenChange={(v) => {
          setModalVisible(v);
          if (!v) {
            setEditingRecord(null);
            formRef.current?.resetFields();
          }
        }}
        formRef={formRef}
        initialValues={
          editingRecord
            ? {
                code: editingRecord.code,
                name: editingRecord.name,
                // Ép number: bigint từ API hay ra chuỗi → Select lệch options sẽ hiện id
                country_id:
                  epCountryId(editingRecord.country_id) ??
                  epCountryId(editingRecord.country?.id) ??
                  vietnamCountryId,
                is_private: editingRecord.is_private,
                display_order: editingRecord.display_order,
                status: editingRecord.status,
              }
            : {
                status: 'ACTIVE',
                is_private: false,
                display_order: 0,
                country_id: vietnamCountryId,
              }
        }
        onFinish={handleSubmit}
        modalProps={{ destroyOnClose: true, maskClosable: false }}
        submitter={{ searchConfig: { submitText: 'Đồng ý', resetText: 'Hủy' } }}
        grid
        rowProps={{ gutter: 16 }}
        width={640}
      >
        <ProFormText
          name="code"
          label="Mã trường"
          rules={[{ required: true, message: 'Bắt buộc' }, { max: 32 }]}
          fieldProps={{ style: { textTransform: 'uppercase' } }}
          colProps={{ span: 12 }}
        />
        <ProFormDigit
          name="display_order"
          label="Thứ tự"
          min={0}
          fieldProps={{ precision: 0 }}
          colProps={{ span: 12 }}
        />
        <ProFormText
          name="name"
          label="Tên trường"
          rules={[{ required: true, message: 'Bắt buộc' }, { max: 255 }]}
          colProps={{ span: 24 }}
        />
        <ProFormSelect
          name="country_id"
          label="Quốc gia"
          options={countryOptions}
          rules={[{ required: true, message: 'Chọn quốc gia' }]}
          convertValue={(v) => epCountryId(v)}
          fieldProps={{
            showSearch: true,
            optionFilterProp: 'label',
            placeholder: 'Chọn quốc gia',
            options: countryOptions,
          }}
          colProps={{ span: 12 }}
        />
        <ProFormSelect
          name="status"
          label="Trạng thái"
          options={UNIVERSITY_STATUS_OPTIONS}
          colProps={{ span: 12 }}
        />
        <ProFormSwitch name="is_private" label="Trường tư thục" colProps={{ span: 12 }} />
      </ModalForm>
    </>
  );
};

export default Universities;
