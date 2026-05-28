from fastapi import APIRouter, UploadFile, File, Form
from app.database import SessionLocal
from app.models import Attendance, Student
from app.services.face_service import get_embedding
from app.services.recognition_service import recognize_multi_pose

import shutil
import uuid
import os
from datetime import datetime

router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)

UPLOAD_DIR = "uploads_attendance"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


@router.post("/")
async def attendance(
    id_kelas: int = Form(...),
    files: list[UploadFile] = File(...)
):

    db = SessionLocal()

    try:

        embeddings_absen = []

        saved_paths = []

        # simpan semua file pose
        for file in files:

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

            saved_paths.append(filepath)

            emb = get_embedding(filepath)

            if emb is not None:
                embeddings_absen.append(emb)

        # validasi pose lengkap
        if len(embeddings_absen) < 3:

            return {
                "status": "gagal",
                "message": "Embedding tidak lengkap"
            }

        # recognition
        best_id, similarity = recognize_multi_pose(
            db,
            embeddings_absen
        )

        # PAKSA menjadi float python
        similarity = float(similarity)

        # tidak dikenal
        if best_id is None:

            return {
                "status": "Tidak Dikenal",
                "similarity": similarity
            }

        # cek kelas siswa
        siswa = db.query(Student).filter(
            Student.id_siswa == best_id,
            Student.id_kelas == id_kelas
        ).first()

        if siswa is None:

            return {
                "status": "Tidak Dikenal",
                "similarity": similarity
            }

        print(
            f"\nKEPUTUSAN AKHIR: "
            f"{siswa.nama_siswa} "
            f"dinyatakan hadir "
            f"dengan similarity "
            f"{similarity}"
        )

        # simpan absensi
        attendance_data = Attendance(
            id_siswa=siswa.id_siswa,
            check_time=datetime.now(),
            status="Hadir",
            similarity=similarity,
            image_path=saved_paths[0]
        )

        db.add(attendance_data)

        db.commit()

        return {
            "status": "Hadir",
            "nama_siswa": siswa.nama_siswa,
            "similarity": similarity
        }

    except Exception as e:

        print("ERROR ATTENDANCE:", e)

        return {
            "status": "error",
            "message": str(e)
        }

    finally:
        db.close()