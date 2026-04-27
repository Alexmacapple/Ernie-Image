# Exploration lexicale : « minimal ink sketch »

**Date** : 2026-04-14
**Contexte** : style graphique d'encrage minimaliste pour prompts de génération d'image (Nano Banana 2)
**Image source** : illustration encre noire sur papier crème, trait gestuel, aplats noirs, hachures légères

---

## Mouvement 1 — Cartographie des registres

| # | Terme | Langue | Registre | Attestation | Apport différentiel | Exemple de prompt |
|---|-------|--------|----------|-------------|---------------------|-------------------|
| 1 | **ink wash** | Anglais | Courant | [attesté] | Active les dégradés d'encre diluée (lavis), pas le trait sec — introduit la valeur tonale | « ink wash portrait, single figure, diluted black ink pooling in shadow areas, cream paper » |
| 2 | **gestural drawing** | Anglais | Technique | [attesté] | Force le modèle à produire un trait rapide, confiant, capturant le mouvement — pas un contour patient | « gestural drawing, bold confident strokes capturing motion, black ink on warm paper, unfinished edges » |
| 3 | **sumi-e** (墨絵) | Japonais | Étranger | [attesté] | Peinture à l'encre japonaise : le vide EST le sujet. Active le ma (間), l'espace négatif comme élément actif | « sumi-e style, black ink on rice paper, breath between strokes, vast negative space, single subject » |
| 4 | **line weight variation** | Anglais | Technique | [attesté] | Cible la modulation épaisseur du trait (épais→fin) qui donne vie et hiérarchie au dessin | « varying line weight, thick bold contours tapering to thin scratchy hatching, black ink sketch » |
| 5 | **crosshatching** | Anglais | Technique | [attesté] | Hachures croisées pour le volume — méthode de valeur sans lavis, purement linéaire | « crosshatched ink illustration, volume built from layered directional lines, no wash, pen on paper » |
| 6 | **sgraffito** | Italien | Étranger | [attesté] | Technique de grattage dans la matière — active les textures rugueuses et les traits arrachés | « sgraffito ink style, scratched lines revealing paper beneath, raw textured strokes, monochrome » |
| 7 | **Tuschzeichnung** | Allemand | Étranger | [attesté] | Dessin à l'encre de Chine — connote la tradition graphique européenne (Dürer, Rembrandt), plus structuré que le sketch | « Tuschzeichnung, European ink drawing tradition, precise yet expressive, black India ink on toned paper » |
| 8 | **drybrush** | Anglais | Technique | [attesté] | Pinceau presque sec raclant le papier — produit des traits cassés, texturés, granuleux, pas fluides | « drybrush ink technique, broken textured strokes, bristle marks visible, sparse black on off-white » |
| 9 | **monochrome gouache sketch** | Anglais | Technique | [attesté] | Ajoute l'opacité au noir — aplats plus denses et mats que l'encre transparente | « monochrome gouache sketch, opaque black flat fills, matte finish, cream paper ground showing through » |
| 10 | **calligraphic stroke** | Anglais | Soutenu | [attesté] | Trait de plume/pinceau avec attaque et levée — chaque ligne a un début, un corps et une fin expressifs | « calligraphic ink strokes, each line with deliberate attack and lift, brush pen on textured paper » |
| 11 | **wabi-sabi** (侘寂) | Japonais | Étranger/philosophique | [attesté] | Esthétique de l'imperfection et de l'inachevé — active le beau dans le brut, le cassé, le minimal | « wabi-sabi ink sketch, beauty in imperfection, incomplete lines, raw unfinished edges, worn paper » |
| 12 | **scratchy pen** | Anglais | Courant | [attesté] | Plume qui accroche le papier — grattement, micro-ruptures dans le trait, texture nerveuse | « scratchy pen drawing, nib catching paper grain, jittery organic lines, black ink, cream background » |
| 13 | **editorial illustration** | Anglais | Technique | [attesté] | Style presse/magazine — économie narrative, une idée = une image, dessin au service du sens | « editorial illustration style, confident minimal ink, storytelling through gesture, black and cream » |
| 14 | **xieyi** (写意) | Chinois | Étranger | [attesté] | « Écrire l'intention » — peinture chinoise de l'idée, pas de la forme. L'essence prime sur la ressemblance | « xieyi freehand ink painting, capturing spirit not likeness, bold spontaneous brushwork, minimal strokes » |
| 15 | **chiaroscuro** | Italien | Soutenu | [attesté] | Contraste dramatique lumière/ombre — force les aplats noirs massifs contre le papier clair | « chiaroscuro ink drawing, dramatic contrast, large solid black areas against bare cream paper, no midtones » |
| 16 | **hatching** | Anglais | Courant | [attesté] | Hachures simples (une direction) — plus aéré et rapide que le crosshatching | « loose hatching, single-direction parallel lines for shading, quick ink sketch, visible paper grain » |
| 17 | **sfumato linéaire** | Français/Italien | Savant | [construction proposée] | Bords qui se dissolvent dans le papier — pas de contour fermé, la forme émerge du flou des traits | « sfumato line edges dissolving into paper, no hard outlines, form emerging from clustered ink strokes » |

