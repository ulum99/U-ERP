import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Card, Form, Input, Button, Checkbox, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import logoImage from "../../public/vite.svg"; // Pastikan path logo benar (dari folder public)

const { Content } = Layout;
const { Title, Text, Link } = Typography;

function Login() {
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await auth.login(values.email, values.password);
            message.success('Login berhasil!');
            navigate('/dashboard');
        } catch (err) {
            message.error('Login gagal. Periksa kembali email dan password Anda.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
                <Row justify="center" align="middle" style={{ width: '100%', maxWidth: '900px' }}>
                    
                    {/* Bagian Kiri: Branding */}
                    <Col xs={24} md={12} style={{ textAlign: 'center', padding: '40px' }}>
                        <img src={logoImage} alt="Logo ERP" style={{ height: '80px', marginBottom: '24px' }} />
                        <Title level={2} style={{ marginBottom: '12px' }}>Free Open Source ERP / CRM</Title>
                        <Text type="secondary">Accounting / Invoicing / Quote App based on Node.js ReactJs Ant Design</Text>
                    </Col>
                    
                    {/* Bagian Kanan: Form Login */}
                    <Col xs={24} md={12}>
                        <Card style={{ 
                            width: '100%', 
                            maxWidth: '400px', 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            margin: '0 auto'
                        }}>
                            <Title level={3} style={{ textAlign: 'center', marginBottom: '32px' }}>Sign In</Title>
                            <Form
                                name="normal_login"
                                initialValues={{ remember: true }}
                                onFinish={onFinish}
                            >
                                <Form.Item
                                    name="email"
                                    rules={[{ required: true, type: 'email', message: 'Mohon masukkan email yang valid!' }]}
                                >
                                    <Input 
                                        prefix={<UserOutlined />} 
                                        placeholder="Email" 
                                        size="large" 
                                    />
                                </Form.Item>
                                
                                <Form.Item
                                    name="password"
                                    rules={[{ required: true, message: 'Mohon masukkan password Anda!' }]}
                                >
                                    <Input.Password 
                                        prefix={<LockOutlined />}
                                        placeholder="Password"
                                        size="large"
                                    />
                                </Form.Item>
                                
                                <Form.Item>
                                    <Form.Item name="remember" valuePropName="checked" noStyle>
                                        <Checkbox>Remember me</Checkbox>
                                    </Form.Item>
                                    <Link href="/forgot-password" style={{ float: 'right' }}>
                                        Forgot password
                                    </Link>
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
                                        Log in
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}

export default Login;