import React, { useEffect, useMemo } from 'react';
import { Card, Button, Tabs, Space, Tag, Empty, message } from 'antd';
import {
  FolderOutlined,
  ExpandOutlined,
  CompressOutlined,
  DesktopOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import type { RootState } from '../../store';
import { closeTerminal, setActiveTab, toggleTerminalFullscreen, openTerminal } from '../../store/slices/sessionSlice';
import TerminalComponent from './TerminalComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

/**
 * 终端管理器 - 独立页面
 * 专门用于显示和管理所有打开的终端
 */
const TerminalManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sessions, createdTerminalSessions, openTerminalSessions, activeTabKey, terminalSessionData, isTerminalFullscreen } = useAppSelector((state: RootState) => state.session);

  // 如果没有打开的终端，检查是否有可用的会话
  const activeSessions = sessions.filter(s => s.status === 'active');

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'terminated':
        return 'red';
      default:
        return 'default';
    }
  };

  // 处理关闭终端
  const handleCloseTerminal = async (sessionId: string) => {
    try {
      // 1. 终止 Electron 端的 pty 进程
      await window.electronAPI.terminalKill(sessionId);
      console.log('[TerminalManager] 已终止 pty 进程:', sessionId);

      // 2. 调用后端 API，将 Session 状态改为非活跃
      const sessionAPI = (await import('../../services/api')).sessionAPI;
      await sessionAPI.terminateSession(sessionId);
      console.log('[TerminalManager] 已将 Session 状态改为非活跃:', sessionId);

      // 3. 从 Redux 中移除终端（关闭标签页）
      dispatch(closeTerminal(sessionId));

      // 检查关闭后是否还有其他打开的终端
      if (openTerminalSessions.length === 1 && isTerminalFullscreen) {
        // 如果关闭最后一个终端且当前处于全屏状态，自动退出全屏
        dispatch(toggleTerminalFullscreen());
      }

      // 如果关闭了最后一个终端，提示用户可以返回Sessions页面
      if (openTerminalSessions.length === 1) {
        message.info('终端已关闭，会话状态已更新为非活跃');
      }
    } catch (error) {
      console.error('[TerminalManager] 关闭终端失败:', error);
      message.error('关闭终端失败，请重试');
    }
  };

  // 生成标签页数据
  const tabItems = openTerminalSessions.map(sessionId => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return null;

    const workingDirName = session.workingDirectory.split(/[\\/]/).filter(Boolean).pop() || 'Terminal';

    return {
      key: sessionId,
      label: (
        <Space size={4}>
          <FolderOutlined />
          <span>{workingDirName}</span>
          <Tag color={getStatusColor(session.status)} style={{ marginLeft: 4, marginRight: 0 }}>
            {session.providerName || session.id.substring(0, 8)}
          </Tag>
        </Space>
      ),
      children: <div style={{ height: '100%' }} />,
      closable: true,
    };
  }).filter(item => item !== null);

  // 渲染所有已创建的终端实例
  // 使用 useMemo 避免不必要的重新创建
  const allTerminalComponents = useMemo(() => {
    return createdTerminalSessions.map(sessionId => {
      const session = terminalSessionData[sessionId];
      const isActive = openTerminalSessions.includes(sessionId) && activeTabKey === sessionId;

      const sessionData = session || {
        id: sessionId,
        command: 'claude',
        workingDirectory: 'D:\\',
        providerName: '',
        providerId: '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return (
        <div
          key={sessionId}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: isActive ? 10 : 1,
            visibility: openTerminalSessions.includes(sessionId) ? 'visible' : 'hidden',
          }}
        >
          <TerminalComponent
            sessionId={sessionId}
            command={sessionData.command}
            cwd={sessionData.workingDirectory}
            providerName={sessionData.providerName}
            showCard={false}
          />
        </div>
      );
    });
  }, [createdTerminalSessions, terminalSessionData, openTerminalSessions, activeTabKey]);

  // 空状态：没有打开的终端
  if (openTerminalSessions.length === 0) {
    return (
      <Card style={{ height: '100%' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('terminal.noTerminals', '没有打开的终端')}
        >
          <Button
            type="primary"
            icon={<DesktopOutlined />}
            onClick={() => navigate('/sessions')}
          >
            前往 Sessions 页面
          </Button>
        </Empty>
      </Card>
    );
  }

  // 有终端的情况：显示标签页和终端
  return (
    <div style={{
      position: isTerminalFullscreen ? 'fixed' : 'relative',
      top: isTerminalFullscreen ? 0 : 'auto',
      left: isTerminalFullscreen ? 0 : 'auto',
      right: isTerminalFullscreen ? 0 : 'auto',
      bottom: isTerminalFullscreen ? 0 : 'auto',
      zIndex: isTerminalFullscreen ? 1000 : 'auto',
      width: isTerminalFullscreen ? '100vw' : 'auto',
      height: isTerminalFullscreen ? '100vh' : 'calc(100vh - 160px)',
    }}>
      <Card
        className={isTerminalFullscreen ? 'fullscreen-terminal-card' : ''}
        style={{
          height: '100%',
          border: isTerminalFullscreen ? 'none' : undefined,
          borderRadius: isTerminalFullscreen ? 0 : undefined,
          boxShadow: isTerminalFullscreen ? 'none' : undefined,
        }}
        styles={{ body: { padding: 0, height: '100%', position: 'relative' } }}
      >
        {/* Tabs导航栏 */}
        <Tabs
          type="editable-card"
          activeKey={activeTabKey}
          onChange={(key: string) => dispatch(setActiveTab(key))}
          onEdit={(targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
            if (action === 'remove' && typeof targetKey === 'string') {
              handleCloseTerminal(targetKey);
            }
          }}
          items={tabItems as any}
          hideAdd
          size={isTerminalFullscreen ? 'small' : 'middle'}
          style={{
            height: 'auto',
            marginBottom: 0,
          }}
          tabBarStyle={{
            marginBottom: 0,
            paddingLeft: 16,
            paddingRight: 16,
            background: '#f5f5f5',
          }}
          tabBarExtraContent={
            <Button
              type="text"
              size={isTerminalFullscreen ? 'small' : 'middle'}
              icon={isTerminalFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => dispatch(toggleTerminalFullscreen())}
              title={isTerminalFullscreen ? '退出全屏 (F11)' : '全屏显示 (F11)'}
              style={{
                marginRight: 8,
              }}
            />
          }
        />

        {/* 所有终端实例容器 */}
        <div style={{
          position: 'absolute',
          top: isTerminalFullscreen ? '48px' : '56px',
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
        }}>
          {allTerminalComponents}
        </div>
      </Card>
    </div>
  );
};

export default TerminalManager;
