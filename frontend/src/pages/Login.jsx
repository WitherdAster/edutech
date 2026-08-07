import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) navigate('/dashboard', { replace: true });
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (user) return null;

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('Login berhasil');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const detail = err?.response?.data?.detail || err.message || 'Terjadi kesalahan';
      message.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg" style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center',
      alignItems: 'center', padding: 16,
    }}>
      <Card style={{ width: 360, borderRadius: 24, border: 'none' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={3} style={{ margin: 0, fontWeight: 800 }}>EduTech</Typography.Title>
            <Typography.Text type="secondary">Sistem Absensi Sekolah</Typography.Text>
          </div>
          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item name="username" rules={[{ required: true, message: 'Masukkan username' }]}>
              <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Masukkan password' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large"
                className="btn-cta">
                Login
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
