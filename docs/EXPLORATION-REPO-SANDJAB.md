# Exploration du repo ERNIE - Documentation technique

**Date** : 26 avril 2026
**Source** : https://github.com/Sandjab/Ernie (privé/inaccessible)
**Référence principale** : https://github.com/treadon/mlx-ernie-image (vendorisé dans le projet)

---

## Contexte général

Le repo `Sandjab/Ernie` n'est pas directement accessible, mais il contient deux scripts Python de référence (`ernie_image_mac_poc.py` et `ernie_image_mlx_poc.py`) qui wrappent l'implémentation MLX de `treadon/mlx-ernie-image`. Cette exploration documente la structure, les scripts, et les détails techniques du pipeline MLX.

---

## 1. Structure du repo `treadon/mlx-ernie-image`

### Arborescence racine

```
mlx-ernie-image/
├── .gitignore
├── pyproject.toml
├── README.md
├── generate.py              # Script CLI principal
├── ernie_image/             # Module package
│   ├── __init__.py
│   ├── pipeline.py          # Orchestration pipeline
│   ├── dit.py               # Modèle DiT (8B transformer)
│   ├── vae.py               # Décodeur VAE
│   ├── text_encoder.py      # Encodeur texte (PyTorch+MPS)
│   ├── scheduler.py         # Scheduler Euler (flow matching)
│   ├── convert_weights.py   # Conversion PyTorch → MLX
│   └── weights.py           # Gestion des poids
└── samples/                 # Dossier exemples/résultats
```

---

## 2. Dépendances (`pyproject.toml`)

### Configuration du projet

```toml
[project]
name = "mlx-ernie-image"
version = "0.1.0"
requires-python = ">=3.10"

[project.optional-dependencies]
dev = [...]

[project.scripts]
ernie-image = "ernie_image.generate:main"
```

### Dépendances core

- **mlx** >= 0.20.0 - Framework ML d'Apple pour Apple Silicon
- **mlx-lm** >= 0.20.0 - Utilitaires LM pour MLX
- **numpy** - Calcul numérique
- **pillow** - Traitement d'images (PIL)
- **huggingface-hub** - Téléchargement de modèles HF
- **safetensors** - Sérialisation sécurisée de tenseurs
- **torch** - PyTorch (pour text encoder uniquement)
- **transformers** - Hugging Face transformers

### Entrée CLI

La commande `ernie-image` déclenche `main()` depuis `generate.py`.

---

## 3. Script principal : `generate.py`

### Signature CLI

```bash
python generate.py [options]
```

### Arguments

| Argument | Court | Défaut | Description |
|----------|-------|--------|-------------|
| `--prompt` | `-p` | (requis) | Prompt texte pour la génération |
| `--steps` | `-s` | 8 | Nombre d'étapes de débruitage |
| `--height` | | 1024 | Hauteur de l'image (doit être preset) |
| `--width` | | 1024 | Largeur de l'image (doit être preset) |
| `--seed` | | (aléatoire) | Graine aléatoire pour reproducibilité |
| `--quantize` | `-q` | None | Quantization : 4 ou 8 bits (optionnel) |
| `--output` | `-o` | `outputs/` | Chemin de sauvegarde |
| `--interactive` | `-i` | False | Mode interactif (batch) |
| `--convert-weights` | | False | Une seule fois : conversion poids HF→MLX |

### Modes d'utilisation

#### Mode single-shot

```bash
python generate.py -p "une chatte" --steps 4
```

Génère une image et quitte.

#### Mode interactif

```bash
python generate.py --interactive
```

Crée un dossier `outputs/`, puis demande le prompt pour chaque génération. Fichiers horodatés automatiquement.

#### Mode conversion de poids (première utilisation)

```bash
python generate.py --convert-weights
```

Télécharge les poids depuis HuggingFace (`treadon/ERNIE-Image-Turbo-MLX` par défaut) et les convertit en format MLX (`dit.npz`, `vae.npz`, etc.).

