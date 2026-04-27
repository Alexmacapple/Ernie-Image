# PRD-111 : Ernie Studio - serveur FastAPI + front DSFR pour ERNIE-Image Turbo

**Statut** : Implémenté - stabilisation UX/RGAA en cours
**Date** : 2026-04-26
**Auteur** : Alex
**Source** : conversation - conception architecture ernie-studio

---

## État d'implémentation au 2026-04-27

- [x] Serveur FastAPI sur port 8300.
- [x] Pipeline MLX chargé une seule fois et conservé chaud.
- [x] Verrou de génération pour éviter deux générations concurrentes.
- [x] Routes `health`, `status`, `presets`, `generate`, `outputs`, suppression image.
- [x] Sidecars JSON pour tracer prompt, seed, dimensions, durée et métadonnées.
- [x] Front DSFR servi par FastAPI.
- [x] Formulaire de génération avec prompt, format, étapes et seed.
- [x] Progression SSE `started`, `progress`, `done`.
- [x] Historique paginé accessible, 18 images par page, soit 6 colonnes sur 3 lignes en desktop.
- [x] Lightbox commune pour historique et dernière génération.
- [x] Actions image : afficher, télécharger, supprimer, fixer la seed, copier le prompt.
- [x] Navigation dans la lightbox : image précédente, image suivante, raccourcis flèches, statut `aria-live`.
- [x] Footer DSFR avec les liens existants et modale de statut.
- [x] Authentification ajoutée comme l'environnement hébergé l'exige, même si le PRD initial prévoyait un usage local sans Keycloak.
- [x] Déploiement local via scripts `scripts/start.sh` et `scripts/stop.sh`.
- [x] Tests backend et contrats frontend : `63 passed`.
- [ ] À finir hors PRD-111 : durcir encore les tests navigateur si un vrai runner Playwright est ajouté plus tard. Pas prioritaire pour l'instant.

## Vision

**Le quoi** : transformer les scripts CLI one-shot d'ERNIE-Image Turbo (Sandjab/Ernie) en une application web locale complète - FastAPI qui garde le pipeline MLX chaud en mémoire, interface DSFR pour soumettre des générations et consulter l'historique.

**Le pourquoi** : le coût de rechargement du modèle (~20-30s) rend les scripts CLI inutilisables en usage interactif. Un serveur qui charge le pipeline une seule fois au démarrage réduit chaque génération à son temps de calcul pur (~41s sur M1 Ultra). L'interface DSFR élimine la friction de la CLI sans introduire la complexité d'un A1111/ComfyUI.

---

## Exemple bout-en-bout (projeté)

1. `./scripts/start.sh` - démarrage : pipeline MLX chargé en arrière-plan, `/api/health` reste à 503 jusqu'à disponibilité.
2. L'utilisateur ouvre `http://localhost:8300`, se connecte via Keycloak, puis accède à l'application DSFR.
3. Il saisit un prompt, sélectionne le preset `cinema` (1376×768), laisse steps à 8 et seed à random.
4. Il clique « Générer une image » - le front ouvre une connexion SSE authentifiée sur `POST /api/generate`.
5. Le backend envoie `started` avec seed résolue, dimensions et estimation, puis des events `progress` toutes les 2s.
6. À ~41s, l'image est sauvegardée dans `outputs/`, le sidecar JSON est écrit et le backend émet `done` avec `filename` et `outputs[0]`.
7. Le front affiche la dernière génération, rafraîchit l'historique paginé et conserve les actions afficher, télécharger, supprimer, fixer la seed et copier le prompt.
8. Une deuxième requête arrive 10s plus tard - pas de rechargement du modèle, génération démarre immédiatement si le verrou est libre.

---

## Contexte

Le repo source Sandjab/Ernie fournit deux scripts Python (`ernie_image_mac_poc.py` PyTorch+MPS et `ernie_image_mlx_poc.py` MLX). Chaque invocation recharge le pipeline depuis zéro (~20-30s), ce qui rend l'usage interactif pénible. Le runtime MLX sur M1 Ultra offre un gain de ~36% sur MPS (41.4s vs 65.1s, 8 steps 1024×1024 mesuré sur M3 Ultra par JP Gavini).

