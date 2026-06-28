/**
 * Specializations - Quản lý chuyên ngành
 * Tab trong trang "Danh mục hệ thống". Pattern giống quản lý Lĩnh vực.
 */
import { ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit } from '@ant-design/pro-components';
import type { ProColumns, ActionType, ProFormInstance } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  querySpecializations,
  createSpecialization,
  updateSpecialization,
  updateSpecializationStatus,
  SPECIALIZATION_STATUS_MAP,
  SPECIALIZATION_STATUS_OPTIONS,
  type Specialization,
  type SpecializationStatus,
} from '@/services/api/specializations';

const Specializations: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Specialization | null>(null);

  const handleCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record: Specialization) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  // Xử lý submit form (tạo/sửa)
  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        const result = await updateSpecialization(editingRecord.id, values);
        if (result?.success !== false && (result?.data || result)) {
          message.success('Cập nhật chuyên ngành thành công');
          setModalVisible(false);
          setEditingRecord(null);
          actionRef.current?.reload();
          return true;
        }
        message.error(result?.message || 'Cập nhật thất bại');
        return false;
      }
      const result = await createSpecialization(values);
      if (result?.success !== false && (result?.data || result)) {
        message.success('Tạo chuyên ngành thành công');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      }
      message.error(result?.message || 'Tạo chuyên ngành thất bại');
      return false;
    } catch (error: any) {
      message.error(error?.message || 'Có lỗi xảy ra');
      return false;
    }
  };

  // Đổi trạng thái ACTIVE/INACTIVE
  const handleToggleStatus = async (record: Specialization) => {
    const newStatus: SpecializationStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updateSpecializationStatus(record.id, { status: newStatus });
      if (result.success) {
        message.success(`Đã chuyển trạng thái sang "${SPECIALIZATION_STATUS_MAP[newStatus].text}"`);
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

  const columns: ProColumns<Specialization>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 160,
      copyable: true,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: 'Tên chuyên ngành',
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
      valueEnum: Object.entries(SPECIALIZATION_STATUS_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text, status: val.status as any };
        return acc;
      }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        const statusConfig = SPECIALIZATION_STATUS_MAP[record.status];
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
          {access.canEditSpecialization && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          )}
          {access.canEditSpecialization && (
            <Popconfirm
              title="Đổi trạng thái"
              description={
                record.status === 'ACTIVE'
                  ? 'Bạn có chắc muốn ngừng hoạt động chuyên ngành này?'
                  : 'Bạn có chắc muốn kích hoạt lại chuyên ngành này?'
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
      <ProTable<Specialization>
        headerTitle="Danh sách chuyên ngành"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateSpecialization
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Thêm chuyên ngành
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

          const result = await querySpecializations({
            page: current,
            perPage: pageSize,
            keyword,
            status: status as SpecializationStatus,
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
            `Đang xem ${range[0]}-${range[1]} trên tổng ${total} chuyên ngành`,
        }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
      />

      {/* Modal tạo/sửa chuyên ngành */}
      <ModalForm
        key={editingRecord ? `edit-${editingRecord.id}` : 'create'}
        title={editingRecord ? `Chỉnh sửa chuyên ngành: ${editingRecord.code}` : 'Thêm chuyên ngành mới'}
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
          label="Mã chuyên ngành"
          placeholder="VD: CONG_NGHE_THONG_TIN"
          rules={[
            { required: true, message: 'Vui lòng nhập mã chuyên ngành' },
            { max: 80, message: 'Mã chuyên ngành tối đa 80 ký tự' },
          ]}
          fieldProps={{ style: { textTransform: 'uppercase' } }}
          colProps={{ span: 24 }}
        />
        <ProFormText
          name="name"
          label="Tên chuyên ngành"
          placeholder="Nhập tên chuyên ngành"
          rules={[
            { required: true, message: 'Vui lòng nhập tên chuyên ngành' },
            { max: 255, message: 'Tên chuyên ngành tối đa 255 ký tự' },
          ]}
          colProps={{ span: 24 }}
        />
        <ProFormDigit
          name="display_order"
          label="Thứ tự hiển thị"
          placeholder="Số nhỏ hiển thị trước"
          min={0}
          max={99999}
          fieldProps={{ precision: 0 }}
          colProps={{ span: 12 }}
        />
        <ProFormSelect
          name="status"
          label="Trạng thái"
          placeholder="Chọn trạng thái"
          options={SPECIALIZATION_STATUS_OPTIONS}
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          colProps={{ span: 12 }}
        />
      </ModalForm>
    </>
  );
};

export default Specializations;
