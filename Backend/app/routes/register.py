from fastapi import APIRouter, UploadFile, File, Form
from app.database import SessionLocal
from app.models import Student, FaceData
from app.services.face_service import get_embedding

import shutil
import uuid
import json
import os
import tempfile
import numpy as np

router = APIRouter(
    prefix="/register",
    tags=["Register"]
)

UPLOAD_DIR = os.getenv("REGISTER_UPLOAD_DIR", tempfile.gettempdir())
os.makedirs(UPLOAD_DIR, exist_ok=True)

poses = ["depan", "kanan", "kiri"]


@router.post("/")
async def register_student(
    id_siswa: int = Form(...),
    files: list[UploadFile] = File(...)
):

    db = SessionLocal()
    saved_paths = []

    try:

        if len(files) < 3:
            return {
                "status": "error",
                "message": "Harus 3 pose"
            }

        siswa = db.query(Student).filter(
            Student.id_siswa == id_siswa
        ).first()

        if not siswa:
            return {
                "status": "error",
                "message": "Siswa tidak ditemukan"
            }

        print(f"SISWA => {siswa.nama_siswa} (ID: {siswa.id_siswa})")

        # hapus face_data lama (re-register)
        db.query(FaceData).filter(
            FaceData.id_siswa == siswa.id_siswa
        ).delete()

        # kumpulkan embedding
        embeddings = []

        for index, file in enumerate(files):

            filename = f"{uuid.uuid4().hex}_{file.filename}"
            filepath = os.path.join(UPLOAD_DIR, filename)

            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            saved_paths.append(filepath)

            print(f"FILE => {filepath}")

            embedding = get_embedding(filepath, detector_backend="opencv")

            if embedding is None:
                print("EMBEDDING GAGAL")
                continue

            print(f"EMBEDDING BERHASIL {poses[index]}")

            face = FaceData(
                id_siswa=siswa.id_siswa,
                image_path="",
                embedding=json.dumps(embedding),
                pose=poses[index]
            )

            db.add(face)

            embeddings.append(np.array(embedding, dtype=np.float32))

        if len(embeddings) < 3:
            db.rollback()
            return {
                "status": "error",
                "message": "Embedding tidak lengkap"
            }

        # master embedding
        master_embedding = np.mean(embeddings, axis=0)
        master_embedding = master_embedding / np.linalg.norm(master_embedding)

        siswa.embedding = json.dumps(master_embedding.tolist())

        db.commit()

        print(f"MASTER EMBEDDING {siswa.nama_siswa} BERHASIL")

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

        for fp in saved_paths:
            try:
                if os.path.exists(fp):
                    os.remove(fp)
            except Exception as e:
                print("GAGAL HAPUS:", e)
