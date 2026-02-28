import React, { useState } from 'react';
import { Modal, Form, Input, InputNumber, Alert, message, Typography, Space } from 'antd';
import { SearchOutlined, BookOutlined } from '@ant-design/icons';
import {
  importFromSemanticScholar,
  validateImportParams,
  type SemanticScholarImportParams,
} from '@/services/api/semanticScholar';
import './index.less';

const { Text } = Typography;

interface SemanticScholarImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SemanticScholarImportModal: React.FC<SemanticScholarImportModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const params: SemanticScholarImportParams = {
        doi: values.doi?.trim() || undefined,
        orcid: values.orcid?.trim() || undefined,
        authorName: values.authorName?.trim() || undefined,
        year: values.year || undefined,
      };

      if (!validateImportParams(params)) {
        setError('Vui lòng nhập ít nhất một trong: DOI, ORCID hoặc Họ tên tác giả');
        return;
      }

      setError(null);
      setLoading(true);

      const result = await importFromSemanticScholar(params);

      if (result.success && result.data) {
        const { imported, errors } = result.data;
        
        if (imported > 0) {
          message.success(`Đã import ${imported} công bố từ Semantic Scholar`);
          form.resetFields();
          onClose();
          onSuccess?.();
        } else if (errors && errors.length > 0) {
          setError(errors.join('. '));
        } else {
          message.info('Không tìm thấy công bố nào phù hợp');
        }
      } else {
        setError('Không thể import từ Semantic Scholar');
      }
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.message?.includes('404')) {
        setError('Chưa cấu hình chức năng import từ Semantic Scholar');
      } else {
        setError(err?.message || 'Có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setError(null);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <BookOutlined />
          <span>Thêm từ Semantic Scholar</span>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      okText="Tìm kiếm & Import"
      okButtonProps={{ icon: <SearchOutlined />, loading }}
      cancelText="Hủy"
      width={520}
      className="semantic-scholar-import-modal"
    >
      <div className="modal-description">
        <Text type="secondary">
          Nhập ít nhất một thông tin để tìm kiếm công bố trên Semantic Scholar
        </Text>
      </div>

      {error && (
        <Alert
          type="error"
          message={error}
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form form={form} layout="vertical">
        <Form.Item
          name="doi"
          label="DOI"
          tooltip="Digital Object Identifier của bài báo"
        >
          <Input placeholder="VD: 10.1234/example.2024" />
        </Form.Item>

        <Form.Item
          name="orcid"
          label="ORCID"
          tooltip="ORCID ID của tác giả"
        >
          <Input placeholder="VD: 0000-0001-2345-6789" />
        </Form.Item>

        <Form.Item
          name="authorName"
          label="Họ và tên tác giả"
          tooltip="Tên tác giả để tìm kiếm"
        >
          <Input placeholder="VD: Nguyen Van A" />
        </Form.Item>

        <Form.Item
          name="year"
          label="Năm xuất bản"
          tooltip="Lọc theo năm xuất bản (không bắt buộc)"
        >
          <InputNumber
            style={{ width: '100%' }}
            min={1900}
            max={new Date().getFullYear() + 1}
            placeholder="VD: 2024"
          />
        </Form.Item>
      </Form>

      <Alert
        type="info"
        message="Lưu ý"
        description="Các công bố tìm được sẽ được thêm vào danh sách gợi ý để bạn xác nhận trước khi đưa vào hồ sơ."
        showIcon
      />
    </Modal>
  );
};

export default SemanticScholarImportModal;

export { SemanticScholarImportModal };
export type { SemanticScholarImportModalProps };
