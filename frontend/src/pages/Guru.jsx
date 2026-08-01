import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Space, Modal, Form, Input, Select, DatePicker,
  message, Popconfirm, Typography, Tag, Transfer,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, BookOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

export default function Guru() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGuru, setEditingGuru] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const [kelasModal, setKelasModal] = useState(null);
  const [allKelas, setAllKelas] = useState([]);
  const [assignedKelas, setAssignedKelas] = useState([]);
  const [kelasLoading, setKelasLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/guru').then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingGuru(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingGuru(record);
    form.setFieldsValue({
      nama: record.nama,
      nip: record.nip,
      jenis_kelamin: record.jenis_kelamin,
      tempat_lahir: record.tempat_lahir,
      tanggal_lahir: record.tanggal_lahir ? dayjs(record.tanggal_lahir) : null,
      agama: record.agama,
      alamat: record.alamat,
      no_telp: record.no_telp,
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

      if (editingGuru) {
        await api.put(`/admin/guru/${editingGuru.id_guru}`, payload);
        message.success('Guru berhasil diperbarui');
      } else {
        await api.post('/admin/guru', payload);
        message.success('Guru berhasil ditambahkan');
      }

      setModalOpen(false);
      fetchData();
    } catch {
      // validation error or API error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id_guru) => {
    try {
      await api.delete(`/admin/guru/${id_guru}`);
      message.success('Guru berhasil dinonaktifkan');
      fetchData();
    } catch {
      message.error('Gagal menonaktifkan guru');
    }
  };

  const openKelasModal = async (record) => {
    setKelasModal(record);
    setKelasLoading(true);

    try {
      const [kelasRes, assignedRes] = await Promise.all([
        api.get('/kelas'),
        api.get(`/admin/guru/${record.id_guru}/kelas`),
      ]);
      setAllKelas(kelasRes.data);
      setAssignedKelas(assignedRes.data.map((a) => a.id_kelas));
    } catch {
      message.error('Gagal memuat data kelas');
    } finally {
      setKelasLoading(false);
    }
  };

  const handleKelasChange = async (targetKeys) => {
    const toAdd = targetKeys.filter((k) => !assignedKelas.includes(k));
    const toRemove = assignedKelas.filter((k) => !targetKeys.includes(k));

    try {
      for (const id_kelas of toAdd) {
        await api.post(`/admin/guru/${kelasModal.id_guru}/kelas`, { id_kelas });
      }
      for (const id_kelas of toRemove) {
        await api.delete(`/admin/guru/${kelasModal.id_guru}/kelas/${id_kelas}`);
      }

      setAssignedKelas(targetKeys);
      message.success('Kelas berhasil diperbarui');
      fetchData();
    } catch {
      message.error('Gagal memperbarui kelas');
    }
  };

  const columns = [
    { title: 'NIP', dataIndex: 'nip', key: 'nip', render: (v) => v || '-' },
    { title: 'Nama', dataIndex: 'nama', key: 'nama' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    {
      title: 'Jenis Kelamin', dataIndex: 'jenis_kelamin', key: 'jenis_kelamin',
      render: (v) => v === 'L' ? 'Laki-laki' : v === 'P' ? 'Perempuan' : '-',
    },
    {
      title: 'Kelas Ajar', dataIndex: 'kelas_list', key: 'kelas_list',
      render: (list) => (
        <Space size={4} wrap>
          {(list || []).length > 0
            ? list.map((k) => <Tag key={k.id_kelas}>{k.nama_kelas}</Tag>)
            : <Typography.Text type="secondary">-</Typography.Text>
          }
        </Space>
      ),
    },
    ...(user?.role === 'tu'
      ? [{
          title: 'Aksi', key: 'aksi', width: 200,
          render: (_, record) => (
            <Space>
              <Button type="link" size="small" icon={<BookOutlined />}
                onClick={() => openKelasModal(record)}>Kelas</Button>
              <Button type="link" size="small" icon={<EditOutlined />}
                onClick={() => openEdit(record)}>Edit</Button>
              <Popconfirm title="Nonaktifkan guru ini?" onConfirm={() => handleDelete(record.id_guru)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>Nonaktifkan</Button>
              </Popconfirm>
            </Space>
          ),
        }]
      : []),
  ];

  if (user?.role !== 'tu') {
    return <Typography.Text type="danger">Hanya TU yang dapat mengakses halaman ini.</Typography.Text>;
  }

  return (
    <>
      <Card
        title="Data Guru"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} size="small">Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tambah Guru
            </Button>
          </Space>
        }
      >
        <ResponsiveTable
          dataSource={data}
          columns={columns}
          rowKey="id_guru"
          loading={loading}
          pagination={{ pageSize: 20 }}
          mobileTitle={(r) => r.nama}
          mobileSubtitle={(r) => r.username || '-'}
          excludeFromDetail={['aksi']}
          mobileActions={[
            {
              key: 'kelas',
              label: 'Kelas',
              icon: <BookOutlined />,
              onClick: openKelasModal,
            },
            {
              key: 'edit',
              label: 'Edit',
              icon: <EditOutlined />,
              onClick: openEdit,
            },
            {
              key: 'nonaktif',
              label: 'Nonaktifkan',
              icon: <DeleteOutlined />,
              danger: true,
              confirmText: 'Nonaktifkan guru ini?',
              onClick: (record) => handleDelete(record.id_guru),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingGuru ? 'Edit Guru' : 'Tambah Guru'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={submitting}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editingGuru && (
            <>
              <Form.Item name="username" label="Username" rules={[{ required: true, message: 'Masukkan username' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Masukkan password' }]}>
                <Input.Password />
              </Form.Item>
            </>
          )}
          <Form.Item name="nama" label="Nama Lengkap" rules={[{ required: true, message: 'Masukkan nama' }]}>
            <Input />
          </Form.Item>
          <Space style={{ width: '100%' }} size="middle">
            <Form.Item name="nip" label="NIP" style={{ flex: 1 }}>
              <Input />
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
          <Form.Item name="no_telp" label="No. Telepon">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Kelola Kelas - ${kelasModal?.nama || ''}`}
        open={!!kelasModal}
        onCancel={() => setKelasModal(null)}
        footer={null}
        width={520}
      >
        {kelasLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Typography.Text>Memuat data...</Typography.Text>
          </div>
        ) : (
          <Transfer
            dataSource={allKelas.map((k) => ({
              key: k.id_kelas,
              title: `${k.nama_kelas}${k.jurusan ? ` (${k.jurusan})` : ''}`,
            }))}
            targetKeys={assignedKelas}
            onChange={handleKelasChange}
            render={(item) => item.title}
            titles={['Semua Kelas', 'Kelas Ajar']}
            listStyle={{ width: 220, height: 320 }}
            showSearch
            filterOption={(inputValue, item) => item.title.toLowerCase().includes(inputValue.toLowerCase())}
            oneWay
          />
        )}
      </Modal>
    </>
  );
}
