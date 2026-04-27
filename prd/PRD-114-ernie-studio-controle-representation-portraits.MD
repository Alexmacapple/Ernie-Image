# PRD-114 : Ernie Studio - contrôle de représentation visuelle

**Statut** : Implémenté - V1 compacte
**Date** : 2026-04-27
**Auteur** : Alex
**Source** : Retours d'usage Ernie Studio - biais visuel perçu sur les portraits, personnages et décors

---

## État d'implémentation au 2026-04-27

- [x] Problème cadré : biais visuel perçu sur portraits, personnages, décors, typographies et paysages.
- [x] Décision produit actée : conserver MLX pour l'instant.
- [x] Diffusers identifié comme spike futur, seulement si l'UX de prompt ne suffit pas.
- [x] Hypothèse JP intégrée : si un Prompt Enhancer chinois est actif dans un backend ERNIE, le désactiver ou le remplacer par un enrichisseur anglais devrait réduire le biais.
- [x] Vérification locale : le backend MLX actuel n'expose pas de `use_pe` et encode le prompt directement ; aucun PE chinois visible à débrancher dans `pipeline_mlx.py` ou le vendor MLX.
- [x] Negative prompt documenté comme piste future Diffusers, explicitement inactif en backend MLX.
- [x] Documentation externe créée pour l'usage actuel : `docs/integrer-negative-prompt-mlx.md`.
- [x] Prompts de test mélodrame pop espagnol documentés dans `docs/prompts-melodrame-pop-espagnol.md`.
- [x] Validation UX effectuée par rapport à l'écran actuel : formulaire déjà dense, V1 à limiter strictement.
- [x] Périmètre V1 ajusté : accordéon compact, 8 presets maximum, un champ libre, un bouton d'injection.
- [x] Implémenté : panneau UI "Représentation visuelle" compact.
- [x] Implémenté : module `representation-controls.js`, incluant un ancrage visuel anglais local maîtrisé.
- [x] Implémenté : 8 presets positifs maximum de représentation, décor, alphabet, architecture et palette.
- [x] Implémenté : bouton "Ajouter un ancrage visuel en anglais".
- [x] Implémenté : détection locale de prompts vagues, affichée comme aide non bloquante.
- [x] Implémenté : protocole de comparaison à seed fixe documenté.
- [x] Implémenté : tests statiques ciblés sur les presets positifs et le périmètre V1.
- [ ] Non implémenté : support backend Diffusers ou vrai `negative_prompt`.

Conclusion : V1 frontend compacte implémentée sur la branche `feature/prd-114-v1-compacte`, sans toucher au backend MLX. Les suites automatisées passent avec 64 tests.

## Vision

Le quoi : ajouter à Ernie Studio une aide spécifique à la représentation visuelle pour réduire les dérives de portraits, personnages, paysages, décors, costumes, signalétique et styles graphiques quand le prompt est vague, sans changer le backend MLX.

Le pourquoi : ERNIE-Image semble produire, sur des prompts courts, un biais visuel perçu comme est-asiatique, y compris dans les visages, paysages urbains, costumes, écritures et décors. Ce comportement est cohérent avec les retours d'usage observés sur ce modèle. L'utilisateur doit pouvoir verrouiller une identité visuelle voulue de manière positive, explicite et testable, sans dépendre de formulations négatives du type "not Asian" ni de listes d'éléments à éviter collées dans le prompt principal.

## Exemple bout-en-bout

1. Alex saisit un prompt court : "editorial portrait of a woman" ou "cinematic poster in a colorful city street".
2. L'interface signale que le prompt est trop vague pour contrôler la représentation visuelle.
3. Il ouvre le panneau "Représentation visuelle".
4. Il choisit un preset compact ou renseigne un ancrage personnalisé court.
5. L'interface ajoute au prompt un bloc descriptif positif et cohérent.
6. Alex fixe une seed depuis l'historique.
7. Il génère plusieurs variantes avec la même seed pour comparer uniquement l'effet du prompt enrichi.
8. Le résultat attendu converge vers la représentation demandée sans basculer vers un défaut implicite du modèle.

