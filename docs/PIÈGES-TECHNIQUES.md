# Pièges techniques - ERNIE-Image MLX sur Mac

Liste des pièges documentés lors de l'exploration du repo `treadon/mlx-ernie-image`.

---

## 1. PyTorch+MPS : bfloat16 non supporté

**Problème** : MPS (Metal Performance Shaders) ne supporte pas bfloat16.

**Symptôme** :
```
RuntimeError: "bfloat16" not supported on MPS device
```

**Solution** :

Utiliser **float16** au lieu de bfloat16.

```python
# MAUVAIS
model = model.to(torch.bfloat16)

# BON
model = model.to(torch.float16)
```

**Contexte** : Le text encoder (Mistral-3) doit rester en float16 sur MPS.

---

## 2. PyTorch+MPS : générateur aléatoire sur CPU

**Problème** : Le générateur aléatoire PyTorch doit rester sur CPU, sinon erreur MPS.

**Symptôme** :
```
RuntimeError: Generator on device "mps" is not allowed
```

**Solution** :

Forcer le générateur sur CPU même si les tenseurs sont sur GPU.

```python
# MAUVAIS
generator = torch.Generator(device="mps")

# BON
generator = torch.Generator(device="cpu")
latent = torch.randn(..., generator=generator, device="mps")
```

**Contexte** : Lors de l'initialisation du latent bruitée pour le débruitage.

---

## 3. MLX : Deferred evaluation, pas d'evaluation step-by-step

**Problème** : Évaluer le graphe MLX à chaque step de la boucle de débruitage **ralentit beaucoup** (×1,5 à ×2).

**Symptôme** : Génération prend 40-50s au lieu de 21s sur M3 Ultra.

**Solution** :

Construire le **graphe complet** dans la boucle, puis évaluer une **seule fois** à la fin.

```python
# MAUVAIS (évaluation par step)
for step in range(steps):
    latent = latent + dt * dit(latent)  # ← Évalue le graphe ici
    # Temps : ~3s/step × 8 = ~24s + overhead

# BON (deferred evaluation)
for step in range(steps):
    latent = latent + dt * dit(latent)  # ← Construit le graphe
mx.eval(latent)  # Évalue tout le graphe une fois
# Temps : ~20s total
```

**Contexte** : Pipeline MLX ligne du `generate()` - les 27 % de gain MLX vs PyTorch+MPS proviennent en grande partie de cette optimisation.

---

## 4. MLX : Layout NHWC vs NCHW (transposition poids)

**Problème** : PyTorch utilise NCHW (channels first), MLX préfère NHWC (channels last). Les poids doivent être transposés lors de la conversion.

**Symptôme** : Valeurs de sortie complètement fausses ou crashes.

**Solution** :

Le script `convert_weights.py` gère cette transposition automatiquement :

```python
# Pour Conv2d weight (4D) :
# PyTorch : [out_channels, in_channels, height, width]
# MLX :     [height, width, in_channels, out_channels]

# Transposition : permute(2, 3, 1, 0) ou reshape approprié
```

**Contexte** : Lors du chargement des poids pré-convertis (`dit.npz`, `vae.npz`), les poids sont **déjà en layout MLX**. Ne pas retransposer.

---

## 5. Résolutions : presets obligatoires

**Problème** : Le modèle a été entraîné sur 7 résolutions spécifiques uniquement. Les résolutions custom dégradent la qualité.

**Symptôme** : Images floues, déformées ou aberrantes hors presets.

