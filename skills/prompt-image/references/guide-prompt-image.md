# Guide utilisateur : /prompt-image

Transformer une idee brute en prompt image optimise, pret a copier-coller dans un generateur d'images.

**Version skill** : 1.2.0
**Date** : 27 avril 2026

---

## A quoi sert ce skill ?

`/prompt-image` est un pipeline de raffinement progressif. Il prend une description en francais (« un chat sur un toit au coucher de soleil ») et produit un prompt en anglais, structure et optimise pour un generateur d'images specifique.

Le skill fait tout le travail interne (analyse, decomposition en 10 cles, enrichissement, verification) et ne montre que le resultat final : un prompt positif pret a coller, un prompt negatif si le generateur le supporte, une checklist de conformite et un score qualite.

---

## Demarrage rapide

### Commande minimale

```
/prompt-image Un chat roux assis sur un toit au coucher de soleil
```

Le skill detecte automatiquement :
- **Generateur** : Nano Banana 2 (defaut)
- **Niveau** : 1 (concept simple)
- **Style** : mode libre (pas de contrainte)
- **Intent** : editorial (defaut)

### Avec options

```
/prompt-image Un chat roux sur un toit --gen qwen --style orbital-fracture --niveau 2 --verbose
```

### Avec ERNIE Studio

```
/prompt-image --gen ernie Affiche mélodrame pop espagnol avec titre français
```

---

## Toutes les options

| Option | Valeurs possibles | Defaut | Description |
|--------|-------------------|--------|-------------|
| *(texte libre)* | n'importe quelle description | *(obligatoire)* | L'idee brute a transformer |
| `--gen` | `nano-banana`, `qwen`, `ernie` | auto-detecte | Generateur cible |
| `--style` | nom de preset ou chemin fichier | auto-detecte | Style guide a appliquer |
| `--intent` | `editorial`, `cover`, `thumbnail`, `hero`, `storytelling`, `infographic` | auto | Contexte d'utilisation de l'image |
| `--niveau` | `1`, `2`, `3`, `4` | auto-detecte | Complexite du prompt |
| `--verbose` | *(flag, pas de valeur)* | false | Affiche les prompts internes (debug) |

---

## Les 3 generateurs

### Nano banana 2 (defaut)

Modele Google generaliste. Choisi par defaut sauf si le concept necessite du texte ou des layouts complexes.

**Structure du prompt** : 5 blocs ordonnes

| Bloc | Contenu | Exemple |
|------|---------|---------|
| 1. Sujet | Quoi ? Elements principaux | « three engineers around a whiteboard » |
| 2. Contexte | Ou ? Lieu, decor, arriere-plan | « bright startup office, large windows » |
| 3. Style | Comment ? Genre, technique, palette | « clean vector illustration, bold strokes » |
| 4. Camera | Cadrage et eclairage | « medium shot, eye-level, soft light » |
| 5. Contraintes | Format, restrictions, mood | « 16:9, energetic mood, no text » |

**Points forts** : portraits, scenes 1-3 personnages, styles illustratifs, termes photo/cinema

**Limites connues** :

| Limite | Seuil | Contournement |
|--------|-------|---------------|
| Personnages | 3 confortables, 5 maximum | Plan large au-dela de 3 |
| Mains | Deformation frequente | Postures simples ou hors-cadre |
| Texte | < 5 mots, souvent deforme | Texte flou ou omis |
| Styles melanges | Incoherence si 2+ styles | Un seul style dominant |
| Prompt negatif | Non supporte | Convertir en formulations positives |

**Limites de tokens** :

| Niveau | Recommande | Maximum |
|--------|-----------|---------|
| 1 | 50-100 | 150 |
| 2 | 100-200 | 300 |
| 3 | 200-400 | 500 |
| 4 | 400-800 | 1000 |

### Qwen-Image 2.0

Modele bilingue anglais/chinois. Recommande pour le texte dans l'image, les layouts structures et les compositions complexes.

**Structure du prompt** : 7 regles

