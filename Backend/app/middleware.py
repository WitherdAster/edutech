import os
from fastapi import Request
from fastapi.responses import JSONResponse

PROTECTED_PREFIXES = ["/attendance", "/register", "/api/public"]
# path yang di lindungi, harus menggunakan API Key, jika tidak maka akan di tolak aksesnya

async def api_key_middleware(request: Request, call_next):
# Membuat middleware untuk memeriksa API Key pada setiap request yang masuk ke path yang dilindungi
    expected = os.getenv("API_KEY", "")
    # Ambil API Key yang di set di environment variable, jika tidak ada maka akan menjadi string kosong
    path = request.url.path
    # Ambil path dari request yang masuk, misal /attendance atau /register

    if expected and any(path.startswith(p) for p in PROTECTED_PREFIXES):
        # Jika ada API Key yang di set di environment variable dan path dari request yang masuk termasuk ke dalam path yang dilindungi
        api_key = request.headers.get("X-API-Key", "")
        # Ambil API Key dari header request, jika tidak ada maka akan menjadi string kosong
        if api_key != expected:
            return JSONResponse(
                status_code=401,
                content={"detail": "API Key tidak valid"},
            )
        # Jika API Key yang diambil dari header request tidak sama dengan API Key yang di set di environment variable, maka akan mengembalikan response dengan status code 401 dan pesan "API Key tidak valid"

    return await call_next(request)
    # Jika API Key valid atau path tidak dilindungi, maka akan melanjutkan ke proses berikutnya
