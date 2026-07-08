from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter(tags=["Web Administration"])


@router.get("/", response_class=HTMLResponse)
async def halaman_utama():
    return HTMLResponse("<h1>EduTech API</h1><p>Backend is running. Use the React frontend at http://localhost:5173</p>")
