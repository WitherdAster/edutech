from fastapi import APIRouter, UploadFile, File, Form
from app.database import SessionLocal
from app.models import Student, FaceData
from app.services.face_service import get_embedding

import shutil
import uuid
import json
import os
import numpy as np

router = APIRouter(
    prefix="/register",
    tags=["Register"]
)

UPLOAD_DIR = "uploads_register"
os.makedirs(UPLOAD_DIR, exist_ok=True)

poses = ["depan", "kanan", "kiri"]


@router.post("/")
async def register_student(
    nisn: str = Form(...),
    nama_siswa: str = Form(...),
    id_kelas: int = Form(...),
    files: list[UploadFile] = File(...)
):

    db = SessionLocal()

    try:

        # =========================
        # VALIDASI FILE
        # =========================

        if len(files) < 3:
            return {
                "status": "error",
                "message": "Harus 3 pose"
            }

        # =========================
        # SIMPAN SISWA
        # =========================

        siswa = Student(
            nisn=nisn,
            nama_siswa=nama_siswa,
            id_kelas=id_kelas,
            embedding="[]"
        )

        db.add(siswa)
        db.commit()
        db.refresh(siswa)

        print(f"SISWA => {siswa.nama_siswa}")

        # =========================
        # KUMPULKAN EMBEDDING
        # =========================

        embeddings = []

        for index, file in enumerate(files):

            filename = (
                f"{uuid.uuid4().hex}_"
                f"{file.filename}"
            )

            filepath = os.path.join(
                UPLOAD_DIR,
                filename
            )

            # simpan file
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(
                    file.file,
                    buffer
                )

            print(f"FILE => {filepath}")

            # ekstrak embedding
            embedding = get_embedding(filepath)

            if embedding is None:
                print("EMBEDDING GAGAL")
                continue

            print(
                f"EMBEDDING BERHASIL "
                f"{poses[index]}"
            )

            # simpan ke face_data
            face = FaceData(
                id_siswa=siswa.id_siswa,
                image_path=filepath,
                embedding=json.dumps(embedding),
                pose=poses[index]
            )

            db.add(face)

            # simpan untuk master embedding
            embeddings.append(
                np.array(
                    embedding,
                    dtype=np.float32
                )
            )

        # =========================
        # VALIDASI EMBEDDING
        # =========================

        if len(embeddings) < 3:

            db.rollback()

            return {
                "status": "error",
                "message": "Embedding tidak lengkap"
            }

        # =========================
        # MASTER EMBEDDING
        # =========================

        master_embedding = np.mean(
            embeddings,
            axis=0
        )

        # normalize
        master_embedding = (
            master_embedding /
            np.linalg.norm(master_embedding)
        )

        # simpan ke tabel siswa
        siswa.embedding = json.dumps(
            master_embedding.tolist()
        )

        db.commit()

        print(
            f"MASTER EMBEDDING "
            f"{siswa.nama_siswa} BERHASIL"
        )

        return {
            "status": "success",
            "message": "Registrasi berhasil",
            "id_siswa": siswa.id_siswa,
            "nama_siswa": siswa.nama_siswa
        }

    except Exception as e:

        db.rollback()

        print("ERROR REGISTER:", e)

        return {
            "status": "error",
            "message": str(e)
        }

    finally:
        db.close()