| Regle | Principe | Exemple |
|-------|----------|---------|
| 1 | Sujet d'abord | Toujours commencer par l'element principal |
| 2 | General vers specifique | Sujet, environnement, ambiance, details, style |
| 3 | Texte entre guillemets simples | `'Qwen Coffee $2'` pour du texte a rendre |
| 4 | Contraintes negatives explicites | `Do not change buildings or roads` |
| 5 | Relations spatiales | Decrire les positions relatives des elements |
| 6 | Suffixes qualite | `Ultra HD, 4K, cinematic composition` |
| 7 | Style vs contenu separes | Distinguer le « comment » du « quoi » |

**Points forts** : texte sur toute surface (verre, tissu, enseignes), layouts multi-zones, calligraphie chinoise, picture-in-picture, BD, mode edition image-to-image

**Limites connues** :

| Limite | Seuil | Contournement |
|--------|-------|---------------|
| Personnages | 6 optimal, au-dela fusion | Positions spatiales explicites |
| Texte en miroir | Inversion possible | Ajouter `Do not mirror or repeat text` |
| Mains | Deformation classique | `hands with visible fingers` |
| Surcharge suffixes | Artefacts au-dela de 7 | Limiter a 5-7 suffixes |

**Prompt negatif** : supporte nativement. Template universel :
```
low resolution, low quality, deformed limbs, deformed fingers, oversaturated,
waxy skin, faceless, overly smooth, AI-looking, cluttered composition, blurry text
```

### ERNIE Studio

ERNIE Studio est un cas particulier : `prompt-image` structure d'abord l'idée, puis le skill `ernie-image` adapte le résultat au backend MLX.

**Structure du prompt** :

```
[Type] ...
[Sujet] ...
[Composition] ...
[Lumière] ...
[Texture] ...
[Texte] ...
Visual anchor: ...
```

**Points forts** : exploration locale, portraits simples, affiches et scènes éditoriales quand le prompt verrouille bien les traits, le décor, l'alphabet et la palette.

**Limites actuelles MLX** :

| Limite | Contournement |
|--------|---------------|
| Pas de `negative_prompt` | Convertir les interdictions en formulations positives |
| Pas de `guidance_scale` exposé | Renforcer le prompt et tester à seed fixe |
| Pas de `use_pe` exposé | Écrire un prompt anglais explicite |
| Biais visuel possible sur les portraits et décors | Ajouter un `Visual anchor:` positif |

### Quand choisir l'un ou l'autre ?

| Situation | Generateur recommande |
|-----------|----------------------|
| Portrait, scene simple, illustration editoriale | Nano Banana 2 |
| Texte a rendre dans l'image | Qwen |
| Layout structure (poster, BD, infographie) | Qwen |
| Composition multi-panneaux | Qwen |
| Calligraphie chinoise | Qwen |
| Scene de groupe > 4 personnages | Qwen |
| Style illustratif classique | Nano Banana 2 |
| Cible explicite Ernie Studio ou backend local MLX | ERNIE Studio |
| Correction de biais visuels dans Ernie Studio | ERNIE Studio avec `Visual anchor:` |

---

## Les 4 niveaux de complexite

Le niveau est auto-detecte si `--niveau` n'est pas specifie. Voici l'arbre de decision :

```
Le concept decrit un layout precis (grille, zones) ?
  OUI + texte a rendre --> niveau 4
  OUI sans texte       --> niveau 3
  NON --> type design explicite (poster, couverture, infographie) ?
    OUI --> niveau 3
    NON --> 3+ elements distincts ou style identifiable ?
      OUI --> niveau 2
      NON --> niveau 1
```

| Niveau | Complexite | Longueur prompt | Exemple |
|--------|-----------|----------------|---------|
| 1 | Concept simple, 1-2 elements | 50-100 mots | « un personnage pensif devant une fenetre » |
| 2 | Scene riche, personnages + contexte | 100-200 mots | « reunion de 3 personnes en debat autour d'une table » |
| 3 | Composition structuree, design | 200-400 mots | « poster episode 1 : 3 personnages + titre + decor » |
| 4 | Layout detaille, zones texte, multi-etages | 400-800 mots | « couverture avec bandeau, 5 personnages, credits » |

---

## Les intent (contextes d'utilisation)

L'intent oriente la composition et le cadrage. Auto-detecte si non specifie.