Les autres projets du workspace (`omni-num`, `voice-num`, `synthesia-harmonia`) suivent un pattern éprouvé : FastAPI + middleware de sécurité + front DSFR servi comme static files. Le projet `ernie/` est dans `projets-heberges/` (gitignored), ce qui est cohérent avec un service local.

---

## Problème

1. **Rechargement coûteux** : chaque invocation CLI recharge 16 Go de poids MLX + le text encoder PyTorch (~20-30s), ce qui rend impossible un usage interactif fluide.
2. **Pas d'interface** : la CLI requiert un terminal, pas de retour visuel pendant la génération (~41s), pas d'historique des images produites.
3. **Friction d'usage** : mémoriser les flags (`--ratio cinema --steps 4 --seed 42`) est une charge inutile pour une tâche créative.

---

## Solution

Application web locale mono-fichier (pas de microservices) :

- **`server.py`** : FastAPI avec lifespan qui charge le pipeline MLX au démarrage et le maintient dans un singleton. Middleware de sécurité (CSP, Cache, CORS), SSE pour la progression de génération.
- **`pipeline_mlx.py`** : extraction de `load_pipeline()` et `generate()` depuis `ernie_image_mlx_poc.py` du repo source, adaptées pour un usage serveur (singleton, thread-safe via `asyncio.Lock`).
- **`frontend/`** : page DSFR unique - formulaire de génération, barre de progression SSE, affichage du résultat, galerie historique avec lightbox, téléchargement et suppression.
- **Auth Keycloak** : exigence ajoutée par l'environnement hébergé. Le front expose un écran login, stocke access/refresh token et envoie `Authorization: Bearer ...` aux routes protégées.
- **Aucun LangGraph** : workflow linéaire (prompt → image), pas d'état multi-étapes.

---

## Options évaluées

### Option A (retenue) : application monolithique FastAPI + front intégré

Un seul processus FastAPI qui charge le pipeline, expose l'API et sert le front comme static files.

**Avantages** :
- Pipeline chaud dès le démarrage, partagé entre toutes les requêtes via singleton.
- Déploiement trivial via `./scripts/start.sh`, qui encapsule `uvicorn` et force le cache HuggingFace dans `models/`.
- Cohérent avec le pattern des autres projets hébergés (même structure que voice-num, omni-num).
- Pas de latence réseau inter-services.
- `asyncio.Lock` suffit pour sérialiser les générations (GPU non préemptif).

**Inconvénients** :
- Si l'on veut exposer le pipeline à d'autres apps locales, il faudra extraire le service pipeline plus tard.
- Génération bloquante (~41s) : une seule génération à la fois (acceptable pour usage solo).

### Option B : microservices - pipeline service + frontend service

Deux processus séparés : `ernie-pipeline` (port 8301, MLX pur) et `ernie-studio` (port 8300, FastAPI + front), sur le modèle OmniVoice/OmniStudio.

**Avantages** :
- Pipeline réutilisable par d'autres clients (scripts, intégrations futures).
- Redémarrage du front sans perdre le pipeline chaud.

**Inconvénients** :
- Surcoût architectural injustifié pour un usage local solo.
- Latence HTTP inter-services (négligeable mais réelle).
- Deux processus à gérer, deux ports, un script `start.sh` plus complexe.
- OmniVoice est indépendant car il sert plusieurs projets ; le pipeline ERNIE ne sert que ce projet.

### Option C : API headless uniquement, pas de front

Conserver le concept initial (CLAUDE.md originel) : juste `POST /api/generate`, pas d'interface.

**Avantages** :
- Strictement minimal, 60 lignes de FastAPI.
- Consommable depuis n'importe quel client (curl, scripts, autres apps).

**Inconvénients** :
- Pas de retour visuel sur la progression (~41s sans feedback).
- Pas d'historique des images.
- Friction identique à la CLI pour l'usage créatif.
- L'utilisateur a explicitement demandé une interface DSFR.

---

## Décision

**Option A retenue** - application monolithique FastAPI + front DSFR intégré.

Justification : usage solo local, pipeline non partagé, cohérence avec le pattern workspace déjà éprouvé sur omni-num/voice-num. La séparation microservices peut être faite plus tard si le pipeline doit être exposé à d'autres projets.

---

## Plan d'implémentation

### Phase 1 - Squelette et pipeline

