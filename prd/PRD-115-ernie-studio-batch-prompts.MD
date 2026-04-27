# PRD-115 : Ernie Studio - batch de prompts séquentiels

**Statut** : Brouillon de cadrage
**Date** : 2026-04-27
**Auteur** : Alex
**Source** : besoin d'exécuter plusieurs prompts les uns à la suite des autres dans Ernie Studio

## État d'implémentation au 2026-04-27

- [x] Besoin cadré : lancer plusieurs prompts les uns à la suite des autres.
- [x] Choix de principe : génération strictement séquentielle, pas de parallélisme GPU.
- [x] Choix UX : copier-coller d'une liste comme chemin principal, CSV optionnel.
- [x] Contraintes connues : un seul batch actif, arrêt après l'image en cours, pas de reprise automatique.
- [x] Endpoints, manifeste JSON, sidecars batch et suivi SSE décrits dans le PRD.
- [ ] Non implémenté : accordéon UI "Batch de prompts".
- [ ] Non implémenté : parsing de liste collée avec séparateur `---`.
- [ ] Non implémenté : import CSV.
- [ ] Non implémenté : routes `/api/batches`.
- [ ] Non implémenté : worker batch backend.
- [ ] Non implémenté : manifestes `outputs/batches/{batch_id}.json`.
- [ ] Non implémenté : métadonnées batch dans les sidecars image.
- [ ] Non implémenté : table de suivi et annulation après l'image en cours.
- [ ] Non implémenté : badges batch dans l'historique et la lightbox.
- [ ] Non implémenté : tests backend batch.

Conclusion : PRD non démarré. PRD-114 est maintenant tranché et livré en V1 compacte ; ce PRD reste à garder en brouillon tant que le besoin batch n'est pas prioritaire.

## Vision

Le quoi : ajouter un mode batch à Ernie Studio pour lancer une liste de prompts en génération séquentielle, avec suivi de progression, annulation contrôlée et rattachement des images produites à un même lot.

Le pourquoi : Ernie Studio est utile pour l'exploration créative, mais lancer 10 prompts demande aujourd'hui 10 actions manuelles, avec attente entre chaque génération. Le batch doit automatiser cette répétition sans changer la contrainte technique principale : une seule génération GPU à la fois.

## Exemple bout-en-bout

1. Alex ouvre Ernie Studio et déplie le panneau "Batch de prompts".
2. Il colle 6 prompts séparés par une ligne `---`.
3. Il choisit le format `square`, 8 étapes, et la stratégie seed "seed aléatoire par prompt".
4. L'interface affiche un aperçu : 6 prompts, durée estimée, paramètres communs.
5. Il clique "Lancer le batch".
6. Le batch démarre le prompt 1, puis le prompt 2, puis les suivants, sans parallélisme.
7. Chaque image terminée apparaît dans la table de suivi et dans l'historique avec un badge de lot.
8. Alex peut ouvrir une image en lightbox, télécharger une image, ou arrêter le batch après l'image en cours.
9. Si l'onglet est rafraîchi, l'état du batch reste consultable via l'API.

## Contexte

Ernie Studio dispose déjà :

- d'un endpoint SSE `POST /api/generate` pour une génération unique ;
- d'un verrou de génération qui empêche les doubles générations ;
- d'un historique paginé avec sidecars JSON ;
- d'une authentification Keycloak ;
- d'un accordéon "Représentation visuelle" qui injecte un bloc `Visual anchor:` visible dans le prompt ;
- d'un pipeline MLX chaud mais fragile en mémoire si plusieurs traitements concurrents sont lancés.

Le mode batch doit donc composer avec l'existant au lieu de créer un deuxième chemin de génération divergent.

Contraintes importantes :

- le GPU ne doit jamais recevoir deux générations en parallèle ;
- le navigateur ne doit pas être responsable de l'orchestration longue ;
- l'annulation ne peut pas interrompre proprement une génération MLX déjà lancée ;
- les sorties batch doivent rester compatibles avec l'historique actuel ;
- le batch ne doit pas prétendre appliquer un vrai `negative_prompt` tant que le backend reste MLX ;
- si un prompt contient déjà un bloc `Visual anchor:`, le batch doit le traiter comme partie intégrante du prompt final, sans essayer de le régénérer ni de l'interpréter côté backend.

