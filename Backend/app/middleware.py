import os
from fastapi import Request
from fastapi.responses import JSONResponse

PROTECTED_PREFIXES = ["/attendance", "/register", "/api/public"]


async def api_key_middleware(request: Request, call_next):
    expected = os.getenv("API_KEY", "")
    path = request.url.path

    if expected and any(path.startswith(p) for p in PROTECTED_PREFIXES):
        api_key = request.headers.get("X-API-Key", "")
        if api_key != expected:
            return JSONResponse(
                status_code=401,
                content={"detail": "API Key tidak valid"},
            )

    return await call_next(request)
