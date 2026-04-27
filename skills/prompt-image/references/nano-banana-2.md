# Nano Banana 2 — Guidelines de prompting

**Modèle** : Google Nano Banana 2 (modèle image générique)
**Statut** : V1 — Phase de validation (estimations à valider sur L3)

---

## Structure du prompt — 5 blocs

Nano Banana 2 répond mieux avec une structure claire en 5 blocs ordonnés. Cette organisation guide le générateur et stabilise le rendu visuel.

| # | Bloc | Contenu | Exemple |
|---|------|---------|---------|
| 1 | **Sujet principal** | Quoi ? Les éléments principaux, les sujets du portrait/scène | "trois personnages assis autour d'une table" |
| 2 | **Contexte / scène** | Où ? Lieu, décor, arrière-plan, éléments d'ambiance | "salle de réunion moderne, baies vitrées, skyline visible" |
| 3 | **Style visuel** | Comment ? Genre, technique, esthétique, linework, palette, texture | "illustration ligne claire franco-belge, contours épais, aplats de couleur" |
| 4 | **Caméra et lumière** | Cadrage et éclairage. Termes photo/cinéma | "plan moyen, légèrement en contre-plongée, lumière latérale douce" |
| 5 | **Contraintes finales** | Format, résolution, restrictions visuelles, mood final | "16:9 paysage, atmosphère prestigieuse, pas de texte en image" |

### Ordre d'importun

Le **bloc 1 (sujet)** doit toujours venir en tête. C'est l'ancre sémantique. Si le modèle doit choisir entre deux instructions contradictoires, il privilégie le premier bloc.

### Formulations positives obligatoires

Nano Banana 2 a meilleure performance avec des descriptions positives. Les interdictions doivent être converties en descriptions de ce qui EST présent.

BON :
```
clean black outlines with variable weight
```

MAUVAIS :
```
no thick lines, avoid uniform outlines
```

### Termes photo/cinéma

Nano Banana 2 répond bien aux termes visuels précis : `low angle`, `aerial view`, `soft light`, `rim lighting`, `shallow depth of field`, `backlighting`, etc.

**Utiliser plutôt que** : vague descriptions ("bel éclairage" → utiliser "warm three-point lighting" à la place).

---

## Exemples qui marchent

### Exemple 1 : Portrait classique (Niveau 1)

**Concept** : Un développeur AI pensif regardant son écran dans un café.

**Prompt Nano Banana 2** :
```
A thoughtful software engineer gazing at a laptop screen,
dans un modern cafe with warm ambient lighting and soft shadows,
style realistic portrait illustration, detailed facial features, 
soft watercolor-like rendering,
camera portrait orientation, slight side-angle, natural soft window light,
warm color palette, intimate and introspective atmosphere, 
no people in background, no text.
```

**Résultat attendu** : Portrait d'une personne avec détails faciaux fins, éclairage café cohérent, style semi-réaliste homogène.

**Pourquoi ça marche** :
- Sujet clair et unique (1 personnage).
- Style défini sans ambiguïté (portrait illustration watercolor).
- Termes caméra simples (portrait orientation, side-angle).
- Palette cohérente en un mot (warm).

---

### Exemple 2 : Scène de groupe modérée (Niveau 2)

**Concept** : Trois développeurs en réunion de brainstorm autour d'un tableau blanc.

**Prompt Nano Banana 2** :
```
Three diverse software engineers in animated brainstorm session around a whiteboard,
dans a bright startup office, modern furniture, natural daylight from large windows,
style clean vector illustration with bold strokes, flat color blocks, minimal shading,
camera medium shot, triangular group composition, eye-level angle,
bright primary colors with neutral accents, energetic and collaborative mood,
legible whiteboard text visible but not in focus, no photorealism.
```

**Résultat attendu** : Trois personnages en postures dynamiques, tableau blanc visible, style vecteur cohérent, paleta claire.

**Pourquoi ça marche** :
- Groupe de 3 personnages (optimal pour Nano Banana).
- Style verrouillé (vector illustration, bold strokes).
- Composition explicite (triangular arrangement).
- Contrainte spécifique sur le texte (legible but not in focus) plutôt que l'interdire.

---

