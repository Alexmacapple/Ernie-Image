# Référence ERNIE-Image pour Ernie Studio

Cette référence sert à adapter la sortie de `/prompt-image` à ERNIE Studio. Elle complète la moulinette générale, elle ne la remplace pas.

## Modèle mental

Pipeline recommandé :

1. idée brute utilisateur ;
2. structuration par `/prompt-image` : `[Type]`, `[Sujet]`, `[Composition]`, `[Lumière]`, `[Texture]`, `[Texte]` ;
3. post-traitement `/ernie-image` : anglais, texte français exact, ancrage positif, cohérence MLX ;
4. test dans Ernie Studio avec seed fixe.

## Contraintes ERNIE Studio MLX

Backend actuel :

- pas de vrai `negative_prompt` ;
- pas de `guidance_scale` exposé ;
- pas de `use_pe` exposé ;
- prompt principal visible dans le textarea ;
- limite UI cible : 8000 caractères ;
- seed utile pour comparer deux variantes ;
- le `Visual anchor:` est du texte ajouté au prompt, pas un paramètre moteur.

## Gabarit prompt

Utiliser l'anglais pour le modèle :

```text
[Type] editorial portrait / cinematic poster / fashion photo / comic panel / public service poster.
[Sujet] precise main subject, visible traits, clothing, action, expression.
[Composition] framing, angle, layout, spatial relations, image ratio if useful.
[Lumière] source, direction, contrast, time of day, mood.
[Texture] materials, surfaces, print finish, fabric, skin, glass, paper, walls.
[Texte] exact French text in Latin alphabet: "TEXTE FRANÇAIS".
Visual anchor: positive visible constraints adapted to portrait, decor, text and palette.
```

## Concept incarné

ERNIE réagit mieux aux détails visibles qu'aux catégories générales. Écrire comme si l'on décrivait une scène déjà cadrée par une caméra.

| Intention | Version trop abstraite | Version incarnée |
|---|---|---|
| identité visuelle | Mediterranean woman | olive to warm light skin tone, dark brown wavy hair, hazel eyes, Madrid clothing |
| lieu européen | European city | narrow stone street, plaster facades, Latin alphabet storefronts, compact sidewalks |
| sérieux administratif | official office | glass partition, public service counter, forms, waiting chairs, sober civic signage |
| affiche française | French poster | exact French text in Latin alphabet, accents preserved, readable printed lettering |

Règle pratique : si le mot ne laisse aucune trace dans le cadrage, la lumière, le corps, l'objet, la matière ou le texte, le prompt est encore trop abstrait.

Pour l'UI Ernie en français, le placeholder reste :

```text
[Type] ... [Sujet] ... [Composition] ... [Lumière] ... [Texture] ... [Texte] ...
```

## Conversion des négatifs en positifs

Ne pas intégrer une liste comme :

```text
Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest
```

La convertir en ancrages positifs :

| Risque à éviter | Formulation positive ERNIE |
|---|---|
| caractères chinois | exact French text in Latin alphabet, accents preserved, clean readable lettering |
| calligraphie chinoise | contemporary French or European typography, printed poster lettering |
| lanternes rouges | everyday European domestic props, neutral interior lighting, cinema poster color accents |
| pagode | European stone, plaster or civic architecture, modern public buildings |
| hanfu, qipao, Tang suit | contemporary western clothing, Mediterranean tailoring, public service uniforms |
| anime style | realistic editorial photography, European cinema poster, natural proportions |
| enseignes est-asiatiques | Latin alphabet storefronts, French or Spanish street signs |
| mégapole néon asiatique | compact European street, Madrid, Valencia, Paris or Marseille urban cues |
| bambou | Mediterranean plants, indoor flowers, plane trees, potted greenery |

## Presets portraits

| Libellé UI | Visual anchor |
|---|---|
| Méditerranéen ibérique | `Visual anchor: contemporary Iberian Mediterranean editorial portrait, Spanish or southern French adult, olive to warm light skin tone, dark brown wavy hair, hazel or brown eyes, oval face, softly arched brows, straight or softly arched nose, subtle cheekbones, contemporary Madrid or Valencia clothing, plaster wall or tiled interior, Latin alphabet signage, warm window daylight, realistic photography.` |
| Europe occidentale | `Visual anchor: contemporary Western European editorial portrait, French, Belgian or Dutch adult, fair to light skin tone, light brown or dark blond hair, blue, green or hazel eyes, oval or square face, defined brow, straight nose, natural skin texture, understated wool or cotton clothing, neutral studio or European apartment background, cool soft daylight, realistic photography.` |
| Afro-caribéen | `Visual anchor: Afro-Caribbean editorial portrait, French Caribbean or Caribbean adult, deep warm brown skin tone, natural coiled or curly hair texture, dark brown eyes, defined cheekbones, full lips, natural skin texture, contemporary elegant clothing, matte studio backdrop or tropical-modern interior, soft key light, realistic editorial photography.` |
| Latino-méditerranéen | `Visual anchor: contemporary Latin Mediterranean editorial portrait, Latin American or southern European adult, warm tan to olive skin tone, dark brown hair, brown or hazel eyes, expressive natural face, soft cheekbones, straight or gently curved nose, contemporary urban clothing, Madrid, Marseille or Latin city background with Latin alphabet signage, soft daylight, realistic photography.` |

## Presets décors et texte

