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
  ProFormDependency,
  ProFormDigit,
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
    const loai = String(values.template_type || activeType);
    if (loai === 'THONG_BAO') {
      fd.append('ky_hieu', String(values.ky_hieu || ''));
      fd.append('tham_quyen_ky', String(values.tham_quyen_ky || ''));
      fd.append('ho_ten_nguoi_ky', String(values.ho_ten_nguoi_ky || ''));
      fd.append('noi_nhan', String(values.noi_nhan || ''));
      fd.append('so_moi_nhat', String(values.so_moi_nhat ?? 0));
    }
    if (loai === 'QUYET_DINH') {
      fd.append(
        'van_ban_quy_dinh_chuc_nang_nhiem_vu_tham_quyen',
        String(values.van_ban_quy_dinh_chuc_nang_nhiem_vu_tham_quyen || ''),
      );
      fd.append(
        'quy_dinh_quan_ly_nhiem_vu_khcn_dmst',
        String(values.quy_dinh_quan_ly_nhiem_vu_khcn_dmst || ''),
      );
      fd.append(
        'van_ban_phe_duyet_danh_muc_hoac_ke_hoach_tham_dinh',
        String(values.van_ban_phe_duyet_danh_muc_hoac_ke_hoach_tham_dinh || ''),
      );
      fd.append('chuc_danh_nguoi_de_nghi', String(values.chuc_danh_nguoi_de_nghi || ''));
      fd.append('don_vi_dau_moi', String(values.don_vi_dau_moi || ''));
      fd.append('don_vi_luu_ho_so', String(values.don_vi_luu_ho_so || ''));
      fd.append('ho_ten_nguoi_ky', String(values.ho_ten_nguoi_ky || ''));
      fd.append('so_moi_nhat', String(values.so_moi_nhat ?? 0));
    }

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
        r.updated_at ? dayjs(r.updated_at).format('HH:mm DD/MM/YYYY') : '—',
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
        description="«Hợp đồng» dùng cho BM.06. «Biên bản thanh lý» dùng sau nghiệm thu. «Thông báo» dùng cho thông báo tuyển chọn đề tài."
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
                ky_hieu: editing.merge_config?.ky_hieu || '',
                tham_quyen_ky: editing.merge_config?.tham_quyen_ky || '',
                ho_ten_nguoi_ky: editing.merge_config?.ho_ten_nguoi_ky || '',
                noi_nhan: editing.merge_config?.noi_nhan || '',
                so_moi_nhat: editing.merge_config?.so_moi_nhat ?? 0,
                van_ban_quy_dinh_chuc_nang_nhiem_vu_tham_quyen:
                  editing.merge_config?.van_ban_quy_dinh_chuc_nang_nhiem_vu_tham_quyen || '',
                quy_dinh_quan_ly_nhiem_vu_khcn_dmst:
                  editing.merge_config?.quy_dinh_quan_ly_nhiem_vu_khcn_dmst || '',
                van_ban_phe_duyet_danh_muc_hoac_ke_hoach_tham_dinh:
                  editing.merge_config?.van_ban_phe_duyet_danh_muc_hoac_ke_hoach_tham_dinh || '',
                chuc_danh_nguoi_de_nghi: editing.merge_config?.chuc_danh_nguoi_de_nghi || '',
                don_vi_dau_moi: editing.merge_config?.don_vi_dau_moi || '',
                don_vi_luu_ho_so: editing.merge_config?.don_vi_luu_ho_so || '',
              }
            : {
                status: 'ACTIVE',
                is_default: true,
                template_type: activeType,
                form_code:
                  activeType === 'HOP_DONG'
                    ? 'BM06'
                    : activeType === 'THONG_BAO'
                      ? 'TB'
                      : activeType === 'QUYET_DINH'
                        ? 'QD'
                        : '',
                code:
                  activeType === 'HOP_DONG'
                    ? 'BM06_'
                    : activeType === 'THONG_BAO'
                      ? 'TB_'
                      : activeType === 'QUYET_DINH'
                        ? 'QD_'
                        : 'BBTL_',
                chuc_danh_nguoi_de_nghi: 'Trưởng phòng Khoa học và Hợp tác quốc tế',
                don_vi_dau_moi: 'Phòng Khoa học và Hợp tác quốc tế',
                don_vi_luu_ho_so: 'PKH&HTQT',
                so_moi_nhat: 0,
              }
        }
        modalProps={{ destroyOnClose: true }}
        onFinish={handleSubmit}
        width={640}
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
        <ProFormDependency name={['template_type']}>
          {({ template_type }) => {
            if (template_type === 'THONG_BAO') {
              return (
                <>
                  <ProFormDigit
                    name="so_moi_nhat"
                    label="Số mới nhất đã dùng"
                    min={0}
                    fieldProps={{ precision: 0 }}
                    extra="Xem và tải dùng số này + 1. Số chỉ được ghi lại khi BGH phê duyệt."
                  />
                  <ProFormText
                    name="ky_hieu"
                    label="Ký hiệu thông báo"
                    placeholder="ĐHSP"
                    extra="Điền vào số hiệu, dạng Số: …/TB-ĐHSP."
                  />
                  <ProFormText
                    name="tham_quyen_ky"
                    label="Thẩm quyền ký"
                    placeholder="HIỆU TRƯỞNG"
                  />
                  <ProFormText name="ho_ten_nguoi_ky" label="Họ tên người ký" />
                  <ProFormTextArea
                    name="noi_nhan"
                    label="Nơi nhận"
                    fieldProps={{ rows: 5 }}
                    extra="Mỗi dòng một nơi nhận. Xuống dòng sẽ giữ nguyên trên thông báo."
                  />
                </>
              );
            }
            if (template_type === 'QUYET_DINH') {
              return (
                <>
                  <ProFormDigit
                    name="so_moi_nhat"
                    label="Số quyết định mới nhất đã dùng"
                    min={0}
                    fieldProps={{ precision: 0 }}
                    extra="Dự thảo dùng số này + 1. Cập nhật khi phát hành chính thức."
                  />
                  <ProFormTextArea
                    name="van_ban_quy_dinh_chuc_nang_nhiem_vu_tham_quyen"
                    label="Văn bản quy định chức năng, nhiệm vụ, thẩm quyền"
                    fieldProps={{ rows: 2 }}
                  />
                  <ProFormTextArea
                    name="quy_dinh_quan_ly_nhiem_vu_khcn_dmst"
                    label="Quy định quản lý nhiệm vụ KHCN&ĐMST"
                    fieldProps={{ rows: 2 }}
                  />
                  <ProFormTextArea
                    name="van_ban_phe_duyet_danh_muc_hoac_ke_hoach_tham_dinh"
                    label="Văn bản phê duyệt danh mục / kế hoạch thẩm định"
                    fieldProps={{ rows: 2 }}
                  />
                  <ProFormText
                    name="chuc_danh_nguoi_de_nghi"
                    label="Chức danh người đề nghị"
                    placeholder="Trưởng phòng Khoa học và Hợp tác quốc tế"
                  />
                  <ProFormText
                    name="don_vi_dau_moi"
                    label="Đơn vị đầu mối thi hành"
                    placeholder="Phòng Khoa học và Hợp tác quốc tế"
                  />
                  <ProFormText
                    name="don_vi_luu_ho_so"
                    label="Đơn vị lưu hồ sơ (nơi nhận)"
                    placeholder="PKH&HTQT"
                  />
                  <ProFormText name="ho_ten_nguoi_ky" label="Họ tên người ký (Hiệu trưởng)" />
                </>
              );
            }
            return null;
          }}
        </ProFormDependency>
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