**Bilan** : 17 termes, 6 langues (anglais, japonais, allemand, italien, chinois, français), distribution : 4 courant/soutenu, 5 technique, 5 étranger, 3 savant/philosophique

---

## Mouvement 2 — Pépites rares

- **Xieyi** (写意, chinois) : littéralement « écrire l'intention ». Là où *sumi-e* active le vide, xieyi active la **spontanéité intentionnelle** — chaque coup de pinceau capture l'esprit du sujet, pas son apparence. Pour un modèle d'image, ça pousse vers des traits moins nombreux mais chacun porteur de sens. Prompt : « xieyi freehand ink, three strokes that capture the whole gesture, spirit over accuracy, black on cream »

- **Drybrush** (anglais) : technique où le pinceau presque à sec racle la surface. Le résultat est un trait **cassé, granuleux, qui montre la texture du papier à travers l'encre**. C'est exactement ce qu'on voit dans l'image source — les zones où le noir n'est pas uniforme mais strié. Prompt : « drybrush ink strokes, broken bristle texture, paper grain visible through black, raw and tactile »

- **Wabi-sabi** (侘寂, japonais) : l'esthétique de l'imperfection assumée. Ce n'est pas « mal dessiné » — c'est la beauté **dans** l'inachevé, le trait qui ne ferme pas son contour, le bord qui s'effiloche. Active un registre que « loose » ou « sketchy » n'atteint pas : la **dignité du brut**. Prompt : « wabi-sabi ink drawing, noble imperfection, lines that know when to stop, unfinished is complete »

- **Sgraffito** (italien) : le grattage dans la matière. Inverse la logique du dessin (ajouter de l'encre) en enlevant — les traits semblent **arrachés** au papier, pas déposés. Active une texture agressive et tactile. Prompt : « sgraffito ink style, lines scratched into surface, raw torn texture, black revealing cream beneath »

---

## Mouvement 3 — Graines de prompts

Fragments directement insérables comme préfixe de style dans Nano Banana 2 :

- « **xieyi freehand ink, spirit over likeness**, bold spontaneous brushwork, minimal strokes on warm cream paper, vast negative space, each line carries the whole gesture »

- « **drybrush sumi-e on toned paper**, broken textured strokes with visible bristle marks, varying line weight from bold contours to scratchy hatching, wabi-sabi imperfection, unfinished edges dissolving into paper »

- « **gestural chiaroscuro ink sketch**, large solid black fills against bare off-white ground, calligraphic stroke with deliberate attack and lift, crosshatched shadows, editorial illustration economy, monochrome »

- « **scratchy pen editorial drawing, sgraffito texture**, nib catching paper grain, jittery organic lines tapering from thick to hairline, no color, cream paper visible through drybrush passages, sfumato edges »

- « **wabi-sabi ink wash**, beauty in the incomplete, confident lines that know when to stop, pooling black ink and bare paper in equal measure, minimal gestural, warm off-white ground »

---

*Exploration produite par /lexique-precis — outil d'exploration créative, pas référence lexicographique. Termes marqués [construction proposée] à vérifier avant usage formel.*
