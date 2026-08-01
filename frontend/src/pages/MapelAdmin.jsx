import { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Space, Modal, Form, Input,
  message, Popconfirm, Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import ResponsiveTable from '../components/ResponsiveTable';

export default function MapelAdmin() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMapel, setEditingMapel] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/mapel').then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingMapel(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingMapel(record);
    form.setFieldsValue({ nama_mapel: record.nama_mapel });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingMapel) {
        await api.put(`/admin/mapel/${editingMapel.id_mapel}`, values);
        message.success('Mapel berhasil diperbarui');
      } else {
        await api.post('/admin/mapel', values);
        message.success('Mapel berhasil ditambahkan');
      }

      setModalOpen(false);
      fetchData();
    } catch {
      // validation error or API error
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id_mapel) => {
    try {
      await api.delete(`/admin/mapel/${id_mapel}`);
      message.success('Mapel berhasil dihapus');
      fetchData();
    } catch {
      message.error('Gagal menghapus mapel');
    }
  };

  if (user?.role !== 'tu') {
    return <Typography.Text type="danger">Hanya TU yang dapat mengakses halaman ini.</Typography.Text>;
  }

  const columns = [
    { title: 'ID', dataIndex: 'id_mapel', key: 'id_mapel', width: 80 },
    { title: 'Nama Mata Pelajaran', dataIndex: 'nama_mapel', key: 'nama_mapel' },
    {
      title: 'Aksi', key: 'aksi', width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />}
            onClick={() => openEdit(record)}>Edit</Button>
          <Popconfirm title="Hapus mapel ini?" onConfirm={() => handleDelete(record.id_mapel)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>Hapus</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Data Mata Pelajaran"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} size="small">Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Tambah Mapel
            </Button>
          </Space>
        }
      >
        <ResponsiveTable
          dataSource={data}
          columns={columns}
          rowKey="id_mapel"
          loading={loading}
          pagination={{ pageSize: 20 }}
          mobileTitle={(r) => r.nama_mapel}
          mobileSubtitle={(r) => `ID: ${r.id_mapel}`}
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
              confirmText: 'Hapus mapel ini?',
              onClick: (record) => handleDelete(record.id_mapel),
            },
          ]}
        />
      </Card>

      <Modal
        title={editingMapel ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="nama_mapel" label="Nama Mata Pelajaran"
            rules={[{ required: true, message: 'Masukkan nama mata pelajaran' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
