# Intégrer le negative prompt dans Ernie Studio

## Situation actuelle

Ernie Studio utilise actuellement le backend MLX. Ce backend ne supporte pas de vrai champ séparé `negative_prompt`.

Le negative prompt doit donc être intégré dans le prompt principal sous forme de contraintes textuelles.

## Bloc à ajouter à la fin de chaque prompt

```text
Visual constraints: Spanish and Mediterranean setting only, Latin alphabet Spanish signage only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## Exemple d’intégration

```text
Cinematic poster - a Spanish mother in a red dress preparing an extravagant cake in a pink and turquoise Madrid kitchen, intense gaze toward the camera. Vertical composition, waist-up shot, slight low angle, deep background with geometric tiles. Warm late-afternoon light from a side window, theatrical shadows. Glossy textures: red plastic, turquoise ceramic, floral tablecloths, overripe fruit. Text: "LA COCINA DEL DESEO", at the top, condensed white typography.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet Spanish signage only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## Méthode de test

Pour mesurer l’effet correctement :

1. Garder la même seed.
2. Garder le même format.
3. Garder le même nombre d’étapes.
4. Générer une version sans contraintes.
5. Générer une version avec les blocs `Visual constraints` et `Avoid visual motifs`.
6. Comparer uniquement la différence visuelle liée au prompt.

## Version future avec Diffusers

Si Ernie Studio passe un jour sur un backend Diffusers, le negative prompt pourra devenir un vrai champ séparé :

```json
{
  "prompt": "Cinematic poster - a Spanish mother in a red dress...",
  "negative_prompt": "Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest."
}
```

Tant que le backend reste MLX, il faut conserver le negative prompt dans le prompt principal.
