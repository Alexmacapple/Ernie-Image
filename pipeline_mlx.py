import asyncio
import gc
import random
import sys
import threading
import time
from pathlib import Path

import config

RATIO_PRESETS: dict[str, tuple[int, int]] = {
    "square":         (1024, 1024),
    "landscape":      (1264, 848),
    "portrait":       (848, 1264),
    "landscape-soft": (1200, 896),
    "portrait-soft":  (896, 1200),
    "cinema":         (1376, 768),
    "vertical":       (768, 1376),
}

# Secondes par step mesurées sur M1 Ultra (estimation conservative)
_SECS_PER_STEP = 5.5

_te = None
_pipe = None
_state_lock = threading.Lock()
_generation_lock = threading.Lock()
_loaded = False
_loading_since: float | None = None
_load_error: str | None = None


def _cleanup_accelerator_caches() -> None:
    """Libère les caches Metal conservés entre deux générations."""
    gc.collect()

    try:
        import mlx.core as mx

        mx.clear_cache()
    except Exception as exc:
        print(f"Ernie Studio - nettoyage cache MLX ignoré : {exc}", file=sys.stderr)

    try:
        import torch

        if torch.backends.mps.is_available():
            torch.mps.empty_cache()
    except Exception as exc:
        print(f"Ernie Studio - nettoyage cache MPS ignoré : {exc}", file=sys.stderr)


def _bootstrap_vendor() -> None:
    if not config.VENDOR_DIR.exists():
        raise RuntimeError(
            f"Vendeur MLX introuvable : {config.VENDOR_DIR}\n"
            "Lancer : git clone --depth 1 https://github.com/treadon/mlx-ernie-image.git "
            f"{config.VENDOR_DIR}"
        )
    if str(config.VENDOR_DIR) not in sys.path:
        sys.path.insert(0, str(config.VENDOR_DIR))


def load_pipeline(quantize: int | None = None, compile_dit: bool = False) -> None:
    global _te, _pipe, _loaded, _loading_since, _load_error
    started_at = time.time()
    with _state_lock:
        _loading_since = started_at
        _load_error = None
        _loaded = False

    try:
        _bootstrap_vendor()
        from ernie_image import ErnieImagePipeline, TextEncoder

        print("Ernie Studio - chargement text encoder (PyTorch+MPS)...")
        text_encoder = TextEncoder.from_pretrained()

        print("Ernie Studio - chargement DiT + VAE (MLX)...")
        pipe = ErnieImagePipeline.from_pretrained(
            "treadon/ERNIE-Image-Turbo-MLX",
            quantize=quantize,
        )

        if compile_dit:
            import mlx.core as mx

            class _CompiledDit:
                def __init__(self, dit):
                    self._dit = dit
                    self.text_in_dim = dit.text_in_dim

                    @mx.compile
                    def _fn(hs, ts, tb, tl):
                        return self._dit(hs, ts, tb, tl)

                    self._fn = _fn

                def __call__(self, hs, ts, tb, tl):
                    return self._fn(hs, ts, tb, tl)

            pipe.dit = _CompiledDit(pipe.dit)

        with _state_lock:
            _te = text_encoder
            _pipe = pipe
            _loaded = True
            _load_error = None
        print(f"Ernie Studio - pipeline prêt ({time.time() - started_at:.1f}s)")
    except Exception as exc:
        with _state_lock:
            _te = None
            _pipe = None
            _loaded = False
            _load_error = str(exc)
        print(f"Ernie Studio - échec chargement pipeline : {exc}")
        raise


def _generate_sync(
    prompt: str,
    width: int,
    height: int,
    steps: int,
    seed: int,
    output_path: Path,
) -> dict:
    t0 = time.time()
    emb = None
    image = None
    try:
        _cleanup_accelerator_caches()
        emb = _te.encode(prompt)
        t_enc = time.time()
        image = _pipe.generate(
            text_embeddings=emb,
            height=height,
            width=width,
            num_inference_steps=steps,
            seed=seed,
        )
        t_gen = time.time()
        image.save(output_path)
        elapsed = round(time.time() - t0, 1)
        print(
            f"[ernie] {steps} steps | "
            f"encode={t_enc - t0:.1f}s  "
            f"denoise+vae={t_gen - t_enc:.1f}s  "
            f"total={elapsed}s"
        )
        return {"elapsed": elapsed, "seed": seed}
    finally:
        emb = None
        image = None
        _cleanup_accelerator_caches()


def _generate_sync_and_release(
    prompt: str,
    width: int,
    height: int,
    steps: int,
    seed: int,
    output_path: Path,
) -> dict:
    try:
        return _generate_sync(prompt, width, height, steps, seed, output_path)
    finally:
        _generation_lock.release()


def reserve_generation_slot() -> bool:
    return _generation_lock.acquire(blocking=False)


def release_generation_slot() -> None:
    _generation_lock.release()


async def generate(
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    steps: int = 8,
    seed: int | None = None,
    filename: str | None = None,
    slot_acquired: bool = False,
) -> dict:
    with _state_lock:
        loaded = _loaded
    if not loaded:
        if slot_acquired:
            release_generation_slot()
        raise RuntimeError("Pipeline non chargé")

    if not slot_acquired and not reserve_generation_slot():
        raise RuntimeError("Une génération est déjà en cours")

    if seed is None:
        seed = random.randint(0, 2**31 - 1)

    if filename is None:
        ts = time.strftime("%Y%m%dT%H%M%S")
        filename = f"{ts}_{width}x{height}_seed{seed}.png"

    output_path = config.OUTPUTS_DIR / filename
    loop = asyncio.get_running_loop()

    try:
        future = loop.run_in_executor(
            None,
            _generate_sync_and_release,
            prompt,
            width,
            height,
            steps,
            seed,
            output_path,
        )
    except Exception:
        release_generation_slot()
        raise

    # Le calcul MLX lancé en thread n'est pas interruptible proprement. Si la
    # requête HTTP est annulée, on laisse le thread finir et libérer le verrou.
    result = await asyncio.shield(future)

    result["filename"] = filename
    return result


def status() -> dict:
    with _state_lock:
        loaded = _loaded
        loading_since = _loading_since
        load_error = _load_error
    return {
        "loaded": loaded,
        "loading_since": loading_since,
        "load_error": load_error,
        "locked": _generation_lock.locked(),
        "secs_per_step_estimate": _SECS_PER_STEP,
    }
