/**
 * Quản lý danh mục Loại quy trình đề tài (QT-I … QT-V)
 */
import {
  ProTable,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormDigit,
} from '@ant-design/pro-components';
import type { ProColumns, ActionType, ProFormInstance } from '@ant-design/pro-components';
import { Badge, Button, message, Popconfirm, Space } from 'antd';
import { PlusOutlined, EditOutlined, SwapOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  queryProjectProcessTypes,
  createProjectProcessType,
  updateProjectProcessType,
  updateProjectProcessTypeStatus,
  PROJECT_PROCESS_TYPE_STATUS_MAP,
  PROJECT_PROCESS_TYPE_STATUS_OPTIONS,
  type ProjectProcessType,
  type ProjectProcessTypeStatus,
} from '@/services/api/projectProcessTypes';

const ProjectProcessTypes: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProjectProcessType | null>(null);

  const handleSubmit = async (values: Record<string, unknown>) => {
    const payload = {
      code: String(values.code || '').trim().toUpperCase(),
      name: String(values.name || '').trim(),
      description: values.description ? String(values.description).trim() : null,
      displayOrder: Number(values.display_order ?? 0),
      status: values.status as ProjectProcessTypeStatus,
    };
    try {
      if (editingRecord) {
        const result = await updateProjectProcessType(editingRecord.id, payload);
        if (result?.success !== false && (result?.data || result)) {
          message.success('Cập nhật thành công');
          setModalVisible(false);
          setEditingRecord(null);
          actionRef.current?.reload();
          return true;
        }
        message.error(result?.message || 'Cập nhật thất bại');
        return false;
      }
      const result = await createProjectProcessType(payload);
      if (result?.success !== false && (result?.data || result)) {
        message.success('Tạo thành công');
        setModalVisible(false);
        actionRef.current?.reload();
        return true;
      }
      message.error(result?.message || 'Tạo thất bại');
      return false;
    } catch (error: any) {
      message.error(error?.data?.message || error?.message || 'Có lỗi xảy ra');
      return false;
    }
  };

  const handleToggleStatus = async (record: ProjectProcessType) => {
    const newStatus: ProjectProcessTypeStatus =
      record.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const result = await updateProjectProcessTypeStatus(record.id, { status: newStatus });
      if (result.success) {
        message.success(
          `Đã chuyển sang "${PROJECT_PROCESS_TYPE_STATUS_MAP[newStatus].text}"`,
        );
        actionRef.current?.reload();
      }
    } catch {
      message.error('Không thể đổi trạng thái');
    }
  };

  const columns: ProColumns<ProjectProcessType>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 100,
      copyable: true,
      sorter: true,
    },
    {
      title: 'Tên loại quy trình',
      dataIndex: 'name',
      ellipsis: true,
      sorter: true,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      ellipsis: true,
      hideInSearch: true,
      render: (_, r) => r.description || '—',
    },
    {
      title: 'Thứ tự',
      dataIndex: 'display_order',
      width: 90,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      fieldProps: { options: PROJECT_PROCESS_TYPE_STATUS_OPTIONS },
      render: (_, record) => {
        const cfg = PROJECT_PROCESS_TYPE_STATUS_MAP[record.status];
        return <Badge status={cfg?.status as any} text={cfg?.text || record.status} />;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updated_at',
      width: 160,
      hideInSearch: true,
      render: (_, r) => (r.updated_at ? dayjs(r.updated_at).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Từ khóa',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: 'Mã / tên / mô tả' },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 180,
      render: (_, record) => (
        <Space>
          {access.canEditProjectProcessType && (
            <a
              onClick={() => {
                setEditingRecord(record);
                setModalVisible(true);
              }}
            >
              <EditOutlined /> Sửa
            </a>
          )}
          {access.canEditProjectProcessType && (
            <Popconfirm
              title={`Chuyển sang ${
                record.status === 'ACTIVE' ? 'ngừng hoạt động' : 'đang hoạt động'
              }?`}
              onConfirm={() => void handleToggleStatus(record)}
            >
              <a>
                <SwapOutlined /> Đổi TT
              </a>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<ProjectProcessType>
        headerTitle="Loại quy trình đề tài"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.canCreateProjectProcessType
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
                  Thêm loại quy trình
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }
          const result = await queryProjectProcessTypes({
            page: params.current,
            perPage: params.pageSize,
            keyword: params.keyword,
            status: params.status as ProjectProcessTypeStatus,
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
          showTotal: (total, range) =>
            `Đang xem ${range[0]}-${range[1]} trên tổng ${total} loại quy trình`,
        }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
      />

      <ModalForm
        key={editingRecord ? `edit-${editingRecord.id}` : 'create'}
        title={
          editingRecord
            ? `Sửa loại quy trình: ${editingRecord.code}`
            : 'Thêm loại quy trình đề tài'
        }
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
                description: editingRecord.description,
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
        width={640}
      >
        <ProFormText
          name="code"
          label="Mã"
          placeholder="VD: QT-I, QT-II"
          rules={[
            { required: true, message: 'Bắt buộc' },
            { max: 30, message: 'Tối đa 30 ký tự' },
          ]}
          fieldProps={{ style: { textTransform: 'uppercase' } }}
          colProps={{ span: 24 }}
          disabled={!!editingRecord}
          extra={editingRecord ? 'Không đổi mã sau khi tạo' : undefined}
        />
        <ProFormText
          name="name"
          label="Tên loại quy trình"
          placeholder="VD: Đề tài cấp Trường"
          rules={[
            { required: true, message: 'Bắt buộc' },
            { max: 255, message: 'Tối đa 255 ký tự' },
          ]}
          colProps={{ span: 24 }}
        />
        <ProFormTextArea
          name="description"
          label="Mô tả"
          placeholder="Không bắt buộc"
          fieldProps={{ rows: 3, maxLength: 2000, showCount: true }}
          colProps={{ span: 24 }}
        />
        <ProFormDigit
          name="display_order"
          label="Thứ tự hiển thị"
          min={0}
          max={9999}
          fieldProps={{ precision: 0 }}
          colProps={{ span: 12 }}
        />
        <ProFormSelect
          name="status"
          label="Trạng thái"
          options={PROJECT_PROCESS_TYPE_STATUS_OPTIONS}
          rules={[{ required: true }]}
          colProps={{ span: 12 }}
        />
      </ModalForm>
    </>
  );
};

export default ProjectProcessTypes;