| Intent | Quand l'utiliser | Effet sur le prompt |
|--------|-----------------|---------------------|
| `editorial` | Article, post LinkedIn, illustration generique | Composition equilibree, lisible, professionnelle |
| `cover` | Couverture de magazine, livre, episode | Forte hierarchie, sujet dominant, espace pour titre |
| `thumbnail` | Vignette, miniature, apercu | Maximum de lisibilite a petite taille |
| `hero` | Bandeau web, affiche, poster | Impact visuel fort, composition large |
| `storytelling` | Illustration narrative, BD, feuilleton | Focus sur personnages et emotion |
| `infographic` | Schema, diagramme, visualisation | Clarte, zones definies, hierarchie de lecture |

---

## Le pipeline en detail

Ce que fait le skill entre votre idee et le prompt final :

### Etape 0 : Detection

Le skill detecte automatiquement le generateur, le style guide, le niveau et l'intent. Il annonce la configuration avant de continuer.

### Etape 1 : Analyse (interne)

4 passes de verification :

1. **Fidelite semantique** : l'idee est-elle bien comprise ? Si ambigue, le skill demande une clarification
2. **Traduction visuelle** : conversion des concepts abstraits en elements rendables (« tension » devient « postures rigides, mains serrees »)
3. **Conformite style guide** : verification qu'aucun element ne contredit le style guide charge
4. **Faisabilite generateur** : identification des elements que le generateur gere mal (mains, texte, groupes)

### Etape 2 : Prompt1 (interne, visible avec `--verbose`)

Decomposition du concept en 10 cles fixes :

| Cle | Description |
|-----|-------------|
| `subject` | Sujet principal |
| `action` | Ce que font les sujets |
| `setting` | Lieu et contexte |
| `style` | Genre visuel (verrouille par le style guide) |
| `camera` | Cadrage et angle |
| `lighting` | Sources et qualite de lumiere |
| `color` | Palette (verrouillee par le style guide) |
| `composition` | Arrangement spatial, format |
| `materials` | Materiaux et textures visibles |
| `detail_density` | Hierarchie de details |

### Etape 3 : Prompt2 (interne, visible avec `--verbose`)

Enrichissement du Prompt1 avec details de scene, materiaux, textures, atmosphere et details narratifs. **Regle critique** : aucun nouvel attribut de style n'est introduit a cette etape.

### Etape 4 : Prompt3 et Prompt4 (affiches a l'utilisateur)

- **Prompt3** : prompt positif optimise, formate pour le generateur cible, avec le `prompt_core` du style guide injecte en tete
- **Prompt4** : prompt negatif (Qwen), conversions positives des interdictions (Nano Banana), ou pas de Prompt4 pour ERNIE Studio

### Etape 5 : Exposition

Le skill affiche :
1. La configuration utilisee (style guide, generateur, niveau)
2. Les avertissements de faisabilite
3. Le **Prompt3** dans un bloc code pret a copier
4. Le **Prompt4** dans un bloc code (si applicable)
5. Une **checklist de conformite** (criteres par generateur et style guide)
6. Un **score qualite sur 10** : style + scene + faisabilite
7. **3 options creatives** pour iterer

### Etape 6 : Iteration

Vous pouvez :
- Valider (fin)
- Modifier un parametre : « plus de contraste », « change l'eclairage »
- Changer de generateur : `--gen qwen`
- Passer par Ernie Studio : `--gen ernie`
- Demander une variante : « version plus surréaliste »

Le skill revient a l'etape 4 (ou etape 1 si changement majeur). Maximum 3 iterations.

---

## Comprendre le score qualite

Le score s'affiche sur 3 axes, chacun note de 0 a 10 :

| Axe | Mesure | 10/10 | 5/10 | < 5 |
|-----|--------|-------|------|-----|
| **Style** | Conformite au style guide | prompt_core present, aucune contradiction | prompt_core dilue | prompt_core absent ou viole |
| **Scene** | Traduction visuelle du concept | 100% des elements traduits | 70% traduit | < 50% traduit |
| **Faisabilite** | Capacite du generateur | Aucun risque connu | 1 risque modere | Risques eleves multiples |

**Interpretation** :
- 7+ sur les 3 axes : prompt directement testable
- 5-6 sur un axe : testable mais avec limitations
- < 5 : iterer avant de tester

---

## Mode avec style guide

### Qu'est-ce qu'un style guide ?

