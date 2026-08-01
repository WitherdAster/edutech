import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Space, Modal, Form, Input,
  message, Popconfirm, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

export default function JurusanAdmin() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJurusan, setEditingJurusan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/jurusan').then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingJurusan(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingJurusan(record);
    form.setFieldsValue({ nama_jurusan: record.nama_jurusan });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingJurusan) {
        await api.put(`/admin/jurusan/${editingJurusan.id_jurusan}`, values);
        message.success('Jurusan berhasil diperbarui');
      } else {
        await api.post('/admin/jurusan', values);
        message.success('Jurusan berhasil ditambahkan');
      }

      setModalOpen(false);
      fetchData();
    } catch {
      // validation error or API error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id_jurusan) => {
    try {
      await api.delete(`/admin/jurusan/${id_jurusan}`);
      message.success('Jurusan berhasil dihapus');
      fetchData();
    } catch {
      message.error('Gagal menghapus jurusan');
    }
  };

  if (user?.role !== 'tu') {
    return <Typography.Text type="danger">Hanya TU yang dapat mengakses halaman ini.</Typography.Text>;
  }

  const columns = [
    { title: 'ID', dataIndex: 'id_jurusan', key: 'id_jurusan', width: 80 },
    { title: 'Nama Jurusan', dataIndex: 'nama_jurusan', key: 'nama_jurusan' },
    {
      title: 'Aksi', key: 'aksi', width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Hapus jurusan ini?" onConfirm={() => handleDelete(record.id_jurusan)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Data Jurusan"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} size="small">Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tambah Jurusan
            </Button>
          </Space>
        }
      >
        <ResponsiveTable
          dataSource={data}
          columns={columns}
          rowKey="id_jurusan"
          loading={loading}
          pagination={{ pageSize: 20 }}
          mobileTitle={(r) => r.nama_jurusan}
          mobileSubtitle={(r) => `ID: ${r.id_jurusan}`}
          excludeFromDetail={['aksi']}
          mobileActions={[
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
              confirmText: 'Hapus jurusan ini?',
              onClick: (record) => handleDelete(record.id_jurusan),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingJurusan ? 'Edit Jurusan' : 'Tambah Jurusan'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nama_jurusan" label="Nama Jurusan"
            rules={[{ required: true, message: 'Masukkan nama jurusan' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}