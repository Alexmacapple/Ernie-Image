# Schéma du style guide L0

**Objet** : Contrat JSON qui définit la structure et les contraintes que tout style guide de projet doit respecter pour être utilisable avec le skill `/prompt-image`.

**Statut** : v1.1  
**Date** : 7 avril 2026

---

## Description générale

Le style guide est un fichier JSON qui encapsule la charte visuelle d'une série d'illustrations. Il spécifie :

- Les contraintes de rendu (contours, couleurs, ombrage)
- Le positionnement sur l'axe stylisation-réalisme
- Les clés de style verrouillées (genre, palette, format)
- Les éléments à exclure
- La signature visuelle reconnaissable

Le skill `/prompt-image` charge ce fichier au démarrage, puis utilise ses valeurs pour contraindre chaque étape du pipeline de raffinement (Prompt1, Prompt2, Prompt3, Prompt4). Le style guide a toujours priorité : un enrichissement qui contredirait le style guide sera supprimé.

---

## Clés obligatoires

| Clé | Type | Description | Exemple |
|-----|------|-------------|---------|
| `schema_version` | string | Version du schéma implémenté, au format `X.Y` (ex: "1.0", "1.1"). Permet la détection de compatibilité. | `"1.0"` |
| `id` | string | Identifiant unique du style guide, en kebab-case (ex: `lolo-council-v1`, `feuilleton-ia-ep1-v3`). Permet la traçabilité et la multiplex au sein d'un projet. | `"lolo-council-feuilleton-v1"` |
| `project` | string | Nom lisible du projet (ex: "LLM Council", "Feuilleton IA"). | `"Feuilleton LLM Council"` |
| `style.genre` | string | Genre visuel principal. Doit être dans le vocabulaire contrôlé ou documenté via `style.genre_description`. Voir section **Vocabulaire contrôlé**. | `"ligne-claire-plus"` |
| `style.positioning` | string | Positionnement sur l'axe stylisation-réalisme. Valeurs libres mais recommandées : `"stylisé"`, `"semi-réaliste"`, `"réaliste"`, `"cartoon"`, `"minimaliste"`. | `"semi-réaliste"` |
| `rendering.linework` | array[string] | Caractéristiques des contours. Exemples : `"clean black outlines"`, `"variable weight"`, `"soft edges"`, `"contour absent"`. Ordre : du plus général au plus spécifique. | `["clean black outlines", "variable weight", "natural feel"]` |
| `rendering.color` | array[string] | Logique de couleur appliquée. Exemples : `"flat colors"`, `"subtle shading"`, `"color gradients"`, `"limited palette"`, `"warm tones dominant"`. | `["flat colors", "subtle localized shading", "cool neutral base with warm accents"]` |
| `rendering.shading` | array[string] | Logique d'ombrage et de profondeur. Exemples : `"no shading"`, `"subtle shadows"`, `"dramatic lighting"`, `"volumetric shading"`. | `["subtle shading", "no heavy gradients", "localized on faces and hands"]` |
| `format.aspect_ratio` | string | Ratio d'aspect imposé. Format : `"W:H"` (ex: `"16:9"`, `"1:1"`, `"4:3"`). Si multiple ratios acceptés : lister le principal et documenter les variantes en `format.aspect_ratio_variants` (optionnel). | `"16:9"` |
| `avoid` | array[string] | Éléments ou styles à exclure systématiquement. Alimente la génération de Prompt4 (négatif). Exemples : `"photorealism"`, `"cartoon exaggeration"`, `"speech bubbles"`, `"anime style"`, `"neon colors"`. | `["photorealism", "cartoon exaggeration", "heavy gradients", "anime style"]` |
| `prompt_core` | string | Phrase de style injectée EN TÊTE de chaque Prompt3. C'est la "style compression" qui stabilise le rendu et force le générateur à honorer le style d'abord. Longueur recommandée : 20-50 mots. CRITIQUE : si cette clé change, revalider toutes les images existantes. | `"Franco-belgian ligne claire editorial illustration, clean black outlines with slightly variable weight, dominant flat colors with subtle localized shading, warm editorial atmosphere, 16:9 landscape."` |
| `visual_signature` | array[string] | Marqueurs visuels distinctifs (3-5) qui définissent l'identité reconnaissable de la série. Sous-ensemble de `rendering`, pas de nouvelles valeurs. Format : clés courtes et mémorables (ex: `"thick black contour"`, `"warm amber accent"`, `"soft cold background"`). Utilisé à titre informatif par le skill et documentaire pour les releceurs. | `["thick black contour", "warm amber highlight", "soft editorial atmosphere", "flat color logic"]` |

