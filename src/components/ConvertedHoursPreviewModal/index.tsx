import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Table, Alert, Spin, Typography, Tag, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  previewPublicationConvertedHours,
  type ConvertedHoursBreakdown,
} from '@/services/api/profilePublications';
import './index.less';

const { Text, Title } = Typography;

interface ConvertedHoursPreviewModalProps {
  open: boolean;
  publicationId: number | null;
  publicationTitle?: string;
  onClose: () => void;
}

interface AuthorBreakdownRow {
  key: string;
  authorName: string;
  authorOrder: number;
  isMainAuthor: boolean;
  isCorresponding: boolean;
  coefficient: number;
  convertedHours: number;
}

const ConvertedHoursPreviewModal: React.FC<ConvertedHoursPreviewModalProps> = ({
  open,
  publicationId,
  publicationTitle,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConvertedHoursBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && publicationId) {
      loadData();
    } else {
      setData(null);
      setError(null);
    }
  }, [open, publicationId]);

  const loadData = async () => {
    if (!publicationId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await previewPublicationConvertedHours(publicationId);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError('Không thể tải dữ liệu quy đổi giờ');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const authorColumns: ColumnsType<AuthorBreakdownRow> = [
    {
      title: 'STT',
      dataIndex: 'authorOrder',
      width: 60,
      align: 'center',
    },
    {
      title: 'Tác giả',
      dataIndex: 'authorName',
      render: (name, record) => (
        <Space>
          <span>{name}</span>
          {record.isMainAuthor && <Tag color="blue">Chính</Tag>}
          {record.isCorresponding && <Tag color="green">Liên hệ</Tag>}
        </Space>
      ),
    },
    {
      title: 'Hệ số',
      dataIndex: 'coefficient',
      width: 100,
      align: 'right',
      render: (val) => val?.toFixed(3) || '-',
    },
    {
      title: 'Giờ quy đổi',
      dataIndex: 'convertedHours',
      width: 120,
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: '#1890ff' }}>
          {val?.toFixed(2) || '0'}
        </Text>
      ),
    },
  ];

  const authorData: AuthorBreakdownRow[] =
    data?.authorBreakdown?.map((a, idx) => ({
      key: `author-${idx}`,
      ...a,
    })) || [];

  return (
    <Modal
      title={
        <span>
          Xem thử quy đổi giờ NCKH
          {publicationTitle && (
            <Text type="secondary" style={{ fontSize: 14, marginLeft: 8 }}>
              - {publicationTitle}
            </Text>
          )}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      className="converted-hours-preview-modal"
    >
      {loading ? (
        <div className="loading-container">
          <Spin size="large" tip="Đang tính toán..." />
        </div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : data ? (
        <div className="preview-content">
          <Descriptions
            bordered
            size="small"
            column={2}
            className="summary-descriptions"
          >
            <Descriptions.Item label="Giờ chuẩn (B0)">
              <Text strong>{data.baseHours?.toFixed(2) || '0'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Hệ số đơn vị (a)">
              <Text strong>{data.unitCoefficient?.toFixed(3) || '1'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số tác giả chính (n)">
              <Text strong>{data.n || 0}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Số tác giả liên hệ (p)">
              <Text strong>{data.p || 0}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng giờ quy đổi (B)" span={2}>
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                {data.totalConvertedHours?.toFixed(2) || '0'} giờ
              </Title>
            </Descriptions.Item>
          </Descriptions>

          {data.warnings && data.warnings.length > 0 && (
            <Alert
              type="warning"
              message="Cảnh báo"
              description={
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {data.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              }
              style={{ marginTop: 16 }}
            />
          )}

          <Title level={5} style={{ marginTop: 20, marginBottom: 12 }}>
            Chi tiết giờ theo tác giả
          </Title>

          <Table<AuthorBreakdownRow>
            columns={authorColumns}
            dataSource={authorData}
            pagination={false}
            size="small"
            bordered
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3} align="right">
                  <Text strong>Tổng cộng:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#52c41a' }}>
                    {data.totalConvertedHours?.toFixed(2) || '0'}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />

          <Alert
            type="info"
            message="Công thức tính"
            description={
              <div>
                <p style={{ margin: '4px 0' }}>
                  <strong>B = B0 × a</strong> (Tổng giờ = Giờ chuẩn × Hệ số đơn vị)
                </p>
                <p style={{ margin: '4px 0' }}>
                  Giờ của mỗi tác giả được tính dựa trên vai trò (chính/liên hệ) và thứ tự.
                </p>
              </div>
            }
            style={{ marginTop: 16 }}
          />
        </div>
      ) : null}
    </Modal>
  );
};

export default ConvertedHoursPreviewModal;

export { ConvertedHoursPreviewModal };
export type { ConvertedHoursPreviewModalProps };
