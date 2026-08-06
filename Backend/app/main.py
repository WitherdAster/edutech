import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import register, attendance, web, web_api, siswa, public
from app.database import engine, Base
from app import models
from app.middleware import api_key_middleware
from sqlalchemy import inspect, text

app = FastAPI()
# Deklarasi penggunaan FastAPI

@app.on_event("startup")
# Beraksi Ketika dinyalakan/startup

def on_startup():
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    # Inspeksi semua yang ada di bagian database, karena engine sudah mengarah ke bagian database

    absensi_columns = [c["name"] for c in inspector.get_columns("absensi")]
    # di dalam kolom absensi ambil semua nama dari field yang ada saja, tidak perlu ambil tipe data nya atau hal lain

    if "id_jadwal" not in absensi_columns:
    # Jika field id_jadwal tidak ada ketika server jalan

        with engine.connect() as conn:
        # Buka koneksi ke dalam database
            conn.execute(text("ALTER TABLE absensi ADD COLUMN id_jadwal INT NULL AFTER id_siswa"))
            conn.commit()
            # Eksekusi query

    mapel_columns = [c["name"] for c in inspector.get_columns("mata_pelajaran")]

    if "id_jurusan" not in mapel_columns:
    # Jika field id_jurusan belum ada di tabel mata_pelajaran

        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE mata_pelajaran ADD COLUMN id_jurusan INT NULL AFTER nama_mapel"))
            conn.commit()

    if "mata_pelajaran" not in [t for t in inspector.get_table_names()]:
    # Jika saat di inspect tadi tidak ada yang namanya tabel mata_pelajaran

        Base.metadata.create_all(bind=engine)
        # create semua tabel yang ada di models, karena Base menyimpan semua data models

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.middleware("http")(api_key_middleware)
# mengizinkan interaksi dari beberapa domain yang di izinkan saja, dengan semua method beserta header

app.mount("/static", StaticFiles(directory="app/web/static"), name="static")


app.include_router(attendance.router)
app.include_router(register.router)
app.include_router(siswa.router)
app.include_router(web_api.router)
app.include_router(public.router)
app.include_router(web.router)
# daftar route yang ada