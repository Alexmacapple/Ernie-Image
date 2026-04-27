# Chaînage des prompts pour Ernie Studio

## Objectif

Quand une demande porte sur un prompt image destiné à Ernie Studio, ne pas répondre avec un prompt générique. Appliquer d'abord les skills locaux de prompting, puis produire une version adaptée au backend MLX.

## Chaînage agent

1. Lire `/Users/alex/Claude/.claude/skills/prompt-image/SKILL.md`.
2. Traiter la demande comme `/prompt-image --gen ernie`.
3. Lire `/Users/alex/Claude/.claude/skills/ernie-image/SKILL.md`.
4. Lire `/Users/alex/Claude/.claude/skills/ernie-image/REFERENCE.md` si la demande implique un prompt complet, un ancrage positif, un biais à réduire, plusieurs variantes ou un audit.
5. Lire `/Users/alex/Claude/.claude/skills/ernie-studio-presets/SKILL.md` seulement si la demande concerne un preset UI, un libellé de bouton, un fragment `Visual anchor:` déjà présent dans le front ou une synchronisation avec `frontend/js/representation-controls.js`.

## Format de sortie

Répondre en français, avec un bloc copiable en anglais :

```text
[Type] realistic editorial photography.
[Sujet] precise subject, age, visible action, expression, clothing.
[Composition] framing, angle, spatial relations, background.
[Lumière] light source, direction, contrast, time of day.
[Texture] visible materials, surfaces, fabrics, walls, objects.
[Texte] typography is outside the requested composition.
Visual anchor: positive visible constraints for subject, decor, alphabet, palette and style.
```

Si un texte doit apparaître dans l'image, le garder exact et entre guillemets :

```text
[Texte] exact French text in Latin alphabet, accents preserved: "TEXTE À RENDRE".
```

## Règles MLX

Le backend MLX actuel d'Ernie Studio n'expose pas :

- `negative_prompt` ;
- `guidance_scale` ;
- `use_pe`.

Les contraintes doivent donc être formulées positivement dans le prompt principal ou dans `Visual anchor:`.

Ne pas écrire une liste négative du type `no Chinese characters, no pagoda, no anime`. Préférer :

```text
Visual anchor: Paris Haussmann apartment, Latin alphabet books and sheet music, European domestic furniture, realistic editorial photography, warm window daylight.
```

## Formulation utilisateur recommandée

Version courte :

```text
Fais un prompt image pour ERNIE Studio en appliquant les skills prompt-image puis ernie-image. Lis les SKILL.md concernés avant de répondre. Sujet : femme de 50 ans qui joue du ukulélé dans un appartement parisien.
```

Version complète :

```text
Utilise les skills locaux dans cet ordre :
1. /Users/alex/Claude/.claude/skills/prompt-image/SKILL.md pour structurer l'idée en prompt image, avec --gen ernie.
2. /Users/alex/Claude/.claude/skills/ernie-image/SKILL.md et sa REFERENCE.md pour adapter le prompt à ERNIE Studio / MLX.
3. /Users/alex/Claude/.claude/skills/ernie-studio-presets/SKILL.md seulement pour vérifier si un preset Ernie Studio est pertinent ; sinon indique N/A.

Idée image : femme de 50 ans jouant du ukulélé dans un appartement parisien.
Sortie attendue : prompt final ERNIE en blocs [Type], [Sujet], [Composition], [Lumière], [Texture], [Texte], avec Visual anchor, sans negative_prompt.
```

## Exemple

```text
[Type] realistic intimate editorial photography.
[Sujet] a 50-year-old woman playing a ukulele in a Parisian apartment, natural mature facial features, calm focused expression, relaxed seated posture, contemporary elegant casual clothing, hands placed naturally on the ukulele strings and neck.
[Composition] medium portrait framing, eye-level camera, the woman slightly off-center, ukulele clearly visible, Parisian living room depth behind her, tall French windows and a small wrought-iron balcony visible in the background.
[Lumière] warm afternoon window daylight from the side, soft natural contrast, gentle shadows on the face and instrument.
[Texture] natural skin texture, polished wooden ukulele, herringbone oak parquet floor, white Haussmann wall mouldings, marble fireplace, linen fabric, books and sheet music on a nearby table.
[Texte] typography is outside the requested composition.
Visual anchor: contemporary Paris Haussmann apartment, tall French windows, wrought-iron balcony, white moulded walls, marble fireplace, herringbone oak parquet, European domestic furniture, Latin alphabet books and sheet music, realistic editorial photography, natural mature adult woman around 50 years old, visible ukulele, warm window daylight.
```

## Vérification finale

- Le prompt commence par le type d'image et le sujet.
- Les concepts abstraits sont traduits en détails visibles.
- Les contraintes sont positives.
- Aucun faux paramètre MLX n'est conseillé.
- Le `Visual anchor:` est présent.
- Les tests comparatifs utilisent la même seed, le même format et le même nombre d'étapes.
