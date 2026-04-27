"""Validation JWT Keycloak pour Ernie Studio."""

import logging
import time

import httpx
from fastapi import HTTPException, Request

import config

try:
    from jose import JWTError, jwt
except ImportError:  # pragma: no cover - dependance verifiee au runtime
    JWTError = Exception
    jwt = None


logger = logging.getLogger("ernie")

_jwks_cache = {"keys": None, "expires": 0.0}


def _auth_error(message: str = "Token manquant ou invalide") -> HTTPException:
    return HTTPException(
        status_code=401,
        detail={"code": "AUTH_REQUIRED", "message": message},
    )


async def get_jwks() -> dict:
    now = time.time()
    if _jwks_cache["keys"] is not None and now < _jwks_cache["expires"]:
        return _jwks_cache["keys"]

    jwks_url = f"{config.KEYCLOAK_URL}/realms/{config.KEYCLOAK_REALM}/protocol/openid-connect/certs"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url, timeout=10.0)
            response.raise_for_status()
            jwks = response.json()
    except (httpx.ConnectError, httpx.TimeoutException) as exc:
        logger.error("Erreur recuperation JWKS : %s", exc)
        if _jwks_cache["keys"]:
            return _jwks_cache["keys"]
        raise HTTPException(status_code=503, detail="Keycloak indisponible") from None
    except Exception as exc:
        logger.error("Erreur inattendue JWKS : %s", exc, exc_info=True)
        if _jwks_cache["keys"]:
            return _jwks_cache["keys"]
        raise HTTPException(status_code=503, detail="Keycloak indisponible") from None

    if not isinstance(jwks, dict) or "keys" not in jwks:
        raise HTTPException(status_code=503, detail="Reponse Keycloak invalide")

    _jwks_cache["keys"] = jwks
    _jwks_cache["expires"] = now + 3600
    return jwks


async def validate_token(token: str) -> dict:
    if jwt is None:
        raise HTTPException(status_code=503, detail="Dependance python-jose manquante")

    jwks = await get_jwks()
    try:
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=config.KEYCLOAK_CLIENT_ID,
            issuer=f"{config.KEYCLOAK_URL}/realms/{config.KEYCLOAK_REALM}",
            options={"verify_exp": True},
        )
    except JWTError as exc:
        logger.warning("JWT invalide : %s", exc)
        raise _auth_error("Token invalide ou expire") from None

    return {
        "user_id": payload["sub"],
        "username": payload.get("preferred_username", ""),
    }


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise _auth_error()
    return await validate_token(auth_header[7:])


async def get_current_user_hybrid(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return await validate_token(auth_header[7:])

    token = request.query_params.get("token", "")
    if token:
        return await validate_token(token)

    raise _auth_error()
