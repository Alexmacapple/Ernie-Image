# Qwen-Image 2.0 : guide de prompting pour le skill `/prompt-image`

Sources : [blog Qwen-Image 2.0](https://qwen.ai/blog?id=qwen-image-2.0), 7 février 2026 | Documenté pour le skill `/prompt-image` et `/qwen-image`.

---

## Structure du prompt : les 7 règles

Chaque prompt Qwen-Image 2.0 doit respecter ces 7 règles, dans cet ordre. Le skill applique ces règles lors de la génération et la vérification.

### Règle 1 : Sujet d'abord

Toujours commencer par le sujet principal de l'image, avant l'environnement ou les détails.

| Cas | BON | MAUVAIS |
|-----|-----|---------|
| Paysage | `A golden eagle soaring above snow-capped peaks...` | `Under a clear sky, soaring, an eagle appears...` |
| Scène intérieure | `A 20-year-old Asian woman working at a cafe...` | `In a busy cafe, a woman sits...` |
| Objet | `A futuristic sports car parked under neon lights...` | `Neon lights reflect on a car's hood...` |

### Règle 2 : Du général au spécifique

Progresser du contexte large vers les détails fins : sujet → environnement → style → détails de vêtements, accessoires, textures.

| Étape | Exemple |
|-------|---------|
| Sujet général | A woman in a cafe |
| Environnement | modern minimalist cafe, plants in the window |
| Ambiance | warm afternoon light, wooden tables |
| Détails | She wears a cream linen shirt, small gold necklace, reading a book |
| Style final | Illustration style, soft watercolor aesthetic, editorial composition |

MAUVAIS : `Pink ribbons, lace details on her dress, in a cafe` — saute du détail au contexte.

### Règle 3 : Texte entre guillemets simples

Tout texte à rendre dans l'image (pancarte, livre, t-shirt, affiche) doit être entre **guillemets simples** et transcrit exactement.

| Cas | BON | MAUVAIS |
|-----|-----|---------|
| Pancarte | `...a wooden sign reading 'Qwen Coffee $2'` | `...a sign with a coffee menu` |
| Couverture de livre | `Book cover: 'The LLM Council' in serif font` | `A book about the LLM Council` |
| T-shirt | `A t-shirt with text 'AI Powers Us'` | `A t-shirt with an AI message` |

**Important** : les guillemets simples (') ne les doubles guillemets (") — ceci évite les interférences de parsing.

### Règle 4 : Contraintes négatives explicites

Décrire ce qu'il **ne faut PAS** générer ou modifier. Essentiel en mode édition (image-to-image) et en compositions multi-éléments.

| Contexte | Contrainte |
|----------|-----------|
| Édition : garder la photo telle quelle | `Do not change any real buildings, roads, vehicles, or pedestrians.` |
| Texte : éviter la distorsion | `Do not distort, mirror, or repeat the text.` |
| Composition multi-personnages | `Do not merge or overlap the three characters.` |

MAUVAIS : (rien) — laisser le modèle deviner quoi préserver.

### Règle 5 : Relations spatiales

Décrire explicitement les positions relatives des éléments entre eux — indispensable si plus de 2 éléments.

| Cas | BON | MAUVAIS |
|-----|-----|---------|
| 3 chats sur un toit | `...one perched on the roof edge, one peeking from the right side, one sitting on the plaza below.` | `...three characters around the building.` |
| Poster avec texte et images | `Title centered at the top, timeline with 4 nodes below, footer tips at the bottom.` | `A poster with title and timeline.` |
| BD 4 cases | `Top row: two panels side-by-side. Bottom row: one wide panel spanning two columns.` | `A comic with 4 panels.` |

### Règle 6 : Suffixes qualité

Terminer le prompt par des descripteurs techniques de rendu. Les suffixes dépendent du style visuel (voir section *Suffixes et qualificateurs* ci-dessous).

| Style | Suffixes recommandés |
|-------|---------------------|
| Photo réaliste | `Ultra HD, 4K, cinematic composition, natural lighting, shallow depth of field` |
| Illustration | `highly detailed illustration, vibrant colors, clean lines, professional artwork` |
| Design graphique | `clean layout, professional typography, aligned baselines, consistent spacing, Ultra HD` |

### Règle 7 : Style vs contenu séparés

Distinguer clairement le **comment** (style) du **quoi** (contenu). Essentiel quand le style est mixte.

| Cas | BON | MAUVAIS |
|-----|-----|---------|
| Mélange photo + dessin | `Keep the base photo photorealistic; add cartoon characters that look like a mural.` | `A cartoon-realistic mixed scene` |
| Édition : ajouter texte calligraphique | `Background: photorealistic city. Text: traditional Chinese calligraphy in gold ink.` | `A modern city with ancient calligraphy` |

---

## Exemples qui marchent

### Exemple 1 : Chat au coucher du soleil (Niveau 1)

**Idée brute** : Un chat sur un toit au coucher du soleil.

**Prompt généré** :
```
A ginger cat sitting on a tiled rooftop, golden sunset sky with warm orange
and pink clouds, soft evening light casting long shadows, Ultra HD, 4K,
cinematic composition.
```

**Résultat attendu** : Chat roux, toit réaliste, ciel de coucher de soleil avec couleurs chaudes, éclairage doré. Composition cinématique.

**Conformité aux 7 règles** : ✓ Sujet d'abord (chat) | ✓ Général→spécifique (chat → toit → ciel → lumière) | N/A Texte | N/A Contraintes | N/A Spatial | ✓ Suffixes | N/A Style mixte

---

### Exemple 2 : Affiche café avec texte (Niveau 2)

**Idée brute** : Affiche d'un café, avec un prix et un menu simple.

**Prompt généré** :
```
A vintage wooden cafe sign, horizontally mounted on a whitewashed wall.
The sign reads 'Qwen Coffee $2 per cup' in hand-painted black letters.
Below the text, a small illustration of a steaming coffee cup. Warm
morning light, slightly weathered wood texture, Ultra HD, professional
product photography.
```

**Résultat attendu** : Panneau en bois vintage, texte lisible et précis, ambiance artisanale, bonne lisibilité du prix et de la marque.

---

### Exemple 3 : Timeline PPT (Niveau 3)

**Idée brute** : Diapo PowerPoint avec une timeline visuelle et 4 nœuds représentant des étapes.

**Prompt généré** :
```
A single PPT slide with dark blue gradient background. Centered at the top:
large bold white title reading 'Qwen-Image 2.0 Highlights'. Below: a glowing
timeline with 4 circular nodes, each containing a short label: 'Precision',
'Complexity', 'Aesthetics', 'Alignment'. Labels in clean sans-serif font,
aligned baselines, generous spacing. Subtle connector lines between nodes.
Use consistent typography throughout. Ultra HD, 4K, professional digital
design, editorial aesthetic.
```

**Résultat attendu** : Diapo lisible, titre en évidence, 4 nœuds distincts et alignés, couleurs cohérentes, typographie professionnelle.

---

### Exemple 4 : Poster de voyage Hangzhou (Niveau 4)

**Idée brute** : Poster de voyage Hangzhou, style main-levée, 2 jours de visite avec temples, thé et lac.

**Prompt généré** (extrait simplifié) :
```
A hand-drawn style poster of a two-day spiritual journey to Hangzhou,
China. Soft cream and aged paper background with traditional corner
decorative borders. Central flowing silk ribbon connecting two days of
itinerary. Top title in Chinese calligraphy (kaishu): '杭州·两日禅意人文之旅'
(English subtitle: 'Hangzhou: A Two-Day Journey of Zen, Culture, and
Humanity'). Left column: Day 1 events: 07:30 arrive at Lingyin Temple
[with ink drawing of temple gate], 10:30 Yongfu Temple serenity [ancient
temple among trees], 12:00 vegetarian meal [steaming noodle bowl on bamboo
tray], 16:00 Longjing tea tasting [layered tea fields and purple clay pot
pouring into celadon cup]. Right column: Day 2 events: 09:00 West Lake boat
tour [black-hulled boat with Three Pagodas reflection], 12:00 lakeside lunch
[red-glazed fish on white plate], 14:00 Su Causeway [arched bridge over blue
water, weeping willows]. Bottom: 'Travel Tips' section with three icons and
brief guidance. All text in traditional Chinese calligraphy style (kaishu),
Chinese and English text properly aligned and balanced. Overall composition:
spacious, poetic, infused with literary painting aesthetics and zen living
philosophy. Ultra HD, traditional ink painting atmosphere, editorial
composition.
```

**Résultat attendu** : Affiche bilingue cohérente, éléments visuels distincts pour chaque lieu, calligraphie lisible, équilibre spatial, atmosphère zen.

---

## Exemples qui échouent

### Exemple 1 : Sujet trop tardif (Règle 1 violée)

**Prompt** :
```
Under neon lights, with reflections on wet streets, in a futuristic city,
with advanced technology everywhere, parked is a sports car.
```

**Problème** : Le sujet (sports car) arrive trop tard. Le modèle privilégie le contexte et produit une image de rue neon générique avec un petit véhicule au second plan, au lieu d'une voiture en gros plan.

**Correction** :
```
A futuristic sports car, photorealistic, parked under neon city lights,
reflections on wet streets, cinematic lighting, Ultra HD, 4K.
```

---

### Exemple 2 : Texte sans guillemets (Règle 3 violée)

**Prompt** :
```
A wooden sign with a coffee menu and prices and the word Qwen prominently displayed.
```

**Problème** : Le texte n'est pas entre guillemets. Le modèle génère du texte aléatoire, illisible ou inexacte.

**Correction** :
```
A wooden sign reading 'Qwen Coffee $2 per cup' with hand-painted black letters.
```

---

### Exemple 3 : Pas de contrainte négative en édition (Règle 4 violée)

**Prompt (édition, image source : photo d'une rue)** :
```
Add a red vintage car parked in front of the cafe.
```

**Problème** : Le modèle peut modifier le bâtiment, enlever des panneaux, changer les couleurs ou la perspective — l'image source n'est pas protégée.

**Correction** :
```
Add a red vintage car parked in front of the cafe on the right side. Do not
change any real buildings, roads, pedestrians, or existing elements. Keep
the photo's perspective, lighting, and color grading identical.
```

---

## Capacités du modèle : tableau structuré

| Capacité | Faible | Moyen | Fort | Notes |
|----------|--------|-------|------|-------|
| **Personnages** | 0-1 | 2-3 | 4-6 optimal | Au-delà de 6 : risque d'incohérence ou de fusion |
| **Texte** | Pas de texte, ou < 5 mots | 5-20 mots lisibles | 20-100 mots, multiligne | Toujours entre guillemets ; limite recommandée 100 mots |
| **Mains** | Déformées, fusionnées | Partiellement correctes, quelques doigts mal formés | Anatomiquement correctes, gestes naturels | Mention explicite de « hands with visible fingers » aide |
| **Layout/grille** | Cas simple | Grille 2×2 ou timeline | Grille 4+ cellules ou composition complexe | Décrire chaque position explicitement |
| **Perspective** | Avant/arrière flou | Perspective à 1 point, profondeur simple | Perspectives multi-points, profondeur cinématique | Nommer le type de caméra aide |
| **Cohérence style** | Styles mélangés involontairement | Style global stable, détails mineurs variables | Style très stable, tous les éléments cohérents | `prompt_core` en tête garantit cohérence |
| **Calligraphie chinoise** | Caractères approximatifs | Caractères reconnaissables | Caractères précis, style calligraphique fiable | Nommer le style (瘦金体, 楷体, etc.) |
| **Picture-in-picture** | Non supporté | Sous-images mal alignées | Sous-images distinctes et alignées | Décrire chaque cellule/frame séparément |

---

## Faiblesses connues

1. **Fusion d'éléments** : Quand trop de personnages ou d'objets, risque de fusion ou de chevauchement involontaire. **Mitigation** : décrire les positions spatiales explicitement (règle 5)

2. **Texte en miroir ou répété** : Le texte peut apparaître inversé ou dupliqué par erreur. **Mitigation** : ajouter contrainte négative `Do not mirror or repeat text`

3. **Doigts et mains** : Déformation classique des mains. **Mitigation** : ajouter explicitement `hands with visible fingers` et/ou constraint `Do not distort hands`

4. **Calligraphie chinoise approximative** : Les styles calligraphiques chinois moins connus peuvent être approximatifs. **Mitigation** : utiliser seulement les styles répertoriés (section *Styles calligraphiques et typographiques*), ou se contenter d'illustration plutôt que de calligraphie précise

5. **Perspective instable** : En compositions très complexes (40+ éléments), risque de distorsion perspective. **Mitigation** : limiter à 20-30 éléments max, décrire une perspective unique

6. **Surcharge de suffixes** : Trop de suffixes qualité peuvent créer des artefacts. **Mitigation** : limiter à 5-7 suffixes max

7. **Ambiguïté contexte** : Si sujet et environnement entrent en conflit, le modèle peut favoriser l'un ou l'autre. **Mitigation** : clarifier la hiérarchie avec la règle 7 (style vs contenu séparé)

---

## Stratégie du prompt négatif

Qwen-Image 2.0 supporte un prompt négatif explicite pour tous les modes (génération et édition). Le prompt négatif liste ce qu'il faut **absolument éviter**.

### Template universel (anglais)

```
low resolution, low quality, deformed limbs, deformed fingers, oversaturated,
waxy skin, faceless, overly smooth, AI-looking, cluttered composition, blurry
text, distorted text
```

Ajouter selon le contexte :
- **Édition** : `morphed or edited original elements, changed lighting, altered perspective`
- **Texte** : `misspelled text, unreadable text, text in wrong direction`
- **Personnage** : `awkward pose, unnatural expression, wrong anatomy`

### Template universel (chinois)

```
低分辨率，低画质，肢体畸形，手指畸形，画面过饱和，蜡像感，人脸无细节，过度光滑，
画面具有AI感，构图混乱，文字模糊，扭曲
```

Ajouter selon le contexte :
- **Édition** : `修改原始元素，改变光照，改变视角`
- **Texte** : `拼写错误的文本，不可读的文本，错误方向的文本`
- **Personnage** : `姿势尴尬，表情不自然，解剖学错误`

**Utilisation** : injérer le prompt négatif dans le paramètre `negative_prompt` de l'API.

---

## Suffixes et qualificateurs

Les suffixes terminent chaque prompt (Règle 6). Ils spécifient le rendu final souhaité. Les 7 catégories ci-dessous couvrent la plupart des usages.

### 1. Photoréalisme

```
Ultra HD, 4K, cinematic composition, natural lighting, shallow depth of field,
photorealistic, professional photography
```

**Usages** : portraits, paysages, scènes de vie quotidienne.

### 2. Illustration généraliste

```
highly detailed illustration, vibrant colors, clean lines, professional artwork,
digital painting, illustration style
```

**Usages** : éditorial, livres jeunesse, illustrations conceptuelles.

### 3. Design graphique / editorial

```
clean layout, professional typography, aligned baselines, consistent spacing,
Ultra HD, editorial design, graphic design
```

**Usages** : affiches, posters, slides, infographies.

### 4. Rendu 3D

```
3D render, octane render, volumetric lighting, ray tracing, 8K resolution,
professional 3D modeling
```

**Usages** : visualisations architecturales, prototypes produit.

### 5. Encre chinoise (水墨)

```
中国古典水墨长卷风格, 绢本设色, 色调清丽雅致, 极简留白水墨意境, 传统笔法
```

**Usages** : posters de voyage culturel, illustrations calligraphiques, art traditionnel chinois.

### 6. Gongbi (工笔 — peinture fine chinoise)

```
宋代宫廷风格工笔重彩画, 设色清丽, 纹理细腻, 传统东方美学, 细致笔法
```

**Usages** : illustrations de contes, art classique chinois, détail et délicatesse.

### 7. Flat design / illustration style

```
扁平化图形风格, 轮廓清晰, 类似壁画或海报插图, 几何简洁, 色块鲜明
```

**Usages** : affiches modernes, design UI, illustrations contemporaines.

---

## Limites de tokens par niveau

La limite technique est 1000 tokens sans dégradation. Les maximums recommandés par niveau visent à garantir un rendu stable :

| Niveau | Max tokens recommandé | Caractère | Usages typiques |
|--------|----------------------|-----------|-----------------|
| 1 | 50-100 | Simple, direct | Concepts basiques, single-subject |
| 2 | 100-200 | Structuré, contexte | Scènes avec style et environnement |
| 3 | 200-400 | Détaillé, passe de vérification | Designs graphiques, compositions précises |
| 4 | 400-800 | Étendu, avec expansion LLM | Posters, briefs visuels, compositions ultra-détaillées |

**Dépassement** : si un prompt dépasse le max après simplification, signaler à l'utilisateur : "Prompt de X tokens, max recommandé Y — le rendu peut devenir instable. Considérer simplification ou niveau inférieur."

---

## Paramètres techniques recommandés

### Génération standard

| Paramètre | Brouillon | Rendu final | Notes |
|-----------|-----------|-------------|-------|
| `steps` | 20-30 | 50 | Plus de steps = plus de détails, plus lent |
| `cfg_scale` | 2.5 (créatif) | 4.0-5.0 (équilibre) | 10 = strict, adhérence maximale au prompt |
| `true_cfg_scale` | — | 4.0 | Recommandé par guide officiel |
| Résolution | 1024×1024 | 2048×2048 | Résolution native 2K du modèle |

### Mode édition (image-to-image)

| Paramètre | Valeur | Notes |
|-----------|--------|-------|
| `guidance_scale` | 1.0 | Protège l'image source, modifications légères |
| `cfg_scale` | 2.0-3.0 | Plus bas pour ne pas trop dériver |
| `steps` | 30-50 | Édition demande plus d'étapes que génération |

### Ratios d'aspect supportés

| Ratio | Résolution native | Usages |
|-------|-------------------|--------|
| 1:1 | 2048×2048 | Portraits, icônes, Instagram |
| 16:9 | 2048×1152 | Paysages, bannières web, cinématique |
| 9:16 | 1152×2048 | Stories, posters verticaux |
| 4:3 | 2048×1536 | Présentations, PPT, infographies |
| 3:4 | 1536×2048 | Posters de film, couvertures livres |
| 3:2 | 2048×1365 | Photographie classique |
| 2:3 | 1365×2048 | Affiches de voyage, posters |

---

## Choix de la langue

Le modèle est nativement bilingue anglais/chinois de qualité comparable. Le choix dépend du contenu et du contexte :

| Contenu | Langue | Raison |
|---------|--------|--------|
| Scènes génériques, photoréalisme | Anglais | Large corpus d'entraînement, rendu stable |
| Contenu culturel chinois | Chinois | Connaissance du monde culturel plus riche |
| Calligraphie chinoise | Chinois | Indispensable pour nommer les styles exacts (瘦金体, 楷体, etc.) |
| Infographies bilingues | Chinois | Gère le bilingue nativement, alignement text + layout |
| BD/comics avec dialogues chinois | Chinois | Bulles de dialogue plus naturelles |
| Posters chinoises, affiches de film | Chinois | Typographie et layout culturellement adaptés |
| Sauf spécification, style guide par projet | Selon guide | Respecter la langue définie dans `style-guide.json` |

**Défaut du skill** : si la langue n'est pas explicitement spécifiée, utiliser l'anglais pour les scènes génériques, le chinois pour le contenu culturel chinois.

---

## Architectures et forces techniques

### Architecture du modèle

```
Input: Prompt texte (jusqu'à 1000 tokens)
  ↓
[8B Qwen3-VL Encoder] → Représentation sémantique
  ↓
[7B Diffusion Decoder] → Génération d'image
  ↓
Output: Pixels (résolution 2K native)
```

Modèle plus léger que les générations précédentes, inférence plus rapide.

### Les 5 forces (准/多/美/真/齐)

| Force | Chinois | Implication pour le prompt |
|-------|---------|---------------------------|
| Précision | 准 | Texte rendu fidèlement sur toute surface → spécifier texte exact entre guillemets |
| Complexité | 多 | Prompts jusqu'à 1000 tokens sans dégradation → n'hésiter pas à être détaillé (niveau 4) |
| Esthétique | 美 | Composition texte + image harmonieuse → modèle place le texte dans zones vides |
| Réalisme | 真 | Texte réaliste sur verre, tissu, magazines → décrire le support physique du texte |
| Alignement | 齐 | Grilles, calendriers, BD : alignement précis → décrire chaque cellule explicitement |

---

## Capacités avancées

### Picture-in-picture

Compositions contenant des sous-images (image dans image) : slides avec photos intégrées dans une timeline, BD avec cases distinctes, poster avec vignettes.

**Stratégie** : décrire explicitement chaque sous-image et sa position dans la composition.

Exemple :
```
A 2x2 grid of four distinct scenes. Top-left: a library interior. Top-right:
a cafe. Bottom-left: a temple. Bottom-right: a mountain lake. Each scene
should be a complete, self-contained illustration in the same style. Ensure
clear borders between the four panels.
```

### Styles calligraphiques chinois reconnus

| Style | Chinois | Formellement connu comme |
|-------|---------|--------------------------|
| Fine elegance (Empereur Huizong) | 瘦金体 | Thin Gold Script |
| Kaishu classique (Zhao Mengfu) | 赵孟頫楷书 | Zhao Mengfu Kaishu |
| Petit kaishu (Wang Xizhi) | 王羲之小楷 | Wang Xizhi Small Kaishu |
| Cursive élégante | 行书 | Xingshu/Semi-cursive |
| Écriture dure moderne (Tian Yingzhang) | 田英章硬笔 | Tian Yingzhang Hard-pen |
| Kaishu standard / lisible | 楷体书法 | Standard Kaishu |

**Recommandation** : utiliser seulement les styles précis ci-dessus. Pour les autres styles, décrire l'effet désiré en anglais ou vérifier que le modèle peut le générer via test préalable.

### Texte multi-surface

Le modèle rend du texte réaliste sur différentes surfaces physiques :

- **Tableau blanc en verre** : reflets, transparence, tracés visibles
- **Vêtements** (t-shirt, uniforme) : plis du tissu, déformation naturelle
- **Couvertures de magazines** : mise en page éditoriale, bords nets
- **Enseignes et panneaux** : matériaux (bois, néon, pierre), usure
- **Papier/parchemin** : texture, encre, calligraphie

**Utilisation** : toujours mentionner le support physique.

Exemple :
```
A white glass whiteboard with the text 'Qwen-Image 2.0' written in black
marker, with visible light reflections on the glass surface.
```

### Modes d'édition (image-to-image)

**3 types** : mono-image (modifier une seule image existante), multi-images (combiner 2+ images), cross-dimensionnel (mélanger photo réaliste et illustration).

**Règles spécifiques** :
1. **Contraintes négatives renforcées** (règle 4) : toujours préciser ce qui ne doit PAS changer
2. **Style de chaque couche clairement séparé** (règle 7) : `Keep the base photo photorealistic; characters look like a mural illustration`
3. **`guidance_scale: 1.0`** recommandé pour préserver l'image source

---

## Documentation du skill `/prompt-image`

Ce fichier est partagé par deux skills : `/prompt-image` et `/qwen-image`.

**`/prompt-image`** : skill généraliste qui accepte tout générateur (Qwen, Flux, Midjourney, etc.). Utilise ce fichier comme référence technique pour les prompts Qwen.

**`/qwen-image`** : skill spécialisé Qwen-Image 2.0 + Wan 2.6. Utilise ce fichier comme source de vérité pour tous les paramètres et règles.

Toute modification à ce fichier s'applique aux deux skills et ne doit pas être dupliquée dans leurs SKILL.md respectifs.

---

