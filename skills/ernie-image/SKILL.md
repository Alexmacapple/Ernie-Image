---
name: ernie-image
description: Utiliser quand l'utilisateur demande un prompt ERNIE Studio/MLX, un Visual anchor, un preset ERNIE, une réduction de biais portraits/décors, ou la conversion positive de contraintes sans negative_prompt, guidance_scale ni use_pe.
---

# Skill : /ernie-image

## Position dans la chaîne

Ce skill passe après `/prompt-image`.

1. Si l'utilisateur donne une idée brute, appliquer d'abord la logique de `/prompt-image` pour obtenir un prompt structuré avec les blocs `[Type]`, `[Sujet]`, `[Composition]`, `[Lumière]`, `[Texture]`, `[Texte]`.
2. Si `/prompt-image --gen ernie` a déjà produit ces blocs, ne pas refaire l'analyse ni la structuration. Appliquer seulement la couche ERNIE : anglais opérationnel, texte français exact, ancrage positif, limites MLX, seed fixe pour tester.
3. Si l'utilisateur donne déjà un prompt structuré, ne pas refaire toute la moulinette : adapter directement pour ERNIE Studio.
4. Si `/prompt-image` n'est pas disponible, produire directement le même format en 6 blocs, puis ajouter `Visual anchor:`.

## Options rapides

| Option | Effet |
|---|---|
| `--preset` | produire un libellé UI français court et un `Visual anchor:` |
| `--audit` | analyser le prompt ou preset fourni avant de proposer une correction |
| `--portrait` | renforcer les traits visibles, cheveux, yeux, visage, vêtements et lumière |
| `--decor` | renforcer géographie visuelle, architecture, mobilier, rue, végétation et palette |
| `--text` | renforcer alphabet latin, texte exact, accents, support et lisibilité typographique |
| `--portrait --decor --text` | combiner les trois axes dans un seul `Visual anchor:` sans dupliquer les idées |

## Choix du mode

| Demande utilisateur | Action |
|---|---|
| idée brute d'image | structurer comme `/prompt-image`, puis adapter ERNIE |
| prompt déjà structuré | appliquer seulement la couche ERNIE |
| demande de preset UI | produire un libellé français et un `Visual anchor:` |
| audit d'un prompt ou preset | lire `REFERENCE.md`, pointer les faiblesses et proposer une correction |
| correction du front Ernie Studio | utiliser plutôt `ernie-studio-presets` |

## Règle centrale

ERNIE Studio utilise actuellement le backend MLX. Ne jamais présenter comme disponible :

- `negative_prompt`
- `guidance_scale`
- `use_pe`
- un prompt enhancer désactivable côté UI, sauf si le code du projet l'expose explicitement

Les contraintes doivent être formulées positivement dans le prompt principal ou dans une ligne `Visual anchor:`.

## Principe concept incarné

Traiter le prompt comme un petit programme visuel : chaque mot important doit produire quelque chose de visible dans l'image.

Transformer les concepts abstraits en indices incarnés :

| Concept abstrait | À écrire pour ERNIE |
|---|---|
| tension | posture rigide, regard fixe, mains serrées, distance entre personnages |
| européen | architecture, vêtements, signalétique latine, mobilier, lumière locale |
| institutionnel | guichet, affichage public, verre, formulaires, couleurs civiques |
| mélodrame | contre-jour, contraste, geste suspendu, palette saturée, regard caméra |
| diversité | traits visibles précis, cheveux, peau, vêtements, contexte cohérent |

Si un détail ne peut pas être vu, le reformuler ou le retirer.

Garde anti-essentialisation : n'utiliser des traits physiques liés à une origine que si l'utilisateur demande explicitement une identité, une région, un casting ou une représentation précise. Sinon, privilégier le décor, la signalétique, les vêtements, la lumière, la typographie, les objets et la palette. Ne jamais présenter un trait physique comme obligatoire ou exclusif d'un groupe.

## Lexique de précision

Remplacer les mots vagues par des graines lexicales qui obligent le modèle à rendre quelque chose de concret.

| Mot vague | Terme plus utile | Ce que cela force dans l'image |
|---|---|---|
| style | registre visuel | photo, affiche, éditorial, institutionnel, poster imprimé |
| décor | topographie | rue étroite, guichet, patio, façade, comptoir |
| ambiance | climat lumineux | contre-jour, lumière de fenêtre, tungsten, jour couvert |
| texte | inscription | support, alphabet, emplacement, accents, lisibilité |
| couleur | palette | familles chromatiques, contraste, accents, saturation |
| détail | trace visible | pli, grain, reflet, usure, texture, bord imprimé |
| attitude | geste | regard, posture, distance, mains, torsion du corps |
| européen | indices situés | signalétique latine, mobilier, architecture, vêtements |

