from fastapi import APIRouter
from app.database import SessionLocal
from app.models import Kelas, Student

router = APIRouter(
    prefix="/api/public",
    tags=["Public"]
)


@router.get("/kelas")
def get_kelas():
    db = SessionLocal()
    try:
        kelas_list = db.query(Kelas).all()
        return [
            {"id_kelas": k.id_kelas, "nama_kelas": k.nama_kelas}
            for k in kelas_list
        ]
    finally:
        db.close()


@router.get("/siswa/{id_kelas}")
def get_siswa_by_kelas(id_kelas: int):
    db = SessionLocal()
    try:
        siswa_list = db.query(Student).filter(
            Student.id_kelas == id_kelas
        ).all()
        return [
            {
                "id_siswa": s.id_siswa,
                "nisn": s.nisn,
                "nama_siswa": s.nama_siswa
            }
            for s in siswa_list
        ]
    finally:
        db.close()
