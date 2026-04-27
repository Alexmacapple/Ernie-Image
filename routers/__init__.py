from fastapi import FastAPI

from . import auth_routes, generate, outputs, presets, status


def register_all(app: FastAPI) -> None:
    for module in (auth_routes, status, presets, generate, outputs):
        app.include_router(module.router)
