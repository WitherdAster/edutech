from fastapi import FastAPI
from app.routes import register, attendance

app = FastAPI()

app.include_router(attendance.router)
app.include_router(register.router)