1. Créer `config.py` : port (8300), `outputs/` dir, `models/` dir, CORS origins, `ERNIE_COMPILE` (bool). Forcer `HF_HUB_CACHE` et `HF_HOME` vers `models/` via `os.environ.setdefault` **avant tout import HF** - les poids (~16 Go) restent dans le projet, pas dans `~/.cache/huggingface`.
2. Créer `pipeline_mlx.py` : extraire `load_pipeline()` et `generate()` de `ernie_image_mlx_poc.py`, ajouter un `asyncio.Lock` pour sérialiser les appels.
3. Créer `server.py` : lifespan (`load_pipeline` au startup, singleton `_pipeline`), middleware stack (Security, Cache, CORS, GZip), montage `StaticFiles` pour `frontend/`.
4. Vérifier : `./scripts/start.sh` démarre, `/api/health` retourne 503 pendant le chargement puis 200.

### Phase 2 - Routes API

5. `routers/status.py` : `GET /api/health` (200/503 selon état pipeline), `GET /api/status` (pipeline loaded, mem pressure, version).
6. `routers/presets.py` : `GET /api/presets` → liste des 7 `RATIO_PRESETS` avec dimensions.
7. `routers/generate.py` : `POST /api/generate` (SSE) - valide les params (Pydantic), acquiert le Lock, génère via `pipeline_mlx.generate()`, stream events `progress` + `done`/`error`, libère le Lock.
8. `routers/outputs.py` : `GET /api/outputs` (liste JSON complète ou pagination `page`/`page_size`, défaut 18), `GET /api/outputs/{filename}` (sert le fichier), `DELETE /api/outputs/{filename}` (supprime le PNG et son sidecar JSON).
9. Enregistrer tous les routers dans `routers/__init__.py` via `register_all(app)`.
10. Ajouter `routers/auth_routes.py` et `auth.py` pour login, refresh, logout et validation JWT Keycloak.
11. Tester les routes publiques, protégées et les erreurs auth avec client mocké.

### Phase 3 - Frontend DSFR

12. Créer `frontend/index.html` : structure DSFR 1.11.2 (header Marianne, skiplinks, main) avec écran login et écran application.
13. Vendorer DSFR localement dans `frontend/dsfr/` (copié depuis omni-num) - pas de CDN jsDelivr (bloqué hors réseau).
14. Créer `frontend/js/auth.js` et brancher login, refresh, logout, `localStorage`, `authenticatedUrl()`.
15. Créer `frontend/js/api-client.js` : `apiGet()`, `apiPost()`, `apiDelete()`, `fetchSSE()` avec Bearer token et refresh automatique.
16. Créer `frontend/js/generator.js` : formulaire (prompt, ratio, steps, seed), bouton Générer, barre de progression DSFR (SSE), affichage image résultat et récupération après coupure SSE.
17. Créer `frontend/js/gallery.js` : chargement paginé `GET /api/outputs?page=1&page_size=18`, grille de miniatures avec actions explicites afficher/télécharger/supprimer/fixer seed et lightbox détaillée.
18. Créer `frontend/js/app.js` : entry point, init DSFR, auth gate, branchement modules.
19. Créer `frontend/css/app.css` : styles custom (grille galerie, image compacte, alignement des contrôles Format/Étapes/Seed, footer statut).
20. Ajouter `<footer role="contentinfo" class="fr-footer fr-mt-4w status-footer">` : badge statut pipeline (fr-badge--info/success/warning/error), liens `/api/health` et `/api/status`, bouton « Statut complet ».
21. Ajouter `<dialog id="health-modal" class="fr-modal">` : modale DSFR avec liste de définition (pipeline chargé, temps de chargement, génération en cours, liens `/api/health` et `/api/status`).
22. Créer `frontend/js/status-footer.js` : `updateFooter(status)` met à jour le badge et le label ; écoute `dsfr.open` pour rafraîchir la modale à chaque ouverture.

### Phase 4 - Outillage et finalisation

23. Créer `scripts/start.sh` : active le venv, force `HF_HUB_CACHE` vers `models/`, lance uvicorn.
24. Créer `scripts/stop.sh` : tue le processus.
25. Mettre à jour `CLAUDE.md` du projet (architecture finale, commandes, routes).
26. Test end-to-end : démarrage → login → génération → affichage image → galerie → affichage/téléchargement/suppression depuis l'historique.

---

