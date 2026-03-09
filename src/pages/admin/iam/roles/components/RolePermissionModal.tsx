/**
 * Modal gán permission cho role
 */
import { Modal, Checkbox, Collapse, Spin, message, Empty, Button, Space } from 'antd';
import { useEffect, useState } from 'react';
import {
  getRolePermissions,
  updateRolePermissions,
  type RoleItem,
} from '@/services/api/roles';
import {
  queryPermissions,
  PERMISSION_MODULE_MAP,
  type PermissionItem,
  type GroupedPermissions,
} from '@/services/api/permissions';

interface RolePermissionModalProps {
  visible: boolean;
  role: RoleItem | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  visible,
  role,
  onCancel,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    if (visible && role) {
      loadData();
    }
  }, [visible, role]);

  // Group permissions by module on frontend
  const groupPermissionsByModule = (permissions: PermissionItem[]): GroupedPermissions => {
    return permissions.reduce((acc, perm) => {
      const module = perm.module || 'other';
      if (!acc[module]) {
        acc[module] = [];
      }
      acc[module].push(perm);
      return acc;
    }, {} as GroupedPermissions);
  };

  const loadData = async () => {
    if (!role) return;
    
    setLoading(true);
    try {
      const [permissionsRes, rolePermissionsRes] = await Promise.all([
        queryPermissions({ perPage: 500, status: 'ACTIVE' }),
        getRolePermissions(role.id),
      ]);

      if (permissionsRes?.data) {
        const grouped = groupPermissionsByModule(permissionsRes.data);
        setGroupedPermissions(grouped);
      }

      if (rolePermissionsRes?.data) {
        setSelectedIds(rolePermissionsRes.data);
      }
    } catch (error) {
      message.error('Không thể tải danh sách quyền');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!role) return;

    setSaving(true);
    try {
      const result = await updateRolePermissions(role.id, {
        permission_ids: selectedIds,
      });
      
      if (result?.data || result) {
        message.success('Cập nhật quyền thành công');
        onSuccess();
      }
    } catch (error: any) {
      message.error(error?.message || 'Không thể cập nhật quyền');
    } finally {
      setSaving(false);
    }
  };

  const handleModuleCheckAll = (module: string, checked: boolean) => {
    const permissions = groupedPermissions[module] || [];
    const moduleIds = permissions.map((p) => p.id);

    if (checked) {
      setSelectedIds((prev) => [...new Set([...prev, ...moduleIds])]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => !moduleIds.includes(id)));
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, permissionId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== permissionId));
    }
  };

  const isModuleAllChecked = (module: string) => {
    const permissions = groupedPermissions[module] || [];
    return permissions.length > 0 && permissions.every((p) => selectedIds.includes(p.id));
  };

  const isModuleIndeterminate = (module: string) => {
    const permissions = groupedPermissions[module] || [];
    const checkedCount = permissions.filter((p) => selectedIds.includes(p.id)).length;
    return checkedCount > 0 && checkedCount < permissions.length;
  };

  const getModuleName = (module: string) => {
    return PERMISSION_MODULE_MAP[module] || module;
  };

  const modules = Object.keys(groupedPermissions);

  const collapseItems = modules.map((module) => ({
    key: module,
    label: (
      <Checkbox
        checked={isModuleAllChecked(module)}
        indeterminate={isModuleIndeterminate(module)}
        onChange={(e) => handleModuleCheckAll(module, e.target.checked)}
        onClick={(e) => e.stopPropagation()}
      >
        <strong>{getModuleName(module)}</strong>
        <span style={{ marginLeft: 8, color: '#999' }}>
          ({groupedPermissions[module]?.length || 0} quyền)
        </span>
      </Checkbox>
    ),
    children: (
      <div style={{ paddingLeft: 24 }}>
        {groupedPermissions[module]?.map((permission) => (
          <div key={permission.id} style={{ marginBottom: 8 }}>
            <Checkbox
              checked={selectedIds.includes(permission.id)}
              onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
            >
              <span>{permission.name}</span>
              <span style={{ marginLeft: 8, color: '#999', fontSize: 12 }}>
                ({permission.code})
              </span>
            </Checkbox>
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <Modal
      title={`Phân quyền cho vai trò: ${role?.name || ''}`}
      open={visible}
      onCancel={onCancel}
      width={700}
      footer={
        <Space>
          <Button onClick={onCancel}>Hủy</Button>
          <Button type="primary" loading={saving} onClick={handleSave}>
            Lưu thay đổi
          </Button>
        </Space>
      }
      styles={{ body: { maxHeight: '60vh', overflowY: 'auto' } }}
    >
      <Spin spinning={loading}>
        {modules.length > 0 ? (
          <>
            <div style={{ marginBottom: 16, color: '#666' }}>
              Đã chọn <strong>{selectedIds.length}</strong> quyền
            </div>
            <Collapse
              items={collapseItems}
              defaultActiveKey={modules.slice(0, 3)}
              ghost
            />
          </>
        ) : (
          <Empty description="Không có quyền nào" />
        )}
      </Spin>
    </Modal>
  );
};

export default RolePermissionModal;
