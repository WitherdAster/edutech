from sqlalchemy import Column, Date, Enum, ForeignKey, Integer, String, Text, DateTime, Float, Boolean, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Jurusan(Base):
    __tablename__ = "jurusan"

    id_jurusan = Column(Integer, primary_key=True, index=True)
    nama_jurusan = Column(String(100))

    kelas_list = relationship("Kelas", back_populates="jurusan")
    mapel_list = relationship("MataPelajaran", back_populates="jurusan_rel")


class Kelas(Base):
    __tablename__ = "kelas"

    id_kelas = Column(Integer, primary_key=True, index=True)
    nama_kelas = Column(String(50))
    id_jurusan = Column(Integer, ForeignKey("jurusan.id_jurusan"))

    jurusan = relationship("Jurusan", back_populates="kelas_list")
    siswa_list = relationship("Student", back_populates="kelas_rel")
    guru_kelas_list = relationship("GuruKelas", back_populates="kelas_rel")


class Student(Base):
    __tablename__ = "siswa"

    id_siswa = Column(Integer, primary_key=True, index=True)
    nisn = Column(String(20), unique=True)
    nama_siswa = Column(String(100))
    id_kelas = Column(Integer, ForeignKey("kelas.id_kelas"))
    jenis_kelamin = Column(Enum('L', 'P'), nullable=True)
    tempat_lahir = Column(String(50), nullable=True)
    tanggal_lahir = Column(Date, nullable=True)
    agama = Column(String(20), nullable=True)
    alamat = Column(Text, nullable=True)
    no_telp = Column(String(20), nullable=True)
    tahun_masuk = Column("tahun masuk", Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    embedding = Column(Text)

    kelas_rel = relationship("Kelas", back_populates="siswa_list")
    face_data_list = relationship("FaceData", back_populates="siswa_rel")
    absensi_list = relationship("Attendance", back_populates="siswa_rel")


class FaceData(Base):
    __tablename__ = "face_data"

    id_face = Column(Integer, primary_key=True, index=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id_siswa"))
    image_path = Column(Text)
    embedding = Column(Text)
    pose = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())

    siswa_rel = relationship("Student", back_populates="face_data_list")


class Attendance(Base):
    __tablename__ = "absensi"

    id_absensi = Column(Integer, primary_key=True, index=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id_siswa"))
    id_jadwal = Column(Integer, ForeignKey("jadwal.id_jadwal"), nullable=True)
    check_time = Column(DateTime, server_default=func.now())
    status = Column(String(50))
    similarity = Column(Float)
    image_path = Column(Text)
    status_manual = Column(String(20), nullable=True)
    keterangan = Column(Text, nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id_user"), nullable=True)
    updated_at = Column(DateTime, nullable=True)

    siswa_rel = relationship("Student", back_populates="absensi_list")
    jadwal_rel = relationship("Jadwal", back_populates="absensi_list")
    updated_by_rel = relationship("User")


class User(Base):
    __tablename__ = 'users'

    id_user = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(Enum('guru', 'tu'), nullable=False)
    nama = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())

    guru = relationship("Guru", back_populates="user_rel", uselist=False)
    guru_kelas_list = relationship("GuruKelas", back_populates="user_rel")

    def __repr__(self):
        return f"<User {self.username} - Role: {self.role}>"


class Guru(Base):
    __tablename__ = "guru"

    id_guru = Column(Integer, primary_key=True, autoincrement=True)
    id_user = Column(Integer, ForeignKey("users.id_user"), unique=True, nullable=False)
    nip = Column(String(30), unique=True, nullable=True)
    jenis_kelamin = Column(Enum('L', 'P'), nullable=True)
    tempat_lahir = Column(String(50), nullable=True)
    tanggal_lahir = Column(Date, nullable=True)
    agama = Column(String(20), nullable=True)
    alamat = Column(Text, nullable=True)
    no_telp = Column(String(20), nullable=True)

    user_rel = relationship("User", back_populates="guru")


class GuruKelas(Base):
    __tablename__ = "guru_kelas"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_user = Column(Integer, ForeignKey("users.id_user"), nullable=False)
    id_kelas = Column(Integer, ForeignKey("kelas.id_kelas"), nullable=False)

    user_rel = relationship("User")
    kelas_rel = relationship("Kelas", back_populates="guru_kelas_list")


class MataPelajaran(Base):
    __tablename__ = "mata_pelajaran"

    id_mapel = Column(Integer, primary_key=True, index=True)
    nama_mapel = Column(String(100), nullable=False)
    id_jurusan = Column(Integer, ForeignKey("jurusan.id_jurusan"), nullable=True)

    jadwal_list = relationship("Jadwal", back_populates="mapel_rel")
    jurusan_rel = relationship("Jurusan", back_populates="mapel_list")


class Jadwal(Base):
    __tablename__ = "jadwal"

    id_jadwal = Column(Integer, primary_key=True, index=True)
    id_mapel = Column(Integer, ForeignKey("mata_pelajaran.id_mapel"), nullable=False)
    id_user = Column(Integer, ForeignKey("users.id_user"), nullable=False)
    id_kelas = Column(Integer, ForeignKey("kelas.id_kelas"), nullable=False)
    hari = Column(Enum('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'), nullable=False)
    jam_mulai = Column(Time, nullable=False)
    jam_selesai = Column(Time, nullable=False)

    mapel_rel = relationship("MataPelajaran", back_populates="jadwal_list")
    user_rel = relationship("User")
    kelas_rel = relationship("Kelas")
    absensi_list = relationship("Attendance", back_populates="jadwal_rel")
