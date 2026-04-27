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
page - templates prêts-à-l'emploi, aide à la structure, compteur de caractères, workflow seed
explicite.

Le pourquoi : les bonnes pratiques ERNIE (prompt structuré long, seed fixe en phase de
raffinement, exploration multi-seeds avant engagement) sont documentées mais invisibles dans
l'UI actuelle. Un champ textarea vide force l'utilisateur à les mémoriser. Rendre le workflow
visible dans l'interface réduit la charge cognitive et produit de meilleures images dès la
première session.

## Exemple bout-en-bout (projeté)

1. Alex ouvre Ernie Studio, clique "Templates" dans le formulaire.
2. Un panneau DSFR rétractable liste 8 templates (poster, photo réaliste, UI mockup, BD, infographie...).
3. Il clique "Poster de conférence IA" - le textarea se remplit avec le template structuré.
4. Il modifie uniquement le titre entre guillemets, laisse le reste.
5. Il clique "Générer" avec seed aléatoire - 3 images générées successivement (3 clics).
6. Il choisit la meilleure via la galerie, clique "Fixer cette seed" → le champ seed passe en mode
   Raffinement.
7. Il modifie un seul mot du prompt (lumière "dorée" → "froide"), régénère - la composition reste
   stable, seule la lumière change.
8. Le compteur affiche "342 caractères sur 2000 - structuré" avec un état visuel DSFR non ambigu.

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
- Le backend actuel limite `prompt` à 2000 caractères. PRD-112 prévoit 8000 caractères. PRD-113
  peut être livré avant PRD-112, mais le compteur doit refléter la limite effective du backend au
  moment de l'implémentation.
- La galerie importe déjà la lightbox et le générateur importe la galerie. Le workflow seed ne doit
  pas introduire de dépendance circulaire entre `gallery.js` et `generator.js`.

---

## Problème

L'UI actuelle n'aide pas l'utilisateur à prompter efficacement ERNIE :

- Textarea vide sans structure ni exemple → l'utilisateur produit des prompts courts et génériques
- Seed peu visible (champ discret, pas de notion "phase exploration vs raffinement") → itération non contrôlée
- Pas de compteur de caractères → l'utilisateur ne sait pas si son prompt est "assez long"
- Pas de templates → chaque session repart de zéro
- Le bouton actuel "Coller le seed" remplit le champ, mais ne rend pas explicite le passage en phase
  de raffinement

---

## Solution

Quatre ajouts UX dans `frontend/` (HTML/CSS/JS DSFR), plus un petit module technique pour éviter le
couplage circulaire, sans changement du pipeline MLX :

1. **Bibliothèque de templates** : bouton "Templates" ouvre un panneau avec 8 templates structurés
   couvrant poster, photo réaliste, UI mockup, BD/comic, infographie, affiche événementielle,
   portrait éditorial, scène architecturale. Un clic injecte le template dans le textarea, déclenche
   l'événement `input` et place le focus dans le textarea.

2. **Compteur de caractères avec zones visuelles** : sous le textarea, afficher "N car." avec
   trois zones de couleur DSFR et un texte compréhensible sans dépendre de la couleur :
   - < 100 : "court"
   - 100-199 : "acceptable"
   - 200-2000 ou 200-8000 selon la limite backend : "structuré"
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
Chaque ajout doit rester isolé : compteur, templates, seed workflow et aide structure peuvent être
livrés et testés séparément.

**Avantages** :
- Zéro changement backend ni vendor
- Rollback granulaire (chaque élément est autonome)
- Livrable en une session
- Risque visuel limité sur mobile

**Inconvénients** :
- Le formulaire peut devenir chargé si on ajoute tout en même temps
- Les templates sont en dur dans le JS - pas de persistance utilisateur ni de CRUD

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

Option A. Usage solo local, pas besoin d'extensibilité. Les 4 ajouts UX sont indépendants et
non-bloquants. On livre dans l'ordre : compteur (le plus simple) → templates → module seed workflow
→ workflow seed → aide structure.