---

## Clés optionnelles

| Clé | Type | Description | Exemple |
|-----|------|-------------|---------|
| `version` | string | Version du style guide lui-même (indépendante du `schema_version`). Format libre (ex: `"1.0"`, `"1.1-wip"`, `"2.0-rc1"`). À incrémenter à chaque modification validée. | `"1.0"` |
| `style.tone` | array[string] | Adjectifs de ton explicites (différents de genre et positioning). Exemples : `"intellectual"`, `"warm"`, `"mysterious"`, `"energetic"`, `"calm"`. Affecte le pré-trait du Prompt2 (enrichissement atmosphère). | `["intellectual", "collaborative", "prestigious", "calm"]` |
| `style.genre_description` | string | Clarification textuelle du genre si valeur custom (hors vocabulaire contrôlé). Obligatoire si `style.genre` n'est pas dans le vocabulaire standard. | `"Ligne claire franco-belge contemporaine avec ombrage subtil (distinction ligne-claire-plus)"` |
| `characters` | object | Conteneur pour les descriptions de personnages récurrents. Voir sous-section **Clé `characters`**. | (voir détail ci-après) |
| `characters.recurring` | array[object] | Liste des personnages design récurrents. Chaque entrée : `{name, description, visual_traits, color_palette}`. Utilisé pour pré-remplir le Prompt1 (sujet). | (voir détail ci-après) |
| `environment` | object | Types de décors autorisés et règles. Clés recommandées : `types` (array), `density` (string: `low`, `medium`, `high`), `rules` (array). | `{types: ["meeting room", "office", "urban"], density: "medium", rules: ["always have city skyline visible", "warm wood accents preferred"]}` |
| `color_policy` | object | Familles de couleurs permises et interdites. Clés recommandées : `families` (array de familles: `warm`, `cool`, `neutral`, `accent`), `dominant` (string), `forbidden` (array). | `{families: ["neutral", "warm accent"], dominant: "cool gray", forbidden: ["neon", "saturated primary"]}` |
| `mood` | object | Ambiances visuelles autorisées et interdites. Clés recommandées : `allowed` (array), `forbidden` (array). | `{allowed: ["calm", "intellectual", "modern", "prestigious"], forbidden: ["chaotic", "dark", "fantasy"]}` |
| `series_rules` | object | Invariants vs variables par épisode (pour les feuilletons). Clés libres mais recommandées : `invariants` (array de clés verrouillées d'épisode à épisode), `variables_per_episode` (array de clés qui peuvent changer). Documentaire. | `{invariants: ["genre", "prompt_core", "format.aspect_ratio", "rendering.linework"], variables_per_episode: ["environment", "character_count", "mood_intensity"]}` |
| `negative_core` | string | Prompt négatif de base, applicable à tous les concepts si le générateur supporte les négatifs. Utilisé pour pré-remplir Prompt4. | `"photorealism, heavy shading, cartoon exaggeration, anime style, speech bubbles, text in image"` |
| `format.aspect_ratio_variants` | array[string] | Ratios alternatifs acceptés si le contexte l'impose (ex: `["1:1", "4:3"]` en addition au `"16:9"` principal). Le skill propose le principal par défaut. | `["1:1", "4:3"]` |
| `quality_checkpoints` | object | Points de référence pour auto-évaluation du score qualité en Étape 4. Clés recommandées : `style_markers` (array : ce qui prouve le style est bien appliqué), `scene_markers` (array : ce qui prouve la scène est bien traduite), `feasibility_risks` (array : éléments à surveiller par générateur). Documentaire, utilisé pour entraîner l'évaluation du skill. | (voir détail ci-après) |
| `signature` | object | **Bloc prescriptif** : marqueurs obsessionnels injectes dans le prompt pour creer une identite reconnaissable. Distinct de `visual_signature` (qui est descriptif/documentaire). Voir section **Signature et plectrum**. | (voir détail ci-après) |
| `rendering.tension_mechanics` | array[string] | Vocabulaire d'evenements visuels disponibles pour le concept. Le pipeline choisit la mecanique la plus adaptee. Exemples : `"rupture"`, `"transfer"`, `"emergence"`, `"collapse"`, `"resonance"`. Donne de l'attaque et du mouvement narratif aux images. | `["rupture: geometry breaking along stress lines", "transfer: energy pulse through junction"]` |
| `model_adaptation` | object | Strategies d'injection par famille de generateur. Cles recommandees par moteur : `strategy`, `risks`, `tip`. Permet d'adapter le meme preset a plusieurs generateurs. | (voir détail ci-après) |

---

### Détail : clé `characters`

Structure recommandée pour chaque entrée de `characters.recurring` :

```json
{
  "name": "string",                          // Nom du personnage
  "role": "string",                          // Rôle narratif (ex: "sceptique", "promoteur")
  "visual_traits": ["string"],               // Traits visuels distinctifs (ex: ["round glasses", "grey suit", "skeptical expression"])
  "color_palette": {                         // Palette personnelle recommandée
    "dominant": "string",                    // Couleur dominante
    "accents": ["string"]                    // Couleurs d'accent
  },
  "notes": "string"                          // Notes supplémentaires (optionnel)
}
```

Exemple complet :

```json
{
  "name": "Le sceptique",
  "role": "Jean-Paul, critique du council",
  "visual_traits": ["round glasses", "thoughtful expression", "leaning back posture"],
  "color_palette": {
    "dominant": "slate gray",
    "accents": ["amber", "warm skin tone"]
  },
  "notes": "Toujours représenté avec les bras croisés ou gestes réservés."
}
```

---

### Détail : clé `quality_checkpoints`

Structure recommandée :

```json
"quality_checkpoints": {
  "style_markers": [
    "prompt_core présent en tête",
    "contours clean black, poids variable",
    "flat colors dominants",
    "ombrage subtil, pas gradients lourds",
    "pas de photorealism, pas d'anime"
  ],
  "scene_markers": [
    "tous les éléments du concept sont présents",
    "perspectives correctes",
    "proportions humanoides crédibles",
    "ambiance cohérente avec le ton"
  ],
  "feasibility_risks": [
    "mains visibles : risque modéré (générer en plan moyen pour limiter)",
    "3+ personnages : faisable, vérifier expression faces",
    "texte rendu : très risqué avec Nano Banana (à éviter ou en légende)",
    "structures géométriques complexes : possible mais demande clarté"
  ]
}
```

---

## Signature et plectrum

### Distinction `visual_signature` vs `signature`

| Cle | Role | Injection dans le prompt | Public |
|-----|------|--------------------------|--------|
| `visual_signature` | **Descriptif** : marqueurs visuels pour relecteurs humains et documentation | Non (informatif) | Equipe, relecteurs |
| `signature` | **Prescriptif** : marqueurs obsessionnels injectes dans le prompt | Oui (etape 4, style compression) | Generateur d'images |

Les deux peuvent coexister. `visual_signature` est obligatoire (schema L0). `signature` est optionnelle et ajoute une couche d'identite personnelle.

### Structure de `signature`

```json
"signature": {
  "seed_phrase": "string",      // Constitution visuelle en 1 phrase (~30 mots max)
  "manifesto": "string",       // Version poetique/manifeste (optionnel, documentaire)
  "marks": {
    "geometry": "string",      // Motif geometrique obsessionnel
    "light": "string",         // Discipline lumiere
    "composition": "string",   // Regle compositionnelle
    "strike": "string"         // Point de plectrum (optionnel)
  },
  "tyrannical_rule": "string"  // Regle unique non-negociable que chaque image doit respecter
}
```

### Le concept de "plectrum"

Le plectrum est la couche d'attaque visuelle qui evite que le style devienne trop sage. Il se compose de 3 elements optionnels :

1. **Strike point** (`signature.marks.strike`) : un seul point par image ou l'accent est plus intense que partout ailleurs. La violation maitrisee de la discipline lumiere, a un seul endroit, au point de tension maximale.

2. **Tension mechanics** (`rendering.tension_mechanics`) : vocabulaire d'evenements visuels (rupture, transfer, emergence, collapse, resonance) qui donnent du mouvement narratif. Chaque image utilise au moins une mecanique.

3. **Hostile void** (dans `composition.framing`) : l'espace negatif n'est pas passif — il agresse, il compresse, il menace la structure. La composition cree une tension entre le vide et le focal.

### Exemples par genre

| Genre | Plectrum possible |
|-------|-------------------|
| `scientific-abstract-visualization` | Strike point lumineux aux fractures, arcs incomplets, hostile void |
| `ligne-claire-plus` | Un regard qui sort du cadre, une cassure dans le trait, un geste suspendu |
| `flat-design` | Un element decentre qui brise la grille, un accent de couleur plus vif que les autres |
| `concept-art` | Un point de lumiere surexpose, une diagonale de force, un contraste brutal localise |

Le plectrum est specifique a chaque preset. Il ne peut pas etre auto-genere — c'est une decision creative de l'auteur du style guide.

---

## Vocabulaire contrôlé pour `style.genre`

Les valeurs suivantes sont **standards** et reconnues par le skill :

| Genre | Signification | Positioning typique | Rendering typique |
|-------|---------------|---------------------|-------------------|
| `prestige-digital` | Illustration digitale semi-réaliste premium | semi-réaliste | smooth gradients, volumetric, polished |
| `ligne-claire` | Ligne claire franco-belge classique | stylisé | clean black outlines, flat colors, no shading |
| `ligne-claire-plus` | Ligne claire rehaussée (ombrage léger) | stylisé | clean black outlines, flat + subtle shading |
| `editorial-photo` | Photographie éditoriale | réaliste | real light/shadow, depth of field, textures |
| `concept-art` | Concept art cinématographique | semi-réaliste | dramatic lighting, volumetric, atmospheric |
| `flat-design` | Design plat, minimaliste | stylisé | no outlines, solid colors, geometric |
| `scientific-abstract-visualization` | Visualisation scientifique abstraite premium | minimaliste | wireframe, vector, luminous on dark void |

**Extension** : Un projet peut définir un genre custom en spécifiant :
1. Valeur custom dans `style.genre` (ex: `"manga-éducatif"`)
2. Clarification dans `style.genre_description` (ex: `"Manga style éducatif avec big eyes, outlines légères, couleurs pastels"`)

Le skill acceptera la valeur custom et signalera à l'utilisateur : *"Genre custom détecté : manga-éducatif -- vérifiez que le `prompt_core` et les règles de rendu reflètent votre intention"*.

---

## Versioning du schéma

Le `schema_version` suit le versioning sémantique pour garantir la rétrocompatibilité :

| Version | Règle | Exemple |
|---------|-------|---------|
| `1.x` (mineure) | Ajout de clés optionnelles. Pas de suppression ni de modification de clés obligatoires existantes. Style guides v1.0 restent compatibles avec v1.1. | v1.0 → v1.1 (ajout de `quality_checkpoints`) |
| `2.0` (majeure) | Modification ou suppression de clés obligatoires. Breaking change. Nécessite migration des style guides existants. | v1.x → v2.0 (suppression de `rendering.color`, ajout de `rendering.texture`) |

**Détection de compatibilité** : À la charge du style guide, le skill vérifie :
- Si `schema_version` est absent → avertissement et mode dégradé
- Si `schema_version` > version supportée par le skill → rejet explicite avec message d'erreur
- Si `schema_version` = 1.x et skill v1.y (y ≥ x) → compatible, chargement OK

---

## Stratégie de validation

**L'approche L0 est documentaire et LLM-native, pas programmatique.** Justification :

- Le skill `/prompt-image` est exécuté par Claude Code (LLM), pas par un validateur JSON formel
- Le LLM lit ce schéma en Markdown et vérifie la conformité à la charge du style guide
- Un JSON Schema formel entraînerait des frictions (syntaxe additionnelle, compilation) pour un gain marginal en v1

**Processus de validation (fait par le LLM)** :

1. Lire le fichier `style-guide.json` du projet
2. Vérifier la présence de **toutes les clés obligatoires**
3. Vérifier les **types** (string, array, object)
4. Vérifier que `style.genre` est soit standard, soit documenté par `style.genre_description`
5. Si validation échoue → message explicite, le skill demande une correction avant de continuer
6. Si validation OK → continuer le pipeline

**Erreurs courantes détectées** :

```
Validation échouée :
  - Clé manquante : "rendering.shading" (obligatoire)
  - Type incorrect : "format.aspect_ratio" (string attendu, trouvé array)
  - Genre non documenté : "style.genre" = "custom-weird", pas de "style.genre_description"

Corrigez le style-guide.json et relancez le skill.
```

**Une version programmatique (JSON Schema formel) pourra être ajoutée en v2** si des besoins à plus grande échelle l'imposent. Pour v1, la validation LLM suffit.

---

## Gouvernance du style guide

Le style guide est un artefact **critique** qui conditionne la cohérence de toute la série. Son cycle de vie doit être formalisé :

| Action | Qui | Quand | Règles |
|--------|-----|-------|--------|
| **Création** | L'auteur du projet | Au démarrage, avant la première image | Remplir toutes les clés obligatoires. Tester avec 1-2 concepts pilotes avant production. |
| **Modification** | L'auteur du projet uniquement | Entre deux épisodes, jamais en cours de production | Documenter le changement. Tester sur 1 concept existant : le rendu reste cohérent. Valider avant commit. |
| **Versioning** | Git + clé `version` dans JSON | À chaque modification | Format `X.Y` ou `X.Y-label` (ex: `"1.1"`, `"2.0-rc1"`). Git log documente le changement. |
| **Gel** | Automatique pendant production | Dès le premier concept généré jusqu'à publication | Le style guide ne peut pas changer en cours de série. Nouvelle variation = nouveau fichier ou attendre la fin de l'épisode. |
| **Rétrocompatibilité** | Avant tout changement à `prompt_core` ou `visual_signature` | Systématique | Relancer les 3-5 derniers concepts avec le nouveau `prompt_core`. Vérifier la cohérence visuelle. Si écarts : ne pas appliquer. |

**Règle absolue** : Ne jamais modifier `prompt_core` ou `visual_signature` en cours de série sans revalider visuellement toutes les images existantes. Ces clés définissent l'identité -- les changer casse la cohérence.

---

## Template JSON commenté complet

Prêt à copier-coller et à adapter :

```json
{
  "schema_version": "1.0",
  "id": "mon-projet-v1",
  "project": "Mon Projet",
  "version": "1.0",
  
  "style": {
    "genre": "ligne-claire-plus",
    "positioning": "stylisé",
    "tone": ["intellectual", "warm", "collaborative"]
  },
  
  "rendering": {
    "linework": [
      "clean black outlines",
      "slightly variable weight",
      "natural feel"
    ],
    "color": [
      "flat colors",
      "subtle localized shading",
      "cool neutral base with warm accents"
    ],
    "shading": [
      "subtle shading",
      "no heavy gradients",
      "localized on faces and hands only"
    ]
  },
  
  "format": {
    "aspect_ratio": "16:9",
    "aspect_ratio_variants": ["1:1", "4:3"]
  },
  
  "avoid": [
    "photorealism",
    "cartoon exaggeration",
    "heavy gradients",
    "anime style",
    "neon colors",
    "speech bubbles",
    "text rendered in image"
  ],
  
  "prompt_core": "Franco-belgian ligne claire editorial illustration, clean black outlines with slightly variable weight, dominant flat colors with subtle localized shading, warm editorial atmosphere, 16:9 landscape.",
  
  "visual_signature": [
    "thick black contour",
    "warm amber highlight",
    "soft editorial atmosphere",
    "flat color logic"
  ],
  
  "characters": {
    "recurring": [
      {
        "name": "Personnage A",
        "role": "Rôle narratif",
        "visual_traits": [
          "trait distinctif 1",
          "trait distinctif 2"
        ],
        "color_palette": {
          "dominant": "couleur dominante",
          "accents": ["accent 1", "accent 2"]
        },
        "notes": "Notes supplémentaires (optionnel)"
      }
    ]
  },
  
  "environment": {
    "types": [
      "type décor 1",
      "type décor 2"
    ],
    "density": "medium",
    "rules": [
      "règle 1",
      "règle 2"
    ]
  },
  
  "color_policy": {
    "families": ["neutral", "warm accent"],
    "dominant": "cool gray",
    "forbidden": ["neon", "saturated primary"]
  },
  
  "mood": {
    "allowed": [
      "calm",
      "intellectual",
      "modern",
      "prestigious"
    ],
    "forbidden": [
      "chaotic",
      "dark",
      "fantasy"
    ]
  },
  
  "series_rules": {
    "invariants": [
      "genre",
      "prompt_core",
      "format.aspect_ratio",
      "rendering.linework"
    ],
    "variables_per_episode": [
      "environment",
      "character_count",
      "mood_intensity"
    ]
  },
  
  "negative_core": "photorealism, heavy shading, cartoon exaggeration, anime style, speech bubbles, text in image, cluttered background",
  
  "quality_checkpoints": {
    "style_markers": [
      "prompt_core présent en tête",
      "contours clean black, poids variable",
      "flat colors dominants",
      "ombrage subtil, pas gradients lourds",
      "pas de photorealism, pas d'anime"
    ],
    "scene_markers": [
      "tous les éléments du concept sont présents",
      "perspectives correctes",
      "proportions crédibles",
      "ambiance cohérente avec le ton"
    ],
    "feasibility_risks": [
      "mains visibles : risque modéré",
      "3+ personnages : faisable",
      "texte rendu : très risqué",
      "structures géométriques : possible mais demande clarté"
    ]
  }
}
```

**Instructions de remplissage** :

1. Remplacer `mon-projet-v1` par votre identifiant unique (kebab-case)
2. Remplir `project` avec le nom lisible
3. Spécifier `style.genre` (standard ou custom + `style.genre_description`)
4. Lister les `rendering.*` en détail (au moins 2-3 items par clé)
5. Injecter `prompt_core` : phrase 20-50 mots qui force le style
6. Définir `visual_signature` : 3-5 marqueurs distintifs (sous-ensemble de rendering)
7. Lister les `avoid` (au moins 4-5 éléments)
8. Ajouter `characters.recurring` si la série en a
9. Valider avec 1-2 concepts pilotes avant production
10. Committer dans git avec message explicite

---

## Compléments et bonnes pratiques

### Où placer le style guide JSON

**Convention** : Chaque projet a son propre style guide à la racine du projet actif :

```
projets-actifs/<mon-projet>/
├── style-guide.json        # Style guide principal
├── CLAUDE.md               # Instructions projet
├── todo.md
└── ... (autres fichiers)
```

**Détection au démarrage du skill** : Ordre de résolution :

1. `--style <chemin>` explicite (prioritaire)
2. `style-guide.json` dans le répertoire courant
3. `style-guide.json` dans `projets-actifs/<projet>/` le plus proche
4. Mode libre : pas de style guide détecté -- le skill signale : *"Aucun style guide détecté -- mode libre, pas de contrainte de style"*

Jamais de fallback silencieux. Le skill annonce toujours quel style guide est utilisé ou son absence.

### Évolution d'un style guide au fil des épisodes

Pour une série multi-épisodes, plusieurs approches :

**Option A : Fichier unique, versioning**
```
projets-actifs/feuilleton/style-guide.json  (v1.0, v1.1, v2.0...)
```
À chaque changement validé, incrémenter `version`. Git log trace les modifications.

**Option B : Fichiers par épisode**
```
projets-actifs/feuilleton/
├── style-guide-ep1.json
├── style-guide-ep2.json
└── style-guide-ep3.json (variation acceptée)
```
Chaque fichier peut déclarer une clé `base_guide` pointant vers le guide parent, pour DRY.

**Recommandation** : Option A pour les séries de 1-3 variations mineures. Option B pour les changements radicaux d'épisode à épisode.

### Testabilité : valider le style guide

Avant de mettre un style guide en production :

1. Générer 2-3 concepts pilotes avec le style guide
2. Vérifier que les images sont cohérentes avec la charte (visuellement, en relecture)
3. Relire les `rendering.*` et `prompt_core` : sont-ils traduits dans les images ?
4. Si cohérence OK → commit et démarrer la production
5. Si écarts → ajuster `prompt_core` ou `rendering.*` et rejouer

---

## Résumé des règles critiques

1. **Clés obligatoires** : `schema_version`, `id`, `project`, `style.genre`, `style.positioning`, `rendering.*` (linework, color, shading), `format.aspect_ratio`, `avoid`, `prompt_core`, `visual_signature`. Pas de fallback possible.

2. **Validité du genre** : Si `style.genre` n'est pas dans le vocabulaire contrôlé → obligatoirement documenter avec `style.genre_description`.

3. **Priorité du style guide** : Le style guide verrouille le rendu. Aucun enrichissement ne doit le contredire. Si conflit : le style guide gagne.

4. **prompt_core** : Injecté en tête de CHAQUE Prompt3. CRITIQUE : toute modification doit revalider les images existantes.

5. **visual_signature** : Marqueurs distinctifs (3-5) qui définissent l'identité. À protéger comme `prompt_core`.

6. **Gel en production** : Le style guide ne change pas en cours de série. Nouvelle variation = nouveau fichier ou attendre la fin.

7. **Versioning** : Schéma (`schema_version`) et guide (`version`) sont indépendants. Incrémenter `version` à chaque modification. Format `X.Y` ou `X.Y-label`.

8. **Validation** : Documentaire (LLM-native), pas JSON Schema formel. Le skill vérifie les clés obligatoires et les types à la charge.

---

**Schéma** : v1.0  
**Statut** : Production
