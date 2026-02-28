/**
 * TypeForm - Form for creating/editing Research Output Type
 */
import React, { useEffect } from 'react';
import { Form, Input, InputNumber, Switch, Button, Space, Popconfirm } from 'antd';
import { SaveOutlined, DeleteOutlined, DragOutlined } from '@ant-design/icons';
import type { ResearchOutputTypeNode, CreateTypePayload, UpdateTypePayload } from '@/types/researchOutputs';

interface TypeFormProps {
  node: ResearchOutputTypeNode | null;
  isCreating: boolean;
  parentNode: ResearchOutputTypeNode | null;
  loading: boolean;
  onSave: (values: CreateTypePayload | UpdateTypePayload) => void;
  onDelete: () => void;
  onMove: () => void;
}

const TypeForm: React.FC<TypeFormProps> = ({
  node,
  isCreating,
  parentNode,
  loading,
  onSave,
  onDelete,
  onMove,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isCreating) {
      form.resetFields();
      form.setFieldsValue({
        isActive: true,
        sortOrder: 1,
      });
    } else if (node) {
      form.setFieldsValue({
        code: node.code,
        name: node.name,
        sortOrder: node.sortOrder,
        isActive: node.isActive,
      });
    }
  }, [node, isCreating, form]);

  const handleFinish = (values: any) => {
    if (isCreating) {
      const payload: CreateTypePayload = {
        code: values.code,
        name: values.name,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        level: parentNode ? ((parentNode.level + 1) as 1 | 2 | 3) : 1,
        parentId: parentNode?.id || null,
      };
      onSave(payload);
    } else {
      const payload: UpdateTypePayload = {
        code: values.code,
        name: values.name,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      };
      onSave(payload);
    }
  };

  const levelText = isCreating
    ? parentNode
      ? `Level ${parentNode.level + 1}`
      : 'Level 1'
    : `Level ${node?.level}`;

  const parentText = isCreating
    ? parentNode
      ? `${parentNode.code} — ${parentNode.name}`
      : 'Gốc (Root)'
    : undefined;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      className="type-form"
    >
      {isCreating && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
          <div><strong>Tạo mới:</strong> {levelText}</div>
          <div><strong>Thuộc:</strong> {parentText}</div>
        </div>
      )}

      {!isCreating && node && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
          <div><strong>Level:</strong> {levelText}</div>
          <div><strong>ID:</strong> {node.id}</div>
        </div>
      )}

      <Form.Item
        name="code"
        label="Mã"
        rules={[
          { required: true, message: 'Vui lòng nhập mã' },
          { max: 50, message: 'Tối đa 50 ký tự' },
        ]}
      >
        <Input placeholder="VD: BB_ISI_Q1" />
      </Form.Item>

      <Form.Item
        name="name"
        label="Tên"
        rules={[
          { required: true, message: 'Vui lòng nhập tên' },
          { max: 200, message: 'Tối đa 200 ký tự' },
        ]}
      >
        <Input placeholder="VD: Bài báo ISI Q1" />
      </Form.Item>

      <Form.Item name="sortOrder" label="Thứ tự sắp xếp">
        <InputNumber min={1} max={999} style={{ width: '100%' }} />
      </Form.Item>

      <Form.Item name="isActive" label="Kích hoạt" valuePropName="checked">
        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
      </Form.Item>

      <Form.Item>
        <Space wrap>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
            {isCreating ? 'Tạo mới' : 'Lưu'}
          </Button>

          {!isCreating && node && (
            <>
              <Button icon={<DragOutlined />} onClick={onMove}>
                Di chuyển
              </Button>
              <Popconfirm
                title="Xoá loại kết quả này?"
                description="Thao tác này không thể hoàn tác"
                onConfirm={onDelete}
                okText="Xoá"
                cancelText="Huỷ"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  Xoá
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TypeForm;
