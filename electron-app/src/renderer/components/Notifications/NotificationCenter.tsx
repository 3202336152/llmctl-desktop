import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  List,
  Select,
  Switch,
  Empty,
  Spin,
  Pagination,
  Divider,
  Tag,
  Dropdown,
  Modal
} from 'antd';
import {
  FilterOutlined,
  ReloadOutlined,
  DeleteOutlined,
  CheckOutlined,
  SettingOutlined,
  DownOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  batchDeleteNotifications,
  clearNotifications,
  setFilter,
  updateSettings
} from '../../store/slices/notificationSlice';
import { NotificationType, NotificationPriority, Notification } from './types';
import NotificationItem from './NotificationItem';
import './NotificationCenter.css';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * 通知中心页面
 */
const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    filter,
    settings,
    lastUpdated
  } = useAppSelector(state => state.notification);

  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // 加载通知列表
  const loadNotifications = useCallback(() => {
    dispatch(fetchNotifications(filter));
  }, [dispatch, filter]);

  // 刷新未读数量
  const refreshUnreadCount = useCallback(() => {
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  // 初始化和自动刷新
  useEffect(() => {
    loadNotifications();
    refreshUnreadCount();

    // 自动刷新
    if (settings.autoRefresh) {
      const interval = setInterval(() => {
        loadNotifications();
        refreshUnreadCount();
      }, settings.refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [loadNotifications, refreshUnreadCount, settings.autoRefresh, settings.refreshInterval]);

  // 处理类型过滤
  const handleTypeChange = (type: NotificationType | undefined) => {
    dispatch(setFilter({ type, page: 1 }));
  };

  // 处理未读过滤
  const handleUnreadOnlyChange = (unreadOnly: boolean) => {
    dispatch(setFilter({ unreadOnly, page: 1 }));
  };

  // 处理分页
  const handlePageChange = (page: number, pageSize?: number) => {
    dispatch(setFilter({ page, size: pageSize }));
  };

  // 标记所有为已读
  const handleMarkAllAsRead = () => {
    Modal.confirm({
      title: '确认操作',
      content: '确定要将所有通知标记为已读吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        dispatch(markAllAsRead());
      }
    });
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedNotifications.length === 0) return;

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedNotifications.length} 条通知吗？`,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        dispatch(batchDeleteNotifications(selectedNotifications));
        setSelectedNotifications([]);
      }
    });
  };

  // 清空所有通知
  const handleClearAll = () => {
    Modal.confirm({
      title: '确认清空',
      content: '确定要清空所有通知吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      onOk: () => {
        dispatch(clearNotifications());
        setSelectedNotifications([]);
      }
    });
  };

  // 更新设置
  const handleUpdateSettings = (key: string, value: any) => {
    dispatch(updateSettings({ [key]: value }));
  };

  // 处理通知点击
  const handleNotificationClick = (actionUrl?: string) => {
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  // 批量选择
  const handleSelectNotification = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, id]);
    } else {
      setSelectedNotifications(prev => prev.filter(n => n !== id));
    }
  };

  // 全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNotifications(notifications.map(n => n.id));
    } else {
      setSelectedNotifications([]);
    }
  };

  // 获取类型过滤选项
  const getTypeOptions = () => [
    { label: '全部', value: undefined },
    { label: '系统通知', value: NotificationType.SYSTEM },
    { label: '会话提醒', value: NotificationType.SESSION },
    { label: '统计报告', value: NotificationType.STATISTICS },
    { label: '警告消息', value: NotificationType.WARNING },
    { label: '成功消息', value: NotificationType.SUCCESS },
    { label: '错误消息', value: NotificationType.ERROR }
  ];

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <div className="notification-center-title">
          <Title level={3} style={{ margin: 0 }}>
            <BellOutlined /> 通知中心
          </Title>
          {unreadCount > 0 && (
            <Tag color="red" style={{ marginLeft: 16 }}>
              {unreadCount} 条未读
            </Tag>
          )}
        </div>

        <div className="notification-center-actions">
          <Space>
            <Select
              placeholder="通知类型"
              value={filter.type}
              onChange={handleTypeChange}
              style={{ width: 120 }}
              allowClear
            >
              {getTypeOptions().map(option => (
                <Option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>

            <Switch
              checkedChildren="仅未读"
              unCheckedChildren="全部"
              checked={filter.unreadOnly}
              onChange={handleUnreadOnlyChange}
            />

            <Button
              icon={<ReloadOutlined />}
              onClick={loadNotifications}
              loading={loading}
            >
              刷新
            </Button>

            <Button
              icon={<SettingOutlined />}
              onClick={() => setShowSettings(true)}
            >
              设置
            </Button>

            <Dropdown
              menu={{
                items: [
                  {
                    key: 'markAllRead',
                    label: '全部已读',
                    icon: <CheckOutlined />,
                    onClick: handleMarkAllAsRead,
                    disabled: unreadCount === 0
                  },
                  {
                    key: 'batchDelete',
                    label: '批量删除',
                    icon: <DeleteOutlined />,
                    onClick: handleBatchDelete,
                    disabled: selectedNotifications.length === 0,
                    danger: true
                  },
                  {
                    key: 'clearAll',
                    label: '清空所有',
                    icon: <DeleteOutlined />,
                    onClick: handleClearAll,
                    disabled: notifications.length === 0,
                    danger: true
                  }
                ]
              }}
            >
              <Button icon={<DownOutlined />}>
                更多操作
              </Button>
            </Dropdown>
          </Space>
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {selectedNotifications.length > 0 && (
        <div className="notification-center-batch-actions">
          <Space>
            <Text>已选择 {selectedNotifications.length} 项</Text>
            <Button size="small" onClick={() => handleSelectAll(true)}>
              全选
            </Button>
            <Button size="small" onClick={() => handleSelectAll(false)}>
              取消选择
            </Button>
            <Button
              size="small"
              type="primary"
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
            >
              删除选中
            </Button>
          </Space>
        </div>
      )}

      <div className="notification-center-content">
        {loading && notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>加载通知中...</Text>
            </div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <Text type="danger">加载失败: {error}</Text>
            <div style={{ marginTop: 16 }}>
              <Button type="primary" onClick={loadNotifications}>
                重试
              </Button>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            description="暂无通知"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <List
              dataSource={notifications}
              renderItem={(notification: Notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onActionClick={handleNotificationClick}
                />
              )}
            />

            {filter.total && filter.total > (filter.size || 20) && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={filter.page || 1}
                  total={filter.total}
                  pageSize={filter.size || 20}
                  onChange={handlePageChange}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total: number, range: [number, number]) =>
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* 设置弹窗 */}
      <Modal
        title="通知设置"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSettings(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={() => setShowSettings(false)}>
            确定
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>桌面通知</Text>
            <Switch
              checked={settings.enableDesktop}
              onChange={(checked: boolean) => handleUpdateSettings('enableDesktop', checked)}
              style={{ marginLeft: 16 }}
            />
          </div>

          <div>
            <Text strong>声音提醒</Text>
            <Switch
              checked={settings.enableSound}
              onChange={(checked: boolean) => handleUpdateSettings('enableSound', checked)}
              style={{ marginLeft: 16 }}
            />
          </div>

          <div>
            <Text strong>实时推送</Text>
            <Switch
              checked={settings.enableSSE}
              onChange={(checked: boolean) => handleUpdateSettings('enableSSE', checked)}
              style={{ marginLeft: 16 }}
            />
          </div>

          <div>
            <Text strong>自动刷新</Text>
            <Switch
              checked={settings.autoRefresh}
              onChange={(checked: boolean) => handleUpdateSettings('autoRefresh', checked)}
              style={{ marginLeft: 16 }}
            />
          </div>

          {settings.autoRefresh && (
            <div style={{ marginLeft: 120 }}>
              <Text>刷新间隔: {settings.refreshInterval} 秒</Text>
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default NotificationCenter;