## Problème

Le flux actuel force une boucle manuelle :

- copier un prompt ;
- cliquer "Générer une image" ;
- attendre la fin ;
- recommencer pour le prompt suivant ;
- retrouver ensuite quelles images correspondent à quel ensemble de prompts.

Cette friction rend pénibles :

- les séries de prompts préparés dans un fichier Markdown ;
- les tests de variations stylistiques ;
- les comparaisons à seed fixe ;
- les prompts longs avec un bloc commun à répéter ;
- les explorations pendant lesquelles l'utilisateur veut laisser tourner Ernie sans rester devant l'écran.

## Solution

Ajouter un mode batch séquentiel, appuyé par une file backend simple, sans Celery ni Redis.

### 1. Panneau UI "Batch de prompts"

Ajouter un accordéon DSFR fermé par défaut sous les aides de prompting existantes, sans ouvrir de panneau par défaut.

Champs :

- nom du batch, optionnel ;
- textarea "Prompts du batch" ;
- aide de séparation : une ligne `---` sépare deux prompts ;
- bouton secondaire "Importer un CSV", optionnel ;
- bloc commun optionnel ajouté à chaque prompt ;
- compatibilité explicite avec les blocs `Visual anchor:` déjà présents dans les prompts collés ;
- stratégie seed ;
- bouton visible "Prévisualiser le batch" ;
- bouton visible "Lancer le batch".

Le formulaire principal reste le chemin par défaut pour une génération unique. Dans le batch, le copier-coller d'une liste reste le chemin principal. L'import CSV est un accélérateur pour les listes préparées dans Numbers, Excel ou un tableur.

### 2. Parsing simple et prévisible

Règles v1 :

- un prompt est un bloc de texte non vide ;
- deux prompts sont séparés par une ligne contenant uniquement `---` ;
- les lignes vides autour d'un bloc sont ignorées ;
- le bloc commun est ajouté à la fin de chaque prompt, séparé par deux retours ligne ;
- limite : 20 prompts par batch ;
- chaque prompt final doit respecter la limite backend actuelle de 8000 caractères ;
- un bloc `Visual anchor:` est conservé tel quel dans chaque prompt ; si un bloc commun en contient un autre, la prévisualisation doit signaler le risque de doublon au lieu de remplacer silencieusement le texte.

Format accepté :

```text
[Type] ... [Sujet] ... [Composition] ...
---
[Type] ... [Sujet] ... [Composition] ...
---
[Type] ... [Sujet] ... [Composition] ...
```

Hors périmètre v1 : parser automatiquement des titres Markdown numérotés. Cela pourra venir plus tard si les fichiers de prompts deviennent le format principal.

### 3. Import CSV optionnel

Ajouter un bouton "Importer un CSV" dans le panneau batch. L'import ne démarre jamais une génération directement : il alimente la prévisualisation, puis l'utilisateur valide avec "Lancer le batch".

Format CSV v1 :

```csv
title,prompt,seed
Poster - La cuisine rouge,"Cinematic poster - ...",123456
Photo éditoriale - Salon fuchsia,"Editorial photo - ...",
```

Colonnes :

- `prompt` : obligatoire ;
- `title` : optionnel, utilisé comme libellé d'item ;
- `seed` : optionnel, utilisé uniquement si la stratégie seed choisie le permet ;
- `negative_prompt` : accepté mais non envoyé au backend MLX, conservé comme note ou ignoré avec un avertissement explicite ;
- toute autre colonne est ignorée en v1, avec avertissement dans la prévisualisation.

Règles :

- fichier `.csv` uniquement ;
- encodage UTF-8 recommandé ;
- séparateur virgule en v1 ;
- limite : 20 lignes exploitables ;
- les lignes sans prompt sont rejetées ;
- les prompts importés sont copiés dans la zone de prévisualisation, pas stockés comme fichier brut ;
- le nom du fichier peut préremplir le nom du batch.

