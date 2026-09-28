/**
 * Admin — quản lý mẫu DOCX theo loại (hợp đồng, biên bản thanh lý, …)
 */
import {
  PageContainer,
  ProTable,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormSwitch,
  ProFormSelect,
} from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import {
  Alert,
  Badge,
  Button,
  Collapse,
  Descriptions,
  Modal,
  Popconfirm,
  Space,
  Tabs,
  Tag,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import {
  PlusOutlined,
  EditOutlined,
  DownloadOutlined,
  StarOutlined,
  DeleteOutlined,
  SwapOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import dayjs from 'dayjs';
import {
  queryContractTemplates,
  createContractTemplate,
  updateContractTemplate,
  updateContractTemplateStatus,
  setDefaultContractTemplate,
  deleteContractTemplate,
  downloadContractTemplate,
  getContractTemplateVariableCatalog,
  getContractTemplateTypes,
  CONTRACT_TEMPLATE_STATUS_MAP,
  CONTRACT_TEMPLATE_TYPE_OPTIONS,
  type ContractTemplate,
  type ContractTemplateStatus,
  type ContractTemplateType,
  type Bm06VariableDef,
  type DocTemplateTypeDef,
} from '@/services/api/contractTemplates';

function formatBytes(n?: number | null) {
  if (!n) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const AdminContractTemplatesPage: React.FC = () => {
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<ContractTemplate | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [vars, setVars] = useState<Bm06VariableDef[]>([]);
  const [detail, setDetail] = useState<ContractTemplate | null>(null);
  const [types, setTypes] = useState<DocTemplateTypeDef[]>([]);
  const [activeType, setActiveType] = useState<ContractTemplateType>('HOP_DONG');

  useEffect(() => {
    getContractTemplateTypes()
      .then((res) => {
        const list = res.data || [];
        setTypes(list);
        if (list[0]?.code) setActiveType(list[0].code);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    getContractTemplateVariableCatalog(activeType)
      .then((res) => setVars(res.data || []))
      .catch(() => setVars([]));
  }, [activeType]);

  if (!access.canViewContractTemplates) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền xem mẫu biểu mẫu DOCX." />
      </PageContainer>
    );
  }

  const typeOptions =
    types.length > 0
      ? types.map((t) => ({ value: t.code, label: t.label }))
      : CONTRACT_TEMPLATE_TYPE_OPTIONS;

  const openCreate = () => {
    setEditing(null);
    setFileList([]);
    setModalVisible(true);
  };

  const openEdit = (row: ContractTemplate) => {
    setEditing(row);
    setFileList([]);
    setModalVisible(true);
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const fd = new FormData();
    fd.append('code', String(values.code || '').trim().toUpperCase());
    fd.append('name', String(values.name || '').trim());
    if (values.description) fd.append('description', String(values.description).trim());
    fd.append('templateType', String(values.template_type || activeType));
    if (values.form_code) fd.append('formCode', String(values.form_code).trim().toUpperCase());
    if (values.status) fd.append('status', String(values.status));
    fd.append('isDefault', values.is_default ? 'true' : 'false');

    const raw = fileList[0]?.originFileObj;
    if (!editing && !raw) {
      message.warning('Cần chọn file DOCX.');
      return false;
    }
    if (raw) fd.append('file', raw);

    try {
      if (editing) {
        const res = await updateContractTemplate(editing.id, fd);
        message.success(res.message || 'Đã cập nhật');
      } else {
        const res = await createContractTemplate(fd);
        message.success(res.message || 'Đã tạo mẫu');
      }
      setModalVisible(false);
      setEditing(null);
      setFileList([]);
      actionRef.current?.reload();
      return true;
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Thất bại');
      return false;
    }
  };

  const columns: ProColumns<ContractTemplate>[] = [
    {
      title: 'Mã',
      dataIndex: 'code',
      width: 140,
      copyable: true,
    },
    {
      title: 'Tên mẫu',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: 'Mã BM',
      dataIndex: 'form_code',
      width: 90,
      hideInSearch: true,
      render: (_, r) => r.form_code || '—',
    },
    {
      title: 'File',
      dataIndex: 'file_name',
      hideInSearch: true,
      width: 180,
      ellipsis: true,
      render: (_, r) => (
        <span>
          {r.file_name} <Tag>{formatBytes(r.file_size)}</Tag>
        </span>
      ),
    },
    {
      title: 'Biến',
      width: 70,
      hideInSearch: true,
      render: (_, r) => r.detected_variables?.length ?? 0,
    },
    {
      title: 'Mặc định',
      dataIndex: 'is_default',
      width: 100,
      hideInSearch: true,
      render: (_, r) =>
        r.is_default ? <Badge status="processing" text="Đang dùng" /> : '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 110,
      valueType: 'select',
      valueEnum: {
        ACTIVE: { text: 'Đang dùng' },
        INACTIVE: { text: 'Ngừng' },
      },
      render: (_, r) => {
        const m = CONTRACT_TEMPLATE_STATUS_MAP[r.status];
        return <Tag color={m.color}>{m.text}</Tag>;
      },
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updated_at',
      width: 140,
      hideInSearch: true,
      render: (_, r) =>
        r.updated_at ? dayjs(r.updated_at).format('DD/MM/YYYY HH:mm') : '—',
    },
    {
      title: '',
      width: 280,
      hideInSearch: true,
      render: (_, r) => (
        <Space wrap size="small">
          <Button type="link" size="small" onClick={() => setDetail(r)}>
            Biến
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadContractTemplate(r.id, r.file_name).catch((e) =>
                message.error(e?.message || 'Tải thất bại'),
              )
            }
          >
            Tải
          </Button>
          {access.canEditContractTemplate && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>
              Sửa
            </Button>
          )}
          {access.canEditContractTemplate && !r.is_default && r.status === 'ACTIVE' && (
            <Button
              type="link"
              size="small"
              icon={<StarOutlined />}
              onClick={async () => {
                try {
                  await setDefaultContractTemplate(r.id);
                  message.success('Đã đặt mặc định cho loại này');
                  actionRef.current?.reload();
                } catch (e: any) {
                  message.error(e?.data?.message || e?.message || 'Thất bại');
                }
              }}
            >
              Mặc định
            </Button>
          )}
          {access.canEditContractTemplate && (
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={async () => {
                const next: ContractTemplateStatus =
                  r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                try {
                  await updateContractTemplateStatus(r.id, { status: next });
                  message.success('Đã đổi trạng thái');
                  actionRef.current?.reload();
                } catch (e: any) {
                  message.error(e?.data?.message || e?.message || 'Thất bại');
                }
              }}
            >
              Đổi TT
            </Button>
          )}
          {access.canDeleteContractTemplate && !r.is_default && (
            <Popconfirm
              title="Xóa mẫu này?"
              onConfirm={async () => {
                try {
                  await deleteContractTemplate(r.id);
                  message.success('Đã xóa');
                  actionRef.current?.reload();
                } catch (e: any) {
                  message.error(e?.data?.message || e?.message || 'Thất bại');
                }
              }}
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const groups = Array.from(new Set(vars.map((v) => v.group)));
  const activeTypeLabel =
    typeOptions.find((t) => t.value === activeType)?.label || activeType;

  return (
    <PageContainer title="Mẫu biểu mẫu DOCX">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Mỗi loại có một mẫu mặc định riêng. File DOCX dùng biến {{ten_bien}}."
        description="Loại «Hợp đồng» dùng cho BM.06; «Biên bản thanh lý» dành cho mẫu thanh lý sau nghiệm thu."
      />

      <Tabs
        activeKey={activeType}
        onChange={(k) => {
          setActiveType(k as ContractTemplateType);
          actionRef.current?.reload();
        }}
        items={typeOptions.map((t) => ({
          key: t.value,
          label: t.label,
        }))}
        style={{ marginBottom: 8 }}
      />

      {vars.length > 0 && (
        <Collapse
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'vars',
              label: `Danh mục biến — ${activeTypeLabel} (${vars.length})`,
              children: groups.map((g) => (
                <div key={g} style={{ marginBottom: 12 }}>
                  <strong>{g}</strong>
                  <div style={{ marginTop: 6 }}>
                    {vars
                      .filter((v) => v.group === g)
                      .map((v) => (
                        <Tag key={v.key} style={{ marginBottom: 4 }}>
                          {`{{${v.key}}}`} — {v.label}
                        </Tag>
                      ))}
                  </div>
                </div>
              )),
            },
          ]}
        />
      )}
      {vars.length === 0 && activeType === 'THANH_LY' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Loại thanh lý chưa có danh mục biến chuẩn — upload DOCX trước, hệ thống sẽ quét {{biến}} trong file."
        />
      )}

      <ProTable<ContractTemplate>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        params={{ templateType: activeType }}
        headerTitle={`Danh sách — ${activeTypeLabel}`}
        toolBarRender={() =>
          access.canCreateContractTemplate
            ? [
                <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Thêm mẫu DOCX
                </Button>,
              ]
            : []
        }
        request={async (params) => {
          const res = await queryContractTemplates({
            page: params.current,
            perPage: params.pageSize,
            keyword: params.code || params.name || params.keyword,
            status: params.status as ContractTemplateStatus | undefined,
            templateType: activeType,
          });
          return {
            data: res.data || [],
            success: res.success !== false,
            total: res.meta?.total ?? res.data?.length ?? 0,
          };
        }}
        search={{ labelWidth: 'auto' }}
        pagination={{ pageSize: 10 }}
      />

      <ModalForm
        title={editing ? 'Cập nhật mẫu' : 'Thêm mẫu DOCX'}
        open={modalVisible}
        onOpenChange={setModalVisible}
        initialValues={
          editing
            ? {
                code: editing.code,
                name: editing.name,
                description: editing.description,
                template_type: editing.template_type,
                form_code: editing.form_code,
                status: editing.status,
                is_default: editing.is_default,
              }
            : {
                status: 'ACTIVE',
                is_default: true,
                template_type: activeType,
                form_code: activeType === 'HOP_DONG' ? 'BM06' : '',
                code: activeType === 'HOP_DONG' ? 'BM06_' : 'BBTL_',
              }
        }
        modalProps={{ destroyOnClose: true }}
        onFinish={handleSubmit}
        width={560}
      >
        <ProFormSelect
          name="template_type"
          label="Loại template"
          rules={[{ required: true }]}
          options={typeOptions}
          disabled={!!editing}
        />
        <ProFormText
          name="code"
          label="Mã mẫu"
          rules={[{ required: true }]}
          disabled={!!editing}
          placeholder="BM06_DEFAULT"
        />
        <ProFormText name="name" label="Tên mẫu" rules={[{ required: true }]} />
        <ProFormText
          name="form_code"
          label="Mã biểu mẫu (tùy chọn)"
          placeholder="BM06"
          extra="Ví dụ BM06 cho hợp đồng"
        />
        <ProFormTextArea name="description" label="Mô tả" fieldProps={{ rows: 2 }} />
        <ProFormSelect
          name="status"
          label="Trạng thái"
          options={[
            { value: 'ACTIVE', label: 'Đang dùng' },
            { value: 'INACTIVE', label: 'Ngừng' },
          ]}
        />
        <ProFormSwitch name="is_default" label="Đặt làm mẫu mặc định của loại này" />
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            File DOCX {editing ? '(để trống nếu giữ file cũ)' : '(bắt buộc)'}
          </div>
          <Upload
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            maxCount={1}
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: fl }) => setFileList(fl)}
          >
            <Button icon={<UploadOutlined />}>Chọn file .docx</Button>
          </Upload>
        </div>
      </ModalForm>

      <Modal
        title={detail ? `Biến trong ${detail.code}` : 'Biến'}
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={640}
      >
        {detail && (
          <>
            <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
              <Descriptions.Item label="Loại">
                {detail.template_type_label || detail.template_type}
              </Descriptions.Item>
              <Descriptions.Item label="File">{detail.file_name}</Descriptions.Item>
              <Descriptions.Item label="Số biến phát hiện">
                {detail.detected_variables?.length ?? 0}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 8 }}>
              <strong>Đã phát hiện:</strong>
              <div style={{ marginTop: 6 }}>
                {(detail.detected_variables || []).map((k) => (
                  <Tag key={k} color="blue">{`{{${k}}}`}</Tag>
                ))}
              </div>
            </div>
            {!!detail.unknown_variables?.length && (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 8 }}
                message="Biến ngoài danh mục chuẩn"
                description={detail.unknown_variables.map((k) => `{{${k}}}`).join(', ')}
              />
            )}
            {!!detail.missing_known_variables?.length && (
              <Alert
                type="info"
                showIcon
                message="Biến danh mục chưa có trong file"
                description={detail.missing_known_variables
                  .slice(0, 20)
                  .map((k) => `{{${k}}}`)
                  .join(', ')}
              />
            )}
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default AdminContractTemplatesPage;
