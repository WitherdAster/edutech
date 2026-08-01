import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Button, Typography, Grid,
} from 'antd';
import {
  DashboardOutlined, TeamOutlined, CheckSquareOutlined,
  FileExcelOutlined, LogoutOutlined, MenuOutlined, UserOutlined,
  BookOutlined, ScheduleOutlined, BankOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isTu = user?.role === 'tu';

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/jadwal', icon: <ScheduleOutlined />, label: 'Jadwal' },
    { key: '/siswa', icon: <TeamOutlined />, label: 'Siswa' },
    { key: '/absensi', icon: <CheckSquareOutlined />, label: 'Absensi' },
    ...(isTu ? [
      { key: '/guru', icon: <UserOutlined />, label: 'Guru' },
      { key: '/admin/jurusan', icon: <BankOutlined />, label: 'Jurusan' },
      { key: '/admin/kelas', icon: <AppstoreOutlined />, label: 'Kelas' },
      { key: '/admin/mapel', icon: <BookOutlined />, label: 'Mata Pelajaran' },
      { key: '/admin/jadwal', icon: <AppstoreOutlined />, label: 'Admin Jadwal' },
      { key: '/export', icon: <FileExcelOutlined />, label: 'Export Excel' },
    ] : []),
  ];

  const onMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) setSidebarOpen(false);
  };

  if (isMobile) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          background: '#001529', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Button type="text" icon={<MenuOutlined />} onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: '#fff', fontSize: 20 }} />
          <Typography.Text style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>EduTech</Typography.Text>
          <Button type="text" icon={<LogoutOutlined />} onClick={logout}
            style={{ color: '#fff' }} />
        </Header>

        {sidebarOpen && (
          <div style={{
            position: 'fixed', top: 64, left: 0, right: 0, bottom: 0, zIndex: 99,
            background: 'rgba(0,0,0,0.5)',
          }} onClick={() => setSidebarOpen(false)}>
            <div style={{ width: 250, background: '#001529', height: '100%', paddingTop: 8 }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ padding: '12px 16px', color: '#fff' }}>
                <div style={{ fontWeight: 600 }}>{user?.nama}</div>
                <div style={{ fontSize: 12, opacity: 0.7, textTransform: 'uppercase' }}>{user?.role}</div>
              </div>
              <Menu mode="vertical" theme="dark" items={menuItems}
                selectedKeys={[location.pathname]} onClick={onMenuClick} />
            </div>
          </div>
        )}

        <Content style={{ padding: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={220} theme="dark">
        <div style={{ padding: '20px 16px', color: '#fff', textAlign: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>EduTech</Typography.Title>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>{user?.nama}</div>
          <div style={{ fontSize: 11, opacity: 0.5, textTransform: 'uppercase' }}>{user?.role}</div>
        </div>
        <Menu mode="inline" theme="dark" items={menuItems}
          selectedKeys={[location.pathname]} onClick={onMenuClick} />
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff', padding: '0 24px', display: 'flex',
          justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #f0f0f0',
        }}>
          <Button type="text" icon={<LogoutOutlined />} onClick={logout}>Logout</Button>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
