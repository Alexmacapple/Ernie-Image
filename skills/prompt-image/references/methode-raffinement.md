# Méthode de raffinement -- Passes de vérification et pipeline interne

**Fichier** : `prompt-image/references/methode-raffinement.md`
**Statut** : Référence du skill `/prompt-image`

---

## Vue d'ensemble du pipeline

Le skill `/prompt-image` transforme un concept brut en prompt image exploitable via 5 étapes : analyse, décomposition, enrichissement, optimisation et itération. Cette documentation détaille les passes internes qui structurent ces étapes.

### Étapes du pipeline

```
Étape 1 : Analyse
  ├─ Passe 1 : Fidélité sémantique
  ├─ Passe 2 : Traduction visuelle
  ├─ Passe 3 : Conformité style guide
  └─ Passe 4 : Faisabilité générateur

Étape 2 : Prompt1 (Décomposition structurée)
  └─ 10 clés fixes : subject, action, setting, style, camera,
     lighting, color, composition, materials, detail_density

Étape 3 : Prompt2 (Enrichissement)
  └─ Ajout contraint : scène, matériaux, détails, atmosphère
     (JAMAIS nouvel attribut de style)

Étape 4 : Prompt3 + Prompt4 (Optimisation par générateur)
  ├─ Passe simplicité : suppression du superflu
  ├─ Style compression : injection du prompt_core
  ├─ Formatage selon les règles du générateur cible
  └─ Conversion négatif → positif (si nécessaire)

Étape 5 : Itération
  └─ 3 options créatives + feedback utilisateur
```

### Prompts internes vs exposés

| Prompt | Visibilité | Rôle | Destinataire |
|--------|-----------|------|-------------|
| Prompt1 | Interne | Squelette de travail (10 clés) | Processus interne |
| Prompt2 | Interne | Version enrichie | Processus interne |
| Prompt3 | Exposé | Prompt final optimisé | Utilisateur + générateur |
| Prompt4 | Exposé | Prompt négatif (ou conversion positif) | Utilisateur + générateur |

En mode `--verbose`, les prompts internes sont affichés pour debug. Par défaut, l'utilisateur voit Prompt3 + Prompt4 + checklist + options créatives.

---

## Détail des 4 passes de vérification (Étape 1)

### Passe 1 : Fidélité sémantique

**Question directrice** : L'idée de l'utilisateur est-elle bien comprise ?

**Rôle** : Vérifier que le concept brut est correctement interprété avant d'aller plus loin.

**Critères de vérification** :
- Tous les éléments mentionnés par l'utilisateur sont identifiés
- Aucune ambiguïté sémantique non clarifiée
- Les intentions implicites sont inférées correctement
- Si le concept est vague, proposer une clarification avant de continuer

**Exemple feuilleton** :
- Concept brut : "réunion du LLM Council, 3 personnages assis autour d'une table, débat animé sur l'avenir de l'IA"
- Vérification fidélité : 3 personnages = OK, table = OK, débat animé = mouvement/gestuelle, avenir de l'IA = contexte (pas besoin de texte dans l'image)
- Résultat : Concept clair, aucune ambiguïté

**Quand signaler un problème** :
- "un groupe de gens" (combien ? quels types ?)
- "une atmosphère mystérieuse" (dans quel contexte ?)
- "un objet magique" (quel style : fantasy, sci-fi, réalisme ? → dépend du style guide)

**Sortie** : Concept clarifié ou reformulation proposée à l'utilisateur.

---

### Passe 2 : Traduction visuelle

**Question directrice** : Chaque concept abstrait a-t-il un équivalent visuel concret ?

**Rôle** : Convertir les idées abstraites en éléments rendables par un générateur d'images.

**Critères de vérification** :
- Les adjectifs abstraits ("beauté", "tragédie", "espoir") sont traduits en éléments visuels concrets
- Les relations sociales/émotionnelles sont traduites en postures et expressions
- Les concepts invisibles (idées, sentiments) sont exprimés via le décor, la palette et la composition
- Aucun élément purement conceptuel ne reste non traduit

**Exemple feuilleton** :
- Concept : "débat animé" → Traduction : gestes expressifs, mains en mouvement, un qui penche en avant, un qui gesticule, un qui écoute avec expression sceptique
- Concept : "avenir de l'IA" → Traduction : contexte implicite par le décor (salle de réunion moderne, peut-être un écran en arrière-plan), pas besoin de texte

**Termes problématiques (avant traduction)** :
- "épique" (trop vague) → "composition cinématique avec perspective exagérée"
- "riche" (trop vague) → "palette variée avec matériaux de qualité (bois lisse, verre, tissu)"
- "dramatique" (nécessite précision) → "éclairage latéral fort avec ombres contrastées" ou "composition asymétrique avec point focal isolé"

