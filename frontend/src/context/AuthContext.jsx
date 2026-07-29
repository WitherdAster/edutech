import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [siswa, setSiswa] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedSiswa = localStorage.getItem('siswa');

    try {
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      } else if (token && savedSiswa) {
        setSiswa(JSON.parse(savedSiswa));
      }
    } catch (e) {
      console.warn('Saved session corrupted, clearing:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('siswa');
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('siswa');
    setUser(null);
    setSiswa(null);
  };

  const loginSiswa = async (nisn, nama_siswa) => {
    const res = await api.post('/auth/siswa', { nisn, nama_siswa });
    const { access_token, siswa: siswaData } = res.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('siswa', JSON.stringify(siswaData));
    setSiswa(siswaData);
    return siswaData;
  };

  const logoutSiswa = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('siswa');
    setSiswa(null);
  };

  return (
    <AuthContext.Provider value={{ user, siswa, loading, login, logout, loginSiswa, logoutSiswa }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