Implémentation recommandée : endpoint backend `POST /api/batches/import-csv` en `multipart/form-data`, protégé par Keycloak, utilisant le module standard Python `csv`. Il retourne une prévisualisation normalisée `{items, warnings}` sans créer de batch. Ce choix évite un parser CSV maison fragile dans le navigateur et gère correctement les virgules et guillemets dans les prompts.

### 4. Stratégies seed

Proposer trois modes explicites :

- "Aléatoire par prompt" : chaque item reçoit une seed résolue côté backend ;
- "Même seed pour tous" : utile pour comparer uniquement l'effet du prompt ;
- "Seed incrémentale" : seed de base + index du prompt, utile pour obtenir une série reproductible mais variée.

La seed résolue doit être enregistrée pour chaque item dans son sidecar.

### 5. File backend séquentielle

Créer un worker batch dans le process FastAPI, avec une seule exécution active.

Comportement :

- un batch démarre uniquement si aucune génération unique ni batch n'est actif ;
- les items internes du batch sont exécutés l'un après l'autre ;
- le verrou existant reste la protection finale ;
- si un item échoue, le batch continue par défaut sur l'item suivant ;
- l'utilisateur peut demander l'arrêt du batch ;
- l'arrêt prend effet après l'image en cours.

La v1 ne crée pas une file globale multi-batch. Un seul batch actif suffit pour l'usage solo.

### 6. Suivi et persistance

Chaque batch reçoit un `batch_id` et un manifeste JSON.

Emplacement proposé :

```text
outputs/batches/{batch_id}.json
```

Manifest minimal :

```json
{
  "batch_id": "20260427T103000_batch_a1b2",
  "name": "melodrame pop espagnol",
  "status": "running",
  "created_at": "2026-04-27T10:30:00+02:00",
  "started_at": "2026-04-27T10:30:03+02:00",
  "finished_at": null,
  "settings": {
    "preset": "square",
    "steps": 8,
    "seed_strategy": "random_per_prompt"
  },
  "items": [
    {
      "index": 1,
      "status": "done",
      "prompt": "...",
      "seed": 123456,
      "filename": "20260427T103100_1024x1024_seed123456.png",
      "error": null
    }
  ]
}
```

Les sidecars image existants sont enrichis avec :

- `batch_id` ;
- `batch_name` ;
- `batch_index` ;
- `batch_total` ;
- `batch_status_source`.

Au redémarrage serveur, tout batch resté `running` est marqué `interrupted`. La v1 ne reprend pas automatiquement un batch interrompu pour éviter de relancer le GPU par surprise.

### 7. API

Endpoints proposés :

| Méthode | Route | Rôle |
|---------|-------|------|
| `POST` | `/api/batches/import-csv` | Analyse un CSV et retourne une prévisualisation |
| `POST` | `/api/batches` | Crée et démarre un batch |
| `GET` | `/api/batches` | Liste les derniers batches |
| `GET` | `/api/batches/{batch_id}` | Retourne le manifeste du batch |
| `GET` | `/api/batches/{batch_id}/events` | SSE de suivi du batch |
| `POST` | `/api/batches/{batch_id}/cancel` | Demande l'arrêt après l'image en cours |

Tous les endpoints sont protégés par la même authentification que `/api/generate`.

Events SSE proposés :

- `batch_started` ;
- `item_started` ;
- `item_progress` ;
- `item_done` ;
- `item_error` ;
- `batch_cancel_requested` ;
- `batch_done` ;
- `batch_interrupted`.

### 8. UI de suivi

Ajouter un panneau "Batch en cours" visible seulement quand un batch existe.

Contenu :

- statut global ;
- progression texte : `3 sur 10 prompts terminés` ;
- estimation restante ;
- table des items avec statut, seed, miniature quand disponible ;
- bouton "Arrêter après l'image en cours" ;
- lien vers l'historique filtré par batch, si le filtre est livré dans la même itération.

Les statuts ne doivent pas dépendre uniquement de la couleur.

### 9. Historique

Améliorer les cartes d'historique pour afficher, quand disponible :

