import React, { useState, useEffect } from 'react';
import { Modal, Descriptions, Table, Alert, Spin, Typography, Tag, Space, Tooltip, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FunctionOutlined, BarChartOutlined } from '@ant-design/icons';
import {
  previewPublicationConvertedHours,
  getMyPublicationAuthors,
  getProfilePublicationAuthors,
  normalizePublicationAuthor,
  type ConvertedHoursBreakdown,
} from '@/services/api/profilePublications';
import { getAdminPublicationAuthors } from '@/services/api/adminPublications';
import {
  coNhomChinhTacGia,
  HINT_KHONG_QUY_DOI_THIEU_NHOM_CHINH,
  laLoiThieuNhomChinh,
} from '@/utils/authorValidationMessages';
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
  /** Hồ sơ đang xem (trang chi tiết admin); không truyền = hồ sơ đăng nhập (me). */
  profileId?: number;
  /** Module quản lý KQNC — tải tác giả qua API admin, không gắn dòng «Đang xem». */
  adminScope?: boolean;
  publicationTitle?: string;
  onClose: () => void;
}

interface AuthorBreakdownRow {
  key: string;
  authorName: string;
  authorOrder: number;
  isTopAuthor: boolean;
  isCorresponding: boolean;
  coefficient: number;
  convertedHours: number;
  convertedPoints?: number;
  isViewerRow?: boolean;
}

