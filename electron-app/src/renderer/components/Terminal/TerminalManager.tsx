import React, { useEffect, useMemo, useRef } from 'react';
import { Card, Button, Tabs, Space, Tag, Empty, message, Modal } from 'antd';
import {
  FolderOutlined,
  ExpandOutlined,
  CompressOutlined,
  DesktopOutlined,
  SwapOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store';
import type { RootState } from '../../store';
import { closeTerminal, setActiveTab, toggleTerminalFullscreen, openTerminal, addSession, removeSession, destroyTerminal } from '../../store/slices/sessionSlice';
import TerminalComponent from './TerminalComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { sessionAPI, tokenAPI } from '../../services/api';
import { StartSessionRequest } from '../../types';
import { writeMcpConfig } from '../../utils/mcpConfigHelper';

/**
 * 终端管理器 - 独立页面
 * 专门用于显示和管理所有打开的终端
 */
const TerminalManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { sessions, createdTerminalSessions, openTerminalSessions, activeTabKey, terminalSessionData, isTerminalFullscreen } = useAppSelector((state: RootState) => state.session);

  // ✅ 防止重复点击：记录正在关闭的 sessionId
  const closingSessionsRef = useRef<Set<string>>(new Set());

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
    // ✅ 防止重复点击
    if (closingSessionsRef.current.has(sessionId)) {
      console.log('[TerminalManager] 正在关闭该终端，忽略重复点击:', sessionId);
      return;
    }

    try {
      // 标记为正在关闭
      closingSessionsRef.current.add(sessionId);

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
    } finally {
      // ✅ 无论成功或失败，都要移除标记（延迟500ms，确保UI更新完成）
      setTimeout(() => {
        closingSessionsRef.current.delete(sessionId);
      }, 500);
    }
  };

  // ✅ 手动切换当前终端的 Token
  const handleManualSwitchToken = async () => {
    if (!activeTabKey) {
      message.warning('请先选择一个终端');
      return;
    }

    const currentSession = sessions.find(s => s.id === activeTabKey);
    if (!currentSession) {
      message.error('无法找到当前会话');
      return;
    }

    Modal.confirm({
      title: '手动切换 Token',
      content: `确定要为当前终端 "${currentSession.workingDirectory.split(/[\\/]/).filter(Boolean).pop()}" 切换 Token 吗？这将重启终端会话。`,
      okText: '确认切换',
      cancelText: '取消',
      onOk: async () => {
        try {
          message.loading({ content: '正在切换 Token...', key: 'switch-token', duration: 0 });

          // 1. 标记当前Token为不健康（如果存在）
          if (currentSession.tokenId) {
            try {
              console.log('[TerminalManager] 标记Token为不健康:', {
                providerId: currentSession.providerId,
                tokenId: currentSession.tokenId
              });
              await tokenAPI.updateTokenHealth(currentSession.providerId, currentSession.tokenId, false);
              console.log('[TerminalManager] ✅ Token健康状态已更新为不健康');
            } catch (error) {
              console.error('[TerminalManager] 更新Token健康状态失败:', error);
              // 不阻塞后续流程
            }
          }

          // 2. 终止Electron端的终端进程
          try {
            await window.electronAPI.terminalKill(activeTabKey);
          } catch (error) {
            console.error('[TerminalManager] 终止终端进程失败:', error);
          }

          // 3. 销毁前端终端实例
          dispatch(destroyTerminal(activeTabKey));

          // 4. 删除旧会话
          await sessionAPI.deleteSession(activeTabKey);
          dispatch(removeSession(activeTabKey));

          // 5. 创建新会话（使用相同配置）
          const newSessionRequest: StartSessionRequest = {
            providerId: currentSession.providerId,
            workingDirectory: currentSession.workingDirectory,
            command: currentSession.command,
          };

          const response = await sessionAPI.startSession(newSessionRequest);
          if (response.data) {
            dispatch(addSession(response.data));

            // ✅ 写入 MCP 配置文件到本地（跨平台兼容）
            await writeMcpConfig(
              response.data.id,
              currentSession.workingDirectory
            );

            dispatch(openTerminal(response.data.id));
            message.success({ content: 'Token 切换成功，会话已重启', key: 'switch-token' });
          } else {
            message.error({ content: '创建新会话失败', key: 'switch-token' });
          }
        } catch (error) {
          console.error('[TerminalManager] 切换Token失败:', error);
          message.error({ content: `切换Token失败: ${error}`, key: 'switch-token' });
        }
      },
    });
  };

  // ✅ 切换到外部终端
  const handleOpenExternalTerminal = async () => {
    if (!activeTabKey) {
      message.warning('请先选择一个终端');
      return;
    }

    const currentSession = sessions.find(s => s.id === activeTabKey);
    if (!currentSession) {
      message.error('无法找到当前会话');
      return;
    }

    Modal.confirm({
      title: '切换到外部终端',
      content: (
        <div>
          <p>确定要切换到系统外部终端吗？</p>
          <p style={{ marginTop: 8, color: '#666', fontSize: '13px' }}>
            ⚠️ 注意：
          </p>
          <ul style={{ color: '#666', fontSize: '13px', marginTop: 4, paddingLeft: 20 }}>
            <li>当前内置终端将被关闭</li>
            <li>会话状态将更新为"非活跃"</li>
            <li>外部终端关闭后，系统无法自动检测</li>
            <li>如需继续使用，请重新创建会话</li>
          </ul>
        </div>
      ),
      okText: '确认切换',
      cancelText: '取消',
      width: 480,
      onOk: async () => {
        try {
          message.loading({ content: '正在打开外部终端...', key: 'external-terminal', duration: 0 });

          // 1. ✅ 获取会话的环境变量
          let envVars: Record<string, string> = {};
          try {
            const envResponse = await sessionAPI.getSessionEnvironment(activeTabKey);
            if (envResponse.data) {
              envVars = envResponse.data;
              console.log('[TerminalManager] ✅ 获取到会话环境变量:', envVars);
            }
          } catch (error) {
            console.error('[TerminalManager] 获取环境变量失败:', error);
            message.warning('获取环境变量失败，外部终端将使用系统默认配置');
          }

          // 2. 打开外部终端（传递工作目录、命令和环境变量）
          const result = await window.electronAPI.openExternalTerminal({
            workingDirectory: currentSession.workingDirectory,
            command: currentSession.command || 'claude',
            env: envVars, // ✅ 传递环境变量
          });

          if (!result.success) {
            throw new Error('打开外部终端失败');
          }

          // 3. 关闭当前内置终端（这会自动将会话状态改为 inactive）
          await handleCloseTerminal(activeTabKey);

          message.success({
            content: '已切换到外部终端。注意：外部终端关闭后，请手动重新创建会话。',
            key: 'external-terminal',
            duration: 5,
          });
        } catch (error) {
          console.error('[TerminalManager] 切换到外部终端失败:', error);
          message.error({
            content: `切换失败: ${error}`,
            key: 'external-terminal',
          });
        }
      },
    });
  };

  // ✅ 快捷键支持：Ctrl+1/2/3 切换标签页，Ctrl+W 关闭当前标签页
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+W 关闭当前标签页
      if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
        // 检查焦点是否在终端页面上（避免干扰其他页面）
        const isTerminalPage = window.location.hash.includes('/terminals');
        if (isTerminalPage && activeTabKey && openTerminalSessions.length > 0) {
          event.preventDefault();
          handleCloseTerminal(activeTabKey);
        }
      }

      // Ctrl+数字键 切换标签页（Ctrl+1 切换到第一个标签，Ctrl+2 切换到第二个...）
      if ((event.ctrlKey || event.metaKey) && /^[1-9]$/.test(event.key)) {
        const isTerminalPage = window.location.hash.includes('/terminals');
        if (isTerminalPage) {
          event.preventDefault();
          const index = parseInt(event.key, 10) - 1; // 索引从0开始
          if (index < openTerminalSessions.length) {
            const targetSessionId = openTerminalSessions[index];
            dispatch(setActiveTab(targetSessionId));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, activeTabKey, openTerminalSessions]);

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
            <Space size="small">
              <Button
                type="text"
                size={isTerminalFullscreen ? 'small' : 'middle'}
                icon={<SwapOutlined />}
                onClick={handleManualSwitchToken}
                title="手动切换 Token"
                disabled={!activeTabKey || openTerminalSessions.length === 0}
              >
                {!isTerminalFullscreen && '切换 Token'}
              </Button>
              <Button
                type="text"
                size={isTerminalFullscreen ? 'small' : 'middle'}
                icon={<ExportOutlined />}
                onClick={handleOpenExternalTerminal}
                title="切换到外部终端"
                disabled={!activeTabKey || openTerminalSessions.length === 0}
              >
                {!isTerminalFullscreen && '外部终端'}
              </Button>
              <Button
                type="text"
                size={isTerminalFullscreen ? 'small' : 'middle'}
                icon={isTerminalFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => dispatch(toggleTerminalFullscreen())}
                title={isTerminalFullscreen ? '退出全屏 (F11)' : '全屏显示 (F11)'}
              />
            </Space>
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
