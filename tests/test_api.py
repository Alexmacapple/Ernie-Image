"""Tests des routes API - pipeline mocké, pas de MLX requis."""

import json
import asyncio
from unittest.mock import patch

import pytest
from fastapi import HTTPException


# ═══════════════════════════════════════════════════════════════════════════ #
#  /api/health                                                                #
# ═══════════════════════════════════════════════════════════════════════════ #

class TestHealth:
    def test_loading_returns_503(self, client):
        r = client.get("/api/health")
        assert r.status_code == 503
        assert r.json()["status"] == "loading"

    def test_loading_includes_elapsed(self, client):
        r = client.get("/api/health")
        body = r.json()
        assert "elapsed_s" in body
        assert body["elapsed_s"] is not None

    def test_ready_returns_200(self, client_ready):
        r = client_ready.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_error_returns_503(self, client, mock_pipeline_error):
        r = client.get("/api/health")
        assert r.status_code == 503
        assert r.json()["status"] in ("loading", "error")


# ═══════════════════════════════════════════════════════════════════════════ #
#  /api/status                                                                #
# ═══════════════════════════════════════════════════════════════════════════ #

class TestStatus:
    def test_structure(self, client):
        r = client.get("/api/status")
        assert r.status_code == 200
        body = r.json()
        for key in ("loaded", "loading_elapsed_s", "load_error", "generating", "secs_per_step_estimate"):
            assert key in body, f"clé manquante : {key}"

    def test_not_loaded(self, client):
        body = client.get("/api/status").json()
        assert body["loaded"] is False
        assert body["generating"] is False

    def test_loaded(self, client_ready):
        body = client_ready.get("/api/status").json()
        assert body["loaded"] is True

    def test_generating_flag(self, client_locked):
        body = client_locked.get("/api/status").json()
        assert body["generating"] is True


# ═══════════════════════════════════════════════════════════════════════════ #
#  /api/presets                                                               #
# ═══════════════════════════════════════════════════════════════════════════ #

class TestPresets:
    def test_returns_list(self, client):
        r = client.get("/api/presets")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_seven_presets(self, client):
        assert len(client.get("/api/presets").json()) == 7

    def test_preset_shape(self, client):
        for p in client.get("/api/presets").json():
            assert "name" in p
            assert "width" in p and isinstance(p["width"], int)
            assert "height" in p and isinstance(p["height"], int)

    def test_known_names(self, client):
        names = {p["name"] for p in client.get("/api/presets").json()}
        assert names == {"square", "landscape", "portrait", "landscape-soft", "portrait-soft", "cinema", "vertical"}

    def test_square_dimensions(self, client):
        presets = {p["name"]: p for p in client.get("/api/presets").json()}
        assert presets["square"]["width"] == 1024
        assert presets["square"]["height"] == 1024

    def test_cinema_is_landscape(self, client):
        presets = {p["name"]: p for p in client.get("/api/presets").json()}
        assert presets["cinema"]["width"] > presets["cinema"]["height"]


# ═══════════════════════════════════════════════════════════════════════════ #
#  /api/outputs                                                               #
# ═══════════════════════════════════════════════════════════════════════════ #

class TestOutputsList:
    def test_empty_dir(self, client, tmp_outputs):
        r = client.get("/api/outputs")
        assert r.status_code == 200
        assert r.json() == []

    def test_returns_all_png(self, client, outputs_with_files):
        r = client.get("/api/outputs")
        assert r.status_code == 200
        assert len(r.json()) == 3

    def test_item_shape(self, client, outputs_with_files):
        item = client.get("/api/outputs").json()[0]
        for key in ("filename", "url", "size_bytes", "created_at"):
            assert key in item

    def test_sidecar_prompt_exposed(self, client, outputs_with_files):
        items = {i["filename"]: i for i in client.get("/api/outputs").json()}
        assert items["20260426T120000_1024x1024_seed111.png"]["prompt"] == "a red apple"
        assert items["20260426T130000_1376x768_seed222.png"]["prompt"] == "a blue ocean at sunset"

    def test_sidecar_params_exposed(self, client, outputs_with_files):
        items = {i["filename"]: i for i in client.get("/api/outputs").json()}
        item = items["20260426T120000_1024x1024_seed111.png"]
        assert item["steps"] == 8
        assert item["seed"] == 111
        assert item["width"] == 1024
        assert item["height"] == 1024

    def test_missing_sidecar_returns_none(self, client, outputs_with_files):
        items = {i["filename"]: i for i in client.get("/api/outputs").json()}
        assert items["20260426T140000_1024x1024_seed333.png"]["prompt"] is None

    def test_seed_extracted_from_filename_when_sidecar_missing(self, client, outputs_with_files):
        items = {i["filename"]: i for i in client.get("/api/outputs").json()}
        assert items["20260426T140000_1024x1024_seed333.png"]["seed"] == 333

    def test_url_format(self, client, outputs_with_files):
        for item in client.get("/api/outputs").json():
            assert item["url"].startswith("/api/outputs/")
            assert item["url"].endswith(".png")

    def test_anti_chronologique(self, client, outputs_with_files):
        filenames = [i["filename"] for i in client.get("/api/outputs").json()]
        assert filenames == sorted(filenames, reverse=True)

    def test_paginated_outputs(self, client, tmp_outputs):
        import os

        for idx in range(30):
            p = tmp_outputs / f"20260426T{idx:06d}_1024x1024_seed{idx}.png"
            p.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 8)
            os.utime(p, (1_000_000 + idx, 1_000_000 + idx))

        r = client.get("/api/outputs?page=2&page_size=18")
        assert r.status_code == 200
        body = r.json()
        assert body["page"] == 2
        assert body["page_size"] == 18
        assert body["total"] == 30
        assert body["total_pages"] == 2
        assert len(body["items"]) == 12
        assert body["items"][0]["filename"] == "20260426T000011_1024x1024_seed11.png"

    def test_paginated_outputs_defaults_to_three_rows(self, client, tmp_outputs):
        import os

        for idx in range(19):
            p = tmp_outputs / f"20260426T{idx:06d}_1024x1024_seed{idx}.png"
            p.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 8)
            os.utime(p, (1_000_000 + idx, 1_000_000 + idx))

        r = client.get("/api/outputs?page=1")
        assert r.status_code == 200
        body = r.json()
        assert body["page_size"] == 18
        assert body["total_pages"] == 2
        assert len(body["items"]) == 18

    def test_paginated_outputs_validates_page_size(self, client, tmp_outputs):
        r = client.get("/api/outputs?page=1&page_size=101")
        assert r.status_code == 422

    def test_requires_auth(self, client_no_auth):
        r = client_no_auth.get("/api/outputs")
        assert r.status_code == 401


