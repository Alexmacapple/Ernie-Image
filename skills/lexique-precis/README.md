# /lexique-precis

Transforme un mot vague en palette de graines sémantiques multilingues pour enrichir les prompts IA.

---

## Pourquoi

Quand on demande à l'IA d'« analyser » un document, on obtient du générique. Quand on remplace par « ostranenie », « Aufheben » ou « tamisage », on active des architectures de pensée que le modèle n'explorerait jamais spontanément. Le problème : on ne connaît pas ces mots. Ce skill les trouve pour toi.

## Usage

```
/lexique-precis "analyser"
/lexique-precis "résumer"
/lexique-precis "prendre de la hauteur"
```

Sans argument, le skill demande le mot à explorer.

## Sortie

3 mouvements produits en une seule réponse :

1. **Cartographie des registres** — tableau de 15+ termes (courant, soutenu, technique, étranger, savant) avec langue, attestation et exemple de prompt pour chaque terme
2. **Pépites rares** — 3+ termes à forte densité sémantique avec explication de ce qu'ils condensent
3. **Graines de prompts** — 3-5 patrons de formulation directement copiables dans un prompt

## Quand l'utiliser

- Avant de rédiger un prompt important (remplacer « analyse » par un mot qui active un résultat différent)
- En préparation d'une formation ou d'une présentation (trouver le mot juste)
- Avant `/meta-prompt-concept` (candidats pour la phrase d'identité du concept)
- Pour enrichir un prompt `/qwen-image` ou `/prompt-image` (alternatives visuelles précises)
- En amont de `/chain-of-density` (termes denses pour remplacer les formulations longues)
- Quand le vocabulaire de prompting tourne en boucle (« analyse », « résume », « améliore »)

## Exemple

```
/lexique-precis "résumer"
```

Extrait de la sortie :

| Terme | Langue | Attestation | Apport différentiel |
|-------|--------|-------------|---------------------|
| Condenser | Français | [attesté] | Réduire le volume en gardant la substance |
| Verdichten | Allemand | [attesté] | Densifier poétiquement — comprimer en augmentant la densité de sens |
| Épitomé | Grec/latin | [attesté] | Fragment autonome qui capture l'essence d'une oeuvre entière |

Graine : « Verdichte cette analyse : chaque phrase doit porter plus de sens que le paragraphe qu'elle remplace »

## Archivage

Après chaque exploration, le skill propose d'archiver le dictionnaire dans `dictionnaires/`. L'archivage est optionnel — les dictionnaires cumulés forment un gold standard pour calibrer les futures explorations.

## Limites

- Outil d'exploration créative, pas référence lexicographique — vérifier les termes critiques sur Wiktionnaire ou TLFi
- Les termes marqués `[construction proposée]` sont morphologiquement cohérents mais non attestés
- Coût par invocation : environ 3000 tokens (500 entrée + 2500 sortie)

## Références

- PRD : `prd-meta-workflow/PRD-102-skill-lexique-precis.MD`
- Guide pédagogique : `docs-public/guide-lexique-precis.md`
- Dictionnaire de référence : `dictionnaires/analyser-2026-04-12.md`