- badge `Batch` ;
- nom du batch ;
- position `3/10`.

Option v1 acceptable : pas de filtre dédié, mais les métadonnées sont visibles dans la lightbox.

Option v1.1 : ajouter un filtre "Afficher ce batch" depuis la lightbox ou le panneau batch.

## Options évaluées

### Option A : orchestration frontend par boucle JS

Le navigateur appelle `/api/generate` pour le prompt 1, attend la fin, puis appelle le prompt 2.

Avantages :

- implémentation très rapide ;
- aucun nouveau worker backend ;
- réutilise directement le SSE existant.

Inconvénients :

- le batch s'arrête si l'onglet est fermé ou rafraîchi ;
- l'état est difficile à récupérer ;
- les erreurs réseau deviennent ambiguës ;
- l'utilisateur ne peut pas consulter proprement un batch en cours depuis un autre onglet.

### Option B retenue : batch backend en mémoire, manifestes JSON persistés

FastAPI possède un worker batch léger et écrit l'état dans `outputs/batches/`.

Avantages :

- robuste au rafraîchissement navigateur ;
- cohérent avec les sidecars JSON existants ;
- pas besoin de dépendance externe ;
- permet un suivi fiable et une annulation contrôlée ;
- prépare les badges d'historique.

Inconvénients :

- demande un petit refactor backend ;
- ne survit pas à un kill brutal pour reprendre automatiquement ;
- un seul batch actif en v1.

### Option C : script CLI batch hors UI

Un script local lit un fichier Markdown et appelle l'API en boucle.

Avantages :

- très simple ;
- utile pour gros lots préparés hors navigateur.

Inconvénients :

- pas DSFR ;
- pas de suivi intégré ;
- moins accessible ;
- ne répond pas au besoin d'usage dans Ernie Studio.

## Décision

Option B. Le mode batch doit être un vrai workflow produit, pas une boucle fragile dans le front.

La v1 reste volontairement simple :

- un seul batch actif ;
- génération strictement séquentielle ;
- manifestes JSON ;
- copier-coller de liste comme usage principal ;
- import CSV optionnel, validé avant lancement ;
- pas de reprise automatique ;
- pas de téléchargement ZIP ;
- pas de parser Markdown avancé.

## Plan d'implémentation

1. Extraire de `routers/generate.py` une fonction interne partagée qui exécute une génération et écrit le sidecar, sans dépendre directement du SSE de génération unique.
2. Créer `routers/batches.py` avec les endpoints `POST /api/batches/import-csv`, `POST /api/batches`, `GET /api/batches`, `GET /api/batches/{batch_id}`, `GET /api/batches/{batch_id}/events` et `POST /api/batches/{batch_id}/cancel`.
3. Créer `batch_store.py` pour lire et écrire les manifestes JSON dans `outputs/batches/`.
4. Créer `batch_import.py` pour normaliser les prompts collés et analyser les CSV avec le module standard `csv`.
5. Créer `batch_worker.py` pour gérer l'état en mémoire, la tâche active, le drapeau d'annulation et la diffusion des events SSE.
6. Réutiliser le verrou de génération existant, ou centraliser l'état dans un module partagé si nécessaire.
7. Enrichir les sidecars image avec les métadonnées batch.
8. Mettre à jour `routers/outputs.py` pour exposer les métadonnées batch dans l'historique.
9. Ajouter `frontend/js/batch.js` pour parser la textarea, prévisualiser les items, importer un CSV, créer le batch et écouter le SSE batch.
10. Ajouter l'accordéon "Batch de prompts" dans `frontend/index.html`.
11. Ajouter le panneau "Batch en cours" et les statuts accessibles.
12. Ajouter les badges batch dans `gallery.js` et la lightbox.
13. Ajouter des tests backend :
    - parsing rejetant les prompts vides ;
    - import CSV avec virgules et guillemets dans un prompt ;
    - import CSV rejetant un fichier sans colonne `prompt` ;
    - import CSV exposant un avertissement si une colonne `negative_prompt` est présente en backend MLX ;
    - création d'un batch ;
    - exécution séquentielle de 3 items avec pipeline mocké ;
    - erreur sur un item puis continuation ;
    - cancel demandé pendant un item, arrêt avant l'item suivant ;
    - redémarrage simulé marquant un batch `running` en `interrupted`.