La priorité de design est la densité utile, pas une page éditoriale : les aides doivent rester
rétractables, les libellés des boutons doivent être visibles, et aucun bouton icône seul ne doit
être introduit pour ces nouvelles actions.

---

## Plan d'implémentation

1. `frontend/index.html` - ajouter un compteur sous le textarea : `id="prompt-counter"`,
   `aria-live="polite"`, avec texte initial "0 caractère sur 2000" ou "0 caractère sur 8000" selon
   la limite backend effective.
2. `frontend/js/generator.js` - centraliser la mise à jour du compteur dans `updatePromptCounter()`
   et l'appeler au chargement, à chaque `input`, et après injection d'un template.
3. `frontend/css/app.css` - ajouter des classes sobres pour les états du compteur avec tokens DSFR,
   sans se reposer uniquement sur la couleur : `prompt-counter--short`, `--ok`, `--structured`.
4. `frontend/js/templates.js` (nouveau) - tableau de 8 templates `{id, name, description, prompt}`,
   sans `innerHTML` non échappé. Les prompts doivent rester sous la limite backend effective.
5. `frontend/index.html` - ajouter un bouton visible "Templates" (`button`, pas lien) et un panneau
   DSFR rétractable contenant la liste. Chaque template est un bouton avec intitulé visible.
6. `frontend/js/templates.js` - au clic template : remplir le textarea, déclencher `input` et
   `change`, fermer le panneau si le comportement DSFR le permet, puis focus textarea.
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
12. `frontend/js/app.js` - initialiser `templates.js` et `seed-workflow.js` une seule fois au
   démarrage, avec cache-busting cohérent.
13. `tests/` - si Playwright n'est pas disponible, ajouter au minimum `node --check` sur les nouveaux
   modules et un test manuel documenté : injection template, compteur, fixation/libération seed,
   génération avec seed fixée.

---

## Métriques de succès

- Les 8 templates injectent un prompt non vide dans le textarea en un clic
- Le compteur affiche le bon texte et la bonne classe CSS pour les seuils 0 / 150 / 250 caractères
- "Fixer cette seed" depuis la galerie passe en mode Raffinement et affiche le badge "Seed fixée : XXXX"
- "Libérer" repasse le champ en mode Exploration (seed vide)
- L'accordéon "Aide à la structure" s'ouvre et se ferme sans erreur console
- Aucune régression sur le flux de génération SSE existant (started → progress → done)
- Aucun nouveau lien ou bouton sans intitulé visible
- Aucun `innerHTML` alimenté par les prompts/templates sans échappement explicite

---

## Contraintes RGAA / DSFR

- Les actions "Templates", "Utiliser ce template", "Fixer cette seed" et "Libérer la seed" sont des
  boutons avec intitulé visible.
- Le compteur ne transmet pas l'information uniquement par la couleur : il expose aussi un texte
  ("court", "acceptable", "structuré").
- Les panneaux rétractables utilisent les classes et attributs DSFR attendus (`aria-controls`,
  état ouvert/fermé géré par DSFR quand possible).
- Le focus est maîtrisé après injection d'un template : retour dans le textarea, pas dans un élément
  masqué.
- Les templates ne doivent pas contenir de texte qui pousse les boutons ou badges à déborder sur
  mobile.

---

## Dépendances et ordre recommandé

- PRD-113 peut être livré sans PRD-112 si les templates restent sous 2000 caractères.
- Si PRD-112 est implémenté avant, fixer la limite du compteur à 8000 et prévoir des templates plus
  riches.
- Le module `seed-workflow.js` doit être introduit avant de modifier les actions de galerie afin
  d'éviter une dépendance circulaire `gallery.js` ↔ `generator.js`.

---

## Changelog

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-04-27 | Alex + Claude | Création du PRD |
| 2026-04-27 | Alex + Codex | Clarification périmètre frontend, limite prompt liée à PRD-112, module `seed-workflow.js`, contraintes RGAA/DSFR et plan testable |