const ConvertedHoursPreviewModal: React.FC<ConvertedHoursPreviewModalProps> = ({
  open,
  publicationId,
  profileId,
  adminScope = false,
  publicationTitle,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConvertedHoursBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thieuNhomChinh, setThieuNhomChinh] = useState(false);
  const [formulaOpen, setFormulaOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);

  useEffect(() => {
    if (open && publicationId) {
      loadData();
    } else {
      setData(null);
      setError(null);
      setThieuNhomChinh(false);
      setFormulaOpen(false);
      setMetricsOpen(false);
    }
  }, [open, publicationId, profileId, adminScope]);

  const loadData = async () => {
    if (!publicationId) return;

    setLoading(true);
    setError(null);
    setThieuNhomChinh(false);
    setData(null);

    try {
      const authorsRes = adminScope
        ? await getAdminPublicationAuthors(publicationId)
        : profileId != null && Number.isFinite(profileId)
          ? await getProfilePublicationAuthors(profileId, publicationId)
          : await getMyPublicationAuthors(publicationId);
      const authors = (authorsRes.success && authorsRes.data
        ? authorsRes.data.map(normalizePublicationAuthor)
        : []) as Array<{ isTopAuthor: boolean; isCorresponding: boolean }>;

      if (!coNhomChinhTacGia(authors)) {
        setThieuNhomChinh(true);
        return;
      }

      const result = await previewPublicationConvertedHours(publicationId, {
        profileId:
          !adminScope && profileId != null && Number.isFinite(profileId) ? profileId : undefined,
      });
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError('Không thể tải dữ liệu quy đổi giờ');
      }
    } catch (err: unknown) {
      const raw =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message;
      if (laLoiThieuNhomChinh(raw)) {
        setThieuNhomChinh(true);
      } else {
        setError('Có lỗi xảy ra khi tải dữ liệu');
      }
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
      width: 360,
      ellipsis: false,
      render: (name, record) => (
        <Space wrap>
          <span>{name}</span>
          {record.isTopAuthor && <Tag color="blue">Tác giả đầu</Tag>}
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
            <div className="modal-title-heading">Điểm và số giờ NCKH quy đổi</div>
            {publicationTitle ? (
              <Text type="secondary" className="modal-title-pub">
                {publicationTitle}
              </Text>
            ) : null}
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      className="converted-hours-preview-modal"
    >
      {loading ? (
        <div className="loading-container">
          <Spin size="large" tip="Đang tính toán..." />
        </div>
      ) : thieuNhomChinh ? (
        <Alert type="warning" showIcon message={HINT_KHONG_QUY_DOI_THIEU_NHOM_CHINH} />
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
        title={
          <span>
            <FunctionOutlined /> Công thức quy đổi giờ/điểm (QĐ 1883)
          </span>
        }
        open={formulaOpen}
        onCancel={() => setFormulaOpen(false)}
        footer={null}
        width={780}
      >
        {(() => {
          const kind = (data?.ruleKind || '').toUpperCase();
          const head: React.CSSProperties = {
            fontWeight: 700,
            marginBottom: 6,
            color: '#1677ff',
          };
          const box: React.CSSProperties = {
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: '10px 12px',
          };
          const sec: React.CSSProperties = { marginBottom: 14 };
          const Dong = ({ on, children }: { on?: boolean; children: React.ReactNode }) => (
            <div style={{ padding: '3px 0', lineHeight: 1.7 }}>
              {on && (
                <Tag color="blue" style={{ marginRight: 6 }}>
                  Đang áp dụng
                </Tag>
              )}
              {children}
            </div>
          );
          return (
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
              <div style={sec}>
                <div style={head}>1 · Tổng giờ công trình (B)</div>
                <div style={box}>
                  <Dong on={kind === 'MULTIPLY_A'}>
                    Bài báo mục 1–3: <strong>B = B0 × a</strong>
                  </Dong>
                  <Dong on={kind === 'MULTIPLY_C'}>
                    Đề tài / nhiệm vụ KHCN: <strong>B = B0 × c</strong>
                  </Dong>
                  <Dong on={kind === 'HDGSNN_POINTS_TO_HOURS'}>
                    Bài báo HĐGSNN (mục 4): <strong>B = 600 × điểm</strong>
                  </Dong>
                  <Dong on={kind === 'FIXED' || kind === 'BONUS_ADD' || kind === 'RANGE_REVENUE'}>
                    Sách, kỷ yếu, SHTT, sáng kiến, khen thưởng…: <strong>B = B0</strong> (theo bảng QĐ)
                  </Dong>
                </div>
              </div>

              <div style={sec}>
                <div style={head}>2 · Hệ số đơn vị a (chỉ mục 1, 2, 3)</div>
                <div style={box}>
                  <Dong>
                    Tất cả tác giả thuộc ĐHĐN → <Tag color="green">a = 2</Tag>
                  </Dong>
                  <Dong>
                    Mục 1, 2: có cả tác giả trong &amp; ngoài ĐHĐN → <Tag color="gold">a = 1.5</Tag>
                  </Dong>
                  <Dong>
                    Các trường hợp còn lại (mục 3 có tác giả ngoài…) → <Tag>a = 1</Tag>
                  </Dong>
                </div>
              </div>

              <div style={sec}>
                <div style={head}>3 · Hệ số nghiệm thu c (đề tài KHCN)</div>
                <div style={box}>
                  <Space wrap>
                    <Tag color="green">Xuất sắc: c = 1.1</Tag>
                    <Tag color="blue">Đạt, đúng hạn: c = 1.0</Tag>
                    <Tag color="orange">Đạt, trễ hạn: c = 0.5</Tag>
                  </Space>
                </div>
              </div>

              <div style={sec}>
                <div style={head}>4 · Chia giờ cho từng tác giả</div>
                <div style={box}>
                  <div style={{ marginBottom: 8 }}>
                    <strong>a) Công bố khoa học (mục 1–5)</strong> — công thức n/p:
                    <div style={{ paddingLeft: 12, lineHeight: 1.8 }}>
                      • Tác giả chính (đầu / liên hệ): <strong>B/(3n) + 2B/(3p)</strong>
                      <br />• Đồng tác giả: <strong>2B/(3p)</strong>
                      <br />
                      <Text type="secondary">n = số tác giả chính, p = tổng số tác giả</Text>
                    </div>
                  </div>
                  <div>
                    <strong>b) Sản phẩm khác (mục 6 trở đi — điều 1.4)</strong> — theo % đóng góp:
                    <div style={{ paddingLeft: 12, lineHeight: 1.8 }}>
                      • Giờ mỗi tác giả = <strong>B × (% đóng góp / 100)</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div style={sec}>
                <div style={head}>5 · Điều chỉnh giờ từng tác giả</div>
                <div style={box}>
                  <Dong>
                    Cán bộ <strong>nữ</strong>: nhân <Tag color="magenta">× 1.2</Tag>
                  </Dong>
                  <Dong>
                    Kiêm nhiệm <strong>trong &amp; ngoài ĐHĐN</strong>: chia <Tag>÷ 2</Tag>
                  </Dong>
                </div>
              </div>

              <div style={{ marginBottom: 0 }}>
                <div style={head}>6 · Điểm quy đổi</div>
                <div style={box}>
                  <strong style={{ color: '#722ed1' }}>1 điểm = 600 giờ</strong> → P = B / 600
                </div>
              </div>
            </div>
          );
        })()}
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
