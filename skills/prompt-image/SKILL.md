---
name: prompt-image
description: "Utiliser quand l'utilisateur demande de raffiner, optimiser, adapter ou réécrire un prompt de génération d'image pour Nano Banana, Qwen-Image ou ERNIE Studio. Produit uniquement du texte ; ne pas utiliser si l'utilisateur demande de générer ou modifier une image réelle."
---

# Skill : /prompt-image

## Déclencheurs

- `/prompt-image <idée>` - transformation idée brute en prompt image
- `/prompt-image --gen qwen Un chat assis` - avec générateur explicite
- `/prompt-image --gen ernie Affiche mélodrame pop` - structure l'idée puis délègue l'adaptation finale à `ernie-image`
- `/prompt-image --style /path/to/style-guide.json ...` - avec style guide externe
- Toute demande de raffinement de prompt image

## Exemple

**Entrée** : `/prompt-image --gen ernie affiche mélodrame espagnol, cuisinière dans une cuisine rouge, titre La Cuisine Rouge`

**Prompt3 produit** :
```txt
[Type] cinematic pop melodrama poster.
[Sujet] a Spanish mother in a red dress preparing an extravagant cake in a Madrid kitchen.
[Composition] vertical waist-up framing, slight low angle, deep background with geometric tiles.
[Lumière] warm late afternoon side light, theatrical shadows.
[Texture] glossy red plastic, turquoise ceramic, floral tablecloth, overripe fruit.
[Texte] exact French title in Latin alphabet: "LA CUISINE ROUGE".
Visual anchor: Iberian Mediterranean setting, Madrid apartment kitchen, Latin alphabet poster typography, Spanish or southern European adult, olive to warm light skin tone, contemporary red dress, saturated red turquoise and saffron palette, realistic European cinema poster.
```

## Arguments et options

| Option | Valeurs | Défaut | Description |
|--------|---------|--------|-------------|
| Concept brut | texte libre | (obligatoire) | Idée à transformer en prompt |
| `--gen` | nano-banana, qwen, ernie | auto-détecté | Générateur cible |
| `--style` | nom preset ou chemin | auto-détecté | Preset par nom (`orbital-fracture`, `ligne-claire-plus`) ou chemin vers un style-guide.json |
| `--intent` | editorial, cover, thumbnail, hero, storytelling, infographic | auto | Contexte d'utilisation |
| `--niveau` | 1, 2, 3, 4 | auto | Complexité du prompt (sinon détecté) |
| `--verbose` | (flag) | false | Afficher Prompt1, Prompt2 (debug) |

## Périmètre

**Couvert** :
- Transformation d'idées brutes en prompts image prêts à copier-coller
- Support Nano Banana 2, Qwen-Image 2.0 et ERNIE Studio via post-traitement `ernie-image` (extensible)
- Mode libre (sans style guide) et mode avec contraintes (style guide JSON)
- Itération sur le résultat via feedback utilisateur
- Mode debug `--verbose` pour inspect des prompts internes

**Hors périmètre** :
- Exécution de code ou appels API (texte uniquement)
- Génération réelle d'images
- Autres générateurs (v2+)

---

## Workflow principal

### Étape 0 : Parsing et détection

1. Parser `$ARGUMENTS` en variables (concept, options)
2. Si concept vide : demander à l'utilisateur
3. Détecter le style guide (ordre : `--style` > cwd > `projets-actifs/<projet>/` > mode libre)
4. Charger via Read :
   - Style guide JSON (si trouvé) → vérifier schema_version + clés obligatoires
   - Reference du générateur cible (`references/nano-banana-2.md`, `references/qwen-image-2.md`, ou `../ernie-image/REFERENCE.md` pour ERNIE Studio)
   - `references/methode-raffinement.md` pour l'arbre de décision du niveau
5. Annoncer la configuration (style guide utilisé, générateur, niveau détecté)

**Avertissements ou confirmations** :
- Genre custom du style guide → signaler et demander confirmation
- Conflit entre paramètres → clarifier avec l'utilisateur

### Étape 1 : Analyse (interne)

Appliquer les 4 passes de vérification selon le niveau détecté (voir `methode-raffinement.md` pour les critères) :

1. **Fidélité sémantique** : L'idée est-elle bien comprise ? Si ambiguïté : clarifier avec l'utilisateur
2. **Traduction visuelle** : Convertir concepts abstraits en éléments rendables
3. **Conformité style guide** : Vérifier aucune contradiction (si style guide chargé)
4. **Faisabilité générateur** : Signaler les éléments que le générateur gère mal (mains, groupe 5+, texte, etc.)

