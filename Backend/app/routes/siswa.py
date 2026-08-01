from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload
from app.auth import get_db, create_access_token, get_current_student
from app.models import Student, Attendance, Kelas, Jurusan, Jadwal, MataPelajaran

router = APIRouter(prefix="/api", tags=["Siswa"])


class SiswaLoginRequest(BaseModel):
    nisn: str
    nama_siswa: str


@router.post("/auth/siswa")
def siswa_login(req: SiswaLoginRequest, db: Session = Depends(get_db)):
    student = (
        db.query(Student)
        .options(
            joinedload(Student.kelas_rel).joinedload(Kelas.jurusan)
        )
        .filter(
            Student.nisn == req.nisn,
            Student.nama_siswa == req.nama_siswa,
        )
        .first()
    )
    if not student:
        raise HTTPException(status_code=401, detail="NISN atau nama siswa tidak cocok")

    token = create_access_token({"sub": student.id_siswa, "role": "siswa"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "siswa": {
            "id_siswa": student.id_siswa,
            "nisn": student.nisn,
            "nama_siswa": student.nama_siswa,
            "kelas": student.kelas_rel.nama_kelas if student.kelas_rel else None,
            "jurusan": student.kelas_rel.jurusan.nama_jurusan if student.kelas_rel and student.kelas_rel.jurusan else None,
        },
    }


@router.get("/siswa/me")
def siswa_me(
    siswa: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .options(
            joinedload(Student.kelas_rel).joinedload(Kelas.jurusan)
        )
        .filter(Student.id_siswa == siswa.id_siswa)
        .first()
    )
    return {
        "id_siswa": student.id_siswa,
        "nisn": student.nisn,
        "nama_siswa": student.nama_siswa,
        "jenis_kelamin": student.jenis_kelamin,
        "tempat_lahir": student.tempat_lahir,
        "tanggal_lahir": student.tanggal_lahir.isoformat() if student.tanggal_lahir else None,
        "kelas": student.kelas_rel.nama_kelas if student.kelas_rel else None,
        "jurusan": student.kelas_rel.jurusan.nama_jurusan if student.kelas_rel and student.kelas_rel.jurusan else None,
    }


@router.get("/siswa/absensi")
def siswa_absensi(
    siswa: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    today = date.today()
    today_start = datetime(today.year, today.month, today.day)
    today_end = datetime(today.year, today.month, today.day + 1)
    hari_ini = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"][today.weekday()] if today.weekday() < 5 else None

    base = db.query(Attendance).filter(
        Attendance.id_siswa == siswa.id_siswa,
        Attendance.check_time >= today_start,
        Attendance.check_time < today_end,
        Attendance.id_jadwal == None,
    ).first()

    jadwal_list = db.query(Jadwal).options(
        joinedload(Jadwal.mapel_rel),
        joinedload(Jadwal.user_rel),
    ).filter(
        Jadwal.id_kelas == siswa.id_kelas,
        Jadwal.hari == hari_ini,
    ).order_by(Jadwal.jam_mulai).all()

    result = []
    for j in jadwal_list:
        per_jadwal = db.query(Attendance).filter(
            Attendance.id_siswa == siswa.id_siswa,
            Attendance.id_jadwal == j.id_jadwal,
        ).first()

        if per_jadwal:
            status_display = per_jadwal.status_manual if per_jadwal.status_manual else per_jadwal.status
            check_time = per_jadwal.check_time.isoformat() if per_jadwal.check_time else None
        elif base:
            status_display = base.status_manual if base.status_manual else base.status
            check_time = base.check_time.isoformat() if base.check_time else None
        else:
            status_display = "Belum Absen"
            check_time = None

        result.append({
            "id_jadwal": j.id_jadwal,
            "mata_pelajaran": j.mapel_rel.nama_mapel if j.mapel_rel else None,
            "nama_guru": j.user_rel.nama if j.user_rel else None,
            "jam_mulai": j.jam_mulai.strftime("%H:%M") if j.jam_mulai else None,
            "jam_selesai": j.jam_selesai.strftime("%H:%M") if j.jam_selesai else None,
            "check_time": check_time,
            "status": status_display,
        })

    return result


@router.get("/siswa/absensi/history")
def siswa_absensi_history(
    siswa: Student = Depends(get_current_student),
    db: Session = Depends(get_db),
    page: int = 1,
    per_page: int = 20,
):
    total = (
        db.query(Attendance)
        .filter(Attendance.id_siswa == siswa.id_siswa)
        .count()
    )

    absensi_list = (
        db.query(Attendance)
        .options(
            joinedload(Attendance.jadwal_rel).joinedload(Jadwal.mapel_rel),
            joinedload(Attendance.jadwal_rel).joinedload(Jadwal.user_rel),
        )
        .filter(Attendance.id_siswa == siswa.id_siswa)
        .order_by(Attendance.check_time.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "data": [
            {
                "id_absensi": a.id_absensi,
                "check_time": a.check_time.isoformat() if a.check_time else None,
                "status": a.status_manual if a.status_manual else a.status,
                "keterangan": a.keterangan,
                "mata_pelajaran": a.jadwal_rel.mapel_rel.nama_mapel if a.jadwal_rel and a.jadwal_rel.mapel_rel else ("-" if a.id_jadwal else "Base"),
                "nama_guru": a.jadwal_rel.user_rel.nama if a.jadwal_rel and a.jadwal_rel.user_rel else None,
            }
            for a in absensi_list
        ],
    }