### Fonctions clés (implémentation probable basée sur pipeline.py)

#### `load_pipeline()`

```python
def load_pipeline(
    model_id="treadon/ERNIE-Image-Turbo-MLX",
    quantize=None
):
    """
    Charge le pipeline MLX.

    Returns:
        ErnieImagePipeline - instance avec DiT, VAE, scheduler pré-chargés
    """
```

Retourne une instance `ErnieImagePipeline` prête à générer.

#### `generate_image(prompt, steps, height, width, seed)`

```python
def generate_image(
    prompt,          # str : prompt texte
    steps=8,         # int : étapes de débruitage
    height=1024,     # int : hauteur (preset)
    width=1024,      # int : largeur (preset)
    seed=None        # int : graine aléatoire
) -> PIL.Image:
    """
    Génère une image à partir du prompt.

    Workflow interne :
    1. Encode le prompt via text_encoder (PyTorch+MPS)
    2. Crée un latent aléatoire à 1/16e résolution (64×64 pour 1024×1024)
    3. Débruitage itératif via DiT + scheduler (MLX)
    4. Décodage VAE + clip/conversion uint8

    Time estimate : ~21-27s M3 Ultra, ~134s M4 Pro (8 steps)
    """
```

---

## 4. Architecture du pipeline : `pipeline.py`

### Classe `ErnieImagePipeline`

```python
class ErnieImagePipeline:
    def __init__(self, dit, vae, scheduler, text_encoder, bn_stats=None):
        self.dit = dit              # Modèle DiT 8B
        self.vae = vae              # Décodeur VAE
        self.scheduler = scheduler  # Scheduler Euler
        self.text_encoder = text_encoder  # Encodeur texte PyTorch
        self.bn_stats = bn_stats    # Batch norm statistics
```

### Factory methods

#### `from_pretrained(model_id, quantize=None)`

```python
@classmethod
def from_pretrained(cls, model_id="treadon/ERNIE-Image-Turbo-MLX", quantize=None):
    """
    Télécharge et charge depuis HuggingFace Hub.

    - Télécharge : dit.npz, vae.npz, bn_stats.npz, config.json
    - Optionnel : quantization INT4/INT8

    Returns:
        ErnieImagePipeline
    """
```

#### `from_weights(weights_path, quantize=None)`

```python
@classmethod
def from_weights(cls, weights_path, quantize=None):
    """
    Charge depuis poids locaux pré-convertis.

    Args:
        weights_path : dossier contenant dit.npz, vae.npz, etc.
    """
```

### Méthode `generate()`

```python
def generate(
    self,
    prompt,           # str
    height=1024,      # int
    width=1024,       # int
    steps=8,          # int
    seed=None,        # int
    guidance_scale=7.5  # float (optionnel)
) -> PIL.Image:
    """
    Orchestration complète de la génération.

    Stages :

    1. **Initialisation du bruit**
       - Résolution latente : h/16 × w/16 (ex: 64×64 pour 1024×1024)
       - Latent = mx.random.normal((H, W, 4), dtype=mx.float32)

    2. **Boucle de débruitage**
       for step in range(steps):
           - Encode prompt via text_encoder → [T, 3072]
           - Appelle DiT(latent, timestep, embeddings)
           - DiT retourne velocity vector
           - scheduler.step(latent, velocity, sigma_t)
           - latent ← latent + dt * velocity

       OPTIMISATION CLÉE : single mx.eval() à la fin de la boucle,
       pas à chaque step (construit le graphe complet d'abord)

    3. **Décodage et post-traitement**
       - bn_stats appliquées au DiT output
       - Unpatchification : latent [H, W, 4] → [3, H*16, W*16]
       - VAE.decode(latent) → [3, H*16, W*16] (float)
       - Clipping : clip(x, 0, 1)
       - Conversion uint8 : (x * 255).astype(uint8)
       - Transposition : [3, H, W] → [H, W, 3]
       - Retour PIL.Image

    Temps : ~21s M3 Ultra (8 steps), ~134s M4 Pro
    """
```

