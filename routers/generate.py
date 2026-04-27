import asyncio
import json
import random
import time
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

import config
import pipeline_mlx
from auth import get_current_user
from pipeline_mlx import RATIO_PRESETS

router = APIRouter()


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=8000)
    ratio: str | None = Field(None)
    width: int = Field(1024, ge=64, le=2048)
    height: int = Field(1024, ge=64, le=2048)
    steps: int = Field(8, ge=1, le=50)
    seed: int | None = Field(None, ge=0, le=2**31 - 1)
    client_request_id: str | None = Field(None, max_length=200)


def _sse(data: dict) -> str:
    return json.dumps(data, ensure_ascii=False)


def _write_sidecar(result: dict, req: GenerateRequest, width: int, height: int) -> None:
    sidecar = (config.OUTPUTS_DIR / result["filename"]).with_suffix(".json")
    data: dict = {
        "prompt":            req.prompt,
        "ratio":             req.ratio,
        "steps":             req.steps,
        "seed":              result["seed"],
        "width":             width,
        "height":            height,
        "elapsed_s":         result["elapsed"],
        "duration_seconds":  result["elapsed"],
        "model":             config.MODEL_NAME,
        "created_at":        datetime.now(timezone.utc).astimezone().isoformat(),
    }
    if req.client_request_id is not None:
        data["client_request_id"] = req.client_request_id
    sidecar.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def _consume_background_task(task: asyncio.Task) -> None:
    try:
        task.result()
    except asyncio.CancelledError:
        pass
    except Exception as exc:
        print(f"Ernie Studio - génération en arrière-plan en erreur : {exc}")


@router.post("/api/generate")
async def generate(req: GenerateRequest, current_user: dict = Depends(get_current_user)):
    s = pipeline_mlx.status()
    if not s["loaded"]:
        raise HTTPException(503, detail="Pipeline non chargé - réessayer dans quelques secondes")

    width, height = req.width, req.height
    if req.ratio:
        if req.ratio not in RATIO_PRESETS:
            raise HTTPException(422, detail=f"Preset inconnu : {req.ratio}")
        width, height = RATIO_PRESETS[req.ratio]
    elif (width, height) not in set(RATIO_PRESETS.values()):
        raise HTTPException(422, detail="Résolution non supportée : utiliser un preset valide")

    if not pipeline_mlx.reserve_generation_slot():
        raise HTTPException(409, detail="Une génération est déjà en cours")

    seed_resolved = req.seed if req.seed is not None else random.randint(0, 2**31 - 1)
    estimated_total = req.steps * pipeline_mlx._SECS_PER_STEP

    async def run_generation():
        result = await pipeline_mlx.generate(
            prompt=req.prompt,
            width=width,
            height=height,
            steps=req.steps,
            seed=seed_resolved,
            slot_acquired=True,
        )
        _write_sidecar(result, req, width, height)
        return result

    try:
        task = asyncio.create_task(run_generation())
    except Exception:
        pipeline_mlx.release_generation_slot()
        raise
    task.add_done_callback(_consume_background_task)

    async def stream():
        try:
            started_payload: dict = {
                "type":        "started",
                "steps":       req.steps,
                "width":       width,
                "height":      height,
                "estimated_s": round(estimated_total),
                "seed":        seed_resolved,
            }
            if req.client_request_id is not None:
                started_payload["client_request_id"] = req.client_request_id
            yield _sse(started_payload)

            t0 = time.time()
            while not task.done():
                await asyncio.sleep(2)
                elapsed = time.time() - t0
                pct = min(int(elapsed / estimated_total * 100), 95)
                estimated_step = min(int(elapsed / pipeline_mlx._SECS_PER_STEP) + 1, req.steps)
                eta = max(0.0, round((req.steps - estimated_step) * pipeline_mlx._SECS_PER_STEP, 1))
                yield _sse({
                    "type":           "progress",
                    "percent":        pct,
                    "elapsed_s":      round(elapsed, 1),
                    "estimated_step": estimated_step,
                    "total_steps":    req.steps,
                    "eta_seconds":    eta,
                })
        except asyncio.CancelledError:
            # Le calcul en thread n'est pas annulable : on le laisse finir pour
            # garder le verrou cohérent et produire le sidecar JSON.
            raise

        try:
            result = task.result()
        except Exception as exc:
            yield _sse({"type": "error", "detail": str(exc)})
            return

        done_payload: dict = {
            "type":      "done",
            "filename":  result["filename"],
            "outputs": [{
                "filename": result["filename"],
                "url":      f"/api/outputs/{result['filename']}",
                "seed":     seed_resolved,
                "width":    width,
                "height":   height,
            }],
            "elapsed_s": result["elapsed"],
            "seed":      result["seed"],
            "prompt":    req.prompt,
        }
        if req.client_request_id is not None:
            done_payload["client_request_id"] = req.client_request_id
        yield _sse(done_payload)

    return EventSourceResponse(stream())
