import { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Tag, Button, Space, Spin, Typography, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ClockCircleOutlined, TeamOutlined, BookOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export default function JadwalGuru() {
  const navigate = useNavigate();
  const [jadwalByDay, setJadwalByDay] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchJadwal = useCallback(() => {
    setLoading(true);
    api.get('/jadwal').then((res) => {
      const grouped = {};
      days.forEach((d) => { grouped[d] = []; });
      (res.data || []).forEach((j) => {
        if (grouped[j.hari]) grouped[j.hari].push(j);
      });
      setJadwalByDay(grouped);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  return (
    <>
      <Card
        title="Jadwal Saya"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchJadwal} size="small">Refresh</Button>
        }
      >
        {loading ? (
          <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />
        ) : (
          <Row gutter={[16, 16]}>
            {days.map((day) => {
              const items = jadwalByDay[day] || [];
              return (
                <Col xs={24} sm={12} lg={8} key={day}>
                  <Card
                    size="small"
                    title={<Typography.Text strong style={{ fontSize: 15 }}>{day}</Typography.Text>}
                    style={{ minHeight: 160 }}
                  >
                    {items.length === 0 ? (
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>Tidak ada jadwal</Typography.Text>
                    ) : (
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        {items.map((j) => (
                          <Card
                            key={j.id_jadwal}
                            size="small"
                            type="inner"
                            style={{ width: '100%' }}
                            actions={[
                              <Button
                                key="aksi"
                                type="link" size="small"
                                icon={<TeamOutlined />}
                                onClick={() => navigate(`/absensi?id_jadwal=${j.id_jadwal}&id_kelas=${j.id_kelas}`)}
                              >
                                Absensi
                              </Button>,
                            ]}
                          >
                            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                              <Space>
                                <BookOutlined style={{ color: '#1677ff' }} />
                                <Typography.Text strong style={{ fontSize: 13 }}>{j.nama_mapel}</Typography.Text>
                              </Space>
                              <Space>
                                <ClockCircleOutlined style={{ color: '#52c41a' }} />
                                <Typography.Text style={{ fontSize: 12 }}>{j.jam_mulai} - {j.jam_selesai}</Typography.Text>
                              </Space>
                              <Space>
                                <TeamOutlined style={{ color: '#faad14' }} />
                                <Tag style={{ fontSize: 11 }}>{j.nama_kelas}{j.jurusan ? ` (${j.jurusan})` : ''}</Tag>
                              </Space>
                            </Space>
                          </Card>
                        ))}
                      </Space>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>
    </>
  );
}