Utiliser ces termes comme filtres : si le prompt dit `ambiance dramatique`, le traduire en lumière, geste, cadrage et contraste.

## Sortie attendue

Pour un prompt complet, produire :

```text
[Type] ...
[Sujet] ...
[Composition] ...
[Lumière] ...
[Texture] ...
[Texte] ...
Visual anchor: ...
```

Le prompt final est en anglais pour le modèle. Les libellés de blocs `[Sujet]`, `[Lumière]`, etc. sont une structure de travail en français ; le contenu après chaque libellé doit être en anglais, sauf le texte exact à rendre dans l'image. Le texte à rendre reste dans la langue demandée par l'utilisateur, avec guillemets et accents préservés.

Si aucun texte n'est demandé, ne pas inventer de titre. Remplir `[Texte]` avec une contrainte positive comme `typography is outside the requested composition`.

Pour un preset Ernie Studio, produire :

```text
Libellé UI : Méditerranéen ibérique
Visual anchor: contemporary Iberian Mediterranean portrait, ...
```

## Exemples

Micro-exemple sans charger `REFERENCE.md` :

```text
Entrée : portrait éditorial d'une actrice espagnole, titre "ROUGE"

[Type] realistic editorial portrait.
[Sujet] a Spanish actress in a contemporary red dress, olive to warm light skin tone, dark brown wavy hair, hazel eyes, calm direct gaze.
[Composition] vertical chest-up framing, eye-level camera, neutral Madrid studio background.
[Lumière] warm window daylight from the left, natural contrast.
[Texture] natural skin texture, satin red fabric, matte backdrop.
[Texte] exact French text in Latin alphabet: "ROUGE".
Visual anchor: contemporary Iberian Mediterranean portrait, Spanish or southern French adult, olive to warm light skin tone, dark brown wavy hair, hazel or brown eyes, natural Iberian facial proportions, Latin alphabet typography, realistic editorial photography.
```

## Quand charger REFERENCE.md

Lire `REFERENCE.md` dans ce dossier dès qu'il faut :

- écrire ou corriger un preset ;
- convertir une liste négative en ancrages positifs ;
- réduire les biais de portraits, décors, alphabet ou palette ;
- auditer un prompt ERNIE ;
- fournir plusieurs variantes prêtes à tester.

Ne pas charger `REFERENCE.md` pour une réponse très simple qui demande seulement de rappeler les limites MLX déjà listées dans ce fichier.

## Anti-biais par ancrage positif

Ne pas écrire `not Asian`, `no Chinese`, `avoid pagoda`, ou une longue liste négative. Avec MLX, ces mots peuvent renforcer les motifs qu'on voulait éviter.

Décrire à la place ce qui doit apparaître :

- traits visibles du visage ;
- vêtements et contexte culturel cohérents ;
- architecture et mobilier ;
- alphabet latin et texte exact ;
- lumière, palette, support typographique.

## Pièges

- Utiliser `negative_prompt`, `guidance_scale` ou `use_pe` alors que MLX ne les expose pas.
- Coller une liste négative brute au lieu de convertir en présence positive.
- Employer des labels abstraits comme `European`, `official`, `beautiful` sans indices visibles.
- Essentialiser des traits physiques sans demande explicite d'identité, région, casting ou représentation précise.

## Incertitudes à expliciter

Quand la demande porte sur les biais du modèle, dire clairement :

- un ancrage positif réduit une dérive probable, il ne garantit pas le résultat ;
- le modèle peut ignorer certains détails, surtout avec peu d'étapes ou un prompt trop long ;
- la seule comparaison fiable se fait avec la même seed, le même format et les mêmes étapes ;
- si le code front diffère de `REFERENCE.md`, le front gagne pour le comportement réel, mais la référence doit être resynchronisée.

## Format de réponse

Répondre en français, avec des blocs copiables en anglais.

Pour une demande courte :

````markdown
**Prompt ERNIE**
```text
...
```

**Pourquoi**
Cette version verrouille ...
````

Pour plusieurs presets, utiliser un tableau :

| Libellé UI | Visual anchor |
|---|---|
| ... | `Visual anchor: ...` |

## Checklist finale

- [ ] Le prompt final commence par le type d'image et le sujet.
- [ ] Le texte à rendre est entre guillemets, ou `[Texte]` indique clairement qu'aucune typographie n'est demandée.
- [ ] Les accents français sont conservés si le texte est français.
- [ ] Chaque concept abstrait important est incarné par au moins un détail visible.
- [ ] Les ancrages sont positifs et visibles.
- [ ] Les termes négatifs ont été convertis en présence positive.
- [ ] Aucun faux paramètre MLX n'est conseillé.
- [ ] Les presets restent sous 500 caractères environ.
- [ ] Les tests recommandés utilisent une seed fixe.
