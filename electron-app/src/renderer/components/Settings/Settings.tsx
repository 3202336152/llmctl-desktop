import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Switch,
  Select,
  message,
  Divider,
  Row,
  Col,
  Space,
  Modal,
  Typography,
  Popconfirm,
  Statistic,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import {
  ExportOutlined,
  DownloadOutlined,
  FileOutlined,
  GithubOutlined,
  UploadOutlined,
  RocketOutlined,
  HeartOutlined,
  SafetyCertificateOutlined,
  BugOutlined,
  BookOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { configAPI } from '../../services/api';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const Settings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [exportContent, setExportContent] = useState<string>('');
  const [importContent, setImportContent] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'bash' | 'powershell' | 'cmd' | 'json'>('json');
  const [importFormat, setImportFormat] = useState<'bash' | 'powershell' | 'cmd' | 'json'>('json');

  // 归档管理状态
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveModalVisible, setArchiveModalVisible] = useState(false);
  const [workingDirectoryForArchive, setWorkingDirectoryForArchive] = useState<string>('');
  const [archives, setArchives] = useState<Array<{ sessionId: string; archivedAt: number; size: number }>>([]);
  const [totalArchiveSize, setTotalArchiveSize] = useState<number>(0);

  // 加载设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await configAPI.getGlobalConfigs();
      const configs = response.data || [];

      // 将配置转换为表单值
      const formValues: any = {
        autoStart: false,
        minimizeToTray: true,
        showNotifications: true,
        language: 'zh',
      };

      configs.forEach(config => {
        switch (config.configKey) {
          case 'app.auto_start':
            formValues.autoStart = config.configValue === 'true';
            break;
          case 'app.minimize_to_tray':
            formValues.minimizeToTray = config.configValue === 'true';
            break;
          case 'app.show_notifications':
            formValues.showNotifications = config.configValue === 'true';
            break;
          case 'app.language':
            formValues.language = config.configValue;
            // 应用语言设置
            i18n.changeLanguage(config.configValue);
            break;
        }
      });

      form.setFieldsValue(formValues);
    } catch (error) {
      console.error('加载设置失败:', error);
    }
  };

  // 保存设置
  const handleSaveSettings = async () => {
    try {
      setSaveLoading(true);
      const values = form.getFieldsValue();

      // 构造配置数组
      const configs = [
        { configKey: 'app.auto_start', configValue: String(values.autoStart || false) },
        { configKey: 'app.minimize_to_tray', configValue: String(values.minimizeToTray || false) },
        { configKey: 'app.show_notifications', configValue: String(values.showNotifications || false) },
        { configKey: 'app.language', configValue: values.language || 'zh' },
      ];

      await configAPI.setBatchGlobalConfigs(configs);
      message.success(t('settings.settingsSaved'));

      // 应用语言切换
      if (values.language && values.language !== i18n.language) {
        i18n.changeLanguage(values.language);
        // 通知主进程更新菜单语言
        window.electronAPI?.send('set-menu-language', values.language);
      }

      // 应用最小化到托盘设置
      if (values.minimizeToTray !== undefined) {
        window.electronAPI?.send('enable-tray', values.minimizeToTray);
      }
    } catch (error) {
      message.error(`${t('settings.settingsSaveFailed')}: ${error}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // 导出配置（显示在弹窗）
  const handleExportConfig = async (format: 'bash' | 'powershell' | 'cmd' | 'json') => {
    try {
      setExportLoading(true);
      const response = await configAPI.exportConfig(format);
      setExportContent(response.data?.content || '');
      setExportFormat(format);
      setExportModalVisible(true);
    } catch (error) {
      message.error(`${t('settings.exportFailed')}: ${error}`);
    } finally {
      setExportLoading(false);
    }
  };

  // 下载配置文件
  const handleDownloadConfig = () => {
    const fileExtensions = {
      bash: '.sh',
      powershell: '.ps1',
      cmd: '.bat',
      json: '.json',
    };

    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `llmctl-config${fileExtensions[exportFormat]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success(t('settings.configDownloaded'));
  };

  // 打开导入配置Modal
  const handleOpenImportModal = (format: 'bash' | 'powershell' | 'cmd' | 'json') => {
    setImportFormat(format);
    setImportContent('');
    setImportModalVisible(true);
  };

  // 导入配置
  const handleImportConfig = async () => {
    if (!importContent.trim()) {
      message.error(t('settings.importContentEmpty'));
      return;
    }

    try {
      setImportLoading(true);
      await configAPI.importConfig({
        format: importFormat,
        data: importContent,
        overwrite: true,
      });
      message.success(t('settings.importSuccess'));
      setImportModalVisible(false);
      setImportContent('');
    } catch (error) {
      message.error(`${t('settings.importFailed')}: ${error}`);
    } finally {
      setImportLoading(false);
    }
  };

  // 打开归档管理Modal
  const handleOpenArchiveModal = async () => {
    // 请求用户选择工作目录
    const result = await window.electronAPI?.selectDirectory();
    if (result.canceled || !result.path) {
      return;
    }

    let workingDir = result.path;

    // ✅ 智能检测：如果用户选择的是归档目录本身，自动修正为项目根目录
    if (workingDir.endsWith('.codex-sessions\\archived') || workingDir.endsWith('.codex-sessions/archived')) {
      // 移除末尾的 /.codex-sessions/archived
      workingDir = workingDir.replace(/[\/\\]\.codex-sessions[\/\\]archived$/, '');
      message.info(`已自动修正为项目根目录: ${workingDir}`);
    } else if (workingDir.endsWith('.codex-sessions')) {
      // 移除末尾的 /.codex-sessions
      workingDir = workingDir.replace(/[\/\\]\.codex-sessions$/, '');
      message.info(`已自动修正为项目根目录: ${workingDir}`);
    }

    setWorkingDirectoryForArchive(workingDir);
    setArchiveModalVisible(true);
    loadArchives(workingDir);
  };

  // 加载归档列表
  const loadArchives = async (workingDirectory: string) => {
    try {
      setArchiveLoading(true);
      const result = await window.electronAPI?.listArchives(workingDirectory);
      if (result?.success) {
        setArchives(result.archives || []);
        // 计算总大小
        const totalSize = result.archives.reduce((sum, archive) => sum + archive.size, 0);
        setTotalArchiveSize(totalSize);
      } else {
        message.error(`加载归档失败: ${result?.error}`);
      }
    } catch (error) {
      message.error(`加载归档失败: ${error}`);
    } finally {
      setArchiveLoading(false);
    }
  };

  // 清理归档
  const handleCleanArchives = async (days: number) => {
    Modal.confirm({
      title: '确定要清理归档吗？',
      content: days === 0 ? '将删除所有归档会话，此操作不可恢复！' : `将删除 ${days} 天前的归档会话，此操作不可恢复！`,
      okText: '确定清理',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await window.electronAPI?.cleanArchives(workingDirectoryForArchive, days);
          if (result?.success) {
            message.success(`成功清理 ${result.deletedCount} 个归档`);
            // 重新加载归档列表
            loadArchives(workingDirectoryForArchive);
          } else {
            message.error(`清理归档失败: ${result?.error}`);
          }
        } catch (error) {
          message.error(`清理归档失败: ${error}`);
        }
      },
    });
  };

  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ==================== 日志管理 ====================

  /**
   * 打开日志文件目录
   */
  const handleOpenLogFolder = async () => {
    try {
      const logPath = await window.electronAPI.getLogPath();
      if (logPath) {
        // 打开日志文件所在的目录
        const logDir = logPath.substring(0, logPath.lastIndexOf('/') > 0 ? logPath.lastIndexOf('/') : logPath.lastIndexOf('\\'));
        await window.electronAPI.openPath(logDir);
        message.success('日志目录已打开');
      } else {
        message.error('无法获取日志路径');
      }
    } catch (error) {
      message.error(`打开日志目录失败: ${error}`);
    }
  };

  /**
   * 显示日志文件路径
   */
  const handleShowLogPath = async () => {
    try {
      const logPath = await window.electronAPI.getLogPath();
      if (logPath) {
        Modal.info({
          title: '日志文件路径',
          content: (
            <div>
              <Text code style={{ wordBreak: 'break-all' }}>
                {logPath}
              </Text>
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  💡 提示：可以直接在文件管理器中打开此路径查看日志文件
                </Text>
              </div>
            </div>
          ),
          width: 600,
        });
      } else {
        message.error('无法获取日志路径');
      }
    } catch (error) {
      message.error(`获取日志路径失败: ${error}`);
    }
  };

  // ==========================================

  // 归档表格列定义
  const archiveColumns = [
    {
      title: '会话ID',
      dataIndex: 'sessionId',
      key: 'sessionId',
      width: 300,
      render: (text: string) => (
        <Tooltip title={text}>
          <span style={{ fontFamily: 'monospace' }}>{text.substring(0, 16)}...</span>
        </Tooltip>
      ),
    },
    {
      title: '归档时间',
      dataIndex: 'archivedAt',
      key: 'archivedAt',
      width: 180,
      render: (timestamp: number) => formatDate(timestamp),
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => formatSize(size),
    },
    {
      title: '天数',
      key: 'days',
      width: 100,
      render: (_: any, record: { archivedAt: number }) => {
        const days = Math.floor((Date.now() - record.archivedAt) / (1000 * 60 * 60 * 24));
        return <Tag color={days > 30 ? 'red' : days > 10 ? 'orange' : 'green'}>{days} 天前</Tag>;
      },
    },
  ];

  // 打开项目主页
  const handleOpenProjectPage = () => {
    window.electronAPI?.openExternal('https://github.com/3202336152/llmctl-desktop');
  };

  const applicationSettings = (
    <Card title={t('settings.appSettings')}>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('settings.autoStart')} name="autoStart" valuePropName="checked">
              <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('settings.minimizeToTray')} name="minimizeToTray" valuePropName="checked">
              <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={t('settings.showNotifications')} name="showNotifications" valuePropName="checked">
              <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={t('settings.language')} name="language">
              <Select>
                <Option value="zh">{t('settings.languageZh')}</Option>
                <Option value="en">{t('settings.languageEn')}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Button type="primary" onClick={handleSaveSettings} loading={saveLoading}>
          {t('settings.saveSettings')}
        </Button>
      </Form>
    </Card>
  );

  const dataManagement = (
    <Card title={t('settings.dataManagement')}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <h4>
            <FileOutlined /> {t('settings.importConfig')}
          </h4>
          <Text type="secondary">
            <div>{t('settings.importConfigDesc')}</div>
          </Text>
          <div style={{ marginTop: 16 }}>
            <Space wrap>
              <Button
                icon={<UploadOutlined />}
                onClick={() => handleOpenImportModal('json')}
                loading={importLoading}
              >
                {t('settings.importJsonConfig')}
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => handleOpenImportModal('bash')}
                loading={importLoading}
              >
                {t('settings.importBashScript')}
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => handleOpenImportModal('powershell')}
                loading={importLoading}
              >
                {t('settings.importPowershellScript')}
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => handleOpenImportModal('cmd')}
                loading={importLoading}
              >
                {t('settings.importCmdScript')}
              </Button>
            </Space>
          </div>
        </div>

        <Divider />

        <div>
          <h4>{t('settings.exportConfig')}</h4>
          <Text type="secondary">{t('settings.exportConfigDesc')}</Text>
          <div style={{ marginTop: 16 }}>
            <Space wrap>
              <Button
                icon={<ExportOutlined />}
                onClick={() => handleExportConfig('json')}
                loading={exportLoading}
              >
                {t('settings.exportJsonConfig')}
              </Button>
              <Button icon={<ExportOutlined />} onClick={() => handleExportConfig('bash')} loading={exportLoading}>
                {t('settings.exportBashScript')}
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => handleExportConfig('powershell')}
                loading={exportLoading}
              >
                {t('settings.exportPowershellScript')}
              </Button>
              <Button icon={<ExportOutlined />} onClick={() => handleExportConfig('cmd')} loading={exportLoading}>
                {t('settings.exportCmdScript')}
              </Button>
            </Space>
          </div>
        </div>

        <Divider />

        <div>
          <h4>
            <FileOutlined /> 日志管理
          </h4>
          <Text type="secondary">
            查看应用运行日志，诊断问题和调试错误。日志文件包含前端、IPC 和后端的详细信息。
          </Text>
          <div style={{ marginTop: 16 }}>
            <Space wrap>
              <Button type="primary" icon={<FolderOutlined />} onClick={handleOpenLogFolder}>
                打开日志目录
              </Button>
              <Button icon={<FileOutlined />} onClick={handleShowLogPath}>
                显示日志路径
              </Button>
            </Space>
          </div>
          <div style={{ marginTop: 12 }}>
            <Text type="warning" style={{ fontSize: '12px' }}>
              📝 日志说明：
              <ul style={{ marginTop: 4, marginBottom: 0 }}>
                <li>主进程日志：Electron 应用、IPC 通信、文件操作</li>
                <li>渲染进程日志：前端应用、用户操作、API 调用</li>
                <li>后端日志：Spring Boot 服务、数据库操作、业务逻辑</li>
              </ul>
            </Text>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: 8, display: 'block' }}>
              💡 日志级别策略：
              <ul style={{ marginTop: 4, marginBottom: 0 }}>
                <li><strong>开发模式</strong>：完整的 DEBUG 日志（10MB），包含所有操作细节</li>
                <li><strong>生产模式</strong>：仅记录 ERROR 日志（1MB），减少磁盘占用</li>
                <li><strong>调试模式</strong>：启动时添加 <code>--debug-logs</code> 参数，启用 INFO 日志（5MB）</li>
              </ul>
            </Text>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: 8, display: 'block' }}>
              🔧 启用调试模式：在应用快捷方式目标中添加 <code>--debug-logs</code> 参数，或通过命令行启动时附加该参数
            </Text>
          </div>
        </div>

        <Divider />

        <div>
          <h4>{t('settings.dataCleanup')}</h4>
          <Text type="secondary">{t('settings.dataCleanupDesc')}</Text>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={() => message.success(t('settings.logsCleaned'))}>{t('settings.cleanLogs')}</Button>
              <Button onClick={() => message.success(t('settings.cacheCleaned'))}>{t('settings.cleanCache')}</Button>
              <Popconfirm
                title={t('settings.resetDataConfirm')}
                description={t('settings.resetDataDesc')}
                onConfirm={() => message.success(t('settings.dataReset'))}
                okText={t('settings.resetDataButton')}
                cancelText={t('common.cancel')}
                okButtonProps={{ danger: true }}
              >
                <Button danger>{t('settings.resetAllData')}</Button>
              </Popconfirm>
            </Space>
          </div>
        </div>

        <Divider />

        <div>
          <h4>
            <FolderOutlined /> Codex 归档管理
          </h4>
          <Text type="secondary">
            查看和清理 Codex 会话归档，释放磁盘空间。归档保留了对话历史，可手动恢复。
          </Text>
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Text type="warning" style={{ fontSize: '12px' }}>
              ⚠️ 提示：请选择项目根目录（包含 .codex-sessions 文件夹的父目录），系统会自动检测归档。
            </Text>
          </div>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" icon={<FolderOutlined />} onClick={handleOpenArchiveModal}>
              打开归档管理
            </Button>
          </div>
        </div>
      </Space>
    </Card>
  );

  const aboutInfo = (
    <Card title={t('settings.aboutLlmctl')}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 版本信息卡片 */}
        <Row gutter={16}>
          <Col span={6}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              <div style={{ textAlign: 'center', color: 'white' }}>
                <RocketOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>v2.3.0</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{t('settings.version')}</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none',
              }}
            >
              <div style={{ textAlign: 'center', color: 'white' }}>
                <HeartOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>Liu Yifan</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{t('settings.author')}</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none',
              }}
            >
              <div style={{ textAlign: 'center', color: 'white' }}>
                <SafetyCertificateOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>MIT</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{t('settings.license')}</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card
              style={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                border: 'none',
              }}
            >
              <div style={{ textAlign: 'center', color: 'white' }}>
                <CheckCircleOutlined style={{ fontSize: '32px', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>Stable</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{t('settings.status')}</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* 快速链接 */}
        <div>
          <h4>
            <BookOutlined /> {t('settings.quickLinks')}
          </h4>
          <Space wrap style={{ marginTop: 16 }}>
            <Button type="primary" icon={<GithubOutlined />} onClick={handleOpenProjectPage}>
              {t('settings.viewProjectPage')}
            </Button>
            <Button
              icon={<BugOutlined />}
              onClick={() =>
                window.electronAPI?.openExternal('https://github.com/3202336152/llmctl-desktop/issues')
              }
            >
              {t('settings.reportIssue')}
            </Button>
            <Button
              icon={<BookOutlined />}
              onClick={() =>
                window.electronAPI?.openExternal('https://github.com/3202336152/llmctl-desktop/blob/master/README.md')
              }
            >
              {t('settings.viewDocumentation')}
            </Button>
            <Button
              icon={<SyncOutlined />}
              onClick={async () => {
                message.info(t('settings.checkingUpdates'));
                try {
                  const result = await window.electronAPI?.checkForUpdates();
                  if (!result?.success && result?.message) {
                    message.warning(result.message);
                  }
                } catch (error) {
                  message.error(`检查更新失败: ${error}`);
                }
              }}
            >
              {t('settings.checkUpdates')}
            </Button>
          </Space>
        </div>

        <Divider />

        {/* 项目信息 */}
        <div>
          <Text type="secondary">{t('settings.projectDescription')}</Text>
        </div>
      </Space>
    </Card>
  );

  return (
    <div>
      <Tabs defaultActiveKey="1">
        <TabPane tab={t('settings.appSettings')} key="1">
          {applicationSettings}
        </TabPane>
        <TabPane tab={t('settings.dataManagement')} key="2">
          {dataManagement}
        </TabPane>
        <TabPane tab={t('settings.about')} key="3">
          {aboutInfo}
        </TabPane>
      </Tabs>

      {/* 导入配置Modal */}
      <Modal
        title={t('settings.importConfigTitle', { format: importFormat.toUpperCase() })}
        open={importModalVisible}
        onCancel={() => setImportModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setImportModalVisible(false)}>
            {t('common.cancel')}
          </Button>,
          <Button key="import" type="primary" icon={<UploadOutlined />} onClick={handleImportConfig} loading={importLoading}>
            {t('settings.confirmImport')}
          </Button>,
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">{t('settings.importConfigHint')}</Text>
        </div>
        <TextArea
          value={importContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportContent(e.target.value)}
          placeholder={t('settings.importConfigPlaceholder')}
          rows={15}
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>

      {/* 导出配置Modal */}
      <Modal
        title={t('settings.exportConfigTitle', { format: exportFormat.toUpperCase() })}
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setExportModalVisible(false)}>
            {t('common.close')}
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadConfig}>
            {t('settings.downloadFile')}
          </Button>,
        ]}
      >
        <TextArea value={exportContent} readOnly rows={15} style={{ fontFamily: 'monospace' }} />
      </Modal>

      {/* 归档管理Modal */}
      <Modal
        title="Codex 归档管理"
        open={archiveModalVisible}
        onCancel={() => setArchiveModalVisible(false)}
        width={1000}
        footer={[
          <Button key="close" onClick={() => setArchiveModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 归档统计 */}
          <Row gutter={16}>
            <Col span={8}>
              <Card style={{ minHeight: '120px' }}>
                <Tooltip title={workingDirectoryForArchive} placement="top">
                  <Statistic
                    title="工作目录"
                    value={workingDirectoryForArchive.split(/[/\\]/).pop() || ''}
                    prefix={<FolderOutlined />}
                    valueStyle={{ fontSize: '18px' }}
                  />
                </Tooltip>
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ minHeight: '120px' }}>
                <Statistic
                  title="归档数量"
                  value={archives.length}
                  prefix={<DatabaseOutlined />}
                  suffix="个"
                  valueStyle={{ fontSize: '18px' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{ minHeight: '120px' }}>
                <Statistic
                  title="占用空间"
                  value={formatSize(totalArchiveSize)}
                  prefix={<DatabaseOutlined />}
                  valueStyle={{ fontSize: '18px' }}
                />
              </Card>
            </Col>
          </Row>

          <Divider />

          {/* 清理按钮 */}
          <div>
            <Space wrap>
              <Button danger icon={<DeleteOutlined />} onClick={() => handleCleanArchives(10)}>
                清理 10 天前
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => handleCleanArchives(20)}>
                清理 20 天前
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={() => handleCleanArchives(30)}>
                清理 30 天前
              </Button>
              <Button danger type="primary" icon={<DeleteOutlined />} onClick={() => handleCleanArchives(0)}>
                清理所有归档
              </Button>
            </Space>
          </div>

          <Divider />

          {/* 归档列表 */}
          <div>
            <h4>
              <ClockCircleOutlined /> 归档会话列表
            </h4>
            <Table
              columns={archiveColumns}
              dataSource={archives}
              rowKey="sessionId"
              loading={archiveLoading}
              pagination={{
                pageSize: 10,
                showQuickJumper: true,
                showSizeChanger: true,
                showTotal: (total: number) => `共 ${total} 个归档`,
              }}
              locale={{
                emptyText: '暂无归档会话',
              }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default Settings;