### Exemple 3 : Décor architectural (Niveau 2-3)

**Concept** : Intérieur épuré de bibliothèque futuriste avec étagères en béton.

**Prompt Nano Banana 2** :
```
Minimalist futuristic library interior with towering concrete bookshelves,
clean geometric lines, soft ambient light from hidden sources,
style architectural illustration, blueprint-like linework with soft fills,
cool gray and white palette with warm accent lighting,
camera wide shot, slight high angle, depth-of-field focus on shelves in middle ground,
serene and contemplative atmosphere, no people, no text elements.
```

**Résultat attendu** : Perspective architecturale claire, béton rendu en gris chaud/froid, lumière douce et cohérente.

**Pourquoi ça marche** :
- Pas de personnages (simpler pour le générateur).
- Style architectural bien connu (blueprint-like).
- Jeu de lumière explicite (hidden sources).
- Composition via profondeur (depth-of-field).

---

### Exemple 4 : Style éditorial avec pose signature (Niveau 2)

**Concept** : Fondatrice de startup posant face à la caméra, style Magazine couverture.

**Prompt Nano Banana 2** :
```
Confident startup founder facing the camera with arms crossed,
dans minimalist white studio with soft shadows on the floor,
style editorial magazine illustration, contemporary fashion aesthetic,
clean black outlines with variable weight, subtle face shading, flat color clothing,
camera straight-on medium shot, professional studio lighting,
warm skin tones, blue and gray editorial palette, authoritative yet approachable mood,
high contrast, magazine-ready composition.
```

**Résultat attendu** : Portrait de mode, éclairage studio lisible, contraste éditorial fort.

**Pourquoi ça marche** :
- Pose explicite (facing camera, arms crossed).
- Style magazine précis.
- Termes éclairage professionnels (studio lighting).
- Contrainte mood attachée à l'intention (authoritative yet approachable).

---

### Exemple 5 : Illustration feuilleton (Niveau 3)

**Concept** : Trois personnages du LLM Council en débat autour d'une table.

**Prompt Nano Banana 2** :
```
Three distinct characters seated around a sleek round table in animated intellectual discussion,
one leaning forward with open hands, one gesturing with raised finger, 
one leaning back with crossed arms and skeptical expression,
dans a contemporary glass-walled meeting room with warm wood accents and soft city skyline visible,
documents and laptop on table,
style franco-belgian ligne claire editorial illustration, clean black outlines with slightly variable weight,
dominant flat colors with subtle localized shading, polished editorial finish,
plan moyen, angle à hauteur des yeux, lumière naturelle douce latérale,
tons dorés chauds sur la peau et le bois, reflets bleu-gris froids sur le verre,
format 16:9 paysage, personnages expressifs et crédibles, visages détaillés,
arrière-plan simplifié, atmosphère de débat intellectuel prestigieux.
```

**Résultat attendu** : Trois personnages expressifs en débat, style ligne claire français cohérent, palette neutre-chaude, 16:9 paysage.

**Pourquoi ça marche** :
- Structure 5 blocs respectée.
- Sujet précis avec gestes nommés.
- Style guide injecté (prompt_core de feuilleton).
- Caméra et lumière en termes français (accepté par Nano Banana).
- Contraintes format et ambiance explicites.

---

## Exemples qui échouent

### Exemple 1 : Groupe trop important + texte dense

**Concept** : Quinze scientifiques autour d'une table, tableau blanc avec équations complexes.

**Prompt faible** :
```
Fifteen scientists in a research meeting around a large wooden table,
avec un whiteboard filled with complex mathematical equations,
style scientific realism with detailed precision,
warm lighting, academic atmosphere,
all faces clearly visible and different, all names readable on name tags.
```

**Problèmes identifiés** :
- **Groupe de 15 personnages** : Nano Banana gère mal 5+. Résultat : visages fondus, expression perte de lisibilité.
- **Texte complexe** (équations) : Nano Banana ne rend pas les formules mathématiques correctement. Résultat : gribouillage.
- **Toutes les faces visibles** : Impossible avec 15 personnes + détails. Résultat : mélange amorphe.

**Conversion positive** :
- Réduire à 4-5 scientifiques.
- Remplacer équations par "abstract scientific diagrams" ou les omettre.
- Cadrer en plan large (less detail on individual faces).
- Accepter que certains visages soient en arrière-plan.

