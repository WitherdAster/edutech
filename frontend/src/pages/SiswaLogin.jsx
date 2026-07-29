import { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message, Space, Spin } from 'antd';
import { UserOutlined, IdcardOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

export default function SiswaLogin() {
  const [loading, setLoading] = useState(false);
  const { siswa, loginSiswa, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && siswa) navigate('/siswa/dashboard', { replace: true });
  }, [siswa, authLoading, navigate]);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (siswa) return null;

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await loginSiswa(values.nisn, values.nama_siswa);
      message.success('Login berhasil');
      navigate('/siswa/dashboard');
    } catch (err) {
      const detail = err?.response?.data?.detail || err.message || 'NISN atau nama tidak cocok';
      message.error(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', justifyContent: 'center',
      alignItems: 'center', background: '#f0f2f5', padding: 16,
    }}>
      <Card style={{ width: 360, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>Login Siswa</Typography.Title>
            <Typography.Text type="secondary">Masukkan data siswa untuk memantau absensi</Typography.Text>
          </div>
          <Form layout="vertical" onFinish={onFinish} autoComplete="off">
            <Form.Item name="nisn" rules={[{ required: true, message: 'Masukkan NISN' }]}>
              <Input prefix={<IdcardOutlined />} placeholder="NISN" size="large" />
            </Form.Item>
            <Form.Item name="nama_siswa" rules={[{ required: true, message: 'Masukkan nama lengkap' }]}>
              <Input prefix={<UserOutlined />} placeholder="Nama Lengkap" size="large" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                Login
              </Button>
            </Form.Item>
          </Form>
          <div style={{ textAlign: 'center' }}>
            <Link to="/login">
              <Button type="link" icon={<ArrowLeftOutlined />}>Kembali ke pilihan login</Button>
            </Link>
          </div>
        </Space>
      </Card>
    </div>
  );
}
