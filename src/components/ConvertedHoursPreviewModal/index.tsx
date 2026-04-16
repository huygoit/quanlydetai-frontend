import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Table, Alert, Spin, Typography, Tag, Space, Tooltip, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FunctionOutlined, BarChartOutlined } from '@ant-design/icons';
import {
  previewPublicationConvertedHours,
  type ConvertedHoursBreakdown,
} from '@/services/api/profilePublications';
import './index.less';

const { Text, Title } = Typography;

function dinhDangSo(v: unknown, maxFractionDigits = 2): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** Điểm quy đổi: cần nhiều chữ số thập phân hơn giờ (vd B0=21 giờ → P0=0,035 điểm). */
function dinhDangDiem(v: unknown, maxFractionDigits = 4): string {
  return dinhDangSo(v, maxFractionDigits);
}

/** Hiển thị hệ số a mục 1.1: null/undefined → NA (loại cố định và rule không nhân a). */
function chuoiHeSoDonViA(v: unknown): string {
  if (v === null || v === undefined) return 'NA';
  const n = Number(v);
  if (!Number.isFinite(n)) return 'NA';
  return dinhDangSo(n, 2);
}

function noiDungTooltipHeSoA(v: unknown): string {
  const a = Number(v);
  if (!Number.isFinite(a)) return '';
  if (Math.abs(a - 2) < 0.001) {
    return 'a=2: Các tác giả liên hệ đều thuộc các đơn vị trong ĐHĐN';
  }
  if (Math.abs(a - 1.5) < 0.001) {
    return 'a=1,5: Các tác giả thuộc đơn vị trong và ngoài ĐHĐN';
  }
  return 'a=1: Các trường hợp khác';
}