---

### Exemple 2 : Plusieurs styles incompatibles

**Concept** : Illustration anime + photorealistic hands + art deco background.

**Prompt faible** :
```
Anime character with photorealistic hands in an art deco ballroom,
style mixing anime with photorealism and art deco design,
dramatic cinematic lighting.
```

**Problèmes identifiés** :
- **Styles mélangés** (anime + photorealism) : Nano Banana cherche à satisfaire tous les styles en même temps. Résultat : incohérence visuelle, déformation.
- **Impossible de rendre photorealistic hands** dans un style anime. Résultat : mains bizarres ou distordues.

**Conversion positive** :
- Choisir UN style dominant (anime OU photorealistic, pas les deux).
- Adapter le reste à ce style unique.
```
Anime character in an art deco ballroom, expressive anime style with
consistent linework and flat-shaded background, dramatic anime-style lighting.
```

---

### Exemple 3 : Interdictions en cascade sans positif

**Concept** : "Je veux un portrait, mais pas de cheveux longs, pas de visage en profil, pas de sourire, pas de couleurs vives."

**Prompt faible** :
```
A person, no long hair, not a profile view, no smile, no bright colors,
dans un studio, realistic style, dark and moody.
```

**Problèmes identifiés** :
- **Interdictions en cascade** sans décrire ce qui EST voulu. Nano Banana doit "négativer" chaque instruction, ce qui dilue la création.
- **Trop vague** : "a person" sans contexte. Homme ? Femme ? Âge ?
- **Résultat** : Incohérent, impossible à générer.

**Conversion positive** :
```
A middle-aged man with short dark hair, facing the camera with a neutral expression,
in a moody studio with cool blue lighting,
style realistic portrait illustration with soft modeling,
no bright colors, deep blues and grays with warm skin tones,
serious and contemplative mood.
```

---

## Capacités du modèle — Tableau synthétique

| Dimension | Faible | Moyen | Fort | Notes |
|-----------|--------|-------|------|-------|
| **Personnages : nombre optimal** | — | 1–3 | — | 1–3 sont stables. 4–5 possible avec cadrage large. 6+ risqué. |
| **Personnages : nombre max** | — | ~5–7 | — | Au-delà : visages amalgamés, expressions perte. |
| **Texte : simple (label, titre court)** | Déformé | Lisible si < 5 mots | — | Placer en grande taille, sans rotation. |
| **Texte : complexe (équations, blocs)** | — | — | Échoue | Ne pas demander. Remplacer par "visible but blurred" ou omettre. |
| **Mains : compte optimal** | — | 2–4 visibles | — | Mains en gros plan : risque de déformation. Cadrage moyen ou large réduuit le risque. |
| **Mains : complexité posture** | Distordu | Positions simples (croisées, détendues, levées) | — | Gestes précis complexes : réduction risque via cadrage large. |
| **Layout structuré (grille, zones)** | — | Moyen-bon | — | Fonctionne mieux avec clés explicites : "grid", "columns", "left-center-right". |
| **Perspective (1-point, 2-point)** | Moyen | Bon avec termes précis | — | "Bird's eye view", "worm's eye view" = meilleur que "looking down". |
| **Profondeur / Focus** | — | Bon (depth of field, foreground/background) | — | Fonctionne avec termes cinéma précis. |
| **Cohérence de style** | Moyen | Bon si style single verrouillé | — | Un seul style > mélange de styles. Injecter style en tête. |
| **Couleurs : palette cohérente** | — | Bon si < 4–5 couleurs dominantes | — | Énumérer les couleurs est plus fiable que décrire "vibrant" ou "pastel". |
| **Textures et matériaux** | Moyen | Bon : bois, métal, verre, béton, papier | — | Abstractions (vagues, nuages, feu) : moins fiable. |
| **Cohérence d'époque** | Moyen | Bon : période nommée (art deco, victorian, 2050s) | — | Styles futuristes + passé : risque mélange incohérent. |

---

## Faiblesses connues

### 1. Mains et articulations

**Symptôme** : Doigts tordus, nombre de doigts incorrect, articulations impossibles.