class TestOutputsGet:
    def test_not_found(self, client, tmp_outputs):
        r = client.get("/api/outputs/inexistant.png")
        assert r.status_code == 404

    def test_traversal_rejected(self, client, tmp_outputs):
        r = client.get("/api/outputs/../config.py")
        assert r.status_code in (400, 404)

    def test_encoded_traversal_rejected(self, client, tmp_outputs):
        r = client.get("/api/outputs/..%2Fconfig.py")
        assert r.status_code in (400, 404)

    def test_double_encoded_traversal_rejected(self, tmp_outputs):
        from routers.outputs import _output_path
        with pytest.raises(HTTPException) as exc:
            _output_path("..%252Fconfig.py")
        assert exc.value.status_code == 400

    def test_backslash_rejected_after_decoding(self, tmp_outputs):
        from routers.outputs import _output_path
        with pytest.raises(HTTPException) as exc:
            _output_path("subdir%5Cfile.png")
        assert exc.value.status_code == 400

    def test_symlink_outside_outputs_rejected(self, tmp_outputs):
        from routers.outputs import _output_path
        outside_dir = tmp_outputs.parent / f"{tmp_outputs.name}_outside"
        outside_dir.mkdir()
        target = outside_dir / "outside.png"
        target.write_bytes(b"not in outputs")
        link = tmp_outputs / "link.png"
        link.symlink_to(target)

        with pytest.raises(HTTPException) as exc:
            _output_path("link.png")
        assert exc.value.status_code == 400

    def test_slash_in_name_rejected(self, client, tmp_outputs):
        r = client.get("/api/outputs/subdir/file.png")
        # FastAPI normalise les chemins - soit 400 soit 404
        assert r.status_code in (400, 404)

    def test_serves_existing_png(self, client, outputs_with_files):
        r = client.get("/api/outputs/20260426T120000_1024x1024_seed111.png")
        assert r.status_code == 200
        assert r.headers["content-type"] == "image/png"

    def test_requires_auth(self, client_no_auth, outputs_with_files):
        r = client_no_auth.get("/api/outputs/20260426T120000_1024x1024_seed111.png")
        assert r.status_code == 401


# ═══════════════════════════════════════════════════════════════════════════ #
#  /api/generate - chemins d'erreur (sans SSE réel)                          #
# ═══════════════════════════════════════════════════════════════════════════ #

class TestGenerateErrors:
    def test_requires_auth(self, client_no_auth):
        r = client_no_auth.post("/api/generate", json={"prompt": "a cat"})
        assert r.status_code == 401

    def test_503_when_not_loaded(self, client):
        r = client.post("/api/generate", json={"prompt": "a cat"})
        assert r.status_code == 503

    def test_409_when_locked(self, client_ready):
        with patch("pipeline_mlx.reserve_generation_slot", return_value=False):
            r = client_ready.post("/api/generate", json={"prompt": "a cat"})
        assert r.status_code == 409

    def test_422_prompt_vide(self, client_ready):
        r = client_ready.post("/api/generate", json={"prompt": ""})
        assert r.status_code == 422

    def test_prompt_accepts_8000_chars(self, client_ready):
        with patch("pipeline_mlx.reserve_generation_slot", return_value=False):
            r = client_ready.post("/api/generate", json={"prompt": "a" * 8000})
        assert r.status_code == 409

    def test_prompt_rejects_8001_chars(self, client_ready):
        r = client_ready.post("/api/generate", json={"prompt": "a" * 8001})
        assert r.status_code == 422

    def test_422_steps_hors_limites(self, client_ready):
        r = client_ready.post("/api/generate", json={"prompt": "a cat", "steps": 0})
        assert r.status_code == 422

    def test_422_ratio_inconnu(self, client_ready):
        r = client_ready.post("/api/generate", json={"prompt": "a cat", "ratio": "inexistant"})
        assert r.status_code in (422, 503)  # 503 si pipeline pas encore prêt au niveau vérif


