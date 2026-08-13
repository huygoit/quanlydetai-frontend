/**
 * Countries — Quản lý danh mục quốc gia (tab Danh mục hệ thống)
 */
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit } from '@ant-design/pro-components';
import type { ProColumns, ActionType, ProFormInstance } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  queryCountries,
  createCountry,
  updateCountry,
  updateCountryStatus,
  COUNTRY_STATUS_MAP,
  COUNTRY_STATUS_OPTIONS,
  type Country,
  type CountryStatus,
} from '@/services/api/countries';

const Countries: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Country | null>(null);

  const handleCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Country) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values: {
    code: string;
    name: string;
    display_order?: number;
    status?: CountryStatus;
  }) => {
    const payload = {
      code: values.code,
      name: values.name,
      displayOrder: values.display_order ?? 0,
      status: values.status,
    };
    try {
      if (editingRecord) {
        const result = await updateCountry(editingRecord.id, payload);
        if (result?.success !== false && (result?.data || result)) {
          message.success('Cập nhật quốc gia thành công');
          setModalVisible(false);
          setEditingRecord(null);
          actionRef.current?.reload();
          return true;
        }
        message.error(result?.message || 'Cập nhật thất bại');
        return false;
      }
      const result = await createCountry(payload);
      if (result?.success !== false && (result?.data || result)) {
        message.success('Tạo quốc gia thành công');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      }
      message.error(result?.message || 'Tạo quốc gia thất bại');
      return false;
    } catch (error: any) {
      message.error(error?.message || 'Có lỗi xảy ra');
      return false;
    }
  };

  const handleToggleStatus = async (record: Country) => {
    const newStatus: CountryStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updateCountryStatus(record.id, { status: newStatus });
      if (result.success) {
        message.success(`Đã chuyển trạng thái sang "${COUNTRY_STATUS_MAP[newStatus].text}"`);
        actionRef.current?.reload();
      }
    } catch {
      message.error('Không thể đổi trạng thái');
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  };

  const columns: ProColumns<Country>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 100,
      copyable: true,
      hideInSearch: true,
    },
    {
      title: 'Tên quốc gia',
      dataIndex: 'name',
      hideInSearch: true,
    },
    {
      title: 'Từ khóa',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: 'Tìm theo mã hoặc tên' },
    },
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      width: 90,
      align: 'center',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      valueType: 'select',
      valueEnum: Object.entries(COUNTRY_STATUS_MAP).reduce(
        (acc, [key, val]) => {
          acc[key] = { text: val.text, status: val.status as any };
          return acc;
        },
        {} as Record<string, { text: string; status: string }>,
      ),
      render: (_, record) => {
        const statusConfig = COUNTRY_STATUS_MAP[record.status];
        return <Badge status={statusConfig.status as any} text={statusConfig.text} />;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updated_at',
      width: 150,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => formatDateTime(record.updated_at),
    },
    {
      title: 'Hành động',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {access.canEditCountry && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          )}
          {access.canEditCountry && (
            <Popconfirm
              title="Đổi trạng thái"
              description={
                record.status === 'ACTIVE'
                  ? 'Bạn có chắc muốn ngừng hoạt động quốc gia này?'
                  : 'Bạn có chắc muốn kích hoạt lại quốc gia này?'
              }
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
      <ProTable<Country>
        headerTitle="Danh sách quốc gia"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateCountry
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Thêm quốc gia
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          const { current, pageSize, keyword, status } = params;
          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }
          const result = await queryCountries({
            page: current,
            perPage: pageSize,
            keyword,
            status: status as CountryStatus,
            sortBy,
            order,
          });
          return {
            data: result.data,
            total: result.meta?.total || 0,
            success: true,
          };
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 4 },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `Đang xem ${range[0]}-${range[1]} trên tổng ${total} quốc gia`,
        }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
      />

      <ModalForm
        key={editingRecord ? `edit-${editingRecord.id}` : 'create'}
        title={editingRecord ? `Chỉnh sửa: ${editingRecord.code}` : 'Thêm quốc gia mới'}
        open={modalVisible}
        onOpenChange={(visible) => {
          setModalVisible(visible);
          if (!visible) {
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
                display_order: editingRecord.display_order,
                status: editingRecord.status,
              }
            : { status: 'ACTIVE', display_order: 0 }
        }
        onFinish={handleSubmit}
        modalProps={{ destroyOnClose: true, maskClosable: false }}
        submitter={{ searchConfig: { submitText: 'Đồng ý', resetText: 'Hủy' } }}
        grid
        rowProps={{ gutter: 16 }}
        width={560}
      >
        <ProFormText
          name="code"
          label="Mã quốc gia"
          placeholder="VD: VN, US, JP"
          rules={[
            { required: true, message: 'Vui lòng nhập mã' },
            { max: 10, message: 'Mã tối đa 10 ký tự' },
          ]}
          fieldProps={{ style: { textTransform: 'uppercase' } }}
          colProps={{ span: 24 }}
        />
        <ProFormText
          name="name"
          label="Tên quốc gia"
          placeholder="VD: Việt Nam"
          rules={[
            { required: true, message: 'Vui lòng nhập tên' },
            { max: 255, message: 'Tên tối đa 255 ký tự' },
          ]}
          colProps={{ span: 24 }}
        />
        <ProFormDigit
          name="display_order"
          label="Thứ tự hiển thị"
          min={0}
          max={99999}
          fieldProps={{ precision: 0 }}
          colProps={{ span: 12 }}
        />
        <ProFormSelect
          name="status"
          label="Trạng thái"
          options={COUNTRY_STATUS_OPTIONS}
          colProps={{ span: 12 }}
        />
      </ModalForm>
    </>
  );
};

export default Countries;
