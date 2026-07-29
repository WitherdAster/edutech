import { useState, useEffect, useCallback } from 'react';
import {
  Table, Card, Button, Space, Modal, Form, Input, Select,
  message, Popconfirm, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function KelasAdmin() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [jurusanList, setJurusanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/kelas').then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const fetchJurusan = useCallback(() => {
    api.get('/jurusan').then((res) => {
      setJurusanList(res.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
    fetchJurusan();
  }, [fetchData, fetchJurusan]);

  const openCreate = () => {
    setEditingKelas(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingKelas(record);
    form.setFieldsValue({
      nama_kelas: record.nama_kelas,
      id_jurusan: record.id_jurusan,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      values.id_jurusan = Number(values.id_jurusan);
      setSubmitting(true);

      if (editingKelas) {
        await api.put(`/admin/kelas/${editingKelas.id_kelas}`, values);
        message.success('Kelas berhasil diperbarui');
      } else {
        await api.post('/admin/kelas', values);
        message.success('Kelas berhasil ditambahkan');
      }

      setModalOpen(false);
      fetchData();
    } catch (err) {
      message.error(err?.response?.data?.detail || err.message || 'Gagal menyimpan data kelas');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id_kelas) => {
    try {
      await api.delete(`/admin/kelas/${id_kelas}`);
      message.success('Kelas berhasil dihapus');
      fetchData();
    } catch (err) {
      message.error(err?.response?.data?.detail || err.message || 'Gagal menghapus kelas');
    }
  };

  if (user?.role !== 'tu') {
    return <Typography.Text type="danger">Hanya TU yang dapat mengakses halaman ini.</Typography.Text>;
  }

  const columns = [
    { title: 'ID', dataIndex: 'id_kelas', key: 'id_kelas', width: 80 },
    { title: 'Nama Kelas', dataIndex: 'nama_kelas', key: 'nama_kelas' },
    {
      title: 'Jurusan', dataIndex: 'jurusan', key: 'jurusan',
      render: (val) => val || '-',
    },
    {
      title: 'Aksi', key: 'aksi', width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Hapus kelas ini?" onConfirm={() => handleDelete(record.id_kelas)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Data Kelas"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} size="small">Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tambah Kelas
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id_kelas"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingKelas ? 'Edit Kelas' : 'Tambah Kelas'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nama_kelas" label="Nama Kelas"
            rules={[{ required: true, message: 'Masukkan nama kelas' }]}>
            <Input placeholder="Contoh: X-A" />
          </Form.Item>
          <Form.Item name="id_jurusan" label="Jurusan"
            rules={[{ required: true, message: 'Pilih jurusan' }]}>
            <Select placeholder="Pilih jurusan" options={jurusanList.map(j => ({
              value: j.id_jurusan,
              label: j.nama_jurusan,
            }))} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