---

## Contexte

PRD-113 a livré une première couche de prompting guidé : templates, compteur, seed workflow et aide à la structure. Cette couche améliore les prompts génériques, mais elle ne cible pas explicitement les cas où le modèle choisit par défaut une représentation humaine, architecturale, paysagère ou typographique non voulue.

Hypothèse complémentaire remontée par JP : sur les backends ERNIE qui activent un Prompt Enhancer
chinois, ce PE peut réécrire ou enrichir un prompt court avec des priorités linguistiques et visuelles
qui accentuent les motifs est-asiatiques. Dans ce cas, désactiver `use_pe` ou remplacer ce PE par un
enrichisseur anglais devrait améliorer le contrôle de représentation.

Dans Ernie Studio MLX actuel, cette option n'est pas exposée : le code encode directement le prompt
fourni (`TextEncoder.encode(prompt)`) puis génère l'image. Aucun paramètre `use_pe` ni réécriture de
prompt n'est visible dans `pipeline_mlx.py` ou dans le vendor MLX. Le PRD traite donc deux cas :

- **MLX actuel** : ajouter un ancrage visuel anglais local maîtrisé côté frontend, qui enrichit positivement le
  prompt avant envoi ;
- **Diffusers ou backend futur** : tester explicitement `use_pe=false`, puis éventuellement un PE
  anglais contrôlé, un vrai `negative_prompt` et `guidance_scale`.

Le pipeline MLX actuel ne donne pas accès à `negative_prompt`, `guidance_scale` ni à un interrupteur
documenté de prompt enhancer. La réduction du biais doit donc d'abord passer par :

- des prompts positifs plus précis ;
- un enrichissement anglais local explicite, visible et modifiable par l'utilisateur ;
- des presets de représentation et de décor visibles et modifiables ;
- une stratégie de comparaison à seed fixe ;
- une information claire dans l'UI sur les limites du moteur.

Diffusers reste une piste séparée si le besoin persiste malgré l'amélioration UX. Ce PRD ne remplace pas MLX.

## Validation UX par rapport à l'existant

L'écran actuel contient déjà :

- un accordéon "Aide à la structure du prompt" placé au-dessus du champ prompt ;
- un textarea avec placeholder structuré, compteur et validation inline ;
- trois contrôles principaux alignés : format, étapes, seed ;
- un bouton primaire "Générer une image" ;
- une dernière génération, puis l'historique paginé et la lightbox.

La V1 ne doit donc pas ajouter un formulaire complet de représentation visuelle. Le bon niveau UX est une divulgation progressive courte :

- un second accordéon fermé par défaut, placé sous l'aide à la structure du prompt ;
- un contenu scannable en moins de 10 secondes ;
- 8 presets maximum, regroupés par usage ;
- un seul champ libre "Ancrage personnalisé" ;
- un seul bouton principal d'action dans cet accordéon ;
- aucun onglet, aucune carte imbriquée, aucun panneau latéral.

Verdict UX : conforme sous conditions. La V1 est acceptable si elle reste compacte. Le PRD devient non conforme si les champs détaillés listés plus bas sont tous livrés en première passe.

---

## Problème

Les prompts vagues laissent trop de latitude au modèle :

- "beautiful woman portrait" ne spécifie ni origine visuelle, ni traits, ni contexte ;
- "colorful cinematic street poster" ne spécifie ni géographie visuelle, ni architecture, ni alphabet, ni vêtements ;
- une nationalité seule est souvent insuffisante ;
- les formulations négatives comme "not Asian" sont peu fiables ;
- les listes d'objets interdits dans un prompt MLX peuvent renforcer les motifs nommés au lieu de les réduire ;
- sans seed fixe, l'utilisateur compare des tirages différents plutôt que l'effet du prompt ;
- l'UI ne dit pas quoi ajouter pour reprendre le contrôle.

