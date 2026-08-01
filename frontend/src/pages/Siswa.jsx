import { useState, useEffect, useCallback } from 'react';
import {
  Select, Input, Card, Space, Button, Modal, Form, DatePicker,
  message, Popconfirm,
} from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

export default function Siswa() {
  const { user } = useAuth();
  const [siswa, setSiswa] = useState([]);
  const [kelas, setKelas] = useState([]);
  const [idKelas, setIdKelas] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchSiswa = useCallback(() => {
    setLoading(true);
    const params = {};
    if (idKelas) params.id_kelas = idKelas;
    if (search) params.search = search;
    api.get('/siswa', { params }).then((res) => {
      setSiswa(res.data);
      setLoading(false);
    });
  }, [idKelas, search]);

  useEffect(() => {
    api.get('/kelas').then((res) => setKelas(res.data));
  }, []);

  useEffect(() => {
    fetchSiswa();
  }, [fetchSiswa]);

  const openCreate = () => {
    setEditingSiswa(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingSiswa(record);
    form.setFieldsValue({
      nisn: record.nisn,
      nama_siswa: record.nama_siswa,
      id_kelas: record.id_kelas,
      jenis_kelamin: record.jenis_kelamin,
      tempat_lahir: record.tempat_lahir,
      tanggal_lahir: record.tanggal_lahir ? dayjs(record.tanggal_lahir) : null,
      agama: record.agama,
      alamat: record.alamat,
      no_telp: record.no_telp,
      tahun_masuk: record.tahun_masuk,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const payload = {
        ...values,
        tanggal_lahir: values.tanggal_lahir
          ? values.tanggal_lahir.format('YYYY-MM-DD')
          : null,
      };

      if (editingSiswa) {
        await api.put(`/admin/siswa/${editingSiswa.id_siswa}`, payload);
        message.success('Siswa berhasil diperbarui');
      } else {
        await api.post('/admin/siswa', payload);
        message.success('Siswa berhasil ditambahkan');
      }

      setModalOpen(false);
      fetchSiswa();
    } catch {
      // validation error or API error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id_siswa) => {
    try {
      await api.delete(`/admin/siswa/${id_siswa}`);
      message.success('Siswa berhasil dihapus');
      fetchSiswa();
    } catch {
      message.error('Gagal menghapus siswa');
    }
  };

  const columns = [
    { title: 'NISN', dataIndex: 'nisn', key: 'nisn' },
    { title: 'Nama', dataIndex: 'nama_siswa', key: 'nama_siswa' },
    { title: 'Kelas', dataIndex: 'kelas', key: 'kelas' },
    ...(user?.role === 'tu'
      ? [
          { title: 'Jurusan', dataIndex: 'jurusan', key: 'jurusan' },
          { title: 'JK', dataIndex: 'jenis_kelamin', key: 'jenis_kelamin', render: (v) => v || '-' },
          {
            title: 'Aksi', key: 'aksi', width: 120,
            render: (_, record) => (
              <Space>
                <Button type="link" size="small" icon={<EditOutlined />}
                  onClick={() => openEdit(record)}>Edit</Button>
                <Popconfirm title="Hapus siswa ini?" onConfirm={() => handleDelete(record.id_siswa)}>
                  <Button type="link" size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Card
        title="Data Siswa"
        extra={
          user?.role === 'tu' ? (
            <Space>
              <Button icon={<ReloadOutlined />} onClick={fetchSiswa} size="small">Refresh</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Tambah Siswa
              </Button>
            </Space>
          ) : null
        }
      >
        <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <Select
            placeholder="Filter Kelas"
            allowClear
            style={{ width: 160 }}
            onChange={(v) => setIdKelas(v)}
            options={kelas.map((k) => ({ value: k.id_kelas, label: k.nama_kelas }))}
          />
          <Input
            placeholder="Cari nama..."
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Space>
        <ResponsiveTable
          dataSource={siswa}
          columns={columns}
          rowKey="id_siswa"
          loading={loading}
          pagination={{ pageSize: 20 }}
          mobileTitle={(r) => r.nama_siswa}
          mobileSubtitle={(r) => [r.kelas, r.jurusan].filter(Boolean).join(' · ') || '-'}
          excludeFromDetail={['aksi']}
          mobileActions={user?.role === 'tu' ? [
            {
              key: 'edit',
              label: 'Edit',
              icon: <EditOutlined />,
              onClick: openEdit,
            },
            {
              key: 'delete',
              label: 'Hapus',
              icon: <DeleteOutlined />,
              danger: true,
              confirmText: 'Hapus siswa ini?',
              onClick: (record) => handleDelete(record.id_siswa),
            },
          ] : []}
        />
      </Card>

      <Modal
        title={editingSiswa ? 'Edit Siswa' : 'Tambah Siswa'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="nisn" label="NISN" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Masukkan NISN' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="nama_siswa" label="Nama Lengkap" style={{ flex: 2 }}
              rules={[{ required: true, message: 'Masukkan nama' }]}>
              <Input />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="id_kelas" label="Kelas" style={{ flex: 1 }}
              rules={[{ required: true, message: 'Pilih kelas' }]}>
              <Select
                options={kelas.map((k) => ({ value: k.id_kelas, label: k.nama_kelas }))}
              />
            </Form.Item>
            <Form.Item name="jenis_kelamin" label="Jenis Kelamin" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: 'L', label: 'Laki-laki' },
                  { value: 'P', label: 'Perempuan' },
                ]}
                allowClear
              />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="tempat_lahir" label="Tempat Lahir" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="tanggal_lahir" label="Tanggal Lahir" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="agama" label="Agama">
            <Input />
          </Form.Item>
          <Form.Item name="alamat" label="Alamat">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="no_telp" label="No. Telepon" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item name="tahun_masuk" label="Tahun Masuk" style={{ flex: 1 }}>
              <Select
                showSearch
                options={Array.from(
                  { length: 10 },
                  (_, i) => ({ value: 2020 + i, label: String(2020 + i) })
                )}
                allowClear
              />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </>
  );
}
