from sqlalchemy import Column, ForeignKey, Integer, String, Text, DateTime, Float
from sqlalchemy.sql import func
from app.database import Base


class Student(Base):
    __tablename__ = "siswa"

    id_siswa = Column(Integer, primary_key=True, index=True)
    nisn = Column(String(20), unique=True)
    nama_siswa = Column(String(100))
    id_kelas = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    embedding = Column(Text)


class FaceData(Base):
    __tablename__ = "face_data"

    id_face = Column(Integer, primary_key=True, index=True)
    id_siswa = Column(Integer, ForeignKey("siswa.id_siswa"))
    image_path = Column(Text)
    embedding = Column(Text)
    pose = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())


class Attendance(Base):
    __tablename__ = "absensi"

    id_absensi = Column(Integer, primary_key=True, index=True)
    id_siswa = Column(Integer)
    check_time = Column(DateTime)
    status = Column(String(50))
    similarity = Column(Float)
    image_path = Column(Text)