"""Routes d'authentification Keycloak pour Ernie Studio."""

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

import config

router = APIRouter()


def _api_response(data: dict, status_code: int = 200) -> JSONResponse:
    return JSONResponse({"data": data}, status_code=status_code)


def _api_error(code: str, message: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        {"error": {"code": code, "message": message}},
        status_code=status_code,
    )


async def _read_json(request: Request) -> dict:
    try:
        body = await request.json()
    except ValueError:
        return {}
    return body if isinstance(body, dict) else {}


@router.post("/api/auth/login")
async def auth_login(request: Request):
    body = await _read_json(request)
    username = str(body.get("username", "")).strip()
    password = str(body.get("password", ""))
    if not username or not password:
        return _api_error("AUTH_REQUIRED", "Identifiants requis", 401)

    token_url = f"{config.KEYCLOAK_URL}/realms/{config.KEYCLOAK_REALM}/protocol/openid-connect/token"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                token_url,
                data={
                    "grant_type": "password",
                    "client_id": config.KEYCLOAK_CLIENT_ID,
                    "username": username,
                    "password": password,
                },
                timeout=10.0,
            )
        except (httpx.ConnectError, httpx.TimeoutException):
            return _api_error("AUTH_REQUIRED", "Keycloak indisponible", 503)

    if response.status_code != 200:
        return _api_error("AUTH_REQUIRED", "Identifiants invalides", 401)

    try:
        tokens = response.json()
        return _api_response({
            "access_token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "expires_in": tokens.get("expires_in", 300),
        })
    except (ValueError, KeyError):
        return _api_error("AUTH_REQUIRED", "Reponse Keycloak invalide", 502)


@router.post("/api/auth/token/refresh")
async def auth_refresh(request: Request):
    body = await _read_json(request)
    refresh_token = str(body.get("refresh_token", ""))
    if not refresh_token:
        return _api_error("AUTH_REQUIRED", "Refresh token requis", 401)

    token_url = f"{config.KEYCLOAK_URL}/realms/{config.KEYCLOAK_REALM}/protocol/openid-connect/token"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                token_url,
                data={
                    "grant_type": "refresh_token",
                    "client_id": config.KEYCLOAK_CLIENT_ID,
                    "refresh_token": refresh_token,
                },
                timeout=10.0,
            )
        except (httpx.ConnectError, httpx.TimeoutException):
            return _api_error("AUTH_REQUIRED", "Keycloak indisponible", 503)

    if response.status_code != 200:
        return _api_error("AUTH_REQUIRED", "Refresh token invalide", 401)

    try:
        tokens = response.json()
        return _api_response({
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token", refresh_token),
            "expires_in": tokens.get("expires_in", 300),
        })
    except (ValueError, KeyError):
        return _api_error("AUTH_REQUIRED", "Reponse Keycloak invalide", 502)


@router.post("/api/auth/logout")
async def auth_logout(request: Request):
    body = await _read_json(request)
    refresh_token = str(body.get("refresh_token", ""))
    if refresh_token:
        logout_url = f"{config.KEYCLOAK_URL}/realms/{config.KEYCLOAK_REALM}/protocol/openid-connect/logout"
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    logout_url,
                    data={
                        "client_id": config.KEYCLOAK_CLIENT_ID,
                        "refresh_token": refresh_token,
                    },
                    timeout=10.0,
                )
            except (httpx.ConnectError, httpx.TimeoutException):
                pass

    return _api_response({"message": "Deconnecte"})
