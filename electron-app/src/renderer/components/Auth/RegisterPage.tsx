import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, EyeOutlined, EyeInvisibleOutlined, MailOutlined, KeyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/httpClient';
import './Auth.css';

const RegisterPage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [sendingCode, setSendingCode] = useState(false);
    const navigate = useNavigate();

    // 验证邮箱格式（只允许QQ和163邮箱）
    const validateEmail = (_: any, value: string) => {
        if (!value) {
            return Promise.reject('请输入邮箱地址');
        }
        const emailRegex = /^[a-zA-Z0-9_-]+@(qq\.com|163\.com)$/;
        if (!emailRegex.test(value)) {
            return Promise.reject('只支持QQ邮箱和163邮箱');
        }
        return Promise.resolve();
    };

    // 发送验证码
    const handleSendCode = async () => {
        try {
            const email = form.getFieldValue('email');
            if (!email) {
                message.error('请先输入邮箱地址');
                return;
            }

            // 验证邮箱格式
            await form.validateFields(['email']);

            setSendingCode(true);
            const response = await apiClient.post('/auth/send-verification-code', {
                email,
                purpose: 'REGISTER',
            });

            if (response.data && response.data.code === 200) {
                message.success('验证码已发送，请查收邮件');
                // 开始倒计时
                setCountdown(60);
                const timer = setInterval(() => {
                    setCountdown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
        } catch (error: any) {
            message.error(error.message || '发送验证码失败');
        } finally {
            setSendingCode(false);
        }
    };

    const handleRegister = async (values: any) => {
        try {
            setLoading(true);

            // 先验证验证码
            const verifyResponse = await apiClient.post('/auth/verify-code', {
                email: values.email,
                code: values.verificationCode,
                purpose: 'REGISTER',
            });

            if (!verifyResponse.data?.data) {
                message.error('验证码无效或已过期');
                return;
            }

            // 验证码正确，执行注册
            await apiClient.post('/auth/register', {
                username: values.username,
                password: values.password,
                email: values.email,
            });

            message.success('注册成功！请登录');
            navigate('/login');
        } catch (error: any) {
            console.error('注册失败:', error);
            message.error(error.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card auth-card-register">
                {/* Logo 和标题 */}
                <div className="auth-header">
                    <div className="auth-logo">
                        <img src="http://117.72.200.2/downloads/llmctl/icon.png" alt="LLMctl" className="logo-icon-img" />
                        <span className="logo-text">LLMctl</span>
                    </div>
                    <h1 className="auth-title">注册</h1>
                </div>

                {/* 注册表单 */}
                <Form form={form} onFinish={handleRegister} layout="vertical" className="auth-form">
                    {/* 用户名 */}
                    <Form.Item
                        name="username"
                        rules={[
                            { required: true, message: '请输入用户名' },
                            { min: 3, message: '用户名至少3个字符' },
                        ]}
                    >
                        <div className="input-wrapper">
                            <UserOutlined className="input-icon" />
                            <Input
                                className="auth-input"
                                placeholder="请输入用户名"
                                size="large"
                            />
                        </div>
                    </Form.Item>

                    {/* 密码 */}
                    <Form.Item
                        name="password"
                        rules={[
                            { required: true, message: '请输入密码' },
                            { min: 8, max: 20, message: '密码长度为8-20位' },
                        ]}
                    >
                        <div className="input-wrapper">
                            <LockOutlined className="input-icon" />
                            <Input
                                className="auth-input"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="输入密码，最短8位，最长20位"
                                size="large"
                            />
                            <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            </div>
                        </div>
                    </Form.Item>

                    {/* 确认密码 */}
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
                                    return Promise.reject('两次输入的密码不一致');
                                },
                            }),
                        ]}
                    >
                        <div className="input-wrapper">
                            <LockOutlined className="input-icon" />
                            <Input
                                className="auth-input"
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="确认密码"
                                size="large"
                            />
                            <div className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                            </div>
                        </div>
                    </Form.Item>

                    {/* 邮箱 */}
                    <Form.Item
                        name="email"
                        rules={[{ validator: validateEmail }]}
                    >
                        <div className="input-wrapper input-with-button">
                            <MailOutlined className="input-icon" />
                            <Input
                                className="auth-input auth-input-with-button"
                                placeholder="输入邮箱地址"
                                size="large"
                            />
                            <Button
                                className="code-button"
                                onClick={handleSendCode}
                                disabled={countdown > 0}
                                loading={sendingCode}
                            >
                                {countdown > 0 ? `${countdown}秒后重试` : '获取验证码'}
                            </Button>
                        </div>
                    </Form.Item>

                    {/* 验证码 */}
                    <Form.Item
                        name="verificationCode"
                        rules={[
                            { required: true, message: '请输入验证码' },
                            { pattern: /^\d{6}$/, message: '验证码必须是6位数字' },
                        ]}
                    >
                        <div className="input-wrapper">
                            <KeyOutlined className="input-icon" />
                            <Input
                                className="auth-input"
                                placeholder="输入验证码"
                                size="large"
                                maxLength={6}
                            />
                        </div>
                    </Form.Item>

                    {/* 注册按钮 */}
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className="auth-button"
                            size="large"
                            block
                        >
                            注册
                        </Button>
                    </Form.Item>
                </Form>

                {/* 登录提示 */}
                <div className="auth-footer">
                    <span className="auth-footer-text">已有账户？</span>
                    <a onClick={() => navigate('/login')} className="auth-footer-link">登录</a>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
