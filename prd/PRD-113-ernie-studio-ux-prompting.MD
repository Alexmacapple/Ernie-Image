# PRD-113 : Ernie Studio - UX de prompting guidé

**Statut** : Implémenté avec périmètre ajusté
**Date** : 2026-04-27
**Auteur** : Alex
**Source** : Veille prompting ERNIE-Image (session 2026-04-27) - bonnes pratiques publiées sur HuggingFace, Scenario, Replicate, RunComfy

---

## État d'implémentation au 2026-04-27

- [x] Compteur de caractères sous le prompt, avec seuils `court`, `acceptable`, `structuré`.
- [x] Limite alignée sur le backend à 8000 caractères.
- [x] Compteur annoncé via `aria-live="polite"` et non dépendant seulement de la couleur.
- [x] Placeholder structuré : `[Type] ... [Sujet] ... [Composition] ... [Lumière] ... [Texture] ... [Texte] ...`.
- [x] Message d'erreur "Le prompt ne peut pas être vide" supprimé hors état d'erreur réel.
- [x] Prompt vidé après génération réussie et placeholder restauré.
- [x] Module `seed-workflow.js` introduit pour éviter le couplage circulaire.
- [x] Mode seed explicite : seed aléatoire, seed fixée, bouton "Libérer la seed".
- [x] Saisie manuelle d'une seed synchronisée avec le badge.
- [x] Action historique et lightbox pour fixer la seed.
- [x] Accordéon DSFR "Aide à la structure du prompt" au-dessus du prompt.
- [x] Fallback JS ajouté pour stabiliser l'accordéon DSFR et éviter l'artefact `max-height: 0`.
- [x] Contenu de l'accordéon corrigé avec typographie française et espace avant ` ...`.
- [x] Boutons visibles et contrats RGAA/DSFR renforcés.
- [x] Tests statiques frontend mis à jour.
- [x] Templates supprimés du front à la demande utilisateur. Cette partie du PRD est donc close comme décision produit, pas comme fonctionnalité livrée.
- [ ] Reste possible plus tard : réintroduire des templates si le besoin revient, mais pas dans l'UI actuelle.

## Vision

Le quoi : transformer le formulaire de génération en surface de prompting guidé, sans refonte de
page - aide à la structure, compteur de caractères et workflow seed explicite. Les templates
initialement envisagés ont été retirés du front à la demande utilisateur.

Le pourquoi : les bonnes pratiques ERNIE (prompt structuré long, seed fixe en phase de
raffinement, exploration multi-seeds avant engagement) sont documentées mais invisibles dans
l'UI actuelle. Un champ textarea vide force l'utilisateur à les mémoriser. Rendre le workflow
visible dans l'interface réduit la charge cognitive et produit de meilleures images dès la
première session.

## Exemple bout-en-bout (projeté)

1. Alex ouvre Ernie Studio après login Keycloak.
2. Il ouvre l'accordéon "Aide à la structure du prompt" pour relire les blocs recommandés.
3. Il saisit un prompt structuré dans le textarea.
4. Le compteur affiche l'état `court`, `acceptable` ou `structuré` jusqu'à 8000 caractères.
5. Il clique "Générer une image" avec seed aléatoire.
6. Il choisit la meilleure image via l'historique, colle sa seed, puis le champ passe en mode Raffinement.
7. Il modifie un seul élément du prompt et régénère avec la même seed.
8. Le compteur, le badge seed et le placeholder restent synchronisés après génération réussie.

---

## Contexte

Ernie Studio (PRD-111) dispose d'un formulaire minimaliste : textarea prompt, sélecteur ratio,
sélecteur d'étapes, champ seed. La veille technique du 2026-04-27 documente des bonnes pratiques
publiées qui ne sont pas reflétées dans l'UI :
- Prompts longs structurés (type → sujet → composition → lumière → texture → texte)
- Workflow seed en deux phases (exploration aléatoire → raffinement seed fixe)

Notes :
- `use_pe`, `negative_prompt` et `guidance_scale` ne sont pas supportés par le pipeline MLX vendor
  actuel (cf. PRD-112 analyse). Les améliorations de ce PRD sont donc exclusivement UI/UX.
- PRD-112 est implémenté : le backend et le compteur acceptent désormais 8000 caractères.
- La galerie importe déjà la lightbox et le générateur importe la galerie. Le workflow seed ne doit
  pas introduire de dépendance circulaire entre `gallery.js` et `generator.js`.

