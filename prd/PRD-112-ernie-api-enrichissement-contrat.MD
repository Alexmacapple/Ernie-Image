# PRD-112 : Enrichissement du contrat API Ernie Studio

**Statut** : Implémenté
**Date** : 2026-04-27
**Auteur** : Alex
**Source** : Analyse comparative spec veille vs implémentation actuelle (session 2026-04-27)

---

## État d'implémentation au 2026-04-27

- [x] `config.py` expose `MODEL_NAME` et `MODEL_ID`.
- [x] `GenerateRequest.prompt` accepte 8000 caractères.
- [x] `client_request_id` est accepté par `/api/generate`.
- [x] La seed est résolue avant l'événement `started`.
- [x] `started` expose `seed`, dimensions, étapes, estimation et `client_request_id` si fourni.
- [x] `progress` expose `estimated_step`, `total_steps` et `eta_seconds`.
- [x] `done` expose `outputs[]` tout en conservant `filename` pour compatibilité.
- [x] Sidecar enrichi avec `model`, `created_at`, `duration_seconds` et `client_request_id`.
- [x] Frontend migré vers `done.outputs[0]` avec fallback `filename`.
- [x] Recovery SSE après coupure : `client_request_id` prioritaire, fallback seed plus prompt avec fenêtre temporelle.
- [x] Polling recovery limité au cas d'erreur SSE, avec `page_size=100`.
- [x] Tests API/SSE et contrats frontend mis à jour.
- [ ] Non fait volontairement : vrai `negative_prompt`, `guidance_scale` et `use_pe`, car le backend MLX actuel ne les supporte pas.

## Vision

Le quoi : aligner le contrat API Ernie Studio sur les 6 points identifiés lors de la comparaison
spec/code - sans toucher au pipeline MLX vendor qui ne supporte pas guidance_scale, negative_prompt
ni use_pe.

Le pourquoi : l'implémentation actuelle livre les informations minimales (filename, percent, elapsed).
Un contrat enrichi permet la reproductibilité (seed dans started), le débogage (estimated_step/eta dans
progress), la lisibilité côté client (outputs[] structuré dans done) et la traçabilité complète
(sidecar ISO + model + client_request_id). Chaque point est indépendant du vendor MLX.

## Exemple bout-en-bout (projeté)

1. Le client envoie `POST /api/generate` avec `{"prompt": "...", "ratio": "cinema", "steps": 8, "client_request_id": "ui-42"}`.
2. Événement `started` : `{"type": "started", "seed": 184736251, "steps": 8, "width": 1376, "height": 768, "estimated_s": 44, "client_request_id": "ui-42"}`.
3. Événements `progress` : `{"type": "progress", "estimated_step": 3, "total_steps": 8, "percent": 37, "elapsed_s": 16.2, "eta_seconds": 27.8}`.
4. Événement `done` : `{"type": "done", "filename": "...", "outputs": [{"filename": "...", "url": "/api/outputs/...", "seed": 184736251, "width": 1376, "height": 768}], "elapsed_s": 43.9, "prompt": "..."}`.
5. Sidecar JSON sur disque : `{"prompt": "...", "seed": 184736251, "model": "ernie-image-turbo", "created_at": "2026-04-27T14:32:11+02:00", "duration_seconds": 43.9, "client_request_id": "ui-42", ...}`.

---

## Contexte

Ernie Studio (PRD-111) expose `POST /api/generate` en SSE. La veille technique du 2026-04-27 a
produit une spec API plus riche. Comparaison avec le code existant (`routers/generate.py`,
`routers/outputs.py`) : 6 écarts identifiés, tous réalisables sans modifier le pipeline MLX vendor
(`ErnieImagePipeline.generate()` accepte uniquement `text_embeddings`, `height`, `width`,
`num_inference_steps`, `seed`).

---

## Problème

Le contrat SSE actuel est fonctionnel mais incomplet pour un usage d'itération de prompts :

- `started` ne renvoie pas la `seed` résolue → l'utilisateur ne sait pas quelle seed a été utilisée avant la fin
- `progress` renvoie `percent` + `elapsed_s` mais pas `estimated_step/total_steps/eta` → l'UI ne peut pas afficher une progression estimée à la granularité du step
- `done` renvoie seulement `filename` à plat → difficile à étendre si on ajoute plusieurs images plus tard
- Sidecar JSON : pas de `model`, pas de `created_at` ISO 8601, pas de `duration_seconds`, pas de `client_request_id`
- `prompt` limité à 2000 caractères → contrainte arbitraire, les prompts structurés ERNIE recommandés dépassent facilement 500 mots
- `client_request_id` absent → impossible de corréler un événement SSE avec une requête côté client

---

## Solution

Six modifications ciblées sur `routers/generate.py` et le sidecar, sans impact sur le pipeline MLX :