Conséquence : l'utilisateur peut attribuer à la seed ou au hasard un comportement qui vient surtout d'un prompt sous-spécifié.

---

## Solution

Ajouter une couche UX dédiée à la représentation visuelle dans le formulaire existant, sans refonte de page.

### 1. Placement dans l'UI actuelle

Ajouter un accordéon DSFR "Représentation visuelle" fermé par défaut, sous l'accordéon existant "Aide à la structure du prompt" et avant le champ `Prompt`.

Raison UX : l'aide à la structure répond à "comment écrire un prompt", le nouveau panneau répond à "comment ancrer la représentation visuelle". Les deux aides sont liées au même champ et doivent rester proches de lui.

Contraintes :

- ne pas déplacer le champ prompt ;
- ne pas ajouter de section visible ouverte par défaut ;
- ne pas ajouter de carte dans la carte formulaire ;
- ne pas ajouter d'onglets ;
- conserver le chemin principal : prompt, format, étapes, seed, générer.

### 2. Périmètre V1 compact

La V1 contient uniquement :

- un texte d'aide court ;
- 8 presets maximum ;
- un champ libre "Ancrage personnalisé" ;
- un bouton "Ajouter un ancrage visuel en anglais" ;
- une aide non bloquante si le prompt semble vague ;
- une note courte sur la comparaison à seed fixe.

Hors V1 :

- formulaire détaillé avec teint, yeux, cheveux, focale, architecture, palette et densité de personnages ;
- bouton supplémentaire dans la lightbox ;
- `negative_prompt` visible ;
- réglage `use_pe` visible ;
- migration Diffusers.

### 3. Détection légère des prompts à risque de représentation implicite

Si le prompt contient des indices simples de personne (`portrait`, `person`, `woman`, `man`, `face`, `headshot`, `editorial portrait`, etc.) et moins de 4 attributs physiques ou contextuels, afficher une aide non bloquante :

`Prompt portrait peu spécifique : ajoutez des traits visibles pour contrôler la représentation.`

Si le prompt contient des indices simples de décor ou d'affiche (`city street`, `landscape`, `poster`, `cinematic scene`, `urban`, `architecture`, `restaurant`, `station`, `hospital`, etc.) sans ancrage géographique, architectural, vestimentaire ou typographique, afficher une aide non bloquante :

`Décor peu spécifique : ajoutez une géographie visuelle, une architecture, des vêtements et une typographie cohérents.`

Cette détection est locale, déterministe et sans appel IA.

La détection ne doit pas déclencher d'erreur, ne doit pas empêcher la soumission et ne doit pas modifier automatiquement le prompt.

### 4. Panneau "Représentation visuelle"

Contenu V1 :

- paragraphe d'aide de 2 lignes maximum ;
- groupe "Portraits" avec 4 presets maximum ;
- groupe "Décors et texte" avec 4 presets maximum ;
- champ texte court "Ancrage personnalisé" ;
- bouton d'injection.

Les champs détaillés restent une V2. L'utilisateur garde le contrôle du texte final, car l'ancrage injecté est visible dans le textarea.

### 5. Presets positifs de représentation et d'ancrage visuel

Ajouter 8 presets maximum qui injectent des blocs descriptifs positifs :

Presets V1 recommandés :

- Portrait méditerranéen contemporain ;
- Portrait européen occidental éditorial ;
- Portrait afro-caribéen éditorial ;
- Portrait latino-américain contemporain ;
- Décor urbain européen ;
- Décor méditerranéen ibérique ;
- Institution publique française ;
- Affiche française en alphabet latin.

