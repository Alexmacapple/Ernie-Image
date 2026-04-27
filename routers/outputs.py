import json
import os
import re
from pathlib import Path
from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse

import config
from auth import get_current_user, get_current_user_hybrid

router = APIRouter()

_SEED_RE = re.compile(r"_seed(\d+)\.png$")


def _decode_filename(filename: str) -> str:
    decoded = filename
    for _ in range(3):
        next_decoded = unquote(decoded)
        if next_decoded == decoded:
            break
        decoded = next_decoded
    return decoded


def _output_path(filename: str) -> Path:
    decoded = _decode_filename(filename)
    if "\\" in decoded or Path(decoded).name != decoded or not decoded.endswith(".png"):
        raise HTTPException(400, detail="Nom de fichier invalide")

    outputs_dir = config.OUTPUTS_DIR.resolve()
    full_path = (outputs_dir / decoded).resolve()
    try:
        full_path.relative_to(outputs_dir)
    except ValueError:
        raise HTTPException(400, detail="Accès refusé") from None
    return full_path


def _read_sidecar(png_path) -> dict:
    sidecar = png_path.with_suffix(".json")
    if sidecar.exists():
        try:
            return json.loads(sidecar.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _seed_from_filename(filename: str) -> int | None:
    match = _SEED_RE.search(filename)
    if not match:
        return None
    return int(match.group(1))


def _list_output_items() -> list[dict]:
    if not config.OUTPUTS_DIR.exists():
        return []
    files = sorted(
        config.OUTPUTS_DIR.glob("*.png"),
        key=os.path.getmtime,
        reverse=True,
    )
    result = []
    for f in files:
        meta = _read_sidecar(f)
        result.append({
            "filename":   f.name,
            "url":        f"/api/outputs/{f.name}",
            "size_bytes": f.stat().st_size,
            "created_at": int(f.stat().st_mtime),
            "prompt":     meta.get("prompt"),
            "ratio":      meta.get("ratio"),
            "steps":      meta.get("steps"),
            "seed":       meta.get("seed") if meta.get("seed") is not None else _seed_from_filename(f.name),
            "width":      meta.get("width"),
            "height":     meta.get("height"),
        })
    return result


@router.get("/api/outputs")
async def list_outputs(
    page: int | None = Query(default=None, ge=1),
    page_size: int | None = Query(default=None, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    items = _list_output_items()
    if page is None and page_size is None:
        return items

    page = page or 1
    page_size = page_size or 18
    total = len(items)
    total_pages = max(1, (total + page_size - 1) // page_size)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": items[start:end],
        "page": page,
        "page_size": page_size,
        "total": total,
        "total_pages": total_pages,
    }


@router.get("/api/outputs/{filename}")
async def get_output(filename: str, current_user: dict = Depends(get_current_user_hybrid)):
    path = _output_path(filename)
    if not path.exists():
        raise HTTPException(404, detail="Image introuvable")
    return FileResponse(path, media_type="image/png")


@router.delete("/api/outputs/{filename}")
async def delete_output(filename: str, current_user: dict = Depends(get_current_user)):
    path = _output_path(filename)
    if not path.exists():
        raise HTTPException(404, detail="Image introuvable")

    path.unlink()
    path.with_suffix(".json").unlink(missing_ok=True)
    return {"deleted": filename}
