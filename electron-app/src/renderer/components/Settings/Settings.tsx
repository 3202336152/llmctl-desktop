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
        theme: 'light',
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
          case 'app.theme':
            formValues.theme = config.configValue;
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
        { configKey: 'app.theme', configValue: values.theme || 'light' },
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
            <Form.Item label={t('settings.theme')} name="theme">
              <Select>
                <Option value="light">{t('settings.themeLight')}</Option>
                <Option value="dark">{t('settings.themeDark')}</Option>
                <Option value="auto">{t('settings.themeAuto')}</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
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
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>v2.1.4</div>
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
              onClick={() => {
                window.electronAPI?.send('check-for-updates');
                message.info(t('settings.checkingUpdates'));
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
    </div>
  );
};

export default Settings;