# ═══════════════════════════════════════════════════════════════════════════ #
#  /api/generate - flux SSE réel                                             #
# ═══════════════════════════════════════════════════════════════════════════ #

class TestGenerateSSE:
    def test_stream_started_progress_done(self, tmp_outputs, client_ready, monkeypatch):
        import routers.generate as generate_router

        original_sleep = generate_router.asyncio.sleep
        generate_calls = []

        async def fast_sleep(delay):
            await original_sleep(0)

        async def fake_generate(**kwargs):
            generate_calls.append(kwargs)
            await original_sleep(0.01)
            return {
                "filename": f"20260427T120000_1024x1024_seed{kwargs['seed']}.png",
                "elapsed": 0.1,
                "seed": kwargs["seed"],
            }

        monkeypatch.setattr("pipeline_mlx.reserve_generation_slot", lambda: True)
        monkeypatch.setattr("pipeline_mlx.generate", fake_generate)
        monkeypatch.setattr(generate_router.asyncio, "sleep", fast_sleep)

        with client_ready.stream(
            "POST",
            "/api/generate",
            json={
                "prompt": "a cat",
                "ratio": "square",
                "steps": 1,
                "seed": 42,
                "client_request_id": "ui-test-123",
            },
        ) as response:
            assert response.status_code == 200
            text = "".join(response.iter_text())

        events = [
            json.loads(line.removeprefix("data: ").strip())
            for line in text.splitlines()
            if line.startswith("data: ")
        ]

        assert events[0]["type"] == "started"
        assert events[0]["seed"] == 42
        assert events[0]["client_request_id"] == "ui-test-123"
        assert "steps" in events[0]
        assert "width" in events[0] and "height" in events[0]
        assert generate_calls == [{
            "prompt": "a cat",
            "width": 1024,
            "height": 1024,
            "steps": 1,
            "seed": 42,
            "slot_acquired": True,
        }]

        progress_events = [e for e in events if e["type"] == "progress"]
        assert progress_events, "aucun événement progress reçu"
        for pe in progress_events:
            assert "estimated_step" in pe
            assert "total_steps" in pe
            assert "eta_seconds" in pe
            assert "percent" in pe

        assert events[-1]["type"] == "done"
        assert events[-1]["seed"] == 42
        assert events[-1]["client_request_id"] == "ui-test-123"
        assert "filename" in events[-1], "done.filename absent (compat)"
        assert "outputs" in events[-1], "done.outputs[] absent"
        assert events[-1]["outputs"][0]["filename"] == events[-1]["filename"]
        assert events[-1]["outputs"][0]["seed"] == 42

        sidecar_data = json.loads((tmp_outputs / "20260427T120000_1024x1024_seed42.json").read_text(encoding="utf-8"))
        assert sidecar_data["prompt"] == "a cat"
        assert sidecar_data["model"] == "ernie-image-turbo"
        assert sidecar_data["client_request_id"] == "ui-test-123"
        assert "created_at" in sidecar_data
        assert "duration_seconds" in sidecar_data


# ═══════════════════════════════════════════════════════════════════════════ #
#  Exceptions serveur                                                        #
# ═══════════════════════════════════════════════════════════════════════════ #

class TestUnhandledErrors:
    def test_500_response_is_generic(self):
        from server import _unhandled

        response = asyncio.run(_unhandled(None, RuntimeError("secret token")))
        assert response.status_code == 500
        assert json.loads(response.body) == {"error": "Erreur serveur interne"}


# ═══════════════════════════════════════════════════════════════════════════ #
#  _read_sidecar - unitaire                                                   #
# ═══════════════════════════════════════════════════════════════════════════ #

class TestReadSidecar:
    def test_reads_valid_sidecar(self, tmp_path):
        from routers.outputs import _read_sidecar
        png = tmp_path / "img.png"
        png.write_bytes(b"")
        (tmp_path / "img.json").write_text(
            json.dumps({"prompt": "hello", "steps": 4}), encoding="utf-8"
        )
        meta = _read_sidecar(png)
        assert meta["prompt"] == "hello"
        assert meta["steps"] == 4

    def test_missing_sidecar_returns_empty(self, tmp_path):
        from routers.outputs import _read_sidecar
        png = tmp_path / "img.png"
        png.write_bytes(b"")
        assert _read_sidecar(png) == {}

    def test_corrupt_sidecar_returns_empty(self, tmp_path):
        from routers.outputs import _read_sidecar
        png = tmp_path / "img.png"
        png.write_bytes(b"")
        (tmp_path / "img.json").write_text("{ invalid json !!!", encoding="utf-8")
        assert _read_sidecar(png) == {}
