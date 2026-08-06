import { useState, useEffect } from 'react';
import { Card, Select, DatePicker, Button, message, Space, Typography } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ExportPage() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [idKelas, setIdKelas] = useState(null);
  const [idMapel, setIdMapel] = useState(null);
  const [range, setRange] = useState([dayjs(), dayjs()]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/kelas'),
      api.get('/mapel'),
    ]).then(([kelasRes, mapelRes]) => {
      setKelas(kelasRes.data);
      setMapelList(mapelRes.data);
    });
  }, []);

  if (user?.role !== 'tu') {
    return <Typography.Text type="danger">Hanya TU yang dapat mengakses halaman ini.</Typography.Text>;
  }

  const handleExport = async () => {
    setLoading(true);
    try {
      if (!range || !range[0] || !range[1]) {
        message.warning('Pilih jangka waktu terlebih dahulu');
        return;
      }

      const params = {
        tanggal_mulai: range[0].format('YYYY-MM-DD'),
        tanggal_selesai: range[1].format('YYYY-MM-DD'),
      };
      if (idKelas) params.id_kelas = idKelas;
      if (idMapel) params.id_mapel = idMapel;

      const res = await api.get('/absensi/export', {
        params,
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rekap_absensi_${range[0].format('YYYY-MM-DD')}_${range[1].format('YYYY-MM-DD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('File berhasil di-download');
    } catch {
      message.error('Gagal mengexport data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Export Excel Absensi">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Text>
          Download rekap absensi dalam format Excel. Data akan mencakup semua siswa
          beserta status kehadiran per mata pelajaran pada jangka waktu yang dipilih.
        </Typography.Text>
        <Space style={{ flexWrap: 'wrap' }}>
          <DatePicker.RangePicker
            value={range}
            onChange={(v) => setRange(v || [dayjs(), dayjs()])}
            allowClear={false}
          />
          <Select
            placeholder="Filter Kelas (opsional)"
            allowClear
            style={{ width: 200 }}
            onChange={(v) => setIdKelas(v)}
            options={kelas.map((k) => ({ value: k.id_kelas, label: k.nama_kelas }))}
          />
          <Select
            placeholder="Filter Mapel (opsional)"
            allowClear
            style={{ width: 200 }}
            onChange={(v) => setIdMapel(v)}
            options={mapelList.map((m) => ({ value: m.id_mapel, label: m.nama_mapel }))}
          />
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} loading={loading}>
            Download Excel
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
