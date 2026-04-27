# Pipeline de production de prompts ERNIE Studio — version longue

Utilise les skills dans cet ordre strict. Lire chaque `SKILL.md` avant d'exécuter l'étape correspondante. Ne pas sauter d'étape, ne pas fusionner les étapes.

---

## Étape 0 — Lexique précis

**Skill** : `skills/lexique-precis/SKILL.md`

**Objectif** : identifier les mots vagues dans le concept fourni et les remplacer par des graines sémantiques à haute densité visuelle.

**Consignes d'exécution** :

- Ne produire que 2 à 3 graines retenues, pas un tableau de 15 termes
- Pour chaque graine : nom du terme + langue d'origine + pourquoi ce terme active des pixels que le mot original n'activerait pas (1 phrase max)
- Privilégier les emprunts étrangers et termes techniques qui contraignent le modèle vers une direction précise
- Écarter les termes dont l'apport différentiel est une paraphrase du concept

**Sortie attendue** :

```
Graines retenues :
1. [terme] ([langue]) — [apport différentiel en une phrase]
2. [terme] ([langue]) — [apport différentiel en une phrase]
3. [terme] ([langue]) — [apport différentiel en une phrase]  (optionnel)
```

---

## Étape 1 — Structuration du prompt

**Skill** : `skills/prompt-image/SKILL.md --gen ernie`

**Objectif** : traduire le concept en prompt ERNIE structuré en blocs, en injectant les graines de l'étape 0.

**Consignes d'exécution** :

- Lire le concept + les graines retenues à l'étape 0
- Injecter les graines dans les blocs où elles ont le plus d'effet (souvent `[Sujet]`, `[Texture]` ou `[Composition]`)
- Respecter les 6 blocs obligatoires :

| Bloc | Contenu |
|------|---------|
| `[Type]` | Genre photographique ou pictural |
| `[Sujet]` | Description du sujet principal avec ses attributs |
| `[Composition]` | Cadrage, profondeur de champ, angle |
| `[Lumière]` | Source, qualité, direction, couleur dominante |
| `[Texture]` | Rendu matière, grain, finish |
| `[Texte]` | Présence ou absence de texte dans l'image |

- Ajouter une ligne `Visual anchor:` en anglais (fragment insérable dans ERNIE Studio)
- Anti-biais : chaque bloc décrit ce qui **doit** être visible, jamais ce qui ne doit pas l'être
- Longueur cible : 80-120 mots pour le prompt complet

**Sortie attendue** :

```
[Type] ...
[Sujet] ...
[Composition] ...
[Lumière] ...
[Texture] ...
[Texte] ...
Visual anchor: ...
```

---

## Étape 2 — Adaptation ERNIE / MLX

**Skill** : `skills/ernie-image/SKILL.md`  
**Fichier** : `skills/ernie-image/REFERENCE.md` (lire en entier avant d'agir)

**Objectif** : adapter le prompt de l'étape 1 aux contraintes du moteur ERNIE Studio / MLX et vérifier la cohérence avec les presets canoniques.

**Consignes d'exécution** :

- Vérifier que chaque bloc ne contient que des éléments positifs et visibles
- Supprimer tout ce qui ressemble à un `negative_prompt` déguisé (liste de termes à éviter, formulations "sans X", "ne pas inclure")
- Vérifier que le `Visual anchor` commence bien par `Visual anchor:`
- Ne pas ajouter `guidance_scale`, `use_pe`, `cfg_scale` ou tout paramètre moteur dans le prompt — ces paramètres sont gérés par l'UI, pas par le texte
- Consulter `REFERENCE.md` pour vérifier que le style du prompt est cohérent avec les presets existants (vocabulaire, structure)
- Si le prompt contient du texte à rendre visible dans l'image : inclure `exact French text in Latin alphabet`, `clean readable lettering` et si pertinent `accents preserved`

**Sortie attendue** :

```
Prompt ERNIE final (version MLX-compatible) :
[Type] ...
[Sujet] ...
[Composition] ...
[Lumière] ...
[Texture] ...
[Texte] ...
Visual anchor: ...
```

---

## Étape 3 — Verdict preset

**Skill** : `skills/ernie-studio-presets/SKILL.md`  
**Fichier** : `skills/ernie-image/REFERENCE.md` (source canonique des presets)

**Objectif** : déterminer si un preset existant dans ERNIE Studio est pertinent pour ce prompt, et si oui lequel activer.

**Consignes d'exécution** :

- Lire la liste des presets canoniques dans `REFERENCE.md`
- Comparer le `Visual anchor` du prompt avec les fragments d'ancrage des presets
- Critère de pertinence : le preset renforce le prompt sans le contredire
- Si pertinent : indiquer le libellé UI exact (tel qu'il apparaît dans le front) et le fragment d'ancrage qui sera injecté
- Si aucun preset ne correspond : répondre N/A sans en inventer un

**Sortie attendue** :

```
Preset : [libellé UI exact] — fragment : "..."
```
ou
```
Preset : N/A
```

---

## Concept à traiter

```
[IDÉE IMAGE]
```

---

## Sortie finale attendue

Structurer la réponse en 4 blocs séparés :

1. **Étape 0** — graines retenues
2. **Étapes 1-2** — prompt ERNIE final (blocs + Visual anchor)
3. **Étape 3** — verdict preset
