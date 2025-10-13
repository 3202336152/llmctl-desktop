import React from 'react';
import { Badge, Button, Tooltip } from 'antd';
import { BellOutlined, NotificationOutlined } from '@ant-design/icons';
import { useAppSelector } from '../../store';
import { useNavigate } from 'react-router-dom';

interface NotificationIconProps {
  style?: React.CSSProperties;
}

/**
 * 通知图标组件
 * 显示未读通知数量和点击事件
 */
const NotificationIcon: React.FC<NotificationIconProps> = ({ style }) => {
  const navigate = useNavigate();
  const { unreadCount, sseConnected } = useAppSelector(state => state.notification);

  // 根据连接状态和未读数量确定图标颜色
  const getIconColor = () => {
    if (!sseConnected) {
      return '#d9d9d9'; // 灰色：未连接
    }
    if (unreadCount > 0) {
      return '#ff4d4f'; // 红色：有未读
    }
    return '#52c41a'; // 绿色：已连接且无未读
  };

  // 根据未读数量确定徽点大小
  const getBadgeSize = () => {
    if (unreadCount > 99) {
      return 'small'; // 显示 "99+"
    }
    return 'small';
  };

  // 获取显示的数字
  const getDisplayCount = () => {
    if (unreadCount > 99) {
      return '99+';
    }
    return unreadCount;
  };

  // 获取提示文本
  const getTooltipTitle = () => {
    if (!sseConnected) {
      return '通知中心（连接断开）';
    }
    if (unreadCount > 0) {
      return `通知中心（${unreadCount} 条未读）`;
    }
    return '通知中心（无新消息）';
  };

  // 处理点击事件
  const handleClick = () => {
    navigate('/notifications');
  };

  return (
    <Tooltip title={getTooltipTitle()} placement="bottom">
      <Badge
        count={getDisplayCount()}
        size={getBadgeSize()}
        offset={[0, 8]}
        style={{
          backgroundColor: unreadCount > 0 ? '#ff4d4f' : '#52c41a',
          boxShadow: unreadCount > 0 ? '0 0 0 1px #ff4d4f' : '0 0 0 1px #52c41a'
        }}
      >
        <Button
          type="text"
          icon={<BellOutlined />}
          onClick={handleClick}
          style={{
            fontSize: 16,
            width: 36,
            height: 36,
            color: getIconColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s',
            ...style
          }}
          className="notification-icon-button"
        />
      </Badge>
    </Tooltip>
  );
};

export default NotificationIcon;