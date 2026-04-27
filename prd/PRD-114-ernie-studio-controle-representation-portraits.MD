# PRD-114 : Ernie Studio - contrôle de représentation visuelle

**Statut** : Cadré - non implémenté
**Date** : 2026-04-27
**Auteur** : Alex
**Source** : Retours d'usage Ernie Studio - biais visuel perçu sur les portraits, personnages et décors

---

## État d'implémentation au 2026-04-27

- [x] Problème cadré : biais visuel perçu sur portraits, personnages, décors, typographies et paysages.
- [x] Décision produit actée : conserver MLX pour l'instant.
- [x] Diffusers identifié comme spike futur, seulement si l'UX de prompt ne suffit pas.
- [x] Negative prompt documenté comme piste future Diffusers, explicitement inactif en backend MLX.
- [x] Documentation externe créée pour l'usage actuel : `docs/integrer-negative-prompt-mlx.md`.
- [x] Prompts de test mélodrame pop espagnol documentés dans `docs/prompts-melodrame-pop-espagnol.md`.
- [ ] Non implémenté : panneau UI "Représentation visuelle".
- [ ] Non implémenté : module `representation-controls.js`.
- [ ] Non implémenté : presets positifs de représentation, décor, alphabet, architecture et palette.
- [ ] Non implémenté : bouton "Renforcer les traits et le décor décrits".
- [ ] Non implémenté : détection locale de prompts vagues.
- [ ] Non implémenté : aide spécifique à la comparaison avec seed fixe au-delà du workflow seed existant.
- [ ] Non implémenté : tests statiques sur les presets positifs.
- [ ] Non implémenté : support backend Diffusers ou vrai `negative_prompt`.

Conclusion : PRD prêt conceptuellement, mais pas lancé. La prochaine étape raisonnable est une petite v1 frontend positive, sans toucher au backend MLX.

## Vision

Le quoi : ajouter à Ernie Studio une aide spécifique à la représentation visuelle pour réduire les dérives de portraits, personnages, paysages, décors, costumes, signalétique et styles graphiques quand le prompt est vague, sans changer le backend MLX.

Le pourquoi : ERNIE-Image semble produire, sur des prompts courts, un biais visuel perçu comme est-asiatique, y compris dans les visages, paysages urbains, costumes, écritures et décors. Ce comportement est cohérent avec les retours d'usage observés sur ce modèle. L'utilisateur doit pouvoir verrouiller une identité visuelle voulue de manière positive, explicite et testable, sans dépendre de formulations négatives du type "not Asian" ni de listes d'éléments à éviter collées dans le prompt principal.

## Exemple bout-en-bout

1. Alex saisit un prompt court : "editorial portrait of a woman" ou "cinematic poster in a colorful city street".
2. L'interface signale que le prompt est trop vague pour contrôler la représentation visuelle.
3. Il ouvre le panneau "Représentation visuelle".
4. Il choisit un preset "Méditerranéen contemporain" ou renseigne manuellement des traits visibles, un décor, une architecture, une typographie et un contexte photo.
5. L'interface ajoute au prompt un bloc descriptif positif et cohérent.
6. Alex fixe une seed depuis l'historique.
7. Il génère plusieurs variantes avec la même seed pour comparer uniquement l'effet du prompt enrichi.
8. Le résultat attendu converge vers la représentation demandée sans basculer vers un défaut implicite du modèle.

---

## Contexte

PRD-113 a livré une première couche de prompting guidé : templates, compteur, seed workflow et aide à la structure. Cette couche améliore les prompts génériques, mais elle ne cible pas explicitement les cas où le modèle choisit par défaut une représentation humaine, architecturale, paysagère ou typographique non voulue.

Le pipeline MLX actuel ne donne pas accès à `negative_prompt`, `guidance_scale` ni à un interrupteur documenté de prompt enhancer. La réduction du biais doit donc d'abord passer par :

- des prompts positifs plus précis ;
- des presets de représentation et de décor visibles et modifiables ;
- une stratégie de comparaison à seed fixe ;
- une information claire dans l'UI sur les limites du moteur.

