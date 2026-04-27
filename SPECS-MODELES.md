# Spécifications des modèles - ERNIE-Image MLX

Paramètres techniques exacts pour l'implémentation du serveur.

---

## 1. Diffusion Transformer (DiT) - 8B

### Architecture

```
Classe : ErnieImagePipeline.dit
Type : Single-stream Diffusion Transformer
Paramètres : ~8B
```

### Configuration

| Paramètre | Valeur |
|-----------|--------|
| Hidden size | 4096 |
| Nombre de couches | 36 |
| Heads attention | 32 |
| Activation | GELU |
| Positional encoding | Rotary (RoPE 3D) |
| Conditioning | Adaptive Layer Normalization (AdaLN) |

### Entrées

```python
latents : mx.array       # Shape [H_latent, W_latent, 4]
                         # H_latent = image_h // 16
                         # W_latent = image_w // 16
                         # Ex: 1024×1024 → 64×64

timestep : int | mx.array # Étape de débruitage [0, num_steps)
                           # Encodé en embedding sinusoïdal

text_embeddings : mx.array # Shape [T, 3072]
                            # T = longueur séquence (variable)
                            # 3072 = embedding dim Mistral-3
```

### Sortie

```python
velocity : mx.array  # Shape [H_latent, W_latent, 4]
                     # Vecteur vitesse pour flow matching
```

### Opérations clés

1. **Patchification** : latents [H, W, 4] → patches [N_patches, 4]
   - N_patches = H × W

2. **Embedding concatenation** : patches + text_embeddings

3. **36 blocs Transformer** :
   - Multi-head attention avec RoPE 3D
   - Feed-forward gated (SwiGLU-like)
   - Adaptive Layer Norm (AdaLN) par timestep
   - Masquage causal appliqué

4. **Unpatchification** : [N_patches, 4] → [H, W, 4]

### Poids

```
Source : baidu/ERNIE-Image-Turbo (PyTorch)
Format MLX : dit.npz (~8 Go)
Précision : float32 (ou quantized INT8/INT4)
Transposition : Conv2d poids NCHW → NHWC
```

### Temps d'inférence

| Matériel | 8 steps | 1 step |
|----------|---------|---------|
| M3 Ultra MLX | ~20s | ~2,5s |
| M3 Ultra PyTorch+MPS | ~27s | ~3,4s |
| M4 Pro MLX | ~134s | ~16,8s |

---

## 2. VAE Decoder (FLUX.2-style)

### Architecture

```
Classe : ErnieImagePipeline.vae
Type : Variational AutoEncoder (decoder only)
Paramètres : ~83M
```

### Configuration

| Paramètre | Détail |
|-----------|--------|
| Post-quant conv | 1×1 Conv : 4 ch → 32 ch |
| Bottleneck | 32 channels |
| Upsampling | 4× (4 UpBlocks) |
| Résidual blocks | 2 par UpBlock + MidBlock (2 ResBlocks + 1 AttentionBlock) |
| Output channels | 3 (RGB) |

### Entrées

```python
latents : mx.array  # Shape [H_latent, W_latent, 4]
                    # H_latent = image_h // 16
                    # W_latent = image_w // 16
```

### Sortie

```python
image : mx.array  # Shape [H_image, W_image, 3]
                  # Values : float [0, 1]
                  # Nécessite clipage et conversion uint8
```

### Upsampling progression

```
32 ch @ 64×64 (1/16 res)
  ↓ ResBlock × 3
  ↓ Upsample
  ↓
64 ch @ 128×128 (1/8 res)
  ↓ ResBlock × 3
  ↓ Upsample
  ↓
128 ch @ 256×256 (1/4 res)
  ↓ ResBlock × 3
  ↓ Upsample
  ↓
256 ch @ 512×512 (1/2 res)
  ↓ ResBlock × 3
  ↓ Upsample
  ↓
512 ch @ 1024×1024 (full res)
  ↓ 1×1 Conv
  ↓
3 ch @ 1024×1024 (RGB output)
```

### Poids

