import { useState, useEffect, useCallback } from 'react';
import {
  Table, Select, Card, Tag, Button, Space, Modal,
  Radio, Input as AntInput, message, Typography, DatePicker,
} from 'antd';
import { EditOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const statusColors = {
  Hadir: 'green',
  Izin: 'orange',
  Sakit: 'red',
  Alpa: 'default',
  'Belum Absen': 'default',
};

export default function Absensi() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [kelas, setKelas] = useState([]);
  const [jadwalList, setJadwalList] = useState([]);
  const [idKelas, setIdKelas] = useState(null);
  const [idJadwal, setIdJadwal] = useState(null);
  const [tanggal, setTanggal] = useState(dayjs());
  const [siswaData, setSiswaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);

  const fetchKelas = useCallback(() => {
    api.get('/kelas').then((res) => setKelas(res.data));
  }, []);

  const fetchJadwal = useCallback(() => {
    if (!idKelas) return;
    const params = { id_kelas: idKelas };
    if (tanggal) params.hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][tanggal.day()];
    api.get('/jadwal', { params }).then((res) => setJadwalList(res.data));
  }, [idKelas, tanggal]);

  const fetchAbsensi = useCallback(() => {
    if (!idJadwal) {
      setSiswaData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = { id_kelas: idKelas };
    if (tanggal) params.tanggal = tanggal.format('YYYY-MM-DD');
    api.get('/absensi/hari-ini', { params }).then((res) => {
      const jadwal = res.data.find((j) => j.id_jadwal === idJadwal);
      setSiswaData(jadwal?.siswa || []);
      setLoading(false);
    });
  }, [idJadwal, idKelas, tanggal]);

  useEffect(() => {
    fetchKelas();
  }, [fetchKelas]);

  useEffect(() => {
    const jadwalParam = searchParams.get('id_jadwal');
    const kelasParam = searchParams.get('id_kelas');
    if (jadwalParam) setIdJadwal(Number(jadwalParam));
    if (kelasParam) setIdKelas(Number(kelasParam));
  }, [searchParams]);

  useEffect(() => {
    if (idKelas) fetchJadwal();
    setIdJadwal(null);
  }, [idKelas, tanggal, fetchJadwal]);

  useEffect(() => {
    fetchAbsensi();
  }, [fetchAbsensi]);

  const handleUpdate = async (record) => {
    if (!editModal) return;
    try {
      const payload = {
        status_manual: editModal.newStatus,
        keterangan: editModal.keterangan || null,
      };

      if (record.sumber === 'Base' || !record.id_absensi) {
        await api.post('/absensi', payload, {
          params: { id_siswa: record.id_siswa, id_jadwal: idJadwal },
        });
      } else {
        await api.put(`/absensi/${record.id_absensi}`, payload);
      }

      message.success('Status berhasil diperbarui');
      setEditModal(null);
      fetchAbsensi();
    } catch {
      message.error('Gagal memperbarui status');
    }
  };

  const columns = [
    { title: 'No', key: 'index', width: 50, render: (_, __, i) => i + 1 },
    { title: 'NISN', dataIndex: 'nisn', key: 'nisn', width: 120 },
    { title: 'Nama', dataIndex: 'nama_siswa', key: 'nama_siswa' },
    {
      title: 'Status', dataIndex: 'status', key: 'status', width: 140,
      render: (status, record) => (
        <Space size={4}>
          <Tag color={statusColors[status] || 'default'}>{status}</Tag>
          {record.sumber === 'Base' && status === 'Hadir' && (
            <Tag color="blue" style={{ fontSize: 10 }}>Inherit</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Waktu', dataIndex: 'check_time', key: 'check_time', width: 80,
      render: (v) => (v ? v.slice(11, 19) : '-'),
    },
    {
      title: 'Aksi', key: 'aksi', width: 80,
      render: (_, record) => (
        <Button
          type="link" size="small" icon={<EditOutlined />}
          onClick={() => setEditModal({
            ...record,
            newStatus: record.sumber === 'Base' ? 'Hadir' : (record.status !== 'Belum Absen' ? record.status : 'Hadir'),
            keterangan: '',
          })}
        >
          Ubah
        </Button>
      ),
    },
  ];

  const selectedJadwalInfo = jadwalList.find((j) => j.id_jadwal === idJadwal);

  return (
    <>
      <Card
        title="Rekap Absensi Per Mata Pelajaran"
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchAbsensi} size="small">Refresh</Button>
        }
      >
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <DatePicker
            value={tanggal}
            onChange={(d) => { setTanggal(d); setIdJadwal(null); }}
            allowClear={false}
            style={{ width: 160 }}
            disabledDate={(d) => d.day() === 0 || d.day() === 6}
          />
          <Select
            placeholder="Filter Kelas"
            allowClear
            style={{ width: 200 }}
            value={idKelas}
            onChange={(v) => { setIdKelas(v); setIdJadwal(null); }}
            options={kelas.map((k) => ({ value: k.id_kelas, label: k.nama_kelas }))}
          />
          <Select
            placeholder="Pilih Mapel / Jadwal"
            style={{ width: 300 }}
            value={idJadwal}
            onChange={(v) => setIdJadwal(v)}
            disabled={!idKelas}
            options={jadwalList.map((j) => ({
              value: j.id_jadwal,
              label: `${j.nama_mapel} — ${j.nama_guru} (${j.jam_mulai}-${j.jam_selesai})`,
            }))}
          />
        </Space>

        {selectedJadwalInfo && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f6f8fa', borderRadius: 6 }}>
            <Space size="middle" wrap>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {tanggal.format('dddd, DD MMMM YYYY')}
              </Typography.Text>
              <Typography.Text strong>{selectedJadwalInfo.nama_mapel}</Typography.Text>
              <Tag>{selectedJadwalInfo.nama_guru}</Tag>
              <Typography.Text type="secondary">
                {selectedJadwalInfo.jam_mulai} - {selectedJadwalInfo.jam_selesai}
              </Typography.Text>
              <Typography.Text type="secondary">
                Total: {selectedJadwalInfo.total_siswa} siswa
              </Typography.Text>
            </Space>
          </div>
        )}

        <Table
          dataSource={siswaData}
          columns={columns}
          rowKey="id_siswa"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={`Ubah Status - ${editModal?.nama_siswa || ''}`}
        open={!!editModal}
        onOk={() => handleUpdate(editModal)}
        onCancel={() => setEditModal(null)}
        okText="Simpan"
        cancelText="Batal"
      >
        {editModal && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <div style={{ marginBottom: 4 }}>Status Saat Ini:</div>
              <Tag color={statusColors[editModal.status]}>{editModal.status}</Tag>
              {editModal.sumber === 'Base' && (
                <Tag color="blue" style={{ marginLeft: 4 }}>Inherit dari scan pagi</Tag>
              )}
            </div>
            <div>
              <div style={{ marginBottom: 4 }}>Ubah Menjadi:</div>
              <Radio.Group
                value={editModal.newStatus}
                onChange={(e) => setEditModal({ ...editModal, newStatus: e.target.value })}
              >
                <Radio value="Hadir">Hadir</Radio>
                <Radio value="Izin">Izin</Radio>
                <Radio value="Sakit">Sakit</Radio>
                <Radio value="Alpa">Alpa</Radio>
              </Radio.Group>
            </div>
            <div>
              <div style={{ marginBottom: 4 }}>Keterangan (opsional):</div>
              <AntInput.TextArea
                value={editModal.keterangan}
                onChange={(e) => setEditModal({ ...editModal, keterangan: e.target.value })}
                rows={2}
              />
            </div>
          </Space>
        )}
      </Modal>
    </>
  );
}
