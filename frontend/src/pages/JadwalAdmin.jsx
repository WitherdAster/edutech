import { useState, useEffect, useCallback } from 'react';
import {
  Card, Select, Button, Space, Modal, Form, TimePicker, Typography,
  Tag, message, Popconfirm,
} from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

export default function JadwalAdmin() {
  const { user } = useAuth();
  const [kelas, setKelas] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [guruList, setGuruList] = useState([]);
  const [mapelList, setMapelList] = useState([]);
  const [kelasMapel, setKelasMapel] = useState([]);
  const [filterIdJurusan, setFilterIdJurusan] = useState(null);
  const [idKelas, setIdKelas] = useState(null);
  const [filterHari, setFilterHari] = useState(null);
  const [filterIdMapel, setFilterIdMapel] = useState(null);
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    Promise.all([
      api.get('/kelas'),
      api.get('/guru'),
      api.get('/mapel'),
      api.get('/jurusan'),
    ]).then(([kelasRes, guruRes, mapelRes, jurusanRes]) => {
      setKelas(kelasRes.data);
      setGuruList(guruRes.data || []);
      setMapelList(mapelRes.data);
      setJurusanList(jurusanRes.data || []);
    });
  }, []);

  const fetchJadwal = useCallback(() => {
    setLoading(true);
    const params = {};
    if (idKelas) params.id_kelas = idKelas;
    else if (filterIdJurusan) params.id_jurusan = filterIdJurusan;
    if (filterHari) params.hari = filterHari;
    if (filterIdMapel) params.id_mapel = filterIdMapel;

    api.get('/jadwal', { params }).then((res) => {
      setJadwal(res.data);
      setLoading(false);
    });
  }, [idKelas, filterIdJurusan, filterHari, filterIdMapel]);

  useEffect(() => {
    fetchJadwal();
  }, [fetchJadwal]);

  useEffect(() => {
    setIdKelas(null);
  }, [filterIdJurusan]);

  useEffect(() => {
    if (!idKelas) {
      setKelasMapel([]);
      return;
    }
    api.get('/mapel', { params: { id_kelas: idKelas } }).then((res) => {
      setKelasMapel(res.data);
    });
  }, [idKelas]);

  const displayMapel = idKelas ? kelasMapel : mapelList;

  const filteredKelas = kelas.filter(
    (k) => !filterIdJurusan || k.id_jurusan === filterIdJurusan
  );

  const filteredGuruOptions = guruList
    .filter((g) => !idKelas || g.kelas_list?.some((kl) => kl.id_kelas === idKelas))
    .map((g) => ({ value: g.id_user, label: `${g.nama}${g.nip ? ` (${g.nip})` : ''}` }));

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ hari: 'Senin' });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        id_kelas: idKelas,
        id_mapel: values.id_mapel,
        id_user: values.id_user,
        hari: values.hari,
        jam_mulai: values.jam_range[0].format('HH:mm'),
        jam_selesai: values.jam_range[1].format('HH:mm'),
      };

      await api.post('/admin/jadwal', payload);
      message.success('Jadwal berhasil ditambahkan');
      setModalOpen(false);
      fetchJadwal();
    } catch (error) {
      message.error(error?.response?.data?.detail || 'Gagal menyimpan jadwal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id_jadwal) => {
    try {
      await api.delete(`/admin/jadwal/${id_jadwal}`);
      message.success('Jadwal berhasil dihapus');
      fetchJadwal();
    } catch {
      message.error('Gagal menghapus jadwal');
    }
  };

  if (user?.role !== 'tu') {
    return <Typography.Text type="danger">Hanya TU yang dapat mengakses halaman ini.</Typography.Text>;
  }

  const columns = [
    { title: 'Hari', dataIndex: 'hari', key: 'hari', width: 100,
      render: (v) => <Tag>{v}</Tag>,
    },
    { title: 'Jam Mulai', dataIndex: 'jam_mulai', key: 'jam_mulai', width: 100 },
    { title: 'Jam Selesai', dataIndex: 'jam_selesai', key: 'jam_selesai', width: 100 },
    { title: 'Mata Pelajaran', dataIndex: 'nama_mapel', key: 'nama_mapel' },
    { title: 'Guru', dataIndex: 'nama_guru', key: 'nama_guru' },
    { title: 'Kelas', dataIndex: 'nama_kelas', key: 'nama_kelas' },
    { title: 'Jurusan', dataIndex: 'jurusan', key: 'jurusan' },
    {
      title: 'Aksi', key: 'aksi', width: 80,
      render: (_, record) => (
        <Popconfirm title="Hapus jadwal ini?" onConfirm={() => handleDelete(record.id_jadwal)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
        </Popconfirm>
      ),
    },
  ];

  const selectedKelasData = kelas.find((k) => k.id_kelas === idKelas);

  return (
    <>
      <Card
        title="Management Jadwal"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchJadwal} size="small">Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} disabled={!idKelas}>
              Tambah Jadwal
            </Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Select
            placeholder="Filter Jurusan"
            allowClear
            style={{ width: 200 }}
            value={filterIdJurusan}
            onChange={(v) => setFilterIdJurusan(v)}
            options={jurusanList.map((j) => ({
              value: j.id_jurusan,
              label: j.nama_jurusan,
            }))}
          />
          <Select
            placeholder="Pilih Kelas"
            style={{ width: 200 }}
            value={idKelas}
            onChange={(v) => setIdKelas(v)}
            options={filteredKelas.map((k) => ({
              value: k.id_kelas,
              label: `${k.nama_kelas}${k.jurusan ? ` (${k.jurusan})` : ''}`,
            }))}
          />
          <Select
            placeholder="Filter Mapel"
            allowClear
            style={{ width: 250 }}
            value={filterIdMapel}
            onChange={(v) => setFilterIdMapel(v)}
            options={displayMapel.map((m) => ({
              value: m.id_mapel,
              label: m.nama_mapel,
            }))}
          />
          <Select
            placeholder="Filter Hari"
            allowClear
            style={{ width: 150 }}
            value={filterHari}
            onChange={(v) => setFilterHari(v)}
            options={days.map((d) => ({ value: d, label: d }))}
          />
        </Space>

        <ResponsiveTable
          dataSource={jadwal}
          columns={columns}
          rowKey="id_jadwal"
          loading={loading}
          pagination={false}
          mobileTitle={(r) => r.nama_mapel || '-'}
          mobileSubtitle={(r) => [r.hari, r.jam_mulai && r.jam_selesai ? `${r.jam_mulai}-${r.jam_selesai}` : null].filter(Boolean).join(' · ')}
          excludeFromDetail={['aksi']}
          mobileActions={[
            {
              key: 'delete',
              label: 'Hapus',
              icon: <DeleteOutlined />,
              danger: true,
              confirmText: 'Hapus jadwal ini?',
              onClick: (record) => handleDelete(record.id_jadwal),
            },
          ]}
        />
      </Card>

      <Modal
        title={selectedKelasData
          ? `Tambah Jadwal — ${selectedKelasData.nama_kelas}${selectedKelasData.jurusan ? ` (${selectedKelasData.jurusan})` : ''}`
          : 'Tambah Jadwal'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="hari" label="Hari"
            rules={[{ required: true, message: 'Pilih hari' }]}>
            <Select
              options={days.map((d) => ({ value: d, label: d }))}
            />
          </Form.Item>
          <Form.Item name="jam_range" label="Jam"
            rules={[{ required: true, message: 'Pilih jam mulai dan selesai' }]}>
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} minuteStep={5} />
          </Form.Item>
          <Form.Item name="id_mapel" label="Mata Pelajaran"
            rules={[{ required: true, message: 'Pilih mata pelajaran' }]}>
            <Select
              showSearch
              placeholder="Cari mapel..."
              options={kelasMapel.map((m) => ({ value: m.id_mapel, label: m.nama_mapel }))}
              notFoundContent="Tidak ada mapel untuk kelas ini"
            />
          </Form.Item>
          <Form.Item name="id_user" label="Guru"
            rules={[{ required: true, message: 'Pilih guru' }]}>
            <Select
              showSearch
              placeholder="Cari guru..."
              options={filteredGuruOptions}
              notFoundContent="Tidak ada guru untuk kelas ini"
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