Chaque preset doit être formulé en attributs visibles et cohérents. Aucun preset ne doit utiliser une exclusion du type "not Asian", "no pagoda", "avoid calligraphy" ou équivalent. Pour MLX, les termes négatifs sont remplacés par des ancrages positifs : `Madrid urban street`, `French Latin alphabet poster typography`, `contemporary European clothing`, `Mediterranean architecture`, `Iberian saturated palette`.

Libellés UX : éviter les catégories trop abstraites seules comme "Europe occidentale" ou "Maghrébin". Préférer des formulations orientées image, par exemple "Portrait méditerranéen contemporain" ou "Décor urbain européen".

### 6. Bouton "Ajouter un ancrage visuel en anglais"

Ajouter un bouton avec intitulé visible qui enrichit le prompt courant en ajoutant un bloc :

`Visual anchor: ...`

Le bouton doit :

- préserver le prompt existant ;
- ajouter ou remplacer un bloc délimité `Visual anchor:` ;
- déclencher `input` et `change` pour mettre à jour le compteur ;
- ne jamais remplacer silencieusement le prompt complet ;
- éviter l'empilement de plusieurs blocs d'ancrage ;
- vérifier que le prompt enrichi reste sous 8000 caractères ;
- indiquer clairement que le bloc est une formulation positive et non une contrainte négative ;
- conserver le focus dans le formulaire après injection.

Ce bouton correspond techniquement au PE anglais local de la V1. Dans l'UI, ne pas employer le terme "PE" ou "Prompt Enhancer", car il ressemble à une option moteur. Le libellé utilisateur reste "Ajouter un ancrage visuel en anglais".

Le module ne doit pas appeler une IA externe, ne doit pas traduire le prompt en chinois et ne doit pas masquer le texte injecté. Le bloc ajouté doit rester visible dans le textarea, en anglais, afin que l'utilisateur puisse le relire, le modifier ou le supprimer.

Exemple de bloc v1 :

```text
Visual anchor: contemporary Spanish / Mediterranean European setting, Latin alphabet signage, Madrid or Valencia urban architecture, European clothing, Iberian saturated color palette, French text exactly as written.
```

### 7. Mode comparaison à seed fixe

Ajouter une aide courte près du workflow seed :

`Pour comparer un prompt, fixez la seed et gardez le même format et les mêmes étapes.`

Le bouton "Fixer la seed" existe déjà dans l'historique. La V1 ne rajoute pas de bouton dans la lightbox. Un bouton "Comparer avec cette seed" peut être étudié en V2 seulement si le flux actuel reste insuffisant.

### 8. Documentation UX dans l'accordéon

Ajouter un paragraphe court :

`Pour reprendre le contrôle, décrivez positivement ce que l'image doit montrer : traits visibles, vêtements, décor, géographie visuelle, architecture, alphabet, lumière et palette. Les prompts vagues et les exclusions négatives sont moins fiables avec le backend MLX.`

Le texte doit rester court. Ne pas expliquer le modèle, Diffusers ou `use_pe` dans l'interface principale.

### 9. Negative prompt préparé, mais non actif en MLX

Le backend MLX actuel ne supporte pas de vrai `negative_prompt`. Le PRD ne doit donc pas ajouter un champ qui laisserait croire que le moteur applique une contrainte négative.

Ajouter plutôt une donnée technique `negativePrompt` uniquement préparée pour un backend futur, avec deux comportements distincts :

- en backend MLX : aucun bloc négatif copiable n'est affiché et rien n'est envoyé au pipeline ; l'UI affiche seulement des formulations positives équivalentes ;
- en backend Diffusers futur : champ envoyé comme `negative_prompt`.

Negative prompt recommandé pour le spike Diffusers :

