/**
 * DeleteModal - Modal for deleting a Research Output Type with cascade option
 */
import React, { useState } from 'react';
import { Modal, Checkbox, Alert, Typography, Space } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons';
import type { ResearchOutputTypeNode } from '@/types/researchOutputs';

const { Text } = Typography;

interface DeleteModalProps {
  open: boolean;
  node: ResearchOutputTypeNode | null;
  loading: boolean;
  onCancel: () => void;
  onOk: (cascade: boolean) => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  open,
  node,
  loading,
  onCancel,
  onOk,
}) => {
  const [cascade, setCascade] = useState(false);

  const hasChildren = node && node.children && node.children.length > 0;
  const childrenCount = node?.children?.length || 0;

  const countAllDescendants = (n: ResearchOutputTypeNode): number => {
    let count = n.children?.length || 0;
    n.children?.forEach((child) => {
      count += countAllDescendants(child);
    });
    return count;
  };

  const totalDescendants = node ? countAllDescendants(node) : 0;

  const handleOk = () => {
    onOk(cascade);
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
          <span>Xác nhận xoá</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Xoá"
      cancelText="Huỷ"
      okButtonProps={{ danger: true }}
    >
      {node && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text>Bạn có chắc chắn muốn xoá loại kết quả:</Text>
            <div
              style={{
                marginTop: 8,
                padding: 12,
                background: '#fff2f0',
                borderRadius: 6,
                border: '1px solid #ffccc7',
              }}
            >
              <div><strong>Mã:</strong> {node.code}</div>
              <div><strong>Tên:</strong> {node.name}</div>
              <div><strong>Level:</strong> {node.level}</div>
            </div>
          </div>

          {hasChildren && (
            <>
              <Alert
                type="warning"
                icon={<WarningOutlined />}
                message="Node này có con"
                description={
                  <div>
                    <div>Số con trực tiếp: <strong>{childrenCount}</strong></div>
                    <div>Tổng số cháu/chắt: <strong>{totalDescendants}</strong></div>
                  </div>
                }
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Checkbox
                checked={cascade}
                onChange={(e) => setCascade(e.target.checked)}
              >
                <Text type="danger">
                  Xoá luôn tất cả con/cháu (cascade)
                </Text>
              </Checkbox>

              {!cascade && (
                <Alert
                  type="error"
                  message="Không thể xoá"
                  description="Phải bật tuỳ chọn cascade để xoá node có con."
                  showIcon
                  style={{ marginTop: 12 }}
                />
              )}
            </>
          )}

          {!hasChildren && (
            <Alert
              type="info"
              message="Node lá"
              description="Node này không có con, có thể xoá trực tiếp."
              showIcon
            />
          )}
        </>
      )}
    </Modal>
  );
};

export default DeleteModal;