**Cause racine** : Nano Banana gère moins bien la géométrie fine des mains en gros plan.

**Stratégies de contournement** :
- Cadrer en plan moyen ou large pour réduire la taille des mains.
- Accepter mains partiellement hors-cadre.
- Mains en postures simples (croisées, détendues, levées) plutôt que gestes complexes.
- Exemple : "hands at sides" > "hands gesturing dramatically with fingers splayed".

---

### 2. Groupes de 4+ personnages

**Symptôme** : À partir de 4–5 personnages, les visages se déforment, les proportions se mélangent, les expressions s'effacent.

**Cause racine** : Augmentation combinatoire de la complexité dans l'espace.

**Stratégies de contournement** :
- Limiter à 3 personnages au maximum pour avoir des visages nets.
- Pour 4–5 : cadrer très large (plan d'ensemble) et accepter moins de détail facial.
- Pour 6+ : utiliser "silhouettes" ou "figures en arrière-plan" plutôt que "distinct faces".
- Diviser en plusieurs images si possible.

---

### 3. Texte dense et équations

**Symptôme** : Texte ilisible, équations déformées, formes caractères cassées.

**Cause racine** : Génération caractère par caractère en haute densité dépasse la capacité du modèle.

**Stratégies de contournement** :
- Limiter à < 5 mots par bloc texte.
- Pas d'équations mathématiques complexes. Utiliser "mathematical diagram" ou "abstract formulas".
- Placer le texte en GRAND et non-rotaté.
- Texte court au premier plan seulement.
- Alternative : rendre le texte flou ("text visible but blurred") plutôt que lisible.

---

### 4. Perspectives complexes

**Symptôme** : Perspective cassée, objets en proportions impossibles, vanishing points erratiques.

**Cause racine** : Perspectives d'ordre 3+ demandent une compréhension spatiale 3D que Nano Banana gère en continu.

**Stratégies de contournement** :
- Utiliser perspective simple (1-point ou 2-point) avec noms précis.
- Éviter grilles compliquées ou plusieurs points de fuite.
- Injecter termes de caméra explicites ("eye-level", "slightly elevated angle").

---

### 5. Mélange de styles visuels

**Symptôme** : Image incohérente qui mélange anime + photorealism + cartoon sans cohérence.

**Cause racine** : Si plusieurs styles sont donnés sans hiérarchie, Nano Banana les fusionne maladroitement.

**Stratégies de contournement** :
- **Un seul style dominant** verrouillé en tête du prompt.
- Injecter le prompt_core AVANT tout détail de scène.
- Si styles secondaires nécessaires, décrire la fusion explicitement (ex: "anime-inspired with realistic lighting" plutôt que "anime AND photorealistic").

---

### 6. Éléments abstraits

**Symptôme** : Concepts abstraits (émotion, concept, idée) rendus maladroitement ou ignorés.

**Cause racine** : Nano Banana travaille sur des éléments visuels concrets, pas sur des abstractions.

**Stratégies de contournement** :
- Traduire abstractions en éléments visuels concrets.
- Exemple : "tension" → "postures rigides, mains serrées, distance minimale" plutôt que "feeling of tension".
- Utiliser mood ou atmosphere termes pour orienter, mais concréiser les éléments.

---

### 7. Animaux et créatures

**Symptôme** : Anatomie incorrecte, proportions bizarres, mélange de caractéristiques animales.

**Cause racine** : Moins de données d'entraînement que pour les humains. La probabilité augmente avec la rareté de l'animal ou l'hybridation.

**Stratégies de contournement** :
- Animaux domestiques (chats, chiens) : généralement OK.
- Animaux sauvages exotiques : résultat moins stable.
- Créatures hybrides (dragon, sphinx) : risque très élevé d'incohérence.
- Utiliser photorealistic style pour animaux : meilleur résultat que cartoon.

---

## Stratégie prompt négatif — Conversion en positif

Nano Banana 2 n'a **pas de champ négatif natif**. Il faut convertir les interdictions en descriptions positives ou les omettre.

### Tableau de conversion

| Interdiction | Conversion positive | Conversion possible ? |
|-------------|-------------------|---------------------| 
| "no photorealism" | "illustration style with linework, not photographic" | **OUI** |
| "no blurry details" | "sharp focus, crisp details" | **OUI** |
| "no text" | "no text elements" (ou omettre) | **OUI, mais faible** |
| "no deformed hands" | "hands in natural poses, anatomically correct" | **NON FIABLE** — risque toujours présent |
| "no anime style" | "realistic illustration with photographic lighting" | **OUI** |
| "no speech bubbles" | "no speech bubbles or dialogue indicators" | **OUI** |
| "no bright colors" | "muted palette, cool grays and warm neutrals" | **OUI** |
| "no people in background" | "no background figures, isolated main subject" | **OUI** |
| "no gradients" | "flat color blocks without gradients" | **OUI** |
| "no blended materials" | "distinct material boundaries, sharp edges between materials" | **MOYEN** |
| "no overly detailed background" | "simplified background, minimal detail" | **OUI** |
| "not symmetrical" | "asymmetrical composition, off-center balance" | **OUI** |

### Cas non convertibles — Avertissement utilisateur

Certaines demandes n'ont pas d'équivalent positif fiable. Dans ces cas, avertir l'utilisateur :

- **"Pas de mains déformées"** : Impossible à garantir. Meilleur contournement = cadrage qui cache les mains.
- **"Pas de groupe 5+"** : Impossible. Réduction groupe ou cadrage large nécessaire.
- **"Pas de texte complexe"** : Impossible pour équations. Omettre ou résumer.

### Intégration dans le prompt

Ne **jamais** ajouter de section "Negative prompt:" fictive. Nano Banana n'a pas ce champ. Intégrer les conversions positives **directement dans le bloc approprié** :

BON (conversion intégrée) :
```
style realistic illustration with linework, not photorealistic,
with sharp crisp details and no blurry elements
```

MAUVAIS (section négative fictive) :
```
[Positive prompt: ...]
Negative prompt: no photorealism, no blurry details
```

---

## Suffixes et qualificateurs efficaces

Ces termes améliorent la cohérence et la qualité quand ajoutés au prompt Nano Banana 2.

### Suffixes de qualité générale

Ajouter en fin de Prompt3 pour stabiliser le rendu :

- `"polished and refined"` : Améliore homogénéité.
- `"high quality, professional finish"` : Réduit artifacts.
- `"editorial illustration"` : Anchor style marketing.
- `"magazine-ready composition"` : Améliore composition.
- `"carefully composed, balanced"` : Améliore symétrie/layout.

### Termes cinéma/photo (caméra et lumière)

Ces termes structurent la composition et l'éclairage :

**Cadrage** :
- `low angle` / `high angle` / `eye-level`
- `wide shot` / `medium shot` / `close-up`
- `bird's eye view` / `worm's eye view`
- `overhead` / `overhead angled`

**Éclairage** :
- `soft light` / `harsh light`
- `three-point lighting` / `rim lighting` / `backlighting`
- `golden hour light` / `blue hour`
- `natural light` / `studio light`
- `warm tones` / `cool tones`

**Profondeur et focus** :
- `shallow depth of field`
- `sharp focus on [element]`
- `bokeh background`
- `foreground [X], middle ground [Y], background [Z]`

### Termes de matériaux et textures

Améliore rendu textures :

- `smooth wood` / `weathered stone`
- `crisp glass` / `brushed metal`
- `soft fabric` / `tailored clothing`
- `glossy` / `matte finish`

### Termes de palette et mood

Stabilise couleur et ambiance :

- `warm palette` / `cool palette` / `neutral palette`
- `muted colors` / `vibrant colors`
- `monochromatic` / `complementary colors`
- `serene atmosphere` / `energetic mood` / `somber tone`

### Termes d'époque et contexte

Anchor style et cohérence historique :

- `art deco` / `victorian` / `modern` / `futuristic`
- `minimalist` / `maximalist` / `brutalist`
- `contemporary` / `timeless`

### Suffixes anti-défaults connus

Utiliser pour contrecarrer les faiblesses identifiées :

- **Anti-mains déformées** : `"hands in natural poses, no distortion"` — NE GARANTIT PAS, mais aide.
- **Anti-texte déformé** : `"large readable text, no small characters"` — aide pour texte < 5 mots.
- **Anti-groupe amalgamé** : `"distinct clear faces, separate identities"` (mais limiter à 3 persos).
- **Anti-mélange styles** : `"cohesive visual style, consistent throughout"` + style unique en tête.

---

## Limites de tokens — Par niveau

La passe de simplicité (étape 4 du pipeline) doit respecter ces seuils pour éviter instabilité du rendu.

| Niveau | Tokens recommandés | Tokens maximum | Avertissement si dépasse |
|--------|-------------------|-----------------|--------------------------|
| **1** | 50–100 | 150 | "Prompt de X tokens, max 150 recommandé niveau 1 — risque de simplification ou incohérence" |
| **2** | 100–200 | 300 | "Prompt de X tokens, max 300 recommandé niveau 2 — risque d'éléments ignorés" |
| **3** | 200–400 | 500 | "Prompt de X tokens, max 500 recommandé niveau 3 — risque de détails perdus ou style dilué" |
| **4** | 400–800 | 1000 | "Prompt de X tokens, max 1000 recommandé niveau 4 — prompt très long, risque d'instabilité rendu" |

**Estimation tokens** : Compter ~1.3 tokens par mot. Utiliser approximation pour contrôle rapide.

### Exemple de vérification

Un Prompt3 niveau 2 qui dépasse 300 tokens :

```
Résultat des mesures :
- Tokens estimés : 480 (au lieu des 100–200 recommandés)
- Seuil max niveau 2 : 300
- Avertissement : "Prompt surdimensionné. Simplifier en supprimant adjectifs redondants 
  ou détails non essentiels. Recommandation : réduire à ~250 tokens."
```

### Stratégie de réduction

Si prompt dépasse le max, appliquer passe de simplicité :

1. Identifier les adjectifs redondants (ex: "beautiful elegant prestigious" → garder un seul).
2. Supprimer détails que le générateur ignorera (ex: couleurs microscopiques en plan large).
3. Merger deux descriptions proches (ex: "soft warm light" au lieu de "soft light" et "warm tones").
4. Re-tester après réduction.

---

## Notes et limitations

### Informations estimées

Les éléments marqués **[estimé -- à valider sur L3]** reposent sur l'analyse des informations du PRD, pas sur une documentation exhaustive de Nano Banana 2 :

- Capacités : seuil optimal de 3 personnages, max ~5–7.
- Faiblesses : mains, texte, groupes 4+.
- Suffixes : termes photo/cinéma généralement bien supportés par les modèles Google Imagen.
- Limites tokens : basée sur expériences avec modèles visuels similaires.

Ces informations **doivent être validées** sur l'environnement de production de Nano Banana 2 dès que possible.

### Approche itérative

Ce fichier est un guide initial. La qualité réelle des prompts dépendra de tests empiriques sur des concepts réels du feuilleton LLM Council. Prévoir d'enrichir cette référence après les premières générations.

### Contre-attente

Nano Banana 2 est un modèle générique. Certains comportements peuvent dévier de cette documentation selon :
- Version exacte du modèle (updates Google).
- Configuration de la chaîne de prompting (mode de safety, etc.).
- Paramètres de génération (temperature, steps, etc.).

---

## Checklist rapide avant utilisation

Avant d'envoyer un Prompt3 à Nano Banana 2, vérifier :

- [ ] Structure 5 blocs respectée (sujet, contexte, style, caméra/lumière, contraintes).
- [ ] Sujet principal en **premier**.
- [ ] **Uniquement formulations positives** (pas d'interdictions en dur).
- [ ] Style verrouillé (prompt_core injecté) et unique.
- [ ] Pas de groupe > 3 personnages sauf cadrage très large.
- [ ] Mains en postures simples OU hors-cadre.
- [ ] Texte < 5 mots OU omis.
- [ ] Tokens < seuil max pour le niveau.
- [ ] Termes photo/cinéma utilisés pour caméra et lumière.
- [ ] Palette cohérente (< 4–5 couleurs dominantes nommées).

---

**Version** : 1.0
**Auteur** : Pipeline /prompt-image v5.0 (PRD-images-feuilleton)
**Maintenance** : À jour après tests empiriques Nano Banana 2 réels.
