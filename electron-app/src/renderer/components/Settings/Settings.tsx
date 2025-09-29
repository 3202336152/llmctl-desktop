import React, { useState } from 'react';
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
  Upload,
  Typography,
} from 'antd';
import {
  ExportOutlined,
  ImportOutlined,
  UploadOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { configAPI } from '../../services/api';
import { ConfigExportResponse, ConfigImportRequest } from '../../types';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportContent, setExportContent] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'bash' | 'powershell' | 'cmd' | 'json'>('bash');

  const handleExportConfig = async (format: 'bash' | 'powershell' | 'cmd' | 'json') => {
    try {
      setExportLoading(true);
      const response = await configAPI.exportConfig(format);
      setExportContent(response.data?.content || '');
      setExportFormat(format);
      setExportModalVisible(true);
    } catch (error) {
      message.error(`导出配置失败: ${error}`);
    } finally {
      setExportLoading(false);
    }
  };

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
    message.success('配置文件下载成功');
  };

  const handleImportConfig = async (file: File) => {
    try {
      setImportLoading(true);
      const text = await file.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        message.error('文件格式错误，请选择有效的JSON配置文件');
        return;
      }

      const request: ConfigImportRequest = {
        format: 'json',
        data,
      };

      await configAPI.importConfig(request);
      message.success('配置导入成功');
    } catch (error) {
      message.error(`导入配置失败: ${error}`);
    } finally {
      setImportLoading(false);
    }
  };

  const beforeUpload = (file: File) => {
    handleImportConfig(file);
    return false; // 阻止自动上传
  };

  const applicationSettings = (
    <Card title="应用设置">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          autoStart: false,
          minimizeToTray: true,
          showNotifications: true,
          theme: 'light',
          language: 'zh',
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="开机自启动" name="autoStart" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="最小化到系统托盘" name="minimizeToTray" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="显示通知" name="showNotifications" valuePropName="checked">
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="主题" name="theme">
              <Select>
                <Option value="light">亮色主题</Option>
                <Option value="dark">暗色主题</Option>
                <Option value="auto">跟随系统</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="语言" name="language">
              <Select>
                <Option value="zh">简体中文</Option>
                <Option value="en">English</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Button type="primary" onClick={() => message.success('设置已保存')}>
          保存设置
        </Button>
      </Form>
    </Card>
  );

  const dataManagement = (
    <Card title="数据管理">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <h4>配置导出</h4>
          <Text type="secondary">
            将当前的Provider配置导出为不同格式的文件，用于备份或在其他环境中使用。
          </Text>
          <div style={{ marginTop: 16 }}>
            <Space wrap>
              <Button
                icon={<ExportOutlined />}
                onClick={() => handleExportConfig('bash')}
                loading={exportLoading}
              >
                导出为 Bash 脚本
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => handleExportConfig('powershell')}
                loading={exportLoading}
              >
                导出为 PowerShell 脚本
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => handleExportConfig('cmd')}
                loading={exportLoading}
              >
                导出为 CMD 脚本
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => handleExportConfig('json')}
                loading={exportLoading}
              >
                导出为 JSON 文件
              </Button>
            </Space>
          </div>
        </div>

        <Divider />

        <div>
          <h4>配置导入</h4>
          <Text type="secondary">
            从JSON配置文件导入Provider设置。注意：导入将覆盖现有配置。
          </Text>
          <div style={{ marginTop: 16 }}>
            <Upload
              beforeUpload={beforeUpload}
              accept=".json"
              showUploadList={false}
            >
              <Button
                icon={<ImportOutlined />}
                loading={importLoading}
              >
                从 JSON 文件导入
              </Button>
            </Upload>
          </div>
        </div>

        <Divider />

        <div>
          <h4>数据清理</h4>
          <Text type="secondary">
            清理应用数据，包括日志文件和缓存数据。
          </Text>
          <div style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={() => message.success('日志已清理')}>
                清理日志文件
              </Button>
              <Button onClick={() => message.success('缓存已清理')}>
                清理缓存数据
              </Button>
              <Button danger onClick={() => message.success('所有数据已重置')}>
                重置所有数据
              </Button>
            </Space>
          </div>
        </div>
      </Space>
    </Card>
  );

  const aboutInfo = (
    <Card title="关于 LLMctl">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>应用名称：</Text>
              <Text>LLMctl Desktop</Text>
            </Col>
            <Col span={12}>
              <Text strong>版本：</Text>
              <Text>2.0.0</Text>
            </Col>
          </Row>
        </div>

        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>作者：</Text>
              <Text>Liu Yifan</Text>
            </Col>
            <Col span={12}>
              <Text strong>许可证：</Text>
              <Text>MIT</Text>
            </Col>
          </Row>
        </div>

        <Divider />

        <div>
          <h4>技术栈</h4>
          <ul>
            <li>前端：Electron + React + TypeScript + Ant Design</li>
            <li>后端：Spring Boot + MyBatis + MySQL</li>
            <li>状态管理：Redux Toolkit</li>
            <li>网络请求：Axios</li>
          </ul>
        </div>

        <Divider />

        <div>
          <h4>功能特性</h4>
          <ul>
            <li>多Provider支持（Claude、OpenAI、通义千问、Gemini）</li>
            <li>智能Token轮询与负载均衡</li>
            <li>CLI会话管理与实时监控</li>
            <li>配置导入导出与备份恢复</li>
            <li>使用统计与性能分析</li>
          </ul>
        </div>

        <div>
          <Button
            type="primary"
            icon={<InfoCircleOutlined />}
            onClick={() => message.info('更多信息请访问项目主页')}
          >
            查看项目主页
          </Button>
        </div>
      </Space>
    </Card>
  );

  return (
    <div>
      <Tabs defaultActiveKey="1">
        <TabPane tab="应用设置" key="1">
          {applicationSettings}
        </TabPane>
        <TabPane tab="数据管理" key="2">
          {dataManagement}
        </TabPane>
        <TabPane tab="关于" key="3">
          {aboutInfo}
        </TabPane>
      </Tabs>

      {/* 导出配置Modal */}
      <Modal
        title={`导出的${exportFormat.toUpperCase()}配置`}
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setExportModalVisible(false)}>
            关闭
          </Button>,
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={handleDownloadConfig}>
            下载文件
          </Button>,
        ]}
      >
        <TextArea
          value={exportContent}
          readOnly
          rows={15}
          style={{ fontFamily: 'monospace' }}
        />
      </Modal>
    </div>
  );
};

export default Settings;