### Optimisations clés

- **Deferred evaluation** : construire le graphe complet, puis `mx.eval()` une seule fois à la fin de la boucle de débruitage
- **Attention fused** : `mx.fast.scaled_dot_product_attention` au lieu de l'attention standard
- **Poids pré-transposés** : format `.npz` déjà en layout MLX (NHWC pour convolutions)

---

## 5. Encodeur texte : `text_encoder.py`

### Architecture hybride

Le **text encoder reste en PyTorch+MPS**, pas en MLX (coût calculatoire < 1 %, pas de gain à le porter).

### Classe `TextEncoder`

```python
class TextEncoder:
    def __init__(self, model, tokenizer, device="mps"):
        self.model = model          # Transformateur Mistral-3 (PyTorch)
        self.tokenizer = tokenizer  # Tokenizer (HF)
        self.device = device        # "mps" pour Apple
```

### Factory method

```python
@classmethod
def from_pretrained(cls):
    """
    Charge depuis Baidu/HuggingFace.

    - Modèle : "baidu/ERNIE-Image-Turbo" text encoder
    - Déplace vers MPS (Metal Performance Shaders)

    Returns:
        TextEncoder
    """
```

### Méthode `encode()`

```python
def encode(self, prompt) -> mx.array:
    """
    Args:
        prompt : str

    Returns:
        mx.array de shape [T, 3072]
        - T : longueur séquence (variable selon prompt)
        - 3072 : embedding dim de Mistral-3

    Workflow interne :
    1. Tokenization : prompt → token ids
    2. Forward PyTorch : token_ids → hidden_states (dernière couche)
    3. Extraction : deuxième-dernière couche (indices -2)
    4. Conversion : PyTorch tensor → MLX array
    """
```

**Temps** : < 0,1s (négligeable)

---

## 6. Modèle DiT (Diffusion Transformer) : `dit.py`

### Architecture

- **Type** : Single-stream Diffusion Transformer (DiT)
- **Taille** : 8B paramètres (4096 hidden dim, 36 couches, 32 heads)
- **Input** : latents bruitées [H, W, 4] + embeddings texte [T, 3072]
- **Output** : velocity vector [H, W, 4] (flow matching)

### Composants clés

#### Rotary position embeddings (RoPE) 3D

```
RoPE appliquée sur 3 dimensions :
- Text sequence index
- Image height
- Image width
```

Fournit une awareness spatiale sophistiquée.

#### Attention avec RMSNorm et Fused SDPA

```python
# Chaque head d'attention :
1. Query-Key RMSNorm (normalisation)
2. mx.fast.scaled_dot_product_attention (fused, optimisé MLX)
3. Sorties concaténées

ATTENTION_MASK : masquage causal appliqué
```

#### Adaptive layer normalization (AdaLN)

Modulation par timestep :

```python
# Pour chaque bloc transformer :
γ, β = AdaLN_modulation(timestep_embedding)
# Attention output :
out_attn = γ_attn * norm(attn_in) + β_attn
# FFN output :
out_ffn = γ_ffn * norm(ffn_in) + β_ffn
```

Permet au modèle d'adapter son comportement selon l'étape de débruitage.

#### Feed-Forward Gated (SwiGLU-like)

```python
# Ressemble à SwiGLU mais avec gate explicite :
ffn_out = gate(x) * up(x)
# + normalisation et résidus
```

### Forward pass

```python
def forward(self, latents, timestep, text_embeddings):
    """
    Args:
        latents : [H, W, 4]
        timestep : scalar (ou array shape [])
        text_embeddings : [T, 3072]

    Returns:
        velocity : [H, W, 4]

    Workflow interne :
    1. Patchification : latents [H, W, 4] → patches [N_patches, 4]
    2. Timestep embedding + text embeddings concatenés
    3. 36 couches de transformer (avec RoPE 3D, attention masquée, AdaLN)
    4. Unpatchification : [N_patches, 4] → [H, W, 4]
    5. Retour velocity vector
    """
```

