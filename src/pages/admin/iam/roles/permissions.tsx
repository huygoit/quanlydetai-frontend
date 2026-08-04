/**
 * Trang phân quyền cho Role - Advanced Form với FooterToolbar
 */
import { PageContainer, FooterToolbar, ProCard } from '@ant-design/pro-components';
import {
  Checkbox,
  message,
  Spin,
  Button,
  Space,
  Descriptions,
  Badge,
  Row,
  Col,
  Divider,
  Typography,
  Empty,
  Input,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  CheckSquareOutlined,
  MinusSquareOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { history, useParams } from '@umijs/max';
import {
  getRoleDetail,
  getRolePermissions,
  updateRolePermissions,
  ROLE_STATUS_MAP,
  type RoleItem,
} from '@/services/api/roles';
import {
  getAllPermissions,
  syncMissingPermissions,
  loadEffectiveModuleLabelMap,
  PERMISSION_MODULE_MAP,
  type PermissionItem,
} from '@/services/api/permissions';

const { Text } = Typography;

interface GroupedPermissions {
  [module: string]: PermissionItem[];
}

const RolePermissionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const roleId = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<RoleItem | null>(null);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [initialSelectedIds, setInitialSelectedIds] = useState<number[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({
    ...PERMISSION_MODULE_MAP,
  });

  useEffect(() => {
    if (roleId) {
      void loadData(true);
    }
  }, [roleId]);

  useEffect(() => {
    loadEffectiveModuleLabelMap().then(setModuleLabels);
  }, []);

  const groupPermissionsByModule = (permissions: PermissionItem[]): GroupedPermissions => {
    const grouped = permissions.reduce((acc, perm) => {
      const module = perm.module || 'other';
      if (!acc[module]) acc[module] = [];
      acc[module].push(perm);
      return acc;
    }, {} as GroupedPermissions);

    Object.keys(grouped).forEach((module) => {
      grouped[module].sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    });
    return grouped;
  };

  const loadData = async (alsoSync = false) => {
    setLoading(true);
    try {
      if (alsoSync) {
        try {
          await syncMissingPermissions();
        } catch {
          /* bỏ qua — vẫn tải danh sách */
        }
      }

      const [roleRes, permissionsRes, rolePermissionsRes] = await Promise.all([
        getRoleDetail(roleId),
        getAllPermissions(),
        getRolePermissions(roleId),
      ]);

      if (roleRes?.data) setRole(roleRes.data);

      const allPerms = Array.isArray(permissionsRes?.data) ? permissionsRes.data : [];
      setGroupedPermissions(groupPermissionsByModule(allPerms));

      if (rolePermissionsRes?.data) {
        const raw = rolePermissionsRes.data || [];
        const ids = raw
          .map((p: any) => Number(typeof p === 'object' ? p.id : p))
          .filter((n) => !Number.isNaN(n));
        setSelectedIds(ids);
        setInitialSelectedIds(ids);
      }
    } catch {
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateRolePermissions(roleId, {
        permission_ids: selectedIds,
      });
      if (result?.data || result) {
        message.success('Cập nhật quyền thành công');
        history.push('/admin/iam/roles');
      }
    } catch (error: any) {
      message.error(error?.message || 'Không thể cập nhật quyền');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => history.push('/admin/iam/roles');

  const handleSyncMissing = async () => {
    setSyncing(true);
    try {
      const result = await syncMissingPermissions();
      const added = result?.data?.added ?? 0;
      message[added > 0 ? 'success' : 'info'](
        added > 0 ? `Đã bổ sung ${added} quyền chuẩn` : 'Catalog đã đủ quyền chuẩn',
      );
      await loadData(false);
    } catch {
      message.error('Không thể bổ sung quyền.');
    } finally {
      setSyncing(false);
    }
  };

  const toNum = (v: any) => Number(v);
  const isSelected = (pid: any) => selectedIds.includes(toNum(pid));

  const handleModuleCheckAll = (module: string, checked: boolean) => {
    const moduleIds = (groupedPermissions[module] || []).map((p) => toNum(p.id));
    if (checked) setSelectedIds((prev) => [...new Set([...prev, ...moduleIds])]);
    else setSelectedIds((prev) => prev.filter((x) => !moduleIds.includes(x)));
  };

  const handlePermissionChange = (permissionId: any, checked: boolean) => {
    const numId = toNum(permissionId);
    if (checked) setSelectedIds((prev) => [...prev, numId]);
    else setSelectedIds((prev) => prev.filter((x) => x !== numId));
  };

  const handleSelectAll = () => {
    setSelectedIds(Object.values(groupedPermissions).flat().map((p) => toNum(p.id)));
  };

  const handleDeselectAll = () => setSelectedIds([]);

  const isModuleAllChecked = (module: string) => {
    const permissions = groupedPermissions[module] || [];
    return permissions.length > 0 && permissions.every((p) => isSelected(p.id));
  };

  const isModuleIndeterminate = (module: string) => {
    const permissions = groupedPermissions[module] || [];
    const checkedCount = permissions.filter((p) => isSelected(p.id)).length;
    return checkedCount > 0 && checkedCount < permissions.length;
  };

  const getModuleName = (module: string) => moduleLabels[module] || module;

  const getModuleColor = (module: string): string => {
    const colorMap: Record<string, string> = {
      department: '#1890ff',
      user: '#13c2c2',
      role: '#722ed1',
      permission: '#eb2f96',
      project: '#52c41a',
      cfp: '#389e0d',
      idea: '#faad14',
      council: '#fa8c16',
      publication: '#2f54eb',
      report: '#fa541c',
      finance: '#a0d911',
      profile: '#8c8c8c',
      notification: '#eb2f96',
      system: '#f5222d',
    };
    return colorMap[module] || '#1890ff';
  };

  const filteredGrouped = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return groupedPermissions;
    const out: GroupedPermissions = {};
    Object.entries(groupedPermissions).forEach(([mod, list]) => {
      const matched = list.filter(
        (p) =>
          p.code.toLowerCase().includes(q) ||
          (p.name || '').toLowerCase().includes(q) ||
          mod.toLowerCase().includes(q) ||
          getModuleName(mod).toLowerCase().includes(q),
      );
      if (matched.length) out[mod] = matched;
    });
    return out;
  }, [groupedPermissions, keyword, moduleLabels]);

  const modules = Object.keys(filteredGrouped).sort((a, b) =>
    getModuleName(a).localeCompare(getModuleName(b), 'vi'),
  );

  const totalPermissions = Object.values(groupedPermissions).flat().length;
  const visiblePermissions = Object.values(filteredGrouped).flat().length;
  const hasChanges =
    JSON.stringify([...selectedIds].sort()) !== JSON.stringify([...initialSelectedIds].sort());

  return (
    <PageContainer
      header={{
        title: 'Phân quyền cho vai trò',
        breadcrumb: {
          items: [
            { title: 'Hệ thống' },
            { title: 'Vai trò', href: '/admin/iam/roles' },
            { title: 'Phân quyền' },
          ],
        },
      }}
      content={
        role && (
          <Descriptions column={3} size="small">
            <Descriptions.Item label="Mã vai trò">
              <Text code>{role.code}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tên vai trò">
              <Text strong>{role.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Badge
                status={ROLE_STATUS_MAP[role.status]?.status as any}
                text={ROLE_STATUS_MAP[role.status]?.text}
              />
            </Descriptions.Item>
          </Descriptions>
        )
      }
    >
      <Spin spinning={loading}>
        <ProCard style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle" gutter={[12, 12]}>
            <Col flex="auto">
              <Space size="large" wrap>
                <div>
                  <Text type="secondary">Tổng số quyền: </Text>
                  <Text strong>{totalPermissions}</Text>
                  {keyword ? (
                    <Text type="secondary"> (đang lọc: {visiblePermissions})</Text>
                  ) : null}
                </div>
                <Divider type="vertical" />
                <div>
                  <Text type="secondary">Đã chọn: </Text>
                  <Text strong style={{ color: '#1890ff' }}>
                    {selectedIds.length}
                  </Text>
                </div>
                <Divider type="vertical" />
                <div>
                  <Text type="secondary">Số module: </Text>
                  <Text strong>{modules.length}</Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Space wrap>
                <Input
                  allowClear
                  prefix={<SearchOutlined />}
                  placeholder="Tìm: selection, xét chọn, cfp…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{ width: 260 }}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => void handleSyncMissing()}
                  loading={syncing}
                  size="small"
                >
                  Bổ sung quyền chuẩn
                </Button>
                <Button icon={<CheckSquareOutlined />} onClick={handleSelectAll} size="small">
                  Chọn tất cả
                </Button>
                <Button icon={<MinusSquareOutlined />} onClick={handleDeselectAll} size="small">
                  Bỏ chọn tất cả
                </Button>
              </Space>
            </Col>
          </Row>
        </ProCard>

        {modules.length > 0 ? (
          <Row gutter={[16, 16]}>
            {modules.map((module) => {
              const permissions = filteredGrouped[module] || [];
              const checkedCount = permissions.filter((p) => isSelected(p.id)).length;
              const moduleColor = getModuleColor(module);

              return (
                <Col xs={24} sm={24} md={12} lg={8} xl={8} key={module}>
                  <ProCard
                    title={
                      <Checkbox
                        checked={isModuleAllChecked(module)}
                        indeterminate={isModuleIndeterminate(module)}
                        onChange={(e) => handleModuleCheckAll(module, e.target.checked)}
                        style={{ fontWeight: 600 }}
                      >
                        <span style={{ color: moduleColor }}>{getModuleName(module)}</span>
                      </Checkbox>
                    }
                    extra={
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {checkedCount}/{permissions.length}
                      </Text>
                    }
                    bordered
                    headerBordered
                    size="small"
                    style={{ height: '100%', borderTop: `3px solid ${moduleColor}` }}
                    bodyStyle={{ maxHeight: 420, overflowY: 'auto', padding: '12px 16px' }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size={4}>
                      {permissions.map((permission) => (
                        <div
                          key={permission.id}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 4,
                            background: isSelected(permission.id) ? '#e6f7ff' : 'transparent',
                          }}
                        >
                          <Checkbox
                            checked={isSelected(permission.id)}
                            onChange={(e) =>
                              handlePermissionChange(permission.id, e.target.checked)
                            }
                            style={{ width: '100%' }}
                          >
                            <div>
                              <Text style={{ fontSize: 13 }}>{permission.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {permission.code}
                              </Text>
                            </div>
                          </Checkbox>
                        </div>
                      ))}
                    </Space>
                  </ProCard>
                </Col>
              );
            })}
          </Row>
        ) : (
          <ProCard>
            <Empty
              description={
                keyword
                  ? `Không thấy quyền khớp “${keyword}”. Thử “selection” hoặc “xét chọn”.`
                  : 'Không có quyền nào'
              }
            />
          </ProCard>
        )}
      </Spin>

      <FooterToolbar>
        <Space>
          {hasChanges && (
            <Text type="warning" style={{ marginRight: 16 }}>
              Có thay đổi chưa lưu
            </Text>
          )}
          <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => void handleSave()}
            disabled={!hasChanges}
          >
            Lưu thay đổi
          </Button>
        </Space>
      </FooterToolbar>
    </PageContainer>
  );
};

export default RolePermissionsPage;
