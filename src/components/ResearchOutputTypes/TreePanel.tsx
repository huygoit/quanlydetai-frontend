/**
 * TreePanel - Tree view for Research Output Types
 * Dùng List thay Tree để đảm bảo click hoạt động ổn định
 */
import React, { useMemo, useState, useEffect } from 'react';
import { Input, Button, Space, Tag, Empty, Spin } from 'antd';
import { PlusOutlined, ReloadOutlined, FolderOutlined, FileOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import type { ResearchOutputTypeNode } from '@/types/researchOutputs';
import './TreePanel.less';

const { Search } = Input;

interface TreePanelProps {
  treeData: ResearchOutputTypeNode[];
  loading: boolean;
  selectedNode: ResearchOutputTypeNode | null;
  onSelect: (node: ResearchOutputTypeNode | null) => void;
  onAddRoot: () => void;
  onAddChild: () => void;
  onReload: () => void;
}

const TreePanel: React.FC<TreePanelProps> = ({
  treeData,
  loading,
  selectedNode,
  onSelect,
  onAddRoot,
  onAddChild,
  onReload,
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (treeData.length > 0 && expandedIds.size === 0) {
      setExpandedIds(new Set(treeData.map((n) => n.id)));
    }
  }, [treeData]);

  const filterTree = (
    nodes: ResearchOutputTypeNode[],
    search: string
  ): ResearchOutputTypeNode[] => {
    if (!search.trim()) return nodes;
    const lowerSearch = search.toLowerCase();
    return nodes
      .map((node) => {
        const matchSelf =
          node.code.toLowerCase().includes(lowerSearch) ||
          node.name.toLowerCase().includes(lowerSearch);
        const filteredChildren = filterTree(node.children || [], search);
        if (matchSelf || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter(Boolean) as ResearchOutputTypeNode[];
  };

  const filteredData = useMemo(
    () => filterTree(treeData, searchValue),
    [treeData, searchValue]
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const TreeNodeRow: React.FC<{
    node: ResearchOutputTypeNode;
    depth: number;
  }> = ({ node, depth }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedNode?.id === node.id;
    return (
      <div key={node.id}>
        <div
          className={`tree-row ${isSelected ? 'tree-row-selected' : ''}`}
          style={{ paddingLeft: 12 + depth * 24 }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node);
          }}
        >
          <span
            className="tree-row-expand"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(node.id);
            }}
          >
            {hasChildren ? (
              isExpanded ? <DownOutlined /> : <RightOutlined />
            ) : (
              <span style={{ width: 14, display: 'inline-block' }} />
            )}
          </span>
          {hasChildren ? <FolderOutlined className="tree-row-icon" /> : <FileOutlined className="tree-row-icon" />}
          <span className="tree-row-text">
            <strong>{node.code}</strong> — {node.name}
          </span>
          <Space size={4} className="tree-row-tags">
            {!hasChildren && <Tag color="blue">Lá</Tag>}
            {node.hasRule && <Tag color="green">Rule</Tag>}
            {!node.isActive && <Tag color="red">Ẩn</Tag>}
          </Space>
        </div>
        {hasChildren && isExpanded &&
          node.children!.map((child) => <TreeNodeRow key={child.id} node={child} depth={depth + 1} />)}
      </div>
    );
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (value) {
      const getAllIds = (nodes: ResearchOutputTypeNode[]): number[] =>
        nodes.flatMap((n) => [n.id, ...(n.children ? getAllIds(n.children) : [])]);
      setExpandedIds(new Set(getAllIds(treeData)));
    }
  };

  const canAddChild = selectedNode && selectedNode.level < 3;

  return (
    <div className="tree-panel">
      <div className="tree-panel-header">
        <Search
          placeholder="Tìm theo mã hoặc tên..."
          allowClear
          onSearch={handleSearch}
          onChange={(e) => !e.target.value && setSearchValue('')}
          style={{ marginBottom: 12 }}
        />
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={onAddRoot}>
            Thêm nhóm (L1)
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={onAddChild}
            disabled={!canAddChild}
            title={!canAddChild ? 'Chọn một mục có level < 3' : undefined}
          >
            Thêm con
          </Button>
          <Button icon={<ReloadOutlined />} onClick={onReload}>
            Tải lại
          </Button>
        </Space>
      </div>

      <div className="tree-panel-content">
        {loading ? (
          <div className="tree-loading">
            <Spin tip="Đang tải..." />
          </div>
        ) : filteredData.length === 0 ? (
          <Empty description="Chưa có dữ liệu" />
        ) : (
          <div className="tree-list">
            {filteredData.map((node) => (
              <TreeNodeRow key={node.id} node={node} depth={0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreePanel;
