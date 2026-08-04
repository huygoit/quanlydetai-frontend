/**
 * Quản lý Quyền (Permissions)
 * - Sửa tên hiển thị của từng quyền
 * - Sửa tên hiển thị của module (nhãn nhóm), lưu DB — không đổi mã code logic
 */
import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Badge, Button, Form, Input, Modal, Tag, Typography, message } from 'antd';
import { EditOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
import {
  queryPermissions,
  updatePermission,
  loadEffectiveModuleLabelMap,
  updateModuleLabel,
  PERMISSION_STATUS_MAP,
  PERMISSION_MODULE_MAP,
  type PermissionItem,
  type PermissionStatus,
} from '@/services/api/permissions';

const { Text } = Typography;

const MODULE_COLOR: Record<string, string> = {
  department: 'blue',
  user: 'cyan',
  role: 'purple',
  permission: 'magenta',
  project: 'green',
  cfp: 'cyan',
  project_process_type: 'purple',
  idea: 'gold',
  council: 'orange',
  publication: 'geekblue',
  report: 'volcano',
  finance: 'lime',
  profile: 'default',
  personal_profile: 'green',
  notification: 'pink',
  system: 'red',
};

const PermissionsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const access = useAccess();

  // Nhãn module hiệu lực (mặc định + ghi đè DB)
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({
    ...PERMISSION_MODULE_MAP,
  });

  const [editingPerm, setEditingPerm] = useState<PermissionItem | null>(null);
  const [permForm] = Form.useForm();
  const [savingPerm, setSavingPerm] = useState(false);

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleForm] = Form.useForm();
  const [savingModules, setSavingModules] = useState(false);

  const taiNhanModule = async () => {
    setModuleLabels(await loadEffectiveModuleLabelMap());
  };

  useEffect(() => {
    taiNhanModule();
  }, []);

  const getModuleName = (module: string) => moduleLabels[module] || module;
  const getModuleColor = (module: string) => MODULE_COLOR[module] || 'default';

  const moduleOptions = Object.entries(moduleLabels).map(([value, label]) => ({ value, label }));

  // --- Sửa tên quyền (kèm tên module nếu là Super Admin) ---
  const moPermEdit = (record: PermissionItem) => {
    setEditingPerm(record);
    permForm.setFieldsValue({
      name: record.name,
      description: record.description,
      moduleName: getModuleName(record.module),
    });
  };

  const luuPermEdit = async () => {
    if (!editingPerm) return;
    const values = await permForm.validateFields();
    setSavingPerm(true);
    try {
      await updatePermission(editingPerm.id, {
        name: values.name?.trim(),
        description: values.description?.trim() || undefined,
      });

      // Super Admin: nếu đổi tên module thì cập nhật nhãn (ảnh hưởng mọi quyền cùng module).
      const tenModuleMoi = (values.moduleName ?? '').trim();
      if (
        access.isSuperAdmin &&
        tenModuleMoi &&
        tenModuleMoi !== getModuleName(editingPerm.module)
      ) {
        await updateModuleLabel(editingPerm.module, tenModuleMoi);
        await taiNhanModule();
      }

      message.success('Đã cập nhật');
      setEditingPerm(null);
      actionRef.current?.reload();
    } catch {
      message.error('Không thể cập nhật');
    } finally {
      setSavingPerm(false);
    }
  };

  // --- Sửa tên module ---
  const moModuleEdit = () => {
    const initial: Record<string, string> = {};
    Object.entries(moduleLabels).forEach(([code, name]) => {
      initial[code] = name;
    });
    moduleForm.setFieldsValue(initial);
    setModuleModalOpen(true);
  };

  const luuModuleEdit = async () => {
    const values = (await moduleForm.validateFields()) as Record<string, string>;
    setSavingModules(true);
    try {
      // Chỉ gọi update cho module có tên thay đổi.
      const changes = Object.entries(values).filter(
        ([code, name]) => (name ?? '').trim() && name.trim() !== moduleLabels[code],
      );
      for (const [code, name] of changes) {
        await updateModuleLabel(code, name.trim());
      }
      message.success(changes.length ? `Đã cập nhật ${changes.length} nhãn module` : 'Không có thay đổi');
      setModuleModalOpen(false);
      await taiNhanModule();
      actionRef.current?.reload();
    } catch {
      message.error('Không thể cập nhật nhãn module');
    } finally {
      setSavingModules(false);
    }
  };

  const columns: ProColumns<PermissionItem>[] = [
    { title: 'STT', dataIndex: 'index', valueType: 'indexBorder', width: 60, align: 'center' },
    {
      title: 'Mã quyền',
      dataIndex: 'code',
      width: 200,
      copyable: true,
      fieldProps: { placeholder: 'Tìm theo mã' },
      render: (_, record) => (
        <Text code style={{ fontSize: 12 }}>
          {record.code}
        </Text>
      ),
    },
    {
      title: 'Tên quyền',
      dataIndex: 'name',
      width: 260,
      ellipsis: true,
      fieldProps: { placeholder: 'Tìm theo tên' },
    },
    {
      title: 'Module',
      dataIndex: 'module',
      width: 160,
      valueType: 'select',
      fieldProps: { options: moduleOptions, placeholder: 'Chọn module' },
      render: (_, record) => (
        <Tag color={getModuleColor(record.module)}>{getModuleName(record.module)}</Tag>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.action || <Text type="secondary">-</Text>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      width: 260,
      ellipsis: true,
      hideInSearch: true,
      render: (_, record) => record.description || <Text type="secondary">-</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      width: 130,
      valueType: 'select',
      valueEnum: Object.entries(PERMISSION_STATUS_MAP).reduce((acc, [key, val]) => {
        acc[key] = { text: val.text, status: val.status as any };
        return acc;
      }, {} as Record<string, { text: string; status: string }>),
      render: (_, record) => {
        if (!record.status) return <Text type="secondary">-</Text>;
        const statusConfig = PERMISSION_STATUS_MAP[record.status];
        return <Badge status={statusConfig.status as any} text={statusConfig.text} />;
      },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => moPermEdit(record)}>
          Sửa
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<PermissionItem>
        headerTitle="Danh sách quyền"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        toolBarRender={() =>
          access.isSuperAdmin
            ? [
                <Button key="module" icon={<AppstoreOutlined />} onClick={moModuleEdit}>
                  Sửa tên module
                </Button>,
              ]
            : []
        }
        request={async (params, sort) => {
          const { current, pageSize, code, name, module, status } = params;

          let sortBy: string | undefined;
          let order: 'asc' | 'desc' | undefined;
          if (sort) {
            const sortKey = Object.keys(sort)[0];
            if (sortKey) {
              sortBy = sortKey;
              order = sort[sortKey] === 'ascend' ? 'asc' : 'desc';
            }
          }

          const result = await queryPermissions({
            page: current,
            perPage: pageSize,
            code,
            name,
            module,
            status: status as PermissionStatus,
            sortBy,
            order,
          });

          return { data: result.data, total: result.meta?.total || 0, success: true };
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: true,
          span: { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 4 },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} quyền`,
        }}
        scroll={{ x: 1280 }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
      />

      {/* Modal sửa tên quyền */}
      <Modal
        title="Sửa tên quyền"
        open={!!editingPerm}
        onCancel={() => setEditingPerm(null)}
        onOk={luuPermEdit}
        confirmLoading={savingPerm}
        destroyOnClose
      >
        <Form form={permForm} layout="vertical" preserve={false}>
          <Form.Item label="Mã quyền">
            <Text code>{editingPerm?.code}</Text>
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên hiển thị quyền"
            rules={[{ required: true, message: 'Vui lòng nhập tên quyền' }]}
          >
            <Input placeholder="VD: Xem kết quả nghiên cứu khoa học" maxLength={255} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn (tùy chọn)" />
          </Form.Item>
          <Form.Item
            name="moduleName"
            label={
              <span>
                Tên module <Text code>{editingPerm?.module}</Text>
              </span>
            }
            extra={
              access.isSuperAdmin
                ? 'Đổi tên module sẽ áp dụng cho TẤT CẢ quyền cùng nhóm này.'
                : 'Chỉ Super Admin được sửa tên module.'
            }
          >
            <Input maxLength={80} disabled={!access.isSuperAdmin} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal sửa tên module */}
      <Modal
        title="Sửa tên hiển thị module"
        open={moduleModalOpen}
        onCancel={() => setModuleModalOpen(false)}
        onOk={luuModuleEdit}
        confirmLoading={savingModules}
        width={560}
        destroyOnClose
      >
        <Text type="secondary">
          Chỉ đổi tên hiển thị (nhóm), không ảnh hưởng tới mã quyền và phân quyền.
        </Text>
        <Form form={moduleForm} layout="vertical" preserve={false} style={{ marginTop: 16 }}>
          {Object.keys(moduleLabels).map((code) => (
            <Form.Item key={code} name={code} label={<Text code>{code}</Text>} style={{ marginBottom: 12 }}>
              <Input maxLength={80} />
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default PermissionsPage;