**Sortie** : Mapping concept → éléments visuels prêt pour Prompt1.

---

### Passe 3 : Conformité style guide

**Question directrice** : Le prompt contredit-il une clé du style guide ?

**Rôle** : Garantir que aucune suggestion ou enrichissement ne viole la direction artistique du projet.

**Critères de vérification** :
- Aucun terme dans `avoid` du style guide n'apparaît
- Les éléments traduits par la passe 2 respectent le genre visuel (exemple : "ligne-claire-plus" exclut les rendu photoréaliste)
- Palette : couleurs proposées appartiennent aux familles autorisées
- Mood : ambiance proposée est compatible avec les ambiances autorisées du style guide
- Rendering : contours, ombrage et traitement des couleurs respectent les règles du style guide

**Exemple feuilleton** (style "ligne-claire-plus") :
- Vérification : trait noir avec épaisseur légèrement variable → OK
- Vérification : aplats de couleur dominants avec ombrage léger → OK
- Vérification : aucun élément "photorealism" → style guide interdit, pas de problème ici
- Vérification : palette neutre froide + accents chauds → OK

**Priorité en cas de conflit** : Le style guide **a toujours priorité**. Si la traduction visuelle (passe 2) a ajouté un élément qui contredit le style guide, l'élément est ajusté ou supprimé.

**Exemple de conflit** :
- Passe 2 a proposé : "éclairage dramatique avec ombres profondes"
- Style guide dit : "pas de rendu photoréaliste, ombrage subtil et localisé"
- Résolution : Ajuster en "éclairage latéral soft avec ombrage léger et localisé sur les zones clés"

**Sortie** : Prompt validé contre le style guide, ajustements effectués.

---

### Passe 4 : Faisabilité générateur

**Question directrice** : Le générateur cible sait-il rendre tous les éléments du prompt ?

**Rôle** : Identifier les éléments que le générateur gère mal et proposer des ajustements ou des avertissements.

**Critères de vérification** :
- Nombre de personnages : dans la plage de capacité du générateur (voir fichier reference du générateur)
- Mains visibles : si oui, évaluer le risque (gros plan = risque haut, plan moyen = risque modéré, plan large = risque bas)
- Texte dans l'image : le générateur supporte-t-il le texte ? Si oui, combien de mots ?
- Layout structuré : layout complexe = risque élevé (recommander simplification ou générateur différent)
- Perspective et profondeur : le générateur maîtrise-t-il ce type de composition ?
- Matériaux et textures : le générateur peut-il rendre les matériaux demandés ?

**Capacités par générateur** (voir fichiers reference détaillés) :
- **Nano Banana 2** : 3-4 personnages OK, mains en mouvement = risque modéré, plan moyen courant, texte faible
- **Qwen Image 2.0** : Plus de personnages, mains meilleures, texte meilleur, compositions complexes mieux gérées

**Exemple feuilleton (Nano Banana 2)** :
- 3 personnages assis → OK (3 = limite supérieure confortable)
- Mains visibles et en mouvement → Risque modéré. Recommandation : cadrer en plan moyen pour limiter détail des mains
- Pas de texte demandé → OK
- Layout composition table → OK (composition basique)
- Avertissement pour l'utilisateur : "Nano Banana gère modérément les mains en mouvement. Le rendu peut avoir des anomalies. Considérer un resserrage en plan rapproché sur les visages si les mains posent problème, ou basculer sur Qwen pour plus de tolérance."

**Avertissements communs** :
- "Plus de 4 personnages → risque de cohérence faible"
- "Gros plan sur les mains → risque de déformation"
- "Texte visible dans l'image → supporté faiblement, préférer des symboles"
- "Perspective complexe → simplifier ou recommander Qwen/Flux"
- "Matériaux très détaillés (micro-textures) → réserver aux plans larges"

**Sortie** : Avertissements, recommandations d'ajustement, validation finale avant Prompt1.

---

## Modulation des passes par niveau de complexité

Les 4 passes ne sont **pas toutes nécessaires** pour les concepts simples. Le coût en tokens est adapté au niveau détecté (ou spécifié via `--niveau`).

### Arbre de détection du niveau (auto-détection si `--niveau` non spécifié)

```
Le concept décrit un layout précis (grille, zones, composition détaillée) ?
  OUI → Le concept contient du texte à rendre ?
          OUI → Niveau 4 (layout complexe + texte)
          NON → Niveau 3 (layout structuré)
  NON → Le concept mentionne un type de design (poster, couverture, infographie) ?
          OUI → Niveau 3 (composition spécialisée)
          NON → Le concept contient 3+ éléments distincts ou un style spécifique ?
                  OUI → Niveau 2 (scène riche)
                  NON → Niveau 1 (concept simple)
```