Un fichier JSON qui verrouille la direction artistique : genre visuel, contours, couleurs, ombrage, palette, elements a eviter, et surtout le `prompt_core` -- une phrase de 20-50 mots injectee en tete de chaque prompt pour stabiliser le rendu.

Le style guide a **toujours priorite** sur l'enrichissement. Si un element enrichi contredit le style guide, il est supprime.

### Detection automatique

Le skill cherche le style guide dans cet ordre :
1. `--style <nom-preset>` : dans le dossier `presets/` du skill
2. `--style <chemin>` : chemin explicite vers un JSON
3. `style-guide.json` dans le repertoire courant
4. Remontee des repertoires parents jusqu'a `~/Claude/`
5. **Mode libre** si rien trouve (annonce explicite)

### Mode libre (sans style guide)

Aucune contrainte de style. Le skill genere le prompt en se basant uniquement sur le concept, le generateur et le niveau. Utile pour l'exploration creative.

---

## Catalogue des presets

Les presets sont des style guides pre-configures, prets a l'emploi avec `--style <nom>`.

### ligne-claire-plus

**Genre** : Ligne claire franco-belge rehaussee

```
/prompt-image Un detective dans son bureau --style ligne-claire-plus
```

| Aspect | Detail |
|--------|--------|
| Contours | Noirs, poids legerement variable, nets |
| Couleurs | Aplats dominants, ombrage subtil et localise |
| Palette | Base neutre froide + accents chauds (ambre, peau) |
| Fond | Simplifie, jamais en competition avec le sujet |
| Format | 16:9 paysage |
| Interdit | Photorealisme, anime, neon, bulles de dialogue |

**Ideal pour** : feuilletons editoriaux, illustrations LinkedIn, series narratives, contenu professionnel

**Particularites** : contient des templates de composition (table ronde, duo strategique, orateur face au conseil, salle vide), des presets d'eclairage (lumiere du jour, soiree strategie, institutionnel) et des templates de palette par ambiance.

---

### ligne-claire

**Genre** : Ligne claire franco-belge classique

```
/prompt-image Tintin sur la lune --style ligne-claire
```

