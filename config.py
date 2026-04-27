import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
OUTPUTS_DIR = BASE_DIR / "outputs"
VENDOR_DIR = BASE_DIR / "vendor" / "mlx-ernie-image"
FRONTEND_DIR = BASE_DIR / "frontend"
MODELS_DIR = BASE_DIR / "models"

# Forcer le cache HF dans le répertoire du projet avant tout import HF/transformers
os.environ.setdefault("HF_HUB_CACHE", str(MODELS_DIR))
os.environ.setdefault("HF_HOME", str(MODELS_DIR / "hf_home"))

MODEL_NAME = "ernie-image-turbo"
MODEL_ID   = "treadon/ERNIE-Image-Turbo-MLX"

PORT = int(os.getenv("ERNIE_PORT", "8300"))
ERNIE_COMPILE = os.getenv("ERNIE_COMPILE", "0") == "1"
ERNIE_QUANTIZE: int | None = int(q) if (q := os.getenv("ERNIE_QUANTIZE", "")) in ("4", "8") else None

CORS_ORIGINS = os.getenv("ERNIE_CORS_ORIGINS", "http://localhost:8300").split(",")

KEYCLOAK_URL = os.getenv("KEYCLOAK_URL", "http://localhost:8082")
KEYCLOAK_REALM = os.getenv("KEYCLOAK_REALM", "harmonia")
KEYCLOAK_CLIENT_ID = os.getenv("KEYCLOAK_CLIENT_ID", "omnistudio")
