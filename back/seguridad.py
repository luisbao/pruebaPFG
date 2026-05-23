"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Módulo de seguridad del backend. Incluye el hash de
  contraseñas, la creación y validación de JWT y las
  dependencias para autenticar usuarios en FastAPI.
-----------------------------------------------------------
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .base_datos import get_db
from .modelos import Usuario

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    if os.getenv("ENTORNO", "desarrollo").lower() in {"produccion", "production"}:
        raise RuntimeError("SECRET_KEY debe estar configurada en producción")
    SECRET_KEY = "stylematch-desarrollo-local"

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 días

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, contrasena_hash: str) -> bool:
    return pwd_context.verify(plain_password, contrasena_hash)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    contenido_token = data.copy()
    expiracion = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    contenido_token.update({"exp": expiracion})
    return jwt.encode(contenido_token, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Resuelve el usuario autenticado a partir del JWT enviado en la cabecera."""
    error_credenciales = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        identificador_usuario: str | None = payload.get("sub")
        if identificador_usuario is None:
            raise error_credenciales
        user_id = int(identificador_usuario)
    except (JWTError, ValueError):
        raise error_credenciales

    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if usuario is None or not usuario.activo:
        raise error_credenciales
    return usuario