| Aspect | Detail |
|--------|--------|
| Contours | Noirs epais, poids uniforme, dominants |
| Couleurs | Aplats purs, 4-6 tons par scene |
| Ombrage | Minimal, motif halftone en option |
| Fond | Blanc casse chaud (#F5F0E8) |
| Format | 16:9 |
| Interdit | Photorealisme, 3D, anime |

**Ideal pour** : illustrations retro-modernes, BD franco-belge, affiches narratives

**Difference avec `ligne-claire-plus`** : le classique a des contours plus epais, pas d'ombrage volumetrique, expressions legerement exagerees.

---

### orbital-fracture

**Genre** : Geometrie orbitale fracturee, luminescence chirurgicale, void hostile

```
/prompt-image Un reseau de neurones artificiels --style orbital-fracture
```

| Aspect | Detail |
|--------|--------|
| Fond | Noir hostile (void agressif, pas passif) |
| Geometrie | Arcs orbitaux incomplets, anneaux fractures |
| Lumiere | Ultra-fine, chirurgicale, uniquement aux points de fracture |
| Palette | Monochrome bleu-ardoise + 1 seul accent (or, ambre, teal ou cyan) |
| Composition | Asymetrie legere (60/40), focal compresse contre le vide |
| Format | 16:9 paysage |
| Interdit | Photorealisme, cartoon, cyberpunk, neon, arc-en-ciel |

**Ideal pour** : posters scientifiques, covers tech, visualisations de donnees, branding deeptech

**Concept signature** : chaque image doit contenir au moins un arc incomplet ou un anneau fracture. La lumiere ne depasse jamais l'epaisseur d'un fil SAUF au « strike point » -- un seul point par image ou l'accent brule plus fort, au point de tension maximale.

**Mecaniques de tension disponibles** :
- `rupture` : geometrie qui casse le long de lignes de stress
- `transfer` : impulsion d'energie a travers un noeud de jonction
- `emergence` : nouvelle structure qui se forme depuis un point de fracture
- `collapse` : implosion partielle de segments d'arc vers le coeur
- `resonance` : oscillation repetee a travers des arcs paralleles

**2 modes** : `strict` (serie visuelle, branding) et `relaxed` (editorial, storytelling -- autorise un second accent faible et des figures humaines plus detaillees).

---

### bio-lumina

**Genre** : Bioluminescence organique, architecture vegetale nocturne, pulsation vivante

```
/prompt-image Une terrasse vegetale la nuit --style bio-lumina
```

| Aspect | Detail |
|--------|--------|
| Fond | Noir nocturne chaud (pas hostile) |
| Surfaces | Fibres organiques, feuilles vein-lit, membranes translucides |
| Lumiere | Bioluminescente, emane de l'interieur, jamais projetee |
| Palette | Base noire + cyan/vert aquatique (primaire) + magenta (rare, au pulse) |
| Profondeur | Couches organiques : detail, structure, atmosphere |
| Format | 16:9 paysage |
| Interdit | Cyberpunk, neon electrique, metal, lumiere artificielle, jour |

**Ideal pour** : illustrations nature-tech, covers biotech, visuels nocturnes, branding organique

**Concept signature** : chaque image doit contenir au moins un chemin veineux lumineux. La lumiere croit toujours de l'interieur vers l'exterieur -- jamais projetee. Un seul « pulse point » par image ou la bioluminescence atteint son pic d'intensite.

**Mecaniques de tension** :
- `pulse` : vague d'intensite le long des reseaux veineux
- `growth` : structure organique emergente
- `symbiosis` : deux systemes partageant la lumiere
- `bloom` : explosion de luminescence a un point de convergence
- `fade` : extinction progressive aux bords

---

### flat-design

**Genre** : Illustration vectorielle minimaliste

```
/prompt-image Un dashboard d'analytics --style flat-design
```

| Aspect | Detail |
|--------|--------|
| Contours | Bords nets, outlines fines optionnelles |
| Couleurs | Blocs solides, zero gradient, 4-6 tons |
| Ombrage | Quasi absent, ombre ambiante legere pour la separation |
| Formes | Geometriques arrondies, coins doux |
| Personnages | Silhouettes simplifiees, proportions stylisees |
| Fond | Blanc ou neutre clair |
| Format | 16:9 |
| Interdit | Photorealisme, 3D, eclairage cinematique, textures |

**Ideal pour** : slides, infographies, dashboards, illustrations corporate, icones, onboarding

**Templates de composition** :
- `hero_central` : sujet centre, espace negatif genereux
- `side_by_side` : deux elements face a face (comparaison, collaboration)
- `dashboard_infographic` : grille modulaire 2x2 ou 3x3
- `process_flow` : etapes sequentielles gauche-droite
- `icon_grid` : grille reguliere d'icones uniformes

**Personnalites de marque** : 4 variantes de ton disponibles
- `playful_tech` : coins arrondis, couleurs vives, expressions dynamiques
- `serious_fintech` : angles plus nets, palette sombre, poses formelles
- `friendly_productivity` : formes douces, pastels, poses detendues
- `educational_platform` : hierarchie claire, palette chaude, poses explicatives

---

### flat-design-spectrum

**Genre** : Variante du flat-design avec palettes etendues

```
/prompt-image Un workflow collaboratif --style flat-design-spectrum
```

Identique au `flat-design` mais autorise des palettes etendues a 8 couleurs (au lieu de 4-6) et des fonds teintes. Pour les compositions qui necessitent plus de richesse chromatique tout en restant flat.

---

### digital-prestige

**Genre** : Illustration digitale prestige, style roman graphique moderne

```
/prompt-image Un CEO en reunion strategique --style digital-prestige
```

| Aspect | Detail |
|--------|--------|
| Contours | Encre noire, poids uniforme, nets et precis |
| Couleurs | Aplats comme base + ombrage controle pour le volume |
| Ombrage | Doux, precis, pas de texture granuleuse |
| Rendu | Digital poli, jamais photographique |
| Format | 16:9 |
| Interdit | Photorealisme, 3D, anime, texture peinture |

**Ideal pour** : contenus premium, portraits professionnels, illustrations de type roman graphique

**Difference avec `ligne-claire-plus`** : ombrage plus prononce (vrai volume), contours uniformes (pas de variation de poids), rendu plus « lisse et digital ».

---

### linkedin-editorial

**Genre** : Editorial warm prestige pour LinkedIn

```
/prompt-image Un consultant en strategie face a un tableau blanc --style linkedin-editorial
```

| Aspect | Detail |
|--------|--------|
| Contours | Fins et elegants, presents mais pas dominants |
| Couleurs | Palette chaude, fond creme ou teinte |
| Accent | 1 couleur vibrante pour le focus |
| Lisibilite | Optimise pour miniature LinkedIn |
| Format | 16:9 ou 1:1 |
| Interdit | Photorealisme, stock photo, flat design, anime, esthetique corporate-IA |

**Ideal pour** : posts LinkedIn thought leadership, articles editoriaux, illustrations strategie/conseil

**Anti-positionnement explicite** : PAS du stock photo, PAS du flat design SaaS, PAS du look Midjourney par defaut, PAS du Canva template.

---

### whiteboard-sketch

**Genre** : Diagramme technique style tableau blanc premium

```
/prompt-image Architecture d'un systeme de cache distribue --style whiteboard-sketch
```

| Aspect | Detail |
|--------|--------|
| Fond | Blanc casse chaud (#F4F4F4) |
| Trait | Faux-handmade controle (propre mais pas geometrique) |
| Typographie | Manuscrite (Virgil/Caveat), titres 28-36px, labels 16-20px |
| Couleurs | Semantiques, 4-5 max, chaque couleur = un sens |
| Composition | Flux narratif vertical, espacement genereux |
| Format | 16:9 |
| Interdit | Polish corporate, geometrie parfaite, couleurs decoratives |

**Palette semantique** :

| Couleur | Code | Signification |
|---------|------|---------------|
| Gris fonce | #4F4F4F | Contours et structure |
| Gris clair | #DDE0E3 | Remplissage neutre |
| Rouge doux | #D96B6B | Probleme, risque |
| Vert doux | #6DBD7E | Solution, succes |
| Bleu doux | #73B2E8 | Conclusion, synthese |
| Violet doux | #9E7FEB | Mecanisme, processus |

**Ideal pour** : schemas d'architecture, diagrammes techniques, infographies pedagogiques, visualisations argumentatives

**Regle d'or** : chaque couleur porte un sens. Pas de couleur decorative.

---

## Creer son propre style guide

Pour un projet avec une identite visuelle, creer un fichier `style-guide.json` a la racine du projet :

```
projets-actifs/mon-projet/
  style-guide.json    <-- detecte automatiquement par /prompt-image
```

### Cles obligatoires

| Cle | Type | Description |
|-----|------|-------------|
| `schema_version` | string | `"1.0"` |
| `id` | string | Identifiant unique, kebab-case |
| `project` | string | Nom lisible du projet |
| `style.genre` | string | Genre visuel (voir vocabulaire controle ci-dessous) |
| `style.positioning` | string | Position sur l'axe stylise-realiste |
| `rendering.linework` | array | Caracteristiques des contours |
| `rendering.color` | array | Logique de couleur |
| `rendering.shading` | array | Logique d'ombrage |
| `format.aspect_ratio` | string | Ratio d'aspect (`"16:9"`, `"1:1"`, etc.) |
| `avoid` | array | Elements a exclure systematiquement |
| `prompt_core` | string | Phrase 20-50 mots injectee en tete de chaque prompt |
| `visual_signature` | array | 3-5 marqueurs visuels distinctifs |

### Genres reconnus

| Genre | Description |
|-------|-------------|
| `ligne-claire` | Franco-belge classique |
| `ligne-claire-plus` | Franco-belge rehaussee |
| `flat-design` | Vectoriel minimaliste |
| `editorial-photo` | Photographie editoriale |
| `concept-art` | Concept art cinematographique |
| `prestige-digital` | Digital semi-realiste premium |
| `scientific-abstract-visualization` | Visualisation scientifique abstraite |

Genre custom accepte : ajouter `style.genre_description` pour documenter.

### Template minimal

```json
{
  "schema_version": "1.0",
  "id": "mon-projet-v1",
  "project": "Mon Projet",
  "style": {
    "genre": "ligne-claire-plus",
    "positioning": "stylise"
  },
  "rendering": {
    "linework": ["clean black outlines", "variable weight"],
    "color": ["flat colors", "subtle localized shading"],
    "shading": ["subtle shading", "no heavy gradients"]
  },
  "format": { "aspect_ratio": "16:9" },
  "avoid": ["photorealism", "anime", "neon colors"],
  "prompt_core": "Franco-belgian ligne claire editorial illustration, clean black outlines, flat colors with subtle shading, 16:9 landscape.",
  "visual_signature": ["black contour", "flat color logic", "editorial atmosphere"]
}
```

### Cles optionnelles utiles

| Cle | Utilite |
|-----|---------|
| `characters.recurring` | Personnages recurrents avec traits visuels et palette |
| `environment` | Types de decors autorises et regles |
| `color_policy` | Familles de couleurs, dominante, interdites |
| `mood` | Ambiances autorisees et interdites |
| `negative_core` | Prompt negatif de base pour les generateurs qui le supportent |
| `signature` | Marqueurs obsessionnels injectes dans le prompt (strike point, mecaniques de tension) |
| `model_adaptation` | Strategies specifiques par generateur |
| `series_rules` | Invariants et variables entre episodes |

---

## Exemples d'utilisation courants

### Portrait simple (niveau 1)

```
/prompt-image Un developpeur pensif devant son ecran dans un cafe
```

### Scene de groupe (niveau 2)

```
/prompt-image Trois ingenieurs en brainstorm autour d'un tableau blanc --style ligne-claire-plus
```

### Poster (niveau 3)

```
/prompt-image Affiche d'un cafe vintage avec menu et prix --gen qwen --intent cover
```

### Composition complexe (niveau 4)

```
/prompt-image Poster de voyage Hangzhou, 2 jours, temples et lac --gen qwen --niveau 4
```

### Debug (voir les prompts internes)

```
/prompt-image Un chat sur un toit --verbose
```

### Style guide local (pas un preset)

```
/prompt-image Un personnage du conseil en reflexion --style ./style-guide.json
```

---

## Iterer sur un resultat

Apres chaque generation, le skill propose 3 options creatives contextuelles. Vous pouvez aussi demander directement :

| Votre feedback | Ce que le skill modifie |
|----------------|------------------------|
| « Plus de contraste » | Eclairage et couleurs |
| « Plan plus large » | Camera, detail, contexte |
| « Ambiance plus chaude » | Couleurs et eclairage |
| « Ajoute un personnage » | Sujet et composition |
| « Plus de details » | Densite de details et materiaux |
| « Moins dramatique » | Eclairage, composition, action |
| « Change la scene » | Setting |
| « Plus expressif » | Action et densite de details |

Maximum 3 allers-retours avant que le skill propose de sauvegarder le meilleur resultat.

---

## Bonnes pratiques

1. **Soyez concret** : « un chat roux sur un toit de tuiles » est meilleur que « une belle image de chat »
2. **Minimum 3 elements** : sujet + contexte + ambiance pour un resultat riche
3. **Utilisez un style guide** pour les series : la coherence vient du `prompt_core` verrouille
4. **Testez avec `--verbose`** pour comprendre comment le skill decompose votre idee
5. **Preferez Qwen** si votre image contient du texte ou un layout complexe
6. **Limitez les personnages** a 3 avec Nano Banana, ou passez en plan large
7. **Ne demandez pas de mains en gros plan** : c'est la faiblesse principale de tous les generateurs
8. **Iterez sur le score** : si la faisabilite est < 7, simplifiez avant de tester

---

**Fichiers de reference internes** (pour les curieux) :

| Fichier | Contenu |
|---------|---------|
| `references/methode-raffinement.md` | 4 passes de verification, arbre de decision, termes interdits, mapping feedback |
| `references/nano-banana-2.md` | Structure 5 blocs, faiblesses, conversions positives, suffixes |
| `references/qwen-image-2.md` | 7 regles, capacites avancees, modes edition, parametres techniques |
| `../ernie-image/REFERENCE.md` | Adaptation ERNIE Studio, MLX, Visual anchor, biais portraits/decors |
| `references/schema-style-guide.md` | Contrat JSON, cles obligatoires/optionnelles, template complet |

---

**Derniere mise a jour** : 27 avril 2026
