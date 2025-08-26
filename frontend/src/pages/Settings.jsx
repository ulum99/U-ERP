import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Typography, Card, Spin } from 'antd';
import api from '../api/axios';

const { Title } = Typography;

function Settings() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await api.get('/settings');
                form.setFieldsValue(response.data); // Isi form dengan data dari backend
            } catch (error) {
                message.error('Gagal memuat pengaturan.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [form]);

    const handleFormSubmit = async (values) => {
        // Tambahkan loading dan message untuk feedback
    try {
        message.loading({ content: 'Menyimpan...', key: 'settings_update' });
        await api.put('/settings', values); // Pastikan endpoint adalah PUT /settings
        message.success({ content: 'Pengaturan berhasil disimpan!', key: 'settings_update', duration: 2 });
    } catch (error) {
        message.error({ content: error.response?.data?.message || 'Gagal menyimpan pengaturan.', key: 'settings_update', duration: 2 });
    }
    };

    if (loading) {
        return <Spin size="large" />;
    }

    return (
        <div>
            <Title level={2}>Pengaturan Umum</Title>
            <Card>
                <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                    <Title level={4}>Informasi Perusahaan / Cabang</Title>
                    <Form.Item name="company_name" label="Nama Perusahaan/Cabang">
                        <Input placeholder="Masukkan nama perusahaan atau cabang" />
                    </Form.Item>
                    <Form.Item name="company_address" label="Alamat">
                        <Input.TextArea rows={3} placeholder="Masukkan alamat lengkap" />
                    </Form.Item>
                    <Form.Item name="company_phone" label="Nomor Telepon">
                        <Input />
                    </Form.Item>
                    <Form.Item name="company_email" label="Email">
                        <Input type="email" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Simpan Pengaturan
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}

export default Settings;