Diffusers reste une piste séparée si le besoin persiste malgré l'amélioration UX. Ce PRD ne remplace pas MLX.

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

### 1. Détection légère des prompts à risque de représentation implicite

Si le prompt contient des indices simples de personne (`portrait`, `person`, `woman`, `man`, `face`, `headshot`, `editorial portrait`, etc.) et moins de 4 attributs physiques ou contextuels, afficher une aide non bloquante :

`Prompt portrait peu spécifique : ajoutez des traits visibles pour contrôler la représentation.`

Si le prompt contient des indices simples de décor ou d'affiche (`city street`, `landscape`, `poster`, `cinematic scene`, `urban`, `architecture`, `restaurant`, `station`, `hospital`, etc.) sans ancrage géographique, architectural, vestimentaire ou typographique, afficher une aide non bloquante :

`Décor peu spécifique : ajoutez une géographie visuelle, une architecture, des vêtements et une typographie cohérents.`

Cette détection est locale, déterministe et sans appel IA.

### 2. Panneau "Représentation visuelle"

Ajouter un accordéon DSFR fermé par défaut sous l'aide à la structure du prompt.

Champs proposés :

- Type de portrait : photo réaliste, portrait éditorial, headshot, illustration ;
- Représentation visuelle : Europe occidentale, méditerranéenne, afro-descendante, maghrébine, latino-américaine, sud-asiatique, diverse ou personnalisée ;
- Teint ;
- Yeux ;
- Cheveux ;
- Forme du visage ;
- Style vestimentaire ;
- Contexte photo : lumière, focale, arrière-plan.
- Géographie visuelle : Madrid, Valence, Marseille, Lisbonne, Andalousie, Méditerranée, Europe urbaine, institution française, personnalisée ;
- Architecture et décor : rue madrilène, patio andalou, gare européenne, appartement méditerranéen, hôpital européen, bureau administratif français, studio TV français ;
- Typographie et alphabet : texte français en alphabet latin, affiche européenne, signalétique française, lettrage condensé de cinéma ;
- Palette et direction artistique : mélodrame pop méditerranéen, baroque domestique, palette ibérique saturée, rouge laqué, rose bougainvillier, turquoise céramique, jaune safran ;
- Densité de personnages : aucun personnage, un seul personnage, deux personnages maximum, groupe explicitement décrit.

Les champs doivent rester optionnels. L'utilisateur garde le contrôle du texte final.

### 3. Presets positifs de représentation et d'ancrage visuel

Ajouter des presets qui injectent des blocs descriptifs positifs :

- Europe occidentale ;
- Méditerranéen contemporain ;
- Afro-descendant ;
- Maghrébin ;
- Latino ;
- Sud-asiatique ;
- Diversifié sans défaut implicite ;
- Décor urbain européen ;
- Décor méditerranéen ibérique ;
- Institution publique française ;
- Affiche française en alphabet latin ;
- Mélodrame pop méditerranéen.

Chaque preset doit être formulé en attributs visibles et cohérents. Aucun preset ne doit utiliser une exclusion du type "not Asian", "no pagoda", "avoid calligraphy" ou équivalent. Pour MLX, les termes négatifs sont remplacés par des ancrages positifs : `Madrid urban street`, `French Latin alphabet poster typography`, `contemporary European clothing`, `Mediterranean architecture`, `Iberian saturated palette`.

### 4. Bouton "Renforcer les traits et le décor décrits"

Ajouter un bouton avec intitulé visible qui enrichit le prompt courant en ajoutant un bloc :

`Visual identity details: ...`

Le bouton doit :

- préserver le prompt existant ;
- ajouter les détails à la fin ou dans une zone dédiée ;
- déclencher `input` et `change` pour mettre à jour le compteur ;
- ne jamais remplacer silencieusement le prompt complet.
- dédupliquer le bloc si l'utilisateur clique plusieurs fois ;
- indiquer clairement que le bloc est une formulation positive et non une contrainte négative.

### 5. Mode comparaison à seed fixe

Ajouter une aide courte près du workflow seed :

