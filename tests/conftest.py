"""Fixtures partagées - pipeline mocké via status(), pas d'accès aux internals."""

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# --------------------------------------------------------------------------- #
# Helpers de construction des dicts status                                    #
# --------------------------------------------------------------------------- #

def _status_loading():
    return {"loaded": False, "loading_since": 1_000_000.0, "load_error": None, "locked": False, "secs_per_step_estimate": 5.5}

def _status_ready():
    return {"loaded": True, "loading_since": 1_000_000.0, "load_error": None, "locked": False, "secs_per_step_estimate": 5.5}

def _status_locked():
    return {"loaded": True, "loading_since": 1_000_000.0, "load_error": None, "locked": True, "secs_per_step_estimate": 5.5}

def _status_error():
    return {"loaded": False, "loading_since": None, "load_error": "CUDA out of memory", "locked": False, "secs_per_step_estimate": 5.5}


# --------------------------------------------------------------------------- #
# Fixtures pipeline                                                           #
# --------------------------------------------------------------------------- #

def _patch_pipeline(status_dict):
    """Patche status() ET empêche load_pipeline de s'exécuter réellement."""
    return patch.multiple(
        "pipeline_mlx",
        status=MagicMock(return_value=status_dict),
        load_pipeline=MagicMock(),
    )

@pytest.fixture
def mock_pipeline_loading():
    with _patch_pipeline(_status_loading()):
        yield

@pytest.fixture
def mock_pipeline_ready():
    with _patch_pipeline(_status_ready()):
        yield

@pytest.fixture
def mock_pipeline_locked():
    with _patch_pipeline(_status_locked()):
        yield

@pytest.fixture
def mock_pipeline_error():
    with _patch_pipeline(_status_error()):
        yield


# --------------------------------------------------------------------------- #
# Fixture : répertoire outputs temporaire                                     #
# --------------------------------------------------------------------------- #

@pytest.fixture
def tmp_outputs(tmp_path, monkeypatch):
    import config
    monkeypatch.setattr(config, "OUTPUTS_DIR", tmp_path)
    return tmp_path


@pytest.fixture
def outputs_with_files(tmp_outputs):
    """3 PNG + 2 sidecars JSON."""
    files = [
        ("20260426T140000_1024x1024_seed333.png", None),
        ("20260426T130000_1376x768_seed222.png",  {"prompt": "a blue ocean at sunset", "steps": 4, "seed": 222, "width": 1376, "height": 768,  "ratio": "cinema",  "elapsed_s": 21.1}),
        ("20260426T120000_1024x1024_seed111.png", {"prompt": "a red apple",            "steps": 8, "seed": 111, "width": 1024, "height": 1024, "ratio": "square",  "elapsed_s": 38.2}),
    ]
    for png_name, meta in files:
        p = tmp_outputs / png_name
        p.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00" * 8)
        # Mtime décroissant dans l'ordre de la liste → seed333 le plus récent
        import os, time
        mtime = 1_000_000 + (len(files) - 1 - files.index((png_name, meta)))
        os.utime(p, (mtime, mtime))
        if meta:
            (tmp_outputs / png_name.replace(".png", ".json")).write_text(
                json.dumps(meta, ensure_ascii=False), encoding="utf-8"
            )
    return tmp_outputs


# --------------------------------------------------------------------------- #
# Fixtures TestClient                                                         #
# --------------------------------------------------------------------------- #

def _install_auth_overrides(app):
    import auth

    def fake_user():
        return {"user_id": "test-user", "username": "test"}

    app.dependency_overrides[auth.get_current_user] = fake_user
    app.dependency_overrides[auth.get_current_user_hybrid] = fake_user


@pytest.fixture
def client(mock_pipeline_loading):
    from server import app
    app.dependency_overrides.clear()
    _install_auth_overrides(app)
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def client_ready(mock_pipeline_ready):
    from server import app
    app.dependency_overrides.clear()
    _install_auth_overrides(app)
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def client_locked(mock_pipeline_locked):
    from server import app
    app.dependency_overrides.clear()
    _install_auth_overrides(app)
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def client_no_auth(mock_pipeline_ready):
    from server import app
    app.dependency_overrides.clear()
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()
