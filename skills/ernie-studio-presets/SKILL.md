---
name: ernie-studio-presets
description: "Utiliser pour (1) auditer, corriger ou synchroniser les presets déjà présents dans le front Ernie Studio (libellés UI, fragments d'ancrage, alignement avec ernie-image/REFERENCE.md), ou (2) vérifier si un preset canonique existant est pertinent pour un prompt en cours — consulter REFERENCE.md et répondre OK/N/A. Ne pas créer de nouveaux presets ni réécrire un prompt complet."
---

# Skill : Ernie Studio Presets

Ce skill est secondaire. Il sert à maintenir les presets déjà intégrés dans l'UI Ernie Studio.

Pour toute création de prompt, tout nouveau preset ou toute stratégie anti-biais, utiliser `ernie-image` après `prompt-image`.

## Source canonique

Lire la référence principale avant toute correction :

```text
../ernie-image/REFERENCE.md
```

Les presets canoniques vivent dans `ernie-image/REFERENCE.md`. Ne pas les dupliquer ici.

## Résolution du projet

Avant d'auditer le front, identifier la racine Ernie Studio :

1. Vérifier si le répertoire courant contient `frontend/js/representation-controls.js` et `frontend/index.html`.
2. Sinon, remonter les parents proches et chercher ces deux fichiers ensemble.
3. Sinon, utiliser `Glob` pour trouver `**/frontend/js/representation-controls.js` et vérifier le `frontend/index.html` voisin.
4. Si plusieurs candidats existent, choisir celui dont `frontend/index.html` contient `Ernie Studio`.
5. Si aucun candidat fiable n'est trouvé, demander le chemin racine du projet avant toute modification.

## Fichiers front à vérifier

Dans le projet Ernie Studio, chercher en priorité :

```text
frontend/js/representation-controls.js
frontend/index.html
```

Si ces fichiers ne sont pas présents, utiliser `Grep` ou `Glob` pour trouver `VISUAL_ANCHOR_PRESETS`, `data-visual-anchor-preset` et `Visual anchor:`.

## Périmètre

Couvert :

- vérifier que les libellés UI français du front correspondent aux presets canoniques ;
- vérifier que le texte final injecté dans le prompt commence par `Visual anchor:` ;
- corriger un preset existant qui a dérivé ;
- signaler un preset trop vague, trop long, ou formulé négativement ;
- vérifier que le texte ajouté reste visible et éditable dans le textarea.

Hors périmètre :

- créer une nouvelle famille de prompts ;
- réécrire un prompt complet ;
- conseiller `negative_prompt`, `guidance_scale` ou `use_pe` pour MLX ;
- maintenir une seconde liste de presets.

## Règles de correction

1. Garder un libellé UI court en français.
2. Garder un texte final injecté en anglais qui commence par `Visual anchor:`.
3. Décrire uniquement des éléments positifs et visibles.
4. Refuser les listes négatives collées telles quelles.
5. Vérifier que le preset reste testable à seed fixe.
6. Si le preset contient du texte à rendre, inclure `exact French text in Latin alphabet`, `clean readable lettering` et, si utile, `accents preserved`.

Nuance front : le tableau JS peut stocker seulement le fragment d'ancrage. C'est conforme si la fonction d'injection ajoute `Visual anchor:` dans le textarea final.

## Principe concept incarné

Un preset n'est pas un label culturel. Il doit produire des pixels vérifiables.

Avant de valider un preset, vérifier qu'il contient des indices visibles : traits, vêtements, architecture, signalétique, lumière, matière, palette ou typographie. Si le preset se limite à `European`, `Mediterranean`, `official` ou `editorial`, il est trop abstrait.

## Lexique d'audit

Lorsqu'un preset paraît faible, chercher le mot flou et le remplacer par une graine plus précise.

| Mot flou | Remplacement attendu |
|---|---|
| European | Latin alphabet signage, plaster facades, compact sidewalks, compact European cars, EU-style license plates |
| Mediterranean | ceramic tiles, wrought iron balconies, warm plaster walls, potted plants |
| official | reception counter, queue ticket display, paper forms, civic signage |
| poster | printed paper grain, title area, typographic hierarchy, readable lettering |
| elegant | fabric, cut, posture, finish, lighting |
| urban | street furniture, storefronts, pavement, signs, vehicles |
| colorful | named palette, accent color, saturation level |

Un bon preset doit contenir au moins trois graines concrètes parmi : signalétique, matériau, mobilier, lumière, support de texte, palette, geste, architecture.

## Protocole d'audit

1. Lire `../ernie-image/REFERENCE.md`.
2. Lire le fichier front qui contient les presets.
3. Comparer pour chaque preset : `id`, libellé visible et texte injecté normalisé.
4. Vérifier que les boutons associés ont un libellé visible et un `title` cohérent.
5. Signaler toute divergence avant modification si elle change le comportement utilisateur.
6. Si l'utilisateur demande une correction, modifier uniquement les presets ou libellés concernés.
7. Ne pas modifier la logique de génération, de seed ou de galerie depuis ce skill.
8. Après correction, relancer une recherche ciblée :

```text
Grep: VISUAL_ANCHOR_PRESETS|data-visual-anchor-preset|Visual anchor:
```

9. Vérifier le diff ciblé des fichiers modifiés avant de conclure.

La normalisation retire `Visual anchor:` et le point final éventuel, car le front peut stocker seulement le fragment et ajouter le préfixe ou la ponctuation au moment de l'injection.

## Pièges

- NE PAS créer de nouveaux presets au lieu de maintenir les presets existants.
- NE PAS dupliquer les presets canoniques de `../ernie-image/REFERENCE.md`.
- NE PAS forcer `Visual anchor:` dans le tableau front si l'injection l'ajoute déjà.
- NE PAS modifier la logique de génération, de seed, de galerie ou de lightbox.

## Exemples

Correction ciblée :

```text
Constat : le libellé front "Institution publique française contemporaine" est trop long.
Correction : libellé "Institution française", fragment inchangé ou synchronisé avec REFERENCE.md.
Vérification : le textarea final injecte bien "Visual anchor: ...".
```

## Critères 10/10

Un audit ou une correction est complet si :

- le front et `REFERENCE.md` sont synchronisés ;
- aucun preset ne contient de formulation négative ;
- aucun preset ne promet un paramètre moteur absent de MLX ;
- les libellés visibles restent compréhensibles sans infobulle ;
- les textes injectés restent éditables dans le textarea ;
- le résultat peut être testé avec une seed fixe ;
- le diff final ne touche que les fichiers nécessaires au preset ou à son libellé.

## Checklist finale

- [ ] La racine Ernie Studio a été identifiée sans ambiguïté.
- [ ] `../ernie-image/REFERENCE.md` a été consulté.
- [ ] Les libellés visibles et les `title` restent cohérents.
- [ ] Le stockage front et le texte final injecté sont distingués.
- [ ] Le texte final injecté commence par `Visual anchor:`.
- [ ] Aucun preset ne contient de liste négative brute.
- [ ] Le diff est limité aux presets ou libellés concernés.

## Format de réponse

Pour une correction simple :

````markdown
**Constat**
Le preset ...

**Correction**
```text
Libellé UI : ...
Visual anchor: ...
```

**Impact**
...
````

Pour un audit de plusieurs presets :

| Preset | Statut | Correction |
|---|---|---|
| ... | OK / à corriger | ... |
