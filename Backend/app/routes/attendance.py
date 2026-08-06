from fastapi import APIRouter, UploadFile, File, Form
from app.database import SessionLocal
from app.models import Attendance, Student, Jadwal
from app.services.face_service import get_embedding
from app.services.recognition_service import recognize_face

import time

import shutil
import uuid
import os
import tempfile
from datetime import date, datetime

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

UPLOAD_DIR = os.getenv("ATTENDANCE_UPLOAD_DIR", tempfile.gettempdir())

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


@router.post("/")
async def attendance(
    id_kelas: int = Form(...),
    pose: str = Form(...),
    file: UploadFile = File(...)
):

    total_start_time = time.time()

    db = SessionLocal()

    saved_path = None

    try:
        t1 = time.time()

        filename = (
            f"{uuid.uuid4().hex}_{file.filename}"
        )

        filepath = os.path.join(
            UPLOAD_DIR,
            filename
        )

        with open(filepath, "wb") as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )

        print(
            f"[PROFILE] Save File: {time.time()-t1:.3f}s"
        )

        saved_path = filepath

        t2 = time.time()

        embedding_absen = get_embedding(
            filepath
        )

        print(
            f"[PROFILE] Get Embedding: {time.time()-t2:.3f}s"
        )

        if embedding_absen is None:

            return {
                "status": "gagal",
                "message": "Wajah tidak ditemukan"
            }

        t3 = time.time()

        best_id, similarity = recognize_face(
            db,
            embedding_absen,
            pose,
            id_kelas=id_kelas
        )

        print(
            f"[PROFILE] Recognize Face: {time.time()-t3:.3f}s"
        )

        similarity = float(similarity)

        if best_id is None:

            return {
                "status": "Tidak Dikenal",
                "similarity": similarity
            }

        t4 = time.time()

        siswa = db.query(Student).filter(
            Student.id_siswa == best_id,
            Student.id_kelas == id_kelas
        ).first()

        print(
            f"[PROFILE] Query Student: {time.time()-t4:.3f}s"
        )
        if siswa is None:

            return {
                "status": "Tidak Dikenal",
                "similarity": similarity
            }

        today = date.today()
        today_start = datetime(today.year, today.month, today.day)
        today_end = datetime(today.year, today.month, today.day + 1)

        existing = db.query(Attendance).filter(
            Attendance.id_siswa == siswa.id_siswa,
            Attendance.check_time >= today_start,
            Attendance.check_time < today_end,
            Attendance.id_jadwal == None,
        ).first()

        if existing:
            effective_status = existing.status_manual if existing.status_manual else existing.status

            if effective_status == "Hadir":
                return {
                    "status": "Sudah Hadir",
                    "nama_siswa": siswa.nama_siswa,
                    "similarity": similarity,
                }

            existing.status = "Hadir"
            existing.check_time = datetime.now()
            existing.similarity = similarity
            existing.image_path = ""
        else:
            attendance_data = Attendance(
                id_siswa=siswa.id_siswa,
                check_time=datetime.now(),
                status="Hadir",
                similarity=similarity,
                image_path="",
                id_jadwal=None,
            )
            db.add(attendance_data)

        db.commit()

        print(
            f"[PROFILE] TOTAL: {time.time()-total_start_time:.3f}s"
        )

        return {
            "status": "Hadir",
            "nama_siswa": siswa.nama_siswa,
            "similarity": similarity
        }

    except Exception as e:

        print("ERROR:", e)

        return {
            "status": "error",
            "message": str(e)
        }

    finally:

        db.close()

        if saved_path:

            try:

                if os.path.exists(saved_path):

                    os.remove(saved_path)

            except Exception as e:

                print("GAGAL HAPUS:", e)