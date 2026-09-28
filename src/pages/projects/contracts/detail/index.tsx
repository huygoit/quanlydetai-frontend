/**
 * US-05-01 bước 1 — chi tiết dự thảo hợp đồng
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Space,
  Tag,
  message,
} from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { history, useAccess, useParams } from '@umijs/max';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { formatVnd } from '@/utils/format';
import {
  getProjectContract,
  downloadProjectContract,
  generateProjectContract,
  PROJECT_CONTRACT_STATUS_MAP,
  type ProjectContract,
  type ProjectContractStatus,
} from '@/services/api/projectContracts';

const ProjectContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<ProjectContract | null>(null);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getProjectContract(Number(id));
      setData(res.data);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!access.canViewProjectContracts) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền." />
      </PageContainer>
    );
  }

  const st = data?.status as ProjectContractStatus | undefined;
  const stMap = st ? PROJECT_CONTRACT_STATUS_MAP[st] : null;
  const canRegen =
    access.canManageProjectContracts &&
    data?.status === 'HOP_DONG_DRAFT' &&
    data.project_outline_id;

  const doRegen = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const res = await generateProjectContract(data.project_outline_id, { forceRegen: true });
      message.success(res.message || 'Đã tạo lại dự thảo');
      setData(res.data);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      loading={loading}
      title={data ? `Hợp đồng ${data.contract_no || data.id}` : 'Dự thảo hợp đồng'}
      onBack={() => history.push('/projects/contracts')}
      extra={
        data ? (
          <Space>
            {canRegen && (
              <Button icon={<ReloadOutlined />} loading={saving} onClick={() => void doRegen()}>
                Tạo lại dự thảo
              </Button>
            )}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() =>
                downloadProjectContract(data.id, data.file_name).catch((e) =>
                  message.error(e?.message || 'Tải thất bại'),
                )
              }
            >
              Tải DOCX
            </Button>
          </Space>
        ) : null
      }
    >
      {data && (
        <>
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Số hợp đồng">{data.contract_no || '—'}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {stMap ? <Tag color={stMap.color}>{stMap.text}</Tag> : data.status}
              </Descriptions.Item>
              <Descriptions.Item label="Mã TM">{data.outline?.code}</Descriptions.Item>
              <Descriptions.Item label="Phiên bản">v{data.version}</Descriptions.Item>
              <Descriptions.Item label="Tên nhiệm vụ" span={2}>
                {data.outline?.title}
              </Descriptions.Item>
              <Descriptions.Item label="CNNV">{data.outline?.owner_name}</Descriptions.Item>
              <Descriptions.Item label="Đơn vị">{data.outline?.owner_unit || '—'}</Descriptions.Item>
              <Descriptions.Item label="KP đã duyệt">
                {data.outline?.approved_budget != null
                  ? formatVnd(data.outline.approved_budget)
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Sinh lúc">
                {data.generated_at
                  ? dayjs(data.generated_at).format('DD/MM/YYYY HH:mm')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="File" span={2}>
                {data.file_name}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Alert
            type="info"
            showIcon
            message="Bước 1: dự thảo đã được merge từ mẫu Admin. Một số trường Bên A / căn cứ có thể còn trống — PKH bổ sung khi soạn chi tiết (bước 2)."
          />
        </>
      )}
    </PageContainer>
  );
};

export default ProjectContractDetailPage;