function tooltipHeSoDonViTheoPhanHoi(data: ConvertedHoursBreakdown | null): string {
  if (!data) return '';
  const lyDo = (data.unitCoefficientReason || '').trim();
  if (data.unitCoefficient == null) {
    return lyDo || 'Loại kết quả này không áp hệ số a theo đơn vị (mục 1.1).';
  }
  const theoA = noiDungTooltipHeSoA(data.unitCoefficient);
  if (theoA) return theoA;
  return lyDo;
}

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
  convertedPoints?: number;
  isViewerRow?: boolean;
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
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);

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
        <Space wrap>
          <span>{name}</span>
          {record.isMainAuthor && <Tag color="blue">Chính</Tag>}
          {record.isCorresponding && <Tag color="green">Liên hệ</Tag>}
          {record.isViewerRow && <Tag color="purple">Đang xem</Tag>}
        </Space>
      ),
    },
    {
      title: 'Hệ số',
      dataIndex: 'coefficient',
      width: 100,
      align: 'right',
      render: (val) => dinhDangSo(val, 2),
    },
    {
      title: 'Giờ quy đổi',
      dataIndex: 'convertedHours',
      width: 120,
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: '#1890ff' }}>
          {dinhDangSo(val, 2)}
        </Text>
      ),
    },
    {
      title: 'Điểm quy đổi',
      dataIndex: 'convertedPoints',
      width: 130,
      align: 'right',
      render: (val) => (
        <Text strong style={{ color: '#722ed1' }}>
          {dinhDangDiem(val, 4)}
        </Text>
      ),
    },
  ];

  const authorData: AuthorBreakdownRow[] =
    data?.authorBreakdown?.map((a, idx) => ({
      key: `author-${idx}`,
      ...a,
    })) || [];

  /** B trong QĐ: tổng giờ công trình trước chia tác giả (không phải phần một NCV). */
  const poolB = data?.poolHoursB ?? data?.totalHours ?? 0;
  const poolP = data?.poolPointsP ?? data?.totalPoints ?? 0;
  const tongGioBang = authorData.reduce((s, r) => s + (Number(r.convertedHours) || 0), 0);
  const tongDiemBang = authorData.reduce((s, r) => s + (Number(r.convertedPoints) || 0), 0);

  return (
    <Modal
      title={
        <div className="modal-title-row">
          <div className="modal-title-main">
            <span>Điểm và số giờ NCKH quy đổi</span>
            {publicationTitle && (
              <Text type="secondary" style={{ fontSize: 14 }}>
                {' '}
                - {publicationTitle}
              </Text>
            )}
          </div>
        </div>
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
          <div className="table-header-row">
            <Title level={5} style={{ margin: 0 }}>
              Chi tiết điểm và giờ theo tác giả
            </Title>
            <Space size={12}>
              <Button
                size="small"
                type="link"
                icon={<FunctionOutlined />}
                onClick={() => setFormulaOpen(true)}
                style={{ padding: 0 }}
              >
                Xem công thức
              </Button>
              <Button
                size="small"
                type="link"
                icon={<BarChartOutlined />}
                onClick={() => setMetricsOpen(true)}
                style={{ padding: 0 }}
              >
                Xem các thông số
              </Button>
            </Space>
          </div>

          <Table<AuthorBreakdownRow>
            columns={authorColumns}
            dataSource={authorData}
            pagination={false}
            size="small"
            bordered
            className="authors-breakdown-table"
            rowClassName={(record) => (record.isViewerRow ? 'viewer-row' : '')}
            summary={() => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3} align="right">
                  <Text strong>Tổng cộng:</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right">
                  <Text strong style={{ color: '#52c41a' }}>
                    {dinhDangSo(tongGioBang, 2)}
                  </Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <Text strong style={{ color: '#722ed1' }}>
                    {dinhDangDiem(tongDiemBang, 4)}
                  </Text>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />

        </div>
      ) : null}

      <Modal
        title="Công thức quy đổi giờ/điểm"
        open={formulaOpen}
        onCancel={() => setFormulaOpen(false)}
        footer={null}
        width={760}
      >
        <Alert
          type="info"
          message="Quy tắc tính cho công bố khoa học"
          description={
            <div>
              <p style={{ margin: '4px 0' }}>
                {(data?.ruleKind || '').toUpperCase() === 'MULTIPLY_A' ? (
                  <>
                    <strong>B</strong> = tổng giờ công trình sau hệ số <strong>a</strong> (quy định 1.1):{' '}
                    <strong>B = B0 × a</strong>.
                  </>
                ) : (data?.ruleKind || '').toUpperCase() === 'HDGSNN_POINTS_TO_HOURS' ? (
                  <>
                    <strong>B</strong> = giờ suy từ điểm HĐGSNN (không nhân thêm hệ số <strong>a</strong> mục 1.1):{' '}
                    <strong>B = B0</strong>.
                  </>
                ) : (
                  <>
                    Với loại <strong>{data?.ruleKind ?? '…'}</strong>, tổng giờ công trình{' '}
                    <strong>B = B0</strong> (không nhân hệ số <strong>a</strong> mục 1.1). Chỉ rule{' '}
                    <strong>MULTIPLY_A</strong> mới dùng <strong>B = B0 × a</strong>.
                  </>
                )}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Điểm quy đổi:</strong>{' '}
                <Text strong style={{ color: '#722ed1' }}>
                  1 điểm
                </Text>{' '}
                = 600 giờ.
              </p>
              <p style={{ margin: '4px 0' }}>
                Tác giả nhóm chính (chính hoặc liên hệ): <strong>B/(3n) + 2B/(3p)</strong>.
              </p>
              <p style={{ margin: '4px 0' }}>
                Đồng tác giả còn lại: <strong>2B/(3p)</strong>.
              </p>
              <p style={{ margin: '4px 0' }}>
                Trong đó: <strong>n</strong> là số người thuộc nhóm chính, <strong>p</strong> là tổng số tác giả.
              </p>
              <p style={{ margin: '4px 0' }}>Điều chỉnh giờ: nữ nhân 1.2; kiêm nhiệm ngoài ĐHĐN chia 2.</p>
            </div>
          }
        />
      </Modal>
      <Modal
        title="Thông tin các thông số"
        open={metricsOpen}
        onCancel={() => setMetricsOpen(false)}
        footer={null}
        width={760}
      >
        <Descriptions bordered size="small" column={2} className="summary-descriptions">
          <Descriptions.Item label="Giờ quy đổi chuẩn (B0)">
            <Text strong>{dinhDangSo(data?.baseHours, 2)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Điểm quy đổi chuẩn (P0)">
            <Text strong>{dinhDangDiem(data?.basePoints, 4)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng số tác giả (p)">
            <Text strong>{data?.p || 0}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Số tác giả chính (n)">
            <Text strong>{data?.n || 0}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Hệ số điều chỉnh theo đơn vị (a)" span={2}>
            <Tooltip title={tooltipHeSoDonViTheoPhanHoi(data)}>
              <Text strong style={{ cursor: 'help' }}>
                {chuoiHeSoDonViA(data?.unitCoefficient)}
              </Text>
            </Tooltip>
          </Descriptions.Item>
          {data?.authorUnitFactor != null &&
            data.unitCoefficient != null &&
            data.authorUnitFactor !== data.unitCoefficient &&
            Number(data.authorUnitFactor) !== 1 && (
              <Descriptions.Item label="Hệ số đơn vị dòng NCV (a₁)" span={2}>
                <Text strong>{dinhDangSo(data.authorUnitFactor, 2)}</Text>
              </Descriptions.Item>
            )}
          <Descriptions.Item label="Tổng điểm quy đổi (P)">
            <Title level={4} style={{ margin: 0, color: '#722ed1' }}>
              {dinhDangDiem(poolP, 4)} điểm
            </Title>
          </Descriptions.Item>
          <Descriptions.Item label="Tổng giờ NCKH quy đổi (B)">
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
              {dinhDangSo(poolB, 2)} giờ
            </Title>
          </Descriptions.Item>
        </Descriptions>

        {data?.warnings && data.warnings.length > 0 && (
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
      </Modal>
    </Modal>
  );
};

export default ConvertedHoursPreviewModal;

export { ConvertedHoursPreviewModal };
export type { ConvertedHoursPreviewModalProps };