**Presets valides** :

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
```

**Solution** :

- **Dans l'API serveur** : accepter seulement les 7 presets, ou valider que height/width sont presets.
- **Si résolution custom strictement requise** : utiliser un preset proche et documenter la dégradation.

**Contexte** : Le modèle encode les dimensions comme entrée au DiT (via RoPE 3D). Sortir des presets confuse le modèle.

---

## 6. Quantization : inutile sur M3 Ultra+

**Problème** : INT8 et INT4 ne gagnent **rien en vitesse** sur Mac avec > 20 Go RAM. Pire, ils ralentissent.

**Chiffres (M3 Ultra, 8 steps)** :
- fp16 : ~21s
- INT8 : ~43s (2× plus lent)
- INT4 : ~44s (2× plus lent)

**Solution** :

- **Mac avec > 20 Go RAM** : ne pas utiliser quantization
- **Mac avec < 16 Go RAM** : envisager INT8 ou INT4, au prix d'une réduction qualité

**Contexte** : ERNIE-Image-Turbo fp16 requiert ~20 Go. Sur M1/M3 Ultra (64 Go), c'est trivial. Sur M4 Pro (moins de GPU), quantization pourrait être pertinente mais mesures obligatoires.

---

## 7. Conversion de poids : une seule fois, stockage local

**Problème** : Télécharger et convertir les poids à chaque démarrage du serveur = ~1-2 min de latence.

**Solution** :

1. **Première utilisation** : Convertir les poids une seule fois
   ```bash
   python -m ernie_image.convert_weights
   # Crée ./weights/ avec dit.npz, vae.npz, bn_stats.npz, config.json
   ```

2. **Charger localement** au démarrage du serveur
   ```python
   pipeline = ErnieImagePipeline.from_weights("./weights")
   ```

3. **Gitignorer** le dossier `./weights/` (~16 Go, trop gros)

**Contexte** : Pipeline startup : ~20-30s est acceptable (une fois), ~60-90s ne l'est pas (à chaque requête).

---

## 8. Batch norm statistics : requis pour DiT

**Problème** : Le DiT contient des couches batch normalization. Leurs statistiques (mean/var) sont sauvegardées dans `bn_stats.npz` lors de la conversion.

**Solution** :

Les charger et les appliquer lors du décodage (dernier stage du `generate()`).

```python
# Dans ErnieImagePipeline.generate() :
if self.bn_stats is not None:
    latent = apply_bn_stats(latent, self.bn_stats)
```

**Contexte** : La conversion `convert_weights.py` les extrait automatiquement. `from_pretrained()` et `from_weights()` les chargent.

---

## 9. Text encoder : PyTorch+MPS, pas MLX

**Problème** : Le text encoder (Mistral-3, 3,8B params) reste en PyTorch+MPS, pas MLX.

**Raison** : < 0,1s de compute, < 1 % du temps total. Pas de gain à le porter en MLX. Évite une réimplémentation complexe.

**Conséquence** : Hybrid architecture (PyTorch + MLX), pas 100 % MLX.

**Impact** :
- Imports PyTorch obligatoires
- Deux runtimes pour une même pipeline

**Solution** : Accepter l'architecture hybride. Pour 100 % MLX, il faudrait un port complet du Mistral-3, non fait upstream.

---

## 10. Scheduler : Flow Matching Euler, pas diffusion classique

**Problème** : Le scheduler implémente **flow matching** (prédiction de vecteur vitesse), pas **diffusion classique** (prédiction de bruit). Deux paradigmes différents.

**Différence** :

| Paradigme | Équation | Sortie DiT |
|-----------|----------|-----------|
| Diffusion classique | `x_{t-1} = x_t - sqrt(1-α) * ε_pred` | Prédiction de bruit ε |
| Flow matching | `x_{t-1} = x_t + dt * v_pred` | Vecteur vitesse v |

**Impact** : Ne pas croiser les schedulers. Flow matching requiert une sortie DiT en vitesse, pas en bruit.

**Contexte** : ERNIE-Image-Turbo utilise flow matching (plus récent, plus stable).

---

## 11. Timestep embedding : scalar vs array

**Problème** : Le timestep passé au DiT peut être un scalar ou un array MLX. Le DiT doit gérer les deux.

**Solution** :

```python
# DiT.forward() accepte :
def forward(self, latents, timestep, embeddings):
    # timestep : int ou mx.array shape []
    if isinstance(timestep, int):
        timestep = mx.array(timestep)
