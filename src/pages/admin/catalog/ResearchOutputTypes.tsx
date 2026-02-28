/**
 * ResearchOutputTypes - Quản lý loại kết quả NCKH
 * Layout 2 cột: TreePanel (left) + Detail (right)
 * Hỗ trợ demo mode khi API chưa sẵn sàng
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Empty, Alert, message, Spin } from 'antd';
import {
  TreePanel,
  TypeForm,
  RuleForm,
  MoveModal,
  DeleteModal,
} from '@/components/ResearchOutputTypes';
import {
  fetchTree,
  createType,
  updateType,
  deleteType,
  moveType,
  getRule,
  upsertRule,
} from '@/services/researchOutputTypes';
import type {
  ResearchOutputTypeNode,
  CreateTypePayload,
  UpdateTypePayload,
  MoveTypePayload,
  RuleDTO,
  UpsertRulePayload,
} from '@/types/researchOutputs';
import './ResearchOutputTypes.less';

// Dữ liệu mẫu khi API chưa sẵn sàng
const MOCK_TREE: ResearchOutputTypeNode[] = [
  {
    id: 1,
    code: 'BB',
    name: 'Bài báo',
    level: 1,
    sortOrder: 1,
    isActive: true,
    hasRule: false,
    children: [
      {
        id: 2,
        code: 'BB_ISI',
        name: 'Bài báo ISI',
        level: 2,
        sortOrder: 1,
        isActive: true,
        hasRule: false,
        children: [
          {
            id: 3,
            code: 'BB_ISI_Q1',
            name: 'ISI Q1',
            level: 3,
            sortOrder: 1,
            isActive: true,
            hasRule: false,
            children: [],
          },
        ],
      },
    ],
  },
];

let nextId = 100;

const ResearchOutputTypes: React.FC = () => {
  const [treeData, setTreeData] = useState<ResearchOutputTypeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [useDemoMode, setUseDemoMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<ResearchOutputTypeNode | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [createParent, setCreateParent] = useState<ResearchOutputTypeNode | null>(null);

  const [rule, setRule] = useState<RuleDTO | null>(null);
  const [ruleLoading, setRuleLoading] = useState(false);

  const [typeLoading, setTypeLoading] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const loadTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const data = await fetchTree();
      setTreeData(data);
      setUseDemoMode(false);
    } catch (error: any) {
      setTreeData(MOCK_TREE);
      setUseDemoMode(true);
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const findNodeById = (
    nodes: ResearchOutputTypeNode[],
    id: number
  ): ResearchOutputTypeNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const loadRule = useCallback(async (nodeId: number) => {
    setRuleLoading(true);
    try {
      const data = await getRule(nodeId);
      setRule(data);
    } catch (error: any) {
      message.error(error.message || 'Không thể tải rule');
      setRule(null);
    } finally {
      setRuleLoading(false);
    }
  }, []);

  const handleSelectNode = useCallback(
    (node: ResearchOutputTypeNode | null) => {
      setSelectedNode(node);
      setIsCreating(false);
      setCreateParent(null);
      setRule(null);

      if (node) {
        const isLeaf = !node.children || node.children.length === 0;
        if (isLeaf) {
          loadRule(node.id);
        }
      }
    },
    [loadRule]
  );

  const handleAddRoot = () => {
    setIsCreating(true);
    setCreateParent(null);
    setSelectedNode(null);
    setRule(null);
  };

  const handleAddChild = () => {
    if (selectedNode && selectedNode.level < 3) {
      setIsCreating(true);
      setCreateParent(selectedNode);
      setSelectedNode(null);
      setRule(null);
    }
  };

  const handleReload = () => {
    loadTree();
    setSelectedNode(null);
    setIsCreating(false);
    setCreateParent(null);
    setRule(null);
  };

  const addNodeToTree = (
    nodes: ResearchOutputTypeNode[],
    parentId: number | null,
    newNode: ResearchOutputTypeNode
  ): ResearchOutputTypeNode[] => {
    if (parentId === null) {
      return [...nodes, newNode].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return nodes.map((n) => {
      if (n.id === parentId) {
        const children = [...(n.children || []), newNode].sort((a, b) => a.sortOrder - b.sortOrder);
        return { ...n, children };
      }
      return { ...n, children: addNodeToTree(n.children || [], parentId, newNode) };
    });
  };

  const updateNodeInTree = (
    nodes: ResearchOutputTypeNode[],
    id: number,
    updates: Partial<ResearchOutputTypeNode>
  ): ResearchOutputTypeNode[] => {
    return nodes.map((n) => {
      if (n.id === id) return { ...n, ...updates };
      return { ...n, children: updateNodeInTree(n.children || [], id, updates) };
    });
  };

  const removeNodeFromTree = (nodes: ResearchOutputTypeNode[], id: number): ResearchOutputTypeNode[] => {
    return nodes
      .filter((n) => n.id !== id)
      .map((n) => ({ ...n, children: removeNodeFromTree(n.children || [], id) }));
  };

  const handleSaveType = async (values: CreateTypePayload | UpdateTypePayload) => {
    setTypeLoading(true);
    try {
      if (useDemoMode) {
        if (isCreating) {
          const payload = values as CreateTypePayload;
          const newNode: ResearchOutputTypeNode = {
            id: nextId++,
            code: payload.code,
            name: payload.name,
            level: payload.level,
            sortOrder: payload.sortOrder ?? 1,
            isActive: payload.isActive ?? true,
            hasRule: false,
            children: [],
          };
          setTreeData((prev) => addNodeToTree(prev, payload.parentId ?? null, newNode));
          message.success('Đã tạo loại kết quả mới (demo)');
          setIsCreating(false);
          setCreateParent(null);
        } else if (selectedNode) {
          const payload = values as UpdateTypePayload;
          setTreeData((prev) =>
            updateNodeInTree(prev, selectedNode.id, {
              code: payload.code,
              name: payload.name,
              sortOrder: payload.sortOrder,
              isActive: payload.isActive,
            })
          );
          setSelectedNode({ ...selectedNode, ...payload });
          message.success('Đã cập nhật (demo)');
        }
      } else {
        if (isCreating) {
          await createType(values as CreateTypePayload);
          message.success('Đã tạo loại kết quả mới');
          setIsCreating(false);
          setCreateParent(null);
        } else if (selectedNode) {
          await updateType(selectedNode.id, values as UpdateTypePayload);
          message.success('Đã cập nhật');
        }
        await loadTree();
        if (selectedNode) {
          const updatedNode = findNodeById(treeData, selectedNode.id);
          if (updatedNode) setSelectedNode(updatedNode);
        }
      }
    } catch (error: any) {
      message.error(error.message || 'Lỗi lưu dữ liệu');
    } finally {
      setTypeLoading(false);
    }
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (cascade: boolean) => {
    if (!selectedNode) return;

    setTypeLoading(true);
    try {
      if (useDemoMode) {
        const hasChildren = selectedNode.children && selectedNode.children.length > 0;
        if (hasChildren && !cascade) {
          message.error('Node có con. Hãy bật tuỳ chọn cascade để xoá.');
          setTypeLoading(false);
          return;
        }
        setTreeData((prev) => removeNodeFromTree(prev, selectedNode.id));
        message.success('Đã xoá (demo)');
        setDeleteModalOpen(false);
        setSelectedNode(null);
      } else {
        await deleteType(selectedNode.id, cascade);
        message.success('Đã xoá');
        setDeleteModalOpen(false);
        setSelectedNode(null);
        await loadTree();
      }
    } catch (error: any) {
      if (error.message?.includes('409') || error.message?.includes('conflict')) {
        message.error('Không thể xoá vì có dữ liệu con. Hãy bật tuỳ chọn cascade.');
      } else {
        message.error(error.message || 'Lỗi xoá');
      }
    } finally {
      setTypeLoading(false);
    }
  };

  const handleMove = () => {
    setMoveModalOpen(true);
  };

  const moveNodeInTree = (
    nodes: ResearchOutputTypeNode[],
    nodeId: number,
    newParentId: number | null,
    newSortOrder: number
  ): { tree: ResearchOutputTypeNode[]; node?: ResearchOutputTypeNode } => {
    let extracted: ResearchOutputTypeNode | null = null;
    const remove = (list: ResearchOutputTypeNode[]): ResearchOutputTypeNode[] => {
      const result: ResearchOutputTypeNode[] = [];
      for (const n of list) {
        if (n.id === nodeId) {
          extracted = { ...n, sortOrder: newSortOrder, children: n.children || [] };
        } else {
          result.push({ ...n, children: remove(n.children || []) });
        }
      }
      return result;
    };
    const cleared = remove(JSON.parse(JSON.stringify(nodes)));
    if (!extracted) return { tree: nodes };
    const add = (list: ResearchOutputTypeNode[], parentId: number | null): ResearchOutputTypeNode[] => {
      if (parentId === null) {
        return [...list, extracted!].sort((a, b) => a.sortOrder - b.sortOrder);
      }
      return list.map((n) => {
        if (n.id === parentId) {
          const children = [...(n.children || []), extracted!].sort((a, b) => a.sortOrder - b.sortOrder);
          return { ...n, children };
        }
        return { ...n, children: add(n.children || [], parentId) };
      });
    };
    const newTree = add(cleared, newParentId);
    const node = findNodeById(newTree, nodeId);
    return { tree: newTree, node: node || undefined };
  };

  const handleMoveConfirm = async (payload: MoveTypePayload) => {
    if (!selectedNode) return;

    const newLevel = payload.newParentId === null ? 1 : (findNodeById(treeData, payload.newParentId)?.level ?? 0) + 1;
    if (newLevel > 3) {
      message.error('Không thể di chuyển: vượt quá level 3');
      return;
    }

    setTypeLoading(true);
    try {
      if (useDemoMode) {
        const { tree, node } = moveNodeInTree(treeData, selectedNode.id, payload.newParentId, payload.newSortOrder);
        setTreeData(tree);
        if (node) setSelectedNode({ ...node, level: newLevel as 1 | 2 | 3 });
        message.success('Đã di chuyển (demo)');
      } else {
        await moveType(selectedNode.id, payload);
        message.success('Đã di chuyển');
        await loadTree();
        setSelectedNode(null);
      }
      setMoveModalOpen(false);
    } catch (error: any) {
      message.error(error.message || 'Lỗi di chuyển');
    } finally {
      setTypeLoading(false);
    }
  };

  const handleCreateRule = () => {
    setRule({
      id: 0,
      typeId: selectedNode?.id || 0,
      ruleKind: 'FIXED',
      meta: {},
      createdAt: '',
      updatedAt: '',
    });
  };

  const handleSaveRule = async (payload: UpsertRulePayload) => {
    if (!selectedNode) return;

    setRuleLoading(true);
    try {
      const saved = await upsertRule(selectedNode.id, payload);
      setRule(saved);
      message.success('Đã lưu rule');
      await loadTree();
    } catch (error: any) {
      message.error(error.message || 'Lỗi lưu rule');
    } finally {
      setRuleLoading(false);
    }
  };

  const isLeaf = selectedNode && (!selectedNode.children || selectedNode.children.length === 0);

  return (
    <div className="research-output-types">
      {useDemoMode && (
        <Alert
          type="info"
          message="Chế độ demo"
          description="API chưa sẵn sàng. Bạn có thể thêm, sửa, xoá, di chuyển để thử nghiệm giao diện. Dữ liệu chỉ lưu tạm trên trình duyệt."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      <Row gutter={16} className="main-row">
        <Col xs={24} lg={8} xl={7} className="tree-col">
          <Card bordered={false} className="tree-card">
            <TreePanel
              treeData={treeData}
              loading={treeLoading}
              selectedNode={selectedNode}
              onSelect={handleSelectNode}
              onAddRoot={handleAddRoot}
              onAddChild={handleAddChild}
              onReload={handleReload}
            />
          </Card>
        </Col>

        <Col xs={24} lg={16} xl={17} className="detail-col">
          {!selectedNode && !isCreating ? (
            <Card bordered={false}>
              <Empty description="Chọn một loại kết quả từ cây bên trái để xem chi tiết" />
            </Card>
          ) : (
            <>
              <Card
                title="Thông tin loại kết quả"
                bordered={false}
                className="detail-card"
              >
                <TypeForm
                  node={selectedNode}
                  isCreating={isCreating}
                  parentNode={createParent}
                  loading={typeLoading}
                  onSave={handleSaveType}
                  onDelete={handleDelete}
                  onMove={handleMove}
                />
              </Card>

              {!isCreating && selectedNode && (
                <Card
                  title="Rule quy đổi"
                  bordered={false}
                  className="detail-card"
                  style={{ marginTop: 16 }}
                >
                  {isLeaf ? (
                    ruleLoading ? (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <Spin tip="Đang tải rule..." />
                      </div>
                    ) : (
                      <RuleForm
                        rule={rule}
                        loading={ruleLoading}
                        onSave={handleSaveRule}
                        onCreate={handleCreateRule}
                      />
                    )
                  ) : (
                    <Alert
                      type="info"
                      message="Chỉ node lá mới có rule"
                      description="Node này có con, không thể gắn rule quy đổi. Chỉ các node lá (không có con) mới được cấu hình rule."
                      showIcon
                    />
                  )}
                </Card>
              )}
            </>
          )}
        </Col>
      </Row>

      <MoveModal
        open={moveModalOpen}
        node={selectedNode}
        treeData={treeData}
        loading={typeLoading}
        onCancel={() => setMoveModalOpen(false)}
        onOk={handleMoveConfirm}
      />

      <DeleteModal
        open={deleteModalOpen}
        node={selectedNode}
        loading={typeLoading}
        onCancel={() => setDeleteModalOpen(false)}
        onOk={handleDeleteConfirm}
      />
    </div>
  );
};

export default ResearchOutputTypes;
