# Ernie Studio

Application web de génération d'images via [ERNIE-Image Turbo](https://github.com/Sandjab/Ernie), optimisée pour Apple Silicon (M1 Ultra / 64 Go).

**Stack** : FastAPI · DSFR · MLX · Keycloak
**Port** : 8300
**Pipeline** : text encoder PyTorch+MPS (Mistral-3, < 0,1 s) + DiT 8 B + VAE MLX (~41 s/image)
**Point de retour stable** : tag Git `MVP-V1`

---

## Prérequis

- macOS avec Apple Silicon (M1/M2/M3)
- Python 3.12 (Homebrew)
- [uv](https://github.com/astral-sh/uv)
- Keycloak (realm `harmonia`, client `omnistudio`)

## Installation

```bash
# 1. Créer l'environnement Python
uv venv .venv --python 3.12 --seed && source .venv/bin/activate

# 2. Installer les dépendances
uv pip install torch torchvision torchaudio
uv pip install "git+https://github.com/huggingface/diffusers"
uv pip install transformers accelerate sentencepiece protobuf pillow
uv pip install "mlx>=0.20.0" "mlx-lm>=0.20.0" fastapi "uvicorn[standard]" sse-starlette pydantic

# 3. Cloner la dépendance MLX (repo externe)
git clone --depth 1 https://github.com/treadon/mlx-ernie-image.git vendor/mlx-ernie-image
```

Les modèles (~20 Go) sont téléchargés automatiquement depuis HuggingFace au premier démarrage.

## Démarrage

```bash
./scripts/start.sh   # http://localhost:8300
./scripts/stop.sh
```

> Toujours utiliser `start.sh` (il exporte `HF_HUB_CACHE` vers `models/`).
> Ne pas lancer `uvicorn` directement.

## Variables d'environnement

| Variable | Défaut | Rôle |
|----------|--------|------|
| `ERNIE_PORT` | 8300 | Port d'écoute |
| `ERNIE_COMPILE` | 0 | `1` = mx.compile sur le DiT |
| `ERNIE_QUANTIZE` | - | 4 ou 8 bits (inutile sur M1 Ultra) |
| `ERNIE_RELOAD` | 0 | `1` = hot-reload uvicorn (dev) |
| `KEYCLOAK_URL` | http://localhost:8082 | Serveur Keycloak |
| `KEYCLOAK_REALM` | harmonia | Realm Keycloak |
| `KEYCLOAK_CLIENT_ID` | omnistudio | Client Keycloak |

## API

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | 200 si pipeline prêt, 503 sinon |
| GET | `/api/status` | `{loaded, loading_elapsed_s, generating}` |
| GET | `/api/presets` | 7 formats avec dimensions |
| POST | `/api/generate` | SSE : `started` → `progress` → `done\|error` |
| GET | `/api/outputs` | Liste JSON des PNG (anti-chronologique) |
| GET | `/api/outputs/{filename}` | Sert le PNG |

## Presets disponibles

| Preset | Dimensions |
|--------|-----------|
| `square` | 1024×1024 |
| `landscape` | 1264×848 |
| `portrait` | 848×1264 |
| `landscape-soft` | 1200×896 |
| `portrait-soft` | 896×1200 |
| `cinema` | 1376×768 |
| `vertical` | 768×1376 |

## Tests

```bash
source .venv/bin/activate
pytest tests/
```

## Documentation

- `docs/API-REFERENCE-TECHNIQUE.md` - référence API détaillée
- `docs/SPECS-MODELES.md` - modèles, formats et contraintes
- `docs/ernie-image-explique.md` - modèle ERNIE et benchmarks
- `docs/serveur-headless-ernie.md` - architecture serveur headless
- `docs/integrer-negative-prompt-mlx.md` - note sur le negative prompt avec MLX
- `docs/prompts-melodrame-pop-espagnol.md` - prompts de test
- `docs/EXPLORATION-REPO-SANDJAB.md` - exploration du repo Sandjab
- `docs/PIÈGES-TECHNIQUES.md` - pièges techniques connus

## PRD

Les PRD sont dans `prd/`.

- `PRD-112` et `PRD-113` sont implémentés.
- `PRD-114` V1 compacte est implémenté côté frontend : ancrage visuel anglais visible, 8 presets maximum, aucun changement backend MLX.
- `PRD-115` reste un brouillon de cadrage pour le batch de prompts.

## Licence

Usage privé.
