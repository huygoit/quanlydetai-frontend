/**
 * Layer sheet xem thuyết minh (BM.04) — kéo từ dưới lên
 */
import { FileTextOutlined } from '@ant-design/icons';
import { Button, Descriptions, Drawer, Space, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { formatVnd } from '@/utils/format';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import './outline-preview-sheet.less';

const { Text, Title } = Typography;

export type OutlinePreviewData = {
  id?: number;
  code?: string;
  title?: string;
  ownerName?: string;
  ownerUnit?: string | null;
  field?: string | null;
  requestedBudget?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  outlineFileUrl?: string | null;
  appendixFileUrl?: string | null;
  urgency?: string | null;
  detailedObjectives?: string | null;
  researchContent?: string | null;
  methodology?: string | null;
  expectedProducts?: Array<{
    name?: string;
    quantity?: string | null;
    quality?: string | null;
  }>;
  members?: Array<{
    id?: number;
    fullName?: string;
    role?: string;
    roleInProject?: string;
    unit?: string | null;
    affiliationUnits?: string[];
  }>;
  budgetLines?: Array<{
    id?: number;
    content?: string;
    amount?: number;
  }>;
  totalDetailBudget?: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  outline?: OutlinePreviewData | null;
  loading?: boolean;
  title?: string;
};

const OutlinePreviewSheet: React.FC<Props> = ({
  open,
  onClose,
  outline: o,
  loading,
  title,
}) => {
  const fileUrl = resolvePublicAssetUrl(o?.outlineFileUrl);
  const appendixUrl = resolvePublicAssetUrl(o?.appendixFileUrl);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="right"
      width="75vw"
      className="outline-preview-sheet"
      title={
        <Space direction="vertical" size={0}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Thuyết minh · BM.04
          </Text>
          <span>
            {title ||
              (o?.code ? `${o.code} — ${o.title || ''}` : 'Xem thuyết minh')}
          </span>
        </Space>
      }
      extra={
        <Space>
          {fileUrl ? (
            <Button
              type="primary"
              ghost
              icon={<FileTextOutlined />}
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
            >
              Mở file
            </Button>
          ) : null}
          <Button onClick={onClose}>Đóng</Button>
        </Space>
      }
      destroyOnClose
    >
      {!o && !loading ? (
        <Text type="secondary">Không có dữ liệu thuyết minh.</Text>
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div className="ops-meta">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Mã TM">{o?.code || '—'}</Descriptions.Item>
              <Descriptions.Item label="Chủ nhiệm">
                {o?.ownerName || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Đơn vị">
                {o?.ownerUnit || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Lĩnh vực">{o?.field || '—'}</Descriptions.Item>
              <Descriptions.Item label="Kinh phí đề nghị">
                {formatVnd(Number(o?.requestedBudget || 0))}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian">
                {[
                  o?.startDate ? dayjs(o.startDate).format('MM/YYYY') : null,
                  o?.endDate ? dayjs(o.endDate).format('MM/YYYY') : null,
                ]
                  .filter(Boolean)
                  .join(' – ') || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tên đề tài" span={2}>
                <Text strong>{o?.title || '—'}</Text>
              </Descriptions.Item>
            </Descriptions>
            <Space wrap style={{ marginTop: 8 }}>
              {fileUrl ? (
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  href={fileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Mở file thuyết minh
                </Button>
              ) : (
                <Tag>Chưa có file đính kèm</Tag>
              )}
              {appendixUrl ? (
                <Button href={appendixUrl} target="_blank" rel="noreferrer">
                  Phụ lục
                </Button>
              ) : null}
            </Space>
          </div>

          {o?.urgency ? (
            <section className="ops-block">
              <Title level={5}>Tính cấp thiết</Title>
              <div dangerouslySetInnerHTML={{ __html: o.urgency }} />
            </section>
          ) : null}
          {o?.detailedObjectives ? (
            <section className="ops-block">
              <Title level={5}>Mục tiêu</Title>
              <div dangerouslySetInnerHTML={{ __html: o.detailedObjectives }} />
            </section>
          ) : null}
          {o?.researchContent ? (
            <section className="ops-block">
              <Title level={5}>Nội dung nghiên cứu</Title>
              <div dangerouslySetInnerHTML={{ __html: o.researchContent }} />
            </section>
          ) : null}
          {o?.methodology ? (
            <section className="ops-block">
              <Title level={5}>Phương pháp</Title>
              <div dangerouslySetInnerHTML={{ __html: o.methodology }} />
            </section>
          ) : null}

          {!!o?.expectedProducts?.length ? (
            <section className="ops-block">
              <Title level={5}>Sản phẩm dự kiến</Title>
              <Table
                size="small"
                pagination={false}
                rowKey={(_, i) => String(i)}
                dataSource={o.expectedProducts}
                columns={[
                  { title: 'Sản phẩm', dataIndex: 'name' },
                  { title: 'Số lượng', dataIndex: 'quantity', width: 120 },
                  { title: 'Chất lượng', dataIndex: 'quality', ellipsis: true },
                ]}
              />
            </section>
          ) : null}

          {!!o?.members?.length ? (
            <section className="ops-block">
              <Title level={5}>Nhóm thực hiện</Title>
              <Table
                size="small"
                pagination={false}
                rowKey={(m) => String(m.id || m.fullName)}
                dataSource={o.members}
                columns={[
                  { title: 'Họ tên', dataIndex: 'fullName' },
                  {
                    title: 'Vai trò',
                    width: 140,
                    render: (_: unknown, m) => {
                      const role = m.role || m.roleInProject;
                      if (role === 'PRINCIPAL' || role === 'Chủ nhiệm')
                        return 'Chủ nhiệm';
                      if (role === 'SECRETARY') return 'Thư ký';
                      return m.roleInProject || 'Thành viên';
                    },
                  },
                  {
                    title: 'Đơn vị',
                    ellipsis: true,
                    render: (_: unknown, m) =>
                      m.unit ||
                      (m.affiliationUnits || []).join(', ') ||
                      '—',
                  },
                ]}
              />
            </section>
          ) : null}

          {!!o?.budgetLines?.length ? (
            <section className="ops-block">
              <Title level={5}>Dự toán tóm tắt</Title>
              <Table
                size="small"
                pagination={false}
                rowKey={(r) => String(r.id || r.content)}
                dataSource={o.budgetLines}
                columns={[
                  { title: 'Nội dung', dataIndex: 'content', ellipsis: true },
                  {
                    title: 'Số tiền',
                    dataIndex: 'amount',
                    width: 140,
                    align: 'right',
                    render: (v: number) => formatVnd(v),
                  },
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>
                      <strong>Tổng chi tiết</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>
                        {formatVnd(
                          o.totalDetailBudget ?? o.requestedBudget ?? 0,
                        )}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            </section>
          ) : null}
        </Space>
      )}
    </Drawer>
  );
};

export default OutlinePreviewSheet;