```

**Contexte** : Dans la boucle de débruitage, on itère sur les sigmas. Certains code passe directement l'indice (int), d'autres un mx.array.

---

## 12. Memory leaks : Poids non libérés

**Problème** : Si le pipeline est rechargé (ex: en développement itéré), les poids PyTorch du text encoder peuvent ne pas être libérés.

**Solution** :

```python
# Au remplacement du pipeline :
del pipeline  # Libère références
gc.collect()  # Force garbage collection
torch.cuda.empty_cache()  # Sur GPU (pas applicable MPS, mais au cas où)
```

**Contexte** : En production, charger une seule fois au startup. En dev, careful avec les rechargements.

---

## 13. Réduction résolution latent : 1/16e

**Problème** : Les latents opèrent à 1/16e de la résolution finale. Pour 1024×1024, le latent est 64×64. Ne pas oublier ce ratio lors de la patchification/unpatchification.

**Formule** :

```python
latent_h = image_h // 16  # 1024 → 64
latent_w = image_w // 16  # 1024 → 64
```

**Contexte** : Patchification au début du DiT, unpatchification à la fin (avant décodage VAE).

---

## 14. Seed reproducibility : placement exact du Random

**Problème** : Avec un seed donné, deux runs successifs doivent produire **exactement** la même image. Mais le placement du seed dans le code importe.

**Solution** :

```python
import mlx.core as mx

# Placer le seed AVANT l'initialisation du latent bruitée
mx.random.seed(seed)
latent = mx.random.normal((H, W, 4))
```

Pas de seed durant la boucle de débruitage - elle est déterministe (pas d'aléa).

**Contexte** : Utilisé pour les tests et la reproducibilité client.

---

## 15. Output image format : uint8 [0, 255]

**Problème** : Le VAE retourne des float [0, 1]. Le serveur doit retourner PNG uint8 [0, 255].

**Solution** :

```python
# Après VAE.decode() :
image_float = vae(latent)  # [H, W, 3] float [0, 1]
image_uint8 = (image_float * 255).astype(mx.uint8)
image_pil = Image.fromarray(mx_to_numpy(image_uint8), mode="RGB")
image_pil.save("output.png")
```

**Contexte** : PIL.Image.fromarray attendu uint8 ou uint16.

---

## 16. Hugging Face caching : ~/.cache/huggingface/

**Problème** : Le téléchargement de modèles HF va dans `~/.cache/huggingface/`. Sur Mac avec SSD limité, ça peut être un problème.

**Solution** :

Définir une variable d'environnement pour rediriger le cache :

```bash
export HF_HOME=/Volumes/ExternalDrive/huggingface_cache
python generate.py -p "a cat"
```

Ou dans Python :

```python
import os
os.environ["HF_HOME"] = "/Volumes/ExternalDrive/huggingface_cache"
```

**Contexte** : Sur Mac Studio avec SSD 2 To, ce n'est pas un problème. Sur MacBook Air 256 Go, c'est critique.

---

## 17. Warmup requis avant benchmark

**Problème** : La première génération est plus lente que les suivantes (compilation MLX, cache warming).

**Solution** :

```python
# Au startup serveur, après charger le pipeline :
print("Warmup...")
_ = pipeline.generate(
    prompt="test",
    steps=1,  # Une étape rapide
    height=512, width=512
)
print("Pipeline prêt.")
```

Ajoute ~5s au startup, mais garantit que les clients voient les vraies perf.

---

## 18. Masquage causal en attention

**Problème** : L'attention du DiT utilise un **masque causal** (masquer les tokens futurs). Ne pas oublier de l'appliquer sinon l'ordre texte/image n'est pas respecté.

**Contexte** : Dans `dit.py`, les blocs attention appliquent déjà le masque. Pas d'action requise.

---

**Dernière mise à jour** : 2026-04-26