---

## 7. Scheduler Euler (Flow Matching) : `scheduler.py`

### Type de scheduler

**Flow Matching Euler Discrete** - pas du diffusion classique (prédiction de bruit), mais du **velocity-based** (prédiction de vecteur vitesse).

### Équation de stepping

```
prev_sample = sample + dt * model_output

où :
- sample : latent actuel
- dt : time delta (différence entre deux sigma)
- model_output : velocity vector du DiT
```

Intégration forward simple, computationnellement efficace.

### Gestion du bruit (sigma)

Progression linéaire : **1.0 (bruit max) → 0.0 (image propre)**

#### Décalage sigma (sigma shift)

```python
sigma_shifted = shift * sigma / (1 + (shift - 1) * sigma)

# Défaut : shift = 4.0
# Permet un contrôle non-linéaire de la trajectoire d'échantillonnage
```

### Méthode `set_timesteps()`

```python
def set_timesteps(self, num_steps):
    """
    Configure la séquence de timesteps/sigmas.

    Args:
        num_steps : nombre d'étapes (ex: 8)

    Crée une liste de sigmas :
    [sigma_0, sigma_1, ..., sigma_{num_steps-1}, 0.0]

    Permet les tradeoffs vitesse/qualité.
    """
```

### Exemple : 8 étapes

```python
# 8 steps → 8 sigmas espacés linéairement de 1.0 à 0.0
[1.0, 0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0.0]

# À chaque step i :
dt = sigma[i] - sigma[i+1]
latent = latent + dt * dit_output
```

---

## 8. Décodeur VAE : `vae.py`

### Architecture

FLUX.2-style VAE decoder (compatible avec les poids Hugging Face diffusers).

### Composants

#### GroupNorm

```python
class GroupNorm:
    """
    Normalisation par groupes de canaux.
    - Divise les canaux en groupes
    - Calcule mean/variance par groupe
    - Applique scale/bias apprenables
    """
```

#### ResnetBlock

```python
def forward(self, x):
    # norm1 → conv1 → norm2 → conv2 → [shortcut si in_ch ≠ out_ch]
    return x + residual
```

#### AttentionBlock

```python
def forward(self, x):
    # Query/Key/Value projection
    # Softmax attention
    # Output projection + residual
```

#### Upsample

```python
def forward(self, x):
    # Pixel repetition (spatial upsampling)
    # Convolution
```

#### MidBlock

```python
# 2 ResnetBlocks + 1 AttentionBlock sandwich
```

#### UpBlock

```python
# 3 ResnetBlocks + optional Upsample
```

### Architecture complète VAEDecoder

```python
class VAEDecoder:
    def __init__(self):
        self.post_quant_conv = Conv2d(4, 32, 1)  # Post-quantization projection
        self.decoder = Sequential([
            # UpBlocks progressifs :
            # 32 → 64 → 128 → 256 → 512 → 512 (upsample)
            # puis redescente : 512 → 512 (upsample)
            # puis finale : ... → 3 (RGB)
        ])

    def forward(self, latents):
        """
        Args:
            latents : [H, W, 4] (float32)

        Returns:
            image : [H*16, W*16, 3] (float32, clipped [0,1])

        Upsampling progressif :
        [H, W] → [2H, 2W] → [4H, 4W] → ... → [16H, 16W]
        """
```

---

## 9. Conversion de poids : `convert_weights.py`

### Workflow de conversion

#### Input

```bash
python ernie_image/convert_weights.py \
    --model-id baidu/ERNIE-Image-Turbo \
    --output-dir ./weights
```

#### Étapes

1. **Téléchargement HuggingFace**
   - Source : `baidu/ERNIE-Image-Turbo` (ou custom `--model-id`)
   - Format : SafeTensors