14. Ajouter des tests statiques frontend :
    - module `batch.js` importé une seule fois ;
    - boutons avec intitulé visible ;
    - input fichier CSV avec label explicite ;
    - absence de `innerHTML` alimenté par prompts ;
    - libellés de statuts non uniquement colorés.

## Critères d'acceptation

- Un batch de 3 prompts produit 3 images, dans l'ordre, sans génération parallèle.
- Chaque image possède un sidecar avec `batch_id`, `batch_index`, `batch_total` et seed résolue.
- Un batch est consultable après rafraîchissement de l'onglet.
- Une erreur sur le prompt 2 n'empêche pas le prompt 3 de démarrer, sauf annulation explicite.
- Le bouton "Arrêter après l'image en cours" empêche le lancement de l'item suivant.
- Un batch resté `running` après redémarrage serveur est visible comme `interrupted`.
- Les images batch restent disponibles dans l'historique existant.
- Un CSV avec colonnes `title,prompt,seed` peut alimenter la prévisualisation sans lancer le batch.
- Un CSV invalide affiche une erreur claire sans modifier le batch courant.
- Tous les boutons ajoutés ont un intitulé visible.
- Aucune information de statut n'est portée uniquement par la couleur.
- L'utilisateur voit une estimation de durée avant lancement.

## Contraintes RGAA / DSFR

- Le panneau batch utilise un accordéon DSFR ou un pattern équivalent avec `aria-controls` et `aria-expanded`.
- Le tableau de suivi a des en-têtes explicites.
- Les statuts textuels sont lisibles par lecteur d'écran.
- Les messages SSE mis à jour côté front utilisent `aria-live="polite"` sauf erreur bloquante.
- Les boutons "Importer un CSV", "Prévisualiser le batch", "Lancer le batch" et "Arrêter après l'image en cours" ont un intitulé visible.
- Le champ fichier CSV a un label visible et une aide indiquant le format attendu.
- Les miniatures générées ne sont pas l'unique moyen d'identifier un item.

## Limites v1

- Pas de parallélisme.
- Pas de téléchargement ZIP du batch.
- Pas de reprise automatique après redémarrage.
- Pas de file globale multi-batch.
- Pas de planification différée.
- Pas de vrai `negative_prompt` avec le backend MLX.
- Pas de parser Markdown avancé.
- Pas d'import Excel `.xlsx` en v1.

## Questions ouvertes

- Faut-il limiter à 10 prompts au lieu de 20 pour réduire le risque mémoire ?
- Faut-il ajouter un bouton "Télécharger le batch" en ZIP dès la v1 ou laisser l'historique gérer le téléchargement image par image ?
- Faut-il permettre un format et un nombre d'étapes différents par prompt, ou garder des paramètres communs pour éviter une UI trop lourde ?
- Faut-il ajouter un mode "dry run" qui calcule uniquement les seeds et le temps estimé sans lancer la génération ?
- Faut-il intégrer directement les fichiers Markdown de prompts, ou conserver le copier-coller comme première version ?
- Faut-il accepter le séparateur point-virgule pour les CSV exportés depuis Excel en environnement français ?

## Métriques de succès

- Lancer 6 prompts demande une seule action après prévisualisation.
- Le batch de 6 prompts ne produit aucun `409` interne.
- Le taux d'erreur récupérable est visible item par item.
- Le temps total mesuré est proche de la somme des générations unitaires, sans surcharge importante.
- L'utilisateur peut quitter et revenir sur la page sans perdre le statut du batch.

## Changelog

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-04-27 | Alex + Codex | Création du PRD batch prompts séquentiels |
| 2026-04-27 | Alex + Codex | Ajout import CSV optionnel, le copier-coller restant le chemin principal |
| 2026-04-27 | Alex + Codex | Mise à jour après PRD-114 V1 : compatibilité attendue avec les blocs `Visual anchor:` existants |
