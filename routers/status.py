import time

from fastapi import APIRouter
from fastapi.responses import JSONResponse

import pipeline_mlx

router = APIRouter()


@router.get("/api/health")
async def health():
    s = pipeline_mlx.status()
    if s["load_error"]:
        return JSONResponse({"status": "error", "detail": s["load_error"]}, status_code=503)
    if not s["loaded"]:
        elapsed = round(time.time() - s["loading_since"], 1) if s["loading_since"] else None
        return JSONResponse({"status": "loading", "elapsed_s": elapsed}, status_code=503)
    return {"status": "ok"}


@router.get("/api/status")
async def status():
    s = pipeline_mlx.status()
    elapsed = round(time.time() - s["loading_since"], 1) if s["loading_since"] else None
    return {
        "loaded": s["loaded"],
        "loading_elapsed_s": elapsed,
        "load_error": s["load_error"],
        "generating": s["locked"],
        "secs_per_step_estimate": s["secs_per_step_estimate"],
    }