### Tableau de modulation

| Niveau | Passes appliquées | Justification | Ordre de grandeur Prompt3 | Exemple |
|--------|-------------------|---------------|--------------------------|---------|
| **1** | Fidélité sémantique + Traduction visuelle | Concept simple, 1-2 éléments, pas de style complexe. Conformité et faisabilité vérifiées rapidement | 50-100 mots | "un personnage pensif devant une fenêtre" |
| **2** | Les 4 passes | Scène avec personnages et contexte. Vérification style et faisabilité critique | 100-200 mots | "réunion du council, 3 personnages en débat autour d'une table" |
| **3** | Les 4 passes | Composition structurée, mise en scène précise. Faisabilité à évaluer doublement (layout + détails) | 200-400 mots | "poster épisode 1 : 3 personnages + titre + décor salle conseil" |
| **4** | Les 4 passes + double passe faisabilité | Layout détaillé avec zones texte, multi-étages. Risque élevé d'éléments non rendables. Faisabilité évaluée 2 fois | 400-800 mots | "couverture avec bandeau titre, 5 personnages positionnés, crédits, symboles IA" |

### Règle d'application

- Niveau 1 : Pas besoin de vérifier en détail la conformité style guide (c'est un concept minimaliste)
- Niveau 2-4 : Les 4 passes sont systématiques
- Niveau 4 : Faisabilité vérifiée 2 fois (avant et après Prompt2 pour attraper les risques masqués par l'enrichissement)

---

## Ordre des passes et gestion des conflits

Les 4 passes s'exécutent **dans cet ordre** : fidélité → traduction → conformité → faisabilité. Chaque passe peut invalider la précédente.

```
Fidélité sémantique
       │ (concept clarifié)
       ▼
Traduction visuelle
       │ (éléments concrets identifiés)
       ▼
Conformité style guide
       │ (ajustements si conflit détecté)
       ▼
Faisabilité générateur
       │ (avertissements et recommandations)
       ▼
Prompt1 validé
```

### Exemple de conflit : Style guide prioritaire

**Scénario** : Passe traduction ajoute "éclairage dramatique cinématique", mais style guide interdit "heavy shadows".

**Résolution** :
1. Détecter le conflit en passe 3 (conformité)
2. Ajuster : "éclairage latéral doux avec ombrage léger, pas de shadows profondes"
3. Continuer vers passe 4 avec éléments ajustés
4. Ne **jamais** ignorer le conflit ni le laisser en silence

### Exemple de conflit : Faisabilité peut requérir simplification

**Scénario** : Passe faisabilité détecte "5 personnages avec mains visibles en gros plan = risque très élevé pour Nano Banana".

**Résolution** :
1. Avertir : "Nano Banana gère mal 5 personnages avec mains visibles. Options :"
   - Réduire à 3-4 personnages (garder les personnages clés)
   - Passer au plan moyen/large (mains moins en détail)
   - Utiliser Qwen au lieu de Nano Banana
2. Attendre feedback utilisateur pour décider

**Règle** : Les conflits faisabilité ne sont **jamais** résolus en silence. L'utilisateur choisit.

---

## Structure fixe du Prompt1 : 10 clés

Prompt1 est une décomposition structurée du concept en 10 clés obligatoires. Ces clés ont un ordre et un format constants. Plusieurs clés sont verrouillées par le style guide.

### Les 10 clés

#### 1. `subject`
**Description** : Le ou les sujets principaux de l'image (personnages, objets, créatures).
**Règle** : Commencer par le plus important.
**Verrouillage** : Peut être verrouillé par le style guide si le projet a des personnages récurrents.
**Exemple Nano Banana** :
```
subject: three distinct characters seated around a modern round table,
         one leaning forward with conviction, one gesturing with raised finger,
         one leaning back with skeptical expression
```

#### 2. `action`
**Description** : Ce que font les sujets. Verbes et mouvements.
**Règle** : Actions physiques (posture, geste, interaction), pas états émotionnels abstraits.
**Verrouillage** : Peut être partiellement verrouillé si le style guide définit des "actions type" (ex: personnages toujours expressifs, pas figés).
**Exemple Nano Banana** :
```
action: animated intellectual discussion, hands gesturing, expressions engaged
```

#### 3. `setting`
**Description** : Le contexte / l'environnement (lieu, décor, arrière-plan).
**Règle** : Décrire le lieu et ses caractéristiques pertinentes.
**Verrouillage** : Peut être verrouillé si le projet a des lieux récurrents (ex: "salle de réunion moderne épurée" est fixe pour tous les épisodes).
**Exemple Nano Banana** :
```
setting: contemporary glass-walled meeting room with warm wood accents,
         soft city skyline visible through windows, documents and laptop on table
```

#### 4. `style`
**Description** : Le genre visuel et le style de rendu.
**Règle** : Injecté directement depuis le style guide. **VERROUILLÉ toujours**.
**Verrouillage** : Verrouillé et immuable. C'est la signature du projet.
**Exemple Nano Banana (feuilleton LLM Council)** :
```
style: franco-belgian ligne claire editorial illustration, clean black outlines
       with slightly variable weight, dominant flat colors with subtle localized
       shading, no painterly texture, polished editorial finish
```

#### 5. `camera`
**Description** : Point de vue, cadrage, angle de la caméra.
**Règle** : Utiliser termes cinéma/photo (plan rapproché, plan moyen, plan large, angle plongée, contre-plongée, eye-level, etc.).
**Verrouillage** : Peut être verrouillé si le projet a une "signature" de cadrage (ex: toujours plan moyen pour lisibilité LinkedIn).
**Exemple Nano Banana** :
```
camera: medium shot at slight eye-level angle, triangular arrangement of
        characters around table, strong focal hierarchy on faces
```

#### 6. `lighting`
**Description** : Source de lumière, qualité de la lumière, contraste.
**Règle** : Descriptif, pas métaphorique. "soft lateral light from left" pas "dramatic cinematic lighting".
**Verrouillage** : Peut être partiellement verrouillé si le style guide impose une ambiance (ex: "warm editorial" fixe).
**Exemple Nano Banana** :
```
lighting: soft natural lateral light from glass walls, warm golden undertones
          on skin and wood surfaces, cool blue-gray reflections on glass
```

#### 7. `color`
**Description** : Palette de couleurs dominant l'image.
**Règle** : Injecté directement depuis le style guide. **VERROUILLÉ toujours**.
**Verrouillage** : Verrouillé. Le style guide définit les familles de couleurs autorisées.
**Exemple Nano Banana (feuilleton)** :
```
color: cool neutral base (slate gray, off-white) with warm accents (amber,
       warm skin tones), no neon, no oversaturation
```

#### 8. `composition`
**Description** : Arrangement spatial des éléments dans le cadre.
**Règle** : Hiérarchie visuelle, équilibre, règles compositionnelles.
**Verrouillage** : Peut être partiellement verrouillé si le style guide impose un format ou une règle (ex: 16:9, symétrie, domination d'une zone).
**Exemple Nano Banana** :
```
composition: 16:9 landscape, balanced negative space, strong focal hierarchy:
            faces sharp, background softened, triangular arrangement around table
```

#### 9. `materials`
**Description** : Matériaux et textures visibles (bois, verre, métal, tissu, papier, etc.).
**Règle** : Concret et rendable. "smooth wood" OK, "organic elegance" non.
**Verrouillage** : Pas verrouillé. Mais peut être orienté par le style guide (ex: "prefer natural materials for line-claire style").
**Exemple Nano Banana** :
```
materials: smooth polished wood table with subtle warm reflections, crisp
          treated glass surfaces with controlled glare, tailored clothing
          with precise fold logic
```

#### 10. `detail_density`
**Description** : Niveau de détail : les éléments clés sont-ils détaillés ou simplifiés ?
**Règle** : Toujours hiérarchisé. Jamais uniformément détaillé ou vide.
**Verrouillage** : Peut être verrouillé si le style guide impose une hiérarchie (ex: "detailed faces, simplified background" est la signature ligne-claire).
**Exemple Nano Banana** :
```
detail_density: detailed faces with readable expressions and subtle emotion,
               detailed hands showing gesture and interaction, simplified
               background to maintain focal hierarchy, simplified but
               identifiable objects on table
```

### Injection du style guide dans Prompt1

Quand le skill charge le style guide, il remplit automatiquement les clés verrouillées :

| Clé | Source |
|-----|--------|
| `style` | `style_guide.style.genre` + `style_guide.rendering.*` |
| `color` | `style_guide.color_policy` (ou fallback : `style_guide.rendering.color`) |
| `composition` | `style_guide.format.aspect_ratio` + `style_guide.series_rules` si présent |
| `detail_density` | `style_guide.series_rules` ou inféré du style guide |
| Partiellement verrouillé : `camera`, `lighting`, `setting` | Si valeurs fixes dans `style_guide.characters.recurring` ou `style_guide.environment` |

**Exemple feuilleton** :
```javascript
// Style guide charge :
"prompt_core": "Franco-belgian ligne claire editorial illustration...",
"rendering": {
  "linework": ["clean black outlines", "slightly variable weight"],
  "color": ["flat colors dominant", "subtle localized shading"],
  "shading": ["soft", "localized"]
},
"format": {
  "aspect_ratio": "16:9"
}

// Prompt1 remplit automatiquement :
style: "franco-belgian ligne claire editorial illustration, clean black outlines..."
color: "cool neutral base with warm accents, flat colors dominant..."
composition: "16:9 landscape..."
```

---

## Enrichment guardrail : Termes interdits vs autorisés

**Règle critique de l'Étape 3 (enrichissement)** : Prompt2 ajoute uniquement scène, matériaux, détails et atmosphère. **JAMAIS** nouvel attribut de style.

### Termes explicitement interdits en enrichissement

Ces mots/expressions modifient le style global et doivent être **refusés systématiquement** :

**Qualificatifs de style réservés au style guide** :
- "dramatic lighting" (modifie l'éclairage global)
- "painterly texture" (modifie le rendu)
- "cinematic depth of field" (modifie la technique)
- "heavy shadows" (modifie l'ombrage)
- "saturated colors" (modifie la palette)
- "neon highlights" (modifie le type de couleur)
- "hyperrealistic" (modifie le genre)
- "cartoonish" (modifie le genre)
- "anime style" (modifie le style)
- "photorealistic" (modifie le style)
- "hand-drawn aesthetic" (modifie le genre)
- "digital painting" (modifie le genre)
- "3D rendered" (modifie le genre)
- "watercolor effect" (modifie la technique)
- "oil painting" (modifie la technique)
- "grayscale" (modifie la palette)
- "monochrome" (modifie la palette)

**Mécanismes de style** :
- "smooth gradients" (modifie le traitement de la couleur)
- "harsh lighting" (modifie l'éclairage)
- "soft focus" (modifie la technique)
- "motion blur" (modifie la technique)
- "chromatic aberration" (modifie la technique)

**Contours et traits** :
- "thick outlines" (modifie le linework)
- "thin linework" (modifie le linework)
- "no outlines" (modifie le linework)
- "fuzzy edges" (modifie le linework)

**Si un enrichissement contient un terme interdit** : Le refuser avec un message explicite : "L'enrichissement 'dramatic cinematic lighting' modifie le style global. Le style guide verrouille déjà l'ambiance. Cet élément a été supprimé."

### Termes autorisés en enrichissement

Catégories de termes acceptés dans Prompt2 :

#### Scène et contexte
- Détails de décor : "books on shelves", "potted plants", "architectural columns"
- Objets : "coffee cup on desk", "smartphone", "paper documents"
- Arrière-plan : "city skyline", "mountain range", "forest"
- Ambiance météo : "sunny day", "rainy morning", "evening light" (quand cohérent avec le style)
- Heure du jour : "dawn", "midday", "dusk", "night" (via la lumière, pas la saturation)

#### Matériaux et textures
- Surfaces : "polished wood", "brushed metal", "rough fabric"
- Matériaux : "ceramic", "velvet", "leather", "concrete"
- Finitions : "matte", "glossy", "weathered" (décrire l'état, pas le style)
- Réflexions : "subtle reflections", "light reflections" (pas "dramatic")

#### Détails narratifs et accessoires
- Vêtements : "tailored suit", "casual shirt", "elegant dress"
- Accessoires : "glasses", "watch", "briefcase"
- Expressions : "thoughtful expression", "confident smile", "puzzled look"
- Gestes : "hands clasped", "finger pointing", "arms crossed"
- Personnages : "bearded man", "woman in profile", "young professional"

#### Atmosphère et mood (si cohérent avec style guide)
- "calm atmosphere" (si le style guide autorise)
- "busy environment" (si cohérent)
- "serene setting" (si cohérent)
- "focused energy" (via composition et expressions, pas saturation)
- "collaborative mood" (via arrangements, pas technique)

#### Clarifications de position et proportion
- "slightly elevated angle"
- "from the side"
- "close to the center"
- "positioned on the left"
- "occupying the upper third"

### Stratégie de refus avec proposition d'ajustement

Si un enrichissement contient un terme interdit ou contredit le style guide :

1. **Identifier** : "L'élément 'X' modifie le style global"
2. **Refuser** : "Cet élément contredit le style guide et a été supprimé"
3. **Proposer une conversion positive** (si possible) :
   - "dramatic lighting" → "lateral soft light with localized warmth" (respect du style)
   - "saturated colors" → "richer palette with accent warmth" (si le style guide l'autorise)
   - "hyperrealistic hands" → "detailed hands with readable gesture" (reste dans le style)
4. **Si pas de conversion** : "Cet ajout ne peut pas être intégré dans le style guide du projet. Proposer une variante sans cet élément ?"

### Exemple : Feuilleton LLM Council

Style guide définit : "ligne-claire-plus" = contours nets, aplats + ombrage léger.

**Enrichissement proposé** : "cinematic depth of field with dramatic lens flare"

**Analyse** :
- "depth of field" = modifie la technique (interdit)
- "dramatic lens flare" = effet photo/cinéma (interdit)

**Refus et proposition** :
```
Refus : "cinematic depth of field" et "dramatic lens flare" modifient la technique
de rendu. Le style guide impose une ligne claire avec ombrage subtil.

Proposition d'ajustement :
- "depth of field" → supprimer (incompatible, garder focus global)
- "lens flare" → remplacer par "soft reflections on glass surfaces"
  (matériaux, pas technique)

Ajout finalisé : "soft light reflections on glass surfaces"
```

---

## Passe de simplicité (Étape 4)

Avant de formater Prompt3 pour le générateur, appliquer une passe de simplification.

**Question directrice** : Ce prompt est-il plus complexe que nécessaire pour obtenir l'image voulue ?

### Critères de suppression

**Adjectifs redondants** :
- "beautiful elegant prestigious" → garder "elegant" (le plus spécifique)
- "luxurious premium quality" → garder "premium" (le plus concret)
- "stunningly gorgeous" → supprimer (redondant, dilue le prompt)

**Descriptions qui répètent le prompt_core** :
- Prompt_core : "franco-belgian ligne claire editorial illustration, clean black outlines"
- Enrichissement : "clean black outlines with fine line weight"
- Simplification : Supprimer l'enrichissement (déjà dans prompt_core)

**Détails incompatibles avec le cadrage** :
- Concept : Plan large d'une salle
- Détail ajouté : "microscopically detailed fabric weave on the coat"
- Simplification : "tailored clothing with visible folds" (détail raisonnable pour le plan)
- Suppression : "microscopically detailed" (invisible au plan large)

**Descriptions de style implicite** :
- "with a sense of sophisticated elegance" → supprimer (implicite dans la composition et les matériaux)
- "exuding creative energy" → supprimer (montré via les expressions et gestes)

**Énumérations redondantes** :
- "brilliant, bright, radiant light" → remplacer par "bright light" (un qualificatif suffit)
- "warm, golden, amber-tinted shadows" → "warm amber tones" (moins d'énumération)

### Vérification de clarté

Après simplification, relire : "Le prompt reste-t-il clair ? Ai-je supprimé un terme qui change le sens ?"

**Exemple** :
- Original : "subtle soft warm light with golden tones on faces"
- Simplifié en trop : "warm light on faces" (OK, le sens reste)
- Simplifié en trop aggressif : "light on faces" (perdu la nuance "subtle soft warm")

### Règle de conservation

Conserver :
- Les termes spécifiques au concept (objets, personnes, actions)
- Les contraintes du style guide (même s'ils se répètent un peu -- assurer la cohérence)
- Les qualificatifs qui changent le sens (ex: "soft" vs "harsh", "subtle" vs "bold")

---

## Style compression : Injection du prompt_core

Le `prompt_core` est la clé obligatoire du style guide. C'est une phrase de 10-30 mots qui décrit la signature visuelle du projet.

### Mécanique d'injection

**Prompt3 = [prompt_core] + [contenu spécifique scène]**

Le prompt_core est **toujours injecté EN TÊTE**, avant tout autre contenu.

**Exemple feuilleton** :

Style guide définit :
```json
"prompt_core": "Franco-belgian ligne claire editorial illustration, clean black outlines with slightly variable weight, dominant flat colors with subtle localized shading, warm editorial atmosphere, 16:9 landscape."
```

Prompt3 pour la scène council :
```
Franco-belgian ligne claire editorial illustration, clean black outlines with
slightly variable weight, dominant flat colors with subtle localized shading,
warm editorial atmosphere, 16:9 landscape.

Three distinct characters seated around a sleek round table in animated
intellectual discussion, one leaning forward with open hands, one gesturing
with raised finger, one leaning back with crossed arms and skeptical expression,
in a contemporary glass-walled meeting room with warm wood accents and soft
city skyline visible through windows, documents and laptop on table.

Style : franco-belgian ligne claire, clean black outlines, flat colors with
subtle shading, polished editorial finish.

Lighting : soft natural lateral light from left through glass walls, warm golden
undertones on skin and wood, cool blue-gray reflections on glass.

Composition : medium shot at eye-level angle, triangular arrangement, strong
focal hierarchy on faces, balanced negative space, 16:9 landscape.
```

### Pourquoi EN TÊTE ?

Quand le générateur lit Prompt3, les premiers mots ont un poids plus élevé. En plaçant le prompt_core en première position, on garantit que le style est **dominant** et que les détails de scène ne le diluent pas.

**Comparaison** :

Mauvais (style à la fin) :
```
Three characters in a meeting room, animated discussion, hands visible,
soft light, documents on table... franco-belgian ligne claire, clean black
outlines, flat colors, editorial illustration.
```
→ Risk : le générateur peut commencer par "three characters in meeting room" et diverger avant d'avoir vu "franco-belgian"

Bon (style en tête) :
```
Franco-belgian ligne claire editorial illustration, clean black outlines,
flat colors with subtle shading... Three characters in a meeting room,
animated discussion, ...
```
→ Style appliqué d'abord, détails de scène suivent avec contrainte.

### Vérification d'injection

Avant de valider Prompt3, vérifier :
- [ ] prompt_core est présent et verbatim (aucune modification)
- [ ] prompt_core est EN TÊTE du Prompt3
- [ ] Aucune répétition du prompt_core ailleurs dans le prompt

---

## Score qualité : Évaluation heuristique

Après Prompt3, afficher un score d'auto-évaluation. Ce score aide l'utilisateur à décider s'il teste le prompt ou s'il itère d'abord.

### Les 3 axes

**Style** (0-10) :
- 10 : prompt_core présent, pas de contradiction avec le style guide, aucun terme interdit
- 8-9 : prompt_core présent, 1 terme ambigü mais convertible en positif
- 6-7 : prompt_core présent mais dilué (trop de détails surchargent le style)
- 4-5 : prompt_core absent ou modifié, style guidance faible
- 0-3 : prompt_core absent, nombreux termes interdits, style non respecté

**Scène** (0-10) :
- 10 : tous les éléments du concept traduits en détails concrets
- 8-9 : 90%+ des éléments traduits, 1 détail abstrait restant
- 6-7 : 70-80% traduit, quelques éléments manquent de clarté
- 4-5 : 50-70% traduit, plusieurs concepts abstraits non traduits
- 0-3 : < 50% du concept traduit, prompt très vague

**Faisabilité** (0-10) :
- 10 : aucun risque connu pour le générateur cible
- 8-9 : 1-2 risques mineurs (ex: mains en plan moyen pour Nano Banana)
- 6-7 : 1 risque modéré (ex: 3 personnages en gros plan, texture complexe)
- 4-5 : 2-3 risques modérés ou 1 risque élevé (ex: 4+ personnages avec mains en détail)
- 0-3 : risques élevés multiples, prompt possiblement non rendable par ce générateur

### Format d'affichage

```
Score qualité :
  style:       8/10  (prompt_core présent, pas de contradiction)
  scène:       9/10  (tous les éléments du concept traduits en détails concrets)
  faisabilité: 7/10  (3 personnages + mains visibles = risque modéré pour Nano Banana)

Recommandation : Score satisfaisant. Tester le prompt tel quel, ou itérer si
                 vous voulez réduire la complexité des mains.
```

### Interprétation pour l'utilisateur

**Score 7+ sur les 3 axes** : Prompt directement testable, bonne chance de succès
**Score 5-6 sur un ou plusieurs axes** : Prompt testable mais avec limitations. Iterate si insatisfait
**Score < 5 sur un axe** : Recommander une itération avant de tester

---

## Mapping feedback utilisateur → clés Prompt1

Après l'itération, l'utilisateur propose des modifications. Ce tableau mappe les 15 feedbacks les plus courants à la clé Prompt1 qu'ils impactent et le type de modification.

| Feedback utilisateur | Clés impactées | Type de modification | Exemple de transformation |
|----------------------|----------------|----------------------|----------------------------|
| "Plus de contraste" | `lighting`, `color` | Augmenter contraste lum. ou chromatique | "soft lateral light" → "stronger lateral light with deeper shadows" |
| "Change l'éclairage" | `lighting` | Modifier direction, intensité ou qualité | "lateral from left" → "from above and right, golden afternoon light" |
| "Ajoute un personnage" | `subject`, `composition` | Ajouter entité, réarranger spatial | Ajouter un 4e personnage, ajuster triangulation |
| "Plan plus large" | `camera` | Augmenter distance, montrer plus de contexte | "medium shot" → "wide shot", `setting` étendu |
| "Plan rapproché" | `camera`, `detail_density` | Réduire distance, augmenter détails | "medium shot" → "close-up", focus sur visages |
| "Ambiance plus chaude" | `color`, `lighting` | Augmenter teintes or/ambre | Ajouter "warm golden tones" si compatible style |
| "Ambiance plus froide" | `color`, `lighting` | Augmenter teintes bleu/gris | "warm tones" → "cool blue undertones" |
| "Plus de détails" | `detail_density`, `materials` | Enrichir objets, textures, expressions | Ajouter accessoires, affiner matériaux |
| "Moins de détails" | `detail_density`, `materials` | Simplifier background, réduire textures | "detailed background" → "simplified background" |
| "Change la scène" | `setting` | Remplacer lieu ou contexte | "meeting room" → "outdoor garden" |
| "Ajoute un objet" | `setting`, `materials` | Ajouter accessoire ou prop | Ajouter "computer monitor on desk" |
| "Change les couleurs" | `color` | Modifer palette (si compatible style guide) | "cool neutral" → "warmer palette with more amber" |
| "Plus expressif" | `action`, `detail_density` | Amplifier gestes, expressions, dynamique | "standing quietly" → "animated conversation with hand gestures" |
| "Moins dramatique" | `lighting`, `action`, `composition` | Réduire contraste, ombrage, dynamique | "dramatic cinematic" (converti) → "calm quiet atmosphere" |
| "Plus symétrique" | `composition` | Centrer éléments, équilibrer côtés | "triangular" → "symmetrical arrangement" |

### Comment utiliser ce mapping

Quand l'utilisateur dit "plus de contraste", le skill :
1. Consulte le mapping → clés `lighting` et `color`
2. Revient à Prompt2 ou Étape 3 (enrichissement)
3. Modifie : augmente les contrastes lum. ou chromatiques (si compatible style guide)
4. Reforme Prompt3 + recalcule le score
5. Affiche le nouveau Prompt3 + score + 3 nouvelles options

---

## Cas limites : Conversion négatif → positif

Quand un utilisateur utilise le négatif ("pas de cartoon", "sans texte"), le skill doit convertir en positif pour le générateur. Certains négatifs **n'ont pas d'équivalent positif naturel** et doivent être traités différemment.

### Négatifs facilement convertibles

| Négatif | Conversion positive | Exemple |
|---------|---------------------|---------|
| "not photorealistic" | "illustrated, stylized" | "Franco-belgian ligne claire" |
| "no speech bubbles" | (supprimer du prompt, pas besoin de mentionner) | Ne rien ajouter |
| "not anime" | "illustrated, line-based style" | "ligne claire" |
| "no neon colors" | "muted palette, natural colors" | "cool neutrals with warm accents" |
| "without text" | (supprimer du prompt) | Ne rien ajouter |
| "no heavy shadows" | "soft localized shading, subtle lighting" | Spécifier le style |
| "not cartoon exaggeration" | "expressive but credible proportions" | "realistic anatomy with stylized rendering" |

### Négatifs sans équivalent positif clair

Certains négatifs ne peuvent pas être convertis naturellement :

| Négatif | Problème | Stratégie |
|---------|----------|----------|
| "I don't want X [vague/abstrait]" | L'abstraction du négatif ne suggère pas d'alternatif | Demander clarification : "Qu'est-ce que tu préfères à la place ?" |
| "Not like previous version" | Référence à un autre rendu (pas un concept) | Demander : "Qu'est-ce que tu veux changer spécifiquement ?" |
| "Avoid anything weird" | Trop vague | Clarifier : "Quel type d'élément paraît 'weird' ?" |
| "Not too much [anything]" | Gradation imprécise | Demander : "Combien, concrètement ?" |

### Règle de conversion

**À TOUJOURS faire** :
1. Essayer de convertir en positif
2. Si conversion naturelle existe → utiliser
3. Si pas de conversion claire → signaler à l'utilisateur et demander clarification

**À JAMAIS faire** :
- Forcer une conversion qui change le sens original
- Ignorer le négatif et supposer un positif
- Ajouter du négatif au prompt3 si le générateur ne le supporte pas bien

**Exemple : Feuilleton LLM Council**

Utilisateur : "Pas d'ambiance dramatique, je veux quelque chose de calm"

Conversion :
- Négatif "dramatic" → Positif "calm intellectual atmosphere"
- Vérifier : compatible style guide ? (oui, "calm" et "intellectual" sont dans les ambiances autorisées)
- Intégrer dans Prompt3

Prompt3 final :
```
Franco-belgian ligne claire editorial illustration...

Three distinct characters seated around a sleek round table, calm intellectual
discussion, ...
```

---

## Résumé : Pipeline complet de vérification

| Étape | Passes | Verrous | Sorties |
|-------|--------|---------|---------|
| **1. Analyse** | 4 passes (fidélité → traduction → conformité → faisabilité) | Style guide a priorité | Concept validé, avertissements éventuels |
| **2. Prompt1** | Décomposition 10 clés | Clés verrouillées injectées | Squelette structuré |
| **3. Prompt2** | Enrichissement contraint | Pas de nouvel attribut style | Version enrichie, validée contre guardrails |
| **4. Prompt3+4** | Simplicité + style compression + formatage | prompt_core EN TÊTE | Prompt final + négatif + checklist + score |
| **5. Itération** | Feedback utilisateur | Mapping à clés et types | 3 options ou itération ciblée |

---

**Référence** : PRD-images-feuilleton.md (v5.0)
