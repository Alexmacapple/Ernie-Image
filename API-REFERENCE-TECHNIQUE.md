# API Reference technique - ERNIE-Image MLX

Cible pour intégration dans le serveur headless local.

---

## Imports clés

```python
from ernie_image import ErnieImagePipeline, TextEncoder
from ernie_image.scheduler import FlowMatchingEulerDiscreteScheduler
import mlx.core as mx
from PIL import Image
```

---

## Pipeline principal

### Initialisation

```python
# Option 1 : Depuis HuggingFace (télécharge ~16 Go)
pipeline = ErnieImagePipeline.from_pretrained(
    model_id="treadon/ERNIE-Image-Turbo-MLX",
    quantize=None  # ou "4bit" / "8bit" si RAM < 20 Go
)

# Option 2 : Depuis poids locaux pré-convertis
pipeline = ErnieImagePipeline.from_weights(
    weights_path="./weights",  # dossier contenant dit.npz, vae.npz, etc.
    quantize=None
)
```

### Génération

```python
image = pipeline.generate(
    prompt: str,                    # "une chatte dormant au soleil"
    height: int = 1024,            # Doit être preset
    width: int = 1024,             # Doit être preset
    steps: int = 8,                # 1-50+ (défaut 8)
    seed: int | None = None,       # Pour reproducibilité
    guidance_scale: float = 7.5    # [1.0, 15.0] (optionnel)
) -> PIL.Image.Image
```

**Retour** : `PIL.Image.Image` au format RGB uint8 [0, 255].

**Temps** : ~21s M3 Ultra, ~134s M4 Pro (8 steps).

---

## Composants individuels

### TextEncoder (PyTorch+MPS)

```python
text_encoder = TextEncoder.from_pretrained()

# Encode un prompt
embeddings = text_encoder.encode(
    prompt: str
) -> mx.array  # Shape [T, 3072], T = longueur seq
```

**Temps** : < 0,1s (négligeable).

### Scheduler (Flow Matching Euler)

```python
scheduler = FlowMatchingEulerDiscreteScheduler()

scheduler.set_timesteps(num_steps: int)

# À chaque step :
prev_sample = sample + dt * model_output
# (dt = sigma[i] - sigma[i+1])
```

### DiT (8B Diffusion Transformer)

```python
# Accès via pipeline.dit (usage interne)
latent_out = pipeline.dit(
    latents: mx.array,           # [H, W, 4]
    timestep: int | mx.array,    # Étape de débruitage
    embeddings: mx.array         # [T, 3072]
) -> mx.array  # [H, W, 4] velocity vector
```

### VAE Decoder

```python
# Accès via pipeline.vae (usage interne)
image_decoded = pipeline.vae(
    latents: mx.array  # [H, W, 4]
) -> mx.array  # [H, W, 3] float [0, 1]
```

---

## Presets de résolution

```python
PRESETS = {
    "square": (1024, 1024),
    "landscape": (1264, 848),
    "portrait": (848, 1264),
    "landscape-soft": (1200, 896),
    "portrait-soft": (896, 1200),
    "cinema": (1376, 768),
    "vertical": (768, 1376),
}

# Pour le serveur : valider que (height, width) ∈ PRESETS
# ou permettre custom avec avertissement de dégradation
```

---

## Conversion de poids (première utilisation)

```bash
python -m ernie_image.convert_weights \
    --model-id baidu/ERNIE-Image-Turbo \
    --output-dir ./weights
```

**Output** :

```
./weights/
├── dit.npz          (~8 Go)
├── vae.npz          (~2 Go)
├── bn_stats.npz     (Mo)
└── config.json
```

Ensuite utiliser `from_weights("./weights")` pour charger localement.

---

## Intégration du serveur (squelette)

```python
from fastapi import FastAPI
from fastapi.responses import FileResponse
from ernie_image import ErnieImagePipeline
import uuid
from pathlib import Path

app = FastAPI()
pipeline = None
output_dir = Path("./outputs")
output_dir.mkdir(exist_ok=True)

@app.on_event("startup")
async def startup():
    global pipeline
    print("Chargement du pipeline...")
    pipeline = ErnieImagePipeline.from_pretrained()
    print("Pipeline prêt.")

@app.post("/generate")
async def generate(
    prompt: str,
    steps: int = 8,
    width: int = 1024,
    height: int = 1024,
    seed: int | None = None
):
    # Validation résolution
    valid_presets = [
        (1024, 1024), (1264, 848), (848, 1264),
        (1200, 896), (896, 1200), (1376, 768), (768, 1376)
    ]
    if (height, width) not in valid_presets:
        return {"error": f"Résolution non supportée. Presets : {valid_presets}"}

    # Génération
    image = pipeline.generate(
        prompt=prompt,
        height=height,
        width=width,
        steps=steps,
        seed=seed
    )

    # Sauvegarde
    filename = f"{uuid.uuid4().hex}.png"
    filepath = output_dir / filename
    image.save(filepath)

    return {
        "filename": filename,
        "path": str(filepath),
        "url": f"/outputs/{filename}"
    }

@app.get("/outputs/{filename}")
async def get_output(filename: str):
    filepath = output_dir / filename
    if not filepath.exists():
        return {"error": "Fichier non trouvé"}
    return FileResponse(filepath)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Lancer :

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

Premier démarrage : ~20-30s (chargement pipeline), puis requêtes ~21s/chacune (M3 Ultra).

---

## Pièges et optimisations

### À éviter

- **Réchargement pipeline** : charger une seule fois au startup, réutiliser pour chaque requête
- **Quantization inutile** : INT8/INT4 ralentissent sur M3 Ultra (> 20 Go RAM)
- **Résolutions custom** : hors presets = dégradation qualité
- **Évaluation eagre en MLX** : construire le graphe complet, puis `mx.eval()` une seule fois

### Optimisations appliquées

- Deferred evaluation : graphe complet dans la boucle DiT, `mx.eval()` à la fin
- Attention fused : `mx.fast.scaled_dot_product_attention`
- PyTorch pour text encoder (< 0,1s, pas de gain à porter en MLX)
- Poids pré-transposés en format MLX (NHWC)

---

## Dépendances minimales

```bash
pip install \
    mlx>=0.20.0 \
    mlx-lm>=0.20.0 \
    torch torchvision torchaudio \
    pillow \
    huggingface-hub \
    safetensors \
    transformers \
    fastapi \
    uvicorn
```

---

## Structure du projet cible

```
ernie/
├── server.py              # FastAPI
├── pipeline_mlx.py        # Wrapper autour ErnieImagePipeline
├── vendor/
│   └── mlx-ernie-image/   # Clone de treadon/mlx-ernie-image
├── weights/               # Poids convertis (gitignored)
│   ├── dit.npz
│   ├── vae.npz
│   ├── bn_stats.npz
│   └── config.json
├── outputs/               # Images générées (gitignored)
└── CLAUDE.md
```

---

**Dernière mise à jour** : 2026-04-26
