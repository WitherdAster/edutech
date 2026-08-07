import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginSelect from './pages/LoginSelect';
import Login from './pages/Login';
import SiswaLogin from './pages/SiswaLogin';
import SiswaDashboard from './pages/SiswaDashboard';
import Dashboard from './pages/Dashboard';
import Siswa from './pages/Siswa';
import Guru from './pages/Guru';
import Absensi from './pages/Absensi';
import Export from './pages/Export';
import MapelAdmin from './pages/MapelAdmin';
import JadwalAdmin from './pages/JadwalAdmin';
import JadwalGuru from './pages/JadwalGuru';
import JurusanAdmin from './pages/JurusanAdmin';
import KelasAdmin from './pages/KelasAdmin';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1B2A4A',
          colorInfo: '#0F766E',
          colorWarning: '#F97316',
          colorBgLayout: '#F8F9FA',
          colorBgContainer: '#FFFFFF',
          colorText: '#1F2937',
          colorTextSecondary: '#6B7280',
          borderRadius: 12,
          borderRadiusLG: 20,
          boxShadow: '0 2px 8px rgba(27,42,74,0.08), 0 8px 24px rgba(27,42,74,0.06)',
          boxShadowSecondary: '0 1px 3px rgba(27,42,74,0.10), 0 4px 12px rgba(27,42,74,0.08)',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        },
        components: {
          Button: {
            borderRadius: 14,
            controlHeightLG: 44,
          },
          Menu: {
            itemBorderRadius: 12,
            itemMarginInline: 8,
          },
        },
      }}
    >
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginSelect />} />
          <Route path="/login/instansi" element={<Login />} />
          <Route path="/login/siswa" element={<SiswaLogin />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/jadwal" element={<JadwalGuru />} />
            <Route path="/siswa" element={<Siswa />} />
            <Route path="/guru" element={<Guru />} />
            <Route path="/absensi" element={<Absensi />} />
            <Route path="/export" element={<Export />} />
            <Route path="/admin/mapel" element={<MapelAdmin />} />
            <Route path="/admin/jadwal" element={<JadwalAdmin />} />
            <Route path="/admin/jurusan" element={<JurusanAdmin />} />
            <Route path="/admin/kelas" element={<KelasAdmin />} />
          </Route>
          <Route path="/siswa/dashboard" element={<SiswaDashboard />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </ConfigProvider>
  );
}