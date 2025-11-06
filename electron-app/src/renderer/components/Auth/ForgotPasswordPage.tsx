import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Steps } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined, ArrowLeftOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/httpClient';
import './Auth.css';

/**
 * 忘记密码页面
 * 通过邮箱验证码重置密码
 */
const ForgotPasswordPage: React.FC = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    // 倒计时效果
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // 发送验证码
    const handleSendVerificationCode = async () => {
        try {
            const email = form.getFieldValue('email');
            if (!email) {
                message.error('请先输入邮箱');
                return;
            }

            // 验证邮箱格式
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                message.error('请输入有效的邮箱地址');
                return;
            }

            setSendingCode(true);
            const response = await apiClient.post('/auth/send-verification-code', {
                email,
                purpose: 'RESET_PASSWORD',
            });

            if (response.data && response.data.code === 200) {
                message.success('验证码已发送到您的邮箱！');
                setCountdown(60); // 60秒倒计时
                setCurrentStep(1); // 进入下一步
            }
        } catch (error: any) {
            console.error('发送验证码失败:', error);
            message.error(error.message || '发送验证码失败');
        } finally {
            setSendingCode(false);
        }
    };

    // 重置密码
    const handleResetPassword = async (values: any) => {
        try {
            setLoading(true);

            const response = await apiClient.post('/auth/reset-password', {
                email: values.email,
                verificationCode: values.verificationCode,
                newPassword: values.newPassword,
            });

            if (response.data && response.data.code === 200) {
                message.success('密码重置成功！请使用新密码登录');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }
        } catch (error: any) {
            console.error('重置密码失败:', error);
            message.error(error.message || '重置密码失败');
        } finally {
            setLoading(false);
        }
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
                    <h1 className="auth-title">重置密码</h1>
                    <p className="auth-subtitle">通过邮箱验证码重置您的密码</p>
                </div>

                {/* 步骤指示器 */}
                <Steps
                    current={currentStep}
                    size="small"
                    style={{ marginBottom: 32 }}
                    items={[
                        { title: '验证邮箱' },
                        { title: '重置密码' },
                    ]}
                />

                {/* 重置密码表单 */}
                <Form form={form} onFinish={handleResetPassword} layout="vertical" className="auth-form">
                    {/* 邮箱 */}
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: '请输入您的邮箱地址' },
                            { type: 'email', message: '请输入有效的邮箱地址' },
                        ]}
                    >
                        <div className="input-wrapper">
                            <MailOutlined className="input-icon" />
                            <Input
                                className="auth-input"
                                placeholder="请输入绑定的邮箱地址"
                                size="large"
                                disabled={currentStep > 0}
                            />
                        </div>
                    </Form.Item>

                    {/* 发送验证码按钮 */}
                    {currentStep === 0 && (
                        <Form.Item>
                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={sendingCode}
                                onClick={handleSendVerificationCode}
                                className="auth-button"
                            >
                                发送验证码
                            </Button>
                        </Form.Item>
                    )}

                    {/* 验证码 */}
                    {currentStep >= 1 && (
                        <Form.Item
                            name="verificationCode"
                            rules={[
                                { required: true, message: '请输入验证码' },
                                { len: 6, message: '验证码为6位数字' },
                            ]}
                        >
                            <div className="input-wrapper">
                                <SafetyOutlined className="input-icon" />
                                <Input
                                    className="auth-input"
                                    placeholder="请输入6位验证码"
                                    size="large"
                                    maxLength={6}
                                />
                                <div className="verification-code-suffix">
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={handleSendVerificationCode}
                                        loading={sendingCode}
                                        disabled={countdown > 0}
                                        style={{ padding: 0, height: 'auto' }}
                                    >
                                        {countdown > 0 ? `${countdown}秒后重试` : '重新发送'}
                                    </Button>
                                </div>
                            </div>
                        </Form.Item>
                    )}

                    {/* 新密码 */}
                    {currentStep >= 1 && (
                        <Form.Item
                            name="newPassword"
                            rules={[
                                { required: true, message: '请输入新密码' },
                                { min: 6, max: 32, message: '密码长度必须在6-32位之间' },
                            ]}
                        >
                            <div className="input-wrapper">
                                <LockOutlined className="input-icon" />
                                <Input
                                    className="auth-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="请输入新密码"
                                    size="large"
                                />
                                <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                </div>
                            </div>
                        </Form.Item>
                    )}

                    {/* 确认新密码 */}
                    {currentStep >= 1 && (
                        <Form.Item
                            name="confirmPassword"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: '请确认新密码' },
                                ({ getFieldValue }: any) => ({
                                    validator(_: any, value: any) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('两次输入的密码不一致'));
                                    },
                                }),
                            ]}
                        >
                            <div className="input-wrapper">
                                <LockOutlined className="input-icon" />
                                <Input
                                    className="auth-input"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="请再次输入新密码"
                                    size="large"
                                />
                                <div className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                                </div>
                            </div>
                        </Form.Item>
                    )}

                    {/* 重置密码按钮 */}
                    {currentStep >= 1 && (
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="auth-button"
                                size="large"
                                block
                            >
                                重置密码
                            </Button>
                        </Form.Item>
                    )}

                    {/* 返回登录 */}
                    <div className="auth-link-center">
                        <a onClick={() => navigate('/login')} className="auth-link">
                            <ArrowLeftOutlined style={{ marginRight: 4 }} />
                            返回登录
                        </a>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
