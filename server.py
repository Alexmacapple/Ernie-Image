import asyncio
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

import config
import pipeline_mlx
from routers import register_all


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self';"
        )
        return response


class CacheControlMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        path = request.url.path
        if path.endswith(".html") or path in ("/", ""):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        elif path.endswith((".js", ".css")):
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        elif path.startswith("/dsfr/") or path.endswith((".woff2", ".svg")):
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    config.OUTPUTS_DIR.mkdir(exist_ok=True)
    # Charger le pipeline en arrière-plan : le serveur accepte les requêtes
    # immédiatement, /api/health retourne 503 tant que le pipeline n'est pas prêt.
    loop = asyncio.get_running_loop()
    loop.run_in_executor(
        None,
        pipeline_mlx.load_pipeline,
        config.ERNIE_QUANTIZE,
        config.ERNIE_COMPILE,
    )
    yield


app = FastAPI(title="Ernie Studio", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(CacheControlMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


@app.exception_handler(Exception)
async def _unhandled(request: Request, exc: Exception):
    print(f"[ernie] 500 unhandled: {exc}", file=sys.stderr)
    return JSONResponse({"error": "Erreur serveur interne"}, status_code=500)


register_all(app)

if config.FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(config.FRONTEND_DIR), html=True), name="frontend")
