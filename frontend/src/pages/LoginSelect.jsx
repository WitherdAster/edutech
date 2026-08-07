import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Space, Button, Spin } from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

export default function LoginSelect() {
  const { user, siswa, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user) navigate('/dashboard', { replace: true });
    else if (siswa) navigate('/siswa/dashboard', { replace: true });
  }, [user, siswa, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (user || siswa) return null;

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
          <div style={{ textAlign: 'center' }}>
            <Typography.Text>Pilih jenis login:</Typography.Text>
          </div>
          <Button
            size="large"
            block
            icon={<TeamOutlined />}
            onClick={() => navigate('/login/instansi')}
            className="btn-cta"
            style={{ height: 56, fontSize: 16, textAlign: 'left', paddingLeft: 24, borderRadius: 18 }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>Instansi</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>Login untuk Guru & TU</div>
            </div>
          </Button>
          <Button
            size="large"
            block
            icon={<UserOutlined />}
            onClick={() => navigate('/login/siswa')}
            style={{ height: 56, fontSize: 16, textAlign: 'left', paddingLeft: 24, borderRadius: 18 }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>Siswa</div>
              <div style={{ fontSize: 12, opacity: 0.6 }}>Login untuk Orang Tua / Siswa</div>
            </div>
          </Button>
        </Space>
      </Card>
    </div>
  );
}
