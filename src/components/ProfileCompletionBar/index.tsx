import React from 'react';
import { Progress, Tag, Space, Typography } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import './index.less';

const { Text } = Typography;

export interface ChecklistItem {
  key: string;
  label: string;
  done: boolean;
  tabKey?: string;
}

interface ProfileCompletionBarProps {
  completeness: number;
  checklist: ChecklistItem[];
  onItemClick?: (item: ChecklistItem) => void;
}

const ProfileCompletionBar: React.FC<ProfileCompletionBarProps> = ({
  completeness,
  checklist,
  onItemClick,
}) => {
  const handleItemClick = (item: ChecklistItem) => {
    if (onItemClick && item.tabKey) {
      onItemClick(item);
    }
  };

  return (
    <div className="profile-completion-bar">
      <div className="completion-progress">
        <Progress
          type="circle"
          percent={completeness}
          width={56}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          format={(percent) => (
            <span className="progress-text">{percent}%</span>
          )}
        />
        <div className="completion-label">
          <Text strong>Hoàn thiện hồ sơ</Text>
          <Text type="secondary" className="completion-hint">
            Nhấn vào mục để cập nhật
          </Text>
        </div>
      </div>

      <div className="completion-checklist">
        <Space wrap size={[8, 8]}>
          {checklist.map((item) => (
            <Tag
              key={item.key}
              className={`checklist-tag ${item.done ? 'done' : 'pending'} ${item.tabKey ? 'clickable' : ''}`}
              icon={item.done ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              color={item.done ? 'success' : 'warning'}
              onClick={() => handleItemClick(item)}
            >
              {item.label}
            </Tag>
          ))}
        </Space>
      </div>
    </div>
  );
};

export default ProfileCompletionBar;

export { ProfileCompletionBar };
export type { ProfileCompletionBarProps };