```text
Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

Garde-fou : le negative prompt doit cibler des artefacts de décor, costume, signalétique ou style visuel. Il ne doit pas contenir de formulation qui exclut des personnes ou des identités humaines.

### 10. Prompt Enhancer et stratégie backend

La stratégie PE dépend du backend :

- backend MLX actuel : pas de `use_pe` exposé, donc rien à désactiver côté pipeline ;
- V1 MLX : ancrage visuel anglais local côté frontend, déterministe, visible et modifiable ;
- backend Diffusers futur : premier test avec `use_pe=false` si disponible ;
- backend Diffusers futur : deuxième test avec PE anglais contrôlé si le mode sans PE manque de détails.

Critère de décision : garder MLX si l'ancrage visuel anglais local réduit suffisamment le biais sur des tests à
seed fixe. Déclencher le spike Diffusers seulement si le biais persiste malgré des prompts enrichis
positivement.

### 11. Contraintes d'exécution Mac Studio MLX

Le PRD doit rester aligné avec l'optimisation matérielle existante du Mac Studio M1 Ultra 64 Go :

- backend MLX conservé par défaut ;
- une seule génération active à la fois ;
- `ERNIE_COMPILE=0` par défaut, activation seulement pour benchmark ponctuel ;
- pas de quantization sur M1 Ultra 64 Go ;
- presets de résolution existants uniquement (`square`, `landscape`, `portrait`, `landscape-soft`, `portrait-soft`, `cinema`, `vertical`) ;
- aucun appel IA supplémentaire côté UI pour analyser ou réécrire le prompt ;
- aucune migration Diffusers dans ce PRD.

---

## Options évaluées

### Option A retenue : UX de prompt compacte, backend MLX inchangé

Ajouter un accordéon compact, 8 presets maximum et un ancrage visuel anglais local déterministe.

Avantages :

- aucun coût de migration ;
- cohérent avec PRD-113 ;
- testable rapidement avec les seeds fixes ;
- pas de dépendance à Diffusers ;
- respecte l'écran actuel sans ajouter un formulaire complet ;
- teste l'hypothèse "anglais mieux contrôlé que PE chinois" sans changer de moteur ;
- optimisé pour le Mac Studio : pipeline chaud, mémoire unifiée suffisante, pas de parallélisme GPU.

Inconvénients :

- ne supprime pas le biais intrinsèque du modèle ;
- dépend de la qualité des formulations injectées ;
- ne permet pas de negative prompt réel.

### Option B : migration immédiate vers Diffusers

Remplacer MLX par un backend Diffusers exposant `negative_prompt`, `guidance_scale` et potentiellement `use_pe`.

Avantages :

- contrôle plus fin ;
- possibilité de tester `use_pe=false` si le backend expose réellement le Prompt Enhancer ;
- meilleure base pour des expérimentations avancées.

Inconvénients :

- ralentissement probable ;
- risque mémoire et stabilité sur Mac ;
- changement moteur trop large pour un problème d'UX encore testable.

### Option C : ne rien faire

Documenter uniquement le conseil de prompting.

Avantages :

- zéro coût.

Inconvénients :

- l'utilisateur doit mémoriser la méthode ;
- aucun workflow de comparaison ;
- le biais reste perçu comme une panne du modèle.

---

## Décision

Option A. On conserve MLX. On ajoute un contrôle de représentation visuelle compact dans l'UI et un
ancrage visuel anglais visible. On mesure si les prompts enrichis réduisent suffisamment le biais perçu.

Diffusers reste un spike futur, déclenché uniquement si les tests avec seed fixe montrent que l'UX de
prompt ne suffit pas. Dans ce spike, le premier test doit être `use_pe=false` si l'option existe.

La V1 doit rester compatible avec la checklist UX appliquée à l'écran actuel : divulgation progressive, moins de 9 choix visibles, pas de poids visuel égal entre trop de contrôles, et pas de changement de contexte.

---

## Plan d'implémentation

1. `frontend/index.html` - ajouter un accordéon DSFR "Représentation visuelle" fermé par défaut sous "Aide à la structure du prompt".
2. `frontend/js/representation-controls.js` - créer un module dédié, initialisé depuis `app.js`.
3. `frontend/js/representation-controls.js` - définir 8 presets maximum et un champ libre `visualAnchorCustom`.
4. `frontend/js/representation-controls.js` - ajouter la fonction `buildVisualIdentityBlock()` qui produit un bloc texte positif en anglais.
5. `frontend/js/representation-controls.js` - au clic "Ajouter un ancrage visuel en anglais", ajouter ou remplacer le bloc `Visual anchor:` dans le textarea sans écraser le contenu principal.
6. `frontend/js/generator.js` - exposer ou réutiliser un événement `input` standard pour mettre à jour le compteur et nettoyer l'erreur prompt.
7. `frontend/js/seed-workflow.js` - conserver le fonctionnement actuel ; pas de nouvelle dépendance circulaire.
8. `frontend/js/prompt-accordion.js` - réutiliser ou généraliser le fallback d'accordéon existant pour éviter une régression DSFR.
9. `frontend/css/app.css` - styles compacts, DSFR, sans carte imbriquée, sans onglets, sans panneau latéral.
10. `tests/test_frontend_static.py` - ajouter des assertions sur les nouveaux modules, intitulés visibles, nombre maximal de presets, absence de formulations négatives dans les presets.
11. Préparer la donnée `negativePrompt` dans `representation-controls.js` uniquement si cela reste invisible en MLX et sans payload `/api/generate`.
12. Ajouter une note développeur dans le module : l'ancrage local ne remplace pas un vrai `use_pe=false`, car MLX n'expose pas ce paramètre.
13. Ajouter une vérification manuelle avec seed fixe : prompt vague, prompt enrichi portrait, prompt enrichi décor.
14. Reporter en V2 : bouton lightbox "Comparer avec cette seed", champs détaillés, backend Diffusers, vrai `negative_prompt`.

---

## Critères d'acceptation

- Le panneau "Représentation visuelle" est accessible au clavier et fermé par défaut.
- Le panneau est placé sous l'aide à la structure du prompt et ne déplace pas le chemin principal de génération.
- Le panneau contient 8 presets maximum et un seul champ libre.
- Tous les boutons ont un intitulé visible.
- Le bouton "Ajouter un ancrage visuel en anglais" injecte un texte dans le prompt sans l'effacer.
- Le texte injecté est en anglais, visible dans le textarea et modifiable.
- Si un bloc `Visual anchor:` existe déjà, il est remplacé plutôt qu'empilé.
- L'injection est bloquée ou signalée clairement si elle dépasse 8000 caractères.
- Le compteur de caractères est mis à jour après injection.
- Les presets ne contiennent pas "not Asian", "no Asian", "avoid Asian" ou équivalents.
- Les presets MLX ne contiennent pas de listes d'objets indésirables ; ils utilisent seulement des ancrages positifs.
- Au moins 3 presets de décor produisent un bloc cohérent : urbain européen, méditerranéen ibérique, institution publique française.
- Un prompt avec texte à rendre peut être renforcé par `texte français en alphabet latin` ou équivalent positif.
- La méthode recommande une seed fixe pour comparer.
- Aucun changement backend ni pipeline MLX.
- Aucun contrôle UI ne laisse croire que `use_pe=false` est disponible en MLX.
- Aucun libellé UI ne parle de "PE" ou de "Prompt Enhancer".
- Aucun nouveau `innerHTML` alimenté par des données utilisateur.
- Le negative prompt est préparé comme donnée technique pour Diffusers futur, mais aucun bloc négatif copiable ni aucun contrôle UI ne prétend l'appliquer en MLX.
- Sur Mac Studio M1 Ultra 64 Go, une génération `square`, 8 steps, prompt enrichi, reste dans l'enveloppe cible existante de moins de 55 secondes.

---

## Contraintes RGAA / DSFR

- Le panneau utilise un accordéon DSFR ou un pattern équivalent avec `aria-controls` et `aria-expanded`.
- Les aides ne reposent pas uniquement sur la couleur.
- Les presets sont des boutons avec intitulé visible, pas des boutons icônes.
- Les champs optionnels ont des labels explicites.
- Le focus reste dans le formulaire après injection.
- Aucun texte ne doit déborder sur mobile.
- Les champs de représentation et de décor restent compacts : pas de carte imbriquée, pas de panneau latéral obligatoire, pas de surcharge du chemin principal de génération.
- L'accordéon réutilise le fallback existant pour éviter les artefacts d'ouverture déjà observés.
- Les presets restent scannables sans imposer un mur de boutons : deux groupes de 4 au maximum.

---

## Garde-fous éthiques et produit

- Ne pas inférer ni étiqueter l'origine d'une personne réelle.
- Ne pas présenter les presets comme des catégories biologiques.
- Formuler les aides comme des descriptions visuelles volontaires pour une image générée.
- Ne pas pousser une représentation par défaut.
- Ne pas utiliser d'exclusions négatives comme mécanisme principal.
- Ne pas masquer un enrichissement automatique : tout bloc ajouté au prompt doit être visible.
- Ne pas présenter l'ancrage visuel anglais local comme une garantie de neutralité ; c'est une aide de contrôle visuel.
- Ne pas invisibiliser la diversité : les presets sont des raccourcis descriptifs modifiables, pas des normes.
- Pour les scènes sans personnages, privilégier les ancrages de décor, architecture, alphabet et palette plutôt que des traits humains.

---

## Métriques de succès

- Avec une seed fixe, un prompt vague et son prompt enrichi produisent une différence visible dans la direction demandée.
- Avec une seed fixe, un prompt de rue ou paysage vague et son prompt enrichi produisent une différence visible dans le décor, l'alphabet ou l'architecture demandés.
- Les 8 presets V1 produisent un bloc de prompt cohérent sous 8000 caractères.
- À seed fixe, le prompt enrichi par l'ancrage visuel anglais local réduit les motifs est-asiatiques non demandés dans les scènes méditerranéennes de test.
- Aucun warning RGAA évident sur les nouveaux contrôles.
- Les tests statiques frontend passent.
- L'utilisateur peut comprendre la méthode sans lire une documentation externe.
- Sur Mac Studio M1 Ultra 64 Go, aucune régression de performance n'est attendue : le changement est frontend, sans appel IA ni changement de backend.

Protocole de validation manuelle :

- sélectionner 5 prompts de référence : portrait vague, portrait méditerranéen, affiche avec texte français, rue européenne, décor institutionnel français ;
- utiliser 3 seeds fixes par prompt ;
- générer chaque cas en version brute puis avec ancrage visuel ;
- noter chaque paire : amélioré, inchangé ou dégradé ;
- considérer la V1 utile si au moins 60 % des paires sont améliorées sans dégrader la lisibilité du texte demandé.

---

## Changelog

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-04-27 | Alex + Codex | Création du PRD après constat de biais portrait sur ERNIE-Image |
| 2026-04-27 | Alex + Codex | Ajout d'une stratégie `negative_prompt` préparée pour Diffusers et explicitement inactive en MLX |
| 2026-04-27 | Alex + Codex | Élargissement aux décors, paysages, typographies et ancrages culturels positifs ; suppression des blocs négatifs copiables en backend MLX ; ajout de critères Mac Studio |
| 2026-04-27 | Alex + Codex | Intégration hypothèse JP : désactivation d'un PE chinois quand disponible, et ancrage anglais local visible pour le backend MLX actuel |
| 2026-04-27 | Alex + Codex | Validation UX par rapport à l'écran actuel : V1 compacte, 8 presets maximum, un champ libre, protocole seed fixe |
| 2026-04-27 | Alex + Codex | Implémentation V1 compacte : accordéon, 8 presets, champ libre, injection `Visual anchor:`, tests statiques |
