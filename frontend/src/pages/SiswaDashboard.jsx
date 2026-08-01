import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Tag, Typography, Space, Button, Spin,
} from 'antd';
import {
  LogoutOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

const statusColors = {
  Hadir: 'green',
  Izin: 'orange',
  Sakit: 'red',
  Alpa: 'default',
};

export default function SiswaDashboard() {
  const { siswa, logoutSiswa } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [absensi, setAbsensi] = useState([]);
  const [history, setHistory] = useState({ data: [], total: 0 });
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    if (!siswa) {
      navigate('/login/siswa', { replace: true });
      return;
    }

    Promise.all([
      api.get('/siswa/me'),
      api.get('/siswa/absensi'),
      api.get('/siswa/absensi/history?page=1&per_page=20'),
    ]).then(([meRes, absenRes, histRes]) => {
      setProfile(meRes.data);
      setAbsensi(absenRes.data);
      setHistory(histRes.data);
      setLoading(false);
    });
  }, [siswa, navigate]);

  const loadHistory = (page) => {
    setHistoryPage(page);
    api.get(`/siswa/absensi/history?page=${page}&per_page=20`).then((res) => {
      setHistory(res.data);
    });
  };

  const handleLogout = () => {
    logoutSiswa();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const todayStatus = absensi.length > 0 ? absensi[0].status : 'Belum Absen';
  const isHadir = todayStatus === 'Hadir';

  const todayColumns = [
    { title: 'Mata Pelajaran', dataIndex: 'mata_pelajaran', key: 'mata_pelajaran' },
    { title: 'Guru', dataIndex: 'nama_guru', key: 'nama_guru' },
    { title: 'Jam', key: 'jam',
      render: (_, r) => r.jam_mulai && r.jam_selesai ? `${r.jam_mulai} - ${r.jam_selesai}` : '-',
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    {
      title: 'Waktu Scan', dataIndex: 'check_time', key: 'check_time',
      render: (v) => v ? dayjs(v).format('HH:mm') : '-',
    },
  ];

  const historyColumns = [
    { title: 'Tanggal', dataIndex: 'check_time', key: 'check_time',
      render: (v) => v ? dayjs(v).format('DD MMM YYYY, HH:mm') : '-',
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (s) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    { title: 'Keterangan', dataIndex: 'keterangan', key: 'keterangan', render: (v) => v || '-' },
  ];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <Card
        style={{ marginBottom: 16, textAlign: 'center', borderRadius: 12 }}
        bodyStyle={{ padding: '24px 16px' }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {isHadir ? <CheckCircleOutlined style={{ color: '#52c41a' }} />
            : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
        </div>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {todayStatus}
        </Typography.Title>
        <Typography.Text type="secondary">
          {dayjs().format('dddd, DD MMMM YYYY')}
        </Typography.Text>
      </Card>

      <Card
        style={{ marginBottom: 16, borderRadius: 12 }}
        bodyStyle={{ padding: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={4}>
          <Typography.Title level={5} style={{ margin: 0 }}>{profile?.nama_siswa}</Typography.Title>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
            <Typography.Text type="secondary">NISN: {profile?.nisn}</Typography.Text>
            <Typography.Text type="secondary">Kelas: {profile?.kelas}</Typography.Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
            <Typography.Text type="secondary">Jurusan: {profile?.jurusan || '-'}</Typography.Text>
          </div>
        </Space>
      </Card>

      <Card
        title="Absensi Hari Ini"
        style={{ marginBottom: 16, borderRadius: 12 }}
        extra={
          <Button size="small" icon={<ReloadOutlined />}
            onClick={() => api.get('/siswa/absensi').then((r) => setAbsensi(r.data))}>
            Refresh
          </Button>
        }
      >
        {absensi.length === 0 ? (
          <Typography.Text type="secondary">Belum ada data absensi hari ini</Typography.Text>
        ) : (
          <ResponsiveTable
            dataSource={absensi}
            columns={todayColumns}
            rowKey="id_jadwal"
            pagination={false}
            mobileTitle={(r) => r.mata_pelajaran}
            mobileSubtitle={(r) => [
              r.nama_guru,
              r.jam_mulai && r.jam_selesai ? `${r.jam_mulai} - ${r.jam_selesai}` : null,
            ].filter(Boolean).join(' · ')}
          />
        )}
      </Card>

      <Card
        title="Riwayat Absensi"
        style={{ marginBottom: 16, borderRadius: 12 }}
      >
        <ResponsiveTable
          dataSource={history.data}
          columns={historyColumns}
          rowKey="id_absensi"
          pagination={{
            current: historyPage,
            pageSize: 20,
            total: history.total,
            onChange: loadHistory,
            size: 'small',
          }}
          mobileTitle={(r) => (r.check_time ? dayjs(r.check_time).format('DD MMM YYYY, HH:mm') : '-')}
          mobileSubtitle={(r) => r.status}
        />
      </Card>

      <div style={{ textAlign: 'center', padding: '8px 0 24px' }}>
        <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text" danger>
          Logout
        </Button>
      </div>
    </div>
  );
}
