/**
 * MoveModal - Modal for moving a Research Output Type to new parent
 */
import React, { useState, useMemo } from 'react';
import { Modal, Form, TreeSelect, InputNumber, Alert } from 'antd';
import type { ResearchOutputTypeNode, MoveTypePayload } from '@/types/researchOutputs';

interface MoveModalProps {
  open: boolean;
  node: ResearchOutputTypeNode | null;
  treeData: ResearchOutputTypeNode[];
  loading: boolean;
  onCancel: () => void;
  onOk: (payload: MoveTypePayload) => void;
}

const MoveModal: React.FC<MoveModalProps> = ({
  open,
  node,
  treeData,
  loading,
  onCancel,
  onOk,
}) => {
  const [form] = Form.useForm();
  const [selectedParentLevel, setSelectedParentLevel] = useState<number>(0);

  const convertToTreeSelectData = (
    nodes: ResearchOutputTypeNode[],
    excludeId: number | null
  ): any[] => {
    return nodes
      .filter((n) => n.id !== excludeId)
      .map((n) => ({
        value: n.id,
        title: `${n.code} — ${n.name} (L${n.level})`,
        level: n.level,
        disabled: n.level >= 2,
        children: n.children ? convertToTreeSelectData(n.children, excludeId) : [],
      }));
  };

  const treeSelectData = useMemo(() => {
    if (!node) return [];
    return [
      { value: null, title: '— Gốc (Root) —', level: 0 },
      ...convertToTreeSelectData(treeData, node.id),
    ];
  }, [treeData, node]);

  const findNodeLevel = (nodes: ResearchOutputTypeNode[], id: number | null): number => {
    if (id === null) return 0;
    for (const n of nodes) {
      if (n.id === id) return n.level;
      if (n.children) {
        const found = findNodeLevel(n.children, id);
        if (found > 0) return found;
      }
    }
    return 0;
  };

  const handleParentChange = (value: number | null) => {
    const parentLevel = findNodeLevel(treeData, value);
    setSelectedParentLevel(parentLevel);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onOk({
        newParentId: values.newParentId,
        newSortOrder: values.newSortOrder,
      });
    } catch {
      // validation failed
    }
  };

  const newLevel = selectedParentLevel + 1;
  const isLevelExceeded = newLevel > 3;

  return (
    <Modal
      title="Di chuyển loại kết quả"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      okText="Di chuyển"
      cancelText="Huỷ"
      okButtonProps={{ disabled: isLevelExceeded }}
    >
      {node && (
        <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
          <div><strong>Di chuyển:</strong> {node.code} — {node.name}</div>
          <div><strong>Level hiện tại:</strong> {node.level}</div>
        </div>
      )}

      <Form form={form} layout="vertical" initialValues={{ newSortOrder: 1 }}>
        <Form.Item
          name="newParentId"
          label="Cha mới"
          rules={[{ required: false }]}
        >
          <TreeSelect
            treeData={treeSelectData}
            placeholder="Chọn node cha mới (hoặc để trống = gốc)"
            allowClear
            treeDefaultExpandAll
            onChange={handleParentChange}
          />
        </Form.Item>

        <Form.Item
          name="newSortOrder"
          label="Thứ tự sắp xếp mới"
          rules={[{ required: true, message: 'Vui lòng nhập thứ tự' }]}
        >
          <InputNumber min={1} max={999} style={{ width: '100%' }} />
        </Form.Item>
      </Form>

      {isLevelExceeded && (
        <Alert
          type="error"
          message="Không thể di chuyển"
          description={`Di chuyển vào vị trí này sẽ khiến level = ${newLevel} (vượt quá 3).`}
          showIcon
        />
      )}

      {!isLevelExceeded && selectedParentLevel >= 0 && (
        <Alert
          type="info"
          message={`Level mới sau khi di chuyển: ${newLevel}`}
          showIcon
        />
      )}
    </Modal>
  );
};

export default MoveModal;