## Métriques de succès

- `GET /api/health` retourne 200 en moins de 35s après démarrage (pipeline chargé).
- `POST /api/generate` (8 steps, 1024×1024) complète en < 55s sur M1 Ultra (tolérance +14s vs M3 Ultra mesuré).
- La deuxième génération démarre dans les 2s suivant la fin de la première (pipeline non rechargé).
- Les routes publiques, protégées et auth répondent avec le bon status code sur des appels valides et invalides.
- Le front s'affiche sans erreur console sur Safari et Chrome.
- La barre de progression SSE avance visuellement pendant toute la durée de génération.
- Chaque image de l'historique peut être affichée en lightbox, téléchargée et supprimée sans rechargement manuel de la page.

---

## Changelog

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-04-26 | Alex + Claude | Création du PRD |
| 2026-04-26 | Alex + Claude | Stockage modèles local : `HF_HUB_CACHE` → `models/` dans le projet (pas `~/.cache/huggingface`) |
| 2026-04-26 | Alex + Claude | DSFR vendoré localement (`frontend/dsfr/`, copié depuis omni-num) - CDN jsDelivr exclu (bloqué hors réseau) |
| 2026-04-26 | Alex + Claude | Ajout footer DSFR statut : badge pipeline (4 états) + modale santé (`dialog#health-modal`) avec `status-footer.js` |
| 2026-04-26 | Alex + Claude | Confirmation : les routes API initiales sont exposées dans l'UI (formulaire, galerie, suppression, progress SSE, footer statut, modale health) |
| 2026-04-26 | Alex + Claude | UX : validation inline prompt (fr-input-group--error + aria-invalid), skeleton galerie, durée estimée sous le bouton, footer DSFR corrigé (fr-footer__bottom), intitulé bouton explicite « Générer une image » avec 4 états dynamiques |
| 2026-04-26 | Alex + Claude | Bugfix : verrou de génération robuste si client SSE se déconnecte (refresh/fermeture) - le calcul MLX non annulable termine en arrière-plan avant libération du verrou |
| 2026-04-26 | Alex + Claude | Ajout téléchargement image : bouton dans la lightbox galerie + amélioration UX téléchargement résultat |
| 2026-04-26 | Alex + Claude | Historique enrichi : actions afficher/télécharger/supprimer sur chaque image, `DELETE /api/outputs/{filename}`, footer DSFR aligné, contrôles Format/Étapes/Seed harmonisés |
| 2026-04-26 | Alex + Claude | Correction accessibilité historique : nom accessible des vignettes conforme au libellé visible, miniatures décoratives, téléchargement d'une carte rendu comme bouton d'action |
| 2026-04-26 | Alex + Claude | Cache-busting explicite des modules front pour évacuer l'ancien rendu d'historique contenant des liens icônes vides |
| 2026-04-26 | Alex + Claude | Correction formulaire : l'erreur de prompt vide disparaît dès saisie, bouton primaire DSFR conserve le libellé visible « Générer une image » |
| 2026-04-26 | Alex + Claude | Correction RGAA/validation HTML : boutons de lightbox contrastés via tokens DSFR, images cachées initialisées avec un `src` transparent non vide |
| 2026-04-26 | Alex + Claude | Ajout réutilisation seed : bouton « Coller le seed » dans l'historique et la lightbox, titres explicites sur les boutons icônes |
| 2026-04-27 | Alex + Claude | Correction réutilisation seed pour anciennes images sans sidecar : extraction fallback depuis le nom de fichier et fermeture de la lightbox après collage |
| 2026-04-27 | Alex + Claude | Ajout test d'intégration SSE réel `started → progress → done` avec génération mockée et vérification du sidecar |
| 2026-04-27 | Alex + Claude | Dernière génération rendue compacte et bouton de soumission converti en bouton texte DSFR sans icône |
| 2026-04-27 | Alex + Claude | Historique paginé : API `page`/`page_size`, composant pagination DSFR accessible, 18 images par page en grille 6×3, libellés contextualisés sur actions icônes |
| 2026-04-27 | Alex + Claude | Dernière génération ouvrable dans la même lightbox que l'historique |
| 2026-04-27 | Alex + Codex | Mise à jour du PRD avec l'auth Keycloak effective, les routes auth, la pagination 18 images et le contrat SSE enrichi |