---

## Problème

L'UI actuelle n'aide pas l'utilisateur à prompter efficacement ERNIE :

- Textarea vide sans structure ni exemple → l'utilisateur produit des prompts courts et génériques
- Seed peu visible (champ discret, pas de notion "phase exploration vs raffinement") → itération non contrôlée
- Pas de compteur de caractères → l'utilisateur ne sait pas si son prompt est "assez long"
- Les templates ont été retirés du scope livré pour garder l'écran compact et éviter une bibliothèque de prompts en dur
- Le bouton actuel "Coller le seed" remplit le champ, mais ne rend pas explicite le passage en phase
  de raffinement

---

## Solution

Trois ajouts UX dans `frontend/` (HTML/CSS/JS DSFR), plus un petit module technique pour éviter le
couplage circulaire, sans changement du pipeline MLX :

1. **Templates retirés du scope livré** : aucun `templates.js`, aucun panneau templates et aucun bouton
   "Templates" dans l'UI actuelle. La décision produit est de garder le guidage léger et de s'appuyer
   sur l'aide à la structure et, ensuite, sur PRD-114 pour les ancrages visuels.

2. **Compteur de caractères avec zones visuelles** : sous le textarea, afficher "N car." avec
   trois zones de couleur DSFR et un texte compréhensible sans dépendre de la couleur :
   - < 100 : "court"
   - 100-199 : "acceptable"
   - 200-8000 selon la limite backend actuelle : "structuré"
   Le compteur affiche aussi la limite maximale effective.

3. **Workflow seed explicite** : remplacer le champ seed discret par deux modes clairs :
   - Mode "Exploration" (défaut) : seed vide, label "Seed aléatoire"
   - Mode "Raffinement" : seed fixée depuis la galerie via "Fixer cette seed", label "Seed fixée : XXXX"
   Le champ numérique reste présent et accessible. Le bouton "Libérer la seed" repasse en mode
   Exploration et vide le champ.

4. **Rappel structure prompt** (optionnel, rétractable) : lien "Aide à la structure" qui déploie
   un accordéon DSFR listant les 6 blocs recommandés (type, sujet, composition, lumière, texture,
   texte) avec un exemple par bloc. Persisté fermé par défaut en localStorage uniquement si cela ne
   perturbe pas le comportement natif DSFR.

5. **Architecture JS sans couplage circulaire** : créer un petit module `seed-workflow.js` qui possède
   l'état du seed (`mode`, `value`) et exporte `lockSeed(seed)`, `unlockSeed()` et `getSeedForSubmit()`.
   `generator.js` l'utilise au submit ; `gallery.js` l'utilise pour l'action "Fixer cette seed".

---

## Options évaluées

### Option A (retenue) : ajouts progressifs dans le formulaire existant, sans refonte

Ajouter les éléments dans `frontend/index.html` et `frontend/js/` sans changer la structure de page.
Chaque ajout doit rester isolé : compteur, seed workflow et aide structure peuvent être
livrés et testés séparément.

**Avantages** :
- Zéro changement backend ni vendor
- Rollback granulaire (chaque élément est autonome)
- Livrable en une session
- Risque visuel limité sur mobile

**Inconvénients** :
- Le formulaire peut devenir chargé si on ajoute tout en même temps
- Les prompts restent saisis manuellement ; la bibliothèque de templates est hors scope livré

### Option B : panneau latéral dédié "Atelier prompt"

Refonte de la mise en page avec un panneau latéral fixe (30 % largeur) contenant templates,
aide structure, compteur, historique seeds. Le formulaire de génération est dans la zone centrale.

**Avantages** :
- Séparation claire entre "aide au prompting" et "lancer la génération"
- Plus extensible (on pourrait ajouter un éditeur de templates custom)

**Inconvénients** :
- Refonte de mise en page plus lourde (risque de régression visuelle sur mobile)
- Overkill pour un usage solo local

---

## Décision

Option A. Usage solo local, pas besoin d'extensibilité. Les ajouts UX sont indépendants et
non-bloquants. Le périmètre livré retire les templates et conserve l'ordre : compteur → module seed
workflow → workflow seed → aide structure.

La priorité de design est la densité utile, pas une page éditoriale : les aides doivent rester
rétractables, les libellés des boutons doivent être visibles, et aucun bouton icône seul ne doit
être introduit pour ces nouvelles actions.

