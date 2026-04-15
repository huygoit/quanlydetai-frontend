import React, { useEffect, useState } from 'react';
import { Modal, Alert, message, Typography, Space, Button, List, Tag, InputNumber, Row, Col } from 'antd';
import { ReloadOutlined, CloudDownloadOutlined, BookOutlined } from '@ant-design/icons';
import { getMyOpenAlexPublicationDrafts, type OpenAlexPublicationDraft } from '@/services/api/openalex';
import './index.less';

const { Text, Paragraph } = Typography;

interface OpenAlexImportModalProps {
  open: boolean;
  onClose: () => void;
  onSelectDraft: (draft: OpenAlexPublicationDraft) => void;
  onImportDraft?: (draft: OpenAlexPublicationDraft) => Promise<void> | void;
}

const OpenAlexImportModal: React.FC<OpenAlexImportModalProps> = ({
  open,
  onClose,
  onSelectDraft,
  onImportDraft,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<OpenAlexPublicationDraft[]>([]);
  const [importingKey, setImportingKey] = useState<string | null>(null);
  const [year, setYear] = useState<number | undefined>();
  const [perPage, setPerPage] = useState<number>(20);

  const loadDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOpenAlexPublicationDrafts({ year, perPage });
      if (!res.success) {
        setError('Không tải được dữ liệu từ OpenAlex.');
        return;
      }
      setItems(Array.isArray(res.data) ? res.data : []);
      if (!res.data || res.data.length === 0) {
        message.info('Không tìm thấy bài báo nào từ OpenAlex cho ORCID hiện tại.');
      }
    } catch (e: any) {
      setError(e?.message || 'Không tải được dữ liệu từ OpenAlex.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    void loadDrafts();
  }, [open]);

  return (
    <Modal
      title={
        <Space>
          <BookOutlined />
          <span>Thêm kết quả NCKH từ Open Alex</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={920}
      className="openalex-import-modal"
      destroyOnClose
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Text type="secondary">
          Dữ liệu được lấy theo ORCID trong hồ sơ đang đăng nhập, sau đó nạp vào form tạo mới kết quả NCKH.
        </Text>

        <Row gutter={12}>
          <Col span={8}>
            <Text type="secondary">Lọc năm xuất bản</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={1900}
              max={new Date().getFullYear() + 1}
              value={year}
              onChange={(v) => setYear(typeof v === 'number' ? v : undefined)}
              placeholder="Tất cả"
            />
          </Col>
          <Col span={8}>
            <Text type="secondary">Số lượng lấy về</Text>
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              max={50}
              value={perPage}
              onChange={(v) => setPerPage(typeof v === 'number' ? v : 20)}
            />
          </Col>
          <Col span={8} style={{ display: 'flex', alignItems: 'end', gap: 8 }}>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadDrafts()}>
              Tải lại
            </Button>
          </Col>
        </Row>

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            closable
            onClose={() => setError(null)}
          />
        )}

        <List<OpenAlexPublicationDraft>
          loading={loading}
          dataSource={items}
          locale={{ emptyText: 'Chưa có dữ liệu phù hợp' }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="apply"
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={() => {
                    onSelectDraft(item);
                    onClose();
                  }}
                >
                  Nạp vào form
                </Button>,
                <Button
                  key="import-now"
                  loading={importingKey === item.sourceId}
                  onClick={async () => {
                    if (!onImportDraft) return;
                    try {
                      setImportingKey(item.sourceId);
                      await onImportDraft(item);
                      onClose();
                    } finally {
                      setImportingKey(null);
                    }
                  }}
                >
                  Import ngay
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space wrap>
                    <span>{item.title}</span>
                    {item.year && <Tag>{item.year}</Tag>}
                    {item.researchOutputTypeCode && <Tag color="geekblue">{item.researchOutputTypeCode}</Tag>}
                    <Tag color="purple">{item.publicationType}</Tag>
                    {item.needsIndexConfirmation && <Tag color="orange">Cần xác nhận chỉ mục</Tag>}
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text type="secondary">{item.journalOrConference}</Text>
                    <Text type="secondary">Tác giả: {item.authorsText}</Text>
                    <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                      {item.typeMappingReason}
                    </Paragraph>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Space>
    </Modal>
  );
};

export default OpenAlexImportModal;
export type { OpenAlexImportModalProps };