**Si faisabilité problématique** : avertissement utilisateur, mais continuer (pas de blocage)

### Étape 2 : Prompt1 (interne)

Décomposer le concept en 10 clés fixes (non exposées sauf `--verbose`) :

```
subject | action | setting | style | camera | lighting | color | composition | materials | detail_density
```

- Remplir chaque clé avec les éléments identifiés par l'analyse
- Si style guide chargé : verrouiller les clés fixes (genre, format, rendering, positioning) et marquer `[VERROUILLÉ]`
- Langue : anglais

### Étape 3 : Prompt2 (interne)

Enrichir le Prompt1 avec :
- Détails de scène (objets, arrière-plan, éléments d'ambiance)
- Matériaux et textures
- Atmosphère narratifs
- Détails de personnage (expressions, vêtements, accessoires)

**RÈGLE CRITIQUE** : ne JAMAIS introduire de nouvel attribut de style. L'enrichissement ajoute UNIQUEMENT scène/matériaux/atmosphère.

Si style guide chargé : vérifier que les familles de couleurs et moods ajoutées appartiennent aux listes autorisées.

**Termes interdits** : vérifier qu'aucun terme de `methode-raffinement.md` section « termes interdits » n'apparaît.

### Étape 4 : Prompt3 + Prompt4 (exposés)

#### Prompt3 (prompt positif optimisé)

1. **Passe simplicité** : est-ce plus complexe que nécessaire ? Supprimer adjectifs redondants, détails microscopiques ignorés
2. **Style compression** : injecter `prompt_core` du style guide EN TÊTE de Prompt3 (si style guide chargé)
3. **Formatage selon générateur** :
   - **Nano Banana 2** : 5 blocs (sujet | contexte/scène | style visuel | caméra/lumière | contraintes finales). Voir `nano-banana-2.md` pour structure exacte et suffixes
   - **Qwen-Image 2.0** : 7 règles (sujet d'abord, général→spécifique, texte entre guillemets, contraintes négatives, relations spatiales, suffixes qualité, style vs contenu). Voir `qwen-image-2.md` pour structure exacte et suffixes
   - **ERNIE Studio** : produire un prompt structuré en blocs `[Type]`, `[Sujet]`, `[Composition]`, `[Lumière]`, `[Texture]`, `[Texte]`, puis appliquer le skill `ernie-image` pour ajouter l'adaptation MLX, le `Visual anchor:` et les limites ERNIE.
4. **Vérification tokens** : compter les tokens estimés (~1.3 tokens/mot). Avertir si dépassement du max pour le niveau
5. **Afficher Prompt3** dans un bloc ```txt prêt à copier-coller

#### Prompt4 (prompt négatif ou conversion)

- **Nano Banana 2** : Pas de champ négatif natif → convertir les interdictions en formulations positives (voir tableau conversion `nano-banana-2.md`). Si conversion impossible → avertir l'utilisateur
- **Qwen-Image 2.0** : Supporte prompt négatif explicite. Construire à partir de `negative_core` du style guide (si existant) + termes auto-déduits des `avoid` et de la faisabilité
- **ERNIE Studio** : pas de Prompt4 négatif. Convertir les interdictions en formulations positives via `ernie-image` et les intégrer dans le prompt principal ou dans `Visual anchor:`.
- **Afficher Prompt4** dans un bloc ```txt ou section dédiée

### Étape 5 : Exposition et checklist

Afficher à l'utilisateur (en français) :

1. **Annonce** : Style guide utilisé (ou "Mode libre") + générateur + niveau
2. **Avertissements** : faisabilité problématique, tokens élevés, etc. (s'il y en a)
3. **Prompt3** dans bloc code
4. **Prompt4** (si applicable) dans bloc code
5. **Checklist de conformité** (tableau 2 colonnes : critère | OK/N/A)
   - Pour Nano Banana 2 : structure 5 blocs, formulations positives, pas groupe 5+, mains gérées, tokens < max
   - Pour Qwen : 7 règles, sujet en tête, guillemets, spatial décrit, suffixes, séparation style/contenu
   - Pour ERNIE Studio : blocs `[Type]` à `[Texte]`, `Visual anchor:`, limites MLX explicites, seed fixe recommandée
   - Pour style guide : prompt_core injecté (si applicable), aucun terme `avoid` présent, palette respectée, mood autorisée
6. **Score qualité** (sur 10) : moyenne de style (conformité guide) / scène (traduction visuelle) / faisabilité (générateur accepte ?)
7. **3 options créatives** contextuelles (exemples : monter de niveau, changer style, modifier composition, variante d'éclairage)

### Étape 6 : Itération

L'utilisateur peut :
- Valider (fin du workflow)
- Modifier un paramètre ("plus de contraste", "change l'intent", "--niveau 4")
- Changer de générateur (`--gen qwen` ou `--gen ernie` au lieu de nano-banana)
- Demander une variante ("version plus surréaliste", "pose alternative")

Retour à l'étape 4 (ou étape 1 si modification majeure du concept).

## Décisions d'implémentation

### Auto-détection du niveau

Si `--niveau` non spécifié, utiliser l'arbre de décision de `methode-raffinement.md` :

```
Le concept mentionne un layout/grille/zones précis ?
  → OUI + texte à rendre → niveau 4
  → OUI sans texte → niveau 3
  NON : type design explicite (poster, PPT, BD, infographie) ?
    → OUI → niveau 3
    NON : 3+ éléments distincts ou style identifiable ?
      → OUI → niveau 2
      NON → niveau 1
```

### Auto-détection du générateur

Si `--gen` non spécifié :
- Défaut : Nano Banana 2 (générateur générique, bien supporté)
- Si mention de "texte à rendre" ou "multi-panneaux" : Qwen (meilleur support texte et layouts)
- Si l'utilisateur mentionne explicitement ERNIE, Ernie Studio, MLX, biais asiatique dans Ernie, ou `--gen ernie` : ERNIE Studio
- Ne pas choisir ERNIE automatiquement pour du texte complexe ou des layouts précis : Qwen reste recommandé pour ces cas
- Proposer alternative si choix semble sous-optimal

### Auto-détection de l'intent

Si `--intent` non spécifié, inférer du contexte :
- "affiche" / "poster" → `editorial` ou `hero`
- "vignette" / "petit" → `thumbnail`
- "illustration" / "histoire" → `storytelling`
- "infographique" / "diagram" → `infographic`
- Défaut : `editorial`

### Mode verbose

Si `--verbose` : afficher aussi Prompt1 et Prompt2 entre les étapes. Aider au debug et à la compréhension du raffinement interne.

---

## Références documentaires

| Fichier | Utilisation |
|---------|-------------|
| `methode-raffinement.md` | Détail des 4 passes, arbres de décision, critères faisabilité, termes interdits |
| `schema-style-guide.md` | Contrat JSON d'un style guide, clés obligatoires, types, exemples |
| `nano-banana-2.md` | Structure 5 blocs, suffixes, faiblesses, conversions positives, termes photo/cinéma |
| `qwen-image-2.md` | 7 règles, capacités avancées, texte multi-surface, modes d'édition, paramètres techniques |
| `../ernie-image/REFERENCE.md` | Adaptation ERNIE Studio, MLX, `Visual anchor:`, biais portraits/décors |

---

## Contraintes

- **Français + anglais** : interface en français, prompts en anglais
- **Pas d'emojis, pas de code** : résultats professionnels, texte uniquement
- **Validation style guide** : charger + vérifier schema_version et clés obligatoires via Read. Si invalide : avertissement explicite, mode dégradé possible
- **Pas de hallucination** : ne jamais inventer de références générateur. Si doute : consulter les fichiers de référence (via Read)
- **Itération infinie interdite** : max 3 retours à l'étape 4. Au-delà : proposer de sauvegarder le meilleur effort et relancer une nouvelle session

---

## Implémentation

Le skill est un orchestrateur : il **lit les références** via Read et applique la logique du pipeline. Il ne duplique pas les détails (ils vivent dans les fichiers de référence). Les modifications futures au pipeline viennent de la mise à jour des fichiers de référence, pas du SKILL.md lui-même.

### Vérification des tokens

L'estimation des tokens est LLM-native : compter les mots du Prompt3 et multiplier par ~1.3. Pas d'outil externe. Seuils max par niveau et générateur définis dans les fichiers reference (`nano-banana-2.md` et `qwen-image-2.md`). Si dépassement : avertissement à l'utilisateur, pas de blocage.

### Résolution du style guide

Recherche séquentielle, premier trouvé utilisé :
1. `--style <nom-preset>` : chercher dans `presets/<nom>.json` du skill (ex: `--style orbital-fracture`)
2. `--style <chemin>` : chemin explicite vers un fichier JSON
3. `style-guide.json` dans le répertoire de travail courant (`pwd`)
4. Recherche ascendante : remonter les répertoires parents jusqu'à trouver `style-guide.json` (arrêt à `~/Claude/`)
5. Mode libre si rien trouvé -- annoncer explicitement

### Presets disponibles

Lister les presets disponibles via `Glob presets/*.json` dans le répertoire du skill. Table de référence (10 presets au 28 avril 2026) :

| Preset | Genre | Usage |
|--------|-------|-------|
| `ligne-claire-plus` | Ligne claire franco-belge rehaussée, ombrage subtil | Feuilletons éditoriaux, illustrations LinkedIn, séries narratives |
| `ligne-claire` | Ligne claire franco-belge classique, aplats, contours épais | BD éditorial, illustrations narratives classiques |
| `orbital-fracture` | Géométrie orbitale fracturée, luminescence chirurgicale, void hostile | Posters scientifiques, covers tech, visualisations data, branding deeptech |
| `bio-lumina` | Bioluminescence organique, architecture végétale nocturne, pulsation vivante | Illustrations nature-tech, covers biotech, visuels nocturnes, branding organique |
| `flat-design` | Illustration vectorielle minimaliste, palette limitée | Slides, infographies, dashboards, illustrations corporate, icônes |
| `flat-design-spectrum` | Flat design avec palettes étendues, zéro dégradé | Illustrations modernes multi-palettes, infographies colorées |
| `whiteboard-sketch` | Diagramme whiteboard premium, faux-handmade contrôlé, palette sémantique | Blog engineering, docs techniques, explainers, posts LinkedIn, schémas architecture |
| `digital-prestige` | Illustration digitale prestige, style roman graphique moderne | Couvertures éditoriales, posters premium, storytelling visuel |
| `kandinsky-abstrait` | Abstraction pure Kandinsky, formes autonomes, pas de figuratif | Visuels conceptuels, art abstrait, couvertures poétiques |
| `linkedin-editorial` | Éditorial warm prestige, conseil/stratégie avec température humaine | Posts LinkedIn, thought leadership, illustrations éditoriales professionnelles |

### Correspondance étapes / prompts

| Étape | Nom | Prompt produit | Visibilité |
|-------|-----|----------------|------------|
| 0 | Parsing et détection | -- | Annonce config |
| 1 | Analyse | -- | Interne (avertissements exposés) |
| 2 | Décomposition | Prompt1 (10 clés) | Interne (sauf --verbose) |
| 3 | Enrichissement | Prompt2 | Interne (sauf --verbose) |
| 4 | Optimisation | Prompt3 + Prompt4 | Exposé |
| 5 | Itération | -- | 3 options + feedback |

---

## Pièges courants

| Piège | Symptôme | Contournement |
|-------|----------|---------------|
| Style guide JSON invalide | Erreur au chargement, clés manquantes | Vérifier avec le schéma L0 (`schema-style-guide.md`). Le template commenté est dans ce fichier |
| Concept trop vague ("une belle image") | Prompt générique, score scène bas | Demander à l'utilisateur de préciser : sujet, contexte, ambiance. Minimum 3 éléments concrets |
| Confusion Nano Banana vs Qwen | Prompt formaté pour le mauvais générateur | Vérifier `--gen`. Par défaut Nano Banana. Si texte à rendre ou layout complexe : recommander Qwen |
| Confusion Qwen vs ERNIE | Texte complexe ou layout traité par ERNIE alors que Qwen serait meilleur | ERNIE uniquement si demandé ou si la cible est Ernie Studio |
| Groupe de 4+ personnages | Visages déformés, expressions perdues | Avertir via la passe faisabilité. Recommander plan large ou réduction à 3 personnages |
| Enrichissement qui casse le style | Termes comme "dramatic lighting" ajoutés en Prompt2 | Vérifier contre la liste des termes interdits dans `methode-raffinement.md` |

## Checklist finale

- [ ] Concept ambigu levé ou reformulé avec l'utilisateur
- [ ] Tous les éléments du concept traduits en détails visuels concrets
- [ ] Aucun terme interdit de `methode-raffinement.md` présent dans Prompt2
- [ ] `prompt_core` du style guide injecté EN TÊTE de Prompt3 (si style guide chargé)
- [ ] Prompt3 formaté selon le générateur cible (blocs ERNIE, 5 blocs Nano, 7 règles Qwen)
- [ ] Avertissements faisabilité signalés si risque modéré ou élevé
- [ ] Tokens estimés dans les limites du niveau
- [ ] Score qualité affiché (style / scène / faisabilité)
- [ ] 3 options créatives proposées

