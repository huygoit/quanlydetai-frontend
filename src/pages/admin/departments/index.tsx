/**
 * Quản lý đơn vị (Departments)
 * Trang quản trị danh sách các đơn vị trong hệ thống
 */
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, ProFormDigit, ProFormTextArea } from '@ant-design/pro-components';
import type { ProColumns, ActionType, ProFormInstance } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import {
  queryDepartments,
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  DEPARTMENT_TYPE_MAP,
  DEPARTMENT_STATUS_MAP,
  DEPARTMENT_TYPE_OPTIONS,
  DEPARTMENT_STATUS_OPTIONS,
  type Department,
  type DepartmentType,
  type DepartmentStatus,
} from '@/services/api/departments';
import dayjs from 'dayjs';

const { Text } = Typography;

const DepartmentsPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Department | null>(null);

  // Mở modal tạo mới
  const handleCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (record: Department) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  // Xử lý submit form (tạo/sửa)
  const handleSubmit = async (values: any) => {
    try {
      if (editingRecord) {
        // Cập nhật
        const result = await updateDepartment(editingRecord.id, values);
        // Check success từ response hoặc nếu có data thì coi là thành công
        if (result?.success !== false && (result?.data || result)) {
          message.success('Cập nhật đơn vị thành công');
          setModalVisible(false);
          setEditingRecord(null);
          actionRef.current?.reload();
          return true;
        } else {
          message.error(result?.message || 'Cập nhật thất bại');
          return false;
        }
      } else {
        // Tạo mới
        const result = await createDepartment(values);
        // Check success từ response hoặc nếu có data thì coi là thành công
        if (result?.success !== false && (result?.data || result)) {
          message.success('Tạo đơn vị thành công');
          setModalVisible(false);
          actionRef.current?.reload();
          return true;
        } else {
          message.error(result?.message || 'Tạo đơn vị thất bại');
          return false;
        }
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      message.error(error?.message || 'Có lỗi xảy ra');
      return false;
    }
  };

  // Đổi trạng thái
  const handleToggleStatus = async (record: Department) => {
    const newStatus: DepartmentStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updateDepartmentStatus(record.id, { status: newStatus });
      if (result.success) {
        message.success(`Đã chuyển trạng thái sang "${DEPARTMENT_STATUS_MAP[newStatus].text}"`);
        actionRef.current?.reload();
      }
    } catch (error) {
      message.error('Không thể đổi trạng thái');
    }
  };

  // Format datetime
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  };

  // Columns definition
  const columns: ProColumns<Department>[] = [
    {
      title: 'Mã đơn vị',
      dataIndex: 'code',
      width: 120,
      copyable: true,
      fieldProps: {
        placeholder: 'Tìm theo mã',
      },
    },
    {
      title: 'Tên đơn vị',
      dataIndex: 'name',
      ellipsis: true,
      width: 250,
      fieldProps: {
        placeholder: 'Tìm theo tên',
      },
      formItemProps: {
        name: 'keyword',
      },
      hideInSearch: true,
    },
    {
      title: 'Từ khóa',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: 'Tìm theo mã hoặc tên',
      },
    },
    {
      title: 'Tên viết tắt',
      dataIndex: 'short_name',
      width: 140,
      hideInSearch: true,
      hideInTable: true,
      render: (_, record) => record.short_name || <Text type="secondary">-</Text>,
    },
    {
      title: 'Loại đơn vị',
      dataIndex: 'type',
      width: 130,
      valueType: 'select',
      valueEnum: Object.entries(DEPARTMENT_TYPE_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text };
        return acc;
      }, {} as Record<string, { text: string }>),
      render: (_, record) => {
        const typeConfig = DEPARTMENT_TYPE_MAP[record.type];
        return <Tag color={typeConfig.color}>{typeConfig.text}</Tag>;
      },
    },
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      width: 90,
      align: 'center',
      hideInSearch: true,
      hideInTable: true,
      sorter: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 150,
      valueType: 'select',
      valueEnum: Object.entries(DEPARTMENT_STATUS_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text, status: val.status as any };
        return acc;
      }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        const statusConfig = DEPARTMENT_STATUS_MAP[record.status];
        return <Badge status={statusConfig.status as any} text={statusConfig.text} />;
      },
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      width: 180,
      ellipsis: true,
      hideInSearch: true,
      hideInTable: true,
      render: (_, record) => record.note || <Text type="secondary">-</Text>,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      width: 150,
      hideInSearch: true,
      sorter: true,
      render: (_, record) => formatDateTime(record.created_at),
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
          {access.canEditDepartment && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          )}
          {access.canEditDepartment && (
          <Popconfirm
            title={`Đổi trạng thái`}
            description={
              record.status === 'ACTIVE'
                ? 'Bạn có chắc muốn ngừng hoạt động đơn vị này?'
                : 'Bạn có chắc muốn kích hoạt lại đơn vị này?'
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
    <PageContainer>
      <ProTable<Department>
        headerTitle="Danh sách đơn vị"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateDepartment
            ? [
                <Button
                  key="create"
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  Thêm đơn vị
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          const { current, pageSize, keyword, type, status, code } = params;
          
          // Xác định sort
          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }
          
          const result = await queryDepartments({
            page: current,
            perPage: pageSize,
            keyword: keyword || code,
            type: type as DepartmentType,
            status: status as DepartmentStatus,
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
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `Đang xem ${range[0]}-${range[1]} trên tổng ${total} đơn vị`,
        }}
        scroll={{ x: 1500 }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
      />

      {/* Modal tạo/sửa đơn vị */}
      <ModalForm
        key={editingRecord ? `edit-${editingRecord.id}` : 'create'}
        title={editingRecord ? `Chỉnh sửa đơn vị: ${editingRecord.code}` : 'Thêm đơn vị mới'}
        open={modalVisible}
        onOpenChange={(visible) => {
          setModalVisible(visible);
          if (!visible) {
            setEditingRecord(null);
            formRef.current?.resetFields();
          }
        }}
        formRef={formRef}
        initialValues={editingRecord ? {
          code: editingRecord.code,
          name: editingRecord.name,
          short_name: editingRecord.short_name,
          type: editingRecord.type,
          display_order: editingRecord.display_order,
          status: editingRecord.status,
          note: editingRecord.note,
        } : {
          status: 'ACTIVE',
          display_order: 0,
        }}
        onFinish={handleSubmit}
        modalProps={{
          destroyOnClose: true,
          maskClosable: false,
        }}
        submitter={{
          searchConfig: {
            submitText: 'Đồng ý',
            resetText: 'Hủy',
          },
        }}
        grid
        rowProps={{ gutter: 16 }}
        width={550}
      >
        <ProFormText
          name="code"
          label="Mã đơn vị"
          placeholder="Nhập mã đơn vị (VD: PKH, KCN)"
          rules={[
            { required: true, message: 'Vui lòng nhập mã đơn vị' },
            { max: 20, message: 'Mã đơn vị tối đa 20 ký tự' },
          ]}
          fieldProps={{
            style: { textTransform: 'uppercase' },
          }}
          colProps={{ span: 24 }}
        />
        <ProFormText
          name="name"
          label="Tên đơn vị"
          placeholder="Nhập tên đầy đủ của đơn vị"
          rules={[
            { required: true, message: 'Vui lòng nhập tên đơn vị' },
            { max: 200, message: 'Tên đơn vị tối đa 200 ký tự' },
          ]}
          colProps={{ span: 24 }}
        />
        <ProFormSelect
          name="type"
          label="Loại đơn vị"
          placeholder="Chọn loại đơn vị"
          options={DEPARTMENT_TYPE_OPTIONS}
          rules={[{ required: true, message: 'Vui lòng chọn loại đơn vị' }]}
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
          options={DEPARTMENT_STATUS_OPTIONS}
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          colProps={{ span: 12 }}
        />
        {/* Tạm ẩn các field này */}
        <ProFormText name="short_name" hidden />
        <ProFormTextArea name="note" hidden />
      </ModalForm>
    </PageContainer>
  );
};

export default DepartmentsPage;