| Libellé UI | Visual anchor |
|---|---|
| Rue européenne | `Visual anchor: contemporary Western European street scene, Latin alphabet storefronts and street signs, stone or plaster facades, compact sidewalks, compact European cars, EU-style license plates, bus stop signage, cafe awnings, restrained street furniture, neutral daylight, realistic architecture, controlled natural color palette.` |
| Ville ibérique | `Visual anchor: Iberian Mediterranean city setting, Madrid or Valencia street, ceramic azulejo tiles, wrought iron balconies, painted plaster walls, compact stone pavement, orange trees or potted plants, Spanish Latin alphabet street signs and shopfront lettering, cafe tables, saturated red, turquoise and saffron palette, warm shop-window or late afternoon light.` |
| Institution française | `Visual anchor: contemporary French public service interior, French Latin alphabet signage, Marianne-inspired civic colors, reception counter, glass partitions, queue ticket display, paper forms, waiting chairs, blue-white-red civic notice board, sober administrative furniture, neutral daylight, clean realistic composition.` |
| Affiche en français | `Visual anchor: French poster design, exact French text in Latin alphabet, accents preserved, clean readable lettering, European cinema typography, printed paper grain, balanced title area, controlled red, blue, cream and black palette, clear hierarchy, poster layout.` |

## Preset générique si rien n'est choisi

```text
Visual anchor: coherent visible traits when characters are present, clearly described clothing and setting, Latin alphabet signage and exact text as written, consistent architecture, lighting and color palette.
```

## Exemples de transformation

### Idée brute

```text
Poster mélodrame pop, une mère espagnole dans une cuisine rouge, titre La cuisine rouge.
```

### Après `/prompt-image`

```text
[Type] cinematic pop melodrama poster.
[Sujet] a Spanish mother in a red dress preparing an extravagant cake in a Madrid kitchen.
[Composition] vertical waist-up framing, slight low angle, deep background with geometric tiles.
[Lumière] warm late afternoon side light, theatrical shadows.
[Texture] glossy red plastic, turquoise ceramic, floral tablecloth, overripe fruit.
[Texte] exact French title in Latin alphabet: "LA CUISINE ROUGE".
```

### Couche `/ernie-image`

```text
Visual anchor: Iberian Mediterranean setting, Madrid apartment kitchen, Latin alphabet poster typography, Spanish or southern European adult, olive to warm light skin tone, contemporary red dress, saturated red, turquoise and saffron palette, realistic European cinema poster.
```

## Audit rapide

Un prompt ERNIE est correct si :

- le sujet est explicite dès le début ;
- le style n'est pas mélangé sans nécessité ;
- les traits et le décor sont visibles, pas seulement nommés ;
- le texte à rendre est exact et entre guillemets ;
- l'alphabet latin est demandé si nécessaire ;
- aucune liste négative n'est collée telle quelle ;
- la seed fixe permet de tester l'effet de l'ancrage.

## Exemples prêts à copier

### Portrait seul

```text
[Type] realistic editorial portrait.
[Sujet] a French woman in her late thirties, fair to light skin tone, light brown wavy hair, green eyes, oval face, subtle freckles, contemporary navy coat, calm direct gaze.
[Composition] vertical portrait, chest-up framing, eye-level camera, neutral studio background, shallow depth of field.
[Lumière] soft window light from the left, natural contrast, gentle facial shadows.
[Texture] natural skin texture, wool coat, matte studio backdrop, realistic photography.
[Texte] portrait-only composition, plain background, typography is outside the requested composition.
Visual anchor: contemporary Western European portrait, fair to light skin tone, light brown or dark blond hair, blue, green or hazel eyes, oval or square face, defined brow, straight nose, natural Western European facial proportions, understated modern European clothing, neutral studio background, realistic photography.
```

### Décor urbain avec texte

```text
[Type] cinematic street poster.
[Sujet] a Spanish florist crossing a narrow Madrid street under rain, carrying a large red bouquet, wearing an electric blue suit.
[Composition] vertical poster, three-quarter body framing, deep European street perspective, colorful shop windows in the background.
[Lumière] warm night lighting, reflections on wet cobblestones, controlled red and yellow highlights.
[Texture] wet petals, glossy cobblestones, satin fabric, chrome shop details.
[Texte] exact French title in Latin alphabet at the bottom: "DES FLEURS POUR PERSONNE".
Visual anchor: Iberian Mediterranean night street, narrow Madrid or Valencia architecture, ceramic tiles, wrought iron balconies, painted plaster walls, Spanish Latin alphabet signs, warm shop-window lighting, wet cobblestone reflections, saturated red, turquoise and saffron palette.
```

### Affiche institutionnelle

```text
[Type] French public service poster.
[Sujet] a contemporary French public reception desk with a helpful civil servant and a visitor, calm professional atmosphere.
[Composition] frontal layout, readable poster hierarchy, open space at the top for the title, balanced civic composition.
[Lumière] neutral daylight, soft office lighting, sober contrast.
[Texture] glass partitions, matte paper forms, blue-white-red signage, clean administrative furniture.
[Texte] exact French text in Latin alphabet: "ACCUEIL CITOYEN".
Visual anchor: contemporary French public institution interior, French Latin alphabet signage, Marianne-inspired civic colors, sober administrative furniture, glass partitions, waiting area chairs, modern European public service setting, neutral daylight.
```

## Recommandation de test

Pour évaluer un preset :

1. prendre le prompt sans ancrage ;
2. fixer une seed ;
3. générer ;
4. ajouter un seul `Visual anchor:` ;
5. regénérer avec la même seed, le même format et le même nombre d'étapes ;
6. noter si le visage, le décor, le texte et la palette sont plus proches de l'intention.