```
Source : baidu/ERNIE-Image-Turbo
Format MLX : vae.npz (~2 Go)
Précision : float32
Transposition : Conv2d NCHW → NHWC
Note : Encoder non utilisé, decoder seul
```

### Temps d'inférence

| Matériel | Temps |
|----------|-------|
| M3 Ultra MLX | ~0,9s |
| M4 Pro MLX | ~1,5s |

---

## 3. Text Encoder - Mistral-3

### Architecture

```
Classe : TextEncoder
Framework : PyTorch + MPS
Modèle : Baidu ERNIE-Image Mistral-3
Paramètres : ~3,8B
```

### Configuration

| Paramètre | Valeur |
|-----------|--------|
| Hidden size | 3072 |
| Nombre de couches | 32 |
| Heads attention | 32 |
| Max sequence length | ~77 tokens |
| Tokenizer | Sentence Piece |

### Entrées

```python
prompt : str  # "une chatte dormant au soleil"
              # Tokenization automatique
```

### Sortie

```python
embeddings : mx.array  # Shape [T, 3072]
                       # T = longueur séquence (généralement 10-77)
                       # 3072 = embedding dimension
                       # Tiré de la couche -2 (avant final layer norm)
```

### Processus

1. **Tokenization** : prompt → token IDs
2. **Forward PyTorch** : token IDs → hidden states (32 couches)
3. **Extraction** : couche -2 (d'avant le layer norm final)
4. **Conversion** : PyTorch tensor → MLX array

### Poids

```
Source : baidu/ERNIE-Image-Turbo
Device : MPS (Metal Performance Shaders)
Précision : float16 (bfloat16 non supporté sur MPS)
Format : PyTorch (.safetensors ou .pt)
```

### Temps d'inférence

```
~0,05-0,1s (< 1 % du temps total)
```

### Notes

- **Reste en PyTorch** : pas de réimplémentation MLX (complexe, peu de gain)
- **Hybrid architecture** : acceptable car compute < 0,1s vs ~20s total
- **Tokenization implicite** : le tokenizer HF est chargé automatiquement

---

## 4. Scheduler - Flow Matching Euler Discrete

### Architecture

```
Classe : FlowMatchingEulerDiscreteScheduler
Type : Velocity-based (flow matching, pas noise-based)
```

### Configuration

| Paramètre | Valeur | Détail |
|-----------|--------|--------|
| `shift` | 4.0 | Non-linear sigma scaling |
| `num_inference_steps` | 8 | Défaut (1-50+ possible) |
| `timesteps` | [0, num_steps-1] | Indice des steps |
| `sigmas` | [1.0, ..., 0.0] | Niveaux de bruit (linéaire) |

### Sigma management

**Progression linéaire** (1.0 → 0.0) :

```python
sigmas = np.linspace(1.0, 0.0, num_steps + 1)
```

**Sigma shift** (non-linear adjustment) :

```python
sigma_shifted = shift * sigma / (1 + (shift - 1) * sigma)

# Défaut shift=4.0 → permet contrôle fine de la trajectoire
```

### Stepping equation

```python
def step(self, model_output, sample, sigma, sigma_next):
    """
    Args:
        model_output : velocity vector [H, W, 4]
        sample : latent courant [H, W, 4]
        sigma : niveau bruit actuel (float)
        sigma_next : niveau bruit suivant (float)

    Returns:
        prev_sample : latent débruité [H, W, 4]

    Equation:
        dt = sigma - sigma_next  # time delta
        prev_sample = sample + dt * model_output
    """
```

### Pré-calcul timesteps

```python
scheduler.set_timesteps(num_steps=8)
# Pré-calcule les sigmas pour les 8 steps
```

### Exemple : 8 steps

```python
num_steps = 8
sigmas = np.linspace(1.0, 0.0, 9)  # 9 éléments pour 8 steps
# [1.0, 0.875, 0.75, 0.625, 0.5, 0.375, 0.25, 0.125, 0.0]

# Boucle de débruitage :
for i, sigma in enumerate(sigmas[:-1]):
    sigma_next = sigmas[i + 1]
    dt = sigma - sigma_next
    latent = latent + dt * dit_velocity
```

### Temps

```
Aucun compute-juste des opérations arithmétiques
Overhead négligeable
```

---

## 5. Batch Normalization Statistics

### Fichier

```
Format : bn_stats.npz (~quelques Mo)
Contient : mean, variance pour les couches BN du DiT
```

### Application

Dans la boucle débruitage finale (après unpatchification) :

```python
# Dans ErnieImagePipeline.generate()
if self.bn_stats:
    # Appliquer les stats BN au latent
    latent = apply_batch_norm(latent, self.bn_stats)
```

---

## 6. Poids complets (HuggingFace)

### Modèle source

```
HuggingFace ID : baidu/ERNIE-Image-Turbo
Format : SafeTensors
Taille : ~20 Go (fp16)
Contient : DiT 8B + VAE + Text Encoder Mistral-3
Licence : Apache 2.0
```

### Modèle pré-converti MLX

```
HuggingFace ID : treadon/ERNIE-Image-Turbo-MLX
Format : NPZ (numpy archive)
Taille : ~16 Go
Contient :
  - dit.npz (~8 Go)
  - vae.npz (~2 Go)
  - bn_stats.npz (~Mo)
  - config.json (~1 Ko)
Licence : Apache 2.0 (poids Baidu)
              MIT (code conversion)
```

---

## 7. Configuration minimale pour le serveur

```python
# Initialisation unique au startup :

config = {
    "model_id": "treadon/ERNIE-Image-Turbo-MLX",
    "quantize": None,  # ou "4bit" / "8bit" si RAM < 20 Go
    "device": "mlx",
}

# Ou depuis poids locaux :
config = {
    "weights_path": "./weights",
    "quantize": None,
}

# Parameters runtime (per-request) :
generation_params = {
    "prompt": str,
    "steps": int,      # défaut 8
    "height": int,     # preset
    "width": int,      # preset
    "seed": int | None,  # reproducibility
    "guidance_scale": float,  # défaut 7.5 (optionnel)
}
```

---

## 8. Memory footprint

### Au chargement

| Composant | RAM utilisée |
|-----------|-------------|
| DiT 8B fp16 | ~16 Go |
| VAE fp16 | ~2 Go |
| Text Encoder (PyTorch) | ~8 Go |
| Latents, intermédiaires | ~1-2 Go |
| **Total** | **~27-28 Go** |

### Options RAM

- **64 Go** (M3 Ultra) : Facile, aucun problème
- **32 Go** (M1 Max, M3 Max) : Marginal (quelques swap possible)
- **16 Go** (M3 Pro) : Quantization INT8/INT4 obligatoire
- **8 Go** (M2 Air, M3 Air) : Non supporté

---

## 9. Énumération des paramètres client (API)

### Request POST `/generate`

```json
{
  "prompt": "string (requis)",
  "steps": "integer (défaut 8, min 1, max 50)",
  "height": "integer (défaut 1024, presets seulement)",
  "width": "integer (défaut 1024, presets seulement)",
  "seed": "integer | null (défaut null = random)",
  "guidance_scale": "float (défaut 7.5, optionnel, [1.0, 15.0])"
}
```

### Presets valides pour height/width

```python
[
  (1024, 1024),    # square
  (1264, 848),     # landscape
  (848, 1264),     # portrait
  (1200, 896),     # landscape-soft
  (896, 1200),     # portrait-soft
  (1376, 768),     # cinema
  (768, 1376),     # vertical
]
```

### Response 200 OK

```json
{
  "filename": "string",
  "path": "string",
  "url": "string",
  "generation_time_ms": integer,
  "model_info": {
    "dit_params": "8B",
    "framework": "MLX",
    "precision": "float32"
  }
}
```

### Response 400 Bad Request

```json
{
  "error": "string",
  "valid_presets": "[[1024, 1024], ...]"
}
```

---

**Dernière mise à jour** : 2026-04-26
