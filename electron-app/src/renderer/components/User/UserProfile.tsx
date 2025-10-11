import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Avatar, Divider, Space, Typography } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, EditOutlined } from '@ant-design/icons';
import { authStorage } from '../../utils/authStorage';
import axios from 'axios';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
    const [form] = Form.useForm();
    const [passwordForm] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);

    // 加载用户信息
    useEffect(() => {
        loadUserInfo();
    }, []);

    const loadUserInfo = () => {
        const currentUser = authStorage.getCurrentUser();
        if (currentUser) {
            setUserInfo(currentUser);
            form.setFieldsValue({
                username: currentUser.username,
                displayName: currentUser.displayName,
            });
        }
    };

    // 更新用户信息
    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();

            const response = await axios.put(
                'http://localhost:8080/llmctl/auth/profile',
                {
                    displayName: values.displayName,
                    email: values.email,
                },
                {
                    headers: {
                        Authorization: `Bearer ${authStorage.getAccessToken()}`,
                    },
                }
            );

            if (response.data && response.data.code === 200) {
                message.success('个人信息更新成功！');
                setEditing(false);
                loadUserInfo();
            }
        } catch (error: any) {
            console.error('更新失败:', error);
            message.error(error.response?.data?.message || '更新失败');
        } finally {
            setLoading(false);
        }
    };

    // 修改密码
    const handleChangePassword = async () => {
        try {
            setLoading(true);
            const values = await passwordForm.validateFields();

            const response = await axios.put(
                'http://localhost:8080/llmctl/auth/change-password',
                {
                    oldPassword: values.oldPassword,
                    newPassword: values.newPassword,
                },
                {
                    headers: {
                        Authorization: `Bearer ${authStorage.getAccessToken()}`,
                    },
                }
            );

            if (response.data && response.data.code === 200) {
                message.success('密码修改成功！');
                setChangingPassword(false);
                passwordForm.resetFields();
            }
        } catch (error: any) {
            console.error('修改密码失败:', error);
            message.error(error.response?.data?.message || '修改密码失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
            {/* 用户基本信息卡片 */}
            <Card>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
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
                        label="显示名称"
                        name="displayName"
                        rules={[{ required: true, message: '请输入显示名称' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="请输入显示名称" />
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
                            onClick={() => setChangingPassword(true)}
                            style={{ float: 'right' }}
                        >
                            修改
                        </Button>
                    )}
                </Title>

                {changingPassword ? (
                    <Form form={passwordForm} layout="vertical">
                        <Form.Item
                            label="当前密码"
                            name="oldPassword"
                            rules={[{ required: true, message: '请输入当前密码' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
                        </Form.Item>

                        <Form.Item
                            label="新密码"
                            name="newPassword"
                            rules={[
                                { required: true, message: '请输入新密码' },
                                { min: 6, message: '密码至少6个字符' },
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
                                }}>
                                    取消
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                ) : (
                    <Text type="secondary">密码设置为安全信息，请妥善保管</Text>
                )}
            </Card>
        </div>
    );
};

export default UserProfile;