1. **`seed` dans `started`** : résoudre `seed_resolved` dans le router avant le lancement de la tâche, puis ajouter `"seed": seed_resolved` dans le payload `started`.
2. **`estimated_step`/`total_steps`/`eta_seconds` dans `progress`** : le polling toutes les 2s permet uniquement d'estimer le step courant via `elapsed / _SECS_PER_STEP`, car le pipeline MLX vendor ne fournit pas de callback par step. Ajouter `estimated_step`, `total_steps`, `eta_seconds` au côté de `percent` et `elapsed_s`.
3. **`outputs[]` dans `done`** : ajouter un tableau `outputs` avec un objet `{filename, url, seed, width, height}` tout en conservant temporairement `filename` à plat pour compatibilité.
4. **Sidecar enrichi** : ajouter `model` depuis une constante `config.MODEL_NAME`, `created_at` ISO 8601 avec timezone, `duration_seconds` (alias de `elapsed_s`), `client_request_id` si présent.
5. **`prompt` maxLength 2000 → 8000** : modifier le `Field` Pydantic dans `GenerateRequest`.
6. **`client_request_id`** : ajouter champ optionnel `str | None` dans `GenerateRequest`, propagé dans `started`, `done` et le sidecar.

---

## Options évaluées

### Option A (retenue) : 6 modifications ciblées, sans versioning d'API, avec compatibilité douce

Appliquer les 6 points directement sur le contrat existant. Pas de `/api/v2/`. Le front Ernie Studio
est le seul client principal, mais `done.filename` reste présent pendant une période de transition
afin d'éviter une casse inutile pour les scripts locaux éventuels.

**Avantages** :
- Périmètre minimal, aucun refactoring structurel
- Chaque point est indépendant, rollback granulaire
- Le front DSFR est co-localisé, la migration est immédiate
- Compatibilité conservée pour `done.filename`

**Inconvénients** :
- Pas de versioning → pas de période de transition
- Deux représentations temporaires du fichier généré dans `done` (`filename` et `outputs[0].filename`)

### Option B : Versioning `/api/v2/generate` + garde le v1 intact

Créer une route `/api/v2/generate` avec le nouveau contrat, garder `/api/generate` inchangé.

**Avantages** :
- Zéro breaking change pour les clients existants
- Comparaison v1/v2 possible en parallèle

**Inconvénients** :
- Ernie Studio est un service local mono-client - le versioning ajoute de la complexité sans valeur
- Double surface de code à maintenir
- Les tests doivent couvrir les deux routes

---

## Décision

Option A amendée. Ernie Studio est un service local avec un client principal (le front DSFR
co-localisé). Le versioning est une sur-ingénierie. La migration `done.filename` →
`done.outputs[]` sera appliquée au front dans le même commit, mais `done.filename` reste émis
pour compatibilité.

---

## Plan d'implémentation

1. `config.py` - ajouter `MODEL_NAME = "ernie-image-turbo"` et, si utile pour diagnostic, `MODEL_ID = "treadon/ERNIE-Image-Turbo-MLX"`.
2. `routers/generate.py` - `GenerateRequest` : `prompt` maxLength 2000 → 8000, ajouter `client_request_id: str | None = Field(None, max_length=200)`.
3. `routers/generate.py` - résoudre la seed avant le lancement du task : `seed_resolved = req.seed if req.seed is not None else random.randint(0, 2**31 - 1)`, puis passer `seed=seed_resolved` à `pipeline_mlx.generate()`.
4. `routers/generate.py` - payload `started` : ajouter `seed`, `client_request_id`.
5. `routers/generate.py` - payload `progress` : ajouter `estimated_step`, `total_steps`, `eta_seconds`.
6. `routers/generate.py` - payload `done` : ajouter `outputs: [{filename, url, seed, width, height}]`, conserver `filename`, ajouter `client_request_id`.
7. `routers/generate.py` - `_write_sidecar` : ajouter `model`, `created_at` ISO, `duration_seconds`, `client_request_id`.
8. `frontend/js/generator.js` : lire prioritairement `done.outputs[0]`, avec fallback `done.filename` pendant la transition.
9. `tests/` : mettre à jour les assertions SSE sur les payloads `started`, `progress`, `done` et le sidecar JSON.

---

## Métriques de succès

- `started` contient `seed` (entier non nul) dans 100 % des générations
- `progress` contient `estimated_step`, `total_steps`, `eta_seconds` dans 100 % des événements progress
- `done` contient `outputs[0].filename` (chaîne non vide) et `filename` compatible dans 100 % des générations
- Sidecar JSON contient `model`, `created_at` (format ISO 8601), `duration_seconds` dans 100 % des outputs
- `client_request_id` présent dans `started`, `done` et sidecar quand fourni dans la requête
- La suite de tests `pytest tests/` passe en exit 0 après modification

---

## Points d'attention

- La valeur `estimated_step` est une estimation temporelle, pas un callback réel du pipeline MLX. Elle ne doit pas être présentée comme une mesure exacte.
- `done.filename` est conservé pour compatibilité, mais `outputs[]` devient la forme canonique pour le front.
- Les sidecars historiques restent lisibles : `/api/outputs` doit continuer à tolérer l'absence de `model`, `duration_seconds`, `client_request_id` et `created_at`.
- `client_request_id` est un identifiant de corrélation client, pas un identifiant de sécurité ni d'idempotence.

---

## Changelog

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-04-27 | Alex + Claude | Création du PRD |
| 2026-04-27 | Alex + Codex | Clarification seed résolue côté router, progression estimée, compatibilité `filename` + `outputs[]`, sidecar ISO et constante modèle |
