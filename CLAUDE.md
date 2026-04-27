# Ernie Studio - protocole agent

App web FastAPI + DSFR, génération d'images ERNIE-Image Turbo via MLX, M1 Ultra 64 Go.
Port 8300. Auth Keycloak active, realm `harmonia`, client `omnistudio` par défaut. Repo source : https://github.com/Sandjab/Ernie
Version stable de retour : tag Git `MVP-V1`.

---

## Contexte

- Pipeline hybride : text encoder PyTorch+MPS (Mistral-3, < 0,1s) + DiT 8B + VAE MLX (~41s/image)
- Modèles stockés dans `models/` (gitignored, ~20 Go). Premier démarrage = téléchargement HF unique.
- Front : écran login Keycloak, puis poll `/api/status` toutes les 2s, bandeau loading jusqu'à pipeline prêt.
- Les routes de génération et d'historique sont protégées par JWT Keycloak. Les PNG peuvent aussi être servis via `?token=...` pour les balises image.

## Décision backend image

- Garder MLX comme backend par défaut pour les prochaines étapes.
- PRD-111 à PRD-114 sont implémentés dans le périmètre actuel.
- PRD-115 batch prompts est un brouillon non démarré.
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
- Un ancrage générique est ajouté si aucun preset ni champ libre n'est renseigné.
- La détection de prompt vague reste locale, non bloquante et sans appel IA.
- Aucun appel IA externe, aucune traduction chinoise, aucune migration Diffusers.
- Tester léger : statique frontend et vérification manuelle à seed fixe. Pas de surengineering.

## Chaînage prompts ERNIE

Quand Alex demande un prompt image pour Ernie Studio, appliquer le chaînage local avant de répondre :

1. Lire `/Users/alex/Claude/.claude/skills/prompt-image/SKILL.md` et structurer l'idée comme `/prompt-image --gen ernie`.
2. Lire `/Users/alex/Claude/.claude/skills/ernie-image/SKILL.md` puis, si nécessaire, `/Users/alex/Claude/.claude/skills/ernie-image/REFERENCE.md` pour adapter le prompt à ERNIE Studio / MLX.
3. Utiliser `/Users/alex/Claude/.claude/skills/ernie-studio-presets/SKILL.md` seulement si la demande porte sur un preset UI, un audit de preset ou une synchronisation front.

Sortie attendue par défaut :

- réponse en français ;
- prompt final en anglais ;
- blocs `[Type]`, `[Sujet]`, `[Composition]`, `[Lumière]`, `[Texture]`, `[Texte]` ;
- ligne `Visual anchor:` avec des contraintes positives et visibles ;
- pas de `negative_prompt`, `guidance_scale` ni `use_pe` pour le backend MLX ;
- si aucun texte n'est demandé dans l'image, `[Texte] typography is outside the requested composition.`

## Comment je travaille

### Setup (une seule fois)
```bash
uv venv .venv --python 3.12 --seed && source .venv/bin/activate
uv pip install torch torchvision torchaudio
uv pip install "git+https://github.com/huggingface/diffusers"   # branche main obligatoire
uv pip install transformers accelerate sentencepiece protobuf pillow
uv pip install "mlx>=0.20.0" "mlx-lm>=0.20.0" fastapi "uvicorn[standard]" sse-starlette pydantic httpx "python-jose[cryptography]"
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
| POST | `/api/auth/login` | login Keycloak password grant |
| POST | `/api/auth/token/refresh` | refresh token |
| POST | `/api/auth/logout` | logout best effort |
| GET | `/api/health` | 200 si pipeline prêt, 503 sinon |
| GET | `/api/status` | `{loaded, loading_elapsed_s, generating}` |
| GET | `/api/presets` | 7 formats avec dimensions |
| POST | `/api/generate` | SSE : `started` → `progress` → `done`\|`error` |
| GET | `/api/outputs` | liste JSON des PNG, pagination optionnelle `page`/`page_size` |
| GET | `/api/outputs/{filename}` | sert le PNG, Bearer ou `?token=...` |
| DELETE | `/api/outputs/{filename}` | supprime le PNG et le sidecar JSON |

Routes protégées par auth : `/api/generate`, `/api/outputs`, `/api/outputs/{filename}` en `GET`/`DELETE`.
Routes non protégées : auth, `/api/health`, `/api/status`, `/api/presets`.

### Historique

- Par défaut, `GET /api/outputs` retourne l'ancien tableau complet pour compatibilité.
- Le front utilise `GET /api/outputs?page=1&page_size=18`.
- En desktop, la galerie affiche 18 images par page, soit 6 colonnes sur 3 lignes.
- Les sidecars JSON sont tolérants : anciennes images sans sidecar restent listées, avec fallback seed depuis le nom de fichier.

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
| `KEYCLOAK_CLIENT_ID` | omnistudio | Client Keycloak réutilisé |

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
- **401 dans le front** : vérifier Keycloak (`KEYCLOAK_URL`, realm `harmonia`, client `omnistudio`) et les tokens stockés dans `localStorage`.

## Références

- `docs/ernie-image-explique.md` - modèle ERNIE, scripts JP Gavini, benchmarks détaillés
- `docs/serveur-headless-ernie.md` - décision architecture, alternatives écartées
- `docs/API-REFERENCE-TECHNIQUE.md` - référence API détaillée
- `docs/SPECS-MODELES.md` - modèles, formats et contraintes
- `docs/integrer-negative-prompt-mlx.md` - note sur le negative prompt avec MLX
- `docs/chainage-prompts-ernie-studio.md` - chaînage local `prompt-image` puis `ernie-image`
- `docs/prompts-melodrame-pop-espagnol.md` - prompts de test
- `docs/EXPLORATION-REPO-SANDJAB.md` - exploration du repo Sandjab
- `docs/PIÈGES-TECHNIQUES.md` - pièges techniques connus
- `prd/PRD-111-ernie-studio-fastapi-dsfr.MD` - décisions de conception initiales
- `prd/PRD-112-ernie-api-enrichissement-contrat.MD` - contrat API enrichi, implémenté
- `prd/PRD-113-ernie-studio-ux-prompting.MD` - UX prompting guidé, implémenté
- `prd/PRD-114-ernie-studio-controle-representation-portraits.MD` - V1 compacte implémentée
- `prd/PRD-115-ernie-studio-batch-prompts.MD` - brouillon batch prompts
