# ERNIE-Image - ce que JP a fait et pourquoi

Repo de référence : https://github.com/Sandjab/Ernie

---

## Le modèle : ERNIE-Image

Baidu (le Google chinois) a sorti un modèle de génération d'images appelé **ERNIE-Image**. Il existe en deux versions :

- `ERNIE-Image` - version complète, 50 étapes de débruitage, lente
- `ERNIE-Image-Turbo` - version rapide, 8 étapes, résultats très proches

Ces modèles pèsent ~20 Go et tournent normalement sur GPU NVIDIA. Sur Mac, c'est plus compliqué.

---

## Le problème : faire tourner ça sur Mac

Il existe deux façons de faire tourner un modèle lourd sur Apple Silicon :

**PyTorch + MPS** - PyTorch est le framework standard de l'IA. MPS (Metal Performance Shaders) est la couche d'Apple qui permet à PyTorch d'utiliser le GPU du Mac. C'est la voie classique, bien documentée, mais pas optimisée pour Apple Silicon.

**MLX** - Framework développé par Apple spécifiquement pour ses puces. Il parle directement au hardware M1/M2/M3, exploite mieux la mémoire unifiée (CPU et GPU partagent la même RAM, pas de copie entre les deux). Plus efficace, mais les modèles doivent être convertis dans un format MLX.

---

## Ce que JP a fait concrètement

Il a écrit **deux scripts Python** qui font la même chose (générer une image depuis un prompt texte), mais avec les deux runtimes.

### Script 1 - `ernie_image_mac_poc.py` (PyTorch + MPS)

- Télécharge le modèle depuis Hugging Face (~20 Go)
- Le charge en mémoire via le framework `diffusers` de Hugging Face
- Génère une image à partir d'un prompt
- La sauvegarde en PNG

Particularité Mac : `bfloat16` n'est pas supporté par MPS, il faut utiliser `float16`. Le générateur aléatoire doit rester sur CPU (pas sur GPU). JP a documenté ces pièges dans le code.

### Script 2 - `ernie_image_mlx_poc.py` (MLX)

Ne réimplémente rien : il s'appuie sur un projet existant ([`mlx-ernie-image` d'Antoine Vianey, @treadon](https://github.com/treadon/mlx-ernie-image)) qui a déjà fait le travail de conversion du modèle pour MLX.

- Télécharge une version pré-convertie du modèle (~16 Go, format `.npz` MLX) depuis `treadon/ERNIE-Image-Turbo-MLX` sur Hugging Face
- Le text encoder reste en PyTorch+MPS (Mistral-3, < 0,1s - négligeable)
- Le DiT 8B et le VAE tournent en MLX

JP a ajouté autour de cette API : diagnostic système, mode benchmark, option `--compile` (wrapping du DiT avec `mx.compile`) et une CLI alignée sur le script MPS pour faciliter la comparaison.

---

## Résultats des benchmarks

| Matériel | Runtime | Temps (8 steps) |
|----------|---------|-----------------|
| M3 Ultra | PyTorch+MPS | ~27s |
| M3 Ultra | MLX | ~21s (~27 % plus rapide) |
| M4 Pro | PyTorch+MPS | 137s |
| M4 Pro | MLX | 134s (~2 % plus rapide) |

La quantization (INT8 ou INT4) ne gagne rien en vitesse sur M3 Ultra (43s INT8, 44s INT4 vs ~21s fp16). Elle n'est utile que pour les machines avec peu de RAM (< 20 Go).

---

## Ce que ces scripts ne font pas

Les deux scripts sont des outils en ligne de commande : on les lance, ils génèrent une image, ils s'arrêtent. À chaque invocation, le modèle (~20 Go) se recharge depuis zéro - ce qui prend 20 à 30 secondes.

Il n'y a pas de serveur qui reste ouvert et attend des requêtes.

---

## Prochaine étape : serveur headless

Voir `serveur-headless-ernie.md` dans ce dossier.