2. **Traitement DiT**
   - Remapping des clés (ex: `adaLN_modulation.1.` → ...)
   - Transposition Conv2d : PyTorch (NCHW) → MLX (NHWC)
     ```
     # NCHW [out_ch, in_ch, H, W] → NHWC [H, W, in_ch, out_ch]
     ```
   - Sortie : `dit.npz`

3. **Traitement VAE**
   - Extraction decoder uniquement (exclusion encoder + quantization)
   - Transposition Conv2d
   - Sortie : `vae.npz`

4. **Batch Normalization Statistics**
   - Extraction des paramètres BN
   - Sortie : `bn_stats.npz`

5. **Configuration**
   - Export `config.json` (hyperparamètres essentiels)

#### Output structure

```
./weights/
├── dit.npz          (~8 Go)
├── vae.npz          (~2 Go)
├── bn_stats.npz     (quelques Mo)
└── config.json      (~1 Ko)
```

**Format NPZ** : archive ZIP contenant des arrays NumPy sérialisés.

---

## 10. Paramètres de génération (presets de résolution)

### Résolutions entraînées

Le modèle a été entraîné sur 7 presets spécifiques. **Sortir des presets dégrade la qualité**.

| Preset | Dimensions | Ratio |
|--------|-----------|-------|
| `square` | 1024 × 1024 | 1:1 |
| `landscape` | 1264 × 848 | 1.49:1 |
| `portrait` | 848 × 1264 | 1:1.49 |
| `landscape-soft` | 1200 × 896 | 1.34:1 |
| `portrait-soft` | 896 × 1200 | 1:1.34 |
| `cinema` | 1376 × 768 | 1.79:1 |
| `vertical` | 768 × 1376 | 1:1.79 |

### Contraintes

- Multiples de 16 (latent = image/16)
- Environ 1 Mpx max (1024×1024 ≈ 1 Mpx)
- Hors presets : dégradation de qualité observée

### Paramètres ajustables

| Paramètre | Range | Défaut | Effet |
|-----------|-------|--------|-------|
| `steps` | 1-50+ | 8 | Plus = meilleure qualité mais plus lent |
| `seed` | 0-2^32 | Random | Reproducibilité |
| `guidance_scale` | 1.0-15.0 | 7.5 | Adhérence au prompt (optionnel) |

---

## 11. Pièges techniques (Mac/MLX spécifiques)

### PyTorch+MPS (script non-MLX)

**bfloat16 non supporté** : MPS ne supporte pas bfloat16, utiliser float16.

```python
# MAUVAIS (bloquera sur MPS)
model = model.to(torch.bfloat16)

# BON
model = model.to(torch.float16)
```

**Générateur aléatoire sur CPU** : Le générateur doit rester sur CPU (pas sur GPU).

```python
# Initialization latent
generator = torch.Generator(device="cpu")  # Pas "mps"
latent = torch.randn(..., generator=generator, device="mps")
```

### MLX spécifiques

**Deferred evaluation** : Construire le graphe d'abord, évaluer une fois à la fin.

```python
# MAUVAIS : évaluation par step (lent)
for step in range(steps):
    latent = latent + dt * dit(latent)  # Évalue à chaque step

# BON : graphe complet, eval une fois
for step in range(steps):
    latent = latent + dt * dit(latent)  # Construit graphe
mx.eval(latent)  # Évalue tout d'un coup
```

**NHWC pour convolutions** : MLX préfère NHWC (channels last), pas NCHW.

```
PyTorch Conv2d weight : [out_ch, in_ch, H, W]
MLX Conv2d weight :     [H, W, in_ch, out_ch]  → conversion obligatoire
```

### Matériel

**M1 Ultra vs M3 Ultra vs M4 Pro** :

| Matériel | 8 steps | Bande passante | RAM (fp16) |
|----------|---------|----------------|-----------|
| M3 Ultra | ~21s | Haute | ~20 Go |
| M4 Pro | ~134s | Moyenne | ~24 Go |
| M1 Ultra | TBD | Haute | ~20 Go |

