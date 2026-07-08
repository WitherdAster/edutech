import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import register, attendance, web, web_api, siswa, public
from app.database import engine, Base
from app import models
from sqlalchemy import inspect, text

app = FastAPI()

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    inspector = inspect(engine)
    absensi_columns = [c["name"] for c in inspector.get_columns("absensi")]
    if "id_jadwal" not in absensi_columns:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE absensi ADD COLUMN id_jadwal INT NULL AFTER id_siswa"))
            conn.commit()
    if "mata_pelajaran" not in [t for t in inspector.get_table_names()]:
        Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="app/web/static"), name="static")


app.include_router(attendance.router)
app.include_router(register.router)
app.include_router(siswa.router)
app.include_router(web_api.router)


app.include_router(public.router)
app.include_router(web.router)