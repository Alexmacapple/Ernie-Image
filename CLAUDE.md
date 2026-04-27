# Ernie Studio - protocole agent

App web FastAPI + DSFR, génération d'images ERNIE-Image Turbo via MLX, M1 Ultra 64 Go.
Port 8300. Auth Keycloak realm `harmonia`, client `omnistudio` par défaut. Repo source : https://github.com/Sandjab/Ernie
Version stable de retour : tag Git `MVP-V1`.

---

## Contexte

- Pipeline hybride : text encoder PyTorch+MPS (Mistral-3, < 0,1s) + DiT 8B + VAE MLX (~41s/image)
- Modèles stockés dans `models/` (gitignored, ~20 Go). Premier démarrage = téléchargement HF unique.
- Front : poll `/api/status` toutes les 2s, bandeau loading jusqu'à `/api/health` → 200.

## Décision backend image

- Garder MLX comme backend par défaut pour les prochaines étapes.
- PRD-112 (contrat API enrichi) et PRD-113 (UX prompting guidé) sont implémentés.
- PRD-114 V1 compacte est implémenté côté frontend, sans changer le moteur.
- Ne pas remplacer `pipeline_mlx.py` par Diffusers dans ce cycle.
- Diffusers est une piste valide mais à traiter comme spike séparé après retour : `ERNIE_BACKEND=mlx|diffusers`, benchmark temps/RAM/stabilité/qualité, puis décision.
- Ne pas démarrer le chantier Diffusers tant qu'Alex n'a pas explicitement validé le retour attendu.
- Le backend MLX actuel n'expose pas `use_pe`, `guidance_scale` ni vrai `negative_prompt`.
- Ne pas ajouter dans l'UI de contrôle qui laisse croire que `use_pe=false` ou `negative_prompt` sont appliqués en MLX.

## PRD-114 V1 compacte

PRD-114 : contrôle de représentation visuelle.

- Accordéon DSFR compact "Représentation visuelle" sous l'aide à la structure du prompt.
- V1 : 8 presets maximum, un champ libre, un bouton visible "Ajouter un ancrage visuel en anglais".
- L'ancrage doit être injecté dans le textarea comme bloc visible `Visual anchor: ...`.
- Si un bloc `Visual anchor:` existe déjà, le remplacer plutôt que l'empiler.
- Aucun appel IA externe, aucune traduction chinoise, aucune migration Diffusers.
- Tester léger : statique frontend et vérification manuelle à seed fixe. Pas de surengineering.

## Comment je travaille

### Setup (une seule fois)
```bash
uv venv .venv --python 3.12 --seed && source .venv/bin/activate
uv pip install torch torchvision torchaudio
uv pip install "git+https://github.com/huggingface/diffusers"   # branche main obligatoire
uv pip install transformers accelerate sentencepiece protobuf pillow
uv pip install "mlx>=0.20.0" "mlx-lm>=0.20.0" fastapi "uvicorn[standard]" sse-starlette pydantic
git clone --depth 1 https://github.com/treadon/mlx-ernie-image.git vendor/mlx-ernie-image
```

### Démarrer / arrêter
```bash
./scripts/start.sh   # → http://localhost:8300  (force HF_HUB_CACHE → models/)
./scripts/stop.sh
```

## Playbooks

### Routes API
| Méthode | Route | Rôle |
|---------|-------|------|
| GET | `/api/health` | 200 si pipeline prêt, 503 sinon |
| GET | `/api/status` | `{loaded, loading_elapsed_s, generating}` |
| GET | `/api/presets` | 7 formats avec dimensions |
| POST | `/api/generate` | SSE : `started` → `progress` → `done`\|`error` |
| GET | `/api/outputs` | liste JSON des PNG (anti-chronologique) |
| GET | `/api/outputs/{filename}` | sert le PNG |

### Presets (hors liste = qualité dégrade)
`square` 1024×1024 · `landscape` 1264×848 · `portrait` 848×1264 · `landscape-soft` 1200×896 · `portrait-soft` 896×1200 · `cinema` 1376×768 · `vertical` 768×1376

### Env vars
| Variable | Défaut | Rôle |
|----------|--------|------|
| `ERNIE_PORT` | 8300 | Port |
| `ERNIE_COMPILE` | 0 | `1` = mx.compile sur DiT |
| `ERNIE_QUANTIZE` | - | 4 ou 8 (inutile sur M1 Ultra) |
| `ERNIE_RELOAD` | 0 | `1` = reload uvicorn en dev |
| `KEYCLOAK_URL` | http://localhost:8082 | Serveur Keycloak |
| `KEYCLOAK_REALM` | harmonia | Realm Keycloak |
| `KEYCLOAK_CLIENT_ID` | omnistudio | Client Keycloak reutilise |

## À ne pas faire

- Ne pas modifier `vendor/mlx-ernie-image/` - repo git externe. Mise à jour : `cd vendor/mlx-ernie-image && git pull`.
- Ne pas utiliser `float16` sur MPS → overflow → image noire. `bfloat16` uniquement.
- Ne pas lancer deux générations en parallèle - `asyncio.Lock` sérialise, route retourne 409.
- Ne pas changer l'ordre d'import : `config.py` en premier pour forcer `HF_HUB_CACHE` avant tout import HF.
- Ne pas supprimer `frontend/dsfr/` - DSFR vendoré localement, pas de CDN.

## Modes d'échec connus

- **Modèles dans `~/.cache`** au lieu de `models/` : utiliser `./scripts/start.sh` (exporte `HF_HUB_CACHE`), pas `uvicorn` direct.
- **503 persistant** : lire `/tmp/ernie-studio.log`, chercher l'erreur après la ligne "chargement text encoder".
- **Front sans style DSFR** : vérifier que `frontend/dsfr/` existe (copier depuis `projets-heberges/omni-num/omnistudio/frontend/out/dsfr/`).

## Références

- `docs/ernie-image-explique.md` - modèle ERNIE, scripts JP Gavini, benchmarks détaillés
- `docs/serveur-headless-ernie.md` - décision architecture, alternatives écartées
- `docs/API-REFERENCE-TECHNIQUE.md` - référence API détaillée
- `docs/SPECS-MODELES.md` - modèles, formats et contraintes
- `docs/integrer-negative-prompt-mlx.md` - note sur le negative prompt avec MLX
- `docs/prompts-melodrame-pop-espagnol.md` - prompts de test
- `docs/EXPLORATION-REPO-SANDJAB.md` - exploration du repo Sandjab
- `docs/PIÈGES-TECHNIQUES.md` - pièges techniques connus
- `prd/PRD-111-ernie-studio-fastapi-dsfr.MD` - décisions de conception initiales
- `prd/PRD-112-ernie-api-enrichissement-contrat.MD` - contrat API enrichi, implémenté
- `prd/PRD-113-ernie-studio-ux-prompting.MD` - UX prompting guidé, implémenté
- `prd/PRD-114-ernie-studio-controle-representation-portraits.MD` - V1 compacte implémentée
- `prd/PRD-115-ernie-studio-batch-prompts.MD` - brouillon batch prompts
