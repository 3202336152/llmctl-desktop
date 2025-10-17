import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Avatar, Divider, Space, Typography, Upload } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined, CameraOutlined } from '@ant-design/icons';
import { authStorage } from '../../utils/authStorage';
import apiClient from '../../services/httpClient';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // 加载用户信息
    useEffect(() => {
        loadUserInfo();
    }, []);

    // 倒计时效果
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const loadUserInfo = () => {
        const currentUser = authStorage.getCurrentUser();
        if (currentUser) {
            setUserInfo(currentUser);
            setAvatarUrl(currentUser.avatarUrl || '');
            form.setFieldsValue({
                username: currentUser.username,
                displayName: currentUser.displayName,
                email: currentUser.email,
            });
        }
    };

    // 更新用户信息
    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const response = await apiClient.put('/auth/profile', {
                displayName: values.displayName,
                email: values.email,
            });

            if (response.data && response.data.code === 200) {
                message.success('个人信息更新成功！');
                setEditing(false);

                // 更新本地存储的用户信息
                const updatedUser = response.data.data;
                authStorage.setCurrentUser(updatedUser);
                loadUserInfo();
            }
        } catch (error: any) {
            console.error('更新失败:', error);
            message.error(error.response?.data?.message || '更新失败');
        } finally {
            setLoading(false);
        }
    };

    // 发送验证码
    const handleSendVerificationCode = async () => {
        try {
            const email = passwordForm.getFieldValue('email');
            if (!email) {
                message.error('请先输入邮箱');
                return;
            }

            setSendingCode(true);
            const response = await apiClient.post('/auth/send-verification-code', {
                email,
                purpose: 'CHANGE_PASSWORD',
            });

            if (response.data && response.data.code === 200) {
                message.success('验证码已发送到您的邮箱！');
                setCountdown(60); // 60秒倒计时
            }
        } catch (error: any) {
            console.error('发送验证码失败:', error);
            message.error(error.response?.data?.message || '发送验证码失败');
        } finally {
            setSendingCode(false);
        }
    };

    // 修改密码
    const handleChangePassword = async () => {
        try {
            setLoading(true);
            const values = await passwordForm.validateFields();

            const response = await apiClient.put('/auth/change-password', {
                email: values.email,
                verificationCode: values.verificationCode,
                newPassword: values.newPassword,
            });

            if (response.data && response.data.code === 200) {
                message.success('密码修改成功！请重新登录');
                setChangingPassword(false);
                passwordForm.resetFields();

                // 清除登录状态，跳转到登录页
                setTimeout(() => {
                    authStorage.clearAuth();
                    window.location.reload();
                }, 2000);
            }
        } catch (error: any) {
            console.error('修改密码失败:', error);
            message.error(error.response?.data?.message || '修改密码失败');
        } finally {
            setLoading(false);
        }
    };

    // 上传头像
    const handleAvatarUpload = async (file: File) => {
        // 验证文件类型
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('只能上传图片文件！');
            return false;
        }

        // 验证文件大小（10MB）
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('图片大小不能超过10MB！');
            return false;
        }

        try {
            setUploadingAvatar(true);

            const formData = new FormData();
            formData.append('file', file);

            const response = await apiClient.post('/auth/upload-avatar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data && response.data.code === 200) {
                const newAvatarUrl = response.data.data;
                setAvatarUrl(newAvatarUrl);
                message.success('头像上传成功！');

                // 更新本地用户信息
                const currentUser = authStorage.getCurrentUser();
                if (currentUser) {
                    currentUser.avatarUrl = newAvatarUrl;
                    authStorage.setCurrentUser(currentUser);
                }
            }
        } catch (error: any) {
            console.error('上传头像失败:', error);
            message.error(error.response?.data?.message || '上传头像失败');
        } finally {
            setUploadingAvatar(false);
        }

        return false; // 阻止自动上传
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* 用户基本信息卡片 */}
            <Card>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        {avatarUrl ? (
                            <Avatar size={80} src={avatarUrl} />
                        ) : (
                            <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                        )}

                        <Upload
                            showUploadList={false}
                            beforeUpload={handleAvatarUpload}
                            accept="image/*"
                        >
                            <Button
                                type="primary"
                                shape="circle"
                                icon={<CameraOutlined />}
                                size="small"
                                loading={uploadingAvatar}
                                style={{
                                    position: 'absolute',
                                    bottom: -5,
                                    right: -5,
                                }}
                                title="更换头像"
                            />
                        </Upload>
                    </div>

                    <Title level={4} style={{ marginTop: 16, marginBottom: 4 }}>
                        {userInfo?.displayName || userInfo?.username}
                    </Title>
                    <Text type="secondary">@{userInfo?.username}</Text>
                </div>

                <Divider />

                <Title level={5} style={{ marginBottom: 16 }}>
                    个人信息
                    {!editing && (
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => setEditing(true)}
                            style={{ float: 'right' }}
                        >
                            编辑
                        </Button>
                    )}
                </Title>

                <Form form={form} layout="vertical" disabled={!editing}>
                    <Form.Item label="用户名" name="username">
                        <Input prefix={<UserOutlined />} disabled />
                    </Form.Item>

                    <Form.Item
                        label="昵称"
                        name="displayName"
                        rules={[{ required: true, message: '请输入昵称' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="请输入昵称" />
                    </Form.Item>

                    <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                    </Form.Item>

                    {editing && (
                        <Form.Item>
                            <Space>
                                <Button type="primary" onClick={handleUpdateProfile} loading={loading}>
                                    保存修改
                                </Button>
                                <Button onClick={() => {
                                    setEditing(false);
                                    loadUserInfo();
                                }}>
                                    取消
                                </Button>
                            </Space>
                        </Form.Item>
                    )}
                </Form>
            </Card>

            {/* 修改密码卡片 */}
            <Card style={{ marginTop: 24 }}>
                <Title level={5} style={{ marginBottom: 16 }}>
                    修改密码
                    {!changingPassword && (
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => {
                                // 检查是否已绑定邮箱
                                if (!userInfo?.email) {
                                    message.warning('修改密码需要先绑定邮箱，请先在个人信息中绑定邮箱');
                                    setEditing(true);
                                    return;
                                }
                                setChangingPassword(true);
                            }}
                            style={{ float: 'right' }}
                        >
                            修改
                        </Button>
                    )}
                </Title>

                {changingPassword ? (
                    <Form form={passwordForm} layout="vertical">
                        <Form.Item
                            label="绑定邮箱"
                            name="email"
                            initialValue={userInfo?.email}
                            rules={[
                                { required: true, message: '请输入邮箱' },
                                { type: 'email', message: '请输入有效的邮箱地址' },
                            ]}
                            help="验证码将发送到此邮箱"
                        >
                            <Input prefix={<MailOutlined />} disabled />
                        </Form.Item>

                        <Form.Item
                            label="验证码"
                            name="verificationCode"
                            rules={[
                                { required: true, message: '请输入验证码' },
                                { len: 6, message: '验证码为6位数字' },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="请输入验证码"
                                maxLength={6}
                                suffix={
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={handleSendVerificationCode}
                                        loading={sendingCode}
                                        disabled={countdown > 0}
                                    >
                                        {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
                                    </Button>
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            label="新密码"
                            name="newPassword"
                            rules={[
                                { required: true, message: '请输入新密码' },
                                { min: 6, max: 32, message: '密码长度必须在6-32位之间' },
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
                        </Form.Item>

                        <Form.Item
                            label="确认新密码"
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
                            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
                        </Form.Item>

                        <Form.Item>
                            <Space>
                                <Button type="primary" onClick={handleChangePassword} loading={loading}>
                                    确认修改
                                </Button>
                                <Button onClick={() => {
                                    setChangingPassword(false);
                                    passwordForm.resetFields();
                                    setCountdown(0);
                                }}>
                                    取消
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                ) : (
                    <Text type="secondary">密码设置为安全信息，请妥善保管。修改密码需要邮箱验证码。</Text>
                )}
            </Card>
        </div>
    );
};

export default UserProfile;
