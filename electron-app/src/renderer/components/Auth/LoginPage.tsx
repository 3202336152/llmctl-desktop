import React, { useState } from 'react';
import { Form, Input, Button, Card, Tabs, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../utils/authStorage';
import axios from 'axios';
import './LoginPage.css';

const LoginPage: React.FC = () => {
    const [loginForm] = Form.useForm();
    const [registerForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            setLoading(true);
            const values = await loginForm.validateFields();

            const response = await axios.post('http://localhost:8080/llmctl/auth/login', {
                username: values.username,
                password: values.password,
            });

            if (response.data && response.data.code === 200) {
                authStorage.saveAuth(response.data.data);
                message.success('登录成功！');
                setTimeout(() => {
                    navigate('/providers');
                    window.location.reload();
                }, 500);
            }
        } catch (error: any) {
            console.error('登录失败:', error);
            message.error(error.response?.data?.message || '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        try {
            setLoading(true);
            const values = await registerForm.validateFields();

            await axios.post('http://localhost:8080/llmctl/auth/register', {
                username: values.username,
                password: values.password,
                displayName: values.displayName,
                email: values.email,
            });

            message.success('注册成功！请登录');
            setActiveTab('login');
            registerForm.resetFields();
        } catch (error: any) {
            console.error('注册失败:', error);
            message.error(error.response?.data?.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Card className="login-card" style={{ width: 400 }}>
                <div className="login-header">
                    <h1>LLMctl</h1>
                    <p>LLM Provider 管理系统</p>
                </div>

                <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
                    <Tabs.TabPane tab="登录" key="login">
                        <Form form={loginForm} onFinish={handleLogin} layout="vertical">
                            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                                <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
                            </Form.Item>

                            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                                    登录
                                </Button>
                            </Form.Item>
                        </Form>
                    </Tabs.TabPane>

                    <Tabs.TabPane tab="注册" key="register">
                        <Form form={registerForm} onFinish={handleRegister} layout="vertical">
                            <Form.Item
                                name="username"
                                rules={[
                                    { required: true, message: '请输入用户名' },
                                    { min: 3, message: '用户名至少3个字符' },
                                ]}
                            >
                                <Input prefix={<UserOutlined />} placeholder="用户名" size="large" />
                            </Form.Item>

                            <Form.Item
                                name="password"
                                rules={[
                                    { required: true, message: '请输入密码' },
                                    { min: 6, message: '密码至少6个字符' },
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="密码" size="large" />
                            </Form.Item>

                            <Form.Item
                                name="confirmPassword"
                                dependencies={['password']}
                                rules={[
                                    { required: true, message: '请确认密码' },
                                    ({ getFieldValue }: any) => ({
                                        validator(_: any, value: any) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('两次输入的密码不一致'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="确认密码" size="large" />
                            </Form.Item>

                            <Form.Item name="displayName">
                                <Input prefix={<UserOutlined />} placeholder="显示名称（可选）" size="large" />
                            </Form.Item>

                            <Form.Item name="email" rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}>
                                <Input prefix={<MailOutlined />} placeholder="邮箱（可选）" size="large" />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} size="large" block>
                                    注册
                                </Button>
                            </Form.Item>
                        </Form>
                    </Tabs.TabPane>
                </Tabs>
            </Card>
        </div>
    );
};

export default LoginPage;
