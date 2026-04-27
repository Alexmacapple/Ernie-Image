# Prompts Ernie Studio - série mélodrame pop espagnol

## Usage

Chaque prompt principal est rédigé en anglais pour mieux guider ERNIE-Image.

Le negative prompt ci-dessous n'est pas un vrai champ séparé tant que le backend reste MLX. Pour les tests actuels, il faut l'ajouter à la fin du prompt principal sous forme de contraintes textuelles, ou l'utiliser comme référence de motifs à éviter.

Pour comparer correctement deux versions :

1. Garder la même seed.
2. Garder le même format.
3. Garder le même nombre d'étapes.
4. Générer une version sans contraintes.
5. Générer une version avec les blocs de contraintes.

## Negative prompt

```text
Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## Bloc de contraintes à ajouter en MLX

```text
Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

---

## 1. Poster - La cuisine rouge

```text
Cinematic poster - a Spanish mother in a red dress preparing an extravagant cake in a pink and turquoise Madrid kitchen, intense gaze toward the camera. Vertical composition, waist-up shot, slight low angle, deep background with geometric tiles. Warm late-afternoon light from a side window, theatrical shadows. Glossy textures: red plastic, turquoise ceramic, floral tablecloths, overripe fruit. Visible French text in the image: "LA CUISINE DU DÉSIR", at the top, condensed white typography.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 2. Photo éditoriale - Salon fuchsia

```text
Editorial photo - two Mediterranean women sitting back-to-back on a bottle-green sofa in a fuchsia living room, silent emotional tension. Symmetrical composition, wide frontal shot, saturated decor with paintings, flowers, and yellow curtains. Soft but contrasty light, domestic theater atmosphere. Textures: velvet, colored glass, lacquered wall, floral textile. Visible French text in the image: "MAISON OUVERTE", bottom right, elegant serif type.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 3. Affiche - Fleuriste nocturne

```text
Film poster - a Spanish florist crossing a Madrid street with a huge red bouquet in the rain, wearing an electric blue suit. Vertical composition, cowboy shot, narrow European street perspective, depth with colorful shop windows. Warm night lighting, reflections on wet cobblestones, discreet Spanish signs. Textures: wet petals, glossy cobblestones, satin fabric. Visible French text in the image: "DES FLEURS POUR PERSONNE", centered at the bottom, large yellow capitals.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 4. Illustration éditoriale - Tribunal pop

```text
Editorial illustration - an Andalusian lawyer pleading in a courtroom transformed into a pop set, black robe, red fan placed on the lectern. Frontal composition, slightly low angle, strong geometric lines, centered character. Hard white light with red and pink halos. Textures: varnished wood, thick paper, lacquered red, mosaic floor. Visible French text in the image: "VERDICT ROSE", at the top, massive black typography.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 5. Comic panel - Dispute au balcon

```text
Comic panel - two Spanish neighbors arguing from two balconies covered with bougainvillea, colorful dresses, dramatic expressions. Horizontal composition, low-angle view from the street, saffron-yellow facade and turquoise shutters. Very bright midday light, sharp Mediterranean shadows. Textures: plastered walls, flowering plants, polka-dot fabrics, wrought iron. Visible French text in the image: "NE ME MENS PAS !", red speech bubble in the upper left.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 6. Poster - Taxi vers Valencia

```text
Cinematic poster - a young Spanish singer in a yellow taxi, blue makeup, pink dress, holding an audio cassette. Tight composition through the window, European city reflections, driver blurred in the foreground. Orange and magenta twilight light, urban melodrama mood. Textures: vinyl seat, wet glass, glossy lipstick, chrome metal. Visible French text in the image: "CASSETTE MAGENTA", at the top, white italic type.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 7. Photo mode - Patio bleu

```text
Fashion photo - a Spanish man in a white suit walking through a cobalt-blue Andalusian patio filled with red and yellow plants. Full-body composition, vertical framing, deep arcades, subject offset to the left. Harsh sunlight, graphic shadows on the walls. Textures: blue limewash, painted ceramic, white linen, glossy leaves. Visible French text in the image: "PATIO INTÉRIEUR", small title at the bottom, minimalist red typography.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 8. Affiche rétro - Studio radio

```text
Retro poster - a Spanish radio host speaking into a chrome microphone, red headphones, studio filled with colorful buttons and artificial flowers. Close-up composition, frontal camera, shallow depth, dense but readable background. Warm tungsten light, red and yellow reflections, 1980s atmosphere. Textures: chrome metal, colored plastic, vinyl, geometric wallpaper. Visible French text in the image: "ONDES DU CŒUR", arched above the face.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 9. Illustration - Pharmacie sentimentale

```text
Editorial illustration - a Mediterranean pharmacist arranging pink, red, and turquoise medicine boxes, melancholic expression. Slight overhead composition, highly graphic shelf lines, character at the center of a repeating pattern. Clinical light softened by pink neon. Textures: printed cardboard, frosted glass, white coat, glossy counter. Visible French text in the image: "DOSE D'AMOUR", on a box in the foreground, crisp pharmaceutical typography.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```

## 10. Poster - Dernier train

```text
Pop melodrama poster - a Spanish woman in a red coat waiting alone on a European train platform, yellow suitcase, pink flowers at her feet. Vertical composition, wide shot, railway vanishing point, small but highly colorful character. Golden dawn light, light mist, red-yellow-turquoise contrast. Textures: painted metal, suitcase leather, fresh flowers, old tiles. Visible French text in the image: "LE DERNIER QUAI", large white title at the bottom.

Visual constraints: Spanish and Mediterranean setting only, Latin alphabet French poster text only, European Madrid/Valencia architecture, contemporary Spanish clothing, cinematic photographic style.

Avoid visual motifs: Chinese characters, Chinese calligraphy, red lanterns, pagoda, hanfu, qipao, Tang suit, anime style, East Asian street signs, Asian neon megacity, bamboo forest.
```
