import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Spin, Progress, Button, Space, Tag, Alert,
} from 'antd';
import {
  TeamOutlined, CheckSquareOutlined, BankOutlined,
  WarningOutlined, ReloadOutlined, EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [jadwalList, setJadwalList] = useState([]);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(() => {
    api.get('/dashboard').then((res) => {
      setData(res.data);
      setError(null);
    }).catch((err) => {
      setError(err.response?.data?.detail || err.message || 'Gagal memuat data dashboard');
    });
  }, []);

  const fetchJadwal = useCallback(() => {
    api.get('/absensi/hari-ini').then((res) => {
      setJadwalList(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchJadwal();
    const interval = setInterval(() => {
      fetchDashboard();
      fetchJadwal();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard, fetchJadwal]);

  if (error && !data) {
    return (
      <Alert
        type="error"
        message="Gagal Memuat Dashboard"
        description={error}
        showIcon
        action={
          <Button size="small" onClick={() => { setError(null); fetchDashboard(); }}>
            Coba Lagi
          </Button>
        }
      />
    );
  }

  if (!data) {
    return <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Siswa"
              value={data.total_siswa}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Sudah Scan Pagi"
              value={data.hadir_hari_ini}
              prefix={<CheckSquareOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Kelas"
              value={data.total_kelas}
              prefix={<BankOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Belum Scan Pagi"
              value={data.belum_hadir}
              valueStyle={{ color: data.belum_hadir > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Jumlah Jadwal Hari Ini"
              value={jadwalList.length}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <WarningOutlined style={{ color: '#faad14' }} />
            <span>Absensi Per Mata Pelajaran — Hari Ini</span>
          </Space>
        }
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => { fetchDashboard(); fetchJadwal(); }} size="small">
            Refresh
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          {jadwalList.map((j) => {
            const percent = j.total_siswa > 0
              ? Math.round((j.hadir / j.total_siswa) * 100)
              : 0;

            return (
              <Col xs={24} sm={12} lg={8} key={j.id_jadwal}>
                <Card
                  size="small"
                  title={
                    <Space size={4}>
                      <span style={{ fontWeight: 600 }}>{j.nama_mapel}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>({j.jam_mulai}-{j.jam_selesai})</span>
                    </Space>
                  }
                  extra={
                    <Button
                      type="link" size="small" icon={<EyeOutlined />}
                      onClick={() => navigate(`/absensi?id_jadwal=${j.id_jadwal}&id_kelas=${j.id_kelas}`)}
                    >
                      Detail
                    </Button>
                  }
                  actions={[
                    <Statistic
                      key="hadir"
                      title="Hadir"
                      value={j.hadir}
                      suffix={`/ ${j.total_siswa}`}
                      valueStyle={{ fontSize: 16, color: '#52c41a' }}
                    />,
                    <Statistic
                      key="belum"
                      title="Belum"
                      value={j.belum}
                      valueStyle={{ fontSize: 16, color: j.belum > 0 ? '#ff4d4f' : '#52c41a' }}
                    />,
                  ]}
                >
                  <div style={{ marginBottom: 8 }}>
                    <Tag style={{ fontSize: 11 }}>{j.nama_guru}</Tag>
                    <Tag style={{ fontSize: 11 }}>{j.nama_kelas}</Tag>
                  </div>
                  <Progress
                    percent={percent}
                    status={percent < 50 ? 'exception' : percent < 100 ? 'active' : 'success'}
                    size="small"
                  />
                </Card>
              </Col>
            );
          })}
          {jadwalList.length === 0 && (
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: 24, color: '#999' }}>
                Tidak ada jadwal untuk hari ini
              </div>
            </Col>
          )}
        </Row>
      </Card>
    </Space>
  );
}