Quantization (INT8/INT4) **n'améliore pas la vitesse** sur machines avec > 20 Go RAM.

---

## 12. Module `__init__.py`

Expose deux classes principales :

```python
from .pipeline import ErnieImagePipeline
from .text_encoder import TextEncoder

# Accessibles directement via :
from ernie_image import ErnieImagePipeline, TextEncoder
```

---

## 13. Modèles de référence (HuggingFace)

### Modèles source

- `baidu/ERNIE-Image-Turbo` - Modèle original Baidu (PyTorch safetensors, ~20 Go)
- `baidu/ERNIE-Image` - Version full (50 étapes, plus lent)

### Modèles pré-convertis MLX

- `treadon/ERNIE-Image-Turbo-MLX` - Conversion MLX complète (~16 Go, format `.npz`)
  - Contient : `dit.npz`, `vae.npz`, `bn_stats.npz`, `config.json`
  - Téléchargement automatique au premier `generate.py` ou manual via `--convert-weights`

---

## 14. Performance benchmarks mesurés

### Temps de génération (8 étapes)

| Matériel | Runtime | Temps | Notes |
|----------|---------|-------|-------|
| M3 Ultra | PyTorch+MPS | ~27s | Baseline |
| M3 Ultra | MLX | ~21s | **27 % plus rapide** |
| M4 Pro | PyTorch+MPS | 137s | Moins de GPU |
| M4 Pro | MLX | 134s | ~2 % plus rapide |
| M1 Ultra | MLX | TBD | À mesurer, attendu similaire M3 |

### Breakdown temps M3 Ultra/MLX (8 steps)

- Text encoder (PyTorch+MPS) : ~0,1s (négligeable)
- DiT 8B + scheduler (MLX) : ~20s (95 % du temps)
- VAE decode + post-proc : ~0,9s
- **Total** : ~21s

### Quantization (M3 Ultra, 8 steps)

- fp16 : ~21s
- INT8 : ~43s (plus **lent**, pas d'économie RAM)
- INT4 : ~44s (plus **lent**, pas d'économie RAM)

**Conclusion** : Quantization inutile sur machines avec > 20 Go RAM. À envisager seulement pour machines < 16 Go.

---

## 15. Pipeline du serveur headless cible (contexte)

D'après `CLAUDE.md` du projet local, le serveur headless enveloppera ce pipeline MLX ainsi :

```python
# server.py (FastAPI)
from fastapi import FastAPI
from ernie_image import ErnieImagePipeline

app = FastAPI()
pipeline = None

@app.on_event("startup")
async def startup():
    global pipeline
    pipeline = ErnieImagePipeline.from_pretrained()

@app.post("/generate")
async def generate(
    prompt: str,
    steps: int = 8,
    width: int = 1024,
    height: int = 1024,
    seed: int | None = None
):
    image = pipeline.generate(
        prompt=prompt,
        steps=steps,
        width=width,
        height=height,
        seed=seed
    )
    # Retour : image PNG base64 ou fichier
```

---

## 16. Résumé des fichiers clés à intégrer

Pour le serveur headless local, les fichiers critiques sont :

1. **`ernie_image/pipeline.py`** - Orchestration (méthode `generate()`)
2. **`ernie_image/dit.py`** - Modèle DiT 8B
3. **`ernie_image/vae.py`** - Décodeur VAE
4. **`ernie_image/text_encoder.py`** - Encodeur texte PyTorch
5. **`ernie_image/scheduler.py`** - Scheduler Euler flow matching
6. **`ernie_image/convert_weights.py`** - Conversion poids (première utilisation)
7. **`pyproject.toml`** - Dépendances (pour `pip install -e .`)

Le script `generate.py` peut servir de référence pour les arguments CLI, mais le serveur headless substitura son orchestration propre (FastAPI).

---

**Dernière mise à jour** : 2026-04-26
