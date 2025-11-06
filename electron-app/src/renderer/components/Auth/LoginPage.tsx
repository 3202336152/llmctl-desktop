import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../utils/authStorage';
import apiClient from '../../services/httpClient';
import './Auth.css';

const LoginPage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (values: any) => {
        try {
            setLoading(true);

            const response = await apiClient.post('/auth/login', {
                username: values.usernameOrEmail,
                password: values.password,
            });

            if (response.data && response.data.code === 200) {
                authStorage.saveAuth(response.data.data);
                message.success('登录成功！');
                setTimeout(() => {
                    navigate('/');
                    window.location.reload();
                }, 500);
            }
        } catch (error: any) {
            console.error('登录失败:', error);
            message.error(error.message || '登录失败，请检查用户名和密码');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                {/* Logo 和标题 */}
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src="http://117.72.200.2/downloads/llmctl/icon.png" alt="LLMctl" className="logo-icon-img" />
                        <span className="logo-text">LLMctl</span>
                    </div>
                    <h1 className="auth-title">登录</h1>
                </div>

                {/* 登录表单 */}
                <Form form={form} onFinish={handleLogin} layout="vertical" className="auth-form">
                    {/* 用户名或邮箱 */}
                    <Form.Item
                        name="usernameOrEmail"
                        rules={[{ required: true, message: '请输入您的用户名或邮箱地址' }]}
                    >
                        <div className="input-wrapper">
                            <MailOutlined className="input-icon" />
                            <Input
                                className="auth-input"
                                placeholder="请输入您的用户名或邮箱地址"
                                size="large"
                            />
                        </div>
                    </Form.Item>

                    {/* 密码 */}
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: '请输入您的密码' }]}
                    >
                        <div className="input-wrapper">
                            <LockOutlined className="input-icon" />
                            <Input
                                className="auth-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="请输入您的密码"
                                size="large"
                            />
                            <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            </div>
                        </div>
                    </Form.Item>

                    {/* 继续按钮 */}
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="auth-button"
                            size="large"
                            block
                        >
                            登录
                        </Button>
                    </Form.Item>

                    {/* 忘记密码 */}
                    <div className="auth-link-center">
                        <a onClick={handleForgotPassword} className="auth-link">忘记密码？</a>
                    </div>
                </Form>

                {/* 注册提示 */}
                <div className="auth-footer">
                    <span className="auth-footer-text">没有账户？</span>
                    <a onClick={() => navigate('/register')} className="auth-footer-link">注册</a>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
