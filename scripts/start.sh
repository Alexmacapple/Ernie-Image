#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

if [[ ! -d .venv ]]; then
    echo "Environnement virtuel introuvable. Lancer setup.sh d'abord."
    exit 1
fi

source .venv/bin/activate

# Modèles HF stockés dans le projet, pas dans ~/.cache/huggingface
export HF_HUB_CACHE="$PROJECT_DIR/models"
export HF_HOME="$PROJECT_DIR/models/hf_home"
export PYTHONUNBUFFERED="${PYTHONUNBUFFERED:-1}"

# En service public local, la stabilité mémoire prime sur le cache de kernels.
# Activer ponctuellement avec ERNIE_COMPILE=1 pour benchmark.
export ERNIE_COMPILE="${ERNIE_COMPILE:-0}"
export ERNIE_HOST="${ERNIE_HOST:-127.0.0.1}"
export ERNIE_RELOAD="${ERNIE_RELOAD:-0}"

echo "Ernie Studio - démarrage sur http://${ERNIE_HOST}:${ERNIE_PORT:-8300}"
echo "Modèles      - $HF_HUB_CACHE"
echo "Compile DiT  - ${ERNIE_COMPILE}"
echo "Reload dev   - ${ERNIE_RELOAD}"

UVICORN_ARGS=(server:app --host "${ERNIE_HOST}" --port "${ERNIE_PORT:-8300}" --no-access-log)
if [[ "$ERNIE_RELOAD" == "1" ]]; then
    UVICORN_ARGS+=(--reload)
fi

uvicorn "${UVICORN_ARGS[@]}"