---

## Plan d'implémentation

1. `frontend/index.html` - ajouter un compteur sous le textarea : `id="prompt-counter"`,
   `aria-live="polite"`, avec texte initial "0 car. sur 8000 - court".
2. `frontend/js/generator.js` - centraliser la mise à jour du compteur dans `updatePromptCounter()`
   et l'appeler au chargement, à chaque `input`, et après reset du prompt.
3. `frontend/css/app.css` - ajouter des classes sobres pour les états du compteur avec tokens DSFR,
   sans se reposer uniquement sur la couleur : `prompt-counter--short`, `--ok`, `--structured`.
4. Retiré : ne pas créer `frontend/js/templates.js` dans le périmètre livré.
5. Retiré : ne pas ajouter de bouton visible "Templates" ni de panneau templates.
6. Retiré : aucune injection de template dans le textarea.
7. `frontend/js/seed-workflow.js` (nouveau) - module propriétaire de l'état seed :
   `initSeedWorkflow()`, `lockSeed(seed)`, `unlockSeed()`, `getSeedForSubmit()`.
8. `frontend/index.html` - conserver l'`input#seed`, ajouter un badge d'état et un bouton
   "Libérer la seed" masqué en mode Exploration.
9. `frontend/js/generator.js` - utiliser `getSeedForSubmit()` au lieu de lire directement
   `seedEl.value`; ne pas casser la saisie manuelle d'une seed.
10. `frontend/js/gallery.js` - renommer ou compléter l'action existante "Coller le seed" en
   "Fixer cette seed" et appeler `lockSeed(seed)` depuis les cartes et la lightbox.
11. `frontend/index.html` - ajouter l'accordéon DSFR "Aide à la structure" avec les 6 blocs
   recommandés. Contenu court, scannable, fermé par défaut.
12. `frontend/js/app.js` - initialiser `seed-workflow.js` une seule fois au démarrage, avec
   cache-busting cohérent.
13. `tests/` - si Playwright n'est pas disponible, ajouter au minimum `node --check` sur les nouveaux
   modules et un test manuel documenté : compteur, fixation/libération seed,
   génération avec seed fixée.

---

## Métriques de succès

- Aucun template n'est exposé dans le frontend courant : pas de `templates.js`, pas de panneau templates
- Le compteur affiche le bon texte et la bonne classe CSS pour les seuils 0 / 150 / 250 caractères
- "Fixer cette seed" depuis la galerie passe en mode Raffinement et affiche le badge "Seed fixée : XXXX"
- "Libérer" repasse le champ en mode Exploration (seed vide)
- L'accordéon "Aide à la structure" s'ouvre et se ferme sans erreur console
- Aucune régression sur le flux de génération SSE existant (started → progress → done)
- Aucun nouveau lien ou bouton sans intitulé visible
- Aucun `innerHTML` alimenté par les prompts sans échappement explicite

---

## Contraintes RGAA / DSFR

- Les actions "Fixer cette seed" et "Libérer la seed" sont des
  boutons avec intitulé visible.
- Le compteur ne transmet pas l'information uniquement par la couleur : il expose aussi un texte
  ("court", "acceptable", "structuré").
- Les panneaux rétractables utilisent les classes et attributs DSFR attendus (`aria-controls`,
  état ouvert/fermé géré par DSFR quand possible).
- Le focus reste maîtrisé après les actions seed et après génération réussie.
- Les libellés ajoutés ne doivent pas pousser les boutons ou badges à déborder sur mobile.

---

## Dépendances et ordre recommandé

- PRD-112 est implémenté : la limite effective du prompt et du compteur est 8000 caractères.
- Les templates ne sont pas livrés dans PRD-113. Si le besoin revient, créer un nouveau PRD ou une
  révision explicite plutôt que réintroduire silencieusement `templates.js`.
- Le module `seed-workflow.js` doit être introduit avant de modifier les actions de galerie afin
  d'éviter une dépendance circulaire `gallery.js` ↔ `generator.js`.

---

## Changelog

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-04-27 | Alex + Claude | Création du PRD |
| 2026-04-27 | Alex + Codex | Clarification périmètre frontend, limite prompt liée à PRD-112, module `seed-workflow.js`, contraintes RGAA/DSFR et plan testable |
| 2026-04-27 | Alex + Codex | Mise à jour du PRD pour refléter le périmètre livré sans templates frontend |
