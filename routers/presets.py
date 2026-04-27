from fastapi import APIRouter

from pipeline_mlx import RATIO_PRESETS

router = APIRouter()


@router.get("/api/presets")
async def presets():
    return [
        {"name": name, "width": w, "height": h}
        for name, (w, h) in RATIO_PRESETS.items()
    ]
