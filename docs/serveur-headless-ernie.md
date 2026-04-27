# Serveur local headless pour ERNIE-Image

Repo de référence : https://github.com/Sandjab/Ernie

---

## Contexte

Les deux scripts du repo (`ernie_image_mac_poc.py` et `ernie_image_mlx_poc.py`) sont des **CLIs one-shot** : un processus = une image = exit. À chaque invocation, le pipeline se recharge (~20s). Pas de serveur, pas d'API.

L'objectif est un serveur headless - sans A1111/Forge ni ComfyUI - qui garde le pipeline en mémoire et expose une API HTTP.

---

## Cible retenue : Mac Studio M1 Ultra + MLX

**Matériel :**
- Puce : Apple M1 Ultra (2× M1 Max liés par UltraFusion, 512 Go/s inter-die)
- CPU : 20 cœurs (16 performance + 4 efficacité)
- GPU : 48 cœurs
- Mémoire unifiée : 64 Go (bande passante 800 Go/s, LPDDR5)
- Metal : 4

ERNIE-Image Turbo en fp16 requiert ~20 Go de mémoire - largement dans les 64 Go disponibles. La quantization est inutile ici (JP a mesuré que INT8 et INT4 ne gagnent rien en vitesse, seulement en RAM).

Le gain MLX vs PyTorch+MPS a été mesuré à ~27 % sur M3 Ultra par JP ; le chiffre exact sur M1 Ultra reste à mesurer, mais l'avantage de MLX tient à l'efficacité des opérations sur Apple Silicon (pas seulement à la bande passante), donc un gain significatif est attendu.

Le script MLX (`ernie_image_mlx_poc.py`) s'appuie sur le projet open-source [`mlx-ernie-image` d'Antoine Vianey (@treadon)](https://github.com/treadon/mlx-ernie-image), vendoré localement. Les poids viennent du repo HF `treadon/ERNIE-Image-Turbo-MLX` (~16 Go).

Architecture réelle du pipeline MLX :
- Text encoder : PyTorch+MPS (Mistral-3, < 0,1s, négligeable)
- DiT 8B + VAE : MLX (poids pré-transposés `.npz`)

---

## Solution retenue : FastAPI autour du script MLX

Envelopper `load_pipeline()` + `generate()` dans un serveur FastAPI qui garde le pipeline chaud entre les requêtes.

```
POST /generate  { prompt, width, height, steps, seed }
→ image PNG en base64 ou chemin fichier
```

**Avantages :**
- Pipeline chargé une seule fois au démarrage (~20-30s)
- Chaque requête = uniquement le temps de génération (~21s sur M3 Ultra à 4 steps)
- ~60 lignes de FastAPI autour du code existant
- Pas de dépendance supplémentaire lourde

### Pourquoi pas les alternatives

| Option | Raison d'écarter |
|--------|-----------------|
| diffusers-api / SHARK | Pas de support ERNIE natif (trop récent, dépend de la branche `main` de diffusers) |
| BentoML / Cog | Overhead conteneur inutile pour un usage local |
| A1111 / Forge / ComfyUI | UI obligatoire, pas headless |

---

## Point en suspens

Format de sortie à décider avant implémentation :
- Fichier sauvegardé localement avec chemin retourné dans la réponse
- JSON avec image encodée en base64
- Stream multipart
