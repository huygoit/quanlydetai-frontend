/**
 * Quản lý danh mục chức vụ nhân sự (2 loại: Chức vụ | Chức vụ Đảng).
 * Tab trong trang "Danh mục hệ thống".
 */
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
} from '@ant-design/pro-components';
import type { ProColumns, ActionType, ProFormInstance } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space, Tag } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  queryStaffPositions,
  createStaffPosition,
  updateStaffPosition,
  updateStaffPositionStatus,
  STAFF_POSITION_KIND_MAP,
  STAFF_POSITION_KIND_OPTIONS,
  STAFF_POSITION_STATUS_MAP,
  STAFF_POSITION_STATUS_OPTIONS,
  type StaffPosition,
  type StaffPositionKind,
  type StaffPositionStatus,
} from '@/services/api/staffPositions';

const StaffPositions: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StaffPosition | null>(null);

  const handleCreate = () => {
    setEditingRecord(null);
    setModalVisible(true);
  };

  const handleEdit = (record: StaffPosition) => {
    setEditingRecord(record);
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        kind: values.kind as StaffPositionKind,
        code: String(values.code || '').trim().toUpperCase(),
        name: String(values.name || '').trim(),
        display_order: values.display_order,
        displayOrder: values.display_order,
        status: values.status as StaffPositionStatus,
      };

      if (editingRecord) {
        const result = await updateStaffPosition(editingRecord.id, payload);
        if (result?.success !== false && (result?.data || result)) {
          message.success('Cập nhật chức vụ thành công');
          setModalVisible(false);
          setEditingRecord(null);
          actionRef.current?.reload();
          return true;
        }
        message.error(result?.message || 'Cập nhật thất bại');
        return false;
      }

      const result = await createStaffPosition(payload);
      if (result?.success !== false && (result?.data || result)) {
        message.success('Tạo chức vụ thành công');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      }
      message.error(result?.message || 'Tạo chức vụ thất bại');
      return false;
    } catch (error: any) {
      message.error(error?.message || 'Có lỗi xảy ra');
      return false;
    }
  };

  const handleToggleStatus = async (record: StaffPosition) => {
    const newStatus: StaffPositionStatus = record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updateStaffPositionStatus(record.id, { status: newStatus });
      if (result.success) {
        message.success(`Đã chuyển trạng thái sang "${STAFF_POSITION_STATUS_MAP[newStatus].text}"`);
        actionRef.current?.reload();
      }
    } catch {
      message.error('Không thể đổi trạng thái');
    }
  };

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    return dayjs(dateStr).format('DD/MM/YYYY HH:mm');
  };

  const columns: ProColumns<StaffPosition>[] = [
    {
      title: 'Loại chức vụ',
      dataIndex: 'kind',
      width: 220,
      valueType: 'select',
      valueEnum: Object.entries(STAFF_POSITION_KIND_MAP).reduce(
        (acc, [key, val]) => {
          acc[key] = { text: val.text };
          return acc;
        },
        {} as Record<string, { text: string }>,
      ),
      render: (_, record) => {
        const cfg = STAFF_POSITION_KIND_MAP[record.kind];
        return <Tag color={cfg?.color}>{cfg?.text || record.kind}</Tag>;
      },
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 160,
      copyable: true,
      ellipsis: true,
      hideInSearch: true,
    },
    {
      title: 'Tên chức vụ',
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
      valueEnum: Object.entries(STAFF_POSITION_STATUS_MAP).reduce(
        (acc, [key, val]) => {
          acc[key] = { text: val.text, status: val.status as any };
          return acc;
        },
        {} as Record<string, { text: string; status: string }>,
      ),
      render: (_, record) => {
        const statusConfig = STAFF_POSITION_STATUS_MAP[record.status];
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
          {access.canEditStaffPosition && (
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              Sửa
            </Button>
          )}
          {access.canEditStaffPosition && (
            <Popconfirm
              title="Đổi trạng thái"
              description={
                record.status === 'ACTIVE'
                  ? 'Bạn có chắc muốn ngừng hoạt động chức vụ này?'
                  : 'Bạn có chắc muốn kích hoạt lại chức vụ này?'
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
      <ProTable<StaffPosition>
        headerTitle="Danh sách chức vụ"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateStaffPosition
            ? [
                <Button key="create" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Thêm chức vụ
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          const { current, pageSize, keyword, status, kind } = params;

          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }

          const result = await queryStaffPositions({
            page: current,
            perPage: pageSize,
            keyword,
            kind: kind as StaffPositionKind | undefined,
            status: status as StaffPositionStatus | undefined,
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
          defaultCollapsed: false,
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 4 },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (total, range) =>
            `Đang xem ${range[0]}-${range[1]} trên tổng ${total} chức vụ`,
        }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
      />

      <ModalForm
        key={editingRecord ? `edit-${editingRecord.id}` : 'create'}
        title={editingRecord ? `Chỉnh sửa chức vụ: ${editingRecord.code}` : 'Thêm chức vụ mới'}
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
                kind: editingRecord.kind,
                code: editingRecord.code,
                name: editingRecord.name,
                display_order: editingRecord.display_order,
                status: editingRecord.status,
              }
            : { status: 'ACTIVE', display_order: 0, kind: 'POSITION' }
        }
        onFinish={handleSubmit}
        modalProps={{ destroyOnClose: true, maskClosable: false }}
        submitter={{ searchConfig: { submitText: 'Đồng ý', resetText: 'Hủy' } }}
        grid
        rowProps={{ gutter: 16 }}
        width={560}
      >
        <ProFormSelect
          name="kind"
          label="Loại chức vụ"
          options={STAFF_POSITION_KIND_OPTIONS}
          rules={[{ required: true, message: 'Vui lòng chọn loại chức vụ' }]}
          colProps={{ span: 24 }}
        />
        <ProFormText
          name="code"
          label="Mã chức vụ"
          placeholder="VD: POS_GIANG_VIEN"
          rules={[
            { required: true, message: 'Vui lòng nhập mã chức vụ' },
            { max: 80, message: 'Mã chức vụ tối đa 80 ký tự' },
          ]}
          fieldProps={{ style: { textTransform: 'uppercase' } }}
          colProps={{ span: 24 }}
        />
        <ProFormText
          name="name"
          label="Tên chức vụ"
          placeholder="Nhập tên chức vụ"
          rules={[
            { required: true, message: 'Vui lòng nhập tên chức vụ' },
            { max: 255, message: 'Tên chức vụ tối đa 255 ký tự' },
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
          options={STAFF_POSITION_STATUS_OPTIONS}
          rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
          colProps={{ span: 12 }}
        />
      </ModalForm>
    </>
  );
};

export default StaffPositions;
