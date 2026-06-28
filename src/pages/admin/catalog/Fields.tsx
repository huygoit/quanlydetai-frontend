/**
 * Fields - Quản lý lĩnh vực khoa học
 * Tab trong trang "Danh mục hệ thống". Pattern giống quản lý Đơn vị.
 */
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit } from '@ant-design/pro-components';
import type { ProColumns, ActionType, ProFormInstance } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  queryFields,
  createField,
  updateField,
  updateFieldStatus,
  FIELD_STATUS_MAP,
  FIELD_STATUS_OPTIONS,
  type Field,
  type FieldStatus,
} from '@/services/api/fields';

const Fields: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Field | null>(null);

  const handleCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Field) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  // Xử lý submit form (tạo/sửa)
  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        const result = await updateField(editingRecord.id, values);
        if (result?.success !== false && (result?.data || result)) {
          message.success('Cập nhật lĩnh vực thành công');
          setModalVisible(false);
          setEditingRecord(null);
          actionRef.current?.reload();
          return true;
        }
        message.error(result?.message || 'Cập nhật thất bại');
        return false;
      }
      const result = await createField(values);
      if (result?.success !== false && (result?.data || result)) {
        message.success('Tạo lĩnh vực thành công');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      }
      message.error(result?.message || 'Tạo lĩnh vực thất bại');
      return false;
    } catch (error: any) {
      message.error(error?.message || 'Có lỗi xảy ra');
      return false;
    }
  };

  // Đổi trạng thái ACTIVE/INACTIVE
  const handleToggleStatus = async (record: Field) => {
    const newStatus: FieldStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updateFieldStatus(record.id, { status: newStatus });
      if (result.success) {
        message.success(`Đã chuyển trạng thái sang "${FIELD_STATUS_MAP[newStatus].text}"`);
        actionRef.current?.reload();
      }
    } catch (error) {
      message.error('Không thể đổi trạng thái');
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  };

  const columns: ProColumns<Field>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 120,
      copyable: true,
      hideInSearch: true,
    },
    {
      title: 'Tên lĩnh vực',
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
      valueEnum: Object.entries(FIELD_STATUS_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text, status: val.status as any };
        return acc;
      }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        const statusConfig = FIELD_STATUS_MAP[record.status];
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
          {access.canEditField && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          )}
          {access.canEditField && (
            <Popconfirm
              title="Đổi trạng thái"
              description={
                record.status === 'ACTIVE'
                  ? 'Bạn có chắc muốn ngừng hoạt động lĩnh vực này?'
                  : 'Bạn có chắc muốn kích hoạt lại lĩnh vực này?'
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
      <ProTable<Field>
        headerTitle="Danh sách lĩnh vực"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateField
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Thêm lĩnh vực
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

          const result = await queryFields({
            page: current,
            perPage: pageSize,
            keyword,
            status: status as FieldStatus,
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
          showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} trên tổng ${total} lĩnh vực`,
        }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
      />

      {/* Modal tạo/sửa lĩnh vực */}
      <ModalForm
        key={editingRecord ? `edit-${editingRecord.id}` : 'create'}
        title={editingRecord ? `Chỉnh sửa lĩnh vực: ${editingRecord.code}` : 'Thêm lĩnh vực mới'}
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
        width={520}
      >
        <ProFormText
          name="code"
          label="Mã lĩnh vực"
          placeholder="VD: CNTT, KHTN"
          rules={[
            { required: true, message: 'Vui lòng nhập mã lĩnh vực' },
            { max: 30, message: 'Mã lĩnh vực tối đa 30 ký tự' },
          ]}
          fieldProps={{ style: { textTransform: 'uppercase' } }}
          colProps={{ span: 24 }}
        />
        <ProFormText
          name="name"
          label="Tên lĩnh vực"
          placeholder="Nhập tên lĩnh vực"
          rules={[
            { required: true, message: 'Vui lòng nhập tên lĩnh vực' },
            { max: 200, message: 'Tên lĩnh vực tối đa 200 ký tự' },
          ]}
          colProps={{ span: 24 }}
        />
        <ProFormDigit
          name="display_order"
          label="Thứ tự hiển thị"
          placeholder="Số nhỏ hiển thị trước"
          min={0}
          max={9999}
          fieldProps={{ precision: 0 }}
          colProps={{ span: 12 }}
        />
        <ProFormSelect
          name="status"
          label="Trạng thái"
          placeholder="Chọn trạng thái"
          options={FIELD_STATUS_OPTIONS}
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          colProps={{ span: 12 }}
        />
      </ModalForm>
    </>
  );
};

export default Fields;