`Pour comparer un prompt, fixez la seed et gardez le même format et les mêmes étapes.`

Option acceptable : un bouton "Comparer avec cette seed" dans la lightbox qui fixe la seed et ramène le focus au prompt.

### 6. Documentation UX dans l'accordéon

Ajouter un paragraphe court :

`Pour reprendre le contrôle, décrivez positivement ce que l'image doit montrer : traits visibles, vêtements, décor, géographie visuelle, architecture, alphabet, lumière et palette. Les prompts vagues et les exclusions négatives sont moins fiables avec le backend MLX.`

### 7. Negative prompt préparé, mais non actif en MLX

Le backend MLX actuel ne supporte pas de vrai `negative_prompt`. Le PRD ne doit donc pas ajouter un champ qui laisserait croire que le moteur applique une contrainte négative.

Ajouter plutôt une donnée technique `negativePrompt` uniquement préparée pour un backend futur, avec deux comportements distincts :

- en backend MLX : aucun bloc négatif copiable n'est affiché et rien n'est envoyé au pipeline ; l'UI affiche seulement des formulations positives équivalentes ;
- en backend Diffusers futur : champ envoyé comme `negative_prompt`.

Negative prompt recommandé pour le spike Diffusers :

```text
Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

Garde-fou : le negative prompt doit cibler des artefacts de décor, costume, signalétique ou style visuel. Il ne doit pas contenir de formulation qui exclut des personnes ou des identités humaines.

### 8. Contraintes d'exécution Mac Studio MLX

Le PRD doit rester aligné avec l'optimisation matérielle existante du Mac Studio M1 Ultra 64 Go :

- backend MLX conservé par défaut ;
- une seule génération active à la fois ;
- `ERNIE_COMPILE=0` par défaut, activation seulement pour benchmark ponctuel ;
- pas de quantization sur M1 Ultra 64 Go ;
- presets de résolution existants uniquement (`square`, `landscape`, `portrait`, `landscape-soft`, `portrait-soft`, `cinema`, `vertical`) ;
- aucun appel IA supplémentaire côté UI pour analyser le prompt ;
- aucune migration Diffusers dans ce PRD.

---

## Options évaluées

### Option A retenue : UX de prompt structurée, backend MLX inchangé

Ajouter des contrôles frontend et des templates spécialisés.

Avantages :

- aucun coût de migration ;
- cohérent avec PRD-113 ;
- testable rapidement avec les seeds fixes ;
- pas de dépendance à Diffusers.
- optimisé pour le Mac Studio : pipeline chaud, mémoire unifiée suffisante, pas de parallélisme GPU.

Inconvénients :

- ne supprime pas le biais intrinsèque du modèle ;
- dépend de la qualité des formulations injectées ;
- ne permet pas de negative prompt réel.

### Option B : migration immédiate vers Diffusers

Remplacer MLX par un backend Diffusers exposant `negative_prompt`, `guidance_scale` et potentiellement `use_pe`.

Avantages :

- contrôle plus fin ;
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

Option A. On conserve MLX. On ajoute un contrôle de représentation visuelle explicite dans l'UI et on mesure si les prompts enrichis réduisent suffisamment le biais perçu.

Diffusers reste un spike futur, déclenché uniquement si les tests avec seed fixe montrent que l'UX de prompt ne suffit pas.

---

## Plan d'implémentation

1. `frontend/index.html` - ajouter un accordéon DSFR "Représentation visuelle" fermé par défaut.
2. `frontend/js/representation-controls.js` - créer un module dédié, initialisé depuis `app.js`.
3. `frontend/js/representation-controls.js` - définir les presets, champs optionnels et ancrages de décor.
4. `frontend/js/representation-controls.js` - ajouter la fonction `buildVisualIdentityBlock()` qui produit un bloc texte positif.
5. `frontend/js/representation-controls.js` - au clic "Renforcer les traits et le décor décrits", ajouter le bloc au textarea sans écraser le contenu existant.
6. `frontend/js/generator.js` - exposer ou réutiliser un événement `input` standard pour mettre à jour le compteur et nettoyer l'erreur prompt.
7. `frontend/js/seed-workflow.js` - conserver le fonctionnement actuel ; pas de nouvelle dépendance circulaire.
8. `frontend/js/gallery.js` - si retenu, ajouter "Comparer avec cette seed" dans la lightbox ou renommer l'action existante sans multiplier les boutons.
9. `frontend/css/app.css` - styles compacts, DSFR, sans carte imbriquée.
10. `tests/test_frontend_static.py` - ajouter des assertions sur les nouveaux modules, intitulés visibles, absence de formulations négatives dans les presets.
11. Préparer la donnée `negativePrompt` dans `representation-controls.js`, mais ne pas l'afficher comme bloc copiable et ne pas l'inclure dans le payload `/api/generate` tant que `ERNIE_BACKEND=mlx`.
12. Si un backend Diffusers est ajouté plus tard, étendre `GenerateRequest` avec `negative_prompt: str | None`, le propager dans le pipeline Diffusers uniquement et tester que MLX l'ignore explicitement avec une note UI.
13. Ajouter des tests statiques garantissant que les presets MLX contiennent seulement des ancrages positifs de représentation, décor, alphabet, vêtement et architecture.
14. Ajouter une vérification visuelle manuelle avec seed fixe : prompt vague, prompt enrichi portrait, prompt enrichi décor.

---

## Critères d'acceptation

- Le panneau "Représentation visuelle" est accessible au clavier et fermé par défaut.
- Tous les boutons ont un intitulé visible.
- Le bouton "Renforcer les traits et le décor décrits" injecte un texte dans le prompt sans l'effacer.
- Le compteur de caractères est mis à jour après injection.
- Les presets ne contiennent pas "not Asian", "no Asian", "avoid Asian" ou équivalents.
- Les presets MLX ne contiennent pas de listes d'objets indésirables ; ils utilisent seulement des ancrages positifs.
- Au moins 3 presets de décor produisent un bloc cohérent : urbain européen, méditerranéen ibérique, institution publique française.
- Un prompt avec texte à rendre peut être renforcé par `texte français en alphabet latin` ou équivalent positif.
- La méthode recommande une seed fixe pour comparer.
- Aucun changement backend ni pipeline MLX.
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

---

## Garde-fous éthiques et produit

- Ne pas inférer ni étiqueter l'origine d'une personne réelle.
- Ne pas présenter les presets comme des catégories biologiques.
- Formuler les aides comme des descriptions visuelles volontaires pour une image générée.
- Ne pas pousser une représentation par défaut.
- Ne pas utiliser d'exclusions négatives comme mécanisme principal.
- Ne pas invisibiliser la diversité : les presets sont des raccourcis descriptifs modifiables, pas des normes.
- Pour les scènes sans personnages, privilégier les ancrages de décor, architecture, alphabet et palette plutôt que des traits humains.

---

## Métriques de succès

- Avec une seed fixe, un prompt vague et son prompt enrichi produisent une différence visible dans la direction demandée.
- Avec une seed fixe, un prompt de rue ou paysage vague et son prompt enrichi produisent une différence visible dans le décor, l'alphabet ou l'architecture demandés.
- Au moins 8 presets produisent un bloc de prompt cohérent sous 8000 caractères.
- Aucun warning RGAA évident sur les nouveaux contrôles.
- Les tests statiques frontend passent.
- L'utilisateur peut comprendre la méthode sans lire une documentation externe.
- Sur Mac Studio M1 Ultra 64 Go, aucune régression de performance n'est attendue : le changement est frontend, sans appel IA ni changement de backend.

---

## Changelog

| Date | Auteur | Changement |
|------|--------|------------|
| 2026-04-27 | Alex + Codex | Création du PRD après constat de biais portrait sur ERNIE-Image |
| 2026-04-27 | Alex + Codex | Ajout d'une stratégie `negative_prompt` préparée pour Diffusers et explicitement inactive en MLX |
| 2026-04-27 | Alex + Codex | Élargissement aux décors, paysages, typographies et ancrages culturels positifs ; suppression des blocs négatifs copiables en backend MLX ; ajout de critères Mac Studio |
